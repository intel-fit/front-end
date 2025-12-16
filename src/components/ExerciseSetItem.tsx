import React from "react";
import {
  View,
  Text,
  TouchableOpacity,
  StyleSheet,
  TextInput,
} from "react-native";
import { Ionicons as Icon } from "@expo/vector-icons";

interface ExerciseSetItemProps {
  order: number;
  weight: number;
  reps: number;
  isCompleted: boolean;
  isActive?: boolean;
  onToggleComplete: () => void;
  onPressRemove: () => void;
  onWeightChange?: (weight: number) => void;
  onRepsChange?: (reps: number) => void;
}

const ExerciseSetItem: React.FC<ExerciseSetItemProps> = ({
  order,
  weight,
  reps,
  isCompleted,
  isActive = false,
  onToggleComplete,
  onPressRemove,
  onWeightChange,
  onRepsChange,
}) => {
  const isHighlighted = isActive || isCompleted;

  return (
    <View
      style={[
        styles.container,
        isHighlighted ? styles.containerActive : styles.containerDefault,
      ]}
    >
      {/* 삭제 버튼 - 오른쪽 상단 모서리 */}
      <TouchableOpacity
        style={styles.deleteButton}
        onPress={onPressRemove}
        hitSlop={{ top: 10, bottom: 10, left: 10, right: 10 }}
      >
        <View style={styles.deleteButtonCircle}>
          <Icon name="close" size={16} color="#ffffff" />
        </View>
      </TouchableOpacity>

      {/* 세트 번호 */}
      <View style={styles.setNumberContainer}>
        <Text
          style={[
            styles.setNumber,
            isHighlighted ? styles.textActive : styles.textDefault,
          ]}
        >
          {order ?? 1}세트
        </Text>
      </View>

      {/* 무게 */}
      {onWeightChange ? (
        <View style={styles.valueContainer}>
          <View style={styles.inputWrapper}>
            <TextInput
              style={[
                styles.valueInput,
                isHighlighted ? styles.valueInputActive : styles.valueInputDefault,
              ]}
              value={(weight ?? 0).toString()}
              onChangeText={(text) => {
                const num = parseFloat(text) || 0;
                onWeightChange(num);
              }}
              keyboardType="decimal-pad"
              editable={!isCompleted}
              placeholder="0"
              placeholderTextColor="#999"
            />
            <Text
              style={[
                styles.unit,
                isHighlighted ? styles.textActive : styles.textDefault,
              ]}
            >
              kg
            </Text>
          </View>
        </View>
      ) : (
        <Text
          style={[
            styles.weight,
            isHighlighted ? styles.textActive : styles.textDefault,
          ]}
        >
          {weight ?? 0} kg
        </Text>
      )}

      {/* 횟수 */}
      {onRepsChange ? (
        <View style={styles.valueContainer}>
          <View style={styles.inputWrapper}>
            <TextInput
              style={[
                styles.valueInput,
                isHighlighted ? styles.valueInputActive : styles.valueInputDefault,
              ]}
              value={(reps ?? 0).toString()}
              onChangeText={(text) => {
                const num = parseInt(text) || 0;
                onRepsChange(num);
              }}
              keyboardType="number-pad"
              editable={!isCompleted}
              placeholder="0"
              placeholderTextColor="#999"
            />
            <Text
              style={[
                styles.unit,
                isHighlighted ? styles.textActive : styles.textDefault,
              ]}
            >
              회
            </Text>
          </View>
        </View>
      ) : (
        <Text
          style={[
            styles.reps,
            isHighlighted ? styles.textActive : styles.textDefault,
          ]}
        >
          {reps ?? 0} 회
        </Text>
      )}

      {/* 완료 버튼 */}
      <TouchableOpacity
        style={[
          styles.completeButton,
          isCompleted ? styles.completeButtonActive : styles.completeButtonDefault,
        ]}
        onPress={onToggleComplete}
        hitSlop={{ top: 10, bottom: 10, left: 10, right: 10 }}
      >
        {isCompleted ? (
          <Icon name="checkmark-circle" size={28} color="#4CAF50" />
        ) : (
          <Icon name="ellipse-outline" size={28} color="#CCCCCC" />
        )}
      </TouchableOpacity>
    </View>
  );
};

const styles = StyleSheet.create({
  container: {
    flexDirection: "row",
    alignItems: "center",
    justifyContent: "space-between",
    paddingVertical: 16,
    paddingHorizontal: 16,
    marginHorizontal: 0,
    marginBottom: 12,
    borderRadius: 16,
    position: "relative",
    borderWidth: 1.5,
    shadowColor: "#000",
    shadowOffset: {
      width: 0,
      height: 2,
    },
    shadowOpacity: 0.08,
    shadowRadius: 4,
    elevation: 2,
    gap: 12,
    width: "100%",
  },
  containerDefault: {
    backgroundColor: "#FFFFFF",
    borderColor: "#E8E8E8",
  },
  containerActive: {
    backgroundColor: "#F0F9F0",
    borderColor: "#4CAF50",
  },
  deleteButton: {
    position: "absolute",
    right: -8,
    top: -8,
    zIndex: 1,
  },
  deleteButtonCircle: {
    width: 28,
    height: 28,
    borderRadius: 14,
    backgroundColor: "#FF5252",
    justifyContent: "center",
    alignItems: "center",
    shadowColor: "#000",
    shadowOffset: { width: 0, height: 2 },
    shadowOpacity: 0.2,
    shadowRadius: 3,
    elevation: 3,
  },
  setNumberContainer: {
    width: 60,
    justifyContent: "center",
    alignItems: "flex-start",
  },
  setNumber: {
    fontSize: 15,
    fontWeight: "600",
    textAlign: "left",
  },
  weight: {
    fontSize: 15,
    fontWeight: "600",
    flex: 1,
    maxWidth: "35%",
    textAlign: "right",
  },
  reps: {
    fontSize: 15,
    fontWeight: "600",
    flex: 1,
    maxWidth: "35%",
    textAlign: "right",
  },
  valueContainer: {
    flex: 1,
    maxWidth: "35%",
  },
  inputWrapper: {
    flexDirection: "row",
    alignItems: "center",
    justifyContent: "flex-end",
    backgroundColor: "#F8F8F8",
    borderRadius: 10,
    paddingHorizontal: 8,
    paddingVertical: 8,
    borderWidth: 1,
    borderColor: "#E0E0E0",
    width: "100%",
  },
  valueInput: {
    fontSize: 15,
    fontWeight: "600",
    textAlign: "right",
    width: 40,
    padding: 0,
    color: "#000000",
  },
  valueInputDefault: {
    color: "#000000",
  },
  valueInputActive: {
    color: "#4CAF50",
  },
  unit: {
    fontSize: 13,
    fontWeight: "600",
    marginLeft: 4,
    color: "#666666",
  },
  textDefault: {
    color: "#000000",
  },
  textActive: {
    color: "#000000",
  },
  completeButton: {
    width: 50,
    height: 50,
    justifyContent: "center",
    alignItems: "center",
    flexShrink: 0,
  },
  completeButtonDefault: {
    backgroundColor: "transparent",
  },
  completeButtonActive: {
    backgroundColor: "transparent",
  },
});

export default ExerciseSetItem;
