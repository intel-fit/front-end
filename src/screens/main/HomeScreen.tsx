import React, { useState, useEffect, useRef } from "react";
import {
  View,
  Text,
  StyleSheet,
  ScrollView,
  TouchableOpacity,
} from "react-native";
import { SafeAreaView } from "react-native-safe-area-context";
import { colors } from "../../theme/colors";
import { ROUTES } from "../../constants/routes";
import { useDate } from "../../contexts/DateContext";
import { homeAPI } from "../../services";
import type { DailyProgressWeekItem, HomeResponse } from "../../types";
import { LinearGradient } from "expo-linear-gradient";
import { Ionicons as Icon } from "@expo/vector-icons";

const HomeScreen = ({ navigation }: any) => {
  const { selectedDate, setSelectedDate } = useDate();
  const [weeklyProgress, setWeeklyProgress] = useState<DailyProgressWeekItem[]>(
    []
  );
  const [homeData, setHomeData] = useState<HomeResponse | null>(null);
  const isLoadingRef = useRef(false); // 중복 호출 방지

  // 날짜 형식 변환 함수 (Date -> yyyy-MM-dd)
  const formatDateToString = (date: Date): string => {
    const year = date.getFullYear();
    const month = String(date.getMonth() + 1).padStart(2, "0");
    const day = String(date.getDate()).padStart(2, "0");
    return `${year}-${month}-${day}`;
  };

  // 주간 진행률 데이터 로드
  // GET /api/daily-progress/week 호출하여 이번 주(일~토) 데이터 가져오기
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
  // weeklyProgress 배열에서 해당 날짜의 데이터를 찾아 반환
  const getDayProgress = (date: Date): DailyProgressWeekItem | undefined => {
    const dateStr = formatDateToString(date);
    const progress = weeklyProgress.find((item) => item.date === dateStr);

    if (!progress) {
      // 데이터가 없어도 정상 (해당 날짜에 기록이 없을 수 있음)
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

  // 화면 포커스 시 데이터 로드
  // React Navigation에서는 화면이 처음 마운트될 때도 'focus' 이벤트가 발생하므로
  // useEffect 없이 focus 리스너만 사용하면 중복 호출을 방지할 수 있습니다
  useEffect(() => {
    const unsubscribe = navigation.addListener("focus", () => {
      // 중복 호출 방지
      if (isLoadingRef.current) {
        console.log("⏸️ 이미 데이터 로딩 중이므로 스킵");
        return;
      }

      isLoadingRef.current = true;
      Promise.all([loadWeeklyProgress(), loadHomeData()]).finally(() => {
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
        <Text style={styles.headerTitle}>홈</Text>
      </View>
      <View style={styles.divider} />
      <ScrollView style={styles.content}>
        {/* 인사말 섹션 */}
        <View style={styles.greetingSection}>
          <View style={styles.profileGroup}>
            <View style={styles.profileImage}>
              <Text style={styles.profilePlaceholder}>👤</Text>
            </View>
            <Text style={styles.greetingText}>
              {homeData?.userSummary?.name || ""}님 어서오세요😊
            </Text>
          </View>
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

        {/* 맞춤형 추천 섹션  */}
        <View style={styles.recommendationCardWrapper}>
          <LinearGradient
            colors={["#2a2a2a", "#1f1f1f"]}
            style={styles.recommendationCard}
          >
            {/* 타이틀 섹션 */}
            <View style={styles.recommendationHeader}>
              <View style={styles.iconCircle}>
                <LinearGradient
                  colors={["#e3ff7c", "#a8e063"]}
                  style={styles.iconCircleGradient}
                >
                  <Icon name="star" size={24} color="#111827" />
                </LinearGradient>
              </View>
              <Text style={styles.recommendationCardTitle}>
                회원님만을 위한{"\n"}맞춤형 식단/루틴을 받아보세요!
              </Text>
            </View>

            {/* 버튼 섹션 */}
            <View style={styles.recommendationButtons}>
              <TouchableOpacity
                style={styles.recommendationButtonWrapper}
                onPress={() => navigation.navigate(ROUTES.MEAL_RECOMMEND)}
                activeOpacity={0.9}
              >
                <LinearGradient
                  colors={["#e3ff7c", "#a8e063"]}
                  start={{ x: 0, y: 0 }}
                  end={{ x: 1, y: 1 }}
                  style={styles.recommendationButton}
                >
                  <Icon
                    name="restaurant"
                    size={20}
                    color="#111827"
                    style={{ marginRight: 8 }}
                  />
                  <Text style={styles.recommendationButtonText}>
                    식단 추천 받기
                  </Text>
                  <Icon name="chevron-forward" size={18} color="#111827" />
                </LinearGradient>
              </TouchableOpacity>

              <TouchableOpacity
                style={styles.recommendationButtonWrapper}
                onPress={() =>
                  navigation.navigate(ROUTES.ROUTINE_RECOMMEND_NEW)
                }
                activeOpacity={0.9}
              >
                <LinearGradient
                  colors={["#e3ff7c", "#a8e063"]}
                  start={{ x: 0, y: 0 }}
                  end={{ x: 1, y: 1 }}
                  style={styles.recommendationButton}
                >
                  <Icon
                    name="barbell"
                    size={20}
                    color="#111827"
                    style={{ marginRight: 8 }}
                  />
                  <Text style={styles.recommendationButtonText}>
                    운동 추천 받기
                  </Text>
                  <Icon name="chevron-forward" size={18} color="#111827" />
                </LinearGradient>
              </TouchableOpacity>
            </View>
          </LinearGradient>
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
                // 주간 시작 날짜 계산
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
                // selectedDate가 있으면 해당 날짜 기준, 없으면 오늘 기준
                const dateToShow = selectedDate || today;
                const startThis = getStartOfWeek(dateToShow);

                // 7일로된 배열 생성
                return Array.from({ length: 7 }).map((_, i) => {
                  const d = new Date(
                    startThis.getFullYear(),
                    startThis.getMonth(),
                    startThis.getDate() + i
                  );

                  // 오늘 날짜 체크
                  const isToday = d.toDateString() === today.toDateString();
                  const isSelected =
                    selectedDate &&
                    d.toDateString() === selectedDate.toDateString();

                  // 렌더링
                  return (
                    <View
                      key={startThis.toISOString() + i}
                      style={styles.calendarItem}
                    >
                      {/* 날짜 렌더링 */}
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

                      {/* 칼로리 및 운동 달성률 렌더링 */}
                      {(() => {
                        // API에서 받은 데이터에서 해당 날짜의 진행률 찾기
                        const dayProgress = getDayProgress(d);
                        const calories = dayProgress?.totalCalorie ?? 0;
                        const rate = dayProgress?.exerciseRate ?? 0;
                        const dateStr = formatDateToString(d);

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
    paddingVertical: 16,
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
    borderRadius: 25,
    backgroundColor: "#333",
    justifyContent: "center",
    alignItems: "center",
    overflow: "hidden",
  },
  profilePlaceholder: {
    width: "100%",
    height: "100%",
    fontSize: 24,
    backgroundColor: "#555",
    textAlign: "center",
    lineHeight: 50,
  },
  greetingText: {
    fontSize: 16,
    fontWeight: "700",
    color: colors.text,
  },
  messageContainer: {
    marginTop: 12,
    paddingHorizontal: 4,
    gap: 8,
  },
  messageBubble: {
    backgroundColor: "#555",
    borderRadius: 20,
    paddingVertical: 10,
    paddingHorizontal: 16,
    alignSelf: "flex-start",
    maxWidth: "90%",
  },
  messageText: {
    fontSize: 14,
    fontWeight: "400",
    color: colors.text,
    lineHeight: 20,
  },
  recommendationCardWrapper: {
    marginBottom: 24,
    borderRadius: 24,
    shadowColor: "#E3FF7C",
    shadowOffset: {
      width: 0,
      height: 8,
    },
    shadowOpacity: 0.3,
    shadowRadius: 16,
    elevation: 12,
  },
  recommendationCard: {
    borderRadius: 24,
    padding: 24,
    borderWidth: 2,
    borderColor: "rgba(227, 255, 124, 0.3)",
    position: "relative",
    overflow: "hidden",
  },
  sparkleContainer: {
    position: "absolute",
    top: 16,
    right: 16,
    flexDirection: "row",
    gap: 8,
  },
  sparkle: {
    fontSize: 20,
    opacity: 0.8,
  },
  recommendationHeader: {
    flexDirection: "row",
    alignItems: "flex-start",
    gap: 16,
    marginBottom: 24,
  },
  iconCircle: {
    width: 56,
    height: 56,
    borderRadius: 28,
    overflow: "hidden",
    shadowColor: "#e3ff7c",
    shadowOffset: {
      width: 0,
      height: 4,
    },
    shadowOpacity: 0.4,
    shadowRadius: 12,
    elevation: 8,
  },
  iconCircleGradient: {
    width: "100%",
    height: "100%",
    alignItems: "center",
    justifyContent: "center",
  },
  recommendationCardTitle: {
    flex: 1,
    fontSize: 20,
    fontWeight: "700",
    color: "#ffffff",
    lineHeight: 28,
    letterSpacing: 0.5,
  },
  recommendationButtons: {
    gap: 12,
  },
  recommendationButtonWrapper: {
    borderRadius: 14,
    overflow: "hidden",
    shadowColor: "#e3ff7c",
    shadowOffset: {
      width: 0,
      height: 4,
    },
    shadowOpacity: 0.3,
    shadowRadius: 8,
    elevation: 6,
  },
  recommendationButton: {
    flexDirection: "row",
    alignItems: "center",
    justifyContent: "center",
    paddingVertical: 16,
    paddingHorizontal: 20,
    borderRadius: 14,
  },
  recommendationButtonText: {
    flex: 1,
    fontSize: 16,
    fontWeight: "700",
    color: "#111827",
    letterSpacing: 0.5,
  },
  decorativeBottom: {
    flexDirection: "row",
    justifyContent: "center",
    gap: 6,
    marginTop: 20,
  },
  decorativeDot: {
    width: 6,
    height: 6,
    borderRadius: 3,
    backgroundColor: "rgba(227, 255, 124, 0.3)",
  },
  exerciseProgressSection: {
    backgroundColor: colors.cardBackground,
    borderRadius: 20,
    paddingVertical: 15,
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
    height: 79,
    marginVertical: 6,
  },
  calendarItem: {
    flex: 1,
    alignItems: "center",
    justifyContent: "flex-start",
    gap: 6,
    minHeight: 79,
  },
  calendarNumber: {
    minHeight: 30,
    minWidth: 30,
    justifyContent: "center",
    alignItems: "center",
    marginBottom: 4,
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
    borderRadius: 20,
    padding: 20,
    marginBottom: 20,
  },
  calorieHeader: {
    flexDirection: "row",
    justifyContent: "space-between",
    alignItems: "center",
    marginBottom: 15,
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
    fontSize: 12,
    fontWeight: "400",
    color: colors.text,
  },
  caloriePercentage: {
    fontSize: 16,
    fontWeight: "700",
    color: colors.text,
  },
  calorieProgressBar: {
    height: 30,
    backgroundColor: "#555",
    borderRadius: 10,
    overflow: "hidden",
  },
  calorieProgressFill: {
    height: "100%",
    backgroundColor: "#e3ff7c",
    borderRadius: 10,
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
    fontSize: 20,
    fontWeight: "700",
    color: "#e3ff7c",
    marginBottom: 5,
  },
  recommendationSubtitle: {
    fontSize: 20,
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
    fontSize: 15,
    fontWeight: "700",
  },
  recommendationQuestion: {
    fontSize: 20,
    fontWeight: "700",
    color: colors.text,
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
});

export default HomeScreen;
