import { useState } from "react";
import { StyleSheet, Text, TouchableOpacity, View } from "react-native";
import Svg, {
  Circle,
  Ellipse,
  G,
  Path,
  Rect,
} from "react-native-svg";

import {
  MuscleGroupId,
  MuscleRecoveryPreview,
} from "../../models/muscle";
import { theme } from "../../theme/theme";
import { getRecoveryStatusColors } from "./recoveryStatusStyles";

type BodyRecoveryMapProps = {
  recoveryItems: MuscleRecoveryPreview[];
};

type MuscleShape = {
  id: MuscleGroupId;
  label: string;
  path: string;
};

const frontShapes: MuscleShape[] = [
  {
    id: "frontDelts",
    label: "Front delts",
    path: "M75 86 C60 90 50 105 46 125 L66 130 C70 114 78 102 92 96 Z M125 86 C140 90 150 105 154 125 L134 130 C130 114 122 102 108 96 Z",
  },

  {
    id: "sideDelts",
    label: "Side delts",
    path: "M52 104 C43 108 39 120 41 134 C43 143 50 148 58 145 L67 130 C62 122 60 112 62 106 Z M148 104 C157 108 161 120 159 134 C157 143 150 148 142 145 L133 130 C138 122 140 112 138 106 Z",
  },

  {
    id: "chest",
    label: "Chest",
    path: "M72 102 C82 92 96 96 100 108 C104 96 118 92 128 102 C126 122 116 134 100 134 C84 134 74 122 72 102 Z",
  },

  {
    id: "biceps",
    label: "Biceps",
    path: "M44 130 C40 150 38 166 42 184 L58 180 C56 160 60 146 66 132 Z M156 130 C160 150 162 166 158 184 L142 180 C144 160 140 146 134 132 Z",
  },

  {
    id: "forearms",
    label: "Forearms",
    path: "M42 184 C39 205 41 222 48 238 L62 232 C56 214 56 198 58 180 Z M158 184 C161 205 159 222 152 238 L138 232 C144 214 144 198 142 180 Z",
  },

  {
    id: "abs",
    label: "Abs",
    path: "M82 136 L118 136 C122 162 119 187 100 200 C81 187 78 162 82 136 Z",
  },

  {
    id: "obliques",
    label: "Obliques",
    path: "M66 135 C76 156 78 178 75 198 L91 201 C86 178 87 155 82 136 Z M134 135 C124 156 122 178 125 198 L109 201 C114 178 113 155 118 136 Z",
  },

  {
    id: "hipFlexors",
    label: "Hip flexors",
    path: "M77 202 C88 210 94 222 96 240 L81 242 C76 226 71 214 64 207 Z M123 202 C112 210 106 222 104 240 L119 242 C124 226 129 214 136 207 Z",
  },

  {
    id: "quads",
    label: "Quads",
    path: "M74 238 C72 270 76 304 88 328 L101 324 C98 292 98 264 96 240 Z M126 238 C128 270 124 304 112 328 L99 324 C102 292 102 264 104 240 Z",
  },

  {
    id: "calves",
    label: "Calves",
    path: "M84 330 C78 360 80 386 91 410 L103 408 C98 377 98 352 101 326 Z M116 330 C122 360 120 386 109 410 L97 408 C102 377 102 352 99 326 Z",
  },
];

