import React from "react";
import { View, Text, StyleSheet, TouchableOpacity } from "react-native";
import { SafeAreaView } from "react-native-safe-area-context";
import { Ionicons as Icon } from "@expo/vector-icons";
import { LinearGradient } from "expo-linear-gradient";
import { useNavigation } from "@react-navigation/native";

const PaymentCancelScreen = () => {
  const navigation = useNavigation();

  return (
    <View style={styles.container}>
      <LinearGradient
        colors={["#0a0a0a", "#1a1a2e", "#16213e", "#0f3460"]}
        style={StyleSheet.absoluteFill}
      />

      <SafeAreaView style={styles.safeArea} edges={["top"]}>
        <View style={styles.content}>
          {/* 취소 아이콘 */}
          <View style={styles.iconContainer}>
            <LinearGradient
              colors={["#f59e0b", "#d97706"]}
              style={styles.iconCircle}
            >
              <Icon name="alert-circle" size={80} color="#ffffff" />
            </LinearGradient>
          </View>

          {/* 제목 */}
          <Text style={styles.title}>결제 취소</Text>
          <Text style={styles.subtitle}>
            결제가 취소되었습니다.{"\n"}
            언제든지 다시 이용해 주세요!
          </Text>

          {/* 안내 카드 */}
          <View style={styles.infoCard}>
            <LinearGradient
              colors={["rgba(245,158,11,0.15)", "rgba(217,119,6,0.1)"]}
              style={styles.infoCardGradient}
            >
              <View style={styles.infoRow}>
                <Icon
                  name="information-circle-outline"
                  size={20}
                  color="#f59e0b"
                />
                <Text style={styles.infoText}>
                  결제가 정상적으로 취소되었습니다
                </Text>
              </View>
              <View style={styles.infoRow}>
                <Icon name="card-outline" size={20} color="#f59e0b" />
                <Text style={styles.infoText}>
                  카드 승인 취소는 즉시 처리됩니다
                </Text>
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
    shadowColor: "#f59e0b",
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
    borderColor: "rgba(245,158,11,0.2)",
    borderRadius: 16,
  },
  infoRow: {
    flexDirection: "row",
    alignItems: "center",
    gap: 12,
  },
  infoText: {
    flex: 1,
    fontSize: 14,
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
    paddingVertical: 18,
    alignItems: "center",
    justifyContent: "center",
  },
  buttonText: {
    fontSize: 17,
    fontWeight: "700",
    color: "#111827",
    letterSpacing: 0.5,
  },
});

export default PaymentCancelScreen;
