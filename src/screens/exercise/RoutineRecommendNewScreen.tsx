import React, {useState, useEffect} from 'react';
import {
  View,
  Text,
  StyleSheet,
  ScrollView,
  TouchableOpacity,
  Alert,
  Modal,
} from 'react-native';
import {SafeAreaView} from 'react-native-safe-area-context';
import {Ionicons as Icon} from '@expo/vector-icons';
import AsyncStorage from '@react-native-async-storage/async-storage';

const RoutineRecommendNewScreen = ({navigation}: any) => {
  const [showRoutine, setShowRoutine] = useState(false);
  const [selectedDay, setSelectedDay] = useState(0);
  const [showWeakPanel, setShowWeakPanel] = useState(false);
  const [showLevelPanel, setShowLevelPanel] = useState(false);
  const [showTargetPanel, setShowTargetPanel] = useState(false);
  const [weakParts, setWeakParts] = useState<string[]>([]);
  const [level, setLevel] = useState('');
  const [targetParts, setTargetParts] = useState<string[]>([]);
  const [savedRoutines, setSavedRoutines] = useState<any[]>([]);

  const weekDays = ['1일차', '2일차', '3일차', '4일차', '5일차', '6일차', '7일차'];
  const bodyParts = ['목', '어깨', '팔꿈치', '손목', '허리', '무릎', '발목'];
  const targetAreas = ['가슴', '등', '배', '어깨', '팔', '하체'];
  const levels = ['초급', '중급', '고급'];

  const sampleRoutines = [
    [
      {name: '시작 스트레칭', detail: '6회차 스트레칭', icon: '🏃'},
      {name: '레그 프레스', detail: '4세트 X 20kg X 15회', icon: '🦵'},
      {name: '레그 컬', detail: '3세트 X 12kg X 15회', icon: '🦵'},
    ],
    [
      {name: '시작 스트레칭', detail: '6회차 스트레칭', icon: '🏃'},
      {name: '벤치 프레스', detail: '4세트 X 40kg X 12회', icon: '💪'},
      {name: '덤벨 플라이', detail: '3세트 X 15kg X 12회', icon: '💪'},
    ],
    [
      {name: '시작 스트레칭', detail: '6회차 스트레칭', icon: '🏃'},
      {name: '데드리프트', detail: '4세트 X 60kg X 10회', icon: '🏋️'},
      {name: '랫 풀다운', detail: '3세트 X 45kg X 12회', icon: '🏋️'},
    ],
    [
      {name: '시작 스트레칭', detail: '6회차 스트레칭', icon: '🏃'},
      {name: '숄더 프레스', detail: '4세트 X 20kg X 12회', icon: '💪'},
      {name: '사이드 레터럴 레이즈', detail: '3세트 X 10kg X 15회', icon: '💪'},
    ],
    [
      {name: '시작 스트레칭', detail: '6회차 스트레칭', icon: '🏃'},
      {name: '스쿼트', detail: '4세트 X 50kg X 12회', icon: '🦵'},
      {name: '레그 익스텐션', detail: '3세트 X 30kg X 15회', icon: '🦵'},
    ],
    [
      {name: '시작 스트레칭', detail: '6회차 스트레칭', icon: '🏃'},
      {name: '바벨 컬', detail: '4세트 X 20kg X 12회', icon: '💪'},
      {name: '트라이셉스 익스텐션', detail: '3세트 X 15kg X 12회', icon: '💪'},
    ],
    [
      {name: '시작 스트레칭', detail: '6회차 스트레칭', icon: '🏃'},
      {name: '크런치', detail: '4세트 X 20회', icon: '🔥'},
      {name: '플랭크', detail: '3세트 X 60초', icon: '🔥'},
    ],
  ];

  useEffect(() => {
    loadSavedRoutines();
  }, []);

  const loadSavedRoutines = async () => {
    try {
      const stored = await AsyncStorage.getItem('savedRoutines');
      if (stored) {
        setSavedRoutines(JSON.parse(stored));
      }
    } catch (error) {
      console.log('Failed to load routines', error);
    }
  };

  const handleWeakPartToggle = (part: string) => {
    if (weakParts.includes(part)) {
      setWeakParts(weakParts.filter(p => p !== part));
    } else {
      setWeakParts([...weakParts, part]);
    }
  };

  const handleTargetPartToggle = (part: string) => {
    if (targetParts.includes(part)) {
      setTargetParts(targetParts.filter(p => p !== part));
    } else {
      setTargetParts([...targetParts, part]);
    }
  };

  const handleGetRoutine = () => {
    setShowRoutine(true);
    setSelectedDay(0);
  };

  const handleSaveRoutine = async () => {
    const currentDate = new Date();
    const savedRoutine = {
      id: Date.now(),
      date: currentDate.toLocaleDateString('ko-KR'),
      routine: sampleRoutines,
      level: level,
      weakParts: [...weakParts],
      targetParts: [...targetParts],
    };

    try {
      const existingRoutines = JSON.parse(
        (await AsyncStorage.getItem('savedRoutines')) || '[]',
      );
      const updatedRoutines = [...existingRoutines, savedRoutine];
      await AsyncStorage.setItem('savedRoutines', JSON.stringify(updatedRoutines));
      setSavedRoutines(updatedRoutines);
      Alert.alert('저장 완료', '루틴이 저장되었습니다!', [
        {
          text: '확인',
          onPress: () => {
            navigation.navigate('RoutineRecommend');
          },
        },
      ]);
    } catch (error) {
      console.log('Failed to save routine', error);
      Alert.alert('오류', '루틴 저장에 실패했습니다.');
    }
  };

  const handleRecommendAgain = () => {
    setShowRoutine(false);
    setSelectedDay(0);
  };

  return (
    <SafeAreaView style={styles.container} edges={['top']}>
      <View style={styles.header}>
        <TouchableOpacity onPress={() => navigation.goBack()}>
          <Icon name="chevron-back" size={28} color="#ffffff" />
        </TouchableOpacity>
        <Text style={styles.headerTitle}>운동 루틴 추천</Text>
        <View style={{width: 28}} />
      </View>

      {!showRoutine ? (
        <ScrollView style={styles.content} contentContainerStyle={styles.contentContainer}>
          <View style={styles.mainContent}>
            <Text style={styles.title}>
              안녕하세요 - 회원님!{'\n'}최적화된 루틴을 추천해 드릴께요!
            </Text>

            <View style={styles.buttonGroup}>
              <TouchableOpacity style={styles.actionButton} onPress={handleGetRoutine}>
                <Text style={styles.actionButtonText}>추천 루틴 받기</Text>
              </TouchableOpacity>

              <View>
                <TouchableOpacity
                  style={styles.actionButton}
                  onPress={() => setShowWeakPanel(true)}>
                  <Text style={styles.actionButtonText}>취약한 부분</Text>
                </TouchableOpacity>
                {weakParts.length > 0 && (
                  <Text style={styles.selectedInfo}>{weakParts.join(', ')}</Text>
                )}
              </View>

              <View>
                <TouchableOpacity
                  style={styles.actionButton}
                  onPress={() => setShowLevelPanel(true)}>
                  <Text style={styles.actionButtonText}>운동 경력</Text>
                </TouchableOpacity>
                {level && <Text style={styles.selectedInfo}>{level}</Text>}
              </View>

              <View>
                <TouchableOpacity
                  style={styles.actionButton}
                  onPress={() => setShowTargetPanel(true)}>
                  <Text style={styles.actionButtonText}>보강하고 싶은 부위</Text>
                </TouchableOpacity>
                {targetParts.length > 0 && (
                  <Text style={styles.selectedInfo}>{targetParts.join(', ')}</Text>
                )}
              </View>
            </View>
          </View>

          {savedRoutines.length > 0 && (
            <View style={styles.savedRoutines}>
              <Text style={styles.savedRoutinesTitle}>저장된 루틴</Text>
              {savedRoutines.map(routine => (
                <TouchableOpacity
                  key={routine.id}
                  style={styles.savedRoutineItem}
                  onPress={() => navigation.navigate('RoutineRecommend')}>
                  <View style={styles.savedRoutineHeader}>
                    <Text style={styles.savedRoutineDate}>{routine.date}</Text>
                    {routine.level && (
                      <View style={styles.savedRoutineBadge}>
                        <Text style={styles.savedRoutineBadgeText}>{routine.level}</Text>
                      </View>
                    )}
                  </View>
                  {routine.targetParts && routine.targetParts.length > 0 && (
                    <Text style={styles.savedRoutineInfo}>
                      집중: {routine.targetParts.join(', ')}
                    </Text>
                  )}
                </TouchableOpacity>
              ))}
            </View>
          )}
        </ScrollView>
      ) : (
        <ScrollView style={styles.content} showsVerticalScrollIndicator={false}>
          <View style={styles.routineView}>
            <Text style={styles.routineTitle}>10월 2주차 루틴</Text>
            <Text style={styles.routineDate}>10/10 - 10/17</Text>

            <ScrollView
              horizontal
              showsHorizontalScrollIndicator={false}
              style={styles.dayTabsContainer}
              contentContainerStyle={styles.dayTabs}>
              {weekDays.map((day, index) => (
                <TouchableOpacity
                  key={index}
                  style={[
                    styles.dayTab,
                    selectedDay === index && styles.dayTabActive,
                  ]}
                  onPress={() => setSelectedDay(index)}
                  activeOpacity={0.8}>
                  <Text
                    style={[
                      styles.dayTabText,
                      selectedDay === index && styles.dayTabTextActive,
                    ]}>
                    {day}
                  </Text>
                </TouchableOpacity>
              ))}
            </ScrollView>

            <View style={styles.routineInfo}>
              <Text style={styles.routineInfoText}>총 3세트</Text>
              <Text style={styles.routineInfoText}>⏱ 20분</Text>
            </View>

            <View style={styles.exerciseList}>
              {sampleRoutines[selectedDay].map((exercise, index) => (
                <View key={index} style={styles.exerciseCard}>
                  <View style={styles.exerciseIcon}>
                    <Text style={styles.exerciseIconText}>{exercise.icon}</Text>
                  </View>
                  <View style={styles.exerciseInfo}>
                    <Text style={styles.exerciseName}>{exercise.name}</Text>
                    <Text style={styles.exerciseDetail}>{exercise.detail}</Text>
                  </View>
                </View>
              ))}
            </View>

            <View style={styles.routineButtons}>
              <TouchableOpacity style={styles.saveRoutineButton} onPress={handleSaveRoutine}>
                <Text style={styles.saveRoutineButtonText}>루틴 저장하기</Text>
              </TouchableOpacity>
              <TouchableOpacity
                style={styles.reRecommendButton}
                onPress={handleRecommendAgain}>
                <Text style={styles.reRecommendButtonText}>루틴 다시 추천받기</Text>
              </TouchableOpacity>
            </View>
          </View>
        </ScrollView>
      )}

      {/* 취약한 부분 패널 */}
      <Modal
        visible={showWeakPanel}
        transparent={true}
        animationType="slide"
        onRequestClose={() => setShowWeakPanel(false)}>
        <TouchableOpacity
          style={styles.panelOverlay}
          activeOpacity={1}
          onPress={() => setShowWeakPanel(false)}>
          <View style={styles.bottomPanel}>
            <View style={styles.panelHandle} />
            <View style={styles.panelHeader}>
              <Text style={styles.panelHeaderText}>취약한 부분 선택</Text>
            </View>
            <ScrollView style={styles.panelBody}>
              <Text style={styles.panelDescription}>
                과거 다치거나 불편한 몸 부위를 선택해주세요
              </Text>
              <View style={styles.optionGrid}>
                {bodyParts.map(part => (
                  <TouchableOpacity
                    key={part}
                    style={[
                      styles.optionButton,
                      weakParts.includes(part) && styles.optionButtonSelected,
                    ]}
                    onPress={() => handleWeakPartToggle(part)}>
                    <Text
                      style={[
                        styles.optionButtonText,
                        weakParts.includes(part) && styles.optionButtonTextSelected,
                      ]}>
                      {part}
                    </Text>
                  </TouchableOpacity>
                ))}
              </View>
              <TouchableOpacity
                style={styles.confirmButton}
                onPress={() => setShowWeakPanel(false)}>
                <Text style={styles.confirmButtonText}>선택 완료</Text>
              </TouchableOpacity>
            </ScrollView>
          </View>
        </TouchableOpacity>
      </Modal>

      {/* 운동 경력 패널 */}
      <Modal
        visible={showLevelPanel}
        transparent={true}
        animationType="slide"
        onRequestClose={() => setShowLevelPanel(false)}>
        <TouchableOpacity
          style={styles.panelOverlay}
          activeOpacity={1}
          onPress={() => setShowLevelPanel(false)}>
          <View style={styles.bottomPanel}>
            <View style={styles.panelHandle} />
            <View style={styles.panelHeader}>
              <Text style={styles.panelHeaderText}>운동 경력 선택</Text>
            </View>
            <ScrollView style={styles.panelBody}>
              <Text style={styles.panelDescription}>현재 운동 수준을 선택해주세요</Text>
              <View style={styles.optionGrid}>
                {levels.map(lv => (
                  <TouchableOpacity
                    key={lv}
                    style={[
                      styles.optionButton,
                      level === lv && styles.optionButtonSelected,
                    ]}
                    onPress={() => setLevel(lv)}>
                    <Text
                      style={[
                        styles.optionButtonText,
                        level === lv && styles.optionButtonTextSelected,
                      ]}>
                      {lv}
                    </Text>
                  </TouchableOpacity>
                ))}
              </View>
              <TouchableOpacity
                style={styles.confirmButton}
                onPress={() => setShowLevelPanel(false)}>
                <Text style={styles.confirmButtonText}>선택 완료</Text>
              </TouchableOpacity>
            </ScrollView>
          </View>
        </TouchableOpacity>
      </Modal>

      {/* 보강하고 싶은 부위 패널 */}
      <Modal
        visible={showTargetPanel}
        transparent={true}
        animationType="slide"
        onRequestClose={() => setShowTargetPanel(false)}>
        <TouchableOpacity
          style={styles.panelOverlay}
          activeOpacity={1}
          onPress={() => setShowTargetPanel(false)}>
          <View style={styles.bottomPanel}>
            <View style={styles.panelHandle} />
            <View style={styles.panelHeader}>
              <Text style={styles.panelHeaderText}>보강하고 싶은 부위</Text>
            </View>
            <ScrollView style={styles.panelBody}>
              <Text style={styles.panelDescription}>
                집중적으로 운동하고 싶은 부위를 선택해주세요
              </Text>
              <View style={styles.optionGrid}>
                {targetAreas.map(area => (
                  <TouchableOpacity
                    key={area}
                    style={[
                      styles.optionButton,
                      targetParts.includes(area) && styles.optionButtonSelected,
                    ]}
                    onPress={() => handleTargetPartToggle(area)}>
                    <Text
                      style={[
                        styles.optionButtonText,
                        targetParts.includes(area) && styles.optionButtonTextSelected,
                      ]}>
                      {area}
                    </Text>
                  </TouchableOpacity>
                ))}
              </View>
              <TouchableOpacity
                style={styles.confirmButton}
                onPress={() => setShowTargetPanel(false)}>
                <Text style={styles.confirmButtonText}>선택 완료</Text>
              </TouchableOpacity>
            </ScrollView>
          </View>
        </TouchableOpacity>
      </Modal>
    </SafeAreaView>
  );
};

