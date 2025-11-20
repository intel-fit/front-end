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

  // 비밀번호 변경 모달 state
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

  // handleFieldClick 수정 (비밀번호 모달 열기)
  const handleFieldClick = (field: string) => {
    if (field === "password") {
      setIsPasswordChangeModalOpen(true); // 비밀번호 모달 열기
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
        <StatusBar
          barStyle="light-content"
          backgroundColor={NEW_COLORS.background}
        />
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
                <Icon name="chevron-back" size={24} color={NEW_COLORS.text} />
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
                  <ActivityIndicator size="small" color={NEW_COLORS.accent} />
                ) : (
                  <Text
                    style={[styles.navBtnText, { color: NEW_COLORS.accent }]}
                  >
                    저장
                  </Text>
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
                <View style={styles.avatar}>
                  <Icon
                    name="person-circle-outline"
                    size={60}
                    color={NEW_COLORS.text_secondary}
                  />
                </View>
                <View style={styles.profileInfo}>
                  <Text style={styles.profileName}>{profileData.name}님</Text>
                  <TouchableOpacity style={styles.editAvatarBtn}>
                    <Icon name="camera" size={16} color={NEW_COLORS.accent} />
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
                        placeholderTextColor={NEW_COLORS.placeholder}
                      />
                      <TouchableOpacity
                        onPress={handleSave}
                        style={styles.saveEditBtn}
                      >
                        <Icon
                          name="checkmark"
                          size={18}
                          color={NEW_COLORS.text}
                        />
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
                      <Icon
                        name="chevron-forward"
                        size={16}
                        color={NEW_COLORS.text_secondary}
                      />
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
                    <Text
                      style={[styles.infoValue, { color: NEW_COLORS.accent }]}
                    >
                      재설정
                    </Text>
                    <Icon
                      name="lock-closed"
                      size={16}
                      color={NEW_COLORS.accent}
                    />
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
                        placeholderTextColor={NEW_COLORS.placeholder}
                        keyboardType="phone-pad"
                      />
                      <TouchableOpacity
                        onPress={handleSave}
                        style={styles.saveEditBtn}
                      >
                        <Icon
                          name="checkmark"
                          size={18}
                          color={NEW_COLORS.text}
                        />
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
                      <Icon
                        name="chevron-forward"
                        size={16}
                        color={NEW_COLORS.text_secondary}
                      />
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
                          dropdownIconColor={NEW_COLORS.text_secondary}
                          itemStyle={styles.pickerItem}
                        >
                          {/* 텍스트 색상을 검은색으로 변경 */}
                          <Picker.Item label="남성" value="M" color="black" />
                          <Picker.Item label="여성" value="F" color="black" />
                        </Picker>
                      </View>
                      <TouchableOpacity
                        onPress={handleSave}
                        style={styles.saveEditBtn}
                      >
                        <Icon
                          name="checkmark"
                          size={18}
                          color={NEW_COLORS.text}
                        />
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
                      <Icon
                        name="chevron-forward"
                        size={16}
                        color={NEW_COLORS.text_secondary}
                      />
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
                        placeholderTextColor={NEW_COLORS.placeholder}
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
                        placeholderTextColor={NEW_COLORS.placeholder}
                      />
                      <Text style={styles.unit}>kg</Text>
                      <TouchableOpacity
                        onPress={() => setEditingField(null)}
                        style={styles.saveEditBtn}
                      >
                        <Icon
                          name="checkmark"
                          size={18}
                          color={NEW_COLORS.text}
                        />
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
                        {profileData.height}cm / {profileData.weight}kg
                      </Text>
                      <Icon
                        name="chevron-forward"
                        size={16}
                        color={NEW_COLORS.text_secondary}
                      />
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
                        placeholderTextColor={NEW_COLORS.placeholder}
                      />
                      <Text style={styles.unit}>kg</Text>
                      <TouchableOpacity
                        onPress={handleSave}
                        style={styles.saveEditBtn}
                      >
                        <Icon
                          name="checkmark"
                          size={18}
                          color={NEW_COLORS.text}
                        />
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
                      <Icon
                        name="chevron-forward"
                        size={16}
                        color={NEW_COLORS.text_secondary}
                      />
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
                          dropdownIconColor={NEW_COLORS.text_secondary}
                          itemStyle={styles.pickerItem}
                        >
                          {/* 텍스트 색상을 검은색으로 변경 */}
                          <Picker.Item
                            label="다이어트"
                            value="DIET"
                            color="black"
                          />
                          <Picker.Item
                            label="벌크업"
                            value="BULK"
                            color="black"
                          />
                          <Picker.Item
                            label="린매스"
                            value="LEAN_MASS"
                            color="black"
                          />
                          <Picker.Item
                            label="근육 증가"
                            value="MUSCLE_GAIN"
                            color="black"
                          />
                          <Picker.Item
                            label="유지"
                            value="MAINTENANCE"
                            color="black"
                          />
                        </Picker>
                      </View>
                      <TouchableOpacity
                        onPress={handleSave}
                        style={styles.saveEditBtn}
                      >
                        <Icon
                          name="checkmark"
                          size={18}
                          color={NEW_COLORS.text}
                        />
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
                      <Icon
                        name="chevron-forward"
                        size={16}
                        color={NEW_COLORS.text_secondary}
                      />
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
                        placeholderTextColor={NEW_COLORS.placeholder}
                        keyboardType="numeric"
                      />
                      <TouchableOpacity
                        onPress={handleSave}
                        style={styles.saveEditBtn}
                      >
                        <Icon
                          name="checkmark"
                          size={18}
                          color={NEW_COLORS.text}
                        />
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
                      <Icon
                        name="chevron-forward"
                        size={16}
                        color={NEW_COLORS.text_secondary}
                      />
                    </View>
                  </TouchableOpacity>
                )}
              </View>
            </ScrollView>
          </KeyboardAvoidingView>
        </View>
      </Modal>

      {/* 비밀번호 변경 모달 */}
      <PasswordChangeModal
        isOpen={isPasswordChangeModalOpen}
        onClose={() => setIsPasswordChangeModalOpen(false)}
      />
    </>
  );
};

