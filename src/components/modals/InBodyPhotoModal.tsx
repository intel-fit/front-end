import React, {useState} from 'react';
import {
  View,
  Text,
  Modal,
  TouchableOpacity,
  StyleSheet,
  ActivityIndicator,
} from 'react-native';
import * as ImagePicker from 'expo-image-picker';
import {Ionicons as Icon} from '@expo/vector-icons';
import {colors} from '../../theme/colors';

interface InBodyPhotoModalProps {
  isOpen: boolean;
  onClose: () => void;
  onSave?: (data: any) => void;
}

const InBodyPhotoModal: React.FC<InBodyPhotoModalProps> = ({
  isOpen,
  onClose,
  onSave,
}) => {
  const [selectedFile, setSelectedFile] = useState<any>(null);
  const [isProcessing, setIsProcessing] = useState(false);

  const requestPermissions = async () => {
    const {status: cameraStatus} =
      await ImagePicker.requestCameraPermissionsAsync();
    const {status: mediaStatus} =
      await ImagePicker.requestMediaLibraryPermissionsAsync();
    return cameraStatus === 'granted' && mediaStatus === 'granted';
  };

  const handleCameraPress = async () => {
    const hasPermission = await requestPermissions();
    if (!hasPermission) {
      return;
    }

    const result = await ImagePicker.launchCameraAsync({
      mediaTypes: ImagePicker.MediaTypeOptions.Images,
      allowsEditing: true,
      quality: 1,
    });

    if (!result.canceled && result.assets[0]) {
      setSelectedFile(result.assets[0]);
      setIsProcessing(true);

      setTimeout(() => {
        if (onSave) {
          onSave({
            file: result.assets[0],
            fileName: result.assets[0].fileName || 'photo.jpg',
            fileSize: result.assets[0].fileSize || 0,
          });
        }
        setIsProcessing(false);
        onClose();
      }, 2000);
    }
  };

  const handleGalleryPress = async () => {
    const hasPermission = await requestPermissions();
    if (!hasPermission) {
      return;
    }

    const result = await ImagePicker.launchImageLibraryAsync({
      mediaTypes: ImagePicker.MediaTypeOptions.Images,
      allowsEditing: true,
      quality: 1,
    });

    if (!result.canceled && result.assets[0]) {
      setSelectedFile(result.assets[0]);
      setIsProcessing(true);

      setTimeout(() => {
        if (onSave) {
          onSave({
            file: result.assets[0],
            fileName: result.assets[0].fileName || 'photo.jpg',
            fileSize: result.assets[0].fileSize || 0,
          });
        }
        setIsProcessing(false);
        onClose();
      }, 2000);
    }
  };

  const handleClose = () => {
    setSelectedFile(null);
    setIsProcessing(false);
    onClose();
  };

  return (
    <Modal
      visible={isOpen}
      animationType="fade"
      transparent={true}
      onRequestClose={handleClose}>
      <TouchableOpacity
        style={styles.overlay}
        activeOpacity={1}
        onPress={handleClose}>
        <View
          style={styles.modalContent}
          onStartShouldSetResponder={() => true}>
          <View style={styles.header}>
            <View style={styles.iconWrapper}>
              <Icon name="sparkles" size={24} color="#1a1a1a" />
            </View>
            <Text style={styles.title}>인바디 사진 분석</Text>
            <Text style={styles.subtitle}>
              사진을 업로드하면 자동으로 분석해드려요
            </Text>
          </View>

          <View style={styles.content}>
            {!selectedFile ? (
              <View style={styles.uploadSection}>
                <View style={styles.uploadOptions}>
                  <TouchableOpacity
                    style={[styles.uploadOption, styles.cameraOption]}
                    onPress={handleCameraPress}>
                    <View style={styles.optionIcon}>
                      <Icon name="camera" size={20} color="#1a1a1a" />
                    </View>
                    <View style={styles.optionText}>
                      <Text style={styles.optionTitle}>카메라로 촬영</Text>
                      <Text style={styles.optionDesc}>새로운 사진을 촬영해요</Text>
                    </View>
                  </TouchableOpacity>

                  <TouchableOpacity
                    style={[styles.uploadOption, styles.galleryOption]}
                    onPress={handleGalleryPress}>
                    <View style={[styles.optionIcon, styles.galleryIcon]}>
                      <Icon name="images" size={20} color="#ffffff" />
                    </View>
                    <View style={styles.optionText}>
                      <Text style={styles.optionTitle}>갤러리에서 선택</Text>
                      <Text style={styles.optionDesc}>기존 사진을 선택해요</Text>
                    </View>
                  </TouchableOpacity>
                </View>

                <View style={styles.tips}>
                  <Text style={styles.tipsTitle}>📸 촬영 팁</Text>
                  <View style={styles.tipsList}>
                    <Text style={styles.tipItem}>
                      • 인바디 결과지가 명확하게 보이도록 촬영해주세요
                    </Text>
                    <Text style={styles.tipItem}>
                      • 조명이 충분한 곳에서 촬영해주세요
                    </Text>
                    <Text style={styles.tipItem}>
                      • 글자가 잘 보이도록 가까이서 촬영해주세요
                    </Text>
                  </View>
                </View>
              </View>
            ) : (
              <View style={styles.processingSection}>
                <View style={styles.spinner}>
                  <ActivityIndicator size="large" color="#d6ff4b" />
                </View>
                <Text style={styles.processingTitle}>사진 분석 중...</Text>
                <Text style={styles.processingDesc}>
                  잠시만 기다려주세요. 인바디 결과를 분석하고 있습니다.
                </Text>
              </View>
            )}
          </View>

          <View style={styles.footer}>
            <TouchableOpacity
              style={styles.closeBtn}
              onPress={handleClose}>
              <Icon name="close" size={18} color="#eeeeee" />
              <Text style={styles.closeBtnText}>취소</Text>
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
    backgroundColor: 'rgba(0, 0, 0, 0.8)',
    justifyContent: 'center',
    alignItems: 'center',
    padding: 20,
  },
  modalContent: {
    width: '100%',
    maxWidth: 400,
    backgroundColor: '#2a2a2a',
    borderRadius: 20,
    borderWidth: 1,
    borderColor: '#333333',
    overflow: 'hidden',
  },
  header: {
    alignItems: 'center',
    paddingTop: 24,
    paddingHorizontal: 24,
    paddingBottom: 16,
    backgroundColor: '#333333',
    borderBottomWidth: 1,
    borderBottomColor: '#444444',
  },
  iconWrapper: {
    width: 60,
    height: 60,
    borderRadius: 30,
    backgroundColor: '#d6ff4b',
    justifyContent: 'center',
    alignItems: 'center',
    marginBottom: 16,
  },
  title: {
    fontSize: 20,
    fontWeight: '700',
    color: '#ffffff',
    marginBottom: 8,
  },
  subtitle: {
    fontSize: 14,
    color: '#aaaaaa',
    textAlign: 'center',
    lineHeight: 19.6,
  },
  content: {
    padding: 24,
  },
  uploadSection: {
    gap: 0,
  },
  uploadOptions: {
    gap: 12,
    marginBottom: 24,
  },
  uploadOption: {
    flexDirection: 'row',
    alignItems: 'center',
    padding: 16,
    borderRadius: 12,
    backgroundColor: '#333333',
    borderWidth: 2,
    borderColor: 'transparent',
  },
  cameraOption: {
    backgroundColor: '#333333',
  },
  galleryOption: {
    backgroundColor: '#333333',
  },
  optionIcon: {
    width: 40,
    height: 40,
    borderRadius: 8,
    backgroundColor: '#d6ff4b',
    justifyContent: 'center',
    alignItems: 'center',
    marginRight: 12,
  },
  galleryIcon: {
    backgroundColor: '#4fc6f1',
  },
  optionText: {
    flex: 1,
  },
  optionTitle: {
    fontSize: 16,
    fontWeight: '600',
    color: '#ffffff',
    marginBottom: 4,
  },
  optionDesc: {
    fontSize: 13,
    color: '#aaaaaa',
    lineHeight: 16.9,
  },
  tips: {
    backgroundColor: '#2a2a2a',
    borderRadius: 12,
    padding: 16,
    borderLeftWidth: 4,
    borderLeftColor: '#d6ff4b',
  },
  tipsTitle: {
    fontSize: 14,
    fontWeight: '600',
    color: '#d6ff4b',
    marginBottom: 12,
  },
  tipsList: {
    gap: 6,
  },
  tipItem: {
    fontSize: 13,
    color: '#cccccc',
    lineHeight: 18.2,
  },
  processingSection: {
    alignItems: 'center',
    paddingVertical: 20,
    gap: 8,
  },
  spinner: {
    marginBottom: 20,
  },
  processingTitle: {
    fontSize: 18,
    fontWeight: '600',
    color: '#ffffff',
    marginBottom: 8,
  },
  processingDesc: {
    fontSize: 14,
    color: '#aaaaaa',
    textAlign: 'center',
    lineHeight: 19.6,
  },
  footer: {
    paddingTop: 16,
    paddingHorizontal: 24,
    paddingBottom: 24,
    borderTopWidth: 1,
    borderTopColor: '#333333',
    backgroundColor: '#1e1e1e',
  },
  closeBtn: {
    flexDirection: 'row',
    alignItems: 'center',
    justifyContent: 'center',
    paddingVertical: 14,
    paddingHorizontal: 20,
    borderRadius: 12,
    backgroundColor: '#333333',
    borderWidth: 1,
    borderColor: '#444444',
    gap: 8,
  },
  closeBtnText: {
    fontSize: 15,
    fontWeight: '600',
    color: '#eeeeee',
  },
});

export default InBodyPhotoModal;

