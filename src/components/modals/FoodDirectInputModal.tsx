import React, {useState} from 'react';
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
  ActivityIndicator,
} from 'react-native';
import { Ionicons as Icon } from '@expo/vector-icons';
import {mealAPI} from '../../services';
import type {SearchFoodResponse} from '../../types';

interface FoodDirectInputModalProps {
  isOpen: boolean;
  onClose: () => void;
  onSave: (foodData: {
    name: string;
    calories: number;
    carbs: number;
    protein: number;
    fat: number;
    weight: number;
  }) => void;
}

const FoodDirectInputModal: React.FC<FoodDirectInputModalProps> = ({
  isOpen,
  onClose,
  onSave,
}) => {
  const [foodName, setFoodName] = useState('');
  const [calories, setCalories] = useState('');
  const [carbs, setCarbs] = useState('');
  const [protein, setProtein] = useState('');
  const [fat, setFat] = useState('');
  const [weight, setWeight] = useState('');
  const [isLoading, setIsLoading] = useState(false);

  const handleSave = async () => {
    if (!foodName.trim()) {
      Alert.alert('알림', '음식 이름을 입력해주세요.');
      return;
    }

    const weightValue = Number(weight) || 0;
    if (weightValue <= 0) {
      Alert.alert('알림', '총 중량을 입력해주세요.');
      return;
    }

    setIsLoading(true);

    try {
      const foodData = {
        name: foodName.trim(),
        weight: weightValue,
        calories: Number(calories) || 0,
        carbs: Number(carbs) || 0,
        protein: Number(protein) || 0,
        fat: Number(fat) || 0,
      };

      const response: SearchFoodResponse = await mealAPI.addManualFood(foodData);

      // API 응답을 Food 타입으로 변환하여 onSave 콜백 호출
      const savedFood = {
        id: response.id,
        name: response.name,
        calories: response.calories,
        carbs: response.carbs,
        protein: response.protein,
        fat: response.fat,
        weight: response.weight,
      };

      onSave(savedFood);
      handleClose();
    } catch (error: any) {
      console.error('직접 음식 입력 오류:', error);
      Alert.alert('오류', error.message || '음식 저장에 실패했습니다. 다시 시도해주세요.');
    } finally {
      setIsLoading(false);
    }
  };

  const handleClose = () => {
    setFoodName('');
    setCalories('');
    setCarbs('');
    setProtein('');
    setFat('');
    setWeight('');
    onClose();
  };

  if (!isOpen) return null;

  return (
    <Modal
      visible={isOpen}
      animationType="fade"
      transparent={true}
      onRequestClose={handleClose}>
      <View style={styles.overlay}>
        <TouchableWithoutFeedback onPress={handleClose}>
          <View style={styles.overlayTouchable} />
        </TouchableWithoutFeedback>
        <TouchableWithoutFeedback>
          <View style={styles.modalContainer} onStartShouldSetResponder={() => true}>
            <TouchableOpacity
              style={styles.closeButton}
              onPress={handleClose}>
              <Icon name="close" size={28} color="#ffffff" />
            </TouchableOpacity>

            <ScrollView
              style={styles.modalContent}
              contentContainerStyle={styles.modalContentContainer}
              keyboardShouldPersistTaps="handled"
              showsVerticalScrollIndicator={false}>
            {/* 음식 이름 */}
            <View style={styles.inputGroup}>
              <TextInput
                style={styles.foodNameInput}
                placeholder="음식 이름 (최대 20자)"
                placeholderTextColor="rgba(255, 255, 255, 0.7)"
                value={foodName}
                onChangeText={text => setFoodName(text.slice(0, 20))}
                maxLength={20}
              />
            </View>

            {/* 칼로리 & 탄수화물 */}
            <View style={styles.inputRow}>
              <View style={styles.inputGroupHalf}>
                <Text style={[styles.inputLabel, {marginBottom: 10}]}>칼로리</Text>
                <TextInput
                  style={styles.inputField}
                  placeholder="0"
                  placeholderTextColor="rgba(255, 255, 255, 0.5)"
                  value={calories}
                  onChangeText={setCalories}
                  keyboardType="number-pad"
                />
              </View>
              <View style={styles.inputGroupHalf}>
                <Text style={[styles.inputLabel, {marginBottom: 10}]}>탄수화물</Text>
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

            {/* 단백질 & 지방 */}
            <View style={styles.inputRow}>
              <View style={styles.inputGroupHalf}>
                <Text style={[styles.inputLabel, {marginBottom: 10}]}>단백질</Text>
                <TextInput
                  style={styles.inputField}
                  placeholder="0"
                  placeholderTextColor="rgba(255, 255, 255, 0.5)"
                  value={protein}
                  onChangeText={setProtein}
                  keyboardType="number-pad"
                />
              </View>
              <View style={styles.inputGroupHalf}>
                <Text style={[styles.inputLabel, {marginBottom: 10}]}>지방</Text>
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

            {/* 총 중량 */}
            <View style={styles.inputGroup}>
              <Text style={styles.inputLabelCenter}>총 중량</Text>
              <TextInput
                style={styles.inputField}
                placeholder="0"
                placeholderTextColor="rgba(255, 255, 255, 0.5)"
                value={weight}
                onChangeText={setWeight}
                keyboardType="number-pad"
              />
            </View>

            {/* 저장하기 버튼 */}
            <TouchableOpacity 
              style={[styles.saveButton, isLoading && styles.saveButtonDisabled]} 
              onPress={handleSave}
              disabled={isLoading}>
              {isLoading ? (
                <ActivityIndicator size="small" color="#000000" />
              ) : (
                <Text style={styles.saveButtonText}>저장하기</Text>
              )}
            </TouchableOpacity>
          </ScrollView>
        </View>
        </TouchableWithoutFeedback>
      </View>
    </Modal>
  );
};

