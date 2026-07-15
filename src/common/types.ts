export type RendererPhase = {
  id: number;
  name: string;
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
