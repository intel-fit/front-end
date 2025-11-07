import React, { useState } from "react";
import {
  View,
  Text,
  StyleSheet,
  SafeAreaView,
  ScrollView,
  TouchableOpacity,
  Alert,
} from "react-native";
import { Ionicons as Icon } from "@expo/vector-icons";
import { colors } from "../../theme/colors";
import { useFocusEffect } from "@react-navigation/native";
import AsyncStorage from "@react-native-async-storage/async-storage";
import ExerciseModal from "../../components/modals/ExerciseModal";
import InBodyCalendarModal from "../../components/common/InBodyCalendarModal";
import {
  deleteWorkoutSession,
  postWorkoutSession,
  fetchWeeklyProgress,
  fetchMonthlyProgress,
} from "../../utils/exerciseApi";
import { useDate } from "../../contexts/DateContext";
import type { DailyProgressWeekItem } from "../../types";

interface WorkoutGoals {
  frequency: number;
  duration: string;
  type: string;
  calories: number;
}

interface Activity {
  id: number;
  name: string;
  details: string;
  time: string;
  date: string; // YYYY-MM-DD 형식
  isCompleted: boolean;
  sessionId?: string; // 서버 저장된 세션과 연동용
  sets?: any[]; // 세트 내역 보존
}

const ExerciseScreen = ({ navigation }: any) => {
  const [monthBase, setMonthBase] = useState(new Date());
  const [calendarVisible, setCalendarVisible] = useState(false);
  const [allActivities, setAllActivities] = useState<Activity[]>([]); // 모든 날짜의 운동 기록
  const { selectedDate, setSelectedDate } = useDate(); // 선택된 날짜 (전역 상태)

  // 선택된 날짜의 운동 기록만 필터링
  const activities = React.useMemo(() => {
    if (!selectedDate) return [];
    const selectedDateStr = `${selectedDate.getFullYear()}-${String(
      selectedDate.getMonth() + 1
    ).padStart(2, "0")}-${String(selectedDate.getDate()).padStart(2, "0")}`;
    return allActivities.filter(
      (activity) => activity.date === selectedDateStr
    );
  }, [allActivities, selectedDate]);
  const [goalData, setGoalData] = useState<WorkoutGoals>({
    frequency: 3,
    duration: "30분 이상",
    type: "유산소",
    calories: 1500,
  });
  const [completedThisWeek, setCompletedThisWeek] = useState(0);
  const [weeklyCalories, setWeeklyCalories] = useState(0);
  const [weeklyProgress, setWeeklyProgress] = useState<DailyProgressWeekItem[]>([]);
  const [monthlyProgress, setMonthlyProgress] = useState<DailyProgressWeekItem[]>([]);
  const [showMonthView, setShowMonthView] = useState(false);
  const [isModalOpen, setIsModalOpen] = useState(false);
  const [modalMode, setModalMode] = useState<"add" | "edit">("add");
  const [selectedExercise, setSelectedExercise] = useState<Activity | null>(
    null
  );

  React.useEffect(() => {
    loadGoalData();
  }, []);

  const loadGoalData = async () => {
    try {
      const saved = await AsyncStorage.getItem("workoutGoals");
      if (saved) {
        setGoalData(JSON.parse(saved));
      }
      const completed = await AsyncStorage.getItem("workoutCompletedThisWeek");
      if (completed) {
        setCompletedThisWeek(parseInt(completed, 10));
      }
    } catch (error) {
      console.log("Failed to load goal data", error);
    }
  };
  // 주간 칼로리 합계 로드 (이번 주)
  const loadWeeklyCalories = async () => {
    try {
      const data = await fetchWeeklyProgress();
      setWeeklyProgress(Array.isArray(data) ? data : []);
      const sum = Array.isArray(data)
        ? data.reduce(
            (s: number, d) => s + Number(d?.totalCalorie || 0),
            0
          )
        : 0;
      setWeeklyCalories(sum);
    } catch (e) {
      console.error('주간 칼로리 로드 실패:', e);
      setWeeklyCalories(0);
      setWeeklyProgress([]);
    }
  };

  // 날짜를 yyyy-MM-dd 형식으로 변환
  const formatDateToString = (date: Date): string => {
    const year = date.getFullYear();
    const month = String(date.getMonth() + 1).padStart(2, '0');
    const day = String(date.getDate()).padStart(2, '0');
    return `${year}-${month}-${day}`;
  };

  // 특정 날짜의 진행률 데이터 가져오기
  const getDayProgress = (date: Date): DailyProgressWeekItem | undefined => {
    const dateStr = formatDateToString(date);
    // 먼저 월별 데이터에서 찾고, 없으면 주간 데이터에서 찾기
    return monthlyProgress.find(item => item.date === dateStr) 
      || weeklyProgress.find(item => item.date === dateStr);
  };

  // 월별 데이터 로드
  const loadMonthlyProgress = async (year: number, month: number) => {
    try {
      const yearMonth = `${year}-${String(month + 1).padStart(2, '0')}`;
      const data = await fetchMonthlyProgress(yearMonth);
      setMonthlyProgress(Array.isArray(data) ? data : []);
    } catch (e) {
      console.error('월별 진행률 로드 실패:', e);
      setMonthlyProgress([]);
    }
  };

  // monthBase가 변경될 때 월별 데이터 로드
  React.useEffect(() => {
    loadMonthlyProgress(monthBase.getFullYear(), monthBase.getMonth());
  }, [monthBase]);

  // 화면 포커스 시 목표/진행 재로딩 (다른 화면에서 저장 후 복귀 시 반영)
  useFocusEffect(
    React.useCallback(() => {
      loadGoalData();
      loadWeeklyCalories();
    }, [])
  );

  // 완료 횟수 저장 helper
  const setCompletedCountPersist = async (count: number) => {
    try {
      setCompletedThisWeek(count);
      await AsyncStorage.setItem("workoutCompletedThisWeek", String(count));
    } catch {}
  };

  // 서버 목록 섹션 제거됨

  const getProgressPercentage = () => {
    // 횟수 기준 진행률
    const countTarget = Math.max(1, goalData.frequency || 1);
    const countRate = Math.min(1, Math.max(0, completedThisWeek / countTarget));
    // 칼로리 기준 진행률
    const calorieTarget = Math.max(1, Number(goalData.calories) || 1);
    const calorieRate = Math.min(
      1,
      Math.max(0, weeklyCalories / calorieTarget)
    );
    // 두 기준의 평균으로 주간 진행률 산출
    const avgRate = (countRate + calorieRate) / 2;
    return Math.round(avgRate * 100);
  };

  const handleAddWorkout = () => {
    setModalMode("add");
    setSelectedExercise(null);
    setIsModalOpen(true);
  };

  // 운동 기록 영속화: 페이지 전환해도 유지되도록 저장/복원
  const ACTIVITIES_KEY = "user_activities_v1";

  React.useEffect(() => {
    (async () => {
      try {
        const saved = await AsyncStorage.getItem(ACTIVITIES_KEY);
        if (saved) {
          const parsed: Activity[] = JSON.parse(saved);
          if (Array.isArray(parsed)) setAllActivities(parsed);
        }
      } catch {}
    })();
  }, []);

  React.useEffect(() => {
    (async () => {
      try {
        await AsyncStorage.setItem(
          ACTIVITIES_KEY,
          JSON.stringify(allActivities)
        );
      } catch {}
    })();
  }, [allActivities]);

  // (임시 API 테스트 버튼 제거)

  const handleExerciseClick = (exercise: Activity) => {
    setModalMode("edit");
    setSelectedExercise(exercise);
    setIsModalOpen(true);
  };

  const handleModalClose = () => {
    setIsModalOpen(false);
    setSelectedExercise(null);
  };

  const handleExerciseSave = async (
    sets: any[],
    exerciseName: string,
    meta?: { externalId?: string; category?: string }
  ) => {
    const allSetsCompleted = sets.every((set: any) => set.completed);
    const details = `${sets[0]?.weight || 20}kg ${sets[0]?.reps || 12}회 ${
      sets.length
    }세트`;

    // userId 가져오기
    const userIdStr = await AsyncStorage.getItem("userId");
    const userId = userIdStr ? parseInt(userIdStr, 10) : 1; // 기본값 1

    // 선택된 날짜로 workoutDate 생성 (시간은 현재 시간 사용)
    const activeDate = selectedDate || new Date();
    const now = new Date();
    const workoutDate = `${activeDate.getFullYear()}-${String(
      activeDate.getMonth() + 1
    ).padStart(2, "0")}-${String(activeDate.getDate()).padStart(
      2,
      "0"
    )}T${String(now.getHours()).padStart(2, "0")}:${String(
      now.getMinutes()
    ).padStart(2, "0")}:${String(now.getSeconds()).padStart(2, "0")}`;
    const sessionPayload = {
      sessionId: `S-${Date.now()}`,
      exerciseName,
      category: meta?.category || "기타",
      workoutDate,
      userId, // AsyncStorage에서 가져온 실제 userId 사용
      exerciseId: meta?.externalId,
      sets: sets.map((s: any, idx: number) => ({
        setNumber: idx + 1,
        weight: Number(s.weight) || 0,
        reps: Number(s.reps) || 0,
      })),
    };
    console.log("[WORKOUT][LOCAL_SAVE]", sessionPayload);
    console.log(
      "[WORKOUT] To record via API: POST http://43.200.40.140/api/workouts { ...payload above... }"
    );

    // 실제 저장 API 호출
    try {
      const res = await postWorkoutSession(sessionPayload as any);
      console.log("[WORKOUT][POST][OK]", res);
      const serverSessionId =
        (res && (res.sessionId || res.data?.sessionId)) ||
        sessionPayload.sessionId;
      // POST 성공 시 활동 항목에 sessionId 저장 및 세트 내역 보존
      if (modalMode === "edit" && selectedExercise) {
        // 이전 완료 상태와 비교하여 카운트 조정
        const prev = activities.find((a) => a.id === selectedExercise.id);
        const prevCompleted = !!prev?.isCompleted;
        const nextCompleted = allSetsCompleted;
        if (prevCompleted !== nextCompleted) {
          const delta = nextCompleted ? 1 : -1;
          setCompletedCountPersist(Math.max(0, completedThisWeek + delta));
        }
        setAllActivities(
          allActivities.map((activity) =>
            activity.id === selectedExercise.id
              ? {
                  ...activity,
                  name: exerciseName,
                  details,
                  isCompleted: nextCompleted,
                  sessionId: serverSessionId,
                  sets,
                }
              : activity
          )
        );
      } else {
        const selectedDateStr = `${activeDate.getFullYear()}-${String(
          activeDate.getMonth() + 1
        ).padStart(2, "0")}-${String(activeDate.getDate()).padStart(2, "0")}`;
        const newWorkout: Activity = {
          id: Date.now(),
          name: exerciseName,
          details,
          time: new Date().toLocaleTimeString("ko-KR", {
            hour: "2-digit",
            minute: "2-digit",
            hour12: true,
          }),
          date: selectedDateStr,
          isCompleted: allSetsCompleted,
          sessionId: serverSessionId,
          sets,
        };
        setAllActivities([...allActivities, newWorkout]);
        if (allSetsCompleted) {
          setCompletedCountPersist(completedThisWeek + 1);
        }
      }
    } catch (e: any) {
      console.error("[WORKOUT][POST][FAIL]", e);
      Alert.alert(
        "운동 기록 저장 실패",
        e?.response?.data?.message || e?.message || "알 수 없는 오류"
      );
    }
    handleModalClose();
  };

  const handleDeleteWorkout = (workoutId: number, sessionId?: string) => {
    Alert.alert("운동 삭제", "이 운동을 삭제하시겠습니까?", [
      { text: "취소", style: "cancel" },
      {
        text: "삭제",
        style: "destructive",
        onPress: async () => {
          try {
            if (sessionId) {
              const res = await deleteWorkoutSession(sessionId);
              console.log("[WORKOUT][DELETE][OK]", res);
            }
          } catch (e) {
            console.error("[WORKOUT][DELETE][FAIL]", e);
          } finally {
            const target = allActivities.find((a) => a.id === workoutId);
            if (target?.isCompleted) {
              setCompletedCountPersist(Math.max(0, completedThisWeek - 1));
            }
            setAllActivities(
              allActivities.filter((activity) => activity.id !== workoutId)
            );
          }
        },
      },
    ]);
  };

  // StatsScreen 내부에서 사용될 때는 SafeAreaView 제거
  const ContainerComponent = View;

  return (
    <ContainerComponent style={styles.container}>
      <ScrollView style={styles.content}>
        {/* 월 네비게이션 */}
        <View style={styles.monthNavigation}>
          <View style={styles.monthNavLeft}>
            {showMonthView && (
              <>
                <TouchableOpacity
                  style={styles.navBtn}
                  onPress={() =>
                    setMonthBase(
                      (prev) =>
                        new Date(prev.getFullYear(), prev.getMonth() - 1, 1)
                    )
                  }
                >
                  <Icon name="chevron-back" size={18} color={colors.text} />
                </TouchableOpacity>
                <Text style={styles.monthText}>{`${
                  monthBase.getMonth() + 1
                }월`}</Text>
                <TouchableOpacity
                  style={styles.navBtn}
                  onPress={() =>
                    setMonthBase(
                      (prev) =>
                        new Date(prev.getFullYear(), prev.getMonth() + 1, 1)
                    )
                  }
                >
                  <Icon name="chevron-forward" size={18} color={colors.text} />
                </TouchableOpacity>
              </>
            )}
            {!showMonthView && (
              <Text style={styles.monthText}>{`${
                monthBase.getMonth() + 1
              }월`}</Text>
            )}
          </View>
          <TouchableOpacity
            style={styles.menuBtn}
            onPress={() => {
              setShowMonthView((prev) => {
                const next = !prev;
                if (!next) {
                  // 접히는 순간 달을 현재 달로 복귀
                  setMonthBase(new Date());
                }
                return next;
              });
            }}
          >
            <Icon name="menu" size={20} color={colors.text} />
          </TouchableOpacity>
        </View>
        {/* 확장 달력: 기본 달력 3줄(기준 달 1일이 포함된 주부터 표시, 넘어가는 날짜는 회색) */}
        {showMonthView && (
          <View style={styles.monthGridContainer}>
            {(() => {
              const today = new Date();
              const getStartOfWeek = (d: Date) => {
                const n = new Date(d.getFullYear(), d.getMonth(), d.getDate());
                const diff = n.getDay(); // Sun=0
                n.setDate(n.getDate() - diff);
                return n;
              };
              const firstOfMonth = new Date(
                monthBase.getFullYear(),
                monthBase.getMonth(),
                1
              );
              const gridStart = getStartOfWeek(firstOfMonth);
              // 필요한 주 수(3~6주) 계산
              const nextMonth = new Date(
                monthBase.getFullYear(),
                monthBase.getMonth() + 1,
                1
              );
              const daysInMonth = Math.round(
                (nextMonth.getTime() - firstOfMonth.getTime()) /
                  (1000 * 60 * 60 * 24)
              );
              const offset = firstOfMonth.getDay();
              const totalCells = Math.ceil((offset + daysInMonth) / 7) * 7; // 21/28/35/42
              const days = Array.from({ length: totalCells }).map((_, i) => {
                const d = new Date(
                  gridStart.getFullYear(),
                  gridStart.getMonth(),
                  gridStart.getDate() + i
                );
                const isToday = d.toDateString() === today.toDateString();
                const isCurrentMonth = d.getMonth() === monthBase.getMonth();
                return {
                  key: d.toISOString().slice(0, 10),
                  d,
                  isToday,
                  isCurrentMonth,
                };
              });
              return (
                <View style={styles.monthGrid}>
                  {days.map(({ key, d, isToday, isCurrentMonth }) => {
                    const isSelected = selectedDate
                      ? d.toDateString() === selectedDate.toDateString()
                      : false;
                    return (
                      <TouchableOpacity
                        key={key}
                        style={styles.monthCell}
                        onPress={() => {
                          setSelectedDate(d);
                          setShowMonthView(false);
                          setMonthBase(
                            new Date(d.getFullYear(), d.getMonth(), 1)
                          );
                        }}
                        activeOpacity={0.7}
                      >
                        <View
                          style={[
                            styles.monthDateBadge,
                            isSelected && styles.monthDateBadgeToday,
                          ]}
                        >
                          <Text
                            style={[
                              styles.monthDateText,
                              isSelected && styles.monthDateTextToday,
                              !isCurrentMonth && styles.monthDateTextMuted,
                            ]}
                          >
                            {d.getDate()}
                          </Text>
                        </View>
                        {(() => {
                          const dayProgress = getDayProgress(d);
                          const calories = dayProgress?.totalCalorie || 0;
                          const rate = dayProgress?.exerciseRate || 0;
                          return (
                            <>
                              <Text
                                style={[
                                  styles.calendarCalories,
                                  !isCurrentMonth && styles.monthMuted,
                                ]}
                              >
                                {calories > 0 ? `${Math.round(calories)}k` : ''}
                              </Text>
                              <Text
                                style={[
                                  styles.calendarPercentage,
                                  !isCurrentMonth && styles.monthMuted,
                                ]}
                              >
                                {rate > 0 ? `${Math.round(rate)}%` : ''}
                              </Text>
                            </>
                          );
                        })()}
                      </TouchableOpacity>
                    );
                  })}
                </View>
              );
            })()}
          </View>
        )}

        {/* 7일 캘린더 위젯 (확장 모드가 아닐 때만 표시) */}
        {!showMonthView && (
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
                return Array.from({ length: 7 }).map((_, index) => {
                  const d = new Date(
                    startThis.getFullYear(),
                    startThis.getMonth(),
                    startThis.getDate() + index
                  );
                  const label = String(d.getDate());
                  const isToday = d.toDateString() === today.toDateString();
                  const isSelected = selectedDate
                    ? d.toDateString() === selectedDate.toDateString()
                    : false;
                  return (
                    <TouchableOpacity
                      key={startThis.toISOString() + "-w-" + index}
                      style={styles.calendarItem}
                      onPress={() => setSelectedDate(d)}
                      activeOpacity={0.7}
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
                          {label}
                        </Text>
                      </View>
                      {(() => {
                        const dayProgress = getDayProgress(d);
                        const calories = dayProgress?.totalCalorie || 0;
                        const rate = dayProgress?.exerciseRate || 0;
                        return (
                          <>
                            <Text style={styles.calendarCalories}>
                              {calories > 0 ? `${Math.round(calories)}k` : ''}
                            </Text>
                            <Text style={styles.calendarPercentage}>
                              {rate > 0 ? `${Math.round(rate)}%` : ''}
                            </Text>
                          </>
                        );
                      })()}
                    </TouchableOpacity>
                  );
                });
              })()}
            </View>
          </View>
        )}

        {/* 확장 달력: 기존 주 아래는 제거(요청대로 하단은 이번주, 상단 두 줄만 표시) */}

        {/* 목표 카드 */}
        <TouchableOpacity
          style={styles.goalCard}
          onPress={() => navigation.navigate("Goal")}
        >
          <View style={styles.goalContent}>
            <Text style={styles.goalTitle}>운동 목표 설정</Text>
            <Text style={styles.goalDescription}>
              주 {goalData.frequency}회, {goalData.duration}, {goalData.type},{" "}
              {goalData.calories}kcal
            </Text>
            <View style={styles.progressContainer}>
              <View style={styles.progressBar}>
                <View
                  style={[
                    styles.progressFill,
                    { width: `${getProgressPercentage()}%` },
                  ]}
                />
              </View>
              <Text style={styles.progressText}>
                {getProgressPercentage()}%
              </Text>
            </View>
          </View>
          <Icon name="chevron-forward" size={18} color={colors.text} />
        </TouchableOpacity>

        {/* 운동 기록 섹션 */}
        <View style={styles.logSection}>
          <Text style={styles.sectionTitle}>운동 기록하기</Text>

          <View style={styles.logTimeline}>
            {activities.map((activity, index) => (
              <View key={activity.id} style={styles.logItem}>
                <TouchableOpacity
                  style={[
                    styles.logCard,
                    activity.isCompleted
                      ? styles.logCardCompleted
                      : styles.logCardPending,
                  ]}
                  onPress={() => handleExerciseClick(activity)}
                >
                  <View style={styles.logCardContent}>
                    <Text
                      style={[
                        styles.logName,
                        !activity.isCompleted && styles.logNamePending,
                      ]}
                    >
                      {activity.name}
                    </Text>
                    <Text style={styles.logDetails}>{activity.details}</Text>
                  </View>
                  <Text style={styles.logTime}>{activity.time}</Text>
                  <TouchableOpacity
                    style={styles.deleteBtn}
                    onPress={() =>
                      handleDeleteWorkout(activity.id, activity.sessionId)
                    }
                  >
                    <Icon name="trash" size={18} color={colors.textLight} />
                  </TouchableOpacity>
                </TouchableOpacity>
              </View>
            ))}
            <View style={styles.addItem}>
              <TouchableOpacity
                style={styles.addBtn}
                onPress={handleAddWorkout}
              >
                <Text style={styles.addBtnText}>운동 추가하기</Text>
              </TouchableOpacity>
            </View>
          </View>
        </View>

        {/* 서버 기록 섹션 제거됨 */}
      </ScrollView>

      <ExerciseModal
        isOpen={isModalOpen}
        onClose={handleModalClose}
        mode={modalMode}
        exerciseData={selectedExercise}
        onSave={handleExerciseSave}
      />
    </ContainerComponent>
  );
};

