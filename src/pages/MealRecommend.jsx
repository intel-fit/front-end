import React, { useState, useEffect } from "react";
import styles from "./MealRecommend.module.css";
import MealRecommendModal from "../components/MealRecommendModal";

const MEAL_DATABASE = {
  breakfast: [
    { name: "계란후라이 2개", calories: 180, carbs: 2, protein: 12, fat: 14 },
    { name: "토스트 2장", calories: 160, carbs: 30, protein: 6, fat: 2 },
    { name: "그릭 요거트", calories: 100, carbs: 6, protein: 17, fat: 0 },
    { name: "바나나", calories: 105, carbs: 27, protein: 1, fat: 0 },
    { name: "오트밀", calories: 150, carbs: 27, protein: 5, fat: 3 },
    { name: "아보카도 토스트", calories: 250, carbs: 25, protein: 7, fat: 16 },
    { name: "단백질 쉐이크", calories: 120, carbs: 3, protein: 24, fat: 2 },
    { name: "시리얼", calories: 110, carbs: 24, protein: 2, fat: 1 },
    { name: "과일 샐러드", calories: 80, carbs: 20, protein: 1, fat: 0 },
    { name: "프로틴 팬케이크", calories: 200, carbs: 22, protein: 18, fat: 5 },
  ],
  lunch: [
    { name: "닭가슴살 샐러드", calories: 250, carbs: 15, protein: 30, fat: 8 },
    { name: "현미밥 한공기", calories: 210, carbs: 44, protein: 4, fat: 2 },
    { name: "된장찌개", calories: 120, carbs: 8, protein: 10, fat: 5 },
    { name: "김치", calories: 20, carbs: 4, protein: 1, fat: 0 },
    { name: "참치 김밥", calories: 300, carbs: 45, protein: 12, fat: 8 },
    { name: "치킨 샌드위치", calories: 350, carbs: 35, protein: 25, fat: 12 },
    { name: "퀴노아 볼", calories: 280, carbs: 40, protein: 10, fat: 8 },
    { name: "연어 덮밥", calories: 420, carbs: 55, protein: 28, fat: 12 },
    { name: "새우 샐러드", calories: 180, carbs: 10, protein: 20, fat: 6 },
    { name: "소고기 스테이크", calories: 320, carbs: 5, protein: 35, fat: 18 },
  ],
  dinner: [
    {
      name: "닭가슴살 구이 200g",
      calories: 330,
      carbs: 0,
      protein: 62,
      fat: 7,
    },
    { name: "고구마 중간 크기", calories: 130, carbs: 30, protein: 2, fat: 0 },
    { name: "브로콜리", calories: 50, carbs: 10, protein: 4, fat: 0 },
    { name: "연어 스테이크", calories: 280, carbs: 0, protein: 34, fat: 15 },
    { name: "현미밥 반공기", calories: 105, carbs: 22, protein: 2, fat: 1 },
    { name: "두부 스테이크", calories: 150, carbs: 5, protein: 16, fat: 9 },
    { name: "삶은 달걀 3개", calories: 210, carbs: 3, protein: 18, fat: 15 },
    { name: "닭안심 구이", calories: 200, carbs: 0, protein: 40, fat: 4 },
    { name: "시금치 나물", calories: 40, carbs: 6, protein: 3, fat: 1 },
    { name: "양배추 샐러드", calories: 60, carbs: 12, protein: 2, fat: 1 },
  ],
  snacks: [
    { name: "에너지바", calories: 180, carbs: 24, protein: 8, fat: 6 },
    { name: "견과류 한줌", calories: 160, carbs: 6, protein: 6, fat: 14 },
    { name: "사과", calories: 95, carbs: 25, protein: 0, fat: 0 },
    { name: "프로틴 바", calories: 200, carbs: 20, protein: 20, fat: 7 },
    { name: "요거트", calories: 100, carbs: 17, protein: 5, fat: 2 },
  ],
};

