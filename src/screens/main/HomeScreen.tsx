// src/screens/main/HomeScreen.tsx

import React, { useState, useEffect, useRef } from "react";
import {
  View,
  Text,
  StyleSheet,
  ScrollView,
  TouchableOpacity,
  Image,
  Alert,
} from "react-native";
import { SafeAreaView } from "react-native-safe-area-context";
import { MaterialIcons, Ionicons } from "@expo/vector-icons";
import { LinearGradient } from "expo-linear-gradient";
import { colors } from "../../theme/colors";
import { ROUTES } from "../../constants/routes";
import { useDate } from "../../contexts/DateContext";
import { homeAPI, authAPI, mealAPI, recommendedExerciseAPI, recommendedMealAPI } from "../../services";
import type { WeeklyCoachReport } from "../../services/homeAPI";
import {
  getTodayWorkoutTime,
  fetchSavedWorkouts,
  getWorkoutCalories,
} from "../../utils/exerciseApi";
import { getLatestInBody } from "../../utils/inbodyApi";
import AsyncStorage from "@react-native-async-storage/async-storage";
import { ACCESS_TOKEN_KEY } from "../../services/apiConfig";
import type { DailyProgressWeekItem, HomeResponse } from "../../types";
import { eventBus } from "../../utils/eventBus";