const NEW_COLORS = {
  background: "#1a1a1a",
  card_bg: "#252525",
  text: "#ffffff",
  text_secondary: "#a0a0a0",
  accent: "#e3ff7c",
  placeholder: "#777777",
  border_dark: "#333333",
  border_light: "#404040",
};

const styles = StyleSheet.create({
  overlay: {
    flex: 1,
    backgroundColor: NEW_COLORS.background,
  },
  modalContent: {
    flex: 1,
    backgroundColor: NEW_COLORS.background,
  },
  nav: {
    flexDirection: "row",
    justifyContent: "space-between",
    alignItems: "center",
    paddingBottom: 16,
    paddingHorizontal: 20,
    minHeight: 56,
    borderBottomWidth: 1,
    borderBottomColor: NEW_COLORS.border_dark,
    backgroundColor: NEW_COLORS.background,
    position: "relative",
  },
  navBtn: {
    padding: 4,
    minWidth: 40,
    justifyContent: "center",
    alignItems: "center",
  },
  navBtnText: {
    fontSize: 16,
    color: NEW_COLORS.text,
    fontWeight: "600",
  },
  navTitle: {
    position: "absolute",
    left: "50%",
    transform: [{ translateX: -50 }],
    fontSize: 18,
    fontWeight: "700",
    color: NEW_COLORS.text,
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
    backgroundColor: NEW_COLORS.border_dark,
    justifyContent: "center",
    alignItems: "center",
    flexShrink: 0,
  },
  profileInfo: {
    flexDirection: "row",
    alignItems: "center",
    gap: 12,
  },
  profileName: {
    fontSize: 20,
    fontWeight: "700",
    color: NEW_COLORS.text,
  },
  editAvatarBtn: {
    padding: 8,
    borderRadius: 15,
    backgroundColor: NEW_COLORS.card_bg,
  },
  infoList: {
    paddingHorizontal: 20,
  },
  infoItem: {
    flexDirection: "row",
    justifyContent: "space-between",
    alignItems: "center",
    paddingVertical: 18,
    borderBottomWidth: 1,
    borderBottomColor: NEW_COLORS.border_dark,
  },
  infoItemLast: {
    borderBottomWidth: 0,
  },
  infoLabel: {
    fontSize: 16,
    color: NEW_COLORS.text_secondary,
    fontWeight: "500",
    minWidth: 100,
    flexShrink: 0,
  },
  infoValue: {
    fontSize: 16,
    color: NEW_COLORS.text,
    fontWeight: "400",
  },
  readOnlyValue: {
    color: NEW_COLORS.text_secondary,
    fontWeight: "400",
  },
  infoValueWithArrow: {
    flexDirection: "row",
    alignItems: "center",
    gap: 4,
  },
  editingItem: {
    backgroundColor: NEW_COLORS.card_bg,
    borderRadius: 8,
    paddingVertical: 12,
    paddingHorizontal: 16,
    marginHorizontal: -20,
    borderBottomWidth: 0,
  },
  editControls: {
    flexDirection: "row",
    alignItems: "center",
    gap: 8,
    flex: 1,
    justifyContent: "flex-end",
  },
  editInput: {
    backgroundColor: NEW_COLORS.border_dark,
    borderWidth: 1,
    borderColor: NEW_COLORS.border_light,
    borderRadius: 6,
    padding: 10,
    paddingHorizontal: 12,
    fontSize: 15,
    color: NEW_COLORS.text,
    minWidth: 120,
    flex: 1,
  },
  bodyInfoControls: {
    gap: 6,
    flexWrap: "nowrap",
  },
  bodyInput: {
    minWidth: 50,
    maxWidth: 65,
    textAlign: "center",
    fontSize: 14,
    padding: 8,
  },
  unit: {
    fontSize: 15,
    color: NEW_COLORS.text_secondary,
  },
  saveEditBtn: {
    width: 32,
    height: 32,
    borderRadius: 6,
    backgroundColor: NEW_COLORS.accent,
    justifyContent: "center",
    alignItems: "center",
    flexShrink: 0,
  },
  saveEditBtnText: {
    fontSize: 18,
    color: NEW_COLORS.text,
  },
  pickerContainer: {
    backgroundColor: NEW_COLORS.border_dark,
    borderWidth: 1,
    borderColor: NEW_COLORS.border_light,
    borderRadius: 6,
    flex: 1,
    minWidth: 120,
    height: 40,
    overflow: "hidden",
    justifyContent: "center",
  },
  picker: {
    color: NEW_COLORS.text,
    height: 40,
    backgroundColor: "transparent",
  },
  pickerItem: {
    color: "black",
    fontSize: 15,
  },
});

export default ProfileEditModal;
