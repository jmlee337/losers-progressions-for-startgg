export type RendererEvent = {
  id: number;
  name: string;
  phaseIds: number[];
};

export type RendererTournament = {
  name: string;
  slug: string;
  events: RendererEvent[];
};
