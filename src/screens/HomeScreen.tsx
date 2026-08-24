// This legacy screen uses progressively-shaped persisted workout data.
// Runtime guards handle those shapes; keep strict inference from blocking Expo's check.
// @ts-nocheck
import { 
  AppState, 
  AppStateStatus, 
  ScrollView, 
  StyleSheet, 
  Text, 
  View, 
  Pressable, 
  TextInput, 
  Modal, 
  ActivityIndicator,
  Switch              // <--- Add this line
} from "react-native";
import { useState, useEffect, useMemo, useCallback, useRef } from "react";
import AsyncStorage from "@react-native-async-storage/async-storage";
import { CongratulationsAnimation } from "../components/ui/Celebration"; // Adjust relative path as needed
import { RoutineCard } from "../components/cards/RoutineCard";
import { Screen } from "../components/layout/Screen";
import { starterRoutines } from "../data/starterRoutines";
import { exerciseLibrary } from "../data/exerciseLibrary";
import { muscleGroups } from "../data/muscleGroups";
import { theme } from "../theme/theme";
import { useRoutines } from "../context/RoutineContext";
import { Button } from "@/components/ui/Button";
import { Card } from "@/components/ui/Card";
import NumericInput from "@/components/ui/NumericInput";
import { Routine, RoutineExercise } from "../models/routine";
import { MuscleRecoveryPreview } from "../models/muscle";
import { calculateRecovery } from "../utils/recovery";
import { isHoldExercise } from "../utils/exerciseClassification";
import {
  creditStreakDay,
  emptyStreakState,
  endDeload,
  resolveStreak,
  startDeload,
  StreakState,
  STREAK_STATE_KEY,
} from "../utils/streak";

import {
  formatSetLabel,
  getDropsetCount,
  getSupersetPartner,
  getSupersetPrimary,
  groupExercisesForDisplay,
  isInSuperset,
  isSupersetGroupActive,
  isSupersetGroupComplete,
  isSupersetPartner,
  isSupersetPrimary,
  WorkoutExercise
} from "../utils/workoutExecution";

const MULTI_ACTIVE_WORKOUTS_KEY = "@multi_active_workouts_state";
const ACTIVE_SPLIT_KEY = "@active_workout_split";
const SPLIT_LIBRARY_KEY = "@workout_split_library";
const COMPLETED_ROUTINES_TODAY_KEY = "@completed_routines_today";
const WORKOUT_HISTORY_KEY = "@workout_history";

const DAYS_OF_WEEK = ["Sunday", "Monday", "Tuesday", "Wednesday", "Thursday", "Friday", "Saturday"];

const formatExerciseName = (id: string) => {
  if (!id) return "No exercise loaded";
  return id
    .split("-")
    .map((word: string) => word.charAt(0).toUpperCase() + word.slice(1))
    .join(" ");
};

