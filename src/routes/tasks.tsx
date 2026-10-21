import { createFileRoute } from "@tanstack/react-router";
import { useState } from "react";
import { Sparkles } from "lucide-react";
import { PageTitle } from "@/components/app-shell";
import { Bar, Panel, TaskRow, fmtH } from "@/components/tracker-ui";
import { Button } from "@/components/ui/button";
import { useTracker } from "@/lib/store";
import { addDays, capacity, dayLoad, parseKey, uid, type Category } from "@/lib/tracker";

export const Route = createFileRoute("/tasks")({
  head: () => ({
    meta: [
      { title: "Daily Tasks · HFT Career Tracker" },
      { name: "description", content: "Daily checklist with auto-rollover and workload rebalancing." },
      { property: "og:title", content: "Daily Tasks · HFT Career Tracker" },
      { property: "og:description", content: "Daily checklist with auto-rollover and workload rebalancing." },
    ],
  }),
  component: TasksPage,
});

function TasksPage() {
  const { state, today, update, runOptimise } = useTracker();
  const [title, setTitle] = useState("");
  const [hours, setHours] = useState("0.5");
  const [cat, setCat] = useState<Category>("cpp");
  const toggle = (id: string) => update((s) => ({ ...s, tasks: s.tasks.map((t) => (t.id === id ? { ...t, done: !t.done } : t)) }));
  const del = (id: string) => update((s) => ({ ...s, tasks: s.tasks.filter((t) => t.id !== id) }));
  const days = Array.from({ length: 6 }, (_, i) => addDays(today, i));
  const backlog = state.tasks.filter((t) => t.date === null && !t.done);
  const carry = state.tasks.filter((t) => !t.done && t.rolledOver && t.date !== null && t.date <= today).length + backlog.length;

  const add = () => {
    const h = parseFloat(hours);
    if (!title.trim() || !(h > 0)) return;
    update((s) => ({ ...s, tasks: [...s.tasks, { id: uid(), title: title.trim(), hours: h, category: cat, date: today, done: false }] }));
    setTitle("");
  };

  return (
    <div className="space-y-4">
      <div className="flex flex-wrap items-start justify-between gap-3">
        <PageTitle title="Daily Tasks" sub="Unchecked tasks roll over at midnight. Optimise spreads carry-overs across the next 5 days within capacity." />
        <Button onClick={runOptimise} disabled={!carry}>
          <Sparkles className="h-4 w-4" /> Optimise Schedule {carry ? `(${carry})` : ""}
        </Button>
      </div>

      <Panel title="Add custom task">
        <div className="flex flex-wrap gap-2">
          <input value={title} onChange={(e) => setTitle(e.target.value)} onKeyDown={(e) => e.key === "Enter" && add()} placeholder="e.g. Implement lock-free SPSC queue" className="min-w-56 flex-1 rounded-md border border-input bg-background px-3 py-2 text-sm outline-none focus:border-primary" />
          <select value={cat} onChange={(e) => setCat(e.target.value as Category)} className="rounded-md border border-input bg-background px-2 text-sm">
            <option value="cpp">C++</option><option value="fpga">FPGA</option><option value="dsa">DSA</option><option value="college">College</option><option value="revision">Revision</option>
          </select>
          <input type="number" step="0.25" min="0.25" value={hours} onChange={(e) => setHours(e.target.value)} className="w-20 rounded-md border border-input bg-background px-2 text-sm" aria-label="Hours" />
          <Button variant="secondary" onClick={add}>Add</Button>
        </div>
      </Panel>

      {backlog.length > 0 && (
        <Panel title={`Backlog (${backlog.length})`}>
          <ul className="space-y-2">{backlog.map((t) => <TaskRow key={t.id} task={t} onToggle={() => toggle(t.id)} onDelete={() => del(t.id)} />)}</ul>
        </Panel>
      )}

      <div className="grid gap-4 md:grid-cols-2 xl:grid-cols-3">
        {days.map((d) => {
          const list = state.tasks.filter((t) => t.date === d);
          const cap = capacity(d, state.festive);
          const load = dayLoad(state.tasks, d);
          const label = d === today ? "TODAY" : parseKey(d).toLocaleDateString(undefined, { weekday: "short", day: "numeric", month: "short" }).toUpperCase();
          return (
            <Panel key={d} title={label} action={<span className={`font-mono text-xs ${load > cap ? "text-destructive" : "text-muted-foreground"}`}>{fmtH(load)} / {cap}h</span>}>
              <Bar value={(load / cap) * 100} className="mb-3" />
              <ul className="space-y-2">
                {list.map((t) => <TaskRow key={t.id} task={t} onToggle={() => toggle(t.id)} onDelete={() => del(t.id)} />)}
                {!list.length && <li className="text-xs text-muted-foreground">Not generated yet — Optimise fills upcoming days.</li>}
              </ul>
            </Panel>
          );
        })}
      </div>
    </div>
  );
}
