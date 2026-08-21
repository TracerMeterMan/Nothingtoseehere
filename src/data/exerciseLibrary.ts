import { Exercise } from "../models/exercise";

export const exerciseLibrary: Exercise[] = [
  // ==========================================
  // 1. CHEST / HORIZONTAL PUSH
  // ==========================================
  {
    id: "barbell-bench-press",
    name: "Barbell Bench Press",
    category: "strength",
    modality: "barbells",
    type: "compound",
    defaultRestSeconds: 180,
    muscles: [
      { muscleId: "chest", load: "high" },
      { muscleId: "triceps", load: "medium" },
      { muscleId: "frontDelts", load: "medium" }
    ]
  },
  {
    id: "incline-barbell-bench-press",
    name: "Incline Barbell Bench Press",
    category: "strength",
    modality: "barbells",
    type: "compound",
    defaultRestSeconds: 180,
    muscles: [
      { muscleId: "chest", load: "high" },
      { muscleId: "frontDelts", load: "high" },
      { muscleId: "triceps", load: "medium" }
    ]
  },
  {
    id: "decline-barbell-bench-press",
    name: "Decline Barbell Bench Press",
    category: "strength",
    modality: "barbells",
    type: "compound",
    defaultRestSeconds: 150,
    muscles: [
      { muscleId: "chest", load: "high" },
      { muscleId: "triceps", load: "medium" }
    ]
  },
  {
    id: "dumbbell-bench-press",
    name: "Dumbbell Bench Press",
    category: "strength",
    modality: "dumbbells",
    type: "compound",
    defaultRestSeconds: 150,
    muscles: [
      { muscleId: "chest", load: "high" },
      { muscleId: "triceps", load: "medium" },
      { muscleId: "frontDelts", load: "low" }
    ]
  },
  {
    id: "incline-dumbbell-press",
    name: "Incline Dumbbell Press",
    category: "strength",
    modality: "dumbbells",
    type: "compound",
    defaultRestSeconds: 150,
    muscles: [
      { muscleId: "chest", load: "high" },
      { muscleId: "frontDelts", load: "high" },
      { muscleId: "triceps", load: "medium" }
    ]
  },
  {
    id: "decline-dumbbell-press",
    name: "Decline Dumbbell Press",
    category: "strength",
    modality: "dumbbells",
    type: "compound",
    defaultRestSeconds: 120,
    muscles: [
      { muscleId: "chest", load: "high" },
      { muscleId: "triceps", load: "low" }
    ]
  },
  {
    id: "dumbbell-chest-fly",
    name: "Dumbbell Chest Fly",
    category: "strength",
    modality: "dumbbells",
    type: "isolation",
    defaultRestSeconds: 90,
    muscles: [
      { muscleId: "chest", load: "high" }
    ]
  },
  {
    id: "incline-dumbbell-fly",
    name: "Incline Dumbbell Fly",
    category: "strength",
    modality: "dumbbells",
    type: "isolation",
    defaultRestSeconds: 90,
    muscles: [
      { muscleId: "chest", load: "high" },
      { muscleId: "frontDelts", load: "low" }
    ]
  },
  {
    id: "cable-crossover-high-to-low",
    name: "Cable Crossover (High to Low)",
    category: "strength",
    modality: "cables",
    type: "isolation",
    defaultRestSeconds: 90,
    muscles: [
      { muscleId: "chest", load: "high" }
    ]
  },
  {
    id: "cable-crossover-low-to-high",
    name: "Cable Crossover (Low to High)",
    category: "strength",
    modality: "cables",
    type: "isolation",
    defaultRestSeconds: 90,
    muscles: [
      { muscleId: "chest", load: "high" },
      { muscleId: "frontDelts", load: "medium" }
    ]
  },
  {
    id: "pec-deck-fly",
    name: "Machine Pec Deck Fly",
    category: "strength",
    modality: "machines",
    type: "isolation",
    defaultRestSeconds: 90,
    muscles: [
      { muscleId: "chest", load: "high" }
    ]
  },
  {
    id: "chest-press-machine",
    name: "Machine Chest Press",
    category: "strength",
    modality: "machines",
    type: "compound",
    defaultRestSeconds: 120,
    muscles: [
      { muscleId: "chest", load: "high" },
      { muscleId: "triceps", load: "medium" }
    ]
  },
  {
    id: "floor-press-barbell",
    name: "Barbell Floor Press",
    category: "strength",
    modality: "barbells",
    type: "compound",
    defaultRestSeconds: 150,
    muscles: [
      { muscleId: "triceps", load: "high" },
      { muscleId: "chest", load: "medium" }
    ]
  },
  {
    id: "close-grip-bench-press",
    name: "Close Grip Bench Press",
    category: "strength",
    modality: "barbells",
    type: "compound",
    defaultRestSeconds: 150,
    muscles: [
      { muscleId: "triceps", load: "high" },
      { muscleId: "chest", load: "high" }
    ]
  },
  {
    id: "spoto-press",
    name: "Spoto Press",
    category: "strength",
    modality: "barbells",
    type: "compound",
    defaultRestSeconds: 180,
    muscles: [
      { muscleId: "chest", load: "high" },
      { muscleId: "triceps", load: "medium" }
    ]
  },
  {
    id: "landmine-chest-press",
    name: "Landmine Chest Press",
    category: "strength",
    modality: "barbells",
    type: "compound",
    defaultRestSeconds: 90,
    muscles: [
      { muscleId: "chest", load: "medium" },
      { muscleId: "frontDelts", load: "medium" }
    ]
  },
  {
    id: "push-up",
    name: "Push-up",
    category: "strength",
    modality: "calisthenics",
    type: "compound",
    defaultRestSeconds: 90,
    muscles: [
      { muscleId: "chest", load: "medium" },
      { muscleId: "triceps", load: "medium" },
      { muscleId: "frontDelts", load: "low" }
    ]
  },
  {
    id: "diamond-push-up",
    name: "Diamond Push-up",
    category: "strength",
    modality: "calisthenics",
    type: "compound",
    defaultRestSeconds: 90,
    muscles: [
      { muscleId: "triceps", load: "high" },
      { muscleId: "chest", load: "medium" }
    ]
  },
  {
    id: "decline-push-up",
    name: "Decline Push-up",
    category: "strength",
    modality: "calisthenics",
    type: "compound",
    defaultRestSeconds: 90,
    muscles: [
      { muscleId: "chest", load: "high" },
      { muscleId: "frontDelts", load: "medium" }
    ]
  },
  {
    id: "deficit-push-up",
    name: "Deficit Push-up",
    category: "strength",
    modality: "calisthenics",
    type: "compound",
    defaultRestSeconds: 105,
    muscles: [
      { muscleId: "chest", load: "high" },
      { muscleId: "triceps", load: "medium" }
    ]
  },
  {
    id: "archer-push-up",
    name: "Archer Push-up",
    category: "strength",
    modality: "calisthenics",
    type: "compound",
    defaultRestSeconds: 120,
    muscles: [
      { muscleId: "chest", load: "high" },
      { muscleId: "triceps", load: "medium" }
    ]
  },
  {
    id: "ring-push-up",
    name: "Ring Push-up",
    category: "strength",
    modality: "calisthenics",
    type: "compound",
    defaultRestSeconds: 120,
    muscles: [
      { muscleId: "chest", load: "high" },
      { muscleId: "abs", load: "medium" },
      { muscleId: "triceps", load: "medium" }
    ]
  },
  {
    id: "one-arm-push-up",
    name: "One-Arm Push-up",
    category: "strength",
    modality: "calisthenics",
    type: "compound",
    defaultRestSeconds: 150,
    muscles: [
      { muscleId: "chest", load: "high" },
      { muscleId: "triceps", load: "high" },
      { muscleId: "obliques", load: "medium" }
    ]
  },
  {
    id: "pseudo-planche-push-up",
    name: "Pseudo Planche Push-up",
    category: "strength",
    modality: "calisthenics",
    type: "compound",
    defaultRestSeconds: 120,
    muscles: [
      { muscleId: "frontDelts", load: "high" },
      { muscleId: "chest", load: "medium" },
      { muscleId: "triceps", load: "medium" }
    ]
  },
  {
    id: "dip",
    name: "Chest Dip",
    category: "strength",
    modality: "calisthenics",
    type: "compound",
    defaultRestSeconds: 150,
    muscles: [
      { muscleId: "chest", load: "high" },
      { muscleId: "triceps", load: "high" },
      { muscleId: "frontDelts", load: "medium" }
    ]
  },
  {
    id: "ring-dip",
    name: "Ring Dip",
    category: "strength",
    modality: "calisthenics",
    type: "compound",
    defaultRestSeconds: 150,
    muscles: [
      { muscleId: "chest", load: "high" },
      { muscleId: "triceps", load: "high" },
      { muscleId: "abs", load: "medium" }
    ]
  },
  {
    id: "straight-bar-dip",
    name: "Straight Bar Dip",
    category: "strength",
    modality: "calisthenics",
    type: "compound",
    defaultRestSeconds: 150,
    muscles: [
      { muscleId: "chest", load: "high" },
      { muscleId: "triceps", load: "high" },
      { muscleId: "frontDelts", load: "medium" }
    ]
  },
  {
    id: "korean-dip",
    name: "Korean Dip",
    category: "strength",
    modality: "calisthenics",
    type: "compound",
    defaultRestSeconds: 150,
    muscles: [
      { muscleId: "chest", load: "high" },
      { muscleId: "triceps", load: "high" },
      { muscleId: "frontDelts", load: "medium" }
    ]
  },

  // ==========================================
  // 2. BACK / VERTICAL & HORIZONTAL PULL
  // ==========================================
  {
    id: "barbell-row",
    name: "Barbell Row",
    category: "strength",
    modality: "barbells",
    type: "compound",
    defaultRestSeconds: 150,
    muscles: [
      { muscleId: "rhomboids", load: "high" },
      { muscleId: "lats", load: "medium" },
      { muscleId: "biceps", load: "medium" },
      { muscleId: "forearms", load: "low" }
    ]
  },
  {
    id: "pendlay-row",
    name: "Pendlay Row",
    category: "strength",
    modality: "barbells",
    type: "compound",
    defaultRestSeconds: 150,
    muscles: [
      { muscleId: "rhomboids", load: "high" },
      { muscleId: "lats", load: "medium" },
      { muscleId: "lowerBack", load: "medium" }
    ]
  },
  {
    id: "lat-pulldown",
    name: "Lat Pulldown",
    category: "strength",
    modality: "machines",
    type: "compound",
    defaultRestSeconds: 105,
    muscles: [
      { muscleId: "lats", load: "high" },
      { muscleId: "rhomboids", load: "medium" },
      { muscleId: "biceps", load: "medium" }
    ]
  },
  {
    id: "underhand-lat-pulldown",
    name: "Underhand Lat Pulldown",
    category: "strength",
    modality: "machines",
    type: "compound",
    defaultRestSeconds: 105,
    muscles: [
      { muscleId: "lats", load: "high" },
      { muscleId: "biceps", load: "high" }
    ]
  },
  {
    id: "chest-supported-dumbbell-row",
    name: "Chest-Supported DB Row",
    category: "strength",
    modality: "dumbbells",
    type: "compound",
    defaultRestSeconds: 120,
    muscles: [
      { muscleId: "rhomboids", load: "high" },
      { muscleId: "lats", load: "medium" },
      { muscleId: "biceps", load: "medium" }
    ]
  },
  {
    id: "single-arm-dumbbell-row",
    name: "Single-Arm Dumbbell Row",
    category: "strength",
    modality: "dumbbells",
    type: "compound",
    defaultRestSeconds: 105,
    muscles: [
      { muscleId: "lats", load: "high" },
      { muscleId: "rhomboids", load: "medium" },
      { muscleId: "biceps", load: "medium" }
    ]
  },
  {
    id: "t-bar-row-machine",
    name: "Machine T-Bar Row",
    category: "strength",
    modality: "machines",
    type: "compound",
    defaultRestSeconds: 135,
    muscles: [
      { muscleId: "rhomboids", load: "high" },
      { muscleId: "lats", load: "medium" },
      { muscleId: "traps", load: "medium" }
    ]
  },
  {
    id: "seated-cable-row-v-bar",
    name: "Seated Cable Row (V-Bar)",
    category: "strength",
    modality: "cables",
    type: "compound",
    defaultRestSeconds: 105,
    muscles: [
      { muscleId: "rhomboids", load: "high" },
      { muscleId: "lats", load: "high" },
      { muscleId: "biceps", load: "medium" }
    ]
  },
  {
    id: "inverted-row-bodyweight",
    name: "Inverted Row",
    category: "strength",
    modality: "calisthenics",
    type: "compound",
    defaultRestSeconds: 90,
    muscles: [
      { muscleId: "rhomboids", load: "high" },
      { muscleId: "biceps", load: "low" }
    ]
  },
  {
    id: "straight-arm-cable-pulldown",
    name: "Straight-Arm Cable Pulldown",
    category: "strength",
    modality: "cables",
    type: "isolation",
    defaultRestSeconds: 90,
    muscles: [
      { muscleId: "lats", load: "high" }
    ]
  },
  {
    id: "dumbbell-pullover",
    name: "Dumbbell Pullover",
    category: "strength",
    modality: "dumbbells",
    type: "isolation",
    defaultRestSeconds: 105,
    muscles: [
      { muscleId: "lats", load: "high" },
      { muscleId: "chest", load: "low" }
    ]
  },
  {
    id: "meadows-row",
    name: "Meadows Row",
    category: "strength",
    modality: "barbells",
    type: "compound",
    defaultRestSeconds: 120,
    muscles: [
      { muscleId: "rhomboids", load: "high" },
      { muscleId: "lats", load: "medium" }
    ]
  },
  {
    id: "kroc-row",
    name: "Kroc Row",
    category: "strength",
    modality: "dumbbells",
    type: "compound",
    defaultRestSeconds: 120,
    muscles: [
      { muscleId: "lats", load: "high" },
      { muscleId: "rhomboids", load: "high" },
      { muscleId: "forearms", load: "high" }
    ]
  },
  {
    id: "rack-pull",
    name: "Rack Pull",
    category: "strength",
    modality: "barbells",
    type: "compound",
    defaultRestSeconds: 180,
    muscles: [
      { muscleId: "traps", load: "high" },
      { muscleId: "lowerBack", load: "high" },
      { muscleId: "forearms", load: "high" }
    ]
  },
  {
    id: "barbell-shrug",
    name: "Barbell Shrug",
    category: "strength",
    modality: "barbells",
    type: "isolation",
    defaultRestSeconds: 90,
    muscles: [
      { muscleId: "traps", load: "high" }
    ]
  },
  {
    id: "dumbbell-shrug",
    name: "Dumbbell Shrug",
    category: "strength",
    modality: "dumbbells",
    type: "isolation",
    defaultRestSeconds: 90,
    muscles: [
      { muscleId: "traps", load: "high" }
    ]
  },
  {
    id: "seal-row-barbell",
    name: "Barbell Seal Row",
    category: "strength",
    modality: "barbells",
    type: "compound",
    defaultRestSeconds: 135,
    muscles: [
      { muscleId: "rhomboids", load: "high" },
      { muscleId: "lats", load: "medium" }
    ]
  },
  {
    id: "cable-high-row",
    name: "Cable High Row",
    category: "strength",
    modality: "cables",
    type: "compound",
    defaultRestSeconds: 105,
    muscles: [
      { muscleId: "lats", load: "high" },
      { muscleId: "rhomboids", load: "medium" }
    ]
  },
  {
    id: "pull-up",
    name: "Pull-up",
    category: "strength",
    modality: "calisthenics",
    type: "compound",
    defaultRestSeconds: 150,
    muscles: [
      { muscleId: "lats", load: "high" },
      { muscleId: "biceps", load: "medium" },
      { muscleId: "rhomboids", load: "medium" }
    ]
  },
  {
    id: "chin-up",
    name: "Chin-up",
    category: "strength",
    modality: "calisthenics",
    type: "compound",
    defaultRestSeconds: 120,
    muscles: [
      { muscleId: "biceps", load: "high" },
      { muscleId: "lats", load: "high" }
    ]
  },
  {
    id: "wide-grip-pull-up",
    name: "Wide Grip Pull-up",
    category: "strength",
    modality: "calisthenics",
    type: "compound",
    defaultRestSeconds: 150,
    muscles: [
      { muscleId: "lats", load: "high" },
      { muscleId: "rhomboids", load: "high" }
    ]
  },
  {
    id: "neutral-grip-pull-up",
    name: "Neutral Grip Pull-up",
    category: "strength",
    modality: "calisthenics",
    type: "compound",
    defaultRestSeconds: 120,
    muscles: [
      { muscleId: "lats", load: "high" },
      { muscleId: "rhomboids", load: "medium" },
      { muscleId: "biceps", load: "medium" }
    ]
  },
  {
    id: "australian-pull-up",
    name: "Australian Pull-up",
    category: "strength",
    modality: "calisthenics",
    type: "compound",
    defaultRestSeconds: 90,
    muscles: [
      { muscleId: "rhomboids", load: "high" },
      { muscleId: "biceps", load: "medium" }
    ]
  },
  {
    id: "scapular-pull-up",
    name: "Scapular Pull-up",
    category: "strength",
    modality: "calisthenics",
    type: "isolation",
    defaultRestSeconds: 90,
    muscles: [
      { muscleId: "rhomboids", load: "high" },
      { muscleId: "traps", load: "medium" }
    ]
  },
  {
    id: "chest-to-bar-pull-up",
    name: "Chest-to-Bar Pull-up",
    category: "strength",
    modality: "calisthenics",
    type: "compound",
    defaultRestSeconds: 150,
    muscles: [
      { muscleId: "lats", load: "high" },
      { muscleId: "rhomboids", load: "high" },
      { muscleId: "biceps", load: "medium" }
    ]
  },
  {
    id: "archer-pull-up",
    name: "Archer Pull-up",
    category: "strength",
    modality: "calisthenics",
    type: "compound",
    defaultRestSeconds: 120,
    muscles: [
      { muscleId: "lats", load: "high" },
      { muscleId: "rhomboids", load: "high" },
      { muscleId: "biceps", load: "medium" }
    ]
  },
  {
    id: "typewriter-pull-up",
    name: "Typewriter Pull-up",
    category: "strength",
    modality: "calisthenics",
    type: "compound",
    defaultRestSeconds: 120,
    muscles: [
      { muscleId: "lats", load: "high" },
      { muscleId: "rhomboids", load: "high" },
      { muscleId: "biceps", load: "medium" }
    ]
  },

  // ==========================================
  // 3. SHOULDERS
  // ==========================================
  {
    id: "overhead-press",
    name: "Overhead Press (OHP)",
    category: "strength",
    modality: "barbells",
    type: "compound",
    defaultRestSeconds: 150,
    muscles: [
      { muscleId: "frontDelts", load: "high" },
      { muscleId: "triceps", load: "medium" },
      { muscleId: "traps", load: "low" }
    ]
  },
  {
    id: "dumbbell-shoulder-press",
    name: "Dumbbell Shoulder Press",
    category: "strength",
    modality: "dumbbells",
    type: "compound",
    defaultRestSeconds: 135,
    muscles: [
      { muscleId: "frontDelts", load: "high" },
      { muscleId: "triceps", load: "medium" }
    ]
  },
  {
    id: "barbell-push-press",
    name: "Barbell Push Press",
    category: "strength",
    modality: "barbells",
    type: "compound",
    defaultRestSeconds: 180,
    muscles: [
      { muscleId: "frontDelts", load: "high" },
      { muscleId: "triceps", load: "medium" },
      { muscleId: "quads", load: "low" }
    ]
  },
  {
    id: "arnold-press",
    name: "Arnold Press",
    category: "strength",
    modality: "dumbbells",
    type: "compound",
    defaultRestSeconds: 120,
    muscles: [
      { muscleId: "frontDelts", load: "high" },
      { muscleId: "sideDelts", load: "medium" },
      { muscleId: "triceps", load: "low" }
    ]
  },
  {
    id: "barbell-upright-row",
    name: "Barbell Upright Row",
    category: "strength",
    modality: "barbells",
    type: "compound",
    defaultRestSeconds: 120,
    muscles: [
      { muscleId: "sideDelts", load: "high" },
      { muscleId: "traps", load: "medium" }
    ]
  },
  {
    id: "barbell-z-press",
    name: "Barbell Z-Press",
    category: "strength",
    modality: "barbells",
    type: "compound",
    defaultRestSeconds: 165,
    muscles: [
      { muscleId: "frontDelts", load: "high" },
      { muscleId: "abs", load: "high" },
      { muscleId: "triceps", load: "medium" }
    ]
  },
  {
    id: "machine-shoulder-press",
    name: "Machine Shoulder Press",
    category: "strength",
    modality: "machines",
    type: "compound",
    defaultRestSeconds: 120,
    muscles: [
      { muscleId: "frontDelts", load: "high" },
      { muscleId: "triceps", load: "medium" }
    ]
  },
  {
    id: "landmine-shoulder-press",
    name: "Landmine Shoulder Press",
    category: "strength",
    modality: "barbells",
    type: "compound",
    defaultRestSeconds: 105,
    muscles: [
      { muscleId: "frontDelts", load: "high" },
      { muscleId: "triceps", load: "medium" }
    ]
  },
  {
    id: "dumbbell-lateral-raise",
    name: "Dumbbell Lateral Raise",
    category: "strength",
    modality: "dumbbells",
    type: "isolation",
    defaultRestSeconds: 90,
    muscles: [
      { muscleId: "sideDelts", load: "high" }
    ]
  },
  {
    id: "dumbbell-rear-delt-fly",
    name: "Dumbbell Rear Delt Fly",
    category: "strength",
    modality: "dumbbells",
    type: "isolation",
    defaultRestSeconds: 90,
    muscles: [
      { muscleId: "rearDelts", load: "high" }
    ]
  },
  {
    id: "machine-rear-delt-fly",
    name: "Machine Rear Delt Fly",
    category: "strength",
    modality: "machines",
    type: "isolation",
    defaultRestSeconds: 90,
    muscles: [
      { muscleId: "rearDelts", load: "high" }
    ]
  },
  {
    id: "cable-face-pull",
    name: "Cable Face Pull",
    category: "strength",
    modality: "cables",
    type: "isolation",
    defaultRestSeconds: 90,
    muscles: [
      { muscleId: "rearDelts", load: "high" },
      { muscleId: "traps", load: "medium" }
    ]
  },
  {
    id: "dumbbell-front-raise",
    name: "Dumbbell Front Raise",
    category: "strength",
    modality: "dumbbells",
    type: "isolation",
    defaultRestSeconds: 90,
    muscles: [
      { muscleId: "frontDelts", load: "high" }
    ]
  },
  {
    id: "pike-push-up",
    name: "Pike Push-up",
    category: "strength",
    modality: "calisthenics",
    type: "compound",
    defaultRestSeconds: 120,
    muscles: [
      { muscleId: "frontDelts", load: "high" },
      { muscleId: "triceps", load: "medium" }
    ]
  },
  {
    id: "elevated-pike-push-up",
    name: "Elevated Pike Push-up",
    category: "strength",
    modality: "calisthenics",
    type: "compound",
    defaultRestSeconds: 120,
    muscles: [
      { muscleId: "frontDelts", load: "high" },
      { muscleId: "triceps", load: "medium" }
    ]
  },
  {
    id: "lateral-raise-machine",
    name: "Machine Lateral Raise",
    category: "strength",
    modality: "machines",
    type: "isolation",
    defaultRestSeconds: 90,
    muscles: [
      { muscleId: "sideDelts", load: "high" }
    ]
  },

  // ==========================================
  // 4. BICEPS & FOREARMS
  // ==========================================
  {
    id: "barbell-curl",
    name: "Barbell Bicep Curl",
    category: "strength",
    modality: "barbells",
    type: "isolation",
    defaultRestSeconds: 105,
    muscles: [
      { muscleId: "biceps", load: "high" },
      { muscleId: "forearms", load: "low" }
    ]
  },
  {
    id: "ez-bar-curl",
    name: "EZ-Bar Bicep Curl",
    category: "strength",
    modality: "barbells",
    type: "isolation",
    defaultRestSeconds: 105,
    muscles: [
      { muscleId: "biceps", load: "high" }
    ]
  },
  {
    id: "dumbbell-bicep-curl",
    name: "Dumbbell Bicep Curl",
    category: "strength",
    modality: "dumbbells",
    type: "isolation",
    defaultRestSeconds: 90,
    muscles: [
      { muscleId: "biceps", load: "high" }
    ]
  },
  {
    id: "dumbbell-hammer-curl",
    name: "Dumbbell Hammer Curl",
    category: "strength",
    modality: "dumbbells",
    type: "isolation",
    defaultRestSeconds: 90,
    muscles: [
      { muscleId: "biceps", load: "high" },
      { muscleId: "forearms", load: "high" }
    ]
  },
  {
    id: "incline-dumbbell-curl",
    name: "Incline Dumbbell Curl",
    category: "strength",
    modality: "dumbbells",
    type: "isolation",
    defaultRestSeconds: 90,
    muscles: [
      { muscleId: "biceps", load: "high" }
    ]
  },
  {
    id: "barbell-preacher-curl",
    name: "Barbell Preacher Curl",
    category: "strength",
    modality: "barbells",
    type: "isolation",
    defaultRestSeconds: 105,
    muscles: [
      { muscleId: "biceps", load: "high" }
    ]
  },
  {
    id: "dumbbell-preacher-curl",
    name: "Dumbbell Preacher Curl",
    category: "strength",
    modality: "dumbbells",
    type: "isolation",
    defaultRestSeconds: 90,
    muscles: [
      { muscleId: "biceps", load: "high" }
    ]
  },
  {
    id: "concentration-curl",
    name: "Concentration Curl",
    category: "strength",
    modality: "dumbbells",
    type: "isolation",
    defaultRestSeconds: 75,
    muscles: [
      { muscleId: "biceps", load: "high" }
    ]
  },
  {
    id: "rope-cable-bicep-curl",
    name: "Rope Cable Bicep Curl",
    category: "strength",
    modality: "cables",
    type: "isolation",
    defaultRestSeconds: 90,
    muscles: [
      { muscleId: "biceps", load: "high" },
      { muscleId: "forearms", load: "medium" }
    ]
  },
  {
    id: "straight-bar-cable-curl",
    name: "Straight Bar Cable Curl",
    category: "strength",
    modality: "cables",
    type: "isolation",
    defaultRestSeconds: 90,
    muscles: [
      { muscleId: "biceps", load: "high" }
    ]
  },
  {
    id: "dumbbell-spider-curl",
    name: "Dumbbell Spider Curl",
    category: "strength",
    modality: "dumbbells",
    type: "isolation",
    defaultRestSeconds: 90,
    muscles: [
      { muscleId: "biceps", load: "high" }
    ]
  },
  {
    id: "bayesian-cable-curl",
    name: "Bayesian Cable Curl",
    category: "strength",
    modality: "cables",
    type: "isolation",
    defaultRestSeconds: 90,
    muscles: [
      { muscleId: "biceps", load: "high" }
    ]
  },
  {
    id: "reverse-barbell-curl",
    name: "Reverse Barbell Curl",
    category: "strength",
    modality: "barbells",
    type: "isolation",
    defaultRestSeconds: 90,
    muscles: [
      { muscleId: "forearms", load: "high" },
      { muscleId: "biceps", load: "medium" }
    ]
  },
  {
    id: "cross-body-hammer-curl",
    name: "Cross-Body Hammer Curl",
    category: "strength",
    modality: "dumbbells",
    type: "isolation",
    defaultRestSeconds: 90,
    muscles: [
      { muscleId: "biceps", load: "high" },
      { muscleId: "forearms", load: "high" }
    ]
  },
  {
    id: "barbell-wrist-curl",
    name: "Barbell Wrist Curl",
    category: "strength",
    modality: "barbells",
    type: "isolation",
    defaultRestSeconds: 75,
    muscles: [
      { muscleId: "forearms", load: "high" }
    ]
  },
  {
    id: "barbell-reverse-wrist-curl",
    name: "Barbell Reverse Wrist Curl",
    category: "strength",
    modality: "barbells",
    type: "isolation",
    defaultRestSeconds: 75,
    muscles: [
      { muscleId: "forearms", load: "high" }
    ]
  },
  {
    id: "farmers-walk",
    name: "Farmer's Walk",
    category: "strength",
    modality: "dumbbells",
    type: "isolation",
    defaultRestSeconds: 120,
    muscles: [
      { muscleId: "forearms", load: "high" },
      { muscleId: "traps", load: "medium" }
    ]
  },

  // ==========================================
  // 5. TRICEPS
  // ==========================================
  {
    id: "rope-tricep-pushdown",
    name: "Rope Tricep Pushdown",
    category: "strength",
    modality: "cables",
    type: "isolation",
    defaultRestSeconds: 90,
    muscles: [
      { muscleId: "triceps", load: "high" }
    ]
  },
  {
    id: "straight-bar-tricep-pushdown",
    name: "Straight Bar Tricep Pushdown",
    category: "strength",
    modality: "cables",
    type: "isolation",
    defaultRestSeconds: 90,
    muscles: [
      { muscleId: "triceps", load: "high" }
    ]
  },
  {
    id: "v-bar-tricep-pushdown",
    name: "V-Bar Tricep Pushdown",
    category: "strength",
    modality: "cables",
    type: "isolation",
    defaultRestSeconds: 105,
    muscles: [
      { muscleId: "triceps", load: "high" }
    ]
  },
  {
    id: "overhead-dumbbell-tricep-extension",
    name: "Overhead DB Tricep Extension",
    category: "strength",
    modality: "dumbbells",
    type: "isolation",
    defaultRestSeconds: 90,
    muscles: [
      { muscleId: "triceps", load: "high" }
    ]
  },
  {
    id: "ez-bar-skull-crusher",
    name: "EZ-Bar Skull Crusher",
    category: "strength",
    modality: "barbells",
    type: "isolation",
    defaultRestSeconds: 105,
    muscles: [
      { muscleId: "triceps", load: "high" }
    ]
  },
  {
    id: "dumbbell-skull-crusher",
    name: "Dumbbell Skull Crusher",
    category: "strength",
    modality: "dumbbells",
    type: "isolation",
    defaultRestSeconds: 90,
    muscles: [
      { muscleId: "triceps", load: "high" }
    ]
  },
  {
    id: "overhead-cable-tricep-extension",
    name: "Overhead Cable Tricep Extension",
    category: "strength",
    modality: "cables",
    type: "isolation",
    defaultRestSeconds: 90,
    muscles: [
      { muscleId: "triceps", load: "high" }
    ]
  },
  {
    id: "dumbbell-tricep-kickback",
    name: "Dumbbell Tricep Kickback",
    category: "strength",
    modality: "dumbbells",
    type: "isolation",
    defaultRestSeconds: 75,
    muscles: [
      { muscleId: "triceps", load: "high" }
    ]
  },
  {
    id: "barbell-jm-press",
    name: "Barbell JM Press",
    category: "strength",
    modality: "barbells",
    type: "compound",
    defaultRestSeconds: 120,
    muscles: [
      { muscleId: "triceps", load: "high" },
      { muscleId: "chest", load: "low" }
    ]
  },
  {
    id: "cross-body-cable-extension",
    name: "Cross-Body Cable Extension",
    category: "strength",
    modality: "cables",
    type: "isolation",
    defaultRestSeconds: 90,
    muscles: [
      { muscleId: "triceps", load: "high" }
    ]
  },
  {
    id: "dumbbell-tate-press",
    name: "Dumbbell Tate Press",
    category: "strength",
    modality: "dumbbells",
    type: "isolation",
    defaultRestSeconds: 90,
    muscles: [
      { muscleId: "triceps", load: "high" }
    ]
  },
  {
    id: "machine-tricep-extension",
    name: "Machine Tricep Extension",
    category: "strength",
    modality: "machines",
    type: "isolation",
    defaultRestSeconds: 90,
    muscles: [
      { muscleId: "triceps", load: "high" }
    ]
  },

  // ==========================================
  // 6. LEGS (QUADS / HAMSTRINGS / GLUTES / CALVES)
  // ==========================================
  {
    id: "barbell-back-squat",
    name: "Barbell Back Squat",
    category: "strength",
    modality: "barbells",
    type: "compound",
    defaultRestSeconds: 180,
    muscles: [
      { muscleId: "quads", load: "high" },
      { muscleId: "glutes", load: "high" },
      { muscleId: "hamstrings", load: "medium" }
    ]
  },
  {
    id: "barbell-front-squat",
    name: "Barbell Front Squat",
    category: "strength",
    modality: "barbells",
    type: "compound",
    defaultRestSeconds: 180,
    muscles: [
      { muscleId: "quads", load: "high" },
      { muscleId: "abs", load: "medium" },
      { muscleId: "lowerBack", load: "medium" }
    ]
  },
  {
    id: "romanian-deadlift",
    name: "Romanian Deadlift (RDL)",
    category: "strength",
    modality: "barbells",
    type: "compound",
    defaultRestSeconds: 150,
    muscles: [
      { muscleId: "hamstrings", load: "high" },
      { muscleId: "glutes", load: "high" },
      { muscleId: "lowerBack", load: "medium" }
    ]
  },
  {
    id: "conventional-deadlift",
    name: "Conventional Deadlift",
    category: "strength",
    modality: "barbells",
    type: "compound",
    defaultRestSeconds: 210,
    muscles: [
      { muscleId: "lowerBack", load: "high" },
      { muscleId: "hamstrings", load: "high" },
      { muscleId: "glutes", load: "high" },
      { muscleId: "forearms", load: "high" }
    ]
  },
  {
    id: "sumo-deadlift",
    name: "Sumo Deadlift",
    category: "strength",
    modality: "barbells",
    type: "compound",
    defaultRestSeconds: 210,
    muscles: [
      { muscleId: "glutes", load: "high" },
      { muscleId: "quads", load: "medium" },
      { muscleId: "hamstrings", load: "medium" }
    ]
  },
  {
    id: "bulgarian-split-squat",
    name: "Bulgarian Split Squat",
    category: "strength",
    modality: "dumbbells",
    type: "compound",
    defaultRestSeconds: 120,
    muscles: [
      { muscleId: "quads", load: "high" },
      { muscleId: "glutes", load: "high" }
    ]
  },
  {
    id: "leg-press-machine",
    name: "Machine Leg Press",
    category: "strength",
    modality: "machines",
    type: "compound",
    defaultRestSeconds: 150,
    muscles: [
      { muscleId: "quads", load: "high" },
      { muscleId: "glutes", load: "medium" }
    ]
  },
  {
    id: "hack-squat-machine",
    name: "Machine Hack Squat",
    category: "strength",
    modality: "machines",
    type: "compound",
    defaultRestSeconds: 150,
    muscles: [
      { muscleId: "quads", load: "high" },
      { muscleId: "glutes", load: "medium" }
    ]
  },
  {
    id: "leg-extension-machine",
    name: "Machine Leg Extension",
    category: "strength",
    modality: "machines",
    type: "isolation",
    defaultRestSeconds: 90,
    muscles: [
      { muscleId: "quads", load: "high" }
    ]
  },
  {
    id: "seated-leg-curl-machine",
    name: "Machine Seated Leg Curl",
    category: "strength",
    modality: "machines",
    type: "isolation",
    defaultRestSeconds: 90,
    muscles: [
      { muscleId: "hamstrings", load: "high" }
    ]
  },
  {
    id: "lying-leg-curl-machine",
    name: "Machine Lying Leg Curl",
    category: "strength",
    modality: "machines",
    type: "isolation",
    defaultRestSeconds: 90,
    muscles: [
      { muscleId: "hamstrings", load: "high" }
    ]
  },
  {
    id: "dumbbell-lunges",
    name: "Dumbbell Walking Lunges",
    category: "strength",
    modality: "dumbbells",
    type: "compound",
    defaultRestSeconds: 120,
    muscles: [
      { muscleId: "quads", load: "high" },
      { muscleId: "glutes", load: "high" }
    ]
  },
  {
    id: "barbell-hip-thrust",
    name: "Barbell Hip Thrust",
    category: "strength",
    modality: "barbells",
    type: "compound",
    defaultRestSeconds: 150,
    muscles: [
      { muscleId: "glutes", load: "high" },
      { muscleId: "hamstrings", load: "medium" }
    ]
  },
  {
    id: "standing-calf-raise",
    name: "Standing Calf Raise",
    category: "strength",
    modality: "dumbbells",
    type: "isolation",
    defaultRestSeconds: 75,
    muscles: [
      { muscleId: "calves", load: "high" }
    ]
  },
  {
    id: "seated-calf-raise-machine",
    name: "Machine Seated Calf Raise",
    category: "strength",
    modality: "machines",
    type: "isolation",
    defaultRestSeconds: 75,
    muscles: [
      { muscleId: "calves", load: "high" }
    ]
  },
  {
    id: "good-morning-bb",
    name: "Barbell Good Morning",
    category: "strength",
    modality: "barbells",
    type: "compound",
    defaultRestSeconds: 120,
    muscles: [
      { muscleId: "lowerBack", load: "high" },
      { muscleId: "hamstrings", load: "high" },
      { muscleId: "glutes", load: "medium" }
    ]
  },
  {
    id: "bodyweight-squat",
    name: "Bodyweight Squat",
    category: "strength",
    modality: "calisthenics",
    type: "compound",
    defaultRestSeconds: 90,
    muscles: [
      { muscleId: "quads", load: "high" },
      { muscleId: "glutes", load: "medium" }
    ]
  },
  {
    id: "jump-squat",
    name: "Jump Squat",
    category: "strength",
    modality: "calisthenics",
    type: "compound",
    defaultRestSeconds: 90,
    muscles: [
      { muscleId: "quads", load: "high" },
      { muscleId: "glutes", load: "medium" },
      { muscleId: "calves", load: "low" }
    ]
  },
  {
    id: "nordic-hamstring-curl",
    name: "Nordic Hamstring Curl",
    category: "strength",
    modality: "calisthenics",
    type: "isolation",
    defaultRestSeconds: 120,
    muscles: [
      { muscleId: "hamstrings", load: "high" }
    ]
  },
  {
    id: "shrimp-squat",
    name: "Shrimp Squat",
    category: "strength",
    modality: "calisthenics",
    type: "compound",
    defaultRestSeconds: 120,
    muscles: [
      { muscleId: "quads", load: "high" },
      { muscleId: "glutes", load: "medium" }
    ]
  },
  {
    id: "natural-leg-extension",
    name: "Natural Leg Extension",
    category: "strength",
    modality: "calisthenics",
    type: "isolation",
    defaultRestSeconds: 90,
    muscles: [
      { muscleId: "quads", load: "high" }
    ]
  },

  // ==========================================
  // 7. CORE & CARDIO
  // ==========================================
  {
    id: "hanging-leg-raise",
    name: "Hanging Leg Raise",
    category: "strength",
    modality: "calisthenics",
    type: "compound",
    defaultRestSeconds: 90,
    muscles: [
      { muscleId: "abs", load: "high" },
      { muscleId: "hipFlexors", load: "high" },
      { muscleId: "forearms", load: "medium" }
    ]
  },
  {
    id: "ab-wheel-rollout",
    name: "Ab Wheel Rollout",
    category: "strength",
    modality: "calisthenics",
    type: "compound",
    defaultRestSeconds: 90,
    muscles: [
      { muscleId: "abs", load: "high" },
      { muscleId: "lats", load: "low" }
    ]
  },
  {
    id: "cable-crunch",
    name: "Cable Crunch",
    category: "strength",
    modality: "cables",
    type: "isolation",
    defaultRestSeconds: 75,
    muscles: [
      { muscleId: "abs", load: "high" }
    ]
  },
  {
    id: "forearm-plank",
    name: "Forearm Plank",
    category: "strength",
    modality: "calisthenics",
    type: "isolation",
    defaultRestSeconds: 60,
    muscles: [
      { muscleId: "abs", load: "high" },
      { muscleId: "lowerBack", load: "low" }
    ]
  },
  {
    id: "lying-leg-raise-alt",
    name: "Lying Leg Raise",
    category: "strength",
    modality: "calisthenics",
    type: "isolation",
    defaultRestSeconds: 90,
    muscles: [
      { muscleId: "hipFlexors", load: "high" },
      { muscleId: "abs", load: "medium" }
    ]
  },
  {
    id: "hanging-knee-raise-twist-alt",
    name: "Hanging Knee Raise with Twist",
    category: "strength",
    modality: "calisthenics",
    type: "compound",
    defaultRestSeconds: 90,
    muscles: [
      { muscleId: "obliques", load: "high" },
      { muscleId: "abs", load: "medium" },
      { muscleId: "hipFlexors", load: "high" }
    ]
  },
  {
    id: "toes-to-bar",
    name: "Toes-to-Bar",
    category: "strength",
    modality: "calisthenics",
    type: "compound",
    defaultRestSeconds: 90,
    muscles: [
      { muscleId: "abs", load: "high" },
      { muscleId: "hipFlexors", load: "high" }
    ]
  },
  {
    id: "treadmill-run",
    name: "Treadmill Run",
    category: "endurance",
    modality: "cardio",
    type: "compound",
    defaultRestSeconds: 0,
    muscles: [
      { muscleId: "quads", load: "low" },
      { muscleId: "calves", load: "medium" }
    ]
  },
  {
    id: "rowing-machine",
    name: "Rowing Machine",
    category: "endurance",
    modality: "cardio",
    type: "compound",
    defaultRestSeconds: 0,
    muscles: [
      { muscleId: "lats", load: "low" },
      { muscleId: "rhomboids", load: "low" }
    ]
  },

  // ==========================================
  // 8. CALISTHENICS SKILLS & PROGRESSIONS
  // ==========================================

  // --- Planche Tree ---
  {
    id: "frog-stand",
    name: "Frog Stand",
    category: "skill",
    modality: "calisthenics",
    type: "skill-static",
    subSkillOf: "planche-hold",
    defaultRestSeconds: 90,
    muscles: [
      { muscleId: "abs", load: "medium" },
      { muscleId: "frontDelts", load: "medium" },
      { muscleId: "triceps", load: "medium" }
    ]
  },
  {
    id: "planche-lean",
    name: "Planche Lean",
    category: "skill",
    modality: "calisthenics",
    type: "skill-static",
    subSkillOf: "planche-hold",
    defaultRestSeconds: 90,
    muscles: [
      { muscleId: "abs", load: "medium" },
      { muscleId: "frontDelts", load: "high" },
      { muscleId: "triceps", load: "medium" }
    ]
  },
  {
    id: "tuck-planche-hold",
    name: "Tuck Planche Hold",
    category: "skill",
    modality: "calisthenics",
    type: "skill-static",
    subSkillOf: "planche-hold",
    defaultRestSeconds: 90,
    muscles: [
      { muscleId: "abs", load: "high" },
      { muscleId: "frontDelts", load: "high" },
      { muscleId: "triceps", load: "high" }
    ]
  },
  {
    id: "advanced-tuck-planche-hold",
    name: "Advanced Tuck Planche Hold",
    category: "skill",
    modality: "calisthenics",
    type: "skill-static",
    subSkillOf: "planche-hold",
    defaultRestSeconds: 120,
    muscles: [
      { muscleId: "abs", load: "high" },
      { muscleId: "frontDelts", load: "high" },
      { muscleId: "triceps", load: "high" }
    ]
  },
  {
    id: "straddle-planche-hold",
    name: "Straddle Planche Hold",
    category: "skill",
    modality: "calisthenics",
    type: "skill-static",
    subSkillOf: "planche-hold",
    defaultRestSeconds: 150,
    muscles: [
      { muscleId: "abs", load: "high" },
      { muscleId: "frontDelts", load: "high" },
      { muscleId: "triceps", load: "high" },
      { muscleId: "lowerBack", load: "medium" }
    ]
  },
  {
    id: "planche-hold",
    name: "Full Planche Hold",
    category: "skill",
    modality: "calisthenics",
    type: "skill-static",
    defaultRestSeconds: 180,
    muscles: [
      { muscleId: "abs", load: "high" },
      { muscleId: "frontDelts", load: "high" },
      { muscleId: "triceps", load: "high" },
      { muscleId: "lowerBack", load: "high" }
    ]
  },

  // Dynamic Planche
  {
    id: "tuck-planche-push-up",
    name: "Tuck Planche Push-up",
    category: "skill",
    modality: "calisthenics",
    type: "skill-dynamic",
    subSkillOf: "planche-push-up",
    defaultRestSeconds: 120,
    muscles: [
      { muscleId: "chest", load: "high" },
      { muscleId: "frontDelts", load: "high" },
      { muscleId: "triceps", load: "high" }
    ]
  },
  {
    id: "straddle-planche-push-up",
    name: "Straddle Planche Push-up",
    category: "skill",
    modality: "calisthenics",
    type: "skill-dynamic",
    subSkillOf: "planche-push-up",
    defaultRestSeconds: 150,
    muscles: [
      { muscleId: "chest", load: "high" },
      { muscleId: "frontDelts", load: "high" },
      { muscleId: "triceps", load: "high" }
    ]
  },
  {
    id: "planche-push-up",
    name: "Full Planche Push-up",
    category: "skill",
    modality: "calisthenics",
    type: "skill-dynamic",
    defaultRestSeconds: 180,
    muscles: [
      { muscleId: "chest", load: "high" },
      { muscleId: "frontDelts", load: "high" },
      { muscleId: "triceps", load: "high" }
    ]
  },

  // --- Front Lever Tree ---
  {
    id: "tuck-front-lever-hold",
    name: "Tuck Front Lever Hold",
    category: "skill",
    modality: "calisthenics",
    type: "skill-static",
    subSkillOf: "front-lever-hold",
    defaultRestSeconds: 90,
    muscles: [
      { muscleId: "lats", load: "high" },
      { muscleId: "abs", load: "high" },
      { muscleId: "rhomboids", load: "medium" }
    ]
  },
  {
    id: "advanced-tuck-front-lever-hold",
    name: "Advanced Tuck Front Lever Hold",
    category: "skill",
    modality: "calisthenics",
    type: "skill-static",
    subSkillOf: "front-lever-hold",
    defaultRestSeconds: 120,
    muscles: [
      { muscleId: "lats", load: "high" },
      { muscleId: "abs", load: "high" },
      { muscleId: "rhomboids", load: "medium" }
    ]
  },
  {
    id: "straddle-front-lever-hold",
    name: "Straddle Front Lever Hold",
    category: "skill",
    modality: "calisthenics",
    type: "skill-static",
    subSkillOf: "front-lever-hold",
    defaultRestSeconds: 150,
    muscles: [
      { muscleId: "lats", load: "high" },
      { muscleId: "abs", load: "high" },
      { muscleId: "rhomboids", load: "medium" }
    ]
  },
  {
    id: "front-lever-hold",
    name: "Full Front Lever Hold",
    category: "skill",
    modality: "calisthenics",
    type: "skill-static",
    defaultRestSeconds: 180,
    muscles: [
      { muscleId: "lats", load: "high" },
      { muscleId: "abs", load: "high" },
      { muscleId: "rhomboids", load: "medium" }
    ]
  },
  {
    id: "front-lever-pull-up",
    name: "Front Lever Pull-up",
    category: "skill",
    modality: "calisthenics",
    type: "skill-dynamic",
    defaultRestSeconds: 180,
    muscles: [
      { muscleId: "lats", load: "high" },
      { muscleId: "rhomboids", load: "high" },
      { muscleId: "biceps", load: "medium" }
    ]
  },

  // --- Back Lever Tree ---
  {
    id: "skin-the-cat",
    name: "Skin the Cat",
    category: "skill",
    modality: "calisthenics",
    type: "skill-dynamic",
    subSkillOf: "back-lever-hold",
    defaultRestSeconds: 90,
    muscles: [
      { muscleId: "lats", load: "medium" },
      { muscleId: "abs", load: "medium" }
    ]
  },
  {
    id: "tuck-back-lever-hold",
    name: "Tuck Back Lever Hold",
    category: "skill",
    modality: "calisthenics",
    type: "skill-static",
    subSkillOf: "back-lever-hold",
    defaultRestSeconds: 90,
    muscles: [
      { muscleId: "lats", load: "high" },
      { muscleId: "abs", load: "high" },
      { muscleId: "lowerBack", load: "medium" }
    ]
  },
  {
    id: "straddle-back-lever-hold",
    name: "Straddle Back Lever Hold",
    category: "skill",
    modality: "calisthenics",
    type: "skill-static",
    subSkillOf: "back-lever-hold",
    defaultRestSeconds: 150,
    muscles: [
      { muscleId: "lats", load: "high" },
      { muscleId: "abs", load: "high" },
      { muscleId: "lowerBack", load: "medium" }
    ]
  },
  {
    id: "back-lever-hold",
    name: "Full Back Lever Hold",
    category: "skill",
    modality: "calisthenics",
    type: "skill-static",
    defaultRestSeconds: 180,
    muscles: [
      { muscleId: "lats", load: "high" },
      { muscleId: "abs", load: "high" },
      { muscleId: "lowerBack", load: "medium" }
    ]
  },

  // --- Handstand & HSPU Tree ---
  {
    id: "handstand-hold",
    name: "Freestanding Handstand Hold",
    category: "skill",
    modality: "calisthenics",
    type: "skill-static",
    defaultRestSeconds: 90,
    muscles: [
      { muscleId: "frontDelts", load: "high" },
      { muscleId: "traps", load: "medium" },
      { muscleId: "abs", load: "medium" }
    ]
  },
  {
    id: "handstand-push-up",
    name: "Wall Handstand Push-up",
    category: "skill",
    modality: "calisthenics",
    type: "skill-dynamic",
    defaultRestSeconds: 150,
    muscles: [
      { muscleId: "frontDelts", load: "high" },
      { muscleId: "triceps", load: "high" },
      { muscleId: "traps", load: "medium" }
    ]
  },
  {
    id: "freestanding-handstand-push-up",
    name: "Freestanding Handstand Push-up",
    category: "skill",
    modality: "calisthenics",
    type: "skill-dynamic",
    subSkillOf: "handstand-push-up",
    defaultRestSeconds: 180,
    muscles: [
      { muscleId: "frontDelts", load: "high" },
      { muscleId: "triceps", load: "high" },
      { muscleId: "traps", load: "medium" }
    ]
  },
  {
    id: "straddle-handstand-press",
    name: "Straddle Handstand Press",
    category: "skill",
    modality: "calisthenics",
    type: "skill-dynamic",
    defaultRestSeconds: 150,
    muscles: [
      { muscleId: "frontDelts", load: "high" },
      { muscleId: "triceps", load: "high" },
      { muscleId: "abs", load: "medium" }
    ]
  },

  // --- Human Flag Tree ---
  {
    id: "tuck-human-flag",
    name: "Tuck Human Flag",
    category: "skill",
    modality: "calisthenics",
    type: "skill-static",
    subSkillOf: "human-flag",
    defaultRestSeconds: 90,
    muscles: [
      { muscleId: "obliques", load: "high" },
      { muscleId: "lats", load: "high" },
      { muscleId: "abs", load: "medium" }
    ]
  },
  {
    id: "human-flag",
    name: "Full Human Flag",
    category: "skill",
    modality: "calisthenics",
    type: "skill-static",
    defaultRestSeconds: 150,
    muscles: [
      { muscleId: "obliques", load: "high" },
      { muscleId: "lats", load: "high" },
      { muscleId: "abs", load: "high" }
    ]
  },

  // --- Dragon Flag Tree ---
  {
    id: "tuck-dragon-flag",
    name: "Tuck Dragon Flag",
    category: "skill",
    modality: "calisthenics",
    type: "skill-static",
    subSkillOf: "dragon-flag",
    defaultRestSeconds: 75,
    muscles: [
      { muscleId: "abs", load: "high" },
      { muscleId: "hipFlexors", load: "high" }
    ]
  },
  {
    id: "dragon-flag",
    name: "Full Dragon Flag",
    category: "skill",
    modality: "calisthenics",
    type: "skill-static",
    defaultRestSeconds: 120,
    muscles: [
      { muscleId: "abs", load: "high" },
      { muscleId: "hipFlexors", load: "high" },
      { muscleId: "lats", load: "medium" }
    ]
  },

  // --- L-Sit & Compression Tree ---
  {
    id: "tuck-l-sit-hold",
    name: "Tuck L-Sit Hold",
    category: "skill",
    modality: "calisthenics",
    type: "skill-static",
    subSkillOf: "l-sit-hold",
    defaultRestSeconds: 60,
    muscles: [
      { muscleId: "abs", load: "high" },
      { muscleId: "hipFlexors", load: "high" }
    ]
  },
  {
    id: "l-sit-hold",
    name: "Full L-Sit Hold",
    category: "skill",
    modality: "calisthenics",
    type: "skill-static",
    defaultRestSeconds: 90,
    muscles: [
      { muscleId: "abs", load: "high" },
      { muscleId: "hipFlexors", load: "high" },
      { muscleId: "triceps", load: "medium" }
    ]
  },
  {
    id: "v-sit",
    name: "V-Sit Hold",
    category: "skill",
    modality: "calisthenics",
    type: "skill-static",
    subSkillOf: "l-sit-hold",
    defaultRestSeconds: 120,
    muscles: [
      { muscleId: "abs", load: "high" },
      { muscleId: "hipFlexors", load: "high" },
      { muscleId: "triceps", load: "medium" }
    ]
  },

  // --- Pistol Squat Tree ---
  {
    id: "pistol-squat",
    name: "Pistol Squat",
    category: "skill",
    modality: "calisthenics",
    type: "skill-dynamic",
    defaultRestSeconds: 120,
    muscles: [
      { muscleId: "quads", load: "high" },
      { muscleId: "glutes", load: "medium" },
      { muscleId: "hipFlexors", load: "medium" }
    ]
  },

  // --- Advanced Dynamic Skills ---
  {
    id: "muscle-up",
    name: "Bar Muscle-Up",
    category: "skill",
    modality: "calisthenics",
    type: "skill-dynamic",
    defaultRestSeconds: 180,
    muscles: [
      { muscleId: "lats", load: "high" },
      { muscleId: "triceps", load: "high" },
      { muscleId: "chest", load: "medium" }
    ]
  },
  {
    id: "ring-muscle-up",
    name: "Ring Muscle-Up",
    category: "skill",
    modality: "calisthenics",
    type: "skill-dynamic",
    defaultRestSeconds: 180,
    muscles: [
      { muscleId: "lats", load: "high" },
      { muscleId: "triceps", load: "high" },
      { muscleId: "chest", load: "medium" }
    ]
  },
  {
    id: "one-arm-pull-up",
    name: "One-Arm Pull-up",
    category: "skill",
    modality: "calisthenics",
    type: "skill-dynamic",
    defaultRestSeconds: 180,
    muscles: [
      { muscleId: "lats", load: "high" },
      { muscleId: "biceps", load: "high" },
      { muscleId: "rhomboids", load: "medium" }
    ]
  }
,

  // ==========================================
  // EXPANDED CALISTHENICS SKILLS & PROGRESSIONS
  // These are genuine skill variations/drills rather than ordinary strength exercises.
  // Child skills use subSkillOf so the main skill remains the selectable progression root.
  // ==========================================
  {
    id: "wall-handstand-hold",
    name: "Wall Handstand Hold",
    category: "skill",
    modality: "calisthenics",
    type: "skill-static",
    subSkillOf: "handstand-hold",
    defaultRestSeconds: 90,
    muscles: [
      { muscleId: "frontDelts", load: "high" },
      { muscleId: "traps", load: "medium" },
      { muscleId: "abs", load: "medium" }
    ]
  },
  {
    id: "chest-to-wall-handstand",
    name: "Chest-to-Wall Handstand Hold",
    category: "skill",
    modality: "calisthenics",
    type: "skill-static",
    subSkillOf: "handstand-hold",
    defaultRestSeconds: 90,
    muscles: [
      { muscleId: "frontDelts", load: "high" },
      { muscleId: "traps", load: "medium" },
      { muscleId: "abs", load: "medium" }
    ]
  },
  {
    id: "handstand-walk",
    name: "Handstand Walk",
    category: "skill",
    modality: "calisthenics",
    type: "skill-dynamic",
    subSkillOf: "handstand-hold",
    defaultRestSeconds: 120,
    muscles: [
      { muscleId: "frontDelts", load: "high" },
      { muscleId: "traps", load: "medium" },
      { muscleId: "abs", load: "medium" }
    ]
  },
  {
    id: "handstand-shoulder-taps",
    name: "Handstand Shoulder Taps",
    category: "skill",
    modality: "calisthenics",
    type: "skill-dynamic",
    subSkillOf: "handstand-hold",
    defaultRestSeconds: 120,
    muscles: [
      { muscleId: "frontDelts", load: "high" },
      { muscleId: "abs", load: "high" },
      { muscleId: "triceps", load: "medium" }
    ]
  },
  {
    id: "assisted-pistol-squat",
    name: "Assisted Pistol Squat",
    category: "skill",
    modality: "calisthenics",
    type: "skill-dynamic",
    subSkillOf: "pistol-squat",
    defaultRestSeconds: 90,
    muscles: [
      { muscleId: "quads", load: "high" },
      { muscleId: "glutes", load: "medium" },
      { muscleId: "hipFlexors", load: "medium" }
    ]
  },
  {
    id: "counterweight-pistol-squat",
    name: "Counterweight Pistol Squat",
    category: "skill",
    modality: "calisthenics",
    type: "skill-dynamic",
    subSkillOf: "pistol-squat",
    defaultRestSeconds: 105,
    muscles: [
      { muscleId: "quads", load: "high" },
      { muscleId: "glutes", load: "medium" },
      { muscleId: "hipFlexors", load: "medium" }
    ]
  },
  {
    id: "pistol-squat-negative",
    name: "Pistol Squat Negative",
    category: "skill",
    modality: "calisthenics",
    type: "skill-dynamic",
    subSkillOf: "pistol-squat",
    defaultRestSeconds: 105,
    muscles: [
      { muscleId: "quads", load: "high" },
      { muscleId: "glutes", load: "medium" },
      { muscleId: "hipFlexors", load: "medium" }
    ]
  },
  {
    id: "jumping-muscle-up",
    name: "Jumping Muscle-Up",
    category: "skill",
    modality: "calisthenics",
    type: "skill-dynamic",
    subSkillOf: "muscle-up",
    defaultRestSeconds: 90,
    muscles: [
      { muscleId: "lats", load: "high" },
      { muscleId: "triceps", load: "medium" },
      { muscleId: "chest", load: "medium" }
    ]
  },
  {
    id: "band-assisted-muscle-up",
    name: "Band-Assisted Muscle-Up",
    category: "skill",
    modality: "calisthenics",
    type: "skill-dynamic",
    subSkillOf: "muscle-up",
    defaultRestSeconds: 120,
    muscles: [
      { muscleId: "lats", load: "high" },
      { muscleId: "triceps", load: "high" },
      { muscleId: "chest", load: "medium" }
    ]
  },
  {
    id: "explosive-chest-to-bar",
    name: "Explosive Chest-to-Bar Pull-up",
    category: "skill",
    modality: "calisthenics",
    type: "skill-dynamic",
    subSkillOf: "muscle-up",
    defaultRestSeconds: 120,
    muscles: [
      { muscleId: "lats", load: "high" },
      { muscleId: "biceps", load: "medium" },
      { muscleId: "triceps", load: "medium" }
    ]
  },
  {
    id: "muscle-up-negative",
    name: "Muscle-Up Negative",
    category: "skill",
    modality: "calisthenics",
    type: "skill-dynamic",
    subSkillOf: "muscle-up",
    defaultRestSeconds: 120,
    muscles: [
      { muscleId: "lats", load: "high" },
      { muscleId: "biceps", load: "medium" },
      { muscleId: "triceps", load: "medium" }
    ]
  },
  {
    id: "strict-muscle-up",
    name: "Strict Bar Muscle-Up",
    category: "skill",
    modality: "calisthenics",
    type: "skill-dynamic",
    subSkillOf: "muscle-up",
    defaultRestSeconds: 180,
    muscles: [
      { muscleId: "lats", load: "high" },
      { muscleId: "triceps", load: "high" },
      { muscleId: "chest", load: "medium" }
    ]
  },
  {
    id: "ring-muscle-up-transition",
    name: "Ring Muscle-Up Transition",
    category: "skill",
    modality: "calisthenics",
    type: "skill-dynamic",
    subSkillOf: "ring-muscle-up",
    defaultRestSeconds: 90,
    muscles: [
      { muscleId: "lats", load: "medium" },
      { muscleId: "chest", load: "medium" },
      { muscleId: "triceps", load: "medium" }
    ]
  },
  {
    id: "band-assisted-ring-muscle-up",
    name: "Band-Assisted Ring Muscle-Up",
    category: "skill",
    modality: "calisthenics",
    type: "skill-dynamic",
    subSkillOf: "ring-muscle-up",
    defaultRestSeconds: 120,
    muscles: [
      { muscleId: "lats", load: "high" },
      { muscleId: "triceps", load: "high" },
      { muscleId: "chest", load: "medium" }
    ]
  },
  {
    id: "strict-ring-muscle-up",
    name: "Strict Ring Muscle-Up",
    category: "skill",
    modality: "calisthenics",
    type: "skill-dynamic",
    subSkillOf: "ring-muscle-up",
    defaultRestSeconds: 180,
    muscles: [
      { muscleId: "lats", load: "high" },
      { muscleId: "triceps", load: "high" },
      { muscleId: "chest", load: "medium" }
    ]
  },
  {
    id: "scapular-one-arm-pull-up",
    name: "One-Arm Pull-up Scapular Raise",
    category: "skill",
    modality: "calisthenics",
    type: "skill-dynamic",
    subSkillOf: "one-arm-pull-up",
    defaultRestSeconds: 90,
    muscles: [
      { muscleId: "lats", load: "high" },
      { muscleId: "biceps", load: "medium" },
      { muscleId: "forearms", load: "medium" }
    ]
  },
  {
    id: "archer-pull-up-assisted",
    name: "Assisted Archer Pull-up",
    category: "skill",
    modality: "calisthenics",
    type: "skill-dynamic",
    subSkillOf: "one-arm-pull-up",
    defaultRestSeconds: 105,
    muscles: [
      { muscleId: "lats", load: "high" },
      { muscleId: "biceps", load: "high" },
      { muscleId: "forearms", load: "medium" }
    ]
  },
  {
    id: "one-arm-pull-up-negative",
    name: "One-Arm Pull-up Negative",
    category: "skill",
    modality: "calisthenics",
    type: "skill-dynamic",
    subSkillOf: "one-arm-pull-up",
    defaultRestSeconds: 150,
    muscles: [
      { muscleId: "lats", load: "high" },
      { muscleId: "biceps", load: "high" },
      { muscleId: "forearms", load: "high" }
    ]
  },
  {
    id: "assisted-one-arm-pull-up",
    name: "Assisted One-Arm Pull-up",
    category: "skill",
    modality: "calisthenics",
    type: "skill-dynamic",
    subSkillOf: "one-arm-pull-up",
    defaultRestSeconds: 120,
    muscles: [
      { muscleId: "lats", load: "high" },
      { muscleId: "biceps", load: "high" },
      { muscleId: "forearms", load: "medium" }
    ]
  },
  {
    id: "one-leg-front-lever-hold",
    name: "One-Leg Front Lever Hold",
    category: "skill",
    modality: "calisthenics",
    type: "skill-static",
    subSkillOf: "front-lever-hold",
    defaultRestSeconds: 135,
    muscles: [
      { muscleId: "lats", load: "high" },
      { muscleId: "abs", load: "high" },
      { muscleId: "rhomboids", load: "medium" }
    ]
  },
  {
    id: "front-lever-negative",
    name: "Front Lever Negative",
    category: "skill",
    modality: "calisthenics",
    type: "skill-dynamic",
    subSkillOf: "front-lever-pull-up",
    defaultRestSeconds: 150,
    muscles: [
      { muscleId: "lats", load: "high" },
      { muscleId: "rhomboids", load: "high" },
      { muscleId: "biceps", load: "medium" }
    ]
  },
  {
    id: "front-lever-raise",
    name: "Front Lever Raise",
    category: "skill",
    modality: "calisthenics",
    type: "skill-dynamic",
    subSkillOf: "front-lever-pull-up",
    defaultRestSeconds: 150,
    muscles: [
      { muscleId: "lats", load: "high" },
      { muscleId: "rhomboids", load: "high" },
      { muscleId: "abs", load: "medium" }
    ]
  },
  {
    id: "tuck-front-lever-pull-up",
    name: "Tuck Front Lever Pull-up",
    category: "skill",
    modality: "calisthenics",
    type: "skill-dynamic",
    subSkillOf: "front-lever-pull-up",
    defaultRestSeconds: 120,
    muscles: [
      { muscleId: "lats", load: "high" },
      { muscleId: "rhomboids", load: "high" },
      { muscleId: "biceps", load: "medium" }
    ]
  },
  {
    id: "advanced-tuck-back-lever-hold",
    name: "Advanced Tuck Back Lever Hold",
    category: "skill",
    modality: "calisthenics",
    type: "skill-static",
    subSkillOf: "back-lever-hold",
    defaultRestSeconds: 120,
    muscles: [
      { muscleId: "lats", load: "high" },
      { muscleId: "abs", load: "high" },
      { muscleId: "lowerBack", load: "medium" }
    ]
  },
  {
    id: "one-leg-back-lever-hold",
    name: "One-Leg Back Lever Hold",
    category: "skill",
    modality: "calisthenics",
    type: "skill-static",
    subSkillOf: "back-lever-hold",
    defaultRestSeconds: 135,
    muscles: [
      { muscleId: "lats", load: "high" },
      { muscleId: "abs", load: "high" },
      { muscleId: "lowerBack", load: "medium" }
    ]
  },
  {
    id: "back-lever-negative",
    name: "Back Lever Negative",
    category: "skill",
    modality: "calisthenics",
    type: "skill-dynamic",
    subSkillOf: "back-lever-hold",
    defaultRestSeconds: 120,
    muscles: [
      { muscleId: "lats", load: "high" },
      { muscleId: "abs", load: "medium" },
      { muscleId: "lowerBack", load: "medium" }
    ]
  },
  {
    id: "one-leg-planche-hold",
    name: "One-Leg Planche Hold",
    category: "skill",
    modality: "calisthenics",
    type: "skill-static",
    subSkillOf: "planche-hold",
    defaultRestSeconds: 135,
    muscles: [
      { muscleId: "abs", load: "high" },
      { muscleId: "frontDelts", load: "high" },
      { muscleId: "triceps", load: "high" }
    ]
  },
  {
    id: "planche-negative",
    name: "Planche Negative",
    category: "skill",
    modality: "calisthenics",
    type: "skill-dynamic",
    subSkillOf: "planche-hold",
    defaultRestSeconds: 150,
    muscles: [
      { muscleId: "abs", load: "high" },
      { muscleId: "frontDelts", load: "high" },
      { muscleId: "triceps", load: "high" }
    ]
  },
  {
    id: "tuck-planche-push-up-negative",
    name: "Tuck Planche Push-up Negative",
    category: "skill",
    modality: "calisthenics",
    type: "skill-dynamic",
    subSkillOf: "planche-push-up",
    defaultRestSeconds: 120,
    muscles: [
      { muscleId: "chest", load: "high" },
      { muscleId: "frontDelts", load: "high" },
      { muscleId: "triceps", load: "high" }
    ]
  },
  {
    id: "advanced-tuck-planche-push-up",
    name: "Advanced Tuck Planche Push-up",
    category: "skill",
    modality: "calisthenics",
    type: "skill-dynamic",
    subSkillOf: "planche-push-up",
    defaultRestSeconds: 150,
    muscles: [
      { muscleId: "chest", load: "high" },
      { muscleId: "frontDelts", load: "high" },
      { muscleId: "triceps", load: "high" }
    ]
  },
  {
    id: "advanced-tuck-human-flag",
    name: "Advanced Tuck Human Flag",
    category: "skill",
    modality: "calisthenics",
    type: "skill-static",
    subSkillOf: "human-flag",
    defaultRestSeconds: 105,
    muscles: [
      { muscleId: "obliques", load: "high" },
      { muscleId: "lats", load: "high" },
      { muscleId: "abs", load: "medium" }
    ]
  },
  {
    id: "straddle-human-flag",
    name: "Straddle Human Flag",
    category: "skill",
    modality: "calisthenics",
    type: "skill-static",
    subSkillOf: "human-flag",
    defaultRestSeconds: 135,
    muscles: [
      { muscleId: "obliques", load: "high" },
      { muscleId: "lats", load: "high" },
      { muscleId: "abs", load: "high" }
    ]
  },
  {
    id: "human-flag-negative",
    name: "Human Flag Negative",
    category: "skill",
    modality: "calisthenics",
    type: "skill-dynamic",
    subSkillOf: "human-flag",
    defaultRestSeconds: 120,
    muscles: [
      { muscleId: "obliques", load: "high" },
      { muscleId: "lats", load: "high" },
      { muscleId: "abs", load: "medium" }
    ]
  },
  {
    id: "dragon-flag-negative",
    name: "Dragon Flag Negative",
    category: "skill",
    modality: "calisthenics",
    type: "skill-dynamic",
    subSkillOf: "dragon-flag",
    defaultRestSeconds: 90,
    muscles: [
      { muscleId: "abs", load: "high" },
      { muscleId: "hipFlexors", load: "high" },
      { muscleId: "lats", load: "medium" }
    ]
  },
  {
    id: "bent-knee-dragon-flag",
    name: "Bent-Knee Dragon Flag",
    category: "skill",
    modality: "calisthenics",
    type: "skill-dynamic",
    subSkillOf: "dragon-flag",
    defaultRestSeconds: 90,
    muscles: [
      { muscleId: "abs", load: "high" },
      { muscleId: "hipFlexors", load: "high" },
      { muscleId: "lats", load: "medium" }
    ]
  },
  {
    id: "one-leg-l-sit",
    name: "One-Leg L-Sit Hold",
    category: "skill",
    modality: "calisthenics",
    type: "skill-static",
    subSkillOf: "l-sit-hold",
    defaultRestSeconds: 90,
    muscles: [
      { muscleId: "abs", load: "high" },
      { muscleId: "hipFlexors", load: "high" },
      { muscleId: "triceps", load: "medium" }
    ]
  },
  {
    id: "l-sit-to-v-sit",
    name: "L-Sit to V-Sit",
    category: "skill",
    modality: "calisthenics",
    type: "skill-dynamic",
    subSkillOf: "l-sit-hold",
    defaultRestSeconds: 120,
    muscles: [
      { muscleId: "abs", load: "high" },
      { muscleId: "hipFlexors", load: "high" },
      { muscleId: "triceps", load: "medium" }
    ]
  },
  {
    id: "manna-hold",
    name: "Manna Hold",
    category: "skill",
    modality: "calisthenics",
    type: "skill-static",
    subSkillOf: "l-sit-hold",
    defaultRestSeconds: 150,
    muscles: [
      { muscleId: "abs", load: "high" },
      { muscleId: "hipFlexors", load: "high" },
      { muscleId: "triceps", load: "medium" }
    ]
  },
  {
    id: "pike-handstand-press",
    name: "Pike Handstand Press",
    category: "skill",
    modality: "calisthenics",
    type: "skill-dynamic",
    subSkillOf: "handstand-hold",
    defaultRestSeconds: 120,
    muscles: [
      { muscleId: "frontDelts", load: "high" },
      { muscleId: "abs", load: "high" },
      { muscleId: "triceps", load: "medium" }
    ]
  },
  {
    id: "tuck-press-to-handstand",
    name: "Tuck Press to Handstand",
    category: "skill",
    modality: "calisthenics",
    type: "skill-dynamic",
    subSkillOf: "handstand-hold",
    defaultRestSeconds: 150,
    muscles: [
      { muscleId: "frontDelts", load: "high" },
      { muscleId: "abs", load: "high" },
      { muscleId: "triceps", load: "medium" }
    ]
  },
  {
    id: "straddle-press-to-handstand",
    name: "Straddle Press to Handstand",
    category: "skill",
    modality: "calisthenics",
    type: "skill-dynamic",
    subSkillOf: "handstand-hold",
    defaultRestSeconds: 150,
    muscles: [
      { muscleId: "frontDelts", load: "high" },
      { muscleId: "abs", load: "high" },
      { muscleId: "triceps", load: "medium" }
    ]
  },
  {
    id: "deficit-pike-push-up",
    name: "Deficit Pike Push-up",
    category: "skill",
    modality: "calisthenics",
    type: "skill-dynamic",
    subSkillOf: "handstand-push-up",
    defaultRestSeconds: 105,
    muscles: [
      { muscleId: "frontDelts", load: "high" },
      { muscleId: "triceps", load: "high" },
      { muscleId: "abs", load: "medium" }
    ]
  },
  {
    id: "wall-handstand-push-up-negative",
    name: "Wall Handstand Push-up Negative",
    category: "skill",
    modality: "calisthenics",
    type: "skill-dynamic",
    subSkillOf: "handstand-push-up",
    defaultRestSeconds: 120,
    muscles: [
      { muscleId: "frontDelts", load: "high" },
      { muscleId: "triceps", load: "high" },
      { muscleId: "traps", load: "medium" }
    ]
  },
  {
    id: "partial-wall-handstand-push-up",
    name: "Partial Wall Handstand Push-up",
    category: "skill",
    modality: "calisthenics",
    type: "skill-dynamic",
    subSkillOf: "handstand-push-up",
    defaultRestSeconds: 120,
    muscles: [
      { muscleId: "frontDelts", load: "high" },
      { muscleId: "triceps", load: "high" },
      { muscleId: "traps", load: "medium" }
    ]
  },
  {
    id: "crow-stand",
    name: "Crow Stand",
    category: "skill",
    modality: "calisthenics",
    type: "skill-static",
    defaultRestSeconds: 60,
    muscles: [
      { muscleId: "frontDelts", load: "medium" },
      { muscleId: "triceps", load: "medium" },
      { muscleId: "abs", load: "medium" }
    ]
  },
  {
    id: "elbow-lever",
    name: "Elbow Lever",
    category: "skill",
    modality: "calisthenics",
    type: "skill-static",
    defaultRestSeconds: 75,
    muscles: [
      { muscleId: "frontDelts", load: "medium" },
      { muscleId: "triceps", load: "medium" },
      { muscleId: "abs", load: "medium" }
    ]
  },
  {
    id: "ring-support-hold",
    name: "Ring Support Hold",
    category: "skill",
    modality: "calisthenics",
    type: "skill-static",
    defaultRestSeconds: 60,
    muscles: [
      { muscleId: "chest", load: "medium" },
      { muscleId: "triceps", load: "high" },
      { muscleId: "frontDelts", load: "medium" }
    ]
  },
  {
    id: "ring-l-sit",
    name: "Ring L-Sit Hold",
    category: "skill",
    modality: "calisthenics",
    type: "skill-static",
    subSkillOf: "l-sit-hold",
    defaultRestSeconds: 90,
    muscles: [
      { muscleId: "abs", load: "high" },
      { muscleId: "hipFlexors", load: "high" },
      { muscleId: "triceps", load: "medium" }
    ]
  },
  {
    id: "iron-cross",
    name: "Iron Cross",
    category: "skill",
    modality: "calisthenics",
    type: "skill-static",
    subSkillOf: "ring-support-hold",
    defaultRestSeconds: 180,
    muscles: [
      { muscleId: "chest", load: "high" },
      { muscleId: "frontDelts", load: "high" },
      { muscleId: "biceps", load: "medium" }
    ]
  },
  {
    id: "assisted-iron-cross",
    name: "Assisted Iron Cross",
    category: "skill",
    modality: "calisthenics",
    type: "skill-static",
    subSkillOf: "iron-cross",
    defaultRestSeconds: 150,
    muscles: [
      { muscleId: "chest", load: "high" },
      { muscleId: "frontDelts", load: "high" },
      { muscleId: "biceps", load: "medium" }
    ]
  },
];