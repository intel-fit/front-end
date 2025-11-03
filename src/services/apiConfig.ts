import AsyncStorage from '@react-native-async-storage/async-storage';

// 백엔드 서버 주소
export const API_BASE_URL = 'http://43.200.40.140';

// 토큰 저장 키 (AsyncStorage에 저장할 때 사용)
export const ACCESS_TOKEN_KEY = 'access_token';
export const REFRESH_TOKEN_KEY = 'refresh_token';

// API 응답 공통 타입 정의
export interface ApiResponse<T = any> {
  success: boolean;
  message?: string;
  data?: T;
}

/**
 * 모든 API 요청에 사용되는 공통 함수
 * - 토큰 자동 첨부
 * - 에러 처리
 * - JSON 파싱
 */
export const request = async <T = any>(
  endpoint: string,        // API 경로 (예: '/api/users/login')
  options: RequestInit = {}, // fetch 옵션 (method, body 등)
): Promise<T> => {
  // 저장된 토큰 가져오기
  const token = await AsyncStorage.getItem(ACCESS_TOKEN_KEY);
  
  // 요청 헤더 설정
  const headers: HeadersInit = {
    'Content-Type': 'application/json',
    ...options.headers, // 옵션에 헤더가 있으면 추가/덮어쓰기
  };

  // 토큰이 있으면 Authorization 헤더에 추가
  if (token) {
    headers['Authorization'] = `Bearer ${token}`;
  }

  try {
    // 서버에 요청 전송
    const response = await fetch(`${API_BASE_URL}${endpoint}`, {
      ...options,
      headers,
    });

    // 응답 타입 확인 (JSON인지 체크)
    const contentType = response.headers.get('content-type');
    let data;
    
    // JSON 응답인 경우
    if (contentType && contentType.includes('application/json')) {
      try {
        data = await response.json();
      } catch (e) {
        // JSON 파싱 실패 시 텍스트로 읽기 (clone()으로 재사용)
        const text = await response.clone().text();
        console.error('JSON 파싱 실패:', text);
        throw new Error(text || `HTTP error! status: ${response.status}`);
      }
    } else {
      // JSON이 아닌 경우 텍스트로 읽기
      const text = await response.text();
      data = {message: text};
    }

    // 에러 응답 처리 (400, 401, 500 등)
    if (!response.ok) {
      const errorMessage = data.message || data.error || data.errorMessage || `HTTP error! status: ${response.status}`;
      const error: any = new Error(errorMessage);
      error.status = response.status; // 상태 코드 저장
      error.data = data; // 에러 데이터 저장
      console.error('API 에러 응답:', {
        status: response.status,
        statusText: response.statusText,
        data,
      });
      throw error;
    }

    // 성공 시 데이터 반환
    return data;
  } catch (error: any) {
    // 에러 로깅
    console.error('API Error:', {
      message: error.message,
      status: error.status,
      data: error.data,
    });
    
    // 이미 Error 객체면 그대로 전달
    if (error instanceof Error) {
      throw error;
    }
    
    // 그 외의 경우 Error 객체로 감싸서 전달
    throw new Error(error?.message || '알 수 없는 오류가 발생했습니다');
  }
};

