import { IoTrash } from "react-icons/io5";
import "./LogItem.css";

export default function LogItem({
  name,
  details,
  time,
  isCompleted = false,
  isLast = false,
  onClick,
  onDelete,
}) {
  return (
    <div className="log-item">
      <div
        className={`timeline-dot ${isCompleted ? "completed" : "pending"}`}
      ></div>
      <div
        className={`log-card ${isCompleted ? "completed" : "pending"}`}
        style={{ cursor: onClick ? "pointer" : "default" }}
      >
        <div className="log-info" onClick={onClick}>
          <h4 className="log-name">{name}</h4>
          <p className="log-details">{details}</p>
        </div>
        <div className="log-actions">
          <div className="log-time">{time}</div>
          {onDelete && (
            <button
              className="delete-btn"
              onClick={(e) => {
                e.stopPropagation();
                onDelete();
              }}
            >
              <IoTrash />
            </button>
          )}
        </div>
      </div>
      {!isLast && <div className="timeline-line"></div>}
    </div>
  );
}
