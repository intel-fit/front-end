import React, { useState, useEffect } from 'react';
import {
  View,
  Text,
  Modal,
  TouchableOpacity,
  StyleSheet,
  TextInput,
  Alert,
  ActivityIndicator,
  KeyboardAvoidingView,
  Platform,
  ScrollView,
} from 'react-native';
import { Ionicons as Icon } from '@expo/vector-icons';
import { colors } from '../../theme/colors';
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
  const [goalType, setGoalType] = useState<'AUTO' | 'MANUAL'>('AUTO');
  const [targetCalories, setTargetCalories] = useState('');
  const [targetCarbs, setTargetCarbs] = useState('');
  const [targetProtein, setTargetProtein] = useState('');
  const [targetFat, setTargetFat] = useState('');

  useEffect(() => {
    if (currentGoal) {
      setGoalType(currentGoal.goalType);
      setTargetCalories(String(currentGoal.targetCalories || 0));
      setTargetCarbs(String(currentGoal.targetCarbs || 0));
      setTargetProtein(String(currentGoal.targetProtein || 0));
      setTargetFat(String(currentGoal.targetFat || 0));
    } else {
      // 목표가 없으면 0으로 초기화
      setGoalType('MANUAL');
      setTargetCalories('0');
      setTargetCarbs('0');
      setTargetProtein('0');
      setTargetFat('0');
    }
  }, [currentGoal, isOpen]);

  const handleSave = async () => {
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
        goalType: goalType,
      };

      await mealAPI.setNutritionGoal(goalData);
      Alert.alert('성공', '영양 목표가 설정되었습니다.', [
        {
          text: '확인',
          onPress: () => {
            onGoalUpdate();
            onClose();
          },
        },
      ]);
    } catch (error: any) {
      console.error('영양 목표 설정 실패:', error);
      Alert.alert('오류', error.message || '영양 목표 설정에 실패했습니다.');
    } finally {
      setLoading(false);
    }
  };

  return (
    <Modal
      visible={isOpen}
      transparent
      animationType="slide"
      onRequestClose={onClose}>
      <KeyboardAvoidingView
        behavior={Platform.OS === 'ios' ? 'padding' : 'height'}
        style={styles.modalContainer}>
        <View style={styles.modalOverlay}>
          <View style={styles.modalContent}>
            {/* 헤더 */}
            <View style={styles.header}>
              <Text style={styles.headerTitle}>영양 목표 설정</Text>
              <TouchableOpacity onPress={onClose} style={styles.closeButton}>
                <Icon name="close" size={24} color={colors.text} />
              </TouchableOpacity>
            </View>

            <ScrollView style={styles.content} showsVerticalScrollIndicator={false}>
              {/* 목표 타입 표시 */}
              <View style={styles.section}>
                <Text style={styles.sectionTitle}>목표 타입</Text>
                <Text style={styles.goalTypeText}>
                  {goalType === 'AUTO' ? '자동 계산' : '수동 입력'}
                </Text>
              </View>

              {/* 입력 필드 - 항상 표시 */}
              <View style={styles.section}>
                <Text style={styles.sectionTitle}>일일 목표량</Text>

                <View style={styles.inputGroup}>
                  <Text style={styles.inputLabel}>칼로리 (kcal)</Text>
                  <TextInput
                    style={styles.input}
                    value={targetCalories}
                    onChangeText={setTargetCalories}
                    placeholder="예: 2000"
                    placeholderTextColor="#666666"
                    keyboardType="numeric"
                    editable={true}
                    selectionColor="#e3ff7c"
                  />
                </View>

                <View style={styles.inputGroup}>
                  <Text style={styles.inputLabel}>탄수화물 (g)</Text>
                  <TextInput
                    style={styles.input}
                    value={targetCarbs}
                    onChangeText={setTargetCarbs}
                    placeholder="예: 250"
                    placeholderTextColor="#666666"
                    keyboardType="numeric"
                    editable={true}
                    selectionColor="#e3ff7c"
                  />
                </View>

                <View style={styles.inputGroup}>
                  <Text style={styles.inputLabel}>단백질 (g)</Text>
                  <TextInput
                    style={styles.input}
                    value={targetProtein}
                    onChangeText={setTargetProtein}
                    placeholder="예: 150"
                    placeholderTextColor="#666666"
                    keyboardType="numeric"
                    editable={true}
                    selectionColor="#e3ff7c"
                  />
                </View>

                <View style={styles.inputGroup}>
                  <Text style={styles.inputLabel}>지방 (g)</Text>
                  <TextInput
                    style={styles.input}
                    value={targetFat}
                    onChangeText={setTargetFat}
                    placeholder="예: 67"
                    placeholderTextColor="#666666"
                    keyboardType="numeric"
                    editable={true}
                    selectionColor="#e3ff7c"
                  />
                </View>
              </View>
            </ScrollView>

            {/* 저장 버튼 */}
            <View style={styles.footer}>
              <TouchableOpacity
                style={[styles.saveButton, loading && styles.saveButtonDisabled]}
                onPress={handleSave}
                disabled={loading}>
                {loading ? (
                  <ActivityIndicator size="small" color="#000" />
                ) : (
                  <Text style={styles.saveButtonText}>저장</Text>
                )}
              </TouchableOpacity>
            </View>
          </View>
        </View>
      </KeyboardAvoidingView>
    </Modal>
  );
};

