"use client";

import { LoginForm } from "./LoginForm";
import { useSession } from "@/lib/session";
import { supabase } from "@/lib/supabase";

// Sin Supabase configurado (modo local) no pide login
export function AuthGate({ children }: { children: React.ReactNode }) {
  const session = useSession();

  if (!supabase) return <>{children}</>;
  if (session === undefined) {
    return <div className="glass m-4 h-[calc(100vh-2rem)] animate-pulse" aria-busy="true" />;
  }
  if (!session) return <LoginForm />;
  return <>{children}</>;
}
