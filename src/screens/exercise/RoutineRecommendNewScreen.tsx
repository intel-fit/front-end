// src/screens/RoutineRecommendNewScreen.tsx
import React, { useState, useEffect, useRef } from "react";
import {
  View,
  Text,
  StyleSheet,
  ScrollView,
  TouchableOpacity,
  Alert,
  Modal,
  ActivityIndicator,
  Animated,
  Easing,
  Dimensions,
} from "react-native";
import { SafeAreaView } from "react-native-safe-area-context";
import { Ionicons as Icon } from "@expo/vector-icons";
import AsyncStorage from "@react-native-async-storage/async-storage";
import { recommendedExerciseAPI } from "../../services";
import { LinearGradient } from "expo-linear-gradient";

const { width } = Dimensions.get("window");

const LOADING_MESSAGES = [
  "입력하신 신체 정보를 분석하는 중...",
  "회원님께 최적화된 루틴을 구성하는 중...",
  "부위별 밸런스를 계산하는 중...",
  "가장 효과적인 운동 조합을 찾는 중...",
  "거의 다 됐어요! 득근할 준비 되셨나요?",
];

const LoadingOverlay = ({
  visible,
  messages = LOADING_MESSAGES,
  onCancel,
}: {
  visible: boolean;
  messages?: string[];
  onCancel?: () => void;
}) => {
  const [currentMessageIndex, setCurrentMessageIndex] = useState(0);
  const fadeAnim = useRef(new Animated.Value(1)).current;
  const spinAnim = useRef(new Animated.Value(0)).current;
  const scaleAnim = useRef(new Animated.Value(1)).current;

  useEffect(() => {
    if (!visible) {
      setCurrentMessageIndex(0);
      fadeAnim.setValue(1);
      return;
    }

    Animated.loop(
      Animated.timing(spinAnim, {
        toValue: 1,
        duration: 2000,
        useNativeDriver: true,
        easing: Easing.linear,
      })
    ).start();

    Animated.loop(
      Animated.sequence([
        Animated.timing(scaleAnim, {
          toValue: 1.1,
          duration: 1000,
          useNativeDriver: true,
          easing: Easing.inOut(Easing.ease),
        }),
        Animated.timing(scaleAnim, {
          toValue: 1,
          duration: 1000,
          useNativeDriver: true,
          easing: Easing.inOut(Easing.ease),
        }),
      ])
    ).start();

    fadeAnim.setValue(1);

    const interval = setInterval(() => {
      Animated.timing(fadeAnim, {
        toValue: 0,
        duration: 500,
        useNativeDriver: true,
        easing: Easing.out(Easing.ease),
      }).start(() => {
        setCurrentMessageIndex((prev) => (prev + 1) % messages.length);
        Animated.timing(fadeAnim, {
          toValue: 1,
          duration: 800,
          useNativeDriver: true,
          easing: Easing.in(Easing.ease),
        }).start();
      });
    }, 3500);

    return () => clearInterval(interval);
  }, [visible, messages.length]);

  const spin = spinAnim.interpolate({
    inputRange: [0, 1],
    outputRange: ["0deg", "360deg"],
  });

  return (
    <Modal
      visible={visible}
      transparent={true}
      animationType="fade"
      statusBarTranslucent
      onRequestClose={onCancel}
    >
      <View style={loadingStyles.overlay}>
        <LinearGradient
          colors={[
            "rgba(0,0,0,0.95)",
            "rgba(17,24,39,0.95)",
            "rgba(0,0,0,0.95)",
          ]}
          style={StyleSheet.absoluteFill}
        />

        <Animated.View
          style={[
            loadingStyles.container,
            { transform: [{ scale: scaleAnim }] },
          ]}
        >
          <Animated.View
            style={[
              loadingStyles.spinnerContainer,
              { transform: [{ rotate: spin }] },
            ]}
          >
            <View style={loadingStyles.spinnerOuter}>
              <View style={loadingStyles.spinnerInner} />
            </View>
          </Animated.View>

          <Animated.View
            style={[{ opacity: fadeAnim }, loadingStyles.textContainer]}
          >
            <Text style={loadingStyles.message}>
              {messages && messages.length > 0
                ? messages[currentMessageIndex]
                : "로딩 중..."}
            </Text>
          </Animated.View>

          {onCancel && (
            <TouchableOpacity
              style={loadingStyles.cancelButton}
              onPress={onCancel}
              activeOpacity={0.8}
            >
              <LinearGradient
                colors={["rgba(255,255,255,0.1)", "rgba(255,255,255,0.05)"]}
                style={loadingStyles.cancelButtonGradient}
              >
                <Text style={loadingStyles.cancelText}>요청 취소하기</Text>
              </LinearGradient>
            </TouchableOpacity>
          )}
        </Animated.View>
      </View>
    </Modal>
  );
};

