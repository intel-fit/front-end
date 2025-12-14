// src/screens/diet/MealRecommendScreen.tsx
import React, { useState, useEffect, useRef } from "react";
import {
  View,
  Text,
  StyleSheet,
  ScrollView,
  TouchableOpacity,
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
import { recommendedMealAPI, authAPI } from "../../services";
import { LinearGradient } from "expo-linear-gradient";
import DislikedFoodsModal from "../../components/modals/DislikedFoodsModal";
import type {
  ExclusionResponse,
  PreferenceResponse,
  PreferenceDeleteResponse,
} from "../../types";
import { userPreferencesAPI } from "../../services/userPreferencesAPI";
import PreferredFoodsModal from "../../components/modals/PreferredFoodsModal";

const { width } = Dimensions.get("window");

const LOADING_MESSAGES = [
  "입력하신 정보를 수집하는 중...",
  "회원님께 최적화된 식단을 준비하는 중...",
  "영양소 균형을 계산하는 중...",
  "맛있는 조합을 찾는 중...",
  "거의 다 됐어요! 조금만 기다려주세요...",
];

// ✅ 로딩 오버레이 컴포넌트
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

// ✅ 끼니 선택 모달
const MealsSelectionModal = ({
  visible,
  currentMeals,
  onSelect,
  onClose,
}: {
  visible: boolean;
  currentMeals: number;
  onSelect: (meals: number) => void;
  onClose: () => void;
}) => {
  return (
    <Modal
      visible={visible}
      transparent={true}
      animationType="fade"
      onRequestClose={onClose}
    >
      <TouchableOpacity
        style={mealsModalStyles.overlay}
        activeOpacity={1}
        onPress={onClose}
      >
        <View style={mealsModalStyles.container}>
          <TouchableOpacity activeOpacity={1}>
            <LinearGradient
              colors={["rgba(26,26,46,0.98)", "rgba(22,33,62,0.98)"]}
              style={mealsModalStyles.content}
            >
              <View style={mealsModalStyles.header}>
                <Icon name="restaurant" size={28} color="#e3ff7c" />
                <Text style={mealsModalStyles.title}>끼니 수 선택</Text>
              </View>

              <Text style={mealsModalStyles.subtitle}>
                하루에 몇 끼를 드시나요?
              </Text>

              <View style={mealsModalStyles.optionsContainer}>
                {[1, 2, 3].map((num) => (
                  <TouchableOpacity
                    key={num}
                    style={mealsModalStyles.optionButton}
                    onPress={() => {
                      onSelect(num);
                      onClose();
                    }}
                    activeOpacity={0.8}
                  >
                    <LinearGradient
                      colors={
                        currentMeals === num
                          ? ["#e3ff7c", "#a8e063"]
                          : ["rgba(255,255,255,0.1)", "rgba(255,255,255,0.05)"]
                      }
                      style={mealsModalStyles.optionGradient}
                    >
                      <View style={mealsModalStyles.optionContent}>
                        <View style={mealsModalStyles.optionIconContainer}>
                          {currentMeals === num ? (
                            <Icon
                              name="checkmark-circle"
                              size={32}
                              color="#111827"
                            />
                          ) : (
                            <Icon
                              name="ellipse-outline"
                              size={32}
                              color="#ffffff"
                            />
                          )}
                        </View>
                        <View style={mealsModalStyles.optionTextContainer}>
                          <Text
                            style={[
                              mealsModalStyles.optionNumber,
                              currentMeals === num &&
                                mealsModalStyles.optionNumberActive,
                            ]}
                          >
                            {num}끼
                          </Text>
                          <Text
                            style={[
                              mealsModalStyles.optionDesc,
                              currentMeals === num &&
                                mealsModalStyles.optionDescActive,
                            ]}
                          >
                            {num === 1
                              ? "하루 1끼"
                              : num === 2
                              ? "아침 + 점심 또는 점심 + 저녁"
                              : "아침 + 점심 + 저녁"}
                          </Text>
                        </View>
                      </View>
                    </LinearGradient>
                  </TouchableOpacity>
                ))}
              </View>

              <TouchableOpacity
                style={mealsModalStyles.closeButton}
                onPress={onClose}
                activeOpacity={0.8}
              >
                <Text style={mealsModalStyles.closeButtonText}>취소</Text>
              </TouchableOpacity>
            </LinearGradient>
          </TouchableOpacity>
        </View>
      </TouchableOpacity>
    </Modal>
  );
};

const mealsModalStyles = StyleSheet.create({
  overlay: {
    flex: 1,
    backgroundColor: "rgba(0,0,0,0.8)",
    justifyContent: "center",
    alignItems: "center",
  },
  container: {
    width: "85%",
    maxWidth: 400,
  },
  content: {
    borderRadius: 24,
    padding: 28,
    borderWidth: 1,
    borderColor: "rgba(227,255,124,0.2)",
  },
  header: {
    flexDirection: "row",
    alignItems: "center",
    justifyContent: "center",
    gap: 12,
    marginBottom: 12,
  },
  title: {
    fontSize: 24,
    fontWeight: "800",
    color: "#ffffff",
    letterSpacing: 0.5,
  },
  subtitle: {
    fontSize: 15,
    color: "#9ca3af",
    textAlign: "center",
    marginBottom: 28,
    letterSpacing: 0.3,
  },
  optionsContainer: {
    gap: 12,
    marginBottom: 24,
  },
  optionButton: {
    borderRadius: 16,
    overflow: "hidden",
  },
  optionGradient: {
    borderRadius: 16,
    borderWidth: 1,
    borderColor: "rgba(255,255,255,0.1)",
  },
  optionContent: {
    flexDirection: "row",
    alignItems: "center",
    padding: 18,
    gap: 16,
  },
  optionIconContainer: {
    width: 48,
    height: 48,
    alignItems: "center",
    justifyContent: "center",
  },
  optionTextContainer: {
    flex: 1,
  },
  optionNumber: {
    fontSize: 20,
    fontWeight: "700",
    color: "#ffffff",
    marginBottom: 4,
    letterSpacing: 0.3,
  },
  optionNumberActive: {
    color: "#111827",
  },
  optionDesc: {
    fontSize: 13,
    color: "#9ca3af",
    letterSpacing: 0.2,
  },
  optionDescActive: {
    color: "rgba(17,24,39,0.7)",
  },
  closeButton: {
    paddingVertical: 14,
    alignItems: "center",
    backgroundColor: "rgba(255,255,255,0.05)",
    borderRadius: 12,
    borderWidth: 1,
    borderColor: "rgba(255,255,255,0.1)",
  },
  closeButtonText: {
    fontSize: 16,
    fontWeight: "600",
    color: "#9ca3af",
    letterSpacing: 0.3,
  },
});

const transformTempMealToUI = (tempDay: any, dayIndex: number) => {
  let breakfast, lunch, dinner;

  if (tempDay.meals && tempDay.meals.length > 0) {
    breakfast = tempDay.meals.find((m: any) => m.mealType === "BREAKFAST");
    lunch = tempDay.meals.find((m: any) => m.mealType === "LUNCH");
    dinner = tempDay.meals.find((m: any) => m.mealType === "DINNER");

    if (!breakfast && !lunch && !dinner) {
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
    }
  }

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
          liked: false,
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
          liked: false,
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
          liked: false,
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
  const [userId, setUserId] = useState<string>("");

  const [screen, setScreen] = useState<"welcome" | "meals">("welcome");
  const [showDislikedModal, setShowDislikedModal] = useState(false);
  const [showPreferredModal, setShowPreferredModal] = useState(false);
  const [weeklyMeals, setWeeklyMeals] = useState<any[]>([]);
  const [currentDay, setCurrentDay] = useState(0);

  const [excludedIngredients, setExcludedIngredients] = useState<
    ExclusionResponse[]
  >([]);
  const [preferredIngredients, setPreferredIngredients] = useState<
    PreferenceResponse[]
  >([]);
  const [recommendationType, setRecommendationType] = useState<
    "weekly" | "daily"
  >("weekly");
  const [loading, setLoading] = useState(false);
  const [savedMeals, setSavedMeals] = useState<any[]>([]);
  const [currentPlanId, setCurrentPlanId] = useState<number | null>(null);

  const [mealsPerDay, setMealsPerDay] = useState(3);
  const [showMealsModal, setShowMealsModal] = useState(false);

  const fadeAnim = useRef(new Animated.Value(0)).current;

  useEffect(() => {
    Animated.timing(fadeAnim, {
      toValue: 1,
      duration: 600,
      useNativeDriver: true,
    }).start();
  }, [screen]);

  // 비선호 식단 목록 로드 함수 - userId를 파라미터로 받음
  const loadExclusions = async (currentUserId: string) => {
    try {
      const data = await userPreferencesAPI.getExclusions(currentUserId);
      setExcludedIngredients(data);
      console.log("✅ 비선호 음식 로드 완료:", data.length, "개");
    } catch (error) {
      console.error("비선호 음식 로드 실패:", error);
    }
  };

  //선호 식단 목록 로드 함수 추가
  const loadPreferences = async (currentUserId: string) => {
    try {
      const data = await userPreferencesAPI.getPreferences(currentUserId);
      setPreferredIngredients(data);
      console.log("✅ 선호 음식 로드 완료:", data.length, "개");
    } catch (error) {
      console.error("선호 음식 로드 실패:", error);
    }
  };

  // 🔹 유저 데이터 로드 함수
  const loadUserData = async () => {
    try {
      // 1. 프로필 조회하여 userId 획득
      const profile = await authAPI.getProfile();
      const currentUserId = profile.userId;
      setUserId(currentUserId);
      console.log("✅ 유저 ID 로드 완료:", currentUserId);

      // 2. 획득한 userId로 비선호 , 선호 식단 조회
      await loadExclusions(currentUserId);
      await loadPreferences(currentUserId);
      // 3. 저장된 식단 불러오기
      await loadSavedMeals();
    } catch (error) {
      console.error("사용자 데이터 로드 실패:", error);
    }
  };

  // 🔹 useEffect에서 loadUserData 호출
  useEffect(() => {
    const init = async () => {
      console.log("========== 초기 데이터 로드 ==========");
      await loadUserData();
    };
    init();
  }, []);

  const loadSavedMeals = async () => {
    try {
      const localStored = await AsyncStorage.getItem("savedMealPlans");
      const localMeals = localStored ? JSON.parse(localStored) : [];

      const serverPlans = await recommendedMealAPI.getSavedMealPlans();

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
      });

      const serverBundles = Array.from(bundleMap.values()).map((bundle) => ({
        ...bundle,
        totalCalories: Math.round(
          bundle.totalCalories / (bundle.mealCount || 1)
        ),
        description: `${bundle.mealCount}일 식단`,
      }));

      const allMeals = [...localMeals, ...serverBundles];
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

  // ✅ 7일 식단 추천 받기
  const handleGetRecommendation = async () => {
    setLoading(true);
    setRecommendationType("weekly");

    try {
      console.log("🍽️ 임시 식단 생성 시작");
      const tempMeals = await recommendedMealAPI.getWeeklyMealPlan(mealsPerDay);

      if (!tempMeals || tempMeals.length === 0) {
        throw new Error("식단 생성에 실패했습니다.");
      }

      console.log(`✅ ${tempMeals.length}일치 임시 식단 생성 완료`);

      const weekData = tempMeals.map((tempDay, index) => {
        const transformed = transformTempMealToUI(tempDay, index + 1);
        return transformed;
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

  // ✅ 1일 식단 추천 받기
  const handleGetSingleDayRecommendation = async () => {
    setLoading(true);
    setRecommendationType("daily");
    try {
      console.log("🍽️ 1일 식단 생성 시작");
      const tempMeals = await recommendedMealAPI.getDailyMealPlan(mealsPerDay);

      if (!tempMeals || tempMeals.length === 0) {
        throw new Error("식단 생성에 실패했습니다.");
      }

      console.log("✅ 1일 식단 생성 완료");

      const weekData = tempMeals.map((tempDay, index) =>
        transformTempMealToUI(tempDay, index + 1)
      );

      setWeeklyMeals(weekData);
      setCurrentPlanId(null);
      setScreen("meals");
      setCurrentDay(0);

      Alert.alert("성공", "오늘의 맞춤 식단이 생성되었습니다! 🎉");
    } catch (error: any) {
      console.error("❌ 1일 식단 추천 실패:", error);
      let errorMessage = error.message || "식단을 불러오는데 실패했습니다.";
      if (error.status === 500) {
        errorMessage =
          "서버에 일시적인 문제가 발생했습니다.\n잠시 후 다시 시도해주세요.";
      }
      Alert.alert("오류", errorMessage);
    } finally {
      setLoading(false);
    }
  };
  const handleRefresh = () => {
    if (recommendationType === "daily") {
      handleGetSingleDayRecommendation();
    } else {
      handleGetRecommendation();
    }
  };
  // ✅ 좋아요 토글 함수
  const handleToggleLike = (mealType: string, mealIndex: number) => {
    setWeeklyMeals((prev) => {
      const updated = [...prev];
      const dayMeals = { ...updated[currentDay] };
      const mealArray = [...dayMeals[mealType].meals];

      mealArray[mealIndex] = {
        ...mealArray[mealIndex],
        liked: !mealArray[mealIndex].liked,
      };

      dayMeals[mealType] = {
        ...dayMeals[mealType],
        meals: mealArray,
      };

      updated[currentDay] = dayMeals;
      return updated;
    });
  };
  const collectLikedFoods = (): string[] => {
    const likedFoods: string[] = [];

    weeklyMeals.forEach((day) => {
      // 아침
      day.breakfast.meals.forEach((meal: any) => {
        if (meal.liked) {
          likedFoods.push(meal.name);
        }
      });

      // 점심
      day.lunch.meals.forEach((meal: any) => {
        if (meal.liked) {
          likedFoods.push(meal.name);
        }
      });

      // 저녁
      day.dinner.meals.forEach((meal: any) => {
        if (meal.liked) {
          likedFoods.push(meal.name);
        }
      });
    });

    // 중복 제거
    return Array.from(new Set(likedFoods));
  };

  // 선호 음식 저장 함수
  const handleSavePreferences = async () => {
    const likedFoods = collectLikedFoods();

    if (likedFoods.length === 0) {
      Alert.alert(
        "알림",
        "좋아요한 음식이 없습니다.\n하트를 눌러 좋아하는 음식을 선택해주세요."
      );
      return;
    }

    try {
      setLoading(true);
      console.log("💚 선호 음식 저장 시작:", likedFoods);

      await userPreferencesAPI.addPreferences(userId, likedFoods);

      Alert.alert(
        "저장 완료",
        `${
          likedFoods.length
        }개의 음식이 선호 식단에 추가되었습니다! 💚\n\n추가된 음식:\n${likedFoods.join(
          ", "
        )}`
      );
    } catch (error: any) {
      console.error("❌ 선호 음식 저장 실패:", error);
      Alert.alert(
        "저장 실패",
        error.message || "선호 음식 저장에 실패했습니다."
      );
    } finally {
      setLoading(false);
    }
  };

  // 식단 저장 시 선호 음식도 함께 저장하는 통합 함수
  const handleSaveMealPlanWithPreferences = async () => {
    const likedFoods = collectLikedFoods();

    Alert.alert(
      "식단 저장",
      likedFoods.length > 0
        ? `식단과 함께 ${
            likedFoods.length
          }개의 선호 음식도 저장하시겠습니까?\n\n선호 음식: ${likedFoods.join(
            ", "
          )}`
        : "식단을 저장하시겠습니까?",
      [
        { text: "취소", style: "cancel" },
        {
          text: "저장",
          onPress: async () => {
            try {
              setLoading(true);

              // 1. 식단 저장
              await recommendedMealAPI.saveTempMealPlan();

              // 2. 선호 음식 저장 (있는 경우)
              if (likedFoods.length > 0) {
                await userPreferencesAPI.addPreferences(userId, likedFoods);
              }

              Alert.alert(
                "저장 완료",
                likedFoods.length > 0
                  ? `식단과 ${likedFoods.length}개의 선호 음식이 저장되었습니다! 🎉`
                  : "식단이 저장되었습니다! 🎉"
              );
            } catch (error: any) {
              console.error("❌ 저장 실패:", error);
              Alert.alert("저장 실패", error.message || "저장에 실패했습니다.");
            } finally {
              setLoading(false);
            }
          },
        },
      ]
    );
  };

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

  const handleSaveMealPlan = async () => {
    try {
      setLoading(true);
      console.log("💾 식단 저장 시작");

      await recommendedMealAPI.saveTempMealPlan();

      Alert.alert("저장 완료", "식단이 성공적으로 저장되었습니다!", [
        {
          text: "확인",
          onPress: () => {
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
                const stored = await AsyncStorage.getItem("savedMealPlans");
                const existingMeals = stored ? JSON.parse(stored) : [];
                const updatedMeals = existingMeals.filter(
                  (m: any) => m.id !== meal.id
                );
                await AsyncStorage.setItem(
                  "savedMealPlans",
                  JSON.stringify(updatedMeals)
                );
              } else {
                await recommendedMealAPI.deleteBundle(meal.bundleId || meal.id);
              }

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

          <DislikedFoodsModal
            visible={showDislikedModal}
            userId={userId}
            onClose={() => setShowDislikedModal(false)}
            onUpdate={() => loadExclusions(userId)}
          />

          <PreferredFoodsModal
            visible={showPreferredModal}
            userId={userId}
            onClose={() => setShowPreferredModal(false)}
            onUpdate={() => loadPreferences(userId)}
          />
          <MealsSelectionModal
            visible={showMealsModal}
            currentMeals={mealsPerDay}
            onSelect={(num) => {
              setMealsPerDay(num);
              console.log(`✅ 끼니 수 변경: ${num}끼`);
            }}
            onClose={() => setShowMealsModal(false)}
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
                  <Text style={styles.primaryButtonText}>
                    7일 추천 식단 받기
                  </Text>
                </LinearGradient>
              </TouchableOpacity>

              <TouchableOpacity
                style={styles.primaryButton}
                onPress={handleGetSingleDayRecommendation}
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
                    name="today-outline"
                    size={22}
                    color="#111827"
                    style={{ marginRight: 8 }}
                  />
                  <Text style={styles.primaryButtonText}>
                    1일 추천 식단 받기
                  </Text>
                </LinearGradient>
              </TouchableOpacity>

              <TouchableOpacity
                style={styles.secondaryButton}
                onPress={() => setShowDislikedModal(true)}
                activeOpacity={0.8}
              >
                <LinearGradient
                  colors={["rgba(255,255,255,0.1)", "rgba(255,255,255,0.05)"]}
                  style={styles.secondaryButtonGradient}
                >
                  <Icon
                    name="remove-circle-outline"
                    size={20}
                    color="#ff0000ff"
                    style={{ marginRight: 8 }}
                  />
                  <Text style={styles.secondaryButtonText}>
                    금지 식재료 관리
                  </Text>
                </LinearGradient>
              </TouchableOpacity>

              <TouchableOpacity
                style={styles.secondaryButton}
                onPress={() => setShowPreferredModal(true)}
                activeOpacity={0.8}
              >
                <LinearGradient
                  colors={["rgba(255,255,255,0.1)", "rgba(255,255,255,0.05)"]}
                  style={styles.secondaryButtonGradient}
                >
                  <Icon
                    name="heart-outline"
                    size={20}
                    color="#22c55e"
                    style={{ marginRight: 8 }}
                  />
                  <Text style={styles.secondaryButtonText}>
                    선호 식재료 관리
                  </Text>
                </LinearGradient>
              </TouchableOpacity>

              <TouchableOpacity
                style={styles.secondaryButton}
                onPress={() => setShowMealsModal(true)}
                activeOpacity={0.8}
              >
                <LinearGradient
                  colors={["rgba(255,255,255,0.1)", "rgba(255,255,255,0.05)"]}
                  style={styles.secondaryButtonGradient}
                >
                  <Icon
                    name="restaurant-outline"
                    size={20}
                    color="#ffffff"
                    style={{ marginRight: 8 }}
                  />
                  <Text style={styles.secondaryButtonText}>
                    끼니 수정하기 ({mealsPerDay}끼)
                  </Text>
                </LinearGradient>
              </TouchableOpacity>
            </View>

            {excludedIngredients.length > 0 && (
              <View style={styles.excludedPreview}>
                <View style={styles.glassCard}>
                  <Text style={styles.excludedPreviewLabel}>제외된 식재료</Text>
                  <View style={styles.tagList}>
                    {excludedIngredients.map((item) => (
                      <View key={item.id} style={styles.tag}>
                        <LinearGradient
                          colors={[
                            "rgba(239,68,68,0.2)",
                            "rgba(239,68,68,0.1)",
                          ]}
                          style={styles.tagGradient}
                        >
                          <Text style={styles.tagText}>{item.food_name}</Text>
                        </LinearGradient>
                      </View>
                    ))}
                  </View>
                </View>
              </View>
            )}
            {/* 선호 식재료 UI */}
            {preferredIngredients.length > 0 && (
              <View style={[styles.excludedPreview, { marginTop: 0 }]}>
                <View style={styles.glassCard}>
                  <View
                    style={{
                      flexDirection: "row",
                      alignItems: "center",
                      gap: 6,
                      marginBottom: 16,
                    }}
                  >
                    <Text
                      style={[styles.excludedPreviewLabel, { marginBottom: 0 }]}
                    >
                      선호 식재료
                    </Text>
                  </View>

                  <View style={styles.tagList}>
                    {preferredIngredients.map((item) => (
                      <View key={item.id} style={styles.tag}>
                        <LinearGradient
                          colors={[
                            "rgba(227,255,124,0.2)",
                            "rgba(168,224,99,0.1)",
                          ]}
                          style={styles.tagGradient}
                        >
                          <Text
                            style={[styles.tagText, { color: "#ffffffff" }]}
                          >
                            {item.food_name}
                          </Text>
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
                              <View style={styles.mealTagContent}>
                                <View style={styles.mealTagTextContainer}>
                                  <Text style={styles.mealName}>
                                    {meal.name}
                                  </Text>
                                  <Text style={styles.mealCal}>
                                    ({meal.calories}kcal)
                                  </Text>
                                </View>

                                <View style={styles.mealTagActions}>
                                  <TouchableOpacity
                                    style={styles.mealLikeBtn}
                                    onPress={() =>
                                      handleToggleLike("breakfast", index)
                                    }
                                    activeOpacity={0.7}
                                  >
                                    <Icon
                                      name={
                                        meal.liked ? "heart" : "heart-outline"
                                      }
                                      size={18}
                                      color={
                                        meal.liked
                                          ? "#ef4444"
                                          : "rgba(0,0,0,0.4)"
                                      }
                                    />
                                  </TouchableOpacity>

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
                                </View>
                              </View>
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
                              <View style={styles.mealTagContent}>
                                <View style={styles.mealTagTextContainer}>
                                  <Text style={styles.mealName}>
                                    {meal.name}
                                  </Text>
                                  <Text style={styles.mealCal}>
                                    ({meal.calories}kcal)
                                  </Text>
                                </View>

                                <View style={styles.mealTagActions}>
                                  <TouchableOpacity
                                    style={styles.mealLikeBtn}
                                    onPress={() =>
                                      handleToggleLike("lunch", index)
                                    }
                                    activeOpacity={0.7}
                                  >
                                    <Icon
                                      name={
                                        meal.liked ? "heart" : "heart-outline"
                                      }
                                      size={18}
                                      color={
                                        meal.liked
                                          ? "#ef4444"
                                          : "rgba(0,0,0,0.4)"
                                      }
                                    />
                                  </TouchableOpacity>

                                  <TouchableOpacity
                                    style={styles.mealDeleteBtn}
                                    onPress={() =>
                                      handleDeleteMeal("lunch", index)
                                    }
                                    activeOpacity={0.7}
                                  >
                                    <Icon
                                      name="close-circle"
                                      size={18}
                                      color="rgba(0,0,0,0.5)"
                                    />
                                  </TouchableOpacity>
                                </View>
                              </View>
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
                              <View style={styles.mealTagContent}>
                                <View style={styles.mealTagTextContainer}>
                                  <Text style={styles.mealName}>
                                    {meal.name}
                                  </Text>
                                  <Text style={styles.mealCal}>
                                    ({meal.calories}kcal)
                                  </Text>
                                </View>

                                <View style={styles.mealTagActions}>
                                  <TouchableOpacity
                                    style={styles.mealLikeBtn}
                                    onPress={() =>
                                      handleToggleLike("dinner", index)
                                    }
                                    activeOpacity={0.7}
                                  >
                                    <Icon
                                      name={
                                        meal.liked ? "heart" : "heart-outline"
                                      }
                                      size={18}
                                      color={
                                        meal.liked
                                          ? "#ef4444"
                                          : "rgba(0,0,0,0.4)"
                                      }
                                    />
                                  </TouchableOpacity>

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
                                </View>
                              </View>
                            </LinearGradient>
                          </View>
                        )
                      )
                    )}
                  </View>
                </LinearGradient>
              </View>

              <View style={styles.actionButtons}>
                {/* 식단 저장 버튼 (선호 음식 포함) */}
                <TouchableOpacity
                  style={styles.saveButton}
                  onPress={handleSaveMealPlanWithPreferences}
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
    paddingVertical: 10,
    paddingHorizontal: 14,
    borderWidth: 1,
    borderColor: "rgba(227,255,124,0.2)",
    borderRadius: 14,
  },
  mealTagContent: {
    flexDirection: "row",
    alignItems: "center",
    justifyContent: "space-between",
    width: "100%",
  },
  mealTagTextContainer: {
    flexDirection: "row",
    alignItems: "center",
    gap: 6,
    flex: 1,
  },
  mealTagActions: {
    flexDirection: "row",
    alignItems: "center",
    gap: 8,
    marginLeft: 8,
  },
  mealLikeBtn: {
    width: 28,
    height: 28,
    alignItems: "center",
    justifyContent: "center",
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
    width: 28,
    height: 28,
    alignItems: "center",
    justifyContent: "center",
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
