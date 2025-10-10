import Stat from "./Stat";
import "./Stats.css";

export default function Stats() {
  const statsData = [
    { value: "12", unit: "245k", percentage: "85%", date: "월" },
    { value: "13", unit: "278k", percentage: "81%", date: "화" },
    { value: "14", unit: "321k", percentage: "88%", date: "수" },
    { value: "15", unit: "388k", percentage: "97%", date: "목" },
    { value: "16", unit: "456k", percentage: "94%", date: "금" },
    { value: "17", unit: "489k", percentage: "96%", date: "토" },
    { value: "18", unit: "512k", percentage: "92%", date: "일" },
  ];

  return (
    <div className="stats">
      {statsData.map((stat, index) => (
        <Stat
          key={index}
          value={stat.value}
          unit={stat.unit}
          percentage={stat.percentage}
          date={stat.date}
        />
      ))}
    </div>
  );
}
