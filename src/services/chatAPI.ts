// src/services/chatAPI.ts
import { AI_API_BASE_URL } from "./apiConfig";
import AsyncStorage from "@react-native-async-storage/async-storage";
import { ACCESS_TOKEN_KEY } from "./apiConfig";

interface ChatResponse {
  ai_reply?: string; // 👈 추가!
  response?: string;
  message?: string;
  answer?: string;
  [key: string]: any;
}

export const chatAPI = {
  /**
   * AI 서버에 유저 생성 (없으면 생성)
   */
  createUserInAI: async (profileData: any): Promise<void> => {
    try {
      console.log("👤 AI 서버에 유저 생성 시도:", profileData.id);

      const activityLevelMap: { [key: string]: number } = {
        "1": 1.2,
        "2": 1.3,
        "3": 1.4,
        "4": 1.5,
        "5": 1.6,
        "6": 1.7,
        "7": 1.9,
      };

      const activityLevel = profileData.workoutDaysPerWeek
        ? activityLevelMap[profileData.workoutDaysPerWeek] || 1.2
        : 1.2;

      const calculateAge = (birthDate: string): number => {
        if (!birthDate) return 25;
        const today = new Date();
        const birth = new Date(birthDate);
        let age = today.getFullYear() - birth.getFullYear();
        const monthDiff = today.getMonth() - birth.getMonth();
        if (
          monthDiff < 0 ||
          (monthDiff === 0 && today.getDate() < birth.getDate())
        ) {
          age--;
        }
        return age;
      };

      const goalMap: { [key: string]: string } = {
        "체중 감량": "cut",
        "근육 증가": "bulk",
        "체중 유지": "maintenance",
        "건강 유지": "maintenance",
      };

      const goal = goalMap[profileData.healthGoal] || "maintenance";

      const requestBody = {
        name: profileData.name || "사용자",
        age: calculateAge(profileData.birthDate),
        sex: profileData.gender || "M",
        height: profileData.height || 170,
        weight: profileData.weight || 70,
        body_fat: 20,
        skeletal_muscle: 30,
        activity_level: activityLevel,
        goal: goal,
        id: String(profileData.id),
      };

      console.log("📤 AI 서버 요청 본문:", requestBody);

      const response = await fetch(`${AI_API_BASE_URL}/user/create`, {
        method: "POST",
        headers: {
          "Content-Type": "application/json",
        },
        body: JSON.stringify(requestBody),
      });

      console.log("✅ 유저 생성 응답 상태:", response.status);

      // 응답이 JSON인지 텍스트인지 확인
      const contentType = response.headers.get("content-type");
      let data;

      if (contentType && contentType.includes("application/json")) {
        data = await response.json();
      } else {
        const text = await response.text();
        data = { message: text };
      }

      if (response.ok) {
        console.log("✅ AI 서버 유저 생성 성공:", data);
      } else if (response.status === 400) {
        console.log("✅ AI 서버에 유저 이미 존재 (정상)");
      } else {
        console.warn("⚠️ AI 서버 유저 생성 실패:", response.status, data);
      }
    } catch (error) {
      console.error("❌ AI 서버 유저 생성 에러:", error);
      // 에러가 나도 계속 진행
    }
  },

  /**
   * AI 코치와 채팅
   */
  sendMessage: async (userId: number, message: string): Promise<string> => {
    try {
      console.log("💬 채팅 요청:", { userId, message });

      const token = await AsyncStorage.getItem(ACCESS_TOKEN_KEY);

      const url = `${AI_API_BASE_URL}/chat/coach?user_id=${String(
        userId
      )}&message=${encodeURIComponent(message)}`;
      console.log("🌐 요청 URL:", url);

      const response = await fetch(url, {
        method: "POST",
        headers: {
          "Content-Type": "application/json",
          ...(token && { Authorization: `Bearer ${token}` }),
        },
      });

      console.log("✅ 응답 상태:", response.status);

      const data = await response.json();
      console.log("✅ 채팅 응답:", data);

      if (!response.ok) {
        console.error("❌ 상세 에러:", JSON.stringify(data, null, 2));

        // Gemini API 429 에러 처리
        if (response.status === 500 && data.detail?.includes("429")) {
          throw new Error(
            "AI 서버의 일일 사용량이 초과되었습니다. 잠시 후 다시 시도해주세요."
          );
        }

        throw new Error(
          data.message || data.detail || `서버 오류: ${response.status}`
        );
      }

      // 👇 ai_reply를 맨 앞에 추가!
      const botMessage =
        data.ai_reply ||
        data.response ||
        data.message ||
        data.answer ||
        (typeof data === "string" ? data : null);

      if (!botMessage) {
        console.warn("⚠️ 예상치 못한 응답 형식:", data);
        return "응답을 처리할 수 없습니다.";
      }

      return botMessage;
    } catch (error: any) {
      console.error("❌ 챗봇 API 호출 에러:", error);
      throw new Error(error.message || "채팅 중 오류가 발생했습니다.");
    }
  },
};
