import React from "react";
import {
  View,
  Text,
  Modal,
  TouchableOpacity,
  StyleSheet,
  ScrollView,
} from "react-native";
import { Ionicons as Icon } from "@expo/vector-icons";
import { colors } from "../../theme/colors";

interface MyPlanModalProps {
  isOpen: boolean;
  onClose: () => void;
  navigation: any; // 나중에 구체적인 타입으로 변경 가능
}

const MyPlanModal: React.FC<MyPlanModalProps> = ({
  isOpen,
  onClose,
  navigation,
}) => {
  // 나중에 props나 상태로 관리할 구독 여부
  const isSubscribed = false;

  const today = new Date();
  const nextBillingDate = new Date(today);
  nextBillingDate.setDate(today.getDate() + 30);

  const plan = {
    name: "프리미엄 플랜",
    price: "5,900원",
    nextBillingDate: nextBillingDate.toISOString(),
    features: ["무제한 챗봇", "무제한 운동추천", "무제한 식단 추천"],
  };

  const formatDate = (dateString: string) => {
    const date = new Date(dateString);
    return date.toLocaleDateString("ko-KR", {
      year: "numeric",
      month: "2-digit",
      day: "2-digit",
    });
  };

  const handleSubscribe = () => {
    // 나중에 결제 API 연결
    console.log("구독하기 클릭");
    onClose(); // 모달 닫고
    navigation.navigate("PaymentSuccess"); // 결제 완료 페이지로 이동
  };

  const handleCancel = () => {
    // 나중에 구독 취소 API 연결
    console.log("플랜 해지하기 클릭");
  };

  return (
    <Modal
      visible={isOpen}
      animationType="slide"
      transparent={true}
      onRequestClose={onClose}
    >
      <View style={styles.overlay}>
        <View style={styles.modalContent}>
          <View style={styles.header}>
            <Text style={styles.title}>플랜</Text>
            <TouchableOpacity onPress={onClose} style={styles.closeBtn}>
              <Icon name="close" size={20} color="#ffffff" />
            </TouchableOpacity>
          </View>

          <ScrollView style={styles.body}>
            <View style={styles.planSection}>
              {isSubscribed && (
                <View style={styles.subscribedBadge}>
                  <Icon name="trophy" size={14} color="#000000" />
                  <Text style={styles.badgeText}>구독 중</Text>
                </View>
              )}
              <View
                style={[
                  styles.planCard,
                  isSubscribed && styles.planCardSubscribed,
                ]}
              >
                <Text style={styles.planName}>{plan.name}</Text>
                <Text style={styles.planPrice}>
                  {plan.price}
                  <Text style={styles.priceUnit}>/월</Text>
                </Text>

                <View style={styles.planDates}>
                  <View style={styles.dateItem}>
                    <Text style={styles.dateLabel}>다음 결제일</Text>
                    <Text style={styles.dateValue}>
                      {formatDate(plan.nextBillingDate)}
                    </Text>
                  </View>
                </View>

                <View style={styles.features}>
                  <Text style={styles.featuresTitle}>포함된 기능</Text>
                  {plan.features.map((feature, index) => (
                    <View key={index} style={styles.featureItem}>
                      <Icon name="checkmark-circle" size={16} color="#4ade80" />
                      <Text style={styles.featureText}>{feature}</Text>
                    </View>
                  ))}
                </View>

                {!isSubscribed && (
                  <TouchableOpacity
                    style={styles.subscribeBtn}
                    onPress={handleSubscribe}
                  >
                    <Text style={styles.subscribeBtnText}>구독하기</Text>
                  </TouchableOpacity>
                )}
              </View>
            </View>

            {isSubscribed && (
              <View style={styles.planActions}>
                <TouchableOpacity
                  style={styles.cancelBtn}
                  onPress={handleCancel}
                >
                  <Text style={styles.cancelBtnText}>플랜 해지하기</Text>
                </TouchableOpacity>
              </View>
            )}
          </ScrollView>
        </View>
      </View>
    </Modal>
  );
};

