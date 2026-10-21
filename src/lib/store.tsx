import { createContext, useCallback, useContext, useEffect, useState, type ReactNode } from "react";
import { applyFestive, dateKey, initialState, optimise, rollover, type TrackerState } from "./tracker";

const KEY = "hft-tracker-v1";

interface Ctx {
  state: TrackerState;
  today: string;
  update: (fn: (s: TrackerState) => TrackerState) => void;
  setFestive: (v: boolean) => void;
  runOptimise: () => void;
}

const TrackerContext = createContext<Ctx | null>(null);

export function TrackerProvider({ children }: { children: ReactNode }) {
  const [state, setState] = useState<TrackerState | null>(null);
  const [today, setToday] = useState("");

  useEffect(() => {
    const t = dateKey(new Date());
    let s: TrackerState;
    try {
      const raw = localStorage.getItem(KEY);
      s = raw ? JSON.parse(raw) : initialState(t);
      // one-time fix: old default assumed an Aug 2025 start; user is first year from Aug 2026
      if (s.programStart === "2025-08-01") s.programStart = "2026-08-01";
    } catch {
      s = initialState(t);
    }
    setToday(t);
    setState(rollover(s, t));
    // midnight rollover check
    const id = setInterval(() => {
      const now = dateKey(new Date());
      setToday((prev) => {
        if (prev !== now) setState((st) => (st ? rollover(st, now) : st));
        return now;
      });
    }, 60_000);
    return () => clearInterval(id);
  }, []);

  useEffect(() => {
    if (state) localStorage.setItem(KEY, JSON.stringify(state));
  }, [state]);

  const update = useCallback((fn: (s: TrackerState) => TrackerState) => setState((s) => (s ? fn(s) : s)), []);

  if (!state) {
    return <div className="flex min-h-screen items-center justify-center font-mono text-sm text-muted-foreground">booting tracker…</div>;
  }

  return (
    <TrackerContext.Provider
      value={{
        state,
        today,
        update,
        setFestive: (v) => update((s) => applyFestive(s, v, today)),
        runOptimise: () => update((s) => optimise(s, today)),
      }}
    >
      {children}
    </TrackerContext.Provider>
  );
}

export function useTracker() {
  const c = useContext(TrackerContext);
  if (!c) throw new Error("useTracker outside provider");
  return c;
}
