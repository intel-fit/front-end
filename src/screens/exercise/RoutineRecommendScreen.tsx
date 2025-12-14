import React, { useState } from "react";
import {
  View,
  Text,
  StyleSheet,
  ScrollView,
  TouchableOpacity,
  Alert,
  ActivityIndicator,
  RefreshControl,
} from "react-native";
import { SafeAreaView } from "react-native-safe-area-context";
import { useFocusEffect } from "@react-navigation/native";
import { Ionicons as Icon } from "@expo/vector-icons";
import { recommendedExerciseAPI } from "../../services/recommendedExerciseAPI";
import { authAPI } from "../../services";

// 운동 데이터 타입 정의
type Exercise = {
  exerciseId?: string;
  name: string;
  target?: string;
  sets?: number;
  reps?: number;
  weight?: number;
  date?: string;
};

// 운동 플랜 타입 정의
type ExercisePlan = {
  planId: string;
  planName: string;
  createdAt: string;
  description?: string;
  days: Exercise[][]; // 날짜별 운동 배열 (Day 1, Day 2...)
  isServerPlan: boolean;
};

const RoutineRecommendScreen = ({ navigation }: any) => {
  const [plans, setPlans] = useState<ExercisePlan[]>([]);
  const [selectedPlan, setSelectedPlan] = useState<ExercisePlan | null>(null);
  const [selectedDay, setSelectedDay] = useState(0);
  const [loading, setLoading] = useState(false);
  const [refreshing, setRefreshing] = useState(false);

  const [isEditMode, setIsEditMode] = useState(false);
  const [selectedPlanIds, setSelectedPlanIds] = useState<string[]>([]);

  // 🔄 데이터 로드 함수 (서버 API 연동)
  // 데이터 로드 함수
  // 🔄 데이터 로드 함수 (1일 + 7일 통합)
  const loadExercisePlans = async () => {
    try {
      setLoading(true);

      console.log("🔄 운동 데이터 로드 시작...");

      // 1. 두 API를 동시에 호출 (병렬 처리)
      const [dailyResponse, weeklyResponse] = await Promise.all([
        // (1) 1일 추천 조회 (실패해도 빈 배열 반환하여 7일치는 보이게 함)
        recommendedExerciseAPI.getRecommendedExercises().catch((err) => {
          console.warn("⚠️ 1일 추천 조회 실패:", err);
          return [];
        }),
        // (2) 7일 내역 조회 (실패해도 빈 객체 반환)
        recommendedExerciseAPI.getRecommendedHistory().catch((err) => {
          console.warn("⚠️ 7일 내역 조회 실패:", err);
          return {};
        }),
      ]);

      let combinedPlans: ExercisePlan[] = [];

      // ------------------------------------------------------------
      // 🅰️ [1일 추천 데이터 처리] (기존 로직 복구)
      // ------------------------------------------------------------
      if (Array.isArray(dailyResponse) && dailyResponse.length > 0) {
        console.log(`📥 1일 추천 데이터: ${dailyResponse.length}개`);

        // 타겟별로 그룹화 (예: 가슴, 등...)
        const groupedByTarget = dailyResponse.reduce(
          (acc: any, exercise: any) => {
            const target = exercise.target || "전신";
            if (!acc[target]) acc[target] = [];
            acc[target].push(exercise);
            return acc;
          },
          {}
        );

        // 플랜 객체로 변환
        const dailyPlans = Object.entries(groupedByTarget).map(
          ([target, exs]: [string, any], index) => ({
            planId: `daily_${target}_${Date.now()}_${index}`,
            planName: `오늘의 추천 - ${target}`,
            createdAt: new Date().toISOString(), // 생성일 (오늘)
            description: `${target} 집중 트레이닝 (1일)`,
            days: [exs], // 1일치이므로 배열 안에 배열 하나 [[운동1, 운동2...]]
            isServerPlan: true,
          })
        );

        combinedPlans = [...combinedPlans, ...dailyPlans];
      }

      // ------------------------------------------------------------
      // 🅱️ [7일 내역 데이터 처리] (객체 형태 { "2025-12-14": [...] })
      // ------------------------------------------------------------
      if (
        weeklyResponse &&
        typeof weeklyResponse === "object" &&
        !Array.isArray(weeklyResponse) &&
        Object.keys(weeklyResponse).length > 0
      ) {
        console.log(
          `📥 7일 내역 데이터: 날짜 ${
            Object.keys(weeklyResponse).length
          }개 감지`
        );

        // 1. 날짜 오름차순 정렬
        const sortedDates = Object.keys(weeklyResponse).sort();

        // 2. 날짜별 운동 리스트 추출
        const daysArray = sortedDates.map((date) => {
          const exercises = weeklyResponse[date] || [];
          return exercises.map((ex: any) => ({
            exerciseId: ex.exerciseId,
            name: ex.name,
            target: ex.target,
            sets: ex.sets,
            reps: ex.reps,
            weight: ex.weight || ex.weight_kg,
            date: date,
          }));
        });

        // 3. 통합 플랜 생성 (데이터가 있는 경우만)
        if (daysArray.length > 0) {
          const weeklyPlan: ExercisePlan = {
            planId: `weekly_history_${Date.now()}`,
            planName: "나의 주간 운동 일정",
            createdAt: sortedDates[0] || new Date().toISOString(),
            description: `${sortedDates[0]}부터 시작되는 루틴 (${daysArray.length}일치)`,
            days: daysArray,
            isServerPlan: true,
          };
          combinedPlans.push(weeklyPlan);
        }
      }

      // ------------------------------------------------------------
      // 🏁 최종 합치기 및 정렬
      // ------------------------------------------------------------
      // 최신순 정렬 (생성일 기준 내림차순)
      combinedPlans.sort(
        (a, b) =>
          new Date(b.createdAt).getTime() - new Date(a.createdAt).getTime()
      );

      console.log(`✅ 최종 표시될 플랜: ${combinedPlans.length}개`);
      setPlans(combinedPlans);
    } catch (error: any) {
      console.error("❌ loadExercisePlans 전체 에러:", error);
      Alert.alert("오류", "데이터를 불러오는 중 문제가 발생했습니다.");
    } finally {
      setLoading(false);
      setRefreshing(false);
    }
  };

  const onRefresh = React.useCallback(() => {
    setRefreshing(true);
    loadExercisePlans();
  }, []);

  useFocusEffect(
    React.useCallback(() => {
      loadExercisePlans();
      setIsEditMode(false);
      setSelectedPlanIds([]);
    }, [])
  );

  const handlePlanClick = (plan: ExercisePlan) => {
    if (isEditMode) {
      togglePlanSelection(plan.planId);
      return;
    }
    setSelectedPlan(plan);
    setSelectedDay(0);
  };

  const handleBack = () => {
    setSelectedPlan(null);
    setSelectedDay(0);
  };

  const togglePlanSelection = (planId: string) => {
    setSelectedPlanIds((prev) =>
      prev.includes(planId)
        ? prev.filter((id) => id !== planId)
        : [...prev, planId]
    );
  };

  const toggleSelectAll = () => {
    if (selectedPlanIds.length === plans.length) {
      setSelectedPlanIds([]);
    } else {
      setSelectedPlanIds(plans.map((p) => p.planId));
    }
  };

  const handleNewRecommendPress = async () => {
    try {
      setLoading(true);
      const profile = await authAPI.getProfile();
      if (profile.membershipType === "FREE") {
        navigation.navigate("TempRoutineRecommendScreen");
      } else {
        navigation.navigate("RoutineRecommendNew");
      }
    } catch (error) {
      navigation.navigate("TempRoutineRecommendScreen");
    } finally {
      setLoading(false);
    }
  };

  const handleDelete = async (plan: ExercisePlan) => {
    Alert.alert("알림", "서버 삭제 기능이 아직 연동되지 않았습니다.");
  };

  const handleBulkDelete = async () => {
    Alert.alert("알림", "서버 삭제 기능이 아직 연동되지 않았습니다.");
  };

  const currentDayExercises = selectedPlan?.days?.[selectedDay] || [];

  return (
    <SafeAreaView style={styles.container} edges={["top"]}>
      <View style={styles.header}>
        <TouchableOpacity onPress={() => navigation.goBack()}>
          <Icon name="chevron-back" size={28} color="#ffffff" />
        </TouchableOpacity>
        <Text style={styles.headerTitle}>
          {selectedPlan ? "운동 플랜 상세보기" : "운동 추천 내역"}
        </Text>
        {!selectedPlan && plans.length > 0 && (
          <TouchableOpacity
            onPress={() => {
              if (isEditMode) {
                setIsEditMode(false);
                setSelectedPlanIds([]);
              } else {
                setIsEditMode(true);
              }
            }}
          >
            <Text style={styles.editBtn}>{isEditMode ? "완료" : "편집"}</Text>
          </TouchableOpacity>
        )}
        {!plans.length && <View style={{ width: 28 }} />}
      </View>

      {loading && !refreshing && (
        <View style={styles.loadingOverlay}>
          <ActivityIndicator size="large" color="#e3ff7c" />
          <Text style={styles.loadingText}>불러오는 중...</Text>
        </View>
      )}

      <ScrollView
        style={styles.content}
        showsVerticalScrollIndicator={false}
        refreshControl={
          <RefreshControl
            refreshing={refreshing}
            onRefresh={onRefresh}
            tintColor="#e3ff7c"
          />
        }
      >
        {!selectedPlan ? (
          plans.length === 0 ? (
            <View style={styles.emptyState}>
              <Icon name="fitness-outline" size={80} color="#666666" />
              <Text style={styles.emptyText}>저장된 추천 내역이 없습니다.</Text>
              <TouchableOpacity
                style={styles.goToRecommendBtn}
                onPress={() => navigation.navigate("RoutineRecommendNew")}
              >
                <Text style={styles.goToRecommendBtnText}>
                  추천받으러 가기 →
                </Text>
              </TouchableOpacity>
            </View>
          ) : (
            <View style={styles.list}>
              {isEditMode && (
                <View style={styles.editToolbar}>
                  <TouchableOpacity
                    style={styles.selectAllBtn}
                    onPress={toggleSelectAll}
                  >
                    <Icon
                      name={
                        selectedPlanIds.length === plans.length
                          ? "checkbox"
                          : "square-outline"
                      }
                      size={24}
                      color="#e3ff7c"
                    />
                    <Text style={styles.selectAllText}>전체 선택</Text>
                  </TouchableOpacity>
                  <TouchableOpacity
                    style={[
                      styles.bulkDeleteBtn,
                      selectedPlanIds.length === 0 &&
                        styles.bulkDeleteBtnDisabled,
                    ]}
                    onPress={handleBulkDelete}
                    disabled={selectedPlanIds.length === 0}
                  >
                    <Icon name="trash" size={20} color="#ffffff" />
                    <Text style={styles.bulkDeleteText}>삭제</Text>
                  </TouchableOpacity>
                </View>
              )}

              {!isEditMode && (
                <TouchableOpacity
                  style={styles.newRecommendBtn}
                  onPress={handleNewRecommendPress}
                >
                  <Text style={styles.newRecommendBtnText}>
                    + 새 운동 추천받기
                  </Text>
                </TouchableOpacity>
              )}

              {plans.map((plan) => (
                <TouchableOpacity
                  key={plan.planId}
                  style={[
                    styles.card,
                    isEditMode &&
                      selectedPlanIds.includes(plan.planId) &&
                      styles.cardSelected,
                  ]}
                  onPress={() => handlePlanClick(plan)}
                  activeOpacity={0.98}
                >
                  {isEditMode && (
                    <View style={styles.checkbox}>
                      <Icon
                        name={
                          selectedPlanIds.includes(plan.planId)
                            ? "checkbox"
                            : "square-outline"
                        }
                        size={28}
                        color="#e3ff7c"
                      />
                    </View>
                  )}
                  <View style={styles.cardHeader}>
                    <View style={styles.dateContainer}>
                      <Text style={styles.dateIcon}>
                        {plan.days.length > 1 ? "🗓️" : "💪"}
                      </Text>
                      <View>
                        <Text style={styles.planName}>{plan.planName}</Text>
                        <Text style={styles.date}>
                          {new Date(plan.createdAt).toLocaleDateString("ko-KR")}
                        </Text>
                      </View>
                    </View>
                    {!isEditMode && (
                      <TouchableOpacity
                        onPress={(e) => {
                          e.stopPropagation();
                          handleDelete(plan);
                        }}
                        style={styles.deleteBtn}
                      >
                        <Icon name="trash-outline" size={20} color="#ef4444" />
                      </TouchableOpacity>
                    )}
                  </View>
                  <View style={styles.cardBody}>
                    <Text style={styles.description} numberOfLines={2}>
                      {plan.description}
                    </Text>
                    <View style={styles.summary}>
                      <View
                        style={[
                          styles.badge,
                          plan.days.length > 1
                            ? styles.exerciseCountBadge
                            : styles.badge,
                        ]}
                      >
                        <Text
                          style={[
                            styles.badgeText,
                            plan.days.length > 1 &&
                              styles.exerciseCountBadgeText,
                          ]}
                        >
                          {plan.days.length > 1
                            ? `📅 ${plan.days.length}일 루틴`
                            : "1일 루틴"}
                        </Text>
                      </View>
                    </View>
                  </View>
                </TouchableOpacity>
              ))}
            </View>
          )
        ) : (
          <View style={styles.detail}>
            <TouchableOpacity style={styles.backBtn} onPress={handleBack}>
              <Text style={styles.backBtnText}>← 목록으로</Text>
            </TouchableOpacity>
            <View style={styles.detailInfo}>
              <Text style={styles.detailPlanName}>{selectedPlan.planName}</Text>
              <Text style={styles.detailDescription}>
                {selectedPlan.description}
              </Text>
            </View>

            {/* 7일 루틴일 경우에만 상단 탭 표시 */}
            {selectedPlan.days.length > 1 && (
              <ScrollView
                horizontal
                showsHorizontalScrollIndicator={false}
                style={styles.dayTabsContainer}
                contentContainerStyle={styles.dayTabs}
              >
                {selectedPlan.days.map((_, index) => (
                  <TouchableOpacity
                    key={index}
                    style={[
                      styles.dayTab,
                      selectedDay === index && styles.dayTabActive,
                    ]}
                    onPress={() => setSelectedDay(index)}
                  >
                    <Text
                      style={[
                        styles.dayTabText,
                        selectedDay === index && styles.dayTabTextActive,
                      ]}
                    >
                      {index + 1}일차
                    </Text>
                  </TouchableOpacity>
                ))}
              </ScrollView>
            )}

            <View style={styles.exerciseList}>
              {currentDayExercises.length === 0 ? (
                <View style={styles.emptyExercise}>
                  <Text style={styles.emptyExerciseText}>운동이 없습니다</Text>
                </View>
              ) : (
                currentDayExercises.map((exercise, index) => (
                  <View key={index} style={styles.exerciseItem}>
                    <View style={styles.exerciseIcon}>
                      <Text style={styles.exerciseIconText}>💪</Text>
                    </View>
                    <View style={styles.exerciseInfo}>
                      <Text style={styles.exerciseName}>{exercise.name}</Text>
                      <Text style={styles.exerciseDetail}>
                        {exercise.sets ? `${exercise.sets}세트 ` : ""}
                        {exercise.reps ? `${exercise.reps}회 ` : ""}
                        {exercise.weight ? `${exercise.weight}kg` : ""}
                      </Text>
                    </View>
                  </View>
                ))
              )}
            </View>
          </View>
        )}
      </ScrollView>
    </SafeAreaView>
  );
};

