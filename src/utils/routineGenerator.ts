import { exerciseLibrary } from "../data/exerciseLibrary";
import { Equipment, Exercise } from "../models/exercise";
import { MuscleGroupId } from "../models/muscle";
import { getExerciseEquipment } from "./exerciseClassification";

export type MuscleConstraint = {
  muscleId: MuscleGroupId;
  /** Exercises that must primarily target this muscle. */
  exercises: number;
  setsPerExercise: number;
};

export type RoutineConstraints = {
  muscles: MuscleConstraint[];
  equipment: Equipment[];
  allowWeighted: boolean;
  /** Compounds are opt-in; they can cover two targeted muscles at once. */
  allowCompounds: boolean;
};

export type GeneratedExercise = {
  exercise: Exercise;
  sets: number;
  /** The targeted muscle this pick was made for. */
  muscleId: MuscleGroupId;
};

export type Shortfall = {
  muscleId: MuscleGroupId;
  requested: number;
  available: number;
};

export type GenerationResult = {
  exercises: GeneratedExercise[];
  shortfalls: Shortfall[];
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

/** Muscles an exercise trains as a primary target. */
const primaryMuscles = (exercise: Exercise) =>
  exercise.muscles.filter((muscle) => muscle.load === "high").map((muscle) => muscle.muscleId);

/** Muscles worked beyond stabiliser level — primaries plus secondaries. */
const meaningfulMuscles = (exercise: Exercise) =>
  exercise.muscles.filter((muscle) => muscle.load !== "low").map((muscle) => muscle.muscleId);

export const getEligibleExercises = (constraints: RoutineConstraints) => {
  const available = new Set(constraints.equipment);
  const selected = new Set<string>(constraints.muscles.map((muscle) => muscle.muscleId));

  return exerciseLibrary.filter((exercise) => {
    if (exercise.subSkillOf) return false;
    if (exercise.modality === "cardio") return false;
    if (!constraints.allowCompounds && exercise.type === "compound") return false;
    if (!constraints.allowWeighted && LOADED_MODALITIES.includes(exercise.modality)) return false;

    const required = getExerciseEquipment(exercise);
    if (!constraints.allowWeighted && required.includes("weightBelt")) return false;
    if (!required.every((item) => item === "none" || available.has(item))) return false;

    // Every targeted muscle must be a primary target, and nothing outside the
    // selection may be worked harder than a stabiliser.
    if (!primaryMuscles(exercise).some((muscleId) => selected.has(muscleId))) return false;
    return meaningfulMuscles(exercise).every((muscleId) => selected.has(muscleId));
  });
};

export const defaultRepsFor = (exercise: Exercise) => {
  if (exercise.type === "compound") return "5-8";
  if (exercise.type === "skill-dynamic") return "3-6";
  return "8-12";
};

/**
 * Fills a routine from constraints: each targeted muscle gets the requested
 * number of exercises that train it as a primary mover, compounds (when allowed)
 * are favoured while two targeted muscles still need volume, picks are
 * randomised among the best candidates, and the order follows the routine rules
 * (compounds and skills first, core isolation last). Muscles that cannot be
 * filled are reported instead of being silently dropped.
 */
export const generateRoutine = (constraints: RoutineConstraints): GenerationResult => {
  const eligible = getEligibleExercises(constraints);
  const picked: GeneratedExercise[] = [];
  const pickedIds = new Set<string>();

  const requested: Record<string, number> = {};
  const setsFor: Record<string, number> = {};
  const covered: Record<string, number> = {};

  constraints.muscles.forEach((muscle) => {
    requested[muscle.muscleId] = Math.max(1, muscle.exercises);
    setsFor[muscle.muscleId] = Math.max(1, muscle.setsPerExercise);
    covered[muscle.muscleId] = 0;
  });

  const remaining = (muscleId: string) => requested[muscleId] - (covered[muscleId] || 0);

  const musclesByNeed = () =>
    constraints.muscles
      .map((muscle) => muscle.muscleId)
      .filter((muscleId) => remaining(muscleId) > 0)
      .sort((a, b) => remaining(b) - remaining(a));

  let guard = 0;
  while (musclesByNeed().length > 0 && guard < 200) {
    guard += 1;
    const muscleId = musclesByNeed()[0];

    const candidates = eligible
      .filter((exercise) => !pickedIds.has(exercise.id) && primaryMuscles(exercise).includes(muscleId))
      .map((exercise) => {
        // A compound that also primes another muscle still short on volume is
        // worth more than an isolation that only serves this one.
        const overlap = primaryMuscles(exercise).filter(
          (other) => other !== muscleId && remaining(other) > 0
        ).length;
        const compoundBonus = constraints.allowCompounds && isSkillOrCompound(exercise) ? 0.2 : 0;
        return { exercise, score: 1 + overlap * 0.6 + compoundBonus + Math.random() * 0.4 };
      })
      .sort((a, b) => b.score - a.score);

    const choice = candidates[0]?.exercise;
    if (!choice) {
      // Nothing left for this muscle; stop trying to fill it.
      covered[muscleId] = requested[muscleId];
      continue;
    }

    pickedIds.add(choice.id);
    picked.push({ exercise: choice, sets: setsFor[muscleId], muscleId });
    primaryMuscles(choice).forEach((trained) => {
      if (covered[trained] === undefined) return;
      covered[trained] += 1;
    });
  }

  const shortfalls: Shortfall[] = constraints.muscles
    .map((muscle) => {
      const available = picked.filter((entry) =>
        primaryMuscles(entry.exercise).includes(muscle.muscleId)
      ).length;
      return { muscleId: muscle.muscleId, requested: Math.max(1, muscle.exercises), available };
    })
    .filter((entry) => entry.available < entry.requested);

  const rank = (exercise: Exercise) => {
    if (isCoreIsolation(exercise)) return 2;
    if (isSkillOrCompound(exercise)) return 0;
    return 1;
  };

  return {
    exercises: shuffle(picked).sort((a, b) => rank(a.exercise) - rank(b.exercise)),
    shortfalls,
  };
};
