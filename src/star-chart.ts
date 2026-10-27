/** Reward rules, hardcoded (household-specific). */
export const SQUARES_PER_TV = 20;
export const DRY_DAYS_PER_REWARD = 20;
export const TIMEZONE = "America/Los_Angeles";
export const CHART_TITLE = "Everett's Potty Chart";

export type Exchange = {
  timestamp: number;
  squaresExchanged: number;
  squareRange: [number, number];
  usedDate: string; // YYYY-MM-DD in Pacific time
};

export type ChartState = {
  totalSquares: number;
  dryCount: number;
  exchanges: Exchange[];
};

export type Mutation = { state: ChartState; error?: string };

/** Today's date in Pacific time as YYYY-MM-DD (handles DST). */
export function todayInPacific(): string {
  const formatter = new Intl.DateTimeFormat("en-CA", {
    timeZone: TIMEZONE,
    year: "numeric",
    month: "2-digit",
    day: "2-digit",
  });
  return formatter.format(new Date());
}

export function exchangedSquares(state: ChartState): number {
  return state.exchanges.reduce((sum, e) => sum + e.squaresExchanged, 0);
}

export function activeSquares(state: ChartState): number {
  return state.totalSquares - exchangedSquares(state);
}

/** Remove exchanges whose usedDate is before today, reducing totalSquares accordingly. */
export function ageOutExchanges(state: ChartState): {
  state: ChartState;
  removed: number;
} {
  const today = todayInPacific();
  const removedSquares = state.exchanges
    .filter((e) => e.usedDate < today)
    .reduce((sum, e) => sum + e.squaresExchanged, 0);
  const kept = state.exchanges.filter((e) => e.usedDate >= today);

  return {
    state: {
      totalSquares: Math.max(0, state.totalSquares - removedSquares),
      dryCount: state.dryCount,
      exchanges: kept,
    },
    removed: state.exchanges.length - kept.length,
  };
}

export function addSquares(state: ChartState, amount: number): Mutation {
  return { state: { ...state, totalSquares: state.totalSquares + amount } };
}

export function subtractSquare(state: ChartState): Mutation {
  if (activeSquares(state) <= 0) {
    return { state, error: "No active squares to subtract" };
  }
  const exchanged = exchangedSquares(state);
  return {
    state: { ...state, totalSquares: Math.max(exchanged, state.totalSquares - 1) },
  };
}

export function exchangeTv(state: ChartState): Mutation {
  const active = activeSquares(state);
  if (active < SQUARES_PER_TV) {
    return { state, error: `Need at least ${SQUARES_PER_TV} squares to exchange` };
  }
  const startSquare = exchangedSquares(state) + 1;
  const exchange: Exchange = {
    timestamp: Date.now(),
    squaresExchanged: SQUARES_PER_TV,
    squareRange: [startSquare, startSquare + SQUARES_PER_TV - 1],
    usedDate: todayInPacific(),
  };
  return { state: { ...state, exchanges: [...state.exchanges, exchange] } };
}

export function addDryDay(state: ChartState): Mutation {
  return { state: { ...state, dryCount: state.dryCount + 1 } };
}

export function claimDryReward(state: ChartState): Mutation {
  if (state.dryCount < DRY_DAYS_PER_REWARD) {
    return { state, error: `Need at least ${DRY_DAYS_PER_REWARD} dry days` };
  }
  return { state: { ...state, dryCount: state.dryCount - DRY_DAYS_PER_REWARD } };
}
