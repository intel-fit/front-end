import React, {useState} from 'react';
import {
  View,
  Text,
  Modal,
  TouchableOpacity,
  StyleSheet,
  ScrollView,
  Alert,
  Dimensions,
} from 'react-native';
import AsyncStorage from '@react-native-async-storage/async-storage';
import {Ionicons as Icon} from '@expo/vector-icons';

interface RoutineRecommendModalProps {
  isOpen: boolean;
  onClose: () => void;
}

const RoutineRecommendModal: React.FC<RoutineRecommendModalProps> = ({
  isOpen,
  onClose,
}) => {
  const [savedRoutines, setSavedRoutines] = useState<any[]>([]);
  const [selectedRoutine, setSelectedRoutine] = useState<any>(null);
  const [selectedDay, setSelectedDay] = useState(0);

  const weekDays = ['1일차', '2일차', '3일차', '4일차', '5일차', '6일차', '7일차'];

  React.useEffect(() => {
    if (isOpen) {
      loadRoutines();
    }
  }, [isOpen]);

  const loadRoutines = async () => {
    try {
      const stored = await AsyncStorage.getItem('savedRoutines');
      if (stored) {
        setSavedRoutines(JSON.parse(stored));
      }
    } catch (error) {
      console.log('Failed to load routines', error);
    }
  };

  const handleRoutineClick = (routine: any) => {
    setSelectedRoutine(routine);
    setSelectedDay(0);
  };

  const handleBack = () => {
    setSelectedRoutine(null);
    setSelectedDay(0);
  };

  const handleDelete = async (routineId: number, event?: any) => {
    if (event) {
      event.stopPropagation?.();
    }
    Alert.alert('삭제', '이 루틴을 삭제하시겠습니까?', [
      {text: '취소', style: 'cancel'},
      {
        text: '삭제',
        style: 'destructive',
        onPress: async () => {
          const updated = savedRoutines.filter(r => r.id !== routineId);
          await AsyncStorage.setItem('savedRoutines', JSON.stringify(updated));
          setSavedRoutines(updated);
          if (selectedRoutine && selectedRoutine.id === routineId) {
            setSelectedRoutine(null);
            setSelectedDay(0);
          }
        },
      },
    ]);
  };

  if (!isOpen) return null;

  return (
    <Modal
      visible={isOpen}
      animationType="fade"
      transparent={true}
      onRequestClose={onClose}>
      <TouchableOpacity
        activeOpacity={1}
        style={styles.overlay}
        onPress={onClose}>
        <View
          style={styles.modalContent}
          onStartShouldSetResponder={() => true}>
          <View style={styles.header}>
            <Text style={styles.title}>
              {selectedRoutine ? '루틴 상세보기' : '운동 추천 내역'}
            </Text>
            <TouchableOpacity onPress={onClose} style={styles.closeBtn}>
              <Text style={styles.closeBtnText}>✕</Text>
            </TouchableOpacity>
          </View>

          <ScrollView style={styles.body} showsVerticalScrollIndicator={false}>
            {!selectedRoutine ? (
              savedRoutines.length === 0 ? (
                <View style={styles.emptyState}>
                  <Text style={styles.emptyText}>저장된 운동 루틴이 없습니다.</Text>
                  <Text style={styles.emptySubtitle}>
                    운동 추천을 받고 루틴을 저장해보세요!
                  </Text>
                  <TouchableOpacity style={styles.goToRecommendBtn}>
                    <Text style={styles.goToRecommendBtnText}>추천받으러 가기 →</Text>
                  </TouchableOpacity>
                </View>
              ) : (
                <View style={styles.list}>
                  {savedRoutines.map(routine => (
                    <TouchableOpacity
                      key={routine.id}
                      style={styles.card}
                      onPress={() => handleRoutineClick(routine)}
                      activeOpacity={0.98}>
                      <View style={styles.cardHeader}>
                        <View style={styles.dateContainer}>
                          <Text style={styles.dateIcon}>📅</Text>
                          <Text style={styles.date}>{routine.date}</Text>
                        </View>
                        <TouchableOpacity
                          onPress={(e) => handleDelete(routine.id, e)}
                          style={styles.deleteBtn}
                          activeOpacity={0.9}>
                          <Text style={styles.deleteBtnText}>🗑️</Text>
                        </TouchableOpacity>
                      </View>
                      <View style={styles.cardBody}>
                        {routine.level && (
                          <View style={[styles.badge, styles.levelBadge]}>
                            <Text style={styles.badgeText}>{routine.level}</Text>
                          </View>
                        )}
                        {routine.targetParts && routine.targetParts.length > 0 && (
                          <View style={[styles.badge, styles.targetBadge]}>
                            <Text style={styles.targetBadgeText}>
                              집중: {routine.targetParts.join(', ')}
                            </Text>
                          </View>
                        )}
                        {routine.weakParts && routine.weakParts.length > 0 && (
                          <View style={[styles.badge, styles.weakBadge]}>
                            <Text style={styles.weakBadgeText}>
                              주의: {routine.weakParts.join(', ')}
                            </Text>
                          </View>
                        )}
                      </View>
                      <View style={styles.cardFooter}>
                        <Text style={styles.viewDetail}>자세히 보기 →</Text>
                      </View>
                    </TouchableOpacity>
                  ))}
                </View>
              )
            ) : (
              <View style={styles.detail}>
                <TouchableOpacity
                  style={styles.backBtn}
                  onPress={handleBack}
                  activeOpacity={0.95}>
                  <Text style={styles.backBtnText}>← 목록으로</Text>
                </TouchableOpacity>

                <View style={styles.detailInfo}>
                  <Text style={styles.detailDate}>{selectedRoutine.date}</Text>
                  <View style={styles.detailBadges}>
                    {selectedRoutine.level && (
                      <View style={styles.detailBadge}>
                        <Text style={styles.detailBadgeText}>
                          {selectedRoutine.level}
                        </Text>
                      </View>
                    )}
                    {selectedRoutine.targetParts &&
                      selectedRoutine.targetParts.length > 0 && (
                        <View style={styles.detailBadge}>
                          <Text style={styles.detailBadgeText}>
                            집중: {selectedRoutine.targetParts.join(', ')}
                          </Text>
                        </View>
                      )}
                  </View>
                </View>

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

                <View style={styles.exerciseList}>
                  {selectedRoutine.routine?.[selectedDay]?.map(
                    (exercise: any, index: number) => (
                      <View key={index} style={styles.exerciseItem}>
                        <View style={styles.exerciseIcon}>
                          <Text style={styles.exerciseIconText}>
                            {exercise.icon || '💪'}
                          </Text>
                        </View>
                        <View style={styles.exerciseInfo}>
                          <Text style={styles.exerciseName}>{exercise.name}</Text>
                          <Text style={styles.exerciseDetail}>{exercise.detail}</Text>
                        </View>
                      </View>
                    ),
                  )}
                </View>
              </View>
            )}
          </ScrollView>
        </View>
      </TouchableOpacity>
    </Modal>
  );
};

