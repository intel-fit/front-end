import React, { useState, useEffect } from "react";
import { useNavigate } from "react-router-dom";
import "./MealRecommendModal.css";

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
    <div className="meal-history-modal-overlay" onClick={onClose}>
      <div className="meal-history-modal" onClick={(e) => e.stopPropagation()}>
        <div className="meal-history-header">
          <h2>{selectedMeal ? "식단 상세보기" : "식단 추천 내역"}</h2>
          <button className="close-btn" onClick={onClose}>
            ✕
          </button>
        </div>

        <div className="meal-history-content">
          {!selectedMeal ? (
            // 식단 목록 표시
            <>
              {savedMeals.length === 0 ? (
                <div className="empty-state">
                  <p>저장된 식단이 없습니다.</p>
                  <p className="empty-subtitle">
                    식단 추천을 받고 저장해보세요!
                  </p>
                  <button
                    className="go-to-recommend-btn"
                    onClick={handleGoToRecommend}
                  >
                    추천받으러 가기 →
                  </button>
                </div>
              ) : (
                <div className="meal-list">
                  {savedMeals.map((meal) => (
                    <div
                      key={meal.id}
                      className="meal-card"
                      onClick={() => handleMealClick(meal)}
                    >
                      <div className="meal-card-header">
                        <div className="meal-date">
                          <span className="date-icon">🍽️</span>
                          {meal.date}
                        </div>
                        <button
                          className="delete-btn"
                          onClick={(e) => handleDelete(meal.id, e)}
                        >
                          🗑️
                        </button>
                      </div>
                      <div className="meal-card-body">
                        <div className="meal-summary">
                          <span className="meal-badge">📅 7일 식단</span>
                          <span className="meal-badge calories-badge">
                            {meal.meals[0]?.totalCalories || 0} kcal/일
                          </span>
                        </div>
                        <div className="nutrition-summary">
                          <span>탄 {meal.meals[0]?.carbs || 0}g</span>
                          <span>단 {meal.meals[0]?.protein || 0}g</span>
                          <span>지 {meal.meals[0]?.fat || 0}g</span>
                        </div>
                      </div>
                      <div className="meal-card-footer">
                        <span className="view-detail">자세히 보기 →</span>
                      </div>
                    </div>
                  ))}
                </div>
              )}
            </>
          ) : (
            // 선택된 식단 상세 표시
            <div className="meal-detail">
              <button className="back-btn" onClick={handleBack}>
                ← 목록으로
              </button>

              <div className="meal-detail-info">
                <div className="detail-date">{selectedMeal.date}</div>
                <div className="detail-summary">
                  <span className="detail-badge">7일 식단</span>
                </div>
              </div>

              {/* 날짜 탭 */}
              <div className="day-tabs">
                {selectedMeal.meals.map((_, index) => (
                  <button
                    key={index}
                    className={`day-tab ${
                      selectedDay === index ? "active" : ""
                    }`}
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
                  <div className="nutrition-card-detail">
                    <h3 className="calories-total">
                      {currentDayMeal.totalCalories} kcal
                    </h3>
                    <div className="nutrition-grid">
                      <div className="nutrition-item-detail">
                        <span className="nutrition-label">탄수화물</span>
                        <span className="nutrition-value">
                          {currentDayMeal.carbs}g
                        </span>
                      </div>
                      <div className="nutrition-item-detail">
                        <span className="nutrition-label">단백질</span>
                        <span className="nutrition-value">
                          {currentDayMeal.protein}g
                        </span>
                      </div>
                      <div className="nutrition-item-detail">
                        <span className="nutrition-label">지방</span>
                        <span className="nutrition-value">
                          {currentDayMeal.fat}g
                        </span>
                      </div>
                    </div>
                  </div>

                  {/* 아침 */}
                  <div className="meal-section">
                    <div className="meal-section-header">
                      <h4>🌅 아침</h4>
                      <span className="meal-section-calories">
                        {currentDayMeal.breakfast.calories} kcal
                      </span>
                    </div>
                    <div className="meal-items">
                      {currentDayMeal.breakfast.meals.map((meal, index) => (
                        <div key={index} className="meal-item-detail">
                          <span className="meal-item-name">{meal.name}</span>
                          <div className="meal-item-nutrition">
                            <span className="meal-item-calories">
                              {meal.calories}kcal
                            </span>
                            <span className="meal-item-macros">
                              탄{meal.carbs}g · 단{meal.protein}g · 지{meal.fat}
                              g
                            </span>
                          </div>
                        </div>
                      ))}
                    </div>
                  </div>

                  {/* 점심 */}
                  <div className="meal-section">
                    <div className="meal-section-header">
                      <h4>☀️ 점심</h4>
                      <span className="meal-section-calories">
                        {currentDayMeal.lunch.calories} kcal
                      </span>
                    </div>
                    <div className="meal-items">
                      {currentDayMeal.lunch.meals.map((meal, index) => (
                        <div key={index} className="meal-item-detail">
                          <span className="meal-item-name">{meal.name}</span>
                          <div className="meal-item-nutrition">
                            <span className="meal-item-calories">
                              {meal.calories}kcal
                            </span>
                            <span className="meal-item-macros">
                              탄{meal.carbs}g · 단{meal.protein}g · 지{meal.fat}
                              g
                            </span>
                          </div>
                        </div>
                      ))}
                    </div>
                  </div>

                  {/* 저녁 */}
                  <div className="meal-section">
                    <div className="meal-section-header">
                      <h4>🌙 저녁</h4>
                      <span className="meal-section-calories">
                        {currentDayMeal.dinner.calories} kcal
                      </span>
                    </div>
                    <div className="meal-items">
                      {currentDayMeal.dinner.meals.map((meal, index) => (
                        <div key={index} className="meal-item-detail">
                          <span className="meal-item-name">{meal.name}</span>
                          <div className="meal-item-nutrition">
                            <span className="meal-item-calories">
                              {meal.calories}kcal
                            </span>
                            <span className="meal-item-macros">
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
