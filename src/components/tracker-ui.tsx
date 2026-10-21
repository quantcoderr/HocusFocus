import type { ReactNode } from "react";
import { Check, RotateCcw, Trash2 } from "lucide-react";
import { cn } from "@/lib/utils";
import type { Task } from "@/lib/tracker";

export function Panel({ title, action, children, className }: { title?: string; action?: ReactNode; children: ReactNode; className?: string }) {
  return (
    <section className={cn("rounded-lg border border-border bg-card/80 p-4 backdrop-blur", className)}>
      {(title || action) && (
        <div className="mb-3 flex items-center justify-between gap-2">
          {title && <h2 className="font-mono text-xs uppercase tracking-widest text-muted-foreground">{title}</h2>}
          {action}
        </div>
      )}
      {children}
    </section>
  );
}

export function Stat({ label, value, sub }: { label: string; value: ReactNode; sub?: ReactNode }) {
  return (
    <Panel>
      <div className="font-mono text-[11px] uppercase tracking-widest text-muted-foreground">{label}</div>
      <div className="mt-1 font-mono text-3xl font-semibold text-primary">{value}</div>
      {sub && <div className="mt-1 text-xs text-muted-foreground">{sub}</div>}
    </Panel>
  );
}

export function Bar({ value, className }: { value: number; className?: string }) {
  return (
    <div className={cn("h-2 w-full overflow-hidden rounded-full bg-muted", className)}>
      <div className="h-full rounded-full bg-primary shadow-glow transition-all" style={{ width: `${Math.max(0, Math.min(100, value))}%` }} />
    </div>
  );
}

const catLabel: Record<string, string> = { cpp: "C++", fpga: "FPGA", college: "COLLEGE", dsa: "DSA", revision: "REV" };

export function fmtH(h: number) {
  if (h < 1) return `${Math.round(h * 60)}m`;
  return `${+h.toFixed(2)}h`;
}

export function TaskRow({ task, onToggle, onDelete }: { task: Task; onToggle: () => void; onDelete?: () => void }) {
  return (
    <li className={cn("group flex items-center gap-3 rounded-md border border-border bg-background/40 px-3 py-2", task.done && "opacity-50")}>
      <button
        onClick={onToggle}
        aria-label={task.done ? "Mark incomplete" : "Mark complete"}
        className={cn(
          "flex h-5 w-5 shrink-0 items-center justify-center rounded border border-primary/60 transition",
          task.done && "bg-primary text-primary-foreground",
        )}
      >
        {task.done && <Check className="h-3.5 w-3.5" />}
      </button>
      <span className="w-16 shrink-0 font-mono text-[10px] tracking-wider text-accent-foreground">{catLabel[task.category]}</span>
      <span className={cn("flex-1 text-sm", task.done && "line-through")}>{task.title}</span>
      {task.rolledOver && !task.done && (
        <span title="Rolled over" className="flex items-center gap-1 font-mono text-[10px] text-warning">
          <RotateCcw className="h-3 w-3" /> carry
        </span>
      )}
      <span className="font-mono text-xs text-muted-foreground">{fmtH(task.hours)}</span>
      {onDelete && (
        <button onClick={onDelete} aria-label="Delete task" className="text-muted-foreground opacity-0 transition hover:text-destructive group-hover:opacity-100">
          <Trash2 className="h-3.5 w-3.5" />
        </button>
      )}
    </li>
  );
}

export function Radar({ values }: { values: { label: string; value: number }[] }) {
  const size = 280, c = size / 2, r = 100;
  const pt = (i: number, v: number) => {
    const a = (Math.PI * 2 * i) / values.length - Math.PI / 2;
    return [c + Math.cos(a) * r * (v / 100), c + Math.sin(a) * r * (v / 100)];
  };
  const poly = values.map((v, i) => pt(i, v.value).join(",")).join(" ");
  return (
    <svg viewBox={`-40 -10 ${size + 80} ${size + 20}`} className="mx-auto w-full max-w-xs">
      {[25, 50, 75, 100].map((ring) => (
        <polygon key={ring} points={values.map((_, i) => pt(i, ring).join(",")).join(" ")} className="fill-none stroke-border" />
      ))}
      {values.map((_, i) => {
        const [x, y] = pt(i, 100);
        return <line key={i} x1={c} y1={c} x2={x} y2={y} className="stroke-border" />;
      })}
      <polygon points={poly} className="fill-primary/25 stroke-primary" strokeWidth={2} />
      {values.map((v, i) => {
        const [x, y] = pt(i, v.value);
        const [lx, ly] = pt(i, 125);
        return (
          <g key={v.label}>
            <circle cx={x} cy={y} r={3.5} className="fill-primary" />
            <text x={lx} y={ly} textAnchor="middle" dominantBaseline="middle" className="fill-muted-foreground font-mono text-[9px]">
              {v.label}
            </text>
          </g>
        );
      })}
    </svg>
  );
}
