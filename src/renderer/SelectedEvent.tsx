import {
  Button,
  Card,
  CardActions,
  CardContent,
  Stack,
  Table,
  TableBody,
  TableCell,
  TableRow,
  Typography,
} from '@mui/material';
import styled from '@emotion/styled';
import { useMemo, useState } from 'react';
import { RendererEvent, RendererPhase } from '../common/types';
import SelectedPhase from './SelectedPhase';
import getBracketTypeDesc from './getBracketTypeDesc';
import getOriginPhaseLinkTypeDesc from './getOriginPhaseLinkTypeDesc';
import getDestBracketSideDesc from './getDestBracketSideDesc';

const Cell = styled(TableCell)`
  padding: 4px;
`;

export default function SelectedEvent({
  event,
  refresh,
  openError,
}: {
  event: RendererEvent;
  refresh: () => Promise<void>;
  openError: (message: string) => void;
}) {
  const [selectedPhase, setSelectedPhase] = useState<RendererPhase | null>(
    null,
  );

  const phaseIdToName = useMemo(
    () => new Map(event.phases.map((phase) => [phase.id, phase.name])),
    [event.phases],
  );
  const phaseIdToBracketType = useMemo(
    () => new Map(event.phases.map((phase) => [phase.id, phase.bracketType])),
    [event.phases],
  );

  return (
    <Stack
      direction="row"
      style={{
        alignItems: 'start',
        flexWrap: 'wrap',
        gap: '8px',
        paddingTop: '8px',
        paddingLeft: '8px',
        paddingRight: '8px',
      }}
    >
      {event.phases.map((phase) => (
        <Card key={phase.id}>
          <CardContent>
            <Typography variant="h5">{phase.name}</Typography>
            <Typography variant="caption">
              {getBracketTypeDesc(phase.bracketType)} x{phase.groupCount}
            </Typography>
            {phase.originPhaseLinks.length > 0 && (
              <Table size="small">
                <TableBody>
                  {phase.originPhaseLinks.map((originPhaseLink) => (
                    <TableRow key={originPhaseLink.id}>
                      <Cell>
                        {getOriginPhaseLinkTypeDesc(
                          originPhaseLink,
                          phase.bracketType,
                        )}
                      </Cell>
                      <Cell>
                        {phaseIdToName.get(originPhaseLink.destPhaseId)}
                        {getDestBracketSideDesc(
                          originPhaseLink.destBracketSide,
                          phaseIdToBracketType.get(originPhaseLink.destPhaseId),
                        )}
                      </Cell>
                    </TableRow>
                  ))}
                </TableBody>
              </Table>
            )}
          </CardContent>
          <CardActions>
            <Button
              onClick={() => {
                setSelectedPhase(phase);
              }}
            >
              Edit
            </Button>
          </CardActions>
        </Card>
      ))}
      <SelectedPhase
        phase={selectedPhase}
        setPhase={setSelectedPhase}
        phaseIdToName={phaseIdToName}
        phaseIdToBracketType={phaseIdToBracketType}
        refreshEvent={refresh}
        openError={openError}
      />
    </Stack>
  );
}
