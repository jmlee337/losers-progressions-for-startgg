import {
  losersPlacementToTopN,
  singleElimPlacementToTopN,
} from '../common/constants';
import { RendererOriginPhaseLink } from '../common/types';

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

export default function getOriginPhaseLinkTypeDesc(
  originPhaseLink: RendererOriginPhaseLink,
  bracketType: number,
) {
  if (originPhaseLink.type === 1) {
    if (bracketType === 1) {
      if (originPhaseLink.originLosses === 0) {
        if (originPhaseLink.originPlacement === 1) {
          return `First`;
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
