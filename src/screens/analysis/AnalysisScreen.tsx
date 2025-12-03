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
  Animated,
  TextInput,
} from "react-native";
import { SafeAreaView } from "react-native-safe-area-context";
import { Ionicons as Icon } from "@expo/vector-icons";
import { colors } from "../../theme/colors";
import InBodyPhotoModal from "../../components/modals/InBodyPhotoModal";
import PremiumModal from "../../components/modals/PremiumModal";
import axios from "axios";
import Svg, { Circle } from "react-native-svg";
// Buffer import
import { Buffer } from "buffer";
(global as any).Buffer = (global as any).Buffer || Buffer;
import {
  fetchExerciseDetail,
  fetchExercises,
  fetchUserWorkouts,
  fetchSavedWorkouts,
  WorkoutSession,
  SavedWorkoutRecord,
} from "../../utils/exerciseApi";
import { useFocusEffect } from "@react-navigation/native";
import AsyncStorage from "@react-native-async-storage/async-storage";
import {
  ACCESS_TOKEN_KEY,
  API_BASE_URL,
  AI_API_BASE_URL,
  requestAI,
} from "../../services/apiConfig";
import MacroDonut from "../../components/charts/MacroDonut";
import { authAPI, healthScoreAPI } from "../../services";
import { getLatestInBody, InBodyPayload } from "../../utils/inbodyApi";
import { eventBus } from "../../utils/eventBus";
import { getMembershipType } from "../../utils/membership-utils";

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

interface ScoreTrendItem {
  date: string;
  score: number;
}

const ACTIVITY_STORAGE_BASE_KEY = "user_activities_v1";

const HANGUL_TOKEN_REPLACEMENTS: Array<[RegExp, string]> = [
  [/바벨/gi, "Barbell"],
  [/덤벨/gi, "Dumbbell"],
  [/디클라인/gi, "Decline"],
  [/인클라인/gi, "Incline"],
  [/클로즈/gi, "Close"],
  [/와이드/gi, "Wide"],
  [/그립/gi, "Grip"],
  [/투/gi, "To"],
  [/프레스/gi, "Press"],
  [/스컬/gi, "Skull"],
  [/컬/gi, "Curl"],
  [/로우/gi, "Row"],
  [/풀다운/gi, "Pulldown"],
  [/익스텐션/gi, "Extension"],
  [/익스텐/gi, "Extension"],
  [/익스프레션/gi, "Extension"],
  [/스쿼트/gi, "Squat"],
  [/백/gi, "Back"],
  [/레그/gi, "Leg"],
  [/스탠딩/gi, "Standing"],
  [/시티드/gi, "Seated"],
  [/라잉/gi, "Lying"],
  [/케이블/gi, "Cable"],
  [/머신/gi, "Machine"],
  [/숄더/gi, "Shoulder"],
  [/사이드/gi, "Side"],
  [/레터럴/gi, "Lateral"],
  [/브이업/gi, "V Up"],
  [/업라이트/gi, "Upright"],
  [/데드리프트/gi, "Deadlift"],
  [/크런치/gi, "Crunch"],
  [/플라이/gi, "Fly"],
  [/풀오버/gi, "Pullover"],
  [/드롭/gi, "Drop"],
  [/슈러그/gi, "Shrug"],
  [/버터플라이/gi, "Butterfly"],
  [/캡틴/gi, "Captain"],
  [/스티프/gi, "Stiff"],
];

const hasHangul = (value: string): boolean => /[가-힣]/.test(value);

const transliterateKoreanExerciseName = (
  value?: string | null
): string | null => {
  if (!value) return null;
  const trimmed = value.trim();
  if (!trimmed) return null;
  if (!hasHangul(trimmed)) return null;
  let result = trimmed;
  HANGUL_TOKEN_REPLACEMENTS.forEach(([pattern, replacement]) => {
    result = result.replace(pattern, ` ${replacement} `);
  });
  result = result.replace(/\s+/g, " ").trim();
  if (!result || result === trimmed) {
    return null;
  }
  // ensure at least one ASCII letter after replacement
  if (!/[A-Za-z]/.test(result)) {
    return null;
  }
  return result;
};

const generateSearchKeywords = (name?: string | null): string[] => {
  if (!name) return [];
  const normalized = name.replace(/\s+/g, " ").trim();
  if (!normalized) return [];
  const variants = new Set<string>();
  variants.add(normalized);
  variants.add(normalized.toLowerCase());

  const asciiOnly = normalized
    .replace(/[^\x00-\x7F]/g, " ")
    .replace(/\s+/g, " ")
    .trim();
  if (asciiOnly) {
    variants.add(asciiOnly);
    variants.add(asciiOnly.toLowerCase());
  }

  const transliterated = transliterateKoreanExerciseName(normalized);
  if (transliterated) {
    variants.add(transliterated);
    variants.add(transliterated.toLowerCase());
    variants.add(transliterated.replace(/\s+/g, " "));
    variants.add(transliterated.replace(/\s+/g, " ").toLowerCase());
  }

  return Array.from(variants)
    .map((keyword) => keyword.trim())
    .filter((keyword) => keyword.length > 0);
};

const HealthScoreCircle = ({
  score,
  size = 100,
}: {
  score: number;
  size?: number;
}) => {
  const animatedValue = useRef(new Animated.Value(0)).current;
  const strokeWidth = 8;
  const radius = (size - strokeWidth) / 2;
  const circumference = 2 * Math.PI * radius;

  useEffect(() => {
    Animated.timing(animatedValue, {
      toValue: score,
      duration: 1500,
      useNativeDriver: true,
    }).start();
  }, [score]);

  const strokeDashoffset = animatedValue.interpolate({
    inputRange: [0, 100],
    outputRange: [circumference, 0],
  });

  return (
    <View style={styles.healthScoreCircleContainer}>
      <Svg
        width={size}
        height={size}
        style={{ transform: [{ rotate: "-90deg" }] }}
      >
        {/* 배경 원 */}
        <Circle
          cx={size / 2}
          cy={size / 2}
          r={radius}
          stroke="#333333"
          strokeWidth={strokeWidth}
          fill="none"
        />
        {/* 프로그레스 원 */}
        <Circle
          cx={size / 2}
          cy={size / 2}
          r={radius}
          stroke="#E3FF7C"
          strokeWidth={strokeWidth}
          fill="none"
          strokeDasharray={circumference}
          strokeDashoffset={circumference - (circumference * score) / 100}
          strokeLinecap="round"
        />
      </Svg>
      <View style={styles.healthScoreTextContainer}>
        <Text style={styles.healthScoreNumber}>{score}</Text>
      </View>
    </View>
  );
};

