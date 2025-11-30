// src/screens/diet/TempMealRecommendScreen.tsx
import React, { useState, useEffect } from "react";
import {
  View,
  Text,
  StyleSheet,
  ScrollView,
  TouchableOpacity,
  Alert,
  ActivityIndicator,
} from "react-native";
import { Ionicons as Icon } from "@expo/vector-icons";
import { useNavigation } from "@react-navigation/native";
import { NativeStackNavigationProp } from "@react-navigation/native-stack";
import { RootStackParamList } from "../../navigation/types";
import { SafeAreaView } from "react-native-safe-area-context";
import { LinearGradient } from "expo-linear-gradient";
import {
  userPreferencesAPI,
  mealAPI,
  tempRecommendedMealAPI,
} from "../../services";
import AsyncStorage from "@react-native-async-storage/async-storage";

type NavigationProp = NativeStackNavigationProp<RootStackParamList>;

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

  // ✅ 항상 무료 회원 상태로 고정 (프리미엄 전환 로직 제거)
  const [isFreeUser, setIsFreeUser] = useState<boolean>(true);
  const [hasUsedWeeklyRecommendation, setHasUsedWeeklyRecommendation] =
    useState<boolean>(false);

  // 비선호 식재료
  const [excludedFoods, setExcludedFoods] = useState<string[]>([]);

  // 식단 설정
  const [selectedPeriod, setSelectedPeriod] = useState<"daily" | "weekly">(
    "daily"
  );

  // 추천 결과
  const [recommendedMeals, setRecommendedMeals] = useState<MealItem[]>([]);
  const [loading, setLoading] = useState<boolean>(false);
  const [hasRecommendation, setHasRecommendation] = useState<boolean>(false);

  useEffect(() => {
    loadUserData();
  }, []);

  // 사용자 데이터 로드
  const loadUserData = async () => {
    try {
      // ❌ 기존의 테스트 모드(PREMIUM) 체크 로직 제거 -> 항상 무료 회원
      setIsFreeUser(true);

      const lastUsedDate = await AsyncStorage.getItem("lastMealRecommendDate");
      if (lastUsedDate) {
        const lastDate = new Date(lastUsedDate);
        const today = new Date();
        const weekStart = getWeekStart(today);

        // 무료 회원은 이번 주 사용 기록이 있으면 막힘
        if (lastDate >= weekStart) {
          setHasUsedWeeklyRecommendation(true);
        }
      }

      const preferences = await userPreferencesAPI.getUserPreferences();
      if (preferences.dislikedFoods) {
        setExcludedFoods(preferences.dislikedFoods);
      }
    } catch (error) {
      console.error("사용자 데이터 로드 실패:", error);
    }
  };

  // 주의 시작일 계산 (월요일)
  const getWeekStart = (date: Date): Date => {
    const d = new Date(date);
    const day = d.getDay();
    const diff = d.getDate() - day + (day === 0 ? -6 : 1);
    return new Date(d.setDate(diff));
  };

  // 식단 추천 생성
  const handleGenerate = async () => {
    if (hasUsedWeeklyRecommendation) {
      Alert.alert(
        "알림",
        "이번 주 무료 추천을 이미 사용했습니다.\n다음 주에 다시 시도해주세요."
      );
      return;
    }

    try {
      setLoading(true);

      const data =
        await tempRecommendedMealAPI.generateDailyMealPlanWithExclusions(
          3,
          excludedFoods
        );

      const meals = data.daily_plan?.meals || [];
      const parsedMeals: MealItem[] = meals.map((meal) => {
        const mealTypeMap: { [key: number]: string } = {
          1: "아침",
          2: "점심",
          3: "저녁",
        };

        const foods: FoodItem[] =
          meal.items?.map((food) => ({
            foodName: food.food_name || "알 수 없음",
            servingSize: Math.round(food.serving_size_g || 100),
            calories: Math.round(food.ps_energy_kcal || 0),
            carbs: Math.round(food.ps_carb_g || 0),
            protein: Math.round(food.ps_protein_g || 0),
            fat: Math.round(food.ps_fat_g || 0),
          })) || [];

        const totalCalories = foods.reduce(
          (sum, food) => sum + food.calories,
          0
        );

        return {
          mealType: `meal_${meal.meal_number}`,
          mealTypeName:
            mealTypeMap[meal.meal_number] || `식사 ${meal.meal_number}`,
          foods,
          totalCalories: Math.round(totalCalories),
        };
      });

      setRecommendedMeals(parsedMeals);
      setHasRecommendation(true);

      // 무료 회원이므로 사용 기록 저장
      await AsyncStorage.setItem(
        "lastMealRecommendDate",
        new Date().toISOString()
      );
      setHasUsedWeeklyRecommendation(true);

      Alert.alert("성공", "오늘의 식단이 추천되었습니다!");
    } catch (error: any) {
      console.error("식단 생성 오류:", error);
      Alert.alert("오류", "식단 생성에 실패했습니다.");
    } finally {
      setLoading(false);
    }
  };

  // 식단 저장
  const handleSave = async () => {
    if (!hasRecommendation) {
      Alert.alert("알림", "먼저 식단을 추천받아주세요.");
      return;
    }

    try {
      setLoading(true);
      const today = new Date().toISOString().split("T")[0];
      const mealTypeMap: { [key: string]: "BREAKFAST" | "LUNCH" | "DINNER" } = {
        아침: "BREAKFAST",
        점심: "LUNCH",
        저녁: "DINNER",
      };

      for (const meal of recommendedMeals) {
        const mealType = mealTypeMap[meal.mealTypeName];
        if (!mealType) continue;

        await mealAPI.addMeal({
          mealDate: today,
          mealType: mealType,
          memo: `🤖 AI 추천 식단`,
          foods: meal.foods.map((food) => ({
            foodName: food.foodName,
            servingSize: food.servingSize,
            calories: food.calories,
            carbs: food.carbs,
            protein: food.protein,
            fat: food.fat,
          })),
        });
      }

      Alert.alert(
        "저장 완료! 🎉",
        "AI 추천 식단이 기록되었습니다.\n기록하기 화면에서 확인하세요.",
        [
          {
            text: "확인",
            onPress: () => {
              navigation.goBack();
            },
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

  // ❌ toggleMembershipTest 함수 삭제됨 (테스트 버튼 동작 제거)

  const isDisabled = loading || (hasUsedWeeklyRecommendation && isFreeUser);

  return (
    <View style={styles.container}>
      {/* 배경 그라데이션 */}
      <LinearGradient
        colors={["#0a0a0a", "#1a1a2e", "#16213e", "#0f3460"]}
        style={StyleSheet.absoluteFill}
      />

      <SafeAreaView style={styles.safeArea} edges={["top"]}>
        {/* 헤더 */}
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
          {/* ❌ 헤더 우측 테스트 버튼 삭제됨 */}
          <View style={{ width: 40 }} />
        </View>

        <ScrollView
          style={styles.contentWrapper}
          showsVerticalScrollIndicator={false}
          contentContainerStyle={styles.contentContainer}
        >
          {isFreeUser && (
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
                  일주일에 단 하루만 추천 가능!
                </Text>

                <View style={styles.remainingCount}>
                  <View style={styles.remainingCountInner}>
                    <Icon name="calendar-outline" size={16} color="#e3ff7c" />
                    <Text style={styles.remainingText}>
                      이번 주 남은 추천:{" "}
                      <Text style={styles.remainingNumber}>
                        {hasUsedWeeklyRecommendation ? "0회" : "1회"}
                      </Text>
                    </Text>
                  </View>
                </View>

                <TouchableOpacity
                  style={styles.premiumButton}
                  onPress={() => {
                    Alert.alert(
                      "준비 중",
                      "프리미엄 기능은 추후 업데이트될 예정입니다."
                    );
                  }}
                  activeOpacity={0.9}
                >
                  <LinearGradient
                    colors={["#e3ff7c", "#a8e063"]}
                    style={styles.premiumButtonGradient}
                  >
                    <Icon name="star" size={16} color="#111827" />
                    <Text style={styles.premiumButtonText}>
                      프리미엄으로 매일 추천받기
                    </Text>
                    <Icon name="arrow-forward" size={16} color="#111827" />
                  </LinearGradient>
                </TouchableOpacity>
              </LinearGradient>
            </View>
          )}

          {/* 기간 선택 섹션 */}
          <View style={styles.section}>
            <View style={styles.sectionHeader}>
              <Icon name="calendar-outline" size={22} color="#e3ff7c" />
              <Text style={styles.sectionTitle}>식단 기간</Text>
            </View>

            <View style={styles.periodButtons}>
              {/* 1일 버튼 */}
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
                    <Icon name="restaurant-outline" size={28} color="#111827" />
                    <Text style={styles.periodButtonTextActive}>1일 식단</Text>
                    <Text style={styles.periodButtonSubtextActive}>
                      오늘 하루
                    </Text>
                  </LinearGradient>
                ) : (
                  <View style={styles.periodButton}>
                    <Icon name="restaurant-outline" size={28} color="#e3ff7c" />
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
                onPress={() => {
                  Alert.alert(
                    "프리미엄 기능",
                    "7일 식단 추천은 프리미엄 회원 전용입니다."
                  );
                }}
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

          {/* 안내 메시지 */}
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
                  💡 무료 회원은 일주일에 1일 식단만 추천받을 수 있습니다.
                </Text>
                <Text style={styles.infoSubtext}>
                  매일 새로운 식단을 추천받으려면 프리미엄으로 업그레이드하세요!
                </Text>
              </View>
            </LinearGradient>
          </View>

          <TouchableOpacity
            style={[
              styles.generateButtonContainer,
              isDisabled && styles.disabledButtonShadow,
            ]}
            onPress={handleGenerate}
            disabled={isDisabled}
            activeOpacity={0.9}
          >
            {isDisabled ? (
              <LinearGradient
                colors={["#4b5563", "#374151"]}
                style={styles.generateButtonGradient}
              >
                {loading ? (
                  <>
                    <ActivityIndicator size="small" color="#ffffff" />
                    <Text
                      style={[
                        styles.generateButtonTextDisabled,
                        { color: "#ffffff" },
                      ]}
                    >
                      생성 중...
                    </Text>
                  </>
                ) : (
                  <>
                    <Icon
                      name="checkmark-circle-outline"
                      size={20}
                      color="#ffffff"
                    />
                    <Text
                      style={[
                        styles.generateButtonTextDisabled,
                        { color: "#ffffff" },
                      ]}
                    >
                      이번 주 추천 완료
                    </Text>
                  </>
                )}
              </LinearGradient>
            ) : (
              <LinearGradient
                colors={["#e3ff7c", "#a8e063"]}
                style={styles.generateButtonGradient}
              >
                <Icon name="sparkles" size={20} color="#111827" />
                <Text style={styles.generateButtonText}>
                  오늘의 식단 추천받기
                </Text>
              </LinearGradient>
            )}
          </TouchableOpacity>

          {/* 사용 완료 안내 */}
          {hasUsedWeeklyRecommendation && isFreeUser && (
            <View style={styles.usedNotice}>
              <LinearGradient
                colors={["rgba(74,222,128,0.15)", "rgba(74,222,128,0.1)"]}
                style={styles.usedNoticeGradient}
              >
                <Icon name="checkmark-circle" size={20} color="#4ade80" />
                <Text style={styles.usedNoticeText}>
                  이번 주 무료 추천을 모두 사용했습니다. 다음 주 월요일에 다시
                  추천받을 수 있습니다.
                </Text>
              </LinearGradient>
            </View>
          )}

          {/* 추천 결과 */}
          {hasRecommendation && recommendedMeals.length > 0 && (
            <View style={styles.resultSection}>
              <View style={styles.resultHeader}>
                <Icon name="restaurant" size={22} color="#e3ff7c" />
                <Text style={styles.resultTitle}>추천된 오늘의 식단</Text>
              </View>

              {recommendedMeals.map((meal, index) => (
                <View key={index} style={styles.mealCardContainer}>
                  <LinearGradient
                    colors={[
                      "rgba(255,255,255,0.08)",
                      "rgba(255,255,255,0.04)",
                    ]}
                    style={styles.mealCard}
                  >
                    <View style={styles.mealCardHeader}>
                      <View style={styles.mealTitleRow}>
                        <View style={styles.mealIconContainer}>
                          <LinearGradient
                            colors={
                              meal.mealTypeName === "아침"
                                ? [
                                    "rgba(251,191,36,0.3)",
                                    "rgba(251,191,36,0.1)",
                                  ]
                                : meal.mealTypeName === "점심"
                                ? [
                                    "rgba(251,146,60,0.3)",
                                    "rgba(251,146,60,0.1)",
                                  ]
                                : [
                                    "rgba(139,92,246,0.3)",
                                    "rgba(139,92,246,0.1)",
                                  ]
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
                          <Text style={styles.mealName}>
                            {meal.mealTypeName}
                          </Text>
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

                    <View style={styles.mealNutritionMini}>
                      <View style={styles.miniNutrient}>
                        <Icon name="ellipse" size={8} color="#3b82f6" />
                        <Text style={styles.mealNutritionText}>
                          탄{" "}
                          {meal.foods
                            .reduce((sum, f) => sum + f.carbs, 0)
                            .toFixed(0)}
                          g
                        </Text>
                      </View>
                      <View style={styles.miniNutrient}>
                        <Icon name="ellipse" size={8} color="#ef4444" />
                        <Text style={styles.mealNutritionText}>
                          단{" "}
                          {meal.foods
                            .reduce((sum, f) => sum + f.protein, 0)
                            .toFixed(0)}
                          g
                        </Text>
                      </View>
                      <View style={styles.miniNutrient}>
                        <Icon name="ellipse" size={8} color="#eab308" />
                        <Text style={styles.mealNutritionText}>
                          지{" "}
                          {meal.foods
                            .reduce((sum, f) => sum + f.fat, 0)
                            .toFixed(0)}
                          g
                        </Text>
                      </View>
                    </View>

                    <View style={styles.foodsList}>
                      {meal.foods.map((food, foodIndex) => (
                        <View key={foodIndex} style={styles.foodTag}>
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

              {/* 저장 버튼 */}
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
                  {loading ? (
                    <ActivityIndicator size="small" color="#111827" />
                  ) : (
                    <>
                      <Icon name="bookmark" size={20} color="#111827" />
                      <Text style={styles.saveButtonText}>
                        이 식단 저장하기
                      </Text>
                    </>
                  )}
                </LinearGradient>
              </TouchableOpacity>
            </View>
          )}
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

  // 무료 회원 배너
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
  freeUserBanner: {
    padding: 20,
    gap: 12,
    borderRadius: 20,
  },
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
  freeUserBadgeText: {
    fontSize: 12,
    fontWeight: "700",
    color: "#111827",
    letterSpacing: 0.5,
  },
  freeUserTitle: {
    fontSize: 20,
    fontWeight: "700",
    color: "#e3ff7c",
    letterSpacing: 0.3,
  },
  remainingCount: {
    alignSelf: "flex-start",
    borderRadius: 12,
    overflow: "hidden",
    backgroundColor: "rgba(255,255,255,0.05)",
  },
  remainingCountInner: {
    flexDirection: "row",
    alignItems: "center",
    gap: 8,
    paddingHorizontal: 12,
    paddingVertical: 8,
  },
  remainingText: {
    fontSize: 14,
    color: "#ffffff",
    fontWeight: "500",
  },
  remainingNumber: {
    fontSize: 15,
    fontWeight: "700",
    color: "#e3ff7c",
  },
  premiumButton: {
    borderRadius: 12,
    overflow: "hidden",
    marginTop: 4,
    shadowColor: "#e3ff7c",
    shadowOffset: { width: 0, height: 2 },
    shadowOpacity: 0.3,
    shadowRadius: 8,
    elevation: 4,
  },
  premiumButtonGradient: {
    flexDirection: "row",
    alignItems: "center",
    justifyContent: "center",
    gap: 8,
    paddingVertical: 14,
  },
  premiumButtonText: {
    fontSize: 15,
    fontWeight: "700",
    color: "#111827",
    letterSpacing: 0.3,
  },

  // 섹션
  section: {
    marginBottom: 24,
  },
  sectionHeader: {
    flexDirection: "row",
    alignItems: "center",
    gap: 8,
    marginBottom: 12,
  },
  sectionTitle: {
    fontSize: 18,
    fontWeight: "700",
    color: "#ffffff",
    letterSpacing: 0.3,
  },
  glassCard: {
    backgroundColor: "rgba(255,255,255,0.05)",
    borderRadius: 16,
    padding: 16,
    borderWidth: 1,
    borderColor: "rgba(255,255,255,0.1)",
  },

  // 비선호 식재료 (UI 복원)
  foodTags: {
    flexDirection: "row",
    flexWrap: "wrap",
    gap: 8,
  },
  foodTag: {
    borderRadius: 12,
    overflow: "hidden",
  },
  foodTagGradient: {
    flexDirection: "row",
    alignItems: "center",
    gap: 6,
    paddingHorizontal: 12,
    paddingVertical: 8,
    borderWidth: 1,
    borderColor: "rgba(239,68,68,0.2)",
    borderRadius: 12,
  },
  foodTagText: {
    fontSize: 14,
    color: "#ffffff",
    fontWeight: "500",
    letterSpacing: 0.2,
  },
  foodInputContainer: {
    borderRadius: 12,
    overflow: "hidden",
    flex: 1,
    minWidth: 200,
  },
  foodInputGradient: {
    flexDirection: "row",
    alignItems: "center",
    gap: 8,
    paddingHorizontal: 12,
    paddingVertical: 8,
    borderWidth: 1,
    borderColor: "rgba(255,255,255,0.2)",
    borderRadius: 12,
  },
  foodInput: {
    flex: 1,
    fontSize: 14,
    color: "#ffffff",
    minWidth: 100,
  },

  // 기간 선택
  periodButtons: {
    flexDirection: "row",
    gap: 12,
  },
  periodButtonContainer: {
    flex: 1,
    borderRadius: 16,
    overflow: "hidden",
  },
  periodButton: {
    backgroundColor: "rgba(255,255,255,0.05)",
    padding: 20,
    borderRadius: 16,
    alignItems: "center",
    gap: 8,
    borderWidth: 1,
    borderColor: "rgba(255,255,255,0.1)",
  },
  periodButtonLocked: {
    opacity: 0.6,
  },
  periodButtonText: {
    fontSize: 16,
    fontWeight: "700",
    color: "#e3ff7c",
    letterSpacing: 0.3,
  },
  periodButtonTextActive: {
    fontSize: 16,
    fontWeight: "700",
    color: "#111827",
    letterSpacing: 0.3,
  },
  periodButtonTextLocked: {
    color: "#6b7280",
  },
  periodButtonSubtext: {
    fontSize: 12,
    color: "#6b7280",
    fontWeight: "500",
  },
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
    backgroundColor: "rgba(0, 0, 0, 0.6)",
    justifyContent: "center",
    alignItems: "center",
    borderRadius: 16,
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
  premiumTagText: {
    fontSize: 10,
    fontWeight: "700",
    color: "#e3ff7c",
    letterSpacing: 0.5,
  },

  // 안내 박스
  infoBox: {
    marginBottom: 20,
    borderRadius: 14,
    overflow: "hidden",
  },
  infoBoxGradient: {
    flexDirection: "row",
    alignItems: "flex-start",
    gap: 12,
    padding: 16,
    borderWidth: 1,
    borderColor: "rgba(227,255,124,0.2)",
    borderRadius: 14,
  },
  infoTextContainer: {
    flex: 1,
    gap: 6,
  },
  infoText: {
    fontSize: 13,
    color: "#e3ff7c",
    lineHeight: 18,
    fontWeight: "500",
    letterSpacing: 0.2,
  },
  infoSubtext: {
    fontSize: 12,
    color: "#9ca3af",
    lineHeight: 16,
    letterSpacing: 0.2,
  },

  // 추천받기 버튼
  generateButtonContainer: {
    borderRadius: 16,
    overflow: "hidden",
    marginBottom: 12,
    shadowColor: "#e3ff7c",
    shadowOffset: { width: 0, height: 4 },
    shadowOpacity: 0.3,
    shadowRadius: 12,
    elevation: 8,
  },
  generateButtonGradient: {
    flexDirection: "row",
    alignItems: "center",
    justifyContent: "center",
    gap: 10,
    paddingVertical: 18,
  },
  generateButtonText: {
    fontSize: 17,
    fontWeight: "700",
    color: "#111827",
    letterSpacing: 0.5,
  },
  generateButtonTextDisabled: {
    fontSize: 16,
    fontWeight: "600",
    color: "#6b7280",
    letterSpacing: 0.3,
  },

  // 사용 완료 안내
  usedNotice: {
    borderRadius: 14,
    overflow: "hidden",
    marginBottom: 20,
  },
  usedNoticeGradient: {
    flexDirection: "row",
    alignItems: "flex-start",
    gap: 10,
    padding: 14,
    borderWidth: 1,
    borderColor: "rgba(74,222,128,0.3)",
    borderRadius: 14,
  },
  usedNoticeText: {
    flex: 1,
    fontSize: 13,
    color: "#4ade80",
    lineHeight: 18,
    fontWeight: "500",
    letterSpacing: 0.2,
  },

  // 추천 결과
  resultSection: {
    marginTop: 24,
  },
  resultHeader: {
    flexDirection: "row",
    alignItems: "center",
    gap: 8,
    marginBottom: 16,
  },
  resultTitle: {
    fontSize: 18,
    fontWeight: "700",
    color: "#ffffff",
    letterSpacing: 0.3,
  },
  mealCardContainer: {
    marginBottom: 16,
    borderRadius: 18,
    overflow: "hidden",
  },
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
  mealName: {
    fontSize: 18,
    fontWeight: "700",
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
    fontSize: 20,
    fontWeight: "700",
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
  foodsList: {
    flexDirection: "row",
    flexWrap: "wrap",
    gap: 8,
  },
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
  foodName: {
    fontSize: 14,
    color: "#ffffff",
    fontWeight: "600",
    letterSpacing: 0.2,
  },
  foodCalories: {
    fontSize: 12,
    color: "#9ca3af",
    fontWeight: "500",
  },

  // 저장 버튼
  saveButtonContainer: {
    borderRadius: 16,
    overflow: "hidden",
    marginTop: 12,
    shadowColor: "#e3ff7c",
    shadowOffset: { width: 0, height: 4 },
    shadowOpacity: 0.3,
    shadowRadius: 12,
    elevation: 8,
  },
  saveButtonGradient: {
    flexDirection: "row",
    alignItems: "center",
    justifyContent: "center",
    gap: 8,
    paddingVertical: 18,
  },
  saveButtonText: {
    fontSize: 17,
    fontWeight: "700",
    color: "#111827",
    letterSpacing: 0.5,
  },
  disabledButtonShadow: {
    shadowOpacity: 0,
    elevation: 0,
    shadowColor: "transparent",
  },
});

export default TempMealRecommendScreen;