const styles = StyleSheet.create({
  container: {
    flex: 1,
    backgroundColor: colors.background,
  },
  monthNavigation: {
    flexDirection: "row",
    justifyContent: "space-between",
    alignItems: "center",
    marginBottom: 0,
    paddingBottom: 12,
    paddingTop: 8,
  },
  monthNavLeft: {
    flexDirection: "row",
    alignItems: "center",
    gap: 0,
  },
  navBtn: {
    backgroundColor: "transparent",
    padding: 0,
  },
  monthText: {
    fontSize: 18,
    fontWeight: "800",
    color: colors.text,
    lineHeight: 22,
  },
  menuBtn: {
    backgroundColor: "transparent",
    padding: 0,
    marginRight: 0,
  },
  content: {
    flex: 1,
    padding: 20,
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
  monthGridContainer: {
    marginTop: 6,
    marginBottom: 6,
    paddingHorizontal: 4,
  },
  monthGrid: {
    flexDirection: "row",
    flexWrap: "wrap",
  },
  monthCell: {
    width: `${100 / 7}%`,
    paddingVertical: 6,
    alignItems: "center",
  },
  monthDateBadge: {
    minWidth: 28,
    height: 28,
    borderRadius: 14,
    justifyContent: "center",
    alignItems: "center",
  },
  monthDateBadgeToday: {
    backgroundColor: "#ffffff",
  },
  monthDateText: {
    color: "#e3ff7c",
    fontSize: 16,
    fontWeight: "700",
    lineHeight: 19,
    textAlign: "center",
  },
  monthDateTextToday: {
    color: "#000",
  },
  monthDateTextMuted: {
    color: "#777777",
  },
  monthMuted: {
    color: "#777777",
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
  calendarNumberToday: {
    width: 30,
    height: 30,
    borderRadius: 15,
    backgroundColor: "#ffffff",
  },
  calendarNumberText: {
    fontSize: 16,
    fontWeight: "700",
    color: "#e3ff7c",
    lineHeight: 19,
    textAlign: "center",
  },
  calendarNumberTodayText: {
    color: "#000000",
    fontSize: 16,
    fontWeight: "700",
    lineHeight: 19,
  },
  calendarCalories: {
    fontSize: 12,
    fontWeight: "700",
    color: colors.text,
    textAlign: "center",
    height: 15,
    lineHeight: 14.52,
  },
  calendarPercentage: {
    fontSize: 12,
    fontWeight: "700",
    color: colors.text,
    textAlign: "center",
    height: 15,
    lineHeight: 14.52,
  },
  goalCard: {
    backgroundColor: "#3a3a3a",
    borderRadius: 20,
    paddingVertical: 16,
    paddingHorizontal: 20,
    flexDirection: "row",
    alignItems: "center",
    marginTop: 10,
    marginBottom: 16,
  },
  goalContent: {
    flex: 1,
  },
  goalTitle: {
    fontSize: 16,
    fontWeight: "600",
    color: "#ffffff",
    marginBottom: 8,
  },
  goalDescription: {
    fontSize: 12,
    color: "#ccc",
    lineHeight: 16.8, // line-height: 1.4 (12 * 1.4)
  },
  progressContainer: {
    flexDirection: "row",
    alignItems: "center",
    gap: 8,
    marginTop: 8,
    width: "100%",
  },
  progressBar: {
    flex: 1,
    height: 16,
    backgroundColor: "#cfcfcf",
    borderRadius: 999,
    overflow: "hidden",
  },
  progressFill: {
    height: "100%",
    backgroundColor: "#d6ff4b",
    borderRadius: 999,
  },
  progressText: {
    fontSize: 12,
    fontWeight: "600",
    color: "#e3ff7c",
    minWidth: 30,
    textAlign: "right",
  },
  logSection: {
    marginBottom: 16,
  },
  sectionTitle: {
    fontSize: 18,
    fontWeight: "600",
    color: colors.text,
    marginBottom: 16,
  },
  // 서버 기록 섹션 스타일 제거됨
  // (임시 API 테스트 버튼 스타일 제거)
  logTimeline: {
    paddingLeft: 8,
  },
  logItem: {
    flexDirection: "row",
    marginBottom: 16,
  },
  timelineLine: {
    alignItems: "center",
    marginRight: 12,
  },
  timelineDot: {
    width: 12,
    height: 12,
    borderRadius: 6,
    backgroundColor: colors.grayLight,
    marginTop: 8,
  },
  timelineDotCompleted: {
    backgroundColor: colors.primary,
  },
  timelineConnector: {
    width: 2,
    flex: 1,
    backgroundColor: colors.grayLight,
    marginVertical: 4,
  },
  logCard: {
    flex: 1,
    borderRadius: 12,
    padding: 16,
    flexDirection: "row",
    justifyContent: "space-between",
    alignItems: "center",
  },
  deleteBtn: {
    marginLeft: 12,
    padding: 6,
  },
  logCardPending: {
    backgroundColor: colors.white,
  },
  logCardCompleted: {
    backgroundColor: colors.cardBackground,
  },
  logCardContent: {
    flex: 1,
  },
  logName: {
    fontSize: 16,
    fontWeight: "600",
    color: colors.text,
    marginBottom: 4,
  },
  logNamePending: {
    color: colors.black,
  },
  logDetails: {
    fontSize: 14,
    color: colors.textLight,
  },
  logTime: {
    fontSize: 12,
    color: colors.textLight,
  },
  addItem: {
    flexDirection: "row",
    alignItems: "center",
  },
  timelineDotAdd: {
    width: 12,
    height: 12,
    borderRadius: 6,
    backgroundColor: colors.grayLight,
    marginRight: 12,
  },
  addBtn: {
    flex: 1,
    backgroundColor: colors.white,
    borderRadius: 12,
    padding: 16,
    alignItems: "center",
    borderWidth: 2,
    borderColor: colors.white,
    borderStyle: "dashed",
  },
  addBtnText: {
    fontSize: 16,
    fontWeight: "600",
    color: colors.black,
  },
});

export default ExerciseScreen;
