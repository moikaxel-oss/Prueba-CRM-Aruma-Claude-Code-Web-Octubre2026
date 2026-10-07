"use client";

import { useEffect, useState } from "react";
import { X } from "lucide-react";
import { boardActions } from "@/lib/board-store";
import type { Column, Lead, LeadInput } from "@/lib/types";

export type DialogTarget =
  | { mode: "edit"; lead: Lead }
  | { mode: "new"; columnId: string };

type Props = {
  target: DialogTarget;
  columns: Column[];
  campaigns: string[];
  onClose: () => void;
};

function initialForm(target: DialogTarget): LeadInput {
  if (target.mode === "edit") {
    const { columnId, name, phone, campaign, adset, ad, value, notes } =
      target.lead;
    return { columnId, name, phone, campaign, adset, ad, value, notes };
  }
  return {
    columnId: target.columnId,
    name: "",
    phone: "",
    campaign: "",
    adset: "",
    ad: "",
    value: 0,
    notes: "",
  };
}

export function LeadDialog({ target, columns, campaigns, onClose }: Props) {
  const [form, setForm] = useState<LeadInput>(() => initialForm(target));

  useEffect(() => {
    const onKey = (e: KeyboardEvent) => e.key === "Escape" && onClose();
    window.addEventListener("keydown", onKey);
    return () => window.removeEventListener("keydown", onKey);
  }, [onClose]);

  const set = <K extends keyof LeadInput>(key: K, value: LeadInput[K]) =>
    setForm((f) => ({ ...f, [key]: value }));

  const save = (e: React.FormEvent) => {
    e.preventDefault();
    const clean = { ...form, name: form.name.trim(), campaign: form.campaign.trim() };
    if (!clean.name) return;
    if (target.mode === "edit") boardActions.updateLead(target.lead.id, clean);
    else boardActions.addLead(clean);
    onClose();
  };

  const remove = () => {
    if (target.mode !== "edit") return;
    if (window.confirm(`¿Borrar a ${target.lead.name}?`)) {
      boardActions.deleteLead(target.lead.id);
      onClose();
    }
  };

  return (
    <div
      className="fixed inset-0 z-50 flex items-center justify-center bg-black/60 p-4 backdrop-blur-sm"
      onMouseDown={(e) => e.target === e.currentTarget && onClose()}
    >
      <form
        onSubmit={save}
        className="glass thin-scroll max-h-full w-full max-w-lg overflow-y-auto !bg-[#0b1020]/95 p-6"
      >
        <div className="mb-5 flex items-center justify-between">
          <h2 className="text-lg font-semibold">
            {target.mode === "edit" ? "Editar lead" : "Nuevo lead"}
          </h2>
          <button type="button" onClick={onClose} aria-label="Cerrar" className="text-muted hover:text-ink">
            <X size={20} />
          </button>
        </div>

        <div className="grid grid-cols-2 gap-3">
          <label className="col-span-2 text-xs text-muted">
            Nombre
            <input autoFocus required className="field mt-1" value={form.name} onChange={(e) => set("name", e.target.value)} />
          </label>
          <label className="text-xs text-muted">
            Teléfono
            <input className="field mt-1" value={form.phone} onChange={(e) => set("phone", e.target.value)} />
          </label>
          <label className="text-xs text-muted">
            Columna
            <select className="field mt-1" value={form.columnId} onChange={(e) => set("columnId", e.target.value)}>
              {columns.map((c) => (
                <option key={c.id} value={c.id}>{c.name}</option>
              ))}
            </select>
          </label>
          <label className="col-span-2 text-xs text-muted">
            Campaña de Meta
            <input list="campaigns" className="field mt-1" value={form.campaign} onChange={(e) => set("campaign", e.target.value)} />
            <datalist id="campaigns">
              {campaigns.map((c) => (
                <option key={c} value={c} />
              ))}
            </datalist>
          </label>
          <label className="text-xs text-muted">
            Conjunto de anuncios
            <input className="field mt-1" value={form.adset} onChange={(e) => set("adset", e.target.value)} />
          </label>
          <label className="text-xs text-muted">
            Anuncio
            <input className="field mt-1" value={form.ad} onChange={(e) => set("ad", e.target.value)} />
          </label>
          <label className="col-span-2 text-xs text-muted">
            Valor de la venta (ARS)
            <input
              type="number"
              min={0}
              className="field mt-1"
              value={form.value}
              onChange={(e) => set("value", Math.max(0, Number(e.target.value) || 0))}
            />
          </label>
          <label className="col-span-2 text-xs text-muted">
            Notas
            <textarea rows={3} className="field mt-1 resize-none" value={form.notes} onChange={(e) => set("notes", e.target.value)} />
          </label>
        </div>

        <div className="mt-6 flex items-center justify-between">
          {target.mode === "edit" ? (
            <button type="button" onClick={remove} className="text-sm text-red-300 hover:text-red-200">
              Borrar lead
            </button>
          ) : (
            <span />
          )}
          <div className="flex gap-2">
            <button type="button" onClick={onClose} className="rounded-xl border border-line px-4 py-2 text-sm text-muted hover:text-ink">
              Cancelar
            </button>
            <button type="submit" className="glow-btn rounded-xl px-5 py-2 text-sm font-medium">
              Guardar
            </button>
          </div>
        </div>
      </form>
    </div>
  );
}
