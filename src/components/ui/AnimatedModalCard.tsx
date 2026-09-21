import React, { useEffect, useRef } from "react";
import { Modal, View, StyleSheet, Animated, TouchableWithoutFeedback } from "react-native";

interface AnimatedModalCardProps {
  visible: boolean;
  onClose: () => void;
  children: React.ReactNode;
}

export const AnimatedModalCard = ({
  visible,
  onClose,
  children,
}: AnimatedModalCardProps) => {
  const translateY = useRef(new Animated.Value(300)).current;
  const backdropOpacity = useRef(new Animated.Value(0)).current;

  useEffect(() => {
    if (visible) {
      Animated.parallel([
        Animated.spring(translateY, {
          toValue: 0,
          friction: 8,
          tension: 60,
          useNativeDriver: true,
        }),
        Animated.timing(backdropOpacity, {
          toValue: 1,
          duration: 200,
          useNativeDriver: true,
        }),
      ]).start();
    } else {
      translateY.setValue(300);
      backdropOpacity.setValue(0);
    }
  }, [visible]);

  if (!visible) return null;

  return (
    <Modal transparent visible={visible} animationType="none" onRequestClose={onClose}>
      <TouchableWithoutFeedback onPress={onClose}>
        <Animated.View style={[styles.backdrop, { opacity: backdropOpacity }]} />
      </TouchableWithoutFeedback>
      <View style={styles.centeredView} pointerEvents="box-none">
        <Animated.View style={[styles.modalCard, { transform: [{ translateY }] }]}>
          {children}
        </Animated.View>
      </View>
    </Modal>
  );
};

const styles = StyleSheet.create({
  backdrop: {
    ...StyleSheet.absoluteFillObject,
    backgroundColor: "rgba(0, 0, 0, 0.6)",
  },
  centeredView: {
    flex: 1,
    justifyContent: "flex-end",
  },
  modalCard: {
    backgroundColor: "#10141B",
    borderTopLeftRadius: 20,
    borderTopRightRadius: 20,
    padding: 20,
    borderWidth: 1,
    borderColor: "#2A3340",
  },
});