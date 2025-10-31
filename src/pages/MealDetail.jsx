import { useState } from "react";
import { useNavigate, useLocation } from "react-router-dom";
import styles from "./MealDetail.module.css";

const MealDetail = () => {
  const navigate = useNavigate();
  const location = useLocation();

  // 식단 정보
  const mealData = {
    day: "1일차",
    name: "아침 - 오트밀",
    type: "아침식사",
    calories: "350kcal",
    prepTime: "10분",
    difficulty: "쉬움",
    ingredients: [
      { name: "오트밀", amount: "50g" },
      { name: "바나나", amount: "1개" },
      { name: "아몬드", amount: "10알" },
      { name: "우유", amount: "200ml" },
      { name: "꿀", amount: "1큰술" },
    ],
    instructions: [
      "물 또는 우유를 끓입니다",
      "오트밀을 넣고 3-5분간 끓입니다",
      "바나나를 썰어 넣습니다",
      "아몬드와 꿀을 토핑으로 올립니다",
    ],
    nutrition: {
      protein: "12g",
      carbs: "55g",
      fat: "8g",
      fiber: "6g",
    },
  };

  const [isBookmarked, setIsBookmarked] = useState(false);

  const handleBookmark = () => {
    setIsBookmarked(!isBookmarked);
    alert(
      isBookmarked ? "북마크에서 제거되었습니다" : "북마크에 추가되었습니다"
    );
  };

  const handleStartCooking = () => {
    alert("요리 시작 기능 (추후 구현)");
  };

  return (
    <div className={styles['meal-detail-page']}>
      {/* 헤더 */}
      <div className={styles['meal-header']}>
        <button className={styles['back-btn']} onClick={() => navigate(-1)}>
          ←
        </button>
        <h1 className={styles['page-title']}>{mealData.day} 추천 식단</h1>
      </div>

      {/* 식단 이름 */}
      <div className={styles['meal-name-section']}>
        <h2 className={styles['meal-name']}>{mealData.name}</h2>
        <span className={styles['meal-type']}>{mealData.type}</span>
      </div>

      {/* 식단 이미지 */}
      <div className={styles['meal-image-container']}>
        <div className={styles['meal-image-placeholder']}></div>
      </div>

      {/* 기본 정보 */}
      <div className={styles['meal-info-container']}>
        <div className={styles['info-item']}>
          <span className={styles['info-label']}>칼로리</span>
          <span className={styles['info-value']}>{mealData.calories}</span>
        </div>
        <div className={styles['info-item']}>
          <span className={styles['info-label']}>조리시간</span>
          <span className={styles['info-value']}>{mealData.prepTime}</span>
        </div>
        <div className={styles['info-item']}>
          <span className={styles['info-label']}>난이도</span>
          <span className={styles['info-value']}>{mealData.difficulty}</span>
        </div>
      </div>

      {/* 영양성분 */}
      <div className={styles['nutrition-section']}>
        <h3 className={styles['section-title']}>영양성분</h3>
        <div className={styles['nutrition-grid']}>
          <div className={styles['nutrition-item']}>
            <span className={styles['nutrition-label']}>단백질</span>
            <span className={styles['nutrition-value']}>
              {mealData.nutrition.protein}
            </span>
          </div>
          <div className={styles['nutrition-item']}>
            <span className={styles['nutrition-label']}>탄수화물</span>
            <span className={styles['nutrition-value']}>{mealData.nutrition.carbs}</span>
          </div>
          <div className={styles['nutrition-item']}>
            <span className={styles['nutrition-label']}>지방</span>
            <span className={styles['nutrition-value']}>{mealData.nutrition.fat}</span>
          </div>
          <div className={styles['nutrition-item']}>
            <span className={styles['nutrition-label']}>식이섬유</span>
            <span className={styles['nutrition-value']}>{mealData.nutrition.fiber}</span>
          </div>
        </div>
      </div>
    </div>
  );
};

export default MealDetail;
