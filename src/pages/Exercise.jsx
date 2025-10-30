import React, { useEffect, useMemo, useState } from "react";
import { useNavigate } from "react-router-dom";
import "./Exercise.css";
import Header from "../components/Header";

const Exercise = () => {
  const navigate = useNavigate();
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
    } catch (_) {
      // noop
    }
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

  useEffect(() => {
    // 첫페이지는 사용하지 않고, 목표 설정 확인 후 보이는 레이아웃(기록하기 탭 화면)으로 이동
    navigate("/stats", { replace: true });
  }, [navigate]);

  return null;
};

export default Exercise;
