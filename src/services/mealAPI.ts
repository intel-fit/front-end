import { request, AI_API_BASE_URL, ACCESS_TOKEN_KEY } from './apiConfig';
import AsyncStorage from '@react-native-async-storage/async-storage';
import * as ImageManipulator from 'expo-image-manipulator';
import type { 
  DailyMealsResponse, 
  AddMealRequest, 
  AddMealResponse,
  NutritionGoal,
  SetNutritionGoalRequest,
  SetNutritionGoalResponse,
  SearchFoodResponse,
  AddManualFoodRequest,
} from '../types';

/**
 * userId 가져오기 (AsyncStorage 또는 JWT에서)
 * 실제 사용자 ID 문자열 (예: "aaaa")을 반환
 */
const getUserId = async (): Promise<string> => {
  // JWT 토큰에서 먼저 확인 (가장 최신 정보)
  const token = await AsyncStorage.getItem(ACCESS_TOKEN_KEY);
  if (token) {
    try {
      const base64Url = token.split('.')[1];
      const base64 = base64Url.replace(/-/g, '+').replace(/_/g, '/');
      const jsonPayload = decodeURIComponent(
        atob(base64)
          .split('')
          .map((c) => '%' + ('00' + c.charCodeAt(0).toString(16)).slice(-2))
          .join('')
      );
      const payload = JSON.parse(jsonPayload);
      console.log('🔍 JWT Payload:', payload);
      
      // sub 필드가 있으면 우선 사용 (실제 사용자 ID 문자열, 예: "aaaa")
      if (payload.sub) {
        const userId = String(payload.sub); // 문자열로 변환
        console.log('✅ JWT에서 sub 추출:', userId);
        await AsyncStorage.setItem('userId', userId);
        return userId;
      }
      
      // sub가 없으면 다른 필드 확인
      if (payload.userId) {
        const userId = String(payload.userId);
        console.log('✅ JWT에서 userId 추출:', userId);
        await AsyncStorage.setItem('userId', userId);
        return userId;
      }
      
      // userPk는 숫자일 수 있으므로 마지막 옵션
      if (payload.userPk) {
        const userId = String(payload.userPk);
        console.log('⚠️ JWT에서 userPk 추출 (숫자):', userId);
        await AsyncStorage.setItem('userId', userId);
        return userId;
      }
    } catch (e) {
      console.error('❌ JWT 디코딩 실패:', e);
    }
  }
  
  // JWT에서 추출 실패 시 AsyncStorage에서 확인
  let userId = await AsyncStorage.getItem('userId');
  if (userId) {
    console.log('✅ AsyncStorage에서 userId 가져옴:', userId);
    return userId;
  }
  
  // 모두 실패한 경우
  console.error('❌ 사용자 ID를 찾을 수 없습니다.');
  throw new Error('사용자 ID를 찾을 수 없습니다. 다시 로그인해주세요.');
};

