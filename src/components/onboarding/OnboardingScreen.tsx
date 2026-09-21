import { useEffect } from "react";
import { StyleSheet, Text, View } from "react-native";
import { theme } from "../../theme/theme";
import { defaultUserProfile } from "../../models/userProfile";
import { useUserProfile } from "../../context/UserProfileContext";

export function OnboardingScreen() {
  const { saveProfile } = useUserProfile();

  useEffect(() => {
    const bypassAndInitialize = async () => {
      // 1. Set up a clean default profile with onboarding marked complete
      const nextProfile = { ...defaultUserProfile, onboardingComplete: true };
      
      // 2. Save the profile to instantly skip past this screen forever
      await saveProfile(nextProfile);
    };

    bypassAndInitialize();
  }, []);

  return (
    <View style={s.screen}>
      <Text style={s.text}>Loading your profile...</Text>
    </View>
  );
}

const s = StyleSheet.create({
  screen: {
    flex: 1,
    backgroundColor: theme.colors.background,
    alignItems: "center",
    justifyContent: "center",
  },
  text: {
    ...theme.typography.body,
    color: theme.colors.textSecondary,
  },
});