"use client";

import { useSyncExternalStore } from "react";
import { supabase } from "./supabase";
import { buildSeed } from "./calendar-seed";
import { CAL_YEAR } from "./calendar-types";
import type { CalLogEntry, CalPost } from "./calendar-types";

// Dos modos, igual que el pipeline:
// - con Supabase: los datos viven en la base, se sincronizan en tiempo real y queda historial
// - sin claves: los datos viven en este navegador (localStorage), sin historial
export const calIsRemote = supabase !== null;

const STORAGE_KEY = "crm-aruma:calendar:v1";
const LOG_LIMIT = 150;

type Row = {
  id: string;
  brand: CalPost["brand"];
  channel: CalPost["channel"];
  month: number;
  day: number;
  format: string | null;
  status: number;
  text: string | null;
};
type LogRow = {
  id: number;
  at: string;
  user_name: string | null;
  action: CalLogEntry["action"];
  brand: CalPost["brand"];
  channel: CalPost["channel"];
  month: number;
  day: number;
  text: string | null;
  changes: CalLogEntry["changes"] | null;
};

const fromRow = (r: Row): CalPost => ({
  id: r.id,
  brand: r.brand,
  channel: r.channel,
  month: r.month,
  day: r.day,
  format: (r.format ?? "") as CalPost["format"],
  status: r.status as CalPost["status"],
  text: r.text ?? "",
});
const toRow = (p: CalPost) => ({
  id: p.id,
  brand: p.brand,
  channel: p.channel,
  year: CAL_YEAR,
  month: p.month,
  day: p.day,
  format: p.format || null,
  status: p.status,
  text: p.text,
});
const logFromRow = (r: LogRow): CalLogEntry => ({
  id: String(r.id),
  at: r.at,
  userName: r.user_name || "Alguien del equipo",
  action: r.action,
  brand: r.brand,
  channel: r.channel,
  month: r.month,
  day: r.day,
  text: r.text ?? "",
  changes: r.changes ?? {},
});

let posts: CalPost[] | null = null;
let log: CalLogEntry[] = [];
let syncError: string | null = null;
const listeners = new Set<() => void>();
const emit = () => listeners.forEach((l) => l());

// Posts con texto en edición: no se pisan con lo que llega de otros hasta guardar
const pendingText = new Map<string, ReturnType<typeof setTimeout>>();

function readLocal(): CalPost[] {
  try {
    const raw = localStorage.getItem(STORAGE_KEY);
    if (raw) {
      const parsed = JSON.parse(raw);
      if (Array.isArray(parsed)) return parsed as CalPost[];
    }
  } catch {
    // localStorage bloqueado o dato corrupto: se arranca con el contenido inicial
  }
  return buildSeed();
}

function setPosts(next: CalPost[]) {
  posts = next;
  if (!calIsRemote) {
    try {
      localStorage.setItem(STORAGE_KEY, JSON.stringify(next));
    } catch {
      // sin persistencia, el calendario sigue funcionando en memoria
    }
  }
  emit();
}

function fail(e: unknown) {
  syncError = e instanceof Error ? e.message : "No se pudo guardar";
  emit();
}

function run(op: PromiseLike<{ error: { message: string } | null }>) {
  op.then(({ error }) => {
    if (error) fail(error);
    else if (syncError) {
      syncError = null;
      emit();
    }
  }, fail);
}

// ---- carga y tiempo real (modo remoto) ----

let started = false;
let channel: ReturnType<NonNullable<typeof supabase>["channel"]> | null = null;

function upsertLocal(p: CalPost) {
  if (!posts) return;
  if (pendingText.has(p.id)) {
    // el que escribe conserva su texto hasta que se guarde
    const mine = posts.find((x) => x.id === p.id);
    if (mine) p = { ...p, text: mine.text };
  }
  const i = posts.findIndex((x) => x.id === p.id);
  posts = i < 0 ? [...posts, p] : posts.map((x) => (x.id === p.id ? p : x));
  emit();
}

async function loadRemote() {
  if (!supabase) return;
  const [p, l] = await Promise.all([
    supabase
      .from("cal_posts")
      .select("id, brand, channel, month, day, format, status, text")
      .eq("year", CAL_YEAR)
      .order("created_at")
      .limit(5000),
    supabase
      .from("cal_log")
      .select("id, at, user_name, action, brand, channel, month, day, text, changes")
      .order("at", { ascending: false })
      .limit(LOG_LIMIT),
  ]);
  if (p.error) return fail(p.error);
  posts = (p.data as Row[]).map(fromRow);
  log = l.error ? [] : (l.data as LogRow[]).map(logFromRow);
  emit();
}

