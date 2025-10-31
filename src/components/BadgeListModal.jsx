import { IoClose } from "react-icons/io5";
import styles from "./BadgeListModal.module.css";

export default function BadgeListModal({ isOpen, onClose, onBadgeClick }) {
  if (!isOpen) return null;

  const allBadges = [
    {
      id: 1,
      type: "purple",
      title: "푸쉬업 마스터",
      description: "푸쉬업 100개 성공! 상체 장인의 탄생💪",
      icon: "🏆",
      color: "#8b5cf6",
      earned: true,
    },
    {
      id: 2,
      type: "blue",
      title: "웨이트 트레이닝",
      description: "웨이트 트레이닝 30일 연속 달성! 근력의 신💪",
      icon: "🏋️",
      color: "#3b82f6",
      earned: true,
    },
    {
      id: 3,
      type: "red",
      title: "불꽃 도전자",
      description: "고강도 운동 50회 완료! 불꽃 같은 열정🔥",
      icon: "🔥",
      color: "#ff6b35",
      earned: true,
    },
    {
      id: 4,
      type: "green",
      title: "달리기 마라톤",
      description: "10km 달리기 완주! 지구력의 승리🏃‍♂️",
      icon: "🏃‍♂️",
      color: "#10b981",
      earned: false,
    },
    {
      id: 5,
      type: "yellow",
      title: "요가 마스터",
      description: "요가 50회 완료! 몸과 마음의 조화🧘‍♀️",
      icon: "🧘‍♀️",
      color: "#f59e0b",
      earned: false,
    },
    {
      id: 6,
      type: "pink",
      title: "수영 고수",
      description: "수영 20회 완료! 물의 파도타기🏊‍♀️",
      icon: "🏊‍♀️",
      color: "#ec4899",
      earned: false,
    },
  ];

  const earnedBadges = allBadges.filter((badge) => badge.earned);
  const unearnedBadges = allBadges.filter((badge) => !badge.earned);

  return (
    <div className={styles['badge-list-modal-overlay']}>
      <div className={styles['badge-list-modal-content']}>
        <div className={styles['badge-list-modal-header']}>
          <h2 className={styles['badge-list-modal-title']}>
            뱃지 {earnedBadges.length}/80
          </h2>
          <button className={styles['badge-list-modal-close']} onClick={onClose}>
            <IoClose />
          </button>
        </div>

        <div className={styles['badge-list-modal-body']}>
          <div className={styles['badge-section']}>
            <h3 className={styles['badge-section-title']}>획득한 뱃지</h3>
            <div className={styles['badge-grid']}>
              {earnedBadges.map((badge) => (
                <div
                  key={badge.id}
                  className={`${styles['badge-item']} ${styles['earned']}`}
                  onClick={() => onBadgeClick(badge)}
                >
                  <div
                    className={styles['badge-small']}
                    style={{ backgroundColor: badge.color }}
                  >
                    {badge.icon}
                  </div>
                  <span className={styles['badge-item-title']}>{badge.title}</span>
                </div>
              ))}
            </div>
          </div>

          <div className={styles['badge-section']}>
            <h3 className={styles['badge-section-title']}>획득 가능한 뱃지</h3>
            <div className={styles['badge-grid']}>
              {unearnedBadges.map((badge) => (
                <div key={badge.id} className={`${styles['badge-item']} ${styles['unearned']}`}>
                  <div className={`${styles['badge-small']} ${styles['locked']}`}>{badge.icon}</div>
                  <span className={styles['badge-item-title']}>{badge.title}</span>
                </div>
              ))}
            </div>
          </div>
        </div>
      </div>
    </div>
  );
}
