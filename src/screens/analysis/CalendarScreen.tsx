import React, {useState, useEffect} from 'react';
import {
  View,
  Text,
  TouchableOpacity,
  StyleSheet,
  ScrollView,
} from 'react-native';
import {SafeAreaView} from 'react-native-safe-area-context';
import { Ionicons as Icon } from '@expo/vector-icons';
import {colors} from '../../theme/colors';
import {useDate} from '../../contexts/DateContext';
import {fetchWeeklyProgress, fetchMonthlyProgress} from '../../utils/exerciseApi';
import {mealAPI} from '../../services';
import type {DailyProgressWeekItem, NutritionGoal, DailyMealsResponse} from '../../types';

const CalendarScreen = ({navigation}: any) => {
  const [monthBase, setMonthBase] = useState(new Date());
  const [showMonthView, setShowMonthView] = useState(true);
  const {selectedDate, setSelectedDate} = useDate();
  const [weeklyProgress, setWeeklyProgress] = useState<DailyProgressWeekItem[]>([]);
  const [monthlyProgress, setMonthlyProgress] = useState<DailyProgressWeekItem[]>([]);
  const [nutritionGoal, setNutritionGoal] = useState<NutritionGoal | null>(null);
  const [dailyMealsData, setDailyMealsData] = useState<DailyMealsResponse | null>(null);

  // 날짜 형식 변환 함수 (Date -> yyyy-MM-dd)
  const formatDateToString = (date: Date): string => {
    const year = date.getFullYear();
    const month = String(date.getMonth() + 1).padStart(2, '0');
    const day = String(date.getDate()).padStart(2, '0');
    return `${year}-${month}-${day}`;
  };

  // 주간 데이터 로드
  const loadWeeklyProgress = async () => {
    try {
      const data = await fetchWeeklyProgress();
      setWeeklyProgress(Array.isArray(data) ? data : []);
    } catch (e) {
      console.error('주간 진행률 로드 실패:', e);
      setWeeklyProgress([]);
    }
  };

  // 월별 데이터 로드
  const loadMonthlyProgress = async (year: number, month: number) => {
    try {
      const yearMonth = `${year}-${String(month + 1).padStart(2, '0')}`;
      const data = await fetchMonthlyProgress(yearMonth);
      setMonthlyProgress(Array.isArray(data) ? data : []);
    } catch (e) {
      console.error('월별 진행률 로드 실패:', e);
      setMonthlyProgress([]);
    }
  };

  // 특정 날짜의 진행률 데이터 가져오기
  const getDayProgress = (date: Date): DailyProgressWeekItem | undefined => {
    const dateStr = formatDateToString(date);
    const found = monthlyProgress.find(item => item.date === dateStr) 
      || weeklyProgress.find(item => item.date === dateStr);
    return found;
  };

  // 초기 데이터 로드
  useEffect(() => {
    loadWeeklyProgress();
  }, []);

  // monthBase가 변경될 때 월별 데이터 로드
  useEffect(() => {
    loadMonthlyProgress(monthBase.getFullYear(), monthBase.getMonth());
  }, [monthBase]);

  // 영양 목표 로드
  const loadNutritionGoal = async () => {
    try {
      const data = await mealAPI.getNutritionGoal();
      setNutritionGoal(data);
    } catch (e: any) {
      console.error('영양 목표 로드 실패:', e);
      if (e?.status !== 401) {
        setTimeout(async () => {
          try {
            const retryData = await mealAPI.getNutritionGoal();
            setNutritionGoal(retryData);
          } catch (retryError) {
            console.error('영양 목표 재시도 실패:', retryError);
          }
        }, 500);
      }
    }
  };

  // 오늘 날짜의 식단 데이터 조회
  const fetchTodayMeals = async () => {
    try {
      const today = new Date();
      const dateString = formatDateToString(today);
      const data = await mealAPI.getDailyMeals(dateString);
      setDailyMealsData(data);
    } catch (error: any) {
      console.error('일별 식단 조회 실패:', error);
      setDailyMealsData(null);
    }
  };

  // 초기 데이터 로드
  useEffect(() => {
    loadNutritionGoal();
    fetchTodayMeals();
  }, []);

  // 화면 포커스 시 데이터 새로고침
  useEffect(() => {
    const unsubscribe = navigation.addListener('focus', () => {
      loadNutritionGoal();
      fetchTodayMeals();
    });
    return unsubscribe;
  }, [navigation]);

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
        <TouchableOpacity onPress={() => setShowMonthView(!showMonthView)}>
          <Icon name="menu" size={28} color={colors.text} />
        </TouchableOpacity>
      </View>

      <ScrollView style={styles.content} contentContainerStyle={styles.contentContainer}>
        {/* 월 네비게이션 */}
        <View style={styles.monthNavigation}>
          <View style={styles.monthNavLeft}>
            {showMonthView && (
              <>
                <TouchableOpacity
                  style={styles.navBtn}
                  onPress={() =>
                    setMonthBase(prev => new Date(prev.getFullYear(), prev.getMonth() - 1, 1))
                  }>
                  <Icon name="chevron-back" size={18} color={colors.text} />
                </TouchableOpacity>
                <Text style={styles.monthText}>{`${monthBase.getMonth() + 1}월`}</Text>
                <TouchableOpacity
                  style={styles.navBtn}
                  onPress={() =>
                    setMonthBase(prev => new Date(prev.getFullYear(), prev.getMonth() + 1, 1))
                  }>
                  <Icon name="chevron-forward" size={18} color={colors.text} />
                </TouchableOpacity>
              </>
            )}
            {!showMonthView && (
              <Text style={styles.monthText}>{`${monthBase.getMonth() + 1}월`}</Text>
            )}
          </View>
          <TouchableOpacity
            style={styles.menuBtn}
            onPress={() => {
              setShowMonthView(prev => {
                const next = !prev;
                if (!next) setMonthBase(new Date());
                return next;
              });
            }}>
            <Icon name="menu" size={20} color={colors.text} />
          </TouchableOpacity>
        </View>

        {/* 확장 달력 (기록하기와 동일 구조/스타일) */}
        {showMonthView && (
          <View style={styles.monthGridContainer}>
            {(() => {
              const today = new Date();
              const getStartOfWeek = (d: Date) => {
                const n = new Date(d.getFullYear(), d.getMonth(), d.getDate());
                const diff = n.getDay();
                n.setDate(n.getDate() - diff);
                return n;
              };
              const firstOfMonth = new Date(monthBase.getFullYear(), monthBase.getMonth(), 1);
              const gridStart = getStartOfWeek(firstOfMonth);
              const nextMonth = new Date(monthBase.getFullYear(), monthBase.getMonth() + 1, 1);
              const daysInMonth = Math.round((nextMonth.getTime() - firstOfMonth.getTime()) / (1000*60*60*24));
              const offset = firstOfMonth.getDay();
              const totalCells = Math.ceil((offset + daysInMonth) / 7) * 7;
              const days = Array.from({length: totalCells}).map((_, i) => {
                const d = new Date(gridStart.getFullYear(), gridStart.getMonth(), gridStart.getDate()+i);
                const isToday = d.toDateString() === today.toDateString();
                const isCurrentMonth = d.getMonth() === monthBase.getMonth();
                return { key: d.toISOString().slice(0,10), d, isToday, isCurrentMonth };
              });
              return (
                <View style={styles.monthGrid}>
                  {days.map(({key, d, isToday, isCurrentMonth}) => {
                    const isSelected = selectedDate && d.toDateString() === selectedDate.toDateString();
                    return (
                      <TouchableOpacity
                        key={key}
                        style={styles.monthCell}
                        onPress={() => {
                          setSelectedDate(d);
                          setShowMonthView(false);
                          setMonthBase(new Date(d.getFullYear(), d.getMonth(), 1));
                        }}
                        activeOpacity={0.7}>
                        <View style={[
                          styles.monthDateBadge,
                          isSelected && styles.monthDateBadgeToday
                        ]}>
                          <Text style={[
                            styles.monthDateText,
                            isSelected && styles.monthDateTextToday,
                            !isCurrentMonth && styles.monthDateTextMuted
                          ]}>
                            {d.getDate()}
                          </Text>
                        </View>
                        {(() => {
                          const dayProgress = getDayProgress(d);
                          const calories = dayProgress?.totalCalorie ?? 0;
                          const rate = dayProgress?.exerciseRate ?? 0;
                          return (
                            <>
                              <Text
                                style={[
                                  styles.calendarCalories,
                                  !isCurrentMonth && styles.monthMuted,
                                ]}>
                                {calories > 0 ? `${Math.round(calories)}k` : ''}
                              </Text>
                              <Text
                                style={[
                                  styles.calendarPercentage,
                                  !isCurrentMonth && styles.monthMuted,
                                ]}>
                                {rate > 0 ? `${Math.round(rate)}%` : ''}
                              </Text>
                            </>
                          );
                        })()}
                      </TouchableOpacity>
                    );
                  })}
                </View>
              );
            })()}
          </View>
        )}

        {/* 7일 캘린더 (접힘 상태에서 이번 주 표시) */}
        {!showMonthView && (
          <View style={styles.weekCalendar}>
            <View style={styles.calendarGrid}>
              {(() => {
                const today = new Date();
                const getStartOfWeek = (d: Date) => {
                  const n = new Date(d.getFullYear(), d.getMonth(), d.getDate());
                  const diff = n.getDay();
                  n.setDate(n.getDate() - diff);
                  return n;
                };
                const dateToShow = selectedDate || today;
                const startThis = getStartOfWeek(dateToShow);
                return Array.from({length: 7}).map((_, i) => {
                  const d = new Date(startThis.getFullYear(), startThis.getMonth(), startThis.getDate() + i);
                  const isToday = d.toDateString() === today.toDateString();
                  const isSelected = selectedDate && d.toDateString() === selectedDate.toDateString();
                  return (
                    <TouchableOpacity
                      key={startThis.toISOString() + i}
                      style={styles.calendarItem}
                      onPress={() => setSelectedDate(d)}
                      activeOpacity={0.7}>
                      <View style={[
                        styles.calendarNumber,
                        isSelected && styles.calendarNumberToday
                      ]}>
                        <Text style={[
                          styles.calendarNumberText,
                          isSelected && styles.calendarNumberTodayText
                        ]}>
                          {d.getDate()}
                        </Text>
                      </View>
                      {(() => {
                        const dayProgress = getDayProgress(d);
                        const calories = dayProgress?.totalCalorie ?? 0;
                        const rate = dayProgress?.exerciseRate ?? 0;
                        return (
                          <>
                            <Text style={styles.calendarCalories}>
                              {calories > 0 ? `${Math.round(calories)}k` : ''}
                            </Text>
                            <Text style={styles.calendarPercentage}>
                              {rate > 0 ? `${Math.round(rate)}%` : ''}
                            </Text>
                          </>
                        );
                      })()}
                    </TouchableOpacity>
                  );
                });
              })()}
            </View>
          </View>
        )}

        {/* 운동 섹션 (칼로리 진행률) */}
        <View style={styles.exerciseSection}>
          <View style={styles.calorieHeader}>
            <View style={styles.calorieLeft}>
              <Text style={styles.calorieCurrent}>
                {dailyMealsData?.dailyTotalCalories || 0}
              </Text>
              <Text style={styles.calorieGoal}>
                / {nutritionGoal?.targetCalories || 0}kcal
              </Text>
            </View>
            <Text style={styles.caloriePercentage}>
              {nutritionGoal?.targetCalories
                ? Math.round(
                    ((dailyMealsData?.dailyTotalCalories || 0) /
                      nutritionGoal.targetCalories) *
                      100,
                  )
                : 0}
              %
            </Text>
          </View>
          <View style={styles.calorieProgressBar}>
            <View
              style={[
                styles.calorieProgressFill,
                {
                  width: `${
                    nutritionGoal?.targetCalories
                      ? Math.min(
                          100,
                          ((dailyMealsData?.dailyTotalCalories || 0) /
                            nutritionGoal.targetCalories) *
                            100,
                        )
                      : 0
                  }%`,
                },
              ]}
            />
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
    justifyContent: 'space-between',
    alignItems: 'center',
    marginBottom: 0,
    paddingBottom: 12,
    paddingTop: 8,
  },
  monthNavLeft: {
    flexDirection: 'row',
    alignItems: 'center',
    gap: 0,
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
  monthGridContainer: {
    marginTop: 6,
    marginBottom: 6,
    paddingHorizontal: 4,
  },
  monthGrid: {
    flexDirection: 'row',
    flexWrap: 'wrap',
  },
  monthCell: {
    width: `${100 / 7}%`,
    paddingVertical: 6,
    alignItems: 'center',
  },
  monthDateBadge: {
    minWidth: 28,
    height: 28,
    borderRadius: 14,
    justifyContent: 'center',
    alignItems: 'center',
  },
  monthDateBadgeToday: {
    backgroundColor: '#ffffff',
  },
  monthDateText: {
    color: '#e3ff7c',
    fontSize: 16,
    fontWeight: '700',
    lineHeight: 19,
    textAlign: 'center',
  },
  monthDateTextToday: {
    color: '#000',
  },
  monthDateTextMuted: {
    color: '#777777',
  },
  monthMuted: {
    color: '#777777',
  },
  weekCalendar: {
    marginTop: 1,
    marginBottom: 6,
  },
  calendarGrid: {
    flexDirection: 'row',
    justifyContent: 'space-between',
    gap: 0,
    height: 79,
    marginVertical: 6,
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
  calendarNumberText: {
    fontSize: 16,
    fontWeight: '700',
    color: '#e3ff7c',
    lineHeight: 19,
    textAlign: 'center',
  },
  calendarNumberToday: {
    width: 30,
    height: 30,
    borderRadius: 15,
    backgroundColor: '#ffffff',
  },
  calendarNumberTodayText: {
    color: '#000000',
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

