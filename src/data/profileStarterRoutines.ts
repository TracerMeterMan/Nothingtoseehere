import { Routine } from "../models/routine";
import { UserProfile } from "../models/userProfile";

export const createStarterRoutines = (profile: UserProfile): Routine[] => {
  // Replace these with your own hand-crafted routines for users to choose from!
  return [
    {
      id: "custom-starter-1",
      name: "Full Body Foundation",
      description: "A simple, balanced routine to get started.",
      exerciseCount: 3,
      estimatedMinutes: 30,
      exercises: [
        { exerciseId: "push-up", targetSets: 3, targetReps: "8-12" },
        { exerciseId: "bodyweight-squat", targetSets: 3, targetReps: "10-15" },
        { exerciseId: "australian-pull-up", targetSets: 3, targetReps: "8-12" },
      ],
    },
    {
      id: "custom-starter-2",
      name: "Core & Mobility",
      description: "A quick accessory session focused on trunk stability.",
      exerciseCount: 2,
      estimatedMinutes: 20,
      exercises: [
        { exerciseId: "forearm-plank", targetSets: 3, targetHoldSeconds: 30 },
        { exerciseId: "glute-bridge", targetSets: 3, targetReps: "12-15" },
      ],
    },
  ];
};