const styles = StyleSheet.create({
  container: {
    flex: 1,
    backgroundColor: '#111111',
  },
  header: {
    flexDirection: 'row',
    justifyContent: 'space-between',
    alignItems: 'center',
    paddingVertical: 16,
    paddingHorizontal: 20,
    borderBottomWidth: 1,
    borderBottomColor: '#333333',
  },
  headerTitle: {
    fontSize: 20,
    fontWeight: '700',
    color: '#ffffff',
  },
  content: {
    flex: 1,
  },
  contentContainer: {
    padding: 60,
    paddingTop: 60,
    paddingHorizontal: 20,
    alignItems: 'center',
  },
  mainContent: {
    alignItems: 'center',
    width: '100%',
  },
  title: {
    fontSize: 20,
    fontWeight: '700',
    color: '#ffffff',
    textAlign: 'center',
    lineHeight: 28,
    marginBottom: 80,
  },
  buttonGroup: {
    width: '100%',
    gap: 12,
  },
  actionButton: {
    width: '100%',
    height: 56,
    backgroundColor: '#e3ff7c',
    borderRadius: 12,
    justifyContent: 'center',
    alignItems: 'center',
  },
  actionButtonText: {
    fontSize: 16,
    fontWeight: '600',
    color: '#111111',
  },
  selectedInfo: {
    fontSize: 14,
    color: '#999999',
    marginTop: 8,
    marginBottom: 4,
    textAlign: 'center',
  },
  savedRoutines: {
    width: '100%',
    marginTop: 30,
    padding: 20,
  },
  savedRoutinesTitle: {
    fontSize: 18,
    fontWeight: '700',
    color: '#ffffff',
    marginBottom: 15,
  },
  savedRoutineItem: {
    backgroundColor: '#222222',
    borderRadius: 12,
    padding: 16,
    marginBottom: 12,
  },
  savedRoutineHeader: {
    flexDirection: 'row',
    justifyContent: 'space-between',
    alignItems: 'center',
    marginBottom: 8,
  },
  savedRoutineDate: {
    fontSize: 14,
    fontWeight: '600',
    color: '#ffffff',
  },
  savedRoutineBadge: {
    backgroundColor: '#e3ff7c',
    paddingVertical: 4,
    paddingHorizontal: 10,
    borderRadius: 12,
  },
  savedRoutineBadgeText: {
    fontSize: 12,
    fontWeight: '500',
    color: '#111111',
  },
  savedRoutineInfo: {
    fontSize: 14,
    color: '#999999',
  },
  routineView: {
    padding: 20,
  },
  routineTitle: {
    fontSize: 22,
    fontWeight: '700',
    color: '#ffffff',
    marginBottom: 5,
  },
  routineDate: {
    fontSize: 14,
    color: '#999999',
    marginBottom: 20,
  },
  dayTabsContainer: {
    marginBottom: 20,
  },
  dayTabs: {
    gap: 8,
    paddingBottom: 8,
  },
  dayTab: {
    paddingVertical: 5,
    paddingHorizontal: 16,
    backgroundColor: '#222222',
    borderRadius: 20,
    marginRight: 8,
  },
  dayTabActive: {
    backgroundColor: '#e3ff7c',
  },
  dayTabText: {
    fontSize: 12,
    fontWeight: '500',
    color: '#999999',
  },
  dayTabTextActive: {
    color: '#111111',
    fontWeight: '600',
  },
  routineInfo: {
    flexDirection: 'row',
    gap: 15,
    marginBottom: 20,
    fontSize: 14,
    color: '#999999',
  },
  routineInfoText: {
    fontSize: 14,
    color: '#999999',
  },
  exerciseList: {
    gap: 12,
    marginBottom: 30,
  },
  exerciseCard: {
    backgroundColor: '#464646',
    borderRadius: 12,
    padding: 16,
    flexDirection: 'row',
    alignItems: 'center',
    gap: 15,
  },
  exerciseIcon: {
    fontSize: 32,
    width: 50,
    height: 50,
    justifyContent: 'center',
    alignItems: 'center',
    backgroundColor: '#333333',
    borderRadius: 10,
  },
  exerciseIconText: {
    fontSize: 32,
  },
  exerciseInfo: {
    flex: 1,
  },
  exerciseName: {
    fontSize: 16,
    fontWeight: '600',
    color: '#ffffff',
    marginBottom: 5,
  },
  exerciseDetail: {
    fontSize: 14,
    color: '#aaaaaa',
  },
  routineButtons: {
    gap: 12,
  },
  saveRoutineButton: {
    width: '100%',
    height: 52,
    backgroundColor: '#e3ff7c',
    borderRadius: 12,
    justifyContent: 'center',
    alignItems: 'center',
  },
  saveRoutineButtonText: {
    fontSize: 16,
    fontWeight: '600',
    color: '#111111',
  },
  reRecommendButton: {
    width: '100%',
    height: 52,
    backgroundColor: 'transparent',
    borderWidth: 1,
    borderColor: '#464646',
    borderRadius: 12,
    justifyContent: 'center',
    alignItems: 'center',
  },
  reRecommendButtonText: {
    fontSize: 16,
    fontWeight: '600',
    color: '#ffffff',
  },
  panelOverlay: {
    flex: 1,
    backgroundColor: 'rgba(0, 0, 0, 0.5)',
    justifyContent: 'center',
    alignItems: 'center',
  },
  bottomPanel: {
    backgroundColor: '#1a1a1a',
    borderRadius: 20,
    width: '90%',
    maxWidth: 390,
    maxHeight: '70%',
    paddingBottom: 20,
  },
  panelHandle: {
    width: 40,
    height: 4,
    backgroundColor: '#555555',
    borderRadius: 2,
    alignSelf: 'center',
    marginTop: 12,
    marginBottom: 20,
  },
  panelHeader: {
    paddingHorizontal: 20,
    marginBottom: 16,
  },
  panelHeaderText: {
    fontSize: 18,
    fontWeight: '700',
    color: '#ffffff',
  },
  panelBody: {
    paddingHorizontal: 20,
  },
  panelDescription: {
    fontSize: 14,
    color: '#999999',
    marginBottom: 20,
    lineHeight: 20,
  },
  optionGrid: {
    flexDirection: 'row',
    flexWrap: 'wrap',
    gap: 12,
    marginBottom: 24,
    justifyContent: 'space-between',
  },
  optionButton: {
    width: '48%',
    height: 50,
    backgroundColor: '#2a2a2a',
    borderRadius: 12,
    borderWidth: 2,
    borderColor: 'transparent',
    justifyContent: 'center',
    alignItems: 'center',
  },
  optionButtonSelected: {
    backgroundColor: '#e3ff7c',
    borderColor: '#e3ff7c',
  },
  optionButtonText: {
    fontSize: 15,
    fontWeight: '500',
    color: '#ffffff',
  },
  optionButtonTextSelected: {
    color: '#111111',
    fontWeight: '600',
  },
  confirmButton: {
    width: '100%',
    height: 52,
    backgroundColor: '#e3ff7c',
    borderRadius: 12,
    justifyContent: 'center',
    alignItems: 'center',
  },
  confirmButtonText: {
    fontSize: 16,
    fontWeight: '600',
    color: '#111111',
  },
});

export default RoutineRecommendNewScreen;

