import axios from 'axios';
import AsyncStorage from '@react-native-async-storage/async-storage';
import { ACCESS_TOKEN_KEY } from '../services/apiConfig';

const INBODY_API_URL = 'http://43.200.40.140/api/inbody';

export interface InBodyPayload {
  measurementDate?: string; // "2025-08-04"
  weight?: number;
  muscleMass?: number;
  bodyFatMass?: number;
  skeletalMuscleMass?: number;
  bodyFatPercentage?: number;
  leftArmMuscle?: number;
  rightArmMuscle?: number;
  trunkMuscle?: number;
  leftLegMuscle?: number;
  rightLegMuscle?: number;
  leftArmFat?: number;
  rightArmFat?: number;
  trunkFat?: number;
  leftLegFat?: number;
  rightLegFat?: number;
  totalBodyWater?: number;
  protein?: number;
  mineral?: number;
  bmi?: number;
  bodyFatPercentageStandard?: number;
  obesityDegree?: number;
  visceralFatLevel?: number;
  basalMetabolicRate?: number;
  achievementBadge?: string;
}

export interface InBodyResponse {
  success: boolean;
  message: string;
  inBody?: any;
}

/**
 * 인바디 정보 등록
 */
export const postInBody = async (payload: InBodyPayload): Promise<InBodyResponse> => {
  try {
    const token = await AsyncStorage.getItem(ACCESS_TOKEN_KEY);
    console.log('[INBODY][POST] API 요청 URL:', INBODY_API_URL);
    console.log('[INBODY][POST] 페이로드:', payload);
    
    const response = await axios.post(INBODY_API_URL, payload, {
      headers: {
        Authorization: `Bearer ${token || ''}`,
        'Content-Type': 'application/json',
        Accept: 'application/json',
      },
    });
    
    console.log('[INBODY][POST] API 응답 성공:', response.data);
    return response.data;
  } catch (error: any) {
    if (axios.isAxiosError(error)) {
      console.error('[INBODY][POST] API 에러:', {
        message: error.message,
        status: error.response?.status,
        statusText: error.response?.statusText,
        data: error.response?.data,
      });
    } else {
      console.error('[INBODY][POST] 예상치 못한 에러:', error);
    }
    throw error;
  }
};

/**
 * 인바디 목록 조회 (사용자의 모든 인바디 기록)
 */
export const getInBodyList = async (): Promise<any> => {
  try {
    const token = await AsyncStorage.getItem(ACCESS_TOKEN_KEY);
    console.log('[INBODY][GET] API 요청 URL:', INBODY_API_URL);
    
    const response = await axios.get(INBODY_API_URL, {
      headers: {
        Authorization: `Bearer ${token || ''}`,
        'Content-Type': 'application/json',
        Accept: 'application/json',
      },
    });
    
    console.log('[INBODY][GET] API 응답 성공:', response.data);
    return response.data;
  } catch (error: any) {
    if (axios.isAxiosError(error)) {
      console.error('[INBODY][GET] API 에러:', {
        message: error.message,
        status: error.response?.status,
        statusText: error.response?.statusText,
        data: error.response?.data,
      });
    } else {
      console.error('[INBODY][GET] 예상치 못한 에러:', error);
    }
    throw error;
  }
};

/**
 * 인바디 정보 수정
 * @param inBodyId 인바디 기록 ID
 * @param payload 수정할 데이터 (선택적 필드)
 */
export const patchInBody = async (
  inBodyId: number | string,
  payload: Partial<InBodyPayload>
): Promise<InBodyResponse> => {
  try {
    const token = await AsyncStorage.getItem(ACCESS_TOKEN_KEY);
    const url = `${INBODY_API_URL}/${inBodyId}`;
    console.log('[INBODY][PATCH] API 요청 URL:', url);
    console.log('[INBODY][PATCH] 페이로드:', payload);
    
    const response = await axios.patch(url, payload, {
      headers: {
        Authorization: `Bearer ${token || ''}`,
        'Content-Type': 'application/json',
        Accept: 'application/json',
      },
    });
    
    console.log('[INBODY][PATCH] API 응답 성공:', response.data);
    return response.data;
  } catch (error: any) {
    if (axios.isAxiosError(error)) {
      console.error('[INBODY][PATCH] API 에러:', {
        message: error.message,
        status: error.response?.status,
        statusText: error.response?.statusText,
        data: error.response?.data,
      });
    } else {
      console.error('[INBODY][PATCH] 예상치 못한 에러:', error);
    }
    throw error;
  }
};

