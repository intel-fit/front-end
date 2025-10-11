import { IoClose, IoCamera, IoPencil } from "react-icons/io5";
import "./InBodyInputModal.css";

export default function InBodyInputModal({
  isOpen,
  onClose,
  onSelectPhoto,
  onSelectManual,
}) {
  if (!isOpen) return null;

  return (
    <div className="inbody-input-modal-overlay">
      <div className="inbody-input-modal-content">
        <div className="inbody-input-modal-header">
          <h2 className="inbody-input-modal-title">검사결과 입력하기</h2>
          <button className="inbody-input-modal-close" onClick={onClose}>
            <IoClose />
          </button>
        </div>

        <div className="inbody-input-modal-body">
          <div className="input-options">
            <div className="input-option" onClick={onSelectPhoto}>
              <div className="option-icon photo">
                <IoCamera />
              </div>
              <div className="option-content">
                <h3 className="option-title">사진 인식</h3>
                <p className="option-description">
                  검사 결과 사진을 촬영하여 자동으로 입력
                </p>
              </div>
            </div>

            <div className="input-option" onClick={onSelectManual}>
              <div className="option-icon manual">
                <IoPencil />
              </div>
              <div className="option-content">
                <h3 className="option-title">수기 입력</h3>
                <p className="option-description">검사 결과를 직접 입력</p>
              </div>
            </div>
          </div>
        </div>
      </div>
    </div>
  );
}
