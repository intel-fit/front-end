// src/services/userPreferencesAPI.ts

import { requestAI } from "./apiConfig";
import type {
  ExclusionResponse,
  PreferenceResponse,
  PreferenceDeleteResponse,
} from "../types";

export const userPreferencesAPI = {
  /**
   * 비선호 음식 목록 조회
   */
  getExclusions: async (userId: string) => {
    try {
      console.log("🚫 비선호 음식 목록 조회:", userId);

      const response = await requestAI<ExclusionResponse[]>(
        `/exclusions/${userId}`,
        {
          method: "GET",
        }
      );

      console.log("✅ 비선호 음식 조회 완료:", response.length, "개");
      return response;
    } catch (error: any) {
      if (error.status === 404) {
        console.log("ℹ️ 비선호 음식 없음");
        return [];
      }
      console.error("❌ 비선호 음식 조회 실패:", error);
      throw error;
    }
  },

  /**
   * 비선호 음식 추가 (단일)
   */
  addExclusion: async (userId: string, foodName: string) => {
    try {
      console.log("🚫 비선호 음식 추가:", foodName);

      const response = await requestAI<ExclusionResponse>(
        `/exclusions/${userId}?food_name=${encodeURIComponent(foodName)}`,
        {
          method: "POST",
        }
      );

      console.log("✅ 비선호 음식 추가 완료:", response);
      return response;
    } catch (error: any) {
      console.error("❌ 비선호 음식 추가 실패:", error);
      throw new Error(error.message || "비선호 음식 추가에 실패했습니다.");
    }
  },

  /**
   * 비선호 음식 추가 (여러 개) - 하나씩 순차 추가
   */
  addExclusions: async (userId: string, foodNames: string[]) => {
    try {
      console.log("🚫 비선호 음식 여러 개 추가:", foodNames);

      const results: ExclusionResponse[] = [];

      // 각 음식을 하나씩 추가
      for (const foodName of foodNames) {
        console.log(`  - "${foodName}" 추가 중...`);
        const response = await requestAI<ExclusionResponse>(
          `/exclusions/${userId}?food_name=${encodeURIComponent(foodName)}`,
          {
            method: "POST",
          }
        );
        results.push(response);
        console.log(`  ✅ "${foodName}" 추가 완료 (id: ${response.id})`);
      }

      console.log("✅ 모든 비선호 음식 추가 완료:", results.length, "개");

      // 마지막 결과 반환 (DislikedFoodsModal 호환성)
      return results[results.length - 1];
    } catch (error: any) {
      console.error("❌ 비선호 음식 추가 실패:", error);
      throw new Error(error.message || "비선호 음식 추가에 실패했습니다.");
    }
  },

  /**
   * 비선호 음식 삭제
   */
  deleteExclusion: async (exclusionId: number) => {
    try {
      console.log("🗑️ 비선호 음식 삭제:", exclusionId);

      const response = await requestAI<{ status: string }>(
        `/exclusions/${exclusionId}`,
        {
          method: "DELETE",
        }
      );

      console.log("✅ 비선호 음식 삭제 완료");
      return response;
    } catch (error: any) {
      console.error("❌ 비선호 음식 삭제 실패:", error);
      throw new Error(error.message || "비선호 음식 삭제에 실패했습니다.");
    }
  },

  /**
   * 선호하는 음식 목록 조회
   */
  getPreferences: async (userId: string) => {
    try {
      console.log("💚 선호 음식 목록 조회:", userId);

      const response = await requestAI<PreferenceResponse[]>(
        `/preferences/${userId}`,
        {
          method: "GET",
        }
      );

      console.log("✅ 선호 음식 조회 완료:", response.length, "개");
      return response;
    } catch (error: any) {
      if (error.status === 404) {
        console.log("ℹ️ 선호 음식 없음");
        return [];
      }
      console.error("❌ 선호 음식 조회 실패:", error);
      throw error;
    }
  },

  /**
   * 선호하는 음식 추가 (여러 개) - 하나씩 순차 추가
   */
  addPreferences: async (userId: string, foodNames: string[]) => {
    try {
      console.log("💚 선호 음식 여러 개 추가:", foodNames);

      const results: PreferenceResponse[] = [];

      // 각 음식을 하나씩 추가
      for (const foodName of foodNames) {
        console.log(`  - "${foodName}" 추가 중...`);
        const response = await requestAI<PreferenceResponse>(
          `/preferences/${userId}?food_name=${encodeURIComponent(foodName)}`,
          {
            method: "POST",
          }
        );
        results.push(response);
        console.log(`  ✅ "${foodName}" 추가 완료 (id: ${response.id})`);
      }

      console.log("✅ 모든 선호 음식 추가 완료:", results.length, "개");

      // 마지막 결과 반환
      return results[results.length - 1];
    } catch (error: any) {
      console.error("❌ 선호 음식 추가 실패:", error);
      throw new Error(error.message || "선호 음식 추가에 실패했습니다.");
    }
  },

  /**
   * 선호하는 음식 삭제
   */
  deletePreference: async (preferenceId: number) => {
    try {
      console.log("🗑️ 선호 음식 삭제:", preferenceId);

      const response = await requestAI<PreferenceDeleteResponse>(
        `/preferences/${preferenceId}`,
        {
          method: "DELETE",
        }
      );

      console.log("✅ 선호 음식 삭제 완료:", response);
      return response;
    } catch (error: any) {
      console.error("❌ 선호 음식 삭제 실패:", error);
      throw new Error(error.message || "선호 음식 삭제에 실패했습니다.");
    }
  },
};
