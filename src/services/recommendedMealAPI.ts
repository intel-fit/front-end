// src/services/recommendedMealAPI.ts
import { request } from "./apiConfig";

/**
 * 식단 추천 API (임시 식단 기반)
 */
export const recommendedMealAPI = {
  /**
   * ✅ 1) 임시 식단 생성 + 조회 (7일치)
   */
  getWeeklyMealPlan: async () => {
    try {
      console.log("🍽️ 임시 식단 생성 시작");

      // Step 1: 임시 식단 생성
      const createResponse = await request<{ tempBundleId: string }>(
        "/api/temp-meals/weekly",
        { method: "POST" }
      );

      console.log("✅ 임시 식단 생성 완료:", createResponse);

      // Step 2: 임시 식단 조회
      const response = await request<Array<TempDayMeal>>(
        "/api/temp-meals/weekly",
        { method: "GET" }
      );

      // ✅ 원본 응답 상세 로그
      console.log("=== 🔍 GET /api/temp-meals/weekly 응답 ===");
      console.log("응답 타입:", typeof response);
      console.log("응답 길이:", response.length);
      console.log("응답 전체:", JSON.stringify(response, null, 2));

      // ✅ 각 day 검증
      response.forEach((day, idx) => {
        console.log(`\nDay ${idx + 1} 검증:`);
        console.log("- dayIndex:", day.dayIndex);
        console.log("- meals 존재:", !!day.meals);
        console.log(
          "- meals 타입:",
          Array.isArray(day.meals) ? "배열" : typeof day.meals
        );
        console.log("- meals 길이:", day.meals?.length || 0);

        if (day.meals && day.meals.length === 0) {
          console.warn(`⚠️ ${idx + 1}일차 meals가 빈 배열입니다!`);
        }
      });

      console.log(`✅ 임시 식단 조회 완료: ${response.length}일`);
      return response;
    } catch (error: any) {
      console.error("❌ 임시 식단 생성/조회 실패:", error);
      throw new Error(error.message || "식단 생성에 실패했습니다.");
    }
  },

  /**
   * ✅ 2) 임시 식단 저장 (DB에 확정)
   */
  saveTempMealPlan: async () => {
    try {
      console.log("💾 임시 식단 commit 요청");

      const response = await request<{ message: string }>(
        "/api/temp-meals/weekly/commit",
        {
          method: "POST",
        }
      );

      console.log("✅ 임시 식단 저장 완료:", response.message);
      return {
        success: true,
        message: response.message || "식단이 저장되었습니다.",
      };
    } catch (error: any) {
      console.error("❌ 임시 식단 저장 실패:", error);
      throw new Error(error.message || "식단 저장에 실패했습니다.");
    }
  },

  /**
   * 3) 저장된 식단 목록 조회 (번들 단위)
   */
  getSavedMealPlans: async () => {
    try {
      console.log("📋 저장된 식단 목록 조회");

      const response = await request<{
        totalCount: number;
        plans: SavedMealPlanSummary[];
      }>("/api/recommended-meals/saved", {
        method: "GET",
      });

      console.log("✅ 저장된 식단:", response.totalCount, "개");
      return response.plans || [];
    } catch (error: any) {
      console.error("❌ 저장된 식단 조회 실패:", error);
      return [];
    }
  },

  /**
   * 4) 번들 상세 조회 (7일치)
   */
  getBundleDetail: async (bundleId: string) => {
    try {
      console.log("🔍 번들 상세 조회:", bundleId);

      const response = await request<Array<MealPlan>>(
        `/api/recommended-meals/bundles/${bundleId}`,
        {
          method: "GET",
        }
      );

      console.log("✅ 번들 상세:", response.length, "일");
      return response;
    } catch (error: any) {
      console.error("❌ 번들 상세 조회 실패:", error);
      throw new Error(error.message || "번들 상세 조회에 실패했습니다.");
    }
  },

  /**
   * 5) 단일 식단 삭제
   */
  deleteMealPlan: async (planId: number) => {
    try {
      console.log("🗑️ 식단 삭제:", planId);

      const response = await request<{
        success: boolean;
        message: string;
      }>(`/api/recommended-meals/${planId}`, {
        method: "DELETE",
      });

      console.log("✅ 식단 삭제 완료");
      return response;
    } catch (error: any) {
      console.error("❌ 식단 삭제 실패:", error);
      throw new Error(error.message || "식단 삭제에 실패했습니다.");
    }
  },

  /**
   * 6) 번들 삭제 (7일치 전체)
   */
  deleteBundle: async (bundleId: string) => {
    try {
      console.log("🗑️ 번들 삭제:", bundleId);

      const response = await request<{
        success: boolean;
        message: string;
      }>(`/api/recommended-meals/bundles/${bundleId}`, {
        method: "DELETE",
      });

      console.log("✅ 번들 삭제 완료");
      return response;
    } catch (error: any) {
      console.error("❌ 번들 삭제 실패:", error);
      throw new Error(error.message || "번들 삭제에 실패했습니다.");
    }
  },

  /**
   * 7) 일괄 삭제
   */
  deleteBulk: async (bundleIds: string[]) => {
    try {
      console.log("🗑️ 일괄 삭제:", bundleIds.length, "개");

      const response = await request<{
        success: boolean;
        message: string;
        deletedCount: number;
      }>("/api/recommended-meals/bundles/bulk-delete", {
        method: "DELETE",
        body: JSON.stringify({ bundleIds }),
      });

      console.log("✅ 일괄 삭제 완료:", response.deletedCount, "개");
      return response;
    } catch (error: any) {
      console.error("❌ 일괄 삭제 실패:", error);
      throw new Error(error.message || "일괄 삭제에 실패했습니다.");
    }
  },
};

/**
 * 타입 정의
 */
export interface TempDayMeal {
  dayIndex: number;
  meals: Array<{
    id: number;
    mealType: "BREAKFAST" | "LUNCH" | "DINNER";
    totalCalories: number;
    totalCarbs: number;
    totalProtein: number;
    totalFat: number;
    foods: Array<{
      id: number;
      foodName: string;
      servingSize: number;
      calories: number;
      carbs: number;
      protein: number;
      fat: number;
    }>;
  }>;
}

export interface Food {
  id: number;
  foodName: string;
  servingSize: number;
  calories: number;
  carbs: number;
  protein: number;
  fat: number;
  sodium?: number | null;
  sugar?: number | null;
}

export interface Meal {
  id: number;
  mealType: "BREAKFAST" | "LUNCH" | "DINNER";
  mealTypeName: string;
  totalCalories: number;
  totalCarbs: number;
  totalProtein: number;
  totalFat: number;
  foods: Food[];
}

export interface MealPlan {
  id: number;
  planName: string;
  description: string;
  totalCalories: number;
  totalCarbs: number;
  totalProtein: number;
  totalFat: number;
  recommendationReason: string | null;
  isSaved: boolean;
  meals: Meal[];
  createdAt: string;
  bundleId: string;
  bundleDay: number;
  planDate: string;
}

export interface SavedMealPlanSummary {
  id: number;
  planName: string;
  totalCalories: number;
  mealCount: number;
  isSaved: boolean;
  createdAt: string;
  bundleId: string;
  bundleDay: number;
  planDate: string;
}
