import React, {useState} from 'react';
import {
  View,
  Text,
  Modal,
  TouchableOpacity,
  StyleSheet,
  ScrollView,
  TextInput,
  Alert,
  Dimensions,
  KeyboardAvoidingView,
  Platform,
  StatusBar,
} from 'react-native';
import {Picker} from '@react-native-picker/picker';
import {Ionicons as Icon} from '@expo/vector-icons';
import {SafeAreaView, useSafeAreaInsets} from 'react-native-safe-area-context';
import {colors} from '../../theme/colors';

interface ProfileEditModalProps {
  isOpen: boolean;
  onClose: () => void;
}

const ProfileEditModal: React.FC<ProfileEditModalProps> = ({
  isOpen,
  onClose,
}) => {
  const insets = useSafeAreaInsets();
  const [profileData, setProfileData] = useState({
    name: '김민수',
    email: 'dd@gmail.com',
    userId: 'dfdfd',
    birthDate: '2023.24.03',
    gender: '여자',
    height: '170',
    weight: '60',
    nicknamePublic: true,
  });

  const [editingField, setEditingField] = useState<string | null>(null);
  const [tempValue, setTempValue] = useState('');

  const handleFieldClick = (field: string) => {
    if (field === 'password') {
      Alert.alert('비밀번호 변경', '비밀번호 변경 기능은 준비 중입니다.');
      return;
    }
    setEditingField(field);
    if (field === 'nicknamePublic') {
      setTempValue(profileData[field] ? 'true' : 'false');
    } else {
      setTempValue((profileData as any)[field] || '');
    }
  };

  const handleSave = () => {
    if (editingField) {
      if (editingField === 'nicknamePublic') {
        setProfileData(prev => ({
          ...prev,
          [editingField]: tempValue === 'true',
        }));
      } else {
        setProfileData(prev => ({
          ...prev,
          [editingField]: tempValue,
        }));
      }
    }
    setEditingField(null);
    setTempValue('');
  };

  return (
    <Modal
      visible={isOpen}
      animationType="slide"
      transparent={false}
      onRequestClose={onClose}
      statusBarTranslucent={false}>
      <StatusBar barStyle="light-content" backgroundColor="#1a1a1a" />
      <View style={styles.overlay}>
        <KeyboardAvoidingView
          style={styles.modalContent}
          behavior={Platform.OS === 'ios' ? 'padding' : 'height'}
          keyboardVerticalOffset={Platform.OS === 'ios' ? 0 : 0}>
          <View style={[
            styles.nav,
            {
              paddingTop: insets.top + 16
            }
          ]}>
            <TouchableOpacity onPress={onClose} style={styles.navBtn}>
              <Text style={styles.navBtnText}>←</Text>
            </TouchableOpacity>
            <Text style={styles.navTitle}>정보 수정</Text>
            <TouchableOpacity
              onPress={() => {
                handleSave();
                onClose();
              }}
              style={styles.navBtn}>
              <Text style={styles.navBtnText}>✓</Text>
            </TouchableOpacity>
          </View>

          <ScrollView
            style={styles.body}
            contentContainerStyle={styles.bodyContent}
            keyboardShouldPersistTaps="handled"
            showsVerticalScrollIndicator={false}>
            <View style={styles.profileSection}>
              <View style={styles.avatar} />
              <View style={styles.profileInfo}>
                <Text style={styles.profileName}>김민수님</Text>
                <TouchableOpacity style={styles.editAvatarBtn}>
                  <Icon name="pencil" size={12} color="#8b5cf6" />
                </TouchableOpacity>
              </View>
            </View>

            <View style={styles.infoList}>
              <View style={styles.infoItem}>
                <Text style={styles.infoLabel}>이메일</Text>
                <Text style={styles.infoValue}>{profileData.email}</Text>
              </View>

              <View style={styles.infoItem}>
                <Text style={styles.infoLabel}>아이디</Text>
                <Text style={styles.infoValue}>{profileData.userId}</Text>
              </View>

              <TouchableOpacity
                style={styles.infoItem}
                onPress={() => handleFieldClick('password')}>
                <Text style={styles.infoLabel}>비밀번호</Text>
                <View style={styles.infoValueWithArrow}>
                  <Text style={styles.infoValue}>재설정하기</Text>
                  <Icon name="chevron-forward" size={16} color="#8b5cf6" />
                </View>
              </TouchableOpacity>

              {editingField === 'birthDate' ? (
                <View style={[styles.infoItem, styles.editingItem]}>
                  <Text style={styles.infoLabel}>생년월일</Text>
                  <View style={styles.editControls}>
                    <TextInput
                      style={styles.editInput}
                      value={tempValue}
                      onChangeText={setTempValue}
                      placeholder="YYYY.MM.DD"
                      placeholderTextColor="#999999"
                    />
                    <TouchableOpacity onPress={handleSave} style={styles.saveEditBtn}>
                      <Text style={styles.saveEditBtnText}>✓</Text>
                    </TouchableOpacity>
                  </View>
                </View>
              ) : (
                <TouchableOpacity
                  style={styles.infoItem}
                  onPress={() => handleFieldClick('birthDate')}>
                  <Text style={styles.infoLabel}>생년월일</Text>
                  <View style={styles.infoValueWithArrow}>
                    <Text style={styles.infoValue}>{profileData.birthDate}</Text>
                    <Icon name="chevron-forward" size={16} color="#8b5cf6" />
                  </View>
                </TouchableOpacity>
              )}

              {editingField === 'gender' ? (
                <View style={[styles.infoItem, styles.editingItem]}>
                  <Text style={styles.infoLabel}>성별</Text>
                  <View style={styles.editControls}>
                    <View style={styles.pickerContainer}>
                      <Picker
                        selectedValue={tempValue}
                        onValueChange={setTempValue}
                        style={styles.picker}
                        dropdownIconColor="#ffffff">
                        <Picker.Item label="남자" value="남자" color="#ffffff" />
                        <Picker.Item label="여자" value="여자" color="#ffffff" />
                      </Picker>
                    </View>
                    <TouchableOpacity onPress={handleSave} style={styles.saveEditBtn}>
                      <Text style={styles.saveEditBtnText}>✓</Text>
                    </TouchableOpacity>
                  </View>
                </View>
              ) : (
                <TouchableOpacity
                  style={styles.infoItem}
                  onPress={() => handleFieldClick('gender')}>
                  <Text style={styles.infoLabel}>성별</Text>
                  <View style={styles.infoValueWithArrow}>
                    <Text style={styles.infoValue}>{profileData.gender}</Text>
                    <Icon name="chevron-forward" size={16} color="#8b5cf6" />
                  </View>
                </TouchableOpacity>
              )}

              {editingField === 'bodyInfo' ? (
                <View style={[styles.infoItem, styles.editingItem]}>
                  <Text style={styles.infoLabel}>신체정보</Text>
                  <View style={[styles.editControls, styles.bodyInfoControls]}>
                    <TextInput
                      style={[styles.editInput, styles.bodyInput]}
                      value={profileData.height}
                      onChangeText={text =>
                        setProfileData(prev => ({...prev, height: text}))
                      }
                      placeholder="키"
                      keyboardType="numeric"
                    />
                    <Text style={styles.unit}>cm</Text>
                    <TextInput
                      style={[styles.editInput, styles.bodyInput]}
                      value={profileData.weight}
                      onChangeText={text =>
                        setProfileData(prev => ({...prev, weight: text}))
                      }
                      placeholder="몸무게"
                      keyboardType="numeric"
                    />
                    <Text style={styles.unit}>kg</Text>
                    <TouchableOpacity onPress={handleSave} style={styles.saveEditBtn}>
                      <Text style={styles.saveEditBtnText}>✓</Text>
                    </TouchableOpacity>
                  </View>
                </View>
              ) : (
                <TouchableOpacity
                  style={styles.infoItem}
                  onPress={() => handleFieldClick('bodyInfo')}>
                  <Text style={styles.infoLabel}>신체정보</Text>
                  <View style={styles.infoValueWithArrow}>
                    <Text style={styles.infoValue}>
                      {profileData.height}cm • {profileData.weight}kg
                    </Text>
                    <Icon name="chevron-forward" size={16} color="#8b5cf6" />
                  </View>
                </TouchableOpacity>
              )}

              {editingField === 'nicknamePublic' ? (
                <View style={[styles.infoItem, styles.editingItem]}>
                  <Text style={styles.infoLabel}>별명 표시 공개</Text>
                  <View style={styles.editControls}>
                    <View style={styles.pickerContainer}>
                      <Picker
                        selectedValue={tempValue}
                        onValueChange={setTempValue}
                        style={styles.picker}
                        dropdownIconColor="#ffffff">
                        <Picker.Item label="네" value="true" color="#ffffff" />
                        <Picker.Item label="아니오" value="false" color="#ffffff" />
                      </Picker>
                    </View>
                    <TouchableOpacity onPress={handleSave} style={styles.saveEditBtn}>
                      <Text style={styles.saveEditBtnText}>✓</Text>
                    </TouchableOpacity>
                  </View>
                </View>
              ) : (
                <TouchableOpacity
                  style={[styles.infoItem, styles.infoItemLast]}
                  onPress={() => handleFieldClick('nicknamePublic')}>
                  <Text style={styles.infoLabel}>별명 표시 공개</Text>
                  <View style={styles.infoValueWithArrow}>
                    <Text style={styles.infoValue}>
                      {profileData.nicknamePublic ? '네' : '아니오'}
                    </Text>
                    <Icon name="chevron-forward" size={16} color="#8b5cf6" />
                  </View>
                </TouchableOpacity>
              )}
            </View>
          </ScrollView>
        </KeyboardAvoidingView>
      </View>
    </Modal>
  );
};

