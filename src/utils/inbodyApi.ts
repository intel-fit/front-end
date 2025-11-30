import axios from "axios";
import AsyncStorage from "@react-native-async-storage/async-storage";
import { ACCESS_TOKEN_KEY, API_BASE_URL } from "../services/apiConfig";

const INBODY_API_URL = `${API_BASE_URL}/api/inbody`;

export interface InBodyPayload {
  measurementDate?: string; // "2025-08-04"
  weight?: number;
  muscleMass?: number;
  bodyFatMass?: number;
  skeletalMuscleMass?: number;
  bodyFatPercentage?: number;
  leftArmMuscle?: number;
  rightArmMuscle?: number;
  trunkMuscle?: number;
  leftLegMuscle?: number;
  rightLegMuscle?: number;
  leftArmFat?: number;
  rightArmFat?: number;
  trunkFat?: number;
  leftLegFat?: number;
  rightLegFat?: number;
  totalBodyWater?: number;
  protein?: number;
  mineral?: number;
  bmi?: number;
  bodyFatPercentageStandard?: number;
  obesityDegree?: number;
  visceralFatLevel?: number;
  basalMetabolicRate?: number;
  achievementBadge?: string;
}

export interface InBodyResponse {
  success: boolean;
  message: string;
  inBody?: any;
}

/**
 * 인바디 정보 등록
 */
export const postInBody = async (
  payload: InBodyPayload
): Promise<InBodyResponse> => {
  try {
    const token = await AsyncStorage.getItem(ACCESS_TOKEN_KEY);

    const response = await axios.post(INBODY_API_URL, payload, {
      headers: {
        Authorization: `Bearer ${token || ""}`,
        "Content-Type": "application/json",
        Accept: "application/json",
      },
    });

    return response.data;
  } catch (error: any) {
    if (axios.isAxiosError(error)) {
      console.error("[INBODY][POST] API 에러:", {
        message: error.message,
        status: error.response?.status,
        statusText: error.response?.statusText,
        data: error.response?.data,
      });
    } else {
      console.error("[INBODY][POST] 예상치 못한 에러:", error);
    }
    throw error;
  }
};

/**
 * 인바디 목록 조회 (사용자의 모든 인바디 기록)
 */
export const getInBodyList = async (): Promise<any> => {
  try {
    const token = await AsyncStorage.getItem(ACCESS_TOKEN_KEY);

    const response = await axios.get(INBODY_API_URL, {
      headers: {
        Authorization: `Bearer ${token || ""}`,
        "Content-Type": "application/json",
        Accept: "application/json",
      },
    });

    return response.data;
  } catch (error: any) {
    if (axios.isAxiosError(error)) {
      console.error("[INBODY][GET] API 에러:", {
        message: error.message,
        status: error.response?.status,
        statusText: error.response?.statusText,
        data: error.response?.data,
      });
    } else {
      console.error("[INBODY][GET] 예상치 못한 에러:", error);
    }
    throw error;
  }
};

/**
 * 최신 인바디 기록 조회 (로그인 사용자 기준)
 */
export const getLatestInBody = async (): Promise<any> => {
  try {
    const token = await AsyncStorage.getItem(ACCESS_TOKEN_KEY);
    const url = `${INBODY_API_URL}/latest`;

    console.log("[INBODY][GET LATEST] API 요청:", {
      url,
      hasToken: !!token,
    });

    const response = await axios.get(url, {
      headers: {
        Authorization: `Bearer ${token || ""}`,
        "Content-Type": "application/json",
        Accept: "application/json",
      },
    });

    console.log("[INBODY][GET LATEST] API 응답 성공:", {
      status: response.status,
      hasData: !!response.data,
      dataKeys: response.data ? Object.keys(response.data) : [],
    });

    return response.data;
  } catch (error: any) {
    if (axios.isAxiosError(error)) {
      const status = error.response?.status;
      const errorData = error.response?.data;
      
      // 400 또는 404는 데이터 없음으로 처리
      if (status === 400 || status === 404) {
        console.log("[INBODY][GET LATEST] 데이터 없음:", {
          status,
          errorCode: errorData?.code,
          errorMessage: errorData?.message,
          data: errorData,
        });
        return null;
      }
      
      console.error("[INBODY][GET LATEST] API 에러:", {
        message: error.message,
        status,
        statusText: error.response?.statusText,
        errorCode: errorData?.code,
        errorMessage: errorData?.message,
        data: errorData,
        requestUrl: error.config?.url,
        requestMethod: error.config?.method,
        requestHeaders: error.config?.headers,
      });
    } else {
      console.error("[INBODY][GET LATEST] 예상치 못한 에러:", error);
    }
    throw error;
  }
};

