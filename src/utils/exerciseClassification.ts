import { exerciseLibrary } from "../data/exerciseLibrary";
import { Equipment, Exercise, PrMetric } from "../models/exercise";

export const EQUIPMENT_LABELS: Record<Equipment, string> = {
  none: "No equipment",
  pullUpBar: "Pull-up bar",
  dipBars: "Dip bars",
  rings: "Gymnastic rings",
  parallettes: "Parallettes",
  wall: "Wall space",
  barbell: "Barbell",
  rack: "Squat rack",
  bench: "Bench",
  dumbbells: "Dumbbells",
  cable: "Cable station",
  machine: "Machine",
  band: "Resistance band",
  abWheel: "Ab wheel",
  cardioMachine: "Cardio machine",
  weightBelt: "Weight belt / vest",
};

export const EQUIPMENT_OPTIONS = Object.keys(EQUIPMENT_LABELS) as Equipment[];

const includesAny = (haystack: string, needles: string[]) => needles.some((needle) => haystack.includes(needle));

/**
 * Equipment is derived from the library classification (modality plus movement
 * naming) so every exercise resolves to concrete materials such as a pull-up
 * bar. Entries may override the inference with an explicit `equipment` list.
 */
export const getExerciseEquipment = (exercise: Exercise): Equipment[] => {
  if (exercise.equipment?.length) return exercise.equipment;

  const key = `${exercise.id} ${exercise.name}`.toLowerCase();
  const equipment = new Set<Equipment>();

  switch (exercise.modality) {
    case "barbells":
      equipment.add("barbell");
      if (includesAny(key, ["squat", "rack", "overhead press", "z-press", "good morning"])) equipment.add("rack");
      if (includesAny(key, ["bench press", "floor press", "spoto", "seal row", "hip thrust", "preacher"])) equipment.add("bench");
      break;
    case "dumbbells":
      equipment.add("dumbbells");
      if (includesAny(key, ["bench", "incline", "decline", "seated", "fly", "preacher", "chest-supported", "pullover"])) equipment.add("bench");
      break;
    case "cables":
      equipment.add("cable");
      break;
    case "machines":
      equipment.add("machine");
      break;
    case "cardio":
      equipment.add("cardioMachine");
      break;
    default:
      break;
  }

  if (includesAny(key, ["ring"])) equipment.add("rings");
  if (
    includesAny(key, [
      "pull-up",
      "pullup",
      "chin-up",
      "bar muscle-up",
      "hanging",
      "toes-to-bar",
      "front lever",
      "back lever",
      "skin the cat",
      "typewriter",
      "scapular",
      "bar hang",
    ]) &&
    !key.includes("ring")
  ) {
    equipment.add("pullUpBar");
  }
  if (key.includes("muscle-up") && !key.includes("ring")) equipment.add("pullUpBar");
  if (includesAny(key, ["dip"]) && !key.includes("ring")) equipment.add("dipBars");
  if (includesAny(key, ["l-sit", "v-sit", "planche", "parallette"])) equipment.add("parallettes");
  if (includesAny(key, ["wall handstand", "wall-facing", "chest-to-wall"])) equipment.add("wall");
  if (key.includes("ab wheel")) equipment.add("abWheel");
  if (includesAny(key, ["band-assisted", "band "])) equipment.add("band");
  if (includesAny(key, ["human flag"])) equipment.add("pullUpBar");
  if (includesAny(key, ["weighted"])) equipment.add("weightBelt");

  if (equipment.size === 0) equipment.add("none");

  return Array.from(equipment);
};

/** Exercises that are scored in seconds rather than reps. */
export const isHoldExercise = (exercise?: Exercise | null) => {
  if (!exercise) return false;
  if (exercise.prMetric === "hold") return true;
  if (exercise.prMetric === "weight") return false;
  return exercise.type === "skill-static";
};

export const getPrMetric = (exercise?: Exercise | null): PrMetric =>
  isHoldExercise(exercise) ? "hold" : "weight";

/** Walks a progression chain up to its root skill (e.g. Tuck Planche -> Planche). */
export const getRootExercise = (exercise: Exercise): Exercise => {
  let root = exercise;
  const seen = new Set<string>();
  while (root.subSkillOf && !seen.has(root.id)) {
    seen.add(root.id);
    const parent = exerciseLibrary.find((entry) => entry.id === root.subSkillOf);
    if (!parent) break;
    root = parent;
  }
  return root;
};

export const getProgressionsOf = (exerciseId: string) =>
  exerciseLibrary.filter((entry) => entry.subSkillOf === exerciseId);
