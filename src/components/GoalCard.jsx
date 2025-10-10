import { useNavigate } from "react-router-dom";
import { IoChevronForward } from "react-icons/io5";
import "./GoalCard.css";

export default function GoalCard() {
  const navigate = useNavigate();

  const handleClick = () => {
    navigate("/goal");
  };

  return (
    <div className="goal-card" onClick={handleClick}>
      <div className="goal-content">
        <h3 className="goal-title">운동 목표 설정</h3>
        <p className="goal-description">-</p>
      </div>
      <IoChevronForward className="goal-arrow" />
    </div>
  );
}
