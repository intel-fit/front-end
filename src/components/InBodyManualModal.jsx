import React from "react";
import { IoClose } from "react-icons/io5";
import InbodyManualForm from "./InbodyManualForm";
import styles from "./InBodyManualModal.module.css";

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
    <div className={styles['manual-modal-bg']}>
      <div className={styles['manual-modal']}>
        <div className={styles['manual-modal-header']}>
          <h2>인바디 수기 입력</h2>
          <button className={styles['close-btn']} onClick={onClose}>
            <IoClose />
          </button>
        </div>
        <div className={styles['manual-modal-content']}>
          <InbodyManualForm onSubmit={handleSubmit} />
        </div>
      </div>
    </div>
  );
}
