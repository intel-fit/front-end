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
} from "react-native";
import { Ionicons as Icon } from "@expo/vector-icons";
import { useSafeAreaInsets } from "react-native-safe-area-context";
import { authAPI } from "../../services";

interface PasswordChangeModalProps {
  isOpen: boolean;
  onClose: () => void;
}

const PasswordChangeModal: React.FC<PasswordChangeModalProps> = ({
  isOpen,
  onClose,
}) => {
  const insets = useSafeAreaInsets();
  const [loading, setLoading] = useState(false);
  const [passwords, setPasswords] = useState({
    currentPassword: "",
    newPassword: "",
    newPasswordConfirm: "",
  });
  const [showPasswords, setShowPasswords] = useState({
    current: false,
    new: false,
    confirm: false,
  });

  const handleChange = (field: string, value: string) => {
    setPasswords((prev) => ({ ...prev, [field]: value }));
  };

  const validatePasswords = () => {
    if (!passwords.currentPassword) {
      Alert.alert("오류", "현재 비밀번호를 입력해주세요.");
      return false;
    }

    if (!passwords.newPassword) {
      Alert.alert("오류", "새 비밀번호를 입력해주세요.");
      return false;
    }

    if (passwords.newPassword.length < 8) {
      Alert.alert("오류", "비밀번호는 8자 이상이어야 합니다.");
      return false;
    }

    if (!/(?=.*[a-zA-Z])(?=.*\d)(?=.*[!@#$%^&*])/.test(passwords.newPassword)) {
      Alert.alert("오류", "비밀번호는 숫자, 문자, 특수문자를 포함해야 합니다.");
      return false;
    }

    if (passwords.newPassword !== passwords.newPasswordConfirm) {
      Alert.alert("오류", "새 비밀번호가 일치하지 않습니다.");
      return false;
    }

    if (passwords.currentPassword === passwords.newPassword) {
      Alert.alert("오류", "현재 비밀번호와 새 비밀번호가 같습니다.");
      return false;
    }

    return true;
  };

  const handleSubmit = async () => {
    if (!validatePasswords()) {
      return;
    }

    try {
      setLoading(true);
      const response = await authAPI.changePasswordLoggedIn(
        passwords.currentPassword,
        passwords.newPassword,
        passwords.newPasswordConfirm
      );

      if (response.success) {
        Alert.alert("성공", "비밀번호가 변경되었습니다.", [
          {
            text: "확인",
            onPress: () => {
              setPasswords({
                currentPassword: "",
                newPassword: "",
                newPasswordConfirm: "",
              });
              onClose();
            },
          },
        ]);
      } else {
        Alert.alert(
          "오류",
          response.message || "비밀번호 변경에 실패했습니다."
        );
      }
    } catch (error: any) {
      console.error("비밀번호 변경 실패:", error);
      Alert.alert("오류", error.message || "비밀번호 변경에 실패했습니다.");
    } finally {
      setLoading(false);
    }
  };

  const handleClose = () => {
    setPasswords({
      currentPassword: "",
      newPassword: "",
      newPasswordConfirm: "",
    });
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
            <Text style={styles.navTitle}>비밀번호 변경</Text>
            <View style={styles.navBtn} />
          </View>

          <View style={styles.body}>
            <View style={styles.inputGroup}>
              <Text style={styles.label}>현재 비밀번호</Text>
              <View style={styles.passwordInputContainer}>
                <TextInput
                  style={styles.input}
                  value={passwords.currentPassword}
                  onChangeText={(text) => handleChange("currentPassword", text)}
                  placeholder="현재 비밀번호를 입력하세요"
                  placeholderTextColor="#999999"
                  secureTextEntry={!showPasswords.current}
                  autoCapitalize="none"
                />
                <TouchableOpacity
                  onPress={() =>
                    setShowPasswords((prev) => ({
                      ...prev,
                      current: !prev.current,
                    }))
                  }
                  style={styles.eyeIcon}
                >
                  <Icon
                    name={showPasswords.current ? "eye-off" : "eye"}
                    size={20}
                    color="#999999"
                  />
                </TouchableOpacity>
              </View>
            </View>

            <View style={styles.inputGroup}>
              <Text style={styles.label}>새 비밀번호</Text>
              <View style={styles.passwordInputContainer}>
                <TextInput
                  style={styles.input}
                  value={passwords.newPassword}
                  onChangeText={(text) => handleChange("newPassword", text)}
                  placeholder="숫자, 문자, 특수문자 포함 8자 이상"
                  placeholderTextColor="#999999"
                  secureTextEntry={!showPasswords.new}
                  autoCapitalize="none"
                />
                <TouchableOpacity
                  onPress={() =>
                    setShowPasswords((prev) => ({ ...prev, new: !prev.new }))
                  }
                  style={styles.eyeIcon}
                >
                  <Icon
                    name={showPasswords.new ? "eye-off" : "eye"}
                    size={20}
                    color="#999999"
                  />
                </TouchableOpacity>
              </View>
            </View>

            <View style={styles.inputGroup}>
              <Text style={styles.label}>새 비밀번호 확인</Text>
              <View style={styles.passwordInputContainer}>
                <TextInput
                  style={styles.input}
                  value={passwords.newPasswordConfirm}
                  onChangeText={(text) =>
                    handleChange("newPasswordConfirm", text)
                  }
                  placeholder="새 비밀번호를 다시 입력하세요"
                  placeholderTextColor="#999999"
                  secureTextEntry={!showPasswords.confirm}
                  autoCapitalize="none"
                />
                <TouchableOpacity
                  onPress={() =>
                    setShowPasswords((prev) => ({
                      ...prev,
                      confirm: !prev.confirm,
                    }))
                  }
                  style={styles.eyeIcon}
                >
                  <Icon
                    name={showPasswords.confirm ? "eye-off" : "eye"}
                    size={20}
                    color="#999999"
                  />
                </TouchableOpacity>
              </View>
            </View>

            <TouchableOpacity
              style={[styles.submitBtn, loading && styles.submitBtnDisabled]}
              onPress={handleSubmit}
              disabled={loading}
            >
              {loading ? (
                <ActivityIndicator size="small" color="#ffffff" />
              ) : (
                <Text style={styles.submitBtnText}>변경하기</Text>
              )}
            </TouchableOpacity>
          </View>
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
    paddingHorizontal: 20,
    paddingTop: 32,
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
  },
  eyeIcon: {
    padding: 12,
  },
  submitBtn: {
    height: 56,
    backgroundColor: "#8b5cf6",
    borderRadius: 12,
    justifyContent: "center",
    alignItems: "center",
    marginTop: 16,
  },
  submitBtnDisabled: {
    opacity: 0.6,
  },
  submitBtnText: {
    fontSize: 16,
    fontWeight: "600",
    color: "#ffffff",
  },
});

export default PasswordChangeModal;
