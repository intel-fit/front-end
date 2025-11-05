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
import DeleteAccountModal from "../../components/modals/DeleteAccountModal"; // ✅ 추가

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
    useState(false); // ✅ 추가
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

  // ✅ 회원탈퇴 함수 수정 (모달 열기)
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
          <ActivityIndicator size="large" color="#e3ff7c" />
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

      <ScrollView style={styles.content}>
        {/* 프로필 섹션 - ✅ 중복 제거 및 정리 */}
        <View style={styles.profileSection}>
          <View style={styles.profileInfo}>
            <View style={styles.profileAvatar}>
              <Icon name="person-outline" size={24} color="#666666" />
            </View>
            <View style={styles.profileDetails}>
              <View style={styles.username}>
                <Text
                  style={{ fontSize: 18, fontWeight: "bold", color: "#ffffff" }}
                >
                  {profileData?.name || "사용자"}님{" "}
                </Text>
                <Icon name="star" size={16} color="#ffd700" />
              </View>
              <Text style={styles.userTitle}>
                {getMembershipTypeText(profileData?.membershipType || "FREE")}
              </Text>
            </View>
          </View>
          <TouchableOpacity onPress={() => setIsProfileEditModalOpen(true)}>
            <Icon name="pencil-outline" size={20} color="#ffffff" />
          </TouchableOpacity>
        </View>

        {/* 뱃지 섹션 */}
        <View style={styles.section}>
          <View style={styles.sectionHeader}>
            <Text style={styles.sectionTitle}>
              뱃지 <Text style={styles.badgeCount}>23/80</Text>
            </Text>
            <TouchableOpacity onPress={() => setIsBadgeListModalOpen(true)}>
              <Text style={styles.viewMore}>
                자세히 보기 <Icon name="chevron-forward" size={16} />
              </Text>
            </TouchableOpacity>
          </View>
          <View style={styles.badgesDisplay}>
            <TouchableOpacity
              style={[styles.badge, styles.badgePurple]}
              onPress={() => {
                setSelectedBadge({ type: "purple" });
                setIsBadgeModalOpen(true);
              }}
            >
              <Icon name="medal" size={20} color="#ffffff" />
            </TouchableOpacity>
            <TouchableOpacity
              style={[styles.badge, styles.badgeBlue]}
              onPress={() => {
                setSelectedBadge({ type: "blue" });
                setIsBadgeModalOpen(true);
              }}
            >
              <Icon name="barbell" size={20} color="#ffffff" />
            </TouchableOpacity>
            <TouchableOpacity
              style={[styles.badge, styles.badgeRed]}
              onPress={() => {
                setSelectedBadge({ type: "red" });
                setIsBadgeModalOpen(true);
              }}
            >
              <Icon name="flame" size={20} color="#ffffff" />
            </TouchableOpacity>
          </View>
        </View>

        {/* 구독/결제 섹션 */}
        <View style={styles.section}>
          <Text style={styles.sectionTitle}>구독/결제</Text>
          <View style={styles.sectionLinks}>
            <TouchableOpacity
              style={styles.linkItem}
              onPress={() => setIsMyPlanModalOpen(true)}
            >
              <Text style={styles.linkText}>내 플랜 보기</Text>
            </TouchableOpacity>
            <TouchableOpacity
              style={styles.linkItem}
              onPress={() => setIsPaymentMethodModalOpen(true)}
            >
              <Text style={styles.linkText}>결제 수단 관리</Text>
            </TouchableOpacity>
          </View>
        </View>

        {/* 추천 내역 섹션 */}
        <View style={styles.recommendSection}>
          <Text style={styles.sectionTitleOrange}>추천 내역</Text>
          <View style={styles.sectionLinks}>
            <TouchableOpacity
              style={styles.linkItem}
              onPress={() => navigation.navigate("RoutineRecommend")}
            >
              <Text style={styles.linkText}>운동 추천 내역</Text>
            </TouchableOpacity>
            <TouchableOpacity
              style={styles.linkItem}
              onPress={() => navigation.navigate("MealRecommendHistory")}
            >
              <Text style={styles.linkText}>식단 추천 내역</Text>
            </TouchableOpacity>
          </View>
        </View>

        {/* 계정 관리 섹션 */}
        <View style={styles.section}>
          <Text style={styles.sectionTitle}>계정 관리</Text>
          <View style={styles.sectionLinks}>
            <TouchableOpacity style={styles.linkItem} onPress={handleLogout}>
              <Text style={[styles.linkText, styles.logoutText]}>로그아웃</Text>
            </TouchableOpacity>
            <TouchableOpacity
              style={styles.linkItem}
              onPress={handleDeleteAccount}
            >
              <Text style={[styles.linkText, styles.deleteText]}>회원탈퇴</Text>
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

      {/* ✅ 회원탈퇴 모달 추가 */}
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

