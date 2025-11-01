import React, {useState} from 'react';
import {
  View,
  Text,
  TextInput,
  TouchableOpacity,
  StyleSheet,
  ScrollView,
  KeyboardAvoidingView,
  Platform,
  Image,
} from 'react-native';
import {SafeAreaView} from 'react-native-safe-area-context';
import { Ionicons as Icon } from '@expo/vector-icons';
import {colors} from '../../theme/colors';

interface Message {
  type: 'user' | 'bot';
  text: string;
}

const ChatbotScreen = ({navigation}: any) => {
  const [messages, setMessages] = useState<Message[]>([]);
  const [inputValue, setInputValue] = useState('');
  const [isLoading, setIsLoading] = useState(false);

  const callGeminiAPI = async (userMessage: string) => {
    const API_KEY = '';
    const API_URL =
      'https://generativelanguage.googleapis.com/v1beta/models/gemini-2.5-flash:generateContent';

    try {
      const response = await fetch(`${API_URL}?key=${API_KEY}`, {
        method: 'POST',
        headers: {
          'Content-Type': 'application/json',
        },
        body: JSON.stringify({
          contents: [
            {
              parts: [
                {
                  text: userMessage,
                },
              ],
            },
          ],
        }),
      });

      if (!response.ok) {
        throw new Error(`API Error: ${response.status}`);
      }

      const data = await response.json();

      if (
        data.candidates &&
        data.candidates.length > 0 &&
        data.candidates[0].content &&
        data.candidates[0].content.parts &&
        data.candidates[0].content.parts.length > 0
      ) {
        return data.candidates[0].content.parts[0].text;
      } else {
        return '죄송합니다. 응답을 처리할 수 없습니다.';
      }
    } catch (error) {
      console.error('API 호출 에러:', error);
      return `오류 발생: ${error}`;
    }
  };

  const handleSend = async () => {
    if (inputValue.trim() === '') return;

    const userMessage = inputValue;
    setInputValue('');
    setMessages(prev => [...prev, {type: 'user', text: userMessage}]);
    setIsLoading(true);

    const botResponse = await callGeminiAPI(userMessage);
    setMessages(prev => [...prev, {type: 'bot', text: botResponse}]);
    setIsLoading(false);
  };

  const handleQuickSelect = async (type: string) => {
    let message = '';
    switch (type) {
      case 'exercise':
        message = '오늘의 운동을 추천해줘';
        break;
      case 'food':
        message = '건강한 식단을 추천해줘';
        break;
      case 'plan':
        message = '계획 수립을 도와줘';
        break;
      default:
        return;
    }
    setMessages(prev => [...prev, {type: 'user', text: message}]);
    setIsLoading(true);

    const botResponse = await callGeminiAPI(message);
    setMessages(prev => [...prev, {type: 'bot', text: botResponse}]);
    setIsLoading(false);
  };

  // 탭 네비게이션에서 사용될 때는 헤더 숨김
  const isInTab = navigation?.getState?.()?.type === 'tab';

  return (
    <SafeAreaView style={styles.container} edges={['top']}>
      {!isInTab && (
        <View style={styles.header}>
          <TouchableOpacity onPress={() => navigation.goBack()}>
            <Text style={styles.backIcon}>←</Text>
          </TouchableOpacity>
          <Text style={styles.headerTitle}>AI 챗봇</Text>
          <View style={{width: 40}} />
        </View>
      )}
      <KeyboardAvoidingView
        style={styles.keyboardView}
        behavior={Platform.OS === 'ios' ? 'padding' : 'height'}
        keyboardVerticalOffset={100}>
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
                  onPress={() => handleQuickSelect('exercise')}>
                  <Text style={styles.actionIcon}>🏋️</Text>
                  <Text style={styles.actionText}>운동 추천</Text>
                </TouchableOpacity>

                <TouchableOpacity
                  style={[styles.actionBtn, styles.highlighted]}
                  onPress={() => handleQuickSelect('food')}>
                  <Text style={styles.actionIcon}>🍗</Text>
                  <Text style={styles.actionText}>식단 추천</Text>
                </TouchableOpacity>

                <TouchableOpacity
                  style={styles.actionBtn}
                  onPress={() => handleQuickSelect('plan')}>
                  <Text style={styles.actionIcon}>📅</Text>
                  <Text style={styles.actionText}>계획 수립</Text>
                </TouchableOpacity>
              </View>
            </>
          ) : (
            <ScrollView style={styles.messagesContainer}>
              {messages.map((msg, index) => (
                <View
                  key={index}
                  style={[
                    styles.message,
                    msg.type === 'user'
                      ? styles.userMessage
                      : styles.botMessage,
                  ]}>
                  <Text
                    style={
                      msg.type === 'user'
                        ? styles.userMessageText
                        : styles.botMessageText
                    }>
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
    flexDirection: 'row',
    justifyContent: 'space-between',
    alignItems: 'center',
    paddingVertical: 16,
    paddingHorizontal: 20,
    borderBottomWidth: 1,
    borderBottomColor: colors.border,
    position: 'relative',
  },
  backIcon: {
    fontSize: 24,
    color: colors.text,
    fontWeight: 'bold',
  },
  headerTitle: {
    fontSize: 18,
    fontWeight: '600',
    color: colors.text,
    position: 'absolute',
    left: 0,
    right: 0,
    textAlign: 'center',
  },
  keyboardView: {
    flex: 1,
  },
  mainContent: {
    flex: 1,
    padding: 20,
  },
  welcomeSection: {
    alignItems: 'center',
    marginTop: 40,
  },
  title: {
    fontSize: 32,
    fontWeight: 'bold',
    color: colors.text,
    marginBottom: 8,
  },
  subtitle: {
    fontSize: 18,
    color: colors.textLight,
  },
  botImageContainer: {
    alignItems: 'center',
    marginVertical: 40,
  },
  botEmoji: {
    fontSize: 120,
  },
  quickActions: {
    flexDirection: 'row',
    justifyContent: 'space-around',
    gap: 12,
  },
  actionBtn: {
    flex: 1,
    backgroundColor: colors.cardBackground,
    padding: 20,
    borderRadius: 20,
    alignItems: 'center',
    shadowColor: colors.shadow,
    shadowOffset: {width: 0, height: 2},
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
    fontWeight: '600',
    color: colors.text,
  },
  messagesContainer: {
    flex: 1,
  },
  message: {
    maxWidth: '80%',
    padding: 12,
    borderRadius: 20,
    marginBottom: 12,
  },
  userMessage: {
    alignSelf: 'flex-end',
    backgroundColor: colors.primary,
  },
  botMessage: {
    alignSelf: 'flex-start',
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
    flexDirection: 'row',
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
    justifyContent: 'center',
    alignItems: 'center',
  },
  sendIcon: {
    color: colors.white,
    fontSize: 20,
  },
});

export default ChatbotScreen;

