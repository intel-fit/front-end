import React, { useState } from "react";
import {
  IoClose,
  IoCamera,
  IoImage,
  IoCheckmarkCircle,
  IoSparkles,
} from "react-icons/io5";
import "./InBodyPhotoModal.css";

export default function InBodyPhotoModal({ isOpen, onClose, onSave }) {
  const [selectedFile, setSelectedFile] = useState(null);
  const [isProcessing, setIsProcessing] = useState(false);

  const handleFileSelect = (event) => {
    const file = event.target.files[0];
    if (file) {
      setSelectedFile(file);
      setIsProcessing(true);

      // 2초 후 저장 처리
      setTimeout(() => {
        onSave({
          file: file,
          fileName: file.name,
          fileSize: file.size,
        });
        setIsProcessing(false);
        onClose();
      }, 2000);
    }
  };

  const handleClose = () => {
    setSelectedFile(null);
    setIsProcessing(false);
    onClose();
  };

  if (!isOpen) return null;

  return (
    <div className="popup-bg">
      <div className="popup">
        <div className="popup-header">
          <div className="icon-wrapper">
            <IoSparkles className="sparkle-icon" />
          </div>
          <h2>인바디 사진 분석</h2>
          <p className="subtitle">사진을 업로드하면 자동으로 분석해드려요</p>
        </div>

        <div className="popup-content">
          {!selectedFile ? (
            <div className="upload-section">
              <div className="upload-options">
                <label
                  className="upload-option camera-option"
                  htmlFor="photoInput"
                >
                  <div className="option-icon">
                    <IoCamera />
                  </div>
                  <div className="option-text">
                    <span className="option-title">카메라로 촬영</span>
                    <span className="option-desc">새로운 사진을 촬영해요</span>
                  </div>
                </label>

                <label
                  className="upload-option gallery-option"
                  htmlFor="photoInput"
                >
                  <div className="option-icon">
                    <IoImage />
                  </div>
                  <div className="option-text">
                    <span className="option-title">갤러리에서 선택</span>
                    <span className="option-desc">기존 사진을 선택해요</span>
                  </div>
                </label>
              </div>

              <div className="tips">
                <h4>📸 촬영 팁</h4>
                <ul>
                  <li>인바디 결과지가 명확하게 보이도록 촬영해주세요</li>
                  <li>조명이 충분한 곳에서 촬영해주세요</li>
                  <li>글자가 잘 보이도록 가까이서 촬영해주세요</li>
                </ul>
              </div>
            </div>
          ) : (
            <div className="processing-section">
              <div className="processing-animation">
                <div className="spinner"></div>
              </div>
              <h3>사진 분석 중...</h3>
              <p>잠시만 기다려주세요. 인바디 결과를 분석하고 있습니다.</p>
            </div>
          )}
        </div>

        <input
          type="file"
          accept="image/*"
          id="photoInput"
          onChange={handleFileSelect}
          style={{ display: "none" }}
        />

        <div className="popup-footer">
          <button className="btn btn-close" onClick={handleClose}>
            <IoClose />
            취소
          </button>
        </div>
      </div>
    </div>
  );
}
