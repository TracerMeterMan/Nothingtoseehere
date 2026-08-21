export type MuscleGroupId =
  // Upper Body
  | "chest"
  | "frontDelts"
  | "sideDelts"
  | "rearDelts"
  | "lats"
  | "traps"
  | "rhomboids"
  | "biceps"
  | "triceps"
  | "forearms"

  // Lower Body
  | "quads"
  | "hamstrings"
  | "glutes"
  | "calves"
  | "hipFlexors"

  // Core
  | "abs"
  | "obliques"
  | "lowerBack";

export type MuscleGroup = {
  id: MuscleGroupId;
  name: string;
};

export type MuscleRecoveryStatus =
  | "ready"
  | "recovering"
  | "notReady";

export type MuscleRecoveryPreview = {
  muscleId: MuscleGroupId;
  status: MuscleRecoveryStatus;
};