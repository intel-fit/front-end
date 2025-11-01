import React, {useState, useEffect} from 'react';
import {
  View,
  Text,
  StyleSheet,
  SafeAreaView,
  ScrollView,
  TouchableOpacity,
  TextInput,
  Alert,
  ActivityIndicator,
} from 'react-native';
import {Ionicons as Icon} from '@expo/vector-icons';
import AsyncStorage from '@react-native-async-storage/async-storage';
import {useNavigation} from '@react-navigation/native';

const MEAL_DATABASE = {
  breakfast: [
    {name: '계란후라이 2개', calories: 180, carbs: 2, protein: 12, fat: 14},
    {name: '토스트 2장', calories: 160, carbs: 30, protein: 6, fat: 2},
    {name: '그릭 요거트', calories: 100, carbs: 6, protein: 17, fat: 0},
    {name: '바나나', calories: 105, carbs: 27, protein: 1, fat: 0},
    {name: '오트밀', calories: 150, carbs: 27, protein: 5, fat: 3},
    {name: '아보카도 토스트', calories: 250, carbs: 25, protein: 7, fat: 16},
    {name: '단백질 쉐이크', calories: 120, carbs: 3, protein: 24, fat: 2},
    {name: '시리얼', calories: 110, carbs: 24, protein: 2, fat: 1},
    {name: '과일 샐러드', calories: 80, carbs: 20, protein: 1, fat: 0},
    {name: '프로틴 팬케이크', calories: 200, carbs: 22, protein: 18, fat: 5},
  ],
  lunch: [
    {name: '닭가슴살 샐러드', calories: 250, carbs: 15, protein: 30, fat: 8},
    {name: '현미밥 한공기', calories: 210, carbs: 44, protein: 4, fat: 2},
    {name: '된장찌개', calories: 120, carbs: 8, protein: 10, fat: 5},
    {name: '김치', calories: 20, carbs: 4, protein: 1, fat: 0},
    {name: '참치 김밥', calories: 300, carbs: 45, protein: 12, fat: 8},
    {name: '치킨 샌드위치', calories: 350, carbs: 35, protein: 25, fat: 12},
    {name: '퀴노아 볼', calories: 280, carbs: 40, protein: 10, fat: 8},
    {name: '연어 덮밥', calories: 420, carbs: 55, protein: 28, fat: 12},
    {name: '새우 샐러드', calories: 180, carbs: 10, protein: 20, fat: 6},
    {name: '소고기 스테이크', calories: 320, carbs: 5, protein: 35, fat: 18},
  ],
  dinner: [
    {name: '닭가슴살 구이 200g', calories: 330, carbs: 0, protein: 62, fat: 7},
    {name: '고구마 중간 크기', calories: 130, carbs: 30, protein: 2, fat: 0},
    {name: '브로콜리', calories: 50, carbs: 10, protein: 4, fat: 0},
    {name: '연어 스테이크', calories: 280, carbs: 0, protein: 34, fat: 15},
    {name: '현미밥 반공기', calories: 105, carbs: 22, protein: 2, fat: 1},
    {name: '두부 스테이크', calories: 150, carbs: 5, protein: 16, fat: 9},
    {name: '삶은 달걀 3개', calories: 210, carbs: 3, protein: 18, fat: 15},
    {name: '닭안심 구이', calories: 200, carbs: 0, protein: 40, fat: 4},
    {name: '시금치 나물', calories: 40, carbs: 6, protein: 3, fat: 1},
    {name: '양배추 샐러드', calories: 60, carbs: 12, protein: 2, fat: 1},
  ],
  snacks: [
    {name: '에너지바', calories: 180, carbs: 24, protein: 8, fat: 6},
    {name: '견과류 한줌', calories: 160, carbs: 6, protein: 6, fat: 14},
    {name: '사과', calories: 95, carbs: 25, protein: 0, fat: 0},
    {name: '프로틴 바', calories: 200, carbs: 20, protein: 20, fat: 7},
    {name: '요거트', calories: 100, carbs: 17, protein: 5, fat: 2},
  ],
};

