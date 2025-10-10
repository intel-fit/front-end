import { useState } from "react";
import LogItem from "./LogItem";
import "./LogSection.css";

export default function LogSection() {
  const [activities, setActivities] = useState([]);

  const handleAddWorkout = () => {
    const newWorkout = {
      id: Date.now(),
      name: "새로운 운동",
      details: "무게 10회 3세트",
      time: new Date().toLocaleTimeString("ko-KR", {
        hour: "2-digit",
        minute: "2-digit",
        hour12: true,
      }),
      isCompleted: false,
    };
    setActivities([...activities, newWorkout]);
  };

  return (
    <div className="log-section">
      <h3 className="section-title">운동 기록하기</h3>
      <div className="log-timeline">
        {activities.map((activity, index) => (
          <LogItem
            key={activity.id}
            name={activity.name}
            details={activity.details}
            time={activity.time}
            isCompleted={activity.isCompleted}
            isLast={index === activities.length - 1}
          />
        ))}
        <div className="add-item">
          <div className="timeline-dot"></div>
          <button className="add-btn" onClick={handleAddWorkout}>
            운동 추가하기
          </button>
        </div>
      </div>
    </div>
  );
}
