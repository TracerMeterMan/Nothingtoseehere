import React, { useEffect, useRef } from "react";
import { Animated, StyleSheet, Text, View } from "react-native";
import { Routine } from "../../models/routine";
import { exerciseLibrary } from "../../data/exerciseLibrary";
import { theme } from "../../theme/theme";

interface RoutineCardProps {
  routine: Routine;
  readiness?: { percent: number; label: string; muscles?: string; recommended?: boolean };
}

/**
 * Splits the routine's muscles into the ones some exercise trains as a primary
 * mover and the ones that only ever show up as a secondary.
 */
export const getTargetedMusclesSummary = (routineExercises: { exerciseId: string }[]) => {
  const primary = new Set<string>();
  const secondary = new Set<string>();

  (routineExercises || []).forEach((re) => {
    const exercise = exerciseLibrary.find((e) => e.id === re.exerciseId);
    exercise?.muscles?.forEach((m) => {
      if (m.load === "high") primary.add(m.muscleId);
      else if (m.load === "medium") secondary.add(m.muscleId);
    });
  });

  return {
    primary: [...primary],
    secondary: [...secondary].filter((muscleId) => !primary.has(muscleId)),
  };
};

export function RoutineCard({ routine, readiness }: RoutineCardProps) {
  const entrance = useRef(new Animated.Value(0)).current;

  useEffect(() => {
    Animated.timing(entrance, { toValue: 1, duration: 220, useNativeDriver: true }).start();
  }, [entrance]);

  return (
    <Animated.View style={[styles.cardContainer, { opacity: entrance, transform: [{ translateY: entrance.interpolate({ inputRange: [0, 1], outputRange: [8, 0] }) }] }]}>
      <Text style={styles.cardTitle}>{routine.name}</Text>
      <Text style={styles.cardDescription}>{routine.description}</Text>
      
      <View style={styles.statsRow}>
        <Text style={styles.cardStats}>{routine.exerciseCount} Exercises</Text>
        <Text style={styles.cardStats}>•</Text>
        <Text style={styles.cardStats}>{routine.estimatedMinutes} mins</Text>
      </View>

      {(() => {
        const { primary, secondary } = getTargetedMusclesSummary(routine.exercises);
        return (
          <>
            {primary.length > 0 && (
              <>
                <Text style={styles.muscleSectionTitle}>Primary in at least one exercise:</Text>
                <View style={styles.muscleTagContainer}>
                  {primary.map((muscleId) => (
                    <View key={muscleId} style={[styles.muscleTag, styles.tagPrimary]}>
                      <Text style={[styles.tagText, styles.tagTextPrimary]}>{muscleId}</Text>
                    </View>
                  ))}
                </View>
              </>
            )}
            {secondary.length > 0 && (
              <>
                <Text style={styles.muscleSectionTitle}>Secondary in at least one exercise:</Text>
                <View style={styles.muscleTagContainer}>
                  {secondary.map((muscleId) => (
                    <View key={muscleId} style={[styles.muscleTag, styles.tagSecondary]}>
                      <Text style={styles.tagText}>{muscleId}</Text>
                    </View>
                  ))}
                </View>
              </>
            )}
          </>
        );
      })()}
      {readiness && (
        <View style={styles.readinessBlock}>
          <Text style={styles.readinessTitle}>
            {readiness.recommended ? "Recommended today · " : ""}{readiness.percent}% recovered · {readiness.label}
          </Text>
          {!!readiness.muscles && <Text style={styles.readinessMuscles}>{readiness.muscles}</Text>}
        </View>
      )}
    </Animated.View>
  );
}

const styles = StyleSheet.create({
  cardContainer: {
    backgroundColor: theme.colors.surface,
    padding: 16,
    borderRadius: 12,
    borderWidth: 1,
    borderColor: theme.colors.border,
    gap: 8,
    marginBottom: theme.spacing.md, // Soft spacing inside list selectors
  },
  cardTitle: { 
    fontSize: 16, 
    fontWeight: "700", 
    color: theme.colors.textPrimary 
  },
  cardDescription: { 
    fontSize: 13, 
    color: theme.colors.textSecondary 
  },
  statsRow: { 
    flexDirection: "row", 
    gap: 6, 
    alignItems: "center" 
  },
  cardStats: { 
    fontSize: 12, 
    color: theme.colors.textSecondary, 
    fontWeight: "500" 
  },
  // 💡 Match style configuration exactly with RoutinesScreen layout rules
  muscleSectionTitle: { 
    fontSize: 11, 
    fontWeight: "600", 
    color: theme.colors.textSecondary, 
    marginTop: 4, 
    textTransform: "uppercase", 
    letterSpacing: 0.5 
  },
  muscleTagContainer: { 
    flexDirection: "row", 
    flexWrap: "wrap", 
    gap: 6 
  },
  muscleTag: { 
    paddingHorizontal: 8, 
    paddingVertical: 4, 
    borderRadius: 6, 
    borderWidth: 1 
  },
  tagPrimary: { 
    backgroundColor: "rgba(255, 69, 58, 0.12)", 
    borderColor: "rgba(255, 69, 58, 0.5)" 
  },
  tagSecondary: { 
    backgroundColor: "rgba(0, 122, 255, 0.08)", 
    borderColor: "rgba(0, 122, 255, 0.3)" 
  },
  tagText: { 
    fontSize: 11, 
    color: theme.colors.textSecondary, 
    textTransform: "capitalize" 
  },
  tagTextPrimary: { 
    color: theme.colors.textPrimary, 
    fontWeight: "600" 
  },
  readinessBlock: { marginTop: 2, paddingTop: 10, borderTopWidth: 1, borderTopColor: theme.colors.border, gap: 3 },
  readinessTitle: { fontSize: 12, fontWeight: "700", color: theme.colors.textPrimary },
  readinessMuscles: { fontSize: 11, color: theme.colors.textSecondary, lineHeight: 16 },
});
