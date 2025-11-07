import axios from 'axios';
import AsyncStorage from '@react-native-async-storage/async-storage';
import { ACCESS_TOKEN_KEY } from '../services/apiConfig';
import type { DailyProgressWeekItem } from '../types';

interface ExerciseApiParams {
  bodyPart?: string;
  keyword?: string;
  page?: number;
  size?: number;
  sort?: string;
}

// Swagger 응답 타입 정의
interface Exercise {
  externalId?: string;
  name: string;
  bodyPart: string;
  targetMuscle?: string;
  [key: string]: any;
}

interface ExerciseApiResponse {
  totalPages: number;
  totalElements: number;
  pageable: {
    pageNumber: number;
    paged: boolean;
    pageSize: number;
    unpaged: boolean;
    offset: number;
    sort: Array<{
      direction: string;
      nullHandling: string;
      ascending: boolean;
      property: string;
      ignoreCase: boolean;
    }>;
  };
  first: boolean;
  last: boolean;
  numberOfElements: number;
  size: number;
  content: Exercise[];
  number: number;
  sort: Array<{
    direction: string;
    nullHandling: string;
    ascending: boolean;
    property: string;
    ignoreCase: boolean;
  }>;
  empty: boolean;
}

const EXERCISE_API_URL = 'http://43.200.40.140/api/exercise-db';
const WORKOUTS_API_URL = 'http://43.200.40.140/api/workouts';

export const fetchExercises = async (params: ExerciseApiParams = {}): Promise<ExerciseApiResponse> => {
  try {
    // React Native에서는 AsyncStorage 사용
    // 통일된 키 사용 (apiConfig.ACCESS_TOKEN_KEY = 'access_token')
    const token = await AsyncStorage.getItem(ACCESS_TOKEN_KEY);
    
    // 쿼리 구성 (Swagger 명세에 따라)
    const queryParams = new URLSearchParams();
    if (params.bodyPart) queryParams.append('bodyPart', params.bodyPart);
    if (params.keyword) queryParams.append('keyword', params.keyword);
    // pageable 파라미터
    if (params.page !== undefined) queryParams.append('page', params.page.toString());
    if (params.size !== undefined) queryParams.append('size', params.size.toString());
    if (params.sort) {
      // sort는 배열 형태로 전달될 수 있음 (예: "name,asc")
      queryParams.append('sort', params.sort);
    }

    const url = `${EXERCISE_API_URL}?${queryParams.toString()}`;

    console.log('API 요청 URL:', url);
    console.log('토큰:', token ? '있음' : '없음');

    const response = await axios.get(url, {
      headers: {
        Authorization: `Bearer ${token || ''}`,
        Accept: 'application/json',
      },
    });

    console.log('API 응답 성공:', response.data);
    return response.data;
  } catch (error: any) {
    if (axios.isAxiosError(error)) {
      console.error('API 요청 에러:', {
        message: error.message,
        status: error.response?.status,
        statusText: error.response?.statusText,
        data: error.response?.data,
      });
    } else {
      console.error('예상치 못한 에러:', error);
    }
    throw error;
  }
};

// 단일 운동 상세 조회
export const fetchExerciseDetail = async (externalId: string): Promise<any> => {
  try {
    const token = await AsyncStorage.getItem(ACCESS_TOKEN_KEY);
    const url = `${EXERCISE_API_URL}/${encodeURIComponent(externalId)}`;
    const response = await axios.get(url, {
      headers: {
        Authorization: `Bearer ${token || ''}`,
        Accept: 'application/json',
      },
    });
    return response.data;
  } catch (error: any) {
    if (axios.isAxiosError(error)) {
      console.error('운동 상세 API 에러:', {
        message: error.message,
        status: error.response?.status,
        data: error.response?.data,
      });
    } else {
      console.error('운동 상세 예외:', error);
    }
    throw error;
  }
};

// 특정 유저의 운동 기록(세션 단위) 조회
export interface WorkoutSet {
  setNumber: number;
  weight: number;
  reps: number;
}

export interface WorkoutSession {
  sessionId: string;
  exerciseName: string;
  category: string;
  workoutDate: string; // ISO string
  sets: WorkoutSet[];
  userId?: number | string;
  exerciseId?: string; // externalId
}

