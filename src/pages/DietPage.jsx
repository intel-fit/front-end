import React, { useState } from 'react';
import { useNavigate } from 'react-router-dom';
import { IoChevronBack, IoChevronForward, IoMenu } from 'react-icons/io5';
import './DietPage.css';

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
    <div className="diet-page">
      {/* 월 네비게이션 */}
      <div className="month-navigation">
        <div className="month-nav-left">
          <button className="nav-btn" onClick={() => {}}>
            <IoChevronBack size={18} />
          </button>
          <span className="month-text">{currentMonth}</span>
          <button className="nav-btn" onClick={() => {}}>
            <IoChevronForward size={18} />
          </button>
        </div>
        <button className="menu-btn" onClick={() => {}}>
          <IoMenu size={20} />
        </button>
      </div>

      {/* 7일 캘린더 위젯 */}
      <div className="week-calendar">
        <div className="calendar-grid">
          {[1, 2, 3, 4, 5, 6, 7].map((day) => (
            <div key={day} className="calendar-item">
              <div className="calendar-number">15</div>
              <div className="calendar-calories">388k</div>
              <div className="calendar-percentage">97%</div>
            </div>
          ))}
        </div>
      </div>

      {/* 칼로리 섹션 */}
      <div className="calorie-section">
        <div className="calorie-header">
          <div className="calorie-main">
            <span className="calorie-number">{nutritionData.total}</span>
            <span className="calorie-unit">/ {nutritionData.target}kcal</span>
          </div>
          <div className="calorie-percentage">{nutritionData.percentage}%</div>
        </div>
        
        <div className="progress-bar-container">
          <div className="progress-bar">
            <div 
              className="progress-fill" 
              style={{ width: `${nutritionData.percentage}%` }}
            ></div>
          </div>
        </div>
        
        <div className="nutrition-bars">
          <div className="nutrition-item">
            <span className="nutrition-label">탄수화물</span>
            <span className="nutrition-value">{nutritionData.carbs.current} / {nutritionData.carbs.target}g</span>
            <div className="nutrition-progress">
              <div 
                className="nutrition-progress-fill" 
                style={{ width: `${(nutritionData.carbs.current / nutritionData.carbs.target) * 100}%` }}
              ></div>
            </div>
          </div>
          <div className="nutrition-item">
            <span className="nutrition-label">단백질</span>
            <span className="nutrition-value">{nutritionData.protein.current} / {nutritionData.protein.target}g</span>
            <div className="nutrition-progress">
              <div 
                className="nutrition-progress-fill" 
                style={{ width: `${(nutritionData.protein.current / nutritionData.protein.target) * 100}%` }}
              ></div>
            </div>
          </div>
          <div className="nutrition-item">
            <span className="nutrition-label">지방</span>
            <span className="nutrition-value">{nutritionData.fat.current} / {nutritionData.fat.target}g</span>
            <div className="nutrition-progress">
              <div 
                className="nutrition-progress-fill" 
                style={{ width: `${(nutritionData.fat.current / nutritionData.fat.target) * 100}%` }}
              ></div>
            </div>
          </div>
        </div>
      </div>

      {/* 식사별 섹션 */}
      <div className="meals-container">
        {meals.map((meal, index) => (
          <div key={index} className="meal-section">
            <div className="meal-header">
              <div className="meal-left">
                <h3 className="meal-title">{meal.type}</h3>
                <span className="meal-time">{meal.time}</span>
              </div>
              <div className="meal-calories">{meal.calories} kcal</div>
            </div>
            <div className="food-tags">
              {meal.foods.map((food, foodIndex) => (
                <span
                  key={foodIndex}
                  className="food-tag"
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
      <div className="add-meal-section">
        <button className="add-meal-button" onClick={() => navigate('/add-meal')}>
          식단 추가하기
        </button>
      </div>
    </div>
  );
};

export default DietPage;
