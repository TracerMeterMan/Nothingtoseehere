import { exerciseLibrary } from "../data/exerciseLibrary";
import { isHoldExercise } from "./exerciseClassification";

export type OverloadPoint = {
  date: string;
  /** Indexed against the first recorded session of the routine (100 = baseline). */
  index: number;
  avgLoad: number;
  avgReps: number;
  avgHoldSeconds: number;
  exerciseCount: number;
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

/**
 * Per-set overload score. Weighted work uses an Epley-style estimated 1RM so
 * that adding reps and adding weight both register as progress; static holds
 * use hold time scaled by any added load.
 */
const setScore = (set: any) => {
  const load = parseFloat(set?.load) || 0;
  const reps = parseInt(set?.reps, 10) || 0;
  if (reps <= 0) return null;

  const exercise = findExercise(set?.exercise);
  const hold = set?.isHold || isHoldExercise(exercise);

  if (hold) return { key: normalize(set?.exercise), value: reps * (1 + load / 40), load, reps: 0, holdSeconds: reps };
  if (load > 0) return { key: normalize(set?.exercise), value: load * (1 + reps / 30), load, reps, holdSeconds: 0 };
  return { key: normalize(set?.exercise), value: reps, load: 0, reps, holdSeconds: 0 };
};

const sessionScores = (sets: any[]) => {
  const byExercise: Record<string, { total: number; count: number; load: number; reps: number; hold: number }> = {};

  (sets || []).forEach((set) => {
    const scored = setScore(set);
    if (!scored || !scored.key) return;
    const bucket = byExercise[scored.key] || { total: 0, count: 0, load: 0, reps: 0, hold: 0 };
    bucket.total += scored.value;
    bucket.count += 1;
    bucket.load += scored.load;
    bucket.reps += scored.reps;
    bucket.hold += scored.holdSeconds;
    byExercise[scored.key] = bucket;
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
 * Averages every exercise's per-session score against its own baseline session,
 * so the resulting index describes overload across the whole routine rather than
 * being dominated by the heaviest lift.
 */
export const computeRoutineOverload = (
  history: any[],
  routineId?: string | null,
  routineName?: string | null
): OverloadPoint[] => {
  const sessions = getRoutineSessions(history, routineId, routineName);
  if (sessions.length === 0) return [];

  const baseline = sessionScores(sessions[0].sets);

  return sessions.map((session) => {
    const scores = sessionScores(session.sets);
    const keys = Object.keys(scores).filter((key) => baseline[key]?.count);

    const ratios = keys.map((key) => {
      const current = scores[key].total / scores[key].count;
      const base = baseline[key].total / baseline[key].count;
      return base > 0 ? current / base : 1;
    });

    const index = ratios.length ? Math.round((ratios.reduce((sum, r) => sum + r, 0) / ratios.length) * 100) : 100;

    const allKeys = Object.keys(scores);
    const totalSets = allKeys.reduce((sum, key) => sum + scores[key].count, 0) || 1;

    return {
      date: session.date,
      index,
      avgLoad: Math.round((allKeys.reduce((sum, key) => sum + scores[key].load, 0) / totalSets) * 10) / 10,
      avgReps: Math.round((allKeys.reduce((sum, key) => sum + scores[key].reps, 0) / totalSets) * 10) / 10,
      avgHoldSeconds: Math.round((allKeys.reduce((sum, key) => sum + scores[key].hold, 0) / totalSets) * 10) / 10,
      exerciseCount: allKeys.length,
    };
  });
};

export const describeOverload = (points: OverloadPoint[]) => {
  if (points.length < 2) return "Log this routine at least twice to see overload.";

  const latest = points[points.length - 1];
  const previous = points[points.length - 2];
  const sinceStart = latest.index - 100;
  const sinceLast = latest.index - previous.index;

  const driver =
    latest.avgLoad > previous.avgLoad && latest.avgReps > previous.avgReps
      ? "more weight and more reps"
      : latest.avgLoad > previous.avgLoad
      ? "heavier loads"
      : latest.avgReps > previous.avgReps
      ? "extra reps"
      : latest.avgHoldSeconds > previous.avgHoldSeconds
      ? "longer holds"
      : "steady output";

  const trend = sinceLast > 0 ? "up" : sinceLast < 0 ? "down" : "flat";

  return `${sinceStart >= 0 ? "+" : ""}${sinceStart}% vs first session • ${trend} ${
    sinceLast >= 0 ? "+" : ""
  }${sinceLast}% vs last session, driven by ${driver}.`;
};