const styles = StyleSheet.create({
  container: {
    flex: 1,
    backgroundColor: "#1a1a1a",
  },
  centerContent: {
    justifyContent: "center",
    alignItems: "center",
  },
  loadingText: {
    marginTop: 16,
    fontSize: 16,
    color: "#ffffff",
  },
  errorText: {
    fontSize: 16,
    color: "#ef4444",
    marginBottom: 16,
  },
  retryBtn: {
    paddingHorizontal: 24,
    paddingVertical: 12,
    backgroundColor: "#434343",
    borderRadius: 8,
  },
  retryBtnText: {
    color: "#ffffff",
    fontSize: 16,
  },
  header: {
    paddingVertical: 16,
    paddingHorizontal: 20,
    borderBottomWidth: 1,
    borderBottomColor: "#333333",
    alignItems: "center",
    justifyContent: "center",
  },
  headerTitle: {
    fontSize: 18,
    fontWeight: "600",
    color: "#ffffff",
    textAlign: "center",
  },
  content: {
    flex: 1,
    paddingTop: 16,
    paddingHorizontal: 20,
    paddingBottom: 100,
  },
  profileSection: {
    marginTop: 4,
    marginBottom: 32,
    flexDirection: "row",
    justifyContent: "space-between",
    alignItems: "center",
    paddingVertical: 4,
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
    backgroundColor: "#f0f0f0",
    justifyContent: "center",
    alignItems: "center",
  },
  profileDetails: {
    flex: 1,
  },
  username: {
    fontSize: 18,
    fontWeight: "bold",
    color: "#ffffff",
    marginBottom: 6,
    flexDirection: "row",
    alignItems: "center",
    gap: 6,
  },
  userTitle: {
    fontSize: 14,
    color: "#999999",
    lineHeight: 20,
  },
  section: {
    paddingVertical: 24,
    marginBottom: 0,
  },
  sectionHeader: {
    flexDirection: "row",
    justifyContent: "space-between",
    alignItems: "center",
    marginBottom: 18,
  },
  sectionTitle: {
    fontSize: 16,
    fontWeight: "bold",
    color: "#ffffff",
    marginBottom: 18,
  },
  sectionTitleOrange: {
    fontSize: 16,
    fontWeight: "bold",
    color: "#ff6b35",
    marginBottom: 18,
  },
  badgeCount: {
    color: "#4ade80",
    fontWeight: "bold",
  },
  viewMore: {
    fontSize: 14,
    color: "#ffffff",
    flexDirection: "row",
    alignItems: "center",
    gap: 4,
  },
  badgesDisplay: {
    flexDirection: "row",
    gap: 12,
  },
  badge: {
    width: 50,
    height: 50,
    borderRadius: 8,
    justifyContent: "center",
    alignItems: "center",
  },
  badgePurple: {
    backgroundColor: "#8b5cf6",
  },
  badgeBlue: {
    backgroundColor: "#3b82f6",
  },
  badgeRed: {
    backgroundColor: "#ef4444",
  },
  recommendSection: {
    paddingVertical: 24,
    marginBottom: 0,
  },
  sectionLinks: {
    marginTop: 0,
  },
  linkItem: {
    paddingVertical: 14,
    marginBottom: 2,
  },
  linkText: {
    fontSize: 15,
    color: "#ffffff",
    lineHeight: 22,
  },
  logoutText: {
    color: "#4ade80",
  },
  deleteText: {
    color: "#ef4444",
  },
});

export default MyPageScreen;
