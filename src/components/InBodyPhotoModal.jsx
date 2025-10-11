import { useState } from "react";
import { IoClose, IoCamera, IoImage, IoCheckmark } from "react-icons/io5";
import "./InBodyPhotoModal.css";

export default function InBodyPhotoModal({ isOpen, onClose, onSave }) {
  const [selectedImage, setSelectedImage] = useState(null);
  const [isProcessing, setIsProcessing] = useState(false);

  if (!isOpen) return null;

  const handleFileSelect = (event) => {
    const file = event.target.files[0];
    if (file) {
      const reader = new FileReader();
      reader.onload = (e) => {
        setSelectedImage(e.target.result);
      };
      reader.readAsDataURL(file);
    }
  };

  const handleTakePhoto = () => {
    // 카메라 접근 로직 (실제 구현에서는 navigator.mediaDevices.getUserMedia 사용)
    alert("카메라 기능은 실제 디바이스에서 구현됩니다.");
  };

  const handleProcessImage = async () => {
    if (!selectedImage) return;

    setIsProcessing(true);
    // 실제 이미지 처리 로직
    setTimeout(() => {
      setIsProcessing(false);
      alert("이미지 인식이 완료되었습니다!");
      onSave({
        weight: "70.5kg",
        muscleMass: "35.2kg",
        bodyFat: "15.3%",
        bmr: "1650kcal",
      });
    }, 2000);
  };

  const handleSave = () => {
    onSave({
      weight: "70.5kg",
      muscleMass: "35.2kg",
      bodyFat: "15.3%",
      bmr: "1650kcal",
    });
  };

  return (
    <div className="inbody-photo-modal-overlay">
      <div className="inbody-photo-modal-content">
        <div className="inbody-photo-modal-header">
          <h2 className="inbody-photo-modal-title">사진 인식</h2>
          <button className="inbody-photo-modal-close" onClick={onClose}>
            <IoClose />
          </button>
        </div>

        <div className="inbody-photo-modal-body">
          {!selectedImage ? (
            <div className="photo-selection">
              <div className="photo-placeholder">
                <IoImage className="placeholder-icon" />
                <p className="placeholder-text">
                  검사 결과 사진을 업로드하세요
                </p>
              </div>

              <div className="photo-actions">
                <label className="photo-action-btn">
                  <IoImage />
                  <span>갤러리에서 선택</span>
                  <input
                    type="file"
                    accept="image/*"
                    onChange={handleFileSelect}
                    style={{ display: "none" }}
                  />
                </label>

                <button className="photo-action-btn" onClick={handleTakePhoto}>
                  <IoCamera />
                  <span>사진 촬영</span>
                </button>
              </div>
            </div>
          ) : (
            <div className="photo-preview">
              <img
                src={selectedImage}
                alt="검사 결과"
                className="preview-image"
              />

              {isProcessing ? (
                <div className="processing">
                  <div className="processing-spinner"></div>
                  <p>이미지를 분석 중입니다...</p>
                </div>
              ) : (
                <div className="extracted-data">
                  <h3>인식된 데이터</h3>
                  <div className="data-grid">
                    <div className="data-item">
                      <span className="data-label">체중</span>
                      <span className="data-value">70.5kg</span>
                    </div>
                    <div className="data-item">
                      <span className="data-label">근육량</span>
                      <span className="data-value">35.2kg</span>
                    </div>
                    <div className="data-item">
                      <span className="data-label">체지방률</span>
                      <span className="data-value">15.3%</span>
                    </div>
                    <div className="data-item">
                      <span className="data-label">기초대사량</span>
                      <span className="data-value">1650kcal</span>
                    </div>
                  </div>
                </div>
              )}
            </div>
          )}
        </div>

        {selectedImage && !isProcessing && (
          <div className="inbody-photo-modal-footer">
            <button
              className="retake-btn"
              onClick={() => setSelectedImage(null)}
            >
              다시 선택
            </button>
            <button className="save-btn" onClick={handleSave}>
              <IoCheckmark />
              저장하기
            </button>
          </div>
        )}
      </div>
    </div>
  );
}
