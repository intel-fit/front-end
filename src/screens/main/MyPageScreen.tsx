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
import { colors } from "../../theme/colors";
import { authAPI } from "../../services";
import BadgeModal from "../../components/modals/BadgeModal";
import BadgeListModal from "../../components/modals/BadgeListModal";
import AIAnalysisModal from "../../components/modals/AIAnalysisModal";
import MyPlanModal from "../../components/modals/MyPlanModal";
import PaymentMethodModal from "../../components/modals/PaymentMethodModal";
import ProfileEditModal from "../../components/modals/ProfileEditModal";
import RoutineRecommendModal from "../../components/modals/RoutineRecommendModal";
import MealRecommendModal from "../../components/modals/MealRecommendModal";
import DeleteAccountModal from "../../components/modals/DeleteAccountModal";

const MyPageScreen = ({ navigation }: any) => {
  // 프로필 데이터를 null로 초기화
  const [profileData, setProfileData] = useState<any>(null);
  const [loading, setLoading] = useState(true);

  // 모달 상태
  const [isBadgeModalOpen, setIsBadgeModalOpen] = useState(false);
  const [isBadgeListModalOpen, setIsBadgeListModalOpen] = useState(false);
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
  const [selectedBadge, setSelectedBadge] = useState<any>(null);

  // 컴포넌트 마운트 시 프로필 데이터 가져오기
  useEffect(() => {
    fetchProfile();
  }, []);

  // 프로필 조회 함수
  const fetchProfile = async () => {
    try {
      setLoading(true);
      const data = await authAPI.getProfile();
      setProfileData(data);
    } catch (error: any) {
      console.error("프로필 조회 실패:", error);
      Alert.alert("오류", "프로필 정보를 불러오는데 실패했습니다.");
      // 토큰이 만료되었거나 없는 경우 로그인 페이지로 이동
      if (error.status === 401) {
        navigation.replace("Login");
      }
    } finally {
      setLoading(false);
    }
  };

  const handleLogout = () => {
    Alert.alert("로그아웃", "정말로 로그아웃하시겠습니까?", [
      { text: "취소", style: "cancel" },
      {
        text: "확인",
        onPress: async () => {
          try {
            await authAPI.logout();
            navigation.replace("Login");
          } catch (error) {
            console.error("로그아웃 실패:", error);
            // 실패해도 로그인 화면으로 이동
            navigation.replace("Login");
          }
        },
      },
    ]);
  };

  const handleDeleteAccount = () => {
    setIsDeleteAccountModalOpen(true);
  };

  // membershipType을 한글로 변환
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

  // 로딩 중일 때
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

  // 데이터가 없을 때 (에러 발생)
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
                {/* 뱃지나 등급에 따라 아이콘 색상 변경 가능 */}
                <Icon name="ribbon" size={18} color={NEW_COLORS.accent} />
              </View>
              <Text style={styles.userTitle}>
                {getMembershipTypeText(profileData?.membershipType || "FREE")}
              </Text>
            </View>
          </View>
          <TouchableOpacity
            style={styles.editProfileButton}
            onPress={() => setIsProfileEditModalOpen(true)}
          >
            <Icon name="pencil" size={18} color={NEW_COLORS.text} />
          </TouchableOpacity>
        </View>

        {/* 뱃지 섹션 */}
        <View style={styles.section}>
          <View style={styles.sectionHeader}>
            <Text style={styles.sectionTitle}>
              🏆 뱃지 <Text style={styles.badgeCount}>23/80</Text>
            </Text>
            <TouchableOpacity onPress={() => setIsBadgeListModalOpen(true)}>
              <Text style={styles.viewMore}>
                전체 보기{" "}
                <Icon
                  name="chevron-forward"
                  size={16}
                  color={NEW_COLORS.text_secondary}
                />
              </Text>
            </TouchableOpacity>
          </View>
          <View style={styles.badgesDisplay}>
            {/* 예시 뱃지 */}
            <TouchableOpacity
              style={[styles.badge, styles.badgePurple]}
              onPress={() => {
                setSelectedBadge({ type: "purple" });
                setIsBadgeModalOpen(true);
              }}
            >
              <Icon name="medal" size={24} color={NEW_COLORS.badge_icon} />
            </TouchableOpacity>
            <TouchableOpacity
              style={[styles.badge, styles.badgeBlue]}
              onPress={() => {
                setSelectedBadge({ type: "blue" });
                setIsBadgeModalOpen(true);
              }}
            >
              <Icon name="barbell" size={24} color={NEW_COLORS.badge_icon} />
            </TouchableOpacity>
            <TouchableOpacity
              style={[styles.badge, styles.badgeRed]}
              onPress={() => {
                setSelectedBadge({ type: "red" });
                setIsBadgeModalOpen(true);
              }}
            >
              <Icon name="flame" size={24} color={NEW_COLORS.badge_icon} />
            </TouchableOpacity>
          </View>
        </View>

        <View style={styles.separator} />

        {/* 구독/결제 섹션 */}
        <View style={styles.section}>
          <Text style={styles.sectionTitle}>💳 구독/결제</Text>
          <View style={styles.sectionLinks}>
            <TouchableOpacity
              style={styles.linkItem}
              onPress={() => setIsMyPlanModalOpen(true)}
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

        {/* 추천 내역 섹션 */}
        <View style={styles.section}>
          <Text style={styles.sectionTitle}>🌟 추천 내역</Text>
          <View style={styles.sectionLinks}>
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

        {/* 계정 관리 섹션 */}
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

      <BadgeModal
        isOpen={isBadgeModalOpen}
        onClose={() => {
          setIsBadgeModalOpen(false);
          setSelectedBadge(null);
        }}
        badge={selectedBadge}
      />
      <BadgeListModal
        isOpen={isBadgeListModalOpen}
        onClose={() => setIsBadgeListModalOpen(false)}
        onBadgeClick={(badge) => {
          setIsBadgeListModalOpen(false);
          setSelectedBadge(badge);
          setIsBadgeModalOpen(true);
        }}
      />
      <AIAnalysisModal
        isOpen={isAIAnalysisModalOpen}
        onClose={() => setIsAIAnalysisModalOpen(false)}
      />
      <MyPlanModal
        isOpen={isMyPlanModalOpen}
        onClose={() => setIsMyPlanModalOpen(false)}
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
        onDeleteSuccess={() => {
          setIsDeleteAccountModalOpen(false);
          navigation.replace("Login");
        }}
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
  badge_purple: "#8b5cf6",
  badge_blue: "#3b82f6",
  badge_red: "#ef4444",
  badge_icon: "#ffffff",
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
    borderBottomWidth: 0,
    alignItems: "center",
    justifyContent: "center",
  },
  headerTitle: {
    fontSize: 20,
    fontWeight: "700",
    color: NEW_COLORS.text,
    textAlign: "center",
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
    elevation: 3,
    shadowColor: "#000",
    shadowOffset: { width: 0, height: 2 },
    shadowOpacity: 0.1,
    shadowRadius: 4,
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
  userTitle: {
    fontSize: 14,
    color: NEW_COLORS.accent,
    fontWeight: "500",
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
  sectionHeader: {
    flexDirection: "row",
    justifyContent: "space-between",
    alignItems: "center",
    marginBottom: 16,
  },
  sectionTitle: {
    fontSize: 18,
    fontWeight: "600",
    color: NEW_COLORS.text,
  },
  badgeCount: {
    color: NEW_COLORS.accent,
    fontWeight: "bold",
    fontSize: 16,
  },
  viewMore: {
    fontSize: 14,
    color: NEW_COLORS.text_secondary,
    flexDirection: "row",
    alignItems: "center",
    gap: 4,
  },
  badgesDisplay: {
    flexDirection: "row",
    gap: 16,
    paddingTop: 8,
  },
  badge: {
    width: 60,
    height: 60,
    borderRadius: 12,
    justifyContent: "center",
    alignItems: "center",
    elevation: 2,
  },
  badgePurple: {
    backgroundColor: NEW_COLORS.badge_purple,
  },
  badgeBlue: {
    backgroundColor: NEW_COLORS.badge_blue,
  },
  badgeRed: {
    backgroundColor: NEW_COLORS.badge_red,
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
});

export default MyPageScreen;
