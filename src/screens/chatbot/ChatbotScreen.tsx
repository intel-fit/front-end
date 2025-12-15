// src/screens/chatbot/ChatbotScreen.tsx
import React, { useState, useEffect, useRef } from "react";
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
  Animated,
  Dimensions,
} from "react-native";
import {
  SafeAreaView,
  useSafeAreaInsets,
} from "react-native-safe-area-context";
import { LinearGradient } from "expo-linear-gradient";
import { Ionicons as Icon } from "@expo/vector-icons";
import AsyncStorage from "@react-native-async-storage/async-storage";
import { chatAPI, ChatHistoryItem } from "../../services/chatAPI";
import { authAPI } from "../../services/authAPI";
import ChatbotSettingsModal from "../../components/modals/ChatbotSettingsModal";

interface Message {
  type: "user" | "bot";
  text: string;
}

const { width } = Dimensions.get("window");

const ChatbotScreen = ({ navigation }: any) => {
  const [messages, setMessages] = useState<Message[]>([]);
  const [inputValue, setInputValue] = useState("");
  const [isLoading, setIsLoading] = useState(false);
  const [userId, setUserId] = useState<string | null>(null);
  const scrollViewRef = useRef<ScrollView>(null);
  const fadeAnim = useRef(new Animated.Value(0)).current;

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
    
    // 페이드 인 애니메이션
    Animated.timing(fadeAnim, {
      toValue: 1,
      duration: 500,
      useNativeDriver: true,
    }).start();
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

    // 메시지 추가 후 스크롤
    setTimeout(() => {
      scrollViewRef.current?.scrollToEnd({ animated: true });
    }, 100);

    try {
      const botResponse = await chatAPI.sendMessage(
        userId,
        userMessage,
        chatMode,
        coachStyle
      );

      setMessages((prev) => [...prev, { type: "bot", text: botResponse }]);
      
      // 봇 응답 후 스크롤
      setTimeout(() => {
        scrollViewRef.current?.scrollToEnd({ animated: true });
      }, 100);

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

  return (
    <SafeAreaView style={styles.container} edges={["top"]}>
      {!isInTab && (
        <View style={styles.header}>
          <TouchableOpacity 
            onPress={() => navigation.goBack()}
            style={styles.headerButton}
          >
            <Icon name="arrow-back" size={24} color={COLORS.text} />
          </TouchableOpacity>
          <Text style={styles.headerTitle}>AI 코치</Text>
          <TouchableOpacity 
            onPress={() => setIsSettingsModalOpen(true)}
            style={styles.headerButton}
          >
            <Icon name="settings-outline" size={24} color={COLORS.text} />
          </TouchableOpacity>
        </View>
      )}

      <KeyboardAvoidingView
        style={styles.keyboardView}
        behavior={Platform.OS === "ios" ? "padding" : "height"}
        keyboardVerticalOffset={Platform.OS === "ios" ? 0 : 0}
      >
        <Animated.View 
          style={[
            styles.content,
            { opacity: fadeAnim }
          ]}
        >
          <ScrollView
            ref={scrollViewRef}
            style={styles.scrollView}
            contentContainerStyle={styles.scrollViewContent}
            showsVerticalScrollIndicator={false}
            bounces={true}
            onContentSizeChange={() => {
              scrollViewRef.current?.scrollToEnd({ animated: true });
            }}
          >
            {messages.length === 0 && !showHistory ? (
              <View style={styles.emptyState}>
                <View style={styles.avatarContainer}>
                  <LinearGradient
                    colors={[COLORS.primary, COLORS.primaryDark]}
                    style={styles.avatarGradient}
                  >
                    <Text style={styles.avatarEmoji}>🤖</Text>
                  </LinearGradient>
                </View>
                
                <Text style={styles.greetingTitle}>안녕하세요!</Text>
                <Text style={styles.greetingSubtitle}>
                  AI 코치가 도와드리겠습니다
                </Text>

                {membershipType === "PREMIUM" && (
                  <View style={styles.premiumBadge}>
                    <Icon name="star" size={16} color="#FFD700" />
                    <Text style={styles.premiumText}>프리미엄 무제한</Text>
                  </View>
                )}

                <View style={styles.settingsInfo}>
                  <Icon name="checkmark-circle" size={16} color={COLORS.primary} />
                  <Text style={styles.settingsText}>
                    {getModeText()} · {getStyleText()}
                  </Text>
                </View>

                <View style={styles.quickActions}>
                  <TouchableOpacity
                    style={styles.quickActionCard}
                    onPress={() => handleQuickSelect("exercise")}
                    activeOpacity={0.7}
                  >
                    <LinearGradient
                      colors={[COLORS.primary, COLORS.primaryDark]}
                      style={styles.quickActionGradient}
                    >
                      <Text style={styles.quickActionEmoji}>💪</Text>
                      <Text style={styles.quickActionText}>운동 추천</Text>
                    </LinearGradient>
                  </TouchableOpacity>

                  <TouchableOpacity
                    style={styles.quickActionCard}
                    onPress={() => handleQuickSelect("food")}
                    activeOpacity={0.7}
                  >
                    <LinearGradient
                      colors={[COLORS.primary, COLORS.primaryDark]}
                      style={styles.quickActionGradient}
                    >
                      <Text style={styles.quickActionEmoji}>🍎</Text>
                      <Text style={styles.quickActionText}>식단 추천</Text>
                    </LinearGradient>
                  </TouchableOpacity>

                  <TouchableOpacity
                    style={styles.quickActionCard}
                    onPress={() => handleQuickSelect("plan")}
                    activeOpacity={0.7}
                  >
                    <LinearGradient
                      colors={[COLORS.primary, COLORS.primaryDark]}
                      style={styles.quickActionGradient}
                    >
                      <Text style={styles.quickActionEmoji}>📋</Text>
                      <Text style={styles.quickActionText}>계획 수립</Text>
                    </LinearGradient>
                  </TouchableOpacity>
                </View>

                <TouchableOpacity
                  style={styles.historyButton}
                  onPress={handleShowHistory}
                  disabled={isLoadingHistory}
                >
                  <Icon name="time-outline" size={18} color={COLORS.primary} />
                  <Text style={styles.historyButtonText}>
                    {isLoadingHistory ? "불러오는 중..." : "이전 대화 보기"}
                  </Text>
                </TouchableOpacity>
              </View>
            ) : (
              <>
                <View style={styles.chatHeader}>
                  <View style={styles.chatHeaderLeft}>
                    {membershipType === "PREMIUM" && (
                      <View style={styles.premiumBadgeSmall}>
                        <Icon name="star" size={12} color="#FFD700" />
                      </View>
                    )}
                    <View style={styles.settingsBadge}>
                      <Icon name="radio-button-on" size={10} color={COLORS.primary} />
                      <Text style={styles.settingsBadgeText}>
                        {getModeText()} · {getStyleText()}
                      </Text>
                    </View>
                  </View>
                  
                  <View style={styles.chatHeaderRight}>
                    <TouchableOpacity
                      style={styles.headerIconButton}
                      onPress={handleNewChat}
                    >
                      <Icon name="add-circle-outline" size={22} color={COLORS.textSecondary} />
                    </TouchableOpacity>
                    <TouchableOpacity
                      style={styles.headerIconButton}
                      onPress={() => setIsSettingsModalOpen(true)}
                    >
                      <Icon name="settings-outline" size={22} color={COLORS.textSecondary} />
                    </TouchableOpacity>
                  </View>
                </View>

                {isLoadingHistory && (
                  <View style={styles.loadingContainer}>
                    <ActivityIndicator size="small" color={COLORS.primary} />
                    <Text style={styles.loadingText}>대화 기록 불러오는 중...</Text>
                  </View>
                )}

                <View style={styles.messagesContainer}>
                  {messages.map((msg, index) => (
                    <View
                      key={index}
                      style={[
                        styles.messageRow,
                        msg.type === "user" ? styles.userMessageRow : styles.botMessageRow,
                      ]}
                    >
                      {msg.type === "bot" && (
                        <View style={styles.botAvatar}>
                          <LinearGradient
                            colors={[COLORS.primary, COLORS.primaryDark]}
                            style={styles.botAvatarGradient}
                          >
                            <Text style={styles.botAvatarEmoji}>🤖</Text>
                          </LinearGradient>
                        </View>
                      )}
                      
                      {msg.type === "user" ? (
                        <LinearGradient
                          colors={[COLORS.primary, COLORS.primaryDark]}
                          style={[styles.messageBubble, styles.userBubble]}
                        >
                          <Text style={styles.userMessageText}>{msg.text}</Text>
                        </LinearGradient>
                      ) : (
                        <View style={[styles.messageBubble, styles.botBubble]}>
                          <Text style={styles.botMessageText}>{msg.text}</Text>
                        </View>
                      )}
                      
                      {msg.type === "user" && (
                        <View style={styles.userAvatar}>
                          <Icon name="person" size={18} color={COLORS.primary} />
                        </View>
                      )}
                    </View>
                  ))}
                  
                  {isLoading && (
                    <View style={[styles.messageRow, styles.botMessageRow]}>
                      <View style={styles.botAvatar}>
                        <LinearGradient
                          colors={[COLORS.primary, COLORS.primaryDark]}
                          style={styles.botAvatarGradient}
                        >
                          <Text style={styles.botAvatarEmoji}>🤖</Text>
                        </LinearGradient>
                      </View>
                      <View style={[styles.messageBubble, styles.botBubble, styles.typingBubble]}>
                        <View style={styles.typingIndicator}>
                          <View style={[styles.typingDot, styles.typingDot1]} />
                          <View style={[styles.typingDot, styles.typingDot2]} />
                          <View style={[styles.typingDot, styles.typingDot3]} />
                        </View>
                      </View>
                    </View>
                  )}
                </View>
              </>
            )}
          </ScrollView>
        </Animated.View>

        <View
          style={[
            styles.inputContainer,
            { 
              paddingBottom: isInTab 
                ? 2 
                : (insets.bottom > 0 ? Math.max(insets.bottom, 8) : 8)
            },
          ]}
        >
          <View style={styles.inputWrapper}>
            <TextInput
              style={styles.input}
              placeholder="메시지를 입력하세요..."
              placeholderTextColor={COLORS.textSecondary}
              value={inputValue}
              onChangeText={setInputValue}
              onSubmitEditing={handleSend}
              multiline
              maxLength={500}
            />
            <TouchableOpacity
              style={[
                styles.sendButton,
                (inputValue.trim() === "" || isLoading) && styles.sendButtonDisabled,
              ]}
              onPress={handleSend}
              disabled={inputValue.trim() === "" || isLoading}
            >
              {isLoading ? (
                <ActivityIndicator size="small" color="#000" />
              ) : (
                <Icon name="send" size={20} color="#000" />
              )}
            </TouchableOpacity>
          </View>
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

const COLORS = {
  background: "#0a0a0a",
  surface: "#151515",
  surfaceLight: "#1f1f1f",
  text: "#ffffff",
  textSecondary: "#888888",
  primary: "#e3ff7c",
  primaryDark: "#d4f05a",
  border: "#2a2a2a",
  premium: "#FFD700",
};

const styles = StyleSheet.create({
  container: {
    flex: 1,
    backgroundColor: COLORS.background,
  },
  header: {
    flexDirection: "row",
    justifyContent: "space-between",
    alignItems: "center",
    paddingHorizontal: 20,
    paddingVertical: 16,
    borderBottomWidth: 1,
    borderBottomColor: COLORS.border,
  },
  headerButton: {
    padding: 4,
  },
  headerTitle: {
    fontSize: 20,
    fontWeight: "700",
    color: COLORS.text,
    letterSpacing: -0.5,
  },
  keyboardView: {
    flex: 1,
  },
  content: {
    flex: 1,
  },
  scrollView: {
    flex: 1,
  },
  scrollViewContent: {
    flexGrow: 1,
    paddingBottom: 20,
  },
  emptyState: {
    flex: 1,
    alignItems: "center",
    justifyContent: "center",
    paddingHorizontal: 24,
    paddingTop: 40,
    paddingBottom: 20,
  },
  avatarContainer: {
    marginBottom: 32,
  },
  avatarGradient: {
    width: 120,
    height: 120,
    borderRadius: 60,
    justifyContent: "center",
    alignItems: "center",
    shadowColor: COLORS.primary,
    shadowOffset: { width: 0, height: 8 },
    shadowOpacity: 0.4,
    shadowRadius: 20,
    elevation: 10,
  },
  avatarEmoji: {
    fontSize: 60,
  },
  greetingTitle: {
    fontSize: 32,
    fontWeight: "800",
    color: COLORS.text,
    marginBottom: 8,
    letterSpacing: -1,
  },
  greetingSubtitle: {
    fontSize: 16,
    color: COLORS.textSecondary,
    marginBottom: 24,
    fontWeight: "400",
  },
  premiumBadge: {
    flexDirection: "row",
    alignItems: "center",
    gap: 6,
    paddingHorizontal: 14,
    paddingVertical: 8,
    backgroundColor: `${COLORS.premium}15`,
    borderRadius: 20,
    marginBottom: 16,
    borderWidth: 1,
    borderColor: `${COLORS.premium}30`,
  },
  premiumText: {
    fontSize: 13,
    color: COLORS.premium,
    fontWeight: "600",
  },
  premiumBadgeSmall: {
    width: 24,
    height: 24,
    borderRadius: 12,
    backgroundColor: `${COLORS.premium}20`,
    justifyContent: "center",
    alignItems: "center",
    marginRight: 8,
  },
  settingsInfo: {
    flexDirection: "row",
    alignItems: "center",
    gap: 6,
    paddingHorizontal: 16,
    paddingVertical: 10,
    backgroundColor: `${COLORS.primary}15`,
    borderRadius: 20,
    marginBottom: 32,
    borderWidth: 1,
    borderColor: `${COLORS.primary}30`,
  },
  settingsText: {
    fontSize: 13,
    color: COLORS.primary,
    fontWeight: "600",
  },
  quickActions: {
    width: "100%",
    gap: 12,
    marginBottom: 32,
  },
  quickActionCard: {
    borderRadius: 20,
    overflow: "hidden",
    shadowColor: COLORS.primary,
    shadowOffset: { width: 0, height: 4 },
    shadowOpacity: 0.3,
    shadowRadius: 12,
    elevation: 8,
  },
  quickActionGradient: {
    padding: 24,
    alignItems: "center",
    justifyContent: "center",
    minHeight: 100,
  },
  quickActionEmoji: {
    fontSize: 36,
    marginBottom: 8,
  },
  quickActionText: {
    fontSize: 16,
    fontWeight: "700",
    color: "#000000",
    letterSpacing: 0.3,
  },
  historyButton: {
    flexDirection: "row",
    alignItems: "center",
    gap: 8,
    paddingVertical: 14,
    paddingHorizontal: 24,
    backgroundColor: COLORS.surface,
    borderRadius: 24,
    borderWidth: 1,
    borderColor: COLORS.border,
  },
  historyButtonText: {
    fontSize: 15,
    fontWeight: "600",
    color: COLORS.primary,
  },
  chatHeader: {
    flexDirection: "row",
    justifyContent: "space-between",
    alignItems: "center",
    paddingHorizontal: 20,
    paddingVertical: 16,
    borderBottomWidth: 1,
    borderBottomColor: COLORS.border,
  },
  chatHeaderLeft: {
    flexDirection: "row",
    alignItems: "center",
  },
  chatHeaderRight: {
    flexDirection: "row",
    gap: 12,
  },
  settingsBadge: {
    flexDirection: "row",
    alignItems: "center",
    gap: 6,
    paddingHorizontal: 12,
    paddingVertical: 6,
    backgroundColor: COLORS.surface,
    borderRadius: 16,
    borderWidth: 1,
    borderColor: COLORS.border,
  },
  settingsBadgeText: {
    fontSize: 12,
    color: COLORS.textSecondary,
    fontWeight: "500",
  },
  headerIconButton: {
    padding: 6,
  },
  loadingContainer: {
    flexDirection: "row",
    alignItems: "center",
    justifyContent: "center",
    padding: 16,
    gap: 8,
  },
  loadingText: {
    fontSize: 14,
    color: COLORS.textSecondary,
  },
  messagesContainer: {
    paddingHorizontal: 20,
    paddingTop: 20,
  },
  messageRow: {
    flexDirection: "row",
    alignItems: "flex-end",
    marginBottom: 20,
    gap: 10,
  },
  userMessageRow: {
    justifyContent: "flex-end",
  },
  botMessageRow: {
    justifyContent: "flex-start",
  },
  botAvatar: {
    width: 36,
    height: 36,
    borderRadius: 18,
    overflow: "hidden",
    marginBottom: 4,
  },
  botAvatarGradient: {
    width: "100%",
    height: "100%",
    justifyContent: "center",
    alignItems: "center",
  },
  botAvatarEmoji: {
    fontSize: 18,
  },
  userAvatar: {
    width: 36,
    height: 36,
    borderRadius: 18,
    backgroundColor: `${COLORS.primary}20`,
    justifyContent: "center",
    alignItems: "center",
    marginBottom: 4,
    borderWidth: 2,
    borderColor: `${COLORS.primary}40`,
  },
  messageBubble: {
    maxWidth: width * 0.75,
    paddingHorizontal: 18,
    paddingVertical: 14,
    borderRadius: 20,
  },
  userBubble: {
    borderBottomRightRadius: 4,
    shadowColor: COLORS.primary,
    shadowOffset: { width: 0, height: 4 },
    shadowOpacity: 0.3,
    shadowRadius: 12,
    elevation: 6,
  },
  botBubble: {
    backgroundColor: COLORS.surface,
    borderBottomLeftRadius: 4,
    borderWidth: 1,
    borderColor: COLORS.border,
    shadowColor: "#000",
    shadowOffset: { width: 0, height: 2 },
    shadowOpacity: 0.2,
    shadowRadius: 8,
    elevation: 3,
  },
  typingBubble: {
    paddingVertical: 18,
    paddingHorizontal: 20,
  },
  userMessageText: {
    color: "#000000",
    fontSize: 16,
    lineHeight: 24,
    fontWeight: "500",
    letterSpacing: 0.2,
  },
  botMessageText: {
    color: COLORS.text,
    fontSize: 16,
    lineHeight: 24,
    fontWeight: "400",
    letterSpacing: 0.1,
  },
  typingIndicator: {
    flexDirection: "row",
    alignItems: "center",
    gap: 6,
  },
  typingDot: {
    width: 10,
    height: 10,
    borderRadius: 5,
    backgroundColor: COLORS.primary,
  },
  typingDot1: {
    opacity: 0.4,
  },
  typingDot2: {
    opacity: 0.7,
  },
  typingDot3: {
    opacity: 1,
  },
  inputContainer: {
    paddingHorizontal: 20,
    paddingTop: 12,
    backgroundColor: COLORS.background,
    borderTopWidth: 1,
    borderTopColor: COLORS.border,
  },
  inputWrapper: {
    flexDirection: "row",
    alignItems: "flex-end",
    gap: 12,
    backgroundColor: COLORS.surface,
    borderRadius: 28,
    paddingHorizontal: 6,
    paddingVertical: 6,
    borderWidth: 1.5,
    borderColor: COLORS.border,
  },
  input: {
    flex: 1,
    backgroundColor: "transparent",
    borderRadius: 22,
    paddingHorizontal: 18,
    paddingVertical: 12,
    fontSize: 16,
    color: COLORS.text,
    maxHeight: 120,
    minHeight: 44,
    lineHeight: 22,
  },
  sendButton: {
    width: 44,
    height: 44,
    borderRadius: 22,
    backgroundColor: COLORS.primary,
    justifyContent: "center",
    alignItems: "center",
    shadowColor: COLORS.primary,
    shadowOffset: { width: 0, height: 4 },
    shadowOpacity: 0.4,
    shadowRadius: 8,
    elevation: 6,
  },
  sendButtonDisabled: {
    backgroundColor: COLORS.border,
    opacity: 0.4,
    shadowOpacity: 0,
    elevation: 0,
  },
});

export default ChatbotScreen;
