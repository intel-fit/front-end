import { useState } from "react";
import {
  IoClose,
  IoChevronBack,
  IoPencilOutline,
  IoTrashOutline,
} from "react-icons/io5";
import { FaCrown } from "react-icons/fa";
import "./InBodyHistoryModal.css";

export default function InBodyHistoryModal({
  isOpen,
  onClose,
  onEdit,
  onDelete,
  inBodyRecords = [],
}) {
  const [showMuscleDetails, setShowMuscleDetails] = useState(false);
  const [selectedBodyPart, setSelectedBodyPart] = useState(null);

  if (!isOpen) return null;

  const muscleData = {
    muscle: {
      head: "3.2kg",
      leftArm: "2.8kg",
      rightArm: "2.9kg",
      torso: "8.5kg",
      leftLeg: "4.1kg",
      rightLeg: "4.0kg",
    },
    fat: {
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

  // 가장 최근 인바디 데이터 가져오기 (없으면 기본값)
  const currentInBodyData =
    inBodyRecords.length > 0
      ? inBodyRecords[inBodyRecords.length - 1]
      : {
          id: null,
          measurementDate: "2025-08-04",
          weight: 58.8,
          muscleMass: 25.2,
          bodyFatPercentage: 18.5,
          basalMetabolicRate: 1420,
          bodyFatMass: 10.9,
          skeletalMuscleMass: 23.8,
          totalBodyWater: 30.4,
          protein: 8.2,
          mineral: 2.89,
          bmi: 22.4,
          obesityDegree: 95.2,
          bodyFatPercentageStandard: 18.0,
          visceralFatLevel: 3,
        };

  const handleEdit = () => {
    if (onEdit) {
      onEdit(currentInBodyData);
    }
  };

  const handleDelete = () => {
    if (currentInBodyData.id === null) {
      alert("삭제할 데이터가 없습니다.");
      return;
    }
    if (window.confirm("정말로 이 인바디 데이터를 삭제하시겠습니까?")) {
      if (onDelete) {
        onDelete(currentInBodyData.id);
      }
    }
  };

  // 날짜 포맷팅 함수
  const formatDate = (dateString) => {
    if (!dateString) return "2025.08.04";
    const date = new Date(dateString);
    return date
      .toLocaleDateString("ko-KR", {
        year: "numeric",
        month: "2-digit",
        day: "2-digit",
      })
      .replace(/\. /g, ".")
      .replace(".", "");
  };

  // 점수 계산 (임시)
  const calculateScore = (data) => {
    if (!data.weight || !data.bodyFatPercentage) return 74;
    // 간단한 점수 계산 로직 (실제로는 더 복잡할 것)
    const bmiScore = data.bmi
      ? Math.max(0, 100 - Math.abs(data.bmi - 22) * 10)
      : 70;
    const bodyFatScore = Math.max(
      0,
      100 - Math.abs(data.bodyFatPercentage - 15) * 5
    );
    return Math.round((bmiScore + bodyFatScore) / 2);
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
          <div className="header-actions">
            <button
              className="action-btn edit-btn"
              onClick={handleEdit}
              title="수정"
            >
              <IoPencilOutline />
            </button>
          </div>
        </div>

        <div className="inbody-body">
          {/* 메인 점수 섹션 */}
          <div className="score-section">
            <div className="main-score">
              <span className="score-number">
                {calculateScore(currentInBodyData)}
              </span>
              <span className="score-unit">점/100점</span>
            </div>
            <button className="compare-btn">이전 기록과 비교</button>
          </div>

          {/* 기본 정보 */}
          <div className="basic-info">
            <span>여성</span>
            <span>29세</span>
            <span>162cm</span>
            <span>검사일 {formatDate(currentInBodyData.measurementDate)}</span>
          </div>

          {/* 체성분 분석 */}
          <div className="analysis-section">
            <h3 className="section-title">체성분 분석</h3>
            <div className="analysis-list">
              <div className="analysis-item">
                <span className="item-name">체수분</span>
                <span className="item-value">
                  {currentInBodyData.totalBodyWater || "30.4"} (26.1 ~ 34.3)
                </span>
              </div>
              <div className="analysis-item">
                <span className="item-name">단백질</span>
                <span className="item-value">
                  {currentInBodyData.protein || "8.2"} (7.6 ~ 9.2)
                </span>
              </div>
              <div className="analysis-item">
                <span className="item-name">무기질</span>
                <span className="item-value">
                  {currentInBodyData.mineral || "2.89"} (2.60 ~ 3.18)
                </span>
              </div>
              <div className="analysis-item">
                <span className="item-name">체지방량</span>
                <span className="item-value">
                  {currentInBodyData.bodyFatMass || "17.3"} (11.0 ~ 17.6)
                </span>
              </div>
              <div className="analysis-item">
                <span className="item-name">체중</span>
                <span className="item-value">
                  {currentInBodyData.weight || "58.8"} (46.8 ~ 63.4)
                </span>
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

          {/* 부위별 분석 */}
          <div className="analysis-sections">
            <h3 className="analysis-section-title">
              <span>부위별 근육 분석</span>
              <span>부위별 체지방 분석</span>
            </h3>
            <div className="analysis-icons">
              <div className="figure-container">
                <div
                  className="human-figure clickable"
                  onClick={() => handleBodyPartClick("muscle")}
                >
                  🏋️
                </div>
              </div>
              <div className="figure-container">
                <div
                  className="human-figure clickable"
                  onClick={() => handleBodyPartClick("fat")}
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
                {selectedBodyPart === "muscle"
                  ? "부위별 근육량"
                  : "부위별 체지방량"}
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
