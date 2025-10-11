import { useState } from "react";
import { IoClose, IoCheckmark } from "react-icons/io5";
import "./InBodyManualModal.css";

export default function InBodyManualModal({ isOpen, onClose, onSave }) {
  const [formData, setFormData] = useState({
    weight: "",
    muscleMass: "",
    bodyFat: "",
    bmr: "",
    date: new Date().toISOString().split("T")[0],
  });

  if (!isOpen) return null;

  const handleInputChange = (field, value) => {
    setFormData((prev) => ({
      ...prev,
      [field]: value,
    }));
  };

  const handleSave = () => {
    if (
      !formData.weight ||
      !formData.muscleMass ||
      !formData.bodyFat ||
      !formData.bmr
    ) {
      alert("모든 필드를 입력해주세요.");
      return;
    }

    onSave({
      ...formData,
      weight: `${formData.weight}kg`,
      muscleMass: `${formData.muscleMass}kg`,
      bodyFat: `${formData.bodyFat}%`,
      bmr: `${formData.bmr}kcal`,
    });
  };

  const isFormValid =
    formData.weight && formData.muscleMass && formData.bodyFat && formData.bmr;

  return (
    <div className="inbody-manual-modal-overlay">
      <div className="inbody-manual-modal-content">
        <div className="inbody-manual-modal-header">
          <h2 className="inbody-manual-modal-title">수기 입력</h2>
          <button className="inbody-manual-modal-close" onClick={onClose}>
            <IoClose />
          </button>
        </div>

        <div className="inbody-manual-modal-body">
          <div className="form-section">
            <div className="form-group">
              <label className="form-label">측정 날짜</label>
              <input
                type="date"
                className="form-input"
                value={formData.date}
                onChange={(e) => handleInputChange("date", e.target.value)}
              />
            </div>

            <div className="form-group">
              <label className="form-label">체중 (kg)</label>
              <input
                type="number"
                className="form-input"
                placeholder="예: 70.5"
                value={formData.weight}
                onChange={(e) => handleInputChange("weight", e.target.value)}
                step="0.1"
                min="0"
              />
            </div>

            <div className="form-group">
              <label className="form-label">근육량 (kg)</label>
              <input
                type="number"
                className="form-input"
                placeholder="예: 35.2"
                value={formData.muscleMass}
                onChange={(e) =>
                  handleInputChange("muscleMass", e.target.value)
                }
                step="0.1"
                min="0"
              />
            </div>

            <div className="form-group">
              <label className="form-label">체지방률 (%)</label>
              <input
                type="number"
                className="form-input"
                placeholder="예: 15.3"
                value={formData.bodyFat}
                onChange={(e) => handleInputChange("bodyFat", e.target.value)}
                step="0.1"
                min="0"
                max="100"
              />
            </div>

            <div className="form-group">
              <label className="form-label">기초대사량 (kcal)</label>
              <input
                type="number"
                className="form-input"
                placeholder="예: 1650"
                value={formData.bmr}
                onChange={(e) => handleInputChange("bmr", e.target.value)}
                step="1"
                min="0"
              />
            </div>
          </div>

          <div className="help-section">
            <h3 className="help-title">💡 도움말</h3>
            <ul className="help-list">
              <li>정확한 측정을 위해 아침 공복 상태에서 측정하세요</li>
              <li>측정 전 화장실을 다녀오세요</li>
              <li>운동 전후는 측정하지 마세요</li>
            </ul>
          </div>
        </div>

        <div className="inbody-manual-modal-footer">
          <button
            className="save-btn"
            onClick={handleSave}
            disabled={!isFormValid}
          >
            <IoCheckmark />
            저장하기
          </button>
        </div>
      </div>
    </div>
  );
}
