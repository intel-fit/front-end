// src/services/userPreferencesAPI.ts
import { request } from "./apiConfig";
// 🚨 [수정됨] DeleteExclusionResponse 타입 추가 Import
import type {
  UserPreferencesResponse,
  ExclusionResponse,
  DeleteExclusionResponse,
} from "../types";

export const userPreferencesAPI = {
  // ... 기존 getUserPreferences 등 조회 관련 코드는 그대로 유지 ...
  getUserPreferences: async (): Promise<UserPreferencesResponse> => {
    // (기존 코드 생략 - 필요시 유지)
    return {} as UserPreferencesResponse; // 임시 반환값 (실제 코드에 맞게 유지하세요)
  },

  /**
   * [변경됨] 비선호(제외) 식단 추가
   * POST /exclusions/{user_id}?food_name=...&food_name=...&reason=taste
   * @param userId 사용자 ID (문자열)
   * @param foods 추가할 음식 이름 배열 (예: ["굴비", "다랑어"])
   */
  addExclusions: async (
    userId: string,
    foods: string[]
  ): Promise<ExclusionResponse> => {
    try {
      console.log(`🚫 비선호 식단 추가 요청 (User: ${userId})`);
      console.log("target foods:", foods);

      // 1. 쿼리 파라미터 생성
      const queryParams = new URLSearchParams();

      foods.forEach((food) => {
        queryParams.append("food_name", food);
      });

      // reason 고정값 추가
      queryParams.append("reason", "taste");

      const queryString = queryParams.toString();
      const url = `/exclusions/${userId}?${queryString}`;

      console.log("🔗 생성된 URL:", url);

      // 2. 요청 전송
      const response = await request<ExclusionResponse>(url, {
        method: "POST",
      });

      console.log("✅ 비선호 식단 추가 성공:", response);
      return response;
    } catch (error: any) {
      console.error("❌ 비선호 식단 추가 실패:", error);
      throw new Error(error.message || "비선호 식단 추가에 실패했습니다.");
    }
  },

  /**
   * (참고) 기존 편의 함수 업데이트
   * 이제 API가 '전체 덮어쓰기'가 아니라 '추가' 방식이므로 userId를 받도록 수정됨
   */
  addDislikedFoods: async (userId: string, newItems: string[]) => {
    return await userPreferencesAPI.addExclusions(userId, newItems);
  },

  /**
   * 📋 비선호(제외) 식단 목록 조회
   * GET /exclusions/{user_id}
   */
  getExclusions: async (userId: string): Promise<ExclusionResponse[]> => {
    try {
      if (!userId || typeof userId !== "string") {
        console.warn(
          "⚠️ 경고: user_id가 올바르지 않습니다. 문자열 ID(예: ehdrb)를 사용해주세요."
        );
      }

      console.log(`📋 비선호 식단 조회 요청 (User: ${userId})`);

      const response = await request<ExclusionResponse[]>(
        `/exclusions/${userId}`,
        {
          method: "GET",
        }
      );

      console.log("✅ 비선호 식단 조회 성공:", response);
      return response;
    } catch (error: any) {
      console.error("❌ 비선호 식단 조회 실패:", error);
      throw new Error(
        error.message || "비선호 식단 목록을 불러오는데 실패했습니다."
      );
    }
  },

  /**
   * 🗑️ 비선호(제외) 식단 삭제
   * DELETE /exclusions/{exclusion_id}
   */
  deleteExclusion: async (
    exclusionId: number
  ): Promise<DeleteExclusionResponse> => {
    try {
      console.log(`🗑️ 비선호 식단 삭제 요청 (ID: ${exclusionId})`);

      const response = await request<DeleteExclusionResponse>(
        `/exclusions/${exclusionId}`,
        {
          method: "DELETE",
        }
      );

      console.log("✅ 비선호 식단 삭제 성공:", response);
      return response;
    } catch (error: any) {
      console.error(`❌ 비선호 식단 삭제 실패 (ID: ${exclusionId}):`, error);
      throw new Error(error.message || "비선호 식단 삭제에 실패했습니다.");
    }
  },
};
