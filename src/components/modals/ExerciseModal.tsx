import React, { useState, useEffect, useMemo, useRef, useCallback } from "react";
import {
  View,
  Text,
  Modal,
  TouchableOpacity,
  TouchableWithoutFeedback,
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
  toggleWorkoutSession,
} from "../../utils/exerciseApi";
import ExerciseSetItem from "../ExerciseSetItem";

interface Set {
  id: number;
  order: number;
  weight: number;
  reps: number;
  isCompleted: boolean;
}

const createInitialSets = (): Set[] => [
  { id: Date.now(), order: 1, weight: 20, reps: 15, isCompleted: false },
  { id: Date.now() + 1, order: 2, weight: 20, reps: 12, isCompleted: false },
  { id: Date.now() + 2, order: 3, weight: 20, reps: 12, isCompleted: false },
];

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
  ) => Promise<string | undefined> | void; // sessionId 반환 가능
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
  const [sets, setSets] = useState<Set[]>(createInitialSets());
  const [showInstructions, setShowInstructions] = useState<boolean>(false);
  const [instructionLoading, setInstructionLoading] = useState<boolean>(false);
  const [instructionText, setInstructionText] = useState<string>("");
  const [instructionImageUrl, setInstructionImageUrl] = useState<string>("");
  const [comment, setComment] = useState<string>("");
  const [userName, setUserName] = useState<string>("Member");
  // 기록 모드: "sets" (세트) 또는 "time" (시간)
  const [recordMode, setRecordMode] = useState<"sets" | "time">("sets");
  // 시간 모드일 때의 시간 (분)
  const [duration, setDuration] = useState<number>(30);
  // 시간 모드일 때 완료 여부
  const [isTimeCompleted, setIsTimeCompleted] = useState<boolean>(false);
  // 추가한 모든 운동 리스트 관리
  const [addedExercises, setAddedExercises] = useState<Array<{
    exercise: any;
    sets: Set[];
    comment: string;
    instructionText: string;
    instructionImageUrl: string;
    sessionId?: string; // 서버에서 받은 세션 ID
  }>>([]);
  // 현재 보고 있는 운동의 인덱스 (-1이면 새로 선택한 운동, 0 이상이면 추가한 운동 중 하나)
  const [currentExerciseIndex, setCurrentExerciseIndex] = useState<number>(-1);
  const [isMultiSelectMode, setIsMultiSelectMode] = useState(false);
  const [selectedSearchExercises, setSelectedSearchExercises] = useState<
    Record<string, any>
  >({});
  const [showExerciseListModal, setShowExerciseListModal] = useState(false);
  const [workoutTimerSeconds, setWorkoutTimerSeconds] = useState(0);
  const [isWorkoutTimerRunning, setIsWorkoutTimerRunning] = useState(false);
  const workoutTimerRef = useRef<ReturnType<typeof setInterval> | null>(null);
  const prefetchedInstructionUrlsRef = useRef<Set<string>>(new Set());
  const allSetsCompleted = useMemo(
    () => recordMode === "time" ? isTimeCompleted : (sets.length > 0 && sets.every((set) => set.isCompleted)),
    [sets, recordMode, isTimeCompleted]
  );

  const startWorkoutTimer = useCallback(() => {
    if (workoutTimerRef.current || !isOpen) return;
    setIsWorkoutTimerRunning(true);
    workoutTimerRef.current = setInterval(() => {
      setWorkoutTimerSeconds((prev) => prev + 1);
    }, 1000);
  }, [isOpen]);

  const stopWorkoutTimer = useCallback(
    (reset = false) => {
      if (workoutTimerRef.current) {
        clearInterval(workoutTimerRef.current);
        workoutTimerRef.current = null;
      }
      setIsWorkoutTimerRunning(false);
      if (reset) {
        setWorkoutTimerSeconds(0);
      }
    },
    []
  );

  const formatWorkoutTimer = useCallback((seconds: number) => {
    const mins = Math.floor(seconds / 60);
    const secs = seconds % 60;
    return `${String(mins).padStart(2, "0")}:${String(secs).padStart(2, "0")}`;
  }, []);

  const toggleWorkoutTimer = useCallback(() => {
    if (isWorkoutTimerRunning) {
      stopWorkoutTimer();
    } else {
      startWorkoutTimer();
    }
  }, [isWorkoutTimerRunning, startWorkoutTimer, stopWorkoutTimer]);

  const prefetchInstructionImage = useCallback((url?: string) => {
    if (!url) return;
    if (prefetchedInstructionUrlsRef.current.has(url)) return;
    prefetchedInstructionUrlsRef.current.add(url);
    Image.prefetch(url).catch(() => {
      prefetchedInstructionUrlsRef.current.delete(url);
    });
  }, []);

  useEffect(() => {
    const url =
      instructionImageUrl ||
      selectedExercise?.imageUrl ||
      exerciseData?.imageUrl;
    prefetchInstructionImage(url);
  }, [instructionImageUrl, selectedExercise, exerciseData, prefetchInstructionImage]);

  useEffect(() => {
    if (isOpen && currentMode === "detail") {
      startWorkoutTimer();
    }
  }, [isOpen, currentMode, startWorkoutTimer]);

  useEffect(() => {
    if (!isOpen) {
      stopWorkoutTimer(true);
      setShowExerciseListModal(false);
    }
  }, [isOpen, stopWorkoutTimer]);

  useEffect(() => {
    return () => {
      stopWorkoutTimer(true);
    };
  }, [stopWorkoutTimer]);

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
        setSets(createInitialSets());
        setComment("");
        setAddedExercises([]);
        setCurrentExerciseIndex(-1);
        setInstructionText("");
        setInstructionImageUrl("");
        setShowInstructions(false);
        setIsTimeCompleted(false);
        setRecordMode("sets");
      } else if (mode === "edit") {
        setCurrentMode("detail");
        setSelectedExercise(exerciseData);
        setAddedExercises([]);
        setCurrentExerciseIndex(-1);
        if (exerciseData?.sets && exerciseData.sets.length > 0) {
          const convertedSets: Set[] = exerciseData.sets.map((set: any, index: number) => ({
            id: set.id || index + 1,
            order: set.order !== undefined ? set.order : index + 1,
            weight: set.weight || 0,
            reps: set.reps || 0,
            isCompleted: set.isCompleted !== undefined ? set.isCompleted : (set.completed || false),
          }));
          setSets(convertedSets);
        } else {
          setSets(createInitialSets());
        }
        setComment(exerciseData?.comment || "");
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
              if (typeof desc === "string") {
                setInstructionText(desc);
                setShowInstructions(true);
              }
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
      setCurrentMode("add");
      setSelectedExercise(null);
      setSearchTerm("");
      setSelectedCategory("전체");
      setComment("");
      setInstructionText("");
      setInstructionImageUrl("");
      setShowInstructions(false);
      setAddedExercises([]);
      setCurrentExerciseIndex(-1);
      setSets(createInitialSets());
      setIsTimeCompleted(false);
      setRecordMode("sets");
    }
  }, [isOpen, mode, exerciseData, getExerciseDisplayName]);

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

  const multiSelectCount = useMemo(
    () => Object.keys(selectedSearchExercises).length,
    [selectedSearchExercises]
  );
  const canUseMultiSelect = currentMode === "add";

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
const getExerciseDisplayName = React.useCallback(
  (ex: any) => {
    const raw =
      ex?.koreanName ||
      ex?.korName ||
      ex?.nameKo ||
      ex?.koName ||
      ex?.name ||
      "";
    return normalizeEncoding(raw);
  },
  []
);

  const getExerciseKey = (ex: any) =>
    ex?.externalId ||
    ex?.id ||
    ex?.exerciseId ||
    ex?.code ||
    ex?.uuid ||
    getExerciseDisplayName(ex) ||
    String(ex);

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

  useEffect(() => {
    if (!isOpen) {
      setIsMultiSelectMode(false);
      setSelectedSearchExercises({});
    }
  }, [isOpen]);

  useEffect(() => {
    setSelectedSearchExercises({});
  }, [searchTerm, selectedCategory]);

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

  const syncCurrentExerciseSets = useCallback(
    (nextSets: Set[]) => {
      setAddedExercises((prev) => {
        if (currentExerciseIndex < 0 || currentExerciseIndex >= prev.length) {
          return prev;
        }
        const updated = [...prev];
        updated[currentExerciseIndex] = {
          ...updated[currentExerciseIndex],
          sets: nextSets.map((set) => ({ ...set })),
        };
        return updated;
      });
    },
    [currentExerciseIndex]
  );

  const handleSetChange = (setId: number, field: string, value: number) => {
    const nextSets = sets.map((set) =>
      set.id === setId ? { ...set, [field]: value } : set
    );
    setSets(nextSets);
    syncCurrentExerciseSets(nextSets);
  };

  const handleOrderChange = (setId: number, newOrder: number) => {
    if (newOrder < 1) return;
    const nextSets = sets.map((set) =>
      set.id === setId ? { ...set, order: newOrder } : set
    );
    setSets(nextSets);
    syncCurrentExerciseSets(nextSets);
  };

  const handleSetComplete = async (setId: number) => {
    // 로컬 state 먼저 업데이트
    const newSets = sets.map((set) =>
      set.id === setId ? { ...set, isCompleted: !set.isCompleted } : set
    );
    setSets(newSets);
    syncCurrentExerciseSets(newSets);

    // 현재 운동의 sessionId 찾기
    const currentEx = selectedExercise || exerciseData;
    if (currentEx && currentExerciseIndex >= 0) {
      // 추가된 운동 목록에 있는 경우
      const exercise = addedExercises[currentExerciseIndex];
      if (exercise?.sessionId) {
        try {
          console.log('[EXERCISE][TOGGLE] 세션 토글 시작:', exercise.sessionId);
          await toggleWorkoutSession(exercise.sessionId);
          console.log('[EXERCISE][TOGGLE] 세션 토글 성공');
        } catch (error) {
          console.error('[EXERCISE][TOGGLE] 세션 토글 실패:', error);
          // 실패 시 로컬 state 롤백
          setSets(sets);
        }
      }
    } else if (currentEx) {
      // 새로 선택한 운동인 경우, 아직 저장되지 않았을 수 있음
      // 로컬 state만 업데이트 (이미 위에서 업데이트됨)
    }
  };

  const persistCurrentExerciseState = React.useCallback(() => {
    if (
      currentExerciseIndex < 0 ||
      currentExerciseIndex >= addedExercises.length
    ) {
      return;
    }
    setAddedExercises((prev) => {
      if (
        currentExerciseIndex < 0 ||
        currentExerciseIndex >= prev.length
      ) {
        return prev;
      }
      const updated = [...prev];
      updated[currentExerciseIndex] = {
        ...updated[currentExerciseIndex],
        sets: sets.map((set) => ({ ...set })),
        comment: comment ?? "",
        instructionText,
        instructionImageUrl,
      };
      return updated;
    });
  }, [
    currentExerciseIndex,
    addedExercises.length,
    sets,
    comment,
    instructionText,
    instructionImageUrl,
  ]);

  const handleAddSet = () => {
    const lastSet = sets[sets.length - 1];
    const newOrder = sets.length > 0 ? lastSet.order + 1 : 1;
    const newSet: Set = {
      id: Date.now(),
      order: newOrder,
      weight: lastSet?.weight || 20,
      reps: lastSet?.reps || 12,
      isCompleted: false,
    };
    const nextSets = [...sets, newSet];
    setSets(nextSets);
    syncCurrentExerciseSets(nextSets);
  };

  const handleRemoveSet = (setId: number) => {
    if (sets.length > 1) {
      const filtered = sets
        .filter((set) => set.id !== setId)
        .map((set, index) => ({
          ...set,
          order: index + 1,
        }));
      setSets(filtered);
      syncCurrentExerciseSets(filtered);
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
            sets: createInitialSets(),
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
            sets: createInitialSets(),
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
          sets: createInitialSets(),
          comment: "",
          instructionText: "",
          instructionImageUrl: "",
        },
      ]);
      // 새로 선택한 운동의 인덱스는 리스트의 마지막 인덱스
      newIndex = prevLength;
    }
    
    const existingEntry =
      newIndex >= 0 && newIndex < addedExercises.length
        ? addedExercises[newIndex]
        : null;

    setSelectedExercise(exercise);
    setCurrentMode("detail");
    setCurrentExerciseIndex(newIndex);
    setSets(
      existingEntry?.sets
        ? existingEntry.sets.map((set) => ({ ...set }))
        : createInitialSets()
    );
    setComment(existingEntry?.comment || "");
    setInstructionText(existingEntry?.instructionText || "");
    setInstructionImageUrl(existingEntry?.instructionImageUrl || "");
    setShowInstructions(!!existingEntry?.instructionText);
    setIsTimeCompleted(false);
    setRecordMode("sets");
    if (exercise?.externalId && !existingEntry?.instructionText) {
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

  const handleToggleMultiSelectMode = () => {
    if (currentMode !== "add") {
      return;
    }
    setIsMultiSelectMode((prev) => {
      const next = !prev;
      if (!next) {
        setSelectedSearchExercises({});
      }
      return next;
    });
  };

  const handleMultiSelectPick = (exercise: any) => {
    const key = getExerciseKey(exercise);
    if (!key) return;
    setSelectedSearchExercises((prev) => {
      const next = { ...prev };
      if (next[key]) {
        delete next[key];
      } else {
        next[key] = exercise;
      }
      return next;
    });
  };

  const handleStartSelectedExercises = () => {
    if (!canUseMultiSelect) return;
    const selections = Object.values(selectedSearchExercises);
    if (selections.length === 0) {
      return;
    }
    setIsMultiSelectMode(false);
    setSelectedSearchExercises({});
    const entries = selections.map((exercise) => ({
      exercise,
      sets: createInitialSets(),
      comment: "",
      instructionText: "",
      instructionImageUrl: "",
    }));

    const prevLength = addedExercises.length;
    setAddedExercises((prev) => [...prev, ...entries]);

    const firstEntry = entries[0];
    setSelectedExercise(firstEntry.exercise);
    setCurrentMode("detail");
    setCurrentExerciseIndex(prevLength);
    setSets(firstEntry.sets);
    setComment(firstEntry.comment || "");
    setIsTimeCompleted(false);
    setRecordMode("sets");
    setInstructionText(firstEntry.instructionText || "");
    setInstructionImageUrl(firstEntry.instructionImageUrl || "");
    setShowInstructions(!!firstEntry.instructionText);

    if (firstEntry.exercise?.externalId) {
      setInstructionLoading(true);
      fetchExerciseDetail(firstEntry.exercise.externalId)
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
  };

  // (임시 테스트 버튼 제거됨)

  const handleSave = () => {
    // detail 모드에서만 저장 가능 (운동이 선택된 상태)
    if (currentMode !== "detail") {
      return;
    }
    persistCurrentExerciseState();

    const snapshotExercises = addedExercises.map((item, idx) => {
      if (
        idx === currentExerciseIndex &&
        (selectedExercise || exerciseData) &&
        currentMode === "detail"
      ) {
        return {
          ...item,
          exercise: selectedExercise || exerciseData,
          sets: sets.map((set) => ({ ...set })),
          comment: comment ?? "",
          instructionText,
          instructionImageUrl,
        };
      }
      return item;
    });

    // 완료된 운동 목록 수집
    const exercisesToSave: Array<{
      exercise: any;
      sets: Set[];
      name: string;
      targetMuscle?: string;
    }> = [];

    // snapshotExercises의 모든 운동 추가
    snapshotExercises.forEach((item) => {
      const exerciseName = getExerciseDisplayName(item.exercise);
      const displayName = exerciseName;
      exercisesToSave.push({
        exercise: item.exercise,
        sets: item.sets,
        name: displayName,
        targetMuscle: item.exercise?.targetMuscle || item.exercise?.bodyPart,
      });
      
      // 각 운동을 저장
      if (onSave) {
        const meta = {
          externalId: item.exercise?.externalId,
          category:
            item.exercise?.category ||
            item.exercise?.bodyPart ||
            item.exercise?.targetMuscle ||
            "",
          imageUrl:
            item.exercise?.imageUrl ||
            item.exercise?.image ||
            item.exercise?.imgUrl ||
            item.exercise?.photoUrl ||
            undefined,
        };
        const trimmedComment =
          item.sets.every((s) => s.isCompleted) && item.comment?.trim().length > 0
            ? item.comment.trim()
            : undefined;
        const saveResult = onSave(item.sets, displayName, meta, trimmedComment);
        // sessionId 저장 (Promise인 경우 await)
        if (saveResult instanceof Promise) {
          saveResult.then((sessionId) => {
            if (sessionId) {
              setAddedExercises((prev) =>
                prev.map((ex, idx) =>
                  idx === addedExercises.indexOf(item)
                    ? { ...ex, sessionId }
                    : ex
                )
              );
            }
          }).catch((error) => {
            console.error('[EXERCISE][SAVE] 세션 ID 저장 실패:', error);
          });
        }
      }
    });
    
    // 현재 운동이 리스트에 없으면 추가
    const currentEx = selectedExercise || exerciseData;
    if (currentEx) {
      const currentName = getExerciseDisplayName(currentEx);
      const currentDisplayName = currentName;
      const isAlreadyInList = exercisesToSave.some(
        (ex) => getExerciseDisplayName(ex.exercise) === currentName
      );
      
      if (!isAlreadyInList) {
        exercisesToSave.push({
          exercise: currentEx,
          sets: sets,
          name: currentDisplayName,
          targetMuscle: currentEx?.targetMuscle || currentEx?.bodyPart,
        });
        
        // 현재 운동도 저장
        if (onSave) {
          const meta = {
            externalId: currentEx?.externalId,
            category:
              currentEx?.category ||
              currentEx?.bodyPart ||
              currentEx?.targetMuscle ||
              "",
            imageUrl:
              currentEx?.imageUrl ||
              currentEx?.image ||
              currentEx?.imgUrl ||
              currentEx?.photoUrl ||
              undefined,
          };
          const trimmedComment =
            allSetsCompleted && comment.trim().length > 0
              ? comment.trim()
              : undefined;
          // 시간 모드일 때는 weight를 시간(분)으로 사용
          const setsToSave = recordMode === "time" 
            ? [{ id: 1, order: 1, weight: duration, reps: 0, isCompleted: isTimeCompleted }]
            : sets;
          const saveResult = onSave(setsToSave, currentDisplayName, meta, trimmedComment);
          // sessionId 저장 (Promise인 경우 await)
          if (saveResult instanceof Promise) {
            saveResult.then((sessionId) => {
              if (sessionId) {
                // 현재 운동이 addedExercises에 있으면 sessionId 업데이트
                setAddedExercises((prev) =>
                  prev.map((ex, idx) => {
                    const exName = getExerciseDisplayName(ex.exercise);
                    return exName === currentName ? { ...ex, sessionId } : ex;
                  })
                );
              }
            }).catch((error) => {
              console.error('[EXERCISE][SAVE] 현재 운동 세션 ID 저장 실패:', error);
            });
          }
        }
      }
    }
    
    // 완료된 운동 목록을 ExerciseScreen에 전달
    const exercisesForModal = exercisesToSave.map((ex) => {
      return {
        name: ex.name,
        targetMuscle: ex.targetMuscle,
        imageUrl:
          ex.exercise?.imageUrl ||
          ex.exercise?.image ||
          ex.exercise?.imgUrl ||
          ex.exercise?.photoUrl,
        externalId: ex.exercise?.externalId,
      };
    });
    
    // 모든 운동 저장이 완료된 후 완료 모달 표시
    if (onWorkoutComplete) {
      onWorkoutComplete(exercisesForModal);
    }
    
    setShowInstructions(false);
    stopWorkoutTimer(true);
  };

  const exerciseListData =
    addedExercises.length > 0
      ? addedExercises
      : selectedExercise
      ? [
          {
            exercise: selectedExercise,
            sets,
            comment,
            instructionText,
            instructionImageUrl,
            sessionId: undefined,
          },
        ]
      : [];

  const content = fullScreen ? (
    <SafeAreaView style={styles.fullScreenContainer}>
      <View style={styles.fullScreenContent}>
          {currentMode === "add" ? (
            <KeyboardAvoidingView
              behavior={Platform.OS === "ios" ? "padding" : undefined}
              style={styles.keyboardAvoider}
            >
              {fullScreen && (
              <View style={[styles.fullScreenHeader, styles.fullScreenHeaderAdd]}>
                  <TouchableOpacity onPress={onClose} style={styles.backBtnTop}>
                    <Icon name="arrow-back" size={24} color="#ffffff" />
                  </TouchableOpacity>
                  <Text style={styles.fullScreenTitle}>
                    {userName}님! 어떤 운동을 진행할까요?
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

              <View
                style={[
                  styles.searchContainer,
                  fullScreen && styles.searchContainerFullScreen,
                ]}
              >
                <View
                  style={[
                    styles.searchBar,
                    fullScreen && styles.searchBarLight,
                  ]}
                >
                  <Icon name="search" size={20} color="#666666" />
                  <TextInput
                    style={[
                      styles.searchInput,
                      fullScreen && styles.searchInputLight,
                    ]}
                    placeholder="종목 이름을 검색하세요."
                    placeholderTextColor="#666666"
                    value={searchTerm}
                    onChangeText={setSearchTerm}
                  />
                </View>
                <View style={styles.searchActionRow}>
                  <TouchableOpacity
                    style={[
                      styles.multiSelectToggle,
                      !canUseMultiSelect && styles.multiSelectToggleInactive,
                      isMultiSelectMode && styles.multiSelectToggleActive,
                    ]}
                    onPress={handleToggleMultiSelectMode}
                    activeOpacity={0.8}
                    disabled={!canUseMultiSelect}
                  >
                    <Text
                      style={[
                        styles.multiSelectToggleText,
                        isMultiSelectMode && styles.multiSelectToggleTextActive,
                      ]}
                    >
                      {isMultiSelectMode
                        ? `다중 선택 중 (${multiSelectCount})`
                        : "다중 선택"}
                    </Text>
                  </TouchableOpacity>
                </View>
              </View>

              <View style={styles.filterWrapper}>
                <ScrollView
                  horizontal
                  showsHorizontalScrollIndicator={false}
                  style={styles.filterContainer}
                  contentContainerStyle={styles.filterContent}
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
                  apiExercises.map((ex: any, index: number) => {
                    const key = ex.externalId || `${ex.name}-${index}`;
                    const isSelected =
                      !!selectedSearchExercises[getExerciseKey(ex)];
                    return (
                      <TouchableOpacity
                        key={key}
                        style={[
                          styles.exerciseItem,
                          isMultiSelectMode && styles.exerciseItemSelectable,
                          isMultiSelectMode &&
                            isSelected &&
                            styles.exerciseItemSelected,
                        ]}
                        onPress={() =>
                          isMultiSelectMode
                            ? handleMultiSelectPick(ex)
                            : handleExerciseSelect(ex)
                        }
                        activeOpacity={0.8}
                      >
                        {isMultiSelectMode && (
                          <View
                            style={[
                              styles.exerciseSelectBadge,
                              isSelected && styles.exerciseSelectBadgeActive,
                            ]}
                          >
                            <Icon
                              name={
                                isSelected ? "checkmark" : "add-outline"
                              }
                              size={14}
                              color={isSelected ? "#0c0c0c" : "#d6ff4b"}
                            />
                          </View>
                        )}
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
                              fullScreen && styles.exerciseNameLight,
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
                              fullScreen && styles.exerciseLastUsedLight,
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
                    );
                  })}
              </ScrollView>
              {isMultiSelectMode && (
                <View style={styles.multiSelectFooter}>
                  <TouchableOpacity
                    style={[
                      styles.multiSelectActionBtn,
                      multiSelectCount === 0 &&
                        styles.multiSelectActionBtnDisabled,
                    ]}
                    disabled={multiSelectCount === 0}
                    onPress={handleStartSelectedExercises}
                  >
                    <Text
                      style={[
                        styles.multiSelectActionText,
                        multiSelectCount === 0 &&
                          styles.multiSelectActionTextDisabled,
                      ]}
                    >
                      선택한 운동 시작하기
                      {multiSelectCount > 0
                        ? ` (${multiSelectCount})`
                        : ""}
                    </Text>
                  </TouchableOpacity>
                </View>
              )}
              </View>
            </KeyboardAvoidingView>
        ) : (
          <View style={styles.exerciseDetailModal}>
            <KeyboardAvoidingView
              behavior={Platform.OS === "ios" ? "padding" : undefined}
              style={styles.detailKeyboardAvoider}
            >
              {fullScreen && (
                <View style={[styles.fullScreenHeader, styles.fullScreenHeaderDetail]}>
                  <View style={styles.detailHeaderRow}>
                    <TouchableOpacity
                      onPress={() => {
                        persistCurrentExerciseState();
                        if (currentExerciseIndex > 0) {
                          const prevIndex = currentExerciseIndex - 1;
                          const prevExercise = addedExercises[prevIndex];
                          setSelectedExercise(prevExercise.exercise);
                          setSets(prevExercise.sets);
                          setComment(prevExercise.comment);
                          setInstructionText(prevExercise.instructionText);
                          setInstructionImageUrl(prevExercise.instructionImageUrl);
                          setCurrentExerciseIndex(prevIndex);
                          setIsTimeCompleted(false);
                          setRecordMode("sets");
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
                          setCurrentMode("add");
                          setSelectedExercise(null);
                          setCurrentExerciseIndex(-1);
                          setSearchTerm("");
                          setSelectedCategory("전체");
                          setSets(createInitialSets());
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
                    <Text style={styles.detailHeaderTitle}>
                      {getExerciseDisplayName(
                        selectedExercise || exerciseData || { name: "운동" }
                      )}
                    </Text>
                    <View style={styles.detailHeaderActions}>
                      <TouchableOpacity
                        style={styles.headerIconBtn}
                        onPress={() => setShowExerciseListModal(true)}
                        activeOpacity={0.85}
                      >
                        <Icon name="menu-outline" size={20} color="#ffffff" />
                      </TouchableOpacity>
                      <TouchableOpacity
                        style={[
                          styles.timerBadge,
                          !isWorkoutTimerRunning && styles.timerBadgePaused,
                        ]}
                        onPress={toggleWorkoutTimer}
                        activeOpacity={0.85}
                      >
                        <Icon
                          name={isWorkoutTimerRunning ? "time-outline" : "play-outline"}
                          size={16}
                          color="#ffffff"
                        />
                        <Text style={styles.timerBadgeText}>
                          {formatWorkoutTimer(workoutTimerSeconds)}
                        </Text>
                      </TouchableOpacity>
                    </View>
                  </View>
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
                    <TouchableOpacity
                      style={styles.headerIconBtn}
                      onPress={() => setShowExerciseListModal(true)}
                      activeOpacity={0.85}
                    >
                      <Icon name="menu-outline" size={20} color="#ffffff" />
                    </TouchableOpacity>
                    <TouchableOpacity
                      style={[
                        styles.timerBadge,
                        !isWorkoutTimerRunning && styles.timerBadgePaused,
                      ]}
                      onPress={toggleWorkoutTimer}
                      activeOpacity={0.85}
                    >
                      <Icon
                        name={isWorkoutTimerRunning ? "time-outline" : "play-outline"}
                        size={16}
                        color="#ffffff"
                      />
                      <Text style={styles.timerBadgeText}>
                        {formatWorkoutTimer(workoutTimerSeconds)}
                      </Text>
                    </TouchableOpacity>
                    <TouchableOpacity onPress={onClose} style={styles.closeBtn}>
                      <Icon name="close" size={12} color="#ffffff" />
                    </TouchableOpacity>
                  </View>
                </View>
              )}

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
                        persistCurrentExerciseState();
                        // 이전 운동으로 이동
                        const prevIndex = currentExerciseIndex - 1;
                        const prevExercise = addedExercises[prevIndex];
                        setSelectedExercise(prevExercise.exercise);
                        setSets(prevExercise.sets);
                        setComment(prevExercise.comment);
                        setInstructionText(prevExercise.instructionText);
                        setInstructionImageUrl(prevExercise.instructionImageUrl);
                        setCurrentExerciseIndex(prevIndex);
                        setIsTimeCompleted(false);
                        setRecordMode("sets");
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
                        persistCurrentExerciseState();
                        // 다음 운동으로 이동
                        const nextIndex = currentExerciseIndex + 1;
                        const nextExercise = addedExercises[nextIndex];
                        setSelectedExercise(nextExercise.exercise);
                        setSets(nextExercise.sets);
                        setComment(nextExercise.comment);
                        setInstructionText(nextExercise.instructionText);
                        setInstructionImageUrl(nextExercise.instructionImageUrl);
                        setCurrentExerciseIndex(nextIndex);
                        setIsTimeCompleted(false);
                        setRecordMode("sets");
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
                  {/* 세트/시간 전환 버튼 */}
                  <View style={styles.recordModeToggle}>
                    <TouchableOpacity
                      style={[
                        styles.recordModeButton,
                        recordMode === "sets" && styles.recordModeButtonActive,
                      ]}
                      onPress={() => {
                        setRecordMode("sets");
                        if (sets.length === 0) {
                          setSets(createInitialSets());
                        }
                      }}
                    >
                      <Text
                        style={[
                          styles.recordModeButtonText,
                          recordMode === "sets" && styles.recordModeButtonTextActive,
                        ]}
                      >
                        세트 수로 기록
                      </Text>
                    </TouchableOpacity>
                    <TouchableOpacity
                      style={[
                        styles.recordModeButton,
                        recordMode === "time" && styles.recordModeButtonActive,
                      ]}
                      onPress={() => {
                        setRecordMode("time");
                        setIsTimeCompleted(false);
                      }}
                    >
                      <Text
                        style={[
                          styles.recordModeButtonText,
                          recordMode === "time" && styles.recordModeButtonTextActive,
                        ]}
                      >
                        시간으로 기록
                      </Text>
                    </TouchableOpacity>
                  </View>

                  {recordMode === "sets" ? (
                    <>
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
                            const currentEx = selectedExercise || exerciseData;
                            if (currentEx) {
                              let newIndex = currentExerciseIndex;
                              if (currentExerciseIndex === -1 || currentExerciseIndex >= addedExercises.length) {
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
                            
                            const exerciseName = onSave ? getExerciseDisplayName(currentEx || { name: "운동" }) : "";
                            const displayName = exerciseName;
                            const meta = currentEx?.externalId
                              ? {
                                  externalId: currentEx.externalId,
                                  category:
                                    currentEx.category ||
                                    currentEx.bodyPart ||
                                    currentEx.targetMuscle,
                                  imageUrl:
                                    currentEx.imageUrl ||
                                    currentEx.image ||
                                    currentEx.imgUrl ||
                                    currentEx.photoUrl ||
                                    undefined,
                                }
                              : undefined;
                            const trimmedComment =
                              allSetsCompleted && comment.trim().length > 0
                                ? comment.trim()
                                : undefined;
                            
                            setCurrentMode("add");
                            setSelectedExercise(null);
                            setSearchTerm("");
                            setSelectedCategory("전체");
                            setSets(createInitialSets());
                            setComment("");
                            setInstructionText("");
                            setInstructionImageUrl("");
                            setShowInstructions(false);
                            
                            if (onSave && currentEx) {
                              requestAnimationFrame(() => {
                                onSave(sets, displayName, meta, trimmedComment, { keepModalOpen: true });
                              });
                            }
                          }}
                        >
                          <Text style={styles.addExerciseButtonText}>종목 추가</Text>
                        </TouchableOpacity>
                      </View>
                    </>
                  ) : (
                    <>
                      <View style={styles.timeInputContainer}>
                        <View style={styles.timeInputRow}>
                          <Text style={styles.timeInputLabel}>운동 시간</Text>
                          <View style={styles.timeInputWrapper}>
                            <TextInput
                              style={styles.timeInput}
                              value={duration.toString()}
                              onChangeText={(text) => {
                                const num = parseInt(text, 10);
                                if (!isNaN(num) && num >= 0) {
                                  setDuration(num);
                                } else if (text === "") {
                                  setDuration(0);
                                }
                              }}
                              keyboardType="numeric"
                              placeholder="0"
                            />
                            <Text style={styles.timeInputUnit}>분</Text>
                          </View>
                        </View>
                        <TouchableOpacity
                          style={[
                            styles.timeCompleteButton,
                            isTimeCompleted && styles.timeCompleteButtonActive,
                          ]}
                          onPress={() => setIsTimeCompleted(!isTimeCompleted)}
                        >
                          <Icon
                            name={isTimeCompleted ? "checkmark-circle" : "checkmark-circle-outline"}
                            size={24}
                            color={isTimeCompleted ? "#4CAF50" : "#666666"}
                          />
                          <Text
                            style={[
                              styles.timeCompleteButtonText,
                              isTimeCompleted && styles.timeCompleteButtonTextActive,
                            ]}
                          >
                            {isTimeCompleted ? "완료" : "완료하기"}
                          </Text>
                        </TouchableOpacity>
                      </View>

                      {isTimeCompleted && (
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

                      <View style={styles.addButtonsRow}>
                        <TouchableOpacity
                          style={styles.addExerciseButton}
                          onPress={() => {
                            const currentEx = selectedExercise || exerciseData;
                            if (currentEx) {
                              let newIndex = currentExerciseIndex;
                              if (currentExerciseIndex === -1 || currentExerciseIndex >= addedExercises.length) {
                                newIndex = addedExercises.length;
                                setAddedExercises((prev) => [
                                  ...prev,
                                  {
                                    exercise: currentEx,
                                    sets: [{ id: 1, order: 1, weight: duration, reps: 0, isCompleted: isTimeCompleted }],
                                    comment: comment,
                                    instructionText: instructionText,
                                    instructionImageUrl: instructionImageUrl,
                                  },
                                ]);
                              } else {
                                setAddedExercises((prev) => {
                                  const updated = [...prev];
                                  updated[currentExerciseIndex] = {
                                    exercise: currentEx,
                                    sets: [{ id: 1, order: 1, weight: duration, reps: 0, isCompleted: isTimeCompleted }],
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
                            
                            const exerciseName = onSave ? getExerciseDisplayName(currentEx || { name: "운동" }) : "";
                            const meta = currentEx?.externalId
                              ? {
                                  externalId: currentEx.externalId,
                                  category:
                                    currentEx.category ||
                                    currentEx.bodyPart ||
                                    currentEx.targetMuscle,
                                  imageUrl:
                                    currentEx.imageUrl ||
                                    currentEx.image ||
                                    currentEx.imgUrl ||
                                    currentEx.photoUrl ||
                                    undefined,
                                }
                              : undefined;
                            const trimmedComment =
                              isTimeCompleted && comment.trim().length > 0
                                ? comment.trim()
                                : undefined;
                            
                            const timeSets = [{ id: 1, order: 1, weight: duration, reps: 0, isCompleted: isTimeCompleted }];
                            
                            setCurrentMode("add");
                            setSelectedExercise(null);
                            setSearchTerm("");
                            setSelectedCategory("전체");
                            setDuration(30);
                            setIsTimeCompleted(false);
                            setRecordMode("sets");
                            setSets(createInitialSets());
                            setComment("");
                            setInstructionText("");
                            setInstructionImageUrl("");
                            setShowInstructions(false);
                            
                            if (onSave && currentEx) {
                              requestAnimationFrame(() => {
                                onSave(timeSets, exerciseName, meta, trimmedComment, { keepModalOpen: true });
                              });
                            }
                          }}
                        >
                          <Text style={styles.addExerciseButtonText}>종목 추가</Text>
                        </TouchableOpacity>
                      </View>
                    </>
                  )}
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
                    <TouchableOpacity
                      style={styles.headerIconBtn}
                      onPress={() => setShowExerciseListModal(true)}
                      activeOpacity={0.85}
                    >
                      <Icon name="menu-outline" size={20} color="#ffffff" />
                    </TouchableOpacity>
                    <View style={styles.timerBadge}>
                      <Icon name="time-outline" size={16} color="#ffffff" />
                      <Text style={styles.timerBadgeText}>
                        {formatWorkoutTimer(workoutTimerSeconds)}
                      </Text>
                    </View>
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
                  {/* 세트/시간 전환 버튼 */}
                  <View style={styles.recordModeToggle}>
                    <TouchableOpacity
                      style={[
                        styles.recordModeButton,
                        recordMode === "sets" && styles.recordModeButtonActive,
                      ]}
                      onPress={() => {
                        setRecordMode("sets");
                        if (sets.length === 0) {
                          setSets(createInitialSets());
                        }
                      }}
                    >
                      <Text
                        style={[
                          styles.recordModeButtonText,
                          recordMode === "sets" && styles.recordModeButtonTextActive,
                        ]}
                      >
                        세트 수로 기록
                      </Text>
                    </TouchableOpacity>
                    <TouchableOpacity
                      style={[
                        styles.recordModeButton,
                        recordMode === "time" && styles.recordModeButtonActive,
                      ]}
                      onPress={() => {
                        setRecordMode("time");
                        setIsTimeCompleted(false);
                      }}
                    >
                      <Text
                        style={[
                          styles.recordModeButtonText,
                          recordMode === "time" && styles.recordModeButtonTextActive,
                        ]}
                      >
                        시간으로 기록
                      </Text>
                    </TouchableOpacity>
                  </View>

                  {recordMode === "sets" ? (
                    <>
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
                            const currentEx = selectedExercise || exerciseData;
                            if (currentEx) {
                              let newIndex = currentExerciseIndex;
                              if (currentExerciseIndex === -1 || currentExerciseIndex >= addedExercises.length) {
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
                            
                            const exerciseName = onSave ? getExerciseDisplayName(currentEx || { name: "운동" }) : "";
                            const meta = currentEx?.externalId
                              ? {
                                  externalId: currentEx.externalId,
                                  category:
                                    currentEx.category ||
                                    currentEx.bodyPart ||
                                    currentEx.targetMuscle,
                                  imageUrl:
                                    currentEx.imageUrl ||
                                    currentEx.image ||
                                    currentEx.imgUrl ||
                                    currentEx.photoUrl ||
                                    undefined,
                                }
                              : undefined;
                            const trimmedComment =
                              allSetsCompleted && comment.trim().length > 0
                                ? comment.trim()
                                : undefined;
                            
                            setCurrentMode("add");
                            setSelectedExercise(null);
                            setSearchTerm("");
                            setSelectedCategory("전체");
                            setSets(createInitialSets());
                            setComment("");
                            setInstructionText("");
                            setInstructionImageUrl("");
                            setShowInstructions(false);
                            
                            if (onSave && currentEx) {
                              requestAnimationFrame(() => {
                                onSave(sets, exerciseName, meta, trimmedComment, { keepModalOpen: true });
                              });
                            }
                          }}
                        >
                          <Text style={styles.addExerciseButtonText}>종목 추가</Text>
                        </TouchableOpacity>
                      </View>
                    </>
                  ) : (
                    <>
                      <View style={styles.timeInputContainer}>
                        <View style={styles.timeInputRow}>
                          <Text style={styles.timeInputLabel}>운동 시간</Text>
                          <View style={styles.timeInputWrapper}>
                            <TextInput
                              style={styles.timeInput}
                              value={duration.toString()}
                              onChangeText={(text) => {
                                const num = parseInt(text, 10);
                                if (!isNaN(num) && num >= 0) {
                                  setDuration(num);
                                } else if (text === "") {
                                  setDuration(0);
                                }
                              }}
                              keyboardType="numeric"
                              placeholder="0"
                            />
                            <Text style={styles.timeInputUnit}>분</Text>
                          </View>
                        </View>
                        <TouchableOpacity
                          style={[
                            styles.timeCompleteButton,
                            isTimeCompleted && styles.timeCompleteButtonActive,
                          ]}
                          onPress={() => setIsTimeCompleted(!isTimeCompleted)}
                        >
                          <Icon
                            name={isTimeCompleted ? "checkmark-circle" : "checkmark-circle-outline"}
                            size={24}
                            color={isTimeCompleted ? "#4CAF50" : "#666666"}
                          />
                          <Text
                            style={[
                              styles.timeCompleteButtonText,
                              isTimeCompleted && styles.timeCompleteButtonTextActive,
                            ]}
                          >
                            {isTimeCompleted ? "완료" : "완료하기"}
                          </Text>
                        </TouchableOpacity>
                      </View>

                      {isTimeCompleted && (
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

                      <View style={styles.addButtonsRow}>
                        <TouchableOpacity
                          style={styles.addExerciseButton}
                          onPress={() => {
                            const currentEx = selectedExercise || exerciseData;
                            if (currentEx) {
                              let newIndex = currentExerciseIndex;
                              if (currentExerciseIndex === -1 || currentExerciseIndex >= addedExercises.length) {
                                newIndex = addedExercises.length;
                                setAddedExercises((prev) => [
                                  ...prev,
                                  {
                                    exercise: currentEx,
                                    sets: [{ id: 1, order: 1, weight: duration, reps: 0, isCompleted: isTimeCompleted }],
                                    comment: comment,
                                    instructionText: instructionText,
                                    instructionImageUrl: instructionImageUrl,
                                  },
                                ]);
                              } else {
                                setAddedExercises((prev) => {
                                  const updated = [...prev];
                                  updated[currentExerciseIndex] = {
                                    exercise: currentEx,
                                    sets: [{ id: 1, order: 1, weight: duration, reps: 0, isCompleted: isTimeCompleted }],
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
                            
                            const exerciseName = onSave ? getExerciseDisplayName(currentEx || { name: "운동" }) : "";
                            const meta = currentEx?.externalId
                              ? {
                                  externalId: currentEx.externalId,
                                  category:
                                    currentEx.category ||
                                    currentEx.bodyPart ||
                                    currentEx.targetMuscle,
                                  imageUrl:
                                    currentEx.imageUrl ||
                                    currentEx.image ||
                                    currentEx.imgUrl ||
                                    currentEx.photoUrl ||
                                    undefined,
                                }
                              : undefined;
                            const trimmedComment =
                              isTimeCompleted && comment.trim().length > 0
                                ? comment.trim()
                                : undefined;
                            
                            const timeSets = [{ id: 1, order: 1, weight: duration, reps: 0, isCompleted: isTimeCompleted }];
                            
                            setCurrentMode("add");
                            setSelectedExercise(null);
                            setSearchTerm("");
                            setSelectedCategory("전체");
                            setDuration(30);
                            setIsTimeCompleted(false);
                            setRecordMode("sets");
                            setSets(createInitialSets());
                            setComment("");
                            setInstructionText("");
                            setInstructionImageUrl("");
                            setShowInstructions(false);
                            
                            if (onSave && currentEx) {
                              requestAnimationFrame(() => {
                                onSave(timeSets, exerciseName, meta, trimmedComment, { keepModalOpen: true });
                              });
                            }
                          }}
                        >
                          <Text style={styles.addExerciseButtonText}>종목 추가</Text>
                        </TouchableOpacity>
                      </View>
                    </>
                  )}
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

  const exerciseListModal = (
    <Modal
      visible={showExerciseListModal}
      transparent
      animationType="fade"
      onRequestClose={() => setShowExerciseListModal(false)}
    >
      <TouchableWithoutFeedback onPress={() => setShowExerciseListModal(false)}>
        <View style={styles.exerciseListOverlay}>
          <TouchableWithoutFeedback onPress={() => {}}>
            <View style={styles.exerciseListContainer}>
              <View style={styles.exerciseListHeader}>
                <Text style={styles.exerciseListTitle}>추가한 운동</Text>
                <TouchableOpacity
                  style={styles.exerciseListCloseBtn}
                  onPress={() => setShowExerciseListModal(false)}
                >
                  <Icon name="close" size={18} color="#000000" />
                </TouchableOpacity>
              </View>
              <ScrollView
                style={styles.exerciseListScroll}
                contentContainerStyle={styles.exerciseListScrollContent}
              >
                {exerciseListData.length === 0 ? (
                  <Text style={styles.exerciseListEmptyText}>
                    아직 추가한 운동이 없어요
                  </Text>
                ) : (
                  exerciseListData.map((item, index) => {
                    const displayName =
                      getExerciseDisplayName(item.exercise) ||
                      `운동 ${index + 1}`;
                    const totalSets = Array.isArray(item.sets)
                      ? item.sets.length
                      : 0;
                    const completedSets = Array.isArray(item.sets)
                      ? item.sets.filter((set) => set.isCompleted).length
                      : 0;
                    const isActive = index === currentExerciseIndex;
                    return (
                      <View
                        key={`${displayName}-${index}`}
                        style={[
                          styles.exerciseListItem,
                          isActive && styles.exerciseListItemActive,
                        ]}
                      >
                        <Text style={styles.exerciseListItemName}>
                          {displayName}
                        </Text>
                        <Text style={styles.exerciseListItemSets}>
                          {totalSets > 0
                            ? `${completedSets}/${totalSets} 세트`
                            : "세트 없음"}
                        </Text>
                        {isActive && (
                          <View style={styles.exerciseListCurrentBadge}>
                            <Text style={styles.exerciseListCurrentText}>
                              진행 중
                            </Text>
                          </View>
                        )}
                      </View>
                    );
                  })
                )}
              </ScrollView>
            </View>
          </TouchableWithoutFeedback>
        </View>
      </TouchableWithoutFeedback>
    </Modal>
  );

  const combinedContent = (
    <>
      {content}
      {exerciseListModal}
    </>
  );

  if (!isOpen && !renderContentOnly) {
    return null;
  }

  // renderContentOnly가 true이면 Modal 없이 내용만 렌더링
  if (renderContentOnly) {
    return combinedContent;
  }

  return (
    <Modal
      visible={isOpen}
      animationType={fullScreen ? "none" : "slide"}
      transparent={!fullScreen}
      presentationStyle={fullScreen ? "fullScreen" : undefined}
      onRequestClose={onClose}
    >
      {combinedContent}
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
    paddingHorizontal: 20,
    backgroundColor: "#0c0c0c",
  },
  fullScreenHeaderAdd: {
    paddingTop: 28,
    paddingBottom: 6,
  },
  fullScreenHeaderDetail: {
    paddingTop: 28,
    paddingBottom: 6,
  },
  backBtnTop: {
    width: 40,
    height: 40,
    justifyContent: "center",
    alignItems: "flex-start",
    marginBottom: 8,
  },
  detailHeaderRow: {
    flexDirection: "row",
    alignItems: "center",
    gap: 12,
  },
  detailHeaderTitle: {
    flex: 1,
    fontSize: 18,
    fontWeight: "600",
    color: "#ffffff",
    textAlign: "center",
  },
  detailHeaderActions: {
    flexDirection: "row",
    alignItems: "center",
    gap: 8,
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
    marginHorizontal: 10,
    paddingTop: 16,
    marginTop: 0,
    minHeight: 0,
  },
  addExerciseModal: {
    flex: 1,
    minHeight: 0,
  },
  exerciseDetailModal: {
    flex: 1,
    backgroundColor: "#0c0c0c",
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
  headerIconBtn: {
    width: 36,
    height: 36,
    borderRadius: 18,
    backgroundColor: "rgba(255,255,255,0.14)",
    justifyContent: "center",
    alignItems: "center",
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
  timerBadge: {
    flexDirection: "row",
    alignItems: "center",
    gap: 4,
    backgroundColor: "rgba(255,255,255,0.1)",
    borderRadius: 18,
    paddingHorizontal: 10,
    paddingVertical: 6,
    borderWidth: 1,
    borderColor: "rgba(255,255,255,0.16)",
  },
  timerBadgePaused: {
    backgroundColor: "rgba(255,255,255,0.04)",
    borderColor: "rgba(255,255,255,0.08)",
  },
  timerBadgeText: {
    color: "#ffffff",
    fontSize: 13,
    fontWeight: "600",
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
  exerciseListOverlay: {
    flex: 1,
    backgroundColor: "rgba(0, 0, 0, 0.6)",
    justifyContent: "center",
    alignItems: "center",
    padding: 24,
  },
  exerciseListContainer: {
    width: "100%",
    maxWidth: 420,
    backgroundColor: "#ffffff",
    borderRadius: 18,
    padding: 20,
  },
  exerciseListHeader: {
    flexDirection: "row",
    alignItems: "center",
    justifyContent: "space-between",
    marginBottom: 12,
  },
  exerciseListTitle: {
    fontSize: 16,
    fontWeight: "700",
    color: "#000000",
  },
  exerciseListCloseBtn: {
    padding: 4,
  },
  exerciseListScroll: {
    maxHeight: 320,
  },
  exerciseListScrollContent: {
    paddingBottom: 6,
  },
  exerciseListEmptyText: {
    textAlign: "center",
    color: "#666666",
    paddingVertical: 24,
    fontSize: 14,
  },
  exerciseListItem: {
    flexDirection: "row",
    alignItems: "center",
    justifyContent: "flex-start",
    gap: 12,
    paddingVertical: 10,
    paddingHorizontal: 12,
    borderBottomWidth: 1,
    borderBottomColor: "#f0f0f0",
  },
  exerciseListItemActive: {
    backgroundColor: "transparent",
  },
  exerciseListItemName: {
    flex: 1,
    fontSize: 15,
    fontWeight: "600",
    color: "#111111",
  },
  exerciseListItemSets: {
    width: 90,
    fontSize: 13,
    color: "#666666",
    textAlign: "right",
    marginLeft: 8,
  },
  exerciseListCurrentBadge: {
    backgroundColor: "#111111",
    borderRadius: 12,
    paddingHorizontal: 10,
    paddingVertical: 4,
    marginLeft: 12,
  },
  exerciseListCurrentText: {
    color: "#ffffff",
    fontSize: 12,
    fontWeight: "600",
  },
  exerciseListOverlay: {
    flex: 1,
    backgroundColor: "rgba(0, 0, 0, 0.6)",
    justifyContent: "center",
    alignItems: "center",
    padding: 24,
  },
  exerciseListContainer: {
    width: "100%",
    maxWidth: 420,
    backgroundColor: "#ffffff",
    borderRadius: 18,
    padding: 20,
  },
  exerciseListHeader: {
    flexDirection: "row",
    alignItems: "center",
    justifyContent: "space-between",
    marginBottom: 12,
  },
  exerciseListTitle: {
    fontSize: 16,
    fontWeight: "700",
    color: "#000000",
  },
  exerciseListCloseBtn: {
    padding: 4,
  },
  exerciseListScroll: {
    maxHeight: 320,
  },
  exerciseListScrollContent: {
    paddingBottom: 6,
  },
  exerciseListEmptyText: {
    textAlign: "center",
    color: "#666666",
    paddingVertical: 24,
    fontSize: 14,
  },
  exerciseListItem: {
    flexDirection: "row",
    alignItems: "center",
    justifyContent: "space-between",
    paddingVertical: 10,
    borderBottomWidth: 1,
    borderBottomColor: "#f0f0f0",
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
    paddingHorizontal: 20,
    paddingTop: 12,
    paddingBottom: 8,
  },
  searchContainerFullScreen: {
    paddingHorizontal: 15,
  },
  searchActionRow: {
    marginTop: 10,
    alignItems: "flex-start",
    flexDirection: "row",
    justifyContent: "flex-end",
  },
  multiSelectToggle: {
    flexDirection: "row",
    alignItems: "center",
    gap: 6,
    paddingHorizontal: 12,
    paddingVertical: 6,
    borderRadius: 20,
    borderWidth: 1,
    borderColor: "#000000",
    backgroundColor: "#ffffff",
    alignSelf: "flex-start",
  },
  multiSelectToggleActive: {
    backgroundColor: "#d6ff4b",
    borderColor: "#d6ff4b",
  },
  multiSelectToggleInactive: {
    opacity: 0.6,
  },
  multiSelectToggleText: {
    color: "#000000",
    fontSize: 13,
    fontWeight: "600",
  },
  multiSelectToggleTextActive: {
    color: "#0c0c0c",
  },
  filterWrapper: {
    height: 28,
    marginTop: 8,
    marginBottom: 10,
    paddingTop: 0,
    paddingBottom: 0,
    width: "100%",
    overflow: "hidden",
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
    paddingHorizontal: 20,
    paddingBottom: 0,
    paddingTop: 0,
    marginBottom: 0,
    marginTop: 0,
    height: 28,
  },
  filterContent: {
    paddingVertical: 0,
    paddingRight: 24,
    paddingLeft: 4,
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
  exerciseListContentWithFooter: {
    paddingBottom: 100,
  },
  exerciseItem: {
    flexDirection: "row",
    alignItems: "center",
    paddingVertical: 12,
    borderBottomWidth: 1,
    borderBottomColor: "#666666",
  },
  exerciseItemSelectable: {},
  exerciseItemSelected: {},
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
  exerciseSelectBadge: {
    width: 22,
    height: 22,
    borderRadius: 4,
    borderWidth: 1,
    borderColor: "#000000",
    backgroundColor: "#000000",
    alignItems: "center",
    justifyContent: "center",
    marginRight: 12,
  },
  exerciseSelectBadgeActive: {
    backgroundColor: "#d6ff4b",
    borderColor: "#000000",
  },
  exerciseInfo: {
    flex: 1,
    marginLeft: 0,
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
  multiSelectFooter: {
    paddingHorizontal: 20,
    paddingTop: 12,
    paddingBottom: 4,
  },
  multiSelectActionBtn: {
    borderRadius: 14,
    backgroundColor: "#d6ff4b",
    paddingVertical: 12,
    alignItems: "center",
  },
  multiSelectActionBtnDisabled: {
    backgroundColor: "#3f3f3f",
  },
  multiSelectActionText: {
    fontSize: 15,
    fontWeight: "700",
    color: "#0c0c0c",
  },
  multiSelectActionTextDisabled: {
    color: "#9e9e9e",
  },
  setsContainer: {
    paddingHorizontal: 20,
    paddingTop: 0,
    paddingBottom: 0,
    flex: 1,
    minHeight: 0,
  },
  recordModeToggle: {
    flexDirection: "row",
    marginBottom: 20,
    marginTop: 20,
    backgroundColor: "#1a1a1a",
    borderRadius: 8,
    padding: 4,
    gap: 4,
    borderWidth: 1,
    borderColor: "#333333",
  },
  recordModeButton: {
    flex: 1,
    paddingVertical: 12,
    paddingHorizontal: 16,
    borderRadius: 6,
    alignItems: "center",
    justifyContent: "center",
    backgroundColor: "transparent",
  },
  recordModeButtonActive: {
    backgroundColor: "#d6ff4b",
  },
  recordModeButtonText: {
    fontSize: 14,
    fontWeight: "600",
    color: "#999999",
  },
  recordModeButtonTextActive: {
    color: "#000000",
    fontWeight: "700",
  },
  timeInputContainer: {
    marginTop: 0,
    paddingTop: 0,
    paddingBottom: 12,
  },
  timeInputRow: {
    flexDirection: "row",
    alignItems: "center",
    justifyContent: "space-between",
    marginBottom: 20,
  },
  timeInputLabel: {
    fontSize: 16,
    fontWeight: "600",
    color: "#ffffff",
  },
  timeInputWrapper: {
    flexDirection: "row",
    alignItems: "center",
    backgroundColor: "#ffffff",
    borderRadius: 8,
    paddingHorizontal: 16,
    paddingVertical: 12,
    minWidth: 120,
  },
  timeInput: {
    fontSize: 18,
    fontWeight: "600",
    color: "#000000",
    textAlign: "right",
    flex: 1,
    padding: 0,
  },
  timeInputUnit: {
    fontSize: 16,
    fontWeight: "500",
    color: "#666666",
    marginLeft: 8,
  },
  timeCompleteButton: {
    flexDirection: "row",
    alignItems: "center",
    justifyContent: "center",
    backgroundColor: "#2a2a2a",
    borderRadius: 8,
    paddingVertical: 14,
    paddingHorizontal: 20,
    gap: 8,
  },
  timeCompleteButtonActive: {
    backgroundColor: "#d6ff4b",
  },
  timeCompleteButtonText: {
    fontSize: 16,
    fontWeight: "600",
    color: "#999999",
  },
  timeCompleteButtonTextActive: {
    color: "#000000",
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
