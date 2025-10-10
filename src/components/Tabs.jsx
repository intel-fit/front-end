import "./Tabs.css";

export default function Tabs({ activeTab, onTabChange }) {
  const tabs = ["운동기록", "식단기록", "AI 추천"];

  return (
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
  );
}
