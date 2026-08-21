import React, { useRef } from 'react';
import { Pressable, Text, View, StyleSheet, ViewStyle, TextStyle, Animated } from 'react-native';
import { theme } from '../../theme/theme';

interface ButtonProps {
  children: React.ReactNode;
  variant?: 'primary' | 'secondary' | 'destructive' | 'outline' | 'text';
  size?: 'default' | 'small' | 'large';
  onPress: () => void;
  disabled?: boolean;
  fullWidth?: boolean;
  icon?: React.ReactNode;
  iconPosition?: 'left' | 'right';
  iconSize?: number;
  iconColor?: string;
  textColor?: string;
  testID?: string;
}

export const Button = ({
  children,
  variant = 'primary',
  size = 'default',
  onPress,
  disabled = false,
  fullWidth = false,
  icon,
  iconPosition = 'left',
  iconSize = 20,
  iconColor,
  textColor,
  testID,
}: ButtonProps) => {
  const scaleAnim = useRef(new Animated.Value(1)).current;

  const handlePressIn = () => {
    if (disabled) return;
    Animated.spring(scaleAnim, {
      toValue: 0.96,
      useNativeDriver: true,
      speed: 40,
      bounciness: 4,
    }).start();
  };

  const handlePressOut = () => {
    if (disabled) return;
    Animated.spring(scaleAnim, {
      toValue: 1,
      useNativeDriver: true,
      speed: 25,
      bounciness: 6,
    }).start();
  };

  const getButtonStyles = () => {
    const base: ViewStyle = {
      borderRadius: 12,
      justifyContent: 'center',
      alignItems: 'center',
    };

    const sizeStyles: ViewStyle = {
      default: { paddingVertical: 14, paddingHorizontal: 20 },
      small: { paddingVertical: 10, paddingHorizontal: 16 },
      large: { paddingVertical: 18, paddingHorizontal: 24 },
    }[size];

    const variantStyles: ViewStyle = {
      primary: {
        backgroundColor: theme.colors.accent,
      },
      secondary: {
        backgroundColor: theme.colors.surface,
        borderWidth: 1,
        borderColor: theme.colors.accent,
      },
      destructive: {
        backgroundColor: 'transparent',
        borderWidth: 1,
        borderColor: theme.colors.danger,
      },
      outline: {
        backgroundColor: 'transparent',
        borderWidth: 1,
        borderColor: theme.colors.border,
      },
      text: {
        backgroundColor: 'transparent',
        borderWidth: 0,
      },
    }[variant];

    const textStyle: TextStyle = {
      color: textColor
        ? textColor
        : variant === 'primary'
          ? theme.colors.textPrimary
          : variant === 'secondary'
            ? theme.colors.accent
            : variant === 'destructive'
              ? theme.colors.danger
              : variant === 'outline'
                ? theme.colors.textPrimary
                : theme.colors.textPrimary,
      fontWeight: '600',
      fontSize: size === 'small' ? 13 : size === 'large' ? 17 : 15,
    };

    const disabledStyle: ViewStyle = {
      opacity: 0.5,
    };

    return {
      container: [base, sizeStyles, variantStyles, disabled && disabledStyle],
      text: [textStyle],
    };
  };

  const styles = getButtonStyles();

  return (
    <Animated.View style={{ transform: [{ scale: scaleAnim }], width: fullWidth ? '100%' : undefined }}>
      <Pressable
        style={styles.container}
        onPress={disabled ? undefined : onPress}
        onPressIn={handlePressIn}
        onPressOut={handlePressOut}
        disabled={disabled}
        testID={testID}
      >
        {icon && iconPosition === 'left' && (
          <View style={{ marginRight: 8 }}>
            {icon}
          </View>
        )}
        {children && (
          <Text style={styles.text}>
            {children}
          </Text>
        )}
        {icon && iconPosition === 'right' && (
          <View style={{ marginLeft: 8 }}>
            {icon}
          </View>
        )}
        {!children && !icon && (
          <Text style={styles.text}> </Text>
        )}
      </Pressable>
    </Animated.View>
  );
};

const styles = StyleSheet.create({});