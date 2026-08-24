import { exerciseLibrary } from "../data/exerciseLibrary";
import { isHoldExercise } from "./exerciseClassification";

/** Reference bodyweight used to convert added load on a static hold into time. */
const HOLD_BODYWEIGHT_REFERENCE = 70;

export type ExerciseStrength = {
  key: string;
  name: string;
  isHold: boolean;
  /** Estimated 1RM in kg for dynamic work, hold equivalent in seconds for statics. */
  best: number;
};

export type StrengthPoint = {
  date: string;
  /** Average change across the routine's exercises versus the first session. */
  percentVsFirst: number;
  exercises: ExerciseStrength[];
};

const normalize = (raw?: string) =>
  String(raw || "")
    .trim()
    .toLowerCase()
    .replace(/\s*\(.*?\)\s*$/g, "")
    .replace(/[-\s]+/g, " ")
    .trim();

const findExercise = (rawName?: string) => {
  const key = normalize(rawName);
  if (!key) return undefined;
  return exerciseLibrary.find((entry) => normalize(entry.name) === key || normalize(entry.id) === key);
};

/** Epley 1RM with the RIR/RPE correction used by the PR list. */
export const estimateOneRepMax = (load: number, reps: number, rpe?: number, rir?: number) => {
  if (load <= 0 || reps <= 0) return 0;

  let effectiveReps = reps;
  if (rir !== undefined && rir > 0) effectiveReps = reps + rir;
  else if (rpe !== undefined && rpe >= 5 && rpe <= 10) effectiveReps = reps + (10 - rpe);

  if (effectiveReps <= 1) return load;
  return Math.round(load * (1 + effectiveReps / 30) * 10) / 10;
};

/**
 * Static equivalent of an estimated 1RM: the bodyweight hold time that a
 * weighted hold is worth. Carrying extra load scales the difficulty roughly with
 * total system weight, so a 20s hold with +14kg counts as about 24s unweighted.
 */
export const estimateHoldEquivalent = (holdSeconds: number, load: number) => {
  if (holdSeconds <= 0) return 0;
  return Math.round(holdSeconds * (1 + Math.max(0, load) / HOLD_BODYWEIGHT_REFERENCE) * 10) / 10;
};

const bestPerExercise = (sets: any[]): Record<string, ExerciseStrength> => {
  const byExercise: Record<string, ExerciseStrength> = {};

  (sets || []).forEach((set) => {
    const key = normalize(set?.exercise);
    if (!key) return;

    const load = parseFloat(set?.load) || 0;
    const reps = parseInt(set?.reps, 10) || 0;
    if (reps <= 0) return;

    const library = findExercise(set?.exercise);
    const hold = !!set?.isHold || isHoldExercise(library);
    const value = hold
      ? estimateHoldEquivalent(reps, load)
      : estimateOneRepMax(load, reps, parseFloat(set?.rpe) || undefined, parseFloat(set?.rir) || undefined) ||
        reps;
    if (value <= 0) return;

    const existing = byExercise[key];
    if (!existing || value > existing.best) {
      byExercise[key] = { key, name: library?.name || String(set?.exercise || key), isHold: hold, best: value };
    }
  });

  return byExercise;
};

export const getRoutineSessions = (history: any[], routineId?: string | null, routineName?: string | null) => {
  const name = normalize(routineName || "");
  return (history || [])
    .filter((session) => {
      if (!session?.sets?.length) return false;
      if (routineId && session.routineId === routineId) return true;
      return !!name && normalize(session.routineName) === name;
    })
    .sort((a, b) => new Date(a.date).getTime() - new Date(b.date).getTime());
};

/**
 * Tracks each exercise's best estimated 1RM (or hold equivalent) per session and
 * averages the per-exercise change against the first session, so one heavy lift
 * cannot dominate the routine's trend.
 */
export const computeRoutineStrength = (
  history: any[],
  routineId?: string | null,
  routineName?: string | null
): StrengthPoint[] => {
  const sessions = getRoutineSessions(history, routineId, routineName);
  if (sessions.length === 0) return [];

  const baseline = bestPerExercise(sessions[0].sets);

  return sessions.map((session) => {
    const bests = bestPerExercise(session.sets);
    const exercises = Object.values(bests);

    const ratios = exercises
      .filter((exercise) => (baseline[exercise.key]?.best || 0) > 0)
      .map((exercise) => exercise.best / baseline[exercise.key].best);

    const percentVsFirst = ratios.length
      ? Math.round((ratios.reduce((sum, ratio) => sum + ratio, 0) / ratios.length - 1) * 1000) / 10
      : 0;

    return { date: session.date, percentVsFirst, exercises };
  });
};

const signed = (value: number) => `${value >= 0 ? "+" : ""}${value}%`;

export const describeRoutineStrength = (points: StrengthPoint[]) => {
  if (points.length < 2) {
    return {
      vsFirst: "Log this routine twice to compare sessions.",
      vsLast: "",
      movers: [] as string[],
    };
  }

  const latest = points[points.length - 1];
  const previous = points[points.length - 2];
  const previousByKey = Object.fromEntries(previous.exercises.map((exercise) => [exercise.key, exercise.best]));

  const movers = latest.exercises
    .filter((exercise) => (previousByKey[exercise.key] || 0) > 0)
    .map((exercise) => ({
      name: exercise.name,
      isHold: exercise.isHold,
      best: exercise.best,
      delta: Math.round(((exercise.best / previousByKey[exercise.key] - 1) * 1000)) / 10,
    }))
    .sort((a, b) => Math.abs(b.delta) - Math.abs(a.delta))
    .slice(0, 3)
    .map((mover) =>
      `${mover.name}: ${mover.best}${mover.isHold ? "s hold equiv." : " kg est. 1RM"} (${signed(mover.delta)})`
    );

  return {
    vsFirst: `${signed(latest.percentVsFirst)} vs first session`,
    vsLast: `${signed(Math.round((latest.percentVsFirst - previous.percentVsFirst) * 10) / 10)} vs last session`,
    movers,
  };
};
