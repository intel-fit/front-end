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
const SAVED_WORKOUTS_API_URL = `${WORKOUTS_API_URL}/saved`;

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
  sessionId?: string; // 서버에서 생성하므로 optional
  exerciseName: string;
  category: string;
  workoutDate: string; // ISO string
  sets: WorkoutSet[];
  userId: number | string; // 필수 필드
  exerciseId?: string; // externalId
  imageUrl?: string;
  exerciseImageUrl?: string;
  image?: string;
  imgUrl?: string;
  photoUrl?: string;
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
    
    // 요청 페이로드 상세 로그
    console.log('[WORKOUT][POST] API 요청:', {
      url: WORKOUTS_API_URL,
      method: 'POST',
      payload: JSON.stringify(payload, null, 2),
      payloadDetails: {
        sessionId: payload.sessionId,
        exerciseName: payload.exerciseName,
        category: payload.category,
        workoutDate: payload.workoutDate,
        userId: payload.userId,
        exerciseId: payload.exerciseId,
        setsCount: payload.sets?.length || 0,
        sets: payload.sets,
      },
      hasToken: !!token,
    });
    
    const response = await axios.post(WORKOUTS_API_URL, payload, {
      headers: {
        Authorization: `Bearer ${token || ''}`,
        'Content-Type': 'application/json',
        Accept: 'application/json',
      },
    });
    
    console.log('[WORKOUT][POST] API 응답 성공:', {
      status: response.status,
      data: response.data,
    });
    
    return response.data;
  } catch (error: any) {
    if (axios.isAxiosError(error)) {
      console.error('[WORKOUT][POST] API 에러 상세:', {
        message: error.message,
        status: error.response?.status,
        statusText: error.response?.statusText,
        errorCode: error.response?.data?.code,
        errorMessage: error.response?.data?.message,
        errorData: error.response?.data,
        requestUrl: error.config?.url,
        requestPayload: error.config?.data ? JSON.parse(error.config.data) : null,
      });
    } else {
      console.error('[WORKOUT][POST] 예외:', error);
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

// 운동 기록 세션 완료 상태 토글
export const toggleWorkoutSession = async (sessionId: string): Promise<any> => {
  try {
    const token = await AsyncStorage.getItem(ACCESS_TOKEN_KEY);
    const url = `${WORKOUTS_API_URL}/${encodeURIComponent(sessionId)}/toggle`;
    console.log('[WORKOUT][TOGGLE] 토글 요청:', url);
    const response = await axios.patch(url, {}, {
      headers: {
        Authorization: `Bearer ${token || ''}`,
        'Content-Type': 'application/json',
        Accept: 'application/json',
      },
    });
    console.log('[WORKOUT][TOGGLE] 토글 응답:', response.data);
    return response.data;
  } catch (error: any) {
    if (axios.isAxiosError(error)) {
      console.error('[WORKOUT][TOGGLE] 토글 에러:', {
        message: error.message,
        status: error.response?.status,
        data: error.response?.data,
      });
    } else {
      console.error('[WORKOUT][TOGGLE] 토글 예외:', error);
    }
    throw error;
  }
};

// 이번 주(일~토) 운동 달성률 및 칼로리 목록 조회
export const fetchWeeklyProgress = async (): Promise<DailyProgressWeekItem[]> => {
  try {
    const token = await AsyncStorage.getItem(ACCESS_TOKEN_KEY);
    const url = 'http://43.200.40.140/api/daily-progress/week';
    console.log('주간 진행률 API 호출:', url);
    const response = await axios.get(url, {
      headers: {
        Authorization: `Bearer ${token || ''}`,
        Accept: 'application/json',
      },
    });
    console.log('주간 진행률 API 응답 상태:', response.status);
    console.log('주간 진행률 API 응답 데이터:', JSON.stringify(response.data, null, 2));
    
    // 응답이 객체로 감싸져 있는 경우 처리
    let rawData = response.data;
    if (rawData && typeof rawData === 'object' && !Array.isArray(rawData)) {
      // data 필드가 있으면 사용
      if (rawData.data && Array.isArray(rawData.data)) {
        rawData = rawData.data;
      }
      // results 필드가 있으면 사용
      else if (rawData.results && Array.isArray(rawData.results)) {
        rawData = rawData.results;
      }
    }
    
    // 배열이 아니면 빈 배열 반환
    if (!Array.isArray(rawData)) {
      console.warn('주간 진행률 응답이 배열이 아닙니다:', rawData);
      return [];
    }
    
    // 필드명 변환 (totalCalories -> totalCalorie 등)
    const data = rawData.map((item: any) => ({
      date: item.date || item.mealDate || item.exerciseDate || '',
      exerciseRate: item.exerciseRate ?? item.exercise_rate ?? item.rate ?? 0,
      totalCalorie: item.totalCalorie ?? item.totalCalories ?? item.calorie ?? item.total_calorie ?? item.total_calories ?? 0,
    })) as DailyProgressWeekItem[];
    
    console.log('주간 진행률 파싱된 데이터:', JSON.stringify(data, null, 2));
    return data;
  } catch (error: any) {
    if (axios.isAxiosError(error)) {
      console.error('주간 진행률 조회 에러:', {
        message: error.message,
        status: error.response?.status,
        statusText: error.response?.statusText,
        data: error.response?.data,
        headers: error.response?.headers,
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
    console.log('월별 진행률 API 호출:', url);
    const response = await axios.get(url, {
      headers: {
        Authorization: `Bearer ${token || ''}`,
        Accept: 'application/json',
      },
    });
    console.log('월별 진행률 API 응답 상태:', response.status);
    console.log('월별 진행률 API 응답 데이터:', JSON.stringify(response.data, null, 2));
    
    // 응답이 객체로 감싸져 있는 경우 처리
    let rawData = response.data;
    if (rawData && typeof rawData === 'object' && !Array.isArray(rawData)) {
      // data 필드가 있으면 사용
      if (rawData.data && Array.isArray(rawData.data)) {
        rawData = rawData.data;
      }
      // results 필드가 있으면 사용
      else if (rawData.results && Array.isArray(rawData.results)) {
        rawData = rawData.results;
      }
    }
    
    // 배열이 아니면 빈 배열 반환
    if (!Array.isArray(rawData)) {
      console.warn('월별 진행률 응답이 배열이 아닙니다:', rawData);
      return [];
    }
    
    // 필드명 변환 (totalCalories -> totalCalorie 등)
    const data = rawData.map((item: any) => ({
      date: item.date || item.mealDate || item.exerciseDate || '',
      exerciseRate: item.exerciseRate ?? item.exercise_rate ?? item.rate ?? 0,
      totalCalorie: item.totalCalorie ?? item.totalCalories ?? item.calorie ?? item.total_calorie ?? item.total_calories ?? 0,
    })) as DailyProgressWeekItem[];
    
    console.log('월별 진행률 파싱된 데이터:', JSON.stringify(data, null, 2));
    return data;
  } catch (error: any) {
    if (axios.isAxiosError(error)) {
      console.error('월별 진행률 조회 에러:', {
        message: error.message,
        status: error.response?.status,
        statusText: error.response?.statusText,
        data: error.response?.data,
        headers: error.response?.headers,
      });
    } else {
      console.error('월별 진행률 조회 예외:', error);
    }
    throw error;
  }
};

// 오늘의 운동 달성률과 칼로리 조회
export const fetchTodayProgress = async (): Promise<DailyProgressWeekItem> => {
  try {
    const token = await AsyncStorage.getItem(ACCESS_TOKEN_KEY);
    const url = 'http://43.200.40.140/api/daily-progress/today';
    const response = await axios.get(url, {
      headers: {
        Authorization: `Bearer ${token || ''}`,
        Accept: 'application/json',
      },
    });
    return response.data as DailyProgressWeekItem;
  } catch (error: any) {
    if (axios.isAxiosError(error)) {
      console.error('오늘 진행률 조회 에러:', {
        message: error.message,
        status: error.response?.status,
        data: error.response?.data,
      });
    } else {
      console.error('오늘 진행률 조회 예외:', error);
    }
    throw error;
  }
};

// 최근 N일간 운동 달성률 및 칼로리 목록 조회
export const fetchRecentProgress = async (days: number = 7): Promise<DailyProgressWeekItem[]> => {
  try {
    const token = await AsyncStorage.getItem(ACCESS_TOKEN_KEY);
    const url = `http://43.200.40.140/api/daily-progress/recent?days=${days}`;
    const response = await axios.get(url, {
      headers: {
        Authorization: `Bearer ${token || ''}`,
        Accept: 'application/json',
      },
    });
    return (response.data as DailyProgressWeekItem[]) || [];
  } catch (error: any) {
    if (axios.isAxiosError(error)) {
      console.error('최근 진행률 조회 에러:', {
        message: error.message,
        status: error.response?.status,
        data: error.response?.data,
      });
    } else {
      console.error('최근 진행률 조회 예외:', error);
    }
    throw error;
  }
};

// 특정 날짜의 운동 달성률과 칼로리 조회
export const fetchDateProgress = async (date: string): Promise<DailyProgressWeekItem> => {
  try {
    const token = await AsyncStorage.getItem(ACCESS_TOKEN_KEY);
    const url = `http://43.200.40.140/api/daily-progress/date?date=${encodeURIComponent(date)}`;
    const response = await axios.get(url, {
      headers: {
        Authorization: `Bearer ${token || ''}`,
        Accept: 'application/json',
      },
    });
    return response.data as DailyProgressWeekItem;
  } catch (error: any) {
    if (axios.isAxiosError(error)) {
      console.error('날짜별 진행률 조회 에러:', {
        message: error.message,
        status: error.response?.status,
        data: error.response?.data,
      });
    } else {
      console.error('날짜별 진행률 조회 예외:', error);
    }
    throw error;
  }
};

// 오늘 운동시간 누적 API
export interface PostWorkoutTimeRequest {
  userId: number;
  seconds: number;
}

export const postWorkoutTime = async (userId: number, seconds: number): Promise<void> => {
  try {
    const token = await AsyncStorage.getItem(ACCESS_TOKEN_KEY);
    const url = `${WORKOUTS_API_URL}/time`;
    const payload: PostWorkoutTimeRequest = {
      userId,
      seconds,
    };
    console.log('[WORKOUT][TIME] 운동 시간 누적 요청:', payload);
    const response = await axios.post(url, payload, {
      headers: {
        Authorization: `Bearer ${token || ''}`,
        'Content-Type': 'application/json',
        Accept: 'application/json',
      },
    });
    console.log('[WORKOUT][TIME] 운동 시간 누적 응답:', response.status);
  } catch (error: any) {
    if (axios.isAxiosError(error)) {
      console.error('[WORKOUT][TIME] 운동 시간 누적 에러:', {
        message: error.message,
        status: error.response?.status,
        data: error.response?.data,
      });
    } else {
      console.error('[WORKOUT][TIME] 운동 시간 누적 예외:', error);
    }
    throw error;
  }
};

// 오늘 운동시간 조회 API
export interface GetTodayWorkoutTimeResponse {
  userId: number;
  totalSeconds: number;
}

export const getTodayWorkoutTime = async (userId: number): Promise<GetTodayWorkoutTimeResponse> => {
  try {
    const token = await AsyncStorage.getItem(ACCESS_TOKEN_KEY);
    const url = `${WORKOUTS_API_URL}/time/${encodeURIComponent(userId)}`;
    console.log('[WORKOUT][TIME] 오늘 운동 시간 조회 요청:', url);
    const response = await axios.get(url, {
      headers: {
        Authorization: `Bearer ${token || ''}`,
        Accept: 'application/json',
      },
    });
    console.log('[WORKOUT][TIME] 오늘 운동 시간 조회 응답:', response.data);
    return response.data as GetTodayWorkoutTimeResponse;
  } catch (error: any) {
    if (axios.isAxiosError(error)) {
      console.error('[WORKOUT][TIME] 오늘 운동 시간 조회 에러:', {
        message: error.message,
        status: error.response?.status,
        data: error.response?.data,
      });
      // 404나 다른 에러 시 기본값 반환
      if (error.response?.status === 404) {
        return { userId, totalSeconds: 0 };
      }
    } else {
      console.error('[WORKOUT][TIME] 오늘 운동 시간 조회 예외:', error);
    }
    // 에러 발생 시 기본값 반환
    return { userId, totalSeconds: 0 };
  }
};

// 운동 저장 제목 API
export interface SaveWorkoutTitleRequest {
  userId: number;
  saveTitle: string;
}

export interface SaveWorkoutTitleResponse {
  sessionId: string;
  saveTitle: string;
  updatedCount: number;
}

export const saveWorkoutTitle = async (
  userId: number,
  saveTitle: string
): Promise<SaveWorkoutTitleResponse> => {
  try {
    const token = await AsyncStorage.getItem(ACCESS_TOKEN_KEY);
    const url = `${WORKOUTS_API_URL}/save`;
    const payload: SaveWorkoutTitleRequest = {
      userId,
      saveTitle,
    };
    console.log('[WORKOUT][SAVE] API 요청:', {
      url,
      method: 'POST',
      payload,
      hasToken: !!token,
    });
    
    const response = await axios.post(url, payload, {
      headers: {
        Authorization: `Bearer ${token || ''}`,
        'Content-Type': 'application/json',
        Accept: 'application/json',
      },
    });
    
    console.log('[WORKOUT][SAVE] API 응답 성공:', {
      status: response.status,
      data: response.data,
      sessionId: response.data?.sessionId,
      saveTitle: response.data?.saveTitle,
      updatedCount: response.data?.updatedCount,
    });
    
    // AI 피드백 전송 로그 (서버에서 자동 처리됨)
    if (response.data?.updatedCount > 0) {
      console.log('[WORKOUT][SAVE] AI 피드백 전송됨:', {
        savedSets: response.data.updatedCount,
        saveTitle: response.data.saveTitle,
      });
    }
    
    return response.data as SaveWorkoutTitleResponse;
  } catch (error: any) {
    if (axios.isAxiosError(error)) {
      console.error('[WORKOUT][SAVE] API 에러:', {
        message: error.message,
        status: error.response?.status,
        statusText: error.response?.statusText,
        data: error.response?.data,
        url: error.config?.url,
        payload: error.config?.data,
      });
    } else {
      console.error('[WORKOUT][SAVE] 예외:', error);
    }
    throw error;
  }
};

// 저장된 운동 기록 조회 API
export interface SavedWorkoutRecord {
  id: number;
  setNumber: number;
  weight: number;
  reps: number;
  category?: string;
  exerciseName: string;
  workoutDate: string;
}

export interface SavedWorkoutSession {
  sessionId: string;
  records: SavedWorkoutRecord[];
}

export interface SavedWorkoutGroup {
  title: string;
  sessions: SavedWorkoutSession[];
}

export const fetchSavedWorkouts = async (
  userId: number
): Promise<SavedWorkoutGroup[]> => {
  try {
    const token = await AsyncStorage.getItem(ACCESS_TOKEN_KEY);
    const url = `${SAVED_WORKOUTS_API_URL}/${encodeURIComponent(userId)}`;
    console.log('[WORKOUT][SAVED] 조회 요청:', url);
    const response = await axios.get(url, {
      headers: {
        Authorization: `Bearer ${token || ''}`,
        Accept: 'application/json',
      },
    });
    console.log('[WORKOUT][SAVED] 조회 응답:', response.data);
    return Array.isArray(response.data) ? response.data : [];
  } catch (error: any) {
    if (axios.isAxiosError(error)) {
      console.error('[WORKOUT][SAVED] 조회 에러:', {
        message: error.message,
        status: error.response?.status,
        data: error.response?.data,
      });
    } else {
      console.error('[WORKOUT][SAVED] 조회 예외:', error);
    }
    throw error;
  }
};

