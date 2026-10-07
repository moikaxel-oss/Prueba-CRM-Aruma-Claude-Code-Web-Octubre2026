export type Column = {
  id: string;
  name: string;
  color: string;
  position: number;
};

export type Lead = {
  id: string;
  columnId: string;
  name: string;
  phone: string;
  campaign: string;
  adset: string;
  ad: string;
  value: number;
  notes: string;
  createdAt: string;
  position: number;
};

export type BoardState = {
  columns: Column[];
  leads: Lead[];
};

export type LeadInput = Omit<Lead, "id" | "createdAt" | "position">;

export const COLUMN_COLORS = [
  "#4f8cff",
  "#8b5cf6",
  "#22c7a9",
  "#f0803c",
  "#f5c542",
  "#ef5b7a",
  "#38bdf8",
  "#94a3b8",
] as const;
