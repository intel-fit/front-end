import React, {useState} from 'react';
import {
  View,
  Text,
  TouchableOpacity,
  StyleSheet,
  ScrollView,
  Alert,
} from 'react-native';
import {SafeAreaView} from 'react-native-safe-area-context';
import { Ionicons as Icon } from '@expo/vector-icons';
import {colors} from '../theme/colors';
import BadgeModal from '../components/BadgeModal';
import BadgeListModal from '../components/BadgeListModal';
import AIAnalysisModal from '../components/AIAnalysisModal';
import MyPlanModal from '../components/MyPlanModal';
import PaymentMethodModal from '../components/PaymentMethodModal';
import ProfileEditModal from '../components/ProfileEditModal';
import RoutineRecommendModal from '../components/RoutineRecommendModal';
import MealRecommendModal from '../components/MealRecommendModal';

const MyPageScreen = ({navigation}: any) => {
  const [profileData] = useState({
    name: '홍길동',
    membershipType: 'FREE',
  });

  // 모달 상태
  const [isBadgeModalOpen, setIsBadgeModalOpen] = useState(false);
  const [isBadgeListModalOpen, setIsBadgeListModalOpen] = useState(false);
  const [isAIAnalysisModalOpen, setIsAIAnalysisModalOpen] = useState(false);
  const [isMyPlanModalOpen, setIsMyPlanModalOpen] = useState(false);
  const [isPaymentMethodModalOpen, setIsPaymentMethodModalOpen] = useState(false);
  const [isProfileEditModalOpen, setIsProfileEditModalOpen] = useState(false);
  const [isRoutineRecommendModalOpen, setIsRoutineRecommendModalOpen] = useState(false);
  const [isMealRecommendModalOpen, setIsMealRecommendModalOpen] = useState(false);
  const [selectedBadge, setSelectedBadge] = useState<any>(null);

  const handleLogout = () => {
    Alert.alert('로그아웃', '정말로 로그아웃하시겠습니까?', [
      {text: '취소', style: 'cancel'},
      {
        text: '확인',
        onPress: () => {
          console.log('로그아웃');
          navigation.replace('Login');
        },
      },
    ]);
  };

  const handleDeleteAccount = () => {
    Alert.alert(
      '회원탈퇴',
      '정말로 회원탈퇴하시겠습니까?\n탈퇴 시 모든 데이터가 삭제되며 복구할 수 없습니다.',
      [
        {text: '취소', style: 'cancel'},
        {
          text: '확인',
          style: 'destructive',
          onPress: () => console.log('회원탈퇴'),
        },
      ],
    );
  };

  return (
    <SafeAreaView style={styles.container} edges={['top']}>
      <View style={styles.header}>
        <Text style={styles.headerTitle}>마이페이지</Text>
      </View>

      <ScrollView style={styles.content}>
        {/* 프로필 섹션 */}
        <View style={styles.profileSection}>
          <View style={styles.profileInfo}>
            <View style={styles.profileAvatar}>
              <Icon name="person-outline" size={24} color="#666666" />
            </View>
            <View style={styles.profileDetails}>
              <View style={styles.username}>
                <Text style={{fontSize: 18, fontWeight: 'bold', color: '#ffffff'}}>
                  {profileData.name || '김민수'}님{' '}
                </Text>
                <Icon name="star" size={16} color="#ffd700" />
              </View>
              <Text style={styles.userTitle}>
                {profileData.membershipType === 'FREE'
                  ? '무료 회원'
                  : profileData.membershipType === 'PREMIUM'
                  ? '프리미엄 회원'
                  : '풀업의 신'}
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
                setSelectedBadge({type: 'purple'});
                setIsBadgeModalOpen(true);
              }}>
              <Icon name="medal" size={20} color="#ffffff" />
            </TouchableOpacity>
            <TouchableOpacity
              style={[styles.badge, styles.badgeBlue]}
              onPress={() => {
                setSelectedBadge({type: 'blue'});
                setIsBadgeModalOpen(true);
              }}>
              <Icon name="barbell" size={20} color="#ffffff" />
            </TouchableOpacity>
            <TouchableOpacity
              style={[styles.badge, styles.badgeRed]}
              onPress={() => {
                setSelectedBadge({type: 'red'});
                setIsBadgeModalOpen(true);
              }}>
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
              onPress={() => setIsMyPlanModalOpen(true)}>
              <Text style={styles.linkText}>내 플랜 보기</Text>
            </TouchableOpacity>
            <TouchableOpacity
              style={styles.linkItem}
              onPress={() => setIsPaymentMethodModalOpen(true)}>
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
              onPress={() => navigation.navigate('RoutineRecommend')}>
              <Text style={styles.linkText}>운동 추천 내역</Text>
            </TouchableOpacity>
            <TouchableOpacity
              style={styles.linkItem}
              onPress={() => navigation.navigate('MealRecommendHistory')}>
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
              onPress={handleDeleteAccount}>
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
        onBadgeClick={badge => {
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
      />

      <RoutineRecommendModal
        isOpen={isRoutineRecommendModalOpen}
        onClose={() => setIsRoutineRecommendModalOpen(false)}
      />

      <MealRecommendModal
        isOpen={isMealRecommendModalOpen}
        onClose={() => setIsMealRecommendModalOpen(false)}
      />
    </SafeAreaView>
  );
};

