import { describe, expect, it } from "vitest";
import {
  activeSquares,
  addDryDay,
  addSquares,
  ageOutSpending,
  claimDryReward,
  DRY_DAYS_PER_REWARD,
  exchangeTv,
  parseState,
  serializeState,
  SQUARES_PER_TV,
  subtractSquare,
  todayInPacific,
  type ChartState,
} from "./star-chart";

const empty = (): ChartState => ({
  name: "Everett",
  totalSquares: 0,
  dryCount: 0,
  spentSquares: 0,
  spentDate: "",
});

describe("addSquares", () => {
  it("increments totalSquares", () => {
    expect(addSquares(empty(), 1).state.totalSquares).toBe(1);
    expect(addSquares(empty(), 10).state.totalSquares).toBe(10);
  });
});

describe("subtractSquare", () => {
  it("reduces totalSquares", () => {
    const s = addSquares(empty(), 5).state;
    expect(subtractSquare(s).state.totalSquares).toBe(4);
  });

  it("does not go below spent squares", () => {
    const s = exchangeTv(addSquares(empty(), 20).state).state;
    const res = subtractSquare(s);
    expect(res.error).toBeTruthy();
    expect(res.state.totalSquares).toBe(s.totalSquares);
  });
});

describe("exchangeTv", () => {
  it("fails when active < SQUARES_PER_TV", () => {
    expect(exchangeTv(addSquares(empty(), 19).state).error).toBeTruthy();
  });

  it("adds spentSquares, sets spentDate, and reduces active squares", () => {
    const res = exchangeTv(addSquares(empty(), 25).state);
    expect(res.error).toBeUndefined();
    expect(res.state.spentSquares).toBe(SQUARES_PER_TV);
    expect(res.state.spentDate).toBe(todayInPacific());
    expect(activeSquares(res.state)).toBe(5);
  });
});

describe("dry days", () => {
  it("increments dryCount", () => {
    expect(addDryDay(empty()).state.dryCount).toBe(1);
  });

  it("claims reward at threshold", () => {
    const s = { ...empty(), dryCount: DRY_DAYS_PER_REWARD };
    expect(claimDryReward(s).state.dryCount).toBe(0);
  });

  it("fails below threshold", () => {
    const s = { ...empty(), dryCount: 19 };
    expect(claimDryReward(s).error).toBeTruthy();
  });
});

describe("ageOutSpending", () => {
  it("clears stale spending and reduces totalSquares", () => {
    const s = { ...empty(), totalSquares: 30, spentSquares: 20, spentDate: "2000-01-01" };
    const aged = ageOutSpending(s);
    expect(aged.changed).toBe(true);
    expect(aged.state.totalSquares).toBe(10);
    expect(aged.state.spentSquares).toBe(0);
    expect(aged.state.spentDate).toBe("");
  });

  it("keeps today's spending", () => {
    const s = { ...empty(), totalSquares: 20, spentSquares: 20, spentDate: todayInPacific() };
    const aged = ageOutSpending(s);
    expect(aged.changed).toBe(false);
    expect(aged.state.spentSquares).toBe(20);
  });

  it("does nothing when nothing spent", () => {
    const s = { ...empty(), totalSquares: 10, spentSquares: 0, spentDate: "" };
    expect(ageOutSpending(s).changed).toBe(false);
  });
});

describe("parseState / serializeState", () => {
  it("round-trips", () => {
    const src =
      "name: Everett\ntotalSquares: 22\ndryCount: 3\nspentSquares: 20\nspentDate: 2026-10-27";
    const state = parseState(src);
    expect(state.name).toBe("Everett");
    expect(state.totalSquares).toBe(22);
    expect(state.dryCount).toBe(3);
    expect(state.spentSquares).toBe(20);
    expect(state.spentDate).toBe("2026-10-27");
    expect(serializeState(state)).toBe(src);
  });

  it("defaults missing fields", () => {
    const state = parseState("name: Everett\ntotalSquares: 22");
    expect(state.dryCount).toBe(0);
    expect(state.spentSquares).toBe(0);
    expect(state.spentDate).toBe("");
  });
});
