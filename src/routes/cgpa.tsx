import { createFileRoute } from "@tanstack/react-router";
import { PageTitle } from "@/components/app-shell";
import { Panel, Stat } from "@/components/tracker-ui";
import { useTracker } from "@/lib/store";
import { CGPA_TARGET, cgpa } from "@/lib/tracker";

export const Route = createFileRoute("/cgpa")({
  head: () => ({
    meta: [
      { title: "Academic CGPA · HFT Career Tracker" },
      { name: "description", content: `Semester SGPA log and CGPA against the ${CGPA_TARGET} target.` },
      { property: "og:title", content: "Academic CGPA · HFT Career Tracker" },
      { property: "og:description", content: `Semester SGPA log and CGPA against the ${CGPA_TARGET} target.` },
    ],
  }),
  component: CgpaPage,
});

function CgpaPage() {
  const { state, update } = useTracker();
  const value = cgpa(state.semesters);
  const setSem = (i: number, patch: Partial<{ sgpa: number | null; credits: number }>) =>
    update((s) => ({ ...s, semesters: s.semesters.map((x, j) => (j === i ? { ...x, ...patch } : x)) }));
  const safe = value === null || value >= CGPA_TARGET;
  return (
    <div className="space-y-4">
      <PageTitle title="Academic CGPA" sub={`B.Tech ECE · target CGPA ≥ ${CGPA_TARGET}`} />
      <div className="grid grid-cols-2 gap-4 md:grid-cols-3">
        <Stat label="Current CGPA" value={value === null ? "—" : value.toFixed(2)} sub={safe ? "on target" : "below target"} />
        <Stat label="Target" value={CGPA_TARGET.toFixed(1)} />
        <Stat label="Gap" value={value === null ? "—" : (value - CGPA_TARGET).toFixed(2)} />
      </div>
      <Panel title="Semesters">
        <div className="grid gap-2 sm:grid-cols-2 lg:grid-cols-4">
          {state.semesters.map((s, i) => (
            <div key={i} className="rounded-md border border-border p-3">
              <div className="mb-2 font-mono text-xs text-primary">SEM {i + 1}</div>
              <label className="block text-xs text-muted-foreground">SGPA
                <input type="number" step="0.01" min="0" max="10" value={s.sgpa ?? ""} onChange={(e) => setSem(i, { sgpa: e.target.value === "" ? null : Math.min(10, parseFloat(e.target.value)) })} className="mt-1 w-full rounded border border-input bg-background px-2 py-1 font-mono text-sm text-foreground" />
              </label>
              <label className="mt-2 block text-xs text-muted-foreground">Credits
                <input type="number" min="0" value={s.credits} onChange={(e) => setSem(i, { credits: parseFloat(e.target.value) || 0 })} className="mt-1 w-full rounded border border-input bg-background px-2 py-1 font-mono text-sm text-foreground" />
              </label>
            </div>
          ))}
        </div>
      </Panel>
    </div>
  );
}
