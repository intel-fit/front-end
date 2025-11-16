import React, { useState, useEffect, useMemo } from "react";
import {
  View,
  Text,
  Modal,
  TouchableOpacity,
  StyleSheet,
  TextInput,
  ScrollView,
  Image,
  KeyboardAvoidingView,
  Platform,
  Alert,
  SafeAreaView,
} from "react-native";
import { Ionicons as Icon } from "@expo/vector-icons";
import AsyncStorage from "@react-native-async-storage/async-storage";
import { colors } from "../../theme/colors";
import {
  fetchExercises as fetchExerciseApi,
  fetchExerciseDetail,
} from "../../utils/exerciseApi";
import ExerciseSetItem from "../ExerciseSetItem";

interface Set {
  id: number;
  order: number;
  weight: number;
  reps: number;
  isCompleted: boolean;
}

interface ExerciseModalProps {
  isOpen: boolean;
  onClose: () => void;
  mode?: "add" | "edit";
  exerciseData?: any;
  onSave?: (
    sets: Set[],
    exerciseName: string,
    meta?: {
      externalId?: string;
      category?: string;
    },
    comment?: string,
    options?: {
      keepModalOpen?: boolean;
    }
  ) => void;
  onWorkoutComplete?: (exercises: Array<{
    name: string;
    targetMuscle?: string;
    imageUrl?: string;
  }>) => void;
  fullScreen?: boolean;
  renderContentOnly?: boolean;
}

