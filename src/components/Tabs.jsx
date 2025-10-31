import "./Tabs.css";
import DietPage from "../pages/DietPage";
import Stats from "./Stats";
import GoalCard from "./GoalCard";
import LogSection from "./LogSection";
import WeeklyCalendar from "./WeeklyCalendar";
// AI 추천 탭 제거

export default function Tabs({ activeTab, onTabChange, goalData }) {
  const tabs = ["운동기록", "식단기록"];

  const renderTabContent = () => {
    switch (activeTab) {
      case 0:
        return (
          <>
            <WeeklyCalendar />
            <Stats />
            <GoalCard goalData={goalData} />
            <LogSection />
          </>
        );
      case 1:
        return (
          <>
            <WeeklyCalendar />
            <DietPage />
          </>
        );
      // AI 추천 탭 제거됨
      default:
        return <div className="tab-content">기본 페이지</div>;
    }
  };

  return (
    <div className="tabs-container">
      <div className="tabs">
        {tabs.map((tab, index) => (
          <button
            key={index}
            className={`tab ${activeTab === index ? "active" : ""}`}
            onClick={() => onTabChange(index)}
          >
            {tab}
          </button>
        ))}
      </div>
      {renderTabContent()}
    </div>
  );
}
