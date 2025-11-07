import React, {useState, useEffect, useCallback, useMemo} from 'react';
import {
  View,
  Text,
  StyleSheet,
  ScrollView,
  TouchableOpacity,
  ActivityIndicator,
} from 'react-native';
import {SafeAreaView} from 'react-native-safe-area-context';
import { Ionicons as Icon } from '@expo/vector-icons';
import {colors} from '../../theme/colors';
import InBodyPhotoModal from '../../components/modals/InBodyPhotoModal';
import {fetchUserWorkouts, WorkoutSession} from '../../utils/exerciseApi';
import {useFocusEffect} from '@react-navigation/native';
import AsyncStorage from '@react-native-async-storage/async-storage';

const AnalysisScreen = ({navigation}: any) => {
  const [isPhotoModalOpen, setIsPhotoModalOpen] = useState(false);
  const [workoutHistory, setWorkoutHistory] = useState<WorkoutSession[]>([]);
  const [loading, setLoading] = useState(true);

  // 1RM 계산 함수 (Epley 공식)
  const calculate1RM = (weight: number, reps: number): number => {
    if (reps === 1) return weight;
    return Math.round(weight * (1 + reps / 30) * 10) / 10;
  };

  // 운동별 최근 8개 기록을 그룹화하고 이전 기록과 비교
  const exercises = useMemo(() => {
    if (workoutHistory.length === 0) return [];

    // 운동 이름별로 그룹화
    const groupedByExercise = workoutHistory.reduce((acc, session) => {
      const name = session.exerciseName;
      if (!acc[name]) {
        acc[name] = [];
      }
      acc[name].push(session);
      return acc;
    }, {} as Record<string, WorkoutSession[]>);

    // 각 운동별로 최근 8개만 유지하고 날짜순 정렬
    const recentExercises: any[] = [];
    
    Object.entries(groupedByExercise).forEach(([name, sessions]) => {
      // 날짜순 정렬 (최신순)
      const sorted = sessions.sort((a, b) => 
        new Date(b.workoutDate).getTime() - new Date(a.workoutDate).getTime()
      );
      
      // 최근 8개만
      const recent = sorted.slice(0, 8);
      
      if (recent.length > 0) {
        // 가장 최근 세션
        const latest = recent[0];
        
        // 최대 중량 계산 (가장 무거운 세트)
        const maxWeight = Math.max(...latest.sets.map(s => s.weight));
        const maxWeightSet = latest.sets.find(s => s.weight === maxWeight);
        
        // 1RM 계산
        const oneRM = maxWeightSet 
          ? calculate1RM(maxWeightSet.weight, maxWeightSet.reps)
          : 0;
        
        // 이전 기록과 비교 (2번째 최근 기록) - 중량 변화만 추적
        let change = 0;
        let changeType: 'positive' | 'negative' | 'neutral' = 'neutral';
        
        if (recent.length > 1) {
          const previous = recent[1];
          const prevMaxWeight = Math.max(...previous.sets.map(s => s.weight));
          const weightChange = maxWeight - prevMaxWeight;
          
          // 중량 변화만 표시
          change = weightChange;
          
          if (weightChange !== 0) {
            if (change > 0) {
              changeType = 'positive';
            } else if (change < 0) {
              changeType = 'negative';
            }
          }
        }
        
        recentExercises.push({
          id: latest.sessionId,
          name,
          change: Math.abs(change),
          changeType,
          rm: oneRM,
          recordCount: recent.length,
        });
      }
    });
    
    // 최근 운동순으로 정렬 (가장 최근에 한 운동이 위로)
    return recentExercises
      .sort((a, b) => {
        const aLatest = groupedByExercise[a.name][0];
        const bLatest = groupedByExercise[b.name][0];
        return new Date(bLatest.workoutDate).getTime() - new Date(aLatest.workoutDate).getTime();
      })
      .slice(0, 8); // 최대 8개
  }, [workoutHistory]);

  // 운동 기록 조회
  const loadWorkoutHistory = useCallback(async () => {
    try {
      setLoading(true);
      // userId 가져오기 (로그인 정보에서)
      const userIdStr = await AsyncStorage.getItem('userId');
      if (!userIdStr) {
        console.warn('[ANALYSIS] userId가 없습니다.');
        setWorkoutHistory([]);
        return;
      }
      
      const workouts = await fetchUserWorkouts(userIdStr);
      setWorkoutHistory(workouts);
      console.log('[ANALYSIS] 운동 기록', { count: workouts.length });
    } catch (error) {
      console.error('[ANALYSIS] 운동 기록 조회 실패:', error);
      setWorkoutHistory([]);
    } finally {
      setLoading(false);
    }
  }, []);

  // 화면 포커스 시 운동 기록 새로고침
  useFocusEffect(
    useCallback(() => {
      loadWorkoutHistory();
    }, [loadWorkoutHistory])
  );

  const nutrients = [
    {name: '탄수화물', current: 95, goal: 120, color: '#fc9658'},
    {name: '단백질', current: 95, goal: 120, color: '#4fc6f1'},
    {name: '지방', current: 95, goal: 120, color: '#87e26e'},
    {name: '나트륨', current: 95, goal: 120, color: '#eab308'},
  ];

  const handleInBodyClick = () => {
    navigation.navigate('InBody');
  };

  const handlePhotoClick = () => {
    setIsPhotoModalOpen(true);
  };

  const handleManualClick = () => {
    navigation.navigate('InBodyManual');
  };

  const handlePhotoSave = (data: any) => {
    console.log('인바디 사진 저장:', data);
  };


  return (
    <SafeAreaView style={styles.container} edges={['top']}>
      <View style={styles.header}>
        <Text style={styles.headerTitle}>분석하기</Text>
      </View>
      <ScrollView 
        style={styles.content}
        contentContainerStyle={styles.contentContainer}>
        {/* 인사말 섹션 */}
        <View style={styles.greetingSection}>
          <Text style={styles.greetingName}>유정님,</Text>
          <Text style={styles.greetingMessage}>
            지난주보다 체지방률이 1.2% 감소했어요!{'\n'}계속 이렇게만 가요 ✨
          </Text>
        </View>

        {/* 인바디 기록/분석 섹션 */}
        <View style={styles.inbodySection}>
          <View style={styles.sectionHeader}>
            <Text style={styles.sectionTitle}>인바디 기록/분석</Text>
            <Text style={styles.sectionSubtitle}>최근 측정일 2025.10.05</Text>
          </View>
          <View style={styles.inputButtons}>
            <TouchableOpacity
              style={[styles.inputBtn, styles.photoBtn]}
              onPress={handlePhotoClick}>
              <Icon name="camera-outline" size={16} color="#ffffff" />
              <Text style={styles.inputBtnText}>사진으로 입력</Text>
            </TouchableOpacity>
            <TouchableOpacity
              style={[styles.inputBtn, styles.manualBtn]}
              onPress={handleManualClick}>
              <Icon name="pencil-outline" size={16} color="#ffffff" />
              <Text style={styles.inputBtnText}>수기로 입력</Text>
            </TouchableOpacity>
          </View>
          <TouchableOpacity
            style={styles.analysisBtn}
            onPress={handleInBodyClick}>
            <Icon name="bar-chart-outline" size={18} color="#000000" />
            <Text style={styles.analysisBtnText}>정보/분석</Text>
          </TouchableOpacity>
        </View>

        {/* 운동 분석 섹션 */}
        <View style={styles.exerciseSection}>
          <Text style={styles.sectionTitle}>운동 분석</Text>
          <Text style={styles.exerciseSummary}>
            "최근 운동 종목의 중량 변화와 1RM을 알아보세요."
          </Text>
          {loading ? (
            <View style={styles.loadingContainer}>
              <ActivityIndicator size="small" color="#d6ff4b" />
              <Text style={styles.loadingText}>운동 기록 불러오는 중...</Text>
            </View>
          ) : exercises.length === 0 ? (
            <View style={styles.emptyContainer}>
              <Text style={styles.emptyText}>운동 기록이 없습니다.</Text>
              <Text style={styles.emptySubText}>운동을 기록하고 분석을 확인하세요.</Text>
            </View>
          ) : (
            <ScrollView style={styles.exerciseList} showsVerticalScrollIndicator={false}>
              {exercises.map((exercise, index) => (
                <View key={exercise.id} style={[styles.exerciseItem, index === exercises.length - 1 && styles.exerciseItemLast]}>
                  <View style={styles.exerciseIcon}>
                    <Text style={styles.exerciseIconText}>🏋️</Text>
                  </View>
                  <View style={styles.exerciseInfo}>
                    <Text style={styles.exerciseName}>{exercise.name}</Text>
                    <View style={styles.exerciseChangeContainer}>
                      {exercise.changeType === 'positive' && (
                        <>
                          <Icon name="arrow-up" size={10} color="#4ade80" />
                          <Text style={[styles.exerciseChange, styles.positive]}>
                            {' '}
                            +{exercise.change}kg
                          </Text>
                        </>
                      )}
                      {exercise.changeType === 'negative' && (
                        <>
                          <Icon name="arrow-down" size={10} color="#ef4444" />
                          <Text style={[styles.exerciseChange, styles.negative]}>
                            {' '}
                            -{exercise.change}kg
                          </Text>
                        </>
                      )}
                      {exercise.changeType === 'neutral' && (
                        <>
                          <Icon name="remove" size={10} color="#aaa" />
                          <Text style={[styles.exerciseChange, styles.neutral]}>
                            {' '}
                            변화없음
                          </Text>
                        </>
                      )}
                    </View>
                  </View>
                  <Text style={styles.exercise1rm}>1RM {exercise.rm}kg</Text>
                </View>
              ))}
            </ScrollView>
          )}
        </View>

        {/* 식단 분석 섹션 */}
        <View style={styles.dietSection}>
          <Text style={styles.sectionTitle}>식단 분석</Text>
          <Text style={styles.dietSummary}>
            "단백질을 더 섭취하세요(약 100g 부족){'\n'}저번주보다 지방을 약 1.5배
            섭취중이에요 😥"
          </Text>

          <View style={styles.calorieSection}>
            <View style={styles.calorieChart}>
              <View style={styles.donutChart}>
                <View style={styles.chartInnerCircle}>
                  <View style={styles.chartCenter}>
                    <Text style={styles.chartValue}>1850</Text>
                    <Text style={styles.chartGoal}>목표 2000kcal</Text>
                  </View>
                </View>
              </View>
              <View style={styles.nutrientLegend}>
              <View style={styles.legendItem}>
                <View style={[styles.legendBox, styles.legendBoxProtein]}>
                  <Text style={styles.legendBoxText}>50%</Text>
                </View>
                <Text style={styles.legendLetter}>P</Text>
              </View>
              <View style={styles.legendItem}>
                <View style={[styles.legendBox, styles.legendBoxCarbs]}>
                  <Text style={styles.legendBoxText}>40%</Text>
                </View>
                <Text style={styles.legendLetter}>C</Text>
              </View>
              <View style={styles.legendItem}>
                <View style={[styles.legendBox, styles.legendBoxFat]}>
                  <Text style={styles.legendBoxText}>10%</Text>
                </View>
                <Text style={styles.legendLetter}>F</Text>
              </View>
            </View>
            </View>
          </View>

          <View style={styles.nutrientAnalysis}>
            <Text style={styles.nutrientAnalysisTitle}>세부 영양소 분석</Text>
            {nutrients.map((nutrient, index) => {
              const getProgressColor = () => {
                if (nutrient.name === '탄수화물') return '#fc9658';
                if (nutrient.name === '단백질') return '#4fc6f1';
                if (nutrient.name === '지방') return '#87e26e';
                if (nutrient.name === '나트륨') return '#eab308';
                return nutrient.color;
              };
              return (
                <View key={index} style={styles.nutrientItem}>
                  <Text style={styles.nutrientName}>{nutrient.name}</Text>
                  <View style={styles.nutrientBar}>
                    <View
                      style={[
                        styles.nutrientProgress,
                        {
                          width: `${(nutrient.current / nutrient.goal) * 100}%`,
                          backgroundColor: getProgressColor(),
                        },
                      ]}
                    />
                  </View>
                  <Text style={styles.nutrientValue}>
                    {nutrient.current}g / {nutrient.goal}g
                  </Text>
                </View>
              );
            })}
          </View>
        </View>
      </ScrollView>

      <InBodyPhotoModal
        isOpen={isPhotoModalOpen}
        onClose={() => setIsPhotoModalOpen(false)}
        onSave={handlePhotoSave}
      />
    </SafeAreaView>
  );
};

