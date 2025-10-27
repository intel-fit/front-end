import React from "react";
import { IoClose } from "react-icons/io5";
import InbodyManualForm from "./InbodyManualForm";
import "./InBodyManualModal.css";

export default function InbodyManualModal({ isOpen, onClose, onSave }) {
  console.log("InBodyManualModal 렌더링됨, isOpen:", isOpen);

  const handleSubmit = (data) => {
    onSave(data);
    onClose();
  };

  if (!isOpen) {
    console.log("모달이 닫혀있음");
    return null;
  }

  return (
    <div className="manual-modal-bg">
      <div className="manual-modal">
        <div className="manual-modal-header">
          <h2>인바디 수기 입력</h2>
          <button className="close-btn" onClick={onClose}>
            <IoClose />
          </button>
        </div>
        <div className="manual-modal-content">
          <InbodyManualForm onSubmit={handleSubmit} />
        </div>
      </div>
    </div>
  );
}
