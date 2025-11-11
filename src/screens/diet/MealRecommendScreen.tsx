// src/screens/MealRecommendScreen.tsx
import React, { useState, useEffect } from "react";
import {
  View,
  Text,
  StyleSheet,
  ScrollView,
  TouchableOpacity,
  TextInput,
  Alert,
  ActivityIndicator,
} from "react-native";
import { SafeAreaView } from "react-native-safe-area-context";
import { Ionicons as Icon } from "@expo/vector-icons";
import AsyncStorage from "@react-native-async-storage/async-storage";
import { useNavigation } from "@react-navigation/native";
import { authAPI, recommendedMealAPI } from "../../services";

// 메인 서버 응답을 UI용으로 변환
const transformApiResponseToUI = (apiData: any) => {
  const breakfast = apiData.meals.find((m: any) => m.mealType === "BREAKFAST");
  const lunch = apiData.meals.find((m: any) => m.mealType === "LUNCH");
  const dinner = apiData.meals.find((m: any) => m.mealType === "DINNER");

  const today = new Date();

  return {
    day: 1,
    date: `${today.getMonth() + 1}/${today.getDate()}`,
    fullDate: today.toLocaleDateString("ko-KR", {
      month: "long",
      day: "numeric",
      weekday: "short",
    }),
    planId: apiData.id,
    planName: apiData.planName,
    description: apiData.description,
    recommendationReason: apiData.recommendationReason,
    totalCalories: apiData.totalCalories,
    carbs: apiData.totalCarbs,
    protein: apiData.totalProtein,
    fat: apiData.totalFat,
    isSaved: apiData.isSaved,
    breakfast: {
      meals:
        breakfast?.foods.map((f: any) => ({
          name: f.foodName,
          calories: f.calories,
          carbs: f.carbs,
          protein: f.protein,
          fat: f.fat,
        })) || [],
      calories: breakfast?.totalCalories || 0,
      carbs: breakfast?.totalCarbs || 0,
      protein: breakfast?.totalProtein || 0,
      fat: breakfast?.totalFat || 0,
    },
    lunch: {
      meals:
        lunch?.foods.map((f: any) => ({
          name: f.foodName,
          calories: f.calories,
          carbs: f.carbs,
          protein: f.protein,
          fat: f.fat,
        })) || [],
      calories: lunch?.totalCalories || 0,
      carbs: lunch?.totalCarbs || 0,
      protein: lunch?.totalProtein || 0,
      fat: lunch?.totalFat || 0,
    },
    dinner: {
      meals:
        dinner?.foods.map((f: any) => ({
          name: f.foodName,
          calories: f.calories,
          carbs: f.carbs,
          protein: f.protein,
          fat: f.fat,
        })) || [],
      calories: dinner?.totalCalories || 0,
      carbs: dinner?.totalCarbs || 0,
      protein: dinner?.totalProtein || 0,
      fat: dinner?.totalFat || 0,
    },
  };
};

// AI 서버 응답을 UI용으로 변환
const transformAIResponseToUI = (aiData: any) => {
  const meal1 = aiData.meals.find((m: any) => m.meal_type === "meal_1");
  const meal2 = aiData.meals.find((m: any) => m.meal_type === "meal_2");
  const meal3 = aiData.meals.find((m: any) => m.meal_type === "meal_3");

  const parseDate = (dateStr: string) => {
    const date = new Date(dateStr);
    return date;
  };

  const date = parseDate(aiData.date);

  return {
    day: 1,
    date: `${date.getMonth() + 1}/${date.getDate()}`,
    fullDate: date.toLocaleDateString("ko-KR", {
      month: "long",
      day: "numeric",
      weekday: "short",
    }),
    planId: null, // AI 서버는 planId 없음
    planName: `${
      aiData.goal === "maintain"
        ? "유지"
        : aiData.goal === "cut"
        ? "감량"
        : "증량"
    } 식단`,
    description: `AI가 생성한 ${
      aiData.goal === "maintain"
        ? "유지"
        : aiData.goal === "cut"
        ? "감량"
        : "증량"
    } 하루 식단`,
    recommendationReason: `목표 칼로리: ${Math.round(
      aiData.target_daily_calories
    )}kcal`,
    totalCalories: Math.round(aiData.target_daily_calories),
    carbs: Math.round(aiData.target_carbs),
    protein: Math.round(aiData.target_protein),
    fat: Math.round(aiData.target_fat),
    isSaved: false,
    breakfast: {
      meals:
        meal1?.foods.map((f: any) => ({
          name: f.name,
          calories: Math.round(f.calories),
          carbs: Math.round(f.carbs),
          protein: Math.round(f.protein),
          fat: Math.round(f.fat),
        })) || [],
      calories: Math.round(meal1?.actual_calories || 0),
      carbs: Math.round(meal1?.actual_carbs || 0),
      protein: Math.round(meal1?.actual_protein || 0),
      fat: Math.round(meal1?.actual_fat || 0),
    },
    lunch: {
      meals:
        meal2?.foods.map((f: any) => ({
          name: f.name,
          calories: Math.round(f.calories),
          carbs: Math.round(f.carbs),
          protein: Math.round(f.protein),
          fat: Math.round(f.fat),
        })) || [],
      calories: Math.round(meal2?.actual_calories || 0),
      carbs: Math.round(meal2?.actual_carbs || 0),
      protein: Math.round(meal2?.actual_protein || 0),
      fat: Math.round(meal2?.actual_fat || 0),
    },
    dinner: {
      meals:
        meal3?.foods.map((f: any) => ({
          name: f.name,
          calories: Math.round(f.calories),
          carbs: Math.round(f.carbs),
          protein: Math.round(f.protein),
          fat: Math.round(f.fat),
        })) || [],
      calories: Math.round(meal3?.actual_calories || 0),
      carbs: Math.round(meal3?.actual_carbs || 0),
      protein: Math.round(meal3?.actual_protein || 0),
      fat: Math.round(meal3?.actual_fat || 0),
    },
  };
};

