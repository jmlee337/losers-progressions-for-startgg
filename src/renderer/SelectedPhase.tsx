import {
  Dialog,
  DialogContent,
  IconButton,
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
    async (phaseId: number, numProgressing: number) => {
      try {
        setFetching(true);
        setPhase(
          await window.electron.putNumProgressing(phaseId, numProgressing),
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

  const menuItems = useMemo(() => {
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

  return (
    <Dialog
      open={phase !== null}
      onClose={() => {
        refreshEvent();
        setPhase(null);
      }}
    >
      {phase && (
        <DialogContent style={{ paddingRight: '16px' }}>
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
                    {menuItems}
                  </Select>
                  <IconButton
                    disabled={fetching}
                    onClick={() => {
                      const newOriginPhaseLinks = structuredClone(
                        phase.originPhaseLinks,
                      ).filter(
                        (newOriginPhaseLink) =>
                          newOriginPhaseLink.id !== originPhaseLink.id,
                      );
                      if (newOriginPhaseLinks.length === 0) {
                        putNumProgressing(phase.id, 0);
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
        </DialogContent>
      )}
    </Dialog>
  );
}