const getExerciseIcon = (category: string, muscleName: string) => {
  if (category === "CARDIO") return "🏃";

  const muscleIcons: { [key: string]: string } = {
    하체: "🦵",
    LEGS: "🦵",
    가슴: "💪",
    CHEST: "💪",
    등: "🏋️",
    BACK: "🏋️",
    어깨: "💪",
    SHOULDERS: "💪",
    팔: "💪",
    ARMS: "💪",
    복근: "🔥",
    CORE: "🔥",
    ABS: "🔥",
  };

  return muscleIcons[muscleName] || "💪";
};
const transformAIExerciseToUI = (apiResponse: any) => {
  const { plan } = apiResponse;

  // ✅ 7일치 빈 배열 초기화
  const weekRoutines: any[] = Array.from({ length: 7 }, () => []);

  // 요일 매핑
  const dayNameToIndex: { [key: string]: number } = {
    월요일: 0,
    화요일: 1,
    수요일: 2,
    목요일: 3,
    금요일: 4,
    토요일: 5,
    일요일: 6,
  };

  // 각 routine 처리
  plan.routines.forEach((routine: any) => {
    // ✅ dayOfWeek를 쉼표로 분할 ("월요일, 수요일, 금요일" → ["월요일", "수요일", "금요일"])
    const days = routine.dayOfWeek
      .split(",")
      .map((d: string) => d.trim())
      .filter((d: string) => dayNameToIndex[d] !== undefined);

    console.log(`📅 Routine "${routine.routineName}" 적용 요일:`, days);

    // items를 운동 순서대로 정렬
    const sortedItems = [...routine.items].sort(
      (a: any, b: any) => a.exerciseOrder - b.exerciseOrder
    );

    // UI 형식으로 변환
    const exercises = sortedItems.map((item: any) => {
      let name = "";
      let detail = "";
      let icon = "";

      if (item.cardioTypeName) {
        name = item.cardioTypeName;
        icon = "🏃";
        const details = [];
        if (item.targetDurationMinutes)
          details.push(`${item.targetDurationMinutes}분`);
        if (item.targetDistance) details.push(`${item.targetDistance}km`);
        if (item.targetCaloriesBurn)
          details.push(`${item.targetCaloriesBurn}kcal`);
        detail = details.join(" · ");
      } else if (item.resistanceExerciseTypeName) {
        name = item.resistanceExerciseTypeName;
        icon = getExerciseIcon("RESISTANCE", item.muscleGroupName || "");
        const details = [];
        if (item.recommendedSets) details.push(`${item.recommendedSets}세트`);
        if (item.recommendedReps) {
          // "10-12" 같은 문자열 처리
          details.push(`${item.recommendedReps}회`);
        }
        if (item.recommendedWeight) {
          // "1RM의 70-75%" 같은 문자열은 간단하게 표시
          const weightStr = String(item.recommendedWeight).includes("1RM")
            ? "적정 중량"
            : `${item.recommendedWeight}kg`;
          details.push(weightStr);
        }
        detail = details.join(" X ");
      }

      return {
        name: name || "운동",
        detail: detail || item.description || "",
        icon: icon || "💪",
      };
    });

    // ✅ 해당 요일들에 운동 할당
    days.forEach((dayName: string) => {
      const dayIndex = dayNameToIndex[dayName];
      if (dayIndex !== undefined) {
        // 기존 운동에 추가 (여러 routine이 같은 날에 있을 수 있음)
        weekRoutines[dayIndex] = [...weekRoutines[dayIndex], ...exercises];
      }
    });
  });

  console.log("\n=== 📊 최종 변환 결과 ===");
  weekRoutines.forEach((day, index) => {
    console.log(
      `${index + 1}일차: ${day.length}개 운동 -`,
      day.map((e: any) => e.name).join(", ")
    );
  });

  return weekRoutines;
};

