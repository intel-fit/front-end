import React, { useState, useEffect, useCallback } from "react";
import {
  View,
  Text,
  TextInput,
  TouchableOpacity,
  StyleSheet,
  ScrollView,
  Alert,
  ActivityIndicator,
} from "react-native";
import { SafeAreaView } from "react-native-safe-area-context";
import { Ionicons as Icon } from "@expo/vector-icons";
import { colors } from "../../theme/colors";
import {
  deleteExerciseGoal,
  getExerciseGoalSummary,
  saveExerciseGoal,
} from "../../utils/exerciseGoalApi";

const DEFAULT_GOAL = {
  frequency: 3,
  duration: "30분 이상",
  type: "유산소",
  calories: 1500,
};

const parseFrequency = (weeklyFrequency?: string | null) => {
  if (!weeklyFrequency) return DEFAULT_GOAL.frequency;
  const parsed = parseInt(weeklyFrequency.replace(/[^0-9]/g, ""), 10);
  if (Number.isNaN(parsed) || parsed <= 0) return DEFAULT_GOAL.frequency;
  return Math.min(Math.max(parsed, 1), 7);
};

const GoalScreen = ({ navigation }: any) => {
  const [goals, setGoals] = useState(DEFAULT_GOAL);
  const [loading, setLoading] = useState(true);
  const [saving, setSaving] = useState(false);

  const loadGoalFromApi = useCallback(async () => {
    try {
      setLoading(true);
      const summary = await getExerciseGoalSummary();
      if (summary) {
        setGoals({
          frequency: parseFrequency(summary.weeklyFrequency),
          duration: summary.durationPerSession || DEFAULT_GOAL.duration,
          type: summary.exerciseType || DEFAULT_GOAL.type,
          calories:
            typeof summary.weeklyCalorieGoal === "number"
              ? summary.weeklyCalorieGoal
              : DEFAULT_GOAL.calories,
        });
      } else {
        setGoals(DEFAULT_GOAL);
      }
    } catch (error) {
      console.error("[GOAL] 목표 불러오기 실패:", error);
      setGoals(DEFAULT_GOAL);
    } finally {
      setLoading(false);
    }
  }, []);

  useEffect(() => {
    loadGoalFromApi();
  }, [loadGoalFromApi]);

  const handleSave = async () => {
    if (saving) return;
    try {
      setSaving(true);
      await saveExerciseGoal({
        weeklyFrequency: `주 ${goals.frequency}회`,
        durationPerSession: goals.duration,
        exerciseType: goals.type,
        weeklyCalorieGoal: Number.isFinite(goals.calories)
          ? goals.calories
          : DEFAULT_GOAL.calories,
      });
      navigation.navigate("Stats", {
        exerciseGoal: {
          weeklyFrequency: `주 ${goals.frequency}회`,
          durationPerSession: goals.duration,
          exerciseType: goals.type,
          weeklyCalorieGoal: Number.isFinite(goals.calories)
            ? goals.calories
            : DEFAULT_GOAL.calories,
        },
      });
    } catch (error) {
      console.error("[GOAL] 목표 저장 실패:", error);
      Alert.alert("저장 실패", "운동 목표를 저장하지 못했습니다. 다시 시도해 주세요.");
    } finally {
      setSaving(false);
    }
  };

  const handleDelete = async () => {
    Alert.alert("운동 목표 삭제", "운동 목표를 삭제하시겠어요?", [
      { text: "취소", style: "cancel" },
      {
        text: "삭제",
        style: "destructive",
        onPress: async () => {
          try {
            setSaving(true);
            await deleteExerciseGoal();
            setGoals(DEFAULT_GOAL);
                navigation.navigate("Stats", { exerciseGoal: null });
          } catch (error) {
            console.error("[GOAL] 목표 삭제 실패:", error);
            Alert.alert(
              "삭제 실패",
              "운동 목표를 삭제하지 못했습니다. 다시 시도해 주세요."
            );
          } finally {
            setSaving(false);
          }
        },
      },
    ]);
  };

  const adjustFrequency = (change: number) => {
    setGoals((prev) => ({
      ...prev,
      frequency: Math.max(1, Math.min(7, prev.frequency + change)),
    }));
  };

  return (
    <SafeAreaView style={styles.container}>
      <View style={styles.header}>
        <TouchableOpacity
          onPress={() => navigation.goBack()}
          style={styles.backButton}
        >
          <Icon name="chevron-back" size={28} color="#ffffff" />
        </TouchableOpacity>
        <Text style={styles.headerTitle}>운동 목표 설정</Text>
        <TouchableOpacity
          onPress={handleSave}
          style={styles.saveButton}
          disabled={saving}
        >
          <Icon name="checkmark" size={28} color="#ffffff" />
        </TouchableOpacity>
      </View>

      {loading ? (
        <View style={styles.loadingContainer}>
          <ActivityIndicator size="small" color="#d6ff4b" />
          <Text style={styles.loadingText}>목표 정보를 불러오는 중입니다...</Text>
        </View>
      ) : (
        <ScrollView style={styles.content}>
          <View style={styles.section}>
            <Text style={styles.sectionTitle}>주간 운동 횟수</Text>
            <View style={styles.frequencyControl}>
              <Text style={styles.frequencyValue}>주 {goals.frequency}회</Text>
              <View style={styles.adjustButtons}>
                <TouchableOpacity
                  style={styles.adjustBtn}
                  onPress={() => adjustFrequency(-1)}
                >
                  <Text style={styles.adjustBtnText}>-</Text>
                </TouchableOpacity>
                <TouchableOpacity
                  style={styles.adjustBtn}
                  onPress={() => adjustFrequency(1)}
                >
                  <Text style={styles.adjustBtnText}>+</Text>
                </TouchableOpacity>
              </View>
            </View>
          </View>

          <View style={styles.section}>
            <Text style={styles.sectionTitle}>1회 운동 시간</Text>
            <View style={styles.timeContainer}>
              <TextInput
                style={styles.input}
                value={goals.duration}
                onChangeText={(text) => setGoals({ ...goals, duration: text })}
                placeholder="예: 30분 이상"
                placeholderTextColor="#666666"
              />
            </View>
          </View>

          <View style={styles.section}>
            <Text style={styles.sectionTitle}>운동 종류</Text>
            <View style={styles.typeOptions}>
              <TouchableOpacity
                style={[
                  styles.typeBtn,
                  goals.type === "전체" && styles.typeBtnActive,
                ]}
                onPress={() => setGoals({ ...goals, type: "전체" })}
              >
                <Text
                  style={[
                    styles.typeBtnText,
                    goals.type === "전체" && styles.typeBtnTextActive,
                  ]}
                >
                  전체
                </Text>
              </TouchableOpacity>
              <TouchableOpacity
                style={[
                  styles.typeBtn,
                  goals.type === "유산소" && styles.typeBtnActive,
                ]}
                onPress={() => setGoals({ ...goals, type: "유산소" })}
              >
                <Text
                  style={[
                    styles.typeBtnText,
                    goals.type === "유산소" && styles.typeBtnTextActive,
                  ]}
                >
                  유산소
                </Text>
              </TouchableOpacity>
              <TouchableOpacity
                style={[
                  styles.typeBtn,
                  goals.type === "무산소" && styles.typeBtnActive,
                ]}
                onPress={() => setGoals({ ...goals, type: "무산소" })}
              >
                <Text
                  style={[
                    styles.typeBtnText,
                    goals.type === "무산소" && styles.typeBtnTextActive,
                  ]}
                >
                  무산소
                </Text>
              </TouchableOpacity>
            </View>
          </View>

          <View style={styles.section}>
            <Text style={styles.sectionTitle}>주간 칼로리 소모 목표</Text>
            <View style={styles.calorieContainer}>
              <TextInput
                style={styles.input}
                value={String(goals.calories)}
                onChangeText={(text) =>
                  setGoals({
                    ...goals,
                    calories: Number.parseInt(text, 10) || 0,
                  })
                }
                keyboardType="number-pad"
                placeholder="예: 1500"
                placeholderTextColor="#666666"
              />
              <Text style={styles.unit}>kcal</Text>
            </View>
          </View>
        </ScrollView>
      )}
    </SafeAreaView>
  );
};

