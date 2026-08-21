import React, { useRef, useEffect } from "react";
import { StyleSheet, Text, Pressable, View, Animated } from "react-native";
import { Ionicons } from "@expo/vector-icons";
import { theme } from "../../theme/theme";

export type AppTab = "today" | "metrics" | "recovery" | "routines";

interface BottomTabBarProps {
  activeTab: AppTab;
  onTabPress: (tab: AppTab) => void;
}

const TabItem = ({
  tab,
  isActive,
  onPress,
}: {
  tab: { id: AppTab; label: string; icon: keyof typeof Ionicons.glyphMap };
  isActive: boolean;
  onPress: () => void;
}) => {
  const scaleAnim = useRef(new Animated.Value(isActive ? 1.1 : 1)).current;
  const opacityAnim = useRef(new Animated.Value(isActive ? 1 : 0.6)).current;

  useEffect(() => {
    Animated.parallel([
      Animated.spring(scaleAnim, {
        toValue: isActive ? 1.15 : 1,
        useNativeDriver: true,
        friction: 5,
        tension: 100,
      }),
      Animated.timing(opacityAnim, {
        toValue: isActive ? 1 : 0.6,
        duration: 150,
        useNativeDriver: true,
      }),
    ]).start();
  }, [isActive]);

  return (
    <Pressable style={styles.tabItem} onPress={onPress}>
      <Animated.View
        style={{
          transform: [{ scale: scaleAnim }],
          opacity: opacityAnim,
          alignItems: "center",
        }}
      >
        <Ionicons
          name={tab.icon}
          size={22}
          color={isActive ? theme.colors.accent : theme.colors.textSecondary}
        />
        <Text
          style={[
            styles.label,
            { color: isActive ? theme.colors.accent : theme.colors.textSecondary },
          ]}
        >
          {tab.label}
        </Text>
      </Animated.View>
    </Pressable>
  );
};

export function BottomTabBar({ activeTab, onTabPress }: BottomTabBarProps) {
  const tabs: { id: AppTab; label: string; icon: keyof typeof Ionicons.glyphMap }[] = [
    { id: "today", label: "Today", icon: "calendar-outline" },
    { id: "metrics", label: "Metrics", icon: "stats-chart-outline" },
    { id: "recovery", label: "Recovery", icon: "heart-outline" },
    { id: "routines", label: "Routines", icon: "barbell-outline" },
  ];

  return (
    <View style={styles.container}>
      {tabs.map((tab) => (
        <TabItem
          key={tab.id}
          tab={tab}
          isActive={activeTab === tab.id}
          onPress={() => onTabPress(tab.id)}
        />
      ))}
    </View>
  );
}

const styles = StyleSheet.create({
  container: {
    flexDirection: "row",
    backgroundColor: theme.colors.surface,
    borderTopWidth: 1,
    borderTopColor: theme.colors.border,
    paddingBottom: 24,
    paddingTop: 12,
  },
  tabItem: {
    flex: 1,
    alignItems: "center",
    justifyContent: "center",
  },
  label: {
    fontSize: 11,
    marginTop: 4,
    fontWeight: "600",
  },
});