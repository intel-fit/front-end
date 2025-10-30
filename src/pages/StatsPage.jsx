import { useState, useEffect } from "react";
import Header from "../components/Header";
import Tabs from "../components/Tabs";
import Stats from "../components/Stats";
import GoalCard from "../components/GoalCard";
import LogSection from "../components/LogSection";
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

  const renderTabContent = () => {
    switch (activeTab) {
      case 0: // 운동기록
        return (
          <>
            <Stats />
            <GoalCard goalData={goalData} />
            <LogSection />
          </>
        );
      case 1: // 식단기록
        return (
          <div className="empty-tab">
            <p>식단기록 기능은 준비 중입니다.</p>
          </div>
        );
      case 2: // AI 추천
        return <div className="empty-tab"></div>;
      default:
        return null;
    }
  };

  return (
    <div className="stats-page">
      <Header title="기록하기" />
      <Tabs
        activeTab={activeTab}
        onTabChange={handleTabChange}
        goalData={goalData}
      />

      {renderTabContent()}
    </div>
  );
}
