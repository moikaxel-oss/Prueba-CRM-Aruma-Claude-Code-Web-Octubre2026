"use client";

import { LogOut } from "lucide-react";
import { resetRemote } from "@/lib/board-store";
import { supabase } from "@/lib/supabase";

export function SignOutButton() {
  if (!supabase) return null;
  return (
    <button
      type="button"
      title="Cerrar sesión"
      aria-label="Cerrar sesión"
      onClick={async () => {
        resetRemote();
        await supabase?.auth.signOut();
      }}
      className="mt-auto flex h-11 w-11 items-center justify-center rounded-xl text-muted hover:text-ink"
    >
      <LogOut size={20} />
    </button>
  );
}
