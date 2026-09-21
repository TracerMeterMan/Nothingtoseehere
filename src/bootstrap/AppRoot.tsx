import { useCallback, useEffect, useRef, useState } from "react";
import { ActivityIndicator, Animated, StyleSheet, View } from "react-native";
import { BottomTabBar, AppTab } from "../components/navigation/BottomTabBar";
import { HomeScreen } from "../screens/HomeScreen";
import { RecoveryScreen } from "../screens/recovery/RecoveryScreen";
import { RoutinesScreen } from "../screens/routines/RoutinesScreen";
import { MetricsScreen } from "../screens/MetricsScreen";
import { OnboardingScreen } from "../components/onboarding/OnboardingScreen";
import { useUserProfile } from "../context/UserProfileContext";
import { theme } from "../theme/theme";
import { StarterQuestSidebar } from "../components/navigation/StarterQuestSidebar";
import { WorkoutAllyIntro } from "../components/ui/WorkoutAllyIntro";

export function AppRoot() {
  const { profile, isLoading } = useUserProfile();
  const [activeTab, setActiveTab] = useState<AppTab>("today");
  const [showIntro, setShowIntro] = useState(true);
  const sceneOpacity = useRef(new Animated.Value(1)).current;
  const sceneOffset = useRef(new Animated.Value(0)).current;

  useEffect(() => {
    sceneOpacity.setValue(0);
    sceneOffset.setValue(10);
    Animated.parallel([
      Animated.timing(sceneOpacity, { toValue: 1, duration: 180, useNativeDriver: true }),
      Animated.timing(sceneOffset, { toValue: 0, duration: 180, useNativeDriver: true }),
    ]).start();
  }, [activeTab, sceneOpacity, sceneOffset]);

  const finishIntro = useCallback(() => setShowIntro(false), []);

  if (isLoading) return <View style={styles.loading}><ActivityIndicator size="large" color={theme.colors.accent} /></View>;
  if (!profile?.onboardingComplete) return <OnboardingScreen />;

  const activeScene = activeTab === "today" ? <HomeScreen /> : activeTab === "metrics" ? <MetricsScreen /> : activeTab === "recovery" ? <RecoveryScreen /> : <RoutinesScreen />;
  return <View style={styles.container}>
    <Animated.View key={activeTab} style={[styles.scene, { opacity: sceneOpacity, transform: [{ translateY: sceneOffset }] }]}>{activeScene}</Animated.View>
    <StarterQuestSidebar />
    <BottomTabBar activeTab={activeTab} onTabPress={setActiveTab} />
    {showIntro && <WorkoutAllyIntro onFinish={finishIntro} />}
  </View>;
}

const styles = StyleSheet.create({
  container: { flex: 1, backgroundColor: theme.colors.background },
  scene: { flex: 1, backgroundColor: theme.colors.background },
  loading: { flex: 1, alignItems: "center", justifyContent: "center", backgroundColor: theme.colors.background },
});