const styles = StyleSheet.create({
  container: { flex: 1, backgroundColor: "#1a1a1a" },
  header: {
    flexDirection: "row",
    justifyContent: "space-between",
    alignItems: "center",
    paddingVertical: 16,
    paddingHorizontal: 20,
    borderBottomWidth: 1,
    borderBottomColor: "#333333",
  },
  headerTitle: {
    fontSize: 20,
    fontWeight: "700",
    color: "#ffffff",
    flex: 1,
    textAlign: "center",
  },
  editBtn: { fontSize: 16, fontWeight: "600", color: "#e3ff7c" },
  loadingOverlay: {
    position: "absolute",
    top: 0,
    left: 0,
    right: 0,
    bottom: 0,
    backgroundColor: "rgba(0,0,0,0.7)",
    justifyContent: "center",
    alignItems: "center",
    zIndex: 999,
  },
  loadingText: {
    color: "#ffffff",
    fontSize: 16,
    marginTop: 12,
    fontWeight: "600",
  },
  content: { flex: 1, padding: 20 },
  emptyState: {
    alignItems: "center",
    paddingVertical: 60,
    paddingHorizontal: 20,
  },
  emptyText: {
    fontSize: 16,
    color: "#999999",
    textAlign: "center",
    marginTop: 20,
    marginBottom: 10,
  },
  goToRecommendBtn: {
    backgroundColor: "#e3ff7c",
    paddingVertical: 12,
    paddingHorizontal: 24,
    borderRadius: 12,
    marginTop: 16,
  },
  goToRecommendBtnText: { fontSize: 15, fontWeight: "600", color: "#111111" },
  list: { gap: 16 },
  editToolbar: {
    flexDirection: "row",
    justifyContent: "space-between",
    alignItems: "center",
    backgroundColor: "#222222",
    padding: 16,
    borderRadius: 12,
    marginBottom: 12,
  },
  selectAllBtn: { flexDirection: "row", alignItems: "center", gap: 8 },
  selectAllText: { fontSize: 14, fontWeight: "600", color: "#ffffff" },
  bulkDeleteBtn: {
    flexDirection: "row",
    alignItems: "center",
    gap: 6,
    backgroundColor: "#ef4444",
    paddingVertical: 8,
    paddingHorizontal: 16,
    borderRadius: 8,
  },
  bulkDeleteBtnDisabled: { backgroundColor: "#666666", opacity: 0.5 },
  bulkDeleteText: { fontSize: 14, fontWeight: "600", color: "#ffffff" },
  newRecommendBtn: {
    backgroundColor: "#e3ff7c",
    paddingVertical: 10,
    paddingHorizontal: 16,
    borderRadius: 8,
    alignSelf: "flex-start",
    marginBottom: 8,
  },
  newRecommendBtnText: { fontSize: 14, fontWeight: "600", color: "#111111" },
  card: {
    backgroundColor: "#222222",
    borderRadius: 12,
    padding: 16,
    borderWidth: 2,
    borderColor: "transparent",
  },
  cardSelected: { borderColor: "#e3ff7c", backgroundColor: "#2a2a1a" },
  checkbox: { position: "absolute", top: 12, left: 12, zIndex: 10 },
  cardHeader: {
    flexDirection: "row",
    justifyContent: "space-between",
    alignItems: "center",
    marginBottom: 12,
  },
  dateContainer: {
    flexDirection: "row",
    alignItems: "center",
    gap: 12,
    flex: 1,
  },
  dateIcon: { fontSize: 24 },
  planName: {
    fontSize: 16,
    fontWeight: "700",
    color: "#ffffff",
    marginBottom: 2,
  },
  date: { fontSize: 13, fontWeight: "500", color: "#999999" },
  deleteBtn: { padding: 4 },
  cardBody: { marginBottom: 12, gap: 8 },
  description: { fontSize: 14, color: "#cccccc", lineHeight: 20 },
  summary: { flexDirection: "row", flexWrap: "wrap", gap: 8 },
  badge: {
    paddingVertical: 4,
    paddingHorizontal: 10,
    borderRadius: 12,
    backgroundColor: "#4a90e2",
  },
  badgeText: { fontSize: 12, fontWeight: "500", color: "#ffffff" },
  exerciseCountBadge: { backgroundColor: "#e3ff7c" },
  exerciseCountBadgeText: { fontSize: 12, fontWeight: "500", color: "#111111" },
  serverBadge: { backgroundColor: "#8b5cf6" },
  serverBadgeText: { fontSize: 12, fontWeight: "500", color: "#ffffff" },
  detail: { gap: 20 },
  backBtn: {
    backgroundColor: "#2a2a2a",
    paddingVertical: 10,
    paddingHorizontal: 16,
    borderRadius: 8,
    alignSelf: "flex-start",
  },
  backBtnText: { fontSize: 14, fontWeight: "500", color: "#ffffff" },
  detailInfo: { backgroundColor: "#222222", padding: 16, borderRadius: 12 },
  detailPlanName: {
    fontSize: 20,
    fontWeight: "700",
    color: "#ffffff",
    marginBottom: 4,
  },
  detailDescription: {
    fontSize: 14,
    color: "#cccccc",
    lineHeight: 20,
    marginTop: 8,
  },
  dayTabsContainer: { marginVertical: 8 },
  dayTabs: { gap: 8, paddingBottom: 8 },
  dayTab: {
    paddingVertical: 8,
    paddingHorizontal: 16,
    backgroundColor: "#222222",
    borderRadius: 20,
  },
  dayTabActive: { backgroundColor: "#e3ff7c" },
  dayTabText: { fontSize: 13, fontWeight: "500", color: "#999999" },
  dayTabTextActive: { color: "#111111", fontWeight: "600" },
  exerciseList: { gap: 12 },
  emptyExercise: {
    backgroundColor: "#222222",
    padding: 40,
    borderRadius: 12,
    alignItems: "center",
  },
  emptyExerciseText: { fontSize: 14, color: "#999999" },
  exerciseItem: {
    backgroundColor: "#2a2a2a",
    borderRadius: 12,
    padding: 16,
    flexDirection: "row",
    alignItems: "center",
    gap: 15,
  },
  exerciseIcon: {
    width: 50,
    height: 50,
    borderRadius: 10,
    backgroundColor: "#333333",
    justifyContent: "center",
    alignItems: "center",
  },
  exerciseIconText: { fontSize: 32 },
  exerciseInfo: { flex: 1, gap: 6 },
  exerciseName: { fontSize: 16, fontWeight: "600", color: "#ffffff" },
  exerciseDetail: { fontSize: 14, color: "#aaaaaa" },
});

export default RoutineRecommendScreen;
