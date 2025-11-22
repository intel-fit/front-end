// src/screens/MealRecommendHistoryScreen.tsx
import React, { useState } from "react";
import {
  View,
  Text,
  StyleSheet,
  ScrollView,
  TouchableOpacity,
  Alert,
  ActivityIndicator,
} from "react-native";
import { SafeAreaView } from "react-native-safe-area-context";
import { useFocusEffect } from "@react-navigation/native";
import { Ionicons as Icon } from "@expo/vector-icons";
import AsyncStorage from "@react-native-async-storage/async-storage";
import { recommendedMealAPI } from "../../services";

type DayMealFood = {
  name: string;
  calories: number;
  carbs: number;
  protein: number;
  fat: number;
};

type DayMealBlock = {
  calories: number;
  carbs: number;
  protein: number;
  fat: number;
  meals: DayMealFood[];
};

type DayMeal = {
  totalCalories: number;
  carbs: number;
  protein: number;
  fat: number;
  breakfast?: DayMealBlock;
  lunch?: DayMealBlock;
  dinner?: DayMealBlock;
};

type SavedBundle = {
  bundleId: string;
  planName: string;
  description?: string;
  totalCalories: number;
  mealCount: number;
  createdAt: string;
  planDate: string;
  isServerMeal: boolean;
  days?: DayMeal[];
};

type LocalMeal = {
  id: string;
  bundleId: string;
  planName: string;
  description?: string;
  date?: string;
  meals?: DayMeal[];
  isServerMeal: false;
};

const LOCAL_KEYS = ["savedMeals", "savedMealPlans"] as const;

