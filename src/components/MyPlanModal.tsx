import React from 'react';
import {
  View,
  Text,
  Modal,
  TouchableOpacity,
  StyleSheet,
  ScrollView,
} from 'react-native';
import {Ionicons as Icon} from '@expo/vector-icons';
import {colors} from '../theme/colors';

interface MyPlanModalProps {
  isOpen: boolean;
  onClose: () => void;
}

const MyPlanModal: React.FC<MyPlanModalProps> = ({isOpen, onClose}) => {
  const currentPlan = {
    name: '프리미엄 플랜',
    type: 'premium',
    price: '29,900원',
    billingCycle: '월간',
    startDate: '2025-10-01',
    nextBillingDate: '2025-11-01',
    features: [
      '무제한 운동 기록',
      'AI 기반 InBody 분석',
      '맞춤형 운동 추천',
      '상세 통계 및 리포트',
      '챌린지 참여',
      '광고 제거',
    ],
  };

  const plans = [
    {
      name: '베이직 플랜',
      type: 'basic',
      price: '무료',
      features: ['기본 운동 기록', '기본 통계', '커뮤니티 접근'],
    },
    {
      name: '프리미엄 플랜',
      type: 'premium',
      price: '29,900원/월',
      isCurrent: true,
      features: [
        '무제한 운동 기록',
        'AI 기반 InBody 분석',
        '맞춤형 운동 추천',
        '상세 통계 및 리포트',
        '챌린지 참여',
        '광고 제거',
      ],
    },
    {
      name: '프로 플랜',
      type: 'pro',
      price: '49,900원/월',
      features: [
        '프리미엄 플랜 전체 기능',
        '1:1 코칭 서비스',
        '식단 관리',
        '우선 고객 지원',
        '독점 콘텐츠 접근',
      ],
    },
  ];

  const formatDate = (dateString: string) => {
    const date = new Date(dateString);
    return date.toLocaleDateString('ko-KR', {
      year: 'numeric',
      month: '2-digit',
      day: '2-digit',
    });
  };

  return (
    <Modal
      visible={isOpen}
      animationType="slide"
      transparent={true}
      onRequestClose={onClose}>
      <View style={styles.overlay}>
        <View style={styles.modalContent}>
          <View style={styles.header}>
            <Text style={styles.title}>내 플랜</Text>
            <TouchableOpacity onPress={onClose} style={styles.closeBtn}>
              <Icon name="close" size={20} color="#ffffff" />
            </TouchableOpacity>
          </View>

          <ScrollView style={styles.body}>
            <View style={styles.currentPlanSection}>
              <View style={styles.currentPlanBadge}>
                <Icon name="trophy" size={14} color="#000000" />
                <Text style={styles.badgeText}>현재 플랜</Text>
              </View>
              <View style={styles.currentPlanCard}>
                <Text style={styles.planName}>{currentPlan.name}</Text>
                <Text style={styles.planPrice}>
                  {currentPlan.price}
                  <Text style={styles.priceUnit}>/월</Text>
                </Text>
                <View style={styles.planDates}>
                  <View style={styles.dateItem}>
                    <Text style={styles.dateLabel}>시작일</Text>
                    <Text style={styles.dateValue}>
                      {formatDate(currentPlan.startDate)}
                    </Text>
                  </View>
                  <View style={styles.dateItem}>
                    <Text style={styles.dateLabel}>다음 결제일</Text>
                    <Text style={styles.dateValue}>
                      {formatDate(currentPlan.nextBillingDate)}
                    </Text>
                  </View>
                </View>
                <View style={styles.features}>
                  <Text style={styles.featuresTitle}>포함된 기능</Text>
                  {currentPlan.features.map((feature, index) => (
                    <View key={index} style={styles.featureItem}>
                      <Icon
                        name="checkmark-circle"
                        size={16}
                        color="#4ade80"
                      />
                      <Text style={styles.featureText}>{feature}</Text>
                    </View>
                  ))}
                </View>
              </View>
            </View>

            {/* 다른 플랜 옵션 */}
            <View style={styles.otherPlansSection}>
              <Text style={styles.sectionTitle}>다른 플랜 보기</Text>
              <View style={styles.plansList}>
                {plans.map((plan, index) => (
                  <View
                    key={index}
                    style={[
                      styles.planCard,
                      plan.isCurrent && styles.planCardCurrent,
                      plan.type === 'premium' && styles.planCardPremium,
                      plan.type === 'pro' && styles.planCardPro,
                    ]}>
                    {plan.isCurrent && (
                      <View style={styles.currentBadge}>
                        <Text style={styles.currentBadgeText}>현재 플랜</Text>
                      </View>
                    )}
                    <Text style={styles.planCardName}>{plan.name}</Text>
                    <Text
                      style={[
                        styles.planCardPrice,
                        plan.type === 'premium' && styles.planCardPricePremium,
                        plan.type === 'pro' && styles.planCardPricePro,
                      ]}>
                      {plan.price}
                    </Text>
                    <View style={styles.planCardFeatures}>
                      {plan.features.map((feature, idx) => (
                        <View key={idx} style={styles.planCardFeatureItem}>
                          <Icon
                            name="checkmark-circle"
                            size={14}
                            color="#666666"
                          />
                          <Text style={styles.planCardFeatureText}>
                            {feature}
                          </Text>
                        </View>
                      ))}
                    </View>
                    {!plan.isCurrent && (
                      <TouchableOpacity style={styles.selectPlanBtn}>
                        <Text style={styles.selectPlanBtnText}>
                          {plan.type === 'basic' ? '다운그레이드' : '업그레이드'}
                        </Text>
                      </TouchableOpacity>
                    )}
                  </View>
                ))}
              </View>
            </View>

            {/* 플랜 관리 */}
            <View style={styles.planActions}>
              <TouchableOpacity style={styles.cancelBtn}>
                <Text style={styles.cancelBtnText}>플랜 해지하기</Text>
              </TouchableOpacity>
            </View>
          </ScrollView>
        </View>
      </View>
    </Modal>
  );
};

