import {
  Button,
  Dialog,
  DialogContent,
  Divider,
  FormControl,
  IconButton,
  InputLabel,
  List,
  ListItem,
  ListItemText,
  MenuItem,
  Select,
  Typography,
} from '@mui/material';
import { JSX, useCallback, useMemo, useState } from 'react';
import { DeleteForever } from '@mui/icons-material';
import {
  NewOriginPhaseLink,
  RendererOriginPhaseLink,
  RendererPhase,
} from '../common/types';
import getBracketTypeDesc from './getBracketTypeDesc';
import getOriginPhaseLinkTypeDesc from './getOriginPhaseLinkTypeDesc';
import getDestBracketSideDesc from './getDestBracketSideDesc';
import {
  losersPlacementToTopN,
  singleElimPlacementToTopN,
} from '../common/constants';

const seNumProgressingValues = [0, 1, 2, 4, 8, 16, 32];
const deNumProgressingValues = [0, 1, 2, 3, 4, 6, 8, 12, 16, 24, 32];
const otherProgressingValues = [
  0, 1, 2, 3, 4, 5, 6, 7, 8, 9, 10, 11, 12, 13, 14, 15, 16,
];
function bracketTypeToProgressingValues(bracketType: number) {
  switch (bracketType) {
    case 1:
      return seNumProgressingValues;
    case 2:
      return deNumProgressingValues;
    case 3:
    case 4:
    case 6:
    case 7:
      return otherProgressingValues;
    // elimination rounds don't support progressions
    // exhibition, race, circuit idk
    default:
      return [];
  }
}
function bracketTypeToMenuItems(bracketType: number) {
  return bracketTypeToProgressingValues(bracketType).map((n) => (
    <MenuItem value={n} key={n}>
      {n}
    </MenuItem>
  ));
}

