import { requestAI } from "./apiConfig";
import { authAPI } from "./authAPI";
import AsyncStorage from "@react-native-async-storage/async-storage";

export interface ScoreTrendItem {
  date: string;
  score: number;
}

// userId 가져오기 (Profile API 사용)
const getUserId = async (): Promise<string> => {
  try {
    // 1. 캐시에서 먼저 확인
    let userId = await AsyncStorage.getItem("userIdString");
    if (userId) {
      return userId;
    }

    // 2. Profile API 호출
    const profile = await authAPI.getProfile();
    userId = profile.userId;

    // 3. 캐시에 저장
    await AsyncStorage.setItem("userIdString", userId);

    return userId;
  } catch (error) {
    throw new Error("사용자 ID를 찾을 수 없습니다.");
  }
};

export const healthScoreAPI = {
  getDailyTrend: async (): Promise<ScoreTrendItem[]> => {
    try {
      const userId = await getUserId();
      const response = await requestAI<ScoreTrendItem[]>(
        `/score/trend/daily/${userId}`,
        { method: "GET" }
      );
      return Array.isArray(response) ? response : [];
    } catch (error: any) {
      // 404는 정상적인 "데이터 없음" 상태
      if (error.status === 404) {
        return [];
      }
      // 다른 에러는 그대로 전달
      console.error("[HEALTH_SCORE] 일일 점수 로드 실패:", error.message);
      throw error;
    }
  },

  getWeeklyTrend: async (): Promise<ScoreTrendItem[]> => {
    try {
      const userId = await getUserId();
      const response = await requestAI<ScoreTrendItem[]>(
        `/score/trend/weekly/${userId}`,
        { method: "GET" }
      );
      return Array.isArray(response) ? response : [];
    } catch (error: any) {
      if (error.status === 404) {
        return [];
      }
      console.error("[HEALTH_SCORE] 주간 점수 로드 실패:", error.message);
      throw error;
    }
  },

  getMonthlyTrend: async (): Promise<ScoreTrendItem[]> => {
    try {
      const userId = await getUserId();
      const response = await requestAI<ScoreTrendItem[]>(
        `/score/trend/monthly/${userId}`,
        { method: "GET" }
      );
      return Array.isArray(response) ? response : [];
    } catch (error: any) {
      if (error.status === 404) {
        return [];
      }
      console.error("[HEALTH_SCORE] 월간 점수 로드 실패:", error.message);
      throw error;
    }
  },
};