export const mealAPI = {
  /**
   * 일별 식단 조회
   * AI 서버의 /food/get_meals API 사용
   * GET /food/get_meals?user_id={user_id}&date={date}
   * 
   * 응답: [{ meal_id, meal_name, time_taken, items: [...] }] (200 OK)
   * 에러: 422 Validation Error (user_id 또는 date 파라미터 누락/잘못됨)
   */
  getDailyMeals: async (date: string): Promise<DailyMealsResponse> => {
    const user_id = await getUserId();
    
    // 날짜 형식 검증
    if (!date || !/^\d{4}-\d{2}-\d{2}$/.test(date)) {
      throw new Error('날짜 형식이 올바르지 않습니다. yyyy-MM-dd 형식을 사용해주세요.');
    }
    
    // JWT 토큰 가져오기
    const token = await AsyncStorage.getItem(ACCESS_TOKEN_KEY);
    const headers: HeadersInit = {
      'accept': 'application/json',
    };
    
    if (token) {
      headers['Authorization'] = `Bearer ${token}`;
    }
    
    const url = `${AI_API_BASE_URL}/food/get_meals?user_id=${encodeURIComponent(user_id)}&date=${encodeURIComponent(date)}`;
    console.log(`📡 일별 식단 조회 요청: ${url}`);
    
    const response = await fetch(url, {
      method: 'GET',
      headers,
    });
    
    if (!response.ok) {
      let errorMessage = `HTTP error! status: ${response.status}`;
      
      // 422 Validation Error 처리
      if (response.status === 422) {
        try {
          const errorData = await response.json();
          if (errorData.detail && Array.isArray(errorData.detail)) {
            const errorMessages = errorData.detail.map((err: any) => {
              const field = err.loc && Array.isArray(err.loc)
                ? err.loc.filter((loc: any) => typeof loc === 'string').join('.')
                : 'unknown';
              return `${field}: ${err.msg || '검증 오류'}`;
            });
            errorMessage = errorMessages.join(', ');
          } else if (errorData.detail && typeof errorData.detail === 'string') {
            errorMessage = errorData.detail;
          } else if (errorData.message) {
            errorMessage = errorData.message;
          }
        } catch (parseError) {
          const errorText = await response.text();
          console.error(`❌ 일별 식단 조회 422 에러 응답:`, errorText);
          errorMessage = '요청 파라미터가 올바르지 않습니다. user_id와 date를 확인해주세요.';
        }
      } else {
        // 다른 에러 처리
        try {
          const errorText = await response.text();
          console.error(`❌ 일별 식단 조회 에러 응답:`, errorText);
          const errorData = JSON.parse(errorText);
          errorMessage = errorData.message || errorData.detail || errorMessage;
        } catch (e) {
          const errorText = await response.text();
          if (errorText) {
            errorMessage = errorText;
          }
        }
      }
      
      throw new Error(errorMessage);
    }
    
    const meals = await response.json();
    console.log(`✅ 일별 식단 조회 성공:`, meals.length, '개 식사');
    
    // 빈 배열인 경우 처리
    if (!Array.isArray(meals)) {
      console.warn('일별 식단 조회 응답이 배열이 아닙니다:', meals);
      return {
        date: date,
        meals: [],
        dailyTotalCalories: 0,
        dailyTotalCarbs: 0,
        dailyTotalProtein: 0,
        dailyTotalFat: 0,
      };
    }
    
    // AI 서버 응답을 기존 형식으로 변환
    // meal_name이 표준 식사 타입인지 확인
    const standardMealTypes = ['breakfast', 'lunch', 'dinner', 'snack', 'other'];
    const mealTypeMap: Record<string, string> = {
      'breakfast': 'BREAKFAST',
      'lunch': 'LUNCH',
      'dinner': 'DINNER',
      'snack': 'SNACK',
      'other': 'OTHER',
    };
    
    // 식사들을 time_taken 기준으로 정렬 (시간순)
    const sortedMeals = [...meals].sort((a: any, b: any) => {
      const timeA = a.time_taken ? new Date(a.time_taken).getTime() : 0;
      const timeB = b.time_taken ? new Date(b.time_taken).getTime() : 0;
      return timeA - timeB; // 오름차순 정렬 (이른 시간부터)
    });
    
    const dailyMeals: DailyMealsResponse = {
      date: date,
      meals: sortedMeals.map((meal: any) => {
        const mealNameLower = meal.meal_name?.toLowerCase() || '';
        const isStandardMealType = standardMealTypes.includes(mealNameLower);
        
        return {
          id: meal.meal_id,
          mealDate: date,
          mealType: isStandardMealType ? (mealTypeMap[mealNameLower] as any) : 'OTHER',
          mealTypeName: isStandardMealType ? meal.meal_name : (meal.meal_name || '기타'),
          memo: isStandardMealType ? undefined : meal.meal_name, // 표준 타입이 아니면 memo로 저장
          totalCalories: meal.items?.reduce((sum: number, item: any) => sum + (item.calories || 0), 0) || 0,
          totalCarbs: meal.items?.reduce((sum: number, item: any) => sum + (item.carbs || 0), 0) || 0,
          totalProtein: meal.items?.reduce((sum: number, item: any) => sum + (item.protein || 0), 0) || 0,
          totalFat: meal.items?.reduce((sum: number, item: any) => sum + (item.fat || 0), 0) || 0,
          foods: meal.items?.map((item: any) => ({
            id: item.food_id || item.id || 0, // food_id 사용 (meal_item_id가 아님)
            food_id: item.food_id || item.id || 0, // food_id 명시적으로 저장
            meal_item_id: item.meal_item_id || item.id || 0, // meal_item_id도 저장 (참고용)
            foodName: item.food_name,
            servingSize: item.quantity_g || 0,
            calories: item.calories || 0,
            carbs: item.carbs || 0,
            protein: item.protein || 0,
            fat: item.fat || 0,
            sodium: 0,
            cholesterol: 0,
            sugar: 0,
            fiber: 0,
            imageUrl: '',
            aiConfidenceScore: 0,
          })) || [],
          createdAt: meal.time_taken || new Date().toISOString(),
        };
      }),
      dailyTotalCalories: meals.reduce((sum: number, meal: any) => 
        sum + (meal.items?.reduce((s: number, item: any) => s + (item.calories || 0), 0) || 0), 0
      ),
      dailyTotalCarbs: meals.reduce((sum: number, meal: any) => 
        sum + (meal.items?.reduce((s: number, item: any) => s + (item.carbs || 0), 0) || 0), 0
      ),
      dailyTotalProtein: meals.reduce((sum: number, meal: any) => 
        sum + (meal.items?.reduce((s: number, item: any) => s + (item.protein || 0), 0) || 0), 0
      ),
      dailyTotalFat: meals.reduce((sum: number, meal: any) => 
        sum + (meal.items?.reduce((s: number, item: any) => s + (item.fat || 0), 0) || 0), 0
      ),
    };
    
    return dailyMeals;
  },

  /**
   * 식사 추가
   * AI 서버의 /food/meal/create_full API 사용
   */
  addMeal: async (mealData: AddMealRequest): Promise<AddMealResponse> => {
    const user_id = await getUserId();
    
    // meal_name 결정: memo가 있으면 memo를 사용, 없으면 mealType 사용
    let mealName: string;
    if (mealData.memo && mealData.memo.trim().length > 0) {
      // memo에 " - "가 포함되어 있으면 추천 식단 형식이므로 끼니 이름만 추출
      if (mealData.memo.includes(' - ')) {
        const parts = mealData.memo.split(' - ');
        const mealTypeName = parts[parts.length - 1]; // 마지막 부분이 끼니 이름 (예: "점심")
        // 끼니 이름을 영어로 변환
        const mealNameMap: Record<string, string> = {
          '아침': 'breakfast',
          '점심': 'lunch',
          '저녁': 'dinner',
          '야식': 'snack',
          '기타': 'other',
        };
        mealName = mealNameMap[mealTypeName] || mealData.mealType.toLowerCase();
      } else {
        // memo가 있지만 추천 식단 형식이 아니면 memo를 그대로 사용
        mealName = mealData.memo.trim();
      }
    } else {
      // 식단 이름이 없으면 mealType을 소문자로 변환하여 사용
      const mealNameMap: Record<string, string> = {
        'BREAKFAST': 'breakfast',
        'LUNCH': 'lunch',
        'DINNER': 'dinner',
        'SNACK': 'snack',
        'OTHER': 'other',
      };
      mealName = mealNameMap[mealData.mealType] || mealData.mealType.toLowerCase();
    }
    
    // JWT 토큰 가져오기
    const token = await AsyncStorage.getItem(ACCESS_TOKEN_KEY);
    const headers: HeadersInit = {
      'accept': 'application/json',
      'Content-Type': 'application/json',
    };
    
    if (token) {
      headers['Authorization'] = `Bearer ${token}`;
    }
    
    // time_taken은 mealData에 있으면 사용, 없으면 현재 시간으로 설정 (ISO 8601 형식)
    const timeTaken = mealData.timeTaken || new Date().toISOString();
    
    // items 배열 구성
    // food_id는 검색(/food/search) 또는 직접 입력(/food/add_manual_food)에서 받은 id를 사용
    const items = mealData.foods.map((food, index) => {
      // food.id 또는 food.food_id가 있으면 사용, 없으면 0 (신규 음식인 경우)
      const foodId = (food as any).id || (food as any).food_id || 0;
      
      const item = {
        food_id: foodId, // 검색 또는 직접 입력에서 받은 음식 ID
        food_name: food.foodName,
        quantity_g: food.servingSize,
        calories: food.calories,
        carbs: food.carbs,
        protein: food.protein,
        fat: food.fat,
      };
      
      console.log(`음식 ${index + 1} (${food.foodName}) - food_id: ${foodId}`);
      
      return item;
    });
    
    const requestBody: any = {
      user_id: user_id,
      date: mealData.mealDate,
      meal_name: mealName,
      time_taken: timeTaken,
      items: items,
    };
    
    console.log(`📡 식사 추가 요청: ${AI_API_BASE_URL}/food/meal/create_full`);
    console.log(`요청 데이터:`, JSON.stringify(requestBody, null, 2));
    
    const response = await fetch(`${AI_API_BASE_URL}/food/meal/create_full`, {
      method: 'POST',
      headers,
      body: JSON.stringify(requestBody),
    });
    
    if (!response.ok) {
      const errorText = await response.text();
      console.error(`❌ 식사 추가 에러 응답:`, errorText);
      throw new Error(`HTTP error! status: ${response.status}`);
    }
    
    const result = await response.json();
    console.log(`✅ 식사 추가 성공:`, result);
    
    // 응답에서 meal_id와 meal_item_id 추출
    const mealId = result.meal_id || result.id || 0;
    const mealItems = result.items || result.foods || [];
    
    // 응답 형식 변환
    return {
      success: true,
      message: '식사가 추가되었습니다.',
      meal: {
        id: mealId,
        mealDate: mealData.mealDate,
        mealType: mealData.mealType,
        mealTypeName: mealData.mealType,
        totalCalories: mealData.foods.reduce((sum, f) => sum + f.calories, 0),
        totalCarbs: mealData.foods.reduce((sum, f) => sum + f.carbs, 0),
        totalProtein: mealData.foods.reduce((sum, f) => sum + f.protein, 0),
        totalFat: mealData.foods.reduce((sum, f) => sum + f.fat, 0),
        foods: mealItems.map((item: any, idx: number) => ({
          id: item.meal_item_id || item.id || idx,
          foodName: item.food_name || mealData.foods[idx]?.foodName || '',
          servingSize: item.quantity_g || mealData.foods[idx]?.servingSize || 0,
          calories: item.calories || mealData.foods[idx]?.calories || 0,
          carbs: item.carbs || mealData.foods[idx]?.carbs || 0,
          protein: item.protein || mealData.foods[idx]?.protein || 0,
          fat: item.fat || mealData.foods[idx]?.fat || 0,
          sodium: mealData.foods[idx]?.sodium || 0,
          cholesterol: mealData.foods[idx]?.cholesterol || 0,
          sugar: mealData.foods[idx]?.sugar || 0,
          fiber: mealData.foods[idx]?.fiber || 0,
          imageUrl: mealData.foods[idx]?.imageUrl || '',
          aiConfidenceScore: mealData.foods[idx]?.aiConfidenceScore || 0,
        })),
        createdAt: result.time_taken || timeTaken,
      },
    };
  },

  /**
   * 식사 삭제
   * AI 서버의 /food/delete_meal API 사용
   */
  deleteMeal: async (mealId: number): Promise<{success: boolean; message: string}> => {
    const user_id = await getUserId();
    
    const token = await AsyncStorage.getItem(ACCESS_TOKEN_KEY);
    const headers: HeadersInit = {
      'accept': 'application/json',
    };
    
    if (token) {
      headers['Authorization'] = `Bearer ${token}`;
    }
    
    const url = `${AI_API_BASE_URL}/food/delete_meal?meal_id=${mealId}&user_id=${encodeURIComponent(user_id)}`;
    console.log(`📡 식사 삭제 요청: ${url}`);
    
    const response = await fetch(url, {
      method: 'DELETE',
      headers,
    });
    
    if (!response.ok) {
      const errorText = await response.text();
      console.error(`❌ 식사 삭제 에러 응답:`, errorText);
      
      // 에러 객체에 status 포함
      const error: any = new Error(`HTTP error! status: ${response.status}`);
      error.status = response.status;
      error.message = errorText || `식사 삭제에 실패했습니다. (상태 코드: ${response.status})`;
      throw error;
    }
    
    const result = await response.json().catch(() => ({})); // JSON 파싱 실패 시 빈 객체
    console.log(`✅ 식사 삭제 성공:`, result);
    
    return {
      success: true,
      message: result.message || '식사가 삭제되었습니다.',
    };
  },

  /**
   * 식사 항목 삭제
   * AI 서버의 /food/delete_meal_item API 사용
   */
  deleteMealItem: async (meal_item_id: number): Promise<any> => {
    const user_id = await getUserId();
    
    const token = await AsyncStorage.getItem(ACCESS_TOKEN_KEY);
    const headers: HeadersInit = {
      'accept': 'application/json',
    };
    
    if (token) {
      headers['Authorization'] = `Bearer ${token}`;
    }
    
    const url = `${AI_API_BASE_URL}/food/delete_meal_item?meal_item_id=${meal_item_id}&user_id=${encodeURIComponent(user_id)}`;
    console.log(`📡 식사 항목 삭제 요청: ${url}`);
    
    const response = await fetch(url, {
      method: 'DELETE',
      headers,
    });
    
    if (!response.ok) {
      const errorText = await response.text();
      console.error(`❌ 식사 항목 삭제 에러 응답:`, errorText);
      throw new Error(`HTTP error! status: ${response.status}`);
    }
    
    console.log(`✅ 식사 항목 삭제 성공`);
    return await response.json();
  },

  /**
   * 식사 항목 수정
   * AI 서버의 /food/update_meal_item API 사용
   */
  updateMealItem: async (
    meal_item_id: number,
    quantity_g?: number | null,
    servings?: number | null
  ): Promise<any> => {
    const user_id = await getUserId();
    
    const formData = new URLSearchParams();
    
    if (quantity_g !== undefined && quantity_g !== null) {
      formData.append('quantity_g', quantity_g.toString());
    }
    if (servings !== undefined && servings !== null) {
      formData.append('servings', servings.toString());
    }
    
    const token = await AsyncStorage.getItem(ACCESS_TOKEN_KEY);
    const headers: HeadersInit = {
      'accept': 'application/json',
      'Content-Type': 'application/x-www-form-urlencoded',
    };
    
    if (token) {
      headers['Authorization'] = `Bearer ${token}`;
    }
    
    const url = `${AI_API_BASE_URL}/food/update_meal_item?meal_item_id=${meal_item_id}&user_id=${encodeURIComponent(user_id)}`;
    console.log(`📡 식사 항목 수정 요청: ${url}`);
    
    const response = await fetch(url, {
      method: 'PUT',
      headers,
      body: formData.toString(),
    });
    
    if (!response.ok) {
      const errorText = await response.text();
      console.error(`❌ 식사 항목 수정 에러 응답:`, errorText);
      throw new Error(`HTTP error! status: ${response.status}`);
    }
    
    console.log(`✅ 식사 항목 수정 성공`);
    return await response.json();
  },

  /**
   * 식사 이름 수정
   * AI 서버의 /food/meal/update_name API 사용
   */
  updateMealName: async (meal_id: number, meal_name: string): Promise<any> => {
    const user_id = await getUserId();
    
    // meal_name을 소문자로 변환
    const mealNameMap: Record<string, string> = {
      'BREAKFAST': 'breakfast',
      'LUNCH': 'lunch',
      'DINNER': 'dinner',
      'SNACK': 'snack',
      'OTHER': 'other',
    };
    const mealName = mealNameMap[meal_name] || meal_name.toLowerCase();
    
    const token = await AsyncStorage.getItem(ACCESS_TOKEN_KEY);
    const headers: HeadersInit = {
      'accept': 'application/json',
      'Content-Type': 'application/json',
    };
    
    if (token) {
      headers['Authorization'] = `Bearer ${token}`;
    }
    
    const url = `${AI_API_BASE_URL}/food/meal/update_name`;
    console.log(`📡 식사 이름 수정 요청: ${url}`);
    
    const response = await fetch(url, {
      method: 'PUT',
      headers,
      body: JSON.stringify({
        meal_id,
        user_id,
        meal_name: mealName,
      }),
    });
    
    if (!response.ok) {
      const errorText = await response.text();
      console.error(`❌ 식사 이름 수정 에러 응답:`, errorText);
      throw new Error(`HTTP error! status: ${response.status}`);
    }
    
    console.log(`✅ 식사 이름 수정 성공`);
    return await response.json();
  },

  /**
   * 식사 날짜 수정
   * AI 서버의 /food/meal/update_date API 사용
   */
  updateMealDate: async (meal_id: number, date: string): Promise<any> => {
    const user_id = await getUserId();
    
    const token = await AsyncStorage.getItem(ACCESS_TOKEN_KEY);
    const headers: HeadersInit = {
      'accept': 'application/json',
      'Content-Type': 'application/json',
    };
    
    if (token) {
      headers['Authorization'] = `Bearer ${token}`;
    }
    
    const url = `${AI_API_BASE_URL}/food/meal/update_date`;
    console.log(`📡 식사 날짜 수정 요청: ${url}`);
    
    const response = await fetch(url, {
      method: 'PUT',
      headers,
      body: JSON.stringify({
        meal_id,
        user_id,
        date,
      }),
    });
    
    if (!response.ok) {
      const errorText = await response.text();
      console.error(`❌ 식사 날짜 수정 에러 응답:`, errorText);
      throw new Error(`HTTP error! status: ${response.status}`);
    }
    
    console.log(`✅ 식사 날짜 수정 성공`);
    return await response.json();
  },

  /**
   * 식사 시간 수정
   * AI 서버의 /food/meal/update_time API 사용
   */
  updateMealTime: async (meal_id: number, time_taken: string): Promise<any> => {
    const user_id = await getUserId();
    
    const token = await AsyncStorage.getItem(ACCESS_TOKEN_KEY);
    const headers: HeadersInit = {
      'accept': 'application/json',
      'Content-Type': 'application/json',
    };
    
    if (token) {
      headers['Authorization'] = `Bearer ${token}`;
    }
    
    const url = `${AI_API_BASE_URL}/food/meal/update_time`;
    console.log(`📡 식사 시간 수정 요청: ${url}`);
    
    const response = await fetch(url, {
      method: 'PUT',
      headers,
      body: JSON.stringify({
        meal_id,
        user_id,
        time_taken,
      }),
    });
    
    if (!response.ok) {
      const errorText = await response.text();
      console.error(`❌ 식사 시간 수정 에러 응답:`, errorText);
      throw new Error(`HTTP error! status: ${response.status}`);
    }
    
    console.log(`✅ 식사 시간 수정 성공`);
    return await response.json();
  },

  /**
   * 일일 목표 조회 (영양 목표 가져오기)
   * AI 서버의 /food/daily_goal API 사용
   */
  getDailyGoal: async (): Promise<NutritionGoal> => {
    const user_id = await getUserId();
    
    const token = await AsyncStorage.getItem(ACCESS_TOKEN_KEY);
    const headers: HeadersInit = {
      'accept': 'application/json',
    };
    
    if (token) {
      headers['Authorization'] = `Bearer ${token}`;
    }
    
    const url = `${AI_API_BASE_URL}/food/daily_goal?user_id=${encodeURIComponent(user_id)}`;
    console.log(`📡 일일 목표 조회 요청: ${url}`);
    
    try {
      const response = await fetch(url, {
        method: 'GET',
        headers,
      });
      
      if (!response.ok) {
        const errorText = await response.text();
        console.error(`❌ 일일 목표 조회 에러 응답:`, errorText);
        
        let errorMessage = `HTTP error! status: ${response.status}`;
        
        // 422 Validation Error 처리
        if (response.status === 422) {
          try {
            const errorData = JSON.parse(errorText);
            if (errorData.detail && Array.isArray(errorData.detail)) {
              const errorMessages = errorData.detail.map((err: any) => {
                const field = err.loc && Array.isArray(err.loc)
                  ? err.loc.filter((loc: any) => typeof loc === 'string').join('.')
                  : 'unknown';
                return `${field}: ${err.msg || '검증 오류'}`;
              });
              errorMessage = errorMessages.join(', ');
            } else if (errorData.detail && typeof errorData.detail === 'string') {
              errorMessage = errorData.detail;
            }
          } catch (parseError) {
            errorMessage = '요청 파라미터가 올바르지 않습니다. user_id를 확인해주세요.';
          }
        }
        
        // 404 에러인 경우 기본값 반환
        if (response.status === 404) {
          return {
            id: 0,
            targetCalories: 0,
            targetCarbs: 0,
            targetProtein: 0,
            targetFat: 0,
            goalType: 'AUTO',
            goalTypeDescription: '자동 계산',
          };
        }
        
        throw new Error(errorMessage);
      }
      
      const goal = await response.json();
      console.log(`✅ 일일 목표 조회 성공:`, goal);
      
      // AI 서버 응답 형식: { target_calorie, protein_g, fat_g, carbs_g, tdee } 또는 { user_id, exists, target_calorie, protein_g, fat_g, carbs_g }
      // 기존 형식으로 변환
      const nutritionGoal: NutritionGoal = {
        id: goal.id || 0,
        targetCalories: goal.target_calorie || goal.targetCalories || 0,
        targetCarbs: goal.carbs_g || goal.target_carbs || goal.targetCarbs || 0,
        targetProtein: goal.protein_g || goal.target_protein || goal.targetProtein || 0,
        targetFat: goal.fat_g || goal.target_fat || goal.targetFat || 0,
        goalType: goal.goal_type || goal.goalType || 'AUTO',
        goalTypeDescription: goal.goal_type_description || goal.goalTypeDescription || '자동 계산',
      };
      
      console.log('변환된 영양 목표:', nutritionGoal);
      return nutritionGoal;
    } catch (error: any) {
      // 404 에러인 경우 기본값 반환
      if (error.message?.includes('404') || error.message?.includes('찾을 수 없')) {
        return {
          id: 0,
          targetCalories: 0,
          targetCarbs: 0,
          targetProtein: 0,
          targetFat: 0,
          goalType: 'AUTO',
          goalTypeDescription: '자동 계산',
        };
      }
      throw error;
    }
  },

  /**
   * 특정 날짜에 자동 영양 목표 저장 (TDEE 기반)
   * AI 서버의 /food/daily_goal API 사용
   * GET /food/daily_goal?user_id={user_id}&date={date}
   * is_manual = False로 설정됨
   * @param date YYYY-MM-DD 형식의 날짜 (필수)
   */
  getAutoDailyGoal: async (date: string): Promise<NutritionGoal> => {
    const user_id = await getUserId();
    
    // 날짜 형식 검증
    if (!date || !/^\d{4}-\d{2}-\d{2}$/.test(date)) {
      throw new Error('날짜 형식이 올바르지 않습니다. yyyy-MM-dd 형식을 사용해주세요.');
    }
    
    const token = await AsyncStorage.getItem(ACCESS_TOKEN_KEY);
    const headers: HeadersInit = {
      'accept': 'application/json',
    };
    
    if (token) {
      headers['Authorization'] = `Bearer ${token}`;
    }
    
    const url = `${AI_API_BASE_URL}/food/daily_goal?user_id=${encodeURIComponent(user_id)}&date=${encodeURIComponent(date)}`;
    console.log(`📡 자동 영양 목표 저장 요청 (날짜: ${date}): ${url}`);
    
    try {
      const response = await fetch(url, {
        method: 'GET',
        headers,
      });
      
      if (!response.ok) {
        const errorText = await response.text();
        console.error(`❌ 자동 영양 목표 저장 에러 응답:`, errorText);
        
        let errorMessage = `HTTP error! status: ${response.status}`;
        
        // 422 Validation Error 처리
        if (response.status === 422) {
          try {
            const errorData = JSON.parse(errorText);
            if (errorData.detail && Array.isArray(errorData.detail)) {
              const errorMessages = errorData.detail.map((err: any) => {
                const field = err.loc && Array.isArray(err.loc)
                  ? err.loc.filter((loc: any) => typeof loc === 'string').join('.')
                  : 'unknown';
                return `${field}: ${err.msg || '검증 오류'}`;
              });
              errorMessage = errorMessages.join(', ');
            } else if (errorData.detail && typeof errorData.detail === 'string') {
              errorMessage = errorData.detail;
            }
          } catch (parseError) {
            errorMessage = '요청 파라미터가 올바르지 않습니다. user_id와 date를 확인해주세요.';
          }
        }
        
        throw new Error(errorMessage);
      }
      
      const goal = await response.json();
      console.log(`✅ 자동 영양 목표 저장 성공 (날짜: ${date}):`, goal);
      
      // AI 서버 응답 형식 변환
      const nutritionGoal: NutritionGoal = {
        id: goal.id || 0,
        targetCalories: goal.target_calorie || goal.targetCalories || 0,
        targetCarbs: goal.carbs_g || goal.target_carbs || goal.targetCarbs || 0,
        targetProtein: goal.protein_g || goal.target_protein || goal.targetProtein || 0,
        targetFat: goal.fat_g || goal.target_fat || goal.targetFat || 0,
        goalType: 'AUTO',
        goalTypeDescription: '자동 계산',
      };
      
      console.log('변환된 자동 영양 목표:', nutritionGoal);
      return nutritionGoal;
    } catch (error: any) {
      console.error('자동 영양 목표 저장 실패:', error);
      throw error;
    }
  },

  /**
   * 영양 목표 조회 (특정 날짜)
   * AI 서버의 /food/nutrition-goal/get API 사용
   * 저장된 DailyNutritionGoal 조회 전용 API (자동 계산 실행하지 않음)
   * @param date YYYY-MM-DD 형식의 날짜 (선택적, 없으면 오늘 날짜 사용)
   */
  getNutritionGoal: async (date?: string): Promise<NutritionGoal> => {
    const user_id = await getUserId();
    
    // 날짜가 없으면 오늘 날짜 사용
    const targetDate = date || (() => {
      const today = new Date();
      const year = today.getFullYear();
      const month = String(today.getMonth() + 1).padStart(2, '0');
      const day = String(today.getDate()).padStart(2, '0');
      return `${year}-${month}-${day}`;
    })();
    
    // 날짜 형식 검증
    if (!/^\d{4}-\d{2}-\d{2}$/.test(targetDate)) {
      throw new Error('날짜 형식이 올바르지 않습니다. yyyy-MM-dd 형식을 사용해주세요.');
    }
    
    const token = await AsyncStorage.getItem(ACCESS_TOKEN_KEY);
    const headers: HeadersInit = {
      'accept': 'application/json',
    };
    
    if (token) {
      headers['Authorization'] = `Bearer ${token}`;
    }
    
    const url = `${AI_API_BASE_URL}/food/nutrition-goal/get?user_id=${encodeURIComponent(user_id)}&date=${encodeURIComponent(targetDate)}`;
    console.log(`📡 영양 목표 조회 요청 (날짜: ${targetDate}): ${url}`);
    
    try {
      const response = await fetch(url, {
        method: 'GET',
        headers,
      });
      
      if (!response.ok) {
        const errorText = await response.text();
        console.error(`❌ 영양 목표 조회 에러 응답:`, errorText);
        
        // 404 에러인 경우 exists=false로 반환
        if (response.status === 404) {
          return {
            id: 0,
            targetCalories: 0,
            targetCarbs: 0,
            targetProtein: 0,
            targetFat: 0,
            goalType: 'AUTO',
            goalTypeDescription: '자동 계산',
          };
        }
        
        // 422 Validation Error 처리
        if (response.status === 422) {
          try {
            const errorData = JSON.parse(errorText);
            if (errorData.detail && Array.isArray(errorData.detail)) {
              const errorMessages = errorData.detail.map((err: any) => {
                const field = err.loc && Array.isArray(err.loc)
                  ? err.loc.filter((loc: any) => typeof loc === 'string').join('.')
                  : 'unknown';
                return `${field}: ${err.msg || '검증 오류'}`;
              });
              throw new Error(errorMessages.join(', '));
            } else if (errorData.detail && typeof errorData.detail === 'string') {
              throw new Error(errorData.detail);
            }
          } catch (parseError) {
            throw new Error('요청 파라미터가 올바르지 않습니다. user_id와 date를 확인해주세요.');
          }
        }
        
        throw new Error(`HTTP error! status: ${response.status}`);
      }
      
      const goal = await response.json();
      console.log(`✅ 영양 목표 조회 성공 (날짜: ${targetDate}):`, goal);
      
      // AI 서버 응답 형식: { user_id, exists, is_manual, target_calorie, protein_g, fat_g, carbs_g }
      // 기존 형식으로 변환
      const isManual = goal.is_manual !== undefined ? goal.is_manual : (goal.isManual !== undefined ? goal.isManual : false);
      
      return {
        id: goal.id || 0,
        targetCalories: goal.target_calorie || goal.targetCalories || 0,
        targetCarbs: goal.carbs_g || goal.target_carbs || goal.targetCarbs || 0,
        targetProtein: goal.protein_g || goal.target_protein || goal.targetProtein || 0,
        targetFat: goal.fat_g || goal.target_fat || goal.targetFat || 0,
        goalType: isManual ? 'MANUAL' : (goal.goal_type || goal.goalType || 'AUTO'),
        goalTypeDescription: isManual ? '수동 설정' : (goal.goal_type_description || goal.goalTypeDescription || '자동 계산'),
      };
    } catch (error: any) {
      // 404 에러인 경우 기본값 반환
      if (error.message?.includes('404') || error.message?.includes('찾을 수 없')) {
        return {
          id: 0,
          targetCalories: 0,
          targetCarbs: 0,
          targetProtein: 0,
          targetFat: 0,
          goalType: 'AUTO',
          goalTypeDescription: '자동 계산',
        };
      }
      throw error;
    }
  },

  /**
   * 영양 목표 설정 (칼로리만 입력하면 나머지 자동 계산)
   * AI 서버의 /food/nutrition-goal/manual-calorie API 사용
   */
  setNutritionGoal: async (goalData: SetNutritionGoalRequest): Promise<SetNutritionGoalResponse> => {
    const user_id = await getUserId();
    
    const token = await AsyncStorage.getItem(ACCESS_TOKEN_KEY);
    const headers: HeadersInit = {
      'accept': 'application/json',
      'Content-Type': 'application/json',
    };
    
    if (token) {
      headers['Authorization'] = `Bearer ${token}`;
    }
    
    const url = `${AI_API_BASE_URL}/food/nutrition-goal/manual-calorie`;
    console.log(`📡 영양 목표 설정 요청: ${url}`);
    
    // 칼로리만 전송 (나머지는 서버에서 자동 계산)
    // date 필드가 있으면 지정 날짜부터 말일까지 일괄 적용
    const requestBody: any = {
      user_id: user_id,
      target_calorie: goalData.targetCalories,
    };
    
    // date 필드가 있으면 추가 (YYYY-MM-DD 형식)
    if (goalData.date) {
      requestBody.date = goalData.date;
    }
    
    console.log(`요청 데이터:`, JSON.stringify(requestBody, null, 2));
    
    const response = await fetch(url, {
      method: 'POST',
      headers,
      body: JSON.stringify(requestBody),
    });
    
    if (!response.ok) {
      const errorText = await response.text();
      console.error(`❌ 영양 목표 설정 에러 응답:`, errorText);
      
      let errorMessage = `HTTP error! status: ${response.status}`;
      
      // 404 에러 처리 (User not found)
      if (response.status === 404) {
        try {
          const errorData = JSON.parse(errorText);
          if (errorData.detail) {
            if (typeof errorData.detail === 'string') {
              errorMessage = errorData.detail;
            } else if (Array.isArray(errorData.detail) && errorData.detail.length > 0) {
              errorMessage = errorData.detail[0].msg || errorData.detail;
            }
          }
        } catch (parseError) {
          errorMessage = '사용자를 찾을 수 없습니다. 다시 로그인해주세요.';
        }
        if (!errorMessage || errorMessage.includes('404')) {
          errorMessage = '사용자를 찾을 수 없습니다. 다시 로그인해주세요.';
        }
      } else if (response.status === 422) {
        try {
          const errorData = JSON.parse(errorText);
          if (errorData.detail && Array.isArray(errorData.detail)) {
            const errorMessages = errorData.detail.map((err: any) => {
              const field = err.loc && Array.isArray(err.loc)
                ? err.loc.filter((loc: any) => typeof loc === 'string').join('.')
                : 'unknown';
              return `${field}: ${err.msg || '검증 오류'}`;
            });
            errorMessage = errorMessages.join(', ');
          } else if (errorData.detail && typeof errorData.detail === 'string') {
            errorMessage = errorData.detail;
          }
        } catch (parseError) {
          errorMessage = '요청 데이터가 올바르지 않습니다.';
        }
      } else {
        // 다른 에러 처리
        try {
          const errorData = JSON.parse(errorText);
          if (errorData.detail) {
            if (typeof errorData.detail === 'string') {
              errorMessage = errorData.detail;
            } else if (Array.isArray(errorData.detail) && errorData.detail.length > 0) {
              errorMessage = errorData.detail[0].msg || errorData.detail;
            }
          } else if (errorData.message) {
            errorMessage = errorData.message;
          }
        } catch (parseError) {
          // JSON 파싱 실패 시 원본 텍스트 사용
          if (errorText) {
            errorMessage = errorText;
          }
        }
      }
      
      throw new Error(errorMessage);
    }
    
    const result = await response.json();
    console.log(`✅ 영양 목표 설정 성공:`, result);
    
    // 서버 응답 형식: { user_id, target_calorie, protein_g, fat_g, carbs_g }
    let goal: NutritionGoal;
    
    if (typeof result === 'string') {
      // 응답이 문자열인 경우 (드물지만 가능), 목표를 다시 조회하여 전체 정보 가져오기
      console.log('응답이 문자열이므로 최신 목표를 조회합니다.');
      const updatedGoal = await mealAPI.getDailyGoal();
      goal = {
        id: updatedGoal.id || 0,
        targetCalories: updatedGoal.targetCalories || goalData.targetCalories,
        targetCarbs: updatedGoal.targetCarbs || 0,
        targetProtein: updatedGoal.targetProtein || 0,
        targetFat: updatedGoal.targetFat || 0,
        goalType: 'MANUAL',
        goalTypeDescription: '수동 설정',
      };
    } else {
      // 응답이 객체인 경우 (일반적인 경우)
      // 응답 형식: { user_id, target_calorie, protein_g, fat_g, carbs_g }
      goal = {
        id: result.id || 0,
        targetCalories: result.target_calorie || result.targetCalories || goalData.targetCalories,
        targetCarbs: result.carbs_g || result.target_carbs || result.targetCarbs || 0,
        targetProtein: result.protein_g || result.target_protein || result.targetProtein || 0,
        targetFat: result.fat_g || result.target_fat || result.targetFat || 0,
        goalType: 'MANUAL',
        goalTypeDescription: '수동 설정',
      };
      console.log('서버 응답에서 계산된 영양소:', {
        calories: goal.targetCalories,
        carbs: goal.targetCarbs,
        protein: goal.targetProtein,
        fat: goal.targetFat,
      });
    }
    
    // 응답 형식 변환
    return {
      success: true,
      message: '영양 목표가 설정되었습니다.',
      goal: goal,
    };
  },

  /**
   * 음식 검색
   * AI 서버의 /food/search API 사용
   * GET /food/search?name={name}
   * 
   * 응답: SearchFoodResponse[] (200 OK)
   * 에러: 422 Validation Error (name 파라미터 누락 등)
   */
  searchFood: async (name: string): Promise<SearchFoodResponse[]> => {
    // name 파라미터 검증
    if (!name || name.trim().length === 0) {
      throw new Error('검색할 음식 이름을 입력해주세요.');
    }
    
    const url = `${AI_API_BASE_URL}/food/search?name=${encodeURIComponent(name)}`;
    console.log(`📡 음식 검색 요청: ${url}`);
    
    const response = await fetch(url, {
      method: 'GET',
      headers: {
        'accept': 'application/json',
      },
    });
    
    if (!response.ok) {
      let errorMessage = `HTTP error! status: ${response.status}`;
      
      // 422 Validation Error 처리
      if (response.status === 422) {
        try {
          const errorData = await response.json();
          if (errorData.detail && Array.isArray(errorData.detail)) {
            const errorMessages = errorData.detail.map((err: any) => {
              const field = err.loc ? err.loc.join('.') : 'unknown';
              return `${field}: ${err.msg || '검증 오류'}`;
            });
            errorMessage = errorMessages.join(', ');
          } else if (errorData.detail && typeof errorData.detail === 'string') {
            errorMessage = errorData.detail;
          } else if (errorData.message) {
            errorMessage = errorData.message;
          }
        } catch (parseError) {
          const errorText = await response.text();
          console.error(`❌ 음식 검색 422 에러 응답:`, errorText);
          errorMessage = '검색 요청이 올바르지 않습니다.';
        }
      } else {
        const errorText = await response.text();
        console.error(`❌ 음식 검색 에러 응답:`, errorText);
        try {
          const errorData = JSON.parse(errorText);
          errorMessage = errorData.message || errorData.detail || errorMessage;
        } catch (e) {
          // JSON 파싱 실패 시 원본 텍스트 사용
        }
      }
      
      throw new Error(errorMessage);
    }
    
    const data = await response.json();
    console.log(`✅ 음식 검색 성공:`, data.length, '개 결과');
    return data;
  },

  /**
   * 직접 음식 입력
   * AI 서버의 /food/add_manual_food API 사용
   * POST /food/add_manual_food
   * 
   * 요청 Body: { name, weight, calories, carbs, protein, fat }
   * 응답: SearchFoodResponse (200 OK)
   * 에러: 422 Validation Error (필수 필드 누락, 값 범위 초과 등)
   */
  addManualFood: async (foodData: AddManualFoodRequest): Promise<SearchFoodResponse> => {
    const url = `${AI_API_BASE_URL}/food/add_manual_food`;
    console.log(`📡 직접 음식 입력 요청: ${url}`);
    console.log(`요청 데이터:`, JSON.stringify(foodData, null, 2));
    
    const response = await fetch(url, {
      method: 'POST',
      headers: {
        'accept': 'application/json',
        'Content-Type': 'application/json',
      },
      body: JSON.stringify(foodData),
    });
    
    if (!response.ok) {
      let errorMessage = `HTTP error! status: ${response.status}`;
      
      // 422 Validation Error 처리
      if (response.status === 422) {
        try {
          const errorData = await response.json();
          if (errorData.detail && Array.isArray(errorData.detail)) {
            const errorMessages = errorData.detail.map((err: any) => {
              const field = err.loc && Array.isArray(err.loc) 
                ? err.loc.filter((loc: any) => typeof loc === 'string').join('.')
                : 'unknown';
              return `${field}: ${err.msg || '검증 오류'}`;
            });
            errorMessage = errorMessages.join(', ');
          } else if (errorData.detail && typeof errorData.detail === 'string') {
            errorMessage = errorData.detail;
          } else if (errorData.message) {
            errorMessage = errorData.message;
          }
        } catch (parseError) {
          const errorText = await response.text();
          console.error(`❌ 직접 음식 입력 422 에러 응답:`, errorText);
          errorMessage = '입력한 음식 정보가 올바르지 않습니다.';
        }
      } else {
        // 다른 에러 처리
        try {
          const errorData = await response.json();
          errorMessage = errorData.message || errorData.detail || errorMessage;
        } catch (e) {
          const errorText = await response.text();
          console.error(`❌ 직접 음식 입력 에러 응답:`, errorText);
          if (errorText) {
            errorMessage = errorText;
          }
        }
      }
      
      console.error(`❌ 직접 음식 입력 실패:`, errorMessage);
      throw new Error(errorMessage);
    }
    
    const data = await response.json();
    console.log(`✅ 직접 음식 입력 성공:`, data);
    return data;
  },

  //사진으로 음식 업로드
  // POST /food/upload_food - Azure + Gemini 기반 AI 음식 인식
  // 큰 이미지 자동 리사이즈 (800px 기준), 동일 이미지 해시로 캐싱
  uploadFood: async (imageUri: string): Promise<any> => {
    let resizedUri: string | null = null;
    
    try {
      // 이미지 리사이즈 시도 (800px 기준)
      try {
        const manipResult = await ImageManipulator.manipulateAsync(
          imageUri,
          [{ resize: { width: 800 } }], // 800px 기준으로 리사이즈
          { compress: 0.8, format: ImageManipulator.SaveFormat.JPEG }
        );
        resizedUri = manipResult.uri;
        console.log('이미지 리사이즈 성공:', resizedUri);
      } catch (resizeError: any) {
        console.warn('이미지 리사이즈 실패, 원본 사용:', resizeError.message);
        resizedUri = null; // 리사이즈 실패 시 원본 사용
      }
      
      // 리사이즈된 URI가 없으면 원본 사용
      const uploadUri = resizedUri || imageUri;
      
      // FormData 생성
      const formData = new FormData();
      
      // 파일명 추출 (안전하게 처리)
      // 원본 URI에서 확장자 확인 (리사이즈된 경우 jpg, 원본인 경우 원본 확장자)
      const originalFilename = imageUri.split('/').pop() || 'photo.jpg';
      const uploadFilename = uploadUri.split('/').pop() || originalFilename;
      
      // 원본 파일의 확장자 확인
      let fileExtension = 'jpg';
      const originalMatch = /\.(\w+)$/.exec(originalFilename.toLowerCase());
      if (originalMatch) {
        fileExtension = originalMatch[1];
      } else {
        // 리사이즈된 파일의 확장자 확인
        const uploadMatch = /\.(\w+)$/.exec(uploadFilename.toLowerCase());
        if (uploadMatch) {
          fileExtension = uploadMatch[1];
        }
      }
      
      // MIME 타입 설정
      const mimeTypes: Record<string, string> = {
        jpg: 'image/jpeg',
        jpeg: 'image/jpeg',
        png: 'image/png',
        gif: 'image/gif',
        webp: 'image/webp',
      };
      const type = mimeTypes[fileExtension] || 'image/jpeg';
      
      // 파일명 정리 (특수문자 제거)
      // 리사이즈된 경우 jpg 확장자, 원본인 경우 원본 확장자 유지
      const finalExtension = resizedUri ? 'jpg' : fileExtension;
      const cleanFilename = `photo.${finalExtension}`.replace(/[^a-zA-Z0-9._-]/g, '_');
      
      // multipart/form-data로 file 필드 추가
      // React Native에서는 uri, name, type이 필요
      formData.append('file', {
        uri: uploadUri,
        name: cleanFilename,
        type: type,
      } as any);

      console.log('음식 이미지 업로드 요청:', {
        originalUri: imageUri,
        uploadUri: uploadUri,
        isResized: resizedUri !== null,
        filename: cleanFilename,
        type,
        fileExtension,
      });

      // JWT 토큰 가져오기
      const token = await AsyncStorage.getItem(ACCESS_TOKEN_KEY);
      const headers: HeadersInit = {
        'accept': 'application/json',
      };
      
      if (token) {
        headers['Authorization'] = `Bearer ${token}`;
      }
      
      // API 호출
      const response = await fetch(`${AI_API_BASE_URL}/food/upload_food`, {
        method: 'POST',
        headers,
        body: formData,
      });
      
      // 에러 응답 처리
      if (!response.ok) {
        let errorData: any = {};
        let errorText = '';
        try {
          errorText = await response.text();
          console.error('에러 응답 원본:', errorText);
          if (errorText) {
            try {
              errorData = JSON.parse(errorText);
            } catch (parseError) {
              // JSON이 아닌 경우 텍스트 그대로 사용
              errorData = { message: errorText };
            }
          }
        } catch (parseError) {
          console.error('에러 응답 파싱 실패:', parseError);
        }
        
        let errorMessage = `HTTP error! status: ${response.status}`;
        
        // 400 Bad Request 처리
        if (response.status === 400) {
          if (errorData.detail) {
            if (Array.isArray(errorData.detail)) {
              errorMessage = errorData.detail.map((err: any) => err.msg || JSON.stringify(err)).join(', ');
            } else if (typeof errorData.detail === 'string') {
              errorMessage = errorData.detail;
            }
          } else if (errorData.message) {
            errorMessage = errorData.message;
          } else if (errorText) {
            errorMessage = errorText;
          } else {
            errorMessage = '잘못된 요청입니다. 파일 형식을 확인해주세요.';
          }
        }
        // 422 Validation Error 처리
        else if (response.status === 422) {
          if (errorData.detail) {
            if (Array.isArray(errorData.detail)) {
              const errorMessages = errorData.detail.map((err: any) => {
                const field = err.loc && Array.isArray(err.loc)
                  ? err.loc.filter((loc: any) => typeof loc === 'string').join('.')
                  : 'unknown';
                return `${field}: ${err.msg || '검증 오류'}`;
              });
              errorMessage = errorMessages.join(', ');
            } else if (typeof errorData.detail === 'string') {
              errorMessage = errorData.detail;
            }
          } else if (errorData.message) {
            errorMessage = errorData.message;
          } else {
            errorMessage = '업로드한 파일이 올바르지 않습니다. 이미지 파일을 확인해주세요.';
          }
        } else if (errorData.message) {
          errorMessage = errorData.message;
        }
        
        console.error('에러 상세:', {
          status: response.status,
          errorData,
          errorText,
          errorMessage,
        });
        
        throw new Error(errorMessage);
      }
      
      // 성공 응답 파싱 (application/json)
      const jsonData = await response.json();
      console.log('업로드 응답 파싱 성공:', jsonData);
      return jsonData;
      
    } catch (error: any) {
      console.error('사진 업로드 API 오류:', error);
      
      // 네트워크 에러인 경우
      if (error.message && error.message.includes('Network request failed')) {
        throw new Error('네트워크 연결에 실패했습니다. 인터넷 연결을 확인해주세요.');
      }
      
      // 이미지 리사이즈 에러이거나 400 에러인 경우 원본 이미지로 재시도
      const isImageManipulatorError = error.message && error.message.includes('ImageManipulator');
      const is400Error = error.message && (
        error.message.includes('status: 400') || 
        error.message.includes('Empty or invalid image file') ||
        error.message.includes('invalid image')
      );
      
      if (isImageManipulatorError || is400Error) {
        console.warn('이미지 리사이즈 실패 또는 400 에러, 원본 이미지로 재시도');
        try {
          const formData = new FormData();
          const originalFilename = imageUri.split('/').pop() || 'photo.jpg';
          
          // 확장자 확인 및 타입 설정
          let fileExtension = 'jpg';
          const match = /\.(\w+)$/.exec(originalFilename.toLowerCase());
          if (match) {
            fileExtension = match[1];
          }
          
          const mimeTypes: Record<string, string> = {
            jpg: 'image/jpeg',
            jpeg: 'image/jpeg',
            png: 'image/png',
            gif: 'image/gif',
            webp: 'image/webp',
          };
          const type = mimeTypes[fileExtension] || 'image/jpeg';
          
          const cleanFilename = originalFilename.replace(/[^a-zA-Z0-9._-]/g, '_') || 'photo.jpg';
          
          formData.append('file', {
            uri: imageUri,
            name: cleanFilename,
            type: type,
          } as any);

          console.log('원본 이미지로 재시도:', {
            uri: imageUri,
            filename: cleanFilename,
            type,
          });

          // JWT 토큰 가져오기
          const retryToken = await AsyncStorage.getItem(ACCESS_TOKEN_KEY);
          const retryHeaders: HeadersInit = {
            'accept': 'application/json',
          };
          
          if (retryToken) {
            retryHeaders['Authorization'] = `Bearer ${retryToken}`;
          }
          
          const response = await fetch(`${AI_API_BASE_URL}/food/upload_food`, {
            method: 'POST',
            headers: retryHeaders,
            body: formData,
          });
          
          if (!response.ok) {
            const errorText = await response.text();
            console.error('재시도 실패 응답:', errorText);
            let errorData: any = {};
            try {
              errorData = JSON.parse(errorText);
            } catch (e) {
              errorData = { message: errorText };
            }
            throw new Error(errorData.message || errorData.detail || `HTTP error! status: ${response.status}`);
          }
          
          const jsonData = await response.json();
          console.log('원본 이미지 업로드 성공:', jsonData);
          return jsonData;
        } catch (retryError: any) {
          console.error('원본 이미지 재시도 실패:', retryError);
          throw new Error(retryError.message || '사진 업로드에 실패했습니다. 다시 시도해주세요.');
        }
      }
      
      // 이미 에러 메시지가 있는 경우 그대로 전달
      if (error.message) {
        throw error;
      }
      
      throw new Error('사진 업로드에 실패했습니다. 다시 시도해주세요.');
    }
  },
};
