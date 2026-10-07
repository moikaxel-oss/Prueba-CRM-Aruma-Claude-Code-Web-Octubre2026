import type { BoardState, Column, Lead } from "./types";

const hoursAgo = (h: number) =>
  new Date(Date.now() - h * 3_600_000).toISOString();

// Datos de ejemplo, no son clientes reales.
export function buildSeed(): BoardState {
  const columns: Omit<Column, "position">[] = [
    { id: "c1", name: "Nuevo", color: "#4f8cff" },
    { id: "c2", name: "Cotizado", color: "#8b5cf6" },
    { id: "c3", name: "En seguimiento", color: "#f0803c" },
    { id: "c4", name: "Cerrado ganado", color: "#22c7a9" },
  ];
  const leads: Omit<Lead, "position">[] = [
    { id: "l1", columnId: "c1", name: "Lucía Fernández", phone: "+54 9 11 5550 0101", campaign: "Mora - Prospecting", adset: "Mujeres 28-45", ad: "Video testimonio", value: 0, notes: "", createdAt: hoursAgo(1) },
    { id: "l2", columnId: "c1", name: "Martín Gómez", phone: "+54 9 11 5550 0102", campaign: "Fortaleza - Remarketing", adset: "Visitó web 30d", ad: "Carrusel garantía", value: 0, notes: "", createdAt: hoursAgo(3) },
    { id: "l3", columnId: "c2", name: "Carolina Ruiz", phone: "+54 9 351 555 0103", campaign: "Mora - Prospecting", adset: "Mujeres 28-45", ad: "Imagen precio", value: 420000, notes: "Pidió cotización queen", createdAt: hoursAgo(20) },
    { id: "l4", columnId: "c2", name: "Diego Herrera", phone: "+54 9 11 5550 0104", campaign: "Cuna - Lookalike", adset: "LAL compradores 1%", ad: "Video unboxing", value: 185000, notes: "", createdAt: hoursAgo(26) },
    { id: "l5", columnId: "c3", name: "Sofía Medina", phone: "+54 9 341 555 0105", campaign: "Fortaleza - Remarketing", adset: "Visitó web 30d", ad: "Carrusel garantía", value: 560000, notes: "Lo piensa hasta el viernes", createdAt: hoursAgo(52) },
    { id: "l6", columnId: "c4", name: "Pablo Ledesma", phone: "+54 9 11 5550 0106", campaign: "Mora - Prospecting", adset: "Hombres 30-50", ad: "Video testimonio", value: 390000, notes: "Pagó con transferencia", createdAt: hoursAgo(90) },
  ];
  return {
    columns: columns.map((c, i) => ({ ...c, position: (i + 1) * 1000 })),
    leads: leads.map((l, i) => ({ ...l, position: (i + 1) * 1000 })),
  };
}

export const EMPTY_BOARD: BoardState = {
  columns: [{ id: "c1", name: "Nueva columna", color: "#4f8cff", position: 1000 }],
  leads: [],
};
