import { useState, useEffect } from "react";
import { ActivityIndicator, Dimensions, Modal, Pressable, ScrollView, StyleSheet, Text, TextInput, View } from "react-native";
import AsyncStorage from "@react-native-async-storage/async-storage";
import Svg, { Path, Circle } from "react-native-svg";
import NumericInput from "../components/ui/NumericInput";

import { Screen } from "../components/layout/Screen";
import { exerciseLibrary } from "../data/exerciseLibrary";
import { muscleGroups } from "../data/muscleGroups";
import { theme } from "../theme/theme";
import { Button } from "../components/ui/Button";
import { computeRoutineOverload, describeOverload } from "../utils/overload";

const WORKOUT_HISTORY_KEY = "@workout_history";
const FAVORITE_EXERCISES_KEY = "@favorite_exercises";
const MUSCLE_GOALS_KEY = "@muscle_weekly_goals";

interface PRItem {
  exerciseId: string;
  exerciseName: string;
  maxWeight: number;
  reps: number;
  date: string;
  modality?: string;
  muscles?: string[];
  estimated1RM?: number;
  isHold?: boolean;
  holdSeconds?: number;
  weightAtHold?: number;
  progressionParent?: string;
}

interface ProgressionPoint {
  date: string;
  weight: number;
  reps: number;
  estimated1RM?: number;
  isHold?: boolean;
}

const MODALITY_FILTERS = ["barbells", "dumbbells", "calisthenics", "cables"];
const MUSCLE_FILTERS = ["chest", "upperBack", "lats", "traps", "frontDelts", "sideDelts", "rearDelts", "biceps", "triceps", "forearms", "abs", "obliques", "lowerBack", "glutes", "quads", "hamstrings", "calves", "hipFlexors"];

function calculateEstimated1RM(weight: number, reps: number, rpe?: number, rir?: number): number {
  if (weight <= 0 || reps <= 0) return 0;

  let effectiveReps = reps;
  if (rir !== undefined && rir > 0) {
    effectiveReps = reps + rir;
  } else if (rpe !== undefined && rpe <= 10 && rpe >= 5) {
    effectiveReps = reps + (10 - rpe);
  }

  if (effectiveReps <= 1) return weight;

  return Math.round(weight * (1 + effectiveReps / 30) * 10) / 10;
}

// Function to calculate Sunday 00:00:00 to Saturday 23:59:59 of the current week
function getCurrentCalendarWeekBounds() {
  const now = new Date();
  const currentDayOfWeek = now.getDay(); // 0 = Sunday, 1 = Monday...

  const startOfWeek = new Date(now.getFullYear(), now.getMonth(), now.getDate());
  startOfWeek.setDate(startOfWeek.getDate() - currentDayOfWeek);
  startOfWeek.setHours(0, 0, 0, 0);

  const endOfWeek = new Date(startOfWeek);
  endOfWeek.setDate(endOfWeek.getDate() + 6);
  endOfWeek.setHours(23, 59, 59, 999);

  return { startOfWeek, endOfWeek };
}

