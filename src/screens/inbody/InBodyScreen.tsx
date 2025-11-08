import React, { useState, useMemo, useEffect, useCallback } from "react";
import { useFocusEffect } from "@react-navigation/native";
import {
  View,
  Text,
  StyleSheet,
  ScrollView,
  TouchableOpacity,
  Dimensions,
  ActivityIndicator,
} from "react-native";
import { SafeAreaView } from "react-native-safe-area-context";
import Svg, { Path, Circle, Line, Text as SvgText, G } from "react-native-svg";
import { Ionicons as Icon } from "@expo/vector-icons";
import { getLatestInBody } from "../../utils/inbodyApi";
import AsyncStorage from "@react-native-async-storage/async-storage";

const InBodyScreen = ({ navigation }: any) => {
  const [activeTab, setActiveTab] = useState<"info" | "graph">("info");
  const [selectedFilter, setSelectedFilter] = useState("체중");
  const [selectedPointIndex, setSelectedPointIndex] = useState<number | null>(
    null
  );
  const [tooltipPosition, setTooltipPosition] = useState<{
    x: number;
    y: number;
  } | null>(null);
  const [inBodyData, setInBodyData] = useState<any>(null);
  const [loading, setLoading] = useState(true);
  const [userName, setUserName] = useState<string | null>(null);
  const displayName = useMemo(
    () => (userName ? `${userName}님` : "회원님"),
    [userName]
  );

  // 그래프 데이터 (실제 API 데이터 기반)
  const graphData = useMemo(() => {
    const getValue = (data: any): number | null => {
      if (!data) return null;

      switch (selectedFilter) {
        case "체중":
          return data.muscleFatAnalysis?.weight || data.weight || null;
        case "체지방량":
          return (
            data.muscleFatAnalysis?.bodyFatMass || data.bodyFatMass || null
          );
        case "골격근량":
          return (
            data.muscleFatAnalysis?.skeletalMuscleMass ||
            data.skeletalMuscleMass ||
            null
          );
        default:
          return null;
      }
    };

    const value = getValue(inBodyData);
    if (value === null || value === undefined || !inBodyData) {
      return [];
    }

    const measurementDate = inBodyData.measurementDate?.replace(/\./g, "-");
    const dateObj = measurementDate ? new Date(measurementDate) : null;

    const label =
      dateObj && !isNaN(dateObj.getTime())
        ? `${String(dateObj.getMonth() + 1).padStart(2, "0")}/${String(
            dateObj.getDate()
          ).padStart(2, "0")}`
        : "최근";

    return [
      {
        x: label,
        y: value,
        date: inBodyData.measurementDate ?? label,
      },
    ];
  }, [inBodyData, selectedFilter]);

  const screenWidth = Dimensions.get("window").width;
  const chartWidth = Math.min(screenWidth - 40, 400);
  const padding = { top: 20, right: 28, bottom: 26, left: 42 };
  const width = chartWidth;
  const height = 210;
  const smoothness = 0.22;
  const lastPointIndex = graphData.length > 0 ? graphData.length - 1 : null;

  // Y축 범위 동적 계산
  const { minY, maxY, yTicks, baseline } = useMemo(() => {
    if (graphData.length === 0) {
      return {
        minY: 0,
        maxY: 100,
        yTicks: [100, 80, 60, 40, 20],
        baseline: 0,
      };
    }

    const allValues = graphData.map((d) => d.y);
    const minValue = Math.min(...allValues);
    const maxValue = Math.max(...allValues);
    const range = maxValue - minValue;
    const paddingValue = Math.max(range * 0.1, 1); // 최소 1의 여백

    const calculatedMinY = Math.max(0, minValue - paddingValue);
    const calculatedMaxY = maxValue + paddingValue;

    // Y축 눈금 생성 (5개 정도)
    const ticks: number[] = [];
    const step = (calculatedMaxY - calculatedMinY) / 4;
    for (let i = 0; i <= 4; i++) {
      ticks.push(Math.round((calculatedMaxY - step * i) * 10) / 10);
    }

    return {
      minY: calculatedMinY,
      maxY: calculatedMaxY,
      yTicks: ticks,
      baseline: calculatedMinY,
    };
  }, [graphData]);

  const iw = width - padding.left - padding.right;
  const ih = height - padding.top - padding.bottom;
  const scaleX = (i: number) =>
    graphData.length > 1
      ? padding.left + (iw * i) / (graphData.length - 1)
      : padding.left + iw / 2;
  const scaleY = (v: number) =>
    padding.top + ih * (1 - (v - minY) / (maxY - minY));

  // 부드러운 곡선 경로 생성
  const pathSmooth = (points: { x: number; y: number }[], k = 0.22) => {
    if (points.length < 2) return "";
    const cps = (
      p0: { x: number; y: number },
      p1: { x: number; y: number },
      p2: { x: number; y: number },
      t: number
    ) => ({
      x: p1.x + (p2.x - p0.x) * t,
      y: p1.y + (p2.y - p0.y) * t,
    });

    let d = `M ${points[0].x} ${points[0].y}`;
    for (let i = 0; i < points.length - 1; i++) {
      const p0 = points[i - 1] ?? points[i];
      const p1 = points[i];
      const p2 = points[i + 1];
      const p3 = points[i + 2] ?? p2;
      const c1 = cps(p0, p1, p2, k);
      const c2 = cps(p1, p2, p3, -k);
      d += ` C ${c1.x} ${c1.y}, ${c2.x} ${c2.y}, ${p2.x} ${p2.y}`;
    }
    return d;
  };

  const graphPoints = useMemo(
    () => graphData.map((d, i) => ({ x: scaleX(i), y: scaleY(d.y) })),
    [graphData]
  );

  const pathData = useMemo(
    () => pathSmooth(graphPoints, smoothness),
    [graphPoints]
  );

  // 그래프 관련 함수들
  const handlePointPress = (index: number) => {
    setSelectedPointIndex(index);
    const point = graphPoints[index];
    setTooltipPosition({
      x: (point.x / width) * 100,
      y: ((point.y - 30) / height) * 100,
    });
  };

  const handleChartHostPress = () => {
    if (
      lastPointIndex !== null &&
      selectedPointIndex !== null &&
      selectedPointIndex !== lastPointIndex
    ) {
      setSelectedPointIndex(null);
      setTooltipPosition(null);
    }
  };

  const formatAdjustmentValue = useCallback((rawValue: any) => {
    if (rawValue === null || rawValue === undefined) return undefined;
    if (typeof rawValue === "number" && isFinite(rawValue)) {
      return `${Math.round(rawValue * 10) / 10}kg`;
    }
    if (typeof rawValue === "string") {
      const trimmed = rawValue.trim();
      return trimmed.length > 0 ? trimmed : undefined;
    }
    return String(rawValue);
  }, []);

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

  const formatAdjustmentDetail = useCallback(
    (rawValue: any, label: string) => {
      if (rawValue === null || rawValue === undefined) {
        return `${label} 조절 정보가 없습니다.`;
      }

      const sanitized =
        typeof rawValue === "string" ? rawValue.replace(/\s+/g, "") : rawValue;
      const numeric = parseNumericValue(sanitized);

      if (numeric === undefined) {
        const valueStr = formatAdjustmentValue(rawValue);
        return valueStr
          ? `${label} 조절 권장량 ${valueStr}을 참고해주세요.`
          : `${label} 조절 정보가 없습니다.`;
      }

      if (Math.abs(numeric) < 0.1) {
        return `${label}은 현재 수준을 유지하면 충분해요.`;
      }

      const direction = numeric < 0 ? "감량" : "증가";
      return `${Math.abs(numeric).toFixed(1)}kg ${direction}이 필요합니다.`;
    },
    [formatAdjustmentValue, parseNumericValue]
  );

  const filterMessages = useMemo(() => {
    const weightControl = inBodyData?.weightControl || {};

    const weightTarget = formatAdjustmentValue(weightControl.targetWeight);
    const weightAdjustmentValue = formatAdjustmentValue(
      weightControl.weightAdjustment
    );
    const fatAdjustmentValue = formatAdjustmentValue(
      weightControl.fatAdjustment
    );
    const muscleAdjustmentValue = formatAdjustmentValue(
      weightControl.muscleAdjustment
    );

    const weightTextParts: string[] = [];
    if (weightTarget) weightTextParts.push(`목표 체중 ${weightTarget}`);
    if (weightAdjustmentValue)
      weightTextParts.push(`권장 조절량 ${weightAdjustmentValue}`);

    return {
      체중: {
        tag: "체중 조절",
        text:
          weightTextParts.length > 0
            ? weightTextParts.join(" · ")
            : "체중 조절 데이터를 입력해주세요.",
        detail: formatAdjustmentDetail(weightControl.weightAdjustment, "체중"),
      },
      체지방량: {
        tag: "지방량 조절",
        text: fatAdjustmentValue
          ? `권장 체지방 조절량 ${fatAdjustmentValue}`
          : "체지방 조절 데이터를 입력해주세요.",
        detail: formatAdjustmentDetail(weightControl.fatAdjustment, "체지방"),
      },
      골격근량: {
        tag: "근육량 조절",
        text: muscleAdjustmentValue
          ? `권장 근육 조절량 ${muscleAdjustmentValue}`
          : "근육 조절 데이터를 입력해주세요.",
        detail: formatAdjustmentDetail(weightControl.muscleAdjustment, "근육"),
      },
    } as const;
  }, [formatAdjustmentDetail, formatAdjustmentValue, inBodyData]);

  const currentMessage = useMemo(() => {
    const key = selectedFilter as keyof typeof filterMessages;
    return filterMessages[key] ?? filterMessages["체중"];
  }, [filterMessages, selectedFilter]);

  useEffect(() => {
    if (!inBodyData) return;

    console.log("[INBODY][WEIGHT CONTROL]", {
      selectedFilter,
      weightControl: inBodyData.weightControl,
      currentMessage,
    });
  }, [inBodyData, selectedFilter, currentMessage]);

  // API로 최신 인바디 정보 조회 (항상 가장 최신 저장 이력 표시)
  const fetchInBodyData = useCallback(async () => {
    try {
      setLoading(true);

      const response = await getLatestInBody();
      const latest = response?.success ? response.inBody : response;

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
      } else {
        console.warn("[INBODY][FETCH][LATEST] 유효한 데이터가 없습니다.", {
          response,
        });
        setInBodyData(null);
      }
    } catch (error) {
      console.error("[INBODY SCREEN] API 데이터 로드 실패:", error);
      setInBodyData(null);
    } finally {
      setLoading(false);
    }
  }, []);

  // 화면이 포커스될 때마다 최신 데이터 조회
  useFocusEffect(
    useCallback(() => {
      fetchInBodyData();
    }, [fetchInBodyData])
  );

  // 컴포넌트 마운트 시 마지막 포인트를 활성화
  useEffect(() => {
    if (
      graphPoints.length > 0 &&
      lastPointIndex !== null &&
      activeTab === "graph"
    ) {
      const lastPoint = graphPoints[lastPointIndex];
      if (!lastPoint) return;
      setSelectedPointIndex(lastPointIndex);
      setTooltipPosition({
        x: (lastPoint.x / width) * 100,
        y: ((lastPoint.y - 30) / height) * 100,
      });
    }
  }, [graphPoints, lastPointIndex, activeTab, width, height]);

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
        keys: collectCandidateValues([
          inBodyData.rightArmMuscle,
          mass.rightArm,
          analysis.rightArm,
          analysis.rightArmValue,
        ]),
        status: resolveStatusLabel(analysis.rightArm),
      },
      {
        label: "왼팔",
        keys: collectCandidateValues([
          inBodyData.leftArmMuscle,
          mass.leftArm,
          analysis.leftArm,
          analysis.leftArmValue,
        ]),
        status: resolveStatusLabel(analysis.leftArm),
      },
      {
        label: "몸통",
        keys: collectCandidateValues([
          inBodyData.trunkMuscle,
          mass.trunk,
          analysis.trunk,
          analysis.trunkValue,
        ]),
        status: resolveStatusLabel(analysis.trunk),
      },
      {
        label: "오른다리",
        keys: collectCandidateValues([
          inBodyData.rightLegMuscle,
          mass.rightLeg,
          analysis.rightLeg,
          analysis.rightLegValue,
        ]),
        status: resolveStatusLabel(analysis.rightLeg),
      },
      {
        label: "왼다리",
        keys: collectCandidateValues([
          inBodyData.leftLegMuscle,
          mass.leftLeg,
          analysis.leftLeg,
          analysis.leftLegValue,
        ]),
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
      const fallbackStatus = item.status || "정보 없음";
      const percentage = resolveBarPercentage(
        hasNumericValue ? item.numericValue : undefined,
        fallbackStatus
      );

      return {
        label: item.label,
        value: hasNumericValue
          ? `${item.numericValue.toFixed(1)}kg`
          : fallbackStatus,
        percentage,
        status: fallbackStatus,
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

  const handleGraphClick = () => {
    setActiveTab("graph");
  };

  return (
    <SafeAreaView style={styles.container} edges={["top"]}>
      <View style={styles.header}>
        <TouchableOpacity onPress={() => navigation.goBack()}>
          <Icon name="chevron-back" size={28} color="#ffffff" />
        </TouchableOpacity>
        <Text style={styles.headerTitle}>인바디 정보</Text>
        <View style={{ width: 28 }} />
      </View>

      <ScrollView
        style={styles.content}
        contentContainerStyle={styles.contentContainer}
      >
        {/* 탭 네비게이션 */}
        <View style={styles.tabNavigation}>
          <TouchableOpacity
            style={styles.tab}
            onPress={() => setActiveTab("info")}
          >
            <Text
              style={[
                styles.tabText,
                activeTab === "info" && styles.tabTextActive,
              ]}
            >
              인바디 정보
            </Text>
            {activeTab === "info" && <View style={styles.tabIndicator} />}
          </TouchableOpacity>
          <TouchableOpacity
            style={styles.tab}
            onPress={() => handleGraphClick()}
          >
            <Text
              style={[
                styles.tabText,
                activeTab === "graph" && styles.tabTextActive,
              ]}
            >
              그래프
            </Text>
            {activeTab === "graph" && <View style={styles.tabIndicator} />}
          </TouchableOpacity>
        </View>

        {/* 인바디 정보 탭 컨텐츠 */}
        {activeTab === "info" && (
          <>
            {loading ? (
              <View style={styles.loadingContainer}>
                <ActivityIndicator size="large" color="#d6ff4b" />
                <Text style={styles.loadingText}>데이터 로딩 중...</Text>
              </View>
            ) : inBodyData ? (
              <>
                {inBodyData.measurementDate && (
                  <View style={styles.measurementInfo}>
                    <Text style={styles.measurementInfoText}>
                      최근 측정일 {inBodyData.measurementDate}
                    </Text>
                  </View>
                )}

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
                  <View style={styles.barChartList}>
                    <View style={styles.barLabelsHeader}>
                      <Text style={styles.barRangeLabel}>표준이하</Text>
                      <Text style={styles.barRangeLabel}>표준</Text>
                      <Text style={styles.barRangeLabel}>표준이상</Text>
                    </View>
                    {segmentalMuscleItems.map((item, index) => (
                      <BarChartItem
                        key={item.label}
                        label={item.label}
                        value={item.value}
                        percentage={item.percentage}
                        status={item.status}
                        isLast={index === segmentalMuscleItems.length - 1}
                      />
                    ))}
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
          </>
        )}

        {/* 그래프 탭 컨텐츠 */}
        {activeTab === "graph" && (
          <>
            {/* Filter Buttons */}
            <View style={styles.filterButtons}>
              <TouchableOpacity
                style={[
                  styles.filterBtn,
                  selectedFilter === "체중" && styles.filterBtnActive,
                ]}
                onPress={() => setSelectedFilter("체중")}
              >
                <Text
                  style={[
                    styles.filterBtnText,
                    selectedFilter === "체중" && styles.filterBtnTextActive,
                  ]}
                >
                  체중
                </Text>
              </TouchableOpacity>
              <TouchableOpacity
                style={[
                  styles.filterBtn,
                  selectedFilter === "체지방량" && styles.filterBtnActive,
                ]}
                onPress={() => setSelectedFilter("체지방량")}
              >
                <Text
                  style={[
                    styles.filterBtnText,
                    selectedFilter === "체지방량" && styles.filterBtnTextActive,
                  ]}
                >
                  체지방량
                </Text>
              </TouchableOpacity>
              <TouchableOpacity
                style={[
                  styles.filterBtn,
                  selectedFilter === "골격근량" && styles.filterBtnActive,
                ]}
                onPress={() => setSelectedFilter("골격근량")}
              >
                <Text
                  style={[
                    styles.filterBtnText,
                    selectedFilter === "골격근량" && styles.filterBtnTextActive,
                  ]}
                >
                  골격근량
                </Text>
              </TouchableOpacity>
            </View>

            {/* 사용자 메시지 */}
            <View style={styles.userMessage}>
              <Text style={styles.userMessageText}>
                <Text style={styles.highlightName}>{displayName}</Text>
                {` 오늘도 꾸준한 기록으로 멋진 변화를 만들어봐요! 💪`}
              </Text>
            </View>

            {/* 그래프 섹션 */}
            <View style={styles.graphSection}>
              <View style={styles.chartContainer}>
                <Text style={styles.chartTitle}>체중 변화</Text>
                <TouchableOpacity
                  style={styles.chartHost}
                  activeOpacity={1}
                  onPress={handleChartHostPress}
                >
                  <Svg
                    width={width}
                    height={height}
                    viewBox={`0 0 ${width} ${height}`}
                    style={styles.svg}
                  >
                    {/* Y축 라벨 */}
                    {yTicks.map((t) => (
                      <React.Fragment key={t}>
                        <SvgText
                          x={6}
                          y={scaleY(t) + 3}
                          fontSize={10}
                          fill="#bdbdbd"
                          fontFamily="System"
                        >
                          {t.toFixed(1)}kg
                        </SvgText>
                        {/* baseline만 점선 */}
                        {t === baseline && (
                          <Line
                            x1={padding.left}
                            x2={width - padding.right}
                            y1={scaleY(baseline)}
                            y2={scaleY(baseline)}
                            stroke="#8f8f8f55"
                            strokeDasharray="6 6"
                          />
                        )}
                      </React.Fragment>
                    ))}

                    {/* X축 라벨 */}
                    {graphData.map((d, i) => (
                      <SvgText
                        key={i}
                        x={scaleX(i)}
                        y={height - 6}
                        fontSize={10}
                        fill="#bdbdbd"
                        fontFamily="System"
                        textAnchor="middle"
                      >
                        {d.x}
                      </SvgText>
                    ))}

                    {/* 라인 경로 */}
                    <Path
                      d={pathData}
                      fill="none"
                      stroke="#ffffff"
                      strokeWidth={2}
                    />

                    {/* 포인트(원) */}
                    <G>
                      {graphPoints.map((point, i) => {
                        const isActive =
                          i === lastPointIndex || selectedPointIndex === i;
                        return (
                          <React.Fragment key={i}>
                            {/* Glow 효과 */}
                            {isActive && (
                              <>
                                <Circle
                                  cx={point.x}
                                  cy={point.y}
                                  r={7}
                                  fill="#daff50"
                                  opacity={0.3}
                                />
                                <Circle
                                  cx={point.x}
                                  cy={point.y}
                                  r={6}
                                  fill="#daff50"
                                  opacity={0.4}
                                />
                              </>
                            )}
                            <Circle
                              cx={point.x}
                              cy={point.y}
                              r={5}
                              fill="#0e0e0e"
                              stroke="#daff50"
                              strokeWidth={2}
                              onPress={() => handlePointPress(i)}
                            />
                          </React.Fragment>
                        );
                      })}
                    </G>
                  </Svg>

                  {/* 툴팁 */}
                  {tooltipPosition && selectedPointIndex !== null && (
                    <View
                      style={[
                        styles.tooltip,
                        {
                          left: `${tooltipPosition.x}%`,
                          top: `${tooltipPosition.y}%`,
                          transform: [{ translateX: -25 }, { translateY: 0 }],
                        },
                      ]}
                    >
                      <Text style={styles.tooltipText}>
                        {graphData[selectedPointIndex].y.toFixed(1)}kg
                      </Text>
                    </View>
                  )}
                </TouchableOpacity>
              </View>
            </View>

            {/* 체중 조절 섹션 */}
            <View style={styles.weightControlSection}>
              <View style={styles.weightControlTag}>
                <Text style={styles.weightControlTagText}>
                  {currentMessage.tag}
                </Text>
              </View>
              <View style={styles.weightControlContent}>
                <View style={styles.trainerAvatar}>
                  <Text style={styles.trainerAvatarText}>👨‍💼</Text>
                </View>
                <View style={styles.weightInfo}>
                  <Text style={styles.weightText}>{currentMessage.text}</Text>
                  <Text style={styles.weightDetail}>
                    {currentMessage.detail}
                  </Text>
                </View>
              </View>
            </View>
          </>
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
  tabNavigation: {
    flexDirection: "row",
    marginBottom: 20,
    borderBottomWidth: 1,
    borderBottomColor: "#333333",
  },
  tab: {
    flex: 1,
    alignItems: "center",
    paddingVertical: 12,
    position: "relative",
  },
  tabText: {
    fontSize: 14.4,
    color: "#aaaaaa",
  },
  tabTextActive: {
    color: "#ffffff",
    fontWeight: "600",
  },
  tabIndicator: {
    position: "absolute",
    bottom: 0,
    width: 80,
    height: 2,
    backgroundColor: "#daff50",
    alignSelf: "center",
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
    color: "#ccff00",
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
    color: "#4ade80",
    minWidth: 40,
    textAlign: "right",
  },
  filterButtons: {
    flexDirection: "row",
    gap: 8,
    marginBottom: 24,
  },
  filterBtn: {
    flex: 1,
    backgroundColor: "#333333",
    paddingVertical: 8,
    paddingHorizontal: 16,
    borderRadius: 5,
    alignItems: "center",
    minWidth: 0,
  },
  filterBtnActive: {
    backgroundColor: "#daff50",
  },
  filterBtnText: {
    fontSize: 14.4,
    color: "#aaaaaa",
  },
  filterBtnTextActive: {
    color: "#1c1c1c",
  },
  userMessage: {
    marginBottom: 24,
  },
  userMessageText: {
    fontSize: 16,
    lineHeight: 24,
    color: "#ffffff",
  },
  highlightName: {
    color: "#daff50",
    fontWeight: "600",
  },
  graphSection: {
    backgroundColor: "#2a2a2a",
    borderRadius: 12,
    padding: 20,
    paddingLeft: 10,
    paddingBottom: 50,
    marginBottom: 24,
  },
  chartContainer: {
    maxWidth: 420,
    width: "100%",
    marginLeft: 0,
  },
  chartTitle: {
    fontWeight: "600",
    marginBottom: 12,
    marginLeft: 2,
    fontSize: 14,
    color: "#cfcfcf",
  },
  chartHost: {
    position: "relative",
    width: "100%",
    aspectRatio: 400 / 210,
    marginLeft: -5,
  },
  svg: {
    width: "100%",
    height: "auto",
  },
  tooltip: {
    position: "absolute",
    backgroundColor: "#d6ff4b",
    paddingHorizontal: 6,
    paddingVertical: 4,
    borderRadius: 8,
    zIndex: 10,
  },
  tooltipText: {
    fontSize: 11,
    fontWeight: "700",
    color: "#0b0b0b",
  },
  weightControlSection: {
    backgroundColor: "#2a2a2a",
    borderRadius: 12,
    padding: 20,
    marginBottom: 24,
  },
  weightControlTag: {
    alignSelf: "flex-start",
    backgroundColor: "#333333",
    paddingHorizontal: 12,
    paddingVertical: 6,
    borderRadius: 12,
    marginBottom: 16,
  },
  weightControlTagText: {
    fontSize: 12.8,
    fontWeight: "500",
    color: "#ffffff",
  },
  weightControlContent: {
    flexDirection: "row",
    alignItems: "center",
    gap: 16,
  },
  trainerAvatar: {
    width: 50,
    height: 50,
    borderRadius: 25,
    borderWidth: 1,
    borderColor: "#666666",
    justifyContent: "center",
    alignItems: "center",
  },
  trainerAvatarText: {
    fontSize: 28.8,
  },
  weightInfo: {
    flex: 1,
    gap: 8,
  },
  weightText: {
    fontSize: 16,
    color: "#ffffff",
    fontWeight: "500",
  },
  weightDetail: {
    fontSize: 14.4,
    color: "#cccccc",
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
