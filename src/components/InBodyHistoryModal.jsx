import { useState } from "react";
import { IoClose, IoChevronBack } from "react-icons/io5";
import { FaCrown } from "react-icons/fa";
import "./InBodyHistoryModal.css";

export default function InBodyHistoryModal({ isOpen, onClose }) {
  const [showMuscleDetails, setShowMuscleDetails] = useState(false);
  const [selectedBodyPart, setSelectedBodyPart] = useState(null);

  if (!isOpen) return null;

  const muscleData = {
    before: {
      head: "3.2kg",
      leftArm: "2.8kg",
      rightArm: "2.9kg",
      torso: "8.5kg",
      leftLeg: "4.1kg",
      rightLeg: "4.0kg",
    },
    after: {
      head: "3.4kg",
      leftArm: "3.1kg",
      rightArm: "3.2kg",
      torso: "9.2kg",
      leftLeg: "4.3kg",
      rightLeg: "4.2kg",
    },
  };

  const handleBodyPartClick = (bodyPart) => {
    setSelectedBodyPart(bodyPart);
    setShowMuscleDetails(true);
  };

  const closeMuscleDetails = () => {
    setShowMuscleDetails(false);
    setSelectedBodyPart(null);
  };

  return (
    <div className="inbody-history-modal-overlay">
      <div className="inbody-history-modal-content">
        {/* 상단 네비게이션 */}
        <div className="inbody-header">
          <button className="nav-back-btn" onClick={onClose}>
            <IoChevronBack />
          </button>
          <h1 className="nav-title">인바디 정보</h1>
        </div>

        <div className="inbody-body">
          {/* 메인 점수 섹션 */}
          <div className="score-section">
            <div className="main-score">
              <span className="score-number">74</span>
              <span className="score-unit">점/100점</span>
            </div>
            <button className="compare-btn">이전 기록과 비교</button>
          </div>

          {/* 기본 정보 */}
          <div className="basic-info">
            <span>여성</span>
            <span>29세</span>
            <span>162cm</span>
            <span>검사일 2025.08.04</span>
          </div>

          {/* 체성분 분석 */}
          <div className="analysis-section">
            <h3 className="section-title">체성분 분석</h3>
            <div className="analysis-list">
              <div className="analysis-item">
                <span className="item-name">체수분</span>
                <span className="item-value">30.4 (26.1 ~ 34.3)</span>
              </div>
              <div className="analysis-item">
                <span className="item-name">단백질</span>
                <span className="item-value">8.2 (7.6 ~ 9.2)</span>
              </div>
              <div className="analysis-item">
                <span className="item-name">무기질</span>
                <span className="item-value">2.89 (2.60 ~ 3.18)</span>
              </div>
              <div className="analysis-item">
                <span className="item-name">체지방량</span>
                <span className="item-value">17.3 (11.0 ~ 17.6)</span>
              </div>
              <div className="analysis-item">
                <span className="item-name">체중</span>
                <span className="item-value">58.8 (46.8 ~ 63.4)</span>
              </div>
            </div>
          </div>

          {/* 골격근 | 지방분석 - 첫 번째 차트 */}
          <div className="chart-section">
            <h3 className="section-title">골격근 | 지방분석</h3>
            <div className="chart-container">
              <div className="chart-item">
                <span className="chart-label">체중</span>
                <div className="chart-bar">
                  <div className="bar-range">
                    <span>표준이하</span>
                    <span>표준</span>
                    <span>표준이상</span>
                  </div>
                  <div className="bar-fill weight-bar">
                    <span className="bar-value">58.8</span>
                  </div>
                </div>
              </div>
              <div className="chart-item">
                <span className="chart-label">골격근량</span>
                <div className="chart-bar">
                  <div className="bar-range">
                    <span>표준이하</span>
                    <span>표준</span>
                    <span>표준이상</span>
                  </div>
                  <div className="bar-fill muscle-bar">
                    <span className="bar-value">22.9</span>
                  </div>
                </div>
              </div>
              <div className="chart-item">
                <span className="chart-label">체지방량</span>
                <div className="chart-bar">
                  <div className="bar-range">
                    <span>표준이하</span>
                    <span>표준</span>
                    <span>표준이상</span>
                  </div>
                  <div className="bar-fill fat-bar">
                    <span className="bar-value">17.3</span>
                  </div>
                </div>
              </div>
            </div>
          </div>

          {/* 골격근 | 지방분석 - 두 번째 차트 */}
          <div className="chart-section">
            <div className="chart-container">
              <div className="chart-item">
                <span className="chart-label">BMI</span>
                <div className="chart-bar">
                  <div className="bar-range">
                    <span>표준이하</span>
                    <span>표준</span>
                    <span>표준이상</span>
                  </div>
                  <div className="bar-fill bmi-bar">
                    <span className="bar-value">22.4</span>
                  </div>
                </div>
              </div>
              <div className="chart-item">
                <span className="chart-label">체지방률</span>
                <div className="chart-bar">
                  <div className="bar-range">
                    <span>표준이하</span>
                    <span>표준</span>
                    <span>표준이상</span>
                  </div>
                  <div className="bar-fill fat-percent-bar">
                    <span className="bar-value">29.4</span>
                  </div>
                </div>
              </div>
            </div>
          </div>

          {/* 체중 조절 */}
          <div className="weight-control-section">
            <h3 className="section-title">체중 조절</h3>
            <div className="weight-control-list">
              <div className="weight-item">
                <span className="weight-label">적정체중</span>
                <span className="weight-value">55.1kg</span>
              </div>
              <div className="weight-item">
                <span className="weight-label">체중조절</span>
                <span className="weight-value">-3.7kg</span>
              </div>
              <div className="weight-item">
                <span className="weight-label">지방조절</span>
                <span className="weight-value">-4.6kg</span>
              </div>
              <div className="weight-item">
                <span className="weight-label">근육조절</span>
                <span className="weight-value">+0.9kg</span>
              </div>
            </div>
          </div>

          {/* 복부지방률 & 내장지방레벨 */}
          <div className="fat-analysis-section">
            <div className="fat-item">
              <span className="fat-label">복부지방률</span>
              <span className="fat-value">0.86</span>
            </div>
            <div className="fat-item">
              <span className="fat-label">내장지방레벨</span>
              <span className="fat-value">6 (1~20)</span>
            </div>
          </div>

          {/* 부위별근육분석 */}
          <div className="muscle-analysis-section">
            <h3 className="section-title">부위별근육분석</h3>
            <div className="human-figures">
              <div className="figure-container">
                <div className="figure-title">측정 전</div>
                <div
                  className="human-figure clickable"
                  onClick={() => handleBodyPartClick("before")}
                >
                  🏋️
                </div>
              </div>
              <div className="figure-container">
                <div className="figure-title">측정 후</div>
                <div
                  className="human-figure clickable"
                  onClick={() => handleBodyPartClick("after")}
                >
                  🧍
                </div>
              </div>
            </div>
          </div>
        </div>
      </div>

      {/* 근육량 상세 팝업 */}
      {showMuscleDetails && selectedBodyPart && (
        <div className="muscle-details-overlay" onClick={closeMuscleDetails}>
          <div
            className="muscle-details-modal"
            onClick={(e) => e.stopPropagation()}
          >
            <div className="muscle-details-header">
              <h3 className="muscle-details-title">
                {selectedBodyPart === "before" ? "측정 전" : "측정 후"} 부위별
                근육량
              </h3>
              <button
                className="muscle-details-close"
                onClick={closeMuscleDetails}
              >
                <IoClose />
              </button>
            </div>
            <div className="muscle-details-body">
              <div className="muscle-details-grid">
                <div className="muscle-detail-item">
                  <span className="detail-label">머리</span>
                  <span className="detail-value">
                    {muscleData[selectedBodyPart].head}
                  </span>
                </div>
                <div className="muscle-detail-item">
                  <span className="detail-label">왼쪽 팔</span>
                  <span className="detail-value">
                    {muscleData[selectedBodyPart].leftArm}
                  </span>
                </div>
                <div className="muscle-detail-item">
                  <span className="detail-label">오른쪽 팔</span>
                  <span className="detail-value">
                    {muscleData[selectedBodyPart].rightArm}
                  </span>
                </div>
                <div className="muscle-detail-item">
                  <span className="detail-label">몸통</span>
                  <span className="detail-value">
                    {muscleData[selectedBodyPart].torso}
                  </span>
                </div>
                <div className="muscle-detail-item">
                  <span className="detail-label">왼쪽 다리</span>
                  <span className="detail-value">
                    {muscleData[selectedBodyPart].leftLeg}
                  </span>
                </div>
                <div className="muscle-detail-item">
                  <span className="detail-label">오른쪽 다리</span>
                  <span className="detail-value">
                    {muscleData[selectedBodyPart].rightLeg}
                  </span>
                </div>
              </div>
            </div>
          </div>
        </div>
      )}
    </div>
  );
}
