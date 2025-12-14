// src/components/DislikedFoodsModal.tsx
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
} from "react-native";
import { Ionicons as Icon } from "@expo/vector-icons";
import { LinearGradient } from "expo-linear-gradient";
import { userPreferencesAPI } from "../../services/userPreferencesAPI";
import type { ExclusionResponse } from "../../types";

const { width } = Dimensions.get("window");

interface DislikedFoodsModalProps {
  visible: boolean;
  onClose: () => void;
  userId: string; // [필수] API 호출을 위한 유저 ID (예: "ehdrb")
  onUpdate?: () => void; // 데이터 변경 시 부모에게 알림 (선택 사항)
}

const DislikedFoodsModal = ({
  visible,
  onClose,
  userId,
  onUpdate,
}: DislikedFoodsModalProps) => {
  // 데이터 구조 변경: 단순 string[] -> { id, food_name, reason }[]
  const [dislikedFoods, setDislikedFoods] = useState<ExclusionResponse[]>([]);
  const [inputValue, setInputValue] = useState("");

  // 로딩 상태 분리 (목록 로드 vs 작업 처리)
  const [initialLoading, setInitialLoading] = useState(false);
  const [processing, setProcessing] = useState(false);

  // 모달 열릴 때 목록 새로고침
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
    } catch (error: any) {
      console.error("Failed to load disliked foods", error);
      Alert.alert("오류", "금지 식단을 불러오는데 실패했습니다.");
    } finally {
      setInitialLoading(false);
    }
  };

  /**
   * 음식 추가 핸들러 (API 즉시 호출)
   */
  const handleAdd = async () => {
    const trimmed = inputValue.trim();

    if (!trimmed) {
      Alert.alert("알림", "음식 이름을 입력해주세요.");
      return;
    }

    // 중복 검사 (이름 기준)
    const isDuplicate = dislikedFoods.some(
      (item) => item.food_name === trimmed
    );
    if (isDuplicate) {
      Alert.alert("알림", "이미 목록에 있는 음식입니다.");
      return;
    }

    try {
      setProcessing(true);
      Keyboard.dismiss();

      // [API] 추가 요청
      const newFood = await userPreferencesAPI.addExclusions(userId, [trimmed]);

      // 목록 갱신
      setDislikedFoods((prev) => [...prev, newFood]);
      setInputValue("");

      if (onUpdate) onUpdate();
    } catch (error: any) {
      console.error("Add failed", error);
      Alert.alert("오류", "음식을 추가하지 못했습니다.");
    } finally {
      setProcessing(false);
    }
  };

  /**
   * 음식 삭제 핸들러 (API 즉시 호출)
   * @param id 삭제할 항목의 고유 ID
   * @param name 표시용 음식 이름
   */
  const handleRemove = (id: number, name: string) => {
    Alert.alert("삭제", `"${name}"을(를) 제외 목록에서 삭제하시겠습니까?`, [
      { text: "취소", style: "cancel" },
      {
        text: "삭제",
        style: "destructive",
        onPress: async () => {
          try {
            setProcessing(true);

            // [API] 삭제 요청 (ID 사용)
            await userPreferencesAPI.deleteExclusion(id);

            // 로컬 상태 업데이트
            setDislikedFoods((prev) => prev.filter((item) => item.id !== id));

            if (onUpdate) onUpdate();
          } catch (error: any) {
            console.error("Delete failed", error);
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
            <Text style={styles.headerTitle}>금지 식단 설정</Text>
            <View style={{ width: 28 }} />
          </View>

          {/* 안내 메시지 */}
          <View style={styles.infoBox}>
            <Icon name="information-circle" size={20} color="#4a90e2" />
            <Text style={styles.infoText}>
              추가된 음식은 즉시 서버에 저장되며 식단 추천에서 제외됩니다.
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
                    placeholder="예: 굴비, 오이"
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
                    (!inputValue.trim() || processing) && styles.addBtnDisabled,
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

            {/* 금지 식단 목록 */}
            <View style={{ flex: 1 }}>
              <Text style={styles.sectionTitle}>
                금지 식단 목록 ({dislikedFoods.length})
              </Text>

              {initialLoading ? (
                <View style={styles.centerState}>
                  <ActivityIndicator size="large" color="#a8e063" />
                </View>
              ) : (
                <ScrollView
                  showsVerticalScrollIndicator={false}
                  contentContainerStyle={styles.listContent}
                >
                  {dislikedFoods.length === 0 ? (
                    <View style={styles.emptyState}>
                      <Icon
                        name="restaurant-outline"
                        size={60}
                        color="#666666"
                      />
                      <Text style={styles.emptyText}>
                        아직 추가된 금지 식단이 없습니다.
                      </Text>
                    </View>
                  ) : (
                    <View style={styles.foodList}>
                      {dislikedFoods.map((item) => (
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
                                <Icon name="ban" size={18} color="#ef4444" />
                              </View>
                              {/* item.food_name 사용 */}
                              <Text style={styles.foodName}>
                                {item.food_name}
                              </Text>
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
                                color="#ef4444"
                              />
                            </TouchableOpacity>
                          </LinearGradient>
                        </View>
                      ))}
                    </View>
                  )}
                  {/* 하단 여백 */}
                  <View style={{ height: 100 }} />
                </ScrollView>
              )}
            </View>
          </View>

          {/* 닫기 버튼 (이제 '저장'이 아니라 단순 '닫기' 역할) */}
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
    alignItems: "center",
    backgroundColor: "#1e3a5f",
    padding: 16,
    marginHorizontal: 20,
    marginTop: 20,
    borderRadius: 12,
    gap: 12,
  },
  infoText: {
    flex: 1,
    fontSize: 14,
    color: "#ffffff",
    lineHeight: 20,
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
    backgroundColor: "rgba(239,68,68,0.1)",
    alignItems: "center",
    justifyContent: "center",
  },
  foodName: {
    fontSize: 15,
    fontWeight: "500",
    color: "#ffffff",
    flex: 1,
  },
  removeBtn: {
    padding: 4,
  },
  footer: {
    position: "absolute",
    bottom: 0,
    left: 0,
    right: 0,
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

export default DislikedFoodsModal;
