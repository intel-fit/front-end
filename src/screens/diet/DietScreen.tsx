import React, { useState, useEffect } from "react";
import {
  View,
  Text,
  TouchableOpacity,
  StyleSheet,
  ScrollView,
  Alert,
  Modal,
} from "react-native";
import { Ionicons as Icon } from "@expo/vector-icons";
import { colors } from "../../theme/colors";
import { useDate } from "../../contexts/DateContext";
import { mealAPI, recommendedMealAPI } from "../../services";
import { useFocusEffect } from "@react-navigation/native";
import {
  fetchWeeklyProgress,
  fetchMonthlyProgress,
} from "../../utils/exerciseApi";
import type {
  DailyMealsResponse,
  DailyMeal,
  NutritionGoal,
  DailyProgressWeekItem,
  AddMealRequest,
} from "../../types";
import NutritionGoalModal from "../../components/modals/NutritionGoalModal";

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

interface MealUI {
  mealType: string;
  type: string;
  time: string;
  calories: number;
  foods: { name: string; color: string }[];
}

const DietScreen = ({ navigation, route }: any) => {
  // 달력 관련 상태
  const [monthBase, setMonthBase] = useState<Date>(new Date());
  const [showMonthView, setShowMonthView] = useState<boolean>(false);
  const { selectedDate, setSelectedDate } = useDate();

  // 영양소 데이터
  const [dailyMealsData, setDailyMealsData] =
    useState<DailyMealsResponse | null>(null);
  const [loading, setLoading] = useState<boolean>(false);
  const [nutritionGoal, setNutritionGoal] = useState<NutritionGoal | null>(
    null
  );
  const [isNutritionModalOpen, setIsNutritionModalOpen] =
    useState<boolean>(false);
  const [weeklyProgress, setWeeklyProgress] = useState<DailyProgressWeekItem[]>(
    []
  );
  const [monthlyProgress, setMonthlyProgress] = useState<
    DailyProgressWeekItem[]
  >([]);
  const [dailyCaloriesCache, setDailyCaloriesCache] = useState<
    Record<string, number>
  >({});

  // 추천 식단 관련 상태
  const [savedMealPlans, setSavedMealPlans] = useState<any[]>([]);
  const [selectedPlan, setSelectedPlan] = useState<SelectedPlan | null>(null);
  const [showPlanModal, setShowPlanModal] = useState<boolean>(false);
  const [recommendedMealsForSelectedDate, setRecommendedMealsForSelectedDate] =
    useState<any[]>([]);

  // 날짜 형식 변환 함수
  const formatDateToString = (date: Date): string => {
    const year = date.getFullYear();
    const month = String(date.getMonth() + 1).padStart(2, "0");
    const day = String(date.getDate()).padStart(2, "0");
    return `${year}-${month}-${day}`;
  };

  // 주간 데이터 로드
  const loadWeeklyProgress = async () => {
    try {
      const data = await fetchWeeklyProgress();
      setWeeklyProgress(Array.isArray(data) ? data : []);
    } catch (e) {
      console.error("주간 진행률 로드 실패:", e);
      setWeeklyProgress([]);
    }
  };

  // 월별 데이터 로드
  const loadMonthlyProgress = async (year: number, month: number) => {
    try {
      const yearMonth = `${year}-${String(month + 1).padStart(2, "0")}`;
      const data = await fetchMonthlyProgress(yearMonth);
      setMonthlyProgress(Array.isArray(data) ? data : []);
    } catch (e) {
      console.error("월별 진행률 로드 실패:", e);
      setMonthlyProgress([]);
    }
  };

  // 특정 날짜의 진행률 데이터 가져오기
  const getDayProgress = (date: Date): DailyProgressWeekItem | undefined => {
    const dateStr = formatDateToString(date);
    let progress =
      monthlyProgress.find((item) => item.date === dateStr) ||
      weeklyProgress.find((item) => item.date === dateStr);

    if (!progress) {
      progress = {
        date: dateStr,
        exerciseRate: 0,
        totalCalorie: 0,
      };
    }

    const cachedCalories = dailyCaloriesCache[dateStr];
    const isSelectedDate =
      selectedDate && dateStr === formatDateToString(selectedDate);
    const caloriesToUse =
      isSelectedDate && dailyMealsData
        ? dailyMealsData.dailyTotalCalories
        : cachedCalories;

    if (
      (!progress.totalCalorie || progress.totalCalorie === 0) &&
      caloriesToUse &&
      caloriesToUse > 0
    ) {
      return {
        ...progress,
        totalCalorie: caloriesToUse,
      };
    }

    return progress;
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
      console.error("저장된 식단 로드 실패:", error);
      setSavedMealPlans([]);
    }
  };

  // 선택된 날짜의 추천 식단 찾기
  const loadRecommendedMealsForDate = async (date: Date) => {
    try {
      if (savedMealPlans.length === 0) {
        setRecommendedMealsForSelectedDate([]);
        return;
      }

      const dateStr = formatDateToString(date);

      for (const plan of savedMealPlans) {
        const details = await recommendedMealAPI.getSavedMealPlansByBundle(
          plan.bundleId
        );

        const mealsForDate = details.filter(
          (meal: any) => meal.targetDate === dateStr
        );

        if (mealsForDate.length > 0) {
          const mealsWithBundleInfo = mealsForDate.map((meal: any) => ({
            ...meal,
            sourceBundleId: plan.bundleId,
            sourcePlanName: plan.planName,
          }));

          setRecommendedMealsForSelectedDate(mealsWithBundleInfo);
          return;
        }
      }

      setRecommendedMealsForSelectedDate([]);
    } catch (error) {
      console.error("날짜별 추천 식단 로드 실패:", error);
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
        Alert.alert("알림", "식단 정보가 없습니다.");
        return;
      }

      const dayMap = new Map<string, any>();

      response.forEach((meal: any) => {
        const dateStr = meal.targetDate;

        if (!dateStr) {
          console.warn("targetDate가 없는 끼니:", meal);
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
        planName: response[0]?.planName || "식단 플랜",
        days: sortedDays,
      });

      setShowPlanModal(true);
    } catch (error: any) {
      console.error("플랜 상세 조회 실패:", error);
      Alert.alert("오류", error.message || "플랜을 불러올 수 없습니다.");
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
        const addMealData: AddMealRequest = {
          mealDate: dateStr,
          mealType: meal.mealType as
            | "BREAKFAST"
            | "LUNCH"
            | "DINNER"
            | "SNACK"
            | "OTHER", // TS 타입 확장
          memo: `${
            selectedPlan?.planName || meal.sourcePlanName || "추천 식단"
          } - ${meal.mealTypeName}`,
          foods: (meal.foods || []).map((food: any) => ({
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
          })),
        };

        await mealAPI.addMeal(addMealData);
      }

      Alert.alert("성공", `${dayMeals.length}개 식사가 추가되었습니다!`, [
        {
          text: "확인",
          onPress: async () => {
            setShowPlanModal(false);
            setSelectedDate(targetDate);
            await fetchDailyMeals(targetDate);
            await loadRecommendedMealsForDate(targetDate);
          },
        },
      ]);
    } catch (error: any) {
      console.error("식단 적용 실패:", error);
      Alert.alert("오류", error.message || "식단 적용에 실패했습니다.");
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
      // 캘린더 표시를 위해 칼로리 캐시에 저장
      if (data && data.dailyTotalCalories > 0) {
        setDailyCaloriesCache((prev) => ({
          ...prev,
          [dateString]: data.dailyTotalCalories,
        }));
      }
    } catch (error: any) {
      console.error("일별 식단 조회 실패:", error);
      setDailyMealsData(null);
    } finally {
      setLoading(false);
    }
  };

  // 식사 삭제 핸들러
  const handleDeleteMeal = async (mealId: number) => {
    Alert.alert("식사 삭제", "이 식사를 삭제하시겠습니까?", [
      { text: "취소", style: "cancel" },
      {
        text: "삭제",
        style: "destructive",
        onPress: async () => {
          try {
            setLoading(true);
            const dateToFetch = selectedDate || new Date();

            await mealAPI.deleteMeal(mealId);
            Alert.alert("성공", "식사가 삭제되었습니다.");

            await fetchDailyMeals(dateToFetch);
            await loadRecommendedMealsForDate(dateToFetch);
          } catch (error: any) {
            console.error("식사 삭제 실패:", error);
            let errorMessage = "식사 삭제에 실패했습니다.";

            if (error.status === 404) {
              errorMessage = "삭제할 식사를 찾을 수 없습니다.";
            } else if (error.status === 403) {
              errorMessage = "삭제 권한이 없습니다.";
            } else if (error.message) {
              errorMessage = error.message;
            }

            Alert.alert("오류", errorMessage);
          } finally {
            setLoading(false);
          }
        },
      },
    ]);
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
    if (route?.params?.updatedProgress) {
      const progress: DailyProgressWeekItem = route.params.updatedProgress;
      const dateStr: string = route.params.updatedDate;

      if (progress) {
        const progressDateStr = progress.date;
        setWeeklyProgress((prev) => {
          const filtered = prev.filter((item) => item.date !== progressDateStr);
          return [...filtered, progress];
        });
        setMonthlyProgress((prev) => {
          const filtered = prev.filter((item) => item.date !== progressDateStr);
          return [...filtered, progress];
        });
      }

      if (dateStr) {
        const date = new Date(dateStr);
        setSelectedDate(date);
        // 식사 추가 후 해당 달의 월별 진행률 API 호출
        loadMonthlyProgress(date.getFullYear(), date.getMonth());
      }

      navigation.setParams({
        updatedProgress: undefined,
        updatedDate: undefined,
      });
    }
  }, [route?.params?.updatedProgress, route?.params?.updatedDate, navigation]);

  // 화면 포커스 시 데이터 새로고침
  // 다른 페이지에 갔다 오거나 운동 기록을 갔다 왔을 때, 탭 바꾸기 등 모든 행동 시
  useFocusEffect(
    React.useCallback(() => {
      const dateToFetch = selectedDate || new Date();
      fetchDailyMeals(dateToFetch);
      loadWeeklyProgress();

      loadSavedMealPlans().then(() => {
        loadRecommendedMealsForDate(dateToFetch);
      });

      loadMonthlyProgress(dateToFetch.getFullYear(), dateToFetch.getMonth());
      // eslint-disable-next-line react-hooks/exhaustive-deps
    }, [selectedDate])
  );

  // 초기 데이터 로드
  useEffect(() => {
    const dateToFetch = selectedDate || new Date();
    loadWeeklyProgress();
    loadMonthlyProgress(dateToFetch.getFullYear(), dateToFetch.getMonth());
  }, []);

  // monthBase가 변경될 때 월별 데이터 로드
  useEffect(() => {
    if (showMonthView) {
      loadMonthlyProgress(monthBase.getFullYear(), monthBase.getMonth());
    }
  }, [monthBase, showMonthView]);

  // 달력을 펼치거나 접을 때 해당 달의 월별 데이터 가져오기
  useEffect(() => {
    const dateToFetch = selectedDate || new Date();
    if (showMonthView) {
      // 달력을 펼칠 때 monthBase의 달 데이터 가져오기
      loadMonthlyProgress(monthBase.getFullYear(), monthBase.getMonth());
    } else {
      // 달력을 접을 때 선택된 날짜의 달 데이터 가져오기 (주간 달력 표시 시)
      loadMonthlyProgress(dateToFetch.getFullYear(), dateToFetch.getMonth());
    }
  }, [showMonthView, selectedDate]);

  // 선택된 날짜가 변경될 때 해당 달의 월별 데이터 가져오기
  useEffect(() => {
    const dateToFetch = selectedDate || new Date();
    loadMonthlyProgress(dateToFetch.getFullYear(), dateToFetch.getMonth());
  }, [selectedDate]);

  // 영양 목표 로드
  const loadNutritionGoal = async () => {
    try {
      const data = await mealAPI.getNutritionGoal();
      setNutritionGoal(data);
    } catch (e: any) {
      console.error("영양 목표 로드 실패:", e);
      if (e?.status !== 401) {
        // API에서 자동 생성되므로 잠시 후 재시도
        setTimeout(async () => {
          try {
            const retryData = await mealAPI.getNutritionGoal();
            setNutritionGoal(retryData);
          } catch (retryError) {
            console.error("영양 목표 재시도 실패:", retryError);
            if (!nutritionGoal) {
              setNutritionGoal({
                id: 0,
                targetCalories: 0,
                targetCarbs: 0,
                targetProtein: 0,
                targetFat: 0,
                goalType: "AUTO",
                goalTypeDescription: "자동 계산",
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

  // API 데이터를 UI 형식으로 변환
  const targetCalories = nutritionGoal?.targetCalories || 0;
  const targetCarbs = nutritionGoal?.targetCarbs || 0;
  const targetProtein = nutritionGoal?.targetProtein || 0;
  const targetFat = nutritionGoal?.targetFat || 0;

  const nutritionData = dailyMealsData
    ? {
        total: dailyMealsData.dailyTotalCalories,
        target: targetCalories,
        percentage:
          targetCalories > 0
            ? Math.round(
                (dailyMealsData.dailyTotalCalories / targetCalories) * 100
              )
            : 0,
        carbs: {
          current: dailyMealsData.dailyTotalCarbs,
          target: targetCarbs,
        },
        protein: {
          current: dailyMealsData.dailyTotalProtein,
          target: targetProtein,
        },
        fat: {
          current: dailyMealsData.dailyTotalFat,
          target: targetFat,
        },
      }
    : {
        total: 0,
        target: targetCalories,
        percentage: 0,
        carbs: { current: 0, target: targetCarbs },
        protein: { current: 0, target: targetProtein },
        fat: { current: 0, target: targetFat },
      };

  // 식사 목록 변환
  const meals: MealUI[] =
    dailyMealsData?.meals.map((meal: DailyMeal) => {
      const mealTypeMap: Record<string, string> = {
        BREAKFAST: "아침",
        LUNCH: "점심",
        DINNER: "저녁",
        SNACK: "야식",
        OTHER: "기타",
      };

      const mealTime = meal.createdAt
        ? new Date(meal.createdAt).toLocaleTimeString("ko-KR", {
            hour: "2-digit",
            minute: "2-digit",
            hour12: true,
          })
        : "추천 식단";

      return {
        mealType: meal.mealType,
        type:
          meal.memo ||
          mealTypeMap[meal.mealType] ||
          meal.mealTypeName ||
          "기타",
        time: mealTime,
        calories: meal.totalCalories,
        foods: meal.foods.map((food) => ({
          name: food.foodName,
          color: "#e3ff7c",
        })),
      };
    }) || [];

  // 기록 안 된 끼니의 추천만 필터링
  const getAvailableRecommendations = () => {
    if (recommendedMealsForSelectedDate.length === 0) return [];

    const recordedMealTypes = new Set(meals.map((meal) => meal.mealType));

    return recommendedMealsForSelectedDate.filter(
      (recommended: any) => !recordedMealTypes.has(recommended.mealType)
    );
  };

  const availableRecommendations = getAvailableRecommendations();

  // ✅ UI 표시 조건 변수 (수정된 로직 반영)
  const shouldShowFullRecommendation =
    meals.length === 0 && recommendedMealsForSelectedDate.length > 0;

  const shouldShowPartialRecommendation =
    meals.length > 0 && availableRecommendations.length > 0;

  const shouldShowSavedPlans =
    meals.length === 0 &&
    recommendedMealsForSelectedDate.length === 0 &&
    savedMealPlans.length > 0;

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
                    setMonthBase(
                      (prev) =>
                        new Date(prev.getFullYear(), prev.getMonth() - 1, 1)
                    )
                  }
                >
                  <Icon name="chevron-back" size={18} color={colors.text} />
                </TouchableOpacity>
                <Text style={styles.monthText}>{`${
                  monthBase.getMonth() + 1
                }월`}</Text>
                <TouchableOpacity
                  style={styles.navBtn}
                  onPress={() =>
                    setMonthBase(
                      (prev) =>
                        new Date(prev.getFullYear(), prev.getMonth() + 1, 1)
                    )
                  }
                >
                  <Icon name="chevron-forward" size={18} color={colors.text} />
                </TouchableOpacity>
              </>
            )}
            {!showMonthView && (
              <Text style={styles.monthText}>{`${
                monthBase.getMonth() + 1
              }월`}</Text>
            )}
          </View>
          <TouchableOpacity
            style={styles.menuBtn}
            onPress={() => {
              setShowMonthView((prev) => {
                const next = !prev;
                if (!next) setMonthBase(new Date());
                return next;
              });
            }}
          >
            <Icon name="menu" size={20} color={colors.text} />
          </TouchableOpacity>
        </View>

        {/* 확장 달력 */}
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
              const firstOfMonth = new Date(
                monthBase.getFullYear(),
                monthBase.getMonth(),
                1
              );
              const gridStart = getStartOfWeek(firstOfMonth);
              const nextMonth = new Date(
                monthBase.getFullYear(),
                monthBase.getMonth() + 1,
                1
              );
              const daysInMonth = Math.round(
                (nextMonth.getTime() - firstOfMonth.getTime()) /
                  (1000 * 60 * 60 * 24)
              );
              const offset = firstOfMonth.getDay();
              const totalCells = Math.ceil((offset + daysInMonth) / 7) * 7;
              const days = Array.from({ length: totalCells }).map((_, i) => {
                const d = new Date(
                  gridStart.getFullYear(),
                  gridStart.getMonth(),
                  gridStart.getDate() + i
                );
                const isToday = d.toDateString() === today.toDateString();
                const isCurrentMonth = d.getMonth() === monthBase.getMonth();
                return {
                  key: d.toISOString().slice(0, 10),
                  d,
                  isToday,
                  isCurrentMonth,
                };
              });
              return (
                <View style={styles.monthGrid}>
                  {days.map(({ key, d, isToday, isCurrentMonth }) => {
                    const isSelected =
                      selectedDate &&
                      d.toDateString() === selectedDate.toDateString();
                    return (
                      <TouchableOpacity
                        key={key}
                        style={styles.monthCell}
                        onPress={() => {
                          setSelectedDate(d);
                          setShowMonthView(false);
                          setMonthBase(
                            new Date(d.getFullYear(), d.getMonth(), 1)
                          );
                        }}
                        activeOpacity={0.7}
                      >
                        <View
                          style={[
                            styles.monthDateBadge,
                            isSelected && styles.monthDateBadgeToday,
                          ]}
                        >
                          <Text
                            style={[
                              styles.monthDateText,
                              isSelected && styles.monthDateTextToday,
                              !isCurrentMonth && styles.monthDateTextMuted,
                            ]}
                          >
                            {d.getDate()}
                          </Text>
                        </View>
                        {(() => {
                          const dayProgress = getDayProgress(d);
                          const calories = dayProgress?.totalCalorie || 0;
                          const rate = dayProgress?.exerciseRate || 0;
                          return (
                            <>
                              <Text
                                style={[
                                  styles.calendarCalories,
                                  !isCurrentMonth && styles.monthMuted,
                                ]}
                              >
                                {calories > 0 ? `${Math.round(calories)}k` : ""}
                              </Text>
                              <Text
                                style={[
                                  styles.calendarPercentage,
                                  !isCurrentMonth && styles.monthMuted,
                                ]}
                              >
                                {rate > 0 ? `${Math.round(rate)}%` : ""}
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

        {/* 7일 캘린더 */}
        {!showMonthView && (
          <View style={styles.weekCalendar}>
            <View style={styles.calendarGrid}>
              {(() => {
                const today = new Date();
                const getStartOfWeek = (d: Date) => {
                  const n = new Date(
                    d.getFullYear(),
                    d.getMonth(),
                    d.getDate()
                  );
                  const diff = n.getDay();
                  n.setDate(n.getDate() - diff);
                  return n;
                };
                const dateToShow = selectedDate || today;
                const startThis = getStartOfWeek(dateToShow);
                return Array.from({ length: 7 }).map((_, i) => {
                  const d = new Date(
                    startThis.getFullYear(),
                    startThis.getMonth(),
                    startThis.getDate() + i
                  );
                  const isToday = d.toDateString() === today.toDateString();
                  const isSelected =
                    selectedDate &&
                    d.toDateString() === selectedDate.toDateString();
                  return (
                    <TouchableOpacity
                      key={startThis.toISOString() + i}
                      style={styles.calendarItem}
                      onPress={() => setSelectedDate(d)}
                      activeOpacity={0.7}
                    >
                      <View style={styles.calendarNumber}>
                        <View
                          style={[
                            styles.calendarNumberInner,
                            isSelected && styles.calendarNumberSelected,
                            isToday && styles.calendarNumberToday,
                          ]}
                        >
                          <Text
                            style={[
                              styles.calendarNumberText,
                              isSelected && styles.calendarNumberSelectedText,
                              isToday && styles.calendarNumberTextToday,
                            ]}
                          >
                            {d.getDate()}
                          </Text>
                        </View>
                      </View>
                      {(() => {
                        const dayProgress = getDayProgress(d);
                        const calories = dayProgress?.totalCalorie || 0;
                        const rate = dayProgress?.exerciseRate || 0;
                        return (
                          <>
                            <Text style={styles.calendarCalories}>
                              {calories > 0 ? `${Math.round(calories)}k` : ""}
                            </Text>
                            <Text style={styles.calendarPercentage}>
                              {rate > 0 ? `${Math.round(rate)}%` : ""}
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

        {/* 칼로리 섹션 */}
        <View style={styles.calorieSection}>
          {/* 칼로리 헤더: 현재 칼로리 / 목표 칼로리, 달성률 */}
          <View style={styles.calorieHeader}>
            <View style={styles.calorieMain}>
              <Text style={styles.calorieNumber}>{nutritionData.total}</Text>
              <Text style={styles.calorieUnit}>
                {" "}
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
                onPress={() => setIsNutritionModalOpen(true)}
              >
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
                  { width: `${nutritionData.percentage}%` },
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
                  {nutritionData.protein.current} /{" "}
                  {nutritionData.protein.target}g
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
                          ? (nutritionData.fat.current /
                              nutritionData.fat.target) *
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

        {/* 식단 기록하기 섹션 */}
        <View style={styles.addMealSection}>
          <View style={styles.mealRecordHeader}>
            <Text style={styles.mealRecordTitle}>식단 기록하기</Text>
            <TouchableOpacity
              style={styles.addButton}
              onPress={() => {
                // 선택한 날짜를 MealAddScreen으로 전달 (문자열로 변환하여 전달)
                const dateToPass = selectedDate || new Date();
                const dateString = formatDateToString(dateToPass);
                navigation.navigate("MealAdd", { selectedDate: dateString });
              }}
            >
              <Icon name="add" size={18} color={colors.text} />
            </TouchableOpacity>
          </View>
        </View>

        {/* 식사 기록이 없을 때: 전체 추천 식단 */}
        {shouldShowFullRecommendation && (
          <View style={styles.recommendationSection}>
            <View style={styles.recommendationHeader}>
              <Icon name="sparkles" size={20} color="#e3ff7c" />
              <Text style={styles.recommendationTitle}>추천 식단</Text>
            </View>

            <Text style={styles.recommendationSubtitle}>
              {recommendedMealsForSelectedDate[0]?.sourcePlanName ||
                "AI 추천 식단"}
            </Text>

            <View style={styles.recommendationCards}>
              {recommendedMealsForSelectedDate
                .sort((a, b) => {
                  const order: { [key: string]: number } = {
                    BREAKFAST: 0,
                    LUNCH: 1,
                    DINNER: 2,
                  };
                  return order[a.mealType] - order[b.mealType];
                })
                .map((meal: any, index: number) => (
                  <View key={index} style={styles.recommendationCard}>
                    <View style={styles.recommendationCardHeader}>
                      <Text style={styles.recommendationEmoji}>
                        {meal.mealType === "BREAKFAST"
                          ? "🌅"
                          : meal.mealType === "LUNCH"
                          ? "☀️"
                          : "🌙"}
                      </Text>
                      <View style={styles.recommendationCardInfo}>
                        <Text style={styles.recommendationCardTitle}>
                          {meal.mealTypeName}
                        </Text>
                        <Text style={styles.recommendationCardCalories}>
                          {meal.totalCalories}kcal
                        </Text>
                      </View>
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
                              ", "}
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

            <TouchableOpacity
              style={styles.applyAllButton}
              onPress={async () => {
                const targetDate = selectedDate || new Date();
                await handleApplyPlanToDate(
                  recommendedMealsForSelectedDate,
                  targetDate
                );
              }}
            >
              <Icon
                name="add-circle"
                size={20}
                color="#000000"
                style={{ marginRight: 8 }}
              />
              <Text style={styles.applyAllButtonText}>
                이 식단 적용하기 ({recommendedMealsForSelectedDate.length}끼)
              </Text>
            </TouchableOpacity>
          </View>
        )}

        {/* 추천 식단이 없지만 저장된 플랜은 있을 때 */}
        {shouldShowSavedPlans && (
          <View style={styles.savedPlansSection}>
            <View style={styles.savedPlansHeader}>
              <Icon name="restaurant" size={20} color="#e3ff7c" />
              <Text style={styles.savedPlansTitle}>저장된 식단 플랜</Text>
            </View>

            {savedMealPlans.slice(0, 3).map((plan: any) => (
              <TouchableOpacity
                key={plan.bundleId}
                style={styles.savedPlanCard}
                onPress={() => loadPlanDetails(plan.bundleId)}
                activeOpacity={0.7}
              >
                <View style={styles.savedPlanContent}>
                  <View style={styles.savedPlanInfo}>
                    <Text style={styles.savedPlanName}>{plan.planName}</Text>
                    <Text style={styles.savedPlanDescription}>
                      {plan.description} · 평균 {plan.avgCalories}kcal
                    </Text>
                  </View>
                  <Icon name="chevron-forward" size={20} color="#6b7280" />
                </View>
              </TouchableOpacity>
            ))}
          </View>
        )}

        {/* 식사별 섹션 */}
        <View style={styles.mealsContainer}>
          {meals.map((meal, index) => {
            const originalMeal = dailyMealsData?.meals[index];
            return (
              <View key={index} style={styles.mealSection}>
                <TouchableOpacity
                  style={styles.mealContent}
                  onPress={() => {
                    if (originalMeal) {
                      navigation.navigate("MealAdd", { meal: originalMeal });
                    }
                  }}
                  activeOpacity={0.7}
                >
                  <View style={styles.mealHeader}>
                    <View style={styles.mealLeft}>
                      <Text style={styles.mealTitle}>{meal.type}</Text>
                      <Text style={styles.mealTime}>{meal.time}</Text>
                    </View>
                    {/* 해당 식사의 총 칼로리 및 삭제 버튼 */}
                    <View style={styles.mealRight}>
                      <Text style={styles.mealCalories}>
                        {meal.calories} kcal
                      </Text>
                      {originalMeal && (
                        <TouchableOpacity
                          style={styles.deleteButton}
                          onPress={(e) => {
                            e.stopPropagation();
                            handleDeleteMeal(originalMeal.id);
                          }}
                          activeOpacity={0.7}
                        >
                          <Icon
                            name="trash-outline"
                            size={20}
                            color={colors.textLight}
                          />
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
                          { backgroundColor: food.color },
                        ]}
                      >
                        <Text style={styles.foodTagText} numberOfLines={2}>
                          {food.name}
                        </Text>
                      </View>
                    ))}
                  </View>
                </TouchableOpacity>
              </View>
            );
          })}
        </View>

        {/* 기록 안 된 끼니의 추천 식단 */}
        {shouldShowPartialRecommendation && (
          <View style={styles.additionalRecommendationSection}>
            <View style={styles.additionalRecommendationHeader}>
              <Icon name="bulb-outline" size={20} color="#e3ff7c" />
              <Text style={styles.additionalRecommendationTitle}>
                아직 기록하지 않은 끼니 추천
              </Text>
            </View>

            <Text style={styles.additionalRecommendationSubtitle}>
              {availableRecommendations[0]?.sourcePlanName || "AI 추천 식단"}
            </Text>

            <View style={styles.additionalRecommendationCards}>
              {availableRecommendations
                .sort((a, b) => {
                  const order: { [key: string]: number } = {
                    BREAKFAST: 0,
                    LUNCH: 1,
                    DINNER: 2,
                  };
                  return order[a.mealType] - order[b.mealType];
                })
                .map((meal: any, index: number) => (
                  <View key={index} style={styles.additionalRecommendationCard}>
                    <View style={styles.additionalRecommendationCardHeader}>
                      <Text style={styles.additionalRecommendationEmoji}>
                        {meal.mealType === "BREAKFAST"
                          ? "🌅"
                          : meal.mealType === "LUNCH"
                          ? "☀️"
                          : "🌙"}
                      </Text>
                      <View style={styles.additionalRecommendationCardInfo}>
                        <Text style={styles.additionalRecommendationCardTitle}>
                          {meal.mealTypeName}
                        </Text>
                        <Text
                          style={styles.additionalRecommendationCardCalories}
                        >
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
                    <View style={styles.additionalRecommendationCardFoods}>
                      {meal.foods
                        ?.slice(0, 3)
                        .map((food: any, foodIdx: number) => (
                          <Text
                            key={foodIdx}
                            style={styles.additionalRecommendationCardFoodName}
                          >
                            {food.foodName}
                            {foodIdx < Math.min(meal.foods.length - 1, 2) &&
                              ", "}
                          </Text>
                        ))}
                      {meal.foods?.length > 3 && (
                        <Text
                          style={styles.additionalRecommendationCardFoodName}
                        >
                          외 {meal.foods.length - 3}개
                        </Text>
                      )}
                    </View>
                  </View>
                ))}
            </View>
          </View>
        )}
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
                {selectedPlan?.planName || "식단 플랜"}
              </Text>
              <TouchableOpacity onPress={() => setShowPlanModal(false)}>
                <Icon name="close" size={24} color={colors.text} />
              </TouchableOpacity>
            </View>

            <ScrollView style={styles.modalBody}>
              {selectedPlan?.days.map((day: MealPlanDay, index: number) => (
                <View key={index} style={styles.dayCard}>
                  <Text style={styles.dayTitle}>
                    {day.bundleDay || index + 1}일차 ({day.date})
                  </Text>

                  {day.meals.map((meal: any, mealIdx: number) => (
                    <View key={mealIdx} style={styles.mealItem}>
                      <Text style={styles.mealTypeName}>
                        {meal.mealTypeName} ({meal.totalCalories}kcal)
                      </Text>
                      <View style={styles.foodList}>
                        {meal.foods?.map((food: any, foodIdx: number) => (
                          <Text key={foodIdx} style={styles.foodName}>
                            · {food.foodName}
                          </Text>
                        ))}
                      </View>
                    </View>
                  ))}

                  <TouchableOpacity
                    style={styles.applyDayButton}
                    onPress={() => {
                      const targetDate = new Date(day.date);
                      handleApplyPlanToDate(day.meals, targetDate);
                    }}
                  >
                    <Text style={styles.applyDayButtonText}>
                      {day.date}에 적용하기
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
    flexDirection: "row",
    justifyContent: "space-between",
    alignItems: "center",
    marginBottom: 0,
    paddingBottom: 6,
    paddingTop: 0,
  },
  monthNavLeft: {
    flexDirection: "row",
    alignItems: "center",
    gap: 0,
  },
  navBtn: {
    backgroundColor: "transparent",
    padding: 0,
  },
  monthText: {
    fontSize: 18,
    fontWeight: "800",
    color: colors.text,
    lineHeight: 22,
  },
  menuBtn: {
    backgroundColor: "transparent",
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
    flexDirection: "row",
    justifyContent: "space-between",
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
    flexDirection: "row",
    flexWrap: "wrap",
  },
  monthCell: {
    width: `${100 / 7}%`,
    paddingVertical: 6,
    alignItems: "center",
  },
  monthDateBadge: {
    minWidth: 28,
    height: 28,
    borderRadius: 14,
    justifyContent: "center",
    alignItems: "center",
  },
  monthDateBadgeToday: {
    backgroundColor: "#ffffff",
  },
  monthDateText: {
    color: "#e3ff7c",
    fontSize: 16,
    fontWeight: "700",
    lineHeight: 19,
    textAlign: "center",
  },
  monthDateTextToday: {
    color: "#000",
  },
  monthDateTextMuted: {
    color: "#777777",
  },
  monthMuted: {
    color: "#777777",
  },
  calendarItem: {
    flex: 1,
    alignItems: "center",
    justifyContent: "flex-start",
    gap: 6,
    minHeight: 79,
  },
  calendarNumber: {
    width: 32,
    height: 32,
    justifyContent: "center",
    alignItems: "center",
    marginBottom: 4,
  },
  calendarNumberInner: {
    width: 28,
    height: 28,
    borderRadius: 14,
    justifyContent: "center",
    alignItems: "center",
    backgroundColor: "transparent",
  },
  calendarNumberSelected: {
    backgroundColor: "#e3ff7c",
  },
  calendarNumberToday: {
    backgroundColor: "#e3ff7c",
  },
  calendarNumberText: {
    fontSize: 16,
    fontWeight: "700",
    color: "#e3ff7c",
    lineHeight: 19,
    textAlign: "center",
  },
  calendarNumberTextToday: {
    fontSize: 16,
    fontWeight: "700",
    color: "#1c1c1c",
    lineHeight: 19,
    textAlign: "center",
  },
  calendarNumberSelectedText: {
    color: "#000000",
    fontWeight: "700",
  },
  calendarCalories: {
    fontSize: 12,
    fontWeight: "400",
    color: colors.text,
    textAlign: "center",
    height: 15,
    lineHeight: 14.52,
  },
  calendarPercentage: {
    fontSize: 12,
    fontWeight: "400",
    color: colors.text,
    textAlign: "center",
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
    flexDirection: "row",
    justifyContent: "space-between",
    alignItems: "center",
    marginBottom: 12,
  },
  calorieHeaderRight: {
    flexDirection: "row",
    alignItems: "center",
    gap: 12,
  },
  nutritionButton: {
    width: 32,
    height: 32,
    borderRadius: 16,
    backgroundColor: colors.cardBackground,
    justifyContent: "center",
    alignItems: "center",
  },
  calorieMain: {
    flexDirection: "row",
    alignItems: "baseline",
    gap: 6,
  },
  calorieNumber: {
    fontSize: 18,
    fontWeight: "700",
    color: colors.text,
    lineHeight: 22,
  },
  calorieUnit: {
    fontSize: 11,
    fontWeight: "400",
    color: colors.text,
  },
  caloriePercentage: {
    fontSize: 14,
    fontWeight: "700",
    color: colors.text,
  },
  progressBarContainer: {
    marginBottom: 12,
  },
  progressBar: {
    height: 32,
    backgroundColor: "rgba(255, 255, 255, 0.1)",
    borderRadius: 8,
    overflow: "hidden",
  },
  progressFill: {
    height: "100%",
    backgroundColor: "#e3ff7c",
    borderRadius: 8,
  },
  nutritionBars: {
    flexDirection: "row",
    gap: 12,
    width: "100%",
  },
  nutritionItem: {
    flex: 1,
    padding: 8,
    borderRadius: 5,
    minHeight: 40,
    justifyContent: "center",
    gap: 8,
  },
  nutritionRow: {
    flexDirection: "row",
    justifyContent: "space-between",
    alignItems: "center",
    marginBottom: 6,
  },
  nutritionLabel: {
    fontSize: 9,
    fontWeight: "700",
    color: colors.text,
    lineHeight: 11,
  },
  nutritionValue: {
    fontSize: 9,
    fontWeight: "400",
    color: colors.text,
    lineHeight: 11,
  },
  nutritionProgress: {
    width: "100%",
    height: 6,
    backgroundColor: "rgba(255, 255, 255, 0.2)",
    borderRadius: 3,
    overflow: "hidden",
  },
  nutritionProgressFill: {
    height: "100%",
    backgroundColor: "#e3ff7c",
    borderRadius: 3,
  },
  mealsContainer: {
    gap: 4,
    marginBottom: 12,
  },
  mealSection: {
    backgroundColor: colors.cardBackground,
    borderRadius: 20,
    padding: 20,
    marginBottom: 4,
    position: "relative",
  },
  mealContent: {
    flex: 1,
  },
  mealHeader: {
    flexDirection: "row",
    justifyContent: "space-between",
    alignItems: "flex-start",
    marginBottom: 15,
  },
  mealLeft: {
    flexDirection: "column",
    gap: 5,
  },
  mealRight: {
    flexDirection: "row",
    alignItems: "center",
    gap: 12,
  },
  mealTitle: {
    fontSize: 20,
    fontWeight: "700",
    color: colors.text,
  },
  mealTime: {
    fontSize: 15,
    fontWeight: "400",
    color: colors.text,
    textAlign: "left",
  },
  mealCalories: {
    fontSize: 20,
    fontWeight: "700",
    color: colors.text,
    textAlign: "center",
    lineHeight: 24,
  },
  foodTags: {
    flexDirection: "row",
    flexWrap: "wrap",
    gap: 10,
  },
  foodTag: {
    paddingVertical: 8,
    paddingHorizontal: 16,
    borderRadius: 10,
  },
  foodTagText: {
    fontSize: 15,
    fontWeight: "700",
    color: "#000000",
  },
  deleteButton: {
    padding: 4,
    justifyContent: "center",
    alignItems: "center",
  },
  addMealSection: {
    marginTop: 0,
    marginBottom: 12,
  },
  mealRecordHeader: {
    flexDirection: "row",
    justifyContent: "space-between",
    alignItems: "center",
    paddingVertical: 12,
  },
  mealRecordTitle: {
    color: colors.text,
    fontSize: 18,
    fontWeight: "700",
  },
  addButton: {
    width: 32,
    height: 32,
    borderRadius: 16,
    backgroundColor: colors.cardBackground,
    justifyContent: "center",
    alignItems: "center",
  },

  // 추천 식단 스타일 (식사 기록 없을 때)
  recommendationSection: {
    marginTop: 12,
    marginBottom: 20,
  },
  recommendationHeader: {
    flexDirection: "row",
    alignItems: "center",
    gap: 8,
    marginBottom: 8,
  },
  recommendationTitle: {
    fontSize: 16,
    fontWeight: "700",
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
    borderColor: "rgba(227, 255, 124, 0.2)",
  },
  recommendationCardHeader: {
    flexDirection: "row",
    alignItems: "center",
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
    fontWeight: "600",
    color: colors.text,
    marginBottom: 2,
  },
  recommendationCardCalories: {
    fontSize: 13,
    color: colors.textLight,
  },
  recommendationCardFoods: {
    flexDirection: "row",
    flexWrap: "wrap",
    paddingLeft: 44,
  },
  recommendationCardFoodName: {
    fontSize: 13,
    color: colors.textLight,
  },
  applyAllButton: {
    backgroundColor: "#e3ff7c",
    flexDirection: "row",
    alignItems: "center",
    justifyContent: "center",
    paddingVertical: 14,
    borderRadius: 12,
    marginBottom: 8,
  },
  applyAllButtonText: {
    fontSize: 15,
    fontWeight: "700",
    color: "#000000",
  },
  viewPlanButton: {
    paddingVertical: 12,
    alignItems: "center",
  },
  viewPlanText: {
    fontSize: 14,
    color: "#e3ff7c",
    fontWeight: "600",
  },

  // 저장된 플랜 섹션
  savedPlansSection: {
    marginTop: 12,
    marginBottom: 20,
  },
  savedPlansHeader: {
    flexDirection: "row",
    alignItems: "center",
    gap: 8,
    marginBottom: 12,
  },
  savedPlansTitle: {
    fontSize: 16,
    fontWeight: "700",
    color: colors.text,
  },
  savedPlanCard: {
    backgroundColor: colors.cardBackground,
    borderRadius: 12,
    padding: 16,
    marginBottom: 8,
    borderWidth: 1,
    borderColor: "rgba(227, 255, 124, 0.2)",
  },
  savedPlanContent: {
    flexDirection: "row",
    justifyContent: "space-between",
    alignItems: "center",
  },
  savedPlanInfo: {
    flex: 1,
  },
  savedPlanName: {
    fontSize: 15,
    fontWeight: "600",
    color: colors.text,
    marginBottom: 4,
  },
  savedPlanDescription: {
    fontSize: 13,
    color: colors.textLight,
  },
  viewMoreButton: {
    paddingVertical: 12,
    alignItems: "center",
  },
  viewMoreText: {
    fontSize: 14,
    color: "#e3ff7c",
    fontWeight: "600",
  },

  // 추가 추천 섹션 (식사 있을 때)
  additionalRecommendationSection: {
    marginTop: 20,
    marginBottom: 20,
  },
  additionalRecommendationHeader: {
    flexDirection: "row",
    alignItems: "center",
    gap: 8,
    marginBottom: 8,
  },
  additionalRecommendationTitle: {
    fontSize: 16,
    fontWeight: "700",
    color: colors.text,
  },
  additionalRecommendationSubtitle: {
    fontSize: 13,
    color: colors.textLight,
    marginBottom: 16,
  },
  additionalRecommendationCards: {
    gap: 12,
    marginBottom: 16,
  },
  additionalRecommendationCard: {
    backgroundColor: colors.cardBackground,
    borderRadius: 16,
    padding: 16,
    borderWidth: 1,
    borderColor: "rgba(227, 255, 124, 0.3)",
  },
  additionalRecommendationCardHeader: {
    flexDirection: "row",
    alignItems: "center",
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
    fontWeight: "600",
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
    flexDirection: "row",
    flexWrap: "wrap",
    paddingLeft: 40,
  },
  additionalRecommendationCardFoodName: {
    fontSize: 13,
    color: colors.textLight,
  },
  viewFullPlanButton: {
    flexDirection: "row",
    alignItems: "center",
    justifyContent: "center",
    paddingVertical: 12,
    gap: 4,
  },
  viewFullPlanText: {
    fontSize: 14,
    color: "#e3ff7c",
    fontWeight: "600",
  },

  // 모달 스타일
  modalOverlay: {
    flex: 1,
    backgroundColor: "rgba(0, 0, 0, 0.7)",
    justifyContent: "flex-end",
  },
  modalContent: {
    backgroundColor: colors.cardBackground,
    borderTopLeftRadius: 24,
    borderTopRightRadius: 24,
    maxHeight: "80%",
  },
  modalHeader: {
    flexDirection: "row",
    justifyContent: "space-between",
    alignItems: "center",
    padding: 20,
    borderBottomWidth: 1,
    borderBottomColor: "rgba(255, 255, 255, 0.1)",
  },
  modalTitle: {
    fontSize: 18,
    fontWeight: "700",
    color: colors.text,
  },
  modalBody: {
    padding: 20,
  },
  dayCard: {
    backgroundColor: "rgba(255, 255, 255, 0.05)",
    borderRadius: 12,
    padding: 16,
    marginBottom: 16,
  },
  dayTitle: {
    fontSize: 16,
    fontWeight: "700",
    color: colors.text,
    marginBottom: 12,
  },
  mealItem: {
    marginBottom: 12,
  },
  mealTypeName: {
    fontSize: 14,
    fontWeight: "600",
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
    backgroundColor: "#e3ff7c",
    paddingVertical: 10,
    borderRadius: 8,
    alignItems: "center",
    marginTop: 8,
  },
  applyDayButtonText: {
    fontSize: 14,
    fontWeight: "700",
    color: "#000000",
  },
});

export default DietScreen;
