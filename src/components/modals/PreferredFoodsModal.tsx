// src/components/modals/PreferredFoodsModal.tsx
import React, { useState, useEffect } from "react";
import {
  View,
  Text,
  StyleSheet,
  Modal,
  TouchableOpacity,
  ScrollView,
  TextInput,
  Alert,
  ActivityIndicator,
  Keyboard,
  KeyboardAvoidingView,
  Platform,
} from "react-native";
import { Ionicons as Icon } from "@expo/vector-icons";
import { LinearGradient } from "expo-linear-gradient";
import { userPreferencesAPI } from "../../services/userPreferencesAPI";
import type { PreferenceResponse } from "../../types";

interface PreferredFoodsModalProps {
  visible: boolean;
  userId: string;
  onClose: () => void;
  onUpdate: () => void;
}

const PreferredFoodsModal: React.FC<PreferredFoodsModalProps> = ({
  visible,
  userId,
  onClose,
  onUpdate,
}) => {
  const [preferences, setPreferences] = useState<PreferenceResponse[]>([]);
  const [inputValue, setInputValue] = useState("");
  const [initialLoading, setInitialLoading] = useState(false);
  const [processing, setProcessing] = useState(false);

  useEffect(() => {
    if (visible && userId) {
      loadPreferences();
    }
  }, [visible, userId]);

  /**
   * 선호 식단 목록 불러오기
   */
  const loadPreferences = async () => {
    try {
      setInitialLoading(true);
      const data = await userPreferencesAPI.getPreferences(userId);
      setPreferences(data);
    } catch (error: any) {
      console.error("선호 음식 로드 실패:", error);
      Alert.alert("오류", "선호 식단을 불러오는데 실패했습니다.");
    } finally {
      setInitialLoading(false);
    }
  };

  /**
   * 음식 추가 핸들러
   * - 쉼표로 구분된 여러 음식을 한 번에 입력 가능
   */
  const handleAdd = async () => {
    const trimmed = inputValue.trim();

    if (!trimmed) {
      Alert.alert("알림", "음식 이름을 입력해주세요.");
      return;
    }

    // 쉼표로 구분하여 배열로 변환
    const foodsToAdd = trimmed
      .split(",")
      .map((food) => food.trim())
      .filter((food) => food.length > 0);

    if (foodsToAdd.length === 0) {
      Alert.alert("알림", "유효한 음식 이름을 입력해주세요.");
      return;
    }

    // 중복 검사
    const duplicates = foodsToAdd.filter((newFood) =>
      preferences.some((item) => {
        const existingFoods = item.food_name.split(",").map((f) => f.trim());
        return existingFoods.includes(newFood);
      })
    );

    if (duplicates.length > 0) {
      Alert.alert(
        "알림",
        `이미 목록에 있는 음식입니다: ${duplicates.join(", ")}`
      );
      return;
    }

    try {
      setProcessing(true);
      Keyboard.dismiss();

      await userPreferencesAPI.addPreferences(userId, foodsToAdd);

      // 목록 새로고침
      await loadPreferences();
      setInputValue("");

      Alert.alert("완료", `${foodsToAdd.join(", ")}이(가) 추가되었습니다.`);

      if (onUpdate) onUpdate();
    } catch (error: any) {
      console.error("음식 추가 실패:", error);
      Alert.alert("오류", "음식을 추가하지 못했습니다.");
    } finally {
      setProcessing(false);
    }
  };

  /**
   * 음식 삭제 핸들러
   */
  const handleRemove = (id: number, name: string) => {
    Alert.alert("삭제", `"${name}"을(를) 선호 목록에서 삭제하시겠습니까?`, [
      { text: "취소", style: "cancel" },
      {
        text: "삭제",
        style: "destructive",
        onPress: async () => {
          try {
            setProcessing(true);

            await userPreferencesAPI.deletePreference(id);

            // 로컬 상태 업데이트
            setPreferences((prev) => prev.filter((item) => item.id !== id));

            Alert.alert("완료", "삭제되었습니다.");

            if (onUpdate) onUpdate();
          } catch (error: any) {
            console.error("삭제 실패:", error);
            Alert.alert("오류", "삭제에 실패했습니다.");
          } finally {
            setProcessing(false);
          }
        },
      },
    ]);
  };

  return (
    <Modal
      visible={visible}
      transparent={true}
      animationType="slide"
      onRequestClose={onClose}
    >
      {/* ✅ KeyboardAvoidingView 추가 */}
      <KeyboardAvoidingView
        style={{ flex: 1 }}
        behavior={Platform.OS === "ios" ? "padding" : "height"}
        keyboardVerticalOffset={Platform.OS === "ios" ? 80 : 0}
      >
        <View style={styles.overlay}>
          <LinearGradient
            colors={["rgba(0,0,0,0.95)", "rgba(17,24,39,0.95)"]}
            style={StyleSheet.absoluteFill}
          />

          <View style={styles.container}>
            {/* 헤더 */}
            <View style={styles.header}>
              <TouchableOpacity onPress={onClose} style={styles.closeBtn}>
                <Icon name="close" size={28} color="#ffffff" />
              </TouchableOpacity>
              <Text style={styles.headerTitle}>선호 식단 설정</Text>
              <View style={{ width: 28 }} />
            </View>

            {/* 안내 메시지 */}
            <View style={styles.infoBox}>
              <Text style={styles.infoText}>
                쉼표(,)로 구분하여 여러 음식을 한 번에 추가할 수 있습니다.
                {"\n"}
                예: 닭가슴살, 고구마, 브로콜리
              </Text>
            </View>

            <View style={styles.content}>
              {/* 입력 필드 */}
              <View style={styles.inputSection}>
                <Text style={styles.sectionTitle}>음식 추가</Text>
                <View style={styles.inputContainer}>
                  <LinearGradient
                    colors={["rgba(255,255,255,0.1)", "rgba(255,255,255,0.05)"]}
                    style={styles.inputWrapper}
                  >
                    <Icon
                      name="search"
                      size={20}
                      color="#6b7280"
                      style={styles.inputIcon}
                    />
                    <TextInput
                      style={styles.input}
                      placeholder="예: 닭가슴살, 고구마, 브로콜리"
                      placeholderTextColor="#666666"
                      value={inputValue}
                      onChangeText={setInputValue}
                      onSubmitEditing={handleAdd}
                      returnKeyType="done"
                      editable={!processing}
                    />
                  </LinearGradient>
                  <TouchableOpacity
                    style={[
                      styles.addBtn,
                      (!inputValue.trim() || processing) &&
                        styles.addBtnDisabled,
                    ]}
                    onPress={handleAdd}
                    disabled={!inputValue.trim() || processing}
                  >
                    <LinearGradient
                      colors={["#e3ff7c", "#a8e063"]}
                      style={styles.addBtnGradient}
                    >
                      {processing ? (
                        <ActivityIndicator size="small" color="#111111" />
                      ) : (
                        <Icon name="add" size={28} color="#111111" />
                      )}
                    </LinearGradient>
                  </TouchableOpacity>
                </View>
              </View>

              {/* 선호 식단 목록 */}
              <View style={{ flex: 1 }}>
                <Text style={styles.sectionTitle}>
                  선호 식단 목록 ({preferences.length})
                </Text>

                {initialLoading ? (
                  <View style={styles.centerState}>
                    <ActivityIndicator size="large" color="#e3ff7c" />
                  </View>
                ) : (
                  <ScrollView
                    showsVerticalScrollIndicator={false}
                    contentContainerStyle={styles.listContent}
                    keyboardShouldPersistTaps="handled"
                  >
                    {preferences.length === 0 ? (
                      <View style={styles.emptyState}>
                        <Icon name="heart-outline" size={60} color="#666666" />
                        <Text style={styles.emptyText}>
                          아직 추가된 선호 식단이 없습니다.
                        </Text>
                        <Text style={styles.emptySubText}>
                          위 입력창에서 원하는 음식을 추가해보세요.
                        </Text>
                      </View>
                    ) : (
                      <View style={styles.foodList}>
                        {preferences.map((item) => (
                          <View key={item.id} style={styles.foodItem}>
                            <LinearGradient
                              colors={[
                                "rgba(255,255,255,0.08)",
                                "rgba(255,255,255,0.04)",
                              ]}
                              style={styles.foodItemGradient}
                            >
                              <View style={styles.foodItemLeft}>
                                <View style={styles.foodItemIcon}>
                                  <Icon
                                    name="heart"
                                    size={18}
                                    color="#e3ff7c"
                                  />
                                </View>
                                <View style={styles.foodItemTextContainer}>
                                  <Text style={styles.foodName}>
                                    {item.food_name}
                                  </Text>
                                  <Text style={styles.foodSource}>
                                    {item.source === "manual"
                                      ? "직접 추가"
                                      : "AI 추천"}
                                  </Text>
                                </View>
                              </View>

                              <TouchableOpacity
                                onPress={() =>
                                  handleRemove(item.id, item.food_name)
                                }
                                style={styles.removeBtn}
                                disabled={processing}
                              >
                                <Icon
                                  name="close-circle"
                                  size={24}
                                  color="#e3ff7c"
                                />
                              </TouchableOpacity>
                            </LinearGradient>
                          </View>
                        ))}
                      </View>
                    )}
                    {/* ✅ 하단 여백 추가 */}
                    <View style={{ height: 100 }} />
                  </ScrollView>
                )}
              </View>
            </View>

            {/* 닫기 버튼 - ✅ absolute 제거 */}
            <View style={styles.footer}>
              <TouchableOpacity style={styles.saveBtn} onPress={onClose}>
                <LinearGradient
                  colors={["#e3ff7c", "#a8e063"]}
                  style={styles.saveBtnGradient}
                >
                  <Text style={styles.saveBtnText}>닫기</Text>
                </LinearGradient>
              </TouchableOpacity>
            </View>
          </View>
        </View>
      </KeyboardAvoidingView>
    </Modal>
  );
};