const MealRecommendScreen = () => {
  const navigation = useNavigation();
  const [screen, setScreen] = useState<
    "welcome" | "excludedIngredients" | "meals"
  >("welcome");
  const [weeklyMeals, setWeeklyMeals] = useState<any[]>([]);
  const [currentDay, setCurrentDay] = useState(0);
  const [excludedIngredients, setExcludedIngredients] = useState<string[]>([]);
  const [newIngredient, setNewIngredient] = useState("");
  const [loading, setLoading] = useState(false);
  const [savedMeals, setSavedMeals] = useState<any[]>([]);
  const [currentPlanId, setCurrentPlanId] = useState<number | null>(null);
  const [loadingProgress, setLoadingProgress] = useState(0);

  useEffect(() => {
    const loadData = async () => {
      try {
        const stored = await AsyncStorage.getItem("excludedIngredients");
        if (stored) {
          setExcludedIngredients(JSON.parse(stored));
        }

        await loadSavedMeals();
      } catch (error) {
        console.log("Failed to load data", error);
      }
    };
    loadData();
  }, []);

  // ✅ 저장된 식단 목록 불러오기 (서버 + 로컬) — 키 통일: savedMealPlans
  const loadSavedMeals = async () => {
    try {
      const serverMeals = await recommendedMealAPI.getSavedMealPlans();

      const localStored = await AsyncStorage.getItem("savedMealPlans");
      const localMeals = localStored ? JSON.parse(localStored) : [];

      const allMeals = [...localMeals, ...serverMeals];

      console.log("📋 저장된 식단:", {
        로컬: localMeals.length,
        서버: serverMeals.length,
        합계: allMeals.length,
      });

      setSavedMeals(allMeals);
    } catch (error) {
      console.error("저장된 식단 불러오기 실패:", error);
    }
  };

  useEffect(() => {
    const saveExcluded = async () => {
      try {
        await AsyncStorage.setItem(
          "excludedIngredients",
          JSON.stringify(excludedIngredients)
        );
      } catch (error) {
        console.log("Failed to save excluded ingredients", error);
      }
    };
    saveExcluded();
  }, [excludedIngredients]);

  const handleGetRecommendation = async () => {
    setLoading(true);
    setLoadingProgress(0);

    try {
      console.log("🍽️ 식단 추천 시작");

      // 프로필에서 userId와 goal 가져오기
      const profile = await authAPI.getProfile();
      const userId = String(profile.id);

      // healthGoal을 AI 서버 goal로 매핑
      const goalMap: { [key: string]: "maintain" | "cut" | "bulk" } = {
        "체중 감량": "cut",
        "근육 증가": "bulk",
        "체중 유지": "maintain",
        "건강 유지": "maintain",
      };
      const goal = goalMap[profile.healthGoal] || "maintain";

      console.log("👤 사용자 정보:", {
        userId,
        goal,
        healthGoal: profile.healthGoal,
      });

      // 🔄 7일치 식단을 각각 요청
      const weekData: any[] = [];

      for (let dayIndex = 0; dayIndex < 7; dayIndex++) {
        try {
          console.log(`📅 ${dayIndex + 1}일차 식단 요청 중...`);
          setLoadingProgress(((dayIndex + 1) / 7) * 100);

          // 각 날짜마다 AI 서버로 요청
          const aiResponse = await recommendedMealAPI.getAIDailyMealPlan(
            userId,
            goal,
            3, // 하루 3끼
            excludedIngredients // 금지 식재료 전달
          );

          // AI 응답을 UI 형식으로 변환
          const transformedData = transformAIResponseToUI(aiResponse);

          // 날짜 계산
          const date = new Date();
          date.setDate(date.getDate() + dayIndex);

          weekData.push({
            ...transformedData,
            day: dayIndex + 1,
            date: `${date.getMonth() + 1}/${date.getDate()}`,
            fullDate: date.toLocaleDateString("ko-KR", {
              month: "long",
              day: "numeric",
              weekday: "short",
            }),
          });

          console.log(`✅ ${dayIndex + 1}일차 식단 완료`);

          // API 과부하 방지를 위해 약간의 딜레이
          if (dayIndex < 6) {
            await new Promise((resolve) => setTimeout(resolve, 300));
          }
        } catch (dayError) {
          console.error(`❌ ${dayIndex + 1}일차 식단 실패:`, dayError);
          // 실패해도 계속 진행
        }
      }

      if (weekData.length === 0) {
        throw new Error("모든 식단 생성에 실패했습니다.");
      }

      console.log(`✅ 총 ${weekData.length}일치 식단 생성 완료`);

      setWeeklyMeals(weekData);
      setCurrentPlanId(null); // AI는 planId 없음
      setScreen("meals");
      setCurrentDay(0);
    } catch (error: any) {
      console.error("❌ 식단 추천 실패:", error);
      Alert.alert("오류", error.message || "식단을 불러오는데 실패했습니다.");
    } finally {
      setLoading(false);
      setLoadingProgress(0);
    }
  };

  const handleAddExcludedIngredient = () => {
    if (
      newIngredient.trim() &&
      !excludedIngredients.includes(newIngredient.trim())
    ) {
      setExcludedIngredients([...excludedIngredients, newIngredient.trim()]);
      setNewIngredient("");
    }
  };

  const handleRemoveExcludedIngredient = (ingredient: string) => {
    setExcludedIngredients(excludedIngredients.filter((i) => i !== ingredient));
  };

  const handleDeleteMeal = (mealType: string, mealIndex: number) => {
    setWeeklyMeals((prev) => {
      const updated = [...prev];
      const dayMeals = updated[currentDay];
      const mealArray = [...dayMeals[mealType].meals];

      if (mealArray.length > 1) {
        const removedMeal = mealArray[mealIndex];
        mealArray.splice(mealIndex, 1);

        const newCalories = dayMeals[mealType].calories - removedMeal.calories;
        const newCarbs = dayMeals[mealType].carbs - removedMeal.carbs;
        const newProtein = dayMeals[mealType].protein - removedMeal.protein;
        const newFat = dayMeals[mealType].fat - removedMeal.fat;

        dayMeals[mealType] = {
          meals: mealArray,
          calories: newCalories,
          carbs: newCarbs,
          protein: newProtein,
          fat: newFat,
        };

        dayMeals.totalCalories = dayMeals.totalCalories - removedMeal.calories;
        dayMeals.carbs = dayMeals.carbs - removedMeal.carbs;
        dayMeals.protein = dayMeals.protein - removedMeal.protein;
        dayMeals.fat = dayMeals.fat - removedMeal.fat;

        updated[currentDay] = { ...dayMeals };
      }

      return updated;
    });
  };

  // ✅ 로컬에 AI 식단 저장 — 키/포맷 통일: savedMealPlans + meals[]
  const handleSaveMealPlanLocally = async () => {
    try {
      setLoading(true);

      // 히스토리 화면이 기대하는 포맷으로 변환 (meals[])
      const mealsForHistory = weeklyMeals.map((d) => ({
        totalCalories: d.totalCalories,
        carbs: d.carbs,
        protein: d.protein,
        fat: d.fat,
        breakfast: d.breakfast, // { meals:[], calories, carbs, protein, fat }
        lunch: d.lunch,
        dinner: d.dinner,
      }));

      const mealPlanToSave = {
        id: `ai_${Date.now()}`, // 로컬 구분용
        date: new Date().toLocaleDateString("ko-KR"),
        planName: weeklyMeals[0]?.planName || "AI 식단",
        description: weeklyMeals[0]?.description || "AI가 생성한 식단",
        totalCalories: weeklyMeals[0]?.totalCalories || 0,
        totalCarbs: weeklyMeals[0]?.carbs || 0,
        totalProtein: weeklyMeals[0]?.protein || 0,
        totalFat: weeklyMeals[0]?.fat || 0,
        createdAt: new Date().toISOString(),
        meals: mealsForHistory, // ✅ 히스토리가 읽는 필드
        isAIPlan: true,
      };

      const stored = await AsyncStorage.getItem("savedMealPlans");
      const existingMeals = stored ? JSON.parse(stored) : [];

      const updatedMeals = [mealPlanToSave, ...existingMeals].slice(0, 20);
      await AsyncStorage.setItem(
        "savedMealPlans",
        JSON.stringify(updatedMeals)
      );

      console.log("💾 로컬 저장 완료:", mealPlanToSave.id);

      Alert.alert("저장 완료", "식단이 기기에 저장되었습니다! 🎉", [
        {
          text: "확인",
          onPress: async () => {
            await loadSavedMeals();
            setScreen("welcome");
          },
        },
      ]);
    } catch (error: any) {
      console.error("로컬 저장 실패:", error);
      Alert.alert("오류", "식단 저장에 실패했습니다.");
    } finally {
      setLoading(false);
    }
  };

  // ✅ 식단 저장 (서버 or 로컬)
  const handleSaveMealPlan = async () => {
    // AI 식단인 경우 로컬 저장
    if (!currentPlanId) {
      Alert.alert(
        "식단 저장",
        "AI 생성 식단은 기기에만 저장됩니다.\n(다른 기기에서는 볼 수 없습니다)",
        [
          { text: "취소", style: "cancel" },
          {
            text: "저장",
            onPress: handleSaveMealPlanLocally,
          },
        ]
      );
      return;
    }

    // 서버 식단인 경우 서버에 저장
    try {
      setLoading(true);
      const response = await recommendedMealAPI.saveMealPlan(currentPlanId);

      if (response.success) {
        Alert.alert("저장 완료", response.message || "식단이 저장되었습니다!", [
          {
            text: "확인",
            onPress: async () => {
              await loadSavedMeals();
              navigation.navigate("MealRecommendHistory" as never);
            },
          },
        ]);
      } else {
        Alert.alert("오류", response.message || "식단 저장에 실패했습니다.");
      }
    } catch (error: any) {
      console.error("식단 저장 실패:", error);
      Alert.alert("오류", error.message || "식단 저장에 실패했습니다.");
    } finally {
      setLoading(false);
    }
  };

  // ✅ 저장된 식단 삭제 (서버 or 로컬) — 로컬 키: savedMealPlans
  const handleDeleteSavedMeal = async (meal: any) => {
    const isLocalMeal =
      typeof meal.id === "string" && meal.id.startsWith("ai_");

    Alert.alert(
      "삭제",
      `이 ${isLocalMeal ? "로컬" : "서버"} 식단을 삭제하시겠습니까?`,
      [
        { text: "취소", style: "cancel" },
        {
          text: "삭제",
          style: "destructive",
          onPress: async () => {
            try {
              if (isLocalMeal) {
                const stored = await AsyncStorage.getItem("savedMealPlans");
                const existingMeals = stored ? JSON.parse(stored) : [];
                const updatedMeals = existingMeals.filter(
                  (m: any) => m.id !== meal.id
                );
                await AsyncStorage.setItem(
                  "savedMealPlans",
                  JSON.stringify(updatedMeals)
                );

                console.log("🗑️ 로컬 식단 삭제:", meal.id);
                await loadSavedMeals();
                Alert.alert("성공", "식단이 삭제되었습니다.");
              } else {
                const response = await recommendedMealAPI.deleteMealPlan(
                  meal.id
                );
                if (response.success) {
                  await loadSavedMeals();
                  Alert.alert(
                    "성공",
                    response.message || "식단이 삭제되었습니다."
                  );
                } else {
                  Alert.alert("오류", response.message || "삭제 실패");
                }
              }
            } catch (error: any) {
              console.error("식단 삭제 실패:", error);
              Alert.alert("오류", error.message || "식단 삭제에 실패했습니다.");
            }
          },
        },
      ]
    );
  };

  const currentMeal = weeklyMeals[currentDay];

  if (screen === "welcome") {
    return (
      <SafeAreaView style={styles.container} edges={["top"]}>
        <View style={styles.header}>
          <TouchableOpacity onPress={() => navigation.goBack()}>
            <Icon name="chevron-back" size={28} color="#ffffff" />
          </TouchableOpacity>
        </View>
        <ScrollView
          style={styles.contentWrapper}
          contentContainerStyle={styles.contentContainer}
        >
          <View style={styles.welcomeHeader}>
            <Text style={styles.welcomeTitle}>안녕하세요!</Text>
            <Text style={styles.welcomeSubtitle}>
              회원님께 최적화된 식단을 추천해드릴게요!
            </Text>
          </View>

          <TouchableOpacity
            style={[styles.btn, styles.btnPrimary]}
            onPress={handleGetRecommendation}
            disabled={loading}
          >
            {loading ? (
              <View style={styles.loadingContainer}>
                <ActivityIndicator color="#111827" />
                <Text style={styles.loadingText}>
                  식단 생성 중... {Math.round(loadingProgress)}%
                </Text>
              </View>
            ) : (
              <Text style={styles.btnPrimaryText}>추천 식단 받기</Text>
            )}
          </TouchableOpacity>

          <TouchableOpacity
            style={[styles.btn, styles.btnSecondary]}
            onPress={() => setScreen("excludedIngredients")}
          >
            <Text style={styles.btnSecondaryText}>
              금지 식재료 관리{" "}
              {excludedIngredients.length > 0 &&
                `(${excludedIngredients.length})`}
            </Text>
          </TouchableOpacity>

          {excludedIngredients.length > 0 && (
            <View style={styles.excludedPreview}>
              <Text style={styles.excludedPreviewLabel}>현재 금지 식재료:</Text>
              <View style={styles.tagList}>
                {excludedIngredients.map((ingredient, index) => (
                  <View key={index} style={[styles.tag, styles.tagExcluded]}>
                    <Text style={styles.tagText}>{ingredient}</Text>
                  </View>
                ))}
              </View>
            </View>
          )}

          {savedMeals.length > 0 && (
            <View style={styles.savedMealsSection}>
              <Text style={styles.savedMealsTitle}>저장된 식단</Text>
              {savedMeals.map((meal) => {
                const isLocalMeal =
                  typeof meal.id === "string" && meal.id.startsWith("ai_");

                return (
                  <TouchableOpacity
                    key={meal.id}
                    style={styles.savedMealItem}
                    onPress={() => {
                      if (isLocalMeal) {
                        // 히스토리 포맷(meals[]) → 화면 포맷(weeklyMeals[]) 변환
                        const weekly = (meal.meals || []).map(
                          (m: any, idx: number) => ({
                            day: idx + 1,
                            date: "",
                            fullDate: "",
                            planId: null,
                            planName: meal.planName || "AI 식단",
                            description: meal.description || "",
                            recommendationReason: "",
                            totalCalories: m.totalCalories || 0,
                            carbs: m.carbs || 0,
                            protein: m.protein || 0,
                            fat: m.fat || 0,
                            isSaved: true,
                            breakfast: m.breakfast,
                            lunch: m.lunch,
                            dinner: m.dinner,
                          })
                        );

                        setWeeklyMeals(weekly);
                        setCurrentPlanId(null);
                        setScreen("meals");
                        setCurrentDay(0);
                      } else {
                        // 서버 식단이면 히스토리 화면으로
                        navigation.navigate("MealRecommendHistory" as never);
                      }
                    }}
                  >
                    <View style={styles.savedMealHeader}>
                      <View style={styles.savedMealTitleRow}>
                        <Text style={styles.savedMealDate}>
                          {meal.planName || "식단 계획"}
                        </Text>
                        {isLocalMeal && (
                          <View style={styles.localBadge}>
                            <Text style={styles.localBadgeText}>📱 로컬</Text>
                          </View>
                        )}
                      </View>
                      <TouchableOpacity
                        onPress={(e) => {
                          e.stopPropagation();
                          handleDeleteSavedMeal(meal);
                        }}
                        style={styles.btnIconSmall}
                      >
                        <Icon name="trash-outline" size={18} color="#ef4444" />
                      </TouchableOpacity>
                    </View>
                    <Text style={styles.savedMealInfo}>
                      {meal.totalCalories || 0}kcal · {meal.description || ""}
                    </Text>
                  </TouchableOpacity>
                );
              })}
            </View>
          )}
        </ScrollView>
      </SafeAreaView>
    );
  }

  if (screen === "excludedIngredients") {
    return (
      <SafeAreaView style={styles.container} edges={["top"]}>
        <View style={styles.header}>
          <TouchableOpacity onPress={() => setScreen("welcome")}>
            <Icon name="chevron-back" size={28} color="#ffffff" />
          </TouchableOpacity>
          <Text style={styles.headerTitle}>금지 식재료 관리</Text>
          <View style={{ width: 28 }} />
        </View>

        <ScrollView
          style={styles.excludedForm}
          contentContainerStyle={styles.excludedFormContent}
        >
          <View style={styles.inputGroup}>
            <TextInput
              style={styles.textInput}
              value={newIngredient}
              onChangeText={setNewIngredient}
              onSubmitEditing={handleAddExcludedIngredient}
              placeholder="알러지 식재료를 입력하세요"
              placeholderTextColor="#6b7280"
            />
            <TouchableOpacity
              style={[styles.iconBtn, styles.btnAdd]}
              onPress={handleAddExcludedIngredient}
            >
              <Text style={styles.iconAdd}>＋</Text>
            </TouchableOpacity>
          </View>

          <View style={styles.excludedList}>
            {excludedIngredients.map((ingredient, index) => (
              <View key={index} style={styles.excludedItem}>
                <Text style={styles.excludedItemText}>{ingredient}</Text>
                <TouchableOpacity
                  style={[styles.iconBtn, styles.btnDelete]}
                  onPress={() => handleRemoveExcludedIngredient(ingredient)}
                >
                  <Text style={styles.iconDelete}>✕</Text>
                </TouchableOpacity>
              </View>
            ))}

            {excludedIngredients.length === 0 && (
              <Text style={styles.emptyMessage}>
                등록된 금지 식재료가 없습니다
              </Text>
            )}
          </View>

          <TouchableOpacity
            style={[styles.btn, styles.btnPrimary, styles.btnComplete]}
            onPress={() => setScreen("welcome")}
          >
            <Text style={styles.btnPrimaryText}>완료</Text>
          </TouchableOpacity>
        </ScrollView>
      </SafeAreaView>
    );
  }

  // screen === "meals"
  return (
    <SafeAreaView style={styles.container} edges={["top"]}>
      <View style={styles.header}>
        <TouchableOpacity onPress={() => setScreen("welcome")}>
          <Icon name="chevron-back" size={28} color="#ffffff" />
        </TouchableOpacity>
        <Text style={styles.headerTitle}>식단 추천</Text>
        <View style={{ width: 28 }} />
      </View>
      <ScrollView
        style={styles.contentWrapper}
        showsVerticalScrollIndicator={false}
      >
        {currentMeal && (
          <View style={styles.mealDateContainer}>
            <Text style={styles.mealDate}>{currentMeal.fullDate}</Text>
          </View>
        )}

        <ScrollView
          horizontal
          showsHorizontalScrollIndicator={false}
          style={styles.dayTabs}
          contentContainerStyle={styles.dayTabsContent}
        >
          {weeklyMeals.map((_, index) => (
            <TouchableOpacity
              key={index}
              style={[
                styles.dayTab,
                currentDay === index && styles.dayTabActive,
              ]}
              onPress={() => setCurrentDay(index)}
            >
              <Text
                style={[
                  styles.dayTabText,
                  currentDay === index && styles.dayTabTextActive,
                ]}
              >
                {index + 1}일차
              </Text>
            </TouchableOpacity>
          ))}
        </ScrollView>

        {currentMeal && (
          <View style={styles.mealContent}>
            <View style={styles.nutritionCard}>
              <Text style={styles.caloriesTotal}>
                {currentMeal.totalCalories}Kcal
              </Text>
              <View style={styles.nutritionInfo}>
                <View style={styles.nutritionItem}>
                  <Text style={styles.nutritionLabel}>탄수화물</Text>
                  <Text style={styles.nutritionValue}>
                    {currentMeal.carbs}g
                  </Text>
                </View>
                <View style={styles.nutritionItem}>
                  <Text style={styles.nutritionLabel}>단백질</Text>
                  <Text style={styles.nutritionValue}>
                    {currentMeal.protein}g
                  </Text>
                </View>
                <View style={styles.nutritionItem}>
                  <Text style={styles.nutritionLabel}>지방</Text>
                  <Text style={styles.nutritionValue}>{currentMeal.fat}g</Text>
                </View>
              </View>
            </View>

            <View style={styles.mealCard}>
              <View style={styles.mealCardHeader}>
                <Text style={styles.mealTitle}>🌅 아침</Text>
                <View style={styles.mealCaloriesInfo}>
                  <Text style={styles.mealCalories}>
                    {currentMeal.breakfast.calories}{" "}
                    <Text style={styles.kcalUnit}>kcal</Text>
                  </Text>
                </View>
              </View>
              <View style={styles.mealNutritionMini}>
                <Text style={styles.mealNutritionText}>
                  탄 {currentMeal.breakfast.carbs}g
                </Text>
                <Text style={styles.mealNutritionText}>
                  단 {currentMeal.breakfast.protein}g
                </Text>
                <Text style={styles.mealNutritionText}>
                  지 {currentMeal.breakfast.fat}g
                </Text>
              </View>
              <View style={styles.mealTags}>
                {currentMeal.breakfast.meals.map((meal: any, index: number) => (
                  <View key={index} style={styles.mealTag}>
                    <Text style={styles.mealName}>{meal.name}</Text>
                    <Text style={styles.mealCal}>({meal.calories}kcal)</Text>
                    {currentMeal.breakfast.meals.length > 1 && (
                      <TouchableOpacity
                        style={styles.mealDeleteBtn}
                        onPress={() => handleDeleteMeal("breakfast", index)}
                      >
                        <Text style={styles.iconSmall}>✕</Text>
                      </TouchableOpacity>
                    )}
                  </View>
                ))}
              </View>
            </View>

            <View style={styles.mealCard}>
              <View style={styles.mealCardHeader}>
                <Text style={styles.mealTitle}>☀️ 점심</Text>
                <View style={styles.mealCaloriesInfo}>
                  <Text style={styles.mealCalories}>
                    {currentMeal.lunch.calories}{" "}
                    <Text style={styles.kcalUnit}>kcal</Text>
                  </Text>
                </View>
              </View>
              <View style={styles.mealNutritionMini}>
                <Text style={styles.mealNutritionText}>
                  탄 {currentMeal.lunch.carbs}g
                </Text>
                <Text style={styles.mealNutritionText}>
                  단 {currentMeal.lunch.protein}g
                </Text>
                <Text style={styles.mealNutritionText}>
                  지 {currentMeal.lunch.fat}g
                </Text>
              </View>
              <View style={styles.mealTags}>
                {currentMeal.lunch.meals.map((meal: any, index: number) => (
                  <View key={index} style={styles.mealTag}>
                    <Text style={styles.mealName}>{meal.name}</Text>
                    <Text style={styles.mealCal}>({meal.calories}kcal)</Text>
                    {currentMeal.lunch.meals.length > 1 && (
                      <TouchableOpacity
                        style={styles.mealDeleteBtn}
                        onPress={() => handleDeleteMeal("lunch", index)}
                      >
                        <Text style={styles.iconSmall}>✕</Text>
                      </TouchableOpacity>
                    )}
                  </View>
                ))}
              </View>
            </View>

            <View style={styles.mealCard}>
              <View style={styles.mealCardHeader}>
                <Text style={styles.mealTitle}>🌙 저녁</Text>
                <View style={styles.mealCaloriesInfo}>
                  <Text style={styles.mealCalories}>
                    {currentMeal.dinner.calories}{" "}
                    <Text style={styles.kcalUnit}>kcal</Text>
                  </Text>
                </View>
              </View>
              <View style={styles.mealNutritionMini}>
                <Text style={styles.mealNutritionText}>
                  탄 {currentMeal.dinner.carbs}g
                </Text>
                <Text style={styles.mealNutritionText}>
                  단 {currentMeal.dinner.protein}g
                </Text>
                <Text style={styles.mealNutritionText}>
                  지 {currentMeal.dinner.fat}g
                </Text>
              </View>
              <View style={styles.mealTags}>
                {currentMeal.dinner.meals.map((meal: any, index: number) => (
                  <View key={index} style={styles.mealTag}>
                    <Text style={styles.mealName}>{meal.name}</Text>
                    <Text style={styles.mealCal}>({meal.calories}kcal)</Text>
                    {currentMeal.dinner.meals.length > 1 && (
                      <TouchableOpacity
                        style={styles.mealDeleteBtn}
                        onPress={() => handleDeleteMeal("dinner", index)}
                      >
                        <Text style={styles.iconSmall}>✕</Text>
                      </TouchableOpacity>
                    )}
                  </View>
                ))}
              </View>
            </View>

            <View style={styles.actionButtons}>
              <TouchableOpacity
                style={[styles.btn, styles.btnPrimary]}
                onPress={handleSaveMealPlan}
                disabled={loading}
              >
                {loading ? (
                  <ActivityIndicator color="#111827" />
                ) : (
                  <Text style={styles.btnPrimaryText}>💾 식단 저장하기</Text>
                )}
              </TouchableOpacity>
              <TouchableOpacity
                style={[styles.btn, styles.btnSecondary]}
                onPress={handleGetRecommendation}
                disabled={loading}
              >
                {loading ? (
                  <ActivityIndicator color="#111827" />
                ) : (
                  <Text style={styles.btnSecondaryText}>
                    🔄 식단 다시 추천받기
                  </Text>
                )}
              </TouchableOpacity>
            </View>
          </View>
        )}

        <View style={styles.navigation}>
          <TouchableOpacity
            style={[styles.navBtn, currentDay === 0 && styles.navBtnDisabled]}
            onPress={() => setCurrentDay(Math.max(0, currentDay - 1))}
            disabled={currentDay === 0}
          >
            <Text style={styles.icon}>←</Text>
          </TouchableOpacity>
          <TouchableOpacity
            style={[
              styles.navBtn,
              currentDay === weeklyMeals.length - 1 && styles.navBtnDisabled,
            ]}
            onPress={() =>
              setCurrentDay(Math.min(weeklyMeals.length - 1, currentDay + 1))
            }
            disabled={currentDay === weeklyMeals.length - 1}
          >
            <Text style={styles.icon}>→</Text>
          </TouchableOpacity>
        </View>
      </ScrollView>
    </SafeAreaView>
  );
};

