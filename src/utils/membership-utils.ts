// 회원 등급 관련 유틸리티 함수
import AsyncStorage from "@react-native-async-storage/async-storage";

export type MembershipType = "FREE" | "PREMIUM";

/**
 * 현재 회원 등급 가져오기
 * TODO: 나중에 API에서 membershipType을 받으면 authAPI.getProfile()에서 가져오도록 변경
 */
export const getMembershipType = async (): Promise<MembershipType> => {
  try {
    // ✅ 현재: 테스트용 AsyncStorage 사용
    const testType = await AsyncStorage.getItem("testMembershipType");
    if (testType === "PREMIUM") return "PREMIUM";

    // TODO: API 추가 후 아래 코드 활성화
    // const profile = await authAPI.getProfile();
    // return profile.membershipType || "FREE";

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
