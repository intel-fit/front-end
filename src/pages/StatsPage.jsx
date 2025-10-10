import { useState, useEffect } from "react";
import Header from "../components/Header";
import Tabs from "../components/Tabs";
import Stats from "../components/Stats";
import GoalCard from "../components/GoalCard";
import LogSection from "../components/LogSection";
import "./StatsPage.css";

export default function StatsPage() {
  const [activeTab, setActiveTab] = useState(0);
  const [goalData, setGoalData] = useState(null);

  useEffect(() => {
    const savedGoals = localStorage.getItem("workoutGoals");
    if (savedGoals) {
      setGoalData(JSON.parse(savedGoals));
    }
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
        return (
          <div className="empty-tab">
            <p>AI 추천 기능은 준비 중입니다.</p>
          </div>
        );
      default:
        return null;
    }
  };

  return (
    <div className="stats-page">
      <Header title="기록하기" />
      <Tabs activeTab={activeTab} onTabChange={handleTabChange} />

      {renderTabContent()}
    </div>
  );
}
