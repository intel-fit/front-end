// src/services/recommendedExerciseAPI.ts
import { request, requestAI } from "./apiConfig";

/**
 * 운동 루틴 추천 API
 */
export const recommendedExerciseAPI = {
  /**
   * 1. 운동 플랜 생성
   */
  generateExercisePlan: async (): Promise<any> => {
    try {
      console.log("💪 운동 플랜 생성 요청");

      const response = await requestAI(`/api/exercise-recommendations/generate`, {
        method: "POST",
      });

      console.log("✅ 운동 플랜 생성 성공:", JSON.stringify(response, null, 2));
      return response;
    } catch (error: any) {
      console.error("❌ 운동 플랜 생성 실패:", error);
      throw error;
    }
  },

  /**
   * 2. 운동 플랜 저장
   */
  saveExercisePlan: async (planId: number): Promise<any> => {
    try {
      console.log("💾 운동 플랜 저장 요청:", planId);

      const response = await request(
        `/api/exercise-recommendations/${planId}/save`,
        {
          method: "POST",
        }
      );

      console.log("✅ 운동 플랜 저장 성공:", response);
      return response;
    } catch (error: any) {
      console.error("❌ 운동 플랜 저장 실패:", error);
      throw error;
    }
  },

  /**
   * 3. 저장된 운동 플랜 목록 조회
   */
  getSavedExercisePlans: async (): Promise<any> => {
    try {
      console.log("📋 저장된 운동 플랜 목록 조회");

      const response = await request(`/api/exercise-recommendations`, {
        method: "GET",
      });

      console.log("✅ 저장된 플랜 조회 성공:", response);
      return response;
    } catch (error: any) {
      console.error("❌ 저장된 플랜 조회 실패:", error);
      throw error;
    }
  },

  /**
   * 4. 저장된 운동 플랜 상세 조회
   */
  getSavedExercisePlanDetail: async (planId: number): Promise<any> => {
    try {
      console.log("📋 운동 플랜 상세 조회:", planId);

      const response = await request(
        `/api/exercise-recommendations/${planId}`,
        {
          method: "GET",
        }
      );

      console.log("✅ 플랜 상세 조회 성공:", response);
      return response;
    } catch (error: any) {
      console.error("❌ 플랜 상세 조회 실패:", error);
      throw error;
    }
  },

  /**
   * 5. 운동 플랜 삭제
   */
  deleteExercisePlan: async (planId: number): Promise<any> => {
    try {
      console.log("🗑️ 운동 플랜 삭제:", planId);

      const response = await request(
        `/api/exercise-recommendations/${planId}`,
        {
          method: "DELETE",
        }
      );

      console.log("✅ 플랜 삭제 성공:", response);
      return response;
    } catch (error: any) {
      console.error("❌ 플랜 삭제 실패:", error);
      throw error;
    }
  },
};
