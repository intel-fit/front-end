import React from 'react';
import {View, Text, Modal, TouchableOpacity, StyleSheet} from 'react-native';
import {Ionicons as Icon} from '@expo/vector-icons';
import {colors} from '../../theme/colors';

interface Badge {
  type: string;
  title?: string;
  description?: string;
  icon?: string;
  color?: string;
}

interface BadgeModalProps {
  isOpen: boolean;
  onClose: () => void;
  badge: Badge | null;
}

const BadgeModal: React.FC<BadgeModalProps> = ({isOpen, onClose, badge}) => {
  if (!isOpen || !badge) return null;

  const badgeInfo: any = {
    purple: {
      title: '푸쉬업 마스터',
      description: '푸쉬업 100개 성공! 상체 장인의 탄생💪',
      icon: '🏆',
      color: '#8b5cf6',
    },
    blue: {
      title: '웨이트 트레이닝',
      description: '웨이트 트레이닝 30일 연속 달성! 근력의 신💪',
      icon: '🏋️',
      color: '#3b82f6',
    },
    red: {
      title: '불꽃 도전자',
      description: '고강도 운동 50회 완료! 불꽃 같은 열정🔥',
      icon: '🔥',
      color: '#ff6b35',
    },
  };

  const info = badgeInfo[badge.type] || badgeInfo.purple;

  return (
    <Modal
      visible={isOpen}
      animationType="fade"
      transparent={true}
      onRequestClose={onClose}>
      <View style={styles.overlay}>
        <View style={styles.modalContent}>
          <View style={styles.header}>
            <Text style={styles.title}>뱃지</Text>
            <TouchableOpacity onPress={onClose} style={styles.closeBtn}>
              <Icon name="close" size={20} color="#ffffff" />
            </TouchableOpacity>
          </View>

          <View style={styles.body}>
            <View style={styles.badgeDisplay}>
              <View
                style={[styles.badgeLarge, {backgroundColor: info.color}]}>
                <Text style={styles.badgeIcon}>{info.icon}</Text>
              </View>
            </View>

            <View style={styles.badgeInfo}>
              <Text style={styles.badgeTitle}>{info.title}</Text>
              <Text style={styles.badgeDescription}>{info.description}</Text>
            </View>
          </View>

          <View style={styles.footer}>
            <TouchableOpacity style={styles.confirmBtn} onPress={onClose}>
              <Text style={styles.confirmBtnText}>확인</Text>
            </TouchableOpacity>
          </View>
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
    maxWidth: 320,
    maxHeight: '80%',
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
    alignItems: 'center',
  },
  badgeDisplay: {
    marginBottom: 20,
  },
  badgeLarge: {
    width: 100,
    height: 100,
    borderRadius: 20,
    justifyContent: 'center',
    alignItems: 'center',
  },
  badgeIcon: {
    fontSize: 40,
  },
  badgeInfo: {
    alignItems: 'center',
  },
  badgeTitle: {
    fontSize: 20,
    fontWeight: 'bold',
    color: '#ffffff',
    marginBottom: 12,
  },
  badgeDescription: {
    fontSize: 16,
    color: '#ffffff',
    textAlign: 'center',
    lineHeight: 24,
  },
  footer: {
    padding: 20,
    borderTopWidth: 1,
    borderTopColor: '#404040',
  },
  confirmBtn: {
    backgroundColor: '#404040',
    paddingVertical: 12,
    paddingHorizontal: 24,
    borderRadius: 8,
    alignItems: 'center',
    width: '100%',
  },
  confirmBtnText: {
    color: '#ffffff',
    fontSize: 16,
    fontWeight: 'bold',
  },
});

export default BadgeModal;

