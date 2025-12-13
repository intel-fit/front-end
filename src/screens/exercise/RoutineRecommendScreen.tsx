import React, { useState } from "react";
import {
  View,
  Text,
  StyleSheet,
  ScrollView,
  TouchableOpacity,
  Alert,
  ActivityIndicator,
} from "react-native";
import { SafeAreaView } from "react-native-safe-area-context";
import { useFocusEffect } from "@react-navigation/native";
import { Ionicons as Icon } from "@expo/vector-icons";
import { recommendedExerciseAPI } from "../../services/recommendedExerciseAPI";
import { authAPI } from "../../services";
type Exercise = {
  exerciseId?: string;
  name: string;
  target?: string;
  sets?: number;
  reps?: number;
  weight?: number;
};

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
  const [isEditMode, setIsEditMode] = useState(false);
  const [selectedPlanIds, setSelectedPlanIds] = useState<string[]>([]);

  const loadExercisePlans = async () => {
    try {
      setLoading(true);

      // ✅ 추천받은 운동 조회
      const exercises = await recommendedExerciseAPI.getRecommendedExercises();

      console.log("📥 추천받은 운동:", exercises);

      if (!Array.isArray(exercises) || exercises.length === 0) {
        setPlans([]);
        return;
      }

      // ✅ 임시: 타겟별로 그룹화
      const groupedByTarget = exercises.reduce((acc: any, exercise: any) => {
        const target = exercise.target || "전신";
        if (!acc[target]) {
          acc[target] = [];
        }
        acc[target].push(exercise);
        return acc;
      }, {});

      // ✅ 각 타겟별로 플랜 생성
      const formattedPlans: ExercisePlan[] = Object.entries(
        groupedByTarget
      ).map(([target, exs]: [string, any], index) => ({
        planId: `plan_${target}_${Date.now()}_${index}`,
        planName: `AI 추천 운동 - ${target}`,
        createdAt: new Date().toISOString(),
        description: `${target} 집중 운동`,
        days: [exs], // 1일치
        isServerPlan: true,
      }));

      console.log("✅ 변환된 플랜:", formattedPlans.length);
      setPlans(formattedPlans);
    } catch (error: any) {
      console.error("Failed to load exercise plans", error);
      Alert.alert(
        "오류",
        error.message || "운동 추천 내역을 불러오는데 실패했습니다."
      );
      setPlans([]);
    } finally {
      setLoading(false);
    }
  };

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

  const handleDelete = async (plan: ExercisePlan) => {
    Alert.alert(
      "삭제",
      `"${plan.planName}" 운동 플랜을 삭제하시겠습니까?\n(${plan.days.length}일치)`,
      [
        { text: "취소", style: "cancel" },
        {
          text: "삭제",
          style: "destructive",
          onPress: async () => {
            try {
              setLoading(true);

              // TODO: 백엔드 삭제 API 추가되면 여기서 호출
              // await recommendedExerciseAPI.deleteExercisePlan(plan.planId);

              setPlans((prev) => prev.filter((p) => p.planId !== plan.planId));

              if (selectedPlan?.planId === plan.planId) {
                setSelectedPlan(null);
              }

              Alert.alert("성공", "운동 플랜이 삭제되었습니다.");
            } catch (error: any) {
              console.error("삭제 실패:", error);
              Alert.alert("오류", error.message || "삭제에 실패했습니다.");
            } finally {
              setLoading(false);
            }
          },
        },
      ]
    );
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

      // 사용자 프로필 조회
      const profile = await authAPI.getProfile();

      console.log("✅ 멤버십 타입:", profile.membershipType);

      // 멤버십 타입에 따라 다른 화면으로 이동
      if (profile.membershipType === "FREE") {
        console.log("➡️ 무료 회원 - TempRoutineRecommendScreen으로 이동");
        navigation.navigate("TempRoutineRecommendScreen");
      } else {
        console.log("➡️ 프리미엄 회원 - RoutineRecommendNew로 이동");
        navigation.navigate("RoutineRecommendNew");
      }
    } catch (error: any) {
      console.error("❌ 프로필 조회 실패:", error);
      Alert.alert("오류", "사용자 정보를 불러오는데 실패했습니다.", [
        {
          text: "확인",
          onPress: () => {
            // 실패 시 기본적으로 무료 버전으로 이동
            navigation.navigate("TempRoutineRecommendScreen");
          },
        },
      ]);
    } finally {
      setLoading(false);
    }
  };
  const handleBulkDelete = async () => {
    if (selectedPlanIds.length === 0) {
      Alert.alert("알림", "삭제할 운동 플랜을 선택해주세요.");
      return;
    }

    Alert.alert(
      "일괄 삭제",
      `선택한 ${selectedPlanIds.length}개의 운동 플랜을 삭제하시겠습니까?`,
      [
        { text: "취소", style: "cancel" },
        {
          text: "삭제",
          style: "destructive",
          onPress: async () => {
            try {
              setLoading(true);

              // TODO: 백엔드 일괄 삭제 API 추가되면 여기서 호출

              setPlans((prev) =>
                prev.filter((p) => !selectedPlanIds.includes(p.planId))
              );

              setSelectedPlanIds([]);
              setIsEditMode(false);

              Alert.alert(
                "성공",
                `${selectedPlanIds.length}개의 운동 플랜이 삭제되었습니다.`
              );
            } catch (error: any) {
              console.error("일괄 삭제 실패:", error);
              Alert.alert("오류", error.message || "삭제에 실패했습니다.");
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
          >
            <Text style={styles.editBtn}>{isEditMode ? "완료" : "편집"}</Text>
          </TouchableOpacity>
        )}
        {!plans.length && <View style={{ width: 28 }} />}
      </View>

      {loading && (
        <View style={styles.loadingOverlay}>
          <ActivityIndicator size="large" color="#e3ff7c" />
          <Text style={styles.loadingText}>불러오는 중...</Text>
        </View>
      )}

      <ScrollView style={styles.content} showsVerticalScrollIndicator={false}>
        {!selectedPlan ? (
          plans.length === 0 ? (
            <View style={styles.emptyState}>
              <Icon name="fitness-outline" size={80} color="#666666" />
              <Text style={styles.emptyText}>추천받은 운동이 없습니다.</Text>
              <Text style={styles.emptySubtitle}>운동 추천을 받아보세요!</Text>
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
                    <Text style={styles.selectAllText}>
                      전체 선택 ({selectedPlanIds.length}/{plans.length})
                    </Text>
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
                  disabled={loading}
                >
                  {loading ? (
                    <ActivityIndicator size="small" color="#111827" />
                  ) : (
                    <Text style={styles.newRecommendBtnText}>
                      새 운동 추천받기
                    </Text>
                  )}
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
                        {plan.isServerPlan ? "☁️" : "📱"}
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
                    {plan.description && (
                      <Text style={styles.description} numberOfLines={2}>
                        {plan.description}
                      </Text>
                    )}

                    <View style={styles.summary}>
                      <View style={styles.badge}>
                        <Text style={styles.badgeText}>
                          📅 {plan.days.length}일 운동
                        </Text>
                      </View>
                      <View style={[styles.badge, styles.exerciseCountBadge]}>
                        <Text style={styles.exerciseCountBadgeText}>
                          💪{" "}
                          {plan.days.reduce((sum, day) => sum + day.length, 0)}
                          개 운동
                        </Text>
                      </View>
                      {plan.isServerPlan && (
                        <View style={[styles.badge, styles.serverBadge]}>
                          <Text style={styles.serverBadgeText}>☁️ 서버</Text>
                        </View>
                      )}
                    </View>
                  </View>

                  {!isEditMode && (
                    <View style={styles.cardFooter}>
                      <Text style={styles.viewDetail}>자세히 보기 →</Text>
                    </View>
                  )}
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
              <View style={styles.detailHeader}>
                <View>
                  <Text style={styles.detailPlanName}>
                    {selectedPlan.planName}
                  </Text>
                  <Text style={styles.detailDate}>
                    {new Date(selectedPlan.createdAt).toLocaleDateString(
                      "ko-KR"
                    )}
                  </Text>
                </View>
                {selectedPlan.isServerPlan && (
                  <View style={[styles.badge, styles.serverBadge]}>
                    <Text style={styles.serverBadgeText}>☁️ 서버</Text>
                  </View>
                )}
              </View>

              {selectedPlan.description && (
                <Text style={styles.detailDescription}>
                  {selectedPlan.description}
                </Text>
              )}
            </View>

            {/* ✅ days 길이만큼만 탭 표시 (1일~7일 동적) */}
            {selectedPlan.days && selectedPlan.days.length > 0 && (
              <>
                <ScrollView
                  horizontal
                  showsHorizontalScrollIndicator={false}
                  style={styles.dayTabsContainer}
                  contentContainerStyle={styles.dayTabs}
                >
                  {selectedPlan.days.map((_: any, index: number) => (
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

                <View style={styles.exerciseList}>
                  {currentDayExercises.length === 0 ? (
                    <View style={styles.emptyExercise}>
                      <Text style={styles.emptyExerciseText}>
                        {selectedDay + 1}일차에 운동이 없습니다
                      </Text>
                    </View>
                  ) : (
                    currentDayExercises.map(
                      (exercise: Exercise, index: number) => (
                        <View key={index} style={styles.exerciseItem}>
                          <View style={styles.exerciseIcon}>
                            <Text style={styles.exerciseIconText}>💪</Text>
                          </View>
                          <View style={styles.exerciseInfo}>
                            <Text style={styles.exerciseName}>
                              {exercise.name}
                            </Text>
                            {exercise.target && (
                              <View style={styles.targetBadgeContainer}>
                                <View style={styles.targetBadgeSmall}>
                                  <Text style={styles.targetBadgeSmallText}>
                                    {exercise.target}
                                  </Text>
                                </View>
                              </View>
                            )}
                            {(exercise.sets ||
                              exercise.reps ||
                              exercise.weight) && (
                              <Text style={styles.exerciseDetail}>
                                {exercise.sets && `${exercise.sets}세트`}
                                {exercise.reps && ` × ${exercise.reps}회`}
                                {exercise.weight && ` × ${exercise.weight}kg`}
                              </Text>
                            )}
                          </View>
                        </View>
                      )
                    )
                  )}
                </View>
              </>
            )}
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
  emptySubtitle: {
    fontSize: 14,
    color: "#666666",
    textAlign: "center",
    marginBottom: 24,
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
  exerciseCountBadge: { backgroundColor: "#e3ff7c" },
  serverBadge: { backgroundColor: "#8b5cf6" },
  badgeText: { fontSize: 12, fontWeight: "500", color: "#ffffff" },
  exerciseCountBadgeText: { fontSize: 12, fontWeight: "500", color: "#111111" },
  serverBadgeText: { fontSize: 12, fontWeight: "500", color: "#ffffff" },
  cardFooter: { alignItems: "flex-end" },
  viewDetail: { fontSize: 14, color: "#e3ff7c", fontWeight: "500" },
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
  detailHeader: {
    flexDirection: "row",
    justifyContent: "space-between",
    alignItems: "flex-start",
    marginBottom: 8,
  },
  detailPlanName: {
    fontSize: 20,
    fontWeight: "700",
    color: "#ffffff",
    marginBottom: 4,
  },
  detailDate: { fontSize: 14, fontWeight: "500", color: "#999999" },
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
  exerciseName: {
    fontSize: 16,
    fontWeight: "600",
    color: "#ffffff",
  },
  targetBadgeContainer: {
    flexDirection: "row",
    flexWrap: "wrap",
    gap: 6,
  },
  targetBadgeSmall: {
    paddingVertical: 4,
    paddingHorizontal: 10,
    borderRadius: 12,
    backgroundColor: "#4a90e2",
  },
  targetBadgeSmallText: {
    fontSize: 12,
    fontWeight: "500",
    color: "#ffffff",
  },
  exerciseDetail: {
    fontSize: 14,
    color: "#aaaaaa",
  },
});

export default RoutineRecommendScreen;
