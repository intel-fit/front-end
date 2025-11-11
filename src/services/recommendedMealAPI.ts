// src/services/recommendedMealAPI.ts
import { request } from "./apiConfig";
import { requestAI } from "./apiConfig";

interface MealPlanResponse {
  id: number;
  planName: string;
  description: string;
  totalCalories: number;
  totalCarbs: number;
  totalProtein: number;
  totalFat: number;
  recommendationReason: string;
  isSaved: boolean;
  meals: Array<{
    id: number;
    mealType: "BREAKFAST" | "LUNCH" | "DINNER";
    mealTypeName: string;
    totalCalories: number;
    totalCarbs: number;
    totalProtein: number;
    totalFat: number;
    foods: Array<{
      foodName: string;
      calories: number;
      carbs: number;
      protein: number;
      fat: number;
    }>;
  }>;
}

/**
 * 저장된 식단 목록 타입
 */
interface SavedMealPlan {
  id: number;
  planName: string;
  description: string;
  totalCalories: number;
  totalCarbs: number;
  totalProtein: number;
  totalFat: number;
  createdAt: string;
  isSaved: boolean;
}

/**
 * 식단 추천 관련 API
 */
export const recommendedMealAPI = {
  /**
   * AI 서버로 하루 식단 추천 받기
   */
  getAIDailyMealPlan: async (
    userId: string,
    goal: "maintain" | "cut" | "bulk" = "maintain",
    mealsPerDay: number = 3,
    dislikedFoods: string[] = []
  ): Promise<any> => {
    try {
      console.log("🤖 AI 서버 식단 추천 요청:", {
        userId,
        goal,
        mealsPerDay,
        dislikedFoods,
      });

      const url = `/recommend/recommend_daily_meal?user_id=${userId}&meals_per_day=${mealsPerDay}&goal=${goal}`;

      const response = await requestAI(url, {
        method: "POST",
        body: JSON.stringify({
          preferred_foods: [],
          disliked_foods: dislikedFoods,
        }),
        timeoutMs: 60000,
      });

      console.log("✅ AI 서버 식단 응답:", JSON.stringify(response, null, 2));
      return response;
    } catch (error: any) {
      console.error("❌ AI 서버 식단 추천 실패:", error);
      throw new Error(error.message || "AI 식단 추천에 실패했습니다.");
    }
  },

  /**
   * 일주일치 식단 추천 받기 (메인 서버)
   */
  getWeeklyMealPlan: async (): Promise<any> => {
    try {
      console.log("📅 일주일 식단 요청 시작");

      const response = await request("/api/recommended-meals/week", {
        method: "GET",
      });

      console.log("✅ 일주일 식단 응답:", JSON.stringify(response, null, 2));
      return response;
    } catch (error: any) {
      console.error("❌ 일주일 식단 추천 실패:", error);
      throw new Error(error.message || "식단을 불러오는데 실패했습니다.");
    }
  },

  /**
   * 하루치 식단 추천 받기 (메인 서버 - 기존 코드 호환용)
   */
  getDailyMealPlan: async (): Promise<MealPlanResponse> => {
    try {
      console.log("📅 하루 식단 요청 시작");

      const response = await request<MealPlanResponse>(
        "/api/recommended-meals/generate",
        {
          method: "POST",
        }
      );

      console.log("✅ 하루 식단 응답:", response);
      return response;
    } catch (error: any) {
      console.error("❌ 하루 식단 추천 실패:", error);
      throw new Error(error.message || "식단을 불러오는데 실패했습니다.");
    }
  },

  /**
   * 식단 저장하기
   */
  saveMealPlan: async (
    mealPlanId: number
  ): Promise<{ success: boolean; message: string }> => {
    try {
      console.log("💾 식단 저장 요청:", mealPlanId);

      const response = await request(
        `/api/recommended-meals/${mealPlanId}/save`,
        {
          method: "POST",
        }
      );

      console.log("✅ 식단 저장 성공:", response);
      return {
        success: true,
        message: response.message || "식단이 저장되었습니다.",
      };
    } catch (error: any) {
      console.error("❌ 식단 저장 실패:", error);
      throw new Error(error.message || "식단 저장에 실패했습니다.");
    }
  },

  /**
   * 저장된 식단 목록 조회
   */
  getSavedMealPlans: async (): Promise<SavedMealPlan[]> => {
    try {
      console.log("📋 저장된 식단 목록 요청");

      const response = await request<{
        plans: SavedMealPlan[];
        totalCount: number;
      }>("/api/recommended-meals/saved", {
        method: "GET",
      });

      console.log("✅ 저장된 식단 목록:", response);

      // plans 배열 반환
      return response.plans || [];
    } catch (error: any) {
      console.error("❌ 저장된 식단 조회 실패:", error);
      throw new Error(
        error.message || "저장된 식단을 불러오는데 실패했습니다."
      );
    }
  },

  /**
   * 저장된 식단 상세 조회
   */
  getSavedMealPlanDetail: async (
    mealPlanId: number
  ): Promise<MealPlanResponse> => {
    try {
      console.log("📋 저장된 식단 상세 요청:", mealPlanId);

      const response = await request<MealPlanResponse>(
        `/api/recommended-meals/saved/${mealPlanId}`,
        {
          method: "GET",
        }
      );

      console.log("✅ 저장된 식단 상세:", response);
      return response;
    } catch (error: any) {
      console.error("❌ 저장된 식단 상세 조회 실패:", error);
      throw new Error(
        error.message || "식단 상세 정보를 불러오는데 실패했습니다."
      );
    }
  },

  /**
   * 저장된 식단 삭제
   */
  deleteMealPlan: async (
    mealPlanId: number
  ): Promise<{ success: boolean; message: string }> => {
    try {
      console.log("🗑️ 식단 삭제 요청:", mealPlanId);

      const response = await request(`/api/recommended-meals/${mealPlanId}`, {
        method: "DELETE",
      });

      console.log("✅ 식단 삭제 성공:", response);
      return {
        success: true,
        message: response.message || "식단이 삭제되었습니다.",
      };
    } catch (error: any) {
      console.error("❌ 식단 삭제 실패:", error);
      throw new Error(error.message || "식단 삭제에 실패했습니다.");
    }
  },
};
