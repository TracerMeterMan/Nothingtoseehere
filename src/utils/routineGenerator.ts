import { exerciseLibrary } from "../data/exerciseLibrary";
import { Equipment, Exercise } from "../models/exercise";
import { MuscleGroupId } from "../models/muscle";
import { getExerciseEquipment } from "./exerciseClassification";

export type RoutineConstraints = {
  muscles: MuscleGroupId[];
  setsPerExercise: number;
  exercisesPerMuscle: number;
  equipment: Equipment[];
  allowWeighted: boolean;
};

const CORE_MUSCLES = ["abs", "obliques", "lowerBack", "hipFlexors"];

const LOADED_MODALITIES = ["barbells", "dumbbells", "cables", "machines"];

const isCoreIsolation = (exercise: Exercise) =>
  exercise.type === "isolation" && exercise.muscles.some((muscle) => CORE_MUSCLES.includes(muscle.muscleId));

const isSkillOrCompound = (exercise: Exercise) =>
  exercise.type === "compound" || exercise.type === "skill-static" || exercise.type === "skill-dynamic";

const shuffle = <T,>(items: T[]): T[] => {
  const copy = [...items];
  for (let i = copy.length - 1; i > 0; i--) {
    const j = Math.floor(Math.random() * (i + 1));
    [copy[i], copy[j]] = [copy[j], copy[i]];
  }
  return copy;
};

const loadScore = (exercise: Exercise, muscleId: string) => {
  const contribution = exercise.muscles.find((muscle) => muscle.muscleId === muscleId);
  if (!contribution) return 0;
  return contribution.load === "high" ? 1 : contribution.load === "medium" ? 0.5 : 0.25;
};

export const getEligibleExercises = (constraints: RoutineConstraints) => {
  const available = new Set(constraints.equipment);

  return exerciseLibrary.filter((exercise) => {
    if (exercise.subSkillOf) return false;
    if (exercise.modality === "cardio") return false;
    if (!constraints.allowWeighted && LOADED_MODALITIES.includes(exercise.modality)) return false;

    const required = getExerciseEquipment(exercise);
    if (!constraints.allowWeighted && required.includes("weightBelt")) return false;

    return required.every((item) => item === "none" || available.has(item));
  });
};

export const defaultRepsFor = (exercise: Exercise) => {
  if (exercise.type === "compound") return "5-8";
  if (exercise.type === "skill-dynamic") return "3-6";
  return "8-12";
};

/**
 * Fills a routine from constraints: every targeted muscle receives the requested
 * number of exercises, picks are randomized among the highest-contribution
 * candidates, muscles already covered by an earlier pick are deprioritised so the
 * session stays balanced, and the final order follows the routine rules
 * (compounds and skills first, core isolation last).
 */
export const generateRoutine = (constraints: RoutineConstraints): Exercise[] => {
  const eligible = getEligibleExercises(constraints);
  const picked: Exercise[] = [];
  const pickedIds = new Set<string>();
  const coverage: Record<string, number> = {};

  constraints.muscles.forEach((muscleId) => {
    coverage[muscleId] = 0;
  });

  const musclesByNeed = () =>
    [...constraints.muscles].sort((a, b) => (coverage[a] || 0) - (coverage[b] || 0));

  const target = Math.max(1, constraints.exercisesPerMuscle);

  for (let round = 0; round < target; round++) {
    musclesByNeed().forEach((muscleId) => {
      if (coverage[muscleId] >= round + 1) return;

      const candidates = eligible
        .filter((exercise) => !pickedIds.has(exercise.id) && loadScore(exercise, muscleId) >= 0.5)
        .map((exercise) => {
          const redundancy = exercise.muscles.reduce((sum, muscle) => {
            if (muscle.muscleId === muscleId) return sum;
            const covered = coverage[muscle.muscleId];
            return covered === undefined ? sum : sum + covered * 0.15;
          }, 0);
          return { exercise, score: loadScore(exercise, muscleId) - redundancy + Math.random() * 0.3 };
        })
        .sort((a, b) => b.score - a.score);

      const choice = candidates[0]?.exercise;
      if (!choice) return;

      picked.push(choice);
      pickedIds.add(choice.id);
      choice.muscles.forEach((muscle) => {
        if (coverage[muscle.muscleId] === undefined) return;
        coverage[muscle.muscleId] += muscle.load === "low" ? 0.5 : 1;
      });
    });
  }

  const rank = (exercise: Exercise) => {
    if (isCoreIsolation(exercise)) return 2;
    if (isSkillOrCompound(exercise)) return 0;
    return 1;
  };

  return shuffle(picked).sort((a, b) => rank(a) - rank(b));
};
