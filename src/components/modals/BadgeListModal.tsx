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
import {colors} from '../../theme/colors';

interface Badge {
  id: number;
  type: string;
  title: string;
  description: string;
  icon: string;
  color: string;
  earned: boolean;
}

interface BadgeListModalProps {
  isOpen: boolean;
  onClose: () => void;
  onBadgeClick: (badge: Badge) => void;
}

const BadgeListModal: React.FC<BadgeListModalProps> = ({
  isOpen,
  onClose,
  onBadgeClick,
}) => {
  const allBadges: Badge[] = [
    {
      id: 1,
      type: 'purple',
      title: '푸쉬업 마스터',
      description: '푸쉬업 100개 성공! 상체 장인의 탄생💪',
      icon: '🏆',
      color: '#8b5cf6',
      earned: true,
    },
    {
      id: 2,
      type: 'blue',
      title: '웨이트 트레이닝',
      description: '웨이트 트레이닝 30일 연속 달성! 근력의 신💪',
      icon: '🏋️',
      color: '#3b82f6',
      earned: true,
    },
    {
      id: 3,
      type: 'red',
      title: '불꽃 도전자',
      description: '고강도 운동 50회 완료! 불꽃 같은 열정🔥',
      icon: '🔥',
      color: '#ff6b35',
      earned: true,
    },
    {
      id: 4,
      type: 'green',
      title: '달리기 마라톤',
      description: '10km 달리기 완주! 지구력의 승리🏃‍♂️',
      icon: '🏃‍♂️',
      color: '#10b981',
      earned: false,
    },
    {
      id: 5,
      type: 'yellow',
      title: '요가 마스터',
      description: '요가 50회 완료! 몸과 마음의 조화🧘‍♀️',
      icon: '🧘‍♀️',
      color: '#f59e0b',
      earned: false,
    },
    {
      id: 6,
      type: 'pink',
      title: '수영 고수',
      description: '수영 20회 완료! 물의 파도타기🏊‍♀️',
      icon: '🏊‍♀️',
      color: '#ec4899',
      earned: false,
    },
  ];

  const earnedBadges = allBadges.filter(badge => badge.earned);
  const unearnedBadges = allBadges.filter(badge => !badge.earned);

  return (
    <Modal
      visible={isOpen}
      animationType="slide"
      transparent={true}
      onRequestClose={onClose}>
      <View style={styles.overlay}>
        <View style={styles.modalContent}>
          <View style={styles.header}>
            <Text style={styles.title}>뱃지 {earnedBadges.length}/80</Text>
            <TouchableOpacity onPress={onClose} style={styles.closeBtn}>
              <Icon name="close" size={20} color="#ffffff" />
            </TouchableOpacity>
          </View>

          <ScrollView style={styles.body}>
            <View style={styles.section}>
              <Text style={styles.sectionTitle}>획득한 뱃지</Text>
              <View style={styles.badgeGrid}>
                {earnedBadges.map(badge => (
                  <TouchableOpacity
                    key={badge.id}
                    style={styles.badgeItem}
                    onPress={() => onBadgeClick(badge)}>
                    <View
                      style={[styles.badgeSmall, {backgroundColor: badge.color}]}>
                      <Text style={styles.badgeIcon}>{badge.icon}</Text>
                    </View>
                    <Text style={styles.badgeItemTitle}>{badge.title}</Text>
                  </TouchableOpacity>
                ))}
              </View>
            </View>

            <View style={styles.section}>
              <Text style={styles.sectionTitle}>획득 가능한 뱃지</Text>
              <View style={styles.badgeGrid}>
                {unearnedBadges.map(badge => (
                  <View key={badge.id} style={[styles.badgeItem, styles.badgeItemUnearned]}>
                    <View style={[styles.badgeSmall, styles.locked]}>
                      <Text style={styles.badgeIcon}>{badge.icon}</Text>
                      <Text style={{position: 'absolute', top: -5, right: -5, fontSize: 12}}>🔒</Text>
                    </View>
                    <Text style={styles.badgeItemTitle}>
                      {badge.title}
                    </Text>
                  </View>
                ))}
              </View>
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
    maxHeight: '90%',
  },
  header: {
    flexDirection: 'row',
    justifyContent: 'space-between',
    alignItems: 'center',
    padding: 20,
    borderBottomWidth: 1,
    borderBottomColor: '#404040',
  },
  title: {
    fontSize: 18,
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
  section: {
    marginBottom: 30,
  },
  sectionTitle: {
    fontSize: 16,
    fontWeight: '600',
    color: '#ffffff',
    marginBottom: 16,
  },
  badgeGrid: {
    flexDirection: 'row',
    flexWrap: 'wrap',
    gap: 16,
    justifyContent: 'space-between',
  },
  badgeItem: {
    width: '47%',
    alignItems: 'center',
    gap: 8,
    padding: 12,
    borderRadius: 12,
    backgroundColor: 'rgba(255, 255, 255, 0.05)',
  },
  badgeItemUnearned: {
    opacity: 0.5,
  },
  badgeSmall: {
    width: 50,
    height: 50,
    borderRadius: 12,
    justifyContent: 'center',
    alignItems: 'center',
  },
  locked: {
    backgroundColor: '#404040',
    opacity: 1,
  },
  badgeIcon: {
    fontSize: 20,
  },
  badgeItemTitle: {
    fontSize: 12,
    fontWeight: '500',
    color: '#ffffff',
    textAlign: 'center',
    lineHeight: 14.4,
  },
  lockedText: {
    color: '#ffffff',
    opacity: 0.5,
  },
});

export default BadgeListModal;

