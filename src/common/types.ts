/*
originPhaseLinks: [
  {
    "destPhaseId": 1775590,
    "maintainMatchup": true,
    "isDefault": false,
    "type": 1
    "destSeedOrder": 0,
    "destBracketSide": 1,
    "id": 16167654,
    "originPlacement": 3,
    "originPhaseId": 1598103,
    "originLosses": 0
  },
  {
    "destPhaseId": 2334556,
    "maintainMatchup": false,
    "isDefault": false,
    "type":1,
    "destSeedOrder": 0,
    "destBracketSide": 1,
    "cId": "2334556-1",
    "originPlacement":5,
    "originPhaseId":1598103,
    "originLosses":1|null
  },
]
*/

type BaseOriginPhaseLink = {
  destPhaseId: number;
  maintainMatchup: boolean;
  isDefault: boolean;
  // 1 placement 2 remainder 3 direct
  type: number;
  destSeedOrder: number;
  destBracketSide: number;
  originPlacement: number;
  originPhaseId: number;
  originLosses: number | null;
};

export type NewOriginPhaseLink = BaseOriginPhaseLink & {
  cId: string;
};

export type ExistingOriginPhaseLink = BaseOriginPhaseLink & {
  id: number;
};

export type RendererOriginPhaseLink = ExistingOriginPhaseLink & {
  destPhaseName: string;
  destBracketSideDesc: string;
};

export type RendererPhase = {
  id: number;
  name: string;
  originPhaseLinks: RendererOriginPhaseLink[];
};

export type SelectableEvent = {
  id: number;
  name: string;
  phaseIds: number[];
};

export type RendererEvent = SelectableEvent & {
  phases: RendererPhase[];
};

export type SelectableTournament = {
  name: string;
  slug: string;
};

export type RendererTournament = SelectableTournament & {
  events: SelectableEvent[];
};
