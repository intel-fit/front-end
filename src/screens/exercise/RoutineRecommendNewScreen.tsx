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
import { getLatestInBody } from "../../utils/inbodyApi";
const { width } = Dimensions.get("window");

const LOADING_MESSAGES = [
  "입력하신 신체 정보를 분석하는 중...",
  "회원님께 최적화된 루틴을 구성하는 중...",
  "부위별 밸런스를 계산하는 중...",
  "가장 효과적인 운동 조합을 찾는 중...",
  "거의 다 됐어요! 득근할 준비 되셨나요?",
];

//나이 계산
const calculateAge = (birthDateString: string): number => {
  if (!birthDateString) return 25; // 기본값
  const birthDate = new Date(birthDateString);
  const today = new Date();
  let age = today.getFullYear() - birthDate.getFullYear();
  const m = today.getMonth() - birthDate.getMonth();
  if (m < 0 || (m === 0 && today.getDate() < birthDate.getDate())) {
    age--;
  }
  return age;
};

// 성별 변환 (M/F -> male/female)
const mapGenderToAPI = (gender: string): string => {
  return gender === "F" ? "female" : "male";
};

// 운동 목표 변환 (한글/코드 -> API Enum)
const mapGoalToAPI = (goal: string): string => {
  // 사용자의 healthGoal 값에 따라 매핑 (예시)
  if (!goal) return "hypertrophy";
  if (goal.includes("다이어트") || goal === "DIET") return "weight_loss";
  if (goal.includes("근력") || goal.includes("비대") || goal === "MUSCLE")
    return "hypertrophy";
  if (goal.includes("건강") || goal === "HEALTH") return "general_fitness";
  if (goal.includes("체력") || goal === "STAMINA") return "endurance";
  return "hypertrophy"; // 기본값
};

// 경력 변환 (초급/중급/고급 -> beginner/intermediate/advanced)
const mapExperienceToAPI = (levelStr: string): string => {
  const map: { [key: string]: string } = {
    초급: "beginner",
    중급: "intermediate",
    고급: "advanced",
  };
  return map[levelStr] || "beginner";
};

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

// Focus 영어 → 한글 변환
const mapFocusToKorean = (focus: string): string => {
  const focusMap: { [key: string]: string } = {
    Upper: "상체",
    Core: "코어",
    Lower: "하체",
    // 하위 호환성 (혹시 API가 다른 값도 반환할 경우)
    Arms: "팔",
    Legs: "하체",
    Chest: "가슴",
    Back: "등",
    Shoulders: "어깨",
    "Full Body": "전신",
    Cardio: "유산소",
  };
  return focusMap[focus] || focus; // 매핑 없으면 원본 반환
};

const transformDailyExerciseToUI = (apiResponse: any) => {
  console.log("\n=== 📥 일일 운동 추천 API 응답 분석 ===");
  console.log("운동 개수:", apiResponse.exercises?.length || 0);
  console.log("집중 부위:", apiResponse.focus);

  // ✅ 하루치 운동만 반환 (exercises 배열)
  const exercises = (apiResponse.exercises || []).map((item: any) => {
    let icon = getExerciseIcon("RESISTANCE", item.target || "");

    const details = [];
    if (item.sets) details.push(`${item.sets}세트`);
    if (item.reps) details.push(`${item.reps}회`);
    if (item.weight_kg) details.push(`${item.weight_kg}kg`);

    const detail = details.join(" × ");

    console.log(`  ✓ ${item.name}: ${detail}`);

    return {
      name: item.name || "운동",
      detail: detail || `${item.intensity || "중간"} 강도`,
      icon: icon,
    };
  });

  console.log(`\n=== 📊 변환 완료: ${exercises.length}개 운동 ===`);

  return exercises;
};