const RoutineRecommendNewScreen = ({ navigation }: any) => {
  const [showRoutine, setShowRoutine] = useState(false);
  const [selectedDay, setSelectedDay] = useState(0);
  const [showWeakPanel, setShowWeakPanel] = useState(false);
  const [showLevelPanel, setShowLevelPanel] = useState(false);
  const [showTargetPanel, setShowTargetPanel] = useState(false);
  const [weakParts, setWeakParts] = useState<string[]>([]);
  const [level, setLevel] = useState("");
  const [targetParts, setTargetParts] = useState<string[]>([]);
  const [savedRoutines, setSavedRoutines] = useState<any[]>([]);
  const [loading, setLoading] = useState(false);
  const [currentPlanId, setCurrentPlanId] = useState<number | null>(null);

  const [weekRoutines, setWeekRoutines] = useState([
    [
      { name: "시작 스트레칭", detail: "6회차 스트레칭", icon: "🏃" },
      { name: "레그 프레스", detail: "4세트 X 20kg X 15회", icon: "🦵" },
      { name: "레그 컬", detail: "3세트 X 12kg X 15회", icon: "🦵" },
    ],
  ]);

  const fadeAnim = useRef(new Animated.Value(0)).current;

  useEffect(() => {
    Animated.timing(fadeAnim, {
      toValue: 1,
      duration: 600,
      useNativeDriver: true,
    }).start();
  }, [showRoutine]);

  const weekDays = [
    "1일차",
    "2일차",
    "3일차",
    "4일차",
    "5일차",
    "6일차",
    "7일차",
  ];
  const bodyParts = ["목", "어깨", "팔꿈치", "손목", "허리", "무릎", "발목"];
  const targetAreas = ["가슴", "등", "배", "어깨", "팔", "하체"];
  const levels = ["초급", "중급", "고급"];

  useEffect(() => {
    loadSavedRoutines();
  }, []);

  const loadSavedRoutines = async () => {
    try {
      // 서버에서 불러오기
      const serverResponse =
        await recommendedExerciseAPI.getSavedExercisePlans();
      const serverPlans = serverResponse.plans || [];

      // 로컬에서 불러오기
      const stored = await AsyncStorage.getItem("savedRoutines");
      const localPlans = stored ? JSON.parse(stored) : [];

      // 합치기
      const allPlans = [...serverPlans, ...localPlans];

      setSavedRoutines(allPlans);
      console.log(`📋 총 ${allPlans.length}개 루틴 로드 완료`);
    } catch (error) {
      console.log("저장된 루틴 불러오기 실패:", error);
      // 실패해도 로컬 데이터라도 보여주기
      try {
        const stored = await AsyncStorage.getItem("savedRoutines");
        if (stored) setSavedRoutines(JSON.parse(stored));
      } catch (e) {
        console.error("로컬 데이터도 불러오기 실패:", e);
      }
    }
  };

  const handleWeakPartToggle = (part: string) => {
    if (weakParts.includes(part))
      setWeakParts(weakParts.filter((p) => p !== part));
    else setWeakParts([...weakParts, part]);
  };

  const handleTargetPartToggle = (part: string) => {
    if (targetParts.includes(part))
      setTargetParts(targetParts.filter((p) => p !== part));
    else setTargetParts([...targetParts, part]);
  };

  const handleCancelLoading = () => {
    Alert.alert("요청 취소", "운동 루틴 생성을 취소하시겠습니까?", [
      { text: "계속 기다리기", style: "cancel" },
      {
        text: "취소",
        style: "destructive",
        onPress: () => {
          console.log("⚠️ 사용자가 로딩을 취소함");
          setLoading(false);
        },
      },
    ]);
  };

  const handleGetRoutine = async () => {
    setLoading(true);

    try {
      console.log("🏋️ 운동 루틴 추천 시작");

      const apiResponse = await recommendedExerciseAPI.generateExercisePlan();

      if (apiResponse && apiResponse.success) {
        console.log("✅ API 응답 성공:", apiResponse.message);

        // planId 저장
        const planId = apiResponse.plan?.id;
        setCurrentPlanId(planId);

        // UI 형식으로 변환
        const convertedRoutines = transformAIExerciseToUI(apiResponse);

        setWeekRoutines(convertedRoutines);
        setShowRoutine(true);
        setSelectedDay(0);

        Alert.alert(
          "성공",
          apiResponse.message || "운동 루틴이 생성되었습니다!"
        );
        return;
      }

      throw new Error(apiResponse.message || "운동 루틴 생성에 실패했습니다.");
    } catch (error: any) {
      console.error("❌ 운동 루틴 생성 실패:", error);
      Alert.alert(
        "오류",
        error.message || "운동 루틴 생성에 실패했습니다. 다시 시도해주세요."
      );
    } finally {
      setLoading(false);
    }
  };

  const addRoutineToActivities = async (routine: any) => {
    try {
      const userId = await AsyncStorage.getItem("userId");
      const storageKey = userId
        ? `user_activities_v1:${userId}`
        : "user_activities_v1";

      const existingActivities = JSON.parse(
        (await AsyncStorage.getItem(storageKey)) || "[]"
      );

      const today = new Date();
      const newActivities: any[] = [];

      routine.routine.forEach((dayExercises: any[], dayIndex: number) => {
        const targetDate = new Date(today);
        const todayDayOfWeek = today.getDay();
        const routineDayOfWeek = dayIndex === 6 ? 0 : dayIndex + 1;

        let daysUntilTarget = routineDayOfWeek - todayDayOfWeek;
        if (daysUntilTarget < 0) daysUntilTarget += 7;

        targetDate.setDate(today.getDate() + daysUntilTarget);

        const dateStr = `${targetDate.getFullYear()}-${String(
          targetDate.getMonth() + 1
        ).padStart(2, "0")}-${String(targetDate.getDate()).padStart(2, "0")}`;

        dayExercises.forEach((exercise, exerciseIndex) => {
          newActivities.push({
            id: Date.now() + dayIndex * 1000 + exerciseIndex,
            name: exercise.name,
            details: exercise.detail,
            time: "00:00",
            date: dateStr,
            isCompleted: false,
            isFromRoutine: true,
            sets: [],
          });
        });
      });

      const updatedActivities = [...existingActivities, ...newActivities];
      await AsyncStorage.setItem(storageKey, JSON.stringify(updatedActivities));

      console.log(`✅ ${newActivities.length}개 운동이 기록에 추가되었습니다`);
    } catch (error) {
      console.error("기록 추가 실패:", error);
    }
  };

  const handleSaveRoutine = async () => {
    // planId가 있으면 서버에 저장
    if (currentPlanId) {
      try {
        setLoading(true);

        const response = await recommendedExerciseAPI.saveExercisePlan(
          currentPlanId
        );

        if (response.success) {
          Alert.alert(
            "저장 완료",
            response.message || "루틴이 저장되었습니다!",
            [
              {
                text: "확인",
                onPress: async () => {
                  await loadSavedRoutines();
                  navigation.navigate("RoutineRecommend");
                },
              },
            ]
          );
          return;
        }
      } catch (error: any) {
        console.error("❌ 서버 저장 실패:", error);
        Alert.alert("오류", error.message || "저장에 실패했습니다.");
      } finally {
        setLoading(false);
      }
    } else {
      // planId가 없으면 로컬에만 저장
      const currentDate = new Date();
      const savedRoutine = {
        id: Date.now(),
        date: currentDate.toLocaleDateString("ko-KR"),
        routine: weekRoutines,
        level: level,
        weakParts: [...weakParts],
        targetParts: [...targetParts],
      };

      try {
        const existingRoutines = JSON.parse(
          (await AsyncStorage.getItem("savedRoutines")) || "[]"
        );
        const updatedRoutines = [...existingRoutines, savedRoutine];
        await AsyncStorage.setItem(
          "savedRoutines",
          JSON.stringify(updatedRoutines)
        );
        setSavedRoutines(updatedRoutines);

        await addRoutineToActivities(savedRoutine);

        Alert.alert("저장 완료", "루틴이 로컬에 저장되었습니다!", [
          {
            text: "확인",
            onPress: () => navigation.navigate("RoutineRecommend"),
          },
        ]);
      } catch (error) {
        Alert.alert("오류", "저장 실패");
      }
    }
  };

  const handleRecommendAgain = () => {
    setShowRoutine(false);
    setSelectedDay(0);
    setCurrentPlanId(null);
  };

  const handleDeleteSavedRoutine = async (routine: any) => {
    const isServerPlan = typeof routine.id === "number";

    Alert.alert(
      "삭제",
      `이 루틴을 삭제하시겠습니까?${
        isServerPlan ? "\n(서버에서도 삭제됩니다)" : "\n(로컬에서만 삭제됩니다)"
      }`,
      [
        { text: "취소", style: "cancel" },
        {
          text: "삭제",
          style: "destructive",
          onPress: async () => {
            try {
              if (isServerPlan) {
                await recommendedExerciseAPI.deleteExercisePlan(routine.id);
                console.log("✅ 서버 플랜 삭제 성공");
              } else {
                const stored = await AsyncStorage.getItem("savedRoutines");
                const localRoutines = stored ? JSON.parse(stored) : [];
                const updated = localRoutines.filter(
                  (r: any) => r.id !== routine.id
                );
                await AsyncStorage.setItem(
                  "savedRoutines",
                  JSON.stringify(updated)
                );
                console.log("✅ 로컬 플랜 삭제 성공");
              }

              await loadSavedRoutines();
              Alert.alert("성공", "루틴이 삭제되었습니다.");
            } catch (error: any) {
              console.error("❌ 삭제 실패:", error);
              Alert.alert("오류", error.message || "삭제에 실패했습니다.");
            }
          },
        },
      ]
    );
  };

  return (
    <View style={styles.container}>
      <LinearGradient
        colors={["#0a0a0a", "#1a1a2e", "#16213e", "#0f3460"]}
        style={StyleSheet.absoluteFill}
      />

      <SafeAreaView style={styles.safeArea} edges={["top"]}>
        <LoadingOverlay
          visible={loading}
          messages={LOADING_MESSAGES}
          onCancel={handleCancelLoading}
        />

        <View style={styles.header}>
          <TouchableOpacity
            onPress={() => navigation.goBack()}
            style={styles.backButton}
          >
            <View style={styles.iconButton}>
              <Icon name="chevron-back" size={24} color="#ffffff" />
            </View>
          </TouchableOpacity>
          <Text style={styles.headerTitle}>운동 루틴</Text>
          <View style={{ width: 40 }} />
        </View>

        {!showRoutine ? (
          <ScrollView
            style={styles.content}
            contentContainerStyle={styles.contentContainer}
            showsVerticalScrollIndicator={false}
          >
            <Animated.View style={[styles.mainContent, { opacity: fadeAnim }]}>
              <View style={styles.welcomeIconContainer}>
                <LinearGradient
                  colors={["#e3ff7c", "#a8e063"]}
                  style={styles.welcomeIcon}
                >
                  <Text style={styles.welcomeEmoji}>💪</Text>
                </LinearGradient>
              </View>

              <Text style={styles.title}>맞춤 운동 루틴</Text>
              <Text style={styles.subtitle}>
                AI가 당신의 목표에 맞는{"\n"}완벽한 루틴을 설계합니다
              </Text>

              <View style={styles.buttonGroup}>
                <TouchableOpacity
                  style={styles.primaryButton}
                  onPress={handleGetRoutine}
                  disabled={loading}
                  activeOpacity={0.9}
                >
                  <LinearGradient
                    colors={["#e3ff7c", "#a8e063"]}
                    style={styles.primaryButtonGradient}
                  >
                    <Icon
                      name="flash"
                      size={20}
                      color="#111827"
                      style={{ marginRight: 8 }}
                    />
                    <Text style={styles.primaryButtonText}>추천 루틴 받기</Text>
                  </LinearGradient>
                </TouchableOpacity>

                <View style={styles.optionCard}>
                  <TouchableOpacity
                    style={styles.optionButton}
                    onPress={() => setShowWeakPanel(true)}
                    activeOpacity={0.8}
                  >
                    <LinearGradient
                      colors={[
                        "rgba(255,255,255,0.1)",
                        "rgba(255,255,255,0.05)",
                      ]}
                      style={styles.optionButtonGradient}
                    >
                      <View style={styles.optionButtonLeft}>
                        <View style={styles.optionIconContainer}>
                          <LinearGradient
                            colors={[
                              "rgba(239,68,68,0.3)",
                              "rgba(239,68,68,0.1)",
                            ]}
                            style={styles.optionIcon}
                          >
                            <Icon name="medical" size={20} color="#ef4444" />
                          </LinearGradient>
                        </View>
                        <Text style={styles.optionButtonText}>취약한 부분</Text>
                      </View>
                      <Icon name="chevron-forward" size={20} color="#6b7280" />
                    </LinearGradient>
                  </TouchableOpacity>
                  {weakParts.length > 0 && (
                    <View style={styles.selectedTags}>
                      {weakParts.map((part, index) => (
                        <View key={index} style={styles.tag}>
                          <LinearGradient
                            colors={[
                              "rgba(239,68,68,0.2)",
                              "rgba(239,68,68,0.1)",
                            ]}
                            style={styles.tagGradient}
                          >
                            <Text style={styles.tagText}>{part}</Text>
                          </LinearGradient>
                        </View>
                      ))}
                    </View>
                  )}
                </View>

                <View style={styles.optionCard}>
                  <TouchableOpacity
                    style={styles.optionButton}
                    onPress={() => setShowLevelPanel(true)}
                    activeOpacity={0.8}
                  >
                    <LinearGradient
                      colors={[
                        "rgba(255,255,255,0.1)",
                        "rgba(255,255,255,0.05)",
                      ]}
                      style={styles.optionButtonGradient}
                    >
                      <View style={styles.optionButtonLeft}>
                        <View style={styles.optionIconContainer}>
                          <LinearGradient
                            colors={[
                              "rgba(59,130,246,0.3)",
                              "rgba(59,130,246,0.1)",
                            ]}
                            style={styles.optionIcon}
                          >
                            <Icon name="bar-chart" size={20} color="#3b82f6" />
                          </LinearGradient>
                        </View>
                        <Text style={styles.optionButtonText}>운동 경력</Text>
                      </View>
                      <Icon name="chevron-forward" size={20} color="#6b7280" />
                    </LinearGradient>
                  </TouchableOpacity>
                  {level && (
                    <View style={styles.selectedTags}>
                      <View style={styles.tag}>
                        <LinearGradient
                          colors={[
                            "rgba(59,130,246,0.2)",
                            "rgba(59,130,246,0.1)",
                          ]}
                          style={styles.tagGradient}
                        >
                          <Text style={styles.tagText}>{level}</Text>
                        </LinearGradient>
                      </View>
                    </View>
                  )}
                </View>

                <View style={styles.optionCard}>
                  <TouchableOpacity
                    style={styles.optionButton}
                    onPress={() => setShowTargetPanel(true)}
                    activeOpacity={0.8}
                  >
                    <LinearGradient
                      colors={[
                        "rgba(255,255,255,0.1)",
                        "rgba(255,255,255,0.05)",
                      ]}
                      style={styles.optionButtonGradient}
                    >
                      <View style={styles.optionButtonLeft}>
                        <View style={styles.optionIconContainer}>
                          <LinearGradient
                            colors={[
                              "rgba(168,224,99,0.3)",
                              "rgba(168,224,99,0.1)",
                            ]}
                            style={styles.optionIcon}
                          >
                            <Icon name="location" size={20} color="#a8e063" />
                          </LinearGradient>
                        </View>
                        <Text style={styles.optionButtonText}>집중 부위</Text>
                      </View>
                      <Icon name="chevron-forward" size={20} color="#6b7280" />
                    </LinearGradient>
                  </TouchableOpacity>
                  {targetParts.length > 0 && (
                    <View style={styles.selectedTags}>
                      {targetParts.map((part, index) => (
                        <View key={index} style={styles.tag}>
                          <LinearGradient
                            colors={[
                              "rgba(168,224,99,0.2)",
                              "rgba(168,224,99,0.1)",
                            ]}
                            style={styles.tagGradient}
                          >
                            <Text style={styles.tagText}>{part}</Text>
                          </LinearGradient>
                        </View>
                      ))}
                    </View>
                  )}
                </View>
              </View>
            </Animated.View>

            {savedRoutines.length > 0 && (
              <View style={styles.savedRoutines}>
                <Text style={styles.sectionTitle}>저장된 루틴</Text>
                {savedRoutines.map((routine) => (
                  <TouchableOpacity
                    key={routine.id}
                    style={styles.savedRoutineItem}
                    onPress={() => {
                      if (typeof routine.id === "number") {
                        navigation.navigate("RoutineRecommend");
                      } else {
                        navigation.navigate("RoutineRecommend");
                      }
                    }}
                    onLongPress={() => handleDeleteSavedRoutine(routine)}
                    activeOpacity={0.8}
                  >
                    <LinearGradient
                      colors={[
                        "rgba(255,255,255,0.08)",
                        "rgba(255,255,255,0.04)",
                      ]}
                      style={styles.savedRoutineGradient}
                    >
                      <View style={styles.savedRoutineHeader}>
                        <View style={styles.savedRoutineTitleRow}>
                          <Icon
                            name="barbell-outline"
                            size={20}
                            color="#e3ff7c"
                          />
                          <Text style={styles.savedRoutineDate}>
                            {routine.planName || routine.date}
                          </Text>
                        </View>
                        {routine.level && (
                          <View style={styles.levelBadge}>
                            <LinearGradient
                              colors={["#e3ff7c", "#a8e063"]}
                              style={styles.levelBadgeGradient}
                            >
                              <Text style={styles.levelBadgeText}>
                                {routine.level}
                              </Text>
                            </LinearGradient>
                          </View>
                        )}
                      </View>
                      {routine.targetParts?.length > 0 && (
                        <Text style={styles.savedRoutineInfo}>
                          집중 부위: {routine.targetParts.join(", ")}
                        </Text>
                      )}
                    </LinearGradient>
                  </TouchableOpacity>
                ))}
              </View>
            )}
          </ScrollView>
        ) : (
          <ScrollView
            style={styles.content}
            showsVerticalScrollIndicator={false}
            contentContainerStyle={{ paddingBottom: 30 }}
          >
            <View style={styles.routineView}>
              <View style={styles.routineHeader}>
                <View>
                  <Text style={styles.routineTitle}>10월 2주차 루틴</Text>
                  <Text style={styles.routineDate}>10/10 - 10/17</Text>
                </View>
                <View style={styles.routineHeaderIcon}>
                  <LinearGradient
                    colors={["rgba(227,255,124,0.2)", "rgba(168,224,99,0.1)"]}
                    style={styles.routineHeaderIconGradient}
                  >
                    <Icon name="calendar" size={24} color="#e3ff7c" />
                  </LinearGradient>
                </View>
              </View>

              <ScrollView
                horizontal
                showsHorizontalScrollIndicator={false}
                style={styles.dayTabsContainer}
                contentContainerStyle={styles.dayTabs}
              >
                {weekDays.map((day, index) => (
                  <TouchableOpacity
                    key={index}
                    style={styles.dayTabWrapper}
                    onPress={() => setSelectedDay(index)}
                    activeOpacity={0.8}
                  >
                    {selectedDay === index ? (
                      <LinearGradient
                        colors={["#e3ff7c", "#a8e063"]}
                        style={styles.dayTabActive}
                      >
                        <Text style={styles.dayTabTextActive}>{day}</Text>
                      </LinearGradient>
                    ) : (
                      <View style={styles.dayTab}>
                        <Text style={styles.dayTabText}>{day}</Text>
                      </View>
                    )}
                  </TouchableOpacity>
                ))}
              </ScrollView>

              <View style={styles.routineInfoCard}>
                <LinearGradient
                  colors={["rgba(255,255,255,0.08)", "rgba(255,255,255,0.04)"]}
                  style={styles.routineInfoGradient}
                >
                  <View style={styles.routineInfoItem}>
                    <View style={styles.routineInfoIconContainer}>
                      <Icon name="list" size={18} color="#e3ff7c" />
                    </View>
                    <Text style={styles.routineInfoText}>
                      {weekRoutines[selectedDay]?.length || 0}개 운동
                    </Text>
                  </View>
                  <View style={styles.routineInfoDivider} />
                  <View style={styles.routineInfoItem}>
                    <View style={styles.routineInfoIconContainer}>
                      <Icon name="time" size={18} color="#e3ff7c" />
                    </View>
                    <Text style={styles.routineInfoText}>60분</Text>
                  </View>
                </LinearGradient>
              </View>

              <View style={styles.exerciseList}>
                {weekRoutines[selectedDay]?.map((exercise, index) => (
                  <View key={index} style={styles.exerciseCardWrapper}>
                    <LinearGradient
                      colors={[
                        "rgba(255,255,255,0.08)",
                        "rgba(255,255,255,0.04)",
                      ]}
                      style={styles.exerciseCard}
                    >
                      <View style={styles.exerciseIconContainer}>
                        <LinearGradient
                          colors={[
                            "rgba(227,255,124,0.2)",
                            "rgba(168,224,99,0.1)",
                          ]}
                          style={styles.exerciseIconGradient}
                        >
                          <Text style={styles.exerciseIconText}>
                            {exercise.icon}
                          </Text>
                        </LinearGradient>
                      </View>
                      <View style={styles.exerciseInfo}>
                        <Text style={styles.exerciseName}>{exercise.name}</Text>
                        <Text style={styles.exerciseDetail}>
                          {exercise.detail}
                        </Text>
                      </View>
                      <View style={styles.exerciseNumber}>
                        <Text style={styles.exerciseNumberText}>
                          {index + 1}
                        </Text>
                      </View>
                    </LinearGradient>
                  </View>
                ))}
              </View>

              <View style={styles.routineButtons}>
                <TouchableOpacity
                  style={styles.saveButton}
                  onPress={handleSaveRoutine}
                  activeOpacity={0.9}
                >
                  <LinearGradient
                    colors={["#e3ff7c", "#a8e063"]}
                    style={styles.saveButtonGradient}
                  >
                    <Icon
                      name="bookmark"
                      size={20}
                      color="#111827"
                      style={{ marginRight: 8 }}
                    />
                    <Text style={styles.saveButtonText}>루틴 저장하기</Text>
                  </LinearGradient>
                </TouchableOpacity>

                <TouchableOpacity
                  style={styles.refreshButton}
                  onPress={handleRecommendAgain}
                  activeOpacity={0.8}
                >
                  <LinearGradient
                    colors={["rgba(255,255,255,0.1)", "rgba(255,255,255,0.05)"]}
                    style={styles.refreshButtonGradient}
                  >
                    <Icon
                      name="refresh"
                      size={20}
                      color="#ffffff"
                      style={{ marginRight: 8 }}
                    />
                    <Text style={styles.refreshButtonText}>다시 추천받기</Text>
                  </LinearGradient>
                </TouchableOpacity>
              </View>
            </View>
          </ScrollView>
        )}

        {/* Modal Components */}
        <Modal
          visible={showWeakPanel}
          transparent={true}
          animationType="slide"
          onRequestClose={() => setShowWeakPanel(false)}
        >
          <TouchableOpacity
            style={styles.panelOverlay}
            activeOpacity={1}
            onPress={() => setShowWeakPanel(false)}
          >
            <View style={styles.bottomPanel}>
              <LinearGradient
                colors={["#1a1a2e", "#16213e"]}
                style={styles.bottomPanelGradient}
              >
                <View style={styles.panelHandle} />
                <Text style={styles.panelHeaderText}>취약한 부분 선택</Text>
                <ScrollView
                  style={styles.panelBody}
                  showsVerticalScrollIndicator={false}
                >
                  <View style={styles.optionGrid}>
                    {bodyParts.map((part) => (
                      <TouchableOpacity
                        key={part}
                        style={styles.modalOptionWrapper}
                        onPress={() => handleWeakPartToggle(part)}
                        activeOpacity={0.8}
                      >
                        {weakParts.includes(part) ? (
                          <LinearGradient
                            colors={["#e3ff7c", "#a8e063"]}
                            style={styles.modalOptionSelected}
                          >
                            <Icon
                              name="checkmark-circle"
                              size={18}
                              color="#111827"
                            />
                            <Text style={styles.modalOptionTextSelected}>
                              {part}
                            </Text>
                          </LinearGradient>
                        ) : (
                          <View style={styles.modalOption}>
                            <Text style={styles.modalOptionText}>{part}</Text>
                          </View>
                        )}
                      </TouchableOpacity>
                    ))}
                  </View>
                  <TouchableOpacity
                    style={styles.confirmButton}
                    onPress={() => setShowWeakPanel(false)}
                    activeOpacity={0.9}
                  >
                    <LinearGradient
                      colors={["#e3ff7c", "#a8e063"]}
                      style={styles.confirmButtonGradient}
                    >
                      <Text style={styles.confirmButtonText}>선택 완료</Text>
                    </LinearGradient>
                  </TouchableOpacity>
                </ScrollView>
              </LinearGradient>
            </View>
          </TouchableOpacity>
        </Modal>

        <Modal
          visible={showLevelPanel}
          transparent={true}
          animationType="slide"
          onRequestClose={() => setShowLevelPanel(false)}
        >
          <TouchableOpacity
            style={styles.panelOverlay}
            activeOpacity={1}
            onPress={() => setShowLevelPanel(false)}
          >
            <View style={styles.bottomPanel}>
              <LinearGradient
                colors={["#1a1a2e", "#16213e"]}
                style={styles.bottomPanelGradient}
              >
                <View style={styles.panelHandle} />
                <Text style={styles.panelHeaderText}>운동 경력 선택</Text>
                <ScrollView
                  style={styles.panelBody}
                  showsVerticalScrollIndicator={false}
                >
                  <View style={styles.optionGrid}>
                    {levels.map((lv) => (
                      <TouchableOpacity
                        key={lv}
                        style={styles.modalOptionWrapper}
                        onPress={() => setLevel(lv)}
                        activeOpacity={0.8}
                      >
                        {level === lv ? (
                          <LinearGradient
                            colors={["#e3ff7c", "#a8e063"]}
                            style={styles.modalOptionSelected}
                          >
                            <Icon
                              name="checkmark-circle"
                              size={18}
                              color="#111827"
                            />
                            <Text style={styles.modalOptionTextSelected}>
                              {lv}
                            </Text>
                          </LinearGradient>
                        ) : (
                          <View style={styles.modalOption}>
                            <Text style={styles.modalOptionText}>{lv}</Text>
                          </View>
                        )}
                      </TouchableOpacity>
                    ))}
                  </View>
                  <TouchableOpacity
                    style={styles.confirmButton}
                    onPress={() => setShowLevelPanel(false)}
                    activeOpacity={0.9}
                  >
                    <LinearGradient
                      colors={["#e3ff7c", "#a8e063"]}
                      style={styles.confirmButtonGradient}
                    >
                      <Text style={styles.confirmButtonText}>선택 완료</Text>
                    </LinearGradient>
                  </TouchableOpacity>
                </ScrollView>
              </LinearGradient>
            </View>
          </TouchableOpacity>
        </Modal>

        <Modal
          visible={showTargetPanel}
          transparent={true}
          animationType="slide"
          onRequestClose={() => setShowTargetPanel(false)}
        >
          <TouchableOpacity
            style={styles.panelOverlay}
            activeOpacity={1}
            onPress={() => setShowTargetPanel(false)}
          >
            <View style={styles.bottomPanel}>
              <LinearGradient
                colors={["#1a1a2e", "#16213e"]}
                style={styles.bottomPanelGradient}
              >
                <View style={styles.panelHandle} />
                <Text style={styles.panelHeaderText}>보강하고 싶은 부위</Text>
                <ScrollView
                  style={styles.panelBody}
                  showsVerticalScrollIndicator={false}
                >
                  <View style={styles.optionGrid}>
                    {targetAreas.map((area) => (
                      <TouchableOpacity
                        key={area}
                        style={styles.modalOptionWrapper}
                        onPress={() => handleTargetPartToggle(area)}
                        activeOpacity={0.8}
                      >
                        {targetParts.includes(area) ? (
                          <LinearGradient
                            colors={["#e3ff7c", "#a8e063"]}
                            style={styles.modalOptionSelected}
                          >
                            <Icon
                              name="checkmark-circle"
                              size={18}
                              color="#111827"
                            />
                            <Text style={styles.modalOptionTextSelected}>
                              {area}
                            </Text>
                          </LinearGradient>
                        ) : (
                          <View style={styles.modalOption}>
                            <Text style={styles.modalOptionText}>{area}</Text>
                          </View>
                        )}
                      </TouchableOpacity>
                    ))}
                  </View>
                  <TouchableOpacity
                    style={styles.confirmButton}
                    onPress={() => setShowTargetPanel(false)}
                    activeOpacity={0.9}
                  >
                    <LinearGradient
                      colors={["#e3ff7c", "#a8e063"]}
                      style={styles.confirmButtonGradient}
                    >
                      <Text style={styles.confirmButtonText}>선택 완료</Text>
                    </LinearGradient>
                  </TouchableOpacity>
                </ScrollView>
              </LinearGradient>
            </View>
          </TouchableOpacity>
        </Modal>
      </SafeAreaView>
    </View>
  );
};

