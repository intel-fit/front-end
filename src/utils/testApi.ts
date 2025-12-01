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
    const url = `http://43.200.40.140:8000/test/init_test_user`;
    console.log("[TEST] 테스트 유저 초기화 API 호출:", {
      url,
      hasToken: !!token,
    });
    
    // 테스트용 API: http://43.200.40.140:8000/test/init_test_user
    const response = await axios.post<{ msg: string }>(
      url,
      {},
      {
        headers: {
          Authorization: `Bearer ${token || ""}`,
          Accept: "application/json",
          "Content-Type": "application/json",
        },
        timeout: 30000, // 30초 타임아웃 (테스트 데이터 생성에 시간이 걸릴 수 있음)
      }
    );
    
    console.log("[TEST] 테스트 유저 초기화 성공:", {
      status: response.status,
      data: response.data,
      msg: response.data?.msg,
    });
    return response.data?.msg || JSON.stringify(response.data);
  } catch (error: any) {
    console.error("[TEST] 테스트 유저 초기화 실패:", {
      message: error?.message,
      status: error?.response?.status,
      statusText: error?.response?.statusText,
      data: error?.response?.data,
      code: error?.code,
      url: error?.config?.url,
    });
    throw error;
  }
};

