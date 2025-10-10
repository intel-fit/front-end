import "./Stat.css";

export default function Stat({ value, unit, percentage, date }) {
  return (
    <div className="stat">
      <div className="stat-date">{date}</div>
      <div className="stat-value">{value}</div>
      <div className="stat-unit">{unit}</div>
      <div className="stat-percentage">{percentage}</div>
    </div>
  );
}
