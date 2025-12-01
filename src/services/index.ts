/**
 * 모든 API를 한 곳에서 export
 * 사용 예시:
 * import { authAPI, mealAPI, exerciseAPI } from '../services';
 */
export { authAPI } from "./authAPI";
export { mealAPI } from "./mealAPI";
export { homeAPI } from "./homeAPI";
export { request as apiRequest } from "./apiConfig";
export type { ApiResponse } from "./apiConfig";
export { chatAPI } from "./chatAPI";
export { recommendedMealAPI } from "./recommendedMealAPI";
export { recommendedExerciseAPI } from "./recommendedExerciseAPI";
export { userPreferencesAPI } from "./userPreferencesAPI";
export type {
  TempDayMeal,
  MealPlan,
  SavedMealPlanSummary,
} from "./recommendedMealAPI";
export { healthScoreAPI } from "./healthScoreAPI";
export type { ScoreTrendItem } from "./healthScoreAPI";

// 향후 추가될 API들
// export {exerciseAPI} from './exerciseAPI';
// export {profileAPI} from './profileAPI';
// export {inbodyAPI} from './inbodyAPI';
