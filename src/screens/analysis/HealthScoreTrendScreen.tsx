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

      setTrendData(data);
    } catch (error) {
      console.error("건강점수 트렌드 로드 실패:", error);
      setTrendData([]);
    } finally {
      setLoading(false);
    }
  };

  const chartData = {
    labels:
      trendData.length > 0
        ? trendData.map((item) => {
            const date = new Date(item.date);
            return period === "monthly"
              ? `${date.getMonth() + 1}월`
              : `${date.getMonth() + 1}/${date.getDate()}`;
          })
        : [""],
    datasets: [
      {
        data: trendData.length > 0 ? trendData.map((item) => item.score) : [0],
        color: (opacity = 1) => `rgba(227, 255, 124, ${opacity})`,
        strokeWidth: 3,
      },
    ],
  };

  const latestScore =
    trendData.length > 0 ? trendData[trendData.length - 1].score : 0;
  const averageScore =
    trendData.length > 0
      ? Math.round(
          trendData.reduce((sum, item) => sum + item.score, 0) /
            trendData.length
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
        ) : trendData.length === 0 ? (
          <View style={styles.emptyContainer}>
            <Icon name="analytics-outline" size={64} color="#666" />
            <Text style={styles.emptyText}>
              아직 건강점수 데이터가 없습니다
            </Text>
            <Text style={styles.emptySubText}>
              꾸준히 기록하면 점수가 생성됩니다
            </Text>
          </View>
        ) : (
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
              />
            </View>

            {/* 점수 히스토리 */}
            <View style={styles.historySection}>
              <Text style={styles.historyTitle}>점수 기록</Text>
              {trendData
                .slice()
                .reverse()
                .map((item, index) => (
                  <View key={index} style={styles.historyItem}>
                    <Text style={styles.historyDate}>{item.date}</Text>
                    <Text style={styles.historyScore}>{item.score}점</Text>
                  </View>
                ))}
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
  healthScoreLoading: {
    width: 100,
    height: 100,
    justifyContent: "center",
    alignItems: "center",
  },
  healthScoreNoData: {
    fontSize: 12,
    color: "#888",
  },
  healthScoreFooter: {
    flexDirection: "row",
    justifyContent: "space-between",
    alignItems: "center",
  },
});

export default HealthScoreTrendScreen;
