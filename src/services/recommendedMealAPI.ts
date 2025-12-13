// src/services/recommendedMealAPI.ts
import { request } from "./apiConfig";

const formatDateToString = (date: Date): string => {
  const year = date.getFullYear();
  const month = String(date.getMonth() + 1).padStart(2, "0");
  const day = String(date.getDate()).padStart(2, "0");
  return `${year}-${month}-${day}`;
};
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

      console.log("✅ 임시 식단 조회 완료:", response.length, "일");
      return response;
    } catch (error: any) {
      console.error("❌ 임시 식단 생성/조회 실패:", error);
      
      // 500 에러인 경우 더 명확한 메시지 제공
      if (error.status === 500) {
        throw new Error("서버에 일시적인 문제가 발생했습니다. 잠시 후 다시 시도해주세요.");
      }
      
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
   * ✅ 4) 번들 상세 조회 (DietScreen용 - 평탄화)
   */
  getSavedMealPlansByBundle: async (bundleId: string) => {
    try {
      console.log("🔍 번들 상세 조회 (DietScreen용):", bundleId);

      const response = await request<Array<MealPlan>>(
        `/api/recommended-meals/bundles/${bundleId}`,
        {
          method: "GET",
        }
      );

      console.log("✅ 서버 응답:", response.length, "개 플랜");

      // ✅ 첫 번째 플랜의 날짜를 기준 날짜로 사용
      const baseDateStr =
        response[0]?.planDate || formatDateToString(new Date());
      const baseDate = new Date(baseDateStr);

      console.log("📅 기준 날짜:", baseDateStr);

      // ✅ DietScreen이 기대하는 형식으로 변환
      const flattenedMeals: any[] = [];

      response.forEach((plan) => {
        // ✅ bundleDay를 사용하여 실제 날짜 계산
        const actualDate = new Date(baseDate);
        actualDate.setDate(baseDate.getDate() + (plan.bundleDay - 1));
        const actualDateStr = formatDateToString(actualDate);

        console.log(`📆 ${plan.bundleDay}일차 → ${actualDateStr}`);

        // ✅ SNACK을 BREAKFAST/LUNCH/DINNER로 변환
        const meals = plan.meals || [];
        const breakfast = meals.find((m: any) => m.mealType === "BREAKFAST");
        const lunch = meals.find((m: any) => m.mealType === "LUNCH");
        const dinner = meals.find((m: any) => m.mealType === "DINNER");

        // BREAKFAST, LUNCH, DINNER가 없고 SNACK만 있는 경우 변환
        if (!breakfast && !lunch && !dinner) {
          const snacks = meals.filter((m: any) => m.mealType === "SNACK");
          
          if (snacks.length >= 1) {
            flattenedMeals.push({
              ...snacks[0],
              id: snacks[0].id,
              planId: plan.id,
              planName: plan.planName,
              bundleId: plan.bundleId,
              bundleDay: plan.bundleDay,
              mealType: "BREAKFAST",
              mealTypeName: "아침",
              targetDate: actualDateStr,
              originalPlanDate: plan.planDate,
              createdAt: plan.createdAt,
            });
          }
          if (snacks.length >= 2) {
            flattenedMeals.push({
              ...snacks[1],
              id: snacks[1].id,
              planId: plan.id,
              planName: plan.planName,
              bundleId: plan.bundleId,
              bundleDay: plan.bundleDay,
              mealType: "LUNCH",
              mealTypeName: "점심",
              targetDate: actualDateStr,
              originalPlanDate: plan.planDate,
              createdAt: plan.createdAt,
            });
          }
          if (snacks.length >= 3) {
            flattenedMeals.push({
              ...snacks[2],
              id: snacks[2].id,
              planId: plan.id,
              planName: plan.planName,
              bundleId: plan.bundleId,
              bundleDay: plan.bundleDay,
              mealType: "DINNER",
              mealTypeName: "저녁",
              targetDate: actualDateStr,
              originalPlanDate: plan.planDate,
              createdAt: plan.createdAt,
            });
          }
        } else {
          // BREAKFAST, LUNCH, DINNER가 있는 경우 그대로 사용
          plan.meals.forEach((meal: any) => {
            flattenedMeals.push({
              id: meal.id,
              planId: plan.id,
              planName: plan.planName,
              bundleId: plan.bundleId,
              bundleDay: plan.bundleDay,
              mealType: meal.mealType,
              mealTypeName: meal.mealTypeName,
              totalCalories: meal.totalCalories,
              totalCarbs: meal.totalCarbs,
              totalProtein: meal.totalProtein,
              totalFat: meal.totalFat,
              foods: meal.foods,
              targetDate: actualDateStr,
              originalPlanDate: plan.planDate,
              createdAt: plan.createdAt,
            });
          });
        }
      });

      console.log("✅ 평탄화 완료:", flattenedMeals.length, "개 끼니");

      // ✅ 날짜별 분포 로그
      const dateDistribution = flattenedMeals.reduce((acc, meal) => {
        acc[meal.targetDate] = (acc[meal.targetDate] || 0) + 1;
        return acc;
      }, {} as Record<string, number>);

      console.log("📊 날짜별 분포:", dateDistribution);

      return flattenedMeals;
    } catch (error: any) {
      console.error("❌ 번들 상세 조회 실패:", error);
      throw new Error(error.message || "번들 상세 조회에 실패했습니다.");
    }
  },

  /**
   * 4-1) 번들 상세 조회 (원본 구조)
   */
  getBundleDetail: async (bundleId: string) => {
    try {
      console.log("🔍 번들 상세 조회 (원본):", bundleId);

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
