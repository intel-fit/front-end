// src/screens/pay/PaymentSuccessScreen.tsx
import React, { useEffect } from "react";
import { View, Text, StyleSheet, TouchableOpacity, Alert } from "react-native";
import { SafeAreaView } from "react-native-safe-area-context";
import { Ionicons as Icon } from "@expo/vector-icons";
import { LinearGradient } from "expo-linear-gradient";
import { useNavigation } from "@react-navigation/native";
import AsyncStorage from "@react-native-async-storage/async-storage";
import { useRoute } from "@react-navigation/native";
import { paymentAPI, authAPI } from "../../services";

const PaymentSuccessScreen = () => {
  const navigation = useNavigation();
  const route = useRoute<any>();

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
      console.log("🔵 1단계: sessionId 받음:", sessionId);

      // 백엔드에 결제 완료 확인 (DB 업데이트)
      await paymentAPI.confirmStripePayment(sessionId);
      console.log("🔵 2단계: API 호출 완료");

      // ⭐ 짧은 딜레이 후 프로필 조회 (DB 업데이트 대기)
      await new Promise((resolve) => setTimeout(resolve, 1000)); // 1초 대기
      console.log("🔵 2.5단계: 1초 대기 완료");

      try {
        // 프로필 재조회해서 최신 membershipType 가져오기
        const profile = await authAPI.getProfile();
        console.log("🔵 3단계: 프로필 조회 완료:", profile.membershipType);
        console.log(
          "🔵 3-1단계: 전체 프로필:",
          JSON.stringify(profile, null, 2)
        );

        if (profile.membershipType === "PREMIUM") {
          // AsyncStorage 업데이트
          await AsyncStorage.setItem("membershipType", "PREMIUM");
          console.log("🔵 4단계: AsyncStorage 저장 완료");

          // testMembershipType도 제거 (충돌 방지)
          await AsyncStorage.removeItem("testMembershipType");
          console.log("🔵 5단계: testMembershipType 제거 완료");

          // 저장된 값 확인
          const saved = await AsyncStorage.getItem("membershipType");
          console.log("🔵 6단계: 저장 확인:", saved);

          console.log("✅ 프리미엄 회원으로 업그레이드 완료 (Stripe)");

          Alert.alert(
            "업그레이드 완료! 🎉",
            "프리미엄 회원으로 업그레이드되었습니다.\n모든 기능을 자유롭게 이용하세요!",
            [{ text: "확인" }]
          );
        } else {
          console.log(
            "❌ 서버 membershipType이 PREMIUM이 아님:",
            profile.membershipType
          );
          throw new Error(
            "서버에서 프리미엄 업그레이드가 확인되지 않았습니다."
          );
        }
      } catch (profileError: any) {
        // ⭐ 프로필 조회 실패 시에도 일단 PREMIUM으로 설정
        console.log(
          "⚠️ 프로필 조회 실패, 로컬만 업데이트:",
          profileError.message
        );
        await AsyncStorage.setItem("membershipType", "PREMIUM");
        await AsyncStorage.removeItem("testMembershipType");
        console.log("✅ 프리미엄 업그레이드 완료 (로컬만)");

        Alert.alert(
          "결제 완료! 🎉",
          "결제가 완료되었습니다.\n앱을 재시작하면 프리미엄 기능을 이용하실 수 있습니다.",
          [{ text: "확인" }]
        );
      }
    } catch (error: any) {
      console.error("❌ Stripe 결제 확인 실패:", error);
      console.error("❌ 에러 상세:", error.message);
      console.error("❌ 에러 스택:", error.stack);
      Alert.alert(
        "결제 확인 실패",
        "결제 확인에 실패했습니다. 고객센터로 문의해주세요.",
        [{ text: "확인" }]
      );
    }
  };

  const confirmKakaoPaymentAndUpgrade = async (orderId: string) => {
    try {
      console.log("🔵 1단계: orderId 받음:", orderId);

      // 백엔드에 결제 완료 확인
      await paymentAPI.confirmKakaoPayment(orderId);
      console.log("🔵 2단계: API 호출 완료");

      // 짧은 딜레이 후 프로필 조회
      await new Promise((resolve) => setTimeout(resolve, 3000));
      console.log("🔵 2.5단계: 3초 대기 완료");

      try {
        // 프로필 재조회
        const profile = await authAPI.getProfile();
        console.log("🔵 3단계: 프로필 조회 완료:", profile.membershipType);

        if (profile.membershipType === "PREMIUM") {
          // AsyncStorage 업데이트
          await AsyncStorage.setItem("membershipType", "PREMIUM");
          await AsyncStorage.removeItem("testMembershipType");
          console.log("🔵 4단계: AsyncStorage 저장 완료");

          console.log("✅ 프리미엄 회원으로 업그레이드 완료 (카카오페이)");

          Alert.alert(
            "업그레이드 완료! 🎉",
            "프리미엄 회원으로 업그레이드되었습니다.\n모든 기능을 자유롭게 이용하세요!",
            [{ text: "확인" }]
          );
        } else {
          throw new Error(
            "서버에서 프리미엄 업그레이드가 확인되지 않았습니다."
          );
        }
      } catch (profileError: any) {
        // 프로필 조회 실패 시에도 일단 PREMIUM으로 설정
        console.log(
          "⚠️ 프로필 조회 실패, 로컬만 업데이트:",
          profileError.message
        );
        await AsyncStorage.setItem("membershipType", "PREMIUM");
        await AsyncStorage.removeItem("testMembershipType");
        console.log("✅ 프리미엄 업그레이드 완료 (로컬만)");

        Alert.alert(
          "결제 완료! 🎉",
          "결제가 완료되었습니다.\n앱을 재시작하면 프리미엄 기능을 이용하실 수 있습니다.",
          [{ text: "확인" }]
        );
      }
    } catch (error: any) {
      console.error("❌ 카카오페이 결제 확인 실패:", error);
      console.error("❌ 에러 상세:", error.message);
      Alert.alert(
        "결제 확인 실패",
        "결제 확인에 실패했습니다. 고객센터로 문의해주세요.",
        [{ text: "확인" }]
      );
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

          {/* 버튼 */}
          <TouchableOpacity
            style={styles.button}
            onPress={() => navigation.navigate("Main" as never)}
            activeOpacity={0.9}
          >
            <LinearGradient
              colors={["#e3ff7c", "#a8e063"]}
              style={styles.buttonGradient}
            >
              <Text style={styles.buttonText}>홈으로 돌아가기</Text>
              <Icon name="arrow-forward" size={20} color="#111827" />
            </LinearGradient>
          </TouchableOpacity>
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