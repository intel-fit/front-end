import React, { useState, useMemo, useEffect, useCallback } from "react";
import { useFocusEffect } from "@react-navigation/native";
import {
  View,
  Text,
  StyleSheet,
  ScrollView,
  TouchableOpacity,
  ActivityIndicator,
} from "react-native";
import { SafeAreaView } from "react-native-safe-area-context";
import { Ionicons as Icon } from "@expo/vector-icons";
import { getLatestInBody } from "../../utils/inbodyApi";
import AsyncStorage from "@react-native-async-storage/async-storage";
import { eventBus } from "../../utils/eventBus";

const InBodyScreen = ({ navigation, route }: any) => {
  const [inBodyData, setInBodyData] = useState<any>(null);
  const [loading, setLoading] = useState(true);
  const [userName, setUserName] = useState<string | null>(null);
  const fromPhotoUpload = route?.params?.fromPhotoUpload;


  const parseNumericValue = useCallback((value: any): number | undefined => {
    if (value === null || value === undefined) return undefined;
    if (typeof value === "number" && isFinite(value)) {
      return Math.round(value * 100) / 100;
    }
    if (typeof value === "string") {
      const match = value.match(/-?\d+(\.\d+)?/);
      if (!match) return undefined;
      const parsed = parseFloat(match[0]);
      return isFinite(parsed) ? Math.round(parsed * 100) / 100 : undefined;
    }
    return undefined;
  }, []);

  const parseRangeRatio = useCallback(
    (rawValue: any): number | null => {
      if (typeof rawValue !== "string") {
        return null;
      }

      const value = parseNumericValue(rawValue);
      if (value === undefined) {
        return null;
      }

      const rangeMatch = rawValue.match(/\(([^)]+)\)/);
      if (!rangeMatch) {
        return null;
      }

      const [minRaw, maxRaw] = rangeMatch[1]
        .split("~")
        .map((part) => parseNumericValue(part));

      if (
        minRaw === undefined ||
        maxRaw === undefined ||
        !isFinite(minRaw) ||
        !isFinite(maxRaw) ||
        maxRaw <= minRaw
      ) {
        return null;
      }

      const ratio = (value - minRaw) / (maxRaw - minRaw);
      return Math.max(0, Math.min(1, ratio));
    },
    [parseNumericValue]
  );

  const resolveBarPercentage = useCallback(
    (rawValue: any, status?: string) => {
      const clamp = (percent: number) =>
        Math.min(95, Math.max(10, Math.round(percent)));

      const ratio = parseRangeRatio(rawValue);
      if (ratio !== null) {
        return clamp(45 + ratio * 45);
      }

      const normalizedStatus = (status ?? "")
        .toString()
        .replace(/\s+/g, "")
        .toLowerCase();

      if (normalizedStatus.length > 0) {
        if (
          normalizedStatus.includes("이상") ||
          normalizedStatus.includes("높음") ||
          normalizedStatus.includes("증가") ||
          normalizedStatus.includes("above") ||
          normalizedStatus.includes("high")
        ) {
          return clamp(85);
        }
        if (
          normalizedStatus.includes("이하") ||
          normalizedStatus.includes("낮음") ||
          normalizedStatus.includes("감소") ||
          normalizedStatus.includes("below") ||
          normalizedStatus.includes("low")
        ) {
          return clamp(30);
        }
        if (
          normalizedStatus.includes("표준") ||
          normalizedStatus.includes("정상") ||
          normalizedStatus.includes("normal")
        ) {
          return clamp(55);
        }
      }

      return clamp(55);
    },
    [parseRangeRatio]
  );



  // API로 최신 인바디 정보 조회 (항상 가장 최신 저장 이력 표시)
  const fetchInBodyData = useCallback(async () => {
    try {
      setLoading(true);

      console.log("[INBODY SCREEN] 최신 인바디 데이터 조회 시작");
      const response = await getLatestInBody();
      
      console.log("[INBODY SCREEN] API 응답:", {
        hasResponse: !!response,
        responseType: typeof response,
        isSuccess: response?.success,
        hasInBody: !!response?.inBody,
        responseKeys: response ? Object.keys(response) : [],
      });

      // 응답 구조 처리: { success: true, inBody: {...} } 또는 직접 inBody 객체
      const latest = response?.success ? response.inBody : response;

      console.log("[INBODY SCREEN] 처리된 latest 데이터:", {
        hasLatest: !!latest,
        hasMeasurementDate: !!latest?.measurementDate,
        measurementDate: latest?.measurementDate,
        latestKeys: latest ? Object.keys(latest) : [],
      });

      if (latest && latest.measurementDate) {
        const normalizedDate = latest.measurementDate.includes(".")
          ? latest.measurementDate
          : latest.measurementDate.replace(/-/g, ".");

        console.log("[INBODY][FETCH][LATEST]", {
          normalizedDate,
          source: latest?.source || "api",
          segmental: {
            segmentalMuscleAnalysis: latest?.segmentalMuscleAnalysis,
            segmentalMuscleMass: latest?.segmentalMuscleMass,
            rightArmMuscle: latest?.rightArmMuscle,
            leftArmMuscle: latest?.leftArmMuscle,
            trunkMuscle: latest?.trunkMuscle,
            rightLegMuscle: latest?.rightLegMuscle,
            leftLegMuscle: latest?.leftLegMuscle,
          },
        });
        if (__DEV__) {
          try {
            console.log(
              "[INBODY][FETCH][LATEST][RAW]",
              JSON.stringify(latest, null, 2)
            );
          } catch (error) {
            console.log("[INBODY][FETCH][LATEST][RAW] stringify 실패", error);
          }
        }

        setInBodyData({
          ...latest,
          measurementDate: normalizedDate,
        });
        console.log("[INBODY SCREEN] 인바디 데이터 설정 완료");
        console.log("[INBODY SCREEN] 부위별 근육 데이터:", {
          rightArmMuscle: latest?.rightArmMuscle,
          leftArmMuscle: latest?.leftArmMuscle,
          trunkMuscle: latest?.trunkMuscle,
          rightLegMuscle: latest?.rightLegMuscle,
          leftLegMuscle: latest?.leftLegMuscle,
        });
        console.log("[INBODY SCREEN] 부위별 체지방 데이터:", {
          rightArmFat: latest?.rightArmFat,
          leftArmFat: latest?.leftArmFat,
          trunkFat: latest?.trunkFat,
          rightLegFat: latest?.rightLegFat,
          leftLegFat: latest?.leftLegFat,
        });
      } else {
        console.warn("[INBODY][FETCH][LATEST] 유효한 데이터가 없습니다.", {
          response,
          latest,
          hasMeasurementDate: latest?.measurementDate,
        });
        setInBodyData(null);
      }
    } catch (error: any) {
      console.error("[INBODY SCREEN] API 데이터 로드 실패:", {
        message: error?.message,
        status: error?.response?.status,
        statusText: error?.response?.statusText,
        errorCode: error?.response?.data?.code,
        errorMessage: error?.response?.data?.message,
        data: error?.response?.data,
        stack: error?.stack,
      });
      setInBodyData(null);
    } finally {
      setLoading(false);
      console.log("[INBODY SCREEN] 로딩 완료");
    }
  }, []);

  // 화면이 포커스될 때마다 최신 데이터 조회
  useFocusEffect(
    useCallback(() => {
      fetchInBodyData();
    }, [fetchInBodyData])
  );

  // 날짜 정규화 헬퍼 함수 (YYYY-MM-DD 형식으로 통일)
  const normalizeDateForComparison = useCallback((date: string): string => {
    if (!date) return "";
    // 점(.)을 하이픈(-)으로 변경
    return date.replace(/\./g, "-");
  }, []);

  // 인바디 업데이트 이벤트 구독
  useEffect(() => {
    const unsubscribe = eventBus.on("inbodyUpdated", async (payload) => {
      console.log("[INBODY SCREEN] 인바디 업데이트 이벤트 수신, 데이터 새로고침", payload);
      
      try {
        setLoading(true);
        
        // 최신 기록 조회
        const latestRecord = await getLatestInBody();
        
        if (latestRecord) {
          const latestData = latestRecord?.success ? latestRecord.inBody : latestRecord;
          
          // 저장된 날짜가 있으면 날짜 비교
          if (payload.measurementDate && latestData?.measurementDate) {
            const normalizedLatestDate = normalizeDateForComparison(latestData.measurementDate);
            const normalizedPayloadDate = normalizeDateForComparison(payload.measurementDate);
            
            if (normalizedLatestDate === normalizedPayloadDate) {
              // 날짜가 일치하면 최신 기록 사용
              const normalizedDate = latestData.measurementDate.includes(".")
                ? latestData.measurementDate
                : latestData.measurementDate.replace(/-/g, ".");
              
              setInBodyData({
                ...latestData,
                measurementDate: normalizedDate,
              });
              console.log("[INBODY SCREEN] 저장된 날짜의 데이터 로드 완료");
              return;
            } else {
              console.log("[INBODY SCREEN] 최신 기록의 날짜가 일치하지 않음, 최신 데이터 사용");
            }
          }
          
          // 날짜가 일치하지 않거나 저장된 날짜 정보가 없으면 최신 데이터 사용
          if (latestData && latestData.measurementDate) {
            const normalizedDate = latestData.measurementDate.includes(".")
              ? latestData.measurementDate
              : latestData.measurementDate.replace(/-/g, ".");
            
            setInBodyData({
              ...latestData,
              measurementDate: normalizedDate,
            });
            console.log("[INBODY SCREEN] 최신 데이터 로드 완료");
          } else {
            setInBodyData(null);
          }
        } else {
          setInBodyData(null);
        }
      } catch (error: any) {
        console.error("[INBODY SCREEN] 데이터 조회 실패:", error);
        setInBodyData(null);
      } finally {
        setLoading(false);
      }
    });

    return () => {
      unsubscribe();
    };
  }, [normalizeDateForComparison]);


  // API 데이터에서 값 추출 헬퍼 함수
  const extractValue = (value: string | number | undefined): string => {
    if (value === undefined || value === null) return "N/A";
    if (typeof value === "number") {
      if (!isFinite(value)) return "N/A";
      return `${Math.round(value * 10) / 10}`;
    }
    const valueStr = String(value);
    const match = valueStr.match(/^([\d.]+)/);
    return match ? match[1] : valueStr;
  };

  const extractRange = (value: string | number | undefined): string => {
    if (value === undefined || value === null) return "";
    if (typeof value === "number") return "";
    const match = value.match(/\(([^)]+)\)/);
    return match ? `(${match[1]})` : "";
  };

  useEffect(() => {
    (async () => {
      try {
        const storedUserName = await AsyncStorage.getItem("userName");
        if (storedUserName) {
          setUserName(storedUserName);
        }
      } catch (error) {
        console.error("[INBODY] 사용자 정보 로드 실패:", error);
      }
    })();
  }, []);

  const segmentalMuscleItems = useMemo(() => {
    if (!inBodyData) {
      return [
        { label: "오른팔", value: undefined, status: undefined },
        { label: "왼팔", value: undefined, status: undefined },
        { label: "몸통", value: undefined, status: undefined },
        { label: "오른다리", value: undefined, status: undefined },
        { label: "왼다리", value: undefined, status: undefined },
      ];
    }

    const analysis: any = inBodyData.segmentalMuscleAnalysis || {};
    const mass: any =
      inBodyData.segmentalMuscleMass ||
      inBodyData.segmentalMuscle ||
      inBodyData.segmentalLeanBodyMass ||
      {};

    const collectCandidateValues = (input: any): any[] => {
      if (input === null || input === undefined) return [];
      if (typeof input === "number" || typeof input === "string") {
        return [input];
      }
      if (Array.isArray(input)) {
        return input.flatMap((item) => collectCandidateValues(item));
      }
      if (typeof input === "object") {
        const priorityKeys = [
          "value",
          "current",
          "currentValue",
          "currentWeight",
          "currentKg",
          "weight",
          "kg",
          "mass",
          "amount",
          "score",
          "data",
        ];
        const collected: any[] = [];
        priorityKeys.forEach((key) => {
          if (Object.prototype.hasOwnProperty.call(input, key)) {
            collected.push((input as any)[key]);
          }
        });
        Object.values(input).forEach((val) => {
          if (typeof val !== "object") {
            collected.push(val);
          }
        });
        return collected.flatMap((val) => collectCandidateValues(val));
      }
      return [];
    };

    const resolveStatusLabel = (raw: any): string | undefined => {
      if (!raw) return undefined;
      if (typeof raw === "string") return raw;
      const candidates = collectCandidateValues(raw);
      const firstString = candidates.find((candidate) => {
        if (typeof candidate !== "string") return false;
        return candidate.length > 0;
      });
      if (typeof raw.status === "string") {
        return raw.status;
      }
      return typeof firstString === "string" ? firstString : undefined;
    };

    const candidates = [
      {
        label: "오른팔",
        keys: [
          inBodyData.rightArmMuscle,
          inBodyData.muscleFatAnalysis?.rightArmMuscle,
          inBodyData.segmentalMuscleMass?.rightArm,
          inBodyData.segmentalMuscle?.rightArm,
          inBodyData.segmentalLeanBodyMass?.rightArm,
          mass.rightArm,
          analysis.rightArm,
          analysis.rightArmValue,
          ...collectCandidateValues([
            inBodyData.rightArmMuscle,
            mass.rightArm,
            analysis.rightArm,
            analysis.rightArmValue,
          ]),
        ],
        status: resolveStatusLabel(analysis.rightArm),
      },
      {
        label: "왼팔",
        keys: [
          inBodyData.leftArmMuscle,
          inBodyData.muscleFatAnalysis?.leftArmMuscle,
          inBodyData.segmentalMuscleMass?.leftArm,
          inBodyData.segmentalMuscle?.leftArm,
          inBodyData.segmentalLeanBodyMass?.leftArm,
          mass.leftArm,
          analysis.leftArm,
          analysis.leftArmValue,
          ...collectCandidateValues([
            inBodyData.leftArmMuscle,
            mass.leftArm,
            analysis.leftArm,
            analysis.leftArmValue,
          ]),
        ],
        status: resolveStatusLabel(analysis.leftArm),
      },
      {
        label: "몸통",
        keys: [
          inBodyData.trunkMuscle,
          inBodyData.muscleFatAnalysis?.trunkMuscle,
          inBodyData.segmentalMuscleMass?.trunk,
          inBodyData.segmentalMuscle?.trunk,
          inBodyData.segmentalLeanBodyMass?.trunk,
          mass.trunk,
          analysis.trunk,
          analysis.trunkValue,
          ...collectCandidateValues([
            inBodyData.trunkMuscle,
            mass.trunk,
            analysis.trunk,
            analysis.trunkValue,
          ]),
        ],
        status: resolveStatusLabel(analysis.trunk),
      },
      {
        label: "오른다리",
        keys: [
          inBodyData.rightLegMuscle,
          inBodyData.muscleFatAnalysis?.rightLegMuscle,
          inBodyData.segmentalMuscleMass?.rightLeg,
          inBodyData.segmentalMuscle?.rightLeg,
          inBodyData.segmentalLeanBodyMass?.rightLeg,
          mass.rightLeg,
          analysis.rightLeg,
          analysis.rightLegValue,
          ...collectCandidateValues([
            inBodyData.rightLegMuscle,
            mass.rightLeg,
            analysis.rightLeg,
            analysis.rightLegValue,
          ]),
        ],
        status: resolveStatusLabel(analysis.rightLeg),
      },
      {
        label: "왼다리",
        keys: [
          inBodyData.leftLegMuscle,
          inBodyData.muscleFatAnalysis?.leftLegMuscle,
          inBodyData.segmentalMuscleMass?.leftLeg,
          inBodyData.segmentalMuscle?.leftLeg,
          inBodyData.segmentalLeanBodyMass?.leftLeg,
          mass.leftLeg,
          analysis.leftLeg,
          analysis.leftLegValue,
          ...collectCandidateValues([
            inBodyData.leftLegMuscle,
            mass.leftLeg,
            analysis.leftLeg,
            analysis.leftLegValue,
          ]),
        ],
        status: resolveStatusLabel(analysis.leftLeg),
      },
    ];

    const resolved = candidates.map((item) => {
      const numericValue = item.keys
        .map((candidate) => parseNumericValue(candidate))
        .find((value) => value !== undefined);

      return {
        label: item.label,
        numericValue,
        status: item.status || "표준",
      };
    });

    return resolved.map((item) => {
      const hasNumericValue =
        item.numericValue !== undefined && !Number.isNaN(item.numericValue);
      const percentage = resolveBarPercentage(
        hasNumericValue ? item.numericValue : undefined,
        "표준"
      );

      return {
        label: item.label,
        value: hasNumericValue
          ? `${item.numericValue.toFixed(1)}kg`
          : "-",
        percentage,
        status: "표준",
      };
    });
  }, [inBodyData, parseNumericValue, resolveBarPercentage]);

  useEffect(() => {
    if (!inBodyData) {
      console.log("[INBODY][SEGMENTAL] inBodyData 없음", {
        measurementDate: null,
      });
      return;
    }

    console.log("[INBODY][SEGMENTAL] 원본 데이터", {
      measurementDate:
        inBodyData.measurementDate ||
        inBodyData.date ||
        inBodyData.measurement_date ||
        null,
      directValues: {
        rightArmMuscle: inBodyData.rightArmMuscle,
        leftArmMuscle: inBodyData.leftArmMuscle,
        trunkMuscle: inBodyData.trunkMuscle,
        rightLegMuscle: inBodyData.rightLegMuscle,
        leftLegMuscle: inBodyData.leftLegMuscle,
      },
      segmentalMuscleAnalysis: inBodyData.segmentalMuscleAnalysis,
      segmentalMuscleMass: inBodyData.segmentalMuscleMass,
      segmentalMuscle: inBodyData.segmentalMuscle,
      segmentalLeanBodyMass: inBodyData.segmentalLeanBodyMass,
      source: inBodyData.source || "unknown",
    });
  }, [inBodyData]);

  useEffect(() => {
    console.log("[INBODY][SEGMENTAL] 계산된 항목", segmentalMuscleItems);
  }, [segmentalMuscleItems]);


  return (
    <SafeAreaView style={styles.container} edges={["top"]}>
      <View style={styles.header}>
        <TouchableOpacity
          onPress={() => {
            if (fromPhotoUpload) {
              // 사진 입력 후 저장한 경우 분석하기 페이지로 이동
              navigation.navigate("Analysis");
            } else {
              // 일반적인 경우 이전 화면으로 돌아가기
              navigation.goBack();
            }
          }}>
          <Icon name="chevron-back" size={28} color="#ffffff" />
        </TouchableOpacity>
        <Text style={styles.headerTitle}>인바디 정보</Text>
        <View style={{ width: 28 }} />
      </View>

      <ScrollView
        style={styles.content}
        contentContainerStyle={styles.contentContainer}
      >
        {loading ? (
          <View style={styles.loadingContainer}>
            <ActivityIndicator size="large" color="#E3FF7C" />
            <Text style={styles.loadingText}>데이터 로딩 중...</Text>
          </View>
        ) : inBodyData ? (
          <>
            {/* 기본 정보 */}
            <View style={styles.analysisSection}>
              <Text style={styles.sectionTitle}>기본 정보</Text>
              <View style={styles.metricList}>
                {inBodyData.measurementDate && (
                  <View style={styles.metricItem}>
                    <Text style={styles.metricName}>검사일</Text>
                    <Text style={styles.metricValue}>
                      {inBodyData.measurementDate}
                    </Text>
                    <Text style={styles.metricRange}></Text>
                  </View>
                )}
                {inBodyData.gender && (
                  <View style={styles.metricItem}>
                    <Text style={styles.metricName}>성별</Text>
                    <Text style={styles.metricValue}>
                      {inBodyData.gender}
                    </Text>
                    <Text style={styles.metricRange}></Text>
                  </View>
                )}
                {inBodyData.age && (
                  <View style={styles.metricItem}>
                    <Text style={styles.metricName}>나이</Text>
                    <Text style={styles.metricValue}>
                      {extractValue(inBodyData.age)}
                    </Text>
                    <Text style={styles.metricRange}>세</Text>
                  </View>
                )}
                {inBodyData.height && (
                  <View style={styles.metricItem}>
                    <Text style={styles.metricName}>신장</Text>
                    <Text style={styles.metricValue}>
                      {extractValue(inBodyData.height)}
                    </Text>
                    <Text style={styles.metricRange}>cm</Text>
                  </View>
                )}
                {inBodyData.weight && (
                  <View style={[styles.metricItem, styles.metricItemLast]}>
                    <Text style={styles.metricName}>체중</Text>
                    <Text style={styles.metricValue}>
                      {extractValue(inBodyData.weight || inBodyData.bodyComposition?.weight || inBodyData.muscleFatAnalysis?.weight)}
                    </Text>
                    <Text style={styles.metricRange}>kg</Text>
                  </View>
                )}
              </View>
            </View>

            {/* 핵심 수치 */}
            <View style={styles.analysisSection}>
              <Text style={styles.sectionTitle}>핵심 수치</Text>
              <View style={styles.metricList}>
                <View style={styles.metricItem}>
                  <Text style={styles.metricName}>골격근량</Text>
                  <Text style={styles.metricValue}>
                    {extractValue(inBodyData.skeletalMuscleMass || inBodyData.muscleFatAnalysis?.skeletalMuscleMass)}
                  </Text>
                  <Text style={styles.metricRange}>kg</Text>
                </View>
                <View style={styles.metricItem}>
                  <Text style={styles.metricName}>체지방량</Text>
                  <Text style={styles.metricValue}>
                    {extractValue(inBodyData.bodyFatMass || inBodyData.muscleFatAnalysis?.bodyFatMass || inBodyData.bodyComposition?.bodyFatMass)}
                  </Text>
                  <Text style={styles.metricRange}>kg</Text>
                </View>
                <View style={styles.metricItem}>
                  <Text style={styles.metricName}>체지방률</Text>
                  <Text style={styles.metricValue}>
                    {extractValue(inBodyData.bodyFatPercentage || inBodyData.obesityAnalysis?.bodyFatPercentage)}
                  </Text>
                  <Text style={styles.metricRange}>%</Text>
                </View>
                <View style={styles.metricItem}>
                  <Text style={styles.metricName}>BMI</Text>
                  <Text style={styles.metricValue}>
                    {extractValue(inBodyData.bmi || inBodyData.obesityAnalysis?.bmi)}
                  </Text>
                  <Text style={styles.metricRange}>kg/m²</Text>
                </View>
                {inBodyData.visceralFatLevel && (
                  <View style={[styles.metricItem, styles.metricItemLast]}>
                    <Text style={styles.metricName}>내장지방 레벨</Text>
                    <Text style={styles.metricValue}>
                      {extractValue(inBodyData.visceralFatLevel)}
                    </Text>
                    <Text style={styles.metricRange}></Text>
                  </View>
                )}
              </View>
            </View>

                {/* 체성분 분석 */}
                <View style={styles.analysisSection}>
                  <Text style={styles.sectionTitle}>체성분 분석</Text>
                  <View style={styles.metricList}>
                    <View style={styles.metricItem}>
                      <Text style={styles.metricName}>체수분</Text>
                      <Text style={styles.metricValue}>
                        {extractValue(
                          inBodyData.bodyComposition?.totalBodyWater
                        )}
                      </Text>
                      <Text style={styles.metricRange}>
                        {extractRange(
                          inBodyData.bodyComposition?.totalBodyWater
                        )}
                      </Text>
                    </View>
                    <View style={styles.metricItem}>
                      <Text style={styles.metricName}>단백질</Text>
                      <Text style={styles.metricValue}>
                        {extractValue(inBodyData.bodyComposition?.protein)}
                      </Text>
                      <Text style={styles.metricRange}>
                        {extractRange(inBodyData.bodyComposition?.protein)}
                      </Text>
                    </View>
                    <View style={styles.metricItem}>
                      <Text style={styles.metricName}>무기질</Text>
                      <Text style={styles.metricValue}>
                        {extractValue(inBodyData.bodyComposition?.mineral)}
                      </Text>
                      <Text style={styles.metricRange}>
                        {extractRange(inBodyData.bodyComposition?.mineral)}
                      </Text>
                    </View>
                    <View style={[styles.metricItem, styles.metricItemLast]}>
                      <Text style={styles.metricName}>체지방</Text>
                      <Text style={styles.metricValue}>
                        {extractValue(inBodyData.bodyComposition?.bodyFatMass)}
                      </Text>
                      <Text style={styles.metricRange}>
                        {extractRange(inBodyData.bodyComposition?.bodyFatMass)}
                      </Text>
                    </View>
                  </View>
                </View>

                {/* 골격근 지방 분석 */}
                <View style={styles.analysisSection}>
                  <Text style={styles.sectionTitle}>골격근 지방 분석</Text>
                  <View style={styles.barChartList}>
                    <View style={styles.barLabelsHeader}>
                      <Text style={styles.barRangeLabel}>표준이하</Text>
                      <Text style={styles.barRangeLabel}>표준</Text>
                      <Text style={styles.barRangeLabel}>표준이상</Text>
                    </View>
                    <BarChartItem
                      label="체수분"
                      value={extractValue(
                        inBodyData.bodyComposition?.totalBodyWater
                      )}
                      percentage={resolveBarPercentage(
                        inBodyData.bodyComposition?.totalBodyWater,
                        "표준"
                      )}
                      status="표준"
                    />
                    <BarChartItem
                      label="골격근량"
                      value={
                        inBodyData.muscleFatAnalysis?.skeletalMuscleMass?.toFixed(
                          1
                        ) || "N/A"
                      }
                      percentage={resolveBarPercentage(
                        inBodyData.muscleFatAnalysis?.skeletalMuscleMass,
                        inBodyData.muscleFatAnalysis?.skeletalMuscleStatus
                      )}
                      status={
                        inBodyData.muscleFatAnalysis?.skeletalMuscleStatus ||
                        "표준"
                      }
                    />
                    <BarChartItem
                      label="체지방량"
                      value={
                        inBodyData.muscleFatAnalysis?.bodyFatMass?.toFixed(1) ||
                        "N/A"
                      }
                      percentage={resolveBarPercentage(
                        inBodyData.muscleFatAnalysis?.bodyFatMass,
                        inBodyData.muscleFatAnalysis?.bodyFatStatus
                      )}
                      status={
                        inBodyData.muscleFatAnalysis?.bodyFatStatus || "표준"
                      }
                      isLast
                    />
                  </View>
                </View>

                {/* 비만 분석 */}
                <View style={styles.analysisSection}>
                  <Text style={styles.sectionTitle}>비만 분석</Text>
                  <View style={styles.barChartList}>
                    <View style={styles.barLabelsHeader}>
                      <Text style={styles.barRangeLabel}>표준이하</Text>
                      <Text style={styles.barRangeLabel}>표준</Text>
                      <Text style={styles.barRangeLabel}>표준이상</Text>
                    </View>
                    <BarChartItem
                      label="BMI"
                      value={
                        inBodyData.obesityAnalysis?.bmi?.toFixed(1) || "N/A"
                      }
                      percentage={resolveBarPercentage(
                        inBodyData.obesityAnalysis?.bmi,
                        inBodyData.obesityAnalysis?.bmiStatus
                      )}
                      status={inBodyData.obesityAnalysis?.bmiStatus || "표준"}
                    />
                    <BarChartItem
                      label="체지방률"
                      value={
                        inBodyData.obesityAnalysis?.bodyFatPercentage?.toFixed(
                          1
                        ) || "N/A"
                      }
                      percentage={resolveBarPercentage(
                        inBodyData.obesityAnalysis?.bodyFatPercentage,
                        inBodyData.obesityAnalysis?.bodyFatPercentageStatus
                      )}
                      status={
                        inBodyData.obesityAnalysis?.bodyFatPercentageStatus ||
                        "표준"
                      }
                      isLast
                    />
                  </View>
                </View>

                {/* 부위별 근육 분석 */}
                <View style={styles.analysisSection}>
                  <Text style={styles.sectionTitle}>부위별 근육 분석</Text>
                  <View style={styles.metricList}>
                    {segmentalMuscleItems.map((item, index) => (
                      <View
                        key={item.label}
                        style={[
                          styles.metricItem,
                          index === segmentalMuscleItems.length - 1 && styles.metricItemLast,
                        ]}>
                        <Text style={styles.metricName}>{item.label}</Text>
                        <Text style={styles.metricValue}>{item.value}</Text>
                        <Text style={styles.metricRange}></Text>
                      </View>
                    ))}
                  </View>
                </View>

                {/* 부위별 체지방 분석 */}
                <View style={styles.analysisSection}>
                  <Text style={styles.sectionTitle}>부위별 체지방 분석</Text>
                  <View style={styles.metricList}>
                    {[
                      { label: "오른팔 체지방", keys: ["rightArmFat"] },
                      { label: "왼팔 체지방", keys: ["leftArmFat"] },
                      { label: "몸통 체지방", keys: ["trunkFat"] },
                      { label: "오른다리 체지방", keys: ["rightLegFat"] },
                      { label: "왼다리 체지방", keys: ["leftLegFat"] },
                    ].map((item, index, array) => {
                      const value =
                        inBodyData[item.keys[0]] ??
                        inBodyData.muscleFatAnalysis?.[item.keys[0]] ??
                        inBodyData.segmentalBodyFat?.[item.keys[0]] ??
                        inBodyData.segmentalBodyFat?.[item.keys[0].replace("Fat", "Arm").replace("Fat", "Leg").replace("Fat", "Trunk")] ??
                        inBodyData.segmentalFatRatio?.[item.keys[0].replace("Fat", "Arm").replace("Fat", "Leg").replace("Fat", "Trunk")] ??
                        null;
                      const numValue = parseNumericValue(value);
                      return (
                        <View
                          key={item.keys[0]}
                          style={[
                            styles.metricItem,
                            index === array.length - 1 && styles.metricItemLast,
                          ]}>
                          <Text style={styles.metricName}>{item.label}</Text>
                          <Text style={styles.metricValue}>
                            {numValue !== undefined
                              ? `${numValue.toFixed(1)}kg`
                              : "-"}
                          </Text>
                          <Text style={styles.metricRange}></Text>
                        </View>
                      );
                    })}
                  </View>
                </View>
              </>
            ) : (
              <View style={styles.emptyContainer}>
                <Text style={styles.emptyText}>인바디 데이터가 없습니다.</Text>
                <Text style={styles.emptySubText}>
                  수기로 입력하거나 사진으로 입력해주세요.
                </Text>
              </View>
            )}
      </ScrollView>
    </SafeAreaView>
  );
};

