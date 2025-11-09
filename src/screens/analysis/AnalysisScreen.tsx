import React, {
  useState,
  useEffect,
  useCallback,
  useMemo,
  useRef,
} from "react";
import {
  View,
  Text,
  StyleSheet,
  ScrollView,
  TouchableOpacity,
  Image,
  ActivityIndicator,
} from "react-native";
import { SafeAreaView } from "react-native-safe-area-context";
import { Ionicons as Icon } from "@expo/vector-icons";
import { colors } from "../../theme/colors";
import InBodyPhotoModal from "../../components/modals/InBodyPhotoModal";
import axios from "axios";
import {
  fetchExerciseDetail,
  fetchExercises,
  fetchUserWorkouts,
  WorkoutSession,
} from "../../utils/exerciseApi";
import { useFocusEffect } from "@react-navigation/native";
import AsyncStorage from "@react-native-async-storage/async-storage";
import { ACCESS_TOKEN_KEY } from "../../services/apiConfig";
import MacroDonut from "../../components/charts/MacroDonut";
import { authAPI } from "../../services";
import { getLatestInBody } from "../../utils/inbodyApi";

interface MealComparison {
  thisWeekStart: string;
  thisWeekEnd: string;
  thisWeekCalories: number;
  lastWeekCalories: number;
  caloriesDifference: number;
  caloriesChangeRate: number;
  carbsChangeRate: number;
  proteinChangeRate: number;
  fatChangeRate: number;
  analysisMessage?: string;
  thisWeekMacroRatio?: MacroRatio;
  lastWeekMacroRatio?: MacroRatio;
}

interface MacroRatio {
  protein?: number | null;
  carbs?: number | null;
  fat?: number | null;
}

