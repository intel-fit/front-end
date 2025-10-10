import { useState } from "react";
import Header from "../components/Header";
import "./GoalPage.css";

export default function GoalPage() {
  const [goals, setGoals] = useState({
    frequency: "",
    duration: "",
    type: "",
  });

  const handleSave = () => {
    // 목표 저장 로직
    console.log("목표 저장:", goals);
    // 실제로는 API 호출이나 상태 관리
  };

  return (
    <div className="goal-page">
      <Header title="운동 목표 설정" />

      <div className="goal-content">
        <div className="goal-section">
          <h3>운동 빈도</h3>
          <div className="goal-options">
            <button
              className={`option ${
                goals.frequency === "주 3회" ? "active" : ""
              }`}
              onClick={() => setGoals({ ...goals, frequency: "주 3회" })}
            >
              주 3회
            </button>
            <button
              className={`option ${
                goals.frequency === "주 4회" ? "active" : ""
              }`}
              onClick={() => setGoals({ ...goals, frequency: "주 4회" })}
            >
              주 4회
            </button>
            <button
              className={`option ${
                goals.frequency === "주 5회" ? "active" : ""
              }`}
              onClick={() => setGoals({ ...goals, frequency: "주 5회" })}
            >
              주 5회
            </button>
          </div>
        </div>

        <div className="goal-section">
          <h3>운동 시간</h3>
          <div className="goal-options">
            <button
              className={`option ${goals.duration === "30분" ? "active" : ""}`}
              onClick={() => setGoals({ ...goals, duration: "30분" })}
            >
              30분
            </button>
            <button
              className={`option ${goals.duration === "45분" ? "active" : ""}`}
              onClick={() => setGoals({ ...goals, duration: "45분" })}
            >
              45분
            </button>
            <button
              className={`option ${goals.duration === "60분" ? "active" : ""}`}
              onClick={() => setGoals({ ...goals, duration: "60분" })}
            >
              60분
            </button>
          </div>
        </div>

        <div className="goal-section">
          <h3>운동 유형</h3>
          <div className="goal-options">
            <button
              className={`option ${goals.type === "유산소" ? "active" : ""}`}
              onClick={() => setGoals({ ...goals, type: "유산소" })}
            >
              유산소
            </button>
            <button
              className={`option ${goals.type === "근력" ? "active" : ""}`}
              onClick={() => setGoals({ ...goals, type: "근력" })}
            >
              근력
            </button>
            <button
              className={`option ${goals.type === "혼합" ? "active" : ""}`}
              onClick={() => setGoals({ ...goals, type: "혼합" })}
            >
              혼합
            </button>
          </div>
        </div>

        <button className="save-btn" onClick={handleSave}>
          목표 저장하기
        </button>
      </div>
    </div>
  );
}