const fetchMealRecommend = (excludedIngredients: string[] = []) => {
  return new Promise<any[]>((resolve) => {
    setTimeout(() => {
      const today = new Date();
      const meals = Array.from({length: 7}, (_, dayIndex) => {
        const date = new Date(today);
        date.setDate(date.getDate() + dayIndex);

        const getFilteredMeals = (mealType: string, count: number) => {
          const available = MEAL_DATABASE[mealType as keyof typeof MEAL_DATABASE].filter(
            (meal) =>
              !excludedIngredients.some((ingredient) =>
                meal.name.toLowerCase().includes(ingredient.toLowerCase()),
              ),
          );

          const shuffled = [...available].sort(() => Math.random() - 0.5);
          return shuffled.slice(0, count);
        };

        const breakfast = getFilteredMeals('breakfast', 2);
        const lunch = getFilteredMeals('lunch', 3);
        const dinner = getFilteredMeals('dinner', 3);

        const calculateNutrition = (meals: any[]) => {
          return meals.reduce(
            (acc, meal) => ({
              calories: acc.calories + meal.calories,
              carbs: acc.carbs + meal.carbs,
              protein: acc.protein + meal.protein,
              fat: acc.fat + meal.fat,
            }),
            {calories: 0, carbs: 0, protein: 0, fat: 0},
          );
        };

        const breakfastNutrition = calculateNutrition(breakfast);
        const lunchNutrition = calculateNutrition(lunch);
        const dinnerNutrition = calculateNutrition(dinner);

        const totalCalories =
          breakfastNutrition.calories + lunchNutrition.calories + dinnerNutrition.calories;
        const totalCarbs =
          breakfastNutrition.carbs + lunchNutrition.carbs + dinnerNutrition.carbs;
        const totalProtein =
          breakfastNutrition.protein + lunchNutrition.protein + dinnerNutrition.protein;
        const totalFat = breakfastNutrition.fat + lunchNutrition.fat + dinnerNutrition.fat;

        return {
          day: dayIndex + 1,
          date: `${date.getMonth() + 1}/${date.getDate()}`,
          fullDate: date.toLocaleDateString('ko-KR', {
            month: 'long',
            day: 'numeric',
            weekday: 'short',
          }),
          totalCalories: Math.round(totalCalories),
          carbs: Math.round(totalCarbs),
          protein: Math.round(totalProtein),
          fat: Math.round(totalFat),
          breakfast: {
            meals: breakfast,
            calories: Math.round(breakfastNutrition.calories),
            carbs: Math.round(breakfastNutrition.carbs),
            protein: Math.round(breakfastNutrition.protein),
            fat: Math.round(breakfastNutrition.fat),
          },
          lunch: {
            meals: lunch,
            calories: Math.round(lunchNutrition.calories),
            carbs: Math.round(lunchNutrition.carbs),
            protein: Math.round(lunchNutrition.protein),
            fat: Math.round(lunchNutrition.fat),
          },
          dinner: {
            meals: dinner,
            calories: Math.round(dinnerNutrition.calories),
            carbs: Math.round(dinnerNutrition.carbs),
            protein: Math.round(dinnerNutrition.protein),
            fat: Math.round(dinnerNutrition.fat),
          },
        };
      });

      resolve(meals);
    }, 800);
  });
};

