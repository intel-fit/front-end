// src/services/userPreferencesAPI.ts
import { request } from "./apiConfig";
import type {
  UserPreferencesResponse,
  AddDislikedFoodResponse,
  RemoveDislikedFoodResponse,
} from "../types";

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

  //Post 비선호 음식 추거ㅏ
  addDislikedFood: async (
    foodName: string
  ): Promise<AddDislikedFoodResponse> => {
    try {
      console.log("➕ 비선호 음식 추가:", foodName);

      const requestBody = {
        foodName,
      };

      console.log("📤 요청 본문:", requestBody);

      const response = await request<AddDislikedFoodResponse>(
        "/api/user/preferences/disliked",
        {
          method: "POST",
          body: JSON.stringify(requestBody),
        }
      );

      console.log("✅ 비선호 음식 추가 성공:", response);
      return response;
    } catch (error: any) {
      console.error("❌ 비선호 음식 추가 실패:", error);
      throw new Error(error.message || "비선호 음식 추가에 실패했습니다.");
    }
  },

  /**
   * 비선호 음식 여러 개 추가 (편의 함수)
   */
  addDislikedFoods: async (
    currentList: string[],
    newFoods: string[]
  ): Promise<{ updatedList: string[] }> => {
    try {
      console.log("➕ 비선호 음식 여러 개 추가:", newFoods);

      let lastResponse: AddDislikedFoodResponse | null = null;

      for (const food of newFoods) {
        lastResponse = await userPreferencesAPI.addDislikedFood(food);
      }

      return {
        updatedList: lastResponse?.dislikedFoods || [
          ...currentList,
          ...newFoods,
        ],
      };
    } catch (error: any) {
      console.error("❌ 비선호 음식 여러 개 추가 실패:", error);
      throw error;
    }
  },

  /**
   * 비선호 음식 삭제
   * DELETE /api/user/preferences/disliked/{foodName}
   */
  removeDislikedFood: async (
    currentList: string[],
    foodName: string
  ): Promise<{ updatedList: string[] }> => {
    try {
      console.log("🗑️ 비선호 음식 삭제:", foodName);

      const url = `/api/user/preferences/disliked/${encodeURIComponent(
        foodName
      )}`;

      const response = await request<RemoveDislikedFoodResponse>(url, {
        method: "DELETE",
      });

      console.log("✅ 비선호 음식 삭제 성공:", response);

      return {
        updatedList:
          response.dislikedFoods || currentList.filter((f) => f !== foodName),
      };
    } catch (error: any) {
      console.error("❌ 비선호 음식 삭제 실패:", error);
      throw new Error(error.message || "비선호 음식 삭제에 실패했습니다.");
    }
  },
};
