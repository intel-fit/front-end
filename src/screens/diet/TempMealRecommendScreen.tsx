// src/screens/diet/TempMealRecommendScreen.tsx

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
} from "react-native";
import { Ionicons as Icon } from "@expo/vector-icons";
import { useNavigation } from "@react-navigation/native";
import { NativeStackNavigationProp } from "@react-navigation/native-stack";
import { RootStackParamList } from "../../navigation/types";
import { SafeAreaView } from "react-native-safe-area-context";
import { LinearGradient } from "expo-linear-gradient";
import AsyncStorage from "@react-native-async-storage/async-storage";
import { recommendedMealAPI, authAPI } from "../../services";
import { TempDayMeal } from "../../services/recommendedMealAPI";
import type { ExclusionResponse, PreferenceResponse } from "../../types";
import { userPreferencesAPI } from "../../services/userPreferencesAPI";
import DislikedFoodsModal from "../../components/modals/DislikedFoodsModal";
import PreferredFoodsModal from "../../components/modals/PreferredFoodsModal";

type NavigationProp = NativeStackNavigationProp<RootStackParamList>;

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

interface MealItem {
  mealType: string;
  mealTypeName: string;
  foods: FoodItem[];
  totalCalories: number;
}

interface FoodItem {
  foodName: string;
  servingSize: number;
  calories: number;
  carbs: number;
  protein: number;
  fat: number;
}

