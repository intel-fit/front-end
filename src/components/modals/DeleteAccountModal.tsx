import React, { useState } from "react";
import {
  View,
  Text,
  Modal,
  TouchableOpacity,
  StyleSheet,
  TextInput,
  Alert,
  ActivityIndicator,
  KeyboardAvoidingView,
  Platform,
  StatusBar,
  ScrollView,
} from "react-native";
import { Ionicons as Icon } from "@expo/vector-icons";
import { useSafeAreaInsets } from "react-native-safe-area-context";
import { authAPI } from "../../services";

interface DeleteAccountModalProps {
  isOpen: boolean;
  onClose: () => void;
  onDeleteSuccess: () => void; // 탈퇴 성공 후 로그인 화면으로 이동
}

const DeleteAccountModal: React.FC<DeleteAccountModalProps> = ({
  isOpen,
  onClose,
  onDeleteSuccess,
}) => {
  const insets = useSafeAreaInsets();
  const [loading, setLoading] = useState(false);
  const [password, setPassword] = useState("");
  const [reason, setReason] = useState("");
  const [showPassword, setShowPassword] = useState(false);

  const validateInputs = () => {
    if (!password.trim()) {
      Alert.alert("오류", "비밀번호를 입력해주세요.");
      return false;
    }

    if (!reason.trim()) {
      Alert.alert("오류", "탈퇴 사유를 입력해주세요.");
      return false;
    }

    return true;
  };

  const handleDeleteAccount = async () => {
    if (!validateInputs()) {
      return;
    }

    // 최종 확인
    Alert.alert(
      "회원탈퇴 확인",
      "정말로 탈퇴하시겠습니까?\n탈퇴 시 모든 데이터가 삭제되며 복구할 수 없습니다.",
      [
        {
          text: "취소",
          style: "cancel",
        },
        {
          text: "탈퇴",
          style: "destructive",
          onPress: async () => {
            try {
              setLoading(true);
              const response = await authAPI.deleteAccount(password, reason);

              if (response.success) {
                Alert.alert(
                  "탈퇴 완료",
                  "회원탈퇴가 완료되었습니다. 그동안 이용해주셔서 감사합니다.",
                  [
                    {
                      text: "확인",
                      onPress: () => {
                        onClose();
                        onDeleteSuccess(); // 로그인 화면으로 이동
                      },
                    },
                  ]
                );
              } else {
                Alert.alert(
                  "오류",
                  response.message || "회원탈퇴에 실패했습니다."
                );
              }
            } catch (error: any) {
              console.error("회원탈퇴 실패:", error);
              Alert.alert("오류", error.message || "회원탈퇴에 실패했습니다.");
            } finally {
              setLoading(false);
            }
          },
        },
      ]
    );
  };

  const handleClose = () => {
    setPassword("");
    setReason("");
    onClose();
  };

  return (
    <Modal
      visible={isOpen}
      animationType="slide"
      transparent={false}
      onRequestClose={handleClose}
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
            <TouchableOpacity onPress={handleClose} style={styles.navBtn}>
              <Text style={styles.navBtnText}>←</Text>
            </TouchableOpacity>
            <Text style={styles.navTitle}>회원탈퇴</Text>
            <View style={styles.navBtn} />
          </View>

          <ScrollView
            style={styles.body}
            contentContainerStyle={styles.bodyContent}
            keyboardShouldPersistTaps="handled"
          >
            <View style={styles.warningBox}>
              <Icon name="warning" size={48} color="#ef4444" />
              <Text style={styles.warningTitle}>회원탈퇴 안내</Text>
              <Text style={styles.warningText}>
                • 탈퇴 시 모든 회원 정보가 삭제됩니다{"\n"}• 운동 기록, 식단
                기록 등 모든 데이터가 삭제됩니다{"\n"}• 탈퇴 후에는 데이터
                복구가 불가능합니다{"\n"}• 동일한 계정으로 재가입이 가능합니다
              </Text>
            </View>

            <View style={styles.inputGroup}>
              <Text style={styles.label}>
                비밀번호 확인 <Text style={styles.required}>*</Text>
              </Text>
              <View style={styles.passwordInputContainer}>
                <TextInput
                  style={styles.input}
                  value={password}
                  onChangeText={setPassword}
                  placeholder="현재 비밀번호를 입력하세요"
                  placeholderTextColor="#999999"
                  secureTextEntry={!showPassword}
                  autoCapitalize="none"
                />
                <TouchableOpacity
                  onPress={() => setShowPassword(!showPassword)}
                  style={styles.eyeIcon}
                >
                  <Icon
                    name={showPassword ? "eye-off" : "eye"}
                    size={20}
                    color="#999999"
                  />
                </TouchableOpacity>
              </View>
            </View>

            <View style={styles.inputGroup}>
              <Text style={styles.label}>
                탈퇴 사유 <Text style={styles.required}>*</Text>
              </Text>
              <TextInput
                style={[styles.input, styles.textArea]}
                value={reason}
                onChangeText={setReason}
                placeholder="탈퇴 사유를 입력해주세요 (예: 서비스 불만, 개인정보 보호 등)"
                placeholderTextColor="#999999"
                multiline
                numberOfLines={4}
                textAlignVertical="top"
              />
            </View>

            <TouchableOpacity
              style={[styles.deleteBtn, loading && styles.deleteBtnDisabled]}
              onPress={handleDeleteAccount}
              disabled={loading}
            >
              {loading ? (
                <ActivityIndicator size="small" color="#ffffff" />
              ) : (
                <Text style={styles.deleteBtnText}>회원탈퇴</Text>
              )}
            </TouchableOpacity>
          </ScrollView>
        </KeyboardAvoidingView>
      </View>
    </Modal>
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
    paddingHorizontal: 20,
    paddingTop: 24,
    paddingBottom: 40,
  },
  warningBox: {
    backgroundColor: "#2a1a1a",
    borderWidth: 1,
    borderColor: "#ef4444",
    borderRadius: 12,
    padding: 20,
    alignItems: "center",
    marginBottom: 32,
  },
  warningTitle: {
    fontSize: 18,
    fontWeight: "700",
    color: "#ef4444",
    marginTop: 12,
    marginBottom: 16,
  },
  warningText: {
    fontSize: 14,
    color: "#cccccc",
    lineHeight: 24,
    textAlign: "left",
    width: "100%",
  },
  inputGroup: {
    marginBottom: 24,
  },
  label: {
    fontSize: 16,
    color: "#ffffff",
    fontWeight: "500",
    marginBottom: 8,
  },
  required: {
    color: "#ef4444",
  },
  passwordInputContainer: {
    flexDirection: "row",
    alignItems: "center",
    backgroundColor: "#404040",
    borderRadius: 8,
    borderWidth: 1,
    borderColor: "#555555",
  },
  input: {
    flex: 1,
    height: 50,
    paddingHorizontal: 16,
    fontSize: 16,
    color: "#ffffff",
    backgroundColor: "#404040",
    borderRadius: 8,
    borderWidth: 1,
    borderColor: "#555555",
  },
  textArea: {
    height: 100,
    paddingTop: 12,
  },
  eyeIcon: {
    padding: 12,
  },
  deleteBtn: {
    height: 56,
    backgroundColor: "#ef4444",
    borderRadius: 12,
    justifyContent: "center",
    alignItems: "center",
    marginTop: 8,
  },
  deleteBtnDisabled: {
    opacity: 0.6,
  },
  deleteBtnText: {
    fontSize: 16,
    fontWeight: "600",
    color: "#ffffff",
  },
});

export default DeleteAccountModal;
