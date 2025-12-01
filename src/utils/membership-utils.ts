// 회원 등급 관련 유틸리티 함수
import AsyncStorage from "@react-native-async-storage/async-storage";
import { authAPI } from "../services";

export type MembershipType = "FREE" | "PREMIUM";

/**
 * 현재 회원 등급 가져오기
 */
export const getMembershipType = async (): Promise<MembershipType> => {
  try {
    // 1. 테스트용 AsyncStorage 확인
    const testType = await AsyncStorage.getItem("testMembershipType");
    if (testType === "PREMIUM") return "PREMIUM";

    // 2. 실제 membershipType 확인
    const membershipType = await AsyncStorage.getItem("membershipType");
    if (membershipType === "PREMIUM") return "PREMIUM";

    // 3. API에서 프로필 조회
    try {
      const profile = await authAPI.getProfile();
      if (profile?.membershipType) {
        const type = profile.membershipType.toUpperCase();
        if (type === "PREMIUM") {
          await AsyncStorage.setItem("membershipType", "PREMIUM");
          return "PREMIUM";
        }
      }
    } catch (apiError) {
      // API 호출 실패 시 무시하고 계속 진행
      console.log("[membership-utils] API 프로필 조회 실패, AsyncStorage 값 사용");
    }

    return "FREE";
  } catch (error) {
    console.error("회원 등급 조회 실패:", error);
    return "FREE"; // 기본값은 무료 회원
  }
};

/**
 * 회원 등급 설정 (테스트용)
 * TODO: API 추가 후 제거 예정
 */
export const setMembershipType = async (
  type: MembershipType
): Promise<void> => {
  try {
    await AsyncStorage.setItem("testMembershipType", type);
    console.log(`✅ 회원 등급 설정: ${type}`);
  } catch (error) {
    console.error("회원 등급 설정 실패:", error);
  }
};

/**
 * 식단 추천 화면 이름 가져오기
 */
export const getMealRecommendScreen = async (): Promise<string> => {
  const membershipType = await getMembershipType();

  if (membershipType === "PREMIUM") {
    return "MealRecommend"; // 유료 회원 → 7일 식단 추천
  } else {
    return "TempMealRecommend"; // 무료 회원 → 1일 식단 추천
  }
};

/**
 * 운동 루틴 추천 화면 이름 가져오기 (필요 시)
 */
export const getRoutineRecommendScreen = async (): Promise<string> => {
  const membershipType = await getMembershipType();

  if (membershipType === "PREMIUM") {
    return "RoutineRecommendNew"; // 유료 회원 → 7일 루틴
  } else {
    return "RoutineRecommendNew"; // 무료 회원도 동일 (내부에서 제한)
  }
};

/**
 * 프리미엄 전용 기능 체크
 */
export const isPremiumFeature = async (): Promise<boolean> => {
  const membershipType = await getMembershipType();
  return membershipType === "PREMIUM";
};
