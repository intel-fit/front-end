import { request } from './apiConfig';
import type { HomeResponse } from '../types';

export const homeAPI = {
  // 홈 화면 메인 정보 조회
  getHomeData: async (date?: string): Promise<HomeResponse> => {
    const dateParam = date ? `?date=${date}` : '';
    return request<HomeResponse>(`/api/home${dateParam}`, {
      method: 'GET',
    });
  },
};

