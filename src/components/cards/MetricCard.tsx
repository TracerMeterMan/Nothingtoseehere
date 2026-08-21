import { StyleSheet, Text, View } from "react-native";

import { theme } from "../../theme/theme";

type MetricCardProps = {
  label: string;
  value: string;
  detail: string;
};

export function MetricCard({ label, value, detail }: MetricCardProps) {
  return (
    <View style={styles.card}>
      <Text style={styles.label}>{label}</Text>
      <Text style={styles.value}>{value}</Text>
      <Text style={styles.detail}>{detail}</Text>
    </View>
  );
}

const styles = StyleSheet.create({
  card: {
    flex: 1,
    minWidth: 150,
    padding: theme.spacing.md,
    borderRadius: 8,
    borderWidth: 1,
    borderColor: theme.colors.border,
    backgroundColor: theme.colors.surface,
  },
  label: {
    ...theme.typography.caption,
    color: theme.colors.textMuted,
  },
  value: {
    ...theme.typography.heading,
    marginTop: theme.spacing.xs,
    color: theme.colors.textPrimary,
  },
  detail: {
    ...theme.typography.caption,
    marginTop: theme.spacing.xs,
    color: theme.colors.textSecondary,
  },
});
