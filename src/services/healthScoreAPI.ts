// src/services/healthScoreAPI.ts
import AsyncStorage from "@react-native-async-storage/async-storage";
import { requestAI } from "./apiConfig";

export interface ScoreTrendItem {
  date: string;
  nutrition: number;
  exercise: number;
  balance: number;
  total: number;
}

// 주간 데이터 원본 타입
interface WeeklyScoreItem {
  week_start: string;
  week_end: string;
  nutrition_avg: number;
  exercise_avg: number;
  balance_avg: number;
  total_avg: number;
}

// 월간 데이터 원본 타입
interface MonthlyScoreItem {
  month: string;
  nutrition_avg: number;
  exercise_avg: number;
  balance_avg: number;
  total_avg: number;
}

const getUserId = async (): Promise<string> => {
  const userId = await AsyncStorage.getItem("userId");
  if (!userId) {
    throw new Error("로그인이 필요합니다");
  }
  return userId;
};

export const healthScoreAPI = {
  // 일일 점수
  getDailyTrend: async (): Promise<ScoreTrendItem[]> => {
    try {
      const userId = await getUserId();
      console.log("📊 [DAILY] 사용자 ID:", userId);

      const response = await requestAI<{ daily_scores: ScoreTrendItem[] }>(
        `/score/daily/${userId}`,
        { method: "GET" }
      );

      console.log("📊 [DAILY] 전체 응답:", JSON.stringify(response, null, 2));
      return Array.isArray(response.daily_scores) ? response.daily_scores : [];
    } catch (error: any) {
      // 404 에러는 조용히 처리 (데이터 없음)
      if (error.status === 404) {
        console.log("ℹ️ [DAILY] 데이터 없음");
        return [];
      }
      // 다른 에러만 로깅
      console.error("[HEALTH_SCORE] 일일 점수 로드 실패:", error.message);
      throw error;
    }
  },

  // 주간 점수
  getWeeklyTrend: async (): Promise<ScoreTrendItem[]> => {
    try {
      const userId = await getUserId();
      console.log("📊 [WEEKLY] 사용자 ID:", userId);

      const response = await requestAI<{ weekly_scores: WeeklyScoreItem[] }>(
        `/score/weekly/${userId}`,
        { method: "GET" }
      );

      console.log("📊 [WEEKLY] 전체 응답:", JSON.stringify(response, null, 2));

      const transformedData: ScoreTrendItem[] = Array.isArray(
        response.weekly_scores
      )
        ? response.weekly_scores.map((item) => ({
            date: item.week_start,
            nutrition: item.nutrition_avg,
            exercise: item.exercise_avg,
            balance: item.balance_avg,
            total: item.total_avg,
          }))
        : [];

      console.log("✅ [WEEKLY] 변환된 데이터:", transformedData);
      return transformedData;
    } catch (error: any) {
      // 404 에러는 조용히 처리 (데이터 없음)
      if (error.status === 404) {
        console.log("ℹ️ [WEEKLY] 데이터 없음");
        return [];
      }
      // 다른 에러만 로깅
      console.error("[HEALTH_SCORE] 주간 점수 로드 실패:", error.message);
      throw error;
    }
  },

  // ✅ 월간 점수
  getMonthlyTrend: async (): Promise<ScoreTrendItem[]> => {
    try {
      const userId = await getUserId();
      console.log("📊 [MONTHLY] 사용자 ID:", userId);

      const response = await requestAI<{ monthly_scores: MonthlyScoreItem[] }>(
        `/score/monthly/${userId}`,
        { method: "GET" }
      );

      console.log("📊 [MONTHLY] 전체 응답:", JSON.stringify(response, null, 2));

      const transformedData: ScoreTrendItem[] = Array.isArray(
        response.monthly_scores
      )
        ? response.monthly_scores.map((item) => ({
            date: item.month,
            nutrition: item.nutrition_avg,
            exercise: item.exercise_avg,
            balance: item.balance_avg,
            total: item.total_avg,
          }))
        : [];

      console.log("✅ [MONTHLY] 변환된 데이터:", transformedData);
      return transformedData;
    } catch (error: any) {
      // 404 에러는 조용히 처리 (데이터 없음)
      if (error.status === 404) {
        console.log("ℹ️ [MONTHLY] 데이터 없음");
        return [];
      }
      // 다른 에러만 로깅
      console.error("[HEALTH_SCORE] 월간 점수 로드 실패:", error.message);
      throw error;
    }
  },
};