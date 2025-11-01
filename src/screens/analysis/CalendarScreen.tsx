import React, {useState} from 'react';
import {
  View,
  Text,
  TouchableOpacity,
  StyleSheet,
  ScrollView,
} from 'react-native';
import {SafeAreaView} from 'react-native-safe-area-context';
import { Ionicons as Icon } from '@expo/vector-icons';
import {colors} from '../theme/colors';

const CalendarScreen = ({navigation}: any) => {
  const [currentMonth] = useState('10월');
  const [showFullCalendar, setShowFullCalendar] = useState(true);

  // 4주간 운동 데이터
  const weekData = Array(4)
    .fill(null)
    .map(() =>
      Array(7)
        .fill(null)
        .map(() => ({
          count: 15,
          calories: '388k',
          percentage: '97%',
        })),
    );

  // 식단 데이터
  const meals = [
    {
      time: '아침 식사',
      title: '오늘 첫 끼^^',
      timestamp: '8:38 am',
      calories: 52,
      foods: [
        {name: '요거트', completed: true},
        {name: '바나나', completed: true},
      ],
    },
    {
      time: '점심',
      title: '',
      timestamp: '추천 식단',
      calories: 70,
      foods: [
        {name: '그릭 요거트', completed: false},
        {name: '에너지바', completed: false},
      ],
    },
    {
      time: '야식',
      title: '',
      timestamp: '추천 식단',
      calories: 239,
      foods: [
        {name: '닭가슴살 300g', completed: false},
        {name: '단백질 쉐이크', completed: false},
        {name: '구운 계란 2개', completed: false},
      ],
    },
  ];

  // 운동 데이터
  const exercises = [
    {
      name: '펙 덱 플라이',
      time: '9:00 AM',
      details: '20kg 15회 3세트',
    },
    {
      name: '리버스 펙 덱 플라이',
      time: '9:04 AM',
      details: '20kg 15회 3세트',
    },
  ];

  return (
    <SafeAreaView style={styles.container}>
      {/* 헤더 */}
      <View style={styles.header}>
        <TouchableOpacity onPress={() => navigation.goBack()}>
          <Icon name="chevron-back" size={28} color={colors.text} />
        </TouchableOpacity>
        <Text style={styles.headerTitle}>기록 달력</Text>
        <TouchableOpacity onPress={() => setShowFullCalendar(!showFullCalendar)}>
          <Icon name="menu" size={28} color={colors.text} />
        </TouchableOpacity>
      </View>

      <ScrollView style={styles.content} contentContainerStyle={styles.contentContainer}>
        {/* 월 네비게이션 */}
        <View style={styles.monthNavigation}>
          <View style={styles.monthNavLeft}>
            <TouchableOpacity style={styles.navBtn}>
              <Icon name="chevron-back" size={18} color="#ffffff" />
            </TouchableOpacity>
            <Text style={styles.monthText}>{currentMonth}</Text>
            <TouchableOpacity style={styles.navBtn}>
              <Icon name="chevron-forward" size={18} color="#ffffff" />
            </TouchableOpacity>
          </View>
          <TouchableOpacity
            style={styles.menuBtn}
            onPress={() => setShowFullCalendar(!showFullCalendar)}>
            <Icon name="menu" size={20} color="#ffffff" />
          </TouchableOpacity>
        </View>

        {/* 달력 그리드 컨테이너 */}
        <View style={styles.calendarContainer}>
          {/* 요일 헤더 */}
          <View style={styles.weekdayHeader}>
            {['일', '일', '일', '일', '일', '일', '일'].map((day, index) => (
              <Text key={index} style={styles.weekday}>
                {day}
              </Text>
            ))}
          </View>

          {/* 1주 또는 4주간 데이터 */}
          {weekData.slice(0, showFullCalendar ? 4 : 1).map((week, weekIndex) => (
            <View key={weekIndex} style={styles.weekRow}>
              {week.map((day, dayIndex) => (
                <View key={dayIndex} style={styles.dayItem}>
                  <Text style={styles.dayCount}>{day.count}</Text>
                  <Text style={styles.dayCalories}>{day.calories}</Text>
                  <Text style={styles.dayPercentage}>{day.percentage}</Text>
                </View>
              ))}
            </View>
          ))}
        </View>

        {/* 운동 섹션 (칼로리 진행률) */}
        <View style={styles.exerciseSection}>
          <View style={styles.calorieHeader}>
            <View style={styles.calorieLeft}>
              <Text style={styles.calorieCurrent}>384</Text>
              <Text style={styles.calorieGoal}>/ 1,157kcal</Text>
            </View>
            <Text style={styles.caloriePercentage}>30%</Text>
          </View>
          <View style={styles.calorieProgressBar}>
            <View style={[styles.calorieProgressFill, {width: '30%'}]} />
          </View>
        </View>

        {/* 식단 내역 */}
        <View style={styles.sectionHeader}>
          <Text style={styles.sectionTitle}>식단 내역</Text>
          <Text style={styles.moreLink}>더보기</Text>
        </View>
        <View style={styles.mealsSection}>
          {meals.map((meal, index) => (
            <View key={index} style={styles.mealCard}>
              <View style={styles.mealHeader}>
                <View style={styles.mealInfo}>
                  {meal.title ? (
                    <Text style={styles.mealTitle}>{meal.title}</Text>
                  ) : (
                    <Text style={styles.mealTitle}>{meal.time}</Text>
                  )}
                  <Text style={styles.mealTime}>{meal.timestamp}</Text>
                </View>
                <Text style={styles.mealCalories}>
                  {meal.calories}
                  {'\n'}kcal
                </Text>
              </View>
              <View style={styles.foodTags}>
                {meal.foods.map((food, foodIndex) => (
                  <View
                    key={foodIndex}
                    style={[
                      styles.foodTag,
                      food.completed ? styles.foodTagCompleted : styles.foodTagRecommended,
                    ]}>
                    <Text style={styles.foodTagText}>{food.name}</Text>
                  </View>
                ))}
              </View>
            </View>
          ))}
        </View>

        {/* 운동 내역 */}
        <View style={styles.sectionHeader}>
          <Text style={styles.sectionTitle}>운동 내역</Text>
          <Text style={styles.moreLink}>더보기</Text>
        </View>
        <View style={styles.exerciseList}>
          {exercises.map((exercise, index) => (
            <View key={index} style={styles.exerciseCard}>
              <View style={styles.exerciseInfo}>
                <Text style={styles.exerciseName}>{exercise.name}</Text>
                <Text style={styles.exerciseDetails}>{exercise.details}</Text>
              </View>
              <Text style={styles.exerciseTime}>{exercise.time}</Text>
            </View>
          ))}
        </View>
      </ScrollView>
    </SafeAreaView>
  );
};