const ExerciseModal: React.FC<ExerciseModalProps> = ({
  isOpen,
  onClose,
  mode = "add",
  exerciseData,
  onSave,
  onWorkoutComplete,
  fullScreen = false,
  renderContentOnly = false,
}) => {
  const [searchTerm, setSearchTerm] = useState("");
  const [selectedCategory, setSelectedCategory] = useState("전체");
  const [currentMode, setCurrentMode] = useState<"add" | "edit" | "detail">(
    mode
  );
  const [selectedExercise, setSelectedExercise] = useState<any>(null);
  const [sets, setSets] = useState<Set[]>([
    { id: 1, order: 1, weight: 20, reps: 15, isCompleted: false },
    { id: 2, order: 2, weight: 20, reps: 12, isCompleted: false },
    { id: 3, order: 3, weight: 20, reps: 12, isCompleted: false },
  ]);
  const [showInstructions, setShowInstructions] = useState<boolean>(false);
  const [instructionLoading, setInstructionLoading] = useState<boolean>(false);
  const [instructionText, setInstructionText] = useState<string>("");
  const [instructionImageUrl, setInstructionImageUrl] = useState<string>("");
  const [comment, setComment] = useState<string>("");
  const [userName, setUserName] = useState<string>("Member");
  // 추가한 모든 운동 리스트 관리
  const [addedExercises, setAddedExercises] = useState<Array<{
    exercise: any;
    sets: Set[];
    comment: string;
    instructionText: string;
    instructionImageUrl: string;
  }>>([]);
  // 현재 보고 있는 운동의 인덱스 (-1이면 새로 선택한 운동, 0 이상이면 추가한 운동 중 하나)
  const [currentExerciseIndex, setCurrentExerciseIndex] = useState<number>(-1);
  const allSetsCompleted = useMemo(
    () => sets.length > 0 && sets.every((set) => set.isCompleted),
    [sets]
  );

  useEffect(() => {
    // 유저명 가져오기
    const loadUserName = async () => {
      try {
        const name = await AsyncStorage.getItem("userName");
        if (name) {
          setUserName(name);
        }
      } catch (error) {
        console.error("유저명 가져오기 실패:", error);
      }
    };
    loadUserName();
  }, []);

  // 디버깅: 상태 변화 추적
  useEffect(() => {
    if (currentMode === "detail") {
      console.log("운동 상태:", {
        currentMode,
        addedExercisesLength: addedExercises.length,
        currentExerciseIndex,
        shouldShowLeft: addedExercises.length >= 2 && currentExerciseIndex > 0,
        shouldShowRight: addedExercises.length >= 2 && currentExerciseIndex >= 0 && currentExerciseIndex < addedExercises.length - 1,
      });
    }
  }, [currentMode, addedExercises.length, currentExerciseIndex]);


  useEffect(() => {
    if (isOpen) {
      if (mode === "add") {
        setCurrentMode("add");
        setSelectedExercise(null);
        setSearchTerm("");
        setSelectedCategory("전체");
        setSets([
          { id: 1, order: 1, weight: 20, reps: 15, isCompleted: false },
          { id: 2, order: 2, weight: 20, reps: 12, isCompleted: false },
          { id: 3, order: 3, weight: 20, reps: 12, isCompleted: false },
        ]);
        setComment("");
      } else if (mode === "edit") {
        setCurrentMode("detail");
        setSelectedExercise(exerciseData);
        // edit 모드일 때는 히스토리 초기화
        setAddedExercises([]);
        setCurrentExerciseIndex(-1);
        if (exerciseData?.sets && exerciseData.sets.length > 0) {
          // Activity.sets를 Set[] 형식으로 변환
          const convertedSets: Set[] = exerciseData.sets.map((set: any, index: number) => ({
            id: set.id || index + 1,
            order: set.order !== undefined ? set.order : index + 1,
            weight: set.weight || 0,
            reps: set.reps || 0,
            isCompleted: set.isCompleted !== undefined ? set.isCompleted : (set.completed || false),
          }));
          setSets(convertedSets);
        } else {
          setSets([
            { id: 1, order: 1, weight: 20, reps: 15, isCompleted: false },
            { id: 2, order: 2, weight: 20, reps: 12, isCompleted: false },
            { id: 3, order: 3, weight: 20, reps: 12, isCompleted: false },
          ]);
        }
        setComment(exerciseData?.comment || "");
        // 운동 상세 정보 로드
        if (exerciseData?.externalId) {
          setInstructionLoading(true);
          setInstructionText("");
          fetchExerciseDetail(exerciseData.externalId)
            .then((data: any) => {
              const desc =
                data?.description ||
                data?.instructions ||
                data?.howTo ||
                data?.guide ||
                data?.tip ||
                "";
              if (typeof desc === "string") setInstructionText(desc);
              if (data?.imageUrl) setInstructionImageUrl(data.imageUrl);
            })
            .catch(() => {})
            .finally(() => setInstructionLoading(false));
        } else {
          setInstructionText("");
          setInstructionImageUrl("");
        }
      }
    } else {
      // 모달이 닫힐 때 초기화
      setCurrentMode("add");
      setSelectedExercise(null);
      setSearchTerm("");
      setSelectedCategory("전체");
      setComment("");
      setInstructionText("");
      setInstructionImageUrl("");
      setShowInstructions(false);
    }
  }, [isOpen, mode, exerciseData]);

  // 운동 상세 정보 자동 로드
  useEffect(() => {
    const currentEx = selectedExercise || exerciseData;
    if (currentMode === "detail" && currentEx?.externalId) {
      setInstructionLoading(true);
      fetchExerciseDetail(currentEx.externalId)
        .then((data: any) => {
          const desc =
            data?.description ||
            data?.instructions ||
            data?.howTo ||
            data?.guide ||
            data?.tip ||
            "";
          if (typeof desc === "string") {
            setInstructionText(desc);
            setShowInstructions(true);
          }
          if (data?.imageUrl) {
            setInstructionImageUrl(data.imageUrl);
          }
        })
        .catch(() => {})
        .finally(() => setInstructionLoading(false));
    }
  }, [currentMode, selectedExercise, exerciseData]);

  const categories = [
    "전체",
    "가슴",
    "등",
    "하체",
    "어깨",
    "팔",
    "코어",
    "유산소",
  ];

  // UI 카테고리 → API bodyPart 매핑 (서버가 다른 값을 사용할 수 있음)
  // 여러 후보 값을 시도하도록 수정
  // 서버 실제 값 기준으로 보정된 매핑
  const categoryToBodyPart: Record<string, string[]> = {
    전체: [""],
    가슴: ["가슴"],
    등: ["등"],
    // 하체 관련: 서버는 "허벅지", "종아리", "허리" 등 세분화되어 있음
    하체: ["허벅지", "종아리", "허리", "하체"],
    어깨: ["어깨"],
    // 팔 관련: 서버는 "상완이두근", "팔 아래" 등으로 제공됨
    팔: ["상완이두근", "팔 아래", "팔"],
    // 코어 관련: 서버는 "허리"로 제공됨
    코어: ["허리", "코어"],
    유산소: ["유산소", "유산소 운동", "카디오", "심폐"],
  };

  // API 운동 목록 상태
  const [apiExercises, setApiExercises] = useState<any[]>([]);
  const [loadingList, setLoadingList] = useState<boolean>(false);
  const [availableBodyParts, setAvailableBodyParts] = useState<string[]>([]);

  // 서버 인코딩 문제(UTF-8이 Latin-1로 깨진 경우) 복구 시도
  const normalizeEncoding = (text: string) => {
    if (!text) return text;

    const candidates: string[] = [text];
    try {
      // latin1 -> utf8 복구
      // eslint-disable-next-line no-undef
      candidates.push(decodeURIComponent(escape(text)));
    } catch {}
    try {
      // 반대 방향도 시도 (이미 두 번 깨진 경우 대비)
      // eslint-disable-next-line no-undef
      candidates.push(unescape(encodeURIComponent(text)));
    } catch {}

    // 한글 글자 수가 가장 많은 후보를 선택
    const scoreHangul = (s: string) => (s.match(/[가-힣]/g) || []).length;
    let best = candidates[0];
    let bestScore = scoreHangul(best);
    for (const c of candidates.slice(1)) {
      const sc = scoreHangul(c);
      if (sc > bestScore) {
        best = c;
        bestScore = sc;
      }
    }
    return best;
  };

  // 표시용 한국어 이름 우선 선택
  const getExerciseDisplayName = (ex: any) => {
    const raw =
      ex?.koreanName ||
      ex?.korName ||
      ex?.nameKo ||
      ex?.koName ||
      ex?.name ||
      "";
    return normalizeEncoding(raw);
  };

  // 실제 API bodyPart 값과 UI 카테고리 매핑 (자동 감지)
  const [bodyPartMapping, setBodyPartMapping] = useState<
    Record<string, string>
  >({
    전체: "",
    가슴: "가슴",
    등: "등",
    하체: "하체",
    어깨: "어깨",
    팔: "팔",
    코어: "코어",
  });

  // 전체 목록에서 실제 bodyPart 값들 수집 및 자동 매핑
  useEffect(() => {
    if (!isOpen) return;
    const collectAndMapBodyParts = async () => {
      try {
        const res = await fetchExerciseApi({
          page: 0,
          size: 200, // 더 많은 데이터로 정확한 매핑
        });
        if (res?.content && Array.isArray(res.content)) {
          const bodyPartsSet = new Set<string>();
          const bodyPartCounts: Record<string, number> = {};

          res.content.forEach((ex: any) => {
            if (ex.bodyPart) {
              const bp = normalizeEncoding(ex.bodyPart);
              bodyPartsSet.add(bp);
              bodyPartCounts[bp] = (bodyPartCounts[bp] || 0) + 1;
            }
          });

          const allBodyParts = Array.from(bodyPartsSet).sort();
          setAvailableBodyParts(allBodyParts);
          console.log("📋 API에서 사용하는 실제 bodyPart 값들:", allBodyParts);
          console.log("📊 각 bodyPart별 운동 개수:", bodyPartCounts);

          // UI 카테고리와 매칭되는 bodyPart 찾기
          const newMapping: Record<string, string> = { 전체: "" };

          categories.forEach((category) => {
            if (category === "전체") return;

            // 정확한 매칭 시도
            if (allBodyParts.includes(category)) {
              newMapping[category] = category;
            } else {
              // 부분 매칭 시도
              const candidates = categoryToBodyPart[category] || [];
              for (const candidate of candidates) {
                if (allBodyParts.includes(candidate)) {
                  newMapping[category] = candidate;
                  console.log(`✅ ${category} → ${candidate} 매핑 완료`);
                  break;
                }
              }
              // 매칭 실패 시 첫 번째 후보 사용
              if (!newMapping[category]) {
                newMapping[category] = candidates[0] || category;
                console.warn(
                  `⚠️ ${category} 매핑 실패, 기본값 사용: ${newMapping[category]}`
                );
              }
            }
          });

          setBodyPartMapping(newMapping);
          console.log("🗺️ 최종 bodyPart 매핑:", newMapping);
        }
      } catch (e) {
        console.error("bodyPart 수집 실패:", e);
      }
    };
    collectAndMapBodyParts();
  }, [isOpen]);

  const bodyPartParam = bodyPartMapping[selectedCategory] || "";

  // API 호출: 카테고리/검색 변화 시
  useEffect(() => {
    if (!isOpen) return;
    const controller = new AbortController();
    const run = async () => {
      setLoadingList(true);
      const apiBodyPart = bodyPartParam || undefined;
      console.log(
        "🔍 API 호출 - 부위:",
        selectedCategory,
        "→ bodyPart:",
        apiBodyPart || "(전체)"
      );
      try {
        const res = await fetchExerciseApi({
          bodyPart: apiBodyPart,
          keyword: searchTerm || undefined,
          page: 0,
          size: 30,
        });
        console.log("✅ 운동 목록 불러오기 성공:", {
          totalElements: res?.totalElements || 0,
          contentLength: res?.content?.length || 0,
          empty: res?.empty,
          firstItem: res?.content?.[0]
            ? {
                name: res.content[0].name,
                bodyPart: res.content[0].bodyPart,
              }
            : null,
        });
        // 빈 결과일 때 실제 bodyPart 값 확인 (하체, 팔, 코어)
        if (
          ["하체", "팔", "코어"].includes(selectedCategory) &&
          res?.content?.length === 0
        ) {
          console.warn(
            `⚠️ ${selectedCategory} 결과가 비어있습니다.`,
            `사용된 bodyPart: "${apiBodyPart}"`,
            `서버에서 사용하는 bodyPart 값들:`,
            availableBodyParts.sort()
          );
        }
        setApiExercises(Array.isArray(res?.content) ? res.content : []);
      } catch (e: any) {
        console.error("❌ 운동 목록 불러오기 실패:", {
          message: e?.message,
          status: e?.response?.status,
          data: e?.response?.data,
          selectedCategory,
          apiBodyPart,
        });
        setApiExercises([]);
      } finally {
        setLoadingList(false);
      }
    };
    run();
    return () => controller.abort();
  }, [isOpen, selectedCategory, searchTerm, bodyPartParam, availableBodyParts]);

  const handleSetChange = (setId: number, field: string, value: number) => {
    setSets((prev) =>
      prev.map((set) => (set.id === setId ? { ...set, [field]: value } : set))
    );
  };

  const handleOrderChange = (setId: number, newOrder: number) => {
    if (newOrder < 1) return;
    setSets((prev) =>
      prev.map((set) => (set.id === setId ? { ...set, order: newOrder } : set))
    );
  };

  const handleSetComplete = (setId: number) => {
    setSets((prev) =>
      prev.map((set) =>
        set.id === setId ? { ...set, isCompleted: !set.isCompleted } : set
      )
    );
  };

  const handleAddSet = () => {
    setSets((prev) => {
      const lastSet = prev[prev.length - 1];
      const newOrder = prev.length > 0 ? lastSet.order + 1 : 1;
      const newSet: Set = {
        id: Date.now(),
        order: newOrder,
        weight: lastSet?.weight || 20,
        reps: lastSet?.reps || 12,
        isCompleted: false,
      };
      return [...prev, newSet];
    });
  };

  const handleRemoveSet = (setId: number) => {
    if (sets.length > 1) {
      setSets((prev) => {
        const filtered = prev.filter((set) => set.id !== setId);
        return filtered.map((set, index) => ({
          ...set,
          order: index + 1,
        }));
      });
    }
  };

  const handleExerciseSelect = (exercise: any) => {
    // 현재 detail 모드에 있던 운동이 있으면 리스트에 추가
    let newIndex = -1;
    if (currentMode === "detail" && selectedExercise) {
      if (currentExerciseIndex === -1) {
        // 새로 선택한 운동이므로 현재 운동과 새 운동을 모두 리스트에 추가
        const prevLength = addedExercises.length;
        setAddedExercises((prev) => [
          ...prev,
          {
            exercise: selectedExercise,
            sets: [...sets],
            comment: comment,
            instructionText: instructionText,
            instructionImageUrl: instructionImageUrl,
          },
          {
            exercise: exercise,
            sets: [
              { id: 1, order: 1, weight: 20, reps: 15, isCompleted: false },
              { id: 2, order: 2, weight: 20, reps: 12, isCompleted: false },
              { id: 3, order: 3, weight: 20, reps: 12, isCompleted: false },
            ],
            comment: "",
            instructionText: "",
            instructionImageUrl: "",
          },
        ]);
        // 새로 선택한 운동의 인덱스는 리스트의 마지막 인덱스
        newIndex = prevLength + 1;
      } else {
        // 이미 리스트에 있는 운동이므로, 새 운동만 리스트에 추가
        const prevLength = addedExercises.length;
        setAddedExercises((prev) => [
          ...prev,
          {
            exercise: exercise,
            sets: [
              { id: 1, order: 1, weight: 20, reps: 15, isCompleted: false },
              { id: 2, order: 2, weight: 20, reps: 12, isCompleted: false },
              { id: 3, order: 3, weight: 20, reps: 12, isCompleted: false },
            ],
            comment: "",
            instructionText: "",
            instructionImageUrl: "",
          },
        ]);
        // 새로 선택한 운동의 인덱스는 리스트의 마지막 인덱스
        newIndex = prevLength;
      }
    } else if (currentMode === "add" && addedExercises.length > 0) {
      // "종목 추가" 후 검색 페이지에서 새 운동을 선택한 경우
      // 이전에 추가한 운동이 있으면, 새 운동을 리스트에 추가
      const prevLength = addedExercises.length;
      setAddedExercises((prev) => [
        ...prev,
        {
          exercise: exercise,
          sets: [
            { id: 1, order: 1, weight: 20, reps: 15, isCompleted: false },
            { id: 2, order: 2, weight: 20, reps: 12, isCompleted: false },
            { id: 3, order: 3, weight: 20, reps: 12, isCompleted: false },
          ],
          comment: "",
          instructionText: "",
          instructionImageUrl: "",
        },
      ]);
      // 새로 선택한 운동의 인덱스는 리스트의 마지막 인덱스
      newIndex = prevLength;
    }
    
    setSelectedExercise(exercise);
    setCurrentMode("detail");
    setCurrentExerciseIndex(newIndex);
    setShowInstructions(false);
    setSets([
      { id: 1, order: 1, weight: 20, reps: 15, isCompleted: false },
      { id: 2, order: 2, weight: 20, reps: 12, isCompleted: false },
      { id: 3, order: 3, weight: 20, reps: 12, isCompleted: false },
    ]);
    setComment("");
    // 상세 정보 미리 로드 시도 (설명 표시를 위한 사전 로딩)
    if (exercise?.externalId) {
      setInstructionLoading(true);
      setInstructionText("");
      fetchExerciseDetail(exercise.externalId)
        .then((data: any) => {
          const desc =
            data?.description ||
            data?.instructions ||
            data?.howTo ||
            data?.guide ||
            data?.tip ||
            "";
          if (typeof desc === "string") setInstructionText(desc);
          if (data?.imageUrl) setInstructionImageUrl(data.imageUrl);
        })
        .catch(() => {})
        .finally(() => setInstructionLoading(false));
    } else {
      setInstructionText("");
      setInstructionImageUrl("");
    }
  };

  // (임시 테스트 버튼 제거됨)

  const handleSave = () => {
    // detail 모드에서만 저장 가능 (운동이 선택된 상태)
    if (currentMode !== "detail") {
      return;
    }
    
    // 완료된 운동 목록 수집
    const exercisesToSave: Array<{
      exercise: any;
      sets: Set[];
      name: string;
      targetMuscle?: string;
    }> = [];
    
    // addedExercises의 모든 운동 추가
    addedExercises.forEach((item) => {
      const exerciseName = getExerciseDisplayName(item.exercise);
      exercisesToSave.push({
        exercise: item.exercise,
        sets: item.sets,
        name: exerciseName,
        targetMuscle: item.exercise?.targetMuscle || item.exercise?.bodyPart,
      });
      
      // 각 운동을 저장
      if (onSave) {
        const meta = {
          externalId: item.exercise?.externalId,
          category: item.exercise?.category || item.exercise?.bodyPart || item.exercise?.targetMuscle || "",
        };
        const trimmedComment =
          item.sets.every((s) => s.isCompleted) && item.comment?.trim().length > 0
            ? item.comment.trim()
            : undefined;
        onSave(item.sets, exerciseName, meta, trimmedComment);
      }
    });
    
    // 현재 운동이 리스트에 없으면 추가
    const currentEx = selectedExercise || exerciseData;
    if (currentEx) {
      const currentName = getExerciseDisplayName(currentEx);
      const isAlreadyInList = exercisesToSave.some(
        (ex) => getExerciseDisplayName(ex.exercise) === currentName
      );
      
      if (!isAlreadyInList) {
        exercisesToSave.push({
          exercise: currentEx,
          sets: sets,
          name: currentName,
          targetMuscle: currentEx?.targetMuscle || currentEx?.bodyPart,
        });
        
        // 현재 운동도 저장
        if (onSave) {
          const meta = {
            externalId: currentEx?.externalId,
            category: currentEx?.category || currentEx?.bodyPart || currentEx?.targetMuscle || "",
          };
          const trimmedComment =
            allSetsCompleted && comment.trim().length > 0
              ? comment.trim()
              : undefined;
          onSave(sets, currentName, meta, trimmedComment);
        }
      }
    }
    
    // 완료된 운동 목록을 ExerciseScreen에 전달
    const exercisesForModal = exercisesToSave.map((ex) => ({
      name: ex.name,
      targetMuscle: ex.targetMuscle,
      imageUrl: ex.exercise?.imageUrl || ex.exercise?.image || ex.exercise?.imgUrl || ex.exercise?.photoUrl,
      externalId: ex.exercise?.externalId,
    }));
    
    // 모든 운동 저장이 완료된 후 완료 모달 표시
    if (onWorkoutComplete) {
      onWorkoutComplete(exercisesForModal);
    }
    
    setShowInstructions(false);
  };

  const content = fullScreen ? (
    <SafeAreaView style={styles.fullScreenContainer}>
      <View style={styles.fullScreenContent}>
          {currentMode === "add" ? (
            <KeyboardAvoidingView
              behavior={Platform.OS === "ios" ? "padding" : undefined}
              style={styles.keyboardAvoider}
            >
              {fullScreen && (
                <View style={styles.fullScreenHeader}>
                  <TouchableOpacity onPress={onClose} style={styles.backBtnTop}>
                    <Icon name="arrow-back" size={24} color="#ffffff" />
                  </TouchableOpacity>
                  <Text style={styles.fullScreenTitle}>
                    {userName}! 어떤 운동을 진행할까요?
                  </Text>
                </View>
              )}
              <View style={fullScreen ? styles.whiteCard : styles.addExerciseModal}>
                {!fullScreen && (
                  <View style={styles.modalHeader}>
                    <View style={styles.headerLeft}>
                    </View>
                    <Text style={styles.modalTitle}>종목 추가</Text>
                    <View style={styles.headerRight}>
                      <TouchableOpacity onPress={onClose} style={styles.closeBtn}>
                        <Icon name="close" size={12} color="#ffffff" />
                      </TouchableOpacity>
                    </View>
                  </View>
                )}

              <View style={[
                styles.searchContainer,
                fullScreen && styles.searchContainerFullScreen
              ]}>
                <View style={[
                  styles.searchBar,
                  fullScreen && styles.searchBarLight
                ]}>
                  <Icon name="search" size={20} color={fullScreen ? "#666666" : "#666666"} />
                  <TextInput
                    style={[
                      styles.searchInput,
                      fullScreen && styles.searchInputLight
                    ]}
                    placeholder="종목 이름을 검색하세요."
                    placeholderTextColor={fullScreen ? "#666666" : "#666666"}
                    value={searchTerm}
                    onChangeText={setSearchTerm}
                  />
                </View>
              </View>

              <View style={styles.filterWrapper}>
                <ScrollView
                  horizontal
                  showsHorizontalScrollIndicator={false}
                  style={styles.filterContainer}
                  contentContainerStyle={styles.filterContent}
                  contentInset={{ left: 12, right: 12 }}
                  contentInsetAdjustmentBehavior="never"
                >
                  {categories.map((category) => (
                    <TouchableOpacity
                      key={category}
                      style={[
                        styles.filterBtn,
                        fullScreen && styles.filterBtnLight,
                        selectedCategory === category && (
                          fullScreen ? styles.filterBtnActiveLight : styles.filterBtnActive
                        ),
                      ]}
                      onPress={() => setSelectedCategory(category)}
                    >
                      <Text
                        style={[
                          styles.filterBtnText,
                          fullScreen && styles.filterBtnTextLight,
                          selectedCategory === category && (
                            fullScreen ? styles.filterBtnTextActiveLight : styles.filterBtnTextActive
                          ),
                        ]}
                      >
                        {category}
                      </Text>
                    </TouchableOpacity>
                  ))}
                </ScrollView>
              </View>

              <ScrollView
                style={styles.exerciseList}
                contentContainerStyle={styles.exerciseListContent}
                showsVerticalScrollIndicator={true}
                bounces={true}
                contentInsetAdjustmentBehavior="never"
                automaticallyAdjustContentInsets={false}
              >
                {loadingList && (
                  <View style={{ paddingVertical: 16 }}>
                    <Text style={{ color: "#aaa", textAlign: "center" }}>
                      불러오는 중...
                    </Text>
                  </View>
                )}
                {!loadingList && apiExercises.length === 0 && (
                  <View style={{ paddingVertical: 16 }}>
                    <Text style={{ color: "#888", textAlign: "center" }}>
                      운동이 없습니다
                    </Text>
                  </View>
                )}
                {!loadingList &&
                  apiExercises.map((ex: any, index: number) => (
                    <TouchableOpacity
                      key={ex.externalId || `${ex.name}-${index}`}
                      style={styles.exerciseItem}
                      onPress={() => handleExerciseSelect(ex)}
                    >
                      <View style={styles.exerciseIcon}>
                        {ex.imageUrl || ex.image || ex.imgUrl || ex.photoUrl ? (
                          <Image
                            source={{
                              uri:
                                ex.imageUrl ||
                                ex.image ||
                                ex.imgUrl ||
                                ex.photoUrl,
                            }}
                            style={styles.exerciseImage}
                            resizeMode="cover"
                          />
                        ) : (
                          <View style={styles.exerciseImagePlaceholder}>
                            <Icon name="barbell" size={16} color="#666666" />
                          </View>
                        )}
                      </View>
                      <View style={styles.exerciseInfo}>
                        <Text
                          style={[
                            styles.exerciseName,
                            fullScreen && styles.exerciseNameLight
                          ]}
                          numberOfLines={1}
                          ellipsizeMode="tail"
                          allowFontScaling={false}
                        >
                          {getExerciseDisplayName(ex)}
                        </Text>
                        <Text
                          style={[
                            styles.exerciseLastUsed,
                            fullScreen && styles.exerciseLastUsedLight
                          ]}
                          numberOfLines={1}
                          ellipsizeMode="tail"
                          allowFontScaling={false}
                        >
                          {normalizeEncoding(
                            (ex.targetMuscle || ex.bodyPart || "").toString()
                          )}
                        </Text>
                      </View>
                    </TouchableOpacity>
                  ))}
              </ScrollView>
              </View>
            </KeyboardAvoidingView>
          ) : (
            <View style={styles.exerciseDetailModal}>
              {fullScreen && (
                <View style={styles.fullScreenHeader}>
                  <TouchableOpacity 
                    onPress={() => {
                      // 이전 운동이 있으면 이전 운동으로 돌아가기
                      if (currentExerciseIndex > 0) {
                        const prevIndex = currentExerciseIndex - 1;
                        const prevExercise = addedExercises[prevIndex];
                        setSelectedExercise(prevExercise.exercise);
                        setSets(prevExercise.sets);
                        setComment(prevExercise.comment);
                        setInstructionText(prevExercise.instructionText);
                        setInstructionImageUrl(prevExercise.instructionImageUrl);
                        setCurrentExerciseIndex(prevIndex);
                        // 운동 상세 정보 다시 로드
                        if (prevExercise.exercise?.externalId) {
                          setInstructionLoading(true);
                          fetchExerciseDetail(prevExercise.exercise.externalId)
                            .then((data: any) => {
                              const desc =
                                data?.description ||
                                data?.instructions ||
                                data?.howTo ||
                                data?.guide ||
                                data?.tip ||
                                "";
                              setInstructionText(desc);
                              setInstructionImageUrl(
                                data?.imageUrl || data?.image || data?.imgUrl || data?.photoUrl || ""
                              );
                              setInstructionLoading(false);
                            })
                            .catch((err) => {
                              console.error("운동 상세 정보 로드 실패:", err);
                              setInstructionLoading(false);
                            });
                        }
                      } else {
                        // 이전 운동이 없으면 운동 검색 페이지로 돌아가기
                        setCurrentMode("add");
                        setSelectedExercise(null);
                        setCurrentExerciseIndex(-1);
                        setSearchTerm("");
                        setSelectedCategory("전체");
                        setSets([
                          { id: 1, order: 1, weight: 20, reps: 15, isCompleted: false },
                          { id: 2, order: 2, weight: 20, reps: 12, isCompleted: false },
                          { id: 3, order: 3, weight: 20, reps: 12, isCompleted: false },
                        ]);
                        setComment("");
                        setInstructionText("");
                        setInstructionImageUrl("");
                        setShowInstructions(false);
                      }
                    }} 
                    style={styles.backBtnTop}
                  >
                    <Icon name="arrow-back" size={24} color="#ffffff" />
                  </TouchableOpacity>
                  <Text style={styles.fullScreenTitle}>
                    {getExerciseDisplayName(
                      selectedExercise || exerciseData || { name: "운동" }
                    )}
                  </Text>
                </View>
              )}
              {!fullScreen && (
                <View style={styles.modalHeader}>
                  <View style={styles.modalTitleContainer}>
                    <Text
                      style={styles.modalTitle}
                      numberOfLines={1}
                      ellipsizeMode="tail"
                    >
                      {getExerciseDisplayName(
                        selectedExercise || exerciseData || { name: "운동" }
                      )}
                    </Text>
                  </View>
                  <View style={styles.headerRightRow}>
                    <TouchableOpacity onPress={onClose} style={styles.closeBtn}>
                      <Icon name="close" size={12} color="#ffffff" />
                    </TouchableOpacity>
                  </View>
                </View>
              )}

              <KeyboardAvoidingView
                behavior={Platform.OS === "ios" ? "padding" : undefined}
                style={styles.detailKeyboardAvoider}
              >
                <ScrollView
                  style={styles.detailScroll}
                  contentContainerStyle={styles.detailScrollContent}
                  keyboardShouldPersistTaps="handled"
                >
                {/* 운동 이미지 - 항상 표시 */}
                <View style={styles.exerciseImageContainer}>
                  {instructionLoading ? (
                    <View style={styles.exerciseImagePlaceholderLarge}>
                      <Text style={styles.loadingText}>불러오는 중...</Text>
                    </View>
                  ) : instructionImageUrl || selectedExercise?.imageUrl || exerciseData?.imageUrl ? (
                    <Image
                      source={{ uri: instructionImageUrl || selectedExercise?.imageUrl || exerciseData?.imageUrl }}
                      style={styles.exerciseImageLarge}
                      resizeMode="contain"
                    />
                  ) : (
                    <View style={styles.exerciseImagePlaceholderLarge}>
                      <Icon name="barbell" size={48} color="#666666" />
                    </View>
                  )}
                  {/* 좌우 화살표 */}
                  {/* 왼쪽 버튼: 운동이 2개 이상이고, 현재가 첫 번째(인덱스 0)가 아니면 표시 */}
                  {currentMode === "detail" && addedExercises.length >= 2 && currentExerciseIndex > 0 && (
                    <TouchableOpacity 
                      style={styles.exerciseImageNavLeft} 
                      onPress={() => {
                        // 이전 운동으로 이동
                        const prevIndex = currentExerciseIndex - 1;
                        const prevExercise = addedExercises[prevIndex];
                        setSelectedExercise(prevExercise.exercise);
                        setSets(prevExercise.sets);
                        setComment(prevExercise.comment);
                        setInstructionText(prevExercise.instructionText);
                        setInstructionImageUrl(prevExercise.instructionImageUrl);
                        setCurrentExerciseIndex(prevIndex);
                        // 운동 상세 정보 다시 로드
                        if (prevExercise.exercise?.externalId) {
                          setInstructionLoading(true);
                          fetchExerciseDetail(prevExercise.exercise.externalId)
                            .then((data: any) => {
                              const desc =
                                data?.description ||
                                data?.instructions ||
                                data?.howTo ||
                                data?.guide ||
                                data?.tip ||
                                "";
                              setInstructionText(desc);
                              setInstructionImageUrl(
                                data?.imageUrl || data?.image || data?.imgUrl || data?.photoUrl || ""
                              );
                              setInstructionLoading(false);
                            })
                            .catch((err) => {
                              console.error("운동 상세 정보 로드 실패:", err);
                              setInstructionLoading(false);
                            });
                        }
                      }}
                    >
                      <Icon name="chevron-back" size={24} color="#ffffff" />
                    </TouchableOpacity>
                  )}
                  {/* 오른쪽 버튼: 운동이 2개 이상이고, 현재가 마지막이 아니면 표시 */}
                  {currentMode === "detail" && addedExercises.length >= 2 && currentExerciseIndex >= 0 && currentExerciseIndex < addedExercises.length - 1 && (
                    <TouchableOpacity 
                      style={styles.exerciseImageNavRight} 
                      onPress={() => {
                        // 다음 운동으로 이동
                        const nextIndex = currentExerciseIndex + 1;
                        const nextExercise = addedExercises[nextIndex];
                        setSelectedExercise(nextExercise.exercise);
                        setSets(nextExercise.sets);
                        setComment(nextExercise.comment);
                        setInstructionText(nextExercise.instructionText);
                        setInstructionImageUrl(nextExercise.instructionImageUrl);
                        setCurrentExerciseIndex(nextIndex);
                        // 운동 상세 정보 다시 로드
                        if (nextExercise.exercise?.externalId) {
                          setInstructionLoading(true);
                          fetchExerciseDetail(nextExercise.exercise.externalId)
                            .then((data: any) => {
                              const desc =
                                data?.description ||
                                data?.instructions ||
                                data?.howTo ||
                                data?.guide ||
                                data?.tip ||
                                "";
                              setInstructionText(desc);
                              setInstructionImageUrl(
                                data?.imageUrl || data?.image || data?.imgUrl || data?.photoUrl || ""
                              );
                              setInstructionLoading(false);
                            })
                            .catch((err) => {
                              console.error("운동 상세 정보 로드 실패:", err);
                              setInstructionLoading(false);
                            });
                        }
                      }}
                    >
                      <Icon name="chevron-forward" size={24} color="#ffffff" />
                    </TouchableOpacity>
                  )}
                </View>

                {/* 운동 방법 설명 - 항상 표시, 번호가 있는 리스트 형식 */}
                <View style={styles.instructionBox}>
                  <Text style={styles.instructionTitle}>운동 방법</Text>
                  {instructionLoading ? (
                    <Text style={styles.instructionText}>불러오는 중...</Text>
                  ) : (
                    <View style={styles.instructionList}>
                      {instructionText ? (
                        instructionText.split('\n').filter(line => line.trim()).map((line, index) => {
                          // Step:1, Step:2 형식 또는 1., 2. 형식 확인
                          const stepMatch = line.match(/^Step:\s*(\d+)\s*(.+)$/i);
                          const numberedMatch = line.match(/^(\d+)\.\s*(.+)$/);
                          
                          if (stepMatch) {
                            return (
                              <View key={index} style={styles.instructionItem}>
                                <Text style={styles.instructionNumber}>Step: {stepMatch[1]}</Text>
                                <View style={styles.instructionContent}>
                                  <Text style={styles.instructionText}>{stepMatch[2]}</Text>
                                </View>
                              </View>
                            );
                          } else if (numberedMatch) {
                            return (
                              <View key={index} style={styles.instructionItem}>
                                <Text style={styles.instructionNumber}>{numberedMatch[1]}.</Text>
                                <View style={styles.instructionContent}>
                                  <Text style={styles.instructionText}>{numberedMatch[2]}</Text>
                                </View>
                              </View>
                            );
                          }
                          // 번호 없이 내용만 있는 경우
                          return (
                            <View key={index} style={styles.instructionItem}>
                              <View style={styles.instructionContent}>
                                <Text style={styles.instructionText}>{line}</Text>
                              </View>
                            </View>
                          );
                        })
                      ) : (
                        <Text style={styles.instructionText}>설명이 없습니다.</Text>
                      )}
                    </View>
                  )}
                </View>

                <View style={styles.setsContainer}>
                  {/* 세트 리스트 */}
                  <View style={styles.setsList}>
                    {sets.map((set) => (
                      <ExerciseSetItem
                        key={set.id}
                        order={set.order}
                        weight={set.weight}
                        reps={set.reps}
                        isCompleted={set.isCompleted}
                        onToggleComplete={() => handleSetComplete(set.id)}
                        onPressRemove={() => {
                          if (sets.length > 1) {
                            handleRemoveSet(set.id);
                          }
                        }}
                        onOrderChange={(order) =>
                          handleOrderChange(set.id, order)
                        }
                        onWeightChange={(weight) =>
                          handleSetChange(set.id, "weight", weight)
                        }
                        onRepsChange={(reps) =>
                          handleSetChange(set.id, "reps", reps)
                        }
                      />
                    ))}
                  </View>

                  {/* 모든 세트 완료 시 피드백 섹션 */}
                  {allSetsCompleted && (
                    <View style={styles.feedbackSection}>
                      <Text style={styles.feedbackTitle}>이 운동 어땠나요?</Text>
                      <View style={styles.feedbackButtonsRow}>
                        <TouchableOpacity style={styles.feedbackButton}>
                          <Text style={styles.feedbackButtonText}>버튼 1</Text>
                        </TouchableOpacity>
                        <TouchableOpacity style={styles.feedbackButton}>
                          <Text style={styles.feedbackButtonText}>버튼 2</Text>
                        </TouchableOpacity>
                        <TouchableOpacity style={styles.feedbackButton}>
                          <Text style={styles.feedbackButtonText}>버튼 3</Text>
                        </TouchableOpacity>
                        <TouchableOpacity style={styles.feedbackButton}>
                          <Text style={styles.feedbackButtonText}>버튼 4</Text>
                        </TouchableOpacity>
                      </View>
                    </View>
                  )}

                  {/* 세트 추가, 종목 추가 버튼 */}
                  <View style={styles.addButtonsRow}>
                    <TouchableOpacity
                      style={styles.addSetButton}
                      onPress={handleAddSet}
                    >
                      <Text style={styles.addSetButtonText}>세트 추가</Text>
                    </TouchableOpacity>
                    <TouchableOpacity
                      style={styles.addExerciseButton}
                      onPress={() => {
                        // 현재 운동을 리스트에 추가 또는 업데이트
                        const currentEx = selectedExercise || exerciseData;
                        if (currentEx) {
                          let newIndex = currentExerciseIndex;
                          if (currentExerciseIndex === -1 || currentExerciseIndex >= addedExercises.length) {
                            // 리스트에 없으면 추가
                            newIndex = addedExercises.length;
                            setAddedExercises((prev) => [
                              ...prev,
                              {
                                exercise: currentEx,
                                sets: [...sets],
                                comment: comment,
                                instructionText: instructionText,
                                instructionImageUrl: instructionImageUrl,
                              },
                            ]);
                          } else {
                            // 리스트에 있으면 업데이트
                            setAddedExercises((prev) => {
                              const updated = [...prev];
                              updated[currentExerciseIndex] = {
                                exercise: currentEx,
                                sets: [...sets],
                                comment: comment,
                                instructionText: instructionText,
                                instructionImageUrl: instructionImageUrl,
                              };
                              return updated;
                            });
                            newIndex = currentExerciseIndex;
                          }
                          setCurrentExerciseIndex(newIndex);
                        }
                        
                        // 먼저 상태를 변경하여 모달이 닫히지 않도록 함
                        const exerciseName = onSave ? getExerciseDisplayName(currentEx || { name: "운동" }) : "";
                        const meta = currentEx?.externalId
                          ? { 
                              externalId: currentEx.externalId, 
                              category: currentEx.category || currentEx.bodyPart || currentEx.targetMuscle 
                            }
                          : undefined;
                        const trimmedComment =
                          allSetsCompleted && comment.trim().length > 0
                            ? comment.trim()
                            : undefined;
                        
                        // 상태를 먼저 변경
                        setCurrentMode("add");
                        setSelectedExercise(null);
                        setSearchTerm("");
                        setSelectedCategory("전체");
                        setSets([
                          { id: 1, order: 1, weight: 20, reps: 15, isCompleted: false },
                          { id: 2, order: 2, weight: 20, reps: 12, isCompleted: false },
                          { id: 3, order: 3, weight: 20, reps: 12, isCompleted: false },
                        ]);
                        setComment("");
                        setInstructionText("");
                        setInstructionImageUrl("");
                        setShowInstructions(false);
                        
                        // 그 다음 저장 (keepModalOpen 옵션으로 모달을 닫지 않음)
                        if (onSave && currentEx) {
                          // 상태 변경 후 저장 (비동기로 처리하여 모달이 닫히지 않도록)
                          requestAnimationFrame(() => {
                            onSave(sets, exerciseName, meta, trimmedComment, { keepModalOpen: true });
                          });
                        }
                      }}
                    >
                      <Text style={styles.addExerciseButtonText}>종목 추가</Text>
                    </TouchableOpacity>
                  </View>
                </View>
                </ScrollView>
              </KeyboardAvoidingView>

              <View style={styles.footer}>
                <TouchableOpacity
                  style={styles.endWorkoutBtn}
                  onPress={handleSave}
                >
                  <Text style={styles.endWorkoutBtnText}>운동 끝내기</Text>
                </TouchableOpacity>
              </View>
            </View>
          )}
      </View>
    </SafeAreaView>
  ) : (
    <View style={styles.overlay}>
      <View style={styles.modalContent}>
          {currentMode === "add" ? (
            <KeyboardAvoidingView
              behavior={Platform.OS === "ios" ? "padding" : undefined}
              style={styles.keyboardAvoider}
            >
              <View style={styles.addExerciseModal}>
                {!fullScreen && (
                  <View style={styles.modalHeader}>
                    <View style={styles.headerLeft}>
                    </View>
                    <Text style={styles.modalTitle}>종목 추가</Text>
                    <View style={styles.headerRight}>
                      <TouchableOpacity onPress={onClose} style={styles.closeBtn}>
                        <Icon name="close" size={12} color="#ffffff" />
                      </TouchableOpacity>
                    </View>
                  </View>
                )}

              <View style={styles.searchContainer}>
                <View style={styles.searchBar}>
                  <Icon name="search" size={20} color="#666666" />
                  <TextInput
                    style={styles.searchInput}
                    placeholder="종목 이름을 검색하세요."
                    placeholderTextColor="#666666"
                    value={searchTerm}
                    onChangeText={setSearchTerm}
                  />
                </View>
              </View>

              <View style={styles.filterWrapper}>
                <ScrollView
                  horizontal
                  showsHorizontalScrollIndicator={false}
                  style={styles.filterContainer}
                  contentContainerStyle={styles.filterContent}
                  contentInset={{ left: 12, right: 12 }}
                  contentInsetAdjustmentBehavior="never"
                >
                  {categories.map((category) => (
                    <TouchableOpacity
                      key={category}
                      style={[
                        styles.filterBtn,
                        selectedCategory === category && styles.filterBtnActive,
                      ]}
                      onPress={() => setSelectedCategory(category)}
                    >
                      <Text
                        style={[
                          styles.filterBtnText,
                          selectedCategory === category &&
                            styles.filterBtnTextActive,
                        ]}
                      >
                        {category}
                      </Text>
                    </TouchableOpacity>
                  ))}
                </ScrollView>
              </View>

              <ScrollView
                style={styles.exerciseList}
                contentContainerStyle={styles.exerciseListContent}
                showsVerticalScrollIndicator={true}
                bounces={true}
                contentInsetAdjustmentBehavior="never"
                automaticallyAdjustContentInsets={false}
              >
                {loadingList && (
                  <View style={{ paddingVertical: 16 }}>
                    <Text style={{ color: "#aaa", textAlign: "center" }}>
                      불러오는 중...
                    </Text>
                  </View>
                )}
                {!loadingList && apiExercises.length === 0 && (
                  <View style={{ paddingVertical: 16 }}>
                    <Text style={{ color: "#888", textAlign: "center" }}>
                      운동이 없습니다
                    </Text>
                  </View>
                )}
                {!loadingList &&
                  apiExercises.map((ex: any, index: number) => (
                    <TouchableOpacity
                      key={ex.externalId || `${ex.name}-${index}`}
                      style={styles.exerciseItem}
                      onPress={() => handleExerciseSelect(ex)}
                    >
                      <View style={styles.exerciseIcon}>
                        {ex.imageUrl || ex.image || ex.imgUrl || ex.photoUrl ? (
                          <Image
                            source={{
                              uri:
                                ex.imageUrl ||
                                ex.image ||
                                ex.imgUrl ||
                                ex.photoUrl,
                            }}
                            style={styles.exerciseImage}
                            resizeMode="cover"
                          />
                        ) : (
                          <View style={styles.exerciseImagePlaceholder}>
                            <Icon name="barbell" size={16} color="#666666" />
                          </View>
                        )}
                      </View>
                      <View style={styles.exerciseInfo}>
                        <Text
                          style={styles.exerciseName}
                          numberOfLines={1}
                          ellipsizeMode="tail"
                          allowFontScaling={false}
                        >
                          {getExerciseDisplayName(ex)}
                        </Text>
                        <Text
                          style={styles.exerciseLastUsed}
                          numberOfLines={1}
                          ellipsizeMode="tail"
                          allowFontScaling={false}
                        >
                          {normalizeEncoding(
                            (ex.targetMuscle || ex.bodyPart || "").toString()
                          )}
                        </Text>
                      </View>
                    </TouchableOpacity>
                  ))}
              </ScrollView>
              </View>
            </KeyboardAvoidingView>
          ) : (
            <View style={styles.exerciseDetailModal}>
              {!fullScreen && (
                <View style={styles.modalHeader}>
                  <View style={styles.modalTitleContainer}>
                    <Text
                      style={styles.modalTitle}
                      numberOfLines={1}
                      ellipsizeMode="tail"
                    >
                      {getExerciseDisplayName(
                        selectedExercise || exerciseData || { name: "운동" }
                      )}
                    </Text>
                  </View>
                  <View style={styles.headerRightRow}>
                    <TouchableOpacity onPress={onClose} style={styles.closeBtn}>
                      <Icon name="close" size={12} color="#ffffff" />
                    </TouchableOpacity>
                  </View>
                </View>
              )}

              <KeyboardAvoidingView
                behavior={Platform.OS === "ios" ? "padding" : undefined}
                style={styles.detailKeyboardAvoider}
              >
                <ScrollView
                  style={styles.detailScroll}
                  contentContainerStyle={styles.detailScrollContent}
                  keyboardShouldPersistTaps="handled"
                >
                {/* 운동 이미지 - 항상 표시 */}
                <View style={styles.exerciseImageContainer}>
                  {instructionLoading ? (
                    <View style={styles.exerciseImagePlaceholderLarge}>
                      <Text style={styles.loadingText}>불러오는 중...</Text>
                    </View>
                  ) : instructionImageUrl || selectedExercise?.imageUrl || exerciseData?.imageUrl ? (
                    <Image
                      source={{ uri: instructionImageUrl || selectedExercise?.imageUrl || exerciseData?.imageUrl }}
                      style={styles.exerciseImageLarge}
                      resizeMode="contain"
                    />
                  ) : (
                    <View style={styles.exerciseImagePlaceholderLarge}>
                      <Icon name="barbell" size={48} color="#666666" />
                    </View>
                  )}
                </View>

                {/* 운동 방법 설명 - 항상 표시, 번호가 있는 리스트 형식 */}
                <View style={styles.instructionBox}>
                  <Text style={styles.instructionTitle}>운동 방법</Text>
                  {instructionLoading ? (
                    <Text style={styles.instructionText}>불러오는 중...</Text>
                  ) : (
                    <View style={styles.instructionList}>
                      {instructionText ? (
                        instructionText.split('\n').filter(line => line.trim()).map((line, index) => {
                          // Step:1, Step:2 형식 또는 1., 2. 형식 확인
                          const stepMatch = line.match(/^Step:\s*(\d+)\s*(.+)$/i);
                          const numberedMatch = line.match(/^(\d+)\.\s*(.+)$/);
                          
                          if (stepMatch) {
                            return (
                              <View key={index} style={styles.instructionItem}>
                                <Text style={styles.instructionNumber}>Step: {stepMatch[1]}</Text>
                                <View style={styles.instructionContent}>
                                  <Text style={styles.instructionText}>{stepMatch[2]}</Text>
                                </View>
                              </View>
                            );
                          } else if (numberedMatch) {
                            return (
                              <View key={index} style={styles.instructionItem}>
                                <Text style={styles.instructionNumber}>{numberedMatch[1]}.</Text>
                                <View style={styles.instructionContent}>
                                  <Text style={styles.instructionText}>{numberedMatch[2]}</Text>
                                </View>
                              </View>
                            );
                          }
                          // 번호 없이 내용만 있는 경우
                          return (
                            <View key={index} style={styles.instructionItem}>
                              <View style={styles.instructionContent}>
                                <Text style={styles.instructionText}>{line}</Text>
                              </View>
                            </View>
                          );
                        })
                      ) : (
                        <Text style={styles.instructionText}>설명이 없습니다.</Text>
                      )}
                    </View>
                  )}
                </View>

                <View style={styles.setsContainer}>
                  {/* 세트 리스트 */}
                  <View style={styles.setsList}>
                    {sets.map((set) => (
                      <ExerciseSetItem
                        key={set.id}
                        order={set.order}
                        weight={set.weight}
                        reps={set.reps}
                        isCompleted={set.isCompleted}
                        onToggleComplete={() => handleSetComplete(set.id)}
                        onPressRemove={() => {
                          if (sets.length > 1) {
                            handleRemoveSet(set.id);
                          }
                        }}
                        onOrderChange={(order) =>
                          handleOrderChange(set.id, order)
                        }
                        onWeightChange={(weight) =>
                          handleSetChange(set.id, "weight", weight)
                        }
                        onRepsChange={(reps) =>
                          handleSetChange(set.id, "reps", reps)
                        }
                      />
                    ))}
                  </View>

                  {/* 모든 세트 완료 시 피드백 섹션 */}
                  {allSetsCompleted && (
                    <View style={styles.feedbackSection}>
                      <Text style={styles.feedbackTitle}>이 운동 어땠나요?</Text>
                      <View style={styles.feedbackButtonsRow}>
                        <TouchableOpacity style={styles.feedbackButton}>
                          <Text style={styles.feedbackButtonText}>버튼 1</Text>
                        </TouchableOpacity>
                        <TouchableOpacity style={styles.feedbackButton}>
                          <Text style={styles.feedbackButtonText}>버튼 2</Text>
                        </TouchableOpacity>
                        <TouchableOpacity style={styles.feedbackButton}>
                          <Text style={styles.feedbackButtonText}>버튼 3</Text>
                        </TouchableOpacity>
                        <TouchableOpacity style={styles.feedbackButton}>
                          <Text style={styles.feedbackButtonText}>버튼 4</Text>
                        </TouchableOpacity>
                      </View>
                    </View>
                  )}

                  {/* 세트 추가, 종목 추가 버튼 */}
                  <View style={styles.addButtonsRow}>
                    <TouchableOpacity
                      style={styles.addSetButton}
                      onPress={handleAddSet}
                    >
                      <Text style={styles.addSetButtonText}>세트 추가</Text>
                    </TouchableOpacity>
                    <TouchableOpacity
                      style={styles.addExerciseButton}
                      onPress={() => {
                        // 현재 운동을 리스트에 추가 또는 업데이트
                        const currentEx = selectedExercise || exerciseData;
                        if (currentEx) {
                          let newIndex = currentExerciseIndex;
                          if (currentExerciseIndex === -1 || currentExerciseIndex >= addedExercises.length) {
                            // 리스트에 없으면 추가
                            newIndex = addedExercises.length;
                            setAddedExercises((prev) => [
                              ...prev,
                              {
                                exercise: currentEx,
                                sets: [...sets],
                                comment: comment,
                                instructionText: instructionText,
                                instructionImageUrl: instructionImageUrl,
                              },
                            ]);
                          } else {
                            // 리스트에 있으면 업데이트
                            setAddedExercises((prev) => {
                              const updated = [...prev];
                              updated[currentExerciseIndex] = {
                                exercise: currentEx,
                                sets: [...sets],
                                comment: comment,
                                instructionText: instructionText,
                                instructionImageUrl: instructionImageUrl,
                              };
                              return updated;
                            });
                            newIndex = currentExerciseIndex;
                          }
                          setCurrentExerciseIndex(newIndex);
                        }
                        
                        // 먼저 상태를 변경하여 모달이 닫히지 않도록 함
                        const exerciseName = onSave ? getExerciseDisplayName(currentEx || { name: "운동" }) : "";
                        const meta = currentEx?.externalId
                          ? { 
                              externalId: currentEx.externalId, 
                              category: currentEx.category || currentEx.bodyPart || currentEx.targetMuscle 
                            }
                          : undefined;
                        const trimmedComment =
                          allSetsCompleted && comment.trim().length > 0
                            ? comment.trim()
                            : undefined;
                        
                        // 상태를 먼저 변경
                        setCurrentMode("add");
                        setSelectedExercise(null);
                        setSearchTerm("");
                        setSelectedCategory("전체");
                        setSets([
                          { id: 1, order: 1, weight: 20, reps: 15, isCompleted: false },
                          { id: 2, order: 2, weight: 20, reps: 12, isCompleted: false },
                          { id: 3, order: 3, weight: 20, reps: 12, isCompleted: false },
                        ]);
                        setComment("");
                        setInstructionText("");
                        setInstructionImageUrl("");
                        setShowInstructions(false);
                        
                        // 그 다음 저장 (keepModalOpen 옵션으로 모달을 닫지 않음)
                        if (onSave && currentEx) {
                          // 상태 변경 후 저장 (비동기로 처리하여 모달이 닫히지 않도록)
                          requestAnimationFrame(() => {
                            onSave(sets, exerciseName, meta, trimmedComment, { keepModalOpen: true });
                          });
                        }
                      }}
                    >
                      <Text style={styles.addExerciseButtonText}>종목 추가</Text>
                    </TouchableOpacity>
                  </View>
                </View>
                </ScrollView>
              </KeyboardAvoidingView>

              <View style={styles.footer}>
                <TouchableOpacity
                  style={styles.endWorkoutBtn}
                  onPress={handleSave}
                >
                  <Text style={styles.endWorkoutBtnText}>운동 끝내기</Text>
                </TouchableOpacity>
              </View>
            </View>
          )}
        </View>
      </View>
  );

  if (!isOpen && !renderContentOnly) {
    return null;
  }

  // renderContentOnly가 true이면 Modal 없이 내용만 렌더링
  if (renderContentOnly) {
    return content;
  }

  return (
    <Modal
      visible={isOpen}
      animationType={fullScreen ? "none" : "slide"}
      transparent={!fullScreen}
      presentationStyle={fullScreen ? "fullScreen" : undefined}
      onRequestClose={onClose}
    >
      {content}
    </Modal>
  );
};

