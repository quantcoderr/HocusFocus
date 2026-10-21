import { createFileRoute } from "@tanstack/react-router";
import { Minus, Plus } from "lucide-react";
import { PageTitle } from "@/components/app-shell";
import { Bar, Panel } from "@/components/tracker-ui";
import { useTracker } from "@/lib/store";
import { CPP_CHAPTERS, cppPercent, cppPosition } from "@/lib/tracker";

export const Route = createFileRoute("/cpp")({
  head: () => ({
    meta: [
      { title: "C++ Progress · HFT Career Tracker" },
      { name: "description", content: "Track learncpp.com progress chapter by chapter." },
      { property: "og:title", content: "C++ Progress · HFT Career Tracker" },
      { property: "og:description", content: "Track learncpp.com progress chapter by chapter." },
    ],
  }),
  component: CppPage,
});

function CppPage() {
  const { state, update } = useTracker();
  const set = (n: number, v: number, max: number) => update((s) => ({ ...s, cpp: { ...s.cpp, [n]: Math.max(0, Math.min(max, v)) } }));
  return (
    <div className="space-y-4">
      <PageTitle title="C++ Progress" sub={`learncpp.com · currently at ${cppPosition(state.cpp)} · ${cppPercent(state.cpp).toFixed(1)}% overall`} />
      <Bar value={cppPercent(state.cpp)} />
      <div className="grid gap-2 md:grid-cols-2">
        {CPP_CHAPTERS.map((c) => {
          const v = state.cpp[c.n] ?? 0;
          return (
            <Panel key={c.n} className="p-3">
              <div className="flex items-center gap-3">
                <span className="w-8 font-mono text-sm text-primary">{c.n}</span>
                <span className="flex-1 truncate text-sm">{c.title}</span>
                <button aria-label="Decrease" onClick={() => set(c.n, v - 1, c.lessons)} className="rounded border border-border p-1 hover:border-primary"><Minus className="h-3 w-3" /></button>
                <span className="w-12 text-center font-mono text-xs">{v}/{c.lessons}</span>
                <button aria-label="Increase" onClick={() => set(c.n, v + 1, c.lessons)} className="rounded border border-border p-1 hover:border-primary"><Plus className="h-3 w-3" /></button>
              </div>
              <Bar value={(v / c.lessons) * 100} className="mt-2 h-1" />
            </Panel>
          );
        })}
      </div>
    </div>
  );
}
