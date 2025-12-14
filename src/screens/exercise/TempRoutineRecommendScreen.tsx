// src/screens/exercise/TempRoutineRecommendScreen.tsx

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

// ✅ LoadingStyles 정의
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

const mapFocusToKorean = (focus: string): string => {
  const focusMap: { [key: string]: string } = {
    Upper: "상체",
    Core: "코어",
    Lower: "하체",
    Arms: "팔",
    Legs: "하체",
    Chest: "가슴",
    Back: "등",
    Shoulders: "어깨",
    "Full Body": "전신",
    Cardio: "유산소",
  };
  return focusMap[focus] || focus;
};

const transformDailyExerciseToUI = (apiResponse: any) => {
  console.log("\n=== 📥 일일 운동 추천 API 응답 분석 (Temp) ===");
  const exercises = (apiResponse.exercises || []).map((item: any) => {
    let icon = getExerciseIcon("RESISTANCE", item.target || "");

    const details = [];
    if (item.sets) details.push(`${item.sets}세트`);
    if (item.reps) details.push(`${item.reps}회`);
    if (item.weight_kg) details.push(`${item.weight_kg}kg`);

    const detail = details.join(" × ");

    return {
      name: item.name || "운동",
      detail: detail || `${item.intensity || "중간"} 강도`,
      icon: icon,
      exerciseId: item.exerciseId,
      target: item.target,
      sets: item.sets,
      reps: item.reps,
      weight_kg: item.weight_kg,
      category: item.category,
    };
  });
  return exercises;
};

