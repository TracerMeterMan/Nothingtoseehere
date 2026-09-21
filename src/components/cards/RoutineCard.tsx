import React, { useEffect, useRef } from "react";
import { Animated, StyleSheet, Text, View } from "react-native";
import { Routine } from "../../models/routine";
import { exerciseLibrary } from "../../data/exerciseLibrary";
import { theme } from "../../theme/theme";
import { getRoutineMuscleTargets } from "../../utils/routineMuscles";

interface RoutineCardProps {
  routine: Routine;
  readiness?: { percent: number; label: string; muscles?: string; recommended?: boolean };
}

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

      {/* 💡 NEW: Muscles Targeted Section Footer Block */}
      <Text style={styles.muscleSectionTitle}>Targeted Muscles:</Text>
      <View style={styles.muscleTagContainer}>
        {getRoutineMuscleTargets(routine.exercises).map(({ muscleId, label, type }) => (
          <View 
            key={muscleId} 
            style={[
              styles.muscleTag, 
              type === "Primary" ? styles.tagPrimary : styles.tagSecondary
            ]}
          >
            <Text style={[styles.tagText, type === "Primary" && styles.tagTextPrimary]}>
              {label} • {type}
            </Text>
          </View>
        ))}
      </View>
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
