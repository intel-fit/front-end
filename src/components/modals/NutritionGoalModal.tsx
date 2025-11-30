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

  // 칼로리 입력 후 확인 버튼 클릭 시 저장 (POST /food/nutrition-goal/manual-calorie)
  const handleConfirm = async () => {
    const calories = Number(targetCalories);

    // 입력값 검증 (칼로리만 필수)
    if (!targetCalories || calories <= 0) {
      Alert.alert('알림', '칼로리 목표를 입력해주세요.');
      return;
    }

    setLoading(true);
    try {
      // 칼로리만 전송 (나머지는 서버에서 자동 계산)
      const goalData: SetNutritionGoalRequest = {
        targetCalories: calories,
        targetCarbs: 0, // 서버에서 계산됨
        targetProtein: 0, // 서버에서 계산됨
        targetFat: 0, // 서버에서 계산됨
        goalType: 'MANUAL',
      };

      const result = await mealAPI.setNutritionGoal(goalData);
      console.log('서버 응답:', result);
      
      // 서버 응답에서 직접 계산된 값 사용 (getDailyGoal 호출하지 않음)
      // setNutritionGoal 응답: { success, message, goal: { targetCalories, targetCarbs, targetProtein, targetFat } }
      if (result.goal) {
        setTargetCalories(String(result.goal.targetCalories || calories));
        setTargetCarbs(String(result.goal.targetCarbs || 0));
        setTargetProtein(String(result.goal.targetProtein || 0));
        setTargetFat(String(result.goal.targetFat || 0));
        console.log('UI 업데이트:', {
          calories: result.goal.targetCalories,
          carbs: result.goal.targetCarbs,
          protein: result.goal.targetProtein,
          fat: result.goal.targetFat,
        });
      } else {
        // 응답에 goal이 없는 경우 (드물지만 안전을 위해)
        setTargetCalories(String(calories));
        setTargetCarbs('0');
        setTargetProtein('0');
        setTargetFat('0');
      }
      
      // 성공 메시지 표시
      Alert.alert('성공', '영양 목표가 설정되었습니다.', [
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
      const errorMessage = error.message || '영양 목표 수정에 실패했습니다.';
      
      // 사용자를 찾을 수 없는 경우 특별 처리
      if (errorMessage.includes('User not found') || errorMessage.includes('사용자를 찾을 수 없')) {
        Alert.alert(
          '오류', 
          '사용자 정보를 찾을 수 없습니다.\n다시 로그인해주세요.',
          [
            {
              text: '확인',
              onPress: () => {
                handleClose();
              },
            },
          ]
        );
      } else {
        Alert.alert('오류', errorMessage);
      }
    } finally {
      setLoading(false);
    }
  };

  // 최적의 영양 목표 추천받기 (모든 숫자 업데이트)
  const handleGetRecommendation = async () => {
    setLoading(true);
    try {
      // AI 추천 영양 목표 조회
      const recommendation = await mealAPI.getNutritionGoal();
      
      // 추천된 목표가 있으면 모든 필드 업데이트
      if (recommendation) {
        setTargetCalories(String(recommendation.targetCalories || 0));
        setTargetCarbs(String(recommendation.targetCarbs || 0));
        setTargetProtein(String(recommendation.targetProtein || 0));
        setTargetFat(String(recommendation.targetFat || 0));
        setGoalType('AUTO');
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
              {/* 칼로리 입력 (나머지는 자동 계산) */}
              <View style={styles.inputGroup}>
                <Text style={[styles.inputLabel, {marginBottom: 10}]}>칼로리 목표</Text>
                <View style={styles.calorieInputRow}>
                  <TextInput
                    style={styles.inputFieldWithButton}
                    placeholder="칼로리를 입력하세요"
                    placeholderTextColor="rgba(255, 255, 255, 0.5)"
                    value={targetCalories}
                    onChangeText={setTargetCalories}
                    keyboardType="number-pad"
                  />
                  <TouchableOpacity
                    style={[styles.calculateButton, loading && styles.calculateButtonDisabled]}
                    onPress={handleConfirm}
                    disabled={loading}>
                    {loading ? (
                      <ActivityIndicator size="small" color="#000000" />
                    ) : (
                      <Text style={styles.calculateButtonText}>확인</Text>
                    )}
                  </TouchableOpacity>
                </View>
                <Text style={styles.inputHint}>
                  칼로리를 입력하고 확인 버튼을 누르면 탄수화물, 단백질, 지방이 자동으로 계산되어 저장됩니다.
                </Text>
              </View>

              {/* 계산된 영양소 표시 (읽기 전용) */}
              <View style={styles.inputRow}>
                <View style={styles.inputGroupHalf}>
                  <Text style={[styles.inputLabel, {marginBottom: 10}]}>탄수화물</Text>
                  <View style={styles.readOnlyField}>
                    <Text style={styles.readOnlyText}>
                      {targetCarbs ? `${Math.round(Number(targetCarbs))}g` : '-'}
                    </Text>
                  </View>
                </View>
                <View style={styles.inputGroupHalf}>
                  <Text style={[styles.inputLabel, {marginBottom: 10}]}>단백질</Text>
                  <View style={styles.readOnlyField}>
                    <Text style={styles.readOnlyText}>
                      {targetProtein ? `${Math.round(Number(targetProtein))}g` : '-'}
                    </Text>
                  </View>
                </View>
              </View>

              <View style={styles.inputRow}>
                <View style={styles.inputGroupHalf}>
                  <Text style={[styles.inputLabel, {marginBottom: 10}]}>지방</Text>
                  <View style={styles.readOnlyField}>
                    <Text style={styles.readOnlyText}>
                      {targetFat ? `${Math.round(Number(targetFat))}g` : '-'}
                    </Text>
                  </View>
                </View>
                <View style={styles.inputGroupHalf} />
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
  calorieInputRow: {
    flexDirection: 'row',
    gap: 10,
    alignItems: 'center',
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
  inputFieldWithButton: {
    flex: 1,
    backgroundColor: '#464646',
    borderWidth: 0,
    borderRadius: 10,
    padding: 20,
    fontSize: 16,
    fontWeight: '700',
    color: '#ffffff',
    textAlign: 'center',
  },
  calculateButton: {
    backgroundColor: '#e3ff7c',
    borderRadius: 10,
    paddingVertical: 20,
    paddingHorizontal: 24,
    minWidth: 80,
    alignItems: 'center',
    justifyContent: 'center',
  },
  calculateButtonDisabled: {
    opacity: 0.6,
  },
  calculateButtonText: {
    fontSize: 16,
    fontWeight: '700',
    color: '#000000',
  },
  inputHint: {
    fontSize: 12,
    fontWeight: '400',
    color: 'rgba(255, 255, 255, 0.6)',
    textAlign: 'center',
    marginTop: 8,
  },
  readOnlyField: {
    width: '100%',
    backgroundColor: '#393939',
    borderWidth: 0,
    borderRadius: 10,
    padding: 20,
    alignItems: 'center',
    justifyContent: 'center',
  },
  readOnlyText: {
    fontSize: 16,
    fontWeight: '700',
    color: 'rgba(255, 255, 255, 0.7)',
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