const MealRecommendScreen = () => {
  const navigation = useNavigation();
  const [screen, setScreen] = useState<'welcome' | 'excludedIngredients' | 'meals'>('welcome');
  const [weeklyMeals, setWeeklyMeals] = useState<any[]>([]);
  const [currentDay, setCurrentDay] = useState(0);
  const [excludedIngredients, setExcludedIngredients] = useState<string[]>([]);
  const [newIngredient, setNewIngredient] = useState('');
  const [loading, setLoading] = useState(false);
  const [savedMeals, setSavedMeals] = useState<any[]>([]);

  useEffect(() => {
    const loadData = async () => {
      try {
        const stored = await AsyncStorage.getItem('excludedIngredients');
        if (stored) {
          setExcludedIngredients(JSON.parse(stored));
        }

        const storedMeals = await AsyncStorage.getItem('savedMealPlans');
        if (storedMeals) {
          setSavedMeals(JSON.parse(storedMeals));
        }
      } catch (error) {
        console.log('Failed to load data', error);
      }
    };
    loadData();
  }, []);

  useEffect(() => {
    const saveExcluded = async () => {
      try {
        await AsyncStorage.setItem('excludedIngredients', JSON.stringify(excludedIngredients));
      } catch (error) {
        console.log('Failed to save excluded ingredients', error);
      }
    };
    saveExcluded();
  }, [excludedIngredients]);

  const handleGetRecommendation = async () => {
    setLoading(true);
    try {
      const meals = await fetchMealRecommend(excludedIngredients);
      setWeeklyMeals(meals);
      setScreen('meals');
      setCurrentDay(0);
    } catch (error) {
      Alert.alert('오류', '식단을 불러오는데 실패했습니다.');
    } finally {
      setLoading(false);
    }
  };

  const handleAddExcludedIngredient = () => {
    if (
      newIngredient.trim() &&
      !excludedIngredients.includes(newIngredient.trim())
    ) {
      setExcludedIngredients([...excludedIngredients, newIngredient.trim()]);
      setNewIngredient('');
    }
  };

  const handleRemoveExcludedIngredient = (ingredient: string) => {
    setExcludedIngredients(excludedIngredients.filter((i) => i !== ingredient));
  };

  const handleDeleteMeal = (mealType: string, mealIndex: number) => {
    setWeeklyMeals((prev) => {
      const updated = [...prev];
      const dayMeals = updated[currentDay];
      const mealArray = [...dayMeals[mealType].meals];

      if (mealArray.length > 1) {
        const removedMeal = mealArray[mealIndex];
        mealArray.splice(mealIndex, 1);

        const newCalories = dayMeals[mealType].calories - removedMeal.calories;
        const newCarbs = dayMeals[mealType].carbs - removedMeal.carbs;
        const newProtein = dayMeals[mealType].protein - removedMeal.protein;
        const newFat = dayMeals[mealType].fat - removedMeal.fat;

        dayMeals[mealType] = {
          meals: mealArray,
          calories: newCalories,
          carbs: newCarbs,
          protein: newProtein,
          fat: newFat,
        };

        dayMeals.totalCalories = dayMeals.totalCalories - removedMeal.calories;
        dayMeals.carbs = dayMeals.carbs - removedMeal.carbs;
        dayMeals.protein = dayMeals.protein - removedMeal.protein;
        dayMeals.fat = dayMeals.fat - removedMeal.fat;

        updated[currentDay] = {...dayMeals};
      }

      return updated;
    });
  };

  const handleSaveMealPlan = async () => {
    const newSavedMeal = {
      id: Date.now(),
      date: new Date().toLocaleDateString('ko-KR'),
      meals: weeklyMeals,
    };

    const updated = [newSavedMeal, ...savedMeals].slice(0, 5);
    setSavedMeals(updated);
    try {
      await AsyncStorage.setItem('savedMealPlans', JSON.stringify(updated));
      Alert.alert('저장 완료', '식단이 저장되었습니다!', [
        {
          text: '확인',
          onPress: () => {
            navigation.navigate('MealRecommendHistory' as never);
          },
        },
      ]);
    } catch (error) {
      Alert.alert('오류', '식단 저장에 실패했습니다.');
    }
  };

  const handleDeleteSavedMeal = async (id: number) => {
    const updated = savedMeals.filter((meal) => meal.id !== id);
    setSavedMeals(updated);
    try {
      await AsyncStorage.setItem('savedMealPlans', JSON.stringify(updated));
    } catch (error) {
      console.log('Failed to delete saved meal', error);
    }
  };

  const currentMeal = weeklyMeals[currentDay];

  if (screen === 'welcome') {
    return (
      <SafeAreaView style={styles.container} edges={['top']}>
        <ScrollView style={styles.contentWrapper} contentContainerStyle={styles.contentContainer}>
          <View style={styles.welcomeHeader}>
            <Text style={styles.welcomeTitle}>안녕하세요 - 회원님!</Text>
            <Text style={styles.welcomeSubtitle}>
              회원님께 최적화된 식단을 추천해드릴게요!
            </Text>
          </View>

          <TouchableOpacity
            style={[styles.btn, styles.btnPrimary]}
            onPress={handleGetRecommendation}
            disabled={loading}>
            {loading ? (
              <ActivityIndicator color="#111827" />
            ) : (
              <Text style={styles.btnPrimaryText}>추천 식단 받기</Text>
            )}
          </TouchableOpacity>

          <TouchableOpacity
            style={[styles.btn, styles.btnSecondary]}
            onPress={() => setScreen('excludedIngredients')}>
            <Text style={styles.btnSecondaryText}>
              금지 식재료 관리{' '}
              {excludedIngredients.length > 0 && `(${excludedIngredients.length})`}
            </Text>
          </TouchableOpacity>

          {excludedIngredients.length > 0 && (
            <View style={styles.excludedPreview}>
              <Text style={styles.excludedPreviewLabel}>현재 금지 식재료:</Text>
              <View style={styles.tagList}>
                {excludedIngredients.map((ingredient, index) => (
                  <View key={index} style={[styles.tag, styles.tagExcluded]}>
                    <Text style={styles.tagText}>{ingredient}</Text>
                  </View>
                ))}
              </View>
            </View>
          )}

          {savedMeals.length > 0 && (
            <View style={styles.savedMealsSection}>
              <Text style={styles.savedMealsTitle}>저장된 식단 📋</Text>
              <View style={styles.savedMealsList}>
                {savedMeals.map((savedMeal) => (
                  <TouchableOpacity
                    key={savedMeal.id}
                    style={styles.savedMealItem}
                    onPress={() => navigation.navigate('MealRecommendHistory' as never)}>
                    <View style={styles.savedMealInfo}>
                      <Text style={styles.savedMealDate}>{savedMeal.date}</Text>
                      <Text style={styles.savedMealSummary}>
                        {savedMeal.meals?.[0]?.totalCalories || 0}kcal · 7일 식단
                      </Text>
                    </View>
                    <TouchableOpacity
                      onPress={() => handleDeleteSavedMeal(savedMeal.id)}
                      style={styles.btnIconSmall}>
                      <Text style={styles.iconTiny}>✕</Text>
                    </TouchableOpacity>
                  </TouchableOpacity>
                ))}
              </View>
            </View>
          )}
        </ScrollView>
      </SafeAreaView>
    );
  }

  if (screen === 'excludedIngredients') {
    return (
      <SafeAreaView style={styles.container} edges={['top']}>
        <View style={styles.header}>
          <TouchableOpacity
            style={styles.iconBtn}
            onPress={() => setScreen('welcome')}>
            <Text style={styles.icon}>←</Text>
          </TouchableOpacity>
          <View style={styles.headerTitleContainer}>
            <Text style={styles.headerTitle}>금지 식재료 관리</Text>
          </View>
          <View style={styles.iconPlaceholder} />
        </View>

        <ScrollView style={styles.excludedForm} contentContainerStyle={styles.excludedFormContent}>
          <View style={styles.inputGroup}>
            <TextInput
              style={styles.textInput}
              value={newIngredient}
              onChangeText={setNewIngredient}
              onSubmitEditing={handleAddExcludedIngredient}
              placeholder="알러지 식재료를 입력하세요"
              placeholderTextColor="#6b7280"
            />
            <TouchableOpacity
              style={[styles.iconBtn, styles.btnAdd]}
              onPress={handleAddExcludedIngredient}>
              <Text style={styles.iconAdd}>＋</Text>
            </TouchableOpacity>
          </View>

          <View style={styles.excludedList}>
            {excludedIngredients.map((ingredient, index) => (
              <View key={index} style={styles.excludedItem}>
                <Text style={styles.excludedItemText}>{ingredient}</Text>
                <TouchableOpacity
                  style={[styles.iconBtn, styles.btnDelete]}
                  onPress={() => handleRemoveExcludedIngredient(ingredient)}>
                  <Text style={styles.iconDelete}>✕</Text>
                </TouchableOpacity>
              </View>
            ))}

            {excludedIngredients.length === 0 && (
              <Text style={styles.emptyMessage}>등록된 금지 식재료가 없습니다</Text>
            )}
          </View>

          <TouchableOpacity
            style={[styles.btn, styles.btnPrimary, styles.btnComplete]}
            onPress={() => setScreen('welcome')}>
            <Text style={styles.btnPrimaryText}>완료</Text>
          </TouchableOpacity>
        </ScrollView>
      </SafeAreaView>
    );
  }

  return (
    <SafeAreaView style={styles.container} edges={['top']}>
      <ScrollView style={styles.contentWrapper} showsVerticalScrollIndicator={false}>
        <View style={styles.mealHeader}>
          <View style={styles.header}>
            <TouchableOpacity
              style={styles.iconBtn}
              onPress={() => setScreen('welcome')}>
              <Text style={styles.icon}>←</Text>
            </TouchableOpacity>
            <View style={styles.headerTitleContainer}>
              <Text style={styles.headerTitle}>7일 식단표</Text>
            </View>
            <View style={styles.iconPlaceholder} />
          </View>
          {currentMeal && <Text style={styles.mealDate}>{currentMeal.fullDate}</Text>}
        </View>

        <ScrollView
          horizontal
          showsHorizontalScrollIndicator={false}
          style={styles.dayTabs}
          contentContainerStyle={styles.dayTabsContent}>
          {weeklyMeals.map((_, index) => (
            <TouchableOpacity
              key={index}
              style={[styles.dayTab, currentDay === index && styles.dayTabActive]}
              onPress={() => setCurrentDay(index)}>
              <Text
                style={[styles.dayTabText, currentDay === index && styles.dayTabTextActive]}>
                {index + 1}일차
              </Text>
            </TouchableOpacity>
          ))}
        </ScrollView>

        {currentMeal && (
          <View style={styles.mealContent}>
            <View style={styles.nutritionCard}>
              <Text style={styles.caloriesTotal}>{currentMeal.totalCalories}Kcal</Text>
              <View style={styles.nutritionInfo}>
                <View style={styles.nutritionItem}>
                  <Text style={styles.nutritionLabel}>탄수화물</Text>
                  <Text style={styles.nutritionValue}>{currentMeal.carbs}g</Text>
                </View>
                <View style={styles.nutritionItem}>
                  <Text style={styles.nutritionLabel}>단백질</Text>
                  <Text style={styles.nutritionValue}>{currentMeal.protein}g</Text>
                </View>
                <View style={styles.nutritionItem}>
                  <Text style={styles.nutritionLabel}>지방</Text>
                  <Text style={styles.nutritionValue}>{currentMeal.fat}g</Text>
                </View>
              </View>
            </View>

            <View style={styles.mealCard}>
              <View style={styles.mealCardHeader}>
                <Text style={styles.mealTitle}>🌅 아침</Text>
                <View style={styles.mealCaloriesInfo}>
                  <Text style={styles.mealCalories}>
                    {currentMeal.breakfast.calories}{' '}
                    <Text style={styles.kcalUnit}>kcal</Text>
                  </Text>
                </View>
              </View>
              <View style={styles.mealNutritionMini}>
                <Text style={styles.mealNutritionText}>
                  탄 {currentMeal.breakfast.carbs}g
                </Text>
                <Text style={styles.mealNutritionText}>
                  단 {currentMeal.breakfast.protein}g
                </Text>
                <Text style={styles.mealNutritionText}>
                  지 {currentMeal.breakfast.fat}g
                </Text>
              </View>
              <View style={styles.mealTags}>
                {currentMeal.breakfast.meals.map((meal: any, index: number) => (
                  <View key={index} style={styles.mealTag}>
                    <Text style={styles.mealName}>{meal.name}</Text>
                    <Text style={styles.mealCal}>({meal.calories}kcal)</Text>
                    {currentMeal.breakfast.meals.length > 1 && (
                      <TouchableOpacity
                        style={styles.mealDeleteBtn}
                        onPress={() => handleDeleteMeal('breakfast', index)}>
                        <Text style={styles.iconSmall}>✕</Text>
                      </TouchableOpacity>
                    )}
                  </View>
                ))}
              </View>
            </View>

            <View style={styles.mealCard}>
              <View style={styles.mealCardHeader}>
                <Text style={styles.mealTitle}>☀️ 점심</Text>
                <View style={styles.mealCaloriesInfo}>
                  <Text style={styles.mealCalories}>
                    {currentMeal.lunch.calories} <Text style={styles.kcalUnit}>kcal</Text>
                  </Text>
                </View>
              </View>
              <View style={styles.mealNutritionMini}>
                <Text style={styles.mealNutritionText}>
                  탄 {currentMeal.lunch.carbs}g
                </Text>
                <Text style={styles.mealNutritionText}>
                  단 {currentMeal.lunch.protein}g
                </Text>
                <Text style={styles.mealNutritionText}>
                  지 {currentMeal.lunch.fat}g
                </Text>
              </View>
              <View style={styles.mealTags}>
                {currentMeal.lunch.meals.map((meal: any, index: number) => (
                  <View key={index} style={styles.mealTag}>
                    <Text style={styles.mealName}>{meal.name}</Text>
                    <Text style={styles.mealCal}>({meal.calories}kcal)</Text>
                    {currentMeal.lunch.meals.length > 1 && (
                      <TouchableOpacity
                        style={styles.mealDeleteBtn}
                        onPress={() => handleDeleteMeal('lunch', index)}>
                        <Text style={styles.iconSmall}>✕</Text>
                      </TouchableOpacity>
                    )}
                  </View>
                ))}
              </View>
            </View>

            <View style={styles.mealCard}>
              <View style={styles.mealCardHeader}>
                <Text style={styles.mealTitle}>🌙 저녁</Text>
                <View style={styles.mealCaloriesInfo}>
                  <Text style={styles.mealCalories}>
                    {currentMeal.dinner.calories} <Text style={styles.kcalUnit}>kcal</Text>
                  </Text>
                </View>
              </View>
              <View style={styles.mealNutritionMini}>
                <Text style={styles.mealNutritionText}>
                  탄 {currentMeal.dinner.carbs}g
                </Text>
                <Text style={styles.mealNutritionText}>
                  단 {currentMeal.dinner.protein}g
                </Text>
                <Text style={styles.mealNutritionText}>
                  지 {currentMeal.dinner.fat}g
                </Text>
              </View>
              <View style={styles.mealTags}>
                {currentMeal.dinner.meals.map((meal: any, index: number) => (
                  <View key={index} style={styles.mealTag}>
                    <Text style={styles.mealName}>{meal.name}</Text>
                    <Text style={styles.mealCal}>({meal.calories}kcal)</Text>
                    {currentMeal.dinner.meals.length > 1 && (
                      <TouchableOpacity
                        style={styles.mealDeleteBtn}
                        onPress={() => handleDeleteMeal('dinner', index)}>
                        <Text style={styles.iconSmall}>✕</Text>
                      </TouchableOpacity>
                    )}
                  </View>
                ))}
              </View>
            </View>

            <View style={styles.actionButtons}>
              <TouchableOpacity
                style={[styles.btn, styles.btnPrimary]}
                onPress={handleSaveMealPlan}>
                <Text style={styles.btnPrimaryText}>💾 식단 저장하기</Text>
              </TouchableOpacity>
              <TouchableOpacity
                style={[styles.btn, styles.btnSecondary]}
                onPress={handleGetRecommendation}
                disabled={loading}>
                {loading ? (
                  <ActivityIndicator color="#111827" />
                ) : (
                  <Text style={styles.btnSecondaryText}>🔄 식단 다시 추천받기</Text>
                )}
              </TouchableOpacity>
            </View>
          </View>
        )}

        <View style={styles.navigation}>
          <TouchableOpacity
            style={[styles.navBtn, currentDay === 0 && styles.navBtnDisabled]}
            onPress={() => setCurrentDay(Math.max(0, currentDay - 1))}
            disabled={currentDay === 0}>
            <Text style={styles.icon}>←</Text>
          </TouchableOpacity>
          <TouchableOpacity
            style={[
              styles.navBtn,
              currentDay === weeklyMeals.length - 1 && styles.navBtnDisabled,
            ]}
            onPress={() =>
              setCurrentDay(Math.min(weeklyMeals.length - 1, currentDay + 1))
            }
            disabled={currentDay === weeklyMeals.length - 1}>
            <Text style={styles.icon}>→</Text>
          </TouchableOpacity>
        </View>
      </ScrollView>
    </SafeAreaView>
  );
};