const styles = StyleSheet.create({
  overlay: {
    flex: 1,
    backgroundColor: '#1a1a1a',
  },
  modalContent: {
    flex: 1,
    backgroundColor: '#1a1a1a',
  },
  nav: {
    flexDirection: 'row',
    justifyContent: 'space-between',
    alignItems: 'center',
    paddingBottom: 16,
    paddingHorizontal: 20,
    minHeight: 56,
    borderBottomWidth: 1,
    borderBottomColor: '#333333',
    backgroundColor: '#1a1a1a',
    position: 'relative',
  },
  navBtn: {
    width: 32,
    height: 32,
    justifyContent: 'center',
    alignItems: 'center',
    borderRadius: 8,
  },
  navBtnText: {
    fontSize: 16,
    color: '#ffffff',
    fontWeight: '600',
  },
  navTitle: {
    position: 'absolute',
    left: '50%',
    transform: [{translateX: -50}],
    fontSize: 18,
    fontWeight: '700',
    color: '#ffffff',
  },
  body: {
    flex: 1,
  },
  bodyContent: {
    paddingBottom: 100,
  },
  profileSection: {
    flexDirection: 'row',
    alignItems: 'center',
    padding: 24,
    paddingHorizontal: 20,
    gap: 16,
  },
  avatar: {
    width: 60,
    height: 60,
    borderRadius: 30,
    backgroundColor: '#404040',
    flexShrink: 0,
  },
  profileInfo: {
    flexDirection: 'row',
    alignItems: 'center',
    gap: 16,
  },
  profileName: {
    fontSize: 18,
    fontWeight: '700',
    color: '#ffffff',
    marginLeft: 8,
  },
  editAvatarBtn: {
    padding: 4,
  },
  infoList: {
    paddingHorizontal: 20,
  },
  infoItem: {
    flexDirection: 'row',
    justifyContent: 'space-between',
    alignItems: 'center',
    paddingVertical: 16,
    borderBottomWidth: 1,
    borderBottomColor: '#333333',
    minHeight: 24,
  },
  infoItemLast: {
    borderBottomWidth: 0,
  },
  infoLabel: {
    fontSize: 16,
    color: '#ffffff',
    fontWeight: '500',
    minWidth: 120,
    flexShrink: 0,
    flexWrap: 'nowrap',
  },
  infoValue: {
    fontSize: 16,
    color: '#ffffff',
    fontWeight: '400',
  },
  infoValueWithArrow: {
    flexDirection: 'row',
    alignItems: 'center',
    gap: 8,
  },
  editControls: {
    flexDirection: 'row',
    alignItems: 'center',
    gap: 8,
    flex: 1,
    justifyContent: 'flex-end',
  },
  editInput: {
    backgroundColor: '#404040',
    borderWidth: 1,
    borderColor: '#555555',
    borderRadius: 6,
    padding: 8,
    paddingHorizontal: 12,
    fontSize: 14,
    color: '#ffffff',
    minWidth: 120,
  },
  bodyInfoControls: {
    gap: 4,
    flexWrap: 'nowrap',
  },
  bodyInput: {
    minWidth: 50,
    maxWidth: 60,
    textAlign: 'center',
    fontSize: 12,
    padding: 6,
    paddingHorizontal: 8,
  },
  unit: {
    fontSize: 16,
    color: '#ffffff',
  },
  saveEditBtn: {
    width: 28,
    height: 28,
    borderRadius: 4,
    backgroundColor: '#8b5cf6',
    justifyContent: 'center',
    alignItems: 'center',
    flexShrink: 0,
  },
  saveEditBtnText: {
    fontSize: 14,
    color: '#ffffff',
  },
  editingItem: {
    backgroundColor: '#2a2a2a',
    borderRadius: 8,
    padding: 12,
    paddingHorizontal: 16,
    marginHorizontal: -20,
  },
  pickerContainer: {
    backgroundColor: '#404040',
    borderWidth: 1,
    borderColor: '#555555',
    borderRadius: 6,
    minWidth: 120,
  },
  picker: {
    color: '#ffffff',
    height: 40,
  },
});

export default ProfileEditModal;