const styles = StyleSheet.create({
  container: {
    flex: 1,
    backgroundColor: '#252525',
  },
  header: {
    flexDirection: "row",
    justifyContent: "space-between",
    alignItems: "center",
    backgroundColor: "#252525",
    paddingTop: 40,
    paddingBottom: 16,
    paddingHorizontal: 20,
  },
  backButton: {
    width: 40,
    height: 40,
    justifyContent: "center",
    alignItems: "flex-start",
  },
  headerTitle: {
    fontSize: 20,
    fontWeight: "800",
    fontStyle: "italic",
    color: "#ffffff",
    flex: 1,
    textAlign: "center",
  },
  saveButton: {
    width: 40,
    height: 40,
    justifyContent: "center",
    alignItems: "flex-end",
  },
  content: {
    flex: 1,
    paddingTop: 24,
    paddingHorizontal: 20,
    paddingBottom: 80,
    marginTop: 8,
  },
  section: {
    marginBottom: 30,
  },
  sectionTitle: {
    fontSize: 16,
    fontWeight: "500",
    color: "#ffffff",
    marginBottom: 12,
  },
  frequencyControl: {
    flexDirection: "row",
    justifyContent: "space-between",
    alignItems: "center",
    backgroundColor: "#2a2a2a",
    paddingVertical: 16,
    paddingHorizontal: 20,
    borderRadius: 12,
  },
  frequencyValue: {
    fontSize: 18,
    fontWeight: "600",
    color: "#ffffff",
  },
  adjustButtons: {
    flexDirection: "row",
    gap: 8,
  },
  adjustBtn: {
    backgroundColor: "#404040",
    width: 32,
    height: 32,
    borderRadius: 16,
    justifyContent: "center",
    alignItems: "center",
  },
  adjustBtnText: {
    color: "#ffffff",
    fontSize: 18,
    fontWeight: "600",
  },
  input: {
    backgroundColor: "transparent",
    borderWidth: 0,
    borderRadius: 0,
    paddingVertical: 0,
    paddingHorizontal: 0,
    fontSize: 16,
    color: "#ffffff",
    flex: 1,
  },
  timeContainer: {
    backgroundColor: "#2a2a2a",
    borderRadius: 12,
    paddingVertical: 16,
    paddingHorizontal: 20,
  },
  calorieContainer: {
    backgroundColor: "#2a2a2a",
    borderRadius: 12,
    paddingVertical: 16,
    paddingHorizontal: 20,
    flexDirection: "row",
    alignItems: "center",
    gap: 8,
  },
  typeOptions: {
    flexDirection: "row",
    gap: 8,
  },
  typeBtn: {
    flex: 1,
    backgroundColor: "#2a2a2a",
    paddingVertical: 12,
    paddingHorizontal: 16,
    borderRadius: 8,
    alignItems: "center",
    borderWidth: 1,
    borderColor: "#404040",
  },
  typeBtnActive: {
    backgroundColor: "#e3ff7c",
    borderColor: "#e3ff7c",
  },
  typeBtnText: {
    fontSize: 14,
    fontWeight: "500",
    color: "#ffffff",
  },
  typeBtnTextActive: {
    color: "#000000",
  },
  unit: {
    fontSize: 16,
    color: "#ffffff",
  },
  loadingContainer: {
    flex: 1,
    alignItems: "center",
    justifyContent: "center",
    gap: 12,
  },
  loadingText: {
    fontSize: 13,
    color: "#aaaaaa",
  },
});

export default GoalScreen;

