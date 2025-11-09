import { request } from './apiConfig';
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

  //식사 삭제
  deleteMeal: async (mealId: number): Promise<{success: boolean; message: string}> => {
    return request<{success: boolean; message: string}>(`/api/meals/${mealId}`, {
      method: 'DELETE',
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

  //음식 검색
  searchFood: async (name: string): Promise<SearchFoodResponse[]> => {
    // 음식 검색 API는 8000 포트를 사용
    const response = await fetch(`http://43.200.40.140:8000/food/search?name=${encodeURIComponent(name)}`, {
      method: 'GET',
      headers: {
        'accept': 'application/json',
      },
    });
    
    if (!response.ok) {
      throw new Error(`HTTP error! status: ${response.status}`);
    }
    
    return response.json();
  },

  //직접 음식 입력
  addManualFood: async (foodData: AddManualFoodRequest): Promise<SearchFoodResponse> => {
    // 직접 음식 입력 API는 8000 포트를 사용
    const response = await fetch('http://43.200.40.140:8000/food/add_manual_food', {
      method: 'POST',
      headers: {
        'accept': 'application/json',
        'Content-Type': 'application/json',
      },
      body: JSON.stringify(foodData),
    });
    
    if (!response.ok) {
      const errorData = await response.json().catch(() => ({}));
      let errorMessage = `HTTP error! status: ${response.status}`;
      
      if (errorData.detail) {
        if (Array.isArray(errorData.detail)) {
          errorMessage = errorData.detail.map((err: any) => err.msg || JSON.stringify(err)).join(', ');
        } else if (typeof errorData.detail === 'string') {
          errorMessage = errorData.detail;
        }
      }
      
      throw new Error(errorMessage);
    }
    
    return response.json();
  },

  //사진으로 음식 업로드
  uploadFood: async (imageUri: string): Promise<any> => {
    // 사진 업로드 API는 8000 포트를 사용
    const formData = new FormData();
    
    // 파일명 추출
    const filename = imageUri.split('/').pop() || 'photo.jpg';
    const match = /\.(\w+)$/.exec(filename);
    const type = match ? `image/${match[1]}` : 'image/jpeg';
    
    formData.append('file', {
      uri: imageUri,
      name: filename,
      type: type,
    } as any);

    try {
      const response = await fetch('http://43.200.40.140:8000/food/upload_food', {
        method: 'POST',
        headers: {
          'accept': 'application/json',
        },
        body: formData,
      });
      
      if (!response.ok) {
        let errorData: any = {};
        try {
          const text = await response.text();
          if (text) {
            errorData = JSON.parse(text);
          }
        } catch (parseError) {
          console.error('에러 응답 파싱 실패:', parseError);
        }
        
        let errorMessage = `HTTP error! status: ${response.status}`;
        
        if (errorData.detail) {
          if (Array.isArray(errorData.detail)) {
            errorMessage = errorData.detail.map((err: any) => err.msg || JSON.stringify(err)).join(', ');
          } else if (typeof errorData.detail === 'string') {
            errorMessage = errorData.detail;
          }
        } else if (errorData.message) {
          errorMessage = errorData.message;
        }
        
        throw new Error(errorMessage);
      }
      
      // 응답 본문 파싱
      const responseText = await response.text();
      console.log('업로드 응답 원본:', responseText);
      
      if (!responseText || responseText.trim() === '') {
        throw new Error('서버에서 빈 응답을 받았습니다.');
      }
      
      try {
        const jsonData = JSON.parse(responseText);
        console.log('업로드 응답 파싱 성공:', jsonData);
        return jsonData;
      } catch (parseError: any) {
        console.error('JSON 파싱 오류:', parseError);
        console.error('파싱 실패한 응답:', responseText);
        
        // Gemini 파싱 에러인 경우 특별 처리
        if (responseText.includes('Gemini') || responseText.includes('gemini')) {
          throw new Error('이미지 분석에 실패했습니다. 다른 사진을 시도해주세요.');
        }
        
        throw new Error(`서버 응답을 파싱할 수 없습니다: ${parseError.message}`);
      }
    } catch (error: any) {
      console.error('사진 업로드 API 오류:', error);
      
      // 네트워크 에러인 경우
      if (error.message && error.message.includes('Network request failed')) {
        throw new Error('네트워크 연결에 실패했습니다. 인터넷 연결을 확인해주세요.');
      }
      
      // 이미 에러 메시지가 있는 경우 그대로 전달
      if (error.message) {
        throw error;
      }
      
      throw new Error('사진 업로드에 실패했습니다. 다시 시도해주세요.');
    }
  },
};