const AnalysisScreen = ({ navigation }: any) => {
  const [isPhotoModalOpen, setIsPhotoModalOpen] = useState(false);
  const [isPremiumModalOpen, setIsPremiumModalOpen] = useState(false);
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
  const [localSessionCompletion, setLocalSessionCompletion] = useState<
    Record<string, boolean>
  >({});
  const [localCompletionByNameDate, setLocalCompletionByNameDate] = useState<
    Record<string, boolean>
  >({});
  
  // 식단 그래프 state
  const [nutritionGraphUrl, setNutritionGraphUrl] = useState<string | null>(null);
  const [nutritionGraphLoading, setNutritionGraphLoading] = useState(false);
  const [nutritionWeeks, setNutritionWeeks] = useState<string>("");
  
  // 운동 그래프 state
  const [exerciseGraphUrl, setExerciseGraphUrl] = useState<string | null>(null);
  const [exerciseWeeks, setExerciseWeeks] = useState<string>("");
  
  // 건강점수 state
  const [healthScore, setHealthScore] = useState<number>(0);
  const [healthScoreTrend, setHealthScoreTrend] = useState<ScoreTrendItem[]>(
    []
  );
  const [healthScoreLoading, setHealthScoreLoading] = useState(true);

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
  const getActivityStorageKey = useCallback(() => {
    return userId
      ? `${ACTIVITY_STORAGE_BASE_KEY}:${userId}`
      : ACTIVITY_STORAGE_BASE_KEY;
  }, [userId]);

  const interpretCompletion = useCallback((value: any): boolean | null => {
    if (typeof value === "boolean") {
      return value;
    }
    if (typeof value === "number") {
      if (Number.isNaN(value)) return null;
      return value !== 0;
    }
    if (typeof value === "string") {
      const normalized = value.trim().toLowerCase();
      if (!normalized) return null;
      if (["true", "y", "yes", "완료", "done"].includes(normalized))
        return true;
      if (["false", "n", "no", "미완료"].includes(normalized)) return false;
      const numeric = Number(normalized);
      if (!Number.isNaN(numeric)) return numeric !== 0;
    }
    return null;
  }, []);

  const isSessionCompleted = useCallback(
    (session: WorkoutSession) => {
      if (!session) return false;

      // 저장된 운동 기록은 항상 완료된 것으로 간주
      // (서버에서 가져온 데이터는 이미 저장된 것이므로)
      const direct = interpretCompletion((session as any).isCompleted);
      if (direct === true) return true;

      const alt = interpretCompletion((session as any).completed);
      if (alt === true) return true;

      // sets에 completed: true가 있으면 완료된 것으로 간주
      if (Array.isArray(session.sets) && session.sets.length > 0) {
        const statuses = session.sets.map((set: any) =>
          interpretCompletion(set?.completed || set?.isCompleted)
        );
        const hasCompleted = statuses.some((status) => status === true);
        if (hasCompleted) return true;

        // 모든 세트가 완료되었는지 확인
        const hasKnown = statuses.some((status) => status !== null);
        if (hasKnown) {
          return statuses.every((status) => status === true);
        }
      }

      // 로컬 저장소에서 확인 (단, workoutHistory가 비어있으면 로컬 정보도 무시)
      // workoutHistory가 비어있으면 운동 기록이 없는 것이므로 로컬 완료 정보를 사용하지 않음
      if (workoutHistory.length === 0) {
        return false;
      }

      const sessionKey =
        session.sessionId !== undefined && session.sessionId !== null
          ? String(session.sessionId)
          : null;
      if (sessionKey && sessionKey in localSessionCompletion) {
        return localSessionCompletion[sessionKey];
      }

      const sessionDateKey = (() => {
        if (!session.exerciseName) return null;
        const name = session.exerciseName.trim().toLowerCase();
        if (!name) return null;
        const dateStr = session.workoutDate
          ? session.workoutDate.slice(0, 10)
          : null;
        if (!dateStr) return null;
        return `${name}|${dateStr}`;
      })();
      if (sessionDateKey && sessionDateKey in localCompletionByNameDate) {
        return localCompletionByNameDate[sessionDateKey];
      }

      // 저장된 운동 기록은 sets가 있으면 완료된 것으로 간주
      if (Array.isArray(session.sets) && session.sets.length > 0) {
        return true;
      }

      return false;
    },
    [
      interpretCompletion,
      localSessionCompletion,
      localCompletionByNameDate,
      workoutHistory,
    ]
  );

  const completedWorkoutHistory = useMemo(() => {
    const completed = workoutHistory.filter(isSessionCompleted);
    if (__DEV__) {
      console.log("[ANALYSIS] completedWorkoutHistory 계산:", {
        total: workoutHistory.length,
        completed: completed.length,
        sample: completed.slice(0, 3).map((s) => ({
          exerciseName: s.exerciseName,
          workoutDate: s.workoutDate,
          setsCount: s.sets?.length || 0,
        })),
      });
    }
    return completed;
  }, [workoutHistory, isSessionCompleted]);

  // 운동별 고유 key 생성 유틸 함수
  const makeExerciseKey = useCallback(
    (
      sessionId: string | number | null | undefined,
      exerciseIdentifier: string | null | undefined
    ): string => {
      const sessionStr =
        sessionId != null ? String(sessionId) : `unknown-${Date.now()}`;
      const exerciseStr = exerciseIdentifier
        ? exerciseIdentifier.replace(/\s+/g, "_").toLowerCase()
        : `exercise-${Math.random().toString(36).substring(2, 9)}`;
      return `${sessionStr}-${exerciseStr}`;
    },
    []
  );

  const resolveExerciseIdentifier = useCallback(
    (session: WorkoutSession | null | undefined): string | undefined => {
      if (!session) return undefined;
      const candidates = [
        session.exerciseId,
        (session as any)?.externalId,
        (session as any)?.exercise?.externalId,
        (session as any)?.exercise?.id,
        (session as any)?.exercise?.code,
        (session as any)?.exerciseCode,
      ];
      for (const candidate of candidates) {
        if (candidate === undefined || candidate === null) continue;
        const normalized = String(candidate).trim();
        if (normalized) {
          return normalized;
        }
      }
      return undefined;
    },
    []
  );

  const exercises = useMemo(() => {
    console.log("[ANALYSIS] exercises 계산 시작:", {
      workoutHistoryLength: workoutHistory.length,
      completedWorkoutHistoryLength: completedWorkoutHistory.length,
      completedWorkoutHistorySample: completedWorkoutHistory
        .slice(0, 2)
        .map((s) => ({
          exerciseName: s.exerciseName,
          workoutDate: s.workoutDate,
          setsCount: s.sets?.length || 0,
          isCompleted: (s as any).isCompleted,
          completed: (s as any).completed,
        })),
    });
    if (completedWorkoutHistory.length === 0) {
      console.log(
        "[ANALYSIS] completedWorkoutHistory가 비어있음 - exercises 빈 배열 반환"
      );
      return [];
    }

    // 오늘 날짜 계산 (한국 시간대 기준)
    const today = new Date();
    const todayStr = today.toLocaleDateString("en-CA", { timeZone: "Asia/Seoul" }); // "YYYY-MM-DD" 형식

    // 오늘 완료한 운동만 필터링
    const todayCompletedExercises = completedWorkoutHistory.filter((session) => {
      if (!session.workoutDate) return false;
      // workoutDate가 ISO 문자열인 경우 날짜 부분만 추출
      const sessionDate = session.workoutDate.slice(0, 10);
      return sessionDate === todayStr;
    });

    console.log("[ANALYSIS] 오늘 완료한 운동 필터링:", {
      todayStr,
      totalCompleted: completedWorkoutHistory.length,
      todayCompleted: todayCompletedExercises.length,
      todayExerciseNames: [...new Set(todayCompletedExercises.map(s => s.exerciseName))],
    });

    if (todayCompletedExercises.length === 0) {
      console.log("[ANALYSIS] 오늘 완료한 운동이 없음 - exercises 빈 배열 반환");
      return [];
    }

    // 운동 이름별로 그룹화 (오늘 완료한 운동만)
    const groupedByExercise = todayCompletedExercises.reduce((acc, session) => {
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
      // 오늘 완료한 세션들 (이미 오늘 날짜로 필터링됨)
      // 날짜순 정렬 (최신순)
      const sorted = sessions.sort(
        (a, b) =>
          new Date(b.workoutDate).getTime() - new Date(a.workoutDate).getTime()
      );

      // 가장 최근 세션 (오늘 완료한 세션 중)
      const latest = sorted[0];

      if (!latest || !latest.sets || latest.sets.length === 0) {
        return; // 세트가 없으면 스킵
      }

      // 최대 중량 계산 (가장 무거운 세트)
      const maxWeight = Math.max(...latest.sets.map((s) => s.weight));
      const maxWeightSet = latest.sets.find((s) => s.weight === maxWeight);

      // 1RM 계산
      const oneRM = maxWeightSet
        ? calculate1RM(maxWeightSet.weight, maxWeightSet.reps)
        : 0;

      // 이전 기록과 비교 (오늘 이전의 가장 최근 기록) - 중량 변화만 추적
      let change = 0;
      let changeType: "positive" | "negative" | "neutral" = "neutral";

      // 전체 완료 기록에서 같은 운동 이름의 이전 기록 찾기 (오늘 이전)
      const allPreviousSessions = completedWorkoutHistory.filter((s) => {
        if (!s.workoutDate || s.exerciseName !== name) return false;
        const sessionDate = s.workoutDate.slice(0, 10);
        return sessionDate < todayStr; // 오늘 이전의 기록만
      });

      if (allPreviousSessions.length > 0) {
        // 날짜순 정렬 (최신순)
        const sortedPrevious = allPreviousSessions.sort(
          (a, b) =>
            new Date(b.workoutDate).getTime() - new Date(a.workoutDate).getTime()
        );
        
        // 가장 최근 이전 기록
        const previous = sortedPrevious[0];
        if (previous.sets && previous.sets.length > 0) {
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
      }

      const canonicalExerciseId = resolveExerciseIdentifier(latest);

      // 전체 기록 수 계산 (오늘 포함)
      const allSessionsForExercise = completedWorkoutHistory.filter(
        (s) => s.exerciseName === name
      );
      const totalRecordCount = allSessionsForExercise.length;

      recentExercises.push({
        id: makeExerciseKey(latest.sessionId, canonicalExerciseId || name),
        name,
        change: Math.abs(change),
        changeType,
        rm: oneRM,
        recordCount: totalRecordCount, // 전체 기록 수 (오늘 포함)
        exerciseId: canonicalExerciseId,
        imageUrl:
          latest.imageUrl ||
          latest.exerciseImageUrl ||
          latest.image ||
          latest.imgUrl ||
          latest.photoUrl ||
          "",
      });
    });

    // 운동 이름순으로 정렬 (오늘 완료한 운동이므로 날짜는 모두 같음)
    const result = recentExercises
      .sort((a, b) => {
        // 이름순 정렬 (가나다순)
        return a.name.localeCompare(b.name, "ko");
      });

    console.log("[ANALYSIS] exercises 계산 완료:", {
      resultCount: result.length,
      exerciseNames: result.map((e) => e.name),
    });

    return result;
  }, [completedWorkoutHistory, resolveExerciseIdentifier, makeExerciseKey]);

  const [exerciseImages, setExerciseImages] = useState<Record<string, string>>(
    {}
  );
  const [exerciseImagesByName, setExerciseImagesByName] = useState<
    Record<string, string>
  >({});
  const fetchedImageIdsRef = useRef<Set<string>>(new Set());
  const fetchedNameRef = useRef<Set<string>>(new Set());
  const failedImageIdsRef = useRef<Set<string>>(new Set());
  const [failedImageLookupTick, setFailedImageLookupTick] = useState(0);

  useEffect(() => {
    const missingIds = exercises
      .map((ex) => ({
        id: ex.exerciseId,
        name: ex.name,
        fallbackUrl: ex.imageUrl,
      }))
      .filter((item) => {
        if (!item.id) return false;
        if (exerciseImages[item.id]) return false;
        if (failedImageIdsRef.current.has(item.id)) return false;
        if (fetchedImageIdsRef.current.has(item.id)) return false;
        return true;
      });

    if (missingIds.length === 0) return;

    let cancelled = false;

    const trackFailure = (id?: string) => {
      if (!id) return;
      if (failedImageIdsRef.current.has(id)) return;
      failedImageIdsRef.current.add(id);
      setFailedImageLookupTick((tick) => tick + 1);
    };

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
          } else if (!cancelled) {
            trackFailure(id);
          }
        } catch (error) {
          if (__DEV__) {
            console.warn("[ANALYSIS] 운동 이미지 불러오기 실패:", {
              id,
              message: (error as Error)?.message,
            });
          }
          if (!cancelled) {
            trackFailure(id);
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
          ex.name &&
          !ex.imageUrl &&
          !exerciseImagesByName[ex.name.toLowerCase()] &&
          !fetchedNameRef.current.has(ex.name.toLowerCase()) &&
          (!ex.exerciseId ||
            failedImageIdsRef.current.has(String(ex.exerciseId)))
      )
      .map((ex) => ({
        rawName: ex.name as string,
        keywords: generateSearchKeywords(ex.name),
      }));

    if (missingByName.length === 0) return;

    let cancelled = false;

    const loadByName = async () => {
      for (const { rawName, keywords } of missingByName) {
        const baseKey = rawName.toLowerCase();
        fetchedNameRef.current.add(baseKey);
        const keywordList =
          keywords && keywords.length > 0 ? keywords : [rawName];
        let resolved = false;

        for (const keyword of keywordList) {
          const keywordKey = keyword.toLowerCase();
          try {
            const response = await fetchExercises({
              keyword,
              size: 1,
              page: 0,
            });
            const first = response?.content?.[0];
            const url =
              first?.imageUrl ||
              first?.image ||
              first?.imgUrl ||
              first?.photoUrl;
            if (url && !cancelled) {
              setExerciseImagesByName((prev) => {
                const next = { ...prev };
                next[baseKey] = url;
                keywordList.forEach((kw) => {
                  const kwKey = kw.toLowerCase();
                  next[kwKey] = url;
                });
                return next;
              });
              resolved = true;
              break;
            }
          } catch (error) {
            if (__DEV__) {
              console.warn("[ANALYSIS] 운동 이미지 검색 실패:", {
                name: rawName,
                keyword,
                message: (error as Error)?.message,
              });
            }
          }
        }

        if (!resolved && __DEV__) {
          console.warn("[ANALYSIS] 운동 이미지 검색 실패 - 모든 키워드 시도", {
            name: rawName,
            keywords: keywordList,
          });
        }
      }
    };

    loadByName();

    return () => {
      cancelled = true;
    };
  }, [
    exercises,
    exerciseImagesByName,
    failedImageLookupTick,
    generateSearchKeywords,
  ]);

  // 운동 기록 조회
  const loadLocalCompletions = useCallback(async () => {
    if (!userIdLoaded) return;
    try {
      const raw = await AsyncStorage.getItem(getActivityStorageKey());
      if (!raw) {
        setLocalSessionCompletion({});
        setLocalCompletionByNameDate({});
        return;
      }
      const parsed = JSON.parse(raw);
      if (!Array.isArray(parsed)) {
        setLocalSessionCompletion({});
        setLocalCompletionByNameDate({});
        return;
      }
      const sessionMap: Record<string, boolean> = {};
      const nameDateMap: Record<string, boolean> = {};

      parsed.forEach((activity: any) => {
        const completedValue =
          interpretCompletion(activity?.isCompleted) ??
          (Array.isArray(activity?.sets) && activity.sets.length > 0
            ? activity.sets.every(
                (set: any) => interpretCompletion(set?.completed) === true
              )
            : false);

        const sessionKey =
          activity?.sessionId !== undefined && activity?.sessionId !== null
            ? String(activity.sessionId)
            : null;
        if (sessionKey && completedValue) {
          sessionMap[sessionKey] = true;
        }

        if (activity?.name && activity?.date) {
          const nameKey = `${String(activity.name)
            .trim()
            .toLowerCase()}|${String(activity.date).trim()}`;
          if (completedValue) {
            nameDateMap[nameKey] = true;
          }
        }
      });

      setLocalSessionCompletion(sessionMap);
      setLocalCompletionByNameDate(nameDateMap);
    } catch (error) {
      if (__DEV__) {
        console.warn("[ANALYSIS] 로컬 완료 정보 로드 실패:", {
          message: (error as Error)?.message,
        });
      }
      setLocalSessionCompletion({});
      setLocalCompletionByNameDate({});
    }
  }, [getActivityStorageKey, interpretCompletion, userIdLoaded]);

  const loadWorkoutHistory = useCallback(async () => {
    console.log("[ANALYSIS] loadWorkoutHistory 호출:", {
      userIdLoaded,
      userId,
    });
    if (!userIdLoaded) {
      console.log("[ANALYSIS] userIdLoaded가 false, 리턴");
      return;
    }
    if (!userId) {
      if (__DEV__) {
        console.warn("[ANALYSIS] userId가 없습니다.");
      }
      setWorkoutHistory([]);
      return;
    }
    try {
      console.log("[ANALYSIS] 운동 기록 조회 시작 (오늘 날짜만)");
      setLoading(true);
      // 먼저 빈 배열로 초기화하여 이전 데이터가 표시되지 않도록 함
      setWorkoutHistory([]);

      // userId는 문자열일 수 있으므로 숫자로 변환 시도, 실패하면 그대로 사용
      let userIdNum: number | string = userId;
      if (typeof userId === "string") {
        const parsed = parseInt(userId, 10);
        userIdNum = isNaN(parsed) ? userId : parsed;
      }

      const allWorkouts: WorkoutSession[] = [];
      const today = new Date();
      const todayStr = `${today.getFullYear()}-${String(
        today.getMonth() + 1
      ).padStart(2, "0")}-${String(today.getDate()).padStart(2, "0")}`;

      console.log(`[ANALYSIS] ${todayStr} 운동 기록 조회 중...`);
      const savedGroups = await fetchSavedWorkouts(userIdNum, todayStr);
      console.log(
        `[ANALYSIS] ${todayStr} 조회 결과:`,
        savedGroups.length,
        "개 그룹"
      );

      // SavedWorkoutGroup[]을 WorkoutSession[]로 변환
      // 같은 sessionId와 exerciseName을 가진 레코드들을 하나의 WorkoutSession으로 합침
      savedGroups.forEach((group) => {
        if (!group.sessions || group.sessions.length === 0) return;

        group.sessions.forEach((session) => {
          if (!session.records || session.records.length === 0) return;

          // records를 exerciseName별로 그룹화
          const exerciseMap = new Map<string, SavedWorkoutRecord[]>();
          session.records.forEach((record) => {
            const key = record.exerciseName || "unknown";
            if (!exerciseMap.has(key)) {
              exerciseMap.set(key, []);
            }
            exerciseMap.get(key)!.push(record);
          });

          // 각 운동별로 WorkoutSession 생성
          exerciseMap.forEach((records, exerciseName) => {
            const firstRecord = records[0];
            allWorkouts.push({
              sessionId: session.sessionId,
              exerciseName: exerciseName,
              category: firstRecord.category || "",
              workoutDate: firstRecord.workoutDate,
              sets: records
                .sort((a, b) => a.setNumber - b.setNumber)
                .map((record) => ({
                  setNumber: record.setNumber,
                  weight: record.weight,
                  reps: record.reps,
                  completed: true, // 저장된 운동은 완료된 것으로 표시
                  isCompleted: true,
                })),
              userId: userIdNum,
              exerciseId: undefined,
              // @ts-ignore - 저장된 운동은 완료된 것으로 표시
              isCompleted: true,
              // @ts-ignore
              completed: true,
            });
          });
        });
      });

      console.log("[ANALYSIS] 운동 기록 로드 완료 (오늘):", {
        count: allWorkouts.length,
        sample: allWorkouts.slice(0, 2).map((w) => ({
          exerciseName: w.exerciseName,
          setsCount: w.sets?.length || 0,
          workoutDate: w.workoutDate,
        })),
      });

      // 서버에서 가져온 데이터로 업데이트 (빈 배열이어도 명시적으로 설정)
      setWorkoutHistory(allWorkouts);

      // 운동 기록이 없으면 로컬 완료 정보도 초기화하여 삭제된 운동이 표시되지 않도록 함
      if (allWorkouts.length === 0) {
        setLocalSessionCompletion({});
        setLocalCompletionByNameDate({});
        if (__DEV__) {
          console.log("[ANALYSIS] 운동 기록 없음, 로컬 완료 정보 초기화");
        }
      } else {
        // 운동 기록이 있으면 상세 로그 출력
        if (__DEV__) {
          console.log(
            `[ANALYSIS] workoutHistory 업데이트: ${allWorkouts.length}개 세션`
          );
          console.log("[ANALYSIS] 운동 기록 상세:", {
            dates: [
              ...new Set(allWorkouts.map((w) => w.workoutDate?.slice(0, 10))),
            ],
            exerciseNames: [...new Set(allWorkouts.map((w) => w.exerciseName))],
            sessionsWithSets: allWorkouts.filter(
              (w) => w.sets && w.sets.length > 0
            ).length,
          });
        }
      }
    } catch (error: any) {
      const status = error?.response?.status;
      // 404나 데이터 없음은 정상 (에러 표시 안 함)
      if (status === 404 || status === 400) {
        if (__DEV__) {
          console.log("[ANALYSIS] 운동 기록 없음 (정상)");
        }
        setWorkoutHistory([]);
      } else {
        // 실제 서버 오류나 네트워크 오류만 로그
        console.error(
          "[ANALYSIS] 운동 기록 조회 실패:",
          error?.response?.status,
          error?.response?.data?.message || error?.message
        );
        setWorkoutHistory([]);
      }
    } finally {
      setLoading(false);
    }
  }, [userId, userIdLoaded]);

  useEffect(() => {
    const unsubscribe = eventBus.on(
      "workoutSessionDeleted",
      ({ sessionId, exerciseName, workoutDate }) => {
        const targetId =
          sessionId !== undefined && sessionId !== null
            ? String(sessionId)
            : null;
        const targetName = exerciseName
          ? exerciseName.trim().toLowerCase()
          : null;
        const targetDate = workoutDate ? workoutDate.trim() : null;

        setWorkoutHistory((prev) =>
          prev.filter((session) => {
            const currentId =
              session.sessionId !== undefined && session.sessionId !== null
                ? String(session.sessionId)
                : null;
            if (targetId && currentId === targetId) {
              return false;
            }
            if (targetName) {
              const sessionName = (session.exerciseName || "")
                .trim()
                .toLowerCase();
              if (sessionName === targetName) {
                if (!targetDate) {
                  return false;
                }
                const sessionDateStr = session.workoutDate
                  ? session.workoutDate.slice(0, 10)
                  : null;
                if (sessionDateStr === targetDate) {
                  return false;
                }
              }
            }
            return true;
          })
        );

        loadWorkoutHistory();
        (async () => {
          await loadLocalCompletions();
        })();
      }
    );

    return () => {
      unsubscribe?.();
    };
  }, [loadWorkoutHistory, loadLocalCompletions]);

  const loadMealComparison = useCallback(async () => {
    console.log("[ANALYSIS] loadMealComparison 호출 시작");
    try {
      setMealLoading(true);
      setMealError(null);

      // AI 서버는 문자열 userId (sub)를 사용해야 함
      let aiUserId: string | null = null;
      const token = await AsyncStorage.getItem(ACCESS_TOKEN_KEY);
      if (token) {
        try {
          const base64Url = token.split(".")[1];
          const base64 = base64Url.replace(/-/g, "+").replace(/_/g, "/");
          const jsonPayload = decodeURIComponent(
            atob(base64)
              .split("")
              .map((c) => "%" + ("00" + c.charCodeAt(0).toString(16)).slice(-2))
              .join("")
          );
          const payload = JSON.parse(jsonPayload);
          // sub 필드가 있으면 사용 (문자열 userId, 예: "ams4251234")
          if (payload.sub) {
            aiUserId = String(payload.sub);
          }
        } catch (e) {
          console.error("[ANALYSIS] JWT 디코딩 실패:", e);
        }
      }

      if (!aiUserId) {
        if (__DEV__) {
          console.log("[ANALYSIS] 식단 비교: AI userId 없음");
        }
        setMealComparison(null);
        setMealError(null);
        return;
      }

      // 새로운 API: /analytics/custom/weekly/{user_id}?weeks=2
      // 이번 주와 저번 주 비교를 위해 2주치 데이터 요청
      const endpoint = `/analytics/custom/weekly/${aiUserId}?weeks=2`;

      console.log("[ANALYSIS] 식단 비교 API 요청:", {
        url: `${AI_API_BASE_URL}${endpoint}`,
        method: "GET",
        aiUserId,
        endpoint,
      });

      // requestAI는 직접 데이터를 반환 (response.data가 아님)
      const responseData = await requestAI<any>(endpoint, {
        method: "GET",
      });
      console.log(
        "[ANALYSIS] 식단 비교 API 응답 전체:",
        JSON.stringify(responseData, null, 2)
      );
      console.log("[ANALYSIS] 식단 비교 API 응답 상세:", {
        dataType: typeof responseData,
        isArray: Array.isArray(responseData),
        arrayLength: Array.isArray(responseData) ? responseData.length : null,
        isObject: responseData && typeof responseData === "object",
        dataKeys: responseData && typeof responseData === "object" ? Object.keys(responseData) : null,
      });

      // 응답 구조 확인: { user_id, weeks_requested, weekly_summary: [...] }
      const weeklySummary = responseData?.weekly_summary;
      
      if (!Array.isArray(weeklySummary)) {
        console.log("[ANALYSIS] 식단 비교: weekly_summary가 배열이 아님", {
          responseData,
          hasWeeklySummary: !!weeklySummary,
          weeklySummaryType: typeof weeklySummary,
        });
        setMealComparison(null);
        setMealError(null);
        return;
      }

      // 최소 2주치 데이터가 있어야 비교 가능
      if (weeklySummary.length < 2) {
        console.log("[ANALYSIS] 식단 비교 데이터 부족:", {
          receivedWeeks: weeklySummary.length,
          requiredWeeks: 2,
        });
        setMealComparison(null);
        setMealError(null);
        return;
      }

      // 첫 번째 요소가 이번 주 (가장 최근), 두 번째 요소가 저번 주
      const thisWeek = weeklySummary[0];
      const lastWeek = weeklySummary[1];

      console.log("[ANALYSIS] 이번 주 데이터:", {
        week: thisWeek,
        keys: thisWeek ? Object.keys(thisWeek) : null,
      });
      console.log("[ANALYSIS] 저번 주 데이터:", {
        week: lastWeek,
        keys: lastWeek ? Object.keys(lastWeek) : null,
      });

      // 영양성분 추출: nutrition_avg 객체에서 kcal, protein, fat, carb 필드 사용
      const thisWeekNutrition = thisWeek?.nutrition_avg || {};
      const lastWeekNutrition = lastWeek?.nutrition_avg || {};
      
      const thisWeekCalories = thisWeekNutrition?.kcal || 0;
      const lastWeekCalories = lastWeekNutrition?.kcal || 0;
      
      const thisWeekCarbs = thisWeekNutrition?.carb || 0;
      const lastWeekCarbs = lastWeekNutrition?.carb || 0;
      
      const thisWeekProtein = thisWeekNutrition?.protein || 0;
      const lastWeekProtein = lastWeekNutrition?.protein || 0;
      
      const thisWeekFat = thisWeekNutrition?.fat || 0;
      const lastWeekFat = lastWeekNutrition?.fat || 0;

      // 날짜 정보 추출
      const thisWeekStart = thisWeek?.week_start || "";
      const thisWeekEnd = thisWeek?.week_end || "";

      // 변화량 계산
      const caloriesDifference = thisWeekCalories - lastWeekCalories;
      const caloriesChangeRate = lastWeekCalories > 0 
        ? ((caloriesDifference / lastWeekCalories) * 100) 
        : (thisWeekCalories > 0 ? 100 : 0);

      const carbsChangeRate = lastWeekCarbs > 0
        ? (((thisWeekCarbs - lastWeekCarbs) / lastWeekCarbs) * 100)
        : (thisWeekCarbs > 0 ? 100 : 0);

      const proteinChangeRate = lastWeekProtein > 0
        ? (((thisWeekProtein - lastWeekProtein) / lastWeekProtein) * 100)
        : (thisWeekProtein > 0 ? 100 : 0);

      const fatChangeRate = lastWeekFat > 0
        ? (((thisWeekFat - lastWeekFat) / lastWeekFat) * 100)
        : (thisWeekFat > 0 ? 100 : 0);

      // 매크로 비율 계산
      const thisWeekTotalMacro = thisWeekCarbs + thisWeekProtein + thisWeekFat;
      const lastWeekTotalMacro = lastWeekCarbs + lastWeekProtein + lastWeekFat;

      const thisWeekMacroRatio: MacroRatio = {
        carbs: thisWeekTotalMacro > 0 ? (thisWeekCarbs / thisWeekTotalMacro) * 100 : null,
        protein: thisWeekTotalMacro > 0 ? (thisWeekProtein / thisWeekTotalMacro) * 100 : null,
        fat: thisWeekTotalMacro > 0 ? (thisWeekFat / thisWeekTotalMacro) * 100 : null,
      };

      const lastWeekMacroRatio: MacroRatio = {
        carbs: lastWeekTotalMacro > 0 ? (lastWeekCarbs / lastWeekTotalMacro) * 100 : null,
        protein: lastWeekTotalMacro > 0 ? (lastWeekProtein / lastWeekTotalMacro) * 100 : null,
        fat: lastWeekTotalMacro > 0 ? (lastWeekFat / lastWeekTotalMacro) * 100 : null,
      };

      // MealComparison 객체 생성
      const mealComparison: MealComparison = {
        thisWeekStart,
        thisWeekEnd,
        thisWeekCalories,
        lastWeekCalories,
        caloriesDifference,
        caloriesChangeRate,
        carbsChangeRate,
        proteinChangeRate,
        fatChangeRate,
        thisWeekMacroRatio,
        lastWeekMacroRatio,
      };

      console.log("[ANALYSIS] 식단 비교 데이터 생성 완료:", {
        thisWeekCalories,
        lastWeekCalories,
        caloriesDifference,
        caloriesChangeRate: `${caloriesChangeRate.toFixed(1)}%`,
        carbsChangeRate: `${carbsChangeRate.toFixed(1)}%`,
        proteinChangeRate: `${proteinChangeRate.toFixed(1)}%`,
        fatChangeRate: `${fatChangeRate.toFixed(1)}%`,
      });

      setMealComparison(mealComparison);
    } catch (error: any) {
      // requestAI는 error.status와 error.data를 직접 제공
      const status = error?.status || error?.response?.status;
      const errorData = error?.data || error?.response?.data;

      // aiUserId는 try 블록 밖에서도 접근 가능하도록 상위 스코프에서 가져오기
      let aiUserIdForError: string | null = null;
      try {
        const token = await AsyncStorage.getItem(ACCESS_TOKEN_KEY);
        if (token) {
          const base64Url = token.split(".")[1];
          const base64 = base64Url.replace(/-/g, "+").replace(/_/g, "/");
          const jsonPayload = decodeURIComponent(
            atob(base64)
              .split("")
              .map((c) => "%" + ("00" + c.charCodeAt(0).toString(16)).slice(-2))
              .join("")
          );
          const payload = JSON.parse(jsonPayload);
          if (payload.sub) {
            aiUserIdForError = String(payload.sub);
          }
        }
      } catch (e) {
        // 무시
      }

      console.error("[ANALYSIS] 식단 비교 API 에러:", {
        status,
        statusText: error?.statusText || error?.response?.statusText,
        url: `${AI_API_BASE_URL}/analytics/custom/weekly/${aiUserIdForError || "unknown"}?weeks=2`,
        errorData,
        errorMessage: error?.message,
        fullError: JSON.stringify(errorData, null, 2),
      });

      // 404나 데이터 없음은 정상 (에러 표시 안 함)
      if (status === 404 || status === 400) {
        if (__DEV__) {
          console.log("[ANALYSIS] 식단 비교 데이터 없음 (정상)", {
            detail: errorData?.detail,
            message: errorData?.message,
          });
        }
        setMealComparison(null);
        setMealError(null);
      } else if (status === 401 || status === 403) {
        // 인증/권한 오류는 표시
        setMealComparison(null);
        setMealError("로그인이 필요합니다.");
      } else if (status >= 500) {
        // 서버 내부 오류는 로그만 (사용자에게는 표시 안 함)
        console.error(
          "[ANALYSIS] 식단 비교 조회 실패 (서버 오류):",
          errorData?.message || error?.message
        );
        setMealComparison(null);
        setMealError(null);
      } else {
        // 기타 에러는 로그만
        console.error(
          "[ANALYSIS] 식단 비교 조회 실패:",
          errorData?.message || error?.message
        );
        setMealComparison(null);
        setMealError(null);
      }
    } finally {
      console.log("[ANALYSIS] loadMealComparison 완료, mealLoading false로 설정");
      setMealLoading(false);
    }
  }, []);

  const loadUserId = useCallback(async () => {
    try {
      // AsyncStorage에서 숫자 userId 가져오기 (운동 API는 숫자 userId 필요)
      const storedUserId = await AsyncStorage.getItem("userId");
      if (storedUserId) {
        // 숫자로 변환 가능하면 숫자로, 아니면 문자열로
        const userIdNum = parseInt(storedUserId, 10);
        if (!isNaN(userIdNum)) {
          setUserId(String(userIdNum));
          setUserIdLoaded(true);
          return;
        }
        setUserId(storedUserId);
        setUserIdLoaded(true);
        return;
      }

      // AsyncStorage에 없으면 JWT에서 userPk 추출 (숫자)
      const token = await AsyncStorage.getItem(ACCESS_TOKEN_KEY);
      if (token) {
        try {
          const base64Url = token.split(".")[1];
          const base64 = base64Url.replace(/-/g, "+").replace(/_/g, "/");
          const jsonPayload = decodeURIComponent(
            atob(base64)
              .split("")
              .map((c) => "%" + ("00" + c.charCodeAt(0).toString(16)).slice(-2))
              .join("")
          );
          const payload = JSON.parse(jsonPayload);

          // userPk 필드가 있으면 우선 사용 (숫자 userId)
          if (payload.userPk) {
            setUserId(String(payload.userPk));
            setUserIdLoaded(true);
            return;
          }

          // sub 필드가 있으면 사용 (문자열 userId)
          if (payload.sub) {
            setUserId(String(payload.sub));
            setUserIdLoaded(true);
            return;
          }
        } catch (e) {
          console.error("[ANALYSIS] JWT 디코딩 실패:", e);
        }
      }

      setUserId(null);
    } finally {
      setUserIdLoaded(true);
    }
  }, []);

  // 식단 주간 그래프 로드 (초고속 렌더링)
  const loadNutritionWeeklyGraph = useCallback(async (weeks: number = 4) => {
    try {
      // 1) aiUserId 구하기
      let aiUserId: string | null = null;
      const token = await AsyncStorage.getItem(ACCESS_TOKEN_KEY);
      if (token) {
        try {
          const base64Url = token.split(".")[1];
          const base64 = base64Url.replace(/-/g, "+").replace(/_/g, "/");
          const jsonPayload = decodeURIComponent(
            atob(base64)
              .split("")
              .map((c) => "%" + ("00" + c.charCodeAt(0).toString(16)).slice(-2))
              .join("")
          );
          const payload = JSON.parse(jsonPayload);
          if (payload.sub) {
            aiUserId = String(payload.sub);
          }
        } catch (e) {
          console.error("[ANALYSIS] JWT 디코딩 실패:", e);
        }
      }

      if (!aiUserId) {
        const storedUserId = await AsyncStorage.getItem("userId");
        if (storedUserId) {
          aiUserId = storedUserId;
        } else {
          console.warn("[ANALYSIS] 식단 그래프: aiUserId를 찾을 수 없음");
          return;
        }
      }

      // 2) 캐시 확인 (초고속 로딩)
      const cacheKey = `nutrition_graph_${aiUserId}_${weeks}`;
      const cachedUrl = await AsyncStorage.getItem(cacheKey);
      if (cachedUrl) {
        const cached = JSON.parse(cachedUrl);
        const cacheTime = cached.timestamp || 0;
        const now = Date.now();
        // 캐시 유효기간: 1시간
        if (now - cacheTime < 60 * 60 * 1000 && cached.url) {
          // 캐시된 URL 즉시 사용 (로딩 상태 없이)
          setNutritionGraphUrl(cached.url);
          return;
        }
      }

      // 3) API URL 생성 (image/png 반환) - 즉시 설정하여 빠른 렌더링
      const url = `${AI_API_BASE_URL}/analytics/custom/weekly-graph/nutrition/${aiUserId}?weeks=${weeks}&_ts=${Date.now()}`;
      
      // URL 즉시 설정 (로딩 상태 없이 바로 표시 시작)
      setNutritionGraphUrl(url);
      
      // 캐시 저장 (백그라운드)
      AsyncStorage.setItem(
        cacheKey,
        JSON.stringify({
          url: url,
          timestamp: Date.now(),
        })
      ).catch(() => {}); // 캐시 실패는 무시
      
    } catch (error: any) {
      console.error("[ANALYSIS] 식단 주간 그래프 로드 실패:", {
        message: error?.message,
        status: error?.response?.status,
      });
    }
  }, []);

  // 운동 주간 그래프 로드 (초고속 렌더링)
  const loadExerciseWeeklyGraph = useCallback(async (weeks: number = 4) => {
    try {
      // 1) aiUserId 구하기
      let aiUserId: string | null = null;
      const token = await AsyncStorage.getItem(ACCESS_TOKEN_KEY);
      if (token) {
        try {
          const base64Url = token.split(".")[1];
          const base64 = base64Url.replace(/-/g, "+").replace(/_/g, "/");
          const jsonPayload = decodeURIComponent(
            atob(base64)
              .split("")
              .map((c) => "%" + ("00" + c.charCodeAt(0).toString(16)).slice(-2))
              .join("")
          );
          const payload = JSON.parse(jsonPayload);
          if (payload.sub) {
            aiUserId = String(payload.sub);
          }
        } catch (e) {
          console.error("[ANALYSIS] JWT 디코딩 실패:", e);
        }
      }

      if (!aiUserId) {
        const storedUserId = await AsyncStorage.getItem("userId");
        if (storedUserId) {
          aiUserId = storedUserId;
        } else {
          console.warn("[ANALYSIS] 운동 그래프: aiUserId를 찾을 수 없음");
          return;
        }
      }

      // 2) 캐시 확인 (초고속 로딩)
      const cacheKey = `exercise_graph_${aiUserId}_${weeks}`;
      const cachedUrl = await AsyncStorage.getItem(cacheKey);
      if (cachedUrl) {
        const cached = JSON.parse(cachedUrl);
        const cacheTime = cached.timestamp || 0;
        const now = Date.now();
        // 캐시 유효기간: 1시간
        if (now - cacheTime < 60 * 60 * 1000 && cached.url) {
          // 캐시된 URL 즉시 사용 (로딩 상태 없이)
          setExerciseGraphUrl(cached.url);
          return;
        }
      }

      // 3) API URL 생성 (image/png 반환) - 즉시 설정하여 빠른 렌더링
      const url = `${AI_API_BASE_URL}/analytics/custom/weekly-graph/exercise/${aiUserId}?weeks=${weeks}&_ts=${Date.now()}`;
      
      // URL 즉시 설정 (로딩 상태 없이 바로 표시 시작)
      setExerciseGraphUrl(url);
      
      // 캐시 저장 (백그라운드)
      AsyncStorage.setItem(
        cacheKey,
        JSON.stringify({
          url: url,
          timestamp: Date.now(),
        })
      ).catch(() => {}); // 캐시 실패는 무시
      
    } catch (error: any) {
      console.error("[ANALYSIS] 운동 주간 그래프 로드 실패:", {
        message: error?.message,
        status: error?.response?.status,
      });
    }
  }, []);

  // 🔥 테스트용: 파이프라인 체크를 위한 dummy base64 이미지 강제 세팅
  // 이 useEffect를 활성화하면 렌더/스타일 문제인지 변환 문제인지 바로 확인 가능
  // 테스트 후 주석 처리하거나 삭제하세요
  /*
  useEffect(() => {
    // 작은 10x10 PNG 이미지 (진짜 유효한 base64)
    const testImageBase64 =
      "data:image/png;base64,iVBORw0KGgoAAAANSUhEUgAAAAoAAAAKCAYAAACNMs+9AAAAFElEQVQYV2NkQAP/Gf4zBhgYGP4HAJmIA/2YtLnbAAAAAElFTkSuQmCC";
    console.log("🔥 [TEST] 테스트 이미지로 운동 그래프 강제 세팅");
    setExerciseWeeklyGraph(testImageBase64);
    setExerciseGraphLoading(false);
  }, []);
  */

  const loadUserName = useCallback(async () => {
    let cachedName: string | null = null;
    try {
      cachedName = await AsyncStorage.getItem("userName");
      if (cachedName) {
        setUserName(cachedName);
      }
    } catch (error) {
      if (__DEV__) {
        console.warn("[ANALYSIS] 사용자 이름 캐시 로드 실패:", {
          message: (error as Error)?.message,
        });
      }
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
      console.error(
        "[ANALYSIS] 사용자 이름 갱신 실패:",
        (error as Error)?.message
      );
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
    } catch (error: any) {
      const status = error?.response?.status;
      if (status === 400) {
        if (__DEV__) {
          console.log("[ANALYSIS] 최신 인바디 데이터 없음 (400 응답)", status);
        }
      } else {
        console.error(
          "[ANALYSIS] 최신 인바디 조회 실패:",
          (error as Error)?.message
        );
      }
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
      console.error(
        "[ANALYSIS] 수기 인바디 날짜 조회 실패:",
        (error as Error)?.message
      );
    }

    setLatestInBodyDate(null);
  }, [userId, userIdLoaded]);

  // userId가 로드된 후 그래프 로드 (숫자가 입력된 경우에만)
  useEffect(() => {
    if (userIdLoaded && userId) {
      // 숫자가 입력되어 있을 때만 그래프 로드
      if (nutritionWeeks && nutritionWeeks.trim() !== "") {
        const nutritionWeeksNum = parseInt(nutritionWeeks, 10);
        if (nutritionWeeksNum >= 1 && nutritionWeeksNum <= 52) {
          loadNutritionWeeklyGraph(nutritionWeeksNum);
        }
      }
      if (exerciseWeeks && exerciseWeeks.trim() !== "") {
        const exerciseWeeksNum = parseInt(exerciseWeeks, 10);
        if (exerciseWeeksNum >= 1 && exerciseWeeksNum <= 52) {
          loadExerciseWeeklyGraph(exerciseWeeksNum);
        }
      }
    }
  }, [userIdLoaded, userId, nutritionWeeks, exerciseWeeks, loadNutritionWeeklyGraph, loadExerciseWeeklyGraph]);

  const loadHealthScore = useCallback(async () => {
    try {
      setHealthScoreLoading(true);

      const dailyTrend = await healthScoreAPI.getDailyTrend();

      if (dailyTrend.length > 0) {
        const latestScore = dailyTrend[dailyTrend.length - 1].score;
        setHealthScore(latestScore);
        setHealthScoreTrend(dailyTrend);
      } else {
        setHealthScore(0);
        setHealthScoreTrend([]);
      }
    } catch (error) {
      console.error("[ANALYSIS] 건강점수 로드 실패:", error);
      setHealthScore(0);
      setHealthScoreTrend([]);
    } finally {
      setHealthScoreLoading(false);
    }
  }, []);

  useEffect(() => {
    loadUserId();
  }, [loadUserId]);

  useEffect(() => {
    if (userIdLoaded) {
      loadLocalCompletions();
    }
  }, [userIdLoaded, loadLocalCompletions]);

  // 화면 포커스 시 운동 기록 새로고침
  useFocusEffect(
    useCallback(() => {
      // 다른 데이터는 순차적으로 로드
      loadWorkoutHistory();
      console.log("[ANALYSIS] useFocusEffect에서 loadMealComparison 호출");
      loadMealComparison();
      loadUserName();
      loadLatestInBodyDate();
      loadLocalCompletions();

      // 그래프는 userId useEffect에서만 로드 (중복 방지)

      loadHealthScore();
    }, [
      loadWorkoutHistory,
      loadMealComparison,
      loadLatestInBodyDate,
      loadUserName,
      loadLocalCompletions,
      loadHealthScore,
      userId,
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

  const handleInBodyClick = async () => {
    const membershipType = await getMembershipType();
    if (membershipType === "PREMIUM") {
      navigation.navigate("InBody");
    } else {
      setIsPremiumModalOpen(true);
    }
  };

  const handleHealthScoreClick = async () => {
    const membershipType = await getMembershipType();
    if (membershipType === "PREMIUM") {
      navigation.navigate("HealthScoreTrend");
    } else {
      setIsPremiumModalOpen(true);
    }
  };

  const handlePhotoClick = () => {
    setIsPhotoModalOpen(true);
  };

  const handleManualClick = () => {
    navigation.navigate("InBodyManual");
  };

  const mapDraftToManualDefaults = useCallback((draft: any) => {
    if (!draft || typeof draft !== "object") return undefined;

    const toStringValue = (value: any) => {
      if (value === null || value === undefined) return "";
      if (typeof value === "number") return String(value);
      if (typeof value === "string") return value;
      return "";
    };

    const normalizeDate = (value?: string | null) => {
      if (!value) return new Date().toISOString().slice(0, 10);
      const digits = value.replace(/\D/g, "");
      if (digits.length >= 8) {
        return `${digits.slice(0, 4)}-${digits.slice(4, 6)}-${digits.slice(
          6,
          8
        )}`;
      }
      return value.includes(".") ? value.replace(/\./g, "-") : value;
    };

    return {
      date: normalizeDate(draft.measurementDate),
      gender: toStringValue(draft.gender),
      age: toStringValue(draft.age),
      height: toStringValue(draft.height),
      weight: toStringValue(draft.weight),
      smm: toStringValue(draft.skeletalMuscleMass),
      muscleMass: toStringValue(draft.muscleMass),
      bfm: toStringValue(draft.bodyFatMass),
      pbf: toStringValue(draft.bodyFatPercentage),
      score: toStringValue(draft.score),
      vfa: toStringValue(draft.visceralFatLevel),
      bmr: toStringValue(draft.basalMetabolicRate),
      bmi: toStringValue(draft.bmi),
      rArm: toStringValue(draft.rightArmMuscle),
      lArm: toStringValue(draft.leftArmMuscle),
      trunk: toStringValue(draft.trunkMuscle),
      rLeg: toStringValue(draft.rightLegMuscle),
      lLeg: toStringValue(draft.leftLegMuscle),
      rArmFat: toStringValue(draft.rightArmFat),
      lArmFat: toStringValue(draft.leftArmFat),
      trunkFat: toStringValue(draft.trunkFat),
      rLegFat: toStringValue(draft.rightLegFat),
      lLegFat: toStringValue(draft.leftLegFat),
      tbw: toStringValue(draft.totalBodyWater),
      protein: toStringValue(draft.protein),
      mineral: toStringValue(draft.mineral),
      pbfStd: toStringValue(draft.bodyFatPercentageStandard),
      obesityDegree: toStringValue(draft.obesityDegree),
      ecw: toStringValue(draft.ecw),
      wtCtrl: toStringValue(draft.weightControl),
      fatCtrl: toStringValue(draft.fatControl),
      musCtrl: toStringValue(draft.muscleControl),
    };
  }, []);

  const handlePhotoSave = async (data: any) => {
    console.log("[ANALYSIS][INBODY] handlePhotoSave 호출됨");
    console.log("[ANALYSIS][INBODY] 받은 데이터:", {
      success: data?.success,
      message: data?.message,
      imageUrl: data?.imageUrl,
      hasDraftData: !!data?.draftData,
      hasFile: !!data?.file,
      fileInfo: data?.file
        ? {
            uri: data.file.uri,
            fileName: data.file.fileName,
            fileSize: data.file.fileSize,
            type: data.file.type,
          }
        : null,
    });

    if (data?.draftData) {
      console.log(
        "[ANALYSIS][INBODY] 추출된 인바디 초안 데이터:",
        JSON.stringify(data.draftData, null, 2)
      );

      const defaults = mapDraftToManualDefaults(data.draftData);
      if (defaults) {
        navigation.navigate("InBodyManual", { defaultValues: defaults });
      }
    }

    if (data?.imageUrl) {
      console.log("[ANALYSIS][INBODY] 업로드된 이미지 URL:", data.imageUrl);
    }
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

        {/* 건강점수 섹션 */}
        <TouchableOpacity
          style={styles.healthScoreSection}
          onPress={handleHealthScoreClick}
          activeOpacity={0.7}
        >
          <View style={styles.healthScoreContent}>
            {healthScoreLoading ? (
              <View style={styles.healthScoreLoading}>
                <ActivityIndicator size="small" color="#E3FF7C" />
              </View>
            ) : (
              <HealthScoreCircle score={healthScore} size={100} />
            )}
            <View style={styles.healthScoreTextArea}>
              <Text style={styles.healthScoreLabel}>
                {userName || "회원"}님의
              </Text>
              <Text style={styles.healthScoreTitle}>건강점수</Text>
              {healthScore > 0 ? (
                <View style={styles.healthScoreBadge}>
                  <Icon name="trophy" size={14} color="#E3FF7C" />
                  <Text style={styles.healthScoreBadgeText}>
                    {healthScore >= 90
                      ? "상위 10%"
                      : healthScore >= 80
                      ? "상위 20%"
                      : "평균"}
                  </Text>
                </View>
              ) : (
                <Text style={styles.healthScoreNoData}>데이터 없음</Text>
              )}
            </View>
          </View>
          <View style={styles.healthScoreFooter}>
            <Text style={styles.healthScoreHint}>
              {healthScoreTrend.length > 0
                ? "터치하여 상세 그래프 보기"
                : "꾸준한 기록으로 건강점수를 높여보세요!"}
            </Text>
            <Icon name="chevron-forward" size={16} color="#666" />
          </View>
        </TouchableOpacity>

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
            <Text style={styles.analysisBtnText}>인바디 정보</Text>
          </TouchableOpacity>
        </View>

        {/* 운동 분석 섹션 */}
        <View style={styles.exerciseSection}>
          <Text style={styles.sectionTitle}>운동 분석</Text>
          <Text style={styles.exerciseSummary}>
            {`${displayName}의 최근 운동 중량 변화와 1RM을 확인해보세요.`}
          </Text>

          {/* 운동 주간 그래프 */}
          {exerciseWeeks && exerciseWeeks.trim() !== "" ? (
            <View style={styles.weeklyGraphContainer}>
              <View style={styles.graphHeader}>
                <Text style={styles.graphTitle}>주간 운동 분석</Text>
                <View style={styles.weeksInputContainer}>
                  <Text style={styles.weeksLabel}>주:</Text>
                  <TextInput
                    style={styles.weeksInput}
                    value={exerciseWeeks}
                    onChangeText={(text) => {
                      // 숫자만 입력 허용
                      const numericValue = text.replace(/[^0-9]/g, "");
                      if (numericValue === "" || (parseInt(numericValue, 10) >= 1 && parseInt(numericValue, 10) <= 52)) {
                        setExerciseWeeks(numericValue);
                        if (numericValue && userIdLoaded && userId) {
                          const weeks = parseInt(numericValue, 10) || 3;
                          loadExerciseWeeklyGraph(weeks);
                        } else if (!numericValue) {
                          // 입력이 비어있으면 그래프 URL 초기화
                          setExerciseGraphUrl(null);
                        }
                      }
                    }}
                    keyboardType="numeric"
                    placeholder="숫자를 입력해보세요"
                    placeholderTextColor="#666666"
                    maxLength={2}
                  />
                </View>
              </View>
              {exerciseGraphUrl ? (
                <View style={styles.graphImageWrapper}>
                  <Image
                    key={`exercise-graph-${exerciseGraphUrl}`}
                    source={{ uri: exerciseGraphUrl }}
                    style={styles.weeklyGraphImage}
                    resizeMode="contain"
                    accessibilityLabel="운동 주간 분석 그래프"
                    cache="force-cache"
                    onError={(e) => {
                      console.error("[ANALYSIS] 운동 그래프 이미지 로드 실패:", {
                        error: e.nativeEvent.error,
                        url: exerciseGraphUrl,
                      });
                    }}
                  />
                </View>
              ) : (
                <View style={styles.weeklyGraphPlaceholder}>
                  <ActivityIndicator size="small" color="#d6ff4b" />
                  <Text style={styles.graphPlaceholderText}>
                    그래프를 불러오는 중...
                  </Text>
                </View>
              )}
            </View>
          ) : (
            <View style={styles.weeksInputOnlyContainer}>
              <Text style={styles.weeksInputLabel}>주간 운동 분석</Text>
              <View style={styles.weeksInputRow}>
                <Text style={styles.weeksLabel}>주:</Text>
                <TextInput
                  style={styles.weeksInput}
                  value={exerciseWeeks}
                  onChangeText={(text) => {
                    // 숫자만 입력 허용
                    const numericValue = text.replace(/[^0-9]/g, "");
                    if (numericValue === "" || (parseInt(numericValue, 10) >= 1 && parseInt(numericValue, 10) <= 52)) {
                      setExerciseWeeks(numericValue);
                      if (numericValue && userIdLoaded && userId) {
                        const weeks = parseInt(numericValue, 10) || 3;
                        loadExerciseWeeklyGraph(weeks);
                      }
                    }
                  }}
                  keyboardType="numeric"
                  placeholder="숫자를 입력해보세요"
                  placeholderTextColor="#666666"
                  maxLength={2}
                />
              </View>
            </View>
          )}

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
                    <Text
                      style={styles.exerciseName}
                      numberOfLines={1}
                      ellipsizeMode="tail"
                    >
                      {exercise.name}
                    </Text>
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

          {/* 식단 주간 그래프 */}
          {nutritionWeeks && nutritionWeeks.trim() !== "" ? (
            <View style={styles.weeklyGraphContainer}>
              <View style={styles.graphHeader}>
                <Text style={styles.graphTitle}>주간 식단 분석</Text>
                <View style={styles.weeksInputContainer}>
                  <Text style={styles.weeksLabel}>주:</Text>
                  <TextInput
                    style={styles.weeksInput}
                    value={nutritionWeeks}
                    onChangeText={(text) => {
                      // 숫자만 입력 허용
                      const numericValue = text.replace(/[^0-9]/g, "");
                      if (numericValue === "" || (parseInt(numericValue, 10) >= 1 && parseInt(numericValue, 10) <= 52)) {
                        setNutritionWeeks(numericValue);
                        if (numericValue && userIdLoaded && userId) {
                          const weeks = parseInt(numericValue, 10) || 3;
                          loadNutritionWeeklyGraph(weeks);
                        } else if (!numericValue) {
                          // 입력이 비어있으면 그래프 URL 초기화
                          setNutritionGraphUrl(null);
                        }
                      }
                    }}
                    keyboardType="numeric"
                    placeholder="숫자를 입력해보세요"
                    placeholderTextColor="#666666"
                    maxLength={2}
                  />
                </View>
              </View>
              {nutritionGraphUrl ? (
                <View style={styles.graphImageWrapper}>
                  <Image
                    key={`nutrition-graph-${nutritionGraphUrl}`}
                    source={{ uri: nutritionGraphUrl }}
                    style={styles.weeklyGraphImage}
                    resizeMode="contain"
                    accessibilityLabel="식단 주간 분석 그래프"
                    cache="force-cache"
                    onError={(e) => {
                      console.error("[ANALYSIS] 식단 그래프 이미지 로드 실패:", {
                        error: e.nativeEvent.error,
                        url: nutritionGraphUrl,
                      });
                    }}
                  />
                </View>
              ) : (
                <View style={styles.weeklyGraphPlaceholder}>
                  <ActivityIndicator size="small" color="#d6ff4b" />
                  <Text style={styles.graphPlaceholderText}>
                    그래프를 불러오는 중...
                  </Text>
                </View>
              )}
            </View>
          ) : (
            <View style={styles.weeksInputOnlyContainer}>
              <Text style={styles.weeksInputLabel}>주간 식단 분석</Text>
              <View style={styles.weeksInputRow}>
                <Text style={styles.weeksLabel}>주:</Text>
                <TextInput
                  style={styles.weeksInput}
                  value={nutritionWeeks}
                  onChangeText={(text) => {
                    // 숫자만 입력 허용
                    const numericValue = text.replace(/[^0-9]/g, "");
                    if (numericValue === "" || (parseInt(numericValue, 10) >= 1 && parseInt(numericValue, 10) <= 52)) {
                      setNutritionWeeks(numericValue);
                      if (numericValue && userIdLoaded && userId) {
                        const weeks = parseInt(numericValue, 10) || 3;
                        loadNutritionWeeklyGraph(weeks);
                      }
                    }
                  }}
                  keyboardType="numeric"
                  placeholder="숫자를 입력해보세요"
                  placeholderTextColor="#666666"
                  maxLength={2}
                />
              </View>
            </View>
          )}

          {mealLoading ? (
            <View style={styles.mealLoadingContainer}>
              <ActivityIndicator size="small" color="#d6ff4b" />
              <Text style={styles.loadingText}>식단 데이터 불러오는 중...</Text>
            </View>
          ) : mealError ? (
            <View style={styles.mealLoadingContainer}>
              <Text style={styles.emptyText}>{mealError}</Text>
            </View>
          ) : mealComparison ? (
            <>
              {(() => {
                console.log("[ANALYSIS] 식단 분석 데이터 렌더링 시작:", {
                  hasMealComparison: !!mealComparison,
                  thisWeekCalories: mealComparison.thisWeekCalories,
                  lastWeekCalories: mealComparison.lastWeekCalories,
                  analysisMessage: mealComparison.analysisMessage,
                });
                return null;
              })()}

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
      <PremiumModal
        isOpen={isPremiumModalOpen}
        onClose={() => setIsPremiumModalOpen(false)}
        onContinue={() => {
          setIsPremiumModalOpen(false);
          // 결제 페이지로 이동하거나 결제 처리
          navigation.navigate("PaymentSuccess");
        }}
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
  // ===== 건강점수 섹션 스타일 =====
  healthScoreSection: {
    backgroundColor: "#2a2a2a",
    borderRadius: 16,
    padding: 24,
    marginBottom: 16,
    elevation: 6,
  },
  healthScoreContent: {
    flexDirection: "row",
    alignItems: "center",
    gap: 20,
    marginBottom: 16,
  },
  healthScoreCircleContainer: {
    position: "relative",
    alignItems: "center",
    justifyContent: "center",
  },
  healthScoreTextContainer: {
    position: "absolute",
    top: 0,
    left: 0,
    right: 0,
    bottom: 0,
    alignItems: "center",
    justifyContent: "center",
  },
  healthScoreNumber: {
    fontSize: 32,
    fontWeight: "700",
    color: "#E3FF7C",
    letterSpacing: -0.5,
  },
  healthScoreTextArea: {
    flex: 1,
    justifyContent: "center",
    gap: 4,
  },
  healthScoreLabel: {
    fontSize: 14,
    color: "#aaaaaa",
    fontWeight: "500",
    letterSpacing: 0.3,
  },
  healthScoreTitle: {
    fontSize: 24,
    fontWeight: "700",
    color: "#ffffff",
    letterSpacing: 0.3,
    marginBottom: 4,
  },
  healthScoreBadge: {
    flexDirection: "row",
    alignItems: "center",
    gap: 6,
    backgroundColor: "rgba(227, 255, 124, 0.15)",
    paddingHorizontal: 12,
    paddingVertical: 6,
    borderRadius: 20,
    alignSelf: "flex-start",
  },
  healthScoreBadgeText: {
    fontSize: 12,
    fontWeight: "600",
    color: "#E3FF7C",
    letterSpacing: 0.3,
  },
  healthScoreHint: {
    fontSize: 12,
    color: "#888888",
    letterSpacing: 0.2,
  },
  healthScoreLoading: {
    width: 100,
    height: 100,
    justifyContent: "center",
    alignItems: "center",
  },
  healthScoreNoData: {
    fontSize: 12,
    color: "#888888",
    fontWeight: "500",
  },
  healthScoreFooter: {
    flexDirection: "row",
    justifyContent: "space-between",
    alignItems: "center",
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
    flexShrink: 1,
    maxWidth: "70%",
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
  weeklyGraphContainer: {
    backgroundColor: "#1e1e1e",
    borderRadius: 12,
    padding: 16,
    marginBottom: 16,
    borderWidth: 1,
    borderColor: "#333333",
  },
  graphHeader: {
    flexDirection: "row",
    justifyContent: "space-between",
    alignItems: "center",
    marginBottom: 12,
  },
  graphTitle: {
    fontSize: 14.4,
    fontWeight: "600",
    color: "#ffffff",
  },
  weeksInputContainer: {
    flexDirection: "row",
    alignItems: "center",
    gap: 8,
  },
  weeksLabel: {
    fontSize: 12,
    color: "#aaaaaa",
  },
  weeksInput: {
    backgroundColor: "#2a2a2a",
    borderWidth: 1,
    borderColor: "#444444",
    borderRadius: 6,
    paddingHorizontal: 10,
    paddingVertical: 6,
    fontSize: 12,
    color: "#ffffff",
    minWidth: 50,
    textAlign: "center",
  },
  graphHintText: {
    fontSize: 11,
    color: "#888888",
    textAlign: "center",
    marginTop: 8,
    marginBottom: 8,
    fontStyle: "italic",
  },
  weeksInputOnlyContainer: {
    backgroundColor: "#1e1e1e",
    borderRadius: 12,
    padding: 16,
    marginBottom: 16,
    borderWidth: 1,
    borderColor: "#333333",
  },
  weeksInputLabel: {
    fontSize: 14.4,
    fontWeight: "600",
    color: "#ffffff",
    marginBottom: 12,
  },
  weeksInputRow: {
    flexDirection: "row",
    alignItems: "center",
    gap: 8,
  },
  graphImageWrapper: {
    width: "100%",
    minHeight: 250,
    height: 320,
    borderRadius: 8,
    backgroundColor: "#ffffff",
    overflow: "hidden",
  },
  weeklyGraphImage: {
    width: "100%",
    height: 320,
    borderRadius: 8,
  },
  weeklyGraphPlaceholder: {
    width: "100%",
    minHeight: 150,
    height: 250,
    backgroundColor: "transparent",
    borderRadius: 8,
    justifyContent: "center",
    alignItems: "center",
    padding: 20,
  },
  graphPlaceholderText: {
    fontSize: 12,
    color: "#666666",
    textAlign: "center",
  },
  graphLoadingContainer: {
    paddingVertical: 20,
    alignItems: "center",
    justifyContent: "center",
    marginBottom: 16,
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
