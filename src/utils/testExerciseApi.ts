import axios from "axios";
import { ACCESS_TOKEN_KEY } from "../services/apiConfig";

// ✅ RN 환경이 아닐 때도 안전하게 동작하도록
let manualToken: string | null = null;

// 토큰 직접 설정 (테스트용)
export const setManualToken = (token: string) => {
  manualToken = token;
};

/**
 * ==============================
 *  공통 API 요청 함수
 * ==============================
 */
export const fetchExercises = async (
  params: {
    bodyPart?: string;
    keyword?: string;
    page?: number;
    size?: number;
    sort?: string;
  } = {}
) => {
  // ✅ RN 환경에서는 AsyncStorage 사용
  let token = manualToken;

  // Node 실행 시에는 AsyncStorage 없음
  if (!token) {
    try {
      // @ts-ignore
      const AsyncStorage = await import(
        "@react-native-async-storage/async-storage"
      );
      // 앱과 동일한 키 사용
      token = await AsyncStorage.default.getItem(ACCESS_TOKEN_KEY);
    } catch {
      token = manualToken; // fallback
    }
  }

  // 쿼리 구성 (Swagger 명세에 따라)
  const queryParams = new URLSearchParams();
  if (params.bodyPart) queryParams.append("bodyPart", params.bodyPart);
  if (params.keyword) queryParams.append("keyword", params.keyword);
  // pageable 파라미터
  if (params.page !== undefined)
    queryParams.append("page", params.page.toString());
  if (params.size !== undefined)
    queryParams.append("size", params.size.toString());
  if (params.sort) {
    // sort는 배열 형태로 전달될 수 있음
    queryParams.append("sort", params.sort);
  }

  const url = `http://43.200.40.140/api/exercise-db?${queryParams.toString()}`;

  try {
    const response = await axios.get(url, {
      headers: {
        Authorization: `Bearer ${token || ""}`,
        Accept: "application/json",
      },
    });

    console.log("✅ API 응답 성공:", response.data);
    return response.data;
  } catch (error: any) {
    if (axios.isAxiosError(error)) {
      console.error("❌ API 요청 에러:", {
        message: error.message,
        status: error.response?.status,
        statusText: error.response?.statusText,
        data: error.response?.data,
      });
    } else if (error.response) {
      console.error("❌ API 요청 에러:", {
        message: error.message,
        status: error.response.status,
        statusText: error.response.statusText,
        data: error.response.data,
      });
    } else {
      console.error("⚠️ 예기치 못한 에러:", error);
    }
    throw error;
  }
};

/**
 * ==============================
 *  Node / 터미널 테스트 함수
 * ==============================
 */
export const testExerciseApi = async () => {
  console.log("=== 운동 API 테스트 시작 ===");

  // ✅ 테스트 토큰 직접 주입
  setManualToken("여기에_토큰값_붙여넣기");

  try {
    const result = await fetchExercises({
      bodyPart: "가슴",
      keyword: "프레스",
      page: 0,
      size: 5,
      sort: "name,asc",
    });

    console.log("🎯 테스트 성공! 결과:", JSON.stringify(result, null, 2));

    // 유저 운동 기록 조회 테스트
    const workoutsUrl = `http://43.200.40.140/api/workouts/1`;
    const res2 = await axios.get(workoutsUrl, {
      headers: {
        Authorization: `Bearer ${manualToken || ""}`,
        Accept: "application/json",
      },
    });
    console.log("🎯 유저 운동 기록:", JSON.stringify(res2.data, null, 2));
    return result;
  } catch (error) {
    console.error("💥 테스트 실패:", error);
  }
};

// Node 환경에서 직접 실행 시 (React Native에서는 실행되지 않음)
// @ts-ignore
if (typeof require !== "undefined" && require.main === module) {
  testExerciseApi();
}
