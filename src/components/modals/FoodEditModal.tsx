import React, {useState, useEffect} from 'react';
import {
  View,
  Text,
  Modal,
  TouchableOpacity,
  TouchableWithoutFeedback,
  StyleSheet,
  TextInput,
  ScrollView,
  Alert,
} from 'react-native';
import { Ionicons as Icon } from '@expo/vector-icons';
import {colors} from '../../theme/colors';

interface Food {
  id: number;
  name: string;
  calories: number;
  carbs: number;
  protein: number;
  fat: number;
  weight?: number;
}

interface FoodEditModalProps {
  isOpen: boolean;
  onClose: () => void;
  food: Food | null;
  onSave: (updatedFood: Food) => void;
  onDelete: (foodId: number) => void;
}

const FoodEditModal: React.FC<FoodEditModalProps> = ({
  isOpen,
  onClose,
  food,
  onSave,
  onDelete,
}) => {
  const [foodName, setFoodName] = useState('');
  const [calories, setCalories] = useState('');
  const [carbs, setCarbs] = useState('');
  const [protein, setProtein] = useState('');
  const [fat, setFat] = useState('');
  const [weight, setWeight] = useState('');

  useEffect(() => {
    if (food) {
      setFoodName(food.name);
      setCalories(food.calories.toString());
      setCarbs(food.carbs.toString());
      setProtein(food.protein.toString());
      setFat(food.fat.toString());
      setWeight((food.weight || 100).toString());
    }
  }, [food, isOpen]);

  const handleSave = () => {
    if (!foodName.trim()) {
      Alert.alert('알림', '음식 이름을 입력해주세요.');
      return;
    }

    const weightValue = Number(weight) || 0;
    if (weightValue <= 0) {
      Alert.alert('알림', '중량을 입력해주세요.');
      return;
    }

    const caloriesValue = Number(calories) || 0;
    const carbsValue = Number(carbs) || 0;
    const proteinValue = Number(protein) || 0;
    const fatValue = Number(fat) || 0;

    if (caloriesValue < 0 || carbsValue < 0 || proteinValue < 0 || fatValue < 0) {
      Alert.alert('알림', '영양소 값은 0 이상이어야 합니다.');
      return;
    }

    if (!food) return;

    const updatedFood: Food = {
      id: food.id,
      name: foodName.trim(),
      calories: caloriesValue,
      carbs: carbsValue,
      protein: proteinValue,
      fat: fatValue,
      weight: weightValue,
    };

    onSave(updatedFood);
    onClose();
  };

  const handleDelete = () => {
    if (!food) return;

    Alert.alert(
      '음식 삭제',
      '이 음식을 삭제하시겠습니까?',
      [
        {text: '취소', style: 'cancel'},
        {
          text: '삭제',
          style: 'destructive',
          onPress: () => {
            onDelete(food.id);
            onClose();
          },
        },
      ]
    );
  };

  const handleClose = () => {
    onClose();
  };

  if (!food) return null;

  return (
    <Modal
      visible={isOpen}
      transparent={true}
      animationType="slide"
      onRequestClose={handleClose}>
      <TouchableWithoutFeedback onPress={handleClose}>
        <View style={styles.modalOverlay}>
          <TouchableWithoutFeedback>
            <View style={styles.modalContainer}>
              <View style={styles.modalHeader}>
                <Text style={styles.modalTitle}>음식 수정</Text>
                <TouchableOpacity onPress={handleClose} style={styles.closeButton}>
                  <Icon name="close" size={24} color={colors.text} />
                </TouchableOpacity>
              </View>

              <ScrollView style={styles.modalContent} showsVerticalScrollIndicator={false}>
                {/* 음식 이름 */}
                <View style={styles.inputGroup}>
                  <Text style={styles.inputLabel}>음식 이름</Text>
                  <TextInput
                    style={styles.inputField}
                    placeholder="음식 이름"
                    placeholderTextColor="rgba(255, 255, 255, 0.5)"
                    value={foodName}
                    onChangeText={setFoodName}
                  />
                </View>

                {/* 중량 */}
                <View style={styles.inputGroup}>
                  <Text style={styles.inputLabel}>중량 (g)</Text>
                  <TextInput
                    style={styles.inputField}
                    placeholder="0"
                    placeholderTextColor="rgba(255, 255, 255, 0.5)"
                    value={weight}
                    onChangeText={setWeight}
                    keyboardType="number-pad"
                  />
                </View>

                {/* 칼로리, 탄수화물, 단백질, 지방 - 2열 레이아웃 */}
                <View style={styles.nutritionRow}>
                  <View style={styles.nutritionColumn}>
                    <Text style={styles.inputLabel}>칼로리 (kcal)</Text>
                    <TextInput
                      style={styles.inputField}
                      placeholder="0"
                      placeholderTextColor="rgba(255, 255, 255, 0.5)"
                      value={calories}
                      onChangeText={setCalories}
                      keyboardType="number-pad"
                    />
                  </View>
                  <View style={styles.nutritionColumn}>
                    <Text style={styles.inputLabel}>탄수화물 (g)</Text>
                    <TextInput
                      style={styles.inputField}
                      placeholder="0"
                      placeholderTextColor="rgba(255, 255, 255, 0.5)"
                      value={carbs}
                      onChangeText={setCarbs}
                      keyboardType="number-pad"
                    />
                  </View>
                </View>

                <View style={styles.nutritionRow}>
                  <View style={styles.nutritionColumn}>
                    <Text style={styles.inputLabel}>단백질 (g)</Text>
                    <TextInput
                      style={styles.inputField}
                      placeholder="0"
                      placeholderTextColor="rgba(255, 255, 255, 0.5)"
                      value={protein}
                      onChangeText={setProtein}
                      keyboardType="number-pad"
                    />
                  </View>
                  <View style={styles.nutritionColumn}>
                    <Text style={styles.inputLabel}>지방 (g)</Text>
                    <TextInput
                      style={styles.inputField}
                      placeholder="0"
                      placeholderTextColor="rgba(255, 255, 255, 0.5)"
                      value={fat}
                      onChangeText={setFat}
                      keyboardType="number-pad"
                    />
                  </View>
                </View>

                {/* 버튼 영역 */}
                <View style={styles.buttonRow}>
                  <TouchableOpacity
                    style={[styles.button, styles.deleteButton]}
                    onPress={handleDelete}>
                    <Text style={styles.deleteButtonText}>삭제</Text>
                  </TouchableOpacity>
                  <TouchableOpacity
                    style={[styles.button, styles.saveButton]}
                    onPress={handleSave}>
                    <Text style={styles.saveButtonText}>저장</Text>
                  </TouchableOpacity>
                </View>
              </ScrollView>
            </View>
          </TouchableWithoutFeedback>
        </View>
      </TouchableWithoutFeedback>
    </Modal>
  );
};

