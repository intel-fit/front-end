// src/screens/HealthScoreTrendScreen.tsx
import React, { useState, useEffect } from "react";
import {
  View,
  Text,
  StyleSheet,
  ScrollView,
  ActivityIndicator,
  TouchableOpacity,
  Dimensions,
} from "react-native";
import { SafeAreaView } from "react-native-safe-area-context";
import { Ionicons as Icon } from "@expo/vector-icons";
import { LineChart } from "react-native-chart-kit";
import { healthScoreAPI, ScoreTrendItem } from "../../services";
import { colors } from "../../theme/colors";

type PeriodType = "daily" | "weekly" | "monthly";

const HealthScoreTrendScreen = ({ navigation }: any) => {
  const [period, setPeriod] = useState<PeriodType>("daily");
  const [trendData, setTrendData] = useState<ScoreTrendItem[]>([]);
  const [loading, setLoading] = useState(true);

  useEffect(() => {
    loadTrendData();
  }, [period]);

  const loadTrendData = async () => {
    try {
      setLoading(true);
      let data: ScoreTrendItem[] = [];

      if (period === "daily") {
        data = await healthScoreAPI.getDailyTrend();
      } else if (period === "weekly") {
        data = await healthScoreAPI.getWeeklyTrend();
      } else {
        data = await healthScoreAPI.getMonthlyTrend();
      }

      console.log(`🎯 [SCREEN] ${period} 데이터 로드:`, data);

      // 유효한 데이터만 필터링
      const validData = data.filter(
        (item) =>
          item &&
          typeof item.total === "number" &&
          !isNaN(item.total) &&
          item.date
      );

      // 날짜순 오름차순 정렬 (과거 -> 미래)
      validData.sort(
        (a, b) => new Date(a.date).getTime() - new Date(b.date).getTime()
      );

      setTrendData(validData);
    } catch (error) {
      console.error("건강점수 트렌드 로드 실패:", error);
      setTrendData([]);
    } finally {
      setLoading(false);
    }
  };

  // ✅ [통합 수정] 기간별 고정 축 데이터 생성 함수 (오늘 기준)
  // 데이터가 없어도 날짜 축을 고정해서 보여줍니다.
  const getProcessedGraphData = () => {
    const today = new Date();
    const result = [];

    // 🛠️ 로컬 시간 기준 날짜 문자열 변환 헬퍼 (YYYY-MM-DD)
    const getLocalDateString = (date: Date) => {
      const year = date.getFullYear();
      const month = String(date.getMonth() + 1).padStart(2, "0");
      const day = String(date.getDate()).padStart(2, "0");
      return `${year}-${month}-${day}`;
    };

    if (period === "daily") {
      // 🟢 일간: 오늘 포함 최근 5일
      for (let i = 4; i >= 0; i--) {
        const d = new Date(today);
        d.setDate(today.getDate() - i);

        // 🚨 수정됨: ISOString 대신 로컬 시간 사용
        const dateKey = getLocalDateString(d);

        // 날짜가 정확히 일치하는지 확인
        const foundData = trendData.find((item) => item.date === dateKey);

        result.push({
          date: d,
          score: foundData ? Number(foundData.total) : 0,
        });
      }
    } else if (period === "weekly") {
      // 🟢 주간: 이번 주 포함 최근 5주
      for (let i = 4; i >= 0; i--) {
        const d = new Date(today);
        d.setDate(today.getDate() - i * 7);

        // 해당 주차의 시작일과 종료일 계산 (대략적 범위)
        const weekEnd = new Date(d);
        weekEnd.setHours(23, 59, 59, 999);

        const weekStart = new Date(d);
        weekStart.setDate(d.getDate() - 6);
        weekStart.setHours(0, 0, 0, 0);

        // 해당 주간 범위(Start ~ End)에 포함되는 데이터 중 가장 최신 것 찾기
        // (또는 해당 주간의 평균을 내고 싶다면 로직 변경 가능)
        const foundData = trendData.find((item) => {
          const itemDate = new Date(item.date);
          // 날짜 비교 시 시간 간섭을 피하기 위해 날짜 문자열로 비교 권장되나,
          // 여기서는 범위 체크를 위해 Date 객체 비교 사용
          return itemDate >= weekStart && itemDate <= weekEnd;
        });

        result.push({
          date: d,
          score: foundData ? Number(foundData.total) : 0,
        });
      }
    } else {
      // 🟢 월간: 이번 달 포함 최근 6개월
      for (let i = 5; i >= 0; i--) {
        const d = new Date(today);
        d.setDate(1); // 1일로 설정하여 월 계산 오차 방지
        d.setMonth(today.getMonth() - i);

        const year = d.getFullYear();
        const month = String(d.getMonth() + 1).padStart(2, "0");
        const monthKey = `${year}-${month}`; // YYYY-MM

        // 해당 월(YYYY-MM)로 시작하는 데이터 찾기
        // 월간 데이터가 여러 개라면 그 중 하나(보통 월말 결산)를 가져오거나 평균을 내야 함
        // 현재는 해당 월의 데이터가 있으면 가져오는 방식
        const foundData = trendData.find((item) =>
          item.date.startsWith(monthKey)
        );

        result.push({
          date: d,
          score: foundData ? Number(foundData.total) : 0,
        });
      }
    }

    return result;
  };

  const graphData = getProcessedGraphData();

  // 차트 데이터 생성
  const chartData = {
    labels:
      graphData.length > 0
        ? graphData.map((item) => {
            const date = item.date;

            if (period === "monthly") {
              return `${date.getMonth() + 1}월`;
            } else if (period === "weekly") {
              return `${date.getMonth() + 1}/${date.getDate()}`;
            } else {
              return `${date.getMonth() + 1}/${date.getDate()}`;
            }
          })
        : [""],
    datasets: [
      {
        data:
          graphData.length > 0
            ? graphData.map((item) => {
                const value = item.score;
                return isNaN(value) ? 0 : value;
              })
            : [0],
        color: (opacity = 1) => `rgba(227, 255, 124, ${opacity})`,
        strokeWidth: 3,
      },
    ],
  };

  // 최근 점수 (데이터가 있는 가장 마지막 날짜 기준)
  const latestScore =
    trendData.length > 0
      ? Math.round(trendData[trendData.length - 1].total || 0)
      : 0;

  // 평균 점수 (전체 기록 기준)
  const averageScore =
    trendData.length > 0
      ? Math.round(
          trendData.reduce((sum, item) => {
            const value = Number(item.total);
            return sum + (isNaN(value) ? 0 : value);
          }, 0) / trendData.length
        )
      : 0;

  return (
    <SafeAreaView style={styles.container} edges={["top"]}>
      {/* 헤더 */}
      <View style={styles.header}>
        <TouchableOpacity
          style={styles.backButton}
          onPress={() => navigation.goBack()}
        >
          <Icon name="arrow-back" size={24} color="#ffffff" />
        </TouchableOpacity>
        <Text style={styles.headerTitle}>건강점수 추이</Text>
        <View style={styles.headerRight} />
      </View>

      <ScrollView style={styles.content}>
        {/* 기간 선택 탭 */}
        <View style={styles.periodTabs}>
          <TouchableOpacity
            style={[
              styles.periodTab,
              period === "daily" && styles.periodTabActive,
            ]}
            onPress={() => setPeriod("daily")}
          >
            <Text
              style={[
                styles.periodTabText,
                period === "daily" && styles.periodTabTextActive,
              ]}
            >
              일간
            </Text>
          </TouchableOpacity>
          <TouchableOpacity
            style={[
              styles.periodTab,
              period === "weekly" && styles.periodTabActive,
            ]}
            onPress={() => setPeriod("weekly")}
          >
            <Text
              style={[
                styles.periodTabText,
                period === "weekly" && styles.periodTabTextActive,
              ]}
            >
              주간
            </Text>
          </TouchableOpacity>
          <TouchableOpacity
            style={[
              styles.periodTab,
              period === "monthly" && styles.periodTabActive,
            ]}
            onPress={() => setPeriod("monthly")}
          >
            <Text
              style={[
                styles.periodTabText,
                period === "monthly" && styles.periodTabTextActive,
              ]}
            >
              월간
            </Text>
          </TouchableOpacity>
        </View>

        {loading ? (
          <View style={styles.loadingContainer}>
            <ActivityIndicator size="large" color="#E3FF7C" />
            <Text style={styles.loadingText}>불러오는 중...</Text>
          </View>
        ) : (
          /* 데이터 유무와 상관없이 로딩이 끝나면 그래프를 보여줍니다 (0점 처리됨) */
          <>
            {/* 요약 카드 */}
            <View style={styles.summaryCards}>
              <View style={styles.summaryCard}>
                <Text style={styles.summaryLabel}>최근 점수</Text>
                <Text style={styles.summaryValue}>{latestScore}</Text>
              </View>
              <View style={styles.summaryCard}>
                <Text style={styles.summaryLabel}>평균 점수</Text>
                <Text style={styles.summaryValue}>{averageScore}</Text>
              </View>
            </View>

            {/* 그래프 */}
            <View style={styles.chartContainer}>
              <LineChart
                data={chartData}
                width={Dimensions.get("window").width - 40}
                height={220}
                chartConfig={{
                  backgroundColor: "#2a2a2a",
                  backgroundGradientFrom: "#2a2a2a",
                  backgroundGradientTo: "#2a2a2a",
                  decimalPlaces: 0,
                  color: (opacity = 1) => `rgba(227, 255, 124, ${opacity})`,
                  labelColor: (opacity = 1) =>
                    `rgba(255, 255, 255, ${opacity})`,
                  style: {
                    borderRadius: 16,
                  },
                  propsForDots: {
                    r: "4",
                    strokeWidth: "2",
                    stroke: "#E3FF7C",
                  },
                }}
                bezier
                style={styles.chart}
                fromZero={true}
              />
            </View>

            {/* 점수 히스토리 (전체 기록) */}
            <View style={styles.historySection}>
              <Text style={styles.historyTitle}>점수 기록</Text>
              {trendData.length > 0 ? (
                trendData
                  .slice()
                  .reverse()
                  .map((item, index) => {
                    const score = Math.round(item.total || 0);
                    return (
                      <View key={index} style={styles.historyItem}>
                        <Text style={styles.historyDate}>{item.date}</Text>
                        <Text style={styles.historyScore}>{score}점</Text>
                      </View>
                    );
                  })
              ) : (
                <View style={styles.emptyHistoryContainer}>
                  <Text style={styles.historyEmptyText}>
                    아직 기록된 점수가 없습니다.
                  </Text>
                  <Text style={styles.historyEmptySubText}>
                    오늘의 식단과 운동을 기록해보세요!
                  </Text>
                </View>
              )}
            </View>
          </>
        )}
      </ScrollView>
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
    alignItems: "center",
    justifyContent: "space-between",
    paddingHorizontal: 20,
    paddingVertical: 16,
  },
  backButton: {
    width: 40,
    height: 40,
    justifyContent: "center",
  },
  headerTitle: {
    fontSize: 18,
    fontWeight: "600",
    color: "#ffffff",
  },
  headerRight: {
    width: 40,
  },
  content: {
    flex: 1,
    paddingHorizontal: 20,
  },
  periodTabs: {
    flexDirection: "row",
    backgroundColor: "#2a2a2a",
    borderRadius: 12,
    padding: 4,
    marginBottom: 20,
  },
  periodTab: {
    flex: 1,
    paddingVertical: 10,
    alignItems: "center",
    borderRadius: 8,
  },
  periodTabActive: {
    backgroundColor: "#E3FF7C",
  },
  periodTabText: {
    fontSize: 14,
    fontWeight: "600",
    color: "#666",
  },
  periodTabTextActive: {
    color: "#000",
  },
  loadingContainer: {
    paddingVertical: 60,
    alignItems: "center",
    gap: 12,
  },
  loadingText: {
    fontSize: 14,
    color: "#aaa",
  },
  emptyContainer: {
    paddingVertical: 60,
    alignItems: "center",
    gap: 12,
  },
  emptyText: {
    fontSize: 16,
    fontWeight: "600",
    color: "#ffffff",
  },
  emptySubText: {
    fontSize: 14,
    color: "#aaa",
  },
  summaryCards: {
    flexDirection: "row",
    gap: 12,
    marginBottom: 20,
  },
  summaryCard: {
    flex: 1,
    backgroundColor: "#2a2a2a",
    borderRadius: 12,
    padding: 16,
    alignItems: "center",
  },
  summaryLabel: {
    fontSize: 12,
    color: "#aaa",
    marginBottom: 8,
  },
  summaryValue: {
    fontSize: 32,
    fontWeight: "700",
    color: "#E3FF7C",
  },
  chartContainer: {
    alignItems: "center",
    marginBottom: 20,
  },
  chart: {
    borderRadius: 16,
  },
  historySection: {
    backgroundColor: "#2a2a2a",
    borderRadius: 12,
    padding: 16,
    marginBottom: 20,
  },
  historyTitle: {
    fontSize: 16,
    fontWeight: "600",
    color: "#ffffff",
    marginBottom: 16,
  },
  historyItem: {
    flexDirection: "row",
    justifyContent: "space-between",
    alignItems: "center",
    paddingVertical: 12,
    borderBottomWidth: 1,
    borderBottomColor: "#333",
  },
  historyDate: {
    fontSize: 14,
    color: "#aaa",
  },
  historyScore: {
    fontSize: 16,
    fontWeight: "600",
    color: "#E3FF7C",
  },
  emptyHistoryContainer: {
    paddingVertical: 20,
    alignItems: "center",
    gap: 4,
  },
  historyEmptyText: {
    color: "#fff",
    fontSize: 14,
    fontWeight: "600",
    textAlign: "center",
  },
  historyEmptySubText: {
    color: "#666",
    fontSize: 12,
    textAlign: "center",
  },
});

export default HealthScoreTrendScreen;
