"use client";

import "@/app/calendario/calendar.css";
import Link from "next/link";
import { useCallback, useEffect, useLayoutEffect, useRef, useState, useSyncExternalStore } from "react";
import { resetRemote } from "@/lib/board-store";
import { supabase } from "@/lib/supabase";
import {
  addPost, calIsRemote, flushPending, patchPost, removePost, resetCalendar, restorePost,
  useCalError, useCalPosts,
} from "@/lib/calendar-store";
import {
  BRAND_NAMES, CAL_YEAR, MONTHS, MONTH_NAMES, MONTH_SHORT, STATUS_NAMES,
} from "@/lib/calendar-types";
import type { CalBrand, CalChannel, CalFormat, CalPost, CalStatus } from "@/lib/calendar-types";
import { HistoryPanel } from "./HistoryPanel";

const noop = () => () => {};

// El calendario se dibuja solo en el navegador: usa la fecha de hoy y el zoom
export function CalendarApp() {
  const mounted = useSyncExternalStore(noop, () => true, () => false);
  const posts = useCalPosts();
  if (!mounted || !posts) {
    return <div className="cal" data-brand="aruma" aria-busy="true" />;
  }
  return <Calendar posts={posts} />;
}

function Doodles() {
  return (
    <svg className="doodles" viewBox="0 0 1920 1080" preserveAspectRatio="xMidYMid slice" fill="none" stroke="currentColor" strokeWidth="3" strokeLinecap="round" strokeLinejoin="round" aria-hidden="true">
      <path d="M70 40l-28 52h26l-14 46 40-62h-28z" /><circle cx="1710" cy="70" r="26" /><path d="M1500 30c30 40 70 -30 100 10s60 -20 90 14" />
      <path d="M120 1010c40 -50 80 20 120 -22s70 -30 100 10" /><path d="M1820 980l-30 54h28l-16 40 40 -58h-28z" /><rect x="980" y="1020" width="70" height="26" rx="4" />
      <circle cx="1590" cy="1035" r="14" /><path d="M560 24c26 30 56 -22 84 8" />
    </svg>
  );
}

function AutoText({ value, onChange }: { value: string; onChange: (v: string) => void }) {
  const ref = useRef<HTMLTextAreaElement>(null);
  // Navegadores sin field-sizing: la altura se ajusta a mano
  useLayoutEffect(() => {
    const t = ref.current;
    if (!t || (window.CSS?.supports && CSS.supports("field-sizing", "content"))) return;
    t.style.height = "auto";
    t.style.height = t.scrollHeight + "px";
  }, [value]);
  return (
    <textarea
      ref={ref}
      className="txt"
      rows={1}
      value={value}
      onChange={(e) => onChange(e.target.value)}
      aria-label="De qué trata el contenido"
      placeholder="¿De qué trata?"
    />
  );
}

function Card({ p, open, onToggle }: { p: CalPost; open: boolean; onToggle: () => void }) {
  return (
    <div className={`card s${p.status}${open ? " open" : ""}`}>
      <button className="del" type="button" data-del={p.id} aria-label="Eliminar este contenido" title="Eliminar">
        <svg width="10" height="10" viewBox="0 0 14 14" fill="none" stroke="currentColor" strokeWidth="2.2" strokeLinecap="round"><path d="M3 3l8 8M11 3l-8 8" /></svg>
      </button>
      <div className="row">
        <select
          className={`fmt f-${p.format}`}
          value={p.format}
          onChange={(e) => patchPost(p.id, { format: e.target.value as CalFormat })}
          aria-label="Formato del contenido"
        >
          <option value="">Formato</option>
          <option value="R">Reel</option>
          <option value="C">Carrusel</option>
          <option value="H">Historia</option>
        </select>
        <div className="stwrap">
          <button className="stbtn" type="button" data-st={p.id} onClick={onToggle} aria-haspopup="true" aria-expanded={open} aria-label={`Estado: ${STATUS_NAMES[p.status]}`}>
            <span className={`dot s${p.status}`} />Estado
            <svg width="9" height="9" viewBox="0 0 10 10" fill="none" stroke="currentColor" strokeWidth="1.8" strokeLinecap="round" strokeLinejoin="round"><path d="M2 3.5l3 3 3-3" /></svg>
          </button>
          {open && (
            <div className="menu">
              {STATUS_NAMES.map((n, i) => (
                <button key={n} className="opt" type="button" data-pick={i} data-id={p.id} aria-current={p.status === i}>
                  <span className={`dot s${i}`} />{n}
                </button>
              ))}
            </div>
          )}
        </div>
      </div>
      <AutoText value={p.text} onChange={(v) => patchPost(p.id, { text: v })} />
    </div>
  );
}

