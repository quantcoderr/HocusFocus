import { Link, useRouterState } from "@tanstack/react-router";
import { useState, type ReactNode } from "react";
import { Activity, CalendarCheck, Code2, Cpu, GraduationCap, LayoutDashboard, PanelLeft, Palmtree } from "lucide-react";
import { Switch } from "@/components/ui/switch";
import { useTracker } from "@/lib/store";
import { capacity, isWeekend } from "@/lib/tracker";
import { cn } from "@/lib/utils";

const nav = [
  { to: "/", label: "Dashboard", icon: LayoutDashboard },
  { to: "/tasks", label: "Daily Tasks", icon: CalendarCheck },
  { to: "/cpp", label: "C++ Progress", icon: Code2 },
  { to: "/fpga", label: "Digital Design & FPGA", icon: Cpu },
  { to: "/cgpa", label: "Academic CGPA", icon: GraduationCap },
  { to: "/readiness", label: "HFT Readiness Index", icon: Activity },
] as const;

export function AppShell({ children }: { children: ReactNode }) {
  const [open, setOpen] = useState(true);
  const path = useRouterState({ select: (r) => r.location.pathname });
  const { state, today, setFestive } = useTracker();
  const mode = state.festive ? "FESTIVE" : isWeekend(today) ? "WEEKEND" : "WEEKDAY";

  return (
    <div className="flex min-h-screen w-full">
      <aside className={cn("sticky top-0 h-screen shrink-0 border-r border-sidebar-border bg-sidebar transition-all", open ? "w-60" : "w-14")}>
        <div className="flex h-14 items-center gap-2 border-b border-sidebar-border px-4">
          <div className="h-2.5 w-2.5 shrink-0 rounded-full bg-primary shadow-glow" />
          {open && <span className="font-mono text-sm font-semibold tracking-wider text-sidebar-foreground">HFT//TRACK</span>}
        </div>
        <nav className="space-y-1 p-2">
          {nav.map((n) => {
            const active = path === n.to;
            return (
              <Link
                key={n.to}
                to={n.to}
                title={n.label}
                className={cn(
                  "flex items-center gap-3 rounded-md px-2.5 py-2 text-sm text-sidebar-foreground transition hover:bg-sidebar-accent",
                  active && "bg-sidebar-accent text-sidebar-accent-foreground",
                )}
              >
                <n.icon className={cn("h-4 w-4 shrink-0", active && "text-primary")} />
                {open && <span className="truncate">{n.label}</span>}
              </Link>
            );
          })}
        </nav>
      </aside>
      <div className="flex min-w-0 flex-1 flex-col">
        <header className="sticky top-0 z-10 flex h-14 items-center gap-3 border-b border-border bg-background/85 px-4 backdrop-blur">
          <button onClick={() => setOpen((o) => !o)} aria-label="Toggle sidebar" className="text-muted-foreground hover:text-primary">
            <PanelLeft className="h-4 w-4" />
          </button>
          <span className="font-mono text-xs text-muted-foreground">
            {today} · <span className="text-primary">{mode}</span> · cap {capacity(today, state.festive)}h
          </span>
          <label className="ml-auto flex cursor-pointer items-center gap-2 text-sm">
            <Palmtree className={cn("h-4 w-4", state.festive ? "text-warning" : "text-muted-foreground")} />
            <span className="hidden sm:inline">Festive/Travel Mode</span>
            <Switch checked={state.festive} onCheckedChange={setFestive} />
          </label>
        </header>
        <main className="flex-1 p-4 md:p-6">{children}</main>
      </div>
    </div>
  );
}

export function PageTitle({ title, sub }: { title: string; sub?: string }) {
  return (
    <div className="mb-5">
      <h1 className="text-2xl font-semibold tracking-tight">{title}</h1>
      {sub && <p className="mt-1 text-sm text-muted-foreground">{sub}</p>}
    </div>
  );
}
