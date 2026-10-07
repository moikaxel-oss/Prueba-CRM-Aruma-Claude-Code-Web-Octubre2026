"use client";

import { useSortable } from "@dnd-kit/sortable";
import { CSS } from "@dnd-kit/utilities";
import { formatMoney, timeAgo } from "@/lib/format";
import type { Lead } from "@/lib/types";

export function LeadCardBody({ lead }: { lead: Lead }) {
  return (
    <>
      <div className="flex items-start justify-between gap-2">
        <p className="truncate text-sm font-medium">{lead.name}</p>
        <span className="shrink-0 text-[11px] text-muted">
          {timeAgo(lead.createdAt)}
        </span>
      </div>
      {lead.phone && <p className="mt-0.5 text-xs text-muted">{lead.phone}</p>}
      {lead.campaign && (
        <p className="mt-2 inline-block max-w-full truncate rounded-full border border-accent/30 bg-accent/10 px-2 py-0.5 text-[11px] text-accent">
          {lead.campaign}
        </p>
      )}
      {lead.value > 0 && (
        <p className="mt-2 text-xs font-medium text-ink/90">
          {formatMoney(lead.value)}
        </p>
      )}
    </>
  );
}

export function LeadCard({
  lead,
  onOpen,
}: {
  lead: Lead;
  onOpen: (lead: Lead) => void;
}) {
  const { attributes, listeners, setNodeRef, transform, transition, isDragging } =
    useSortable({
      id: `lead-${lead.id}`,
      data: { type: "lead", columnId: lead.columnId },
    });

  return (
    <div
      ref={setNodeRef}
      style={{ transform: CSS.Transform.toString(transform), transition }}
      {...attributes}
      {...listeners}
      onClick={() => onOpen(lead)}
      className={`cursor-grab rounded-xl border border-line bg-white/[0.04] p-3 text-left transition-colors hover:border-white/20 active:cursor-grabbing ${
        isDragging ? "opacity-30" : ""
      }`}
    >
      <LeadCardBody lead={lead} />
    </div>
  );
}
