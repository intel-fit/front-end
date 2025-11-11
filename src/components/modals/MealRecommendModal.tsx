// src/components/MealRecommendModal.tsx
import React, { useState } from "react";
import {
  View,
  Text,
  Modal,
  TouchableOpacity,
  StyleSheet,
  ScrollView,
  Alert,
  ActivityIndicator,
} from "react-native";
import { Ionicons as Icon } from "@expo/vector-icons";
import { colors } from "../../theme/colors";
import { authAPI } from "../../services";

interface MealRecommendModalProps {
  isOpen: boolean;
  onClose: () => void;
}

const MealRecommendModal: React.FC<MealRecommendModalProps> = ({
  isOpen,
  onClose,
}) => {
  const [savedMeals, setSavedMeals] = useState<any[]>([]);
  const [selectedMeal, setSelectedMeal] = useState<any>(null);
  const [loading, setLoading] = useState(false);

  React.useEffect(() => {
    if (isOpen) {
      loadMeals();
    }
  }, [isOpen]);

  // ✅ API에서 저장된 식단 불러오기
  const loadMeals = async () => {
    try {
      setLoading(true);
      const meals = await authAPI.getSavedMealPlans();
      setSavedMeals(meals);
    } catch (error) {
      console.error("저장된 식단 불러오기 실패:", error);
      Alert.alert("오류", "저장된 식단을 불러오는데 실패했습니다.");
    } finally {
      setLoading(false);
    }
  };

  // ✅ API로 식단 삭제
  const handleDelete = async (mealId: number) => {
    Alert.alert("삭제", "이 식단을 삭제하시겠습니까?", [
      { text: "취소", style: "cancel" },
      {
        text: "삭제",
        style: "destructive",
        onPress: async () => {
          try {
            setLoading(true);
            const response = await authAPI.deleteMealPlan(mealId);

            if (response.success) {
              await loadMeals(); // 목록 새로고침
              if (selectedMeal && selectedMeal.id === mealId) {
                setSelectedMeal(null);
              }
              Alert.alert("성공", response.message || "식단이 삭제되었습니다.");
            } else {
              Alert.alert(
                "오류",
                response.message || "식단 삭제에 실패했습니다."
              );
            }
          } catch (error: any) {
            console.error("식단 삭제 실패:", error);
            Alert.alert("오류", error.message || "식단 삭제에 실패했습니다.");
          } finally {
            setLoading(false);
          }
        },
      },
    ]);
  };

  // ✅ 식단 상세 정보 렌더링
  const renderMealDetail = (meal: any) => {
    return (
      <View style={styles.detail}>
        <TouchableOpacity
          style={styles.backBtn}
          onPress={() => setSelectedMeal(null)}
        >
          <Icon name="arrow-back" size={20} color={colors.text} />
          <Text style={styles.backBtnText}>목록으로</Text>
        </TouchableOpacity>

        <View style={styles.detailHeader}>
          <Text style={styles.detailTitle}>{meal.planName || "식단 계획"}</Text>
          <TouchableOpacity
            onPress={() => handleDelete(meal.id)}
            style={styles.deleteBtn}
          >
            <Icon name="trash" size={20} color={colors.error} />
          </TouchableOpacity>
        </View>

        {meal.description && (
          <Text style={styles.detailDescription}>{meal.description}</Text>
        )}

        {meal.recommendationReason && (
          <View style={styles.recommendBox}>
            <Text style={styles.recommendLabel}>💡 추천 이유</Text>
            <Text style={styles.recommendText}>
              {meal.recommendationReason}
            </Text>
          </View>
        )}

        <View style={styles.nutritionSummary}>
          <View style={styles.nutritionItem}>
            <Text style={styles.nutritionLabel}>총 칼로리</Text>
            <Text style={styles.nutritionValue}>
              {meal.totalCalories || 0} kcal
            </Text>
          </View>
          <View style={styles.nutritionItem}>
            <Text style={styles.nutritionLabel}>탄수화물</Text>
            <Text style={styles.nutritionValue}>{meal.totalCarbs || 0}g</Text>
          </View>
          <View style={styles.nutritionItem}>
            <Text style={styles.nutritionLabel}>단백질</Text>
            <Text style={styles.nutritionValue}>{meal.totalProtein || 0}g</Text>
          </View>
          <View style={styles.nutritionItem}>
            <Text style={styles.nutritionLabel}>지방</Text>
            <Text style={styles.nutritionValue}>{meal.totalFat || 0}g</Text>
          </View>
        </View>

        {meal.meals && meal.meals.length > 0 && (
          <View style={styles.mealsSection}>
            <Text style={styles.sectionTitle}>식단 구성</Text>
            {meal.meals.map((mealItem: any, index: number) => (
              <View key={index} style={styles.mealItem}>
                <View style={styles.mealItemHeader}>
                  <Text style={styles.mealTypeName}>
                    {mealItem.mealTypeName || mealItem.mealType}
                  </Text>
                  <Text style={styles.mealCalories}>
                    {mealItem.totalCalories || 0} kcal
                  </Text>
                </View>
                <View style={styles.mealNutrients}>
                  <Text style={styles.nutrientText}>
                    탄 {mealItem.totalCarbs || 0}g
                  </Text>
                  <Text style={styles.nutrientText}>
                    단 {mealItem.totalProtein || 0}g
                  </Text>
                  <Text style={styles.nutrientText}>
                    지 {mealItem.totalFat || 0}g
                  </Text>
                </View>
                {mealItem.foods && mealItem.foods.length > 0 && (
                  <View style={styles.foodsList}>
                    {mealItem.foods.map((food: any, foodIndex: number) => (
                      <View key={foodIndex} style={styles.foodItem}>
                        <Text style={styles.foodName}>• {food.foodName}</Text>
                        <Text style={styles.foodCalories}>
                          {food.calories}kcal
                        </Text>
                      </View>
                    ))}
                  </View>
                )}
              </View>
            ))}
          </View>
        )}

        {meal.createdAt && (
          <Text style={styles.createdAt}>
            생성일: {new Date(meal.createdAt).toLocaleDateString("ko-KR")}
          </Text>
        )}
      </View>
    );
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
          <View style={styles.header}>
            <Text style={styles.title}>
              {selectedMeal ? "식단 상세보기" : "식단 추천 내역"}
            </Text>
            <TouchableOpacity onPress={onClose} style={styles.closeBtn}>
              <Icon name="close" size={24} color={colors.text} />
            </TouchableOpacity>
          </View>

          <ScrollView style={styles.body}>
            {loading ? (
              <View style={styles.emptyState}>
                <ActivityIndicator size="large" color="#8b5cf6" />
                <Text style={styles.emptyText}>불러오는 중...</Text>
              </View>
            ) : !selectedMeal ? (
              savedMeals.length === 0 ? (
                <View style={styles.emptyState}>
                  <Icon name="restaurant-outline" size={64} color="#666666" />
                  <Text style={styles.emptyText}>저장된 식단이 없습니다.</Text>
                  <Text style={styles.emptySubtitle}>
                    식단 추천을 받고 저장해보세요!
                  </Text>
                </View>
              ) : (
                <View style={styles.list}>
                  {savedMeals.map((meal) => (
                    <TouchableOpacity
                      key={meal.id}
                      style={styles.card}
                      onPress={() => setSelectedMeal(meal)}
                    >
                      <View style={styles.cardHeader}>
                        <Text style={styles.date}>
                          🍽️ {meal.planName || "식단 계획"}
                        </Text>
                        <TouchableOpacity
                          onPress={(e) => {
                            e.stopPropagation();
                            handleDelete(meal.id);
                          }}
                          style={styles.deleteBtn}
                        >
                          <Icon name="trash" size={20} color={colors.error} />
                        </TouchableOpacity>
                      </View>

                      <View style={styles.cardBody}>
                        {meal.description && (
                          <Text style={styles.description} numberOfLines={2}>
                            {meal.description}
                          </Text>
                        )}
                        <View style={styles.summary}>
                          <View style={styles.badge}>
                            <Text style={styles.badgeText}>
                              {meal.totalCalories || 0} kcal
                            </Text>
                          </View>
                          <View style={styles.badge}>
                            <Text style={styles.badgeText}>
                              탄 {meal.totalCarbs || 0}g
                            </Text>
                          </View>
                          <View style={styles.badge}>
                            <Text style={styles.badgeText}>
                              단 {meal.totalProtein || 0}g
                            </Text>
                          </View>
                          <View style={styles.badge}>
                            <Text style={styles.badgeText}>
                              지 {meal.totalFat || 0}g
                            </Text>
                          </View>
                        </View>
                        {meal.createdAt && (
                          <Text style={styles.cardDate}>
                            {new Date(meal.createdAt).toLocaleDateString(
                              "ko-KR"
                            )}
                          </Text>
                        )}
                      </View>
                      <Text style={styles.viewDetail}>자세히 보기 →</Text>
                    </TouchableOpacity>
                  ))}
                </View>
              )
            ) : (
              renderMealDetail(selectedMeal)
            )}
          </ScrollView>
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
    backgroundColor: colors.cardBackground,
    borderTopLeftRadius: 20,
    borderTopRightRadius: 20,
    maxHeight: "90%",
  },
  header: {
    flexDirection: "row",
    justifyContent: "space-between",
    alignItems: "center",
    padding: 20,
    borderBottomWidth: 1,
    borderBottomColor: colors.border,
  },
  title: {
    fontSize: 20,
    fontWeight: "700",
    color: colors.text,
  },
  closeBtn: { padding: 4 },
  body: { padding: 20 },
  emptyState: { alignItems: "center", padding: 40, gap: 12 },
  emptyText: { fontSize: 16, color: colors.text, textAlign: "center" },
  emptySubtitle: { fontSize: 14, color: colors.textLight, textAlign: "center" },
  list: { gap: 12 },
  card: {
    backgroundColor: colors.grayLight,
    padding: 16,
    borderRadius: 12,
    gap: 12,
  },
  cardHeader: {
    flexDirection: "row",
    justifyContent: "space-between",
    alignItems: "center",
  },
  date: { fontSize: 16, fontWeight: "600", color: colors.text, flex: 1 },
  deleteBtn: { padding: 4 },
  cardBody: { gap: 8 },
  description: { fontSize: 14, color: colors.textLight, lineHeight: 20 },
  summary: { flexDirection: "row", flexWrap: "wrap", gap: 8 },
  badge: {
    backgroundColor: colors.primary + "20",
    paddingHorizontal: 12,
    paddingVertical: 4,
    borderRadius: 12,
  },
  badgeText: { fontSize: 12, color: colors.primary, fontWeight: "500" },
  cardDate: { fontSize: 12, color: colors.textLight, marginTop: 4 },
  viewDetail: { fontSize: 14, color: colors.primary, fontWeight: "500" },
  detail: { gap: 16 },
  backBtn: {
    flexDirection: "row",
    alignItems: "center",
    gap: 8,
    padding: 8,
    marginBottom: 8,
  },
  backBtnText: { fontSize: 16, color: colors.text },
  detailHeader: {
    flexDirection: "row",
    justifyContent: "space-between",
    alignItems: "center",
  },
  detailTitle: { fontSize: 20, fontWeight: "700", color: colors.text, flex: 1 },
  detailDescription: { fontSize: 14, color: colors.textLight, lineHeight: 20 },
  recommendBox: {
    backgroundColor: colors.primary + "15",
    padding: 16,
    borderRadius: 12,
    borderLeftWidth: 4,
    borderLeftColor: colors.primary,
  },
  recommendLabel: {
    fontSize: 14,
    fontWeight: "600",
    color: colors.text,
    marginBottom: 8,
  },
  recommendText: { fontSize: 14, color: colors.text, lineHeight: 20 },
  nutritionSummary: {
    flexDirection: "row",
    justifyContent: "space-between",
    backgroundColor: colors.grayLight,
    padding: 16,
    borderRadius: 12,
    gap: 8,
  },
  nutritionItem: { flex: 1, alignItems: "center" },
  nutritionLabel: { fontSize: 12, color: colors.textLight, marginBottom: 4 },
  nutritionValue: { fontSize: 16, fontWeight: "700", color: colors.primary },
  mealsSection: { gap: 12 },
  sectionTitle: {
    fontSize: 16,
    fontWeight: "600",
    color: colors.text,
    marginBottom: 4,
  },
  mealItem: {
    backgroundColor: colors.grayLight,
    padding: 16,
    borderRadius: 12,
    gap: 8,
  },
  mealItemHeader: {
    flexDirection: "row",
    justifyContent: "space-between",
    alignItems: "center",
  },
  mealTypeName: { fontSize: 16, fontWeight: "600", color: colors.text },
  mealCalories: { fontSize: 14, fontWeight: "600", color: colors.primary },
  mealNutrients: { flexDirection: "row", gap: 12 },
  nutrientText: { fontSize: 12, color: colors.textLight },
  foodsList: { marginTop: 8, gap: 6 },
  foodItem: {
    flexDirection: "row",
    justifyContent: "space-between",
    alignItems: "center",
    paddingVertical: 4,
  },
  foodName: { fontSize: 14, color: colors.text, flex: 1 },
  foodCalories: { fontSize: 12, color: colors.textLight },
  createdAt: {
    fontSize: 12,
    color: colors.textLight,
    textAlign: "center",
    marginTop: 8,
  },
});

export default MealRecommendModal;
