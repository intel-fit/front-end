import React, { useEffect, useMemo, useState } from "react";
import { useNavigate } from "react-router-dom";
import "./AddMealPage.css";

const AddMealPage = () => {
  const navigate = useNavigate();
  const [activeTab, setActiveTab] = useState("exercise");
  const [workoutGoals, setWorkoutGoals] = useState(() => {
    try {
      const saved = localStorage.getItem("workoutGoals");
      return saved
        ? JSON.parse(saved)
        : {
            frequency: 3,
            duration: "30분 이상",
            type: "유산소",
            calories: 1500,
          };
    } catch (_) {
      return {
        frequency: 3,
        duration: "30분 이상",
        type: "유산소",
        calories: 1500,
      };
    }
  });
  const [completedThisWeek, setCompletedThisWeek] = useState(() => {
    const raw = localStorage.getItem("workoutCompletedThisWeek");
    const n = raw ? parseInt(raw, 10) : 0;
    return Number.isFinite(n) ? n : 0;
  });

  useEffect(() => {
    try {
      const saved = localStorage.getItem("workoutGoals");
      if (saved) setWorkoutGoals(JSON.parse(saved));
      const raw = localStorage.getItem("workoutCompletedThisWeek");
      const n = raw ? parseInt(raw, 10) : 0;
      setCompletedThisWeek(Number.isFinite(n) ? n : 0);
    } catch (_) {}
  }, []);

  const goalSubtitle = useMemo(() => {
    const freq = workoutGoals?.frequency ?? 3;
    const dur = workoutGoals?.duration ?? "30분 이상";
    return `주 ${freq}회 하루 ${dur}`;
  }, [workoutGoals]);

  const goalProgressPercent = useMemo(() => {
    const target = Math.max(1, workoutGoals?.frequency ?? 1);
    const done = Math.max(0, completedThisWeek);
    return Math.max(0, Math.min(100, Math.round((done / target) * 100)));
  }, [workoutGoals, completedThisWeek]);

  const GoalCard = () => (
    <div className="goal-card">
      <div className="goal-card-header">
        <div className="goal-title">운동 목표 설정</div>
        <button
          className="goal-arrow"
          aria-label="open-goal"
          onClick={() => navigate("/goal")}
        >
          <svg width="22" height="22" viewBox="0 0 24 24" fill="none">
            <path
              d="M9 18l6-6-6-6"
              stroke="#ccc"
              strokeWidth="2"
              strokeLinecap="round"
              strokeLinejoin="round"
            />
          </svg>
        </button>
      </div>
      <div className="goal-sub">{goalSubtitle}</div>
      <div className="goal-progress">
        <div
          className="goal-progress-fill"
          style={{ width: `${goalProgressPercent}%` }}
        />
      </div>
    </div>
  );

  const ExerciseTimeline = () => (
    <div className="exercise-timeline">
      <div className="timeline-line" />

      <div className="timeline-item completed">
        <div className="dot" />
        <div className="exercise-card muted">
          <div className="exercise-left">
            <div className="exercise-name">펙 덱 플라이</div>
            <div className="exercise-meta">20kg 15회 3세트</div>
          </div>
          <div className="exercise-time">9:00 AM</div>
        </div>
      </div>

      <div className="timeline-item">
        <div className="dot" />
        <div className="exercise-card">
          <div className="exercise-left">
            <div className="exercise-name">리버스 펙 덱 플라이</div>
            <div className="exercise-meta">20kg 15회 3세트</div>
          </div>
          <div className="exercise-time">9:04 AM</div>
        </div>
      </div>

      <div className="timeline-item last">
        <div className="dot" />
        <button
          className="exercise-add-card"
          onClick={() => navigate("/exercise-detail")}
        >
          운동 추가하기
        </button>
      </div>
    </div>
  );

  return (
    <div className="add-meal-page">
      <div className="record-header">
        <h1 className="record-title">기록하기</h1>
        <button className="bell-btn" aria-label="알림">
          🔔
        </button>
      </div>

      <div className="record-tabs">
        <button
          className={`record-tab ${activeTab === "exercise" ? "active" : ""}`}
          onClick={() => setActiveTab("exercise")}
        >
          운동기록
        </button>
        <button
          className={`record-tab ${activeTab === "meal" ? "active" : ""}`}
          onClick={() => setActiveTab("meal")}
        >
          식단기록
        </button>
      </div>

      <div className="mini-stats">
        {Array.from({ length: 8 }).map((_, idx) => (
          <div key={idx} className="mini-stat">
            <div className="ms-top">15</div>
            <div className="ms-mid">388k</div>
            <div className="ms-btm">97%</div>
          </div>
        ))}
      </div>

      <GoalCard />

      <h2 className="section-title">운동 기록하기</h2>
      <ExerciseTimeline />
    </div>
  );
};

export default AddMealPage;
