import { StatusBar } from "expo-status-bar";
import { SafeAreaProvider } from "react-native-safe-area-context";

import { AppRoot } from "./src/bootstrap/AppRoot";
// 💡 Check this path closely:
import { RoutineProvider } from "./src/context/RoutineContext"; 

export default function App() {
  return (
    <SafeAreaProvider>
      <StatusBar style="light" />
      <RoutineProvider>
        <AppRoot />
      </RoutineProvider>
    </SafeAreaProvider>
  );
}