import { useState } from "react";
import { useNavigate, useLocation } from "react-router-dom";
import styles from "./ExerciseDetail.module.css";

const ExerciseDetail = () => {
  const navigate = useNavigate();
  const location = useLocation();

  const exerciseData = {
    day: "1일차",
    name: "덤벨 들기",
    sets: [
      { id: 1, weight: "10kg", reps: "10회", completed: true },
      { id: 2, weight: "10kg", reps: "10회", completed: false },
      { id: 3, weight: "10kg", reps: "10회", completed: false },
    ],
  };

  const [sets, setSets] = useState(exerciseData.sets);

  const handleSetComplete = (setId) => {
    setSets(
      sets.map((set) =>
        set.id === setId ? { ...set, completed: !set.completed } : set
      )
    );
  };

  const handleRestTimer = () => {
    alert("휴식 타이머 기능 (추후 구현)");
  };

  const handleSetCompleteAll = () => {
    alert("세트 완료 기능 (추후 구현)");
  };

  return (
    <div className={styles['exercise-detail-page']}>
      <div className={styles['exercise-header']}>
        <button className={styles['back-btn']} onClick={() => navigate(-1)}>
          ←
        </button>
        <h1 className={styles['page-title']}>{exerciseData.day} 추천 운동</h1>
      </div>

      <div className={styles['exercise-name-section']}>
        <h2 className={styles['exercise-name']}>{exerciseData.name}</h2>
      </div>

      <div className={styles['exercise-image-container']}>
        <div className={styles['exercise-image-placeholder']}></div>
      </div>

      <div className={styles['sets-container']}>
        {sets.map((set) => (
          <div
            key={set.id}
            className={`${styles['set-item']} ${set.completed  ? styles['completed'] : ""}`}
            onClick={() => handleSetComplete(set.id)}
          >
            <span className={styles['set-number']}>{set.id} Set</span>
            <span className={styles['set-weight']}>{set.weight}</span>
            <span className={styles['set-reps']}>{set.reps}</span>
            {set.completed && <span className={styles['check-icon']}>✓</span>}
          </div>
        ))}
      </div>

      <div className={styles['action-buttons']}>
        <button className={styles['rest-timer-btn']} onClick={handleRestTimer}>
          휴식 타이머
        </button>
        <button className={styles['set-complete-btn']} onClick={handleSetCompleteAll}>
          세트 완료
        </button>
      </div>
    </div>
  );
};

export default ExerciseDetail;