const screenWidth = Dimensions.get('window').width;
const maxWidth = Math.min(screenWidth * 0.9, 390);

const styles = StyleSheet.create({
  overlay: {
    flex: 1,
    backgroundColor: 'rgba(0, 0, 0, 0.7)',
    justifyContent: 'center',
    alignItems: 'center',
    padding: 20,
  },
  modalContent: {
    backgroundColor: '#1a1a1a',
    borderRadius: 20,
    width: maxWidth,
    maxWidth: '90%',
    maxHeight: '80%',
    overflow: 'hidden',
    zIndex: 1000,
    elevation: 5,
    shadowColor: '#000',
    shadowOffset: {width: 0, height: 2},
    shadowOpacity: 0.25,
    shadowRadius: 3.84,
  },
  header: {
    flexDirection: 'row',
    justifyContent: 'space-between',
    alignItems: 'center',
    padding: 20,
    borderBottomWidth: 1,
    borderBottomColor: '#333333',
    backgroundColor: '#111111',
  },
  title: {
    fontSize: 20,
    fontWeight: '700',
    color: '#ffffff',
  },
  closeBtn: {
    width: 32,
    height: 32,
    justifyContent: 'center',
    alignItems: 'center',
  },
  closeBtnText: {
    fontSize: 28,
    color: '#999999',
  },
  body: {
    flex: 1,
    padding: 20,
  },
  emptyState: {
    alignItems: 'center',
    paddingVertical: 60,
    paddingHorizontal: 20,
  },
  emptyText: {
    fontSize: 16,
    color: '#999999',
    textAlign: 'center',
    marginBottom: 10,
  },
  emptySubtitle: {
    fontSize: 14,
    color: '#666666',
    textAlign: 'center',
    marginBottom: 24,
  },
  goToRecommendBtn: {
    backgroundColor: '#e3ff7c',
    paddingVertical: 12,
    paddingHorizontal: 24,
    borderRadius: 12,
    marginTop: 16,
  },
  goToRecommendBtnText: {
    fontSize: 15,
    fontWeight: '600',
    color: '#111111',
  },
  list: {
    gap: 16,
  },
  card: {
    backgroundColor: '#222222',
    borderRadius: 12,
    padding: 16,
    borderWidth: 2,
    borderColor: 'transparent',
  },
  cardHeader: {
    flexDirection: 'row',
    justifyContent: 'space-between',
    alignItems: 'center',
    marginBottom: 12,
  },
  dateContainer: {
    flexDirection: 'row',
    alignItems: 'center',
    gap: 8,
  },
  dateIcon: {
    fontSize: 18,
  },
  date: {
    fontSize: 16,
    fontWeight: '600',
    color: '#ffffff',
  },
  deleteBtn: {
    padding: 4,
  },
  deleteBtnText: {
    fontSize: 18,
  },
  cardBody: {
    flexDirection: 'row',
    flexWrap: 'wrap',
    gap: 8,
    marginBottom: 12,
  },
  badge: {
    paddingVertical: 4,
    paddingHorizontal: 10,
    borderRadius: 12,
  },
  levelBadge: {
    backgroundColor: '#e3ff7c',
  },
  targetBadge: {
    backgroundColor: '#4a90e2',
  },
  weakBadge: {
    backgroundColor: '#ff6b6b',
  },
  badgeText: {
    fontSize: 12,
    fontWeight: '500',
    color: '#111111',
  },
  targetBadgeText: {
    fontSize: 12,
    fontWeight: '500',
    color: '#ffffff',
  },
  weakBadgeText: {
    fontSize: 12,
    fontWeight: '500',
    color: '#ffffff',
  },
  cardFooter: {
    alignItems: 'flex-end',
  },
  viewDetail: {
    fontSize: 14,
    color: '#e3ff7c',
    fontWeight: '500',
  },
  detail: {
    gap: 20,
  },
  backBtn: {
    backgroundColor: '#2a2a2a',
    paddingVertical: 10,
    paddingHorizontal: 16,
    borderRadius: 8,
    alignSelf: 'flex-start',
  },
  backBtnText: {
    fontSize: 14,
    fontWeight: '500',
    color: '#ffffff',
  },
  detailInfo: {
    backgroundColor: '#222222',
    padding: 16,
    borderRadius: 12,
  },
  detailDate: {
    fontSize: 18,
    fontWeight: '700',
    color: '#ffffff',
    marginBottom: 12,
  },
  detailBadges: {
    flexDirection: 'row',
    flexWrap: 'wrap',
    gap: 8,
  },
  detailBadge: {
    paddingVertical: 6,
    paddingHorizontal: 12,
    borderRadius: 12,
    backgroundColor: '#e3ff7c',
  },
  detailBadgeText: {
    fontSize: 13,
    fontWeight: '500',
    color: '#111111',
  },
  dayTabsContainer: {
    marginVertical: 8,
  },
  dayTabs: {
    gap: 8,
    paddingBottom: 8,
  },
  dayTab: {
    paddingVertical: 8,
    paddingHorizontal: 16,
    backgroundColor: '#222222',
    borderRadius: 20,
  },
  dayTabActive: {
    backgroundColor: '#e3ff7c',
  },
  dayTabText: {
    fontSize: 14,
    fontWeight: '500',
    color: '#999999',
  },
  dayTabTextActive: {
    color: '#111111',
    fontWeight: '600',
  },
  exerciseList: {
    gap: 12,
  },
  exerciseItem: {
    backgroundColor: '#2a2a2a',
    borderRadius: 12,
    padding: 16,
    flexDirection: 'row',
    alignItems: 'center',
    gap: 15,
  },
  exerciseIcon: {
    width: 50,
    height: 50,
    borderRadius: 10,
    backgroundColor: '#333333',
    justifyContent: 'center',
    alignItems: 'center',
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
});

export default RoutineRecommendModal;