export function HomeScreen() {
  const { customRoutines, deletedStarterIds, isLoading } = useRoutines();

  // Navigation / Modes: "idle", "selecting", "selecting_different", "active", "split_editor"
  const [mode, setMode] = useState("idle");
  const [celebrations, setCelebrations] = useState<Array<{ id: string; variant: 'workoutFinish' | 'prReplacement' | 'streak'; message: string }>>([]);

  const enqueueCelebration = useCallback((variant: 'workoutFinish' | 'prReplacement' | 'streak', message: string) => {
    const id = `${Date.now()}-${Math.random().toString(36).slice(2, 8)}`;
    setCelebrations((current) => [...current, { id, variant, message }]);
  }, []);

  const removeCelebration = useCallback((id: string) => {
    setCelebrations((current) => current.filter((item) => item.id !== id));
  }, []);

  // Weekly Split Configurations
  const [activeSplit, setActiveSplit] = useState(null);
  const [activeSplitId, setActiveSplitId] = useState<string | null>(null);
  const [splitProfiles, setSplitProfiles] = useState<any[]>([]);
  const [editingSplitName, setEditingSplitName] = useState("My Weekly Split");
  const [targetDayIndex, setTargetDayIndex] = useState(null);
  const [isSplitPickerVisible, setIsSplitPickerVisible] = useState(false);
  const [splitToDelete, setSplitToDelete] = useState<any | null>(null);
  const [searchQuery, setSearchQuery] = useState("");
  const [isSearchModalVisible, setIsSearchModalVisible] = useState(false);
  const [showSplitInsights, setShowSplitInsights] = useState(false);
  const [isWorkoutExercisePickerVisible, setIsWorkoutExercisePickerVisible] = useState(false);
  const [workoutExerciseChangeMode, setWorkoutExerciseChangeMode] = useState<"add" | "swap">("add");
  const [workoutExerciseSearch, setWorkoutExerciseSearch] = useState("");
  const [workoutExerciseModality, setWorkoutExerciseModality] = useState<string | null>(null);
  const [workoutExerciseMuscle, setWorkoutExerciseMuscle] = useState<string | null>(null);
  const [workoutExerciseType, setWorkoutExerciseType] = useState<string | null>(null);
  const [workoutPickerStep, setWorkoutPickerStep] = useState<"search" | "configure">("search");
  const [pendingWorkoutExerciseId, setPendingWorkoutExerciseId] = useState<string | null>(null);
  const [sessionTargetSets, setSessionTargetSets] = useState("3");
  const [sessionTargetReps, setSessionTargetReps] = useState("8-12");
  const [sessionTargetHold, setSessionTargetHold] = useState("30");
  const [sessionSpecialType, setSessionSpecialType] = useState<"normal" | "dropset">("normal");
  const [sessionDropsetsPerSet, setSessionDropsetsPerSet] = useState("1");
  const [sessionSupersetWithNext, setSessionSupersetWithNext] = useState(false);

  // Split adherence streak (frozen while deloading)
  const [streakState, setStreakState] = useState<StreakState>(emptyStreakState);

  // Status trackers for today's pipeline
  const [completedRoutineIds, setCompletedRoutineIds] = useState([]);
  const [partialRoutineIds, setPartialRoutineIds] = useState([]);
  // Routines whose exercises were deleted mid-workout: they can't credit the day.
  const [trimmedRoutineIds, setTrimmedRoutineIds] = useState<string[]>([]);

  // Dictionary of all active states indexed by routineId
  const [allActiveStates, setAllActiveStates] = useState({});

// Current Workout Tracking State
   const [selectedRoutine, setSelectedRoutine] = useState<Routine | null>(null);
   
   // Robust tracking tied directly to a unique Instance ID string
   const [activeExerciseInstanceId, setActiveExerciseInstanceId] = useState<string | null>(null);
  const [setIndex, setSetIndex] = useState(0);
  const [dropIndex, setDropIndex] = useState(0);
  const [phase, setPhase] = useState("waiting");
  const [seconds, setSeconds] = useState(0);
  const [restSeconds, setRestSeconds] = useState(0);
  const [restTargetExerciseInstanceId, setRestTargetExerciseInstanceId] = useState<string | null>(null);
  const [totalDuration, setTotalDuration] = useState(0); 
  const [completedWholeRoutine, setCompletedWholeRoutine] = useState(false);
  const [isPaused, setIsPaused] = useState(false);

  // Array storing completed unique instances to style grayed-out items
  const [completedInstanceIds, setCompletedInstanceIds] = useState([]);

  // Set Metric State
  const [load, setLoad] = useState("");
  const [reps, setReps] = useState("");
  const [rir, setRir] = useState("");
  const [rpe, setRpe] = useState("");
  const [setLog, setSetLog] = useState([]);
  const [workoutHistory, setWorkoutHistory] = useState<any[]>([]);
  const [recoveryItems, setRecoveryItems] = useState<MuscleRecoveryPreview[]>([]);
  const [previousWorkoutComparison, setPreviousWorkoutComparison] = useState(null);
  const [currentSessionId, setCurrentSessionId] = useState<string | null>(null);

  // Modals
  const [isAlertVisible, setIsAlertVisible] = useState(false);
  const [isPartialAlertVisible, setIsPartialAlertVisible] = useState(false);
  const [targetPartialRoutineId, setTargetPartialRoutineId] = useState(null);

  // Subskill selection for exercises that are skills
  const [selectedSubSkill, setSelectedSubSkill] = useState(null);
  const [isSubSkillModalVisible, setIsSubSkillModalVisible] = useState(false);

  // Computed Lists
  const activeStarters = starterRoutines.filter((sr) => !deletedStarterIds?.includes(sr.id));
  const allRoutines = [...customRoutines, ...activeStarters];

  const exercises = selectedRoutine?.exercises ?? [];
  
  // Find current active tracking item via static instance identifier link safely
  const currentExercise = exercises.find(ex => ex.instanceId === activeExerciseInstanceId) || exercises[0];
  const exerciseIndex = exercises.findIndex(ex => ex.instanceId === (currentExercise?.instanceId));
  
  const totalSets = currentExercise?.targetSets ?? 1;
  const exerciseName = formatExerciseName(currentExercise?.exerciseId);
  const totalDrops = currentExercise ? getDropsetCount(currentExercise) : 0;
  const inSuperset = currentExercise ? isInSuperset(currentExercise, exerciseIndex, exercises) : false;
  const supersetPartner = currentExercise ? getSupersetPartner(currentExercise, exerciseIndex, exercises) : null;
  const isPrimary = currentExercise ? isSupersetPrimary(currentExercise, exerciseIndex, exercises) : false;
  const isPartner = currentExercise ? isSupersetPartner(currentExercise, exerciseIndex, exercises) : false;
  
  // Custom fixed set and drop status label formatter
  const setStatusLabel = `Set ${setIndex + 1}/${totalSets}${dropIndex > 0 ? ` • Drop ${dropIndex}/${totalDrops}` : ""}`;

  const selectedExerciseData = selectedSubSkill
    ? exerciseLibrary.find((ex) => ex.id === selectedSubSkill.id)
    : exerciseLibrary.find((ex) => ex.id === currentExercise?.exerciseId);

  const exerciseTarget = selectedExerciseData?.targetReps 
    ? `${selectedExerciseData.targetReps} reps` 
    : selectedExerciseData?.targetHoldSeconds 
    ? `${selectedExerciseData.targetHoldSeconds}s hold` 
    : selectedExerciseData?.type === "skill-static"
    ? "Hold"
    : "";

  const isHold =
    isHoldExercise(selectedExerciseData) ||
    selectedExerciseData?.targetHoldSeconds !== undefined ||
    currentExercise?.targetHoldSeconds !== undefined;

  const exerciseGroups = groupExercisesForDisplay(exercises);

  const makeSplitDayLabel = (index: number) => `Day ${index + 1}`;
  const buildSplitDays = (length: number) =>
    Array.from({ length }, (_, idx) => ({ day: makeSplitDayLabel(idx), routineIds: [] }));

  const getSplitCycleDayIndex = (split) => {
    if (!split?.days?.length) return 0;
    const startDate = split.startDate ? new Date(split.startDate) : new Date();
    const today = new Date();
    const start = new Date(startDate);
    start.setHours(0, 0, 0, 0);
    today.setHours(0, 0, 0, 0);
    const diffDays = Math.floor((today.getTime() - start.getTime()) / 86400000);
    return ((diffDays % split.days.length) + split.days.length) % split.days.length;
  };

  const currentSplitDayIndex = activeSplit ? getSplitCycleDayIndex(activeSplit) : 0;
  const currentSplitDayName = activeSplit?.days?.[currentSplitDayIndex]?.day || makeSplitDayLabel(currentSplitDayIndex);
  const todaysRoutineIds = activeSplit?.days?.[currentSplitDayIndex]?.routineIds || [];
  const todaysRoutines = todaysRoutineIds
    .map(id => allRoutines.find(r => r.id === id))
    .filter(Boolean);

  // Filter out routines in today's split configuration
  const differentRoutines = allRoutines.filter(r => !todaysRoutineIds.includes(r.id));

  // Search Results
  const filteredRoutines = allRoutines.filter(r =>
    r.name.toLowerCase().includes(searchQuery.toLowerCase())
  );

  const getSubskillsForExercise = (exerciseId) => {
    if (!exerciseId) return [];
    return exerciseLibrary.filter((ex) => ex.subSkillOf === exerciseId);
  };

  const currentExerciseData = exerciseLibrary.find((ex) => ex.id === currentExercise?.exerciseId);
  const childProgressions = currentExerciseData ? getSubskillsForExercise(currentExerciseData.id) : [];
  const availableSubskills = currentExerciseData ? [currentExerciseData, ...childProgressions] : [];
  const hasSubskills = childProgressions.length > 0;

  const workoutPickerExercises = exerciseLibrary.filter((exercise) => {
    if (exercise.subSkillOf) return false;
    const query = workoutExerciseSearch.toLowerCase().trim();
    if (query) {
      const matchesSearch =
        exercise.name.toLowerCase().includes(query) ||
        exercise.modality?.toLowerCase().includes(query) ||
        exercise.type?.toLowerCase().includes(query) ||
        exercise.muscles?.some((muscle) => muscle.muscleId.toLowerCase().includes(query));
      if (!matchesSearch) return false;
    }
    if (workoutExerciseModality && exercise.modality !== workoutExerciseModality) return false;
    if (workoutExerciseMuscle && !exercise.muscles?.some((muscle) => muscle.muscleId === workoutExerciseMuscle)) return false;
    if (workoutExerciseType && exercise.type !== workoutExerciseType) return false;
    return true;
  });

  const getRestSecondsForType = (type, rpeValue, mode = "default") => {
    const normalizedType = type || "compound";
    let baseSeconds = 90;

    if (mode === "exercise") {
      baseSeconds = 90;
    } else if (normalizedType === "compound") {
      baseSeconds = 3 * 60;
    } else if (normalizedType === "skill-static" || normalizedType === "skill-dynamic") {
      baseSeconds = 4 * 60;
    } else if (normalizedType === "isolation") {
      baseSeconds = 90;
    }

    const rpe = parseFloat(rpeValue);
    if (!rpeValue || isNaN(rpe) || rpe < 0 || rpe > 10) {
      return baseSeconds;
    }
    if (rpe <= 6) {
      return Math.round(baseSeconds * (1 / 3));
    }
    if (rpe <= 7) {
      return Math.round(baseSeconds * 1.0);
    }
    if (rpe <= 8) {
      return Math.round(baseSeconds * 1.1);
    }
    return Math.round(baseSeconds * 1.25);
  };

  useEffect(() => {
    setSelectedSubSkill(null);
  }, [currentExercise?.exerciseId]);
  // ==========================================
  // BEGIN ADVANCED SPLIT METRICS CALCULATION
  // ==========================================
  const computeSplitMetricsAndFatigue = () => {
    if (!activeSplit || !activeSplit.days) return { weeklyVolume: {}, warnings: [], frequencyWarnings: [], splitScore: 100 };

    const MAIN_MUSCLES = new Set([
      "chest", "upperBack", "lats",
      "frontDelts", "sideDelts", "rearDelts",
      "biceps", "triceps", "abs",
      "quads", "glutes", "hamstrings"
    ]);

    const weeklyVolume: Record<string, number> = {};
    const dailyMuscleSets: Record<number, Record<string, number>> = {};

    for (let i = 0; i < 7; i++) {
      dailyMuscleSets[i] = {};
    }

    activeSplit.days.forEach((dayObj, dayIndex) => {
      dayObj.routineIds.forEach((routineId) => {
        const routine = allRoutines.find((r) => r.id === routineId);
        if (!routine || !routine.exercises) return;

        routine.exercises.forEach((re) => {
          const exercise = exerciseLibrary.find((ex) => ex.id === re.exerciseId);
          if (!exercise || !exercise.muscles) return;

          const sets = (re.targetSets || 3) * (1 + (re.specialType === "dropset" ? (re.dropsetsPerSet ?? 1) : 0));

          exercise.muscles.forEach((m) => {
            const muscleId = m.muscleId;
            const load = m.load || "low";
            
            let multiplier = 0.0;
            if (load === "high") multiplier = 1.0;
            if (load === "medium") multiplier = 0.5;

            const calculatedVolume = sets * multiplier;

            if (calculatedVolume > 0) {
              weeklyVolume[muscleId] = (weeklyVolume[muscleId] || 0) + calculatedVolume;
              dailyMuscleSets[dayIndex][muscleId] = (dailyMuscleSets[dayIndex][muscleId] || 0) + calculatedVolume;
            }
          });
        });
      });
    });

    const warnings: string[] = [];
    let fatigueCount = 0;

    const cycleLength = activeSplit?.days?.length || 7;
    for (let d = 0; d < cycleLength; d++) {
      const nextDay = (d + 1) % cycleLength;
      const currentDayName = activeSplit?.days?.[d]?.day || makeSplitDayLabel(d);
      const nextDayName = activeSplit?.days?.[nextDay]?.day || makeSplitDayLabel(nextDay);

      const currentMuscles = dailyMuscleSets[d] || {};
      const nextMuscles = dailyMuscleSets[nextDay] || {};

      const checkConsecutiveFatigue = (musclesToCheck: string[], label: string, thresholdSets = 3) => {
        musclesToCheck.forEach((muscle) => {
          const todaySets = currentMuscles[muscle] || 0;
          const tomorrowSets = nextMuscles[muscle] || 0;

          if (todaySets >= thresholdSets && tomorrowSets > 0) {
            warnings.push(
              `High fatigue risk for ${label} (${muscle}) between ${currentDayName} and ${nextDayName}. Consecutive day loading detected.`
            );
            fatigueCount += 1;
          }
        });
      };

      // Mechanical & Overlap Fatigue Constraints
      checkConsecutiveFatigue(["chest", "frontDelts", "triceps"], "Push / Chest");
      checkConsecutiveFatigue(["lats", "upperBack", "rearDelts", "biceps"], "Pull / Back");
      checkConsecutiveFatigue(["quads", "hamstrings", "glutes"], "Legs / Lower Body");
      checkConsecutiveFatigue(["lowerBack"], "Lower Back / Spinal loading", 2);
    }

    const frequencyWarnings: string[] = [];
    let score = 100;

    muscleGroups.forEach((m) => {
      const daysTrained = Object.values(dailyMuscleSets).filter((dayMuscles) => (dayMuscles[m.id] || 0) > 0).length;
      if (daysTrained < 2 && MAIN_MUSCLES.has(m.id)) {
        const label = m.name;
        const msg = daysTrained === 0 ? `${label} not trained this split.` : `${label} trained only ${daysTrained} day this split.`;
        frequencyWarnings.push(msg);
        if (daysTrained === 0) score -= 10;
        else score -= 5;
      }
    });

    const fatiguePenalty = Math.min(fatigueCount * 5, 25);
    score = Math.max(0, score - fatiguePenalty);

    return { weeklyVolume, warnings, frequencyWarnings, splitScore: score };
  };

  const { weeklyVolume: splitWeeklyVolume, warnings: splitWarnings, frequencyWarnings, splitScore } = computeSplitMetricsAndFatigue();
  // ==========================================
  // END ADVANCED SPLIT METRICS CALCULATION
  // ==========================================

  // Initialize Data & Day-change Over Rollover Reset Logic
  useEffect(() => {
    const initStorageData = async () => {
      try {
        const todayStr = new Date().toDateString();

        const savedSplitLibrary = await AsyncStorage.getItem(SPLIT_LIBRARY_KEY);
        if (savedSplitLibrary) {
          const parsed = JSON.parse(savedSplitLibrary);
          const profiles = Array.isArray(parsed?.splits)
            ? parsed.splits
            : parsed?.days
            ? [{
                id: parsed.id || `split-${Date.now()}`,
                name: parsed.name || "My Training Split",
                startDate: parsed.startDate || new Date().toDateString(),
                days: parsed.days,
              }]
            : [];

          const newActiveId = parsed?.activeSplitId ?? null;
          setSplitProfiles(profiles);
          setActiveSplitId(newActiveId);
          setActiveSplit(profiles.find((split) => split.id === newActiveId) || null);
        } else {
          const savedSplit = await AsyncStorage.getItem(ACTIVE_SPLIT_KEY);
          if (savedSplit) {
            const parsed = JSON.parse(savedSplit);
            const profile = {
              id: parsed.id || `split-${Date.now()}`,
              name: parsed.name || "My Training Split",
              startDate: parsed.startDate || new Date().toDateString(),
              days: parsed.days || buildSplitDays(4),
            };
            setSplitProfiles([profile]);
            setActiveSplitId(profile.id);
            setActiveSplit(profile);
          }
        }

        const savedCompletionsJson = await AsyncStorage.getItem(COMPLETED_ROUTINES_TODAY_KEY);
        if (savedCompletionsJson) {
          const parsed = JSON.parse(savedCompletionsJson);
          if (parsed.date === todayStr) {
            setCompletedRoutineIds(parsed.completedIds || parsed.ids || []);
            setPartialRoutineIds(parsed.partialIds || []);
          } else {
            await AsyncStorage.removeItem(COMPLETED_ROUTINES_TODAY_KEY);
            await AsyncStorage.removeItem(MULTI_ACTIVE_WORKOUTS_KEY);
            setCompletedRoutineIds([]);
            setPartialRoutineIds([]);
            setAllActiveStates({});
            return;
          }
        }

        const savedMultiStates = await AsyncStorage.getItem(MULTI_ACTIVE_WORKOUTS_KEY);
        if (savedMultiStates) {
          const parsedMulti = JSON.parse(savedMultiStates);
          if (parsedMulti._date && parsedMulti._date !== todayStr) {
            await AsyncStorage.removeItem(MULTI_ACTIVE_WORKOUTS_KEY);
            setAllActiveStates({});
          } else {
            const { _date, ...states } = parsedMulti;
            const restoredStates = reconcileSavedActiveStates(states || {});
            setAllActiveStates(restoredStates);

            const pendingActiveWorkout = Object.values(restoredStates).find(
              (state) => state && !state.isPaused && state.phase !== "finished"
            );

            if (pendingActiveWorkout) {
              const restoredState = pendingActiveWorkout;
              setSelectedRoutine(restoredState.selectedRoutine);
              setActiveExerciseInstanceId(restoredState.activeExerciseInstanceId);
              setCompletedInstanceIds(restoredState.completedInstanceIds || []);
              setSetIndex(restoredState.setIndex ?? 0);
              setDropIndex(restoredState.dropIndex ?? 0);
              setPhase(restoredState.phase ?? "waiting");
              setSeconds(restoredState.seconds ?? 0);
              setRestSeconds(restoredState.restSeconds ?? 0);
              setRestTargetExerciseInstanceId(restoredState.restTargetExerciseInstanceId ?? null);
              setTotalDuration(restoredState.totalDuration ?? 0);
              setSetLog(restoredState.setLog || []);
              setCompletedWholeRoutine(restoredState.completedWholeRoutine || false);
              setIsPaused(restoredState.isPaused || false);
              setMode("active");
            }
          }
        }

      } catch (e) {
        console.error("Storage Initialization Error", e);
      }
    };
    initStorageData();
  }, [isLoading]);

  const persistStreakState = useCallback(async (next: StreakState) => {
    setStreakState(next);
    try {
      await AsyncStorage.setItem(STREAK_STATE_KEY, JSON.stringify(next));
    } catch (e) {
      console.error("Failed to persist streak state", e);
    }
  }, []);

  useEffect(() => {
    const loadStreak = async () => {
      try {
        const saved = await AsyncStorage.getItem(STREAK_STATE_KEY);
        const parsed = saved ? { ...emptyStreakState, ...JSON.parse(saved) } : emptyStreakState;
        const resolved = resolveStreak(parsed);
        setStreakState(resolved);
        if (JSON.stringify(resolved) !== JSON.stringify(parsed)) {
          await AsyncStorage.setItem(STREAK_STATE_KEY, JSON.stringify(resolved));
        }
      } catch (e) {
        console.error("Failed to load streak state", e);
      }
    };
    loadStreak();
  }, []);

  // A day counts once every routine the split scheduled is done — a scheduled
  // rest day counts as following the split too.
  const followedSplitToday =
    !!activeSplit &&
    (todaysRoutineIds.length === 0 ||
      todaysRoutineIds.every((routineId) => completedRoutineIds.includes(routineId)));

  useEffect(() => {
    if (!followedSplitToday || streakState.deloadActive) return;
    const credited = creditStreakDay(streakState);
    if (credited === streakState) return;
    persistStreakState(credited);
    enqueueCelebration("streak", `Day ${credited.streak} — today's split is done.`);
  }, [followedSplitToday, streakState, persistStreakState, enqueueCelebration]);

  const toggleDeload = () =>
    persistStreakState(streakState.deloadActive ? endDeload(streakState) : startDeload(streakState));

  const buildCurrentWorkoutStateEntry = () => ({
    selectedRoutine,
    activeExerciseInstanceId,
    completedInstanceIds,
    setIndex,
    dropIndex,
    phase,
    seconds,
    restSeconds,
    restTargetExerciseInstanceId,
    totalDuration,
    setLog,
    completedWholeRoutine,
    isPaused,
    lastSavedAt: Date.now(),
  });

  const saveCurrentWorkoutState = async (override = {}) => {
    if (!selectedRoutine?.id || phase === "finished") return;
    const todayStr = new Date().toDateString();
    const stateEntry = {
      ...buildCurrentWorkoutStateEntry(),
      ...override,
    };

    try {
      setAllActiveStates((prevStates) => {
        const updatedStates = {
          ...prevStates,
          [selectedRoutine.id]: stateEntry,
        };
        AsyncStorage.setItem(
          MULTI_ACTIVE_WORKOUTS_KEY,
          JSON.stringify({ _date: todayStr, ...updatedStates })
        ).catch((e) => console.error("Failed to sync multi workout states", e));
        return updatedStates;
      });
    } catch (e) {
      console.error("Failed to sync multi workout states", e);
    }
  };

  // Sync state modifications to multi-routine persistent dictionary
  useEffect(() => {
    if (mode === "active" && selectedRoutine?.id && phase !== "finished") {
      saveCurrentWorkoutState();
    }
  }, [mode, phase, activeExerciseInstanceId, completedInstanceIds, setIndex, dropIndex, seconds, restSeconds, restTargetExerciseInstanceId, totalDuration, setLog, selectedRoutine, completedWholeRoutine, isPaused]);

  useEffect(() => {
    const subscription = AppState.addEventListener("change", (nextState: AppStateStatus) => {
      if (nextState !== "active" && mode === "active" && selectedRoutine?.id && phase !== "finished") {
        saveCurrentWorkoutState();
      }

      if (nextState === "active") {
        const reconciledStates = reconcileSavedActiveStates(allActiveStates);
        setAllActiveStates(reconciledStates);

        if (selectedRoutine?.id && reconciledStates[selectedRoutine.id]) {
          const restoredState = reconcileElapsedTimeForSavedState(reconciledStates[selectedRoutine.id]);
          setSelectedRoutine(restoredState.selectedRoutine);
          setActiveExerciseInstanceId(restoredState.activeExerciseInstanceId);
          setCompletedInstanceIds(restoredState.completedInstanceIds || []);
          setSetIndex(restoredState.setIndex ?? 0);
          setDropIndex(restoredState.dropIndex ?? 0);
          setPhase(restoredState.phase ?? "waiting");
          setSeconds(restoredState.seconds ?? 0);
          setRestSeconds(restoredState.restSeconds ?? 0);
          setRestTargetExerciseInstanceId(restoredState.restTargetExerciseInstanceId ?? null);
          setTotalDuration(restoredState.totalDuration ?? 0);
          setSetLog(restoredState.setLog || []);
          setCompletedWholeRoutine(restoredState.completedWholeRoutine || false);
          setIsPaused(restoredState.isPaused || false);
        }
      }
    });
    return () => subscription.remove();
  }, [mode, phase, selectedRoutine, activeExerciseInstanceId, completedInstanceIds, setIndex, dropIndex, seconds, restSeconds, restTargetExerciseInstanceId, totalDuration, setLog, completedWholeRoutine, allActiveStates]);

  useEffect(() => {
    const hasPausedStates = Object.values(allActiveStates).some(
      (state) => state && state.isPaused && state.phase !== "finished"
    );
    if (!hasPausedStates) {
      return undefined;
    }

    const interval = setInterval(() => setPauseCardTick((value) => value + 1), 1000);
    return () => clearInterval(interval);
  }, [allActiveStates]);

  const removeActiveRoutineState = async (routineId) => {
    if (!routineId) return;
    const todayStr = new Date().toDateString();
    const copy = { ...allActiveStates };
    delete copy[routineId];
    setAllActiveStates(copy);
    try {
      await AsyncStorage.setItem(MULTI_ACTIVE_WORKOUTS_KEY, JSON.stringify({ _date: todayStr, ...copy }));
    } catch (e) {
      console.error("Failed to clean archived workout", e);
    }
  };

  const saveWorkoutToHistory = async (isPartial = false, setsOverride = null) => {
    const setsToSave = setsOverride || setLog;
    if (!setsToSave || setsToSave.length === 0) return;
    try {
      const historySaved = await AsyncStorage.getItem(WORKOUT_HISTORY_KEY);
      const currentHistory = historySaved ? JSON.parse(historySaved) : [];
      
      const newSession = {
        id: Date.now().toString(),
        date: new Date().toLocaleDateString(),
        routineId: selectedRoutine?.id || null,
        routineName: selectedRoutine?.name || "Custom Workout",
        duration: totalDuration,
        sets: setsToSave,
        status: isPartial ? "partial" : "completed",
      };
      
      const nextHistory = [newSession, ...currentHistory];
      await AsyncStorage.setItem(WORKOUT_HISTORY_KEY, JSON.stringify(nextHistory));
      setWorkoutHistory(nextHistory);
      setCurrentSessionId(newSession.id);
      return newSession;
    } catch (e) {
      console.error("Failed to save workout to history", e);
      return null;
    }
  };

  // Timers
  useEffect(() => {
    let interval;
    if (phase === "inSet" && !isPaused) {
      interval = setInterval(() => setSeconds((s) => s + 1), 1000);
    }
    return () => clearInterval(interval);
  }, [phase, isPaused]);

  useEffect(() => {
    let interval;
    if (phase === "resting" && restSeconds > 0) {
      interval = setInterval(() => setRestSeconds((s) => s - 1), 1000);
    }
    return () => clearInterval(interval);
  }, [phase, restSeconds]);

  useEffect(() => {
    let interval;
    if (mode === "active" && phase !== "finished" && !isPaused) {
      interval = setInterval(() => setTotalDuration((s) => s + 1), 1000);
    }
    return () => clearInterval(interval);
  }, [mode, phase, isPaused]);

  const [pauseCardTick, setPauseCardTick] = useState(0);

  const formatTime = (s) => {
    const m = Math.floor(s / 60);
    const sec = s % 60;
    return `${m}:${sec.toString().padStart(2, "0")}`;
  };

  const cleanExerciseNameForSignature = (rawName) => {
    if (!rawName) return "";
    return rawName
      .trim()
      .toLowerCase()
      .replace(/^(weighted[_\s-]+)/, "")
      .replace(/^([\w]+[_\s-]+weighted[_\s-]+)/, "")
      .replace(/\bassisted\b[_\s-]*/gi, "")
      .replace(/\s*[-–]\s*[\d.]+\s*(?:kg|lbs|lb)?\s*$/i, "")
      .replace(/\s*\(Drop\s*\d+\)\s*$/i, "")
      .replace(/\s*\(.*?\)\s*$/g, "")
      .replace(/(?:^|[\s-])\d+$/, "")
      .replace(/[()]/g, "")
      .replace(/[-\s]+/g, " ")
      .trim();
  };

  const findExerciseLibraryMatch = (rawName) => {
    const cleanedName = cleanExerciseNameForSignature(rawName);
    if (!cleanedName) return null;

    return exerciseLibrary.find((entry) => {
      const candidateName = cleanExerciseNameForSignature(entry.name || entry.id || "");
      return candidateName === cleanedName;
    }) || null;
  };

  const resolveRootExerciseId = (logName) => {
    const match = findExerciseLibraryMatch(logName);
    if (!match) return null;

    let root = match;
    while (root && root.subSkillOf) {
      const parent = exerciseLibrary.find((entry) => entry.id === root.subSkillOf);
      if (!parent) break;
      root = parent;
    }

    return root?.id || match.id;
  };

 const normalizeExerciseKey = (rawName) => {
    if (!rawName) return "";
    const cleaned = cleanExerciseNameForSignature(rawName);
    const rootId = resolveRootExerciseId(cleaned);
    return rootId || cleaned;
  };

  // Progression-specific key: Tuck Planche and Straddle Planche stay separate so
  // smart logging and PRs never bleed between progressions of the same skill.
  const normalizeProgressionKey = (rawName) => {
    if (!rawName) return "";
    const cleaned = cleanExerciseNameForSignature(rawName);
    const match = findExerciseLibraryMatch(cleaned);
    return match?.id || cleaned;
  };

  // Helper: Find the last logged performance for an exercise.
  // setLog and session.sets are newest-first, so the first match wins.
  const getLastLoggedPerformance = useCallback(
    (targetExerciseName: string) => {
      if (!targetExerciseName) return null;
      const targetKey = normalizeProgressionKey(targetExerciseName);

      // 1. Check current workout session setLog first
      for (let i = 0; i < setLog.length; i++) {
        const loggedSet = setLog[i];
        if (normalizeProgressionKey(loggedSet.exercise) === targetKey) {
          return {
            load: loggedSet.load ? String(loggedSet.load) : "",
            reps: loggedSet.reps ? String(loggedSet.reps) : "",
            rir: loggedSet.rir !== undefined && loggedSet.rir !== null ? String(loggedSet.rir) : "",
            rpe: loggedSet.rpe !== undefined && loggedSet.rpe !== null ? String(loggedSet.rpe) : "",
          };
        }
      }

      // 2. Search workout history (newest session to oldest)
      if (workoutHistory && workoutHistory.length > 0) {
        for (const session of workoutHistory) {
          if (!session.sets || !Array.isArray(session.sets)) continue;

          for (let i = 0; i < session.sets.length; i++) {
            const pastSet = session.sets[i];
            if (normalizeProgressionKey(pastSet.exercise) === targetKey) {
              return {
                load: pastSet.load ? String(pastSet.load) : "",
                reps: pastSet.reps ? String(pastSet.reps) : "",
                rir: pastSet.rir !== undefined && pastSet.rir !== null ? String(pastSet.rir) : "",
                rpe: pastSet.rpe !== undefined && pastSet.rpe !== null ? String(pastSet.rpe) : "",
              };
            }
          }
        }
      }

      return null;
    },
    [setLog, workoutHistory]
  );

  // This must stay below getLastLoggedPerformance: hooks evaluate their dependency
  // arrays immediately, so placing it above the callback crashes HomeScreen.
  //
  // Auto-fill is keyed to the exact exercise (progression included). Switching to
  // a different exercise always refills from that exercise's own last performance
  // and clears the inputs when it has never been logged, so numbers never bleed
  // between exercises.
  const prefillSignatureRef = useRef<string | null>(null);

  useEffect(() => {
    if (mode !== "active" || !currentExercise) {
      prefillSignatureRef.current = null;
      return;
    }

    const exerciseToMatch = selectedSubSkill ? formatExerciseName(selectedSubSkill.id) : exerciseName;
    const signature = `${activeExerciseInstanceId}|${exerciseToMatch}|${setIndex}|${dropIndex}`;
    if (prefillSignatureRef.current === signature) return;
    prefillSignatureRef.current = signature;

    const lastPerf = getLastLoggedPerformance(exerciseToMatch);

    setLoad(lastPerf?.load || "");
    setReps(lastPerf?.reps || "");
    setRir(lastPerf?.rir || "");
    setRpe(lastPerf?.rpe || "");
  }, [
    activeExerciseInstanceId,
    exerciseName,
    setIndex,
    dropIndex,
    selectedSubSkill,
    mode,
    currentExercise,
    getLastLoggedPerformance,
  ]);

  const loadRecovery = useCallback(async () => {
    try {
      const savedHistory = await AsyncStorage.getItem(WORKOUT_HISTORY_KEY);
      const history = savedHistory ? JSON.parse(savedHistory) : [];
      setRecoveryItems(calculateRecovery(history).items);
    } catch (error) {
      console.error("Failed to load workout recovery", error);
    }
  }, []);

  useEffect(() => {
    loadRecovery();
    const subscription = AppState.addEventListener("change", (nextState: AppStateStatus) => {
      if (nextState === "active") loadRecovery();
    });
    return () => subscription.remove();
  }, [loadRecovery]);

  const getRoutineReadiness = (routine: Routine) => {
    const targetedMuscleIds = Array.from(new Set(
      (routine.exercises || []).flatMap((routineExercise) =>
        exerciseLibrary.find((exercise) => exercise.id === routineExercise.exerciseId)?.muscles?.map((muscle) => muscle.muscleId) || []
      )
    ));
    const targetedRecovery = recoveryItems.filter((item) => targetedMuscleIds.includes(item.muscleId));
    const percent = targetedRecovery.length
      ? Math.round(targetedRecovery.reduce((total, item) => total + (100 - item.fatigueScore), 0) / targetedRecovery.length)
      : 100;
    const label = percent > 75 ? "Ready" : percent > 50 ? "Light fatigue" : percent > 25 ? "Moderate fatigue" : "High fatigue";
    const muscles = targetedRecovery
      .map((item) => {
        const name = muscleGroups.find((muscle) => muscle.id === item.muscleId)?.name || item.muscleId;
        return `${name} ${100 - item.fatigueScore}%`;
      })
      .join(" · ");
    return { percent, label, muscles };
  };

  const recommendedRoutineId = recoveryItems.length
    ? [...allRoutines].sort((a, b) => getRoutineReadiness(b).percent - getRoutineReadiness(a).percent)[0]?.id
    : null;

  const getWorkoutSignature = (sets) => {
    return (sets || [])
      .map((item) => normalizeExerciseKey(item.exercise || ""))
      .filter(Boolean)
      .join("||");
  };

  const computeWorkoutSummaryMetrics = (sets) => {
    let totalVolume = 0;
    let totalReps = 0;
    let totalHoldSeconds = 0;
    let maxHoldSeconds = 0;
    let maxLoad = 0;

    (sets || []).forEach((item) => {
      const loadValue = parseFloat(item.load) || 0;
      const repsValue = parseInt(item.reps, 10) || 0;
      const isHoldSet = !!item.isHold;

      if (isHoldSet) {
        totalHoldSeconds += repsValue;
        if (repsValue > maxHoldSeconds) {
          maxHoldSeconds = repsValue;
        }
      } else {
        totalReps += repsValue;
        totalVolume += loadValue * repsValue;
      }

      if (loadValue > maxLoad) {
        maxLoad = loadValue;
      }
    });

    return {
      totalVolume,
      totalReps,
      totalHoldSeconds,
      maxHoldSeconds,
      maxLoad,
    };
  };

  useEffect(() => {
    const loadHistory = async () => {
      try {
        const historySaved = await AsyncStorage.getItem(WORKOUT_HISTORY_KEY);
        const parsedHistory = historySaved ? JSON.parse(historySaved) : [];
        setWorkoutHistory(parsedHistory);
        setPreviousWorkoutComparison(computePreviousSameRoutineComparison(parsedHistory, setLog));
      } catch (e) {
        console.error("Failed to load workout history for comparison", e);
      }
    };

    loadHistory();
  }, []);

  useEffect(() => {
    setPreviousWorkoutComparison(computePreviousSameRoutineComparison(workoutHistory, setLog, currentSessionId));
  }, [workoutHistory, setLog, currentSessionId]);

  const normalizeRoutineName = (name) => normalizeExerciseKey(name || "");

  const EPSILON = 0.0001;

  /**
   * PR categories follow the exercise-library classification:
   * static skills are scored on hold time, everything else on load and reps.
   */
  const computePrReplacementForSet = (exerciseName, loadValue, repsValue, isHoldSet, currentSetLog = []) => {
    const matchKey = normalizeProgressionKey(exerciseName);
    const normalizedLoad = parseFloat(loadValue) || 0;
    const normalizedReps = parseInt(repsValue, 10) || 0;
    if (!matchKey || normalizedReps <= 0) return null;

    const libraryMatch = exerciseLibrary.find((exercise) => exercise.id === matchKey) || null;
    const isStaticHold = !!isHoldSet || isHoldExercise(libraryMatch);
    const displayName = libraryMatch?.name || exerciseName;

    // Every previously logged set of this exact progression, history + this session.
    const previousSets = [
      ...(currentSetLog || []),
      ...(workoutHistory || []).flatMap((session) => session.sets || []),
    ].filter((set) => normalizeProgressionKey(set.exercise) === matchKey);

    if (previousSets.length === 0) return null;

    const loadOf = (set) => parseFloat(set.load) || 0;
    const repsOf = (set) => parseInt(set.reps, 10) || 0;
    const bestOf = (sets, valueOf) => sets.reduce((best, set) => Math.max(best, valueOf(set)), 0);

    const records: string[] = [];

    if (isStaticHold) {
      const sameLoad = previousSets.filter((set) => Math.abs(loadOf(set) - normalizedLoad) < EPSILON);
      const sameHold = previousSets.filter((set) => repsOf(set) === normalizedReps);

      const bestHold = bestOf(previousSets, repsOf);
      const bestHoldAtWeight = bestOf(sameLoad, repsOf);
      const bestWeightAtHold = bestOf(sameHold, loadOf);

      if (bestHold > 0 && normalizedReps > bestHold) {
        records.push(`Max hold time: ${normalizedReps}s (was ${bestHold}s)`);
      }
      if (normalizedLoad > 0 && bestHoldAtWeight > 0 && normalizedReps > bestHoldAtWeight) {
        records.push(`Max hold time at ${normalizedLoad} kg: ${normalizedReps}s (was ${bestHoldAtWeight}s)`);
      }
      if (normalizedLoad > 0 && bestWeightAtHold > 0 && normalizedLoad > bestWeightAtHold) {
        records.push(`Max weight at ${normalizedReps}s hold: ${normalizedLoad} kg (was ${bestWeightAtHold} kg)`);
      }
    } else {
      if (normalizedLoad <= 0) return null;

      const sameReps = previousSets.filter((set) => repsOf(set) === normalizedReps);
      const sameLoad = previousSets.filter((set) => Math.abs(loadOf(set) - normalizedLoad) < EPSILON);

      const bestWeight = bestOf(previousSets, loadOf);
      const bestWeightAtReps = bestOf(sameReps, loadOf);
      const bestRepsAtWeight = bestOf(sameLoad, repsOf);

      if (bestWeight > 0 && normalizedLoad > bestWeight) {
        records.push(`Max weight: ${normalizedLoad} kg (was ${bestWeight} kg)`);
      }
      if (bestWeightAtReps > 0 && normalizedLoad > bestWeightAtReps) {
        records.push(`Max weight at ${normalizedReps} reps: ${normalizedLoad} kg (was ${bestWeightAtReps} kg)`);
      }
      if (bestRepsAtWeight > 0 && normalizedReps > bestRepsAtWeight) {
        records.push(`Max reps at ${normalizedLoad} kg: ${normalizedReps} reps (was ${bestRepsAtWeight} reps)`);
      }
    }

    if (records.length === 0) return null;

    return {
      title: records.length > 1 ? "New Personal Records" : "New Personal Record",
      body: `${displayName}\n${records.join("\n")}`,
    };
  };

  const computePreviousSameRoutineComparison = (history, currentSetLog, currentSessionId) => {
    if (!currentSetLog?.length || !history.length) return null;
    const currentRoutineId = selectedRoutine?.id || null;
    const currentRoutineName = normalizeRoutineName(selectedRoutine?.name || "");
    const currentSignature = getWorkoutSignature(currentSetLog);
    if (!currentSignature) return null;

    const sameRoutineExactMatches = history
      .filter((session) => {
        const sessionRoutineName = normalizeRoutineName(session.routineName || "");
        const sameRoutine =
          (currentRoutineId && session.routineId === currentRoutineId) ||
          (currentRoutineName && sessionRoutineName === currentRoutineName);

        return (
          session.status !== "partial" &&
          session.sets &&
          session.id !== currentSessionId &&
          sameRoutine &&
          getWorkoutSignature(session.sets) === currentSignature
        );
      })
      .sort((a, b) => {
        const aTime = Number(a.id) || new Date(a.date).getTime();
        const bTime = Number(b.id) || new Date(b.date).getTime();
        return aTime - bTime;
      });

    const sameRoutineAnyMatches = history
      .filter((session) => {
        const sessionRoutineName = normalizeRoutineName(session.routineName || "");
        const sameRoutine =
          (currentRoutineId && session.routineId === currentRoutineId) ||
          (currentRoutineName && sessionRoutineName === currentRoutineName);

        return (
          session.status !== "partial" &&
          session.sets &&
          session.id !== currentSessionId &&
          sameRoutine
        );
      })
      .sort((a, b) => {
        const aTime = Number(a.id) || new Date(a.date).getTime();
        const bTime = Number(b.id) || new Date(b.date).getTime();
        return aTime - bTime;
      });

    const fallbackSessions = history
      .filter((session) =>
        session.status !== "partial" &&
        session.sets &&
        session.id !== currentSessionId &&
        getWorkoutSignature(session.sets) === currentSignature
      )
      .sort((a, b) => {
        const aTime = Number(a.id) || new Date(a.date).getTime();
        const bTime = Number(b.id) || new Date(b.date).getTime();
        return aTime - bTime;
      });

    const matchingSessions = sameRoutineExactMatches.length
      ? sameRoutineExactMatches
      : sameRoutineAnyMatches.length
      ? sameRoutineAnyMatches
      : fallbackSessions;
    if (!matchingSessions.length) return null;

    const priorSession = matchingSessions[matchingSessions.length - 1];
    const priorMetrics = computeWorkoutSummaryMetrics(priorSession.sets || []);
    const currentMetrics = computeWorkoutSummaryMetrics(currentSetLog);

    return {
      priorDate: priorSession.date,
      deltaVolume: currentMetrics.totalVolume - priorMetrics.totalVolume,
      deltaReps: currentMetrics.totalReps - priorMetrics.totalReps,
      deltaHoldSeconds: currentMetrics.totalHoldSeconds - priorMetrics.totalHoldSeconds,
      deltaMaxHoldSeconds: currentMetrics.maxHoldSeconds - priorMetrics.maxHoldSeconds,
      deltaMaxLoad: currentMetrics.maxLoad - priorMetrics.maxLoad,
    };
  };

  const formatDeltaValue = (value, suffix) => {
    if (value === 0) return `0${suffix}`;
    return `${value > 0 ? "+" : ""}${value}${suffix}`;
  };

  const getLivePausedDuration = (state) => {
    if (!state) return 0;
    const base = state.totalDuration || 0;
    if (!state.lastSavedAt) return base;
    const now = Date.now();
    const elapsed = Math.max(0, Math.floor((now - state.lastSavedAt) / 1000));
    if (state.isPaused && state.phase !== "resting") {
      return base;
    }
    if (state.isPaused && state.phase === "resting") {
      const remainingRest = state.restSeconds || 0;
      return base + Math.min(elapsed, remainingRest);
    }
    return base + elapsed;
  };

  const reconcileElapsedTimeForSavedState = (state) => {
    if (!state || !state.lastSavedAt || state.phase === "finished") return state;
    const now = Date.now();
    if (state.isPaused && state.phase !== "resting") return { ...state, lastSavedAt: now };

    const elapsedSecs = Math.floor((now - state.lastSavedAt) / 1000);
    if (elapsedSecs <= 0) return { ...state, lastSavedAt: now };

    const adjustedState = { ...state, lastSavedAt: now };

    if (state.phase === "inSet") {
      adjustedState.totalDuration = (state.totalDuration || 0) + elapsedSecs;
      adjustedState.seconds = (state.seconds || 0) + elapsedSecs;
    } else if (state.phase === "resting") {
      const restRemaining = state.restSeconds || 0;
      const elapsedDuringRest = Math.min(elapsedSecs, restRemaining);
      adjustedState.totalDuration = (state.totalDuration || 0) + (state.isPaused ? elapsedDuringRest : elapsedSecs);

      const remaining = restRemaining - elapsedSecs;
      if (remaining <= 0) {
        adjustedState.restSeconds = 0;
        adjustedState.phase = "waiting";
        if (state.restTargetExerciseInstanceId) {
          adjustedState.activeExerciseInstanceId = state.restTargetExerciseInstanceId;
          adjustedState.setIndex = 0;
          adjustedState.dropIndex = 0;
          adjustedState.restTargetExerciseInstanceId = null;
        }
      } else {
        adjustedState.restSeconds = remaining;
      }
    } else {
      adjustedState.totalDuration = (state.totalDuration || 0) + elapsedSecs;
    }

    return adjustedState;
  };

  const reconcileSavedActiveStates = (states) => {
    if (!states) return states;
    return Object.fromEntries(
      Object.entries(states).map(([id, state]) => [id, reconcileElapsedTimeForSavedState(state)])
    );
  };

  const restoreCurrentWorkoutFromSavedState = () => {
    if (!selectedRoutine?.id || phase === "finished") return;
    const savedState = allActiveStates[selectedRoutine.id];
    if (!savedState) return;

    const restored = reconcileElapsedTimeForSavedState(savedState);
    if (!restored) return;

    setSelectedRoutine(restored.selectedRoutine);
    setActiveExerciseInstanceId(restored.activeExerciseInstanceId);
    setCompletedInstanceIds(restored.completedInstanceIds || []);
    setSetIndex(restored.setIndex ?? 0);
    setDropIndex(restored.dropIndex ?? 0);
    setPhase(restored.phase ?? "waiting");
    setSeconds(restored.seconds ?? 0);
    setRestSeconds(restored.restSeconds ?? 0);
    setRestTargetExerciseInstanceId(restored.restTargetExerciseInstanceId ?? null);
    setTotalDuration(restored.totalDuration ?? 0);
    setSetLog(restored.setLog || []);
    setCompletedWholeRoutine(restored.completedWholeRoutine || false);
  };

  // Launcher actions
  const launchRoutineExecution = (routine) => {
    if (!routine) return;

    if (allActiveStates[routine.id]) {
      resumeSpecificWorkout(routine.id);
    } else {
      setupRoutine(routine, true);
    }
  };

  const setupRoutine = (routine, isNewSession = false) => {
    const formattedExercises = (routine.exercises || []).map((ex, idx) => ({
      ...ex,
      instanceId: `${ex.exerciseId}-${idx}-${Date.now()}`
    }));

    const initializedRoutine = { ...routine, exercises: formattedExercises };

    setSelectedRoutine(initializedRoutine);
    setCompletedInstanceIds([]);
    setIsPaused(false);
    
    if (formattedExercises.length > 0) {
      setActiveExerciseInstanceId(formattedExercises[0].instanceId);
    } else {
      setActiveExerciseInstanceId(null);
    }

    setSetIndex(0);
    setDropIndex(0);
    setPhase("waiting");
    setMode("active");
    if (isNewSession) {
      setSetLog([]);
      setSeconds(0);       
      setRestSeconds(0);   
      setTotalDuration(0); 
      setCompletedWholeRoutine(false);
    }
  };

  const resumeSpecificWorkout = (routineId) => {
    const targetState = allActiveStates[routineId];
    if (targetState) {
      const restoredState = reconcileElapsedTimeForSavedState(targetState);
      setSelectedRoutine(restoredState.selectedRoutine);
      setActiveExerciseInstanceId(restoredState.activeExerciseInstanceId);
      setCompletedInstanceIds(restoredState.completedInstanceIds || []);
      setSetIndex(restoredState.setIndex ?? 0);
      setDropIndex(restoredState.dropIndex ?? 0);
      setPhase(restoredState.phase ?? "waiting");
      setSeconds(restoredState.seconds ?? 0);
      setRestSeconds(restoredState.restSeconds ?? 0);
      setRestTargetExerciseInstanceId(restoredState.restTargetExerciseInstanceId ?? null);
      setTotalDuration(restoredState.totalDuration ?? 0);
      setSetLog(restoredState.setLog || []);
      setCompletedWholeRoutine(restoredState.completedWholeRoutine || false);
      setIsPaused(false);
      setMode("active");
    }
  };

  const openQuickSavePartialConfirmation = (routineId) => {
    const savedState = allActiveStates[routineId];
    if (!savedState || !savedState.setLog || savedState.setLog.length === 0) {
      removeActiveRoutineState(routineId);
      return;
    }
    setTargetPartialRoutineId(routineId);
    setIsPartialAlertVisible(true);
  };

  const processQuickSavePartial = async () => {
    const routineId = targetPartialRoutineId;
    setIsPartialAlertVisible(false);
    setTargetPartialRoutineId(null);
    if (!routineId) return;

    const stateData = allActiveStates[routineId];
    if (!stateData) return;

    try {
      if (stateData.setLog && stateData.setLog.length > 0) {
        const historySaved = await AsyncStorage.getItem(WORKOUT_HISTORY_KEY);
        const currentHistory = historySaved ? JSON.parse(historySaved) : [];
        const newSession = {
          id: Date.now().toString(),
          date: new Date().toLocaleDateString(),
          routineName: stateData.selectedRoutine?.name || "Custom Workout",
          duration: stateData.totalDuration || 0,
          sets: stateData.setLog,
          status: "partial",
        };
        await AsyncStorage.setItem(WORKOUT_HISTORY_KEY, JSON.stringify([newSession, ...currentHistory]));
      }

      const isDaySplitTarget = todaysRoutineIds.includes(routineId);
      if (isDaySplitTarget) {
        const nextPartialIds = [...partialRoutineIds, routineId];
        setPartialRoutineIds(nextPartialIds);
        await AsyncStorage.setItem(COMPLETED_ROUTINES_TODAY_KEY, JSON.stringify({
          date: new Date().toDateString(),
          completedIds: completedRoutineIds,
          partialIds: nextPartialIds
        }));
      }
    } catch (e) {
      console.error(e);
    } finally {
      await removeActiveRoutineState(routineId);
    }
  };

  const pauseWorkoutToDashboard = async () => {
    const pauseOverride = {
      isPaused: true,
      seconds: 0,
    };
    if (phase !== "resting") {
      pauseOverride.phase = "waiting";
    }
    await saveCurrentWorkoutState(pauseOverride);
    setIsPaused(true);
    setSeconds(0);
    if (phase !== "resting") {
      setPhase("waiting");
    }
    setMode("idle");
  };

  const startSet = () => {
    setSeconds(0);
    setPhase("inSet");
  };

  const finishSet = () => {
    setPhase("logging");
  };

  const submitLog = async () => {
    if (hasSubskills && !selectedSubSkill) {
      setIsSubSkillModalVisible(true);
      return;
    }

    const dropSuffix = dropIndex > 0 ? ` (Drop ${dropIndex})` : "";
    const exerciseToLog = `${hasSubskills && selectedSubSkill ? formatExerciseName(selectedSubSkill.id) : exerciseName}${dropSuffix}`;
    const nextLoggedSets = [
      {
        exercise: exerciseToLog,
        set: setIndex + 1,
        load,
        reps,
        rir: isHold ? null : rir,
        rpe,
        time: seconds,
        dropIndex,
        isDropset: dropIndex > 0,
        isSuperset: inSuperset,
        isHold: isHold,
      },
      ...setLog,
    ];

    setSetLog(nextLoggedSets);
    setSelectedSubSkill(null);
    setLoad("");
    setReps("");
    setRir("");
    setRpe("");

    const prResult = computePrReplacementForSet(exerciseToLog, load, reps, isHold, setLog);
    if (prResult) {
      enqueueCelebration("prReplacement", prResult.body);
    }

    // More drop sets on the same exercise before moving on
    if (dropIndex < totalDrops) {
      setDropIndex((d) => d + 1);
      setPhase("waiting");
      return;
    }

    setDropIndex(0);

    // Superset: after finishing this exercise's set (incl. drops), go to partner with no rest
    if (isPrimary && supersetPartner) {
      setActiveExerciseInstanceId(supersetPartner.instanceId);
      setPhase("waiting");
      return;
    }

    const isLastSet = setIndex >= totalSets - 1;

    if (isLastSet) {
      let updatedCompletions = [...completedInstanceIds, currentExercise.instanceId];

      if (isPartner && exerciseIndex > 0) {
        const primary = exercises[exerciseIndex - 1];
        if (primary && !updatedCompletions.includes(primary.instanceId)) {
          updatedCompletions.push(primary.instanceId);
        }
      }

      updatedCompletions = [...new Set(updatedCompletions)];
      setCompletedInstanceIds(updatedCompletions);

      const uncompletedRemaining = exercises.filter((ex) => !updatedCompletions.includes(ex.instanceId));

      if (uncompletedRemaining.length === 0) {
        const routineId = selectedRoutine?.id;
        const isDaySplitTarget = todaysRoutineIds.includes(routineId) && !trimmedRoutineIds.includes(routineId);

        if (routineId && isDaySplitTarget) {
          const nextIds = [...completedRoutineIds, routineId];
          setCompletedRoutineIds(nextIds);
          await AsyncStorage.setItem(
            COMPLETED_ROUTINES_TODAY_KEY,
            JSON.stringify({
              date: new Date().toDateString(),
              completedIds: nextIds,
              partialIds: partialRoutineIds,
            })
          );
        }

        setCompletedWholeRoutine(true);
        setPhase("finished");
        const savedSession = await saveWorkoutToHistory(false, nextLoggedSets);
        if (savedSession) {
          enqueueCelebration(
            'workoutFinish',
            `Finished ${selectedRoutine?.name || 'your workout'} with ${nextLoggedSets.length} sets logged.`
          );
        }
        await removeActiveRoutineState(routineId);
      } else {
        setRestTargetExerciseInstanceId(uncompletedRemaining[0].instanceId);
        setPhase("resting");
        const exerciseType = selectedExerciseData?.type || currentExerciseData?.type || "compound";
        setRestSeconds(getRestSecondsForType(exerciseType, rpe, "exercise"));
      }
    } else {
      // End of a superset round — rest, then continue on the primary exercise
      if (isPartner && exerciseIndex > 0) {
        const primary = getSupersetPrimary(currentExercise, exerciseIndex, exercises);
        setActiveExerciseInstanceId(primary.instanceId);
      }
      setPhase("resting");
      const exerciseType = selectedExerciseData?.type || currentExerciseData?.type || "compound";
      setRestSeconds(getRestSecondsForType(exerciseType, rpe));
    }
  };

  const skipRest = () => setRestSeconds(0);
  const handleEndWorkoutEarly = () => {
    if (setLog.length === 0) {
      setMode("idle");
      removeActiveRoutineState(selectedRoutine?.id);
    } else {
      setIsAlertVisible(true);
    }
  };

  const confirmEndWorkoutPartial = async () => {
    setIsAlertVisible(false);
    setCompletedWholeRoutine(false); 
    setPhase("finished");

    const routineId = selectedRoutine?.id;
    const isDaySplitTarget = todaysRoutineIds.includes(routineId);

    if (routineId && isDaySplitTarget) {
      const nextPartialIds = [...partialRoutineIds, routineId];
      setPartialRoutineIds(nextPartialIds);
      await AsyncStorage.setItem(COMPLETED_ROUTINES_TODAY_KEY, JSON.stringify({
        date: new Date().toDateString(),
        completedIds: completedRoutineIds,
        partialIds: nextPartialIds
      }));
    }

    await saveWorkoutToHistory(true, setLog);
    await removeActiveRoutineState(routineId);
  };

  const nextStep = async () => {
    if (phase === "resting" && restTargetExerciseInstanceId) {
      setActiveExerciseInstanceId(restTargetExerciseInstanceId);
      setSetIndex(0);
      setDropIndex(0);
      setPhase("waiting");
      setRestTargetExerciseInstanceId(null);
      return;
    }

    const isLastSet = setIndex >= totalSets - 1;
    if (!isLastSet) {
      setSetIndex((s) => s + 1);
      setDropIndex(0);
      setPhase("waiting");
    }
  };

  // Jump exercise directly safely checking for strict phase locking rules
  const switchTargetActiveExerciseDirectly = (instanceId) => {
    if (completedInstanceIds.includes(instanceId) || phase === "finished") return;
    if (phase === "inSet" || phase === "logging") return;

    const targetIndex = exercises.findIndex((ex) => ex.instanceId === instanceId);
    
    // ALLOW switching if it's the Primary exercise (A) of a superset group, block if it's the Partner (B)
    if (targetIndex >= 0 && isInSuperset(exercises[targetIndex], targetIndex, exercises)) {
      const targetEx = exercises[targetIndex];
      if (!isSupersetPrimary(targetEx, targetIndex, exercises)) {
        return; 
      }
    }

    const currentHasLoggedSets = setLog.some((log) => log.exercise === exerciseName);
    if (currentHasLoggedSets) return;

    setActiveExerciseInstanceId(instanceId);
    setSetIndex(0);
    setDropIndex(0);
    setPhase("waiting");
  };

  const removeActiveExercise = (idx) => {
    if (!selectedRoutine || !selectedRoutine.exercises || selectedRoutine.exercises.length <= 1) return;
    if (idx < 0 || idx >= selectedRoutine.exercises.length) return;

    const currentExercises = selectedRoutine.exercises;
    const targetItem = currentExercises[idx];

    // Removing either side of a superset must break the relationship instead of
    // allowing the remaining exercise to accidentally pair with a new neighbor.
    const updatedExercises = currentExercises
      .filter((_, i) => i !== idx)
      .map((exercise, newIndex) => {
        // If the removed exercise was the partner, clear the previous primary's
        // superset flag. If the removed exercise was a primary, also clear the
        // flag on the new previous item so two unrelated exercises cannot become
        // a superset just because the array shifted.
        if (idx > 0 && newIndex === idx - 1) {
          return { ...exercise, supersetWithNext: false };
        }
        if (newIndex === idx && exercise.supersetWithNext) {
          return { ...exercise, supersetWithNext: false };
        }
        return exercise;
      });

    if (activeExerciseInstanceId === targetItem.instanceId) {
      const alternativeTarget = updatedExercises.find(ex => !completedInstanceIds.includes(ex.instanceId));
      if (alternativeTarget) {
        setActiveExerciseInstanceId(alternativeTarget.instanceId);
      } else if (updatedExercises.length > 0) {
        setActiveExerciseInstanceId(updatedExercises[0].instanceId);
      } else {
        setActiveExerciseInstanceId(null);
      }
      setSetIndex(0);
      setDropIndex(0);
      setRestTargetExerciseInstanceId(null);
      setPhase("waiting");
    }

    // Dropping exercises means the scheduled session was not actually completed,
    // so this routine can no longer credit the day's split.
    setTrimmedRoutineIds((ids) =>
      selectedRoutine.id && !ids.includes(selectedRoutine.id) ? [...ids, selectedRoutine.id] : ids
    );

    if (selectedRoutine.id && completedRoutineIds.includes(selectedRoutine.id)) {
      const nextIds = completedRoutineIds.filter((id) => id !== selectedRoutine.id);
      setCompletedRoutineIds(nextIds);
      AsyncStorage.setItem(
        COMPLETED_ROUTINES_TODAY_KEY,
        JSON.stringify({
          date: new Date().toDateString(),
          completedIds: nextIds,
          partialIds: partialRoutineIds,
        })
      );
    }

    setCompletedInstanceIds((ids) => ids.filter((id) => id !== targetItem.instanceId));
    setSelectedRoutine({
      ...selectedRoutine,
      exercises: updatedExercises,
    });
  };

  const getWorkoutInsertIndex = (exerciseIndexToUse = exerciseIndex) => {
    if (exerciseIndexToUse < 0) return 0;
    const sourceExercise = exercises[exerciseIndexToUse];

    // If the active exercise is the primary side of a superset, insert after
    // the complete A/B pair. Otherwise insert immediately after the active item.
    return sourceExercise && isSupersetPrimary(sourceExercise, exerciseIndexToUse, exercises)
      ? exerciseIndexToUse + 2
      : exerciseIndexToUse + 1;
  };

  const getWorkoutLinkTarget = () => {
    const insertIndex = getWorkoutInsertIndex();
    const candidate = exercises[insertIndex];
    if (!candidate) return null;

    // Never link a newly-added exercise to an exercise that already belongs to
    // another superset. That would create an invalid/crossing superset group.
    if (isInSuperset(candidate, insertIndex, exercises)) return null;
    return candidate;
  };

  const openWorkoutExercisePicker = (changeMode: "add" | "swap") => {
    if (!selectedRoutine || !currentExercise || phase !== "waiting") return;
    setWorkoutExerciseChangeMode(changeMode);
    setWorkoutExerciseSearch("");
    setWorkoutExerciseModality(null);
    setWorkoutExerciseMuscle(null);
    setWorkoutExerciseType(null);
    setWorkoutPickerStep("search");
    setPendingWorkoutExerciseId(null);
    setIsWorkoutExercisePickerVisible(true);
  };

  const configureWorkoutExerciseChange = (exerciseId: string) => {
    if (!selectedRoutine || !currentExercise) return;
    const source = exerciseLibrary.find((exercise) => exercise.id === exerciseId);
    if (!source) return;

    const swapInSuperset = workoutExerciseChangeMode === "swap" && isInSuperset(currentExercise, exerciseIndex, exercises);
    const linkTarget = workoutExerciseChangeMode === "add" ? getWorkoutLinkTarget() : null;
    const lockedSetCount = swapInSuperset
      ? currentExercise.targetSets || 3
      : linkTarget
      ? linkTarget.targetSets || 3
      : null;

    setPendingWorkoutExerciseId(exerciseId);
    setSessionTargetSets(String(lockedSetCount || (workoutExerciseChangeMode === "swap" ? currentExercise.targetSets || 3 : 3)));
    setSessionTargetReps(workoutExerciseChangeMode === "swap" ? currentExercise.targetReps || "8-12" : "8-12");
    setSessionTargetHold(String(workoutExerciseChangeMode === "swap" ? currentExercise.targetHoldSeconds || 30 : 30));
    setSessionSpecialType(workoutExerciseChangeMode === "swap" ? currentExercise.specialType || "normal" : "normal");
    setSessionDropsetsPerSet(String(workoutExerciseChangeMode === "swap" ? currentExercise.dropsetsPerSet || 1 : 1));
    setSessionSupersetWithNext(false);
    setWorkoutPickerStep("configure");
  };

  const applyWorkoutExerciseChange = () => {
    if (!selectedRoutine || !currentExercise || !pendingWorkoutExerciseId) return;
    const source = exerciseLibrary.find((exercise) => exercise.id === pendingWorkoutExerciseId);
    if (!source) return;

    const isHoldExercise = source.type === "skill-static";
    const insertIndex = getWorkoutInsertIndex();
    const linkTarget = workoutExerciseChangeMode === "add" ? getWorkoutLinkTarget() : null;
    const swapInSuperset = workoutExerciseChangeMode === "swap" && isInSuperset(currentExercise, exerciseIndex, exercises);
    const setsAreLocked = swapInSuperset || (workoutExerciseChangeMode === "add" && sessionSupersetWithNext && !!linkTarget);
    const forcedSetCount = swapInSuperset
      ? currentExercise.targetSets || 3
      : linkTarget
      ? linkTarget.targetSets || 3
      : null;

    const sessionExercise = {
      exerciseId: source.id,
      targetSets: setsAreLocked && forcedSetCount
        ? forcedSetCount
        : Math.max(1, parseInt(sessionTargetSets, 10) || 3),
      specialType: sessionSpecialType,
      ...(sessionSpecialType === "dropset" ? { dropsetsPerSet: Math.max(1, parseInt(sessionDropsetsPerSet, 10) || 1) } : {}),
      ...(isHoldExercise ? { targetHoldSeconds: Math.max(1, parseInt(sessionTargetHold, 10) || 30) } : { targetReps: sessionTargetReps || "8-12" }),
      instanceId: `${source.id}-session-${Date.now()}`,
    };

    const updatedExercises = [...selectedRoutine.exercises];
    if (workoutExerciseChangeMode === "swap") {
      // Preserve an existing pair relationship when swapping one of its exercises.
      updatedExercises[exerciseIndex] = {
        ...sessionExercise,
        instanceId: currentExercise.instanceId,
        supersetWithNext: currentExercise.supersetWithNext,
      };
    } else {
      // Insert after the entire active pair, never in the middle of an A/B group.
      // Linking is only allowed when the next exercise is standalone, so an
      // existing superset cannot be accidentally extended/crossed.
      const canLinkToNext = !!linkTarget;
      updatedExercises.splice(insertIndex, 0, {
        ...sessionExercise,
        supersetWithNext: canLinkToNext && sessionSupersetWithNext,
      });
      setActiveExerciseInstanceId(sessionExercise.instanceId);
    }

    setSelectedRoutine({ ...selectedRoutine, exercises: updatedExercises });
    setSetIndex(0);
    setDropIndex(0);
    setSelectedSubSkill(null);
    setLoad("");
    setReps("");
    setRir("");
    setRpe("");
    setWorkoutPickerStep("search");
    setPendingWorkoutExerciseId(null);
    setIsWorkoutExercisePickerVisible(false);
  };

  // Split Engine Operations
  const enterSplitEditor = () => {
    if (!activeSplit) {
      const freshSplit = {
        id: `split-${Date.now()}`,
        name: "My Training Split",
        startDate: new Date().toDateString(),
        days: buildSplitDays(4),
      };
      setActiveSplit(freshSplit);
      setEditingSplitName("My Training Split");
    } else {
      setEditingSplitName(activeSplit.name);
    }
    setMode("split_editor");
  };

  const openSplitPicker = () => {
    setIsSplitPickerVisible(true);
  };

  const createNewSplit = () => {
    const freshSplit = {
      id: `split-${Date.now()}`,
      name: "New Split",
      startDate: new Date().toDateString(),
      days: buildSplitDays(4),
    };
    setActiveSplit(freshSplit);
    setEditingSplitName(freshSplit.name);
    setMode("split_editor");
    setIsSplitPickerVisible(false);
  };

  const persistSplitLibrary = async (profiles, selectedId) => {
    try {
      await AsyncStorage.setItem(SPLIT_LIBRARY_KEY, JSON.stringify({ splits: profiles, activeSplitId: selectedId }));
    } catch (e) {
      console.error("Failed to persist split library", e);
    }
  };

  const cancelDeleteSplit = () => {
    setSplitToDelete(null);
    setIsSplitPickerVisible(true);
  };

  const confirmDeleteSplit = async () => {
    if (!splitToDelete?.id) return;

    const deletedId = splitToDelete.id;
    const updatedProfiles = splitProfiles.filter((split) => split.id !== deletedId);
    const deletingActive = activeSplitId === deletedId;

    setSplitProfiles(updatedProfiles);
    setSplitToDelete(null);
    setIsSplitPickerVisible(true);

    if (deletingActive) {
      setActiveSplit(null);
      setActiveSplitId(null);
      await persistSplitLibrary(updatedProfiles, null);
    } else {
      await persistSplitLibrary(updatedProfiles, activeSplitId);
    }
  };

  const selectActiveSplit = async (splitId) => {
    if (splitId === null) {
      setActiveSplit(null);
      setActiveSplitId(null);
      await persistSplitLibrary(splitProfiles, null);
      setIsSplitPickerVisible(false);
      return;
    }

    const selected = splitProfiles.find((split) => split.id === splitId);
    if (!selected) return;
    const selectedWithStart = {
      ...selected,
      startDate: selected.startDate || new Date().toDateString(),
      days: selected.days || buildSplitDays(4),
    };
    setActiveSplit(selectedWithStart);
    setActiveSplitId(splitId);
    await persistSplitLibrary(splitProfiles, splitId);
    setIsSplitPickerVisible(false);
  };

  const saveSplitSetup = async () => {
    try {
      const newSplit = {
        ...activeSplit,
        id: activeSplit?.id || `split-${Date.now()}`,
        name: editingSplitName,
        startDate: activeSplit?.startDate || new Date().toDateString(),
        days: activeSplit?.days?.length ? activeSplit.days : buildSplitDays(4),
      };

      const existingIndex = splitProfiles.findIndex((split) => split.id === newSplit.id);
      const updatedProfiles = existingIndex >= 0
        ? splitProfiles.map((split) => (split.id === newSplit.id ? newSplit : split))
        : [...splitProfiles, newSplit];

      setSplitProfiles(updatedProfiles);
      setActiveSplit(newSplit);
      setActiveSplitId(newSplit.id);
      await persistSplitLibrary(updatedProfiles, newSplit.id);
      setMode("idle");
    } catch (e) {
      console.error("Failed to persist training split config", e);
    }
  };

  const openRoutineSearchForDay = (dayIdx) => {
    setTargetDayIndex(dayIdx);
    setSearchQuery("");
    setIsSearchModalVisible(true);
  };

  const addRoutineToDay = (routineId) => {
    if (targetDayIndex === null || !activeSplit) return;
    const updatedDays = [...activeSplit.days];
    
    if (updatedDays[targetDayIndex].routineIds.includes(routineId)) {
      setIsSearchModalVisible(false);
      return;
    }

    updatedDays[targetDayIndex].routineIds.push(routineId);
    const updatedSplit = { ...activeSplit, days: updatedDays };
    setActiveSplit(updatedSplit);
    persistSplitLibrary(splitProfiles.map((split) => (split.id === updatedSplit.id ? updatedSplit : split)), updatedSplit.id);
    setIsSearchModalVisible(false);
  };

  const removeRoutineFromDay = (dayIdx, routineIdx) => {
    if (!activeSplit) return;
    const updatedDays = [...activeSplit.days];
    updatedDays[dayIdx].routineIds.splice(routineIdx, 1);
    const updatedSplit = { ...activeSplit, days: updatedDays };
    setActiveSplit(updatedSplit);
    persistSplitLibrary(splitProfiles.map((split) => (split.id === updatedSplit.id ? updatedSplit : split)), updatedSplit.id);
  };

  const formatRoutineTagsProps = (routine) => {
    if (!routine) return routine;
    return {
      ...routine,
      muscleTags: routine.muscleTags ? routine.muscleTags.slice(0, 3) : []
    };
  };

  // Complex Post-Workout Metric Analytics Factory Engine
  const computeComplexWorkoutMetrics = () => {
    if (setLog.length === 0) return null;

    let totalVolume = 0;
    let totalRepsCount = 0;
    let totalHoldSecondsCount = 0;
    let maxHoldSecondsCount = 0;
    let maxLoad = 0;
    let rpeSum = 0;
    let validRpeCount = 0;
    let supersetSetsCount = 0;
    
    // Exercise unique breakdown metrics
    const exerciseAnalysisMap = {};

    setLog.forEach((item) => {
      const numericLoad = parseFloat(item.load) || 0;
      const numericReps = parseInt(item.reps) || 0;
      const numericRpe = parseFloat(item.rpe) || 0;

      // Max Load check
      if (numericLoad > maxLoad) maxLoad = numericLoad;

      // Accumulate specific type tracking
      if (item.isHold) {
        totalHoldSecondsCount += numericReps;
        if (numericReps > maxHoldSecondsCount) {
          maxHoldSecondsCount = numericReps;
        }
      } else {
        totalRepsCount += numericReps;
        totalVolume += numericLoad * numericReps;
      }

      // RPE Calculation
      if (numericRpe > 0) {
        rpeSum += numericRpe;
        validRpeCount += 1;
      }

      if (item.isSuperset) {
        supersetSetsCount += 1;
      }

      // Structural Breakdown grouping
      if (!exerciseAnalysisMap[item.exercise]) {
        exerciseAnalysisMap[item.exercise] = {
          name: item.exercise,
          setsCount: 0,
          totalExerciseVolume: 0,
          maxExerciseLoad: 0,
          avgExerciseRpe: 0,
          rpeExerciseSum: 0,
          validExerciseRpeCount: 0,
        };
      }

      const exGroup = exerciseAnalysisMap[item.exercise];
      exGroup.setsCount += 1;
      if (!item.isHold) {
        exGroup.totalExerciseVolume += numericLoad * numericReps;
      }
      if (numericLoad > exGroup.maxExerciseLoad) {
        exGroup.maxExerciseLoad = numericLoad;
      }
      if (numericRpe > 0) {
        exGroup.rpeExerciseSum += numericRpe;
        exGroup.validExerciseRpeCount += 1;
      }
    });

    Object.keys(exerciseAnalysisMap).forEach(key => {
      const exGroup = exerciseAnalysisMap[key];
      exGroup.avgExerciseRpe = exGroup.validExerciseRpeCount > 0 
        ? (exGroup.rpeExerciseSum / exGroup.validExerciseRpeCount).toFixed(1) 
        : "N/A";
    });

    const averageRpe = validRpeCount > 0 ? (rpeSum / validRpeCount).toFixed(1) : "N/A";

    return {
      totalVolume,
      totalRepsCount,
      totalHoldSecondsCount,
      maxHoldSecondsCount,
      maxLoad,
      averageRpe,
      supersetSetsCount,
      exerciseBreakdown: Object.values(exerciseAnalysisMap),
    };
  };

  const activeRoutineIdsList = Object.keys(allActiveStates);

  // Determine if switching is locked because the current exercise has logged data
  const currentExerciseHasLogs = setLog.some(log => log.exercise === exerciseName);

  const calculatedMetrics = phase === "finished" ? computeComplexWorkoutMetrics() : null;

  const getRoutineCardReadiness = (routine: Routine) => ({
    ...getRoutineReadiness(routine),
    recommended: routine.id === recommendedRoutineId,
  });

  const routinesByReadiness = (routines: Routine[]) =>
    [...routines].sort((a, b) => getRoutineReadiness(b).percent - getRoutineReadiness(a).percent);

  return (
    <Screen padded={false}>
      {/* End Workout Early Alert Modal */}
      <Modal animationType="fade" transparent visible={isAlertVisible} onRequestClose={() => setIsAlertVisible(false)}>
        <View style={styles.modalOverlay}>
          <View style={styles.modalContent}>
            <Text style={styles.modalTitle}>End Workout Early?</Text>
            <Text style={styles.modalBody}>Are you sure you want to finish training now? Your progress will be saved as a partial entry.</Text>
            
            <View style={styles.modalVerticalButtons}>
              <Button variant="destructive" onPress={confirmEndWorkoutPartial}>
                End as Partially Finished
              </Button>
              <Button variant="text" onPress={() => setIsAlertVisible(false)}>
                Cancel
              </Button>
            </View>
          </View>
        </View>
      </Modal>

      {/* Split Picker Modal */}
      <Modal animationType="fade" transparent visible={isSplitPickerVisible} onRequestClose={() => setIsSplitPickerVisible(false)}>
        <View style={styles.searchModalOverlay}>
          <View style={styles.searchModalContent}>
            <Text style={styles.searchModalTitle}>Select Training Split</Text>
            {([
                { id: null, name: "No active split", days: [] },
                ...splitProfiles,
              ]).map((split) => (
                <Pressable
                  key={split.id ?? "none"}
                  style={[
                    styles.searchResultRow,
                    split.id === activeSplitId && { borderColor: theme.colors.accent, backgroundColor: "rgba(0,122,255,0.08)" }
                  ]}
                  onPress={() => selectActiveSplit(split.id)}
                >
                  <View style={{ flex: 1, gap: 2 }}>
                    <Text style={styles.searchResultText}>{split.name}</Text>
                    {split.id ? (
                      <Text style={styles.searchResultSubtitle}>
                        {split.days.filter((day) => day.routineIds?.length > 0).length} days assigned
                      </Text>
                    ) : (
                      <Text style={styles.searchResultSubtitle}>Clears active split</Text>
                    )}
                  </View>
                  <View style={styles.splitPickerRowActions}>
                    {split.id === activeSplitId && <Text style={styles.searchResultCount}>Active</Text>}
                    {split.id && (
                      <Pressable
                        style={styles.splitDeleteButton}
                        hitSlop={8}
                        onPress={(event) => {
                          event.stopPropagation();
                          // Only one modal at a time: hand over to the confirmation.
                          setIsSplitPickerVisible(false);
                          setSplitToDelete(split);
                        }}
                      >
                        <Text style={styles.splitDeleteButtonText}>×</Text>
                      </Pressable>
                    )}
                  </View>
                </Pressable>
              ))}
            <Pressable style={[styles.primaryButton, { marginTop: 12 }]} onPress={createNewSplit}>
              <Text style={styles.primaryText}>Create New Split</Text>
            </Pressable>
            <Pressable style={[styles.secondaryButton, { marginTop: 12 }]} onPress={() => setIsSplitPickerVisible(false)}>
              <Text style={styles.secondaryText}>Close</Text>
            </Pressable>
          </View>
        </View>
      </Modal>

      {/* Delete Split Confirmation — mirrors the End Workout Early modal */}
      <Modal animationType="fade" transparent visible={!!splitToDelete} onRequestClose={cancelDeleteSplit}>
        <View style={styles.modalOverlay}>
          <View style={styles.modalContent}>
            <Text style={styles.modalTitle}>Delete Split?</Text>
            <Text style={styles.modalBody}>
              Are you sure you want to delete "{splitToDelete?.name}"? This removes the split and its day assignments permanently.
            </Text>

            <View style={styles.modalVerticalButtons}>
              <Button variant="destructive" onPress={confirmDeleteSplit}>
                Delete Split
              </Button>
              <Button variant="text" onPress={cancelDeleteSplit}>
                Cancel
              </Button>
            </View>
          </View>
        </View>
      </Modal>

{/* Partial Alert Modal */}
       <Modal animationType="fade" transparent visible={isPartialAlertVisible} onRequestClose={() => setIsPartialAlertVisible(false)}>
         <View style={styles.modalOverlay}>
           <View style={styles.modalContent}>
             <Text style={styles.modalTitle}>Save Partial Workout?</Text>
             <Text style={styles.modalBody}>Do you want to save the workout as a partial entry?</Text>
             
             <View style={styles.modalVerticalButtons}>
               <Button variant="primary" onPress={processQuickSavePartial}>
                 Process
               </Button>
               <Button variant="text" onPress={() => { setIsPartialAlertVisible(false); setTargetPartialRoutineId(null); }}>
                 Cancel
               </Button>
             </View>
           </View>
         </View>
       </Modal>

      <Modal animationType="fade" presentationStyle="overFullScreen" transparent visible={celebrations.length > 0} onRequestClose={() => setCelebrations([])}>
        <View style={styles.celebrationContainer}>
          <View style={styles.celebrationRow}>
            {celebrations
              .slice()
              .sort((a, b) => (a.variant === 'workoutFinish' ? -1 : 1))
              .map((item) => (
                <View key={item.id} style={styles.celebrationCardWrapper}>
                  <CongratulationsAnimation
                    variant={item.variant}
                    message={item.message}
                    onAnimationFinish={() => removeCelebration(item.id)}
                  />
                </View>
              ))}
          </View>
        </View>
      </Modal>

      {/* Subskill Selection Modal */}
      <Modal animationType="slide" transparent visible={isSubSkillModalVisible} onRequestClose={() => setIsSubSkillModalVisible(false)}>
        <View style={styles.subskillModalOverlay}>
          <View style={styles.subskillModalContent}>
            <Text style={styles.modalTitle}>Select Progression</Text>
            <ScrollView style={styles.subskillList} contentContainerStyle={{ gap: 8 }}>
              {availableSubskills.map((subskill, index) => (
                <Pressable
                  key={subskill.id}
                  style={[styles.subskillOption, selectedSubSkill?.id === subskill.id && styles.subskillOptionSelected]}
                  onPress={() => {
                    setSelectedSubSkill(subskill);
                    setIsSubSkillModalVisible(false);
                  }}
                >
                  <Text style={[styles.subskillText, selectedSubSkill?.id === subskill.id && styles.subskillTextSelected]}>
                    {index === 0 ? `${subskill.name || formatExerciseName(subskill.id)} (Main)` : formatExerciseName(subskill.id)}
                  </Text>
                </Pressable>
              ))}
            </ScrollView>
<Button variant="text" onPress={() => setIsSubSkillModalVisible(false)}>
               Cancel
             </Button>
          </View>
        </View>
      </Modal>

      {/* Routine Finder Overlay */}
      <Modal animationType="slide" transparent visible={isSearchModalVisible} onRequestClose={() => setIsSearchModalVisible(false)}>
        <View style={styles.searchModalOverlay}>
          <View style={styles.searchModalContent}>
            <Text style={styles.searchModalTitle}>Add Routine to {activeSplit?.days?.[targetDayIndex]?.day || `Day ${targetDayIndex + 1}`}</Text>
            <TextInput
              style={styles.searchBarInput}
              value={searchQuery}
              onChangeText={setSearchQuery}
              placeholder="Search available routines..."
              placeholderTextColor={theme.colors.textSecondary}
              autoCapitalize="none"
            />
            <ScrollView style={styles.searchResultList} contentContainerStyle={{ gap: 8 }}>
              {filteredRoutines.length > 0 ? (
                filteredRoutines.map((routine) => (
                  <Pressable key={routine.id} style={styles.searchResultRow} onPress={() => addRoutineToDay(routine.id)}>
                    <View style={{ flex: 1, gap: 2 }}>
                      <Text style={styles.searchResultText}>{routine.name}</Text>
                      <Text style={styles.searchResultSubtitle}>
                        {routine.exercises?.map(e => formatExerciseName(e.exerciseId)).join(", ") || "No exercises listed"}
                      </Text>
                    </View>
                    <Text style={styles.searchResultCount}>+{routine.exercises?.length || 0} Ex</Text>
                  </Pressable>
                ))
              ) : (
                <Text style={styles.emptyText}>No matching routines found</Text>
              )}
            </ScrollView>
<Button variant="secondary" onPress={() => setIsSearchModalVisible(false)}>
               Close Search
             </Button>
          </View>
        </View>
      </Modal>

      {/* Session-only exercise changes: this updates the active workout and its metrics, never the saved routine. */}
      <Modal animationType="slide" transparent visible={isWorkoutExercisePickerVisible} onRequestClose={() => setIsWorkoutExercisePickerVisible(false)}>
        <View style={styles.searchModalOverlay}>
          <View style={styles.searchModalContent}>
            <Text style={styles.searchModalTitle}>{workoutExerciseChangeMode === "add" ? "Add Exercise" : "Swap Exercise"}</Text>
            
            {workoutPickerStep === "search" ? (
              <>
            <TextInput
              style={styles.routineSearchInput}
              value={workoutExerciseSearch}
              onChangeText={setWorkoutExerciseSearch}
              placeholder="Type to search..."
              placeholderTextColor={theme.colors.textSecondary}
              clearButtonMode="while-editing"
            />
            <View style={styles.routineFilterContainer}>
              <ScrollView horizontal showsHorizontalScrollIndicator={false} contentContainerStyle={styles.routineFilterScroll}>
                {["barbells", "dumbbells", "calisthenics", "cables"].map((modality) => {
                  const isActive = workoutExerciseModality === modality;
                  return <Pressable key={modality} onPress={() => setWorkoutExerciseModality(isActive ? null : modality)} style={[styles.routineChip, isActive && styles.routineChipActive]}>
                    <Text style={[styles.routineChipText, isActive && styles.routineChipTextActive]}>{modality}</Text>
                  </Pressable>;
                })}
                <View style={styles.routineFilterDivider} />
                {["compound", "isolation", "skill-static", "skill-dynamic"].map((type) => {
                  const isActive = workoutExerciseType === type;
                  return <Pressable key={type} onPress={() => setWorkoutExerciseType(isActive ? null : type)} style={[styles.routineChip, isActive && styles.routineChipActive]}>
                    <Text style={[styles.routineChipText, isActive && styles.routineChipTextActive]}>{type}</Text>
                  </Pressable>;
                })}
                <View style={styles.routineFilterDivider} />
                {muscleGroups.map((muscle) => {
                  const isActive = workoutExerciseMuscle === muscle.id;
                  return <Pressable key={muscle.id} onPress={() => setWorkoutExerciseMuscle(isActive ? null : muscle.id)} style={[styles.routineChip, isActive && styles.routineChipActive]}>
                    <Text style={[styles.routineChipText, isActive && styles.routineChipTextActive]}>{muscle.id}</Text>
                  </Pressable>;
                })}
              </ScrollView>
            </View>
            <ScrollView showsVerticalScrollIndicator={false} style={styles.routineExerciseSelectorList} nestedScrollEnabled>
              {workoutPickerExercises.length ? workoutPickerExercises.map((exercise) => {
                const hasProgressionVariants = exerciseLibrary.some((candidate) => candidate.subSkillOf === exercise.id);
                return (
                  <Pressable key={exercise.id} style={styles.routineSelectorRow} onPress={() => configureWorkoutExerciseChange(exercise.id)}>
                    <View style={styles.routineSelectorTextContainer}>
                      <View style={styles.routineExerciseNameRow}>
                        <Text style={styles.routineSelectorText}>{exercise.name}</Text>
                        {hasProgressionVariants && <View style={styles.routineProgressionBadge}><Text style={styles.routineProgressionBadgeText}>Progressions</Text></View>}
                      </View>
                      <Text style={styles.routineSelectorSubtext}>{exercise.type} • {exercise.modality} • {exercise.muscles.map((muscle) => muscle.muscleId).join(", ")}</Text>
                      {hasProgressionVariants && <Text style={styles.routineProgressionHint}>This exercise has progression variations selectable during workout</Text>}
                    </View>
                    <Text style={styles.routinePickerAction}>{workoutExerciseChangeMode === "add" ? "+" : "⇄"}</Text>
                  </Pressable>
                );
              }) : <View style={styles.routineEmptySearchContainer}><Text style={styles.routineEmptySearchText}>No exercises match your choices.</Text></View>}
            </ScrollView>
              </>
            ) : (() => {
              const pendingExercise = exerciseLibrary.find((exercise) => exercise.id === pendingWorkoutExerciseId);
              const isHoldExercise = pendingExercise?.type === "skill-static";
              const insertIndex = getWorkoutInsertIndex();
              const linkTarget = workoutExerciseChangeMode === "add" ? getWorkoutLinkTarget() : null;
              const canLinkToNext = workoutExerciseChangeMode === "add" && !!linkTarget;
              const preservesPair = workoutExerciseChangeMode === "swap" && isInSuperset(currentExercise, exerciseIndex, exercises);
              const setsAreLocked = preservesPair || (workoutExerciseChangeMode === "add" && sessionSupersetWithNext && !!linkTarget);
              const lockedSetCount = preservesPair
                ? currentExercise?.targetSets || 3
                : linkTarget?.targetSets || 3;
              const toggleSupersetLink = (enabled) => {
                setSessionSupersetWithNext(enabled);
                if (enabled && linkTarget) {
                  setSessionTargetSets(String(linkTarget.targetSets || 3));
                } else if (!enabled) {
                  setSessionTargetSets("3");
                }
              };
              return (
                <View style={styles.sessionConfigPanel}>
                  <Text style={styles.sessionConfigTitle}>{pendingExercise?.name}</Text>
                  <Text style={styles.sessionConfigHint}>Set session targets before adding this exercise.</Text>
                  <View style={styles.sessionConfigRow}>
                    <View style={styles.sessionConfigField}>
                      <Text style={styles.sessionConfigLabel}>Sets</Text>
                      {setsAreLocked ? (
                        <View style={[styles.sessionConfigLockedInput, styles.sessionConfigInput]}>
                          <Text style={styles.sessionConfigLockedText}>{lockedSetCount}</Text>
                        </View>
                      ) : (
                        <NumericInput style={styles.sessionConfigInput} value={sessionTargetSets} onChangeText={setSessionTargetSets} maxLength={2} label="Sets" />
                      )}
                    </View>
                    <View style={styles.sessionConfigField}>
                      <Text style={styles.sessionConfigLabel}>{isHoldExercise ? "Hold (s)" : "Reps Range"}</Text>
                      {isHoldExercise ? (
                        <NumericInput style={styles.sessionConfigInput} value={sessionTargetHold} onChangeText={setSessionTargetHold} maxLength={3} label="Hold" />
                      ) : (
                        <NumericInput style={styles.sessionConfigInput} value={sessionTargetReps} onChangeText={setSessionTargetReps} allowRange maxLength={5} label="Reps range" />
                      )}
                    </View>
                  </View>
                  <View style={styles.sessionToggleRow}>
                    <Text style={styles.sessionConfigLabel}>Dropset</Text>
                    <Switch value={sessionSpecialType === "dropset"} onValueChange={(enabled) => setSessionSpecialType(enabled ? "dropset" : "normal")} trackColor={{ true: theme.colors.accent }} />
                  </View>
                  {sessionSpecialType === "dropset" && (
                    <View style={styles.sessionConfigField}>
                      <Text style={styles.sessionConfigLabel}>Dropsets per set</Text>
                      <NumericInput style={styles.sessionConfigInput} value={sessionDropsetsPerSet} onChangeText={setSessionDropsetsPerSet} maxLength={2} label="Dropsets" />
                    </View>
                  )}
                  {canLinkToNext && (
                    <View style={styles.sessionToggleRow}>
                      <View style={{ flex: 1 }}>
                        <Text style={styles.sessionConfigLabel}>Link Superset Next</Text>
                        <Text style={styles.sessionConfigHint}>The exercise will be added after the current pair.</Text>
                      </View>
                      <Switch value={sessionSupersetWithNext} onValueChange={toggleSupersetLink} trackColor={{ true: theme.colors.accent }} />
                    </View>
                  )}
                  {preservesPair && <Text style={styles.sessionConfigHint}>This swap keeps the current superset pairing intact.</Text>}
                  <Button variant="primary" onPress={applyWorkoutExerciseChange}>Apply to This Workout</Button>
                </View>
              );
            })()}
            <Button variant="secondary" onPress={() => workoutPickerStep === "configure" ? setWorkoutPickerStep("search") : setIsWorkoutExercisePickerVisible(false)}>
              {workoutPickerStep === "configure" ? "Back to Search" : "Cancel"}
            </Button>
          </View>
        </View>
      </Modal>

      <ScrollView contentContainerStyle={styles.content}>
        
        {/* IDLE VIEW MODE */}
        {mode === "idle" && (
          <>
            <View style={styles.header}>
              {activeSplit ? (
                <View style={styles.inlineSplitHeaderContainer}>
                  <Text style={styles.subtitleLeft}>Active split: {activeSplit.name}</Text>
                  <Pressable style={styles.splitMiniActionInline} onPress={enterSplitEditor}>
                    <Text style={styles.splitMiniActionTextInline}>Edit</Text>
                  </Pressable>
                  <Pressable style={styles.splitMiniActionInline} onPress={openSplitPicker}>
                    <Text style={styles.splitMiniActionTextInline}>Switch Split</Text>
                  </Pressable>
                </View>
              ) : splitProfiles.length > 0 ? (
                <View style={styles.inlineSplitHeaderContainer}>
                  <Text style={styles.subtitleLeft}>No active split selected</Text>
                  <Pressable style={styles.splitMiniActionInline} onPress={openSplitPicker}>
                    <Text style={styles.splitMiniActionTextInline}>Choose Split</Text>
                  </Pressable>
                </View>
              ) : null}
            </View>

            {/* Streak sits in the corner: fire lights up once today's split is done */}
            <View style={styles.streakCornerRow}>
              <Pressable
                style={[styles.deloadButton, streakState.deloadActive && styles.deloadButtonActive]}
                onPress={toggleDeload}
              >
                <Text style={[styles.deloadButtonText, streakState.deloadActive && styles.deloadButtonTextActive]}>
                  {streakState.deloadActive ? "End Deload" : "Deload"}
                </Text>
              </Pressable>
              <View style={styles.streakCorner}>
                <Text
                  style={[
                    styles.streakFlame,
                    !(followedSplitToday && !streakState.deloadActive) && styles.streakFlameIdle,
                  ]}
                >
                  🔥
                </Text>
                <Text
                  style={[
                    styles.streakValue,
                    followedSplitToday && !streakState.deloadActive && styles.streakValueActive,
                  ]}
                >
                  {streakState.streak}
                </Text>
              </View>
            </View>

            {/* Paused Workouts Section */}
            {activeRoutineIdsList.length > 0 && (
              <View style={styles.pausedWorkoutsBlock}>
                <Text style={styles.pausedBlockTitle}>Paused Workouts ({activeRoutineIdsList.length})</Text>
                {activeRoutineIdsList.map((routineId) => {
                  const savedState = allActiveStates[routineId];
                  if (!savedState) return null;
                  const completedExCount = savedState.completedInstanceIds?.length || 0;
                  const totalExNum = savedState.selectedRoutine?.exercises?.length || 0;
                  const hasLogs = savedState.setLog && savedState.setLog.length > 0;
                  return (
                    <View key={routineId} style={styles.pausedWorkoutCardRow}>
                      <View style={{ flex: 1 }}>
                        <Text style={styles.pausedWorkoutCardName}>{savedState.selectedRoutine?.name}</Text>
                        <Text style={styles.pausedWorkoutCardMeta}>
                          Done: {completedExCount} / {totalExNum} exercises • Logged: {savedState.setLog?.length || 0} sets • Time: {formatTime(getLivePausedDuration(savedState))}
                        </Text>
                      </View>
                      <View style={styles.pausedWorkoutCardActions}>
                        <Pressable style={styles.resumeMiniBtn} onPress={() => resumeSpecificWorkout(routineId)}>
                          <Text style={styles.resumeMiniText}>Resume</Text>
                        </Pressable>
                        <Pressable 
                          style={hasLogs ? styles.deleteMiniBtn : [styles.deleteMiniBtn, { backgroundColor: "rgba(255,68,68,0.08)" }]} 
                          onPress={() => openQuickSavePartialConfirmation(routineId)}
                        >
                          <Text style={[styles.deleteMiniText, !hasLogs && { color: "#ff4444" }]}>
                            {hasLogs ? "Save Partial" : "Discard"}
                          </Text>
                        </Pressable>
                      </View>
                    </View>
                  );
                })}
              </View>
            )}

            {!activeSplit ? (
              <View style={styles.emptySplitBox}>
                <Text style={styles.splitPromptText}>Set up a structured weekly training pipeline to automate your daily targets.</Text>
                <Pressable style={styles.primaryButton} onPress={enterSplitEditor}>
                  <Text style={styles.primaryText}>Create Training Split</Text>
                </Pressable>
                <Pressable style={[styles.secondaryButton, { marginTop: 8 }]} onPress={() => setMode("selecting")}>
                  <Text style={styles.secondaryText}>Browse All Routines Manual</Text>
                </Pressable>
              </View>
            ) : (
              <>
                {todaysRoutines.length > 0 ? (
                  <View style={styles.todayBlock}>
                    <Text style={styles.sectionSubtitle}>Lined up for today ({currentSplitDayName}):</Text>
                    {todaysRoutines.map((routine, idx) => {
                      const isCompleted = completedRoutineIds.includes(routine.id);
                      const isPartial = partialRoutineIds.includes(routine.id);
                      const isDone = isCompleted || isPartial;
                      const hasPausedState = allActiveStates[routine.id];

                      return (
                        <View key={`${routine.id}-${idx}`} style={[{ width: "100%" }, isDone && styles.completedRoutineCrossed]}>
                          <RoutineCard routine={formatRoutineTagsProps(routine)} readiness={getRoutineCardReadiness(routine)} />
                          {isCompleted && (
                            <View style={styles.checkmarkBadge}>
                              <Text style={styles.checkmarkBadgeText}>Completed</Text>
                            </View>
                          )}
                          {isPartial && (
                            <View style={[styles.checkmarkBadge, { backgroundColor: "#f57c00" }]}>
                              <Text style={styles.checkmarkBadgeText}>Partial</Text>
                            </View>
                          )}
                          {hasPausedState && !isDone && (
                            <View style={styles.progressBadgeInline}>
                              <Text style={styles.progressBadgeInlineText}>
                                Paused ({hasPausedState.completedInstanceIds?.length || 0} / {hasPausedState.selectedRoutine?.exercises?.length || 0} Done)
                              </Text>
                              <Text style={styles.progressBadgeInlineText}>
                                Time: {formatTime(getLivePausedDuration(hasPausedState))}
                              </Text>
                            </View>
                          )}
                          {hasPausedState && !isDone && (
                            <View style={styles.linedUpPausedActions}>
                              <Pressable style={styles.resumeMiniBtn} onPress={() => resumeSpecificWorkout(routine.id)}>
                                <Text style={styles.resumeMiniText}>Resume</Text>
                              </Pressable>
                              <Pressable
                                style={[styles.deleteMiniBtn, !(hasPausedState.setLog?.length > 0) && { opacity: 0.45 }]}
                                onPress={() => openQuickSavePartialConfirmation(routine.id)}
                                disabled={!(hasPausedState.setLog?.length > 0)}
                              >
                                <Text style={styles.deleteMiniText}>Save Partial</Text>
                              </Pressable>
                              <Pressable style={styles.deleteMiniBtn} onPress={() => removeActiveRoutineState(routine.id)}>
                                <Text style={styles.deleteMiniText}>Discard</Text>
                              </Pressable>
                            </View>
                          )}
                          {!isDone && !hasPausedState && (
                            <Pressable 
                              style={styles.startInlineButton}
                              onPress={() => launchRoutineExecution(routine)}
                            >
                              <Text style={styles.startInlineButtonText}>
                                {hasPausedState ? `Resume Routine · ${formatTime(hasPausedState.totalDuration || 0)}` : "Start Routine"}
                              </Text>
                            </Pressable>
                          )}
                        </View>
                      );
                    })}
                    
                    <Pressable style={styles.differentRoutineSecondaryButton} onPress={() => setMode("selecting_different")}>
                      <Text style={styles.differentRoutineSecondaryText}>Do Different Routine</Text>
                    </Pressable>
                  </View>
                ) : (
                  <View style={styles.restDayBox}>
                    <Text style={styles.restDayTitle}>Today ({currentSplitDayName}) is a Rest Day</Text>
                    <Text style={styles.restDaySubtitle}>Engage in active recovery.</Text>
                    <Pressable style={styles.secondaryButton} onPress={() => setMode("selecting_different")}>
                      <Text style={styles.secondaryText}>Do Different Routine</Text>
                    </Pressable>
                  </View>
                )}
              </>
            )}
          </>
        )}

        {/* SELECT VIEW MODE */}
        {mode === "selecting" && (
          <>
            <View style={styles.headerRow}>
              <View style={styles.header}>
                <Text style={styles.title}>Select Routine</Text>
              </View>
              <Pressable style={styles.textInlineLink} onPress={() => setMode("idle")}>
                <Text style={styles.inlineLinkStyle}>Back</Text>
              </Pressable>
            </View>
            {isLoading ? (
              <ActivityIndicator size="small" color={theme.colors.accent} style={{ marginTop: 20 }} />
            ) : allRoutines.length > 0 ? (
              routinesByReadiness(allRoutines).map((routine) => (
                <Pressable key={routine.id} onPress={() => launchRoutineExecution(routine)}>
                  <RoutineCard routine={formatRoutineTagsProps(routine)} readiness={getRoutineCardReadiness(routine)} />
                </Pressable>
              ))
            ) : (
              <Text style={styles.emptyText}>No routines found. Go create one!</Text>
            )}
          </>
        )}

        {/* SELECT DIFFERENT ROUTINE VIEW MODE */}
        {mode === "selecting_different" && (
          <>
            <View style={styles.headerRow}>
              
              <Pressable style={styles.textInlineLink} onPress={() => setMode("idle")}>
                <Text style={styles.inlineLinkStyle}>Back</Text>
              </Pressable>
            </View>
            {isLoading ? (
              <ActivityIndicator size="small" color={theme.colors.accent} style={{ marginTop: 20 }} />
            ) : differentRoutines.length > 0 ? (
              routinesByReadiness(differentRoutines).map((routine) => (
                <Pressable key={routine.id} onPress={() => launchRoutineExecution(routine)}>
                  <RoutineCard routine={formatRoutineTagsProps(routine)} readiness={getRoutineCardReadiness(routine)} />
                </Pressable>
              ))
            ) : (
              <Text style={styles.emptyText}>No alternative routines found outside of today's split targets.</Text>
            )}
          </>
        )}

        {/* WEEKLY SPLIT DESIGNER MODE */}
        {mode === "split_editor" && (
          <>
            <View style={styles.header}>
              <TextInput 
                style={styles.splitNameInput} 
                value={editingSplitName} 
                onChangeText={setEditingSplitName} 
                placeholder="Split Name (e.g. PPL, Upper/Lower)"
                placeholderTextColor={theme.colors.textSecondary}
              />
            </View>

            <View style={styles.splitEditorOptionsRow}>
              <View style={styles.splitLengthOption}>
                <Text style={styles.splitOptionLabel}>Split length</Text>
                <NumericInput
                  style={styles.splitLengthInput}
                  value={`${activeSplit?.days?.length || 4}`}
                  onChangeText={(value) => {
                    const parsed = parseInt(value, 10);
                    if (isNaN(parsed)) return;
                    if (!activeSplit) return;
                    if (parsed < 1 || parsed > 30) {
                      return;
                    }
                    const updatedDays = buildSplitDays(parsed).map((day, idx) => ({
                      ...day,
                      routineIds: activeSplit.days?.[idx]?.routineIds || [],
                    }));
                    setActiveSplit({ ...activeSplit, days: updatedDays });
                  }}
                  placeholder="4"
                  placeholderTextColor={theme.colors.textSecondary}
                  maxLength={2}
                  maxValue={30}
                  label="Split length"
                />
              </View>
            </View>

            <View style={styles.splitEditingContainer}>
              {activeSplit?.days.map((dayObj, dayIdx) => (
                <View key={dayObj.day} style={styles.splitDayConfigCard}>
                  <View style={styles.splitDayConfigHeader}>
                    <Text style={styles.splitDayNameLabel}>{dayObj.day}</Text>
                    <Pressable style={styles.addRoutineIconButton} onPress={() => openRoutineSearchForDay(dayIdx)}>
                      <Text style={styles.addRoutineIconButtonText}>+ Add Routine</Text>
                    </Pressable>
                  </View>

                  <View style={styles.splitDayRoutinesList}>
                    {dayObj.routineIds.length === 0 ? (
                      <View style={styles.restDayPlaceholderBox}>
                        <Text style={styles.restDayLabelText}>Rest Day</Text>
                      </View>
                    ) : (
                      dayObj.routineIds.map((id, rIdx) => {
                        const routine = allRoutines.find(r => r.id === id);
                        if (!routine) return null;

                        return (
                          <View key={`${id}-${rIdx}`} style={styles.cardOrderingContainer}>
                            <View style={styles.cardOrderingSidebar}>
                              <Pressable style={styles.sidebarTrashBtn} onPress={() => removeRoutineFromDay(dayIdx, rIdx)}>
                                <Text style={styles.sidebarTrashText}>✕</Text>
                              </Pressable>
                            </View>

                            <View style={styles.splitEditorRoutineCardContainer}>
                              <View style={styles.splitRoutineCardHeader}>
                                <Text style={styles.splitRoutineNameText}>{routine.name}</Text>
                                <Text style={styles.splitRoutineDurationText}>{routine.exercises?.length || 0} Exercises</Text>
                              </View>
                              
                              <View style={styles.splitRoutineExercisesInlineBox}>
                                {routine.exercises && routine.exercises.length > 0 ? (
                                  routine.exercises.map((ex, exIdx) => (
                                    <Text key={`${ex.exerciseId}-${exIdx}`} style={styles.splitRoutineExerciseLineItem}>
                                      • {formatExerciseName(ex.exerciseId)} {ex.targetSets ? `(${ex.targetSets} sets)` : ""}
                                    </Text>
                                  ))
                                ) : (
                                  <Text style={styles.noExercisesText}>No exercises in this routine</Text>
                                )}
                              </View>
                            </View>
                          </View>
                        );
                      })
                    )}
                  </View>
                </View>
              ))}
            </View>

            {/* ========================================== */}
            {/* ADVANCED SPLIT METRICS COMPONENT */}
            {/* ========================================== */}
            <View style={styles.metricsContainer}>
              <View style={styles.toggleContainer}>
                <Text style={styles.toggleLabel}>Advanced Insights</Text>
                <Switch
                  value={showSplitInsights}
                  onValueChange={(checked) => setShowSplitInsights(checked)}
                  trackColor={{ true: theme.colors.accent }}
                />
              </View>

<Text style={styles.sectionHeader}>Volume Per Split (Sets)</Text>
              <View style={styles.metricsGridInline}>
                {Object.keys(splitWeeklyVolume).length > 0 ? (
                  Object.entries(splitWeeklyVolume).map(([muscle, volume]) => (
                    <View key={muscle} style={styles.metricCardInline}>
                      <Text style={styles.metricLabel}>{muscle}</Text>
                      <Text style={styles.metricValue}>{volume.toFixed(1)}</Text>
                    </View>
                  ))
                ) : (
                  <Text style={styles.noDataText}>No volume logged yet. Assign routines to your days.</Text>
                )}
              </View>

              <Text style={styles.subHeader}>Fatigue & Recovery Alerts</Text>
              <View style={styles.warningBox}>
                {splitWarnings.length > 0 ? (
                  splitWarnings.map((warn, index) => (
                    <View key={index} style={styles.warningRow}>
                      <Text style={styles.warningBullet}>•</Text>
                      <Text style={styles.warningText}>{warn}</Text>
                    </View>
                  ))
                ) : (
                  <Text style={styles.optimalText}>No recovery bottlenecks found. Your split allocation is recovery-optimal.</Text>
                )}
              </View>

              {showSplitInsights && (
                <>
                  <Text style={styles.subHeader}>Split Score</Text>
                  <View style={styles.scoreRow}>
                    <Text style={[styles.scoreValue, { color: splitScore >= 80 ? "#30D158" : splitScore >= 50 ? "#FF9500" : "#FF453A" }]}>
                      {splitScore}/100
                    </Text>
                  </View>

                  <Text style={styles.subHeader}>Frequency Warnings</Text>
                  {frequencyWarnings.length > 0 && (
                    <View style={styles.frequencyBox}>
                      {frequencyWarnings.map((warn, index) => (
                        <View key={index} style={styles.frequencyRow}>
                          <Text style={styles.frequencyBullet}>•</Text>
                          <Text style={styles.frequencyText}>{warn}</Text>
                        </View>
                      ))}
                    </View>
                  )}
                </>
              )}
            </View>
            {/* ========================================== */}

            <View style={styles.actionContainer}>
              <Pressable style={styles.primaryButton} onPress={saveSplitSetup}>
                <Text style={styles.primaryText}>Save Setup Configuration</Text>
              </Pressable>
            </View>
          </>
        )}

        {/* ACTIVE TRAINING MODE */}
        {mode === "active" && (
          <>
            {phase === "finished" ? (
              <View style={styles.summaryContainer}>
                <Text style={styles.summaryTitle}>
                  {completedWholeRoutine ? "Workout Complete!" : "Workout Saved Early"}
                </Text>
                <Text style={styles.summarySubtitle}>
                  {completedWholeRoutine 
                    ? `Phenomenal effort tracking ${selectedRoutine?.name || "your workout"}. Here are your advanced performance insights:` 
                    : "Your tracked sets have been safely saved as a partial session entry."}
                </Text>

                {calculatedMetrics ? (
                  <>
                    {/* Data Dense Dashboard Summary Grid: 6 Basic Metrics */}
                    <View style={styles.metricsGrid}>
                      <View style={styles.metricCard}>
                        <Text style={styles.metricCardLabel}>Duration</Text>
                        <Text style={styles.metricCardValue}>{formatTime(totalDuration)}</Text>
                      </View>

                      <View style={styles.metricCard}>
                        <Text style={styles.metricCardLabel}>Total Volume</Text>
                        <Text style={styles.metricCardValue}>
                          {`${calculatedMetrics.totalVolume} kg`}
                        </Text>
                      </View>

                      <View style={styles.metricCard}>
                        <Text style={styles.metricCardLabel}>Total Sets</Text>
                        <Text style={styles.metricCardValue}>{setLog.length}</Text>
                      </View>

                      <View style={styles.metricCard}>
                        <Text style={styles.metricCardLabel}>Total Reps</Text>
                        <Text style={styles.metricCardValue}>{calculatedMetrics.totalRepsCount}</Text>
                      </View>

                      <View style={styles.metricCard}>
                        <Text style={styles.metricCardLabel}>Total Hold</Text>
                        <Text style={styles.metricCardValue}>{calculatedMetrics.totalHoldSecondsCount} sec</Text>
                      </View>

                      <View style={styles.metricCard}>
                        <Text style={styles.metricCardLabel}>Max Hold</Text>
                        <Text style={styles.metricCardValue}>{calculatedMetrics.maxHoldSecondsCount} sec</Text>
                      </View>

                      <View style={styles.metricCard}>
                        <Text style={styles.metricCardLabel}>Avg Intensity</Text>
                        <Text style={styles.metricCardValue}>RPE {calculatedMetrics.averageRpe}</Text>
                      </View>

                      <View style={styles.metricCard}>
                        <Text style={styles.metricCardLabel}>Max Load</Text>
                        <Text style={styles.metricCardValue}>{calculatedMetrics.maxLoad} kg</Text>
                      </View>
                    </View>

                    {/* Chronological RPE Set Timeline Graph */}
                    <Text style={styles.breakdownHeading}>Change in RPE over time</Text>
                    <View style={styles.graphContainer}>
                      <ScrollView horizontal showsHorizontalScrollIndicator={false} contentContainerStyle={styles.graphScroll}>
                        {[...setLog].reverse().map((item, idx) => {
                          const rpeVal = parseFloat(item.rpe) || 0;
                          const barHeight = rpeVal ? (rpeVal / 10) * 110 : 4;
                          return (
                            <View key={idx} style={styles.graphBarWrapper}>
                              <Text style={styles.graphBarValue}>{rpeVal || "-"}</Text>
                              <View
                                style={[
                                  styles.graphBar,
                                  {
                                    height: barHeight,
                                    backgroundColor: rpeVal >= 8.5 ? "#ff4444" : rpeVal >= 7 ? "#f57c00" : theme.colors.accent,
                                  },
                                ]}
                              />
                              <Text style={styles.graphBarLabel} numberOfLines={1}>Set {idx + 1}</Text>
                            </View>
                          );
                        })}
                      </ScrollView>
                    </View>
                  </>
                ) : (
                  <Text style={styles.emptyText}>No telemetry sets logged during this specific execution block.</Text>
                )}

                <Pressable style={[styles.primaryButton, { marginTop: 12 }]} onPress={() => setMode("idle")}>
                  <Text style={styles.primaryText}>Return to Dashboard</Text>
                </Pressable>
              </View>
            ) : (
              <>
                <View style={styles.headerBox}>
                  <View style={styles.trackingHeaderMeta}>
                    <Pressable style={styles.pauseBadgeLink} onPress={pauseWorkoutToDashboard}>
                      <Text style={styles.pauseBadgeText}>Pause Workout</Text>
                    </Pressable>
                    <Text style={styles.topCornerTimer}>Total: {formatTime(totalDuration)}</Text>
                  </View>
                  <Text style={styles.exerciseName}>{exerciseName}</Text>
                  {inSuperset && supersetPartner && isPrimary && phase === "waiting" && (
                    <Text style={styles.supersetHint}>
                      Superset — next: {formatExerciseName(supersetPartner.exerciseId)}
                    </Text>
                  )}
                  {inSuperset && isPartner && phase === "waiting" && (
                    <Text style={styles.supersetHint}>Superset — finish this leg, then rest</Text>
                  )}
                  {dropIndex > 0 && (
                    <Text style={styles.dropsetHint}>
                      Drop set {dropIndex} of {totalDrops} — reduce weight and go again
                    </Text>
                  )}
                  <Text style={styles.exerciseType}>
                    {setStatusLabel}
                    {inSuperset ? " • Superset" : ""}
                    {totalDrops > 0 ? ` • +${totalDrops} drops/set` : ""}
                    {" • "}Exercise {exerciseIndex + 1} of {exercises.length}
                  </Text>
                  {phase === "waiting" && (
                    <View style={styles.sessionExerciseActions}>
                      <Pressable style={styles.sessionExerciseAction} onPress={() => openWorkoutExercisePicker("add")}>
                        <Text style={styles.sessionExerciseActionText}>+ Add Exercise</Text>
                      </Pressable>
                      <Pressable style={styles.sessionExerciseAction} onPress={() => openWorkoutExercisePicker("swap")}>
                        <Text style={styles.sessionExerciseActionText}>⇄ Swap Exercise</Text>
                      </Pressable>
                    </View>
                  )}
                </View>

                <View style={styles.centerBlock}>
                  <Text style={styles.timer}>
                    {phase === "resting" ? formatTime(restSeconds) : formatTime(seconds)}
                  </Text>
                  {phase === "waiting" && (
                    <Pressable style={styles.primaryButton} onPress={startSet}>
                      <Text style={styles.primaryText}>Start Set</Text>
                    </Pressable>
                  )}
                  {phase === "inSet" && (
                    <Pressable style={styles.primaryButton} onPress={finishSet}>
                      <Text style={styles.primaryText}>Finish Set</Text>
                    </Pressable>
                  )}
                  {phase === "resting" && (
                    <>
                      {restSeconds > 0 ? (
                        <Pressable style={styles.secondaryButton} onPress={skipRest}>
                          <Text style={styles.secondaryText}>Skip Rest</Text>
                        </Pressable>
                      ) : (
                        <Pressable style={styles.secondaryButton} onPress={nextStep}>
                          <Text style={styles.secondaryText}>Continue</Text>
                        </Pressable>
                      )}
                    </>
                  )}
                </View>

                {phase === "logging" && (
                  <View style={styles.logBox}>
                    {hasSubskills && (
                      <View style={styles.subskillSelectionRow}>
                        <Text style={styles.subskillLabel}>Selected variation</Text>
                        <Pressable style={styles.subskillSelector} onPress={() => setIsSubSkillModalVisible(true)}>
                          <Text style={styles.subskillSelectorText}>
                            {selectedSubSkill ? (selectedSubSkill.id === currentExerciseData?.id ? `${selectedSubSkill.name || formatExerciseName(selectedSubSkill.id)} (Main)` : formatExerciseName(selectedSubSkill.id)) : "Choose progression"}
                          </Text>
                        </Pressable>
                        {!selectedSubSkill && (
                          <Text style={styles.subskillHint}>Pick a progression before saving this set.</Text>
                        )}
                      </View>
                    )}

                    <NumericInput placeholder="Load (kg)" value={load} onChangeText={setLoad} style={styles.input} placeholderTextColor={theme.colors.textSecondary} maxLength={4} label="Load" />
                    <NumericInput placeholder={isHold ? "Hold Time (sec)" : "Reps"} value={reps} onChangeText={setReps} style={styles.input} placeholderTextColor={theme.colors.textSecondary} maxLength={3} label={isHold ? "Hold" : "Reps"} />
                    {!isHold && <NumericInput placeholder="RIR" value={rir} onChangeText={setRir} style={styles.input} placeholderTextColor={theme.colors.textSecondary} maxLength={2} label="RIR" />}
                    <NumericInput placeholder="RPE" value={rpe} onChangeText={setRpe} style={styles.input} placeholderTextColor={theme.colors.textSecondary} maxLength={2} label="RPE" />
                    <Pressable
                      style={[styles.primaryButton, hasSubskills && !selectedSubSkill && styles.primaryButtonDisabled]}
                      onPress={submitLog}
                      disabled={hasSubskills && !selectedSubSkill}
                    >
                      <Text style={styles.primaryText}>Save Set</Text>
                    </Pressable>
                  </View>
                )}

                {/* LIVE INTERACTIVE SESSION QUEUE SYSTEM */}
                <View style={styles.logFeed}>
                  <Text style={styles.logTitle}>
                    {phase === "inSet" || phase === "logging" || currentExerciseHasLogs
                      ? "(Locked — finish current exercise or superset pair)"
                      : "(Tap a standalone exercise or superset pair to switch)"}
                  </Text>
                  {exerciseGroups.map((group, groupIdx) => {
                    if (group.type === "single") {
                      const ex = group.exercise;
                      const idx = group.index;
                      const isCurrent = ex.instanceId === activeExerciseInstanceId;
                      const isCompleted = completedInstanceIds.includes(ex.instanceId);
                      const exDrops = getDropsetCount(ex);
                      const isSwitchDisabled =
                        isCompleted ||
                        phase === "finished" ||
                        phase === "inSet" ||
                        phase === "logging" ||
                        currentExerciseHasLogs;

                      return (
                        <Pressable
                          key={ex.instanceId || `${ex.exerciseId}-${idx}`}
                          disabled={isSwitchDisabled}
                          onPress={() => switchTargetActiveExerciseDirectly(ex.instanceId)}
                          style={[
                            styles.cardOrderingContainer,
                            isCurrent && styles.activeExerciseCard,
                            isCompleted && styles.completedExerciseRow,
                            !isCurrent && isSwitchDisabled && !isCompleted && { opacity: 0.5 },
                          ]}
                        >
                          <View style={styles.cardOrderingSidebar}>
                            <Pressable
                              disabled={exercises.length <= 1}
                              style={[styles.sidebarTrashBtn, exercises.length <= 1 && styles.disabledArrow]}
                              onPress={() => removeActiveExercise(idx)}
                            >
                              <Text style={styles.sidebarTrashText}>X</Text>
                            </Pressable>
                          </View>

                          <View style={[styles.splitEditorRoutineCardContainer, isCurrent && styles.activeExerciseCardInner]}>
                            <View style={styles.splitRoutineCardHeader}>
                              <Text
                                style={[
                                  styles.splitRoutineNameText,
                                  isCurrent && styles.activeExerciseName,
                                  isCompleted && styles.completedExerciseName,
                                ]}
                              >
                                {formatExerciseName(ex.exerciseId)}
                                {isCurrent ? " (Active)" : isCompleted ? " (Done)" : ""}
                              </Text>
                              <Text style={styles.splitRoutineDurationText}>
                                {ex.targetSets ?? 1} sets{exDrops > 0 ? ` + ${exDrops} drops` : ""}
                              </Text>
                            </View>
                            <Text style={styles.logSub}>
                              Target:{" "}
                              {ex.targetReps
                                ? `${ex.targetReps} reps`
                                : ex.targetHoldSeconds
                                ? `${ex.targetHoldSeconds}s hold`
                                : ""}
                              {isCurrent && ` • ${setStatusLabel}`}
                            </Text>
                          </View>
                        </Pressable>
                      );
                    }

                    const { primary, partner, primaryIndex, partnerIndex } = group;
                    const isGroupActive = isSupersetGroupActive(primary, partner, activeExerciseInstanceId);
                    const isGroupComplete = isSupersetGroupComplete(primary, partner, completedInstanceIds);
                    const primaryActive = activeExerciseInstanceId === primary.instanceId;
                    const partnerActive = activeExerciseInstanceId === partner.instanceId;
                    const primaryDrops = getDropsetCount(primary);
                    const partnerDrops = getDropsetCount(partner);

                    const isSwitchDisabled =
                      isGroupComplete ||
                      phase === "finished" ||
                      phase === "inSet" ||
                      phase === "logging" ||
                      currentExerciseHasLogs;

                    return (
                      <View
                        key={`superset-${primary.instanceId}-${partner.instanceId}`}
                        style={[
                          styles.cardOrderingContainer,
                          isGroupActive && styles.activeExerciseCard,
                          isGroupComplete && styles.completedExerciseRow,
                          !isGroupActive && isSwitchDisabled && !isGroupComplete && { opacity: 0.5 }
                        ]}
                      >
                        <View style={styles.supersetDeleteColumn}>
                          <Pressable
                            disabled={exercises.length <= 1}
                            style={[styles.sidebarTrashBtn, exercises.length <= 1 && styles.disabledArrow]}
                            onPress={() => removeActiveExercise(primaryIndex)}
                          >
                            <Text style={styles.sidebarTrashText}>X</Text>
                          </Pressable>
                          <Pressable
                            disabled={exercises.length <= 1}
                            style={[styles.sidebarTrashBtn, exercises.length <= 1 && styles.disabledArrow]}
                            onPress={() => removeActiveExercise(partnerIndex)}
                          >
                            <Text style={styles.sidebarTrashText}>X</Text>
                          </Pressable>
                        </View>

                        <Pressable
                          disabled={isSwitchDisabled || isGroupActive}
                          onPress={() => switchTargetActiveExerciseDirectly(primary.instanceId)}
                          style={({ pressed }) => [
                            styles.supersetDuoCard,
                            isGroupActive && styles.supersetDuoCardActive,
                            pressed && { opacity: 0.85 }
                          ]}
                        >
                          <Text style={styles.supersetDuoLabel}>Superset pair — complete both each round</Text>

                          <View style={[styles.supersetDuoRow, primaryActive && styles.supersetDuoRowActive]}>
                            <Text
                              style={[
                                styles.splitRoutineNameText,
                                primaryActive && styles.activeExerciseName,
                                completedInstanceIds.includes(primary.instanceId) && styles.completedExerciseName,
                              ]}
                            >
                              A. {formatExerciseName(primary.exerciseId)}
                              {primaryActive ? " (Active)" : completedInstanceIds.includes(primary.instanceId) ? " (Done)" : ""}
                            </Text>
                            <Text style={styles.splitRoutineDurationText}>
                              {primary.targetSets ?? 1} sets{primaryDrops > 0 ? ` + ${primaryDrops} drops` : ""}
                            </Text>
                            {primaryActive && (
                              <Text style={styles.logSub}>
                                {setStatusLabel}
                                {primary.targetReps
                                  ? ` • ${primary.targetReps} reps`
                                  : primary.targetHoldSeconds
                                  ? ` • ${primary.targetHoldSeconds}s hold`
                                  : ""}
                              </Text>
                            )}
                          </View>

                          <View style={styles.supersetDuoDivider} />

                          <View style={[styles.supersetDuoRow, partnerActive && styles.supersetDuoRowActive]}>
                            <Text
                              style={[
                                styles.splitRoutineNameText,
                                partnerActive && styles.activeExerciseName,
                                completedInstanceIds.includes(partner.instanceId) && styles.completedExerciseName,
                              ]}
                            >
                              B. {formatExerciseName(partner.exerciseId)}
                              {partnerActive ? " (Active)" : completedInstanceIds.includes(partner.instanceId) ? " (Done)" : ""}
                            </Text>
                            <Text style={styles.splitRoutineDurationText}>
                              {partner.targetSets ?? 1} sets{partnerDrops > 0 ? ` + ${partnerDrops} drops` : ""}
                            </Text>
                            {partnerActive && (
                              <Text style={styles.logSub}>
                                {setStatusLabel}
                                {partner.targetReps
                                  ? ` • ${partner.targetReps} reps`
                                  : partner.targetHoldSeconds
                                  ? ` • ${partner.targetHoldSeconds}s hold`
                                  : ""}
                              </Text>
                            )}
                          </View>
                        </Pressable>
                      </View>
                    );
                  })}
                </View>

                <View style={styles.dangerButtonContainer}>
                  <Pressable style={styles.dangerButton} onPress={handleEndWorkoutEarly}>
                    <Text style={styles.dangerText}>
                      {setLog.length === 0 ? "Discard Workout" : "End Workout Early"}
                    </Text>
                  </Pressable>
                </View>
              </>
            )}

            {setLog.length > 0 && phase !== "finished" && (
              <View style={styles.logFeed}>
                <Text style={styles.logTitle}>Set History</Text>
                {setLog.map((item, i) => (
                  <View key={i} style={styles.logItem}>
                    <Text style={styles.logMain}>{item.exercise} — Set {item.set}</Text>
                    <Text style={styles.logSub}>
                      {item.load ? `${item.load} kg` : "0 kg"} • {item.reps || "-"} {isHold ? "s" : "reps"} • RPE {item.rpe || "-"}
                      {item.rir !== null && item.rir !== "" ? ` • RIR ${item.rir}` : ""}
                    </Text>
                    <Text style={styles.logSub}>Time: {formatTime(item.time)}</Text>
                  </View>
                ))}
              </View>
            )}
          </>
        )}
      </ScrollView>
    </Screen>
  );
}

