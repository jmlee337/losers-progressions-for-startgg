import { Card, CardContent, Stack, Typography } from '@mui/material';
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

function getOriginPhaseLinkTypeDesc(originPhaseLink: RendererOriginPhaseLink) {
  if (originPhaseLink.type === 1) {
    return withOrdinalSuffix(originPhaseLink.originPlacement);
  }
  if (originPhaseLink.type === 2) {
    return 'Remainder';
  }
  return 'UNKNOWN';
}

function OriginPhaseLink({
  originPhaseLink,
}: {
  originPhaseLink: RendererOriginPhaseLink;
}) {
  return (
    <Typography variant="body2">
      {getOriginPhaseLinkTypeDesc(originPhaseLink)} to{' '}
      {originPhaseLink.destPhaseName}
      {originPhaseLink.destBracketSideDesc.length > 0 &&
        ` (${originPhaseLink.destBracketSideDesc})`}
    </Typography>
  );
}

export default function SelectedEvent({ event }: { event: RendererEvent }) {
  return (
    <Stack direction="row" style={{ flexWrap: 'wrap', gap: '8px' }}>
      {event.phases.map((phase) => (
        <Card key={phase.id}>
          <CardContent>
            <Typography variant="h5">{phase.name}</Typography>
            {phase.originPhaseLinks.map((originPhaseLink) => (
              <OriginPhaseLink
                key={originPhaseLink.id}
                originPhaseLink={originPhaseLink}
              />
            ))}
          </CardContent>
        </Card>
      ))}
    </Stack>
  );
}
