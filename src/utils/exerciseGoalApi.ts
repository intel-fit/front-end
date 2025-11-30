import axios from "axios";
import AsyncStorage from "@react-native-async-storage/async-storage";
import { ACCESS_TOKEN_KEY, API_BASE_URL } from "../services/apiConfig";

const BASE_URL = `${API_BASE_URL}/api/exercise-goal`;

export interface ExerciseGoalSummary {
  id?: number;
  weeklyFrequency: string;
  durationPerSession: string;
  exerciseType?: string;
  weeklyCalorieGoal?: number;
  progress?: number;
}

export interface ExerciseGoalPayload {
  weeklyFrequency: string;
  durationPerSession: string;
  exerciseType: string;
  weeklyCalorieGoal: number;
}

const withAuthHeaders = async () => {
  const token = await AsyncStorage.getItem(ACCESS_TOKEN_KEY);
  if (!token) {
    throw new Error("토큰이 없습니다. 다시 로그인해 주세요.");
  }
  return {
    headers: {
      Authorization: `Bearer ${token}`,
      Accept: "application/json",
      "Content-Type": "application/json",
    },
  };
};

export const getExerciseGoalSummary =
  async (): Promise<ExerciseGoalSummary | null> => {
    try {
      const config = await withAuthHeaders();
      const response = await axios.get<ExerciseGoalSummary>(
        `${BASE_URL}/summary`,
        config
      );
      if (__DEV__) {
        console.log("[GOAL][GET] API 응답:", response.data);
      }
      return response.data;
    } catch (error: any) {
      if (axios.isAxiosError(error)) {
        const status = error.response?.status;
        const errorCode = error.response?.data?.code;
        
        // 404: 목표 없음 (일반적인 경우)
        if (status === 404) {
          if (__DEV__) {
            console.log("[GOAL][GET] 목표 없음 (404)");
          }
          return null;
        }
        
        // 400 + COMMON_001: 목표 없음 (백엔드가 목표 없을 때 400을 반환하는 경우)
        if (status === 400 && errorCode === "COMMON_001") {
          if (__DEV__) {
            console.log("[GOAL][GET] 목표 없음 (400 - COMMON_001)");
          }
          return null;
        }
        
        console.error("[GOAL][GET] API 에러:", {
          status,
          errorCode,
          data: error.response?.data,
          message: error.message,
        });
      }
      throw error;
    }
  };

export const saveExerciseGoal = async (
  payload: ExerciseGoalPayload
): Promise<ExerciseGoalSummary> => {
  try {
    const config = await withAuthHeaders();
    if (__DEV__) {
      console.log("[GOAL][POST] API 요청:", payload);
    }
    // POST는 기존 값을 삭제하고 새로 생성하는 방식
    const response = await axios.post<ExerciseGoalSummary>(
      BASE_URL,
      payload,
      config
    );
    if (__DEV__) {
      console.log("[GOAL][POST] API 응답:", response.data);
    }
    return response.data;
  } catch (error: any) {
    if (axios.isAxiosError(error)) {
      console.error("[GOAL][POST] API 에러:", {
        status: error.response?.status,
        data: error.response?.data,
        message: error.message,
      });
    }
    throw error;
  }
};

export const deleteExerciseGoal = async (): Promise<void> => {
  try {
    const config = await withAuthHeaders();
    if (__DEV__) {
      console.log("[GOAL][DELETE] API 요청");
    }
    await axios.delete(BASE_URL, config);
    if (__DEV__) {
      console.log("[GOAL][DELETE] API 응답 성공");
    }
  } catch (error: any) {
    if (axios.isAxiosError(error)) {
      console.error("[GOAL][DELETE] API 에러:", {
        status: error.response?.status,
        data: error.response?.data,
        message: error.message,
      });
    }
    throw error;
  }
};


