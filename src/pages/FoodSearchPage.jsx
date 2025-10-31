import React, { useState } from "react";
import { useNavigate } from "react-router-dom";
import styles from "./FoodSearchPage.module.css";

const FoodSearchPage = () => {
  const navigate = useNavigate();
  const [searchQuery, setSearchQuery] = useState("");
  
  // 더미 음식 데이터
  const [foods] = useState([
    {
      id: 1,
      name: "엽기 떡복이",
      calories: 3289,
      carbs: 198,
      protein: 132,
      fat: 149,
      recordCount: "1000+",
    },
    {
      id: 2,
      name: "엽기 떡복이",
      calories: 3289,
      carbs: 198,
      protein: 132,
      fat: 149,
      weight: 81,
      recordCount: "100미만",
    },
    {
      id: 3,
      name: "엽기 떡복이",
      calories: 3289,
      carbs: 198,
      protein: 132,
      fat: 149,
      weight: 81,
      recordCount: "",
    },
    {
      id: 4,
      name: "엽기 떡복이",
      calories: 3289,
      carbs: 198,
      protein: 132,
      fat: 149,
      weight: 81,
      recordCount: "",
    },
    {
      id: 5,
      name: "엽기 떡복이",
      calories: 3289,
      carbs: 198,
      protein: 132,
      fat: 149,
      weight: 81,
      recordCount: "",
    },
    {
      id: 6,
      name: "엽기 떡복이",
      calories: 3289,
      carbs: 198,
      protein: 132,
      fat: 149,
      weight: 81,
      recordCount: "",
    },
  ]);

  const handleFoodSelect = (food) => {
    // 음식 선택 시 MealAddPage로 돌아가면서 데이터 전달
    navigate("/meal-add", { state: { selectedFood: food } });
  };

  const handleDirectInput = () => {
    // 직접 입력 페이지로 이동
    navigate("/food-direct-input");
  };

  return (
    <div className={styles["food-search-page"]}>
      {/* 헤더 */}
      <div className={styles["header"]}>
        <button
          className={styles["back-button"]}
          onClick={() => navigate(-1)}
          aria-label="뒤로가기"
        >
          <svg width="28" height="28" viewBox="0 0 24 24" fill="none">
            <path
              d="M15 18l-6-6 6-6"
              stroke="#fff"
              strokeWidth="2"
              strokeLinecap="round"
              strokeLinejoin="round"
            />
          </svg>
        </button>
        <h1 className={styles["header-title"]}>식단 추가하기</h1>
        <button
          className={styles["check-button"]}
          onClick={() => navigate("/meal-add")}
          aria-label="완료"
        >
          <svg width="28" height="28" viewBox="0 0 24 24" fill="none">
            <path
              d="M20 6L9 17l-5-5"
              stroke="#fff"
              strokeWidth="2"
              strokeLinecap="round"
              strokeLinejoin="round"
            />
          </svg>
        </button>
      </div>

      {/* 검색 입력 */}
      <div className={styles["search-section"]}>
        <div className={styles["search-input-wrapper"]}>
          <input
            type="text"
            className={styles["search-input"]}
            placeholder="음식 이름을 입력해주세요"
            value={searchQuery}
            onChange={(e) => setSearchQuery(e.target.value)}
          />
          <div className={styles["search-icon"]}>
            <svg width="26" height="26" viewBox="0 0 24 24" fill="none">
              <circle
                cx="11"
                cy="11"
                r="8"
                stroke="#fff"
                strokeWidth="2"
                strokeLinecap="round"
                strokeLinejoin="round"
              />
              <path
                d="m21 21-4.35-4.35"
                stroke="#fff"
                strokeWidth="2"
                strokeLinecap="round"
                strokeLinejoin="round"
              />
            </svg>
          </div>
        </div>
      </div>

      {/* 직접 입력하기 버튼 */}
      <div className={styles["direct-input-section"]}>
        <button
          className={styles["direct-input-button"]}
          onClick={handleDirectInput}
        >
          직접 음식 입력하기
        </button>
      </div>

      {/* 음식 검색 결과 */}
      <div className={styles["food-list"]}>
        {foods
          .filter((food) =>
            food.name.toLowerCase().includes(searchQuery.toLowerCase())
          )
          .map((food) => (
            <div
              key={food.id}
              className={styles["food-item"]}
              onClick={() => handleFoodSelect(food)}
            >
              <div className={styles["food-item-header"]}>
                <div className={styles["food-name-group"]}>
                  <span className={styles["food-name"]}>{food.name}</span>
                  {food.recordCount && (
                    <span className={styles["record-count"]}>
                      {food.recordCount} 기록
                    </span>
                  )}
                </div>
                <span className={styles["food-calories"]}>
                  {food.calories}kcal
                </span>
              </div>
              <div className={styles["food-nutrition"]}>
                <div className={styles["nutrition-item"]}>
                  <span className={styles["nutrition-label"]}>
                    {food.id === 1 ? "100g당" : "탄"}
                  </span>
                  {food.id === 1 ? null : (
                    <span className={styles["nutrition-value"]}>
                      {food.carbs}g
                    </span>
                  )}
                </div>
                {food.id === 1 && (
                  <>
                    <div className={styles["nutrition-item"]}>
                      <span className={styles["nutrition-label"]}>탄</span>
                      <span className={styles["nutrition-value"]}>
                        {food.carbs}g
                      </span>
                    </div>
                  </>
                )}
                {food.id !== 1 && (
                  <>
                    <div className={styles["nutrition-item"]}>
                      <span className={styles["nutrition-label"]}>탄</span>
                      <span className={styles["nutrition-value"]}>
                        {food.carbs}g
                      </span>
                    </div>
                  </>
                )}
                <div className={styles["nutrition-item"]}>
                  <span className={styles["nutrition-label"]}>단</span>
                  <span className={styles["nutrition-value"]}>
                    {food.protein}g
                  </span>
                </div>
                <div className={styles["nutrition-item"]}>
                  <span className={styles["nutrition-label"]}>지</span>
                  <span className={styles["nutrition-value"]}>{food.fat}g</span>
                </div>
                {food.weight && (
                  <div className={styles["nutrition-item"]}>
                    <span className={styles["nutrition-label"]}>중량</span>
                    <span className={styles["nutrition-value"]}>
                      {food.weight}g
                    </span>
                  </div>
                )}
              </div>
            </div>
          ))}
      </div>
    </div>
  );
};

export default FoodSearchPage;

