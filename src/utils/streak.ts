export const STREAK_STATE_KEY = "@split_streak_state";

export type StreakState = {
  streak: number;
  lastCreditedDate: string | null;
  /** True when today's credit was handed out for a rest day. */
  creditedRestDay: boolean;
  deloadActive: boolean;
  deloadSince: string | null;
};

export const emptyStreakState: StreakState = {
  streak: 0,
  lastCreditedDate: null,
  creditedRestDay: false,
  deloadActive: false,
  deloadSince: null,
};

export const dateKey = (date: Date = new Date()) => date.toDateString();

const previousDayKey = (date: Date = new Date()) => {
  const previous = new Date(date);
  previous.setDate(previous.getDate() - 1);
  return dateKey(previous);
};

/**
 * A streak survives while the split was followed today or yesterday. Deload
 * freezes the streak: nothing is credited and nothing is lost until it ends.
 */
export const resolveStreak = (state: StreakState, today: Date = new Date()): StreakState => {
  if (state.deloadActive) return state;
  if (!state.lastCreditedDate) return state.streak === 0 ? state : { ...state, streak: 0 };
  if (state.lastCreditedDate === dateKey(today) || state.lastCreditedDate === previousDayKey(today)) return state;
  return { ...state, streak: 0 };
};

/** Credits one day of split adherence. No-op while deloading or already credited. */
export const creditStreakDay = (
  state: StreakState,
  today: Date = new Date(),
  restDay = false
): StreakState => {
  if (state.deloadActive) return state;

  const todayKey = dateKey(today);
  if (state.lastCreditedDate === todayKey) {
    return state.creditedRestDay === restDay ? state : { ...state, creditedRestDay: restDay };
  }

  const continues = state.lastCreditedDate === previousDayKey(today);

  return {
    ...state,
    streak: continues ? state.streak + 1 : 1,
    lastCreditedDate: todayKey,
    creditedRestDay: restDay,
  };
};

/**
 * Takes today's credit back. Used when a day that was credited as a rest day
 * gets work scheduled onto it: the streak drops until that work is finished.
 */
export const revokeRestDayCredit = (state: StreakState, today: Date = new Date()): StreakState => {
  const todayKey = dateKey(today);
  if (state.deloadActive) return state;
  if (state.lastCreditedDate !== todayKey || !state.creditedRestDay) return state;

  return {
    ...state,
    streak: Math.max(0, state.streak - 1),
    lastCreditedDate: state.streak > 1 ? previousDayKey(today) : null,
    creditedRestDay: false,
  };
};

export const startDeload = (state: StreakState, today: Date = new Date()): StreakState => ({
  ...state,
  deloadActive: true,
  deloadSince: dateKey(today),
});

/**
 * Ending a deload resumes counting from the frozen streak value: the days spent
 * deloading are forgiven, but a day already credited stays credited so that
 * toggling deload on and off can never hand out an extra day.
 */
export const endDeload = (state: StreakState, today: Date = new Date()): StreakState => {
  const todayKey = dateKey(today);
  const alreadyCreditedRecently =
    state.lastCreditedDate === todayKey || state.lastCreditedDate === previousDayKey(today);

  return {
    ...state,
    deloadActive: false,
    deloadSince: null,
    lastCreditedDate:
      state.streak > 0 && !alreadyCreditedRecently ? previousDayKey(today) : state.lastCreditedDate,
  };
};
