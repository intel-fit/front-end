import React, { useState, useEffect } from "react";
import { useNavigate } from "react-router-dom";
import styles from "./MealRecommendModal.module.css";

const MealRecommendModal = ({ isOpen, onClose }) => {
  const navigate = useNavigate();
  const [savedMeals, setSavedMeals] = useState([]);
  const [selectedMeal, setSelectedMeal] = useState(null);
  const [selectedDay, setSelectedDay] = useState(0);

  // Load saved meals from localStorage
  useEffect(() => {
    if (isOpen) {
      const storedMeals = JSON.parse(
        localStorage.getItem("savedMealPlans") || "[]"
      );
      setSavedMeals(storedMeals);
    }
  }, [isOpen]);

  if (!isOpen) return null;

  const handleMealClick = (meal) => {
    setSelectedMeal(meal);
    setSelectedDay(0);
  };

  const handleBack = () => {
    setSelectedMeal(null);
    setSelectedDay(0);
  };

  const handleDelete = (mealId, e) => {
    e.stopPropagation();
    if (window.confirm("이 식단을 삭제하시겠습니까?")) {
      const updatedMeals = savedMeals.filter((m) => m.id !== mealId);
      localStorage.setItem("savedMealPlans", JSON.stringify(updatedMeals));
      setSavedMeals(updatedMeals);
      if (selectedMeal && selectedMeal.id === mealId) {
        setSelectedMeal(null);
      }
    }
  };

  const handleGoToRecommend = () => {
    onClose();
    navigate("/meal-recommend");
  };

  const currentDayMeal = selectedMeal?.meals[selectedDay];

  return (
    <div className={styles['meal-history-modal-overlay']} onClick={onClose}>
      <div className={styles['meal-history-modal']} onClick={(e) => e.stopPropagation()}>
        <div className={styles['meal-history-header']}>
          <h2>{selectedMeal ? "식단 상세보기" : "식단 추천 내역"}</h2>
          <button className={styles['close-btn']} onClick={onClose}>
            ✕
          </button>
        </div>

        <div className={styles['meal-history-content']}>
          {!selectedMeal ? (
            // 식단 목록 표시
            <>
              {savedMeals.length === 0 ? (
                <div className={styles['empty-state']}>
                  <p>저장된 식단이 없습니다.</p>
                  <p className={styles['empty-subtitle']}>
                    식단 추천을 받고 저장해보세요!
                  </p>
                  <button
                    className={styles['go-to-recommend-btn']}
                    onClick={handleGoToRecommend}
                  >
                    추천받으러 가기 →
                  </button>
                </div>
              ) : (
                <div className={styles['meal-list']}>
                  {savedMeals.map((meal) => (
                    <div
                      key={meal.id}
                      className={styles['meal-card']}
                      onClick={() => handleMealClick(meal)}
                    >
                      <div className={styles['meal-card-header']}>
                        <div className={styles['meal-date']}>
                          <span className={styles['date-icon']}>🍽️</span>
                          {meal.date}
                        </div>
                        <button
                          className={styles['delete-btn']}
                          onClick={(e) => handleDelete(meal.id, e)}
                        >
                          🗑️
                        </button>
                      </div>
                      <div className={styles['meal-card-body']}>
                        <div className={styles['meal-summary']}>
                          <span className={styles['meal-badge']}>📅 7일 식단</span>
                          <span className={`${styles['meal-badge']} ${styles['calories-badge']}`}>
                            {meal.meals[0]?.totalCalories || 0} kcal/일
                          </span>
                        </div>
                        <div className={styles['nutrition-summary']}>
                          <span>탄 {meal.meals[0]?.carbs || 0}g</span>
                          <span>단 {meal.meals[0]?.protein || 0}g</span>
                          <span>지 {meal.meals[0]?.fat || 0}g</span>
                        </div>
                      </div>
                      <div className={styles['meal-card-footer']}>
                        <span className={styles['view-detail']}>자세히 보기 →</span>
                      </div>
                    </div>
                  ))}
                </div>
              )}
            </>
          ) : (
            // 선택된 식단 상세 표시
            <div className={styles['meal-detail']}>
              <button className={styles['back-btn']} onClick={handleBack}>
                ← 목록으로
              </button>

              <div className={styles['meal-detail-info']}>
                <div className={styles['detail-date']}>{selectedMeal.date}</div>
                <div className={styles['detail-summary']}>
                  <span className={styles['detail-badge']}>7일 식단</span>
                </div>
              </div>

              {/* 날짜 탭 */}
              <div className={styles['day-tabs']}>
                {selectedMeal.meals.map((_, index) => (
                  <button
                    key={index}
                    className={`${styles['day-tab']} ${
                      selectedDay === index ? styles.active : ""}`}
                    onClick={() => setSelectedDay(index)}
                  >
                    {index + 1}일차
                  </button>
                ))}
              </div>

              {/* 선택된 날짜의 식단 */}
              {currentDayMeal && (
                <>
                  {/* 전체 영양소 카드 */}
                  <div className={styles['nutrition-card-detail']}>
                    <h3 className={styles['calories-total']}>
                      {currentDayMeal.totalCalories} kcal
                    </h3>
                    <div className={styles['nutrition-grid']}>
                      <div className={styles['nutrition-item-detail']}>
                        <span className={styles['nutrition-label']}>탄수화물</span>
                        <span className={styles['nutrition-value']}>
                          {currentDayMeal.carbs}g
                        </span>
                      </div>
                      <div className={styles['nutrition-item-detail']}>
                        <span className={styles['nutrition-label']}>단백질</span>
                        <span className={styles['nutrition-value']}>
                          {currentDayMeal.protein}g
                        </span>
                      </div>
                      <div className={styles['nutrition-item-detail']}>
                        <span className={styles['nutrition-label']}>지방</span>
                        <span className={styles['nutrition-value']}>
                          {currentDayMeal.fat}g
                        </span>
                      </div>
                    </div>
                  </div>

                  {/* 아침 */}
                  <div className={styles['meal-section']}>
                    <div className={styles['meal-section-header']}>
                      <h4>🌅 아침</h4>
                      <span className={styles['meal-section-calories']}>
                        {currentDayMeal.breakfast.calories} kcal
                      </span>
                    </div>
                    <div className={styles['meal-items']}>
                      {currentDayMeal.breakfast.meals.map((meal, index) => (
                        <div key={index} className={styles['meal-item-detail']}>
                          <span className={styles['meal-item-name']}>{meal.name}</span>
                          <div className={styles['meal-item-nutrition']}>
                            <span className={styles['meal-item-calories']}>
                              {meal.calories}kcal
                            </span>
                            <span className={styles['meal-item-macros']}>
                              탄{meal.carbs}g · 단{meal.protein}g · 지{meal.fat}
                              g
                            </span>
                          </div>
                        </div>
                      ))}
                    </div>
                  </div>

                  {/* 점심 */}
                  <div className={styles['meal-section']}>
                    <div className={styles['meal-section-header']}>
                      <h4>☀️ 점심</h4>
                      <span className={styles['meal-section-calories']}>
                        {currentDayMeal.lunch.calories} kcal
                      </span>
                    </div>
                    <div className={styles['meal-items']}>
                      {currentDayMeal.lunch.meals.map((meal, index) => (
                        <div key={index} className={styles['meal-item-detail']}>
                          <span className={styles['meal-item-name']}>{meal.name}</span>
                          <div className={styles['meal-item-nutrition']}>
                            <span className={styles['meal-item-calories']}>
                              {meal.calories}kcal
                            </span>
                            <span className={styles['meal-item-macros']}>
                              탄{meal.carbs}g · 단{meal.protein}g · 지{meal.fat}
                              g
                            </span>
                          </div>
                        </div>
                      ))}
                    </div>
                  </div>

                  {/* 저녁 */}
                  <div className={styles['meal-section']}>
                    <div className={styles['meal-section-header']}>
                      <h4>🌙 저녁</h4>
                      <span className={styles['meal-section-calories']}>
                        {currentDayMeal.dinner.calories} kcal
                      </span>
                    </div>
                    <div className={styles['meal-items']}>
                      {currentDayMeal.dinner.meals.map((meal, index) => (
                        <div key={index} className={styles['meal-item-detail']}>
                          <span className={styles['meal-item-name']}>{meal.name}</span>
                          <div className={styles['meal-item-nutrition']}>
                            <span className={styles['meal-item-calories']}>
                              {meal.calories}kcal
                            </span>
                            <span className={styles['meal-item-macros']}>
                              탄{meal.carbs}g · 단{meal.protein}g · 지{meal.fat}
                              g
                            </span>
                          </div>
                        </div>
                      ))}
                    </div>
                  </div>
                </>
              )}
            </div>
          )}
        </div>
      </div>
    </div>
  );
};

export default MealRecommendModal;
