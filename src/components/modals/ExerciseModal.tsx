import React, { useState, useEffect } from "react";
import {
  View,
  Text,
  Modal,
  TouchableOpacity,
  StyleSheet,
  TextInput,
  ScrollView,
  Image,
} from "react-native";
import { Ionicons as Icon } from "@expo/vector-icons";
import { colors } from "../../theme/colors";
import {
  fetchExercises as fetchExerciseApi,
  fetchExerciseDetail,
} from "../../utils/exerciseApi";

interface Set {
  id: number;
  weight: number;
  reps: number;
  completed: boolean;
}

interface ExerciseModalProps {
  isOpen: boolean;
  onClose: () => void;
  mode?: "add" | "edit";
  exerciseData?: any;
  onSave?: (sets: Set[], exerciseName: string) => void;
}

const ExerciseModal: React.FC<ExerciseModalProps> = ({
  isOpen,
  onClose,
  mode = "add",
  exerciseData,
  onSave,
}) => {
  const [searchTerm, setSearchTerm] = useState("");
  const [selectedCategory, setSelectedCategory] = useState("전체");
  const [currentMode, setCurrentMode] = useState<"add" | "edit" | "detail">(
    mode
  );
  const [selectedExercise, setSelectedExercise] = useState<any>(null);
  const [sets, setSets] = useState<Set[]>([
    { id: 1, weight: 20, reps: 15, completed: false },
    { id: 2, weight: 20, reps: 12, completed: false },
    { id: 3, weight: 20, reps: 12, completed: false },
  ]);
  const [showInstructions, setShowInstructions] = useState<boolean>(false);
  const [instructionLoading, setInstructionLoading] = useState<boolean>(false);
  const [instructionText, setInstructionText] = useState<string>("");
  const [instructionImageUrl, setInstructionImageUrl] = useState<string>("");

  useEffect(() => {
    if (isOpen) {
      if (mode === "add") {
        setCurrentMode("add");
        setSelectedExercise(null);
        setSearchTerm("");
        setSelectedCategory("전체");
        setSets([
          { id: 1, weight: 20, reps: 15, completed: false },
          { id: 2, weight: 20, reps: 12, completed: false },
          { id: 3, weight: 20, reps: 12, completed: false },
        ]);
      } else if (mode === "edit") {
        setCurrentMode("detail");
        setSelectedExercise(exerciseData);
        if (exerciseData?.sets && exerciseData.sets.length > 0) {
          setSets(exerciseData.sets);
        } else {
          setSets([
            { id: 1, weight: 20, reps: 15, completed: false },
            { id: 2, weight: 20, reps: 12, completed: false },
            { id: 3, weight: 20, reps: 12, completed: false },
          ]);
        }
      }
    } else {
      // 모달이 닫힐 때 초기화
      setCurrentMode("add");
      setSelectedExercise(null);
      setSearchTerm("");
      setSelectedCategory("전체");
    }
  }, [isOpen, mode, exerciseData]);

  const categories = ["전체", "가슴", "등", "하체", "어깨", "팔", "코어"];

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

  const handleSetComplete = (setId: number) => {
    setSets((prev) =>
      prev.map((set) =>
        set.id === setId ? { ...set, completed: !set.completed } : set
      )
    );
  };

  const handleAddSet = () => {
    const newSet = {
      id: sets.length + 1,
      weight: 20,
      reps: 12,
      completed: false,
    };
    setSets((prev) => [...prev, newSet]);
  };

  const handleRemoveSet = (setId: number) => {
    if (sets.length > 1) {
      setSets((prev) => {
        const filtered = prev.filter((set) => set.id !== setId);
        return filtered.map((set, index) => ({
          ...set,
          id: index + 1,
        }));
      });
    }
  };

  const handleExerciseSelect = (exercise: any) => {
    setSelectedExercise(exercise);
    setCurrentMode("detail");
    setShowInstructions(false);
    setSets([
      { id: 1, weight: 20, reps: 15, completed: false },
      { id: 2, weight: 20, reps: 12, completed: false },
      { id: 3, weight: 20, reps: 12, completed: false },
    ]);
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
    if (onSave && (selectedExercise || exerciseData)) {
      const fullName = getExerciseDisplayName(
        selectedExercise || exerciseData || { name: "운동" }
      );
      // 메타데이터 전달: externalId, category/bodyPart 등
      const meta = {
        externalId: selectedExercise?.externalId || exerciseData?.externalId,
        category:
          selectedExercise?.bodyPart ||
          selectedExercise?.targetMuscle ||
          bodyPartParam ||
          "",
      };
      // @ts-ignore - onSave 시그니처 확장 (호출 측에서 수용)
      onSave(sets, fullName, meta);
    }
    onClose();
    setShowInstructions(false);
  };

  return (
    <Modal
      visible={isOpen}
      animationType="slide"
      transparent={true}
      onRequestClose={onClose}
    >
      <View style={styles.overlay}>
        <View style={styles.modalContent}>
          {currentMode === "add" ? (
            <View style={styles.addExerciseModal}>
              <View style={styles.modalHeader}>
                <Text style={styles.modalTitle}>종목 추가</Text>
                <TouchableOpacity onPress={onClose} style={styles.closeBtn}>
                  <Icon name="close" size={12} color="#ffffff" />
                </TouchableOpacity>
              </View>

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
          ) : (
            <View style={styles.exerciseDetailModal}>
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
                    style={styles.methodBtn}
                    onPress={() => {
                      const next = !showInstructions;
                      setShowInstructions(next);
                      if (
                        next &&
                        !instructionText &&
                        selectedExercise?.externalId
                      ) {
                        setInstructionLoading(true);
                        fetchExerciseDetail(selectedExercise.externalId)
                          .then((data: any) => {
                            const desc =
                              data?.description ||
                              data?.instructions ||
                              data?.howTo ||
                              data?.guide ||
                              data?.tip ||
                              "";
                            if (typeof desc === "string")
                              setInstructionText(desc);
                            if (data?.imageUrl)
                              setInstructionImageUrl(data.imageUrl);
                          })
                          .catch(() => {})
                          .finally(() => setInstructionLoading(false));
                      }
                    }}
                  >
                    <Text style={styles.methodBtnText}>운동 방법</Text>
                  </TouchableOpacity>

                  <TouchableOpacity onPress={onClose} style={styles.closeBtn}>
                    <Icon name="close" size={12} color="#ffffff" />
                  </TouchableOpacity>
                </View>
              </View>

              <ScrollView
                style={styles.detailScroll}
                contentContainerStyle={{ paddingBottom: 140 }}
                keyboardShouldPersistTaps="handled"
              >
                {showInstructions && (
                  <View style={styles.instructionBox}>
                    <Text style={styles.instructionTitle}>운동 방법</Text>
                    {instructionLoading ? (
                      <Text style={styles.instructionText}>불러오는 중...</Text>
                    ) : (
                      <>
                        {!!instructionImageUrl && (
                          <Image
                            source={{ uri: instructionImageUrl }}
                            style={{
                              width: "100%",
                              height: 160,
                              borderRadius: 8,
                              marginBottom: 8,
                            }}
                            resizeMode="cover"
                          />
                        )}
                        <Text style={styles.instructionText}>
                          {instructionText || "설명이 없습니다."}
                        </Text>
                      </>
                    )}
                  </View>
                )}

                <View style={styles.setsContainer}>
                  <View style={styles.setsHeader}>
                    {/* 세트 번호 열과 정렬 맞추기용 여백 */}
                    <View style={{ width: 40 }} />

                    {/* 무게 입력 열 상단: -, 세트, + 를 가운데 정렬 */}
                    <View style={styles.setsHeaderWeightCol}>
                      <View style={styles.setsHeaderControls}>
                        <TouchableOpacity
                          onPress={() =>
                            handleRemoveSet(sets[sets.length - 1]?.id || 1)
                          }
                          style={styles.setControlBtn}
                        >
                          <Text style={styles.setControlText}>-</Text>
                        </TouchableOpacity>
                        <Text style={styles.setsHeaderText}>세트</Text>
                        <TouchableOpacity
                          onPress={handleAddSet}
                          style={styles.setControlBtn}
                        >
                          <Text style={styles.setControlText}>+</Text>
                        </TouchableOpacity>
                      </View>
                    </View>

                    {/* 횟수 입력 열 상단: 추천 세트를 가운데 배치 */}
                    <View style={styles.setsHeaderRepsCol}>
                      <Text style={styles.setsHeaderText}>추천 세트</Text>
                    </View>

                    {/* 완료 버튼 열 폭만큼의 여백 */}
                    <View style={{ width: 32 }} />
                  </View>

                  {sets.map((set) => (
                    <View key={set.id} style={styles.setRow}>
                      <Text style={styles.setNumber}>{set.id}</Text>
                      <View style={styles.weightInput}>
                        <TextInput
                          style={styles.weightInputText}
                          value={set.weight.toString()}
                          onChangeText={(text) =>
                            handleSetChange(
                              set.id,
                              "weight",
                              parseInt(text) || 0
                            )
                          }
                          keyboardType="numeric"
                        />
                        <Text style={styles.unitText}>kg</Text>
                      </View>
                      <View style={styles.repsInput}>
                        <TextInput
                          style={styles.repsInputText}
                          value={set.reps.toString()}
                          onChangeText={(text) =>
                            handleSetChange(set.id, "reps", parseInt(text) || 0)
                          }
                          keyboardType="numeric"
                        />
                        <Text style={styles.unitText}>회</Text>
                      </View>
                      <TouchableOpacity
                        style={[
                          styles.completeBtn,
                          set.completed && styles.completeBtnCompleted,
                        ]}
                        onPress={() => handleSetComplete(set.id)}
                      >
                        <Icon
                          name="checkmark"
                          size={16}
                          color={set.completed ? "#000000" : "#666666"}
                        />
                      </TouchableOpacity>
                    </View>
                  ))}
                </View>
              </ScrollView>

              <TouchableOpacity
                style={styles.saveExerciseBtn}
                onPress={handleSave}
              >
                <Text style={styles.saveExerciseBtnText}>운동 저장</Text>
              </TouchableOpacity>
            </View>
          )}
        </View>
      </View>
    </Modal>
  );
};

