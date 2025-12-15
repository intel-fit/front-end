import React, {useState, useEffect, useRef} from 'react';
import {
  View,
  Text,
  TouchableOpacity,
  StyleSheet,
  SafeAreaView,
  ScrollView,
  Alert,
  Modal,
} from 'react-native';
import { Ionicons as Icon } from '@expo/vector-icons';
import { LinearGradient } from 'expo-linear-gradient';
import {colors} from '../../theme/colors';
import {useDate} from '../../contexts/DateContext';
import {mealAPI, recommendedMealAPI, homeAPI} from '../../services';
import {useFocusEffect} from '@react-navigation/native';
import {eventBus} from '../../utils/eventBus';
// 진행률 API 호출 제거
// import {fetchWeeklyProgress, fetchMonthlyProgress} from '../../utils/exerciseApi';
import type {DailyMealsResponse, DailyMeal, NutritionGoal, DailyProgressWeekItem, AddMealRequest} from '../../types';
import NutritionGoalModal from '../../components/modals/NutritionGoalModal';

// MealPlanDetail 모달에서 사용할 타입 정의 (간소화)
interface MealPlanDay {
  date: string;
  bundleDay: number;
  meals: any[]; // MealDetail 타입을 대신하여 any 사용
}

interface SelectedPlan {
  bundleId: string;
  planName: string;
  days: MealPlanDay[];
}

