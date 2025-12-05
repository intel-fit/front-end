// src/services/paymentAPI.ts
import { request } from "./apiConfig";

export const paymentAPI = {
  // Stripe 결제 세션 생성
  createStripeCheckoutSession: async (
    planCode: "PREMIUM_MONTHLY" | "PREMIUM_ANNUAL"
  ) => {
    try {
      console.log("📦 [Stripe] 결제 세션 생성 요청:", planCode);

      const response = await request(
        `/api/payments/stripe/checkout-session?planCode=${planCode}`,
        {
          method: "POST",
        }
      );

      console.log("✅ [Stripe] 세션 생성 성공:", response);
      return response;
    } catch (error) {
      console.error("❌ [Stripe] 세션 생성 실패:", error);
      throw error;
    }
  },

  // 카카오페이 결제 준비
  createKakaoPayReady: async (
    planCode: "PREMIUM_MONTHLY" | "PREMIUM_ANNUAL"
  ) => {
    try {
      console.log("📦 [카카오페이] 결제 준비 요청:", planCode);

      const response = await request(`/api/payments/kakaopay/ready`, {
        method: "POST",
        headers: {
          "Content-Type": "application/json",
        },
        body: JSON.stringify({ planCode }),
      });

      console.log("✅ [카카오페이] 결제 준비 성공:", response);
      return response;
    } catch (error) {
      console.error("❌ [카카오페이] 결제 준비 실패:", error);
      throw error;
    }
  },

  // Stripe 결제 완료 확인 (DB 업데이트)
  confirmStripePayment: async (sessionId: string) => {
    try {
      console.log("📦 [Stripe] 결제 완료 확인 요청:", sessionId);

      const response = await request(
        `/api/payments/stripe/success?session_id=${sessionId}`,
        {
          method: "GET",
        }
      );

      console.log("✅ [Stripe] 결제 확인 성공:", response);
      return response;
    } catch (error) {
      console.error("❌ [Stripe] 결제 확인 실패:", error);
      throw error;
    }
  },

  // 카카오페이 결제 완료 확인
  confirmKakaoPayment: async (orderId: string) => {
    try {
      console.log("📦 [카카오페이] 결제 완료 확인 요청:", orderId);

      const response = await request(
        `/api/payments/kakaopay/success?orderId=${orderId}`,
        {
          method: "GET",
        }
      );

      console.log("✅ [카카오페이] 결제 확인 성공:", response);
      return response;
    } catch (error) {
      console.error("❌ [카카오페이] 결제 확인 실패:", error);
      throw error;
    }
  },
};
