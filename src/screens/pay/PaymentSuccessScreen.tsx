// src/screens/pay/PaymentSuccessScreen.tsx
import React, { useEffect, useState } from "react";
import { View, Text, StyleSheet, TouchableOpacity, Alert } from "react-native";
import { SafeAreaView } from "react-native-safe-area-context";
import { Ionicons as Icon } from "@expo/vector-icons";
import { LinearGradient } from "expo-linear-gradient";
import { useNavigation } from "@react-navigation/native";
import AsyncStorage from "@react-native-async-storage/async-storage";
import { useRoute } from "@react-navigation/native";
import { paymentAPI, authAPI } from "../../services";
import { CommonActions } from "@react-navigation/native";

const PaymentSuccessScreen = () => {
  const navigation = useNavigation();
  const route = useRoute<any>();

  const [loading, setLoading] = useState(false);
  useEffect(() => {
    const sessionId = route.params?.sessionId;
    const orderId = route.params?.orderId;

    if (sessionId) {
      confirmStripePaymentAndUpgrade(sessionId);
    } else if (orderId) {
      confirmKakaoPaymentAndUpgrade(orderId);
    } else {
      updateMembershipToPremium();
    }
  }, []);

  const confirmStripePaymentAndUpgrade = async (sessionId: string) => {
    try {
      setLoading(true);

      // 1. 백엔드에 결제 확인
      await paymentAPI.confirmStripePayment(sessionId);
      console.log("✅ 결제 확인 완료");

      // 2. 1초 대기 (DB 업데이트 시간)
      await new Promise((resolve) => setTimeout(resolve, 1000));

      // 3. 로컬에 PREMIUM 저장
      await AsyncStorage.setItem("membershipType", "PREMIUM");
      await AsyncStorage.removeItem("testMembershipType");
      console.log("✅ 로컬 PREMIUM 저장 완료");

      // 4. ✅ 로그아웃 처리
      await AsyncStorage.removeItem("accessToken");
      await AsyncStorage.removeItem("refreshToken");
      console.log("✅ 로그아웃 완료");

      // 5. 안내 메시지 + 로그인 화면으로 이동
      Alert.alert(
        "업그레이드 완료! 🎉",
        "프리미엄 회원이 되셨습니다!\n더 나은 서비스를 위해 다시 로그인해주세요.",
        [
          {
            text: "로그인하러 가기",
            onPress: () => {
              // ✅ 스택 초기화하고 Login으로 이동
              navigation.dispatch(
                CommonActions.reset({
                  index: 0,
                  routes: [{ name: "Login" }],
                })
              );
            },
          },
        ],
        { cancelable: false } // 뒤로가기 방지
      );
    } catch (error: any) {
      console.error("❌ 결제 확인 실패:", error);
      Alert.alert("결제 확인 실패", error.message || "다시 시도해주세요.");
    } finally {
      setLoading(false);
    }
  };

  // ✅ 카카오페이도 동일하게 수정
  const confirmKakaoPaymentAndUpgrade = async (orderId: string) => {
    try {
      setLoading(true);

      await paymentAPI.confirmKakaoPayment(orderId);
      console.log("✅ 카카오페이 결제 확인 완료");

      await new Promise((resolve) => setTimeout(resolve, 1000));

      await AsyncStorage.setItem("membershipType", "PREMIUM");
      await AsyncStorage.removeItem("testMembershipType");
      console.log("✅ 로컬 PREMIUM 저장 완료");

      // ✅ 로그아웃
      await AsyncStorage.removeItem("accessToken");
      await AsyncStorage.removeItem("refreshToken");
      console.log("✅ 로그아웃 완료");

      Alert.alert(
        "업그레이드 완료! 🎉",
        "프리미엄 회원이 되셨습니다!\n더 나은 서비스를 위해 다시 로그인해주세요.",
        [
          {
            text: "로그인하러 가기",
            onPress: () => {
              navigation.dispatch(
                CommonActions.reset({
                  index: 0,
                  routes: [{ name: "Login" }],
                })
              );
            },
          },
        ],
        { cancelable: false }
      );
    } catch (error: any) {
      console.error("❌ 카카오페이 결제 확인 실패:", error);
      Alert.alert("결제 확인 실패", error.message || "다시 시도해주세요.");
    } finally {
      setLoading(false);
    }
  };

  const updateMembershipToPremium = async () => {
    try {
      await AsyncStorage.setItem("membershipType", "PREMIUM");
      await AsyncStorage.removeItem("testMembershipType");
      console.log("✅ 프리미엄 회원으로 업그레이드 완료 (테스트)");
    } catch (error) {
      console.error("회원 등급 업데이트 실패:", error);
    }
  };

  return (
    <View style={styles.container}>
      <LinearGradient
        colors={["#0a0a0a", "#1a1a2e", "#16213e", "#0f3460"]}
        style={StyleSheet.absoluteFill}
      />

      <SafeAreaView style={styles.safeArea} edges={["top"]}>
        <View style={styles.content}>
          {/* 성공 아이콘 */}
          <View style={styles.iconContainer}>
            <LinearGradient
              colors={["#4ade80", "#22c55e"]}
              style={styles.iconCircle}
            >
              <Icon name="checkmark-circle" size={80} color="#ffffff" />
            </LinearGradient>
          </View>

          {/* 제목 */}
          <Text style={styles.title}>결제 성공!</Text>
          <Text style={styles.subtitle}>
            프리미엄 회원으로 업그레이드되었습니다.{"\n"}
            모든 기능을 자유롭게 이용하세요! 🎉
          </Text>

          {/* 정보 카드 */}
          <View style={styles.infoCard}>
            <LinearGradient
              colors={["rgba(227,255,124,0.15)", "rgba(168,224,99,0.1)"]}
              style={styles.infoCardGradient}
            >
              <View style={styles.infoRow}>
                <Icon name="star" size={20} color="#e3ff7c" />
                <Text style={styles.infoText}> 무제한 챗봇</Text>
              </View>
              <View style={styles.infoRow}>
                <Icon name="calendar-outline" size={20} color="#e3ff7c" />
                <Text style={styles.infoText}>
                  매일 무제한 식단 & 루틴 추천
                </Text>
              </View>
              <View style={styles.infoRow}>
                <Icon name="flash-outline" size={20} color="#e3ff7c" />
                <Text style={styles.infoText}>AI 맞춤 분석 제공</Text>
              </View>
            </LinearGradient>
          </View>
        </View>
      </SafeAreaView>
    </View>
  );
};

