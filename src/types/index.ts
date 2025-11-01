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

