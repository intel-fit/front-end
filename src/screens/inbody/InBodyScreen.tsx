import React, { useState, useMemo, useEffect } from "react";
import {
  View,
  Text,
  StyleSheet,
  ScrollView,
  TouchableOpacity,
  Dimensions,
} from "react-native";
import { SafeAreaView } from "react-native-safe-area-context";
import Svg, { Path, Circle, Line, Text as SvgText, G } from "react-native-svg";
import { Ionicons as Icon } from "@expo/vector-icons";
import InbodyDateNavigator from "../../components/common/InbodyDateNavigator";

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

  // 그래프 데이터
  const graphData = [
    { x: "04/01", y: 49.2 },
    { x: "04/06", y: 52.1 },
    { x: "04/19", y: 50.4 },
    { x: "04/25", y: 48.9 },
    { x: "05/02", y: 47.8 },
    { x: "05/04", y: 51.4 },
  ];

  const screenWidth = Dimensions.get("window").width;
  const chartWidth = Math.min(screenWidth - 40, 400);
  const padding = { top: 20, right: 28, bottom: 26, left: 42 };
  const width = chartWidth;
  const height = 210;
  const yTicks = [54, 52, 50, 48, 46];
  const baseline = 46;
  const smoothness = 0.22;
  const lastPointIndex = graphData.length - 1;

  const minY = Math.min(baseline, ...graphData.map((d) => d.y));
  const maxY = Math.max(...yTicks, ...graphData.map((d) => d.y));
  const iw = width - padding.left - padding.right;
  const ih = height - padding.top - padding.bottom;
  const scaleX = (i: number) =>
    padding.left + (iw * i) / (graphData.length - 1);
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

  const inbodyDates = [
    "2025-01-15",
    "2025-01-22",
    "2025-01-29",
    "2025-02-05",
    "2025-02-12",
    "2025-02-19",
    "2025-02-26",
    "2025-03-05",
    "2025-03-12",
    "2025-03-19",
    "2025-03-26",
    "2025-04-02",
    "2025-04-09",
    "2025-04-16",
    "2025-04-23",
    "2025-04-30",
    "2025-05-07",
    "2025-05-14",
    "2025-05-21",
    "2025-05-28",
    "2025-06-04",
    "2025-06-11",
    "2025-06-18",
    "2025-06-25",
    "2025-07-02",
    "2025-07-09",
    "2025-07-16",
    "2025-07-23",
    "2025-07-30",
    "2025-08-06",
    "2025-08-13",
    "2025-08-20",
    "2025-08-27",
    "2025-09-03",
    "2025-09-10",
    "2025-09-17",
    "2025-09-24",
    "2025-10-01",
    "2025-10-08",
    "2025-10-15",
    "2025-10-22",
    "2025-10-29",
    "2025-11-05",
    "2025-11-12",
    "2025-11-19",
    "2025-11-26",
    "2025-12-03",
    "2025-12-10",
    "2025-12-17",
    "2025-12-24",
    "2025-12-31",
  ];

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
            <InbodyDateNavigator
              dates={inbodyDates}
              onChange={handleDateChange}
            />
          </View>
        )}

        {/* 인바디 정보 탭 컨텐츠 */}
        {activeTab === "info" && (
          <>
            {/* 체성분 분석 */}
            <View style={styles.analysisSection}>
              <Text style={styles.sectionTitle}>체성분 분석</Text>
              <View style={styles.metricList}>
                <View style={styles.metricItem}>
                  <Text style={styles.metricName}>체수분</Text>
                  <Text style={styles.metricValue}>37.8</Text>
                  <Text style={styles.metricRange}>(34.8~42.6)</Text>
                </View>
                <View style={styles.metricItem}>
                  <Text style={styles.metricName}>단백질</Text>
                  <Text style={styles.metricValue}>10.2</Text>
                  <Text style={styles.metricRange}>(9.4~11.4)</Text>
                </View>
                <View style={styles.metricItem}>
                  <Text style={styles.metricName}>무기질</Text>
                  <Text style={styles.metricValue}>3.32</Text>
                  <Text style={styles.metricRange}>(3.22~3.94)</Text>
                </View>
                <View style={[styles.metricItem, styles.metricItemLast]}>
                  <Text style={styles.metricName}>체지방</Text>
                  <Text style={styles.metricValue}>13.1</Text>
                  <Text style={styles.metricRange}>(7.4~14.9)</Text>
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
                  value="37.8"
                  percentage={75}
                  status="표준"
                />
                <BarChartItem
                  label="골격근량"
                  value="28.7"
                  percentage={30}
                  status="표준"
                />
                <BarChartItem
                  label="체지방량"
                  value="13.1"
                  percentage={50}
                  status="표준"
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
                  value="22.9"
                  percentage={38}
                  status="표준"
                />
                <BarChartItem
                  label="체지방률"
                  value="20.3"
                  percentage={72}
                  status="표준"
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
                  value="2.79"
                  percentage={58}
                  status="표준"
                />
                <BarChartItem
                  label="왼팔"
                  value="2.69"
                  percentage={66}
                  status="표준"
                />
                <BarChartItem
                  label="몸통"
                  value="22.7"
                  percentage={22}
                  status="표준"
                />
                <BarChartItem
                  label="오른다리"
                  value="8.27"
                  percentage={55}
                  status="표준"
                />
                <BarChartItem
                  label="왼다리"
                  value="8.15"
                  percentage={59}
                  status="표준"
                  isLast
                />
              </View>
            </View>
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
    transform: [{ translateY: -8 }],
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
});

export default InBodyScreen;
