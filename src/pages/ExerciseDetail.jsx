import { useState } from "react";
import { useNavigate, useLocation } from "react-router-dom";
import "./ExerciseDetail.css";

const ExerciseDetail = () => {
  const navigate = useNavigate();
  const location = useLocation();

  const exerciseData = {
    day: "1일차",
    name: "덤벨 들기",
    sets: [
      { id: 1, weight: "10kg", reps: "10회", completed: true },
      { id: 2, weight: "10kg", reps: "10회", completed: false },
      { id: 3, weight: "10kg", reps: "10회", completed: false },
    ],
  };

  const [sets, setSets] = useState(exerciseData.sets);

  const handleSetComplete = (setId) => {
    setSets(
      sets.map((set) =>
        set.id === setId ? { ...set, completed: !set.completed } : set
      )
    );
  };

  const handleRestTimer = () => {
    alert("휴식 타이머 기능 (추후 구현)");
  };

  const handleSetCompleteAll = () => {
    alert("세트 완료 기능 (추후 구현)");
  };

  return (
    <div className="exercise-detail-page">
      <div className="exercise-header">
        <button className="back-btn" onClick={() => navigate(-1)}>
          ←
        </button>
        <h1 className="page-title">{exerciseData.day} 추천 운동</h1>
      </div>

      <div className="exercise-name-section">
        <h2 className="exercise-name">{exerciseData.name}</h2>
      </div>

      <div className="exercise-image-container">
        <div className="exercise-image-placeholder"></div>
      </div>

      <div className="sets-container">
        {sets.map((set) => (
          <div
            key={set.id}
            className={`set-item ${set.completed ? "completed" : ""}`}
            onClick={() => handleSetComplete(set.id)}
          >
            <span className="set-number">{set.id} Set</span>
            <span className="set-weight">{set.weight}</span>
            <span className="set-reps">{set.reps}</span>
            {set.completed && <span className="check-icon">✓</span>}
          </div>
        ))}
      </div>

      <div className="action-buttons">
        <button className="rest-timer-btn" onClick={handleRestTimer}>
          휴식 타이머
        </button>
        <button className="set-complete-btn" onClick={handleSetCompleteAll}>
          세트 완료
        </button>
      </div>
    </div>
  );
};

export default ExerciseDetail;
