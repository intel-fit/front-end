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
import {colors} from '../../theme/colors';
import {useDate} from '../../contexts/DateContext';

const DietScreen = ({navigation}: any) => {
  // 달력 관련 상태
  const [monthBase, setMonthBase] = useState(new Date()); // 현재 표시 중인 월 기준 날짜
  const [showMonthView, setShowMonthView] = useState(false); // 월간 달력 확장 여부
  const {selectedDate, setSelectedDate} = useDate(); // 선택된 날짜 (전역 상태)

  // 영양소 데이터 (칼로리, 탄수화물, 단백질, 지방)
  const nutritionData = {
    total: 384, // 현재 섭취한 총 칼로리
    target: 1157, // 목표 칼로리
    percentage: 30, // 목표 대비 달성률 (%)
    carbs: {current: 51, target: 198}, // 탄수화물: 현재 / 목표 (g)
    protein: {current: 15, target: 132}, // 단백질: 현재 / 목표 (g)
    fat: {current: 15, target: 49}, // 지방: 현재 / 목표 (g)
  };

  // 식사 목록 데이터 (아침, 점심, 저녁, 야식 등)
  const meals = [
    {
      type: '아침', // 식사 종류
      time: '8:38 am', // 식사 시간 또는 '추천 식단' 표시
      calories: 52, // 해당 식사의 칼로리
      foods: [ // 섭취한 음식 목록
        {name: '요거트', color: '#e3ff7c'}, // 음식명과 태그 배경색
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
      <ScrollView style={styles.content}>
        {/* 월 네비게이션 */}
        <View style={styles.monthNavigation}>
          <View style={styles.monthNavLeft}>
            {showMonthView && (
              <>
                <TouchableOpacity
                  style={styles.navBtn}
                  onPress={() =>
                    setMonthBase(prev => new Date(prev.getFullYear(), prev.getMonth() - 1, 1))
                  }
                >
                  <Icon name="chevron-back" size={18} color={colors.text} />
                </TouchableOpacity>
                <Text style={styles.monthText}>{`${monthBase.getMonth() + 1}월`}</Text>
                <TouchableOpacity
                  style={styles.navBtn}
                  onPress={() =>
                    setMonthBase(prev => new Date(prev.getFullYear(), prev.getMonth() + 1, 1))
                  }
                >
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
            }}
          >
            <Icon name="menu" size={20} color={colors.text} />
          </TouchableOpacity>
        </View>

        {/* 확장 달력 (운동 기록하기와 동일 구조/스타일) */}
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
              const totalCells = Math.ceil((offset + daysInMonth) / 7) * 7; // 21/28/35/42
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
                        activeOpacity={0.7}
                      >
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
                        {/* 해당 날짜의 칼로리 표시 */}
                        <Text style={[styles.calendarCalories, !isCurrentMonth && styles.monthMuted]}>388k</Text>
                        {/* 해당 날짜의 목표 달성률 표시 */}
                        <Text style={[styles.calendarPercentage, !isCurrentMonth && styles.monthMuted]}>97%</Text>
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
                return Array.from({length:7}).map((_, i) => {
                  const d = new Date(startThis.getFullYear(), startThis.getMonth(), startThis.getDate()+i);
                  const isToday = d.toDateString() === today.toDateString();
                  const isSelected = selectedDate && d.toDateString() === selectedDate.toDateString();
                  return (
                    <TouchableOpacity
                      key={startThis.toISOString()+i}
                      style={styles.calendarItem}
                      onPress={() => setSelectedDate(d)}
                      activeOpacity={0.7}
                    >
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
                      {/* 해당 날짜의 칼로리 표시 */}
                      <Text style={styles.calendarCalories}>388k</Text>
                      {/* 해당 날짜의 목표 달성률 표시 */}
                      <Text style={styles.calendarPercentage}>97%</Text>
                    </TouchableOpacity>
                  );
                });
              })()}
            </View>
          </View>
        )}

        {/* 칼로리 섹션: 총 칼로리, 목표 칼로리, 달성률 표시 */}
        <View style={styles.calorieSection}>
          {/* 칼로리 헤더: 현재 칼로리 / 목표 칼로리, 달성률 */}
          <View style={styles.calorieHeader}>
            <View style={styles.calorieMain}>
              <Text style={styles.calorieNumber}>{nutritionData.total}</Text>
              <Text style={styles.calorieUnit}>
                {' '}
                / {nutritionData.target}kcal
              </Text>
            </View>
            {/* 목표 대비 달성률 (%) */}
            <Text style={styles.caloriePercentage}>
              {nutritionData.percentage}%
            </Text>
          </View>

          {/* 칼로리 진행 바: 목표 달성률을 시각적으로 표시 */}
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

          {/* 영양소 바: 탄수화물, 단백질, 지방의 섭취량과 목표량 표시 */}
          <View style={styles.nutritionBars}>
            {/* 탄수화물 섭취량 및 진행 바 */}
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
            {/* 단백질 섭취량 및 진행 바 */}
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
            {/* 지방 섭취량 및 진행 바 */}
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

        {/* 식사별 섹션: 아침, 점심, 저녁, 야식 등 각 식사 정보 표시 */}
        <View style={styles.mealsContainer}>
          {meals.map((meal, index) => (
            <View key={index} style={styles.mealSection}>
              {/* 식사 헤더: 식사 종류, 시간, 칼로리 */}
              <View style={styles.mealHeader}>
                <View style={styles.mealLeft}>
                  <Text style={styles.mealTitle}>{meal.type}</Text>
                  <Text style={styles.mealTime}>{meal.time}</Text>
                </View>
                {/* 해당 식사의 총 칼로리 */}
                <Text style={styles.mealCalories}>{meal.calories} kcal</Text>
              </View>
              {/* 섭취한 음식 목록: 음식명을 태그 형태로 표시 */}
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

        {/* 식단 추가하기 버튼: 새로운 식단을 추가하는 화면으로 이동 */}
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
  content: {
    flex: 1,
    padding: 20,
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
    backgroundColor: '#e3ff7c',
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
  monthDateBadgeSelected: {
    backgroundColor: 'rgba(227, 255, 124, 0.5)', // 반투명한 선택 색상
    borderWidth: 2,
    borderColor: '#e3ff7c',
  },
  monthDateTextSelected: {
    color: '#e3ff7c',
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
    backgroundColor: '#e3ff7c',
  },
  calendarNumberTodayText: {
    color: '#000000',
    fontSize: 16,
    fontWeight: '700',
    lineHeight: 19,
  },
  calendarMutedText: {
    color: '#777777',
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
  calendarNumberSelected: {
    borderWidth: 2,
    borderColor: '#e3ff7c',
  },
  calendarNumberTextSelected: {
    color: '#e3ff7c',
  },
});

export default DietScreen;

