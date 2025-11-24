import React, {useState, useEffect, useRef} from 'react';
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
  Keyboard,
} from 'react-native';
import { Ionicons as Icon } from '@expo/vector-icons';
import {mealAPI} from '../../services';
import type {SearchFoodResponse} from '../../types';

interface FoodDirectInputModalProps {
  isOpen: boolean;
  onClose: () => void;
  onSave: (foodData: {
    id?: number;
    name: string;
    calories: number;
    carbs: number;
    protein: number;
    fat: number;
    weight: number;
  }) => void;
  initialFood?: {
    id?: number;
    name: string;
    calories: number;
    carbs: number;
    protein: number;
    fat: number;
    weight?: number;
  } | null;
}

const FoodDirectInputModal: React.FC<FoodDirectInputModalProps> = ({
  isOpen,
  onClose,
  onSave,
  initialFood,
}) => {
  const [foodName, setFoodName] = useState('');
  const [calories, setCalories] = useState('');
  const [carbs, setCarbs] = useState('');
  const [protein, setProtein] = useState('');
  const [fat, setFat] = useState('');
  const [weight, setWeight] = useState('');
  const [portion, setPortion] = useState('');
  const [inputType, setInputType] = useState<'weight' | 'portion'>('weight');
  const [isLoading, setIsLoading] = useState(false);
  
  // 초기 영양소 값과 중량을 저장 (비율 계산용)
  const baseNutritionRef = useRef<{
    calories: number;
    carbs: number;
    protein: number;
    fat: number;
    weight: number;
  } | null>(null);

  // 초기값 설정
  useEffect(() => {
    if (isOpen && initialFood) {
      const initialWeight = initialFood.weight || 100;
      setFoodName(initialFood.name || '');
      setCalories(String(initialFood.calories || 0));
      setCarbs(String(initialFood.carbs || 0));
      setProtein(String(initialFood.protein || 0));
      setFat(String(initialFood.fat || 0));
      setWeight(String(initialWeight));
      setPortion('1');
      setInputType('weight');
      
      // 초기값 저장
      baseNutritionRef.current = {
        calories: initialFood.calories || 0,
        carbs: initialFood.carbs || 0,
        protein: initialFood.protein || 0,
        fat: initialFood.fat || 0,
        weight: initialWeight,
      };
    } else if (isOpen && !initialFood) {
      // 직접 입력 모드일 때 초기화
      setFoodName('');
      setCalories('');
      setCarbs('');
      setProtein('');
      setFat('');
      setWeight('');
      setPortion('1');
      setInputType('weight');
      baseNutritionRef.current = null;
    }
  }, [isOpen, initialFood]);

  // 직접 입력 모드에서 baseNutritionRef 업데이트
  const updateBaseNutritionForDirectInput = (weightValue?: number) => {
    if (!initialFood) {
      const currentWeight = weightValue !== undefined ? weightValue : Number(weight);
      if (currentWeight > 0) {
        const caloriesValue = Number(calories) || 0;
        const carbsValue = Number(carbs) || 0;
        const proteinValue = Number(protein) || 0;
        const fatValue = Number(fat) || 0;
        
        baseNutritionRef.current = {
          calories: caloriesValue,
          carbs: carbsValue,
          protein: proteinValue,
          fat: fatValue,
          weight: currentWeight,
        };
        // 인분도 업데이트
        setPortion('1');
      }
    }
  };

  // 중량/인분 변경 시 영양소 자동 계산
  const calculateNutrition = (newWeight: number) => {
    if (!baseNutritionRef.current || baseNutritionRef.current.weight === 0) {
      return;
    }

    const ratio = newWeight / baseNutritionRef.current.weight;
    
    setCalories(String(Math.round(baseNutritionRef.current.calories * ratio)));
    // 소수점 2자리까지 유지
    setCarbs(String(Math.round(baseNutritionRef.current.carbs * ratio * 100) / 100));
    setProtein(String(Math.round(baseNutritionRef.current.protein * ratio * 100) / 100));
    setFat(String(Math.round(baseNutritionRef.current.fat * ratio * 100) / 100));
  };

  // 중량 변경 핸들러
  const handleWeightChange = (text: string) => {
    setWeight(text);
    const weightValue = Number(text);
    
    // 직접 입력 모드에서 중량을 입력하면 그게 1인분이 되도록 baseNutritionRef 설정
    if (weightValue > 0 && !initialFood) {
      // 직접 입력 모드: 사용자가 중량을 입력하면 그게 1인분 기준이 됨
      updateBaseNutritionForDirectInput(weightValue);
    } else if (weightValue > 0 && baseNutritionRef.current) {
      // 검색에서 온 음식이거나 이미 baseNutritionRef가 설정된 경우
      calculateNutrition(weightValue);
      // 인분도 자동 업데이트
      const portionValue = weightValue / baseNutritionRef.current.weight;
      setPortion(String(portionValue));
    }
  };

  // 인분 변경 핸들러
  const handlePortionChange = (text: string) => {
    setPortion(text);
    const portionValue = Number(text);
    if (portionValue > 0 && baseNutritionRef.current) {
      // 1인분 = 음식의 실제 중량 (baseNutritionRef.current.weight)
      const newWeight = portionValue * baseNutritionRef.current.weight;
      setWeight(String(newWeight));
      calculateNutrition(newWeight);
    }
  };

  // 입력 타입 변경 시 중량/인분 변환 및 계산
  const handleInputTypeChange = (type: 'weight' | 'portion') => {
    setInputType(type);
    
    if (type === 'portion' && weight && baseNutritionRef.current) {
      // 중량 -> 인분 변환 (1인분 = 음식의 실제 중량)
      const portionValue = Number(weight) / baseNutritionRef.current.weight;
      setPortion(String(portionValue));
    } else if (type === 'weight' && portion && baseNutritionRef.current) {
      // 인분 -> 중량 변환
      const weightValue = Number(portion) * baseNutritionRef.current.weight;
      setWeight(String(weightValue));
      if (weightValue > 0) {
        calculateNutrition(weightValue);
      }
    }
  };

  const handleSave = async () => {
    if (!foodName.trim()) {
      Alert.alert('알림', '음식 이름을 입력해주세요.');
      return;
    }

    // 중량 또는 인분 중 하나는 필수
    const weightValue = inputType === 'weight' ? Number(weight) : 0;
    const portionValue = inputType === 'portion' ? Number(portion) : 0;
    
    if (inputType === 'weight' && weightValue <= 0) {
      Alert.alert('알림', '총 중량을 입력해주세요.');
      return;
    }
    
    if (inputType === 'portion' && portionValue <= 0) {
      Alert.alert('알림', '인분을 입력해주세요.');
      return;
    }

    // 인분을 중량으로 변환 (1인분 = 음식의 실제 중량)
    const baseWeight = baseNutritionRef.current?.weight || 100; // 기본값 100g (직접 입력 모드에서 중량 미입력 시)
    const finalWeight = inputType === 'weight' ? weightValue : portionValue * baseWeight;

    // 검색에서 온 음식이면 바로 저장, 직접 입력이면 API 호출
    if (initialFood && initialFood.id) {
      // 검색에서 선택한 음식 - 바로 저장
      const foodData = {
        id: initialFood.id,
        name: foodName.trim(),
        calories: Number(calories) || 0,
        carbs: Number(carbs) || 0,
        protein: Number(protein) || 0,
        fat: Number(fat) || 0,
        weight: finalWeight,
      };
      onSave(foodData);
      handleClose();
    } else {
      // 직접 입력 - API 호출
      setIsLoading(true);
      try {
        const foodData = {
          name: foodName.trim(),
          weight: finalWeight,
          calories: Number(calories) || 0,
          carbs: Number(carbs) || 0,
          protein: Number(protein) || 0,
          fat: Number(fat) || 0,
        };

        const response: SearchFoodResponse = await mealAPI.addManualFood(foodData);

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
    }
  };

  const handleClose = () => {
    setFoodName('');
    setCalories('');
    setCarbs('');
    setProtein('');
    setFat('');
    setWeight('');
    setPortion('1');
    setInputType('weight');
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
            <ScrollView
              style={styles.modalContent}
              contentContainerStyle={styles.modalContentContainer}
              keyboardShouldPersistTaps="handled"
              showsVerticalScrollIndicator={false}>
            {/* 헤더 */}
            <View style={styles.modalHeader}>
              <Text style={styles.modalTitle}>음식 정보를 입력해주세요</Text>
              <TouchableOpacity
                style={styles.closeButtonTop}
                onPress={handleClose}>
                <Icon name="close" size={24} color="#ffffff" />
              </TouchableOpacity>
            </View>

            {/* 음식 이름 */}
            <View style={styles.inputGroup}>
              <TextInput
                style={styles.foodNameInput}
                placeholder="음식 이름 (최대 20자)"
                placeholderTextColor="rgba(255, 255, 255, 0.7)"
                value={foodName}
                onChangeText={text => setFoodName(text.slice(0, 20))}
                maxLength={20}
                returnKeyType="done"
                blurOnSubmit={true}
                onSubmitEditing={() => Keyboard.dismiss()}
              />
            </View>

            {/* 칼로리 & 탄수화물 */}
            <View style={styles.inputRow}>
              <View style={styles.inputGroupHalf}>
                <Text style={styles.inputLabel}>칼로리</Text>
                <TextInput
                  style={styles.inputField}
                  placeholder="0"
                  placeholderTextColor="rgba(255, 255, 255, 0.5)"
                  value={calories}
                  onChangeText={(text) => {
                    setCalories(text);
                    // 직접 입력 모드에서 중량이 입력되어 있으면 baseNutritionRef 업데이트
                    updateBaseNutritionForDirectInput();
                  }}
                  keyboardType="number-pad"
                  returnKeyType="done"
                  blurOnSubmit={true}
                  onSubmitEditing={() => Keyboard.dismiss()}
                />
              </View>
              <View style={styles.inputGroupHalf}>
                <Text style={styles.inputLabel}>탄수화물</Text>
                <TextInput
                  style={styles.inputField}
                  placeholder="0"
                  placeholderTextColor="rgba(255, 255, 255, 0.5)"
                  value={carbs}
                  onChangeText={(text) => {
                    setCarbs(text);
                    updateBaseNutritionForDirectInput();
                  }}
                  keyboardType="number-pad"
                  returnKeyType="done"
                  blurOnSubmit={true}
                  onSubmitEditing={() => Keyboard.dismiss()}
                />
              </View>
            </View>

            {/* 단백질 & 지방 */}
            <View style={styles.inputRow}>
              <View style={styles.inputGroupHalf}>
                <Text style={styles.inputLabel}>단백질</Text>
                <TextInput
                  style={styles.inputField}
                  placeholder="0"
                  placeholderTextColor="rgba(255, 255, 255, 0.5)"
                  value={protein}
                  onChangeText={(text) => {
                    setProtein(text);
                    updateBaseNutritionForDirectInput();
                  }}
                  keyboardType="number-pad"
                  returnKeyType="done"
                  blurOnSubmit={true}
                  onSubmitEditing={() => Keyboard.dismiss()}
                />
              </View>
              <View style={styles.inputGroupHalf}>
                <Text style={styles.inputLabel}>지방</Text>
                <TextInput
                  style={styles.inputField}
                  placeholder="0"
                  placeholderTextColor="rgba(255, 255, 255, 0.5)"
                  value={fat}
                  onChangeText={(text) => {
                    setFat(text);
                    updateBaseNutritionForDirectInput();
                  }}
                  keyboardType="number-pad"
                  returnKeyType="done"
                  blurOnSubmit={true}
                  onSubmitEditing={() => Keyboard.dismiss()}
                />
              </View>
            </View>

            {/* 총 중량 / 인분 선택 */}
            <View style={styles.inputGroup}>
              <View style={styles.weightInputContainer}>
                <View style={styles.weightTypeSelector}>
                  <TouchableOpacity
                    style={[
                      styles.weightTypeButton,
                      inputType === 'weight' && styles.weightTypeButtonActive,
                    ]}
                    onPress={() => handleInputTypeChange('weight')}>
                    <Text
                      style={[
                        styles.weightTypeText,
                        inputType === 'weight' && styles.weightTypeTextActive,
                      ]}>
                      중량
                    </Text>
                  </TouchableOpacity>
                  <TouchableOpacity
                    style={[
                      styles.weightTypeButton,
                      inputType === 'portion' && styles.weightTypeButtonActive,
                    ]}
                    onPress={() => handleInputTypeChange('portion')}>
                    <Text
                      style={[
                        styles.weightTypeText,
                        inputType === 'portion' && styles.weightTypeTextActive,
                      ]}>
                      인분
                    </Text>
                  </TouchableOpacity>
                </View>
                <TextInput
                  style={styles.weightInputField}
                  placeholder="0"
                  placeholderTextColor="rgba(255, 255, 255, 0.5)"
                  value={inputType === 'weight' ? weight : portion}
                  onChangeText={inputType === 'weight' ? handleWeightChange : handlePortionChange}
                  keyboardType="number-pad"
                  returnKeyType="done"
                  blurOnSubmit={true}
                  onSubmitEditing={() => Keyboard.dismiss()}
                />
              </View>
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
  modalHeader: {
    flexDirection: 'row',
    justifyContent: 'space-between',
    alignItems: 'center',
    marginBottom: 24,
    paddingTop: 4,
  },
  modalTitle: {
    fontSize: 15,
    fontWeight: '700',
    color: '#ffffff',
    flex: 1,
  },
  closeButtonTop: {
    padding: 4,
    width: 32,
    height: 32,
    justifyContent: 'center',
    alignItems: 'center',
  },
  weightInputContainer: {
    gap: 10,
  },
  weightTypeSelector: {
    flexDirection: 'row',
    gap: 12,
    justifyContent: 'center',
  },
  weightTypeButton: {
    flex: 1,
    backgroundColor: '#393a38',
    borderRadius: 10,
    paddingVertical: 10,
    paddingHorizontal: 16,
    alignItems: 'center',
    justifyContent: 'center',
  },
  weightTypeButtonActive: {
    backgroundColor: '#e3ff7c',
  },
  weightTypeText: {
    fontSize: 15,
    fontWeight: '700',
    color: '#ffffff',
  },
  weightTypeTextActive: {
    color: '#000000',
  },
  weightInputField: {
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
  modalContent: {
    width: '100%',
  },
  modalContentContainer: {
    paddingTop: 4,
    paddingBottom: 20,
  },
  inputGroup: {
    marginBottom: 24,
  },
  inputRow: {
    flexDirection: 'row',
    marginBottom: 24,
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
    marginBottom: 10,
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
    paddingVertical: 16,
    alignItems: 'center',
    marginTop: 4,
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
