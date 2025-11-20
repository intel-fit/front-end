// [HomeScreen - main 스타일 유지 + 기능 최소 차이 추가 버전]

import React, { useState, useEffect, useRef } from "react";
import {
  View,
  Text,
  StyleSheet,
  ScrollView,
  TouchableOpacity,
} from "react-native";
import { SafeAreaView } from "react-native-safe-area-context";
import { LinearGradient } from "expo-linear-gradient";
import { Ionicons as Icon, MaterialIcons } from "@expo/vector-icons";
import { colors } from "../../theme/colors";
import { ROUTES } from "../../constants/routes";
import { useDate } from "../../contexts/DateContext";
import { homeAPI } from "../../services";
import type { DailyProgressWeekItem, HomeResponse } from "../../types";

const HomeScreen = ({ navigation }: any) => {
  const { selectedDate } = useDate();
  const [weeklyProgress, setWeeklyProgress] = useState<DailyProgressWeekItem[]>(
    []
  );
  const [homeData, setHomeData] = useState<HomeResponse | null>(null);
  const isLoadingRef = useRef(false);

  const formatDate = (d: Date) =>
    `${d.getFullYear()}-${String(d.getMonth() + 1).padStart(2, "0")}-${String(
      d.getDate()
    ).padStart(2, "0")}`;

  /** ─────────────────────── 데이터 로드 ─────────────────────── **/
  const loadWeekly = async () => {
    try {
      const data = await homeAPI.getWeeklyProgress();
      setWeeklyProgress(Array.isArray(data) ? data : []);
    } catch {
      setWeeklyProgress([]);
    }
  };

  const loadHome = async () => {
    try {
      const today = new Date();
      const data = await homeAPI.getHomeData(formatDate(today));
      setHomeData(data);
    } catch {
      setHomeData(null);
    }
  };

  useEffect(() => {
    const unsub = navigation.addListener("focus", () => {
      if (isLoadingRef.current) return;
      isLoadingRef.current = true;

      Promise.all([loadWeekly(), loadHome()]).finally(() => {
        isLoadingRef.current = false;
      });
    });
    return unsub;
  }, [navigation]);

  const getProgressOf = (d: Date) =>
    weeklyProgress.find((i) => i.date === formatDate(d));

  /** ─────────────────────── UI START ─────────────────────── **/

  return (
    <SafeAreaView style={styles.container}>
      {/* HEADER */}
      <View style={styles.header}>
        <Text style={styles.headerTitle}>홈</Text>
      </View>
      <View style={styles.divider} />

      <ScrollView style={styles.content}>
        {/* ▷ 프로필 + 인사말 */}
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

        {/* ▷ 추천 카드 — main 유지 */}
        <View style={styles.recommendationCardWrapper}>
          <LinearGradient
            colors={["#2a2a2a", "#1f1f1f"]}
            style={styles.recommendationCard}
          >
            <View style={styles.recommendationHeader}>
              <View style={styles.iconCircle}>
                <LinearGradient
                  colors={["#e3ff7c", "#a8e063"]}
                  style={styles.iconCircleGradient}
                >
                  <Icon name="star" size={24} color="#111" />
                </LinearGradient>
              </View>

              <Text style={styles.recommendationTitle}>
                회원님만을 위한{"\n"}맞춤형 식단/루틴을 받아보세요!
              </Text>
            </View>

            <View style={styles.recommendationButtons}>
              {/* 식단 */}
              <TouchableOpacity
                style={styles.recButtonWrapper}
                onPress={() => navigation.navigate(ROUTES.MEAL_RECOMMEND)}
              >
                <LinearGradient
                  colors={["#e3ff7c", "#b5ff70"]}
                  style={styles.recButton}
                >
                  <Icon name="restaurant" size={18} color="#111" />
                  <Text style={styles.recButtonText}>식단 추천 받기</Text>
                  <Icon name="chevron-forward" size={18} color="#111" />
                </LinearGradient>
              </TouchableOpacity>

              {/* 루틴 */}
              <TouchableOpacity
                style={styles.recButtonWrapper}
                onPress={() =>
                  navigation.navigate(ROUTES.ROUTINE_RECOMMEND_NEW)
                }
              >
                <LinearGradient
                  colors={["#e3ff7c", "#b5ff70"]}
                  style={styles.recButton}
                >
                  <Icon name="barbell" size={18} color="#111" />
                  <Text style={styles.recButtonText}>운동 추천 받기</Text>
                  <Icon name="chevron-forward" size={18} color="#111" />
                </LinearGradient>
              </TouchableOpacity>
            </View>
          </LinearGradient>
        </View>

        {/* ▷ 주간 진행률 (main 유지) */}
        <TouchableOpacity
          style={styles.progressSection}
          onPress={() => navigation.navigate("Calendar")}
        >
          <View style={styles.weekCalendar}>
            <View style={styles.calendarGrid}>
              {(() => {
                const today = new Date();
                const start = new Date(selectedDate || today);
                start.setDate(start.getDate() - start.getDay());

                return Array.from({ length: 7 }).map((_, idx) => {
                  const d = new Date(start);
                  d.setDate(start.getDate() + idx);

                  const isSelected =
                    selectedDate &&
                    d.toDateString() === selectedDate.toDateString();

                  const p = getProgressOf(d);
                  const calories = p?.totalCalorie ?? 0;
                  const rate = p?.exerciseRate ?? 0;

                  return (
                    <View key={d.toISOString()} style={styles.calendarItem}>
                      <View
                        style={[
                          styles.calendarNumber,
                          isSelected && styles.calendarSelected,
                        ]}
                      >
                        <Text
                          style={[
                            styles.calendarNumberText,
                            isSelected && styles.calendarSelectedText,
                          ]}
                        >
                          {d.getDate()}
                        </Text>
                      </View>
                      <Text style={styles.calendarCalories}>
                        {Math.round(calories)}k
                      </Text>
                      <Text style={styles.calendarRate}>
                        {Math.round(rate)}%
                      </Text>
                    </View>
                  );
                });
              })()}
            </View>
          </View>
        </TouchableOpacity>

        {/* ▷ 칼로리 섹션 (main 유지) */}
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

            <Text style={styles.caloriePercent}>
              {Math.round(homeData?.todayMeal?.calorieAchievementRate || 0)}%
            </Text>
          </View>

          <View style={styles.calorieBar}>
            <View
              style={[
                styles.calorieFill,
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

        {/* ───────────────────────────────────────────
            🔥 main 기준으로 깔끔하게 추가한 3개 기능 카드
            (루틴 / 운동통계 / 체성분)
            ─────────────────────────────────────────── */}

        {/* ▷ DAY 루틴 카드 */}
        <View style={styles.card}>
          <Text style={styles.cardTitle}>오늘의 운동 루틴</Text>

          <View style={styles.routineStats}>
            <View style={styles.routineItem}>
              <Icon name="barbell" size={40} color="#fff" />
              <Text style={styles.routineText}>4가지 운동</Text>
            </View>

            <View style={styles.routineItem}>
              <Icon name="stopwatch-outline" size={40} color="#fff" />
              <Text style={styles.routineText}>13세트</Text>
            </View>

            <View style={styles.routineItem}>
              <MaterialIcons
                name="local-fire-department"
                size={40}
                color="#fff"
              />
              <Text style={styles.routineText}>229 kcal</Text>
            </View>
          </View>

          <TouchableOpacity style={styles.routineButton}>
            <Text style={styles.routineButtonText}>오늘 운동 시작하기</Text>
          </TouchableOpacity>
        </View>

        {/* ▷ 운동 통계 */}
        <View style={styles.card}>
          <Text style={styles.cardTitle}>오늘의 운동 통계</Text>

          <View style={styles.exerciseStatsRow}>
            <View style={styles.exerciseColumn}>
              <Text style={styles.exerciseLabel}>시간</Text>
              <Text style={styles.exerciseValue}>00:28:48</Text>
            </View>

            <View style={styles.verticalLine} />

            <View style={styles.exerciseColumn}>
              <Text style={styles.exerciseLabel}>소모 칼로리</Text>
              <Text style={styles.exerciseValue}>2,198 kcal</Text>
            </View>

            <View style={styles.verticalLine} />

            <View style={styles.exerciseColumn}>
              <Text style={styles.exerciseLabel}>완료 운동</Text>
              <Text style={styles.exerciseValue}>7/10개</Text>
            </View>
          </View>
        </View>

        {/* ▷ 체성분 카드 (단순 정리) */}
        <View style={styles.bodyRow}>
          <View style={styles.bodyCard}>
            <Text style={styles.bodyLabel}>체중</Text>
            <Text style={styles.bodyValue}>52kg</Text>
          </View>
          <View style={styles.bodyCard}>
            <Text style={styles.bodyLabel}>골격근량</Text>
            <Text style={styles.bodyValue}>17.3kg</Text>
          </View>
          <View style={styles.bodyCard}>
            <Text style={styles.bodyLabel}>체지방률</Text>
            <Text style={styles.bodyValue}>21.4%</Text>
          </View>
        </View>
      </ScrollView>
    </SafeAreaView>
  );
};

export default HomeScreen;

/* ───────────────────────────────────────────
   STYLE — main 기준으로 정리
─────────────────────────────────────────── */
const styles = StyleSheet.create({
  container: { flex: 1, backgroundColor: colors.background },

  header: {
    paddingVertical: 16,
    borderBottomWidth: 1,
    borderBottomColor: colors.border,
    alignItems: "center",
  },
  headerTitle: { fontSize: 20, fontWeight: "700", color: colors.text },
  divider: { height: 1, backgroundColor: colors.border },

  content: { paddingHorizontal: 20, paddingBottom: 20, paddingTop: 10 },

  /* greeting */
  greetingSection: { marginBottom: 20 },
  profileGroup: { flexDirection: "row", alignItems: "center", gap: 15 },
  profileImage: {
    width: 50,
    height: 50,
    backgroundColor: "#444",
    borderRadius: 25,
    alignItems: "center",
    justifyContent: "center",
  },
  profilePlaceholder: { fontSize: 24, lineHeight: 50, color: "#999" },
  greetingText: { fontSize: 16, fontWeight: "700", color: colors.text },
  messageContainer: { marginTop: 12, gap: 8 },
  messageBubble: {
    backgroundColor: "#555",
    borderRadius: 18,
    paddingVertical: 10,
    paddingHorizontal: 14,
    alignSelf: "flex-start",
  },
  messageText: { color: colors.text, fontSize: 14 },

  /* recommendation */
  recommendationCardWrapper: { marginBottom: 24 },
  recommendationCard: {
    padding: 24,
    borderRadius: 24,
    borderWidth: 1,
    borderColor: "rgba(255,255,255,0.1)",
  },
  recommendationHeader: { flexDirection: "row", gap: 16, marginBottom: 20 },
  iconCircle: { width: 56, height: 56, borderRadius: 28, overflow: "hidden" },
  iconCircleGradient: {
    flex: 1,
    alignItems: "center",
    justifyContent: "center",
  },
  recommendationTitle: {
    flex: 1,
    fontSize: 18,
    fontWeight: "700",
    color: "#fff",
    lineHeight: 26,
  },
  recommendationButtons: { gap: 12 },
  recButtonWrapper: { borderRadius: 14, overflow: "hidden" },
  recButton: {
    flexDirection: "row",
    alignItems: "center",
    paddingVertical: 14,
    paddingHorizontal: 18,
  },
  recButtonText: {
    flex: 1,
    textAlign: "center",
    fontSize: 16,
    fontWeight: "700",
    color: "#111",
  },

  /* weekly calendar */
  progressSection: {
    backgroundColor: colors.cardBackground,
    borderRadius: 20,
    padding: 14,
    marginBottom: 20,
  },
  weekCalendar: {},
  calendarGrid: { flexDirection: "row", height: 80 },
  calendarItem: { flex: 1, alignItems: "center", gap: 6 },
  calendarNumber: {
    minHeight: 30,
    minWidth: 30,
    alignItems: "center",
    justifyContent: "center",
  },
  calendarNumberText: { color: "#e3ff7c", fontSize: 16, fontWeight: "700" },
  calendarSelected: { backgroundColor: "#fff", borderRadius: 15 },
  calendarSelectedText: { color: "#000" },
  calendarCalories: { fontSize: 12, color: colors.text },
  calendarRate: { fontSize: 12, color: colors.text },

  /* calories */
  calorieSection: {
    backgroundColor: colors.cardBackground,
    borderRadius: 20,
    padding: 20,
    marginBottom: 20,
  },
  calorieHeader: {
    flexDirection: "row",
    justifyContent: "space-between",
    marginBottom: 12,
  },
  calorieLeft: { flexDirection: "row", gap: 4, alignItems: "baseline" },
  calorieCurrent: { color: colors.text, fontSize: 20, fontWeight: "700" },
  calorieGoal: { color: colors.text, fontSize: 12 },
  caloriePercent: { color: colors.text, fontSize: 16, fontWeight: "700" },
  calorieBar: {
    height: 22,
    backgroundColor: "#444",
    borderRadius: 12,
    overflow: "hidden",
  },
  calorieFill: { height: "100%", backgroundColor: "#e3ff7c" },

  /* common card (추가 기능 카드 공통 스타일) */
  card: {
    backgroundColor: "#393a38",
    borderRadius: 20,
    padding: 20,
    marginBottom: 20,
  },
  cardTitle: {
    color: "#fff",
    fontSize: 16,
    fontWeight: "700",
    marginBottom: 16,
  },

  /* routine card */
  routineStats: {
    flexDirection: "row",
    justifyContent: "space-between",
    marginBottom: 16,
  },
  routineItem: { width: 74, alignItems: "center", gap: 6 },
  routineText: { color: "#fff", fontSize: 12 },
  routineButton: {
    backgroundColor: "#e3ff7c",
    paddingVertical: 12,
    borderRadius: 10,
    alignItems: "center",
  },
  routineButtonText: {
    fontSize: 14,
    fontWeight: "700",
    color: "#111",
  },

  /* exercise stats */
  exerciseStatsRow: {
    flexDirection: "row",
    justifyContent: "space-between",
    alignItems: "center",
  },
  exerciseColumn: { flex: 1, alignItems: "center" },
  exerciseLabel: { color: "#fff", fontSize: 12, marginBottom: 4 },
  exerciseValue: { color: "#fff", fontSize: 16, fontWeight: "700" },
  verticalLine: { width: 1, height: 40, backgroundColor: "#fff" },

  /* body stats */
  bodyRow: { flexDirection: "row", gap: 8, marginBottom: 20 },
  bodyCard: {
    flex: 1,
    backgroundColor: "#393a38",
    borderRadius: 20,
    alignItems: "center",
    padding: 16,
  },
  bodyLabel: { color: "#fff", fontSize: 12, marginBottom: 4 },
  bodyValue: { color: "#e3ff7c", fontSize: 18, fontWeight: "700" },
});
