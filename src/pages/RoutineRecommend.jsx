import React, { useState, useEffect } from "react";
import styles from "./RoutineRecommend.module.css";
import RoutineRecommendModal from "../components/RoutineRecommendModal";

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
  const [showModal, setShowModal] = useState(false);

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

    setSavedRoutines(updatedRoutines);

    alert("루틴이 저장되었습니다!");
  };

  const handleRecommendAgain = () => {
    setShowRoutine(false);
    setSelectedDay(0);
  };

  return (
    <div className={styles["routine-recommend-container"]}>
      {!showRoutine ? (
        <>
          <div className={styles["main-content"]}>
            <h1 className={styles["title"]}>
              안녕하세요 - 회원님!
              <br />
              최적화된 루틴을 추천해 드릴께요!
            </h1>

            <div className={styles["button-group"]}>
              <button
                className={styles["action-button"]}
                onClick={handleGetRoutine}
              >
                추천 루틴 받기
              </button>

              <div>
                <button
                  className={styles["action-button"]}
                  onClick={() => setShowWeakPanel(true)}
                >
                  취약한 부분
                </button>
                {weakParts.length > 0 && (
                  <p className={styles["selected-info"]}>
                    {weakParts.join(", ")}
                  </p>
                )}
              </div>

              <div>
                <button
                  className={styles["action-button"]}
                  onClick={() => setShowLevelPanel(true)}
                >
                  운동 경력
                </button>
                {level && <p className={styles["selected-info"]}>{level}</p>}
              </div>

              <div>
                <button
                  className={styles["action-button"]}
                  onClick={() => setShowTargetPanel(true)}
                >
                  보강하고 싶은 부위
                </button>
                {targetParts.length > 0 && (
                  <p className={styles["selected-info"]}>
                    {targetParts.join(", ")}
                  </p>
                )}
              </div>
            </div>
          </div>

          {savedRoutines.length > 0 && (
            <div className={styles["saved-routines"]}>
              <h2>저장된 루틴</h2>
              {savedRoutines.map((routine) => (
                <div
                  key={routine.id}
                  className={styles["saved-routine-item"]}
                  onClick={() => setShowModal(true)}
                  style={{ cursor: "pointer" }}
                >
                  <div className={styles["saved-routine-header"]}>
                    <span>{routine.date}</span>
                    <span className={styles["badge"]}>{routine.level}</span>
                  </div>
                  <div className={styles["saved-routine-info"]}>
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
        <div className={styles["routine-view"]}>
          <h2 className={styles["routine-title"]}>10월 2주차 루틴</h2>
          <p className={styles["routine-date"]}>10/10 - 10/17</p>

          <div className={styles["day-tabs"]}>
            {weekDays.map((day, index) => (
              <button
                key={index}
                className={`${styles["day-tab"]} ${
                  selectedDay === index ? styles["active"] : ""
                }`}
                onClick={() => setSelectedDay(index)}
              >
                {day}
              </button>
            ))}
          </div>

          <div className={styles["routine-info"]}>
            <span>총 3세트</span>
            <span>⏱ 20분</span>
          </div>

          <div className={styles["exercise-list"]}>
            {sampleRoutines[selectedDay].map((exercise, index) => (
              <div key={index} className={styles["exercise-card"]}>
                <div className={styles["exercise-icon"]}>{exercise.icon}</div>
                <div className={styles["exercise-info"]}>
                  <h3>{exercise.name}</h3>
                  <p>{exercise.detail}</p>
                </div>
              </div>
            ))}
          </div>

          <div className={styles["routine-buttons"]}>
            <button
              className={styles["save-routine-button"]}
              onClick={handleSaveRoutine}
            >
              루틴 저장하기
            </button>
            <button
              className={styles["re-recommend-button"]}
              onClick={handleRecommendAgain}
            >
              루틴 다시 추천받기
            </button>
          </div>
        </div>
      )}

      {/* 모달 */}
      <RoutineRecommendModal
        isOpen={showModal}
        onClose={() => setShowModal(false)}
      />

      {showWeakPanel && (
        <>
          <div
            className={styles["panel-overlay"]}
            onClick={() => setShowWeakPanel(false)}
          ></div>
          <div className={styles["bottom-panel"]}>
            <div className={styles["panel-handle"]}></div>
            <div className={styles["panel-header"]}>
              <h3>취약한 부분 선택</h3>
            </div>
            <div className={styles["panel-body"]}>
              <p className={styles["panel-description"]}>
                과거 다치거나 불편한 몸 부위를 선택해주세요
              </p>
              <div className={styles["option-grid"]}>
                {bodyParts.map((part) => (
                  <button
                    key={part}
                    className={`${styles["option-button"]} ${
                      weakParts.includes(part) ? styles.selected : ""
                    }`}
                    onClick={() => handleWeakPartToggle(part)}
                  >
                    {part}
                  </button>
                ))}
              </div>
              <button
                className={styles["confirm-button"]}
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
            className={styles["panel-overlay"]}
            onClick={() => setShowLevelPanel(false)}
          ></div>
          <div className={styles["bottom-panel"]}>
            <div className={styles["panel-handle"]}></div>
            <div className={styles["panel-header"]}>
              <h3>운동 경력 선택</h3>
            </div>
            <div className={styles["panel-body"]}>
              <p className={styles["panel-description"]}>
                현재 운동 수준을 선택해주세요
              </p>
              <div className={styles["option-grid"]}>
                {levels.map((lv) => (
                  <button
                    key={lv}
                    className={`${styles["option-button"]} ${
                      level === lv ? styles.selected : ""
                    }`}
                    onClick={() => setLevel(lv)}
                  >
                    {lv}
                  </button>
                ))}
              </div>
              <button
                className={styles["confirm-button"]}
                onClick={() => setShowLevelPanel(false)}
              >
                선택 완료
              </button>
            </div>
          </div>
        </>
      )}

      {showTargetPanel && (
        <>
          <div
            className={styles["panel-overlay"]}
            onClick={() => setShowTargetPanel(false)}
          ></div>
          <div className={styles["bottom-panel"]}>
            <div className={styles["panel-handle"]}></div>
            <div className={styles["panel-header"]}>
              <h3>보강하고 싶은 부위</h3>
            </div>
            <div className={styles["panel-body"]}>
              <p className={styles["panel-description"]}>
                집중적으로 운동하고 싶은 부위를 선택해주세요
              </p>
              <div className={styles["option-grid"]}>
                {targetAreas.map((area) => (
                  <button
                    key={area}
                    className={`${styles["option-button"]} ${
                      targetParts.includes(area) ? styles.selected : ""
                    }`}
                    onClick={() => handleTargetPartToggle(area)}
                  >
                    {area}
                  </button>
                ))}
              </div>
              <button
                className={styles["confirm-button"]}
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
