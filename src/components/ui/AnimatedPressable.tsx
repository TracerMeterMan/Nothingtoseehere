import React, { useRef } from "react";
import { Pressable, Animated, PressableProps } from "react-native";

interface AnimatedPressableProps extends PressableProps {
  children: React.ReactNode;
  scaleTo?: number;
  style?: any;
}

export const AnimatedPressable = ({
  children,
  scaleTo = 0.96,
  style,
  onPressIn,
  onPressOut,
  disabled,
  ...props
}: AnimatedPressableProps) => {
  const scaleAnim = useRef(new Animated.Value(1)).current;

  const handlePressIn = (e: any) => {
    if (!disabled) {
      Animated.spring(scaleAnim, {
        toValue: scaleTo,
        useNativeDriver: true,
        speed: 50,
        bounciness: 4,
      }).start();
    }
    onPressIn?.(e);
  };

  const handlePressOut = (e: any) => {
    if (!disabled) {
      Animated.spring(scaleAnim, {
        toValue: 1,
        useNativeDriver: true,
        speed: 50,
        bounciness: 6,
      }).start();
    }
    onPressOut?.(e);
  };

  return (
    <Animated.View style={[{ transform: [{ scale: scaleAnim }] }, style]}>
      <Pressable
        {...props}
        disabled={disabled}
        onPressIn={handlePressIn}
        onPressOut={handlePressOut}
      >
        {children}
      </Pressable>
    </Animated.View>
  );
};