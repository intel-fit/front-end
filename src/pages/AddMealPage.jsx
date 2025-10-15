import React, { useState } from 'react';
import { useNavigate } from 'react-router-dom';
import './AddMealPage.css';

const AddMealPage = () => {
  const navigate = useNavigate();
  const [selectedFoods, setSelectedFoods] = useState([]);

  const handleBack = () => {
    navigate(-1);
  };

  const handleSave = () => {
    // 저장 로직 추가 가능
    navigate(-1);
  };

  const toggleFood = (food) => {
    if (selectedFoods.includes(food)) {
      setSelectedFoods(selectedFoods.filter(f => f !== food));
    } else {
      setSelectedFoods([...selectedFoods, food]);
    }
  };

  const foodItems = [
    { name: '요거트', calories: 52 },
    { name: '소', calories: null },
    { name: '소고기', calories: null },
    { name: '소고기 무국', calories: null },
    { name: '직접 추가하기', calories: null }
  ];

  const nutritionData = {
    total: 384,
    target: 1157,
    carbs: { current: 51, target: 198 },
    protein: { current: 15, target: 132 },
    fat: { current: 15, target: 49 }
  };

  return (
    <div className="add-meal-page">
      {/* 헤더 */}
      <div className="add-meal-header">
        <button className="back-button" onClick={handleBack}>
          <svg width="28" height="28" viewBox="0 0 28 28" fill="none">
            <path d="M17.5 21L10.5 14L17.5 7" stroke="white" strokeWidth="2" strokeLinecap="round" strokeLinejoin="round"/>
          </svg>
        </button>
        <h1 className="header-title">정보 수정</h1>
        <button className="save-button" onClick={handleSave}>
          <svg width="28" height="28" viewBox="0 0 28 28" fill="none">
            <path d="M23.3334 7L10.5001 19.8333L4.66675 14" stroke="white" strokeWidth="2" strokeLinecap="round" strokeLinejoin="round"/>
          </svg>
        </button>
      </div>

      {/* 날짜 및 식사 시간 */}
      <div className="meal-time-section">
        <div className="time-chip">
          <span>today, 20:38</span>
        </div>
        <div className="meal-type-chip">
          <span>저녁</span>
        </div>
      </div>

      {/* 칼로리 요약 */}
      <div className="calorie-summary">
        <div className="calorie-text">384 / 1,157kcal</div>
        <div className="nutrition-inline">
          <div className="nutrition-inline-item">
            <span className="nutrition-inline-label">탄수화물</span>
            <span className="nutrition-inline-value">51 / 198g</span>
          </div>
          <div className="nutrition-inline-item">
            <span className="nutrition-inline-label">단백질</span>
            <span className="nutrition-inline-value">15 / 132g</span>
          </div>
          <div className="nutrition-inline-item">
            <span className="nutrition-inline-label">지방</span>
            <span className="nutrition-inline-value">15 / 49g</span>
          </div>
        </div>
      </div>

      {/* 사진 추가 섹션 */}
      <div className="meal-photo-section">
        <div className="meal-photo-box">
          {/* 피그마 디자인의 이미지 placeholder */}
        </div>
        <div className="meal-photo-box">
          <div className="camera-icon">
            <svg width="34" height="34" viewBox="0 0 34 34" fill="none">
              <path d="M21.25 14.1667C21.25 15.9916 19.7749 17.4667 17.95 17.4667C16.1251 17.4667 14.65 15.9916 14.65 14.1667C14.65 12.3418 16.1251 10.8667 17.95 10.8667C19.7749 10.8667 21.25 12.3418 21.25 14.1667Z" stroke="white" strokeWidth="2"/>
              <path d="M11.3333 6.41667H14.1667L15.5833 4.25H19.4167L20.8333 6.41667H23.6667C25.3236 6.41667 26.6667 7.75978 26.6667 9.41667V19.8333C26.6667 21.4902 25.3236 22.8333 23.6667 22.8333H11.3333C9.67645 22.8333 8.33333 21.4902 8.33333 19.8333V9.41667C8.33333 7.75978 9.67645 6.41667 11.3333 6.41667Z" stroke="white" strokeWidth="2"/>
            </svg>
          </div>
        </div>
      </div>

      {/* 음식 목록 */}
      <div className="food-list">
        {/* 요거트 */}
        <div className="food-item">
          <span className="food-name">요거트</span>
          <span className="food-calories">52kcal</span>
        </div>

        {/* 소 */}
        <div className="food-item">
          <span className="food-name">소</span>
          <span className="food-calories">kcal</span>
        </div>
      </div>

      {/* 추가 버튼 */}
      <div className="add-more-section">
        <button className="add-more-button">
          <div className="plus-icon">
            <svg width="24" height="24" viewBox="0 0 24 24" fill="none">
              <path d="M12 5V19M5 12H19" stroke="white" strokeWidth="2" strokeLinecap="round" strokeLinejoin="round"/>
            </svg>
          </div>
        </button>
      </div>

      {/* 하단 검색 섹션 */}
      <div className="bottom-search-section">
        <div className="search-tags">
          <div className="search-tag">소고기</div>
          <div className="search-tag">소고기 무국</div>
          <div className="search-tag">직접 추가하기</div>
        </div>
      </div>
    </div>
  );
};

export default AddMealPage;

