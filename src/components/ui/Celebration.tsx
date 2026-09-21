import React, { useEffect, useRef, useState } from 'react';
import { Animated, Dimensions, Pressable, StyleSheet, Text, View, Easing } from 'react-native';
import { FlameIcon } from './FlameIcon';

interface CongratulationsAnimationProps {
  variant: 'workoutFinish' | 'prReplacement' | 'streak';
  message?: string;
  onAnimationFinish: () => void;
}

const { width: SCREEN_WIDTH, height: SCREEN_HEIGHT } = Dimensions.get('window');
const PR_BARS = [70, 110, 90];

export const CongratulationsAnimation: React.FC<CongratulationsAnimationProps> = ({
  variant,
  message,
  onAnimationFinish,
}) => {
  const isWorkoutComplete = variant === 'workoutFinish';
  // The card sticks around until dismissed, but the confetti clears itself.
  const [confettiVisible, setConfettiVisible] = useState(true);
  const fadeAnim = useRef(new Animated.Value(0)).current;
  const scaleAnim = useRef(new Animated.Value(0.82)).current;
  const badgeGlow = useRef(new Animated.Value(0)).current;
  const confettiFade = useRef(new Animated.Value(1)).current;
  const flameLight = useRef(new Animated.Value(0)).current;
  const flameLift = useRef(new Animated.Value(0)).current;
  const barAnims = useRef(PR_BARS.map(() => new Animated.Value(0))).current;

  // Confetti pieces
  const confettiAnims = useRef(Array.from({ length: 60 }, () => new Animated.Value(0))).current;

  // Dynamic offsets relative to screen dimensions
  const confettiOffsets = useRef(
    Array.from({ length: 60 }, () => ({
      x: (Math.random() - 0.5) * SCREEN_WIDTH * 1.2,
      y: (Math.random() - 0.5) * SCREEN_HEIGHT * 1.2,
      rotate: `${Math.floor(Math.random() * 720 - 360)}deg`,
    }))
  ).current;

  useEffect(() => {
    Animated.parallel([
      Animated.timing(fadeAnim, {
        toValue: 1,
        duration: 260,
        useNativeDriver: true,
      }),
      Animated.spring(scaleAnim, {
        toValue: 1,
        friction: 8,
        tension: 100,
        useNativeDriver: true,
      }),
    ]).start();

    Animated.loop(
      Animated.sequence([
        Animated.timing(badgeGlow, {
          toValue: 1,
          duration: 900,
          easing: Easing.inOut(Easing.ease),
          useNativeDriver: false,
        }),
        Animated.timing(badgeGlow, {
          toValue: 0,
          duration: 900,
          easing: Easing.inOut(Easing.ease),
          useNativeDriver: false,
        }),
      ])
    ).start();

    if (variant === 'streak') {
      Animated.parallel([
        Animated.sequence([
          Animated.timing(flameLight, { toValue: 1, duration: 720, easing: Easing.out(Easing.back(1.4)), useNativeDriver: true }),
          Animated.loop(Animated.sequence([
            Animated.timing(flameLight, { toValue: 0.86, duration: 420, easing: Easing.inOut(Easing.ease), useNativeDriver: true }),
            Animated.timing(flameLight, { toValue: 1, duration: 420, easing: Easing.inOut(Easing.ease), useNativeDriver: true }),
          ]), { iterations: 2 }),
        ]),
        Animated.sequence([
          Animated.delay(180),
          Animated.timing(flameLift, { toValue: 1, duration: 680, easing: Easing.out(Easing.quad), useNativeDriver: true }),
          Animated.timing(flameLift, { toValue: 0.82, duration: 500, easing: Easing.inOut(Easing.ease), useNativeDriver: true }),
        ]),
      ]).start();
    }

    let dismissTimeout: ReturnType<typeof setTimeout> | null = null;
    const confettiTimeout = setTimeout(() => setConfettiVisible(false), 1900);
    const confettiFadeTimeout = setTimeout(() => {
      Animated.timing(confettiFade, { toValue: 0, duration: 420, useNativeDriver: true }).start();
    }, 1050);

    if (!isWorkoutComplete) {
      Animated.stagger(
        120,
        barAnims.map((barAnim, index) =>
          Animated.timing(barAnim, {
            toValue: PR_BARS[index],
            duration: 520,
            easing: Easing.out(Easing.quad),
            useNativeDriver: false,
          })
        )
      ).start();

      Animated.stagger(
        8,
        confettiAnims.map((confettiAnim) =>
          Animated.sequence([
            Animated.timing(confettiAnim, {
              toValue: 1,
              duration: 350 + Math.random() * 250,
              easing: Easing.out(Easing.cubic),
              useNativeDriver: true,
            }),
            Animated.timing(confettiAnim, {
              toValue: 0,
              duration: 800 + Math.random() * 300,
              easing: Easing.in(Easing.exp),
              useNativeDriver: true,
            }),
          ])
        )
      ).start();
    }

    if (isWorkoutComplete) {
      dismissTimeout = setTimeout(() => {
        onAnimationFinish();
      }, 2200);

      Animated.stagger(
        10,
        confettiAnims.map((confettiAnim) =>
          Animated.sequence([
            Animated.timing(confettiAnim, {
              toValue: 1,
              duration: 280 + Math.random() * 200,
              easing: Easing.out(Easing.cubic),
              useNativeDriver: true,
            }),
            Animated.timing(confettiAnim, {
              toValue: 0,
              duration: 740 + Math.random() * 260,
              easing: Easing.in(Easing.exp),
              useNativeDriver: true,
            }),
          ])
        )
      ).start();
    }

    return () => {
      clearTimeout(confettiTimeout);
      clearTimeout(confettiFadeTimeout);
      if (dismissTimeout) {
        clearTimeout(dismissTimeout);
      }
    };
  }, [fadeAnim, scaleAnim, badgeGlow, barAnims, confettiAnims, confettiFade, flameLight, flameLift, isWorkoutComplete, onAnimationFinish, variant]);

  const isStreak = variant === 'streak';
  const title = isWorkoutComplete ? 'Workout Complete' : isStreak ? 'Streak Extended' : 'Personal Record';
  const glowColor = isStreak ? '#F59E0B' : '#7DD3FC';
  const confettiColors = [
    '#F59E0B', '#F472B6', '#60A5FA', '#34D399',
    '#A78BFA', '#FB7185', '#FBBF24', '#22C55E',
    '#F97316', '#8B5CF6', '#10B981', '#F43F5E',
    '#EAB308', '#38BDF8', '#9333EA', '#14B8A6'
  ];

  return (
    <Animated.View
      style={[styles.container, isWorkoutComplete && styles.fullscreenContainer, { opacity: isWorkoutComplete ? 1 : fadeAnim }]}
      pointerEvents={isWorkoutComplete ? 'none' : 'auto'}
    >
      {/* Confetti Layer */}
      <View style={styles.fullscreenBurst} pointerEvents="none">
        {(confettiVisible ? confettiOffsets : []).map((offset, index) => {
          const anim = confettiAnims[index];
          return (
            <Animated.View
              key={index}
              style={[
                styles.fullscreenConfetti,
                {
                  backgroundColor: confettiColors[index % confettiColors.length],
                  transform: [
                    { translateX: anim.interpolate({ inputRange: [0, 1], outputRange: [0, offset.x] }) },
                    { translateY: anim.interpolate({ inputRange: [0, 1], outputRange: [0, offset.y] }) },
                    { rotate: anim.interpolate({ inputRange: [0, 1], outputRange: ['0deg', offset.rotate] }) },
                    { scale: anim.interpolate({ inputRange: [0, 0.5, 1], outputRange: [0.3, 1.4, 0.8] }) },
                  ],
                  opacity: Animated.multiply(anim, confettiFade),
                },
              ]}
            />
          );
        })}
      </View>

      {!isWorkoutComplete && <Animated.View
        style={[styles.card, isStreak && styles.streakCard, { opacity: fadeAnim, transform: [{ scale: scaleAnim }] }]}
      >
        <Pressable style={styles.closeButton} onPress={onAnimationFinish}>
          <Text style={styles.closeButtonText}>✕</Text>
        </Pressable>
        <View style={styles.badgeRow}>
          {isStreak ? (
            <Animated.View
              style={[styles.flameScene, { transform: [{ translateY: flameLift.interpolate({ inputRange: [0, 1], outputRange: [12, 0] }) }] }]}
            >
              <Animated.View style={[styles.flameLayer, { opacity: flameLight.interpolate({ inputRange: [0, 1], outputRange: [1, 0] }) }]}>
                <FlameIcon size={68} color="#60A5FA" secondaryColor="#BFDBFE" />
              </Animated.View>
              <Animated.View style={[styles.flameLayer, { opacity: flameLight }]}>
                <FlameIcon size={68} color="#F97316" secondaryColor="#FDE68A" />
              </Animated.View>
              <Animated.View style={[styles.flameGlow, { opacity: flameLight.interpolate({ inputRange: [0, 1], outputRange: [0, 0.5] }), transform: [{ scale: flameLight.interpolate({ inputRange: [0, 1], outputRange: [0.6, 1.25] }) }] }]} />
            </Animated.View>
          ) : (
            <Animated.View
              style={[
                styles.badge,
                {
                  borderColor: glowColor,
                  shadowColor: glowColor,
                  shadowRadius: badgeGlow.interpolate({ inputRange: [0, 1], outputRange: [4, 14] }),
                },
              ]}
            >
              <Text style={styles.badgeText}>PR</Text>
            </Animated.View>
          )}
          {!isWorkoutComplete && <View style={styles.barGraph}>
            {(isStreak ? [] : barAnims).map((barAnim, idx) => (
              <Animated.View
                key={idx}
                style={[styles.prBar, { height: barAnim, backgroundColor: ['#38BDF8', '#60A5FA', '#0EA5E9'][idx] }]}
              />
            ))}
          </View>}
        </View>
        <Text style={styles.title}>{title}</Text>
        <Text style={styles.message}>
          {message || (isWorkoutComplete ? 'You completed every exercise in this routine.' : isStreak ? 'You followed your split today.' : 'Your new max has replaced an old one.')}
        </Text>
      </Animated.View>}
    </Animated.View>
  );
};

