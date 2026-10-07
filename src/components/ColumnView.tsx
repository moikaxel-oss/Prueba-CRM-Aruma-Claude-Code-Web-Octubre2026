"use client";

import { useEffect, useRef, useState } from "react";
import { SortableContext, useSortable, verticalListSortingStrategy } from "@dnd-kit/sortable";
import { CSS } from "@dnd-kit/utilities";
import { GripVertical, MoreHorizontal, Plus, Trash2 } from "lucide-react";
import { boardActions } from "@/lib/board-store";
import { formatMoney } from "@/lib/format";
import { COLUMN_COLORS } from "@/lib/types";
import type { Column, Lead } from "@/lib/types";
import { LeadCard } from "./LeadCard";

type Props = {
  column: Column;
  leads: Lead[];
  otherColumns: Column[];
  onOpenLead: (lead: Lead) => void;
  onAddLead: (columnId: string) => void;
};

export function ColumnView({
  column,
  leads,
  otherColumns,
  onOpenLead,
  onAddLead,
}: Props) {
  const { attributes, listeners, setNodeRef, transform, transition, isDragging } =
    useSortable({ id: `col-${column.id}`, data: { type: "column" } });

  const [editing, setEditing] = useState(false);
  const [menuOpen, setMenuOpen] = useState(false);
  const [draft, setDraft] = useState(column.name);
  const menuRef = useRef<HTMLDivElement>(null);

  useEffect(() => {
    if (!menuOpen) return;
    const close = (e: MouseEvent) => {
      if (!menuRef.current?.contains(e.target as Node)) setMenuOpen(false);
    };
    document.addEventListener("mousedown", close);
    return () => document.removeEventListener("mousedown", close);
  }, [menuOpen]);

  const total = leads.reduce((sum, l) => sum + l.value, 0);

  const commitName = () => {
    const name = draft.trim();
    if (name && name !== column.name) {
      boardActions.updateColumn(column.id, { name });
    } else {
      setDraft(column.name);
    }
    setEditing(false);
  };

  const remove = () => {
    const target = otherColumns[0];
    if (!target) return;
    const msg =
      leads.length > 0
        ? `Se borra la columna «${column.name}». Sus ${leads.length} tarjetas pasan a «${target.name}».`
        : `¿Borrar la columna «${column.name}»?`;
    if (window.confirm(msg)) boardActions.deleteColumn(column.id, target.id);
    setMenuOpen(false);
  };

  return (
    <section
      ref={setNodeRef}
      style={{ transform: CSS.Transform.toString(transform), transition }}
      className={`glass flex max-h-full w-[300px] shrink-0 flex-col ${
        isDragging ? "opacity-40" : ""
      }`}
    >
      <header className="flex items-center gap-1.5 px-3 pt-3 pb-2">
        <button
          type="button"
          aria-label="Mover columna"
          className="cursor-grab text-muted hover:text-ink active:cursor-grabbing"
          {...attributes}
          {...listeners}
        >
          <GripVertical size={16} />
        </button>
        <span
          className="h-2.5 w-2.5 shrink-0 rounded-full"
          style={{ background: column.color, boxShadow: `0 0 10px ${column.color}` }}
        />
        {editing ? (
          <input
            autoFocus
            value={draft}
            onChange={(e) => setDraft(e.target.value)}
            onBlur={commitName}
            onKeyDown={(e) => {
              if (e.key === "Enter") commitName();
              if (e.key === "Escape") {
                setDraft(column.name);
                setEditing(false);
              }
            }}
            className="field !py-1"
          />
        ) : (
          <button
            type="button"
            onClick={() => {
              setDraft(column.name);
              setEditing(true);
            }}
            title="Click para renombrar"
            className="min-w-0 flex-1 truncate text-left text-sm font-semibold"
          >
            {column.name}
          </button>
        )}
        <span className="rounded-full bg-white/10 px-2 py-0.5 text-[11px] text-muted">
          {leads.length}
        </span>
        <div ref={menuRef} className="relative">
          <button
            type="button"
            aria-label="Opciones de columna"
            onClick={() => setMenuOpen((v) => !v)}
            className="text-muted hover:text-ink"
          >
            <MoreHorizontal size={18} />
          </button>
          {menuOpen && (
            <div className="glass absolute right-0 z-20 mt-2 w-48 p-2 !bg-[#0b1020]">
              <p className="px-1 pb-1.5 text-[11px] uppercase tracking-wide text-muted">
                Color
              </p>
              <div className="flex flex-wrap gap-1.5 px-1 pb-2">
                {COLUMN_COLORS.map((c) => (
                  <button
                    key={c}
                    type="button"
                    aria-label={`Color ${c}`}
                    onClick={() => boardActions.updateColumn(column.id, { color: c })}
                    className={`h-5 w-5 rounded-full border-2 ${
                      c === column.color ? "border-white" : "border-transparent"
                    }`}
                    style={{ background: c }}
                  />
                ))}
              </div>
              <button
                type="button"
                onClick={remove}
                disabled={otherColumns.length === 0}
                className="flex w-full items-center gap-2 rounded-lg px-2 py-1.5 text-sm text-red-300 hover:bg-red-500/10 disabled:cursor-not-allowed disabled:opacity-40"
              >
                <Trash2 size={14} /> Borrar columna
              </button>
            </div>
          )}
        </div>
      </header>

      {total > 0 && (
        <p className="px-4 pb-1 text-xs text-muted">{formatMoney(total)}</p>
      )}

      <SortableContext
        items={leads.map((l) => `lead-${l.id}`)}
        strategy={verticalListSortingStrategy}
      >
        <div className="thin-scroll flex min-h-[48px] flex-1 flex-col gap-2 overflow-y-auto px-3 py-2">
          {leads.map((lead) => (
            <LeadCard key={lead.id} lead={lead} onOpen={onOpenLead} />
          ))}
        </div>
      </SortableContext>

      <button
        type="button"
        onClick={() => onAddLead(column.id)}
        className="m-3 mt-1 flex items-center justify-center gap-1.5 rounded-xl border border-dashed border-line py-2 text-sm text-muted transition-colors hover:border-accent/50 hover:text-accent"
      >
        <Plus size={15} /> Agregar lead
      </button>
    </section>
  );
}
