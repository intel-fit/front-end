import { request } from './apiConfig';
import type { 
  DailyMealsResponse, 
  AddMealRequest, 
  AddMealResponse,
  NutritionGoal,
  SetNutritionGoalRequest,
  SetNutritionGoalResponse,
} from '../types';

export const mealAPI = {
  //일별 식단 조회
  getDailyMeals: async (date: string): Promise<DailyMealsResponse> => {
    return request<DailyMealsResponse>(`/api/meals/daily?date=${date}`, {
      method: 'GET',
    });
  },

  //식사 추가
  addMeal: async (mealData: AddMealRequest): Promise<AddMealResponse> => {
    return request<AddMealResponse>('/api/meals', {
      method: 'POST',
      body: JSON.stringify(mealData),
    });
  },

  //영양 목표 조회
  getNutritionGoal: async (): Promise<NutritionGoal> => {
    return request<NutritionGoal>('/api/nutrition-goals', {
      method: 'GET',
    });
  },

  //영양 목표 설정
  setNutritionGoal: async (goalData: SetNutritionGoalRequest): Promise<SetNutritionGoalResponse> => {
    return request<SetNutritionGoalResponse>('/api/nutrition-goals', {
      method: 'POST',
      body: JSON.stringify(goalData),
    });
  },
};
