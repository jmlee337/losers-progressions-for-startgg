import {
  Dialog,
  DialogContent,
  List,
  ListItem,
  ListItemText,
  MenuItem,
  Select,
  Typography,
} from '@mui/material';
import { JSX, useMemo, useState } from 'react';
import { RendererPhase } from '../common/types';
import getBracketTypeDesc from './getBracketTypeDesc';
import getOriginPhaseLinkTypeDesc from './getOriginPhaseLinkTypeDesc';
import getDestBracketSideDesc from './getDestBracketSideDesc';

export default function SelectedPhase({
  phase,
  setPhase,
  phaseIdToName,
  phaseIdToBracketType,
}: {
  phase: RendererPhase | null;
  setPhase: (phase: RendererPhase | null) => void;
  phaseIdToName: Map<number, string>;
  phaseIdToBracketType: Map<number, number>;
}) {
  const [fetching, setFetching] = useState(false);

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
        setPhase(null);
      }}
    >
      {phase && (
        <DialogContent>
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
                    onChange={async (event) => {
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
                      console.log(newOriginPhaseLinks);
                    }}
                  >
                    {menuItems}
                  </Select>
                </ListItem>
              ))}
            </List>
          )}
        </DialogContent>
      )}
    </Dialog>
  );
}
