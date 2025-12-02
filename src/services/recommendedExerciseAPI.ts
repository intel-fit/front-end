import { request } from "./apiConfig";

/**
 * 운동 루틴 추천 API
 */
export const recommendedExerciseAPI = {
  /**
   * 0. 프로필 조회
   */
  getProfile: async (): Promise<any> => {
    try {
      console.log("👤 프로필 조회");

      const response = await request("/api/profile", {
        method: "GET",
      });

      console.log("✅ 프로필 조회 성공");
      return response;
    } catch (error: any) {
      console.error("❌ 프로필 조회 실패:", error);
      throw error;
    }
  },

  /**
   * 1. 일일 운동 플랜 생성
   * @param baseDate - 기준 날짜 (yyyy-MM-dd 형식)
   * @param requestBody - 운동 추천 요청 바디
   * @returns 생성된 운동 플랜 정보
   *
   * @example
   * generateExercisePlan("2025-12-02", {
   *   experienceLevel: "INTERMEDIATE",
   *   environment: "gym",
   *   availableEquipment: ["덤벨", "머신"],
   *   likeMuscles: ["가슴", "어깨"],
   *   healthConditions: ["허리"],
   *   targetTimeMin: 60
   * })
   */
  generateExercisePlan: async (
    baseDate?: string,
    requestBody?: {
      experienceLevel: string;
      environment: string;
      availableEquipment: string[];
      likeMuscles: string[];
      healthConditions: string[];
      targetTimeMin: number;
    }
  ): Promise<any> => {
    try {
      // baseDate가 없으면 오늘 날짜 사용
      const date = baseDate || new Date().toISOString().split("T")[0];

      console.log("💪 운동 플랜 생성 요청");
      console.log("📅 baseDate:", date);
      console.log("📦 requestBody:", JSON.stringify(requestBody, null, 2));

      const response = await request(
        `/api/exercise-recommendations/generate/daily?baseDate=${date}`,
        {
          method: "POST",
          headers: {
            "Content-Type": "application/json",
          },
          body: requestBody ? JSON.stringify(requestBody) : undefined,
        }
      );

      console.log("✅ 운동 플랜 생성 성공:", JSON.stringify(response, null, 2));
      return response;
    } catch (error: any) {
      console.error("❌ 운동 플랜 생성 실패:", error);

      if (error.status === 401) {
        throw new Error("로그인이 필요합니다. 다시 로그인해주세요.");
      }

      // 토큰 부족 예외 처리
      if (error.code === "NO_WORKOUT_TOKENS") {
        throw error; // 원본 에러 그대로 전달
      }

      throw error;
    }
  },

  /**
   * 2. 운동 플랜 저장
   * @param planId - 저장할 플랜 ID
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

      if (error.status === 401) {
        throw new Error("인증이 필요합니다. 다시 로그인해주세요.");
      }

      if (error.status === 404) {
        throw new Error("저장하려는 플랜을 찾을 수 없습니다.");
      }

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

      if (error.status === 401) {
        throw new Error("로그인이 필요합니다.");
      }

      throw error;
    }
  },

  /**
   * 4. 저장된 운동 플랜 상세 조회
   * @param planId - 조회할 플랜 ID
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

      if (error.status === 401) {
        throw new Error("로그인이 필요합니다.");
      }

      throw error;
    }
  },

  /**
   * 5. 운동 플랜 삭제
   * @param planId - 삭제할 플랜 ID
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

      if (error.status === 401) {
        throw new Error("로그인이 필요합니다.");
      }

      throw error;
    }
  },
};
