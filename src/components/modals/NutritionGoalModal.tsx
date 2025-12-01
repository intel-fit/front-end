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
  Switch,
} from 'react-native';
import { Ionicons as Icon } from '@expo/vector-icons';
import { mealAPI } from '../../services';
import type { NutritionGoal, SetNutritionGoalRequest } from '../../types';

interface NutritionGoalModalProps {
  isOpen: boolean;
  onClose: () => void;
  currentGoal: NutritionGoal | null;
  onGoalUpdate: () => void;
  date?: string; // YYYY-MM-DD 형식, 지정 날짜부터 말일까지 일괄 적용
}

const NutritionGoalModal: React.FC<NutritionGoalModalProps> = ({
  isOpen,
  onClose,
  currentGoal,
  onGoalUpdate,
  date,
}) => {
  const [loading, setLoading] = useState(false);
  const [goalType, setGoalType] = useState<'AUTO' | 'MANUAL'>('MANUAL');
  const [targetCalories, setTargetCalories] = useState('');
  const [targetCarbs, setTargetCarbs] = useState('');
  const [targetProtein, setTargetProtein] = useState('');
  const [targetFat, setTargetFat] = useState('');
  const [isRealTimeRecommendationEnabled, setIsRealTimeRecommendationEnabled] = useState(false);
  const [hasToggled, setHasToggled] = useState(false); // 토글이 실제로 변경되었는지 추적

  useEffect(() => {
    if (isOpen) {
      // 모달이 열릴 때 항상 수동 입력 모드로 설정
      setGoalType('MANUAL');
      // 토글 변경 추적 초기화
      setHasToggled(false);
      
      // 토글이 off일 때만 currentGoal로 초기화
      // 토글이 on이면 API 호출 결과로 업데이트되므로 초기화하지 않음
      // 단, 모달이 처음 열릴 때만 초기화 (토글 상태 변경 시에는 초기화하지 않음)
      if (!isRealTimeRecommendationEnabled) {
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
    }
  }, [currentGoal, isOpen]); // isRealTimeRecommendationEnabled 의존성 제거

  // 토글이 on으로 변경될 때만 오늘 날짜에 대해 GET /food/daily_goal 호출하고 내일부터 말일까지 0으로 설정
  useEffect(() => {
    // 토글이 on으로 변경되었을 때만 실행 (모달이 열릴 때마다 실행되지 않도록)
    // hasToggled가 true이고 isRealTimeRecommendationEnabled가 true일 때만 실행
    if (isOpen && isRealTimeRecommendationEnabled && hasToggled) {
      const setupAutoGoal = async () => {
        try {
          const today = new Date();
          const todayStr = `${today.getFullYear()}-${String(today.getMonth() + 1).padStart(2, '0')}-${String(today.getDate()).padStart(2, '0')}`;
          
          // 1. 오늘 날짜에 대해 GET /food/daily_goal 호출
          console.log('토글 on - 오늘 날짜 자동 목표 저장:', todayStr);
          await mealAPI.getAutoDailyGoal(todayStr);
          
          // 2. 내일 날짜부터 말일까지 0칼로리로 설정
          const todayAfter = new Date(today);
          todayAfter.setDate(todayAfter.getDate() + 1);
          const todayAfterStr = `${todayAfter.getFullYear()}-${String(todayAfter.getMonth() + 1).padStart(2, '0')}-${String(todayAfter.getDate()).padStart(2, '0')}`;
          
          const goalData: SetNutritionGoalRequest = {
            targetCalories: 0,
            targetCarbs: 0,
            targetProtein: 0,
            targetFat: 0,
            goalType: 'MANUAL',
            date: todayAfterStr, // 내일부터 말일까지 일괄 적용
          };
          await mealAPI.setNutritionGoal(goalData);
          console.log('토글 on - 내일부터 말일까지 0칼로리 설정 완료');
        } catch (error: any) {
          console.error('토글 on 설정 실패:', error);
        }
      };
      
      setupAutoGoal();
    }
  }, [isRealTimeRecommendationEnabled, hasToggled]); // isOpen 제거, 토글이 실제로 변경되었을 때만 실행

  // 날짜가 바뀔 때마다 API 호출 (모달이 열려있을 때만)
  useEffect(() => {
    if (isOpen && date) {
      const loadGoal = async () => {
        setLoading(true);
        try {
          // 날짜가 오늘 이전인지 확인 (YYYY-MM-DD 형식 문자열로 직접 비교)
          const today = new Date();
          const todayStr = `${today.getFullYear()}-${String(today.getMonth() + 1).padStart(2, '0')}-${String(today.getDate()).padStart(2, '0')}`;
          
          let goal: any;
          
          if (isRealTimeRecommendationEnabled) {
            // 토글이 on일 때
            if (date === todayStr) {
              // 오늘 날짜면 GET /food/daily_goal 호출
              console.log(`토글 on, 오늘 날짜 (${date} === ${todayStr}) - 자동 목표 저장 API 호출`);
              goal = await mealAPI.getAutoDailyGoal(date);
              console.log('오늘 날짜 자동 목표 응답:', goal);
            } else {
              // 오늘 이전 또는 오늘 이후 날짜면 GET /food/nutrition-goal/get 호출
              console.log(`토글 on, ${date < todayStr ? '오늘 이전' : '오늘 이후'} 날짜 (${date}) - 조회 API 호출`);
              goal = await mealAPI.getNutritionGoal(date);
              console.log('조회 응답:', goal);
            }
          } else {
            // 토글이 off일 때: 무조건 GET /food/nutrition-goal/get 호출
            console.log(`토글 off - 조회 API 호출 (${date})`);
            goal = await mealAPI.getNutritionGoal(date);
          }
          
          // 목표로 UI 업데이트 (항상 업데이트)
          if (goal) {
            console.log('UI 업데이트할 목표:', goal);
            setTargetCalories(String(goal.targetCalories ?? 0));
            setTargetCarbs(String(goal.targetCarbs ?? 0));
            setTargetProtein(String(goal.targetProtein ?? 0));
            setTargetFat(String(goal.targetFat ?? 0));
            setGoalType(goal.goalType || 'AUTO');
            console.log('UI 업데이트 완료:', {
              calories: goal.targetCalories ?? 0,
              carbs: goal.targetCarbs ?? 0,
              protein: goal.targetProtein ?? 0,
              fat: goal.targetFat ?? 0,
            });
          } else {
            console.warn('목표가 없어서 UI 업데이트하지 않음');
          }
        } catch (error: any) {
          console.error('영양 목표 로드 실패:', error);
          Alert.alert('오류', error.message || '영양 목표를 가져오는데 실패했습니다.');
        } finally {
          setLoading(false);
        }
      };
      
      loadGoal();
    }
  }, [isOpen, isRealTimeRecommendationEnabled, date]);

  const handleClose = () => {
    // 모달을 닫을 때는 상태를 변경하지 않고 그냥 닫기만 함
    // 사용자가 변경사항을 저장하지 않고 닫은 경우이므로 원래 상태 유지
    // 부모 컴포넌트에서 필요시 자체적으로 데이터를 다시 조회함
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
      // date 필드가 있으면 지정 날짜부터 말일까지 일괄 적용
      const goalData: SetNutritionGoalRequest = {
        targetCalories: calories,
        targetCarbs: 0, // 서버에서 계산됨
        targetProtein: 0, // 서버에서 계산됨
        targetFat: 0, // 서버에서 계산됨
        goalType: 'MANUAL',
        date: date, // 날짜가 있으면 포함 (YYYY-MM-DD 형식)
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
      
      // 알람 없이 내용만 업데이트
      onGoalUpdate();
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
              <View style={[styles.inputGroup, isRealTimeRecommendationEnabled && styles.inputGroupDisabled]}>
                <Text style={[styles.inputLabel, {marginBottom: 10}, isRealTimeRecommendationEnabled && styles.inputLabelDisabled]}>
                  칼로리 목표
                </Text>
                <View style={styles.calorieInputRow}>
                  <TextInput
                    style={[
                      styles.inputFieldWithButton,
                      isRealTimeRecommendationEnabled && styles.inputFieldDisabled
                    ]}
                    placeholder="칼로리를 입력하세요"
                    placeholderTextColor="rgba(255, 255, 255, 0.5)"
                    value={targetCalories}
                    onChangeText={isRealTimeRecommendationEnabled ? undefined : setTargetCalories}
                    keyboardType="number-pad"
                    editable={!isRealTimeRecommendationEnabled}
                  />
                  <TouchableOpacity
                    style={[
                      styles.calculateButton,
                      (loading || isRealTimeRecommendationEnabled) && styles.calculateButtonDisabled
                    ]}
                    onPress={handleConfirm}
                    disabled={loading || isRealTimeRecommendationEnabled}>
                    {loading ? (
                      <ActivityIndicator size="small" color="#000000" />
                    ) : (
                      <Text style={styles.calculateButtonText}>확인</Text>
                    )}
                  </TouchableOpacity>
                </View>
                <Text style={[styles.inputHint, isRealTimeRecommendationEnabled && styles.inputHintDisabled]}>
                  {isRealTimeRecommendationEnabled
                    ? '실시간 추천이 활성화되어 있습니다. 자동으로 계산된 영양 목표가 표시됩니다.'
                    : '칼로리를 입력하고 확인 버튼을 누르면 탄수화물, 단백질, 지방이 자동으로 계산되어 저장됩니다.'}
                </Text>
              </View>

              {/* 계산된 영양소 표시 (읽기 전용) */}
              <View style={styles.inputRow}>
                <View style={styles.inputGroupHalf}>
                  <Text style={[
                    styles.inputLabel,
                    {marginBottom: 10},
                    isRealTimeRecommendationEnabled && styles.inputLabelDisabled
                  ]}>
                    탄수화물
                  </Text>
                  <View style={[
                    styles.readOnlyField,
                    isRealTimeRecommendationEnabled && styles.readOnlyFieldDisabled
                  ]}>
                    <Text style={[
                      styles.readOnlyText,
                      isRealTimeRecommendationEnabled && styles.readOnlyTextDisabled
                    ]}>
                      {targetCarbs ? `${Math.round(Number(targetCarbs))}g` : '-'}
                    </Text>
                  </View>
                </View>
                <View style={styles.inputGroupHalf}>
                  <Text style={[
                    styles.inputLabel,
                    {marginBottom: 10},
                    isRealTimeRecommendationEnabled && styles.inputLabelDisabled
                  ]}>
                    단백질
                  </Text>
                  <View style={[
                    styles.readOnlyField,
                    isRealTimeRecommendationEnabled && styles.readOnlyFieldDisabled
                  ]}>
                    <Text style={[
                      styles.readOnlyText,
                      isRealTimeRecommendationEnabled && styles.readOnlyTextDisabled
                    ]}>
                      {targetProtein ? `${Math.round(Number(targetProtein))}g` : '-'}
                    </Text>
                  </View>
                </View>
              </View>

              <View style={styles.inputRow}>
                <View style={styles.inputGroupHalf}>
                  <Text style={[
                    styles.inputLabel,
                    {marginBottom: 10},
                    isRealTimeRecommendationEnabled && styles.inputLabelDisabled
                  ]}>
                    지방
                  </Text>
                  <View style={[
                    styles.readOnlyField,
                    isRealTimeRecommendationEnabled && styles.readOnlyFieldDisabled
                  ]}>
                    <Text style={[
                      styles.readOnlyText,
                      isRealTimeRecommendationEnabled && styles.readOnlyTextDisabled
                    ]}>
                      {targetFat ? `${Math.round(Number(targetFat))}g` : '-'}
                    </Text>
                  </View>
                </View>
                <View style={styles.inputGroupHalf} />
              </View>

              {/* 실시간 영양 목표 추천받기 토글 */}
              <View style={styles.toggleContainer}>
                <View style={styles.toggleContent}>
                  <Text style={styles.toggleLabel}>실시간 영양 목표 추천받기</Text>
                  <Switch
                    value={isRealTimeRecommendationEnabled}
                    onValueChange={(value) => {
                      setIsRealTimeRecommendationEnabled(value);
                      setHasToggled(true); // 토글이 실제로 변경되었음을 표시
                    }}
                    trackColor={{ false: '#464646', true: '#e3ff7c' }}
                    thumbColor={isRealTimeRecommendationEnabled ? '#000000' : '#ffffff'}
                    ios_backgroundColor="#464646"
                  />
                </View>
                <Text style={styles.toggleHint}>
                  {isRealTimeRecommendationEnabled 
                    ? '실시간으로 최적의 영양 목표를 추천받습니다.' 
                    : '수동으로 영양 목표를 설정합니다.'}
                </Text>
              </View>

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
  toggleContainer: {
    marginBottom: 20,
    marginTop: 10,
  },
  toggleContent: {
    flexDirection: 'row',
    justifyContent: 'space-between',
    alignItems: 'center',
    marginBottom: 8,
  },
  toggleLabel: {
    fontSize: 15,
    fontWeight: '700',
    color: '#ffffff',
    flex: 1,
  },
  toggleHint: {
    fontSize: 12,
    fontWeight: '400',
    color: 'rgba(255, 255, 255, 0.6)',
    marginTop: 4,
  },
  inputGroupDisabled: {
    opacity: 0.5,
  },
  inputLabelDisabled: {
    color: 'rgba(255, 255, 255, 0.5)',
  },
  inputFieldDisabled: {
    backgroundColor: '#393939',
    color: 'rgba(255, 255, 255, 0.5)',
  },
  inputHintDisabled: {
    color: 'rgba(255, 255, 255, 0.4)',
  },
  readOnlyFieldDisabled: {
    backgroundColor: '#393939',
    opacity: 0.5,
  },
  readOnlyTextDisabled: {
    color: 'rgba(255, 255, 255, 0.4)',
  },
});

export default NutritionGoalModal;

