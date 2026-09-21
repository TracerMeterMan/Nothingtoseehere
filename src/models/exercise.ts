import { MuscleGroupId } from "./muscle";

export type ExerciseCategory = "skill" | "strength" | "endurance" | "mobility";

export type ExerciseModality = "calisthenics" | "barbells" | "dumbbells" | "cables" | "machines" | "cardio";

export type ExerciseType = "compound" | "isolation" | "skill-static" | "skill-dynamic";

export type Equipment =
  | "none"
  | "pullUpBar"
  | "dipBars"
  | "rings"
  | "parallettes"
  | "wall"
  | "barbell"
  | "rack"
  | "bench"
  | "dumbbells"
  | "cable"
  | "machine"
  | "band"
  | "abWheel"
  | "cardioMachine"
  | "weightBelt";

/** Whether records for an exercise are measured in load/reps or in hold time. */
export type PrMetric = "weight" | "hold";

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
  /** Overrides the equipment inferred from modality and movement naming. */
  equipment?: Equipment[];
  /** Overrides the record metric inferred from the exercise type. */
  prMetric?: PrMetric;
};