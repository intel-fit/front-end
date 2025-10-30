import { useState } from "react";
import LogItem from "./LogItem";
import ExerciseModal from "./ExerciseModal";
import "./LogSection.css";

export default function LogSection() {
  const [activities, setActivities] = useState([]);
  const [isModalOpen, setIsModalOpen] = useState(false);
  const [modalMode, setModalMode] = useState("add");
  const [selectedExercise, setSelectedExercise] = useState(null);

  const handleAddWorkout = () => {
    setModalMode("add");
    setIsModalOpen(true);
  };

  const handleExerciseClick = (exercise) => {
    setModalMode("edit");
    setSelectedExercise(exercise);
    setIsModalOpen(true);
  };

  const handleModalClose = () => {
    setIsModalOpen(false);
    setSelectedExercise(null);
  };

  const handleExerciseSave = (sets, exerciseName) => {
    const allSetsCompleted = sets.every((set) => set.completed);

    if (modalMode === "edit" && selectedExercise) {
      // 기존 운동 수정
      setActivities(
        activities.map((activity) => {
          if (activity.id === selectedExercise.id) {
            return {
              ...activity,
              details: `${sets[0]?.weight || 20}kg ${sets[0]?.reps || 12}회 ${
                sets.length
              }세트`,
              isCompleted: allSetsCompleted,
              sets: sets, // 세트 정보 저장
            };
          }
          return activity;
        })
      );
    } else {
      // 새로운 운동 추가
      const newWorkout = {
        id: Date.now(),
        name: exerciseName || "새로운 운동",
        details: `${sets[0]?.weight || 20}kg ${sets[0]?.reps || 12}회 ${
          sets.length
        }세트`,
        time: new Date().toLocaleTimeString("ko-KR", {
          hour: "2-digit",
          minute: "2-digit",
          hour12: true,
        }),
        isCompleted: allSetsCompleted,
        sets: sets, // 세트 정보 저장
      };
      setActivities([...activities, newWorkout]);
    }
    handleModalClose();
  };

  const handleDeleteWorkout = (workoutId) => {
    if (window.confirm("이 운동을 삭제하시겠습니까?")) {
      setActivities(activities.filter((activity) => activity.id !== workoutId));
    }
  };

  const hasItems = activities.length > 0;

  return (
    <div className="log-section">
      <h3 className="section-title">운동 기록하기</h3>
      <div className={`log-timeline ${hasItems ? "has-items" : "empty"}`}>
        {activities.map((activity, index) => (
          <LogItem
            key={activity.id}
            name={activity.name}
            details={activity.details}
            time={activity.time}
            isCompleted={activity.isCompleted}
            isLast={index === activities.length - 1}
            onClick={() => handleExerciseClick(activity)}
            onDelete={() => handleDeleteWorkout(activity.id)}
          />
        ))}
        <div className="add-item">
          <div className="timeline-dot"></div>
          <button className="add-btn" onClick={handleAddWorkout}>
            운동 추가하기
          </button>
        </div>
      </div>

      <ExerciseModal
        isOpen={isModalOpen}
        onClose={handleModalClose}
        mode={modalMode}
        exerciseData={selectedExercise}
        onSave={handleExerciseSave}
      />
    </div>
  );
}