const DietScreen = ({navigation, route}: any) => {
  // 달력 관련 상태
  const [monthBase, setMonthBase] = useState(new Date()); // 현재 표시 중인 월 기준 날짜
  const [showMonthView, setShowMonthView] = useState(false); // 월간 달력 확장 여부
  const {selectedDate, setSelectedDate} = useDate(); // 선택된 날짜 (전역 상태)

  // 영양소 데이터 (칼로리, 탄수화물, 단백질, 지방)
  const [dailyMealsData, setDailyMealsData] = useState<DailyMealsResponse | null>(null);
  const [loading, setLoading] = useState(false);
  const [nutritionGoal, setNutritionGoal] = useState<NutritionGoal | null>(null);
  const [isNutritionModalOpen, setIsNutritionModalOpen] = useState(false);
  // 진행률 API 사용 안 함 - 빈 배열로 유지
  const [weeklyProgress, setWeeklyProgress] = useState<DailyProgressWeekItem[]>([]);
  const [monthlyProgress, setMonthlyProgress] = useState<DailyProgressWeekItem[]>([]);
  // 달력에 표시할 칼로리 데이터 (날짜별)
  const [calendarCalories, setCalendarCalories] = useState<Record<string, number>>({});
  // 달력에 표시할 운동 시간 데이터 (날짜별, 초 단위)
  const [dailyWorkoutSeconds, setDailyWorkoutSeconds] = useState<Record<string, number>>({});

  // 추천 식단 관련 상태
  const [savedMealPlans, setSavedMealPlans] = useState<any[]>([]);
  const [selectedPlan, setSelectedPlan] = useState<SelectedPlan | null>(null);
  const [showPlanModal, setShowPlanModal] = useState<boolean>(false);
  const [recommendedMealsForSelectedDate, setRecommendedMealsForSelectedDate] = useState<any[]>([]);
  
  // 토글 상태: 'meals' (식단 내역) 또는 'recommendations' (추천 식단)
  const [activeTab, setActiveTab] = useState<'meals' | 'recommendations'>('meals');

  // 날짜 형식 변환 함수 (Date -> yyyy-MM-dd)
  const formatDateToString = (date: Date): string => {
    const year = date.getFullYear();
    const month = String(date.getMonth() + 1).padStart(2, '0');
    const day = String(date.getDate()).padStart(2, '0');
    return `${year}-${month}-${day}`;
  };

  // 문자열을 Date 객체로 안전하게 변환 (YYYY-MM-DD 형식)
  const parseDateString = (dateStr: string): Date => {
    // YYYY-MM-DD 형식을 로컬 시간대로 파싱
    const [year, month, day] = dateStr.split('-').map(Number);
    return new Date(year, month - 1, day);
  };

  // 주간 데이터 로드 (비활성화)
  const loadWeeklyProgress = async () => {
    // API 호출 제거 - 진행률 데이터 사용 안 함
    setWeeklyProgress([]);
  };

  // 월별 데이터 로드 (중복 호출 방지)
  const loadMonthlyProgressRef = useRef<string | null>(null);
  const loadMonthlyProgress = async (year: number, month: number) => {
    const yearMonth = `${year}-${String(month).padStart(2, '0')}`;
    
    // 이미 같은 월의 데이터를 로드 중이면 중복 호출 방지
    if (loadMonthlyProgressRef.current === yearMonth) {
      console.log('[DIET] 월별 진행률 중복 호출 방지:', yearMonth);
      return;
    }
    
    try {
      loadMonthlyProgressRef.current = yearMonth;
      console.log('[DIET] 월별 진행률 로드 시작:', yearMonth);
      const data = await homeAPI.getMonthlyProgress(yearMonth);
      setMonthlyProgress(Array.isArray(data) ? data : []);
      console.log('[DIET] 월별 진행률 로드 완료:', data.length, '개');
    } catch (error: any) {
      console.error('[DIET] 월별 진행률 로드 실패:', error);
      setMonthlyProgress([]);
    } finally {
      // 로드 완료 후 ref 초기화 (다음 달 로드 가능하도록)
      setTimeout(() => {
        if (loadMonthlyProgressRef.current === yearMonth) {
          loadMonthlyProgressRef.current = null;
        }
      }, 1000);
    }
  };

  // 특정 날짜의 진행률 데이터 가져오기
  const getDayProgress = (date: Date): DailyProgressWeekItem | undefined => {
    const dateStr = formatDateToString(date);
    // 월별 진행률 데이터에서 찾기
    return monthlyProgress.find((item) => item.date === dateStr);
  };

  // 달력에 표시할 날짜들의 칼로리 및 운동 시간 데이터 로드
  const loadCalendarCalories = async (dates: string[]) => {
    try {
      console.log('📅 [식단 화면] 달력 칼로리 및 운동 시간 데이터 로드 시작:', dates.length, '일');
      
      // 각 날짜에 대해 영양성분 요약 조회 (병렬 처리)
      const nutritionPromises = dates.map(async (date, index) => {
        try {
          console.log(`📡 [식단 화면] ${index + 1}/${dates.length} - ${date} 영양성분 조회 중...`);
          const summary = await mealAPI.getNutritionSummary(date);
          const calories = summary.calories || 0;
          console.log(`✅ [식단 화면] ${index + 1}/${dates.length} - ${date} 칼로리: ${calories}kcal`);
          return { date, calories };
        } catch (error) {
          console.error(`❌ [식단 화면] ${index + 1}/${dates.length} - ${date} 영양성분 조회 실패:`, error);
          return { date, calories: 0 };
        }
      });

      // 각 날짜에 대해 운동 시간 조회 (병렬 처리)
      const workoutTimePromises = dates.map(async (date, index) => {
        try {
          console.log(`📡 [식단 화면] ${index + 1}/${dates.length} - ${date} 운동 시간 조회 중...`);
          const progress = await homeAPI.getTodayProgress(date);
          const totalSeconds = progress.totalExerciseSeconds || 0;
          console.log(`✅ [식단 화면] ${index + 1}/${dates.length} - ${date} 운동 시간: ${totalSeconds}초`);
          return { date, totalSeconds };
        } catch (error) {
          console.error(`❌ [식단 화면] ${index + 1}/${dates.length} - ${date} 운동 시간 조회 실패:`, error);
          return { date, totalSeconds: 0 };
        }
      });

      const [nutritionResults, workoutTimeResults] = await Promise.all([
        Promise.all(nutritionPromises),
        Promise.all(workoutTimePromises),
      ]);

      console.log('📅 [식단 화면] 달력 칼로리 및 운동 시간 데이터 조회 완료:', nutritionResults.length, '일');

      // 상태 업데이트
      const caloriesMap: Record<string, number> = {};
      nutritionResults.forEach(({ date, calories }) => {
        caloriesMap[date] = calories;
      });
      
      const workoutSecondsMap: Record<string, number> = {};
      workoutTimeResults.forEach(({ date, totalSeconds }) => {
        workoutSecondsMap[date] = totalSeconds;
      });
      
      setCalendarCalories(prev => ({ ...prev, ...caloriesMap }));
      setDailyWorkoutSeconds(prev => ({ ...prev, ...workoutSecondsMap }));
    } catch (error) {
      console.error('❌ [식단 화면] 달력 데이터 로드 실패:', error);
    }
  };

  // 저장된 식단 플랜 목록 로드
  const loadSavedMealPlans = async () => {
    try {
      const response = await recommendedMealAPI.getSavedMealPlans();

      const bundleMap = new Map<string, any>();

      response.forEach((plan: any) => {
        if (!bundleMap.has(plan.bundleId)) {
          bundleMap.set(plan.bundleId, {
            bundleId: plan.bundleId,
            planName: plan.planName,
            description: plan.description,
            createdAt: plan.createdAt,
            mealCount: 0,
            totalCalories: 0,
          });
        }

        const bundle = bundleMap.get(plan.bundleId)!;
        bundle.mealCount++;
        bundle.totalCalories += plan.totalCalories || 0;
      });

      const plans = Array.from(bundleMap.values()).map((bundle) => ({
        ...bundle,
        avgCalories: Math.round(bundle.totalCalories / (bundle.mealCount || 1)),
        description: `${Math.ceil(bundle.mealCount / 3)}일 식단`,
      }));

      setSavedMealPlans(plans);
    } catch (error) {
      console.error('저장된 식단 로드 실패:', error);
      setSavedMealPlans([]);
    }
  };

  // 선택된 날짜의 추천 식단 찾기
  const loadRecommendedMealsForDate = async (date: Date) => {
    try {
      if (savedMealPlans.length === 0) {
        console.log('🔍 추천 식단 로드: 저장된 플랜 없음');
        setRecommendedMealsForSelectedDate([]);
        return;
      }

      const dateStr = formatDateToString(date);
      console.log('🔍 추천 식단 로드 시작:', dateStr, '저장된 플랜:', savedMealPlans.length, '개');

      // 모든 플랜의 추천 식단을 수집
      const allMealsForDate: any[] = [];

      for (const plan of savedMealPlans) {
        const details = await recommendedMealAPI.getSavedMealPlansByBundle(
          plan.bundleId
        );

        console.log('📦 번들 상세 조회 결과:', plan.bundleId, '→', details.length, '개 끼니');
        console.log('📅 날짜별 분포:', details.reduce((acc: any, meal: any) => {
          acc[meal.targetDate] = (acc[meal.targetDate] || 0) + 1;
          return acc;
        }, {}));

        const mealsForDate = details.filter(
          (meal: any) => meal.targetDate === dateStr
        );

        console.log('✅ 찾은 식단:', dateStr, '→', mealsForDate.length, '개');

        if (mealsForDate.length > 0) {
          const mealsWithBundleInfo = mealsForDate.map((meal: any) => ({
            ...meal,
            sourceBundleId: plan.bundleId,
            sourcePlanName: plan.planName,
          }));

          allMealsForDate.push(...mealsWithBundleInfo);
        }
      }

      if (allMealsForDate.length > 0) {
        console.log('✅ 추천 식단 설정 완료:', allMealsForDate.length, '개');
        setRecommendedMealsForSelectedDate(allMealsForDate);
      } else {
        console.log('⚠️ 해당 날짜의 추천 식단 없음:', dateStr);
        setRecommendedMealsForSelectedDate([]);
      }
    } catch (error) {
      console.error('❌ 날짜별 추천 식단 로드 실패:', error);
      setRecommendedMealsForSelectedDate([]);
    }
  };

  // 플랜 상세 조회
  const loadPlanDetails = async (bundleId: string) => {
    try {
      setLoading(true);

      const response = await recommendedMealAPI.getSavedMealPlansByBundle(
        bundleId
      );

      if (response.length === 0) {
        Alert.alert('알림', '식단 정보가 없습니다.');
        return;
      }

      const dayMap = new Map<string, any>();

      response.forEach((meal: any) => {
        const dateStr = meal.targetDate;

        if (!dateStr) {
          console.warn('targetDate가 없는 끼니:', meal);
          return;
        }

        if (!dayMap.has(dateStr)) {
          dayMap.set(dateStr, {
            date: dateStr,
            bundleDay: meal.bundleDay,
            meals: [],
          });
        }

        dayMap.get(dateStr)!.meals.push(meal);
      });

      const sortedDays = Array.from(dayMap.values()).sort((a, b) =>
        a.date.localeCompare(b.date)
      );

      setSelectedPlan({
        bundleId: bundleId,
        planName: response[0]?.planName || '식단 플랜',
        days: sortedDays,
      });

      setShowPlanModal(true);
    } catch (error: any) {
      console.error('플랜 상세 조회 실패:', error);
      Alert.alert('오류', error.message || '플랜을 불러올 수 없습니다.');
    } finally {
      setLoading(false);
    }
  };

  // 플랜 적용
  const handleApplyPlanToDate = async (dayMeals: any[], targetDate: Date) => {
    try {
      setLoading(true);
      const dateStr = formatDateToString(targetDate);

      for (const meal of dayMeals) {
        const mealTypeMap: Record<string, string> = {
          'BREAKFAST': '아침',
          'LUNCH': '점심',
          'DINNER': '저녁',
          'SNACK': '야식',
          'OTHER': '기타',
        };
        const mealTypeName = mealTypeMap[meal.mealType] || meal.mealTypeName || '기타';
        
        // foods 데이터 처리: food_name으로 검색해서 올바른 food_id 찾기
        const processedFoods = await Promise.all(
          (meal.foods || []).map(async (food: any) => {
            let foodId = 0;
            
            // food_name으로 검색해서 올바른 food_id 찾기
            try {
              const searchResults = await mealAPI.searchFood(food.foodName);
              if (searchResults && searchResults.length > 0) {
                // 정확히 일치하는 음식 찾기
                const exactMatch = searchResults.find(
                  (result: any) => result.name === food.foodName || result.name_ko === food.foodName
                );
                // 정확히 일치하는 것이 없으면 첫 번째 결과 사용
                foodId = exactMatch ? exactMatch.id : searchResults[0].id;
                console.log(`🔍 음식 검색: "${food.foodName}" → food_id: ${foodId}`);
              } else {
                console.warn(`⚠️ 음식 검색 실패: "${food.foodName}" - food_id를 0으로 설정`);
                // 검색 실패 시 기존 food_id 사용 (있다면)
                foodId = food.id || food.food_id || 0;
              }
            } catch (error) {
              console.error(`❌ 음식 검색 오류: "${food.foodName}"`, error);
              // 검색 오류 시 기존 food_id 사용 (있다면)
              foodId = food.id || food.food_id || 0;
            }
            
            return {
              foodName: food.foodName,
              servingSize: food.servingSize || 100,
              calories: food.calories || 0,
              carbs: food.carbs || 0,
              protein: food.protein || 0,
              fat: food.fat || 0,
              sodium: food.sodium,
              cholesterol: food.cholesterol,
              sugar: food.sugar,
              fiber: food.fiber,
              imageUrl: food.imageUrl,
              aiConfidenceScore: food.aiConfidenceScore,
              id: foodId,
              food_id: foodId,
            };
          })
        );
        
        const addMealData: AddMealRequest = {
          mealDate: dateStr,
          mealType: meal.mealType as
            | 'BREAKFAST'
            | 'LUNCH'
            | 'DINNER'
            | 'SNACK'
            | 'OTHER',
          memo: `${
            selectedPlan?.planName || meal.sourcePlanName || '추천 식단'
          } - ${mealTypeName}`,
          foods: processedFoods,
        };

        await mealAPI.addMeal(addMealData);
      }

      Alert.alert('성공', `${dayMeals.length}개 식사가 추가되었습니다!`, [
        {
          text: '확인',
          onPress: async () => {
            setShowPlanModal(false);
            setSelectedDate(targetDate);
            await fetchDailyMeals(targetDate);
            await loadRecommendedMealsForDate(targetDate);
          },
        },
      ]);
    } catch (error: any) {
      console.error('식단 적용 실패:', error);
      Alert.alert('오류', error.message || '식단 적용에 실패했습니다.');
    } finally {
      setLoading(false);
    }
  };


  // API 호출 함수
  const fetchDailyMeals = async (date: Date) => {
    setLoading(true);
    try {
      const dateString = formatDateToString(date);
      const data = await mealAPI.getDailyMeals(dateString);
      setDailyMealsData(data);
      // 칼로리 캐시 사용 안 함
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
              const dateToFetch = selectedDate || new Date();
              
              await mealAPI.deleteMeal(mealId);
              Alert.alert('성공', '식사가 삭제되었습니다.');
              
              const dateStr = formatDateToString(dateToFetch);
              
              // 삭제 후 데이터 새로고침
              await fetchDailyMeals(dateToFetch);
              await loadRecommendedMealsForDate(dateToFetch);
              
              // 달력 칼로리 데이터 새로고침
              if (showMonthView) {
                // 월간 달력인 경우 해당 월의 모든 날짜
                const year = monthBase.getFullYear();
                const month = monthBase.getMonth() + 1;
                const firstOfMonth = new Date(year, month - 1, 1);
                const nextMonth = new Date(year, month, 1);
                const daysInMonth = Math.round((nextMonth.getTime() - firstOfMonth.getTime()) / (1000 * 60 * 60 * 24));
                const monthDates = Array.from({ length: daysInMonth }).map((_, i) => {
                  const d = new Date(year, month - 1, i + 1);
                  return formatDateToString(d);
                });
                await loadCalendarCalories(monthDates);
              } else {
                // 주간 달력인 경우 이번 주 7일
                const getStartOfWeek = (d: Date) => {
                  const n = new Date(d.getFullYear(), d.getMonth(), d.getDate());
                  const diff = n.getDay();
                  n.setDate(n.getDate() - diff);
                  return n;
                };
                const startOfWeek = getStartOfWeek(dateToFetch);
                const weekDates = Array.from({ length: 7 }).map((_, i) => {
                  const d = new Date(
                    startOfWeek.getFullYear(),
                    startOfWeek.getMonth(),
                    startOfWeek.getDate() + i
                  );
                  return formatDateToString(d);
                });
                await loadCalendarCalories(weekDates);
              }
              
              // eventBus로 식사 삭제 이벤트 발생 (캘린더와 홈 화면 새로고침용)
              eventBus.emit('mealDeleted', { date: dateStr, mealId });
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
    // 날짜가 바뀔 때 이전 dailyMealsData를 초기화하여 이전 날짜의 데이터가 달력에 표시되지 않도록 함
    setDailyMealsData(null);
    fetchDailyMeals(dateToFetch);

    if (savedMealPlans.length > 0) {
      loadRecommendedMealsForDate(dateToFetch);
    }
  }, [selectedDate, savedMealPlans.length]);

  // route params에서 업데이트된 진행률과 날짜 받기
  useEffect(() => {
    if (route?.params?.updatedProgress || route?.params?.updatedDate) {
      const progress = route.params.updatedProgress;
      const dateStr = route.params.updatedDate;
      
      // 진행률 업데이트
      if (progress) {
        const progressDateStr = progress.date;
        // 주간 또는 월별 진행률에 추가/업데이트
        setWeeklyProgress(prev => {
          const filtered = prev.filter(item => item.date !== progressDateStr);
          return [...filtered, progress];
        });
        setMonthlyProgress(prev => {
          const filtered = prev.filter(item => item.date !== progressDateStr);
          return [...filtered, progress];
        });
      }
      
      // 날짜 선택 및 해당 달의 월별 진행률 API 호출
      if (dateStr) {
        // YYYY-MM-DD 형식을 안전하게 파싱
        const date = parseDateString(dateStr);
        setSelectedDate(date);
        // 달력의 월도 업데이트 (저장된 날짜의 월로 변경)
        setMonthBase(new Date(date.getFullYear(), date.getMonth(), 1));
        // 해당 날짜의 식단 데이터 다시 불러오기
        fetchDailyMeals(date);
      }
      
      // params 초기화
      navigation.setParams({updatedProgress: undefined, updatedDate: undefined});
    }
  }, [route?.params?.updatedProgress, route?.params?.updatedDate, navigation]);

  // route params에서 activeTab 받기 (홈 위젯에서 추천 식단으로 이동할 때)
  useEffect(() => {
    if (route?.params?.activeTab === 'recommendations') {
      setActiveTab('recommendations');
      // params 초기화
      navigation.setParams({ activeTab: undefined });
    }
  }, [route?.params?.activeTab, navigation]);

  // 화면 포커스 시 데이터 새로고침
  // 다른 페이지에 갔다 오거나 운동 기록을 갔다 왔을 때, 탭 바꾸기 등 모든 행동 시
  useFocusEffect(
    React.useCallback(() => {
      // StatsScreen에서 날짜 처리를 하므로 여기서는 날짜를 변경하지 않음
      // 단지 현재 선택된 날짜를 사용하여 데이터 로드
      const dateToFetch = selectedDate || new Date();
      fetchDailyMeals(dateToFetch);

      loadSavedMealPlans().then(() => {
        loadRecommendedMealsForDate(dateToFetch);
      });
      
      // 달력 칼로리 데이터 새로고침
      if (showMonthView) {
        // 월간 달력인 경우 해당 월의 모든 날짜
        const year = monthBase.getFullYear();
        const month = monthBase.getMonth() + 1;
        const firstOfMonth = new Date(year, month - 1, 1);
        const nextMonth = new Date(year, month, 1);
        const daysInMonth = Math.round((nextMonth.getTime() - firstOfMonth.getTime()) / (1000 * 60 * 60 * 24));
        const monthDates = Array.from({ length: daysInMonth }).map((_, i) => {
          const d = new Date(year, month - 1, i + 1);
          return formatDateToString(d);
        });
        loadCalendarCalories(monthDates);
      } else {
        // 주간 달력인 경우 이번 주 7일
        const getStartOfWeek = (d: Date) => {
          const n = new Date(d.getFullYear(), d.getMonth(), d.getDate());
          const diff = n.getDay();
          n.setDate(n.getDate() - diff);
          return n;
        };
        const startOfWeek = getStartOfWeek(dateToFetch);
        const weekDates = Array.from({ length: 7 }).map((_, i) => {
          const d = new Date(
            startOfWeek.getFullYear(),
            startOfWeek.getMonth(),
            startOfWeek.getDate() + i
          );
          return formatDateToString(d);
        });
        loadCalendarCalories(weekDates);
      }
      // eslint-disable-next-line react-hooks/exhaustive-deps
    }, [selectedDate, showMonthView, monthBase])
  );

  // 초기 데이터 로드
  useEffect(() => {
    // 진행률 API 호출 제거
  }, []);

  // 월별 데이터 로드 (통합된 useEffect - 중복 호출 방지)
  useEffect(() => {
    if (showMonthView) {
      // monthBase를 기준으로 월별 데이터 로드
      const year = monthBase.getFullYear();
      const month = monthBase.getMonth() + 1;
      loadMonthlyProgress(year, month);
      
      // 해당 월의 모든 날짜에 대해 칼로리 데이터 로드
      const firstOfMonth = new Date(year, month - 1, 1);
      const nextMonth = new Date(year, month, 1);
      const daysInMonth = Math.round((nextMonth.getTime() - firstOfMonth.getTime()) / (1000 * 60 * 60 * 24));
      const monthDates = Array.from({ length: daysInMonth }).map((_, i) => {
        const d = new Date(year, month - 1, i + 1);
        return formatDateToString(d);
      });
      loadCalendarCalories(monthDates);
    }
  }, [monthBase, showMonthView]);

  // 주간 달력 칼로리 데이터 로드
  useEffect(() => {
    if (!showMonthView) {
      // 이번 주의 날짜 범위 계산 (일~토)
      const today = new Date();
      const getStartOfWeek = (d: Date) => {
        const n = new Date(d.getFullYear(), d.getMonth(), d.getDate());
        const diff = n.getDay();
        n.setDate(n.getDate() - diff);
        return n;
      };
      const dateToShow = selectedDate || today;
      const startOfWeek = getStartOfWeek(dateToShow);
      
      const weekDates = Array.from({ length: 7 }).map((_, i) => {
        const d = new Date(
          startOfWeek.getFullYear(),
          startOfWeek.getMonth(),
          startOfWeek.getDate() + i
        );
        return formatDateToString(d);
      });
      
      loadCalendarCalories(weekDates);
    }
  }, [selectedDate, showMonthView]);



  // 영양 목표 로드 (특정 날짜의 목표 조회 API 사용)
  const loadNutritionGoal = async (date?: Date) => {
    try {
      const targetDate = date || selectedDate || new Date();
      const dateString = formatDateToString(targetDate);
      const data = await mealAPI.getNutritionGoal(dateString);
      setNutritionGoal(data);
    } catch (e: any) {
      console.error('영양 목표 로드 실패:', e);
      // 401 에러가 아닌 경우에만 기본값 설정 (인증 문제가 아닌 경우)
      if (e?.status !== 401) {
        // API에서 자동 생성되므로 잠시 후 재시도
        setTimeout(async () => {
          try {
            const targetDate = date || selectedDate || new Date();
            const dateString = formatDateToString(targetDate);
            const retryData = await mealAPI.getNutritionGoal(dateString);
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

  // 화면 포커스 시 영양 목표 로드
  useEffect(() => {
    loadNutritionGoal();
  }, []);

  // 선택된 날짜가 변경될 때마다 영양 목표 조회
  useEffect(() => {
    if (selectedDate) {
      loadNutritionGoal(selectedDate);
    }
  }, [selectedDate]);

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

  // 식사 목록 변환 및 시간순 정렬
  const meals = (dailyMealsData?.meals || [])
    .slice() // 원본 배열 복사
    .sort((a: DailyMeal, b: DailyMeal) => {
      // createdAt 기준으로 시간순 정렬 (00:00부터 끝까지)
      // 같은 날짜 내에서 시간만 비교
      let timeA: number;
      let timeB: number;
      
      if (a.createdAt) {
        try {
          const dateA = new Date(a.createdAt);
          if (isNaN(dateA.getTime())) {
            timeA = Number.MAX_SAFE_INTEGER;
          } else {
            // 같은 날짜 기준으로 시간만 추출 (시:분:초)
            const hours = dateA.getHours();
            const minutes = dateA.getMinutes();
            const seconds = dateA.getSeconds();
            timeA = hours * 3600 + minutes * 60 + seconds;
          }
        } catch (e) {
          timeA = Number.MAX_SAFE_INTEGER;
        }
      } else {
        timeA = Number.MAX_SAFE_INTEGER;
      }
      
      if (b.createdAt) {
        try {
          const dateB = new Date(b.createdAt);
          if (isNaN(dateB.getTime())) {
            timeB = Number.MAX_SAFE_INTEGER;
          } else {
            // 같은 날짜 기준으로 시간만 추출 (시:분:초)
            const hours = dateB.getHours();
            const minutes = dateB.getMinutes();
            const seconds = dateB.getSeconds();
            timeB = hours * 3600 + minutes * 60 + seconds;
          }
        } catch (e) {
          timeB = Number.MAX_SAFE_INTEGER;
        }
      } else {
        timeB = Number.MAX_SAFE_INTEGER;
      }
      
      return timeA - timeB;
    })
    .map((meal: DailyMeal) => {
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

      // 추천 식단에서 추가된 식단인지 확인
      // 1. memo에 "추천 식단", "식단 플랜", " - "가 포함되어 있으면 추천 식단
      // 2. 또는 mealType이 BREAKFAST, LUNCH, DINNER이고 memo가 있으면 추천 식단일 가능성
      const hasRecommendedPattern = meal.memo && (
        meal.memo.includes('추천 식단') || 
        meal.memo.includes('식단 플랜') ||
        meal.memo.includes(' - ')
      );
      
      // mealType이 유효한 끼니 타입이고 memo가 있으면 추천 식단으로 간주
      const isValidMealType = ['BREAKFAST', 'LUNCH', 'DINNER'].includes(meal.mealType);
      const isRecommendedMeal = hasRecommendedPattern || (isValidMealType && meal.memo && meal.memo.trim().length > 0);
      
      // 식단 이름 결정
      let mealTypeName = meal.memo || mealTypeMap[meal.mealType] || meal.mealTypeName || '기타';
      
      // memo가 있지만 추천 식단 형식이면 끼니 이름만 추출
      if (isRecommendedMeal && meal.memo && meal.memo.includes(' - ')) {
        const parts = meal.memo.split(' - ');
        mealTypeName = parts[parts.length - 1]; // 마지막 부분이 끼니 이름 (예: "점심")
      } else if (isRecommendedMeal && !meal.memo.includes(' - ')) {
        // memo에 " - "가 없으면 mealType을 사용
        mealTypeName = mealTypeMap[meal.mealType] || meal.mealTypeName || '기타';
      }

      return {
        mealType: meal.mealType,
        type: mealTypeName,
        isRecommended: isRecommendedMeal,
        time: mealTime,
        calories: meal.totalCalories,
        foods: meal.foods.map(food => ({
          name: food.foodName,
          color: '#e3ff7c', // 기본 색상
        })),
      };
    });

  // 기록 안 된 끼니의 추천만 필터링
  const getAvailableRecommendations = () => {
    if (recommendedMealsForSelectedDate.length === 0) return [];

    const recordedMealTypes = new Set(meals.map((meal) => meal.mealType));

    return recommendedMealsForSelectedDate.filter(
      (recommended: any) => !recordedMealTypes.has(recommended.mealType)
    );
  };

  const availableRecommendations = getAvailableRecommendations();

  // UI 표시 조건 변수
  // 식사가 없을 때: 전체 추천 식단 표시
  const shouldShowFullRecommendation =
    meals.length === 0 && recommendedMealsForSelectedDate.length > 0;

  // 식사가 있을 때: 기록 안 된 끼니 추천 표시
  const shouldShowPartialRecommendation =
    meals.length > 0 && availableRecommendations.length > 0;

  // 추천 식단이 있지만 기록 안 된 끼니가 없을 때도 전체 추천 식단 표시
  const shouldShowFullRecommendationEvenWithMeals =
    meals.length > 0 && 
    recommendedMealsForSelectedDate.length > 0 && 
    availableRecommendations.length === 0;

  const shouldShowSavedPlans =
    meals.length === 0 &&
    recommendedMealsForSelectedDate.length === 0 &&
    savedMealPlans.length > 0;

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
                // 목록을 닫을 때 selectedDate의 월로 monthBase 업데이트
                if (!next && selectedDate) {
                  setMonthBase(new Date(selectedDate.getFullYear(), selectedDate.getMonth(), 1));
                }
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
                        <View
                          style={[
                            styles.monthDateBadge,
                            isSelected
                              ? styles.monthDateBadgeSelected
                              : isToday
                              ? styles.monthDateBadgeToday
                              : null,
                          ]}
                        >
                          <Text
                            style={[
                              styles.monthDateText,
                              isSelected
                                ? styles.monthDateTextSelected
                                : isToday
                                ? styles.monthDateTextToday
                                : styles.monthDateTextNotSelected,
                              !isCurrentMonth && styles.monthDateTextMuted,
                            ]}
                          >
                            {d.getDate()}
                          </Text>
                        </View>
                        {(() => {
                          const dayProgress = getDayProgress(d);
                          const dateStr = formatDateToString(d);
                          // 달력 칼로리 데이터 우선 사용, 없으면 진행률 데이터 사용
                          const calories = calendarCalories[dateStr] ?? dayProgress?.totalCalorie ?? 0;
                          // 해당 날짜의 운동 시간(초) 가져오기
                          const totalSeconds = dailyWorkoutSeconds[dateStr] ?? 0;
                          
                          // 운동 시간 포맷: 초만 있으면 "38s", 분이면 "39m", 60분 이상이면 "1h 39m"
                          const formatWorkoutTime = (seconds: number): string => {
                            if (seconds === 0) return '';
                            
                            const hours = Math.floor(seconds / 3600);
                            const minutes = Math.floor((seconds % 3600) / 60);
                            const secs = seconds % 60;
                            
                            if (hours > 0) {
                              // 60분 이상: "1h 39m"
                              return `${hours}h ${minutes}m`;
                            } else if (minutes > 0) {
                              // 분만: "39m"
                              return `${minutes}m`;
                            } else {
                              // 초만: "38s"
                              return `${secs}s`;
                            }
                          };

                          return (
                            <>
                              <Text style={[
                                styles.calendarCalories,
                                !isCurrentMonth && styles.monthMuted,
                              ]}>
                                {calories > 0 ? `${Math.round(calories)}k` : ''}
                              </Text>
                              <Text style={[
                                styles.calendarWorkoutTime,
                                !isCurrentMonth && styles.monthMuted,
                              ]}>
                                {formatWorkoutTime(totalSeconds)}
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
                      onPress={() => {
                        setSelectedDate(d);
                        // 선택한 날짜의 월로 monthBase 업데이트
                        setMonthBase(new Date(d.getFullYear(), d.getMonth(), 1));
                      }}
                      activeOpacity={0.7}
                    >
                      <View style={styles.calendarNumber}>
                        <View
                          style={[
                            styles.calendarNumberInner,
                            isToday && styles.calendarNumberToday,
                            isSelected && styles.calendarNumberSelected,
                          ]}
                        >
                          <Text
                            style={[
                              styles.calendarNumberText,
                              isToday && styles.calendarNumberTextToday,
                              isSelected && styles.calendarNumberSelectedText,
                              !isToday && !isSelected && styles.calendarNumberTextNotSelected,
                            ]}
                          >
                            {d.getDate()}
                          </Text>
                        </View>
                      </View>
                      {(() => {
                        const dayProgress = getDayProgress(d);
                        const dateStr = formatDateToString(d);
                        // 달력 칼로리 데이터 우선 사용, 없으면 진행률 데이터 사용
                        const calories = calendarCalories[dateStr] ?? dayProgress?.totalCalorie ?? 0;
                        // 해당 날짜의 운동 시간(초) 가져오기
                        const totalSeconds = dailyWorkoutSeconds[dateStr] ?? 0;
                        
                        // 운동 시간 포맷: 초만 있으면 "38s", 분이면 "39m", 60분 이상이면 "1h 39m"
                        const formatWorkoutTime = (seconds: number): string => {
                          if (seconds === 0) return '';
                          
                          const hours = Math.floor(seconds / 3600);
                          const minutes = Math.floor((seconds % 3600) / 60);
                          const secs = seconds % 60;
                          
                          if (hours > 0) {
                            // 60분 이상: "1h 39m"
                            return `${hours}h ${minutes}m`;
                          } else if (minutes > 0) {
                            // 분만: "39m"
                            return `${minutes}m`;
                          } else {
                            // 초만: "38s"
                            return `${secs}s`;
                          }
                        };

                        return (
                          <>
                            <Text style={styles.calendarCalories}>
                              {calories > 0 ? `${Math.round(calories)}k` : ''}
                            </Text>
                            <Text style={styles.calendarWorkoutTime}>
                              {formatWorkoutTime(totalSeconds)}
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
              <Text style={styles.calorieNumber}>{Math.round(nutritionData.total)}</Text>
              <Text style={styles.calorieUnit}>
                {' '}
                / {Math.round(nutritionData.target)}kcal
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
                  {Math.round(nutritionData.carbs.current)} / {Math.round(nutritionData.carbs.target)}g
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
                  {Math.round(nutritionData.protein.current)} / {Math.round(nutritionData.protein.target)}g
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
                  {Math.round(nutritionData.fat.current)} / {Math.round(nutritionData.fat.target)}g
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

        {/* 탭: 식단 내역 / 추천 식단 + 추가 버튼 */}
        <View style={styles.tabHeaderContainer}>
          <View style={styles.tabContainer}>
            <TouchableOpacity
              style={styles.tab}
              onPress={() => setActiveTab('meals')}
            >
              <Text style={[styles.tabText, activeTab === 'meals' && styles.tabTextActive]}>
                식단 내역
              </Text>
            </TouchableOpacity>
            <TouchableOpacity
              style={styles.tab}
              onPress={() => setActiveTab('recommendations')}
            >
              <View style={styles.tabTextContainer}>
                <Text style={[styles.tabText, activeTab === 'recommendations' && styles.tabTextActive]}>
                  추천 식단
                </Text>
                {activeTab === 'recommendations' ? (
                  <LinearGradient
                    colors={['#e3ff7c', '#fff9c4', '#ffffff']}
                    start={{ x: 0, y: 0 }}
                    end={{ x: 1, y: 0 }}
                    style={styles.premiumBadgeGradient}
                  >
                    <Text style={styles.premiumBadgeText}>premium</Text>
                  </LinearGradient>
                ) : (
                  <View style={styles.premiumBadge}>
                    <Text style={styles.premiumBadgeTextGray}>premium</Text>
                  </View>
                )}
              </View>
            </TouchableOpacity>
          </View>
          <TouchableOpacity
            style={styles.addButton}
            onPress={() => {
              // 선택한 날짜를 MealAddScreen으로 전달 (문자열로 변환하여 전달)
              const dateToPass = selectedDate || new Date();
              const dateString = formatDateToString(dateToPass);
              navigation.navigate('MealAdd', { selectedDate: dateString });
            }}>
            <Icon name="add" size={18} color={colors.text} />
          </TouchableOpacity>
        </View>

        {/* 식단 내역 탭 */}
        {activeTab === 'meals' && (
          <>

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
                          <View style={styles.mealTitleContainer}>
                            <Text style={styles.mealTitle}>{meal.type}</Text>
                            {meal.isRecommended && (
                              <Icon name="sparkles" size={16} color="#e3ff7c" />
                            )}
                          </View>
                          <Text style={styles.mealTime}>{meal.time}</Text>
                        </View>
                        {/* 해당 식사의 총 칼로리 및 삭제 버튼 */}
                        <View style={styles.mealRight}>
                          <Text style={styles.mealCalories}>{Math.round(meal.calories)} kcal</Text>
                          {originalMeal && (
                            <TouchableOpacity
                              style={styles.deleteButton}
                              onPress={(e) => {
                                e.stopPropagation();
                                handleDeleteMeal(originalMeal.id);
                              }}
                              activeOpacity={0.7}>
                              <Icon name="trash-outline" size={20} color={colors.textLight} />
                            </TouchableOpacity>
                          )}
                        </View>
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
                  </View>
                );
              })}
            </View>
          </>
        )}

        {/* 추천 식단 탭 */}
        {activeTab === 'recommendations' && (
          <>
            {/* 추천 식단이 있으면 항상 표시 */}
            {recommendedMealsForSelectedDate.length > 0 && (
              <View style={styles.recommendationSection}>
                <Text style={styles.recommendationSubtitle}>
                  {recommendedMealsForSelectedDate[0]?.sourcePlanName ||
                    'AI 추천 식단'}
                </Text>

            <View style={styles.recommendationCards}>
              {recommendedMealsForSelectedDate
                .sort((a, b) => {
                  const order: { [key: string]: number } = {
                    BREAKFAST: 0,
                    LUNCH: 1,
                    DINNER: 2,
                    SNACK: 3,
                    OTHER: 4,
                  };
                  const orderA = order[a.mealType] ?? 99;
                  const orderB = order[b.mealType] ?? 99;
                  return orderA - orderB;
                })
                .map((meal: any, index: number) => (
                  <View key={index} style={styles.recommendationCard}>
                    <View style={styles.recommendationCardHeader}>
                      <Text style={styles.recommendationEmoji}>
                        {meal.mealType === 'BREAKFAST'
                          ? '🌅'
                          : meal.mealType === 'LUNCH'
                          ? '☀️'
                          : '🌙'}
                      </Text>
                      <View style={styles.recommendationCardInfo}>
                        <Text style={styles.recommendationCardTitle}>
                          {(() => {
                            const mealTypeMap: Record<string, string> = {
                              'BREAKFAST': '아침',
                              'LUNCH': '점심',
                              'DINNER': '저녁',
                              'SNACK': '야식',
                              'OTHER': '기타',
                            };
                            return mealTypeMap[meal.mealType] || meal.mealTypeName || '기타';
                          })()}
                        </Text>
                        <Text style={styles.recommendationCardCalories}>
                          {meal.totalCalories}kcal
                        </Text>
                      </View>
                      <TouchableOpacity
                        style={styles.quickAddButton}
                        onPress={async () => {
                          const targetDate = selectedDate || new Date();
                          await handleApplyPlanToDate([meal], targetDate);
                        }}
                      >
                        <Icon name="add-circle" size={24} color="#e3ff7c" />
                      </TouchableOpacity>
                    </View>
                    <View style={styles.recommendationCardFoods}>
                      {meal.foods
                        ?.slice(0, 3)
                        .map((food: any, foodIdx: number) => (
                          <Text
                            key={foodIdx}
                            style={styles.recommendationCardFoodName}
                          >
                            {food.foodName}
                            {foodIdx < Math.min(meal.foods.length - 1, 2) &&
                              ', '}
                          </Text>
                        ))}
                      {meal.foods?.length > 3 && (
                        <Text style={styles.recommendationCardFoodName}>
                          외 {meal.foods.length - 3}개
                        </Text>
                      )}
                    </View>
                  </View>
                ))}
            </View>
          </View>
        )}


          </>
        )}
      </ScrollView>

      {/* 영양 목표 설정 모달 */}
      <NutritionGoalModal
        isOpen={isNutritionModalOpen}
        onClose={() => {
          setIsNutritionModalOpen(false);
          // 모달 닫을 때 영양 목표 다시 불러오기
          loadNutritionGoal();
        }}
        currentGoal={nutritionGoal}
        onGoalUpdate={() => {
          loadNutritionGoal();
        }}
        date={formatDateToString(selectedDate || new Date())}
      />

      {/* 플랜 상세 모달 */}
      <Modal
        visible={showPlanModal}
        transparent={true}
        animationType="slide"
        onRequestClose={() => setShowPlanModal(false)}
      >
        <TouchableOpacity
          style={styles.modalOverlay}
          activeOpacity={1}
          onPress={() => setShowPlanModal(false)}
        >
          <TouchableOpacity
            style={styles.modalContent}
            activeOpacity={1}
            onPress={(e) => e.stopPropagation()}
          >
            <View style={styles.modalHeader}>
              <Text style={styles.modalTitle}>
                {selectedPlan?.planName || '식단 플랜'}
              </Text>
              <TouchableOpacity onPress={() => setShowPlanModal(false)}>
                <Icon name="close" size={24} color={colors.text} />
              </TouchableOpacity>
            </View>

            <ScrollView style={styles.modalBody}>
              {selectedPlan?.days.map((day, dayIndex) => (
                <View key={dayIndex} style={styles.dayCard}>
                  <Text style={styles.dayTitle}>
                    {day.date} ({day.bundleDay}일차)
                  </Text>
                  {day.meals.map((meal: any, mealIndex: number) => {
                    const mealTypeMap: Record<string, string> = {
                      'BREAKFAST': '아침',
                      'LUNCH': '점심',
                      'DINNER': '저녁',
                      'SNACK': '야식',
                      'OTHER': '기타',
                    };
                    const mealTypeName = mealTypeMap[meal.mealType] || meal.mealTypeName || '기타';
                    return (
                      <View key={mealIndex} style={styles.mealItem}>
                        <Text style={styles.mealTypeName}>
                          {mealTypeName} - {meal.totalCalories}kcal
                        </Text>
                        <View style={styles.foodList}>
                          {meal.foods?.map((food: any, foodIndex: number) => (
                            <Text key={foodIndex} style={styles.foodName}>
                              • {food.foodName}
                            </Text>
                          ))}
                        </View>
                      </View>
                    );
                  })}
                  <TouchableOpacity
                    style={styles.applyDayButton}
                    onPress={async () => {
                      const targetDate = parseDateString(day.date);
                      await handleApplyPlanToDate(day.meals, targetDate);
                    }}
                  >
                    <Text style={styles.applyDayButtonText}>
                      이 날짜에 적용하기
                    </Text>
                  </TouchableOpacity>
                </View>
              ))}
            </ScrollView>
          </TouchableOpacity>
        </TouchableOpacity>
      </Modal>
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
    paddingBottom: 6,
    paddingTop: 0,
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
    marginTop: 0,
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
    width: 28,
    height: 28,
    borderRadius: 14,
    justifyContent: 'center',
    alignItems: 'center',
  },
  monthDateBadgeToday: {
    backgroundColor: '#ffffff',
  },
  monthDateText: {
    fontSize: 16,
    fontWeight: '700',
    lineHeight: 19,
    textAlign: 'center',
  },
  monthDateTextToday: {
    color: '#000',
  },
  monthDateTextNotSelected: {
    color: '#e3ff7c',
  },
  monthDateTextMuted: {
    color: '#777777',
  },
  monthMuted: {
    color: '#777777',
  },
  monthDateBadgeSelected: {
    backgroundColor: '#e3ff7c',
    borderRadius: 14,
  },
  monthDateTextSelected: {
    color: '#000',
  },
  calendarItem: {
    flex: 1,
    alignItems: 'center',
    justifyContent: 'flex-start',
    gap: 6,
    minHeight: 79,
  },
  calendarNumber: {
    width: 32,
    height: 32,
    justifyContent: 'center',
    alignItems: 'center',
    marginBottom: 4,
  },
  calendarNumberInner: {
    width: 28,
    height: 28,
    borderRadius: 14,
    justifyContent: 'center',
    alignItems: 'center',
  },
  calendarNumberToday: {
    backgroundColor: '#ffffff',
  },
  calendarNumberSelected: {
    backgroundColor: '#e3ff7c',
    borderRadius: 14,
  },
  calendarNumberText: {
    fontSize: 16,
    fontWeight: '700',
    lineHeight: 19,
    textAlign: 'center',
  },
  calendarNumberTextToday: {
    color: '#000',
  },
  calendarNumberTextNotSelected: {
    color: '#e3ff7c',
  },
  calendarNumberSelectedText: {
    color: '#000000',
    fontWeight: '700',
  },
  calendarMutedText: {
    color: '#777777',
  },
  calendarCalories: {
    fontSize: 12,
    fontWeight: '400',
    color: colors.text,
    textAlign: 'center',
    height: 15,
    lineHeight: 14.52,
  },
  calendarPercentage: {
    fontSize: 12,
    fontWeight: '400',
    color: colors.text,
    textAlign: 'center',
    height: 15,
    lineHeight: 14.52,
  },
  calendarWorkoutTime: {
    fontSize: 12,
    fontWeight: '400',
    color: colors.text,
    textAlign: 'center',
    height: 15,
    lineHeight: 14.52,
  },
  calorieSection: {
    backgroundColor: colors.cardBackground,
    borderRadius: 16,
    padding: 16,
    marginTop: 10,
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
    gap: 4,
    marginBottom: 12,
  },
  mealSection: {
    backgroundColor: colors.cardBackground,
    borderRadius: 16,
    padding: 16,
    marginBottom: 4,
    position: 'relative',
  },
  mealContent: {
    flex: 1,
  },
  mealHeader: {
    flexDirection: 'row',
    justifyContent: 'space-between',
    alignItems: 'flex-start',
    marginBottom: 12,
  },
  mealLeft: {
    flexDirection: 'column',
    gap: 4,
  },
  mealTitleContainer: {
    flexDirection: 'row',
    alignItems: 'center',
    gap: 6,
  },
  mealRight: {
    flexDirection: 'row',
    alignItems: 'center',
    gap: 8,
  },
  mealTitle: {
    fontSize: 16,
    fontWeight: '700',
    color: colors.text,
  },
  mealTime: {
    fontSize: 13,
    fontWeight: '400',
    color: colors.text,
    textAlign: 'left',
  },
  mealCalories: {
    fontSize: 16,
    fontWeight: '700',
    color: colors.text,
    textAlign: 'center',
    lineHeight: 20,
  },
  foodTags: {
    flexDirection: 'row',
    flexWrap: 'wrap',
    gap: 8,
    marginTop: 4,
  },
  foodTag: {
    paddingVertical: 6,
    paddingHorizontal: 12,
    borderRadius: 7,
  },
  foodTagText: {
    fontSize: 13,
    fontWeight: '700',
    color: '#000000',
  },
  deleteButton: {
    padding: 4,
    justifyContent: 'center',
    alignItems: 'center',
  },
  // 탭 스타일
  tabHeaderContainer: {
    flexDirection: 'row',
    justifyContent: 'space-between',
    alignItems: 'center',
    marginTop: 12,
    marginBottom: 12,
    gap: 12,
  },
  tabContainer: {
    flexDirection: 'row',
    gap: 20,
    flex: 1,
  },
  tab: {
    paddingVertical: 4,
    paddingHorizontal: 0,
  },
  tabTextContainer: {
    flexDirection: 'row',
    alignItems: 'center',
    gap: 6,
  },
  tabText: {
    fontSize: 16,
    fontWeight: '600',
    color: colors.textLight,
  },
  tabTextActive: {
    color: '#e3ff7c',
    fontWeight: '700',
  },
  premiumBadge: {
    backgroundColor: colors.textLight,
    borderRadius: 4,
    paddingHorizontal: 6,
    paddingVertical: 2,
  },
  premiumBadgeGradient: {
    borderRadius: 4,
    paddingHorizontal: 6,
    paddingVertical: 2,
  },
  premiumBadgeText: {
    fontSize: 10,
    fontWeight: '700',
    color: '#000000',
    letterSpacing: 0.5,
  },
  premiumBadgeTextGray: {
    fontSize: 10,
    fontWeight: '700',
    color: colors.text,
    letterSpacing: 0.5,
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

  // 추천 식단 스타일 (식사 기록 없을 때)
  recommendationSection: {
    marginTop: 12,
    marginBottom: 20,
  },
  recommendationHeader: {
    flexDirection: 'row',
    alignItems: 'center',
    gap: 8,
    marginBottom: 8,
  },
  recommendationTitle: {
    fontSize: 16,
    fontWeight: '700',
    color: colors.text,
  },
  recommendationSubtitle: {
    fontSize: 14,
    color: colors.textLight,
    marginBottom: 12,
  },
  recommendationCards: {
    gap: 8,
    marginBottom: 16,
  },
  recommendationCard: {
    backgroundColor: colors.cardBackground,
    borderRadius: 12,
    padding: 16,
    borderWidth: 1,
    borderColor: 'rgba(227, 255, 124, 0.2)',
    position: 'relative',
  },
  recommendationCardHeader: {
    flexDirection: 'row',
    alignItems: 'center',
    justifyContent: 'space-between',
    gap: 12,
    marginBottom: 8,
  },
  recommendationEmoji: {
    fontSize: 32,
  },
  recommendationCardInfo: {
    flex: 1,
  },
  recommendationCardTitle: {
    fontSize: 15,
    fontWeight: '600',
    color: colors.text,
    marginBottom: 2,
  },
  recommendationCardCalories: {
    fontSize: 13,
    color: colors.textLight,
  },
  recommendationCardFoods: {
    flexDirection: 'row',
    flexWrap: 'wrap',
    paddingLeft: 44,
  },
  recommendationCardFoodName: {
    fontSize: 13,
    color: colors.textLight,
  },
  applyAllButton: {
    backgroundColor: '#e3ff7c',
    flexDirection: 'row',
    alignItems: 'center',
    justifyContent: 'center',
    paddingVertical: 14,
    borderRadius: 12,
    marginBottom: 8,
  },
  applyAllButtonText: {
    fontSize: 15,
    fontWeight: '700',
    color: '#000000',
  },

  // 저장된 플랜 섹션
  savedPlansSection: {
    marginTop: 12,
    marginBottom: 20,
  },
  savedPlansHeader: {
    flexDirection: 'row',
    alignItems: 'center',
    gap: 8,
    marginBottom: 12,
  },
  savedPlansTitle: {
    fontSize: 16,
    fontWeight: '700',
    color: colors.text,
  },
  savedPlanCard: {
    backgroundColor: colors.cardBackground,
    borderRadius: 12,
    padding: 16,
    marginBottom: 8,
    borderWidth: 1,
    borderColor: 'rgba(227, 255, 124, 0.2)',
  },
  savedPlanContent: {
    flexDirection: 'row',
    justifyContent: 'space-between',
    alignItems: 'center',
  },
  savedPlanInfo: {
    flex: 1,
  },
  savedPlanName: {
    fontSize: 15,
    fontWeight: '600',
    color: colors.text,
    marginBottom: 4,
  },
  savedPlanDescription: {
    fontSize: 13,
    color: colors.textLight,
  },

  // 추가 추천 섹션 (식사 있을 때)
  additionalRecommendationSection: {
    marginTop: 20,
    marginBottom: 20,
  },
  additionalRecommendationHeader: {
    flexDirection: 'row',
    alignItems: 'center',
    gap: 8,
    marginBottom: 8,
  },
  additionalRecommendationTitle: {
    fontSize: 16,
    fontWeight: '700',
    color: colors.text,
  },
  additionalRecommendationSubtitle: {
    fontSize: 13,
    color: colors.textLight,
    marginBottom: 16,
  },
  additionalRecommendationCards: {
    gap: 8,
    marginBottom: 16,
  },
  additionalRecommendationCard: {
    backgroundColor: colors.cardBackground,
    borderRadius: 16,
    padding: 16,
    borderWidth: 1,
    borderColor: 'rgba(227, 255, 124, 0.3)',
  },
  additionalRecommendationCardHeader: {
    flexDirection: 'row',
    alignItems: 'center',
    justifyContent: 'space-between',
    gap: 12,
    marginBottom: 12,
  },
  additionalRecommendationEmoji: {
    fontSize: 28,
  },
  additionalRecommendationCardInfo: {
    flex: 1,
  },
  additionalRecommendationCardTitle: {
    fontSize: 16,
    fontWeight: '600',
    color: colors.text,
    marginBottom: 2,
  },
  additionalRecommendationCardCalories: {
    fontSize: 13,
    color: colors.textLight,
  },
  quickAddButton: {
    padding: 4,
  },
  additionalRecommendationCardFoods: {
    flexDirection: 'row',
    flexWrap: 'wrap',
    paddingLeft: 40,
  },
  additionalRecommendationCardFoodName: {
    fontSize: 13,
    color: colors.textLight,
  },

  // 모달 스타일
  modalOverlay: {
    flex: 1,
    backgroundColor: 'rgba(0, 0, 0, 0.7)',
    justifyContent: 'flex-end',
  },
  modalContent: {
    backgroundColor: colors.cardBackground,
    borderTopLeftRadius: 24,
    borderTopRightRadius: 24,
    maxHeight: '80%',
  },
  modalHeader: {
    flexDirection: 'row',
    justifyContent: 'space-between',
    alignItems: 'center',
    padding: 20,
    borderBottomWidth: 1,
    borderBottomColor: 'rgba(255, 255, 255, 0.1)',
  },
  modalTitle: {
    fontSize: 18,
    fontWeight: '700',
    color: colors.text,
  },
  modalBody: {
    padding: 20,
  },
  dayCard: {
    backgroundColor: 'rgba(255, 255, 255, 0.05)',
    borderRadius: 12,
    padding: 16,
    marginBottom: 16,
  },
  dayTitle: {
    fontSize: 16,
    fontWeight: '700',
    color: colors.text,
    marginBottom: 12,
  },
  mealItem: {
    marginBottom: 12,
  },
  mealTypeName: {
    fontSize: 14,
    fontWeight: '600',
    color: colors.text,
    marginBottom: 6,
  },
  foodList: {
    paddingLeft: 8,
  },
  foodName: {
    fontSize: 13,
    color: colors.textLight,
    marginBottom: 2,
  },
  applyDayButton: {
    backgroundColor: '#e3ff7c',
    paddingVertical: 10,
    borderRadius: 8,
    alignItems: 'center',
    marginTop: 8,
  },
  applyDayButtonText: {
    fontSize: 14,
    fontWeight: '700',
    color: '#000000',
  },
});

export default DietScreen;