const styles = StyleSheet.create({
  modalContainer: {
    flex: 1,
  },
  modalOverlay: {
    flex: 1,
    backgroundColor: 'rgba(0, 0, 0, 0.5)',
    justifyContent: 'flex-end',
  },
  modalContent: {
    backgroundColor: colors.background,
    borderTopLeftRadius: 20,
    borderTopRightRadius: 20,
    maxHeight: '90%',
    paddingBottom: 20,
  },
  header: {
    flexDirection: 'row',
    justifyContent: 'space-between',
    alignItems: 'center',
    padding: 20,
    borderBottomWidth: 1,
    borderBottomColor: colors.border,
  },
  headerTitle: {
    fontSize: 22,
    fontWeight: '800',
    color: colors.text,
  },
  closeButton: {
    padding: 4,
  },
  content: {
    flex: 1,
    padding: 20,
  },
  section: {
    marginBottom: 24,
  },
  sectionTitle: {
    fontSize: 18,
    fontWeight: '700',
    color: colors.text,
    marginBottom: 16,
  },
  goalTypeText: {
    fontSize: 16,
    fontWeight: '600',
    color: colors.text,
    paddingVertical: 8,
  },
  inputGroup: {
    marginBottom: 16,
  },
  inputLabel: {
    fontSize: 15,
    fontWeight: '700',
    color: colors.text,
    marginBottom: 10,
  },
  input: {
    backgroundColor: colors.cardBackground,
    borderRadius: 10,
    padding: 16,
    fontSize: 16,
    color: colors.text,
    borderWidth: 2,
    borderColor: '#555555',
    minHeight: 50,
  },
  infoContainer: {
    backgroundColor: colors.cardBackground,
    borderRadius: 10,
    padding: 16,
  },
  infoRow: {
    flexDirection: 'row',
    justifyContent: 'space-between',
    alignItems: 'center',
    paddingVertical: 8,
  },
  infoLabel: {
    fontSize: 14,
    fontWeight: '600',
    color: colors.text,
  },
  infoValue: {
    fontSize: 14,
    fontWeight: '400',
    color: colors.text,
  },
  footer: {
    paddingHorizontal: 20,
    paddingTop: 12,
  },
  saveButton: {
    backgroundColor: '#e3ff7c',
    borderRadius: 10,
    paddingVertical: 16,
    alignItems: 'center',
  },
  saveButtonDisabled: {
    opacity: 0.6,
  },
  saveButtonText: {
    fontSize: 16,
    fontWeight: '700',
    color: '#000',
  },
});

export default NutritionGoalModal;

