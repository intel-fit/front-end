import React, {useState} from 'react';
import {
  View,
  Text,
  StyleSheet,
  SafeAreaView,
  ScrollView,
  TouchableOpacity,
  Alert,
} from 'react-native';
import { Ionicons as Icon } from '@expo/vector-icons';
import {colors} from '../../theme/colors';
import AsyncStorage from '@react-native-async-storage/async-storage';
import ExerciseModal from '../../components/modals/ExerciseModal';

interface WorkoutGoals {
  frequency: number;
  duration: string;
  type: string;
  calories: number;
}

interface Activity {
  id: number;
  name: string;
  details: string;
  time: string;
  isCompleted: boolean;
}

const ExerciseScreen = ({navigation}: any) => {
  const [currentMonth, setCurrentMonth] = useState('10월');
  const [activities, setActivities] = useState<Activity[]>([]);
  const [goalData, setGoalData] = useState<WorkoutGoals>({
    frequency: 3,
    duration: '30분 이상',
    type: '유산소',
    calories: 1500,
  });
  const [completedThisWeek, setCompletedThisWeek] = useState(0);
  const [isModalOpen, setIsModalOpen] = useState(false);
  const [modalMode, setModalMode] = useState<'add' | 'edit'>('add');
  const [selectedExercise, setSelectedExercise] = useState<Activity | null>(null);

  React.useEffect(() => {
    loadGoalData();
  }, []);

  const loadGoalData = async () => {
    try {
      const saved = await AsyncStorage.getItem('workoutGoals');
      if (saved) {
        setGoalData(JSON.parse(saved));
      }
      const completed = await AsyncStorage.getItem('workoutCompletedThisWeek');
      if (completed) {
        setCompletedThisWeek(parseInt(completed, 10));
      }
    } catch (error) {
      console.log('Failed to load goal data', error);
    }
  };

  const getProgressPercentage = () => {
    const target = Math.max(1, goalData.frequency || 1);
    return Math.min(100, Math.max(0, Math.round((completedThisWeek / target) * 100)));
  };

  const handleAddWorkout = () => {
    setModalMode('add');
    setSelectedExercise(null);
    setIsModalOpen(true);
  };

  const handleExerciseClick = (exercise: Activity) => {
    setModalMode('edit');
    setSelectedExercise(exercise);
    setIsModalOpen(true);
  };

  const handleModalClose = () => {
    setIsModalOpen(false);
    setSelectedExercise(null);
  };

  const handleExerciseSave = (sets: any[], exerciseName: string) => {
    const allSetsCompleted = sets.every((set: any) => set.completed);
    const details = `${sets[0]?.weight || 20}kg ${sets[0]?.reps || 12}회 ${sets.length}세트`;

    if (modalMode === 'edit' && selectedExercise) {
      setActivities(
        activities.map((activity) => {
          if (activity.id === selectedExercise.id) {
            return {
              ...activity,
              name: exerciseName,
              details,
              isCompleted: allSetsCompleted,
            };
          }
          return activity;
        }),
      );
    } else {
      const newWorkout: Activity = {
        id: Date.now(),
        name: exerciseName,
        details,
        time: new Date().toLocaleTimeString('ko-KR', {
          hour: '2-digit',
          minute: '2-digit',
          hour12: true,
        }),
        isCompleted: allSetsCompleted,
      };
      setActivities([...activities, newWorkout]);
    }
    handleModalClose();
  };

  const handleDeleteWorkout = (workoutId: number) => {
    Alert.alert('운동 삭제', '이 운동을 삭제하시겠습니까?', [
      {text: '취소', style: 'cancel'},
      {
        text: '삭제',
        style: 'destructive',
        onPress: () => {
          setActivities(activities.filter(activity => activity.id !== workoutId));
        },
      },
    ]);
  };


  // StatsScreen 내부에서 사용될 때는 SafeAreaView 제거
  const ContainerComponent = View;
  
  return (
    <ContainerComponent style={styles.container}>
      <ScrollView style={styles.content}>
        {/* 월 네비게이션 */}
        <View style={styles.monthNavigation}>
          <View style={styles.monthNavLeft}>
            <TouchableOpacity style={styles.navBtn}>
              <Icon name="chevron-back" size={18} color={colors.text} />
            </TouchableOpacity>
            <Text style={styles.monthText}>{currentMonth}</Text>
            <TouchableOpacity style={styles.navBtn}>
              <Icon name="chevron-forward" size={18} color={colors.text} />
            </TouchableOpacity>
          </View>
          <TouchableOpacity style={styles.menuBtn}>
            <Icon name="menu" size={20} color={colors.text} />
          </TouchableOpacity>
        </View>
        {/* 7일 캘린더 위젯 */}
        <View style={styles.weekCalendar}>
          <View style={styles.calendarGrid}>
            {[11, 12, 13, 14, 15, 16, 17].map((day, index) => (
              <View key={day} style={styles.calendarItem}>
                <View
                  style={[
                    styles.calendarNumber,
                    index === 4 && styles.calendarNumberToday,
                  ]}>
                  <Text
                    style={[
                      styles.calendarNumberText,
                      index === 4 && styles.calendarNumberTodayText,
                    ]}>
                    {day}
                  </Text>
                </View>
                <Text style={styles.calendarCalories}>388k</Text>
                <Text style={styles.calendarPercentage}>97%</Text>
              </View>
            ))}
          </View>
        </View>

        {/* 목표 카드 */}
        <TouchableOpacity
          style={styles.goalCard}
          onPress={() => navigation.navigate('Goal')}>
          <View style={styles.goalContent}>
            <Text style={styles.goalTitle}>운동 목표 설정</Text>
            <Text style={styles.goalDescription}>
              주 {goalData.frequency}회, {goalData.duration}, {goalData.type},{' '}
              {goalData.calories}kcal
            </Text>
            <View style={styles.progressContainer}>
              <View style={styles.progressBar}>
                <View
                  style={[
                    styles.progressFill,
                    {width: `${getProgressPercentage()}%`},
                  ]}
                />
              </View>
              <Text style={styles.progressText}>{getProgressPercentage()}%</Text>
            </View>
          </View>
          <Icon name="chevron-forward" size={18} color={colors.text} />
        </TouchableOpacity>

        {/* 운동 기록 섹션 */}
        <View style={styles.logSection}>
          <Text style={styles.sectionTitle}>운동 기록하기</Text>
          <View style={styles.logTimeline}>
            {activities.map((activity, index) => (
              <View key={activity.id} style={styles.logItem}>
                <TouchableOpacity
                  style={styles.logCard}
                  onPress={() => handleExerciseClick(activity)}
                  onLongPress={() => handleDeleteWorkout(activity.id)}>
                  <View style={styles.logCardContent}>
                    <Text style={styles.logName}>{activity.name}</Text>
                    <Text style={styles.logDetails}>{activity.details}</Text>
                  </View>
                  <Text style={styles.logTime}>{activity.time}</Text>
                </TouchableOpacity>
              </View>
            ))}
            <View style={styles.addItem}>
              <TouchableOpacity style={styles.addBtn} onPress={handleAddWorkout}>
                <Text style={styles.addBtnText}>운동 추가하기</Text>
              </TouchableOpacity>
            </View>
          </View>
        </View>
      </ScrollView>

      <ExerciseModal
        isOpen={isModalOpen}
        onClose={handleModalClose}
        mode={modalMode}
        exerciseData={selectedExercise}
        onSave={handleExerciseSave}
      />
    </ContainerComponent>
  );
};

