import { request } from './apiConfig';
import type { HomeResponse, DailyProgressWeekItem } from '../types';

export const homeAPI = {
  // 홈 화면 메인 정보 조회
  getHomeData: async (date?: string): Promise<HomeResponse> => {
    const dateParam = date ? `?date=${date}` : '';
    return request<HomeResponse>(`/api/home${dateParam}`, {
      method: 'GET',
    });
  },
  // 이번 주(일~토) 운동 달성률 및 칼로리 목록 조회
  getWeeklyProgress: async (): Promise<DailyProgressWeekItem[]> => {
    try {
      const response = await request<any>(`/api/daily-progress/week`, {
        method: 'GET',
      });
      
      console.log('주간 진행률 API 원본 응답:', JSON.stringify(response, null, 2));
      
      // 응답이 배열인 경우
      if (Array.isArray(response)) {
        console.log('응답이 배열입니다:', response);
        return response as DailyProgressWeekItem[];
      }
      
      // 응답이 래핑된 객체인 경우 (data 속성에 배열이 있는 경우)
      if (response && response.data && Array.isArray(response.data)) {
        console.log('응답이 data 속성에 래핑되어 있습니다:', response.data);
        return response.data as DailyProgressWeekItem[];
      }
      
      // 응답이 래핑된 객체이지만 다른 구조인 경우
      if (response && typeof response === 'object') {
        console.log('응답 구조:', Object.keys(response));
        // 가능한 다른 속성들 확인
        if (response.content && Array.isArray(response.content)) {
          return response.content as DailyProgressWeekItem[];
        }
        if (response.result && Array.isArray(response.result)) {
          return response.result as DailyProgressWeekItem[];
        }
      }
      
      console.warn('예상치 못한 응답 구조:', response);
      return [];
    } catch (error: any) {
      console.error('주간 진행률 API 호출 실패:', error);
      throw error;
    }
  },
};

