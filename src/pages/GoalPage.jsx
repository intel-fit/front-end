import { useState } from "react";
import { useNavigate } from "react-router-dom";
import { IoArrowBack, IoCheckmark } from "react-icons/io5";
import "./GoalPage.css";

export default function GoalPage() {
  const navigate = useNavigate();
  const [goals, setGoals] = useState(() => {
    const savedGoals = localStorage.getItem("workoutGoals");
    return savedGoals
      ? JSON.parse(savedGoals)
      : {
          frequency: 3,
          duration: "30분 이상",
          type: "유산소",
          calories: 1500,
        };
  });

  const [isEditingDuration, setIsEditingDuration] = useState(false);
  const [isEditingCalories, setIsEditingCalories] = useState(false);

  const handleSave = () => {
    console.log("목표 저장:", goals);
    // localStorage에 목표 저장
    localStorage.setItem("workoutGoals", JSON.stringify(goals));
    // 다른 페이지에 변경 알림
    try {
      window.dispatchEvent(new Event("workout-goals-updated"));
    } catch (_) {}
    navigate("/stats");
  };

  const handleBack = () => {
    navigate("/stats");
  };

  const adjustFrequency = (change) => {
    setGoals((prev) => ({
      ...prev,
      frequency: Math.max(1, Math.min(7, prev.frequency + change)),
    }));
  };

  return (
    <div className="goal-page">
      <div className="goal-header">
        <h1>운동 목표 설정</h1>
        <button className="save-btn" onClick={handleSave}>
          <IoCheckmark />
        </button>
      </div>

      <div className="goal-content">
        <div className="goal-section">
          <h3>주간 운동 횟수</h3>
          <div className="frequency-control">
            <span className="frequency-value">주 {goals.frequency}회</span>
            <div className="adjust-buttons">
              <button
                className="adjust-btn"
                onClick={() => adjustFrequency(-1)}
              >
                -
              </button>
              <button className="adjust-btn" onClick={() => adjustFrequency(1)}>
                +
              </button>
            </div>
          </div>
        </div>

        <div className="goal-section">
          <h3>1회 운동 시간</h3>
          <div
            className="time-field"
            onClick={() => setIsEditingDuration(true)}
          >
            {isEditingDuration ? (
              <input
                type="text"
                value={goals.duration}
                onChange={(e) =>
                  setGoals({ ...goals, duration: e.target.value })
                }
                onBlur={() => setIsEditingDuration(false)}
                onKeyPress={(e) =>
                  e.key === "Enter" && setIsEditingDuration(false)
                }
                className="edit-input"
                autoFocus
              />
            ) : (
              <span>{goals.duration}</span>
            )}
          </div>
        </div>

        <div className="goal-section">
          <h3>운동 종류</h3>
          <div className="type-options">
            <button
              className={`type-btn ${goals.type === "전체" ? "active" : ""}`}
              onClick={() => setGoals({ ...goals, type: "전체" })}
            >
              전체
            </button>
            <button
              className={`type-btn ${goals.type === "유산소" ? "active" : ""}`}
              onClick={() => setGoals({ ...goals, type: "유산소" })}
            >
              유산소
            </button>
            <button
              className={`type-btn ${goals.type === "무산소" ? "active" : ""}`}
              onClick={() => setGoals({ ...goals, type: "무산소" })}
            >
              무산소
            </button>
          </div>
        </div>

        <div className="goal-section">
          <h3>주간 칼로리 소모 목표</h3>
          <div
            className="calorie-field"
            onClick={() => setIsEditingCalories(true)}
          >
            {isEditingCalories ? (
              <input
                type="number"
                value={goals.calories}
                onChange={(e) =>
                  setGoals({
                    ...goals,
                    calories: parseInt(e.target.value) || 0,
                  })
                }
                onBlur={() => setIsEditingCalories(false)}
                onKeyPress={(e) =>
                  e.key === "Enter" && setIsEditingCalories(false)
                }
                className="edit-input"
                autoFocus
              />
            ) : (
              <span>{goals.calories}kcal</span>
            )}
          </div>
        </div>
      </div>
    </div>
  );
}