export function MetricsScreen() {
  const [history, setHistory] = useState<any[]>([]);
  const [favorites, setFavorites] = useState<string[]>([]);
  const [weeklyGoals, setWeeklyGoals] = useState<Record<string, number>>({});
  const [loading, setLoading] = useState(true);

  const [showAllMuscles, setShowAllMuscles] = useState(false);
  const [isGoalModalVisible, setIsGoalModalVisible] = useState(false);
  const [tempGoals, setTempGoals] = useState<Record<string, number>>({});

  const [prSearchQuery, setPrSearchQuery] = useState("");
  const [selectedModality, setSelectedModality] = useState<string | null>(null);
  const [selectedMuscle, setSelectedMuscle] = useState<string | null>(null);
  const [showFavoritesOnly, setShowFavoritesOnly] = useState(false);

  const [repFilter, setRepFilter] = useState<string>("");
  const [showRepInput, setShowRepInput] = useState(false);

  const [currentPage, setCurrentPage] = useState(1);
  const ITEMS_PER_PAGE = 5;

  const [selectedPrExercise, setSelectedPrExercise] = useState<string | null>(null);
  const [graphMode, setGraphMode] = useState<"maxWeight" | "weightAtRep" | "repsAtWeight" | "maxHold" | "weightAtHold" | "holdAtWeight">("maxWeight");
  const [targetRepInput, setTargetRepInput] = useState<string>("");
  const [targetWeightInput, setTargetWeightInput] = useState<string>("");
  const [selectedOverloadRoutine, setSelectedOverloadRoutine] = useState<string | null>(null);

  useEffect(() => {
    const loadScreenData = async () => {
      try {
        const [storedHistory, storedFavorites, storedGoals] = await Promise.all([
          AsyncStorage.getItem(WORKOUT_HISTORY_KEY),
          AsyncStorage.getItem(FAVORITE_EXERCISES_KEY),
          AsyncStorage.getItem(MUSCLE_GOALS_KEY),
        ]);

        if (storedHistory) setHistory(JSON.parse(storedHistory));
        if (storedFavorites) setFavorites(JSON.parse(storedFavorites));

        if (storedGoals) {
          setWeeklyGoals(JSON.parse(storedGoals));
        } else {
          // Initialize empty default fallback goals
          const initialGoals: Record<string, number> = {};
          muscleGroups.forEach(m => { initialGoals[m.name] = 10; }); // Defaulting to standard 10 sets baseline
          setWeeklyGoals(initialGoals);
        }
      } catch (e) {
        console.error("Failed to compile metric archives", e);
      } finally {
        setLoading(false);
      }
    };

    loadScreenData();
  }, []);

  const saveGoals = async (updatedGoals: Record<string, number>) => {
    try {
      setWeeklyGoals(updatedGoals);
      await AsyncStorage.setItem(MUSCLE_GOALS_KEY, JSON.stringify(updatedGoals));
      setIsGoalModalVisible(false);
    } catch (e) {
      console.error("Failed to save muscle target configurations", e);
    }
  };

  const toggleFavoriteExercise = async (exerciseName: string) => {
    try {
      const updatedFavorites = favorites.includes(exerciseName)
        ? favorites.filter((name) => name !== exerciseName)
        : [...favorites, exerciseName];

      setFavorites(updatedFavorites);
      await AsyncStorage.setItem(FAVORITE_EXERCISES_KEY, JSON.stringify(updatedFavorites));
    } catch (e) {
      console.error("Failed to save personal record favorites status", e);
    }
  };

  // Strictly filter down to Sunday -> Saturday for the muscle chart tracking volume layer
  const { startOfWeek, endOfWeek } = getCurrentCalendarWeekBounds();
  const currentWeekHistory = history.filter((item) => {
    if (!item.date) return false;
    const workoutDate = new Date(item.date);
    return workoutDate >= startOfWeek && workoutDate <= endOfWeek;
  });

  // Calculate top statistics cards globally across your entire history log
  const totalWorkouts = history.length;
  const totalDurationSeconds = history.reduce((acc, item) => acc + (item.duration || 0), 0);
  const totalSetsCount = history.reduce((acc, item) => acc + (item.sets?.length || 0), 0);

  // Compile weekly muscle scores dynamically
  const muscleVolumeMap: Record<string, number> = {};
  muscleGroups.forEach((m) => {
    muscleVolumeMap[m.name] = 0;
  });

  currentWeekHistory.forEach((session) => {
    if (!session.sets) return;
    session.sets.forEach((setObj: any) => {
      const exerciseMatch = exerciseLibrary.find(
        (e) =>
          e.id === setObj.exercise ||
          e.name?.toLowerCase() === setObj.exercise?.toLowerCase() ||
          e.id === setObj.exercise?.toLowerCase().replace(/\s+/g, "-")
      );

      if (exerciseMatch && exerciseMatch.muscles) {
        exerciseMatch.muscles.forEach((m: any) => {
          const muscleObj = muscleGroups.find((g) => g.id === m.muscleId);
          if (muscleObj) {
            let weightFactor = 0.00;
            if (m.load === "high") weightFactor = 1.0;
            if (m.load === "medium") weightFactor = 0.5;

            muscleVolumeMap[muscleObj.name] += weightFactor;
          }
        });
      }
    });
  });

  const sortedMuscles = Object.entries(muscleVolumeMap).sort((a, b) => b[1] - a[1]);

  // Display calculations based on user target thresholds
  const displayedMuscles = showAllMuscles
    ? sortedMuscles
    : sortedMuscles.filter(([_, score]) => score > 0 || (weeklyGoals[0] !== undefined));

  // PR maps calculate from full history to capture all-time personal bests.
  // Static skills are tracked separately from rep-based exercises: seconds are the
  // performance metric, with weight only used as a secondary tie-breaker/filter.
  const prMap: Record<string, PRItem> = {};
  const targetRepFilterNum = parseInt(repFilter, 10);

  const normalizeExerciseKey = (rawName: string): string => {
    const base = rawName
      .trim()
      .toLowerCase()
      .replace(/^(weighted[_\s-]+)/, "")
      .replace(/^([\w]+[_\s-]+weighted[_\s-]+)/, "")
      .replace(/\bassisted\b[_\s-]*/gi, "")
      .replace(/\s*[-–]\s*[\d.]+\s*(?:kg|lbs|lb)?\s*$/i, "")
      .replace(/\s*\(.*?\)\s*$/g, "")
      .replace(/[-\s]+$/, "")
      .replace(/(?:^|[\s-])\d+$/, "")
      .replace(/\s+/g, " ")
      .trim();
    return base || rawName.trim().toLowerCase();
  };

  const normalizeExerciseMatchKey = (rawName: string): string =>
    normalizeExerciseKey(rawName).replace(/[-\s]+/g, " ").trim();

  const findExerciseLibraryMatch = (rawName?: string) => {
    if (!rawName) return undefined;
    const normalizedRaw = normalizeExerciseMatchKey(rawName);
    return exerciseLibrary.find((e) => {
      const candidateNames = [
        normalizeExerciseMatchKey(e.name || ""),
        normalizeExerciseMatchKey(e.id || ""),
        normalizeExerciseMatchKey((e.id || "").replace(/-/g, " ")),
      ];
      return candidateNames.includes(normalizedRaw);
    });
  };

  const isHoldHistorySet = (setObj: any, exerciseMatch?: typeof exerciseLibrary[0]) => {
    if (setObj?.isHold) return true;
    return exerciseMatch?.type === "skill-static";
  };

  history.forEach((session) => {
    if (!session.sets) return;
    session.sets.forEach((setObj: any) => {
      const currentWeight = parseFloat(setObj.load || "0") || 0;
      const currentReps = parseInt(setObj.reps || "0", 10) || 0;
      if (currentReps <= 0) return;

      const libMatch = findExerciseLibraryMatch(setObj.exercise);
      const isHold = isHoldHistorySet(setObj, libMatch);
      const prKey = normalizeExerciseKey(setObj.exercise);
      const existingPR = prMap[prKey];

      // Do not let the normal rep filter hide static-skill records. Their
      // `reps` field is persisted seconds for backwards compatibility.
      if (!isHold && !isNaN(targetRepFilterNum) && currentReps !== targetRepFilterNum) return;

      if (isHold) {
        const holdSeconds = currentReps;
        const existingHoldSeconds = existingPR?.holdSeconds || existingPR?.reps || 0;
        const existingHoldWeight = existingPR?.weightAtHold ?? existingPR?.maxWeight ?? 0;

        if (
          !existingPR ||
          holdSeconds > existingHoldSeconds ||
          (holdSeconds === existingHoldSeconds && currentWeight > existingHoldWeight)
        ) {
          prMap[prKey] = {
            exerciseId: libMatch?.id || setObj.exercise,
            exerciseName: existingPR?.exerciseName || setObj.exercise,
            maxWeight: currentWeight,
            reps: holdSeconds,
            holdSeconds,
            weightAtHold: currentWeight,
            date: session.date,
            modality: libMatch?.modality,
            muscles: libMatch?.muscles?.map(m => m.muscleId) || [],
            isHold: true,
            progressionParent: libMatch?.subSkillOf,
          };
        }
        return;
      }

      if (currentWeight > 0) {
        const computed1RM = calculateEstimated1RM(currentWeight, currentReps, setObj.rpe, setObj.rir);
        if (!existingPR || existingPR.isHold || currentWeight > existingPR.maxWeight) {
          prMap[prKey] = {
            exerciseId: libMatch?.id || setObj.exercise,
            exerciseName: existingPR?.exerciseName || setObj.exercise,
            maxWeight: currentWeight,
            reps: currentReps,
            date: session.date,
            modality: libMatch?.modality,
            muscles: libMatch?.muscles?.map(m => m.muscleId) || [],
            estimated1RM: computed1RM,
            isHold: false,
            progressionParent: libMatch?.subSkillOf,
          };
        }
      } else if (!existingPR || (!existingPR.isHold && currentReps > existingPR.reps)) {
        prMap[prKey] = {
          exerciseId: libMatch?.id || setObj.exercise,
          exerciseName: existingPR?.exerciseName || setObj.exercise,
          maxWeight: 0,
          reps: currentReps,
          date: session.date,
          modality: libMatch?.modality,
          muscles: libMatch?.muscles?.map(m => m.muscleId) || [],
          estimated1RM: 0,
          isHold: false,
          progressionParent: libMatch?.subSkillOf,
        };
      }
    });
  });

  const selectedExerciseLibraryMatch = selectedPrExercise
    ? findExerciseLibraryMatch(selectedPrExercise)
    : undefined;
  const selectedExerciseIsHold = selectedExerciseLibraryMatch?.type === "skill-static"
    || Object.values(prMap).find(pr => pr.exerciseName === selectedPrExercise)?.isHold === true;

  const getPrProgressionHistory = (
    exerciseName: string,
    mode: "maxWeight" | "weightAtRep" | "repsAtWeight" | "maxHold" | "weightAtHold" | "holdAtWeight",
    repFilterVal: string,
    weightFilterVal: string
  ): ProgressionPoint[] => {
    const normalizedQuery = normalizeExerciseKey(exerciseName);
    const targetReps = parseInt(repFilterVal, 10);
    const targetWeight = parseFloat(weightFilterVal);
    const hasRepTarget = !isNaN(targetReps) && targetReps > 0;
    const hasWeightTarget = !isNaN(targetWeight) && targetWeight >= 0;
    const dailyBestMap: Record<string, ProgressionPoint> = {};
    const chronologicalHistory = [...history].sort((a, b) => new Date(a.date).getTime() - new Date(b.date).getTime());

    chronologicalHistory.forEach((session) => {
      if (!session.sets || !session.date) return;
      session.sets.forEach((setObj: any) => {
        if (normalizeExerciseKey(setObj.exercise) !== normalizedQuery) return;

        const w = parseFloat(setObj.load || "0") || 0;
        const r = parseInt(setObj.reps || "0", 10) || 0;
        if (r <= 0) return;

        const libMatch = findExerciseLibraryMatch(setObj.exercise);
        const isHold = isHoldHistorySet(setObj, libMatch);
        if (selectedExerciseIsHold !== isHold) return;

        if (!isHold && !isNaN(targetRepFilterNum) && r !== targetRepFilterNum) return;

        const existingDailyPoint = dailyBestMap[session.date];
        let shouldUpdate = false;

        if (isHold) {
          if (mode === "maxHold") {
            shouldUpdate = !existingDailyPoint || r > existingDailyPoint.reps || (r === existingDailyPoint.reps && w > existingDailyPoint.weight);
          } else if (mode === "weightAtHold") {
            shouldUpdate = hasRepTarget && r === targetReps && (!existingDailyPoint || w > existingDailyPoint.weight);
          } else if (mode === "holdAtWeight") {
            shouldUpdate = hasWeightTarget && Math.abs(w - targetWeight) < 0.0001 && (!existingDailyPoint || r > existingDailyPoint.reps);
          }
        } else {
          const computed1RM = calculateEstimated1RM(w, r, setObj.rpe, setObj.rir);
          if (mode === "maxWeight") {
            shouldUpdate = !existingDailyPoint || w > existingDailyPoint.weight;
          } else if (mode === "weightAtRep") {
            shouldUpdate = hasRepTarget && r === targetReps && (!existingDailyPoint || w > existingDailyPoint.weight);
          } else if (mode === "repsAtWeight") {
            shouldUpdate = hasWeightTarget && Math.abs(w - targetWeight) < 0.0001 && (!existingDailyPoint || r > existingDailyPoint.reps);
          }
          if (shouldUpdate) {
            dailyBestMap[session.date] = { date: session.date, weight: w, reps: r, estimated1RM: computed1RM, isHold: false };
          }
          return;
        }

        if (shouldUpdate) {
          dailyBestMap[session.date] = { date: session.date, weight: w, reps: r, isHold: true };
        }
      });
    });

    return Object.values(dailyBestMap).sort((a, b) => new Date(a.date).getTime() - new Date(b.date).getTime());
  };

  const filteredPRs = Object.values(prMap).filter((pr) => {
    if (showFavoritesOnly && !favorites.includes(pr.exerciseName)) return false;

    const query = prSearchQuery.toLowerCase().trim();
    if (query) {
      const matchesName = pr.exerciseName.toLowerCase().includes(query);
      const matchesModality = pr.modality?.toLowerCase().includes(query);
      const matchesMuscles = pr.muscles?.some((m) => m.toLowerCase().includes(query));
      if (!matchesName && !matchesModality && !matchesMuscles) return false;
    }

    if (selectedModality && pr.modality !== selectedModality) return false;
    if (selectedMuscle && !pr.muscles?.includes(selectedMuscle)) return false;

    return true;
  });

  const sortedPRs = filteredPRs.sort((a, b) => {
    const aFav = favorites.includes(a.exerciseName) ? 1 : 0;
    const bFav = favorites.includes(b.exerciseName) ? 1 : 0;
    if (aFav !== bFav) return bFav - aFav;
    return b.maxWeight - a.maxWeight;
  });

  const chunkPRsIntoColumns = (items: PRItem[]) => {
    const columns: PRItem[][] = [];
    for (let i = 0; i < items.length; i += 2) {
      columns.push(items.slice(i, i + 2));
    }
    return columns;
  };

  const prColumns = chunkPRsIntoColumns(sortedPRs);

  const formatDuration = (totalSecs: number) => {
    const hrs = Math.floor(totalSecs / 3600);
    const mins = Math.floor((totalSecs % 3600) / 60);
    return hrs > 0 ? `${hrs}h ${mins}m` : `${mins}m`;
  };

  const formatTimerValue = (s: number) => {
    const m = Math.floor(s / 60);
    const sec = s % 60;
    return `${m}:${sec.toString().padStart(2, "0")}`;
  };

  const formatShortDate = (dateStr: string) => {
    try {
      const d = new Date(dateStr);
      if (isNaN(d.getTime())) return dateStr;
      return d.toLocaleDateString("en-US", { month: "short", day: "numeric", year: "numeric", timeZone: "UTC" });
    } catch {
      return dateStr;
    }
  };

  if (loading) {
    return (
      <Screen>
        <View style={styles.center}>
          <ActivityIndicator size="large" color={theme.colors.accent} />
        </View>
      </Screen>
    );
  }

  const totalPages = Math.ceil(history.length / ITEMS_PER_PAGE);
  const startIndex = (currentPage - 1) * ITEMS_PER_PAGE;
  const paginatedHistory = history.slice(startIndex, startIndex + ITEMS_PER_PAGE);

  const chartProgressionData = selectedPrExercise
    ? getPrProgressionHistory(selectedPrExercise, graphMode, targetRepInput, targetWeightInput).slice(-5)
    : [];
  const listProgressionData = [...chartProgressionData].reverse();

  const valueOf = (pt: ProgressionPoint) => {
    if (graphMode === "repsAtWeight" || graphMode === "holdAtWeight") return pt.reps;
    if (graphMode === "weightAtRep" || graphMode === "weightAtHold") return pt.weight;
    if (graphMode === "maxHold") return pt.reps;
    return pt.weight;
  };

  const valuesArray = chartProgressionData.map(valueOf);
  const minV = valuesArray.length > 0 ? Math.min(...valuesArray) : 0;
  const maxV = valuesArray.length > 0 ? Math.max(...valuesArray) : 100;
  const paddedMinV = Math.max(0, minV - 10);
  const paddedMaxV = maxV + 10;
  const valueRange = paddedMaxV - paddedMinV === 0 ? 1 : paddedMaxV - paddedMinV;

  const graphWidth = Dimensions.get("window").width - 64;
  const graphHeight = 120;
  const sidePadding = 25;
  const usableWidth = graphWidth - (sidePadding * 2);
  const horizontalSpacing = chartProgressionData.length > 1 ? usableWidth / (chartProgressionData.length - 1) : usableWidth;

  let svgPathString = "";
  const calculatedPoints = chartProgressionData.map((pt, index) => {
    const x = sidePadding + (index * horizontalSpacing);
    const value = valueOf(pt);
    const y = graphHeight - (((value - paddedMinV) / valueRange) * graphHeight);
    return { x, y, pt };
  });

  if (calculatedPoints.length > 0) {
    svgPathString = `M ${calculatedPoints[0].x} ${calculatedPoints[0].y} ` +
      calculatedPoints.slice(1).map(p => `L ${p.x} ${p.y}`).join(" ");
  }

  // Routines that actually have logged sessions can be charted for overload.
  const overloadRoutineNames = Array.from(
    new Set(history.map((session) => session.routineName).filter(Boolean))
  ) as string[];
  const activeOverloadRoutine = selectedOverloadRoutine || overloadRoutineNames[0] || null;
  const overloadPoints = activeOverloadRoutine
    ? computeRoutineOverload(history, null, activeOverloadRoutine).slice(-8)
    : [];
  const overloadSummary = describeOverload(overloadPoints);

  const overloadValues = overloadPoints.map((point) => point.index);
  const overloadMin = overloadValues.length ? Math.min(...overloadValues, 100) - 5 : 95;
  const overloadMax = overloadValues.length ? Math.max(...overloadValues, 100) + 5 : 105;
  const overloadRange = overloadMax - overloadMin === 0 ? 1 : overloadMax - overloadMin;
  const overloadSpacing = overloadPoints.length > 1 ? usableWidth / (overloadPoints.length - 1) : usableWidth;
  const overloadPointCoords = overloadPoints.map((point, index) => ({
    x: sidePadding + index * overloadSpacing,
    y: graphHeight - ((point.index - overloadMin) / overloadRange) * graphHeight,
    point,
  }));
  const overloadPath = overloadPointCoords.length
    ? `M ${overloadPointCoords[0].x} ${overloadPointCoords[0].y} ` +
      overloadPointCoords.slice(1).map((coord) => `L ${coord.x} ${coord.y}`).join(" ")
    : "";

  return (
    <Screen padded={false}>
      <ScrollView contentContainerStyle={styles.container}>
        


        {/* Global Statistics Grid Dashboard */}
        <View style={styles.statsGrid}>
          <View style={styles.statCard}>
            <Text style={styles.statLabel}>Total Workouts</Text>
            <Text style={styles.statValue}>{totalWorkouts}</Text>
          </View>
          <View style={styles.statCard}>
            <Text style={styles.statLabel}>Total Trained Time</Text>
            <Text style={styles.statValue}>{formatDuration(totalDurationSeconds)}</Text>
          </View>
          <View style={styles.statCard}>
            <Text style={styles.statLabel}>Completed Sets</Text>
            <Text style={styles.statValue}>{totalSetsCount}</Text>
          </View>
        </View>

        {/* PROGRESS TOWARD GOAL COMPONENT */}
        <View style={styles.sectionContainer}>
          <View style={styles.sectionHeaderRow}>
            <Text style={styles.sectionTitle}>Weekly Target Progress (Sun - Sat)</Text>
<Button variant="text" onPress={() => {
                 setTempGoals({ ...weeklyGoals });
                 setIsGoalModalVisible(true);
               }}
            >
               Edit Weekly Volume
            </Button>
          </View>

          <View style={styles.infoBanner}>
            <Text style={styles.infoBannerText}>
                See your progress towards your weekly volume goals. Secondary Muscles are counted as 0.5 sets.
            </Text>
          </View>

          <View style={styles.chartCard}>
            {displayedMuscles.length === 0 ? (
              <Text style={styles.emptyText}>No volume tracking configurations set active.</Text>
            ) : (
              <View style={styles.gridContainer}>
                {displayedMuscles.map(([muscle, totalScore]) => {
                  const targetGoal = weeklyGoals[muscle] || 10;
                  // Cap percentage track rendering at 100% boundary width
                  const percentage = Math.min((totalScore / targetGoal) * 100, 100);

                  return (
                    <View key={muscle} style={styles.muscleRowItem}>
                      <View style={styles.rowTextContainer}>
                        <Text style={styles.muscleNameText} numberOfLines={1}>{muscle}</Text>
                        <Text style={styles.muscleValueText}>
                          {totalScore.toFixed(1)} / <Text style={{fontWeight: "700", color: theme.colors.accent}}>{targetGoal}</Text> sets
                        </Text>
                      </View>
                      <View style={styles.horizontalTrack}>
                        <View style={[styles.horizontalFill, { width: `${percentage}%` }]} />
                      </View>
                    </View>
                  );
                })}
              </View>
            )}

            {sortedMuscles.length > 0 && (
              <Pressable
                style={styles.toggleButton}
                onPress={() => setShowAllMuscles(!showAllMuscles)}
              >
                <Text style={styles.toggleButtonText}>
                  {showAllMuscles ? "Hide Unworked Muscles" : `Show All Muscle Groups (${sortedMuscles.length})`}
                </Text>
              </Pressable>
            )}
          </View>
        </View>

        {/* PERSONAL RECORDS SECTION */}
        <View style={styles.sectionContainer}>
          <View style={styles.sectionHeaderRow}>
            <Text style={styles.sectionTitle}>All-Time Personal Records</Text>
          </View>

          <TextInput
            style={styles.searchBarInput}
            placeholder="Type to search PRs by name..."
            placeholderTextColor={theme.colors.textSecondary}
            value={prSearchQuery}
            onChangeText={setPrSearchQuery}
            clearButtonMode="while-editing"
          />

          <View style={styles.controlPanelContainer}>
            <View style={styles.primaryFilterRow}>
              <Pressable
                style={[styles.panelFilterButton, showFavoritesOnly && styles.panelFilterButtonActive]}
                onPress={() => setShowFavoritesOnly(!showFavoritesOnly)}
              >
                <Text style={[styles.panelFilterButtonText, showFavoritesOnly && styles.panelFilterButtonTextActive]}>
                  Favorites ({favorites.length})
                </Text>
              </Pressable>

              <Pressable
                style={[styles.panelFilterButton, (showRepInput || repFilter !== "") && styles.panelFilterButtonActive]}
                onPress={() => setShowRepInput(!showRepInput)}
              >
                <Text style={[styles.panelFilterButtonText, (showRepInput || repFilter !== "") && styles.panelFilterButtonTextActive]}>
                   {repFilter !== "" ? `Reps: ${repFilter}` : "Enter Rep Number"}
                </Text>
              </Pressable>
            </View>

            {showRepInput && (
              <View style={styles.repInputWrapper}>
                <NumericInput
                  style={styles.repTextInput}
                  placeholder="Enter specific target rep count..."
                  placeholderTextColor={theme.colors.textSecondary}
                  value={repFilter}
                  onChangeText={setRepFilter}
                  maxLength={4}
                  label="Rep count"
                />
                {repFilter !== "" && (
                  <Pressable style={styles.clearRepButton} onPress={() => setRepFilter("")}>
                    <Text style={styles.clearRepButtonText}>Clear</Text>
                  </Pressable>
                )}
              </View>
            )}
          </View>

          <View style={styles.filterContainer}>
            <View style={styles.modalityFilterRow}>
              {MODALITY_FILTERS.map((mod) => {
                const isActive = selectedModality === mod;
                return (
                  <Pressable
                    key={mod}
                    style={[styles.filterChip, isActive && styles.chipActive]}
                    onPress={() => setSelectedModality(isActive ? null : mod)}
                  >
                    <Text style={[styles.filterChipText, isActive && styles.chipTextActive]}>{mod}</Text>
                  </Pressable>
                );
              })}
            </View>

            <ScrollView horizontal showsHorizontalScrollIndicator={false} contentContainerStyle={styles.muscleFilterScroll}>
              {MUSCLE_FILTERS.map((muscle) => {
                const isActive = selectedMuscle === muscle;
                return (
                  <Pressable
                    key={muscle}
                    style={[styles.filterChip, isActive && styles.chipActive]}
                    onPress={() => setSelectedMuscle(isActive ? null : muscle)}
                  >
                    <Text style={[styles.filterChipText, isActive && styles.chipTextActive]}>{muscle}</Text>
                  </Pressable>
                );
              })}
            </ScrollView>
          </View>

          {sortedPRs.length === 0 ? (
            <Text style={styles.emptyText}>No matching lift records match criteria parameters.</Text>
          ) : (
            <ScrollView
              horizontal
              showsHorizontalScrollIndicator={false}
              contentContainerStyle={styles.horizontalPrGridWrapper}
            >
              {prColumns.map((column, colIndex) => (
                <View key={colIndex} style={styles.prColumnTrack}>
                  {column.map((pr) => {
                    const isFav = favorites.includes(pr.exerciseName);
                    return (
                      <Pressable
                        key={pr.exerciseName}
                        style={[styles.prCard, isFav && styles.prCardGreenActive]}
                        onPress={() => {
                          setSelectedPrExercise(pr.exerciseName);
                          const isStatic = !!pr.isHold;
                          setGraphMode(isStatic ? "maxHold" : "maxWeight");
                          setTargetRepInput("");
                          setTargetWeightInput("");
                        }}
                      >
                        <View style={styles.prCardHeaderRow}>
                          <Text style={styles.prExerciseName} numberOfLines={1}>{pr.exerciseName}</Text>
                          <Pressable onPress={() => toggleFavoriteExercise(pr.exerciseName)} hitSlop={12}>
                            <Text style={[styles.starIconText, isFav && styles.starIconActive]}>
                              {isFav ? "★" : "☆"}
                            </Text>
                          </Pressable>
                        </View>
                        <Text style={styles.prWeightText}>
                          {pr.isHold
                            ? pr.weightAtHold && pr.weightAtHold > 0
                              ? `${pr.weightAtHold} kg × ${pr.holdSeconds || pr.reps} sec`
                              : `${pr.holdSeconds || pr.reps} sec`
                            : pr.maxWeight > 0
                            ? `${pr.maxWeight} kg`
                            : `${pr.reps} reps`}
                        </Text>
                        <Text style={styles.prSubtext}>
                          {pr.isHold
                            ? pr.progressionParent
                              ? `Best hold for this progression`
                              : pr.weightAtHold && pr.weightAtHold > 0
                              ? `Weighted hold • ${pr.holdSeconds || pr.reps} sec`
                              : `Longest hold`
                            : pr.maxWeight > 0
                            ? `for ${pr.reps} reps • Est. 1RM: ${pr.estimated1RM || 0}kg`
                            : `Top rep set`}
                        </Text>
                      </Pressable>
                    );
                  })}
                </View>
              ))}
            </ScrollView>
          )}
        </View>

        {/* ROUTINE PROGRESSIVE OVERLOAD */}
        <View style={styles.sectionContainer}>
          <Text style={styles.sectionTitle}>Routine Progressive Overload</Text>

          <View style={styles.infoBanner}>
            <Text style={styles.infoBannerText}>
              Averages every exercise in the routine against its first logged session. Extra reps, heavier loads and
              longer holds all count as overload — 100 is your starting point.
            </Text>
          </View>

          {overloadRoutineNames.length === 0 ? (
            <Text style={styles.emptyText}>No routine sessions logged yet.</Text>
          ) : (
            <View style={styles.chartCard}>
              <ScrollView horizontal showsHorizontalScrollIndicator={false} contentContainerStyle={styles.muscleFilterScroll}>
                {overloadRoutineNames.map((name) => {
                  const isActive = name === activeOverloadRoutine;
                  return (
                    <Pressable
                      key={name}
                      style={[styles.filterChip, isActive && styles.chipActive]}
                      onPress={() => setSelectedOverloadRoutine(name)}
                    >
                      <Text style={[styles.filterChipText, isActive && styles.chipTextActive]}>{name}</Text>
                    </Pressable>
                  );
                })}
              </ScrollView>

              <Text style={styles.overloadHeadline}>
                {overloadPoints.length ? `${overloadPoints[overloadPoints.length - 1].index} overload index` : "No data"}
              </Text>
              <Text style={styles.overloadSummary}>{overloadSummary}</Text>

              {overloadPoints.length > 1 && (
                <>
                  <View style={{ height: graphHeight, width: graphWidth }}>
                    <Svg width={graphWidth} height={graphHeight} style={StyleSheet.absoluteFill}>
                      <Path
                        d={overloadPath}
                        fill="none"
                        stroke={theme.colors.accent}
                        strokeWidth={3}
                        strokeLinecap="round"
                        strokeLinejoin="round"
                      />
                      {overloadPointCoords.map((coord, index) => (
                        <Circle key={index} cx={coord.x} cy={coord.y} r={4} fill={theme.colors.accent} />
                      ))}
                    </Svg>
                  </View>
                  <View style={styles.overloadAxisRow}>
                    {overloadPoints.map((point, index) => (
                      <Text key={`${point.date}-${index}`} style={styles.overloadAxisLabel}>
                        {point.date}
                      </Text>
                    ))}
                  </View>
                </>
              )}
            </View>
          )}
        </View>

        {/* FULL WORKOUT SET HISTORY FEED */}
        <View style={styles.sectionContainer}>
          <Text style={styles.sectionTitle}>Full Workout History</Text>

          {history.length === 0 ? (
            <Text style={styles.emptyText}>No completed workouts recorded found in tracking database.</Text>
          ) : (
            <>
              {paginatedHistory.map((session) => (
                <View key={session.id} style={styles.historyCard}>
                  <View style={styles.historyHeader}>
                    <View style={{ flex: 1 }}>
                      <Text style={styles.historyRoutineName}>{session.routineName}</Text>
                      <Text style={styles.historyDate}>{session.date}</Text>
                    </View>
                    <Text style={styles.historyDuration}>⏱️ {formatTimerValue(session.duration)}</Text>
                  </View>

                  <View style={styles.divider} />

                  <View style={styles.setList}>
                    {session.sets && session.sets.map((setObj: any, index: number) => {
                      const historyIsHold = setObj.isHold || findExerciseLibraryMatch(setObj.exercise)?.type === "skill-static";
                      return (
                        <View key={index} style={styles.setRow}>
                          <View style={styles.setMainInfo}>
                            <Text style={styles.historyExerciseNameText}>{setObj.exercise}</Text>
                            <Text style={styles.setIndexText}>Set {setObj.set}</Text>
                          </View>
                          <Text style={styles.setMetricsText}>
                            {historyIsHold
                              ? setObj.load
                                ? `${setObj.load}kg • ${setObj.reps || "0"} sec`
                                : `${setObj.reps || "0"} sec`
                              : setObj.load
                              ? `${setObj.load}kg × ${setObj.reps || "0"}`
                              : `0kg × ${setObj.reps || "0"}`}
                            {setObj.rir ? ` • RIR ${setObj.rir}` : ""}
                            {setObj.rpe ? ` • RPE ${setObj.rpe}` : ""}
                          </Text>
                        </View>
                      );
                    })}
                  </View>
                </View>
              ))}

              {totalPages > 1 && (
                <View style={styles.paginationRow}>
                  <Pressable
                    disabled={currentPage === 1}
                    style={[styles.pageButton, currentPage === 1 && styles.pageButtonDisabled]}
                    onPress={() => setCurrentPage((prev) => Math.max(prev - 1, 1))}
                  >
                    <Text style={[styles.pageButtonText, currentPage === 1 && styles.pageButtonTextDisabled]}>
                      ← Prev
                    </Text>
                  </Pressable>

                  <Text style={styles.pageInfoText}>
                    Page {currentPage} of {totalPages}
                  </Text>

                  <Pressable
                    disabled={currentPage === totalPages}
                    style={[styles.pageButton, currentPage === totalPages && styles.pageButtonDisabled]}
                    onPress={() => setCurrentPage((prev) => Math.min(prev + 1, totalPages))}
                  >
                    <Text style={[styles.pageButtonText, currentPage === totalPages && styles.pageButtonTextDisabled]}>
                      Next →
                    </Text>
                  </Pressable>
                </View>
              )}
            </>
          )}
        </View>
      </ScrollView>

      {/* ONE-PANEL SCROLLABLE GOALS MANAGER MODAL */}
      <Modal
        visible={isGoalModalVisible}
        animationType="slide"
        transparent={true}
        onRequestClose={() => setIsGoalModalVisible(false)}
      >
        <View style={styles.modalOverlay}>
          <View style={[styles.modalContent, { maxHeight: "70%" }]}>
            <View style={styles.modalHeader}>
              <Text style={styles.modalTitle}>Set Muscle Volume Weekly Goals</Text>
              <Pressable style={styles.closeButton} onPress={() => setIsGoalModalVisible(false)}>
                <Text style={styles.closeButtonText}>×</Text>
              </Pressable>
            </View>

            <ScrollView contentContainerStyle={{ gap: 14, paddingBottom: 16 }} showsVerticalScrollIndicator={false}>
              {muscleGroups.map((muscle) => {
                const currentVal = tempGoals[muscle.name] !== undefined ? tempGoals[muscle.name] : 10;
                return (
                  <View key={muscle.id} style={styles.goalSetupRow}>
                    <Text style={styles.goalSetupLabel}>{muscle.name}</Text>
                    <View style={styles.goalSetupControlGroup}>
                      <Pressable
                        style={styles.adjustGoalBtn}
                        onPress={() => setTempGoals(prev => ({...prev, [muscle.name]: Math.max(0, currentVal - 1)}))}
                      >
                        <Text style={styles.adjustGoalBtnText}>-</Text>
                      </Pressable>
                      <NumericInput
                        style={styles.goalValueInput}
                        value={currentVal.toString()}
                        onChangeText={(text) => {
                          const parsed = parseInt(text, 10);
                          setTempGoals(prev => ({...prev, [muscle.name]: isNaN(parsed) ? 0 : parsed}));
                        }}
                        maxLength={4}
                        label="Goal value"
                      />
                      <Pressable
                        style={styles.adjustGoalBtn}
                        onPress={() => setTempGoals(prev => ({...prev, [muscle.name]: currentVal + 1}))}
                      >
                        <Text style={styles.adjustGoalBtnText}>+</Text>
                      </Pressable>
                    </View>
                  </View>
                );
              })}
            </ScrollView>

            <Pressable style={styles.saveGoalsActionButton} onPress={() => saveGoals(tempGoals)}>
              <Text style={styles.saveGoalsActionButtonText}>Save All Goals</Text>
            </Pressable>
          </View>
        </View>
      </Modal>

      {/* PR PROGRESSION MODAL OVERLAY */}
      <Modal
        visible={selectedPrExercise !== null}
        animationType="slide"
        transparent={true}
        onRequestClose={() => setSelectedPrExercise(null)}
      >
        <View style={styles.modalOverlay}>
          <View style={styles.modalContent}>
            <View style={styles.modalHeader}>
              <Text style={styles.modalTitle} numberOfLines={1}>{selectedPrExercise}</Text>
              <Pressable style={styles.closeButton} onPress={() => setSelectedPrExercise(null)}>
                <Text style={styles.closeButtonText}>×</Text>
              </Pressable>
            </View>

            <ScrollView contentContainerStyle={styles.modalScrollBody} showsVerticalScrollIndicator={false}>
              <View style={{ flexDirection: "row", gap: 8, marginBottom: 12, flexWrap: "wrap" }}>
                {selectedExerciseIsHold ? (
                  <>
                    <Pressable
                      style={[styles.panelFilterButton, graphMode === "maxHold" && styles.panelFilterButtonActive]}
                      onPress={() => { setGraphMode("maxHold"); setTargetRepInput(""); setTargetWeightInput(""); }}
                    >
                      <Text style={[styles.panelFilterButtonText, graphMode === "maxHold" && styles.panelFilterButtonTextActive]}>Peak Hold Time</Text>
                    </Pressable>
                    <Pressable
                      style={[styles.panelFilterButton, graphMode === "weightAtHold" && styles.panelFilterButtonActive]}
                      onPress={() => { setGraphMode("weightAtHold"); setTargetWeightInput(""); }}
                    >
                      <Text style={[styles.panelFilterButtonText, graphMode === "weightAtHold" && styles.panelFilterButtonTextActive]}>Peak Weight at Hold</Text>
                    </Pressable>
                    <Pressable
                      style={[styles.panelFilterButton, graphMode === "holdAtWeight" && styles.panelFilterButtonActive]}
                      onPress={() => { setGraphMode("holdAtWeight"); setTargetRepInput(""); }}
                    >
                      <Text style={[styles.panelFilterButtonText, graphMode === "holdAtWeight" && styles.panelFilterButtonTextActive]}>Peak Hold at Weight</Text>
                    </Pressable>
                  </>
                ) : (
                  <>
                    <Pressable
                      style={[styles.panelFilterButton, graphMode === "maxWeight" && styles.panelFilterButtonActive]}
                      onPress={() => setGraphMode("maxWeight")}
                    >
                      <Text style={[styles.panelFilterButtonText, graphMode === "maxWeight" && styles.panelFilterButtonTextActive]}>Peak Weight</Text>
                    </Pressable>
                    <Pressable
                      style={[styles.panelFilterButton, graphMode === "weightAtRep" && styles.panelFilterButtonActive]}
                      onPress={() => setGraphMode("weightAtRep")}
                    >
                      <Text style={[styles.panelFilterButtonText, graphMode === "weightAtRep" && styles.panelFilterButtonTextActive]}>Peak Weight at Reps</Text>
                    </Pressable>
                    <Pressable
                      style={[styles.panelFilterButton, graphMode === "repsAtWeight" && styles.panelFilterButtonActive]}
                      onPress={() => setGraphMode("repsAtWeight")}
                    >
                      <Text style={[styles.panelFilterButtonText, graphMode === "repsAtWeight" && styles.panelFilterButtonTextActive]}>Peak Reps at Weight</Text>
                    </Pressable>
                  </>
                )}
              </View>

              {selectedExerciseIsHold && graphMode === "weightAtHold" && (
                <View style={styles.repInputWrapper}>
                  <NumericInput
                    style={styles.repTextInput}
                    placeholder="Enter target hold time (sec)..."
                    placeholderTextColor={theme.colors.textSecondary}
                    value={targetRepInput}
                    onChangeText={setTargetRepInput}
                    maxLength={4}
                    label="Target hold time"
                  />
                </View>
              )}

              {selectedExerciseIsHold && graphMode === "holdAtWeight" && (
                <View style={styles.repInputWrapper}>
                  <NumericInput
                    style={styles.repTextInput}
                    placeholder="Enter target weight (kg)..."
                    placeholderTextColor={theme.colors.textSecondary}
                    value={targetWeightInput}
                    onChangeText={setTargetWeightInput}
                    maxLength={5}
                    label="Target weight"
                  />
                </View>
              )}

              {!selectedExerciseIsHold && graphMode === "weightAtRep" && (
                <View style={styles.repInputWrapper}>
                  <NumericInput
                    style={styles.repTextInput}
                    placeholder="Enter target reps..."
                    placeholderTextColor={theme.colors.textSecondary}
                    value={targetRepInput}
                    onChangeText={setTargetRepInput}
                    maxLength={4}
                    label="Target reps"
                  />
                </View>
              )}
              {!selectedExerciseIsHold && graphMode === "repsAtWeight" && (
                <View style={styles.repInputWrapper}>
                  <NumericInput
                    style={styles.repTextInput}
                    placeholder="Enter target weight (kg)..."
                    placeholderTextColor={theme.colors.textSecondary}
                    value={targetWeightInput}
                    onChangeText={setTargetWeightInput}
                    maxLength={5}
                    label="Target weight"
                  />
                </View>
              )}

              {selectedExerciseIsHold && selectedExerciseLibraryMatch?.subSkillOf && (
                <View style={styles.progressionNotice}>
                  <Text style={styles.progressionNoticeText}>Progression PRs are tracked for this exact progression.</Text>
                </View>
              )}

              {chartProgressionData.length === 0 ? (
                <Text style={styles.emptyText}>No available progression data found.</Text>
              ) : (
                <>
                  <View style={styles.modalHighlightsGrid}>
                    <View style={styles.highlightBlock}>
                      <Text style={styles.highlightLabel}>
                        {selectedExerciseIsHold
                          ? graphMode === "holdAtWeight" ? "Peak Hold at Weight" : graphMode === "weightAtHold" ? "Peak Weight at Hold" : "Peak Hold Time"
                          : graphMode === "repsAtWeight" ? "Peak Reps at Weight" : graphMode === "weightAtRep" ? "Peak Weight at Reps" : "Peak Lift Weight"}
                      </Text>
                      <Text style={styles.highlightValue}>
                        {selectedExerciseIsHold
                          ? graphMode === "holdAtWeight" || graphMode === "maxHold"
                            ? `${listProgressionData[0]?.reps || 0} sec`
                            : `${listProgressionData[0]?.weight || 0} kg`
                          : graphMode === "repsAtWeight"
                            ? `${listProgressionData[0]?.reps || 0} reps`
                            : `${listProgressionData[0]?.weight || 0} kg`}
                      </Text>
                    </View>
                    <View style={styles.highlightBlock}>
                      <Text style={styles.highlightLabel}>
                        {selectedExerciseIsHold ? "Matching Load" : "Estimated 1-Rep Max"}
                      </Text>
                      <Text style={[styles.highlightValue, { color: theme.colors.accent }]}> 
                        {selectedExerciseIsHold
                          ? `${listProgressionData[0]?.weight || 0} kg`
                          : `${listProgressionData[0]?.estimated1RM || 0} kg`}
                      </Text>
                    </View>
                  </View>

                  <Text style={styles.modalSectionTitle}>
                    {selectedExerciseIsHold
                      ? graphMode === "holdAtWeight" || graphMode === "maxHold" ? "Hold Time Progress History" : "Weight Progress History"
                      : graphMode === "repsAtWeight" ? "Reps Progress History" : "Weight Progress History"}
                  </Text>
                  <View style={styles.svgChartCardContainer}>
                    <View style={{ width: graphWidth, height: graphHeight, position: "relative" }}>
                      {svgPathString ? (
                        <Svg width={graphWidth} height={graphHeight} style={StyleSheet.absoluteFill}>
                          <Path d={svgPathString} fill="none" stroke={theme.colors.accent} strokeWidth={3} strokeLinecap="round" strokeLinejoin="round" />
                          {calculatedPoints.map((pt, i) => (
                            <Circle key={i} cx={pt.x} cy={pt.y} r={5} fill="#FFFFFF" stroke={theme.colors.accent} strokeWidth={2} />
                          ))}
                        </Svg>
                      ) : null}

                      {calculatedPoints.map((cp, idx) => (
                        <View key={idx} style={[styles.svgFloatingTextColumn, { left: cp.x - 25, top: cp.y - 24 }]}>
                          <Text style={styles.svgNodeWeightText}>
                            {selectedExerciseIsHold
                              ? (graphMode === "weightAtHold" ? `${cp.pt.weight}kg` : `${cp.pt.reps}s`)
                              : graphMode === "repsAtWeight" ? `${cp.pt.reps} reps` : `${cp.pt.weight}kg`}
                          </Text>
                        </View>
                      ))}

                      {calculatedPoints.map((cp, idx) => (
                        <View key={`date-${idx}`} style={[styles.svgFloatingTextColumn, { left: cp.x - 25, bottom: -22 }]}>
                          <Text style={[styles.svgNodeDateText, { textAlign: "center" }]} numberOfLines={2}>
                            {formatShortDate(cp.pt.date).replace(", ", "\\n")}
                          </Text>
                        </View>
                      ))}
                    </View>
                  </View>

                  <Text style={styles.modalSectionTitle}>Personal Best Milestones</Text>
                  <View style={styles.milestoneLogList}>
                    {listProgressionData.map((milestone, mIdx) => (
                      <View key={mIdx} style={styles.milestoneLogCard}>
                        <View style={{ flex: 1 }}>
                          <Text style={styles.milestoneMainText}>
                            {selectedExerciseIsHold
                              ? milestone.weight > 0 ? `${milestone.weight} kg × ${milestone.reps} sec` : `${milestone.reps} sec`
                              : graphMode === "repsAtWeight" ? `${milestone.reps} reps` : `${milestone.weight} kg × ${milestone.reps} reps`}
                          </Text>
                          <Text style={styles.milestoneSubtext}>{formatShortDate(milestone.date)}</Text>
                        </View>
                        {!selectedExerciseIsHold && (
                          <View style={{ alignItems: "flex-end" }}>
                            <Text style={styles.milestone1RMText}>Est 1RM</Text>
                            <Text style={styles.milestone1RMValue}>{milestone.estimated1RM || 0} kg</Text>
                          </View>
                        )}
                      </View>
                    ))}
                  </View>
                </>
              )}
            </ScrollView>
          </View>
        </View>
      </Modal>
    </Screen>
  );
}

