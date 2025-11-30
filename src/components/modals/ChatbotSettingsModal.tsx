import React, { useState } from "react";
import {
  View,
  Text,
  TouchableOpacity,
  StyleSheet,
  Modal,
  ScrollView,
} from "react-native";
import { Ionicons as Icon } from "@expo/vector-icons";

interface ChatbotSettingsModalProps {
  isOpen: boolean;
  onClose: () => void;
  currentMode: "auto" | "exercise" | "nutrition";
  currentStyle: "pro" | "friend" | "soft" | "drill";
  onSave: (mode: string, style: string) => void;
}

const ChatbotSettingsModal: React.FC<ChatbotSettingsModalProps> = ({
  isOpen,
  onClose,
  currentMode,
  currentStyle,
  onSave,
}) => {
  const [selectedMode, setSelectedMode] = useState(currentMode);
  const [selectedStyle, setSelectedStyle] = useState(currentStyle);

  const modes = [
    {
      value: "auto",
      label: "자동",
      icon: "sparkles",
      description: "상황에 맞춰 자동으로 답변",
    },
    {
      value: "exercise",
      label: "운동",
      icon: "barbell",
      description: "운동 관련 전문 답변",
    },
    {
      value: "nutrition",
      label: "영양",
      icon: "nutrition",
      description: "식단/영양 전문 답변",
    },
  ];

  const styles_data = [
    {
      value: "pro",
      label: "프로페셔널",
      icon: "briefcase",
      description: "전문적이고 체계적인 톤",
    },
    {
      value: "friend",
      label: "친근한 친구",
      icon: "happy",
      description: "편안하고 친근한 톤",
    },
    {
      value: "soft",
      label: "부드럽게",
      icon: "heart",
      description: "따뜻하고 격려하는 톤",
    },
    {
      value: "drill",
      label: "엄격한 코치",
      icon: "fitness",
      description: "강력하고 동기부여하는 톤",
    },
  ];

  const handleSave = () => {
    onSave(selectedMode, selectedStyle);
    onClose();
  };

  return (
    <Modal
      visible={isOpen}
      transparent
      animationType="slide"
      onRequestClose={onClose}
    >
      <View style={styles.overlay}>
        <View style={styles.modalContainer}>
          {/* 헤더 */}
          <View style={styles.header}>
            <Text style={styles.title}>채팅 설정</Text>
            <TouchableOpacity onPress={onClose}>
              <Icon name="close" size={24} color={NEW_COLORS.text} />
            </TouchableOpacity>
          </View>

          <ScrollView
            style={styles.content}
            showsVerticalScrollIndicator={false}
          >
            {/* 카테고리 섹션 */}
            <View style={styles.section}>
              <Text style={styles.sectionTitle}>📂 카테고리</Text>
              <Text style={styles.sectionSubtitle}>
                어떤 주제로 대화할까요?
              </Text>

              {modes.map((mode) => (
                <TouchableOpacity
                  key={mode.value}
                  style={[
                    styles.optionCard,
                    selectedMode === mode.value && styles.optionCardSelected,
                  ]}
                  onPress={() => setSelectedMode(mode.value as any)}
                >
                  <View style={styles.optionHeader}>
                    <Icon
                      name={mode.icon as any}
                      size={24}
                      color={
                        selectedMode === mode.value
                          ? NEW_COLORS.accent
                          : NEW_COLORS.text_secondary
                      }
                    />
                    <Text
                      style={[
                        styles.optionLabel,
                        selectedMode === mode.value &&
                          styles.optionLabelSelected,
                      ]}
                    >
                      {mode.label}
                    </Text>
                    {selectedMode === mode.value && (
                      <Icon
                        name="checkmark-circle"
                        size={20}
                        color={NEW_COLORS.accent}
                      />
                    )}
                  </View>
                  <Text style={styles.optionDescription}>
                    {mode.description}
                  </Text>
                </TouchableOpacity>
              ))}
            </View>

            {/* 대화 스타일 섹션 */}
            <View style={styles.section}>
              <Text style={styles.sectionTitle}>💬 대화 스타일</Text>
              <Text style={styles.sectionSubtitle}>
                어떤 톤으로 대화할까요?
              </Text>

              <View style={styles.styleGrid}>
                {styles_data.map((style) => (
                  <TouchableOpacity
                    key={style.value}
                    style={[
                      styles.styleCard,
                      selectedStyle === style.value && styles.styleCardSelected,
                    ]}
                    onPress={() => setSelectedStyle(style.value as any)}
                  >
                    <Icon
                      name={style.icon as any}
                      size={32}
                      color={
                        selectedStyle === style.value
                          ? NEW_COLORS.accent
                          : NEW_COLORS.text_secondary
                      }
                    />
                    <Text
                      style={[
                        styles.styleLabel,
                        selectedStyle === style.value &&
                          styles.styleLabelSelected,
                      ]}
                    >
                      {style.label}
                    </Text>
                    <Text style={styles.styleDescription}>
                      {style.description}
                    </Text>
                  </TouchableOpacity>
                ))}
              </View>
            </View>
          </ScrollView>

          {/* 버튼 */}
          <View style={styles.footer}>
            <TouchableOpacity style={styles.cancelButton} onPress={onClose}>
              <Text style={styles.cancelButtonText}>취소</Text>
            </TouchableOpacity>
            <TouchableOpacity style={styles.saveButton} onPress={handleSave}>
              <Text style={styles.saveButtonText}>적용하기</Text>
            </TouchableOpacity>
          </View>
        </View>
      </View>
    </Modal>
  );
};

