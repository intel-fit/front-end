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
    console.log('API 요청:', `${API_BASE_URL}${endpoint}`);
    console.log('요청 옵션:', {method: options.method || 'GET', headers});
    
    // POST/PUT 요청인 경우 본문도 로깅
    if (options.body && (options.method === 'POST' || options.method === 'PUT' || options.method === 'PATCH')) {
      try {
        const bodyData = typeof options.body === 'string' ? JSON.parse(options.body) : options.body;
        console.log('요청 본문:', JSON.stringify(bodyData, null, 2));
      } catch (e) {
        console.log('요청 본문 (원본):', options.body);
      }
    }
    
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
      // 400 에러인 경우 더 자세한 정보 로깅
      if (response.status === 400) {
        console.error('400 에러 상세 정보:', {
          status: response.status,
          statusText: response.statusText,
          data: JSON.stringify(data, null, 2),
          code: data.code,
          message: data.message,
          errors: data.errors, // validation errors가 있을 수 있음
          details: data.details, // 상세 에러 정보
          validationErrors: data.validationErrors, // 추가 검증 에러
          fieldErrors: data.fieldErrors, // 필드별 에러
        });
        
        // 응답 본문 전체를 다시 읽어서 확인
        try {
          const responseClone = response.clone();
          const responseText = await responseClone.text();
          console.error('400 에러 원본 응답:', responseText);
        } catch (e) {
          console.error('응답 본문 읽기 실패:', e);
        }
      }
      
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
      stack: error.stack,
    });
    
    // Network request failed 에러 처리
    if (error.message === 'Network request failed' || error.message?.includes('Network')) {
      console.error('네트워크 연결 실패:', {
        url: `${API_BASE_URL}${endpoint}`,
        message: '서버에 연결할 수 없습니다. 인터넷 연결을 확인해주세요.',
      });
      const networkError: any = new Error('네트워크 연결에 실패했습니다. 인터넷 연결을 확인해주세요.');
      networkError.status = 0;
      throw networkError;
    }
    
    // 이미 Error 객체면 그대로 전달
    if (error instanceof Error) {
      throw error;
    }
    
    // 그 외의 경우 Error 객체로 감싸서 전달
    throw new Error(error?.message || '알 수 없는 오류가 발생했습니다');
  }
};

