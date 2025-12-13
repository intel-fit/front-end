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
import { homeAPI, authAPI, mealAPI } from "../../services";
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
  const isLoadingRef = useRef(false);

  // 멤버십 정보 state
  const [membershipType, setMembershipType] = useState<string>("FREE");
  const [mealTokens, setMealTokens] = useState<number>(0);

  // 코치 리포트 state
  const [coachReport, setCoachReport] = useState<WeeklyCoachReport | null>(null);
  const [randomActionItem, setRandomActionItem] = useState<string | null>(null);

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
      const data = await homeAPI.getWeeklyProgress();

      if (Array.isArray(data) && data.length > 0) {
        setWeeklyProgress(data);
      } else {
        setWeeklyProgress([]);
      }
    } catch (e: any) {
      console.error("주간 진행률 로드 실패:", e);
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
        homeAPI.getNutritionGoal(dateString).catch((err) => {
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
          // target_calorie 또는 target_calories 필드 확인
          const targetCalories = nutritionGoal.target_calorie || nutritionGoal.target_calories;
          if (targetCalories) {
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
        }
        console.log("[HOME][영양목표] 목표 칼로리 업데이트:", {
          nutritionGoal,
          targetCalories: data.todayMeal?.targetCalories,
          achievementRate: data.todayMeal?.calorieAchievementRate,
        });
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

  // 랜덤 action_item 선택 함수
  const selectRandomActionItem = (report: WeeklyCoachReport | null) => {
    if (report && report.action_items && report.action_items.length > 0) {
      const randomIndex = Math.floor(Math.random() * report.action_items.length);
      setRandomActionItem(report.action_items[randomIndex]);
    } else {
      setRandomActionItem(null);
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

  // 화면 포커스 시 데이터 로드
  useEffect(() => {
    const unsubscribe = navigation.addListener("focus", () => {
      console.log("[HOME] 화면 포커스, 오늘 운동 데이터 새로고침 시작");

      if (isLoadingRef.current) {
        return;
      }

      isLoadingRef.current = true;
      Promise.all([
        loadWeeklyProgress(),
        loadHomeData(),
        loadTodayWorkoutTime(),
        loadInBodyData(),
        loadProfileInfo(),
      ]).finally(() => {
        isLoadingRef.current = false;
        console.log("[HOME] 화면 포커스, 오늘 운동 데이터 새로고침 완료");
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

  const handleCalendarClick = () => {
    navigation.navigate("Calendar");
  };

  return (
    <SafeAreaView style={styles.container} edges={["top"]}>
      <View style={styles.header}>
        <Text style={styles.logoText}>INTEL FIT</Text>
      </View>
      <View style={styles.divider} />

      <ScrollView style={styles.content}>
        {/* ✅ 식단/운동 추천 카드 */}
        <View style={styles.enhancedRecommendationWrapper}>
          <View style={styles.enhancedRecommendationCardContainer}>
            <View style={styles.enhancedRecommendationCardBorder} />
            <View style={styles.enhancedRecommendationCard}>
              <View style={styles.enhancedRecommendationContent}>
                <Text style={styles.enhancedRecommendationTitle}>
                  {homeData?.userSummary?.name}회원님을 위한{"\n"}
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

        {/* 알림 카드 - 코치 리포트 */}
        {randomActionItem && (
          <View style={styles.notificationCardContainer}>
            <View style={styles.notificationCardBorder} />
            <View style={styles.notificationCard}>
              <Ionicons name="sparkles" size={25} color="#e3ff7c" />
              <Text style={styles.notificationText}>
                {randomActionItem}
              </Text>
            </View>
          </View>
        )}

        {/* 주간 진행률 섹션 */}
        <TouchableOpacity
          style={styles.exerciseProgressSection}
          onPress={handleCalendarClick}
          activeOpacity={0.7}
        >
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
                        const rate = dayProgress?.exerciseRate ?? 0;

                        return (
                          <>
                            <Text style={styles.calendarCalories}>
                              {`${Math.round(calories)}k`}
                            </Text>
                            <Text style={styles.calendarPercentage}>
                              {`${Math.round(rate)}%`}
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
        </TouchableOpacity>

        {/* 칼로리 섹션 */}
        <View style={styles.calorieSection}>
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

        {/* 운동 루틴 카드 */}
        <View style={styles.routineCard}>
          <Text style={styles.routineTitle}>Day 1 하체</Text>
          <View style={styles.routineStats}>
            <View style={styles.routineStatItem}>
              <Ionicons name="barbell" size={40} color="#ffffff" />
              <Text style={styles.routineStatText}>4가지 운동</Text>
            </View>
            <View style={styles.routineStatItem}>
              <Ionicons name="stopwatch-outline" size={40} color="#ffffff" />
              <Text style={styles.routineStatText}>13세트</Text>
            </View>
            <View style={styles.routineStatItem}>
              <MaterialIcons
                name="local-fire-department"
                size={40}
                color="#ffffff"
              />
              <Text style={styles.routineStatText}>229 kcal</Text>
            </View>
          </View>
          <TouchableOpacity style={styles.routineButton}>
            <Text style={styles.routineButtonText}>오늘 운동 시작하기</Text>
          </TouchableOpacity>
        </View>

        {/* 운동 통계 카드 */}
        <View style={styles.exerciseStatsCard}>
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

        {/* 체중/골격근량/체지방량 카드 - 인바디 기록이 있을 때만 표시 */}
        {(() => {
          // 인바디 기록이 있는지 확인 (체중, 골격근량, 체지방량 중 하나라도 값이 있으면 표시)
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
            <View style={styles.bodyStatsContainer}>
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
        })()}

        {/* 식단 추천 섹션 */}
        <View style={styles.dietRecommendationSection}>
          <View style={styles.recommendationContent}>
            <Text style={styles.recommendationTitle}>
              운동 잘 마무리 하셨나요?
            </Text>
            <Text style={styles.recommendationSubtitle}>저녁 식단으로</Text>
            <View style={styles.foodRecommendations}>
              <View style={styles.foodItem}>
                <Text style={styles.foodItemText}>닭가슴살 300g</Text>
              </View>
              <View style={styles.foodItem}>
                <Text style={styles.foodItemText}>단백질 쉐이크</Text>
              </View>
              <View style={styles.foodItem}>
                <Text style={styles.foodItemText}>구운 계란 2개</Text>
              </View>
            </View>
            <Text style={styles.recommendationQuestion}>어떤가요?</Text>
          </View>
        </View>
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
    paddingVertical: 16,
    paddingHorizontal: 16,
    marginBottom: 20,
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
    height: 60,
    marginVertical: 6,
  },
  calendarItem: {
    flex: 1,
    alignItems: "center",
    justifyContent: "center",
    gap: 4,
    minHeight: 60,
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
  calorieSection: {
    backgroundColor: "#393a38",
    borderRadius: 20,
    paddingVertical: 16,
    paddingHorizontal: 20,
    marginBottom: 20,
    borderWidth: 1,
    borderColor: "#2a2a2a",
  },
  calorieStatsContent: {
    flexDirection: "row",
    justifyContent: "space-between",
    alignItems: "center",
    height: 60,
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
    padding: 20,
    marginBottom: 20,
    borderWidth: 1,
    borderColor: "#2a2a2a",
  },
  recommendationContent: {
    maxWidth: 249,
  },
  recommendationTitle: {
    fontSize: 16,
    fontWeight: "700",
    color: "#e3ff7c",
    marginBottom: 5,
  },
  recommendationSubtitle: {
    fontSize: 16,
    fontWeight: "700",
    color: "#ffffff",
    marginBottom: 10,
  },
  foodRecommendations: {
    flexDirection: "row",
    flexWrap: "wrap",
    gap: 6,
    marginBottom: 8,
  },
  foodItem: {
    backgroundColor: "#e3ff7c",
    paddingHorizontal: 12,
    paddingVertical: 8,
    borderRadius: 10,
  },
  foodItemText: {
    color: "#000000",
    fontSize: 14,
    fontWeight: "700",
  },
  recommendationQuestion: {
    fontSize: 16,
    fontWeight: "700",
    color: "#ffffff",
  },
  routineCard: {
    backgroundColor: "#393a38",
    borderRadius: 20,
    padding: 20,
    marginBottom: 20,
    borderWidth: 1,
    borderColor: "#2a2a2a",
  },
  routineTitle: {
    fontSize: 16,
    fontWeight: "700",
    color: "#e3ff7c",
    marginBottom: 20,
    lineHeight: 19,
  },
  routineStats: {
    flexDirection: "row",
    justifyContent: "space-between",
    marginBottom: 20,
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
    paddingVertical: 16,
    paddingHorizontal: 20,
    marginBottom: 20,
    borderWidth: 1,
    borderColor: "#2a2a2a",
  },
  exerciseStatsContent: {
    flexDirection: "row",
    justifyContent: "space-between",
    alignItems: "center",
    height: 60,
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
    marginBottom: 20,
  },
  bodyStatCard: {
    flex: 1,
    backgroundColor: "#393a38",
    borderRadius: 20,
    padding: 15,
    alignItems: "center",
    justifyContent: "center",
    minHeight: 70,
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
    fontSize: 20,
    fontWeight: "700",
    color: "#e3ff7c",
    lineHeight: 24,
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
    marginBottom: 20,
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
    padding: 20,
    zIndex: 1,
    overflow: "hidden",
  },
  enhancedRecommendationContent: {
    gap: 20,
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
    marginBottom: 20,
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
    padding: 16,
    flexDirection: "row",
    alignItems: "center",
    gap: 16,
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
});

export default HomeScreen;

