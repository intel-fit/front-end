// src/screens/MealRecommendHistoryScreen.tsx
import React, { useState } from "react";
import {
  View,
  Text,
  StyleSheet,
  ScrollView,
  TouchableOpacity,
  Alert,
} from "react-native";
import { SafeAreaView } from "react-native-safe-area-context";
import { useFocusEffect } from "@react-navigation/native";
import { Ionicons as Icon } from "@expo/vector-icons";
import AsyncStorage from "@react-native-async-storage/async-storage";

type DayMealFood = {
  name?: string;
  calories?: number;
  carbs?: number;
  protein?: number;
  fat?: number;
};

type DayMealBlock = {
  calories?: number;
  meals?: DayMealFood[];
};

type DayMeal = {
  // 총합
  totalCalories?: number;
  carbs?: number;
  protein?: number;
  fat?: number;
  // 끼니별
  breakfast?: DayMealBlock;
  lunch?: DayMealBlock;
  dinner?: DayMealBlock;
};

type SavedMeal = {
  id: number | string;
  date?: string; // "YYYY.MM.DD" 등
  // 7일치 배열
  meals?: DayMeal[];
};

const LOCAL_KEYS = ["savedMeals", "savedMealPlans"] as const;

const MealRecommendHistoryScreen = ({ navigation }: any) => {
  const [savedMeals, setSavedMeals] = useState<SavedMeal[]>([]);
  const [selectedMeal, setSelectedMeal] = useState<SavedMeal | null>(null);
  const [selectedDay, setSelectedDay] = useState(0);

  // ---------- Normalizers ----------
  const toNumber = (v: any, def = 0) =>
    typeof v === "number" && !Number.isNaN(v) ? v : Number(v ?? def) || def;

  /** 끼니 블록 표준화 */
  const normalizeMealBlock = (raw: any): DayMealBlock | undefined => {
    if (!raw) return undefined;
    const calories = toNumber(raw.calories);
    // 아이템 배열 호환: foods, items, meals 등으로 들어왔을 수 있음
    const rawItems =
      raw.meals || raw.items || raw.foods || raw.list || raw.entries || [];
    const meals: DayMealFood[] = Array.isArray(rawItems)
      ? rawItems.map((it: any) => ({
          name: String(it?.name ?? it?.foodName ?? it?.title ?? ""),
          calories: toNumber(it?.calories),
          carbs: toNumber(it?.carbs),
          protein: toNumber(it?.protein),
          fat: toNumber(it?.fat),
        }))
      : [];
    return { calories, meals };
  };

  /** 하루 식단 표준화 */
  const normalizeDay = (raw: any): DayMeal => {
    // 총합
    const totalCalories = toNumber(
      raw?.totalCalories ?? raw?.calories ?? raw?.kcal
    );
    const carbs = toNumber(raw?.carbs ?? raw?.totalCarbs);
    const protein = toNumber(raw?.protein ?? raw?.totalProtein);
    const fat = toNumber(raw?.fat ?? raw?.totalFat);

    // 끼니별: 다양한 키 네이밍을 호환
    const breakfast =
      normalizeMealBlock(
        raw?.breakfast ??
          raw?.morning ??
          raw?.am ??
          raw?.B ??
          raw?.아침 ??
          raw?.["1"]
      ) || undefined;
    const lunch =
      normalizeMealBlock(
        raw?.lunch ?? raw?.noon ?? raw?.pm1 ?? raw?.L ?? raw?.점심 ?? raw?.["2"]
      ) || undefined;
    const dinner =
      normalizeMealBlock(
        raw?.dinner ??
          raw?.evening ??
          raw?.pm2 ??
          raw?.D ??
          raw?.저녁 ??
          raw?.["3"]
      ) || undefined;

    return { totalCalories, carbs, protein, fat, breakfast, lunch, dinner };
  };

  /** 저장 객체 표준화 */
  const normalizeLocalMeal = (raw: any): SavedMeal | null => {
    if (!raw) return null;
    const id =
      raw?.id ?? raw?.mealId ?? `local-${raw?.createdAt ?? Date.now()}`;
    const date =
      raw?.date ||
      (raw?.createdAt
        ? new Date(raw.createdAt).toLocaleDateString("ko-KR")
        : undefined);

    // 7일 배열 다양한 키 호환
    let days: any[] =
      raw?.meals || raw?.days || raw?.week || raw?.plan || raw?.schedule || [];

    // 어떤 포맷은 day1..day7로 저장된 경우
    if (!Array.isArray(days) || days.length === 0) {
      const candidates = [
        raw?.day1,
        raw?.day2,
        raw?.day3,
        raw?.day4,
        raw?.day5,
        raw?.day6,
        raw?.day7,
      ].filter(Boolean);
      if (candidates.length) days = candidates;
    }

    // 하루 객체가 "total"과 끼니가 분리돼 있지 않은 단순 포맷일 경우 대응
    const meals: DayMeal[] = Array.isArray(days)
      ? days.map((d) => normalizeDay(d))
      : [];

    return { id, date, meals };
  };

  /** 배열 표준화 */
  const normalizeLocalArray = (arr: any[]): SavedMeal[] => {
    return arr
      .map(normalizeLocalMeal)
      .filter((x): x is SavedMeal => !!x && !!x.id);
  };

  /** 로컬에서 여러 키를 읽어 병합 */
  const loadMealsFromLocal = async (): Promise<SavedMeal[]> => {
    const buckets: SavedMeal[][] = [];
    for (const key of LOCAL_KEYS) {
      try {
        const json = await AsyncStorage.getItem(key);
        if (!json) continue;
        const parsed = JSON.parse(json);
        if (Array.isArray(parsed)) {
          buckets.push(normalizeLocalArray(parsed));
        }
      } catch (e) {
        // 무시하고 다음 키로
      }
    }
    // 병합 + 중복 제거(id) + 최신순(date/createdAt 추정)
    const map = new Map<string | number, SavedMeal>();
    buckets.flat().forEach((m) => {
      if (!map.has(m.id)) map.set(m.id, m);
    });
    const merged = Array.from(map.values()).sort((a, b) => {
      const ad = a.date ? new Date(a.date).getTime() : 0;
      const bd = b.date ? new Date(b.date).getTime() : 0;
      return bd - ad;
    });
    return merged;
  };

  // ---------- Storage I/O ----------
  const loadMeals = async () => {
    const merged = await loadMealsFromLocal();
    setSavedMeals(merged);
  };

  useFocusEffect(
    React.useCallback(() => {
      loadMeals();
    }, [])
  );

  const handleMealClick = (meal: SavedMeal) => {
    setSelectedMeal(meal);
    setSelectedDay(0);
  };

  const handleBack = () => {
    setSelectedMeal(null);
    setSelectedDay(0);
  };

  const deleteFromAllKeys = async (mealId: SavedMeal["id"]) => {
    for (const key of LOCAL_KEYS) {
      const json = await AsyncStorage.getItem(key);
      if (!json) continue;
      const arr = JSON.parse(json);
      if (!Array.isArray(arr)) continue;
      const filtered = arr.filter((m: any) => (m?.id ?? m?.mealId) !== mealId);
      await AsyncStorage.setItem(key, JSON.stringify(filtered));
    }
  };

  const handleDelete = async (mealId: SavedMeal["id"]) => {
    Alert.alert("삭제", "이 식단을 삭제하시겠습니까?", [
      { text: "취소", style: "cancel" },
      {
        text: "삭제",
        style: "destructive",
        onPress: async () => {
          await deleteFromAllKeys(mealId);
          const updated = savedMeals.filter((m) => m.id !== mealId);
          setSavedMeals(updated);
          if (selectedMeal && selectedMeal.id === mealId) {
            setSelectedMeal(null);
            setSelectedDay(0);
          }
        },
      },
    ]);
  };

  const currentDayMeal = selectedMeal?.meals?.[selectedDay];

  return (
    <SafeAreaView style={styles.container} edges={["top"]}>
      <View style={styles.header}>
        <TouchableOpacity onPress={() => navigation.goBack()}>
          <Icon name="chevron-back" size={28} color="#ffffff" />
        </TouchableOpacity>
        <Text style={styles.headerTitle}>
          {selectedMeal ? "식단 상세보기" : "식단 추천 내역"}
        </Text>
        <View style={{ width: 28 }} />
      </View>

      <ScrollView style={styles.content} showsVerticalScrollIndicator={false}>
        {!selectedMeal ? (
          savedMeals.length === 0 ? (
            <View style={styles.emptyState}>
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
              <TouchableOpacity
                style={styles.newRecommendBtn}
                onPress={() => navigation.navigate("MealRecommend")}
              >
                <Text style={styles.newRecommendBtnText}>새 식단 추천받기</Text>
              </TouchableOpacity>

              {savedMeals.map((meal) => (
                <TouchableOpacity
                  key={meal.id}
                  style={styles.card}
                  onPress={() => handleMealClick(meal)}
                  activeOpacity={0.98}
                >
                  <View style={styles.cardHeader}>
                    <View style={styles.dateContainer}>
                      <Text style={styles.dateIcon}>🍽️</Text>
                      <Text style={styles.date}>
                        {meal.date || "저장일 미상"}
                      </Text>
                    </View>
                    <TouchableOpacity
                      onPress={() => handleDelete(meal.id)}
                      style={styles.deleteBtn}
                      activeOpacity={0.9}
                    >
                      <Text style={styles.deleteBtnText}>🗑️</Text>
                    </TouchableOpacity>
                  </View>

                  <View style={styles.cardBody}>
                    <View style={styles.summary}>
                      <View style={styles.badge}>
                        <Text style={styles.badgeText}>📅 7일 식단</Text>
                      </View>
                      <View style={[styles.badge, styles.caloriesBadge]}>
                        <Text style={styles.caloriesBadgeText}>
                          {meal.meals?.[0]?.totalCalories ?? 0} kcal/일
                        </Text>
                      </View>
                    </View>

                    {meal.meals?.[0] && (
                      <View style={styles.nutritionSummary}>
                        <Text style={styles.nutritionText}>
                          탄 {meal.meals[0].carbs ?? 0}g
                        </Text>
                        <Text style={styles.nutritionText}>
                          단 {meal.meals[0].protein ?? 0}g
                        </Text>
                        <Text style={styles.nutritionText}>
                          지 {meal.meals[0].fat ?? 0}g
                        </Text>
                      </View>
                    )}
                  </View>

                  <View style={styles.cardFooter}>
                    <Text style={styles.viewDetail}>자세히 보기 →</Text>
                  </View>
                </TouchableOpacity>
              ))}
            </View>
          )
        ) : (
          <View style={styles.detail}>
            <TouchableOpacity
              style={styles.backBtn}
              onPress={handleBack}
              activeOpacity={0.95}
            >
              <Text style={styles.backBtnText}>← 목록으로</Text>
            </TouchableOpacity>

            <View style={styles.detailInfo}>
              <Text style={styles.detailDate}>
                {selectedMeal.date || "저장일 미상"}
              </Text>
              <View style={styles.detailSummary}>
                <View style={styles.detailBadge}>
                  <Text style={styles.detailBadgeText}>7일 식단</Text>
                </View>
              </View>
            </View>

            {selectedMeal.meals && selectedMeal.meals.length > 0 && (
              <>
                <ScrollView
                  horizontal
                  showsHorizontalScrollIndicator={false}
                  style={styles.dayTabsContainer}
                  contentContainerStyle={styles.dayTabs}
                >
                  {selectedMeal.meals.map((_: any, index: number) => (
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
                        {index + 1}일차
                      </Text>
                    </TouchableOpacity>
                  ))}
                </ScrollView>

                {currentDayMeal && (
                  <>
                    {/* 영양소 카드 */}
                    <View style={styles.nutritionCard}>
                      <Text style={styles.caloriesTotal}>
                        {currentDayMeal.totalCalories ?? 0} kcal
                      </Text>
                      <View style={styles.nutritionGrid}>
                        <View style={styles.nutritionItem}>
                          <Text style={styles.nutritionLabel}>탄수화물</Text>
                          <Text style={styles.nutritionValue}>
                            {currentDayMeal.carbs ?? 0}g
                          </Text>
                        </View>
                        <View style={styles.nutritionItem}>
                          <Text style={styles.nutritionLabel}>단백질</Text>
                          <Text style={styles.nutritionValue}>
                            {currentDayMeal.protein ?? 0}g
                          </Text>
                        </View>
                        <View style={styles.nutritionItem}>
                          <Text style={styles.nutritionLabel}>지방</Text>
                          <Text style={styles.nutritionValue}>
                            {currentDayMeal.fat ?? 0}g
                          </Text>
                        </View>
                      </View>
                    </View>

                    {/* 아침 */}
                    {currentDayMeal.breakfast && (
                      <View style={styles.mealSection}>
                        <View style={styles.mealSectionHeader}>
                          <Text style={styles.mealSectionTitle}>🌅 아침</Text>
                          <Text style={styles.mealSectionCalories}>
                            {currentDayMeal.breakfast.calories ?? 0} kcal
                          </Text>
                        </View>
                        <View style={styles.mealItems}>
                          {currentDayMeal.breakfast.meals?.map(
                            (item: any, index: number) => (
                              <View key={index} style={styles.mealItemDetail}>
                                <Text style={styles.mealItemName}>
                                  {item.name}
                                </Text>
                                <View style={styles.mealItemNutrition}>
                                  <Text style={styles.mealItemCalories}>
                                    {item.calories ?? 0}kcal
                                  </Text>
                                  <Text style={styles.mealItemMacros}>
                                    탄{item.carbs ?? 0}g · 단{item.protein ?? 0}
                                    g · 지{item.fat ?? 0}g
                                  </Text>
                                </View>
                              </View>
                            )
                          )}
                        </View>
                      </View>
                    )}

                    {/* 점심 */}
                    {currentDayMeal.lunch && (
                      <View style={styles.mealSection}>
                        <View style={styles.mealSectionHeader}>
                          <Text style={styles.mealSectionTitle}>☀️ 점심</Text>
                          <Text style={styles.mealSectionCalories}>
                            {currentDayMeal.lunch.calories ?? 0} kcal
                          </Text>
                        </View>
                        <View style={styles.mealItems}>
                          {currentDayMeal.lunch.meals?.map(
                            (item: any, index: number) => (
                              <View key={index} style={styles.mealItemDetail}>
                                <Text style={styles.mealItemName}>
                                  {item.name}
                                </Text>
                                <View style={styles.mealItemNutrition}>
                                  <Text style={styles.mealItemCalories}>
                                    {item.calories ?? 0}kcal
                                  </Text>
                                  <Text style={styles.mealItemMacros}>
                                    탄{item.carbs ?? 0}g · 단{item.protein ?? 0}
                                    g · 지{item.fat ?? 0}g
                                  </Text>
                                </View>
                              </View>
                            )
                          )}
                        </View>
                      </View>
                    )}

                    {/* 저녁 */}
                    {currentDayMeal.dinner && (
                      <View style={styles.mealSection}>
                        <View style={styles.mealSectionHeader}>
                          <Text style={styles.mealSectionTitle}>🌙 저녁</Text>
                          <Text style={styles.mealSectionCalories}>
                            {currentDayMeal.dinner.calories ?? 0} kcal
                          </Text>
                        </View>
                        <View style={styles.mealItems}>
                          {currentDayMeal.dinner.meals?.map(
                            (item: any, index: number) => (
                              <View key={index} style={styles.mealItemDetail}>
                                <Text style={styles.mealItemName}>
                                  {item.name}
                                </Text>
                                <View style={styles.mealItemNutrition}>
                                  <Text style={styles.mealItemCalories}>
                                    {item.calories ?? 0}kcal
                                  </Text>
                                  <Text style={styles.mealItemMacros}>
                                    탄{item.carbs ?? 0}g · 단{item.protein ?? 0}
                                    g · 지{item.fat ?? 0}g
                                  </Text>
                                </View>
                              </View>
                            )
                          )}
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
  headerTitle: { fontSize: 20, fontWeight: "700", color: "#ffffff" },
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
  cardHeader: {
    flexDirection: "row",
    justifyContent: "space-between",
    alignItems: "center",
    marginBottom: 12,
  },
  dateContainer: { flexDirection: "row", alignItems: "center", gap: 8 },
  dateIcon: { fontSize: 18 },
  date: { fontSize: 16, fontWeight: "600", color: "#ffffff" },
  deleteBtn: { padding: 4 },
  deleteBtnText: { fontSize: 18 },
  cardBody: { marginBottom: 12 },
  summary: { flexDirection: "row", flexWrap: "wrap", gap: 8, marginBottom: 8 },
  badge: {
    paddingVertical: 4,
    paddingHorizontal: 10,
    borderRadius: 12,
    backgroundColor: "#4a90e2",
  },
  caloriesBadge: { backgroundColor: "#e3ff7c" },
  badgeText: { fontSize: 12, fontWeight: "500", color: "#ffffff" },
  caloriesBadgeText: { fontSize: 12, fontWeight: "500", color: "#111111" },
  nutritionSummary: { flexDirection: "row", gap: 12 },
  nutritionText: { fontSize: 13, color: "#999999" },
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
  detailDate: {
    fontSize: 18,
    fontWeight: "700",
    color: "#ffffff",
    marginBottom: 12,
  },
  detailSummary: { flexDirection: "row", flexWrap: "wrap", gap: 8 },
  detailBadge: {
    paddingVertical: 6,
    paddingHorizontal: 12,
    borderRadius: 12,
    backgroundColor: "#e3ff7c",
  },
  detailBadgeText: { fontSize: 13, fontWeight: "500", color: "#111111" },
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
