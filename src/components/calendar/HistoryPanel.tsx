"use client";

import { useCalLog } from "@/lib/calendar-store";
import {
  BRAND_NAMES, CHANNEL_NAMES, FORMAT_NAMES, MONTH_NAMES, STATUS_NAMES,
} from "@/lib/calendar-types";
import type { CalBrand, CalChannel, CalLogEntry } from "@/lib/calendar-types";

const clip = (t: string, n = 70) => (t.length > n ? t.slice(0, n) + "…" : t);

function changeText(field: string, [from, to]: [unknown, unknown]) {
  if (field === "status") return `estado: ${STATUS_NAMES[Number(from)]} → ${STATUS_NAMES[Number(to)]}`;
  if (field === "format") return `formato: ${FORMAT_NAMES[String(from ?? "")] ?? "—"} → ${FORMAT_NAMES[String(to ?? "")] ?? "—"}`;
  if (field === "day") return `día: ${from} → ${to}`;
  return "texto editado";
}

function describe(e: CalLogEntry) {
  if (e.action === "insert") return "agregó un contenido";
  if (e.action === "delete") return "eliminó un contenido";
  return "cambió " + Object.entries(e.changes).map(([f, v]) => changeText(f, v)).join(" · ");
}

export function HistoryPanel({
  onClose,
  onGo,
}: {
  onClose: () => void;
  onGo: (brand: CalBrand, channel: CalChannel, month: number) => void;
}) {
  const log = useCalLog();
  return (
    <aside className="hist" aria-label="Historial de cambios">
      <header>
        Historial de cambios
        <button className="tab" type="button" onClick={onClose}>Cerrar</button>
      </header>
      {log.length === 0 ? (
        <p className="empty">Todavía no hay cambios registrados.</p>
      ) : (
        <ol>
          {log.map((e) => (
            <li key={e.id}>
              <b>{e.userName}</b> {describe(e)}
              {e.text && <span className="where">“{clip(e.text)}”</span>}
              <span className="where">
                <button
                  type="button"
                  style={{ all: "unset", cursor: "pointer", textDecoration: "underline" }}
                  onClick={() => onGo(e.brand, e.channel, e.month)}
                >
                  {BRAND_NAMES[e.brand]} · {CHANNEL_NAMES[e.channel]} · {e.day} de {MONTH_NAMES[e.month]?.toLowerCase()}
                </button>
              </span>
              <span className="when">
                {new Date(e.at).toLocaleString("es-AR", { day: "numeric", month: "short", hour: "2-digit", minute: "2-digit" })}
              </span>
            </li>
          ))}
        </ol>
      )}
    </aside>
  );
}
