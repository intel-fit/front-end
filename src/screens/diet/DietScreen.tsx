import React, {useState, useEffect} from 'react';
import {
  View,
  Text,
  TouchableOpacity,
  StyleSheet,
  SafeAreaView,
  ScrollView,
  Alert,
} from 'react-native';
import { Ionicons as Icon } from '@expo/vector-icons';
import {colors} from '../../theme/colors';
import {useDate} from '../../contexts/DateContext';
import {mealAPI} from '../../services';
import {fetchWeeklyProgress, fetchMonthlyProgress} from '../../utils/exerciseApi';
import {useFocusEffect} from '@react-navigation/native';
import type {DailyMealsResponse, DailyMeal, DailyProgressWeekItem, NutritionGoal} from '../../types';
import NutritionGoalModal from '../../components/modals/NutritionGoalModal';

const DietScreen = ({navigation}: any) => {
  // 달력 관련 상태
  const [monthBase, setMonthBase] = useState(new Date()); // 현재 표시 중인 월 기준 날짜
  const [showMonthView, setShowMonthView] = useState(false); // 월간 달력 확장 여부
  const {selectedDate, setSelectedDate} = useDate(); // 선택된 날짜 (전역 상태)

  // 영양소 데이터 (칼로리, 탄수화물, 단백질, 지방)
  const [dailyMealsData, setDailyMealsData] = useState<DailyMealsResponse | null>(null);
  const [loading, setLoading] = useState(false);
  const [weeklyProgress, setWeeklyProgress] = useState<DailyProgressWeekItem[]>([]);
  const [monthlyProgress, setMonthlyProgress] = useState<DailyProgressWeekItem[]>([]);
  const [nutritionGoal, setNutritionGoal] = useState<NutritionGoal | null>(null);
  const [isNutritionModalOpen, setIsNutritionModalOpen] = useState(false);

  // 날짜 형식 변환 함수 (Date -> yyyy-MM-dd)
  const formatDateToString = (date: Date): string => {
    const year = date.getFullYear();
    const month = String(date.getMonth() + 1).padStart(2, '0');
    const day = String(date.getDate()).padStart(2, '0');
    return `${year}-${month}-${day}`;
  };

  // API 호출 함수
  const fetchDailyMeals = async (date: Date) => {
    setLoading(true);
    try {
      const dateString = formatDateToString(date);
      const data = await mealAPI.getDailyMeals(dateString);
      setDailyMealsData(data);
    } catch (error: any) {
      console.error('일별 식단 조회 실패:', error);
      // 에러 발생 시 빈 데이터로 설정
      setDailyMealsData(null);
    } finally {
      setLoading(false);
    }
  };

  // 식사 삭제 핸들러
  const handleDeleteMeal = async (mealId: number) => {
    Alert.alert(
      '식사 삭제',
      '이 식사를 삭제하시겠습니까?',
      [
        {text: '취소', style: 'cancel'},
        {
          text: '삭제',
          style: 'destructive',
          onPress: async () => {
            try {
              setLoading(true);
              await mealAPI.deleteMeal(mealId);
              Alert.alert('성공', '식사가 삭제되었습니다.');
              
              // 삭제 후 데이터 새로고침
              const dateToFetch = selectedDate || new Date();
              await fetchDailyMeals(dateToFetch);
            } catch (error: any) {
              console.error('식사 삭제 실패:', error);
              let errorMessage = '식사 삭제에 실패했습니다.';
              
              if (error.status === 404) {
                errorMessage = '삭제할 식사를 찾을 수 없습니다.';
              } else if (error.status === 403) {
                errorMessage = '삭제 권한이 없습니다.';
              } else if (error.message) {
                errorMessage = error.message;
              }
              
              Alert.alert('오류', errorMessage);
            } finally {
              setLoading(false);
            }
          },
        },
      ]
    );
  };

  // 선택된 날짜가 변경될 때마다 API 호출
  useEffect(() => {
    const dateToFetch = selectedDate || new Date();
    fetchDailyMeals(dateToFetch);
  }, [selectedDate]);

  // 화면 포커스 시 데이터 새로고침 (식단 추가 후 돌아왔을 때)
  useFocusEffect(
    React.useCallback(() => {
      const dateToFetch = selectedDate || new Date();
      fetchDailyMeals(dateToFetch);
    }, [selectedDate])
  );

  // 주간 데이터 로드
  const loadWeeklyProgress = async () => {
    try {
      console.log('주간 진행률 조회 시작');
      const data = await fetchWeeklyProgress();
      console.log('주간 진행률 데이터:', data);
      console.log('주간 진행률 데이터 개수:', Array.isArray(data) ? data.length : 0);
      if (Array.isArray(data) && data.length > 0) {
        console.log('주간 진행률 첫 번째 항목:', data[0]);
        console.log('날짜 형식 확인:', data[0]?.date);
        console.log('칼로리 값:', data[0]?.totalCalorie);
        console.log('운동 달성률:', data[0]?.exerciseRate);
      }
      setWeeklyProgress(Array.isArray(data) ? data : []);
    } catch (e) {
      console.error('주간 식단 진행률 로드 실패:', e);
      setWeeklyProgress([]);
    }
  };

  // 월별 데이터 로드
  const loadMonthlyProgress = async (year: number, month: number) => {
    try {
      // API는 YYYY-MM 형식 요구 (예: 2025-11)
      const yearMonth = `${year}-${String(month + 1).padStart(2, '0')}`;
      console.log('월별 진행률 조회:', yearMonth);
      const data = await fetchMonthlyProgress(yearMonth);
      console.log('월별 진행률 데이터:', data);
      console.log('월별 진행률 데이터 개수:', Array.isArray(data) ? data.length : 0);
      if (Array.isArray(data) && data.length > 0) {
        console.log('월별 진행률 첫 번째 항목:', data[0]);
        console.log('날짜 형식 확인:', data[0]?.date);
      }
      setMonthlyProgress(Array.isArray(data) ? data : []);
    } catch (e) {
      console.error('월별 식단 진행률 로드 실패:', e);
      setMonthlyProgress([]);
    }
  };

  // 특정 날짜의 진행률 데이터 가져오기
  const getDayProgress = (date: Date): DailyProgressWeekItem | undefined => {
    const dateStr = formatDateToString(date);
    // 먼저 월별 데이터에서 찾고, 없으면 주간 데이터에서 찾기
    const found = monthlyProgress.find(item => item.date === dateStr) 
      || weeklyProgress.find(item => item.date === dateStr);
    
    // 디버깅: 데이터가 없을 때만 로그 출력 (너무 많은 로그 방지)
    if (!found && (monthlyProgress.length > 0 || weeklyProgress.length > 0)) {
      console.log(`날짜 ${dateStr}에 대한 데이터를 찾을 수 없음. 월별: ${monthlyProgress.length}개, 주간: ${weeklyProgress.length}개`);
      if (monthlyProgress.length > 0) {
        console.log('월별 데이터 샘플:', monthlyProgress.slice(0, 3));
      }
      if (weeklyProgress.length > 0) {
        console.log('주간 데이터 샘플:', weeklyProgress.slice(0, 3));
      }
    }
    
    return found;
  };

  // 영양 목표 로드 (목표가 없으면 API에서 자동 생성)
  const loadNutritionGoal = async () => {
    try {
      const data = await mealAPI.getNutritionGoal();
      setNutritionGoal(data);
    } catch (e: any) {
      console.error('영양 목표 로드 실패:', e);
      // 401 에러가 아닌 경우에만 기본값 설정 (인증 문제가 아닌 경우)
      if (e?.status !== 401) {
        // API에서 자동 생성되므로 잠시 후 재시도
        setTimeout(async () => {
          try {
            const retryData = await mealAPI.getNutritionGoal();
            setNutritionGoal(retryData);
          } catch (retryError) {
            console.error('영양 목표 재시도 실패:', retryError);
            // 재시도 실패 시 0으로 설정
            if (!nutritionGoal) {
              setNutritionGoal({
                id: 0,
                targetCalories: 0,
                targetCarbs: 0,
                targetProtein: 0,
                targetFat: 0,
                goalType: 'AUTO',
                goalTypeDescription: '자동 계산',
              });
            }
          }
        }, 500);
      }
    }
  };

  // 화면 포커스 시 주간 데이터 및 영양 목표 로드
  useEffect(() => {
    loadWeeklyProgress();
    loadNutritionGoal();
  }, []);

  // monthBase가 변경될 때 월별 데이터 로드
  useEffect(() => {
    loadMonthlyProgress(monthBase.getFullYear(), monthBase.getMonth());
  }, [monthBase]);

  // API 데이터를 UI 형식으로 변환 (목표가 없으면 0)
  const targetCalories = nutritionGoal?.targetCalories || 0;
  const targetCarbs = nutritionGoal?.targetCarbs || 0;
  const targetProtein = nutritionGoal?.targetProtein || 0;
  const targetFat = nutritionGoal?.targetFat || 0;

  const nutritionData = dailyMealsData ? {
    total: dailyMealsData.dailyTotalCalories,
    target: targetCalories,
    percentage: targetCalories > 0 ? Math.round((dailyMealsData.dailyTotalCalories / targetCalories) * 100) : 0,
    carbs: {
      current: dailyMealsData.dailyTotalCarbs,
      target: targetCarbs
    },
    protein: {
      current: dailyMealsData.dailyTotalProtein,
      target: targetProtein
    },
    fat: {
      current: dailyMealsData.dailyTotalFat,
      target: targetFat
    },
  } : {
    total: 0,
    target: targetCalories,
    percentage: 0,
    carbs: {current: 0, target: targetCarbs},
    protein: {current: 0, target: targetProtein},
    fat: {current: 0, target: targetFat},
  };

  // 식사 목록 변환
  const meals = dailyMealsData?.meals.map((meal: DailyMeal) => {
    // mealType을 한글 이름으로 변환
    const mealTypeMap: Record<string, string> = {
      'BREAKFAST': '아침',
      'LUNCH': '점심',
      'DINNER': '저녁',
      'SNACK': '야식',
      'OTHER': '기타',
    };

    // 시간 포맷팅 (createdAt에서 시간 추출)
    const mealTime = meal.createdAt 
      ? new Date(meal.createdAt).toLocaleTimeString('ko-KR', {
          hour: '2-digit',
          minute: '2-digit',
          hour12: true,
        })
      : '추천 식단';

    return {
      type: meal.memo || mealTypeMap[meal.mealType] || meal.mealTypeName,
      time: mealTime,
      calories: meal.totalCalories,
      foods: meal.foods.map(food => ({
        name: food.foodName,
        color: '#e3ff7c', // 기본 색상
      })),
    };
  }) || [];

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
                        {(() => {
                          const dayProgress = getDayProgress(d);
                          const calories = dayProgress?.totalCalorie ?? 0;
                          const rate = dayProgress?.exerciseRate ?? 0;
                          
                          // 디버깅: 특정 날짜의 데이터 확인
                          if (d.getDate() === new Date().getDate() && d.getMonth() === new Date().getMonth()) {
                            console.log(`오늘 날짜 ${formatDateToString(d)}의 진행률:`, {
                              found: !!dayProgress,
                              calories,
                              rate,
                              dayProgress
                            });
                          }
                          
                          return (
                            <>
                              <Text
                                style={[
                                  styles.calendarCalories,
                                  !isCurrentMonth && styles.monthMuted,
                                ]}
                              >
                                {calories > 0 ? `${Math.round(calories)}k` : ''}
                              </Text>
                              <Text
                                style={[
                                  styles.calendarPercentage,
                                  !isCurrentMonth && styles.monthMuted,
                                ]}
                              >
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
            <View style={styles.calorieHeaderRight}>
              {/* 목표 대비 달성률 (%) */}
              <Text style={styles.caloriePercentage}>
                {nutritionData.percentage}%
              </Text>
              {/* 영양 목표 설정 버튼 */}
              <TouchableOpacity
                style={styles.nutritionButton}
                onPress={() => setIsNutritionModalOpen(true)}>
                <Icon name="settings-outline" size={20} color={colors.text} />
              </TouchableOpacity>
            </View>
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
              <View style={styles.nutritionRow}>
                <Text style={styles.nutritionLabel}>탄수화물</Text>
                <Text style={styles.nutritionValue}>
                  {nutritionData.carbs.current} / {nutritionData.carbs.target}g
                </Text>
              </View>
              <View style={styles.nutritionProgress}>
                <View
                  style={[
                    styles.nutritionProgressFill,
                    {
                      width: `${
                        nutritionData.carbs.target > 0
                          ? (nutritionData.carbs.current /
                              nutritionData.carbs.target) *
                            100
                          : 0
                      }%`,
                    },
                  ]}
                />
              </View>
            </View>
            {/* 단백질 섭취량 및 진행 바 */}
            <View style={styles.nutritionItem}>
              <View style={styles.nutritionRow}>
                <Text style={styles.nutritionLabel}>단백질</Text>
                <Text style={styles.nutritionValue}>
                  {nutritionData.protein.current} / {nutritionData.protein.target}g
                </Text>
              </View>
              <View style={styles.nutritionProgress}>
                <View
                  style={[
                    styles.nutritionProgressFill,
                    {
                      width: `${
                        nutritionData.protein.target > 0
                          ? (nutritionData.protein.current /
                              nutritionData.protein.target) *
                            100
                          : 0
                      }%`,
                    },
                  ]}
                />
              </View>
            </View>
            {/* 지방 섭취량 및 진행 바 */}
            <View style={styles.nutritionItem}>
              <View style={styles.nutritionRow}>
                <Text style={styles.nutritionLabel}>지방</Text>
                <Text style={styles.nutritionValue}>
                  {nutritionData.fat.current} / {nutritionData.fat.target}g
                </Text>
              </View>
              <View style={styles.nutritionProgress}>
                <View
                  style={[
                    styles.nutritionProgressFill,
                    {
                      width: `${
                        nutritionData.fat.target > 0
                          ? (nutritionData.fat.current / nutritionData.fat.target) *
                            100
                          : 0
                      }%`,
                    },
                  ]}
                />
              </View>
            </View>
          </View>
        </View>

        {/* 식단 기록하기 섹션: 새로운 식단을 추가하는 화면으로 이동 */}
        <View style={styles.addMealSection}>
          <View style={styles.mealRecordHeader}>
            <Text style={styles.mealRecordTitle}>식단 기록하기</Text>
            <TouchableOpacity
              style={styles.addButton}
              onPress={() => {
                // 선택한 날짜를 MealAddScreen으로 전달
                const dateToPass = selectedDate || new Date();
                navigation.navigate('MealAdd', { selectedDate: dateToPass });
              }}>
              <Icon name="add" size={18} color={colors.text} />
            </TouchableOpacity>
          </View>
        </View>

        {/* 식사별 섹션: 아침, 점심, 저녁, 야식 등 각 식사 정보 표시 */}
        <View style={styles.mealsContainer}>
          {meals.map((meal, index) => {
            const originalMeal = dailyMealsData?.meals[index];
            return (
              <View key={index} style={styles.mealSection}>
                <TouchableOpacity
                  style={styles.mealContent}
                  onPress={() => {
                    if (originalMeal) {
                      navigation.navigate('MealAdd', { meal: originalMeal });
                    }
                  }}
                  activeOpacity={0.7}>
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
                        <Text style={styles.foodTagText} numberOfLines={2}>{food.name}</Text>
                      </View>
                    ))}
                  </View>
                </TouchableOpacity>
                
                {/* 삭제 버튼 */}
                {originalMeal && (
                  <TouchableOpacity
                    style={styles.deleteButton}
                    onPress={() => handleDeleteMeal(originalMeal.id)}
                    activeOpacity={0.7}>
                    <Icon name="trash-outline" size={20} color={colors.textLight} />
                  </TouchableOpacity>
                )}
              </View>
            );
          })}
        </View>
      </ScrollView>

      {/* 영양 목표 설정 모달 */}
      <NutritionGoalModal
        isOpen={isNutritionModalOpen}
        onClose={() => setIsNutritionModalOpen(false)}
        currentGoal={nutritionGoal}
        onGoalUpdate={() => {
          loadNutritionGoal();
        }}
      />
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
    backgroundColor: '#ffffff',
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
    borderRadius: 16,
    padding: 16,
    marginBottom: 12,
  },
  calorieHeader: {
    flexDirection: 'row',
    justifyContent: 'space-between',
    alignItems: 'center',
    marginBottom: 12,
  },
  calorieHeaderRight: {
    flexDirection: 'row',
    alignItems: 'center',
    gap: 12,
  },
  nutritionButton: {
    width: 32,
    height: 32,
    borderRadius: 16,
    backgroundColor: colors.cardBackground,
    justifyContent: 'center',
    alignItems: 'center',
  },
  calorieMain: {
    flexDirection: 'row',
    alignItems: 'baseline',
    gap: 6,
  },
  calorieNumber: {
    fontSize: 18,
    fontWeight: '700',
    color: colors.text,
    lineHeight: 22,
  },
  calorieUnit: {
    fontSize: 11,
    fontWeight: '400',
    color: colors.text,
  },
  caloriePercentage: {
    fontSize: 14,
    fontWeight: '700',
    color: colors.text,
  },
  progressBarContainer: {
    marginBottom: 12,
  },
  progressBar: {
    height: 32,
    backgroundColor: 'rgba(255, 255, 255, 0.1)',
    borderRadius: 8,
    overflow: 'hidden',
  },
  progressFill: {
    height: '100%',
    backgroundColor: '#e3ff7c',
    borderRadius: 8,
  },
  nutritionBars: {
    flexDirection: 'row',
    gap: 12,
    width: '100%',
  },
  nutritionItem: {
    flex: 1,
    padding: 8,
    borderRadius: 5,
    minHeight: 40,
    justifyContent: 'center',
    gap: 8,
  },
  nutritionRow: {
    flexDirection: 'row',
    justifyContent: 'space-between',
    alignItems: 'center',
    marginBottom: 6,
  },
  nutritionLabel: {
    fontSize: 9,
    fontWeight: '700',
    color: colors.text,
    lineHeight: 11,
  },
  nutritionValue: {
    fontSize: 9,
    fontWeight: '400',
    color: colors.text,
    lineHeight: 11,
  },
  nutritionProgress: {
    width: '100%',
    height: 6,
    backgroundColor: 'rgba(255, 255, 255, 0.2)',
    borderRadius: 3,
    overflow: 'hidden',
  },
  nutritionProgressFill: {
    height: '100%',
    backgroundColor: '#e3ff7c',
    borderRadius: 3,
  },
  mealsContainer: {
    gap: 20,
    marginBottom: 12,
  },
  mealSection: {
    backgroundColor: colors.cardBackground,
    borderRadius: 20,
    padding: 20,
    marginBottom: 12,
    position: 'relative',
  },
  mealContent: {
    flex: 1,
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
  deleteButton: {
    position: 'absolute',
    bottom: 20,
    right: 20,
    padding: 4,
  },
  addMealSection: {
    marginTop: 0,
    marginBottom: 12,
  },
  mealRecordHeader: {
    flexDirection: 'row',
    justifyContent: 'space-between',
    alignItems: 'center',
    paddingVertical: 12,
  },
  mealRecordTitle: {
    color: colors.text,
    fontSize: 18,
    fontWeight: '700',
  },
  addButton: {
    width: 32,
    height: 32,
    borderRadius: 16,
    backgroundColor: colors.cardBackground,
    justifyContent: 'center',
    alignItems: 'center',
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

