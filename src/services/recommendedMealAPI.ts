// src/services/recommendedMealAPI.ts
import { request } from "./apiConfig";

/**
 * ===========================
 * 식단 추천 API
 * ===========================
 */
export const recommendedMealAPI = {
  /**
   * 1) 주간 식단 추천 생성 (7일)
   * POST /api/recommended-meals/week
   */
  getWeeklyMealPlan: async (startDate?: string) => {
    try {
      const start = startDate || new Date().toISOString().split("T")[0];

      const response = await request<Array<MealPlan>>(
        `/api/recommended-meals/week?start=${start}`,
        {
          method: "POST",
        }
      );

      console.log("✅ 주간 식단 생성 완료:", response.length);
      return response;
    } catch (error: any) {
      console.error("❌ 주간 식단 생성 실패:", error);
      throw new Error(error.message || "식단 생성에 실패했습니다.");
    }
  },

  /**
   * 2) 식단 저장
   * POST /api/recommended-meals/{id}/save
   */
  saveMealPlan: async (planId: number) => {
    try {
      return await request<SimpleResponse>(
        `/api/recommended-meals/${planId}/save`,
        { method: "POST" }
      );
    } catch (error: any) {
      console.error("❌ 식단 저장 실패:", error);
      throw new Error(error.message || "식단 저장 실패");
    }
  },

  /**
   * 3) 저장된 식단 목록 조회 (번들 단위)
   * GET /api/recommended-meals/saved
   */
  getSavedMealPlans: async () => {
    try {
      const res = await request<{
        totalCount: number;
        plans: SavedMealPlanSummary[];
      }>(`/api/recommended-meals/saved`);

      return res.plans || [];
    } catch (error: any) {
      console.error("❌ 저장된 식단 조회 실패:", error);
      return [];
    }
  },

  /**
   * 4) 번들 상세 조회 (7일)
   * GET /api/recommended-meals/bundles/{bundleId}
   */
  getBundleDetail: async (bundleId: string) => {
    try {
      const response = await request<Array<MealPlan>>(
        `/api/recommended-meals/bundles/${bundleId}`
      );
      return response;
    } catch (error: any) {
      console.error("❌ 번들 상세 불러오기 실패:", error);
      throw new Error(error.message || "번들 상세 조회 실패");
    }
  },

  /**
   * 5) 단일 식단 삭제
   * DELETE /api/recommended-meals/{id}
   */
  deleteMealPlan: async (planId: number) => {
    try {
      return await request<SimpleResponse>(`/api/recommended-meals/${planId}`, {
        method: "DELETE",
      });
    } catch (error: any) {
      console.error("❌ 식단 삭제 실패:", error);
      throw new Error(error.message || "식단 삭제 실패");
    }
  },

  /**
   * 6) 번들 삭제 (7일치 전체)
   * DELETE /api/recommended-meals/bundles/{bundleId}/delete
   */
  deleteBundle: async (bundleId: string) => {
    try {
      return await request<BundleDeleteResponse>(
        `/api/recommended-meals/bundles/${bundleId}/delete`,
        { method: "DELETE" }
      );
    } catch (error: any) {
      console.error("❌ 번들 삭제 실패:", error);
      throw new Error(error.message || "번들 삭제 실패");
    }
  },

  /**
   * 7) 일괄 삭제
   * DELETE /api/recommended-meals/bundles/bulk-delete
   */
  deleteBulk: async (bundleIds: string[]) => {
    try {
      return await request<BulkDeleteResponse>(
        `/api/recommended-meals/bundles/bulk-delete`,
        {
          method: "DELETE",
          body: JSON.stringify({ bundleIds }),
        }
      );
    } catch (error: any) {
      console.error("❌ 일괄 삭제 실패:", error);
      throw new Error(error.message || "일괄 삭제 실패");
    }
  },

  /**
   * 8) 특정 날짜의 식단 조회
   * GET /api/recommended-meals/date/{date}
   */
  getMealPlanByDate: async (date: string) => {
    try {
      return await request<MealPlan>(`/api/recommended-meals/date/${date}`);
    } catch (error: any) {
      console.error("❌ 날짜별 식단 조회 실패:", error);
      throw new Error(error.message || "식단 조회에 실패했습니다.");
    }
  },

  /**
   * 9) 식단 수정
   * PUT /api/recommended-meals/{id}
   */
  updateMealPlan: async (planId: number, updateData: UpdateMealPlanReq) => {
    try {
      return await request<{
        success: boolean;
        message: string;
        updatedPlan: MealPlan;
      }>(`/api/recommended-meals/${planId}`, {
        method: "PUT",
        body: JSON.stringify(updateData),
      });
    } catch (error: any) {
      console.error("❌ 식단 수정 실패:", error);
      throw new Error(error.message || "식단 수정에 실패했습니다.");
    }
  },
};

/**
 * ===========================
 * 타입 정의
 * ===========================
 */

export interface Food {
  id: number;
  foodName: string;
  servingSize: number;
  calories: number;
  carbs: number;
  protein: number;
  fat: number;
  sodium: number | null;
  sugar: number | null;
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
  recommendationReason: string;
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

export interface UpdateMealPlanReq {
  planName?: string;
  description?: string;
  meals?: Array<{
    mealType: string;
    foods: Array<{
      foodId: number;
      servingSize: number;
    }>;
  }>;
}

export interface SimpleResponse {
  success: boolean;
  message: string;
}

export interface BundleDeleteResponse {
  success: boolean;
  message: string;
  bundleId: string;
  deletedCount: number;
}

export interface BulkDeleteResponse {
  success: boolean;
  message: string;
  deletedCount: number;
}
