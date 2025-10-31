import { IoTrash } from "react-icons/io5";
import styles from "./LogItem.module.css";

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
    <div className={styles['log-item']}>
      <div
        className={`${styles['timeline-dot']} ${isCompleted  ? styles['completed'] : styles['pending']}`}
      ></div>
      <div
        className={`${styles['log-card']} ${isCompleted  ? styles['completed'] : styles['pending']}`}
        style={{ cursor: onClick ? "pointer" : "default" }}
      >
        <div className={styles['log-info']} onClick={onClick}>
          <h4 className={styles['log-name']}>{name}</h4>
          <p className={styles['log-details']}>{details}</p>
        </div>
        <div className={styles['log-actions']}>
          <div className={styles['log-time']}>{time}</div>
          {onDelete && (
            <button
              className={styles['delete-btn']}
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
      {!isLast && <div className={styles['timeline-line']}></div>}
    </div>
  );
}