const styles = StyleSheet.create({
  container: {
    flex: 1,
    backgroundColor: "#111111",
  },
  contentWrapper: {
    flex: 1,
  },
  contentContainer: {
    paddingHorizontal: 20,
    paddingTop: 60,
    paddingBottom: 40,
  },
  welcomeHeader: {
    alignItems: "center",
    marginTop: 140,
    marginBottom: 40,
  },
  welcomeTitle: {
    fontSize: 24,
    fontWeight: "bold",
    color: "#ffffff",
    marginBottom: 10,
    textAlign: "center",
  },
  welcomeSubtitle: {
    fontSize: 16,
    color: "#ffffff",
    textAlign: "center",
  },
  btn: {
    width: "90%",
    alignSelf: "center",
    borderRadius: 10,
    marginBottom: 10,
    paddingVertical: 14,
    paddingHorizontal: 20,
    alignItems: "center",
    justifyContent: "center",
  },
  btnPrimary: {
    backgroundColor: "#e3ff7c",
  },
  btnSecondary: {
    backgroundColor: "#e3ff7c",
  },
  btnPrimaryText: {
    fontSize: 16,
    fontWeight: "600",
    color: "#111827",
  },
  btnSecondaryText: {
    fontSize: 16,
    fontWeight: "600",
    color: "#111827",
  },
  loadingContainer: {
    flexDirection: "row",
    alignItems: "center",
    gap: 10,
  },
  loadingText: {
    fontSize: 14,
    fontWeight: "600",
    color: "#111827",
  },
  excludedPreview: {
    backgroundColor: "#464646",
    marginTop: 20,
    borderRadius: 10,
    padding: 16,
    width: "90%",
    alignSelf: "center",
  },
  excludedPreviewLabel: {
    fontSize: 16,
    color: "#ffffff",
    marginBottom: 10,
  },
  tagList: {
    flexDirection: "row",
    flexWrap: "wrap",
    gap: 8,
  },
  tag: {
    paddingVertical: 5,
    paddingHorizontal: 10,
    borderRadius: 8,
  },
  tagExcluded: {
    backgroundColor: "#666",
  },
  tagText: {
    fontSize: 14,
    color: "#ffffff",
  },
  savedMealsSection: {
    width: "100%",
    marginTop: 30,
    padding: 20,
  },
  savedMealsTitle: {
    fontSize: 18,
    fontWeight: "700",
    color: "#ffffff",
    marginBottom: 15,
  },
  savedMealItem: {
    backgroundColor: "#222222",
    borderRadius: 12,
    padding: 16,
    marginBottom: 12,
  },
  savedMealHeader: {
    flexDirection: "row",
    justifyContent: "space-between",
    alignItems: "center",
    marginBottom: 8,
  },
  savedMealTitleRow: {
    flexDirection: "row",
    alignItems: "center",
    gap: 8,
    flex: 1,
  },
  savedMealDate: {
    fontSize: 14,
    fontWeight: "600",
    color: "#ffffff",
  },
  localBadge: {
    backgroundColor: "#e3ff7c",
    paddingHorizontal: 8,
    paddingVertical: 2,
    borderRadius: 6,
  },
  localBadgeText: {
    fontSize: 11,
    fontWeight: "600",
    color: "#111827",
  },
  savedMealInfo: {
    fontSize: 14,
    color: "#999999",
  },
  btnIconSmall: {
    backgroundColor: "#464646",
    padding: 8,
    borderRadius: 6,
  },
  iconTiny: {
    fontSize: 16,
    color: "#ffffff",
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
  mealDateContainer: {
    paddingHorizontal: 20,
    paddingTop: 16,
    paddingBottom: 8,
    alignItems: "center",
  },
  excludedForm: {
    flex: 1,
  },
  excludedFormContent: {
    paddingHorizontal: 20,
    paddingTop: 30,
    paddingBottom: 40,
  },
  inputGroup: {
    flexDirection: "row",
    gap: 10,
    marginBottom: 30,
  },
  textInput: {
    flex: 1,
    height: 56,
    backgroundColor: "#1f2937",
    paddingHorizontal: 20,
    color: "#ffffff",
    borderWidth: 2,
    borderColor: "#374151",
    borderRadius: 12,
    fontSize: 15,
  },
  iconBtn: {
    width: 56,
    height: 56,
    alignItems: "center",
    justifyContent: "center",
  },
  btnAdd: {
    width: 56,
    height: 56,
    backgroundColor: "#e3ff7c",
    borderRadius: 12,
    alignItems: "center",
    justifyContent: "center",
  },
  iconAdd: {
    fontSize: 24,
    fontWeight: "600",
    color: "#111827",
  },
  excludedList: {
    gap: 12,
    marginBottom: 30,
    minHeight: 200,
  },
  excludedItem: {
    backgroundColor: "#1f2937",
    paddingVertical: 16,
    paddingHorizontal: 20,
    borderRadius: 12,
    flexDirection: "row",
    alignItems: "center",
    justifyContent: "space-between",
    borderWidth: 1,
    borderColor: "#374151",
  },
  excludedItemText: {
    fontSize: 16,
    fontWeight: "500",
    color: "#ffffff",
    flex: 1,
  },
  btnDelete: {
    backgroundColor: "transparent",
    padding: 8,
  },
  iconDelete: {
    fontSize: 20,
    color: "#ef4444",
  },
  emptyMessage: {
    textAlign: "center",
    color: "#6b7280",
    fontSize: 15,
    paddingVertical: 60,
    paddingHorizontal: 20,
  },
  btnComplete: {
    width: "100%",
    height: 56,
    marginTop: 20,
  },
  mealDate: {
    fontSize: 14,
    color: "#999999",
    textAlign: "center",
  },
  dayTabs: {
    marginVertical: 10,
  },
  dayTabsContent: {
    paddingHorizontal: 10,
    gap: 10,
  },
  dayTab: {
    borderRadius: 20,
    backgroundColor: "#464646",
    paddingVertical: 8,
    paddingHorizontal: 16,
    marginLeft: 2,
  },
  dayTabActive: {
    backgroundColor: "#e3ff7c",
  },
  dayTabText: {
    fontSize: 13,
    color: "#ffffff",
  },
  dayTabTextActive: {
    color: "#111827",
    fontWeight: "600",
  },
  mealContent: {
    paddingHorizontal: 10,
    paddingBottom: 20,
    gap: 10,
  },
  nutritionCard: {
    marginLeft: 9,
    width: "90%",
    backgroundColor: "#1f2937",
    padding: 10,
    borderRadius: 10,
  },
  caloriesTotal: {
    marginTop: 5,
    fontWeight: "bold",
    color: "#ffffff",
    fontSize: 36,
    marginBottom: 10,
  },
  nutritionInfo: {
    flexDirection: "row",
    justifyContent: "space-between",
    gap: 10,
  },
  nutritionItem: {
    flex: 1,
    padding: 10,
    backgroundColor: "rgba(17, 24, 39, 0.5)",
    borderRadius: 8,
    alignItems: "center",
  },
  nutritionLabel: {
    color: "#ffffff",
    fontSize: 15,
    marginBottom: 4,
  },
  nutritionValue: {
    fontWeight: "600",
    fontSize: 14,
    color: "#e3ff7c",
  },
  mealCard: {
    width: "90%",
    marginLeft: 10,
    backgroundColor: "#464646",
    padding: 10,
    borderRadius: 10,
  },
  mealCardHeader: {
    flexDirection: "row",
    justifyContent: "space-between",
    alignItems: "center",
    marginBottom: 10,
  },
  mealTitle: {
    fontWeight: "bold",
    fontSize: 16,
    color: "#ffffff",
  },
  mealCaloriesInfo: {
    alignItems: "flex-end",
  },
  mealCalories: {
    fontWeight: "bold",
    fontSize: 16,
    color: "#ffffff",
  },
  kcalUnit: {
    color: "#9ca3af",
  },
  mealNutritionMini: {
    flexDirection: "row",
    gap: 10,
    marginBottom: 5,
    paddingVertical: 5,
  },
  mealNutritionText: {
    fontSize: 14,
    color: "#ffffff",
    fontWeight: "500",
  },
  mealTags: {
    flexDirection: "row",
    flexWrap: "wrap",
    gap: 10,
  },
  mealTag: {
    backgroundColor: "#e3ff7c",
    flexDirection: "row",
    alignItems: "center",
    padding: 10,
    borderRadius: 15,
    gap: 5,
  },
  mealName: {
    color: "#000000",
    fontSize: 14,
  },
  mealCal: {
    color: "#000000",
    fontSize: 12,
  },
  mealDeleteBtn: {
    backgroundColor: "transparent",
    padding: 4,
  },
  iconSmall: {
    fontSize: 14,
    color: "#000000",
  },
  actionButtons: {
    alignItems: "center",
    gap: 10,
    marginTop: 10,
  },
  navigation: {
    flexDirection: "row",
    justifyContent: "space-between",
    marginTop: 15,
    marginHorizontal: 10,
    marginBottom: 20,
  },
  navBtn: {
    backgroundColor: "#464646",
    paddingVertical: 10,
    paddingHorizontal: 20,
    borderRadius: 10,
    alignItems: "center",
    justifyContent: "center",
  },
  navBtnDisabled: {
    opacity: 0.3,
  },
  icon: {
    fontSize: 20,
    color: "#ffffff",
  },
});

export default MealRecommendScreen;
