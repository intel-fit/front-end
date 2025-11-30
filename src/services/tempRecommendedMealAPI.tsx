import AsyncStorage from "@react-native-async-storage/async-storage";
import { AI_API_BASE_URL } from "./apiConfig";
import { authAPI } from "./authAPI";

// ✅ 새로운 응답 구조에 맞게 타입 수정
export interface TempFoodItem {
  food_name: string;
  serving_size_g: number;
  ps_energy_kcal: number;
  ps_protein_g: number;
  ps_fat_g: number;
  ps_carb_g: number;
  ml_health_score?: number;
  health_score?: number;
  is_flexible?: number;
  serving_min_g?: number;
  serving_max_g?: number;
  _role?: string;
  _carb_source?: string;
  _protein_source?: string;
  multiplier?: number;
}

export interface TempMealItem {
  meal_number: number; // 1, 2, 3
  targets: {
    kcal: number;
    protein_g: number;
    fat_g: number;
    carb_g: number;
  };
  actuals: {
    kcal: number;
    protein_g: number;
    fat_g: number;
    carb_g: number;
  };
  items: TempFoodItem[];
  fallback?: boolean;
}

export interface TempDailyPlanResponse {
  user_id: string;
  meals_per_day: number;
  goal: string;
  daily_plan: {
    meals: TempMealItem[];
    target_daily: {
      kcal: number;
      protein_g: number;
      fat_g: number;
      carb_g: number;
    };
    actual_daily: {
      kcal: number;
      protein_g: number;
      fat_g: number;
      carb_g: number;
    };
  };
}

/**
 * 일일 식단 생성 API
 * GET /ai-plan/generate_daily_plan
 */
export const generateDailyMealPlan = async (
  mealsPerDay: number = 3
): Promise<TempDailyPlanResponse> => {
  try {
    const profile = await authAPI.getProfile();
    const userId = profile.userId;

    if (!userId) {
      throw new Error("사용자 ID를 찾을 수 없습니다. 다시 로그인해주세요.");
    }

    const url = `${AI_API_BASE_URL}/ai-plan/generate_daily_plan?user_id=${userId}&meals_per_day=${mealsPerDay}`;

    console.log("🤖 [TempAPI] 일일 식단 생성 요청:", url);

    const response = await fetch(url, {
      method: "GET",
      headers: {
        "Content-Type": "application/json",
      },
    });

    if (!response.ok) {
      if (response.status === 404) {
        throw new Error("사용자를 찾을 수 없습니다.");
      }
      throw new Error(`API 요청 실패: ${response.status}`);
    }

    const data: TempDailyPlanResponse = await response.json();

    console.log("✅ [TempAPI] 식단 생성 성공");

    return data;
  } catch (error) {
    console.error("❌ [TempAPI] 식단 생성 실패:", error);
    throw error;
  }
};

/**
 * 비선호 식재료를 포함한 일일 식단 생성
 * (비선호 식재료는 프론트엔드에서 필터링)
 */
export const generateDailyMealPlanWithExclusions = async (
  mealsPerDay: number = 3,
  excludedFoods: string[] = []
): Promise<TempDailyPlanResponse> => {
  try {
    const data = await generateDailyMealPlan(mealsPerDay);

    // 비선호 식재료 필터링
    if (excludedFoods.length > 0) {
      console.log("🚫 [TempAPI] 비선호 식재료 필터링:", excludedFoods);

      data.daily_plan.meals = data.daily_plan.meals.map((meal) => ({
        ...meal,
        items: meal.items.filter((food) => {
          const isExcluded = excludedFoods.some((excluded) =>
            food.food_name.toLowerCase().includes(excluded.toLowerCase())
          );
          return !isExcluded;
        }),
      }));
    }

    return data;
  } catch (error) {
    console.error("❌ [TempAPI] 비선호 식재료 필터링 실패:", error);
    throw error;
  }
};

/**
 * 생성된 식단을 임시 저장 (AsyncStorage)
 */
export const saveTempMealPlan = async (
  mealPlan: TempDailyPlanResponse
): Promise<void> => {
  try {
    const today = new Date().toISOString().split("T")[0];
    const storageKey = `temp_meal_plan_${today}`;

    await AsyncStorage.setItem(storageKey, JSON.stringify(mealPlan));

    console.log("✅ [TempAPI] 식단 임시 저장 완료:", storageKey);
  } catch (error) {
    console.error("❌ [TempAPI] 식단 저장 실패:", error);
    throw error;
  }
};

/**
 * 저장된 임시 식단 불러오기
 */
export const loadTempMealPlan = async (
  date?: string
): Promise<TempDailyPlanResponse | null> => {
  try {
    const targetDate = date || new Date().toISOString().split("T")[0];
    const storageKey = `temp_meal_plan_${targetDate}`;

    const stored = await AsyncStorage.getItem(storageKey);

    if (!stored) {
      console.log("ℹ️ [TempAPI] 저장된 식단 없음:", targetDate);
      return null;
    }

    const data: TempDailyPlanResponse = JSON.parse(stored);
    console.log("✅ [TempAPI] 식단 불러오기 성공:", targetDate);

    return data;
  } catch (error) {
    console.error("❌ [TempAPI] 식단 불러오기 실패:", error);
    return null;
  }
};

/**
 * 임시 저장된 식단 삭제
 */
export const deleteTempMealPlan = async (date?: string): Promise<void> => {
  try {
    const targetDate = date || new Date().toISOString().split("T")[0];
    const storageKey = `temp_meal_plan_${targetDate}`;

    await AsyncStorage.removeItem(storageKey);
    console.log("✅ [TempAPI] 식단 삭제 완료:", targetDate);
  } catch (error) {
    console.error("❌ [TempAPI] 식단 삭제 실패:", error);
    throw error;
  }
};

export const tempRecommendedMealAPI = {
  generateDailyMealPlan,
  generateDailyMealPlanWithExclusions,
  saveTempMealPlan,
  loadTempMealPlan,
  deleteTempMealPlan,
};

export default tempRecommendedMealAPI;
