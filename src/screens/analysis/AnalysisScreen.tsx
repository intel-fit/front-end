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
} from "react-native";
import { SafeAreaView } from "react-native-safe-area-context";
import { Ionicons as Icon } from "@expo/vector-icons";
import { colors } from "../../theme/colors";
import InBodyPhotoModal from "../../components/modals/InBodyPhotoModal";
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
} from "../../services/apiConfig";
import MacroDonut from "../../components/charts/MacroDonut";
import { authAPI, healthScoreAPI } from "../../services";
import { getLatestInBody, InBodyPayload } from "../../utils/inbodyApi";
import { eventBus } from "../../utils/eventBus";

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
  const [exerciseWeeklyGraph, setExerciseWeeklyGraph] = useState<string | null>(
    null
  );
  const [exerciseGraphLoading, setExerciseGraphLoading] = useState(false);
  const [exerciseGraphKey, setExerciseGraphKey] = useState<string>(
    `exercise-graph-${Date.now()}-${Math.random()
      .toString(36)
      .substring(2, 15)}`
  );
  const [nutritionWeeklyGraph, setNutritionWeeklyGraph] = useState<
    string | null
  >(null);
  const [nutritionGraphLoading, setNutritionGraphLoading] = useState(false);
  const [nutritionGraphKey, setNutritionGraphKey] = useState<string>(
    `nutrition-graph-${Date.now()}-${Math.random()
      .toString(36)
      .substring(2, 15)}`
  );

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

  // ArrayBuffer → base64 변환 유틸 함수
  const arrayBufferToBase64 = useCallback((buffer: ArrayBuffer): string => {
    try {
      // Buffer 우선 사용
      const uint8 = new Uint8Array(buffer);
      return Buffer.from(uint8).toString("base64");
    } catch (e) {
      // Fallback: btoa (청크 단위로 처리)
      let binary = "";
      const bytes = new Uint8Array(buffer);
      const len = bytes.byteLength;
      const chunkSize = 0x8000; // 32k
      for (let i = 0; i < len; i += chunkSize) {
        const subarray = bytes.subarray(i, i + chunkSize);
        binary += String.fromCharCode.apply(null, Array.from(subarray));
      }
      // @ts-ignore
      return typeof btoa === "function" ? btoa(binary) : "";
    }
  }, []);

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

      // 로컬 저장소에서 확인
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
    [interpretCompletion, localSessionCompletion, localCompletionByNameDate]
  );

  const completedWorkoutHistory = useMemo(
    () => workoutHistory.filter(isSessionCompleted),
    [workoutHistory, isSessionCompleted]
  );

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
    console.log("[ANALYSIS] exercises 계산:", {
      workoutHistoryLength: workoutHistory.length,
      completedWorkoutHistoryLength: completedWorkoutHistory.length,
    });
    if (completedWorkoutHistory.length === 0) {
      console.log("[ANALYSIS] completedWorkoutHistory가 비어있음");
      return [];
    }

    // 운동 이름별로 그룹화
    const groupedByExercise = completedWorkoutHistory.reduce((acc, session) => {
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

        const canonicalExerciseId = resolveExerciseIdentifier(latest);

        recentExercises.push({
          id: makeExerciseKey(latest.sessionId, canonicalExerciseId || name),
          name,
          change: Math.abs(change),
          changeType,
          rm: oneRM,
          recordCount: recent.length,
          exerciseId: canonicalExerciseId,
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
      console.log("[ANALYSIS] 운동 기록 조회 시작");
      setLoading(true);

      // 최근 30일간의 저장된 운동 기록 조회
      // userId는 문자열일 수 있으므로 숫자로 변환 시도, 실패하면 그대로 사용
      let userIdNum: number | string = userId;
      if (typeof userId === "string") {
        const parsed = parseInt(userId, 10);
        userIdNum = isNaN(parsed) ? userId : parsed;
      }

      const allWorkouts: WorkoutSession[] = [];
      const today = new Date();

      // 최근 30일간의 데이터를 가져옴
      for (let i = 0; i < 30; i++) {
        const date = new Date(today);
        date.setDate(date.getDate() - i);
        const dateStr = `${date.getFullYear()}-${String(
          date.getMonth() + 1
        ).padStart(2, "0")}-${String(date.getDate()).padStart(2, "0")}`;

        try {
          console.log(`[ANALYSIS] ${dateStr} 운동 기록 조회 중...`);
          const savedGroups = await fetchSavedWorkouts(userIdNum, dateStr);
          console.log(
            `[ANALYSIS] ${dateStr} 조회 결과:`,
            savedGroups.length,
            "개 그룹"
          );

          // SavedWorkoutGroup[]을 WorkoutSession[]로 변환
          // 같은 sessionId와 exerciseName을 가진 레코드들을 하나의 WorkoutSession으로 합침
          savedGroups.forEach((group) => {
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
        } catch (error: any) {
          // 특정 날짜의 데이터가 없으면 무시 (404는 정상)
          if (error?.response?.status !== 404) {
            console.warn(
              `[ANALYSIS] ${dateStr} 운동 기록 조회 실패:`,
              error?.response?.status
            );
          }
        }
      }

      console.log("[ANALYSIS] 운동 기록 로드 완료:", {
        count: allWorkouts.length,
        sample: allWorkouts.slice(0, 2).map((w) => ({
          exerciseName: w.exerciseName,
          setsCount: w.sets?.length || 0,
          workoutDate: w.workoutDate,
        })),
      });
      setWorkoutHistory(allWorkouts);
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

      // AI 서버 API: /ai/user/{user_id}/trend/weekly
      const url = `${AI_API_BASE_URL}/user/${aiUserId}/trend/weekly`;

      console.log("[ANALYSIS] 식단 비교 API 요청:", {
        url,
        method: "GET",
        aiUserId,
        hasToken: !!token,
      });

      const response = await axios.get<any>(url, {
        headers: {
          Authorization: token ? `Bearer ${token}` : undefined,
          Accept: "application/json",
        },
      });
      console.log(
        "[ANALYSIS] 식단 비교 API 응답 전체:",
        JSON.stringify(response.data, null, 2)
      );

      // 응답이 빈 배열인지 확인
      if (Array.isArray(response.data)) {
        if (response.data.length === 0) {
          // 빈 배열이면 데이터 없음으로 처리
          console.log("[ANALYSIS] 식단 비교 데이터 없음 (빈 배열)");
          setMealComparison(null);
          setMealError(null);
          return;
        }
        // 배열에 데이터가 있으면 첫 번째 요소 사용 (API 스펙에 따라 조정)
        console.log("[ANALYSIS] 식단 비교: 배열 응답, 첫 번째 요소 사용");
        setMealComparison(response.data[0] as MealComparison);
      } else if (response.data && typeof response.data === "object") {
        // 객체인 경우 기존 로직대로 처리
        console.log("[ANALYSIS] 식단 비교 응답 상세:", {
          status: response.status,
          hasData: !!response.data,
          dataType: typeof response.data,
          dataKeys: Object.keys(response.data),
          thisWeekCalories: response.data?.thisWeekCalories,
          lastWeekCalories: response.data?.lastWeekCalories,
          caloriesDifference: response.data?.caloriesDifference,
          caloriesChangeRate: response.data?.caloriesChangeRate,
          thisWeekStart: response.data?.thisWeekStart,
          thisWeekEnd: response.data?.thisWeekEnd,
        });
        setMealComparison(response.data);
      } else {
        // 예상치 못한 응답 형식
        console.log("[ANALYSIS] 식단 비교: 예상치 못한 응답 형식");
        setMealComparison(null);
        setMealError(null);
      }
    } catch (error: any) {
      const status = error?.response?.status;
      const errorData = error?.response?.data;

      console.error("[ANALYSIS] 식단 비교 API 에러:", {
        status,
        statusText: error?.response?.statusText,
        url: error?.config?.url,
        errorData,
        errorMessage: error?.message,
        fullError: JSON.stringify(error?.response?.data, null, 2),
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
      setMealLoading(false);
    }
  }, [userId]);

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

  // 운동 주간 그래프 로드 (단순화된 버전)
  const loadExerciseWeeklyGraph = useCallback(async () => {
    let cachedGraphData: string | null = null;
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
          console.warn("[ANALYSIS] aiUserId를 찾을 수 없음");
          setExerciseGraphLoading(false);
          return;
        }
      }

      const cacheKey = `exercise_weekly_graph_${aiUserId}`;

      // 2) 캐시 먼저 시도
      const cachedRaw = await AsyncStorage.getItem(cacheKey);
      if (cachedRaw) {
        try {
          const cached = JSON.parse(cachedRaw);
          const cacheTime = cached.timestamp || 0;
          const now = Date.now();
          if (now - cacheTime < 24 * 60 * 60 * 1000 && cached.data) {
            if (__DEV__) {
              console.log("[ANALYSIS] 운동 주간 그래프: 캐시에서 로드");
            }
            cachedGraphData = cached.data;
            setExerciseWeeklyGraph(cached.data);
            setExerciseGraphKey(`exercise-graph-${now}`);
            setExerciseGraphLoading(false);
          }
        } catch (e) {
          console.warn("[ANALYSIS] 운동 그래프 캐시 파싱 실패:", e);
        }
      }

      // 캐시가 없으면 로딩 표시
      if (!cachedGraphData) {
        setExerciseGraphLoading(true);
      }

      // 3) API 호출 (백그라운드에서 새 데이터 가져오기)
      try {
        const url = `${AI_API_BASE_URL}/analytics/exercise/weekly-graph/${aiUserId}`;
        if (__DEV__) {
          console.log("[ANALYSIS] 운동 주간 그래프 요청:", { url, aiUserId });
        }

        const response = await axios.get<ArrayBuffer>(url, {
          responseType: "arraybuffer",
          timeout: 10000, // 10초 타임아웃
          headers: {
            Authorization: token ? `Bearer ${token}` : undefined,
            Accept: "*/*",
          },
        });

        if (response.status === 200 && response.data) {
          const base64 = arrayBufferToBase64(response.data);
          if (!base64 || base64.length < 100) {
            console.warn(
              "[ANALYSIS] 운동 그래프 base64 변환 실패 또는 데이터가 너무 짧음:",
              {
                base64Length: base64?.length || 0,
              }
            );
            // 변환 실패해도 캐시된 데이터가 있으면 유지
            if (!cachedGraphData) {
              setExerciseGraphLoading(false);
            }
            return;
          }

          const uri = `data:image/png;base64,${base64}`;
          if (__DEV__) {
            console.log("[ANALYSIS] 운동 그래프 URI 생성:", {
              length: uri.length,
              prefix: uri.substring(0, 50),
            });
          }

          // 캐시 저장
          await AsyncStorage.setItem(
            cacheKey,
            JSON.stringify({
              data: uri,
              timestamp: Date.now(),
            })
          );

          setExerciseWeeklyGraph(uri);
          setExerciseGraphKey(`exercise-graph-${Date.now()}`);
          setExerciseGraphLoading(false);
        } else {
          console.warn(
            "[ANALYSIS] 운동 그래프 응답 상태 비정상:",
            response.status
          );
          // 응답 비정상이어도 캐시된 데이터가 있으면 유지
          if (!cachedGraphData) {
            setExerciseGraphLoading(false);
          }
        }
      } catch (apiError: any) {
        // API 호출 실패해도 캐시된 데이터가 있으면 유지
        const isTimeout =
          apiError?.code === "ECONNABORTED" ||
          apiError?.message?.includes("timeout");
        console.warn("[ANALYSIS] 운동 그래프 API 호출 실패:", {
          message: apiError?.message,
          status: apiError?.response?.status,
          isTimeout,
        });
        if (!cachedGraphData) {
          setExerciseGraphLoading(false);
        }
      }
    } catch (error: any) {
      console.error("[ANALYSIS] 운동 주간 그래프 로드 실패:", {
        message: error?.message,
        status: error?.response?.status,
      });
      // 에러 발생해도 캐시된 데이터가 있으면 유지
      setExerciseGraphLoading(false);
    }
  }, [arrayBufferToBase64]);

  // 식단 주간 그래프 로드 (단순화된 버전)
  const loadNutritionWeeklyGraph = useCallback(async () => {
    let cachedGraphData: string | null = null;
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
          console.warn("[ANALYSIS] aiUserId를 찾을 수 없음");
          setNutritionGraphLoading(false);
          return;
        }
      }

      const cacheKey = `nutrition_weekly_graph_${aiUserId}`;

      // 2) 캐시 먼저 시도
      const cachedRaw = await AsyncStorage.getItem(cacheKey);
      if (cachedRaw) {
        try {
          const cached = JSON.parse(cachedRaw);
          const cacheTime = cached.timestamp || 0;
          const now = Date.now();
          if (now - cacheTime < 24 * 60 * 60 * 1000 && cached.data) {
            if (__DEV__) {
              console.log("[ANALYSIS] 식단 주간 그래프: 캐시에서 로드");
            }
            cachedGraphData = cached.data;
            setNutritionWeeklyGraph(cached.data);
            setNutritionGraphKey(`nutrition-graph-${now}`);
            setNutritionGraphLoading(false);
          }
        } catch (e) {
          console.warn("[ANALYSIS] 식단 그래프 캐시 파싱 실패:", e);
        }
      }

      // 캐시가 없으면 로딩 표시
      if (!cachedGraphData) {
        setNutritionGraphLoading(true);
      }

      // 3) API 호출 (백그라운드에서 새 데이터 가져오기)
      try {
        const url = `${AI_API_BASE_URL}/analytics/nutrition/weekly-graph/${aiUserId}`;
        if (__DEV__) {
          console.log("[ANALYSIS] 식단 주간 그래프 요청:", { url, aiUserId });
        }

        const response = await axios.get<ArrayBuffer>(url, {
          responseType: "arraybuffer",
          timeout: 10000, // 10초 타임아웃
          headers: {
            Authorization: token ? `Bearer ${token}` : undefined,
            Accept: "*/*",
          },
        });

        if (response.status === 200 && response.data) {
          const base64 = arrayBufferToBase64(response.data);
          if (!base64 || base64.length < 100) {
            console.warn(
              "[ANALYSIS] 식단 그래프 base64 변환 실패 또는 데이터가 너무 짧음:",
              {
                base64Length: base64?.length || 0,
              }
            );
            // 변환 실패해도 캐시된 데이터가 있으면 유지
            if (!cachedGraphData) {
              setNutritionGraphLoading(false);
            }
            return;
          }

          const uri = `data:image/png;base64,${base64}`;
          if (__DEV__) {
            console.log("[ANALYSIS] 식단 그래프 URI 생성:", {
              length: uri.length,
              prefix: uri.substring(0, 50),
            });
          }

          // 캐시 저장
          await AsyncStorage.setItem(
            cacheKey,
            JSON.stringify({
              data: uri,
              timestamp: Date.now(),
            })
          );

          setNutritionWeeklyGraph(uri);
          setNutritionGraphKey(`nutrition-graph-${Date.now()}`);
          setNutritionGraphLoading(false);
        } else {
          console.warn(
            "[ANALYSIS] 식단 그래프 응답 상태 비정상:",
            response.status
          );
          // 응답 비정상이어도 캐시된 데이터가 있으면 유지
          if (!cachedGraphData) {
            setNutritionGraphLoading(false);
          }
        }
      } catch (apiError: any) {
        // API 호출 실패해도 캐시된 데이터가 있으면 유지
        const isTimeout =
          apiError?.code === "ECONNABORTED" ||
          apiError?.message?.includes("timeout");
        console.warn("[ANALYSIS] 식단 그래프 API 호출 실패:", {
          message: apiError?.message,
          status: apiError?.response?.status,
          isTimeout,
        });
        if (!cachedGraphData) {
          setNutritionGraphLoading(false);
        }
      }
    } catch (error: any) {
      console.error("[ANALYSIS] 식단 주간 그래프 로드 실패:", {
        message: error?.message,
        status: error?.response?.status,
      });
      // 에러 발생해도 캐시된 데이터가 있으면 유지
      if (!cachedGraphData) {
        setNutritionGraphLoading(false);
      }
    }
  }, [arrayBufferToBase64]);

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

  // userId가 로드된 후 그래프 로드 (병렬 처리로 빠른 로딩)
  useEffect(() => {
    if (userIdLoaded && userId) {
      if (__DEV__) {
        console.log(
          "[ANALYSIS] userId 로드 완료, 그래프 병렬 로드 시작:",
          userId
        );
      }
      // 두 그래프를 병렬로 로드하여 더 빠른 로딩
      Promise.all([
        loadExerciseWeeklyGraph(),
        loadNutritionWeeklyGraph(),
      ]).catch((error) => {
        if (__DEV__) {
          console.warn("[ANALYSIS] 그래프 로드 중 오류:", error);
        }
      });
    }
  }, [userIdLoaded, userId, loadExerciseWeeklyGraph, loadNutritionWeeklyGraph]);

  // 화면 포커스 시 운동 기록 새로고침
  useFocusEffect(
    useCallback(() => {
      // 다른 데이터는 순차적으로 로드
      loadWorkoutHistory();
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
      loadExerciseWeeklyGraph,
      loadNutritionWeeklyGraph,
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

  const handleInBodyClick = () => {
    navigation.navigate("InBody");
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
          onPress={() => navigation.navigate("HealthScoreTrend")}
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
          <View style={styles.weeklyGraphContainer}>
            <Text style={styles.graphTitle}>주간 운동 분석</Text>
            {exerciseGraphLoading ? (
              <View style={styles.graphLoadingContainer}>
                <ActivityIndicator size="small" color="#d6ff4b" />
                <Text style={styles.loadingText}>그래프 불러오는 중...</Text>
              </View>
            ) : exerciseWeeklyGraph && exerciseWeeklyGraph.length > 5000 ? (
              (() => {
                console.log("[ANALYSIS] 운동 그래프 렌더링:", {
                  hasValue: !!exerciseWeeklyGraph,
                  length: exerciseWeeklyGraph.length,
                  startsWithDataImage:
                    exerciseWeeklyGraph.startsWith("data:image"),
                  first50: exerciseWeeklyGraph.substring(0, 50),
                });
                return (
                  <Image
                    key={
                      exerciseGraphKey ||
                      `exercise-graph-${exerciseWeeklyGraph.length}`
                    }
                    source={{ uri: exerciseWeeklyGraph }}
                    style={styles.weeklyGraphImage}
                    resizeMode="contain"
                    accessibilityLabel="운동 주간 분석 그래프"
                    onLoadStart={() => {
                      console.log("[ANALYSIS] 운동 그래프 이미지 로드 시작");
                    }}
                    onLoad={(e) => {
                      console.log("[ANALYSIS] 운동 그래프 이미지 로드 완료:", {
                        length: exerciseWeeklyGraph.length,
                        prefix: exerciseWeeklyGraph.substring(0, 50),
                        nativeEvent: e.nativeEvent,
                      });
                    }}
                    onError={(e) => {
                      console.error(
                        "[ANALYSIS] 운동 그래프 이미지 로드 실패:",
                        {
                          error: e.nativeEvent.error,
                          uriPrefix: exerciseWeeklyGraph.substring(0, 50),
                          fullError: e.nativeEvent,
                        }
                      );
                    }}
                  />
                );
              })()
            ) : (
              <View style={styles.weeklyGraphPlaceholder}>
                <Text style={styles.graphPlaceholderText}>
                  그래프 데이터를 불러오는 중입니다...
                </Text>
              </View>
            )}
          </View>

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
          <View style={styles.weeklyGraphContainer}>
            <Text style={styles.graphTitle}>주간 식단 분석</Text>
            {nutritionGraphLoading ? (
              <View style={styles.graphLoadingContainer}>
                <ActivityIndicator size="small" color="#d6ff4b" />
                <Text style={styles.loadingText}>그래프 불러오는 중...</Text>
              </View>
            ) : nutritionWeeklyGraph && nutritionWeeklyGraph.length > 5000 ? (
              (() => {
                console.log("[ANALYSIS] 식단 그래프 렌더링:", {
                  hasValue: !!nutritionWeeklyGraph,
                  length: nutritionWeeklyGraph.length,
                  startsWithDataImage:
                    nutritionWeeklyGraph.startsWith("data:image"),
                  first50: nutritionWeeklyGraph.substring(0, 50),
                });
                return (
                  <Image
                    key={
                      nutritionGraphKey ||
                      `nutrition-graph-${nutritionWeeklyGraph.length}`
                    }
                    source={{ uri: nutritionWeeklyGraph }}
                    style={styles.weeklyGraphImage}
                    resizeMode="contain"
                    accessibilityLabel="식단 주간 분석 그래프"
                    onLoadStart={() => {
                      console.log("[ANALYSIS] 식단 그래프 이미지 로드 시작");
                    }}
                    onLoad={(e) => {
                      console.log("[ANALYSIS] 식단 그래프 이미지 로드 완료:", {
                        length: nutritionWeeklyGraph.length,
                        prefix: nutritionWeeklyGraph.substring(0, 50),
                        nativeEvent: e.nativeEvent,
                      });
                    }}
                    onError={(e) => {
                      console.error(
                        "[ANALYSIS] 식단 그래프 이미지 로드 실패:",
                        {
                          error: e.nativeEvent.error,
                          uriPrefix: nutritionWeeklyGraph.substring(0, 50),
                          fullError: e.nativeEvent,
                        }
                      );
                    }}
                  />
                );
              })()
            ) : (
              <View style={styles.weeklyGraphPlaceholder}>
                <Text style={styles.graphPlaceholderText}>
                  그래프 데이터를 불러오는 중입니다...
                </Text>
              </View>
            )}
          </View>

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
  weeklyGraphContainer: {
    backgroundColor: "#1e1e1e",
    borderRadius: 12,
    padding: 16,
    marginBottom: 16,
    borderWidth: 1,
    borderColor: "#333333",
  },
  graphTitle: {
    fontSize: 14.4,
    fontWeight: "600",
    color: "#ffffff",
    marginBottom: 12,
  },
  weeklyGraphImage: {
    width: "100%",
    minHeight: 250,
    height: 300,
    borderRadius: 8,
    backgroundColor: "#2a2a2a",
  },
  weeklyGraphSvgContainer: {
    width: "100%",
    height: 200,
    backgroundColor: "#ffffff",
    borderRadius: 8,
    justifyContent: "center",
    alignItems: "center",
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
  graphPlaceholder: {
    fontSize: 12,
    color: "#666666",
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
