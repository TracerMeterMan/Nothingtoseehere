import {
  AppState,
  AppStateStatus,
  ScrollView,
  StyleSheet,
  Text,
  View,
} from "react-native";
import { useCallback, useEffect, useState } from "react";
import AsyncStorage from "@react-native-async-storage/async-storage";

import { RecoveryRow } from "../../components/cards/RecoveryRow";
import { Screen } from "../../components/layout/Screen";
import { BodyRecoveryMap } from "../../components/recovery/BodyRecoveryMap";
import { muscleGroups } from "../../data/muscleGroups";
import { MuscleRecoveryPreview } from "../../models/muscle";
import { theme } from "../../theme/theme";
import { calculateRecovery } from "../../utils/recovery";

const WORKOUT_HISTORY_KEY = "@workout_history";

export function RecoveryScreen() {
  const [recoveryItems, setRecoveryItems] = useState<MuscleRecoveryPreview[]>([]);
  const [overallRecoveryPercent, setOverallRecoveryPercent] = useState(100);
  const [isLoading, setIsLoading] = useState(true);

  const computeRecovery = useCallback(async () => {
    try {
      const saved = await AsyncStorage.getItem(WORKOUT_HISTORY_KEY);
      const history = saved ? JSON.parse(saved) : [];
      const recovery = calculateRecovery(history);
      setRecoveryItems(recovery.items);
      setOverallRecoveryPercent(recovery.overallRecoveryPercent);
    } catch (e) {
      console.error("Recovery failed", e);
    } finally {
      setIsLoading(false);
    }
  }, []);

  useEffect(() => {
    computeRecovery();
  }, [computeRecovery]);

  useEffect(() => {
    const sub = AppState.addEventListener("change", (next: AppStateStatus) => {
      if (next === "active") {
        computeRecovery();
      }
    });

    return () => sub.remove();
  }, [computeRecovery]);

  if (isLoading) {
    return (
      <Screen padded={false}>
        <ScrollView contentContainerStyle={styles.content}>
          <Text style={styles.title}>Recovery</Text>
          <Text style={styles.body}>Loading estimated readiness...</Text>
        </ScrollView>
      </Screen>
    );
  }

  const readyCount = recoveryItems.filter((r) => r.status === "ready").length;

  return (
    <Screen padded={false}>
      <ScrollView contentContainerStyle={styles.content}>
        <View style={styles.summaryCard}>
          <Text style={styles.summaryValue}>{overallRecoveryPercent}% recovered</Text>
          <Text style={styles.body}>
            {readyCount}/{recoveryItems.length} muscles fully recovered
          </Text>
        </View>

        <View style={styles.recoveryLayout}>
          <BodyRecoveryMap recoveryItems={recoveryItems} />

          <View style={styles.sidePanel}>
            <Text style={styles.panelTitle}>Muscles</Text>

            {recoveryItems.map((recovery) => {
              const muscle = muscleGroups.find(
                (m) => m.id === recovery.muscleId
              );

              return (
                <RecoveryRow
                  key={recovery.muscleId}
                  muscleName={muscle?.name ?? recovery.muscleId}
                  recovery={recovery}
                />
              );
            })}
          </View>
        </View>

        <Text style={styles.note}>
          Recovery is an estimate, not a guarantee.
        </Text>
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
  summaryCard: {
    gap: theme.spacing.xs,
    padding: theme.spacing.md,
    borderRadius: 14,
    borderWidth: 1,
    borderColor: theme.colors.border,
    backgroundColor: theme.colors.surface,
  },
  summaryValue: {
    fontSize: 20,
    fontWeight: "700",
    color: theme.colors.textPrimary,
  },
  title: {
    ...theme.typography.title,
    color: theme.colors.textPrimary,
  },
  body: {
    ...theme.typography.body,
    color: theme.colors.textSecondary,
  },
  recoveryLayout: {
    gap: theme.spacing.md,
  },
  sidePanel: {
    paddingHorizontal: theme.spacing.md,
    paddingVertical: theme.spacing.md,
    borderRadius: 14,
    borderWidth: 1,
    borderColor: theme.colors.border,
    backgroundColor: theme.colors.surface,
  },
  panelTitle: {
    fontSize: 18,
    fontWeight: "700",
    marginBottom: theme.spacing.sm,
    color: theme.colors.textPrimary,
  },
  note: {
    ...theme.typography.caption,
    color: theme.colors.textMuted,
  },
});