const RoutineRecommendNewScreen = ({ navigation }: any) => {
  const [showRoutine, setShowRoutine] = useState(false);
  const [showWeakPanel, setShowWeakPanel] = useState(false);
  const [showLevelPanel, setShowLevelPanel] = useState(false);
  const [showTargetPanel, setShowTargetPanel] = useState(false);
  const [showEquipmentPanel, setShowEquipmentPanel] = useState(false);
  const [weakParts, setWeakParts] = useState<string[]>([]);
  const [level, setLevel] = useState("");
  const [targetParts, setTargetParts] = useState<string[]>([]);
  const [equipment, setEquipment] = useState<string[]>(["덤벨"]);
  const [savedRoutines, setSavedRoutines] = useState<any[]>([]);
  const [loading, setLoading] = useState(false);
  const [todayMetrics, setTodayMetrics] = useState({
    duration: 0,
    calories: 0,
  });
  const [todayFocus, setTodayFocus] = useState<string>("");
  const [weeklyRoutine, setWeeklyRoutine] = useState<any[]>([]);
  const [isWeeklyMode, setIsWeeklyMode] = useState(false);
  const [selectedDayIndex, setSelectedDayIndex] = useState(0);
  // 오늘의 운동만 저장 (단일 배열)
  const [todayRoutine, setTodayRoutine] = useState<any[]>([]);

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

  const handleEquipmentToggle = (item: string) => {
    if (equipment.includes(item)) {
      // 마지막 1개는 해제 불가
      if (equipment.length === 1) {
        Alert.alert("알림", "최소 1개의 장비를 선택해야 합니다.");
        return;
      }
      setEquipment(equipment.filter((e) => e !== item));
    } else {
      setEquipment([...equipment, item]);
    }
  };
  const selectWeeklyDay = (
    index: number,
    fullRoutine: any[] = weeklyRoutine
  ) => {
    // 인자로 받은 루틴이 없으면 state에 저장된 weeklyRoutine 사용
    const targetRoutine =
      fullRoutine && fullRoutine.length > 0 ? fullRoutine : weeklyRoutine;

    if (!targetRoutine || !targetRoutine[index]) return;

    const dayData = targetRoutine[index];
    setSelectedDayIndex(index);

    // UI 변환 로직 재사용 (기존 transformDailyExerciseToUI 활용)
    const uiExercises = transformDailyExerciseToUI(dayData);
    setTodayRoutine(uiExercises);

    // 메트릭스 업데이트
    if (dayData.metrics) {
      setTodayMetrics({
        duration: Math.round(dayData.metrics.total_duration_min || 0),
        calories: Math.round(dayData.metrics.total_kcal || 0),
      });
    }

    // Focus 업데이트
    if (dayData.focus) {
      setTodayFocus(dayData.focus);
    }
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

  // 운동 경력 레벨을 API 형식으로 변환
  const mapLevelToAPI = (level: string): string => {
    const levelMap: { [key: string]: string } = {
      초급: "BEGINNER",
      중급: "INTERMEDIATE",
      고급: "ADVANCED",
    };
    return levelMap[level] || "INTERMEDIATE";
  };

  const handleGetRoutine = async () => {
    setLoading(true);

    try {
      console.log("🏋️ 오늘의 운동 루틴 추천 시작");

      // ✅ 1단계: 프로필 확인
      let userProfile;
      try {
        userProfile = await recommendedExerciseAPI.getProfile();
        console.log("✅ 프로필 조회 성공:", userProfile);
        await AsyncStorage.setItem("userInfo", JSON.stringify(userProfile));
      } catch (error: any) {
        if (error.status === 401) {
          Alert.alert("로그인 필요", "로그인이 만료되었습니다.", [
            { text: "확인", onPress: () => navigation.navigate("Login") },
          ]);
          setLoading(false);
          return;
        }

        if (error.status === 404) {
          Alert.alert("프로필 설정 필요", "먼저 프로필을 설정해주세요.", [
            { text: "확인", style: "cancel" },
          ]);
          setLoading(false);
          return;
        }

        throw error;
      }

      // ✅ 2단계: 필수 정보 확인
      if (
        !userProfile?.height ||
        !userProfile?.weight ||
        !userProfile?.healthGoal
      ) {
        Alert.alert(
          "프로필 정보 부족",
          "키, 몸무게, 운동 목표를 입력해주세요.\n" +
            "프로필 화면에서 정보를 완성해주세요.",
          [{ text: "확인", style: "cancel" }]
        );
        setLoading(false);
        return;
      }

      // ✅ 3단계: 요청 바디 구성
      const requestBody = {
        experienceLevel: level ? mapLevelToAPI(level) : "INTERMEDIATE",
        environment: "gym",
        availableEquipment: equipment, // ← equipment state 그대로 사용 (기본: ["덤벨"])
        likeMuscles: targetParts.length > 0 ? targetParts : [],
        healthConditions: weakParts.length > 0 ? weakParts : [],
        targetTimeMin: 60,
      };

      console.log(
        "📤 운동 플랜 생성 요청 body:",
        JSON.stringify(requestBody, null, 2)
      );

      // ✅ 4단계: 오늘의 운동 플랜 생성 (1번만 호출)
      const today = new Date().toISOString().split("T")[0];
      const apiResponse = await recommendedExerciseAPI.generateExercisePlan(
        today,
        requestBody
      );

      console.log("📦 API 전체 응답:", JSON.stringify(apiResponse, null, 2));

      // ✅ 5단계: 응답 처리
      if (apiResponse && apiResponse.success && apiResponse.exercises) {
        console.log("✅ API 응답 성공:", apiResponse.message);
        console.log("📊 운동 개수:", apiResponse.exercises.length);
        console.log("🎯 집중 부위:", apiResponse.focus);

        // 메트릭스 정보 저장
        if (apiResponse.metrics) {
          setTodayMetrics({
            duration: Math.round(apiResponse.metrics.total_duration_min || 0),
            calories: Math.round(apiResponse.metrics.total_kcal || 0),
          });
        }

        // Focus 정보 저장
        if (apiResponse.focus) {
          setTodayFocus(apiResponse.focus);
          console.log("🎯 집중 부위 저장:", apiResponse.focus);
        }

        // 오늘의 운동을 UI 형식으로 변환
        const todayExercises = transformDailyExerciseToUI(apiResponse);

        // ✅ 오늘의 운동 저장
        setTodayRoutine(todayExercises);
        setShowRoutine(true);

        Alert.alert("생성 완료", "오늘의 운동 루틴이 생성되었습니다!", [
          { text: "확인" },
        ]);
        return;
      }

      throw new Error(apiResponse?.message || "운동 루틴 생성에 실패했습니다.");
    } catch (error: any) {
      console.error("❌ 운동 루틴 생성 실패:", error);

      // 토큰 부족 예외 처리
      if (error.code === "NO_WORKOUT_TOKENS") {
        Alert.alert(
          "토큰 부족",
          error.message ||
            "오늘 사용 가능한 운동 추천 토큰이 모두 소진되었습니다.",
          [{ text: "확인" }]
        );
        return;
      }

      if (error.status === 500) {
        Alert.alert(
          "서버 오류",
          "서버에서 오류가 발생했습니다.\n잠시 후 다시 시도해주세요.",
          [{ text: "확인" }]
        );
        return;
      }

      Alert.alert("오류", error.message || "운동 루틴 생성에 실패했습니다.");
    } finally {
      setLoading(false);
    }
  };

  const handleGetWeeklyRoutine = async () => {
    setLoading(true);
    setIsWeeklyMode(true);

    try {
      console.log("📅 7일 운동 루틴 추천 시작");

      // 1. 프로필 조회
      let userProfile;
      try {
        userProfile = await recommendedExerciseAPI.getProfile();
        await AsyncStorage.setItem("userInfo", JSON.stringify(userProfile));
      } catch (error: any) {
        if (error.status === 401) {
          Alert.alert("로그인 필요", "로그인이 만료되었습니다.", [
            { text: "확인", onPress: () => navigation.navigate("Login") },
          ]);
          setLoading(false);
          return;
        }
        const stored = await AsyncStorage.getItem("userInfo");
        if (stored) userProfile = JSON.parse(stored);
        else throw new Error("사용자 정보를 불러올 수 없습니다.");
      }

      // 2. 최신 인바디 데이터 조회 및 점수 변환
      let inbodyData = {
        arms: { muscle_score: 0.0, fat_score: 0.0 },
        chest: { muscle_score: 0.0, fat_score: 0.0 },
        back: { muscle_score: 0.0, fat_score: 0.0 },
        shoulders: { muscle_score: 0.0, fat_score: 0.0 },
        legs: { muscle_score: 0.0, fat_score: 0.0 },
        glutes: { muscle_score: 0.0, fat_score: 0.0 },
        core: { muscle_score: 0.0, fat_score: 0.0 },
      };

      let currentWeight = userProfile.weight || 75;

      try {
        console.log("📊 최신 인바디 데이터 조회 시도...");
        const response = await getLatestInBody();
        const latestInBody = response?.success ? response.inBody : response;

        if (latestInBody) {
          // (1) 체중 업데이트
          if (latestInBody.muscleFatAnalysis?.weight) {
            currentWeight = Number(latestInBody.muscleFatAnalysis.weight);
          } else if (latestInBody.weight) {
            currentWeight = Number(latestInBody.weight);
          }

          // (2) 점수 계산 헬퍼 ((값-100)/100)
          const calcScore = (val: any) => {
            const num = Number(val);
            if (isNaN(num)) return 0.0;
            return Number(((num - 100) / 100).toFixed(2));
          };

          const muscleObj = latestInBody.segmentalMuscleAnalysis || {};
          const fatObj = latestInBody.segmentalFatAnalysis || {};

          // 데이터 추출
          const armM =
            (Number(muscleObj.leftArm || 100) +
              Number(muscleObj.rightArm || 100)) /
            2;
          const armF =
            (Number(fatObj.leftArm || 100) + Number(fatObj.rightArm || 100)) /
            2;
          const legM =
            (Number(muscleObj.leftLeg || 100) +
              Number(muscleObj.rightLeg || 100)) /
            2;
          const legF =
            (Number(fatObj.leftLeg || 100) + Number(fatObj.rightLeg || 100)) /
            2;
          const trunkM = Number(muscleObj.trunk || 100);
          const trunkF = Number(fatObj.trunk || 100);

          const armScore = {
            muscle_score: calcScore(armM),
            fat_score: calcScore(armF),
          };
          const legScore = {
            muscle_score: calcScore(legM),
            fat_score: calcScore(legF),
          };
          const trunkScore = {
            muscle_score: calcScore(trunkM),
            fat_score: calcScore(trunkF),
          };

          inbodyData = {
            arms: armScore,
            shoulders: armScore,
            chest: trunkScore,
            back: trunkScore,
            core: trunkScore,
            legs: legScore,
            glutes: legScore,
          };
        }
      } catch (e: any) {
        console.log("ℹ️ 인바디 조회 실패 (기본값 사용):", e.message);
      }

      // 3. 필수 정보 검증
      if (!userProfile?.id && !userProfile?.userId) {
        throw new Error("유저 ID를 찾을 수 없습니다.");
      }

      const finalUserId = userProfile.id
        ? String(userProfile.id)
        : userProfile.userId;

      // 4. 요청 바디 구성
      // [수정] 고급 선택 시 빈 값 방지를 위해 중급으로 변경하는 함수
      const getSafeExperienceLevel = (uiLevel: string) => {
        if (uiLevel === "초급") return "beginner";
        if (uiLevel === "중급") return "intermediate";
        if (uiLevel === "고급") return "intermediate"; // 안전장치
        return "intermediate";
      };

      const requestBody = {
        user_id: finalUserId,
        age: calculateAge(userProfile.birthDate),
        sex: mapGenderToAPI(userProfile.gender),
        goal: mapGoalToAPI(userProfile.healthGoal),

        // 🔥 화면 선택값을 반영하되, '고급'은 '중급'으로 안전하게 요청
        experience: getSafeExperienceLevel(level),

        environment: "gym",

        // 장비는 사용자 선택값 반영 (한글 그대로 전송)
        available_equipment: equipment.length > 0 ? equipment : ["덤벨"],

        // 건강상태는 사용자 선택값 반영
        health_conditions: weakParts,

        plan_days: 7,
        target_time_min: 60,
        weight_kg: Number(currentWeight),
        inbody: inbodyData,
      };

      console.log("📤 AI 요청 바디:", JSON.stringify(requestBody, null, 2));

      // 5. API 호출
      const apiResponse =
        await recommendedExerciseAPI.generateWeeklyExercisePlan(requestBody);
      console.log("📦 AI 응답 수신 완료");

      // 6. 응답 데이터 처리
      if (apiResponse && apiResponse.plan && Array.isArray(apiResponse.plan)) {
        const sessionDetails = apiResponse.metrics?.session_details || [];
        const mergedPlan = apiResponse.plan.map((dayPlan: any) => {
          const dayMetrics = sessionDetails.find(
            (d: any) => d.day === dayPlan.day
          );
          return {
            ...dayPlan,
            metrics: {
              total_duration_min: dayMetrics?.duration_min || 0,
              total_kcal: dayMetrics?.kcal || 0,
            },
          };
        });

        setWeeklyRoutine(mergedPlan);
        selectWeeklyDay(0, mergedPlan);
        setShowRoutine(true);
        Alert.alert("생성 완료", `AI가 루틴을 설계했습니다! 💪`);
      } else {
        throw new Error("루틴 데이터 형식이 올바르지 않습니다.");
      }
    } catch (error: any) {
      console.error("❌ 7일 루틴 생성 에러:", error);
      Alert.alert(
        "실패",
        "운동 루틴을 생성하지 못했습니다.\n" + (error.message || "서버 오류")
      );
      setIsWeeklyMode(false);
    } finally {
      setLoading(false);
    }
  };
  const handleSaveRoutine = async () => {
    const today = new Date();

    // ------------------------------------------------------------
    // 🅰️ [CASE 1] 7일 추천 모드일 때 (서버 저장 + TEMP 요약 저장)
    // ------------------------------------------------------------
    if (isWeeklyMode && weeklyRoutine.length > 0) {
      setLoading(true);

      try {
        // 1. [기존] 7일치 상세 루틴 저장 데이터 구성
        const serverPayload = weeklyRoutine
          .map((dayPlan, dayIndex) => {
            if (!dayPlan.exercises || dayPlan.exercises.length === 0)
              return null;

            // 유효성 필터링
            const validExercises = dayPlan.exercises.filter((ex: any) => {
              if (!ex.exerciseId) return false;
              const id = String(ex.exerciseId);
              return id.trim() !== "" && !id.startsWith("seed_");
            });

            if (validExercises.length === 0) return null;

            const targetDate = new Date(today);
            targetDate.setDate(today.getDate() + dayIndex);

            const dateStr = `${targetDate.getFullYear()}-${String(
              targetDate.getMonth() + 1
            ).padStart(2, "0")}-${String(targetDate.getDate()).padStart(
              2,
              "0"
            )}`;

            const exercisesPayload = validExercises.map((ex: any) => ({
              exerciseId: String(ex.exerciseId),
              name: ex.name,
              target: ex.target || "",
            }));

            return {
              date: dateStr,
              exercises: exercisesPayload,
              // TEMP 저장을 위해 원본 데이터도 잠시 들고 있음 (서버 전송시엔 제거됨)
              _originalPlan: dayPlan,
            };
          })
          .filter((day) => day !== null);

        if (serverPayload.length === 0) {
          Alert.alert("알림", "저장할 수 있는 유효한 운동 데이터가 없습니다.");
          setLoading(false);
          return;
        }

        // 2. [NEW] TEMP 요약 API 호출 (운동이 있는 날짜별로 각각 호출)
        console.log("📝 7일치 요약(TEMP) 저장을 시작합니다...");

        // Promise.all로 병렬 처리하여 빠르게 저장
        const summaryPromises = serverPayload.map((dayData: any) => {
          const original = dayData._originalPlan;

          // Focus 값 추출 (없으면 'Body' 기본값)
          const focusValue = original.focus || "Body";

          const summaryBody = {
            date: dayData.date, // "2025-12-14"
            focus: focusValue, // "Upper"
            durationMin: original.metrics?.total_duration_min || 45,
            kcal: original.metrics?.total_kcal || 300,
            exerciseCount: dayData.exercises.length,
            title: `${focusValue} day`, // "Upper day"
          };

          return recommendedExerciseAPI.saveTempSummary(summaryBody);
        });

        await Promise.all(summaryPromises);
        console.log("✅ 7일치 요약(TEMP) 저장 완료!");

        // 3. [기존] 7일치 상세 루틴 서버 저장 (cleanPayload로 _originalPlan 제거 후 전송)
        const cleanPayload = serverPayload.map(
          ({ _originalPlan, ...rest }) => rest
        );

        console.log("💾 상세 루틴 저장을 요청합니다...");
        const saveResponse =
          await recommendedExerciseAPI.saveWeeklyExercisePlan({
            days: cleanPayload,
          });

        if (saveResponse && saveResponse.success) {
          console.log("✅ 상세 루틴 저장 성공:", saveResponse.message);

          // 4. UI 데이터 변환 및 이동 (기존 로직 유지)
          let activitiesToSave: any[] = [];
          const groupKey = `ai_weekly_${Date.now()}`;

          weeklyRoutine.forEach((dayPlan, dayIndex) => {
            if (!dayPlan.exercises || dayPlan.exercises.length === 0) return;

            const validExercises = dayPlan.exercises.filter((ex: any) => {
              if (!ex.exerciseId) return false;
              const id = String(ex.exerciseId);
              return id.trim() !== "" && !id.startsWith("seed_");
            });

            const targetDate = new Date(today);
            targetDate.setDate(today.getDate() + dayIndex);
            const dateStr = `${targetDate.getFullYear()}-${String(
              targetDate.getMonth() + 1
            ).padStart(2, "0")}-${String(targetDate.getDate()).padStart(
              2,
              "0"
            )}`;

            const groupTitle = `AI 7일 루틴 (Day ${dayIndex + 1})`;

            const dayActivities = validExercises.map(
              (exercise: any, exIndex: number) => {
                const setsCount = exercise.sets || 3;
                const sets = Array.from({ length: setsCount }, (_, i) => ({
                  id: i + 1,
                  order: i + 1,
                  weight: exercise.weight_kg || 0,
                  reps: exercise.reps || 0,
                  isCompleted: false,
                }));
                const details = []; // (간략화) 상세 로직은 기존 코드 참조
                if (exercise.weight_kg) details.push(`${exercise.weight_kg}kg`);
                if (exercise.reps) details.push(`${exercise.reps}회`);
                if (setsCount) details.push(`${setsCount}세트`);

                return {
                  id: Date.now() + dayIndex * 10000 + exIndex,
                  name: exercise.name || "운동",
                  details: details.join(" "),
                  time: "00:00",
                  date: dateStr,
                  isCompleted: false,
                  externalId: exercise.exerciseId,
                  sets: sets,
                  saveTitle: groupTitle,
                  groupKey: groupKey,
                  target: exercise.target,
                  category: exercise.category,
                };
              }
            );
            activitiesToSave = [...activitiesToSave, ...dayActivities];
          });

          navigation.navigate("Stats", {
            screen: "Exercise",
            params: { recommendedExercises: activitiesToSave, refresh: true },
          });
        } else {
          throw new Error(saveResponse?.message || "저장에 실패했습니다.");
        }
      } catch (error: any) {
        console.error("❌ 저장 실패:", error);
        Alert.alert("오류", error.message || "저장 중 문제가 발생했습니다.");
      } finally {
        setLoading(false);
      }
    }

    // ------------------------------------------------------------
    // 🅱️ [CASE 2] 1일 추천 모드일 때 (TEMP 요약 저장 추가)
    // ------------------------------------------------------------
    else {
      if (todayRoutine.length === 0) {
        Alert.alert("알림", "저장할 운동 데이터가 없습니다.");
        return;
      }

      setLoading(true); // 로딩 시작

      try {
        const dateStr = `${today.getFullYear()}-${String(
          today.getMonth() + 1
        ).padStart(2, "0")}-${String(today.getDate()).padStart(2, "0")}`;

        // 1. [NEW] 1일치 TEMP 요약 저장
        const focusValue = todayFocus || "General";

        const summaryBody = {
          date: dateStr,
          focus: focusValue,
          durationMin: todayMetrics.duration || 45,
          kcal: todayMetrics.calories || 300,
          exerciseCount: todayRoutine.length,
          title: `${focusValue} day`, // "Upper day"
        };

        console.log("📝 1일치 요약(TEMP) 저장을 요청합니다...");
        await recommendedExerciseAPI.saveTempSummary(summaryBody);
        console.log("✅ 1일치 요약(TEMP) 저장 완료!");

        // 2. [기존] UI 데이터 변환 및 이동
        const groupKey = `ai_daily_${Date.now()}`;
        const groupTitle = todayFocus
          ? `AI 추천 - ${mapFocusToKorean(todayFocus)}`
          : "AI 추천 운동";

        const activitiesToSave = todayRoutine.map(
          (exercise: any, index: number) => {
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
              details: exercise.detail,
              time: today.toLocaleTimeString("ko-KR", {
                hour: "2-digit",
                minute: "2-digit",
                hour12: true,
              }),
              date: dateStr,
              isCompleted: false,
              externalId: exercise.exerciseId,
              sets: sets,
              saveTitle: groupTitle,
              groupKey: groupKey,
              target: exercise.target,
              category: exercise.category,
            };
          }
        );

        navigation.navigate("Stats", {
          screen: "Exercise",
          params: {
            recommendedExercises: activitiesToSave,
          },
        });
      } catch (error: any) {
        console.error("❌ 1일 추천 저장 실패:", error);
        Alert.alert("오류", "저장 중 문제가 발생했습니다.");
      } finally {
        setLoading(false);
      }
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

  const handleRecommendAgain = () => {
    setShowRoutine(false);
    setTodayRoutine([]);
    setTodayMetrics({ duration: 0, calories: 0 });
    setTodayFocus(""); // ← focus 초기화
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

                {/* 7일 추천 루틴 버튼 추가 */}
                <TouchableOpacity
                  style={styles.primaryButton}
                  onPress={handleGetWeeklyRoutine}
                  disabled={loading}
                  activeOpacity={0.9}
                >
                  <LinearGradient
                    colors={["#e3ff7c", "#a8e063"]}
                    style={styles.primaryButtonGradient}
                  >
                    <Icon
                      name="calendar"
                      size={20}
                      color="#111827"
                      style={{ marginRight: 8 }}
                    />
                    <Text style={styles.primaryButtonText}>
                      7일 추천 루틴 받기
                    </Text>
                  </LinearGradient>
                </TouchableOpacity>

                {/* 사용가능한 장비 선택 - 새로 추가 */}
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
                {/* 왼쪽 텍스트 영역 (flex: 1을 줘서 탭이 길어져도 아이콘과 안 겹치게 함) */}
                <View style={{ flex: 1, paddingRight: 10 }}>
                  <Text style={styles.routineTitle}>
                    AI 추천 운동
                    {todayFocus ? ` - ${mapFocusToKorean(todayFocus)}` : ""}
                  </Text>

                  {/* ▼▼▼ [위치 이동] Day 탭을 여기(날짜 바로 위)로 옮겼습니다 ▼▼▼ */}
                  {isWeeklyMode && weeklyRoutine.length > 0 && (
                    <View style={{ marginTop: 8, marginBottom: 8, height: 34 }}>
                      <ScrollView
                        horizontal
                        showsHorizontalScrollIndicator={false}
                        contentContainerStyle={{ gap: 8, paddingRight: 20 }}
                      >
                        {weeklyRoutine.map((_, index) => (
                          <TouchableOpacity
                            key={index}
                            onPress={() => selectWeeklyDay(index)}
                            activeOpacity={0.8}
                          >
                            <LinearGradient
                              colors={
                                selectedDayIndex === index
                                  ? ["#e3ff7c", "#a8e063"]
                                  : [
                                      "rgba(255,255,255,0.1)",
                                      "rgba(255,255,255,0.05)",
                                    ]
                              }
                              style={{
                                paddingVertical: 6,
                                paddingHorizontal: 14,
                                borderRadius: 16,
                                borderWidth: 1,
                                borderColor:
                                  selectedDayIndex === index
                                    ? "transparent"
                                    : "rgba(255,255,255,0.1)",
                                alignItems: "center",
                                justifyContent: "center",
                              }}
                            >
                              <Text
                                style={{
                                  fontSize: 12,
                                  color:
                                    selectedDayIndex === index
                                      ? "#111827"
                                      : "#9ca3af",
                                  fontWeight:
                                    selectedDayIndex === index ? "700" : "500",
                                }}
                              >
                                Day {index + 1}
                              </Text>
                            </LinearGradient>
                          </TouchableOpacity>
                        ))}
                      </ScrollView>
                    </View>
                  )}
                  {/* ▲▲▲ Day 탭 끝 ▲▲▲ */}

                  <Text style={styles.routineDate}>
                    {(() => {
                      // 날짜 표시 로직: 7일 모드면 선택된 날짜, 아니면 오늘 날짜 표시
                      const displayDate = new Date();
                      if (isWeeklyMode) {
                        displayDate.setDate(
                          displayDate.getDate() + selectedDayIndex
                        );
                      }
                      return displayDate.toLocaleDateString("ko-KR", {
                        month: "long",
                        day: "numeric",
                        weekday: "short",
                      });
                    })()}
                  </Text>
                </View>
              </View>

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
                      {todayRoutine?.length || 0}개 운동
                    </Text>
                  </View>
                  <View style={styles.routineInfoDivider} />
                  <View style={styles.routineInfoItem}>
                    <View style={styles.routineInfoIconContainer}>
                      <Icon name="time" size={18} color="#e3ff7c" />
                    </View>
                    <Text style={styles.routineInfoText}>
                      {todayMetrics.duration}분
                    </Text>
                  </View>
                  {todayMetrics.calories > 0 && (
                    <>
                      <View style={styles.routineInfoDivider} />
                      <View style={styles.routineInfoItem}>
                        <View style={styles.routineInfoIconContainer}>
                          <Icon name="flame" size={18} color="#e3ff7c" />
                        </View>
                        <Text style={styles.routineInfoText}>
                          {todayMetrics.calories}kcal
                        </Text>
                      </View>
                    </>
                  )}
                </LinearGradient>
              </View>

              <View style={styles.exerciseList}>
                {todayRoutine?.map((exercise, index) => (
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
        {/* 사용가능한 장비 모달 - 새로 추가 */}
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
    width: "31%", // 3열로 변경 (8개 항목을 보기 좋게 표시)
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

export default RoutineRecommendNewScreen;
