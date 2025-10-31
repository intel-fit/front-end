import React, { useState } from 'react';
import { IoChevronBack, IoChevronForward, IoMenu } from 'react-icons/io5';
import GoalCard from '../components/GoalCard';
import LogSection from '../components/LogSection';
import './ExerciseRecordPage.css';

const ExerciseRecordPage = ({ goalData }) => {
  const [currentMonth, setCurrentMonth] = useState("10월");

  return (
    <div className="exercise-record-page">
      {/* 월 네비게이션 */}
      <div className="month-navigation">
        <div className="month-nav-left">
          <button className="nav-btn" onClick={() => {}}>
            <IoChevronBack size={18} />
          </button>
          <span className="month-text">{currentMonth}</span>
          <button className="nav-btn" onClick={() => {}}>
            <IoChevronForward size={18} />
          </button>
        </div>
        <button className="menu-btn" onClick={() => {}}>
          <IoMenu size={20} />
        </button>
      </div>

      {/* 7일 캘린더 위젯 */}
      <div className="week-calendar">
        <div className="calendar-grid">
          {[1, 2, 3, 4, 5, 6, 7].map((day) => (
            <div key={day} className="calendar-item">
              <div className="calendar-number">15</div>
              <div className="calendar-calories">388k</div>
              <div className="calendar-percentage">97%</div>
            </div>
          ))}
        </div>
      </div>

      {/* 기존 컨텐츠 */}
      <GoalCard goalData={goalData} />
      <LogSection />
    </div>
  );
};

export default ExerciseRecordPage;