const backShapes: MuscleShape[] = [
  {
    id: "traps",
    label: "Traps",
    path: "M79 82 C87 96 94 103 100 106 C106 103 113 96 121 82 L130 102 C119 114 109 119 100 120 C91 119 81 114 70 102 Z",
  },

  {
    id: "rearDelts",
    label: "Rear delts",
    path: "M72 98 C58 102 49 112 46 128 L66 132 C70 119 78 110 91 104 Z M128 98 C142 102 151 112 154 128 L134 132 C130 119 122 110 109 104 Z",
  },

  {
    id: "rhomboids",
    label: "Rhomboids",
    path: "M74 106 C84 112 92 118 100 124 C108 118 116 112 126 106 C126 122 118 136 100 143 C82 136 74 122 74 106 Z",
  },

  {
    id: "lats",
    label: "Lats",
    path: "M68 124 C78 145 80 168 72 194 L91 202 C91 174 94 153 100 143 C106 153 109 174 109 202 L128 194 C120 168 122 145 132 124 C120 136 108 144 100 145 C92 144 80 136 68 124 Z",
  },

  {
    id: "triceps",
    label: "Triceps",
    path: "M44 130 C39 150 39 168 45 186 L60 181 C57 160 60 145 67 132 Z M156 130 C161 150 161 168 155 186 L140 181 C143 160 140 145 133 132 Z",
  },

  {
    id: "forearms",
    label: "Forearms",
    path: "M45 186 C40 208 42 225 49 239 L63 232 C58 212 58 197 60 181 Z M155 186 C160 208 158 225 151 239 L137 232 C142 212 142 197 140 181 Z",
  },

  {
    id: "lowerBack",
    label: "Lower back",
    path: "M80 196 C92 204 108 204 120 196 C121 213 113 224 100 229 C87 224 79 213 80 196 Z",
  },

  {
    id: "glutes",
    label: "Glutes",
    path: "M70 225 C82 216 94 220 100 232 C106 220 118 216 130 225 C128 246 116 258 100 258 C84 258 72 246 70 225 Z",
  },

  {
    id: "hamstrings",
    label: "Hamstrings",
    path: "M74 258 C73 287 78 313 88 332 L101 328 C98 301 98 278 99 258 Z M126 258 C127 287 122 313 112 332 L99 328 C102 301 102 278 101 258 Z",
  },

  {
    id: "calves",
    label: "Calves",
    path: "M84 334 C78 362 80 388 91 411 L103 408 C98 378 98 354 101 329 Z M116 334 C122 362 120 388 109 411 L97 408 C102 378 102 354 99 329 Z",
  },
];

export function BodyRecoveryMap({
  recoveryItems,
}: BodyRecoveryMapProps) {
  const [view, setView] = useState<"front" | "back">("front");

  const recoveryByMuscle = new Map(
    recoveryItems.map((recovery) => [
      recovery.muscleId,
      recovery,
    ]),
  );

  const colorFor = (muscleId: MuscleGroupId) => {
    const recovery = recoveryByMuscle.get(muscleId);

    return getRecoveryStatusColors(
      recovery?.status ?? "ready",
    ).foreground;
  };

  const shapes =
    view === "front" ? frontShapes : backShapes;

  return (
    <View style={styles.container}>
      <Text style={styles.title}>Muscle map</Text>

      <View style={styles.legend}>
        <LegendDot
          color={theme.colors.accent}
          label="Ready"
        />
        <LegendDot
          color={theme.colors.warning}
          label="Light / moderate fatigue"
        />
        <LegendDot
          color={theme.colors.danger}
          label="High fatigue"
        />
      </View>

      <View style={styles.toggleContainer}>
        <TouchableOpacity
          activeOpacity={0.8}
          onPress={() => setView("front")}
          style={[
            styles.toggleButton,
            view === "front" &&
              styles.toggleButtonActive,
          ]}
        >
          <Text
            style={[
              styles.toggleText,
              view === "front" &&
                styles.toggleTextActive,
            ]}
          >
            Front
          </Text>
        </TouchableOpacity>

        <TouchableOpacity
          activeOpacity={0.8}
          onPress={() => setView("back")}
          style={[
            styles.toggleButton,
            view === "back" &&
              styles.toggleButtonActive,
          ]}
        >
          <Text
            style={[
              styles.toggleText,
              view === "back" &&
                styles.toggleTextActive,
            ]}
          >
            Back
          </Text>
        </TouchableOpacity>
      </View>

      <View style={styles.maps}>
        <AnatomyFigure
          title={view === "front" ? "Front" : "Back"}
          shapes={shapes}
          colorFor={colorFor}
        />
      </View>
    </View>
  );
}

