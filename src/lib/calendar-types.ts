export type CalBrand = "aruma" | "softline";
export type CalChannel = "org" | "ads";
export type CalFormat = "" | "R" | "C" | "H";
export type CalStatus = 0 | 1 | 2;

export type CalPost = {
  id: string;
  brand: CalBrand;
  channel: CalChannel;
  month: number;
  day: number;
  format: CalFormat;
  status: CalStatus;
  text: string;
};

export type CalLogEntry = {
  id: string;
  at: string;
  userName: string;
  action: "insert" | "update" | "delete";
  brand: CalBrand;
  channel: CalChannel;
  month: number;
  day: number;
  text: string;
  // campo -> [antes, después] (solo en "update")
  changes: Record<string, [unknown, unknown]>;
};

export const CAL_YEAR = 2026;
export const MONTH_NAMES: Record<number, string> = {
  6: "Junio", 7: "Julio", 8: "Agosto", 9: "Septiembre", 10: "Octubre", 11: "Noviembre", 12: "Diciembre",
};
export const MONTH_SHORT: Record<number, string> = {
  6: "Jun", 7: "Jul", 8: "Ago", 9: "Sep", 10: "Oct", 11: "Nov", 12: "Dic",
};
export const MONTHS = [6, 7, 8, 9, 10, 11, 12];
export const STATUS_NAMES = ["Por hacer", "Diseñado", "Programado"] as const;
export const FORMAT_NAMES: Record<string, string> = { "": "Sin formato", R: "Reel", C: "Carrusel", H: "Historia" };
export const BRAND_NAMES: Record<CalBrand, string> = { aruma: "Aruma", softline: "Soft Line" };
export const CHANNEL_NAMES: Record<CalChannel, string> = { org: "orgánico", ads: "Meta Ads" };
