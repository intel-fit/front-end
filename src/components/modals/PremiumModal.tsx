// src/components/modals/PremiumModal.tsx
import React, { useState, useEffect } from "react";
import {
  View,
  Text,
  Modal,
  TouchableOpacity,
  StyleSheet,
  ScrollView,
  Alert,
  SafeAreaView,
} from "react-native";
import { Ionicons as Icon } from "@expo/vector-icons";
import { LinearGradient } from "expo-linear-gradient";
import { WebView } from "react-native-webview";
import { useNavigation } from "@react-navigation/native";
import type { NativeStackNavigationProp } from "@react-navigation/native-stack";
import { RootStackParamList } from "../../navigation/types";
import { paymentAPI } from "../../services";

interface PremiumModalProps {
  isOpen: boolean;
  onClose: () => void;
  onContinue?: () => void;
}

type PlanType = "annual" | "monthly" | null;
type PaymentMethod = "stripe" | "kakaopay" | null;

const PremiumModal: React.FC<PremiumModalProps> = ({
  isOpen,
  onClose,
  onContinue,
}) => {
  const navigation = useNavigation<NativeStackNavigationProp<RootStackParamList>>();
  const [selectedPlan, setSelectedPlan] = useState<PlanType>(null);
  const [selectedPaymentMethod, setSelectedPaymentMethod] =
    useState<PaymentMethod>(null);
  
  const [showPaymentWebView, setShowPaymentWebView] = useState(false);
  const [paymentUrl, setPaymentUrl] = useState("");

  useEffect(() => {
    if (isOpen) {
      console.log("[PremiumModal] 모달 열림");
      setSelectedPlan(null);
      setSelectedPaymentMethod(null);
    }
  }, [isOpen]);

  const handleContinue = async () => {
    if (!selectedPlan || !selectedPaymentMethod) {
      Alert.alert("알림", "플랜과 결제 수단을 선택해주세요.");
      return;
    }

    try {
      console.log("💳 [결제] 시작:", { selectedPlan, selectedPaymentMethod });

      const planCode =
        selectedPlan === "annual" ? "PREMIUM_ANNUAL" : "PREMIUM_MONTHLY";

      if (selectedPaymentMethod === "stripe") {
        const { sessionId, url } = await paymentAPI.createStripeCheckoutSession(
          planCode
        );
        console.log("✅ [Stripe] 세션 생성 완료:", { sessionId, url });

        setPaymentUrl(url);
        setShowPaymentWebView(true);
        onClose();
        
      } else if (selectedPaymentMethod === "kakaopay") {
        const { success, tid, redirectUrl, orderId } =
          await paymentAPI.createKakaoPayReady(planCode);

        if (!success) {
          throw new Error("카카오페이 결제 준비에 실패했습니다.");
        }

        console.log("✅ [카카오페이] 결제 준비 완료:", {
          tid,
          orderId,
          redirectUrl,
        });

        setPaymentUrl(redirectUrl);
        setShowPaymentWebView(true);
        onClose();
      }
    } catch (error: any) {
      console.error("❌ [결제] 실패:", error);
      Alert.alert(
        "결제 실패",
        error.message || "결제를 시작할 수 없습니다. 다시 시도해주세요."
      );
    }
  };

  const features = [
    {
      title: "무제한 AI 코칭",
      description: null,
    },
    {
      title: "회원님에게 최적화된 영양 목표 추천",
      description: null,
    },
    {
      title: "맞춤형 7일 운동/식단 루틴",
      description: null,
    },
    {
      title: "분석 레포트 보기",
      description: "건강점수, 운동, 식단",
    },
  ];

  const canContinue = selectedPlan && selectedPaymentMethod;

  return (
    <>
      <Modal
        visible={isOpen}
        animationType="fade"
        transparent={true}
        onRequestClose={onClose}
        statusBarTranslucent={true}
      >
        <View style={styles.overlay}>
          <View style={styles.modalContent}>
            <TouchableOpacity onPress={onClose} style={styles.closeBtn}>
              <Icon name="close" size={24} color="#ffffff" />
            </TouchableOpacity>

            <ScrollView
              style={styles.scrollView}
              contentContainerStyle={styles.scrollContent}
              showsVerticalScrollIndicator={false}
              bounces={false}
            >
              <View style={styles.header}>
                <Text style={styles.intelfitText}>INTELFIT</Text>
                <View style={styles.premiumContainer}>
                  <LinearGradient
                    colors={["#e3ff7c", "#fff9c4", "#ffffff"]}
                    start={{ x: 0, y: 0 }}
                    end={{ x: 1, y: 0 }}
                    style={styles.premiumGradient}
                  >
                    <Text style={styles.premiumText}> premium</Text>
                  </LinearGradient>
                </View>
              </View>

              <Text style={styles.subtitle}>
                더욱 전문적인 트레이닝을 받아보세요.
              </Text>

              <View style={styles.featuresContainer}>
                {features.map((feature, index) => (
                  <View key={index} style={styles.featureItem}>
                    <View style={styles.checkCircle}>
                      <Icon name="checkmark" size={14} color="#000000" />
                    </View>
                    <View style={styles.featureTextContainer}>
                      <Text style={styles.featureTitle}>{feature.title}</Text>
                      {feature.description && (
                        <Text style={styles.featureDescription}>
                          {feature.description}
                        </Text>
                      )}
                    </View>
                  </View>
                ))}
              </View>

              <View style={styles.plansContainer}>
                <Text style={styles.sectionTitle}>플랜 선택</Text>

                <TouchableOpacity
                  style={[
                    styles.planCard,
                    selectedPlan === "annual" && styles.planCardSelected,
                  ]}
                  onPress={() => setSelectedPlan("annual")}
                  activeOpacity={0.7}
                >
                  <View style={styles.discountBadge}>
                    <Text style={styles.discountText}>16% 할인</Text>
                  </View>
                  <View style={styles.planContent}>
                    <Text style={styles.planType}>연간</Text>
                    <View style={styles.planPriceContainer}>
                      <Text style={styles.planPriceMonthly}>￦4,916/월</Text>
                      <Text style={styles.planPriceYearly}>￦59,000/년</Text>
                    </View>
                  </View>
                </TouchableOpacity>

                <TouchableOpacity
                  style={[
                    styles.planCard,
                    selectedPlan === "monthly" && styles.planCardSelected,
                  ]}
                  onPress={() => setSelectedPlan("monthly")}
                  activeOpacity={0.7}
                >
                  <View style={styles.planContent}>
                    <Text style={styles.planType}>월간</Text>
                    <Text style={styles.planPriceMonthly}>￦5,900/월</Text>
                  </View>
                </TouchableOpacity>
              </View>

              <View style={styles.paymentMethodContainer}>
                <Text style={styles.sectionTitle}>결제 수단</Text>

                <TouchableOpacity
                  style={[
                    styles.paymentMethodCard,
                    selectedPaymentMethod === "stripe" &&
                      styles.paymentMethodCardSelected,
                  ]}
                  onPress={() => setSelectedPaymentMethod("stripe")}
                  activeOpacity={0.7}
                >
                  <View style={styles.paymentMethodContent}>
                    <View style={styles.paymentMethodIcon}>
                      <Icon name="card-outline" size={24} color="#ffffff" />
                    </View>
                    <View style={styles.paymentMethodText}>
                      <Text style={styles.paymentMethodTitle}>카드 결제</Text>
                      <Text style={styles.paymentMethodSubtitle}>Stripe</Text>
                    </View>
                  </View>
                  {selectedPaymentMethod === "stripe" && (
                    <Icon name="checkmark-circle" size={24} color="#e3ff7c" />
                  )}
                </TouchableOpacity>

                <TouchableOpacity
                  style={[
                    styles.paymentMethodCard,
                    selectedPaymentMethod === "kakaopay" &&
                      styles.paymentMethodCardSelected,
                  ]}
                  onPress={() => setSelectedPaymentMethod("kakaopay")}
                  activeOpacity={0.7}
                >
                  <View style={styles.paymentMethodContent}>
                    <View
                      style={[
                        styles.paymentMethodIcon,
                        { backgroundColor: "#FEE500" },
                      ]}
                    >
                      <Text style={styles.kakaoIcon}>💳</Text>
                    </View>
                    <View style={styles.paymentMethodText}>
                      <Text style={styles.paymentMethodTitle}>카카오페이</Text>
                      <Text style={styles.paymentMethodSubtitle}>간편결제</Text>
                    </View>
                  </View>
                  {selectedPaymentMethod === "kakaopay" && (
                    <Icon name="checkmark-circle" size={24} color="#e3ff7c" />
                  )}
                </TouchableOpacity>
              </View>

              <TouchableOpacity
                style={[
                  styles.continueButton,
                  canContinue && styles.continueButtonActive,
                ]}
                onPress={handleContinue}
                activeOpacity={0.8}
                disabled={!canContinue}
              >
                <Text
                  style={[
                    styles.continueButtonText,
                    canContinue && styles.continueButtonTextActive,
                  ]}
                >
                  {canContinue ? "결제하기" : "플랜과 결제수단을 선택하세요"}
                </Text>
              </TouchableOpacity>
            </ScrollView>
          </View>
        </View>
      </Modal>

      {/* ⭐ 결제 WebView 모달 */}
      <Modal
        visible={showPaymentWebView}
        animationType="slide"
        onRequestClose={() => setShowPaymentWebView(false)}
      >
        <SafeAreaView style={{ flex: 1, backgroundColor: "#000" }}>
          <View style={styles.webViewHeader}>
            <TouchableOpacity
              onPress={() => setShowPaymentWebView(false)}
              style={styles.webViewCloseBtn}
            >
              <Icon name="close" size={28} color="#ffffff" />
            </TouchableOpacity>
            <Text style={styles.webViewTitle}>결제</Text>
            <View style={{ width: 40 }} />
          </View>

          {/* ⭐ WebView - 수정된 부분 */}
          <WebView
  source={{ uri: paymentUrl }}
  onNavigationStateChange={(navState) => {
    console.log("🌐 WebView URL:", navState.url);

    // ⭐ Stripe success URL 감지 (수정됨)
    if (navState.url.includes("/pay/stripe/success/callback")) {
      setShowPaymentWebView(false);

      const urlParts = navState.url.split("?");
      if (urlParts.length > 1) {
        const urlParams = new URLSearchParams(urlParts[1]);
        const sessionId = urlParams.get("session_id") || urlParams.get("sessionId");

        console.log("✅ Stripe 결제 완료:", { sessionId });

        if (sessionId) {
          navigation.navigate("PaymentSuccess", { sessionId });
        }
      }
    }

    // ⭐ 카카오페이 success URL 감지 (추가)
    if (navState.url.includes("payment-success-web.html")) {
      setShowPaymentWebView(false);

      const urlParts = navState.url.split("?");
      if (urlParts.length > 1) {
        const urlParams = new URLSearchParams(urlParts[1]);
        const orderId = urlParams.get("orderId");

        console.log("✅ 카카오페이 결제 완료:", { orderId });

        if (orderId) {
          navigation.navigate("PaymentSuccess", { orderId });
        }
      }
    }

    // cancel URL 처리
    if (navState.url.includes("payment-cancel")) {
      console.log("❌ 결제 취소");
      setShowPaymentWebView(false);
      Alert.alert("결제 취소", "결제가 취소되었습니다.");
    }
  }}
  onShouldStartLoadWithRequest={(request) => {
    console.log("🔍 로드 요청:", request.url);
    
    // ⭐ Stripe success URL 차단 (수정됨)
    if (request.url.includes("/pay/stripe/success/callback")) {
      console.log("⛔ Stripe success 페이지 로드 차단");
      return false;
    }

    // ⭐ 카카오페이 success URL 차단
    if (request.url.includes("payment-success-web.html")) {
      console.log("⛔ 카카오페이 success 페이지 로드 차단");
      return false;
    }
    
    return true;
  }}
  onError={(syntheticEvent) => {
    const { nativeEvent } = syntheticEvent;
    console.error("❌ WebView 에러:", nativeEvent);
    
    // ⭐ success URL에서 에러 나면 무시 (수정됨)
    if (
      nativeEvent.url?.includes("/pay/stripe/success/callback") ||
      nativeEvent.url?.includes("payment-success-web.html")
    ) {
      console.log("ℹ️ success 페이지 에러 무시 (이미 처리됨)");
      return;
    }
    
    Alert.alert("페이지 로드 실패", "결제 페이지를 열 수 없습니다.");
    setShowPaymentWebView(false);
  }}
            onHttpError={(syntheticEvent) => {
              const { nativeEvent } = syntheticEvent;
              console.error("❌ HTTP 에러:", nativeEvent.statusCode, nativeEvent.url);
            }}
            javaScriptEnabled={true}
            domStorageEnabled={true}
            startInLoadingState={true}
            scalesPageToFit={true}
            style={{ flex: 1 }}
            renderLoading={() => (
              <View
                style={{
                  position: "absolute",
                  top: 0,
                  left: 0,
                  right: 0,
                  bottom: 0,
                  justifyContent: "center",
                  alignItems: "center",
                  backgroundColor: "#000",
                }}
              >
                <Text style={{ color: "#fff", fontSize: 16 }}>
                  로딩 중...
                </Text>
              </View>
            )}
          />
        </SafeAreaView>
      </Modal>
    </>
  );
};

