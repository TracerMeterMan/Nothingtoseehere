import { MuscleGroupId } from "./muscle";

export type ExerciseCategory = "skill" | "strength" | "endurance" | "mobility";

export type ExerciseModality = "calisthenics" | "barbells" | "dumbbells" | "cables" | "machines" | "cardio";

export type ExerciseType = "compound" | "isolation" | "skill-static" | "skill-dynamic";

export type MuscleContribution = {
  muscleId: MuscleGroupId;
  load: "low" | "medium" | "high";
};

export type Exercise = {
  id: string;
  name: string;
  category: ExerciseCategory;
  modality: ExerciseModality;
  type: ExerciseType;
  defaultRestSeconds: number;
  muscles: MuscleContribution[];
  subSkillOf?: string;
};