const styles = StyleSheet.create({
  container: {
    flex: 1,
  },
  safeArea: {
    flex: 1,
  },
  content: {
    flex: 1,
    justifyContent: "center",
    alignItems: "center",
    paddingHorizontal: 20,
  },
  iconContainer: {
    marginBottom: 32,
  },
  iconCircle: {
    width: 150,
    height: 150,
    borderRadius: 75,
    alignItems: "center",
    justifyContent: "center",
    shadowColor: "#4ade80",
    shadowOffset: { width: 0, height: 8 },
    shadowOpacity: 0.4,
    shadowRadius: 20,
    elevation: 10,
  },
  title: {
    fontSize: 32,
    fontWeight: "800",
    color: "#ffffff",
    marginBottom: 12,
    letterSpacing: 0.5,
  },
  subtitle: {
    fontSize: 16,
    color: "#9ca3af",
    textAlign: "center",
    lineHeight: 24,
    marginBottom: 40,
    letterSpacing: 0.3,
  },
  infoCard: {
    width: "100%",
    marginBottom: 40,
    borderRadius: 16,
    overflow: "hidden",
  },
  infoCardGradient: {
    padding: 20,
    gap: 16,
    borderWidth: 1,
    borderColor: "rgba(227,255,124,0.2)",
    borderRadius: 16,
  },
  infoRow: {
    flexDirection: "row",
    alignItems: "center",
    gap: 12,
  },
  infoText: {
    fontSize: 15,
    color: "#ffffff",
    fontWeight: "500",
    letterSpacing: 0.3,
  },
  button: {
    width: "100%",
    borderRadius: 16,
    overflow: "hidden",
    shadowColor: "#e3ff7c",
    shadowOffset: { width: 0, height: 4 },
    shadowOpacity: 0.3,
    shadowRadius: 12,
    elevation: 8,
  },
  buttonGradient: {
    flexDirection: "row",
    alignItems: "center",
    justifyContent: "center",
    gap: 10,
    paddingVertical: 18,
  },
  buttonText: {
    fontSize: 17,
    fontWeight: "700",
    color: "#111827",
    letterSpacing: 0.5,
  },
});

export default PaymentSuccessScreen;