const fetchMealRecommend = (excludedIngredients = []) => {
  return new Promise((resolve) => {
    setTimeout(() => {
      const today = new Date();
      const meals = Array.from({ length: 7 }, (_, dayIndex) => {
        const date = new Date(today);
        date.setDate(date.getDate() + dayIndex);

        const getFilteredMeals = (mealType, count) => {
          const available = MEAL_DATABASE[mealType].filter(
            (meal) =>
              !excludedIngredients.some((ingredient) =>
                meal.name.toLowerCase().includes(ingredient.toLowerCase())
              )
          );

          const shuffled = [...available].sort(() => Math.random() - 0.5);
          return shuffled.slice(0, count);
        };

        const breakfast = getFilteredMeals("breakfast", 2);
        const lunch = getFilteredMeals("lunch", 3);
        const dinner = getFilteredMeals("dinner", 3);

        const calculateNutrition = (meals) => {
          return meals.reduce(
            (acc, meal) => ({
              calories: acc.calories + meal.calories,
              carbs: acc.carbs + meal.carbs,
              protein: acc.protein + meal.protein,
              fat: acc.fat + meal.fat,
            }),
            { calories: 0, carbs: 0, protein: 0, fat: 0 }
          );
        };

        const breakfastNutrition = calculateNutrition(breakfast);
        const lunchNutrition = calculateNutrition(lunch);
        const dinnerNutrition = calculateNutrition(dinner);

        const totalCalories =
          breakfastNutrition.calories +
          lunchNutrition.calories +
          dinnerNutrition.calories;
        const totalCarbs =
          breakfastNutrition.carbs +
          lunchNutrition.carbs +
          dinnerNutrition.carbs;
        const totalProtein =
          breakfastNutrition.protein +
          lunchNutrition.protein +
          dinnerNutrition.protein;
        const totalFat =
          breakfastNutrition.fat + lunchNutrition.fat + dinnerNutrition.fat;

        return {
          day: dayIndex + 1,
          date: `${date.getMonth() + 1}/${date.getDate()}`,
          fullDate: date.toLocaleDateString("ko-KR", {
            month: "long",
            day: "numeric",
            weekday: "short",
          }),
          totalCalories: Math.round(totalCalories),
          carbs: Math.round(totalCarbs),
          protein: Math.round(totalProtein),
          fat: Math.round(totalFat),
          breakfast: {
            meals: breakfast,
            calories: Math.round(breakfastNutrition.calories),
            carbs: Math.round(breakfastNutrition.carbs),
            protein: Math.round(breakfastNutrition.protein),
            fat: Math.round(breakfastNutrition.fat),
          },
          lunch: {
            meals: lunch,
            calories: Math.round(lunchNutrition.calories),
            carbs: Math.round(lunchNutrition.carbs),
            protein: Math.round(lunchNutrition.protein),
            fat: Math.round(lunchNutrition.fat),
          },
          dinner: {
            meals: dinner,
            calories: Math.round(dinnerNutrition.calories),
            carbs: Math.round(dinnerNutrition.carbs),
            protein: Math.round(dinnerNutrition.protein),
            fat: Math.round(dinnerNutrition.fat),
          },
        };
      });

      resolve(meals);
    }, 800);
  });
};

