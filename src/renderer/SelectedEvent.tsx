import {
  Card,
  CardContent,
  Stack,
  Table,
  TableBody,
  TableCell,
  TableRow,
  Typography,
} from '@mui/material';
import styled from '@emotion/styled';
import { RendererEvent, RendererOriginPhaseLink } from '../common/types';

// https://stackoverflow.com/a/13627586
function withOrdinalSuffix(i: number) {
  const j = i % 10;
  const k = i % 100;
  if (j === 1 && k !== 11) {
    return `${i}st`;
  }
  if (j === 2 && k !== 12) {
    return `${i}nd`;
  }
  if (j === 3 && k !== 13) {
    return `${i}rd`;
  }
  return `${i}th`;
}

const singleElimPlacementToTopN = new Map([
  [3, 4],
  [5, 8],
  [9, 16],
  [17, 32],
  // not possible via web
  [33, 64],
  [65, 128],
  [129, 256],
  [257, 512],
  [512, 1024],
]);

const losersPlacementToTopN = new Map([
  [5, 6],
  [7, 8],
  [9, 12],
  [13, 16],
  [17, 24],
  [25, 32],
  // not possible via web
  [33, 48],
  [49, 64],
  [65, 96],
  [97, 128],
  [129, 192],
  [193, 256],
  [257, 384],
  [385, 512],
  [513, 768],
  [769, 1024],
]);

function getOriginPhaseLinkTypeDesc(
  originPhaseLink: RendererOriginPhaseLink,
  bracketType: number,
) {
  if (originPhaseLink.type === 1) {
    if (bracketType === 1) {
      if (originPhaseLink.originLosses === 0) {
        if (originPhaseLink.originPlacement === 1) {
          return `First`;
        }
        if (originPhaseLink.originPlacement < 3) {
          return `Top ${originPhaseLink.originPlacement}`;
        }
        const topN = singleElimPlacementToTopN.get(
          originPhaseLink.originPlacement,
        );
        if (topN === undefined) {
          throw new Error(
            `Unexpected: ${withOrdinalSuffix(originPhaseLink.originPlacement)} place`,
          );
        }
        return `Top ${topN}`;
      }
      return withOrdinalSuffix(originPhaseLink.originPlacement);
    }
    if (bracketType === 2) {
      if (originPhaseLink.originLosses === 0) {
        if (originPhaseLink.originPlacement <= 2) {
          return `1st (Winners)`;
        }
        return `Top ${originPhaseLink.originPlacement - 1} (Winners)`;
      }
      if (originPhaseLink.originLosses === 1) {
        if (originPhaseLink.originPlacement === 2) {
          return '2nd (Losers)';
        }
        if (originPhaseLink.originPlacement < 5) {
          return `Top ${originPhaseLink.originPlacement} (Losers)`;
        }
        const topN = losersPlacementToTopN.get(originPhaseLink.originPlacement);
        if (topN === undefined) {
          throw new Error(
            `Unexpected: ${withOrdinalSuffix(originPhaseLink.originPlacement)} place`,
          );
        }
        return `Top ${topN} (Losers)`;
      }
      return withOrdinalSuffix(originPhaseLink.originPlacement);
    }
    return withOrdinalSuffix(originPhaseLink.originPlacement);
  }
  if (originPhaseLink.type === 2) {
    return 'Remainder';
  }
  return 'UNKNOWN';
}

const Cell = styled(TableCell)`
  padding: 4px;
`;

function OriginPhaseLink({
  originPhaseLink,
  bracketType,
}: {
  originPhaseLink: RendererOriginPhaseLink;
  bracketType: number;
}) {
  return (
    <TableRow>
      <Cell>{getOriginPhaseLinkTypeDesc(originPhaseLink, bracketType)}</Cell>
      <Cell>
        {originPhaseLink.destPhaseName}
        {originPhaseLink.destBracketSideDesc.length > 0 &&
          ` (${originPhaseLink.destBracketSideDesc})`}
      </Cell>
    </TableRow>
  );
}

function getBracketTypeDesc(bracketType: number) {
  switch (bracketType) {
    case 1:
      return 'Single Elimination';
    case 2:
      return 'Double Elimination';
    case 3:
      return 'Round Robin';
    case 4:
      return 'Swiss';
    case 5:
      // idk
      return 'Exhibition';
    case 6:
      return 'Custom Schedule';
    case 7:
      return 'Matchmaking Ladder';
    case 8:
      return 'Elimination Rounds';
    case 9:
      // idk
      return 'Race';
    case 10:
      // idk
      return 'Circuit';
    default:
      return 'UNKNOWN';
  }
}

export default function SelectedEvent({ event }: { event: RendererEvent }) {
  return (
    <Stack
      direction="row"
      style={{ alignItems: 'start', flexWrap: 'wrap', gap: '8px' }}
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
                    <OriginPhaseLink
                      key={originPhaseLink.id}
                      originPhaseLink={originPhaseLink}
                      bracketType={phase.bracketType}
                    />
                  ))}
                </TableBody>
              </Table>
            )}
          </CardContent>
        </Card>
      ))}
    </Stack>
  );
}
