// Pure tracker logic: schedule engine, rollover, rebalancer, scoring.

export type Category = "cpp" | "fpga" | "college" | "dsa" | "revision";

export interface Task {
  id: string;
  title: string;
  category: Category;
  hours: number;
  date: string | null; // null = backlog
  done: boolean;
  rolledOver?: boolean;
  generated?: boolean;
}

export interface Semester {
  sgpa: number | null;
  credits: number;
}

export interface TrackerState {
  tasks: Task[];
  festive: boolean;
  cpp: Record<number, number>; // chapter -> lessons completed
  fpga: Record<number, number>; // chapter -> percent completed
  semesters: Semester[];
  leetcode: number;
  programStart: string; // YYYY-MM-DD
  lastOpened: string | null;
}

export const CPP_CHAPTERS: { n: number; title: string; lessons: number }[] = [
  [0, "Introduction / Getting Started", 13],
  [1, "C++ Basics", 11],
  [2, "C++ Basics: Functions and Files", 13],
  [3, "Debugging C++ Programs", 10],
  [4, "Fundamental Data Types", 12],
  [5, "Constants and Strings", 9],
  [6, "Operators", 8],
  [7, "Scope, Duration, and Linkage", 14],
  [8, "Control Flow", 15],
  [9, "Error Detection and Handling", 6],
  [10, "Type Conversion, Aliases, Deduction", 11],
  [11, "Function Overloading and Templates", 10],
  [12, "Compound Types: References and Pointers", 15],
  [13, "Compound Types: Enums and Structs", 14],
  [14, "Introduction to Classes", 17],
  [15, "More on Classes", 10],
  [16, "Dynamic Arrays: std::vector", 12],
  [17, "Fixed-size Arrays: std::array and C-style", 13],
  [18, "Iterators and Algorithms", 4],
  [19, "Dynamic Allocation", 5],
  [20, "Functions", 7],
  [21, "Operator Overloading", 14],
  [22, "Move Semantics and Smart Pointers", 7],
  [23, "Object Relationships", 7],
  [24, "Inheritance", 12],
  [25, "Virtual Functions", 11],
  [26, "Templates and Classes", 6],
  [27, "Exceptions", 10],
  [28, "Input and Output (I/O)", 9],
].map(([n, title, lessons]) => ({ n: n as number, title: title as string, lessons: lessons as number }));

export const FPGA_CHAPTERS = [
  "From Zero to One",
  "Combinational Logic Design",
  "Sequential Logic Design",
  "Hardware Description Languages",
  "Digital Building Blocks",
  "Architecture",
  "Microarchitecture",
  "Memory Systems",
  "Embedded I/O Systems",
].map((title, i) => ({ n: i + 1, title }));

export const CGPA_TARGET = 9.8;
export const DSA_TARGET = 300;

export function initialState(today: string): TrackerState {
  const cpp: Record<number, number> = {};
  CPP_CHAPTERS.forEach((c) => (cpp[c.n] = 0));
  cpp[0] = CPP_CHAPTERS[0]!.lessons;
  cpp[1] = CPP_CHAPTERS[1]!.lessons;
  cpp[2] = 8; // baseline: 2.8 completed
  const fpga: Record<number, number> = {};
  FPGA_CHAPTERS.forEach((c) => (fpga[c.n] = 0));
  fpga[1] = 25;
  return {
    tasks: [],
    festive: false,
    cpp,
    fpga,
    semesters: Array.from({ length: 8 }, () => ({ sgpa: null, credits: 22 })),
    leetcode: 0,
    programStart: "2026-08-01",
    lastOpened: today,
  };
}

// ---------- dates ----------
export function dateKey(d: Date): string {
  const y = d.getFullYear();
  const m = String(d.getMonth() + 1).padStart(2, "0");
  const day = String(d.getDate()).padStart(2, "0");
  return `${y}-${m}-${day}`;
}
export function parseKey(k: string): Date {
  const [y, m, d] = k.split("-").map(Number);
  return new Date(y!, m! - 1, d!);
}
export function addDays(k: string, n: number): string {
  const d = parseKey(k);
  d.setDate(d.getDate() + n);
  return dateKey(d);
}
export function isWeekend(k: string): boolean {
  const day = parseKey(k).getDay();
  return day === 0 || day === 6;
}

export function capacity(k: string, festive: boolean): number {
  if (festive) return 1;
  return isWeekend(k) ? 8 : 5;
}

let counter = 0;
export function uid(): string {
  counter += 1;
  return `${Date.now().toString(36)}-${counter}-${Math.floor(Math.random() * 1e6).toString(36)}`;
}

export function templateFor(k: string, festive: boolean): Omit<Task, "id" | "date" | "done">[] {
  if (festive)
    return [
      { title: "Quick 20-min revision (C++ or Digital Logic notes)", category: "revision", hours: 0.33, generated: true },
      { title: "Solve 1 LeetCode problem", category: "dsa", hours: 0.67, generated: true },
    ];
  if (isWeekend(k))
    return [
      { title: "C++ Memory / HLS deep dive", category: "cpp", hours: 3, generated: true },
      { title: "FPGA / HDLBits practice", category: "fpga", hours: 2.5, generated: true },
      { title: "DSA / LeetCode session", category: "dsa", hours: 2, generated: true },
    ];
  return [
    { title: "C++ Systems (learncpp + exercises)", category: "cpp", hours: 2, generated: true },
    { title: "Digital Logic / Verilog", category: "fpga", hours: 1.5, generated: true },
    { title: "College coursework / revision", category: "college", hours: 1, generated: true },
  ];
}

