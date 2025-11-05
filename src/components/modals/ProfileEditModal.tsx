import React, { useState, useEffect } from "react";
import {
  View,
  Text,
  Modal,
  TouchableOpacity,
  StyleSheet,
  ScrollView,
  TextInput,
  Alert,
  ActivityIndicator,
  KeyboardAvoidingView,
  Platform,
  StatusBar,
} from "react-native";
import { Picker } from "@react-native-picker/picker";
import { Ionicons as Icon } from "@expo/vector-icons";
import { useSafeAreaInsets } from "react-native-safe-area-context";
import { authAPI } from "../../services";
import PasswordChangeModal from "./PasswordChangeModal";

interface ProfileEditModalProps {
  isOpen: boolean;
  onClose: () => void;
  profileData: any; // 부모로부터 받은 프로필 데이터
  onProfileUpdate: () => void; // 저장 후 부모 컴포넌트 새로고침
}

const ProfileEditModal: React.FC<ProfileEditModalProps> = ({
  isOpen,
  onClose,
  profileData: initialProfileData,
  onProfileUpdate,
}) => {
  const insets = useSafeAreaInsets();
  const [loading, setLoading] = useState(false);

  // ✅ 비밀번호 변경 모달 state (컴포넌트 안으로 이동)
  const [isPasswordChangeModalOpen, setIsPasswordChangeModalOpen] =
    useState(false);

  // 편집 가능한 필드들
  const [profileData, setProfileData] = useState({
    name: "",
    phoneNumber: "",
    height: "",
    weight: "",
    weightGoal: "",
    gender: "" as "M" | "F" | "",
    healthGoal: "",
    workoutDaysPerWeek: "",
  });

  // 읽기 전용 필드들
  const [readOnlyData, setReadOnlyData] = useState({
    email: "",
    userId: "",
    birthDate: "",
  });

  const [editingField, setEditingField] = useState<string | null>(null);
  const [tempValue, setTempValue] = useState("");

  // 초기 데이터 설정
  useEffect(() => {
    if (initialProfileData && isOpen) {
      setProfileData({
        name: initialProfileData.name || "",
        phoneNumber: initialProfileData.phoneNumber || "",
        height: String(initialProfileData.height || ""),
        weight: String(initialProfileData.weight || ""),
        weightGoal: String(initialProfileData.weightGoal || ""),
        gender: initialProfileData.gender || "",
        healthGoal: initialProfileData.healthGoal || "",
        workoutDaysPerWeek: initialProfileData.workoutDaysPerWeek || "",
      });

      setReadOnlyData({
        email: initialProfileData.email || "",
        userId: initialProfileData.userId || "",
        birthDate: initialProfileData.birthDate || "",
      });
    }
  }, [initialProfileData, isOpen]);

  // ✅ handleFieldClick 수정 (비밀번호 모달 열기)
  const handleFieldClick = (field: string) => {
    if (field === "password") {
      setIsPasswordChangeModalOpen(true); // Alert 대신 모달 열기
      return;
    }
    setEditingField(field);
    setTempValue((profileData as any)[field] || "");
  };

  const handleSave = () => {
    if (editingField) {
      setProfileData((prev) => ({
        ...prev,
        [editingField]: tempValue,
      }));
    }
    setEditingField(null);
    setTempValue("");
  };

  // 프로필 저장 (API 호출)
  const handleSaveProfile = async () => {
    try {
      setLoading(true);

      // API로 전송할 데이터 준비
      const updateData = {
        name: profileData.name,
        phoneNumber: profileData.phoneNumber,
        height: Number(profileData.height),
        weight: Number(profileData.weight),
        weightGoal: Number(profileData.weightGoal),
        gender: profileData.gender as "M" | "F",
        healthGoal: profileData.healthGoal,
        workoutDaysPerWeek: profileData.workoutDaysPerWeek,
      };

      // API 호출
      const response = await authAPI.updateProfile(updateData);

      if (response.success) {
        Alert.alert("성공", "프로필이 수정되었습니다.");
        onProfileUpdate(); // 부모 컴포넌트에 새로고침 요청
        onClose();
      } else {
        Alert.alert("오류", response.message || "프로필 수정에 실패했습니다.");
      }
    } catch (error: any) {
      console.error("프로필 수정 실패:", error);
      Alert.alert("오류", error.message || "프로필 수정에 실패했습니다.");
    } finally {
      setLoading(false);
    }
  };

  // 성별을 한글로 표시
  const getGenderText = (gender: string) => {
    return gender === "M" ? "남성" : gender === "F" ? "여성" : "";
  };

  // 운동 목표를 한글로 표시
  const getHealthGoalText = (goal: string) => {
    switch (goal) {
      case "DIET":
        return "다이어트";
      case "BULK":
        return "벌크업";
      case "LEAN_MASS":
        return "린매스";
      case "MUSCLE_GAIN":
        return "근육 증가";
      case "MAINTENANCE":
        return "유지";
      default:
        return goal;
    }
  };

  return (
    <>
      <Modal
        visible={isOpen}
        animationType="slide"
        transparent={false}
        onRequestClose={onClose}
        statusBarTranslucent={false}
      >
        <StatusBar barStyle="light-content" backgroundColor="#1a1a1a" />
        <View style={styles.overlay}>
          <KeyboardAvoidingView
            style={styles.modalContent}
            behavior={Platform.OS === "ios" ? "padding" : "height"}
            keyboardVerticalOffset={Platform.OS === "ios" ? 0 : 0}
          >
            <View
              style={[
                styles.nav,
                {
                  paddingTop: insets.top + 16,
                },
              ]}
            >
              <TouchableOpacity onPress={onClose} style={styles.navBtn}>
                <Text style={styles.navBtnText}>←</Text>
              </TouchableOpacity>
              <Text style={styles.navTitle}>정보 수정</Text>
              <TouchableOpacity
                onPress={() => {
                  handleSave();
                  handleSaveProfile();
                }}
                style={styles.navBtn}
                disabled={loading}
              >
                {loading ? (
                  <ActivityIndicator size="small" color="#ffffff" />
                ) : (
                  <Text style={styles.navBtnText}>✓</Text>
                )}
              </TouchableOpacity>
            </View>

            <ScrollView
              style={styles.body}
              contentContainerStyle={styles.bodyContent}
              keyboardShouldPersistTaps="handled"
              showsVerticalScrollIndicator={false}
            >
              <View style={styles.profileSection}>
                <View style={styles.avatar} />
                <View style={styles.profileInfo}>
                  <Text style={styles.profileName}>{profileData.name}님</Text>
                  <TouchableOpacity style={styles.editAvatarBtn}>
                    <Icon name="pencil" size={12} color="#8b5cf6" />
                  </TouchableOpacity>
                </View>
              </View>

              <View style={styles.infoList}>
                {/* 이름 */}
                {editingField === "name" ? (
                  <View style={[styles.infoItem, styles.editingItem]}>
                    <Text style={styles.infoLabel}>이름</Text>
                    <View style={styles.editControls}>
                      <TextInput
                        style={styles.editInput}
                        value={tempValue}
                        onChangeText={setTempValue}
                        placeholder="이름"
                        placeholderTextColor="#999999"
                      />
                      <TouchableOpacity
                        onPress={handleSave}
                        style={styles.saveEditBtn}
                      >
                        <Text style={styles.saveEditBtnText}>✓</Text>
                      </TouchableOpacity>
                    </View>
                  </View>
                ) : (
                  <TouchableOpacity
                    style={styles.infoItem}
                    onPress={() => handleFieldClick("name")}
                  >
                    <Text style={styles.infoLabel}>이름</Text>
                    <View style={styles.infoValueWithArrow}>
                      <Text style={styles.infoValue}>{profileData.name}</Text>
                      <Icon name="chevron-forward" size={16} color="#8b5cf6" />
                    </View>
                  </TouchableOpacity>
                )}

                {/* 이메일 (읽기 전용) */}
                <View style={styles.infoItem}>
                  <Text style={styles.infoLabel}>이메일</Text>
                  <Text style={[styles.infoValue, styles.readOnlyValue]}>
                    {readOnlyData.email}
                  </Text>
                </View>

                {/* 아이디 (읽기 전용) */}
                <View style={styles.infoItem}>
                  <Text style={styles.infoLabel}>아이디</Text>
                  <Text style={[styles.infoValue, styles.readOnlyValue]}>
                    {readOnlyData.userId}
                  </Text>
                </View>

                {/* 비밀번호 */}
                <TouchableOpacity
                  style={styles.infoItem}
                  onPress={() => handleFieldClick("password")}
                >
                  <Text style={styles.infoLabel}>비밀번호</Text>
                  <View style={styles.infoValueWithArrow}>
                    <Text style={styles.infoValue}>재설정하기</Text>
                    <Icon name="chevron-forward" size={16} color="#8b5cf6" />
                  </View>
                </TouchableOpacity>

                {/* 생년월일 (읽기 전용) */}
                <View style={styles.infoItem}>
                  <Text style={styles.infoLabel}>생년월일</Text>
                  <Text style={[styles.infoValue, styles.readOnlyValue]}>
                    {readOnlyData.birthDate}
                  </Text>
                </View>

                {/* 전화번호 */}
                {editingField === "phoneNumber" ? (
                  <View style={[styles.infoItem, styles.editingItem]}>
                    <Text style={styles.infoLabel}>전화번호</Text>
                    <View style={styles.editControls}>
                      <TextInput
                        style={styles.editInput}
                        value={tempValue}
                        onChangeText={setTempValue}
                        placeholder="01012345678"
                        placeholderTextColor="#999999"
                        keyboardType="phone-pad"
                      />
                      <TouchableOpacity
                        onPress={handleSave}
                        style={styles.saveEditBtn}
                      >
                        <Text style={styles.saveEditBtnText}>✓</Text>
                      </TouchableOpacity>
                    </View>
                  </View>
                ) : (
                  <TouchableOpacity
                    style={styles.infoItem}
                    onPress={() => handleFieldClick("phoneNumber")}
                  >
                    <Text style={styles.infoLabel}>전화번호</Text>
                    <View style={styles.infoValueWithArrow}>
                      <Text style={styles.infoValue}>
                        {profileData.phoneNumber}
                      </Text>
                      <Icon name="chevron-forward" size={16} color="#8b5cf6" />
                    </View>
                  </TouchableOpacity>
                )}

                {/* 성별 */}
                {editingField === "gender" ? (
                  <View style={[styles.infoItem, styles.editingItem]}>
                    <Text style={styles.infoLabel}>성별</Text>
                    <View style={styles.editControls}>
                      <View style={styles.pickerContainer}>
                        <Picker
                          selectedValue={tempValue}
                          onValueChange={setTempValue}
                          style={styles.picker}
                          dropdownIconColor="#ffffff"
                        >
                          <Picker.Item label="남성" value="M" color="#ffffff" />
                          <Picker.Item label="여성" value="F" color="#ffffff" />
                        </Picker>
                      </View>
                      <TouchableOpacity
                        onPress={handleSave}
                        style={styles.saveEditBtn}
                      >
                        <Text style={styles.saveEditBtnText}>✓</Text>
                      </TouchableOpacity>
                    </View>
                  </View>
                ) : (
                  <TouchableOpacity
                    style={styles.infoItem}
                    onPress={() => handleFieldClick("gender")}
                  >
                    <Text style={styles.infoLabel}>성별</Text>
                    <View style={styles.infoValueWithArrow}>
                      <Text style={styles.infoValue}>
                        {getGenderText(profileData.gender)}
                      </Text>
                      <Icon name="chevron-forward" size={16} color="#8b5cf6" />
                    </View>
                  </TouchableOpacity>
                )}

                {/* 신체정보 (키, 몸무게) */}
                {editingField === "bodyInfo" ? (
                  <View style={[styles.infoItem, styles.editingItem]}>
                    <Text style={styles.infoLabel}>신체정보</Text>
                    <View
                      style={[styles.editControls, styles.bodyInfoControls]}
                    >
                      <TextInput
                        style={[styles.editInput, styles.bodyInput]}
                        value={profileData.height}
                        onChangeText={(text) =>
                          setProfileData((prev) => ({ ...prev, height: text }))
                        }
                        placeholder="키"
                        keyboardType="numeric"
                        placeholderTextColor="#999999"
                      />
                      <Text style={styles.unit}>cm</Text>
                      <TextInput
                        style={[styles.editInput, styles.bodyInput]}
                        value={profileData.weight}
                        onChangeText={(text) =>
                          setProfileData((prev) => ({ ...prev, weight: text }))
                        }
                        placeholder="몸무게"
                        keyboardType="numeric"
                        placeholderTextColor="#999999"
                      />
                      <Text style={styles.unit}>kg</Text>
                      <TouchableOpacity
                        onPress={() => setEditingField(null)}
                        style={styles.saveEditBtn}
                      >
                        <Text style={styles.saveEditBtnText}>✓</Text>
                      </TouchableOpacity>
                    </View>
                  </View>
                ) : (
                  <TouchableOpacity
                    style={styles.infoItem}
                    onPress={() => setEditingField("bodyInfo")}
                  >
                    <Text style={styles.infoLabel}>신체정보</Text>
                    <View style={styles.infoValueWithArrow}>
                      <Text style={styles.infoValue}>
                        {profileData.height}cm • {profileData.weight}kg
                      </Text>
                      <Icon name="chevron-forward" size={16} color="#8b5cf6" />
                    </View>
                  </TouchableOpacity>
                )}

                {/* 목표 체중 */}
                {editingField === "weightGoal" ? (
                  <View style={[styles.infoItem, styles.editingItem]}>
                    <Text style={styles.infoLabel}>목표 체중</Text>
                    <View style={styles.editControls}>
                      <TextInput
                        style={styles.editInput}
                        value={tempValue}
                        onChangeText={setTempValue}
                        placeholder="목표 체중"
                        keyboardType="numeric"
                        placeholderTextColor="#999999"
                      />
                      <Text style={styles.unit}>kg</Text>
                      <TouchableOpacity
                        onPress={handleSave}
                        style={styles.saveEditBtn}
                      >
                        <Text style={styles.saveEditBtnText}>✓</Text>
                      </TouchableOpacity>
                    </View>
                  </View>
                ) : (
                  <TouchableOpacity
                    style={styles.infoItem}
                    onPress={() => handleFieldClick("weightGoal")}
                  >
                    <Text style={styles.infoLabel}>목표 체중</Text>
                    <View style={styles.infoValueWithArrow}>
                      <Text style={styles.infoValue}>
                        {profileData.weightGoal}kg
                      </Text>
                      <Icon name="chevron-forward" size={16} color="#8b5cf6" />
                    </View>
                  </TouchableOpacity>
                )}

                {/* 운동 목표 */}
                {editingField === "healthGoal" ? (
                  <View style={[styles.infoItem, styles.editingItem]}>
                    <Text style={styles.infoLabel}>운동 목표</Text>
                    <View style={styles.editControls}>
                      <View style={styles.pickerContainer}>
                        <Picker
                          selectedValue={tempValue}
                          onValueChange={setTempValue}
                          style={styles.picker}
                          dropdownIconColor="#ffffff"
                        >
                          <Picker.Item
                            label="다이어트"
                            value="DIET"
                            color="#ffffff"
                          />
                          <Picker.Item
                            label="벌크업"
                            value="BULK"
                            color="#ffffff"
                          />
                          <Picker.Item
                            label="린매스"
                            value="LEAN_MASS"
                            color="#ffffff"
                          />
                          <Picker.Item
                            label="근육 증가"
                            value="MUSCLE_GAIN"
                            color="#ffffff"
                          />
                          <Picker.Item
                            label="유지"
                            value="MAINTENANCE"
                            color="#ffffff"
                          />
                        </Picker>
                      </View>
                      <TouchableOpacity
                        onPress={handleSave}
                        style={styles.saveEditBtn}
                      >
                        <Text style={styles.saveEditBtnText}>✓</Text>
                      </TouchableOpacity>
                    </View>
                  </View>
                ) : (
                  <TouchableOpacity
                    style={styles.infoItem}
                    onPress={() => handleFieldClick("healthGoal")}
                  >
                    <Text style={styles.infoLabel}>운동 목표</Text>
                    <View style={styles.infoValueWithArrow}>
                      <Text style={styles.infoValue}>
                        {getHealthGoalText(profileData.healthGoal)}
                      </Text>
                      <Icon name="chevron-forward" size={16} color="#8b5cf6" />
                    </View>
                  </TouchableOpacity>
                )}

                {/* 주간 운동 일수 */}
                {editingField === "workoutDaysPerWeek" ? (
                  <View style={[styles.infoItem, styles.editingItem]}>
                    <Text style={styles.infoLabel}>주간 운동 일수</Text>
                    <View style={styles.editControls}>
                      <TextInput
                        style={styles.editInput}
                        value={tempValue}
                        onChangeText={setTempValue}
                        placeholder="예: 3-4일"
                        placeholderTextColor="#999999"
                      />
                      <TouchableOpacity
                        onPress={handleSave}
                        style={styles.saveEditBtn}
                      >
                        <Text style={styles.saveEditBtnText}>✓</Text>
                      </TouchableOpacity>
                    </View>
                  </View>
                ) : (
                  <TouchableOpacity
                    style={[styles.infoItem, styles.infoItemLast]}
                    onPress={() => handleFieldClick("workoutDaysPerWeek")}
                  >
                    <Text style={styles.infoLabel}>주간 운동 일수</Text>
                    <View style={styles.infoValueWithArrow}>
                      <Text style={styles.infoValue}>
                        {profileData.workoutDaysPerWeek || "설정 안 됨"}
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

      {/* ✅ 비밀번호 변경 모달 추가 */}
      <PasswordChangeModal
        isOpen={isPasswordChangeModalOpen}
        onClose={() => setIsPasswordChangeModalOpen(false)}
      />
    </>
  );
};

const styles = StyleSheet.create({
  overlay: {
    flex: 1,
    backgroundColor: "#1a1a1a",
  },
  modalContent: {
    flex: 1,
    backgroundColor: "#1a1a1a",
  },
  nav: {
    flexDirection: "row",
    justifyContent: "space-between",
    alignItems: "center",
    paddingBottom: 16,
    paddingHorizontal: 20,
    minHeight: 56,
    borderBottomWidth: 1,
    borderBottomColor: "#333333",
    backgroundColor: "#1a1a1a",
    position: "relative",
  },
  navBtn: {
    width: 32,
    height: 32,
    justifyContent: "center",
    alignItems: "center",
    borderRadius: 8,
  },
  navBtnText: {
    fontSize: 16,
    color: "#ffffff",
    fontWeight: "600",
  },
  navTitle: {
    position: "absolute",
    left: "50%",
    transform: [{ translateX: -50 }],
    fontSize: 18,
    fontWeight: "700",
    color: "#ffffff",
  },
  body: {
    flex: 1,
  },
  bodyContent: {
    paddingBottom: 100,
  },
  profileSection: {
    flexDirection: "row",
    alignItems: "center",
    padding: 24,
    paddingHorizontal: 20,
    gap: 16,
  },
  avatar: {
    width: 60,
    height: 60,
    borderRadius: 30,
    backgroundColor: "#404040",
    flexShrink: 0,
  },
  profileInfo: {
    flexDirection: "row",
    alignItems: "center",
    gap: 16,
  },
  profileName: {
    fontSize: 18,
    fontWeight: "700",
    color: "#ffffff",
    marginLeft: 8,
  },
  editAvatarBtn: {
    padding: 4,
  },
  infoList: {
    paddingHorizontal: 20,
  },
  infoItem: {
    flexDirection: "row",
    justifyContent: "space-between",
    alignItems: "center",
    paddingVertical: 16,
    borderBottomWidth: 1,
    borderBottomColor: "#333333",
    minHeight: 24,
  },
  infoItemLast: {
    borderBottomWidth: 0,
  },
  infoLabel: {
    fontSize: 16,
    color: "#ffffff",
    fontWeight: "500",
    minWidth: 120,
    flexShrink: 0,
    flexWrap: "nowrap",
  },
  infoValue: {
    fontSize: 16,
    color: "#ffffff",
    fontWeight: "400",
  },
  readOnlyValue: {
    color: "#999999",
  },
  infoValueWithArrow: {
    flexDirection: "row",
    alignItems: "center",
    gap: 8,
  },
  editControls: {
    flexDirection: "row",
    alignItems: "center",
    gap: 8,
    flex: 1,
    justifyContent: "flex-end",
  },
  editInput: {
    backgroundColor: "#404040",
    borderWidth: 1,
    borderColor: "#555555",
    borderRadius: 6,
    padding: 8,
    paddingHorizontal: 12,
    fontSize: 14,
    color: "#ffffff",
    minWidth: 120,
  },
  bodyInfoControls: {
    gap: 4,
    flexWrap: "nowrap",
  },
  bodyInput: {
    minWidth: 50,
    maxWidth: 60,
    textAlign: "center",
    fontSize: 12,
    padding: 6,
    paddingHorizontal: 8,
  },
  unit: {
    fontSize: 16,
    color: "#ffffff",
  },
  saveEditBtn: {
    width: 28,
    height: 28,
    borderRadius: 4,
    backgroundColor: "#8b5cf6",
    justifyContent: "center",
    alignItems: "center",
    flexShrink: 0,
  },
  saveEditBtnText: {
    fontSize: 14,
    color: "#ffffff",
  },
  editingItem: {
    backgroundColor: "#2a2a2a",
    borderRadius: 8,
    padding: 12,
    paddingHorizontal: 16,
    marginHorizontal: -20,
  },
  pickerContainer: {
    backgroundColor: "#404040",
    borderWidth: 1,
    borderColor: "#555555",
    borderRadius: 6,
    minWidth: 120,
  },
  picker: {
    color: "#ffffff",
    height: 40,
  },
});

export default ProfileEditModal;
