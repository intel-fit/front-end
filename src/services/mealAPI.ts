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

// ============================================
// 공통 헬퍼 함수
// ============================================

/**
 * 인증 헤더 생성
 */
const getAuthHeaders = async (additionalHeaders: HeadersInit = {}): Promise<HeadersInit> => {
  const token = await AsyncStorage.getItem(ACCESS_TOKEN_KEY);
  const headers: HeadersInit = {
    'accept': 'application/json',
    ...additionalHeaders,
  };
  
  if (token) {
    headers['Authorization'] = `Bearer ${token}`;
  }
  
  return headers;
};

/**
 * 에러 응답 처리
 */
const handleErrorResponse = async (response: Response, apiName: string): Promise<never> => {
  let errorMessage = `HTTP error! status: ${response.status}`;
  let errorData: any = {};
  
  try {
    const errorText = await response.text();
    console.error(`❌ ${apiName} 에러 응답:`, errorText);
    
    if (errorText) {
      try {
        errorData = JSON.parse(errorText);
        // 서버가 반환하는 메시지 우선 사용
        if (errorData.message) {
          errorMessage = errorData.message;
        } else if (errorData.detail) {
          if (Array.isArray(errorData.detail)) {
            errorMessage = errorData.detail.map((err: any) => err.msg || JSON.stringify(err)).join(', ');
          } else if (typeof errorData.detail === 'string') {
            errorMessage = errorData.detail;
          }
        } else if (errorData.error) {
          errorMessage = errorData.error;
        }
      } catch (parseError) {
        errorMessage = errorText || errorMessage;
      }
    }
  } catch (readError) {
    console.error(`에러 응답 읽기 실패 (${apiName}):`, readError);
  }
  
  // 상태 코드별 에러 처리
  if (response.status === 401) {
    throw new Error('인증이 필요합니다. 다시 로그인해주세요.');
  } else if (response.status === 500) {
    throw new Error(errorMessage || '서버 내부 오류가 발생했습니다. 잠시 후 다시 시도해주세요.');
  } else if (response.status === 422) {
    throw new Error(errorMessage || '입력값이 올바르지 않습니다.');
  }
  
  throw new Error(errorMessage);
};

/**
 * userId 가져오기 (AsyncStorage 또는 JWT에서)
 */
const getUserId = async (): Promise<string> => {
  // AsyncStorage에서 먼저 확인
  let userId = await AsyncStorage.getItem('userId');
  
  if (!userId) {
    // JWT 토큰에서 userPk 추출 시도
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
        if (payload.userPk) {
          userId = String(payload.userPk);
          await AsyncStorage.setItem('userId', userId);
        }
      } catch (e) {
        console.error('JWT 디코딩 실패:', e);
      }
    }
  }
  
  if (!userId) {
    throw new Error('사용자 ID를 찾을 수 없습니다. 다시 로그인해주세요.');
  }
  
  return userId;
};

/**
 * AI API 호출 공통 함수
 */
const callAIAPI = async <T>(
  endpoint: string,
  options: RequestInit = {},
  apiName: string
): Promise<T> => {
  try {
    const headers = await getAuthHeaders(options.headers as HeadersInit);
    const url = `${AI_API_BASE_URL}${endpoint}`;
    
    console.log(`📡 ${apiName} 요청:`, url);
    
    const response = await fetch(url, {
      ...options,
      headers: {
        ...headers,
        ...options.headers,
      },
    });
    
    if (!response.ok) {
      await handleErrorResponse(response, apiName);
    }
    
    const data = await response.json();
    console.log(`✅ ${apiName} 성공`);
    return data;
  } catch (error: any) {
    console.error(`❌ ${apiName} 오류:`, error);
    
    // 네트워크 에러 처리
    if (error.message && error.message.includes('Network request failed')) {
      throw new Error('네트워크 연결에 실패했습니다. 인터넷 연결을 확인해주세요.');
    }
    
    throw error;
  }
};

// ============================================
// 식단 기록 API
// ============================================

