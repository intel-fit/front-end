import { useNavigate } from "react-router-dom";
import { IoChevronForward } from "react-icons/io5";
import styles from "./GoalCard.module.css";

export default function GoalCard({ goalData }) {
  const navigate = useNavigate();

  const handleClick = () => {
    navigate("/goal");
  };

  const getGoalDescription = () => {
    if (!goalData) return "-";

    const { frequency, duration, type, calories } = goalData;
    return `주 ${frequency}회, ${duration}, ${type}, ${calories}kcal`;
  };

  const getProgressPercentage = () => {
    if (!goalData) return 0;
    try {
      const raw = localStorage.getItem("workoutCompletedThisWeek");
      const completed = raw ? parseInt(raw, 10) : 0;
      const target = Math.max(1, goalData.frequency || 1);
      return Math.min(100, Math.max(0, Math.round((completed / target) * 100)));
    } catch (_) {
      return 0;
    }
  };

  return (
    <div className={styles['goal-card']} onClick={handleClick}>
      <div className={styles['goal-content']}>
        <h3 className={styles['goal-title']}>운동 목표 설정</h3>
        <p className={styles['goal-description']}>{getGoalDescription()}</p>
        {goalData && (
          <div className={styles['progress-container']}>
            <div className={styles['progress-bar']}>
              <div
                className={styles['progress-fill']}
                style={{ width: `${getProgressPercentage()}%` }}
              ></div>
            </div>
            <span className={styles['progress-text']}>{getProgressPercentage()}%</span>
          </div>
        )}
      </div>
      <IoChevronForward className={styles['goal-arrow']} />
    </div>
  );
}
