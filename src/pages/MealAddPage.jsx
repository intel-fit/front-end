import React, { useState } from "react";
import { useNavigate } from "react-router-dom";
import styles from "./MealAddPage.module.css";
import FoodAddOptionsModal from "./FoodAddOptionsPage";

const MealAddPage = () => {
  const navigate = useNavigate();
  const [mealName, setMealName] = useState("");
  const [mealTime, setMealTime] = useState("today, 20:38");
  const [mealType, setMealType] = useState("저녁");
  const [photos, setPhotos] = useState([]);
  const [isModalOpen, setIsModalOpen] = useState(false);
  const [foods, setFoods] = useState([
    {
      id: 1,
      name: "엽기 떡복이",
      calories: 3289,
      carbs: 198,
      protein: 132,
      fat: 149,
      weight: 81,
    },
    {
      id: 2,
      name: "엽기 떡복이",
      calories: 3289,
      carbs: 198,
      protein: 132,
      fat: 149,
      weight: 81,
    },
  ]);

  const totalCalories = foods.reduce((sum, food) => sum + food.calories, 0);
  const targetCalories = 1157;
  const totalCarbs = foods.reduce((sum, food) => sum + food.carbs, 0);
  const totalProtein = foods.reduce((sum, food) => sum + food.protein, 0);
  const totalFat = foods.reduce((sum, food) => sum + food.fat, 0);

  const handlePhotoUpload = (e) => {
    const file = e.target.files[0];
    if (file) {
      const reader = new FileReader();
      reader.onloadend = () => {
        setPhotos([...photos, reader.result]);
      };
      reader.readAsDataURL(file);
    }
  };

  const handleSave = () => {
    // 저장 로직
    console.log("식단 저장:", { mealName, mealTime, mealType, photos, foods });
    navigate(-1);
  };

  const handleAddFood = () => {
    // 모달 열기
    setIsModalOpen(true);
  };

  const handleCloseModal = () => {
    setIsModalOpen(false);
  };

  return (
    <div className={styles["meal-add-page"]}>
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
          className={styles["save-button"]}
          onClick={handleSave}
          aria-label="저장"
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

      {/* 식단 이름 입력 */}
      <div className={styles["name-input-section"]}>
        <input
          type="text"
          className={styles["name-input"]}
          placeholder="식단 이름을 작성해주세요."
          value={mealName}
          onChange={(e) => setMealName(e.target.value)}
        />
      </div>

      {/* 날짜 및 식사 시간 */}
      <div className={styles["time-section"]}>
        <div className={styles["time-chip"]}>
          <span>{mealTime}</span>
        </div>
        <div className={styles["meal-type-chip"]}>
          <span>{mealType}</span>
        </div>
      </div>

      {/* 칼로리 요약 */}
      <div className={styles["calorie-summary"]}>
        <div className={styles["calorie-text"]}>
          {totalCalories} / {targetCalories}kcal
        </div>
        <div className={styles["nutrition-inline"]}>
          <div className={styles["nutrition-inline-item"]}>
            <span className={styles["nutrition-inline-label"]}>탄수화물</span>
            <span className={styles["nutrition-inline-value"]}>
              {totalCarbs} / 198g
            </span>
          </div>
          <div className={styles["nutrition-inline-item"]}>
            <span className={styles["nutrition-inline-label"]}>단백질</span>
            <span className={styles["nutrition-inline-value"]}>
              {totalProtein} / 132g
            </span>
          </div>
          <div className={styles["nutrition-inline-item"]}>
            <span className={styles["nutrition-inline-label"]}>지방</span>
            <span className={styles["nutrition-inline-value"]}>
              {totalFat} / 49g
            </span>
          </div>
        </div>
      </div>

      {/* 사진 섹션 */}
      <div className={styles["photo-section"]}>
        {photos.map((photo, idx) => (
          <div key={idx} className={styles["photo-box"]}>
            <img src={photo} alt={`식단 사진 ${idx + 1}`} />
          </div>
        ))}
        <label className={styles["photo-box"]}>
          <input
            type="file"
            accept="image/*"
            onChange={handlePhotoUpload}
            style={{ display: "none" }}
          />
          <div className={styles["camera-icon"]}>
            <svg width="34" height="34" viewBox="0 0 24 24" fill="none">
              <path
                d="M23 19a2 2 0 0 1-2 2H3a2 2 0 0 1-2-2V8a2 2 0 0 1 2-2h4l2-3h6l2 3h4a2 2 0 0 1 2 2z"
                stroke="#fff"
                strokeWidth="2"
                strokeLinecap="round"
                strokeLinejoin="round"
              />
              <circle
                cx="12"
                cy="13"
                r="4"
                stroke="#fff"
                strokeWidth="2"
                strokeLinecap="round"
                strokeLinejoin="round"
              />
            </svg>
          </div>
        </label>
      </div>

      {/* 음식 목록 */}
      <div className={styles["food-list"]}>
        {foods.map((food) => (
          <div key={food.id} className={styles["food-item"]}>
            <div className={styles["food-item-header"]}>
              <div className={styles["food-name"]}>{food.name}</div>
              <div className={styles["food-calories"]}>{food.calories}kcal</div>
            </div>
            <div className={styles["food-nutrition"]}>
              <div className={styles["nutrition-item"]}>
                <span className={styles["nutrition-label"]}>탄</span>
                <span className={styles["nutrition-value"]}>{food.carbs}g</span>
              </div>
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
              <div className={styles["nutrition-item"]}>
                <span className={styles["nutrition-label"]}>중량</span>
                <span className={styles["nutrition-value"]}>
                  {food.weight}g
                </span>
              </div>
            </div>
          </div>
        ))}
      </div>

      {/* 음식 추가하기 버튼 */}
      <button className={styles["add-food-button"]} onClick={handleAddFood}>
        음식 추가하기
      </button>

      {/* 음식 추가 옵션 모달 */}
      <FoodAddOptionsModal isOpen={isModalOpen} onClose={handleCloseModal} />
    </div>
  );
};

export default MealAddPage;

