import { exerciseLibrary } from "../data/exerciseLibrary";
import { muscleGroups } from "../data/muscleGroups";

export type RoutineMuscleTarget = {
  muscleId: string;
  label: string;
  type: "Primary" | "Secondary";
};

export const getRoutineMuscleTargets = (routineExercises: { exerciseId: string }[]): RoutineMuscleTarget[] => {
  const targets = new Map<string, "Primary" | "Secondary">();

  routineExercises?.forEach(({ exerciseId }) => {
    const exercise = exerciseLibrary.find((candidate) => candidate.id === exerciseId);
    if (!exercise) return;

    exercise.muscles.forEach(({ muscleId, load }) => {
      const isPrimary = exercise.type === "isolation";
      const isSecondary = !isPrimary && (load === "medium" || load === "high");
      if (!isPrimary && !isSecondary) return;

      const previous = targets.get(muscleId);
      if (isPrimary || !previous) {
        targets.set(muscleId, isPrimary ? "Primary" : "Secondary");
      }
    });
  });

  return Array.from(targets.entries()).map(([muscleId, type]) => ({
    muscleId,
    label: muscleGroups.find((muscle) => muscle.id === muscleId)?.name || muscleId,
    type,
  }));
};
