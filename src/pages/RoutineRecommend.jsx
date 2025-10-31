import React, { useState, useEffect } from "react";
import "./RoutineRecommend.css";

const RoutineRecommend = () => {
  const [showWeakPanel, setShowWeakPanel] = useState(false);
  const [showLevelPanel, setShowLevelPanel] = useState(false);
  const [showTargetPanel, setShowTargetPanel] = useState(false);
  const [showRoutine, setShowRoutine] = useState(false);
  const [selectedDay, setSelectedDay] = useState(0);
  const [weakParts, setWeakParts] = useState([]);
  const [level, setLevel] = useState("");
  const [targetParts, setTargetParts] = useState([]);
  const [savedRoutines, setSavedRoutines] = useState([]);

  // Prevent body scroll when panel is open
  useEffect(() => {
    if (showWeakPanel || showLevelPanel || showTargetPanel) {
      document.body.style.overflow = "hidden";
    } else {
      document.body.style.overflow = "auto";
    }
    return () => {
      document.body.style.overflow = "auto";
    };
  }, [showWeakPanel, showLevelPanel, showTargetPanel]);

  useEffect(() => {
    const storedRoutines = JSON.parse(
      localStorage.getItem("savedRoutines") || "[]"
    );
    setSavedRoutines(storedRoutines);
  }, []);

  const weekDays = [
    "1일차",
    "2일차",
    "3일차",
    "4일차",
    "5일차",
    "6일차",
    "7일차",
  ];

  const bodyParts = ["목", "어깨", "팔꿈치", "손목", "허리", "무릎", "발목"];
  const targetAreas = ["가슴", "등", "배", "어깨", "팔", "하체"];
  const levels = ["초급", "중급", "고급"];

  const sampleRoutines = [
    [
      { name: "시작 스트레칭", detail: "6회차 스트레칭", icon: "🏃" },
      { name: "레그 프레스", detail: "4세트 X 20kg X 15회", icon: "🦵" },
      { name: "레그 컬", detail: "3세트 X 12kg X 15회", icon: "🦵" },
    ],
    [
      { name: "시작 스트레칭", detail: "6회차 스트레칭", icon: "🏃" },
      { name: "벤치 프레스", detail: "4세트 X 40kg X 12회", icon: "💪" },
      { name: "덤벨 플라이", detail: "3세트 X 15kg X 12회", icon: "💪" },
    ],
    [
      { name: "시작 스트레칭", detail: "6회차 스트레칭", icon: "🏃" },
      { name: "데드리프트", detail: "4세트 X 60kg X 10회", icon: "🏋️" },
      { name: "랫 풀다운", detail: "3세트 X 45kg X 12회", icon: "🏋️" },
    ],
    [
      { name: "시작 스트레칭", detail: "6회차 스트레칭", icon: "🏃" },
      { name: "숄더 프레스", detail: "4세트 X 20kg X 12회", icon: "💪" },
      {
        name: "사이드 레터럴 레이즈",
        detail: "3세트 X 10kg X 15회",
        icon: "💪",
      },
    ],
    [
      { name: "시작 스트레칭", detail: "6회차 스트레칭", icon: "🏃" },
      { name: "스쿼트", detail: "4세트 X 50kg X 12회", icon: "🦵" },
      { name: "레그 익스텐션", detail: "3세트 X 30kg X 15회", icon: "🦵" },
    ],
    [
      { name: "시작 스트레칭", detail: "6회차 스트레칭", icon: "🏃" },
      { name: "바벨 컬", detail: "4세트 X 20kg X 12회", icon: "💪" },
      {
        name: "트라이셉스 익스텐션",
        detail: "3세트 X 15kg X 12회",
        icon: "💪",
      },
    ],
    [
      { name: "시작 스트레칭", detail: "6회차 스트레칭", icon: "🏃" },
      { name: "크런치", detail: "4세트 X 20회", icon: "🔥" },
      { name: "플랭크", detail: "3세트 X 60초", icon: "🔥" },
    ],
  ];

  const handleWeakPartToggle = (part) => {
    if (weakParts.includes(part)) {
      setWeakParts(weakParts.filter((p) => p !== part));
    } else {
      setWeakParts([...weakParts, part]);
    }
  };

  const handleTargetPartToggle = (part) => {
    if (targetParts.includes(part)) {
      setTargetParts(targetParts.filter((p) => p !== part));
    } else {
      setTargetParts([...targetParts, part]);
    }
  };

  const handleGetRoutine = () => {
    setShowRoutine(true);
    setSelectedDay(0);
  };

  const handleSaveRoutine = () => {
    const currentDate = new Date();
    const savedRoutine = {
      id: Date.now(),
      date: currentDate.toLocaleDateString("ko-KR"),
      routine: sampleRoutines,
      level: level,
      weakParts: [...weakParts],
      targetParts: [...targetParts],
    };
    const existingRoutines = JSON.parse(
      localStorage.getItem("savedRoutines") || "[]"
    );

    const updatedRoutines = [...existingRoutines, savedRoutine];

    localStorage.setItem("savedRoutines", JSON.stringify(updatedRoutines));

    setSavedRoutines([...savedRoutines, savedRoutine]);

    alert("루틴이 저장되었습니다!");
  };

  const handleRecommendAgain = () => {
    setShowRoutine(false);
    setSelectedDay(0);
  };

  return (
    <div className="routine-recommend-container">
      {!showRoutine ? (
        <>
          <div className="main-content">
            <h1 className="title">
              안녕하세요 - 회원님!
              <br />
              최적화된 루틴을 추천해 드릴께요!
            </h1>

            <div className="button-group">
              <button className="action-button" onClick={handleGetRoutine}>
                추천 루틴 받기
              </button>
              <button
                className="action-button"
                onClick={() => setShowWeakPanel(true)}
              >
                취약한 부분
              </button>
              <button
                className="action-button"
                onClick={() => setShowLevelPanel(true)}
              >
                운동 경력
              </button>
              <button
                className="action-button"
                onClick={() => setShowTargetPanel(true)}
              >
                보강하고 싶은 부위
              </button>
            </div>
          </div>

          {savedRoutines.length > 0 && (
            <div className="saved-routines">
              <h2>저장된 루틴</h2>
              {savedRoutines.map((routine) => (
                <div key={routine.id} className="saved-routine-item">
                  <div className="saved-routine-header">
                    <span>{routine.date}</span>
                    <span className="badge">{routine.level}</span>
                  </div>
                  <div className="saved-routine-info">
                    {routine.targetParts.length > 0 && (
                      <span>집중: {routine.targetParts.join(", ")}</span>
                    )}
                  </div>
                </div>
              ))}
            </div>
          )}
        </>
      ) : (
        <div className="routine-view">
          <h2 className="routine-title">10월 2주차 루틴</h2>
          <p className="routine-date">10/10 - 10/17</p>

          <div className="day-tabs">
            {weekDays.map((day, index) => (
              <button
                key={index}
                className={`day-tab ${selectedDay === index ? "active" : ""}`}
                onClick={() => setSelectedDay(index)}
              >
                {day}
              </button>
            ))}
          </div>

          <div className="routine-info">
            <span>총 3세트</span>
            <span>⏱ 20분</span>
          </div>

          <div className="exercise-list">
            {sampleRoutines[selectedDay].map((exercise, index) => (
              <div key={index} className="exercise-card">
                <div className="exercise-icon">{exercise.icon}</div>
                <div className="exercise-info">
                  <h3>{exercise.name}</h3>
                  <p>{exercise.detail}</p>
                </div>
              </div>
            ))}
          </div>

          <div className="routine-buttons">
            <button className="save-routine-button" onClick={handleSaveRoutine}>
              루틴 저장하기
            </button>
            <button
              className="re-recommend-button"
              onClick={handleRecommendAgain}
            >
              루틴 다시 추천받기
            </button>
          </div>
        </div>
      )}

      {showWeakPanel && (
        <>
          <div
            className="panel-overlay"
            onClick={() => setShowWeakPanel(false)}
          ></div>
          <div className="bottom-panel">
            <div className="panel-handle"></div>
            <div className="panel-header">
              <h3>취약한 부분 선택</h3>
            </div>
            <div className="panel-body">
              <p className="panel-description">
                과거 다치거나 불편한 몸 부위를 선택해주세요
              </p>
              <div className="option-grid">
                {bodyParts.map((part) => (
                  <button
                    key={part}
                    className={`option-button ${
                      weakParts.includes(part) ? "selected" : ""
                    }`}
                    onClick={() => handleWeakPartToggle(part)}
                  >
                    {part}
                  </button>
                ))}
              </div>
              <button
                className="confirm-button"
                onClick={() => setShowWeakPanel(false)}
              >
                선택 완료
              </button>
            </div>
          </div>
        </>
      )}

      {showLevelPanel && (
        <>
          <div
            className="panel-overlay"
            onClick={() => setShowLevelPanel(false)}
          ></div>
          <div className="bottom-panel">
            <div className="panel-handle"></div>
            <div className="panel-header">
              <h3>운동 경력 선택</h3>
            </div>
            <div className="panel-body">
              <p className="panel-description">현재 운동 수준을 선택해주세요</p>
              <div className="option-grid">
                {levels.map((lv) => (
                  <button
                    key={lv}
                    className={`option-button ${
                      level === lv ? "selected" : ""
                    }`}
                    onClick={() => setLevel(lv)}
                  >
                    {lv}
                  </button>
                ))}
              </div>
              <button
                className="confirm-button"
                onClick={() => setShowLevelPanel(false)}
              >
                선택 완료
              </button>
            </div>
          </div>
        </>
      )}

      {/* 보강하고 싶은 부위 패널 */}
      {showTargetPanel && (
        <>
          <div
            className="panel-overlay"
            onClick={() => setShowTargetPanel(false)}
          ></div>
          <div className="bottom-panel">
            <div className="panel-handle"></div>
            <div className="panel-header">
              <h3>보강하고 싶은 부위</h3>
            </div>
            <div className="panel-body">
              <p className="panel-description">
                집중적으로 운동하고 싶은 부위를 선택해주세요
              </p>
              <div className="option-grid">
                {targetAreas.map((area) => (
                  <button
                    key={area}
                    className={`option-button ${
                      targetParts.includes(area) ? "selected" : ""
                    }`}
                    onClick={() => handleTargetPartToggle(area)}
                  >
                    {area}
                  </button>
                ))}
              </div>
              <button
                className="confirm-button"
                onClick={() => setShowTargetPanel(false)}
              >
                선택 완료
              </button>
            </div>
          </div>
        </>
      )}
    </div>
  );
};

export default RoutineRecommend;
