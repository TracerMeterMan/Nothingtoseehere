import { useEffect, useState } from "react";
import { AppState, Modal, Pressable, StyleSheet, Text, View } from "react-native";
import AsyncStorage from "@react-native-async-storage/async-storage";
import { theme } from "../../theme/theme";
import { Button } from "../ui/Button";

// Common storage keys used across workout tracking apps
const QUEST_STATE_KEY = "@onboarding_quests";
const WORKOUT_HISTORY_KEY = "@workout_history";
const ROUTINES_KEY = "@routines";
const SPLITS_KEY = "@workout_splits";
const RECOVERY_LOG_KEY = "@recovery_data";
const PR_HISTORY_KEY = "@personal_records";
const QUEST_HIDDEN_KEY = "@starter_quests_hidden";

type Quest = { id: string; title: string; detail: string };

const quests: Quest[] = [
  { 
    id: "routine", 
    title: "Create a custom routine", 
    detail: "Head over to Routines and create a custom routine tailored to your exercises." 
  },
  { 
    id: "generate", 
    title: "Use the smart routine generator.", 
    detail: "Head over to routines and use the generator tool to automatically build a program based on your equipment and muscle targets." 
  },
  { 
    id: "split", 
    title: "Create a workout split", 
    detail: "Use home screen to design a multi-day training split, check how good it is by viewing the split score." 
  },
  { 
    id: "recovery", 
    title: "Check the recovery screen", 
    detail: "Open up the recovery tab and view your estimated  recovery status." 
  },
  { 
    id: "prs", 
    title: "View your Personal Records (PRs)", 
    detail: "Check metrics screen to view auto-logged personal records and milestone badges." 
  },
  { 
    id: "complete", 
    title: "Complete your first routine", 
    detail: "Through homescreen, execute any routine you created fully, notice the automatic logging and smart rest timers." 
  },
];

