import React, { useState, useCallback } from "react";
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
import { useFocusEffect } from "@react-navigation/native";
import AsyncStorage from "@react-native-async-storage/async-storage";

const InBodyManualScreen = ({ navigation, route }: any) => {
  const [loading, setLoading] = useState(false);
  const inBodyId: number | string | undefined = route?.params?.inBodyId;
  const defaultValues = route?.params?.defaultValues;
  const [inBodyDates, setInBodyDates] = useState<string[]>([]);

  const normalizeDate = useCallback(
    (date: string) => (date.includes(".") ? date : date.replace(/-/g, ".")),
    []
  );

  const getManualBaseKey = useCallback(
    async () => {
      const storedUserId = await AsyncStorage.getItem("userId");
      return `manualInBody:${storedUserId || "guest"}`;
    },
    []
  );

  const loadInBodyDates = useCallback(async () => {
    const dateSet = new Set<string>();

    // 원격 API는 호출하지 않고, 로컬 저장된 수기 기록만 사용
    const manualBaseKey = await getManualBaseKey();
    const manualDatesKey = `${manualBaseKey}:dates`;
    const manualDatesRaw = await AsyncStorage.getItem(manualDatesKey);
    if (manualDatesRaw) {
      try {
        const manualDates: string[] = JSON.parse(manualDatesRaw);
        manualDates
          .map((date) => normalizeDate(date))
          .forEach((date) => dateSet.add(date));
      } catch (error) {
        console.error(
          "[INBODY MANUAL] 수기 날짜 목록 파싱 실패:",
          manualDatesRaw,
          error
        );
      }
    }

    setInBodyDates(Array.from(dateSet).sort());
  }, [getManualBaseKey, normalizeDate]);

  const storeManualPayload = useCallback(
    async (measurementDate: string, payload: InBodyPayload) => {
      const normalizedDate = normalizeDate(measurementDate);
      const manualBaseKey = await getManualBaseKey();
      const manualEntryKey = `${manualBaseKey}:${normalizedDate}`;
      const manualDatesKey = `${manualBaseKey}:dates`;

      const storedPayload = {
        ...payload,
        measurementDate: normalizedDate,
        savedAt: new Date().toISOString(),
        source: "manual",
      };

      try {
        await AsyncStorage.setItem(
          manualEntryKey,
          JSON.stringify(storedPayload)
        );

        const manualDatesRaw = await AsyncStorage.getItem(manualDatesKey);
        let manualDates: string[] = [];
        if (manualDatesRaw) {
          try {
            manualDates = JSON.parse(manualDatesRaw);
          } catch (error) {
            console.error(
              "[INBODY MANUAL] 수기 날짜 목록 파싱 실패:",
              manualDatesRaw,
              error
            );
            manualDates = [];
          }
        }

        if (!manualDates.includes(normalizedDate)) {
          manualDates.push(normalizedDate);
          manualDates.sort();
          await AsyncStorage.setItem(
            manualDatesKey,
            JSON.stringify(manualDates)
          );
        }
      } catch (error) {
        console.error("[INBODY MANUAL] 수기 데이터 저장 실패:", error);
      }
    },
    [getManualBaseKey, normalizeDate]
  );

  useFocusEffect(
    useCallback(() => {
      loadInBodyDates();
    }, [loadInBodyDates])
  );

  // 검증 가이드 생성 함수
  const getValidationGuide = (_payload?: InBodyPayload) => "";

  const handleSubmit = async (data: any) => {
    // 에러 처리에서 사용할 수 있도록 변수 선언
    let finalPayload: InBodyPayload | undefined;

    try {
      setLoading(true);
      console.log("인바디 수기 입력 저장:", data);

      // 폼 데이터를 API 요청 형식으로 변환
      // 테스트 결과 하이픈 형식(YYYY-MM-DD)이 성공하므로 기본값으로 사용
      const measurementDateRaw =
        data.date || new Date().toISOString().slice(0, 10);
      const measurementDate = measurementDateRaw; // 하이픈 형식 그대로 사용 (YYYY-MM-DD)

      // 숫자 파싱 헬퍼 함수 (NaN, Infinity 체크, 소수점 정밀도 조정)
      const parseNumber = (value: string | undefined): number | undefined => {
        if (!value || value.trim() === "") return undefined;
        const num = parseFloat(value);
        if (isNaN(num) || !isFinite(num)) return undefined;
        // 소수점 2자리로 반올림하여 부동소수점 오차 제거
        return Math.round(num * 100) / 100;
      };

      // API 스펙에 따르면 muscleMass와 skeletalMuscleMass를 동시에 전송해야 함
      // bodyFatPercentage는 퍼센트 값(0~100)으로 전송
      const normalizePercent = (
        num: number | undefined
      ): number | undefined => {
        if (num === undefined) return undefined;
        // 사용자가 0~1 소수로 입력한 경우(예: 0.23) → 퍼센트로 환산
        if (num <= 1) return +(num * 100).toFixed(2);
        return +num.toFixed(2);
      };
      // muscleMass가 입력되지 않으면 skeletalMuscleMass와 동일한 값으로 설정
      const smmValue = parseNumber(data.smm);
      const muscleMassValue =
        parseNumber(data.muscleMass) ?? smmValue;
      
      console.log("[INBODY] 파싱된 값:", {
        smm: smmValue,
        muscleMass: parseNumber(data.muscleMass),
        muscleMassValue: muscleMassValue,
      });
      
      const payload: InBodyPayload = {
        measurementDate,
        weight: parseNumber(data.weight),
        muscleMass: muscleMassValue,
        skeletalMuscleMass: smmValue,
        bodyFatMass: parseNumber(data.bfm),
        bodyFatPercentage: normalizePercent(parseNumber(data.pbf)),
        leftArmMuscle: parseNumber(data.lArm),
        rightArmMuscle: parseNumber(data.rArm),
        trunkMuscle: parseNumber(data.trunk),
        leftLegMuscle: parseNumber(data.lLeg),
        rightLegMuscle: parseNumber(data.rLeg),
        leftArmFat: parseNumber(data.lArmFat),
        rightArmFat: parseNumber(data.rArmFat),
        trunkFat: parseNumber(data.trunkFat),
        leftLegFat: parseNumber(data.lLegFat),
        rightLegFat: parseNumber(data.rLegFat),
        totalBodyWater: parseNumber(data.tbw),
        protein: parseNumber(data.protein),
        mineral: parseNumber(data.mineral),
        bodyFatPercentageStandard: parseNumber(data.pbfStd),
        obesityDegree: parseNumber(data.obesityDegree),
        visceralFatLevel: parseNumber(data.vfa),
        basalMetabolicRate: parseNumber(data.bmr),
        bmi: parseNumber(data.bmi),
      };

      // undefined 필드 제거 (서버에 불필요한 필드 전송 방지)
      let cleanPayload = Object.fromEntries(
        Object.entries(payload).filter(([_, value]) => value !== undefined)
      ) as InBodyPayload;

      // muscleMass가 없으면 skeletalMuscleMass와 동일한 값으로 설정 (cleanPayload 생성 전에 처리)
      if (cleanPayload.skeletalMuscleMass && !cleanPayload.muscleMass) {
        cleanPayload.muscleMass = cleanPayload.skeletalMuscleMass;
      }

      // 에러 처리에서 사용할 수 있도록 변수 저장
      finalPayload = cleanPayload;

      // muscleMass가 비어 있으면 골격근량과 동일하게 설정
      if (!cleanPayload.muscleMass) {
        cleanPayload.muscleMass = cleanPayload.skeletalMuscleMass;
      }

      // 검사일이 없으면 오늘 날짜로 자동 설정
      if (!cleanPayload.measurementDate) {
        cleanPayload.measurementDate = new Date().toISOString().slice(0, 10);
      }

      console.log(
        "[INBODY] 최종 페이로드:",
        JSON.stringify(cleanPayload, null, 2)
      );

      // undefined 필드 제거 헬퍼
      const removeUndefined = (obj: any): InBodyPayload => {
        return Object.fromEntries(
          Object.entries(obj).filter(([_, value]) => value !== undefined)
        ) as InBodyPayload;
      };

      let response: any;
      try {
        // API 호출 직전 최종 확인
        const finalPayloadForApi = { ...cleanPayload };
        if (finalPayloadForApi.skeletalMuscleMass && !finalPayloadForApi.muscleMass) {
          finalPayloadForApi.muscleMass = finalPayloadForApi.skeletalMuscleMass;
        }
        console.log("[INBODY] API 전송 페이로드:", JSON.stringify(finalPayloadForApi, null, 2));
        
        response = inBodyId
          ? await patchInBody(inBodyId, finalPayloadForApi)
          : await postInBody(finalPayloadForApi);
      } catch (e: any) {
        // 400 또는 500이면 서버 스펙 불일치 가능성 → 대체 포맷으로 재시도
        const is400 = e?.response?.status === 400;
        const is500 = e?.response?.status === 500;
        if (!is400 && !is500) throw e;

        // 대안 1: 날짜를 점(.) 포맷으로 변경 시도
        const alt1: InBodyPayload = removeUndefined({
          ...cleanPayload,
          measurementDate: (
            cleanPayload.measurementDate || measurementDate
          ).replace(/-/g, "."),
          muscleMass: cleanPayload.muscleMass ?? cleanPayload.skeletalMuscleMass,
        });

        try {
          console.log(
            "[INBODY] 대안1 페이로드:",
            JSON.stringify(alt1, null, 2)
          );
          response = inBodyId
            ? await patchInBody(inBodyId, alt1)
            : await postInBody(alt1);
          console.log("[INBODY] 대안1 페이로드 성공");
        } catch (e2: any) {
          // 대안 2: 날짜 하이픈(-) + 모든 필드 포함
          try {
            const alt2: InBodyPayload = removeUndefined({
              ...cleanPayload,
              muscleMass: cleanPayload.muscleMass ?? cleanPayload.skeletalMuscleMass,
            });

            console.log(
              "[INBODY] 대안2 페이로드:",
              JSON.stringify(alt2, null, 2)
            );
            response = inBodyId
              ? await patchInBody(inBodyId, alt2)
              : await postInBody(alt2);
            console.log("[INBODY] 대안2 페이로드 성공");
          } catch (e3: any) {
            // 대안 3: muscleMass만 전송 (skeletalMuscleMass 제외)
            try {
              const alt3: InBodyPayload = removeUndefined({
                measurementDate:
                  cleanPayload.measurementDate || measurementDate,
                weight: cleanPayload.weight,
                muscleMass:
                  cleanPayload.muscleMass ?? cleanPayload.skeletalMuscleMass,
                // skeletalMuscleMass 제외
              });
              console.log(
                "[INBODY] 대안3 페이로드 (muscleMass만):",
                JSON.stringify(alt3, null, 2)
              );
              response = inBodyId
                ? await patchInBody(inBodyId, alt3)
                : await postInBody(alt3);
              console.log("[INBODY] 대안3 페이로드 성공");
            } catch (e4: any) {
              // 대안 4: skeletalMuscleMass만 전송 (muscleMass 제외)
              const alt4: InBodyPayload = removeUndefined({
                measurementDate:
                  cleanPayload.measurementDate || measurementDate,
                weight: cleanPayload.weight,
                skeletalMuscleMass:
                  cleanPayload.skeletalMuscleMass ?? cleanPayload.muscleMass,
                // muscleMass 제외
              });
              console.log(
                "[INBODY] 대안4 페이로드 (skeletalMuscleMass만):",
                JSON.stringify(alt4, null, 2)
              );
              response = inBodyId
                ? await patchInBody(inBodyId, alt4)
                : await postInBody(alt4);
              console.log("[INBODY] 대안4 페이로드 성공");
            }
          }
        }
      }

      if (response.success) {
        const inBodyId = response.inBody?.id ?? "N/A";
        await storeManualPayload(
          cleanPayload.measurementDate || measurementDate,
          cleanPayload
        );
        await loadInBodyDates();
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
      console.error("인바디 저장 에러 상세:", {
        message: error.message,
        status: error.response?.status,
        statusText: error.response?.statusText,
        data: error.response?.data,
        config: error.config,
      });

      let errorMessage = "";
      let errorTitle = "저장 실패";
      let errorType = ""; // "입력 오류" 또는 "서버 오류" 또는 "네트워크 오류"

      // 클라이언트 측 검증 결과
      let clientValidation = "";
      if (finalPayload) {
        clientValidation = "";
      }

      if (error.response?.status === 409) {
        errorType = "입력 오류";
        errorTitle = "중복 오류";
        errorMessage =
          "해당 날짜에 이미 인바디 기록이 존재합니다.\n\n다른 날짜를 선택하거나 기존 기록을 수정해주세요.";
      } else if (error.response?.status === 400) {
        errorType = "입력 오류";
        errorTitle = "입력 오류";
        const serverData = error.response?.data;
        const serverMessage =
          serverData?.message || "입력한 데이터가 올바르지 않습니다.";

        // 서버에서 상세 에러 정보를 제공하는 경우
        if (serverData?.errors) {
          // 필드별 에러 메시지가 있는 경우
          const fieldErrors = Object.entries(serverData.errors)
            .map(([field, message]) => `  • ${field}: ${message}`)
            .join("\n");
          errorMessage = `${serverMessage}\n\n서버 검증 실패 필드:\n${fieldErrors}`;
        } else if (serverData?.field) {
          // 특정 필드가 문제인 경우
          errorMessage = `${serverMessage}\n\n문제 필드: ${serverData.field}`;
        } else {
          // 전송한 페이로드 정보와 검증 가이드 포함
          try {
            const payloadInfo = finalPayload
              ? `\n\n📤 전송한 값:\n${Object.entries(finalPayload)
                  .map(([key, value]) => `  ${key}: ${value}`)
                  .join("\n")}`
              : "";

            // 검증 가이드 추가
            const validationGuide = finalPayload
              ? getValidationGuide(finalPayload)
              : "";

            // 서버 응답의 상세 정보
            const serverDetails = serverData?.code
              ? `\n\n서버 에러 코드: ${serverData.code}`
              : "";

            // 클라이언트 검증 통과했는데도 서버가 거부하는 경우
            const analysis =
              clientValidation.includes("✓") && !clientValidation.includes("❌")
                ? `\n\n⚠ 분석: 클라이언트 검증은 통과했지만 서버가 거부했습니다.\n이는 서버 측 검증 규칙이 더 엄격하거나 다른 필드에 문제가 있을 수 있습니다.`
                : "";

            errorMessage = `${serverMessage}${serverDetails}${analysis}\n\n원인: 서버가 입력값을 거부했습니다.${clientValidation}${payloadInfo}${validationGuide}`;
          } catch (e) {
            // payloadInfo 생성 실패 시 기본 메시지만 표시
            errorMessage = `${serverMessage}${clientValidation}`;
          }
        }
      } else if (error.response?.status === 401) {
        errorType = "인증 오류";
        errorTitle = "인증 오류";
        errorMessage = "인증이 필요합니다.\n\n다시 로그인해주세요.";
      } else if (error.response?.status === 500) {
        errorType = "서버 오류";
        errorTitle = "서버 오류";
        const serverMessage =
          error.response?.data?.message || "서버 내부 오류가 발생했습니다.";
        errorMessage = `${serverMessage}\n\n원인: 서버 측 문제입니다.\n\n관리자에게 문의해주세요.\n\n에러 코드: COMMON_002${clientValidation}`;
      } else if (error.message?.includes("Network") || !error.response) {
        errorType = "네트워크 오류";
        errorTitle = "네트워크 오류";
        errorMessage =
          "네트워크 연결에 실패했습니다.\n\n원인: 인터넷 연결 문제 또는 서버 접속 불가\n\n인터넷 연결을 확인해주세요.";
      } else {
        errorType = "알 수 없는 오류";
        errorMessage = `알 수 없는 오류가 발생했습니다.\n\n상태 코드: ${
          error.response?.status || "N/A"
        }\n에러 메시지: ${error.message}${clientValidation}`;
      }

      // 최종 에러 메시지에 타입 표시
      const finalMessage = `[${errorType}]\n\n${errorMessage}`;

      Alert.alert(errorTitle, finalMessage);
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
      <InBodyManualForm
        onSubmit={handleSubmit}
        defaultValues={defaultValues}
        inBodyDates={inBodyDates}
      />
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
