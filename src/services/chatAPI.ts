// src/services/chatAPI.ts
import AsyncStorage from "@react-native-async-storage/async-storage";
import { ACCESS_TOKEN_KEY, API_BASE_URL } from "./apiConfig";

interface ChatResponse {
  reply?: string;
  user_id?: string;
  mode?: string;
  coach_style?: string;
  emotion_detected?: string;
  debug?: any;
  message?: string;
  detail?: string;
  success?: boolean;
  code?: string;
  [key: string]: any;
}

export interface ChatHistoryItem {
  userMessage: string;
  aiResponse: string;
  mode: string;
  coachStyle: string;
  emotionDetected: string;
  createdAt: string;
}

export const chatAPI = {
  /**
   * AI 코치와 채팅
   * @param userId - 사용자 ID (string)
   * @param message - 사용자 메시지
   * @param mode - 채팅 카테고리 (auto | exercise | nutrition)
   * @param coachStyle - 대화 스타일 (pro | friend | soft | drill)
   */
  sendMessage: async (
    userId: string,
    message: string,
    mode: string = "auto",
    coachStyle: string = "friend"
  ): Promise<string> => {
    const startTime = Date.now();

    try {
      // 토큰 확인
      const token = await AsyncStorage.getItem(ACCESS_TOKEN_KEY);

      if (!token) {
        throw new Error("로그인이 필요합니다.");
      }

      // 요청 본문
      const requestBody = {
        message: message,
        mode: mode,
        coachStyle: coachStyle,
      };

      console.log("🤖 챗봇 요청:", {
        userId,
        message: message.substring(0, 50) + (message.length > 50 ? "..." : ""),
        mode,
        coachStyle,
      });

      const url = `${API_BASE_URL}/api/ai/coach/chat`;

      const response = await fetch(url, {
        method: "POST",
        headers: {
          "Content-Type": "application/json",
          Authorization: `Bearer ${token}`,
        },
        body: JSON.stringify(requestBody),
      });

      const responseTime = Date.now() - startTime;

      // 응답 텍스트 읽기
      const responseText = await response.text();

      // JSON 파싱
      let data: ChatResponse;
      try {
        data = JSON.parse(responseText);
      } catch (parseError) {
        console.error("❌ JSON 파싱 실패:", responseText);
        throw new Error("서버 응답을 처리할 수 없습니다.");
      }

      // 에러 응답 처리
      if (!response.ok) {
        console.error("❌ 챗봇 API 에러:", {
          status: response.status,
          code: data.code,
          message: data.message,
        });

        // 특정 에러 처리
        if (response.status === 500 && data.detail?.includes("429")) {
          throw new Error(
            "AI 서버의 일일 사용량이 초과되었습니다. 잠시 후 다시 시도해주세요."
          );
        }

        if (response.status === 401 || response.status === 403) {
          throw new Error("인증이 만료되었습니다. 다시 로그인해주세요.");
        }

        throw new Error(
          data.message || data.detail || `서버 오류: ${response.status}`
        );
      }

      // 성공 응답 처리
      const botMessage = data.reply || data.message || null;

      if (!botMessage) {
        console.error("❌ 응답에 메시지 없음:", data);
        throw new Error("AI 응답을 찾을 수 없습니다.");
      }

      console.log("✅ 챗봇 응답 성공:", {
        responseTime: `${responseTime}ms`,
        messageLength: botMessage.length,
      });

      return botMessage;
    } catch (error: any) {
      console.error("❌ 챗봇 에러:", {
        message: error.message,
        type: error.constructor.name,
      });

      throw new Error(error.message || "채팅 중 오류가 발생했습니다.");
    }
  },
  /**
   * 챗봇 히스토리 조회
   * @param limit - 조회할 대화 개수 (선택사항)
   */
  getChatHistory: async (limit?: number): Promise<ChatHistoryItem[]> => {
    try {
      const token = await AsyncStorage.getItem(ACCESS_TOKEN_KEY);

      if (!token) {
        throw new Error("로그인이 필요합니다.");
      }

      const url = limit
        ? `${API_BASE_URL}/api/ai/coach/chat/history?limit=${limit}`
        : `${API_BASE_URL}/api/ai/coach/chat/history`;

      console.log("📜 챗봇 히스토리 요청:", { url, limit });

      const response = await fetch(url, {
        method: "GET",
        headers: {
          "Content-Type": "application/json",
          Authorization: `Bearer ${token}`,
        },
      });

      const data = await response.json();

      if (!response.ok) {
        console.error("❌ 히스토리 조회 실패:", {
          status: response.status,
          data,
        });
        throw new Error(
          data.message || "챗봇 히스토리를 불러오는데 실패했습니다."
        );
      }

      console.log("✅ 챗봇 히스토리 조회 성공:", {
        count: data.length,
      });

      return data;
    } catch (error: any) {
      console.error("❌ 챗봇 히스토리 에러:", error);
      throw error;
    }
  },
};