interface BarChartItemProps {
  label: string;
  value: string;
  percentage: number;
  status: string;
  isLast?: boolean;
}

const BarChartItem: React.FC<BarChartItemProps> = ({
  label,
  value,
  percentage,
  status,
  isLast = false,
}) => (
  <View style={[styles.barItem, isLast && styles.barItemLast]}>
    <Text style={styles.barLabel}>{label}</Text>
    <View style={styles.barChartContainer}>
      <View style={styles.barContainer}>
        <View
          style={[
            styles.barFill,
            { width: `${Math.max(0, Math.min(100, percentage))}%` },
          ]}
        />
      </View>
    </View>
    <Text style={styles.barValue}>{value}</Text>
    <Text style={styles.barStatus}>{status}</Text>
  </View>
);

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
    fontWeight: "600",
    color: "#ffffff",
  },
  content: {
    flex: 1,
  },
  contentContainer: {
    maxWidth: 400,
    alignSelf: "center",
    width: "100%",
    paddingHorizontal: 20,
    paddingBottom: 100,
  },
  analysisSection: {
    marginBottom: 24,
  },
  measurementInfo: {
    marginBottom: 24,
    paddingVertical: 12,
    paddingHorizontal: 16,
    borderRadius: 8,
    backgroundColor: "#2a2a2a",
    alignItems: "center",
  },
  measurementInfoText: {
    fontSize: 14.4,
    color: "#ffffff",
    fontWeight: "500",
  },
  sectionTitle: {
    fontSize: 16,
    fontWeight: "600",
    color: "#ffffff",
    marginBottom: 16,
  },
  metricList: {
    backgroundColor: "#2a2a2a",
    borderRadius: 8,
    padding: 16,
  },
  metricItem: {
    flexDirection: "row",
    justifyContent: "space-between",
    alignItems: "center",
    paddingVertical: 8,
    borderBottomWidth: 1,
    borderBottomColor: "#333333",
  },
  metricItemLast: {
    borderBottomWidth: 0,
  },
  metricName: {
    fontSize: 14.4,
    color: "#ffffff",
    flex: 1,
  },
  metricValue: {
    fontSize: 14.4,
    color: "#E3FF7C",
    fontWeight: "600",
    textAlign: "center",
    flex: 1,
  },
  metricRange: {
    fontSize: 12.8,
    color: "#aaaaaa",
    textAlign: "right",
    flex: 1,
  },
  barChartList: {
    backgroundColor: "#2a2a2a",
    borderRadius: 8,
    padding: 16,
  },
  barLabelsHeader: {
    flexDirection: "row",
    justifyContent: "space-between",
    fontSize: 11.2,
    color: "#aaaaaa",
    marginBottom: 8,
    paddingHorizontal: 12,
  },
  barRangeLabel: {
    flex: 1,
    textAlign: "center",
    fontSize: 11.2,
    color: "#aaaaaa",
  },
  barItem: {
    flexDirection: "row",
    alignItems: "center",
    gap: 12,
    paddingVertical: 12,
    borderBottomWidth: 1,
    borderBottomColor: "#333333",
  },
  barItemLast: {
    borderBottomWidth: 0,
  },
  barLabel: {
    fontSize: 14.4,
    color: "#ffffff",
    minWidth: 60,
  },
  barChartContainer: {
    flex: 1,
    marginRight: -79,
  },
  barContainer: {
    height: 20,
    backgroundColor: "#333333",
    borderRadius: 10,
    overflow: "hidden",
    width: "100%",
  },
  barFill: {
    height: "100%",
    backgroundColor: "#e3ff7c",
    borderRadius: 10,
  },
  barValue: {
    minWidth: 50,
    textAlign: "right",
    fontSize: 12.8,
    color: "#ffffff",
    fontWeight: "500",
  },
  barStatus: {
    fontSize: 12.8,
    color: "#E3FF7C",
    minWidth: 40,
    textAlign: "right",
  },
  loadingContainer: {
    flex: 1,
    justifyContent: "center",
    alignItems: "center",
    paddingVertical: 60,
  },
  loadingText: {
    marginTop: 12,
    fontSize: 14,
    color: "#aaaaaa",
  },
  emptyContainer: {
    flex: 1,
    justifyContent: "center",
    alignItems: "center",
    paddingVertical: 60,
  },
  emptyText: {
    fontSize: 16,
    color: "#ffffff",
    fontWeight: "500",
    marginBottom: 8,
  },
  emptySubText: {
    fontSize: 14,
    color: "#aaaaaa",
  },
});

export default InBodyScreen;
