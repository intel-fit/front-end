// src/screens/diet/MealRecommendScreen.tsx
import React, { useState, useEffect, useRef } from "react";
import {
  View,
  Text,
  StyleSheet,
  ScrollView,
  TouchableOpacity,
  TextInput,
  Alert,
  ActivityIndicator,
  Modal,
  Animated,
  Easing,
  Dimensions,
} from "react-native";
import { SafeAreaView } from "react-native-safe-area-context";
import { Ionicons as Icon } from "@expo/vector-icons";
import AsyncStorage from "@react-native-async-storage/async-storage";
import { useNavigation } from "@react-navigation/native";
import { recommendedMealAPI, userPreferencesAPI } from "../../services";
import { LinearGradient } from "expo-linear-gradient";
const { width } = Dimensions.get("window");

const LOADING_MESSAGES = [
  "입력하신 정보를 수집하는 중...",
  "회원님께 최적화된 식단을 준비하는 중...",
  "영양소 균형을 계산하는 중...",
  "맛있는 조합을 찾는 중...",
  "거의 다 됐어요! 조금만 기다려주세요...",
];

const LoadingOverlay = ({
  visible,
  messages = LOADING_MESSAGES,
  onCancel,
}: {
  visible: boolean;
  messages?: string[];
  onCancel?: () => void;
}) => {
  const [currentMessageIndex, setCurrentMessageIndex] = useState(0);
  const fadeAnim = useRef(new Animated.Value(1)).current;
  const spinAnim = useRef(new Animated.Value(0)).current;
  const scaleAnim = useRef(new Animated.Value(1)).current;

  useEffect(() => {
    if (!visible) {
      setCurrentMessageIndex(0);
      fadeAnim.setValue(1);
      return;
    }

    Animated.loop(
      Animated.timing(spinAnim, {
        toValue: 1,
        duration: 2000,
        useNativeDriver: true,
        easing: Easing.linear,
      })
    ).start();

    Animated.loop(
      Animated.sequence([
        Animated.timing(scaleAnim, {
          toValue: 1.1,
          duration: 1000,
          useNativeDriver: true,
          easing: Easing.inOut(Easing.ease),
        }),
        Animated.timing(scaleAnim, {
          toValue: 1,
          duration: 1000,
          useNativeDriver: true,
          easing: Easing.inOut(Easing.ease),
        }),
      ])
    ).start();

    fadeAnim.setValue(1);

    const interval = setInterval(() => {
      Animated.timing(fadeAnim, {
        toValue: 0,
        duration: 500,
        useNativeDriver: true,
        easing: Easing.out(Easing.ease),
      }).start(() => {
        setCurrentMessageIndex((prev) => (prev + 1) % messages.length);
        Animated.timing(fadeAnim, {
          toValue: 1,
          duration: 800,
          useNativeDriver: true,
          easing: Easing.in(Easing.ease),
        }).start();
      });
    }, 3500);

    return () => clearInterval(interval);
  }, [visible, messages.length]);

  const spin = spinAnim.interpolate({
    inputRange: [0, 1],
    outputRange: ["0deg", "360deg"],
  });

  return (
    <Modal
      visible={visible}
      transparent={true}
      animationType="fade"
      statusBarTranslucent
      onRequestClose={onCancel}
    >
      <View style={loadingStyles.overlay}>
        <LinearGradient
          colors={[
            "rgba(0,0,0,0.95)",
            "rgba(17,24,39,0.95)",
            "rgba(0,0,0,0.95)",
          ]}
          style={StyleSheet.absoluteFill}
        />

        <Animated.View
          style={[
            loadingStyles.container,
            { transform: [{ scale: scaleAnim }] },
          ]}
        >
          <Animated.View
            style={[
              loadingStyles.spinnerContainer,
              { transform: [{ rotate: spin }] },
            ]}
          >
            <View style={loadingStyles.spinnerOuter}>
              <View style={loadingStyles.spinnerInner} />
            </View>
          </Animated.View>

          <Animated.View
            style={[{ opacity: fadeAnim }, loadingStyles.textContainer]}
          >
            <Text style={loadingStyles.message}>
              {messages && messages.length > 0
                ? messages[currentMessageIndex]
                : "로딩 중..."}
            </Text>
          </Animated.View>

          {onCancel && (
            <TouchableOpacity
              style={loadingStyles.cancelButton}
              onPress={onCancel}
              activeOpacity={0.8}
            >
              <LinearGradient
                colors={["rgba(255,255,255,0.1)", "rgba(255,255,255,0.05)"]}
                style={loadingStyles.cancelButtonGradient}
              >
                <Text style={loadingStyles.cancelText}>요청 취소하기</Text>
              </LinearGradient>
            </TouchableOpacity>
          )}
        </Animated.View>
      </View>
    </Modal>
  );
};

const loadingStyles = StyleSheet.create({
  overlay: {
    flex: 1,
    justifyContent: "center",
    alignItems: "center",
  },
  container: {
    alignItems: "center",
    justifyContent: "center",
    width: "100%",
    paddingHorizontal: 20,
  },
  spinnerContainer: {
    marginBottom: 40,
  },
  spinnerOuter: {
    width: 100,
    height: 100,
    borderRadius: 50,
    borderWidth: 4,
    borderColor: "rgba(227, 255, 124, 0.2)",
    alignItems: "center",
    justifyContent: "center",
  },
  spinnerInner: {
    width: 80,
    height: 80,
    borderRadius: 40,
    borderWidth: 4,
    borderColor: "#e3ff7c",
    borderTopColor: "transparent",
    borderRightColor: "transparent",
  },
  textContainer: {
    width: "100%",
    alignItems: "center",
    justifyContent: "center",
    minHeight: 70,
  },
  message: {
    fontSize: 18,
    fontWeight: "600",
    color: "#ffffff",
    textAlign: "center",
    lineHeight: 28,
    letterSpacing: 0.5,
  },
  cancelButton: {
    marginTop: 50,
    borderRadius: 30,
    overflow: "hidden",
  },
  cancelButtonGradient: {
    paddingVertical: 14,
    paddingHorizontal: 28,
    borderWidth: 1,
    borderColor: "rgba(255, 255, 255, 0.2)",
    borderRadius: 30,
  },
  cancelText: {
    color: "#ffffff",
    fontSize: 15,
    fontWeight: "600",
    letterSpacing: 0.5,
  },
});

const transformTempMealToUI = (tempDay: any, dayIndex: number) => {
  console.log(`🔄 ${dayIndex}일차 변환 시작`);

  let breakfast, lunch, dinner;

  if (tempDay.meals && tempDay.meals.length > 0) {
    breakfast = tempDay.meals.find((m: any) => m.mealType === "BREAKFAST");
    lunch = tempDay.meals.find((m: any) => m.mealType === "LUNCH");
    dinner = tempDay.meals.find((m: any) => m.mealType === "DINNER");

    if (!breakfast && !lunch && !dinner) {
      console.log(`⚠️ ${dayIndex}일차는 SNACK만 있음 - 변환 시작`);

      const snacks = tempDay.meals.filter((m: any) => m.mealType === "SNACK");

      if (snacks.length >= 1) {
        breakfast = {
          ...snacks[0],
          mealType: "BREAKFAST",
          mealTypeName: "아침",
        };
      }
      if (snacks.length >= 2) {
        lunch = {
          ...snacks[1],
          mealType: "LUNCH",
          mealTypeName: "점심",
        };
      }
      if (snacks.length >= 3) {
        dinner = {
          ...snacks[2],
          mealType: "DINNER",
          mealTypeName: "저녁",
        };
      }

      console.log(
        `✅ SNACK 변환 완료: 아침=${!!breakfast}, 점심=${!!lunch}, 저녁=${!!dinner}`
      );
    }
  }

  // 하루 전체 영양소 계산
  const totalCalories =
    (breakfast?.totalCalories || 0) +
    (lunch?.totalCalories || 0) +
    (dinner?.totalCalories || 0);

  const totalCarbs =
    (breakfast?.totalCarbs || 0) +
    (lunch?.totalCarbs || 0) +
    (dinner?.totalCarbs || 0);

  const totalProtein =
    (breakfast?.totalProtein || 0) +
    (lunch?.totalProtein || 0) +
    (dinner?.totalProtein || 0);

  const totalFat =
    (breakfast?.totalFat || 0) +
    (lunch?.totalFat || 0) +
    (dinner?.totalFat || 0);

  // 날짜 계산
  const planDate = new Date();
  planDate.setDate(planDate.getDate() + (dayIndex - 1));

  return {
    day: dayIndex,
    date: `${planDate.getMonth() + 1}/${planDate.getDate()}`,
    fullDate: planDate.toLocaleDateString("ko-KR", {
      month: "long",
      day: "numeric",
      weekday: "short",
    }),
    planId: null,
    planName: "AI 추천 식단",
    description: "맞춤형 7일 식단",
    recommendationReason: "영양소 균형을 고려한 식단",
    totalCalories: Math.round(totalCalories),
    carbs: Math.round(totalCarbs),
    protein: Math.round(totalProtein),
    fat: Math.round(totalFat),
    isSaved: false,
    breakfast: {
      meals:
        breakfast?.foods.map((f: any) => ({
          name: f.foodName,
          calories: Math.round(f.calories),
          carbs: Math.round(f.carbs),
          protein: Math.round(f.protein),
          fat: Math.round(f.fat),
        })) || [],
      calories: Math.round(breakfast?.totalCalories || 0),
      carbs: Math.round(breakfast?.totalCarbs || 0),
      protein: Math.round(breakfast?.totalProtein || 0),
      fat: Math.round(breakfast?.totalFat || 0),
    },
    lunch: {
      meals:
        lunch?.foods.map((f: any) => ({
          name: f.foodName,
          calories: Math.round(f.calories),
          carbs: Math.round(f.carbs),
          protein: Math.round(f.protein),
          fat: Math.round(f.fat),
        })) || [],
      calories: Math.round(lunch?.totalCalories || 0),
      carbs: Math.round(lunch?.totalCarbs || 0),
      protein: Math.round(lunch?.totalProtein || 0),
      fat: Math.round(lunch?.totalFat || 0),
    },
    dinner: {
      meals:
        dinner?.foods.map((f: any) => ({
          name: f.foodName,
          calories: Math.round(f.calories),
          carbs: Math.round(f.carbs),
          protein: Math.round(f.protein),
          fat: Math.round(f.fat),
        })) || [],
      calories: Math.round(dinner?.totalCalories || 0),
      carbs: Math.round(dinner?.totalCarbs || 0),
      protein: Math.round(dinner?.totalProtein || 0),
      fat: Math.round(dinner?.totalFat || 0),
    },
  };
};

