"use client";

import { useSyncExternalStore } from "react";
import { arrayMove } from "@dnd-kit/sortable";
import { COLUMN_COLORS } from "./types";
import type { BoardState, Column, LeadInput } from "./types";
import { buildSeed, EMPTY_BOARD } from "./seed";

// Por ahora los datos viven en este navegador (localStorage).
// Más adelante este archivo es el único que cambia para hablar con Supabase.
const STORAGE_KEY = "crm-aruma:board:v1";

let current: BoardState | null = null;
const listeners = new Set<() => void>();

const uid = () => crypto.randomUUID();

function read(): BoardState {
  try {
    const raw = localStorage.getItem(STORAGE_KEY);
    if (raw) {
      const parsed = JSON.parse(raw) as BoardState;
      if (Array.isArray(parsed.columns) && Array.isArray(parsed.leads)) {
        return parsed;
      }
    }
  } catch {
    // localStorage bloqueado o dato corrupto: se arranca con el ejemplo
  }
  return buildSeed();
}

function write(next: BoardState) {
  current = next;
  try {
    localStorage.setItem(STORAGE_KEY, JSON.stringify(next));
  } catch {
    // sin persistencia, el tablero sigue funcionando en memoria
  }
  listeners.forEach((l) => l());
}

function update(fn: (s: BoardState) => BoardState) {
  const base = current ?? read();
  const next = fn(base);
  if (next !== base) write(next);
}

function subscribe(listener: () => void) {
  listeners.add(listener);
  const onStorage = (e: StorageEvent) => {
    if (e.key === STORAGE_KEY) {
      current = read();
      listener();
    }
  };
  window.addEventListener("storage", onStorage);
  return () => {
    listeners.delete(listener);
    window.removeEventListener("storage", onStorage);
  };
}

function getSnapshot(): BoardState {
  if (current === null) current = read();
  return current;
}

// null en el servidor: el tablero se dibuja recién en el navegador
const getServerSnapshot = (): BoardState | null => null;

export function useBoard(): BoardState | null {
  return useSyncExternalStore(subscribe, getSnapshot, getServerSnapshot);
}

export const boardActions = {
  addColumn(name: string) {
    update((s) => {
      const color = COLUMN_COLORS[s.columns.length % COLUMN_COLORS.length];
      return {
        ...s,
        columns: [...s.columns, { id: uid(), name: name.trim(), color }],
      };
    });
  },

  updateColumn(id: string, patch: Partial<Pick<Column, "name" | "color">>) {
    update((s) => ({
      ...s,
      columns: s.columns.map((c) => (c.id === id ? { ...c, ...patch } : c)),
    }));
  },

  // Las tarjetas de la columna borrada pasan a otra columna para no perder leads
  deleteColumn(id: string, moveToId: string) {
    update((s) => ({
      columns: s.columns.filter((c) => c.id !== id),
      leads: s.leads.map((l) =>
        l.columnId === id ? { ...l, columnId: moveToId } : l,
      ),
    }));
  },

  reorderColumns(activeId: string, overId: string) {
    update((s) => {
      const from = s.columns.findIndex((c) => c.id === activeId);
      const to = s.columns.findIndex((c) => c.id === overId);
      if (from < 0 || to < 0 || from === to) return s;
      return { ...s, columns: arrayMove(s.columns, from, to) };
    });
  },

  addLead(input: LeadInput) {
    update((s) => ({
      ...s,
      leads: [
        ...s.leads,
        { ...input, id: uid(), createdAt: new Date().toISOString() },
      ],
    }));
  },

  updateLead(id: string, patch: Partial<LeadInput>) {
    update((s) => ({
      ...s,
      leads: s.leads.map((l) => (l.id === id ? { ...l, ...patch } : l)),
    }));
  },

  deleteLead(id: string) {
    update((s) => ({ ...s, leads: s.leads.filter((l) => l.id !== id) }));
  },

  // Mientras se arrastra: pasa la tarjeta a otra columna
  moveLeadAcross(leadId: string, targetId: string, targetIsColumn: boolean) {
    update((s) => {
      const from = s.leads.findIndex((l) => l.id === leadId);
      if (from < 0) return s;
      const lead = s.leads[from];

      if (targetIsColumn) {
        if (lead.columnId === targetId) return s;
        const leads = s.leads.filter((l) => l.id !== leadId);
        leads.push({ ...lead, columnId: targetId });
        return { ...s, leads };
      }

      const to = s.leads.findIndex((l) => l.id === targetId);
      if (to < 0) return s;
      const target = s.leads[to];
      if (target.columnId === lead.columnId) return s;
      const leads = [...s.leads];
      leads[from] = { ...lead, columnId: target.columnId };
      return { ...s, leads: arrayMove(leads, from, to) };
    });
  },

  // Al soltar: orden final dentro de la misma columna
  reorderLeads(activeId: string, overId: string) {
    update((s) => {
      const from = s.leads.findIndex((l) => l.id === activeId);
      const to = s.leads.findIndex((l) => l.id === overId);
      if (from < 0 || to < 0 || from === to) return s;
      if (s.leads[from].columnId !== s.leads[to].columnId) return s;
      return { ...s, leads: arrayMove(s.leads, from, to) };
    });
  },

  loadDemo() {
    write(buildSeed());
  },

  clearAll() {
    write({ columns: [...EMPTY_BOARD.columns], leads: [] });
  },
};

