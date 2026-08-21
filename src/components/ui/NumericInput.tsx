import { useState } from "react";
import { Pressable, StyleSheet, Text, View } from "react-native";
import NumericKeyboard from "./NumericKeyboard";
import { theme } from "../../theme/theme";

type NumericInputProps = {
  value: string;
  onChangeText: (value: string) => void;
  placeholder?: string;
  placeholderTextColor?: string;
  style?: any;
  label?: string;
  allowDecimal?: boolean;
  allowRange?: boolean;
  maxLength?: number;
  maxValue?: number;
};

const NumericInput = ({
  value,
  onChangeText,
  placeholder,
  placeholderTextColor,
  style,
  label,
  allowDecimal = false,
  allowRange = false,
  maxLength,
  maxValue,
}: NumericInputProps) => {
  const [isKeyboardVisible, setIsKeyboardVisible] = useState(false);
  const [pendingValue, setPendingValue] = useState(value);

  const openKeyboard = () => {
    setPendingValue(value);
    setIsKeyboardVisible(true);
  };

  const closeKeyboard = () => {
    if (typeof maxValue === "number") {
      const parsedValue = parseInt(pendingValue, 10);
      if (!isNaN(parsedValue) && parsedValue >= 1 && parsedValue <= maxValue) {
        onChangeText(pendingValue);
      }
    } else {
      onChangeText(pendingValue);
    }
    setIsKeyboardVisible(false);
  };

  return (
    <>
      <Pressable
        style={[styles.inputWrapper, style]}
        onPress={openKeyboard}
        accessibilityRole="button"
      >
        <Text style={[styles.inputText, !value && { color: placeholderTextColor || theme.colors.textSecondary }]}
        >
          {value || placeholder || ""}
        </Text>
      </Pressable>
      <NumericKeyboard
        visible={isKeyboardVisible}
        value={pendingValue}
        onChangeText={setPendingValue}
        onClose={closeKeyboard}
        allowDecimal={allowDecimal}
        allowRange={allowRange}
        maxLength={maxLength}
        maxValue={maxValue}
        label={label}
      />
    </>
  );
};

const styles = StyleSheet.create({
  inputWrapper: {
    minHeight: 42,
    paddingHorizontal: 12,
    justifyContent: "center",
    borderRadius: 10,
    backgroundColor: theme.colors.surface,
    borderWidth: 1,
    borderColor: theme.colors.border,
  },
  inputText: {
    color: theme.colors.textPrimary,
    fontSize: 16,
  },
});

export default NumericInput;