const styles = StyleSheet.create({
  keyboardAvoider: {
    flex: 1,
  },
  overlay: {
    flex: 1,
    backgroundColor: "rgba(0, 0, 0, 0.7)",
    justifyContent: "flex-end",
  },
  modalContent: {
    backgroundColor: "#2a2a2a",
    borderTopLeftRadius: 20,
    borderTopRightRadius: 20,
    height: "70%", // 고정 비율 높이 상향
    minHeight: 0,
    overflow: "hidden",
  },
  fullScreenContainer: {
    flex: 1,
    backgroundColor: "#0c0c0c",
  },
  fullScreenContent: {
    flex: 1,
    backgroundColor: "#0c0c0c",
  },
  fullScreenHeader: {
    paddingTop: 50,
    paddingHorizontal: 20,
    paddingBottom: 20,
    backgroundColor: "#0c0c0c",
  },
  backBtnTop: {
    width: 40,
    height: 40,
    justifyContent: "center",
    alignItems: "flex-start",
    marginBottom: 16,
  },
  fullScreenTitle: {
    fontSize: 18,
    fontWeight: "600",
    color: "#ffffff",
    textAlign: "center",
  },
  whiteCard: {
    flex: 1,
    backgroundColor: "#ffffff",
    borderTopLeftRadius: 24,
    borderTopRightRadius: 24,
    paddingTop: 20,
    marginTop: 0,
    minHeight: 0,
  },
  addExerciseModal: {
    flex: 1,
    minHeight: 0,
  },
  exerciseDetailModal: {
    flex: 1,
    maxHeight: "100%",
  },
  detailKeyboardAvoider: {
    flex: 1,
  },
  modalHeader: {
    flexDirection: "row",
    justifyContent: "space-between",
    alignItems: "center",
    padding: 20,
    borderBottomWidth: 1,
    borderBottomColor: "#404040",
  },
  headerLeft: {
    width: 52,
    alignItems: "flex-start",
  },
  headerRight: {
    width: 52,
    alignItems: "flex-end",
  },
  headerRightRow: {
    flexDirection: "row",
    alignItems: "center",
    gap: 8,
  },
  modalTitle: {
    fontSize: 18,
    fontWeight: "600",
    color: "#ffffff",
    flex: 1,
    textAlign: "center",
  },
  modalTitleContainer: {
    flex: 1,
    minWidth: 0,
    paddingRight: 8,
  },
  backBtn: {
    width: 40,
    height: 40,
    justifyContent: "center",
    alignItems: "center",
    marginRight: 12,
  },
  closeBtn: {
    width: 24,
    height: 24,
    justifyContent: "center",
    alignItems: "center",
  },
  methodBtn: {
    paddingHorizontal: 10,
    paddingVertical: 6,
    backgroundColor: "#404040",
    borderRadius: 6,
  },
  methodBtnText: {
    color: "#e3ff7c",
    fontSize: 12,
    fontWeight: "600",
  },
  instructionBox: {
    marginHorizontal: 20,
    marginTop: 0,
    marginBottom: 24,
    backgroundColor: "#333333",
    borderRadius: 10,
    padding: 16,
  },
  instructionTitle: {
    fontSize: 13,
    color: "#ffffff",
    fontWeight: "600",
    marginBottom: 0,
  },
  instructionText: {
    fontSize: 12,
    color: "#cccccc",
    lineHeight: 17,
  },
  instructionList: {
    marginTop: 12,
  },
  instructionItem: {
    flexDirection: "row",
    marginBottom: 16,
  },
  instructionNumber: {
    fontSize: 12,
    color: "#ffffff",
    fontWeight: "600",
    marginRight: 8,
    minWidth: 20,
  },
  instructionContent: {
    flex: 1,
  },
  exerciseImageContainer: {
    position: "relative",
    width: "100%",
    height: 300,
    marginTop: 0,
    marginBottom: 24,
    backgroundColor: "#1a1a1a",
    justifyContent: "center",
    alignItems: "center",
  },
  exerciseImageLarge: {
    width: "100%",
    height: "100%",
  },
  exerciseImagePlaceholderLarge: {
    width: "100%",
    height: "100%",
    justifyContent: "center",
    alignItems: "center",
  },
  exerciseImageNavLeft: {
    position: "absolute",
    left: 12,
    top: "50%",
    marginTop: -16,
    width: 32,
    height: 32,
    borderRadius: 16,
    backgroundColor: "rgba(0, 0, 0, 0.5)",
    justifyContent: "center",
    alignItems: "center",
  },
  exerciseImageNavRight: {
    position: "absolute",
    right: 12,
    top: "50%",
    marginTop: -16,
    width: 32,
    height: 32,
    borderRadius: 16,
    backgroundColor: "rgba(0, 0, 0, 0.5)",
    justifyContent: "center",
    alignItems: "center",
  },
  loadingText: {
    color: "#666666",
    fontSize: 14,
  },
  addButtonsRow: {
    flexDirection: "row",
    gap: 12,
    marginTop: 24,
    marginHorizontal: 20,
    marginBottom: 0,
  },
  addSetButton: {
    flex: 1,
    backgroundColor: "#ffffff",
    borderWidth: 1,
    borderColor: "#000000",
    borderRadius: 8,
    paddingVertical: 12,
    alignItems: "center",
    justifyContent: "center",
  },
  addSetButtonText: {
    color: "#000000",
    fontSize: 14,
    fontWeight: "600",
  },
  addExerciseButton: {
    flex: 1,
    backgroundColor: "#ffffff",
    borderWidth: 1,
    borderColor: "#000000",
    borderRadius: 8,
    paddingVertical: 12,
    alignItems: "center",
    justifyContent: "center",
  },
  addExerciseButtonText: {
    color: "#000000",
    fontSize: 14,
    fontWeight: "600",
  },
  feedbackSection: {
    marginTop: 24,
    marginHorizontal: 20,
    marginBottom: 24,
  },
  feedbackTitle: {
    fontSize: 18,
    fontWeight: "600",
    color: "#ffffff",
    marginBottom: 16,
    textAlign: "center",
  },
  feedbackButtonsRow: {
    flexDirection: "row",
    flexWrap: "wrap",
    justifyContent: "space-between",
  },
  feedbackButton: {
    width: "48%",
    backgroundColor: "#ffffff",
    borderWidth: 1,
    borderColor: "#000000",
    borderRadius: 8,
    paddingVertical: 14,
    alignItems: "center",
    justifyContent: "center",
    marginBottom: 12,
  },
  feedbackButtonText: {
    color: "#000000",
    fontSize: 14,
    fontWeight: "500",
  },
  endWorkoutBtn: {
    backgroundColor: "#404040",
    paddingVertical: 16,
    borderRadius: 12,
    alignItems: "center",
  },
  endWorkoutBtnText: {
    color: "#ffffff",
    fontSize: 16,
    fontWeight: "600",
  },
  instructionScroll: {
    maxHeight: 260,
  },
  detailScroll: {
    flex: 1,
  },
  detailScrollContent: {
    paddingBottom: 24,
    flexGrow: 1,
  },
  searchContainer: {
    padding: 20,
    paddingBottom: 12,
  },
  searchContainerFullScreen: {
    paddingHorizontal: 15,
  },
  filterWrapper: {
    height: 28,
    marginTop: 8,
    marginBottom: 10,
    paddingTop: 0,
    paddingBottom: 0,
  },
  searchBar: {
    flexDirection: "row",
    alignItems: "center",
    backgroundColor: "#404040",
    borderRadius: 8,
    paddingHorizontal: 16,
    paddingVertical: 12,
    gap: 8,
  },
  searchBarLight: {
    backgroundColor: "#f5f5f5",
  },
  searchInput: {
    flex: 1,
    color: "#ffffff",
    fontSize: 14,
  },
  searchInputLight: {
    color: "#000000",
  },
  filterContainer: {
    paddingLeft: 0,
    paddingRight: 0,
    paddingBottom: 0,
    paddingTop: 0,
    marginBottom: 0,
    marginTop: 0,
    height: 28,
    overflow: "visible",
  },
  filterContent: {
    paddingVertical: 0,
    paddingLeft: 48,
    paddingRight: 48,
    alignItems: "flex-start",
    height: 28,
    justifyContent: "center",
  },
  filterBtn: {
    paddingHorizontal: 16,
    paddingVertical: 2,
    borderRadius: 20,
    backgroundColor: "#2a2a2a",
    borderWidth: 1,
    borderColor: "#404040",
    marginRight: 8,
    height: 28,
    justifyContent: "center",
    alignItems: "center",
  },
  filterBtnActive: {
    backgroundColor: "#404040",
    borderColor: "#666666",
  },
  filterBtnLight: {
    backgroundColor: "#ffffff",
    borderColor: "#000000",
  },
  filterBtnActiveLight: {
    backgroundColor: "#e0e0e0",
    borderColor: "#000000",
  },
  filterBtnText: {
    color: "#ffffff",
    fontSize: 12,
  },
  filterBtnTextActive: {
    color: "#ffffff",
  },
  filterBtnTextLight: {
    color: "#000000",
  },
  filterBtnTextActiveLight: {
    color: "#000000",
  },
  exerciseList: {
    flex: 1,
    paddingHorizontal: 20,
    paddingTop: 0,
    paddingBottom: 20,
    minHeight: 0,
    marginTop: 0,
    marginBottom: 0,
    overflow: "hidden",
  },
  exerciseListContent: {
    paddingTop: 0,
    flexGrow: 1,
  },
  exerciseItem: {
    flexDirection: "row",
    alignItems: "center",
    paddingVertical: 12,
    borderBottomWidth: 1,
    borderBottomColor: "#666666",
  },
  exerciseIcon: {
    width: 48,
    height: 48,
    justifyContent: "center",
    alignItems: "center",
    marginRight: 12,
    borderRadius: 8,
    overflow: "hidden",
    backgroundColor: "#2a2a2a",
  },
  exerciseImage: {
    width: "100%",
    height: "100%",
  },
  exerciseImagePlaceholder: {
    width: "100%",
    height: "100%",
    justifyContent: "center",
    alignItems: "center",
    backgroundColor: "#2a2a2a",
  },
  exerciseInfo: {
    flex: 1,
    marginLeft: 14,
    minWidth: 0,
  },
  exerciseName: {
    fontSize: 14,
    lineHeight: 18,
    fontWeight: "500",
    color: "#ffffff",
    marginBottom: 4,
  },
  exerciseNameLight: {
    color: "#000000",
  },
  exerciseLastUsed: {
    fontSize: 12,
    lineHeight: 16,
    color: "#666666",
  },
  exerciseLastUsedLight: {
    color: "#666666",
  },
  setsContainer: {
    paddingHorizontal: 20,
    paddingTop: 0,
    paddingBottom: 0,
    flex: 1,
    minHeight: 0,
  },
  setsHeader: {
    flexDirection: "row",
    alignItems: "center",
    justifyContent: "space-between",
    marginTop: 0,
    paddingTop: 0,
    paddingBottom: 16,
    borderBottomWidth: 1,
    borderBottomColor: "#666666",
    marginBottom: 0,
    paddingHorizontal: 20,
  },
  setsHeaderLeft: {
    flexDirection: "row",
    alignItems: "center",
    gap: 12,
  },
  setsHeaderRightText: {
    fontSize: 12,
    color: "#666666",
    textAlign: "center",
  },
  setsList: {
    marginTop: 0,
    paddingTop: 0,
    paddingBottom: 12,
  },
  setControlBtn: {
    width: 32,
    height: 32,
    borderRadius: 16,
    backgroundColor: "#404040",
    justifyContent: "center",
    alignItems: "center",
  },
  setControlText: {
    fontSize: 16,
    fontWeight: "600",
    color: "#ffffff",
  },
  setsHeaderText: {
    fontSize: 12,
    color: "#666666",
    textAlign: "center",
  },
  setRow: {
    flexDirection: "row",
    alignItems: "center",
    paddingVertical: 16,
    paddingHorizontal: 0,
    borderBottomWidth: 1,
    borderBottomColor: "#666666",
    gap: 12,
    backgroundColor: "#e5e5e5",
    position: "relative",
  },
  setRowCompleted: {
    backgroundColor: "#e3ff7c",
  },
  setNumber: {
    width: 50,
    fontSize: 14,
    color: "#000000",
    textAlign: "left",
  },
  setNumberCompleted: {
    color: "#000000",
  },
  weightInput: {
    flex: 1,
    flexDirection: "row",
    alignItems: "center",
    backgroundColor: "#ffffff",
    borderRadius: 6,
    paddingHorizontal: 12,
    paddingVertical: 8,
  },
  inputCompleted: {
    backgroundColor: "#ffffff",
  },
  weightInputCompleted: {
    backgroundColor: "#ffffff",
  },
  weightInputText: {
    flex: 1,
    color: "#000000",
    fontSize: 14,
    textAlign: "right",
    minWidth: 60,
  },
  weightInputTextCompleted: {
    color: "#000000",
  },
  inputTextCompleted: {
    color: "#000000",
  },
  repsInputCompleted: {
    backgroundColor: "#ffffff",
  },
  repsInputTextCompleted: {
    color: "#000000",
  },
  unitTextCompleted: {
    color: "#000000",
  },
  unitText: {
    fontSize: 12,
    color: "#000000",
    marginLeft: 4,
  },
  repsDisplay: {
    flex: 1,
    fontSize: 14,
    color: "#ffffff",
    textAlign: "center",
  },
  repsInput: {
    flex: 1,
    flexDirection: "row",
    alignItems: "center",
    backgroundColor: "#ffffff",
    borderRadius: 6,
    paddingHorizontal: 12,
    paddingVertical: 8,
  },
  repsInputText: {
    flex: 1,
    color: "#000000",
    fontSize: 14,
    textAlign: "right",
    minWidth: 40,
  },
  completeBtn: {
    width: 32,
    height: 32,
    borderRadius: 8,
    backgroundColor: "#ffffff",
    borderWidth: 1,
    borderColor: "#e0e0e0",
    justifyContent: "center",
    alignItems: "center",
  },
  completeBtnCompleted: {
    backgroundColor: "#ffffff",
    borderColor: "#000000",
  },
  removeSetBtn: {
    position: "absolute",
    top: 8,
    right: 8,
    width: 24,
    height: 24,
    borderRadius: 12,
    backgroundColor: "#cccccc",
    justifyContent: "center",
    alignItems: "center",
  },
  footer: {
    paddingHorizontal: 20,
    paddingBottom: 40,
    paddingTop: 20,
    backgroundColor: "#2a2a2a",
  },
  footerExtended: {
    flexDirection: "column",
    gap: 12,
  },
  saveExerciseBtn: {
    backgroundColor: "#e3ff7c",
    paddingVertical: 16,
    borderRadius: 12,
    alignItems: "center",
  },
  saveExerciseBtnSmall: {
    paddingVertical: 12,
  },
  saveExerciseBtnText: {
    color: "#000000",
    fontSize: 16,
    fontWeight: "600",
  },
  commentSection: {
    marginHorizontal: 12,
    marginTop: 24,
    marginBottom: 48,
    gap: 16,
  },
  commentLabel: {
    fontSize: 14,
    fontWeight: "600",
    color: "#ffffff",
  },
  commentInputWrapper: {
    backgroundColor: "#1f1f1f",
    borderRadius: 12,
    padding: 16,
    gap: 8,
  },
  commentInput: {
    minHeight: 60,
    color: "#ffffff",
    fontSize: 14,
    lineHeight: 20,
  },
  commentCounter: {
    fontSize: 12,
    color: "#888888",
    textAlign: "right",
  },
  commentSendButton: {
    backgroundColor: "#e3ff7c",
    paddingVertical: 12,
    borderRadius: 12,
    alignItems: "center",
  },
  commentSendButtonDisabled: {
    backgroundColor: "#5f5f5f",
  },
  commentSendText: {
    fontSize: 14,
    fontWeight: "700",
    color: "#1c1c1c",
  },
});

export default ExerciseModal;
