import { useNavigate } from "react-router-dom";
import styles from "./WeeklyCalendar.module.css";

export default function WeeklyCalendar({ clickable = true }) {
  const navigate = useNavigate();

  const handleClick = () => {
    if (clickable) {
      navigate("/calendar");
    }
  };

  return (
    <div 
      className={styles['weekly-calendar']} 
      onClick={handleClick}
      style={{ cursor: clickable ? 'pointer' : 'default' }}
    >
      <div className={styles['progress-grid']}>
        {[1, 2, 3, 4, 5, 6, 7].map((day) => (
          <div key={day} className={styles['progress-item']}>
            <div className={`${styles['progress-number']} ${day === 4 ? styles.today : ''}`}>
              15
            </div>
            <div className={styles['progress-calories']}>388k</div>
            <div className={styles['progress-percentage']}>97%</div>
          </div>
        ))}
      </div>
    </div>
  );
}

