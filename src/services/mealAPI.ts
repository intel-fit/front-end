import { request } from './apiConfig';
import type { DailyMealsResponse, AddMealRequest, AddMealResponse } from '../types';

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
};
