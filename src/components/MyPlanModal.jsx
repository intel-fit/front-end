import { IoClose, IoCheckmarkCircle, IoTrophy } from "react-icons/io5";
import "./MyPlanModal.css";

export default function MyPlanModal({ isOpen, onClose }) {
  if (!isOpen) return null;

  // 현재 플랜 정보
  const currentPlan = {
    name: "프리미엄 플랜",
    type: "premium",
    price: "29,900원",
    billingCycle: "월간",
    startDate: "2025-10-01",
    nextBillingDate: "2025-11-01",
    features: [
      "무제한 운동 기록",
      "AI 기반 InBody 분석",
      "맞춤형 운동 추천",
      "상세 통계 및 리포트",
      "챌린지 참여",
      "광고 제거",
    ],
  };

  // 다른 플랜 옵션
  const plans = [
    {
      name: "베이직 플랜",
      type: "basic",
      price: "무료",
      features: ["기본 운동 기록", "기본 통계", "커뮤니티 접근"],
    },
    {
      name: "프리미엄 플랜",
      type: "premium",
      price: "29,900원/월",
      isCurrent: true,
      features: [
        "무제한 운동 기록",
        "AI 기반 InBody 분석",
        "맞춤형 운동 추천",
        "상세 통계 및 리포트",
        "챌린지 참여",
        "광고 제거",
      ],
    },
    {
      name: "프로 플랜",
      type: "pro",
      price: "49,900원/월",
      features: [
        "프리미엄 플랜 전체 기능",
        "1:1 코칭 서비스",
        "식단 관리",
        "우선 고객 지원",
        "독점 콘텐츠 접근",
      ],
    },
  ];

  return (
    <div className="my-plan-modal-overlay">
      <div className="my-plan-modal-content">
        <div className="my-plan-modal-header">
          <h2 className="my-plan-modal-title">내 플랜</h2>
          <button className="my-plan-modal-close" onClick={onClose}>
            <IoClose />
          </button>
        </div>

        <div className="my-plan-modal-body">
          {/* 현재 플랜 정보 */}
          <div className="current-plan-section">
            <div className="current-plan-badge">
              <IoTrophy />
              <span>현재 플랜</span>
            </div>
            <div className="current-plan-card">
              <h3 className="plan-name">{currentPlan.name}</h3>
              <div className="plan-price">
                {currentPlan.price}
                <span>/월</span>
              </div>
              <div className="plan-dates">
                <div className="date-item">
                  <span className="date-label">시작일</span>
                  <span className="date-value">
                    {new Date(currentPlan.startDate).toLocaleDateString(
                      "ko-KR"
                    )}
                  </span>
                </div>
                <div className="date-item">
                  <span className="date-label">다음 결제일</span>
                  <span className="date-value">
                    {new Date(currentPlan.nextBillingDate).toLocaleDateString(
                      "ko-KR"
                    )}
                  </span>
                </div>
              </div>
              <div className="plan-features">
                <h4>포함된 기능</h4>
                <ul>
                  {currentPlan.features.map((feature, index) => (
                    <li key={index}>
                      <IoCheckmarkCircle />
                      {feature}
                    </li>
                  ))}
                </ul>
              </div>
            </div>
          </div>

          {/* 다른 플랜 옵션 */}
          <div className="other-plans-section">
            <h3 className="section-title">다른 플랜 보기</h3>
            <div className="plans-list">
              {plans.map((plan, index) => (
                <div
                  key={index}
                  className={`plan-card ${plan.isCurrent ? "current" : ""} ${
                    plan.type
                  }`}
                >
                  {plan.isCurrent && (
                    <div className="current-badge">현재 플랜</div>
                  )}
                  <h4 className="plan-card-name">{plan.name}</h4>
                  <div className="plan-card-price">{plan.price}</div>
                  <ul className="plan-card-features">
                    {plan.features.map((feature, idx) => (
                      <li key={idx}>
                        <IoCheckmarkCircle />
                        {feature}
                      </li>
                    ))}
                  </ul>
                  {!plan.isCurrent && (
                    <button className="select-plan-btn">
                      {plan.type === "basic" ? "다운그레이드" : "업그레이드"}
                    </button>
                  )}
                </div>
              ))}
            </div>
          </div>

          {/* 플랜 관리 */}
          <div className="plan-actions">
            <button className="cancel-plan-btn">플랜 해지하기</button>
          </div>
        </div>
      </div>
    </div>
  );
}
