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
} from "react-native";
import { Ionicons as Icon } from "@expo/vector-icons";
import { LinearGradient } from "expo-linear-gradient";
import { userPreferencesAPI } from "../../services/userPreferencesAPI";

const { width } = Dimensions.get("window");

interface DislikedFoodsModalProps {
  visible: boolean;
  onClose: () => void;
  onSave?: (foods: string[]) => void;
}

const DislikedFoodsModal = ({
  visible,
  onClose,
  onSave,
}: DislikedFoodsModalProps) => {
  const [dislikedFoods, setDislikedFoods] = useState<string[]>([]);
  const [originalFoods, setOriginalFoods] = useState<string[]>([]);
  const [inputValue, setInputValue] = useState("");
  const [loading, setLoading] = useState(false);
  const [hasChanges, setHasChanges] = useState(false);

  // 모달이 열릴 때 데이터 로드
  useEffect(() => {
    if (visible) {
      loadDislikedFoods();
    }
  }, [visible]);

  // 변경사항 감지
  useEffect(() => {
    const changed =
      JSON.stringify(dislikedFoods.sort()) !==
      JSON.stringify(originalFoods.sort());
    setHasChanges(changed);
  }, [dislikedFoods, originalFoods]);

  const loadDislikedFoods = async () => {
    try {
      setLoading(true);
      const foods = await userPreferencesAPI.getDislikedFoods();
      setDislikedFoods(foods);
      setOriginalFoods(foods);
      setHasChanges(false);
    } catch (error: any) {
      console.error("Failed to load disliked foods", error);
      Alert.alert("오류", "금지 식단을 불러오는데 실패했습니다.");
    } finally {
      setLoading(false);
    }
  };

  const handleAdd = () => {
    const trimmed = inputValue.trim();

    if (!trimmed) {
      Alert.alert("알림", "음식 이름을 입력해주세요.");
      return;
    }

    if (dislikedFoods.includes(trimmed)) {
      Alert.alert("알림", "이미 추가된 음식입니다.");
      return;
    }

    setDislikedFoods((prev) => [...prev, trimmed]);
    setInputValue("");
  };

  const handleRemove = (food: string) => {
    Alert.alert("삭제", `"${food}"를 삭제하시겠습니까?`, [
      { text: "취소", style: "cancel" },
      {
        text: "삭제",
        style: "destructive",
        onPress: () => {
          setDislikedFoods((prev) => prev.filter((f) => f !== food));
        },
      },
    ]);
  };

  const handleSave = async () => {
    try {
      setLoading(true);

      await userPreferencesAPI.saveDislikedFoods(dislikedFoods);

      Alert.alert("성공", "금지 식단이 저장되었습니다.");
      setOriginalFoods(dislikedFoods);
      setHasChanges(false);

      if (onSave) {
        onSave(dislikedFoods);
      }

      onClose();
    } catch (error: any) {
      console.error("Failed to save disliked foods", error);
      Alert.alert("오류", error.message || "저장에 실패했습니다.");
    } finally {
      setLoading(false);
    }
  };

  const handleClose = () => {
    if (hasChanges) {
      Alert.alert(
        "변경사항",
        "저장하지 않은 변경사항이 있습니다. 나가시겠습니까?",
        [
          { text: "취소", style: "cancel" },
          {
            text: "나가기",
            style: "destructive",
            onPress: () => {
              setDislikedFoods(originalFoods);
              setInputValue("");
              setHasChanges(false);
              onClose();
            },
          },
        ]
      );
    } else {
      onClose();
    }
  };

  return (
    <Modal
      visible={visible}
      transparent={true}
      animationType="slide"
      onRequestClose={handleClose}
    >
      <View style={styles.overlay}>
        <LinearGradient
          colors={["rgba(0,0,0,0.95)", "rgba(17,24,39,0.95)"]}
          style={StyleSheet.absoluteFill}
        />

        <View style={styles.container}>
          {/* 헤더 */}
          <View style={styles.header}>
            <TouchableOpacity onPress={handleClose} style={styles.closeBtn}>
              <Icon name="close" size={28} color="#ffffff" />
            </TouchableOpacity>
            <Text style={styles.headerTitle}>금지 식단 설정</Text>
            <View style={{ width: 28 }} />
          </View>

          {/* 안내 메시지 */}
          <View style={styles.infoBox}>
            <Icon name="information-circle" size={20} color="#4a90e2" />
            <Text style={styles.infoText}>
              알레르기나 선호하지 않는 음식을 추가하면 식단 추천에서 제외됩니다.
            </Text>
          </View>

          <ScrollView
            style={styles.content}
            showsVerticalScrollIndicator={false}
          >
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
                    placeholder="예: 땅콩, 우유, 새우"
                    placeholderTextColor="#666666"
                    value={inputValue}
                    onChangeText={setInputValue}
                    onSubmitEditing={handleAdd}
                    returnKeyType="done"
                  />
                </LinearGradient>
                <TouchableOpacity
                  style={[
                    styles.addBtn,
                    !inputValue.trim() && styles.addBtnDisabled,
                  ]}
                  onPress={handleAdd}
                  disabled={!inputValue.trim()}
                >
                  <LinearGradient
                    colors={["#e3ff7c", "#a8e063"]}
                    style={styles.addBtnGradient}
                  >
                    <Icon name="add" size={28} color="#111111" />
                  </LinearGradient>
                </TouchableOpacity>
              </View>
            </View>

            {/* 금지 식단 목록 */}
            <View style={styles.listSection}>
              <Text style={styles.sectionTitle}>
                금지 식단 목록 ({dislikedFoods.length})
              </Text>

              {dislikedFoods.length === 0 ? (
                <View style={styles.emptyState}>
                  <Icon name="restaurant-outline" size={60} color="#666666" />
                  <Text style={styles.emptyText}>
                    아직 추가된 금지 식단이 없습니다.
                  </Text>
                  <Text style={styles.emptySubtext}>
                    위에서 음식을 추가해보세요.
                  </Text>
                </View>
              ) : (
                <View style={styles.foodList}>
                  {dislikedFoods.map((food, index) => (
                    <View key={index} style={styles.foodItem}>
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
                          <Text style={styles.foodName}>{food}</Text>
                        </View>
                        <TouchableOpacity
                          onPress={() => handleRemove(food)}
                          style={styles.removeBtn}
                        >
                          <Icon name="close-circle" size={24} color="#ef4444" />
                        </TouchableOpacity>
                      </LinearGradient>
                    </View>
                  ))}
                </View>
              )}
            </View>
          </ScrollView>

          {/* 저장 버튼 */}
          <View style={styles.footer}>
            <TouchableOpacity
              style={[
                styles.saveBtn,
                (!hasChanges || loading) && styles.saveBtnDisabled,
              ]}
              onPress={handleSave}
              disabled={!hasChanges || loading}
            >
              <LinearGradient
                colors={["#e3ff7c", "#a8e063"]}
                style={styles.saveBtnGradient}
              >
                {loading ? (
                  <ActivityIndicator size="small" color="#111111" />
                ) : (
                  <>
                    <Icon name="checkmark" size={24} color="#111111" />
                    <Text style={styles.saveBtnText}>
                      {hasChanges ? "저장하기" : "저장됨"}
                    </Text>
                  </>
                )}
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
    marginBottom: 32,
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
  listSection: {
    marginBottom: 100,
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
  emptySubtext: {
    fontSize: 14,
    color: "#666666",
    textAlign: "center",
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
  saveBtnDisabled: {
    opacity: 0.5,
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
