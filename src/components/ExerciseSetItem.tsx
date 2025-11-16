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
  onOrderChange?: (order: number) => void;
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
  onOrderChange,
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
          <Icon name="remove" size={14} color="#ffffff" />
        </View>
      </TouchableOpacity>

      {/* 세트 번호 - 편집 가능 */}
      {onOrderChange ? (
        <View style={styles.orderContainer}>
          <TextInput
            style={[
              styles.orderInput,
              isHighlighted ? styles.textActive : styles.textDefault,
            ]}
            value={(order ?? 1).toString()}
            onChangeText={(text) => {
              const num = parseInt(text) || 1;
              onOrderChange(num);
            }}
            keyboardType="numeric"
            editable={!isCompleted}
          />
          <Text
            style={[
              styles.orderUnit,
              isHighlighted ? styles.textActive : styles.textDefault,
            ]}
          >
            세트
          </Text>
        </View>
      ) : (
        <Text
          style={[
            styles.setNumber,
            isHighlighted ? styles.textActive : styles.textDefault,
          ]}
        >
          {order ?? 1}세트
        </Text>
      )}

      {/* 무게 */}
      {onWeightChange ? (
        <View style={styles.valueContainer}>
          <TextInput
            style={[
              styles.valueInput,
              isHighlighted ? styles.textActive : styles.textDefault,
            ]}
            value={(weight ?? 0).toString()}
            onChangeText={(text) => {
              const num = parseInt(text) || 0;
              onWeightChange(num);
            }}
            keyboardType="numeric"
            editable={!isCompleted}
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
          <TextInput
            style={[
              styles.valueInput,
              isHighlighted ? styles.textActive : styles.textDefault,
            ]}
            value={(reps ?? 0).toString()}
            onChangeText={(text) => {
              const num = parseInt(text) || 0;
              onRepsChange(num);
            }}
            keyboardType="numeric"
            editable={!isCompleted}
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

      {/* 체크박스 */}
      <TouchableOpacity
        style={[
          styles.checkbox,
          isCompleted ? styles.checkboxCompleted : styles.checkboxDefault,
        ]}
        onPress={onToggleComplete}
        hitSlop={{ top: 10, bottom: 10, left: 10, right: 10 }}
      >
        {isCompleted && (
          <Icon name="checkmark" size={18} color="#000000" />
        )}
        {!isCompleted && (
          <Icon name="checkmark" size={18} color="#CCCCCC" />
        )}
      </TouchableOpacity>
    </View>
  );
};

const styles = StyleSheet.create({
  container: {
    flexDirection: "row",
    alignItems: "center",
    paddingVertical: 16,
    paddingHorizontal: 20,
    marginHorizontal: 12,
    marginBottom: 12,
    borderRadius: 12,
    position: "relative",
    shadowColor: "#000",
    shadowOffset: {
      width: 0,
      height: 1,
    },
    shadowOpacity: 0.1,
    shadowRadius: 2,
    elevation: 2,
  },
  containerDefault: {
    backgroundColor: "#FFFFFF",
  },
  containerActive: {
    backgroundColor: "#E8FF8A",
  },
  deleteButton: {
    position: "absolute",
    right: -8,
    top: -8,
    zIndex: 1,
  },
  deleteButtonCircle: {
    width: 24,
    height: 24,
    borderRadius: 12,
    backgroundColor: "#CCCCCC",
    justifyContent: "center",
    alignItems: "center",
  },
  setNumber: {
    fontSize: 14,
    fontWeight: "400",
    minWidth: 50,
    marginRight: 12,
  },
  orderContainer: {
    flexDirection: "row",
    alignItems: "center",
    minWidth: 60,
    marginRight: 12,
  },
  orderInput: {
    fontSize: 14,
    fontWeight: "400",
    minWidth: 30,
    textAlign: "right",
    padding: 0,
  },
  orderUnit: {
    fontSize: 14,
    fontWeight: "400",
    marginLeft: 4,
  },
  weight: {
    fontSize: 14,
    fontWeight: "400",
    flex: 1,
    marginRight: 12,
  },
  reps: {
    fontSize: 14,
    fontWeight: "400",
    flex: 1,
    marginRight: 12,
  },
  valueContainer: {
    flex: 1,
    flexDirection: "row",
    alignItems: "center",
    marginRight: 12,
  },
  valueInput: {
    flex: 1,
    fontSize: 14,
    fontWeight: "400",
    textAlign: "right",
    minWidth: 40,
    padding: 0,
  },
  unit: {
    fontSize: 14,
    fontWeight: "400",
    marginLeft: 4,
  },
  textDefault: {
    color: "#000000",
  },
  textActive: {
    color: "#000000",
  },
  checkbox: {
    width: 32,
    height: 32,
    borderRadius: 8,
    borderWidth: 1,
    justifyContent: "center",
    alignItems: "center",
  },
  checkboxDefault: {
    backgroundColor: "#FFFFFF",
    borderColor: "#E0E0E0",
  },
  checkboxCompleted: {
    backgroundColor: "#FFFFFF",
    borderColor: "#000000",
  },
});

export default ExerciseSetItem;
