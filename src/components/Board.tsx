"use client";

import { useMemo, useState } from "react";
import {
  closestCorners,
  DndContext,
  DragOverlay,
  KeyboardSensor,
  PointerSensor,
  pointerWithin,
  useSensor,
  useSensors,
} from "@dnd-kit/core";
import type {
  CollisionDetection,
  DragEndEvent,
  DragOverEvent,
  DragStartEvent,
} from "@dnd-kit/core";
import {
  horizontalListSortingStrategy,
  SortableContext,
  sortableKeyboardCoordinates,
} from "@dnd-kit/sortable";
import { Database, Plus } from "lucide-react";
import { boardActions, useBoard } from "@/lib/board-store";
import { formatMoney } from "@/lib/format";
import { ColumnView } from "./ColumnView";
import { LeadCardBody } from "./LeadCard";
import { LeadDialog } from "./LeadDialog";
import type { DialogTarget } from "./LeadDialog";

const ALL = "__all__";

// Una columna se arrastra solo contra otras columnas.
// Una tarjeta prefiere la tarjeta bajo el puntero y si no, la columna.
const collisionDetection: CollisionDetection = (args) => {
  const activeId = String(args.active.id);
  if (activeId.startsWith("col-")) {
    return closestCorners({
      ...args,
      droppableContainers: args.droppableContainers.filter((c) =>
        String(c.id).startsWith("col-"),
      ),
    });
  }
  const hits = pointerWithin(args);
  if (hits.length) {
    const cards = hits.filter((h) => String(h.id).startsWith("lead-"));
    return cards.length ? cards : hits;
  }
  return closestCorners(args);
};