export const fetchUserWorkouts = async (userId: string | number): Promise<WorkoutSession[]> => {
  try {
    const token = await AsyncStorage.getItem(ACCESS_TOKEN_KEY);
    const url = `${WORKOUTS_API_URL}/${encodeURIComponent(String(userId))}`;
    const response = await axios.get(url, {
      headers: {
        Authorization: `Bearer ${token || ''}`,
        Accept: 'application/json',
      },
    });
    // 서버가 배열을 반환한다고 가정
    return (response.data as WorkoutSession[]) || [];
  } catch (error: any) {
    if (axios.isAxiosError(error)) {
      console.error('유저 운동 기록 조회 에러:', {
        message: error.message,
        status: error.response?.status,
        data: error.response?.data,
      });
    } else {
      console.error('유저 운동 기록 조회 예외:', error);
    }
    throw error;
  }
};

// 운동 기록 저장 (세션 단위)
export const postWorkoutSession = async (payload: WorkoutSession): Promise<any> => {
  try {
    const token = await AsyncStorage.getItem(ACCESS_TOKEN_KEY);
    const response = await axios.post(WORKOUTS_API_URL, payload, {
      headers: {
        Authorization: `Bearer ${token || ''}`,
        'Content-Type': 'application/json',
        Accept: 'application/json',
      },
    });
    return response.data;
  } catch (error: any) {
    if (axios.isAxiosError(error)) {
      console.error('운동 기록 저장 에러:', {
        message: error.message,
        status: error.response?.status,
        data: error.response?.data,
      });
    } else {
      console.error('운동 기록 저장 예외:', error);
    }
    throw error;
  }
};

// 운동 기록 세션 삭제
export const deleteWorkoutSession = async (sessionId: string): Promise<any> => {
  try {
    const token = await AsyncStorage.getItem(ACCESS_TOKEN_KEY);
    const url = `${WORKOUTS_API_URL}/${encodeURIComponent(sessionId)}`;
    // DELETE 메서드에서 body를 보낼 때는 config.data 사용
    const response = await axios.delete(url, {
      headers: {
        Authorization: `Bearer ${token || ''}`,
        Accept: 'application/json',
      },
    });
    return response.data;
  } catch (error: any) {
    if (axios.isAxiosError(error)) {
      console.error('운동 기록 세션 삭제 에러:', {
        message: error.message,
        status: error.response?.status,
        data: error.response?.data,
      });
    } else {
      console.error('운동 기록 세션 삭제 예외:', error);
    }
    throw error;
  }
};

// 이번 주(일~토) 운동 달성률 및 칼로리 목록 조회
export const fetchWeeklyProgress = async (): Promise<DailyProgressWeekItem[]> => {
  try {
    const token = await AsyncStorage.getItem(ACCESS_TOKEN_KEY);
    const url = 'http://43.200.40.140/api/daily-progress/week';
    const response = await axios.get(url, {
      headers: {
        Authorization: `Bearer ${token || ''}`,
        Accept: 'application/json',
      },
    });
    return (response.data as DailyProgressWeekItem[]) || [];
  } catch (error: any) {
    if (axios.isAxiosError(error)) {
      console.error('주간 진행률 조회 에러:', {
        message: error.message,
        status: error.response?.status,
        data: error.response?.data,
      });
    } else {
      console.error('주간 진행률 조회 예외:', error);
    }
    throw error;
  }
};

// 월별 운동 달성률 및 칼로리 목록 조회
export const fetchMonthlyProgress = async (yearMonth: string): Promise<DailyProgressWeekItem[]> => {
  try {
    const token = await AsyncStorage.getItem(ACCESS_TOKEN_KEY);
    const url = `http://43.200.40.140/api/daily-progress/month?yearMonth=${encodeURIComponent(yearMonth)}`;
    const response = await axios.get(url, {
      headers: {
        Authorization: `Bearer ${token || ''}`,
        Accept: 'application/json',
      },
    });
    return (response.data as DailyProgressWeekItem[]) || [];
  } catch (error: any) {
    if (axios.isAxiosError(error)) {
      console.error('월별 진행률 조회 에러:', {
        message: error.message,
        status: error.response?.status,
        data: error.response?.data,
      });
    } else {
      console.error('월별 진행률 조회 예외:', error);
    }
    throw error;
  }
};