export function StarterQuestSidebar() {
  const [completed, setCompleted] = useState<Record<string, boolean>>({});
  const [hidden, setHidden] = useState(false);
  const [selectedQuest, setSelectedQuest] = useState<Quest | null>(null);
  const [expanded, setExpanded] = useState(true);
  const [showCompletion, setShowCompletion] = useState(false);
  const [completedDismissed, setCompletedDismissed] = useState(false);
  const [hasLoadedQuestState, setHasLoadedQuestState] = useState(false);

  const dismissCompletedQuests = async () => {
    setShowCompletion(false);
    setCompletedDismissed(true);
    setHidden(true);
    await AsyncStorage.setItem(QUEST_HIDDEN_KEY, "true");
  };

  const refresh = async () => {
    try {
      const [
        storedQuestState, 
        historyData, 
        routinesData, 
        splitsData, 
        recoveryData, 
        prData, 
        storedHidden
      ] = await Promise.all([
        AsyncStorage.getItem(QUEST_STATE_KEY),
        AsyncStorage.getItem(WORKOUT_HISTORY_KEY),
        AsyncStorage.getItem(ROUTINES_KEY),
        AsyncStorage.getItem(SPLITS_KEY),
        AsyncStorage.getItem(RECOVERY_LOG_KEY),
        AsyncStorage.getItem(PR_HISTORY_KEY),
        AsyncStorage.getItem(QUEST_HIDDEN_KEY),
      ]);

      const questFlags = storedQuestState ? JSON.parse(storedQuestState) : {};
      const workoutHistory = historyData ? JSON.parse(historyData) : [];
      const routines = routinesData ? JSON.parse(routinesData) : [];
      const splits = splitsData ? JSON.parse(splitsData) : [];
      const prs = prData ? JSON.parse(prData) : [];

      // Evaluation triggers for each specific quest requirement
      const nextCompleted = {
        // 1. Made a custom routine (check custom flag or array length of routines)
        routine: !!questFlags.customRoutine || routines.some((r: any) => !r.generated),
        
        // 2. Generated a routine (check generator flag or generated tags)
        generate: !!questFlags.generateRoutine || routines.some((r: any) => r.generated || r.isAi),
        
        // 3. Made a split with split scores/frequency
        split: !!questFlags.customSplit || splits.length > 0,
        
        // 4. Checked recovery screen (flag tripped when user visits recovery tab)
        recovery: !!questFlags.checkedRecovery || recoveryData !== null,
        
        // 5. Checked PRs (flag or logged PR records list exists)
        prs: !!questFlags.checkedPrs || prs.length > 0 || workoutHistory.some((s: any) => s.hasPrs),
        
        // 6. Completed first routine session
        complete: workoutHistory.some((session: any) => session.status === "completed"),
      };

      const allComplete = Object.values(nextCompleted).every(Boolean);
      if (allComplete && storedHidden !== "true") {
        await AsyncStorage.setItem(QUEST_HIDDEN_KEY, "true");
      }

      setCompleted((previous) => {
        if (!storedHidden && !Object.values(previous).every(Boolean) && allComplete) {
          setShowCompletion(true);
        }
        return nextCompleted;
      });

      const isHidden = storedHidden === "true" && !showCompletion;
      setHidden(isHidden);
      setCompletedDismissed(isHidden);
      setHasLoadedQuestState(true);
    } catch (error) {
      console.error("Failed to refresh dynamic starter quests", error);
    }
  };

  useEffect(() => {
    refresh();
    const refreshTimer = setInterval(refresh, 1000);
    const subscription = AppState.addEventListener("change", (state) => {
      if (state === "active") refresh();
    });
    return () => {
      clearInterval(refreshTimer);
      subscription.remove();
    };
  }, []);

  const completedCount = quests.filter((quest) => completed[quest.id]).length;
  if (!hasLoadedQuestState || hidden || (completedCount === quests.length && completedDismissed)) return null;

  return (
    <>
      <View style={[styles.shell, !expanded && styles.shellCollapsed]}>
        {expanded ? (
          <>
            <View style={styles.header}>
              <View style={styles.headerCopy}>
                <Text style={styles.eyebrow}>STARTER QUESTS</Text>
              </View>
              <View style={styles.progressTrack}>
                <View style={[styles.progressFill, { width: `${(completedCount / quests.length) * 100}%` }]} />
              </View>
              <Text style={styles.count}>{completedCount}/{quests.length}</Text>
              <Pressable onPress={() => setExpanded(false)} hitSlop={8} style={styles.utilityButton}>
                <Text style={styles.utilityText}>Minimize</Text>
              </Pressable>
            </View>
            {quests.map((quest) => (
              <Pressable key={quest.id} onPress={() => setSelectedQuest(quest)} style={styles.row}>
                <View style={[styles.check, completed[quest.id] && styles.checkDone]}>
                  {completed[quest.id] && <Text style={styles.checkText}>✓</Text>}
                </View>
                <Text style={[styles.rowText, completed[quest.id] && styles.rowTextDone]} numberOfLines={1}>{quest.title}</Text>
                <Text style={styles.infoText}>How</Text>
              </Pressable>
            ))}
            <Pressable onPress={() => { setHidden(true); AsyncStorage.setItem(QUEST_HIDDEN_KEY, "true"); }} style={styles.skipButton}>
              <Text style={styles.skipText}>Skip starter quests</Text>
            </Pressable>
          </>
        ) : (
          <Pressable onPress={() => setExpanded(true)} style={styles.collapsedButton}>
            <Text style={styles.collapsedText}>Starter quests  {completedCount}/{quests.length}  Expand</Text>
          </Pressable>
        )}
      </View>

      <Modal visible={!!selectedQuest} transparent animationType="fade" onRequestClose={() => setSelectedQuest(null)}>
        <View style={styles.modalBackdrop}>
          <View style={styles.modalCard}>
            {selectedQuest && <>
              <Text style={styles.modalEyebrow}>STARTER QUEST</Text>
              <Text style={styles.modalTitle}>{selectedQuest.title}</Text>
              <Text style={styles.modalDetail}>{selectedQuest.detail}</Text>
              <Button fullWidth onPress={() => setSelectedQuest(null)}>Got it</Button>
            </>}
          </View>
        </View>
      </Modal>

      <Modal visible={showCompletion} transparent animationType="fade" onRequestClose={dismissCompletedQuests}>
        <View style={styles.modalBackdrop}>
          <View style={styles.modalCard}>
            <Text style={styles.modalEyebrow}>STARTER QUESTS COMPLETE</Text>
            <Text style={styles.modalTitle}>You are all set up.</Text>
            <Text style={styles.modalDetail}>You've explored routines, splits, recovery tracking, and completed your sessions! The guide will now disappear.</Text>
            <Button fullWidth onPress={dismissCompletedQuests}>Continue training</Button>
          </View>
        </View>
      </Modal>
    </>
  );
}

