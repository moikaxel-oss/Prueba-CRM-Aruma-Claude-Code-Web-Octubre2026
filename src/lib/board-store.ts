"use client";

import { useSyncExternalStore } from "react";
import { arrayMove } from "@dnd-kit/sortable";
import { COLUMN_COLORS } from "./types";
import type { BoardState, Column, Lead, LeadInput } from "./types";
import { buildSeed, EMPTY_BOARD } from "./seed";
import { supabase } from "./supabase";
import * as remote from "./remote";

// Dos modos:
// - con las claves de Supabase cargadas ("remoto"): los datos viven en la base
// - sin claves ("local"): los datos viven en este navegador (localStorage)
export const isRemote = supabase !== null;

const STORAGE_KEY = "crm-aruma:board:v1";
const STEP = 1000;

let current: BoardState | null = null;
let syncError: string | null = null;
const listeners = new Set<() => void>();

const uid = () => crypto.randomUUID();
const emit = () => listeners.forEach((l) => l());

function readLocal(): BoardState {
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
  if (!isRemote) {
    try {
      localStorage.setItem(STORAGE_KEY, JSON.stringify(next));
    } catch {
      // sin persistencia, el tablero sigue funcionando en memoria
    }
  }
  emit();
}

function subscribe(listener: () => void) {
  listeners.add(listener);
  const onStorage = (e: StorageEvent) => {
    if (!isRemote && e.key === STORAGE_KEY) {
      current = readLocal();
      listener();
    }
  };
  window.addEventListener("storage", onStorage);
  return () => {
    listeners.delete(listener);
    window.removeEventListener("storage", onStorage);
  };
}

function getSnapshot(): BoardState | null {
  if (current === null && !isRemote) current = readLocal();
  return current;
}

// null en el servidor: el tablero se dibuja recién en el navegador
const getServerSnapshot = (): BoardState | null => null;

export function useBoard(): BoardState | null {
  return useSyncExternalStore(subscribe, getSnapshot, getServerSnapshot);
}

export function useSyncError(): string | null {
  return useSyncExternalStore(subscribe, () => syncError, () => null);
}

export function dismissSyncError() {
  syncError = null;
  emit();
}

export async function loadRemote() {
  if (!isRemote) return;
  try {
    current = await remote.loadAll();
  } catch (err) {
    syncError = `No se pudieron cargar los datos: ${message(err)}`;
  }
  emit();
}

export function resetRemote() {
  if (!isRemote) return;
  current = null;
  emit();
}

const message = (err: unknown) => (err instanceof Error ? err.message : String(err));

// Guarda en la base sin frenar la pantalla. Si falla, avisa y vuelve a cargar
// lo que realmente quedó guardado.
function sync(task: () => Promise<unknown>) {
  if (!isRemote) return;
  task().catch((err) => {
    syncError = `No se pudo guardar el cambio: ${message(err)}`;
    emit();
    void loadRemote();
  });
}

// Posición entre vecinos, para guardar el orden sin reescribir toda la columna
function positionAt(items: { id: string; position: number }[], id: string) {
  const i = items.findIndex((x) => x.id === id);
  const prev = items[i - 1]?.position;
  const next = items[i + 1]?.position;
  if (prev === undefined && next === undefined) return items[i].position;
  if (prev === undefined) return next! - STEP;
  if (next === undefined) return prev + STEP;
  return (prev + next) / 2;
}

const endPosition = (items: { position: number }[]) =>
  items.reduce((max, x) => Math.max(max, x.position), 0) + STEP;

