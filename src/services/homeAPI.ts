import { request } from './apiConfig';
import type { HomeResponse, DailyProgressWeekItem } from '../types';
import AsyncStorage from '@react-native-async-storage/async-storage';
import { ACCESS_TOKEN_KEY } from './apiConfig';

// 코치 주간 리포트 타입
export interface WeeklyCoachReport {
  summary: string;
  metrics: {
    avg_kcal: number;
    avg_protein: number;
    avg_fat: number;
    avg_carb: number;
    avg_sodium_mg: number;
    processed_ratio: number;
    exercise_days: number;
    avg_ex_duration: number;
    avg_ex_intensity: number;
    avg_burned: number;
    health_score: number;
    score_trend_delta: number;
  };
  action_items: string[];
  motivation: string;
}

// userId 가져오기 (JWT에서 sub 추출)
const getUserId = async (): Promise<string> => {
  try {
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
        if (payload.sub) {
          return String(payload.sub);
        }
      } catch (e) {
        console.error('[HOME] JWT 디코딩 실패:', e);
      }
    }
    
    // AsyncStorage에서 userId 가져오기 시도
    const userId = await AsyncStorage.getItem('userId');
    if (userId) {
      return userId;
    }
    
    throw new Error('사용자 ID를 찾을 수 없습니다.');
  } catch (error) {
    console.error('[HOME] userId 가져오기 실패:', error);
    throw error;
  }
};

export const homeAPI = {
  // 홈 화면 메인 정보 조회
  getHomeData: async (date?: string): Promise<HomeResponse> => {
    const dateParam = date ? `?date=${date}` : '';
    return request<HomeResponse>(`/api/home${dateParam}`, {
      method: 'GET',
    });
  },
  
  
  // 이번 주(일~토) 운동 달성률 및 칼로리 목록 조회
  // GET /api/daily-progress/week
  // 응답: [{ date: "2025-11-11", exerciseRate: 0, totalCalorie: 0 }, ...]
  getWeeklyProgress: async (): Promise<DailyProgressWeekItem[]> => {
    try {
      console.log('📡 [주간 진행률] API 호출: GET /api/daily-progress/week');
      const response = await request<DailyProgressWeekItem[]>(`/api/daily-progress/week`, {
        method: 'GET',
      });
      
      // 배열로 반환
      if (Array.isArray(response)) {
        console.log('✅ [주간 진행률] 데이터 수신:', response.length, '개');
        // 전체 응답 데이터 로그 출력
        console.log('📊 [주간 진행률] 전체 응답 데이터:', JSON.stringify(response, null, 2));
        return response;
      }
      
      // 예외 처리
      console.warn('⚠️ [주간 진행률] 응답이 배열이 아닙니다:', response);
      return [];
    } catch (error: any) {
      console.error('❌ [주간 진행률] API 호출 실패:', error);
      throw error;
    }
  },

  // 월별 운동 달성률 및 칼로리 목록 조회
  // GET /api/daily-progress/month?yearMonth=2025-12
  // 응답: [{ date: "2025-12-03", exerciseRate: 0, totalCalorie: 0 }, ...]
  getMonthlyProgress: async (yearMonth: string): Promise<DailyProgressWeekItem[]> => {
    try {
      console.log('월별 진행률 API 호출: GET /api/daily-progress/month', { yearMonth });
      const response = await request<DailyProgressWeekItem[]>(`/api/daily-progress/month?yearMonth=${yearMonth}`, {
        method: 'GET',
      });
      
      // 배열로 반환
      if (Array.isArray(response)) {
        console.log('월별 진행률 데이터 수신:', response.length, '개');
        // 응답 데이터 샘플 로그 출력
        if (response.length > 0) {
          console.log('월별 진행률 데이터 샘플 (첫 3개):', response.slice(0, 3));
        }
        return response;
      }
      
      // 예외 처리
      console.warn('월별 진행률 응답이 배열이 아닙니다:', response);
      return [];
    } catch (error: any) {
      console.error('월별 진행률 API 호출 실패:', error);
      throw error;
    }
  },

  // 코치 주간 리포트 조회
  // GET /coach/weekly_report/{user_id}
  getWeeklyCoachReport: async (): Promise<WeeklyCoachReport> => {
    try {
      const userId = await getUserId();
      const url = `http://43.200.40.140:8000/coach/weekly_report/${userId}`;
      
      console.log('[HOME] 코치 리포트 API 호출:', url);
      
      const response = await fetch(url, {
        method: 'GET',
        headers: {
          'accept': 'application/json',
        },
      });

      if (!response.ok) {
        throw new Error(`HTTP error! status: ${response.status}`);
      }

      const data = await response.json();
      console.log('[HOME] 코치 리포트 응답:', data);
      
      return data;
    } catch (error: any) {
      console.error('[HOME] 코치 리포트 API 호출 실패:', error);
      throw error;
    }
  },

  // 영양 목표 조회
  // GET /food/nutrition-goal/get?user_id={user_id}&date={date}
  getNutritionGoal: async (date: string): Promise<any> => {
    try {
      const userId = await getUserId();
      const token = await AsyncStorage.getItem(ACCESS_TOKEN_KEY);
      
      const url = `http://43.200.40.140:8000/food/nutrition-goal/get?user_id=${encodeURIComponent(userId)}&date=${encodeURIComponent(date)}`;
      
      console.log('[HOME] 영양 목표 API 호출:', url);
      
      const headers: HeadersInit = {
        'accept': 'application/json',
      };
      
      if (token) {
        headers['Authorization'] = `Bearer ${token}`;
      }
      
      const response = await fetch(url, {
        method: 'GET',
        headers,
      });

      if (!response.ok) {
        if (response.status === 404) {
          // 목표가 없는 경우 null 반환
          console.log('[HOME] 영양 목표 없음');
          return null;
        }
        throw new Error(`HTTP error! status: ${response.status}`);
      }

      const data = await response.json();
      console.log('[HOME] 영양 목표 응답:', data);
      
      return data;
    } catch (error: any) {
      console.error('[HOME] 영양 목표 API 호출 실패:', error);
      return null;
    }
  },
};

