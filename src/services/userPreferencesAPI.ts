// src/services/userPreferencesAPI.ts
import { requestAI } from "./apiConfig";
import type { ExclusionResponse, DeleteExclusionResponse } from "../types";

export const userPreferencesAPI = {
  /**
   * 📋 비선호(제외) 식단 목록 조회
   * GET /exclusions/{user_id}
   * @param userId 사용자 ID (문자열, 예: "ehdrb")
   * @returns 비선호 식단 목록 배열
   *
   * 응답 예시:
   * [
   *   { id: 1, food_name: "굴비, 다랑어", reason: "taste" }
   * ]
   */
  getExclusions: async (userId: string): Promise<ExclusionResponse[]> => {
    try {
      console.log(`📋 비선호 식단 조회 요청 (User: ${userId})`);

      const response = await requestAI<ExclusionResponse[]>(
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
   * 🚫 비선호(제외) 식단 추가
   * POST /exclusions/{user_id}?food_name=굴비&food_name=다랑어&reason=taste
   * @param userId 사용자 ID (문자열)
   * @param foods 추가할 음식 이름 배열 (예: ["굴비", "다랑어"])
   * @returns 추가된 비선호 식단 정보
   *
   * 응답 예시:
   * { id: 1, food_name: "굴비, 다랑어", reason: "taste" }
   */
  addExclusions: async (
    userId: string,
    foods: string[]
  ): Promise<ExclusionResponse> => {
    try {
      console.log(`🚫 비선호 식단 추가 요청 (User: ${userId})`);
      console.log("추가할 음식:", foods);

      // 쿼리 파라미터 생성
      const queryParams = new URLSearchParams();
      foods.forEach((food) => {
        queryParams.append("food_name", food);
      });
      queryParams.append("reason", "taste");

      const queryString = queryParams.toString();
      const url = `/exclusions/${userId}?${queryString}`;

      // 📌 한글로 디코딩된 URL 로그 출력
      const decodedUrl = `/exclusions/${userId}?${decodeURIComponent(
        queryString
      )}`;
      console.log("🔗 요청 URL:", decodedUrl);
      // 또는 더 명확하게
      console.log(
        `POST /exclusions/${userId}?${foods
          .map((f) => `food_name=${f}`)
          .join("&")}&reason=taste`
      );

      const response = await requestAI<ExclusionResponse>(url, {
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
   * 🗑️ 비선호(제외) 식단 삭제
   * DELETE /exclusions/{exclusion_id}
   * @param exclusionId 비선호 식단 저장한 식단의 id (조회 시 받은 id 값)
   * @returns 삭제 결과
   *
   * 응답 예시:
   * { status: "deleted" }
   */
  deleteExclusion: async (
    exclusionId: number
  ): Promise<DeleteExclusionResponse> => {
    try {
      console.log(`🗑️ 비선호 식단 삭제 요청 (ID: ${exclusionId})`);

      const response = await requestAI<DeleteExclusionResponse>(
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
