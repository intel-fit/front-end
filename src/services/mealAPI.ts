import { request } from './apiConfig';
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

      // API 호출
      const response = await fetch('http://43.200.40.140:8000/food/upload_food', {
        method: 'POST',
        headers: {
          'accept': 'application/json',
        },
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
        else if (response.status === 422 && errorData.detail) {
          if (Array.isArray(errorData.detail)) {
            errorMessage = errorData.detail.map((err: any) => err.msg || JSON.stringify(err)).join(', ');
          } else if (typeof errorData.detail === 'string') {
            errorMessage = errorData.detail;
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

          const response = await fetch('http://43.200.40.140:8000/food/upload_food', {
            method: 'POST',
            headers: {
              'accept': 'application/json',
            },
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