const MealRecommendHistoryScreen = ({ navigation }: any) => {
  const [bundles, setBundles] = useState<SavedBundle[]>([]);
  const [selectedBundle, setSelectedBundle] = useState<SavedBundle | null>(
    null
  );
  const [selectedDay, setSelectedDay] = useState(0);
  const [loading, setLoading] = useState(false);
  const [isEditMode, setIsEditMode] = useState(false);
  const [selectedBundleIds, setSelectedBundleIds] = useState<string[]>([]);

  // ========== Normalizers ==========
  const toNumber = (v: any, def = 0) =>
    typeof v === "number" && !Number.isNaN(v) ? v : Number(v ?? def) || def;

  const normalizeMealBlock = (raw: any): DayMealBlock | undefined => {
    if (!raw) return undefined;

    const calories = toNumber(raw.totalCalories || raw.calories);
    const carbs = toNumber(raw.totalCarbs || raw.carbs);
    const protein = toNumber(raw.totalProtein || raw.protein);
    const fat = toNumber(raw.totalFat || raw.fat);

    const rawItems = raw.foods || raw.meals || raw.items || [];
    const meals: DayMealFood[] = Array.isArray(rawItems)
      ? rawItems.map((it: any) => ({
          name: String(it?.foodName || it?.name || ""),
          calories: toNumber(it?.calories),
          carbs: toNumber(it?.carbs),
          protein: toNumber(it?.protein),
          fat: toNumber(it?.fat),
        }))
      : [];

    return { calories, carbs, protein, fat, meals };
  };
  const normalizeDay = (raw: any): DayMeal => {
    const totalCalories = toNumber(raw?.totalCalories);
    const carbs = toNumber(raw?.totalCarbs || raw?.carbs);
    const protein = toNumber(raw?.totalProtein || raw?.protein);
    const fat = toNumber(raw?.totalFat || raw?.fat);

    // meals 배열에서 찾기
    const mealsArray = raw?.meals || [];

    let breakfast = normalizeMealBlock(
      mealsArray.find((m: any) => m.mealType === "BREAKFAST") || raw?.breakfast
    );
    let lunch = normalizeMealBlock(
      mealsArray.find((m: any) => m.mealType === "LUNCH") || raw?.lunch
    );
    let dinner = normalizeMealBlock(
      mealsArray.find((m: any) => m.mealType === "DINNER") || raw?.dinner
    );

    // ✅ SNACK 처리: BREAKFAST, LUNCH, DINNER가 없으면 SNACK을 순서대로 매핑
    if (!breakfast && !lunch && !dinner) {
      const snacks = mealsArray.filter((m: any) => m.mealType === "SNACK");

      if (snacks.length >= 1) breakfast = normalizeMealBlock(snacks[0]);
      if (snacks.length >= 2) lunch = normalizeMealBlock(snacks[1]);
      if (snacks.length >= 3) dinner = normalizeMealBlock(snacks[2]);

      console.log(
        `⚠️ SNACK 매핑: ${
          snacks.length
        }개 → 아침=${!!breakfast}, 점심=${!!lunch}, 저녁=${!!dinner}`
      );
    }

    return { totalCalories, carbs, protein, fat, breakfast, lunch, dinner };
  };

  // ========== 로컬 스토리지 ==========
  const loadLocalMeals = async (): Promise<LocalMeal[]> => {
    const results: LocalMeal[] = [];
    for (const key of LOCAL_KEYS) {
      try {
        const json = await AsyncStorage.getItem(key);
        if (!json) continue;
        const parsed = JSON.parse(json);
        if (!Array.isArray(parsed)) continue;

        parsed.forEach((item: any) => {
          if (!item?.id) return;

          const localMeal: LocalMeal = {
            id: String(item.id),
            bundleId: `local_${item.id}`,
            planName: item.planName || "로컬 식단",
            description: item.description || "",
            date: item.date || item.createdAt,
            meals: Array.isArray(item.meals)
              ? item.meals.map((m: any) => normalizeDay(m))
              : [],
            isServerMeal: false,
          };

          results.push(localMeal);
        });
      } catch (error) {
        console.error(`로컬 스토리지 읽기 실패 (${key}):`, error);
      }
    }
    return results;
  };

  // ========== 서버 API ==========
  const loadServerBundles = async (): Promise<SavedBundle[]> => {
    try {
      const plans = await recommendedMealAPI.getSavedMealPlans();

      console.log("📦 서버에서 받은 plans:", plans.length);

      // ✅ bundleId로 그룹화
      const bundleMap = new Map<string, SavedBundle>();

      plans.forEach((plan) => {
        if (!bundleMap.has(plan.bundleId)) {
          // 첫 번째 plan으로 번들 생성
          bundleMap.set(plan.bundleId, {
            bundleId: plan.bundleId,
            planName: plan.planName,
            description: "", // 나중에 채울 수 있음
            totalCalories: 0, // 평균으로 계산할 예정
            mealCount: 0,
            createdAt: plan.createdAt,
            planDate: plan.planDate,
            isServerMeal: true,
          });
        }

        // ✅ 번들 정보 업데이트
        const bundle = bundleMap.get(plan.bundleId)!;
        bundle.mealCount++;
        bundle.totalCalories += plan.totalCalories;
      });

      // ✅ 평균 칼로리 계산
      const bundles = Array.from(bundleMap.values()).map((bundle) => ({
        ...bundle,
        totalCalories: Math.round(
          bundle.totalCalories / (bundle.mealCount || 1)
        ),
      }));

      console.log("✅ 그룹화된 번들:", bundles.length);
      return bundles;
    } catch (error) {
      console.error("서버 번들 불러오기 실패:", error);
      return [];
    }
  };

  const loadBundleDetail = async (
    bundleId: string
  ): Promise<DayMeal[] | null> => {
    try {
      console.log("🔍 번들 상세 조회:", bundleId);

      const days = await recommendedMealAPI.getBundleDetail(bundleId);

      console.log("📦 받은 days:", days.length);

      const normalized = days.map((day) => {
        const result = normalizeDay(day);
        console.log("📊 normalized day:", {
          totalCalories: result.totalCalories,
          hasBreakfast: !!result.breakfast,
          hasLunch: !!result.lunch,
          hasDinner: !!result.dinner,
        });
        return result;
      });

      return normalized;
    } catch (error) {
      console.error("번들 상세 불러오기 실패:", error);
      return null;
    }
  };

  // ========== 통합 로드 ==========
  const loadAllBundles = async () => {
    try {
      setLoading(true);

      const [localMeals, serverBundles] = await Promise.all([
        loadLocalMeals(),
        loadServerBundles(),
      ]);

      // 로컬 식단을 번들 형식으로 변환
      const localBundles: SavedBundle[] = localMeals.map((meal) => ({
        bundleId: meal.bundleId,
        planName: meal.planName,
        description: meal.description,
        totalCalories: meal.meals?.[0]?.totalCalories || 0,
        mealCount: meal.meals?.length || 0,
        createdAt: meal.date || "",
        planDate: meal.date || "",
        isServerMeal: false,
        days: meal.meals,
      }));

      // 병합 및 정렬
      const allBundles = [...serverBundles, ...localBundles].sort((a, b) => {
        const dateA = new Date(a.createdAt || 0).getTime();
        const dateB = new Date(b.createdAt || 0).getTime();
        return dateB - dateA;
      });

      console.log("📦 전체 번들:", allBundles.length);
      console.log("- 서버:", serverBundles.length);
      console.log("- 로컬:", localBundles.length);

      setBundles(allBundles);
    } catch (error) {
      console.error("번들 불러오기 실패:", error);
      Alert.alert("오류", "식단을 불러오는데 실패했습니다.");
    } finally {
      setLoading(false);
    }
  };

  useFocusEffect(
    React.useCallback(() => {
      loadAllBundles();
      setIsEditMode(false);
      setSelectedBundleIds([]);
    }, [])
  );

  // ========== 상세보기 ==========
  const handleBundleClick = async (bundle: SavedBundle) => {
    if (isEditMode) {
      toggleBundleSelection(bundle.bundleId);
      return;
    }

    try {
      setLoading(true);

      let days = bundle.days;

      // 서버 번들이고 상세 데이터가 없으면 API 호출
      if (bundle.isServerMeal && !days) {
        days = await loadBundleDetail(bundle.bundleId);
        if (!days || days.length === 0) {
          Alert.alert("오류", "식단 상세 정보를 불러오지 못했습니다.");
          return;
        }
        // 캐시 저장
        bundle.days = days;
      }

      console.log("✅ 번들 상세 로드 완료:", days?.length, "일");

      setSelectedBundle(bundle);
      setSelectedDay(0);
    } catch (error: any) {
      console.error("번들 클릭 실패:", error);
      Alert.alert("오류", error.message || "식단을 불러오는데 실패했습니다.");
    } finally {
      setLoading(false);
    }
  };

  const handleBack = () => {
    setSelectedBundle(null);
    setSelectedDay(0);
  };

  // ========== 삭제 ==========
  const deleteLocalBundle = async (bundleId: string) => {
    for (const key of LOCAL_KEYS) {
      const json = await AsyncStorage.getItem(key);
      if (!json) continue;
      const arr = JSON.parse(json);
      if (!Array.isArray(arr)) continue;
      const filtered = arr.filter(
        (m: any) => `local_${m.id}` !== bundleId && m.id !== bundleId
      );
      await AsyncStorage.setItem(key, JSON.stringify(filtered));
    }
  };

  const handleDelete = async (bundle: SavedBundle) => {
    Alert.alert(
      "삭제",
      `"${bundle.planName}" 식단을 삭제하시겠습니까?\n(${
        bundle.mealCount || bundle.days?.length || 0
      }일치)`,
      [
        { text: "취소", style: "cancel" },
        {
          text: "삭제",
          style: "destructive",
          onPress: async () => {
            try {
              setLoading(true);

              if (bundle.isServerMeal) {
                console.log("🗑️ 서버 번들 삭제:", bundle.bundleId);
                await recommendedMealAPI.deleteBundle(bundle.bundleId);
              } else {
                console.log("🗑️ 로컬 번들 삭제:", bundle.bundleId);
                await deleteLocalBundle(bundle.bundleId);
              }

              setBundles((prev) =>
                prev.filter((b) => b.bundleId !== bundle.bundleId)
              );

              if (selectedBundle?.bundleId === bundle.bundleId) {
                setSelectedBundle(null);
              }

              Alert.alert("성공", "식단이 삭제되었습니다.");
            } catch (error: any) {
              console.error("삭제 실패:", error);
              Alert.alert("오류", error.message || "삭제에 실패했습니다.");
            } finally {
              setLoading(false);
            }
          },
        },
      ]
    );
  };

  // ========== 일괄 삭제 ==========
  const toggleBundleSelection = (bundleId: string) => {
    setSelectedBundleIds((prev) =>
      prev.includes(bundleId)
        ? prev.filter((id) => id !== bundleId)
        : [...prev, bundleId]
    );
  };

  const toggleSelectAll = () => {
    if (selectedBundleIds.length === bundles.length) {
      setSelectedBundleIds([]);
    } else {
      setSelectedBundleIds(bundles.map((b) => b.bundleId));
    }
  };

  const handleBulkDelete = async () => {
    if (selectedBundleIds.length === 0) {
      Alert.alert("알림", "삭제할 식단을 선택해주세요.");
      return;
    }

    Alert.alert(
      "일괄 삭제",
      `선택한 ${selectedBundleIds.length}개의 식단을 삭제하시겠습니까?`,
      [
        { text: "취소", style: "cancel" },
        {
          text: "삭제",
          style: "destructive",
          onPress: async () => {
            try {
              setLoading(true);

              const serverBundleIds: string[] = [];
              const localBundleIds: string[] = [];

              selectedBundleIds.forEach((id) => {
                const bundle = bundles.find((b) => b.bundleId === id);
                if (!bundle) return;

                if (bundle.isServerMeal) {
                  serverBundleIds.push(id);
                } else {
                  localBundleIds.push(id);
                }
              });

              // 서버 일괄 삭제
              if (serverBundleIds.length > 0) {
                console.log("🗑️ 서버 번들 일괄 삭제:", serverBundleIds);
                await recommendedMealAPI.deleteBulk(serverBundleIds);
              }

              // 로컬 삭제
              for (const bundleId of localBundleIds) {
                console.log("🗑️ 로컬 번들 삭제:", bundleId);
                await deleteLocalBundle(bundleId);
              }

              setBundles((prev) =>
                prev.filter((b) => !selectedBundleIds.includes(b.bundleId))
              );

              setSelectedBundleIds([]);
              setIsEditMode(false);

              Alert.alert(
                "성공",
                `${selectedBundleIds.length}개의 식단이 삭제되었습니다.`
              );
            } catch (error: any) {
              console.error("일괄 삭제 실패:", error);
              Alert.alert("오류", error.message || "삭제에 실패했습니다.");
            } finally {
              setLoading(false);
            }
          },
        },
      ]
    );
  };

  const currentDayMeal = selectedBundle?.days?.[selectedDay];

  return (
    <SafeAreaView style={styles.container} edges={["top"]}>
      <View style={styles.header}>
        <TouchableOpacity onPress={() => navigation.goBack()}>
          <Icon name="chevron-back" size={28} color="#ffffff" />
        </TouchableOpacity>
        <Text style={styles.headerTitle}>
          {selectedBundle ? "식단 상세보기" : "식단 추천 내역"}
        </Text>
        {!selectedBundle && bundles.length > 0 && (
          <TouchableOpacity
            onPress={() => {
              if (isEditMode) {
                setIsEditMode(false);
                setSelectedBundleIds([]);
              } else {
                setIsEditMode(true);
              }
            }}
          >
            <Text style={styles.editBtn}>{isEditMode ? "완료" : "편집"}</Text>
          </TouchableOpacity>
        )}
        {!bundles.length && <View style={{ width: 28 }} />}
      </View>

      {loading && (
        <View style={styles.loadingOverlay}>
          <ActivityIndicator size="large" color="#e3ff7c" />
          <Text style={styles.loadingText}>불러오는 중...</Text>
        </View>
      )}

      <ScrollView style={styles.content} showsVerticalScrollIndicator={false}>
        {!selectedBundle ? (
          bundles.length === 0 ? (
            <View style={styles.emptyState}>
              <Icon name="restaurant-outline" size={80} color="#666666" />
              <Text style={styles.emptyText}>저장된 식단이 없습니다.</Text>
              <Text style={styles.emptySubtitle}>
                식단 추천을 받고 저장해보세요!
              </Text>
              <TouchableOpacity
                style={styles.goToRecommendBtn}
                onPress={() => navigation.navigate("MealRecommend")}
              >
                <Text style={styles.goToRecommendBtnText}>
                  추천받으러 가기 →
                </Text>
              </TouchableOpacity>
            </View>
          ) : (
            <View style={styles.list}>
              {isEditMode && (
                <View style={styles.editToolbar}>
                  <TouchableOpacity
                    style={styles.selectAllBtn}
                    onPress={toggleSelectAll}
                  >
                    <Icon
                      name={
                        selectedBundleIds.length === bundles.length
                          ? "checkbox"
                          : "square-outline"
                      }
                      size={24}
                      color="#e3ff7c"
                    />
                    <Text style={styles.selectAllText}>
                      전체 선택 ({selectedBundleIds.length}/{bundles.length})
                    </Text>
                  </TouchableOpacity>
                  <TouchableOpacity
                    style={[
                      styles.bulkDeleteBtn,
                      selectedBundleIds.length === 0 &&
                        styles.bulkDeleteBtnDisabled,
                    ]}
                    onPress={handleBulkDelete}
                    disabled={selectedBundleIds.length === 0}
                  >
                    <Icon name="trash" size={20} color="#ffffff" />
                    <Text style={styles.bulkDeleteText}>삭제</Text>
                  </TouchableOpacity>
                </View>
              )}

              {!isEditMode && (
                <TouchableOpacity
                  style={styles.newRecommendBtn}
                  onPress={() => navigation.navigate("MealRecommend")}
                >
                  <Text style={styles.newRecommendBtnText}>
                    새 식단 추천받기
                  </Text>
                </TouchableOpacity>
              )}

              {bundles.map((bundle) => (
                <TouchableOpacity
                  key={bundle.bundleId}
                  style={[
                    styles.card,
                    isEditMode &&
                      selectedBundleIds.includes(bundle.bundleId) &&
                      styles.cardSelected,
                  ]}
                  onPress={() => handleBundleClick(bundle)}
                  activeOpacity={0.98}
                >
                  {isEditMode && (
                    <View style={styles.checkbox}>
                      <Icon
                        name={
                          selectedBundleIds.includes(bundle.bundleId)
                            ? "checkbox"
                            : "square-outline"
                        }
                        size={28}
                        color="#e3ff7c"
                      />
                    </View>
                  )}

                  <View style={styles.cardHeader}>
                    <View style={styles.dateContainer}>
                      <Text style={styles.dateIcon}>
                        {bundle.isServerMeal ? "☁️" : "📱"}
                      </Text>
                      <View>
                        <Text style={styles.planName}>{bundle.planName}</Text>
                        <Text style={styles.date}>
                          {new Date(bundle.createdAt).toLocaleDateString(
                            "ko-KR"
                          )}
                        </Text>
                      </View>
                    </View>
                    {!isEditMode && (
                      <TouchableOpacity
                        onPress={(e) => {
                          e.stopPropagation();
                          handleDelete(bundle);
                        }}
                        style={styles.deleteBtn}
                      >
                        <Icon name="trash-outline" size={20} color="#ef4444" />
                      </TouchableOpacity>
                    )}
                  </View>

                  <View style={styles.cardBody}>
                    {bundle.description && (
                      <Text style={styles.description} numberOfLines={2}>
                        {bundle.description}
                      </Text>
                    )}

                    <View style={styles.summary}>
                      <View style={styles.badge}>
                        <Text style={styles.badgeText}>
                          📅 {bundle.mealCount || bundle.days?.length || 0}일
                          식단
                        </Text>
                      </View>
                      <View style={[styles.badge, styles.caloriesBadge]}>
                        <Text style={styles.caloriesBadgeText}>
                          {bundle.totalCalories} kcal/일
                        </Text>
                      </View>
                      {bundle.isServerMeal && (
                        <View style={[styles.badge, styles.serverBadge]}>
                          <Text style={styles.serverBadgeText}>☁️ 서버</Text>
                        </View>
                      )}
                    </View>
                  </View>

                  {!isEditMode && (
                    <View style={styles.cardFooter}>
                      <Text style={styles.viewDetail}>자세히 보기 →</Text>
                    </View>
                  )}
                </TouchableOpacity>
              ))}
            </View>
          )
        ) : (
          <View style={styles.detail}>
            <TouchableOpacity style={styles.backBtn} onPress={handleBack}>
              <Text style={styles.backBtnText}>← 목록으로</Text>
            </TouchableOpacity>

            <View style={styles.detailInfo}>
              <View style={styles.detailHeader}>
                <View>
                  <Text style={styles.detailPlanName}>
                    {selectedBundle.planName}
                  </Text>
                  <Text style={styles.detailDate}>
                    {new Date(selectedBundle.createdAt).toLocaleDateString(
                      "ko-KR"
                    )}
                  </Text>
                </View>
                {selectedBundle.isServerMeal && (
                  <View style={[styles.badge, styles.serverBadge]}>
                    <Text style={styles.serverBadgeText}>☁️ 서버</Text>
                  </View>
                )}
              </View>

              {selectedBundle.description && (
                <Text style={styles.detailDescription}>
                  {selectedBundle.description}
                </Text>
              )}
            </View>

            {selectedBundle.days && selectedBundle.days.length > 0 && (
              <>
                <ScrollView
                  horizontal
                  showsHorizontalScrollIndicator={false}
                  style={styles.dayTabsContainer}
                  contentContainerStyle={styles.dayTabs}
                >
                  {selectedBundle.days.map((_: any, index: number) => (
                    <TouchableOpacity
                      key={index}
                      style={[
                        styles.dayTab,
                        selectedDay === index && styles.dayTabActive,
                      ]}
                      onPress={() => setSelectedDay(index)}
                    >
                      <Text
                        style={[
                          styles.dayTabText,
                          selectedDay === index && styles.dayTabTextActive,
                        ]}
                      >
                        {index + 1}일차
                      </Text>
                    </TouchableOpacity>
                  ))}
                </ScrollView>

                {currentDayMeal && (
                  <>
                    <View style={styles.nutritionCard}>
                      <Text style={styles.caloriesTotal}>
                        {currentDayMeal.totalCalories} kcal
                      </Text>
                      <View style={styles.nutritionGrid}>
                        <View style={styles.nutritionItem}>
                          <Text style={styles.nutritionLabel}>탄수화물</Text>
                          <Text style={styles.nutritionValue}>
                            {currentDayMeal.carbs}g
                          </Text>
                        </View>
                        <View style={styles.nutritionItem}>
                          <Text style={styles.nutritionLabel}>단백질</Text>
                          <Text style={styles.nutritionValue}>
                            {currentDayMeal.protein}g
                          </Text>
                        </View>
                        <View style={styles.nutritionItem}>
                          <Text style={styles.nutritionLabel}>지방</Text>
                          <Text style={styles.nutritionValue}>
                            {currentDayMeal.fat}g
                          </Text>
                        </View>
                      </View>
                    </View>

                    {currentDayMeal.breakfast && (
                      <View style={styles.mealSection}>
                        <View style={styles.mealSectionHeader}>
                          <Text style={styles.mealSectionTitle}>🌅 아침</Text>
                          <Text style={styles.mealSectionCalories}>
                            {currentDayMeal.breakfast.calories} kcal
                          </Text>
                        </View>
                        <View style={styles.mealItems}>
                          {currentDayMeal.breakfast.meals.map((item, index) => (
                            <View key={index} style={styles.mealItemDetail}>
                              <Text style={styles.mealItemName}>
                                {item.name}
                              </Text>
                              <View style={styles.mealItemNutrition}>
                                <Text style={styles.mealItemCalories}>
                                  {item.calories}kcal
                                </Text>
                                <Text style={styles.mealItemMacros}>
                                  탄{item.carbs}g · 단{item.protein}g · 지
                                  {item.fat}g
                                </Text>
                              </View>
                            </View>
                          ))}
                        </View>
                      </View>
                    )}

                    {currentDayMeal.lunch && (
                      <View style={styles.mealSection}>
                        <View style={styles.mealSectionHeader}>
                          <Text style={styles.mealSectionTitle}>☀️ 점심</Text>
                          <Text style={styles.mealSectionCalories}>
                            {currentDayMeal.lunch.calories} kcal
                          </Text>
                        </View>
                        <View style={styles.mealItems}>
                          {currentDayMeal.lunch.meals.map((item, index) => (
                            <View key={index} style={styles.mealItemDetail}>
                              <Text style={styles.mealItemName}>
                                {item.name}
                              </Text>
                              <View style={styles.mealItemNutrition}>
                                <Text style={styles.mealItemCalories}>
                                  {item.calories}kcal
                                </Text>
                                <Text style={styles.mealItemMacros}>
                                  탄{item.carbs}g · 단{item.protein}g · 지
                                  {item.fat}g
                                </Text>
                              </View>
                            </View>
                          ))}
                        </View>
                      </View>
                    )}

                    {currentDayMeal.dinner && (
                      <View style={styles.mealSection}>
                        <View style={styles.mealSectionHeader}>
                          <Text style={styles.mealSectionTitle}>🌙 저녁</Text>
                          <Text style={styles.mealSectionCalories}>
                            {currentDayMeal.dinner.calories} kcal
                          </Text>
                        </View>
                        <View style={styles.mealItems}>
                          {currentDayMeal.dinner.meals.map((item, index) => (
                            <View key={index} style={styles.mealItemDetail}>
                              <Text style={styles.mealItemName}>
                                {item.name}
                              </Text>
                              <View style={styles.mealItemNutrition}>
                                <Text style={styles.mealItemCalories}>
                                  {item.calories}kcal
                                </Text>
                                <Text style={styles.mealItemMacros}>
                                  탄{item.carbs}g · 단{item.protein}g · 지
                                  {item.fat}g
                                </Text>
                              </View>
                            </View>
                          ))}
                        </View>
                      </View>
                    )}
                  </>
                )}
              </>
            )}
          </View>
        )}
      </ScrollView>
    </SafeAreaView>
  );
};

