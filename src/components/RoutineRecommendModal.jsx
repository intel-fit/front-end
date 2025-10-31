import React, { useState, useEffect } from "react";
import { useNavigate } from "react-router-dom";
import styles from "./RoutineRecommendModal.module.css";

const RoutineRecommendModal = ({ isOpen, onClose }) => {
  const navigate = useNavigate();
  const [savedRoutines, setSavedRoutines] = useState([]);
  const [selectedRoutine, setSelectedRoutine] = useState(null);
  const [selectedDay, setSelectedDay] = useState(0);

  const weekDays = [
    "1일차",
    "2일차",
    "3일차",
    "4일차",
    "5일차",
    "6일차",
    "7일차",
  ];

  // Load saved routines from localStorage
  useEffect(() => {
    if (isOpen) {
      const storedRoutines = JSON.parse(
        localStorage.getItem("savedRoutines") || "[]"
      );
      setSavedRoutines(storedRoutines);
    }
  }, [isOpen]);

  if (!isOpen) return null;

  const handleRoutineClick = (routine) => {
    setSelectedRoutine(routine);
    setSelectedDay(0);
  };

  const handleBack = () => {
    setSelectedRoutine(null);
    setSelectedDay(0);
  };

  const handleDelete = (routineId, e) => {
    e.stopPropagation();
    if (window.confirm("이 루틴을 삭제하시겠습니까?")) {
      const updatedRoutines = savedRoutines.filter((r) => r.id !== routineId);
      localStorage.setItem("savedRoutines", JSON.stringify(updatedRoutines));
      setSavedRoutines(updatedRoutines);
    }
  };

  const handleGoToRecommend = () => {
    onClose();
    navigate("/routine");
  };

  return (
    <div className={styles['routine-history-modal-overlay']} onClick={onClose}>
      <div
        className={styles['routine-history-modal']}
        onClick={(e) => e.stopPropagation()}
      >
        <div className={styles['routine-history-header']}>
          <h2>{selectedRoutine ? "루틴 상세보기" : "운동 추천 내역"}</h2>
          <button className={styles['close-btn']} onClick={onClose}>
            ✕
          </button>
        </div>

        <div className={styles['routine-history-content']}>
          {!selectedRoutine ? (
            // 루틴 목록 표시
            <>
              {savedRoutines.length === 0 ? (
                <div className={styles['empty-state']}>
                  <p>저장된 운동 루틴이 없습니다.</p>
                  <p className={styles['empty-subtitle']}>
                    운동 추천을 받고 루틴을 저장해보세요!
                  </p>
                  <button
                    className={styles['go-to-recommend-btn']}
                    onClick={handleGoToRecommend}
                  >
                    추천받으러 가기 →
                  </button>
                </div>
              ) : (
                <div className={styles['routine-list']}>
                  {savedRoutines.map((routine) => (
                    <div
                      key={routine.id}
                      className={styles['routine-card']}
                      onClick={() => handleRoutineClick(routine)}
                    >
                      <div className={styles['routine-card-header']}>
                        <div className={styles['routine-date']}>
                          <span className={styles['date-icon']}>📅</span>
                          {routine.date}
                        </div>
                        <button
                          className={styles['delete-btn']}
                          onClick={(e) => handleDelete(routine.id, e)}
                        >
                          🗑️
                        </button>
                      </div>
                      <div className={styles['routine-card-body']}>
                        {routine.level && (
                          <span className={`${styles['routine-badge']} ${styles['level-badge']}`}>
                            {routine.level}
                          </span>
                        )}
                        {routine.targetParts &&
                          routine.targetParts.length > 0 && (
                            <span className={`${styles['routine-badge']} ${styles['target-badge']}`}>
                              집중: {routine.targetParts.join(", ")}
                            </span>
                          )}
                        {routine.weakParts && routine.weakParts.length > 0 && (
                          <span className={`${styles['routine-badge']} ${styles['weak-badge']}`}>
                            주의: {routine.weakParts.join(", ")}
                          </span>
                        )}
                      </div>
                      <div className={styles['routine-card-footer']}>
                        <span className={styles['view-detail']}>자세히 보기 →</span>
                      </div>
                    </div>
                  ))}
                </div>
              )}
            </>
          ) : (
            // 선택된 루틴 상세 표시
            <div className={styles['routine-detail']}>
              <button className={styles['back-btn']} onClick={handleBack}>
                ← 목록으로
              </button>

              <div className={styles['routine-detail-info']}>
                <div className={styles['detail-date']}>{selectedRoutine.date}</div>
                <div className={styles['detail-badges']}>
                  {selectedRoutine.level && (
                    <span className={styles['detail-badge']}>
                      {selectedRoutine.level}
                    </span>
                  )}
                  {selectedRoutine.targetParts &&
                    selectedRoutine.targetParts.length > 0 && (
                      <span className={styles['detail-badge']}>
                        집중: {selectedRoutine.targetParts.join(", ")}
                      </span>
                    )}
                </div>
              </div>

              <div className={styles['day-tabs']}>
                {weekDays.map((day, index) => (
                  <button
                    key={index}
                    className={`${styles['day-tab']} ${
                      selectedDay === index ? styles.active : ""}`}
                    onClick={() => setSelectedDay(index)}
                  >
                    {day}
                  </button>
                ))}
              </div>

              <div className={styles['exercise-list']}>
                {selectedRoutine.routine[selectedDay]?.map(
                  (exercise, index) => (
                    <div key={index} className={styles['exercise-item']}>
                      <div className={styles['exercise-icon']}>{exercise.icon}</div>
                      <div className={styles['exercise-info']}>
                        <h4>{exercise.name}</h4>
                        <p>{exercise.detail}</p>
                      </div>
                    </div>
                  )
                )}
              </div>
            </div>
          )}
        </div>
      </div>
    </div>
  );
};

export default RoutineRecommendModal;