export default function SelectedPhase({
  phase,
  setPhase,
  phaseIdToName,
  phaseIdToBracketType,
  refreshEvent,
  openError,
}: {
  phase: RendererPhase | null;
  setPhase: (phase: RendererPhase | null) => void;
  phaseIdToName: Map<number, string>;
  phaseIdToBracketType: Map<number, number>;
  refreshEvent: () => Promise<void>;
  openError: (message: string) => void;
}) {
  const [fetching, setFetching] = useState(false);

  const putNumProgressing = useCallback(
    async (
      phaseId: number,
      groupTypeId: number,
      numProgressing: number,
      winnersTargetPhaseId: number,
    ) => {
      try {
        setFetching(true);
        setPhase(
          await window.electron.putNumProgressing(
            phaseId,
            groupTypeId,
            numProgressing,
            winnersTargetPhaseId,
          ),
        );
      } catch (e: unknown) {
        if (e instanceof Error) {
          openError(e.message);
        }
      } finally {
        setFetching(false);
      }
    },
    [openError, setPhase],
  );

  const putOriginPhaseLinks = useCallback(
    async (
      phaseId: number,
      newOriginPhaseLinks: (NewOriginPhaseLink | RendererOriginPhaseLink)[],
    ) => {
      try {
        setFetching(true);
        setPhase(
          await window.electron.putOriginPhaseLinks(
            phaseId,
            newOriginPhaseLinks,
          ),
        );
      } catch (e: unknown) {
        if (e instanceof Error) {
          openError(e.message);
        }
      } finally {
        setFetching(false);
      }
    },
    [openError, setPhase],
  );

  const originPhaseLinkMenuItems = useMemo(() => {
    const arr: JSX.Element[] = [];
    if (phase === null) {
      return arr;
    }

    Array.from(phaseIdToBracketType.entries()).forEach(
      ([phaseId, bracketType]) => {
        if (phase.id === phaseId) {
          return;
        }

        if (bracketType === 2) {
          arr.push(
            <MenuItem value={`${phaseId}-1`} key={`${phaseId}-1`}>
              {phaseIdToName.get(phaseId)}
              {getDestBracketSideDesc(1, bracketType)}
            </MenuItem>,
          );
          arr.push(
            <MenuItem value={`${phaseId}-2`} key={`${phaseId}-2`}>
              {phaseIdToName.get(phaseId)}
              {getDestBracketSideDesc(2, bracketType)}
            </MenuItem>,
          );
        } else {
          arr.push(
            <MenuItem value={`${phaseId}-1`} key={`${phaseId}-1`}>
              {phaseIdToName.get(phaseId)}
              {getDestBracketSideDesc(1, bracketType)}
            </MenuItem>,
          );
        }
      },
    );
    return arr;
  }, [phase, phaseIdToName, phaseIdToBracketType]);

  const showNumProgressing = useMemo(() => {
    if (!phase) {
      return false;
    }
    if (phase.numProgressing === 0) {
      return true;
    }
    if (phase.originPhaseLinks.length === 0) {
      return true;
    }

    // se
    if (phase.bracketType === 1) {
      if (phase.originPhaseLinks.length !== 1) {
        return false;
      }

      const [originPhaseLink] = phase.originPhaseLinks;
      if (originPhaseLink.originLosses !== 0) {
        return false;
      }
      const topN = singleElimPlacementToTopN.get(
        originPhaseLink.originPlacement,
      );
      if (topN === undefined || topN !== phase.numProgressing) {
        return false;
      }
      return true;
    }

    // de
    if (phase.bracketType === 2) {
      if (phase.originPhaseLinks.length === 1) {
        const [originPhaseLink] = phase.originPhaseLinks;
        return (
          originPhaseLink.originLosses === 0 &&
          originPhaseLink.originPlacement === 1
        );
      }
      if (phase.originPhaseLinks.length !== 2) {
        return false;
      }

      const originPhaseLinksWithZeroOriginLosses =
        phase.originPhaseLinks.filter(
          (originPhaseLink) => originPhaseLink.originLosses === 0,
        );
      if (originPhaseLinksWithZeroOriginLosses.length !== 1) {
        return false;
      }
      const [winnersOriginPhaseLink] = originPhaseLinksWithZeroOriginLosses;

      const originPhaseLinksWithOneOriginLoss = phase.originPhaseLinks.filter(
        (originPhaseLink) => originPhaseLink.originLosses === 1,
      );
      if (originPhaseLinksWithOneOriginLoss.length !== 1) {
        return false;
      }
      const [losersOriginPhaseLink] = originPhaseLinksWithOneOriginLoss;

      if (
        winnersOriginPhaseLink.destPhaseId !== losersOriginPhaseLink.destPhaseId
      ) {
        return false;
      }

      // is there also a way to check winnersTopN?
      const losersTopN = losersPlacementToTopN.get(
        losersOriginPhaseLink.originPlacement,
      );
      if (losersTopN === undefined || losersTopN !== phase.numProgressing) {
        return false;
      }
      return true;
    }

    // rr, swiss, custom, ladder
    if (
      phase.bracketType === 3 ||
      phase.bracketType === 4 ||
      phase.bracketType === 6 ||
      phase.bracketType === 7
    ) {
      if (phase.originPhaseLinks.length !== phase.numProgressing) {
        return false;
      }
      if (phase.originPhaseLinks[0].originPlacement !== 1) {
        return false;
      }

      const { destPhaseId } = phase.originPhaseLinks[0];
      for (let i = 1; i < phase.originPhaseLinks.length; i += 1) {
        const originPhaseLink = phase.originPhaseLinks[i];
        const originPlacement = i + 1;
        if (originPhaseLink.originPlacement !== originPlacement) {
          return false;
        }
        if (originPhaseLink.destPhaseId !== destPhaseId) {
          return false;
        }
      }
      return true;
    }

    // elimination rounds don't support progressions
    // exhibition, race, circuit idk
    return false;
  }, [phase]);

  const numProgressingMenuItems = useMemo(() => {
    if (phase === null) {
      return [];
    }

    return bracketTypeToMenuItems(phase.bracketType);
  }, [phase]);

  const destinationPhaseMenuItems = useMemo(() => {
    if (phase === null) {
      return [];
    }

    return Array.from(phaseIdToName.entries())
      .filter(([phaseId]) => phaseId !== phase.id)
      .map(([phaseId, name]) => (
        <MenuItem value={phaseId} key={phaseId}>
          {name}
        </MenuItem>
      ));
  }, [phase, phaseIdToName]);

  return (
    <Dialog
      open={phase !== null}
      onClose={() => {
        refreshEvent();
        setPhase(null);
      }}
    >
      {phase && (
        <DialogContent
          style={{
            display: 'flex',
            flexDirection: 'column',
            paddingRight: '16px',
          }}
        >
          <Typography variant="h5">{phase.name}</Typography>
          <Typography variant="caption">
            {getBracketTypeDesc(phase.bracketType)} x{phase.groupCount}
          </Typography>
          {phase.originPhaseLinks.length > 0 && (
            <List>
              {phase.originPhaseLinks.map((originPhaseLink) => (
                <ListItem key={originPhaseLink.id} disableGutters>
                  <ListItemText>
                    {getOriginPhaseLinkTypeDesc(
                      originPhaseLink,
                      phase.bracketType,
                    )}
                  </ListItemText>
                  <Select
                    disabled={fetching}
                    size="small"
                    style={{ marginLeft: '8px' }}
                    value={`${originPhaseLink.destPhaseId}-${originPhaseLink.destBracketSide}`}
                    onChange={(event) => {
                      const [destPhaseId, destBracketSide] =
                        event.target.value.split('-');
                      const newOriginPhaseLinks = structuredClone(
                        phase.originPhaseLinks,
                      );
                      // eslint-disable-next-line no-restricted-syntax
                      for (const newOriginPhaseLink of newOriginPhaseLinks) {
                        if (newOriginPhaseLink.id === originPhaseLink.id) {
                          newOriginPhaseLink.destPhaseId = Number.parseInt(
                            destPhaseId,
                            10,
                          );
                          newOriginPhaseLink.destBracketSide = Number.parseInt(
                            destBracketSide,
                            10,
                          );
                        }
                      }
                      putOriginPhaseLinks(phase.id, newOriginPhaseLinks);
                    }}
                  >
                    {originPhaseLinkMenuItems}
                  </Select>
                  <IconButton
                    disabled={fetching || showNumProgressing}
                    onClick={() => {
                      const newOriginPhaseLinks = structuredClone(
                        phase.originPhaseLinks,
                      ).filter(
                        (newOriginPhaseLink) =>
                          newOriginPhaseLink.id !== originPhaseLink.id,
                      );
                      if (newOriginPhaseLinks.length === 0) {
                        putNumProgressing(
                          phase.id,
                          phase.bracketType,
                          /* numProgressing= */ 0,
                          /* winnersTargetPhaseId= */ 0,
                        );
                      } else {
                        putOriginPhaseLinks(phase.id, newOriginPhaseLinks);
                      }
                    }}
                  >
                    <DeleteForever />
                  </IconButton>
                </ListItem>
              ))}
            </List>
          )}
          {phase.originPhaseLinks.length > 0 &&
            showNumProgressing &&
            numProgressingMenuItems.length > 0 &&
            destinationPhaseMenuItems.length > 0 && (
              <Divider style={{ marginBottom: '8px' }} />
            )}
          {showNumProgressing &&
            numProgressingMenuItems.length > 0 &&
            destinationPhaseMenuItems.length > 0 && (
              <form
                style={{
                  alignSelf: 'end',
                  display: 'flex',
                  flexDirection: 'column',
                  gap: '8px',
                  paddingTop: '12px',
                  width: '200px',
                }}
                onSubmit={(ev) => {
                  ev.preventDefault();
                  ev.stopPropagation();

                  const target = ev.target as typeof ev.target & {
                    numProgressing: { value: number };
                    winnersTargetPhaseId: { value: number };
                  };
                  putNumProgressing(
                    phase.id,
                    phase.bracketType,
                    target.numProgressing.value,
                    target.winnersTargetPhaseId.value,
                  );
                }}
              >
                <FormControl>
                  <InputLabel id="num-progressing-input-label">
                    Number Progressing/Pool
                  </InputLabel>
                  <Select
                    disabled={fetching}
                    defaultValue={
                      phase.originPhaseLinks.length === 0
                        ? 0
                        : phase.numProgressing
                    }
                    label="Number Progressing/Pool"
                    labelId="num-progressing-input-label"
                    name="numProgressing"
                    size="small"
                  >
                    {numProgressingMenuItems}
                  </Select>
                </FormControl>
                <FormControl>
                  <InputLabel id="destination-phase-input-label">
                    Destination Phase
                  </InputLabel>
                  <Select
                    disabled={fetching}
                    defaultValue={phase.winnersTargetPhaseId ?? 0}
                    label="Destination Phase"
                    labelId="destination-phase-input-label"
                    name="winnersTargetPhaseId"
                    size="small"
                  >
                    {destinationPhaseMenuItems}
                  </Select>
                </FormControl>
                <Button type="submit" variant="contained">
                  Save
                </Button>
              </form>
            )}
        </DialogContent>
      )}
    </Dialog>
  );
}