const TempRoutineRecommendScreen = ({ navigation }: any) => {
  const [showRoutine, setShowRoutine] = useState(false);
  const [showWeakPanel, setShowWeakPanel] = useState(false);
  const [showLevelPanel, setShowLevelPanel] = useState(false);
  const [showTargetPanel, setShowTargetPanel] = useState(false);
  const [showEquipmentPanel, setShowEquipmentPanel] = useState(false);

  const [weakParts, setWeakParts] = useState<string[]>([]);
  const [level, setLevel] = useState("");
  const [targetParts, setTargetParts] = useState<string[]>([]);
  const [equipment, setEquipment] = useState<string[]>(["덤벨"]);

  const [loading, setLoading] = useState(false);

  const [todayRoutine, setTodayRoutine] = useState<any[]>([]);
  const [todayFocus, setTodayFocus] = useState<string>("");

  // ✅ TempMealRecommendScreen 방식으로 변경: 토큰 부족 상태 관리
  const [isTokenDepleted, setIsTokenDepleted] = useState<boolean>(false);

  const fadeAnim = useRef(new Animated.Value(0)).current;

  useEffect(() => {
    Animated.timing(fadeAnim, {
      toValue: 1,
      duration: 600,
      useNativeDriver: true,
    }).start();
  }, [showRoutine]);

  const bodyParts = ["목", "어깨", "팔꿈치", "손목", "허리", "무릎", "발목"];
  const targetAreas = ["가슴", "등", "배", "어깨", "팔", "하체"];
  const levels = ["초급", "중급", "고급"];
  const equipmentOptions = [
    "덤벨",
    "머신",
    "케이블",
    "밴드",
    "볼",
    "바벨",
    "케틀벨",
    "로프",
  ];

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

  const handleEquipmentToggle = (item: string) => {
    if (equipment.includes(item)) {
      if (equipment.length === 1) {
        Alert.alert("알림", "최소 1개의 장비를 선택해야 합니다.");
        return;
      }
      setEquipment(equipment.filter((e) => e !== item));
    } else {
      setEquipment([...equipment, item]);
    }
  };

  const handleCancelLoading = () => {
    Alert.alert("요청 취소", "운동 루틴 생성을 취소하시겠습니까?", [
      { text: "계속 기다리기", style: "cancel" },
      {
        text: "취소",
        style: "destructive",
        onPress: () => setLoading(false),
      },
    ]);
  };

  const mapLevelToAPI = (level: string): string => {
    const levelMap: { [key: string]: string } = {
      초급: "BEGINNER",
      중급: "INTERMEDIATE",
      고급: "ADVANCED",
    };
    return levelMap[level] || "INTERMEDIATE";
  };

  const handleGetRoutine = async () => {
    // ✅ 토큰 소진 상태일 때 차단
    if (isTokenDepleted) {
      Alert.alert("알림", "이미 이번 주 추천 횟수를 모두 사용했습니다.");
      return;
    }

    setLoading(true);

    try {
      console.log("🏋️ 운동 루틴 추천 시작 (무료)");

      // 프로필 확인
      let userProfile;
      try {
        userProfile = await recommendedExerciseAPI.getProfile();
      } catch (error: any) {
        if (error.status === 401) {
          Alert.alert("로그인 필요", "로그인이 만료되었습니다.", [
            { text: "확인", onPress: () => navigation.navigate("Login") },
          ]);
          setLoading(false);
          return;
        }
        if (error.status === 404) {
          Alert.alert("프로필 설정 필요", "먼저 프로필을 설정해주세요.");
          setLoading(false);
          return;
        }
        throw error;
      }

      if (
        !userProfile?.height ||
        !userProfile?.weight ||
        !userProfile?.healthGoal
      ) {
        Alert.alert(
          "프로필 정보 부족",
          "키, 몸무게, 운동 목표를 입력해주세요."
        );
        setLoading(false);
        return;
      }

      const requestBody = {
        experienceLevel: level ? mapLevelToAPI(level) : "INTERMEDIATE",
        environment: "gym",
        availableEquipment: equipment,
        likeMuscles: targetParts.length > 0 ? targetParts : [],
        healthConditions: weakParts.length > 0 ? weakParts : [],
        targetTimeMin: 40,
      };

      console.log(
        "📤 운동 플랜 생성 요청 body:",
        JSON.stringify(requestBody, null, 2)
      );

      const today = new Date().toISOString().split("T")[0];
      const apiResponse = await recommendedExerciseAPI.generateExercisePlan(
        today,
        requestBody
      );

      if (apiResponse && apiResponse.success && apiResponse.exercises) {
        if (apiResponse.focus) {
          setTodayFocus(apiResponse.focus);
        }

        const todayExercises = transformDailyExerciseToUI(apiResponse);
        setTodayRoutine(todayExercises);
        setShowRoutine(true);

        Alert.alert("성공", "운동 루틴이 생성되었습니다!");
        return;
      }

      throw new Error(apiResponse?.message || "운동 루틴 생성에 실패했습니다.");
    } catch (error: any) {
      console.error("❌ 운동 루틴 생성 실패:", error);

      // ✅ TempMealRecommendScreen 방식: 에러 메시지로 토큰 소진 판단
      const errorMessage = error.message || "";
      if (
        errorMessage.includes("토큰이 부족") ||
        errorMessage.includes("무료 운동 추천") ||
        error.code === "NO_WORKOUT_TOKENS" ||
        error.status === 403
      ) {
        setIsTokenDepleted(true);
        Alert.alert(
          "알림",
          "이번 주 무료 추천 횟수를 모두 사용했습니다.\n다음 주 월요일에 다시 시도해주세요."
        );
      } else {
        Alert.alert("오류", errorMessage || "운동 루틴 생성에 실패했습니다.");
      }
    } finally {
      setLoading(false);
    }
  };

  const handleSaveRoutine = async () => {
    const currentDate = new Date();
    const dateStr = `${currentDate.getFullYear()}-${String(
      currentDate.getMonth() + 1
    ).padStart(2, "0")}-${String(currentDate.getDate()).padStart(2, "0")}`;

    const groupKey = `ai_recommend_free_${Date.now()}`;
    const groupTitle = todayFocus
      ? `AI 추천 (무료) - ${mapFocusToKorean(todayFocus)}`
      : "AI 추천 (무료)";

    const activities = todayRoutine.map((exercise: any, index: number) => {
      const setsCount = exercise.sets || 3;
      const sets = Array.from({ length: setsCount }, (_, i) => ({
        id: i + 1,
        order: i + 1,
        weight: exercise.weight_kg || 0,
        reps: exercise.reps || 0,
        isCompleted: false,
      }));

      return {
        id: Date.now() + index,
        name: exercise.name || "운동",
        details: `${exercise.weight_kg || 0}kg ${
          exercise.reps || 0
        }회 ${setsCount}세트`,
        time: currentDate.toLocaleTimeString("ko-KR", {
          hour: "2-digit",
          minute: "2-digit",
          hour12: true,
        }),
        date: dateStr,
        isCompleted: false,
        externalId: exercise.exerciseId,
        targetMuscle: exercise.target,
        sets: sets,
        saveTitle: groupTitle,
        groupKey: groupKey,
      };
    });

    console.log("🚀 ExerciseScreen으로 이동:", {
      activitiesCount: activities.length,
    });

    navigation.navigate("Stats", {
      screen: "Exercise",
      params: {
        recommendedExercises: activities,
      },
    });
  };

  const handleRecommendAgain = () => {
    setShowRoutine(false);
    setTodayRoutine([]);
    setTodayFocus("");
  };

  // ✅ 버튼 비활성화 조건: 로딩 중이거나 토큰 소진
  const isDisabled = loading || isTokenDepleted;

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
              <Text style={styles.title}>오늘의 무료 루틴</Text>
              <Text style={styles.subtitle}>
                매주 1회 제공되는 무료 AI 추천 루틴입니다.{"\n"}더 많은 추천은
                프리미엄을 이용해주세요!
              </Text>

              <View style={styles.freeUserBannerContainer}>
                <LinearGradient
                  colors={["rgba(255,255,255,0.1)", "rgba(255,255,255,0.05)"]}
                  style={styles.freeUserBanner}
                >
                  <View style={styles.freeUserBadge}>
                    <LinearGradient
                      colors={["#e3ff7c", "#a8e063"]}
                      style={styles.freeUserBadgeGradient}
                    >
                      <Icon name="gift-outline" size={16} color="#111827" />
                      <Text style={styles.freeUserBadgeText}>무료 체험</Text>
                    </LinearGradient>
                  </View>

                  <Text style={styles.freeUserTitle}>
                    일주일에 단 한 번만 추천 가능!
                  </Text>

                  <TouchableOpacity
                    style={styles.premiumButton}
                    onPress={() =>
                      navigation.navigate("Main", {
                        screen: "MyPage",
                        params: { openPremiumModal: true },
                      } as any)
                    }
                    activeOpacity={0.9}
                  >
                    <LinearGradient
                      colors={["#e3ff7c", "#a8e063"]}
                      style={styles.premiumButtonGradient}
                    >
                      <Icon name="star" size={16} color="#111827" />
                      <Text style={styles.premiumButtonText}>
                        프리미엄으로 무제한 추천받기
                      </Text>
                      <Icon name="arrow-forward" size={16} color="#111827" />
                    </LinearGradient>
                  </TouchableOpacity>
                </LinearGradient>
              </View>

              <View style={styles.buttonGroup}>
                <TouchableOpacity
                  style={[
                    styles.primaryButton,
                    isDisabled && styles.disabledButtonShadow,
                  ]}
                  onPress={handleGetRoutine}
                  disabled={isDisabled}
                  activeOpacity={0.9}
                >
                  {isDisabled ? (
                    <LinearGradient
                      colors={["#4b5563", "#374151"]}
                      style={styles.primaryButtonGradient}
                    >
                      <Icon
                        name="checkmark-circle-outline"
                        size={20}
                        color="#ffffff"
                      />
                      <Text
                        style={[
                          styles.primaryButtonTextDisabled,
                          { color: "#ffffff" },
                        ]}
                      >
                        이번 주 추천 완료
                      </Text>
                    </LinearGradient>
                  ) : (
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
                      <Text style={styles.primaryButtonText}>
                        1일 무료 루틴 받기
                      </Text>
                    </LinearGradient>
                  )}
                </TouchableOpacity>

                {isTokenDepleted && (
                  <View style={styles.usedNotice}>
                    <Icon
                      name="alert-circle-outline"
                      size={16}
                      color="#ef4444"
                      style={{ marginBottom: 6 }}
                    />
                    <Text style={styles.usedNoticeText}>
                      이번 주 무료 추천을 모두 사용하였습니다.{"\n"}
                      다음 주 월요일에 다시 추천 받을 수 있습니다.
                    </Text>
                  </View>
                )}

                <View style={styles.optionCard}>
                  <TouchableOpacity
                    style={styles.optionButton}
                    onPress={() => setShowEquipmentPanel(true)}
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
                              "rgba(139,92,246,0.3)",
                              "rgba(139,92,246,0.1)",
                            ]}
                            style={styles.optionIcon}
                          >
                            <Icon name="barbell" size={20} color="#8b5cf6" />
                          </LinearGradient>
                        </View>
                        <Text style={styles.optionButtonText}>
                          사용가능한 장비
                        </Text>
                      </View>
                      <Icon name="chevron-forward" size={20} color="#6b7280" />
                    </LinearGradient>
                  </TouchableOpacity>
                  {equipment.length > 0 && (
                    <View style={styles.selectedTags}>
                      {equipment.map((item, index) => (
                        <View key={index} style={styles.tag}>
                          <LinearGradient
                            colors={[
                              "rgba(139,92,246,0.2)",
                              "rgba(139,92,246,0.1)",
                            ]}
                            style={styles.tagGradient}
                          >
                            <Text style={styles.tagText}>{item}</Text>
                          </LinearGradient>
                        </View>
                      ))}
                    </View>
                  )}
                </View>

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
                  <Text style={styles.routineTitle}>
                    오늘의 무료 루틴
                    {todayFocus ? ` - ${mapFocusToKorean(todayFocus)}` : ""}
                  </Text>
                  <Text style={styles.routineDate}>
                    {new Date().toLocaleDateString("ko-KR", {
                      month: "long",
                      day: "numeric",
                      weekday: "short",
                    })}
                  </Text>
                </View>
              </View>

              <View style={styles.exerciseList}>
                {todayRoutine.map((exercise, index) => (
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

                {/* 다시 추천받기 (무료는 제한이 있으므로 UI 리셋 용도) */}
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
                    <Text style={styles.refreshButtonText}>다시 선택하기</Text>
                  </LinearGradient>
                </TouchableOpacity>
              </View>
            </View>
          </ScrollView>
        )}

        {/* Modal Components */}
        <Modal
          visible={showEquipmentPanel}
          transparent={true}
          animationType="slide"
          onRequestClose={() => setShowEquipmentPanel(false)}
        >
          <TouchableOpacity
            style={styles.panelOverlay}
            activeOpacity={1}
            onPress={() => setShowEquipmentPanel(false)}
          >
            <View style={styles.bottomPanel}>
              <LinearGradient
                colors={["#1a1a2e", "#16213e"]}
                style={styles.bottomPanelGradient}
              >
                <View style={styles.panelHandle} />
                <Text style={styles.panelHeaderText}>사용가능한 장비 선택</Text>
                <ScrollView
                  style={styles.panelBody}
                  showsVerticalScrollIndicator={false}
                >
                  <View style={styles.optionGrid}>
                    {equipmentOptions.map((item) => (
                      <TouchableOpacity
                        key={item}
                        style={styles.modalOptionWrapper}
                        onPress={() => handleEquipmentToggle(item)}
                        activeOpacity={0.8}
                      >
                        {equipment.includes(item) ? (
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
                              {item}
                            </Text>
                          </LinearGradient>
                        ) : (
                          <View style={styles.modalOption}>
                            <Text style={styles.modalOptionText}>{item}</Text>
                          </View>
                        )}
                      </TouchableOpacity>
                    ))}
                  </View>
                  <TouchableOpacity
                    style={styles.confirmButton}
                    onPress={() => setShowEquipmentPanel(false)}
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

// ✅ 스타일은 동일하게 유지
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

  // 무료 회원 배너
  freeUserBannerContainer: {
    width: "100%",
    marginBottom: 24,
    borderRadius: 20,
    overflow: "hidden",
    shadowColor: "#000",
    shadowOffset: { width: 0, height: 4 },
    shadowOpacity: 0.2,
    shadowRadius: 12,
    elevation: 6,
  },
  freeUserBanner: {
    padding: 20,
    gap: 12,
    borderRadius: 20,
  },
  freeUserBadge: {
    alignSelf: "flex-start",
    borderRadius: 12,
    overflow: "hidden",
  },
  freeUserBadgeGradient: {
    flexDirection: "row",
    alignItems: "center",
    gap: 6,
    paddingHorizontal: 12,
    paddingVertical: 6,
  },
  freeUserBadgeText: {
    fontSize: 12,
    fontWeight: "700",
    color: "#111827",
    letterSpacing: 0.5,
  },
  freeUserTitle: {
    fontSize: 20,
    fontWeight: "700",
    color: "#e3ff7c",
    letterSpacing: 0.3,
  },
  remainingCount: {
    alignSelf: "flex-start",
    borderRadius: 12,
    overflow: "hidden",
    backgroundColor: "rgba(255,255,255,0.05)",
  },
  remainingCountInner: {
    flexDirection: "row",
    alignItems: "center",
    gap: 8,
    paddingHorizontal: 12,
    paddingVertical: 8,
  },
  remainingText: {
    fontSize: 14,
    color: "#ffffff",
    fontWeight: "500",
  },
  remainingNumber: {
    fontSize: 15,
    fontWeight: "700",
    color: "#e3ff7c",
  },
  premiumButton: {
    borderRadius: 12,
    overflow: "hidden",
    marginTop: 4,
  },
  premiumButtonGradient: {
    flexDirection: "row",
    alignItems: "center",
    justifyContent: "center",
    gap: 8,
    paddingVertical: 14,
  },
  premiumButtonText: {
    fontSize: 15,
    fontWeight: "700",
    color: "#111827",
  },

  // 버튼 그룹
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
  primaryButtonTextDisabled: {
    fontSize: 16,
    fontWeight: "600",
    color: "#6b7280",
    letterSpacing: 0.3,
  },
  disabledButtonShadow: {
    shadowOpacity: 0,
    elevation: 0,
    shadowColor: "transparent",
  },

  // 사용 완료 안내
  usedNotice: {
    alignItems: "center",
    justifyContent: "center",
    marginBottom: 12,
    padding: 12,
    backgroundColor: "rgba(255,255,255,0.05)",
    borderRadius: 12,
  },
  usedNoticeText: {
    fontSize: 13,
    color: "#9ca3af",
    fontWeight: "500",
    textAlign: "center",
    lineHeight: 20,
  },

  // 옵션 카드
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

  // 루틴 뷰
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

  // 모달 스타일
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
    width: "31%",
    borderRadius: 14,
    overflow: "hidden",
  },
  modalOption: {
    height: 52,
    backgroundColor: "rgba(255,255,255,0.05)",
    borderRadius: 14,
    borderWidth: 1,
    borderColor: "rgba(255,255,255,0.1)",
    justifyContent: "center",
    alignItems: "center",
    paddingHorizontal: 6,
  },
  modalOptionSelected: {
    height: 52,
    flexDirection: "row",
    alignItems: "center",
    justifyContent: "center",
    gap: 4,
    borderRadius: 14,
    paddingHorizontal: 6,
  },
  modalOptionText: {
    fontSize: 14,
    fontWeight: "500",
    color: "#ffffff",
    letterSpacing: 0.3,
    textAlign: "center",
  },
  modalOptionTextSelected: {
    fontSize: 14,
    color: "#111827",
    fontWeight: "700",
    letterSpacing: 0.3,
    textAlign: "center",
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

export default TempRoutineRecommendScreen;