const styles = StyleSheet.create({
  content: { paddingHorizontal: theme.spacing.lg, paddingTop: theme.spacing.xl, paddingBottom: theme.spacing.xl, gap: theme.spacing.lg },
  header: { gap: theme.spacing.sm },
  headerRow: { flexDirection: "row", justifyContent: "space-between", alignItems: "center", width: "100%" },
  textInlineLink: { padding: 4 },
  inlineLinkStyle: { color: theme.colors.accent, fontWeight: "600", fontSize: 16 },
  title: { ...theme.typography.title, color: theme.colors.textPrimary },
  subtitleLeft: { color: theme.colors.textSecondary, fontSize: 14, textAlign: "left" },
  actionContainer: { gap: theme.spacing.md, width: "100%", marginBottom: 4 },
  headerBox: { alignItems: "center", width: "100%" },
  trackingHeaderMeta: { flexDirection: "row", justifyContent: "space-between", alignItems: "center", width: "100%", marginBottom: 8 },
  exerciseName: { fontSize: 26, fontWeight: "800", color: theme.colors.textPrimary, textAlign: "center" },
  exerciseType: { color: theme.colors.textSecondary, marginTop: 4, textAlign: "center" },
  sessionExerciseActions: { flexDirection: "row", gap: 8, marginTop: 12 },
  sessionExerciseAction: { borderWidth: 1, borderColor: theme.colors.border, borderRadius: 10, paddingHorizontal: 10, paddingVertical: 7, backgroundColor: theme.colors.surface },
  sessionExerciseActionText: { color: theme.colors.accent, fontSize: 12, fontWeight: "700" },
  supersetHint: { color: theme.colors.accent, fontSize: 13, fontWeight: "600", marginTop: 4, textAlign: "center" },
  dropsetHint: { color: "#f57c00", fontSize: 13, fontWeight: "600", marginTop: 4, textAlign: "center" },
  centerBlock: { alignItems: "center", gap: theme.spacing.lg, width: "100%" },
  timer: { fontSize: 52, fontWeight: "800", color: theme.colors.textPrimary },
  logBox: { gap: 10, width: "100%" },
  input: { padding: 10, borderRadius: 8, backgroundColor: theme.colors.surface, borderWidth: 1, borderColor: theme.colors.border, color: theme.colors.textPrimary },
  logFeed: { marginTop: 20, gap: 10, width: "100%" },
  logTitle: { fontSize: 16, fontWeight: "600", color: theme.colors.textPrimary },
  logItem: { padding: 10, borderRadius: 10, backgroundColor: theme.colors.surface, borderWidth: 1, borderColor: theme.colors.border },
  logMain: { color: theme.colors.textPrimary, fontWeight: "600" },
  logSub: { color: theme.colors.textSecondary, fontSize: 12 },
  primaryButton: { backgroundColor: theme.colors.accent, padding: 16, borderRadius: 12, width: "100%", alignItems: "center" },
  primaryText: { color: "#fff", fontWeight: "600" },
  secondaryButton: { padding: 14, borderRadius: 10, backgroundColor: theme.colors.surface, borderWidth: 1, borderColor: theme.colors.border, width: "100%", alignItems: "center" },
  secondaryText: { color: theme.colors.textPrimary },
  dangerButtonContainer: { width: "100%", marginTop: 10, alignItems: "center" },
  dangerButton: { paddingVertical: 14, paddingHorizontal: 20, alignItems: "center", justifyContent: "center", width: "100%" },
  dangerText: { color: "#ff4444", fontWeight: "700", fontSize: 15 },
  modalOverlay: { flex: 1, backgroundColor: "rgba(0, 0, 0, 0.4)", justifyContent: "center", alignItems: "center", padding: 24 },
  modalContent: { backgroundColor: theme.colors.surface || "#ffffff", padding: 24, borderRadius: 16, width: "100%", maxWidth: 340, gap: 16, borderWidth: 1, borderColor: theme.colors.border || "#e0e0e0", elevation: 5 },
  modalTitle: { fontSize: 18, fontWeight: "700", color: theme.colors.textPrimary || "#000", textAlign: "center" },
  modalBody: { fontSize: 14, color: theme.colors.textSecondary || "#666", textAlign: "center", lineHeight: 20 },
  modalVerticalButtons: { width: "100%", gap: 10 },
  modalActionRowButton: { padding: 14, borderRadius: 10, alignItems: "center", justifyContent: "center", width: "100%" },
  modalActionRowText: { color: "#fff", fontWeight: "700", fontSize: 14 },
  modalCancelButton: { backgroundColor: "transparent", borderWidth: 1, borderColor: theme.colors.border || "#ccc" },
  modalCancelText: { color: theme.colors.textPrimary || "#333", fontWeight: "600" },
  subskillModalOverlay: { flex: 1, backgroundColor: "rgba(0, 0, 0, 0.4)", justifyContent: "center", alignItems: "center", padding: 24 },
  subskillModalContent: { backgroundColor: theme.colors.surface || "#ffffff", padding: 24, borderRadius: 16, width: "100%", maxWidth: 340, gap: 16, borderWidth: 1, borderColor: theme.colors.border || "#e0e0e0", elevation: 5 },
  subskillList: { maxHeight: 240 },
  subskillOption: { padding: 14, borderRadius: 12, backgroundColor: theme.colors.surface, borderWidth: 1, borderColor: theme.colors.border, alignItems: "center" },
  subskillOptionSelected: { backgroundColor: "rgba(0, 122, 255, 0.12)", borderColor: theme.colors.accent },
  subskillText: { color: theme.colors.textPrimary, fontWeight: "600" },
  subskillTextSelected: { color: theme.colors.accent },
  subskillSelectionRow: { gap: 8, marginBottom: 10 },
  subskillLabel: { color: theme.colors.textSecondary, fontSize: 13, fontWeight: "600" },
  subskillSelector: { padding: 14, borderRadius: 12, backgroundColor: theme.colors.surface, borderWidth: 1, borderColor: theme.colors.border },
  subskillSelectorText: { color: theme.colors.textPrimary },
  subskillHint: { color: "#f57c00", fontSize: 12 },
  primaryButtonDisabled: { backgroundColor: "rgba(0,0,0,0.14)" },
  topCornerTimer: { fontSize: 13, fontWeight: "600", color: theme.colors.textSecondary, opacity: 0.8 },
  emptyText: { color: theme.colors.textSecondary, textAlign: "center", marginTop: 20, fontSize: 14 },
  celebrationContainer: { flex: 1, backgroundColor: 'rgba(12, 14, 23, 0.45)', justifyContent: 'center', alignItems: 'center', padding: 24 },
  celebrationRow: { flexDirection: 'row', gap: 14, justifyContent: 'center', flexWrap: 'wrap' },
  celebrationCardWrapper: { minWidth: 280, maxWidth: 340 },
  completedRoutineCrossed: { opacity: 0.4, position: "relative" },
  checkmarkBadge: { position: "absolute", top: 12, right: 12, backgroundColor: "#2e7d32", paddingVertical: 4, paddingHorizontal: 8, borderRadius: 6 },
  checkmarkBadgeText: { color: "#ffffff", fontSize: 11, fontWeight: "700" },
  pauseBadgeLink: { paddingVertical: 4, paddingHorizontal: 8, borderRadius: 6, backgroundColor: "rgba(0,0,0,0.04)" },
  pauseBadgeText: { fontSize: 13, fontWeight: "600", color: theme.colors.textPrimary },

  startInlineButton: { backgroundColor: theme.colors.accent, paddingVertical: 8, paddingHorizontal: 12, borderRadius: 8, alignSelf: "flex-start", marginTop: 8 },
  startInlineButtonText: { color: "#ffffff", fontWeight: "600", fontSize: 13 },

  emptySplitBox: { padding: 20, backgroundColor: theme.colors.surface, borderRadius: 16, borderStyle: "dashed", borderWidth: 2, borderColor: theme.colors.border, width: "100%", gap: theme.spacing.md },
  splitPromptText: { color: theme.colors.textSecondary, fontSize: 14, lineHeight: 22 },
  sectionSubtitle: { fontSize: 14, fontWeight: "600", color: theme.colors.textSecondary, marginBottom: 6 },
  todayBlock: { gap: 12, width: "100%" },
  restDayBox: { padding: 24, borderRadius: 16, backgroundColor: theme.colors.surface, alignItems: "center", justifyContent: "center", gap: 10, borderWidth: 1, borderColor: theme.colors.border },
  restDayTitle: { fontSize: 18, fontWeight: "700", color: theme.colors.textPrimary },
  restDaySubtitle: { fontSize: 14, color: theme.colors.textSecondary, textAlign: "center", marginBottom: 10 },
  
  streakCornerRow: { flexDirection: "row", alignItems: "center", justifyContent: "flex-end", gap: 10, width: "100%" },
  streakCorner: { flexDirection: "row", alignItems: "center", gap: 4 },
  streakFlame: { fontSize: 20 },
  streakFlameIdle: { opacity: 0.3 },
  streakValue: { fontSize: 16, fontWeight: "700", color: theme.colors.textMuted },
  streakValueActive: { color: theme.colors.warning },
  deloadButton: { paddingVertical: 8, paddingHorizontal: 14, borderRadius: 8, borderWidth: 1, borderColor: theme.colors.border, backgroundColor: theme.colors.surfaceRaised },
  deloadButtonActive: { borderColor: theme.colors.warning, backgroundColor: theme.colors.warningSoft },
  deloadButtonText: { fontSize: 13, fontWeight: "600", color: theme.colors.textSecondary },
  deloadButtonTextActive: { color: theme.colors.warning },

  pausedWorkoutsBlock: { backgroundColor: "rgba(0,0,0,0.02)", padding: 14, borderRadius: 16, borderWidth: 1, borderColor: theme.colors.border, gap: 10, marginTop: 4 },
  pausedBlockTitle: { fontSize: 14, fontWeight: "700", color: theme.colors.textPrimary },
  pausedWorkoutCardRow: { flexDirection: "row", justifyContent: "space-between", alignItems: "center", backgroundColor: theme.colors.surface, padding: 12, borderRadius: 12, borderWidth: 1, borderColor: theme.colors.border },
  pausedWorkoutCardName: { fontSize: 14, fontWeight: "700", color: theme.colors.textPrimary },
  pausedWorkoutCardMeta: { fontSize: 12, color: theme.colors.textSecondary, marginTop: 2 },
  pausedWorkoutCardActions: { flexDirection: "row", gap: 6 },
  linedUpPausedActions: { flexDirection: "row", flexWrap: "wrap", gap: 6, marginTop: 8 },
  resumeMiniBtn: { backgroundColor: theme.colors.accent, paddingVertical: 6, paddingHorizontal: 10, borderRadius: 6 },
  resumeMiniText: { color: "#ffffff", fontSize: 12, fontWeight: "600" },
  deleteMiniBtn: { backgroundColor: "rgba(255,68,68,0.08)", paddingVertical: 6, paddingHorizontal: 10, borderRadius: 6 },
  deleteMiniText: { color: theme.colors.textSecondary, fontSize: 12, fontWeight: "600" },

  progressBadgeInline: { position: "absolute", top: 12, right: 12, backgroundColor: "#f57c00", paddingVertical: 4, paddingHorizontal: 8, borderRadius: 6 },
  progressBadgeInlineText: { color: "#ffffff", fontSize: 11, fontWeight: "700" },

  inlineSplitHeaderContainer: { flexDirection: "row", alignItems: "center", gap: 8, flexWrap: "wrap", marginTop: 2 },
  splitPickerRowActions: { flexDirection: "row", alignItems: "center", gap: 8 },
  splitDeleteButton: { width: 28, height: 28, borderRadius: 8, alignItems: "center", justifyContent: "center", backgroundColor: "rgba(255,68,68,0.08)", borderWidth: 1, borderColor: "rgba(255,68,68,0.18)" },
  splitDeleteButtonText: { color: "#ff4444", fontSize: 22, lineHeight: 24, fontWeight: "500" },
  splitMiniActionInline: { paddingVertical: 6, paddingHorizontal: 10, borderRadius: 10, backgroundColor: theme.colors.surface, borderWidth: 1, borderColor: theme.colors.border, minWidth: 70, alignItems: "center", justifyContent: "center" },
  splitMiniActionTextInline: { color: theme.colors.accent, fontSize: 12, fontWeight: "700" },

  differentRoutineSecondaryButton: { padding: 12, borderRadius: 10, backgroundColor: theme.colors.surface, borderWidth: 1, borderColor: theme.colors.border, width: "100%", alignItems: "center", marginTop: 4 },
  differentRoutineSecondaryText: { color: theme.colors.textSecondary, fontSize: 14, fontWeight: "600" },

  splitNameInput: { padding: 12, borderRadius: 8, backgroundColor: theme.colors.surface, borderWidth: 1, borderColor: theme.colors.border, color: theme.colors.textPrimary, fontSize: 16, fontWeight: "600", marginTop: 4 },
  splitEditorOptionsRow: { width: "100%", marginBottom: 12 },
  splitLengthOption: { gap: 8, width: 120 },
  splitOptionLabel: { color: theme.colors.textSecondary, fontSize: 13, fontWeight: "600" },
  splitLengthInput: { padding: 10, borderRadius: 8, backgroundColor: theme.colors.surface, borderWidth: 1, borderColor: theme.colors.border, color: theme.colors.textPrimary },
  splitEditingContainer: { gap: 16, width: "100%" },
  splitDayConfigCard: { padding: 14, backgroundColor: "rgba(0,0,0,0.01)", borderRadius: 16, borderWidth: 1, borderColor: theme.colors.border, gap: 12 },
  splitDayConfigHeader: { flexDirection: "row", justifyContent: "space-between", alignItems: "center" },
  splitDayNameLabel: { fontSize: 18, fontWeight: "800", color: theme.colors.textPrimary },
  addRoutineIconButton: { paddingVertical: 8, paddingHorizontal: 12, borderRadius: 10, backgroundColor: theme.colors.surface, borderWidth: 1, borderColor: theme.colors.border },
  addRoutineIconButtonText: { fontSize: 13, fontWeight: "700", color: theme.colors.accent },
  splitDayRoutinesList: { gap: 12 },
  restDayPlaceholderBox: { padding: 16, backgroundColor: theme.colors.surface, borderRadius: 12, borderStyle: "dashed", borderWidth: 1, borderColor: theme.colors.border, alignItems: "center" },
  restDayLabelText: { fontSize: 14, color: theme.colors.textSecondary, fontStyle: "italic", opacity: 0.8 },
  
  splitEditorRoutineCardContainer: { flex: 1, backgroundColor: theme.colors.surface, padding: 16, borderRadius: 12, borderWidth: 1, borderColor: theme.colors.border, gap: 10 },
  splitRoutineCardHeader: { flexDirection: "row", justifyContent: "space-between", alignItems: "center" },
  splitRoutineNameText: { fontSize: 16, fontWeight: "700", color: theme.colors.textPrimary },
  splitRoutineDurationText: { fontSize: 12, color: theme.colors.textSecondary },
  splitRoutineExercisesInlineBox: { gap: 6, backgroundColor: "rgba(0,0,0,0.02)", padding: 10, borderRadius: 8 },
  splitRoutineExerciseLineItem: { fontSize: 14, color: theme.colors.textPrimary, fontWeight: "500" },
  noExercisesText: { fontSize: 13, color: theme.colors.textSecondary, fontStyle: "italic" },

  cardOrderingContainer: { flexDirection: "row", alignItems: "stretch", gap: 8 },
  cardOrderingSidebar: { width: 34, justifyContent: "center", alignItems: "center", backgroundColor: theme.colors.surface, borderRadius: 12, borderWidth: 1, borderColor: theme.colors.border, paddingVertical: 8 },
  disabledArrow: { opacity: 0.15 },
  sidebarTrashBtn: { width: 26, height: 26, borderRadius: 6, alignItems: "center", justifyContent: "center", backgroundColor: "rgba(255,68,68,0.08)" },
  sidebarTrashText: { fontSize: 11, color: "#ff4444", fontWeight: "800" },
  
  searchModalOverlay: { flex: 1, backgroundColor: "rgba(0,0,0,0.6)", justifyContent: "flex-end" },
  searchModalContent: { backgroundColor: theme.colors.surface, borderTopLeftRadius: 24, borderTopRightRadius: 24, padding: 20, maxHeight: "80%", minHeight: "50%" },
  searchModalTitle: { fontSize: 20, fontWeight: "800", color: theme.colors.textPrimary, marginBottom: 14 },
  searchBarInput: { padding: 14, borderRadius: 12, backgroundColor: "rgba(0,0,0,0.03)", borderWidth: 1, borderColor: theme.colors.border, color: theme.colors.textPrimary, marginBottom: 14, fontSize: 15 },
  searchResultList: { flex: 1 },
  // Kept in lockstep with the routine builder's exercise search UI.
  routineSearchInput: { padding: 10, borderRadius: 8, backgroundColor: theme.colors.background || "#111", borderWidth: 1, borderColor: theme.colors.border, color: theme.colors.textPrimary, fontSize: 14 },
  routineFilterContainer: { marginHorizontal: -4, marginBottom: -4 },
  routineFilterScroll: { flexDirection: "row", alignItems: "center", gap: 6, paddingHorizontal: 4 },
  routineChip: { paddingHorizontal: 12, paddingVertical: 6, borderRadius: 20, backgroundColor: theme.colors.background || "#111", borderWidth: 1, borderColor: theme.colors.border },
  routineChipActive: { backgroundColor: theme.colors.accent, borderColor: theme.colors.accent },
  routineChipText: { fontSize: 12, color: theme.colors.textSecondary, textTransform: "capitalize" },
  routineChipTextActive: { color: "#fff", fontWeight: "600" },
  routineFilterDivider: { width: 1, height: 16, backgroundColor: theme.colors.border, marginHorizontal: 4 },
  routineExerciseSelectorList: { maxHeight: 200, borderWidth: 1, borderColor: theme.colors.border, borderRadius: 8, backgroundColor: theme.colors.background || "#111" },
  routineSelectorRow: { flexDirection: "row", alignItems: "center", padding: 12, borderBottomWidth: 1, borderBottomColor: theme.colors.border },
  routineSelectorTextContainer: { flex: 1, gap: 2 },
  routineSelectorText: { color: theme.colors.textPrimary },
  routineSelectorSubtext: { fontSize: 11, color: theme.colors.textSecondary, textTransform: "capitalize" },
  routineExerciseNameRow: { flexDirection: "row", alignItems: "center", gap: 8, flexWrap: "wrap" },
  routineProgressionBadge: { backgroundColor: "rgba(0, 122, 255, 0.15)", paddingHorizontal: 8, paddingVertical: 2, borderRadius: 4 },
  routineProgressionBadgeText: { fontSize: 10, color: theme.colors.accent, fontWeight: "600", textTransform: "uppercase", letterSpacing: 0.5 },
  routineProgressionHint: { fontSize: 10, color: theme.colors.textSecondary, marginTop: 2, fontStyle: "italic" },
  routinePickerAction: { color: theme.colors.accent, fontWeight: "700", fontSize: 18 },
  routineEmptySearchContainer: { padding: 24, alignItems: "center" },
  routineEmptySearchText: { color: theme.colors.textSecondary, fontSize: 14, textAlign: "center" },
  sessionConfigPanel: { gap: 14, paddingVertical: 8, flex: 1 },
  sessionConfigTitle: { fontSize: 18, fontWeight: "800", color: theme.colors.textPrimary },
  sessionConfigHint: { fontSize: 12, color: theme.colors.textSecondary, lineHeight: 17 },
  sessionConfigRow: { flexDirection: "row", gap: 12 },
  sessionConfigField: { flex: 1, gap: 6 },
  sessionConfigLabel: { fontSize: 13, fontWeight: "700", color: theme.colors.textPrimary },
  sessionConfigInput: { minHeight: 42 },
  sessionToggleRow: { flexDirection: "row", alignItems: "center", justifyContent: "space-between", gap: 12, paddingVertical: 10, borderTopWidth: 1, borderTopColor: theme.colors.border },
  exerciseFilterRow: { gap: 8, paddingVertical: 8 },
  exerciseFilterChip: { borderWidth: 1, borderColor: theme.colors.border, borderRadius: 14, paddingHorizontal: 10, paddingVertical: 6 },
  exerciseFilterChipActive: { backgroundColor: "rgba(0,122,255,0.12)", borderColor: theme.colors.accent },
  exerciseFilterText: { color: theme.colors.textSecondary, fontSize: 12, fontWeight: "600" },
  searchResultRow: { flexDirection: "row", justifyContent: "space-between", alignItems: "center", padding: 14, backgroundColor: "rgba(0,0,0,0.01)", borderRadius: 12, borderWidth: 1, borderColor: theme.colors.border },
  searchResultText: { fontSize: 15, fontWeight: "700", color: theme.colors.textPrimary },
  searchResultSubtitle: { fontSize: 12, color: theme.colors.textSecondary, marginTop: 2 },
  searchResultCount: { fontSize: 12, fontWeight: "700", color: theme.colors.accent, backgroundColor: "rgba(0,0,0,0.04)", paddingVertical: 4, paddingHorizontal: 8, borderRadius: 6 },
  
  completedExerciseRow: { opacity: 0.35, backgroundColor: "rgba(0, 0, 0, 0.02)" },
  activeExerciseCard: { borderColor: theme.colors.accent, borderWidth: 2, borderRadius: 12 },
  activeExerciseCardInner: { backgroundColor: "rgba(0,0,0,0.02)" },
  activeExerciseName: { color: theme.colors.accent, fontWeight: "800" },
  completedExerciseName: { textDecorationLine: "line-through", color: theme.colors.textSecondary },
  supersetDuoCard: {
    flex: 1,
    borderWidth: 1,
    borderColor: theme.colors.border,
    borderRadius: 12,
    padding: 12,
    gap: 8,
    backgroundColor: theme.colors.surface,
  },
  supersetDuoCardActive: { borderColor: theme.colors.accent, borderWidth: 2 },
  supersetDuoLabel: {
    fontSize: 12,
    fontWeight: "700",
    color: theme.colors.accent,
    textTransform: "uppercase",
    letterSpacing: 0.4,
  },
  supersetDuoRow: { gap: 2, paddingVertical: 4, paddingHorizontal: 6, borderRadius: 8 },
  supersetDuoRowActive: { backgroundColor: "rgba(0,0,0,0.04)" },
  supersetDuoDivider: { height: 1, backgroundColor: theme.colors.border, marginVertical: 2 },
  supersetDeleteColumn: { justifyContent: "space-around", alignItems: "center", paddingVertical: 4, gap: 8 },
  sessionConfigLockedInput: { justifyContent: "center", paddingHorizontal: 10, borderRadius: 8, backgroundColor: "rgba(0,0,0,0.04)", borderWidth: 1, borderColor: theme.colors.border },
  sessionConfigLockedText: { color: theme.colors.textSecondary, fontSize: 15, fontWeight: "700" },

  /* POST-WORKOUT SCREEN UPDATE: 6 METRICS GRID & RPE TIMELINE GRAPH */
  summaryContainer: { alignItems: "center", paddingVertical: 12, width: "100%" },
  summaryEmoji: { fontSize: 44, textAlign: "center", marginBottom: 6 },
  summaryTitle: { fontSize: 24, fontWeight: "800", color: theme.colors.textPrimary, textAlign: "center" },
  summarySubtitle: { fontSize: 14, color: theme.colors.textSecondary, textAlign: "center", marginTop: 4, marginBottom: 20, paddingHorizontal: 10, lineHeight: 20 },
  metricsGrid: { flexDirection: "row", flexWrap: "wrap", width: "100%", gap: 12, marginBottom: 14 },
  metricCard: { flex: 1, minWidth: "45%", backgroundColor: theme.colors.surface, padding: 14, borderRadius: 14, borderWidth: 1, borderColor: theme.colors.border, alignItems: "center", justifyContent: "center" },
  metricCardLabel: { fontSize: 12, fontWeight: "600", color: theme.colors.textSecondary, textTransform: "uppercase", letterSpacing: 0.5, marginBottom: 4 },
  metricCardValue: { fontSize: 18, fontWeight: "800", color: theme.colors.textPrimary },
  comparisonCard: { width: "100%", backgroundColor: theme.colors.surface, padding: 14, borderRadius: 14, borderWidth: 1, borderColor: theme.colors.border, marginBottom: 16 },
  comparisonTitle: { fontSize: 14, fontWeight: "700", color: theme.colors.textPrimary, marginBottom: 6 },
  comparisonText: { fontSize: 12, color: theme.colors.textSecondary, lineHeight: 18 },
  breakdownHeading: { fontSize: 15, fontWeight: "700", color: theme.colors.textPrimary, width: "100%", textAlign: "left", marginBottom: 8, paddingLeft: 2 },
  
  graphContainer: { width: "100%", backgroundColor: theme.colors.surface, padding: 16, borderRadius: 16, borderWidth: 1, borderColor: theme.colors.border, marginBottom: 20 },
  graphScroll: { alignItems: "flex-end", gap: 12, paddingTop: 16, paddingBottom: 4 },
  graphBarWrapper: { alignItems: "center", gap: 6, width: 40 },
  graphBar: { width: 18, borderRadius: 4 },
  graphBarValue: { fontSize: 11, fontWeight: "700", color: theme.colors.textPrimary },
  graphBarLabel: { fontSize: 10, color: theme.colors.textSecondary },
  toggleContainer: {
  flexDirection: "row",
  alignItems: "center",
  justifyContent: "space-between",
  paddingVertical: 4,
},
toggleLabel: {
  fontSize: 14,
  color: theme.colors.textSecondary,
},
  /* NEW STYLE ADDITIONS: ADVANCED SPLIT METRICS */
  metricsContainer: {
    backgroundColor: theme.colors.surface,
    padding: 16,
    borderRadius: 16,
    borderWidth: 1,
    borderColor: theme.colors.border,
    marginTop: 20,
    marginBottom: 20,
  },
  sectionHeader: {
    fontSize: 16,
    fontWeight: "800",
    color: theme.colors.textPrimary,
    marginBottom: 12,
  },
  subHeader: {
    fontSize: 11,
    fontWeight: "700",
    color: theme.colors.textSecondary,
    textTransform: "uppercase",
    letterSpacing: 0.5,
    marginTop: 10,
    marginBottom: 8,
  },
  metricsGridInline: {
    flexDirection: "row",
    flexWrap: "wrap",
    gap: 8,
    marginBottom: 14,
  },
  metricCardInline: {
    backgroundColor: "rgba(255, 255, 255, 0.03)",
    borderWidth: 1,
    borderColor: theme.colors.border,
    borderRadius: 8,
    paddingVertical: 6,
    paddingHorizontal: 10,
    alignItems: "center",
    justifyContent: "center",
    minWidth: "28%",
    flexGrow: 1,
  },
  metricLabel: {
    fontSize: 11,
    color: theme.colors.textSecondary,
    textTransform: "capitalize",
  },
  metricValue: {
    fontSize: 14,
    fontWeight: "700",
    color: theme.colors.textPrimary,
    marginTop: 2,
  },
  noDataText: {
    fontSize: 12,
    color: theme.colors.textSecondary,
    fontStyle: "italic",
  },
  warningBox: {
    backgroundColor: "rgba(255, 69, 58, 0.05)",
    borderColor: "rgba(255, 69, 58, 0.2)",
    borderWidth: 1,
    borderRadius: 8,
    padding: 12,
  },
  warningRow: {
    flexDirection: "row",
    alignItems: "flex-start",
    marginBottom: 8,
  },
  warningBullet: {
    color: "#FF453A",
    fontWeight: "900",
    marginRight: 6,
    fontSize: 14,
  },
  warningText: {
    color: theme.colors.textPrimary,
    fontSize: 12,
    lineHeight: 18,
    flex: 1,
  },
  optimalText: {
    color: "#30D158",
    fontSize: 12,
    fontWeight: "600",
  },
  insightsToggleRow: {
    flexDirection: "row",
    justifyContent: "space-between",
    alignItems: "center",
    marginTop: 12,
    marginBottom: 4,
  },
  insightsToggleLabel: {
    fontSize: 13,
    fontWeight: "700",
    color: theme.colors.textPrimary,
  },
  insightsToggleSwitch: {
    width: 44,
    height: 26,
    borderRadius: 13,
    backgroundColor: theme.colors.border,
    padding: 3,
    justifyContent: "center",
  },
  insightsToggleSwitchActive: {
    backgroundColor: theme.colors.accent,
  },
  insightsToggleKnob: {
    width: 20,
    height: 20,
    borderRadius: 10,
    backgroundColor: "#ffffff",
    elevation: 2,
    shadowColor: "#000",
    shadowOffset: { width: 0, height: 1 },
    shadowOpacity: 0.3,
    shadowRadius: 1,
  },
  scoreRow: {
    flexDirection: "row",
    justifyContent: "space-between",
    alignItems: "center",
    paddingVertical: 10,
    paddingHorizontal: 14,
    backgroundColor: "rgba(255,255,255,0.03)",
    borderRadius: 8,
    borderWidth: 1,
    borderColor: theme.colors.border,
    marginTop: 8,
    marginBottom: 8,
  },
  scoreLabel: {
    fontSize: 13,
    fontWeight: "700",
    color: theme.colors.textPrimary,
  },
  scoreValue: {
    fontSize: 22,
    fontWeight: "800",
    color: theme.colors.textPrimary,
  },
  frequencyBox: {
    backgroundColor: "rgba(255, 165, 0, 0.05)",
    borderColor: "rgba(255, 165, 0, 0.2)",
    borderWidth: 1,
    borderRadius: 8,
    padding: 12,
    marginTop: 8,
  },
  frequencyRow: {
    flexDirection: "row",
    alignItems: "flex-start",
    marginBottom: 6,
  },
  frequencyBullet: {
    color: "#FF9500",
    fontWeight: "900",
    marginRight: 6,
    fontSize: 14,
  },
  frequencyText: {
    color: theme.colors.textPrimary,
    fontSize: 12,
    lineHeight: 18,
    flex: 1,
  },
  routineRecoveryText: {
    color: theme.colors.textSecondary,
    fontSize: 12,
    marginTop: -8,
    marginBottom: theme.spacing.sm,
    paddingHorizontal: 2,
  },
});
