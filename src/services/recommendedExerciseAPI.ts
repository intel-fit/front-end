import { request, requestAI } from "./apiConfig";

export const recommendedExerciseAPI = {
  /**
   * 운동 플랜 생성 - POST /api/ai/exercise/generate
   */
  generateExercisePlan: async (): Promise<any> => {
    try {
      console.log("💪 운동 플랜 생성 요청 (신규 API)");

      const response = await request("/api/ai/exercise/generate", {
        method: "POST",
        // body 필드 자체를 제거 (undefined)
      });

      console.log("✅ 성공:", JSON.stringify(response, null, 2));
      return response;
    } catch (error: any) {
      console.error("❌ 운동 플랜 생성 실패:", error);
      throw error;
    }
  },

  // ✅ 기존 함수들도 유지 (혹시 몰라서)
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
        DIET: "cut",
        BULK: "bulk",
        MAINTAIN: "maintenance",
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

      console.log("📤 AI 서버 유저 생성 요청:", requestBody);

      await requestAI("/user/create", {
        method: "POST",
        body: JSON.stringify(requestBody),
      });

      console.log("✅ AI 서버 유저 생성 성공");
    } catch (error: any) {
      if (error.status === 409) {
        console.log("ℹ️ AI 서버에 이미 유저가 존재함");
        return;
      }
      console.error("⚠️ AI 서버 유저 생성 실패:", error.status, error.data);
      throw error;
    }
  },
};
