import React, { useState, useEffect, useRef } from "react";
import {
  View,
  Text,
  StyleSheet,
  ScrollView,
  TouchableOpacity,
  Image,
} from "react-native";
import { SafeAreaView } from "react-native-safe-area-context";
import { MaterialIcons, Ionicons } from "@expo/vector-icons";
import { LinearGradient } from "expo-linear-gradient";
import { colors } from "../../theme/colors";
import { ROUTES } from "../../constants/routes";
import { useDate } from "../../contexts/DateContext";
import { homeAPI } from "../../services";
import { getTodayWorkoutTime } from "../../utils/exerciseApi";
import AsyncStorage from "@react-native-async-storage/async-storage";
import type { DailyProgressWeekItem, HomeResponse } from "../../types";

const HomeScreen = ({ navigation }: any) => {
  const { selectedDate, setSelectedDate } = useDate();
  const [weeklyProgress, setWeeklyProgress] = useState<DailyProgressWeekItem[]>(
    []
  );
  const [homeData, setHomeData] = useState<HomeResponse | null>(null);
  const [todayWorkoutSeconds, setTodayWorkoutSeconds] = useState(0);
  const isLoadingRef = useRef(false);

  // 날짜 형식 변환 함수 (Date -> yyyy-MM-dd)
  const formatDateToString = (date: Date): string => {
    const year = date.getFullYear();
    const month = String(date.getMonth() + 1).padStart(2, "0");
    const day = String(date.getDate()).padStart(2, "0");
    return `${year}-${month}-${day}`;
  };

  // 운동 시간을 시:분:초 형식으로 변환
  const formatWorkoutTime = (seconds: number): string => {
    const hours = Math.floor(seconds / 3600);
    const minutes = Math.floor((seconds % 3600) / 60);
    const secs = seconds % 60;
    return `${String(hours).padStart(2, "0")}:${String(minutes).padStart(2, "0")}:${String(secs).padStart(2, "0")}`;
  };

  // 주간 진행률 데이터 로드
  const loadWeeklyProgress = async () => {
    try {
      const data = await homeAPI.getWeeklyProgress();

      if (Array.isArray(data) && data.length > 0) {
        console.log("주간 진행률 데이터 로드 성공");
        setWeeklyProgress(data);
      } else {
        console.warn("주간 진행률 데이터 비어있음");
        setWeeklyProgress([]);
      }
    } catch (e: any) {
      console.error("주간 진행률 로드 실패:", e);
      console.error("에러 상세:", {
        message: e.message,
        status: e.status,
        data: e.data,
      });
      setWeeklyProgress([]);
    }
  };

  // 특정 날짜의 진행률 데이터 가져오기
  const getDayProgress = (date: Date): DailyProgressWeekItem | undefined => {
    const dateStr = formatDateToString(date);
    const progress = weeklyProgress.find((item) => item.date === dateStr);

    if (!progress) {
      return undefined;
    }

    return progress;
  };

  // 홈 데이터 로드
  const loadHomeData = async () => {
    try {
      const today = new Date();
      const dateString = formatDateToString(today);
      const data = await homeAPI.getHomeData(dateString);
      setHomeData(data);
    } catch (e: any) {
      console.error("홈 데이터 로드 실패:", e);
      setHomeData(null);
    }
  };

  // 오늘의 총 운동 시간 조회
  const loadTodayWorkoutTime = async () => {
    try {
      const userIdStr = await AsyncStorage.getItem("userId");
      if (!userIdStr) return;
      const userId = parseInt(userIdStr, 10);
      if (isNaN(userId)) return;
      const response = await getTodayWorkoutTime(userId);
      setTodayWorkoutSeconds(response.totalSeconds || 0);
    } catch (e: any) {
      console.error("오늘 운동 시간 조회 실패:", e);
      setTodayWorkoutSeconds(0);
    }
  };

  // 운동 시간을 시:분:초 형식으로 변환
  const formatWorkoutTime = (seconds: number): string => {
    const hours = Math.floor(seconds / 3600);
    const minutes = Math.floor((seconds % 3600) / 60);
    const secs = seconds % 60;
    return `${String(hours).padStart(2, "0")}:${String(minutes).padStart(2, "0")}:${String(secs).padStart(2, "0")}`;
  };

  // 화면 포커스 시 데이터 로드
  useEffect(() => {
    const unsubscribe = navigation.addListener("focus", () => {
      if (isLoadingRef.current) {
        console.log("⏸️ 이미 데이터 로딩 중이므로 스킵");
        return;
      }

      isLoadingRef.current = true;
      Promise.all([
        loadWeeklyProgress(),
        loadHomeData(),
        loadTodayWorkoutTime(),
      ]).finally(() => {
        isLoadingRef.current = false;
      });
    });

    return unsubscribe;
  }, [navigation]);

  const handleCalendarClick = () => {
    navigation.navigate("Calendar");
  };

  return (
    <SafeAreaView style={styles.container} edges={["top"]}>
      <View style={styles.header}>
        <Text style={styles.logoText}>INTEL FIT</Text>
      </View>
      <View style={styles.divider} />

      <ScrollView style={styles.content}>
        <View style={styles.greetingSection}>
          <View style={styles.profileGroup}>
            <View style={styles.profileImage}>
              <Text style={styles.profilePlaceholder}>👤</Text>
            </View>
            <Text style={styles.greetingText}>
              {homeData?.userSummary?.name || "회원"}님 어서오세요😊
            </Text>
          </View>

          {/* 메시지 버블 */}
          <View style={styles.messageContainer}>
            {homeData?.todayMeal?.message && (
              <View style={styles.messageBubble}>
                <Text style={styles.messageText}>
                  {homeData.todayMeal.message}
                </Text>
              </View>
            )}
            {homeData?.todayExercise?.message && (
              <View style={styles.messageBubble}>
                <Text style={styles.messageText}>
                  {homeData.todayExercise.message}
                </Text>
              </View>
            )}
          </View>
        </View>

        <View style={styles.enhancedRecommendationWrapper}>
          <View style={styles.enhancedRecommendationCard}>
            <View style={styles.enhancedRecommendationHeader}>
              <View style={styles.iconCircle}>
                <LinearGradient
                  colors={["#e3ff7c", "#a8e063"]}
                  style={styles.iconCircleGradient}
                >
                  <Ionicons name="star" size={24} color="#111" />
                </LinearGradient>
              </View>

              <Text style={styles.enhancedRecommendationTitle}>
                회원님만을 위한{"\n"}맞춤형 식단/루틴을 받아보세요!
              </Text>
            </View>

            <View style={styles.enhancedRecommendationButtons}>
              {/* 식단 */}
              <TouchableOpacity
                style={styles.enhancedRecButtonWrapper}
                onPress={() => navigation.navigate(ROUTES.MEAL_RECOMMEND)}
              >
                <LinearGradient
                  colors={["#e3ff7c", "#b5ff70"]}
                  style={styles.enhancedRecButton}
                >
                  <Ionicons name="restaurant" size={18} color="#111" />
                  <Text style={styles.enhancedRecButtonText}>
                    식단 추천 받기
                  </Text>
                  <Ionicons name="chevron-forward" size={18} color="#111" />
                </LinearGradient>
              </TouchableOpacity>

              {/* 루틴 */}
              <TouchableOpacity
                style={styles.enhancedRecButtonWrapper}
                onPress={() =>
                  navigation.navigate(ROUTES.ROUTINE_RECOMMEND_NEW)
                }
              >
                <LinearGradient
                  colors={["#e3ff7c", "#b5ff70"]}
                  style={styles.enhancedRecButton}
                >
                  <Ionicons name="barbell" size={18} color="#111" />
                  <Text style={styles.enhancedRecButtonText}>
                    운동 추천 받기
                  </Text>
                  <Ionicons name="chevron-forward" size={18} color="#111" />
                </LinearGradient>
              </TouchableOpacity>
            </View>
          </View>
        </View>

        {/* 주간 진행률 섹션 */}
        <TouchableOpacity
          style={styles.exerciseProgressSection}
          onPress={handleCalendarClick}
          activeOpacity={0.7}
        >
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
                    <View
                      key={startThis.toISOString() + i}
                      style={styles.calendarItem}
                    >
                      <View
                        style={[
                          styles.calendarNumber,
                          isSelected && styles.calendarNumberToday,
                        ]}
                      >
                        <Text
                          style={[
                            styles.calendarNumberText,
                            isSelected && styles.calendarNumberTodayText,
                          ]}
                        >
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
                              {`${Math.round(calories)}k`}
                            </Text>
                            <Text style={styles.calendarPercentage}>
                              {`${Math.round(rate)}%`}
                            </Text>
                          </>
                        );
                      })()}
                    </View>
                  );
                });
              })()}
            </View>
          </View>
        </TouchableOpacity>

        {/* 칼로리 섹션 */}
        <View style={styles.calorieSection}>
          <View style={styles.calorieHeader}>
            <View style={styles.calorieLeft}>
              <Text style={styles.calorieCurrent}>
                {homeData?.todayMeal?.totalCalories || 0}
              </Text>
              <Text style={styles.calorieGoal}>
                {" "}
                / {homeData?.todayMeal?.targetCalories || 0}kcal
              </Text>
            </View>
            <Text style={styles.caloriePercentage}>
              {Math.round(homeData?.todayMeal?.calorieAchievementRate || 0)}%
            </Text>
          </View>
          <View style={styles.calorieProgressBar}>
            <View
              style={[
                styles.calorieProgressFill,
                {
                  width: `${Math.min(
                    100,
                    homeData?.todayMeal?.calorieAchievementRate || 0
                  )}%`,
                },
              ]}
            />
          </View>
        </View>

        {/* 운동 루틴 카드 */}
        <View style={styles.routineCard}>
          <Text style={styles.routineTitle}>Day 1 하체</Text>
          <View style={styles.routineStats}>
            <View style={styles.routineStatItem}>
              <Ionicons name="barbell" size={45} color="#ffffff" />
              <Text style={styles.routineStatText}>4가지 운동</Text>
            </View>
            <View style={styles.routineStatItem}>
              <Ionicons name="stopwatch-outline" size={45} color="#ffffff" />
              <Text style={styles.routineStatText}>13세트</Text>
            </View>
            <View style={styles.routineStatItem}>
              <MaterialIcons
                name="local-fire-department"
                size={45}
                color="#ffffff"
              />
              <Text style={styles.routineStatText}>229 kcal</Text>
            </View>
          </View>
          <TouchableOpacity style={styles.routineButton}>
            <Text style={styles.routineButtonText}>오늘 운동 시작하기</Text>
          </TouchableOpacity>
        </View>

        {/* 운동 통계 카드 */}
        <View style={styles.exerciseStatsCard}>
          <View style={styles.exerciseStatsContent}>
            <View style={styles.exerciseStatColumn}>
              <Text style={styles.exerciseStatLabel}>운동 시간</Text>
              <Text style={styles.exerciseStatValue}>
                {formatWorkoutTime(todayWorkoutSeconds)}
              </Text>
            </View>
            <View style={styles.exerciseStatDivider} />
            <View style={styles.exerciseStatColumn}>
              <Text style={styles.exerciseStatLabel}>소모 칼로리</Text>
              <View style={styles.exerciseStatValueRow}>
                <Text style={styles.exerciseStatValue}>2,198</Text>
                <Text style={styles.exerciseStatUnit}>kcal</Text>
              </View>
            </View>
            <View style={styles.exerciseStatDivider} />
            <View style={styles.exerciseStatColumn}>
              <Text style={styles.exerciseStatLabel}>완료 운동</Text>
              <View style={styles.exerciseStatValueRow}>
                <Text style={styles.exerciseStatValue}>7/10</Text>
                <Text style={styles.exerciseStatUnit}>개</Text>
              </View>
            </View>
          </View>
        </View>

        {/* 체중/골격근량/체지방량 카드 */}
        <View style={styles.bodyStatsContainer}>
          <View style={[styles.bodyStatCard]}>
            <Text style={styles.bodyStatLabel}>체중</Text>
            <Text style={styles.bodyStatValue}>52kg</Text>
          </View>

          <View style={[styles.bodyStatCard]}>
            <Text style={styles.bodyStatLabel}>골격근량</Text>
            <Text style={styles.bodyStatValue}>17.3kg</Text>
          </View>

          <View style={[styles.bodyStatCard, { marginRight: 0 }]}>
            <Text style={styles.bodyStatLabel}>체지방량</Text>
            <Text style={styles.bodyStatValue}>21.4%</Text>
          </View>
        </View>

        {/* 식단 추천 섹션 */}
        <View style={styles.dietRecommendationSection}>
          <View style={styles.recommendationContent}>
            <Text style={styles.recommendationTitle}>
              운동 잘 마무리 하셨나요?
            </Text>
            <Text style={styles.recommendationSubtitle}>저녁 식단으로</Text>
            <View style={styles.foodRecommendations}>
              <View style={styles.foodItem}>
                <Text style={styles.foodItemText}>닭가슴살 300g</Text>
              </View>
              <View style={styles.foodItem}>
                <Text style={styles.foodItemText}>단백질 쉐이크</Text>
              </View>
              <View style={styles.foodItem}>
                <Text style={styles.foodItemText}>구운 계란 2개</Text>
              </View>
            </View>
            <Text style={styles.recommendationQuestion}>어떤가요?</Text>
          </View>
        </View>
      </ScrollView>
    </SafeAreaView>
  );
};