export function generateDay(k: string, festive: boolean): Task[] {
  return templateFor(k, festive).map((t) => ({ ...t, id: uid(), date: k, done: false }));
}

export function dayLoad(tasks: Task[], k: string): number {
  return tasks.filter((t) => t.date === k && !t.done).reduce((s, t) => s + t.hours, 0);
}

/** Ensure the day has its generated tasks. */
export function ensureDay(tasks: Task[], k: string, festive: boolean): Task[] {
  if (tasks.some((t) => t.date === k && t.generated)) return tasks;
  return [...tasks, ...generateDay(k, festive)];
}

/**
 * Midnight rollover: unchecked tasks from past days move to today.
 * In festive mode they go to the backlog instead, so today stays ≤ 1h.
 */
export function rollover(state: TrackerState, today: string): TrackerState {
  const tasks = state.tasks.map((t) => {
    if (t.date && t.date < today && !t.done) {
      return { ...t, date: state.festive ? null : today, rolledOver: true };
    }
    return t;
  });
  return { ...state, tasks: ensureDay(tasks, today, state.festive), lastOpened: today };
}

/** Swap today's (and future) unstarted generated tasks for the matching mode template. */
export function applyFestive(state: TrackerState, festive: boolean, today: string): TrackerState {
  let tasks = state.tasks;
  const days = new Set(tasks.filter((t) => t.date && t.date >= today && t.generated && !t.done).map((t) => t.date!));
  days.add(today);
  tasks = tasks.filter((t) => !(t.date && t.date >= today && t.generated && !t.done));
  for (const d of days) {
    if (!tasks.some((t) => t.date === d && t.generated)) tasks = [...tasks, ...generateDay(d, festive)];
  }
  if (festive) {
    // move rollover tasks off today into backlog
    tasks = tasks.map((t) => (t.date === today && t.rolledOver && !t.done ? { ...t, date: null } : t));
  }
  return { ...state, festive, tasks };
}

/**
 * Distribute rollover/backlog tasks across the next `span` days (3–5) without exceeding capacity.
 * Tasks that don't fit anywhere stay in the backlog.
 */
export function optimise(state: TrackerState, today: string, span = 5): TrackerState {
  const days = Array.from({ length: Math.max(3, Math.min(5, span)) }, (_, i) => addDays(today, i + 1));
  let tasks = state.tasks;
  for (const d of days) tasks = ensureDay(tasks, d, state.festive);
  const pending = tasks
    .filter((t) => !t.done && (t.date === null || (t.rolledOver && t.date <= today)))
    .sort((a, b) => b.hours - a.hours);
  const pendingIds = new Set(pending.map((t) => t.id));
  const rest = tasks.filter((t) => !pendingIds.has(t.id));
  const placed: Task[] = [];
  const all = () => [...rest, ...placed];
  for (const t of pending) {
    const candidates = days
      .map((d) => ({ d, load: dayLoad(all(), d) }))
      .filter((c) => c.load + t.hours <= capacity(c.d, state.festive) + 1e-9)
      .sort((a, b) => a.load - b.load);
    placed.push({ ...t, date: candidates.length ? candidates[0]!.d : null, rolledOver: true });
  }
  return { ...state, tasks: all() };
}

// ---------- metrics ----------
export function cppPercent(cpp: Record<number, number>): number {
  const total = CPP_CHAPTERS.reduce((s, c) => s + c.lessons, 0);
  const done = CPP_CHAPTERS.reduce((s, c) => s + Math.min(cpp[c.n] ?? 0, c.lessons), 0);
  return (done / total) * 100;
}
export function cppPosition(cpp: Record<number, number>): string {
  let last = "0.0";
  for (const c of CPP_CHAPTERS) {
    const v = cpp[c.n] ?? 0;
    if (v > 0) last = `${c.n}.${v}`;
    if (v < c.lessons) break;
  }
  return last;
}
export function fpgaPercent(fpga: Record<number, number>): number {
  return FPGA_CHAPTERS.reduce((s, c) => s + (fpga[c.n] ?? 0), 0) / FPGA_CHAPTERS.length;
}
export function cgpa(sems: Semester[]): number | null {
  const filled = sems.filter((s) => s.sgpa !== null && s.credits > 0);
  if (!filled.length) return null;
  const cr = filled.reduce((s, x) => s + x.credits, 0);
  return filled.reduce((s, x) => s + (x.sgpa as number) * x.credits, 0) / cr;
}
/** 100 at/above target, linear down to 0 at 7.0. */
export function cgpaSafety(value: number | null): number {
  if (value === null) return 50;
  if (value >= CGPA_TARGET) return 100;
  return Math.max(0, ((value - 7) / (CGPA_TARGET - 7)) * 100);
}
export function dsaScore(solved: number): number {
  return Math.min(100, (solved / DSA_TARGET) * 100);
}
export function hoursLogged(tasks: Task[]): number {
  return tasks.filter((t) => t.done).reduce((s, t) => s + t.hours, 0);
}
export function streak(tasks: Task[], today: string): number {
  const days = new Set(tasks.filter((t) => t.done && t.date).map((t) => t.date!));
  let k = days.has(today) ? today : addDays(today, -1);
  let n = 0;
  while (days.has(k)) {
    n++;
    k = addDays(k, -1);
  }
  return n;
}

export function readiness(s: TrackerState) {
  return [
    { label: "C++ SYSTEMS", value: cppPercent(s.cpp) },
    { label: "DIGITAL/VERILOG", value: fpgaPercent(s.fpga) },
    { label: "DSA", value: dsaScore(s.leetcode) },
    { label: "CGPA SAFETY", value: cgpaSafety(cgpa(s.semesters)) },
  ];
}