function AnatomyFigure({
  title,
  shapes,
  colorFor,
}: {
  title: string;
  shapes: MuscleShape[];
  colorFor: (muscleId: MuscleGroupId) => string;
}) {
  return (
    <View style={styles.figure}>
      <Svg
        width="100%"
        height={360}
        viewBox="0 0 200 430"
      >
        <G opacity={0.52}>
          <Circle
            cx={100}
            cy={48}
            r={24}
            stroke={theme.colors.textMuted}
            strokeWidth={2}
            fill="none"
          />

          <Rect
            x={83}
            y={70}
            width={34}
            height={18}
            rx={8}
            fill={theme.colors.surfaceRaised}
          />

          <Ellipse
            cx={100}
            cy={156}
            rx={42}
            ry={70}
            stroke={theme.colors.border}
            strokeWidth={2}
            fill="none"
          />

          <Path
            d="M66 124 C47 151 40 190 49 239"
            stroke={theme.colors.border}
            strokeWidth={6}
            strokeLinecap="round"
            fill="none"
          />

          <Path
            d="M134 124 C153 151 160 190 151 239"
            stroke={theme.colors.border}
            strokeWidth={6}
            strokeLinecap="round"
            fill="none"
          />

          <Path
            d="M86 255 C77 306 78 362 92 410"
            stroke={theme.colors.border}
            strokeWidth={6}
            strokeLinecap="round"
            fill="none"
          />

          <Path
            d="M114 255 C123 306 122 362 108 410"
            stroke={theme.colors.border}
            strokeWidth={6}
            strokeLinecap="round"
            fill="none"
          />
        </G>

        {shapes.map((shape) => {
          const color = colorFor(shape.id);

          return (
            <Path
              key={`${title}-${shape.id}`}
              d={shape.path}
              fill={color}
              fillOpacity={0.5}
              stroke={color}
              strokeWidth={2}
            />
          );
        })}
      </Svg>
    </View>
  );
}

function LegendDot({
  color,
  label,
}: {
  color: string;
  label: string;
}) {
  return (
    <View style={styles.legendItem}>
      <View
        style={[
          styles.dot,
          { backgroundColor: color },
        ]}
      />

      <Text style={styles.legendLabel}>
        {label}
      </Text>
    </View>
  );
}

const styles = StyleSheet.create({
  container: {
    gap: theme.spacing.md,
    padding: theme.spacing.md,
    borderRadius: 14,
    borderWidth: 1,
    borderColor: theme.colors.border,
    backgroundColor: theme.colors.surface,
  },

  title: {
    fontSize: 18,
    fontWeight: "700",
    color: theme.colors.textPrimary,
  },

  legend: {
    flexDirection: "row",
    flexWrap: "wrap",
    gap: theme.spacing.md,
  },

  legendItem: {
    flexDirection: "row",
    alignItems: "center",
    gap: theme.spacing.xs,
  },

  dot: {
    width: 10,
    height: 10,
    borderRadius: 5,
  },

  legendLabel: {
    ...theme.typography.caption,
    color: theme.colors.textSecondary,
  },

  toggleContainer: {
    flexDirection: "row",
    alignSelf: "center",
    backgroundColor: theme.colors.surfaceRaised,
    borderRadius: 999,
    padding: 3,
    borderWidth: 1,
    borderColor: theme.colors.border,
  },

  toggleButton: {
    paddingVertical: 7,
    paddingHorizontal: 24,
    borderRadius: 999,
  },

  toggleButtonActive: {
    backgroundColor: theme.colors.accent,
  },

  toggleText: {
    ...theme.typography.caption,
    color: theme.colors.textSecondary,
    fontWeight: "600",
  },

  toggleTextActive: {
    color: "#ffffff",
    fontWeight: "700",
  },

  maps: {
    flexDirection: "row",
    flexWrap: "wrap",
    gap: theme.spacing.md,
  },

  figure: {
    flexGrow: 1,
    flexBasis: 220,
    minWidth: 220,
    alignItems: "center",
    gap: theme.spacing.sm,
  },

});