const styles = StyleSheet.create({
  container: {
    paddingHorizontal: theme.spacing.lg,
    paddingTop: theme.spacing.xl,
    paddingBottom: theme.spacing.xl,
    gap: theme.spacing.lg,
  },
  header: {
    gap: theme.spacing.sm,
  },
  title: {
    ...theme.typography.title,
    color: theme.colors.textPrimary,
  },
  body: {
    ...theme.typography.body,
    color: theme.colors.textSecondary,
  },
  center: { flex: 1, justifyContent: "center", alignItems: "center" },
  statsGrid: { flexDirection: "row", gap: 12 },
  statCard: {
    flex: 1,
    backgroundColor: theme.colors.surface,
    padding: 14,
    borderRadius: 12,
    borderWidth: 1,
    borderColor: theme.colors.border,
    gap: 4,
  },
  statLabel: { fontSize: 11, color: theme.colors.textSecondary, fontWeight: "500" },
  statValue: { fontSize: 18, fontWeight: "700", color: theme.colors.textPrimary },

  infoBanner: {
    backgroundColor: "rgba(255, 255, 255, 0.03)",
    padding: 12,
    borderRadius: 8,
    borderWidth: 1,
    borderColor: theme.colors.border,
  },
  infoBannerText: { fontSize: 11, color: theme.colors.textSecondary, lineHeight: 16 },

  sectionContainer: { gap: theme.spacing.md, marginTop: 4 },
  sectionHeaderRow: { flexDirection: "row", justifyContent: "space-between", alignItems: "center", gap: 10 },
  sectionTitle: { fontSize: 18, fontWeight: "700", color: theme.colors.textPrimary, flex: 1 },
  prCounterText: { fontSize: 12, color: theme.colors.textSecondary },

  editGoalsHeaderButton: {
    paddingVertical: 8,
    paddingHorizontal: 12,
    borderRadius: 10,
    backgroundColor: theme.colors.surface,
    borderWidth: 1,
    borderColor: theme.colors.border,
    alignItems: "center",
    justifyContent: "center",
  },
  editGoalsHeaderButtonText: { fontSize: 12, fontWeight: "700", color: theme.colors.accent },

  searchBarInput: {
    backgroundColor: theme.colors.surface,
    borderColor: theme.colors.border,
    borderWidth: 1,
    borderRadius: 8,
    paddingHorizontal: 12,
    paddingVertical: 10,
    color: theme.colors.textPrimary,
    fontSize: 14,
  },

  controlPanelContainer: {
    backgroundColor: theme.colors.surface,
    borderRadius: 14,
    padding: 12,
    borderWidth: 1,
    borderColor: theme.colors.border,
    gap: 8,
  },
  primaryFilterRow: { flexDirection: "row", gap: 6 },
  panelFilterButton: {
    flex: 1,
    paddingVertical: 10,
    paddingHorizontal: 10,
    borderRadius: 10,
    backgroundColor: theme.colors.surface,
    borderWidth: 1,
    borderColor: theme.colors.border,
    alignItems: "center",
    justifyContent: "center",
  },
  panelFilterButtonActive: { backgroundColor: theme.colors.accent, borderColor: theme.colors.accent },
  panelFilterButtonGreenActive: { backgroundColor: "#2e7d32", borderColor: "#4caf50" },
  panelFilterButtonText: { fontSize: 12, fontWeight: "600", color: theme.colors.textSecondary, textAlign: "center" },
  panelFilterButtonTextActive: { color: "#FFFFFF" },

  repInputWrapper: { flexDirection: "row", alignItems: "center", gap: 8, borderTopWidth: 1, borderTopColor: theme.colors.border, paddingTop: 8, marginTop: 2 },
  repTextInput: { flex: 1, height: 36, backgroundColor: "rgba(0, 0, 0, 0.2)", borderRadius: 6, paddingHorizontal: 10, fontSize: 13, color: theme.colors.textPrimary, borderWidth: 1, borderColor: theme.colors.border },
  clearRepButton: { paddingHorizontal: 12, height: 36, justifyContent: "center", alignItems: "center", backgroundColor: theme.colors.surface, borderRadius: 10, borderWidth: 1, borderColor: theme.colors.border },
  clearRepButtonText: { fontSize: 12, color: theme.colors.accent, fontWeight: "700" },

  filterContainer: { gap: 10, marginTop: 2, marginBottom: 4 },
  modalityFilterRow: { flexDirection: "row", flexWrap: "nowrap", justifyContent: "space-between", gap: 4 },
  muscleFilterScroll: { flexDirection: "row", alignItems: "center", gap: 6 },
  overloadHeadline: { fontSize: 20, fontWeight: "700", color: theme.colors.textPrimary, marginTop: theme.spacing.sm },
  overloadSummary: { fontSize: 12, color: theme.colors.textSecondary, marginBottom: theme.spacing.sm },
  overloadAxisRow: { flexDirection: "row", justifyContent: "space-between", marginTop: theme.spacing.xs },
  overloadAxisLabel: { fontSize: 10, color: theme.colors.textMuted },
  filterChip: { paddingHorizontal: 12, paddingVertical: 6, borderRadius: 20, backgroundColor: theme.colors.surface, borderWidth: 1, borderColor: theme.colors.border },
  filterChipText: { fontSize: 12, color: theme.colors.textSecondary, textTransform: "capitalize" },
  chipActive: { backgroundColor: theme.colors.accent, borderColor: theme.colors.accent },
  chipTextActive: { color: "#fff", fontWeight: "600" },

  chartCard: { backgroundColor: theme.colors.surface, borderRadius: 14, borderWidth: 1, borderColor: theme.colors.border, padding: 16, gap: 16 },
  gridContainer: { flexDirection: "row", flexWrap: "wrap", justifyContent: "space-between", rowGap: 16 },
  muscleRowItem: { width: "48%", gap: 6 },
  rowTextContainer: { flexDirection: "row", justifyContent: "space-between", alignItems: "center" },
  muscleNameText: { fontSize: 12, color: theme.colors.textPrimary, fontWeight: "600", flex: 1, marginRight: 4 },
  muscleValueText: { fontSize: 11, color: theme.colors.textSecondary, fontWeight: "500" },
  horizontalTrack: { height: 6, backgroundColor: "rgba(255, 255, 255, 0.05)", borderRadius: 3, overflow: "hidden" },
  horizontalFill: { height: "100%", backgroundColor: theme.colors.accent, borderRadius: 3 },

  toggleButton: { alignItems: "center", justifyContent: "center", paddingVertical: 12, paddingHorizontal: 14, backgroundColor: theme.colors.surface, borderRadius: 10, borderWidth: 1, borderColor: theme.colors.border, marginTop: 4 },
  toggleButtonText: { fontSize: 12, color: theme.colors.accent, fontWeight: "700" },

  horizontalPrGridWrapper: { paddingVertical: 4, gap: 12 },
  prColumnTrack: { flexDirection: "column", gap: 12 },
  prCard: { width: 250, height: 114, backgroundColor: theme.colors.surface, borderWidth: 1, borderColor: theme.colors.border, borderRadius: 14, padding: 14, justifyContent: "center" },
  prCardGreenActive: { borderColor: "#4caf50", backgroundColor: "rgba(46, 125, 50, 0.15)" },
  prCardHeaderRow: { flexDirection: "row", justifyContent: "space-between", alignItems: "center", width: "100%" },
  prExerciseName: { fontSize: 14, fontWeight: "700", color: theme.colors.textPrimary, flex: 1, marginRight: 6 },
  starIconText: { fontSize: 18, color: theme.colors.textSecondary, marginTop: -2 },
  starIconActive: { color: "#4caf50" },
  prWeightText: { fontSize: 22, fontWeight: "800", color: theme.colors.accent, marginTop: 4 },
  prSubtext: { fontSize: 11, color: theme.colors.textSecondary, marginTop: 3 },

  emptyText: { color: theme.colors.textSecondary, fontSize: 14, paddingLeft: 4 },
  historyCard: { backgroundColor: theme.colors.surface, borderRadius: 14, borderWidth: 1, borderColor: theme.colors.border, padding: 14, gap: 10 },
  historyHeader: { flexDirection: "row", justifyContent: "space-between", alignItems: "flex-start" },
  historyRoutineName: { fontSize: 15, fontWeight: "700", color: theme.colors.textPrimary },
  historyDate: { fontSize: 12, color: theme.colors.textSecondary, marginTop: 2 },
  historyDuration: { fontSize: 13, color: theme.colors.textSecondary, fontWeight: "600" },
  divider: { height: 1, backgroundColor: theme.colors.border, opacity: 0.6 },
  setList: { gap: 8 },
  setRow: { flexDirection: "row", justifyContent: "space-between", alignItems: "center" },
  setMainInfo: { flexDirection: "row", alignItems: "center", gap: 6, flex: 1, marginRight: 8 },
  historyExerciseNameText: { fontSize: 13, fontWeight: "600", color: theme.colors.textPrimary, flexShrink: 1 },
  setIndexText: { fontSize: 11, color: theme.colors.textSecondary, backgroundColor: "rgba(255,255,255,0.05)", paddingHorizontal: 4, paddingVertical: 1, borderRadius: 4 },
  setMetricsText: { fontSize: 12, color: theme.colors.textSecondary, fontWeight: "500" },

  paginationRow: { flexDirection: "row", justifyContent: "space-between", alignItems: "center", marginTop: 8, paddingHorizontal: 4 },
  pageButton: { paddingHorizontal: 16, paddingVertical: 12, borderRadius: 10, backgroundColor: theme.colors.surface, borderWidth: 1, borderColor: theme.colors.border, minWidth: 88, alignItems: "center", justifyContent: "center" },
  pageButtonDisabled: { opacity: 0.4, borderColor: "transparent" },
  pageButtonText: { fontSize: 13, fontWeight: "600", color: theme.colors.accent },
  pageButtonTextDisabled: { color: theme.colors.textSecondary },
  pageInfoText: { fontSize: 13, fontWeight: "500", color: theme.colors.textSecondary },

  modalOverlay: { flex: 1, backgroundColor: "rgba(0,0,0,0.7)", justifyContent: "flex-end" },
  modalContent: { backgroundColor: theme.colors.background || "#121212", borderTopLeftRadius: 20, borderTopRightRadius: 20, maxHeight: "85%", padding: theme.spacing.lg },
  modalHeader: { flexDirection: "row", justifyContent: "space-between", alignItems: "center", marginBottom: theme.spacing.lg, paddingBottom: 12, borderBottomWidth: 1, borderColor: theme.colors.border },
  modalTitle: { fontSize: 16, fontWeight: "700", color: theme.colors.textPrimary, flex: 1, marginRight: 10 },
  closeButton: { padding: 4, minWidth: 28, alignItems: "center" },
  closeButtonText: { fontSize: 22, lineHeight: 24, color: theme.colors.textSecondary, fontWeight: "500" },
  modalScrollBody: { gap: 20, paddingBottom: 30 },
  modalSectionTitle: { fontSize: 13, fontWeight: "700", color: theme.colors.textSecondary, textTransform: "uppercase", letterSpacing: 0.5, marginTop: 4 },
  modalHighlightsGrid: { flexDirection: "row", gap: 12 },
  progressionNotice: { padding: 10, borderRadius: 10, backgroundColor: "rgba(0,122,255,0.06)", borderWidth: 1, borderColor: theme.colors.border, marginBottom: 12 },
  progressionNoticeText: { color: theme.colors.textSecondary, fontSize: 12, fontWeight: "600", textAlign: "center" },
  highlightBlock: { flex: 1, backgroundColor: theme.colors.surface, borderRadius: 12, padding: 14, borderWidth: 1, borderColor: theme.colors.border, gap: 4 },
  highlightLabel: { fontSize: 11, color: theme.colors.textSecondary, fontWeight: "500" },
  highlightValue: { fontSize: 20, fontWeight: "800", color: theme.colors.textPrimary },

  goalSetupRow: { flexDirection: "row", justifyContent: "space-between", alignItems: "center", paddingVertical: 4 },
  goalSetupLabel: { fontSize: 14, color: theme.colors.textPrimary, fontWeight: "600", textTransform: "capitalize" },
  goalSetupControlGroup: { flexDirection: "row", alignItems: "center", gap: 6 },
  adjustGoalBtn: { width: 34, height: 34, backgroundColor: theme.colors.surface, borderRadius: 10, alignItems: "center", justifyContent: "center", borderWidth: 1, borderColor: theme.colors.border },
  adjustGoalBtnText: { color: theme.colors.textPrimary, fontSize: 18, fontWeight: "600" },
  goalValueInput: { width: 44, height: 32, backgroundColor: "rgba(0,0,0,0.3)", borderRadius: 6, color: theme.colors.textPrimary, textAlign: "center", fontSize: 14, fontWeight: "700", borderWidth: 1, borderColor: theme.colors.border, padding: 0 },
  saveGoalsActionButton: { backgroundColor: theme.colors.accent, paddingVertical: 14, borderRadius: 12, alignItems: "center", justifyContent: "center", marginTop: 10, marginBottom: 6 },
  saveGoalsActionButtonText: { color: "#FFF", fontWeight: "600", fontSize: 14 },

  svgChartCardContainer: { backgroundColor: theme.colors.surface, borderRadius: 14, borderWidth: 1, borderColor: theme.colors.border, paddingLeft: 32, paddingRight: 32, paddingTop: 40, paddingBottom: 42, marginTop: 8, alignItems: "center", justifyContent: "center" },
  svgFloatingTextColumn: { position: "absolute", width: 60, alignItems: "center", zIndex: 10 },
  svgNodeWeightText: { fontSize: 11, fontWeight: "700", color: theme.colors.textPrimary },
  svgNodeDateText: { fontSize: 9, color: theme.colors.textSecondary, fontWeight: "600", textAlign: "center", lineHeight: 11 },
  milestoneLogList: { gap: 10 },
  milestoneLogCard: { backgroundColor: theme.colors.surface, borderRadius: 10, borderWidth: 1, borderColor: theme.colors.border, padding: 12, flexDirection: "row", justifyContent: "space-between", alignItems: "center" },
  milestoneMainText: { fontSize: 14, fontWeight: "700", color: theme.colors.textPrimary },
  milestoneSubtext: { fontSize: 11, color: theme.colors.textSecondary, marginTop: 2 },
  milestone1RMText: { fontSize: 10, color: theme.colors.textSecondary, fontWeight: "500" },
  milestone1RMValue: { fontSize: 13, fontWeight: "700", color: theme.colors.textPrimary, marginTop: 1 }
});