import { createFileRoute } from "@tanstack/react-router";
import { PageTitle } from "@/components/app-shell";
import { Bar, Panel } from "@/components/tracker-ui";
import { Slider } from "@/components/ui/slider";
import { useTracker } from "@/lib/store";
import { FPGA_CHAPTERS, fpgaPercent } from "@/lib/tracker";

export const Route = createFileRoute("/fpga")({
  head: () => ({
    meta: [
      { title: "Digital Design & FPGA · HFT Career Tracker" },
      { name: "description", content: "Track Harris & Harris Digital Design and Computer Architecture chapters." },
      { property: "og:title", content: "Digital Design & FPGA · HFT Career Tracker" },
      { property: "og:description", content: "Track Harris & Harris Digital Design and Computer Architecture chapters." },
    ],
  }),
  component: FpgaPage,
});

function FpgaPage() {
  const { state, update } = useTracker();
  return (
    <div className="space-y-4">
      <PageTitle title="Digital Design & FPGA" sub={`Digital Design and Computer Architecture (Harris & Harris) · ${fpgaPercent(state.fpga).toFixed(1)}% overall`} />
      <Bar value={fpgaPercent(state.fpga)} />
      <div className="grid gap-3 md:grid-cols-2">
        {FPGA_CHAPTERS.map((c) => {
          const v = state.fpga[c.n] ?? 0;
          return (
            <Panel key={c.n}>
              <div className="mb-3 flex items-center gap-3">
                <span className="font-mono text-sm text-primary">CH{c.n}</span>
                <span className="flex-1 text-sm">{c.title}</span>
                <span className="font-mono text-xs">{v}%</span>
              </div>
              <Slider value={[v]} max={100} step={5} onValueChange={([x = 0]) => update((s) => ({ ...s, fpga: { ...s.fpga, [c.n]: x } }))} />
            </Panel>
          );
        })}
      </div>
    </div>
  );
}
