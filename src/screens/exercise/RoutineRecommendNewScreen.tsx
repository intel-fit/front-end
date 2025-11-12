import React, { useState, useEffect } from "react";
import {
  View,
  Text,
  StyleSheet,
  ScrollView,
  TouchableOpacity,
  Alert,
  Modal,
  ActivityIndicator,
} from "react-native";
import { SafeAreaView } from "react-native-safe-area-context";
import { Ionicons as Icon } from "@expo/vector-icons";
import AsyncStorage from "@react-native-async-storage/async-storage";
import { authAPI, recommendedExerciseAPI } from "../../services";

// 운동 카테고리별 아이콘 매핑
const getExerciseIcon = (category: string, muscleName: string) => {
  // 유산소
  if (category === "CARDIO") return "🏃";

  // 무산소 - 부위별
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

// API 응답을 UI 형식으로 변환
const transformAIExerciseToUI = (apiResponse: any) => {
  const { plan } = apiResponse;

  // 요일 순서 정의
  const dayOrder = [
    "월요일",
    "화요일",
    "수요일",
    "목요일",
    "금요일",
    "토요일",
    "일요일",
  ];

  // routines를 요일 순서대로 정렬
  const sortedRoutines = [...plan.routines].sort((a: any, b: any) => {
    return dayOrder.indexOf(a.dayOfWeek) - dayOrder.indexOf(b.dayOfWeek);
  });

  // 7일치 배열로 변환
  const weekRoutines = sortedRoutines.map((routine: any) => {
    // items를 exerciseOrder로 정렬
    const sortedItems = [...routine.items].sort(
      (a: any, b: any) => a.exerciseOrder - b.exerciseOrder
    );

    // 각 운동을 UI 형식으로 변환
    return sortedItems.map((item: any) => {
      let name = "";
      let detail = "";
      let icon = "";

      // 유산소 운동인 경우
      if (item.cardioTypeName) {
        name = item.cardioTypeName;
        icon = "🏃";

        const details = [];
        if (item.targetDurationMinutes) {
          details.push(`${item.targetDurationMinutes}분`);
        }
        if (item.targetDistance) {
          details.push(`${item.targetDistance}km`);
        }
        if (item.targetCaloriesBurn) {
          details.push(`${item.targetCaloriesBurn}kcal`);
        }
        detail = details.join(" · ");
      }
      // 무산소 운동인 경우
      else if (item.resistanceExerciseTypeName) {
        name = item.resistanceExerciseTypeName;
        icon = getExerciseIcon("RESISTANCE", item.muscleGroupName || "");

        const details = [];
        if (item.recommendedSets) {
          details.push(`${item.recommendedSets}세트`);
        }
        if (item.recommendedWeight) {
          details.push(`${item.recommendedWeight}kg`);
        }
        if (item.recommendedReps) {
          details.push(`${item.recommendedReps}회`);
        }
        detail = details.join(" X ");
      }

      return {
        name: name || "운동",
        detail: detail || "",
        icon: icon || "💪",
      };
    });
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

  // ✅ weekRoutines를 state로 관리
  const [weekRoutines, setWeekRoutines] = useState([
    [
      { name: "시작 스트레칭", detail: "6회차 스트레칭", icon: "🏃" },
      { name: "레그 프레스", detail: "4세트 X 20kg X 15회", icon: "🦵" },
      { name: "레그 컬", detail: "3세트 X 12kg X 15회", icon: "🦵" },
    ],
    [
      { name: "시작 스트레칭", detail: "6회차 스트레칭", icon: "🏃" },
      { name: "벤치 프레스", detail: "4세트 X 40kg X 12회", icon: "💪" },
      { name: "덤벨 플라이", detail: "3세트 X 15kg X 12회", icon: "💪" },
    ],
    [
      { name: "시작 스트레칭", detail: "6회차 스트레칭", icon: "🏃" },
      { name: "데드리프트", detail: "4세트 X 60kg X 10회", icon: "🏋️" },
      { name: "랫 풀다운", detail: "3세트 X 45kg X 12회", icon: "🏋️" },
    ],
    [
      { name: "시작 스트레칭", detail: "6회차 스트레칭", icon: "🏃" },
      { name: "숄더 프레스", detail: "4세트 X 20kg X 12회", icon: "💪" },
      {
        name: "사이드 레터럴 레이즈",
        detail: "3세트 X 10kg X 15회",
        icon: "💪",
      },
    ],
    [
      { name: "시작 스트레칭", detail: "6회차 스트레칭", icon: "🏃" },
      { name: "스쿼트", detail: "4세트 X 50kg X 12회", icon: "🦵" },
      { name: "레그 익스텐션", detail: "3세트 X 30kg X 15회", icon: "🦵" },
    ],
    [
      { name: "시작 스트레칭", detail: "6회차 스트레칭", icon: "🏃" },
      { name: "바벨 컬", detail: "4세트 X 20kg X 12회", icon: "💪" },
      {
        name: "트라이셉스 익스텐션",
        detail: "3세트 X 15kg X 12회",
        icon: "💪",
      },
    ],
    [
      { name: "시작 스트레칭", detail: "6회차 스트레칭", icon: "🏃" },
      { name: "크런치", detail: "4세트 X 20회", icon: "🔥" },
      { name: "플랭크", detail: "3세트 X 60초", icon: "🔥" },
    ],
  ]);

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
      const stored = await AsyncStorage.getItem("savedRoutines");
      if (stored) {
        setSavedRoutines(JSON.parse(stored));
      }
    } catch (error) {
      console.log("Failed to load routines", error);
    }
  };

  const handleWeakPartToggle = (part: string) => {
    if (weakParts.includes(part)) {
      setWeakParts(weakParts.filter((p) => p !== part));
    } else {
      setWeakParts([...weakParts, part]);
    }
  };

  const handleTargetPartToggle = (part: string) => {
    if (targetParts.includes(part)) {
      setTargetParts(targetParts.filter((p) => p !== part));
    } else {
      setTargetParts([...targetParts, part]);
    }
  };

  const handleGetRoutine = async () => {
    setLoading(true);

    try {
      console.log("🏋️ 운동 루틴 추천 시작");

      // ✅ 1단계: 실제 API 시도
      try {
        const apiResponse = await recommendedExerciseAPI.generateExercisePlan();

        if (apiResponse && apiResponse.success) {
          console.log("✅ API 성공, 실제 데이터 사용");
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
      } catch (apiError: any) {
        console.log("⚠️ API 실패 (500 에러), 목업 데이터로 전환");
        console.log("에러 상세:", apiError.message);
      }

      // ✅ 2단계: API 실패 시 목업 데이터 사용
      console.log("📦 목업 데이터로 운동 루틴 생성");

      // 약간의 로딩 시간 (실제 API 느낌)
      await new Promise((resolve) => setTimeout(resolve, 1500));

      // ✅ 목업 응답 데이터 (백엔드가 준 형식과 동일)
      const mockApiResponse = {
        success: true,
        message: "맞춤 운동 플랜이 생성되었습니다 (샘플 데이터)",
        plan: {
          id: 1,
          planName: "체지방 감량을 위한 7일 운동 플랜",
          description: "주 7회, 유산소 및 근력 운동 병행",
          targetWeeklyMinutes: 420,
          routines: [
            // 월요일 - 하체
            {
              id: 1,
              routineName: "하체 집중 데이",
              dayOfWeek: "월요일",
              exerciseCategory: "RESISTANCE",
              exerciseCategoryName: "무산소",
              estimatedDurationMinutes: 60,
              items: [
                {
                  id: 1,
                  resistanceExerciseTypeName: "바벨 스쿼트",
                  muscleGroupName: "하체",
                  recommendedSets: 4,
                  recommendedReps: "10-12",
                  recommendedWeight: "80-100",
                  exerciseOrder: 1,
                },
                {
                  id: 2,
                  resistanceExerciseTypeName: "레그 프레스",
                  muscleGroupName: "하체",
                  recommendedSets: 3,
                  recommendedReps: "12-15",
                  recommendedWeight: "100-120",
                  exerciseOrder: 2,
                },
                {
                  id: 3,
                  resistanceExerciseTypeName: "레그 컬",
                  muscleGroupName: "하체",
                  recommendedSets: 3,
                  recommendedReps: "12-15",
                  recommendedWeight: "40-50",
                  exerciseOrder: 3,
                },
                {
                  id: 4,
                  resistanceExerciseTypeName: "런지",
                  muscleGroupName: "하체",
                  recommendedSets: 3,
                  recommendedReps: "10-12",
                  recommendedWeight: "20-30",
                  exerciseOrder: 4,
                },
              ],
            },
            // 화요일 - 가슴
            {
              id: 2,
              routineName: "가슴 집중 데이",
              dayOfWeek: "화요일",
              exerciseCategory: "RESISTANCE",
              exerciseCategoryName: "무산소",
              estimatedDurationMinutes: 60,
              items: [
                {
                  id: 5,
                  resistanceExerciseTypeName: "벤치 프레스",
                  muscleGroupName: "가슴",
                  recommendedSets: 4,
                  recommendedReps: "8-10",
                  recommendedWeight: "60-80",
                  exerciseOrder: 1,
                },
                {
                  id: 6,
                  resistanceExerciseTypeName: "인클라인 덤벨 프레스",
                  muscleGroupName: "가슴",
                  recommendedSets: 3,
                  recommendedReps: "10-12",
                  recommendedWeight: "20-25",
                  exerciseOrder: 2,
                },
                {
                  id: 7,
                  resistanceExerciseTypeName: "케이블 플라이",
                  muscleGroupName: "가슴",
                  recommendedSets: 3,
                  recommendedReps: "12-15",
                  recommendedWeight: "15-20",
                  exerciseOrder: 3,
                },
                {
                  id: 8,
                  resistanceExerciseTypeName: "푸쉬업",
                  muscleGroupName: "가슴",
                  recommendedSets: 3,
                  recommendedReps: "15-20",
                  exerciseOrder: 4,
                },
              ],
            },
            // 수요일 - 등
            {
              id: 3,
              routineName: "등 집중 데이",
              dayOfWeek: "수요일",
              exerciseCategory: "RESISTANCE",
              exerciseCategoryName: "무산소",
              estimatedDurationMinutes: 60,
              items: [
                {
                  id: 9,
                  resistanceExerciseTypeName: "데드리프트",
                  muscleGroupName: "등",
                  recommendedSets: 4,
                  recommendedReps: "6-8",
                  recommendedWeight: "80-100",
                  exerciseOrder: 1,
                },
                {
                  id: 10,
                  resistanceExerciseTypeName: "랫 풀다운",
                  muscleGroupName: "등",
                  recommendedSets: 4,
                  recommendedReps: "10-12",
                  recommendedWeight: "50-60",
                  exerciseOrder: 2,
                },
                {
                  id: 11,
                  resistanceExerciseTypeName: "시티드 로우",
                  muscleGroupName: "등",
                  recommendedSets: 3,
                  recommendedReps: "10-12",
                  recommendedWeight: "45-55",
                  exerciseOrder: 3,
                },
                {
                  id: 12,
                  resistanceExerciseTypeName: "바벨 로우",
                  muscleGroupName: "등",
                  recommendedSets: 3,
                  recommendedReps: "8-10",
                  recommendedWeight: "50-60",
                  exerciseOrder: 4,
                },
              ],
            },
            // 목요일 - 어깨
            {
              id: 4,
              routineName: "어깨 집중 데이",
              dayOfWeek: "목요일",
              exerciseCategory: "RESISTANCE",
              exerciseCategoryName: "무산소",
              estimatedDurationMinutes: 60,
              items: [
                {
                  id: 13,
                  resistanceExerciseTypeName: "숄더 프레스",
                  muscleGroupName: "어깨",
                  recommendedSets: 4,
                  recommendedReps: "10-12",
                  recommendedWeight: "30-40",
                  exerciseOrder: 1,
                },
                {
                  id: 14,
                  resistanceExerciseTypeName: "사이드 레터럴 레이즈",
                  muscleGroupName: "어깨",
                  recommendedSets: 3,
                  recommendedReps: "12-15",
                  recommendedWeight: "10-15",
                  exerciseOrder: 2,
                },
                {
                  id: 15,
                  resistanceExerciseTypeName: "프론트 레이즈",
                  muscleGroupName: "어깨",
                  recommendedSets: 3,
                  recommendedReps: "12-15",
                  recommendedWeight: "10-15",
                  exerciseOrder: 3,
                },
                {
                  id: 16,
                  resistanceExerciseTypeName: "리어 델트 플라이",
                  muscleGroupName: "어깨",
                  recommendedSets: 3,
                  recommendedReps: "12-15",
                  recommendedWeight: "8-12",
                  exerciseOrder: 4,
                },
              ],
            },
            // 금요일 - 팔
            {
              id: 5,
              routineName: "팔 집중 데이",
              dayOfWeek: "금요일",
              exerciseCategory: "RESISTANCE",
              exerciseCategoryName: "무산소",
              estimatedDurationMinutes: 60,
              items: [
                {
                  id: 17,
                  resistanceExerciseTypeName: "바벨 컬",
                  muscleGroupName: "팔",
                  recommendedSets: 4,
                  recommendedReps: "10-12",
                  recommendedWeight: "20-30",
                  exerciseOrder: 1,
                },
                {
                  id: 18,
                  resistanceExerciseTypeName: "트라이셉스 푸쉬다운",
                  muscleGroupName: "팔",
                  recommendedSets: 4,
                  recommendedReps: "10-12",
                  recommendedWeight: "25-35",
                  exerciseOrder: 2,
                },
                {
                  id: 19,
                  resistanceExerciseTypeName: "해머 컬",
                  muscleGroupName: "팔",
                  recommendedSets: 3,
                  recommendedReps: "12-15",
                  recommendedWeight: "15-20",
                  exerciseOrder: 3,
                },
                {
                  id: 20,
                  resistanceExerciseTypeName: "오버헤드 익스텐션",
                  muscleGroupName: "팔",
                  recommendedSets: 3,
                  recommendedReps: "10-12",
                  recommendedWeight: "20-25",
                  exerciseOrder: 4,
                },
              ],
            },
            // 토요일 - 유산소
            {
              id: 6,
              routineName: "유산소 & 컨디셔닝",
              dayOfWeek: "토요일",
              exerciseCategory: "CARDIO",
              exerciseCategoryName: "유산소",
              estimatedDurationMinutes: 45,
              items: [
                {
                  id: 21,
                  cardioTypeName: "런닝머신",
                  targetDurationMinutes: 30,
                  targetDistance: 5,
                  targetCaloriesBurn: 300,
                  exerciseOrder: 1,
                },
                {
                  id: 22,
                  cardioTypeName: "사이클",
                  targetDurationMinutes: 20,
                  targetCaloriesBurn: 150,
                  exerciseOrder: 2,
                },
              ],
            },
            // 일요일 - 복근 & 스트레칭
            {
              id: 7,
              routineName: "코어 & 회복",
              dayOfWeek: "일요일",
              exerciseCategory: "RESISTANCE",
              exerciseCategoryName: "무산소",
              estimatedDurationMinutes: 40,
              items: [
                {
                  id: 23,
                  resistanceExerciseTypeName: "크런치",
                  muscleGroupName: "복근",
                  recommendedSets: 4,
                  recommendedReps: "20-25",
                  exerciseOrder: 1,
                },
                {
                  id: 24,
                  resistanceExerciseTypeName: "플랭크",
                  muscleGroupName: "복근",
                  recommendedSets: 3,
                  recommendedReps: "60",
                  exerciseOrder: 2,
                },
                {
                  id: 25,
                  resistanceExerciseTypeName: "레그 레이즈",
                  muscleGroupName: "복근",
                  recommendedSets: 3,
                  recommendedReps: "15-20",
                  exerciseOrder: 3,
                },
                {
                  id: 26,
                  resistanceExerciseTypeName: "러시안 트위스트",
                  muscleGroupName: "복근",
                  recommendedSets: 3,
                  recommendedReps: "30-40",
                  exerciseOrder: 4,
                },
              ],
            },
          ],
          recommendationReason:
            "사용자의 건강 목표와 현재 체지방률에 최적화된 플랜입니다",
          createdAt: new Date().toISOString(),
          saved: false,
        },
      };

      // API 응답을 UI 형식으로 변환
      const convertedRoutines = transformAIExerciseToUI(mockApiResponse);
      setWeekRoutines(convertedRoutines);

      setShowRoutine(true);
      setSelectedDay(0);

      // 개발 모드 알림
      Alert.alert(
        "개발 모드",
        "현재 샘플 데이터를 표시하고 있습니다.\n\n백엔드 API가 준비되는 대로\n실제 AI 추천 데이터로 전환됩니다.",
        [
          {
            text: "확인",
            style: "default",
          },
        ]
      );
    } catch (error: any) {
      console.error("❌ 전체 프로세스 실패:", error);
      Alert.alert(
        "오류",
        "운동 루틴 생성에 실패했습니다.\n잠시 후 다시 시도해주세요."
      );
    } finally {
      setLoading(false);
    }
  };

  // ✅ 루틴을 기록에 자동 추가하는 함수
  const addRoutineToActivities = async (routine: any) => {
    try {
      const userId = await AsyncStorage.getItem("userId");
      const storageKey = userId
        ? `user_activities_v1:${userId}`
        : "user_activities_v1";

      const existingActivities = JSON.parse(
        (await AsyncStorage.getItem(storageKey)) || "[]"
      );

      // 오늘부터 7일간의 날짜 생성
      const today = new Date();
      const newActivities: any[] = [];

      // 각 요일의 운동을 해당 날짜에 추가
      routine.routine.forEach((dayExercises: any[], dayIndex: number) => {
        // dayIndex: 0=월요일, 6=일요일
        const targetDate = new Date(today);
        const todayDayOfWeek = today.getDay(); // 0=일요일
        const routineDayOfWeek = dayIndex === 6 ? 0 : dayIndex + 1;

        // 오늘부터 해당 요일까지의 일수 계산
        let daysUntilTarget = routineDayOfWeek - todayDayOfWeek;
        if (daysUntilTarget < 0) daysUntilTarget += 7;

        targetDate.setDate(today.getDate() + daysUntilTarget);

        const dateStr = `${targetDate.getFullYear()}-${String(
          targetDate.getMonth() + 1
        ).padStart(2, "0")}-${String(targetDate.getDate()).padStart(2, "0")}`;

        // 해당 날짜의 모든 운동 추가
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

      // 기존 기록 + 새 루틴 운동
      const updatedActivities = [...existingActivities, ...newActivities];
      await AsyncStorage.setItem(storageKey, JSON.stringify(updatedActivities));

      console.log(`✅ ${newActivities.length}개 운동이 기록에 추가되었습니다`);
    } catch (error) {
      console.error("기록 추가 실패:", error);
    }
  };

  const handleSaveRoutine = async () => {
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
      // 1. 루틴 저장
      const existingRoutines = JSON.parse(
        (await AsyncStorage.getItem("savedRoutines")) || "[]"
      );
      const updatedRoutines = [...existingRoutines, savedRoutine];
      await AsyncStorage.setItem(
        "savedRoutines",
        JSON.stringify(updatedRoutines)
      );
      setSavedRoutines(updatedRoutines);

      // 2. 기록에 자동 추가
      await addRoutineToActivities(savedRoutine);

      Alert.alert("저장 완료", "루틴이 저장되고 기록에 추가되었습니다!", [
        {
          text: "확인",
          onPress: () => {
            navigation.navigate("RoutineRecommend");
          },
        },
      ]);
    } catch (error) {
      console.log("Failed to save routine", error);
      Alert.alert("오류", "루틴 저장에 실패했습니다.");
    }
  };

  const handleRecommendAgain = () => {
    setShowRoutine(false);
    setSelectedDay(0);
  };

  return (
    <SafeAreaView style={styles.container} edges={["top"]}>
      <View style={styles.header}>
        <TouchableOpacity onPress={() => navigation.goBack()}>
          <Icon name="chevron-back" size={28} color="#ffffff" />
        </TouchableOpacity>
        <Text style={styles.headerTitle}>운동 루틴 추천</Text>
        <View style={{ width: 28 }} />
      </View>

      {!showRoutine ? (
        <ScrollView
          style={styles.content}
          contentContainerStyle={styles.contentContainer}
        >
          <View style={styles.mainContent}>
            <Text style={styles.title}>
              안녕하세요 - 회원님!{"\n"}최적화된 루틴을 추천해 드릴께요!
            </Text>

            <View style={styles.buttonGroup}>
              <TouchableOpacity
                style={styles.actionButton}
                onPress={handleGetRoutine}
                disabled={loading}
              >
                {loading ? (
                  <ActivityIndicator color="#111111" />
                ) : (
                  <Text style={styles.actionButtonText}>추천 루틴 받기</Text>
                )}
              </TouchableOpacity>

              <View>
                <TouchableOpacity
                  style={styles.actionButton}
                  onPress={() => setShowWeakPanel(true)}
                >
                  <Text style={styles.actionButtonText}>취약한 부분</Text>
                </TouchableOpacity>
                {weakParts.length > 0 && (
                  <Text style={styles.selectedInfo}>
                    {weakParts.join(", ")}
                  </Text>
                )}
              </View>

              <View>
                <TouchableOpacity
                  style={styles.actionButton}
                  onPress={() => setShowLevelPanel(true)}
                >
                  <Text style={styles.actionButtonText}>운동 경력</Text>
                </TouchableOpacity>
                {level && <Text style={styles.selectedInfo}>{level}</Text>}
              </View>

              <View>
                <TouchableOpacity
                  style={styles.actionButton}
                  onPress={() => setShowTargetPanel(true)}
                >
                  <Text style={styles.actionButtonText}>
                    보강하고 싶은 부위
                  </Text>
                </TouchableOpacity>
                {targetParts.length > 0 && (
                  <Text style={styles.selectedInfo}>
                    {targetParts.join(", ")}
                  </Text>
                )}
              </View>
            </View>
          </View>

          {savedRoutines.length > 0 && (
            <View style={styles.savedRoutines}>
              <Text style={styles.savedRoutinesTitle}>저장된 루틴</Text>
              {savedRoutines.map((routine) => (
                <TouchableOpacity
                  key={routine.id}
                  style={styles.savedRoutineItem}
                  onPress={() => navigation.navigate("RoutineRecommend")}
                >
                  <View style={styles.savedRoutineHeader}>
                    <Text style={styles.savedRoutineDate}>{routine.date}</Text>
                    {routine.level && (
                      <View style={styles.savedRoutineBadge}>
                        <Text style={styles.savedRoutineBadgeText}>
                          {routine.level}
                        </Text>
                      </View>
                    )}
                  </View>
                  {routine.targetParts && routine.targetParts.length > 0 && (
                    <Text style={styles.savedRoutineInfo}>
                      집중: {routine.targetParts.join(", ")}
                    </Text>
                  )}
                </TouchableOpacity>
              ))}
            </View>
          )}
        </ScrollView>
      ) : (
        <ScrollView style={styles.content} showsVerticalScrollIndicator={false}>
          <View style={styles.routineView}>
            <Text style={styles.routineTitle}>10월 2주차 루틴</Text>
            <Text style={styles.routineDate}>10/10 - 10/17</Text>

            <ScrollView
              horizontal
              showsHorizontalScrollIndicator={false}
              style={styles.dayTabsContainer}
              contentContainerStyle={styles.dayTabs}
            >
              {weekDays.map((day, index) => (
                <TouchableOpacity
                  key={index}
                  style={[
                    styles.dayTab,
                    selectedDay === index && styles.dayTabActive,
                  ]}
                  onPress={() => setSelectedDay(index)}
                  activeOpacity={0.8}
                >
                  <Text
                    style={[
                      styles.dayTabText,
                      selectedDay === index && styles.dayTabTextActive,
                    ]}
                  >
                    {day}
                  </Text>
                </TouchableOpacity>
              ))}
            </ScrollView>

            <View style={styles.routineInfo}>
              <Text style={styles.routineInfoText}>
                총 {weekRoutines[selectedDay]?.length || 0}개 운동
              </Text>
              <Text style={styles.routineInfoText}>⏱ 60분</Text>
            </View>

            <View style={styles.exerciseList}>
              {weekRoutines[selectedDay]?.map((exercise, index) => (
                <View key={index} style={styles.exerciseCard}>
                  <View style={styles.exerciseIcon}>
                    <Text style={styles.exerciseIconText}>{exercise.icon}</Text>
                  </View>
                  <View style={styles.exerciseInfo}>
                    <Text style={styles.exerciseName}>{exercise.name}</Text>
                    <Text style={styles.exerciseDetail}>{exercise.detail}</Text>
                  </View>
                </View>
              ))}
            </View>

            <View style={styles.routineButtons}>
              <TouchableOpacity
                style={styles.saveRoutineButton}
                onPress={handleSaveRoutine}
              >
                <Text style={styles.saveRoutineButtonText}>루틴 저장하기</Text>
              </TouchableOpacity>
              <TouchableOpacity
                style={styles.reRecommendButton}
                onPress={handleRecommendAgain}
              >
                <Text style={styles.reRecommendButtonText}>
                  루틴 다시 추천받기
                </Text>
              </TouchableOpacity>
            </View>
          </View>
        </ScrollView>
      )}

      {/* 취약한 부분 패널 */}
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
            <View style={styles.panelHandle} />
            <View style={styles.panelHeader}>
              <Text style={styles.panelHeaderText}>취약한 부분 선택</Text>
            </View>
            <ScrollView style={styles.panelBody}>
              <Text style={styles.panelDescription}>
                과거 다치거나 불편한 몸 부위를 선택해주세요
              </Text>
              <View style={styles.optionGrid}>
                {bodyParts.map((part) => (
                  <TouchableOpacity
                    key={part}
                    style={[
                      styles.optionButton,
                      weakParts.includes(part) && styles.optionButtonSelected,
                    ]}
                    onPress={() => handleWeakPartToggle(part)}
                  >
                    <Text
                      style={[
                        styles.optionButtonText,
                        weakParts.includes(part) &&
                          styles.optionButtonTextSelected,
                      ]}
                    >
                      {part}
                    </Text>
                  </TouchableOpacity>
                ))}
              </View>
              <TouchableOpacity
                style={styles.confirmButton}
                onPress={() => setShowWeakPanel(false)}
              >
                <Text style={styles.confirmButtonText}>선택 완료</Text>
              </TouchableOpacity>
            </ScrollView>
          </View>
        </TouchableOpacity>
      </Modal>

      {/* 운동 경력 패널 */}
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
            <View style={styles.panelHandle} />
            <View style={styles.panelHeader}>
              <Text style={styles.panelHeaderText}>운동 경력 선택</Text>
            </View>
            <ScrollView style={styles.panelBody}>
              <Text style={styles.panelDescription}>
                현재 운동 수준을 선택해주세요
              </Text>
              <View style={styles.optionGrid}>
                {levels.map((lv) => (
                  <TouchableOpacity
                    key={lv}
                    style={[
                      styles.optionButton,
                      level === lv && styles.optionButtonSelected,
                    ]}
                    onPress={() => setLevel(lv)}
                  >
                    <Text
                      style={[
                        styles.optionButtonText,
                        level === lv && styles.optionButtonTextSelected,
                      ]}
                    >
                      {lv}
                    </Text>
                  </TouchableOpacity>
                ))}
              </View>
              <TouchableOpacity
                style={styles.confirmButton}
                onPress={() => setShowLevelPanel(false)}
              >
                <Text style={styles.confirmButtonText}>선택 완료</Text>
              </TouchableOpacity>
            </ScrollView>
          </View>
        </TouchableOpacity>
      </Modal>

      {/* 보강하고 싶은 부위 패널 */}
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
            <View style={styles.panelHandle} />
            <View style={styles.panelHeader}>
              <Text style={styles.panelHeaderText}>보강하고 싶은 부위</Text>
            </View>
            <ScrollView style={styles.panelBody}>
              <Text style={styles.panelDescription}>
                집중적으로 운동하고 싶은 부위를 선택해주세요
              </Text>
              <View style={styles.optionGrid}>
                {targetAreas.map((area) => (
                  <TouchableOpacity
                    key={area}
                    style={[
                      styles.optionButton,
                      targetParts.includes(area) && styles.optionButtonSelected,
                    ]}
                    onPress={() => handleTargetPartToggle(area)}
                  >
                    <Text
                      style={[
                        styles.optionButtonText,
                        targetParts.includes(area) &&
                          styles.optionButtonTextSelected,
                      ]}
                    >
                      {area}
                    </Text>
                  </TouchableOpacity>
                ))}
              </View>
              <TouchableOpacity
                style={styles.confirmButton}
                onPress={() => setShowTargetPanel(false)}
              >
                <Text style={styles.confirmButtonText}>선택 완료</Text>
              </TouchableOpacity>
            </ScrollView>
          </View>
        </TouchableOpacity>
      </Modal>
    </SafeAreaView>
  );
};

const styles = StyleSheet.create({
  container: {
    flex: 1,
    backgroundColor: "#111111",
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
    fontSize: 20,
    fontWeight: "700",
    color: "#ffffff",
  },
  content: {
    flex: 1,
  },
  contentContainer: {
    padding: 60,
    paddingTop: 60,
    paddingHorizontal: 20,
    alignItems: "center",
  },
  mainContent: {
    alignItems: "center",
    width: "100%",
  },
  title: {
    fontSize: 20,
    fontWeight: "700",
    color: "#ffffff",
    textAlign: "center",
    lineHeight: 28,
    marginBottom: 80,
  },
  buttonGroup: {
    width: "100%",
    gap: 12,
  },
  actionButton: {
    width: "100%",
    height: 56,
    backgroundColor: "#e3ff7c",
    borderRadius: 12,
    justifyContent: "center",
    alignItems: "center",
  },
  actionButtonText: {
    fontSize: 16,
    fontWeight: "600",
    color: "#111111",
  },
  selectedInfo: {
    fontSize: 14,
    color: "#999999",
    marginTop: 8,
    marginBottom: 4,
    textAlign: "center",
  },
  savedRoutines: {
    width: "100%",
    marginTop: 30,
    padding: 20,
  },
  savedRoutinesTitle: {
    fontSize: 18,
    fontWeight: "700",
    color: "#ffffff",
    marginBottom: 15,
  },
  savedRoutineItem: {
    backgroundColor: "#222222",
    borderRadius: 12,
    padding: 16,
    marginBottom: 12,
  },
  savedRoutineHeader: {
    flexDirection: "row",
    justifyContent: "space-between",
    alignItems: "center",
    marginBottom: 8,
  },
  savedRoutineDate: {
    fontSize: 14,
    fontWeight: "600",
    color: "#ffffff",
  },
  savedRoutineBadge: {
    backgroundColor: "#e3ff7c",
    paddingVertical: 4,
    paddingHorizontal: 10,
    borderRadius: 12,
  },
  savedRoutineBadgeText: {
    fontSize: 12,
    fontWeight: "500",
    color: "#111111",
  },
  savedRoutineInfo: {
    fontSize: 14,
    color: "#999999",
  },
  routineView: {
    padding: 20,
  },
  routineTitle: {
    fontSize: 22,
    fontWeight: "700",
    color: "#ffffff",
    marginBottom: 5,
  },
  routineDate: {
    fontSize: 14,
    color: "#999999",
    marginBottom: 20,
  },
  dayTabsContainer: {
    marginBottom: 20,
  },
  dayTabs: {
    gap: 8,
    paddingBottom: 8,
  },
  dayTab: {
    paddingVertical: 5,
    paddingHorizontal: 16,
    backgroundColor: "#222222",
    borderRadius: 20,
    marginRight: 8,
  },
  dayTabActive: {
    backgroundColor: "#e3ff7c",
  },
  dayTabText: {
    fontSize: 12,
    fontWeight: "500",
    color: "#999999",
  },
  dayTabTextActive: {
    color: "#111111",
    fontWeight: "600",
  },
  routineInfo: {
    flexDirection: "row",
    gap: 15,
    marginBottom: 20,
    fontSize: 14,
    color: "#999999",
  },
  routineInfoText: {
    fontSize: 14,
    color: "#999999",
  },
  exerciseList: {
    gap: 12,
    marginBottom: 30,
  },
  exerciseCard: {
    backgroundColor: "#464646",
    borderRadius: 12,
    padding: 16,
    flexDirection: "row",
    alignItems: "center",
    gap: 15,
  },
  exerciseIcon: {
    fontSize: 32,
    width: 50,
    height: 50,
    justifyContent: "center",
    alignItems: "center",
    backgroundColor: "#333333",
    borderRadius: 10,
  },
  exerciseIconText: {
    fontSize: 32,
  },
  exerciseInfo: {
    flex: 1,
  },
  exerciseName: {
    fontSize: 16,
    fontWeight: "600",
    color: "#ffffff",
    marginBottom: 5,
  },
  exerciseDetail: {
    fontSize: 14,
    color: "#aaaaaa",
  },
  routineButtons: {
    gap: 12,
  },
  saveRoutineButton: {
    width: "100%",
    height: 52,
    backgroundColor: "#e3ff7c",
    borderRadius: 12,
    justifyContent: "center",
    alignItems: "center",
  },
  saveRoutineButtonText: {
    fontSize: 16,
    fontWeight: "600",
    color: "#111111",
  },
  reRecommendButton: {
    width: "100%",
    height: 52,
    backgroundColor: "transparent",
    borderWidth: 1,
    borderColor: "#464646",
    borderRadius: 12,
    justifyContent: "center",
    alignItems: "center",
  },
  reRecommendButtonText: {
    fontSize: 16,
    fontWeight: "600",
    color: "#ffffff",
  },
  panelOverlay: {
    flex: 1,
    backgroundColor: "rgba(0, 0, 0, 0.5)",
    justifyContent: "center",
    alignItems: "center",
  },
  bottomPanel: {
    backgroundColor: "#1a1a1a",
    borderRadius: 20,
    width: "90%",
    maxWidth: 390,
    maxHeight: "70%",
    paddingBottom: 20,
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
  panelHeader: {
    paddingHorizontal: 20,
    marginBottom: 16,
  },
  panelHeaderText: {
    fontSize: 18,
    fontWeight: "700",
    color: "#ffffff",
  },
  panelBody: {
    paddingHorizontal: 20,
  },
  panelDescription: {
    fontSize: 14,
    color: "#999999",
    marginBottom: 20,
    lineHeight: 20,
  },
  optionGrid: {
    flexDirection: "row",
    flexWrap: "wrap",
    gap: 12,
    marginBottom: 24,
    justifyContent: "space-between",
  },
  optionButton: {
    width: "48%",
    height: 50,
    backgroundColor: "#2a2a2a",
    borderRadius: 12,
    borderWidth: 2,
    borderColor: "transparent",
    justifyContent: "center",
    alignItems: "center",
  },
  optionButtonSelected: {
    backgroundColor: "#e3ff7c",
    borderColor: "#e3ff7c",
  },
  optionButtonText: {
    fontSize: 15,
    fontWeight: "500",
    color: "#ffffff",
  },
  optionButtonTextSelected: {
    color: "#111111",
    fontWeight: "600",
  },
  confirmButton: {
    width: "100%",
    height: 52,
    backgroundColor: "#e3ff7c",
    borderRadius: 12,
    justifyContent: "center",
    alignItems: "center",
  },
  confirmButtonText: {
    fontSize: 16,
    fontWeight: "600",
    color: "#111111",
  },
});

export default RoutineRecommendNewScreen;
