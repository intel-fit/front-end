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
import { Ionicons as Icon } from "@expo/vector-icons";
import { useSafeAreaInsets } from "react-native-safe-area-context";
import { authAPI } from "../../services";
import PasswordChangeModal from "./PasswordChangeModal";

interface ProfileEditModalProps {
  isOpen: boolean;
  onClose: () => void;
  profileData: any;
  onProfileUpdate: () => void;
}

const ProfileEditModal: React.FC<ProfileEditModalProps> = ({
  isOpen,
  onClose,
  profileData: initialProfileData,
  onProfileUpdate,
}) => {
  const insets = useSafeAreaInsets();
  const [loading, setLoading] = useState(false);
  const [isPasswordChangeModalOpen, setIsPasswordChangeModalOpen] =
    useState(false);

  const [profileData, setProfileData] = useState({
    name: "",
    height: "",
    weight: "",
    weightGoal: "",
    gender: "" as "M" | "F" | "",
    healthGoal: "",
    workoutDaysPerWeek: "",
  });

  const [readOnlyData, setReadOnlyData] = useState({
    email: "",
    userId: "",
    birthDate: "",
  });

  const [editingField, setEditingField] = useState<string | null>(null);
  const [tempValue, setTempValue] = useState("");

  useEffect(() => {
    if (initialProfileData && isOpen) {
      setProfileData({
        name: initialProfileData.name || "",
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

  const handleFieldClick = (field: string) => {
    if (field === "password") {
      setIsPasswordChangeModalOpen(true);
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

  const handleCancel = () => {
    setEditingField(null);
    setTempValue("");
  };

  const handleSaveProfile = async () => {
    try {
      setLoading(true);

      const updateData = {
        name: profileData.name,
        height: Number(profileData.height),
        weight: Number(profileData.weight),
        weightGoal: Number(profileData.weightGoal),
        gender: profileData.gender as "M" | "F",
        healthGoal: profileData.healthGoal,
        workoutDaysPerWeek: profileData.workoutDaysPerWeek,
      };

      const response = await authAPI.updateProfile(updateData);

      if (response.success) {
        Alert.alert("성공", "프로필이 수정되었습니다.");
        onProfileUpdate();
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

  const getGenderText = (gender: string) => {
    return gender === "M" ? "남성" : gender === "F" ? "여성" : "선택 안 됨";
  };

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
        return "선택 안 됨";
    }
  };

  // 성별 선택 옵션 렌더링
  const renderGenderSelector = () => (
    <View style={styles.selectorContainer}>
      <Text style={styles.selectorLabel}>성별을 선택하세요</Text>
      <View style={styles.optionButtons}>
        <TouchableOpacity
          style={[
            styles.optionButton,
            tempValue === "M" && styles.optionButtonActive,
          ]}
          onPress={() => setTempValue("M")}
        >
          <Icon
            name="male"
            size={20}
            color={tempValue === "M" ? NEW_COLORS.background : NEW_COLORS.text}
          />
          <Text
            style={[
              styles.optionButtonText,
              tempValue === "M" && styles.optionButtonTextActive,
            ]}
          >
            남성
          </Text>
        </TouchableOpacity>
        <TouchableOpacity
          style={[
            styles.optionButton,
            tempValue === "F" && styles.optionButtonActive,
          ]}
          onPress={() => setTempValue("F")}
        >
          <Icon
            name="female"
            size={20}
            color={tempValue === "F" ? NEW_COLORS.background : NEW_COLORS.text}
          />
          <Text
            style={[
              styles.optionButtonText,
              tempValue === "F" && styles.optionButtonTextActive,
            ]}
          >
            여성
          </Text>
        </TouchableOpacity>
      </View>
      <View style={styles.editActionButtons}>
        <TouchableOpacity onPress={handleCancel} style={styles.cancelButton}>
          <Text style={styles.cancelButtonText}>취소</Text>
        </TouchableOpacity>
        <TouchableOpacity onPress={handleSave} style={styles.confirmButton}>
          <Text style={styles.confirmButtonText}>확인</Text>
        </TouchableOpacity>
      </View>
    </View>
  );

  // 운동 목표 선택 옵션 렌더링
  const renderHealthGoalSelector = () => {
    const goals = [
      { label: "다이어트", value: "DIET", icon: "flame" },
      { label: "벌크업", value: "BULK", icon: "barbell" },
      { label: "린매스", value: "LEAN_MASS", icon: "fitness" },
      { label: "근육 증가", value: "MUSCLE_GAIN", icon: "body" },
      { label: "유지", value: "MAINTENANCE", icon: "heart" },
    ];

    return (
      <View style={styles.selectorContainer}>
        <Text style={styles.selectorLabel}>운동 목표를 선택하세요</Text>
        <View style={styles.goalGrid}>
          {goals.map((goal) => (
            <TouchableOpacity
              key={goal.value}
              style={[
                styles.goalOption,
                tempValue === goal.value && styles.goalOptionActive,
              ]}
              onPress={() => setTempValue(goal.value)}
            >
              <Icon
                name={goal.icon as any}
                size={24}
                color={
                  tempValue === goal.value
                    ? NEW_COLORS.background
                    : NEW_COLORS.text
                }
              />
              <Text
                style={[
                  styles.goalOptionText,
                  tempValue === goal.value && styles.goalOptionTextActive,
                ]}
              >
                {goal.label}
              </Text>
            </TouchableOpacity>
          ))}
        </View>
        <View style={styles.editActionButtons}>
          <TouchableOpacity onPress={handleCancel} style={styles.cancelButton}>
            <Text style={styles.cancelButtonText}>취소</Text>
          </TouchableOpacity>
          <TouchableOpacity onPress={handleSave} style={styles.confirmButton}>
            <Text style={styles.confirmButtonText}>확인</Text>
          </TouchableOpacity>
        </View>
      </View>
    );
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
            behavior={Platform.OS === "ios" ? "padding" : undefined}
            keyboardVerticalOffset={0}
          >
            {/* 헤더 */}
            <View
              style={[
                styles.nav,
                {
                  paddingTop: insets.top + 16,
                },
              ]}
            >
              <TouchableOpacity onPress={onClose} style={styles.navBtn}>
                <Icon name="chevron-back" size={26} color={NEW_COLORS.text} />
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
                  <Text style={styles.saveText}>저장</Text>
                )}
              </TouchableOpacity>
            </View>

            <ScrollView
              style={styles.body}
              contentContainerStyle={styles.bodyContent}
              keyboardShouldPersistTaps="handled"
              showsVerticalScrollIndicator={false}
            >
              {/* 프로필 섹션 */}
              <View style={styles.profileSection}>
                <View style={styles.avatar}>
                  <Icon
                    name="person-circle-outline"
                    size={70}
                    color={NEW_COLORS.text_secondary}
                  />
                </View>
                <View style={styles.profileInfo}>
                  <Text style={styles.profileName}>{profileData.name}님</Text>
                  <TouchableOpacity style={styles.editAvatarBtn}>
                    <Icon name="camera" size={18} color={NEW_COLORS.accent} />
                    <Text style={styles.editAvatarText}>사진 변경</Text>
                  </TouchableOpacity>
                </View>
              </View>

              {/* 정보 목록 */}
              <View style={styles.infoList}>
                {/* 이름 */}
                {editingField === "name" ? (
                  <View style={styles.editingCard}>
                    <Text style={styles.editingLabel}>이름</Text>
                    <TextInput
                      style={styles.fullWidthInput}
                      value={tempValue}
                      onChangeText={setTempValue}
                      placeholder="이름을 입력하세요"
                      placeholderTextColor={NEW_COLORS.placeholder}
                      autoFocus
                    />
                    <View style={styles.editActionButtons}>
                      <TouchableOpacity
                        onPress={handleCancel}
                        style={styles.cancelButton}
                      >
                        <Text style={styles.cancelButtonText}>취소</Text>
                      </TouchableOpacity>
                      <TouchableOpacity
                        onPress={handleSave}
                        style={styles.confirmButton}
                      >
                        <Text style={styles.confirmButtonText}>확인</Text>
                      </TouchableOpacity>
                    </View>
                  </View>
                ) : (
                  <TouchableOpacity
                    style={styles.infoItem}
                    onPress={() => handleFieldClick("name")}
                    activeOpacity={0.7}
                  >
                    <View style={styles.infoLeft}>
                      <Icon
                        name="person-outline"
                        size={20}
                        color={NEW_COLORS.text_secondary}
                      />
                      <Text style={styles.infoLabel}>이름</Text>
                    </View>
                    <View style={styles.infoRight}>
                      <Text style={styles.infoValue}>{profileData.name}</Text>
                      <Icon
                        name="chevron-forward"
                        size={18}
                        color={NEW_COLORS.text_secondary}
                      />
                    </View>
                  </TouchableOpacity>
                )}

                {/* 이메일 (읽기 전용) */}
                <View style={[styles.infoItem, styles.readOnlyItem]}>
                  <View style={styles.infoLeft}>
                    <Icon
                      name="mail-outline"
                      size={20}
                      color={NEW_COLORS.text_secondary}
                    />
                    <Text style={styles.infoLabel}>이메일</Text>
                  </View>
                  <Text style={styles.readOnlyValue}>{readOnlyData.email}</Text>
                </View>

                {/* 아이디 (읽기 전용) */}
                <View style={[styles.infoItem, styles.readOnlyItem]}>
                  <View style={styles.infoLeft}>
                    <Icon
                      name="at-outline"
                      size={20}
                      color={NEW_COLORS.text_secondary}
                    />
                    <Text style={styles.infoLabel}>아이디</Text>
                  </View>
                  <Text style={styles.readOnlyValue}>
                    {readOnlyData.userId}
                  </Text>
                </View>

                {/* 비밀번호 */}
                <TouchableOpacity
                  style={styles.infoItem}
                  onPress={() => handleFieldClick("password")}
                  activeOpacity={0.7}
                >
                  <View style={styles.infoLeft}>
                    <Icon
                      name="lock-closed-outline"
                      size={20}
                      color={NEW_COLORS.text_secondary}
                    />
                    <Text style={styles.infoLabel}>비밀번호</Text>
                  </View>
                  <View style={styles.infoRight}>
                    <Text style={styles.accentValue}>변경하기</Text>
                    <Icon
                      name="chevron-forward"
                      size={18}
                      color={NEW_COLORS.accent}
                    />
                  </View>
                </TouchableOpacity>

                {/* 생년월일 (읽기 전용) */}
                <View style={[styles.infoItem, styles.readOnlyItem]}>
                  <View style={styles.infoLeft}>
                    <Icon
                      name="calendar-outline"
                      size={20}
                      color={NEW_COLORS.text_secondary}
                    />
                    <Text style={styles.infoLabel}>생년월일</Text>
                  </View>
                  <Text style={styles.readOnlyValue}>
                    {readOnlyData.birthDate}
                  </Text>
                </View>

                {/* 성별 */}
                {editingField === "gender" ? (
                  <View style={styles.editingCard}>
                    {renderGenderSelector()}
                  </View>
                ) : (
                  <TouchableOpacity
                    style={styles.infoItem}
                    onPress={() => handleFieldClick("gender")}
                    activeOpacity={0.7}
                  >
                    <View style={styles.infoLeft}>
                      <Icon
                        name={profileData.gender === "M" ? "male" : "female"}
                        size={20}
                        color={NEW_COLORS.text_secondary}
                      />
                      <Text style={styles.infoLabel}>성별</Text>
                    </View>
                    <View style={styles.infoRight}>
                      <Text style={styles.infoValue}>
                        {getGenderText(profileData.gender)}
                      </Text>
                      <Icon
                        name="chevron-forward"
                        size={18}
                        color={NEW_COLORS.text_secondary}
                      />
                    </View>
                  </TouchableOpacity>
                )}

                {/* 신체정보 */}
                {editingField === "bodyInfo" ? (
                  <View style={styles.editingCard}>
                    <Text style={styles.editingLabel}>신체정보</Text>
                    <View style={styles.bodyInfoInputs}>
                      <View style={styles.bodyInputGroup}>
                        <Text style={styles.bodyInputLabel}>키</Text>
                        <View style={styles.bodyInputWrapper}>
                          <TextInput
                            style={styles.bodyInput}
                            value={profileData.height}
                            onChangeText={(text) =>
                              setProfileData((prev) => ({
                                ...prev,
                                height: text,
                              }))
                            }
                            placeholder="0"
                            keyboardType="numeric"
                            placeholderTextColor={NEW_COLORS.placeholder}
                          />
                          <Text style={styles.bodyUnit}>cm</Text>
                        </View>
                      </View>
                      <View style={styles.bodyInputGroup}>
                        <Text style={styles.bodyInputLabel}>몸무게</Text>
                        <View style={styles.bodyInputWrapper}>
                          <TextInput
                            style={styles.bodyInput}
                            value={profileData.weight}
                            onChangeText={(text) =>
                              setProfileData((prev) => ({
                                ...prev,
                                weight: text,
                              }))
                            }
                            placeholder="0"
                            keyboardType="numeric"
                            placeholderTextColor={NEW_COLORS.placeholder}
                          />
                          <Text style={styles.bodyUnit}>kg</Text>
                        </View>
                      </View>
                    </View>
                    <View style={styles.editActionButtons}>
                      <TouchableOpacity
                        onPress={handleCancel}
                        style={styles.cancelButton}
                      >
                        <Text style={styles.cancelButtonText}>취소</Text>
                      </TouchableOpacity>
                      <TouchableOpacity
                        onPress={() => setEditingField(null)}
                        style={styles.confirmButton}
                      >
                        <Text style={styles.confirmButtonText}>확인</Text>
                      </TouchableOpacity>
                    </View>
                  </View>
                ) : (
                  <TouchableOpacity
                    style={styles.infoItem}
                    onPress={() => setEditingField("bodyInfo")}
                    activeOpacity={0.7}
                  >
                    <View style={styles.infoLeft}>
                      <Icon
                        name="body-outline"
                        size={20}
                        color={NEW_COLORS.text_secondary}
                      />
                      <Text style={styles.infoLabel}>신체정보</Text>
                    </View>
                    <View style={styles.infoRight}>
                      <Text style={styles.infoValue}>
                        {profileData.height}cm / {profileData.weight}kg
                      </Text>
                      <Icon
                        name="chevron-forward"
                        size={18}
                        color={NEW_COLORS.text_secondary}
                      />
                    </View>
                  </TouchableOpacity>
                )}

                {/* 목표 체중 */}
                {editingField === "weightGoal" ? (
                  <View style={styles.editingCard}>
                    <Text style={styles.editingLabel}>목표 체중</Text>
                    <View style={styles.inlineInputWrapper}>
                      <TextInput
                        style={styles.inlineInput}
                        value={tempValue}
                        onChangeText={setTempValue}
                        placeholder="목표 체중"
                        keyboardType="numeric"
                        placeholderTextColor={NEW_COLORS.placeholder}
                        autoFocus
                      />
                      <Text style={styles.inlineUnit}>kg</Text>
                    </View>
                    <View style={styles.editActionButtons}>
                      <TouchableOpacity
                        onPress={handleCancel}
                        style={styles.cancelButton}
                      >
                        <Text style={styles.cancelButtonText}>취소</Text>
                      </TouchableOpacity>
                      <TouchableOpacity
                        onPress={handleSave}
                        style={styles.confirmButton}
                      >
                        <Text style={styles.confirmButtonText}>확인</Text>
                      </TouchableOpacity>
                    </View>
                  </View>
                ) : (
                  <TouchableOpacity
                    style={styles.infoItem}
                    onPress={() => handleFieldClick("weightGoal")}
                    activeOpacity={0.7}
                  >
                    <View style={styles.infoLeft}>
                      <Icon
                        name="flag-outline"
                        size={20}
                        color={NEW_COLORS.text_secondary}
                      />
                      <Text style={styles.infoLabel}>목표 체중</Text>
                    </View>
                    <View style={styles.infoRight}>
                      <Text style={styles.infoValue}>
                        {profileData.weightGoal}kg
                      </Text>
                      <Icon
                        name="chevron-forward"
                        size={18}
                        color={NEW_COLORS.text_secondary}
                      />
                    </View>
                  </TouchableOpacity>
                )}

                {/* 운동 목표 */}
                {editingField === "healthGoal" ? (
                  <View style={styles.editingCard}>
                    {renderHealthGoalSelector()}
                  </View>
                ) : (
                  <TouchableOpacity
                    style={styles.infoItem}
                    onPress={() => handleFieldClick("healthGoal")}
                    activeOpacity={0.7}
                  >
                    <View style={styles.infoLeft}>
                      <Icon
                        name="trophy-outline"
                        size={20}
                        color={NEW_COLORS.text_secondary}
                      />
                      <Text style={styles.infoLabel}>운동 목표</Text>
                    </View>
                    <View style={styles.infoRight}>
                      <Text style={styles.infoValue}>
                        {getHealthGoalText(profileData.healthGoal)}
                      </Text>
                      <Icon
                        name="chevron-forward"
                        size={18}
                        color={NEW_COLORS.text_secondary}
                      />
                    </View>
                  </TouchableOpacity>
                )}

                {/* 주간 운동 일수 */}
                {editingField === "workoutDaysPerWeek" ? (
                  <View style={styles.editingCard}>
                    <Text style={styles.editingLabel}>주간 운동 일수</Text>
                    <TextInput
                      style={styles.fullWidthInput}
                      value={tempValue}
                      onChangeText={setTempValue}
                      placeholder="예: 3-4일"
                      placeholderTextColor={NEW_COLORS.placeholder}
                      autoFocus
                    />
                    <View style={styles.editActionButtons}>
                      <TouchableOpacity
                        onPress={handleCancel}
                        style={styles.cancelButton}
                      >
                        <Text style={styles.cancelButtonText}>취소</Text>
                      </TouchableOpacity>
                      <TouchableOpacity
                        onPress={handleSave}
                        style={styles.confirmButton}
                      >
                        <Text style={styles.confirmButtonText}>확인</Text>
                      </TouchableOpacity>
                    </View>
                  </View>
                ) : (
                  <TouchableOpacity
                    style={[styles.infoItem, styles.infoItemLast]}
                    onPress={() => handleFieldClick("workoutDaysPerWeek")}
                    activeOpacity={0.7}
                  >
                    <View style={styles.infoLeft}>
                      <Icon
                        name="barbell-outline"
                        size={20}
                        color={NEW_COLORS.text_secondary}
                      />
                      <Text style={styles.infoLabel}>주간 운동 일수</Text>
                    </View>
                    <View style={styles.infoRight}>
                      <Text style={styles.infoValue}>
                        {profileData.workoutDaysPerWeek || "설정 안 됨"}
                      </Text>
                      <Icon
                        name="chevron-forward"
                        size={18}
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
  },
  navBtn: {
    padding: 8,
    minWidth: 60,
    justifyContent: "center",
    alignItems: "center",
  },
  navTitle: {
    fontSize: 18,
    fontWeight: "700",
    color: NEW_COLORS.text,
    position: "absolute",
    left: 0,
    right: 0,
    textAlign: "center",
  },
  saveText: {
    fontSize: 16,
    color: NEW_COLORS.accent,
    fontWeight: "600",
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
    gap: 16,
    backgroundColor: NEW_COLORS.card_bg,
    marginHorizontal: 20,
    marginTop: 20,
    marginBottom: 24,
    borderRadius: 16,
  },
  avatar: {
    width: 70,
    height: 70,
    borderRadius: 35,
    backgroundColor: NEW_COLORS.border_dark,
    justifyContent: "center",
    alignItems: "center",
  },
  profileInfo: {
    flex: 1,
    gap: 8,
  },
  profileName: {
    fontSize: 22,
    fontWeight: "700",
    color: NEW_COLORS.text,
  },
  editAvatarBtn: {
    flexDirection: "row",
    alignItems: "center",
    gap: 6,
    paddingVertical: 6,
    paddingHorizontal: 12,
    backgroundColor: NEW_COLORS.background,
    borderRadius: 20,
    alignSelf: "flex-start",
  },
  editAvatarText: {
    fontSize: 13,
    color: NEW_COLORS.accent,
    fontWeight: "600",
  },
  infoList: {
    paddingHorizontal: 20,
    gap: 12,
  },
  infoItem: {
    flexDirection: "row",
    justifyContent: "space-between",
    alignItems: "center",
    paddingVertical: 16,
    paddingHorizontal: 16,
    backgroundColor: NEW_COLORS.card_bg,
    borderRadius: 12,
    minHeight: 60,
  },
  infoItemLast: {
    marginBottom: 0,
  },
  readOnlyItem: {
    opacity: 0.7,
  },
  infoLeft: {
    flexDirection: "row",
    alignItems: "center",
    gap: 12,
    flex: 1,
  },
  infoLabel: {
    fontSize: 16,
    color: NEW_COLORS.text,
    fontWeight: "500",
  },
  infoRight: {
    flexDirection: "row",
    alignItems: "center",
    gap: 8,
  },
  infoValue: {
    fontSize: 16,
    color: NEW_COLORS.text,
    fontWeight: "400",
  },
  readOnlyValue: {
    fontSize: 15,
    color: NEW_COLORS.text_secondary,
    fontWeight: "400",
  },
  accentValue: {
    fontSize: 15,
    color: NEW_COLORS.accent,
    fontWeight: "600",
  },
  editingCard: {
    backgroundColor: NEW_COLORS.card_bg,
    borderRadius: 12,
    padding: 20,
    gap: 16,
  },
  editingLabel: {
    fontSize: 16,
    color: NEW_COLORS.text,
    fontWeight: "600",
    marginBottom: 4,
  },
  fullWidthInput: {
    backgroundColor: NEW_COLORS.background,
    borderWidth: 1,
    borderColor: NEW_COLORS.border_light,
    borderRadius: 10,
    padding: 14,
    fontSize: 16,
    color: NEW_COLORS.text,
  },
  inlineInputWrapper: {
    flexDirection: "row",
    alignItems: "center",
    backgroundColor: NEW_COLORS.background,
    borderWidth: 1,
    borderColor: NEW_COLORS.border_light,
    borderRadius: 10,
    paddingHorizontal: 14,
    height: 50,
  },
  inlineInput: {
    flex: 1,
    fontSize: 16,
    color: NEW_COLORS.text,
    padding: 0,
  },
  inlineUnit: {
    fontSize: 16,
    color: NEW_COLORS.text_secondary,
    marginLeft: 8,
  },
  bodyInfoInputs: {
    flexDirection: "row",
    gap: 12,
  },
  bodyInputGroup: {
    flex: 1,
    gap: 8,
  },
  bodyInputLabel: {
    fontSize: 14,
    color: NEW_COLORS.text_secondary,
    fontWeight: "500",
  },
  bodyInputWrapper: {
    flexDirection: "row",
    alignItems: "center",
    backgroundColor: NEW_COLORS.background,
    borderWidth: 1,
    borderColor: NEW_COLORS.border_light,
    borderRadius: 10,
    paddingHorizontal: 14,
    height: 50,
  },
  bodyInput: {
    flex: 1,
    fontSize: 16,
    color: NEW_COLORS.text,
    textAlign: "center",
    padding: 0,
  },
  bodyUnit: {
    fontSize: 14,
    color: NEW_COLORS.text_secondary,
  },
  editActionButtons: {
    flexDirection: "row",
    gap: 12,
    marginTop: 8,
  },
  cancelButton: {
    flex: 1,
    paddingVertical: 14,
    borderRadius: 10,
    backgroundColor: NEW_COLORS.background,
    borderWidth: 1,
    borderColor: NEW_COLORS.border_light,
    alignItems: "center",
  },
  cancelButtonText: {
    fontSize: 16,
    color: NEW_COLORS.text,
    fontWeight: "600",
  },
  confirmButton: {
    flex: 1,
    paddingVertical: 14,
    borderRadius: 10,
    backgroundColor: NEW_COLORS.accent,
    alignItems: "center",
  },
  confirmButtonText: {
    fontSize: 16,
    color: NEW_COLORS.background,
    fontWeight: "700",
  },
  // 선택자 스타일
  selectorContainer: {
    gap: 16,
  },
  selectorLabel: {
    fontSize: 15,
    color: NEW_COLORS.text_secondary,
    fontWeight: "500",
    marginBottom: 4,
  },
  optionButtons: {
    flexDirection: "row",
    gap: 12,
  },
  optionButton: {
    flex: 1,
    flexDirection: "row",
    alignItems: "center",
    justifyContent: "center",
    gap: 8,
    paddingVertical: 16,
    borderRadius: 10,
    backgroundColor: NEW_COLORS.background,
    borderWidth: 2,
    borderColor: NEW_COLORS.border_light,
  },
  optionButtonActive: {
    backgroundColor: NEW_COLORS.accent,
    borderColor: NEW_COLORS.accent,
  },
  optionButtonText: {
    fontSize: 16,
    color: NEW_COLORS.text,
    fontWeight: "600",
  },
  optionButtonTextActive: {
    color: NEW_COLORS.background,
  },
  goalGrid: {
    flexDirection: "row",
    flexWrap: "wrap",
    gap: 12,
  },
  goalOption: {
    width: "48%",
    flexDirection: "column",
    alignItems: "center",
    gap: 8,
    paddingVertical: 16,
    borderRadius: 10,
    backgroundColor: NEW_COLORS.background,
    borderWidth: 2,
    borderColor: NEW_COLORS.border_light,
  },
  goalOptionActive: {
    backgroundColor: NEW_COLORS.accent,
    borderColor: NEW_COLORS.accent,
  },
  goalOptionText: {
    fontSize: 15,
    color: NEW_COLORS.text,
    fontWeight: "600",
  },
  goalOptionTextActive: {
    color: NEW_COLORS.background,
  },
});

export default ProfileEditModal;