const styles = StyleSheet.create({
  container: {
    flex: 1,
    backgroundColor: '#111',
  },
  contentWrapper: {
    flex: 1,
  },
  contentContainer: {
    paddingHorizontal: 20,
    paddingTop: 60,
    paddingBottom: 40,
  },
  welcomeHeader: {
    alignItems: 'center',
    marginTop: 140,
    marginBottom: 40,
  },
  welcomeTitle: {
    fontSize: 24,
    fontWeight: 'bold',
    color: '#ffffff',
    marginBottom: 10,
    textAlign: 'center',
  },
  welcomeSubtitle: {
    fontSize: 16,
    color: '#ffffff',
    textAlign: 'center',
  },
  btn: {
    width: '90%',
    alignSelf: 'center',
    borderRadius: 10,
    marginBottom: 10,
    paddingVertical: 14,
    paddingHorizontal: 20,
    alignItems: 'center',
    justifyContent: 'center',
  },
  btnPrimary: {
    backgroundColor: '#e3ff7c',
  },
  btnSecondary: {
    backgroundColor: '#e3ff7c',
  },
  btnPrimaryText: {
    fontSize: 16,
    fontWeight: '600',
    color: '#111827',
  },
  btnSecondaryText: {
    fontSize: 16,
    fontWeight: '600',
    color: '#111827',
  },
  excludedPreview: {
    backgroundColor: '#464646',
    marginTop: 20,
    borderRadius: 10,
    padding: 16,
    width: '90%',
    alignSelf: 'center',
  },
  excludedPreviewLabel: {
    fontSize: 16,
    color: '#ffffff',
    marginBottom: 10,
  },
  tagList: {
    flexDirection: 'row',
    flexWrap: 'wrap',
    gap: 8,
  },
  tag: {
    paddingVertical: 5,
    paddingHorizontal: 10,
    borderRadius: 8,
  },
  tagExcluded: {
    backgroundColor: '#666',
  },
  tagText: {
    fontSize: 14,
    color: '#ffffff',
  },
  savedMealsSection: {
    marginTop: 30,
    width: '90%',
    alignSelf: 'center',
  },
  savedMealsTitle: {
    fontSize: 18,
    fontWeight: 'bold',
    color: '#ffffff',
    marginBottom: 16,
  },
  savedMealsList: {
    gap: 10,
  },
  savedMealItem: {
    flexDirection: 'row',
    backgroundColor: '#464646',
    borderRadius: 10,
    padding: 12,
    justifyContent: 'space-between',
    alignItems: 'center',
  },
  savedMealInfo: {
    flex: 1,
  },
  savedMealDate: {
    fontSize: 12,
    fontWeight: '600',
    color: '#ffffff',
    marginBottom: 4,
  },
  savedMealSummary: {
    fontSize: 14,
    color: '#9ca3af',
  },
  btnIconSmall: {
    backgroundColor: '#464646',
    padding: 8,
    borderRadius: 6,
  },
  iconTiny: {
    fontSize: 16,
    color: '#ffffff',
  },
  header: {
    flexDirection: 'row',
    alignItems: 'center',
    justifyContent: 'space-between',
    paddingHorizontal: 20,
    paddingTop: 16,
    paddingBottom: 16,
    position: 'relative',
  },
  headerTitleContainer: {
    position: 'absolute',
    left: 0,
    right: 0,
    alignItems: 'center',
    justifyContent: 'center',
    pointerEvents: 'none',
  },
  headerTitle: {
    fontSize: 26,
    fontWeight: 'bold',
    color: '#ffffff',
  },
  iconBtn: {
    backgroundColor: 'transparent',
    padding: 8,
  },
  icon: {
    fontSize: 20,
    color: '#ffffff',
  },
  iconPlaceholder: {
    width: 40,
  },
  excludedForm: {
    flex: 1,
  },
  excludedFormContent: {
    paddingHorizontal: 20,
    paddingTop: 30,
    paddingBottom: 40,
  },
  inputGroup: {
    flexDirection: 'row',
    gap: 10,
    marginBottom: 30,
  },
  textInput: {
    flex: 1,
    height: 56,
    backgroundColor: '#1f2937',
    paddingHorizontal: 20,
    color: '#ffffff',
    borderWidth: 2,
    borderColor: '#374151',
    borderRadius: 12,
    fontSize: 15,
  },
  btnAdd: {
    width: 56,
    height: 56,
    backgroundColor: '#e3ff7c',
    borderRadius: 12,
    alignItems: 'center',
    justifyContent: 'center',
  },
  iconAdd: {
    fontSize: 24,
    fontWeight: '600',
    color: '#111827',
  },
  excludedList: {
    gap: 12,
    marginBottom: 30,
    minHeight: 200,
  },
  excludedItem: {
    backgroundColor: '#1f2937',
    paddingVertical: 16,
    paddingHorizontal: 20,
    borderRadius: 12,
    flexDirection: 'row',
    alignItems: 'center',
    justifyContent: 'space-between',
    borderWidth: 1,
    borderColor: '#374151',
  },
  excludedItemText: {
    fontSize: 16,
    fontWeight: '500',
    color: '#ffffff',
    flex: 1,
  },
  btnDelete: {
    backgroundColor: 'transparent',
    padding: 8,
  },
  iconDelete: {
    fontSize: 20,
    color: '#ef4444',
  },
  emptyMessage: {
    textAlign: 'center',
    color: '#6b7280',
    fontSize: 15,
    paddingVertical: 60,
    paddingHorizontal: 20,
  },
  btnComplete: {
    width: '100%',
    height: 56,
    marginTop: 20,
  },
  mealHeader: {
    paddingHorizontal: 20,
    paddingTop: 10,
    paddingBottom: 10,
  },
  mealDate: {
    fontSize: 14,
    color: '#ffffff',
    textAlign: 'center',
    marginTop: 8,
  },
  dayTabs: {
    marginVertical: 10,
  },
  dayTabsContent: {
    paddingHorizontal: 10,
    gap: 10,
  },
  dayTab: {
    borderRadius: 20,
    backgroundColor: '#464646',
    paddingVertical: 8,
    paddingHorizontal: 16,
    marginLeft: 2,
  },
  dayTabActive: {
    backgroundColor: '#e3ff7c',
  },
  dayTabText: {
    fontSize: 13,
    color: '#ffffff',
  },
  dayTabTextActive: {
    color: '#111827',
    fontWeight: '600',
  },
  mealContent: {
    paddingHorizontal: 10,
    paddingBottom: 20,
    gap: 10,
  },
  nutritionCard: {
    marginLeft: 9,
    width: '90%',
    backgroundColor: '#1f2937',
    padding: 10,
    borderRadius: 10,
  },
  caloriesTotal: {
    marginTop: 5,
    fontWeight: 'bold',
    color: '#ffffff',
    fontSize: 36,
    marginBottom: 10,
  },
  nutritionInfo: {
    flexDirection: 'row',
    justifyContent: 'space-between',
    gap: 10,
  },
  nutritionItem: {
    flex: 1,
    padding: 10,
    backgroundColor: 'rgba(17, 24, 39, 0.5)',
    borderRadius: 8,
    alignItems: 'center',
  },
  nutritionLabel: {
    color: '#ffffff',
    fontSize: 15,
    marginBottom: 4,
  },
  nutritionValue: {
    fontWeight: '600',
    fontSize: 14,
    color: '#e3ff7c',
  },
  mealCard: {
    width: '90%',
    marginLeft: 10,
    backgroundColor: '#464646',
    padding: 10,
    borderRadius: 10,
  },
  mealCardHeader: {
    flexDirection: 'row',
    justifyContent: 'space-between',
    alignItems: 'center',
    marginBottom: 10,
  },
  mealTitle: {
    fontWeight: 'bold',
    fontSize: 16,
    color: '#ffffff',
  },
  mealCaloriesInfo: {
    alignItems: 'flex-end',
  },
  mealCalories: {
    fontWeight: 'bold',
    fontSize: 16,
    color: '#ffffff',
  },
  kcalUnit: {
    color: '#9ca3af',
  },
  mealNutritionMini: {
    flexDirection: 'row',
    gap: 10,
    marginBottom: 5,
    paddingVertical: 5,
  },
  mealNutritionText: {
    fontSize: 14,
    color: '#ffffff',
    fontWeight: '500',
  },
  mealTags: {
    flexDirection: 'row',
    flexWrap: 'wrap',
    gap: 10,
  },
  mealTag: {
    backgroundColor: '#e3ff7c',
    flexDirection: 'row',
    alignItems: 'center',
    padding: 10,
    borderRadius: 15,
    gap: 5,
  },
  mealName: {
    color: '#000000',
    fontSize: 14,
  },
  mealCal: {
    color: '#000000',
    fontSize: 12,
  },
  mealDeleteBtn: {
    backgroundColor: 'transparent',
    padding: 4,
  },
  iconSmall: {
    fontSize: 14,
    color: '#000000',
  },
  actionButtons: {
    alignItems: 'center',
    gap: 10,
    marginTop: 10,
  },
  navigation: {
    flexDirection: 'row',
    justifyContent: 'space-between',
    marginTop: 15,
    marginHorizontal: 10,
    marginBottom: 20,
  },
  navBtn: {
    backgroundColor: '#464646',
    paddingVertical: 10,
    paddingHorizontal: 20,
    borderRadius: 10,
    alignItems: 'center',
    justifyContent: 'center',
  },
  navBtnDisabled: {
    opacity: 0.3,
  },
});

export default MealRecommendScreen;
