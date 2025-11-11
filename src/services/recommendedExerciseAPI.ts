// src/services/recommendedExerciseAPI.ts
import { requestAI } from "./apiConfig";

/**
 * 인바디 데이터 타입
 */
interface InbodyData {
  arms?: any;
  chest?: any;
  back?: any;
  shoulders?: any;
  legs?: any;
  glutes?: any;
  core?: any;
}

/**
 * 운동 루틴 요청 파라미터
 */
interface ExercisePlanRequest {
  age: number;
  sex: "male" | "female";
  goal: "hypertrophy" | "strength" | "endurance";
  experience: "beginner" | "intermediate" | "advanced";
  environment: "gym" | "home";
  available_equipment: string[];
  health_conditions: string[];
  plan_days: number;
  inbody: InbodyData;
}

/**
 * 운동 루틴 추천 관련 API
 */
export const recommendedExerciseAPI = {
  /**
   * AI 서버로 운동 루틴 추천 받기
   */
  getAIExercisePlan: async (params: ExercisePlanRequest): Promise<any> => {
    try {
      console.log("🤖 AI 서버 운동 루틴 요청:", params);

      const response = await requestAI("/ai/exercise_plan", {
        method: "POST",
        body: JSON.stringify(params),
        timeoutMs: 60000,
      });

      console.log(
        "✅ AI 서버 운동 루틴 응답:",
        JSON.stringify(response, null, 2)
      );
      return response;
    } catch (error: any) {
      console.error("❌ AI 서버 운동 루틴 실패:", error);
      throw new Error(error.message || "운동 루틴 생성에 실패했습니다.");
    }
  },
};
