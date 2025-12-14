import React, { useState, useEffect, useRef, useCallback } from "react";
import {
  View,
  Text,
  StyleSheet,
  SafeAreaView,
  ScrollView,
  TouchableOpacity,
  TouchableWithoutFeedback,
  Alert,
  Modal,
  Image,
  FlatList,
  ActivityIndicator,
  TextInput,
  BackHandler,
  TextStyle,
} from "react-native";
import { Ionicons as Icon } from "@expo/vector-icons";
import { colors } from "../../theme/colors";
import AsyncStorage from "@react-native-async-storage/async-storage";
import ExerciseModal from "../../components/modals/ExerciseModal";
import InBodyCalendarModal from "../../components/common/InBodyCalendarModal";
import {
  deleteWorkoutSession,
  postWorkoutSession,
  fetchWeeklyProgress,
  fetchMonthlyProgress,
  fetchDateProgress,
  fetchTodayProgress,
  fetchExercises,
  fetchExerciseDetail,
  getTodayWorkoutTime,
  saveWorkoutTitle,
  fetchSavedWorkouts,
} from "../../utils/exerciseApi";
import type { SavedWorkoutGroup } from "../../utils/exerciseApi";
import { getExerciseGoalSummary } from "../../utils/exerciseGoalApi";
import { eventBus } from "../../utils/eventBus";
import { useDate } from "../../contexts/DateContext";
import type { DailyProgressWeekItem } from "../../types";
import { API_BASE_URL, ACCESS_TOKEN_KEY } from "../../services/apiConfig";
import { mealAPI } from "../../services";
import { useFocusEffect, useRoute } from "@react-navigation/native";
interface Activity {
  id: number;
  name: string;
  details: string;
  time: string;
  date: string; // YYYY-MM-DD 형식
  isCompleted: boolean;
  sessionId?: string; // 서버 저장된 세션과 연동용
  sets?: any[]; // 세트 내역 보존
  comment?: string;
  imageUrl?: string; // 운동/스트레칭 이미지 URL
  externalId?: string; // 운동/스트레칭 외부 ID
  saveTitle?: string;
  groupKey?: string;
}

const DETAIL_TIME_REGEX = /(오전|오후)\s*\d{1,2}:\d{2}/gi;
const cleanExerciseDetails = (details?: string): string => {
  if (!details) return "";
  const withoutTime = details.replace(DETAIL_TIME_REGEX, " ");
  return withoutTime.replace(/\s+/g, " ").trim();
};

const formatDisplayTime = (dateInput?: string): string => {
  if (!dateInput) return "";
  const date = new Date(dateInput);
  if (Number.isNaN(date.getTime())) return "";
  return date.toLocaleTimeString("ko-KR", {
    hour: "numeric",
    minute: "2-digit",
    hour12: true,
  });
};

const buildDetailsFromSets = (sets?: any[]): string => {
  if (!Array.isArray(sets) || sets.length === 0) {
    return "";
  }
  const firstSet = sets[0] || {};
  const weight =
    typeof firstSet.weight === "number"
      ? firstSet.weight
      : firstSet.weight
      ? Number(firstSet.weight)
      : 0;
  const reps =
    typeof firstSet.reps === "number"
      ? firstSet.reps
      : firstSet.reps
      ? Number(firstSet.reps)
      : 0;
  return `${weight || 0}kg ${reps || 0}회 ${sets.length}세트`;
};

const isStretchActivity = (activity?: Activity): boolean => {
  if (!activity) return false;
  const name = activity.name || "";
  const details = activity.details || "";
  return details.includes("스트레칭") || name.includes("스트레칭");
};

// 운동 이름 검색 키워드 생성 (분석하기 페이지와 동일)
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

type ExerciseGoalInfo = {
  weeklyFrequency: string;
  durationPerSession: string;
  exerciseType?: string;
  weeklyCalorieGoal?: number;
};