const styles = StyleSheet.create({
  shell: { position: "absolute", right: 12, top: 48, zIndex: 30, width: 260, backgroundColor: theme.colors.surface, borderWidth: 1, borderColor: theme.colors.border, borderRadius: 14, padding: 12, shadowColor: "#000", shadowOpacity: 0.25, shadowRadius: 8, shadowOffset: { width: 0, height: 3 }, elevation: 5 },
  shellCollapsed: { width: 160, padding: 0, overflow: "hidden" },
  header: { flexDirection: "row", alignItems: "center", gap: 8, marginBottom: 6 },
  headerCopy: { flex: 1 },
  eyebrow: { ...theme.typography.caption, color: theme.colors.accent, fontSize: 9, fontWeight: "800", letterSpacing: 0.8 },
  title: { color: theme.colors.textPrimary, fontSize: 16, lineHeight: 20, fontWeight: "800" },
  count: { color: theme.colors.accent, fontSize: 13, fontWeight: "800" },
  utilityButton: { paddingHorizontal: 5, paddingVertical: 3 },
  utilityText: { ...theme.typography.caption, color: theme.colors.textSecondary, fontSize: 10 },
  progressTrack: { height: 4, borderRadius: 4, backgroundColor: theme.colors.background, overflow: "hidden", marginBottom: 4 }, 
  progressFill: { height: "100%", borderRadius: 4, backgroundColor: theme.colors.accent },
  row: { flexDirection: "row", alignItems: "center", gap: 8, borderTopWidth: 1, borderTopColor: theme.colors.border, paddingVertical: 8 },
  check: { width: 17, height: 17, borderRadius: 5, borderWidth: 1, borderColor: theme.colors.border, alignItems: "center", justifyContent: "center" },
  checkDone: { backgroundColor: theme.colors.accent, borderColor: theme.colors.accent },
  checkText: { color: theme.colors.background, fontSize: 9, fontWeight: "800" },
  rowText: { flex: 1, color: theme.colors.textPrimary, fontSize: 12, fontWeight: "700" },
  rowTextDone: { color: theme.colors.textMuted, textDecorationLine: "line-through" },
  infoText: { color: theme.colors.accent, fontSize: 10, fontWeight: "700" },
  skipButton: { alignSelf: "flex-start", paddingTop: 4 },
  skipText: { ...theme.typography.caption, color: theme.colors.textMuted, fontSize: 10 },
  collapsedButton: { alignItems: "center", justifyContent: "center", paddingVertical: 8 },
  collapsedText: { ...theme.typography.caption, color: theme.colors.textPrimary, fontSize: 10, fontWeight: "700" },
  modalBackdrop: { flex: 1, backgroundColor: "rgba(0, 0, 0, 0.62)", alignItems: "center", justifyContent: "center", padding: 24 },
  modalCard: { width: "100%", maxWidth: 340, backgroundColor: theme.colors.surface, borderWidth: 1, borderColor: theme.colors.border, borderRadius: 16, padding: 20, gap: 10 },
  modalEyebrow: { ...theme.typography.caption, color: theme.colors.accent, fontWeight: "800", letterSpacing: 0.8 },
  modalTitle: { ...theme.typography.heading, color: theme.colors.textPrimary },
  modalDetail: { ...theme.typography.body, color: theme.colors.textSecondary, lineHeight: 22 },
});