export const boardActions = {
  addColumn(name: string) {
    const s = getSnapshot();
    if (!s) return;
    const column: Column = {
      id: uid(),
      name: name.trim(),
      color: COLUMN_COLORS[s.columns.length % COLUMN_COLORS.length],
      position: endPosition(s.columns),
    };
    write({ ...s, columns: [...s.columns, column] });
    sync(() => remote.insertColumn(column));
  },

  updateColumn(id: string, patch: Partial<Pick<Column, "name" | "color">>) {
    const s = getSnapshot();
    if (!s) return;
    write({
      ...s,
      columns: s.columns.map((c) => (c.id === id ? { ...c, ...patch } : c)),
    });
    sync(() => remote.patchColumn(id, patch));
  },

  // Las tarjetas de la columna borrada pasan a otra columna para no perder leads
  deleteColumn(id: string, moveToId: string) {
    const s = getSnapshot();
    if (!s) return;
    const moved = s.leads.filter((l) => l.columnId === id);
    const end = endPosition(s.leads.filter((l) => l.columnId === moveToId));
    write({
      columns: s.columns.filter((c) => c.id !== id),
      leads: s.leads.map((l) => {
        if (l.columnId !== id) return l;
        return { ...l, columnId: moveToId, position: end + moved.indexOf(l) * STEP };
      }),
    });
    sync(() => remote.removeColumn(id, moveToId));
  },

  reorderColumns(activeId: string, overId: string) {
    const s = getSnapshot();
    if (!s) return;
    const from = s.columns.findIndex((c) => c.id === activeId);
    const to = s.columns.findIndex((c) => c.id === overId);
    if (from < 0 || to < 0 || from === to) return;
    const moved = arrayMove(s.columns, from, to);
    const position = positionAt(moved, activeId);
    write({
      ...s,
      columns: moved.map((c) => (c.id === activeId ? { ...c, position } : c)),
    });
    sync(() => remote.patchColumn(activeId, { position }));
  },

  addLead(input: LeadInput) {
    const s = getSnapshot();
    if (!s) return;
    const lead: Lead = {
      ...input,
      id: uid(),
      createdAt: new Date().toISOString(),
      position: endPosition(s.leads.filter((l) => l.columnId === input.columnId)),
    };
    write({ ...s, leads: [...s.leads, lead] });
    sync(() => remote.insertLead(lead));
  },

  updateLead(id: string, patch: Partial<LeadInput>) {
    const s = getSnapshot();
    if (!s) return;
    const lead = s.leads.find((l) => l.id === id);
    if (!lead) return;

    const changedColumn =
      patch.columnId !== undefined && patch.columnId !== lead.columnId;
    const position = changedColumn
      ? endPosition(s.leads.filter((l) => l.columnId === patch.columnId))
      : lead.position;

    write({
      ...s,
      leads: s.leads.map((l) => (l.id === id ? { ...l, ...patch, position } : l)),
    });
    sync(async () => {
      await remote.patchLead(id, patch);
      if (changedColumn) await remote.moveLead(id, patch.columnId!, position);
    });
  },

  deleteLead(id: string) {
    const s = getSnapshot();
    if (!s) return;
    write({ ...s, leads: s.leads.filter((l) => l.id !== id) });
    sync(() => remote.removeLead(id));
  },

  // Mientras se arrastra: pasa la tarjeta a otra columna (solo en pantalla)
  moveLeadAcross(leadId: string, targetId: string, targetIsColumn: boolean) {
    const s = getSnapshot();
    if (!s) return;
    const from = s.leads.findIndex((l) => l.id === leadId);
    if (from < 0) return;
    const lead = s.leads[from];

    if (targetIsColumn) {
      if (lead.columnId === targetId) return;
      const leads = s.leads.filter((l) => l.id !== leadId);
      leads.push({ ...lead, columnId: targetId });
      write({ ...s, leads });
      return;
    }

    const to = s.leads.findIndex((l) => l.id === targetId);
    if (to < 0) return;
    const target = s.leads[to];
    if (target.columnId === lead.columnId) return;
    const leads = [...s.leads];
    leads[from] = { ...lead, columnId: target.columnId };
    write({ ...s, leads: arrayMove(leads, from, to) });
  },

  // Al soltar: orden final dentro de la misma columna
  reorderLeads(activeId: string, overId: string) {
    const s = getSnapshot();
    if (!s) return;
    const from = s.leads.findIndex((l) => l.id === activeId);
    const to = s.leads.findIndex((l) => l.id === overId);
    if (from < 0 || to < 0 || from === to) return;
    if (s.leads[from].columnId !== s.leads[to].columnId) return;
    write({ ...s, leads: arrayMove(s.leads, from, to) });
  },

  // Al terminar el arrastre: guarda columna y lugar finales de la tarjeta
  persistLead(leadId: string) {
    const s = getSnapshot();
    if (!s) return;
    const lead = s.leads.find((l) => l.id === leadId);
    if (!lead) return;
    const column = s.leads.filter((l) => l.columnId === lead.columnId);
    const position = positionAt(column, leadId);
    write({
      ...s,
      leads: s.leads.map((l) => (l.id === leadId ? { ...l, position } : l)),
    });
    sync(() => remote.moveLead(leadId, lead.columnId, position));
  },

  loadDemo() {
    if (!isRemote) write(buildSeed());
  },

  clearAll() {
    if (!isRemote) write({ columns: [...EMPTY_BOARD.columns], leads: [] });
  },
};
