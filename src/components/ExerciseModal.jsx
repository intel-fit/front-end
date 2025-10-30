import React, { useState, useEffect } from "react";
import { IoClose, IoSearch, IoAdd, IoCheckmark } from "react-icons/io5";
import "./ExerciseModal.css";

export default function ExerciseModal({
  isOpen,
  onClose,
  mode,
  exerciseData,
  onSave,
}) {
  const [searchTerm, setSearchTerm] = useState("");
  const [selectedCategory, setSelectedCategory] = useState("전체");
  const [currentMode, setCurrentMode] = useState(mode);
  const [selectedExercise, setSelectedExercise] = useState(null);
  const [sets, setSets] = useState([
    { id: 1, weight: 20, reps: 15, completed: false },
    { id: 2, weight: 20, reps: 12, completed: false },
    { id: 3, weight: 20, reps: 12, completed: false },
  ]);

  // 모달이 열릴 때마다 모드를 초기화
  useEffect(() => {
    if (isOpen) {
      if (mode === "add") {
        setCurrentMode("add");
        setSelectedExercise(null);
        setSets([
          { id: 1, weight: 20, reps: 15, completed: false },
          { id: 2, weight: 20, reps: 12, completed: false },
          { id: 3, weight: 20, reps: 12, completed: false },
        ]);
      } else if (mode === "edit") {
        // 기존 운동 수정 모드 - 세트 화면으로 바로 이동
        setCurrentMode("detail");
        setSelectedExercise(exerciseData);
        // 저장된 세트 정보가 있으면 불러오기, 없으면 기본 3세트
        if (exerciseData?.sets && exerciseData.sets.length > 0) {
          setSets(exerciseData.sets);
        } else {
          setSets([
            { id: 1, weight: 20, reps: 15, completed: false },
            { id: 2, weight: 20, reps: 12, completed: false },
            { id: 3, weight: 20, reps: 12, completed: false },
          ]);
        }
      } else {
        setCurrentMode(mode);
      }
    }
  }, [isOpen, mode, exerciseData]);

  const categories = ["전체", "가슴", "등", "하체", "어깨", "팔", "코어"];

  const exercises = [
    { name: "스텝밀 (천국의계단)", category: "하체", lastUsed: "2시간 전" },
    { name: "리버스 펙 덱 플라이", category: "가슴", lastUsed: "4일 전" },
    { name: "시티드 로우 머신", category: "등", lastUsed: "4일 전" },
    { name: "풀다운 머신", category: "등", lastUsed: "4일 전" },
    { name: "펙 덱 플라이", category: "가슴", lastUsed: "4일 전" },
  ];

  const filteredExercises = exercises.filter((exercise) => {
    const matchesSearch = exercise.name
      .toLowerCase()
      .includes(searchTerm.toLowerCase());
    const matchesCategory =
      selectedCategory === "전체" || exercise.category === selectedCategory;
    return matchesSearch && matchesCategory;
  });

  const handleSetChange = (setId, field, value) => {
    setSets((prev) =>
      prev.map((set) => (set.id === setId ? { ...set, [field]: value } : set))
    );
  };

  const handleSetComplete = (setId) => {
    setSets((prev) =>
      prev.map((set) =>
        set.id === setId ? { ...set, completed: !set.completed } : set
      )
    );
  };

  const handleAddSet = () => {
    const newSet = {
      id: sets.length + 1,
      weight: 20,
      reps: 12,
      completed: false,
    };
    setSets((prev) => [...prev, newSet]);
  };

  const handleRemoveSet = (setId) => {
    if (sets.length > 1) {
      setSets((prev) => {
        const filtered = prev.filter((set) => set.id !== setId);
        // ID를 1부터 다시 정렬
        return filtered.map((set, index) => ({
          ...set,
          id: index + 1,
        }));
      });
    }
  };

  const handleExerciseSelect = (exercise) => {
    setSelectedExercise(exercise);
    setCurrentMode("detail");
    // 새로운 운동 선택 시 세트를 3개로 초기화
    setSets([
      { id: 1, weight: 20, reps: 15, completed: false },
      { id: 2, weight: 20, reps: 12, completed: false },
      { id: 3, weight: 20, reps: 12, completed: false },
    ]);
  };

  const handleBackToAdd = () => {
    setCurrentMode("add");
    setSelectedExercise(null);
  };

  if (!isOpen) return null;

  return (
    <div className="modal-overlay">
      <div className="phone-wrapper">
        <div className="modal-content">
          {currentMode === "add" ? (
            // 종목 추가 모달
            <div className="add-exercise-modal">
              <div className="modal-header">
                <h2>종목 추가</h2>
                <button className="close-btn" onClick={onClose}>
                  <IoClose />
                </button>
              </div>

              <div className="search-container">
                <div className="search-bar">
                  <IoSearch className="search-icon" />
                  <input
                    type="text"
                    placeholder="종목 이름을 검색하세요."
                    value={searchTerm}
                    onChange={(e) => setSearchTerm(e.target.value)}
                  />
                </div>
              </div>

              <div className="filter-buttons">
                {categories.map((category) => (
                  <button
                    key={category}
                    className={`filter-btn ${
                      selectedCategory === category ? "active" : ""
                    }`}
                    onClick={() => setSelectedCategory(category)}
                  >
                    {category}
                  </button>
                ))}
              </div>

              <div className="exercise-list">
                {filteredExercises.map((exercise, index) => (
                  <div
                    key={index}
                    className="exercise-item"
                    onClick={() => handleExerciseSelect(exercise)}
                  >
                    <div className="exercise-icon">🏋️</div>
                    <div className="exercise-info">
                      <div className="exercise-name">{exercise.name}</div>
                      <div className="exercise-last-used">
                        {exercise.lastUsed}
                      </div>
                    </div>
                  </div>
                ))}
              </div>
            </div>
          ) : (
            // 운동 상세 모달
            <div className="exercise-detail-modal">
              <div className="modal-header">
                <h2>
                  {selectedExercise?.name || exerciseData?.name || "운동"}
                </h2>
                <button className="close-btn" onClick={onClose}>
                  <IoClose />
                </button>
              </div>

              <div className="sets-container">
                <div className="sets-header">
                  <button
                    className="remove-set-btn"
                    onClick={() => handleRemoveSet(sets[sets.length - 1]?.id)}
                  >
                    -
                  </button>
                  <span>세트</span>
                  <button className="add-set-btn" onClick={handleAddSet}>
                    +
                  </button>
                  <span>추천 세트</span>
                  <span></span>
                </div>

                {sets.map((set) => (
                  <div key={set.id} className="set-row">
                    <div className="set-number">{set.id}</div>
                    <div className="weight-input">
                      <input
                        type="number"
                        value={set.weight}
                        onChange={(e) =>
                          handleSetChange(
                            set.id,
                            "weight",
                            parseInt(e.target.value)
                          )
                        }
                      />
                      <span>kg</span>
                    </div>
                    <div className="reps-display">{set.reps}회</div>
                    <button
                      className={`complete-btn ${
                        set.completed ? "completed" : ""
                      }`}
                      onClick={() => handleSetComplete(set.id)}
                    >
                      <IoCheckmark />
                    </button>
                  </div>
                ))}
              </div>

              <button
                className="save-exercise-btn"
                onClick={() =>
                  onSave &&
                  onSave(sets, selectedExercise?.name || exerciseData?.name)
                }
              >
                운동 저장
              </button>
            </div>
          )}
        </div>
      </div>
    </div>
  );
}
