import React, { useState, useEffect } from "react";
import {
  View,
  Text,
  StyleSheet,
  ScrollView,
  TouchableOpacity,
  TextInput,
  Modal,
  Alert,
  ActivityIndicator,
  Dimensions,
  Keyboard,
  KeyboardAvoidingView,
  Platform,
} from "react-native";
import { Ionicons as Icon } from "@expo/vector-icons";
import { LinearGradient } from "expo-linear-gradient";
import { userPreferencesAPI } from "../../services/userPreferencesAPI";
import type { ExclusionResponse } from "../../types";

const { width } = Dimensions.get("window");

interface DislikedFoodsModalProps {
  visible: boolean;
  onClose: () => void;
  userId: string;
  onUpdate?: () => void;
}

const DislikedFoodsModal = ({
  visible,
  onClose,
  userId,
  onUpdate,
}: DislikedFoodsModalProps) => {
  const [dislikedFoods, setDislikedFoods] = useState<ExclusionResponse[]>([]);
  const [inputValue, setInputValue] = useState("");
  const [initialLoading, setInitialLoading] = useState(false);
  const [processing, setProcessing] = useState(false);

  useEffect(() => {
    if (visible && userId) {
      loadDislikedFoods();
    }
  }, [visible, userId]);

  const loadDislikedFoods = async () => {
    try {
      setInitialLoading(true);
      const foods = await userPreferencesAPI.getExclusions(userId);
      setDislikedFoods(foods);
    } catch (error) {
      Alert.alert("오류", "금지 식단을 불러오는데 실패했습니다.");
    } finally {
      setInitialLoading(false);
    }
  };

  const handleAdd = async () => {
    const trimmed = inputValue.trim();

    if (!trimmed) {
      Alert.alert("알림", "음식 이름을 입력해주세요.");
      return;
    }

    const foodsToAdd = trimmed
      .split(",")
      .map((food) => food.trim())
      .filter((food) => food.length > 0);

    if (foodsToAdd.length === 0) {
      Alert.alert("알림", "유효한 음식 이름을 입력해주세요.");
      return;
    }

    const duplicates = foodsToAdd.filter((newFood) =>
      dislikedFoods.some((item) => {
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

      // ✅ 여러 개를 하나씩 추가 (반복문 내부에서 처리)
      await userPreferencesAPI.addExclusions(userId, foodsToAdd);

      // 목록 새로고침
      await loadDislikedFoods();
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

  const handleRemove = (id: number, name: string) => {
    Alert.alert("삭제", `"${name}"을(를) 삭제하시겠습니까?`, [
      { text: "취소", style: "cancel" },
      {
        text: "삭제",
        style: "destructive",
        onPress: async () => {
          try {
            setProcessing(true);
            await userPreferencesAPI.deleteExclusion(id);
            setDislikedFoods((prev) => prev.filter((item) => item.id !== id));
            if (onUpdate) onUpdate();
          } catch {
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
      transparent
      animationType="slide"
      onRequestClose={onClose}
    >
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
                <Icon name="close" size={28} color="#fff" />
              </TouchableOpacity>
              <Text style={styles.headerTitle}>금지 식단 설정</Text>
              <View style={{ width: 28 }} />
            </View>

            {/* 안내 */}
            <View style={styles.infoBox}>
              <Text style={styles.infoText}>
                쉼표(,)로 여러 음식을 추가할 수 있습니다.{"\n"}
                예: 굴비, 다랑어, 오이
              </Text>
            </View>

            <View style={styles.content}>
              {/* 입력 */}
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
                      placeholder="예: 굴비, 다랑어, 오이"
                      placeholderTextColor="#666"
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
                        <ActivityIndicator size="small" color="#111" />
                      ) : (
                        <Icon name="add" size={28} color="#111" />
                      )}
                    </LinearGradient>
                  </TouchableOpacity>
                </View>
              </View>

              {/* 리스트 */}
              <ScrollView
                showsVerticalScrollIndicator={false}
                keyboardShouldPersistTaps="handled"
                contentContainerStyle={{ paddingBottom: 40 }}
              >
                {initialLoading ? (
                  <View style={styles.centerState}>
                    <ActivityIndicator size="large" color="#a8e063" />
                  </View>
                ) : dislikedFoods.length === 0 ? (
                  <View style={styles.emptyState}>
                    <Icon name="restaurant-outline" size={60} color="#666" />
                    <Text style={styles.emptyText}>
                      아직 추가된 금지 식단이 없습니다.
                    </Text>
                  </View>
                ) : (
                  dislikedFoods.map((item) => (
                    <View key={item.id} style={styles.foodItem}>
                      <LinearGradient
                        colors={[
                          "rgba(255,255,255,0.08)",
                          "rgba(255,255,255,0.04)",
                        ]}
                        style={styles.foodItemGradient}
                      >
                        <Text style={styles.foodName}>{item.food_name}</Text>
                        <TouchableOpacity
                          onPress={() => handleRemove(item.id, item.food_name)}
                        >
                          <Icon name="close-circle" size={24} color="#ef4444" />
                        </TouchableOpacity>
                      </LinearGradient>
                    </View>
                  ))
                )}
              </ScrollView>
            </View>

            {/* footer (absolute 제거됨) */}
            <View style={styles.footer}>
              <TouchableOpacity onPress={onClose}>
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
  overlay: { flex: 1 },
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
    padding: 20,
    borderBottomWidth: 1,
    borderBottomColor: "#333",
  },
  closeBtn: { padding: 4 },
  headerTitle: { fontSize: 20, fontWeight: "700", color: "#fff" },

  infoBox: {
    flexDirection: "row",
    padding: 16,
    margin: 20,
    backgroundColor: "#333333",
    borderRadius: 12,
    gap: 12,
  },
  infoText: { color: "#fff", fontSize: 13, lineHeight: 18 },

  content: { flex: 1, paddingHorizontal: 20 },

  inputSection: { marginBottom: 20 },
  sectionTitle: { color: "#fff", fontSize: 16, fontWeight: "700" },
  inputContainer: { flexDirection: "row", gap: 12 },
  inputWrapper: {
    flex: 1,
    flexDirection: "row",
    alignItems: "center",
    paddingHorizontal: 16,
    borderRadius: 12,
    borderWidth: 1,
    borderColor: "rgba(255,255,255,0.1)",
  },
  inputIcon: { marginRight: 12 },
  input: { flex: 1, height: 50, color: "#fff" },

  addBtn: { width: 56, height: 56, borderRadius: 12, overflow: "hidden" },
  addBtnDisabled: { opacity: 0.5 },
  addBtnGradient: {
    flex: 1,
    alignItems: "center",
    justifyContent: "center",
  },

  foodItem: { marginBottom: 12 },
  foodItemGradient: {
    flexDirection: "row",
    justifyContent: "space-between",
    alignItems: "center",
    padding: 16,
    borderRadius: 12,
  },
  foodName: { color: "#fff", fontSize: 15, flex: 1 },

  emptyState: { alignItems: "center", marginTop: 40 },
  emptyText: { color: "#999", marginTop: 16 },

  centerState: { marginTop: 40 },

  footer: {
    padding: 20,
    borderTopWidth: 1,
    borderTopColor: "#333",
  },
  saveBtnGradient: {
    paddingVertical: 16,
    borderRadius: 12,
    alignItems: "center",
  },
  saveBtnText: { fontSize: 16, fontWeight: "700", color: "#111" },
});

export default DislikedFoodsModal;