const styles = StyleSheet.create({
  container: {
    flex: 1,
    backgroundColor: '#252525',
  },
  header: {
    flexDirection: 'row',
    justifyContent: 'space-between',
    alignItems: 'center',
    backgroundColor: '#252525',
    paddingVertical: 12,
    paddingHorizontal: 16,
    borderBottomWidth: 1,
    borderBottomColor: '#333',
  },
  headerTitle: {
    fontSize: 20,
    fontWeight: 'bold',
    color: '#ffffff',
  },
  content: {
    flex: 1,
  },
  contentContainer: {
    padding: 20,
  },
  monthNavigation: {
    flexDirection: 'row',
    alignItems: 'center',
    justifyContent: 'space-between',
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
    fontWeight: '800',
    fontSize: 18,
    color: '#ffffff',
    lineHeight: 22,
  },
  menuBtn: {
    backgroundColor: 'transparent',
    padding: 0,
    marginRight: 10,
  },
  calendarContainer: {
    backgroundColor: 'transparent',
    marginBottom: 20,
  },
  weekdayHeader: {
    flexDirection: 'row',
    marginBottom: 0,
    paddingBottom: 8,
  },
  weekday: {
    flex: 1,
    textAlign: 'center',
    fontSize: 12,
    fontWeight: '400',
    color: '#f2f3ee',
    lineHeight: 14.52,
  },
  weekRow: {
    flexDirection: 'row',
    height: 79,
  },
  dayItem: {
    flex: 1,
    alignItems: 'center',
    justifyContent: 'center',
    gap: 8,
  },
  dayCount: {
    fontWeight: '700',
    fontSize: 16,
    color: '#e3ff7c',
    textAlign: 'center',
    lineHeight: 19.36,
    height: 19,
  },
  dayCalories: {
    fontWeight: '400',
    fontSize: 12,
    color: '#f2f3ee',
    textAlign: 'center',
    lineHeight: 14.52,
    height: 15,
  },
  dayPercentage: {
    fontWeight: '400',
    fontSize: 12,
    color: '#f2f3ee',
    textAlign: 'center',
    lineHeight: 14.52,
    height: 15,
  },
  exerciseSection: {
    backgroundColor: '#393a38',
    borderRadius: 20,
    padding: 20,
    marginBottom: 20,
  },
  calorieHeader: {
    flexDirection: 'row',
    justifyContent: 'space-between',
    alignItems: 'center',
    marginBottom: 15,
  },
  calorieLeft: {
    flexDirection: 'row',
    alignItems: 'baseline',
    gap: 4,
  },
  calorieCurrent: {
    fontWeight: '700',
    fontSize: 20,
    color: '#ffffff',
  },
  calorieGoal: {
    fontWeight: '400',
    fontSize: 12,
    color: '#ffffff',
  },
  caloriePercentage: {
    fontWeight: '700',
    fontSize: 16,
    color: '#ffffff',
  },
  calorieProgressBar: {
    width: '100%',
    height: 40,
    backgroundColor: '#555',
    borderRadius: 10,
    overflow: 'hidden',
  },
  calorieProgressFill: {
    height: '100%',
    backgroundColor: '#e3ff7c',
    borderRadius: 10,
  },
  sectionHeader: {
    flexDirection: 'row',
    justifyContent: 'space-between',
    alignItems: 'center',
    marginBottom: 15,
  },
  sectionTitle: {
    fontWeight: '800',
    fontStyle: 'italic',
    fontSize: 16,
    color: '#ffffff',
  },
  moreLink: {
    fontWeight: '400',
    fontSize: 14,
    color: '#ffffff',
    marginRight: 20,
  },
  mealsSection: {
    gap: 10,
    marginBottom: 30,
  },
  mealCard: {
    backgroundColor: '#393a38',
    borderRadius: 20,
    paddingVertical: 17,
    paddingHorizontal: 20,
  },
  mealHeader: {
    flexDirection: 'row',
    justifyContent: 'space-between',
    alignItems: 'flex-start',
    marginBottom: 13,
  },
  mealInfo: {
    gap: 5,
  },
  mealTitle: {
    fontWeight: '700',
    fontSize: 20,
    color: '#ffffff',
  },
  mealTime: {
    fontWeight: '400',
    fontSize: 15,
    color: '#ffffff',
  },
  mealCalories: {
    fontWeight: '700',
    fontSize: 20,
    color: '#ffffff',
    textAlign: 'center',
    lineHeight: 1.2,
  },
  foodTags: {
    flexDirection: 'row',
    flexWrap: 'wrap',
    gap: 8,
  },
  foodTag: {
    paddingVertical: 4,
    paddingHorizontal: 12,
    borderRadius: 10,
  },
  foodTagCompleted: {
    backgroundColor: '#e3ff7c',
  },
  foodTagRecommended: {
    backgroundColor: '#7e7e7b',
  },
  foodTagText: {
    fontWeight: '700',
    fontSize: 15,
    color: '#000000',
    textAlign: 'center',
  },
  exerciseList: {
    gap: 10,
  },
  exerciseCard: {
    backgroundColor: '#393a38',
    borderRadius: 20,
    paddingVertical: 17,
    paddingHorizontal: 20,
    flexDirection: 'row',
    justifyContent: 'space-between',
    alignItems: 'center',
  },
  exerciseInfo: {
    gap: 5,
  },
  exerciseName: {
    fontWeight: '600',
    fontSize: 16,
    color: '#ffffff',
  },
  exerciseDetails: {
    fontWeight: '600',
    fontSize: 12,
    color: '#ffffff',
  },
  exerciseTime: {
    fontWeight: '600',
    fontSize: 12,
    color: '#ffffff',
  },
});

export default CalendarScreen;