const AnalysisScreen = ({ navigation }: any) => {
  const [isPhotoModalOpen, setIsPhotoModalOpen] = useState(false);
  const [workoutHistory, setWorkoutHistory] = useState<WorkoutSession[]>([]);
  const [loading, setLoading] = useState(true);
  const [mealComparison, setMealComparison] = useState<MealComparison | null>(
    null
  );
  const [mealLoading, setMealLoading] = useState(true);
  const [mealError, setMealError] = useState<string | null>(null);
  const [userId, setUserId] = useState<string | null>(null);
  const [userIdLoaded, setUserIdLoaded] = useState(false);
  const [userName, setUserName] = useState<string | null>(null);
  const [latestInBodyDate, setLatestInBodyDate] = useState<string | null>(null);

  const displayName = useMemo(
    () => (userName ? `${userName}님` : "회원님"),
    [userName]
  );

  const formatNumber = useCallback((value?: number | null) => {
    if (value === null || value === undefined || Number.isNaN(value))
      return "0";
    return Math.round(value).toLocaleString("ko-KR");
  }, []);

  const formatPercent = useCallback((value?: number | null) => {
    if (value === null || value === undefined || Number.isNaN(value))
      return "0%";
    const rounded = Number(value.toFixed(1));
    const sign = rounded > 0 ? "+" : "";
    return `${sign}${rounded}%`;
  }, []);

  const formatSignedNumber = useCallback((value?: number | null) => {
    if (value === null || value === undefined || Number.isNaN(value))
      return "0";
    const sign = value > 0 ? "+" : "";
    return `${sign}${Math.round(value).toLocaleString("ko-KR")}`;
  }, []);

  const getBadgeTone = useCallback((value?: number | null) => {
    if (
      value === null ||
      value === undefined ||
      Number.isNaN(value) ||
      value === 0
    )
      return "neutral";
    return value > 0 ? "positive" : "negative";
  }, []);

  const getBadgeIcon = useCallback((value?: number | null) => {
    if (
      value === null ||
      value === undefined ||
      Number.isNaN(value) ||
      value === 0
    )
      return "remove";
    return value > 0 ? "arrow-up" : "arrow-down";
  }, []);

  const getThisWeekStart = useCallback(() => {
    const today = new Date();
    const day = today.getDay(); // Sun=0
    const diff = day === 0 ? -6 : 1 - day; // move to Monday
    const monday = new Date(today);
    monday.setDate(today.getDate() + diff);
    monday.setHours(0, 0, 0, 0);
    return monday;
  }, []);

  const toDateParam = useCallback((date: Date) => {
    const year = date.getFullYear();
    const month = String(date.getMonth() + 1).padStart(2, "0");
    const day = String(date.getDate()).padStart(2, "0");
    return `${year}-${month}-${day}`;
  }, []);

  const normalizeRatio = useCallback((ratio?: MacroRatio | null) => {
    if (!ratio) return null;
    const protein = Number(ratio.protein ?? 0);
    const carbs = Number(ratio.carbs ?? 0);
    const fat = Number(ratio.fat ?? 0);
    const total = protein + carbs + fat;
    if (!Number.isFinite(total) || total <= 0) return null;
    const clampPercent = (value: number) =>
      Math.max(0, Math.min(100, Math.round((value / total) * 100)));
    const normalized = {
      protein: clampPercent(protein),
      carbs: clampPercent(carbs),
      fat: clampPercent(fat),
    };
    const sum = normalized.protein + normalized.carbs + normalized.fat;
    const fixDelta = 100 - sum;
    if (fixDelta !== 0) {
      if (Math.abs(fixDelta) > 0) {
        normalized.protein = Math.max(
          0,
          Math.min(100, normalized.protein + fixDelta)
        );
      }
    }
    return normalized;
  }, []);

  // 1RM 계산 함수 (Epley 공식)
  const calculate1RM = (weight: number, reps: number): number => {
    if (reps === 1) return weight;
    return Math.round(weight * (1 + reps / 30) * 10) / 10;
  };

  // 운동별 최근 8개 기록을 그룹화하고 이전 기록과 비교
  const exercises = useMemo(() => {
    if (workoutHistory.length === 0) return [];

    // 운동 이름별로 그룹화
    const groupedByExercise = workoutHistory.reduce((acc, session) => {
      const name = session.exerciseName;
      if (!acc[name]) {
        acc[name] = [];
      }
      acc[name].push(session);
      return acc;
    }, {} as Record<string, WorkoutSession[]>);

    // 각 운동별로 최근 8개만 유지하고 날짜순 정렬
    const recentExercises: any[] = [];

    Object.entries(groupedByExercise).forEach(([name, sessions]) => {
      // 날짜순 정렬 (최신순)
      const sorted = sessions.sort(
        (a, b) =>
          new Date(b.workoutDate).getTime() - new Date(a.workoutDate).getTime()
      );

      // 최근 8개만
      const recent = sorted.slice(0, 8);

      if (recent.length > 0) {
        // 가장 최근 세션
        const latest = recent[0];

        // 최대 중량 계산 (가장 무거운 세트)
        const maxWeight = Math.max(...latest.sets.map((s) => s.weight));
        const maxWeightSet = latest.sets.find((s) => s.weight === maxWeight);

        // 1RM 계산
        const oneRM = maxWeightSet
          ? calculate1RM(maxWeightSet.weight, maxWeightSet.reps)
          : 0;

        // 이전 기록과 비교 (2번째 최근 기록) - 중량 변화만 추적
        let change = 0;
        let changeType: "positive" | "negative" | "neutral" = "neutral";

        if (recent.length > 1) {
          const previous = recent[1];
          const prevMaxWeight = Math.max(...previous.sets.map((s) => s.weight));
          const weightChange = maxWeight - prevMaxWeight;

          // 중량 변화만 표시
          change = weightChange;

          if (weightChange !== 0) {
            if (change > 0) {
              changeType = "positive";
            } else if (change < 0) {
              changeType = "negative";
            }
          }
        }

        recentExercises.push({
          id: latest.sessionId,
          name,
          change: Math.abs(change),
          changeType,
          rm: oneRM,
          recordCount: recent.length,
          exerciseId: latest.exerciseId,
          imageUrl:
            latest.imageUrl ||
            latest.exerciseImageUrl ||
            latest.image ||
            latest.imgUrl ||
            latest.photoUrl ||
            "",
        });
      }
    });

    // 최근 운동순으로 정렬 (가장 최근에 한 운동이 위로)
    return recentExercises
      .sort((a, b) => {
        const aLatest = groupedByExercise[a.name][0];
        const bLatest = groupedByExercise[b.name][0];
        return (
          new Date(bLatest.workoutDate).getTime() -
          new Date(aLatest.workoutDate).getTime()
        );
      })
      .slice(0, 8); // 최대 8개
  }, [workoutHistory]);

  const [exerciseImages, setExerciseImages] = useState<Record<string, string>>(
    {}
  );
  const [exerciseImagesByName, setExerciseImagesByName] = useState<
    Record<string, string>
  >({});
  const fetchedImageIdsRef = useRef<Set<string>>(new Set());
  const fetchedNameRef = useRef<Set<string>>(new Set());

  useEffect(() => {
    const missingIds = exercises
      .map((ex) => ({
        id: ex.exerciseId,
        fallbackUrl: ex.imageUrl,
      }))
      .filter((item) => {
        if (!item.id) return false;
        if (exerciseImages[item.id]) return false;
        if (fetchedImageIdsRef.current.has(item.id)) return false;
        return true;
      });

    if (missingIds.length === 0) return;

    let cancelled = false;

    const loadImages = async () => {
      for (const { id } of missingIds) {
        if (!id) continue;
        fetchedImageIdsRef.current.add(id);
        try {
          const detail = await fetchExerciseDetail(id);
          const url =
            detail?.imageUrl ||
            detail?.image ||
            detail?.imgUrl ||
            detail?.photoUrl;
          if (url && !cancelled) {
            setExerciseImages((prev) => ({
              ...prev,
              [id]: url,
            }));
          }
        } catch (error) {
          if (__DEV__) {
            console.warn("[ANALYSIS] 운동 이미지 불러오기 실패:", {
              id,
              error,
            });
          }
        }
      }
    };

    loadImages();

    return () => {
      cancelled = true;
    };
  }, [exercises, exerciseImages]);

  useEffect(() => {
    const missingByName = exercises
      .filter(
        (ex) =>
          !ex.exerciseId &&
          !ex.imageUrl &&
          ex.name &&
          !exerciseImagesByName[ex.name.toLowerCase()] &&
          !fetchedNameRef.current.has(ex.name.toLowerCase())
      )
      .map((ex) => ex.name as string);

    if (missingByName.length === 0) return;

    let cancelled = false;

    const loadByName = async () => {
      for (const rawName of missingByName) {
        const key = rawName.toLowerCase();
        fetchedNameRef.current.add(key);
        try {
          const response = await fetchExercises({
            keyword: rawName,
            size: 1,
            page: 0,
          });
          const first = response?.content?.[0];
          const url =
            first?.imageUrl || first?.image || first?.imgUrl || first?.photoUrl;
          if (url && !cancelled) {
            setExerciseImagesByName((prev) => ({
              ...prev,
              [key]: url,
            }));
          }
        } catch (error) {
          if (__DEV__) {
            console.warn("[ANALYSIS] 운동 이미지 검색 실패:", {
              name: rawName,
              error,
            });
          }
        }
      }
    };

    loadByName();

    return () => {
      cancelled = true;
    };
  }, [exercises, exerciseImagesByName]);

  // 운동 기록 조회
  const loadWorkoutHistory = useCallback(async () => {
    if (!userIdLoaded) return;
    if (!userId) {
      console.warn("[ANALYSIS] userId가 없습니다.");
      setWorkoutHistory([]);
      return;
    }
    try {
      setLoading(true);
      const workouts = await fetchUserWorkouts(userId);
      setWorkoutHistory(workouts);
      console.log("[ANALYSIS] 운동 기록", { count: workouts.length });
    } catch (error) {
      console.error("[ANALYSIS] 운동 기록 조회 실패:", error);
      setWorkoutHistory([]);
    } finally {
      setLoading(false);
    }
  }, [userId]);

  const loadMealComparison = useCallback(async () => {
    try {
      setMealLoading(true);
      setMealError(null);

      const token = await AsyncStorage.getItem(ACCESS_TOKEN_KEY);
      if (!token) {
        setMealComparison(null);
        setMealError("로그인이 필요합니다.");
        return;
      }

      const monday = getThisWeekStart();
      const params = { thisWeekStart: toDateParam(monday) };
      const response = await axios.get<MealComparison>(
        "http://43.200.40.140/api/meals/week-comparison",
        {
          params,
          headers: {
            Authorization: `Bearer ${token}`,
            Accept: "application/json",
          },
        }
      );
      setMealComparison(response.data);
    } catch (error: any) {
      console.error("[ANALYSIS] 식단 비교 조회 실패:", {
        message: error?.message,
        status: error?.response?.status,
        data: error?.response?.data,
      });
      setMealComparison(null);
      setMealError(
        error?.response?.data?.message ||
          "식단 분석 데이터를 불러오지 못했습니다."
      );
    } finally {
      setMealLoading(false);
    }
  }, [getThisWeekStart, toDateParam]);

  const loadUserId = useCallback(async () => {
    try {
      const storedUserId = await AsyncStorage.getItem("userId");
      setUserId(storedUserId);
    } finally {
      setUserIdLoaded(true);
    }
  }, []);

  const loadUserName = useCallback(async () => {
    let cachedName: string | null = null;
    try {
      cachedName = await AsyncStorage.getItem("userName");
      if (cachedName) {
        setUserName(cachedName);
      }
    } catch (error) {
      console.warn("[ANALYSIS] 사용자 이름 캐시 로드 실패:", error);
    }

    try {
      const profile = await authAPI.getProfile();
      if (profile?.name) {
        setUserName(profile.name);
        if (profile.name !== cachedName) {
          await AsyncStorage.setItem("userName", profile.name);
        }
      }
    } catch (error) {
      console.error("[ANALYSIS] 사용자 이름 갱신 실패:", error);
    }
  }, []);

  const loadLatestInBodyDate = useCallback(async () => {
    if (!userIdLoaded) return;
    try {
      const response = await getLatestInBody();
      const latest = response?.success ? response.inBody : response;
      if (latest?.measurementDate) {
        const normalized = latest.measurementDate.includes(".")
          ? latest.measurementDate
          : latest.measurementDate.replace(/-/g, ".");
        setLatestInBodyDate(normalized);
        return;
      }
    } catch (error) {
      console.error("[ANALYSIS] 최신 인바디 조회 실패:", error);
    }

    try {
      const baseKey = `manualInBody:${userId || "guest"}`;
      const manualDatesRaw = await AsyncStorage.getItem(`${baseKey}:dates`);
      if (manualDatesRaw) {
        const manualDates: string[] = JSON.parse(manualDatesRaw);
        if (manualDates.length > 0) {
          const latestManual = manualDates.slice().sort().pop()!;
          const normalized = latestManual.includes(".")
            ? latestManual
            : latestManual.replace(/-/g, ".");
          setLatestInBodyDate(normalized);
          return;
        }
      }
    } catch (error) {
      console.error("[ANALYSIS] 수기 인바디 날짜 조회 실패:", error);
    }

    setLatestInBodyDate(null);
  }, [userId, userIdLoaded]);

  useEffect(() => {
    loadUserId();
  }, [loadUserId]);

  // 화면 포커스 시 운동 기록 새로고침
  useFocusEffect(
    useCallback(() => {
      loadWorkoutHistory();
      loadMealComparison();
      loadUserName();
      loadLatestInBodyDate();
    }, [
      loadWorkoutHistory,
      loadMealComparison,
      loadLatestInBodyDate,
      loadUserName,
    ])
  );

  const nutrientChanges = useMemo(
    () =>
      mealComparison
        ? [
            {
              key: "carbs",
              label: "탄수화물",
              change: mealComparison.carbsChangeRate,
            },
            {
              key: "protein",
              label: "단백질",
              change: mealComparison.proteinChangeRate,
            },
            { key: "fat", label: "지방", change: mealComparison.fatChangeRate },
          ]
        : [],
    [mealComparison]
  );

  const lastWeekRatio = useMemo(
    () => normalizeRatio(mealComparison?.lastWeekMacroRatio),
    [mealComparison, normalizeRatio]
  );

  const thisWeekRatio = useMemo(
    () => normalizeRatio(mealComparison?.thisWeekMacroRatio),
    [mealComparison, normalizeRatio]
  );

  const macroDonutItems = useMemo(() => {
    const items: Array<{
      key: string;
      label: string;
      ratio: NonNullable<ReturnType<typeof normalizeRatio>>;
    }> = [];
    if (lastWeekRatio) {
      items.push({
        key: "last",
        label: "지난주 영양소 비율",
        ratio: lastWeekRatio,
      });
    }
    if (thisWeekRatio) {
      items.push({
        key: "this",
        label: "이번주 영양소 비율",
        ratio: thisWeekRatio,
      });
    }
    return items;
  }, [lastWeekRatio, thisWeekRatio]);

  const handleInBodyClick = () => {
    navigation.navigate("InBody");
  };

  const handlePhotoClick = () => {
    setIsPhotoModalOpen(true);
  };

  const handleManualClick = () => {
    navigation.navigate("InBodyManual");
  };

  const handlePhotoSave = (data: any) => {
    console.log("인바디 사진 저장:", data);
  };

  const greetingSummary = useMemo(
    () => "오늘도 균형 잡힌 식단과 꾸준한 운동으로 힘차게 나아가봐요!",
    []
  );

  const latestMeasurementLabel = latestInBodyDate
    ? `최근 측정일 ${latestInBodyDate}`
    : "최근 측정 기록이 없습니다";

  return (
    <SafeAreaView style={styles.container} edges={["top"]}>
      <View style={styles.header}>
        <Text style={styles.headerTitle}>분석하기</Text>
      </View>
      <ScrollView
        style={styles.content}
        contentContainerStyle={styles.contentContainer}
      >
        {/* 인사말 섹션 */}
        <View style={styles.greetingSection}>
          <Text style={styles.greetingMessage}>
            <Text style={styles.greetingHighlight}>{displayName}</Text>
            {` ${greetingSummary}`}
          </Text>
        </View>

        {/* 인바디 기록/분석 섹션 */}
        <View style={styles.inbodySection}>
          <View style={styles.sectionHeader}>
            <Text style={styles.sectionTitle}>인바디 기록/분석</Text>
            <Text style={styles.sectionSubtitle}>{latestMeasurementLabel}</Text>
          </View>
          <View style={styles.inputButtons}>
            <TouchableOpacity
              style={[styles.inputBtn, styles.photoBtn]}
              onPress={handlePhotoClick}
            >
              <Icon name="camera-outline" size={16} color="#ffffff" />
              <Text style={styles.inputBtnText}>사진으로 입력</Text>
            </TouchableOpacity>
            <TouchableOpacity
              style={[styles.inputBtn, styles.manualBtn]}
              onPress={handleManualClick}
            >
              <Icon name="pencil-outline" size={16} color="#ffffff" />
              <Text style={styles.inputBtnText}>수기로 입력</Text>
            </TouchableOpacity>
          </View>
          <TouchableOpacity
            style={styles.analysisBtn}
            onPress={handleInBodyClick}
          >
            <Icon name="bar-chart-outline" size={18} color="#000000" />
            <Text style={styles.analysisBtnText}>정보/분석</Text>
          </TouchableOpacity>
        </View>

        {/* 운동 분석 섹션 */}
        <View style={styles.exerciseSection}>
          <Text style={styles.sectionTitle}>운동 분석</Text>
          <Text style={styles.exerciseSummary}>
            {`${displayName}의 최근 운동 중량 변화와 1RM을 확인해보세요.`}
          </Text>
          {loading ? (
            <View style={styles.loadingContainer}>
              <ActivityIndicator size="small" color="#d6ff4b" />
              <Text style={styles.loadingText}>운동 기록 불러오는 중...</Text>
            </View>
          ) : exercises.length === 0 ? (
            <View style={styles.emptyContainer}>
              <Text style={styles.emptyText}>운동 기록이 없습니다.</Text>
              <Text style={styles.emptySubText}>
                운동을 기록하고 분석을 확인하세요.
              </Text>
            </View>
          ) : (
            <ScrollView
              style={styles.exerciseList}
              showsVerticalScrollIndicator={false}
            >
              {exercises.map((exercise, index) => (
                <View
                  key={exercise.id}
                  style={[
                    styles.exerciseItem,
                    index === exercises.length - 1 && styles.exerciseItemLast,
                  ]}
                >
                  <View style={styles.exerciseIcon}>
                    {(() => {
                      const idKey = exercise.exerciseId
                        ? String(exercise.exerciseId)
                        : undefined;
                      const nameKey = exercise.name
                        ? exercise.name.toLowerCase()
                        : undefined;

                      const displayUrl =
                        exercise.imageUrl ||
                        (idKey ? exerciseImages[idKey] : undefined) ||
                        (nameKey ? exerciseImagesByName[nameKey] : undefined);
                      if (displayUrl) {
                        return (
                          <Image
                            source={{ uri: displayUrl }}
                            style={styles.exerciseImage}
                            resizeMode="cover"
                          />
                        );
                      }
                      return (
                        <View style={styles.exerciseImagePlaceholder}>
                          <Icon name="barbell" size={16} color="#666666" />
                        </View>
                      );
                    })()}
                  </View>
                  <View style={styles.exerciseInfo}>
                    <Text style={styles.exerciseName}>{exercise.name}</Text>
                    <View style={styles.exerciseChangeContainer}>
                      {exercise.changeType === "positive" && (
                        <>
                          <Icon name="arrow-up" size={10} color="#4ade80" />
                          <Text
                            style={[styles.exerciseChange, styles.positive]}
                          >
                            {" "}
                            +{exercise.change}kg
                          </Text>
                        </>
                      )}
                      {exercise.changeType === "negative" && (
                        <>
                          <Icon name="arrow-down" size={10} color="#ef4444" />
                          <Text
                            style={[styles.exerciseChange, styles.negative]}
                          >
                            {" "}
                            -{exercise.change}kg
                          </Text>
                        </>
                      )}
                      {exercise.changeType === "neutral" && (
                        <>
                          <Icon name="remove" size={10} color="#aaa" />
                          <Text style={[styles.exerciseChange, styles.neutral]}>
                            {" "}
                            변화없음
                          </Text>
                        </>
                      )}
                    </View>
                  </View>
                  <Text style={styles.exercise1rm}>1RM {exercise.rm}kg</Text>
                </View>
              ))}
            </ScrollView>
          )}
        </View>

        {/* 식단 분석 섹션 */}
        <View style={styles.dietSection}>
          <Text style={styles.sectionTitle}>식단 분석</Text>
          {mealLoading ? (
            <View style={styles.mealLoadingContainer}>
              <ActivityIndicator size="small" color="#d6ff4b" />
              <Text style={styles.loadingText}>식단 데이터 불러오는 중...</Text>
            </View>
          ) : mealComparison ? (
            <>
              <Text style={styles.dietSummary}>
                {mealComparison.analysisMessage ||
                  `${displayName}의 식단 분석을 준비 중이에요. 이번 주 기록을 쌓으면 지난 주와 비교해드릴게요.`}
              </Text>

              <View style={styles.calorieSection}>
                <View style={styles.calorieStatsCard}>
                  <Text style={styles.calorieLabel}>이번주 총 섭취</Text>
                  <Text style={styles.calorieValue}>
                    {formatNumber(mealComparison.thisWeekCalories)} kcal
                  </Text>
                  <Text style={styles.calorieSubText}>
                    지난주 {formatNumber(mealComparison.lastWeekCalories)} kcal
                  </Text>
                  <View
                    style={[
                      styles.calorieDiffBadge,
                      getBadgeTone(mealComparison.caloriesDifference) ===
                      "positive"
                        ? styles.badgePositive
                        : getBadgeTone(mealComparison.caloriesDifference) ===
                          "negative"
                        ? styles.badgeNegative
                        : styles.badgeNeutral,
                    ]}
                  >
                    <Icon
                      name={getBadgeIcon(mealComparison.caloriesDifference)}
                      size={12}
                      color={
                        getBadgeTone(mealComparison.caloriesDifference) ===
                        "positive"
                          ? "#4ade80"
                          : getBadgeTone(mealComparison.caloriesDifference) ===
                            "negative"
                          ? "#ef4444"
                          : "#cccccc"
                      }
                    />
                    <Text
                      style={[
                        styles.calorieDiffText,
                        getBadgeTone(mealComparison.caloriesDifference) ===
                        "positive"
                          ? styles.badgePositiveText
                          : getBadgeTone(mealComparison.caloriesDifference) ===
                            "negative"
                          ? styles.badgeNegativeText
                          : styles.badgeNeutralText,
                      ]}
                    >
                      {formatSignedNumber(mealComparison.caloriesDifference)}{" "}
                      kcal · {formatPercent(mealComparison.caloriesChangeRate)}
                    </Text>
                  </View>
                </View>

                <View style={styles.caloriePeriodRow}>
                  <Text style={styles.caloriePeriod}>
                    {mealComparison.thisWeekStart} ~{" "}
                    {mealComparison.thisWeekEnd}
                  </Text>
                </View>
              </View>

              {macroDonutItems.length > 0 && (
                <View style={styles.macroDonutSection}>
                  {macroDonutItems.map(({ key, label, ratio }) => (
                    <View key={key} style={styles.macroDonutCard}>
                      <Text style={styles.macroDonutTitle}>{label}</Text>
                      <View style={styles.macroDonutRow}>
                        <MacroDonut
                          segments={[
                            { percentage: ratio.protein, color: "#FF9F43" },
                            { percentage: ratio.carbs, color: "#29ABE2" },
                            { percentage: ratio.fat, color: "#A3E635" },
                          ]}
                          size={96}
                          thickness={18}
                        />
                        <View style={styles.macroLegend}>
                          <View style={styles.macroLegendRow}>
                            <View
                              style={[
                                styles.macroLegendBadge,
                                { backgroundColor: "#FF9F43" },
                              ]}
                            />
                            <Text style={styles.macroLegendText}>
                              단백질 {ratio.protein}%
                            </Text>
                          </View>
                          <View style={styles.macroLegendRow}>
                            <View
                              style={[
                                styles.macroLegendBadge,
                                { backgroundColor: "#29ABE2" },
                              ]}
                            />
                            <Text style={styles.macroLegendText}>
                              탄수화물 {ratio.carbs}%
                            </Text>
                          </View>
                          <View style={styles.macroLegendRow}>
                            <View
                              style={[
                                styles.macroLegendBadge,
                                { backgroundColor: "#A3E635" },
                              ]}
                            />
                            <Text style={styles.macroLegendText}>
                              지방 {ratio.fat}%
                            </Text>
                          </View>
                        </View>
                      </View>
                    </View>
                  ))}
                </View>
              )}

              <View style={styles.nutrientAnalysis}>
                <Text style={styles.nutrientAnalysisTitle}>영양소 변화율</Text>
                {nutrientChanges.length > 0 ? (
                  nutrientChanges.map((item) => {
                    const tone = getBadgeTone(item.change);
                    return (
                      <View key={item.key} style={styles.nutrientItem}>
                        <View style={styles.nutrientItemHeader}>
                          <Text style={styles.nutrientName}>{item.label}</Text>
                          <View
                            style={[
                              styles.nutrientBadge,
                              tone === "positive"
                                ? styles.badgePositive
                                : tone === "negative"
                                ? styles.badgeNegative
                                : styles.badgeNeutral,
                            ]}
                          >
                            <Icon
                              name={getBadgeIcon(item.change)}
                              size={12}
                              color={
                                tone === "positive"
                                  ? "#4ade80"
                                  : tone === "negative"
                                  ? "#ef4444"
                                  : "#cccccc"
                              }
                            />
                            <Text
                              style={[
                                styles.nutrientBadgeText,
                                tone === "positive"
                                  ? styles.badgePositiveText
                                  : tone === "negative"
                                  ? styles.badgeNegativeText
                                  : styles.badgeNeutralText,
                              ]}
                            >
                              {formatPercent(item.change)}
                            </Text>
                          </View>
                        </View>
                        <Text style={styles.nutrientChangeText}>
                          지난주 대비 {formatPercent(item.change)}
                        </Text>
                      </View>
                    );
                  })
                ) : (
                  <Text style={styles.nutrientChangeText}>
                    표시할 영양소 변화 데이터가 없습니다.
                  </Text>
                )}
              </View>
            </>
          ) : (
            <View style={styles.mealEmptyContainer}>
              <Text style={styles.emptyText}>
                {`${displayName}의 식단 데이터를 불러오지 못했어요.`}
              </Text>
              {mealError ? (
                <Text style={styles.emptySubText}>{mealError}</Text>
              ) : null}
            </View>
          )}
        </View>
      </ScrollView>

      <InBodyPhotoModal
        isOpen={isPhotoModalOpen}
        onClose={() => setIsPhotoModalOpen(false)}
        onSave={handlePhotoSave}
      />
    </SafeAreaView>
  );
};

