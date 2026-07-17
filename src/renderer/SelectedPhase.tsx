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
import withOrdinalSuffix from './withOrdinalSuffix';

function arrayRange(start: number, stop: number) {
  if (start < stop) {
    return [];
  }

  return Array.from(
    { length: stop - start + 1 },
    (value, index) => start + index,
  );
}

const seNumProgressingValues = [0, 1, 2, 4, 8, 16, 32];
const deNumProgressingValues = [0, 1, 2, 3, 4, 6, 8, 12, 16, 24, 32];
const otherProgressingValues = arrayRange(0, 16);
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

function getNextPlacement(phase: RendererPhase) {
  const placementMax = Math.max(
    ...phase.originPhaseLinks.map(
      (originPhaseLink) => originPhaseLink.originPlacement,
    ),
  );
  if (phase.numProgressing > placementMax) {
    return phase.numProgressing + 1;
  }

  if (phase.bracketType === 1) {
    const allPlacements = Array.from(singleElimPlacementToTopN.keys());
    const index = allPlacements.indexOf(placementMax);
    if (index === -1 || index >= allPlacements.length - 1) {
      return 0;
    }
    return allPlacements[index + 1];
  }
  if (phase.bracketType === 2) {
    const allPlacements = Array.from(losersPlacementToTopN.keys());
    const index = allPlacements.indexOf(placementMax);
    if (index === -1 || index >= allPlacements.length - 1) {
      return 0;
    }
    return allPlacements[index + 1];
  }
  if (
    phase.bracketType === 3 ||
    phase.bracketType === 4 ||
    phase.bracketType === 6 ||
    phase.bracketType === 7
  ) {
    return placementMax + 1;
  }
  return 0;
}

