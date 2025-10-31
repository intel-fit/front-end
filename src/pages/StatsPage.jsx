import { useState, useEffect } from "react";
import Header from "../components/Header";
import Tabs from "../components/Tabs";
import "./StatsPage.css";

export default function StatsPage() {
  const [activeTab, setActiveTab] = useState(0);
  const [goalData, setGoalData] = useState(() => {
    try {
      const savedGoals = localStorage.getItem("workoutGoals");
      return savedGoals ? JSON.parse(savedGoals) : null;
    } catch (_) {
      return null;
    }
  });

  useEffect(() => {
    const readGoals = () => {
      try {
        const savedGoals = localStorage.getItem("workoutGoals");
        setGoalData(savedGoals ? JSON.parse(savedGoals) : null);
      } catch (_) {
        setGoalData(null);
      }
    };

    readGoals();

    const onStorage = (e) => {
      if (e.key === "workoutGoals") readGoals();
    };
    const onCustom = () => readGoals();
    window.addEventListener("storage", onStorage);
    window.addEventListener("workout-goals-updated", onCustom);
    return () => {
      window.removeEventListener("storage", onStorage);
      window.removeEventListener("workout-goals-updated", onCustom);
    };
  }, []);

  const handleTabChange = (index) => {
    setActiveTab(index);
  };

  // 탭 콘텐츠는 Tabs 컴포넌트에서 렌더링합니다.

  return (
    <div className="stats-page">
      <Header title="기록하기" />
      <Tabs
        activeTab={activeTab}
        onTabChange={handleTabChange}
        goalData={goalData}
      />

      {/* 탭 콘텐츠는 Tabs 내부에서 렌더링됨 */}
    </div>
  );
}