// ✅ NEW_COLORS 추가
const NEW_COLORS = {
  background: "#1a1a1a",
  text: "#f0f0f0",
  text_secondary: "#a0a0a0",
  accent: "#e3ff7c",
  card_bg: "#252525",
  separator: "#3a3a3a",
  delete_color: "#ff6b6b",
};

const styles = StyleSheet.create({
  overlay: {
    flex: 1,
    backgroundColor: "rgba(0, 0, 0, 0.5)",
    justifyContent: "flex-end",
  },
  modalContainer: {
    backgroundColor: NEW_COLORS.background,
    borderTopLeftRadius: 20,
    borderTopRightRadius: 20,
    maxHeight: "90%",
  },
  header: {
    flexDirection: "row",
    justifyContent: "space-between",
    alignItems: "center",
    padding: 20,
    borderBottomWidth: 1,
    borderBottomColor: NEW_COLORS.separator,
  },
  title: {
    fontSize: 20,
    fontWeight: "bold",
    color: NEW_COLORS.text,
  },
  content: {
    padding: 20,
  },
  section: {
    marginBottom: 32,
  },
  sectionTitle: {
    fontSize: 18,
    fontWeight: "600",
    color: NEW_COLORS.text,
    marginBottom: 4,
  },
  sectionSubtitle: {
    fontSize: 14,
    color: NEW_COLORS.text_secondary,
    marginBottom: 16,
  },
  optionCard: {
    backgroundColor: NEW_COLORS.card_bg,
    borderRadius: 12,
    padding: 16,
    marginBottom: 12,
    borderWidth: 2,
    borderColor: "transparent",
  },
  optionCardSelected: {
    borderColor: NEW_COLORS.accent,
    backgroundColor: `${NEW_COLORS.accent}15`,
  },
  optionHeader: {
    flexDirection: "row",
    alignItems: "center",
    gap: 12,
    marginBottom: 8,
  },
  optionLabel: {
    flex: 1,
    fontSize: 16,
    fontWeight: "600",
    color: NEW_COLORS.text,
  },
  optionLabelSelected: {
    color: NEW_COLORS.accent,
  },
  optionDescription: {
    fontSize: 13,
    color: NEW_COLORS.text_secondary,
    marginLeft: 36,
  },
  styleGrid: {
    flexDirection: "row",
    flexWrap: "wrap",
    gap: 12,
  },
  styleCard: {
    width: "48%",
    backgroundColor: NEW_COLORS.card_bg,
    borderRadius: 12,
    padding: 16,
    alignItems: "center",
    borderWidth: 2,
    borderColor: "transparent",
  },
  styleCardSelected: {
    borderColor: NEW_COLORS.accent,
    backgroundColor: `${NEW_COLORS.accent}15`,
  },
  styleLabel: {
    fontSize: 14,
    fontWeight: "600",
    color: NEW_COLORS.text,
    marginTop: 8,
    marginBottom: 4,
  },
  styleLabelSelected: {
    color: NEW_COLORS.accent,
  },
  styleDescription: {
    fontSize: 11,
    color: NEW_COLORS.text_secondary,
    textAlign: "center",
  },
  footer: {
    flexDirection: "row",
    padding: 20,
    gap: 12,
    borderTopWidth: 1,
    borderTopColor: NEW_COLORS.separator,
  },
  cancelButton: {
    flex: 1,
    paddingVertical: 14,
    borderRadius: 12,
    backgroundColor: NEW_COLORS.card_bg,
    alignItems: "center",
  },
  cancelButtonText: {
    fontSize: 16,
    fontWeight: "600",
    color: NEW_COLORS.text,
  },
  saveButton: {
    flex: 1,
    paddingVertical: 14,
    borderRadius: 12,
    backgroundColor: NEW_COLORS.accent,
    alignItems: "center",
  },
  saveButtonText: {
    fontSize: 16,
    fontWeight: "600",
    color: "#000000",
  },
});

export default ChatbotSettingsModal;
