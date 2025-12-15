import { request, requestAI, ACCESS_TOKEN_KEY } from "./apiConfig";
import AsyncStorage from "@react-native-async-storage/async-storage";
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
   * [NEW] 7일치 주간 운동 루틴 생성 (AI 서버)
   */
  generateWeeklyExercisePlan: async (data: any): Promise<any> => {
    try {
      console.log("📅 주간 루틴 생성 요청 (AI)");

      // 1. 토큰 가져오기
      const token = await AsyncStorage.getItem(ACCESS_TOKEN_KEY);
      // 만약 ACCESS_TOKEN_KEY import가 안되면 문자열 "accessToken" 등을 직접 쓰셔도 됩니다.
      // 예: const token = await AsyncStorage.getItem("accessToken");

      console.log("🔑 토큰 존재 여부:", !!token);

      // 2. 헤더에 토큰 추가하여 요청 보내기
      const response = await requestAI("/ai/exercise_plan", {
        // 찾으신 경로 사용
        method: "POST",
        headers: {
          "Content-Type": "application/json",
          Authorization: `Bearer ${token}`, // 🔥 핵심: 이 줄이 있어야 401이 해결됩니다.
        },
        body: JSON.stringify(data),
      });

      console.log("✅ 주간 루틴 생성 성공");
      return response;
    } catch (error: any) {
      console.error("❌ 주간 루틴 생성 실패:", error);
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

  /**
   * 6. 추천받은 운동 목록 조회
   */
  getRecommendedExercises: async (): Promise<any> => {
    try {
      console.log("📋 추천받은 운동 목록 조회");

      const response = await request(
        `/api/exercise-recommendations/recommended-exercises`,
        {
          method: "GET",
        }
      );

      console.log("✅ 추천받은 운동 조회 성공:", response);
      return response;
    } catch (error: any) {
      console.error("❌ 추천받은 운동 조회 실패:", error);

      if (error.status === 401) {
        throw new Error("로그인이 필요합니다.");
      }

      throw error;
    }
  },

  getRecommendedHistory: async (): Promise<any> => {
    try {
      console.log("📅 운동 추천 내역 조회 요청");
      // GET 요청 전송
      const response = await request(
        "/api/exercise-recommendations/recommended-exercises",
        {
          method: "GET",
        }
      );
      return response;
    } catch (error) {
      console.error("❌ 내역 조회 실패:", error);
      throw error;
    }
  },
  saveWeeklyExercisePlan: async (data: { days: any[] }): Promise<any> => {
    try {
      console.log("💾 주간 운동 플랜 저장 요청");

      // 백엔드가 알려준 저장 API 주소: /api/exercise-recommendations/weekly/save
      const response = await request(
        "/api/exercise-recommendations/weekly/save",
        {
          method: "POST",
          body: JSON.stringify(data),
        }
      );

      console.log("✅ 주간 운동 플랜 저장 성공");
      return response;
    } catch (error: any) {
      console.error("❌ 주간 운동 플랜 저장 실패:", error);
      throw error;
    }
  },
  saveTempSummary: async (data: {
    date: string;
    focus: string;
    durationMin: number;
    kcal: number;
    exerciseCount: number;
    title: string;
  }): Promise<any> => {
    try {
      console.log("📝 추천 요약(TEMP) 저장 요청:", data.date, data.title);
      const response = await request("/api/exercise-recommendations/temp", {
        method: "POST",
        body: JSON.stringify(data),
      });
      return response;
    } catch (error) {
      console.error("❌ 추천 요약(TEMP) 저장 실패:", error);
      throw error; // 에러를 상위로 던져서 저장 프로세스를 중단할지 결정
    }
  },

  /**
   * 7. 임시 추천 운동 요약 조회 (TempSummary)
   * @param date - 날짜 (yyyy-MM-dd 형식)
   */
  getTempSummary: async (
    date: string
  ): Promise<{
    date: string;
    focus: string;
    durationMin: number;
    kcal: number;
    exerciseCount: number;
    title: string;
  }> => {
    try {
      console.log("📋 임시 추천 운동 요약 조회:", date);

      const response = await request(
        `/api/exercise-recommendations/temp?date=${encodeURIComponent(date)}`,
        {
          method: "GET",
        }
      );

      console.log("✅ 임시 추천 운동 요약 조회 성공:", response);
      return response;
    } catch (error: any) {
      console.error("❌ 임시 추천 운동 요약 조회 실패:", error);

      if (error.status === 401) {
        throw new Error("로그인이 필요합니다.");
      }

      if (error.status === 404) {
        // 데이터가 없을 경우 null 반환
        return null as any;
      }

      throw error;
    }
  },
  /**
   * 8. 날짜별 추천받은 운동 삭제
   * @param date - 삭제할 날짜 (yyyy-MM-dd)
   * 명세서 기준: DELETE /api/exercise-recommendations/temp?startDate=...&endDate=...
   */
  deleteRecommendedExerciseByDate: async (date: string): Promise<any> => {
    try {
      console.log("🗑️ 날짜별 운동 삭제 (명세서 기반 수정):", date);

      // 📸 사진에 나온 대로 startDate와 endDate를 동일하게 설정하여 요청
      const response = await request(
        `/api/exercise-recommendations/temp?startDate=${date}&endDate=${date}`,
        {
          method: "DELETE",
        }
      );

      console.log("✅ 날짜별 운동 삭제 성공:", response);
      return response;
    } catch (error: any) {
      console.error("❌ 날짜별 운동 삭제 실패:", error);

      if (error.status === 401) {
        throw new Error("로그인이 필요합니다.");
      }

      throw error;
    }
  },
};
