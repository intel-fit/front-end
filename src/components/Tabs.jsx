import styles from "./Tabs.module.css";
import DietPage from "../pages/DietPage";
import ExerciseRecordPage from "../pages/ExerciseRecordPage";
// AI 추천 탭 제거

export default function Tabs({ activeTab, onTabChange, goalData }) {
  const tabs = ["운동기록", "식단기록"];

  const renderTabContent = () => {
    switch (activeTab) {
      case 0:
        return <ExerciseRecordPage goalData={goalData} />;
      case 1:
        return <DietPage />;
      // AI 추천 탭 제거됨
      default:
        return <div className={styles["tab-content"]}>기본 페이지</div>;
    }
  };

  return (
    <div className={styles["tabs-container"]}>
      <div className={styles["tabs"]}>
        {tabs.map((tab, index) => (
          <button
            key={index}
            className={`${styles["tab"]} ${
              activeTab === index ? styles["active"] : ""
            }`}
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
