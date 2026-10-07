"use client";

import { useState } from "react";
import { usernameToEmail } from "@/lib/login";
import { supabase } from "@/lib/supabase";

export function LoginForm() {
  const [username, setUsername] = useState("");
  const [password, setPassword] = useState("");
  const [error, setError] = useState<string | null>(null);
  const [busy, setBusy] = useState(false);

  const submit = async (e: React.FormEvent) => {
    e.preventDefault();
    if (!supabase) return;
    setBusy(true);
    setError(null);
    const { error: err } = await supabase.auth.signInWithPassword({
      email: usernameToEmail(username),
      password,
    });
    setBusy(false);
    if (err) {
      setError(
        err.message === "Invalid login credentials"
          ? "Usuario o contraseña incorrectos."
          : err.message,
      );
    }
  };

  return (
    <div className="flex h-screen items-center justify-center p-4">
      <form onSubmit={submit} className="glass w-full max-w-sm p-8">
        <div className="glow-btn mb-5 flex h-11 w-11 items-center justify-center rounded-xl font-bold">
          A
        </div>
        <h1 className="text-xl font-semibold">CRM Aruma</h1>
        <p className="mb-6 text-sm text-muted">Ingresá con tu usuario del equipo.</p>

        <label className="text-xs text-muted">
          Usuario
          <input
            type="text"
            required
            autoFocus
            autoCapitalize="none"
            autoCorrect="off"
            spellCheck={false}
            autoComplete="username"
            className="field mt-1"
            value={username}
            onChange={(e) => setUsername(e.target.value)}
          />
        </label>
        <label className="mt-3 block text-xs text-muted">
          Contraseña
          <input
            type="password"
            required
            autoComplete="current-password"
            className="field mt-1"
            value={password}
            onChange={(e) => setPassword(e.target.value)}
          />
        </label>

        {error && <p role="alert" className="mt-3 text-sm text-red-300">{error}</p>}

        <button
          type="submit"
          disabled={busy}
          className="glow-btn mt-6 w-full rounded-xl py-2.5 text-sm font-medium disabled:opacity-60"
        >
          {busy ? "Ingresando..." : "Ingresar"}
        </button>
      </form>
    </div>
  );
}
