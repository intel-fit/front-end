import { useState } from "react";
import { IoClose, IoTrendingUp, IoTrendingDown } from "react-icons/io5";
import "./InBodyHistoryModal.css";

export default function InBodyHistoryModal({ isOpen, onClose }) {
  const [selectedPeriod, setSelectedPeriod] = useState("all");

  if (!isOpen) return null;

  // 샘플 데이터 (실제로는 서버에서 가져오거나 localStorage에서 불러옴)
  const historyData = [
    {
      id: 1,
      date: "2025-10-11",
      weight: "70.5",
      muscleMass: "35.2",
      bodyFat: "15.3",
      bmr: "1650",
      changes: {
        weight: "+0.5",
        muscleMass: "+0.3",
        bodyFat: "-0.2",
        bmr: "+20",
      },
    },
    {
      id: 2,
      date: "2025-10-04",
      weight: "70.0",
      muscleMass: "34.9",
      bodyFat: "15.5",
      bmr: "1630",
      changes: {
        weight: "-0.3",
        muscleMass: "+0.2",
        bodyFat: "-0.3",
        bmr: "+10",
      },
    },
    {
      id: 3,
      date: "2025-09-27",
      weight: "70.3",
      muscleMass: "34.7",
      bodyFat: "15.8",
      bmr: "1620",
      changes: {
        weight: "+0.8",
        muscleMass: "+0.5",
        bodyFat: "-0.5",
        bmr: "+30",
      },
    },
    {
      id: 4,
      date: "2025-09-20",
      weight: "69.5",
      muscleMass: "34.2",
      bodyFat: "16.3",
      bmr: "1590",
      changes: {
        weight: "-0.2",
        muscleMass: "+0.1",
        bodyFat: "-0.1",
        bmr: "+5",
      },
    },
  ];

  const getTrendIcon = (value) => {
    if (!value) return null;
    const numValue = parseFloat(value);
    if (numValue > 0) return <IoTrendingUp className="trend-up" />;
    if (numValue < 0) return <IoTrendingDown className="trend-down" />;
    return null;
  };

  const formatChange = (value) => {
    if (!value) return "";
    const numValue = parseFloat(value);
    return numValue > 0 ? `+${value}` : value;
  };

  return (
    <div className="inbody-history-modal-overlay">
      <div className="inbody-history-modal-content">
        <div className="inbody-history-modal-header">
          <h2 className="inbody-history-modal-title">전체 내역</h2>
          <button className="inbody-history-modal-close" onClick={onClose}>
            <IoClose />
          </button>
        </div>

        <div className="period-selector">
          <button
            className={`period-btn ${selectedPeriod === "all" ? "active" : ""}`}
            onClick={() => setSelectedPeriod("all")}
          >
            전체
          </button>
          <button
            className={`period-btn ${
              selectedPeriod === "3months" ? "active" : ""
            }`}
            onClick={() => setSelectedPeriod("3months")}
          >
            3개월
          </button>
          <button
            className={`period-btn ${
              selectedPeriod === "6months" ? "active" : ""
            }`}
            onClick={() => setSelectedPeriod("6months")}
          >
            6개월
          </button>
          <button
            className={`period-btn ${
              selectedPeriod === "1year" ? "active" : ""
            }`}
            onClick={() => setSelectedPeriod("1year")}
          >
            1년
          </button>
        </div>

        <div className="inbody-history-modal-body">
          {historyData.length === 0 ? (
            <div className="empty-state">
              <p>아직 검사 기록이 없습니다.</p>
              <p className="empty-state-sub">
                검사 결과를 입력하여 변화를 추적하세요
              </p>
            </div>
          ) : (
            <div className="history-list">
              {historyData.map((record) => (
                <div key={record.id} className="history-item">
                  <div className="history-date">
                    {new Date(record.date).toLocaleDateString("ko-KR", {
                      year: "numeric",
                      month: "long",
                      day: "numeric",
                    })}
                  </div>

                  <div className="history-data-grid">
                    <div className="history-data-item">
                      <div className="data-header">
                        <span className="data-label">체중</span>
                        {record.changes?.weight && (
                          <span
                            className={`data-change ${
                              parseFloat(record.changes.weight) > 0
                                ? "positive"
                                : "negative"
                            }`}
                          >
                            {getTrendIcon(record.changes.weight)}
                            {formatChange(record.changes.weight)}kg
                          </span>
                        )}
                      </div>
                      <span className="data-value">{record.weight}kg</span>
                    </div>

                    <div className="history-data-item">
                      <div className="data-header">
                        <span className="data-label">근육량</span>
                        {record.changes?.muscleMass && (
                          <span
                            className={`data-change ${
                              parseFloat(record.changes.muscleMass) > 0
                                ? "positive"
                                : "negative"
                            }`}
                          >
                            {getTrendIcon(record.changes.muscleMass)}
                            {formatChange(record.changes.muscleMass)}kg
                          </span>
                        )}
                      </div>
                      <span className="data-value">{record.muscleMass}kg</span>
                    </div>

                    <div className="history-data-item">
                      <div className="data-header">
                        <span className="data-label">체지방률</span>
                        {record.changes?.bodyFat && (
                          <span
                            className={`data-change ${
                              parseFloat(record.changes.bodyFat) < 0
                                ? "positive"
                                : "negative"
                            }`}
                          >
                            {getTrendIcon(record.changes.bodyFat)}
                            {formatChange(record.changes.bodyFat)}%
                          </span>
                        )}
                      </div>
                      <span className="data-value">{record.bodyFat}%</span>
                    </div>

                    <div className="history-data-item">
                      <div className="data-header">
                        <span className="data-label">기초대사량</span>
                        {record.changes?.bmr && (
                          <span
                            className={`data-change ${
                              parseFloat(record.changes.bmr) > 0
                                ? "positive"
                                : "negative"
                            }`}
                          >
                            {getTrendIcon(record.changes.bmr)}
                            {formatChange(record.changes.bmr)}kcal
                          </span>
                        )}
                      </div>
                      <span className="data-value">{record.bmr}kcal</span>
                    </div>
                  </div>
                </div>
              ))}
            </div>
          )}
        </div>
      </div>
    </div>
  );
}
