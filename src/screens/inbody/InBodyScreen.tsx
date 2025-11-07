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
import InbodyDateNavigator from "../../components/common/InbodyDateNavigator";
import InBodyCalendarModal from "../../components/common/InBodyCalendarModal";
import { getLatestInBody, getInBodyList, getInBodyByDate } from "../../utils/inbodyApi";

const InBodyScreen = ({ navigation }: any) => {
  const [activeTab, setActiveTab] = useState<"info" | "graph">("info");
  const [selectedDate, setSelectedDate] = useState(new Date());
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
  const [calendarVisible, setCalendarVisible] = useState(false);
  const [inBodyDatesList, setInBodyDatesList] = useState<string[]>([]);
  const [inBodyDataCache, setInBodyDataCache] = useState<Map<string, any>>(new Map()); // 날짜별 데이터 캐시

  // 그래프 데이터 (실제 API 데이터 기반)
  const graphData = useMemo(() => {
    // 캐시된 데이터를 날짜순으로 정렬
    const sortedDates = Array.from(inBodyDataCache.keys())
      .map(dateStr => {
        const date = new Date(dateStr.replace(/\./g, "-"));
        return { dateStr, date };
      })
      .filter(item => !isNaN(item.date.getTime()))
      .sort((a, b) => a.date.getTime() - b.date.getTime());

    // 선택된 필터에 따라 값 추출
    const getValue = (data: any): number | null => {
      if (!data) return null;
      
      switch (selectedFilter) {
        case "체중":
          return data.muscleFatAnalysis?.weight || data.weight || null;
        case "체지방량":
          return data.muscleFatAnalysis?.bodyFatMass || data.bodyFatMass || null;
        case "골격근량":
          return data.muscleFatAnalysis?.skeletalMuscleMass || data.skeletalMuscleMass || null;
        default:
          return null;
      }
    };

    // 그래프 데이터 생성
    const data = sortedDates
      .map(({ dateStr, date }) => {
        const cachedData = inBodyDataCache.get(dateStr);
        const value = getValue(cachedData);
        
        if (value === null || value === undefined) return null;
        
        // 날짜 포맷: MM/DD
        const month = String(date.getMonth() + 1).padStart(2, "0");
        const day = String(date.getDate()).padStart(2, "0");
        
        return {
          x: `${month}/${day}`,
          y: value,
          date: dateStr,
        };
      })
      .filter((item): item is { x: string; y: number; date: string } => item !== null);

    // 데이터가 없으면 기본값 반환
    if (data.length === 0) {
      return [
        { x: "01/01", y: 50 },
      ];
    }

    return data;
  }, [inBodyDataCache, selectedFilter]);

  const screenWidth = Dimensions.get("window").width;
  const chartWidth = Math.min(screenWidth - 40, 400);
  const padding = { top: 20, right: 28, bottom: 26, left: 42 };
  const width = chartWidth;
  const height = 210;
  const smoothness = 0.22;
  const lastPointIndex = graphData.length - 1;

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
    if (selectedPointIndex !== lastPointIndex) {
      setSelectedPointIndex(null);
      setTooltipPosition(null);
    }
  };

  const filterMessages: {
    [key: string]: { tag: string; text: string; detail: string };
  } = {
    체중: {
      tag: "체중 조절",
      text: "적정 체중 | 50.0kg",
      detail: "-1.4kg의 체중 감량이 필요합니다",
    },
    체지방량: {
      tag: "지방량 조절",
      text: "적정 체지방량 | 12.5kg",
      detail: "-0.8kg의 체지방 감량이 필요합니다",
    },
    골격근량: {
      tag: "근육량 조절",
      text: "적정 근육량 | 25.0kg",
      detail: "+2.1kg의 근육량 증가가 필요합니다",
    },
  };

  const currentMessage = filterMessages[selectedFilter];

  // 인바디 날짜 목록 조회
  const fetchInBodyDates = useCallback(async () => {
    try {
      const response = await getInBodyList();
      // API 응답 구조 확인: response.data, response.inBodyList, 또는 response 자체가 배열
      const inBodyList = response?.data || response?.inBodyList || (Array.isArray(response) ? response : []);
      
      if (Array.isArray(inBodyList) && inBodyList.length > 0) {
        // 날짜 형식 유지: API 응답 형식(점) 그대로 사용
        const dates = inBodyList
          .map((item: any) => {
            const date = item.measurementDate || item.date;
            if (date) {
              // 점(.) 형식이면 그대로, 하이픈(-) 형식이면 점으로 변환
              return date.includes(".") ? date : date.replace(/-/g, ".");
            }
            return null;
          })
          .filter((date: string | null) => date !== null) as string[];
        setInBodyDatesList(dates);
        console.log("[INBODY SCREEN] 날짜 목록 로드 성공:", dates);
      } else {
        // 목록이 없으면 최신 데이터에서 날짜 추출
        try {
          const latestResponse = await getLatestInBody();
          const latestData = latestResponse?.success ? latestResponse.inBody : latestResponse;
          if (latestData?.measurementDate) {
            // API 응답 형식(점) 그대로 유지
            const date = latestData.measurementDate.includes(".") 
              ? latestData.measurementDate 
              : latestData.measurementDate.replace(/-/g, ".");
            setInBodyDatesList([date]);
            console.log("[INBODY SCREEN] 최신 데이터에서 날짜 추출:", date);
          }
        } catch (e) {
          console.error("[INBODY SCREEN] 최신 데이터에서 날짜 추출 실패:", e);
        }
      }
    } catch (error) {
      console.error("[INBODY SCREEN] 날짜 목록 로드 실패:", error);
      // 에러 발생 시 최신 데이터에서 날짜 추출
      try {
        const latestResponse = await getLatestInBody();
        const latestData = latestResponse?.success ? latestResponse.inBody : latestResponse;
        if (latestData?.measurementDate) {
          // API 응답 형식(점) 그대로 유지
          const date = latestData.measurementDate.includes(".") 
            ? latestData.measurementDate 
            : latestData.measurementDate.replace(/-/g, ".");
          setInBodyDatesList([date]);
          console.log("[INBODY SCREEN] 에러 후 최신 데이터에서 날짜 추출:", date);
        }
      } catch (e) {
        console.error("[INBODY SCREEN] 최신 데이터에서 날짜 추출 실패:", e);
      }
    }
  }, []);

  // 특정 날짜의 인바디 데이터 조회
  const fetchInBodyDataByDate = useCallback(async (date: Date) => {
    try {
      setLoading(true);
      // 점 형식으로 변환 (API 응답 형식과 일치)
      const dateStr = `${date.getFullYear()}.${String(date.getMonth() + 1).padStart(2, "0")}.${String(date.getDate()).padStart(2, "0")}`;
      
      // 날짜 비교 헬퍼 함수 (점 형식으로 통일)
      const normalizeDate = (dateStr: string): string => {
        // 하이픈을 점으로 변환하여 점 형식으로 통일
        return dateStr.replace(/-/g, ".");
      };
      
      // 먼저 getInBodyByDate 시도
      try {
        const response = await getInBodyByDate(dateStr);
        const inBodyData = response?.success ? response.inBody : response;
        
        if (inBodyData && inBodyData.id) {
          // 캐시에 저장
          setInBodyDataCache(prev => {
            const newCache = new Map(prev);
            newCache.set(dateStr, inBodyData);
            return newCache;
          });
          
          // 날짜 목록에 추가
          setInBodyDatesList(prev => {
            if (!prev.includes(dateStr)) {
              return [...prev, dateStr].sort();
            }
            return prev;
          });
          
          setInBodyData(inBodyData);
          console.log("[INBODY SCREEN] 날짜별 데이터 로드 성공:", inBodyData);
          return;
        }
      } catch (e) {
        console.warn("[INBODY SCREEN] 날짜별 조회 API 실패, 목록에서 검색 시도...");
      }
      
      // 캐시에서 먼저 확인 (함수형 업데이트로 현재 캐시 값 읽기)
      let cachedData: any = null;
      setInBodyDataCache(prev => {
        cachedData = prev.get(dateStr);
        return prev; // 변경 없음
      });
      
      if (cachedData) {
        setInBodyData(cachedData);
        console.log("[INBODY SCREEN] 캐시에서 날짜별 데이터 찾음:", cachedData);
        // 날짜 목록에 추가 (없는 경우)
        setInBodyDatesList(prev => {
          if (!prev.includes(dateStr)) {
            return [...prev, dateStr].sort();
          }
          return prev;
        });
        return;
      }
      
      // getInBodyByDate가 실패하면 getInBodyList로 모든 데이터 가져와서 필터링
      try {
        const response = await getInBodyList();
        const inBodyList = response?.data || response?.inBodyList || (Array.isArray(response) ? response : []);
        
        if (Array.isArray(inBodyList) && inBodyList.length > 0) {
          // 해당 날짜의 데이터 찾기
          const foundData = inBodyList.find((item: any) => {
            const itemDate = item.measurementDate || item.date;
            if (!itemDate) return false;
            
            // 날짜 형식 정규화 후 비교
            const normalizedItemDate = normalizeDate(itemDate);
            const normalizedTargetDate = normalizeDate(dateStr);
            return normalizedItemDate === normalizedTargetDate;
          });
          
          if (foundData) {
            // 캐시에 저장
            setInBodyDataCache(prev => {
              const newCache = new Map(prev);
              newCache.set(dateStr, foundData);
              return newCache;
            });
            
            // 날짜 목록에 추가
            setInBodyDatesList(prev => {
              if (!prev.includes(dateStr)) {
                return [...prev, dateStr].sort();
              }
              return prev;
            });
            
            setInBodyData(foundData);
            console.log("[INBODY SCREEN] 목록에서 날짜별 데이터 찾음:", foundData);
            return;
          }
        }
      } catch (e) {
        console.warn("[INBODY SCREEN] 목록 조회 실패:", e);
      }
      
      // 해당 날짜에 데이터가 없으면 최신 데이터 조회
      try {
        const latestResponse = await getLatestInBody();
        const latestData = latestResponse?.success ? latestResponse.inBody : latestResponse;
        if (latestData && latestData.id) {
          setInBodyData(latestData);
          console.log("[INBODY SCREEN] 해당 날짜 데이터 없음, 최신 데이터 표시");
        }
      } catch (e) {
        console.error("[INBODY SCREEN] 최신 데이터 조회 실패:", e);
      }
    } catch (error) {
      console.error("[INBODY SCREEN] 날짜별 데이터 로드 실패:", error);
      // 에러 발생 시 최신 데이터 조회
      try {
        const latestResponse = await getLatestInBody();
        const latestData = latestResponse?.success ? latestResponse.inBody : latestResponse;
        if (latestData && latestData.id) {
          setInBodyData(latestData);
        }
      } catch (e) {
        console.error("[INBODY SCREEN] 최신 데이터 조회 실패:", e);
      }
    } finally {
      setLoading(false);
    }
  }, []);

  // API로 최신 인바디 정보 조회 (항상 가장 최신 저장 이력 표시)
  const fetchInBodyData = useCallback(async () => {
    try {
      setLoading(true);
      
      // 가장 최신 데이터 조회
      const response = await getLatestInBody();
      const inBodyData = response?.success ? response.inBody : response;
      
      if (inBodyData && inBodyData.id) {
        setInBodyData(inBodyData);
        console.log("[INBODY SCREEN] 최신 데이터 로드 성공:", inBodyData);
        
        // 데이터를 캐시에 저장
        if (inBodyData.measurementDate) {
          const normalizedDate = inBodyData.measurementDate.includes(".") 
            ? inBodyData.measurementDate 
            : inBodyData.measurementDate.replace(/-/g, ".");
          setInBodyDataCache(prev => {
            const newCache = new Map(prev);
            newCache.set(normalizedDate, inBodyData);
            return newCache;
          });
          
          // 날짜 목록에 추가 (없는 경우)
          setInBodyDatesList(prev => {
            if (!prev.includes(normalizedDate)) {
              return [...prev, normalizedDate].sort();
            }
            return prev;
          });
        }
        
        // 최신 데이터의 measurementDate를 사용해서 selectedDate 설정
        if (inBodyData.measurementDate) {
          const dateStr = inBodyData.measurementDate.replace(/\./g, "-");
          const date = new Date(dateStr);
          if (!isNaN(date.getTime())) {
            setSelectedDate(date);
            console.log("[INBODY SCREEN] 최신 날짜 설정:", inBodyData.measurementDate, date);
          }
        }
      } else {
        console.warn("[INBODY SCREEN] API 응답에 데이터가 없습니다:", response);
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
      // 캐시 초기화 (새로 저장된 데이터 반영을 위해)
      console.log("[INBODY SCREEN] 화면 포커스, 캐시 초기화 및 데이터 새로고침");
      setInBodyDataCache(new Map()); // 캐시 초기화
      fetchInBodyData();
      fetchInBodyDates();
    }, [fetchInBodyData, fetchInBodyDates])
  );

  // 날짜 선택 핸들러
  const handleDateSelect = useCallback((date: Date) => {
    setSelectedDate(date);
    fetchInBodyDataByDate(date);
  }, [fetchInBodyDataByDate]);

  // 컴포넌트 마운트 시 마지막 포인트를 활성화
  useEffect(() => {
    if (graphPoints.length > 0 && activeTab === "graph") {
      const lastPoint = graphPoints[lastPointIndex];
      setSelectedPointIndex(lastPointIndex);
      setTooltipPosition({
        x: (lastPoint.x / width) * 100,
        y: ((lastPoint.y - 30) / height) * 100,
      });
    }
  }, [graphPoints.length, activeTab]);

  // API 데이터에서 값 추출 헬퍼 함수
  const extractValue = (str: string | undefined): string => {
    if (!str) return "N/A";
    // "30.4 ( 26.1 ~ 34.3 )" 형식에서 숫자만 추출
    const match = str.match(/^([\d.]+)/);
    return match ? match[1] : str;
  };

  const extractRange = (str: string | undefined): string => {
    if (!str) return "";
    // "30.4 ( 26.1 ~ 34.3 )" 형식에서 범위 추출
    const match = str.match(/\(([^)]+)\)/);
    return match ? `(${match[1]})` : "";
  };

  // API에서 가져온 날짜를 포함한 날짜 배열 (점 형식으로 통일)
  const inbodyDates = useMemo(() => {
    const baseDates = [
      "2025.01.15",
      "2025.01.22",
      "2025.01.29",
      "2025.02.05",
      "2025.02.12",
      "2025.02.19",
      "2025.02.26",
      "2025.03.05",
      "2025.03.12",
      "2025.03.19",
      "2025.03.26",
      "2025.04.02",
      "2025.04.09",
      "2025.04.16",
      "2025.04.23",
      "2025.04.30",
      "2025.05.07",
      "2025.05.14",
      "2025.05.21",
      "2025.05.28",
      "2025.06.04",
      "2025.06.11",
      "2025.06.18",
      "2025.06.25",
      "2025.07.02",
      "2025.07.09",
      "2025.07.16",
      "2025.07.23",
      "2025.07.30",
      "2025.08.06",
      "2025.08.13",
      "2025.08.20",
      "2025.08.27",
      "2025.09.03",
      "2025.09.10",
      "2025.09.17",
      "2025.09.24",
      "2025.10.01",
      "2025.10.08",
      "2025.10.15",
      "2025.10.22",
      "2025.10.29",
      "2025.11.05",
      "2025.11.12",
      "2025.11.19",
      "2025.11.26",
      "2025.12.03",
      "2025.12.10",
      "2025.12.17",
      "2025.12.24",
      "2025.12.31",
    ];

    // API에서 가져온 모든 날짜 목록과 최신 데이터 날짜를 합침
    const allDates = new Set<string>(baseDates);
    
    // inBodyDatesList에 있는 모든 날짜 추가
    inBodyDatesList.forEach(date => {
      if (date) {
        const normalizedDate = date.includes(".") ? date : date.replace(/-/g, ".");
        allDates.add(normalizedDate);
      }
    });
    
    // 최신 데이터의 날짜도 추가
    if (inBodyData?.measurementDate) {
      const apiDate = inBodyData.measurementDate.includes(".") 
        ? inBodyData.measurementDate 
        : inBodyData.measurementDate.replace(/-/g, ".");
      allDates.add(apiDate);
    }

    // 정렬하여 반환
    return Array.from(allDates).sort();
  }, [inBodyData?.measurementDate, inBodyDatesList]);

  const handleGraphClick = () => {
    setActiveTab("graph");
  };

  const handleDateChange = (newDate: Date) => {
    setSelectedDate(newDate);
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

        {/* 날짜 선택 - 인바디 정보 탭에서만 표시 */}
        {activeTab === "info" && (
          <View style={styles.dateNavigatorContainer}>
            <TouchableOpacity
              onPress={() => setCalendarVisible(true)}
              style={styles.dateNavigatorTouchable}
            >
              <InbodyDateNavigator
                dates={inbodyDates}
                onChange={handleDateSelect}
                selectedDate={selectedDate}
              />
              <Icon name="calendar-outline" size={20} color="#d6ff4b" style={styles.calendarIcon} />
            </TouchableOpacity>
          </View>
        )}

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
                {/* 체성분 분석 */}
                <View style={styles.analysisSection}>
                  <Text style={styles.sectionTitle}>체성분 분석</Text>
                  <View style={styles.metricList}>
                    <View style={styles.metricItem}>
                      <Text style={styles.metricName}>체수분</Text>
                      <Text style={styles.metricValue}>
                        {extractValue(inBodyData.bodyComposition?.totalBodyWater)}
                      </Text>
                      <Text style={styles.metricRange}>
                        {extractRange(inBodyData.bodyComposition?.totalBodyWater)}
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
                      value={extractValue(inBodyData.bodyComposition?.totalBodyWater)}
                      percentage={75}
                      status="표준"
                    />
                    <BarChartItem
                      label="골격근량"
                      value={inBodyData.muscleFatAnalysis?.skeletalMuscleMass?.toFixed(1) || "N/A"}
                      percentage={30}
                      status={inBodyData.muscleFatAnalysis?.skeletalMuscleStatus || "표준"}
                    />
                    <BarChartItem
                      label="체지방량"
                      value={inBodyData.muscleFatAnalysis?.bodyFatMass?.toFixed(1) || "N/A"}
                      percentage={50}
                      status={inBodyData.muscleFatAnalysis?.bodyFatStatus || "표준"}
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
                      value={inBodyData.obesityAnalysis?.bmi?.toFixed(1) || "N/A"}
                      percentage={38}
                      status={inBodyData.obesityAnalysis?.bmiStatus || "표준"}
                    />
                    <BarChartItem
                      label="체지방률"
                      value={inBodyData.obesityAnalysis?.bodyFatPercentage?.toFixed(1) || "N/A"}
                      percentage={72}
                      status={inBodyData.obesityAnalysis?.bodyFatPercentageStatus || "표준"}
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
                    <BarChartItem
                      label="오른팔"
                      value="N/A"
                      percentage={58}
                      status={inBodyData.segmentalMuscleAnalysis?.rightArm || "표준"}
                    />
                    <BarChartItem
                      label="왼팔"
                      value="N/A"
                      percentage={66}
                      status={inBodyData.segmentalMuscleAnalysis?.leftArm || "표준"}
                    />
                    <BarChartItem
                      label="몸통"
                      value="N/A"
                      percentage={22}
                      status={inBodyData.segmentalMuscleAnalysis?.trunk || "표준"}
                    />
                    <BarChartItem
                      label="오른다리"
                      value="N/A"
                      percentage={55}
                      status={inBodyData.segmentalMuscleAnalysis?.rightLeg || "표준"}
                    />
                    <BarChartItem
                      label="왼다리"
                      value="N/A"
                      percentage={59}
                      status={inBodyData.segmentalMuscleAnalysis?.leftLeg || "표준"}
                      isLast
                    />
                  </View>
                </View>
              </>
            ) : (
              <View style={styles.emptyContainer}>
                <Text style={styles.emptyText}>인바디 데이터가 없습니다.</Text>
                <Text style={styles.emptySubText}>수기로 입력하거나 사진으로 입력해주세요.</Text>
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
                <Text style={styles.highlightName}>유정님</Text>, 지난주보다
                체중이 1.2% 감소했어요!{"\n"}목표치가 얼마 안 남았어요 👍
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

      {/* 달력 모달 */}
      <InBodyCalendarModal
        visible={calendarVisible}
        onClose={() => setCalendarVisible(false)}
        onSelectDate={handleDateSelect}
        selectedDate={selectedDate}
        inBodyDates={inBodyDatesList}
      />
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
        <View style={[styles.barFill, { width: `${percentage}%` }]} />
        <Text style={styles.barValue}>{value}</Text>
      </View>
    </View>
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
  dateNavigatorContainer: {
    marginBottom: 20,
  },
  dateNavigatorTouchable: {
    flexDirection: "row",
    alignItems: "center",
    justifyContent: "center",
    position: "relative",
  },
  calendarIcon: {
    position: "absolute",
    right: 16,
  },
  analysisSection: {
    marginBottom: 24,
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
  },
  barContainer: {
    position: "relative",
    height: 20,
    backgroundColor: "#333333",
    borderRadius: 10,
    overflow: "hidden",
  },
  barFill: {
    height: "100%",
    backgroundColor: "#e3ff7c",
    borderRadius: 10,
  },
  barValue: {
    position: "absolute",
    right: 8,
    top: "50%",
    transform: [{ translateY: -10 }],
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
