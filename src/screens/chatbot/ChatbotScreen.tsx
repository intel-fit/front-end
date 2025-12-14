// src/screens/chatbot/ChatbotScreen.tsx
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
  ActivityIndicator,
} from "react-native";
import {
  SafeAreaView,
  useSafeAreaInsets,
} from "react-native-safe-area-context";
import { Ionicons as Icon } from "@expo/vector-icons";
import AsyncStorage from "@react-native-async-storage/async-storage";
import { chatAPI, ChatHistoryItem } from "../../services/chatAPI";
import { authAPI } from "../../services/authAPI";
import ChatbotSettingsModal from "../../components/modals/ChatbotSettingsModal";

interface Message {
  type: "user" | "bot";
  text: string;
}

const ChatbotScreen = ({ navigation }: any) => {
  const [messages, setMessages] = useState<Message[]>([]);
  const [inputValue, setInputValue] = useState("");
  const [isLoading, setIsLoading] = useState(false);
  const [userId, setUserId] = useState<string | null>(null);

  const insets = useSafeAreaInsets();

  // 멤버십 타입
  const [membershipType, setMembershipType] = useState<"FREE" | "PREMIUM">(
    "FREE"
  );

  const [chatMode, setChatMode] = useState<"auto" | "exercise" | "nutrition">(
    "auto"
  );
  const [coachStyle, setCoachStyle] = useState<
    "pro" | "friend" | "soft" | "drill"
  >("friend");
  const [isSettingsModalOpen, setIsSettingsModalOpen] = useState(false);
  const [isLoadingHistory, setIsLoadingHistory] = useState(false);

  // ✅ 히스토리 표시 여부
  const [showHistory, setShowHistory] = useState(false);

  useEffect(() => {
    loadSettings();
    loadUserId();
    loadMembershipInfo();
  }, []);

  // ✅ 챗봇 히스토리 로드
  const loadChatHistory = async () => {
    try {
      setIsLoadingHistory(true);

      const history = await chatAPI.getChatHistory(20);

      if (history.length > 0) {
        const historyMessages: Message[] = [];

        history.forEach((item) => {
          historyMessages.push({
            type: "user",
            text: item.userMessage,
          });
          historyMessages.push({
            type: "bot",
            text: item.aiResponse,
          });
        });

        setMessages(historyMessages.reverse());
        console.log("✅ 챗봇 히스토리 로드 완료:", history.length);
      }
    } catch (error: any) {
      console.error("히스토리 로드 실패:", error);
    } finally {
      setIsLoadingHistory(false);
    }
  };

  // ✅ "이전 대화 보기" 버튼 클릭
  const handleShowHistory = async () => {
    setShowHistory(true);
    await loadChatHistory();
  };

  // ✅ "새 대화" 버튼 클릭
  const handleNewChat = () => {
    Alert.alert("새 대화 시작", "새로운 대화를 시작하시겠습니까?", [
      { text: "취소", style: "cancel" },
      {
        text: "확인",
        onPress: () => {
          setMessages([]);
          setShowHistory(false);
        },
      },
    ]);
  };

  // 화면 포커스 시 멤버십 정보 새로고침
  useEffect(() => {
    const unsubscribe = navigation.addListener("focus", () => {
      loadMembershipInfo();
    });

    return unsubscribe;
  }, [navigation]);

  const loadSettings = async () => {
    try {
      const savedMode = await AsyncStorage.getItem("chatbot_mode");
      const savedStyle = await AsyncStorage.getItem("chatbot_style");

      if (savedMode) setChatMode(savedMode as any);
      if (savedStyle) setCoachStyle(savedStyle as any);
    } catch (error) {
      console.error("설정 로드 실패:", error);
    }
  };

  const loadUserId = async () => {
    try {
      const storedUserId = await AsyncStorage.getItem("userId");

      if (!storedUserId) {
        throw new Error("저장된 사용자 ID가 없습니다.");
      }

      setUserId(storedUserId);
    } catch (error) {
      console.error("userId 로드 실패:", error);

      try {
        const token = await AsyncStorage.getItem("access_token");
        if (token) {
          const payload = JSON.parse(atob(token.split(".")[1]));
          if (payload.sub) {
            setUserId(payload.sub);
            await AsyncStorage.setItem("userId", payload.sub);
            return;
          }
        }
      } catch (jwtError) {
        console.error("JWT 파싱 실패:", jwtError);
      }

      Alert.alert("오류", "사용자 정보를 불러올 수 없습니다.", [
        { text: "확인", onPress: () => navigation.goBack() },
      ]);
    }
  };

  const loadMembershipInfo = async () => {
    try {
      const savedMembershipType = await AsyncStorage.getItem("membershipType");
      if (savedMembershipType) {
        setMembershipType(savedMembershipType as "FREE" | "PREMIUM");
      }
    } catch (error) {
      console.error("멤버십 정보 로드 실패:", error);
    }
  };

  const handleSaveSettings = async (mode: string, style: string) => {
    try {
      await AsyncStorage.setItem("chatbot_mode", mode);
      await AsyncStorage.setItem("chatbot_style", style);

      setChatMode(mode as any);
      setCoachStyle(style as any);

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
      const botResponse = await chatAPI.sendMessage(
        userId,
        userMessage,
        chatMode,
        coachStyle
      );

      setMessages((prev) => [...prev, { type: "bot", text: botResponse }]);

      await loadMembershipInfo();
    } catch (error: any) {
      console.error("메시지 전송 에러:", error);

      if (error.message?.includes("토큰이 부족")) {
        Alert.alert(
          "토큰 부족 ⚠️",
          "오늘의 AI 챗봇 대화 횟수를 모두 사용했습니다.\n\n프리미엄 플랜으로 업그레이드하면 무제한으로 이용하실 수 있습니다.",
          [
            { text: "나중에", style: "cancel" },
            {
              text: "프리미엄 보기",
              onPress: () => navigation.navigate("Subscription"),
            },
          ]
        );

        setMessages((prev) => prev.slice(0, -1));
        return;
      }

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
      const botResponse = await chatAPI.sendMessage(
        userId,
        message,
        chatMode,
        coachStyle
      );

      setMessages((prev) => [...prev, { type: "bot", text: botResponse }]);

      await loadMembershipInfo();
    } catch (error: any) {
      console.error("메시지 전송 에러:", error);

      if (error.message?.includes("토큰이 부족")) {
        Alert.alert(
          "토큰 부족 ⚠️",
          "오늘의 AI 챗봇 대화 횟수를 모두 사용했습니다.\n\n프리미엄 플랜으로 업그레이드하면 무제한으로 이용하실 수 있습니다.",
          [
            { text: "나중에", style: "cancel" },
            {
              text: "프리미엄 보기",
              onPress: () => navigation.navigate("Subscription"),
            },
          ]
        );

        setMessages((prev) => prev.slice(0, -1));
        return;
      }

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

  const renderPremiumBadge = () => {
    if (membershipType === "PREMIUM") {
      return (
        <View style={styles.premiumBadge}>
          <Icon name="star" size={14} color="#FFD700" />
          <Text style={styles.premiumBadgeText}>프리미엄 무제한</Text>
        </View>
      );
    }
    return null;
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
        keyboardVerticalOffset={Platform.OS === "ios" ? 0 : 0}
      >
        {/* ✅ ScrollView로 전체 감싸기 */}
        <ScrollView
          style={styles.scrollView}
          contentContainerStyle={styles.scrollViewContent}
          showsVerticalScrollIndicator={false}
          bounces={true}
        >
          <View style={styles.mainContent}>
            {messages.length === 0 && !showHistory ? (
              <>
                <View style={styles.welcomeHeader}>
                  <View style={styles.welcomeSection}>
                    <Text style={styles.title}>안녕하세요!</Text>
                    <Text style={styles.subtitle}>어떻게 도와드릴까요?</Text>
                  </View>

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

                <View style={styles.badgeContainer}>
                  {renderPremiumBadge()}
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

                <TouchableOpacity
                  style={styles.historyButton}
                  onPress={handleShowHistory}
                  disabled={isLoadingHistory}
                >
                  <Icon
                    name="time-outline"
                    size={20}
                    color={NEW_COLORS.accent}
                  />
                  <Text style={styles.historyButtonText}>
                    {isLoadingHistory ? "불러오는 중..." : "이전 대화 보기"}
                  </Text>
                </TouchableOpacity>
              </>
            ) : (
              <>
                <View style={styles.chatHeader}>
                  {renderPremiumBadge()}
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
                    style={styles.newChatButton}
                    onPress={handleNewChat}
                  >
                    <Icon
                      name="add-circle-outline"
                      size={20}
                      color={NEW_COLORS.accent}
                    />
                  </TouchableOpacity>

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

                {isLoadingHistory && (
                  <View style={styles.loadingHistory}>
                    <ActivityIndicator size="small" color={NEW_COLORS.accent} />
                    <Text style={styles.loadingHistoryText}>
                      대화 기록 불러오는 중...
                    </Text>
                  </View>
                )}

                <View style={styles.messagesContainer}>
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
                </View>
              </>
            )}
          </View>
        </ScrollView>

        <View
          style={[
            styles.chatinputContainer,
            { paddingBottom: insets.bottom > 0 ? Math.max(insets.bottom, 4) : 4 },
          ]}
        >
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
  scrollView: {
    flex: 1,
  },
  scrollViewContent: {
    flexGrow: 1,
    paddingBottom: 10,
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
  badgeContainer: {
    flexDirection: "row",
    justifyContent: "center",
    alignItems: "center",
    flexWrap: "wrap",
    gap: 12,
    marginTop: 16,
  },
  premiumBadge: {
    flexDirection: "row",
    alignItems: "center",
    gap: 6,
    paddingHorizontal: 12,
    paddingVertical: 6,
    backgroundColor: "#FFD70020",
    borderRadius: 12,
  },
  premiumBadgeText: {
    fontSize: 12,
    color: "#FFD700",
    fontWeight: "600",
  },
  currentSettingsBadge: {
    flexDirection: "row",
    alignItems: "center",
    gap: 6,
    paddingHorizontal: 16,
    paddingVertical: 8,
    backgroundColor: `${NEW_COLORS.accent}20`,
    borderRadius: 16,
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
  actionIcon: {
    fontSize: 32,
    marginBottom: 8,
  },
  actionText: {
    fontSize: 14,
    fontWeight: "600",
    color: NEW_COLORS.text,
  },
  historyButton: {
    flexDirection: "row",
    alignItems: "center",
    justifyContent: "center",
    gap: 8,
    marginTop: 32,
    paddingVertical: 14,
    paddingHorizontal: 24,
    backgroundColor: NEW_COLORS.card_bg,
    borderRadius: 24,
    borderWidth: 1,
    borderColor: NEW_COLORS.separator,
  },
  historyButtonText: {
    fontSize: 15,
    fontWeight: "600",
    color: NEW_COLORS.accent,
  },
  loadingHistory: {
    flexDirection: "row",
    alignItems: "center",
    justifyContent: "center",
    padding: 12,
    gap: 8,
  },
  loadingHistoryText: {
    fontSize: 14,
    color: NEW_COLORS.text_secondary,
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
  newChatButton: {
    padding: 8,
    backgroundColor: NEW_COLORS.card_bg,
    borderRadius: 12,
  },
  settingsButtonSmall: {
    padding: 8,
    backgroundColor: NEW_COLORS.card_bg,
    borderRadius: 12,
  },
  messagesContainer: {
    paddingBottom: 10,
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
  chatinputContainer: {
    flexDirection: "row",
    paddingHorizontal: 10,
    paddingTop: 8,
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
