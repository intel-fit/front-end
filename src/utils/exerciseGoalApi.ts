import axios from "axios";
import AsyncStorage from "@react-native-async-storage/async-storage";
import { ACCESS_TOKEN_KEY } from "../services/apiConfig";

const BASE_URL = "http://43.200.40.140/api/exercise-goal";

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
      return response.data;
    } catch (error: any) {
      if (axios.isAxiosError(error) && error.response?.status === 404) {
        return null;
      }
      throw error;
    }
  };

export const saveExerciseGoal = async (
  payload: ExerciseGoalPayload
): Promise<ExerciseGoalSummary> => {
  const config = await withAuthHeaders();
  const response = await axios.post<ExerciseGoalSummary>(
    BASE_URL,
    payload,
    config
  );
  return response.data;
};

export const deleteExerciseGoal = async (): Promise<void> => {
  const config = await withAuthHeaders();
  await axios.delete(BASE_URL, config);
};


