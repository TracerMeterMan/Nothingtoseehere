export type RoutineExercise = {
  exerciseId: string;
  targetSets: number;
  targetReps?: string;
  targetHoldSeconds?: number;
  specialType?: "normal" | "dropset"; 
  dropsetsPerSet?: number;
  supersetWithNext?: boolean;
  instanceId?: string;
  subSkillOf?: string;
};

export type Routine = {
  id: string;
  name: string;
  description: string;
  exerciseCount: number;
  estimatedMinutes: number;
  exercises: RoutineExercise[];
  muscleTags?: string[];
};