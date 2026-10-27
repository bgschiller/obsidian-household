/** Reward rules, hardcoded (household-specific). */
export const SQUARES_PER_TV = 20;
export const DRY_DAYS_PER_REWARD = 20;
export const TIMEZONE = "America/Los_Angeles";

export type ChartState = {
  name: string;
  totalSquares: number;
  dryCount: number;
  /** Squares spent on TV today (always the oldest `spentSquares` squares). */
  spentSquares: number;
  /** Pacific date (YYYY-MM-DD) when `spentSquares` was last changed; "" when none. */
  spentDate: string;
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

export function activeSquares(state: ChartState): number {
  return state.totalSquares - state.spentSquares;
}

/** If yesterday's TV spending is still recorded, retire it (reduce totalSquares). */
export function ageOutSpending(state: ChartState): {
  state: ChartState;
  changed: boolean;
} {
  const today = todayInPacific();
  if (state.spentSquares > 0 && state.spentDate !== "" && state.spentDate < today) {
    return {
      state: {
        ...state,
        totalSquares: Math.max(0, state.totalSquares - state.spentSquares),
        spentSquares: 0,
        spentDate: "",
      },
      changed: true,
    };
  }
  return { state, changed: false };
}

export function addSquares(state: ChartState, amount: number): Mutation {
  return { state: { ...state, totalSquares: state.totalSquares + amount } };
}

export function subtractSquare(state: ChartState): Mutation {
  if (activeSquares(state) <= 0) {
    return { state, error: "No active squares to subtract" };
  }
  return {
    state: { ...state, totalSquares: Math.max(state.spentSquares, state.totalSquares - 1) },
  };
}

export function exchangeTv(state: ChartState): Mutation {
  if (activeSquares(state) < SQUARES_PER_TV) {
    return { state, error: `Need at least ${SQUARES_PER_TV} squares to exchange` };
  }
  return {
    state: {
      ...state,
      spentSquares: state.spentSquares + SQUARES_PER_TV,
      spentDate: todayInPacific(),
    },
  };
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

/** Parse the body of a ```starchart code block into state. Unknown keys ignored. */
export function parseState(source: string): ChartState {
  const state: ChartState = {
    name: "",
    totalSquares: 0,
    dryCount: 0,
    spentSquares: 0,
    spentDate: "",
  };
  for (const rawLine of source.split(/\r?\n/)) {
    const line = rawLine.trim();
    if (line === "") continue;
    const idx = line.indexOf(":");
    if (idx === -1) continue;
    const key = line.slice(0, idx).trim();
    const value = line.slice(idx + 1).trim();
    switch (key) {
      case "name":
        state.name = value;
        break;
      case "totalSquares":
        state.totalSquares = parseInt(value, 10) || 0;
        break;
      case "dryCount":
        state.dryCount = parseInt(value, 10) || 0;
        break;
      case "spentSquares":
        state.spentSquares = parseInt(value, 10) || 0;
        break;
      case "spentDate":
        state.spentDate = value;
        break;
    }
  }
  return state;
}

/** Serialize state back to the `key: value` lines stored inside the block. */
export function serializeState(state: ChartState): string {
  return [
    `name: ${state.name}`,
    `totalSquares: ${state.totalSquares}`,
    `dryCount: ${state.dryCount}`,
    `spentSquares: ${state.spentSquares}`,
    `spentDate: ${state.spentDate}`,
  ].join("\n");
}
