import { useState } from "react";
import { useNavigate } from "react-router-dom";
import "./AIRecommend.css";

const AIRecommend = () => {
  const [selectedDay, setSelectedDay] = useState();
  const navigate = useNavigate();

  const handleStartExercise = () => {
    navigate("/exercise-detail");
  };

  const handleStartMeal = () => {
    navigate("/meal-detail");
  };

  const recommendData = {
    1: {
      exercises: [
        { id: 1, name: "푸시업", duration: "3세트 x 15회" },
        { id: 2, name: "스쿼트", duration: "3세트 x 20회" },
        { id: 3, name: "플랭크", duration: "30초 x 3세트" },
      ],
      meals: [
        { id: 1, name: "아침 - 오트밀", description: "오트밀 + 바나나" },
        { id: 2, name: "점심 - 닭가슴살", description: "현미밥 + 야채" },
        { id: 3, name: "저녁 - 샐러드", description: "견과류 + 드레싱" },
      ],
    },
    2: {
      exercises: [
        { id: 1, name: "런지", duration: "3세트 x 12회" },
        { id: 2, name: "버피", duration: "10회 x 3세트" },
        { id: 3, name: "마운틴 클라이머", duration: "30초 x 3세트" },
      ],
      meals: [
        { id: 1, name: "아침 - 요거트", description: "그릭요거트 + 베리" },
        { id: 2, name: "점심 - 연어", description: "퀴노아 + 아보카도" },
        { id: 3, name: "저녁 - 두부", description: "김치찌개 + 현미밥" },
      ],
    },
    3: {
      exercises: [
        { id: 1, name: "푸시업", duration: "3세트 x 15회" },
        { id: 2, name: "스쿼트", duration: "3세트 x 20회" },
        { id: 3, name: "플랭크", duration: "30초 x 3세트" },
      ],
      meals: [
        { id: 1, name: "아침 - 오트밀", description: "오트밀 + 바나나" },
        { id: 2, name: "점심 - 닭가슴살", description: "현미밥 + 야채" },
        { id: 3, name: "저녁 - 샐러드", description: "견과류 + 드레싱" },
      ],
    },
    4: {
      exercises: [
        { id: 1, name: "런지", duration: "3세트 x 12회" },
        { id: 2, name: "버피", duration: "10회 x 3세트" },
        { id: 3, name: "마운틴 클라이머", duration: "30초 x 3세트" },
      ],
      meals: [
        { id: 1, name: "아침 - 요거트", description: "그릭요거트 + 베리" },
        { id: 2, name: "점심 - 연어", description: "퀴노아 + 아보카도" },
        { id: 3, name: "저녁 - 두부", description: "김치찌개 + 현미밥" },
      ],
    },
    5: {
      exercises: [
        { id: 1, name: "푸시업", duration: "3세트 x 15회" },
        { id: 2, name: "스쿼트", duration: "3세트 x 20회" },
        { id: 3, name: "플랭크", duration: "30초 x 3세트" },
      ],
      meals: [
        { id: 1, name: "아침 - 오트밀", description: "오트밀 + 바나나" },
        { id: 2, name: "점심 - 닭가슴살", description: "현미밥 + 야채" },
        { id: 3, name: "저녁 - 샐러드", description: "견과류 + 드레싱" },
      ],
    },
    6: {
      exercises: [
        { id: 1, name: "런지", duration: "3세트 x 12회" },
        { id: 2, name: "버피", duration: "10회 x 3세트" },
        { id: 3, name: "마운틴 클라이머", duration: "30초 x 3세트" },
      ],
      meals: [
        { id: 1, name: "아침 - 요거트", description: "그릭요거트 + 베리" },
        { id: 2, name: "점심 - 연어", description: "퀴노아 + 아보카도" },
        { id: 3, name: "저녁 - 두부", description: "김치찌개 + 현미밥" },
      ],
    },
    7: {
      exercises: [
        { id: 1, name: "푸시업", duration: "3세트 x 15회" },
        { id: 2, name: "스쿼트", duration: "3세트 x 20회" },
        { id: 3, name: "플랭크", duration: "30초 x 3세트" },
      ],
      meals: [
        { id: 1, name: "아침 - 오트밀", description: "오트밀 + 바나나" },
        { id: 2, name: "점심 - 닭가슴살", description: "현미밥 + 야채" },
        { id: 3, name: "저녁 - 샐러드", description: "견과류 + 드레싱" },
      ],
    },
  };

  const getDefaultData = (day) => ({
    exercises: [
      { id: 1, name: `${day}일차 운동 A`, duration: "3세트 x 15회" },
      { id: 2, name: `${day}일차 운동 B`, duration: "3세트 x 12회" },
      { id: 3, name: `${day}일차 운동 C`, duration: "30초 x 3세트" },
    ],
    meals: [
      { id: 1, name: `${day}일차 아침`, description: "건강한 아침식사" },
      { id: 2, name: `${day}일차 점심`, description: "균형잡힌 점심식사" },
      { id: 3, name: `${day}일차 저녁`, description: "가벼운 저녁식사" },
    ],
  });

  const currentData = recommendData[selectedDay] || getDefaultData(selectedDay);

  const handleDaySelect = (day) => {
    setSelectedDay(day);
  };

  return (
    <div className="ai-recommend">
      <div className="day-selector">
        {[1, 2, 3, 4, 5, 6, 7].map((day) => (
          <button
            key={day}
            className={`day-button ${selectedDay === day ? "active" : ""}`}
            onClick={() => handleDaySelect(day)}
          >
            {day}일
          </button>
        ))}
      </div>

      <div className="recommendation-section">
        <h3 className="section-title">추천 운동</h3>
        <div className="exercise-list">
          {currentData.exercises.map((exercise) => (
            <div key={exercise.id} className="exercise-item">
              <div className="exercise-placeholder"></div>
              <div className="exercise-info">
                <h4 className="exercise-name">{exercise.name}</h4>
                <p className="exercise-duration">{exercise.duration}</p>
              </div>
            </div>
          ))}
        </div>
        <button className="start-button" onClick={handleStartExercise}>
          추천 운동 시작하기
        </button>
      </div>

      <div className="recommendation-section">
        <h3 className="section-title">추천 식단</h3>
        <div className="meal-list">
          {currentData.meals.map((meal) => (
            <div key={meal.id} className="meal-item">
              <div className="meal-placeholder"></div>
              <div className="meal-info">
                <h4 className="meal-name">{meal.name}</h4>
                <p className="meal-description">{meal.description}</p>
              </div>
            </div>
          ))}
        </div>
        <button className="start-button" onClick={handleStartMeal}>
          추천 식단 확인하기
        </button>
      </div>
    </div>
  );
};
export default AIRecommend;
