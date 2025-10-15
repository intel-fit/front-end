import React, { useState } from 'react';
import './AddFoodModal.css';

const AddFoodModal = ({ isOpen, onClose, onSave }) => {
  const [foodName, setFoodName] = useState('');
  const [calories, setCalories] = useState('');
  const [carbs, setCarbs] = useState('');
  const [protein, setProtein] = useState('');
  const [fat, setFat] = useState('');

  if (!isOpen) return null;

  const handleSave = () => {
    const foodData = {
      name: foodName,
      calories: calories,
      carbs: carbs,
      protein: protein,
      fat: fat
    };
    onSave(foodData);
    handleClose();
  };

  const handleClose = () => {
    setFoodName('');
    setCalories('');
    setCarbs('');
    setProtein('');
    setFat('');
    onClose();
  };

  return (
    <div className="modal-overlay" onClick={handleClose}>
      <div className="add-food-modal" onClick={(e) => e.stopPropagation()}>
        <button className="modal-close-button" onClick={handleClose}>
          <svg width="28" height="28" viewBox="0 0 28 28" fill="none">
            <path d="M21 7L7 21M7 7L21 21" stroke="white" strokeWidth="2" strokeLinecap="round" strokeLinejoin="round"/>
          </svg>
        </button>

        {/* 음식 이름 */}
        <div className="modal-input-group">
          <input
            type="text"
            className="modal-input modal-input-full"
            placeholder="음식 이름 (최대 20자)"
            value={foodName}
            onChange={(e) => setFoodName(e.target.value.slice(0, 20))}
            maxLength={20}
          />
        </div>

        {/* 칼로리와 탄수화물 */}
        <div className="modal-row">
          <div className="modal-input-group">
            <label className="modal-label">칼로리</label>
            <input
              type="number"
              className="modal-input"
              placeholder="0"
              value={calories}
              onChange={(e) => setCalories(e.target.value)}
            />
          </div>
          <div className="modal-input-group">
            <label className="modal-label">탄수화물</label>
            <input
              type="number"
              className="modal-input"
              placeholder="0"
              value={carbs}
              onChange={(e) => setCarbs(e.target.value)}
            />
          </div>
        </div>

        {/* 단백질과 지방 */}
        <div className="modal-row">
          <div className="modal-input-group">
            <label className="modal-label">단백질</label>
            <input
              type="number"
              className="modal-input"
              placeholder="0"
              value={protein}
              onChange={(e) => setProtein(e.target.value)}
            />
          </div>
          <div className="modal-input-group">
            <label className="modal-label">지방</label>
            <input
              type="number"
              className="modal-input"
              placeholder="0"
              value={fat}
              onChange={(e) => setFat(e.target.value)}
            />
          </div>
        </div>

        {/* 저장하기 버튼 */}
        <button className="modal-save-button" onClick={handleSave}>
          저장하기
        </button>
      </div>
    </div>
  );
};

export default AddFoodModal;

