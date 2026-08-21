import React, { useRef } from 'react';
import { View, ViewStyle, Pressable, Animated } from 'react-native';
import { theme } from '../../theme/theme';

interface CardProps {
  children: React.ReactNode;
  padded?: boolean;
  padding?: number;
  bordered?: boolean;
  elevated?: boolean;
  onPress?: () => void;
  testID?: string;
}

export const Card = ({
  children,
  padded = true,
  padding,
  bordered = true,
  elevated = false,
  onPress,
  testID,
}: CardProps) => {
  const scaleAnim = useRef(new Animated.Value(1)).current;

  const handlePressIn = () => {
    if (!onPress) return;
    Animated.spring(scaleAnim, {
      toValue: 0.98,
      useNativeDriver: true,
      speed: 50,
      bounciness: 4,
    }).start();
  };

  const handlePressOut = () => {
    if (!onPress) return;
    Animated.spring(scaleAnim, {
      toValue: 1,
      useNativeDriver: true,
      speed: 50,
      bounciness: 6,
    }).start();
  };

  const baseStyle: ViewStyle = {
    backgroundColor: theme.colors.surface,
    borderRadius: 12,
    overflow: 'hidden',
  };

  const borderStyle: ViewStyle = bordered
    ? { borderWidth: 1, borderColor: theme.colors.border }
    : {};

  const elevationStyle: ViewStyle = elevated
    ? {
        shadowColor: '#000',
        shadowOffset: { width: 0, height: 2 },
        shadowOpacity: 0.1,
        shadowRadius: 4,
        elevation: 2,
      }
    : {};

  const paddingStyle: ViewStyle = padded
    ? { padding: padding ?? 16 }
    : {};

  const combinedStyles = [baseStyle, borderStyle, elevationStyle, paddingStyle];

  return (
    <Animated.View style={[{ transform: [{ scale: scaleAnim }] }]}>
      <Pressable
        onPress={onPress}
        onPressIn={handlePressIn}
        onPressOut={handlePressOut}
        disabled={!onPress}
        style={combinedStyles}
        testID={testID}
      >
        {children}
      </Pressable>
    </Animated.View>
  );
};