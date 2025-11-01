import React, {useState} from 'react';
import {
  View,
  Text,
  StyleSheet,
  ScrollView,
  TouchableOpacity,
  Alert,
  Dimensions,
} from 'react-native';
import {SafeAreaView} from 'react-native-safe-area-context';
import {useFocusEffect} from '@react-navigation/native';
import {Ionicons as Icon} from '@expo/vector-icons';
import AsyncStorage from '@react-native-async-storage/async-storage';

const MealRecommendHistoryScreen = ({navigation}: any) => {
  const [savedMeals, setSavedMeals] = useState<any[]>([]);
  const [selectedMeal, setSelectedMeal] = useState<any>(null);
  const [selectedDay, setSelectedDay] = useState(0);

  const loadMeals = async () => {
    try {
      const stored = await AsyncStorage.getItem('savedMealPlans');
      if (stored) {
        setSavedMeals(JSON.parse(stored));
      } else {
        setSavedMeals([]);
      }
    } catch (error) {
      console.log('Failed to load meals', error);
    }
  };

  useFocusEffect(
    React.useCallback(() => {
      loadMeals();
    }, []),
  );

  const handleMealClick = (meal: any) => {
    setSelectedMeal(meal);
    setSelectedDay(0);
  };

  const handleBack = () => {
    setSelectedMeal(null);
    setSelectedDay(0);
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
            setSelectedDay(0);
          }
        },
      },
    ]);
  };

  const currentDayMeal = selectedMeal?.meals?.[selectedDay];

  return (
    <SafeAreaView style={styles.container} edges={['top']}>
      <View style={styles.header}>
        <TouchableOpacity onPress={() => navigation.goBack()}>
          <Icon name="chevron-back" size={28} color="#ffffff" />
        </TouchableOpacity>
        <Text style={styles.headerTitle}>
          {selectedMeal ? '식단 상세보기' : '식단 추천 내역'}
        </Text>
        <View style={{width: 28}} />
      </View>

      <ScrollView style={styles.content} showsVerticalScrollIndicator={false}>
        {!selectedMeal ? (
          savedMeals.length === 0 ? (
            <View style={styles.emptyState}>
              <Text style={styles.emptyText}>저장된 식단이 없습니다.</Text>
              <Text style={styles.emptySubtitle}>
                식단 추천을 받고 저장해보세요!
              </Text>
              <TouchableOpacity
                style={styles.goToRecommendBtn}
                onPress={() => navigation.navigate('MealRecommend')}>
                <Text style={styles.goToRecommendBtnText}>추천받으러 가기 →</Text>
              </TouchableOpacity>
            </View>
          ) : (
            <View style={styles.list}>
              <TouchableOpacity
                style={styles.newRecommendBtn}
                onPress={() => navigation.navigate('MealRecommend')}>
                <Text style={styles.newRecommendBtnText}>새 식단 추천받기</Text>
              </TouchableOpacity>
              {savedMeals.map(meal => (
                <TouchableOpacity
                  key={meal.id}
                  style={styles.card}
                  onPress={() => handleMealClick(meal)}
                  activeOpacity={0.98}>
                  <View style={styles.cardHeader}>
                    <View style={styles.dateContainer}>
                      <Text style={styles.dateIcon}>🍽️</Text>
                      <Text style={styles.date}>{meal.date}</Text>
                    </View>
                    <TouchableOpacity
                      onPress={() => handleDelete(meal.id)}
                      style={styles.deleteBtn}
                      activeOpacity={0.9}>
                      <Text style={styles.deleteBtnText}>🗑️</Text>
                    </TouchableOpacity>
                  </View>
                  <View style={styles.cardBody}>
                    <View style={styles.summary}>
                      <View style={styles.badge}>
                        <Text style={styles.badgeText}>📅 7일 식단</Text>
                      </View>
                      <View style={[styles.badge, styles.caloriesBadge]}>
                        <Text style={styles.caloriesBadgeText}>
                          {meal.meals?.[0]?.totalCalories || 0} kcal/일
                        </Text>
                      </View>
                    </View>
                    {meal.meals?.[0] && (
                      <View style={styles.nutritionSummary}>
                        <Text style={styles.nutritionText}>
                          탄 {meal.meals[0].carbs || 0}g
                        </Text>
                        <Text style={styles.nutritionText}>
                          단 {meal.meals[0].protein || 0}g
                        </Text>
                        <Text style={styles.nutritionText}>
                          지 {meal.meals[0].fat || 0}g
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
              <Text style={styles.detailDate}>{selectedMeal.date}</Text>
              <View style={styles.detailSummary}>
                <View style={styles.detailBadge}>
                  <Text style={styles.detailBadgeText}>7일 식단</Text>
                </View>
              </View>
            </View>

            {selectedMeal.meals && selectedMeal.meals.length > 0 && (
              <>
                <ScrollView
                  horizontal
                  showsHorizontalScrollIndicator={false}
                  style={styles.dayTabsContainer}
                  contentContainerStyle={styles.dayTabs}>
                  {selectedMeal.meals.map((_: any, index: number) => (
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
                        {index + 1}일차
                      </Text>
                    </TouchableOpacity>
                  ))}
                </ScrollView>

                {currentDayMeal && (
                  <>
                    {/* 영양소 카드 */}
                    <View style={styles.nutritionCard}>
                      <Text style={styles.caloriesTotal}>
                        {currentDayMeal.totalCalories || 0} kcal
                      </Text>
                      <View style={styles.nutritionGrid}>
                        <View style={styles.nutritionItem}>
                          <Text style={styles.nutritionLabel}>탄수화물</Text>
                          <Text style={styles.nutritionValue}>
                            {currentDayMeal.carbs || 0}g
                          </Text>
                        </View>
                        <View style={styles.nutritionItem}>
                          <Text style={styles.nutritionLabel}>단백질</Text>
                          <Text style={styles.nutritionValue}>
                            {currentDayMeal.protein || 0}g
                          </Text>
                        </View>
                        <View style={styles.nutritionItem}>
                          <Text style={styles.nutritionLabel}>지방</Text>
                          <Text style={styles.nutritionValue}>
                            {currentDayMeal.fat || 0}g
                          </Text>
                        </View>
                      </View>
                    </View>

                    {/* 아침 */}
                    {currentDayMeal.breakfast && (
                      <View style={styles.mealSection}>
                        <View style={styles.mealSectionHeader}>
                          <Text style={styles.mealSectionTitle}>🌅 아침</Text>
                          <Text style={styles.mealSectionCalories}>
                            {currentDayMeal.breakfast.calories || 0} kcal
                          </Text>
                        </View>
                        <View style={styles.mealItems}>
                          {currentDayMeal.breakfast.meals?.map(
                            (item: any, index: number) => (
                              <View key={index} style={styles.mealItemDetail}>
                                <Text style={styles.mealItemName}>{item.name}</Text>
                                <View style={styles.mealItemNutrition}>
                                  <Text style={styles.mealItemCalories}>
                                    {item.calories || 0}kcal
                                  </Text>
                                  <Text style={styles.mealItemMacros}>
                                    탄{item.carbs || 0}g · 단{item.protein || 0}g · 지
                                    {item.fat || 0}g
                                  </Text>
                                </View>
                              </View>
                            ),
                          )}
                        </View>
                      </View>
                    )}

                    {/* 점심 */}
                    {currentDayMeal.lunch && (
                      <View style={styles.mealSection}>
                        <View style={styles.mealSectionHeader}>
                          <Text style={styles.mealSectionTitle}>☀️ 점심</Text>
                          <Text style={styles.mealSectionCalories}>
                            {currentDayMeal.lunch.calories || 0} kcal
                          </Text>
                        </View>
                        <View style={styles.mealItems}>
                          {currentDayMeal.lunch.meals?.map(
                            (item: any, index: number) => (
                              <View key={index} style={styles.mealItemDetail}>
                                <Text style={styles.mealItemName}>{item.name}</Text>
                                <View style={styles.mealItemNutrition}>
                                  <Text style={styles.mealItemCalories}>
                                    {item.calories || 0}kcal
                                  </Text>
                                  <Text style={styles.mealItemMacros}>
                                    탄{item.carbs || 0}g · 단{item.protein || 0}g · 지
                                    {item.fat || 0}g
                                  </Text>
                                </View>
                              </View>
                            ),
                          )}
                        </View>
                      </View>
                    )}

                    {/* 저녁 */}
                    {currentDayMeal.dinner && (
                      <View style={styles.mealSection}>
                        <View style={styles.mealSectionHeader}>
                          <Text style={styles.mealSectionTitle}>🌙 저녁</Text>
                          <Text style={styles.mealSectionCalories}>
                            {currentDayMeal.dinner.calories || 0} kcal
                          </Text>
                        </View>
                        <View style={styles.mealItems}>
                          {currentDayMeal.dinner.meals?.map(
                            (item: any, index: number) => (
                              <View key={index} style={styles.mealItemDetail}>
                                <Text style={styles.mealItemName}>{item.name}</Text>
                                <View style={styles.mealItemNutrition}>
                                  <Text style={styles.mealItemCalories}>
                                    {item.calories || 0}kcal
                                  </Text>
                                  <Text style={styles.mealItemMacros}>
                                    탄{item.carbs || 0}g · 단{item.protein || 0}g · 지
                                    {item.fat || 0}g
                                  </Text>
                                </View>
                              </View>
                            ),
                          )}
                        </View>
                      </View>
                    )}
                  </>
                )}
              </>
            )}
          </View>
        )}
      </ScrollView>
    </SafeAreaView>
  );
};

const styles = StyleSheet.create({
  container: {
    flex: 1,
    backgroundColor: '#1a1a1a',
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
  newRecommendBtn: {
    backgroundColor: '#e3ff7c',
    paddingVertical: 10,
    paddingHorizontal: 16,
    borderRadius: 8,
    alignSelf: 'flex-start',
    marginBottom: 8,
  },
  newRecommendBtnText: {
    fontSize: 14,
    fontWeight: '600',
    color: '#111111',
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
    marginBottom: 12,
  },
  summary: {
    flexDirection: 'row',
    flexWrap: 'wrap',
    gap: 8,
    marginBottom: 8,
  },
  badge: {
    paddingVertical: 4,
    paddingHorizontal: 10,
    borderRadius: 12,
    backgroundColor: '#4a90e2',
  },
  caloriesBadge: {
    backgroundColor: '#e3ff7c',
  },
  badgeText: {
    fontSize: 12,
    fontWeight: '500',
    color: '#ffffff',
  },
  caloriesBadgeText: {
    fontSize: 12,
    fontWeight: '500',
    color: '#111111',
  },
  nutritionSummary: {
    flexDirection: 'row',
    gap: 12,
  },
  nutritionText: {
    fontSize: 13,
    color: '#999999',
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
  detailSummary: {
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
    fontSize: 13,
    fontWeight: '500',
    color: '#999999',
  },
  dayTabTextActive: {
    color: '#111111',
    fontWeight: '600',
  },
  nutritionCard: {
    backgroundColor: '#667eea',
    borderRadius: 16,
    padding: 20,
    alignItems: 'center',
    minHeight: 140,
    justifyContent: 'center',
  },
  caloriesTotal: {
    fontSize: 32,
    fontWeight: '700',
    color: '#ffffff',
    marginBottom: 16,
  },
  nutritionGrid: {
    flexDirection: 'row',
    justifyContent: 'space-around',
    width: '100%',
    gap: 16,
  },
  nutritionItem: {
    alignItems: 'center',
    gap: 4,
  },
  nutritionLabel: {
    fontSize: 12,
    color: '#ffffff',
    opacity: 0.8,
  },
  nutritionValue: {
    fontSize: 18,
    fontWeight: '600',
    color: '#ffffff',
  },
  mealSection: {
    backgroundColor: '#222222',
    borderRadius: 12,
    padding: 16,
  },
  mealSectionHeader: {
    flexDirection: 'row',
    justifyContent: 'space-between',
    alignItems: 'center',
    marginBottom: 12,
    paddingBottom: 12,
    borderBottomWidth: 1,
    borderBottomColor: '#333333',
  },
  mealSectionTitle: {
    fontSize: 16,
    fontWeight: '600',
    color: '#ffffff',
  },
  mealSectionCalories: {
    fontSize: 14,
    fontWeight: '600',
    color: '#e3ff7c',
  },
  mealItems: {
    gap: 12,
  },
  mealItemDetail: {
    backgroundColor: '#2a2a2a',
    padding: 12,
    borderRadius: 8,
    flexDirection: 'row',
    justifyContent: 'space-between',
    alignItems: 'center',
  },
  mealItemName: {
    fontSize: 14,
    fontWeight: '500',
    color: '#ffffff',
    flex: 1,
  },
  mealItemNutrition: {
    alignItems: 'flex-end',
    gap: 4,
  },
  mealItemCalories: {
    fontSize: 13,
    fontWeight: '600',
    color: '#e3ff7c',
  },
  mealItemMacros: {
    fontSize: 11,
    color: '#999999',
  },
});

export default MealRecommendHistoryScreen;

