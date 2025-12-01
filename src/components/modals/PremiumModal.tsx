import React, { useState, useEffect } from "react";
import {
  View,
  Text,
  Modal,
  TouchableOpacity,
  StyleSheet,
  ScrollView,
} from "react-native";
import { Ionicons as Icon } from "@expo/vector-icons";
import { LinearGradient } from "expo-linear-gradient";

interface PremiumModalProps {
  isOpen: boolean;
  onClose: () => void;
  onContinue?: () => void;
}

type PlanType = "annual" | "monthly" | null;

const PremiumModal: React.FC<PremiumModalProps> = ({
  isOpen,
  onClose,
  onContinue,
}) => {
  const [selectedPlan, setSelectedPlan] = useState<PlanType>(null);

  useEffect(() => {
    if (isOpen) {
      console.log("[PremiumModal] 모달 열림");
      // 모달이 열릴 때마다 선택 초기화
      setSelectedPlan(null);
    }
  }, [isOpen]);

  const handleContinue = () => {
    if (!selectedPlan) return; // 플랜이 선택되지 않았으면 실행 안 함
    
    if (onContinue) {
      onContinue();
    }
    // 나중에 결제 API 연결
    console.log("선택된 플랜:", selectedPlan);
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

  return (
    <Modal
      visible={isOpen}
      animationType="fade"
      transparent={true}
      onRequestClose={onClose}
      statusBarTranslucent={true}
    >
      <View style={styles.overlay}>
        <View style={styles.modalContent}>
          {/* 닫기 버튼 */}
          <TouchableOpacity onPress={onClose} style={styles.closeBtn}>
            <Icon name="close" size={24} color="#ffffff" />
          </TouchableOpacity>

          <ScrollView
            style={styles.scrollView}
            contentContainerStyle={styles.scrollContent}
            showsVerticalScrollIndicator={false}
            bounces={false}
          >
            {/* 헤더 */}
            <View style={styles.header}>
              <Text style={styles.intelfitText}>INTELFIT</Text>
              <View style={styles.premiumContainer}>
                <LinearGradient
                  colors={["#e3ff7c", "#fff9c4", "#ffffff"]}
                  start={{ x: 0, y: 0 }}
                  end={{ x: 1, y: 0 }}
                  style={styles.premiumGradient}
                >
                  <Text style={styles.premiumText}>premium</Text>
                </LinearGradient>
              </View>
            </View>

            {/* 서브타이틀 */}
            <Text style={styles.subtitle}>
              더욱 전문적인 트레이닝을 받아보세요.
            </Text>

            {/* 기능 리스트 */}
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

            {/* 가격 옵션 */}
            <View style={styles.plansContainer}>
              {/* 연간 플랜 */}
              <TouchableOpacity
                style={[
                  styles.planCard,
                  selectedPlan === "annual" && styles.planCardSelected,
                ]}
                onPress={() => setSelectedPlan("annual")}
                activeOpacity={0.7}
              >
                {/* 16% 할인 배지는 항상 표시 */}
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

              {/* 월간 플랜 */}
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

            {/* 계속하기 버튼 */}
            <TouchableOpacity
              style={[
                styles.continueButton,
                selectedPlan === "annual" && styles.continueButtonSelected,
                selectedPlan === "monthly" && styles.continueButtonMonthly,
              ]}
              onPress={handleContinue}
              activeOpacity={0.8}
            >
              <Text
                style={[
                  styles.continueButtonText,
                  selectedPlan === "annual" &&
                    styles.continueButtonTextSelected,
                  selectedPlan === "monthly" && styles.continueButtonTextMonthly,
                ]}
              >
                계속하기
              </Text>
            </TouchableOpacity>
          </ScrollView>
        </View>
      </View>
    </Modal>
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
    shadowOffset: {
      width: 0,
      height: 10,
    },
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
    backgroundColor: "rgba(0, 0, 0, 0.3)",
    borderRadius: 16,
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
    gap: 10,
  },
  intelfitText: {
    fontSize: 20,
    fontWeight: "800",
    color: "#e3ff7c",
    letterSpacing: 0.5,
  },
  premiumContainer: {
    shadowColor: "#e3ff7c",
    shadowOffset: {
      width: 0,
      height: 0,
    },
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
    shadowOffset: {
      width: 0,
      height: 0,
    },
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
  plansContainer: {
    marginBottom: 28,
    gap: 14,
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
    shadowColor: "#000",
    shadowOffset: {
      width: 0,
      height: 2,
    },
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
    shadowOffset: {
      width: 0,
      height: 3,
    },
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
  continueButton: {
    borderRadius: 12,
    borderWidth: 2,
    borderColor: "#e3ff7c",
    paddingVertical: 18,
    alignItems: "center",
    justifyContent: "center",
    backgroundColor: "transparent",
    shadowColor: "#e3ff7c",
    shadowOffset: {
      width: 0,
      height: 0,
    },
    shadowOpacity: 0.6,
    shadowRadius: 12,
    elevation: 6,
  },
  continueButtonSelected: {
    backgroundColor: "#e3ff7c",
    borderColor: "#e3ff7c",
    shadowColor: "#e3ff7c",
    shadowOffset: {
      width: 0,
      height: 0,
    },
    shadowOpacity: 0.8,
    shadowRadius: 16,
    elevation: 8,
  },
  continueButtonMonthly: {
    backgroundColor: "#e3ff7c",
    borderColor: "#e3ff7c",
    borderWidth: 2,
    shadowColor: "#e3ff7c",
    shadowOffset: {
      width: 0,
      height: 0,
    },
    shadowOpacity: 0.8,
    shadowRadius: 16,
    elevation: 8,
  },
  continueButtonDisabled: {
    borderColor: "#e3ff7c",
    opacity: 1,
  },
  continueButtonText: {
    fontSize: 16,
    fontWeight: "700",
    color: "#ffffff",
    letterSpacing: 0.3,
  },
  continueButtonTextSelected: {
    color: "#000000",
  },
  continueButtonTextMonthly: {
    color: "#000000",
  },
  continueButtonTextDisabled: {
    color: "#ffffff",
  },
});

export default PremiumModal;