const styles = StyleSheet.create({
  overlay: {
    flex: 1,
  },
  container: {
    flex: 1,
    marginTop: 50,
    backgroundColor: "#1a1a1a",
    borderTopLeftRadius: 24,
    borderTopRightRadius: 24,
  },
  header: {
    flexDirection: "row",
    justifyContent: "space-between",
    alignItems: "center",
    paddingVertical: 20,
    paddingHorizontal: 20,
    borderBottomWidth: 1,
    borderBottomColor: "#333333",
  },
  closeBtn: {
    padding: 4,
  },
  headerTitle: {
    fontSize: 20,
    fontWeight: "700",
    color: "#ffffff",
  },
  infoBox: {
    flexDirection: "row",
    alignItems: "flex-start",
    backgroundColor: "#333333",
    padding: 16,
    marginHorizontal: 20,
    marginTop: 20,
    borderRadius: 12,
    gap: 12,
  },
  infoText: {
    flex: 1,
    fontSize: 13,
    color: "#ffffff",
    lineHeight: 18,
  },
  content: {
    flex: 1,
    paddingHorizontal: 20,
    paddingTop: 20,
  },
  inputSection: {
    marginBottom: 24,
  },
  sectionTitle: {
    fontSize: 16,
    fontWeight: "700",
    color: "#ffffff",
    marginBottom: 12,
  },
  inputContainer: {
    flexDirection: "row",
    gap: 12,
  },
  inputWrapper: {
    flex: 1,
    flexDirection: "row",
    alignItems: "center",
    paddingHorizontal: 16,
    borderRadius: 12,
    borderWidth: 1,
    borderColor: "rgba(255,255,255,0.1)",
  },
  inputIcon: {
    marginRight: 12,
  },
  input: {
    flex: 1,
    height: 50,
    fontSize: 15,
    color: "#ffffff",
  },
  addBtn: {
    width: 56,
    height: 56,
    borderRadius: 12,
    overflow: "hidden",
  },
  addBtnDisabled: {
    opacity: 0.5,
  },
  addBtnGradient: {
    width: "100%",
    height: "100%",
    alignItems: "center",
    justifyContent: "center",
  },
  centerState: {
    flex: 1,
    justifyContent: "center",
    alignItems: "center",
    marginTop: 40,
  },
  emptyState: {
    alignItems: "center",
    paddingVertical: 40,
    paddingHorizontal: 20,
  },
  emptyText: {
    fontSize: 16,
    color: "#999999",
    textAlign: "center",
    marginTop: 16,
    marginBottom: 8,
  },
  emptySubText: {
    fontSize: 14,
    color: "#666666",
    textAlign: "center",
  },
  listContent: {
    paddingBottom: 20,
  },
  foodList: {
    gap: 12,
  },
  foodItem: {
    borderRadius: 12,
    overflow: "hidden",
  },
  foodItemGradient: {
    flexDirection: "row",
    justifyContent: "space-between",
    alignItems: "center",
    paddingVertical: 14,
    paddingHorizontal: 16,
    borderWidth: 1,
    borderColor: "rgba(255,255,255,0.1)",
    borderRadius: 12,
  },
  foodItemLeft: {
    flexDirection: "row",
    alignItems: "center",
    flex: 1,
    gap: 12,
  },
  foodItemIcon: {
    width: 36,
    height: 36,
    borderRadius: 18,
    backgroundColor: "rgba(186, 228, 0, 0.2)",
    alignItems: "center",
    justifyContent: "center",
  },
  foodItemTextContainer: {
    flex: 1,
  },
  foodName: {
    fontSize: 15,
    fontWeight: "600",
    color: "#ffffff",
    marginBottom: 2,
  },
  foodSource: {
    fontSize: 12,
    color: "#6b7280",
  },
  removeBtn: {
    padding: 4,
  },
  footer: {
    // ✅ position: "absolute" 제거됨
    padding: 20,
    backgroundColor: "#1a1a1a",
    borderTopWidth: 1,
    borderTopColor: "#333333",
  },
  saveBtn: {
    borderRadius: 12,
    overflow: "hidden",
  },
  saveBtnGradient: {
    flexDirection: "row",
    justifyContent: "center",
    alignItems: "center",
    paddingVertical: 16,
    gap: 8,
  },
  saveBtnText: {
    fontSize: 16,
    fontWeight: "700",
    color: "#111111",
  },
});

export default PreferredFoodsModal;
