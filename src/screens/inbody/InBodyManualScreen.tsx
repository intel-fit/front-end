import React, { useState } from "react";
import {
  View,
  Text,
  StyleSheet,
  TouchableOpacity,
  Alert,
  ActivityIndicator,
} from "react-native";
import { SafeAreaView } from "react-native-safe-area-context";
import { Ionicons as Icon } from "@expo/vector-icons";
import InBodyManualForm from "../../components/common/InBodyManualForm";
import { postInBody, patchInBody, InBodyPayload } from "../../utils/inbodyApi";

const InBodyManualScreen = ({ navigation, route }: any) => {
  const [loading, setLoading] = useState(false);
  const inBodyId: number | string | undefined = route?.params?.inBodyId;
  const defaultValues = route?.params?.defaultValues;

  const handleSubmit = async (data: any) => {
    try {
      setLoading(true);
      console.log("인바디 수기 입력 저장:", data);

      // 폼 데이터를 API 요청 형식으로 변환
      const payload: InBodyPayload = {
        measurementDate: data.date || new Date().toISOString().slice(0, 10),
        weight: parseFloat(data.weight) || 0,
        skeletalMuscleMass: parseFloat(data.smm) || 0,
        bodyFatMass: parseFloat(data.bfm) || 0,
        bodyFatPercentage: parseFloat(data.pbf) || 0,
        leftArmMuscle: parseFloat(data.lArm) || undefined,
        rightArmMuscle: parseFloat(data.rArm) || undefined,
        trunkMuscle: parseFloat(data.trunk) || undefined,
        leftLegMuscle: parseFloat(data.lLeg) || undefined,
        rightLegMuscle: parseFloat(data.rLeg) || undefined,
        bmi: parseFloat(data.bmi) || 0,
        visceralFatLevel: parseFloat(data.vfa) || undefined,
        basalMetabolicRate: parseFloat(data.bmr) || undefined,
      };

      // 필수 필드 검증
      if (
        !payload.measurementDate ||
        !payload.weight ||
        !payload.skeletalMuscleMass
      ) {
        Alert.alert(
          "입력 오류",
          "필수 항목(검사일, 체중, 골격근량)을 입력해주세요."
        );
        return;
      }

      const response = inBodyId
        ? await patchInBody(inBodyId, payload)
        : await postInBody(payload);

      if (response.success) {
        const inBodyId = response.inBody?.id ?? "N/A";
        console.log("[INBODY] 등록된 인바디 ID:", inBodyId);
        Alert.alert(
          inBodyId ? "수정 완료" : "저장 완료",
          `${
            response.message ||
            (inBodyId
              ? "인바디 정보가 수정되었습니다."
              : "인바디 정보가 저장되었습니다.")
          }\n\n인바디 ID: ${inBodyId}`,
          [
            {
              text: "확인",
              onPress: () => navigation.goBack(),
            },
          ]
        );
      } else {
        Alert.alert(
          "저장 실패",
          response.message || "인바디 정보 저장에 실패했습니다."
        );
      }
    } catch (error: any) {
      console.error("인바디 저장 에러:", error);
      let errorMessage = "인바디 정보 저장에 실패했습니다.";

      if (error.response?.status === 409) {
        errorMessage = "해당 날짜에 이미 인바디 기록이 존재합니다.";
      } else if (error.response?.status === 400) {
        errorMessage = "입력한 데이터가 올바르지 않습니다.";
      } else if (error.response?.status === 401) {
        errorMessage = "인증이 필요합니다. 다시 로그인해주세요.";
      } else if (error.message?.includes("Network")) {
        errorMessage =
          "네트워크 연결에 실패했습니다. 인터넷 연결을 확인해주세요.";
      }

      Alert.alert("저장 실패", errorMessage);
    } finally {
      setLoading(false);
    }
  };

  return (
    <SafeAreaView style={styles.container} edges={["top"]}>
      <View style={styles.header}>
        <TouchableOpacity onPress={() => navigation.goBack()}>
          <Icon name="chevron-back" size={28} color="#ffffff" />
        </TouchableOpacity>
        <Text style={styles.headerTitle}>인바디 수기 입력</Text>
        <View style={{ width: 28 }} />
      </View>
      {loading && (
        <View style={styles.loadingContainer} pointerEvents="none">
          <ActivityIndicator size="large" color="#d6ff4b" />
          <Text style={styles.loadingText}>저장 중...</Text>
        </View>
      )}
      <InBodyManualForm onSubmit={handleSubmit} defaultValues={defaultValues} />
    </SafeAreaView>
  );
};

const styles = StyleSheet.create({
  container: {
    flex: 1,
    backgroundColor: "#1c1c1c",
  },
  header: {
    flexDirection: "row",
    justifyContent: "space-between",
    alignItems: "center",
    paddingVertical: 16,
    paddingHorizontal: 20,
    borderBottomWidth: 1,
    borderBottomColor: "#333333",
  },
  headerTitle: {
    fontSize: 18,
    fontWeight: "700",
    color: "#ffffff",
  },
  loadingContainer: {
    position: "absolute",
    top: 0,
    left: 0,
    right: 0,
    bottom: 0,
    backgroundColor: "rgba(0, 0, 0, 0.7)",
    justifyContent: "center",
    alignItems: "center",
    zIndex: 1000,
  },
  loadingText: {
    marginTop: 12,
    fontSize: 14,
    color: "#ffffff",
  },
});

export default InBodyManualScreen;
