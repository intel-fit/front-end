// 내 플랜 보기로 재활용

import React, { useState, useEffect } from "react";
import {
  View,
  Text,
  Modal,
  TouchableOpacity,
  StyleSheet,
  ScrollView,
  Alert,
  ActivityIndicator,
} from "react-native";
import { Ionicons as Icon } from "@expo/vector-icons";
import { myPlanAPI, SubscriptionResponse } from "../../services/myPlanAPI";

// ✅ 1. Props 인터페이스 수정: onCancelSuccess 추가
interface PaymentMethodModalProps {
  isOpen: boolean;
  onClose: () => void;
  onCancelSuccess?: () => void; // 이 부분이 있어야 MyPageScreen에서 함수를 넘겨줄 수 있습니다.
}

const PaymentMethodModal: React.FC<PaymentMethodModalProps> = ({
  isOpen,
  onClose,
  onCancelSuccess, // ✅ 2. Props로 받기
}) => {
  const [subscription, setSubscription] = useState<SubscriptionResponse | null>(
    null
  );
  const [isLoading, setIsLoading] = useState<boolean>(false);

  // 모달이 열릴 때 데이터 조회
  useEffect(() => {
    if (isOpen) {
      fetchSubscriptionData();
    }
  }, [isOpen]);

  const fetchSubscriptionData = async () => {
    try {
      setIsLoading(true);
      const data = await myPlanAPI.getMySubscription();
      setSubscription(data);
    } catch (error) {
      console.error(error);
    } finally {
      setIsLoading(false);
    }
  };

  // ✅ 구독 취소 핸들러
  const handleCancelSubscription = () => {
    Alert.alert(
      "구독 취소",
      "정말로 구독을 취소하시겠습니까?\n취소 시 보안을 위해 로그아웃됩니다.",
      [
        { text: "유지하기", style: "cancel" },
        {
          text: "취소하기",
          style: "destructive",
          onPress: async () => {
            try {
              setIsLoading(true);

              // 1. 취소 API 호출
              const response = await myPlanAPI.cancelSubscription();

              if (response.success) {
                // 2. 성공 알림 및 로그아웃 실행
                Alert.alert(
                  "알림",
                  "구독이 정상적으로 취소되었습니다.\n로그아웃 됩니다.",
                  [
                    {
                      text: "확인",
                      onPress: () => {
                        onClose(); // 모달 닫기
                        // ✅ 3. 부모(MyPageScreen)에서 받은 로그아웃 함수 실행
                        if (onCancelSuccess) {
                          onCancelSuccess();
                        }
                      },
                    },
                  ]
                );
              }
            } catch (error: any) {
              Alert.alert(
                "오류",
                error.message || "취소 요청 중 문제가 발생했습니다."
              );
            } finally {
              setIsLoading(false);
            }
          },
        },
      ]
    );
  };

  // 날짜 포맷팅 (YYYY.MM.DD)
  const formatDate = (dateString: string | null) => {
    if (!dateString) return "-";
    const date = new Date(dateString);
    return `${date.getFullYear()}.${String(date.getMonth() + 1).padStart(
      2,
      "0"
    )}.${String(date.getDate()).padStart(2, "0")}`;
  };

  // 플랜 코드 한글 변환
  const getPlanName = (code: string | null) => {
    switch (code) {
      case "PREMIUM_MONTHLY":
        return "프리미엄 월간 멤버십";
      default:
        return "프리미엄 연간 멤버십";
    }
  };

  // 결제 수단 한글 변환
  const getProviderName = (provider: string | null) => {
    switch (provider) {
      case "KAKAOPAY":
        return "카카오페이";
      case "NAVERPAY":
        return "네이버페이";

      default:
        return provider || "-";
    }
  };

  // 현재 활성 구독 여부 확인
  const hasActive = subscription?.hasActiveSubscription;

  return (
    <Modal
      visible={isOpen}
      animationType="slide"
      transparent={true}
      onRequestClose={onClose}
    >
      <View style={styles.overlay}>
        <View style={styles.modalContent}>
          {/* 헤더 */}
          <View style={styles.header}>
            <Text style={styles.title}>내 구독 정보</Text>
            <TouchableOpacity onPress={onClose} style={styles.closeBtn}>
              <Icon name="close" size={24} color="#ffffff" />
            </TouchableOpacity>
          </View>

          {/* 로딩 상태 표시 */}
          {isLoading ? (
            <View style={styles.loadingContainer}>
              <ActivityIndicator size="large" color="#4ade80" />
              <Text style={styles.loadingText}>처리 중...</Text>
            </View>
          ) : (
            <ScrollView style={styles.body}>
              {/* ✅ 활성 구독이 있을 때만 정보 표시 */}
              {subscription && hasActive ? (
                <>
                  {/* 1. 플랜 정보 카드 */}
                  <View style={styles.section}>
                    <Text style={styles.sectionTitle}>이용 중인 상품</Text>

                    <View style={styles.planCard}>
                      <View style={styles.planHeader}>
                        <Icon name="diamond" size={28} color="#4ade80" />
                        <View style={styles.planTitleContainer}>
                          <Text style={styles.planName}>
                            {getPlanName(subscription.planCode)}
                          </Text>
                          <View style={styles.statusBadge}>
                            <Text style={styles.statusText}>
                              {subscription.status === "active"
                                ? "이용중"
                                : subscription.status}
                            </Text>
                          </View>
                        </View>
                      </View>

                      <View style={styles.divider} />

                      {/* 상세 정보 */}
                      <View style={styles.infoGrid}>
                        <View style={styles.infoRow}>
                          <Text style={styles.infoLabel}>시작일</Text>
                          <Text style={styles.infoValue}>
                            {formatDate(subscription.startedAt)}
                          </Text>
                        </View>
                        <View style={styles.infoRow}>
                          <Text style={styles.infoLabel}>다음 결제일</Text>
                          <Text style={styles.infoValue}>
                            {formatDate(subscription.expiredAt)}
                          </Text>
                        </View>
                        <View style={styles.infoRow}>
                          <Text style={styles.infoLabel}>결제 수단</Text>
                          <View style={styles.providerContainer}>
                            <Icon
                              name="card-outline"
                              size={14}
                              color="#cccccc"
                            />
                            <Text style={styles.infoValue}>
                              {getProviderName(subscription.provider)}
                            </Text>
                          </View>
                        </View>
                      </View>
                    </View>
                  </View>

                  {/* 2. 취소 버튼 */}
                  <View style={styles.section}>
                    <TouchableOpacity
                      style={styles.cancelBtn}
                      onPress={handleCancelSubscription}
                    >
                      <Text style={styles.cancelBtnText}>구독 취소</Text>
                    </TouchableOpacity>
                  </View>
                </>
              ) : (
                /* ✅ 구독 정보가 없거나 취소된 경우 */
                <View style={styles.emptyContainer}>
                  {subscription?.status === "canceled" ? (
                    <>
                      <Icon
                        name="checkmark-circle-outline"
                        size={48}
                        color="#ef4444"
                      />
                      <Text style={styles.emptyText}>
                        구독이 취소되었습니다.
                      </Text>
                    </>
                  ) : (
                    <>
                      <Icon
                        name="alert-circle-outline"
                        size={48}
                        color="#999999"
                      />
                      <Text style={styles.emptyText}>
                        사용 중인 구독 상품이 없습니다.
                      </Text>
                    </>
                  )}
                </View>
              )}

              {/* 3. 하단 안내 문구 */}
              <View style={styles.infoBox}>
                <Text style={styles.infoBoxTitle}>💡 멤버십 안내</Text>
                <View style={styles.infoList}>
                  <Text style={styles.infoItem}>
                    • 결제는 매월/매년 수동으로 진행 해야 합니다.
                  </Text>
                </View>
              </View>
            </ScrollView>
          )}
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
  },
  modalContent: {
    backgroundColor: "#2a2a2a",
    borderRadius: 16,
    width: "100%",
    maxWidth: 400,
    maxHeight: "80%",
    overflow: "hidden",
  },
  header: {
    flexDirection: "row",
    justifyContent: "space-between",
    alignItems: "center",
    padding: 16,
    paddingHorizontal: 20,
    borderBottomWidth: 1,
    borderBottomColor: "#404040",
  },
  title: {
    fontSize: 18,
    fontWeight: "700",
    color: "#ffffff",
  },
  closeBtn: {
    padding: 4,
  },
  loadingContainer: {
    padding: 40,
    alignItems: "center",
    justifyContent: "center",
    gap: 12,
  },
  loadingText: {
    color: "#cccccc",
    fontSize: 14,
  },
  body: {
    padding: 20,
  },
  section: {
    marginBottom: 24,
  },
  sectionTitle: {
    fontSize: 15,
    fontWeight: "600",
    color: "#cccccc",
    marginBottom: 10,
    marginLeft: 4,
  },
  planCard: {
    backgroundColor: "rgba(255, 255, 255, 0.05)",
    borderWidth: 1,
    borderColor: "#4ade80",
    borderRadius: 12,
    padding: 20,
  },
  planHeader: {
    flexDirection: "row",
    alignItems: "center",
    gap: 14,
    marginBottom: 16,
  },
  planTitleContainer: {
    flex: 1,
  },
  planName: {
    fontSize: 18,
    fontWeight: "700",
    color: "#ffffff",
    marginBottom: 4,
  },
  statusBadge: {
    backgroundColor: "#4ade80",
    alignSelf: "flex-start",
    paddingHorizontal: 8,
    paddingVertical: 3,
    borderRadius: 6,
  },
  statusText: {
    color: "#000000",
    fontSize: 11,
    fontWeight: "700",
  },
  divider: {
    height: 1,
    backgroundColor: "#404040",
    marginBottom: 16,
  },
  infoGrid: {
    gap: 12,
  },
  infoRow: {
    flexDirection: "row",
    justifyContent: "space-between",
    alignItems: "center",
  },
  infoLabel: {
    fontSize: 14,
    color: "#999999",
  },
  infoValue: {
    fontSize: 14,
    color: "#ffffff",
    fontWeight: "500",
  },
  providerContainer: {
    flexDirection: "row",
    alignItems: "center",
    gap: 6,
  },
  cancelBtn: {
    width: "100%",
    padding: 14,
    backgroundColor: "rgba(239, 68, 68, 0.15)",
    borderWidth: 1,
    borderColor: "#ef4444",
    borderRadius: 10,
    alignItems: "center",
  },
  cancelBtnText: {
    color: "#ef4444",
    fontSize: 15,
    fontWeight: "600",
  },
  emptyContainer: {
    alignItems: "center",
    justifyContent: "center",
    paddingVertical: 40,
    gap: 16,
  },
  emptyText: {
    color: "#999999",
    fontSize: 15,
    marginTop: 10,
  },
  infoBox: {
    backgroundColor: "rgba(74, 222, 128, 0.05)",
    borderRadius: 10,
    padding: 16,
    marginTop: 0,
  },
  infoBoxTitle: {
    color: "#4ade80",
    fontSize: 14,
    fontWeight: "600",
    marginBottom: 10,
  },
  infoList: {
    gap: 6,
  },
  infoItem: {
    color: "#cccccc",
    fontSize: 12,
    lineHeight: 18,
  },
});

export default PaymentMethodModal;
