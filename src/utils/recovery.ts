import { exerciseLibrary } from "../data/exerciseLibrary";
import { muscleGroups } from "../data/muscleGroups";
import { MuscleRecoveryPreview, RecoveryStatus } from "../models/muscle";

const normalizeName = (name: string) => name.toLowerCase().replace(/[^a-z0-9]/g, "");

const findExercise = (name: string) => {
  const normalized = normalizeName(name);
  return exerciseLibrary.find((exercise) => {
    const libraryName = normalizeName(exercise.name);
    return libraryName === normalized || libraryName.includes(normalized) || normalized.includes(libraryName);
  });
};

const getBaseFatigue = (rpe: number) => (rpe <= 5 ? 0 : rpe <= 7 ? 24 : 48);
const getLoadWeight = (load: string) => (load === "high" ? 1 : load === "medium" ? 0.5 : 0);

export const statusFromRecoveryHours = (hours: number): RecoveryStatus => {
  if (hours <= 1) return "ready";
  if (hours <= 12) return "light";
  if (hours <= 36) return "moderate";
  return "high";
};

/** Shared recovery calculation used by the Recovery and workout-picker screens. */
export const calculateRecovery = (history: any[], now = new Date()) => {
  const maxRemainingByMuscle: Record<string, number> = {};
  muscleGroups.forEach((muscle) => {
    maxRemainingByMuscle[muscle.id] = 0;
  });

  (Array.isArray(history) ? history : []).forEach((session: any) => {
    if (!session?.date) return;
    const sessionDate = new Date(session.date);
    if (Number.isNaN(sessionDate.getTime())) return;

    const elapsedHours = (now.getTime() - sessionDate.getTime()) / 3_600_000;
    if (elapsedHours < 0) return;

    const sets: any[] = Array.isArray(session.sets) ? [...session.sets] : [];
    if (Array.isArray(session.exercises)) {
      session.exercises.forEach((exercise: any) => {
        if (!Array.isArray(exercise.sets)) return;
        exercise.sets.forEach((set: any) => sets.push({
          ...set,
          exercise: set.exercise ?? set.exerciseName ?? exercise.name,
        }));
      });
    }

    sets.forEach((set) => {
      const cleanName = String(set.exerciseName ?? set.exercise ?? "").replace(/\s*\([^)]*\)/g, "").trim();
      const exercise = findExercise(cleanName);
      if (!exercise?.muscles?.length) return;

      const baseFatigue = getBaseFatigue(Number(set.rpe) || 7);
      if (!baseFatigue) return;

      exercise.muscles.forEach((muscle: any) => {
        const loadWeight = getLoadWeight(muscle.load);
        if (!loadWeight) return;
        const remainingHours = Math.max(0, Math.min(48, baseFatigue * loadWeight) - elapsedHours);
        maxRemainingByMuscle[muscle.muscleId] = Math.max(maxRemainingByMuscle[muscle.muscleId] || 0, remainingHours);
      });
    });
  });

  const items: MuscleRecoveryPreview[] = muscleGroups.map((muscle) => {
    const hoursRemaining = Math.round(maxRemainingByMuscle[muscle.id] || 0);
    return {
      muscleId: muscle.id,
      fatigueScore: Math.round((hoursRemaining / 48) * 100),
      status: statusFromRecoveryHours(hoursRemaining),
      hoursRemaining,
    };
  });
  const averageFatigue = items.length ? items.reduce((sum, item) => sum + item.hoursRemaining, 0) / items.length : 0;

  return {
    items,
    overallRecoveryPercent: Math.min(100, Math.max(0, Math.round((1 - averageFatigue / 48) * 100))),
  };
};
