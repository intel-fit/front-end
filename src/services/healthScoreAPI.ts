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

  // 일일 코멘트
  getDailyComment: async (): Promise<string | null> => {
    try {
      const userId = await getUserId();
      console.log("[HEALTH_SCORE][COMMENT] 일일 코멘트 요청 시작, userId:", userId);
      const response = await requestAI<any>(
        `/score/comment/daily/${userId}`,
        { method: "GET" }
      );
      console.log("[HEALTH_SCORE][COMMENT] 일일 코멘트 응답 전체:", JSON.stringify(response, null, 2));
      console.log("[HEALTH_SCORE][COMMENT] response 타입:", typeof response);
      console.log("[HEALTH_SCORE][COMMENT] response가 문자열인가?", typeof response === 'string');
      console.log("[HEALTH_SCORE][COMMENT] response 키들:", response && typeof response === 'object' ? Object.keys(response) : 'N/A');
      console.log("[HEALTH_SCORE][COMMENT] response.comment:", response?.comment);
      console.log("[HEALTH_SCORE][COMMENT] response.comments:", response?.comments);
      console.log("[HEALTH_SCORE][COMMENT] response.message:", response?.message);
      
      // 응답이 문자열인 경우
      if (typeof response === 'string') {
        console.log("[HEALTH_SCORE][COMMENT] 응답이 문자열로 받아짐, 반환:", response);
        return response.trim() || null;
      }
      
      // 응답이 객체인 경우 - comments (복수형) 필드를 우선 확인
      let comment = response?.comments || response?.comment || response?.message || null;
      
      // comments가 배열인 경우 랜덤으로 하나 선택
      if (Array.isArray(comment) && comment.length > 0) {
        const randomIndex = Math.floor(Math.random() * comment.length);
        const selectedComment = comment[randomIndex];
        console.log("[HEALTH_SCORE][COMMENT] 배열에서 랜덤 선택:", {
          totalComments: comment.length,
          selectedIndex: randomIndex,
          selectedComment: selectedComment,
        });
        comment = selectedComment;
      }
      
      console.log("[HEALTH_SCORE][COMMENT] 추출된 comment:", comment);
      return typeof comment === 'string' && comment.trim() ? comment : null;
    } catch (error: any) {
      console.error("[HEALTH_SCORE][COMMENT] 일일 코멘트 에러:", {
        message: error.message,
        status: error.status,
        data: error.data,
        stack: error.stack,
      });
      if (error.status === 404) {
        return null;
      }
      console.error("[HEALTH_SCORE] 일일 코멘트 로드 실패:", error.message);
      return null;
    }
  },

  // 주간 코멘트
  getWeeklyComment: async (): Promise<string | null> => {
    try {
      const userId = await getUserId();
      console.log("[HEALTH_SCORE][COMMENT] 주간 코멘트 요청 시작, userId:", userId);
      const response = await requestAI<any>(
        `/score/comment/weekly/${userId}`,
        { method: "GET" }
      );
      console.log("[HEALTH_SCORE][COMMENT] 주간 코멘트 응답 전체:", JSON.stringify(response, null, 2));
      console.log("[HEALTH_SCORE][COMMENT] response 타입:", typeof response);
      console.log("[HEALTH_SCORE][COMMENT] response가 문자열인가?", typeof response === 'string');
      console.log("[HEALTH_SCORE][COMMENT] response 키들:", response && typeof response === 'object' ? Object.keys(response) : 'N/A');
      console.log("[HEALTH_SCORE][COMMENT] response.comment:", response?.comment);
      console.log("[HEALTH_SCORE][COMMENT] response.comments:", response?.comments);
      console.log("[HEALTH_SCORE][COMMENT] response.message:", response?.message);
      
      // 응답이 문자열인 경우
      if (typeof response === 'string') {
        console.log("[HEALTH_SCORE][COMMENT] 응답이 문자열로 받아짐, 반환:", response);
        return response.trim() || null;
      }
      
      // 응답이 객체인 경우 - comments (복수형) 필드를 우선 확인
      let comment = response?.comments || response?.comment || response?.message || null;
      
      // comments가 배열인 경우 랜덤으로 하나 선택
      if (Array.isArray(comment) && comment.length > 0) {
        const randomIndex = Math.floor(Math.random() * comment.length);
        const selectedComment = comment[randomIndex];
        console.log("[HEALTH_SCORE][COMMENT] 배열에서 랜덤 선택:", {
          totalComments: comment.length,
          selectedIndex: randomIndex,
          selectedComment: selectedComment,
        });
        comment = selectedComment;
      }
      
      console.log("[HEALTH_SCORE][COMMENT] 추출된 comment:", comment);
      return typeof comment === 'string' && comment.trim() ? comment : null;
    } catch (error: any) {
      console.error("[HEALTH_SCORE][COMMENT] 주간 코멘트 에러:", {
        message: error.message,
        status: error.status,
        data: error.data,
        stack: error.stack,
      });
      if (error.status === 404) {
        return null;
      }
      console.error("[HEALTH_SCORE] 주간 코멘트 로드 실패:", error.message);
      return null;
    }
  },

  // 월간 코멘트
  getMonthlyComment: async (): Promise<string | null> => {
    try {
      const userId = await getUserId();
      console.log("[HEALTH_SCORE][COMMENT] 월간 코멘트 요청 시작, userId:", userId);
      const response = await requestAI<any>(
        `/score/comment/monthly/${userId}`,
        { method: "GET" }
      );
      console.log("[HEALTH_SCORE][COMMENT] 월간 코멘트 응답 전체:", JSON.stringify(response, null, 2));
      console.log("[HEALTH_SCORE][COMMENT] response 타입:", typeof response);
      console.log("[HEALTH_SCORE][COMMENT] response가 문자열인가?", typeof response === 'string');
      console.log("[HEALTH_SCORE][COMMENT] response 키들:", response && typeof response === 'object' ? Object.keys(response) : 'N/A');
      console.log("[HEALTH_SCORE][COMMENT] response.comment:", response?.comment);
      console.log("[HEALTH_SCORE][COMMENT] response.comments:", response?.comments);
      console.log("[HEALTH_SCORE][COMMENT] response.message:", response?.message);
      
      // 응답이 문자열인 경우
      if (typeof response === 'string') {
        console.log("[HEALTH_SCORE][COMMENT] 응답이 문자열로 받아짐, 반환:", response);
        return response.trim() || null;
      }
      
      // 응답이 객체인 경우 - comments (복수형) 필드를 우선 확인
      let comment = response?.comments || response?.comment || response?.message || null;
      
      // comments가 배열인 경우 랜덤으로 하나 선택
      if (Array.isArray(comment) && comment.length > 0) {
        const randomIndex = Math.floor(Math.random() * comment.length);
        const selectedComment = comment[randomIndex];
        console.log("[HEALTH_SCORE][COMMENT] 배열에서 랜덤 선택:", {
          totalComments: comment.length,
          selectedIndex: randomIndex,
          selectedComment: selectedComment,
        });
        comment = selectedComment;
      }
      
      console.log("[HEALTH_SCORE][COMMENT] 추출된 comment:", comment);
      return typeof comment === 'string' && comment.trim() ? comment : null;
    } catch (error: any) {
      console.error("[HEALTH_SCORE][COMMENT] 월간 코멘트 에러:", {
        message: error.message,
        status: error.status,
        data: error.data,
        stack: error.stack,
      });
      if (error.status === 404) {
        return null;
      }
      console.error("[HEALTH_SCORE] 월간 코멘트 로드 실패:", error.message);
      return null;
    }
  },
};