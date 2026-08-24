import { exerciseLibrary } from "../data/exerciseLibrary";
import { Equipment, Exercise } from "../models/exercise";
import { MuscleGroupId } from "../models/muscle";
import { getExerciseEquipment } from "./exerciseClassification";

export type RoutineConstraints = {
  muscles: MuscleGroupId[];
  equipment: Equipment[];
  exercisesPerMuscle: number;
  setsPerExercise: number;
  allowWeighted: boolean;
};

export type GeneratedExercise = {
  exercise: Exercise;
  sets: number;
  /** The single targeted muscle this exercise trains hard. */
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

/** Parallettes are ignored as a constraint — the floor works for those moves. */
const IGNORED_EQUIPMENT: Equipment[] = ["none", "parallettes"];

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

const primaryMuscles = (exercise: Exercise) =>
  exercise.muscles.filter((muscle) => muscle.load === "high").map((muscle) => muscle.muscleId);

export const getEligibleExercises = (constraints: RoutineConstraints) => {
  const available = new Set<Equipment>([...constraints.equipment, ...IGNORED_EQUIPMENT]);
  const selected = new Set<string>(constraints.muscles);

  return exerciseLibrary.filter((exercise) => {
    if (exercise.subSkillOf) return false;
    if (exercise.modality === "cardio") return false;
    if (!constraints.allowWeighted && LOADED_MODALITIES.includes(exercise.modality)) return false;

    const required = getExerciseEquipment(exercise);
    if (!constraints.allowWeighted && required.includes("weightBelt")) return false;
    if (!required.every((item) => available.has(item))) return false;

    // One picked muscle carries the exercise: never two of them at high load
    // (that double-counts volume) and never a muscle outside the selection.
    const primaries = primaryMuscles(exercise);
    return primaries.length === 1 && selected.has(primaries[0]);
  });
};

export const defaultRepsFor = (exercise: Exercise) => {
  if (exercise.type === "compound") return "5-8";
  if (exercise.type === "skill-dynamic") return "3-6";
  return "8-12";
};

/**
 * Fills a routine from simple constraints: every selected muscle gets the same
 * number of exercises that train it (and only it) as the primary mover, picks
 * are random, and the order follows the routine rules (compounds and skills
 * first, core isolation last). Muscles that cannot be filled are reported.
 */
export const generateRoutine = (constraints: RoutineConstraints): GenerationResult => {
  const eligible = getEligibleExercises(constraints);
  const perMuscle = Math.max(1, constraints.exercisesPerMuscle);
  const sets = Math.max(1, constraints.setsPerExercise);

  const picked: GeneratedExercise[] = [];
  const shortfalls: Shortfall[] = [];

  constraints.muscles.forEach((muscleId) => {
    const candidates = shuffle(eligible.filter((exercise) => primaryMuscles(exercise).includes(muscleId)));
    const chosen = candidates.slice(0, perMuscle);

    chosen.forEach((exercise) => picked.push({ exercise, sets, muscleId }));

    if (chosen.length < perMuscle) {
      shortfalls.push({ muscleId, requested: perMuscle, available: chosen.length });
    }
  });

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
