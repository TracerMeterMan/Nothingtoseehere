import { RoutineExercise } from "../models/routine";

export type WorkoutExercise = RoutineExercise & { instanceId: string };

export const isSupersetPrimary = (
  exercise: WorkoutExercise,
  exerciseIndex: number,
  exercises: WorkoutExercise[]
): boolean => !!exercise.supersetWithNext && exerciseIndex < exercises.length - 1;

export const isSupersetPartner = (
  exercise: WorkoutExercise,
  exerciseIndex: number,
  exercises: WorkoutExercise[]
): boolean => exerciseIndex > 0 && !!exercises[exerciseIndex - 1]?.supersetWithNext;

export const isInSuperset = (
  exercise: WorkoutExercise,
  exerciseIndex: number,
  exercises: WorkoutExercise[]
): boolean => isSupersetPrimary(exercise, exerciseIndex, exercises) || isSupersetPartner(exercise, exerciseIndex, exercises);

export const getSupersetPartner = (
  exercise: WorkoutExercise,
  exerciseIndex: number,
  exercises: WorkoutExercise[]
): WorkoutExercise | null => {
  if (isSupersetPrimary(exercise, exerciseIndex, exercises)) {
    return exercises[exerciseIndex + 1] ?? null;
  }
  if (isSupersetPartner(exercise, exerciseIndex, exercises)) {
    return exercises[exerciseIndex - 1] ?? null;
  }
  return null;
};

export const getSupersetPrimary = (
  exercise: WorkoutExercise,
  exerciseIndex: number,
  exercises: WorkoutExercise[]
): WorkoutExercise => {
  if (isSupersetPartner(exercise, exerciseIndex, exercises)) {
    return exercises[exerciseIndex - 1];
  }
  return exercise;
};

export const getDropsetCount = (exercise: WorkoutExercise): number => {
  if (exercise.specialType !== "dropset") return 0;
  return Math.max(0, exercise.dropsetsPerSet ?? 1);
};

export const formatSetLabel = (
  setIndex: number,
  dropIndex: number,
  totalDrops: number
): string => {
  if (dropIndex === 0) {
    return `Set ${setIndex + 1}`;
  }
  return `Set ${setIndex + 1} • Drop ${dropIndex}/${totalDrops}`;
};

export const getNextExerciseAfterCompletion = (
  exercises: WorkoutExercise[],
  completedInstanceIds: string[],
  currentExercise: WorkoutExercise,
  exerciseIndex: number
): WorkoutExercise | null => {
  if (isSupersetPrimary(currentExercise, exerciseIndex, exercises)) {
    const partner = exercises[exerciseIndex + 1];
    if (partner) {
      return exercises.find((ex) => !completedInstanceIds.includes(ex.instanceId) && ex.instanceId !== partner.instanceId) ?? null;
    }
  }

  return exercises.find((ex) => !completedInstanceIds.includes(ex.instanceId)) ?? null;
};

export type ExerciseGroup<T extends WorkoutExercise = WorkoutExercise> =
  | { type: "single"; exercise: T; index: number }
  | { type: "superset"; primary: T; partner: T; primaryIndex: number; partnerIndex: number };

export const groupExercisesForDisplay = <T extends WorkoutExercise>(
  exercises: T[]
): ExerciseGroup<T>[] => {
  const groups: ExerciseGroup<T>[] = [];
  let i = 0;

  while (i < exercises.length) {
    const exercise = exercises[i];
    if (isSupersetPrimary(exercise, i, exercises) && exercises[i + 1]) {
      groups.push({
        type: "superset",
        primary: exercise,
        partner: exercises[i + 1],
        primaryIndex: i,
        partnerIndex: i + 1,
      });
      i += 2;
    } else {
      groups.push({ type: "single", exercise, index: i });
      i += 1;
    }
  }

  return groups;
};

export const isSupersetGroupComplete = (
  primary: WorkoutExercise,
  partner: WorkoutExercise,
  completedInstanceIds: string[]
): boolean =>
  completedInstanceIds.includes(primary.instanceId) &&
  completedInstanceIds.includes(partner.instanceId);

export const isSupersetGroupActive = (
  primary: WorkoutExercise,
  partner: WorkoutExercise,
  activeInstanceId: string | null
): boolean =>
  activeInstanceId === primary.instanceId || activeInstanceId === partner.instanceId;