const TempMealRecommendScreen: React.FC = () => {
  const navigation = useNavigation<NavigationProp>();

  const [userId, setUserId] = useState<string>("");

  const [screen, setScreen] = useState<"input" | "result">("input");
  const [currentDayTab, setCurrentDayTab] = useState(0);

  const [excludedFoods, setExcludedFoods] = useState<ExclusionResponse[]>([]);
  const [preferredIngredients, setPreferredIngredients] = useState<
    PreferenceResponse[]
  >([]);

  const [showDislikedModal, setShowDislikedModal] = useState(false);
  const [showPreferredModal, setShowPreferredModal] = useState(false);

  const [selectedPeriod, setSelectedPeriod] = useState<"daily" | "weekly">(
    "daily"
  );
  const [recommendedMeals, setRecommendedMeals] = useState<MealItem[]>([]);
  const [loading, setLoading] = useState<boolean>(false);

  const [mealsPerDay, setMealsPerDay] = useState(3);
  const [showMealsModal, setShowMealsModal] = useState(false);

  const [isTokenDepleted, setIsTokenDepleted] = useState<boolean>(false);

  const [dailyNutrition, setDailyNutrition] = useState({
    calories: 0,
    carbs: 0,
    protein: 0,
    fat: 0,
  });

  const fadeAnim = useRef(new Animated.Value(0)).current;

  useEffect(() => {
    Animated.timing(fadeAnim, {
      toValue: 1,
      duration: 600,
      useNativeDriver: true,
    }).start();
  }, [screen]);

  useEffect(() => {
    const init = async () => {
      await loadUserData();
    };
    init();
  }, []);

  const loadUserData = async () => {
    try {
      const profile = await authAPI.getProfile();
      const currentUserId = profile.userId;
      setUserId(currentUserId);
      console.log("✅ 유저 ID 로드 완료:", currentUserId);

      const exclusions = await userPreferencesAPI.getExclusions(currentUserId);
      setExcludedFoods(exclusions);
      console.log("✅ 비선호 음식 로드 완료:", exclusions.length, "개");

      const preferences = await userPreferencesAPI.getPreferences(
        currentUserId
      );
      setPreferredIngredients(preferences);
      console.log("✅ 선호 음식 로드 완료:", preferences.length, "개");
    } catch (error) {
      console.error("사용자 데이터 로드 실패:", error);
      try {
        const stored = await AsyncStorage.getItem("excludedIngredients");
        if (stored) {
          setExcludedFoods(JSON.parse(stored));
        }
      } catch (e) {
        console.error("로컬 스토리지 읽기 실패:", e);
      }
    }
  };

  const loadPreferences = async (currentUserId: string) => {
    try {
      console.log("💚 선호 음식 목록 조회:", currentUserId);
      const preferences = await userPreferencesAPI.getPreferences(
        currentUserId
      );
      setPreferredIngredients(preferences);
      console.log("✅ 선호 음식 로드 완료:", preferences.length, "개");
    } catch (error: any) {
      console.error("선호 음식 로드 실패:", error);
    }
  };

  const loadExclusions = async (currentUserId: string) => {
    try {
      console.log("🚫 비선호 음식 목록 조회:", currentUserId);
      const exclusions = await userPreferencesAPI.getExclusions(currentUserId);
      setExcludedFoods(exclusions);
      console.log("✅ 비선호 음식 로드 완료:", exclusions.length, "개");
    } catch (error: any) {
      console.error("비선호 음식 로드 실패:", error);
    }
  };

  const handleCancelLoading = () => {
    Alert.alert("요청 취소", "식단 추천 요청을 취소하시겠습니까?", [
      { text: "계속 기다리기", style: "cancel" },
      {
        text: "취소",
        style: "destructive",
        onPress: () => {
          setLoading(false);
        },
      },
    ]);
  };

  const handleGenerate = async () => {
    if (isTokenDepleted) {
      Alert.alert("알림", "이미 이번 주 추천 횟수를 모두 사용했습니다.");
      return;
    }

    try {
      setLoading(true);

      console.log("🍽️ 임시 식단 생성 시작");
      console.log(`📊 끼니 수: ${mealsPerDay}끼`);

      const weeklyData: TempDayMeal[] =
        await recommendedMealAPI.getWeeklyMealPlan(mealsPerDay);

      if (!weeklyData || weeklyData.length === 0) {
        throw new Error("추천된 식단 데이터가 없습니다.");
      }

      const todayPlan = weeklyData[0];
      const mealTypeMap: { [key: string]: string } = {
        BREAKFAST: "아침",
        LUNCH: "점심",
        DINNER: "저녁",
      };

      let totalCal = 0,
        totalCarb = 0,
        totalProt = 0,
        totalFat = 0;

      const parsedMeals: MealItem[] =
        todayPlan.meals?.map((meal) => {
          totalCal += meal.totalCalories;
          meal.foods.forEach((f) => {
            totalCarb += f.carbs || 0;
            totalProt += f.protein || 0;
            totalFat += f.fat || 0;
          });

          const foods: FoodItem[] =
            meal.foods?.map((food) => ({
              foodName: food.foodName || "알 수 없음",
              servingSize: Math.round(food.servingSize || 100),
              calories: Math.round(food.calories || 0),
              carbs: Math.round(food.carbs || 0),
              protein: Math.round(food.protein || 0),
              fat: Math.round(food.fat || 0),
            })) || [];

          return {
            mealType: meal.mealType,
            mealTypeName: mealTypeMap[meal.mealType] || meal.mealType,
            foods,
            totalCalories: Math.round(meal.totalCalories),
          };
        }) || [];

      const order = { BREAKFAST: 1, LUNCH: 2, DINNER: 3 };
      parsedMeals.sort((a, b) => {
        const orderA = order[a.mealType as keyof typeof order] || 4;
        const orderB = order[b.mealType as keyof typeof order] || 4;
        return orderA - orderB;
      });

      setRecommendedMeals(parsedMeals);
      setDailyNutrition({
        calories: Math.round(totalCal),
        carbs: Math.round(totalCarb),
        protein: Math.round(totalProt),
        fat: Math.round(totalFat),
      });

      setScreen("result");
      setCurrentDayTab(0);

      Alert.alert("성공", "오늘의 식단이 추천되었습니다!");
    } catch (error: any) {
      console.error("식단 생성 오류:", error);

      const errorMessage = error.message || "";
      if (
        errorMessage.includes("토큰이 부족") ||
        errorMessage.includes("무료 식단 추천") ||
        error.status === 403
      ) {
        setIsTokenDepleted(true);
      } else {
        let finalErrorMessage = errorMessage || "식단 생성에 실패했습니다.";
        if (error.status === 500) {
          finalErrorMessage =
            "서버에 일시적인 문제가 발생했습니다.\n잠시 후 다시 시도해주세요.";
        }
        Alert.alert("오류", finalErrorMessage);
      }
    } finally {
      setLoading(false);
    }
  };

  const handleSave = async () => {
    try {
      setLoading(true);
      console.log("💾 식단 저장 요청 (Server Commit)");
      await recommendedMealAPI.saveTempMealPlan();

      Alert.alert(
        "저장 완료! 🎉",
        "AI 추천 식단이 기록되었습니다.\n기록하기 화면에서 확인하세요.",
        [
          {
            text: "확인",
            onPress: () => navigation.goBack(),
          },
        ]
      );
    } catch (error: any) {
      console.error("❌ 저장 오류:", error);
      Alert.alert("오류", error.message || "저장에 실패했습니다.");
    } finally {
      setLoading(false);
    }
  };

  const handleTabPress = (index: number) => {
    if (index > 0) {
      Alert.alert(
        "🔒 프리미엄 기능",
        "무료 회원은 1일차 식단만 확인할 수 있습니다.\n7일 전체 식단을 보려면 프리미엄으로 업그레이드하세요.",
        [
          { text: "닫기", style: "cancel" },
          {
            text: "업그레이드",
            onPress: () =>
              navigation.navigate("Main", {
                screen: "MyPage",
                params: { openPremiumModal: true },
              } as any),
          },
        ]
      );
    } else {
      setCurrentDayTab(index);
    }
  };

  if (screen === "input") {
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

          <MealsSelectionModal
            visible={showMealsModal}
            currentMeals={mealsPerDay}
            onSelect={(num) => {
              setMealsPerDay(num);
              console.log(`✅ 끼니 수 변경: ${num}끼`);
            }}
            onClose={() => setShowMealsModal(false)}
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

          <View style={styles.header}>
            <TouchableOpacity
              onPress={() => navigation.goBack()}
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
            contentContainerStyle={styles.contentContainer}
          >
            <View style={styles.freeUserBannerContainer}>
              <LinearGradient
                colors={["rgba(255,255,255,0.1)", "rgba(255,255,255,0.05)"]}
                style={styles.freeUserBanner}
              >
                <View style={styles.freeUserBadge}>
                  <LinearGradient
                    colors={["#e3ff7c", "#a8e063"]}
                    style={styles.freeUserBadgeGradient}
                  >
                    <Icon name="gift-outline" size={16} color="#111827" />
                    <Text style={styles.freeUserBadgeText}>무료 회원</Text>
                  </LinearGradient>
                </View>

                <Text style={styles.freeUserTitle}>
                  일주일에 1회 무료 추천!
                </Text>
                <Text style={styles.freeUserSubtitle}>
                  더 많은 식단 추천을 받으려면 프리미엄으로 업그레이드하세요
                </Text>
                <TouchableOpacity
                  style={styles.premiumButton}
                  onPress={() =>
                    navigation.navigate("Main", {
                      screen: "MyPage",
                      params: { openPremiumModal: true },
                    } as any)
                  }
                  activeOpacity={0.9}
                >
                  <LinearGradient
                    colors={["#e3ff7c", "#a8e063"]}
                    style={styles.premiumButtonGradient}
                  >
                    <Icon name="star" size={16} color="#111827" />
                    <Text style={styles.premiumButtonText}>
                      프리미엄으로 무제한 추천받기
                    </Text>
                    <Icon name="arrow-forward" size={16} color="#111827" />
                  </LinearGradient>
                </TouchableOpacity>
              </LinearGradient>
            </View>

            <View style={styles.buttonRow}>
              <TouchableOpacity
                style={styles.settingButtonHalf}
                onPress={() => setShowDislikedModal(true)}
                activeOpacity={0.8}
              >
                <LinearGradient
                  colors={["rgba(255,255,255,0.1)", "rgba(255,255,255,0.05)"]}
                  style={styles.settingButtonGradient}
                >
                  <Icon
                    name="remove-circle-outline"
                    size={24}
                    color="#ef4444"
                  />
                  <Text style={styles.settingButtonTextSmall}>금지 식재료</Text>
                </LinearGradient>
              </TouchableOpacity>

              <TouchableOpacity
                style={styles.settingButtonHalf}
                onPress={() => setShowPreferredModal(true)}
                activeOpacity={0.8}
              >
                <LinearGradient
                  colors={["rgba(255,255,255,0.1)", "rgba(255,255,255,0.05)"]}
                  style={styles.settingButtonGradient}
                >
                  <Icon name="heart-outline" size={24} color="#22c55e" />
                  <Text style={styles.settingButtonTextSmall}>선호 식재료</Text>
                </LinearGradient>
              </TouchableOpacity>
            </View>

            <TouchableOpacity
              style={styles.settingButton}
              onPress={() => setShowMealsModal(true)}
              activeOpacity={0.8}
            >
              <LinearGradient
                colors={["rgba(255,255,255,0.1)", "rgba(255,255,255,0.05)"]}
                style={styles.settingButtonGradientRow}
              >
                <Icon
                  name="restaurant-outline"
                  size={20}
                  color="#ffffff"
                  style={{ marginRight: 8 }}
                />
                <Text style={styles.settingButtonText}>
                  끼니 수정하기 ({mealsPerDay}끼)
                </Text>
              </LinearGradient>
            </TouchableOpacity>

            {excludedFoods.length > 0 && (
              <View style={styles.excludedPreview}>
                <View style={styles.glassCard}>
                  <View style={styles.previewHeader}>
                    <Icon name="ban" size={20} color="#ef4444" />
                    <Text style={styles.excludedPreviewLabel}>
                      제외된 식재료
                    </Text>
                  </View>
                  <View style={styles.tagList}>
                    {excludedFoods.map((item) => (
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

            {preferredIngredients.length > 0 && (
              <View style={styles.excludedPreview}>
                <View style={styles.glassCard}>
                  <View style={styles.previewHeader}>
                    <Icon name="heart" size={20} color="#22c55e" />
                    <Text style={styles.preferredPreviewLabel}>
                      선호 식재료
                    </Text>
                  </View>
                  <View style={styles.tagList}>
                    {preferredIngredients.map((item) => (
                      <View key={item.id} style={styles.tag}>
                        <LinearGradient
                          colors={[
                            "rgba(34,197,94,0.2)",
                            "rgba(34,197,94,0.1)",
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

            <View style={styles.section}>
              <View style={styles.sectionHeader}>
                <Icon name="calendar-outline" size={22} color="#e3ff7c" />
                <Text style={styles.sectionTitle}>식단 기간</Text>
              </View>

              <View style={styles.periodButtons}>
                <TouchableOpacity
                  style={styles.periodButtonContainer}
                  onPress={() => setSelectedPeriod("daily")}
                  activeOpacity={0.8}
                >
                  {selectedPeriod === "daily" ? (
                    <LinearGradient
                      colors={["#e3ff7c", "#a8e063"]}
                      style={styles.periodButton}
                    >
                      <Icon
                        name="restaurant-outline"
                        size={28}
                        color="#111827"
                      />
                      <Text style={styles.periodButtonTextActive}>
                        1일 식단
                      </Text>
                      <Text style={styles.periodButtonSubtextActive}>
                        오늘 하루
                      </Text>
                    </LinearGradient>
                  ) : (
                    <View style={styles.periodButton}>
                      <Icon
                        name="restaurant-outline"
                        size={28}
                        color="#e3ff7c"
                      />
                      <Text style={styles.periodButtonText}>1일 식단</Text>
                      <Text style={styles.periodButtonSubtext}>오늘 하루</Text>
                    </View>
                  )}
                </TouchableOpacity>

                <TouchableOpacity
                  style={[
                    styles.periodButtonContainer,
                    styles.periodButtonLocked,
                  ]}
                  onPress={() =>
                    Alert.alert(
                      "프리미엄 기능",
                      "7일 식단 추천은 프리미엄 전용입니다.\n업그레이드 하시겠습니까?",
                      [{ text: "취소", style: "cancel" }]
                    )
                  }
                  activeOpacity={0.8}
                >
                  <View style={styles.lockOverlay}>
                    <Icon name="lock-closed" size={32} color="#e3ff7c" />
                  </View>
                  <View style={styles.periodButton}>
                    <Icon name="calendar" size={28} color="#666" />
                    <Text
                      style={[
                        styles.periodButtonText,
                        styles.periodButtonTextLocked,
                      ]}
                    >
                      7일 식단
                    </Text>
                    <View style={styles.premiumTag}>
                      <Icon name="star" size={10} color="#e3ff7c" />
                      <Text style={styles.premiumTagText}>프리미엄</Text>
                    </View>
                  </View>
                </TouchableOpacity>
              </View>
            </View>

            <View style={styles.infoBox}>
              <LinearGradient
                colors={["rgba(227,255,124,0.1)", "rgba(168,224,99,0.05)"]}
                style={styles.infoBoxGradient}
              >
                <Icon
                  name="information-circle-outline"
                  size={20}
                  color="#e3ff7c"
                />
                <View style={styles.infoTextContainer}>
                  <Text style={styles.infoText}>
                    💡 AI가 사용자의 취향과 영양 균형을 분석하여 맞춤형 식단을
                    제안합니다.
                  </Text>
                </View>
              </LinearGradient>
            </View>

            <TouchableOpacity
              style={styles.generateButtonContainer}
              onPress={handleGenerate}
              disabled={loading || isTokenDepleted}
              activeOpacity={0.9}
            >
              <LinearGradient
                colors={
                  isTokenDepleted
                    ? ["#4b5563", "#374151"]
                    : ["#e3ff7c", "#a8e063"]
                }
                style={styles.generateButtonGradient}
              >
                {loading ? (
                  <>
                    <ActivityIndicator size="small" color="#111827" />
                    <Text style={styles.generateButtonText}>생성 중...</Text>
                  </>
                ) : (
                  <>
                    <Icon
                      name={isTokenDepleted ? "checkmark-circle" : "sparkles"}
                      size={20}
                      color={isTokenDepleted ? "#9ca3af" : "#111827"}
                    />
                    <Text
                      style={[
                        styles.generateButtonText,
                        isTokenDepleted && { color: "#9ca3af" },
                      ]}
                    >
                      {isTokenDepleted
                        ? "이번주 추천 완료"
                        : "오늘의 식단 추천받기"}
                    </Text>
                  </>
                )}
              </LinearGradient>
            </TouchableOpacity>

            {isTokenDepleted && (
              <View style={styles.limitInfoContainer}>
                <Icon
                  name="alert-circle-outline"
                  size={16}
                  color="#ef4444"
                  style={{ marginBottom: 6 }}
                />
                <Text style={styles.limitInfoText}>
                  이번 주 무료 추천을 모두 사용하였습니다.{"\n"}
                  다음 주 월요일에 다시 추천 받을 수 있습니다.
                </Text>
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
            onPress={() => setScreen("input")}
            style={styles.backButton}
          >
            <View style={styles.iconButton}>
              <Icon name="chevron-back" size={24} color="#ffffff" />
            </View>
          </TouchableOpacity>
          <Text style={styles.headerTitle}>추천 결과</Text>
          <View style={{ width: 40 }} />
        </View>

        <View style={{ flex: 1 }}>
          <View style={styles.dayTabsWrapper}>
            <ScrollView
              horizontal
              showsHorizontalScrollIndicator={false}
              contentContainerStyle={styles.dayTabsContent}
            >
              {Array.from({ length: 7 }).map((_, index) => {
                const isLocked = index > 0;
                const isActive = currentDayTab === index;

                return (
                  <TouchableOpacity
                    key={index}
                    onPress={() => handleTabPress(index)}
                    activeOpacity={0.8}
                    style={styles.dayTabTouch}
                  >
                    {isActive ? (
                      <LinearGradient
                        colors={["#e3ff7c", "#a8e063"]}
                        style={styles.dayTabActive}
                      >
                        <Text style={styles.dayTabTextActive}>
                          {index + 1}일차
                        </Text>
                      </LinearGradient>
                    ) : (
                      <View
                        style={[styles.dayTab, isLocked && styles.dayTabLocked]}
                      >
                        {isLocked && (
                          <Icon
                            name="lock-closed"
                            size={14}
                            color="#9ca3af"
                            style={{ marginRight: 4 }}
                          />
                        )}
                        <Text style={styles.dayTabText}>{index + 1}일차</Text>
                      </View>
                    )}
                  </TouchableOpacity>
                );
              })}
            </ScrollView>
          </View>

          <ScrollView
            style={styles.contentWrapper}
            showsVerticalScrollIndicator={false}
            contentContainerStyle={styles.resultContainer}
          >
            <View style={styles.nutritionCard}>
              <LinearGradient
                colors={["rgba(255,255,255,0.1)", "rgba(255,255,255,0.05)"]}
                style={styles.nutritionCardGradient}
              >
                <View style={styles.nutritionHeader}>
                  <Text style={styles.nutritionTitle}>오늘의 영양 섭취</Text>
                  <View style={styles.totalCalBadge}>
                    <Icon name="flame" size={14} color="#111827" />
                    <Text style={styles.totalCalText}>
                      {dailyNutrition.calories} kcal
                    </Text>
                  </View>
                </View>

                <View style={styles.nutritionRow}>
                  <View style={styles.nutrientItem}>
                    <Text style={styles.nutrientLabel}>탄수화물</Text>
                    <Text style={styles.nutrientValue}>
                      {dailyNutrition.carbs}g
                    </Text>
                  </View>
                  <View style={styles.nutrientDivider} />
                  <View style={styles.nutrientItem}>
                    <Text style={styles.nutrientLabel}>단백질</Text>
                    <Text style={styles.nutrientValue}>
                      {dailyNutrition.protein}g
                    </Text>
                  </View>
                  <View style={styles.nutrientDivider} />
                  <View style={styles.nutrientItem}>
                    <Text style={styles.nutrientLabel}>지방</Text>
                    <Text style={styles.nutrientValue}>
                      {dailyNutrition.fat}g
                    </Text>
                  </View>
                </View>
              </LinearGradient>
            </View>

            {recommendedMeals.map((meal, index) => (
              <View key={index} style={styles.mealCardContainer}>
                <LinearGradient
                  colors={["rgba(255,255,255,0.08)", "rgba(255,255,255,0.04)"]}
                  style={styles.mealCard}
                >
                  <View style={styles.mealCardHeader}>
                    <View style={styles.mealTitleRow}>
                      <View style={styles.mealIconContainer}>
                        <LinearGradient
                          colors={
                            meal.mealTypeName === "아침"
                              ? ["rgba(251,191,36,0.3)", "rgba(251,191,36,0.1)"]
                              : meal.mealTypeName === "점심"
                              ? ["rgba(251,146,60,0.3)", "rgba(251,146,60,0.1)"]
                              : ["rgba(139,92,246,0.3)", "rgba(139,92,246,0.1)"]
                          }
                          style={styles.mealIcon}
                        >
                          <Text style={styles.mealEmoji}>
                            {meal.mealTypeName === "아침"
                              ? "🌅"
                              : meal.mealTypeName === "점심"
                              ? "☀️"
                              : "🌙"}
                          </Text>
                        </LinearGradient>
                      </View>
                      <View>
                        <Text style={styles.mealName}>{meal.mealTypeName}</Text>
                        <Text style={styles.mealTime}>
                          {meal.mealTypeName === "아침"
                            ? "07:00 - 09:00"
                            : meal.mealTypeName === "점심"
                            ? "12:00 - 14:00"
                            : "18:00 - 20:00"}
                        </Text>
                      </View>
                    </View>
                    <View style={styles.mealCaloriesContainer}>
                      <Text style={styles.mealCalories}>
                        {meal.totalCalories}
                      </Text>
                      <Text style={styles.mealCaloriesUnit}>kcal</Text>
                    </View>
                  </View>

                  <View style={styles.foodsList}>
                    {meal.foods.map((food, fIdx) => (
                      <View key={fIdx} style={styles.foodTag}>
                        <LinearGradient
                          colors={[
                            "rgba(227,255,124,0.2)",
                            "rgba(168,224,99,0.1)",
                          ]}
                          style={styles.foodTagItemGradient}
                        >
                          <Text style={styles.foodName}>
                            {food.foodName} {food.servingSize}g
                          </Text>
                          <Text style={styles.foodCalories}>
                            ({food.calories}kcal)
                          </Text>
                        </LinearGradient>
                      </View>
                    ))}
                  </View>
                </LinearGradient>
              </View>
            ))}

            <View style={styles.resultActions}>
              <TouchableOpacity
                style={styles.saveButtonContainer}
                onPress={handleSave}
                disabled={loading}
                activeOpacity={0.9}
              >
                <LinearGradient
                  colors={["#e3ff7c", "#a8e063"]}
                  style={styles.saveButtonGradient}
                >
                  <Icon name="bookmark" size={20} color="#111827" />
                  <Text style={styles.saveButtonText}>이 식단 저장하기</Text>
                </LinearGradient>
              </TouchableOpacity>

              <TouchableOpacity
                style={styles.retryButton}
                onPress={() => setScreen("input")}
              >
                <Text style={styles.retryButtonText}>다시 설정하기</Text>
              </TouchableOpacity>
            </View>
          </ScrollView>
        </View>
      </SafeAreaView>
    </View>
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

const styles = StyleSheet.create({
  container: { flex: 1 },
  safeArea: { flex: 1 },
  contentWrapper: { flex: 1 },
  contentContainer: { paddingHorizontal: 20, paddingBottom: 40 },
  resultContainer: { paddingHorizontal: 20, paddingBottom: 40, paddingTop: 10 },

  header: {
    flexDirection: "row",
    justifyContent: "space-between",
    alignItems: "center",
    paddingVertical: 16,
    paddingHorizontal: 20,
  },
  backButton: { width: 40, height: 40 },
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

  freeUserBannerContainer: {
    marginTop: 20,
    marginBottom: 24,
    borderRadius: 20,
    overflow: "hidden",
    shadowColor: "#000",
    shadowOffset: { width: 0, height: 4 },
    shadowOpacity: 0.2,
    shadowRadius: 12,
    elevation: 6,
  },
  freeUserBanner: { padding: 20, gap: 12, borderRadius: 20 },
  freeUserBadge: {
    alignSelf: "flex-start",
    borderRadius: 12,
    overflow: "hidden",
  },
  freeUserBadgeGradient: {
    flexDirection: "row",
    alignItems: "center",
    gap: 6,
    paddingHorizontal: 12,
    paddingVertical: 6,
  },
  freeUserBadgeText: { fontSize: 12, fontWeight: "700", color: "#111827" },
  freeUserTitle: { fontSize: 20, fontWeight: "700", color: "#e3ff7c" },
  freeUserSubtitle: { fontSize: 14, color: "#9ca3af", lineHeight: 20 },
  premiumButton: { borderRadius: 12, overflow: "hidden", marginTop: 4 },
  premiumButtonGradient: {
    flexDirection: "row",
    alignItems: "center",
    justifyContent: "center",
    gap: 8,
    paddingVertical: 14,
  },
  premiumButtonText: { fontSize: 15, fontWeight: "700", color: "#111827" },

  buttonRow: {
    flexDirection: "row",
    gap: 12,
    marginBottom: 12,
  },
  settingButtonHalf: {
    flex: 1,
    borderRadius: 16,
    overflow: "hidden",
  },
  settingButton: {
    borderRadius: 16,
    overflow: "hidden",
    marginBottom: 12,
  },
  settingButtonGradient: {
    flexDirection: "column",
    alignItems: "center",
    justifyContent: "center",
    paddingVertical: 16,
    paddingHorizontal: 12,
    borderWidth: 1,
    borderColor: "rgba(255,255,255,0.2)",
    borderRadius: 16,
    gap: 6,
  },
  settingButtonGradientRow: {
    flexDirection: "row",
    alignItems: "center",
    justifyContent: "center",
    paddingVertical: 16,
    paddingHorizontal: 24,
    borderWidth: 1,
    borderColor: "rgba(255,255,255,0.2)",
    borderRadius: 16,
  },
  settingButtonText: {
    fontSize: 16,
    fontWeight: "600",
    color: "#ffffff",
    letterSpacing: 0.3,
  },
  settingButtonTextSmall: {
    fontSize: 14,
    fontWeight: "600",
    color: "#ffffff",
    letterSpacing: 0.3,
    textAlign: "center",
  },
  badgeText: {
    fontSize: 12,
    fontWeight: "600",
    color: "#9ca3af",
    marginTop: 2,
  },

  excludedPreview: {
    marginTop: 8,
    marginBottom: 20,
  },
  glassCard: {
    backgroundColor: "rgba(255,255,255,0.05)",
    borderRadius: 16,
    padding: 20,
    borderWidth: 1,
    borderColor: "rgba(255,255,255,0.1)",
  },
  previewHeader: {
    flexDirection: "row",
    alignItems: "center",
    marginBottom: 16,
    gap: 8,
  },
  excludedPreviewLabel: {
    fontSize: 15,
    color: "#9ca3af",
    fontWeight: "600",
    letterSpacing: 0.3,
  },
  preferredPreviewLabel: {
    fontSize: 15,
    color: "#22c55e",
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

  section: { marginBottom: 24 },
  sectionHeader: {
    flexDirection: "row",
    alignItems: "center",
    gap: 8,
    marginBottom: 12,
  },
  sectionTitle: { fontSize: 18, fontWeight: "700", color: "#ffffff" },
  periodButtons: { flexDirection: "row", gap: 12 },
  periodButtonContainer: { flex: 1, borderRadius: 16, overflow: "hidden" },
  periodButton: {
    backgroundColor: "rgba(255,255,255,0.05)",
    padding: 20,
    borderRadius: 16,
    alignItems: "center",
    gap: 8,
    borderWidth: 1,
    borderColor: "rgba(255,255,255,0.1)",
  },
  periodButtonLocked: { opacity: 0.7 },
  periodButtonText: { fontSize: 16, fontWeight: "700", color: "#e3ff7c" },
  periodButtonTextActive: { fontSize: 16, fontWeight: "700", color: "#111827" },
  periodButtonTextLocked: { color: "#6b7280" },
  periodButtonSubtext: { fontSize: 12, color: "#6b7280", fontWeight: "500" },
  periodButtonSubtextActive: {
    fontSize: 12,
    color: "#374151",
    fontWeight: "600",
  },
  lockOverlay: {
    position: "absolute",
    top: 0,
    left: 0,
    right: 0,
    bottom: 0,
    backgroundColor: "rgba(0,0,0,0.5)",
    justifyContent: "center",
    alignItems: "center",
    zIndex: 1,
  },
  premiumTag: {
    flexDirection: "row",
    alignItems: "center",
    gap: 4,
    backgroundColor: "rgba(227,255,124,0.1)",
    paddingHorizontal: 8,
    paddingVertical: 4,
    borderRadius: 8,
  },
  premiumTagText: { fontSize: 10, fontWeight: "700", color: "#e3ff7c" },

  infoBox: { marginBottom: 20, borderRadius: 14, overflow: "hidden" },
  infoBoxGradient: {
    flexDirection: "row",
    alignItems: "flex-start",
    gap: 12,
    padding: 16,
    borderWidth: 1,
    borderColor: "rgba(227,255,124,0.2)",
    borderRadius: 14,
  },
  infoTextContainer: { flex: 1 },
  infoText: {
    fontSize: 13,
    color: "#e3ff7c",
    lineHeight: 18,
    fontWeight: "500",
  },

  generateButtonContainer: {
    borderRadius: 16,
    overflow: "hidden",
    marginBottom: 12,
  },
  generateButtonGradient: {
    flexDirection: "row",
    alignItems: "center",
    justifyContent: "center",
    gap: 10,
    paddingVertical: 18,
  },
  generateButtonText: { fontSize: 17, fontWeight: "700", color: "#111827" },

  limitInfoContainer: {
    marginTop: 8,
    alignItems: "center",
    paddingVertical: 10,
  },
  limitInfoText: {
    fontSize: 13,
    color: "#9ca3af",
    textAlign: "center",
    lineHeight: 20,
  },

  dayTabsWrapper: { marginBottom: 16 },
  dayTabsContent: { paddingHorizontal: 20, paddingBottom: 10, gap: 10 },
  dayTabTouch: { borderRadius: 20, overflow: "hidden" },
  dayTab: {
    flexDirection: "row",
    alignItems: "center",
    justifyContent: "center",
    paddingVertical: 10,
    paddingHorizontal: 16,
    borderRadius: 20,
    backgroundColor: "rgba(255,255,255,0.05)",
    borderWidth: 1,
    borderColor: "rgba(255,255,255,0.1)",
  },
  dayTabLocked: {
    backgroundColor: "rgba(0,0,0,0.3)",
    borderColor: "rgba(255,255,255,0.05)",
  },
  dayTabActive: {
    paddingVertical: 10,
    paddingHorizontal: 16,
    borderRadius: 20,
  },
  dayTabText: { fontSize: 14, color: "#9ca3af", fontWeight: "600" },
  dayTabTextActive: { fontSize: 14, color: "#111827", fontWeight: "700" },

  nutritionCard: { borderRadius: 20, overflow: "hidden", marginBottom: 20 },
  nutritionCardGradient: {
    padding: 20,
    borderWidth: 1,
    borderColor: "rgba(255,255,255,0.1)",
    borderRadius: 20,
  },
  nutritionHeader: {
    flexDirection: "row",
    justifyContent: "space-between",
    alignItems: "center",
    marginBottom: 16,
  },
  nutritionTitle: { fontSize: 16, fontWeight: "700", color: "#fff" },
  totalCalBadge: {
    flexDirection: "row",
    alignItems: "center",
    backgroundColor: "#e3ff7c",
    paddingHorizontal: 10,
    paddingVertical: 4,
    borderRadius: 12,
    gap: 4,
  },
  totalCalText: { fontSize: 14, fontWeight: "700", color: "#111827" },
  nutritionRow: {
    flexDirection: "row",
    justifyContent: "space-between",
    alignItems: "center",
  },
  nutrientItem: { alignItems: "center", flex: 1 },
  nutrientLabel: { fontSize: 12, color: "#9ca3af", marginBottom: 4 },
  nutrientValue: { fontSize: 16, fontWeight: "700", color: "#fff" },
  nutrientDivider: {
    width: 1,
    height: 30,
    backgroundColor: "rgba(255,255,255,0.1)",
  },

  mealCardContainer: { marginBottom: 16, borderRadius: 18, overflow: "hidden" },
  mealCard: {
    padding: 20,
    borderWidth: 1,
    borderColor: "rgba(255,255,255,0.1)",
    borderRadius: 18,
  },
  mealCardHeader: {
    flexDirection: "row",
    justifyContent: "space-between",
    alignItems: "center",
    marginBottom: 16,
  },
  mealTitleRow: { flexDirection: "row", alignItems: "center", gap: 12 },
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
  mealEmoji: { fontSize: 24 },
  mealName: { fontSize: 18, fontWeight: "700", color: "#ffffff" },
  mealTime: { fontSize: 12, color: "#6b7280", marginTop: 2, fontWeight: "500" },
  mealCaloriesContainer: { flexDirection: "row", alignItems: "baseline" },
  mealCalories: { fontSize: 20, fontWeight: "700", color: "#ffffff" },
  mealCaloriesUnit: {
    fontSize: 14,
    color: "#6b7280",
    marginLeft: 2,
    fontWeight: "600",
  },
  foodsList: { flexDirection: "row", flexWrap: "wrap", gap: 8 },
  foodTag: { borderRadius: 14, overflow: "hidden" },
  foodTagItemGradient: {
    flexDirection: "row",
    alignItems: "center",
    gap: 6,
    paddingVertical: 10,
    paddingHorizontal: 14,
    borderWidth: 1,
    borderColor: "rgba(227,255,124,0.2)",
    borderRadius: 14,
  },
  foodName: { fontSize: 14, color: "#ffffff", fontWeight: "600" },
  foodCalories: { fontSize: 12, color: "#9ca3af", fontWeight: "500" },

  resultActions: { gap: 12, marginTop: 10 },
  saveButtonContainer: { borderRadius: 16, overflow: "hidden" },
  saveButtonGradient: {
    flexDirection: "row",
    alignItems: "center",
    justifyContent: "center",
    gap: 8,
    paddingVertical: 18,
  },
  saveButtonText: { fontSize: 17, fontWeight: "700", color: "#111827" },
  retryButton: { alignItems: "center", padding: 16 },
  retryButtonText: {
    color: "#9ca3af",
    fontSize: 14,
    textDecorationLine: "underline",
  },
});

export default TempMealRecommendScreen;
