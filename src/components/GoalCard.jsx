import { useNavigate } from "react-router-dom";
import { IoChevronForward } from "react-icons/io5";
import "./GoalCard.css";

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
    // 예시: 주 3회 목표 중 2회 완료했다면 67%
    // 실제로는 완료된 운동 횟수를 계산해야 함
    const completedWorkouts = 2; // 임시 값
    const targetWorkouts = goalData.frequency;
    return Math.min(
      100,
      Math.round((completedWorkouts / targetWorkouts) * 100)
    );
  };

  return (
    <div className="goal-card" onClick={handleClick}>
      <div className="goal-content">
        <h3 className="goal-title">운동 목표 설정</h3>
        <p className="goal-description">{getGoalDescription()}</p>
        {goalData && (
          <div className="progress-container">
            <div className="progress-bar">
              <div
                className="progress-fill"
                style={{ width: `${getProgressPercentage()}%` }}
              ></div>
            </div>
            <span className="progress-text">{getProgressPercentage()}%</span>
          </div>
        )}
      </div>
      <IoChevronForward className="goal-arrow" />
    </div>
  );
}