const loadingStyles = StyleSheet.create({
  overlay: {
    flex: 1,
    justifyContent: "center",
    alignItems: "center",
  },
  container: {
    alignItems: "center",
    justifyContent: "center",
    width: "100%",
    paddingHorizontal: 20,
  },
  spinnerContainer: {
    marginBottom: 40,
  },
  spinnerOuter: {
    width: 100,
    height: 100,
    borderRadius: 50,
    borderWidth: 4,
    borderColor: "rgba(227, 255, 124, 0.2)",
    alignItems: "center",
    justifyContent: "center",
  },
  spinnerInner: {
    width: 80,
    height: 80,
    borderRadius: 40,
    borderWidth: 4,
    borderColor: "#e3ff7c",
    borderTopColor: "transparent",
    borderRightColor: "transparent",
  },
  textContainer: {
    width: "100%",
    alignItems: "center",
    justifyContent: "center",
    minHeight: 70,
  },
  message: {
    fontSize: 18,
    fontWeight: "600",
    color: "#ffffff",
    textAlign: "center",
    lineHeight: 28,
    letterSpacing: 0.5,
  },
  cancelButton: {
    marginTop: 50,
    borderRadius: 30,
    overflow: "hidden",
  },
  cancelButtonGradient: {
    paddingVertical: 14,
    paddingHorizontal: 28,
    borderWidth: 1,
    borderColor: "rgba(255, 255, 255, 0.2)",
    borderRadius: 30,
  },
  cancelText: {
    color: "#ffffff",
    fontSize: 15,
    fontWeight: "600",
    letterSpacing: 0.5,
  },
});

