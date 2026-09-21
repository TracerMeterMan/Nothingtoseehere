import { StatusBar } from "expo-status-bar";
import { SafeAreaProvider } from "react-native-safe-area-context";

import { AppRoot } from "./src/bootstrap/AppRoot";
// 💡 Check this path closely:
import { RoutineProvider } from "./src/context/RoutineContext"; 
import { UserProfileProvider } from "./src/context/UserProfileContext";
import AsyncStorage from '@react-native-async-storage/async-storage';

// Put this right inside your main component function:
AsyncStorage.clear(); // This wipes all saved app data instantly!
export default function App() {
  return (
    <SafeAreaProvider>
      <StatusBar style="light" />
      <RoutineProvider>
        <UserProfileProvider>
          <AppRoot />
        </UserProfileProvider>
      </RoutineProvider>
    </SafeAreaProvider>
  );
}