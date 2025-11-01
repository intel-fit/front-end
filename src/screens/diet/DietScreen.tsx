import React, {useState} from 'react';
import {
  View,
  Text,
  TouchableOpacity,
  StyleSheet,
  SafeAreaView,
  ScrollView,
} from 'react-native';
import { Ionicons as Icon } from '@expo/vector-icons';
import {colors} from '../theme/colors';

const DietScreen = ({navigation}: any) => {
  const [currentMonth, setCurrentMonth] = useState('10월');

  const nutritionData = {
    total: 384,
    target: 1157,
    percentage: 30,
    carbs: {current: 51, target: 198},
    protein: {current: 15, target: 132},
    fat: {current: 15, target: 49},
  };

  const meals = [
    {
      type: '아침',
      time: '8:38 am',
      calories: 52,
      foods: [
        {name: '요거트', color: '#e3ff7c'},
        {name: '바나나', color: '#e3ff7c'},
      ],
    },
    {
      type: '점심',
      time: '추천 식단',
      calories: 70,
      foods: [
        {name: '그릭 요거트', color: '#7e7e7b'},
        {name: '에너지바', color: '#7e7e7b'},
      ],
    },
    {
      type: '야식',
      time: '추천 식단',
      calories: 239,
      foods: [
        {name: '닭가슴살 300g', color: '#7e7e7b'},
        {name: '단백질 쉐이크', color: '#7e7e7b'},
        {name: '구운 계란 2개', color: '#7e7e7b'},
      ],
    },
  ];

  // StatsScreen 내부에서 사용될 때는 SafeAreaView 제거
  const ContainerComponent = View;
  
  return (
    <ContainerComponent style={styles.container}>
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

      <ScrollView style={styles.content}>
        {/* 7일 캘린더 */}
        <View style={styles.weekCalendar}>
          <View style={styles.calendarGrid}>
            {[1, 2, 3, 4, 5, 6, 7].map(day => (
              <View key={day} style={styles.calendarItem}>
                <Text style={styles.calendarNumber}>15</Text>
                <Text style={styles.calendarCalories}>388k</Text>
                <Text style={styles.calendarPercentage}>97%</Text>
              </View>
            ))}
          </View>
        </View>

        {/* 칼로리 섹션 */}
        <View style={styles.calorieSection}>
          <View style={styles.calorieHeader}>
            <View style={styles.calorieMain}>
              <Text style={styles.calorieNumber}>{nutritionData.total}</Text>
              <Text style={styles.calorieUnit}>
                {' '}
                / {nutritionData.target}kcal
              </Text>
            </View>
            <Text style={styles.caloriePercentage}>
              {nutritionData.percentage}%
            </Text>
          </View>

          <View style={styles.progressBarContainer}>
            <View style={styles.progressBar}>
              <View
                style={[
                  styles.progressFill,
                  {width: `${nutritionData.percentage}%`},
                ]}
              />
            </View>
          </View>

          <View style={styles.nutritionBars}>
            {/* 탄수화물 */}
            <View style={styles.nutritionItem}>
              <Text style={styles.nutritionLabel}>탄수화물</Text>
              <Text style={styles.nutritionValue}>
                {nutritionData.carbs.current} / {nutritionData.carbs.target}g
              </Text>
              <View style={styles.nutritionProgress}>
                <View
                  style={[
                    styles.nutritionProgressFill,
                    {
                      width: `${
                        (nutritionData.carbs.current /
                          nutritionData.carbs.target) *
                        100
                      }%`,
                    },
                  ]}
                />
              </View>
            </View>
            {/* 단백질 */}
            <View style={styles.nutritionItem}>
              <Text style={styles.nutritionLabel}>단백질</Text>
              <Text style={styles.nutritionValue}>
                {nutritionData.protein.current} /{' '}
                {nutritionData.protein.target}g
              </Text>
              <View style={styles.nutritionProgress}>
                <View
                  style={[
                    styles.nutritionProgressFill,
                    {
                      width: `${
                        (nutritionData.protein.current /
                          nutritionData.protein.target) *
                        100
                      }%`,
                    },
                  ]}
                />
              </View>
            </View>
            {/* 지방 */}
            <View style={styles.nutritionItem}>
              <Text style={styles.nutritionLabel}>지방</Text>
              <Text style={styles.nutritionValue}>
                {nutritionData.fat.current} / {nutritionData.fat.target}g
              </Text>
              <View style={styles.nutritionProgress}>
                <View
                  style={[
                    styles.nutritionProgressFill,
                    {
                      width: `${
                        (nutritionData.fat.current / nutritionData.fat.target) *
                        100
                      }%`,
                    },
                  ]}
                />
              </View>
            </View>
          </View>
        </View>

        {/* 식사별 섹션 */}
        <View style={styles.mealsContainer}>
          {meals.map((meal, index) => (
            <View key={index} style={styles.mealSection}>
              <View style={styles.mealHeader}>
                <View style={styles.mealLeft}>
                  <Text style={styles.mealTitle}>{meal.type}</Text>
                  <Text style={styles.mealTime}>{meal.time}</Text>
                </View>
                <Text style={styles.mealCalories}>{meal.calories} kcal</Text>
              </View>
              <View style={styles.foodTags}>
                {meal.foods.map((food, foodIndex) => (
                  <View
                    key={foodIndex}
                    style={[
                      styles.foodTag,
                      {backgroundColor: food.color},
                    ]}>
                    <Text style={styles.foodTagText}>{food.name}</Text>
                  </View>
                ))}
              </View>
            </View>
          ))}
        </View>

        {/* 식단 추가하기 버튼 */}
        <View style={styles.addMealSection}>
          <TouchableOpacity
            style={styles.addMealButton}
            onPress={() => navigation.navigate('MealAdd')}>
            <Text style={styles.addMealButtonText}>식단 추가하기</Text>
          </TouchableOpacity>
        </View>
      </ScrollView>
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
    marginBottom: 8,
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
    marginRight: 10,
  },
  content: {
    flex: 1,
    padding: 20,
  },
  weekCalendar: {
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
    justifyContent: 'center',
    gap: 8,
  },
  calendarNumber: {
    fontSize: 16,
    fontWeight: '700',
    color: '#738700',
    textAlign: 'center',
    height: 19,
    lineHeight: 19.36,
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
  calorieSection: {
    backgroundColor: colors.cardBackground,
    borderRadius: 20,
    padding: 20,
    marginBottom: 20,
  },
  calorieHeader: {
    flexDirection: 'row',
    justifyContent: 'space-between',
    alignItems: 'center',
    marginBottom: 20,
  },
  calorieMain: {
    flexDirection: 'row',
    alignItems: 'baseline',
    gap: 8,
  },
  calorieNumber: {
    fontSize: 20,
    fontWeight: '700',
    color: colors.text,
    lineHeight: 24,
  },
  calorieUnit: {
    fontSize: 12,
    fontWeight: '400',
    color: colors.text,
  },
  caloriePercentage: {
    fontSize: 16,
    fontWeight: '700',
    color: colors.text,
  },
  progressBarContainer: {
    marginBottom: 20,
  },
  progressBar: {
    height: 40,
    backgroundColor: 'rgba(255, 255, 255, 0.1)',
    borderRadius: 10,
    overflow: 'hidden',
  },
  progressFill: {
    height: '100%',
    backgroundColor: '#e3ff7c',
    borderRadius: 10,
  },
  nutritionBars: {
    flexDirection: 'row',
    gap: 20,
    width: '100%',
  },
  nutritionItem: {
    flex: 1,
    padding: 10,
    borderRadius: 5,
    minHeight: 50,
    justifyContent: 'center',
    gap: 8,
  },
  nutritionLabel: {
    fontSize: 10,
    fontWeight: '700',
    color: colors.text,
    marginBottom: 5,
    lineHeight: 12,
  },
  nutritionValue: {
    fontSize: 10,
    fontWeight: '400',
    color: colors.text,
    lineHeight: 12,
  },
  nutritionProgress: {
    width: '100%',
    height: 4,
    backgroundColor: 'rgba(255, 255, 255, 0.2)',
    borderRadius: 2,
    overflow: 'hidden',
    marginTop: 5,
  },
  nutritionProgressFill: {
    height: '100%',
    backgroundColor: '#e3ff7c',
    borderRadius: 2,
  },
  mealsContainer: {
    gap: 20,
    marginBottom: 20,
  },
  mealSection: {
    backgroundColor: colors.cardBackground,
    borderRadius: 20,
    padding: 20,
  },
  mealHeader: {
    flexDirection: 'row',
    justifyContent: 'space-between',
    alignItems: 'flex-start',
    marginBottom: 15,
  },
  mealLeft: {
    flexDirection: 'column',
    gap: 5,
  },
  mealTitle: {
    fontSize: 20,
    fontWeight: '700',
    color: colors.text,
  },
  mealTime: {
    fontSize: 15,
    fontWeight: '400',
    color: colors.text,
    textAlign: 'left',
  },
  mealCalories: {
    fontSize: 20,
    fontWeight: '700',
    color: colors.text,
    textAlign: 'center',
    lineHeight: 24,
  },
  foodTags: {
    flexDirection: 'row',
    flexWrap: 'wrap',
    gap: 10,
  },
  foodTag: {
    paddingVertical: 8,
    paddingHorizontal: 16,
    borderRadius: 10,
  },
  foodTagText: {
    fontSize: 15,
    fontWeight: '700',
    color: '#000000',
  },
  addMealSection: {
    justifyContent: 'center',
    alignItems: 'center',
    marginTop: 20,
  },
  addMealButton: {
    backgroundColor: colors.cardBackground,
    borderRadius: 10,
    paddingVertical: 20,
    paddingHorizontal: 40,
    width: '100%',
    maxWidth: 362,
    alignItems: 'center',
  },
  addMealButtonText: {
    color: colors.text,
    fontSize: 16,
    fontWeight: '700',
  },
});

export default DietScreen;

