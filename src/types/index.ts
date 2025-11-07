// 공통 타입 정의
export interface User {
  id: string;
  email: string;
  name: string;
  phone?: string;
  birthDate?: string;
}

export interface Food {
  id: number;
  name: string;
  calories: number;
  carbs: number;
  protein: number;
  fat: number;
  weight?: number;
  recordCount?: string;
}

export interface Meal {
  id: string;
  date: string;
  type: 'breakfast' | 'lunch' | 'dinner' | 'snack';
  foods: Food[];
  totalCalories: number;
  totalCarbs: number;
  totalProtein: number;
  totalFat: number;
}

export interface Exercise {
  id: string;
  name: string;
  icon?: string;
  detail?: string;
  calories?: number;
  duration?: number;
}

export interface Routine {
  id: number;
  date: string;
  level?: string;
  weakParts?: string[];
  targetParts?: string[];
  routine?: any[][];
}

export interface MealPlan {
  id: number;
  date: string;
  meals: any[];
}

export interface DailyMealFood {
  id: number;
  foodName: string;
  servingSize: number;
  calories: number;
  carbs: number;
  protein: number;
  fat: number;
  sodium: number;
  cholesterol: number;
  sugar: number;
  fiber: number;
  imageUrl: string;
  aiConfidenceScore: number;
}

export interface DailyMeal {
  id: number;
  mealDate: string;
  mealType: 'BREAKFAST' | 'LUNCH' | 'DINNER' | 'SNACK';
  mealTypeName: string;
  totalCalories: number;
  totalCarbs: number;
  totalProtein: number;
  totalFat: number;
  foods: DailyMealFood[];
  memo?: string;
  createdAt: string;
}

export interface DailyMealsResponse {
  date: string;
  meals: DailyMeal[];
  dailyTotalCalories: number;
  dailyTotalCarbs: number;
  dailyTotalProtein: number;
  dailyTotalFat: number;
}

// 식사 추가 요청 타입
export interface AddMealFoodRequest {
  foodName: string;
  servingSize: number;
  calories: number;
  carbs: number;
  protein: number;
  fat: number;
  sodium?: number;
  cholesterol?: number;
  sugar?: number;
  fiber?: number;
  imageUrl?: string;
  aiConfidenceScore?: number;
}

export interface AddMealRequest {
  mealDate: string; // yyyy-MM-dd 형식
  mealType: 'BREAKFAST' | 'LUNCH' | 'DINNER' | 'SNACK';
  foods: AddMealFoodRequest[];
  memo?: string;
}

export interface AddMealResponse {
  success: boolean;
  message: string;
  meal: DailyMeal;
}

