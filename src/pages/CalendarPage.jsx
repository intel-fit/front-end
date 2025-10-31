import React, { useState } from "react";
import { useNavigate } from "react-router-dom";
import Header from "../components/Header";
import styles from "./CalendarPage.module.css";
import { IoChevronBack, IoChevronForward, IoMenu } from "react-icons/io5";

export default function CalendarPage() {
  const navigate = useNavigate();
  const [currentMonth, setCurrentMonth] = useState("10월");

  // 4주간 운동 데이터 (7일 × 4주)
  const weekData = Array(4).fill(null).map(() =>
    Array(7).fill(null).map(() => ({
      count: 15,
      calories: "388k",
      percentage: "97%"
    }))
  );

  // 식단 데이터
  const meals = [
    {
      time: "아침 식사",
      title: "오늘 첫 끼^^",
      timestamp: "8:38 am",
      calories: 52,
      foods: [
        { name: "요거트", completed: true },
        { name: "바나나", completed: true }
      ]
    },
    {
      time: "점심",
      title: "",
      timestamp: "추천 식단",
      calories: 70,
      foods: [
        { name: "그릭 요거트", completed: false },
        { name: "에너지바", completed: false }
      ]
    },
    {
      time: "야식",
      title: "",
      timestamp: "추천 식단",
      calories: 239,
      foods: [
        { name: "닭가슴살 300g", completed: false },
        { name: "단백질 쉐이크", completed: false },
        { name: "구운 계란 2개", completed: false }
      ]
    }
  ];

  // 운동 데이터
  const exercises = [
    {
      name: "펙 덱 플라이",
      time: "9:00 AM",
      details: "20kg 15회 3세트"
    },
    {
      name: "리버스 펙 덱 플라이",
      time: "9:04 AM",
      details: "20kg 15회 3세트"
    }
  ];

  return (
    <div className={styles['calendar-page']}>
      <Header title="기록 달력" />
      <div className={styles.divider}></div>
      
      <div className={styles['calendar-content']}>
        {/* 월 네비게이션 */}
        <div className={styles['month-navigation']}>
          <div className={styles['month-nav-left']}>
            <button className={styles['nav-btn']} onClick={() => {}}>
              <IoChevronBack size={18} />
            </button>
            <span className={styles['month-text']}>{currentMonth}</span>
            <button className={styles['nav-btn']} onClick={() => {}}>
              <IoChevronForward size={18} />
            </button>
          </div>
          <button className={styles['menu-btn']} onClick={() => {}}>
            <IoMenu size={20} />
          </button>
        </div>

        {/* 달력 그리드 컨테이너 */}
        <div className={styles['calendar-container']}>
          {/* 요일 헤더 */}
          <div className={styles['weekday-header']}>
            {['일', '일', '일', '일', '일', '일', '일'].map((day, index) => (
              <div key={index} className={styles['weekday']}>
                {day}
              </div>
            ))}
          </div>

          {/* 4주간 데이터 */}
          {weekData.map((week, weekIndex) => (
            <div key={weekIndex} className={styles['week-row']}>
              {week.map((day, dayIndex) => (
                <div key={dayIndex} className={styles['day-item']}>
                  <div className={styles['day-count']}>{day.count}</div>
                  <div className={styles['day-calories']}>{day.calories}</div>
                  <div className={styles['day-percentage']}>{day.percentage}</div>
                </div>
              ))}
            </div>
          ))}
        </div>

        {/* 운동 섹션 (칼로리 진행률) */}
        <div className={styles['exercise-section']}>
          <div className={styles['calorie-header']}>
            <div className={styles['calorie-left']}>
              <span className={styles['calorie-current']}>384</span>
              <span className={styles['calorie-goal']}>/ 1,157kcal</span>
            </div>
            <span className={styles['calorie-percentage']}>30%</span>
          </div>
          <div className={styles['calorie-progress-bar']}>
            <div 
              className={styles['calorie-progress-fill']} 
              style={{ width: '30%' }}
            ></div>
          </div>
        </div>

        {/* 식단 내역 */}
        <h3 className={styles['section-title']}>식단 내역</h3>
        <div className={styles['meals-section']}>
          {meals.map((meal, index) => (
            <div key={index} className={styles['meal-card']}>
              <div className={styles['meal-header']}>
                <div className={styles['meal-info']}>
                  {meal.title && (
                    <h4 className={styles['meal-title']}>{meal.title}</h4>
                  )}
                  {!meal.title && (
                    <h4 className={styles['meal-title']}>{meal.time}</h4>
                  )}
                  <span className={styles['meal-time']}>{meal.timestamp}</span>
                </div>
                <div className={styles['meal-calories']}>
                  {meal.calories}
                  <br />
                  kcal
                </div>
              </div>
              <div className={styles['food-tags']}>
                {meal.foods.map((food, foodIndex) => (
                  <div
                    key={foodIndex}
                    className={`${styles['food-tag']} ${
                      food.completed ? styles['completed'] : styles['recommended']
                    }`}
                  >
                    {food.name}
                  </div>
                ))}
              </div>
            </div>
          ))}
        </div>

        {/* 운동 내역 */}
        <h3 className={styles['section-title']}>운동 내역</h3>
        <div className={styles['exercise-list']}>
          {exercises.map((exercise, index) => (
            <div key={index} className={styles['exercise-card']}>
              <div className={styles['exercise-info']}>
                <h4 className={styles['exercise-name']}>{exercise.name}</h4>
                <p className={styles['exercise-details']}>{exercise.details}</p>
              </div>
              <span className={styles['exercise-time']}>{exercise.time}</span>
            </div>
          ))}
        </div>
      </div>
    </div>
  );
}

