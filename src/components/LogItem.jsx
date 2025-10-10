import "./LogItem.css";

export default function LogItem({
  name,
  details,
  time,
  isCompleted = false,
  isLast = false,
}) {
  return (
    <div className="log-item">
      <div className="timeline-dot"></div>
      <div className={`log-card ${isCompleted ? "completed" : "pending"}`}>
        <div className="log-info">
          <h4 className="log-name">{name}</h4>
          <p className="log-details">{details}</p>
        </div>
        <div className="log-time">{time}</div>
      </div>
      {!isLast && <div className="timeline-line"></div>}
    </div>
  );
}