const styles = StyleSheet.create({
  container: {
    flex: 1,
  },
  safeArea: {
    flex: 1,
  },
  header: {
    flexDirection: "row",
    justifyContent: "space-between",
    alignItems: "center",
    paddingVertical: 16,
    paddingHorizontal: 20,
  },
  backButton: {
    width: 40,
    height: 40,
  },
  iconButton: {
    width: 40,
    height: 40,
    borderRadius: 20,
    backgroundColor: "rgba(255,255,255,0.1)",
    alignItems: "center",
    justifyContent: "center",
  },
  headerTitle: {
    fontSize: 20,
    fontWeight: "700",
    color: "#ffffff",
    letterSpacing: 0.5,
  },
  content: {
    flex: 1,
  },
  contentContainer: {
    paddingHorizontal: 20,
    paddingTop: 40,
    paddingBottom: 40,
  },
  mainContent: {
    alignItems: "center",
    width: "100%",
  },
  welcomeIconContainer: {
    marginBottom: 24,
  },
  welcomeIcon: {
    width: 100,
    height: 100,
    borderRadius: 50,
    alignItems: "center",
    justifyContent: "center",
    shadowColor: "#e3ff7c",
    shadowOffset: { width: 0, height: 8 },
    shadowOpacity: 0.4,
    shadowRadius: 20,
    elevation: 10,
  },
  welcomeEmoji: {
    fontSize: 48,
  },
  title: {
    fontSize: 32,
    fontWeight: "bold",
    color: "#ffffff",
    marginBottom: 12,
    textAlign: "center",
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
  buttonGroup: {
    width: "100%",
    gap: 16,
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
  primaryButtonGradient: {
    flexDirection: "row",
    alignItems: "center",
    justifyContent: "center",
    paddingVertical: 18,
    paddingHorizontal: 24,
  },
  primaryButtonText: {
    fontSize: 17,
    fontWeight: "700",
    color: "#111827",
    letterSpacing: 0.5,
  },
  optionCard: {
    width: "100%",
  },
  optionButton: {
    borderRadius: 14,
    overflow: "hidden",
  },
  optionButtonGradient: {
    flexDirection: "row",
    alignItems: "center",
    justifyContent: "space-between",
    paddingVertical: 16,
    paddingHorizontal: 16,
    borderWidth: 1,
    borderColor: "rgba(255,255,255,0.1)",
    borderRadius: 14,
  },
  optionButtonLeft: {
    flexDirection: "row",
    alignItems: "center",
    gap: 12,
  },
  optionIconContainer: {
    width: 40,
    height: 40,
    borderRadius: 20,
    overflow: "hidden",
  },
  optionIcon: {
    width: "100%",
    height: "100%",
    alignItems: "center",
    justifyContent: "center",
  },
  optionButtonText: {
    fontSize: 16,
    fontWeight: "600",
    color: "#ffffff",
    letterSpacing: 0.3,
  },
  selectedTags: {
    flexDirection: "row",
    flexWrap: "wrap",
    gap: 8,
    marginTop: 12,
    paddingHorizontal: 4,
  },
  tag: {
    borderRadius: 12,
    overflow: "hidden",
  },
  tagGradient: {
    paddingVertical: 6,
    paddingHorizontal: 12,
    borderRadius: 12,
  },
  tagText: {
    fontSize: 13,
    color: "#ffffff",
    fontWeight: "500",
    letterSpacing: 0.3,
  },
  savedRoutines: {
    width: "100%",
    marginTop: 40,
  },
  sectionTitle: {
    fontSize: 20,
    fontWeight: "700",
    color: "#ffffff",
    marginBottom: 16,
    letterSpacing: 0.5,
  },
  savedRoutineItem: {
    marginBottom: 12,
    borderRadius: 16,
    overflow: "hidden",
  },
  savedRoutineGradient: {
    padding: 16,
    borderWidth: 1,
    borderColor: "rgba(255,255,255,0.1)",
    borderRadius: 16,
  },
  savedRoutineHeader: {
    flexDirection: "row",
    justifyContent: "space-between",
    alignItems: "center",
    marginBottom: 8,
  },
  savedRoutineTitleRow: {
    flexDirection: "row",
    alignItems: "center",
    gap: 8,
  },
  savedRoutineDate: {
    fontSize: 16,
    fontWeight: "600",
    color: "#ffffff",
    letterSpacing: 0.3,
  },
  levelBadge: {
    borderRadius: 8,
    overflow: "hidden",
  },
  levelBadgeGradient: {
    paddingVertical: 4,
    paddingHorizontal: 10,
    borderRadius: 8,
  },
  levelBadgeText: {
    fontSize: 12,
    fontWeight: "700",
    color: "#111827",
    letterSpacing: 0.5,
  },
  savedRoutineInfo: {
    fontSize: 14,
    color: "#6b7280",
    letterSpacing: 0.2,
  },
  routineView: {
    padding: 20,
  },
  routineHeader: {
    flexDirection: "row",
    justifyContent: "space-between",
    alignItems: "center",
    marginBottom: 24,
  },
  routineTitle: {
    fontSize: 26,
    fontWeight: "700",
    color: "#ffffff",
    marginBottom: 6,
    letterSpacing: 0.5,
  },
  routineDate: {
    fontSize: 14,
    color: "#6b7280",
    letterSpacing: 0.3,
  },
  routineHeaderIcon: {
    width: 50,
    height: 50,
    borderRadius: 25,
    overflow: "hidden",
  },
  routineHeaderIconGradient: {
    width: "100%",
    height: "100%",
    alignItems: "center",
    justifyContent: "center",
  },
  dayTabsContainer: {
    marginBottom: 20,
  },
  dayTabs: {
    gap: 10,
    paddingBottom: 8,
  },
  dayTabWrapper: {
    borderRadius: 24,
  },
  dayTab: {
    backgroundColor: "rgba(255,255,255,0.05)",
    paddingVertical: 10,
    paddingHorizontal: 20,
    borderRadius: 24,
    borderWidth: 1,
    borderColor: "rgba(255,255,255,0.1)",
  },
  dayTabActive: {
    paddingVertical: 10,
    paddingHorizontal: 20,
    borderRadius: 24,
    shadowColor: "#e3ff7c",
    shadowOffset: { width: 0, height: 2 },
    shadowOpacity: 0.3,
    shadowRadius: 8,
    elevation: 4,
  },
  dayTabText: {
    fontSize: 14,
    color: "#9ca3af",
    fontWeight: "500",
    letterSpacing: 0.3,
  },
  dayTabTextActive: {
    fontSize: 14,
    color: "#111827",
    fontWeight: "700",
    letterSpacing: 0.3,
  },
  routineInfoCard: {
    marginBottom: 20,
    borderRadius: 14,
    overflow: "hidden",
  },
  routineInfoGradient: {
    flexDirection: "row",
    alignItems: "center",
    paddingVertical: 14,
    paddingHorizontal: 16,
    borderWidth: 1,
    borderColor: "rgba(255,255,255,0.1)",
    borderRadius: 14,
  },
  routineInfoItem: {
    flexDirection: "row",
    alignItems: "center",
    gap: 8,
    flex: 1,
  },
  routineInfoIconContainer: {
    width: 32,
    height: 32,
    borderRadius: 16,
    backgroundColor: "rgba(227,255,124,0.1)",
    alignItems: "center",
    justifyContent: "center",
  },
  routineInfoText: {
    fontSize: 14,
    color: "#ffffff",
    fontWeight: "600",
    letterSpacing: 0.3,
  },
  routineInfoDivider: {
    width: 1,
    height: 24,
    backgroundColor: "rgba(255,255,255,0.1)",
    marginHorizontal: 8,
  },
  exerciseList: {
    gap: 12,
    marginBottom: 24,
  },
  exerciseCardWrapper: {
    borderRadius: 14,
    overflow: "hidden",
  },
  exerciseCard: {
    flexDirection: "row",
    alignItems: "center",
    padding: 16,
    gap: 14,
    borderWidth: 1,
    borderColor: "rgba(255,255,255,0.1)",
    borderRadius: 14,
  },
  exerciseIconContainer: {
    width: 56,
    height: 56,
    borderRadius: 14,
    overflow: "hidden",
  },
  exerciseIconGradient: {
    width: "100%",
    height: "100%",
    alignItems: "center",
    justifyContent: "center",
  },
  exerciseIconText: {
    fontSize: 28,
  },
  exerciseInfo: {
    flex: 1,
  },
  exerciseName: {
    fontSize: 16,
    fontWeight: "600",
    color: "#ffffff",
    marginBottom: 6,
    letterSpacing: 0.3,
  },
  exerciseDetail: {
    fontSize: 13,
    color: "#9ca3af",
    letterSpacing: 0.2,
  },
  exerciseNumber: {
    width: 28,
    height: 28,
    borderRadius: 14,
    backgroundColor: "rgba(227,255,124,0.1)",
    alignItems: "center",
    justifyContent: "center",
  },
  exerciseNumberText: {
    fontSize: 12,
    fontWeight: "700",
    color: "#e3ff7c",
  },
  routineButtons: {
    gap: 12,
  },
  saveButton: {
    borderRadius: 16,
    overflow: "hidden",
    shadowColor: "#e3ff7c",
    shadowOffset: { width: 0, height: 4 },
    shadowOpacity: 0.3,
    shadowRadius: 12,
    elevation: 8,
  },
  saveButtonGradient: {
    flexDirection: "row",
    alignItems: "center",
    justifyContent: "center",
    paddingVertical: 18,
  },
  saveButtonText: {
    fontSize: 17,
    fontWeight: "700",
    color: "#111827",
    letterSpacing: 0.5,
  },
  refreshButton: {
    borderRadius: 16,
    overflow: "hidden",
  },
  refreshButtonGradient: {
    flexDirection: "row",
    alignItems: "center",
    justifyContent: "center",
    paddingVertical: 16,
    borderWidth: 1,
    borderColor: "rgba(255,255,255,0.2)",
    borderRadius: 16,
  },
  refreshButtonText: {
    fontSize: 16,
    fontWeight: "600",
    color: "#ffffff",
    letterSpacing: 0.3,
  },
  panelOverlay: {
    flex: 1,
    backgroundColor: "rgba(0, 0, 0, 0.7)",
    justifyContent: "flex-end",
  },
  bottomPanel: {
    borderTopLeftRadius: 24,
    borderTopRightRadius: 24,
    overflow: "hidden",
    maxHeight: "80%",
  },
  bottomPanelGradient: {
    borderTopLeftRadius: 24,
    borderTopRightRadius: 24,
    paddingBottom: 30,
  },
  panelHandle: {
    width: 40,
    height: 4,
    backgroundColor: "#555555",
    borderRadius: 2,
    alignSelf: "center",
    marginTop: 12,
    marginBottom: 20,
  },
  panelHeaderText: {
    fontSize: 20,
    fontWeight: "700",
    color: "#ffffff",
    marginBottom: 20,
    paddingHorizontal: 20,
    letterSpacing: 0.5,
  },
  panelBody: {
    paddingHorizontal: 20,
  },
  optionGrid: {
    flexDirection: "row",
    flexWrap: "wrap",
    gap: 12,
    marginBottom: 24,
  },
  modalOptionWrapper: {
    width: "48%",
    borderRadius: 14,
    overflow: "hidden",
  },
  modalOption: {
    height: 56,
    backgroundColor: "rgba(255,255,255,0.05)",
    borderRadius: 14,
    borderWidth: 1,
    borderColor: "rgba(255,255,255,0.1)",
    justifyContent: "center",
    alignItems: "center",
  },
  modalOptionSelected: {
    height: 56,
    flexDirection: "row",
    alignItems: "center",
    justifyContent: "center",
    gap: 6,
    borderRadius: 14,
  },
  modalOptionText: {
    fontSize: 15,
    fontWeight: "500",
    color: "#ffffff",
    letterSpacing: 0.3,
  },
  modalOptionTextSelected: {
    fontSize: 15,
    color: "#111827",
    fontWeight: "700",
    letterSpacing: 0.3,
  },
  confirmButton: {
    borderRadius: 16,
    overflow: "hidden",
    shadowColor: "#e3ff7c",
    shadowOffset: { width: 0, height: 4 },
    shadowOpacity: 0.3,
    shadowRadius: 12,
    elevation: 8,
  },
  confirmButtonGradient: {
    paddingVertical: 18,
    alignItems: "center",
    justifyContent: "center",
  },
  confirmButtonText: {
    fontSize: 17,
    fontWeight: "700",
    color: "#111827",
    letterSpacing: 0.5,
  },
});

export default RoutineRecommendNewScreen;