const styles = StyleSheet.create({
  container: {
    ...StyleSheet.absoluteFillObject,
    justifyContent: 'center',
    alignItems: 'center',
    backgroundColor: 'rgba(12, 14, 23, 0.75)',
    zIndex: 9999,
    padding: 24,
  },
  fullscreenContainer: {
    backgroundColor: 'transparent',
  },
  card: {
    width: '100%',
    maxWidth: 360,
    backgroundColor: '#0F172A',
    borderRadius: 24,
    paddingHorizontal: 24,
    paddingVertical: 28,
    alignItems: 'center',
    shadowColor: '#000',
    shadowOffset: { width: 0, height: 18 },
    shadowOpacity: 0.22,
    shadowRadius: 30,
    elevation: 18,
    position: 'relative',
    zIndex: 2,
  },
  streakCard: {
    paddingTop: 34,
    paddingBottom: 30,
  },
  closeButton: {
    position: 'absolute',
    top: 14,
    right: 14,
    width: 34,
    height: 34,
    borderRadius: 17,
    backgroundColor: 'rgba(255,255,255,0.1)',
    justifyContent: 'center',
    alignItems: 'center',
    zIndex: 3,
  },
  fullscreenBurst: {
    ...StyleSheet.absoluteFillObject,
    justifyContent: 'center',
    alignItems: 'center',
    zIndex: 1,
  },
  fullscreenConfetti: {
    position: 'absolute',
    width: 14,
    height: 14,
    borderRadius: 4,
    marginLeft: -7,
    marginTop: -7,
    opacity: 0,
  },
  closeButtonText: {
    color: '#F8FAFC',
    fontSize: 18,
    lineHeight: 20,
    fontWeight: '800',
  },
  badgeRow: {
    width: '100%',
    marginBottom: 18,
    alignItems: 'center',
    justifyContent: 'center',
  },
  badge: {
    paddingVertical: 10,
    paddingHorizontal: 18,
    borderRadius: 999,
    borderWidth: 1,
    borderStyle: 'solid',
    marginBottom: 14,
    shadowOffset: { width: 0, height: 0 },
    shadowOpacity: 0.7,
    elevation: 10,
  },
  flameScene: {
    width: 96,
    height: 96,
    alignItems: 'center',
    justifyContent: 'center',
    position: 'relative',
  },
  flameLayer: {
    position: 'absolute',
  },
  flameGlow: {
    position: 'absolute',
    width: 72,
    height: 72,
    borderRadius: 36,
    backgroundColor: '#F59E0B',
    shadowColor: '#F59E0B',
    shadowOpacity: 0.9,
    shadowRadius: 24,
    elevation: 12,
    zIndex: -1,
  },
  badgeText: {
    color: '#F8FAFC',
    fontWeight: '800',
    fontSize: 13,
  },
  finishBadgeText: {
    color: '#F8FAFC',
    fontWeight: '900',
    fontSize: 30,
    lineHeight: 32,
  },
  barGraph: {
    flexDirection: 'row',
    alignItems: 'flex-end',
    gap: 10,
  },
  prBar: {
    width: 18,
    borderRadius: 10,
  },
  title: {
    color: '#FFFFFF',
    fontSize: 24,
    fontWeight: '800',
    textAlign: 'center',
    marginBottom: 6,
  },
  message: {
    color: '#D1D5DB',
    fontSize: 14,
    textAlign: 'center',
    lineHeight: 20,
    marginBottom: 18,
  },
});