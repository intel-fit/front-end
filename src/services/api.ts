import AsyncStorage from '@react-native-async-storage/async-storage';

// 백엔드 서버 주소
const API_BASE_URL = 'http://43.200.40.140';

// 토큰 저장 키 (AsyncStorage에 저장할 때 사용)
const ACCESS_TOKEN_KEY = 'access_token';
const REFRESH_TOKEN_KEY = 'refresh_token';

// API 응답 공통 타입 정의
interface ApiResponse<T = any> {
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
const request = async <T = any>(
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

/**
 * 인증 관련 API 함수들
 * 회원가입, 로그인, 비밀번호 찾기 등
 */
export const authAPI = {
  /**
   * 아이디 중복 확인
   * @param userId 확인할 아이디
   * @returns 사용 가능 여부와 메시지
   */
  checkUserId: async (userId: string): Promise<{available: boolean; message: string}> => {
    return request<{available: boolean; message: string}>(`/api/users/check-userId?userId=${userId}`, {
      method: 'GET',
    });
  },

  /**
   * 이메일 인증코드 발송
   * @param email 인증코드를 받을 이메일 주소
   * @returns 성공 여부와 메시지
   */
  sendVerificationCode: async (email: string): Promise<ApiResponse> => {
    try {
      console.log('이메일 인증코드 발송 요청:', email);
      const response = await request<ApiResponse>('/api/users/send-verification-code', {
        method: 'POST',
        body: JSON.stringify({email}),
      });
      console.log('이메일 인증코드 발송 응답:', response);
      return response;
    } catch (error: any) {
      console.error('이메일 인증코드 발송 에러:', error);
      
      // 서버 내부 오류 (500)
      if (error.status === 500 || error.message?.includes('500') || error.message?.includes('서버 내부 오류')) {
        throw new Error('서버 내부 오류가 발생했습니다. 잠시 후 다시 시도해주세요.');
      }
      
      // 잘못된 요청 (400) - 이메일 형식 오류
      if (error.status === 400 || error.message?.includes('400')) {
        throw new Error('잘못된 이메일 형식입니다');
      }
      
      throw error;
    }
  },

  /**
   * 회원가입
   * @param signupData 회원가입 정보 (아이디, 비밀번호, 이메일 등)
   * @returns 생성된 사용자 ID
   */
  signup: async (signupData: {
    userId: string;
    name: string;
    email: string;
    password: string;
    passwordConfirm: string;
    birthDate: string;
    phoneNumber: string;
    verificationCode: string;
    gender: 'M' | 'F';
    height: number;
    weight: number;
    weightGoal: number;
    healthGoal: string;
    workoutDaysPerWeek?: string;
  }): Promise<ApiResponse<{userId: number}>> => {
    return request<ApiResponse<{userId: number}>>('/api/users/signup', {
      method: 'POST',
      body: JSON.stringify(signupData),
    });
  },

  /**
   * 로그인
   * @param userId 사용자 아이디
   * @param password 비밀번호
   * @returns 토큰 정보 (자동으로 AsyncStorage에 저장됨)
   */
  login: async (userId: string, password: string): Promise<{
    success: boolean;
    message: string;
    accessToken?: string;
    refreshToken?: string;
    tokenType?: string;
    expiresIn?: number;
  }> => {
    try {
      const response = await request<{
        success: boolean;
        message: string;
        accessToken?: string;
        refreshToken?: string;
        tokenType?: string;
        expiresIn?: number;
      }>('/api/users/login', {
        method: 'POST',
        body: JSON.stringify({userId, password}),
      });

      // 응답 받은 토큰을 AsyncStorage에 저장 (다음 요청부터 자동 사용)
      if (response.accessToken) {
        await AsyncStorage.setItem(ACCESS_TOKEN_KEY, response.accessToken);
      }
      if (response.refreshToken) {
        await AsyncStorage.setItem(REFRESH_TOKEN_KEY, response.refreshToken);
      }

      return response;
    } catch (error: any) {
      // 인증 실패 (401) - 아이디/비밀번호 오류
      if (error.status === 401 || error.message?.includes('401') || error.message?.includes('올바르지 않습니다')) {
        throw new Error('아이디 또는 비밀번호가 올바르지 않습니다');
      }
      throw error;
    }
  },

  /**
   * 아이디 찾기
   * @param email 등록된 이메일 주소
   * @returns 마스킹된 아이디와 메시지
   */
  findUserId: async (email: string): Promise<{
    success: boolean;
    message: string;
    maskedUserId?: string;
  }> => {
    return request<{
      success: boolean;
      message: string;
      maskedUserId?: string;
    }>('/api/users/find-userId', {
      method: 'POST',
      body: JSON.stringify({email}),
    });
  },

  /**
   * 비밀번호 재설정 요청
   * 이메일로 임시 비밀번호를 발송합니다
   * @param email 등록된 이메일 주소
   * @returns 성공 여부와 메시지
   */
  resetPassword: async (email: string): Promise<ApiResponse> => {
    return request<ApiResponse>('/api/users/reset-password', {
      method: 'POST',
      body: JSON.stringify({email}),
    });
  },

  /**
   * 비밀번호 변경
   * 임시 비밀번호를 사용해 새 비밀번호로 변경
   * @param tempPassword 임시 비밀번호
   * @param newPassword 새 비밀번호
   * @param newPasswordConfirm 새 비밀번호 확인
   * @returns 성공 여부와 메시지
   */
  changePassword: async (tempPassword: string, newPassword: string, newPasswordConfirm: string): Promise<ApiResponse> => {
    try {
      return await request<ApiResponse>('/api/users/change-password', {
        method: 'PUT',
        body: JSON.stringify({
          tempPassword,
          newPassword,
          newPasswordConfirm,
        }),
      });
    } catch (error: any) {
      // 임시 비밀번호 오류 또는 만료 (400)
      if (error.status === 400 || error.message?.includes('400') || error.message?.includes('올바르지 않거나 만료')) {
        throw new Error('임시 비밀번호가 올바르지 않거나 만료되었습니다');
      }
      
      // 사용자를 찾을 수 없음 (404)
      if (error.status === 404 || error.message?.includes('404') || error.message?.includes('찾을 수 없습니다')) {
        throw new Error('임시 비밀번호에 해당하는 사용자를 찾을 수 없습니다');
      }
      
      throw error;
    }
  },

  /**
   * 로그아웃
   * 서버에 로그아웃 요청 후 로컬 토큰 삭제
   */
  logout: async (): Promise<void> => {
    const token = await AsyncStorage.getItem(ACCESS_TOKEN_KEY);
    
    // 서버에 로그아웃 요청 (실패해도 계속 진행)
    if (token) {
      try {
        await request('/api/users/logout', {
          method: 'POST',
          body: JSON.stringify({accessToken: token}),
        });
      } catch (error) {
        console.error('Logout error:', error);
        // 서버 요청 실패해도 로컬 토큰은 삭제
      }
    }
    
    // 로컬 저장소에서 토큰 삭제
    await AsyncStorage.removeItem(ACCESS_TOKEN_KEY);
    await AsyncStorage.removeItem(REFRESH_TOKEN_KEY);
  },

  /**
   * 토큰 재발급
   * 만료된 accessToken을 refreshToken으로 새로 발급받음
   * @returns 새로 발급된 토큰 정보
   */
  refreshToken: async (): Promise<{
    success: boolean;
    message: string;
    accessToken?: string;
    tokenType?: string;
    expiresIn?: number;
  }> => {
    // 저장된 refreshToken 가져오기
    const refreshToken = await AsyncStorage.getItem(REFRESH_TOKEN_KEY);
    if (!refreshToken) {
      throw new Error('No refresh token available');
    }

    // 서버에 토큰 재발급 요청
    const response = await request<{
      success: boolean;
      message: string;
      accessToken?: string;
      tokenType?: string;
      expiresIn?: number;
    }>('/api/users/refresh-token', {
      method: 'POST',
      body: JSON.stringify({refreshToken}),
    });

    // 새로 받은 accessToken 저장
    if (response.accessToken) {
      await AsyncStorage.setItem(ACCESS_TOKEN_KEY, response.accessToken);
    }

    return response;
  },

  /**
   * 현재 저장된 토큰 가져오기
   * @returns accessToken 또는 null
   */
  getAccessToken: async (): Promise<string | null> => {
    return await AsyncStorage.getItem(ACCESS_TOKEN_KEY);
  },

  /**
   * 로그인 상태 확인
   * @returns 토큰 존재 여부 (true = 로그인됨, false = 비로그인)
   */
  isAuthenticated: async (): Promise<boolean> => {
    const token = await AsyncStorage.getItem(ACCESS_TOKEN_KEY);
    return !!token; // 토큰이 있으면 true, 없으면 false
  },
};

/**
 * 기본 API 요청 함수
 * 인증이 필요한 다른 API 호출 시 사용
 * 예: apiRequest('/api/profile', { method: 'GET' })
 */
export const apiRequest = request;


