export type TrainingModality = "calisthenics" | "weights" | "hybrid";
export type TrainingStyle = "skills" | "hypertrophy" | "strength" | "explosiveness" | "mixed";
export type WeightUnit = "kg" | "lb";
export type HeightUnit = "cm" | "ft";
export type SkillFocus = "frontLever" | "planche" | "handstand" | "muscleUp";

export interface UserProfile {
  modality: TrainingModality;
  trainingStyle: TrainingStyle;
  trainingDays: 2 | 3 | 4 | 5;
  /** Multiple skills are supported; skillFocus remains for profiles saved by older versions. */
  skillFocuses?: SkillFocus[];
  skillFocus?: SkillFocus;
  weightUnit: WeightUnit;
  heightUnit: HeightUnit;
  weight: number;
  height: number;
  heightInches?: number;
  squat1RM?: number;
  deadlift1RM?: number;
  bench1RM?: number;
  pullUps?: number;
  pushUps?: number;
  dips?: number;
  frontLeverProgression?: string;
  plancheProgression?: string;
  onboardingComplete: boolean;
}

export const USER_PROFILE_KEY = "@user_profile";

export const defaultUserProfile: UserProfile = {
  modality: "hybrid",
  trainingStyle: "mixed",
  trainingDays: 3,
  weightUnit: "kg",
  heightUnit: "cm",
  weight: 0,
  height: 0,
  onboardingComplete: false,
};
