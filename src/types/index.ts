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

// 음식 검색 API 응답 타입
export interface SearchFoodResponse {
  id: number;
  name: string;
  calories: number;
  carbs: number;
  protein: number;
  fat: number;
  fiber: number;
  sugar: number;
  sodium: number;
  weight: number;
  glycemic_index: number;
  processing_level: number;
  company: string;
}

// 직접 음식 입력 API 요청 타입
export interface AddManualFoodRequest {
  name: string;
  weight: number;
  calories: number;
  carbs: number;
  protein: number;
  fat: number;
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
  mealType: 'BREAKFAST' | 'LUNCH' | 'DINNER' | 'SNACK' | 'OTHER';
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
  mealType: 'BREAKFAST' | 'LUNCH' | 'DINNER' | 'SNACK' | 'OTHER';
  foods: AddMealFoodRequest[];
  memo?: string;
}

export interface AddMealResponse {
  success: boolean;
  message: string;
  meal: DailyMeal;
}

// 일일 운동 진행률 타입
export interface DailyProgressWeekItem {
  date: string; // yyyy-MM-dd 형식
  exerciseRate: number; // 운동 달성률 (0~100)
  totalCalorie: number; // 총 칼로리
}

// 영양 목표 타입
export interface NutritionGoal {
  id: number;
  targetCalories: number;
  targetCarbs: number;
  targetProtein: number;
  targetFat: number;
  goalType: string;
  goalTypeDescription: string;
}

// 영양 목표 설정 요청 타입
export interface SetNutritionGoalRequest {
  targetCalories: number;
  targetCarbs: number;
  targetProtein: number;
  targetFat: number;
  goalType?: 'AUTO' | 'MANUAL';
}

// 영양 목표 설정 응답 타입
export interface SetNutritionGoalResponse {
  success: boolean;
  message?: string;
  goal?: NutritionGoal;
  data?: NutritionGoal;
}

