import axios from "axios";
import AsyncStorage from "@react-native-async-storage/async-storage";
import { ACCESS_TOKEN_KEY, AI_API_BASE_URL } from "../services/apiConfig";

/**
 * 테스트용: 테스트 유저 초기화
 * 확인 후 제거 예정
 */
export const initTestUser = async (): Promise<string> => {
  try {
    const token = await AsyncStorage.getItem(ACCESS_TOKEN_KEY);
    const response = await axios.post<string>(
      `${AI_API_BASE_URL}/test/init_test_user`,
      {},
      {
        headers: {
          Authorization: `Bearer ${token || ""}`,
          Accept: "application/json",
          "Content-Type": "application/json",
        },
      }
    );
    console.log("[TEST] 테스트 유저 초기화 성공:", response.data);
    return response.data;
  } catch (error: any) {
    console.error("[TEST] 테스트 유저 초기화 실패:", {
      message: error?.message,
      status: error?.response?.status,
      data: error?.response?.data,
    });
    throw error;
  }
};

