import { useEffect, useRef } from "react";
import { Animated, Easing, Image, StyleSheet, Text, View } from "react-native";
import { theme } from "../../theme/theme";

type WorkoutAllyIntroProps = { onFinish: () => void };

/** A short cold-open only; Fast Refresh normally preserves AppRoot state. */
export function WorkoutAllyIntro({ onFinish }: WorkoutAllyIntroProps) {
  const logoScale = useRef(new Animated.Value(0.72)).current;
  const logoOpacity = useRef(new Animated.Value(0)).current;
  const copyOpacity = useRef(new Animated.Value(0)).current;

  useEffect(() => {
    const animation = Animated.sequence([
      Animated.parallel([
        Animated.spring(logoScale, { toValue: 1, speed: 10, bounciness: 10, useNativeDriver: true }),
        Animated.timing(logoOpacity, { toValue: 1, duration: 340, easing: Easing.out(Easing.cubic), useNativeDriver: true }),
      ]),
      Animated.timing(copyOpacity, { toValue: 1, duration: 220, useNativeDriver: true }),
      Animated.delay(620),
      Animated.timing(logoOpacity, { toValue: 0, duration: 220, useNativeDriver: true }),
    ]);
    animation.start(({ finished }) => finished && onFinish());
    return () => animation.stop();
  }, [copyOpacity, logoOpacity, logoScale, onFinish]);

  return (
    <View style={styles.overlay}>
      <Animated.View style={[styles.content, { opacity: logoOpacity, transform: [{ scale: logoScale }] }]}>
        <Image source={require("../../../assets/Untitled design (2).png")} style={styles.logo} resizeMode="contain" />
        <Animated.Text style={[styles.title, { opacity: copyOpacity }]}>Routine Ally</Animated.Text>
      </Animated.View>
    </View>
  );
}

const styles = StyleSheet.create({
  overlay: { ...StyleSheet.absoluteFillObject, zIndex: 20, alignItems: "center", justifyContent: "center", backgroundColor: theme.colors.background },
  content: { alignItems: "center", gap: 8 },
  logo: { width: 104, height: 104, borderRadius: 24 },
  title: { color: theme.colors.textPrimary, fontSize: 26, fontWeight: "800", letterSpacing: -0.5 },
  subtitle: { color: theme.colors.textSecondary, fontSize: 14, fontWeight: "600" },
});
