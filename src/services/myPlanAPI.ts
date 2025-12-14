import { request } from "./apiConfig";

export interface SubscriptionResponse {
  hasActiveSubscription: boolean;
  status: string;
  planCode: string | null;
  startedAt: string | null;
  expiredAt: string | null;
  canceledAt: string | null;
  provider: string | null;
  providerCustomerId: string | null;
  providerSubscriptionId: string | null;
}

// ✅ 취소 응답 타입 정의 (서버가 주는 JSON 구조에 맞춤)
export interface CancelSubscriptionResponse {
  success: boolean;
  message: string;
  subscription: SubscriptionResponse; // 취소된 후의 상태 정보
}

export const myPlanAPI = {
  /**
   * 내 구독 정보 조회
   * GET /api/subscriptions/me
   */
  getMySubscription: async (): Promise<SubscriptionResponse> => {
    try {
      const response = await request<SubscriptionResponse>(
        "/api/subscriptions/me",
        { method: "GET" }
      );
      return response;
    } catch (error: any) {
      throw new Error(error.message || "구독 정보를 불러오는데 실패했습니다.");
    }
  },

  /**
   * ✅ 구독 취소
   * POST /api/subscriptions/cancel
   */
  cancelSubscription: async (): Promise<CancelSubscriptionResponse> => {
    try {
      console.log("🚫 구독 취소 요청");

      const response = await request<CancelSubscriptionResponse>(
        "/api/subscriptions/cancel",
        {
          method: "POST",
        }
      );

      console.log("✅ 구독 취소 완료:", response.message);
      return response;
    } catch (error: any) {
      console.error("❌ 구독 취소 실패:", error);
      throw new Error(error.message || "구독 취소에 실패했습니다.");
    }
  },
};