const MealRecommendScreen = () => {
  const navigation = useNavigation();
  const [screen, setScreen] = useState<
    "welcome" | "excludedIngredients" | "meals"
  >("welcome");
  const [weeklyMeals, setWeeklyMeals] = useState<any[]>([]);
  const [currentDay, setCurrentDay] = useState(0);
  const [excludedIngredients, setExcludedIngredients] = useState<string[]>([]);
  const [newIngredient, setNewIngredient] = useState("");
  const [loading, setLoading] = useState(false);
  const [savedMeals, setSavedMeals] = useState<any[]>([]);
  const [currentPlanId, setCurrentPlanId] = useState<number | null>(null);

  const fadeAnim = useRef(new Animated.Value(0)).current;

  useEffect(() => {
    Animated.timing(fadeAnim, {
      toValue: 1,
      duration: 600,
      useNativeDriver: true,
    }).start();
  }, [screen]);

  // ✅ 초기 데이터 로드
  useEffect(() => {
    const loadData = async () => {
      try {
        // ✅ ==================== 여기에 테스트 코드 추가 시작 ====================
        console.log("========== GET 테스트 시작 ==========");
        try {
          const result = await userPreferencesAPI.getUserPreferences();
          console.log("✅ GET 성공:", result);
          console.log("✅ 비선호 음식:", result.dislikedFoods);
        } catch (testError) {
          console.error("❌ GET 실패:", testError);
        }
        console.log("========== GET 테스트 완료 ==========");
        // ✅ ==================== 테스트 코드 추가 끝 ====================

        // ✅ 비선호 음식만 가져오기
        const dislikedFoods = await userPreferencesAPI.getDislikedFoods();
        setExcludedIngredients(dislikedFoods);

        console.log("✅ 비선호 음식 로드 완료:", dislikedFoods.length, "개");

        await loadSavedMeals();
      } catch (error) {
        console.error("데이터 로드 실패:", error);
        // fallback: 로컬 스토리지
        try {
          const stored = await AsyncStorage.getItem("excludedIngredients");
          if (stored) {
            setExcludedIngredients(JSON.parse(stored));
          }
        } catch (e) {
          console.error("로컬 스토리지 읽기 실패:", e);
        }
      }
    };
    loadData();
  }, []);

  // ✅ 저장된 식단 불러오기
  const loadSavedMeals = async () => {
    try {
      // 로컬 스토리지에서 가져오기
      const localStored = await AsyncStorage.getItem("savedMealPlans");
      const localMeals = localStored ? JSON.parse(localStored) : [];

      // 서버에서 가져오기 (bundleId로 그룹화)
      const serverPlans = await recommendedMealAPI.getSavedMealPlans();

      console.log("📦 서버에서 받은 plans:", serverPlans.length);

      // ✅ bundleId로 그룹화
      const bundleMap = new Map<string, any>();

      serverPlans.forEach((plan) => {
        if (!bundleMap.has(plan.bundleId)) {
          bundleMap.set(plan.bundleId, {
            id: plan.bundleId,
            bundleId: plan.bundleId,
            planName: plan.planName,
            description: "",
            totalCalories: 0,
            createdAt: plan.createdAt,
            mealCount: 0,
            isServerMeal: true,
          });
        }

        const bundle = bundleMap.get(plan.bundleId)!;
        bundle.mealCount++;
        bundle.totalCalories += plan.totalCalories;
        // ✅ totalCarbs, totalProtein, totalFat 제거
      });

      // ✅ 평균 계산
      const serverBundles = Array.from(bundleMap.values()).map((bundle) => ({
        ...bundle,
        totalCalories: Math.round(
          bundle.totalCalories / (bundle.mealCount || 1)
        ),
        description: `${bundle.mealCount}일 식단`,
      }));

      console.log("✅ 그룹화된 서버 번들:", serverBundles.length);

      // 로컬 + 서버 합치기
      const allMeals = [...localMeals, ...serverBundles];

      console.log("📋 저장된 식단:", {
        로컬: localMeals.length,
        서버: serverBundles.length,
        합계: allMeals.length,
      });

      setSavedMeals(allMeals);
    } catch (error) {
      console.error("저장된 식단 불러오기 실패:", error);
    }
  };

  const handleCancelLoading = () => {
    Alert.alert("요청 취소", "식단 추천 요청을 취소하시겠습니까?", [
      { text: "계속 기다리기", style: "cancel" },
      {
        text: "취소",
        style: "destructive",
        onPress: () => {
          console.log("⚠️ 사용자가 로딩을 취소함");
          setLoading(false);
        },
      },
    ]);
  };

  // ✅ 식단 추천 받기
  const handleGetRecommendation = async () => {
    setLoading(true);

    try {
      console.log("🍽️ 임시 식단 생성 시작");

      const tempMeals = await recommendedMealAPI.getWeeklyMealPlan();

      // ✅ 1단계: API 응답 전체 확인
      console.log("=== 📦 API 응답 원본 ===");
      console.log("응답 배열 길이:", tempMeals.length);
      console.log("전체 응답:", JSON.stringify(tempMeals, null, 2));

      // ✅ 2단계: 각 날짜별 데이터 확인
      tempMeals.forEach((day, index) => {
        console.log(`\n=== ${index + 1}일차 상세 ===`);
        console.log("dayIndex:", day.dayIndex);
        console.log("meals 배열:", day.meals);
        console.log("meals 길이:", day.meals?.length || 0);

        // 각 meal 확인
        day.meals?.forEach((meal, mealIdx) => {
          console.log(`  - ${meal.mealType}:`, {
            id: meal.id,
            foods개수: meal.foods?.length || 0,
            totalCalories: meal.totalCalories,
          });
        });
      });

      if (!tempMeals || tempMeals.length === 0) {
        throw new Error("식단 생성에 실패했습니다.");
      }

      console.log(`✅ ${tempMeals.length}일치 임시 식단 생성 완료`);

      // ✅ 3단계: 변환 전후 비교
      const weekData = tempMeals.map((tempDay, index) => {
        const transformed = transformTempMealToUI(tempDay, index + 1);

        console.log(`\n=== ${index + 1}일차 변환 후 ===`);
        console.log("totalCalories:", transformed.totalCalories);
        console.log("아침 음식 수:", transformed.breakfast.meals.length);
        console.log("점심 음식 수:", transformed.lunch.meals.length);
        console.log("저녁 음식 수:", transformed.dinner.meals.length);

        return transformed;
      });

      console.log("\n=== 📊 최종 weekData ===");
      console.log("weekData 길이:", weekData.length);
      weekData.forEach((day, idx) => {
        console.log(`${idx + 1}일차:`, {
          totalCalories: day.totalCalories,
          아침: day.breakfast.meals.length,
          점심: day.lunch.meals.length,
          저녁: day.dinner.meals.length,
        });
      });

      setWeeklyMeals(weekData);
      setCurrentPlanId(null);
      setScreen("meals");
      setCurrentDay(0);

      Alert.alert(
        "성공",
        `${weekData.length}일치 맞춤 식단이 생성되었습니다! 🎉`
      );
    } catch (error: any) {
      console.error("❌ 식단 추천 실패:", error);
      Alert.alert("오류", error.message || "식단을 불러오는데 실패했습니다.");
    } finally {
      setLoading(false);
    }
  };
  const handleAddExcludedIngredient = async () => {
    const trimmed = newIngredient.trim();

    if (!trimmed) {
      return;
    }

    if (excludedIngredients.includes(trimmed)) {
      Alert.alert("알림", "이미 추가된 식재료입니다.");
      return;
    }

    try {
      setLoading(true);

      // ✅ 먼저 서버에 시도
      try {
        const result = await userPreferencesAPI.addDislikedFoods(
          excludedIngredients,
          [trimmed]
        );

        // ✅ 서버 성공 시
        setExcludedIngredients(result.updatedList);
        await AsyncStorage.setItem(
          "excludedIngredients",
          JSON.stringify(result.updatedList)
        );

        setNewIngredient("");
        console.log("✅ 비선호 음식 추가 완료 (서버):", result.updatedList);
        return; // 성공하면 종료
      } catch (serverError: any) {
        console.warn("⚠️ 서버 저장 실패, 로컬만 저장:", serverError.message);

        // ✅ 500 에러면 로컬에만 저장 (임시 조치)
        if (
          serverError.message?.includes("서버 내부 오류") ||
          serverError.status === 500
        ) {
          const updatedList = [...excludedIngredients, trimmed];
          setExcludedIngredients(updatedList);
          await AsyncStorage.setItem(
            "excludedIngredients",
            JSON.stringify(updatedList)
          );

          setNewIngredient("");
          Alert.alert(
            "일부 성공",
            "식재료가 기기에 저장되었습니다.\n(서버 동기화는 백엔드 수정 후 가능합니다)"
          );
          console.log("✅ 비선호 음식 추가 완료 (로컬만):", updatedList);
          return;
        }

        // 다른 에러는 throw
        throw serverError;
      }
    } catch (error: any) {
      console.error("비선호 음식 추가 실패:", error);
      Alert.alert("오류", error.message || "식재료 추가에 실패했습니다.");
    } finally {
      setLoading(false);
    }
  };

  // ✅ 비선호 음식 삭제 (최적화)
  const handleRemoveExcludedIngredient = async (ingredient: string) => {
    Alert.alert("삭제", `"${ingredient}"를 삭제하시겠습니까?`, [
      { text: "취소", style: "cancel" },
      {
        text: "삭제",
        style: "destructive",
        onPress: async () => {
          try {
            setLoading(true);

            // ✅ 현재 목록 기반으로 서버에서 삭제
            const result = await userPreferencesAPI.removeDislikedFood(
              excludedIngredients,
              ingredient
            );

            // ✅ 서버 응답으로 상태 업데이트
            setExcludedIngredients(result.updatedList);

            // ✅ 로컬 스토리지 백업
            await AsyncStorage.setItem(
              "excludedIngredients",
              JSON.stringify(result.updatedList)
            );

            console.log("✅ 비선호 음식 삭제 완료:", result.updatedList);
          } catch (error: any) {
            console.error("비선호 음식 삭제 실패:", error);
            Alert.alert("오류", error.message || "식재료 삭제에 실패했습니다.");
          } finally {
            setLoading(false);
          }
        },
      },
    ]);
  };

  // ✅ 음식 삭제
  const handleDeleteMeal = (mealType: string, mealIndex: number) => {
    const currentMeal = weeklyMeals[currentDay];
    const mealData = currentMeal[mealType];

    if (mealData.meals.length === 1) {
      Alert.alert(
        "음식 삭제",
        `${
          mealType === "breakfast"
            ? "아침"
            : mealType === "lunch"
            ? "점심"
            : "저녁"
        }의 마지막 음식입니다. 삭제하시겠습니까?`,
        [
          { text: "취소", style: "cancel" },
          {
            text: "삭제",
            style: "destructive",
            onPress: () => deleteFood(mealType, mealIndex),
          },
        ]
      );
    } else {
      deleteFood(mealType, mealIndex);
    }
  };

  const deleteFood = (mealType: string, mealIndex: number) => {
    setWeeklyMeals((prev) => {
      const updated = [...prev];
      const dayMeals = { ...updated[currentDay] };
      const mealArray = [...dayMeals[mealType].meals];

      const removedMeal = mealArray[mealIndex];
      mealArray.splice(mealIndex, 1);

      const newMealCalories = Math.max(
        0,
        dayMeals[mealType].calories - removedMeal.calories
      );
      const newMealCarbs = Math.max(
        0,
        dayMeals[mealType].carbs - removedMeal.carbs
      );
      const newMealProtein = Math.max(
        0,
        dayMeals[mealType].protein - removedMeal.protein
      );
      const newMealFat = Math.max(0, dayMeals[mealType].fat - removedMeal.fat);

      dayMeals[mealType] = {
        meals: mealArray,
        calories: newMealCalories,
        carbs: newMealCarbs,
        protein: newMealProtein,
        fat: newMealFat,
      };

      const newTotalCalories =
        dayMeals.breakfast.calories +
        dayMeals.lunch.calories +
        dayMeals.dinner.calories;
      const newTotalCarbs =
        dayMeals.breakfast.carbs + dayMeals.lunch.carbs + dayMeals.dinner.carbs;
      const newTotalProtein =
        dayMeals.breakfast.protein +
        dayMeals.lunch.protein +
        dayMeals.dinner.protein;
      const newTotalFat =
        dayMeals.breakfast.fat + dayMeals.lunch.fat + dayMeals.dinner.fat;

      dayMeals.totalCalories = newTotalCalories;
      dayMeals.carbs = newTotalCarbs;
      dayMeals.protein = newTotalProtein;
      dayMeals.fat = newTotalFat;

      updated[currentDay] = dayMeals;

      return updated;
    });
  };

  // ✅ 로컬 저장
  const handleSaveMealPlanLocally = async () => {
    try {
      setLoading(true);

      const mealsForHistory = weeklyMeals.map((d) => ({
        totalCalories: d.totalCalories,
        carbs: d.carbs,
        protein: d.protein,
        fat: d.fat,
        breakfast: d.breakfast,
        lunch: d.lunch,
        dinner: d.dinner,
      }));

      const mealPlanToSave = {
        id: `local_${Date.now()}`,
        date: new Date().toLocaleDateString("ko-KR"),
        planName: weeklyMeals[0]?.planName || "AI 식단",
        description: weeklyMeals[0]?.description || "AI가 생성한 식단",
        totalCalories: weeklyMeals[0]?.totalCalories || 0,
        totalCarbs: weeklyMeals[0]?.carbs || 0,
        totalProtein: weeklyMeals[0]?.protein || 0,
        totalFat: weeklyMeals[0]?.fat || 0,
        createdAt: new Date().toISOString(),
        meals: mealsForHistory,
        isLocalMeal: true,
      };

      const stored = await AsyncStorage.getItem("savedMealPlans");
      const existingMeals = stored ? JSON.parse(stored) : [];

      const updatedMeals = [mealPlanToSave, ...existingMeals].slice(0, 20);
      await AsyncStorage.setItem(
        "savedMealPlans",
        JSON.stringify(updatedMeals)
      );

      console.log("💾 로컬 저장 완료:", mealPlanToSave.id);

      Alert.alert("저장 완료", "식단이 기기에 저장되었습니다! 🎉", [
        {
          text: "확인",
          onPress: async () => {
            await loadSavedMeals();
            setScreen("welcome");
          },
        },
      ]);
    } catch (error: any) {
      console.error("로컬 저장 실패:", error);
      Alert.alert("오류", "식단 저장에 실패했습니다.");
    } finally {
      setLoading(false);
    }
  };

  // ✅ 식단 저장
  const handleSaveMealPlan = async () => {
    try {
      setLoading(true);
      console.log("💾 식단 저장 시작");

      await recommendedMealAPI.saveTempMealPlan();

      Alert.alert("저장 완료", "식단이 성공적으로 저장되었습니다!", [
        {
          text: "확인",
          onPress: () => {
            // ❌ 제거: navigation.navigate("Diet");
            // ✅ 현재 화면 유지, 필요시 목록 새로고침
            console.log("✅ 식단 저장 완료 - 현재 화면 유지");
          },
        },
      ]);
    } catch (error: any) {
      console.error("❌ 식단 저장 실패:", error);
      Alert.alert("저장 실패", error.message || "식단 저장에 실패했습니다.");
    } finally {
      setLoading(false);
    }
  };

  // ✅ 저장된 식단 삭제
  const handleDeleteSavedMeal = async (meal: any) => {
    const isLocalMeal =
      typeof meal.id === "string" && meal.id.startsWith("local_");

    Alert.alert(
      "삭제",
      `이 ${isLocalMeal ? "로컬" : "서버"} 식단을 삭제하시겠습니까?${
        !isLocalMeal && meal.mealCount ? `\n(${meal.mealCount}일치)` : ""
      }`,
      [
        { text: "취소", style: "cancel" },
        {
          text: "삭제",
          style: "destructive",
          onPress: async () => {
            try {
              setLoading(true);

              if (isLocalMeal) {
                // ✅ 로컬 식단 삭제
                const stored = await AsyncStorage.getItem("savedMealPlans");
                const existingMeals = stored ? JSON.parse(stored) : [];
                const updatedMeals = existingMeals.filter(
                  (m: any) => m.id !== meal.id
                );
                await AsyncStorage.setItem(
                  "savedMealPlans",
                  JSON.stringify(updatedMeals)
                );

                console.log("🗑️ 로컬 식단 삭제:", meal.id);
              } else {
                // ✅ 서버 번들 삭제 - deleteBundle 사용
                console.log("🗑️ 서버 번들 삭제:", meal.bundleId || meal.id);
                await recommendedMealAPI.deleteBundle(meal.bundleId || meal.id);
              }

              // ✅ 삭제 후 목록 새로고침
              await loadSavedMeals();
              Alert.alert("성공", "식단이 삭제되었습니다.");
            } catch (error: any) {
              console.error("식단 삭제 실패:", error);
              Alert.alert("오류", error.message || "식단 삭제에 실패했습니다.");
            } finally {
              setLoading(false);
            }
          },
        },
      ]
    );
  };

  const currentMeal = weeklyMeals[currentDay];

  if (screen === "welcome") {
    return (
      <View style={styles.container}>
        <LinearGradient
          colors={["#0a0a0a", "#1a1a2e", "#16213e", "#0f3460"]}
          style={StyleSheet.absoluteFill}
        />

        <SafeAreaView style={styles.safeArea} edges={["top"]}>
          <LoadingOverlay
            visible={loading}
            messages={LOADING_MESSAGES}
            onCancel={handleCancelLoading}
          />

          <View style={styles.header}>
            <TouchableOpacity
              onPress={() => navigation.goBack()}
              style={styles.backButton}
            >
              <View style={styles.iconButton}>
                <Icon name="chevron-back" size={24} color="#ffffff" />
              </View>
            </TouchableOpacity>
          </View>

          <ScrollView
            style={styles.contentWrapper}
            contentContainerStyle={styles.contentContainer}
            showsVerticalScrollIndicator={false}
          >
            <Animated.View
              style={[styles.welcomeHeader, { opacity: fadeAnim }]}
            >
              <View style={styles.welcomeIconContainer}>
                <LinearGradient
                  colors={["#e3ff7c", "#a8e063"]}
                  style={styles.welcomeIcon}
                >
                  <Text style={styles.welcomeEmoji}>🥗</Text>
                </LinearGradient>
              </View>
              <Text style={styles.welcomeTitle}>맞춤 식단 추천</Text>
              <Text style={styles.welcomeSubtitle}>
                AI가 당신만을 위한{"\n"}완벽한 식단을 설계합니다
              </Text>
            </Animated.View>

            <View style={styles.mainActions}>
              <TouchableOpacity
                style={styles.primaryButton}
                onPress={handleGetRecommendation}
                disabled={loading}
                activeOpacity={0.9}
              >
                <LinearGradient
                  colors={["#e3ff7c", "#a8e063"]}
                  start={{ x: 0, y: 0 }}
                  end={{ x: 1, y: 1 }}
                  style={styles.primaryButtonGradient}
                >
                  <Icon
                    name="sparkles"
                    size={22}
                    color="#111827"
                    style={{ marginRight: 8 }}
                  />
                  <Text style={styles.primaryButtonText}>추천 식단 받기</Text>
                </LinearGradient>
              </TouchableOpacity>

              <TouchableOpacity
                style={styles.secondaryButton}
                onPress={() => setScreen("excludedIngredients")}
                activeOpacity={0.8}
              >
                <LinearGradient
                  colors={["rgba(255,255,255,0.1)", "rgba(255,255,255,0.05)"]}
                  style={styles.secondaryButtonGradient}
                >
                  <Icon
                    name="remove-circle-outline"
                    size={20}
                    color="#ffffff"
                    style={{ marginRight: 8 }}
                  />
                  <Text style={styles.secondaryButtonText}>
                    금지 식재료 관리
                    {excludedIngredients.length > 0 &&
                      ` (${excludedIngredients.length})`}
                  </Text>
                </LinearGradient>
              </TouchableOpacity>
            </View>

            {excludedIngredients.length > 0 && (
              <View style={styles.excludedPreview}>
                <View style={styles.glassCard}>
                  <Text style={styles.excludedPreviewLabel}>제외된 식재료</Text>
                  <View style={styles.tagList}>
                    {excludedIngredients.map((ingredient, index) => (
                      <View key={index} style={styles.tag}>
                        <LinearGradient
                          colors={[
                            "rgba(239,68,68,0.2)",
                            "rgba(239,68,68,0.1)",
                          ]}
                          style={styles.tagGradient}
                        >
                          <Text style={styles.tagText}>{ingredient}</Text>
                        </LinearGradient>
                      </View>
                    ))}
                  </View>
                </View>
              </View>
            )}

            {savedMeals.length > 0 && (
              <View style={styles.savedMealsSection}>
                <Text style={styles.sectionTitle}>저장된 식단</Text>
                {savedMeals.map((meal) => {
                  // ✅ 수정: "local_" 체크
                  const isLocalMeal =
                    typeof meal.id === "string" && meal.id.startsWith("local_");

                  return (
                    <TouchableOpacity
                      key={meal.id}
                      style={styles.savedMealItem}
                      onPress={() => {
                        if (isLocalMeal) {
                          const weekly = (meal.meals || []).map(
                            (m: any, idx: number) => ({
                              day: idx + 1,
                              date: "",
                              fullDate: "",
                              planId: null,
                              planName: meal.planName || "AI 식단",
                              description: meal.description || "",
                              recommendationReason: "",
                              totalCalories: m.totalCalories || 0,
                              carbs: m.carbs || 0,
                              protein: m.protein || 0,
                              fat: m.fat || 0,
                              isSaved: true,
                              breakfast: m.breakfast,
                              lunch: m.lunch,
                              dinner: m.dinner,
                            })
                          );

                          setWeeklyMeals(weekly);
                          setCurrentPlanId(null);
                          setScreen("meals");
                          setCurrentDay(0);
                        } else {
                          navigation.navigate("MealRecommendHistory" as never);
                        }
                      }}
                      activeOpacity={0.8}
                    >
                      <LinearGradient
                        colors={[
                          "rgba(255,255,255,0.08)",
                          "rgba(255,255,255,0.04)",
                        ]}
                        style={styles.savedMealGradient}
                      >
                        <View style={styles.savedMealContent}>
                          <View style={styles.savedMealLeft}>
                            <View style={styles.savedMealTitleRow}>
                              <Text style={styles.savedMealTitle}>
                                {meal.planName || "식단 계획"}
                              </Text>
                              {isLocalMeal && (
                                <View style={styles.localBadge}>
                                  <LinearGradient
                                    colors={["#e3ff7c", "#a8e063"]}
                                    style={styles.localBadgeGradient}
                                  >
                                    <Icon
                                      name="phone-portrait-outline"
                                      size={12}
                                      color="#111827"
                                    />
                                    <Text style={styles.localBadgeText}>
                                      로컬
                                    </Text>
                                  </LinearGradient>
                                </View>
                              )}
                            </View>
                            <Text style={styles.savedMealInfo}>
                              {meal.totalCalories || 0} kcal ·{" "}
                              {meal.description || ""}
                            </Text>
                          </View>
                          <TouchableOpacity
                            onPress={(e) => {
                              e.stopPropagation();
                              handleDeleteSavedMeal(meal);
                            }}
                            style={styles.deleteButton}
                          >
                            <Icon
                              name="trash-outline"
                              size={18}
                              color="#ef4444"
                            />
                          </TouchableOpacity>
                        </View>
                      </LinearGradient>
                    </TouchableOpacity>
                  );
                })}
              </View>
            )}
          </ScrollView>
        </SafeAreaView>
      </View>
    );
  }

  if (screen === "excludedIngredients") {
    return (
      <View style={styles.container}>
        <LinearGradient
          colors={["#0a0a0a", "#1a1a2e", "#16213e"]}
          style={StyleSheet.absoluteFill}
        />

        <SafeAreaView style={styles.safeArea} edges={["top"]}>
          <View style={styles.header}>
            <TouchableOpacity
              onPress={() => setScreen("welcome")}
              style={styles.backButton}
            >
              <View style={styles.iconButton}>
                <Icon name="chevron-back" size={24} color="#ffffff" />
              </View>
            </TouchableOpacity>
            <Text style={styles.headerTitle}>금지 식재료</Text>
            <View style={{ width: 40 }} />
          </View>

          <ScrollView
            style={styles.excludedForm}
            contentContainerStyle={styles.excludedFormContent}
            showsVerticalScrollIndicator={false}
          >
            <View style={styles.inputGroup}>
              <View style={styles.inputWrapper}>
                <LinearGradient
                  colors={["rgba(255,255,255,0.1)", "rgba(255,255,255,0.05)"]}
                  style={styles.inputGradient}
                >
                  <Icon
                    name="search"
                    size={20}
                    color="#6b7280"
                    style={styles.inputIcon}
                  />
                  <TextInput
                    style={styles.textInput}
                    value={newIngredient}
                    onChangeText={setNewIngredient}
                    onSubmitEditing={handleAddExcludedIngredient}
                    placeholder="알러지 식재료를 입력하세요"
                    placeholderTextColor="#6b7280"
                  />
                </LinearGradient>
              </View>
              <TouchableOpacity
                style={styles.addButton}
                onPress={handleAddExcludedIngredient}
                activeOpacity={0.8}
              >
                <LinearGradient
                  colors={["#e3ff7c", "#a8e063"]}
                  style={styles.addButtonGradient}
                >
                  <Icon name="add" size={28} color="#111827" />
                </LinearGradient>
              </TouchableOpacity>
            </View>

            <View style={styles.excludedList}>
              {excludedIngredients.map((ingredient, index) => (
                <Animated.View
                  key={index}
                  style={[styles.excludedItem, { opacity: fadeAnim }]}
                >
                  <LinearGradient
                    colors={[
                      "rgba(255,255,255,0.08)",
                      "rgba(255,255,255,0.04)",
                    ]}
                    style={styles.excludedItemGradient}
                  >
                    <View style={styles.excludedItemLeft}>
                      <View style={styles.excludedItemIcon}>
                        <Icon name="ban" size={18} color="#ef4444" />
                      </View>
                      <Text style={styles.excludedItemText}>{ingredient}</Text>
                    </View>
                    <TouchableOpacity
                      style={styles.removeButton}
                      onPress={() => handleRemoveExcludedIngredient(ingredient)}
                      activeOpacity={0.7}
                    >
                      <Icon name="close-circle" size={24} color="#ef4444" />
                    </TouchableOpacity>
                  </LinearGradient>
                </Animated.View>
              ))}

              {excludedIngredients.length === 0 && (
                <View style={styles.emptyState}>
                  <Icon name="restaurant-outline" size={64} color="#374151" />
                  <Text style={styles.emptyMessage}>
                    등록된 금지 식재료가 없습니다
                  </Text>
                  <Text style={styles.emptySubtext}>
                    알러지나 선호하지 않는 식재료를 추가하세요
                  </Text>
                </View>
              )}
            </View>

            <TouchableOpacity
              style={styles.completeButton}
              onPress={() => setScreen("welcome")}
              activeOpacity={0.9}
            >
              <LinearGradient
                colors={["#e3ff7c", "#a8e063"]}
                style={styles.completeButtonGradient}
              >
                <Icon
                  name="checkmark-circle"
                  size={22}
                  color="#111827"
                  style={{ marginRight: 8 }}
                />
                <Text style={styles.completeButtonText}>완료</Text>
              </LinearGradient>
            </TouchableOpacity>
          </ScrollView>
        </SafeAreaView>
      </View>
    );
  }

  return (
    <View style={styles.container}>
      <LinearGradient
        colors={["#0a0a0a", "#1a1a2e", "#16213e", "#0f3460"]}
        style={StyleSheet.absoluteFill}
      />

      <SafeAreaView style={styles.safeArea} edges={["top"]}>
        <View style={styles.header}>
          <TouchableOpacity
            onPress={() => setScreen("welcome")}
            style={styles.backButton}
          >
            <View style={styles.iconButton}>
              <Icon name="chevron-back" size={24} color="#ffffff" />
            </View>
          </TouchableOpacity>
          <Text style={styles.headerTitle}>식단 추천</Text>
          <View style={{ width: 40 }} />
        </View>

        <ScrollView
          style={styles.contentWrapper}
          showsVerticalScrollIndicator={false}
        >
          {currentMeal && (
            <View style={styles.mealDateContainer}>
              <LinearGradient
                colors={["rgba(227,255,124,0.2)", "rgba(168,224,99,0.1)"]}
                style={styles.dateBadge}
              >
                <Icon
                  name="calendar-outline"
                  size={16}
                  color="#e3ff7c"
                  style={{ marginRight: 6 }}
                />
                <Text style={styles.mealDate}>{currentMeal.fullDate}</Text>
              </LinearGradient>
            </View>
          )}

          <ScrollView
            horizontal
            showsHorizontalScrollIndicator={false}
            style={styles.dayTabs}
            contentContainerStyle={styles.dayTabsContent}
          >
            {weeklyMeals.map((_, index) => (
              <TouchableOpacity
                key={index}
                style={styles.dayTabContainer}
                onPress={() => setCurrentDay(index)}
                activeOpacity={0.8}
              >
                {currentDay === index ? (
                  <LinearGradient
                    colors={["#e3ff7c", "#a8e063"]}
                    style={styles.dayTabActive}
                  >
                    <Text style={styles.dayTabTextActive}>{index + 1}일차</Text>
                  </LinearGradient>
                ) : (
                  <View style={styles.dayTab}>
                    <Text style={styles.dayTabText}>{index + 1}일차</Text>
                  </View>
                )}
              </TouchableOpacity>
            ))}
          </ScrollView>

          {currentMeal && (
            <View style={styles.mealContent}>
              <View style={styles.nutritionCardContainer}>
                <LinearGradient
                  colors={["rgba(255,255,255,0.1)", "rgba(255,255,255,0.05)"]}
                  style={styles.nutritionCard}
                >
                  <View style={styles.caloriesHeader}>
                    <View>
                      <Text style={styles.caloriesTotalLabel}>총 칼로리</Text>
                      <View style={styles.caloriesTotalRow}>
                        <Text style={styles.caloriesTotal}>
                          {currentMeal.totalCalories}
                        </Text>
                        <Text style={styles.caloriesTotalUnit}>kcal</Text>
                      </View>
                    </View>
                    <View style={styles.caloriesIcon}>
                      <LinearGradient
                        colors={["#e3ff7c", "#a8e063"]}
                        style={styles.caloriesIconGradient}
                      >
                        <Icon name="flame" size={28} color="#111827" />
                      </LinearGradient>
                    </View>
                  </View>

                  <View style={styles.nutritionDivider} />

                  <View style={styles.nutritionInfo}>
                    <View style={styles.nutritionItem}>
                      <View style={styles.nutritionIconContainer}>
                        <LinearGradient
                          colors={[
                            "rgba(59,130,246,0.3)",
                            "rgba(59,130,246,0.1)",
                          ]}
                          style={styles.nutritionIcon}
                        >
                          <Icon
                            name="analytics-outline"
                            size={20}
                            color="#3b82f6"
                          />
                        </LinearGradient>
                      </View>
                      <Text style={styles.nutritionLabel}>탄수화물</Text>
                      <Text style={styles.nutritionValue}>
                        {currentMeal.carbs}
                        <Text style={styles.nutritionUnit}>g</Text>
                      </Text>
                    </View>

                    <View style={styles.nutritionItem}>
                      <View style={styles.nutritionIconContainer}>
                        <LinearGradient
                          colors={[
                            "rgba(239,68,68,0.3)",
                            "rgba(239,68,68,0.1)",
                          ]}
                          style={styles.nutritionIcon}
                        >
                          <Icon
                            name="fitness-outline"
                            size={20}
                            color="#ef4444"
                          />
                        </LinearGradient>
                      </View>
                      <Text style={styles.nutritionLabel}>단백질</Text>
                      <Text style={styles.nutritionValue}>
                        {currentMeal.protein}
                        <Text style={styles.nutritionUnit}>g</Text>
                      </Text>
                    </View>

                    <View style={styles.nutritionItem}>
                      <View style={styles.nutritionIconContainer}>
                        <LinearGradient
                          colors={[
                            "rgba(234,179,8,0.3)",
                            "rgba(234,179,8,0.1)",
                          ]}
                          style={styles.nutritionIcon}
                        >
                          <Icon
                            name="water-outline"
                            size={20}
                            color="#eab308"
                          />
                        </LinearGradient>
                      </View>
                      <Text style={styles.nutritionLabel}>지방</Text>
                      <Text style={styles.nutritionValue}>
                        {currentMeal.fat}
                        <Text style={styles.nutritionUnit}>g</Text>
                      </Text>
                    </View>
                  </View>
                </LinearGradient>
              </View>

              {/* 아침 */}
              <View style={styles.mealCardContainer}>
                <LinearGradient
                  colors={["rgba(255,255,255,0.08)", "rgba(255,255,255,0.04)"]}
                  style={styles.mealCard}
                >
                  <View style={styles.mealCardHeader}>
                    <View style={styles.mealTitleRow}>
                      <View style={styles.mealIconContainer}>
                        <LinearGradient
                          colors={[
                            "rgba(251,191,36,0.3)",
                            "rgba(251,191,36,0.1)",
                          ]}
                          style={styles.mealIcon}
                        >
                          <Text style={styles.mealEmoji}>🌅</Text>
                        </LinearGradient>
                      </View>
                      <View>
                        <Text style={styles.mealTitle}>아침</Text>
                        <Text style={styles.mealTime}>07:00 - 09:00</Text>
                      </View>
                    </View>
                    <View style={styles.mealCaloriesContainer}>
                      <Text style={styles.mealCalories}>
                        {currentMeal.breakfast.calories}
                      </Text>
                      <Text style={styles.mealCaloriesUnit}>kcal</Text>
                    </View>
                  </View>

                  <View style={styles.mealNutritionMini}>
                    <View style={styles.miniNutrient}>
                      <Icon name="ellipse" size={8} color="#3b82f6" />
                      <Text style={styles.mealNutritionText}>
                        탄 {currentMeal.breakfast.carbs}g
                      </Text>
                    </View>
                    <View style={styles.miniNutrient}>
                      <Icon name="ellipse" size={8} color="#ef4444" />
                      <Text style={styles.mealNutritionText}>
                        단 {currentMeal.breakfast.protein}g
                      </Text>
                    </View>
                    <View style={styles.miniNutrient}>
                      <Icon name="ellipse" size={8} color="#eab308" />
                      <Text style={styles.mealNutritionText}>
                        지 {currentMeal.breakfast.fat}g
                      </Text>
                    </View>
                  </View>

                  <View style={styles.mealTags}>
                    {currentMeal.breakfast.meals.length === 0 ? (
                      <View style={styles.emptyMealState}>
                        <Text style={styles.emptyMealText}>식사 없음</Text>
                      </View>
                    ) : (
                      currentMeal.breakfast.meals.map(
                        (meal: any, index: number) => (
                          <View key={index} style={styles.mealTag}>
                            <LinearGradient
                              colors={[
                                "rgba(227,255,124,0.2)",
                                "rgba(168,224,99,0.1)",
                              ]}
                              style={styles.mealTagGradient}
                            >
                              <Text style={styles.mealName}>{meal.name}</Text>
                              <Text style={styles.mealCal}>
                                ({meal.calories}kcal)
                              </Text>
                              <TouchableOpacity
                                style={styles.mealDeleteBtn}
                                onPress={() =>
                                  handleDeleteMeal("breakfast", index)
                                }
                                activeOpacity={0.7}
                              >
                                <Icon
                                  name="close-circle"
                                  size={18}
                                  color="rgba(0,0,0,0.5)"
                                />
                              </TouchableOpacity>
                            </LinearGradient>
                          </View>
                        )
                      )
                    )}
                  </View>
                </LinearGradient>
              </View>

              {/* 점심 */}
              <View style={styles.mealCardContainer}>
                <LinearGradient
                  colors={["rgba(255,255,255,0.08)", "rgba(255,255,255,0.04)"]}
                  style={styles.mealCard}
                >
                  <View style={styles.mealCardHeader}>
                    <View style={styles.mealTitleRow}>
                      <View style={styles.mealIconContainer}>
                        <LinearGradient
                          colors={[
                            "rgba(251,146,60,0.3)",
                            "rgba(251,146,60,0.1)",
                          ]}
                          style={styles.mealIcon}
                        >
                          <Text style={styles.mealEmoji}>☀️</Text>
                        </LinearGradient>
                      </View>
                      <View>
                        <Text style={styles.mealTitle}>점심</Text>
                        <Text style={styles.mealTime}>12:00 - 14:00</Text>
                      </View>
                    </View>
                    <View style={styles.mealCaloriesContainer}>
                      <Text style={styles.mealCalories}>
                        {currentMeal.lunch.calories}
                      </Text>
                      <Text style={styles.mealCaloriesUnit}>kcal</Text>
                    </View>
                  </View>

                  <View style={styles.mealNutritionMini}>
                    <View style={styles.miniNutrient}>
                      <Icon name="ellipse" size={8} color="#3b82f6" />
                      <Text style={styles.mealNutritionText}>
                        탄 {currentMeal.lunch.carbs}g
                      </Text>
                    </View>
                    <View style={styles.miniNutrient}>
                      <Icon name="ellipse" size={8} color="#ef4444" />
                      <Text style={styles.mealNutritionText}>
                        단 {currentMeal.lunch.protein}g
                      </Text>
                    </View>
                    <View style={styles.miniNutrient}>
                      <Icon name="ellipse" size={8} color="#eab308" />
                      <Text style={styles.mealNutritionText}>
                        지 {currentMeal.lunch.fat}g
                      </Text>
                    </View>
                  </View>

                  <View style={styles.mealTags}>
                    {currentMeal.lunch.meals.length === 0 ? (
                      <View style={styles.emptyMealState}>
                        <Text style={styles.emptyMealText}>식사 없음</Text>
                      </View>
                    ) : (
                      currentMeal.lunch.meals.map(
                        (meal: any, index: number) => (
                          <View key={index} style={styles.mealTag}>
                            <LinearGradient
                              colors={[
                                "rgba(227,255,124,0.2)",
                                "rgba(168,224,99,0.1)",
                              ]}
                              style={styles.mealTagGradient}
                            >
                              <Text style={styles.mealName}>{meal.name}</Text>
                              <Text style={styles.mealCal}>
                                ({meal.calories}kcal)
                              </Text>
                              <TouchableOpacity
                                style={styles.mealDeleteBtn}
                                onPress={() => handleDeleteMeal("lunch", index)}
                                activeOpacity={0.7}
                              >
                                <Icon
                                  name="close-circle"
                                  size={18}
                                  color="rgba(0,0,0,0.5)"
                                />
                              </TouchableOpacity>
                            </LinearGradient>
                          </View>
                        )
                      )
                    )}
                  </View>
                </LinearGradient>
              </View>

              {/* 저녁 */}
              <View style={styles.mealCardContainer}>
                <LinearGradient
                  colors={["rgba(255,255,255,0.08)", "rgba(255,255,255,0.04)"]}
                  style={styles.mealCard}
                >
                  <View style={styles.mealCardHeader}>
                    <View style={styles.mealTitleRow}>
                      <View style={styles.mealIconContainer}>
                        <LinearGradient
                          colors={[
                            "rgba(139,92,246,0.3)",
                            "rgba(139,92,246,0.1)",
                          ]}
                          style={styles.mealIcon}
                        >
                          <Text style={styles.mealEmoji}>🌙</Text>
                        </LinearGradient>
                      </View>
                      <View>
                        <Text style={styles.mealTitle}>저녁</Text>
                        <Text style={styles.mealTime}>18:00 - 20:00</Text>
                      </View>
                    </View>
                    <View style={styles.mealCaloriesContainer}>
                      <Text style={styles.mealCalories}>
                        {currentMeal.dinner.calories}
                      </Text>
                      <Text style={styles.mealCaloriesUnit}>kcal</Text>
                    </View>
                  </View>

                  <View style={styles.mealNutritionMini}>
                    <View style={styles.miniNutrient}>
                      <Icon name="ellipse" size={8} color="#3b82f6" />
                      <Text style={styles.mealNutritionText}>
                        탄 {currentMeal.dinner.carbs}g
                      </Text>
                    </View>
                    <View style={styles.miniNutrient}>
                      <Icon name="ellipse" size={8} color="#ef4444" />
                      <Text style={styles.mealNutritionText}>
                        단 {currentMeal.dinner.protein}g
                      </Text>
                    </View>
                    <View style={styles.miniNutrient}>
                      <Icon name="ellipse" size={8} color="#eab308" />
                      <Text style={styles.mealNutritionText}>
                        지 {currentMeal.dinner.fat}g
                      </Text>
                    </View>
                  </View>

                  <View style={styles.mealTags}>
                    {currentMeal.dinner.meals.length === 0 ? (
                      <View style={styles.emptyMealState}>
                        <Text style={styles.emptyMealText}>식사 없음</Text>
                      </View>
                    ) : (
                      currentMeal.dinner.meals.map(
                        (meal: any, index: number) => (
                          <View key={index} style={styles.mealTag}>
                            <LinearGradient
                              colors={[
                                "rgba(227,255,124,0.2)",
                                "rgba(168,224,99,0.1)",
                              ]}
                              style={styles.mealTagGradient}
                            >
                              <Text style={styles.mealName}>{meal.name}</Text>
                              <Text style={styles.mealCal}>
                                ({meal.calories}kcal)
                              </Text>
                              <TouchableOpacity
                                style={styles.mealDeleteBtn}
                                onPress={() =>
                                  handleDeleteMeal("dinner", index)
                                }
                                activeOpacity={0.7}
                              >
                                <Icon
                                  name="close-circle"
                                  size={18}
                                  color="rgba(0,0,0,0.5)"
                                />
                              </TouchableOpacity>
                            </LinearGradient>
                          </View>
                        )
                      )
                    )}
                  </View>
                </LinearGradient>
              </View>

              <View style={styles.actionButtons}>
                <TouchableOpacity
                  style={styles.saveButton}
                  onPress={handleSaveMealPlan}
                  disabled={loading}
                  activeOpacity={0.9}
                >
                  <LinearGradient
                    colors={["#e3ff7c", "#a8e063"]}
                    style={styles.saveButtonGradient}
                  >
                    {loading ? (
                      <ActivityIndicator color="#111827" />
                    ) : (
                      <>
                        <Icon
                          name="bookmark"
                          size={20}
                          color="#111827"
                          style={{ marginRight: 8 }}
                        />
                        <Text style={styles.saveButtonText}>식단 저장하기</Text>
                      </>
                    )}
                  </LinearGradient>
                </TouchableOpacity>

                <TouchableOpacity
                  style={styles.refreshButton}
                  onPress={handleGetRecommendation}
                  disabled={loading}
                  activeOpacity={0.8}
                >
                  <LinearGradient
                    colors={["rgba(255,255,255,0.1)", "rgba(255,255,255,0.05)"]}
                    style={styles.refreshButtonGradient}
                  >
                    {loading ? (
                      <ActivityIndicator color="#ffffff" />
                    ) : (
                      <>
                        <Icon
                          name="refresh"
                          size={20}
                          color="#ffffff"
                          style={{ marginRight: 8 }}
                        />
                        <Text style={styles.refreshButtonText}>
                          다시 추천받기
                        </Text>
                      </>
                    )}
                  </LinearGradient>
                </TouchableOpacity>
              </View>
            </View>
          )}

          <View style={styles.navigation}>
            <TouchableOpacity
              style={[styles.navBtn]}
              onPress={() => setCurrentDay(Math.max(0, currentDay - 1))}
              disabled={currentDay === 0}
              activeOpacity={0.8}
            >
              <LinearGradient
                colors={
                  currentDay === 0
                    ? ["rgba(255,255,255,0.03)", "rgba(255,255,255,0.01)"]
                    : ["rgba(255,255,255,0.1)", "rgba(255,255,255,0.05)"]
                }
                style={styles.navBtnGradient}
              >
                <Icon
                  name="chevron-back"
                  size={24}
                  color={currentDay === 0 ? "#374151" : "#ffffff"}
                />
              </LinearGradient>
            </TouchableOpacity>

            <View style={styles.dayIndicator}>
              <Text style={styles.dayIndicatorText}>
                {currentDay + 1} / {weeklyMeals.length}
              </Text>
            </View>

            <TouchableOpacity
              style={[styles.navBtn]}
              onPress={() =>
                setCurrentDay(Math.min(weeklyMeals.length - 1, currentDay + 1))
              }
              disabled={currentDay === weeklyMeals.length - 1}
              activeOpacity={0.8}
            >
              <LinearGradient
                colors={
                  currentDay === weeklyMeals.length - 1
                    ? ["rgba(255,255,255,0.03)", "rgba(255,255,255,0.01)"]
                    : ["rgba(255,255,255,0.1)", "rgba(255,255,255,0.05)"]
                }
                style={styles.navBtnGradient}
              >
                <Icon
                  name="chevron-forward"
                  size={24}
                  color={
                    currentDay === weeklyMeals.length - 1
                      ? "#374151"
                      : "#ffffff"
                  }
                />
              </LinearGradient>
            </TouchableOpacity>
          </View>
        </ScrollView>
      </SafeAreaView>
    </View>
  );
};