/**
 * 인바디 상세 조회 (ID 기반)
 */
export const getInBodyById = async (
  inBodyId: number | string
): Promise<any> => {
  try {
    const token = await AsyncStorage.getItem(ACCESS_TOKEN_KEY);
    const url = `${INBODY_API_URL}/${inBodyId}`;

    const response = await axios.get(url, {
      headers: {
        Authorization: `Bearer ${token || ""}`,
        "Content-Type": "application/json",
        Accept: "application/json",
      },
    });

    return response.data;
  } catch (error: any) {
    if (axios.isAxiosError(error)) {
      console.error("[INBODY][GET BY ID] API 에러:", {
        message: error.message,
        status: error.response?.status,
        statusText: error.response?.statusText,
        data: error.response?.data,
      });
    } else {
      console.error("[INBODY][GET BY ID] 예상치 못한 에러:", error);
    }
    throw error;
  }
};

/**
 * 인바디 정보 수정
 * @param inBodyId 인바디 기록 ID
 * @param payload 수정할 데이터 (선택적 필드)
 */
export const patchInBody = async (
  inBodyId: number | string,
  payload: Partial<InBodyPayload>
): Promise<InBodyResponse> => {
  try {
    const token = await AsyncStorage.getItem(ACCESS_TOKEN_KEY);
    const url = `${INBODY_API_URL}/${inBodyId}`;

    const response = await axios.patch(url, payload, {
      headers: {
        Authorization: `Bearer ${token || ""}`,
        "Content-Type": "application/json",
        Accept: "application/json",
      },
    });

    return response.data;
  } catch (error: any) {
    if (axios.isAxiosError(error)) {
      console.error("[INBODY][PATCH] API 에러:", {
        message: error.message,
        status: error.response?.status,
        statusText: error.response?.statusText,
        data: error.response?.data,
      });
    } else {
      console.error("[INBODY][PATCH] 예상치 못한 에러:", error);
    }
    throw error;
  }
};

/**
 * 특정 날짜의 인바디 기록 조회
 * @param date 날짜 (YYYY-MM-DD 또는 YYYY.MM.DD 형식)
 */
