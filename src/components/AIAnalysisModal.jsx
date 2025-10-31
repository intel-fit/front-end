import { useState } from "react";
import {
  IoClose,
  IoTrendingUp,
  IoCheckmarkCircle,
  IoAlertCircle,
} from "react-icons/io5";
import styles from "./AIAnalysisModal.module.css";

export default function AIAnalysisModal({ isOpen, onClose }) {
  const [isAnalyzing, setIsAnalyzing] = useState(false);
  const [showResult, setShowResult] = useState(false);

  if (!isOpen) return null;

  const handleAnalyze = () => {
    setIsAnalyzing(true);
    // 분석 시뮬레이션
    setTimeout(() => {
      setIsAnalyzing(false);
      setShowResult(true);
    }, 2000);
  };

  const handleClose = () => {
    setShowResult(false);
    onClose();
  };

  // 샘플 분석 결과 데이터
  const analysisResult = {
    overall: "good",
    score: 85,
    insights: [
      {
        category: "체중 관리",
        status: "good",
        message: "목표 체중을 향해 꾸준히 진행 중입니다",
        detail: "지난 한 달간 0.5kg 감량에 성공했습니다",
      },
      {
        category: "근육량 증가",
        status: "excellent",
        message: "근육량이 이상적으로 증가하고 있습니다",
        detail: "근육량이 0.3kg 증가했습니다",
      },
      {
        category: "체지방률",
        status: "warning",
        message: "체지방률 관리가 필요합니다",
        detail: "목표 대비 1.5% 높은 수준입니다",
      },
    ],
    recommendations: [
      "주 3-4회 근력 운동을 유지하세요",
      "단백질 섭취를 하루 120g으로 늘려보세요",
      "유산소 운동 시간을 주 150분으로 늘려보세요",
    ],
  };

  return (
    <div className={styles['ai-analysis-modal-overlay']}>
      <div className={styles['ai-analysis-modal-content']}>
        <div className={styles['ai-analysis-modal-header']}>
          <h2 className={styles['ai-analysis-modal-title']}>AI 분석</h2>
          <button className={styles['ai-analysis-modal-close']} onClick={handleClose}>
            <IoClose />
          </button>
        </div>

        <div className={styles['ai-analysis-modal-body']}>
          {!showResult ? (
            <div className={styles['analysis-start']}>
              <div className={styles['analysis-icon']}>🤖</div>
              <h3>AI 기반 InBody 분석</h3>
              <p className={styles['analysis-description']}>
                최근 InBody 검사 결과를 AI가 분석하여
                <br />
                맞춤형 피드백을 제공합니다
              </p>

              {isAnalyzing ? (
                <div className={styles['analyzing']}>
                  <div className={styles['analyzing-spinner']}></div>
                  <p className={styles['analyzing-text']}>분석 중...</p>
                </div>
              ) : (
                <button className={styles['start-analysis-btn']} onClick={handleAnalyze}>
                  분석 시작하기
                </button>
              )}
            </div>
          ) : (
            <div className={styles['analysis-result']}>
              <div className={styles['result-score']}>
                <div className={styles['score-circle']}>
                  <div className={styles['score-value']}>{analysisResult.score}</div>
                  <div className={styles['score-label']}>점</div>
                </div>
                <p className={styles['score-status']}>전반적으로 좋은 상태입니다</p>
              </div>

              <div className={styles['insights-section']}>
                <h4 className={styles['section-title']}>분석 결과</h4>
                <div className={styles['insights-list']}>
                  {analysisResult.insights.map((insight, index) => (
                    <div key={index} className={styles['insight-item']}>
                      <div className={styles['insight-header']}>
                        <span className={styles['insight-category']}>
                          {insight.category}
                        </span>
                        {insight.status === "excellent" && (
                          <IoCheckmarkCircle className={`${styles['status-icon']} ${styles['excellent']}`} />
                        )}
                        {insight.status === "good" && (
                          <IoTrendingUp className={`${styles['status-icon']} ${styles['good']}`} />
                        )}
                        {insight.status === "warning" && (
                          <IoAlertCircle className={`${styles['status-icon']} ${styles['warning']}`} />
                        )}
                      </div>
                      <p className={styles['insight-message']}>{insight.message}</p>
                      <p className={styles['insight-detail']}>{insight.detail}</p>
                    </div>
                  ))}
                </div>
              </div>

              <div className={styles['recommendations-section']}>
                <h4 className={styles['section-title']}>AI 추천 사항</h4>
                <ul className={styles['recommendations-list']}>
                  {analysisResult.recommendations.map((rec, index) => (
                    <li key={index}>{rec}</li>
                  ))}
                </ul>
              </div>
            </div>
          )}
        </div>
      </div>
    </div>
  );
}
