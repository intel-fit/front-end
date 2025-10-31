import React, { useEffect, useMemo, useState } from "react";
import { useNavigate } from "react-router-dom";
import styles from "./AddMealPage.module.css";

const AddMealPage = () => {
  const navigate = useNavigate();
  const [activeTab, setActiveTab] = useState("meal");
  const [workoutGoals, setWorkoutGoals] = useState(() => {
    try {
      const saved = localStorage.getItem("workoutGoals");
      return saved
        ? JSON.parse(saved)
        : {
            frequency: 3,
            duration: "30분 이상",
            type: "유산소",
            calories: 1500,
          };
    } catch (_) {
      return {
        frequency: 3,
        duration: "30분 이상",
        type: "유산소",
        calories: 1500,
      };
    }
  });
  const [completedThisWeek, setCompletedThisWeek] = useState(() => {
    const raw = localStorage.getItem("workoutCompletedThisWeek");
    const n = raw ? parseInt(raw, 10) : 0;
    return Number.isFinite(n) ? n : 0;
  });

  // 식단 데이터
  const [mealData, setMealData] = useState({
    dailyCalories: 384,
    targetCalories: 1157,
    carbs: { current: 51, target: 198 },
    protein: { current: 15, target: 132 },
    fat: { current: 15, target: 49 },
    meals: [
      {
        id: 1,
        name: "오늘 첫 끼^^",
        time: "8:38 am",
        calories: 52,
        foods: ["요거트", "바나나"],
      },
      {
        id: 2,
        name: "점심",
        subtitle: "추천 식단",
        calories: 70,
        foods: ["그릭 요거트", "에너지바"],
        isRecommended: true,
      },
      {
        id: 3,
        name: "야식",
        subtitle: "추천 식단",
        calories: 239,
        foods: ["닭가슴살 300g", "단백질 쉐이크", "구운 계란 2개"],
        isRecommended: true,
      },
    ],
  });

  useEffect(() => {
    try {
      const saved = localStorage.getItem("workoutGoals");
      if (saved) setWorkoutGoals(JSON.parse(saved));
      const raw = localStorage.getItem("workoutCompletedThisWeek");
      const n = raw ? parseInt(raw, 10) : 0;
      setCompletedThisWeek(Number.isFinite(n) ? n : 0);
    } catch (_) {}
  }, []);

  const goalSubtitle = useMemo(() => {
    const freq = workoutGoals?.frequency ?? 3;
    const dur = workoutGoals?.duration ?? "30분 이상";
    return `주 ${freq}회 하루 ${dur}`;
  }, [workoutGoals]);

  const goalProgressPercent = useMemo(() => {
    const target = Math.max(1, workoutGoals?.frequency ?? 1);
    const done = Math.max(0, completedThisWeek);
    return Math.max(0, Math.min(100, Math.round((done / target) * 100)));
  }, [workoutGoals, completedThisWeek]);

  // 칼로리 요약 카드
  const CalorieCard = () => {
    const percentage = Math.round(
      (mealData.dailyCalories / mealData.targetCalories) * 100
    );
    return (
      <div className={styles["calorie-card"]}>
        <div className={styles["calorie-header"]}>
          <div className={styles["calorie-title"]}>
            {mealData.dailyCalories}{" "}
            <span className={styles["calorie-subtitle"]}>
              / {mealData.targetCalories}kcal
            </span>
          </div>
          <div className={styles["calorie-percentage"]}>{percentage}%</div>
        </div>
        <div className={styles["calorie-progress-bar"]}>
          <div
            className={styles["calorie-progress-fill"]}
            style={{ width: `${percentage}%` }}
          />
        </div>
        <div className={styles["nutrition-summary"]}>
          <div className={styles["nutrition-item"]}>
            <div className={styles["nutrition-label"]}>탄수화물</div>
            <div className={styles["nutrition-value"]}>
              {mealData.carbs.current} / {mealData.carbs.target}g
            </div>
          </div>
          <div className={styles["nutrition-item"]}>
            <div className={styles["nutrition-label"]}>단백질</div>
            <div className={styles["nutrition-value"]}>
              {mealData.protein.current} / {mealData.protein.target}g
            </div>
          </div>
          <div className={styles["nutrition-item"]}>
            <div className={styles["nutrition-label"]}>지방</div>
            <div className={styles["nutrition-value"]}>
              {mealData.fat.current} / {mealData.fat.target}g
            </div>
          </div>
        </div>
      </div>
    );
  };

  const GoalCard = () => (
    <div className={styles['goal-card']}>
      <div className={styles['goal-card-header']}>
        <div className={styles['goal-title']}>운동 목표 설정</div>
        <button
          className={styles['goal-arrow']}
          aria-label="open-goal"
          onClick={() => navigate("/goal")}
        >
          <svg width="22" height="22" viewBox="0 0 24 24" fill="none">
            <path
              d="M9 18l6-6-6-6"
              stroke="#ccc"
              strokeWidth="2"
              strokeLinecap="round"
              strokeLinejoin="round"
            />
          </svg>
        </button>
      </div>
      <div className={styles['goal-sub']}>{goalSubtitle}</div>
      <div className={styles['goal-progress']}>
        <div
          className={styles['goal-progress-fill']}
          style={{ width: `${goalProgressPercent}%` }}
        />
      </div>
    </div>
  );

  // 식사 카드 컴포넌트
  const MealCard = ({ meal }) => (
    <div
      className={`${styles["meal-card"]} ${
        meal.isRecommended ? styles["meal-card-recommended"] : ""
      }`}
      onClick={() => navigate("/meal-detail", { state: { meal } })}
    >
      <div className={styles["meal-card-header"]}>
        <div className={styles["meal-card-title-group"]}>
          <div className={styles["meal-card-title"]}>{meal.name}</div>
          {meal.subtitle && (
            <div className={styles["meal-card-subtitle"]}>{meal.subtitle}</div>
          )}
          {meal.time && (
            <div className={styles["meal-card-time"]}>{meal.time}</div>
          )}
        </div>
        <div className={styles["meal-card-calories"]}>
          {meal.calories}
          <br />
          kcal
        </div>
      </div>
      <div className={styles["meal-foods"]}>
        {meal.foods.map((food, idx) => (
          <span
            key={idx}
            className={`${styles["food-tag"]} ${
              meal.isRecommended ? styles["food-tag-recommended"] : ""
            }`}
          >
            {food}
          </span>
        ))}
      </div>
    </div>
  );

  const ExerciseTimeline = () => (
    <div className={styles['exercise-timeline']}>
      <div className={styles['timeline-line']} />

      <div className={`${styles['timeline-item']} ${styles['completed']}`}>
        <div className={styles['dot']} />
        <div className={`${styles['exercise-card']} ${styles['muted']}`}>
          <div className={styles['exercise-left']}>
            <div className={styles['exercise-name']}>펙 덱 플라이</div>
            <div className={styles['exercise-meta']}>20kg 15회 3세트</div>
          </div>
          <div className={styles['exercise-time']}>9:00 AM</div>
        </div>
      </div>

      <div className={styles['timeline-item']}>
        <div className={styles['dot']} />
        <div className={styles['exercise-card']}>
          <div className={styles['exercise-left']}>
            <div className={styles['exercise-name']}>리버스 펙 덱 플라이</div>
            <div className={styles['exercise-meta']}>20kg 15회 3세트</div>
          </div>
          <div className={styles['exercise-time']}>9:04 AM</div>
        </div>
      </div>

      <div className={`${styles['timeline-item']} ${styles['last']}`}>
        <div className={styles['dot']} />
        <button
          className={styles['exercise-add-card']}
          onClick={() => navigate("/exercise-detail")}
        >
          운동 추가하기
        </button>
      </div>
    </div>
  );

  return (
    <div className={styles["add-meal-page"]}>
      <div className={styles["record-header"]}>
        <h1 className={styles["record-title"]}>기록하기</h1>
        <button className={styles["bell-btn"]} aria-label="알림">
          🔔
        </button>
      </div>

      <div className={styles["record-tabs"]}>
        <button
          className={`${styles["record-tab"]} ${
            activeTab === "exercise" ? styles["active"] : ""
          }`}
          onClick={() => setActiveTab("exercise")}
        >
          운동기록
        </button>
        <button
          className={`${styles["record-tab"]} ${
            activeTab === "meal" ? styles["active"] : ""
          }`}
          onClick={() => setActiveTab("meal")}
        >
          식단기록
        </button>
        <button
          className={`${styles["record-tab"]} ${
            activeTab === "history" ? styles["active"] : ""
          }`}
          onClick={() => setActiveTab("history")}
        >
          과거기록
        </button>
      </div>

      <div className={styles["mini-stats"]}>
        {Array.from({ length: 7 }).map((_, idx) => (
          <div key={idx} className={styles["mini-stat"]}>
            <div className={styles["ms-top"]}>15</div>
            <div className={styles["ms-mid"]}>388k</div>
            <div className={styles["ms-btm"]}>97%</div>
          </div>
        ))}
      </div>

      {activeTab === "exercise" && (
        <>
          <GoalCard />
          <h2 className={styles["section-title"]}>운동 기록하기</h2>
          <ExerciseTimeline />
        </>
      )}

      {activeTab === "meal" && (
        <>
          <CalorieCard />
          {mealData.meals.map((meal) => (
            <MealCard key={meal.id} meal={meal} />
          ))}
          <button
            className={styles["add-meal-button"]}
            onClick={() => navigate("/meal-add")}
          >
            식단 추가하기
          </button>
        </>
      )}

      {activeTab === "history" && (
        <div className={styles["history-placeholder"]}>
          <p>과거 기록 기능은 준비 중입니다.</p>
        </div>
      )}
    </div>
  );
};

export default AddMealPage;