export const getInBodyByDate = async (date: string): Promise<any> => {
  const token = await AsyncStorage.getItem(ACCESS_TOKEN_KEY);

  const sanitized = (date || "").trim();
  if (!sanitized) {
    throw new Error("조회할 날짜가 비어 있습니다.");
  }

  const compact = sanitized.replace(/[^\d]/g, "");
  const hyphenated =
    compact.length === 8
      ? `${compact.slice(0, 4)}-${compact.slice(4, 6)}-${compact.slice(6)}`
      : sanitized.replace(/\./g, "-");
  const dotted =
    compact.length === 8
      ? `${compact.slice(0, 4)}.${compact.slice(4, 6)}.${compact.slice(6)}`
      : hyphenated.replace(/-/g, ".");

  const withTimeHyphen =
    hyphenated && !hyphenated.includes("T")
      ? `${hyphenated}T00:00:00`
      : hyphenated;
  const withTimeSpace =
    hyphenated && !hyphenated.includes(" ")
      ? `${hyphenated} 00:00:00`
      : hyphenated;

  const dateFormats = Array.from(
    new Set(
      [
        sanitized,
        hyphenated,
        dotted,
        sanitized.replace(/\s+/g, ""),
        hyphenated.replace(/\s+/g, ""),
        dotted.replace(/\s+/g, ""),
        compact.length === 8 ? compact : null,
        withTimeHyphen,
        withTimeSpace,
      ].filter(Boolean)
    )
  );

  for (const formattedDate of dateFormats) {
    try {
      const url = `${INBODY_API_URL}?date=${encodeURIComponent(formattedDate)}`;

      const response = await axios.get(url, {
        headers: {
          Authorization: `Bearer ${token || ""}`,
          "Content-Type": "application/json",
          Accept: "application/json",
        },
      });

      return response.data;
    } catch (error: any) {
      const isLastAttempt =
        dateFormats[dateFormats.length - 1] === formattedDate;
      if (!isLastAttempt) {
        console.warn(
          `[INBODY][GET BY DATE] 날짜 형식 ${formattedDate} 실패, 다음 형식 시도...`
        );
        continue;
      }

      // 모든 형식 실패 시 에러 로그
      if (axios.isAxiosError(error)) {
        console.error("[INBODY][GET BY DATE] API 에러:", {
          message: error.message,
          status: error.response?.status,
          statusText: error.response?.statusText,
          data: error.response?.data,
        });
      } else {
        console.error("[INBODY][GET BY DATE] 예상치 못한 에러:", error);
      }
      throw error;
    }
  }

  throw new Error("모든 날짜 형식 시도 실패");
};

/**
 * 인바디 이미지 업로드
 * @param file 이미지 파일 (expo-image-picker의 Asset 타입)
 */
export interface InBodyUploadResponse {
  success: boolean;
  message: string;
  imageUrl?: string;
  draftData?: InBodyPayload;
}

export const uploadInBodyImage = async (
  file: any
): Promise<InBodyUploadResponse> => {
  try {
    const token = await AsyncStorage.getItem(ACCESS_TOKEN_KEY);
    const url = `${INBODY_API_URL}/upload`;

    console.log("[INBODY][UPLOAD] 업로드 시작:", {
      url,
      fileUri: file.uri,
      fileName: file.fileName,
      fileType: file.type,
      fileSize: file.fileSize,
      hasToken: !!token,
    });

    // FormData 생성
    const formData = new FormData();
    
    // 파일 추가
    const fileData = {
      uri: file.uri,
      type: file.type || "image/jpeg",
      name: file.fileName || "inbody.jpg",
    } as any;
    
    formData.append("file", fileData);
    
    console.log("[INBODY][UPLOAD] FormData 생성 완료:", {
      fileUri: fileData.uri,
      fileType: fileData.type,
      fileName: fileData.name,
    });

    console.log("[INBODY][UPLOAD] API 요청 전송 중...");
    const response = await axios.post(url, formData, {
      headers: {
        Authorization: `Bearer ${token || ""}`,
        "Content-Type": "multipart/form-data",
        Accept: "application/json",
      },
    });

    console.log("[INBODY][UPLOAD] API 응답 받음:", {
      status: response.status,
      success: response.data?.success,
      message: response.data?.message,
      hasImageUrl: !!response.data?.imageUrl,
      hasDraftData: !!response.data?.draftData,
    });

    return response.data;
  } catch (error: any) {
    if (axios.isAxiosError(error)) {
      console.error("[INBODY][UPLOAD] API 에러:", {
        message: error.message,
        status: error.response?.status,
        statusText: error.response?.statusText,
        data: error.response?.data,
        url: error.config?.url,
      });
    } else {
      console.error("[INBODY][UPLOAD] 예상치 못한 에러:", error);
    }
    throw error;
  }
};