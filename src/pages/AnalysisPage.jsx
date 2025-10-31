import React, { useState } from "react";
import { useNavigate } from "react-router-dom";
import styles from "./AnalysisPage.module.css";
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
    <div className={styles['analysis-page']}>
      <Header title="분석하기" />
      <div className={styles['analysis-content']}>
        {/* 인사말 섹션 */}
        <div className={styles['greeting-section']}>
          <div className={styles['greeting-name']}>유정님,</div>
          <div className={styles['greeting-message']}>
            지난주보다 체지방률이 1.2% 감소했어요! <br />
            계속 이렇게만 가요 ✨
          </div>
        </div>

        {/* 인바디 기록/분석 섹션 */}
        <div className={styles['inbody-section']}>
          <div className={styles['section-header']}>
            <h2>인바디 기록/분석</h2>
            <p>최근 측정일 2025.10.05</p>
          </div>
          <div className={styles['input-buttons']}>
            <button className={`${styles['input-btn']} ${styles['photo-btn']}`} onClick={handlePhotoClick}>
              <IoCameraOutline />
              <span>사진으로 입력</span>
            </button>
            <button
              className={`${styles['input-btn']} ${styles['manual-btn']}`}
              onClick={handleManualClick}
            >
              <IoPencilOutline />
              <span>수기로 입력</span>
            </button>
          </div>
          <button className={styles['analysis-btn']} onClick={handleInBodyClick}>
            <IoBarChartOutline />
            <span>정보/분석</span>
          </button>
        </div>

        {/* 운동 분석 섹션 */}
        <div className={styles['exercise-section']}>
          <h2>운동 분석</h2>
          <p className={styles['exercise-summary']}>
            "<span className={styles['highlight-text']}>등, 어깨, 하체</span> 근력이
            강해졌어요. 최근 운동 종목의 1RM을 알아보세요."
          </p>
          <div className={styles['exercise-list']}>
            <div className={styles['exercise-item']}>
              <div className={styles['exercise-icon']}>
                <FaDumbbell />
              </div>
              <div className={styles['exercise-info']}>
                <span className={styles['exercise-name']}>스쿼트</span>
                <span className={`${styles['exercise-change']} ${styles['positive']}`}>
                  <FaArrowUp /> 5kg
                </span>
              </div>
              <div className={styles['exercise-1rm']}>1RM 50kg</div>
            </div>
            <div className={styles['exercise-item']}>
              <div className={styles['exercise-icon']}>
                <FaDumbbell />
              </div>
              <div className={styles['exercise-info']}>
                <span className={styles['exercise-name']}>데드리프트</span>
                <span className={`${styles['exercise-change']} ${styles['neutral']}`}>
                  <FaMinus /> -kg
                </span>
              </div>
              <div className={styles['exercise-1rm']}>1RM 75kg</div>
            </div>
            <div className={styles['exercise-item']}>
              <div className={styles['exercise-icon']}>
                <FaDumbbell />
              </div>
              <div className={styles['exercise-info']}>
                <span className={styles['exercise-name']}>벤치 프레스</span>
                <span className={`${styles['exercise-change']} ${styles['negative']}`}>
                  <FaArrowDown /> 3kg
                </span>
              </div>
              <div className={styles['exercise-1rm']}>1RM 60kg</div>
            </div>
            <div className={styles['exercise-item']}>
              <div className={styles['exercise-icon']}>
                <FaDumbbell />
              </div>
              <div className={styles['exercise-info']}>
                <span className={styles['exercise-name']}>벤치 프레스</span>
                <span className={`${styles['exercise-change']} ${styles['negative']}`}>
                  <FaArrowDown /> 3kg
                </span>
              </div>
              <div className={styles['exercise-1rm']}>1RM 60kg</div>
            </div>
            <div className={styles['exercise-item']}>
              <div className={styles['exercise-icon']}>
                <FaDumbbell />
              </div>
              <div className={styles['exercise-info']}>
                <span className={styles['exercise-name']}>스쿼트</span>
                <span className={`${styles['exercise-change']} ${styles['positive']}`}>
                  <FaArrowUp /> 10kg
                </span>
              </div>
              <div className={styles['exercise-1rm']}>1RM 50kg</div>
            </div>
          </div>
        </div>

        {/* 식단 분석 섹션 */}
        <div className={styles['diet-section']}>
          <h2>식단 분석</h2>
          <p className={styles['diet-summary']}>
            "단백질을 더 섭취하세요(약 100g 부족) <br />
            저번주보다 지방을 약 1.5배 섭취중이에요 😥"
          </p>

          <div className={styles['calorie-section']}>
            <div className={styles['calorie-chart']}>
              <div className={styles['donut-chart']}>
                <div className={styles['chart-center']}>
                  <div className={styles['chart-value']}>1850</div>
                  <div className={styles['chart-goal']}>목표 2000kcal</div>
                </div>
              </div>
              <div className={styles['nutrient-legend']}>
                <div className={styles['legend-item']}>
                  <div className={`${styles['legend-box']} ${styles['protein']}`}>50%</div>
                  <div className={styles['legend-letter']}>P</div>
                </div>
                <div className={styles['legend-item']}>
                  <div className={`${styles['legend-box']} ${styles['carbs']}`}>40%</div>
                  <div className={styles['legend-letter']}>C</div>
                </div>
                <div className={styles['legend-item']}>
                  <div className={`${styles['legend-box']} ${styles['fat']}`}>10%</div>
                  <div className={styles['legend-letter']}>F</div>
                </div>
              </div>
            </div>
          </div>

          <div className={styles['nutrient-analysis']}>
            <h3>세부 영양소 분석</h3>
            <div className={styles['nutrient-item']}>
              <span className={styles['nutrient-name']}>탄수화물</span>
              <div className={styles['nutrient-bar']}>
                <div
                  className={`${styles['nutrient-progress']} ${styles['carbs']}`}
                  style={{ width: "79%" }}
                ></div>
              </div>
              <span className={styles['nutrient-value']}>95g / 120g</span>
            </div>
            <div className={styles['nutrient-item']}>
              <span className={styles['nutrient-name']}>단백질</span>
              <div className={styles['nutrient-bar']}>
                <div
                  className={`${styles['nutrient-progress']} ${styles['protein']}`}
                  style={{ width: "79%" }}
                ></div>
              </div>
              <span className={styles['nutrient-value']}>95g / 120g</span>
            </div>
            <div className={styles['nutrient-item']}>
              <span className={styles['nutrient-name']}>지방</span>
              <div className={styles['nutrient-bar']}>
                <div
                  className={`${styles['nutrient-progress']} ${styles['fat']}`}
                  style={{ width: "79%" }}
                ></div>
              </div>
              <span className={styles['nutrient-value']}>95g / 120g</span>
            </div>
            <div className={styles['nutrient-item']}>
              <span className={styles['nutrient-name']}>나트륨</span>
              <div className={styles['nutrient-bar']}>
                <div
                  className={`${styles['nutrient-progress']} ${styles['sodium']}`}
                  style={{ width: "79%" }}
                ></div>
              </div>
              <span className={styles['nutrient-value']}>95g / 120g</span>
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