const styles = StyleSheet.create({
  overlay: {
    flex: 1,
    backgroundColor: "rgba(0, 0, 0, 0.7)",
    justifyContent: "center",
    alignItems: "center",
    padding: 20,
    zIndex: 9999,
  },
  modalContent: {
    backgroundColor: "#303030",
    borderRadius: 16,
    width: "100%",
    maxWidth: 402,
    maxHeight: "85%",
    minHeight: 400,
    position: "relative",
    shadowColor: "#000",
    shadowOffset: { width: 0, height: 10 },
    shadowOpacity: 0.4,
    shadowRadius: 24,
    elevation: 12,
    overflow: "hidden",
  },
  closeBtn: {
    position: "absolute",
    top: 16,
    left: 16,
    width: 32,
    height: 32,
    zIndex: 100,
    justifyContent: "center",
    alignItems: "center",
  },
  scrollView: {
    flexGrow: 0,
  },
  scrollContent: {
    padding: 24,
    paddingTop: 48,
    paddingBottom: 24,
  },
  header: {
    flexDirection: "row",
    alignItems: "center",
    justifyContent: "center",
    marginBottom: 24,
    gap: 6,
  },
  intelfitText: {
    fontSize: 20,
    fontWeight: "800",
    fontStyle: "italic",
    color: "#e3ff7c",
    letterSpacing: 0.5,
  },
  premiumContainer: {
    shadowColor: "#e3ff7c",
    shadowOffset: { width: 0, height: 0 },
    shadowOpacity: 1,
    shadowRadius: 12,
    elevation: 8,
    borderRadius: 6,
    overflow: "hidden",
  },
  premiumGradient: {
    justifyContent: "center",
    alignItems: "center",
    paddingHorizontal: 10,
    paddingVertical: 4,
    paddingLeft: 8,
    borderRadius: 6,
    backgroundColor: "#e3ff7c",
  },
  premiumText: {
    fontSize: 36,
    fontWeight: "900",
    fontStyle: "italic",
    color: "#000000",
    letterSpacing: 1,
    textShadowColor: "rgba(255, 255, 255, 0.8)",
    textShadowOffset: { width: 0, height: 1 },
    textShadowRadius: 4,
  },
  subtitle: {
    fontSize: 15,
    fontWeight: "400",
    color: "#d9d9d9",
    textAlign: "center",
    marginBottom: 32,
    letterSpacing: 0.2,
    lineHeight: 22,
  },
  featuresContainer: {
    marginBottom: 36,
    gap: 20,
  },
  featureItem: {
    flexDirection: "row",
    alignItems: "flex-start",
    gap: 14,
  },
  checkCircle: {
    width: 19,
    height: 19,
    borderRadius: 9.5,
    backgroundColor: "#e3ff7c",
    justifyContent: "center",
    alignItems: "center",
    marginTop: 1,
    shadowColor: "#e3ff7c",
    shadowOffset: { width: 0, height: 0 },
    shadowOpacity: 0.3,
    shadowRadius: 4,
    elevation: 2,
  },
  featureTextContainer: {
    flex: 1,
  },
  featureTitle: {
    fontSize: 17,
    fontWeight: "700",
    color: "#ffffff",
    lineHeight: 21,
    letterSpacing: 0.2,
  },
  featureDescription: {
    fontSize: 13,
    fontWeight: "400",
    color: "#d9d9d9",
    marginTop: 4,
    lineHeight: 16,
    letterSpacing: 0.1,
  },
  sectionTitle: {
    fontSize: 16,
    fontWeight: "700",
    color: "#ffffff",
    marginBottom: 12,
    letterSpacing: 0.3,
  },
  plansContainer: {
    marginBottom: 28,
  },
  planCard: {
    backgroundColor: "#464646",
    borderRadius: 12,
    padding: 18,
    position: "relative",
    minHeight: 70,
    justifyContent: "center",
    borderWidth: 2,
    borderColor: "transparent",
    marginBottom: 12,
    shadowColor: "#000",
    shadowOffset: { width: 0, height: 2 },
    shadowOpacity: 0.15,
    shadowRadius: 6,
    elevation: 3,
  },
  planCardSelected: {
    backgroundColor: "#4a4a4a",
    borderWidth: 2,
    borderColor: "#e3ff7c",
  },
  discountBadge: {
    position: "absolute",
    top: -12,
    right: 16,
    backgroundColor: "#e3ff7c",
    borderRadius: 6,
    paddingHorizontal: 14,
    paddingVertical: 5,
    shadowColor: "#000",
    shadowOffset: { width: 0, height: 3 },
    shadowOpacity: 0.25,
    shadowRadius: 5,
    elevation: 4,
    zIndex: 10,
  },
  discountText: {
    fontSize: 15,
    fontWeight: "700",
    color: "#000000",
    letterSpacing: 0.2,
  },
  planContent: {
    flexDirection: "row",
    justifyContent: "space-between",
    alignItems: "center",
    paddingTop: 4,
  },
  planType: {
    fontSize: 20,
    fontWeight: "700",
    color: "#ffffff",
    letterSpacing: 0.3,
  },
  planPriceContainer: {
    alignItems: "flex-end",
    gap: 2,
  },
  planPriceMonthly: {
    fontSize: 20,
    fontWeight: "700",
    color: "#ffffff",
    letterSpacing: 0.2,
  },
  planPriceYearly: {
    fontSize: 12,
    fontWeight: "400",
    color: "#d9d9d9",
    letterSpacing: 0.1,
  },
  paymentMethodContainer: {
    marginBottom: 28,
  },
  paymentMethodCard: {
    backgroundColor: "#464646",
    borderRadius: 12,
    padding: 16,
    flexDirection: "row",
    justifyContent: "space-between",
    alignItems: "center",
    borderWidth: 2,
    borderColor: "transparent",
    marginBottom: 12,
    shadowColor: "#000",
    shadowOffset: { width: 0, height: 2 },
    shadowOpacity: 0.15,
    shadowRadius: 6,
    elevation: 3,
  },
  paymentMethodCardSelected: {
    backgroundColor: "#4a4a4a",
    borderColor: "#e3ff7c",
  },
  paymentMethodContent: {
    flexDirection: "row",
    alignItems: "center",
    gap: 14,
  },
  paymentMethodIcon: {
    width: 48,
    height: 48,
    borderRadius: 24,
    backgroundColor: "#5a5a5a",
    justifyContent: "center",
    alignItems: "center",
  },
  kakaoIcon: {
    fontSize: 24,
  },
  paymentMethodText: {
    gap: 4,
  },
  paymentMethodTitle: {
    fontSize: 16,
    fontWeight: "700",
    color: "#ffffff",
    letterSpacing: 0.2,
  },
  paymentMethodSubtitle: {
    fontSize: 13,
    fontWeight: "400",
    color: "#d9d9d9",
    letterSpacing: 0.1,
  },
  continueButton: {
    borderRadius: 12,
    borderWidth: 2,
    borderColor: "#666",
    paddingVertical: 18,
    alignItems: "center",
    justifyContent: "center",
    backgroundColor: "transparent",
  },
  continueButtonActive: {
    backgroundColor: "#e3ff7c",
    borderColor: "#e3ff7c",
    shadowColor: "#e3ff7c",
    shadowOffset: { width: 0, height: 0 },
    shadowOpacity: 0.4,
    shadowRadius: 10,
    elevation: 5,
  },
  continueButtonText: {
    fontSize: 16,
    fontWeight: "700",
    color: "#999",
    letterSpacing: 0.3,
  },
  continueButtonTextActive: {
    color: "#000000",
  },
  webViewHeader: {
    flexDirection: "row",
    justifyContent: "space-between",
    alignItems: "center",
    paddingHorizontal: 16,
    paddingVertical: 12,
    backgroundColor: "#1a1a1a",
    borderBottomWidth: 1,
    borderBottomColor: "#333",
  },
  webViewCloseBtn: {
    width: 40,
    height: 40,
    justifyContent: "center",
    alignItems: "center",
  },
  webViewTitle: {
    fontSize: 18,
    fontWeight: "600",
    color: "#ffffff",
  },
});

export default PremiumModal;