const styles = StyleSheet.create({
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
  addExerciseModal: {
    flex: 1,
    minHeight: 0,
  },
  exerciseDetailModal: {
    flex: 1,
    maxHeight: "100%",
    paddingBottom: 100, // 하단 저장 버튼 공간 확보
  },
  modalHeader: {
    flexDirection: "row",
    justifyContent: "space-between",
    alignItems: "center",
    padding: 20,
    borderBottomWidth: 1,
    borderBottomColor: "#404040",
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
  },
  modalTitleContainer: {
    flex: 1,
    minWidth: 0,
    paddingRight: 8,
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
    marginTop: 12,
    backgroundColor: "#333333",
    borderRadius: 10,
    padding: 12,
  },
  instructionTitle: {
    fontSize: 13,
    color: "#ffffff",
    fontWeight: "600",
    marginBottom: 6,
  },
  instructionText: {
    fontSize: 12,
    color: "#cccccc",
    lineHeight: 17,
  },
  instructionScroll: {
    maxHeight: 260,
  },
  detailScroll: {
    flex: 1,
  },
  searchContainer: {
    padding: 20,
    paddingBottom: 12,
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
  searchInput: {
    flex: 1,
    color: "#ffffff",
    fontSize: 14,
  },
  filterContainer: {
    paddingLeft: 45,
    paddingRight: 20,
    paddingBottom: 0,
    paddingTop: 0,
    marginBottom: 0,
    marginTop: 0,
    height: 28,
    overflow: "hidden",
  },
  filterContent: {
    paddingVertical: 0,
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
  filterBtnText: {
    color: "#ffffff",
    fontSize: 12,
  },
  filterBtnTextActive: {
    color: "#ffffff",
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
    borderBottomColor: "#333333",
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
  exerciseLastUsed: {
    fontSize: 12,
    lineHeight: 16,
    color: "#666666",
  },
  setsContainer: {
    padding: 20,
    flex: 1,
    minHeight: 0,
  },
  setsHeader: {
    flexDirection: "row",
    alignItems: "center",
    marginTop: 10,
    paddingBottom: 12,
    borderBottomWidth: 1,
    borderBottomColor: "#333333",
    marginBottom: 8,
    gap: 12,
    paddingLeft: 12,
  },
  setsHeaderWeightCol: {
    flex: 1,
    alignItems: "center",
    justifyContent: "center",
  },
  setsHeaderRepsCol: {
    flex: 1,
    alignItems: "center",
    justifyContent: "center",
  },
  setsHeaderControls: {
    flexDirection: "row",
    alignItems: "center",
    gap: 12,
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
    paddingVertical: 12,
    borderBottomWidth: 1,
    borderBottomColor: "#333333",
    gap: 12,
  },
  setNumber: {
    width: 40,
    fontSize: 14,
    color: "#ffffff",
    textAlign: "center",
  },
  weightInput: {
    flex: 1,
    flexDirection: "row",
    alignItems: "center",
    backgroundColor: "#404040",
    borderRadius: 6,
    paddingHorizontal: 12,
    paddingVertical: 8,
  },
  inputCompleted: {
    backgroundColor: "#ffffff",
  },
  weightInputText: {
    flex: 1,
    color: "#ffffff",
    fontSize: 14,
    textAlign: "right",
    minWidth: 60,
  },
  inputTextCompleted: {
    color: "#000000",
  },
  unitText: {
    fontSize: 12,
    color: "#666666",
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
    backgroundColor: "#404040",
    borderRadius: 6,
    paddingHorizontal: 12,
    paddingVertical: 8,
  },
  repsInputText: {
    flex: 1,
    color: "#ffffff",
    fontSize: 14,
    textAlign: "right",
    minWidth: 40,
  },
  completeBtn: {
    width: 32,
    height: 32,
    borderRadius: 16,
    backgroundColor: "#404040",
    justifyContent: "center",
    alignItems: "center",
  },
  completeBtnCompleted: {
    backgroundColor: "#e3ff7c",
  },
  saveExerciseBtn: {
    backgroundColor: "#e3ff7c",
    position: "absolute",
    left: 20,
    right: 20,
    bottom: 20,
    paddingVertical: 16,
    borderRadius: 12,
    alignItems: "center",
  },
  saveExerciseBtnText: {
    color: "#000000",
    fontSize: 16,
    fontWeight: "600",
  },
});

export default ExerciseModal;
