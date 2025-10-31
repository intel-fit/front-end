import React, { useState } from 'react';
import { useNavigate } from 'react-router-dom';
import { IoChevronBack, IoChevronForward, IoMenu } from 'react-icons/io5';
import styles from "./DietPage.module.css";

const DietPage = () => {
  const navigate = useNavigate();
  const [currentMonth, setCurrentMonth] = useState("10월");

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
      {/* 월 네비게이션 */}
      <div className={styles['month-navigation']}>
        <div className={styles['month-nav-left']}>
          <button className={styles['nav-btn']} onClick={() => {}}>
            <IoChevronBack size={18} />
          </button>
          <span className={styles['month-text']}>{currentMonth}</span>
          <button className={styles['nav-btn']} onClick={() => {}}>
            <IoChevronForward size={18} />
          </button>
        </div>
        <button className={styles['menu-btn']} onClick={() => {}}>
          <IoMenu size={20} />
        </button>
      </div>

      {/* 7일 캘린더 위젯 */}
      <div className={styles['week-calendar']}>
        <div className={styles['calendar-grid']}>
          {[1, 2, 3, 4, 5, 6, 7].map((day) => (
            <div key={day} className={styles['calendar-item']}>
              <div className={styles['calendar-number']}>15</div>
              <div className={styles['calendar-calories']}>388k</div>
              <div className={styles['calendar-percentage']}>97%</div>
            </div>
          ))}
        </div>
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