const MealRecommend = () => {
  const [screen, setScreen] = useState("welcome");
  const [weeklyMeals, setWeeklyMeals] = useState([]);
  const [currentDay, setCurrentDay] = useState(0);
  const [excludedIngredients, setExcludedIngredients] = useState([]);
  const [newIngredient, setNewIngredient] = useState("");
  const [loading, setLoading] = useState(false);
  const [savedMeals, setSavedMeals] = useState([]);
  const [showModal, setShowModal] = useState(false);

  // 로컬 스토리지에서 데이터 불러오기
  useEffect(() => {
    const stored = localStorage.getItem("excludedIngredients");
    if (stored) {
      setExcludedIngredients(JSON.parse(stored));
    }

    const storedMeals = localStorage.getItem("savedMealPlans");
    if (storedMeals) {
      setSavedMeals(JSON.parse(storedMeals));
    }
  }, []);

  // 금지 식재료 저장
  useEffect(() => {
    localStorage.setItem(
      "excludedIngredients",
      JSON.stringify(excludedIngredients)
    );
  }, [excludedIngredients]);

  // 추천 식단 받기
  const handleGetRecommendation = async () => {
    setLoading(true);
    try {
      const meals = await fetchMealRecommend(excludedIngredients);
      setWeeklyMeals(meals);
      setScreen("meals");
      setCurrentDay(0);
    } catch (error) {
      alert("식단을 불러오는데 실패했습니다.");
    } finally {
      setLoading(false);
    }
  };

  // 금지 식재료 추가
  const handleAddExcludedIngredient = () => {
    if (
      newIngredient.trim() &&
      !excludedIngredients.includes(newIngredient.trim())
    ) {
      setExcludedIngredients([...excludedIngredients, newIngredient.trim()]);
      setNewIngredient("");
    }
  };

  // 금지 식재료 제거
  const handleRemoveExcludedIngredient = (ingredient) => {
    setExcludedIngredients(excludedIngredients.filter((i) => i !== ingredient));
  };

  // 식사 삭제
  const handleDeleteMeal = (mealType, mealIndex) => {
    setWeeklyMeals((prev) => {
      const updated = [...prev];
      const dayMeals = updated[currentDay];
      const mealArray = [...dayMeals[mealType].meals];

      if (mealArray.length > 1) {
        const removedMeal = mealArray[mealIndex];
        mealArray.splice(mealIndex, 1);

        // 영양소 재계산
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

  // 식단 저장하기
  const handleSaveMealPlan = () => {
    const newSavedMeal = {
      id: Date.now(),
      date: new Date().toLocaleDateString("ko-KR"),
      meals: weeklyMeals,
    };

    const updated = [newSavedMeal, ...savedMeals].slice(0, 5); // 최대 5개까지 저장
    setSavedMeals(updated);
    localStorage.setItem("savedMealPlans", JSON.stringify(updated));
    alert("식단이 저장되었습니다!");
  };

  // 저장된 식단 삭제
  const handleDeleteSavedMeal = (id, e) => {
    e.stopPropagation();
    const updated = savedMeals.filter((meal) => meal.id !== id);
    setSavedMeals(updated);
    localStorage.setItem("savedMealPlans", JSON.stringify(updated));
  };

  const currentMeal = weeklyMeals[currentDay];

  if (screen === "welcome") {
    return (
      <div className={styles["app-container"]}>
        <div className={styles["content-wrapper"]}>
          <div className={styles["welcome-header"]}>
            <h1 className={styles["welcome-title"]}>안녕하세요 - 회원님!</h1>
            <p className={styles["welcome-subtitle"]}>
              회원님께 최적화된 식단을 추천해드릴게요!
            </p>
          </div>

          <button
            onClick={handleGetRecommendation}
            disabled={loading}
            className={`${styles["btn"]} ${styles["btn-primary"]}`}
          >
            {loading ? "로딩 중..." : "추천 식단 받기"}
          </button>

          <button
            onClick={() => setScreen("excludedIngredients")}
            className={`${styles["btn"]} ${styles["btn-secondary"]}`}
          >
            금지 식재료 관리{" "}
            {excludedIngredients.length > 0 &&
              `(${excludedIngredients.length})`}
          </button>

          {excludedIngredients.length > 0 && (
            <div className={styles["excluded-preview"]}>
              <p className={styles["excluded-preview-label"]}>
                현재 금지 식재료:
              </p>
              <div className={styles["tag-list"]}>
                {excludedIngredients.map((ingredient, index) => (
                  <span
                    key={index}
                    className={`${styles["tag"]} ${styles["tag-excluded"]}`}
                  >
                    {ingredient}
                  </span>
                ))}
              </div>
            </div>
          )}

          {savedMeals.length > 0 && (
            <div className={styles["saved-meals-section"]}>
              <h3 className={styles["saved-meals-title"]}>저장된 식단 📋</h3>
              <div className={styles["saved-meals-list"]}>
                {savedMeals.map((savedMeal) => (
                  <div
                    key={savedMeal.id}
                    className={styles["saved-meal-item"]}
                    onClick={() => setShowModal(true)}
                    style={{ cursor: "pointer" }}
                  >
                    <div className={styles["saved-meal-info"]}>
                      <p className={styles["saved-meal-date"]}>
                        {savedMeal.date}
                      </p>
                      <p className={styles["saved-meal-summary"]}>
                        {savedMeal.meals[0]?.totalCalories}kcal · 7일 식단
                      </p>
                    </div>
                    <div className={styles["saved-meal-actions"]}>
                      <button
                        onClick={(e) => handleDeleteSavedMeal(savedMeal.id, e)}
                        className={styles["btn-icon-small"]}
                      >
                        <span className={styles["icon-tiny"]}>✕</span>
                      </button>
                    </div>
                  </div>
                ))}
              </div>
            </div>
          )}
        </div>

        {/* 모달 */}
        <MealRecommendModal
          isOpen={showModal}
          onClose={() => setShowModal(false)}
        />
      </div>
    );
  }

  if (screen === "excludedIngredients") {
    return (
      <div className={styles["app-container"]}>
        <div className={styles["content-wrapper"]}>
          <div className={styles["header"]}>
            <button
              onClick={() => setScreen("welcome")}
              className={styles["icon-btn"]}
            >
              <span className={styles["icon"]}>←</span>
            </button>
            <h1 className={styles["header-title"]}>금지 식재료 관리</h1>
            <div className={styles["icon-placeholder"]} />
          </div>

          <div className={styles["excluded-form"]}>
            <div className={styles["input-group"]}>
              <input
                type="text"
                value={newIngredient}
                onChange={(e) => setNewIngredient(e.target.value)}
                onKeyPress={(e) =>
                  e.key === "Enter" && handleAddExcludedIngredient()
                }
                placeholder="알러지 식재료를 입력하세요"
                className={styles["text-input"]}
              />
              <button
                onClick={handleAddExcludedIngredient}
                className={`${styles["icon-btn"]} ${styles["btn-add"]}`}
              >
                <span className={styles["icon"]}>＋</span>
              </button>
            </div>

            <div className={styles["excluded-list"]}>
              {excludedIngredients.map((ingredient, index) => (
                <div key={index} className={styles["excluded-item"]}>
                  <span>{ingredient}</span>
                  <button
                    onClick={() => handleRemoveExcludedIngredient(ingredient)}
                    className={`${styles["icon-btn"]} ${styles["btn-delete"]}`}
                  >
                    <span className={styles["icon"]}>✕</span>
                  </button>
                </div>
              ))}

              {excludedIngredients.length === 0 && (
                <p className={styles["empty-message"]}>
                  등록된 금지 식재료가 없습니다
                </p>
              )}
            </div>

            <button
              onClick={() => setScreen("welcome")}
              className={`${styles["btn"]} ${styles["btn-primary"]} ${styles["btn-complete"]}`}
            >
              완료
            </button>
          </div>
        </div>
      </div>
    );
  }

  return (
    <div className={styles["app-container"]}>
      <div className={styles["content-wrapper"]}>
        <div className={styles["meal-header"]}>
          <div className={styles["header"]}>
            <button
              onClick={() => setScreen("welcome")}
              className={styles["icon-btn"]}
            >
              <span className={styles["icon"]}>←</span>
            </button>
            <h1 className={styles["header-title"]}>7일 식단표</h1>
            <div className={styles["icon-placeholder"]} />
          </div>
          {currentMeal && (
            <p className={styles["meal-date"]}>{currentMeal.fullDate}</p>
          )}
        </div>

        <div className={styles["day-tabs"]}>
          {weeklyMeals.map((_, index) => (
            <button
              key={index}
              onClick={() => setCurrentDay(index)}
              className={`${styles["day-tab"]} ${
                currentDay === index ? styles["active"] : ""
              }`}
            >
              {index + 1}일차
            </button>
          ))}
        </div>

        {currentMeal && (
          <div className={styles["meal-content"]}>
            <div className={styles["nutrition-card"]}>
              <h2 className={styles["calories-total"]}>
                {currentMeal.totalCalories}Kcal
              </h2>
              <div className={styles["nutrition-info"]}>
                <div className={styles["nutrition-item"]}>
                  <p className={styles["nutrition-label"]}>탄수화물</p>
                  <p className={styles["nutrition-value"]}>
                    {currentMeal.carbs}g
                  </p>
                </div>
                <div className={styles["nutrition-item"]}>
                  <p className={styles["nutrition-label"]}>단백질</p>
                  <p className={styles["nutrition-value"]}>
                    {currentMeal.protein}g
                  </p>
                </div>
                <div className={styles["nutrition-item"]}>
                  <p className={styles["nutrition-label"]}>지방</p>
                  <p className={styles["nutrition-value"]}>
                    {currentMeal.fat}g
                  </p>
                </div>
              </div>
            </div>

            <div className={styles["meal-card"]}>
              <div className={styles["meal-card-header"]}>
                <h3 className={styles["meal-title"]}>🌅 아침</h3>
                <div className={styles["meal-calories-info"]}>
                  <p className={styles["meal-calories"]}>
                    {currentMeal.breakfast.calories}{" "}
                    <span className={styles["kcal-unit"]}>kcal</span>
                  </p>
                </div>
              </div>
              <div className={styles["meal-nutrition-mini"]}>
                <span>탄 {currentMeal.breakfast.carbs}g</span>
                <span>단 {currentMeal.breakfast.protein}g</span>
                <span>지 {currentMeal.breakfast.fat}g</span>
              </div>
              <div className={styles["meal-tags"]}>
                {currentMeal.breakfast.meals.map((meal, index) => (
                  <div key={index} className={styles["meal-tag"]}>
                    <span className={styles["meal-name"]}>{meal.name}</span>
                    <span className={styles["meal-cal"]}>
                      ({meal.calories}kcal)
                    </span>
                    {currentMeal.breakfast.meals.length > 1 && (
                      <button
                        onClick={() => handleDeleteMeal("breakfast", index)}
                        className={styles["meal-delete-btn"]}
                      >
                        <span className={styles["icon-small"]}>✕</span>
                      </button>
                    )}
                  </div>
                ))}
              </div>
            </div>

            <div className={styles["meal-card"]}>
              <div className={styles["meal-card-header"]}>
                <h3 className={styles["meal-title"]}>☀️ 점심</h3>
                <div className={styles["meal-calories-info"]}>
                  <p className={styles["meal-calories"]}>
                    {currentMeal.lunch.calories}{" "}
                    <span className={styles["kcal-unit"]}>kcal</span>
                  </p>
                </div>
              </div>
              <div className={styles["meal-nutrition-mini"]}>
                <span>탄 {currentMeal.lunch.carbs}g</span>
                <span>단 {currentMeal.lunch.protein}g</span>
                <span>지 {currentMeal.lunch.fat}g</span>
              </div>
              <div className={styles["meal-tags"]}>
                {currentMeal.lunch.meals.map((meal, index) => (
                  <div key={index} className={styles["meal-tag"]}>
                    <span className={styles["meal-name"]}>{meal.name}</span>
                    <span className={styles["meal-cal"]}>
                      ({meal.calories}kcal)
                    </span>
                    {currentMeal.lunch.meals.length > 1 && (
                      <button
                        onClick={() => handleDeleteMeal("lunch", index)}
                        className={styles["meal-delete-btn"]}
                      >
                        <span className={styles["icon-small"]}>✕</span>
                      </button>
                    )}
                  </div>
                ))}
              </div>
            </div>

            <div className={styles["meal-card"]}>
              <div className={styles["meal-card-header"]}>
                <h3 className={styles["meal-title"]}>🌙 저녁</h3>
                <div className={styles["meal-calories-info"]}>
                  <p className={styles["meal-calories"]}>
                    {currentMeal.dinner.calories}{" "}
                    <span className={styles["kcal-unit"]}>kcal</span>
                  </p>
                </div>
              </div>
              <div className={styles["meal-nutrition-mini"]}>
                <span>탄 {currentMeal.dinner.carbs}g</span>
                <span>단 {currentMeal.dinner.protein}g</span>
                <span>지 {currentMeal.dinner.fat}g</span>
              </div>
              <div className={styles["meal-tags"]}>
                {currentMeal.dinner.meals.map((meal, index) => (
                  <div key={index} className={styles["meal-tag"]}>
                    <span className={styles["meal-name"]}>{meal.name}</span>
                    <span className={styles["meal-cal"]}>
                      ({meal.calories}kcal)
                    </span>
                    {currentMeal.dinner.meals.length > 1 && (
                      <button
                        onClick={() => handleDeleteMeal("dinner", index)}
                        className={styles["meal-delete-btn"]}
                      >
                        <span className={styles["icon-small"]}>✕</span>
                      </button>
                    )}
                  </div>
                ))}
              </div>
            </div>

            <div className={styles["action-buttons"]}>
              <button
                onClick={handleSaveMealPlan}
                className={`${styles["btn"]} ${styles["btn-primary"]}`}
              >
                💾 식단 저장하기
              </button>
              <button
                onClick={handleGetRecommendation}
                disabled={loading}
                className={`${styles["btn"]} ${styles["btn-secondary"]}`}
              >
                {loading ? "⏳ 로딩 중..." : "🔄 식단 다시 추천받기"}
              </button>
            </div>
          </div>
        )}

        <div className={styles["navigation"]}>
          <button
            onClick={() => setCurrentDay(Math.max(0, currentDay - 1))}
            disabled={currentDay === 0}
            className={styles["nav-btn"]}
          >
            <span className={styles["icon"]}>←</span>
          </button>
          <button
            onClick={() =>
              setCurrentDay(Math.min(weeklyMeals.length - 1, currentDay + 1))
            }
            disabled={currentDay === weeklyMeals.length - 1}
            className={styles["nav-btn"]}
          >
            <span className={styles["icon"]}>→</span>
          </button>
        </div>
      </div>
    </div>
  );
};

export default MealRecommend;
