import React, { useState } from "react";
import { ScrollView, StyleSheet, Text, View, Pressable, TextInput, Modal, Switch } from "react-native";

import { Screen } from "../../components/layout/Screen";
import { starterRoutines } from "../../data/starterRoutines";
import { exerciseLibrary } from "../../data/exerciseLibrary";
import { theme } from "../../theme/theme";
import { useRoutines } from "../../context/RoutineContext";
import NumericInput from "../../components/ui/NumericInput";
import { Routine, RoutineExercise } from "../../models/routine";
import { MuscleGroupId } from "../../models/muscle";
import { Equipment } from "../../models/exercise";
import { EQUIPMENT_LABELS, isHoldExercise } from "../../utils/exerciseClassification";
import { defaultRepsFor, generateRoutine } from "../../utils/routineGenerator";
const buildConfigGroups = (
  selectedExerciseIds: string[],
  exerciseConfigs: Record<string, ExerciseConfig>
) => {
  const groups: Array<
    | { type: "single"; id: string; index: number }
    | { type: "superset"; ids: [string, string]; indices: [number, number] }
  > = [];

  let index = 0;
  while (index < selectedExerciseIds.length) {
    const id = selectedExerciseIds[index];
    const config = exerciseConfigs[id];
    const isLast = index === selectedExerciseIds.length - 1;
    const prevId = index > 0 ? selectedExerciseIds[index - 1] : null;
    const isLinkedByPrevious = prevId ? !!exerciseConfigs[prevId]?.supersetWithNext : false;

    if (config?.supersetWithNext && !isLast && !isLinkedByPrevious) {
      groups.push({
        type: "superset",
        ids: [id, selectedExerciseIds[index + 1]],
        indices: [index, index + 1],
      });
      index += 2;
      continue;
    }

    if (isLinkedByPrevious) {
      index += 1;
      continue;
    }

    groups.push({ type: "single", id, index });
    index += 1;
  }

  return groups;
};

// Helper to check if an exercise is a hold-style movement
const checkIsHold = (id: string) =>
  isHoldExercise(exerciseLibrary.find((exercise) => exercise.id === id)) ||
  id.includes("hold") ||
  id.includes("plank");

// ─── Routine Insights ────────────────────────────────────────────────────────
const CORE_MUSCLES = ["abs", "obliques", "lowerBack", "hipFlexors"];

const isCoreIsolation = (id: string) => {
  const ex = exerciseLibrary.find((e) => e.id === id);
  return !!ex && ex.type === "isolation" && !!ex.muscles?.some((m) => CORE_MUSCLES.includes(m.muscleId));
};

const isSkillOrCompound = (id: string) => {
  const ex = exerciseLibrary.find((e) => e.id === id);
  return !!ex && (ex.type === "compound" || ex.type === "skill-static" || ex.type === "skill-dynamic");
};

const isNonCoreIsolation = (id: string) => {
  const ex = exerciseLibrary.find((e) => e.id === id);
  return !!ex && ex.type === "isolation" && !ex.muscles?.some((m) => CORE_MUSCLES.includes(m.muscleId));
};

const getExerciseName = (id: string) =>
  exerciseLibrary.find((e) => e.id === id)?.name ?? id;

const getRoutineInsights = (ids: string[]): string[] => {
  const recs: string[] = [];

  // Any skill/compound that sits after the first isolation → should be at the start
  const firstIsoIdx = ids.findIndex((id) => isNonCoreIsolation(id) || isCoreIsolation(id));
  if (firstIsoIdx > -1) {
    ids.slice(firstIsoIdx + 1).forEach((id) => {
      if (isSkillOrCompound(id)) {
        recs.push(`Place "${getExerciseName(id)}" at the start — it's a compound/skill exercise`);
      }
    });
  }

  // Any core isolation that has a non-core exercise after it → should be at the end
  ids.forEach((id, i) => {
    if (isCoreIsolation(id)) {
      const hasNonCoreAfter = ids.slice(i + 1).some((aid) => !isCoreIsolation(aid));
      if (hasNonCoreAfter) {
        recs.push(`Place "${getExerciseName(id)}" at the end — it isolates the core`);
      }
    }
  });

  return recs;
};
// ─────────────────────────────────────────────────────────────────────────────

const getTargetedMusclesSummary = (routineExercises: { exerciseId: string }[]) => {
  if (!routineExercises || routineExercises.length === 0) return [];

  const muscleCounts: Record<string, number> = {};

  routineExercises.forEach((re) => {
    const exercise = exerciseLibrary.find((e) => e.id === re.exerciseId);
    if (!exercise || !exercise.muscles) return;

    exercise.muscles.forEach((m) => {
      muscleCounts[m.muscleId] = (muscleCounts[m.muscleId] || 0) + 1;
    });
  });

  const entries = Object.entries(muscleCounts);
  if (entries.length === 0) return [];

  const maxVolume = Math.max(...entries.map(([_, count]) => count));

  return entries.map(([muscleId, count]) => {
    const isPrimaryTarget = count === maxVolume || count > maxVolume * 0.6;
    return {
      muscleId,
      type: isPrimaryTarget ? "Primary" : "Secondary",
    };
  });
};

const MODALITY_FILTERS = ["barbells", "dumbbells", "calisthenics", "cables"];
const TYPE_FILTERS = ["compound", "isolation", "skill-static", "skill-dynamic"];
const MUSCLE_FILTERS = [ "chest", "rhomboids", "lats", "traps", "frontDelts", "sideDelts", "rearDelts", "biceps", "triceps", "forearms", "abs", "obliques", "lowerBack", "glutes", "quads", "hamstrings", "calves", "hipFlexors"];

// Parallettes are left out on purpose: the floor covers those movements.
const EQUIPMENT_OPTIONS = Object.keys(EQUIPMENT_LABELS).filter(
  (item) => item !== "none" && item !== "parallettes"
) as Equipment[];

interface ExerciseConfig {
  sets: string;
  reps: string;
  hold: string;
  specialType: "normal" | "dropset";
  dropsetsPerSet: string;
  supersetWithNext: boolean;
}

