// ChatbotScreen.tsx
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
import { colors } from "../../theme/colors";
import { authAPI } from "../../services";
import { chatAPI } from "../../services/chatAPI";

interface Message {
  type: "user" | "bot";
  text: string;
}

const ChatbotScreen = ({ navigation }: any) => {
  const [messages, setMessages] = useState<Message[]>([]);
  const [inputValue, setInputValue] = useState("");
  const [isLoading, setIsLoading] = useState(false);
  const [userId, setUserId] = useState<number>(0);

  // ✅ 컴포넌트 마운트 시 userId만 가져오기
  useEffect(() => {
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

    loadUserId();
  }, []);

  const handleSend = async () => {
    if (inputValue.trim() === "" || !userId) return;

    const userMessage = inputValue.trim();
    setInputValue("");
    setMessages((prev) => [...prev, { type: "user", text: userMessage }]);
    setIsLoading(true);

    try {
      const botResponse = await chatAPI.sendMessage(userId, userMessage);
      setMessages((prev) => [...prev, { type: "bot", text: botResponse }]);
    } catch (error: any) {
      console.error("메시지 전송 에러:", error);

      let errorMessage = "죄송합니다. 오류가 발생했습니다.";
      if (error.message) {
        errorMessage = error.message;
      }

      setMessages((prev) => [...prev, { type: "bot", text: errorMessage }]);

      // 인증 오류시 로그인 화면으로
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
      const botResponse = await chatAPI.sendMessage(userId, message);
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

  // 탭 네비게이션에서 사용될 때는 헤더 숨김
  const isInTab = navigation?.getState?.()?.type === "tab";

  return (
    <SafeAreaView style={styles.container} edges={["top"]}>
      {!isInTab && (
        <View style={styles.header}>
          <TouchableOpacity onPress={() => navigation.goBack()}>
            <Text style={styles.backIcon}>←</Text>
          </TouchableOpacity>
          <Text style={styles.headerTitle}>AI 챗봇</Text>
          <View style={{ width: 40 }} />
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
              <View style={styles.welcomeSection}>
                <Text style={styles.title}>안녕하세요!</Text>
                <Text style={styles.subtitle}>어떻게 도와드릴까요?</Text>
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
                  style={[styles.actionBtn, styles.highlighted]}
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
          )}
        </View>

        <View style={styles.inputContainer}>
          <TextInput
            style={styles.messageInput}
            placeholder="무엇이든 물어보세요"
            value={inputValue}
            onChangeText={setInputValue}
            onSubmitEditing={handleSend}
            placeholderTextColor={colors.textLight}
          />
          <TouchableOpacity style={styles.sendBtn} onPress={handleSend}>
            <Text style={styles.sendIcon}>➤</Text>
          </TouchableOpacity>
        </View>
      </KeyboardAvoidingView>
    </SafeAreaView>
  );
};

const styles = StyleSheet.create({
  container: {
    flex: 1,
    backgroundColor: colors.background,
  },
  header: {
    flexDirection: "row",
    justifyContent: "space-between",
    alignItems: "center",
    paddingVertical: 16,
    paddingHorizontal: 20,
    borderBottomWidth: 1,
    borderBottomColor: colors.border,
    position: "relative",
  },
  backIcon: {
    fontSize: 24,
    color: colors.text,
    fontWeight: "bold",
  },
  headerTitle: {
    fontSize: 18,
    fontWeight: "600",
    color: colors.text,
    position: "absolute",
    left: 0,
    right: 0,
    textAlign: "center",
  },
  keyboardView: {
    flex: 1,
  },
  mainContent: {
    flex: 1,
    padding: 20,
  },
  welcomeSection: {
    alignItems: "center",
    marginTop: 40,
  },
  title: {
    fontSize: 32,
    fontWeight: "bold",
    color: colors.text,
    marginBottom: 8,
  },
  subtitle: {
    fontSize: 18,
    color: colors.textLight,
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
    backgroundColor: colors.cardBackground,
    padding: 20,
    borderRadius: 20,
    alignItems: "center",
    shadowColor: colors.shadow,
    shadowOffset: { width: 0, height: 2 },
    shadowOpacity: 0.1,
    shadowRadius: 4,
    elevation: 3,
  },
  highlighted: {
    backgroundColor: colors.primary,
  },
  actionIcon: {
    fontSize: 32,
    marginBottom: 8,
  },
  actionText: {
    fontSize: 14,
    fontWeight: "600",
    color: colors.text,
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
    backgroundColor: colors.primary,
  },
  botMessage: {
    alignSelf: "flex-start",
    backgroundColor: colors.cardBackground,
  },
  userMessageText: {
    color: colors.white,
    fontSize: 16,
  },
  botMessageText: {
    color: colors.text,
    fontSize: 16,
  },
  loadingText: {
    color: colors.textLight,
    fontSize: 16,
  },
  inputContainer: {
    flexDirection: "row",
    padding: 16,
    backgroundColor: colors.cardBackground,
    borderTopWidth: 1,
    borderTopColor: colors.border,
    gap: 12,
  },
  messageInput: {
    flex: 1,
    backgroundColor: colors.background,
    borderRadius: 24,
    paddingHorizontal: 20,
    paddingVertical: 12,
    fontSize: 16,
    color: colors.text,
  },
  sendBtn: {
    width: 48,
    height: 48,
    borderRadius: 24,
    backgroundColor: colors.primary,
    justifyContent: "center",
    alignItems: "center",
  },
  sendIcon: {
    color: colors.white,
    fontSize: 20,
  },
});

export default ChatbotScreen;
