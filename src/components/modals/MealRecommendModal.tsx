import React, {useState} from 'react';
import {
  View,
  Text,
  Modal,
  TouchableOpacity,
  StyleSheet,
  ScrollView,
  Alert,
} from 'react-native';
import AsyncStorage from '@react-native-async-storage/async-storage';
import {Ionicons as Icon} from '@expo/vector-icons';
import {colors} from '../../theme/colors';

interface MealRecommendModalProps {
  isOpen: boolean;
  onClose: () => void;
}

const MealRecommendModal: React.FC<MealRecommendModalProps> = ({
  isOpen,
  onClose,
}) => {
  const [savedMeals, setSavedMeals] = useState<any[]>([]);
  const [selectedMeal, setSelectedMeal] = useState<any>(null);

  React.useEffect(() => {
    if (isOpen) {
      loadMeals();
    }
  }, [isOpen]);

  const loadMeals = async () => {
    try {
      const stored = await AsyncStorage.getItem('savedMealPlans');
      if (stored) {
        setSavedMeals(JSON.parse(stored));
      }
    } catch (error) {
      console.log('Failed to load meals', error);
    }
  };

  const handleDelete = async (mealId: number) => {
    Alert.alert('삭제', '이 식단을 삭제하시겠습니까?', [
      {text: '취소', style: 'cancel'},
      {
        text: '삭제',
        style: 'destructive',
        onPress: async () => {
          const updated = savedMeals.filter(m => m.id !== mealId);
          await AsyncStorage.setItem('savedMealPlans', JSON.stringify(updated));
          setSavedMeals(updated);
          if (selectedMeal && selectedMeal.id === mealId) {
            setSelectedMeal(null);
          }
        },
      },
    ]);
  };

  return (
    <Modal
      visible={isOpen}
      animationType="slide"
      transparent={true}
      onRequestClose={onClose}>
      <View style={styles.overlay}>
        <View style={styles.modalContent}>
          <View style={styles.header}>
            <Text style={styles.title}>
              {selectedMeal ? '식단 상세보기' : '식단 추천 내역'}
            </Text>
            <TouchableOpacity onPress={onClose} style={styles.closeBtn}>
              <Icon name="close" size={24} color={colors.text} />
            </TouchableOpacity>
          </View>

          <ScrollView style={styles.body}>
            {!selectedMeal ? (
              savedMeals.length === 0 ? (
                <View style={styles.emptyState}>
                  <Text style={styles.emptyText}>저장된 식단이 없습니다.</Text>
                  <Text style={styles.emptySubtitle}>
                    식단 추천을 받고 저장해보세요!
                  </Text>
                </View>
              ) : (
                <View style={styles.list}>
                  {savedMeals.map(meal => (
                    <TouchableOpacity
                      key={meal.id}
                      style={styles.card}
                      onPress={() => setSelectedMeal(meal)}>
                      <View style={styles.cardHeader}>
                        <Text style={styles.date}>🍽️ {meal.date}</Text>
                        <TouchableOpacity
                          onPress={() => handleDelete(meal.id)}
                          style={styles.deleteBtn}>
                          <Icon name="trash" size={20} color={colors.error} />
                        </TouchableOpacity>
                      </View>
                      <View style={styles.cardBody}>
                        <View style={styles.summary}>
                          <View style={styles.badge}>
                            <Text style={styles.badgeText}>📅 7일 식단</Text>
                          </View>
                          <View style={styles.badge}>
                            <Text style={styles.badgeText}>
                              {meal.meals?.[0]?.totalCalories || 0} kcal/일
                            </Text>
                          </View>
                        </View>
                      </View>
                      <Text style={styles.viewDetail}>자세히 보기 →</Text>
                    </TouchableOpacity>
                  ))}
                </View>
              )
            ) : (
              <View style={styles.detail}>
                <TouchableOpacity
                  style={styles.backBtn}
                  onPress={() => setSelectedMeal(null)}>
                  <Icon name="arrow-back" size={20} color={colors.text} />
                  <Text style={styles.backBtnText}>목록으로</Text>
                </TouchableOpacity>
                <Text style={styles.detailDate}>{selectedMeal.date}</Text>
                <Text style={styles.detailInfo}>
                  저장된 식단 상세 정보를 표시합니다.
                </Text>
              </View>
            )}
          </ScrollView>
        </View>
      </View>
    </Modal>
  );
};

const styles = StyleSheet.create({
  overlay: {
    flex: 1,
    backgroundColor: 'rgba(0, 0, 0, 0.7)',
    justifyContent: 'flex-end',
  },
  modalContent: {
    backgroundColor: colors.cardBackground,
    borderTopLeftRadius: 20,
    borderTopRightRadius: 20,
    maxHeight: '90%',
  },
  header: {
    flexDirection: 'row',
    justifyContent: 'space-between',
    alignItems: 'center',
    padding: 20,
    borderBottomWidth: 1,
    borderBottomColor: colors.border,
  },
  title: {
    fontSize: 20,
    fontWeight: '700',
    color: colors.text,
  },
  closeBtn: {
    padding: 4,
  },
  body: {
    padding: 20,
  },
  emptyState: {
    alignItems: 'center',
    padding: 40,
    gap: 12,
  },
  emptyText: {
    fontSize: 16,
    color: colors.text,
    textAlign: 'center',
  },
  emptySubtitle: {
    fontSize: 14,
    color: colors.textLight,
    textAlign: 'center',
  },
  list: {
    gap: 12,
  },
  card: {
    backgroundColor: colors.grayLight,
    padding: 16,
    borderRadius: 12,
    gap: 12,
  },
  cardHeader: {
    flexDirection: 'row',
    justifyContent: 'space-between',
    alignItems: 'center',
  },
  date: {
    fontSize: 14,
    color: colors.text,
  },
  deleteBtn: {
    padding: 4,
  },
  cardBody: {
    gap: 8,
  },
  summary: {
    flexDirection: 'row',
    flexWrap: 'wrap',
    gap: 8,
  },
  badge: {
    backgroundColor: colors.primary + '20',
    paddingHorizontal: 12,
    paddingVertical: 4,
    borderRadius: 12,
  },
  badgeText: {
    fontSize: 12,
    color: colors.primary,
    fontWeight: '500',
  },
  viewDetail: {
    fontSize: 14,
    color: colors.primary,
  },
  detail: {
    gap: 16,
  },
  backBtn: {
    flexDirection: 'row',
    alignItems: 'center',
    gap: 8,
    padding: 8,
  },
  backBtnText: {
    fontSize: 16,
    color: colors.text,
  },
  detailDate: {
    fontSize: 18,
    fontWeight: '600',
    color: colors.text,
  },
  detailInfo: {
    fontSize: 14,
    color: colors.textLight,
  },
});

export default MealRecommendModal;

