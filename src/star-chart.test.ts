import { describe, expect, it } from "vitest";
import {
  addDryDay,
  addSquares,
  ageOutExchanges,
  activeSquares,
  claimDryReward,
  DRY_DAYS_PER_REWARD,
  exchangeTv,
  SQUARES_PER_TV,
  subtractSquare,
  todayInPacific,
  type ChartState,
} from "./star-chart";

const empty = (): ChartState => ({ totalSquares: 0, dryCount: 0, exchanges: [] });

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

  it("does not go below exchanged squares", () => {
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

  it("adds an exchange and reduces active squares", () => {
    const res = exchangeTv(addSquares(empty(), 25).state);
    expect(res.error).toBeUndefined();
    expect(res.state.exchanges).toHaveLength(1);
    expect(res.state.exchanges[0].squaresExchanged).toBe(SQUARES_PER_TV);
    expect(activeSquares(res.state)).toBe(5);
  });
});

describe("dry days", () => {
  it("increments dryCount", () => {
    expect(addDryDay(empty()).state.dryCount).toBe(1);
  });

  it("claims reward at threshold", () => {
    const s: ChartState = {
      totalSquares: 0,
      dryCount: DRY_DAYS_PER_REWARD,
      exchanges: [],
    };
    expect(claimDryReward(s).state.dryCount).toBe(0);
  });

  it("fails below threshold", () => {
    const s: ChartState = { totalSquares: 0, dryCount: 19, exchanges: [] };
    expect(claimDryReward(s).error).toBeTruthy();
  });
});

describe("ageOutExchanges", () => {
  it("removes stale exchanges and reduces totalSquares", () => {
    const stale = {
      timestamp: 0,
      squaresExchanged: 20,
      squareRange: [1, 20] as [number, number],
      usedDate: "2000-01-01",
    };
    const s: ChartState = { totalSquares: 30, dryCount: 0, exchanges: [stale] };
    const aged = ageOutExchanges(s);
    expect(aged.removed).toBe(1);
    expect(aged.state.totalSquares).toBe(10);
    expect(aged.state.exchanges).toHaveLength(0);
  });

  it("keeps today's exchanges", () => {
    const today = todayInPacific();
    const fresh = {
      timestamp: Date.now(),
      squaresExchanged: 20,
      squareRange: [1, 20] as [number, number],
      usedDate: today,
    };
    const s: ChartState = { totalSquares: 20, dryCount: 0, exchanges: [fresh] };
    const aged = ageOutExchanges(s);
    expect(aged.removed).toBe(0);
    expect(aged.state.exchanges).toHaveLength(1);
  });
});