const styles = StyleSheet.create({
  container: {
    flex: 1,
  },
  safeArea: {
    flex: 1,
  },
  contentWrapper: {
    flex: 1,
  },
  contentContainer: {
    paddingHorizontal: 20,
    paddingTop: 20,
    paddingBottom: 40,
  },
  header: {
    flexDirection: "row",
    justifyContent: "space-between",
    alignItems: "center",
    paddingVertical: 16,
    paddingHorizontal: 20,
  },
  backButton: {
    width: 40,
    height: 40,
  },
  iconButton: {
    width: 40,
    height: 40,
    borderRadius: 20,
    backgroundColor: "rgba(255,255,255,0.1)",
    alignItems: "center",
    justifyContent: "center",
  },
  headerTitle: {
    fontSize: 20,
    fontWeight: "700",
    color: "#ffffff",
    letterSpacing: 0.5,
  },
  welcomeHeader: {
    alignItems: "center",
    marginTop: 40,
    marginBottom: 60,
  },
  welcomeIconContainer: {
    marginBottom: 24,
  },
  welcomeIcon: {
    width: 100,
    height: 100,
    borderRadius: 50,
    alignItems: "center",
    justifyContent: "center",
    shadowColor: "#E3FF7C",
    shadowOffset: { width: 0, height: 8 },
    shadowOpacity: 0.4,
    shadowRadius: 20,
    elevation: 10,
  },
  welcomeEmoji: {
    fontSize: 48,
  },
  welcomeTitle: {
    fontSize: 32,
    fontWeight: "bold",
    color: "#ffffff",
    marginBottom: 12,
    textAlign: "center",
    letterSpacing: 0.5,
  },
  welcomeSubtitle: {
    fontSize: 16,
    color: "#9ca3af",
    textAlign: "center",
    lineHeight: 24,
    letterSpacing: 0.3,
  },
  mainActions: {
    gap: 16,
    marginBottom: 30,
  },
  primaryButton: {
    borderRadius: 16,
    overflow: "hidden",
    shadowColor: "#E3FF7C",
    shadowOffset: { width: 0, height: 4 },
    shadowOpacity: 0.3,
    shadowRadius: 12,
    elevation: 8,
  },
  primaryButtonGradient: {
    flexDirection: "row",
    alignItems: "center",
    justifyContent: "center",
    paddingVertical: 18,
    paddingHorizontal: 24,
  },
  primaryButtonText: {
    fontSize: 17,
    fontWeight: "700",
    color: "#111827",
    letterSpacing: 0.5,
  },
  secondaryButton: {
    borderRadius: 16,
    overflow: "hidden",
  },
  secondaryButtonGradient: {
    flexDirection: "row",
    alignItems: "center",
    justifyContent: "center",
    paddingVertical: 16,
    paddingHorizontal: 24,
    borderWidth: 1,
    borderColor: "rgba(255,255,255,0.2)",
    borderRadius: 16,
  },
  secondaryButtonText: {
    fontSize: 16,
    fontWeight: "600",
    color: "#ffffff",
    letterSpacing: 0.3,
  },
  excludedPreview: {
    marginTop: 20,
    marginBottom: 20,
  },
  glassCard: {
    backgroundColor: "rgba(255,255,255,0.05)",
    borderRadius: 16,
    padding: 20,
    borderWidth: 1,
    borderColor: "rgba(255,255,255,0.1)",
  },
  excludedPreviewLabel: {
    fontSize: 15,
    color: "#9ca3af",
    marginBottom: 16,
    fontWeight: "600",
    letterSpacing: 0.3,
  },
  tagList: {
    flexDirection: "row",
    flexWrap: "wrap",
    gap: 8,
  },
  tag: {
    borderRadius: 12,
    overflow: "hidden",
  },
  tagGradient: {
    paddingVertical: 8,
    paddingHorizontal: 14,
    borderRadius: 12,
  },
  tagText: {
    fontSize: 14,
    color: "#ffffff",
    fontWeight: "500",
  },
  savedMealsSection: {
    marginTop: 30,
  },
  sectionTitle: {
    fontSize: 20,
    fontWeight: "700",
    color: "#ffffff",
    marginBottom: 16,
    letterSpacing: 0.5,
  },
  savedMealItem: {
    marginBottom: 12,
    borderRadius: 16,
    overflow: "hidden",
  },
  savedMealGradient: {
    borderRadius: 16,
    borderWidth: 1,
    borderColor: "rgba(255,255,255,0.1)",
  },
  savedMealContent: {
    flexDirection: "row",
    alignItems: "center",
    justifyContent: "space-between",
    padding: 16,
  },
  savedMealLeft: {
    flex: 1,
  },
  savedMealTitleRow: {
    flexDirection: "row",
    alignItems: "center",
    gap: 8,
    marginBottom: 6,
  },
  savedMealTitle: {
    fontSize: 16,
    fontWeight: "600",
    color: "#ffffff",
    letterSpacing: 0.3,
  },
  localBadge: {
    borderRadius: 8,
    overflow: "hidden",
  },
  localBadgeGradient: {
    flexDirection: "row",
    alignItems: "center",
    gap: 4,
    paddingHorizontal: 8,
    paddingVertical: 3,
  },
  localBadgeText: {
    fontSize: 11,
    fontWeight: "700",
    color: "#111827",
    letterSpacing: 0.5,
  },
  savedMealInfo: {
    fontSize: 14,
    color: "#6b7280",
    letterSpacing: 0.2,
  },
  deleteButton: {
    width: 36,
    height: 36,
    borderRadius: 18,
    backgroundColor: "rgba(239,68,68,0.1)",
    alignItems: "center",
    justifyContent: "center",
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
    flexDirection: "row",
    gap: 12,
    marginBottom: 30,
  },
  inputWrapper: {
    flex: 1,
    borderRadius: 16,
    overflow: "hidden",
  },
  inputGradient: {
    flexDirection: "row",
    alignItems: "center",
    paddingHorizontal: 16,
    paddingVertical: 4,
    borderWidth: 1,
    borderColor: "rgba(255,255,255,0.1)",
    borderRadius: 16,
  },
  inputIcon: {
    marginRight: 12,
  },
  textInput: {
    flex: 1,
    height: 52,
    color: "#ffffff",
    fontSize: 15,
    letterSpacing: 0.3,
  },
  addButton: {
    width: 56,
    height: 56,
    borderRadius: 16,
    overflow: "hidden",
    shadowColor: "#E3FF7C",
    shadowOffset: { width: 0, height: 4 },
    shadowOpacity: 0.3,
    shadowRadius: 8,
    elevation: 6,
  },
  addButtonGradient: {
    width: "100%",
    height: "100%",
    alignItems: "center",
    justifyContent: "center",
  },
  excludedList: {
    gap: 12,
    marginBottom: 30,
    minHeight: 200,
  },
  excludedItem: {
    borderRadius: 14,
    overflow: "hidden",
  },
  excludedItemGradient: {
    flexDirection: "row",
    alignItems: "center",
    justifyContent: "space-between",
    paddingVertical: 16,
    paddingHorizontal: 16,
    borderWidth: 1,
    borderColor: "rgba(255,255,255,0.1)",
    borderRadius: 14,
  },
  excludedItemLeft: {
    flexDirection: "row",
    alignItems: "center",
    flex: 1,
    gap: 12,
  },
  excludedItemIcon: {
    width: 36,
    height: 36,
    borderRadius: 18,
    backgroundColor: "rgba(239,68,68,0.1)",
    alignItems: "center",
    justifyContent: "center",
  },
  excludedItemText: {
    fontSize: 16,
    fontWeight: "500",
    color: "#ffffff",
    flex: 1,
    letterSpacing: 0.3,
  },
  removeButton: {
    width: 32,
    height: 32,
    alignItems: "center",
    justifyContent: "center",
  },
  emptyState: {
    alignItems: "center",
    justifyContent: "center",
    paddingVertical: 60,
    paddingHorizontal: 40,
  },
  emptyMessage: {
    textAlign: "center",
    color: "#6b7280",
    fontSize: 16,
    fontWeight: "600",
    marginTop: 16,
    marginBottom: 8,
    letterSpacing: 0.3,
  },
  emptySubtext: {
    textAlign: "center",
    color: "#4b5563",
    fontSize: 14,
    letterSpacing: 0.2,
  },
  completeButton: {
    borderRadius: 16,
    overflow: "hidden",
    shadowColor: "#E3FF7C",
    shadowOffset: { width: 0, height: 4 },
    shadowOpacity: 0.3,
    shadowRadius: 12,
    elevation: 8,
  },
  completeButtonGradient: {
    flexDirection: "row",
    alignItems: "center",
    justifyContent: "center",
    paddingVertical: 18,
  },
  completeButtonText: {
    fontSize: 17,
    fontWeight: "700",
    color: "#111827",
    letterSpacing: 0.5,
  },
  mealDateContainer: {
    paddingHorizontal: 20,
    paddingTop: 16,
    paddingBottom: 16,
    alignItems: "center",
  },
  dateBadge: {
    flexDirection: "row",
    alignItems: "center",
    paddingHorizontal: 16,
    paddingVertical: 8,
    borderRadius: 20,
    borderWidth: 1,
    borderColor: "rgba(227,255,124,0.2)",
  },
  mealDate: {
    fontSize: 14,
    color: "#E3FF7C",
    fontWeight: "600",
    letterSpacing: 0.3,
  },
  dayTabs: {
    marginVertical: 16,
  },
  dayTabsContent: {
    paddingHorizontal: 20,
    gap: 10,
  },
  dayTabContainer: {
    borderRadius: 24,
  },
  dayTab: {
    backgroundColor: "rgba(255,255,255,0.05)",
    paddingVertical: 10,
    paddingHorizontal: 20,
    borderRadius: 24,
    borderWidth: 1,
    borderColor: "rgba(255,255,255,0.1)",
  },
  dayTabActive: {
    paddingVertical: 10,
    paddingHorizontal: 20,
    borderRadius: 24,
    shadowColor: "#E3FF7C",
    shadowOffset: { width: 0, height: 2 },
    shadowOpacity: 0.3,
    shadowRadius: 8,
    elevation: 4,
  },
  dayTabText: {
    fontSize: 14,
    color: "#9ca3af",
    fontWeight: "500",
    letterSpacing: 0.3,
  },
  dayTabTextActive: {
    fontSize: 14,
    color: "#111827",
    fontWeight: "700",
    letterSpacing: 0.3,
  },
  mealContent: {
    paddingHorizontal: 20,
    paddingBottom: 20,
  },
  nutritionCardContainer: {
    marginBottom: 20,
  },
  nutritionCard: {
    borderRadius: 20,
    padding: 24,
    borderWidth: 1,
    borderColor: "rgba(255,255,255,0.1)",
    shadowColor: "#000",
    shadowOffset: { width: 0, height: 4 },
    shadowOpacity: 0.3,
    shadowRadius: 12,
    elevation: 8,
  },
  caloriesHeader: {
    flexDirection: "row",
    justifyContent: "space-between",
    alignItems: "center",
    marginBottom: 20,
  },
  caloriesTotalLabel: {
    fontSize: 14,
    color: "#9ca3af",
    marginBottom: 6,
    fontWeight: "500",
    letterSpacing: 0.5,
  },
  caloriesTotalRow: {
    flexDirection: "row",
    alignItems: "baseline",
  },
  caloriesTotal: {
    fontSize: 42,
    fontWeight: "800",
    color: "#ffffff",
    letterSpacing: -0.5,
  },
  caloriesTotalUnit: {
    fontSize: 20,
    color: "#6b7280",
    marginLeft: 4,
    fontWeight: "600",
  },
  caloriesIcon: {
    width: 56,
    height: 56,
    borderRadius: 28,
    overflow: "hidden",
  },
  caloriesIconGradient: {
    width: "100%",
    height: "100%",
    alignItems: "center",
    justifyContent: "center",
  },
  nutritionDivider: {
    height: 1,
    backgroundColor: "rgba(255,255,255,0.1)",
    marginBottom: 20,
  },
  nutritionInfo: {
    flexDirection: "row",
    justifyContent: "space-between",
    gap: 12,
  },
  nutritionItem: {
    flex: 1,
    alignItems: "center",
  },
  nutritionIconContainer: {
    marginBottom: 10,
  },
  nutritionIcon: {
    width: 44,
    height: 44,
    borderRadius: 22,
    alignItems: "center",
    justifyContent: "center",
  },
  nutritionLabel: {
    color: "#9ca3af",
    fontSize: 13,
    marginBottom: 6,
    fontWeight: "500",
    letterSpacing: 0.3,
  },
  nutritionValue: {
    fontWeight: "700",
    fontSize: 20,
    color: "#ffffff",
    letterSpacing: 0.3,
  },
  nutritionUnit: {
    fontSize: 14,
    color: "#6b7280",
    fontWeight: "600",
  },
  mealCardContainer: {
    marginBottom: 16,
  },
  mealCard: {
    borderRadius: 18,
    padding: 20,
    borderWidth: 1,
    borderColor: "rgba(255,255,255,0.1)",
  },
  mealCardHeader: {
    flexDirection: "row",
    justifyContent: "space-between",
    alignItems: "center",
    marginBottom: 16,
  },
  mealTitleRow: {
    flexDirection: "row",
    alignItems: "center",
    gap: 12,
  },
  mealIconContainer: {
    width: 48,
    height: 48,
    borderRadius: 24,
    overflow: "hidden",
  },
  mealIcon: {
    width: "100%",
    height: "100%",
    alignItems: "center",
    justifyContent: "center",
  },
  mealEmoji: {
    fontSize: 24,
  },
  mealTitle: {
    fontWeight: "700",
    fontSize: 18,
    color: "#ffffff",
    letterSpacing: 0.3,
  },
  mealTime: {
    fontSize: 12,
    color: "#6b7280",
    marginTop: 2,
    fontWeight: "500",
  },
  mealCaloriesContainer: {
    flexDirection: "row",
    alignItems: "baseline",
  },
  mealCalories: {
    fontWeight: "700",
    fontSize: 20,
    color: "#ffffff",
    letterSpacing: 0.3,
  },
  mealCaloriesUnit: {
    fontSize: 14,
    color: "#6b7280",
    marginLeft: 2,
    fontWeight: "600",
  },
  mealNutritionMini: {
    flexDirection: "row",
    gap: 16,
    marginBottom: 16,
    paddingVertical: 8,
  },
  miniNutrient: {
    flexDirection: "row",
    alignItems: "center",
    gap: 6,
  },
  mealNutritionText: {
    fontSize: 13,
    color: "#9ca3af",
    fontWeight: "600",
    letterSpacing: 0.2,
  },
  mealTags: {
    flexDirection: "row",
    flexWrap: "wrap",
    gap: 8,
  },
  mealTag: {
    borderRadius: 14,
    overflow: "hidden",
  },
  mealTagGradient: {
    flexDirection: "row",
    alignItems: "center",
    paddingVertical: 10,
    paddingHorizontal: 14,
    gap: 6,
    borderWidth: 1,
    borderColor: "rgba(227,255,124,0.2)",
    borderRadius: 14,
  },
  mealName: {
    color: "#ffffff",
    fontSize: 14,
    fontWeight: "600",
    letterSpacing: 0.2,
  },
  mealCal: {
    color: "#9ca3af",
    fontSize: 12,
    fontWeight: "500",
  },
  mealDeleteBtn: {
    marginLeft: 4,
  },
  emptyMealState: {
    paddingVertical: 20,
    paddingHorizontal: 16,
    alignItems: "center",
    justifyContent: "center",
    backgroundColor: "rgba(255,255,255,0.03)",
    borderRadius: 12,
    borderWidth: 1,
    borderColor: "rgba(255,255,255,0.05)",
    borderStyle: "dashed",
    width: "100%",
  },
  emptyMealText: {
    fontSize: 14,
    color: "#6b7280",
    fontWeight: "500",
    fontStyle: "italic",
  },
  actionButtons: {
    marginTop: 24,
    gap: 12,
  },
  saveButton: {
    borderRadius: 16,
    overflow: "hidden",
    shadowColor: "#E3FF7C",
    shadowOffset: { width: 0, height: 4 },
    shadowOpacity: 0.3,
    shadowRadius: 12,
    elevation: 8,
  },
  saveButtonGradient: {
    flexDirection: "row",
    alignItems: "center",
    justifyContent: "center",
    paddingVertical: 18,
  },
  saveButtonText: {
    fontSize: 17,
    fontWeight: "700",
    color: "#111827",
    letterSpacing: 0.5,
  },
  refreshButton: {
    borderRadius: 16,
    overflow: "hidden",
  },
  refreshButtonGradient: {
    flexDirection: "row",
    alignItems: "center",
    justifyContent: "center",
    paddingVertical: 16,
    borderWidth: 1,
    borderColor: "rgba(255,255,255,0.2)",
    borderRadius: 16,
  },
  refreshButtonText: {
    fontSize: 16,
    fontWeight: "600",
    color: "#ffffff",
    letterSpacing: 0.3,
  },
  navigation: {
    flexDirection: "row",
    justifyContent: "space-between",
    alignItems: "center",
    marginTop: 20,
    marginBottom: 40,
    marginHorizontal: 20,
  },
  navBtn: {
    width: 50,
    height: 50,
    borderRadius: 25,
    overflow: "hidden",
  },
  navBtnGradient: {
    width: "100%",
    height: "100%",
    alignItems: "center",
    justifyContent: "center",
    borderWidth: 1,
    borderColor: "rgba(255,255,255,0.1)",
    borderRadius: 25,
  },
  dayIndicator: {
    paddingHorizontal: 20,
    paddingVertical: 8,
    backgroundColor: "rgba(255,255,255,0.05)",
    borderRadius: 20,
    borderWidth: 1,
    borderColor: "rgba(255,255,255,0.1)",
  },
  dayIndicatorText: {
    fontSize: 14,
    color: "#9ca3af",
    fontWeight: "600",
    letterSpacing: 0.5,
  },
});

export default MealRecommendScreen;
