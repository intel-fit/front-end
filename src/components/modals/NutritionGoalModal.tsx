import React, { useState, useEffect } from 'react';
import {
  View,
  Text,
  Modal,
  TouchableOpacity,
  TouchableWithoutFeedback,
  StyleSheet,
  TextInput,
  Alert,
  ActivityIndicator,
  ScrollView,
} from 'react-native';
import { Ionicons as Icon } from '@expo/vector-icons';
import { mealAPI } from '../../services';
import type { NutritionGoal, SetNutritionGoalRequest } from '../../types';

interface NutritionGoalModalProps {
  isOpen: boolean;
  onClose: () => void;
  currentGoal: NutritionGoal | null;
  onGoalUpdate: () => void;
}

const NutritionGoalModal: React.FC<NutritionGoalModalProps> = ({
  isOpen,
  onClose,
  currentGoal,
  onGoalUpdate,
}) => {
  const [loading, setLoading] = useState(false);
  const [goalType, setGoalType] = useState<'AUTO' | 'MANUAL'>('MANUAL');
  const [targetCalories, setTargetCalories] = useState('');
  const [targetCarbs, setTargetCarbs] = useState('');
  const [targetProtein, setTargetProtein] = useState('');
  const [targetFat, setTargetFat] = useState('');

  useEffect(() => {
    if (isOpen) {
      // 모달이 열릴 때 항상 수동 입력 모드로 설정
      setGoalType('MANUAL');
      
      if (currentGoal) {
        setTargetCalories(String(currentGoal.targetCalories || 0));
        setTargetCarbs(String(currentGoal.targetCarbs || 0));
        setTargetProtein(String(currentGoal.targetProtein || 0));
        setTargetFat(String(currentGoal.targetFat || 0));
      } else {
        // 목표가 없으면 0으로 초기화
        setTargetCalories('0');
        setTargetCarbs('0');
        setTargetProtein('0');
        setTargetFat('0');
      }
    }
  }, [currentGoal, isOpen]);

  const handleClose = () => {
    setTargetCalories('');
    setTargetCarbs('');
    setTargetProtein('');
    setTargetFat('');
    onClose();
  };

  // 영양 목표 수정하기
  const handleUpdate = async () => {
    const calories = Number(targetCalories);
    const carbs = Number(targetCarbs);
    const protein = Number(targetProtein);
    const fat = Number(targetFat);

    // 입력값 검증
    if (!targetCalories || calories <= 0) {
      Alert.alert('알림', '칼로리 목표를 입력해주세요.');
      return;
    }
    if (!targetCarbs || carbs <= 0) {
      Alert.alert('알림', '탄수화물 목표를 입력해주세요.');
      return;
    }
    if (!targetProtein || protein <= 0) {
      Alert.alert('알림', '단백질 목표를 입력해주세요.');
      return;
    }
    if (!targetFat || fat <= 0) {
      Alert.alert('알림', '지방 목표를 입력해주세요.');
      return;
    }

    setLoading(true);
    try {
      const goalData: SetNutritionGoalRequest = {
        targetCalories: calories,
        targetCarbs: carbs,
        targetProtein: protein,
        targetFat: fat,
        goalType: goalType, // 현재 선택된 목표 타입 사용
      };

      await mealAPI.setNutritionGoal(goalData);
      Alert.alert('성공', '영양 목표가 수정되었습니다.', [
        {
          text: '확인',
          onPress: () => {
            onGoalUpdate();
            handleClose();
          },
        },
      ]);
    } catch (error: any) {
      console.error('영양 목표 수정 실패:', error);
      Alert.alert('오류', error.message || '영양 목표 수정에 실패했습니다.');
    } finally {
      setLoading(false);
    }
  };

  // 최적의 영양 목표 추천받기
  const handleGetRecommendation = async () => {
    setLoading(true);
    try {
      // TODO: 영양 목표 추천 API 연동
      // 예시: const recommendation = await mealAPI.getRecommendedNutritionGoal();
      
      // 임시로 자동 계산된 목표를 가져오는 방식 (goalType을 AUTO로 설정)
      // 실제 API가 준비되면 아래 코드를 교체
      const recommendation = await mealAPI.getNutritionGoal();
      
      // 추천된 목표가 있으면 입력 필드에 설정
      if (recommendation) {
        setTargetCalories(String(recommendation.targetCalories || 0));
        setTargetCarbs(String(recommendation.targetCarbs || 0));
        setTargetProtein(String(recommendation.targetProtein || 0));
        setTargetFat(String(recommendation.targetFat || 0));
        setGoalType('AUTO');
        Alert.alert('성공', '최적의 영양 목표를 추천받았습니다. 수정 후 저장해주세요.');
      } else {
        Alert.alert('알림', '추천 목표를 가져올 수 없습니다.');
      }
    } catch (error: any) {
      console.error('영양 목표 추천 실패:', error);
      Alert.alert('오류', error.message || '영양 목표 추천에 실패했습니다.');
    } finally {
      setLoading(false);
    }
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
              {/* 칼로리 & 탄수화물 */}
              <View style={styles.inputRow}>
                <View style={styles.inputGroupHalf}>
                  <Text style={[styles.inputLabel, {marginBottom: 10}]}>칼로리</Text>
                  <TextInput
                    style={styles.inputField}
                    placeholder="0"
                    placeholderTextColor="rgba(255, 255, 255, 0.5)"
                    value={targetCalories}
                    onChangeText={setTargetCalories}
                    keyboardType="number-pad"
                  />
                </View>
                <View style={styles.inputGroupHalf}>
                  <Text style={[styles.inputLabel, {marginBottom: 10}]}>탄수화물</Text>
                  <TextInput
                    style={styles.inputField}
                    placeholder="0"
                    placeholderTextColor="rgba(255, 255, 255, 0.5)"
                    value={targetCarbs}
                    onChangeText={setTargetCarbs}
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
                    value={targetProtein}
                    onChangeText={setTargetProtein}
                    keyboardType="number-pad"
                  />
                </View>
                <View style={styles.inputGroupHalf}>
                  <Text style={[styles.inputLabel, {marginBottom: 10}]}>지방</Text>
                  <TextInput
                    style={styles.inputField}
                    placeholder="0"
                    placeholderTextColor="rgba(255, 255, 255, 0.5)"
                    value={targetFat}
                    onChangeText={setTargetFat}
                    keyboardType="number-pad"
                  />
                </View>
              </View>

              {/* 최적의 영양 목표 추천받기 버튼 */}
              <TouchableOpacity 
                style={[styles.recommendButton, loading && styles.recommendButtonDisabled]} 
                onPress={handleGetRecommendation}
                disabled={loading}>
                {loading ? (
                  <ActivityIndicator size="small" color="#ffffff" />
                ) : (
                  <Text style={styles.recommendButtonText}>최적의 영양 목표 추천받기</Text>
                )}
              </TouchableOpacity>

              {/* 수정하기 버튼 */}
              <TouchableOpacity 
                style={[styles.saveButton, loading && styles.saveButtonDisabled]} 
                onPress={handleUpdate}
                disabled={loading}>
                {loading ? (
                  <ActivityIndicator size="small" color="#000000" />
                ) : (
                  <Text style={styles.saveButtonText}>수정하기</Text>
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
  inputLabel: {
    fontSize: 15,
    fontWeight: '700',
    color: '#ffffff',
    textAlign: 'center',
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
  recommendButton: {
    width: '100%',
    backgroundColor: '#464646',
    borderWidth: 1,
    borderColor: '#e3ff7c',
    borderRadius: 10,
    paddingVertical: 20,
    alignItems: 'center',
    marginTop: 10,
  },
  recommendButtonDisabled: {
    opacity: 0.6,
  },
  recommendButtonText: {
    fontSize: 16,
    fontWeight: '700',
    color: '#e3ff7c',
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

export default NutritionGoalModal;