const HomeScreen = ({ navigation }: any) => {
  const { selectedDate, setSelectedDate } = useDate();
  const [weeklyProgress, setWeeklyProgress] = useState<DailyProgressWeekItem[]>(
    []
  );
  const [homeData, setHomeData] = useState<HomeResponse | null>(null);
  const [todayWorkoutSeconds, setTodayWorkoutSeconds] = useState(0);
  const [todayExerciseCount, setTodayExerciseCount] = useState(0);
  const [todayCalories, setTodayCalories] = useState(0);
  const [inBodyData, setInBodyData] = useState<any>(null);
  // 각 날짜별 운동 시간(초) 데이터
  const [dailyWorkoutSeconds, setDailyWorkoutSeconds] = useState<Record<string, number>>({});
  const isLoadingRef = useRef(false);

  // 멤버십 정보 state
  const [membershipType, setMembershipType] = useState<string>("FREE");
  const [mealTokens, setMealTokens] = useState<number>(0);

  // 코치 리포트 state
  const [coachReport, setCoachReport] = useState<WeeklyCoachReport | null>(null);
  const [randomActionItem, setRandomActionItem] = useState<string | null>(null);
  // AI 코멘트 state (이전 값과 비교하여 변경된 것만 표시)
  const [aiComment, setAiComment] = useState<string | null>(null);
  // 추천 운동 요약 state
  const [tempExerciseSummary, setTempExerciseSummary] = useState<{
    date: string;
    focus: string;
    durationMin: number;
    kcal: number;
    exerciseCount: number;
    title: string;
  } | null>(null);

  // 시간대별 식단 추천 state
  const [mealRecommendation, setMealRecommendation] = useState<{
    mealType: "BREAKFAST" | "LUNCH" | "DINNER";
    mealTypeName: string;
    foods: Array<{
      id: number;
      foodName: string;
      servingSize: number;
    }>;
    totalCalories: number;
  } | null>(null);
  const [todayRecordedMeals, setTodayRecordedMeals] = useState<Set<string>>(new Set());

  // 위젯 순서 state
  const [widgetOrder, setWidgetOrder] = useState<string[]>([
    'recommendationCard',
    'notificationCard',
    'weekCalendar',
    'exerciseRoutineCard',
    'exerciseStatsCard',
    'bodyStatsCard',
    'mealRecommendationCard',
    'calorieCard',
  ]);


  // 날짜 형식 변환 함수 (Date -> yyyy-MM-dd)
  // 한국 시간대(UTC+9) 기준으로 날짜 계산
  const formatDateToString = (date: Date): string => {
    // 한국 시간대(Asia/Seoul) 기준으로 날짜 문자열 생성
    const koreaDateStr = date.toLocaleDateString("en-CA", {
      timeZone: "Asia/Seoul",
    }); // "YYYY-MM-DD" 형식
    return koreaDateStr;
  };

  // 운동 시간을 시:분:초 형식으로 변환
  const formatWorkoutTime = (seconds: number): string => {
    const hours = Math.floor(seconds / 3600);
    const minutes = Math.floor((seconds % 3600) / 60);
    const secs = seconds % 60;
    return `${String(hours).padStart(2, "0")}:${String(minutes).padStart(
      2,
      "0"
    )}:${String(secs).padStart(2, "0")}`;
  };

  // 주간 진행률 데이터 로드
  const loadWeeklyProgress = async () => {
    try {
      console.log('🏠 [홈 화면] 주간 진행률 데이터 로드 시작');
      const data = await homeAPI.getWeeklyProgress();
      console.log('🏠 [홈 화면] 주간 진행률 데이터 수신 완료:', data);

      // 이번 주의 날짜 범위 계산 (일~토)
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
      const startOfWeek = getStartOfWeek(today);
      
      // 이번 주의 각 날짜에 대해 칼로리 데이터 가져오기
      const weekDates = Array.from({ length: 7 }).map((_, i) => {
        const d = new Date(
          startOfWeek.getFullYear(),
          startOfWeek.getMonth(),
          startOfWeek.getDate() + i
        );
        return formatDateToString(d);
      });

      console.log('🏠 [홈 화면] 이번 주 날짜 (7일):', weekDates);

      // 각 날짜에 대해 영양성분 요약 조회 (병렬 처리 - 7번 호출)
      console.log('🏠 [홈 화면] 이번 주 칼로리 데이터 조회 시작 (7일 병렬 호출)');
      const nutritionPromises = weekDates.map(async (date, index) => {
        try {
          console.log(`📡 [홈 화면] ${index + 1}/7 - ${date} 영양성분 조회 중...`);
          const summary = await mealAPI.getNutritionSummary(date);
          const calories = summary.calories || 0;
          console.log(`✅ [홈 화면] ${index + 1}/7 - ${date} 칼로리: ${calories}kcal`);
          return { date, calories };
        } catch (error) {
          console.error(`❌ [홈 화면] ${index + 1}/7 - ${date} 영양성분 조회 실패:`, error);
          return { date, calories: 0 };
        }
      });

      const nutritionResults = await Promise.all(nutritionPromises);
      console.log('🏠 [홈 화면] 이번 주 칼로리 데이터 조회 완료 (7일):', nutritionResults);

      // 각 날짜에 대해 운동 시간 조회 (병렬 처리 - 7번 호출)
      console.log('🏠 [홈 화면] 이번 주 운동 시간 데이터 조회 시작 (7일 병렬 호출)');
      const workoutTimePromises = weekDates.map(async (date, index) => {
        try {
          console.log(`📡 [홈 화면] ${index + 1}/7 - ${date} 운동 시간 조회 중...`);
          const progress = await homeAPI.getTodayProgress(date);
          const totalSeconds = progress.totalExerciseSeconds || 0;
          console.log(`✅ [홈 화면] ${index + 1}/7 - ${date} 운동 시간: ${totalSeconds}초`);
          return { date, totalSeconds };
        } catch (error) {
          console.error(`❌ [홈 화면] ${index + 1}/7 - ${date} 운동 시간 조회 실패:`, error);
          return { date, totalSeconds: 0 };
        }
      });

      const workoutTimeResults = await Promise.all(workoutTimePromises);
      console.log('🏠 [홈 화면] 이번 주 운동 시간 데이터 조회 완료 (7일):', workoutTimeResults);

      // 운동 시간 데이터를 state에 저장 (초 단위)
      const workoutSecondsMap: Record<string, number> = {};
      workoutTimeResults.forEach(({ date, totalSeconds }) => {
        workoutSecondsMap[date] = totalSeconds;
      });
      setDailyWorkoutSeconds(prev => ({ ...prev, ...workoutSecondsMap }));

      // 기존 데이터와 병합 (칼로리 데이터 업데이트)
      let updatedData: DailyProgressWeekItem[] = [];
      
      if (Array.isArray(data) && data.length > 0) {
        // 기존 데이터를 기반으로 업데이트
        updatedData = weekDates.map((date) => {
          const existingItem = data.find((item) => item.date === date);
          const nutritionItem = nutritionResults.find((item) => item.date === date);
          
          return {
            date,
            exerciseRate: existingItem?.exerciseRate ?? 0,
            totalCalorie: nutritionItem?.calories ?? existingItem?.totalCalorie ?? 0,
          };
        });
      } else {
        // 기존 데이터가 없으면 영양성분 데이터만 사용
        updatedData = weekDates.map((date) => {
          const nutritionItem = nutritionResults.find((item) => item.date === date);
          return {
            date,
            exerciseRate: 0,
            totalCalorie: nutritionItem?.calories ?? 0,
          };
        });
      }

      setWeeklyProgress(updatedData);
      console.log('🏠 [홈 화면] 주간 진행률 상태 업데이트 완료:', updatedData.length, '개');
    } catch (e: any) {
      console.error("❌ [홈 화면] 주간 진행률 로드 실패:", e);
      setWeeklyProgress([]);
    }
  };


  // 특정 날짜의 진행률 데이터 가져오기
  const getDayProgress = (date: Date): DailyProgressWeekItem | undefined => {
    const dateStr = formatDateToString(date);
    return weeklyProgress.find((item) => item.date === dateStr);
  };

  // 홈 데이터 로드
  const loadHomeData = async () => {
    try {
      const today = new Date();
      const dateString = formatDateToString(today);

      console.log("[HOME][홈데이터] 날짜 확인:", {
        today: today.toISOString(),
        dateString,
        year: today.getFullYear(),
        month: today.getMonth() + 1,
        day: today.getDate(),
        timezone: Intl.DateTimeFormat().resolvedOptions().timeZone,
      });

      // 날짜 형식 검증
      if (!dateString || !/^\d{4}-\d{2}-\d{2}$/.test(dateString)) {
        console.error("[HOME][홈데이터] 잘못된 날짜 형식:", dateString);
        setHomeData(null);
        return;
      }

      // 홈 데이터, 식단 데이터, 영양 목표를 병렬로 가져오기
      const [homeDataResponse, dailyMealsResponse, nutritionGoalResponse] = await Promise.allSettled([
        homeAPI.getHomeData(dateString),
        mealAPI.getDailyMeals(dateString).catch((err) => {
          console.warn("[HOME][식단데이터] 식단 데이터 로드 실패:", err);
          return null;
        }),
        mealAPI.getNutritionGoal(dateString).catch((err) => {
          console.warn("[HOME][영양목표] 영양 목표 로드 실패:", err);
          return null;
        }),
      ]);

      let data: HomeResponse | null = null;
      if (homeDataResponse.status === "fulfilled") {
        data = homeDataResponse.value;
      } else {
        console.error("[HOME][홈데이터] 홈 데이터 로드 실패:", homeDataResponse.reason);
      }

      // 식단 데이터가 있으면 영양소 정보 업데이트
      if (data && dailyMealsResponse.status === "fulfilled" && dailyMealsResponse.value) {
        const dailyMeals = dailyMealsResponse.value;
        if (data.todayMeal) {
          // 식단 데이터가 있으면 무조건 업데이트 (0이어도)
          data.todayMeal.totalCalories = dailyMeals.dailyTotalCalories || 0;
          data.todayMeal.totalCarbs = dailyMeals.dailyTotalCarbs || 0;
          data.todayMeal.totalProtein = dailyMeals.dailyTotalProtein || 0;
          data.todayMeal.totalFat = dailyMeals.dailyTotalFat || 0;
        }
        console.log("[HOME][식단데이터] 영양소 정보 업데이트:", {
          dailyMeals: {
            dailyTotalCalories: dailyMeals.dailyTotalCalories,
            dailyTotalCarbs: dailyMeals.dailyTotalCarbs,
            dailyTotalProtein: dailyMeals.dailyTotalProtein,
            dailyTotalFat: dailyMeals.dailyTotalFat,
            mealsCount: dailyMeals.meals?.length || 0,
          },
          updated: {
            carbs: data.todayMeal?.totalCarbs,
            protein: data.todayMeal?.totalProtein,
            fat: data.todayMeal?.totalFat,
            calories: data.todayMeal?.totalCalories,
          },
        });
      } else if (data && dailyMealsResponse.status === "rejected") {
        console.warn("[HOME][식단데이터] 식단 데이터 로드 실패:", dailyMealsResponse.reason);
      }

      // 영양 목표가 있으면 목표 칼로리 업데이트
      if (data && nutritionGoalResponse.status === "fulfilled" && nutritionGoalResponse.value) {
        const nutritionGoal = nutritionGoalResponse.value;
        if (data.todayMeal) {
          // mealAPI.getNutritionGoal은 NutritionGoal 타입 반환 (targetCalories 필드 사용)
          const targetCalories = nutritionGoal.targetCalories || nutritionGoal.target_calorie || nutritionGoal.target_calories || 0;
          // 목표 칼로리를 명시적으로 설정 (0이어도 0으로 설정)
          data.todayMeal.targetCalories = targetCalories;
          
          // 달성률 재계산
          if (data.todayMeal.totalCalories > 0 && data.todayMeal.targetCalories > 0) {
            data.todayMeal.calorieAchievementRate = Math.min(
              100,
              (data.todayMeal.totalCalories / data.todayMeal.targetCalories) * 100
            );
          } else {
            data.todayMeal.calorieAchievementRate = 0;
          }
        }
        console.log("[HOME][영양목표] 목표 칼로리 업데이트:", {
          nutritionGoal,
          targetCalories: data.todayMeal?.targetCalories,
          achievementRate: data.todayMeal?.calorieAchievementRate,
        });
      } else if (data && nutritionGoalResponse.status === "rejected") {
        console.warn("[HOME][영양목표] 영양 목표 로드 실패:", nutritionGoalResponse.reason);
        // 영양 목표 로드 실패 시 0으로 설정
        if (data.todayMeal) {
          data.todayMeal.targetCalories = 0;
        }
      } else if (data && data.todayMeal) {
        // 영양 목표 응답이 없을 때도 0으로 설정
        data.todayMeal.targetCalories = 0;
      }

      // 식단 데이터가 없어도 todayMeal이 없으면 기본값 설정
      if (data && !data.todayMeal) {
        data.todayMeal = {
          date: dateString,
          totalCalories: 0,
          targetCalories: 0,
          calorieAchievementRate: 0,
          totalCarbs: 0,
          totalProtein: 0,
          totalFat: 0,
          mealCount: 0,
          message: "",
        };
      }

      // 식단 데이터가 없을 때도 기본값 설정
      if (data && data.todayMeal) {
        // 식단 데이터가 없으면 0으로 설정 (이미 위에서 처리됨)
        if (dailyMealsResponse.status !== "fulfilled" || !dailyMealsResponse.value) {
          data.todayMeal.totalCalories = data.todayMeal.totalCalories || 0;
          data.todayMeal.totalCarbs = data.todayMeal.totalCarbs || 0;
          data.todayMeal.totalProtein = data.todayMeal.totalProtein || 0;
          data.todayMeal.totalFat = data.todayMeal.totalFat || 0;
        }
      }

      setHomeData(data);
    } catch (e: any) {
      // 500 에러는 서버 측 문제이므로 조용히 처리
      const status = e?.status || e?.response?.status;
      if (status === 500) {
        console.warn("[HOME][홈데이터] 서버 오류 (500):", {
          date: formatDateToString(new Date()),
          error: e?.message || e?.data?.message,
        });
      } else {
        console.error("[HOME][홈데이터] 홈 데이터 로드 실패:", e);
      }
      setHomeData(null);
    }
  };


  // 오늘의 총 운동 시간 조회 (백엔드 API 사용)
  const loadTodayWorkoutTime = async () => {
    try {
      // userId 가져오기 - handleExerciseSave와 동일한 패턴
      let finalUserId: number | null = null;

      // AsyncStorage에서 userId 가져오기
      const userIdStr = await AsyncStorage.getItem("userId");
      if (userIdStr && userIdStr.trim() !== "") {
        const parsed = parseInt(userIdStr, 10);
        if (!isNaN(parsed)) {
          finalUserId = parsed;
          console.log("[HOME][DEBUG] AsyncStorage userId를 숫자로 변환:", finalUserId);
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
            console.log("[HOME][DEBUG] JWT payload:", payload);
            
            // userPk를 우선 확인 (숫자 ID), 그 다음 userId, 마지막으로 sub
            if (payload.userPk) {
              const parsed = typeof payload.userPk === 'number' ? payload.userPk : parseInt(payload.userPk, 10);
              if (!isNaN(parsed)) {
                finalUserId = parsed;
                console.log("[HOME][DEBUG] JWT에서 userPk 추출:", finalUserId);
              }
            } else if (payload.userId) {
              const parsed = typeof payload.userId === 'number' ? payload.userId : parseInt(payload.userId, 10);
              if (!isNaN(parsed)) {
                finalUserId = parsed;
                console.log("[HOME][DEBUG] JWT에서 userId 추출:", finalUserId);
              }
            } else if (payload.sub) {
              const parsed = parseInt(payload.sub, 10);
              if (!isNaN(parsed)) {
                finalUserId = parsed;
                console.log("[HOME][DEBUG] JWT에서 sub 추출:", finalUserId);
              }
            }
          }
        } catch (e) {
          console.error("[HOME][DEBUG] JWT 디코딩 실패:", e);
        }
      }

      if (!finalUserId) {
        console.warn("[HOME][DEBUG] userId를 찾을 수 없음, 0으로 설정");
        setTodayWorkoutSeconds(0);
        setTodayExerciseCount(0);
        setTodayCalories(0);
        return;
      }

      const userId = finalUserId;

      // 1) 오늘의 운동 시간은 백엔드 API에서 그대로 사용
      const timeResponse = await getTodayWorkoutTime(userId);
      const totalSeconds = Number(timeResponse?.totalSeconds) || 0;
      console.log("[HOME][운동시간] API 응답:", timeResponse);
      setTodayWorkoutSeconds(totalSeconds >= 0 ? totalSeconds : 0);

      // 2) 오늘 완료한 고유 운동 종목 수는 savedWorkouts 기반으로 계산
      const today = new Date();
      const dateString = formatDateToString(today);

      // 3) 오늘의 소모 칼로리 조회
      try {
        const caloriesResponse = await getWorkoutCalories(userId, dateString);
        const totalCalories = Number(caloriesResponse?.totalCalories) || 0;
        console.log("[HOME][소모칼로리] API 응답:", caloriesResponse);
        setTodayCalories(totalCalories >= 0 ? totalCalories : 0);
      } catch (caloriesError) {
        console.error("[HOME][소모칼로리] 소모 칼로리 조회 실패:", caloriesError);
        setTodayCalories(0);
      }

      console.log("[HOME][운동시간] 날짜 확인:", {
        today: today.toISOString(),
        dateString,
        year: today.getFullYear(),
        month: today.getMonth() + 1,
        day: today.getDate(),
        timezone: Intl.DateTimeFormat().resolvedOptions().timeZone,
      });

      // 날짜 형식 검증
      if (!dateString || !/^\d{4}-\d{2}-\d{2}$/.test(dateString)) {
        console.error("[HOME][운동시간] 잘못된 날짜 형식:", dateString);
        setTodayWorkoutSeconds(0);
        setTodayExerciseCount(0);
        setTodayCalories(0);
        return;
      }
      const savedWorkouts = await fetchSavedWorkouts(userId, dateString);

      if (!savedWorkouts || savedWorkouts.length === 0) {
        console.log(
          "[HOME][운동종목수] 오늘 운동 기록 없음, 개수 0으로 설정",
          {
            date: dateString,
            savedWorkoutsLength: savedWorkouts?.length || 0,
          }
        );
        setTodayExerciseCount(0);
        setTodayCalories(0);
        return;
      }

      // 오늘 완료한 고유한 운동 종목 수 계산
      // ExerciseScreen의 중복 제거 로직과 동일하게 적용
      // 같은 날짜, 같은 saveTitle, 같은 운동명을 가진 활동은 하나만 카운트
      const seenKeys = new Set<string>();
      
      // 모든 그룹의 모든 세션의 모든 레코드를 순회하면서 고유한 운동만 추출
      savedWorkouts.forEach((group) => {
        if (!group || !Array.isArray(group.sessions)) return;
        
        const normalizedTitle = (group.title || "").trim().toLowerCase();
        
        group.sessions.forEach((session) => {
          if (!session || !Array.isArray(session.records)) return;
          
          // records를 exerciseName별로 그룹화 (ExerciseScreen의 로직과 동일)
          const exerciseMap = new Map<string, typeof session.records>();
          session.records.forEach((record) => {
            if (record?.exerciseName && record.exerciseName.trim() !== "") {
              const exerciseName = record.exerciseName.trim();
              if (!exerciseMap.has(exerciseName)) {
                exerciseMap.set(exerciseName, []);
              }
              exerciseMap.get(exerciseName)!.push(record);
            }
          });
          
          // 각 운동별로 중복 제거 키 생성 (ExerciseScreen과 동일한 로직)
          exerciseMap.forEach((records, exerciseName) => {
            // ExerciseScreen의 중복 제거 키: `${activity.date}__${normalizedSaveTitle}__${activity.name.trim()}`
            const dedupeKey = `${dateString}__${normalizedTitle}__${exerciseName}`;
            
            // 이미 본 운동이면 스킵 (중복 제거)
            if (!seenKeys.has(dedupeKey)) {
              seenKeys.add(dedupeKey);
            }
          });
        });
      });

      const exerciseCount = seenKeys.size;
      console.log("[HOME][운동종목수] 오늘 완료한 운동 종목 수 (ExerciseScreen 로직 적용):", {
        date: dateString,
        exerciseCount,
        exerciseKeys: Array.from(seenKeys),
        savedWorkoutsCount: savedWorkouts.length,
        sessionsCount: savedWorkouts.reduce((sum, group) => sum + (group.sessions?.length || 0), 0),
      });
      setTodayExerciseCount(exerciseCount);
    } catch (e: any) {
      const status = e?.response?.status || e?.status;
      if (status === 500) {
        console.warn(
          "[HOME][운동시간] 서버 오류 (500), 운동 시간/종목 0으로 설정:",
          {
            date: formatDateToString(new Date()),
            error: e?.message || e?.response?.data?.message,
          }
        );
      } else {
        console.error("[HOME][운동시간] 오늘 운동 시간 조회 실패:", e);
      }
      setTodayWorkoutSeconds(0);
      setTodayExerciseCount(0);
      setTodayCalories(0);
    }
  };

  // 최신 인바디 데이터 로드
  const loadInBodyData = async () => {
    try {
      const latestRecord = await getLatestInBody();
      if (latestRecord) {
        const latestData = latestRecord?.success
          ? latestRecord.inBody
          : latestRecord;
        setInBodyData(latestData);
      } else {
        setInBodyData(null);
      }
    } catch (e: any) {
      console.error("인바디 데이터 로드 실패:", e);
      setInBodyData(null);
    }
  };

  // 프로필 정보 로드 (멤버십 확인용)
  const loadProfileInfo = async () => {
    try {
      const profile = await authAPI.getProfile();
      setMembershipType(profile.membershipType);
      setMealTokens(profile.mealRecommendTokens ?? 1);
    } catch (error) {
      console.error("프로필 로드 실패:", error);
      setMembershipType("FREE");
      setMealTokens(1);
    }
  };

  // 코치 리포트 로드
  const loadCoachReport = async () => {
    try {
      const report = await homeAPI.getWeeklyCoachReport();
      setCoachReport(report);
      
      // action_items에서 랜덤으로 1개 선택
      selectRandomActionItem(report);
    } catch (error: any) {
      console.error("코치 리포트 로드 실패:", error);
      setCoachReport(null);
      setRandomActionItem(null);
    }
  };

  // AI 코멘트 로드 및 비교
  const loadAIComments = async () => {
    try {
      console.log('[HOME] AI 코멘트 로드 시작');
      
      // 이전 코멘트 가져오기
      const previousCommentsKey = 'previousAIComments';
      const previousCommentsStr = await AsyncStorage.getItem(previousCommentsKey);
      const previousComments: Record<string, string> = previousCommentsStr 
        ? JSON.parse(previousCommentsStr) 
        : {};

      // 일일/주간 AI 코멘트 API 병렬 호출 (월간 제외)
      const [
        dailyExerciseComment,
        weeklyExerciseComment,
        dailyNutritionComment,
        weeklyNutritionComment,
      ] = await Promise.all([
        homeAPI.getDailyExerciseComment(),
        homeAPI.getWeeklyExerciseComment(),
        homeAPI.getDailyNutritionComment(),
        homeAPI.getWeeklyNutritionComment(),
      ]);

      // 현재 코멘트들
      const currentComments: Record<string, string> = {
        dailyExercise: dailyExerciseComment,
        weeklyExercise: weeklyExerciseComment,
        dailyNutrition: dailyNutritionComment,
        weeklyNutrition: weeklyNutritionComment,
      };

      console.log('[HOME] AI 코멘트 수신 완료:', currentComments);

      // 이전 코멘트가 있는지 확인 (첫 번째 진입인지 확인)
      const isFirstVisit = Object.keys(previousComments).length === 0;
      console.log(`[HOME] 이전 코멘트 존재 여부: ${isFirstVisit ? '없음 (첫 방문)' : '있음 (이전 방문과 비교)'}`);

      // 변경된 코멘트만 필터링
      const changedComments: string[] = [];
      // 모든 유효한 코멘트 (빈 문자열이 아닌 것) - 4개 모두
      const allValidComments: string[] = [];
      
      Object.keys(currentComments).forEach((key) => {
        const current = currentComments[key]?.trim() || '';
        const previous = previousComments[key]?.trim() || '';
        
        // 유효한 코멘트면 전체 목록에 추가 (4개 모두)
        if (current) {
          allValidComments.push(current);
        }
        
        // 첫 번째 진입이 아니고, 값이 있고 이전과 다른 경우만 변경 목록에 추가
        if (!isFirstVisit && current && current !== previous) {
          changedComments.push(current);
          console.log(`[HOME] 변경된 코멘트 발견 (${key}):`, current);
        }
      });

      // 선택 로직:
      // 1. 첫 번째 진입: 4개 중 랜덤
      // 2. 두 번째 이후 진입: 변경된 코멘트가 있으면 변경된 것들 중 랜덤, 없으면 4개 중 랜덤
      const commentsToChooseFrom = changedComments.length > 0 ? changedComments : allValidComments;
      
      if (commentsToChooseFrom.length > 0) {
        const randomIndex = Math.floor(Math.random() * commentsToChooseFrom.length);
        const selectedComment = commentsToChooseFrom[randomIndex];
        setAiComment(selectedComment);
        
        if (isFirstVisit) {
          console.log('[HOME] 첫 방문 - 4개 중 랜덤 선택:', selectedComment);
        } else if (changedComments.length > 0) {
          console.log('[HOME] 이전과 비교하여 변경된 코멘트 중 랜덤 선택:', selectedComment, `(변경된 코멘트: ${changedComments.length}개)`);
        } else {
          console.log('[HOME] 변경된 코멘트 없음 - 4개 중 랜덤 선택:', selectedComment);
        }
      } else {
        console.log('[HOME] 표시할 AI 코멘트 없음');
        setAiComment(null);
      }

      // 현재 코멘트를 이전 값으로 저장
      await AsyncStorage.setItem(previousCommentsKey, JSON.stringify(currentComments));
      console.log('[HOME] AI 코멘트 저장 완료');
    } catch (error: any) {
      console.error('[HOME] AI 코멘트 로드 실패:', error);
      setAiComment(null);
    }
  };

  // 랜덤 action_item 선택 함수
  const selectRandomActionItem = (report: WeeklyCoachReport | null) => {
    if (report && report.action_items && report.action_items.length > 0) {
      const randomIndex = Math.floor(Math.random() * report.action_items.length);
      setRandomActionItem(report.action_items[randomIndex]);
    } else {
      setRandomActionItem(null);
    }
  };

  // 추천 운동 요약 로드
  const loadTempExerciseSummary = async () => {
    try {
      const dateStr = formatDateToString(selectedDate);
      console.log('[HOME] 추천 운동 요약 조회 시작:', dateStr);
      
      const summary = await recommendedExerciseAPI.getTempSummary(dateStr);
      
      if (summary) {
        setTempExerciseSummary(summary);
        console.log('[HOME] 추천 운동 요약 조회 성공:', summary);
      } else {
        setTempExerciseSummary(null);
        console.log('[HOME] 추천 운동 요약 없음');
      }
    } catch (error: any) {
      console.error('[HOME] 추천 운동 요약 조회 실패:', error);
      setTempExerciseSummary(null);
    }
  };

  // 시간대별 식단 추천 로드
  const loadMealRecommendation = async () => {
    try {
      // 현재 시간 확인 (한국 시간대)
      const now = new Date();
      const koreaTime = new Date(now.toLocaleString("en-US", { timeZone: "Asia/Seoul" }));
      const hours = koreaTime.getHours();
      const minutes = koreaTime.getMinutes();
      const currentTime = hours * 60 + minutes; // 분 단위로 변환

      console.log('[HOME] 현재 시간:', hours + ':' + String(minutes).padStart(2, '0'), '분 단위:', currentTime);

      // 시간대별 끼니 타입 결정
      let targetMealType: "BREAKFAST" | "LUNCH" | "DINNER" | null = null;
      let mealTypeName = "";

      // 00:00 - 4:00: 아침
      if (currentTime >= 0 && currentTime < 4 * 60) {
        targetMealType = "BREAKFAST";
        mealTypeName = "아침";
      }
      // 4:00 - 18:00: 점심
      else if (currentTime >= 4 * 60 && currentTime < 18 * 60) {
        targetMealType = "LUNCH";
        mealTypeName = "점심";
      }
      // 18:00 - 24:00: 저녁
      else if (currentTime >= 18 * 60 && currentTime < 24 * 60) {
        targetMealType = "DINNER";
        mealTypeName = "저녁";
      }
      // 00:00 - 4:00 범위가 아니면 아침 (새벽 시간대)
      else {
        targetMealType = "BREAKFAST";
        mealTypeName = "아침";
      }

      const today = new Date();
      const dateStr = formatDateToString(today);
      console.log('[HOME] 시간대별 식단 추천 조회 시작:', dateStr, targetMealType, mealTypeName, '현재 시간:', hours + ':' + String(minutes).padStart(2, '0'));

      // 오늘 기록된 식단 확인
      let recordedMealTypes = new Set<string>();
      try {
        const dailyMeals = await mealAPI.getDailyMeals(dateStr).catch(() => null);
        
        if (dailyMeals && dailyMeals.meals) {
          dailyMeals.meals.forEach((meal: any) => {
            // mealType이 있으면 직접 사용
            if (meal.mealType === "BREAKFAST" || meal.mealType === "LUNCH" || meal.mealType === "DINNER") {
              recordedMealTypes.add(meal.mealType);
            } else {
              // meal_name에서 끼니 타입 추출
              const mealName = meal.meal_name || "";
              if (mealName.includes("아침") || mealName.includes("BREAKFAST")) {
                recordedMealTypes.add("BREAKFAST");
              } else if (mealName.includes("점심") || mealName.includes("LUNCH")) {
                recordedMealTypes.add("LUNCH");
              } else if (mealName.includes("저녁") || mealName.includes("DINNER")) {
                recordedMealTypes.add("DINNER");
              }
            }
          });
        }
      } catch (error) {
        console.warn('[HOME] 오늘 기록된 식단 확인 실패:', error);
      }

      // 상태 업데이트
      setTodayRecordedMeals(recordedMealTypes);

      // 해당 끼니가 이미 기록되어 있으면 위젯 숨김
      if (recordedMealTypes.has(targetMealType)) {
        console.log('[HOME] 이미 기록된 끼니:', targetMealType);
        setMealRecommendation(null);
        return;
      }

      // 저장된 추천 식단 목록 가져오기
      const savedPlans = await recommendedMealAPI.getSavedMealPlans();
      
      if (!savedPlans || savedPlans.length === 0) {
        console.log('[HOME] 저장된 추천 식단 없음');
        setMealRecommendation(null);
        return;
      }

      // 모든 플랜에서 오늘 날짜의 해당 끼니 찾기
      let foundMeal: any = null;

      for (const plan of savedPlans) {
        const details = await recommendedMealAPI.getSavedMealPlansByBundle(
          plan.bundleId
        );

        // 오늘 날짜의 해당 끼니 찾기
        const targetMeal = details.find(
          (meal: any) =>
            meal.targetDate === dateStr && meal.mealType === targetMealType
        );

        if (targetMeal) {
          foundMeal = targetMeal;
          break;
        }
      }

      if (foundMeal && foundMeal.foods && foundMeal.foods.length > 0) {
        setMealRecommendation({
          mealType: targetMealType,
          mealTypeName,
          foods: foundMeal.foods.map((food: any) => ({
            id: food.id,
            foodName: food.foodName,
            servingSize: food.servingSize,
          })),
          totalCalories: foundMeal.totalCalories || 0,
        });
        console.log('[HOME] 시간대별 식단 추천 조회 성공:', targetMealType, mealTypeName, foundMeal.foods.length, '개 음식');
      } else {
        setMealRecommendation(null);
        console.log('[HOME] 오늘 날짜의', mealTypeName, '추천 식단 없음');
      }
    } catch (error: any) {
      console.error('[HOME] 시간대별 식단 추천 조회 실패:', error);
      setMealRecommendation(null);
    }
  };

  // 위젯 순서 불러오기
  const loadWidgetOrder = async () => {
    try {
      const savedOrder = await AsyncStorage.getItem('homeWidgetOrder');
      if (savedOrder) {
        const parsed = JSON.parse(savedOrder);
        setWidgetOrder(parsed);
        console.log('[HOME] 위젯 순서 불러오기 성공:', parsed);
      }
    } catch (error) {
      console.error('[HOME] 위젯 순서 불러오기 실패:', error);
    }
  };

  //식단 추천 네비게이션 핸들러 (멤버십 분기 처리)
  const handleMealRecommendNavigation = async () => {
    try {
      const profile = await authAPI.getProfile();

      // PREMIUM이면 무제한 사용 가능 (기존 추천 화면)
      if (profile.membershipType === "PREMIUM") {
        navigation.navigate(ROUTES.MEAL_RECOMMEND);
        return;
      }

      // FREE인 경우 (임시 추천 화면)
      navigation.navigate(ROUTES.TEMP_MEAL_RECOMMEND);
    } catch (error) {
      console.error("❌ 식단 추천 네비게이션 실패:", error);
      // 에러 발생 시 기본 동작 (임시 화면으로 이동)
      navigation.navigate(ROUTES.TEMP_MEAL_RECOMMEND);
    }
  };

  // 운동 추천 네비게이션 핸들러 (멤버십 분기 처리)
  const handleRoutineRecommendNavigation = async () => {
    try {
      // 최신 프로필 정보 확인 (또는 state인 membershipType 사용)
      const profile = await authAPI.getProfile();

      // PREMIUM이면 정식 추천 화면 (RoutineRecommendNewScreen 등)
      if (profile.membershipType === "PREMIUM") {
        navigation.navigate(ROUTES.ROUTINE_RECOMMEND_NEW); // 기존: "RoutineRecommendNew"
        return;
      }

      // FREE인 경우 임시 추천 화면 (TempRoutineRecommendScreen)
      navigation.navigate("TempRoutineRecommendScreen");
    } catch (error) {
      console.error("❌ 운동 추천 네비게이션 실패:", error);
      // 에러 시 기본 동작 (임시 화면 또는 알림)
      navigation.navigate("TempRoutineRecommendScreen");
    }
  };

  // 홈에서 운동 시작하기 핸들러 (운동 기록하기의 시작 버튼과 동일한 동작)
  const handleStartWorkoutFromHome = () => {
    // Stats 화면으로 이동하면서 autoStart 파라미터 전달
    navigation.navigate(ROUTES.STATS, {
      screen: "Exercise",
      params: {
        autoStart: true, // 자동 시작 플래그
      },
    });
  };

  // 화면 포커스 시 데이터 로드
  useEffect(() => {
    const unsubscribe = navigation.addListener("focus", () => {
      console.log("[HOME] 화면 포커스, 데이터 새로고침 시작 (이번 주 칼로리 포함)");

      if (isLoadingRef.current) {
        console.log("[HOME] 이미 로딩 중이므로 스킵");
        return;
      }

      isLoadingRef.current = true;
      Promise.all([
        loadWeeklyProgress(), // 이번 주 칼로리 데이터 포함
        loadHomeData(),
        loadTodayWorkoutTime(),
        loadInBodyData(),
        loadProfileInfo(),
        loadAIComments(), // AI 코멘트 로드
        loadTempExerciseSummary(), // 추천 운동 요약 로드
        loadMealRecommendation(), // 시간대별 식단 추천 로드
      ]).finally(() => {
        isLoadingRef.current = false;
        console.log("[HOME] 화면 포커스, 데이터 새로고침 완료 (이번 주 칼로리 포함)");
      });

      // 코치 리포트가 있으면 새로운 랜덤 선택 (API 호출 없이)
      if (coachReport) {
        selectRandomActionItem(coachReport);
      } else {
        // 코치 리포트가 없으면 로드
        loadCoachReport();
      }
    });

    // 초기 로드 (로그인 완료 후)
    console.log("[HOME] 초기 로드 시작 (로그인 완료 후)");
    isLoadingRef.current = true;
    Promise.all([
      loadWeeklyProgress(),
      loadHomeData(),
      loadTodayWorkoutTime(),
      loadInBodyData(),
      loadProfileInfo(),
      loadCoachReport(),
      loadAIComments(), // AI 코멘트 로드
      loadTempExerciseSummary(), // 추천 운동 요약 로드
      loadMealRecommendation(), // 시간대별 식단 추천 로드
      loadWidgetOrder(), // 위젯 순서 불러오기
    ]).finally(() => {
      isLoadingRef.current = false;
      console.log("[HOME] 초기 로드 완료");
    });

    return unsubscribe;
  }, [navigation]);

  // 운동 삭제 이벤트 리스너
  useEffect(() => {
    const unsubscribe = eventBus.on("workoutSessionDeleted", () => {
      console.log("[HOME] 운동 삭제 이벤트 수신, 운동 시간/개수 새로고침");
      // 삭제 후 운동 시간과 개수 다시 조회
      loadTodayWorkoutTime();
    });

    return () => {
      unsubscribe?.();
    };
  }, []);

  // 인바디 업데이트 이벤트 리스너
  useEffect(() => {
    const unsubscribe = eventBus.on("inbodyUpdated", () => {
      console.log("[HOME] 인바디 업데이트 이벤트 수신, 인바디 데이터 새로고침");
      loadInBodyData();
    });

    return () => {
      unsubscribe?.();
    };
  }, []);

  // 위젯 편집 화면에서 돌아올 때 위젯 순서 다시 불러오기
  useEffect(() => {
    const unsubscribe = navigation.addListener("focus", () => {
      loadWidgetOrder();
    });
    return unsubscribe;
  }, [navigation]);

  // 위젯 렌더링 함수들
  const renderRecommendationCard = () => (
    <View key="recommendationCard" style={styles.enhancedRecommendationWrapper}>
      <View style={styles.enhancedRecommendationCardContainer}>
        <View style={styles.enhancedRecommendationCardBorder} />
        <View style={styles.enhancedRecommendationCard}>
          <View style={styles.enhancedRecommendationContent}>
            <Text style={styles.enhancedRecommendationTitle}>
              {homeData?.userSummary?.name} 회원님을 위한{"\n"}
              <Text style={styles.enhancedRecommendationTitleGreen}>
                맞춤형 식단과 운동
              </Text>
              을 받아보세요!
            </Text>

            <View style={styles.enhancedRecommendationButtons}>
              <TouchableOpacity
                style={styles.enhancedRecButtonWrapper}
                onPress={handleMealRecommendNavigation}
              >
                <LinearGradient
                  colors={["#e3ff7c", "#e8ff93"]}
                  style={styles.enhancedRecButton}
                >
                  <Ionicons name="restaurant" size={14} color="#000" />
                  <Text style={styles.enhancedRecButtonText}>
                    추천 식단 받기
                  </Text>
                  <Ionicons name="chevron-forward" size={16} color="#000" />
                </LinearGradient>
              </TouchableOpacity>

              <TouchableOpacity
                style={styles.enhancedRecButtonWrapper}
                onPress={handleRoutineRecommendNavigation}
              >
                <LinearGradient
                  colors={["#e3ff7c", "#e8ff93"]}
                  style={styles.enhancedRecButton}
                >
                  <Ionicons name="barbell" size={14} color="#000" />
                  <Text style={styles.enhancedRecButtonText}>
                    추천 운동 받기
                  </Text>
                  <Ionicons name="chevron-forward" size={16} color="#000" />
                </LinearGradient>
              </TouchableOpacity>
            </View>
          </View>
        </View>
      </View>
    </View>
  );

  const renderNotificationCard = () => {
    if (!aiComment && !randomActionItem) return null;
    return (
      <View key="notificationCard" style={styles.notificationCardContainer}>
        <View style={styles.notificationCardBorder} />
        <View style={styles.notificationCard}>
          <Ionicons name="sparkles" size={25} color="#e3ff7c" />
          <Text style={styles.notificationText}>
            {aiComment || randomActionItem}
          </Text>
        </View>
      </View>
    );
  };

  const renderWeekCalendar = () => (
    <View key="weekCalendar" style={styles.exerciseProgressSection}>
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

                return Array.from({ length: 7 }).map((_, i) => {
                  const d = new Date(
                    startThis.getFullYear(),
                    startThis.getMonth(),
                    startThis.getDate() + i
                  );

                  const isToday = d.toDateString() === today.toDateString();
                  const isSelected =
                    selectedDate &&
                    d.toDateString() === selectedDate.toDateString();

                  return (
                    <View
                      key={startThis.toISOString() + i}
                      style={styles.calendarItem}
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
                          {d.getDate()}
                        </Text>
                      </View>

                      {(() => {
                        const dayProgress = getDayProgress(d);
                        const calories = dayProgress?.totalCalorie ?? 0;
                        const dateStr = formatDateToString(d);
                        // 해당 날짜의 운동 시간(초) 가져오기
                        const totalSeconds = dailyWorkoutSeconds[dateStr] ?? 0;
                        
                        // 운동 시간 포맷: 초만 있으면 "38s", 분이면 "39m", 60분 이상이면 "1h 39m"
                        const formatWorkoutTime = (seconds: number): string => {
                          if (seconds === 0) return '';
                          
                          const hours = Math.floor(seconds / 3600);
                          const minutes = Math.floor((seconds % 3600) / 60);
                          const secs = seconds % 60;
                          
                          if (hours > 0) {
                            // 60분 이상: "1h 39m"
                            return `${hours}h ${minutes}m`;
                          } else if (minutes > 0) {
                            // 분만: "39m"
                            return `${minutes}m`;
                          } else {
                            // 초만: "38s"
                            return `${secs}s`;
                          }
                        };

                        return (
                          <>
                            <Text style={styles.calendarCalories}>
                              {calories > 0 ? `${Math.round(calories)}k` : ''}
                            </Text>
                            <Text style={styles.calendarWorkoutTime}>
                              {formatWorkoutTime(totalSeconds)}
                            </Text>
                          </>
                        );
                      })()}
                    </View>
                  );
                });
              })()}
            </View>
          </View>
        </View>
  );

  const renderCalorieCard = () => (
    <View key="calorieCard" style={styles.calorieSection}>
          <View style={styles.calorieStatsContent}>
            <View style={[styles.calorieStatColumn, styles.calorieStatColumnWide]}>
              <Text style={styles.calorieStatLabel}>칼로리</Text>
                <View style={styles.calorieStatValueRow}>
                  <Text style={styles.calorieStatValue}>
                    {Math.round(homeData?.todayMeal?.totalCalories || 0)}
                  </Text>
                  <Text style={styles.calorieStatDivider}>/</Text>
                  <Text style={styles.calorieStatGoal}>
                    {Math.round(homeData?.todayMeal?.targetCalories || 0)}
                  </Text>
                </View>
              <Text style={styles.calorieStatUnit}>kcal</Text>
            </View>
            <View style={styles.calorieStatDividerLine} />
            <View style={[styles.calorieStatColumn, styles.calorieStatColumnNarrow]}>
              <Text style={styles.calorieStatLabel}>탄수화물</Text>
              <Text style={styles.calorieStatValueSmall}>
                {Math.round(homeData?.todayMeal?.totalCarbs || 0)}
              </Text>
              <Text style={styles.calorieStatUnit}>g</Text>
            </View>
            <View style={styles.calorieStatDividerLine} />
            <View style={[styles.calorieStatColumn, styles.calorieStatColumnNarrow]}>
              <Text style={styles.calorieStatLabel}>단백질</Text>
              <Text style={styles.calorieStatValueSmall}>
                {Math.round(homeData?.todayMeal?.totalProtein || 0)}
              </Text>
              <Text style={styles.calorieStatUnit}>g</Text>
            </View>
            <View style={styles.calorieStatDividerLine} />
            <View style={[styles.calorieStatColumn, styles.calorieStatColumnNarrow]}>
              <Text style={styles.calorieStatLabel}>지방</Text>
              <Text style={styles.calorieStatValueSmall}>
                {Math.round(homeData?.todayMeal?.totalFat || 0)}
              </Text>
              <Text style={styles.calorieStatUnit}>g</Text>
            </View>
          </View>
        </View>
  );

  const renderExerciseRoutineCard = () => {
    if (!tempExerciseSummary || 
        !tempExerciseSummary.focus || 
        tempExerciseSummary.focus === 'undefined' ||
        todayWorkoutSeconds !== 0) {
      return null;
    }

    const getFocusKorean = (focus: string): string => {
      const focusMap: Record<string, string> = {
        'Upper': '상체',
        'Lower': '하체',
        'Full': '전신',
        'Core': '코어',
        'Cardio': '유산소',
      };
      return focusMap[focus] || focus;
    };

    const focusKorean = getFocusKorean(tempExerciseSummary.focus);
    const displayTitle = `오늘의 운동 : ${focusKorean}`;

    return (
      <View key="exerciseRoutineCard" style={styles.routineCard}>
        <Text style={styles.routineTitle}>{displayTitle}</Text>
        <View style={styles.routineStats}>
          <View style={styles.routineStatItem}>
            <Ionicons name="barbell" size={40} color="#ffffff" />
            <Text style={styles.routineStatText}>{Math.round(tempExerciseSummary.exerciseCount)}가지 운동</Text>
          </View>
          <View style={styles.routineStatItem}>
            <Ionicons name="stopwatch-outline" size={40} color="#ffffff" />
            <Text style={styles.routineStatText}>{Math.round(tempExerciseSummary.durationMin)}분</Text>
          </View>
          <View style={styles.routineStatItem}>
            <MaterialIcons
              name="local-fire-department"
              size={40}
              color="#ffffff"
            />
            <Text style={styles.routineStatText}>{Math.round(tempExerciseSummary.kcal)} kcal</Text>
          </View>
        </View>
        <TouchableOpacity 
          style={styles.routineButton}
          onPress={handleStartWorkoutFromHome}
        >
          <Text style={styles.routineButtonText}>오늘 운동 시작하기</Text>
        </TouchableOpacity>
      </View>
    );
  };

  const renderExerciseStatsCard = () => {
    if (todayWorkoutSeconds === 0) return null;
    return (
      <View key="exerciseStatsCard" style={styles.exerciseStatsCard}>
        <View style={styles.exerciseStatsContent}>
          <View style={styles.exerciseStatColumn}>
            <Text style={styles.exerciseStatLabel}>운동 시간</Text>
            <Text style={styles.exerciseStatValue}>
              {formatWorkoutTime(todayWorkoutSeconds)}
            </Text>
          </View>
          <View style={styles.exerciseStatDivider} />
          <View style={styles.exerciseStatColumn}>
            <Text style={styles.exerciseStatLabel}>소모 칼로리</Text>
            <View style={styles.exerciseStatValueRow}>
              <Text style={styles.exerciseStatValue}>
                {todayCalories.toLocaleString()}
              </Text>
              <Text style={styles.exerciseStatUnit}>kcal</Text>
            </View>
          </View>
          <View style={styles.exerciseStatDivider} />
          <View style={styles.exerciseStatColumn}>
            <Text style={styles.exerciseStatLabel}>완료 운동</Text>
            <View style={styles.exerciseStatValueRow}>
              <Text style={styles.exerciseStatValue}>
                {todayExerciseCount}
              </Text>
              <Text style={styles.exerciseStatUnit}>개</Text>
            </View>
          </View>
        </View>
      </View>
    );
  };

  const renderBodyStatsCard = () => {
    const hasWeight = 
      inBodyData?.weight ||
      inBodyData?.bodyComposition?.weight ||
      inBodyData?.muscleFatAnalysis?.weight;
    const hasSkeletalMuscleMass = 
      inBodyData?.skeletalMuscleMass ||
      inBodyData?.muscleFatAnalysis?.skeletalMuscleMass;
    const hasBodyFatMass = 
      inBodyData?.bodyFatMass ||
      inBodyData?.muscleFatAnalysis?.bodyFatMass ||
      inBodyData?.bodyComposition?.bodyFatMass;
    
    const hasInBodyData = hasWeight || hasSkeletalMuscleMass || hasBodyFatMass;
    
    if (!hasInBodyData) {
      return null;
    }

    return (
      <View key="bodyStatsCard" style={styles.bodyStatsContainer}>
        <View style={[styles.bodyStatCard]}>
          <Text style={styles.bodyStatLabel}>체중</Text>
          <Text style={styles.bodyStatValue}>
            {inBodyData?.weight
              ? `${inBodyData.weight.toFixed(1)}kg`
              : inBodyData?.bodyComposition?.weight
              ? `${parseFloat(
                  String(inBodyData.bodyComposition.weight).replace(
                    /[^\d.]/g,
                    ""
                  )
                ).toFixed(1)}kg`
              : inBodyData?.muscleFatAnalysis?.weight
              ? `${inBodyData.muscleFatAnalysis.weight.toFixed(1)}kg`
              : "-"}
          </Text>
        </View>

        <View style={[styles.bodyStatCard]}>
          <Text style={styles.bodyStatLabel}>골격근량</Text>
          <Text style={styles.bodyStatValue}>
            {inBodyData?.skeletalMuscleMass
              ? `${inBodyData.skeletalMuscleMass.toFixed(1)}kg`
              : inBodyData?.muscleFatAnalysis?.skeletalMuscleMass
              ? `${inBodyData.muscleFatAnalysis.skeletalMuscleMass.toFixed(
                  1
                )}kg`
              : "-"}
          </Text>
        </View>

        <View style={[styles.bodyStatCard, { marginRight: 0 }]}>
          <Text style={styles.bodyStatLabel}>체지방량</Text>
          <Text style={styles.bodyStatValue}>
            {inBodyData?.bodyFatMass
              ? `${inBodyData.bodyFatMass.toFixed(1)}kg`
              : inBodyData?.muscleFatAnalysis?.bodyFatMass
              ? `${inBodyData.muscleFatAnalysis.bodyFatMass.toFixed(1)}kg`
              : inBodyData?.bodyComposition?.bodyFatMass
              ? `${parseFloat(
                  String(inBodyData.bodyComposition.bodyFatMass).replace(
                    /[^\d.]/g,
                    ""
                  )
                ).toFixed(1)}kg`
              : "-"}
          </Text>
        </View>
      </View>
    );
  };

  const renderMealRecommendationCard = () => {
    if (!mealRecommendation || 
        mealRecommendation.foods.length === 0 || 
        todayRecordedMeals.has(mealRecommendation.mealType)) {
      return null;
    }

    return (
      <TouchableOpacity
        key="mealRecommendationCard"
        style={styles.dietRecommendationSection}
        onPress={() => {
          navigation.navigate("Stats", { 
            activeTab: 1,
            dietActiveTab: "recommendations"
          });
        }}
        activeOpacity={0.7}
      >
        <View style={styles.recommendationContent}>
          <Text style={styles.recommendationSubtitle}>
            {mealRecommendation.mealTypeName} 식단으로
          </Text>
          <View style={styles.foodRecommendations}>
            {mealRecommendation.foods.slice(0, 3).map((food, index) => (
              <View key={food.id || index} style={styles.foodItem}>
                <Text style={styles.foodItemText}>
                  {food.foodName} {food.servingSize > 0 ? `${food.servingSize}g` : ''}
                </Text>
              </View>
            ))}
          </View>
          <View style={styles.recommendationQuestionRow}>
            <Text style={styles.recommendationQuestion}>어떤가요?</Text>
            <View style={styles.dietRecordLink}>
              <Text style={styles.dietRecordLinkText}>식단 기록하기</Text>
              <Ionicons name="chevron-forward" size={16} color="#999999" />
            </View>
          </View>
        </View>
      </TouchableOpacity>
    );
  };

  // 위젯 렌더링 맵
  const widgetRenderMap: Record<string, () => React.ReactNode> = {
    recommendationCard: renderRecommendationCard,
    notificationCard: renderNotificationCard,
    weekCalendar: renderWeekCalendar,
    exerciseRoutineCard: renderExerciseRoutineCard,
    exerciseStatsCard: renderExerciseStatsCard,
    bodyStatsCard: renderBodyStatsCard,
    mealRecommendationCard: renderMealRecommendationCard,
    calorieCard: renderCalorieCard,
  };

  return (
    <SafeAreaView style={styles.container} edges={["top"]}>
      <View style={styles.header}>
        <Text style={styles.logoText}>INTELFIT</Text>
      </View>
      <View style={styles.divider} />

      <ScrollView style={styles.content}>
        {/* 위젯들을 순서대로 렌더링 */}
        {widgetOrder.map((widgetId) => {
          const renderWidget = widgetRenderMap[widgetId];
          return renderWidget ? renderWidget() : null;
        })}

        {/* 홈 수정하기 버튼 */}
        <TouchableOpacity
          style={styles.editHomeButton}
          onPress={() => navigation.navigate("HomeWidgetEdit")}
          activeOpacity={0.7}
        >
          <Ionicons name="settings-outline" size={16} color="#999999" />
          <Text style={styles.editHomeButtonText}>위젯 정렬</Text>
        </TouchableOpacity>
      </ScrollView>
    </SafeAreaView>
  );
};

