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

export type RendererOriginPhaseLink = BaseOriginPhaseLink & {
  id: number;
};

export type RendererPhase = {
  id: number;
  name: string;
  bracketType: number;
  groupCount: number;
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
