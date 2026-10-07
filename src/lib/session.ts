"use client";

import { useSyncExternalStore } from "react";
import type { Session } from "@supabase/supabase-js";
import { supabase } from "./supabase";

// undefined = todavía no sabemos si hay sesión
let session: Session | null | undefined;
let started = false;
const listeners = new Set<() => void>();

const emit = () => listeners.forEach((l) => l());

function start() {
  if (started || !supabase) return;
  started = true;
  supabase.auth.getSession().then(({ data }) => {
    session = data.session;
    emit();
  });
  supabase.auth.onAuthStateChange((_event, next) => {
    session = next;
    emit();
  });
}

function subscribe(listener: () => void) {
  start();
  listeners.add(listener);
  return () => {
    listeners.delete(listener);
  };
}

export function useSession() {
  return useSyncExternalStore(
    subscribe,
    () => session,
    () => undefined,
  );
}