export function RoutinesScreen() {
  const { customRoutines, deletedStarterIds, addRoutine, deleteRoutine, isLoading } = useRoutines();

  // Creation / Edit Flow States
  const [isModalVisible, setIsModalVisible] = useState(false);
  const [creationStep, setCreationStep] = useState<1 | 2>(1);
  const [routineName, setRoutineName] = useState("");
  const [routineDescription, setRoutineDescription] = useState("");
  const [selectedExerciseIds, setSelectedExerciseIds] = useState<string[]>([]);

  // Track if we are Editing or Creating a brand new routine
  const [editingRoutineId, setEditingRoutineId] = useState<string | null>(null);

  // Search & Filter States
  const [searchQuery, setSearchQuery] = useState("");
  const [selectedModality, setSelectedModality] = useState<string | null>(null);
  const [selectedMuscle, setSelectedMuscle] = useState<string | null>(null);
  const [selectedType, setSelectedType] = useState<string | null>(null);

  // Track if the "Selected Only" filter chip is toggled active
  const [showSelectedOnly, setShowSelectedOnly] = useState(false);

  // Configured target states for Step 2
  const [exerciseConfigs, setExerciseConfigs] = useState<Record<string, ExerciseConfig>>({});

  // States for handling custom alert popup UI
  const [deleteAlertVisible, setDeleteAlertVisible] = useState(false);
  const [routineToDelete, setRoutineToDelete] = useState<Routine | null>(null);

  // Smart (rule-based) routine builder states
  const [isBuilderVisible, setIsBuilderVisible] = useState(false);
  const [builderName, setBuilderName] = useState("");
  const [builderMuscles, setBuilderMuscles] = useState<MuscleGroupId[]>([]);
  const [builderEquipment, setBuilderEquipment] = useState<Equipment[]>([]);
  const [builderSets, setBuilderSets] = useState(3);
  const [builderExercisesPerMuscle, setBuilderExercisesPerMuscle] = useState(2);
  const [builderWeighted, setBuilderWeighted] = useState(true);
  const [builderError, setBuilderError] = useState<string | null>(null);
  const [saveError, setSaveError] = useState<string | null>(null);

  // Filter out the starter routines that have been hidden/deleted by the user
  const activeStarters = starterRoutines.filter((sr) => !deletedStarterIds?.includes(sr.id));
  const allRoutines = [...customRoutines, ...activeStarters];

  const handleCreatePress = () => {
    setEditingRoutineId(null);
    setRoutineName("");
    setRoutineDescription("");
    setSelectedExerciseIds([]);
    setExerciseConfigs({});
    setSearchQuery("");
    setSelectedModality(null);
    setSelectedMuscle(null);
    setShowSelectedOnly(false);
    setCreationStep(1);
    setIsModalVisible(true);
  };

  const toggleExerciseSelection = (id: string) => {
    setSelectedExerciseIds((prev) => {
      const isConfigured = prev.includes(id);
      const updated = isConfigured ? prev.filter((item) => item !== id) : [...prev, id];

      if (!isConfigured) {
        setExerciseConfigs(c => ({
          ...c,
          [id]: {
            sets: "4",
            reps: checkIsHold(id) ? "" : "5-10",
            hold: checkIsHold(id) ? "30" : "" ,
            specialType: "normal",
            dropsetsPerSet: "1",
            supersetWithNext: false
          }
        }));
      }
      return updated;
    });
  };

  const updateConfig = (id: string, key: keyof ExerciseConfig, value: any) => {
    setExerciseConfigs((prev) => {
      const next = { ...prev, [id]: { ...prev[id], [key]: value } };
      if (key === "sets") {
        const idx = selectedExerciseIds.indexOf(id);
        if (idx >= 0 && idx < selectedExerciseIds.length - 1) {
          const nextId = selectedExerciseIds[idx + 1];
          if (prev[id]?.supersetWithNext) {
            next[nextId] = { ...prev[nextId], sets: value };
          }
        }
      }
      return next;
    });
  };

  const moveExerciseOrder = (index: number, direction: "up" | "down") => {
    const targetIndex = direction === "up" ? index - 1 : index + 1;
    if (targetIndex < 0 || targetIndex >= selectedExerciseIds.length) return;

    setSelectedExerciseIds((prev) => {
      const updated = [...prev];
      const temp = updated[index];
      updated[index] = updated[targetIndex];
      updated[targetIndex] = temp;
      return updated;
    });
  };

  const handleDeletePress = (routine: Routine) => {
    setRoutineToDelete(routine);
    setDeleteAlertVisible(true);
  };

  const confirmDeletion = async () => {
    if (routineToDelete && deleteRoutine) {
      await deleteRoutine(routineToDelete.id);
    }
    setDeleteAlertVisible(false);
    setRoutineToDelete(null);
  };

  const handleEditPress = (routine: Routine) => {
    setEditingRoutineId(routine.id);
    setRoutineName(routine.name);
    setRoutineDescription(routine.description);

    const initialExerciseIds = routine.exercises.map((e) => e.exerciseId);
    setSelectedExerciseIds(initialExerciseIds);

    const initialConfigs: Record<string, ExerciseConfig> = {};
    routine.exercises.forEach((e) => {
      initialConfigs[e.exerciseId] = {
        sets: e.targetSets.toString(),
        reps: e.targetReps || "",
        hold: e.targetHoldSeconds ? e.targetHoldSeconds.toString() : "",
        specialType: e.specialType || "normal",
        dropsetsPerSet: e.dropsetsPerSet ? e.dropsetsPerSet.toString() : "1",
        supersetWithNext: e.supersetWithNext || false,
      };
    });
    setExerciseConfigs(initialConfigs);

    setCreationStep(2);
    setIsModalVisible(true);
  };

  const filteredExercises = exerciseLibrary.filter((ex) => {
    if (showSelectedOnly && !selectedExerciseIds.includes(ex.id)) return false;
    if (ex.subSkillOf) return false;

    const query = searchQuery.toLowerCase().trim();
    if (query) {
      const matchesName = ex.name.toLowerCase().includes(query);
      const matchesModality = ex.modality?.toLowerCase().includes(query);
      const matchesMuscles = ex.muscles?.some((m) => m.muscleId.toLowerCase().includes(query));
      const matchesType = ex.type?.toLowerCase().includes(query);
      if (!matchesName && !matchesModality && !matchesMuscles && !matchesType) return false;
    }

    if (selectedModality && ex.modality !== selectedModality) return false;
    if (selectedMuscle && !ex.muscles?.some((m) => m.muscleId === selectedMuscle)) return false;
    if (selectedType && ex.type !== selectedType) return false;

    return true;
  });

  const selectedExerciseTypes = selectedExerciseIds
    .map((id) => exerciseLibrary.find((exercise) => exercise.id === id)?.type)
    .filter(Boolean) as string[];

  const routineInsights = getRoutineInsights(selectedExerciseIds);

  /** Routine names must stay unique across custom and starter routines. */
  const isDuplicateRoutineName = (name: string, ignoreRoutineId?: string | null) =>
    allRoutines.some(
      (routine) =>
        routine.id !== ignoreRoutineId && routine.name.trim().toLowerCase() === name.trim().toLowerCase()
    );

  const handleSaveRoutine = async () => {
    if (!routineName.trim() || selectedExerciseIds.length === 0) return;

    if (isDuplicateRoutineName(routineName, editingRoutineId)) {
      setSaveError("A routine with that name already exists. Pick another name.");
      return;
    }
    setSaveError(null);

    const safeParseInt = (value: string | undefined, fallback: number): number => {
      if (!value) return fallback;
      const parsed = parseInt(value, 10);
      return isNaN(parsed) ? fallback : parsed;
    };

    const mappedExercises: RoutineExercise[] = selectedExerciseIds.map((id, index) => {
      const config = exerciseConfigs[id];
      const isHold = checkIsHold(id);
      const isLast = index === selectedExerciseIds.length - 1;

      const prevId = index > 0 ? selectedExerciseIds[index - 1] : null;
      const isLinkedByPrevious = prevId ? !!exerciseConfigs[prevId]?.supersetWithNext : false;

      return {
        exerciseId: id,
        targetSets: safeParseInt(config?.sets, 3),
        specialType: config?.specialType || "normal",
        ...(config?.specialType === "dropset"
          ? { dropsetsPerSet: safeParseInt(config?.dropsetsPerSet, 1) }
          : {}),
        supersetWithNext: !isLast && !isLinkedByPrevious && (config?.supersetWithNext || false),
        ...(isHold
          ? { targetHoldSeconds: safeParseInt(config?.hold, 30) }
          : { targetReps: config?.reps || "8" })
      };
    });

    const isEditingStarter = starterRoutines.some(r => r.id === editingRoutineId);

    const routineIdToSave = isEditingStarter
      ? `custom-${Date.now()}`
      : (editingRoutineId || `custom-${Date.now()}`);

    const savedRoutine: Routine = {
      id: routineIdToSave,
      name: routineName.trim(),
      description: routineDescription.trim() || "Custom parameters layout.",
      exerciseCount: selectedExerciseIds.length,
      estimatedMinutes: selectedExerciseIds.length * 10,
      exercises: mappedExercises,
    };

    await addRoutine(savedRoutine);
    if (isEditingStarter && deleteRoutine) {
      await deleteRoutine(editingRoutineId!);
    }
    resetModalState();
  };

  const toggleBuilderMuscle = (muscleId: MuscleGroupId) =>
    setBuilderMuscles((prev) =>
      prev.includes(muscleId) ? prev.filter((item) => item !== muscleId) : [...prev, muscleId]
    );

  const toggleAllMuscles = () =>
    setBuilderMuscles((prev) => (prev.length === MUSCLE_FILTERS.length ? [] : (MUSCLE_FILTERS as MuscleGroupId[])));

  const toggleBuilderEquipment = (item: Equipment) =>
    setBuilderEquipment((prev) =>
      prev.includes(item) ? prev.filter((entry) => entry !== item) : [...prev, item]
    );

  const toggleAllEquipment = () =>
    setBuilderEquipment((prev) => (prev.length === EQUIPMENT_OPTIONS.length ? [] : EQUIPMENT_OPTIONS));

  const handleGenerateRoutine = () => {
    if (!builderName.trim()) {
      setBuilderError("Name the routine first.");
      return;
    }

    if (isDuplicateRoutineName(builderName)) {
      setBuilderError("A routine with that name already exists. Pick another name.");
      return;
    }

    if (builderMuscles.length === 0) {
      setBuilderError("Pick at least one muscle to target.");
      return;
    }

    const result = generateRoutine({
      muscles: builderMuscles,
      equipment: builderEquipment,
      exercisesPerMuscle: builderExercisesPerMuscle,
      setsPerExercise: builderSets,
      allowWeighted: builderWeighted,
    });

    if (result.exercises.length === 0) {
      setBuilderError(
        "Nothing matches those picks. Add equipment or allow weights — or build the routine yourself."
      );
      return;
    }

    if (result.shortfalls.length > 0) {
      const detail = result.shortfalls
        .map((entry) => `${entry.muscleId} (${entry.available}/${entry.requested})`)
        .join(", ");
      setBuilderError(
        `Not enough exercises for ${detail}. Add equipment, allow weights or drop to fewer per muscle — or build the routine yourself.`
      );
      return;
    }

    const configs: Record<string, ExerciseConfig> = {};
    result.exercises.forEach(({ exercise, sets }) => {
      const isHold = exercise.type === "skill-static" || checkIsHold(exercise.id);
      configs[exercise.id] = {
        sets: String(sets),
        reps: isHold ? "" : defaultRepsFor(exercise),
        hold: isHold ? "30" : "",
        specialType: "normal",
        dropsetsPerSet: "1",
        supersetWithNext: false,
      };
    });

    setBuilderError(null);
    setSaveError(null);
    setIsBuilderVisible(false);
    setEditingRoutineId(null);
    setRoutineName(builderName.trim());
    setRoutineDescription(
      `${builderWeighted ? "Weighted" : "Bodyweight"} routine targeting ${builderMuscles.join(", ")}.`
    );
    setSelectedExerciseIds(result.exercises.map((entry) => entry.exercise.id));
    setExerciseConfigs(configs);
    setCreationStep(2);
    setIsModalVisible(true);
  };

  const resetModalState = () => {
    setRoutineName("");
    setRoutineDescription("");
    setSelectedExerciseIds([]);
    setExerciseConfigs({});
    setSearchQuery("");
    setSelectedModality(null);
    setSelectedMuscle(null);
    setSelectedType(null);
    setShowSelectedOnly(false);
    setCreationStep(1);
    setEditingRoutineId(null);
    setIsModalVisible(false);
  };

  return (
    <Screen padded={false}>
      <Modal
        animationType="fade"
        transparent={true}
        visible={deleteAlertVisible}
        onRequestClose={() => setDeleteAlertVisible(false)}
      >
        <View style={styles.modalOverlay}>
          <View style={styles.alertContentCard}>
            <Text style={styles.alertTitle}>Delete Routine</Text>
            <Text style={styles.alertBody}>
              Are you sure you want to delete "{routineToDelete?.name}"? This action cannot be undone.
            </Text>
            <View style={styles.alertButtonsRow}>
              <Pressable
                style={[styles.alertButton, styles.alertCancelButton]}
                onPress={() => setDeleteAlertVisible(false)}
              >
                <Text style={styles.alertCancelText}>Cancel</Text>
              </Pressable>
              <Pressable
                style={[styles.alertButton, styles.alertDeleteButton]}
                onPress={confirmDeletion}
              >
                <Text style={styles.alertDeleteText}>Delete</Text>
              </Pressable>
            </View>
          </View>
        </View>
      </Modal>

      <Modal
        animationType="slide"
        transparent={true}
        visible={isModalVisible}
        onRequestClose={resetModalState}
      >
        <View style={styles.modalOverlay}>
          <View style={styles.modalContent}>
            <Text style={styles.modalTitle}>
              {editingRoutineId ? "Edit Routine" : "New Custom Routine"} {creationStep === 1 ? "(1/2)" : "(2/2)"}
            </Text>

            {creationStep === 1 ? (
              <>
                <TextInput
                  style={styles.input}
                  placeholder="Routine Name (e.g., Upper Body Focus)"
                  placeholderTextColor={theme.colors.textSecondary}
                  value={routineName}
                  onChangeText={(value) => {
                    setRoutineName(value);
                    setSaveError(null);
                  }}
                />

                {saveError && <Text style={styles.builderError}>{saveError}</Text>}

                <TextInput
                  style={styles.input}
                  placeholder="Description (e.g., Strength development)"
                  placeholderTextColor={theme.colors.textSecondary}
                  value={routineDescription}
                  onChangeText={setRoutineDescription}
                />

                <Text style={styles.sectionLabel}>Select Exercises ({selectedExerciseIds.length})</Text>

                <TextInput
                  style={styles.searchInput}
                  placeholder="Type to search..."
                  placeholderTextColor={theme.colors.textSecondary}
                  value={searchQuery}
                  onChangeText={setSearchQuery}
                  clearButtonMode="while-editing"
                />

                <View style={styles.filterContainer}>
                  <ScrollView horizontal showsHorizontalScrollIndicator={false} contentContainerStyle={styles.filterScroll}>
                    <Pressable
                      style={[styles.chip, showSelectedOnly && styles.chipActiveSelected]}
                      onPress={() => setShowSelectedOnly(!showSelectedOnly)}
                    >
                      <Text style={[styles.chipText, showSelectedOnly && styles.chipTextActive]}>
                        Selected ({selectedExerciseIds.length})
                      </Text>
                    </Pressable>

                    <View style={styles.filterDivider} />

                    {MODALITY_FILTERS.map((mod) => {
                      const isActive = selectedModality === mod;
                      return (
                        <Pressable
                          key={mod}
                          style={[styles.chip, isActive && styles.chipActive]}
                          onPress={() => setSelectedModality(isActive ? null : mod)}
                        >
                          <Text style={[styles.chipText, isActive && styles.chipTextActive]}>{mod}</Text>
                        </Pressable>
                      );
                    })}

                     <View style={styles.filterDivider} />

                     {TYPE_FILTERS.map((type) => {
                       const isActive = selectedType === type;
                       return (
                         <Pressable
                           key={type}
                           style={[styles.chip, isActive && styles.chipActive]}
                           onPress={() => setSelectedType(isActive ? null : type)}
                         >
                           <Text style={[styles.chipText, isActive && styles.chipTextActive]}>{type}</Text>
                         </Pressable>
                       );
                     })}

                     <View style={styles.filterDivider} />

                     {MUSCLE_FILTERS.map((muscle) => {
                      const isActive = selectedMuscle === muscle;
                      return (
                        <Pressable
                          key={muscle}
                          style={[styles.chip, isActive && styles.chipActive]}
                          onPress={() => setSelectedMuscle(isActive ? null : muscle)}
                        >
                          <Text style={[styles.chipText, isActive && styles.chipTextActive]}>{muscle}</Text>
                        </Pressable>
                      );
                    })}
                  </ScrollView>
                </View>

<ScrollView showsVerticalScrollIndicator={false} style={styles.exerciseSelectorList} nestedScrollEnabled>                  {filteredExercises.length > 0 ? (
                    filteredExercises.map((ex) => {
                      const isSelected = selectedExerciseIds.includes(ex.id);
                      const hasProgressionVariants = exerciseLibrary.some(libEx => libEx.subSkillOf === ex.id);

                      return (
                        <Pressable
                          key={ex.id}
                          style={[styles.selectorRow, isSelected && styles.selectorRowActive]}
                          onPress={() => toggleExerciseSelection(ex.id)}
                        >
                          <View style={styles.selectorTextContainer}>
                            <View style={styles.exerciseNameRow}>
                              <Text style={[styles.selectorText, isSelected && styles.selectorTextActive]}>
                                {ex.name}
                              </Text>
                              {hasProgressionVariants && (
                                <View style={styles.progressionBadge}>
                                  <Text style={styles.progressionBadgeText}>Progressions</Text>
                                </View>
                              )}
                            </View>
                            <Text style={styles.selectorSubtext}>
                              {ex.type} • {ex.modality} • {ex.muscles.map(m => m.muscleId).join(', ')}
                            </Text>
                            {hasProgressionVariants && (
                              <Text style={styles.progressionHint}>
                                This exercise has progression variations that will be selectable during workout
                              </Text>
                            )}
                          </View>
                          {isSelected && <Text style={styles.checkmark}>✓</Text>}
                        </Pressable>
                      );
                    })
                  ) : (
                    <View style={styles.emptySearchContainer}>
                      <Text style={styles.emptySearchText}>
                        {showSelectedOnly && selectedExerciseIds.length === 0
                          ? "You haven't checked any exercises yet!"
                          : "No exercises match your choices."}
                      </Text>
                    </View>
                  )}
                </ScrollView>
              </>
            ) : (
              <ScrollView showsVerticalScrollIndicator={false} style={styles.configList} nestedScrollEnabled>
                {selectedExerciseIds.map((id, index) => {
                  const exDetails = exerciseLibrary.find(e => e.id === id);
                  const isHold = checkIsHold(id);
                  const isFirst = index === 0;
                  const isLast = index === selectedExerciseIds.length - 1;

                  const currentConf = exerciseConfigs[id];

                  const prevId = index > 0 ? selectedExerciseIds[index - 1] : null;
                  const isLinkedByPrevious = prevId ? !!exerciseConfigs[prevId]?.supersetWithNext : false;
                  const isSupersetJoined = currentConf?.supersetWithNext && !isLast && !isLinkedByPrevious;

                  return (
                    <View
                      key={id}
                      style={[
                        styles.configCard,
                        isSupersetJoined && styles.configCardSupersetJoined,
                        isLinkedByPrevious && styles.configCardSupersetChild
                      ]}
                    >
                      <View style={styles.configCardHeader}>
                        <Text style={styles.configExerciseName}>
                          {exDetails?.name || id} {isSupersetJoined && "🔗 (Superset Top)"} {isLinkedByPrevious && "🔗 (Superset Bottom)"}
                        </Text>

                        <View style={styles.orderButtonsContainer}>
                          <Pressable
                            style={[styles.orderButton, isFirst && styles.orderButtonDisabled]}
                            disabled={isFirst}
                            onPress={() => moveExerciseOrder(index, "up")}
                          >
                            <Text style={styles.orderButtonText}>↑</Text>
                          </Pressable>
                          <Pressable
                            style={[styles.orderButton, isLast && styles.orderButtonDisabled]}
                            disabled={isLast}
                            onPress={() => moveExerciseOrder(index, "down")}
                          >
                            <Text style={styles.orderButtonText}>↓</Text>
                          </Pressable>
                        </View>
                      </View>

                      <View style={styles.configRow}>
                        {!isLinkedByPrevious && (
                          <View style={styles.inputGroup}>
                            <Text style={styles.inputLabel}>Sets</Text>
                            <NumericInput
                              style={styles.smallInput}
                              value={currentConf?.sets || ""}
                              onChangeText={(val) => updateConfig(id, "sets", val)}
                              maxLength={3}
                              label="Sets"
                            />
                          </View>
                        )}

                        {isHold ? (
                          <View style={styles.inputGroup}>
                            <Text style={styles.inputLabel}>Hold (s)</Text>
                            <NumericInput
                              style={styles.smallInput}
                              value={currentConf?.hold || ""}
                              onChangeText={(val) => updateConfig(id, "hold", val)}
                              maxLength={3}
                              label="Hold"
                            />
                          </View>
                        ) : (
                          <View style={styles.inputGroup}>
                            <Text style={styles.inputLabel}>Reps Range</Text>
                            <NumericInput
                              style={styles.smallInput}
                              placeholder="e.g. 4-8"
                              placeholderTextColor={theme.colors.textSecondary}
                              value={currentConf?.reps}
                              onChangeText={(val) => updateConfig(id, "reps", val)}
                              allowRange
                              maxLength={5}
                              label="Reps range"
                            />
                          </View>
                        )}
                      </View>

                      <View style={styles.advancedConfigRow}>
                        <View style={styles.toggleContainer}>
                          <Text style={styles.toggleLabel}>Dropset</Text>
                          <Switch
                            value={currentConf?.specialType === "dropset"}
                            onValueChange={(checked) =>
                              updateConfig(id, "specialType", checked ? "dropset" : "normal")
                            }
                            trackColor={{ true: theme.colors.accent }}
                          />
                        </View>

                        {!isLast && !isLinkedByPrevious && (
                          <View style={styles.toggleContainer}>
                            <Text style={styles.toggleLabel}>Link Superset Next</Text>
                            <Switch
                              value={!!currentConf?.supersetWithNext}
                              onValueChange={(checked) =>
                                updateConfig(id, "supersetWithNext", checked)
                              }
                              trackColor={{ true: theme.colors.accent }}
                            />
                          </View>
                        )}
                      </View>

                      {currentConf?.specialType === "dropset" && (
                        <View style={styles.dropsetInputContainer}>
                          <Text style={styles.inputLabel}>Dropsets count per set</Text>
                          <NumericInput
                            style={[styles.smallInput, { width: 60, marginTop: 4 }]}
                            value={currentConf?.dropsetsPerSet || ""}
                            onChangeText={(val) => updateConfig(id, "dropsetsPerSet", val)}
                            maxLength={2}
                            label="Dropsets"
                          />
                        </View>
                      )}
                    </View>
                  );
                })}
              </ScrollView>
            )}

            <View style={styles.modalButtons}>
              <Pressable
                style={[styles.modalButton, styles.modalCancelButton]}
                onPress={() => {
                  if (creationStep === 2) {
                    setCreationStep(1);
                  } else {
                    resetModalState();
                  }
                }}
              >
                <Text style={styles.modalCancelText}>{creationStep === 2 ? "Back" : "Cancel"}</Text>
              </Pressable>

              <Pressable
                style={[
                  styles.modalButton,
                  styles.modalConfirmButton,
                  (!routineName.trim() || selectedExerciseIds.length === 0) && styles.disabledButton
                ]}
                onPress={() => creationStep === 1 ? setCreationStep(2) : handleSaveRoutine()}
                disabled={!routineName.trim() || selectedExerciseIds.length === 0}
              >
                <Text style={styles.modalConfirmText}>
                  {creationStep === 1 ? "Next Step" : "Save Changes"}
                </Text>
              </Pressable>
            </View>

            {creationStep === 2 && routineInsights.length > 0 && (
              <View style={styles.insightPanel}>
                <Text style={styles.insightPanelTitle}>Recommendations</Text>
                {routineInsights.map((msg, i) => (
                  <View key={i} style={styles.insightRow}>
                    <Text style={[styles.insightDot, styles.dotWarn]}>●</Text>
                    <Text style={styles.insightText}>{msg}</Text>
                  </View>
                ))}
              </View>
            )}
          </View>
        </View>
      </Modal>

      <Modal
        animationType="slide"
        transparent={true}
        visible={isBuilderVisible}
        onRequestClose={() => setIsBuilderVisible(false)}
      >
        <View style={styles.modalOverlay}>
          <View style={styles.modalContent}>
            <Text style={styles.modalTitle}>Smart Routine Builder</Text>

            <ScrollView style={{ maxHeight: 420 }} showsVerticalScrollIndicator={false}>
              <Text style={styles.sectionLabel}>Routine name</Text>
              <TextInput
                style={styles.input}
                value={builderName}
                onChangeText={setBuilderName}
                placeholder="e.g. Pull Focus A"
                placeholderTextColor={theme.colors.textMuted}
              />

              <View style={styles.builderSectionHeader}>
                <Text style={styles.sectionLabel}>Muscles targeted</Text>
                <Pressable style={styles.builderMiniButton} onPress={toggleAllMuscles}>
                  <Text style={styles.builderMiniButtonText}>
                    {builderMuscles.length === MUSCLE_FILTERS.length ? "Deselect all" : "Select all"}
                  </Text>
                </Pressable>
              </View>
              <View style={styles.filterRow}>
                {MUSCLE_FILTERS.map((muscle) => {
                  const isActive = builderMuscles.includes(muscle as MuscleGroupId);
                  return (
                    <Pressable
                      key={muscle}
                      style={[styles.chip, isActive && styles.chipActive]}
                      onPress={() => toggleBuilderMuscle(muscle as MuscleGroupId)}
                    >
                      <Text style={[styles.chipText, isActive && styles.chipTextActive]}>{muscle}</Text>
                    </Pressable>
                  );
                })}
              </View>

              <View style={styles.builderSectionHeader}>
                <Text style={styles.sectionLabel}>Equipment available</Text>
                <Pressable style={styles.builderMiniButton} onPress={toggleAllEquipment}>
                  <Text style={styles.builderMiniButtonText}>
                    {builderEquipment.length === EQUIPMENT_OPTIONS.length ? "Deselect all" : "Select all"}
                  </Text>
                </Pressable>
              </View>
              <View style={styles.filterRow}>
                {EQUIPMENT_OPTIONS.map((item) => {
                  const isActive = builderEquipment.includes(item);
                  return (
                    <Pressable
                      key={item}
                      style={[styles.chip, isActive && styles.chipActive]}
                      onPress={() => toggleBuilderEquipment(item)}
                    >
                      <Text style={[styles.chipText, isActive && styles.chipTextActive]}>
                        {EQUIPMENT_LABELS[item]}
                      </Text>
                    </Pressable>
                  );
                })}
              </View>

              <Text style={styles.sectionLabel}>How much per muscle</Text>
              <View style={styles.stepperRow}>
                <Text style={styles.stepperLabel}>Exercises</Text>
                <Pressable
                  style={styles.stepperButton}
                  onPress={() => setBuilderExercisesPerMuscle((value) => Math.max(1, value - 1))}
                >
                  <Text style={styles.stepperButtonText}>−</Text>
                </Pressable>
                <Text style={styles.stepperValue}>{builderExercisesPerMuscle}</Text>
                <Pressable
                  style={styles.stepperButton}
                  onPress={() => setBuilderExercisesPerMuscle((value) => Math.min(6, value + 1))}
                >
                  <Text style={styles.stepperButtonText}>+</Text>
                </Pressable>
              </View>

              <View style={styles.stepperRow}>
                <Text style={styles.stepperLabel}>Sets each</Text>
                <Pressable style={styles.stepperButton} onPress={() => setBuilderSets((value) => Math.max(1, value - 1))}>
                  <Text style={styles.stepperButtonText}>−</Text>
                </Pressable>
                <Text style={styles.stepperValue}>{builderSets}</Text>
                <Pressable style={styles.stepperButton} onPress={() => setBuilderSets((value) => Math.min(8, value + 1))}>
                  <Text style={styles.stepperButtonText}>+</Text>
                </Pressable>
              </View>

              <View style={styles.builderToggleRow}>
                <Text style={styles.inputLabel}>Allow weighted exercises</Text>
                <Switch
                  value={builderWeighted}
                  onValueChange={setBuilderWeighted}
                  trackColor={{ false: theme.colors.border, true: theme.colors.accent }}
                  thumbColor={theme.colors.textPrimary}
                />
              </View>

              <Text style={styles.builderHint}>
                Each exercise trains exactly one of your picked muscles hard, so
                {` ${builderMuscles.length} muscle(s) × ${builderExercisesPerMuscle} = ${builderMuscles.length * builderExercisesPerMuscle} exercises.`}
              </Text>

              {builderError && <Text style={styles.builderError}>{builderError}</Text>}
            </ScrollView>

            <View style={styles.modalButtons}>
              <Pressable
                style={[styles.modalButton, styles.modalCancelButton]}
                onPress={() => setIsBuilderVisible(false)}
              >
                <Text style={styles.modalCancelText}>Cancel</Text>
              </Pressable>
              <Pressable
                style={[
                  styles.modalButton,
                  styles.modalConfirmButton,
                  (builderMuscles.length === 0 || !builderName.trim()) && styles.disabledButton,
                ]}
                onPress={handleGenerateRoutine}
                disabled={builderMuscles.length === 0 || !builderName.trim()}
              >
                <Text style={styles.modalConfirmText}>Generate</Text>
              </Pressable>
            </View>
          </View>
        </View>
      </Modal>

<ScrollView showsVerticalScrollIndicator={false} contentContainerStyle={styles.content}>

        <Pressable style={styles.createButton} onPress={handleCreatePress}>
          <Text style={styles.createButtonText}>+ Create Custom Routine</Text>
        </Pressable>

        <Pressable
          style={styles.createButton}
          onPress={() => {
            setBuilderError(null);
            setBuilderName("");
            setIsBuilderVisible(true);
          }}
        >
          <Text style={styles.createButtonText}>⚡ Smart Routine Builder</Text>
        </Pressable>

        <View style={styles.list}>
          {!isLoading && allRoutines.map((routine) => {
            return (
              <View key={routine.id} style={styles.cardContainer}>
                <View style={styles.cardHeaderRow}>
                  <Text style={styles.cardTitle}>{routine.name}</Text>

                  <View style={styles.cardActionsContainer}>
                    <Pressable
  style={styles.editActionButton}
  onPress={() => handleEditPress(routine)}
  hitSlop={12}
>
  <Text style={styles.editButtonText}>Edit</Text>
</Pressable>
                    <Pressable
                      style={styles.deleteButton}
                      onPress={() => handleDeletePress(routine)}
                      hitSlop={12}
                    >
                      <Text style={styles.deleteButtonText}>✕</Text>
                    </Pressable>
                  </View>
                </View>

                <Text style={styles.cardDescription}>{routine.description}</Text>

                <View style={styles.statsRow}>
                  <Text style={styles.cardStats}>{routine.exerciseCount} Exercises</Text>
                  <Text style={styles.cardStats}>•</Text>
                  <Text style={styles.cardStats}>{routine.estimatedMinutes} mins</Text>
                </View>

                <Text style={styles.muscleSectionTitle}>Targeted Muscles:</Text>
                <View style={styles.muscleTagContainer}>
                  {getTargetedMusclesSummary(routine.exercises).map(({ muscleId, type }) => (
                    <View
                      key={muscleId}
                      style={[
                        styles.muscleTag,
                        type === "Primary" ? styles.tagPrimary : styles.tagSecondary
                      ]}
                    >
                      <Text style={[styles.tagText, type === "Primary" && styles.tagTextPrimary]}>
                        {muscleId} • {type}
                      </Text>
                    </View>
                  ))}
                </View>
              </View>
            );
          })}
        </View>
      </ScrollView>
    </Screen>
  );
}

