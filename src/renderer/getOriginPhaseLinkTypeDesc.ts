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
