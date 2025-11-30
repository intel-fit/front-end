import React from "react";
import { View, Text, StyleSheet, TouchableOpacity } from "react-native";
import { SafeAreaView } from "react-native-safe-area-context";
import { Ionicons as Icon } from "@expo/vector-icons";
import { LinearGradient } from "expo-linear-gradient";
import { useNavigation } from "@react-navigation/native";

const PaymentFailScreen = () => {
  const navigation = useNavigation();

  return (
    <View style={styles.container}>
      <LinearGradient
        colors={["#0a0a0a", "#1a1a2e", "#16213e", "#0f3460"]}
        style={StyleSheet.absoluteFill}
      />

      <SafeAreaView style={styles.safeArea} edges={["top"]}>
        <View style={styles.content}>
          {/* 실패 아이콘 */}
          <View style={styles.iconContainer}>
            <LinearGradient
              colors={["#ef4444", "#dc2626"]}
              style={styles.iconCircle}
            >
              <Icon name="close-circle" size={80} color="#ffffff" />
            </LinearGradient>
          </View>

          {/* 제목 */}
          <Text style={styles.title}>결제 실패</Text>
          <Text style={styles.subtitle}>
            결제 처리 중 오류가 발생했습니다.{"\n"}
            다시 시도해 주세요.
          </Text>

          {/* 안내 카드 */}
          <View style={styles.infoCard}>
            <LinearGradient
              colors={["rgba(239,68,68,0.15)", "rgba(220,38,38,0.1)"]}
              style={styles.infoCardGradient}
            >
              <View style={styles.infoRow}>
                <Icon name="alert-circle-outline" size={20} color="#ef4444" />
                <Text style={styles.infoText}>
                  카드 정보를 다시 확인해 주세요
                </Text>
              </View>
              <View style={styles.infoRow}>
                <Icon name="card-outline" size={20} color="#ef4444" />
                <Text style={styles.infoText}>
                  결제 한도가 충분한지 확인해 주세요
                </Text>
              </View>
              <View style={styles.infoRow}>
                <Icon name="help-circle-outline" size={20} color="#ef4444" />
                <Text style={styles.infoText}>
                  문제가 지속되면 고객센터로 문의하세요
                </Text>
              </View>
            </LinearGradient>
          </View>

          {/* 버튼 */}
          <View style={styles.buttonGroup}>
            <TouchableOpacity
              style={styles.primaryButton}
              onPress={() => navigation.goBack()}
              activeOpacity={0.9}
            >
              <LinearGradient
                colors={["#e3ff7c", "#a8e063"]}
                style={styles.buttonGradient}
              >
                <Icon name="refresh" size={20} color="#111827" />
                <Text style={styles.primaryButtonText}>다시 시도</Text>
              </LinearGradient>
            </TouchableOpacity>

            <TouchableOpacity
              style={styles.secondaryButton}
              onPress={() => navigation.navigate("Main" as never)}
              activeOpacity={0.8}
            >
              <LinearGradient
                colors={["rgba(255,255,255,0.1)", "rgba(255,255,255,0.05)"]}
                style={styles.secondaryButtonGradient}
              >
                <Text style={styles.secondaryButtonText}>홈으로</Text>
              </LinearGradient>
            </TouchableOpacity>
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
    shadowColor: "#ef4444",
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
    borderColor: "rgba(239,68,68,0.2)",
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
  buttonGroup: {
    width: "100%",
    gap: 12,
  },
  primaryButton: {
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
  primaryButtonText: {
    fontSize: 17,
    fontWeight: "700",
    color: "#111827",
    letterSpacing: 0.5,
  },
  secondaryButton: {
    borderRadius: 16,
    overflow: "hidden",
  },
  secondaryButtonGradient: {
    paddingVertical: 16,
    alignItems: "center",
    justifyContent: "center",
    borderWidth: 1,
    borderColor: "rgba(255,255,255,0.2)",
    borderRadius: 16,
  },
  secondaryButtonText: {
    fontSize: 16,
    fontWeight: "600",
    color: "#ffffff",
    letterSpacing: 0.3,
  },
});

export default PaymentFailScreen;