const styles = StyleSheet.create({
  content: {
    paddingHorizontal: theme.spacing.lg,
    paddingTop: theme.spacing.xl,
    paddingBottom: theme.spacing.xl,
    gap: theme.spacing.lg,
  },
  header: { gap: theme.spacing.sm },
  title: { ...theme.typography.title, color: theme.colors.textPrimary },
  body: { ...theme.typography.body, color: theme.colors.textSecondary },
  list: { gap: theme.spacing.md },
  createButton: {
    backgroundColor: theme.colors.surface,
    borderWidth: 1,
    borderColor: theme.colors.border,
    borderStyle: "dashed",
    padding: 16,
    borderRadius: 12,
    alignItems: "center",
  },
  createButtonText: { color: theme.colors.accent, fontWeight: "600", fontSize: 15 },
  builderRow: { flexDirection: "row", gap: 16, alignItems: "flex-end", marginTop: 4 },
  builderSectionHeader: {
    flexDirection: "row",
    alignItems: "center",
    justifyContent: "space-between",
    marginTop: 12,
  },
  builderMiniButton: {
    paddingHorizontal: 12,
    paddingVertical: 6,
    borderRadius: 999,
    borderWidth: 1,
    borderColor: theme.colors.border,
    backgroundColor: theme.colors.surfaceRaised,
  },
  builderMiniButtonText: { fontSize: 12, fontWeight: "600", color: theme.colors.textSecondary },
  stepperRow: {
    flexDirection: "row",
    alignItems: "center",
    gap: 12,
    marginTop: 10,
    paddingVertical: 10,
    paddingHorizontal: 14,
    borderRadius: 12,
    borderWidth: 1,
    borderColor: theme.colors.border,
    backgroundColor: theme.colors.surfaceRaised,
  },
  stepperLabel: { flex: 1, fontSize: 14, fontWeight: "600", color: theme.colors.textPrimary },
  stepperButton: {
    width: 34,
    height: 34,
    borderRadius: 17,
    alignItems: "center",
    justifyContent: "center",
    borderWidth: 1,
    borderColor: theme.colors.border,
    backgroundColor: theme.colors.surface,
  },
  stepperButtonText: { fontSize: 18, fontWeight: "700", color: theme.colors.textPrimary, lineHeight: 20 },
  stepperValue: { minWidth: 24, textAlign: "center", fontSize: 16, fontWeight: "700", color: theme.colors.textPrimary },
  builderHint: { marginTop: 12, fontSize: 12, lineHeight: 18, color: theme.colors.textMuted },
  builderToggleRow: {
    flexDirection: "row",
    alignItems: "center",
    justifyContent: "space-between",
    marginTop: 12,
  },
  builderError: { fontSize: 12, color: theme.colors.danger, marginTop: 10 },

  cardContainer: {
    backgroundColor: theme.colors.surface,
    padding: 16,
    borderRadius: 14,
    borderWidth: 1,
    borderColor: theme.colors.border,
    gap: 8,
  },
  cardHeaderRow: {
    flexDirection: "row",
    justifyContent: "space-between",
    alignItems: "center",
  },
  cardTitle: { fontSize: 16, fontWeight: "700", color: theme.colors.textPrimary, flex: 1 },

  cardActionsContainer: {
    flexDirection: "row",
    alignItems: "center",
    gap: 14,
  },
  editActionButton: {
  paddingHorizontal: 8,
  paddingVertical: 3,
  borderRadius: 6,
  backgroundColor: "rgba(255,255,255,0.06)",
  borderWidth: 1,
  borderColor: theme.colors.border,
},
editButtonText: {
  fontSize: 12,
  fontWeight: "600",
  color: theme.colors.textPrimary,
},
  deleteButton: {
  width: 28,
  height: 28,
  borderRadius: 14,
  backgroundColor: "rgba(255,255,255,0.06)",
  borderWidth: 1,
  borderColor: theme.colors.border,
  alignItems: "center",
  justifyContent: "center",
},
deleteButtonText: {
  color: theme.colors.textSecondary,
  fontSize: 12,
  fontWeight: "700",
},
  cardDescription: { fontSize: 13, color: theme.colors.textSecondary },
  statsRow: { flexDirection: "row", gap: 6, alignItems: "center" },
  cardStats: { fontSize: 12, color: theme.colors.textSecondary, fontWeight: "500" },
  muscleSectionTitle: { fontSize: 11, fontWeight: "600", color: theme.colors.textSecondary, marginTop: 4, textTransform: "uppercase", letterSpacing: 0.5 },
  muscleTagContainer: { flexDirection: "row", flexWrap: "wrap", gap: 6 },
  muscleTag: { paddingHorizontal: 8, paddingVertical: 4, borderRadius: 6, borderWidth: 1 },
  tagPrimary: { backgroundColor: "rgba(255, 69, 58, 0.12)", borderColor: "rgba(255, 69, 58, 0.5)" },
  tagSecondary: { backgroundColor: "rgba(0, 122, 255, 0.08)", borderColor: "rgba(0, 122, 255, 0.3)" },
  tagText: { fontSize: 11, color: theme.colors.textSecondary, textTransform: "capitalize" },
  tagTextPrimary: { color: theme.colors.textPrimary, fontWeight: "600" },

  modalOverlay: {
    flex: 1,
    backgroundColor: "rgba(0, 0, 0, 0.6)",
    justifyContent: "center",
    alignItems: "center",
    padding: 20,
  },
  modalContent: {
    backgroundColor: theme.colors.surface,
    padding: 24,
    borderRadius: 16,
    width: "100%",
    maxWidth: 360,
    maxHeight: "85%",
    gap: 16,
    borderWidth: 1,
    borderColor: theme.colors.border,
    elevation: 5,
  },

  alertContentCard: {
    backgroundColor: theme.colors.surface || "#ffffff",
    padding: 24,
    borderRadius: 16,
    width: "100%",
    maxWidth: 340,
    gap: 14,
    borderWidth: 1,
    borderColor: theme.colors.border || "#e0e0e0",
    alignItems: "center",
    elevation: 5,
  },
  alertTitle: {
    fontSize: 18,
    fontWeight: "700",
    color: theme.colors.textPrimary || "#000",
    textAlign: "center",
  },
  alertBody: {
    fontSize: 14,
    color: theme.colors.textSecondary || "#666",
    textAlign: "center",
    lineHeight: 20,
    marginBottom: 8,
  },
  alertButtonsRow: {
    flexDirection: "row",
    gap: 12,
    width: "100%",
  },
  alertButton: {
    flex: 1,
    padding: 12,
    borderRadius: 10,
    alignItems: "center",
  },
  alertCancelButton: {
    backgroundColor: "transparent",
    borderWidth: 1,
    borderColor: theme.colors.border || "#ccc",
  },
  alertDeleteButton: {
    backgroundColor: "#FF453A",
  },
  alertCancelText: {
    color: theme.colors.textPrimary || "#333",
    fontWeight: "600",
  },
  alertDeleteText: {
    color: "#ffffff",
    fontWeight: "600",
  },

  modalTitle: { fontSize: 18, fontWeight: "700", color: theme.colors.textPrimary },
  sectionLabel: { fontSize: 14, fontWeight: "600", color: theme.colors.textSecondary, marginBottom: -4 },
  input: {
    padding: 12,
    borderRadius: 8,
    backgroundColor: theme.colors.background || "#111",
    borderWidth: 1,
    borderColor: theme.colors.border,
    color: theme.colors.textPrimary,
    fontSize: 15,
  },
  searchInput: {
    padding: 10,
    borderRadius: 8,
    backgroundColor: theme.colors.background || "#111",
    borderWidth: 1,
    borderColor: theme.colors.border,
    color: theme.colors.textPrimary,
    fontSize: 14,
  },
  filterContainer: {
    marginHorizontal: -4,
    marginBottom: -4,
  },
  filterScroll: {
    flexDirection: "row",
    alignItems: "center",
    gap: 6,
    paddingHorizontal: 4,
  },
  filterRow: {
    flexDirection: "row",
    flexWrap: "wrap",
    alignItems: "center",
    gap: 6,
    marginTop: 8,
  },
  chip: {
    paddingHorizontal: 12,
    paddingVertical: 6,
    borderRadius: 20,
    backgroundColor: theme.colors.background || "#111",
    borderWidth: 1,
    borderColor: theme.colors.border,
  },
  chipActive: {
    backgroundColor: theme.colors.accent,
    borderColor: theme.colors.accent,
  },
  chipActiveSelected: {
    backgroundColor: theme.colors.accent,
    borderColor: theme.colors.accent,
  },
  chipText: {
    fontSize: 12,
    color: theme.colors.textSecondary,
    textTransform: "capitalize",
  },
  chipTextActive: {
    color: "#fff",
    fontWeight: "600",
  },
  filterDivider: {
    width: 1,
    height: 16,
    backgroundColor: theme.colors.border,
    marginHorizontal: 4,
  },
  exerciseSelectorList: {
    maxHeight: 200,
    borderWidth: 1,
    borderColor: theme.colors.border,
    borderRadius: 8,
    backgroundColor: theme.colors.background || "#111",
  },
  selectorRow: { flexDirection: "row", alignItems: "center", padding: 12, borderBottomWidth: 1, borderBottomColor: theme.colors.border },
  selectorRowActive: { backgroundColor: "rgba(0, 122, 255, 0.1)" },
  selectorTextContainer: { flex: 1, gap: 2 },
  selectorText: { color: theme.colors.textPrimary },
  selectorTextActive: { color: theme.colors.accent, fontWeight: "600" },
  selectorSubtext: { fontSize: 11, color: theme.colors.textSecondary, textTransform: "capitalize" },
  exerciseNameRow: { flexDirection: "row", alignItems: "center", gap: 8, flexWrap: "wrap" },
  progressionBadge: { backgroundColor: "rgba(0, 122, 255, 0.15)", paddingHorizontal: 8, paddingVertical: 2, borderRadius: 4 },
  progressionBadgeText: { fontSize: 10, color: theme.colors.accent, fontWeight: "600", textTransform: "uppercase", letterSpacing: 0.5 },
  progressionHint: { fontSize: 10, color: theme.colors.textSecondary, marginTop: 2, fontStyle: "italic" },
  checkmark: { color: theme.colors.accent, fontWeight: "700" },
  emptySearchContainer: { padding: 24, alignItems: "center" },
  emptySearchText: { color: theme.colors.textSecondary, fontSize: 14, textAlign: 'center' },

  configList: { maxHeight: 300, gap: 12 },
  configCard: {
    padding: 12,
    borderRadius: 8,
    backgroundColor: theme.colors.background || "#111",
    borderWidth: 1,
    borderColor: theme.colors.border,
    marginBottom: 8,
  },
  configCardSupersetJoined: {
    borderBottomWidth: 0,
    borderBottomLeftRadius: 0,
    borderBottomRightRadius: 0,
    marginBottom: 0,
    borderColor: "#007AFF",
  },
  configCardSupersetChild: {
    borderTopWidth: 0,
    borderTopLeftRadius: 0,
    borderTopRightRadius: 0,
    marginTop: 0,
    borderBottomWidth: 2,
    borderBottomColor: "#007AFF",
    borderColor: "#007AFF",
  },
  configCardHeader: {
    flexDirection: "row",
    justifyContent: "space-between",
    alignItems: "center",
    marginBottom: 8,
  },
  configExerciseName: { color: theme.colors.textPrimary, fontWeight: "600", flex: 1, marginRight: 8 },
  orderButtonsContainer: {
    flexDirection: "row",
    gap: 4,
  },
  orderButton: {
    backgroundColor: theme.colors.surface,
    borderWidth: 1,
    borderColor: theme.colors.border,
    width: 28,
    height: 28,
    borderRadius: 6,
    alignItems: "center",
    justifyContent: "center",
  },
  orderButtonDisabled: {
    opacity: 0.3,
  },
  orderButtonText: {
    color: theme.colors.textPrimary,
    fontSize: 14,
    fontWeight: "600",
  },

  configRow: { flexDirection: "row", gap: 16 },
  inputGroup: { flex: 1, gap: 4 },
  inputLabel: { fontSize: 11, color: theme.colors.textSecondary, fontWeight: "500" },
  smallInput: {
    padding: 8,
    borderRadius: 6,
    backgroundColor: theme.colors.surface,
    borderWidth: 1,
    borderColor: theme.colors.border,
    color: theme.colors.textPrimary,
    fontSize: 14,
  },
  advancedConfigRow: {
    flexDirection: "row",
    justifyContent: "space-between",
    alignItems: "center",
    marginTop: 12,
    paddingTop: 8,
    borderTopWidth: 1,
    borderTopColor: "rgba(255,255,255,0.05)",
  },
  toggleContainer: {
    flexDirection: "row",
    alignItems: "center",
    gap: 8,
  },
  toggleLabel: {
    fontSize: 12,
    color: theme.colors.textSecondary,
  },
  dropsetInputContainer: {
    marginTop: 8,
  },
  modalButtons: { flexDirection: "row", gap: 12, width: "100%", marginTop: 8 },
  modalButton: { flex: 1, padding: 12, borderRadius: 10, alignItems: "center" },
  modalCancelButton: { backgroundColor: "transparent", borderWidth: 1, borderColor: theme.colors.border },
  modalConfirmButton: { backgroundColor: theme.colors.accent },
  disabledButton: { opacity: 0.4 },
  modalCancelText: { color: theme.colors.textPrimary, fontWeight: "600" },
  modalConfirmText: { color: "#fff", fontWeight: "600" },

  insightPanel: {
    backgroundColor: theme.colors.background || "#111",
    borderWidth: 1,
    borderColor: theme.colors.border,
    borderRadius: 10,
    padding: 12,
    gap: 8,
  },
  insightPanelTitle: {
    fontSize: 12,
    fontWeight: "700",
    color: theme.colors.textSecondary,
    textTransform: "uppercase",
    letterSpacing: 0.6,
    marginBottom: 2,
  },
  insightRow: {
    flexDirection: "row",
    alignItems: "flex-start",
    gap: 8,
  },
  insightDot: {
    fontSize: 10,
    lineHeight: 18,
  },
  dotGood: {
    color: "#30D158",
  },
  dotWarn: {
    color: "#FF9F0A",
  },
  dotNeutral: {
    color: theme.colors.accent || "#007AFF",
  },
  insightText: {
    flex: 1,
    fontSize: 13,
    color: theme.colors.textPrimary,
    lineHeight: 18,
  },
});