const styles = StyleSheet.create({
  container: { flex: 1, backgroundColor: "#1a1a1a" },
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
    flex: 1,
    textAlign: "center",
  },
  editBtn: { fontSize: 16, fontWeight: "600", color: "#e3ff7c" },
  loadingOverlay: {
    position: "absolute",
    top: 0,
    left: 0,
    right: 0,
    bottom: 0,
    backgroundColor: "rgba(0,0,0,0.7)",
    justifyContent: "center",
    alignItems: "center",
    zIndex: 999,
  },
  loadingText: {
    color: "#ffffff",
    fontSize: 16,
    marginTop: 12,
    fontWeight: "600",
  },
  content: { flex: 1, padding: 20 },
  emptyState: {
    alignItems: "center",
    paddingVertical: 60,
    paddingHorizontal: 20,
  },
  emptyText: {
    fontSize: 16,
    color: "#999999",
    textAlign: "center",
    marginTop: 20,
    marginBottom: 10,
  },
  emptySubtitle: {
    fontSize: 14,
    color: "#666666",
    textAlign: "center",
    marginBottom: 24,
  },
  goToRecommendBtn: {
    backgroundColor: "#e3ff7c",
    paddingVertical: 12,
    paddingHorizontal: 24,
    borderRadius: 12,
    marginTop: 16,
  },
  goToRecommendBtnText: { fontSize: 15, fontWeight: "600", color: "#111111" },
  list: { gap: 16 },
  // ✅ 편집 모드 툴바
  editToolbar: {
    flexDirection: "row",
    justifyContent: "space-between",
    alignItems: "center",
    backgroundColor: "#222222",
    padding: 16,
    borderRadius: 12,
    marginBottom: 12,
  },
  selectAllBtn: { flexDirection: "row", alignItems: "center", gap: 8 },
  selectAllText: { fontSize: 14, fontWeight: "600", color: "#ffffff" },
  bulkDeleteBtn: {
    flexDirection: "row",
    alignItems: "center",
    gap: 6,
    backgroundColor: "#ef4444",
    paddingVertical: 8,
    paddingHorizontal: 16,
    borderRadius: 8,
  },
  bulkDeleteBtnDisabled: { backgroundColor: "#666666", opacity: 0.5 },
  bulkDeleteText: { fontSize: 14, fontWeight: "600", color: "#ffffff" },
  newRecommendBtn: {
    backgroundColor: "#e3ff7c",
    paddingVertical: 10,
    paddingHorizontal: 16,
    borderRadius: 8,
    alignSelf: "flex-start",
    marginBottom: 8,
  },
  newRecommendBtnText: { fontSize: 14, fontWeight: "600", color: "#111111" },
  card: {
    backgroundColor: "#222222",
    borderRadius: 12,
    padding: 16,
    borderWidth: 2,
    borderColor: "transparent",
  },
  cardSelected: { borderColor: "#e3ff7c", backgroundColor: "#2a2a1a" },
  checkbox: { position: "absolute", top: 12, left: 12, zIndex: 10 },
  cardHeader: {
    flexDirection: "row",
    justifyContent: "space-between",
    alignItems: "center",
    marginBottom: 12,
  },
  dateContainer: {
    flexDirection: "row",
    alignItems: "center",
    gap: 12,
    flex: 1,
  },
  dateIcon: { fontSize: 24 },
  planName: {
    fontSize: 16,
    fontWeight: "700",
    color: "#ffffff",
    marginBottom: 2,
  },
  date: { fontSize: 13, fontWeight: "500", color: "#999999" },
  deleteBtn: { padding: 4 },
  cardBody: { marginBottom: 12, gap: 8 },
  description: { fontSize: 14, color: "#cccccc", lineHeight: 20 },
  summary: { flexDirection: "row", flexWrap: "wrap", gap: 8 },
  badge: {
    paddingVertical: 4,
    paddingHorizontal: 10,
    borderRadius: 12,
    backgroundColor: "#4a90e2",
  },
  caloriesBadge: { backgroundColor: "#e3ff7c" },
  serverBadge: { backgroundColor: "#8b5cf6" },
  badgeText: { fontSize: 12, fontWeight: "500", color: "#ffffff" },
  caloriesBadgeText: { fontSize: 12, fontWeight: "500", color: "#111111" },
  serverBadgeText: { fontSize: 12, fontWeight: "500", color: "#ffffff" },
  cardFooter: { alignItems: "flex-end" },
  viewDetail: { fontSize: 14, color: "#e3ff7c", fontWeight: "500" },
  detail: { gap: 20 },
  backBtn: {
    backgroundColor: "#2a2a2a",
    paddingVertical: 10,
    paddingHorizontal: 16,
    borderRadius: 8,
    alignSelf: "flex-start",
  },
  backBtnText: { fontSize: 14, fontWeight: "500", color: "#ffffff" },
  detailInfo: { backgroundColor: "#222222", padding: 16, borderRadius: 12 },
  detailHeader: {
    flexDirection: "row",
    justifyContent: "space-between",
    alignItems: "flex-start",
    marginBottom: 8,
  },
  detailPlanName: {
    fontSize: 20,
    fontWeight: "700",
    color: "#ffffff",
    marginBottom: 4,
  },
  detailDate: { fontSize: 14, fontWeight: "500", color: "#999999" },
  detailDescription: {
    fontSize: 14,
    color: "#cccccc",
    lineHeight: 20,
    marginTop: 8,
  },
  dayTabsContainer: { marginVertical: 8 },
  dayTabs: { gap: 8, paddingBottom: 8 },
  dayTab: {
    paddingVertical: 8,
    paddingHorizontal: 16,
    backgroundColor: "#222222",
    borderRadius: 20,
  },
  dayTabActive: { backgroundColor: "#e3ff7c" },
  dayTabText: { fontSize: 13, fontWeight: "500", color: "#999999" },
  dayTabTextActive: { color: "#111111", fontWeight: "600" },
  nutritionCard: {
    backgroundColor: "#667eea",
    borderRadius: 16,
    padding: 20,
    alignItems: "center",
    minHeight: 140,
    justifyContent: "center",
  },
  caloriesTotal: {
    fontSize: 32,
    fontWeight: "700",
    color: "#ffffff",
    marginBottom: 16,
  },
  nutritionGrid: {
    flexDirection: "row",
    justifyContent: "space-around",
    width: "100%",
    gap: 16,
  },
  nutritionItem: { alignItems: "center", gap: 4 },
  nutritionLabel: { fontSize: 12, color: "#ffffff", opacity: 0.8 },
  nutritionValue: { fontSize: 18, fontWeight: "600", color: "#ffffff" },
  mealSection: { backgroundColor: "#222222", borderRadius: 12, padding: 16 },
  mealSectionHeader: {
    flexDirection: "row",
    justifyContent: "space-between",
    alignItems: "center",
    marginBottom: 12,
    paddingBottom: 12,
    borderBottomWidth: 1,
    borderBottomColor: "#333333",
  },
  mealSectionTitle: { fontSize: 16, fontWeight: "600", color: "#ffffff" },
  mealSectionCalories: { fontSize: 14, fontWeight: "600", color: "#e3ff7c" },
  mealItems: { gap: 12 },
  mealItemDetail: {
    backgroundColor: "#2a2a2a",
    padding: 12,
    borderRadius: 8,
    flexDirection: "row",
    justifyContent: "space-between",
    alignItems: "center",
  },
  mealItemName: { fontSize: 14, fontWeight: "500", color: "#ffffff", flex: 1 },
  mealItemNutrition: { alignItems: "flex-end", gap: 4 },
  mealItemCalories: { fontSize: 13, fontWeight: "600", color: "#e3ff7c" },
  mealItemMacros: { fontSize: 11, color: "#999999" },
});

export default MealRecommendHistoryScreen;
