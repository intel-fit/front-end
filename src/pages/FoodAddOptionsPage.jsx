import React from "react";
import { useNavigate } from "react-router-dom";
import styles from "./FoodAddOptionsPage.module.css";

const FoodAddOptionsModal = ({ isOpen, onClose }) => {
  const navigate = useNavigate();

  if (!isOpen) return null;

  const handlePhotoOption = () => {
    onClose();
    // 사진 업로드 기능 트리거
    navigate("/meal-add");
  };

  const handleSearchOption = () => {
    onClose();
    navigate("/food-search");
  };

  return (
    <>
      {/* 배경 오버레이 */}
      <div className={styles["modal-overlay"]} onClick={onClose} />
      
      {/* 모달 컨텐츠 */}
      <div className={styles["modal-container"]}>
        <div className={styles["options-container"]}>
          {/* 사진으로 식단 입력하기 */}
          <div
            className={styles["option-card"]}
            onClick={handlePhotoOption}
          >
            <div className={styles["option-icon"]}>
              <svg width="34" height="34" viewBox="0 0 24 24" fill="none">
                <path
                  d="M23 19a2 2 0 0 1-2 2H3a2 2 0 0 1-2-2V8a2 2 0 0 1 2-2h4l2-3h6l2 3h4a2 2 0 0 1 2 2z"
                  stroke="#fff"
                  strokeWidth="2"
                  strokeLinecap="round"
                  strokeLinejoin="round"
                />
                <circle
                  cx="12"
                  cy="13"
                  r="4"
                  stroke="#fff"
                  strokeWidth="2"
                  strokeLinecap="round"
                  strokeLinejoin="round"
                />
              </svg>
            </div>
            <div className={styles["option-text"]}>
              사진으로
              <br />
              식단 입력하기
            </div>
          </div>

          {/* 식단 검색하기 */}
          <div
            className={styles["option-card"]}
            onClick={handleSearchOption}
          >
            <div className={styles["option-icon"]}>
              <svg width="34" height="34" viewBox="0 0 24 24" fill="none">
                <circle
                  cx="11"
                  cy="11"
                  r="8"
                  stroke="#fff"
                  strokeWidth="2"
                  strokeLinecap="round"
                  strokeLinejoin="round"
                />
                <path
                  d="m21 21-4.35-4.35"
                  stroke="#fff"
                  strokeWidth="2"
                  strokeLinecap="round"
                  strokeLinejoin="round"
                />
              </svg>
            </div>
            <div className={styles["option-text"]}>식단 검색하기</div>
          </div>
        </div>
      </div>
    </>
  );
};

export default FoodAddOptionsModal;

