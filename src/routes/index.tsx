import { createFileRoute, Link } from "@tanstack/react-router";
import { PageTitle } from "@/components/app-shell";
import { Bar, Panel, Radar, Stat, TaskRow, fmtH } from "@/components/tracker-ui";
import { useTracker } from "@/lib/store";
import { cppPercent, cppPosition, fpgaPercent, readiness, hoursLogged, parseKey, streak } from "@/lib/tracker";
import { cn } from "@/lib/utils";

export const Route = createFileRoute("/")({
  head: () => ({
    meta: [
      { title: "Dashboard · HFT Career Tracker" },
      { name: "description", content: "Overview of C++, FPGA, DSA and CGPA progress toward HFT roles." },
      { property: "og:title", content: "Dashboard · HFT Career Tracker" },
      { property: "og:description", content: "Overview of C++, FPGA, DSA and CGPA progress toward HFT roles." },
    ],
  }),
  component: Dashboard,
});

function Dashboard() {
  const { state, today, update } = useTracker();
  const todays = state.tasks.filter((t) => t.date === today);
  const start = parseKey(state.programStart);
  const now = parseKey(today);
  const months = (now.getFullYear() - start.getFullYear()) * 12 + now.getMonth() - start.getMonth();
  const timelinePct = Math.max(0, Math.min(100, (months / 48) * 100));
  const currentYear = Math.min(4, Math.floor(months / 12) + 1);
  const r = readiness(state);
  const score = r.reduce((s, x) => s + x.value, 0) / 4;

  return (
    <div className="space-y-4">
      <PageTitle title="Command Center" sub="B.Tech ECE → HFT / Quant Dev / FPGA Engineering" />
      <div className="grid grid-cols-2 gap-4 lg:grid-cols-4">
        <Stat label="C++ (learncpp)" value={`${cppPercent(state.cpp).toFixed(1)}%`} sub={`at lesson ${cppPosition(state.cpp)}`} />
        <Stat label="Digital Design" value={`${fpgaPercent(state.fpga).toFixed(1)}%`} sub="Harris & Harris" />
        <Stat label="Hours logged" value={fmtH(hoursLogged(state.tasks))} sub="completed tasks" />
        <Stat label="Study streak" value={`${streak(state.tasks, today)}d`} sub="consecutive days" />
      </div>

      <Panel title="4-year timeline">
        <div className="grid grid-cols-4 gap-2">
          {[1, 2, 3, 4].map((y) => (
            <div key={y} className={cn("rounded-md border border-border p-2 text-center font-mono text-xs", y === currentYear ? "border-primary text-primary shadow-glow" : y < currentYear ? "text-foreground" : "text-muted-foreground")}>
              YEAR {y}
            </div>
          ))}
        </div>
        <Bar value={timelinePct} className="mt-3" />
        <div className="mt-1 font-mono text-[11px] text-muted-foreground">{timelinePct.toFixed(0)}% of program elapsed</div>
      </Panel>

      <div className="grid gap-4 lg:grid-cols-3">
        <Panel title="Today's focus queue" className="lg:col-span-2" action={<Link to="/tasks" className="font-mono text-xs text-primary hover:underline">open →</Link>}>
          <ul className="space-y-2">
            {todays.map((t) => (
              <TaskRow key={t.id} task={t} onToggle={() => update((s) => ({ ...s, tasks: s.tasks.map((x) => (x.id === t.id ? { ...x, done: !x.done } : x)) }))} />
            ))}
            {!todays.length && <li className="text-sm text-muted-foreground">Nothing queued.</li>}
          </ul>
        </Panel>
        <Panel title="HFT readiness" action={<span className="font-mono text-lg text-primary">{score.toFixed(0)}</span>}>
          <Radar values={r} />
        </Panel>
      </div>
    </div>
  );
}
