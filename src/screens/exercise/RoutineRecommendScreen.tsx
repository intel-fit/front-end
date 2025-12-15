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
  days: Exercise[][];
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

  // 🔄 데이터 로드 함수
  const loadExercisePlans = async () => {
    try {
      setLoading(true);

      console.log("🔄 운동 데이터 로드 시작...");

      const [dailyResponse, weeklyResponse] = await Promise.all([
        recommendedExerciseAPI.getRecommendedExercises().catch((err) => {
          console.warn("⚠️ 1일 추천 조회 실패:", err);
          return [];
        }),
        recommendedExerciseAPI.getRecommendedHistory().catch((err) => {
          console.warn("⚠️ 7일 내역 조회 실패:", err);
          return {};
        }),
      ]);

      let combinedPlans: ExercisePlan[] = [];

      // 🅰️ [1일 추천 데이터 처리]
      if (Array.isArray(dailyResponse) && dailyResponse.length > 0) {
        console.log(`📥 1일 추천 데이터: ${dailyResponse.length}개`);

        const groupedByTarget = dailyResponse.reduce(
          (acc: any, exercise: any) => {
            const target = exercise.target || "전신";
            if (!acc[target]) acc[target] = [];
            acc[target].push(exercise);
            return acc;
          },
          {}
        );

        const dailyPlans = Object.entries(groupedByTarget).map(
          ([target, exs]: [string, any], index) => ({
            planId: `daily_${target}_${Date.now()}_${index}`,
            planName: `오늘의 추천 - ${target}`,
            createdAt: new Date().toISOString(),
            description: `${target} 집중 트레이닝 (1일)`,
            days: [exs],
            isServerPlan: true,
          })
        );

        combinedPlans = [...combinedPlans, ...dailyPlans];
      }

      // 🅱️ [7일 내역 데이터 처리]
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

        const sortedDates = Object.keys(weeklyResponse).sort();

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

      // 🏁 최종 합치기 및 정렬
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

  // ✅ 수정된 멤버십 타입 확인 로직
  const handleNewRecommendPress = async () => {
    try {
      setLoading(true);
      console.log("🔍 멤버십 타입 확인 중...");

      const profile = await authAPI.getProfile();
      console.log("📦 getProfile 응답:", JSON.stringify(profile, null, 2));

      // profile이 직접 프로필 객체임 (profile.membershipType으로 바로 접근)
      const membershipType = profile?.membershipType;
      console.log("🎯 멤버십 타입:", membershipType);

      // 멤버십 타입에 따른 네비게이션
      if (!membershipType) {
        console.warn("⚠️ 멤버십 타입이 없습니다. 기본값: 무료");
        navigation.navigate("TempRoutineRecommendScreen");
      } else if (membershipType.toUpperCase() === "FREE") {
        console.log("➡️  무료 페이지로 이동");
        navigation.navigate("TempRoutineRecommendScreen");
      } else if (membershipType.toUpperCase() === "PREMIUM") {
        console.log("➡️  유료 페이지로 이동");
        navigation.navigate("RoutineRecommendNew");
      } else {
        // 예상치 못한 값인 경우
        console.warn(`⚠️ 알 수 없는 멤버십 타입: ${membershipType}`);
        navigation.navigate("TempRoutineRecommendScreen");
      }
    } catch (error: any) {
      console.error("❌ 멤버십 확인 중 오류:", error);
      console.error("오류 상세:", error.message);

      // 에러 발생 시 무료 버전으로 이동
      Alert.alert(
        "알림",
        "멤버십 정보를 확인할 수 없습니다.\n무료 버전으로 이동합니다.",
        [
          {
            text: "확인",
            onPress: () => navigation.navigate("TempRoutineRecommendScreen"),
          },
        ]
      );
    } finally {
      setLoading(false);
    }
  };

  const handleDelete = async (plan: ExercisePlan) => {
    Alert.alert("삭제 확인", `"${plan.planName}"을(를) 삭제하시겠습니까?`, [
      {
        text: "취소",
        style: "cancel",
      },
      {
        text: "삭제",
        style: "destructive",
        onPress: async () => {
          try {
            setLoading(true);

            if (plan.planId.startsWith("weekly_history")) {
              const dates = plan.days
                .map((dayExercises) => dayExercises[0]?.date)
                .filter(Boolean);

              if (dates.length === 0) {
                Alert.alert("오류", "삭제할 날짜 정보가 없습니다.");
                return;
              }

              console.log(`🗑️ 총 ${dates.length}일 삭제 시작...`);

              let successCount = 0;
              let failCount = 0;

              for (const date of dates) {
                try {
                  console.log(`📅 ${date} 삭제 중...`);
                  const result =
                    await recommendedExerciseAPI.deleteRecommendedExerciseByDate(
                      date
                    );

                  if (result && result.deletedCount > 0) {
                    successCount++;
                    console.log(
                      `✅ ${date} 삭제 성공 (${result.deletedCount}개)`
                    );
                  } else {
                    failCount++;
                    console.log(`⚠️ ${date} 삭제할 데이터 없음`);
                  }
                } catch (err) {
                  failCount++;
                  console.error(`❌ ${date} 삭제 실패:`, err);
                }
              }

              if (successCount > 0) {
                Alert.alert(
                  "삭제 완료",
                  `${successCount}일치 운동이 삭제되었습니다.${
                    failCount > 0 ? `\n(${failCount}일치는 삭제 실패)` : ""
                  }`
                );
              } else {
                Alert.alert(
                  "알림",
                  "삭제할 데이터가 없거나 삭제에 실패했습니다."
                );
              }
            } else if (plan.planId.startsWith("daily_")) {
              const today = new Date().toISOString().split("T")[0];
              console.log(`📅 ${today} 삭제 중...`);

              const result =
                await recommendedExerciseAPI.deleteRecommendedExerciseByDate(
                  today
                );

              if (result && result.deletedCount > 0) {
                Alert.alert("성공", "오늘의 추천이 삭제되었습니다.");
              } else {
                Alert.alert("알림", "삭제할 데이터가 없습니다.");
              }
            } else {
              Alert.alert("알림", "이 플랜은 삭제할 수 없습니다.");
              return;
            }

            await loadExercisePlans();
          } catch (error: any) {
            console.error("❌ 삭제 중 오류:", error);
            Alert.alert(
              "오류",
              error.message || "삭제 중 문제가 발생했습니다."
            );
          } finally {
            setLoading(false);
          }
        },
      },
    ]);
  };

  const handleBulkDelete = async () => {
    if (selectedPlanIds.length === 0) return;

    Alert.alert(
      "일괄 삭제",
      `선택한 ${selectedPlanIds.length}개의 플랜을 삭제하시겠습니까?`,
      [
        {
          text: "취소",
          style: "cancel",
        },
        {
          text: "삭제",
          style: "destructive",
          onPress: async () => {
            try {
              setLoading(true);

              const selectedPlans = plans.filter((p) =>
                selectedPlanIds.includes(p.planId)
              );

              let totalSuccess = 0;
              let totalFail = 0;

              for (const plan of selectedPlans) {
                if (plan.planId.startsWith("weekly_history")) {
                  const dates = plan.days
                    .map((dayExercises) => dayExercises[0]?.date)
                    .filter(Boolean);

                  for (const date of dates) {
                    try {
                      const result =
                        await recommendedExerciseAPI.deleteRecommendedExerciseByDate(
                          date
                        );
                      if (result && result.deletedCount > 0) {
                        totalSuccess++;
                      } else {
                        totalFail++;
                      }
                    } catch (err) {
                      totalFail++;
                    }
                  }
                } else if (plan.planId.startsWith("daily_")) {
                  const today = new Date().toISOString().split("T")[0];
                  try {
                    const result =
                      await recommendedExerciseAPI.deleteRecommendedExerciseByDate(
                        today
                      );
                    if (result && result.deletedCount > 0) {
                      totalSuccess++;
                    } else {
                      totalFail++;
                    }
                  } catch (err) {
                    totalFail++;
                  }
                }
              }

              if (totalSuccess > 0) {
                Alert.alert(
                  "삭제 완료",
                  `${totalSuccess}일치 운동이 삭제되었습니다.${
                    totalFail > 0 ? `\n(${totalFail}일치는 삭제 실패)` : ""
                  }`
                );
              } else {
                Alert.alert("알림", "삭제할 데이터가 없습니다.");
              }

              setSelectedPlanIds([]);
              setIsEditMode(false);
              await loadExercisePlans();
            } catch (error: any) {
              console.error("❌ 일괄 삭제 중 오류:", error);
              Alert.alert(
                "오류",
                error.message || "삭제 중 문제가 발생했습니다."
              );
            } finally {
              setLoading(false);
            }
          },
        },
      ]
    );
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
          ></TouchableOpacity>
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
                onPress={handleNewRecommendPress}
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

            {selectedPlan.days.length > 1 && (
              <ScrollView
                horizontal
                showsHorizontalScrollIndicator={false}
                style={styles.dayTabsContainer}
                contentContainerStyle={styles.dayTabs}
              >
                {selectedPlan.days.map((dayExercises, index) => {
                  const dateStr = dayExercises[0]?.date;
                  let displayText = `${index + 1}일차`;

                  if (dateStr) {
                    const date = new Date(dateStr);
                    const month = date.getMonth() + 1;
                    const day = date.getDate();
                    const weekdays = ["일", "월", "화", "수", "목", "금", "토"];
                    const weekday = weekdays[date.getDay()];
                    displayText = `${month}/${day} (${weekday})`;
                  }

                  return (
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
                        {displayText}
                      </Text>
                    </TouchableOpacity>
                  );
                })}
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
                      <View style={styles.exerciseNameRow}>
                        <Text style={styles.exerciseName}>{exercise.name}</Text>
                        {exercise.target && (
                          <View style={styles.targetBadge}>
                            <Text style={styles.targetBadgeText}>
                              {exercise.target}
                            </Text>
                          </View>
                        )}
                      </View>
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
  exerciseInfo: {
    flex: 1,
    gap: 6,
  },
  exerciseNameRow: {
    flexDirection: "row",
    alignItems: "center",
    gap: 6,
    flexWrap: "wrap",
  },
  exerciseName: {
    fontSize: 16,
    fontWeight: "600",
    color: "#ffffff",
  },
  targetBadge: {
    backgroundColor: "#4a90e2",
    paddingVertical: 3,
    paddingHorizontal: 8,
    borderRadius: 8,
  },
  targetBadgeText: {
    fontSize: 11,
    fontWeight: "600",
    color: "#ffffff",
  },
  setsBadge: {
    backgroundColor: "#e3ff7c",
    paddingVertical: 3,
    paddingHorizontal: 8,
    borderRadius: 8,
  },
  setsBadgeText: {
    fontSize: 11,
    fontWeight: "600",
    color: "#111111",
  },
  exerciseDetail: {
    fontSize: 14,
    color: "#aaaaaa",
  },
});

export default RoutineRecommendScreen;