const styles = StyleSheet.create({
  container: {
    flex: 1,
    backgroundColor: '#1c1c1c',
  },
  header: {
    height: 50,
    justifyContent: 'center',
    alignItems: 'center',
    paddingHorizontal: 20,
    paddingTop: 16,
    paddingBottom: 16,
    position: 'relative',
  },
  headerTitle: {
    fontSize: 18,
    fontWeight: '600',
    color: '#ffffff',
  },
  content: {
    flex: 1,
  },
  contentContainer: {
    maxWidth: 400,
    alignSelf: 'center',
    width: '100%',
    paddingHorizontal: 20,
    paddingBottom: 100,
  },
  greetingSection: {
    marginBottom: 24,
    marginTop: 6,
  },
  greetingName: {
    fontSize: 19.2,
    fontWeight: '400',
    color: '#ccff00',
    marginBottom: 8,
  },
  greetingMessage: {
    fontSize: 14.4,
    color: '#ffffff',
    lineHeight: 20.16,
  },
  inbodySection: {
    backgroundColor: '#2a2a2a',
    borderRadius: 12,
    paddingVertical: 20,
    paddingHorizontal: 20,
    marginBottom: 15,
  },
  sectionHeader: {
    marginBottom: 16,
    paddingTop: 2,
  },
  sectionTitle: {
    fontSize: 17.6,
    fontWeight: '400',
    color: '#ffffff',
    marginBottom: 1,
  },
  sectionSubtitle: {
    fontSize: 12.8,
    color: '#aaaaaa',
    marginBottom: 16,
  },
  inputButtons: {
    flexDirection: 'row',
    gap: 8,
    marginBottom: 12,
  },
  inputBtn: {
    flex: 1,
    flexDirection: 'row',
    alignItems: 'center',
    justifyContent: 'center',
    paddingVertical: 10,
    paddingHorizontal: 12,
    borderRadius: 8,
    gap: 6,
  },
  photoBtn: {
    backgroundColor: '#333333',
  },
  manualBtn: {
    backgroundColor: '#333333',
  },
  inputBtnText: {
    fontSize: 12.8,
    fontWeight: '400',
    color: '#ffffff',
  },
  analysisBtn: {
    flexDirection: 'row',
    alignItems: 'center',
    justifyContent: 'center',
    paddingVertical: 12,
    borderRadius: 8,
    backgroundColor: '#4ade80',
    gap: 8,
    marginBottom: 15,
  },
  analysisBtnText: {
    fontSize: 14.4,
    fontWeight: '600',
    color: '#000000',
  },
  exerciseSection: {
    backgroundColor: '#2a2a2a',
    borderRadius: 12,
    paddingVertical: 20,
    paddingHorizontal: 20,
    marginBottom: 15,
  },
  exerciseSummary: {
    fontSize: 12.8,
    color: '#aaaaaa',
    lineHeight: 17.92,
    marginBottom: 16,
  },
  highlightText: {
    color: '#ccff00',
    fontWeight: '400',
  },
  exerciseList: {
    maxHeight: 216,
  },
  loadingContainer: {
    paddingVertical: 40,
    alignItems: 'center',
    justifyContent: 'center',
  },
  loadingText: {
    marginTop: 10,
    fontSize: 13,
    color: '#aaaaaa',
  },
  emptyContainer: {
    paddingVertical: 40,
    alignItems: 'center',
    justifyContent: 'center',
  },
  emptyText: {
    fontSize: 14,
    color: '#ffffff',
    fontWeight: '500',
    marginBottom: 8,
  },
  emptySubText: {
    fontSize: 13,
    color: '#aaaaaa',
  },
  exerciseItem: {
    flexDirection: 'row',
    alignItems: 'center',
    paddingVertical: 12,
    paddingHorizontal: 0,
    borderBottomWidth: 1,
    borderBottomColor: '#444444',
    minHeight: 48,
    gap: 12,
  },
  exerciseItemLast: {
    borderBottomWidth: 0,
  },
  exerciseIcon: {
    width: 32,
    height: 32,
    borderRadius: 6,
    backgroundColor: '#444444',
    justifyContent: 'center',
    alignItems: 'center',
  },
  exerciseIconText: {
    fontSize: 14.4,
  },
  exerciseInfo: {
    flex: 1,
    flexDirection: 'row',
    alignItems: 'center',
    gap: 8,
  },
  exerciseName: {
    fontSize: 14.4,
    fontWeight: '500',
    color: '#ffffff',
  },
  exerciseChangeContainer: {
    flexDirection: 'row',
    alignItems: 'center',
    gap: 2,
  },
  exerciseChange: {
    fontSize: 11.2,
    fontWeight: '400',
  },
  positive: {
    color: '#4ade80',
  },
  negative: {
    color: '#ef4444',
  },
  neutral: {
    color: '#aaaaaa',
  },
  exercise1rm: {
    fontSize: 12.8,
    fontWeight: '500',
    color: '#ccff00',
    textAlign: 'right',
    minWidth: 80,
  },
  dietSection: {
    backgroundColor: '#2a2a2a',
    borderRadius: 12,
    paddingVertical: 20,
    paddingHorizontal: 20,
    marginBottom: 20,
  },
  dietSummary: {
    fontSize: 12.8,
    color: '#aaaaaa',
    lineHeight: 17.92,
    marginBottom: 16,
  },
  calorieSection: {
    marginBottom: 20,
  },
  calorieChart: {
    flexDirection: 'row',
    alignItems: 'center',
    gap: 20,
  },
  donutChart: {
    width: 120,
    height: 120,
    borderRadius: 60,
    backgroundColor: '#fc9658',
    justifyContent: 'center',
    alignItems: 'center',
    position: 'relative',
  },
  chartInnerCircle: {
    width: 80,
    height: 80,
    borderRadius: 40,
    backgroundColor: '#2a2a2a',
    justifyContent: 'center',
    alignItems: 'center',
    position: 'absolute',
  },
  chartCenter: {
    position: 'relative',
    zIndex: 1,
    alignItems: 'center',
  },
  chartValue: {
    fontSize: 19.2,
    fontWeight: 'bold',
    color: '#ffffff',
    marginBottom: 2,
  },
  chartGoal: {
    fontSize: 9.6,
    color: '#aaaaaa',
  },
  nutrientLegend: {
    flexDirection: 'row',
    gap: 12,
    alignItems: 'center',
    marginLeft: 8,
  },
  legendItem: {
    flexDirection: 'column',
    alignItems: 'center',
    gap: 4,
  },
  legendBox: {
    width: 25,
    height: 29,
    borderRadius: 4,
    justifyContent: 'center',
    alignItems: 'center',
  },
  legendBoxProtein: {
    backgroundColor: '#fc9658',
  },
  legendBoxCarbs: {
    backgroundColor: '#4fc6f1',
  },
  legendBoxFat: {
    backgroundColor: '#87e26e',
  },
  legendBoxText: {
    fontSize: 8,
    fontWeight: '400',
    color: '#ffffff',
  },
  legendLetter: {
    fontSize: 12.8,
    color: '#aaaaaa',
    fontWeight: '400',
  },
  nutrientAnalysis: {
    marginTop: 0,
  },
  nutrientAnalysisTitle: {
    fontSize: 14.4,
    fontWeight: '400',
    color: '#ffffff',
    marginBottom: 12,
  },
  nutrientItem: {
    flexDirection: 'row',
    alignItems: 'center',
    gap: 12,
    marginBottom: 12,
  },
  nutrientName: {
    fontSize: 12.8,
    fontWeight: '400',
    color: '#ffffff',
    minWidth: 60,
  },
  nutrientBar: {
    flex: 1,
    height: 8,
    backgroundColor: '#333333',
    borderRadius: 4,
    overflow: 'hidden',
  },
  nutrientProgress: {
    height: '100%',
    borderRadius: 4,
  },
  nutrientValue: {
    fontSize: 11.2,
    color: '#aaaaaa',
    minWidth: 80,
    textAlign: 'right',
  },
});

export default AnalysisScreen;