export const mealAPI = {
  // ============================================
  // 기본 식단 API (AI 서버로 마이그레이션)
  // ============================================
  
  /**
   * 일별 식단 조회
   * AI 서버의 /food/get_meals API 사용
   */
  getDailyMeals: async (date: string): Promise<DailyMealsResponse> => {
    const user_id = await getUserId();
    const meals = await callAIAPI<any[]>(
      `/food/get_meals?user_id=${encodeURIComponent(user_id)}&date=${encodeURIComponent(date)}`,
      { method: 'GET' },
      '일별 식단 조회'
    );
    
    // AI 서버 응답을 기존 형식으로 변환
    const dailyMeals: DailyMealsResponse = {
      date: date,
      meals: meals.map((meal: any) => ({
        id: meal.meal_id,
        mealDate: date,
        mealType: meal.meal_name?.toUpperCase() || 'OTHER',
        mealTypeName: meal.meal_name || '기타',
        totalCalories: meal.items?.reduce((sum: number, item: any) => sum + (item.calories || 0), 0) || 0,
        totalCarbs: meal.items?.reduce((sum: number, item: any) => sum + (item.carbs || 0), 0) || 0,
        totalProtein: meal.items?.reduce((sum: number, item: any) => sum + (item.protein || 0), 0) || 0,
        totalFat: meal.items?.reduce((sum: number, item: any) => sum + (item.fat || 0), 0) || 0,
        foods: meal.items?.map((item: any) => ({
          id: item.meal_item_id,
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
      })),
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
   * AI 서버의 /food/add_food_to_meal API 사용
   */
  addMeal: async (mealData: AddMealRequest): Promise<AddMealResponse> => {
    const user_id = await getUserId();
    
    // 각 음식을 개별적으로 추가
    const results = [];
    for (const food of mealData.foods) {
      const formData = new FormData();
      formData.append('user_id', user_id);
      formData.append('date', mealData.mealDate);
      formData.append('meal_name', mealData.mealType);
      formData.append('quantity_g', food.servingSize.toString());
      
      if (food.imageUrl) {
        // 이미지 URL이 있으면 file로 추가 (실제로는 URL을 전달해야 할 수도 있음)
        // 여기서는 manual_food로 처리
        formData.append('manual_food', JSON.stringify({
          name: food.foodName,
          calories: food.calories,
          carbs: food.carbs,
          protein: food.protein,
          fat: food.fat,
        }));
      } else {
        formData.append('manual_food', JSON.stringify({
          name: food.foodName,
          calories: food.calories,
          carbs: food.carbs,
          protein: food.protein,
          fat: food.fat,
        }));
      }
      
      const result = await callAIAPI<any>(
        '/food/add_food_to_meal',
        {
          method: 'POST',
          body: formData,
        },
        '식사 추가'
      );
      results.push(result);
    }
    
    // 응답 형식 변환
    return {
      success: true,
      message: '식사가 추가되었습니다.',
      meal: {
        id: 0,
        mealDate: mealData.mealDate,
        mealType: mealData.mealType,
        mealTypeName: mealData.mealType,
        totalCalories: mealData.foods.reduce((sum, f) => sum + f.calories, 0),
        totalCarbs: mealData.foods.reduce((sum, f) => sum + f.carbs, 0),
        totalProtein: mealData.foods.reduce((sum, f) => sum + f.protein, 0),
        totalFat: mealData.foods.reduce((sum, f) => sum + f.fat, 0),
        foods: mealData.foods.map((f, idx) => ({
          id: idx,
          foodName: f.foodName,
          servingSize: f.servingSize,
          calories: f.calories,
          carbs: f.carbs,
          protein: f.protein,
          fat: f.fat,
          sodium: f.sodium || 0,
          cholesterol: f.cholesterol || 0,
          sugar: f.sugar || 0,
          fiber: f.fiber || 0,
          imageUrl: f.imageUrl || '',
          aiConfidenceScore: f.aiConfidenceScore || 0,
        })),
        createdAt: new Date().toISOString(),
      },
    };
  },

  /**
   * 식사 삭제
   * AI 서버의 /food/delete_meal API 사용
   */
  deleteMeal: async (mealId: number): Promise<{success: boolean; message: string}> => {
    const user_id = await getUserId();
    await callAIAPI<any>(
      `/food/delete_meal?meal_id=${mealId}&user_id=${encodeURIComponent(user_id)}`,
      { method: 'DELETE' },
      '식사 삭제'
    );
    
    return {
      success: true,
      message: '식사가 삭제되었습니다.',
    };
  },

  /**
   * 영양 목표 조회
   * AI 서버의 /food/nutrition-goal/get API 사용
   */
  getNutritionGoal: async (): Promise<NutritionGoal> => {
    const user_id = await getUserId();
    const today = new Date().toISOString().split('T')[0];
    
    try {
      const goal = await callAIAPI<any>(
        `/food/nutrition-goal/get?user_id=${encodeURIComponent(user_id)}&date_str=${encodeURIComponent(today)}`,
        { method: 'GET' },
        '영양 목표 조회'
      );
      
      // AI 서버 응답을 기존 형식으로 변환
      return {
        id: goal.id || 0,
        targetCalories: goal.target_calorie || goal.targetCalories || 0,
        targetCarbs: goal.target_carbs || goal.targetCarbs || 0,
        targetProtein: goal.target_protein || goal.targetProtein || 0,
        targetFat: goal.target_fat || goal.targetFat || 0,
        goalType: goal.goal_type || goal.goalType || 'AUTO',
        goalTypeDescription: goal.goal_type_description || goal.goalTypeDescription || '자동 계산',
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
   * 영양 목표 설정
   * AI 서버의 /food/nutrition-goal/manual-calorie API 사용
   */
  setNutritionGoal: async (goalData: SetNutritionGoalRequest): Promise<SetNutritionGoalResponse> => {
    const user_id = await getUserId();
    const today = new Date().toISOString().split('T')[0];
    
    await callAIAPI<string>(
      '/food/nutrition-goal/manual-calorie',
      {
        method: 'POST',
        headers: { 'Content-Type': 'application/json' },
        body: JSON.stringify({
          user_id: user_id,
          target_calorie: goalData.targetCalories,
          date: today,
        }),
      },
      '영양 목표 설정'
    );
    
    // 응답 형식 변환
    return {
      success: true,
      message: '영양 목표가 설정되었습니다.',
      goal: {
        id: 0,
        targetCalories: goalData.targetCalories,
        targetCarbs: goalData.targetCarbs,
        targetProtein: goalData.targetProtein,
        targetFat: goalData.targetFat,
        goalType: goalData.goalType || 'MANUAL',
        goalTypeDescription: '수동 설정',
      },
    };
  },

  // ============================================
  // 음식 검색 및 추가 API (AI 서버)
  // ============================================

  /**
   * 음식 검색
   */
  searchFood: async (name: string): Promise<SearchFoodResponse[]> => {
    return callAIAPI<SearchFoodResponse[]>(
      `/food/search?name=${encodeURIComponent(name)}`,
      { method: 'GET' },
      '음식 검색'
    );
  },

  /**
   * 직접 음식 입력
   */
  addManualFood: async (foodData: AddManualFoodRequest): Promise<SearchFoodResponse> => {
    return callAIAPI<SearchFoodResponse>(
      '/food/add_manual_food',
      {
        method: 'POST',
        headers: { 'Content-Type': 'application/json' },
        body: JSON.stringify(foodData),
      },
      '직접 음식 입력'
    );
  },

  /**
   * 사진으로 음식 업로드
   * Azure + Gemini 기반 AI 음식 인식
   */
  uploadFood: async (imageUri: string): Promise<any> => {
    let resizedUri: string | null = null;
    
    try {
      // 이미지 리사이즈 시도 (800px 기준)
      try {
        const manipResult = await ImageManipulator.manipulateAsync(
          imageUri,
          [{ resize: { width: 800 } }],
          { compress: 0.8, format: ImageManipulator.SaveFormat.JPEG }
        );
        resizedUri = manipResult.uri;
        console.log('이미지 리사이즈 성공:', resizedUri);
      } catch (resizeError: any) {
        console.warn('이미지 리사이즈 실패, 원본 사용:', resizeError.message);
        resizedUri = null;
      }
      
      const uploadUri = resizedUri || imageUri;
      const formData = new FormData();
      
      // 파일명 및 타입 설정
      const originalFilename = imageUri.split('/').pop() || 'photo.jpg';
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
      const finalExtension = resizedUri ? 'jpg' : fileExtension;
      const cleanFilename = `photo.${finalExtension}`.replace(/[^a-zA-Z0-9._-]/g, '_');
      
      formData.append('file', {
        uri: uploadUri,
        name: cleanFilename,
        type: type,
      } as any);

      console.log('📷 음식 이미지 업로드 요청:', {
        originalUri: imageUri,
        uploadUri: uploadUri,
        isResized: resizedUri !== null,
        filename: cleanFilename,
      });

      const headers = await getAuthHeaders();
      const response = await fetch(`${AI_API_BASE_URL}/food/upload_food`, {
        method: 'POST',
        headers,
        body: formData,
      });
      
      if (!response.ok) {
        await handleErrorResponse(response, '음식 이미지 업로드');
      }
      
      const jsonData = await response.json();
      console.log('✅ 음식 이미지 업로드 성공:', jsonData);
      return jsonData;
      
    } catch (error: any) {
      console.error('사진 업로드 API 오류:', error);
      
      // 네트워크 에러 처리
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

          const headers = await getAuthHeaders();
          const response = await fetch(`${AI_API_BASE_URL}/food/upload_food`, {
            method: 'POST',
            headers,
            body: formData,
          });
          
          if (!response.ok) {
            await handleErrorResponse(response, '음식 이미지 업로드 (재시도)');
          }
          
          const jsonData = await response.json();
          console.log('✅ 원본 이미지 업로드 성공:', jsonData);
          return jsonData;
        } catch (retryError: any) {
          console.error('원본 이미지 재시도 실패:', retryError);
          throw new Error(retryError.message || '사진 업로드에 실패했습니다. 다시 시도해주세요.');
        }
      }
      
      throw error;
    }
  },

  // ============================================
  // 식사 관리 API (AI 서버)
  // ============================================

  /**
   * 식사에 음식 추가
   */
  addFoodToMeal: async (params: {
    user_id: string;
    date: string;
    quantity_g?: number | null;
    servings?: number | null;
    meal_id?: number | null;
    meal_name?: string | null;
    time_taken?: string | null;
    food_id?: number | null;
    manual_food?: string | null;
    file?: any;
  }): Promise<any> => {
    const formData = new FormData();
    
    formData.append('user_id', params.user_id);
    formData.append('date', params.date);
    if (params.quantity_g !== undefined && params.quantity_g !== null) {
      formData.append('quantity_g', params.quantity_g.toString());
    }
    if (params.servings !== undefined && params.servings !== null) {
      formData.append('servings', params.servings.toString());
    }
    if (params.meal_id !== undefined && params.meal_id !== null) {
      formData.append('meal_id', params.meal_id.toString());
    }
    if (params.meal_name) {
      formData.append('meal_name', params.meal_name);
    }
    if (params.time_taken) {
      formData.append('time_taken', params.time_taken);
    }
    if (params.food_id !== undefined && params.food_id !== null) {
      formData.append('food_id', params.food_id.toString());
    }
    if (params.manual_food) {
      formData.append('manual_food', params.manual_food);
    }
    if (params.file) {
      formData.append('file', params.file);
    }

    return callAIAPI(
      '/food/add_food_to_meal',
      {
        method: 'POST',
        body: formData,
      },
      '식사에 음식 추가'
    );
  },

  /**
   * 식사 조회
   */
  getMeals: async (user_id: string, date: string): Promise<any[]> => {
    return callAIAPI<any[]>(
      `/food/get_meals?user_id=${encodeURIComponent(user_id)}&date=${encodeURIComponent(date)}`,
      { method: 'GET' },
      '식사 조회'
    );
  },

  /**
   * 식사 항목 삭제
   */
  deleteMealItem: async (meal_item_id: number, user_id: string): Promise<any> => {
    return callAIAPI<any>(
      `/food/delete_meal_item?meal_item_id=${meal_item_id}&user_id=${encodeURIComponent(user_id)}`,
      { method: 'DELETE' },
      '식사 항목 삭제'
    );
  },

  /**
   * 식사 항목 수정
   */
  updateMealItem: async (
    meal_item_id: number,
    user_id: string,
    quantity_g?: number | null,
    servings?: number | null
  ): Promise<any> => {
    const formData = new URLSearchParams();
    
    if (quantity_g !== undefined && quantity_g !== null) {
      formData.append('quantity_g', quantity_g.toString());
    }
    if (servings !== undefined && servings !== null) {
      formData.append('servings', servings.toString());
    }

    return callAIAPI<any>(
      `/food/update_meal_item?meal_item_id=${meal_item_id}&user_id=${encodeURIComponent(user_id)}`,
      {
        method: 'PUT',
        headers: { 'Content-Type': 'application/x-www-form-urlencoded' },
        body: formData.toString(),
      },
      '식사 항목 수정'
    );
  },

  /**
   * 식사 삭제 (AI API 경로 사용)
   */
  deleteMealAI: async (meal_id: number, user_id: string): Promise<any> => {
    return callAIAPI<any>(
      `/food/delete_meal?meal_id=${meal_id}&user_id=${encodeURIComponent(user_id)}`,
      { method: 'DELETE' },
      '식사 삭제'
    );
  },

  /**
   * 식사 이름 수정
   */
  updateMealName: async (params: {
    meal_id: number;
    user_id: string;
    meal_name: string;
  }): Promise<any> => {
    return callAIAPI<any>(
      '/food/meal/update_name',
      {
        method: 'PUT',
        headers: { 'Content-Type': 'application/json' },
        body: JSON.stringify(params),
      },
      '식사 이름 수정'
    );
  },

  /**
   * 식사 날짜 수정
   */
  updateMealDate: async (params: {
    meal_id: number;
    user_id: string;
    date: string;
  }): Promise<any> => {
    return callAIAPI<any>(
      '/food/meal/update_date',
      {
        method: 'PUT',
        headers: { 'Content-Type': 'application/json' },
        body: JSON.stringify(params),
      },
      '식사 날짜 수정'
    );
  },

  /**
   * 식사 시간 수정
   */
  updateMealTime: async (params: {
    meal_id: number;
    user_id: string;
    time_taken: string;
  }): Promise<any> => {
    return callAIAPI<any>(
      '/food/meal/update_time',
      {
        method: 'PUT',
        headers: { 'Content-Type': 'application/json' },
        body: JSON.stringify(params),
      },
      '식사 시간 수정'
    );
  },

  // ============================================
  // 영양 목표 API (AI 서버)
  // ============================================

  /**
   * 일일 목표 조회
   */
  getDailyGoal: async (user_id: string): Promise<any> => {
    return callAIAPI<any>(
      `/food/daily_goal?user_id=${encodeURIComponent(user_id)}`,
      { method: 'GET' },
      '일일 목표 조회'
    );
  },

  /**
   * 수동 칼로리 설정
   */
  setManualCalorie: async (params: {
    user_id: string;
    target_calorie: number;
    date: string;
  }): Promise<string> => {
    return callAIAPI<string>(
      '/food/nutrition-goal/manual-calorie',
      {
        method: 'POST',
        headers: { 'Content-Type': 'application/json' },
        body: JSON.stringify(params),
      },
      '수동 칼로리 설정'
    );
  },

  /**
   * 저장된 영양 목표 조회
   */
  getSavedNutritionGoal: async (user_id: string, date_str?: string | null): Promise<any> => {
    let endpoint = `/food/nutrition-goal/get?user_id=${encodeURIComponent(user_id)}`;
    if (date_str) {
      endpoint += `&date_str=${encodeURIComponent(date_str)}`;
    }
    
    return callAIAPI<any>(
      endpoint,
      { method: 'GET' },
      '저장된 영양 목표 조회'
    );
  },
};
