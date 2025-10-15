import "./Tabs.css";
import DietPage from "../pages/DietPage";
import Stats from "./Stats";
import GoalCard from "./GoalCard";
import LogSection from "./LogSection";

export default function Tabs({ activeTab, onTabChange }) {
  const tabs = ["운동기록", "식단기록", "AI 추천"];

  const renderTabContent = () => {
    switch (activeTab) {
      case 0:
        return (
          <>
            <Stats />
            <GoalCard />
            <LogSection />
          </>
        );
      case 1:
        return <DietPage />;
      case 2:
        return <div className="tab-content">AI 추천 페이지</div>;
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