const styles = StyleSheet.create({
  overlay: {
    flex: 1,
    backgroundColor: "rgba(0, 0, 0, 0.5)",
    justifyContent: "center",
    alignItems: "center",
    padding: 20,
  },
  modalContent: {
    backgroundColor: "#2a2a2a",
    borderRadius: 16,
    width: "100%",
    maxWidth: 400,
    maxHeight: "85%",
  },
  header: {
    flexDirection: "row",
    justifyContent: "space-between",
    alignItems: "center",
    padding: 16,
    paddingHorizontal: 20,
    borderBottomWidth: 1,
    borderBottomColor: "#404040",
    flexShrink: 0,
  },
  title: {
    fontSize: 17,
    fontWeight: "600",
    color: "#ffffff",
  },
  closeBtn: {
    width: 32,
    height: 32,
    justifyContent: "center",
    alignItems: "center",
    padding: 4,
  },
  body: {
    padding: 20,
  },
  planSection: {
    marginBottom: 24,
  },
  subscribedBadge: {
    flexDirection: "row",
    alignItems: "center",
    gap: 6,
    backgroundColor: "#4ade80",
    paddingVertical: 6,
    paddingHorizontal: 12,
    borderRadius: 20,
    alignSelf: "flex-start",
    marginBottom: 12,
  },
  badgeText: {
    fontSize: 12,
    color: "#000000",
    fontWeight: "600",
  },
  planCard: {
    backgroundColor: "rgba(255, 255, 255, 0.05)",
    borderWidth: 1,
    borderColor: "#404040",
    padding: 20,
    borderRadius: 12,
  },
  planCardSubscribed: {
    backgroundColor: "rgba(74, 222, 128, 0.1)",
    borderColor: "#4ade80",
  },
  planName: {
    fontSize: 20,
    fontWeight: "700",
    color: "#ffffff",
    marginBottom: 8,
  },
  planPrice: {
    fontSize: 28,
    fontWeight: "700",
    color: "#4ade80",
    marginBottom: 16,
  },
  priceUnit: {
    fontSize: 16,
    fontWeight: "400",
    color: "#cccccc",
  },
  planDates: {
    marginBottom: 16,
    paddingBottom: 16,
    borderBottomWidth: 1,
    borderBottomColor: "rgba(255, 255, 255, 0.1)",
  },
  dateItem: {
    gap: 4,
  },
  dateLabel: {
    fontSize: 11,
    color: "#cccccc",
  },
  dateValue: {
    fontSize: 13,
    color: "#ffffff",
    fontWeight: "600",
  },
  features: {
    gap: 8,
  },
  featuresTitle: {
    fontSize: 14,
    fontWeight: "600",
    color: "#ffffff",
    marginBottom: 12,
  },
  featureItem: {
    flexDirection: "row",
    alignItems: "center",
    gap: 8,
  },
  featureText: {
    fontSize: 13,
    color: "#ffffff",
  },
  subscribeBtn: {
    marginTop: 16,
    padding: 14,
    backgroundColor: "#4ade80",
    borderRadius: 8,
    alignItems: "center",
  },
  subscribeBtnText: {
    color: "#000000",
    fontSize: 15,
    fontWeight: "700",
  },
  planActions: {
    paddingTop: 16,
    borderTopWidth: 1,
    borderTopColor: "#404040",
  },
  cancelBtn: {
    padding: 12,
    borderRadius: 8,
    borderWidth: 1,
    borderColor: "#ff6b6b",
    backgroundColor: "rgba(255, 107, 107, 0.1)",
    alignItems: "center",
  },
  cancelBtnText: {
    color: "#ff6b6b",
    fontSize: 14,
    fontWeight: "600",
  },
});

export default MyPlanModal;
