import { StyleSheet, Text, View } from "react-native";

import { MuscleRecoveryPreview, RecoveryStatus } from "../../models/muscle";
import { theme } from "../../theme/theme";
import { getRecoveryStatusColors } from "../recovery/recoveryStatusStyles";

const statusLabels: Record<RecoveryStatus, string> = {
  ready: "Ready",
  light: "Light fatigue",
  moderate: "Moderate fatigue",
  high: "High fatigue",
};

type RecoveryRowProps = {
  muscleName: string;
  recovery: MuscleRecoveryPreview;
};

export function RecoveryRow({ muscleName, recovery }: RecoveryRowProps) {
  const detail =
    recovery.hoursRemaining === 0
      ? "Train normally"
      : `${recovery.hoursRemaining}h estimated`;
  const statusColors = getRecoveryStatusColors(recovery.status);

  return (
    <View style={styles.row}>
      <View>
        <Text style={styles.name}>{muscleName}</Text>
        <Text style={styles.detail}>{detail}</Text>
      </View>
      <View style={[styles.badge, { backgroundColor: statusColors.background }]}>
        <Text style={[styles.badgeText, { color: statusColors.foreground }]}>
          {statusLabels[recovery.status]}
        </Text>
      </View>
    </View>
  );
}

const styles = StyleSheet.create({
  row: {
    flexDirection: "row",
    alignItems: "center",
    justifyContent: "space-between",
    gap: theme.spacing.md,
    paddingVertical: theme.spacing.sm,
  },
  name: {
    ...theme.typography.body,
    color: theme.colors.textPrimary,
  },
  detail: {
    ...theme.typography.caption,
    marginTop: 2,
    color: theme.colors.textMuted,
  },
  badge: {
    paddingHorizontal: theme.spacing.sm,
    paddingVertical: theme.spacing.xs,
    borderRadius: 8,
  },
  badgeText: {
    ...theme.typography.caption,
  },
});