const ExerciseScreen = ({ navigation }: any) => {
  const route = useRoute();
  const [initialLoadComplete, setInitialLoadComplete] = useState(false);
  const [calendarVisible, setCalendarVisible] = useState(false);
  const [monthBase, setMonthBase] = useState(new Date());
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
  const workoutActivities = React.useMemo(
    () => activities.filter((activity) => !isStretchActivity(activity)),
    [activities]
  );

  const [savedWorkouts, setSavedWorkouts] = useState<SavedWorkoutGroup[]>([]);
  const [savedWorkoutsLoading, setSavedWorkoutsLoading] = useState(false);
  const [savedWorkoutsError, setSavedWorkoutsError] = useState<string | null>(
    null
  );

  const isActivityFullyCompleted = useCallback((activity?: Activity | null) => {
    if (!activity) return false;

    // 명시적으로 isCompleted가 true인 경우만 완료로 간주
    if (activity.isCompleted === true) {
      // 세트가 있는 경우, 모든 세트가 완료되었는지도 확인
      if (Array.isArray(activity.sets) && activity.sets.length > 0) {
        const allSetsCompleted = activity.sets.every((set: any) => {
          return set && set.isCompleted === true;
        });
        // isCompleted가 true여도 세트가 모두 완료되지 않았으면 false
        return allSetsCompleted;
      }
      return true;
    }

    // 세트가 있는 경우, 모든 세트가 완료되어야 완료로 간주
    if (Array.isArray(activity.sets) && activity.sets.length > 0) {
      // 모든 세트가 완료되었는지 확인
      const allSetsCompleted = activity.sets.every((set: any) => {
        // set이 없거나 isCompleted가 명시적으로 true가 아니면 false
        return set && set.isCompleted === true;
      });
      return allSetsCompleted;
    }

    // 세트가 없거나 빈 배열인 경우, isCompleted가 명시적으로 true가 아니면 완료되지 않은 것으로 간주
    return false;
  }, []);

  const [pendingSavedRefs, setPendingSavedRefs] = useState<{
    sessionIds: string[];
    activityIds: number[];
    externalKeys: string[];
  }>({
    sessionIds: [],
    activityIds: [],
    externalKeys: [],
  });

  const { orderedActivities, groupedActivityMeta } = React.useMemo(() => {
    const defaultResult = {
      orderedActivities: workoutActivities,
      groupedActivityMeta: new Map<
        number,
        {
          title: string;
          isFirst: boolean;
          isLast: boolean;
          sessionIds: string[];
        }
      >(),
    };

    const sessionToGroup = new Map<string, { title: string; key: string }>();
    savedWorkouts.forEach((group) => {
      if (!group) return;
      const normalizedTitle = (group.title || "").trim();
      const key = normalizedTitle.toLowerCase() || "__untitled__";
      if (Array.isArray(group.sessions)) {
        group.sessions.forEach((session) => {
          if (session?.sessionId) {
            sessionToGroup.set(session.sessionId, {
              title: normalizedTitle || group.title || "운동 기록",
              key,
            });
          }
        });
      }
    });

    if (sessionToGroup.size === 0) {
      return defaultResult;
    }

    const groupBuckets = new Map<
      string,
      {
        title: string;
        order: number;
        activities: Array<{ activity: Activity; index: number }>;
        sessionIds: Set<string>;
      }
    >();
    const singleItems: Array<{ activity: Activity; order: number }> = [];

    workoutActivities.forEach((activity, index) => {
      const sessionId = activity.sessionId;
      const activityTitle = activity.saveTitle?.trim();
      const normalizedActivityTitle = activityTitle
        ? activityTitle.toLowerCase()
        : null;
      const groupInfoFromSaved =
        sessionId && sessionToGroup.get(sessionId || "");
      const hasServerGroup = !!groupInfoFromSaved;

      const resolvedTitle =
        activityTitle || groupInfoFromSaved?.title || "운동 기록";

      // saveTitle을 가진 활동들은 saveTitle 기준으로 그룹화 (최우선순위)
      // 같은 saveTitle을 가진 운동들은 하나의 그룹으로 묶임
      // saveTitle이 있으면 무조건 saveTitle로 그룹화 (groupKey 무시)
      const bucketKey =
        (normalizedActivityTitle ? `title:${normalizedActivityTitle}` : null) ||
        (activity.groupKey ? `group:${activity.groupKey}` : null) ||
        (hasServerGroup && groupInfoFromSaved?.key
          ? `saved:${groupInfoFromSaved.key}`
          : null) ||
        (hasServerGroup && sessionId ? `session:${sessionId}` : null);

      if (!bucketKey) {
        singleItems.push({ activity, order: index });
        return;
      }

      let bucket = groupBuckets.get(bucketKey);
      if (!bucket) {
        bucket = {
          title: resolvedTitle,
          order: index,
          activities: [],
          sessionIds: new Set<string>(),
        };
        groupBuckets.set(bucketKey, bucket);
      }
      bucket.title = resolvedTitle; // 최신 제목으로 유지
      bucket.activities.push({ activity, index });
      if (sessionId) {
        bucket.sessionIds.add(sessionId);
      }
      if (index < bucket.order) {
        bucket.order = index;
      }
    });

    if (groupBuckets.size === 0) {
      return defaultResult;
    }

    type TimelineItem =
      | { type: "single"; activity: Activity; order: number }
      | {
          type: "group";
          title: string;
          activities: Activity[];
          order: number;
          sessionIds: string[];
        };

    const timelineItems: TimelineItem[] = [];

    singleItems.forEach((item) => {
      timelineItems.push({
        type: "single",
        activity: item.activity,
        order: item.order,
      });
    });

    Array.from(groupBuckets.values()).forEach((bucket) => {
      timelineItems.push({
        type: "group",
        title: bucket.title,
        activities: bucket.activities
          .sort((a, b) => a.index - b.index)
          .map((item) => item.activity),
        order: bucket.order,
        sessionIds: Array.from(bucket.sessionIds),
      });
    });

    timelineItems.sort((a, b) => a.order - b.order);

    const ordered: Activity[] = [];
    const metaMap = new Map<
      number,
      { title: string; isFirst: boolean; isLast: boolean; sessionIds: string[] }
    >();

    timelineItems.forEach((item) => {
      if (item.type === "single") {
        ordered.push(item.activity);
      } else {
        item.activities.forEach((activity, idx) => {
          ordered.push(activity);
          metaMap.set(activity.id, {
            title: item.title,
            isFirst: idx === 0,
            isLast: idx === item.activities.length - 1,
            sessionIds: item.sessionIds,
          });
        });
      }
    });

    if (__DEV__) {
      console.log("[GROUP] 정렬된 운동 타임라인:", {
        groups: Array.from(groupBuckets.values()).map((bucket) => ({
          title: bucket.title,
          count: bucket.activities.length,
          order: bucket.order,
        })),
      });
    }

    return {
      orderedActivities: ordered,
      groupedActivityMeta: metaMap,
    };
  }, [
    workoutActivities,
    savedWorkouts,
    isActivityFullyCompleted,
    pendingSavedRefs,
  ]);

  const savedSessionTimes = React.useMemo(() => {
    const map = new Map<string, string>();
    savedWorkouts.forEach((group) => {
      group.sessions?.forEach((session) => {
        if (!session?.sessionId) return;
        const recordWithTime =
          session.records?.find((record) => record?.workoutDate) ||
          session.records?.[0];
        const formatted = recordWithTime
          ? formatDisplayTime(recordWithTime.workoutDate)
          : "";
        if (formatted) {
          map.set(session.sessionId, formatted);
        }
      });
    });
    return map;
  }, [savedWorkouts]);

  const [goalData, setGoalData] = useState<ExerciseGoalInfo | null>(null);
  const [completedThisWeek, setCompletedThisWeek] = useState(0);
  const [weeklyCalories, setWeeklyCalories] = useState(0);
  const [weeklyProgress, setWeeklyProgress] = useState<DailyProgressWeekItem[]>(
    []
  );
  const [monthlyProgress, setMonthlyProgress] = useState<
    DailyProgressWeekItem[]
  >([]);
  const [todayProgress, setTodayProgress] =
    useState<DailyProgressWeekItem | null>(null);
  // 달력에 표시할 칼로리 데이터 (날짜별)
  const [calendarCalories, setCalendarCalories] = useState<
    Record<string, number>
  >({});
  const [showMonthView, setShowMonthView] = useState(false);
  const [isModalOpen, setIsModalOpen] = useState(false);
  const [isIntroVisible, setIsIntroVisible] = useState(false);
  const [introStage, setIntroStage] = useState<
    "intro" | "stretch" | "detail" | "exercise"
  >("intro");
  const [stretchOptions, setStretchOptions] = useState<any[]>([]);
  const [stretchLoading, setStretchLoading] = useState(false);
  const [stretchError, setStretchError] = useState<string | null>(null);
  const [selectedStretchIds, setSelectedStretchIds] = useState<string[]>([]);
  const [selectedStretches, setSelectedStretches] = useState<any[]>([]);
  const [stretchDetailIndex, setStretchDetailIndex] = useState(0);
  const [isStretchDetailVisible, setIsStretchDetailVisible] = useState(false);
  const [stretchDetails, setStretchDetails] = useState<Record<string, any>>({});
  const [stretchDetailsLoading, setStretchDetailsLoading] = useState<
    Record<string, boolean>
  >({});
  const [stretchTimer, setStretchTimer] = useState(30);
  // 완료된 스트레칭 ID 목록 (검정색으로 표시하기 위함)
  const [completedStretchIds, setCompletedStretchIds] = useState<Set<string>>(
    new Set()
  );
  const [modalMode, setModalMode] = useState<"add" | "edit">("add");
  const [selectedExercise, setSelectedExercise] = useState<Activity | null>(
    null
  );
  const [selectedExerciseCompleted, setSelectedExerciseCompleted] =
    useState(false);
  const [userId, setUserId] = useState<string | null>(null);
  const [userIdLoaded, setUserIdLoaded] = useState(false);
  // 운동 완료 모달 상태
  const [showCompletionModal, setShowCompletionModal] = useState(false);
  const [completedExercises, setCompletedExercises] = useState<
    Array<{
      name: string;
      targetMuscle?: string;
      imageUrl?: string;
      externalId?: string;
      activityId?: number;
      sessionId?: string;
      sets?: any[];
      allSetsCompleted?: boolean;
      comment?: string;
    }>
  >([]);
  const [completionSummaryTitle, setCompletionSummaryTitle] = useState("");
  const [todayTotalWorkoutSeconds, setTodayTotalWorkoutSeconds] = useState(0);
  const [workoutStartTime, setWorkoutStartTime] = useState<number | null>(null); // 운동 시작 시점 (초 단위)
  const [currentExerciseStartTime, setCurrentExerciseStartTime] = useState<
    number | null
  >(null); // 현재 운동의 시작 시간 (초 단위)
  const [currentExerciseStartTimestamp, setCurrentExerciseStartTimestamp] =
    useState<number | null>(null); // 현재 운동의 시작 타임스탬프 (밀리초)
  const [isSavingCompletionTitle, setIsSavingCompletionTitle] = useState(false);
  const [expandedSavedTitle, setExpandedSavedTitle] = useState<string | null>(
    null
  );
  const [expandedSavedSessionId, setExpandedSavedSessionId] = useState<
    string | null
  >(null);
  const [completionSaveErrorDetail, setCompletionSaveErrorDetail] = useState<
    string | null
  >(null);
  // 운동별 피드백 상태 관리 (운동 이름을 키로 사용)
  const [exerciseFeedbacks, setExerciseFeedbacks] = useState<
    Record<
      string,
      {
        intensity: "heavy" | "light" | null;
        feedback: "like" | "dislike" | null;
      }
    >
  >({});
  const [showAddOptions, setShowAddOptions] = useState(false);
  const [exerciseSequence, setExerciseSequence] = useState<Activity[]>([]);
  const [exerciseSequenceIndex, setExerciseSequenceIndex] =
    useState<number>(-1);
  // 운동 이미지 로딩 상태 (분석하기 페이지와 동일한 방식)
  const [exerciseImages, setExerciseImages] = useState<Record<string, string>>(
    {}
  );
  const [exerciseImagesByName, setExerciseImagesByName] = useState<
    Record<string, string>
  >({});
  const fetchedImageIdsRef = useRef<Set<string>>(new Set());
  const fetchedNameRef = useRef<Set<string>>(new Set());
  const failedImageIdsRef = useRef<Set<string>>(new Set());
  const prefetchedImageUrlsRef = useRef<Set<string>>(new Set());
  const prefetchImage = React.useCallback((url?: string) => {
    if (!url) return;
    if (prefetchedImageUrlsRef.current.has(url)) return;
    prefetchedImageUrlsRef.current.add(url);
    Image.prefetch(url).catch(() => {
      prefetchedImageUrlsRef.current.delete(url);
    });
  }, []);

  // 완료되지 않은 운동이 있는지 확인
  const hasIncompleteActivities = React.useMemo(() => {
    return workoutActivities.some(
      (activity) => !isActivityFullyCompleted(activity)
    );
  }, [workoutActivities, isActivityFullyCompleted]);

  const goalSummaryText = React.useMemo(() => {
    if (!goalData) {
      return "목표치가 아직 설정되지 않았습니다";
    }
    const parts: string[] = [];
    if (goalData.weeklyFrequency) {
      parts.push(goalData.weeklyFrequency);
    }
    if (goalData.durationPerSession) {
      parts.push(goalData.durationPerSession);
    }
    if (goalData.exerciseType) {
      parts.push(goalData.exerciseType);
    }
    if (
      typeof goalData.weeklyCalorieGoal === "number" &&
      goalData.weeklyCalorieGoal > 0
    ) {
      parts.push(`${goalData.weeklyCalorieGoal.toLocaleString()}kcal`);
    }
    if (parts.length === 0) {
      return "목표치가 아직 설정되지 않았습니다";
    }
    return `목표치 | ${parts.join(", ")}`;
  }, [goalData]);

  const trimmedCompletionTitle = completionSummaryTitle.trim();

  // 운동 완료 모달에서 이미지 로딩 (분석하기 페이지와 동일한 방식)
  useEffect(() => {
    if (!showCompletionModal || completedExercises.length === 0) return;

    const missingIds = completedExercises
      .map((ex) => ({
        id: ex.externalId,
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
            prefetchImage(url);
            setExerciseImages((prev) => ({
              ...prev,
              [id]: url,
            }));
          } else if (!cancelled) {
            trackFailure(id);
          }
        } catch (error) {
          if (__DEV__) {
            console.warn("[EXERCISE] 운동 이미지 불러오기 실패:", {
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
  }, [showCompletionModal, completedExercises, exerciseImages, prefetchImage]);

  useEffect(() => {
    if (!showCompletionModal) return;

    // 오늘 완료된 모든 활동 (운동 + 스트레칭) 가져오기
    const today = new Date();
    const todayStr = formatDateToString(today);
    const todayCompletedActivities = allActivities.filter(
      (activity) =>
        activity.date === todayStr && isActivityFullyCompleted(activity)
    );

    // 운동 이름 목록 (completedExercises + allActivities의 스트레칭)
    const allExerciseNames = new Set<string>();
    completedExercises.forEach((ex) => {
      if (ex.name) allExerciseNames.add(ex.name);
    });
    todayCompletedActivities.forEach((activity) => {
      const isStretch =
        activity.details?.includes("스트레칭") ||
        activity.name?.includes("스트레칭");
      if (isStretch && activity.name) {
        allExerciseNames.add(activity.name);
      }
    });

    const missingByName = Array.from(allExerciseNames)
      .filter(
        (name) =>
          name &&
          !exerciseImagesByName[name.toLowerCase()] &&
          !fetchedNameRef.current.has(name.toLowerCase())
      )
      .map((name) => ({
        rawName: name,
        keywords: generateSearchKeywords(name),
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
              prefetchImage(url);
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
              console.warn("[EXERCISE] 운동 이미지 검색 실패:", {
                name: rawName,
                keyword,
                message: (error as Error)?.message,
              });
            }
          }
        }

        if (!resolved && __DEV__) {
          console.warn("[EXERCISE] 운동 이미지 검색 실패 - 모든 키워드 시도", {
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
    showCompletionModal,
    completedExercises,
    allActivities,
    exerciseImagesByName,
    prefetchImage,
  ]);

  // 활동 목록의 이미지 로드
  useEffect(() => {
    if (activities.length === 0) return;

    const loadActivityImages = async () => {
      for (const activity of activities) {
        // 이미 이미지가 있으면 스킵
        if (activity.imageUrl) continue;
        if (activity.externalId && exerciseImages[activity.externalId])
          continue;
        if (activity.name && exerciseImagesByName[activity.name.toLowerCase()])
          continue;

        // externalId로 이미지 로드 시도
        if (
          activity.externalId &&
          !fetchedImageIdsRef.current.has(activity.externalId)
        ) {
          try {
            fetchedImageIdsRef.current.add(activity.externalId);
            const detail = await fetchExerciseDetail(activity.externalId);
            const url =
              detail?.imageUrl ||
              detail?.image ||
              detail?.imgUrl ||
              detail?.photoUrl;
            if (url) {
              prefetchImage(url);
              setExerciseImages((prev) => ({
                ...prev,
                [activity.externalId!]: url,
              }));
              if (__DEV__) {
                console.log("[EXERCISE] 이미지 로드 성공:", {
                  externalId: activity.externalId,
                  name: activity.name,
                  url,
                });
              }
            } else {
              if (__DEV__) {
                console.warn("[EXERCISE] 이미지 URL 없음:", {
                  externalId: activity.externalId,
                  name: activity.name,
                  detail: detail ? Object.keys(detail) : null,
                });
              }
            }
          } catch (error) {
            console.warn("[EXERCISE] 활동 이미지 로드 실패:", {
              externalId: activity.externalId,
              name: activity.name,
              error: error instanceof Error ? error.message : error,
            });
          }
        }
        // 이름으로 이미지 검색 시도 (externalId가 없거나 실패한 경우)
        if (
          activity.name &&
          !fetchedNameRef.current.has(activity.name.toLowerCase()) &&
          (!activity.externalId || !exerciseImages[activity.externalId])
        ) {
          const keywords = generateSearchKeywords(activity.name);
          const keywordList =
            keywords && keywords.length > 0 ? keywords : [activity.name];

          for (const keyword of keywordList) {
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
              if (url) {
                prefetchImage(url);
                setExerciseImagesByName((prev) => {
                  const next = { ...prev };
                  next[activity.name.toLowerCase()] = url;
                  return next;
                });
                fetchedNameRef.current.add(activity.name.toLowerCase());
                break;
              }
            } catch (error) {
              // 다음 키워드 시도
            }
          }
        }
      }
    };

    loadActivityImages();
  }, [activities, exerciseImages, exerciseImagesByName, prefetchImage]);

  const COMPLETED_COUNT_KEY_BASE = "workoutCompletedThisWeek";
  const ACTIVITIES_KEY_BASE = "user_activities_v1";

  const getStorageKey = React.useCallback(
    (base: string) => (userId ? `${base}:${userId}` : base),
    [userId]
  );

  React.useEffect(() => {
    (async () => {
      try {
        const storedUserId = await AsyncStorage.getItem("userId");
        console.log(
          "[EXERCISE][DEBUG] AsyncStorage에서 가져온 userId:",
          storedUserId
        );
        setUserId(storedUserId);
        console.log("[EXERCISE][DEBUG] state에 설정된 userId:", storedUserId);
      } finally {
        setUserIdLoaded(true);
      }
    })();
  }, []);

  React.useEffect(() => {
    if (!selectedDate) {
      setSelectedDate(new Date());
    }
  }, [selectedDate, setSelectedDate]);

  const loadGoalData = React.useCallback(async () => {
    try {
      const summary = await getExerciseGoalSummary();
      setGoalData(summary);
    } catch (error) {
      console.log("[EXERCISE] 운동 목표 불러오기 실패:", error);
      setGoalData(null);
    }

    try {
      const completed = await AsyncStorage.getItem(
        getStorageKey(COMPLETED_COUNT_KEY_BASE)
      );
      setCompletedThisWeek(completed ? parseInt(completed, 10) || 0 : 0);
    } catch (error) {
      console.log("[EXERCISE] 완료 횟수 불러오기 실패:", error);
      setCompletedThisWeek(0);
    }
  }, [getStorageKey]);

  // 오늘 진행률 로드 (게이지 표시용)
  const loadTodayProgress = React.useCallback(async () => {
    try {
      console.log("[PROGRESS] 오늘 진행률 로드 시작");
      const data = await fetchTodayProgress();
      console.log("[PROGRESS] 오늘 진행률 API 응답:", data);
      setTodayProgress(data);
    } catch (e) {
      console.error("[PROGRESS] 오늘 진행률 로드 실패:", e);
      setTodayProgress(null);
    }
  }, []);

  // 주간 칼로리 합계 로드 (이번 주)
  const loadWeeklyCalories = React.useCallback(async () => {
    try {
      console.log("[PROGRESS] 주간 진행률 로드 시작");
      const data = await fetchWeeklyProgress();
      console.log("[PROGRESS] 주간 진행률 API 응답:", data);
      const progressArray = Array.isArray(data) ? data : [];
      setWeeklyProgress(progressArray);
      const sum = Array.isArray(data)
        ? data.reduce((s: number, d) => s + Number(d?.totalCalorie || 0), 0)
        : 0;
      setWeeklyCalories(sum);

      // exerciseRate가 100인 날짜 확인
      const completedDays = progressArray.filter(
        (item) => item?.exerciseRate === 100
      );
      console.log(
        "[PROGRESS] exerciseRate가 100인 날짜:",
        completedDays.map((d) => d.date)
      );
      console.log(
        "[PROGRESS] exerciseRate가 100인 날짜 개수:",
        completedDays.length
      );
    } catch (e) {
      console.error("주간 칼로리 로드 실패:", e);
      setWeeklyCalories(0);
      setWeeklyProgress([]);
    }
  }, []);

  // 오늘의 총 운동 시간 조회
  const loadTodayWorkoutTime = React.useCallback(async () => {
    console.log("[EXERCISE][TIME] loadTodayWorkoutTime 호출됨", { userId });

    let finalUserId: number | null = null;

    // 1. state의 userId를 숫자로 변환 시도
    if (userId) {
      const parsed = parseInt(userId, 10);
      if (!isNaN(parsed)) {
        finalUserId = parsed;
        console.log(
          "[EXERCISE][TIME] state userId를 숫자로 변환:",
          finalUserId
        );
      }
    }

    // 2. 숫자 변환 실패 시 AsyncStorage에서 가져오기
    if (!finalUserId) {
      const userIdStr = await AsyncStorage.getItem("userId");
      console.log(
        "[EXERCISE][TIME] AsyncStorage에서 가져온 userId:",
        userIdStr
      );
      if (userIdStr && userIdStr.trim() !== "") {
        const parsed = parseInt(userIdStr, 10);
        if (!isNaN(parsed)) {
          finalUserId = parsed;
          console.log(
            "[EXERCISE][TIME] AsyncStorage userId를 숫자로 변환:",
            finalUserId
          );
        }
      }
    }

    // 3. 숫자 변환 실패 시 JWT에서 userPk 가져오기
    if (!finalUserId) {
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
          console.log("[EXERCISE][TIME] JWT payload:", payload);

          // userPk를 우선 확인 (숫자 ID), 그 다음 userId, 마지막으로 sub
          if (payload.userPk) {
            const parsed =
              typeof payload.userPk === "number"
                ? payload.userPk
                : parseInt(payload.userPk, 10);
            if (!isNaN(parsed)) {
              finalUserId = parsed;
              console.log("[EXERCISE][TIME] JWT에서 userPk 추출:", finalUserId);
            }
          } else if (payload.userId) {
            const parsed =
              typeof payload.userId === "number"
                ? payload.userId
                : parseInt(payload.userId, 10);
            if (!isNaN(parsed)) {
              finalUserId = parsed;
              console.log("[EXERCISE][TIME] JWT에서 userId 추출:", finalUserId);
            }
          } else if (payload.sub) {
            const parsed = parseInt(payload.sub, 10);
            if (!isNaN(parsed)) {
              finalUserId = parsed;
              console.log("[EXERCISE][TIME] JWT에서 sub 추출:", finalUserId);
            }
          }
        }
      } catch (e) {
        console.error("[EXERCISE][TIME] JWT 디코딩 실패:", e);
      }
    }

    if (!finalUserId) {
      console.log("[EXERCISE][TIME] userId를 찾을 수 없음, 함수 종료");
      return;
    }

    try {
      console.log(
        "[EXERCISE][TIME] getTodayWorkoutTime 호출 시작:",
        finalUserId
      );
      const response = await getTodayWorkoutTime(finalUserId);
      console.log("[EXERCISE][TIME] getTodayWorkoutTime 응답 받음:", {
        totalSeconds: response.totalSeconds,
        response,
      });
      setTodayTotalWorkoutSeconds(response.totalSeconds || 0);
    } catch (e) {
      console.error("[EXERCISE][TIME] 오늘 운동 시간 조회 실패:", e);
      setTodayTotalWorkoutSeconds(0);
    }
  }, [userId]);

  const loadSavedWorkouts = React.useCallback(async () => {
    if (!selectedDate) return;

    // userId 가져오기 - handleExerciseSave와 동일한 패턴
    let finalUserId: number | null = null;

    // state의 userId를 숫자로 변환 시도
    if (userId && userId.trim() !== "") {
      const parsed = parseInt(userId, 10);
      if (!isNaN(parsed)) {
        finalUserId = parsed;
        console.log(
          "[EXERCISE][SAVED][DEBUG] state userId를 숫자로 변환:",
          finalUserId
        );
      }
    }

    // 숫자 변환 실패 시 AsyncStorage에서 가져오기
    if (!finalUserId) {
      const userIdStr = await AsyncStorage.getItem("userId");
      console.log(
        "[EXERCISE][SAVED][DEBUG] AsyncStorage에서 가져온 userId:",
        userIdStr
      );
      if (userIdStr && userIdStr.trim() !== "") {
        const parsed = parseInt(userIdStr, 10);
        if (!isNaN(parsed)) {
          finalUserId = parsed;
          console.log(
            "[EXERCISE][SAVED][DEBUG] AsyncStorage userId를 숫자로 변환:",
            finalUserId
          );
        }
      }
    }

    // 숫자 변환 실패 시 JWT에서 userPk 가져오기
    if (!finalUserId) {
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
          console.log("[EXERCISE][SAVED][DEBUG] JWT payload:", payload);

          // userPk를 우선 확인 (숫자 ID), 그 다음 userId, 마지막으로 sub
          if (payload.userPk) {
            const parsed =
              typeof payload.userPk === "number"
                ? payload.userPk
                : parseInt(payload.userPk, 10);
            if (!isNaN(parsed)) {
              finalUserId = parsed;
              console.log(
                "[EXERCISE][SAVED][DEBUG] JWT에서 userPk 추출:",
                finalUserId
              );
            }
          } else if (payload.userId) {
            const parsed =
              typeof payload.userId === "number"
                ? payload.userId
                : parseInt(payload.userId, 10);
            if (!isNaN(parsed)) {
              finalUserId = parsed;
              console.log(
                "[EXERCISE][SAVED][DEBUG] JWT에서 userId 추출:",
                finalUserId
              );
            }
          } else if (payload.sub) {
            const parsed = parseInt(payload.sub, 10);
            if (!isNaN(parsed)) {
              finalUserId = parsed;
              console.log(
                "[EXERCISE][SAVED][DEBUG] JWT에서 sub 추출:",
                finalUserId
              );
            }
          }
        }
      } catch (e) {
        console.error("[EXERCISE][SAVED][DEBUG] JWT 디코딩 실패:", e);
      }
    }

    if (!finalUserId) {
      console.warn("[EXERCISE][SAVED][DEBUG] userId를 찾을 수 없음");
      return;
    }

    const userIdNum = finalUserId;

    // 날짜를 yyyy-MM-dd 형식으로 변환
    const dateStr = `${selectedDate.getFullYear()}-${String(
      selectedDate.getMonth() + 1
    ).padStart(2, "0")}-${String(selectedDate.getDate()).padStart(2, "0")}`;

    try {
      setSavedWorkoutsLoading(true);
      setSavedWorkoutsError(null);
      const data = await fetchSavedWorkouts(userIdNum, dateStr);
      const workouts = Array.isArray(data) ? data : [];

      // 동일한 제목의 운동은 한 그룹으로 합쳐서 세션을 이어 붙인다.
      const mergedGroups: SavedWorkoutGroup[] = [];
      const groupMap = new Map<string, SavedWorkoutGroup>();

      workouts.forEach((group) => {
        if (!group) return;
        const normalizedTitle = (group.title || "").trim();
        const key = normalizedTitle.toLowerCase() || "__untitled__";

        let targetGroup = groupMap.get(key);
        if (!targetGroup) {
          targetGroup = {
            title: normalizedTitle || group.title || "운동 기록",
            sessions: [],
          };
          groupMap.set(key, targetGroup);
          mergedGroups.push(targetGroup);
        }

        if (Array.isArray(group.sessions) && group.sessions.length > 0) {
          targetGroup.sessions = targetGroup.sessions.concat(group.sessions);
        }
      });

      // 저장된 운동은 모두 표시 (필터링 제거)
      // 오늘 날짜에 저장된 운동도 표시되어야 하므로 필터링하지 않음
      setSavedWorkouts(mergedGroups);

      // savedWorkouts를 allActivities로 변환하여 추가
      // 서버 데이터를 기준으로 현재 날짜의 저장된 운동을 재구성
      setAllActivities((prev) => {
        const currentDateStr = dateStr;
        const newActivities: Activity[] = [];
        const serverSessionIds = new Set<string>();
        const serverActivityKeys = new Set<string>();

        // 서버에서 가져온 데이터로 Activity 생성
        mergedGroups.forEach((group) => {
          const normalizedTitle = (group.title || "").trim() || "운동 기록";
          group.sessions?.forEach((session) => {
            if (!session?.sessionId) {
              return; // sessionId가 없으면 스킵
            }

            serverSessionIds.add(session.sessionId);

            // records를 exerciseName별로 그룹화
            const exerciseMap = new Map<string, SavedWorkoutRecord[]>();
            session.records?.forEach((record) => {
              const key = record.exerciseName || "unknown";
              if (!exerciseMap.has(key)) {
                exerciseMap.set(key, []);
              }
              exerciseMap.get(key)!.push(record);
            });

            // 각 운동별로 Activity 생성
            exerciseMap.forEach((records, exerciseName) => {
              const activityKey = `${session.sessionId}__${exerciseName}`;

              // 이미 추가된 활동이면 스킵 (중복 방지)
              if (serverActivityKeys.has(activityKey)) {
                return;
              }

              serverActivityKeys.add(activityKey);

              const firstRecord = records[0];
              const sets = records
                .sort((a, b) => a.setNumber - b.setNumber)
                .map((record, index) => ({
                  id: record.id,
                  order: record.setNumber || index + 1,
                  weight: record.weight,
                  reps: record.reps,
                  isCompleted: true,
                }));

              // externalId 추출: record > session 순서로 확인
              const externalId =
                firstRecord.exerciseId ||
                firstRecord.externalId ||
                firstRecord.exerciseCode ||
                session.exerciseId ||
                session.externalId ||
                undefined;

              const activity: Activity = {
                id: Date.now() + Math.random(), // 고유 ID 생성
                name: exerciseName,
                details: buildDetailsFromSets(sets),
                time: firstRecord.workoutDate
                  ? formatDisplayTime(firstRecord.workoutDate)
                  : "",
                date: currentDateStr,
                sessionId: session.sessionId,
                saveTitle: normalizedTitle,
                category: firstRecord.category || "",
                sets: sets,
                isCompleted: true,
                externalId: externalId,
              };

              if (__DEV__ && !externalId) {
                console.warn("[EXERCISE][SAVED] externalId 없음:", {
                  exerciseName,
                  sessionId: session.sessionId,
                  record: {
                    exerciseId: firstRecord.exerciseId,
                    externalId: firstRecord.externalId,
                    exerciseCode: firstRecord.exerciseCode,
                  },
                  session: {
                    exerciseId: session.exerciseId,
                    externalId: session.externalId,
                  },
                });
              }

              newActivities.push(activity);
            });
          });
        });

        // 서버에서 가져온 활동의 고유 키 생성 (날짜 + 제목 + 운동명) - 중복 체크용
        const serverActivityDedupKeys = new Set<string>();
        newActivities.forEach((activity) => {
          if (activity.date && activity.saveTitle && activity.name) {
            const normalizedTitle = (activity.saveTitle || "")
              .trim()
              .toLowerCase();
            const key = `${
              activity.date
            }__${normalizedTitle}__${activity.name.trim()}`;
            serverActivityDedupKeys.add(key);
          }
        });

        // 기존 allActivities에서:
        // 1. 다른 날짜의 활동은 유지
        // 2. 현재 날짜의 sessionId가 있는 활동은 모두 제거 (서버 데이터로 대체)
        // 3. 현재 날짜의 sessionId가 없는 활동은 서버 데이터와 중복되지 않으면 유지
        const filteredPrev = prev.filter((activity) => {
          // 다른 날짜의 활동은 유지
          if (activity.date !== currentDateStr) {
            return true;
          }

          // sessionId가 있는 경우는 모두 제거 (서버 데이터로 대체)
          if (activity.sessionId) {
            return false;
          }

          // sessionId가 없으면 서버 데이터와 중복 체크
          // 같은 날짜, 같은 제목, 같은 운동명이 서버에 있으면 제거 (서버 데이터로 대체)
          if (activity.date && activity.saveTitle && activity.name) {
            const normalizedTitle = (activity.saveTitle || "")
              .trim()
              .toLowerCase();
            const key = `${
              activity.date
            }__${normalizedTitle}__${activity.name.trim()}`;
            if (serverActivityDedupKeys.has(key)) {
              return false; // 서버 데이터와 중복이면 제거
            }
          }

          // 서버 데이터와 중복되지 않으면 유지 (아직 저장되지 않은 새로운 활동)
          return true;
        });

        // 서버 데이터 추가 (중복 제거: 날짜 + 제목 + 운동명 기준)
        const seenKeys = new Set<string>();
        const result: Activity[] = [];

        // filteredPrev의 활동들을 먼저 추가하고 seenKeys에 등록
        filteredPrev.forEach((activity) => {
          if (activity.date && activity.saveTitle && activity.name) {
            const normalizedTitle = (activity.saveTitle || "")
              .trim()
              .toLowerCase();
            const key = `${
              activity.date
            }__${normalizedTitle}__${activity.name.trim()}`;
            seenKeys.add(key);
          }
          result.push(activity);
        });

        // 서버에서 가져온 활동 추가 (중복 제거)
        newActivities.forEach((activity) => {
          if (!activity.date || !activity.saveTitle || !activity.name) {
            // 필수 필드가 없으면 추가하지 않음
            return;
          }

          // 고유 키: 날짜 + 제목 + 운동명
          const normalizedTitle = (activity.saveTitle || "")
            .trim()
            .toLowerCase();
          const uniqueKey = `${
            activity.date
          }__${normalizedTitle}__${activity.name.trim()}`;

          // 이미 추가된 활동이면 스킵 (중복 제거)
          if (seenKeys.has(uniqueKey)) {
            return;
          }

          // 처음 본 활동이면 추가
          seenKeys.add(uniqueKey);
          result.push(activity);
        });

        console.log("[EXERCISE][SAVED] 저장된 운동 기록 재구성:", {
          prevCount: prev.length,
          filteredPrevCount: filteredPrev.length,
          newCount: newActivities.length,
          resultCount: result.length,
          removedCount: prev.length - filteredPrev.length,
          addedCount: result.length - filteredPrev.length,
          activities: newActivities.map((a) => ({
            name: a.name,
            sessionId: a.sessionId,
            setsCount: a.sets?.length || 0,
          })),
        });

        return result;
      });

      const sessionTitleMapFresh = new Map<string, string>();
      // filteredGroups 대신 mergedGroups 사용 (모든 세션 정보는 유지)
      mergedGroups.forEach((group) => {
        const normalizedTitle = (group.title || "").trim();
        group.sessions?.forEach((session) => {
          if (session?.sessionId) {
            sessionTitleMapFresh.set(session.sessionId, normalizedTitle);
          }
        });
      });
      if (sessionTitleMapFresh.size > 0) {
        const clearedSessionIds = new Set(sessionTitleMapFresh.keys());
        setPendingSavedRefs((prev) => ({
          ...prev,
          sessionIds: prev.sessionIds.filter(
            (id) => !clearedSessionIds.has(id)
          ),
        }));
        setAllActivities((prev) =>
          prev.map((activity) => {
            if (!activity.sessionId) return activity;
            const newTitle = sessionTitleMapFresh.get(activity.sessionId);
            if (newTitle && activity.saveTitle !== newTitle) {
              return { ...activity, saveTitle: newTitle };
            }
            return activity;
          })
        );
      }
      const sessionTitleMap = new Map<string, string>();
      mergedGroups.forEach((group) => {
        const normalizedTitle = (group.title || "").trim();
        group.sessions?.forEach((session) => {
          if (session?.sessionId) {
            sessionTitleMap.set(session.sessionId, normalizedTitle);
          }
        });
      });
      if (sessionTitleMap.size > 0) {
        setAllActivities((prev) =>
          prev.map((activity) => {
            if (!activity.sessionId) return activity;
            const newTitle = sessionTitleMap.get(activity.sessionId);
            if (newTitle && activity.saveTitle !== newTitle) {
              return { ...activity, saveTitle: newTitle };
            }
            return activity;
          })
        );
      }
      if (__DEV__) {
        console.log(
          "[GROUP] 저장된 운동 제목 로드:",
          mergedGroups.map((w) => ({
            title: w.title,
            sessionCount: w.sessions?.length || 0,
            sessionIds: w.sessions?.map((s) => s.sessionId) || [],
          }))
        );
      }
    } catch (error) {
      console.error("[WORKOUT][SAVED] 불러오기 실패:", error);
      setSavedWorkouts([]);
      setSavedWorkoutsError("저장된 운동을 불러오지 못했어요.");
    } finally {
      setSavedWorkoutsLoading(false);
    }
  }, [userId, selectedDate]);

  React.useEffect(() => {
    if (!userIdLoaded) return;
    loadGoalData();
    // 페이지 열 때 그 주 진행률 가져오기
    loadWeeklyCalories();
    // 오늘 진행률 로드 (게이지 표시용)
    loadTodayProgress();
    // 페이지 열 때 선택된 날짜의 달 데이터 가져오기
    const dateToFetch = selectedDate || new Date();
    loadMonthlyProgress(dateToFetch.getFullYear(), dateToFetch.getMonth());
    // 오늘의 총 운동 시간 조회
    loadTodayWorkoutTime();
    // 저장된 운동 기록 조회
    loadSavedWorkouts();
  }, [
    userIdLoaded,
    loadGoalData,
    loadWeeklyCalories,
    loadTodayProgress,
    selectedDate,
    loadTodayWorkoutTime,
    loadSavedWorkouts,
  ]);

  // 기록하기 탭에 들어올 때마다 이번 주 진행률을 다시 계산
  useFocusEffect(
    React.useCallback(() => {
      if (!userIdLoaded) return;

      const refreshThisWeekProgress = async () => {
        try {
          // 서버에서 이번 주 진행률 데이터 가져오기
          const weeklyData = await fetchWeeklyProgress();
          if (!Array.isArray(weeklyData)) return;

          // 이번 주 시작일 계산
          const now = new Date();
          const thisWeekStart = new Date(now);
          thisWeekStart.setDate(now.getDate() - now.getDay()); // 일요일로 설정
          thisWeekStart.setHours(0, 0, 0, 0);

          const today = new Date();
          const todayEnd = new Date(
            today.getFullYear(),
            today.getMonth(),
            today.getDate(),
            23,
            59,
            59,
            999
          );

          // 이번 주 완료된 날짜 개수 계산 (exerciseRate가 100인 날짜)
          const completedDates = new Set<string>();
          weeklyData.forEach((item) => {
            if (!item || !item.date) return;
            try {
              const itemDate = new Date(item.date);
              if (isNaN(itemDate.getTime())) return;

              const itemDateOnly = new Date(
                itemDate.getFullYear(),
                itemDate.getMonth(),
                itemDate.getDate()
              );
              const weekStartOnly = new Date(
                thisWeekStart.getFullYear(),
                thisWeekStart.getMonth(),
                thisWeekStart.getDate()
              );
              const todayEndOnly = new Date(
                todayEnd.getFullYear(),
                todayEnd.getMonth(),
                todayEnd.getDate()
              );

              // 이번 주 범위 내에 있고, exerciseRate가 100이면 완료된 날짜로 간주
              if (
                itemDateOnly >= weekStartOnly &&
                itemDateOnly <= todayEndOnly &&
                item.exerciseRate === 100
              ) {
                const dateKey = `${itemDateOnly.getFullYear()}-${String(
                  itemDateOnly.getMonth() + 1
                ).padStart(2, "0")}-${String(itemDateOnly.getDate()).padStart(
                  2,
                  "0"
                )}`;
                completedDates.add(dateKey);
              }
            } catch (error) {
              // 날짜 파싱 에러 무시
            }
          });

          const actualCompletedThisWeek = completedDates.size;

          // completedThisWeek 업데이트
          setCompletedCountPersist(actualCompletedThisWeek);

          // weeklyProgress도 업데이트
          setWeeklyProgress(weeklyData);
          const sum = weeklyData.reduce(
            (s: number, d) => s + Number(d?.totalCalorie || 0),
            0
          );
          setWeeklyCalories(sum);
        } catch (error) {
          console.error("[PROGRESS] 이번 주 진행률 새로고침 실패:", error);
        }
      };

      refreshThisWeekProgress();
    }, [userIdLoaded, getStorageKey])
  );

  // 날짜를 yyyy-MM-dd 형식으로 변환
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
    if (hours > 0) {
      return `${hours}시간 ${minutes}분 ${secs}초`;
    } else if (minutes > 0) {
      return `${minutes}분 ${secs}초`;
    } else {
      return `${secs}초`;
    }
  };

  const formatWorkoutDateTime = React.useCallback((isoString?: string) => {
    if (!isoString) return "";
    const date = new Date(isoString);
    if (Number.isNaN(date.getTime())) {
      return isoString;
    }
    const year = date.getFullYear();
    const month = String(date.getMonth() + 1).padStart(2, "0");
    const day = String(date.getDate()).padStart(2, "0");
    const hours = String(date.getHours()).padStart(2, "0");
    const minutes = String(date.getMinutes()).padStart(2, "0");
    return `${year}.${month}.${day} ${hours}:${minutes}`;
  }, []);

  const extractSaveErrorDetail = React.useCallback((error: any): string => {
    if (!error) return "알 수 없는 오류가 발생했습니다.";
    const status =
      error?.response?.status ??
      error?.status ??
      error?.request?.status ??
      "N/A";
    const code = error?.response?.data?.code;
    const serverMessage = error?.response?.data?.message;
    const genericMessage = error?.message;
    const detailParts = [
      `상태코드: ${status}`,
      code ? `코드: ${code}` : null,
      serverMessage || genericMessage
        ? `메시지: ${serverMessage || genericMessage}`
        : null,
    ].filter(Boolean);
    return detailParts.join(" | ") || "오류 상세 정보를 불러오지 못했습니다.";
  }, []);

  const handleSavedTitleToggle = React.useCallback((title: string) => {
    setExpandedSavedTitle((prev) => (prev === title ? null : title));
    setExpandedSavedSessionId(null);
  }, []);

  const handleSavedSessionToggle = React.useCallback((sessionId: string) => {
    setExpandedSavedSessionId((prev) =>
      prev === sessionId ? null : sessionId
    );
  }, []);

  const handleCompletionConfirm = React.useCallback(async () => {
    // 확인 버튼을 누르는 즉시 완료 페이지를 숨기기 위해 먼저 초기화
    setCompletedExercises([]);
    setIsSavingCompletionTitle(true); // 저장 중 상태로 설정하여 완료 페이지 숨기기

    const trimmedTitle = completionSummaryTitle.trim();
    if (!trimmedTitle) {
      setIsSavingCompletionTitle(false); // early return 시 상태 복원
      Alert.alert("제목 입력 필요", "오늘 운동 제목을 입력해주세요.");
      return;
    }

    // saveTitle 최소 길이 검증 (서버에서 최소 3글자 이상 요구할 수 있음)
    if (trimmedTitle.length < 3) {
      setIsSavingCompletionTitle(false); // early return 시 상태 복원
      Alert.alert(
        "제목 길이 부족",
        "운동 제목은 최소 3글자 이상 입력해주세요."
      );
      return;
    }

    if (isSavingCompletionTitle) {
      return;
    }

    // userId 가져오기 - handleExerciseSave와 동일한 패턴
    let finalUserId: number | null = null;

    // state의 userId를 숫자로 변환 시도
    if (userId && userId.trim() !== "") {
      const parsed = parseInt(userId, 10);
      if (!isNaN(parsed)) {
        finalUserId = parsed;
        console.log(
          "[COMPLETION][DEBUG] state userId를 숫자로 변환:",
          finalUserId
        );
      }
    }

    // 숫자 변환 실패 시 AsyncStorage에서 가져오기
    if (!finalUserId) {
      const userIdStr = await AsyncStorage.getItem("userId");
      console.log(
        "[COMPLETION][DEBUG] AsyncStorage에서 가져온 userId:",
        userIdStr
      );
      if (userIdStr && userIdStr.trim() !== "") {
        const parsed = parseInt(userIdStr, 10);
        if (!isNaN(parsed)) {
          finalUserId = parsed;
          console.log(
            "[COMPLETION][DEBUG] AsyncStorage userId를 숫자로 변환:",
            finalUserId
          );
        }
      }
    }

    // 숫자 변환 실패 시 JWT에서 userPk 가져오기
    if (!finalUserId) {
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
          console.log("[COMPLETION][DEBUG] JWT payload:", payload);

          // userPk를 우선 확인 (숫자 ID), 그 다음 userId, 마지막으로 sub
          if (payload.userPk) {
            const parsed =
              typeof payload.userPk === "number"
                ? payload.userPk
                : parseInt(payload.userPk, 10);
            if (!isNaN(parsed)) {
              finalUserId = parsed;
              console.log(
                "[COMPLETION][DEBUG] JWT에서 userPk 추출:",
                finalUserId
              );
            }
          } else if (payload.userId) {
            const parsed =
              typeof payload.userId === "number"
                ? payload.userId
                : parseInt(payload.userId, 10);
            if (!isNaN(parsed)) {
              finalUserId = parsed;
              console.log(
                "[COMPLETION][DEBUG] JWT에서 userId 추출:",
                finalUserId
              );
            }
          } else if (payload.sub) {
            const parsed = parseInt(payload.sub, 10);
            if (!isNaN(parsed)) {
              finalUserId = parsed;
              console.log("[COMPLETION][DEBUG] JWT에서 sub 추출:", finalUserId);
            }
          }
        }
      } catch (e) {
        console.error("[COMPLETION][DEBUG] JWT 디코딩 실패:", e);
      }
    }

    console.log(
      "[COMPLETION][DEBUG] 최종 사용할 userId:",
      finalUserId,
      "타입:",
      typeof finalUserId
    );

    // userId가 없으면 에러 처리
    if (!finalUserId) {
      setIsSavingCompletionTitle(false); // early return 시 상태 복원
      Alert.alert(
        "사용자 정보 오류",
        "사용자 정보를 확인할 수 없습니다. 다시 로그인해주세요."
      );
      return;
    }

    const userIdNum = finalUserId;

    try {
      setIsSavingCompletionTitle(true);
      setCompletionSaveErrorDetail(null);

      if (completedExercises.length > 0) {
        const saveGroupKey = `group_${Date.now()}_${Math.random()
          .toString(36)
          .slice(2)}`;
        const sessionIdSet = new Set(
          completedExercises
            .map((ex) => ex.sessionId)
            .filter((id): id is string => typeof id === "string")
        );
        const activityIdSet = new Set(
          completedExercises
            .map((ex) => ex.activityId)
            .filter(
              (id): id is number =>
                typeof id === "number" && Number.isFinite(id)
            )
        );
        const externalKeySet = new Set(
          completedExercises
            .map((ex) => {
              if (ex.externalId && ex.name) {
                return `${ex.externalId}__${ex.name}`;
              }
              return null;
            })
            .filter((key): key is string => !!key)
        );

        const sessionIdsArray = Array.from(sessionIdSet);
        const activityIdsArray = Array.from(activityIdSet);
        const externalKeysArray = Array.from(externalKeySet);

        if (
          sessionIdsArray.length > 0 ||
          activityIdsArray.length > 0 ||
          externalKeysArray.length > 0
        ) {
          setPendingSavedRefs((prev) => ({
            sessionIds: Array.from(
              new Set([...prev.sessionIds, ...sessionIdsArray])
            ),
            activityIds: Array.from(
              new Set([...prev.activityIds, ...activityIdsArray])
            ),
            externalKeys: Array.from(
              new Set([...prev.externalKeys, ...externalKeysArray])
            ),
          }));
        }

        if (
          sessionIdSet.size > 0 ||
          activityIdSet.size > 0 ||
          externalKeySet.size > 0
        ) {
          setAllActivities((prev) =>
            prev.map((activity) => {
              if (activity.sessionId && sessionIdSet.has(activity.sessionId)) {
                return {
                  ...activity,
                  saveTitle: trimmedTitle,
                  groupKey: activity.groupKey || saveGroupKey,
                };
              }
              if (
                typeof activity.id === "number" &&
                activityIdSet.has(activity.id)
              ) {
                return {
                  ...activity,
                  saveTitle: trimmedTitle,
                  groupKey: activity.groupKey || saveGroupKey,
                };
              }
              if (
                activity.externalId &&
                activity.name &&
                externalKeySet.has(`${activity.externalId}__${activity.name}`)
              ) {
                return {
                  ...activity,
                  saveTitle: trimmedTitle,
                  groupKey: activity.groupKey || saveGroupKey,
                };
              }
              return activity;
            })
          );
        }
      }

      // 완료된 운동들의 피드백 데이터 수집
      const intensityList: number[] = [];
      const feedbackList: string[] = [];

      completedExercises.forEach((exercise) => {
        const exerciseName = exercise.name;
        const feedback = exerciseFeedbacks[exerciseName] || {
          intensity: null,
          feedback: null,
        };

        // intensity 변환: 무거워요(7.5), 선택안함(5.0), 가벼워요(2.5)
        // 서버는 float/double 배열을 기대하므로 반드시 소수점 포함 (5 → 5.0)
        if (feedback.intensity === "heavy") {
          intensityList.push(7.5);
        } else if (feedback.intensity === "light") {
          intensityList.push(2.5);
        } else {
          intensityList.push(5.0); // float 형식으로 (정수 5가 아닌 5.0)
        }

        // feedback 변환: 좋아요(like), 싫어요(dislike)
        // 서버는 "neutral"을 허용하지 않으므로 기본값은 "like"로 설정
        if (feedback.feedback === "like") {
          feedbackList.push("like");
        } else if (feedback.feedback === "dislike") {
          feedbackList.push("dislike");
        } else {
          // neutral은 서버 enum에 없으므로 기본값으로 "like" 사용
          feedbackList.push("like");
        }
      });

      // 운동 시간 계산 (초 단위)
      // 현재 세션의 운동 시간 = 저장 시점의 누적 시간 - 운동 시작 시점의 누적 시간
      let workoutSeconds = 0;
      if (workoutStartTime !== null) {
        workoutSeconds = Math.max(
          0,
          todayTotalWorkoutSeconds - workoutStartTime
        );
      } else {
        // 운동 시작 시점이 기록되지 않은 경우, 현재 누적 시간 사용 (하위 호환성)
        workoutSeconds = todayTotalWorkoutSeconds || 0;
      }

      // 최소 10초 보장 (운동을 했다면 최소한의 시간은 있어야 함)
      if (workoutSeconds === 0 && completedExercises.length > 0) {
        workoutSeconds = 10;
      }

      console.log("[WORKOUT][SAVE] 운동 시간 계산:", {
        workoutStartTime,
        todayTotalWorkoutSeconds,
        calculatedSeconds: workoutSeconds,
        completedExercisesCount: completedExercises.length,
      });

      // API 스펙 검증: intensity와 feedback 배열 길이는 운동 개수와 일치해야 함
      if (intensityList.length !== completedExercises.length) {
        console.warn(
          "[WORKOUT][SAVE] intensity 배열 길이 불일치:",
          intensityList.length,
          "!=",
          completedExercises.length
        );
      }
      if (feedbackList.length !== completedExercises.length) {
        console.warn(
          "[WORKOUT][SAVE] feedback 배열 길이 불일치:",
          feedbackList.length,
          "!=",
          completedExercises.length
        );
      }

      console.log("[WORKOUT][SAVE] 운동 저장 시작:", {
        userId: userIdNum,
        saveTitle: trimmedTitle,
        exerciseCount: completedExercises.length,
        intensityList,
        intensityLength: intensityList.length,
        feedbackList,
        feedbackLength: feedbackList.length,
        // API 스펙 검증: 배열 길이가 운동 개수와 일치하는지 확인
        arraysMatchExerciseCount:
          intensityList.length === completedExercises.length &&
          feedbackList.length === completedExercises.length,
      });

      const response = await saveWorkoutTitle(
        userIdNum,
        trimmedTitle,
        intensityList,
        feedbackList
      );

      console.log("[WORKOUT][SAVE] 운동 저장 성공:", {
        sessionId: response.sessionId,
        saveTitle: response.saveTitle,
        updatedCount: response.updatedCount,
      });

      const savedSessionIds: string[] = Array.isArray(response.sessionIds)
        ? response.sessionIds
        : [];
      if (savedSessionIds.length > 0) {
        // 저장된 세션에 saveTitle과 groupKey 설정
        const saveGroupKey = `group_${Date.now()}_${Math.random()
          .toString(36)
          .slice(2)}`;
        setAllActivities((prev) =>
          prev.map((activity) =>
            activity.sessionId && savedSessionIds.includes(activity.sessionId)
              ? {
                  ...activity,
                  saveTitle: trimmedTitle,
                  groupKey: activity.groupKey || saveGroupKey,
                }
              : activity
          )
        );
        setPendingSavedRefs((prev) => ({
          ...prev,
          sessionIds: prev.sessionIds.filter(
            (id) => !savedSessionIds.includes(id)
          ),
        }));
      }

      // 현재 세션에서 완료한 세트 수만 계산 (이전에 저장한 세트 제외)
      const currentSessionSetCount = completedExercises.reduce(
        (total, exercise) => {
          if (Array.isArray(exercise.sets)) {
            const completedSets = exercise.sets.filter(
              (set: any) => set?.isCompleted === true
            );
            return total + completedSets.length;
          }
          return total;
        },
        0
      );

      // 성공 메시지에 저장된 세트 수와 AI 피드백 전송 여부 포함
      const successMessage =
        currentSessionSetCount > 0
          ? `오늘의 운동 "${trimmedTitle}"이 저장되었어요.\n\n${currentSessionSetCount}개의 세트가 저장되었고, AI 피드백이 전송되었습니다.`
          : `오늘의 운동 "${trimmedTitle}"이 저장되었어요.\n\nAI 피드백이 전송되었습니다.`;

      // 확인 버튼을 누르자마자 완료된 운동 목록을 먼저 초기화하여 완료 페이지가 보이지 않도록 함
      setCompletedExercises([]);
      setCompletionSummaryTitle(""); // 제목 초기화
      setWorkoutStartTime(null); // 운동 시작 시간 리셋
      // 그 다음 모달 닫기 (완료 페이지가 이미 숨겨진 상태에서 모달이 닫힘)
      setShowCompletionModal(false);

      // 데이터 새로고침
      loadTodayWorkoutTime();
      loadSavedWorkouts();
      loadGoalData();
      loadTodayProgress(); // 오늘 진행률 로드 (게이지 업데이트)

      // 운동 제목 저장 후 주간 진행률을 다시 가져와서 게이지 업데이트
      // 서버에서 exerciseRate 계산에 시간이 걸릴 수 있으므로 여러 번 재시도
      const retryLoadProgress = async (
        retryCount: number = 0,
        maxRetries: number = 3
      ) => {
        try {
          // 목표 데이터와 주간 진행률을 함께 업데이트
          await loadGoalData();
          await loadWeeklyCalories();
          await loadTodayProgress(); // 오늘 진행률 로드 (게이지 업데이트)

          // exerciseRate가 업데이트되었는지 확인하기 위해 잠시 대기 후 다시 확인
          setTimeout(async () => {
            try {
              const freshData = await fetchWeeklyProgress();
              if (Array.isArray(freshData)) {
                setWeeklyProgress(freshData);
                const sum = freshData.reduce(
                  (s: number, d) => s + Number(d?.totalCalorie || 0),
                  0
                );
                setWeeklyCalories(sum);

                // 오늘 진행률도 다시 로드 (게이지 업데이트)
                await loadTodayProgress();

                // 오늘 날짜의 exerciseRate 확인
                const today = new Date();
                const todayStr = formatDateToString(today);
                const todayProgressItem = freshData.find(
                  (item) => item.date === todayStr
                );

                // exerciseRate가 여전히 0이고 재시도 횟수가 남아있으면 다시 시도
                if (
                  (!todayProgressItem ||
                    todayProgressItem.exerciseRate === 0) &&
                  retryCount < maxRetries
                ) {
                  setTimeout(() => {
                    retryLoadProgress(retryCount + 1, maxRetries);
                  }, 2000 * (retryCount + 1)); // 재시도마다 대기 시간 증가 (2초, 4초, 6초)
                } else if (
                  todayProgressItem &&
                  todayProgressItem.exerciseRate === 100
                ) {
                  console.log(
                    "[PROGRESS] exerciseRate 업데이트 확인됨:",
                    todayProgressItem
                  );
                }
              }
            } catch (error) {
              console.error(
                `[PROGRESS] 진행률 확인 실패 (재시도 ${retryCount}/${maxRetries}):`,
                error
              );
              if (retryCount < maxRetries) {
                setTimeout(() => {
                  retryLoadProgress(retryCount + 1, maxRetries);
                }, 2000 * (retryCount + 1));
              }
            }
          }, 1000);
        } catch (error) {
          console.error(
            `[PROGRESS] 운동 제목 저장 후 주간 진행률 새로고침 실패 (재시도 ${retryCount}/${maxRetries}):`,
            error
          );
          if (retryCount < maxRetries) {
            setTimeout(() => {
              retryLoadProgress(retryCount + 1, maxRetries);
            }, 2000 * (retryCount + 1));
          }
        }
      };

      // 첫 시도는 2초 후에
      setTimeout(() => {
        retryLoadProgress(0, 3);
      }, 2000);

      // 모달을 닫은 후 Alert 팝업 표시 (약간의 딜레이를 주어 모달이 완전히 닫힌 후 표시)
      setTimeout(() => {
        Alert.alert("저장 완료", successMessage);
      }, 300);
    } catch (error) {
      console.error("[WORKOUT][SAVE] 저장 실패:", error);
      setCompletionSaveErrorDetail(extractSaveErrorDetail(error));
      Alert.alert(
        "저장 실패",
        "운동 제목 저장에 실패했습니다. 다시 시도해주세요."
      );
    } finally {
      setIsSavingCompletionTitle(false);
    }
  }, [
    completionSummaryTitle,
    userId,
    isSavingCompletionTitle,
    loadTodayWorkoutTime,
    loadSavedWorkouts,
    loadGoalData,
    loadWeeklyCalories,
    extractSaveErrorDetail,
    completedExercises,
    exerciseFeedbacks,
  ]);

  // 특정 날짜의 진행률 데이터 가져오기
  const getDayProgress = (date: Date): DailyProgressWeekItem | undefined => {
    const dateStr = formatDateToString(date);
    // 먼저 월별 데이터에서 찾고, 없으면 주간 데이터에서 찾기
    return (
      monthlyProgress.find((item) => item.date === dateStr) ||
      weeklyProgress.find((item) => item.date === dateStr)
    );
  };

  // 달력에 표시할 날짜들의 칼로리 데이터 로드
  const loadCalendarCalories = async (dates: string[]) => {
    try {
      console.log(
        "📅 [운동 화면] 달력 칼로리 데이터 로드 시작:",
        dates.length,
        "일"
      );

      // 각 날짜에 대해 영양성분 요약 조회 (병렬 처리)
      const nutritionPromises = dates.map(async (date, index) => {
        try {
          console.log(
            `📡 [운동 화면] ${index + 1}/${
              dates.length
            } - ${date} 영양성분 조회 중...`
          );
          const summary = await mealAPI.getNutritionSummary(date);
          const calories = summary.calories || 0;
          console.log(
            `✅ [운동 화면] ${index + 1}/${
              dates.length
            } - ${date} 칼로리: ${calories}kcal`
          );
          return { date, calories };
        } catch (error) {
          console.error(
            `❌ [운동 화면] ${index + 1}/${
              dates.length
            } - ${date} 영양성분 조회 실패:`,
            error
          );
          return { date, calories: 0 };
        }
      });

      const nutritionResults = await Promise.all(nutritionPromises);
      console.log(
        "📅 [운동 화면] 달력 칼로리 데이터 조회 완료:",
        nutritionResults.length,
        "일"
      );

      // 상태 업데이트
      const caloriesMap: Record<string, number> = {};
      nutritionResults.forEach(({ date, calories }) => {
        caloriesMap[date] = calories;
      });

      setCalendarCalories((prev) => ({ ...prev, ...caloriesMap }));
    } catch (error) {
      console.error("❌ [운동 화면] 달력 칼로리 데이터 로드 실패:", error);
    }
  };

  // 월별 데이터 로드
  const loadMonthlyProgress = async (year: number, month: number) => {
    try {
      const yearMonth = `${year}-${String(month + 1).padStart(2, "0")}`;
      const data = await fetchMonthlyProgress(yearMonth);
      setMonthlyProgress(Array.isArray(data) ? data : []);
    } catch (e) {
      console.error("월별 진행률 로드 실패:", e);
      setMonthlyProgress([]);
    }
  };

  // monthBase가 변경될 때 월별 데이터 로드 (달력이 펼쳐져 있을 때만)
  React.useEffect(() => {
    if (showMonthView) {
      loadMonthlyProgress(monthBase.getFullYear(), monthBase.getMonth());

      // 해당 월의 모든 날짜에 대해 칼로리 데이터 로드
      const year = monthBase.getFullYear();
      const month = monthBase.getMonth();
      const firstOfMonth = new Date(year, month, 1);
      const nextMonth = new Date(year, month + 1, 1);
      const daysInMonth = Math.round(
        (nextMonth.getTime() - firstOfMonth.getTime()) / (1000 * 60 * 60 * 24)
      );
      const monthDates = Array.from({ length: daysInMonth }).map((_, i) => {
        const d = new Date(year, month, i + 1);
        return formatDateToString(d);
      });
      loadCalendarCalories(monthDates);
    }
  }, [monthBase, showMonthView]);

  // 달력을 펼치거나 접을 때 해당 달의 월별 데이터 가져오기
  React.useEffect(() => {
    const dateToFetch = selectedDate || new Date();
    if (showMonthView) {
      // 달력을 펼칠 때 monthBase의 달 데이터 가져오기
      loadMonthlyProgress(monthBase.getFullYear(), monthBase.getMonth());

      // 해당 월의 모든 날짜에 대해 칼로리 데이터 로드
      const year = monthBase.getFullYear();
      const month = monthBase.getMonth();
      const firstOfMonth = new Date(year, month, 1);
      const nextMonth = new Date(year, month + 1, 1);
      const daysInMonth = Math.round(
        (nextMonth.getTime() - firstOfMonth.getTime()) / (1000 * 60 * 60 * 24)
      );
      const monthDates = Array.from({ length: daysInMonth }).map((_, i) => {
        const d = new Date(year, month, i + 1);
        return formatDateToString(d);
      });
      loadCalendarCalories(monthDates);
    } else {
      // 달력을 접을 때 선택된 날짜의 달 데이터 가져오기 (주간 달력 표시 시)
      loadMonthlyProgress(dateToFetch.getFullYear(), dateToFetch.getMonth());

      // 이번 주의 날짜 범위 계산 (일~토)
      const getStartOfWeek = (d: Date) => {
        const n = new Date(d.getFullYear(), d.getMonth(), d.getDate());
        const diff = n.getDay();
        n.setDate(n.getDate() - diff);
        return n;
      };
      const startOfWeek = getStartOfWeek(dateToFetch);
      const weekDates = Array.from({ length: 7 }).map((_, i) => {
        const d = new Date(
          startOfWeek.getFullYear(),
          startOfWeek.getMonth(),
          startOfWeek.getDate() + i
        );
        return formatDateToString(d);
      });
      loadCalendarCalories(weekDates);
    }
  }, [showMonthView, selectedDate]);

  // 선택된 날짜가 변경될 때 해당 달의 월별 데이터 가져오기
  React.useEffect(() => {
    const dateToFetch = selectedDate || new Date();
    loadMonthlyProgress(dateToFetch.getFullYear(), dateToFetch.getMonth());

    // 주간 달력인 경우 이번 주 7일의 칼로리 데이터 로드
    if (!showMonthView) {
      const getStartOfWeek = (d: Date) => {
        const n = new Date(d.getFullYear(), d.getMonth(), d.getDate());
        const diff = n.getDay();
        n.setDate(n.getDate() - diff);
        return n;
      };
      const startOfWeek = getStartOfWeek(dateToFetch);
      const weekDates = Array.from({ length: 7 }).map((_, i) => {
        const d = new Date(
          startOfWeek.getFullYear(),
          startOfWeek.getMonth(),
          startOfWeek.getDate() + i
        );
        return formatDateToString(d);
      });
      loadCalendarCalories(weekDates);
    }
  }, [selectedDate, showMonthView]);

  // 화면 포커스 시 목표/진행 재로딩
  // 다른 페이지에 갔다 오거나 식단 기록을 갔다 왔을 때, 탭 바꾸기 등 모든 행동 시
  // 해당 달의 모든 데이터 가져오기
  useFocusEffect(
    React.useCallback(() => {
      if (!userIdLoaded) return;

      // StatsScreen에서 날짜 처리를 하므로 여기서는 날짜를 변경하지 않음
      // 단지 현재 선택된 날짜를 사용하여 데이터 로드
      const dateToFetch = selectedDate || new Date();
      setMonthBase(
        new Date(dateToFetch.getFullYear(), dateToFetch.getMonth(), 1)
      );

      loadGoalData();
      loadWeeklyCalories();
      loadTodayProgress(); // 오늘 진행률 로드 (게이지 업데이트)
      // 해당 달의 월별 데이터 가져오기
      loadMonthlyProgress(dateToFetch.getFullYear(), dateToFetch.getMonth());

      // 달력 칼로리 데이터 새로고침
      const dateToUse = selectedDate || new Date();
      if (showMonthView) {
        // 월간 달력인 경우 해당 월의 모든 날짜
        const year = dateToUse.getFullYear();
        const month = dateToUse.getMonth();
        const firstOfMonth = new Date(year, month, 1);
        const nextMonth = new Date(year, month + 1, 1);
        const daysInMonth = Math.round(
          (nextMonth.getTime() - firstOfMonth.getTime()) / (1000 * 60 * 60 * 24)
        );
        const monthDates = Array.from({ length: daysInMonth }).map((_, i) => {
          const d = new Date(year, month, i + 1);
          return formatDateToString(d);
        });
        loadCalendarCalories(monthDates);
      } else {
        // 주간 달력인 경우 이번 주 7일
        const getStartOfWeek = (d: Date) => {
          const n = new Date(d.getFullYear(), d.getMonth(), d.getDate());
          const diff = n.getDay();
          n.setDate(n.getDate() - diff);
          return n;
        };
        const startOfWeek = getStartOfWeek(dateToUse);
        const weekDates = Array.from({ length: 7 }).map((_, i) => {
          const d = new Date(
            startOfWeek.getFullYear(),
            startOfWeek.getMonth(),
            startOfWeek.getDate() + i
          );
          return formatDateToString(d);
        });
        loadCalendarCalories(weekDates);
      }
    }, [
      userIdLoaded,
      loadGoalData,
      loadWeeklyCalories,
      loadTodayProgress,
      showMonthView,
      selectedDate,
    ])
  );

  // 완료 횟수 저장 helper
  const setCompletedCountPersist = async (count: number) => {
    try {
      setCompletedThisWeek(count);
      if (!userIdLoaded) return;
      await AsyncStorage.setItem(
        getStorageKey(COMPLETED_COUNT_KEY_BASE),
        String(count)
      );
    } catch {}
  };

  // 서버 목록 섹션 제거됨

  const getProgressPercentage = React.useMemo(() => {
    // GET /api/daily-progress/today API의 exerciseRate 사용
    if (!todayProgress) {
      if (__DEV__) {
        console.log("[PROGRESS] todayProgress 없음, 0% 반환");
      }
      return 0;
    }

    const exerciseRate = todayProgress.exerciseRate || 0;
    const finalProgress = Math.min(100, Math.max(0, Math.round(exerciseRate)));

    if (__DEV__) {
      console.log("[PROGRESS] 오늘 진행률 (API에서 가져온 값):", {
        exerciseRate,
        finalProgress,
        todayProgress,
      });
    }

    return finalProgress;
  }, [todayProgress]);

  const loadStretchExercises = React.useCallback(async () => {
    setStretchLoading(true);
    setStretchError(null);
    try {
      const response = await fetchExercises({
        keyword: "스트레칭",
        size: 30,
        page: 0,
      });
      const list = response?.content || [];
      setStretchOptions(list);
    } catch (error) {
      console.error("[EXERCISE] 스트레칭 목록 로드 실패:", error);
      setStretchError("스트레칭 목록을 불러오지 못했습니다.");
      setStretchOptions([]);
    } finally {
      setStretchLoading(false);
    }
  }, []);

  const resetStretchFlowState = () => {
    setSelectedStretchIds([]);
    setSelectedStretches([]);
    setStretchDetailIndex(0);
    setStretchDetails({});
    setStretchDetailsLoading({});
  };

  const openExerciseEntry = () => {
    // 운동 추가 시 시작 시간 기록 (새로운 세션 시작)
    setWorkoutStartTime(todayTotalWorkoutSeconds);
    // 현재 운동의 시작 시간도 기록 (각 운동별 시간 추적)
    setCurrentExerciseStartTime(todayTotalWorkoutSeconds);
    // 실제 타임스탬프 기록 (실제 운동 시간 계산용)
    setCurrentExerciseStartTimestamp(Date.now());
    resetStretchFlowState();
    setIntroStage("intro");
    setIsIntroVisible(false);
    setModalMode("add");
    setSelectedExercise(null);
    setIsModalOpen(true);
  };

  const handleStretchButtonPress = () => {
    resetStretchFlowState();
    setIntroStage("stretch");
    setIsIntroVisible(true);
    loadStretchExercises();
  };

  const handleWorkoutStartPress = () => {
    openExerciseEntry();
  };

  const handleStartWorkoutSequence = () => {
    // 저장된 운동(saveTitle이 있는)은 제외하고 진행 가능한 운동만 필터링
    const availableActivities = workoutActivities.filter(
      (activity) => !activity.saveTitle || activity.saveTitle.trim() === ""
    );

    if (availableActivities.length === 0) {
      handleWorkoutStartPress();
      return;
    }

    // 운동 시작 시점의 누적 시간 기록 (현재 세션 시간 계산을 위해)
    setWorkoutStartTime(todayTotalWorkoutSeconds);
    // 현재 운동의 시작 시간도 기록 (각 운동별 시간 추적)
    setCurrentExerciseStartTime(todayTotalWorkoutSeconds);
    // 실제 타임스탬프 기록 (실제 운동 시간 계산용)
    setCurrentExerciseStartTimestamp(Date.now());

    // 아직 완료하지 않은 첫 번째 운동을 찾음
    const nextActivity =
      availableActivities.find(
        (activity) => !isActivityFullyCompleted(activity)
      ) || availableActivities[0];

    const nextIndex = availableActivities.findIndex(
      (activity) => activity.id === nextActivity.id
    );

    // 이미지 찾기
    const resolvedImageUrl =
      nextActivity.imageUrl ||
      (nextActivity.externalId
        ? exerciseImages[nextActivity.externalId]
        : null) ||
      (nextActivity.name
        ? exerciseImagesByName[nextActivity.name.toLowerCase()]
        : null);

    // ✅이미지 포함된 객체 생성
    const activityWithImage = {
      ...nextActivity,
      imageUrl: resolvedImageUrl || undefined,
    };

    // 저장된 운동을 제외한 운동 목록만 시퀀스에 설정
    setExerciseSequence(availableActivities);
    setExerciseSequenceIndex(nextIndex);
    setModalMode("edit");
    setSelectedExercise(activityWithImage);
    setIsModalOpen(true);
  };

  const handleSequenceNavigate = (direction: "prev" | "next") => {
    if (!exerciseSequence.length) return;
    const delta = direction === "next" ? 1 : -1;
    const newIndex = exerciseSequenceIndex + delta;
    if (newIndex < 0 || newIndex >= exerciseSequence.length) return;
    const nextExercise = exerciseSequence[newIndex];
    setExerciseSequenceIndex(newIndex);
    setSelectedExercise(nextExercise);
  };

  const sequenceActivitiesWithLatestSets = React.useMemo(() => {
    if (exerciseSequence.length === 0) return [];

    const findLatestMatch = (seq: Activity) => {
      const byId = workoutActivities.find((act) => act.id === seq.id);
      if (byId) return byId;

      if (seq.sessionId) {
        const bySession = workoutActivities.find(
          (act) => act.sessionId && act.sessionId === seq.sessionId
        );
        if (bySession) return bySession;
      }

      if (seq.externalId && seq.name) {
        const byExternal = workoutActivities.find(
          (act) => act.externalId === seq.externalId && act.name === seq.name
        );
        if (byExternal) return byExternal;
      }

      return null;
    };

    return exerciseSequence.map((seq) => {
      const latest = findLatestMatch(seq);
      const target = latest || seq; // 최신 데이터가 있으면 사용

      // 백그라운드에서 로딩된 이미지 찾기
      const resolvedImageUrl =
        target.imageUrl ||
        (target.externalId ? exerciseImages[target.externalId] : null) ||
        (target.name ? exerciseImagesByName[target.name.toLowerCase()] : null);

      // 데이터 합치기
      return {
        ...seq,
        ...latest,
        sets: latest?.sets || seq.sets,
        isCompleted:
          typeof latest?.isCompleted === "boolean"
            ? latest.isCompleted
            : seq.isCompleted,
        imageUrl: resolvedImageUrl || undefined, //  이미지 주입
      };
    });
  }, [
    exerciseSequence,
    workoutActivities,
    exerciseImages,
    exerciseImagesByName,
  ]);

  const handleStretchOptionSelect = () => {
    setShowAddOptions(false);
    handleStretchButtonPress();
  };

  const handleWorkoutOptionSelect = () => {
    setShowAddOptions(false);
    handleWorkoutStartPress();
  };

  const getStretchIdentifier = React.useCallback((option: any): string => {
    if (!option) return "";
    const candidates = [
      option.externalId,
      option.id,
      option.exerciseId,
      option.code,
      option.name,
    ];
    for (const candidate of candidates) {
      if (candidate && typeof candidate === "string") {
        return candidate;
      }
      if (typeof candidate === "number") {
        return String(candidate);
      }
    }
    return "";
  }, []);

  const handleStretchToggle = (option: any) => {
    const id = getStretchIdentifier(option);
    if (!id) return;
    setSelectedStretchIds((prev) =>
      prev.includes(id) ? prev.filter((item) => item !== id) : [...prev, id]
    );
  };

  const handleStretchSkip = () => {
    resetStretchFlowState();
    setIntroStage("intro");
    setIsIntroVisible(false);
  };

  const handleStretchConfirm = async () => {
    if (selectedStretchIds.length === 0) {
      handleStretchSkip();
      return;
    }
    const selectedItems = stretchOptions.filter((option) =>
      selectedStretchIds.includes(getStretchIdentifier(option))
    );
    if (selectedItems.length === 0) {
      handleStretchSkip();
      return;
    }
    setSelectedStretches(selectedItems);
    setStretchDetailIndex(0);
    setIntroStage("detail");

    // 선택한 모든 스트레칭의 상세 정보를 미리 가져오기
    for (const item of selectedItems) {
      const externalId = item?.externalId || getStretchIdentifier(item);
      if (!externalId || stretchDetails[externalId]) continue;

      setStretchDetailsLoading((prev) => ({ ...prev, [externalId]: true }));
      try {
        const detail = await fetchExerciseDetail(externalId);
        setStretchDetails((prev) => ({ ...prev, [externalId]: detail }));
      } catch (error) {
        console.error(`[STRETCH] 상세 정보 로드 실패: ${externalId}`, error);
      } finally {
        setStretchDetailsLoading((prev) => ({ ...prev, [externalId]: false }));
      }
    }
  };

  const handleStretchDetailComplete = () => {
    const baseDate = selectedDate || new Date();
    const dateStr = formatDateToString(baseDate);
    const now = new Date();
    const newActivities: Activity[] = selectedStretches.map((option, index) => {
      const baseName = option?.name || option?.exerciseName || "스트레칭 루틴";
      const detailParts = [option?.bodyPart, option?.targetMuscle].filter(
        Boolean
      );
      const details =
        detailParts.length > 0
          ? `${detailParts.join(" · ")} 스트레칭`
          : "스트레칭 루틴";
      const time = new Date(now);
      time.setMinutes(now.getMinutes() + index);
      const timeStr = time.toLocaleTimeString("ko-KR", {
        hour: "2-digit",
        minute: "2-digit",
        hour12: true,
      });
      // 스트레칭 이미지 정보 가져오기
      const externalId = option?.externalId || getStretchIdentifier(option);
      const stretchDetail = externalId ? stretchDetails[externalId] : null;
      const imageUrl =
        option?.imageUrl ||
        option?.image ||
        option?.imgUrl ||
        option?.photoUrl ||
        option?.thumbnailUrl ||
        stretchDetail?.imageUrl ||
        stretchDetail?.image ||
        stretchDetail?.imgUrl ||
        stretchDetail?.photoUrl ||
        stretchDetail?.thumbnailUrl;

      return {
        id: Date.now() + index,
        name: baseName,
        details,
        time: timeStr,
        date: dateStr,
        isCompleted: true, // 스트레칭 완료 시 완료 상태로 설정
        sets: [],
        imageUrl: imageUrl,
        externalId: externalId,
      };
    });
    setAllActivities((prev) => [...prev, ...newActivities]);

    // 완료된 스트레칭 ID를 추가 (검정색으로 표시하기 위함)
    setCompletedStretchIds((prev) => {
      const newSet = new Set(prev);
      selectedStretches.forEach((stretch) => {
        const id = getStretchIdentifier(stretch);
        if (id) {
          newSet.add(id);
        }
      });
      return newSet;
    });

    // 상태 정리
    setSelectedStretchIds([]);
    setSelectedStretches([]);
    setStretchDetailIndex(0);
    setStretchDetails({});
    setStretchDetailsLoading({});

    // 스트레칭 완료 후 기록 화면으로 복귀
    setIntroStage("intro");
    setIsIntroVisible(false);
  };

  const handleStretchDetailNext = () => {
    if (stretchDetailIndex < selectedStretches.length - 1) {
      setStretchDetailIndex(stretchDetailIndex + 1);
    }
  };

  const handleStretchDetailPrev = () => {
    if (stretchDetailIndex > 0) {
      setStretchDetailIndex(stretchDetailIndex - 1);
    }
  };

  useEffect(() => {
    if (introStage !== "detail") {
      setStretchTimer(30);
      return;
    }

    setStretchTimer(30);
    const intervalId = setInterval(() => {
      setStretchTimer((prev) => {
        if (prev <= 1) {
          clearInterval(intervalId);
          return 0;
        }
        return prev - 1;
      });
    }, 1000);

    return () => clearInterval(intervalId);
  }, [introStage, stretchDetailIndex]);

  const handleIntroStart = () => {
    setIntroStage("stretch");
    loadStretchExercises();
  };

  const handleIntroSkip = () => {
    setIsIntroVisible(false);
    setIntroStage("intro");
  };

  // 운동 기록 영속화: 페이지 전환해도 유지되도록 저장/복원
  React.useEffect(() => {
    // userId가 없으면 실행하지 않음
    if (!userIdLoaded) return;

    (async () => {
      try {
        const saved = await AsyncStorage.getItem(
          getStorageKey(ACTIVITIES_KEY_BASE)
        );
        if (saved) {
          const parsed: Activity[] = JSON.parse(saved);
          if (Array.isArray(parsed)) {
            setAllActivities(parsed);
            console.log("✅ [LOAD] 저장된 운동 불러오기 완료");
            setInitialLoadComplete(true); // 로딩 완료 신호!
            return;
          }
        }
        setAllActivities([]);
      } catch (e) {
        console.error("데이터 로드 실패", e);
        setAllActivities([]);
      } finally {
        setInitialLoadComplete(true); // 실패해도 로딩은 끝난 것임
      }
    })();
  }, [userIdLoaded, getStorageKey]);

  React.useEffect(() => {
    if (!userIdLoaded) return;
    (async () => {
      try {
        await AsyncStorage.setItem(
          getStorageKey(ACTIVITIES_KEY_BASE),
          JSON.stringify(allActivities)
        );
      } catch {}
    })();
  }, [allActivities, userIdLoaded, getStorageKey]);

  // AI 추천 운동 수신
  useFocusEffect(
    React.useCallback(() => {
      // 1. 로딩 대기
      if (!initialLoadComplete) return;

      // 2. 파라미터 구조 유연하게 확인 (route.params 또는 route.params.params)
      const rawParams = (route.params as any) || {};
      const recommendedExercises =
        rawParams.recommendedExercises ||
        rawParams.params?.recommendedExercises; // 👈 여기가 핵심! 한 단계 더 깊이 확인

      if (
        recommendedExercises &&
        Array.isArray(recommendedExercises) &&
        recommendedExercises.length > 0
      ) {
        console.log(
          `🚀 [AI] 추천 운동 ${recommendedExercises.length}개 수신 성공!`
        );

        // 3. 날짜 동기화
        const routineDateStr = recommendedExercises[0].date;
        if (routineDateStr) {
          const [year, month, day] = routineDateStr.split("-").map(Number);
          const newDate = new Date(year, month - 1, day);

          if (selectedDate?.toDateString() !== newDate.toDateString()) {
            console.log(
              `📅 날짜 이동: ${selectedDate?.toDateString()} -> ${newDate.toDateString()}`
            );
            setSelectedDate(newDate);
            setMonthBase(new Date(year, month - 1, 1));
          }
        }

        // 4. 데이터 추가
        setAllActivities((prev) => {
          const existingGroupKey = recommendedExercises[0]?.groupKey;
          const alreadyExists = prev.some(
            (activity) => activity.groupKey === existingGroupKey
          );

          if (alreadyExists) {
            console.log("⚠️ [AI] 이미 추가된 루틴입니다.");
            return prev;
          }

          console.log("✅ [AI] 리스트에 운동 추가 완료!");
          return [...prev, ...recommendedExercises];
        });

        // 5. 파라미터 초기화 (재실행 방지)
        navigation.setParams({
          recommendedExercises: undefined,
          params: undefined, // 중첩된 params도 초기화
        });

        // 6. 알림
        setTimeout(() => {
          Alert.alert(
            "루틴 추가 완료",
            "AI 추천 운동이 리스트에 추가되었습니다!",
            [{ text: "확인" }]
          );
        }, 500);
      }
    }, [initialLoadComplete, route.params, selectedDate])
  );
  // (임시 API 테스트 버튼 제거)

  //클릭 시 찾아놓은 이미지를 합쳐서 모달에 전달
  const handleExerciseClick = (exercise: Activity) => {
    // 저장된 운동(saveTitle이 있는)은 클릭해도 모달을 열지 않음 (완료 상태로 유지)
    if (exercise.saveTitle && exercise.saveTitle.trim() !== "") {
      console.log("[EXERCISE] 저장된 운동은 클릭 불가:", {
        name: exercise.name,
        saveTitle: exercise.saveTitle,
      });
      return;
    }

    const isCompleted = isActivityFullyCompleted(exercise);
    setModalMode("edit");

    // 저장된 운동(saveTitle이 있는)은 제외하고 진행 가능한 운동만 필터링
    const availableActivities = workoutActivities.filter(
      (activity) => !activity.saveTitle || activity.saveTitle.trim() === ""
    );

    setExerciseSequence(availableActivities);
    const index = availableActivities.findIndex(
      (item) => item.id === exercise.id
    );
    setExerciseSequenceIndex(index);

    // 1. 🔍 이미지를 찾습니다. (기존 이미지 or 백그라운드에서 로딩한 이미지)
    const resolvedImageUrl =
      exercise.imageUrl ||
      (exercise.externalId ? exerciseImages[exercise.externalId] : null) ||
      (exercise.name
        ? exerciseImagesByName[exercise.name.toLowerCase()]
        : null);

    // 2. 저장된 운동 기록에서 세트 정보 불러오기 + 이미지 합치기
    // 👇 imageUrl: resolvedImageUrl || undefined 부분을 추가했습니다.
    let exerciseWithSets = {
      ...exercise,
      imageUrl: resolvedImageUrl || undefined,
    };

    if (exercise.sessionId && savedWorkouts.length > 0) {
      // savedWorkouts에서 해당 sessionId의 세트 정보 찾기
      for (const group of savedWorkouts) {
        for (const session of group.sessions) {
          if (
            session.sessionId === exercise.sessionId &&
            session.records.length > 0
          ) {
            const sets = session.records
              .sort((a, b) => a.setNumber - b.setNumber)
              .map((record, index) => ({
                id: record.id,
                order: record.setNumber || index + 1,
                weight: record.weight,
                reps: record.reps,
                isCompleted: true,
              }));
            exerciseWithSets = {
              ...exerciseWithSets,
              sets: sets,
            };
            break;
          }
        }
      }
    }

    console.log("🖼️ 모달 열기 - 이미지 확인:", exerciseWithSets.imageUrl); // 로그 확인용

    setSelectedExercise(exerciseWithSets);
    setIsModalOpen(true);
    setSelectedExerciseCompleted(isCompleted);
  };

  const handleModalClose = useCallback(() => {
    setIsModalOpen(false);
    setSelectedExercise(null);
    setSelectedExerciseCompleted(false);
    setExerciseSequence([]);
    setExerciseSequenceIndex(-1);
  }, []);

  useEffect(() => {
    if (!isModalOpen) {
      return;
    }
    const onHardwareBack = () => {
      handleModalClose();
      return true;
    };
    const subscription = BackHandler.addEventListener(
      "hardwareBackPress",
      onHardwareBack
    );
    return () => {
      subscription.remove();
    };
  }, [isModalOpen, handleModalClose]);

  const handleExerciseSave = async (
    sets: any[],
    exerciseName: string,
    meta?: { externalId?: string; category?: string; imageUrl?: string },
    comment?: string,
    options?: { keepModalOpen?: boolean; skipServerSave?: boolean }
  ) => {
    const allSetsCompleted = sets.every(
      (set: any) => set.isCompleted || set.completed
    );
    const details = buildDetailsFromSets(sets);
    const trimmedComment =
      comment && typeof comment === "string" ? comment.trim() : "";
    const commentToSave =
      allSetsCompleted && trimmedComment.length > 0
        ? trimmedComment
        : undefined;

    // userId 가져오기 - 다른 화면과 동일한 패턴
    let finalUserId: number | null = null;

    // state의 userId를 숫자로 변환 시도
    if (userId && userId.trim() !== "") {
      const parsed = parseInt(userId, 10);
      if (!isNaN(parsed)) {
        finalUserId = parsed;
        console.log(
          "[WORKOUT][DEBUG] state userId를 숫자로 변환:",
          finalUserId
        );
      }
    }

    // 숫자 변환 실패 시 AsyncStorage에서 가져오기
    if (!finalUserId) {
      const userIdStr = await AsyncStorage.getItem("userId");
      console.log(
        "[WORKOUT][DEBUG] AsyncStorage에서 가져온 userId:",
        userIdStr
      );
      if (userIdStr && userIdStr.trim() !== "") {
        const parsed = parseInt(userIdStr, 10);
        if (!isNaN(parsed)) {
          finalUserId = parsed;
          console.log(
            "[WORKOUT][DEBUG] AsyncStorage userId를 숫자로 변환:",
            finalUserId
          );
        }
      }
    }

    // 숫자 변환 실패 시 JWT에서 userPk 가져오기
    if (!finalUserId) {
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
          console.log("[WORKOUT][DEBUG] JWT payload:", payload);

          // userPk를 우선 확인 (숫자 ID), 그 다음 userId, 마지막으로 sub
          let userIdFromJWT: number | null = null;

          // userPk가 있으면 우선 사용 (숫자)
          if (payload.userPk) {
            const parsed =
              typeof payload.userPk === "number"
                ? payload.userPk
                : parseInt(payload.userPk, 10);
            if (!isNaN(parsed)) {
              userIdFromJWT = parsed;
              console.log(
                "[WORKOUT][DEBUG] JWT에서 userPk 추출:",
                userIdFromJWT
              );
            }
          }

          // userPk가 없거나 숫자가 아니면 userId 확인
          if (!userIdFromJWT && payload.userId) {
            const parsed =
              typeof payload.userId === "number"
                ? payload.userId
                : parseInt(payload.userId, 10);
            if (!isNaN(parsed)) {
              userIdFromJWT = parsed;
              console.log(
                "[WORKOUT][DEBUG] JWT에서 userId 추출:",
                userIdFromJWT
              );
            }
          }

          // userPk와 userId가 모두 없거나 숫자가 아니면 sub 확인
          if (!userIdFromJWT && payload.sub) {
            const parsed = parseInt(payload.sub, 10);
            if (!isNaN(parsed)) {
              userIdFromJWT = parsed;
              console.log("[WORKOUT][DEBUG] JWT에서 sub 추출:", userIdFromJWT);
            }
          }

          if (userIdFromJWT) {
            finalUserId = userIdFromJWT;
            console.log(
              "[WORKOUT][DEBUG] JWT에서 최종 userId 설정:",
              finalUserId
            );
          } else {
            console.warn(
              "[WORKOUT][DEBUG] JWT payload에서 숫자 userId를 찾을 수 없음:",
              payload
            );
          }
        }
      } catch (e) {
        console.error("[WORKOUT][DEBUG] JWT 디코딩 실패:", e);
      }
    }

    console.log(
      "[WORKOUT][DEBUG] 최종 사용할 userId:",
      finalUserId,
      "타입:",
      typeof finalUserId
    );

    // userId가 없으면 에러 처리
    if (!finalUserId) {
      const storedUserId = await AsyncStorage.getItem("userId");
      const token = await AsyncStorage.getItem(ACCESS_TOKEN_KEY);
      let jwtPayloadInfo = "없음";

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
          jwtPayloadInfo = JSON.stringify(payload);
        } catch (e) {
          jwtPayloadInfo = `디코딩 실패: ${e}`;
        }
      }

      console.error("[WORKOUT][DEBUG] userId가 없습니다!", {
        stateUserId: userId,
        asyncStorageUserId: storedUserId,
        jwtPayload: jwtPayloadInfo,
      });
      Alert.alert(
        "오류",
        "사용자 정보를 찾을 수 없습니다. 다시 로그인해주세요."
      );
      return;
    }

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

    // 각 운동에 소요된 시간 계산 (초 단위)
    // 실제 타임스탬프를 사용하여 정확한 운동 시간 계산
    let exerciseSeconds = 0;

    if (currentExerciseStartTimestamp !== null) {
      // 실제 타임스탬프 기반으로 경과 시간 계산 (밀리초 → 초)
      const elapsedMs = Date.now() - currentExerciseStartTimestamp;
      exerciseSeconds = Math.max(1, Math.floor(elapsedMs / 1000)); // 최소 1초
      console.log("[WORKOUT][TIME] 타임스탬프 기반 시간 계산:", {
        exerciseName,
        startTimestamp: currentExerciseStartTimestamp,
        currentTimestamp: Date.now(),
        elapsedMs,
        exerciseSeconds,
      });
    } else if (
      currentExerciseStartTime !== null &&
      todayTotalWorkoutSeconds !== null
    ) {
      // 타임스탬프가 없으면 기존 방식 사용 (하위 호환성)
      const calculatedSeconds = Math.max(
        0,
        todayTotalWorkoutSeconds - currentExerciseStartTime
      );
      if (calculatedSeconds > 0) {
        exerciseSeconds = calculatedSeconds;
      } else {
        // 계산된 시간이 0이면 최소 10초 (운동을 했다면 최소한의 시간은 있어야 함)
        exerciseSeconds = 10;
      }
      console.log("[WORKOUT][TIME] 누적 시간 기반 계산:", {
        exerciseName,
        currentExerciseStartTime,
        todayTotalWorkoutSeconds,
        calculatedSeconds,
        exerciseSeconds,
      });
    } else {
      // 둘 다 없으면 최소 10초 (운동을 했다면 최소한의 시간은 있어야 함)
      exerciseSeconds = 10;
      console.log("[WORKOUT][TIME] 시간 정보 없음, 기본값 사용:", {
        exerciseName,
        exerciseSeconds,
      });
    }

    console.log("[WORKOUT][TIME] 최종 운동 시간:", {
      exerciseName,
      exerciseSeconds,
    });

    // 운동 저장 후 현재 운동 시작 시간을 현재 시간으로 업데이트 (다음 운동을 위해)
    setCurrentExerciseStartTime(todayTotalWorkoutSeconds);
    setCurrentExerciseStartTimestamp(Date.now()); // 다음 운동을 위해 타임스탬프도 업데이트

    const sessionPayload = {
      exerciseName,
      category: meta?.category || "기타",
      workoutDate,
      userId: finalUserId, // 숫자 또는 문자열 userId 사용
      exerciseId: meta?.externalId,
      sets: sets.map((s: any, idx: number) => ({
        setNumber: idx + 1,
        weight: Number(s.weight) || 0,
        reps: Number(s.reps) || 0,
      })),
      seconds: exerciseSeconds, // 각 운동에 소요된 시간 (초 단위)
    };
    console.log("[WORKOUT][LOCAL_SAVE]", sessionPayload);
    console.log(
      `[WORKOUT] To record via API: POST ${API_BASE_URL}/api/workouts { ...payload above... }`
    );

    const skipServerSave = options?.skipServerSave === true;

    // 실제 저장 API 호출
    let serverSessionId: string | undefined;
    if (!skipServerSave) {
      try {
        const res = await postWorkoutSession(sessionPayload as any);
        console.log("[WORKOUT][POST][OK]", res);
        // 서버 응답에서 sessionId 받기 (서버에서 생성)
        serverSessionId = res?.sessionId || res?.data?.sessionId;

        // 운동 저장 후 해당 날짜의 진행률 다시 가져오기
        const activeDateStr = formatDateToString(activeDate);
        const today = new Date();
        const isToday =
          activeDate.getFullYear() === today.getFullYear() &&
          activeDate.getMonth() === today.getMonth() &&
          activeDate.getDate() === today.getDate();

        try {
          let dateProgress: DailyProgressWeekItem;
          if (isToday) {
            dateProgress = await fetchTodayProgress();
          } else {
            dateProgress = await fetchDateProgress(activeDateStr);
          }

          // 주간 진행률 업데이트
          setWeeklyProgress((prev) => {
            const index = prev.findIndex((item) => item.date === activeDateStr);
            if (index >= 0) {
              const updated = [...prev];
              updated[index] = dateProgress;
              return updated;
            } else {
              // 주간 범위에 없으면 추가하지 않음 (주간 API가 자동으로 관리)
              return prev;
            }
          });

          // 주간 진행률 전체를 다시 가져와서 게이지 업데이트
          // 약간의 지연을 두어 서버에 반영될 시간을 줌
          setTimeout(async () => {
            try {
              await loadWeeklyCalories();
              await loadTodayProgress(); // 오늘 진행률 로드 (게이지 업데이트)
            } catch (error) {
              console.error("[PROGRESS] 주간 진행률 새로고침 실패:", error);
            }
          }, 500);

          // 월별 진행률 업데이트
          setMonthlyProgress((prev) => {
            const index = prev.findIndex((item) => item.date === activeDateStr);
            if (index >= 0) {
              const updated = [...prev];
              updated[index] = dateProgress;
              return updated;
            } else {
              // 월별 범위에 없으면 추가
              return [...prev, dateProgress];
            }
          });

          // 해당 달의 월별 데이터 전체 다시 가져오기
          loadMonthlyProgress(activeDate.getFullYear(), activeDate.getMonth());

          // 오늘 날짜인 경우 운동 시간과 진행률 다시 조회 (서버에서 계산된 총 시간 반영)
          if (isToday) {
            try {
              await loadTodayWorkoutTime();
              await loadTodayProgress(); // 오늘 진행률 로드 (게이지 업데이트)
            } catch (timeError) {
              console.error(
                "[WORKOUT][TIME] 운동 시간 재조회 실패:",
                timeError
              );
            }
          }
        } catch (progressError) {
          console.error("진행률 조회 실패:", progressError);
        }
      } catch (e: any) {
        console.error("[WORKOUT][POST][FAIL]", e);
        Alert.alert(
          "운동 기록 저장 실패",
          e?.response?.data?.message || e?.message || "알 수 없는 오류"
        );
        return undefined; // 에러 시 undefined 반환
      }
    }

    // 활동 항목 업데이트
    if (modalMode === "edit" && selectedExercise) {
      if (!skipServerSave) {
        // 이전 완료 상태와 비교하여 카운트 조정
        const prev = activities.find((a) => a.id === selectedExercise.id);
        const prevCompleted = !!prev?.isCompleted;
        const nextCompleted = allSetsCompleted;
        if (prevCompleted !== nextCompleted) {
          const delta = nextCompleted ? 1 : -1;
          setCompletedCountPersist(Math.max(0, completedThisWeek + delta));
        }
      }
      const targetId = selectedExercise.id;
      setAllActivities((prevActivities) =>
        prevActivities.map((activity) =>
          activity.id === targetId
            ? {
                ...activity,
                name: exerciseName,
                details,
                isCompleted: skipServerSave
                  ? activity.isCompleted
                  : allSetsCompleted,
                sessionId: serverSessionId ?? activity.sessionId,
                sets,
                imageUrl: meta?.imageUrl || activity.imageUrl,
                externalId: meta?.externalId || activity.externalId,
                comment:
                  !skipServerSave && allSetsCompleted
                    ? commentToSave
                    : activity.comment,
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
        isCompleted: skipServerSave ? false : allSetsCompleted,
        sessionId: serverSessionId,
        imageUrl: meta?.imageUrl,
        externalId: meta?.externalId,
        sets,
        comment: skipServerSave ? undefined : commentToSave,
      };
      setAllActivities((prevActivities) => [...prevActivities, newWorkout]);
      if (!skipServerSave && allSetsCompleted) {
        setCompletedCountPersist(completedThisWeek + 1);
      }
    }

    // 운동 선택 화면에서 저장한 경우 WorkoutIntroModal 닫기
    if (options?.keepModalOpen) {
      // "종목 추가" 버튼을 눌렀을 때는 모달을 닫지 않고 종목 검색 페이지로 돌아감
      // 모달은 이미 ExerciseModal에서 "add" 모드로 변경되었으므로 여기서는 아무것도 하지 않음
    } else if (introStage === "exercise") {
      setIsIntroVisible(false);
      setIntroStage("intro");
    } else {
      handleModalClose();
    }

    // 운동 저장 후 서버에서 최신 데이터를 가져와서 중복 방지 및 일관성 유지
    if (!skipServerSave && serverSessionId) {
      // 약간의 지연을 두어 서버에 반영될 시간을 줌
      setTimeout(async () => {
        loadSavedWorkouts();
        await loadTodayProgress(); // 오늘 진행률 로드 (게이지 업데이트)
      }, 800);
    }

    // sessionId 반환 (ExerciseModal에서 사용)
    return serverSessionId;
  };

  const handleDeleteWorkout = (workoutId: number, sessionId?: string) => {
    Alert.alert("운동 삭제", "이 운동을 삭제하시겠습니까?", [
      { text: "취소", style: "cancel" },
      {
        text: "삭제",
        style: "destructive",
        onPress: async () => {
          try {
            // 서버 API 호출 (sessionId가 있으면)
            if (sessionId) {
              await deleteWorkoutSession(sessionId);
              console.log("[WORKOUT][DELETE] 서버 삭제 완료:", sessionId);
            }

            // UI에서 제거
            setAllActivities((prev) =>
              prev.filter((activity) => activity.id !== workoutId)
            );
          } catch (e) {
            console.error("[WORKOUT][DELETE] 삭제 실패:", e);
            Alert.alert("오류", "운동 삭제 중 오류가 발생했습니다.");
          }
        },
      },
    ]);
  };

  // 현재 선택된 날짜에 대해, 저장된 모든 운동 제목/세션을 한 번에 삭제
  const handleDeleteAllSavedWorkoutsForSelectedDate = () => {
    if (!savedWorkouts || savedWorkouts.length === 0) {
      return;
    }

    Alert.alert(
      "저장된 운동 전체 삭제",
      "현재 날짜에 저장된 모든 운동 제목과 기록을 삭제할까요? 이 작업은 되돌릴 수 없습니다.",
      [
        { text: "취소", style: "cancel" },
        {
          text: "삭제",
          style: "destructive",
          onPress: async () => {
            try {
              // savedWorkouts 에서 sessionId / 운동명 / 날짜를 모두 수집
              const sessionMetaMap = new Map<
                string,
                { exerciseName?: string; workoutDate?: string }
              >();

              savedWorkouts.forEach((group) => {
                group.sessions?.forEach((session) => {
                  if (!session?.sessionId) return;
                  if (!sessionMetaMap.has(session.sessionId)) {
                    const firstRecord = session.records?.[0];
                    sessionMetaMap.set(session.sessionId, {
                      exerciseName: firstRecord?.exerciseName,
                      workoutDate: firstRecord?.workoutDate,
                    });
                  }
                });
              });

              for (const [sessionId, meta] of sessionMetaMap.entries()) {
                try {
                  const res = await deleteWorkoutSession(sessionId);
                  console.log("[WORKOUT][DELETE_ALL][OK]", sessionId, res);

                  eventBus.emit("workoutSessionDeleted", {
                    sessionId,
                    exerciseName: meta.exerciseName,
                    workoutDate: meta.workoutDate,
                  });
                } catch (error) {
                  console.error(
                    "[WORKOUT][DELETE_ALL][FAIL] 세션 삭제 실패:",
                    sessionId,
                    error
                  );
                }
              }

              // 로컬 상태 정리: 저장된 제목 + 타임라인 둘 다 비우기
              setSavedWorkouts([]);
              const targetDateStr = selectedDate
                ? formatDateToString(selectedDate)
                : null;

              setAllActivities((prev) =>
                prev.filter((activity) => {
                  // 선택된 날짜의 운동은 모두 제거 (세션이 있든 없든)
                  if (
                    targetDateStr &&
                    activity.date &&
                    activity.date === targetDateStr
                  ) {
                    return false;
                  }
                  return true;
                })
              );

              // 오늘 날짜라면 홈/분석 쪽에서도 시간이 바로 0으로 반영되도록
              try {
                await loadTodayWorkoutTime();
              } catch (e) {
                console.error(
                  "[WORKOUT][DELETE_ALL] 오늘 운동 시간 재조회 실패:",
                  e
                );
              }
            } catch (error) {
              console.error("[WORKOUT][DELETE_ALL] 전체 삭제 실패:", error);
            }
          },
        },
      ]
    );
  };

  // StatsScreen 내부에서 사용될 때는 SafeAreaView 제거
  const ContainerComponent = View;

  return (
    <ContainerComponent style={styles.container}>
      <ScrollView
        style={styles.content}
        contentContainerStyle={styles.contentContainer}
      >
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
                          const dateStr = formatDateToString(d);
                          // 달력 칼로리 데이터 우선 사용, 없으면 진행률 데이터 사용
                          const calories =
                            calendarCalories[dateStr] ??
                            dayProgress?.totalCalorie ??
                            0;
                          const rate = dayProgress?.exerciseRate || 0;
                          return (
                            <>
                              <Text
                                style={[
                                  styles.calendarCalories,
                                  !isCurrentMonth && styles.monthMuted,
                                ]}
                              >
                                {calories > 0 ? `${Math.round(calories)}k` : ""}
                              </Text>
                              <Text
                                style={[
                                  styles.calendarPercentage,
                                  !isCurrentMonth && styles.monthMuted,
                                ]}
                              >
                                {rate > 0 ? `${Math.round(rate)}%` : ""}
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
                      <View style={styles.calendarNumber}>
                        <View
                          style={[
                            styles.calendarNumberInner,
                            isSelected && styles.calendarNumberSelected,
                            isToday && styles.calendarNumberToday,
                          ]}
                        >
                          <Text
                            style={[
                              styles.calendarNumberText,
                              isSelected && styles.calendarNumberSelectedText,
                              isToday && styles.calendarNumberTodayText,
                            ]}
                          >
                            {label}
                          </Text>
                        </View>
                      </View>
                      {(() => {
                        const dayProgress = getDayProgress(d);
                        const dateStr = formatDateToString(d);
                        // 달력 칼로리 데이터 우선 사용, 없으면 진행률 데이터 사용
                        const calories =
                          calendarCalories[dateStr] ??
                          dayProgress?.totalCalorie ??
                          0;
                        const rate = dayProgress?.exerciseRate || 0;
                        return (
                          <>
                            <Text style={styles.calendarCalories}>
                              {calories > 0 ? `${Math.round(calories)}k` : ""}
                            </Text>
                            <Text style={styles.calendarPercentage}>
                              {rate > 0 ? `${Math.round(rate)}%` : ""}
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
            <Text style={styles.goalTitle}>주간 운동 목표 설정</Text>
            <Text style={styles.goalDescription}>{goalSummaryText}</Text>
            <View style={styles.progressContainer}>
              <View style={styles.progressBar}>
                <View
                  style={[
                    styles.progressFill,
                    {
                      width: `${Math.max(
                        0,
                        Math.min(100, getProgressPercentage)
                      )}%`,
                    },
                  ]}
                />
              </View>
              <Text style={styles.progressText}>
                {Math.max(0, Math.min(100, getProgressPercentage))}%
              </Text>
            </View>
          </View>
          <Icon name="chevron-forward" size={18} color={colors.text} />
        </TouchableOpacity>

        {/* 운동 기록 섹션 */}
        <View style={styles.logSection}>
          <View style={styles.sectionTitleRow}>
            <Text style={styles.sectionTitle}>운동 기록하기</Text>
            <View
              style={{ flexDirection: "row", alignItems: "center", gap: 8 }}
            >
              {hasIncompleteActivities && workoutActivities.length > 0 ? (
                <TouchableOpacity
                  style={styles.startWorkoutButton}
                  onPress={handleStartWorkoutSequence}
                >
                  <Text style={styles.startWorkoutButtonText}>시작</Text>
                </TouchableOpacity>
              ) : null}
            </View>
          </View>

          <View style={styles.logTimeline}>
            {orderedActivities.map((activity, index) => {
              const activityCompleted = isActivityFullyCompleted(activity);
              const meta = groupedActivityMeta.get(activity.id);
              const groupInfo = meta
                ? {
                    title: meta.title,
                    isFirst: meta.isFirst,
                    isLast: meta.isLast,
                    sessionIds: meta.sessionIds,
                  }
                : null;
              const isSavedRecord = !!groupInfo;
              const isAIRecommended =
                activity.saveTitle?.includes("AI 추천") ||
                groupInfo?.title?.includes("AI 추천") ||
                false;

              const showCompletedVisuals = activityCompleted && !isSavedRecord;
              const detailText = cleanExerciseDetails(activity.details);
              const savedTime =
                activity.sessionId &&
                savedSessionTimes.get(activity.sessionId || "");
              const displayTime = activityCompleted
                ? isSavedRecord
                  ? ""
                  : activity.time
                : "";

              const nameStyles: Array<TextStyle | undefined> = [styles.logName];
              if (!activityCompleted) {
                nameStyles.push(styles.logNamePending);
              } else if (showCompletedVisuals) {
                nameStyles.push(styles.logNameCompleted);
              }
              if (isSavedRecord) {
                nameStyles.push(styles.logNameSaved);
              }

              const groupSavedTime =
                groupInfo?.sessionIds
                  ?.map((id) => (id ? savedSessionTimes.get(id) : ""))
                  ?.find((time) => !!time) || "";

              return (
                <View key={activity.id}>
                  {groupInfo?.isFirst && (
                    <View
                      style={[
                        styles.logGroupHeader,
                        isAIRecommended && styles.logGroupHeaderAI, // ✅ AI 추천용 스타일
                      ]}
                    >
                      <Text style={styles.logGroupTitle}>
                        {groupInfo.title}
                      </Text>
                      {groupSavedTime ? (
                        <Text style={styles.logGroupTime}>
                          {groupSavedTime}
                        </Text>
                      ) : null}
                    </View>
                  )}
                  <View
                    style={[
                      styles.logItem,
                      groupInfo && styles.logItemGrouped,
                      groupInfo?.isFirst && styles.logItemGroupFirst,
                      groupInfo?.isLast && styles.logItemGroupLast,
                    ]}
                  >
                    <TouchableOpacity
                      style={[
                        styles.logCard,
                        showCompletedVisuals
                          ? styles.logCardCompleted
                          : styles.logCardPending,
                        groupInfo && styles.logCardGrouped,
                        groupInfo?.isFirst && styles.logCardGroupFirst,
                        groupInfo?.isLast && styles.logCardGroupLast,
                        isAIRecommended && groupInfo && styles.logCardGroupedAI,
                        isAIRecommended &&
                          groupInfo?.isFirst &&
                          styles.logCardGroupFirstAI,
                        isAIRecommended &&
                          groupInfo?.isLast &&
                          styles.logCardGroupLastAI,
                      ]}
                      onPress={() => handleExerciseClick(activity)}
                    >
                      <View style={styles.logCardContent}>
                        {/* 운동 이미지 */}
                        {(() => {
                          const imageUrl =
                            activity.imageUrl ||
                            (activity.externalId
                              ? exerciseImages[activity.externalId]
                              : null) ||
                            (activity.name
                              ? exerciseImagesByName[
                                  activity.name.toLowerCase()
                                ]
                              : null);

                          if (imageUrl) {
                            return (
                              <Image
                                source={{ uri: imageUrl }}
                                style={styles.logCardImage}
                                resizeMode="cover"
                                onError={(error) => {
                                  console.warn("[EXERCISE] 이미지 로딩 실패:", {
                                    imageUrl,
                                    activityName: activity.name,
                                    externalId: activity.externalId,
                                    error: error.nativeEvent.error,
                                  });
                                }}
                              />
                            );
                          }
                          return (
                            <View style={styles.logCardImagePlaceholder}>
                              <Icon
                                name="barbell"
                                size={24}
                                color={colors.textLight}
                              />
                            </View>
                          );
                        })()}
                        <View style={styles.logTextBlock}>
                          <View style={styles.logTextHeader}>
                            <Text style={nameStyles}>{activity.name}</Text>
                            {displayTime ? (
                              <Text
                                style={[
                                  styles.logTime,
                                  showCompletedVisuals &&
                                    styles.logTimeCompleted,
                                ]}
                              >
                                {displayTime}
                              </Text>
                            ) : null}
                          </View>
                          {detailText ? (
                            <Text
                              style={[
                                styles.logDetails,
                                showCompletedVisuals &&
                                  styles.logDetailsCompleted,
                              ]}
                              numberOfLines={1}
                              ellipsizeMode="tail"
                            >
                              {detailText}
                            </Text>
                          ) : null}
                        </View>
                      </View>
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
                </View>
              );
            })}
          </View>
        </View>

        {/* 서버 기록 섹션 제거됨 */}
      </ScrollView>

      {/* 오늘 날짜일 때만 + 버튼 표시 */}
      {(() => {
        const today = new Date();
        const todayStr = formatDateToString(today);
        const selectedDateStr = selectedDate
          ? formatDateToString(selectedDate)
          : null;
        const isToday = selectedDateStr === todayStr;

        if (!isToday) {
          return null; // 오늘이 아니면 + 버튼 숨김
        }

        return (
          <>
            {showAddOptions && (
              <TouchableWithoutFeedback
                onPress={() => setShowAddOptions(false)}
              >
                <View style={styles.fabBackdrop} />
              </TouchableWithoutFeedback>
            )}
            <View style={styles.fabWrapper}>
              {showAddOptions && (
                <View style={styles.fabOptions}>
                  <TouchableOpacity
                    style={styles.fabOptionButton}
                    onPress={handleStretchOptionSelect}
                  >
                    <Text style={styles.fabOptionText}>스트레칭</Text>
                  </TouchableOpacity>
                  <TouchableOpacity
                    style={styles.fabOptionButton}
                    onPress={handleWorkoutOptionSelect}
                  >
                    <Text style={styles.fabOptionText}>운동 추가</Text>
                  </TouchableOpacity>
                </View>
              )}
              <TouchableOpacity
                style={styles.fabButton}
                onPress={() => setShowAddOptions((prev) => !prev)}
              >
                <Icon
                  name={showAddOptions ? "close" : "add"}
                  size={28}
                  color={colors.black}
                />
              </TouchableOpacity>
            </View>
          </>
        );
      })()}

      <ExerciseModal
        isOpen={isModalOpen}
        onClose={handleModalClose}
        mode={modalMode}
        exerciseData={selectedExercise}
        sequenceActivities={sequenceActivitiesWithLatestSets}
        sequenceIndex={exerciseSequenceIndex}
        onSequenceNavigate={handleSequenceNavigate}
        onSave={handleExerciseSave}
        isCompleted={selectedExerciseCompleted}
        onWorkoutComplete={async (exercises) => {
          // 이미 저장된 운동들 제외 (savedWorkouts + pendingSavedRefs 기준)
          const savedSessionIds = new Set<string>();
          savedWorkouts.forEach((group) => {
            group.sessions.forEach((session) => {
              if (session.sessionId) {
                savedSessionIds.add(session.sessionId);
              }
            });
          });
          const pendingSessionIds = new Set(pendingSavedRefs.sessionIds);
          const pendingActivityIds = new Set(pendingSavedRefs.activityIds);
          const pendingExternalKeys = new Set(pendingSavedRefs.externalKeys);

          // 방금 완료한 운동들은 모두 표시 (필터링 최소화)
          // 오직 이미 저장된 운동만 제외
          console.log(
            "[EXERCISE][COMPLETE] 완료된 운동 필터링 (첫 번째 위치):",
            {
              totalExercises: exercises.length,
              exercises: exercises.map((ex) => ({
                name: ex.name,
                sessionId: ex.sessionId,
                activityId: ex.activityId,
                externalId: ex.externalId,
              })),
              savedSessionIds: Array.from(savedSessionIds),
              pendingSessionIds: Array.from(pendingSessionIds),
            }
          );

          const filteredExercises = exercises.filter((ex) => {
            const sessionId = ex.sessionId;

            // 이미 저장된 운동인지 확인 (savedSessionIds만 확인, pending은 제외)
            // 방금 완료한 운동은 pending에 있을 수 있으므로 pending은 체크하지 않음
            const alreadySavedBySession =
              sessionId && savedSessionIds.has(sessionId);

            // 이미 저장된 운동만 제외
            return !alreadySavedBySession;
          });

          console.log("[EXERCISE][COMPLETE] 필터링 결과:", {
            totalExercises: exercises.length,
            filteredCount: filteredExercises.length,
            filtered: filteredExercises.map((ex) => ({
              name: ex.name,
              sessionId: ex.sessionId,
            })),
          });

          setCompletedExercises(filteredExercises);
          setCompletionSummaryTitle("오늘의 운동");
          setShowCompletionModal(true);

          // 운동 완료 후 오늘 운동 시간 업데이트 (게이지 업데이트를 위해 필수)
          setTimeout(async () => {
            try {
              await loadTodayWorkoutTime(); // ✅ 오늘 운동 시간 업데이트
              await loadWeeklyCalories();
            } catch (error) {
              console.error(
                "[PROGRESS] 운동 완료 후 주간 진행률 새로고침 실패:",
                error
              );
            }
          }, 500);

          // 운동 완료 후 서버에서 최신 데이터를 가져와서 중복 방지 및 일관성 유지
          // allActivities는 loadSavedWorkouts에서 자동으로 업데이트됨
          setTimeout(() => {
            loadSavedWorkouts();
          }, 500);

          handleModalClose();
        }}
        onFeedbackUpdate={(exerciseName, feedback) => {
          setExerciseFeedbacks((prev) => ({
            ...prev,
            [exerciseName]: feedback,
          }));
        }}
        onSetChange={(exerciseName, sets, meta) => {
          // 세트 변경 시 즉시 allActivities 업데이트
          const allSetsCompleted =
            sets.length > 0 &&
            sets.every((set: any) => set?.isCompleted === true);

          setAllActivities((prevActivities) => {
            // activityId로 먼저 매칭 시도
            if (meta?.activityId) {
              return prevActivities.map((activity) => {
                if (activity.id === meta.activityId) {
                  return {
                    ...activity,
                    sets,
                    details: buildDetailsFromSets(sets),
                    isCompleted: allSetsCompleted ? true : activity.isCompleted,
                  };
                }
                return activity;
              });
            }

            // sessionId로 매칭 시도
            if (meta?.sessionId) {
              return prevActivities.map((activity) => {
                if (activity.sessionId === meta.sessionId) {
                  return {
                    ...activity,
                    sets,
                    details: buildDetailsFromSets(sets),
                    isCompleted: allSetsCompleted ? true : activity.isCompleted,
                  };
                }
                return activity;
              });
            }

            // externalId + name으로 매칭 시도
            if (meta?.externalId && exerciseName) {
              return prevActivities.map((activity) => {
                if (
                  activity.externalId === meta.externalId &&
                  activity.name === exerciseName
                ) {
                  return {
                    ...activity,
                    sets,
                    details: buildDetailsFromSets(sets),
                    isCompleted: allSetsCompleted ? true : activity.isCompleted,
                  };
                }
                return activity;
              });
            }

            // name만으로 매칭 시도 (오늘 날짜의 운동만)
            if (exerciseName) {
              const today = new Date();
              const todayStr = formatDateToString(today);
              return prevActivities.map((activity) => {
                if (
                  activity.name === exerciseName &&
                  activity.date === todayStr
                ) {
                  return {
                    ...activity,
                    sets,
                    details: buildDetailsFromSets(sets),
                    isCompleted: allSetsCompleted ? true : activity.isCompleted,
                  };
                }
                return activity;
              });
            }

            return prevActivities;
          });
        }}
        fullScreen={modalMode !== "add"}
      />
      <WorkoutIntroModal
        visible={isIntroVisible}
        stage={introStage}
        onStart={handleIntroStart}
        onSkip={handleStretchSkip}
        stretchProps={{
          loading: stretchLoading,
          options: stretchOptions,
          error: stretchError,
          selectedIds: selectedStretchIds,
          completedStretchIds: completedStretchIds,
          onToggle: handleStretchToggle,
          onConfirm: handleStretchConfirm,
          onSkip: handleStretchSkip,
          onRetry: loadStretchExercises,
        }}
        identifierResolver={getStretchIdentifier}
        detailProps={
          introStage === "detail"
            ? {
                stretches: selectedStretches,
                currentIndex: stretchDetailIndex,
                onNext: handleStretchDetailNext,
                onPrev: handleStretchDetailPrev,
                onComplete: handleStretchDetailComplete,
                details: stretchDetails,
                detailsLoading: stretchDetailsLoading,
                identifierResolver: getStretchIdentifier,
                timerSeconds: stretchTimer,
              }
            : undefined
        }
        exerciseModalProps={
          introStage === "exercise"
            ? {
                onClose: handleStretchSkip,
                onSave: handleExerciseSave,
                onWorkoutComplete: (exercises) => {
                  // 이미 저장된 운동들 제외 (savedWorkouts + pendingSavedRefs 기준)
                  const savedSessionIds = new Set<string>();
                  savedWorkouts.forEach((group) => {
                    group.sessions.forEach((session) => {
                      if (session.sessionId) {
                        savedSessionIds.add(session.sessionId);
                      }
                    });
                  });
                  const pendingSessionIds = new Set(
                    pendingSavedRefs.sessionIds
                  );
                  const pendingActivityIds = new Set(
                    pendingSavedRefs.activityIds
                  );
                  const pendingExternalKeys = new Set(
                    pendingSavedRefs.externalKeys
                  );

                  // allActivities에서 saveTitle이 있는 운동도 확인
                  // allActivities에서 saveTitle이 있는 운동도 확인 (단, 오늘 날짜가 아닌 것만)
                  const today = new Date();
                  const todayStr = formatDateToString(today);
                  const activitiesWithSaveTitle = new Set<string>();
                  allActivities.forEach((activity) => {
                    // 오늘 날짜가 아니고 saveTitle이 있는 경우만 제외 대상으로 추가
                    if (activity.saveTitle && activity.date !== todayStr) {
                      if (activity.sessionId)
                        activitiesWithSaveTitle.add(
                          `session:${activity.sessionId}`
                        );
                      if (typeof activity.id === "number")
                        activitiesWithSaveTitle.add(`activity:${activity.id}`);
                      if (activity.externalId && activity.name) {
                        activitiesWithSaveTitle.add(
                          `external:${activity.externalId}__${activity.name}`
                        );
                      }
                    }
                  });

                  // 방금 완료한 운동들은 모두 포함 (필터링 최소화)
                  // 단, 이미 savedSessionIds에 있는 경우만 제외 (중복 저장 방지)
                  // pendingSessionIds는 체크하지 않음 (방금 완료한 운동은 pending에 있을 수 있음)
                  const filteredExercises = exercises.filter((ex) => {
                    const sessionId = ex.sessionId;

                    // 이미 저장된 세션인 경우만 제외 (중복 저장 방지)
                    // pendingSessionIds는 체크하지 않음
                    if (sessionId && savedSessionIds.has(sessionId)) {
                      return false;
                    }

                    // 나머지는 모두 포함 (방금 완료한 운동이므로)
                    return true;
                  });

                  console.log(
                    "[EXERCISE][COMPLETE] 완료된 운동 필터링 (두 번째 위치):",
                    {
                      totalExercises: exercises.length,
                      filteredCount: filteredExercises.length,
                      exercises: exercises.map((ex) => ({
                        name: ex.name,
                        sessionId: ex.sessionId,
                        activityId: ex.activityId,
                        externalId: ex.externalId,
                      })),
                      filtered: filteredExercises.map((ex) => ({
                        name: ex.name,
                        sessionId: ex.sessionId,
                      })),
                      savedSessionIds: Array.from(savedSessionIds),
                      pendingSessionIds: Array.from(pendingSessionIds),
                    }
                  );

                  setCompletedExercises(filteredExercises);
                  setShowCompletionModal(true);
                  setIsIntroVisible(false);
                  setIntroStage("intro");
                },
                onFeedbackUpdate: (exerciseName, feedback) => {
                  setExerciseFeedbacks((prev) => ({
                    ...prev,
                    [exerciseName]: feedback,
                  }));
                },
              }
            : undefined
        }
      />

      {/* 운동 완료 모달 */}
      <Modal
        visible={showCompletionModal}
        animationType="none"
        transparent={true}
        statusBarTranslucent={true}
        onRequestClose={() => {
          setShowCompletionModal(false);
        }}
      >
        <View style={styles.completionModalOverlay}>
          <ScrollView
            style={styles.completionModalScroll}
            contentContainerStyle={styles.completionModalScrollContent}
            showsVerticalScrollIndicator={false}
          >
            <View style={styles.completionModalContent}>
              {/* 체크마크 아이콘 */}
              <View style={styles.completionIconContainer}>
                <View style={styles.completionIcon}>
                  <Icon name="checkmark" size={64} color="#ffffff" />
                </View>
              </View>

              {/* 완료 메시지 */}
              <Text style={styles.completionTitle}>운동 완료!</Text>
              <Text style={styles.completionSubtitle}>
                오늘도 목표에 한 걸음 더 가까워졌어요!
              </Text>

              <View style={styles.completedSummaryInputWrapper}>
                <Text style={styles.completedSummaryLabel}>오늘 운동 제목</Text>
                <TextInput
                  style={styles.completedSummaryInput}
                  value={completionSummaryTitle}
                  onChangeText={setCompletionSummaryTitle}
                  placeholder="예: 하체 불태우기 Day"
                  placeholderTextColor="#9a9a9a"
                />
              </View>
              {completionSaveErrorDetail && (
                <View style={styles.saveErrorLogBox}>
                  <View style={styles.saveErrorLogHeader}>
                    <Text style={styles.saveErrorLogTitle}>
                      최근 저장 오류 로그
                    </Text>
                    <TouchableOpacity
                      onPress={() => setCompletionSaveErrorDetail(null)}
                    >
                      <Text style={styles.saveErrorLogClear}>지우기</Text>
                    </TouchableOpacity>
                  </View>
                  <Text style={styles.saveErrorLogMessage}>
                    {completionSaveErrorDetail}
                  </Text>
                </View>
              )}

              {/* 완료된 운동 및 스트레칭 목록 */}
              {/* 모달이 열려있고, 저장 중이 아니며, completedExercises가 있을 때만 표시 */}
              <View
                style={[
                  styles.completedExercisesCard,
                  (!showCompletionModal ||
                    isSavingCompletionTitle ||
                    completedExercises.length === 0) &&
                    styles.hidden,
                ]}
              >
                <Text style={styles.completedExercisesDate}>
                  {new Date().getFullYear()}.
                  {String(new Date().getMonth() + 1).padStart(2, "0")}.
                  {String(new Date().getDate()).padStart(2, "0")}
                </Text>
                <View style={styles.completedExercisesList}>
                  {/* completedExercises를 직접 표시 - 이미 저장된 내역은 제외 */}
                  {(() => {
                    // savedWorkouts + pendingSavedRefs 를 기준으로 이미 저장된 내역 제외
                    const savedSessionIds = new Set<string>();
                    savedWorkouts.forEach((group) => {
                      group.sessions.forEach((session) => {
                        if (session.sessionId) {
                          savedSessionIds.add(session.sessionId);
                        }
                      });
                    });
                    const pendingSessionIds = new Set(
                      pendingSavedRefs.sessionIds
                    );
                    const pendingActivityIds = new Set(
                      pendingSavedRefs.activityIds
                    );
                    const pendingExternalKeys = new Set(
                      pendingSavedRefs.externalKeys
                    );

                    const newCompletedExercises = completedExercises.filter(
                      (ex) => {
                        const sessionId = ex.sessionId;
                        const activityId = ex.activityId;
                        const externalKey =
                          ex.externalId && ex.name
                            ? `${ex.externalId}__${ex.name}`
                            : null;
                        const alreadySavedBySession =
                          sessionId &&
                          (savedSessionIds.has(sessionId) ||
                            pendingSessionIds.has(sessionId));
                        const alreadySavedByActivity =
                          typeof activityId === "number" &&
                          pendingActivityIds.has(activityId);
                        const alreadySavedByExternal =
                          externalKey && pendingExternalKeys.has(externalKey);
                        return !(
                          alreadySavedBySession ||
                          alreadySavedByActivity ||
                          alreadySavedByExternal
                        );
                      }
                    );

                    if (newCompletedExercises.length === 0) {
                      return (
                        <Text style={styles.completedExerciseName}>
                          완료된 운동이 없습니다.
                        </Text>
                      );
                    }
                    return newCompletedExercises.map((ex, index) => {
                      const externalId = ex.externalId;
                      const idKey = externalId ? String(externalId) : undefined;

                      // name이 없으면 allActivities에서 찾기
                      let displayName = ex.name;
                      let displayTargetMuscle = ex.targetMuscle;

                      if (!displayName || displayName.trim() === "") {
                        // allActivities에서 해당 운동 찾기
                        const matchedActivity = allActivities.find(
                          (activity) => {
                            if (
                              ex.activityId &&
                              activity.id === ex.activityId
                            ) {
                              return true;
                            }
                            if (
                              ex.sessionId &&
                              activity.sessionId === ex.sessionId
                            ) {
                              return true;
                            }
                            if (
                              ex.externalId &&
                              activity.externalId === ex.externalId
                            ) {
                              return true;
                            }
                            return false;
                          }
                        );

                        if (matchedActivity) {
                          displayName = matchedActivity.name || "운동";
                          displayTargetMuscle =
                            matchedActivity.targetMuscle ||
                            matchedActivity.bodyPart ||
                            displayTargetMuscle;
                        } else {
                          displayName = "운동";
                        }
                      }

                      const nameKey = displayName
                        ? displayName.toLowerCase()
                        : undefined;

                      // 이미지 URL 우선순위: ex.imageUrl > exerciseImages[externalId] > exerciseImagesByName[name]
                      const displayUrl =
                        ex.imageUrl ||
                        (idKey ? exerciseImages[idKey] : undefined) ||
                        (nameKey ? exerciseImagesByName[nameKey] : undefined);

                      const setsCompleted = Array.isArray(ex.sets)
                        ? ex.sets.filter(
                            (set: any) => set?.isCompleted === true
                          ).length
                        : 0;
                      const totalSets = Array.isArray(ex.sets)
                        ? ex.sets.length
                        : 0;

                      // 디버깅: name이 없는 경우 로그
                      if (__DEV__ && (!ex.name || ex.name.trim() === "")) {
                        console.log(
                          "[EXERCISE][COMPLETION] name이 없는 운동 발견:",
                          {
                            index,
                            ex,
                            displayName,
                            matchedActivity: allActivities.find((activity) => {
                              if (
                                ex.activityId &&
                                activity.id === ex.activityId
                              ) {
                                return true;
                              }
                              if (
                                ex.sessionId &&
                                activity.sessionId === ex.sessionId
                              ) {
                                return true;
                              }
                              if (
                                ex.externalId &&
                                activity.externalId === ex.externalId
                              ) {
                                return true;
                              }
                              return false;
                            }),
                          }
                        );
                      }
                      return (
                        <View
                          key={index}
                          style={[
                            styles.completedExerciseItem,
                            index === completedExercises.length - 1 &&
                              styles.completedExerciseItemLast,
                          ]}
                        >
                          <View style={styles.completedExerciseIcon}>
                            {displayUrl ? (
                              <Image
                                source={{ uri: displayUrl }}
                                style={styles.completedExerciseImage}
                                resizeMode="cover"
                              />
                            ) : (
                              <Icon name="barbell" size={24} color="#666666" />
                            )}
                          </View>
                          <View style={styles.completedExerciseInfo}>
                            <Text style={styles.completedExerciseName}>
                              {displayName}
                            </Text>
                            <Text style={styles.completedExerciseMuscle}>
                              {displayTargetMuscle || ""}
                            </Text>
                          </View>
                        </View>
                      );
                    });
                  })()}
                </View>
              </View>

              {/* 확인 버튼 */}
              <TouchableOpacity
                style={[
                  styles.completionConfirmButton,
                  isSavingCompletionTitle &&
                    styles.completionConfirmButtonDisabled,
                ]}
                onPress={handleCompletionConfirm}
                disabled={isSavingCompletionTitle}
              >
                <Text style={styles.completionConfirmButtonText}>
                  {isSavingCompletionTitle ? "저장 중..." : "확인"}
                </Text>
              </TouchableOpacity>
            </View>
          </ScrollView>
        </View>
      </Modal>
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
    paddingBottom: 6,
    paddingTop: 0,
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
  contentContainer: {
    paddingBottom: 140,
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
    marginTop: 0,
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
    width: 32,
    height: 32,
    justifyContent: "center",
    alignItems: "center",
    marginBottom: 4,
  },
  calendarNumberInner: {
    width: 28,
    height: 28,
    borderRadius: 14,
    justifyContent: "center",
    alignItems: "center",
    backgroundColor: "transparent",
  },
  calendarNumberSelected: {
    backgroundColor: "#ffffff",
  },
  calendarNumberToday: {
    backgroundColor: "#e3ff7c",
  },
  calendarNumberText: {
    fontSize: 16,
    fontWeight: "700",
    color: "#e3ff7c",
    lineHeight: 19,
    textAlign: "center",
  },
  calendarNumberSelectedText: {
    color: "#000000",
    fontSize: 16,
    fontWeight: "700",
    lineHeight: 19,
  },
  calendarNumberTodayText: {
    color: "#1c1c1c",
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
  goalCard: {
    backgroundColor: "#3a3a3a",
    borderRadius: 20,
    paddingVertical: 16,
    paddingHorizontal: 20,
    flexDirection: "row",
    alignItems: "center",
    marginTop: 10,
    marginBottom: 24,
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
  sectionTitleRow: {
    flexDirection: "row",
    justifyContent: "space-between",
    alignItems: "center",
    marginBottom: 16,
  },
  sectionTitle: {
    fontSize: 18,
    fontWeight: "600",
    color: colors.text,
  },
  // 서버 기록 섹션 스타일 제거됨
  // (임시 API 테스트 버튼 스타일 제거)
  logTimeline: {
    paddingLeft: 8,
  },
  logItem: {
    flexDirection: "row",
    marginBottom: 12,
  },
  logItemGrouped: {
    marginBottom: 0,
  },
  logItemGroupFirst: {
    marginTop: 0,
    marginBottom: 0,
  },
  logItemGroupLast: {
    marginBottom: 16,
  },
  logGroupHeader: {
    width: "100%",
    paddingHorizontal: 16,
    paddingVertical: 8,
    backgroundColor: "rgba(214, 255, 75, 0.15)",
    borderTopLeftRadius: 12,
    borderTopRightRadius: 12,
    borderTopWidth: 3,
    borderLeftWidth: 3,
    borderRightWidth: 3,
    borderTopColor: "#d6ff4b",
    borderLeftColor: "#d6ff4b",
    borderRightColor: "#d6ff4b",
    borderBottomWidth: 2,
    borderBottomColor: "#d6ff4b",
    marginBottom: 0,
    flexDirection: "row",
    alignItems: "center",
    justifyContent: "space-between",
    gap: 12,
  },
  logGroupTitle: {
    fontSize: 13,
    fontWeight: "600",
    color: colors.text,
  },
  logGroupTime: {
    fontSize: 12,
    color: colors.textLight,
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
    paddingVertical: 8,
    paddingHorizontal: 16,
    flexDirection: "row",
    justifyContent: "space-between",
    alignItems: "center",
  },
  logCardGrouped: {
    borderRadius: 0,
    borderLeftWidth: 3,
    borderRightWidth: 3,
    borderLeftColor: "#d6ff4b",
    borderRightColor: "#d6ff4b",
  },
  logCardGroupFirst: {
    borderTopLeftRadius: 0,
    borderTopRightRadius: 0,
    borderTopWidth: 3,
    borderTopColor: "#d6ff4b",
  },
  logCardGroupLast: {
    borderBottomLeftRadius: 12,
    borderBottomRightRadius: 12,
    borderBottomWidth: 3,
    borderBottomColor: "#d6ff4b",
  },
  deleteBtn: {
    marginLeft: 12,
    padding: 6,
  },
  logCardPending: {
    backgroundColor: colors.white,
  },
  logCardCompleted: {
    backgroundColor: "#f0f0f0",
    borderWidth: 1,
    borderColor: "#e0e0e0",
  },
  logCardContent: {
    flex: 1,
    flexDirection: "row",
    gap: 10,
    alignItems: "center",
  },
  logCardImage: {
    width: 36,
    height: 36,
    borderRadius: 6,
    backgroundColor: colors.cardBackground,
  },
  logCardImagePlaceholder: {
    width: 36,
    height: 36,
    borderRadius: 6,
    backgroundColor: colors.cardBackground,
    justifyContent: "center",
    alignItems: "center",
  },
  logTextBlock: {
    flex: 1,
    gap: 4,
  },
  logTextHeader: {
    flexDirection: "row",
    alignItems: "center",
    justifyContent: "space-between",
    gap: 8,
  },
  logName: {
    fontSize: 16,
    fontWeight: "600",
    color: colors.text,
    marginBottom: 2,
  },
  logNamePending: {
    color: colors.black,
  },
  logNameCompleted: {
    color: colors.textLight, // 완료된 항목은 회색 텍스트
  },
  logNameSaved: {
    color: colors.black,
  },
  logDetails: {
    fontSize: 14,
    color: colors.textLight,
  },
  logDetailsCompleted: {
    color: colors.textLight, // 완료된 항목은 회색 텍스트
    opacity: 0.7, // 더 연한 회색 효과
  },
  logTime: {
    fontSize: 12,
    color: colors.textLight,
  },
  logTimeCompleted: {
    color: colors.textLight, // 완료된 항목은 회색 텍스트
    opacity: 0.7, // 더 연한 회색 효과
  },
  startWorkoutButton: {
    backgroundColor: "#4a9eff", // 파란색
    paddingVertical: 10,
    paddingHorizontal: 24,
    borderRadius: 10,
    marginRight: 8,
  },
  startWorkoutButtonText: {
    color: "#ffffff",
    fontSize: 14,
    fontWeight: "600",
  },
  todayWorkoutTimeText: {
    fontSize: 11,
    color: colors.textLight,
    opacity: 0.7,
  },
  fabWrapper: {
    position: "absolute",
    right: 24,
    bottom: 24,
    alignItems: "flex-end",
    gap: 12,
  },
  fabButton: {
    width: 56,
    height: 56,
    borderRadius: 28,
    backgroundColor: "#E3FF7C",
    alignItems: "center",
    justifyContent: "center",
    shadowColor: "#000000",
    shadowOffset: { width: 0, height: 2 },
    shadowOpacity: 0.25,
    shadowRadius: 4,
    elevation: 6,
  },
  fabOptions: {
    backgroundColor: "#ffffff",
    paddingVertical: 14,
    paddingHorizontal: 16,
    borderRadius: 16,
    gap: 12,
    minWidth: 160,
    shadowColor: "#000000",
    shadowOffset: { width: 0, height: 2 },
    shadowOpacity: 0.25,
    shadowRadius: 6,
    elevation: 8,
  },
  fabOptionButton: {
    paddingVertical: 6,
  },
  fabOptionText: {
    color: colors.black,
    fontSize: 16,
    fontWeight: "600",
  },
  fabBackdrop: {
    ...StyleSheet.absoluteFillObject,
    backgroundColor: "rgba(0, 0, 0, 0.2)",
  },
  stretchModalWrapper: {
    flex: 1,
    backgroundColor: "#0c0c0c",
    paddingHorizontal: 20,
    paddingTop: 66,
    paddingBottom: 32,
  },
  stretchContentWrapper: {
    flex: 1,
  },
  stretchModalHeader: {
    marginBottom: 20,
    alignItems: "center",
  },
  stretchModalTitle: {
    fontSize: 20,
    fontWeight: "700",
    color: "#ffffff",
    marginBottom: 10,
  },
  stretchModalSubtitle: {
    fontSize: 14,
    color: "#d6d6d6",
    textAlign: "center",
  },
  stretchCardContainer: {
    flex: 1,
    backgroundColor: "#ffffff",
    borderRadius: 28,
    paddingVertical: 24,
    paddingHorizontal: 8,
    shadowColor: "#000",
    shadowOffset: { width: 0, height: 8 },
    shadowOpacity: 0.15,
    shadowRadius: 18,
    elevation: 14,
    marginHorizontal: 16,
  },
  stretchListContent: {
    paddingHorizontal: 2,
    paddingBottom: 22,
  },
  stretchColumn: {
    justifyContent: "space-between",
    marginBottom: 12,
  },
  stretchCard: {
    flex: 1,
    marginHorizontal: 4,
    backgroundColor: "#f5f5f5",
    borderRadius: 14,
    paddingVertical: 10,
    paddingHorizontal: 6,
    alignItems: "center",
    borderWidth: 1,
    borderColor: "#ececec",
  },
  stretchCardSelected: {
    backgroundColor: "#e3ff4b",
    borderColor: "#cde43c",
  },
  stretchCardCompleted: {
    backgroundColor: "#000000",
    borderColor: "#000000",
  },
  stretchCardImageWrap: {
    width: 110,
    height: 100,
    alignItems: "center",
    justifyContent: "center",
    marginBottom: 10,
  },
  stretchCardImage: {
    width: 86,
    height: 86,
    resizeMode: "contain",
  },
  stretchCardName: {
    fontSize: 14,
    color: "#3a3a3a",
    fontWeight: "600",
    textAlign: "center",
  },
  stretchCardNameSelected: {
    color: "#111111",
  },
  stretchCardNameCompleted: {
    color: "#ffffff",
  },
  stretchStateWrapper: {
    flex: 1,
    alignItems: "center",
    justifyContent: "center",
    gap: 12,
  },
  stretchErrorText: {
    fontSize: 14,
    color: "#ff8686",
    textAlign: "center",
    paddingHorizontal: 24,
  },
  stretchRetryBtn: {
    paddingHorizontal: 16,
    paddingVertical: 10,
    borderRadius: 999,
    backgroundColor: "#1f1f1f",
  },
  stretchRetryText: {
    color: "#ffffff",
    fontWeight: "600",
  },
  stretchEmptyText: {
    fontSize: 14,
    color: "#666666",
    textAlign: "center",
    paddingHorizontal: 24,
  },
  stretchModalButtons: {
    marginTop: 22,
    gap: 12,
  },
  stretchConfirmBtn: {
    backgroundColor: "#d6ff4b",
    borderRadius: 18,
    paddingVertical: 18,
    alignItems: "center",
    shadowColor: "#d6ff4b",
    shadowOffset: { width: 0, height: 6 },
    shadowOpacity: 0.35,
    shadowRadius: 12,
    elevation: 8,
  },
  stretchConfirmBtnDisabled: {
    backgroundColor: "#b7c08f",
    shadowOpacity: 0,
    elevation: 0,
  },
  stretchConfirmText: {
    fontSize: 17,
    fontWeight: "700",
    color: "#101010",
  },
  stretchConfirmTextDisabled: {
    color: "#f4f4f4",
  },
  stretchSkipBtn: {
    backgroundColor: "#ffffff",
    borderRadius: 16,
    paddingVertical: 15,
    alignItems: "center",
    borderWidth: 1,
    borderColor: "#f1f1f1",
  },
  stretchSkipText: {
    fontSize: 15,
    fontWeight: "600",
    color: "#111111",
  },
  introModalWrapper: {
    flex: 1,
    backgroundColor: "#101010",
  },
  introScreen: {
    flex: 1,
    backgroundColor: "#101010",
    paddingHorizontal: 24,
    paddingTop: 32,
    paddingBottom: 32,
  },
  introDecorCircle: {
    position: "absolute",
    borderWidth: 1,
    borderColor: "rgba(214,255,75,0.2)",
    borderStyle: "dashed",
    borderRadius: 999,
  },
  introCircleLarge: {
    width: 220,
    height: 220,
    top: 90,
    left: -80,
  },
  introCircleSmall: {
    width: 140,
    height: 140,
    bottom: 120,
    right: -40,
  },
  introIllustrationWrap: {
    alignItems: "center",
    marginTop: 20,
    marginBottom: 48,
  },
  introIllustration: {
    width: 240,
    height: 320,
    resizeMode: "contain",
  },
  introGreeting: {
    fontSize: 20,
    fontWeight: "700",
    color: "#ffffff",
    textAlign: "center",
    marginBottom: 12,
  },
  introDescription: {
    fontSize: 15,
    color: "#d6d6d6",
    textAlign: "center",
    lineHeight: 22,
  },
  introActionArea: {
    marginTop: "auto",
    gap: 12,
    marginBottom: 30,
  },
  introPrimaryBtn: {
    backgroundColor: "#d6ff4b",
    borderRadius: 16,
    paddingVertical: 16,
    alignItems: "center",
  },
  introPrimaryText: {
    fontSize: 16,
    fontWeight: "700",
    color: "#101010",
  },
  introSecondaryBtn: {
    backgroundColor: "#ffffff",
    borderRadius: 16,
    paddingVertical: 16,
    alignItems: "center",
  },
  introSecondaryText: {
    fontSize: 16,
    fontWeight: "600",
    color: "#111111",
  },
  introBackBtn: {
    position: "absolute",
    top: 8,
    left: 0,
    padding: 8,
    backgroundColor: "rgba(255,255,255,0.08)",
    borderRadius: 999,
    zIndex: 10,
  },
  introDecorDot: {
    position: "absolute",
    width: 12,
    height: 12,
    borderRadius: 6,
    backgroundColor: "#d6ff4b",
    opacity: 0.7,
  },
  introDotTopLeft: {
    top: 120,
    left: 12,
  },
  introDotBottomRight: {
    bottom: 140,
    right: 24,
  },
  introDecorBeam: {
    position: "absolute",
    width: 80,
    height: 2,
    backgroundColor: "rgba(214,255,75,0.4)",
  },
  introBeamLeft: {
    top: 200,
    left: -10,
    transform: [{ rotate: "-30deg" }],
  },
  introBeamRight: {
    bottom: 110,
    right: -20,
    transform: [{ rotate: "25deg" }],
  },
  introGlow: {
    position: "absolute",
    width: 200,
    height: 200,
    backgroundColor: "rgba(214,255,75,0.15)",
    borderRadius: 120,
    alignSelf: "center",
    top: 240,
    shadowColor: "#d6ff4b",
    shadowOffset: { width: 0, height: 0 },
    shadowOpacity: 0.6,
    shadowRadius: 40,
    elevation: 12,
  },
  stretchDetailModalWrapper: {
    flex: 1,
    backgroundColor: "#0c0c0c",
  },
  exerciseModalWrapper: {
    flex: 1,
    backgroundColor: "#0c0c0c",
  },
  stretchDetailWrapper: {
    flex: 1,
    paddingHorizontal: 20,
    paddingTop: 20,
    paddingBottom: 24,
  },
  stretchDetailHeaderRow: {
    flexDirection: "row",
    alignItems: "center",
    justifyContent: "space-between",
    width: "100%",
    marginBottom: 16,
    gap: 12,
  },
  stretchDetailTitle: {
    flex: 1,
    fontSize: 22,
    fontWeight: "700",
    color: "#ffffff",
  },
  stretchDetailTimer: {
    paddingHorizontal: 14,
    paddingVertical: 8,
    borderRadius: 999,
    backgroundColor: "#1a1a1a",
    borderWidth: 1,
    borderColor: "#333333",
    alignItems: "center",
    gap: 2,
    minWidth: 100,
  },
  stretchDetailTimerLabel: {
    fontSize: 11,
    color: "#b5b5b5",
  },
  stretchDetailTimerValue: {
    fontSize: 18,
    fontWeight: "700",
    color: "#E3FF7C",
  },
  stretchDetailCard: {
    flex: 1,
    backgroundColor: "#ffffff",
    borderRadius: 24,
    padding: 20,
    marginBottom: 16,
  },
  stretchDetailImageContainer: {
    width: "100%",
    alignItems: "center",
    marginBottom: 20,
    position: "relative",
  },
  stretchDetailImage: {
    width: "100%",
    height: 280,
    resizeMode: "contain",
  },
  stretchDetailPrevArrow: {
    position: "absolute",
    left: 0,
    top: "50%",
    transform: [{ translateY: -16 }],
    backgroundColor: "rgba(255,255,255,0.9)",
    borderRadius: 20,
    padding: 8,
    zIndex: 10,
  },
  stretchDetailNextArrow: {
    position: "absolute",
    right: 0,
    top: "50%",
    transform: [{ translateY: -16 }],
    backgroundColor: "rgba(255,255,255,0.9)",
    borderRadius: 20,
    padding: 8,
    zIndex: 10,
  },
  stretchDetailInstructions: {
    flex: 1,
  },
  stretchDetailStep: {
    flexDirection: "row",
    alignItems: "center",
    marginTop: 20,
    marginBottom: 8,
  },
  stretchDetailStepNumber: {
    fontSize: 18,
    fontWeight: "700",
    color: "#000000",
    marginRight: 12,
    minWidth: 24,
  },
  stretchDetailStepTitle: {
    fontSize: 16,
    fontWeight: "600",
    color: "#000000",
  },
  stretchDetailStepText: {
    fontSize: 14,
    color: "#333333",
    lineHeight: 20,
    marginBottom: 8,
    paddingLeft: 36,
  },
  stretchDetailCompleteBtn: {
    backgroundColor: "#3a3a3a",
    borderRadius: 16,
    paddingVertical: 16,
    alignItems: "center",
  },
  stretchDetailCompleteText: {
    fontSize: 16,
    fontWeight: "600",
    color: "#ffffff",
  },
  stretchDetailLoadingWrapper: {
    alignItems: "center",
    justifyContent: "center",
    paddingVertical: 40,
    gap: 12,
  },
  stretchDetailLoadingText: {
    fontSize: 14,
    color: "#666666",
  },
  completionModalOverlay: {
    flex: 1,
    backgroundColor: "#2C2C2C",
    justifyContent: "center",
    alignItems: "center",
    padding: 20,
    zIndex: 9999,
  },
  completionModalScroll: {
    width: "100%",
  },
  completionModalScrollContent: {
    flexGrow: 1,
    justifyContent: "flex-start",
    alignItems: "center",
    paddingTop: 56,
    paddingBottom: 48,
    paddingHorizontal: 12,
  },
  completionModalContent: {
    width: "100%",
    maxWidth: 400,
    alignItems: "center",
  },
  completionIconContainer: {
    marginBottom: 24,
  },
  completionIcon: {
    width: 120,
    height: 120,
    borderRadius: 60,
    backgroundColor: "#4CAF50",
    justifyContent: "center",
    alignItems: "center",
    shadowColor: "#000",
    shadowOffset: {
      width: 0,
      height: 2,
    },
    shadowOpacity: 0.25,
    shadowRadius: 3.84,
    elevation: 5,
  },
  completionTitle: {
    fontSize: 24,
    fontWeight: "700",
    color: "#ffffff",
    marginBottom: 8,
    textAlign: "center",
  },
  completionSubtitle: {
    fontSize: 16,
    fontWeight: "400",
    color: "#ffffff",
    marginBottom: 32,
    textAlign: "center",
    lineHeight: 24,
  },
  completedExercisesCard: {
    width: "100%",
    backgroundColor: "#ffffff",
    borderRadius: 16,
    padding: 20,
    marginBottom: 24,
  },
  hidden: {
    height: 0,
    overflow: "hidden",
    opacity: 0,
    marginBottom: 0,
    padding: 0,
  },
  completedExercisesDate: {
    fontSize: 16,
    fontWeight: "600",
    color: "#000000",
    marginBottom: 16,
  },
  completedExercisesList: {
    width: "100%",
  },
  completedExerciseItem: {
    flexDirection: "row",
    alignItems: "center",
    paddingVertical: 12,
    paddingHorizontal: 12,
    borderRadius: 12,
    backgroundColor: "#f2f2f2",
    marginBottom: 8,
  },
  completedExerciseItemLast: {
    marginBottom: 0,
  },
  completedExerciseIcon: {
    width: 40,
    height: 40,
    borderRadius: 20,
    backgroundColor: "#F5F5F5",
    justifyContent: "center",
    alignItems: "center",
    marginRight: 12,
  },
  completedExerciseImage: {
    width: 40,
    height: 40,
    borderRadius: 20,
  },
  completedExerciseInfo: {
    flex: 1,
  },
  completedExerciseNameRow: {
    flexDirection: "row",
    justifyContent: "space-between",
    alignItems: "flex-start",
    flexWrap: "wrap",
    columnGap: 8,
    rowGap: 2,
    marginBottom: 4,
  },
  completedExerciseName: {
    fontSize: 16,
    fontWeight: "600",
    color: "#000000",
    flexShrink: 1,
    minWidth: 0,
  },
  completedExerciseTime: {
    fontSize: 14,
    fontWeight: "400",
    color: "#666666",
    marginLeft: 8,
    textAlign: "right",
  },
  completedExerciseMuscle: {
    fontSize: 14,
    fontWeight: "400",
    color: "#666666",
  },
  completedSummaryInputWrapper: {
    width: "100%",
    marginBottom: 16,
    backgroundColor: "#ffffff",
    borderRadius: 12,
    padding: 16,
  },
  completedSummaryLabel: {
    fontSize: 13,
    fontWeight: "600",
    color: "#333333",
    marginBottom: 8,
  },
  completedSummaryInput: {
    borderWidth: 1,
    borderColor: "#DDDDDD",
    borderRadius: 10,
    paddingVertical: 10,
    paddingHorizontal: 14,
    fontSize: 15,
    color: "#000000",
  },
  completionConfirmButton: {
    width: "100%",
    maxWidth: 400,
    backgroundColor: "#4CAF50",
    paddingVertical: 16,
    borderRadius: 12,
    alignItems: "center",
    justifyContent: "center",
  },
  completionConfirmButtonDisabled: {
    opacity: 0.6,
  },
  completionConfirmButtonText: {
    fontSize: 16,
    fontWeight: "600",
    color: "#ffffff",
  },
  saveErrorLogBox: {
    width: "100%",
    marginBottom: 16,
    padding: 16,
    borderRadius: 12,
    backgroundColor: "rgba(255, 107, 107, 0.1)",
    borderWidth: 1,
    borderColor: "rgba(255, 107, 107, 0.4)",
  },
  saveErrorLogHeader: {
    flexDirection: "row",
    justifyContent: "space-between",
    alignItems: "center",
    marginBottom: 8,
  },
  saveErrorLogTitle: {
    fontSize: 13,
    fontWeight: "700",
    color: "#ff8585",
  },
  saveErrorLogClear: {
    fontSize: 12,
    color: "#ffb3b3",
  },
  saveErrorLogMessage: {
    fontSize: 13,
    color: "#ffdcdc",
    lineHeight: 18,
  },
  savedWorkoutsContainer: {
    padding: 16,
    marginHorizontal: 20,
    marginBottom: 20,
    borderRadius: 16,
    backgroundColor: "#1f1f1f",
  },
  savedWorkoutsHeader: {
    flexDirection: "row",
    justifyContent: "space-between",
    alignItems: "center",
    marginBottom: 12,
  },
  savedWorkoutsRefreshBtn: {
    flexDirection: "row",
    alignItems: "center",
    gap: 6,
    paddingVertical: 6,
    paddingHorizontal: 10,
    borderRadius: 20,
    backgroundColor: "rgba(255,255,255,0.08)",
  },
  savedWorkoutsRefreshText: {
    fontSize: 12,
    color: colors.textLight,
  },
  savedWorkoutsState: {
    paddingVertical: 12,
    alignItems: "center",
    justifyContent: "center",
  },
  savedWorkoutsStateText: {
    marginTop: 4,
    fontSize: 13,
    color: colors.textLight,
  },
  savedWorkoutsErrorText: {
    fontSize: 13,
    color: "#ff6b6b",
  },
  savedWorkoutsList: {
    gap: 12,
  },
  savedWorkoutCard: {
    borderRadius: 14,
    backgroundColor: "#2a2a2a",
    padding: 12,
  },
  savedWorkoutCardHeader: {
    flexDirection: "row",
    justifyContent: "space-between",
    alignItems: "center",
  },
  savedWorkoutCardTitle: {
    fontSize: 16,
    fontWeight: "700",
    color: "#ffffff",
  },
  savedWorkoutCardMeta: {
    fontSize: 12,
    color: colors.textLight,
    marginTop: 4,
  },
  savedWorkoutSessions: {
    marginTop: 10,
    gap: 10,
  },
  savedWorkoutSessionCard: {
    borderRadius: 12,
    backgroundColor: "#1a1a1a",
    padding: 10,
  },
  savedWorkoutSessionHeader: {
    flexDirection: "row",
    justifyContent: "space-between",
    alignItems: "center",
  },
  savedWorkoutSessionTitle: {
    fontSize: 14,
    fontWeight: "600",
    color: "#ffffff",
  },
  savedWorkoutSessionMeta: {
    fontSize: 12,
    color: colors.textLight,
  },
  savedWorkoutSessionCount: {
    flexDirection: "row",
    alignItems: "center",
    gap: 6,
  },
  savedWorkoutRecords: {
    marginTop: 10,
    gap: 8,
  },
  savedWorkoutRecordRow: {
    flexDirection: "row",
    justifyContent: "space-between",
    alignItems: "flex-start",
    gap: 12,
    padding: 10,
    borderRadius: 10,
    backgroundColor: "#2f2f2f",
  },
  savedWorkoutRecordInfo: {
    flex: 1,
  },
  savedWorkoutRecordName: {
    fontSize: 14,
    fontWeight: "600",
    color: "#ffffff",
  },
  savedWorkoutRecordMeta: {
    fontSize: 12,
    color: colors.textLight,
    marginTop: 2,
  },
  savedWorkoutRecordValue: {
    fontSize: 13,
    color: "#ffffff",
    fontWeight: "600",
  },
  //ai 추천 세트 테두리 색상
  logGroupHeaderAI: {
    backgroundColor: "rgba(255, 255, 255, 0.15)",
    borderTopColor: "#ffffffff",
    borderLeftColor: "#ffffffff",
    borderRightColor: "#ffffffff",
    borderBottomColor: "#ffffffff",
  },
  logCardGroupedAI: {
    borderLeftColor: "#ffffffff",
    borderRightColor: "#ffffffff",
  },
  logCardGroupFirstAI: {
    borderTopColor: "#ffffffff",
  },
  logCardGroupLastAI: {
    borderBottomColor: "#ffffffff",
  },
});

interface StretchSelectionContentProps {
  loading: boolean;
  options: any[];
  error: string | null;
  selectedIds: string[];
  completedStretchIds?: Set<string>;
  onToggle: (option: any) => void;
  onConfirm: () => void;
  onSkip: () => void;
  onRetry: () => void | Promise<void>;
  identifierResolver: (option: any) => string;
}

interface WorkoutIntroModalProps {
  visible: boolean;
  stage: "intro" | "stretch" | "detail" | "exercise";
  onStart: () => void;
  onSkip: () => void;
  stretchProps: Omit<StretchSelectionContentProps, "identifierResolver">;
  identifierResolver: (option: any) => string;
  detailProps?: {
    stretches: any[];
    currentIndex: number;
    onNext: () => void;
    onPrev: () => void;
    onComplete: () => void;
    details: Record<string, any>;
    detailsLoading: Record<string, boolean>;
    identifierResolver: (option: any) => string;
    timerSeconds?: number;
  };
  exerciseModalProps?: {
    onClose: () => void;
    onSave: (
      sets: any[],
      exerciseName: string,
      meta?: { externalId?: string; category?: string },
      comment?: string
    ) => void;
    onWorkoutComplete?: (
      exercises: Array<{
        name: string;
        targetMuscle?: string;
        imageUrl?: string;
        sessionId?: string;
        activityId?: number;
        externalId?: string;
      }>
    ) => void;
    onFeedbackUpdate?: (
      exerciseName: string,
      feedback: {
        intensity: "heavy" | "light" | null;
        feedback: "like" | "dislike" | null;
      }
    ) => void;
  };
}

const STRETCHING_ILLUSTRATION = require("../../assets/images/stretch_intro.png.png");

const StretchSelectionContent = ({
  loading,
  options,
  error,
  selectedIds,
  completedStretchIds,
  onToggle,
  onConfirm,
  onSkip,
  onRetry,
  identifierResolver,
}: StretchSelectionContentProps) => {
  const renderItem = ({ item }: { item: any }) => {
    const id = identifierResolver(item);
    const isSelected = selectedIds.includes(id);
    const rawImage =
      item?.imageUrl ||
      item?.image ||
      item?.imgUrl ||
      item?.photoUrl ||
      item?.thumbnailUrl;
    const imageSource =
      typeof rawImage === "string" && rawImage.length > 0
        ? { uri: rawImage }
        : STRETCHING_ILLUSTRATION;
    const displayName = item?.name || item?.exerciseName || "스트레칭";
    return (
      <TouchableOpacity
        style={[styles.stretchCard, isSelected && styles.stretchCardSelected]}
        activeOpacity={0.85}
        onPress={() => onToggle(item)}
      >
        <View style={styles.stretchCardImageWrap}>
          <Image source={imageSource} style={styles.stretchCardImage} />
        </View>
        <Text
          style={[
            styles.stretchCardName,
            isSelected && styles.stretchCardNameSelected,
          ]}
          numberOfLines={1}
        >
          {displayName}
        </Text>
      </TouchableOpacity>
    );
  };

  const renderContent = () => {
    if (loading) {
      return (
        <View style={styles.stretchStateWrapper}>
          <ActivityIndicator size="large" color="#d6ff4b" />
          <Text style={styles.stretchEmptyText}>스트레칭을 불러오는 중...</Text>
        </View>
      );
    }

    if (error) {
      return (
        <View style={styles.stretchStateWrapper}>
          <Text style={styles.stretchErrorText}>{error}</Text>
          <TouchableOpacity style={styles.stretchRetryBtn} onPress={onRetry}>
            <Text style={styles.stretchRetryText}>다시 시도</Text>
          </TouchableOpacity>
        </View>
      );
    }

    if (!options || options.length === 0) {
      return (
        <View style={styles.stretchStateWrapper}>
          <Text style={styles.stretchEmptyText}>
            표시할 스트레칭 종목이 없습니다.
          </Text>
        </View>
      );
    }

    return (
      <FlatList
        data={options}
        renderItem={renderItem}
        keyExtractor={(item, index) =>
          identifierResolver(item) || `stretch-${index}`
        }
        numColumns={2}
        columnWrapperStyle={styles.stretchColumn}
        contentContainerStyle={styles.stretchListContent}
        showsVerticalScrollIndicator={false}
        bounces={false}
      />
    );
  };

  const hasSelection = selectedIds.length > 0;

  return (
    <View style={styles.stretchContentWrapper}>
      <View style={styles.stretchModalHeader}>
        <Text style={styles.stretchModalTitle}>스트레칭을 선택해보세요!</Text>
        <Text style={styles.stretchModalSubtitle}>
          여러 개를 선택해 한 번에 루틴에 추가할 수 있어요.
        </Text>
      </View>
      <View style={styles.stretchCardContainer}>{renderContent()}</View>
      <View style={styles.stretchModalButtons}>
        <TouchableOpacity
          style={[
            styles.stretchConfirmBtn,
            !hasSelection && styles.stretchConfirmBtnDisabled,
          ]}
          activeOpacity={hasSelection ? 0.85 : 1}
          onPress={hasSelection ? onConfirm : undefined}
        >
          <Text
            style={[
              styles.stretchConfirmText,
              !hasSelection && styles.stretchConfirmTextDisabled,
            ]}
          >
            {hasSelection
              ? `${selectedIds.length}개 선택 완료`
              : "스트레칭 선택"}
          </Text>
        </TouchableOpacity>
        <TouchableOpacity
          style={styles.stretchSkipBtn}
          onPress={onSkip}
          activeOpacity={0.85}
        >
          <Text style={styles.stretchSkipText}>뒤로가기</Text>
        </TouchableOpacity>
      </View>
    </View>
  );
};

const StretchDetailContent = ({
  stretches,
  currentIndex,
  onNext,
  onPrev,
  onComplete,
  details,
  detailsLoading,
  identifierResolver,
  timerSeconds = 30,
}: {
  stretches: any[];
  currentIndex: number;
  onNext: () => void;
  onPrev: () => void;
  onComplete: () => void;
  details: Record<string, any>;
  detailsLoading: Record<string, boolean>;
  identifierResolver: (option: any) => string;
  timerSeconds?: number;
}) => {
  if (stretches.length === 0 || currentIndex >= stretches.length) {
    return null;
  }

  const current = stretches[currentIndex];
  const externalId = identifierResolver(current);
  const detail = details[externalId];
  const isLoading = detailsLoading[externalId] || false;

  const displayName =
    detail?.name || current?.name || current?.exerciseName || "스트레칭";
  const rawImage =
    detail?.imageUrl ||
    detail?.image ||
    detail?.imgUrl ||
    detail?.photoUrl ||
    detail?.thumbnailUrl ||
    current?.imageUrl ||
    current?.image ||
    current?.imgUrl ||
    current?.photoUrl ||
    current?.thumbnailUrl;
  const imageSource =
    typeof rawImage === "string" && rawImage.length > 0
      ? { uri: rawImage }
      : STRETCHING_ILLUSTRATION;

  const isLast = currentIndex === stretches.length - 1;
  const isFirst = currentIndex === 0;
  const hasNext = currentIndex < stretches.length - 1;
  const hasPrev = currentIndex > 0;

  return (
    <View style={styles.stretchDetailWrapper}>
      <View style={styles.stretchDetailHeaderRow}>
        <Text style={styles.stretchDetailTitle}>{displayName}</Text>
        <View style={styles.stretchDetailTimer}>
          <Text style={styles.stretchDetailTimerLabel}>남은 시간</Text>
          <Text style={styles.stretchDetailTimerValue}>
            {String(Math.max(0, timerSeconds ?? 0)).padStart(2, "0")}s
          </Text>
        </View>
      </View>
      <View style={styles.stretchDetailCard}>
        <View style={styles.stretchDetailImageContainer}>
          <Image source={imageSource} style={styles.stretchDetailImage} />
          {hasPrev && (
            <TouchableOpacity
              style={styles.stretchDetailPrevArrow}
              onPress={onPrev}
              activeOpacity={0.7}
            >
              <Icon name="chevron-back" size={32} color="#000000" />
            </TouchableOpacity>
          )}
          {hasNext && (
            <TouchableOpacity
              style={styles.stretchDetailNextArrow}
              onPress={onNext}
              activeOpacity={0.7}
            >
              <Icon name="chevron-forward" size={32} color="#000000" />
            </TouchableOpacity>
          )}
        </View>
        <ScrollView
          style={styles.stretchDetailInstructions}
          showsVerticalScrollIndicator={false}
        >
          {(() => {
            // 로딩 중일 때
            if (isLoading) {
              return (
                <View style={styles.stretchDetailLoadingWrapper}>
                  <ActivityIndicator size="small" color="#666666" />
                  <Text style={styles.stretchDetailLoadingText}>
                    설명을 불러오는 중...
                  </Text>
                </View>
              );
            }

            // API에서 설명 데이터 가져오기 (detail 우선, 없으면 current에서)
            const instructions =
              detail?.instructions ||
              detail?.description ||
              detail?.guide ||
              detail?.steps ||
              detail?.howTo ||
              detail?.method ||
              current?.instructions ||
              current?.description ||
              current?.guide ||
              current?.steps ||
              current?.howTo ||
              current?.method;

            // 배열 형태의 단계별 설명
            if (Array.isArray(instructions)) {
              return instructions.map((step: any, idx: number) => {
                const stepTitle =
                  step?.title ||
                  step?.stepTitle ||
                  step?.name ||
                  `단계 ${idx + 1}`;
                const stepText =
                  step?.text ||
                  step?.description ||
                  step?.content ||
                  step?.instruction ||
                  "";
                const stepTexts = Array.isArray(stepText)
                  ? stepText
                  : stepText
                  ? [stepText]
                  : [];

                return (
                  <View key={idx}>
                    <View style={styles.stretchDetailStep}>
                      <Text style={styles.stretchDetailStepNumber}>
                        {idx + 1}
                      </Text>
                      <Text style={styles.stretchDetailStepTitle}>
                        {stepTitle}
                      </Text>
                    </View>
                    {stepTexts.map((text: string, textIdx: number) => (
                      <Text key={textIdx} style={styles.stretchDetailStepText}>
                        {text}
                      </Text>
                    ))}
                  </View>
                );
              });
            }

            // 문자열 형태의 설명
            if (typeof instructions === "string" && instructions.length > 0) {
              // 운동 설명과 동일한 방식으로 Step 처리
              const stepMatches: Array<{ number: string; content: string }> =
                [];

              // 먼저 줄바꿈으로 분리
              const instructionLines = instructions
                .split("\n")
                .filter((line) => line.trim());

              instructionLines.forEach((line) => {
                // 한 줄에 여러 Step이 쉼표로 구분되어 있을 수 있음
                // "Step: 1 ..., Step:2 ..., Step:3 ..." 형식 처리

                // Step: 또는 ,Step: 패턴으로 분리
                const stepParts = line
                  .split(/(?:^|,\s*)Step:/i)
                  .filter((part) => part.trim());
                const foundSteps: Array<{
                  stepNum: number;
                  description: string;
                }> = [];

                stepParts.forEach((part) => {
                  // Step: 다음에 오는 숫자와 설명 추출
                  const stepMatch = part.match(/^\s*(\d+)\s*(.+)$/);
                  if (stepMatch) {
                    const stepNum = parseInt(stepMatch[1], 10);
                    let description = stepMatch[2].trim();
                    // 끝의 쉼표, 점, 공백 제거
                    description = description.replace(/[,\.\s]+$/, "").trim();

                    if (description) {
                      foundSteps.push({ stepNum, description });
                    }
                  }
                });

                // Step: 패턴으로 분리되지 않은 경우, 정규식으로 다시 시도
                if (foundSteps.length === 0) {
                  const stepRegex = /Step:\s*(\d+)\s*([^,]+?)(?=,\s*Step:|$)/gi;
                  let match;

                  while ((match = stepRegex.exec(line)) !== null) {
                    const stepNum = parseInt(match[1], 10);
                    let description = match[2].trim();
                    description = description.replace(/[,\.\s]+$/, "").trim();

                    if (description) {
                      foundSteps.push({ stepNum, description });
                    }
                  }
                }

                // 찾은 Step들을 stepMatches에 추가
                foundSteps.forEach(({ stepNum, description }) => {
                  stepMatches.push({
                    number: stepNum.toString(),
                    content: description,
                  });
                });
              });

              // Step 패턴이 있으면 Step 기준으로 렌더링
              if (stepMatches.length > 0) {
                return stepMatches.map((step, idx) => {
                  return (
                    <View key={idx}>
                      <View style={styles.stretchDetailStep}>
                        <Text style={styles.stretchDetailStepNumber}>
                          {step.number}
                        </Text>
                        <Text style={styles.stretchDetailStepTitle}>
                          {step.content}
                        </Text>
                      </View>
                    </View>
                  );
                });
              }

              // Step 패턴이 없으면 기존대로 줄바꿈으로 분리
              const fallbackLines = instructions
                .split("\n")
                .filter((line) => line.trim());
              return fallbackLines.map((line: string, idx: number) => (
                <Text key={idx} style={styles.stretchDetailStepText}>
                  {line.trim()}
                </Text>
              ));
            }

            // API에 설명이 없으면 기본 더미 데이터 표시
            return (
              <>
                <View style={styles.stretchDetailStep}>
                  <Text style={styles.stretchDetailStepNumber}>1</Text>
                  <Text style={styles.stretchDetailStepTitle}>자세 잡기</Text>
                </View>
                <Text style={styles.stretchDetailStepText}>
                  허리를 곧게 펴고 앉거나 서서, 어깨 힘은 툭 빼고 정면을 본다.
                </Text>

                <View style={styles.stretchDetailStep}>
                  <Text style={styles.stretchDetailStepNumber}>2</Text>
                  <Text style={styles.stretchDetailStepTitle}>손 올리기</Text>
                </View>
                <Text style={styles.stretchDetailStepText}>
                  오른손을 머리 위로 넘겨 왼쪽 귀 위에 가볍게 올린다.
                </Text>
                <Text style={styles.stretchDetailStepText}>
                  반대쪽 팔은 아래로 내려 어깨를 고정한다.
                </Text>

                <View style={styles.stretchDetailStep}>
                  <Text style={styles.stretchDetailStepNumber}>3</Text>
                  <Text style={styles.stretchDetailStepTitle}>
                    천천히 기울이기
                  </Text>
                </View>
                <Text style={styles.stretchDetailStepText}>
                  숨 내쉬면서 머리를 오른쪽으로 부드럽게 기울여
                </Text>
                <Text style={styles.stretchDetailStepText}>
                  왼쪽 목·어깨가 당기는 느낌을 유지한다. (15~30초)
                </Text>

                <View style={styles.stretchDetailStep}>
                  <Text style={styles.stretchDetailStepNumber}>4</Text>
                  <Text style={styles.stretchDetailStepTitle}>반대쪽 반복</Text>
                </View>
                <Text style={styles.stretchDetailStepText}>
                  천천히 정면으로 돌아온 뒤,
                </Text>
                <Text style={styles.stretchDetailStepText}>
                  손 바꿔서 왼쪽으로 기울이는 동작도 동일하게 진행한다.
                </Text>
              </>
            );
          })()}
        </ScrollView>
      </View>
      <TouchableOpacity
        style={styles.stretchDetailCompleteBtn}
        onPress={isLast ? onComplete : onNext}
        activeOpacity={0.85}
      >
        <Text style={styles.stretchDetailCompleteText}>
          {isLast ? "완료" : "다음"}
        </Text>
      </TouchableOpacity>
    </View>
  );
};

const WorkoutIntroModal = ({
  visible,
  stage,
  onStart,
  onSkip,
  stretchProps,
  identifierResolver,
  detailProps,
  exerciseModalProps,
}: WorkoutIntroModalProps) => {
  return (
    <Modal
      visible={visible}
      animationType="none"
      presentationStyle="fullScreen"
      onRequestClose={onSkip}
    >
      <SafeAreaView
        style={
          stage === "stretch"
            ? styles.stretchModalWrapper
            : stage === "detail"
            ? styles.stretchDetailModalWrapper
            : stage === "exercise"
            ? styles.exerciseModalWrapper
            : styles.introModalWrapper
        }
      >
        {stage === "intro" ? (
          <View style={styles.introScreen}>
            <TouchableOpacity
              style={styles.introBackBtn}
              onPress={onSkip}
              activeOpacity={0.7}
            >
              <Icon name="chevron-back" size={22} color="#d6ff4b" />
            </TouchableOpacity>
            <View style={[styles.introDecorCircle, styles.introCircleLarge]} />
            <View style={[styles.introDecorCircle, styles.introCircleSmall]} />
            <View style={[styles.introDecorDot, styles.introDotTopLeft]} />
            <View style={[styles.introDecorDot, styles.introDotBottomRight]} />
            <View style={[styles.introDecorBeam, styles.introBeamLeft]} />
            <View style={[styles.introDecorBeam, styles.introBeamRight]} />
            <View style={styles.introGlow} />
            <View style={styles.introIllustrationWrap}>
              <Image
                source={STRETCHING_ILLUSTRATION}
                style={styles.introIllustration}
              />
            </View>
            <Text style={styles.introGreeting}>안녕하세요 회원님!</Text>
            <Text style={styles.introDescription}>
              무리 없이 스트레칭으로 웜업부터 해봐요!
            </Text>
            <View style={styles.introActionArea}>
              <TouchableOpacity
                style={styles.introPrimaryBtn}
                onPress={onStart}
              >
                <Text style={styles.introPrimaryText}>스트레칭 시작하기</Text>
              </TouchableOpacity>
              <TouchableOpacity
                style={styles.introSecondaryBtn}
                onPress={onSkip}
              >
                <Text style={styles.introSecondaryText}>건너뛰기</Text>
              </TouchableOpacity>
            </View>
          </View>
        ) : stage === "detail" && detailProps ? (
          <StretchDetailContent {...detailProps} />
        ) : stage === "exercise" && exerciseModalProps ? (
          <ExerciseModal
            isOpen={true}
            onClose={exerciseModalProps.onClose}
            mode="add"
            onSave={exerciseModalProps.onSave}
            onWorkoutComplete={exerciseModalProps.onWorkoutComplete}
            onFeedbackUpdate={exerciseModalProps.onFeedbackUpdate}
            fullScreen={true}
            renderContentOnly={true}
          />
        ) : (
          <StretchSelectionContent
            {...stretchProps}
            identifierResolver={identifierResolver}
          />
        )}
      </SafeAreaView>
    </Modal>
  );
};

export default ExerciseScreen;
