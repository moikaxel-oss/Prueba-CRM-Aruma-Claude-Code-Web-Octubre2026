"use client";

import Link from "next/link";
import { usePathname } from "next/navigation";
import { BarChart3, CalendarDays, Kanban, Settings, Users } from "lucide-react";
import { SignOutButton } from "./SignOutButton";

const items = [
  { label: "Pipeline", icon: Kanban, href: "/" },
  { label: "Calendario", icon: CalendarDays, href: "/calendario" },
  { label: "Reportes", icon: BarChart3, href: null },
  { label: "Clientes", icon: Users, href: null },
  { label: "Ajustes", icon: Settings, href: null },
];

export function Sidebar() {
  const pathname = usePathname();
  return (
    <nav className="glass flex w-[72px] flex-col items-center gap-3 py-5">
      <div className="glow-btn mb-3 flex h-10 w-10 items-center justify-center rounded-xl text-sm font-bold">
        A
      </div>
      {items.map(({ label, icon: Icon, href }) =>
        href ? (
          <Link
            key={label}
            href={href}
            title={label}
            aria-label={label}
            className={
              pathname === href
                ? "flex h-11 w-11 items-center justify-center rounded-xl border border-accent/40 bg-accent/15 text-accent"
                : "flex h-11 w-11 items-center justify-center rounded-xl text-muted hover:text-ink"
            }
          >
            <Icon size={20} />
          </Link>
        ) : (
          <button
            key={label}
            type="button"
            disabled
            title={`${label} (próximamente)`}
            aria-label={label}
            className="flex h-11 w-11 cursor-not-allowed items-center justify-center rounded-xl text-muted/60"
          >
            <Icon size={20} />
          </button>
        ),
      )}
      <SignOutButton />
    </nav>
  );
}
