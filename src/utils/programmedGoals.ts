import { UserProfile } from "../models/userProfile";
import { estimateOneRepMax } from "./overload";

export type ProgrammedGoal = {
  id: string;
  title: string;
  current: number;
  target: number;
  unit: string;
  detail: string;
  custom?: boolean;
};

export type CustomProgrammedGoal = Omit<ProgrammedGoal, "current"> & { current?: number };

const toKg = (value: number, unit: string) => unit === "lb" ? value / 2.20462262 : value;
const fromKg = (value: number, unit: string) => unit === "lb" ? value * 2.20462262 : value;
const rounded = (value: number) => Math.round(value * 10) / 10;

const bestLift = (history: any[], keyword: string) => {
  let best = 0;
  history.forEach((session) => (session.sets || []).forEach((set: any) => {
    if (!String(set.exercise || "").toLowerCase().includes(keyword)) return;
    const loadKg = toKg(Number(set.load) || 0, set.loadUnit || "kg");
    const reps = Number(set.reps) || 0;
    best = Math.max(best, estimateOneRepMax(loadKg, reps, Number(set.rpe) || undefined, Number(set.rir) || undefined));
  }));
  return best;
};

const bestBodyweight = (history: any[], keyword: string) => {
  let best = 0;
  history.forEach((session) => (session.sets || []).forEach((set: any) => {
    if (String(set.exercise || "").toLowerCase().includes(keyword)) best = Math.max(best, Number(set.reps) || 0);
  }));
  return best;
};

const bestHold = (history: any[], keyword: string) => {
  let best = 0;
  history.forEach((session) => (session.sets || []).forEach((set: any) => {
    if (String(set.exercise || "").toLowerCase().includes(keyword.toLowerCase())) {
      best = Math.max(best, Number(set.reps) || 0);
    }
  }));
  return best;
};

export const getProgrammedGoals = (profile: UserProfile, history: any[], customGoals: CustomProgrammedGoal[] = []): ProgrammedGoal[] => {
  const goals: ProgrammedGoal[] = [];
  const liftDefinitions = [
    ["squat", "Squat", profile.squat1RM],
    ["bench", "Bench press", profile.bench1RM],
    ["deadlift", "Deadlift", profile.deadlift1RM],
  ] as const;

  liftDefinitions.forEach(([keyword, title, baseline]) => {
    if (!baseline || baseline <= 0) return;
    const currentKg = Math.max(toKg(baseline, profile.weightUnit), bestLift(history, keyword));
    const targetKg = toKg(baseline, profile.weightUnit) * 1.05;
    goals.push({
      id: keyword,
      title: `${title} estimated 1RM`,
      current: rounded(fromKg(currentKg, profile.weightUnit)),
      target: rounded(fromKg(targetKg, profile.weightUnit)),
      unit: profile.weightUnit,
      detail: "Add small, repeatable progress while keeping technique consistent.",
    });
  });

  const bodyweightDefinitions = [
    ["pull", "Strict pull-ups", profile.pullUps],
    ["push", "Push-ups", profile.pushUps],
    ["dip", "Dips", profile.dips],
  ] as const;
  bodyweightDefinitions.forEach(([keyword, title, baseline]) => {
    if (!baseline || baseline <= 0) return;
    const current = Math.max(baseline, bestBodyweight(history, keyword));
    goals.push({
      id: keyword,
      title: `${title} clean-set goal`,
      current,
      target: baseline + Math.max(2, Math.ceil(baseline * 0.2)),
      unit: "reps",
      detail: "Build this with submaximal sets before retesting your max.",
    });
  });

  const skillDefinitions = [
    ["Front lever", profile.frontLeverProgression],
    ["Planche", profile.plancheProgression],
  ] as const;
  skillDefinitions.forEach(([title, progression]) => {
    if (!progression || progression === "Not yet") return;
    goals.push({
      id: title.toLowerCase().replace(" ", "-"),
      title: `${title} hold ownership`,
      current: Math.min(10, bestHold(history, title)),
      target: 10,
      unit: "sec",
      detail: `Accumulate 10 controlled seconds at your ${progression.toLowerCase()} progression before moving up.`,
    });
  });

  return [...goals, ...customGoals.map((goal) => ({ ...goal, current: goal.current || 0, custom: true }))].slice(0, 8);
};