function Calendar({ posts }: { posts: CalPost[] }) {
  const [brand, setBrand] = useState<CalBrand>("aruma");
  const [channel, setChannel] = useState<CalChannel>("org");
  const [month, setMonth] = useState(() => {
    const m = new Date().getMonth() + 1;
    return m >= 6 && m <= 12 ? m : 6;
  });
  const [openId, setOpenId] = useState<string | null>(null);
  const [undo, setUndo] = useState<{ item: CalPost } | null>(null);
  const [historyOpen, setHistoryOpen] = useState(false);
  const syncError = useCalError();

  const list = posts.filter((p) => p.brand === brand && p.channel === channel && p.month === month);
  const counts = [0, 0, 0];
  list.forEach((p) => { counts[p.status] += 1; });

  const lead = (new Date(CAL_YEAR, month - 1, 1).getDay() + 6) % 7;
  const dim = new Date(CAL_YEAR, month, 0).getDate();
  const total = Math.ceil((lead + dim) / 7) * 7;
  const now = new Date();
  const today = now.getFullYear() === CAL_YEAR && now.getMonth() + 1 === month ? now.getDate() : -1;

  // ---- deshacer ----
  const undoTimer = useRef<ReturnType<typeof setTimeout>>(undefined);
  const remove = (id: string) => {
    const item = removePost(id);
    if (!item) return;
    setUndo({ item });
    clearTimeout(undoTimer.current);
    undoTimer.current = setTimeout(() => setUndo(null), 6000);
  };
  const doUndo = () => {
    if (!undo) return;
    restorePost(undo.item);
    setUndo(null);
    clearTimeout(undoTimer.current);
  };

  // ---- clicks dentro del calendario ----
  const onGridClick = (ev: React.MouseEvent) => {
    const b = (ev.target as HTMLElement).closest("button");
    if (!b) return;
    if (b.dataset.add) {
      addPost({ brand, channel, month, day: Number(b.dataset.add) });
      setOpenId(null);
    } else if (b.dataset.del) {
      remove(b.dataset.del);
    } else if (b.dataset.pick !== undefined && b.dataset.id) {
      patchPost(b.dataset.id, { status: Number(b.dataset.pick) as CalStatus });
      setOpenId(null);
    }
  };

  useEffect(() => {
    const close = (ev: MouseEvent) => {
      const t = ev.target as HTMLElement;
      if (t.closest(".menu") || t.closest("[data-st]")) return;
      setOpenId(null);
    };
    document.addEventListener("mousedown", close);
    return () => document.removeEventListener("mousedown", close);
  }, []);

  // Lo que se está tipeando se guarda aunque se cierre la pestaña
  useEffect(() => {
    const flush = () => { if (document.visibilityState === "hidden") flushPending(); };
    document.addEventListener("visibilitychange", flush);
    window.addEventListener("pagehide", flushPending);
    return () => {
      document.removeEventListener("visibilitychange", flush);
      window.removeEventListener("pagehide", flushPending);
      flushPending();
    };
  }, []);

  // ---- zoom (botones + pellizco del trackpad) ----
  const [zoom, setZoom] = useState(1);
  const zoomRef = useRef(1);
  const anchor = useRef<{ cx: number; cy: number; ox: number; oy: number } | null>(null);
  const scrollRef = useRef<HTMLDivElement>(null);
  const boxRef = useRef<HTMLDivElement>(null);
  const [size, setSize] = useState({ w: 0, h: 0 });

  useEffect(() => {
    const box = boxRef.current;
    if (!box) return;
    const measure = () => setSize({ w: Math.floor(box.clientWidth), h: Math.floor(box.clientHeight) });
    measure();
    const ro = new ResizeObserver(measure);
    ro.observe(box);
    return () => ro.disconnect();
  }, []);

  const zoomAt = useCallback((z: number, ox: number, oy: number) => {
    const sc = scrollRef.current;
    const nz = Math.max(0.5, Math.min(3, Math.round(z * 100) / 100));
    const old = zoomRef.current;
    if (!sc || nz === old) return;
    anchor.current = { cx: (sc.scrollLeft + ox) / old, cy: (sc.scrollTop + oy) / old, ox, oy };
    zoomRef.current = nz;
    setZoom(nz);
  }, []);

  useLayoutEffect(() => {
    const a = anchor.current;
    const sc = scrollRef.current;
    if (!a || !sc) return;
    sc.scrollLeft = a.cx * zoom - a.ox;
    sc.scrollTop = a.cy * zoom - a.oy;
    anchor.current = null;
  }, [zoom]);

  useEffect(() => {
    const point = (ev: { clientX: number; clientY: number }) => {
      const r = scrollRef.current!.getBoundingClientRect();
      return { x: Math.max(0, Math.min(r.width, ev.clientX - r.left)), y: Math.max(0, Math.min(r.height, ev.clientY - r.top)) };
    };
    let gz = 1;
    const wheel = (ev: WheelEvent) => {
      if (!ev.ctrlKey) return;
      ev.preventDefault();
      const p = point(ev);
      zoomAt(zoomRef.current * Math.exp(-ev.deltaY * 0.012), p.x, p.y);
    };
    // Safari (Mac) manda eventos de gesto propios
    type GestureEvent = Event & { scale: number; clientX: number; clientY: number };
    const gStart = (ev: Event) => { ev.preventDefault(); gz = zoomRef.current; };
    const gChange = (ev: Event) => {
      ev.preventDefault();
      const g = ev as GestureEvent;
      const p = point(g);
      zoomAt(gz * g.scale, p.x, p.y);
    };
    const gEnd = (ev: Event) => ev.preventDefault();
    document.addEventListener("wheel", wheel, { passive: false });
    document.addEventListener("gesturestart", gStart, { passive: false });
    document.addEventListener("gesturechange", gChange, { passive: false });
    document.addEventListener("gestureend", gEnd, { passive: false });
    return () => {
      document.removeEventListener("wheel", wheel);
      document.removeEventListener("gesturestart", gStart);
      document.removeEventListener("gesturechange", gChange);
      document.removeEventListener("gestureend", gEnd);
    };
  }, [zoomAt]);

  const pick = (fn: () => void) => () => { setOpenId(null); fn(); };

  return (
    <div className="cal" data-brand={brand}>
      <Doodles />

      <div className="bar">
        <div className="title">
          <span className="wordmark">{BRAND_NAMES[brand]}</span>
          <span className="month">{MONTH_NAMES[month]}</span>
        </div>
        <div className="right">
          {syncError && <span className="syncerr" role="alert">No se pudo guardar: {syncError}</span>}
          <div className="group">
            <button className="zbtn" type="button" aria-label="Alejar" onClick={() => zoomAt(zoomRef.current - 0.1, 0, 0)}>
              <svg width="16" height="16" viewBox="0 0 16 16" fill="none" stroke="currentColor" strokeWidth="2.2" strokeLinecap="round"><path d="M3 8h10" /></svg>
            </button>
            <button className="zlabel" type="button" aria-label="Volver al 100%" title="Volver al 100%" onClick={() => zoomAt(1, 0, 0)}>{Math.round(zoom * 100)}%</button>
            <button className="zbtn" type="button" aria-label="Acercar" onClick={() => zoomAt(zoomRef.current + 0.1, 0, 0)}>
              <svg width="16" height="16" viewBox="0 0 16 16" fill="none" stroke="currentColor" strokeWidth="2.2" strokeLinecap="round"><path d="M3 8h10M8 3v10" /></svg>
            </button>
          </div>
          <button className="brandbtn aruma" type="button" aria-pressed={brand === "aruma"} onClick={pick(() => setBrand("aruma"))}>Aruma</button>
          <button className="brandbtn softline" type="button" aria-pressed={brand === "softline"} onClick={pick(() => setBrand("softline"))}>Soft Line</button>
        </div>
      </div>

      <div className="bar">
        <div className="group">
          <button className="tab" type="button" aria-pressed={channel === "org"} onClick={pick(() => setChannel("org"))}>Calendario orgánico</button>
          <button className="tab" type="button" aria-pressed={channel === "ads"} onClick={pick(() => setChannel("ads"))}>Calendario Meta Ads</button>
        </div>
        <div className="months">
          {MONTHS.map((m) => (
            <button key={m} className="mbtn" type="button" aria-pressed={m === month} onClick={pick(() => setMonth(m))}>{MONTH_SHORT[m]}</button>
          ))}
        </div>
        <div className="group">
          <span className="stat s0"><b>{counts[0]}</b>por hacer</span>
          <span className="stat s1"><b>{counts[1]}</b>diseñados</span>
          <span className="stat s2"><b>{counts[2]}</b>programados</span>
          <span className="total">de <b>{list.length}</b> creativos</span>
        </div>
        <div className="group">
          {calIsRemote && (
            <button className="tab" type="button" aria-pressed={historyOpen} onClick={() => setHistoryOpen((v) => !v)}>Historial</button>
          )}
          <Link className="tab navlink" href="/">CRM</Link>
          {supabase && (
            <button
              className="tab"
              type="button"
              onClick={async () => {
                resetCalendar();
                resetRemote();
                await supabase?.auth.signOut();
              }}
            >
              Salir
            </button>
          )}
        </div>
      </div>

      <div className="calbox" ref={boxRef}>
        <div className="calscroll" ref={scrollRef}>
          <div className="wrap" style={{ zoom, width: size.w || undefined, minHeight: size.h || undefined }}>
            <div className="wd">
              {["LUNES", "MARTES", "MIÉRCOLES", "JUEVES", "VIERNES", "SÁBADO", "DOMINGO"].map((d) => <span key={d}>{d}</span>)}
            </div>
            <div className="grid" style={{ gridTemplateRows: `repeat(${total / 7}, auto)` }} onClick={onGridClick}>
              {Array.from({ length: total }, (_, i) => {
                const d = i - lead + 1;
                if (d < 1 || d > dim) return <div key={i} className="cell blank" />;
                const es = list.filter((p) => p.day === d);
                const hasOpen = es.some((p) => p.id === openId);
                return (
                  <div key={i} className={`cell${i % 7 >= 5 ? " we" : ""}${hasOpen ? " open" : ""}`}>
                    <div className="dayrow">
                      <span className={`day${d === today ? " today" : ""}`}>{d}</span>
                      <button className="add" type="button" data-add={d} aria-label={`Agregar contenido al día ${d}`} title="Agregar contenido">
                        <svg width="11" height="11" viewBox="0 0 12 12" fill="none" stroke="currentColor" strokeWidth="2" strokeLinecap="round"><path d="M6 1.5v9M1.5 6h9" /></svg>
                      </button>
                    </div>
                    <div className="list">
                      {es.map((p) => (
                        <Card key={p.id} p={p} open={openId === p.id} onToggle={() => setOpenId(openId === p.id ? null : p.id)} />
                      ))}
                    </div>
                  </div>
                );
              })}
            </div>
          </div>
        </div>
      </div>

      {historyOpen && (
        <HistoryPanel
          onClose={() => setHistoryOpen(false)}
          onGo={(b, c, m) => { setBrand(b); setChannel(c); setMonth(m); setOpenId(null); }}
        />
      )}

      <div className={`toast${undo ? " show" : ""}`} role="status">
        <span>{undo ? `Eliminaste “${(undo.item.text || "contenido sin texto").slice(0, 40)}” del ${undo.item.day}` : ""}</span>
        <button type="button" onClick={doUndo}>Deshacer</button>
      </div>
    </div>
  );
}
