import { Modal, Pressable, StyleSheet, Text, View } from "react-native";
import { theme } from "../../theme/theme";

type NumericKeyboardProps = {
  visible: boolean;
  value: string;
  onChangeText: (value: string) => void;
  onClose: () => void;
  allowDecimal?: boolean;
  allowRange?: boolean;
  maxLength?: number;
  maxValue?: number;
  label?: string;
};

const DECIMAL_KEYS: Array<Array<string | null>> = [
  ["1", "2", "3"],
  ["4", "5", "6"],
  ["7", "8", "9"],
  [".", "0", "⌫"],
];

const INTEGER_KEYS: Array<Array<string | null>> = [
  ["1", "2", "3"],
  ["4", "5", "6"],
  ["7", "8", "9"],
  [null, "0", "⌫"],
];

const NumericKeyboard = ({
  visible,
  value,
  onChangeText,
  onClose,
  allowDecimal = false,
  allowRange = false,
  maxLength,
  maxValue,
  label,
}: NumericKeyboardProps) => {
  const handlePress = (key: string | null) => {
    if (!key) {
      return;
    }
    if (key === "⌫") {
      onChangeText(value.slice(0, -1));
      return;
    }

    if (key === "." && (!allowDecimal || value.includes("."))) {
      return;
    }
    if (key === "-" && (!allowRange || !value || value.includes("-"))) return;

    const nextValue = `${value}${key}`;
    if (typeof maxLength === "number" && nextValue.length > maxLength) return;

    onChangeText(nextValue);
  };

  const keys = allowDecimal
    ? DECIMAL_KEYS
    : allowRange
    ? [...INTEGER_KEYS.slice(0, 3), ["-", "0", "⌫"]]
    : INTEGER_KEYS;

  return (
    <Modal animationType="slide" transparent visible={visible} onRequestClose={onClose}>
      <View style={styles.overlay}>
        <View style={styles.keyboardContainer}>
          <View style={styles.keyboardHeader}>
            <View>
              <Text style={styles.keyboardLabel}>{label || "Number entry"}</Text>
              <Text style={styles.keyboardValue}>{value || "–"}</Text>
            </View>
            <Pressable style={styles.closeButton} onPress={onClose}>
              <Text style={styles.closeButtonText}>Done</Text>
            </Pressable>
          </View>

          {keys.map((row, rowIndex) => (
            <View key={rowIndex} style={styles.keyRow}>
              {row.map((key, keyIndex) => (
                <Pressable
                  key={`${rowIndex}-${keyIndex}`}
                  style={[styles.keyButton, key === null && styles.emptyKeyButton]}
                  onPress={() => handlePress(key)}
                >
                  <Text style={styles.keyText}>{key || ""}</Text>
                </Pressable>
              ))}
            </View>
          ))}
        </View>
      </View>
    </Modal>
  );
};

const styles = StyleSheet.create({
  overlay: {
    flex: 1,
    justifyContent: "flex-end",
    backgroundColor: "rgba(0, 0, 0, 0.35)",
  },
  keyboardContainer: {
    backgroundColor: theme.colors.surface,
    paddingVertical: 16,
    paddingHorizontal: 16,
    borderTopLeftRadius: 24,
    borderTopRightRadius: 24,
    borderColor: theme.colors.border,
    borderWidth: 1,
    minHeight: 320,
    maxHeight: 420,
    width: "100%",
  },
  keyboardHeader: {
    flexDirection: "row",
    justifyContent: "space-between",
    alignItems: "center",
    marginBottom: 12,
  },
  keyboardLabel: {
    color: theme.colors.textSecondary,
    fontSize: 14,
    marginBottom: 4,
  },
  keyboardValue: {
    color: theme.colors.textPrimary,
    fontSize: 22,
    fontWeight: "600",
  },
  closeButton: {
    backgroundColor: theme.colors.accent,
    paddingHorizontal: 16,
    paddingVertical: 10,
    borderRadius: 10,
  },
  closeButtonText: {
    color: theme.colors.surface,
    fontWeight: "700",
  },
  keyRow: {
    flexDirection: "row",
    justifyContent: "space-between",
    marginBottom: 12,
  },
  keyButton: {
    flex: 1,
    minWidth: 72,
    minHeight: 72,
    marginHorizontal: 4,
    borderRadius: 14,
    backgroundColor: theme.colors.background,
    justifyContent: "center",
    alignItems: "center",
  },
  emptyKeyButton: {
    backgroundColor: theme.colors.surface,
    borderWidth: 1,
    borderColor: theme.colors.border,
  },
  keyText: {
    color: theme.colors.textPrimary,
    fontSize: 24,
    fontWeight: "700",
  },
});

export default NumericKeyboard;