const styles = StyleSheet.create({
  container: {
    flex: 1,
    backgroundColor: colors.background,
  },
  header: {
    backgroundColor: colors.background,
    paddingVertical: 12,
    paddingHorizontal: 20,
    borderBottomWidth: 1,
    borderBottomColor: colors.border,
    alignItems: "center",
    justifyContent: "center",
  },
  headerTitle: {
    fontSize: 20,
    fontWeight: "bold",
    color: colors.text,
    textAlign: "center",
  },
  logoText: {
    fontSize: 24,
    fontWeight: "800",
    fontStyle: "italic",
    color: "#e3ff7c",
    textAlign: "center",
    letterSpacing: 0,
  },

  divider: {
    height: 1,
    backgroundColor: colors.border,
  },
  content: {
    flex: 1,
    paddingTop: 10,
    paddingHorizontal: 20,
    paddingBottom: 20,
  },
  exerciseProgressSection: {
    backgroundColor: colors.cardBackground,
    borderRadius: 20,
    paddingVertical: 12,
    paddingHorizontal: 14,
    marginBottom: 20,
  },
  weekCalendar: {
    marginTop: 1,
    marginBottom: 6,
  },
  calendarGrid: {
    flexDirection: "row",
    justifyContent: "space-between",
    gap: 0,
    height: 60,
    marginVertical: 6,
  },
  calendarItem: {
    flex: 1,
    alignItems: "center",
    justifyContent: "center",
    gap: 4,
    minHeight: 60,
  },
  calendarNumber: {
    minHeight: 30,
    minWidth: 30,
    justifyContent: "center",
    alignItems: "center",
  },
  calendarNumberText: {
    fontSize: 16,
    fontWeight: "700",
    color: "#e3ff7c",
    lineHeight: 19,
    textAlign: "center",
  },
  calendarNumberToday: {
    width: 30,
    height: 30,
    borderRadius: 15,
    backgroundColor: "#ffffff",
  },
  calendarNumberTodayText: {
    color: "#000000",
    fontSize: 16,
    fontWeight: "700",
    lineHeight: 19,
  },
  calendarCalories: {
    fontSize: 12,
    fontWeight: "400",
    color: colors.text,
    textAlign: "center",
    height: 15,
    lineHeight: 14.5,
  },
  calendarPercentage: {
    fontSize: 12,
    fontWeight: "400",
    color: colors.text,
    textAlign: "center",
    height: 15,
    lineHeight: 14.5,
  },
  calorieSection: {
    backgroundColor: colors.cardBackground,
    borderRadius: 20,
    padding: 16,
    marginBottom: 20,
  },
  calorieHeader: {
    flexDirection: "row",
    justifyContent: "space-between",
    alignItems: "center",
    marginBottom: 10,
  },
  calorieLeft: {
    flexDirection: "row",
    alignItems: "baseline",
    gap: 4,
  },
  calorieCurrent: {
    fontSize: 20,
    fontWeight: "700",
    color: colors.text,
  },
  calorieGoal: {
    fontSize: 14,
    fontWeight: "400",
    color: colors.text,
  },
  caloriePercentage: {
    fontSize: 16,
    fontWeight: "700",
    color: colors.text,
  },
  calorieProgressBar: {
    height: 16,
    backgroundColor: "#555",
    borderRadius: 8,
    overflow: "hidden",
  },
  calorieProgressFill: {
    height: "100%",
    backgroundColor: "#e3ff7c",
    borderRadius: 8,
  },
  recommendationCard: {
    backgroundColor: "#393a38",
    borderRadius: 20,
    padding: 20,
    marginBottom: 20,
  },
  recommendationCardTitle: {
    fontSize: 16,
    fontWeight: "700",
    color: "#ffffff",
    marginBottom: 20,
    lineHeight: 20,
  },
  recommendationButtons: {
    gap: 10,
  },
  recommendationButton: {
    backgroundColor: "#e3ff7c",
    borderRadius: 10,
    paddingVertical: 10,
    paddingHorizontal: 20,
    alignItems: "center",
    justifyContent: "center",
    height: 40,
  },
  recommendationButtonText: {
    fontSize: 14,
    fontWeight: "700",
    color: "#000000",
  },
  dietRecommendationSection: {
    backgroundColor: colors.cardBackground,
    borderRadius: 20,
    padding: 20,
    marginBottom: 20,
  },
  recommendationContent: {
    maxWidth: 249,
  },
  recommendationTitle: {
    fontSize: 16,
    fontWeight: "700",
    color: "#e3ff7c",
    marginBottom: 5,
  },
  recommendationSubtitle: {
    fontSize: 16,
    fontWeight: "700",
    color: colors.text,
    marginBottom: 10,
  },
  foodRecommendations: {
    flexDirection: "row",
    flexWrap: "wrap",
    gap: 6,
    marginBottom: 8,
  },
  foodItem: {
    backgroundColor: "#e3ff7c",
    paddingHorizontal: 12,
    paddingVertical: 8,
    borderRadius: 10,
  },
  foodItemText: {
    color: "#000000",
    fontSize: 14,
    fontWeight: "700",
  },
  recommendationQuestion: {
    fontSize: 16,
    fontWeight: "700",
    color: colors.text,
  },
  routineCard: {
    backgroundColor: "#393a38",
    borderRadius: 20,
    padding: 20,
    marginBottom: 20,
  },
  routineTitle: {
    fontSize: 16,
    fontWeight: "700",
    color: "#ffffff",
    marginBottom: 20,
    lineHeight: 19,
  },
  routineStats: {
    flexDirection: "row",
    justifyContent: "space-between",
    marginBottom: 20,
    paddingHorizontal: 4,
  },
  routineStatItem: {
    alignItems: "center",
    width: 74,
    gap: 8,
  },
  routineStatText: {
    fontSize: 12,
    fontWeight: "400",
    color: "#ffffff",
    textAlign: "center",
    lineHeight: 14.5,
  },
  routineButton: {
    backgroundColor: "#e3ff7c",
    borderRadius: 10,
    paddingVertical: 10,
    paddingHorizontal: 20,
    alignItems: "center",
    justifyContent: "center",
    height: 40,
  },
  routineButtonText: {
    fontSize: 14,
    fontWeight: "700",
    color: "#000000",
    lineHeight: 16,
  },
  exerciseStatsCard: {
    backgroundColor: "#393a38",
    borderRadius: 20,
    paddingVertical: 12,
    paddingHorizontal: 20,
    marginBottom: 20,
  },
  exerciseStatsContent: {
    flexDirection: "row",
    justifyContent: "space-between",
    alignItems: "center",
    height: 60,
  },
  exerciseStatColumn: {
    flex: 1,
    alignItems: "center",
  },
  exerciseStatLabel: {
    fontSize: 12,
    fontWeight: "400",
    color: "#ffffff",
    marginBottom: 8,
    lineHeight: 14.5,
  },
  exerciseStatValue: {
    fontSize: 16,
    fontWeight: "700",
    color: "#ffffff",
    lineHeight: 19,
  },
  exerciseStatValueRow: {
    flexDirection: "row",
    alignItems: "baseline",
    gap: 4,
  },
  exerciseStatUnit: {
    fontSize: 12,
    fontWeight: "400",
    color: "#ffffff",
    lineHeight: 14.5,
  },
  exerciseStatDivider: {
    width: 1,
    height: 40,
    backgroundColor: "#ffffff",
    marginHorizontal: 10,
  },
  bodyStatsContainer: {
    flexDirection: "row",
    gap: 8,
    marginBottom: 20,
  },
  bodyStatCard: {
    flex: 1,
    backgroundColor: "#393a38",
    borderRadius: 20,
    padding: 15,
    alignItems: "center",
    justifyContent: "center",
    minHeight: 70,
  },
  bodyStatLabel: {
    fontSize: 12,
    fontWeight: "400",
    color: "#ffffff",
    marginBottom: 8,
    lineHeight: 14.5,
  },
  bodyStatValue: {
    fontSize: 20,
    fontWeight: "700",
    color: "#e3ff7c",
    lineHeight: 24,
  },
  additionalMenuSection: {
    marginBottom: 20,
  },
  menuGrid: {
    flexDirection: "row",
    gap: 8,
  },
  menuItem: {
    flex: 1,
    backgroundColor: colors.cardBackground,
    borderRadius: 20,
    padding: 15,
  },
  weightItem: {
    alignItems: "center",
    justifyContent: "center",
  },
  menuTitle: {
    fontSize: 15,
    fontWeight: "700",
    color: colors.text,
    marginBottom: 5,
    lineHeight: 18,
    textAlign: "center",
  },
  menuValue: {
    fontSize: 15,
    fontWeight: "700",
    color: colors.text,
    lineHeight: 18,
    textAlign: "center",
  },
  nutritionItem: {
    justifyContent: "center",
    alignItems: "center",
  },
  nutritionContent: {
    gap: 5,
  },
  nutritionLine: {
    fontSize: 15,
    color: colors.text,
  },
  plusItem: {
    justifyContent: "center",
    alignItems: "center",
  },
  plusButton: {
    width: 36,
    height: 36,
    borderRadius: 18,
    backgroundColor: "#555",
    justifyContent: "center",
    alignItems: "center",
    borderWidth: 1,
    borderColor: "#777",
  },
  plusIcon: {
    fontSize: 18,
    color: colors.text,
    fontWeight: "400",
  },

  greetingSection: {
    marginBottom: 20,
  },
  profileGroup: {
    flexDirection: "row",
    alignItems: "center",
    gap: 15,
  },
  profileImage: {
    width: 50,
    height: 50,
    backgroundColor: "#444",
    borderRadius: 25,
    alignItems: "center",
    justifyContent: "center",
  },
  profilePlaceholder: {
    fontSize: 24,
    lineHeight: 50,
    color: "#999",
  },
  greetingText: {
    fontSize: 16,
    fontWeight: "700",
    color: colors.text,
  },
  messageContainer: {
    marginTop: 12,
    gap: 8,
  },
  messageBubble: {
    backgroundColor: "#555",
    borderRadius: 18,
    paddingVertical: 10,
    paddingHorizontal: 14,
    alignSelf: "flex-start",
  },
  messageText: {
    color: colors.text,
    fontSize: 14,
  },

  enhancedRecommendationWrapper: {
    marginBottom: 24,
  },
  enhancedRecommendationCard: {
    backgroundColor: "#393a38",
    padding: 24,
    borderRadius: 24,
    borderWidth: 1,
    borderColor: "rgba(255,255,255,0.1)",
  },
  enhancedRecommendationHeader: {
    flexDirection: "row",
    gap: 16,
    marginBottom: 20,
  },
  iconCircle: {
    width: 56,
    height: 56,
    borderRadius: 28,
    overflow: "hidden",
  },
  iconCircleGradient: {
    flex: 1,
    alignItems: "center",
    justifyContent: "center",
  },
  enhancedRecommendationTitle: {
    flex: 1,
    fontSize: 18,
    fontWeight: "700",
    color: "#fff",
    lineHeight: 26,
  },
  enhancedRecommendationButtons: {
    gap: 12,
  },
  enhancedRecButtonWrapper: {
    borderRadius: 14,
    overflow: "hidden",
  },
  enhancedRecButton: {
    flexDirection: "row",
    alignItems: "center",
    paddingVertical: 14,
    paddingHorizontal: 18,
  },
  enhancedRecButtonText: {
    flex: 1,
    textAlign: "center",
    fontSize: 16,
    fontWeight: "700",
    color: "#111",
  },
});

export default HomeScreen;