const styles = StyleSheet.create({
  container: {
    flex: 1,
    backgroundColor: colors.background,
  },
  monthNavigation: {
    flexDirection: 'row',
    justifyContent: 'space-between',
    alignItems: 'center',
    marginBottom: 0,
    paddingBottom: 12,
    paddingTop: 8,
  },
  monthNavLeft: {
    flexDirection: 'row',
    alignItems: 'center',
    gap: 2,
  },
  navBtn: {
    backgroundColor: 'transparent',
    padding: 0,
  },
  monthText: {
    fontSize: 18,
    fontWeight: '800',
    color: colors.text,
    lineHeight: 22,
  },
  menuBtn: {
    backgroundColor: 'transparent',
    padding: 0,
    marginRight: 0,
  },
  content: {
    flex: 1,
    padding: 20,
  },
  weekCalendar: {
    marginTop: 4,
    marginBottom: 20,
  },
  calendarGrid: {
    flexDirection: 'row',
    justifyContent: 'space-between',
    gap: 0,
    height: 79,
  },
  calendarItem: {
    flex: 1,
    alignItems: 'center',
    justifyContent: 'flex-start',
    gap: 6,
    minHeight: 79,
  },
  calendarNumber: {
    minHeight: 30,
    minWidth: 30,
    justifyContent: 'center',
    alignItems: 'center',
    marginBottom: 4,
  },
  calendarNumberToday: {
    width: 30,
    height: 30,
    borderRadius: 15,
  },
  calendarNumberText: {
    fontSize: 16,
    fontWeight: '700',
    color: '#e3ff7c',
    lineHeight: 19,
    textAlign: 'center',
  },
  calendarNumberTodayText: {
    color: '#e3ff7c',
    fontSize: 16,
    fontWeight: '700',
    lineHeight: 19,
  },
  calendarCalories: {
    fontSize: 12,
    fontWeight: '700',
    color: colors.text,
    textAlign: 'center',
    height: 15,
    lineHeight: 14.52,
  },
  calendarPercentage: {
    fontSize: 12,
    fontWeight: '700',
    color: colors.text,
    textAlign: 'center',
    height: 15,
    lineHeight: 14.52,
  },
  goalCard: {
    backgroundColor: '#3a3a3a',
    borderRadius: 20,
    paddingVertical: 16,
    paddingHorizontal: 20,
    flexDirection: 'row',
    alignItems: 'center',
    marginHorizontal: 20,
    marginTop: 10,
    marginBottom: 16,
  },
  goalContent: {
    flex: 1,
  },
  goalTitle: {
    fontSize: 16,
    fontWeight: '600',
    color: '#ffffff',
    marginBottom: 8,
  },
  goalDescription: {
    fontSize: 12,
    color: '#ccc',
    lineHeight: 16.8, // line-height: 1.4 (12 * 1.4)
  },
  progressContainer: {
    flexDirection: 'row',
    alignItems: 'center',
    gap: 8,
    marginTop: 8,
    width: '100%',
  },
  progressBar: {
    flex: 1,
    height: 16,
    backgroundColor: '#cfcfcf',
    borderRadius: 999,
    overflow: 'hidden',
  },
  progressFill: {
    height: '100%',
    backgroundColor: '#d6ff4b',
    borderRadius: 999,
  },
  progressText: {
    fontSize: 12,
    fontWeight: '600',
    color: '#e3ff7c',
    minWidth: 30,
    textAlign: 'right',
  },
  logSection: {
    marginBottom: 16,
  },
  sectionTitle: {
    fontSize: 18,
    fontWeight: '600',
    color: colors.text,
    marginBottom: 16,
  },
  logTimeline: {
    paddingLeft: 8,
  },
  logItem: {
    flexDirection: 'row',
    marginBottom: 16,
  },
  timelineLine: {
    alignItems: 'center',
    marginRight: 12,
  },
  timelineDot: {
    width: 12,
    height: 12,
    borderRadius: 6,
    backgroundColor: colors.grayLight,
    marginTop: 8,
  },
  timelineDotCompleted: {
    backgroundColor: colors.primary,
  },
  timelineConnector: {
    width: 2,
    flex: 1,
    backgroundColor: colors.grayLight,
    marginVertical: 4,
  },
  logCard: {
    flex: 1,
    backgroundColor: colors.cardBackground,
    borderRadius: 12,
    padding: 16,
    flexDirection: 'row',
    justifyContent: 'space-between',
    alignItems: 'center',
  },
  logCardContent: {
    flex: 1,
  },
  logName: {
    fontSize: 16,
    fontWeight: '600',
    color: colors.text,
    marginBottom: 4,
  },
  logDetails: {
    fontSize: 14,
    color: colors.textLight,
  },
  logTime: {
    fontSize: 12,
    color: colors.textLight,
  },
  addItem: {
    flexDirection: 'row',
    alignItems: 'center',
  },
  timelineDotAdd: {
    width: 12,
    height: 12,
    borderRadius: 6,
    backgroundColor: colors.grayLight,
    marginRight: 12,
  },
  addBtn: {
    flex: 1,
    backgroundColor: colors.white,
    borderRadius: 12,
    padding: 16,
    alignItems: 'center',
    borderWidth: 2,
    borderColor: colors.white,
    borderStyle: 'dashed',
  },
  addBtnText: {
    fontSize: 16,
    fontWeight: '600',
    color: colors.black,
  },
});

export default ExerciseScreen;