const styles = StyleSheet.create({
  container: {
    flex: 1,
    backgroundColor: '#1a1a1a',
  },
  header: {
    paddingVertical: 16,
    paddingHorizontal: 20,
    borderBottomWidth: 1,
    borderBottomColor: '#333333',
  },
  headerTitle: {
    fontSize: 18,
    fontWeight: '600',
    color: '#ffffff',
  },
  content: {
    flex: 1,
    paddingTop: 8,
    paddingHorizontal: 20,
    paddingBottom: 100,
  },
  profileSection: {
    marginTop: 8,
    marginBottom: 24,
    flexDirection: 'row',
    justifyContent: 'space-between',
    alignItems: 'center',
  },
  profileInfo: {
    flexDirection: 'row',
    alignItems: 'center',
    gap: 16,
    flex: 1,
    marginLeft: -16,
  },
  profileAvatar: {
    width: 60,
    height: 60,
    borderRadius: 30,
    backgroundColor: '#f0f0f0',
    justifyContent: 'center',
    alignItems: 'center',
  },
  profileDetails: {
    flex: 1,
  },
  username: {
    fontSize: 18,
    fontWeight: 'bold',
    color: '#ffffff',
    marginBottom: 4,
    flexDirection: 'row',
    alignItems: 'center',
    gap: 8,
  },
  userTitle: {
    fontSize: 14,
    color: '#999999',
  },
  section: {
    paddingVertical: 20,
    marginBottom: 0,
  },
  sectionHeader: {
    flexDirection: 'row',
    justifyContent: 'space-between',
    alignItems: 'center',
    marginBottom: 16,
  },
  sectionTitle: {
    fontSize: 16,
    fontWeight: 'bold',
    color: '#ffffff',
  },
  sectionTitleOrange: {
    fontSize: 16,
    fontWeight: 'bold',
    color: '#ff6b35',
    marginBottom: 16,
  },
  badgeCount: {
    color: '#4ade80',
    fontWeight: 'bold',
  },
  viewMore: {
    fontSize: 14,
    color: '#ffffff',
    flexDirection: 'row',
    alignItems: 'center',
    gap: 4,
  },
  badgesDisplay: {
    flexDirection: 'row',
    gap: 12,
  },
  badge: {
    width: 50,
    height: 50,
    borderRadius: 8,
    justifyContent: 'center',
    alignItems: 'center',
  },
  badgePurple: {
    backgroundColor: '#8b5cf6',
  },
  badgeBlue: {
    backgroundColor: '#3b82f6',
  },
  badgeRed: {
    backgroundColor: '#ef4444',
  },
  recommendSection: {
    paddingVertical: 20,
    marginBottom: 0,
  },
  sectionLinks: {
    marginBottom: 16,
  },
  linkItem: {
    paddingVertical: 8,
    marginBottom: 8,
  },
  linkText: {
    fontSize: 14,
    color: '#ffffff',
  },
  logoutText: {
    color: '#4ade80',
  },
  deleteText: {
    color: '#ef4444',
  },
});

export default MyPageScreen;

