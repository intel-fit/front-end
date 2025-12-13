// src/screens/main/MyPageScreen.tsx

import React, { useState, useEffect } from "react";
import {
  View,
  Text,
  TouchableOpacity,
  StyleSheet,
  ScrollView,
  Alert,
  ActivityIndicator,
} from "react-native";
import { SafeAreaView } from "react-native-safe-area-context";
import { Ionicons as Icon } from "@expo/vector-icons";
import AsyncStorage from "@react-native-async-storage/async-storage";
import { authAPI } from "../../services";
import AIAnalysisModal from "../../components/modals/AIAnalysisModal";
import MyPlanModal from "../../components/modals/MyPlanModal";
import PaymentMethodModal from "../../components/modals/PaymentMethodModal";
import ProfileEditModal from "../../components/modals/ProfileEditModal";
import RoutineRecommendModal from "../../components/modals/RoutineRecommendModal";
import MealRecommendModal from "../../components/modals/MealRecommendModal";
import DeleteAccountModal from "../../components/modals/DeleteAccountModal";
import PremiumModal from "../../components/modals/PremiumModal";
import { useRoute } from "@react-navigation/native";
import { useFocusEffect } from "@react-navigation/native";

const MyPageScreen = ({ navigation }: any) => {
  const route = useRoute<any>();

  const [profileData, setProfileData] = useState<any>(null);
  const [loading, setLoading] = useState(true);
  const [currentMembershipType, setCurrentMembershipType] = useState<
    "FREE" | "PREMIUM"
  >("FREE");

  // 모달 상태
  const [isAIAnalysisModalOpen, setIsAIAnalysisModalOpen] = useState(false);
  const [isMyPlanModalOpen, setIsMyPlanModalOpen] = useState(false);
  const [isPaymentMethodModalOpen, setIsPaymentMethodModalOpen] =
    useState(false);
  const [isProfileEditModalOpen, setIsProfileEditModalOpen] = useState(false);
  const [isRoutineRecommendModalOpen, setIsRoutineRecommendModalOpen] =
    useState(false);
  const [isMealRecommendModalOpen, setIsMealRecommendModalOpen] =
    useState(false);
  const [isDeleteAccountModalOpen, setIsDeleteAccountModalOpen] =
    useState(false);
  const [isPremiumModalOpen, setIsPremiumModalOpen] = useState(false);

  //  1. 외부에서 넘어온 파라미터 감지 (내 플랜 모달 열기)

  useEffect(() => {
    if (route.params?.openPremiumModal) {
      console.log("🔓 마이페이지 진입: 프리미엄 모달 자동 오픈");
      setIsPremiumModalOpen(true);
      navigation.setParams({ openPremiumModal: undefined });
    }
  }, [route.params]);

  //  2. 초기 데이터 로드
  useFocusEffect(
    React.useCallback(() => {
      console.log("🔄 마이페이지 포커스 - 데이터 새로고침");
      fetchProfile();
      loadMembershipType();
    }, [])
  );

  const fetchProfile = async () => {
    try {
      setLoading(true);
      const data = await authAPI.getProfile();
      setProfileData(data);
    } catch (error: any) {
      console.error("프로필 로드 실패:", error);
      if (error.status === 401) navigation.replace("Login");
    } finally {
      setLoading(false);
    }
  };

  //  멤버십 타입 로드
  const loadMembershipType = async () => {
    try {
      const membershipType = await AsyncStorage.getItem("membershipType");
      if (membershipType) {
        setCurrentMembershipType(membershipType as "FREE" | "PREMIUM");
      }
    } catch (error) {
      console.error("멤버십 타입 로드 실패:", error);
    }
  };

  //  테스트용 멤버십 전환 함수
  const handleToggleMembership = async () => {
    const newType = currentMembershipType === "FREE" ? "PREMIUM" : "FREE";

    Alert.alert(
      "멤버십 전환",
      `${
        newType === "PREMIUM" ? "프리미엄" : "무료"
      } 플랜으로 전환하시겠습니까?`,
      [
        { text: "취소", style: "cancel" },
        {
          text: "전환",
          onPress: async () => {
            try {
              console.log(
                "🔄 멤버십 전환 시작:",
                currentMembershipType,
                "→",
                newType
              );

              // 1. 멤버십 전환
              const result = await authAPI.toggleMembership();

              // ✅ 2. 프리미엄으로 전환한 경우 토큰 초기화 (무제한 활성화)
              if (result.newType === "PREMIUM") {
                try {
                  await authAPI.resetTokens();
                  console.log("✅ 프리미엄 전환 + 토큰 초기화 완료");
                } catch (tokenError) {
                  console.warn("⚠️ 토큰 초기화 실패 (무시):", tokenError);
                }
              }

              setCurrentMembershipType(result.newType);
              
              // AsyncStorage에 멤버십 타입 업데이트 (다른 화면에서도 반영되도록)
              await AsyncStorage.setItem("membershipType", result.newType);
              console.log("✅ AsyncStorage에 멤버십 타입 업데이트:", result.newType);

              Alert.alert(
                "전환 완료 ✅",
                result.message +
                  (result.newType === "PREMIUM" ? "\n\n 전환 완료" : ""),
                [
                  {
                    text: "확인",
                    onPress: () => {
                      loadMembershipType();
                    },
                  },
                ]
              );

              console.log("✅ 멤버십 전환 완료:", result);
            } catch (error: any) {
              console.error("❌ 멤버십 전환 실패:", error);
              Alert.alert(
                "오류",
                error.message || "멤버십 전환에 실패했습니다."
              );
            }
          },
        },
      ]
    );
  };

  const handleLogout = () => {
    Alert.alert("로그아웃", "정말로 로그아웃하시겠습니까?", [
      { text: "취소", style: "cancel" },
      {
        text: "확인",
        onPress: async () => {
          await authAPI.logout();
          navigation.replace("Login");
        },
      },
    ]);
  };

  const handleDeleteAccount = () => {
    setIsDeleteAccountModalOpen(true);
  };

  const getMembershipTypeText = (type: string) => {
    switch (type) {
      case "FREE":
        return "무료 회원";
      case "PREMIUM":
        return "프리미엄 회원";
      case "VIP":
        return "풀업의 신";
      default:
        return "무료 회원";
    }
  };

  if (loading) {
    return (
      <SafeAreaView style={styles.container} edges={["top"]}>
        <View style={[styles.container, styles.centerContent]}>
          <ActivityIndicator size="large" color={NEW_COLORS.accent} />
          <Text style={styles.loadingText}>프로필을 불러오는 중...</Text>
        </View>
      </SafeAreaView>
    );
  }

  if (!profileData) {
    return (
      <SafeAreaView style={styles.container} edges={["top"]}>
        <View style={[styles.container, styles.centerContent]}>
          <Text style={styles.errorText}>프로필 정보를 불러올 수 없습니다</Text>
          <TouchableOpacity style={styles.retryBtn} onPress={fetchProfile}>
            <Text style={styles.retryBtnText}>다시 시도</Text>
          </TouchableOpacity>
        </View>
      </SafeAreaView>
    );
  }

  return (
    <SafeAreaView style={styles.container} edges={["top"]}>
      <View style={styles.header}>
        <Text style={styles.headerTitle}>마이페이지</Text>
      </View>

      <ScrollView
        style={styles.content}
        showsVerticalScrollIndicator={false}
        contentContainerStyle={{ paddingBottom: 100 }}
      >
        {/* 프로필 카드 */}
        <View style={styles.profileCard}>
          <View style={styles.profileInfo}>
            <View style={styles.profileAvatar}>
              <Icon
                name="person-circle-outline"
                size={40}
                color={NEW_COLORS.text_secondary}
              />
            </View>
            <View style={styles.profileDetails}>
              <View style={styles.username}>
                <Text style={styles.usernameText}>
                  {profileData?.name || "사용자"}님
                </Text>
              </View>
              <View style={styles.membershipBadgeContainer}>
                <Text style={styles.userTitle}>
                  {getMembershipTypeText(currentMembershipType)}
                </Text>
                {/*  현재 멤버십 상태 표시 */}
                <View
                  style={[
                    styles.membershipStatusBadge,
                    currentMembershipType === "PREMIUM" &&
                      styles.premiumStatusBadge,
                  ]}
                >
                  <Icon
                    name={
                      currentMembershipType === "PREMIUM" ? "star" : "person"
                    }
                    size={12}
                    color={
                      currentMembershipType === "PREMIUM"
                        ? "#FFD700"
                        : NEW_COLORS.text_secondary
                    }
                  />
                </View>
              </View>
            </View>
          </View>

          <TouchableOpacity
            style={styles.editProfileButton}
            onPress={() => setIsProfileEditModalOpen(true)}
          >
            <Icon name="pencil" size={18} color={NEW_COLORS.text} />
          </TouchableOpacity>
        </View>

        <View style={styles.separator} />

        {/* 테스트 섹션 */}
        <View style={styles.section}>
          <Text style={styles.sectionTitle}>🧪 개발 테스트 (개발 전용)</Text>
          <View style={styles.sectionLinks}>
            {/*  멤버십 전환 버튼 */}
            <TouchableOpacity
              style={styles.linkItem}
              onPress={handleToggleMembership}
            >
              <View style={styles.linkItemWithBadge}>
                <Text
                  style={[
                    styles.linkText,
                    {
                      color:
                        currentMembershipType === "PREMIUM"
                          ? "#FFD700"
                          : NEW_COLORS.accent,
                    },
                  ]}
                >
                  {currentMembershipType === "FREE" ? "🆓 → 💎" : "💎 → 🆓"}{" "}
                  무료/유료 전환
                </Text>
                <View
                  style={[
                    styles.statusBadge,
                    currentMembershipType === "PREMIUM" && styles.premiumBadge,
                  ]}
                >
                  <Text style={styles.statusBadgeText}>
                    {currentMembershipType === "FREE" ? "FREE" : "PREMIUM"}
                  </Text>
                </View>
              </View>
              <Icon
                name="swap-horizontal"
                size={20}
                color={
                  currentMembershipType === "PREMIUM"
                    ? "#FFD700"
                    : NEW_COLORS.accent
                }
              />
            </TouchableOpacity>

            <View style={styles.subSeparator} />

            <TouchableOpacity
              style={styles.linkItem}
              onPress={() => navigation.navigate("PaymentSuccess")}
            >
              <Text style={[styles.linkText, { color: "#4ade80" }]}>
                ✅ 결제 성공 화면
              </Text>
              <Icon name="chevron-forward" size={18} color="#4ade80" />
            </TouchableOpacity>

            <View style={styles.subSeparator} />

            <TouchableOpacity
              style={styles.linkItem}
              onPress={() => navigation.navigate("PaymentFail")}
            >
              <Text style={[styles.linkText, { color: "#ef4444" }]}>
                ❌ 결제 실패 화면
              </Text>
              <Icon name="chevron-forward" size={18} color="#ef4444" />
            </TouchableOpacity>

            <View style={styles.subSeparator} />

            <TouchableOpacity
              style={styles.linkItem}
              onPress={() => navigation.navigate("PaymentCancel")}
            >
              <Text style={[styles.linkText, { color: "#f59e0b" }]}>
                🚫 결제 취소 화면
              </Text>
              <Icon name="chevron-forward" size={18} color="#f59e0b" />
            </TouchableOpacity>
          </View>
        </View>

        <View style={styles.separator} />

        {/* 구독/결제 */}
        <View style={styles.section}>
          <Text style={styles.sectionTitle}>💳 구독/결제</Text>
          <View style={styles.sectionLinks}>
            <TouchableOpacity
              style={styles.linkItem}
              onPress={() => setIsPremiumModalOpen(true)}
            >
              <Text style={styles.linkText}>내 플랜 보기</Text>
              <Icon
                name="chevron-forward"
                size={18}
                color={NEW_COLORS.text_secondary}
              />
            </TouchableOpacity>

            <View style={styles.subSeparator} />

            <TouchableOpacity
              style={styles.linkItem}
              onPress={() => setIsPaymentMethodModalOpen(true)}
            >
              <Text style={styles.linkText}>결제 수단 관리</Text>
              <Icon
                name="chevron-forward"
                size={18}
                color={NEW_COLORS.text_secondary}
              />
            </TouchableOpacity>
          </View>
        </View>

        <View style={styles.separator} />

        {/* 추천 내역 */}
        <View style={styles.section}>
          <Text style={styles.sectionTitle}>🌟 추천 내역</Text>
          <View style={styles.sectionLinks}>
            <View style={styles.subSeparator} />

            <TouchableOpacity
              style={styles.linkItem}
              onPress={() => navigation.navigate("RoutineRecommend")}
            >
              <Text style={styles.linkText}>운동 추천 내역</Text>
              <Icon
                name="chevron-forward"
                size={18}
                color={NEW_COLORS.text_secondary}
              />
            </TouchableOpacity>

            <View style={styles.subSeparator} />

            <TouchableOpacity
              style={styles.linkItem}
              onPress={() => navigation.navigate("MealRecommendHistory")}
            >
              <Text style={styles.linkText}>식단 추천 내역</Text>
              <Icon
                name="chevron-forward"
                size={18}
                color={NEW_COLORS.text_secondary}
              />
            </TouchableOpacity>
          </View>
        </View>

        <View style={styles.separator} />

        {/* 계정 관리 */}
        <View style={styles.section}>
          <Text style={styles.sectionTitle}>⚙️ 계정 관리</Text>
          <View style={styles.sectionLinks}>
            <TouchableOpacity style={styles.linkItem} onPress={handleLogout}>
              <Text style={[styles.linkText, styles.logoutText]}>로그아웃</Text>
              <Icon
                name="log-out-outline"
                size={18}
                color={NEW_COLORS.text_secondary}
              />
            </TouchableOpacity>

            <View style={styles.subSeparator} />

            <TouchableOpacity
              style={styles.linkItem}
              onPress={handleDeleteAccount}
            >
              <Text style={[styles.linkText, styles.deleteText]}>회원탈퇴</Text>
              <Icon
                name="person-remove-outline"
                size={18}
                color={NEW_COLORS.delete_color}
              />
            </TouchableOpacity>
          </View>
        </View>
      </ScrollView>

      {/* 모달들 */}
      <AIAnalysisModal
        isOpen={isAIAnalysisModalOpen}
        onClose={() => setIsAIAnalysisModalOpen(false)}
      />
      <MyPlanModal
        isOpen={isMyPlanModalOpen}
        onClose={() => setIsMyPlanModalOpen(false)}
        navigation={navigation}
      />
      <PaymentMethodModal
        isOpen={isPaymentMethodModalOpen}
        onClose={() => setIsPaymentMethodModalOpen(false)}
      />
      <ProfileEditModal
        isOpen={isProfileEditModalOpen}
        onClose={() => setIsProfileEditModalOpen(false)}
        profileData={profileData}
        onProfileUpdate={fetchProfile}
      />
      <RoutineRecommendModal
        isOpen={isRoutineRecommendModalOpen}
        onClose={() => setIsRoutineRecommendModalOpen(false)}
      />
      <MealRecommendModal
        isOpen={isMealRecommendModalOpen}
        onClose={() => setIsMealRecommendModalOpen(false)}
      />
      <DeleteAccountModal
        isOpen={isDeleteAccountModalOpen}
        onClose={() => setIsDeleteAccountModalOpen(false)}
        onDeleteSuccess={() => navigation.replace("Login")}
      />
      <PremiumModal
        isOpen={isPremiumModalOpen}
        onClose={() => setIsPremiumModalOpen(false)}
      />
    </SafeAreaView>
  );
};