const styles = StyleSheet.create({
  modalOverlay: {
    flex: 1,
    backgroundColor: 'rgba(0, 0, 0, 0.6)',
    justifyContent: 'flex-end',
  },
  modalContainer: {
    backgroundColor: '#252525',
    borderTopLeftRadius: 20,
    borderTopRightRadius: 20,
    paddingBottom: 30,
    maxHeight: '80%',
  },
  modalHeader: {
    flexDirection: 'row',
    justifyContent: 'space-between',
    alignItems: 'center',
    paddingHorizontal: 20,
    paddingTop: 20,
    paddingBottom: 20,
    borderBottomWidth: 1,
    borderBottomColor: 'rgba(255, 255, 255, 0.1)',
  },
  modalTitle: {
    fontSize: 20,
    fontWeight: '700',
    color: colors.text,
  },
  closeButton: {
    padding: 4,
  },
  modalContent: {
    paddingHorizontal: 20,
    paddingTop: 20,
  },
  inputGroup: {
    marginBottom: 20,
  },
  inputLabel: {
    fontSize: 14,
    fontWeight: '600',
    color: colors.text,
    marginBottom: 8,
  },
  inputField: {
    backgroundColor: '#393a38',
    borderRadius: 10,
    paddingVertical: 14,
    paddingHorizontal: 16,
    fontSize: 16,
    color: colors.text,
    borderWidth: 1,
    borderColor: 'rgba(255, 255, 255, 0.1)',
  },
  nutritionRow: {
    flexDirection: 'row',
    gap: 12,
    marginBottom: 20,
  },
  nutritionColumn: {
    flex: 1,
  },
  buttonRow: {
    flexDirection: 'row',
    gap: 12,
    marginTop: 20,
    marginBottom: 10,
  },
  button: {
    flex: 1,
    paddingVertical: 16,
    borderRadius: 10,
    alignItems: 'center',
    justifyContent: 'center',
  },
  deleteButton: {
    backgroundColor: 'rgba(255, 59, 48, 0.2)',
    borderWidth: 1,
    borderColor: 'rgba(255, 59, 48, 0.5)',
  },
  deleteButtonText: {
    fontSize: 16,
    fontWeight: '700',
    color: '#FF3B30',
  },
  saveButton: {
    backgroundColor: colors.primary,
  },
  saveButtonText: {
    fontSize: 16,
    fontWeight: '700',
    color: '#000000',
  },
});

export default FoodEditModal;

