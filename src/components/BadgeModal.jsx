import { IoClose } from "react-icons/io5";
import styles from "./BadgeModal.module.css";

export default function BadgeModal({ isOpen, onClose, badge, onViewAll }) {
  if (!isOpen || !badge) return null;

  const badgeInfo = {
    purple: {
      title: "푸쉬업 마스터",
      description: "푸쉬업 100개 성공! 상체 장인의 탄생💪",
      icon: "🏆",
      color: "#8b5cf6",
    },
    blue: {
      title: "웨이트 트레이닝",
      description: "웨이트 트레이닝 30일 연속 달성! 근력의 신💪",
      icon: "🏋️",
      color: "#3b82f6",
    },
    red: {
      title: "불꽃 도전자",
      description: "고강도 운동 50회 완료! 불꽃 같은 열정🔥",
      icon: "🔥",
      color: "#ff6b35",
    },
  };

  const info = badgeInfo[badge.type] || badgeInfo.purple;

  return (
    <div className={styles['badge-modal-overlay']}>
      <div className={styles['badge-modal-content']}>
        <div className={styles['badge-modal-header']}>
          <h2 className={styles['badge-modal-title']}>뱃지</h2>
          <button className={styles['badge-modal-close']} onClick={onClose}>
            <IoClose />
          </button>
        </div>

        <div className={styles['badge-modal-body']}>
          <div className={styles['badge-display-large']}>
            <div
              className={styles['badge-large']}
              style={{ backgroundColor: info.color }}
            >
              {info.icon}
            </div>
          </div>

          <div className={styles['badge-info']}>
            <h3 className={styles['badge-title']}>{info.title}</h3>
            <p className={styles['badge-description']}>{info.description}</p>
          </div>
        </div>

        <div className={styles['badge-modal-footer']}>
          <button className={styles['badge-confirm-btn']} onClick={onClose}>
            확인
          </button>
        </div>
      </div>
    </div>
  );
}
