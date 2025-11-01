import React from 'react';
import {
  View,
  Text,
  Modal,
  TouchableOpacity,
  StyleSheet,
} from 'react-native';
import { Ionicons as Icon } from '@expo/vector-icons';

interface FoodAddOptionsModalProps {
  isOpen: boolean;
  onClose: () => void;
  onPhotoOption: () => void;
  onSearchOption: () => void;
}

const FoodAddOptionsModal: React.FC<FoodAddOptionsModalProps> = ({
  isOpen,
  onClose,
  onPhotoOption,
  onSearchOption,
}) => {
  if (!isOpen) return null;

  const handlePhotoOption = () => {
    onClose();
    onPhotoOption();
  };

  const handleSearchOption = () => {
    onClose();
    onSearchOption();
  };

  return (
    <Modal
      visible={isOpen}
      animationType="slide"
      transparent={true}
      onRequestClose={onClose}>
      <TouchableOpacity
        style={styles.overlay}
        activeOpacity={1}
        onPress={onClose}>
        <View style={styles.modalContainer} onStartShouldSetResponder={() => true}>
          <View style={styles.optionsContainer}>
            {/* 사진으로 식단 입력하기 */}
            <TouchableOpacity
              style={styles.optionCard}
              onPress={handlePhotoOption}>
              <View style={styles.optionIcon}>
                <Icon name="camera" size={34} color="#ffffff" />
              </View>
              <Text style={styles.optionText}>
                사진으로{'\n'}식단 입력하기
              </Text>
            </TouchableOpacity>

            {/* 식단 검색하기 */}
            <TouchableOpacity
              style={styles.optionCard}
              onPress={handleSearchOption}>
              <View style={styles.optionIcon}>
                <Icon name="search" size={34} color="#ffffff" />
              </View>
              <Text style={styles.optionText}>식단 검색하기</Text>
            </TouchableOpacity>
          </View>
        </View>
      </TouchableOpacity>
    </Modal>
  );
};

const styles = StyleSheet.create({
  overlay: {
    flex: 1,
    backgroundColor: 'rgba(0, 0, 0, 0.6)',
    justifyContent: 'flex-end',
  },
  modalContainer: {
    backgroundColor: '#252525',
    borderTopLeftRadius: 20,
    borderTopRightRadius: 20,
    paddingVertical: 30,
    paddingHorizontal: 20,
    maxHeight: '50%',
  },
  optionsContainer: {
    flexDirection: 'row',
    gap: 20,
    width: '100%',
  },
  optionCard: {
    flex: 1,
    backgroundColor: '#393a38',
    borderRadius: 20,
    paddingVertical: 30,
    paddingHorizontal: 20,
    alignItems: 'center',
    justifyContent: 'center',
    minHeight: 160,
    gap: 20,
  },
  optionIcon: {
    alignItems: 'center',
    justifyContent: 'center',
  },
  optionText: {
    fontSize: 12,
    fontWeight: '700',
    color: '#ffffff',
    textAlign: 'center',
    lineHeight: 14.4,
  },
});

export default FoodAddOptionsModal;