const styles = StyleSheet.create({
  container: {
    flex: 1,
    backgroundColor: colors.background,
  },
  header: {
    backgroundColor: colors.background,
    paddingVertical: 12,
    paddingHorizontal: 20,
    borderBottomWidth: 1,
    borderBottomColor: colors.border,
    alignItems: "center",
    justifyContent: "center",
  },
  headerTitle: {
    fontSize: 20,
    fontWeight: "bold",
    color: colors.text,
    textAlign: "center",
  },
  logoText: {
    fontSize: 24,
    fontWeight: "800",
    fontStyle: "italic",
    color: "#e3ff7c",
    textAlign: "center",
    letterSpacing: 0,
  },

  divider: {
    height: 1,
    backgroundColor: colors.border,
  },
  content: {
    flex: 1,
    paddingTop: 20,
    paddingHorizontal: 20,
    paddingBottom: 20,
  },
  exerciseProgressSection: {
    backgroundColor: "#393a38",
    borderRadius: 20,
    paddingVertical: 12,
    paddingHorizontal: 16,
    marginBottom: 12,
    borderWidth: 1,
    borderColor: "#2a2a2a",
  },
  weekCalendar: {
    marginTop: 1,
    marginBottom: 6,
  },
  calendarGrid: {
    flexDirection: "row",
    justifyContent: "space-between",
    gap: 0,
    height: 55,
    marginVertical: 4,
  },
  calendarItem: {
    flex: 1,
    alignItems: "center",
    justifyContent: "center",
    gap: 4,
    minHeight: 55,
  },
  calendarNumber: {
    minHeight: 30,
    minWidth: 30,
    justifyContent: "center",
    alignItems: "center",
  },
  calendarNumberText: {
    fontSize: 16,
    fontWeight: "700",
    color: "#e3ff7c",
    lineHeight: 19,
    textAlign: "center",
  },
  calendarNumberToday: {
    width: 30,
    height: 30,
    borderRadius: 15,
    backgroundColor: "#ffffff",
  },
  calendarNumberTodayText: {
    color: "#000000",
    fontSize: 16,
    fontWeight: "700",
    lineHeight: 19,
  },
  calendarCalories: {
    fontSize: 12,
    fontWeight: "500",
    color: "#ffffff",
    textAlign: "center",
    height: 15,
    lineHeight: 14.5,
  },
  calendarPercentage: {
    fontSize: 12,
    fontWeight: "500",
    color: "#ffffff",
    textAlign: "center",
    height: 15,
    lineHeight: 14.5,
  },
  calendarWorkoutTime: {
    fontSize: 12,
    fontWeight: "500",
    color: "#ffffff",
    textAlign: "center",
    height: 15,
    lineHeight: 14.5,
  },
  calorieSection: {
    backgroundColor: "#393a38",
    borderRadius: 20,
    paddingVertical: 12,
    paddingHorizontal: 20,
    marginBottom: 12,
    borderWidth: 1,
    borderColor: "#2a2a2a",
  },
  calorieStatsContent: {
    flexDirection: "row",
    justifyContent: "space-between",
    alignItems: "center",
    height: 50,
  },
  calorieStatColumn: {
    alignItems: "center",
    minWidth: 0,
  },
  calorieStatColumnWide: {
    flex: 2,
    minWidth: 0,
  },
  calorieStatColumnNarrow: {
    flex: 1,
    minWidth: 0,
  },
  calorieStatLabel: {
    fontSize: 12,
    fontWeight: "500",
    color: "#cccccc",
    marginBottom: 6,
    lineHeight: 14.5,
  },
  calorieStatValue: {
    fontSize: 16,
    fontWeight: "700",
    color: "#ffffff",
    lineHeight: 19,
  },
  calorieStatValueSmall: {
    fontSize: 14,
    fontWeight: "700",
    color: "#ffffff",
    lineHeight: 17,
  },
  calorieStatValueRow: {
    flexDirection: "row",
    alignItems: "baseline",
    gap: 4,
    marginBottom: 2,
  },
  calorieStatDivider: {
    fontSize: 16,
    fontWeight: "400",
    color: "#ffffff",
  },
  calorieStatGoal: {
    fontSize: 16,
    fontWeight: "600",
    color: "#ffffff",
  },
  calorieStatUnit: {
    fontSize: 12,
    fontWeight: "500",
    color: "#cccccc",
    lineHeight: 14.5,
  },
  calorieStatDividerLine: {
    width: 1,
    height: 40,
    backgroundColor: "#2a2a2a",
    marginHorizontal: 6,
    flexShrink: 0,
  },
  recommendationCard: {
    backgroundColor: "#393a38",
    borderRadius: 20,
    padding: 20,
    marginBottom: 20,
  },
  recommendationCardTitle: {
    fontSize: 16,
    fontWeight: "700",
    color: "#ffffff",
    marginBottom: 20,
    lineHeight: 20,
  },
  recommendationButtons: {
    gap: 10,
  },
  recommendationButton: {
    backgroundColor: "#e3ff7c",
    borderRadius: 10,
    paddingVertical: 10,
    paddingHorizontal: 20,
    alignItems: "center",
    justifyContent: "center",
    height: 40,
  },
  recommendationButtonText: {
    fontSize: 14,
    fontWeight: "700",
    color: "#000000",
  },
  dietRecommendationSection: {
    backgroundColor: "#393a38",
    borderRadius: 20,
    padding: 16,
    marginBottom: 12,
    borderWidth: 1,
    borderColor: "#2a2a2a",
  },
  recommendationContent: {
    width: "100%",
  },
  recommendationTitle: {
    fontSize: 16,
    fontWeight: "700",
    color: "#e3ff7c",
    marginBottom: 5,
  },
  recommendationSubtitle: {
    fontSize: 18,
    fontWeight: "700",
    color: "#ffffff",
    marginBottom: 12,
  },
  foodRecommendations: {
    flexDirection: "row",
    flexWrap: "wrap",
    gap: 6,
    marginBottom: 12,
  },
  foodItem: {
    backgroundColor: "#e3ff7c",
    paddingHorizontal: 12,
    paddingVertical: 8,
    borderRadius: 8,
  },
  foodItemText: {
    color: "#000000",
    fontSize: 14,
    fontWeight: "700",
  },
  recommendationQuestionRow: {
    flexDirection: "row" as const,
    alignItems: "center" as const,
    justifyContent: "space-between" as const,
    width: "100%",
  },
  recommendationQuestion: {
    fontSize: 18,
    fontWeight: "700",
    color: "#ffffff",
  },
  dietRecordLink: {
    flexDirection: "row" as const,
    alignItems: "center" as const,
    gap: 4,
  },
  dietRecordLinkText: {
    fontSize: 14,
    fontWeight: "500" as const,
    color: "#999999",
  },
  routineCard: {
    backgroundColor: "#393a38",
    borderRadius: 20,
    padding: 16,
    marginBottom: 12,
    borderWidth: 1,
    borderColor: "#2a2a2a",
  },
  routineTitle: {
    fontSize: 16,
    fontWeight: "700",
    color: "#e3ff7c",
    marginBottom: 14,
    lineHeight: 19,
  },
  routineStats: {
    flexDirection: "row",
    justifyContent: "space-between",
    marginBottom: 14,
    paddingHorizontal: 4,
  },
  routineStatItem: {
    alignItems: "center",
    width: 74,
    gap: 8,
  },
  routineStatText: {
    fontSize: 12,
    fontWeight: "500",
    color: "#cccccc",
    textAlign: "center",
    lineHeight: 14.5,
  },
  routineButton: {
    backgroundColor: "#e3ff7c",
    borderRadius: 10,
    paddingVertical: 10,
    paddingHorizontal: 20,
    alignItems: "center",
    justifyContent: "center",
    height: 40,
  },
  routineButtonText: {
    fontSize: 14,
    fontWeight: "700",
    color: "#000000",
    lineHeight: 16,
  },
  exerciseStatsCard: {
    backgroundColor: "#393a38",
    borderRadius: 20,
    paddingVertical: 12,
    paddingHorizontal: 20,
    marginBottom: 12,
    borderWidth: 1,
    borderColor: "#2a2a2a",
  },
  exerciseStatsContent: {
    flexDirection: "row",
    justifyContent: "space-between",
    alignItems: "center",
    height: 50,
  },
  exerciseStatColumn: {
    flex: 1,
    alignItems: "center",
  },
  exerciseStatLabel: {
    fontSize: 12,
    fontWeight: "500",
    color: "#ffffff",
    marginBottom: 6,
    lineHeight: 14.5,
  },
  exerciseStatValue: {
    fontSize: 16,
    fontWeight: "700",
    color: "#e3ff7c",
    lineHeight: 19,
  },
  exerciseStatValueRow: {
    flexDirection: "row",
    alignItems: "baseline",
    gap: 4,
  },
  exerciseStatUnit: {
    fontSize: 12,
    fontWeight: "500",
    color: "#cccccc",
    lineHeight: 14.5,
  },
  exerciseStatDivider: {
    width: 1,
    height: 40,
    backgroundColor: "#2a2a2a",
    marginHorizontal: 10,
  },
  bodyStatsContainer: {
    flexDirection: "row",
    gap: 8,
    marginBottom: 12,
  },
  bodyStatCard: {
    flex: 1,
    backgroundColor: "#393a38",
    borderRadius: 20,
    padding: 12,
    alignItems: "center",
    justifyContent: "center",
    minHeight: 60,
    borderWidth: 1,
    borderColor: "#2a2a2a",
  },
  bodyStatLabel: {
    fontSize: 12,
    fontWeight: "500",
    color: "#ffffff",
    marginBottom: 6,
    lineHeight: 14.5,
    textAlign: "center",
  },
  bodyStatValue: {
    fontSize: 16,
    fontWeight: "700",
    color: "#ffffff",
    lineHeight: 20,
    textAlign: "center",
  },
  additionalMenuSection: {
    marginBottom: 20,
  },
  menuGrid: {
    flexDirection: "row",
    gap: 8,
  },
  menuItem: {
    flex: 1,
    backgroundColor: colors.cardBackground,
    borderRadius: 20,
    padding: 15,
  },
  weightItem: {
    alignItems: "center",
    justifyContent: "center",
  },
  menuTitle: {
    fontSize: 15,
    fontWeight: "700",
    color: colors.text,
    marginBottom: 5,
    lineHeight: 18,
    textAlign: "center",
  },
  menuValue: {
    fontSize: 15,
    fontWeight: "700",
    color: colors.text,
    lineHeight: 18,
    textAlign: "center",
  },
  nutritionContent: {
    gap: 5,
  },
  nutritionLine: {
    fontSize: 15,
    color: colors.text,
  },
  plusItem: {
    justifyContent: "center",
    alignItems: "center",
  },
  plusButton: {
    width: 36,
    height: 36,
    borderRadius: 18,
    backgroundColor: "#555",
    justifyContent: "center",
    alignItems: "center",
    borderWidth: 1,
    borderColor: "#777",
  },
  plusIcon: {
    fontSize: 18,
    color: colors.text,
    fontWeight: "400",
  },

  greetingSection: {
    marginBottom: 20,
  },
  profileGroup: {
    flexDirection: "row",
    alignItems: "center",
    gap: 15,
  },
  profileImage: {
    width: 50,
    height: 50,
    backgroundColor: "#444",
    borderRadius: 25,
    alignItems: "center",
    justifyContent: "center",
  },
  profilePlaceholder: {
    fontSize: 24,
    lineHeight: 50,
    color: "#999",
  },
  greetingText: {
    fontSize: 16,
    fontWeight: "700",
    color: colors.text,
  },
  messageContainer: {
    marginTop: 12,
    gap: 8,
  },
  messageBubble: {
    backgroundColor: "#555",
    borderRadius: 18,
    paddingVertical: 10,
    paddingHorizontal: 14,
    alignSelf: "flex-start",
  },
  messageText: {
    color: colors.text,
    fontSize: 14,
  },

  enhancedRecommendationWrapper: {
    marginBottom: 12,
  },
  enhancedRecommendationCardContainer: {
    position: "relative",
  },
  enhancedRecommendationCardBorder: {
    position: "absolute",
    top: -2,
    left: -2,
    right: -2,
    bottom: -2,
    borderRadius: 22,
    borderWidth: 1,
    borderColor: "#e3ff7c",
    backgroundColor: "transparent",
    shadowColor: "#e3ff7c",
    shadowOffset: {
      width: 0,
      height: 0,
    },
    shadowOpacity: 1,
    shadowRadius: 15,
    elevation: 15,
    zIndex: 0,
  },
  enhancedRecommendationCard: {
    backgroundColor: colors.background,
    borderRadius: 20,
    borderColor: "#e3ff7c",
    padding: 14,
    zIndex: 1,
    overflow: "hidden",
  },
  enhancedRecommendationContent: {
    gap: 14,
  },
  enhancedRecommendationTitle: {
    fontSize: 16,
    fontWeight: "700",
    color: "#ffffff",
    lineHeight: 24,
  },
  enhancedRecommendationTitleGreen: {
    fontSize: 16,
    fontWeight: "700",
    color: "#e3ff7c",
    lineHeight: 24,
  },
  enhancedRecommendationButtons: {
    flexDirection: "row",
    gap: 10,
  },
  enhancedRecButtonWrapper: {
    borderRadius: 10,
    overflow: "hidden",
    flex: 1,
  },
  enhancedRecButton: {
    flexDirection: "row",
    alignItems: "center",
    justifyContent: "center",
    paddingVertical: 8,
    paddingHorizontal: 12,
    height: 33,
    gap: 6,
  },
  enhancedRecButtonText: {
    fontSize: 12,
    fontWeight: "700",
    color: "#000000",
    lineHeight: 14.5,
  },
  notificationCardContainer: {
    position: "relative",
    marginBottom: 12,
  },
  notificationCardBorder: {
    position: "absolute",
    top: -2,
    left: -2,
    right: -2,
    bottom: -2,
    borderRadius: 22,
    borderWidth: 1,
    borderColor: "#e3ff7c",
    backgroundColor: "transparent",
    shadowColor: "#e3ff7c",
    shadowOffset: {
      width: 0,
      height: 0,
    },
    shadowOpacity: 1,
    shadowRadius: 15,
    elevation: 15,
    zIndex: 0,
  },
  notificationCard: {
    backgroundColor: colors.background,
    borderRadius: 20,
    borderColor: "#e3ff7c",
    padding: 12,
    flexDirection: "row",
    alignItems: "center",
    gap: 12,
    zIndex: 1,
    overflow: "hidden",
  },
  notificationText: {
    flex: 1,
    fontSize: 12,
    fontWeight: "600",
    color: "#ffffff",
    lineHeight: 20,
  },
  recommendedMealWidgetContainer: {
    position: "relative",
    marginBottom: 20,
  },
  recommendedMealWidgetBorder: {
    position: "absolute",
    top: -2,
    left: -2,
    right: -2,
    bottom: -2,
    borderRadius: 22,
    borderWidth: 1,
    borderColor: "#e3ff7c",
    backgroundColor: "transparent",
    shadowColor: "#e3ff7c",
    shadowOffset: { width: 0, height: 0 },
    shadowOpacity: 0.3,
    shadowRadius: 8,
  },
  recommendedMealWidget: {
    backgroundColor: "#393a38",
    borderRadius: 20,
    padding: 16,
    borderWidth: 1,
    borderColor: "#2a2a2a",
  },
  recommendedMealWidgetHeader: {
    flexDirection: "row",
    alignItems: "center",
    gap: 8,
    marginBottom: 12,
  },
  recommendedMealWidgetTitle: {
    fontSize: 16,
    fontWeight: "700",
    color: "#ffffff",
    lineHeight: 20,
  },
  recommendedMealWidgetContent: {
    flexDirection: "row",
    flexWrap: "wrap",
    gap: 8,
    marginBottom: 12,
  },
  recommendedMealFoodItem: {
    backgroundColor: "#2a2a2a",
    borderRadius: 8,
    paddingVertical: 6,
    paddingHorizontal: 10,
    flexDirection: "row",
    alignItems: "center",
    gap: 6,
  },
  recommendedMealFoodName: {
    fontSize: 12,
    fontWeight: "500",
    color: "#ffffff",
    maxWidth: 80,
  },
  recommendedMealFoodServing: {
    fontSize: 11,
    fontWeight: "400",
    color: "#cccccc",
  },
  recommendedMealMoreText: {
    fontSize: 12,
    fontWeight: "500",
    color: "#e3ff7c",
    alignSelf: "center",
  },
  recommendedMealWidgetFooter: {
    flexDirection: "row",
    alignItems: "center",
    justifyContent: "space-between",
    paddingTop: 12,
    borderTopWidth: 1,
    borderTopColor: "#2a2a2a",
  },
  recommendedMealWidgetNutrient: {
    flex: 1,
    alignItems: "center",
  },
  recommendedMealWidgetNutrientLabel: {
    fontSize: 11,
    fontWeight: "500",
    color: "#cccccc",
    marginBottom: 4,
  },
  recommendedMealWidgetNutrientValue: {
    fontSize: 13,
    fontWeight: "700",
    color: "#ffffff",
  },
  recommendedMealWidgetDivider: {
    width: 1,
    height: 30,
    backgroundColor: "#2a2a2a",
  },
  recommendedMealWidgetArrow: {
    position: "absolute" as const,
    right: 16,
    top: 16,
  },
  editHomeButton: {
    flexDirection: "row" as const,
    alignItems: "center" as const,
    justifyContent: "center" as const,
    marginTop: 20,
    marginBottom: 20,
    gap: 6,
  },
  editHomeButtonText: {
    fontSize: 14,
    fontWeight: "500" as const,
    color: "#999999",
  },
});

export default HomeScreen;