const styles = StyleSheet.create({
  overlay: {
    flex: 1,
    backgroundColor: 'rgba(0, 0, 0, 0.5)',
    justifyContent: 'center',
    alignItems: 'center',
    padding: 20,
  },
  modalContent: {
    backgroundColor: '#2a2a2a',
    borderRadius: 16,
    width: '100%',
    maxWidth: 400,
    maxHeight: '85%',
  },
  header: {
    flexDirection: 'row',
    justifyContent: 'space-between',
    alignItems: 'center',
    padding: 16,
    paddingHorizontal: 20,
    borderBottomWidth: 1,
    borderBottomColor: '#404040',
    flexShrink: 0,
  },
  title: {
    fontSize: 17,
    fontWeight: '600',
    color: '#ffffff',
  },
  closeBtn: {
    width: 32,
    height: 32,
    justifyContent: 'center',
    alignItems: 'center',
    padding: 4,
  },
  body: {
    padding: 20,
  },
  currentPlanSection: {
    marginBottom: 24,
  },
  currentPlanBadge: {
    flexDirection: 'row',
    alignItems: 'center',
    gap: 6,
    backgroundColor: '#4ade80',
    paddingVertical: 6,
    paddingHorizontal: 12,
    borderRadius: 20,
    alignSelf: 'flex-start',
    marginBottom: 12,
  },
  badgeText: {
    fontSize: 12,
    color: '#000000',
    fontWeight: '600',
  },
  currentPlanCard: {
    backgroundColor: 'rgba(74, 222, 128, 0.1)',
    borderWidth: 1,
    borderColor: '#4ade80',
    padding: 20,
    borderRadius: 12,
  },
  planName: {
    fontSize: 20,
    fontWeight: '700',
    color: '#4ade80',
    marginBottom: 8,
  },
  planPrice: {
    fontSize: 28,
    fontWeight: '700',
    color: '#ffffff',
    marginBottom: 16,
  },
  priceUnit: {
    fontSize: 16,
    fontWeight: '400',
    color: '#cccccc',
  },
  planDates: {
    flexDirection: 'row',
    gap: 16,
    marginBottom: 16,
    paddingBottom: 16,
    borderBottomWidth: 1,
    borderBottomColor: 'rgba(255, 255, 255, 0.1)',
  },
  dateItem: {
    flex: 1,
    gap: 4,
  },
  dateLabel: {
    fontSize: 11,
    color: '#cccccc',
  },
  dateValue: {
    fontSize: 13,
    color: '#ffffff',
    fontWeight: '600',
  },
  features: {
    gap: 8,
  },
  featuresTitle: {
    fontSize: 14,
    fontWeight: '600',
    color: '#ffffff',
    marginBottom: 12,
  },
  featureItem: {
    flexDirection: 'row',
    alignItems: 'center',
    gap: 8,
  },
  featureText: {
    fontSize: 13,
    color: '#ffffff',
  },
  otherPlansSection: {
    marginBottom: 20,
  },
  sectionTitle: {
    color: '#ffffff',
    fontSize: 15,
    fontWeight: '600',
    marginBottom: 12,
  },
  plansList: {
    gap: 12,
  },
  planCard: {
    backgroundColor: 'rgba(255, 255, 255, 0.05)',
    borderWidth: 1,
    borderColor: '#404040',
    borderRadius: 10,
    padding: 16,
    position: 'relative',
  },
  planCardCurrent: {
    borderColor: '#4ade80',
    backgroundColor: 'rgba(74, 222, 128, 0.1)',
  },
  planCardPremium: {
    borderColor: '#8b5cf6',
  },
  planCardPro: {
    borderColor: '#f59e0b',
  },
  currentBadge: {
    position: 'absolute',
    top: -8,
    right: 16,
    backgroundColor: '#4ade80',
    paddingVertical: 4,
    paddingHorizontal: 10,
    borderRadius: 12,
  },
  currentBadgeText: {
    color: '#000000',
    fontSize: 10,
    fontWeight: '600',
  },
  planCardName: {
    color: '#ffffff',
    fontSize: 16,
    fontWeight: '600',
    marginBottom: 8,
  },
  planCardPrice: {
    color: '#4ade80',
    fontSize: 20,
    fontWeight: '700',
    marginBottom: 12,
  },
  planCardPricePremium: {
    color: '#8b5cf6',
  },
  planCardPricePro: {
    color: '#f59e0b',
  },
  planCardFeatures: {
    marginBottom: 12,
    gap: 6,
  },
  planCardFeatureItem: {
    flexDirection: 'row',
    alignItems: 'center',
    gap: 6,
  },
  planCardFeatureText: {
    color: '#cccccc',
    fontSize: 12,
  },
  selectPlanBtn: {
    padding: 10,
    backgroundColor: 'rgba(255, 255, 255, 0.1)',
    borderWidth: 1,
    borderColor: '#555555',
    borderRadius: 8,
    alignItems: 'center',
  },
  selectPlanBtnText: {
    color: '#ffffff',
    fontSize: 13,
    fontWeight: '600',
  },
  planActions: {
    paddingTop: 16,
    borderTopWidth: 1,
    borderTopColor: '#404040',
  },
  cancelBtn: {
    padding: 12,
    borderRadius: 8,
    borderWidth: 1,
    borderColor: '#ff6b6b',
    backgroundColor: 'rgba(255, 107, 107, 0.1)',
    alignItems: 'center',
  },
  cancelBtnText: {
    color: '#ff6b6b',
    fontSize: 14,
    fontWeight: '600',
  },
});

export default MyPlanModal;

