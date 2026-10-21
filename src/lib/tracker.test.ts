import { describe, it, expect } from "vitest";
import { initialState, rollover, optimise, applyFestive, capacity, dayLoad, addDays, cppPosition, generateDay, CGPA_TARGET, cgpaSafety } from "./tracker";

const MON = "2026-10-19";
const SAT = "2026-10-24";

describe("tracker rules", () => {
  it("weekday cap 5h, weekend 8h, festive 1h", () => {
    expect(capacity(MON, false)).toBe(5);
    expect(capacity(SAT, false)).toBe(8);
    expect(capacity(SAT, true)).toBe(1);
  });
  it("weekday template totals 4.5h, weekend 7.5h, festive ≤1h", () => {
    const sum = (k: string, f: boolean) => generateDay(k, f).reduce((s, t) => s + t.hours, 0);
    expect(sum(MON, false)).toBe(4.5);
    expect(sum(SAT, false)).toBe(7.5);
    expect(sum(MON, true)).toBeLessThanOrEqual(1);
  });
  it("baseline C++ position is 2.8", () => {
    expect(cppPosition(initialState(MON).cpp)).toBe("2.8");
  });
  it("unchecked tasks roll over to next day", () => {
    let s = rollover(initialState(MON), MON);
    const tue = addDays(MON, 1);
    s = rollover(s, tue);
    expect(s.tasks.filter((t) => t.date === tue && t.rolledOver).length).toBe(3);
  });
  it("optimise never exceeds capacity", () => {
    let s = rollover(initialState(MON), MON);
    s = rollover(s, addDays(MON, 1));
    s = optimise(s, addDays(MON, 1));
    for (let i = 2; i <= 6; i++) {
      const d = addDays(MON, i);
      expect(dayLoad(s.tasks, d)).toBeLessThanOrEqual(capacity(d, false));
    }
  });
  it("festive mode keeps today ≤ 1h", () => {
    let s = rollover(initialState(MON), MON);
    s = rollover(s, addDays(MON, 1));
    s = applyFestive(s, true, addDays(MON, 1));
    expect(dayLoad(s.tasks, addDays(MON, 1))).toBeLessThanOrEqual(1);
  });
  it("CGPA target is 9.8", () => {
    expect(CGPA_TARGET).toBe(9.8);
    expect(cgpaSafety(9.8)).toBe(100);
    expect(cgpaSafety(8.5)).toBeCloseTo(53.57, 1);
    expect(cgpaSafety(7)).toBe(0);
  });
});