const styles = StyleSheet.create({
  overlay: {
    flex: 1,
    backgroundColor: 'rgba(0, 0, 0, 0.6)',
    justifyContent: 'center',
    alignItems: 'center',
  },
  overlayTouchable: {
    position: 'absolute',
    top: 0,
    left: 0,
    right: 0,
    bottom: 0,
  },
  modalContainer: {
    backgroundColor: '#252525',
    borderRadius: 20,
    paddingVertical: 30,
    paddingHorizontal: 20,
    width: '90%',
    maxWidth: 420,
    maxHeight: '90%',
    position: 'relative',
    zIndex: 999,
    elevation: 5,
  },
  closeButton: {
    position: 'absolute',
    top: 15,
    right: 15,
    backgroundColor: 'transparent',
    borderWidth: 0,
    padding: 0,
    zIndex: 10,
  },
  modalContent: {
    width: '100%',
  },
  modalContentContainer: {
    paddingTop: 10,
    paddingBottom: 10,
  },
  inputGroup: {
    marginBottom: 20,
  },
  inputRow: {
    flexDirection: 'row',
    marginBottom: 20,
    gap: 20,
  },
  inputGroupHalf: {
    flex: 1,
  },
  foodNameInput: {
    width: '100%',
    backgroundColor: '#464646',
    borderWidth: 0,
    borderRadius: 10,
    padding: 20,
    fontSize: 16,
    fontWeight: '700',
    color: '#ffffff',
  },
  inputLabel: {
    fontSize: 15,
    fontWeight: '700',
    color: '#ffffff',
    textAlign: 'center',
  },
  inputLabelCenter: {
    fontSize: 15,
    fontWeight: '700',
    color: '#ffffff',
    textAlign: 'center',
    marginBottom: 10,
  },
  inputField: {
    width: '100%',
    backgroundColor: '#464646',
    borderWidth: 0,
    borderRadius: 10,
    padding: 20,
    fontSize: 16,
    fontWeight: '700',
    color: '#ffffff',
    textAlign: 'center',
  },
  saveButton: {
    width: '100%',
    backgroundColor: '#e3ff7c',
    borderWidth: 0,
    borderRadius: 10,
    paddingVertical: 20,
    alignItems: 'center',
    marginTop: 10,
  },
  saveButtonDisabled: {
    opacity: 0.6,
  },
  saveButtonText: {
    fontSize: 16,
    fontWeight: '700',
    color: '#000000',
  },
});

export default FoodDirectInputModal;
