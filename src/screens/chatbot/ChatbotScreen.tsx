import React, { useState, useEffect } from "react";
import {
  View,
  Text,
  TextInput,
  TouchableOpacity,
  StyleSheet,
  ScrollView,
  KeyboardAvoidingView,
  Platform,
  Alert,
} from "react-native";
import { SafeAreaView } from "react-native-safe-area-context";
import { Ionicons as Icon } from "@expo/vector-icons";
import AsyncStorage from "@react-native-async-storage/async-storage";
import { authAPI } from "../../services";
import { chatAPI } from "../../services/chatAPI";
import ChatbotSettingsModal from "../../components/modals/ChatbotSettingsModal";

interface Message {
  type: "user" | "bot";
  text: string;
}

const ChatbotScreen = ({ navigation }: any) => {
  const [messages, setMessages] = useState<Message[]>([]);
  const [inputValue, setInputValue] = useState("");
  const [isLoading, setIsLoading] = useState(false);
  const [userId, setUserId] = useState<number>(0);

  // ✅ 설정 상태
  const [chatMode, setChatMode] = useState<"auto" | "exercise" | "nutrition">(
    "auto"
  );
  const [coachStyle, setCoachStyle] = useState<
    "pro" | "friend" | "soft" | "drill"
  >("friend");
  const [isSettingsModalOpen, setIsSettingsModalOpen] = useState(false);

  useEffect(() => {
    loadSettings();
    loadUserId();
  }, []);

  // ✅ 설정 로드
  const loadSettings = async () => {
    try {
      const savedMode = await AsyncStorage.getItem("chatbot_mode");
      const savedStyle = await AsyncStorage.getItem("chatbot_style");

      if (savedMode) setChatMode(savedMode as any);
      if (savedStyle) setCoachStyle(savedStyle as any);

      console.log("✅ 챗봇 설정 로드:", { mode: savedMode, style: savedStyle });
    } catch (error) {
      console.error("설정 로드 실패:", error);
    }
  };

  const loadUserId = async () => {
    try {
      const profile = await authAPI.getProfile();
      setUserId(profile.id);
      console.log("✅ 사용자 ID 로드:", profile.id);
    } catch (error) {
      console.error("❌ 프로필 로드 실패:", error);
      Alert.alert("오류", "사용자 정보를 불러올 수 없습니다.", [
        { text: "확인", onPress: () => navigation.goBack() },
      ]);
    }
  };

  // ✅ 설정 저장 핸들러
  const handleSaveSettings = async (mode: string, style: string) => {
    try {
      await AsyncStorage.setItem("chatbot_mode", mode);
      await AsyncStorage.setItem("chatbot_style", style);

      setChatMode(mode as any);
      setCoachStyle(style as any);

      console.log("✅ 챗봇 설정 저장:", { mode, style });

      // 설정 변경 알림 메시지
      const modeText =
        mode === "auto" ? "자동" : mode === "exercise" ? "운동" : "영양";
      const styleText =
        style === "pro"
          ? "프로페셔널"
          : style === "friend"
          ? "친근한 친구"
          : style === "soft"
          ? "부드럽게"
          : "엄격한 코치";

      setMessages((prev) => [
        ...prev,
        {
          type: "bot",
          text: `설정이 변경되었습니다!\n카테고리: ${modeText}\n스타일: ${styleText}`,
        },
      ]);
    } catch (error) {
      console.error("설정 저장 실패:", error);
    }
  };

  const handleSend = async () => {
    if (inputValue.trim() === "" || !userId) return;

    const userMessage = inputValue.trim();
    setInputValue("");
    setMessages((prev) => [...prev, { type: "user", text: userMessage }]);
    setIsLoading(true);

    try {
      // ✅ mode와 coach_style을 API에 전달
      const botResponse = await chatAPI.sendMessage(
        userId,
        userMessage,
        chatMode,
        coachStyle
      );
      setMessages((prev) => [...prev, { type: "bot", text: botResponse }]);
    } catch (error: any) {
      console.error("메시지 전송 에러:", error);

      let errorMessage = "죄송합니다. 오류가 발생했습니다.";
      if (error.message) {
        errorMessage = error.message;
      }

      setMessages((prev) => [...prev, { type: "bot", text: errorMessage }]);

      if (
        error.message?.includes("로그인") ||
        error.message?.includes("인증")
      ) {
        setTimeout(() => {
          navigation.replace("Login");
        }, 1500);
      }
    } finally {
      setIsLoading(false);
    }
  };

  const handleQuickSelect = async (type: string) => {
    if (!userId) {
      Alert.alert("오류", "사용자 정보를 불러오는 중입니다.");
      return;
    }

    let message = "";
    switch (type) {
      case "exercise":
        message = "오늘의 운동을 추천해줘";
        break;
      case "food":
        message = "건강한 식단을 추천해줘";
        break;
      case "plan":
        message = "계획 수립을 도와줘";
        break;
      default:
        return;
    }

    setMessages((prev) => [...prev, { type: "user", text: message }]);
    setIsLoading(true);

    try {
      // ✅ mode와 coach_style을 API에 전달
      const botResponse = await chatAPI.sendMessage(
        userId,
        message,
        chatMode,
        coachStyle
      );
      setMessages((prev) => [...prev, { type: "bot", text: botResponse }]);
    } catch (error: any) {
      console.error("메시지 전송 에러:", error);

      let errorMessage = "죄송합니다. 오류가 발생했습니다.";
      if (error.message) {
        errorMessage = error.message;
      }

      setMessages((prev) => [...prev, { type: "bot", text: errorMessage }]);
    } finally {
      setIsLoading(false);
    }
  };

  const isInTab = navigation?.getState?.()?.type === "tab";

  // ✅ 현재 설정 텍스트
  const getModeText = () => {
    switch (chatMode) {
      case "auto":
        return "자동";
      case "exercise":
        return "운동";
      case "nutrition":
        return "영양";
      default:
        return "자동";
    }
  };

  const getStyleText = () => {
    switch (coachStyle) {
      case "pro":
        return "프로";
      case "friend":
        return "친구";
      case "soft":
        return "부드럽게";
      case "drill":
        return "코치";
      default:
        return "친구";
    }
  };

  return (
    <SafeAreaView style={styles.container} edges={["top"]}>
      {!isInTab && (
        <View style={styles.header}>
          <TouchableOpacity onPress={() => navigation.goBack()}>
            <Text style={styles.backIcon}>←</Text>
          </TouchableOpacity>
          <Text style={styles.headerTitle}>AI 챗봇</Text>
          <TouchableOpacity onPress={() => setIsSettingsModalOpen(true)}>
            <Icon name="settings-outline" size={24} color={NEW_COLORS.text} />
          </TouchableOpacity>
        </View>
      )}

      <KeyboardAvoidingView
        style={styles.keyboardView}
        behavior={Platform.OS === "ios" ? "padding" : "height"}
        keyboardVerticalOffset={100}
      >
        <View style={styles.mainContent}>
          {messages.length === 0 ? (
            <>
              {/* ✅ 환영 화면에 설정 버튼 추가 */}
              <View style={styles.welcomeHeader}>
                <View style={styles.welcomeSection}>
                  <Text style={styles.title}>안녕하세요!</Text>
                  <Text style={styles.subtitle}>어떻게 도와드릴까요?</Text>
                </View>

                {/* ✅ 설정 버튼 */}
                <TouchableOpacity
                  style={styles.settingsButton}
                  onPress={() => setIsSettingsModalOpen(true)}
                >
                  <Icon
                    name="settings-outline"
                    size={28}
                    color={NEW_COLORS.accent}
                  />
                  <Text style={styles.settingsButtonText}>채팅 설정</Text>
                </TouchableOpacity>
              </View>

              {/* 현재 설정 표시 */}
              <View style={styles.currentSettingsBadge}>
                <Icon
                  name="checkmark-circle"
                  size={16}
                  color={NEW_COLORS.accent}
                />
                <Text style={styles.currentSettingsBadgeText}>
                  {getModeText()} · {getStyleText()}
                </Text>
              </View>

              <View style={styles.botImageContainer}>
                <Text style={styles.botEmoji}>🤖</Text>
              </View>

              <View style={styles.quickActions}>
                <TouchableOpacity
                  style={styles.actionBtn}
                  onPress={() => handleQuickSelect("exercise")}
                >
                  <Text style={styles.actionIcon}>🏋️</Text>
                  <Text style={styles.actionText}>운동 추천</Text>
                </TouchableOpacity>

                <TouchableOpacity
                  style={[styles.actionBtn]}
                  onPress={() => handleQuickSelect("food")}
                >
                  <Text style={styles.actionIcon}>🍗</Text>
                  <Text style={styles.actionText}>식단 추천</Text>
                </TouchableOpacity>

                <TouchableOpacity
                  style={styles.actionBtn}
                  onPress={() => handleQuickSelect("plan")}
                >
                  <Text style={styles.actionIcon}>📅</Text>
                  <Text style={styles.actionText}>계획 수립</Text>
                </TouchableOpacity>
              </View>
            </>
          ) : (
            <>
              {/* ✅ 대화 중일 때도 설정 버튼 표시 */}
              <View style={styles.chatHeader}>
                <View style={styles.currentSettingsInline}>
                  <Icon
                    name="radio-button-on"
                    size={12}
                    color={NEW_COLORS.accent}
                  />
                  <Text style={styles.currentSettingsInlineText}>
                    {getModeText()} · {getStyleText()}
                  </Text>
                </View>
                <TouchableOpacity
                  style={styles.settingsButtonSmall}
                  onPress={() => setIsSettingsModalOpen(true)}
                >
                  <Icon
                    name="settings-outline"
                    size={20}
                    color={NEW_COLORS.text_secondary}
                  />
                </TouchableOpacity>
              </View>

              <ScrollView
                style={styles.messagesContainer}
                contentContainerStyle={styles.messagesContent}
              >
                {messages.map((msg, index) => (
                  <View
                    key={index}
                    style={[
                      styles.message,
                      msg.type === "user"
                        ? styles.userMessage
                        : styles.botMessage,
                    ]}
                  >
                    <Text
                      style={
                        msg.type === "user"
                          ? styles.userMessageText
                          : styles.botMessageText
                      }
                    >
                      {msg.text}
                    </Text>
                  </View>
                ))}
                {isLoading && (
                  <View style={[styles.message, styles.botMessage]}>
                    <Text style={styles.loadingText}>...</Text>
                  </View>
                )}
              </ScrollView>
            </>
          )}
        </View>

        <View style={styles.inputContainer}>
          <TextInput
            style={styles.messageInput}
            placeholder="무엇이든 물어보세요"
            value={inputValue}
            onChangeText={setInputValue}
            onSubmitEditing={handleSend}
            placeholderTextColor={NEW_COLORS.text_secondary}
          />
          <TouchableOpacity style={styles.sendBtn} onPress={handleSend}>
            <Text style={styles.sendIcon}>➤</Text>
          </TouchableOpacity>
        </View>
      </KeyboardAvoidingView>

      {/* ✅ 설정 모달 */}
      <ChatbotSettingsModal
        isOpen={isSettingsModalOpen}
        onClose={() => setIsSettingsModalOpen(false)}
        currentMode={chatMode}
        currentStyle={coachStyle}
        onSave={handleSaveSettings}
      />
    </SafeAreaView>
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
  container: {
    flex: 1,
    backgroundColor: NEW_COLORS.background,
  },
  header: {
    flexDirection: "row",
    justifyContent: "space-between",
    alignItems: "center",
    paddingVertical: 16,
    paddingHorizontal: 20,
    borderBottomWidth: 1,
    borderBottomColor: NEW_COLORS.separator,
  },
  backIcon: {
    fontSize: 24,
    color: NEW_COLORS.text,
    fontWeight: "bold",
  },
  headerTitle: {
    fontSize: 18,
    fontWeight: "600",
    color: NEW_COLORS.text,
  },
  keyboardView: {
    flex: 1,
  },
  mainContent: {
    flex: 1,
    padding: 20,
  },
  welcomeHeader: {
    alignItems: "center",
    marginTop: 20,
  },
  welcomeSection: {
    alignItems: "center",
  },
  title: {
    fontSize: 32,
    fontWeight: "bold",
    color: NEW_COLORS.text,
    marginBottom: 8,
  },
  subtitle: {
    fontSize: 18,
    color: NEW_COLORS.text_secondary,
  },
  settingsButton: {
    flexDirection: "row",
    alignItems: "center",
    gap: 8,
    marginTop: 16,
    paddingHorizontal: 20,
    paddingVertical: 10,
    backgroundColor: NEW_COLORS.card_bg,
    borderRadius: 20,
    borderWidth: 1,
    borderColor: NEW_COLORS.accent,
  },
  settingsButtonText: {
    fontSize: 14,
    fontWeight: "600",
    color: NEW_COLORS.accent,
  },
  currentSettingsBadge: {
    flexDirection: "row",
    alignItems: "center",
    gap: 6,
    alignSelf: "center",
    paddingHorizontal: 16,
    paddingVertical: 8,
    backgroundColor: `${NEW_COLORS.accent}20`,
    borderRadius: 16,
    marginTop: 16,
  },
  currentSettingsBadgeText: {
    fontSize: 12,
    color: NEW_COLORS.accent,
    fontWeight: "500",
  },
  botImageContainer: {
    alignItems: "center",
    marginVertical: 40,
  },
  botEmoji: {
    fontSize: 120,
  },
  quickActions: {
    flexDirection: "row",
    justifyContent: "space-around",
    gap: 12,
  },
  actionBtn: {
    flex: 1,
    backgroundColor: NEW_COLORS.card_bg,
    padding: 20,
    borderRadius: 20,
    alignItems: "center",
    shadowColor: "#000000",
    shadowOffset: { width: 0, height: 2 },
    shadowOpacity: 0.1,
    shadowRadius: 4,
    elevation: 3,
  },
  highlighted: {
    backgroundColor: NEW_COLORS.accent,
  },
  actionIcon: {
    fontSize: 32,
    marginBottom: 8,
  },
  actionText: {
    fontSize: 14,
    fontWeight: "600",
    color: NEW_COLORS.text,
  },
  chatHeader: {
    flexDirection: "row",
    justifyContent: "space-between",
    alignItems: "center",
    paddingBottom: 12,
    marginBottom: 8,
  },
  currentSettingsInline: {
    flexDirection: "row",
    alignItems: "center",
    gap: 6,
    paddingHorizontal: 12,
    paddingVertical: 6,
    backgroundColor: NEW_COLORS.card_bg,
    borderRadius: 12,
  },
  currentSettingsInlineText: {
    fontSize: 11,
    color: NEW_COLORS.text_secondary,
  },
  settingsButtonSmall: {
    padding: 8,
    backgroundColor: NEW_COLORS.card_bg,
    borderRadius: 12,
  },
  messagesContainer: {
    flex: 1,
  },
  messagesContent: {
    paddingBottom: 20,
  },
  message: {
    maxWidth: "80%",
    padding: 12,
    borderRadius: 20,
    marginBottom: 12,
  },
  userMessage: {
    alignSelf: "flex-end",
    backgroundColor: NEW_COLORS.accent,
  },
  botMessage: {
    alignSelf: "flex-start",
    backgroundColor: NEW_COLORS.card_bg,
  },
  userMessageText: {
    color: "#000000",
    fontSize: 16,
  },
  botMessageText: {
    color: NEW_COLORS.text,
    fontSize: 16,
  },
  loadingText: {
    color: NEW_COLORS.text_secondary,
    fontSize: 16,
  },
  inputContainer: {
    flexDirection: "row",
    padding: 16,
    backgroundColor: NEW_COLORS.card_bg,
    borderTopWidth: 1,
    borderTopColor: NEW_COLORS.separator,
    gap: 12,
  },
  messageInput: {
    flex: 1,
    backgroundColor: NEW_COLORS.background,
    borderRadius: 24,
    paddingHorizontal: 20,
    paddingVertical: 12,
    fontSize: 16,
    color: NEW_COLORS.text,
  },
  sendBtn: {
    width: 48,
    height: 48,
    borderRadius: 24,
    backgroundColor: NEW_COLORS.accent,
    justifyContent: "center",
    alignItems: "center",
  },
  sendIcon: {
    color: "#000000",
    fontSize: 20,
  },
});

export default ChatbotScreen;
