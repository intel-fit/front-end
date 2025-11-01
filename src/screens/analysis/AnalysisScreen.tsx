import React, {useState} from 'react';
import {
  View,
  Text,
  StyleSheet,
  ScrollView,
  TouchableOpacity,
} from 'react-native';
import {SafeAreaView} from 'react-native-safe-area-context';
import { Ionicons as Icon } from '@expo/vector-icons';
import {colors} from '../../theme/colors';
import InBodyPhotoModal from '../../components/modals/InBodyPhotoModal';

const AnalysisScreen = ({navigation}: any) => {
  const [isPhotoModalOpen, setIsPhotoModalOpen] = useState(false);
  const exercises = [
    {id: 1, name: '스쿼트', change: 5, changeType: 'positive', rm: 50},
    {id: 2, name: '데드리프트', change: 0, changeType: 'neutral', rm: 75},
    {id: 3, name: '벤치 프레스', change: -3, changeType: 'negative', rm: 60},
    {id: 4, name: '오버헤드 프레스', change: 2, changeType: 'positive', rm: 40},
  ];

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
            "<Text style={styles.highlightText}>등, 어깨, 하체</Text> 근력이
            강해졌어요. 최근 운동 종목의 1RM을 알아보세요."
          </Text>
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
                          {exercise.change}kg
                        </Text>
                      </>
                    )}
                    {exercise.changeType === 'negative' && (
                      <>
                        <Icon name="arrow-down" size={10} color="#ef4444" />
                        <Text style={[styles.exerciseChange, styles.negative]}>
                          {' '}
                          {Math.abs(exercise.change)}kg
                        </Text>
                      </>
                    )}
                    {exercise.changeType === 'neutral' && (
                      <>
                        <Icon name="remove" size={10} color="#aaa" />
                        <Text style={[styles.exerciseChange, styles.neutral]}>
                          {' '}
                          -kg
                        </Text>
                      </>
                    )}
                  </View>
                </View>
                <Text style={styles.exercise1rm}>1RM {exercise.rm}kg</Text>
              </View>
            ))}
          </ScrollView>
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