function startRemote() {
  if (started || !supabase) return;
  started = true;
  loadRemote().catch(fail);
  channel = supabase
    .channel("calendar")
    .on("postgres_changes", { event: "*", schema: "public", table: "cal_posts" }, (payload) => {
      if (payload.eventType === "DELETE") {
        const id = (payload.old as { id?: string }).id;
        if (id && posts) {
          posts = posts.filter((x) => x.id !== id);
          emit();
        }
      } else {
        upsertLocal(fromRow(payload.new as Row));
      }
    })
    .on("postgres_changes", { event: "INSERT", schema: "public", table: "cal_log" }, (payload) => {
      log = [logFromRow(payload.new as LogRow), ...log].slice(0, LOG_LIMIT);
      emit();
    })
    // al reconectar se puede haber perdido algo: se vuelve a cargar todo
    .subscribe((status) => {
      if (status === "SUBSCRIBED" && posts) loadRemote().catch(fail);
    });
}

export function resetCalendar() {
  if (channel && supabase) supabase.removeChannel(channel);
  channel = null;
  started = false;
  posts = null;
  log = [];
  syncError = null;
  emit();
}

// ---- lectura ----

function subscribe(listener: () => void) {
  listeners.add(listener);
  if (calIsRemote) startRemote();
  const onStorage = (e: StorageEvent) => {
    if (!calIsRemote && e.key === STORAGE_KEY) {
      posts = readLocal();
      listener();
    }
  };
  window.addEventListener("storage", onStorage);
  return () => {
    listeners.delete(listener);
    window.removeEventListener("storage", onStorage);
  };
}

function getPosts(): CalPost[] | null {
  if (posts === null && !calIsRemote) posts = readLocal();
  return posts;
}

export const useCalPosts = () => useSyncExternalStore(subscribe, getPosts, () => null);
export const useCalLog = () => useSyncExternalStore(subscribe, () => log, () => log);
export const useCalError = () => useSyncExternalStore(subscribe, () => syncError, () => null);

// ---- escritura (optimista: se ve al instante, se guarda en segundo plano) ----

export function addPost(base: Pick<CalPost, "brand" | "channel" | "month" | "day">): string {
  const post: CalPost = { ...base, id: crypto.randomUUID(), format: "", status: 0, text: "" };
  setPosts([...(posts ?? []), post]);
  if (supabase) run(supabase.from("cal_posts").insert(toRow(post)));
  return post.id;
}

export function patchPost(id: string, patch: Partial<Pick<CalPost, "format" | "status" | "text" | "day">>) {
  if (!posts) return;
  setPosts(posts.map((p) => (p.id === id ? { ...p, ...patch } : p)));
  if (!supabase) return;
  const send = () => {
    pendingText.delete(id);
    run(supabase!.from("cal_posts").update({ ...patch, ...(patch.format !== undefined ? { format: patch.format || null } : {}) }).eq("id", id));
  };
  if (patch.text === undefined || Object.keys(patch).length > 1) return send();
  // texto: se guarda cuando se deja de tipear, así el historial no se llena de letras sueltas
  clearTimeout(pendingText.get(id));
  pendingText.set(id, setTimeout(() => {
    const current = posts?.find((p) => p.id === id);
    pendingText.delete(id);
    if (current) run(supabase!.from("cal_posts").update({ text: current.text }).eq("id", id));
  }, 900));
}

export function removePost(id: string): CalPost | undefined {
  const item = posts?.find((p) => p.id === id);
  if (!item || !posts) return undefined;
  clearTimeout(pendingText.get(id));
  pendingText.delete(id);
  setPosts(posts.filter((p) => p.id !== id));
  if (supabase) run(supabase.from("cal_posts").delete().eq("id", id));
  return item;
}

// Deshacer: se vuelve a crear con el mismo id
export function restorePost(item: CalPost) {
  if (!posts || posts.some((p) => p.id === item.id)) return;
  setPosts([...posts, item]);
  if (supabase) run(supabase.from("cal_posts").insert(toRow(item)));
}

// Al cerrar o cambiar de pestaña, lo que se está tipeando se guarda ya
export function flushPending() {
  if (!supabase) return;
  pendingText.forEach((timer, id) => {
    clearTimeout(timer);
    const current = posts?.find((p) => p.id === id);
    if (current) run(supabase!.from("cal_posts").update({ text: current.text }).eq("id", id));
  });
  pendingText.clear();
}
