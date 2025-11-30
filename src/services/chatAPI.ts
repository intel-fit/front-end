// src/services/chatAPI.ts
import { API_BASE_URL } from "./apiConfig";
import AsyncStorage from "@react-native-async-storage/async-storage";
import { ACCESS_TOKEN_KEY } from "./apiConfig";

interface ChatResponse {
  ai_reply?: string;
  user_id?: string;
  question?: string;
  latest_score?: number | null;
  context?: any;
  message?: string;
  detail?: string;
  [key: string]: any;
}

export const chatAPI = {
  /**
   * AI 코치와 채팅
   * @param userId - 사용자 ID
   * @param message - 사용자 메시지
   * @param mode - 채팅 카테고리 (auto | exercise | nutrition)
   * @param coachStyle - 대화 스타일 (pro | friend | soft | drill)
   */
  sendMessage: async (
    userId: number,
    message: string,
    mode: string = "auto",
    coachStyle: string = "friend"
  ): Promise<string> => {
    try {
      console.log("💬 채팅 요청:", {
        userId,
        message,
        mode, // ✅ 추가
        coachStyle, // ✅ 추가
      });

      const token = await AsyncStorage.getItem(ACCESS_TOKEN_KEY);

      if (!token) {
        throw new Error("로그인이 필요합니다.");
      }

      const url = `${API_BASE_URL}/api/ai/coach/chat`;
      console.log("🌐 요청 URL:", url);

      const requestBody = {
        message: message,
        mode: mode, // ✅ 추가
        coach_style: coachStyle, // ✅ 추가
      };

      console.log("📤 요청 본문:", JSON.stringify(requestBody));

      const response = await fetch(url, {
        method: "POST",
        headers: {
          "Content-Type": "application/json",
          Authorization: `Bearer ${token}`,
        },
        body: JSON.stringify(requestBody),
      });

      console.log("✅ 응답 상태:", response.status);

      // ✅ 응답 텍스트 먼저 확인
      const responseText = await response.text();
      console.log("📥 응답 원본:", responseText);

      let data: ChatResponse;
      try {
        data = JSON.parse(responseText);
        console.log("✅ 파싱된 응답:", JSON.stringify(data, null, 2));
      } catch (parseError) {
        console.error("❌ JSON 파싱 실패:", parseError);
        throw new Error("서버 응답을 처리할 수 없습니다.");
      }

      if (!response.ok) {
        console.error("❌ 상세 에러:", JSON.stringify(data, null, 2));

        // Gemini API 429 에러 처리
        if (response.status === 500 && data.detail?.includes("429")) {
          throw new Error(
            "AI 서버의 일일 사용량이 초과되었습니다. 잠시 후 다시 시도해주세요."
          );
        }

        // 인증 오류
        if (response.status === 401 || response.status === 403) {
          throw new Error("인증이 만료되었습니다. 다시 로그인해주세요.");
        }

        throw new Error(
          data.message || data.detail || `서버 오류: ${response.status}`
        );
      }

      // ✅ ai_reply를 최우선으로 추출
      const botMessage =
        data.ai_reply ||
        data.message ||
        data.question || // fallback
        (typeof data === "string" ? data : null);

      console.log("🤖 추출된 봇 메시지:", botMessage);

      if (!botMessage) {
        console.warn("⚠️ 예상치 못한 응답 형식:", data);
        console.warn("⚠️ 응답 타입:", typeof data);
        console.warn("⚠️ 응답 키:", Object.keys(data));
        throw new Error("AI 응답을 찾을 수 없습니다.");
      }

      return botMessage;
    } catch (error: any) {
      console.error("❌ 챗봇 API 호출 에러:", error);
      console.error("❌ 에러 스택:", error.stack);
      throw new Error(error.message || "채팅 중 오류가 발생했습니다.");
    }
  },
};