const NEW_COLORS = {
  background: "#1a1a1a",
  text: "#f0f0f0",
  text_secondary: "#a0a0a0",
  accent: "#e3ff7c",
  card_bg: "#252525",
  separator: "#3a3a3a",
  delete_color: "#ff6b6b",
};

const styles = StyleSheet.create({
  container: {
    flex: 1,
    backgroundColor: NEW_COLORS.background,
  },
  centerContent: {
    justifyContent: "center",
    alignItems: "center",
  },
  loadingText: {
    marginTop: 16,
    fontSize: 16,
    color: NEW_COLORS.text,
  },
  errorText: {
    fontSize: 16,
    color: NEW_COLORS.delete_color,
    marginBottom: 16,
  },
  retryBtn: {
    paddingHorizontal: 24,
    paddingVertical: 12,
    backgroundColor: NEW_COLORS.separator,
    borderRadius: 8,
  },
  retryBtnText: {
    color: NEW_COLORS.text,
    fontSize: 16,
    fontWeight: "600",
  },
  header: {
    paddingVertical: 16,
    paddingHorizontal: 20,
    alignItems: "center",
    justifyContent: "center",
  },
  headerTitle: {
    fontSize: 20,
    fontWeight: "700",
    color: NEW_COLORS.text,
  },
  content: {
    flex: 1,
    paddingHorizontal: 20,
  },
  profileCard: {
    marginTop: 16,
    marginBottom: 30,
    flexDirection: "row",
    justifyContent: "space-between",
    alignItems: "center",
    padding: 20,
    backgroundColor: NEW_COLORS.card_bg,
    borderRadius: 15,
  },
  profileInfo: {
    flexDirection: "row",
    alignItems: "center",
    gap: 16,
    flex: 1,
  },
  profileAvatar: {
    width: 60,
    height: 60,
    borderRadius: 30,
    backgroundColor: NEW_COLORS.separator,
    justifyContent: "center",
    alignItems: "center",
  },
  profileDetails: {
    flex: 1,
  },
  username: {
    flexDirection: "row",
    alignItems: "center",
    gap: 6,
    marginBottom: 4,
  },
  usernameText: {
    fontSize: 20,
    fontWeight: "bold",
    color: NEW_COLORS.text,
  },
  membershipBadgeContainer: {
    flexDirection: "row",
    alignItems: "center",
    gap: 8,
  },
  userTitle: {
    fontSize: 14,
    color: NEW_COLORS.accent,
    fontWeight: "500",
  },
  membershipStatusBadge: {
    paddingHorizontal: 6,
    paddingVertical: 2,
    borderRadius: 8,
    backgroundColor: NEW_COLORS.separator,
  },
  premiumStatusBadge: {
    backgroundColor: "#FFD70020",
  },
  editProfileButton: {
    padding: 8,
    backgroundColor: NEW_COLORS.separator,
    borderRadius: 10,
  },
  section: {
    paddingVertical: 16,
    marginBottom: 8,
  },
  separator: {
    height: 1,
    backgroundColor: NEW_COLORS.separator,
    marginVertical: 10,
  },
  subSeparator: {
    height: 1,
    backgroundColor: NEW_COLORS.separator,
    marginVertical: 4,
    marginLeft: 10,
  },
  sectionTitle: {
    fontSize: 18,
    fontWeight: "600",
    color: NEW_COLORS.text,
  },
  sectionLinks: {
    backgroundColor: NEW_COLORS.card_bg,
    borderRadius: 15,
    paddingHorizontal: 15,
    paddingVertical: 5,
    marginTop: 8,
  },
  linkItem: {
    flexDirection: "row",
    justifyContent: "space-between",
    alignItems: "center",
    paddingVertical: 14,
  },
  linkText: {
    fontSize: 16,
    color: NEW_COLORS.text,
    fontWeight: "400",
  },
  logoutText: {
    color: NEW_COLORS.accent,
    fontWeight: "500",
  },
  deleteText: {
    color: NEW_COLORS.delete_color,
    fontWeight: "500",
  },
  linkItemWithBadge: {
    flexDirection: "row",
    alignItems: "center",
    gap: 8,
  },
  newBadge: {
    backgroundColor: NEW_COLORS.accent,
    paddingHorizontal: 8,
    paddingVertical: 2,
    borderRadius: 8,
  },
  newBadgeText: {
    fontSize: 10,
    fontWeight: "700",
    color: "#000",
  },
  statusBadge: {
    backgroundColor: NEW_COLORS.separator,
    paddingHorizontal: 10,
    paddingVertical: 3,
    borderRadius: 10,
  },
  premiumBadge: {
    backgroundColor: "#FFD70020",
  },
  statusBadgeText: {
    fontSize: 11,
    fontWeight: "700",
    color: NEW_COLORS.accent,
  },
});

export default MyPageScreen;
