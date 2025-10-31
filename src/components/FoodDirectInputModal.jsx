import React, { useState } from "react";
import styles from "./FoodDirectInputModal.module.css";

const FoodDirectInputModal = ({ isOpen, onClose, onSave }) => {
  const [foodName, setFoodName] = useState("");
  const [calories, setCalories] = useState("");
  const [carbs, setCarbs] = useState("");
  const [protein, setProtein] = useState("");
  const [fat, setFat] = useState("");
  const [weight, setWeight] = useState("");

  if (!isOpen) return null;

  const handleSave = () => {
    if (!foodName) {
      alert("음식 이름을 입력해주세요.");
      return;
    }

    const foodData = {
      name: foodName,
      calories: Number(calories) || 0,
      carbs: Number(carbs) || 0,
      protein: Number(protein) || 0,
      fat: Number(fat) || 0,
      weight: Number(weight) || 0,
    };

    onSave(foodData);
    handleClose();
  };

  const handleClose = () => {
    setFoodName("");
    setCalories("");
    setCarbs("");
    setProtein("");
    setFat("");
    setWeight("");
    onClose();
  };

  return (
    <>
      {/* 배경 오버레이 */}
      <div className={styles["modal-overlay"]} onClick={handleClose} />

      {/* 모달 컨텐츠 */}
      <div className={styles["modal-container"]}>
        {/* 닫기 버튼 */}
        <button
          className={styles["close-button"]}
          onClick={handleClose}
          aria-label="닫기"
        >
          <svg width="28" height="28" viewBox="0 0 24 24" fill="none">
            <path
              d="M18 6L6 18M6 6l12 12"
              stroke="#fff"
              strokeWidth="2"
              strokeLinecap="round"
              strokeLinejoin="round"
            />
          </svg>
        </button>

        <div className={styles["modal-content"]}>
          {/* 음식 이름 */}
          <div className={styles["input-group"]}>
            <input
              type="text"
              className={styles["food-name-input"]}
              placeholder="음식 이름 (최대 20자)"
              value={foodName}
              onChange={(e) =>
                setFoodName(e.target.value.slice(0, 20))
              }
              maxLength={20}
            />
          </div>

          {/* 칼로리 & 탄수화물 */}
          <div className={styles["input-row"]}>
            <div className={styles["input-group-half"]}>
              <label className={styles["input-label"]}>칼로리</label>
              <input
                type="number"
                className={styles["input-field"]}
                value={calories}
                onChange={(e) => setCalories(e.target.value)}
                placeholder="0"
              />
            </div>
            <div className={styles["input-group-half"]}>
              <label className={styles["input-label"]}>탄수화물</label>
              <input
                type="number"
                className={styles["input-field"]}
                value={carbs}
                onChange={(e) => setCarbs(e.target.value)}
                placeholder="0"
              />
            </div>
          </div>

          {/* 단백질 & 지방 */}
          <div className={styles["input-row"]}>
            <div className={styles["input-group-half"]}>
              <label className={styles["input-label"]}>단백질</label>
              <input
                type="number"
                className={styles["input-field"]}
                value={protein}
                onChange={(e) => setProtein(e.target.value)}
                placeholder="0"
              />
            </div>
            <div className={styles["input-group-half"]}>
              <label className={styles["input-label"]}>지방</label>
              <input
                type="number"
                className={styles["input-field"]}
                value={fat}
                onChange={(e) => setFat(e.target.value)}
                placeholder="0"
              />
            </div>
          </div>

          {/* 총 중량 */}
          <div className={styles["input-group"]}>
            <label className={styles["input-label-center"]}>총 중량</label>
            <div className={styles["weight-input-wrapper"]}>
              <input
                type="number"
                className={styles["weight-input"]}
                value={weight}
                onChange={(e) => setWeight(e.target.value)}
                placeholder="0"
              />
              <div className={styles["dropdown-icon"]}>
                <svg width="24" height="24" viewBox="0 0 24 24" fill="none">
                  <path
                    d="M6 9l6 6 6-6"
                    stroke="#fff"
                    strokeWidth="2"
                    strokeLinecap="round"
                    strokeLinejoin="round"
                  />
                </svg>
              </div>
            </div>
          </div>

          {/* 저장하기 버튼 */}
          <button className={styles["save-button"]} onClick={handleSave}>
            저장하기
          </button>
        </div>
      </div>
    </>
  );
};

export default FoodDirectInputModal;

