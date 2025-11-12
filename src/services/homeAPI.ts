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
  // GET /api/daily-progress/week
  // 응답: [{ date: "2025-11-11", exerciseRate: 0, totalCalorie: 0 }, ...]
  getWeeklyProgress: async (): Promise<DailyProgressWeekItem[]> => {
    try {
      console.log('주간 진행률 API 호출: GET /api/daily-progress/week');
      const response = await request<DailyProgressWeekItem[]>(`/api/daily-progress/week`, {
        method: 'GET',
      });
      
      // 배열로 반환
      if (Array.isArray(response)) {
        console.log('주간 진행률 데이터 수신:', response.length, '개');
        return response;
      }
      
      // 예외 처리
      console.warn('주간 진행률 응답이 배열이 아닙니다:', response);
      return [];
    } catch (error: any) {
      console.error('주간 진행률 API 호출 실패:', error);
      throw error;
    }
  },
};

