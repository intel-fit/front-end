import React, {useState} from 'react';
import {
  View,
  Text,
  TouchableOpacity,
  StyleSheet,
  ScrollView,
  Alert,
} from 'react-native';
import {SafeAreaView} from 'react-native-safe-area-context';
import { Ionicons as Icon } from '@expo/vector-icons';
import {colors} from '../theme/colors';

interface Set {
  id: number;
  weight: string;
  reps: string;
  completed: boolean;
}

const ExerciseDetailScreen = ({navigation}: any) => {
  const exerciseData = {
    day: '1일차',
    name: '덤벨 들기',
    sets: [
      {id: 1, weight: '10kg', reps: '10회', completed: true},
      {id: 2, weight: '10kg', reps: '10회', completed: false},
      {id: 3, weight: '10kg', reps: '10회', completed: false},
    ],
  };

  const [sets, setSets] = useState<Set[]>(exerciseData.sets);

  const handleSetComplete = (setId: number) => {
    setSets(
      sets.map(set =>
        set.id === setId ? {...set, completed: !set.completed} : set,
      ),
    );
  };

  const handleRestTimer = () => {
    Alert.alert('휴식 타이머', '휴식 타이머 기능 (추후 구현)');
  };

  const handleSetCompleteAll = () => {
    Alert.alert('세트 완료', '세트 완료 기능 (추후 구현)');
  };

  return (
    <SafeAreaView style={styles.container}>
      {/* 헤더 */}
      <View style={styles.header}>
        <TouchableOpacity onPress={() => navigation.goBack()}>
          <Icon name="chevron-back" size={28} color={colors.text} />
        </TouchableOpacity>
        <Text style={styles.pageTitle}>{exerciseData.day} 추천 운동</Text>
        <View style={{width: 28}} />
      </View>

      <ScrollView style={styles.content}>
        {/* 운동 이름 */}
        <View style={styles.exerciseNameSection}>
          <Text style={styles.exerciseName}>{exerciseData.name}</Text>
        </View>

        {/* 운동 이미지 플레이스홀더 */}
        <View style={styles.exerciseImageContainer}>
          <View style={styles.exerciseImagePlaceholder}>
            <Icon name="barbell-outline" size={60} color={colors.textLight} />
          </View>
        </View>

        {/* 세트 목록 */}
        <View style={styles.setsContainer}>
          {sets.map(set => (
            <TouchableOpacity
              key={set.id}
              style={[
                styles.setItem,
                set.completed && styles.setItemCompleted,
              ]}
              onPress={() => handleSetComplete(set.id)}>
              <Text style={styles.setNumber}>{set.id} Set</Text>
              <Text style={styles.setWeight}>{set.weight}</Text>
              <Text style={styles.setReps}>{set.reps}</Text>
              {set.completed && (
                <Icon name="checkmark-circle" size={24} color={colors.success} />
              )}
            </TouchableOpacity>
          ))}
        </View>

        {/* 액션 버튼 */}
        <View style={styles.actionButtons}>
          <TouchableOpacity
            style={styles.restTimerBtn}
            onPress={handleRestTimer}>
            <Icon name="timer-outline" size={20} color={colors.white} />
            <Text style={styles.restTimerBtnText}>휴식 타이머</Text>
          </TouchableOpacity>
          <TouchableOpacity
            style={styles.setCompleteBtn}
            onPress={handleSetCompleteAll}>
            <Icon name="checkmark-done" size={20} color={colors.white} />
            <Text style={styles.setCompleteBtnText}>세트 완료</Text>
          </TouchableOpacity>
        </View>
      </ScrollView>
    </SafeAreaView>
  );
};

const styles = StyleSheet.create({
  container: {
    flex: 1,
    backgroundColor: colors.background,
  },
  header: {
    flexDirection: 'row',
    justifyContent: 'space-between',
    alignItems: 'center',
    backgroundColor: colors.cardBackground,
    paddingVertical: 12,
    paddingHorizontal: 16,
    borderBottomWidth: 1,
    borderBottomColor: colors.border,
  },
  pageTitle: {
    fontSize: 18,
    fontWeight: '600',
    color: colors.text,
  },
  content: {
    flex: 1,
  },
  exerciseNameSection: {
    backgroundColor: colors.cardBackground,
    padding: 20,
    marginBottom: 12,
  },
  exerciseName: {
    fontSize: 24,
    fontWeight: 'bold',
    color: colors.text,
  },
  exerciseImageContainer: {
    backgroundColor: colors.cardBackground,
    padding: 20,
    marginBottom: 12,
  },
  exerciseImagePlaceholder: {
    height: 200,
    backgroundColor: colors.grayLight,
    borderRadius: 20,
    justifyContent: 'center',
    alignItems: 'center',
  },
  setsContainer: {
    backgroundColor: colors.cardBackground,
    padding: 16,
    marginBottom: 12,
  },
  setItem: {
    flexDirection: 'row',
    alignItems: 'center',
    padding: 16,
    backgroundColor: colors.background,
    borderRadius: 8,
    marginBottom: 8,
  },
  setItemCompleted: {
    backgroundColor: colors.success + '20',
  },
  setNumber: {
    flex: 1,
    fontSize: 16,
    fontWeight: '600',
    color: colors.text,
  },
  setWeight: {
    flex: 1,
    fontSize: 16,
    color: colors.text,
    textAlign: 'center',
  },
  setReps: {
    flex: 1,
    fontSize: 16,
    color: colors.text,
    textAlign: 'center',
  },
  actionButtons: {
    flexDirection: 'row',
    gap: 12,
    padding: 16,
  },
  restTimerBtn: {
    flex: 1,
    flexDirection: 'row',
    backgroundColor: colors.secondary,
    paddingVertical: 16,
    borderRadius: 8,
    alignItems: 'center',
    justifyContent: 'center',
    gap: 8,
  },
  restTimerBtnText: {
    color: colors.white,
    fontSize: 16,
    fontWeight: '600',
  },
  setCompleteBtn: {
    flex: 1,
    flexDirection: 'row',
    backgroundColor: colors.primary,
    paddingVertical: 16,
    borderRadius: 8,
    alignItems: 'center',
    justifyContent: 'center',
    gap: 8,
  },
  setCompleteBtnText: {
    color: colors.white,
    fontSize: 16,
    fontWeight: '600',
  },
});

export default ExerciseDetailScreen;

