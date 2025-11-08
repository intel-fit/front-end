import AsyncStorage from "@react-native-async-storage/async-storage";
import {
  request,
  ApiResponse,
  ACCESS_TOKEN_KEY,
  REFRESH_TOKEN_KEY,
} from "./apiConfig";

/**
 * JWT 토큰에서 페이로드 추출
 */
const decodeJWT = (token: string): any => {
  try {
    const base64Url = token.split('.')[1];
    const base64 = base64Url.replace(/-/g, '+').replace(/_/g, '/');
    const jsonPayload = decodeURIComponent(
      atob(base64)
        .split('')
        .map((c) => '%' + ('00' + c.charCodeAt(0).toString(16)).slice(-2))
        .join('')
    );
    return JSON.parse(jsonPayload);
  } catch (error) {
    console.error('[AUTH] JWT 디코딩 실패:', error);
    return null;
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
  checkUserId: async (
    userId: string
  ): Promise<{ available: boolean; message: string }> => {
    return request<{ available: boolean; message: string }>(
      `/api/users/check-userId?userId=${userId}`,
      {
        method: "GET",
      }
    );
  },

  /**
   * 이메일 인증코드 발송
   * @param email 인증코드를 받을 이메일 주소
   * @returns 성공 여부와 메시지
   */
  sendVerificationCode: async (email: string): Promise<ApiResponse> => {
    try {
      console.log("이메일 인증코드 발송 요청:", email);
      const response = await request<ApiResponse>(
        "/api/users/send-verification-code",
        {
          method: "POST",
          body: JSON.stringify({ email }),
        }
      );
      console.log("이메일 인증코드 발송 응답:", response);
      return response;
    } catch (error: any) {
      console.error("이메일 인증코드 발송 에러:", error);

      // 서버 내부 오류 (500)
      if (
        error.status === 500 ||
        error.message?.includes("500") ||
        error.message?.includes("서버 내부 오류")
      ) {
        throw new Error(
          "서버 내부 오류가 발생했습니다. 잠시 후 다시 시도해주세요."
        );
      }

      // 잘못된 요청 (400) - 이메일 형식 오류
      if (error.status === 400 || error.message?.includes("400")) {
        throw new Error("잘못된 이메일 형식입니다");
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
    gender: "M" | "F";
    height: number;
    weight: number;
    weightGoal: number;
    healthGoal: string;
    workoutDaysPerWeek?: string;
  }): Promise<ApiResponse<{ userId: number }>> => {
    return request<ApiResponse<{ userId: number }>>("/api/users/signup", {
      method: "POST",
      body: JSON.stringify(signupData),
    });
  },

  /**
   * 로그인
   * @param userId 사용자 아이디
   * @param password 비밀번호
   * @returns 토큰 정보 (자동으로 AsyncStorage에 저장됨)
   */
  login: async (
    userId: string,
    password: string
  ): Promise<{
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
      }>("/api/users/login", {
        method: "POST",
        body: JSON.stringify({ userId, password }),
      });

      // 응답 받은 토큰을 AsyncStorage에 저장 (다음 요청부터 자동 사용)
      if (response.accessToken) {
        await AsyncStorage.setItem(ACCESS_TOKEN_KEY, response.accessToken);
        
        // JWT에서 userPk 추출하여 저장
        const payload = decodeJWT(response.accessToken);
        if (payload && payload.userPk) {
          await AsyncStorage.setItem('userId', String(payload.userPk));
          console.log('[AUTH] userId 저장 완료:', payload.userPk);
        } else {
          console.warn('[AUTH] JWT에서 userPk를 찾을 수 없습니다');
        }
      }
      if (response.refreshToken) {
        await AsyncStorage.setItem(REFRESH_TOKEN_KEY, response.refreshToken);
      }

      return response;
    } catch (error: any) {
      // 인증 실패 (401) - 아이디/비밀번호 오류
      if (
        error.status === 401 ||
        error.message?.includes("401") ||
        error.message?.includes("올바르지 않습니다")
      ) {
        throw new Error("아이디 또는 비밀번호가 올바르지 않습니다");
      }
      throw error;
    }
  },

  /**
   * 아이디 찾기
   * @param email 등록된 이메일 주소
   * @returns 마스킹된 아이디와 메시지
   */
  findUserId: async (
    email: string
  ): Promise<{
    success: boolean;
    message: string;
    maskedUserId?: string;
  }> => {
    return request<{
      success: boolean;
      message: string;
      maskedUserId?: string;
    }>("/api/users/find-userId", {
      method: "POST",
      body: JSON.stringify({ email }),
    });
  },

  /**
   * 비밀번호 재설정 요청
   * 이메일로 임시 비밀번호를 발송합니다
   * @param email 등록된 이메일 주소
   * @returns 성공 여부와 메시지
   */
  resetPassword: async (email: string): Promise<ApiResponse> => {
    return request<ApiResponse>("/api/users/reset-password", {
      method: "POST",
      body: JSON.stringify({ email }),
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
  changePassword: async (
    tempPassword: string,
    newPassword: string,
    newPasswordConfirm: string
  ): Promise<ApiResponse> => {
    try {
      return await request<ApiResponse>("/api/users/change-password", {
        method: "PUT",
        body: JSON.stringify({
          tempPassword,
          newPassword,
          newPasswordConfirm,
        }),
      });
    } catch (error: any) {
      // 임시 비밀번호 오류 또는 만료 (400)
      if (
        error.status === 400 ||
        error.message?.includes("400") ||
        error.message?.includes("올바르지 않거나 만료")
      ) {
        throw new Error("임시 비밀번호가 올바르지 않거나 만료되었습니다");
      }

      // 사용자를 찾을 수 없음 (404)
      if (
        error.status === 404 ||
        error.message?.includes("404") ||
        error.message?.includes("찾을 수 없습니다")
      ) {
        throw new Error("임시 비밀번호에 해당하는 사용자를 찾을 수 없습니다");
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
        await request("/api/users/logout", {
          method: "POST",
          body: JSON.stringify({ accessToken: token }),
        });
      } catch (error) {
        console.error("Logout error:", error);
        // 서버 요청 실패해도 로컬 토큰은 삭제
      }
    }

    // 로컬 저장소에서 토큰 및 userId 삭제
    await AsyncStorage.removeItem(ACCESS_TOKEN_KEY);
    await AsyncStorage.removeItem(REFRESH_TOKEN_KEY);
    await AsyncStorage.removeItem('userId');
    await AsyncStorage.removeItem('userName');
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
      throw new Error("No refresh token available");
    }

    // 서버에 토큰 재발급 요청
    const response = await request<{
      success: boolean;
      message: string;
      accessToken?: string;
      tokenType?: string;
      expiresIn?: number;
    }>("/api/users/refresh-token", {
      method: "POST",
      body: JSON.stringify({ refreshToken }),
    });

    // 새로 받은 accessToken 저장
    if (response.accessToken) {
      await AsyncStorage.setItem(ACCESS_TOKEN_KEY, response.accessToken);
      
      // JWT에서 userPk 추출하여 저장
      const payload = decodeJWT(response.accessToken);
      if (payload && payload.userPk) {
        await AsyncStorage.setItem('userId', String(payload.userPk));
        console.log('[AUTH] userId 재저장 완료 (토큰 갱신):', payload.userPk);
      }
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
  /**
   * 사용자 프로필 조회
   */
  getProfile: async (): Promise<{
    id: number;
    userId: string;
    name: string;
    email: string;
    birthDate: string;
    phoneNumber: string;
    height: number;
    weight: number;
    weightGoal: number;
    gender: "M" | "F";
    membershipType: string;
    healthGoal: string;
    workoutDaysPerWeek?: string;
    lastLoginAt: string;
    createdAt: string;
  }> => {
    return request<{
      id: number;
      userId: string;
      name: string;
      email: string;
      birthDate: string;
      phoneNumber: string;
      height: number;
      weight: number;
      weightGoal: number;
      gender: "M" | "F";
      membershipType: string;
      healthGoal: string;
      workoutDaysPerWeek?: string;
      lastLoginAt: string;
      createdAt: string;
    }>("/api/profile", {
      method: "GET",
    });
  },

  /**
   * 사용자 프로필 수정
   */
  updateProfile: async (profileData: {
    name?: string;
    phoneNumber?: string;
    height?: number;
    weight?: number;
    gender?: "M" | "F";
    healthGoal?: string;
    workoutDaysPerWeek?: string;
    weightGoal?: number;
  }): Promise<{
    success: boolean;
    message: string;
    profile?: {
      id: number;
      userId: string;
      name: string;
      email: string;
      birthDate: string;
      phoneNumber: string;
      height: number;
      weight: number;
      gender: "M" | "F";
      membershipType: string;
      healthGoal: string;
      workoutDaysPerWeek?: string;
      weightGoal: number;
      lastLoginAt: string;
      createdAt: string;
    };
  }> => {
    return request<{
      success: boolean;
      message: string;
      profile?: any;
    }>("/api/profile", {
      method: "PUT",
      body: JSON.stringify(profileData),
    });
  },

  /**
   * 로그인 상태에서 비밀번호 변경
   */
  changePasswordLoggedIn: async (
    currentPassword: string,
    newPassword: string,
    newPasswordConfirm: string
  ): Promise<{
    success: boolean;
    message: string;
  }> => {
    return request<{
      success: boolean;
      message: string;
    }>("/api/profile/password", {
      method: "PUT",
      body: JSON.stringify({
        currentPassword,
        newPassword,
        newPasswordConfirm,
      }),
    });
  },
  /**
   * 회원탈퇴

   */
  deleteAccount: async (
    password: string,
    reason: string
  ): Promise<{
    success: boolean;
    message: string;
  }> => {
    try {
      const response = await request<{
        success: boolean;
        message: string;
      }>("/api/profile", {
        method: "DELETE",
        body: JSON.stringify({
          password,
          reason,
        }),
      });

      // 탈퇴 성공 시 토큰 삭제
      if (response.success) {
        await AsyncStorage.removeItem(ACCESS_TOKEN_KEY);
        await AsyncStorage.removeItem(REFRESH_TOKEN_KEY);
      }

      return response;
    } catch (error: any) {
      console.error("회원탈퇴 에러:", error);
      throw error;
    }
  },

  /**
   * AI 식단 추천 생성
   * @returns 추천된 식단 계획
   */
  generateMealPlan: async (): Promise<{
    id: number;
    planName: string;
    description: string;
    totalCalories: number;
    totalCarbs: number;
    totalProtein: number;
    totalFat: number;
    recommendationReason: string;
    isSaved: boolean;
    meals: Array<{
      id: number;
      mealType: "BREAKFAST" | "LUNCH" | "DINNER" | "SNACK" | "OTHER";
      mealTypeName: string;
      totalCalories: number;
      totalCarbs: number;
      totalProtein: number;
      totalFat: number;
      foods: Array<{
        id: number;
        foodName: string;
        servingSize: number;
        calories: number;
        carbs: number;
        protein: number;
        fat: number;
      }>;
    }>;
    createdAt: string;
  }> => {
    return request<any>("/api/recommended-meals/generate", {
      method: "POST",
    });
  },

  /**
   * 추천 식단 저장
   * @param planId 저장할 식단 계획 ID
   * @returns 저장 결과 및 저장된 식단 정보
   */
  saveMealPlan: async (
    planId: number
  ): Promise<{
    success: boolean;
    message: string;
    plan: {
      id: number;
      planName: string;
      isSaved: boolean;
      // ... 전체 식단 정보
    };
  }> => {
    return request<{
      success: boolean;
      message: string;
      plan: any;
    }>(`/api/recommended-meals/${planId}/save`, {
      method: "POST",
    });
  },

  /**
   * 저장된 식단 목록 조회
   * @returns 저장된 식단 목록
   */
  getSavedMealPlans: async (): Promise<Array<any>> => {
    return request<Array<any>>("/api/recommended-meals/saved", {
      method: "GET",
    });
  },

  /**
   * 저장된 식단 삭제
   * @param planId 삭제할 식단 ID
   * @returns 삭제 결과
   */
  deleteMealPlan: async (
    planId: number
  ): Promise<{
    success: boolean;
    message: string;
  }> => {
    return request<{
      success: boolean;
      message: string;
    }>(`/api/recommended-meals/${planId}`, {
      method: "DELETE",
    });
  },
};