export function Board() {
  const board = useBoard();
  const [campaign, setCampaign] = useState(ALL);
  const [dialog, setDialog] = useState<DialogTarget | null>(null);
  const [activeId, setActiveId] = useState<string | null>(null);
  const [addingColumn, setAddingColumn] = useState(false);
  const [newColumnName, setNewColumnName] = useState("");

  const sensors = useSensors(
    useSensor(PointerSensor, { activationConstraint: { distance: 6 } }),
    useSensor(KeyboardSensor, { coordinateGetter: sortableKeyboardCoordinates }),
  );

  const campaigns = useMemo(
    () =>
      board
        ? [...new Set(board.leads.map((l) => l.campaign).filter(Boolean))].sort()
        : [],
    [board],
  );

  if (!board) {
    return <div className="glass flex-1 animate-pulse" aria-busy="true" />;
  }

  const visibleLeads =
    campaign === ALL ? board.leads : board.leads.filter((l) => l.campaign === campaign);
  const pipelineValue = visibleLeads.reduce((sum, l) => sum + l.value, 0);

  const activeLead = activeId?.startsWith("lead-")
    ? board.leads.find((l) => l.id === activeId.slice(5))
    : undefined;
  const activeColumn = activeId?.startsWith("col-")
    ? board.columns.find((c) => c.id === activeId.slice(4))
    : undefined;

  const onDragStart = (e: DragStartEvent) => setActiveId(String(e.active.id));

  const onDragOver = (e: DragOverEvent) => {
    const { active, over } = e;
    if (!over) return;
    const a = String(active.id);
    const o = String(over.id);
    if (!a.startsWith("lead-")) return;
    if (o.startsWith("lead-")) boardActions.moveLeadAcross(a.slice(5), o.slice(5), false);
    else if (o.startsWith("col-")) boardActions.moveLeadAcross(a.slice(5), o.slice(4), true);
  };

  const onDragEnd = (e: DragEndEvent) => {
    setActiveId(null);
    const { active, over } = e;
    if (!over || active.id === over.id) return;
    const a = String(active.id);
    const o = String(over.id);
    if (a.startsWith("col-") && o.startsWith("col-")) {
      boardActions.reorderColumns(a.slice(4), o.slice(4));
    } else if (a.startsWith("lead-") && o.startsWith("lead-")) {
      boardActions.reorderLeads(a.slice(5), o.slice(5));
    }
  };

  const submitColumn = () => {
    const name = newColumnName.trim();
    if (name) boardActions.addColumn(name);
    setNewColumnName("");
    setAddingColumn(false);
  };

  return (
    <>
      <header className="glass mb-4 flex flex-wrap items-center gap-x-6 gap-y-3 px-5 py-3">
        <div className="mr-auto">
          <h1 className="text-xl font-semibold">Pipeline</h1>
          <p className="text-xs text-muted">Arrastrá tarjetas y columnas. Click en un nombre para renombrar.</p>
        </div>

        <div className="flex gap-6 text-right">
          <div>
            <p className="text-[11px] uppercase tracking-wide text-muted">Leads</p>
            <p className="text-lg font-semibold">{visibleLeads.length}</p>
          </div>
          <div>
            <p className="text-[11px] uppercase tracking-wide text-muted">Valor</p>
            <p className="text-lg font-semibold">{formatMoney(pipelineValue)}</p>
          </div>
        </div>

        <select
          aria-label="Filtrar por campaña"
          value={campaign}
          onChange={(e) => setCampaign(e.target.value)}
          className="field !w-auto min-w-[200px]"
        >
          <option value={ALL}>Todas las campañas</option>
          {campaigns.map((c) => (
            <option key={c} value={c}>{c}</option>
          ))}
        </select>

        <details className="relative">
          <summary className="flex cursor-pointer list-none items-center gap-1.5 rounded-xl border border-line px-3 py-2 text-sm text-muted hover:text-ink">
            <Database size={15} /> Datos
          </summary>
          <div className="glass absolute right-0 z-30 mt-2 w-56 !bg-[#0b1020] p-2">
            <button
              type="button"
              className="w-full rounded-lg px-2 py-1.5 text-left text-sm hover:bg-white/5"
              onClick={() => {
                if (window.confirm("Se reemplaza el tablero actual por los datos de ejemplo.")) {
                  boardActions.loadDemo();
                  setCampaign(ALL);
                }
              }}
            >
              Cargar datos de ejemplo
            </button>
            <button
              type="button"
              className="w-full rounded-lg px-2 py-1.5 text-left text-sm text-red-300 hover:bg-red-500/10"
              onClick={() => {
                if (window.confirm("Se borran todas las columnas y leads de este navegador.")) {
                  boardActions.clearAll();
                  setCampaign(ALL);
                }
              }}
            >
              Vaciar todo y empezar de cero
            </button>
          </div>
        </details>

        <button
          type="button"
          onClick={() =>
            board.columns[0] && setDialog({ mode: "new", columnId: board.columns[0].id })
          }
          disabled={board.columns.length === 0}
          className="glow-btn flex items-center gap-1.5 rounded-xl px-4 py-2 text-sm font-medium disabled:opacity-50"
        >
          <Plus size={16} /> Nuevo lead
        </button>
      </header>

      <DndContext
        sensors={sensors}
        collisionDetection={collisionDetection}
        onDragStart={onDragStart}
        onDragOver={onDragOver}
        onDragEnd={onDragEnd}
        onDragCancel={() => setActiveId(null)}
      >
        <div className="thin-scroll flex min-h-0 flex-1 items-start gap-4 overflow-x-auto pb-3">
          <SortableContext
            items={board.columns.map((c) => `col-${c.id}`)}
            strategy={horizontalListSortingStrategy}
          >
            {board.columns.map((col) => (
              <ColumnView
                key={col.id}
                column={col}
                leads={visibleLeads.filter((l) => l.columnId === col.id)}
                otherColumns={board.columns.filter((c) => c.id !== col.id)}
                onOpenLead={(lead) => setDialog({ mode: "edit", lead })}
                onAddLead={(columnId) => setDialog({ mode: "new", columnId })}
              />
            ))}
          </SortableContext>

          <div className="w-[300px] shrink-0">
            {addingColumn ? (
              <div className="glass p-3">
                <input
                  autoFocus
                  placeholder="Nombre de la columna"
                  value={newColumnName}
                  onChange={(e) => setNewColumnName(e.target.value)}
                  onKeyDown={(e) => {
                    if (e.key === "Enter") submitColumn();
                    if (e.key === "Escape") {
                      setNewColumnName("");
                      setAddingColumn(false);
                    }
                  }}
                  onBlur={submitColumn}
                  className="field"
                />
              </div>
            ) : (
              <button
                type="button"
                onClick={() => setAddingColumn(true)}
                className="glass flex w-full items-center justify-center gap-1.5 py-3 text-sm text-muted transition-colors hover:text-accent"
              >
                <Plus size={16} /> Agregar columna
              </button>
            )}
          </div>
        </div>

        <DragOverlay>
          {activeLead && (
            <div className="rotate-2 rounded-xl border border-accent/50 bg-[#0d1428] p-3 shadow-2xl">
              <LeadCardBody lead={activeLead} />
            </div>
          )}
          {activeColumn && (
            <div className="glass w-[300px] px-4 py-3 text-sm font-semibold">
              {activeColumn.name}
            </div>
          )}
        </DragOverlay>
      </DndContext>

      {dialog && (
        <LeadDialog
          key={dialog.mode === "edit" ? dialog.lead.id : `new-${dialog.columnId}`}
          target={dialog}
          columns={board.columns}
          campaigns={campaigns}
          onClose={() => setDialog(null)}
        />
      )}
    </>
  );
}
