  import { useState } from "react";
  import { StyleSheet, View } from "react-native";

  import { BottomTabBar, AppTab } from "../components/navigation/BottomTabBar";
  import { HomeScreen } from "../screens/HomeScreen";
  import { RecoveryScreen } from "../screens/recovery/RecoveryScreen";
  import { RoutinesScreen } from "../screens/routines/RoutinesScreen";
  import { MetricsScreen } from "../screens/MetricsScreen"; 
  import { WorkoutAllyIntro } from "../components/ui/WorkoutAllyIntro";

  export function AppRoot() {
    const [activeTab, setActiveTab] = useState<AppTab>("today");
    const [showIntro, setShowIntro] = useState(true);

    return (
      <View style={styles.container}>
        {activeTab === "today" && <HomeScreen />}
        {activeTab === "metrics" && <MetricsScreen />} {/* 💡 Updated from "workout" to "metrics" */}
        {activeTab === "recovery" && <RecoveryScreen />}
        {activeTab === "routines" && <RoutinesScreen />}
        <BottomTabBar activeTab={activeTab} onTabPress={setActiveTab} />
        {showIntro && <WorkoutAllyIntro onFinish={() => setShowIntro(false)} />}
      </View>
    );
  }

  const styles = StyleSheet.create({
    container: {
      flex: 1,
    },
  });
