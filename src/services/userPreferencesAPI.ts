// src/services/userPreferencesAPI.ts
import { request } from "./apiConfig";

/**
 * 사용자 선호도 API
 */
export const userPreferencesAPI = {
  /**
   * ✅ 통합 선호도 조회
   */
  getAllPreferences: async () => {
    try {
      console.log("📋 사용자 선호도 통합 조회");

      const response = await request<{
        preferredFoods: string[];
        dislikedFoods: string[];
      }>("/api/user/preferences", {
        method: "GET",
      });

      console.log("✅ 선호도 조회 완료:", {
        선호: response.preferredFoods?.length || 0,
        비선호: response.dislikedFoods?.length || 0,
      });

      return {
        preferredFoods: response.preferredFoods || [],
        dislikedFoods: response.dislikedFoods || [],
      };
    } catch (error: any) {
      console.error("❌ 선호도 조회 실패:", error);
      return {
        preferredFoods: [],
        dislikedFoods: [],
      };
    }
  },

  /**
   * ✅ 비선호 음식 추가 (현재 목록 기반)
   * @param currentList 클라이언트의 현재 비선호 목록
   * @param newFoods 추가할 새 음식들
   */
  addDislikedFoods: async (
    currentList: string[],
    newFoods: string[]
  ): Promise<{ success: boolean; message: string; updatedList: string[] }> => {
    try {
      console.log("🚫 비선호 음식 추가:", {
        현재목록: currentList.length,
        추가할음식: newFoods,
      });

      // ✅ 기존 + 새로운 음식 합치기 (중복 제거)
      const allFoods = [...new Set([...currentList, ...newFoods])];

      // ✅ 전체 목록을 콤마로 구분하여 전송
      const foodNameString = allFoods.join(", ");

      console.log("📤 전송할 전체 목록:", foodNameString);

      const response = await request<{ message: string }>(
        "/api/user/preferences/disliked",
        {
          method: "POST",
          body: JSON.stringify({ foodName: foodNameString }),
        }
      );

      console.log("✅ 비선호 음식 추가 완료");

      return {
        success: true,
        message: response.message || "비선호 음식이 추가되었습니다.",
        updatedList: allFoods, // ✅ 업데이트된 목록 반환
      };
    } catch (error: any) {
      console.error("❌ 비선호 음식 추가 실패:", error);
      throw new Error(error.message || "비선호 음식 추가에 실패했습니다.");
    }
  },

  /**
   * ✅ 비선호 음식 삭제 (현재 목록 기반)
   * @param currentList 클라이언트의 현재 비선호 목록
   * @param foodToRemove 삭제할 음식
   */
  removeDislikedFood: async (
    currentList: string[],
    foodToRemove: string
  ): Promise<{ success: boolean; message: string; updatedList: string[] }> => {
    try {
      console.log("🗑️ 비선호 음식 삭제:", {
        현재목록: currentList.length,
        삭제할음식: foodToRemove,
      });

      // ✅ 삭제할 음식 제외
      const updatedFoods = currentList.filter((f) => f !== foodToRemove);

      // ✅ 빈 문자열 처리 (모두 삭제된 경우)
      const foodNameString =
        updatedFoods.length > 0 ? updatedFoods.join(", ") : "";

      console.log("📤 전송할 전체 목록:", foodNameString || "(빈 목록)");

      // ✅ POST로 전체 업데이트
      const response = await request<{ message: string }>(
        "/api/user/preferences/disliked",
        {
          method: "POST",
          body: JSON.stringify({ foodName: foodNameString }),
        }
      );

      console.log("✅ 비선호 음식 삭제 완료");

      return {
        success: true,
        message: response.message || "비선호 음식이 삭제되었습니다.",
        updatedList: updatedFoods, // ✅ 업데이트된 목록 반환
      };
    } catch (error: any) {
      console.error("❌ 비선호 음식 삭제 실패:", error);
      throw new Error(error.message || "비선호 음식 삭제에 실패했습니다.");
    }
  },

  /**
   * 비선호 음식만 조회 (하위 호환)
   */
  getDislikedFoods: async (): Promise<string[]> => {
    try {
      const prefs = await userPreferencesAPI.getAllPreferences();
      return prefs.dislikedFoods;
    } catch (error: any) {
      console.error("❌ 비선호 음식 조회 실패:", error);
      return [];
    }
  },

  /**
   * 선호 음식만 조회
   */
  getPreferredFoods: async (): Promise<string[]> => {
    try {
      const prefs = await userPreferencesAPI.getAllPreferences();
      return prefs.preferredFoods;
    } catch (error: any) {
      console.error("❌ 선호 음식 조회 실패:", error);
      return [];
    }
  },
};

export interface UserPreferences {
  preferredFoods: string[];
  dislikedFoods: string[];
}
