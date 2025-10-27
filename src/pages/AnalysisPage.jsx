import React, { useState } from "react";
import { useNavigate } from "react-router-dom";
import "./AnalysisPage.css";
import Header from "../components/Header";
import InBodyPhotoModal from "../components/InBodyPhotoModal";
import InBodyManualModal from "../components/InBodyManualModal";
import {
  IoCameraOutline,
  IoPencilOutline,
  IoBarChartOutline,
} from "react-icons/io5";
import { FaDumbbell, FaArrowUp, FaArrowDown, FaMinus } from "react-icons/fa";

export default function AnalysisPage() {
  const navigate = useNavigate();
  const [isPhotoModalOpen, setIsPhotoModalOpen] = useState(false);
  const [isManualModalOpen, setIsManualModalOpen] = useState(false);

  const handleInBodyClick = () => {
    navigate("/inbody");
  };

  const handlePhotoClick = () => {
    setIsPhotoModalOpen(true);
  };

  const handleManualClick = () => {
    console.log("수기 입력 버튼 클릭됨");
    setIsManualModalOpen(true);
  };

  const handlePhotoSave = (data) => {
    console.log("인바디 사진 저장:", data);
    // 여기서 실제로 데이터를 저장하거나 처리합니다
  };

  const handleManualSave = (data) => {
    console.log("인바디 수기 입력 저장:", data);
    // 여기서 실제로 데이터를 저장하거나 처리합니다
  };

  const handlePhotoModalClose = () => {
    setIsPhotoModalOpen(false);
  };

  const handleManualModalClose = () => {
    setIsManualModalOpen(false);
  };

  return (
    <div className="analysis-page">
      <Header title="분석하기" />
      <div className="analysis-content">
        {/* 인사말 섹션 */}
        <div className="greeting-section">
          <div className="greeting-name">유정님,</div>
          <div className="greeting-message">
            지난주보다 체지방률이 1.2% 감소했어요! <br />
            계속 이렇게만 가요 ✨
          </div>
        </div>

        {/* 인바디 기록/분석 섹션 */}
        <div className="inbody-section">
          <div className="section-header">
            <h2>인바디 기록/분석</h2>
            <p>최근 측정일 2025.10.05</p>
          </div>
          <div className="input-buttons">
            <button className="input-btn photo-btn" onClick={handlePhotoClick}>
              <IoCameraOutline />
              <span>사진으로 입력</span>
            </button>
            <button
              className="input-btn manual-btn"
              onClick={handleManualClick}
            >
              <IoPencilOutline />
              <span>수기로 입력</span>
            </button>
          </div>
          <button className="analysis-btn" onClick={handleInBodyClick}>
            <IoBarChartOutline />
            <span>정보/분석</span>
          </button>
        </div>

        {/* 운동 분석 섹션 */}
        <div className="exercise-section">
          <h2>운동 분석</h2>
          <p className="exercise-summary">
            "<span className="highlight-text">등, 어깨, 하체</span> 근력이
            강해졌어요. 최근 운동 종목의 1RM을 알아보세요."
          </p>
          <div className="exercise-list">
            <div className="exercise-item">
              <div className="exercise-icon">
                <FaDumbbell />
              </div>
              <div className="exercise-info">
                <span className="exercise-name">스쿼트</span>
                <span className="exercise-change positive">
                  <FaArrowUp /> 5kg
                </span>
              </div>
              <div className="exercise-1rm">1RM 50kg</div>
            </div>
            <div className="exercise-item">
              <div className="exercise-icon">
                <FaDumbbell />
              </div>
              <div className="exercise-info">
                <span className="exercise-name">데드리프트</span>
                <span className="exercise-change neutral">
                  <FaMinus /> -kg
                </span>
              </div>
              <div className="exercise-1rm">1RM 75kg</div>
            </div>
            <div className="exercise-item">
              <div className="exercise-icon">
                <FaDumbbell />
              </div>
              <div className="exercise-info">
                <span className="exercise-name">벤치 프레스</span>
                <span className="exercise-change negative">
                  <FaArrowDown /> 3kg
                </span>
              </div>
              <div className="exercise-1rm">1RM 60kg</div>
            </div>
            <div className="exercise-item">
              <div className="exercise-icon">
                <FaDumbbell />
              </div>
              <div className="exercise-info">
                <span className="exercise-name">벤치 프레스</span>
                <span className="exercise-change negative">
                  <FaArrowDown /> 3kg
                </span>
              </div>
              <div className="exercise-1rm">1RM 60kg</div>
            </div>
            <div className="exercise-item">
              <div className="exercise-icon">
                <FaDumbbell />
              </div>
              <div className="exercise-info">
                <span className="exercise-name">스쿼트</span>
                <span className="exercise-change positive">
                  <FaArrowUp /> 10kg
                </span>
              </div>
              <div className="exercise-1rm">1RM 50kg</div>
            </div>
          </div>
        </div>

        {/* 식단 분석 섹션 */}
        <div className="diet-section">
          <h2>식단 분석</h2>
          <p className="diet-summary">
            "단백질을 더 섭취하세요(약 100g 부족) <br />
            저번주보다 지방을 약 1.5배 섭취중이에요 😥"
          </p>

          <div className="calorie-section">
            <div className="calorie-chart">
              <div className="donut-chart">
                <div className="chart-center">
                  <div className="chart-value">1850</div>
                  <div className="chart-goal">목표 2000kcal</div>
                </div>
              </div>
              <div className="nutrient-legend">
                <div className="legend-item">
                  <div className="legend-box protein">50%</div>
                  <div className="legend-letter">P</div>
                </div>
                <div className="legend-item">
                  <div className="legend-box carbs">40%</div>
                  <div className="legend-letter">C</div>
                </div>
                <div className="legend-item">
                  <div className="legend-box fat">10%</div>
                  <div className="legend-letter">F</div>
                </div>
              </div>
            </div>
          </div>

          <div className="nutrient-analysis">
            <h3>세부 영양소 분석</h3>
            <div className="nutrient-item">
              <span className="nutrient-name">탄수화물</span>
              <div className="nutrient-bar">
                <div
                  className="nutrient-progress carbs"
                  style={{ width: "79%" }}
                ></div>
              </div>
              <span className="nutrient-value">95g / 120g</span>
            </div>
            <div className="nutrient-item">
              <span className="nutrient-name">단백질</span>
              <div className="nutrient-bar">
                <div
                  className="nutrient-progress protein"
                  style={{ width: "79%" }}
                ></div>
              </div>
              <span className="nutrient-value">95g / 120g</span>
            </div>
            <div className="nutrient-item">
              <span className="nutrient-name">지방</span>
              <div className="nutrient-bar">
                <div
                  className="nutrient-progress fat"
                  style={{ width: "79%" }}
                ></div>
              </div>
              <span className="nutrient-value">95g / 120g</span>
            </div>
            <div className="nutrient-item">
              <span className="nutrient-name">나트륨</span>
              <div className="nutrient-bar">
                <div
                  className="nutrient-progress sodium"
                  style={{ width: "79%" }}
                ></div>
              </div>
              <span className="nutrient-value">95g / 120g</span>
            </div>
          </div>
        </div>
      </div>

      {/* 인바디 사진 입력 모달 */}
      <InBodyPhotoModal
        isOpen={isPhotoModalOpen}
        onClose={handlePhotoModalClose}
        onSave={handlePhotoSave}
      />

      {/* 인바디 수기 입력 모달 */}
      <InBodyManualModal
        isOpen={isManualModalOpen}
        onClose={handleManualModalClose}
        onSave={handleManualSave}
      />
    </div>
  );
}