function getPlacements(start: number, bracketType: number) {
  if (bracketType === 1) {
    const allPlacements = Array.from(singleElimPlacementToTopN.keys());
    const index = allPlacements.indexOf(start);
    if (index === -1) {
      return [];
    }
    return allPlacements.slice(index);
  }
  if (bracketType === 2) {
    const allPlacements = Array.from(losersPlacementToTopN.keys());
    const index = allPlacements.indexOf(start);
    if (index === -1) {
      return [];
    }
    return allPlacements.slice(index);
  }
  if (
    bracketType === 3 ||
    bracketType === 4 ||
    bracketType === 6 ||
    bracketType === 7
  ) {
    return arrayRange(start, 16);
  }
  return [];
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

  const nextPlacement = useMemo(() => {
    if (!phase) {
      return 0;
    }

    return getNextPlacement(phase);
  }, [phase]);
  const placementMenuItems = useMemo(() => {
    if (
      phase === null ||
      phase.numProgressing === 0 ||
      phase.originPhaseLinks.some(
        (originPhaseLink) => originPhaseLink.type === 2,
      )
    ) {
      return [];
    }

    const placements = getPlacements(
      getNextPlacement(phase),
      phase.bracketType,
    );
    return [
      <MenuItem value="remainder" key="remainder">
        Remainder
      </MenuItem>,
    ].concat(
      placements.map((placement) => (
        <MenuItem value={placement} key={placement}>
          {withOrdinalSuffix(placement)}
        </MenuItem>
      )),
    );
  }, [phase]);

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
                  flexDirection: 'row',
                  gap: '8px',
                  paddingTop: '12px',
                }}
                onSubmit={(ev) => {
                  ev.preventDefault();
                  ev.stopPropagation();

                  const target = ev.target as typeof ev.target & {
                    numProgressing: { value: string };
                    winnersTargetPhaseId: { value: string };
                  };
                  const numProgressing = Number.parseInt(
                    target.numProgressing.value,
                    10,
                  );
                  const winnersTargetPhaseId = Number.parseInt(
                    target.winnersTargetPhaseId.value,
                    10,
                  );
                  if (winnersTargetPhaseId === 0) {
                    return;
                  }

                  putNumProgressing(
                    phase.id,
                    phase.bracketType,
                    numProgressing,
                    winnersTargetPhaseId,
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
                    style={{ width: '165px' }}
                  >
                    {numProgressingMenuItems}
                  </Select>
                </FormControl>
                <FormControl>
                  <InputLabel id="num-progressing-destination-phase-input-label">
                    Destination Phase
                  </InputLabel>
                  <Select
                    disabled={fetching}
                    defaultValue={phase.winnersTargetPhaseId ?? 0}
                    label="Destination Phase"
                    labelId="num-progressing-destination-phase-input-label"
                    name="winnersTargetPhaseId"
                    size="small"
                    style={{ width: '165px' }}
                  >
                    {destinationPhaseMenuItems}
                  </Select>
                </FormControl>
                <Button
                  type="submit"
                  variant="contained"
                  style={{ width: '70px' }}
                >
                  Save
                </Button>
              </form>
            )}
          {phase.numProgressing > 0 &&
            phase.originPhaseLinks.length > 0 &&
            placementMenuItems.length > 0 && (
              <form
                style={{
                  alignSelf: 'end',
                  display: 'flex',
                  flexDirection: 'row',
                  gap: '8px',
                  paddingTop: '12px',
                }}
                onSubmit={(ev) => {
                  ev.preventDefault();
                  ev.stopPropagation();

                  const target = ev.target as typeof ev.target & {
                    placement: { value: string };
                    destPhaseId: { value: string };
                  };
                  const destPhaseId = Number.parseInt(
                    target.destPhaseId.value,
                    10,
                  );
                  if (destPhaseId === 0) {
                    return;
                  }

                  let originLosses = null;
                  if (phase.bracketType === 1) {
                    originLosses = 1;
                  } else if (phase.bracketType === 2) {
                    originLosses = 2;
                  }
                  const newOriginPhaseLinks = structuredClone(
                    phase.originPhaseLinks,
                  ) as (NewOriginPhaseLink | RendererOriginPhaseLink)[];
                  const placementValue = target.placement.value;
                  if (placementValue === 'remainder') {
                    const newOriginPhaseLink: NewOriginPhaseLink = {
                      cId: `${phase.id}-99`,
                      destPhaseId,
                      type: 2,
                      originPlacement: nextPlacement,
                      originPhaseId: phase.id,
                      originLosses,
                      maintainMatchup: false,
                      isDefault: false,
                      destSeedOrder: 99,
                      destBracketSide: 1,
                    };
                    newOriginPhaseLinks.push(newOriginPhaseLink);
                  } else {
                    const originPlacement = Number.parseInt(placementValue, 10);
                    const newOriginPhaseLink: NewOriginPhaseLink = {
                      cId: `${phase.id}-99`,
                      destPhaseId,
                      type: 1,
                      originPlacement,
                      originPhaseId: phase.id,
                      originLosses,
                      maintainMatchup: false,
                      isDefault: false,
                      destSeedOrder: 99,
                      destBracketSide: 1,
                    };
                    newOriginPhaseLinks.push(newOriginPhaseLink);
                  }
                  putOriginPhaseLinks(phase.id, newOriginPhaseLinks);
                }}
              >
                <FormControl>
                  <InputLabel id="placement-input-label">Placement</InputLabel>
                  <Select
                    disabled={fetching}
                    defaultValue={nextPlacement}
                    label="Placement"
                    labelId="placement-input-label"
                    name="placement"
                    size="small"
                    style={{ width: '165px' }}
                  >
                    {placementMenuItems}
                  </Select>
                </FormControl>
                <FormControl>
                  <InputLabel id="losers-progression-destination-phase-input-label">
                    Destination Phase
                  </InputLabel>
                  <Select
                    disabled={fetching}
                    defaultValue={phase.winnersTargetPhaseId ?? 0}
                    label="Destination Phase"
                    labelId="losers-progression-destination-phase-input-label"
                    name="destPhaseId"
                    size="small"
                    style={{ width: '165px' }}
                  >
                    {destinationPhaseMenuItems}
                  </Select>
                </FormControl>
                <Button
                  type="submit"
                  variant="contained"
                  style={{ width: '70px' }}
                >
                  Add
                </Button>
              </form>
            )}
        </DialogContent>
      )}
    </Dialog>
  );
}
