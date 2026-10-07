import { BarChart3, Kanban, Settings, Users } from "lucide-react";

const items = [
  { label: "Pipeline", icon: Kanban, active: true },
  { label: "Reportes", icon: BarChart3, active: false },
  { label: "Clientes", icon: Users, active: false },
  { label: "Ajustes", icon: Settings, active: false },
];

export function Sidebar() {
  return (
    <nav className="glass flex w-[72px] flex-col items-center gap-3 py-5">
      <div className="glow-btn mb-3 flex h-10 w-10 items-center justify-center rounded-xl text-sm font-bold">
        A
      </div>
      {items.map(({ label, icon: Icon, active }) => (
        <button
          key={label}
          type="button"
          disabled={!active}
          title={active ? label : `${label} (próximamente)`}
          aria-label={label}
          className={
            active
              ? "flex h-11 w-11 items-center justify-center rounded-xl border border-accent/40 bg-accent/15 text-accent"
              : "flex h-11 w-11 cursor-not-allowed items-center justify-center rounded-xl text-muted/60"
          }
        >
          <Icon size={20} />
        </button>
      ))}
    </nav>
  );
}