const styles = StyleSheet.create({
  container: {
    flex: 1,
    backgroundColor: "#1c1c1c",
  },
  header: {
    height: 50,
    justifyContent: "center",
    alignItems: "center",
    paddingHorizontal: 20,
    paddingTop: 16,
    paddingBottom: 16,
    position: "relative",
  },
  headerTitle: {
    fontSize: 18,
    fontWeight: "600",
    color: "#ffffff",
  },
  content: {
    flex: 1,
  },
  contentContainer: {
    maxWidth: 400,
    alignSelf: "center",
    width: "100%",
    paddingHorizontal: 20,
    paddingBottom: 100,
  },
  greetingSection: {
    marginBottom: 24,
    marginTop: 6,
  },
  greetingMessage: {
    fontSize: 15.5,
    color: "#ffffff",
    lineHeight: 22,
  },
  greetingHighlight: {
    fontSize: 19.2,
    fontWeight: "600",
    color: "#E3FF7C",
  },
  inbodySection: {
    backgroundColor: "#2a2a2a",
    borderRadius: 12,
    paddingVertical: 20,
    paddingHorizontal: 20,
    marginBottom: 15,
  },
  sectionHeader: {
    marginBottom: 16,
    paddingTop: 2,
  },
  sectionTitle: {
    fontSize: 17.6,
    fontWeight: "400",
    color: "#ffffff",
    marginBottom: 1,
  },
  sectionSubtitle: {
    fontSize: 12.8,
    color: "#aaaaaa",
    marginBottom: 16,
  },
  inputButtons: {
    flexDirection: "row",
    gap: 8,
    marginBottom: 12,
  },
  inputBtn: {
    flex: 1,
    flexDirection: "row",
    alignItems: "center",
    justifyContent: "center",
    paddingVertical: 10,
    paddingHorizontal: 12,
    borderRadius: 8,
    gap: 6,
  },
  photoBtn: {
    backgroundColor: "#333333",
  },
  manualBtn: {
    backgroundColor: "#333333",
  },
  inputBtnText: {
    fontSize: 12.8,
    fontWeight: "400",
    color: "#ffffff",
  },
  analysisBtn: {
    flexDirection: "row",
    alignItems: "center",
    justifyContent: "center",
    paddingVertical: 12,
    borderRadius: 8,
    backgroundColor: "#E3FF7C",
    gap: 8,
    marginBottom: 15,
  },
  analysisBtnText: {
    fontSize: 14.4,
    fontWeight: "600",
    color: "#000000",
  },
  exerciseSection: {
    backgroundColor: "#2a2a2a",
    borderRadius: 12,
    paddingVertical: 20,
    paddingHorizontal: 20,
    marginBottom: 15,
  },
  exerciseSummary: {
    fontSize: 12.8,
    color: "#aaaaaa",
    lineHeight: 17.92,
    marginBottom: 16,
  },
  highlightText: {
    color: "#E3FF7C",
    fontWeight: "400",
  },
  exerciseList: {
    maxHeight: 216,
  },
  loadingContainer: {
    paddingVertical: 40,
    alignItems: "center",
    justifyContent: "center",
  },
  loadingText: {
    marginTop: 10,
    fontSize: 13,
    color: "#aaaaaa",
  },
  emptyContainer: {
    paddingVertical: 40,
    alignItems: "center",
    justifyContent: "center",
  },
  emptyText: {
    fontSize: 14,
    color: "#ffffff",
    fontWeight: "500",
    marginBottom: 8,
  },
  emptySubText: {
    fontSize: 13,
    color: "#aaaaaa",
  },
  exerciseItem: {
    flexDirection: "row",
    alignItems: "center",
    paddingVertical: 12,
    paddingHorizontal: 0,
    borderBottomWidth: 1,
    borderBottomColor: "#444444",
    minHeight: 48,
    gap: 12,
  },
  exerciseItemLast: {
    borderBottomWidth: 0,
  },
  exerciseIcon: {
    width: 40,
    height: 40,
    borderRadius: 12,
    backgroundColor: "#2c2c2c",
    justifyContent: "center",
    alignItems: "center",
    overflow: "hidden",
  },
  exerciseImage: {
    width: 40,
    height: 40,
  },
  exerciseImagePlaceholder: {
    width: 40,
    height: 40,
    borderRadius: 12,
    backgroundColor: "#2c2c2c",
    alignItems: "center",
    justifyContent: "center",
  },
  exerciseInfo: {
    flex: 1,
    flexDirection: "row",
    alignItems: "center",
    gap: 8,
  },
  exerciseName: {
    fontSize: 14.4,
    fontWeight: "500",
    color: "#ffffff",
  },
  exerciseChangeContainer: {
    flexDirection: "row",
    alignItems: "center",
    gap: 2,
  },
  exerciseChange: {
    fontSize: 11.2,
    fontWeight: "400",
  },
  positive: {
    color: "#4ade80",
  },
  negative: {
    color: "#ef4444",
  },
  neutral: {
    color: "#aaaaaa",
  },
  exercise1rm: {
    fontSize: 12.8,
    fontWeight: "500",
    color: "#ccff00",
    textAlign: "right",
    minWidth: 80,
  },
  dietSection: {
    backgroundColor: "#2a2a2a",
    borderRadius: 12,
    paddingVertical: 20,
    paddingHorizontal: 20,
    marginBottom: 20,
  },
  dietSummary: {
    fontSize: 12.8,
    color: "#aaaaaa",
    lineHeight: 17.92,
    marginBottom: 16,
  },
  calorieSection: {
    marginBottom: 20,
    gap: 16,
  },
  nutrientLegend: {
    flexDirection: "row",
    gap: 12,
    alignItems: "center",
    marginLeft: 8,
  },
  legendItem: {
    flexDirection: "column",
    alignItems: "center",
    gap: 4,
  },
  legendBox: {
    width: 25,
    height: 29,
    borderRadius: 4,
    justifyContent: "center",
    alignItems: "center",
  },
  nutrientAnalysis: {
    marginTop: 0,
    gap: 12,
  },
  macroDonutSection: {
    flexDirection: "row",
    justifyContent: "space-between",
    gap: 12,
    marginTop: 4,
    marginBottom: 16,
    flexWrap: "wrap",
  },
  macroDonutCard: {
    flex: 1,
    minWidth: 150,
    backgroundColor: "#1f1f1f",
    borderRadius: 12,
    padding: 16,
    gap: 12,
  },
  macroDonutTitle: {
    fontSize: 12,
    color: "#cccccc",
    fontWeight: "500",
  },
  macroDonutRow: {
    flexDirection: "row",
    alignItems: "center",
    gap: 16,
  },
  macroLegend: {
    flex: 1,
    gap: 8,
  },
  macroLegendRow: {
    flexDirection: "row",
    alignItems: "center",
    gap: 8,
  },
  macroLegendBadge: {
    width: 10,
    height: 10,
    borderRadius: 5,
  },
  macroLegendText: {
    fontSize: 11.2,
    color: "#cccccc",
  },
  nutrientAnalysisTitle: {
    fontSize: 14.4,
    fontWeight: "400",
    color: "#ffffff",
    marginBottom: 12,
  },
  nutrientItem: {
    paddingVertical: 12,
    borderBottomWidth: 1,
    borderBottomColor: "#333333",
    gap: 8,
  },
  nutrientItemHeader: {
    flexDirection: "row",
    alignItems: "center",
    justifyContent: "space-between",
  },
  nutrientName: {
    fontSize: 12.8,
    fontWeight: "400",
    color: "#ffffff",
  },
  nutrientBadge: {
    flexDirection: "row",
    alignItems: "center",
    gap: 6,
    paddingHorizontal: 10,
    paddingVertical: 6,
    borderRadius: 999,
  },
  nutrientBadgeText: {
    fontSize: 11.2,
    fontWeight: "500",
  },
  nutrientChangeText: {
    fontSize: 11.2,
    color: "#aaaaaa",
  },
  mealLoadingContainer: {
    paddingVertical: 28,
    alignItems: "center",
    gap: 8,
  },
  mealEmptyContainer: {
    paddingVertical: 28,
    alignItems: "center",
    gap: 6,
  },
  calorieStatsCard: {
    backgroundColor: "#1f1f1f",
    borderRadius: 12,
    paddingVertical: 16,
    paddingHorizontal: 16,
    gap: 4,
  },
  calorieLabel: {
    fontSize: 12,
    color: "#aaaaaa",
  },
  calorieValue: {
    fontSize: 24,
    fontWeight: "700",
    color: "#ffffff",
  },
  calorieSubText: {
    fontSize: 12,
    color: "#888888",
    marginTop: 4,
  },
  calorieDiffBadge: {
    marginTop: 12,
    alignSelf: "flex-start",
    flexDirection: "row",
    alignItems: "center",
    gap: 6,
    paddingHorizontal: 12,
    paddingVertical: 6,
    borderRadius: 999,
  },
  calorieDiffText: {
    fontSize: 11.2,
    fontWeight: "600",
  },
  badgePositive: {
    backgroundColor: "rgba(74, 222, 128, 0.18)",
  },
  badgeNegative: {
    backgroundColor: "rgba(239, 68, 68, 0.18)",
  },
  badgeNeutral: {
    backgroundColor: "#333333",
  },
  badgePositiveText: {
    color: "#4ade80",
  },
  badgeNegativeText: {
    color: "#ef4444",
  },
  badgeNeutralText: {
    color: "#dddddd",
  },
  caloriePeriodRow: {
    flexDirection: "row",
    justifyContent: "space-between",
    alignItems: "center",
  },
  caloriePeriod: {
    fontSize: 11,
    color: "#777777",
  },
});

export default AnalysisScreen;
