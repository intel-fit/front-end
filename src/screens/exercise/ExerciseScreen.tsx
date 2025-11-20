import React, { useState, useEffect, useRef } from "react";
import {
  View,
  Text,
  StyleSheet,
  SafeAreaView,
  ScrollView,
  TouchableOpacity,
  Alert,
  Modal,
  Image,
  FlatList,
  ActivityIndicator,
  TextInput,
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
  fetchDateProgress,
  fetchTodayProgress,
  fetchExercises,
  fetchExerciseDetail,
} from "../../utils/exerciseApi";
import { getExerciseGoalSummary } from "../../utils/exerciseGoalApi";
import { eventBus } from "../../utils/eventBus";
import { useDate } from "../../contexts/DateContext";
import type { DailyProgressWeekItem } from "../../types";

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
}

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

  const [goalData, setGoalData] = useState<ExerciseGoalInfo | null>(null);
  const [completedThisWeek, setCompletedThisWeek] = useState(0);
  const [weeklyCalories, setWeeklyCalories] = useState(0);
  const [weeklyProgress, setWeeklyProgress] = useState<DailyProgressWeekItem[]>(
    []
  );
  const [monthlyProgress, setMonthlyProgress] = useState<
    DailyProgressWeekItem[]
  >([]);
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
  const [userId, setUserId] = useState<string | null>(null);
  const [userIdLoaded, setUserIdLoaded] = useState(false);
  // 운동 완료 모달 상태
  const [showCompletionModal, setShowCompletionModal] = useState(false);
  const [completedExercises, setCompletedExercises] = useState<
    Array<{
      name: string;
      targetMuscle?: string;
      imageUrl?: string;
      time?: string;
      externalId?: string;
    }>
  >([]);
  const [completionSummaryTitle, setCompletionSummaryTitle] = useState("");
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
      parts.push(`${goalData.weeklyCalorieGoal}kcal`);
    }
    if (parts.length === 0) {
      return "목표치가 아직 설정되지 않았습니다";
    }
    return `목표치 | ${parts.join(" · ")}`;
  }, [goalData]);

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
      (activity) => activity.date === todayStr && activity.isCompleted
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
        setUserId(storedUserId);
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

  // 주간 칼로리 합계 로드 (이번 주)
  const loadWeeklyCalories = React.useCallback(async () => {
    try {
      const data = await fetchWeeklyProgress();
      setWeeklyProgress(Array.isArray(data) ? data : []);
      const sum = Array.isArray(data)
        ? data.reduce((s: number, d) => s + Number(d?.totalCalorie || 0), 0)
        : 0;
      setWeeklyCalories(sum);
    } catch (e) {
      console.error("주간 칼로리 로드 실패:", e);
      setWeeklyCalories(0);
      setWeeklyProgress([]);
    }
  }, []);

  React.useEffect(() => {
    if (!userIdLoaded) return;
    loadGoalData();
    // 페이지 열 때 그 주 진행률 가져오기
    loadWeeklyCalories();
    // 페이지 열 때 선택된 날짜의 달 데이터 가져오기
    const dateToFetch = selectedDate || new Date();
    loadMonthlyProgress(dateToFetch.getFullYear(), dateToFetch.getMonth());
  }, [userIdLoaded, loadGoalData, loadWeeklyCalories, selectedDate]);

  // 날짜를 yyyy-MM-dd 형식으로 변환
  const formatDateToString = (date: Date): string => {
    const year = date.getFullYear();
    const month = String(date.getMonth() + 1).padStart(2, "0");
    const day = String(date.getDate()).padStart(2, "0");
    return `${year}-${month}-${day}`;
  };

  // 특정 날짜의 진행률 데이터 가져오기
  const getDayProgress = (date: Date): DailyProgressWeekItem | undefined => {
    const dateStr = formatDateToString(date);
    // 먼저 월별 데이터에서 찾고, 없으면 주간 데이터에서 찾기
    return (
      monthlyProgress.find((item) => item.date === dateStr) ||
      weeklyProgress.find((item) => item.date === dateStr)
    );
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
    }
  }, [monthBase, showMonthView]);

  // 달력을 펼치거나 접을 때 해당 달의 월별 데이터 가져오기
  React.useEffect(() => {
    const dateToFetch = selectedDate || new Date();
    if (showMonthView) {
      // 달력을 펼칠 때 monthBase의 달 데이터 가져오기
      loadMonthlyProgress(monthBase.getFullYear(), monthBase.getMonth());
    } else {
      // 달력을 접을 때 선택된 날짜의 달 데이터 가져오기 (주간 달력 표시 시)
      loadMonthlyProgress(dateToFetch.getFullYear(), dateToFetch.getMonth());
    }
  }, [showMonthView, selectedDate]);

  // 선택된 날짜가 변경될 때 해당 달의 월별 데이터 가져오기
  React.useEffect(() => {
    const dateToFetch = selectedDate || new Date();
    loadMonthlyProgress(dateToFetch.getFullYear(), dateToFetch.getMonth());
  }, [selectedDate]);

  // 화면 포커스 시 목표/진행 재로딩
  // 다른 페이지에 갔다 오거나 식단 기록을 갔다 왔을 때, 탭 바꾸기 등 모든 행동 시
  // 해당 달의 모든 데이터 가져오기
  useFocusEffect(
    React.useCallback(() => {
      if (!userIdLoaded) return;
      loadGoalData();
      loadWeeklyCalories();
      // 해당 달의 월별 데이터 가져오기
      const dateToFetch = selectedDate || new Date();
      loadMonthlyProgress(dateToFetch.getFullYear(), dateToFetch.getMonth());
    }, [userIdLoaded, loadGoalData, loadWeeklyCalories, selectedDate])
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

  const getProgressPercentage = () => {
    if (!goalData) return 0;

    // 실제 allActivities에서 이번 주 완료된 운동 개수 확인
    const now = new Date();
    const todayEnd = new Date(
      now.getFullYear(),
      now.getMonth(),
      now.getDate(),
      23,
      59,
      59,
      999
    );
    const thisWeekStart = new Date(now);
    thisWeekStart.setDate(now.getDate() - now.getDay()); // 일요일로 설정
    thisWeekStart.setHours(0, 0, 0, 0);

    // 이번 주 완료된 운동 개수 (날짜별로 그룹화하여 하루에 1회로만 카운트)
    const todayEndCopy2 = new Date(todayEnd);
    const completedDates = new Set<string>();

    allActivities.forEach((activity) => {
      if (!activity || !activity.date || !activity.isCompleted) return;
      try {
        const activityDate = new Date(activity.date);
        if (isNaN(activityDate.getTime())) return;
        const activityDateOnly = new Date(
          activityDate.getFullYear(),
          activityDate.getMonth(),
          activityDate.getDate()
        );
        const weekStartOnly = new Date(
          thisWeekStart.getFullYear(),
          thisWeekStart.getMonth(),
          thisWeekStart.getDate()
        );
        const todayEndOnly = new Date(
          todayEndCopy2.getFullYear(),
          todayEndCopy2.getMonth(),
          todayEndCopy2.getDate()
        );

        // 이번 주 범위 내에 있고, 완료된 운동이면 날짜를 Set에 추가
        if (
          activityDateOnly >= weekStartOnly &&
          activityDateOnly <= todayEndOnly
        ) {
          // 날짜를 YYYY-MM-DD 형식으로 변환하여 Set에 추가 (하루에 여러 운동을 해도 1회로만 카운트)
          const dateKey = `${activityDateOnly.getFullYear()}-${String(
            activityDateOnly.getMonth() + 1
          ).padStart(2, "0")}-${String(activityDateOnly.getDate()).padStart(
            2,
            "0"
          )}`;
          completedDates.add(dateKey);
        }
      } catch {
        // 에러 발생 시 무시
      }
    });

    // 고유한 날짜의 개수가 실제 완료 횟수 (하루에 여러 운동을 해도 1회로 카운트)
    const actualCompletedThisWeek = completedDates.size;

    // weeklyProgress에서 이번 주 데이터만 필터링하여 칼로리 계산
    // todayEnd를 복사해서 사용 (원본 수정 방지)
    const todayEndCopy = new Date(todayEnd);
    const thisWeekCalories = weeklyProgress
      .filter((item) => {
        if (!item || !item.date) return false;
        try {
          const itemDate = new Date(item.date);
          if (isNaN(itemDate.getTime())) return false;
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
            todayEndCopy.getFullYear(),
            todayEndCopy.getMonth(),
            todayEndCopy.getDate()
          );
          return itemDateOnly >= weekStartOnly && itemDateOnly <= todayEndOnly;
        } catch {
          return false;
        }
      })
      .reduce((sum, item) => {
        const calorie = Number(item?.totalCalorie || 0);
        return sum + (isNaN(calorie) ? 0 : calorie);
      }, 0);

    // 이번 주에 운동 기록이 전혀 없으면 0% 반환
    if (actualCompletedThisWeek === 0 && thisWeekCalories === 0) {
      return 0;
    }

    const frequencyValue = goalData.weeklyFrequency
      ? parseInt(goalData.weeklyFrequency.replace(/[^0-9]/g, ""), 10)
      : NaN;
    const countTarget = Math.max(
      1,
      Number.isNaN(frequencyValue) || frequencyValue <= 0 ? 1 : frequencyValue
    );
    const countRate = Math.min(
      1,
      Math.max(0, actualCompletedThisWeek / countTarget)
    );
    const calorieTarget = Math.max(
      1,
      goalData.weeklyCalorieGoal && goalData.weeklyCalorieGoal > 0
        ? Number(goalData.weeklyCalorieGoal)
        : 1
    );
    const calorieRate = Math.min(
      1,
      Math.max(0, thisWeekCalories / calorieTarget)
    );
    // 이번 주에 운동 기록이 전혀 없으면 0% 반환 (재확인)
    if (actualCompletedThisWeek === 0 && thisWeekCalories === 0) {
      return 0;
    }

    // 운동 횟수 목표를 모두 완료했으면 100% 반환 (먼저 체크)
    if (actualCompletedThisWeek >= countTarget) {
      return 100;
    }

    // 운동 목표 설정 진행률은 운동 횟수만으로 계산 (칼로리 제외)
    const frequencyProgress = countRate;

    // 실제 진행률이 0이면 0% 반환
    if (frequencyProgress === 0) {
      return 0;
    }

    // 운동 횟수 진행률을 그대로 표시 (0~100%)
    const actualProgress = Math.round(frequencyProgress * 100);
    return Math.min(100, actualProgress);
  };

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
            return;
          }
        }
        setAllActivities([]);
      } catch {}
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
    meta?: { externalId?: string; category?: string; imageUrl?: string },
    comment?: string,
    options?: { keepModalOpen?: boolean }
  ) => {
    const allSetsCompleted = sets.every(
      (set: any) => set.isCompleted || set.completed
    );
    const details = `${sets[0]?.weight || 20}kg ${sets[0]?.reps || 12}회 ${
      sets.length
    }세트`;
    const trimmedComment =
      comment && typeof comment === "string" ? comment.trim() : "";
    const commentToSave =
      allSetsCompleted && trimmedComment.length > 0
        ? trimmedComment
        : undefined;

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
    let serverSessionId: string | undefined;
    try {
      const res = await postWorkoutSession(sessionPayload as any);
      console.log("[WORKOUT][POST][OK]", res);
      serverSessionId =
        (res && (res.sessionId || res.data?.sessionId)) ||
        sessionPayload.sessionId;

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
      } catch (progressError) {
        console.error("진행률 조회 실패:", progressError);
      }

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
        const targetId = selectedExercise.id;
        setAllActivities((prevActivities) =>
          prevActivities.map((activity) =>
            activity.id === targetId
              ? {
                  ...activity,
                  name: exerciseName,
                  details,
                  isCompleted: nextCompleted,
                  sessionId: serverSessionId,
                  sets,
                  imageUrl: meta?.imageUrl || activity.imageUrl,
                  comment:
                    nextCompleted && commentToSave !== undefined
                      ? commentToSave
                      : nextCompleted
                      ? activity.comment
                      : undefined,
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
          imageUrl: meta?.imageUrl,
          sets,
          comment: commentToSave,
        };
        setAllActivities((prevActivities) => [...prevActivities, newWorkout]);
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
      return undefined; // 에러 시 undefined 반환
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
            const target = allActivities.find((a) => a.id === workoutId);
            const targetDate = target?.date;

            if (sessionId) {
              const res = await deleteWorkoutSession(sessionId);
              console.log("[WORKOUT][DELETE][OK]", res);
            }

            // 운동 삭제 후 해당 날짜의 진행률 다시 가져오기
            if (targetDate) {
              try {
                const today = new Date();
                const targetDateObj = new Date(targetDate);
                const isToday =
                  targetDateObj.getFullYear() === today.getFullYear() &&
                  targetDateObj.getMonth() === today.getMonth() &&
                  targetDateObj.getDate() === today.getDate();

                let dateProgress: DailyProgressWeekItem;
                if (isToday) {
                  dateProgress = await fetchTodayProgress();
                } else {
                  dateProgress = await fetchDateProgress(targetDate);
                }

                // 주간 진행률 업데이트
                setWeeklyProgress((prev) => {
                  const index = prev.findIndex(
                    (item) => item.date === targetDate
                  );
                  if (index >= 0) {
                    const updated = [...prev];
                    updated[index] = dateProgress;
                    return updated;
                  }
                  return prev;
                });

                // 월별 진행률 업데이트
                setMonthlyProgress((prev) => {
                  const index = prev.findIndex(
                    (item) => item.date === targetDate
                  );
                  if (index >= 0) {
                    const updated = [...prev];
                    updated[index] = dateProgress;
                    return updated;
                  }
                  return prev;
                });

                // 해당 달의 월별 데이터 전체 다시 가져오기
                loadMonthlyProgress(
                  targetDateObj.getFullYear(),
                  targetDateObj.getMonth()
                );
              } catch (progressError) {
                console.error("진행률 조회 실패:", progressError);
              }
            }
          } catch (e) {
            console.error("[WORKOUT][DELETE][FAIL]", e);
          } finally {
            const target = allActivities.find((a) => a.id === workoutId);
            const updatedActivities = allActivities.filter(
              (activity) => activity.id !== workoutId
            );
            setAllActivities(updatedActivities);

            // 이번 주에 완료된 운동 개수 다시 계산
            const today = new Date();
            const thisWeekStart = new Date(today);
            thisWeekStart.setDate(today.getDate() - today.getDay()); // 일요일로 설정
            thisWeekStart.setHours(0, 0, 0, 0);

            const thisWeekCompleted = updatedActivities.filter((activity) => {
              const activityDate = new Date(activity.date);
              activityDate.setHours(0, 0, 0, 0);
              return (
                activity.isCompleted &&
                activityDate >= thisWeekStart &&
                activityDate <= today
              );
            }).length;

            // 완료 횟수와 칼로리를 즉시 업데이트
            setCompletedCountPersist(thisWeekCompleted);
            // 주간 칼로리 다시 계산 (비동기이므로 await)
            (async () => {
              try {
                await loadWeeklyCalories();
              } catch (error) {
                console.error(
                  "[WORKOUT][DELETE] 주간 칼로리 재계산 실패:",
                  error
                );
              }
            })();

            eventBus.emit("workoutSessionDeleted", {
              sessionId,
              exerciseName: target?.name,
              workoutDate: target?.date,
            });
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
                        const calories = dayProgress?.totalCalorie || 0;
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
                    <View style={styles.logTextBlock}>
                      <Text
                        style={[
                          styles.logName,
                          !activity.isCompleted && styles.logNamePending,
                          activity.isCompleted && styles.logNameCompleted,
                        ]}
                      >
                        {activity.name}
                      </Text>
                      <Text
                        style={[
                          styles.logDetails,
                          activity.isCompleted && styles.logDetailsCompleted,
                        ]}
                      >
                        {activity.details}
                      </Text>
                    </View>
                  </View>
                  <Text
                    style={[
                      styles.logTime,
                      activity.isCompleted && styles.logTimeCompleted,
                    ]}
                  >
                    {activity.time}
                  </Text>
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
                style={[styles.actionBtn, styles.stretchActionBtn]}
                onPress={handleStretchButtonPress}
              >
                <Text style={styles.actionBtnText}>스트레칭</Text>
              </TouchableOpacity>
              <TouchableOpacity
                style={[styles.actionBtn, styles.workoutActionBtn]}
                onPress={handleWorkoutStartPress}
              >
                <Text style={[styles.actionBtnText, styles.workoutActionText]}>
                  운동 시작하기
                </Text>
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
        onWorkoutComplete={(exercises) => {
          setCompletedExercises(exercises);
          setCompletionSummaryTitle("오늘의 운동");
          setShowCompletionModal(true);
          handleModalClose();
        }}
        fullScreen={modalMode === "add"}
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
                  setCompletedExercises(exercises);
                  setShowCompletionModal(true);
                  setIsIntroVisible(false);
                  setIntroStage("intro");
                },
              }
            : undefined
        }
      />

      {/* 운동 완료 모달 */}
      <Modal
        visible={showCompletionModal}
        animationType="fade"
        transparent={true}
        statusBarTranslucent={true}
        onRequestClose={() => {
          setShowCompletionModal(false);
        }}
      >
        <View style={styles.completionModalOverlay}>
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

            {/* 완료된 운동 및 스트레칭 목록 */}
            <View style={styles.completedExercisesCard}>
              <Text style={styles.completedExercisesDate}>
                {new Date().getFullYear()}.
                {String(new Date().getMonth() + 1).padStart(2, "0")}.
                {String(new Date().getDate()).padStart(2, "0")}
              </Text>
              <View style={styles.completedExercisesList}>
                {/* 오늘 완료된 운동 및 스트레칭 모두 표시 */}
                {(() => {
                  const today = new Date();
                  const todayStr = formatDateToString(today);

                  // 오늘 완료된 모든 활동 (운동 + 스트레칭)
                  const todayCompletedActivities = allActivities.filter(
                    (activity) =>
                      activity.date === todayStr && activity.isCompleted
                  );

                  // 운동은 completedExercises에서, 스트레칭은 allActivities에서 가져오기
                  const exerciseMap = new Map<string, any>();
                  completedExercises.forEach((ex) => {
                    exerciseMap.set(ex.name, ex);
                  });

                  // allActivities에서 오늘 완료된 항목들을 시간순으로 정렬
                  const allItems = todayCompletedActivities.map((activity) => {
                    const isStretch =
                      activity.details?.includes("스트레칭") ||
                      activity.name?.includes("스트레칭");
                    const exerciseData = exerciseMap.get(activity.name);
                    const externalId =
                      activity.externalId || exerciseData?.externalId;
                    const idKey = externalId ? String(externalId) : undefined;
                    const nameKey = activity.name
                      ? activity.name.toLowerCase()
                      : undefined;

                    // 이미지 URL 우선순위: activity.imageUrl > exerciseData?.imageUrl > exerciseImages[externalId] > exerciseImagesByName[name]
                    const displayUrl =
                      activity.imageUrl ||
                      exerciseData?.imageUrl ||
                      (idKey ? exerciseImages[idKey] : undefined) ||
                      (nameKey ? exerciseImagesByName[nameKey] : undefined);

                    return {
                      name: activity.name,
                      targetMuscle: isStretch
                        ? activity.details?.replace(" 스트레칭", "") || ""
                        : exerciseData?.targetMuscle || "",
                      imageUrl: displayUrl,
                      time: activity.time,
                      isStretch: isStretch,
                      activityId: activity.id,
                    };
                  });

                  // 시간순으로 정렬 (오래된 것부터)
                  allItems.sort((a, b) => {
                    if (!a.time || !b.time) return 0;
                    // 오전/오후 형식 처리
                    const parseTime = (timeStr: string): number => {
                      const isAM = timeStr.includes("오전");
                      const isPM = timeStr.includes("오후");
                      const numbers = timeStr.match(/\d+/g);
                      if (!numbers || numbers.length < 2) return 0;
                      let hour = parseInt(numbers[0], 10);
                      const minute = parseInt(numbers[1], 10);
                      if (isPM && hour !== 12) hour += 12;
                      if (isAM && hour === 12) hour = 0;
                      return hour * 60 + minute;
                    };
                    return parseTime(a.time) - parseTime(b.time);
                  });

                  return allItems.map((item, index) => (
                    <View
                      key={index}
                      style={[
                        styles.completedExerciseItem,
                        index === allItems.length - 1 &&
                          styles.completedExerciseItemLast,
                      ]}
                    >
                      <View style={styles.completedExerciseIcon}>
                        {item.imageUrl ? (
                          <Image
                            source={{ uri: item.imageUrl }}
                            style={styles.completedExerciseImage}
                            resizeMode="cover"
                          />
                        ) : (
                          <Icon
                            name={item.isStretch ? "fitness" : "barbell"}
                            size={24}
                            color="#666666"
                          />
                        )}
                      </View>
                      <View style={styles.completedExerciseInfo}>
                        <View style={styles.completedExerciseNameRow}>
                          <Text style={styles.completedExerciseName}>
                            {item.name}
                          </Text>
                          {item.time && (
                            <Text style={styles.completedExerciseTime}>
                              {item.time}
                            </Text>
                          )}
                        </View>
                        <Text style={styles.completedExerciseMuscle}>
                          {item.targetMuscle || ""}
                        </Text>
                      </View>
                    </View>
                  ));
                })()}
              </View>
            </View>

            {/* 확인 버튼 */}
            <TouchableOpacity
              style={styles.completionConfirmButton}
              onPress={() => setShowCompletionModal(false)}
            >
              <Text style={styles.completionConfirmButtonText}>확인</Text>
            </TouchableOpacity>
          </View>
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
    paddingVertical: 12,
    paddingHorizontal: 16,
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
    gap: 10,
  },
  logTextBlock: {
    gap: 4,
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
  logNameCompleted: {
    color: colors.textLight, // 완료된 항목은 회색 텍스트
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
  addItem: {
    flexDirection: "row",
    gap: 10,
    marginTop: 12,
  },
  actionBtn: {
    flex: 1,
    borderRadius: 12,
    paddingVertical: 14,
    alignItems: "center",
    justifyContent: "center",
    borderWidth: 1,
    borderColor: colors.border,
    backgroundColor: colors.grayDark,
  },
  stretchActionBtn: {
    backgroundColor: colors.grayDark,
    borderColor: colors.grayLight,
  },
  workoutActionBtn: {
    backgroundColor: "#E3FF7C",
    borderColor: "#E3FF7C",
  },
  actionBtnText: {
    fontSize: 15,
    fontWeight: "600",
    color: colors.text,
  },
  workoutActionText: {
    color: colors.black,
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
    borderBottomWidth: 1,
    borderBottomColor: "#E0E0E0",
  },
  completedExerciseItemLast: {
    borderBottomWidth: 0,
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
    alignItems: "center",
    marginBottom: 4,
  },
  completedExerciseName: {
    fontSize: 16,
    fontWeight: "600",
    color: "#000000",
    flex: 1,
  },
  completedExerciseTime: {
    fontSize: 14,
    fontWeight: "400",
    color: "#666666",
    marginLeft: 8,
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
  completionConfirmButtonText: {
    fontSize: 16,
    fontWeight: "600",
    color: "#ffffff",
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
      }>
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
              const lines = instructions
                .split("\n")
                .filter((line) => line.trim());
              return lines.map((line: string, idx: number) => (
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
