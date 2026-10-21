import { createFileRoute } from "@tanstack/react-router";
import { PageTitle } from "@/components/app-shell";
import { Bar, Panel, Radar } from "@/components/tracker-ui";
import { useTracker } from "@/lib/store";
import { DSA_TARGET, readiness } from "@/lib/tracker";

export const Route = createFileRoute("/readiness")({
  head: () => ({
    meta: [
      { title: "HFT Readiness Index · HFT Career Tracker" },
      { name: "description", content: "Readiness score across C++, Verilog, DSA and CGPA safety." },
      { property: "og:title", content: "HFT Readiness Index · HFT Career Tracker" },
      { property: "og:description", content: "Readiness score across C++, Verilog, DSA and CGPA safety." },
    ],
  }),
  component: ReadinessPage,
});

function ReadinessPage() {
  const { state, update } = useTracker();
  const r = readiness(state);
  const score = r.reduce((s, x) => s + x.value, 0) / 4;
  return (
    <div className="space-y-4">
      <PageTitle title="HFT Readiness Index" sub="Equal-weighted score across the four core pillars." />
      <div className="grid gap-4 lg:grid-cols-2">
        <Panel title="Profile radar" action={<span className="font-mono text-2xl text-primary">{score.toFixed(0)}/100</span>}>
          <Radar values={r} />
        </Panel>
        <Panel title="Pillars">
          <div className="space-y-4">
            {r.map((p) => (
              <div key={p.label}>
                <div className="mb-1 flex justify-between font-mono text-xs"><span>{p.label}</span><span className="text-primary">{p.value.toFixed(0)}</span></div>
                <Bar value={p.value} />
              </div>
            ))}
            <label className="block pt-2 text-xs text-muted-foreground">
              LeetCode problems solved (target {DSA_TARGET})
              <input type="number" min="0" value={state.leetcode} onChange={(e) => update((s) => ({ ...s, leetcode: Math.max(0, parseInt(e.target.value) || 0) }))} className="mt-1 w-full rounded border border-input bg-background px-2 py-1 font-mono text-sm text-foreground" />
            </label>
          </div>
        </Panel>
      </div>
    </div>
  );
}
