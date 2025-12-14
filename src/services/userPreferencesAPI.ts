// src/services/userPreferencesAPI.ts
import { request } from "./apiConfig";
import type { UserPreferencesResponse } from "../types";

export const userPreferencesAPI = {
  /**
   * 사용자 전체 선호도 조회
   * GET /api/user/preferences
   */
  getUserPreferences: async (): Promise<UserPreferencesResponse> => {
    try {
      console.log("🍽️ 사용자 선호도 조회");

      const response = await request<UserPreferencesResponse>(
        "/api/user/preferences",
        {
          method: "GET",
        }
      );

      console.log("✅ 선호도 조회 성공:", response);
      return response;
    } catch (error: any) {
      console.error("❌ 선호도 조회 실패:", error);
      throw new Error(error.message || "사용자 선호도 조회에 실패했습니다.");
    }
  },

  /**
   * 비선호 음식만 가져오기 (편의 함수)
   */
  getDislikedFoods: async (): Promise<string[]> => {
    try {
      const preferences = await userPreferencesAPI.getUserPreferences();
      return preferences.dislikedFoods || [];
    } catch (error: any) {
      console.error("❌ 비선호 음식 조회 실패:", error);
      return [];
    }
  },

  /**
   * 금지 식단 전체 저장 (덮어쓰기)
   * POST /api/user/preferences/disliked
   * Body: { "dislikedFoods": ["땅콩", "우유", "새우"] }
   */
  saveDislikedFoods: async (
    dislikedFoods: string[]
  ): Promise<{ dislikedFoods: string[] }> => {
    try {
      console.log("💾 금지 식단 전체 저장:", dislikedFoods);

      const requestBody = {
        dislikedFoods,
      };

      console.log("📤 요청 본문:", requestBody);

      const response = await request<{ dislikedFoods: string[] }>(
        "/api/user/preferences/disliked",
        {
          method: "POST",
          body: JSON.stringify(requestBody),
        }
      );

      console.log("✅ 금지 식단 저장 성공:", response);
      return response;
    } catch (error: any) {
      console.error("❌ 금지 식단 저장 실패:", error);
      throw new Error(error.message || "금지 식단 저장에 실패했습니다.");
    }
  },
};
