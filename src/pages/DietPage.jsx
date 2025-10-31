import React from 'react';
import { useNavigate } from 'react-router-dom';
import styles from "./DietPage.module.css";

const DietPage = () => {
  const navigate = useNavigate();
  // 7일간의 날짜 데이터
  const dates = Array.from({ length: 7 }, (_, i) => ({
    day: 15 + i,
    isActive: i === 0 // 첫 번째 날이 활성화됨
  }));

  const nutritionData = {
    total: 384,
    target: 1157,
    percentage: 30,
    carbs: { current: 51, target: 198 },
    protein: { current: 15, target: 132 },
    fat: { current: 15, target: 49 }
  };

  const meals = [
    {
      type: '아침',
      time: '8:38 am',
      calories: 52,
      foods: [
        { name: '요거트', color: '#e3ff7c' },
        { name: '바나나', color: '#e3ff7c' }
      ]
    },
    {
      type: '점심',
      time: '추천 식단',
      calories: 70,
      foods: [
        { name: '그릭 요거트', color: '#7e7e7b' },
        { name: '에너지바', color: '#7e7e7b' }
      ]
    },
    {
      type: '야식',
      time: '추천 식단',
      calories: 239,
      foods: [
        { name: '닭가슴살 300g', color: '#7e7e7b' },
        { name: '단백질 쉐이크', color: '#7e7e7b' },
        { name: '구운 계란 2개', color: '#7e7e7b' }
      ]
    }
  ];

  return (
    <div className={styles['diet-page']}>
      {/* 날짜 선택 섹션 */}
      <div className={styles['date-selector']}>
        {dates.map((date, index) => (
          <div key={index} className={`${styles['date-item']} ${date.isActive  ? styles['active'] : ''}`}>
            <div className={styles['date-number']}>{date.day}</div>
            <div className={styles['date-calories']}>388k</div>
            <div className={styles['date-percentage']}>97%</div>
          </div>
        ))}
      </div>

      {/* 칼로리 섹션 */}
      <div className={styles['calorie-section']}>
        <div className={styles['calorie-header']}>
          <div className={styles['calorie-main']}>
            <span className={styles['calorie-number']}>{nutritionData.total}</span>
            <span className={styles['calorie-unit']}>/ {nutritionData.target}kcal</span>
          </div>
          <div className={styles['calorie-percentage']}>{nutritionData.percentage}%</div>
        </div>
        
        <div className={styles['progress-bar-container']}>
          <div className={styles['progress-bar']}>
            <div 
              className={styles['progress-fill']} 
              style={{ width: `${nutritionData.percentage}%` }}
            ></div>
          </div>
        </div>
        
        <div className={styles['nutrition-bars']}>
          <div className={styles['nutrition-item']}>
            <span className={styles['nutrition-label']}>탄수화물</span>
            <span className={styles['nutrition-value']}>{nutritionData.carbs.current} / {nutritionData.carbs.target}g</span>
            <div className={styles['nutrition-progress']}>
              <div 
                className={styles['nutrition-progress-fill']} 
                style={{ width: `${(nutritionData.carbs.current / nutritionData.carbs.target) * 100}%` }}
              ></div>
            </div>
          </div>
          <div className={styles['nutrition-item']}>
            <span className={styles['nutrition-label']}>단백질</span>
            <span className={styles['nutrition-value']}>{nutritionData.protein.current} / {nutritionData.protein.target}g</span>
            <div className={styles['nutrition-progress']}>
              <div 
                className={styles['nutrition-progress-fill']} 
                style={{ width: `${(nutritionData.protein.current / nutritionData.protein.target) * 100}%` }}
              ></div>
            </div>
          </div>
          <div className={styles['nutrition-item']}>
            <span className={styles['nutrition-label']}>지방</span>
            <span className={styles['nutrition-value']}>{nutritionData.fat.current} / {nutritionData.fat.target}g</span>
            <div className={styles['nutrition-progress']}>
              <div 
                className={styles['nutrition-progress-fill']} 
                style={{ width: `${(nutritionData.fat.current / nutritionData.fat.target) * 100}%` }}
              ></div>
            </div>
          </div>
        </div>
      </div>

      {/* 식사별 섹션 */}
      <div className={styles['meals-container']}>
        {meals.map((meal, index) => (
          <div key={index} className={styles['meal-section']}>
            <div className={styles['meal-header']}>
              <div className={styles['meal-left']}>
                <h3 className={styles['meal-title']}>{meal.type}</h3>
                <span className={styles['meal-time']}>{meal.time}</span>
              </div>
              <div className={styles['meal-calories']}>{meal.calories} kcal</div>
            </div>
            <div className={styles['food-tags']}>
              {meal.foods.map((food, foodIndex) => (
                <span
                  key={foodIndex}
                  className={styles['food-tag']}
                  style={{ backgroundColor: food.color }}
                >
                  {food.name}
                </span>
              ))}
            </div>
          </div>
        ))}
      </div>

      {/* 식단 추가하기 버튼 */}
      <div className={styles['add-meal-section']}>
        <button className={styles['add-meal-button']} onClick={() => navigate('/add-meal')}>
          식단 추가하기
        </button>
      </div>
    </div>
  );
};

export default DietPage;
