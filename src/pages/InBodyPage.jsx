import React, { useState } from "react";
import { useNavigate } from "react-router-dom";
import "./InBodyPage.css";
import Header from "../components/Header";
import InbodyDateNavigator from "../components/InbodyDateNavigator";

export default function InBodyPage() {
  const navigate = useNavigate();
  const [selectedDate, setSelectedDate] = useState(new Date());

  // 인바디 기록 날짜들 (예시 데이터)
  const inbodyDates = [
    "2025-01-15",
    "2025-01-22",
    "2025-01-29",
    "2025-02-05",
    "2025-02-12",
    "2025-02-19",
    "2025-02-26",
    "2025-03-05",
    "2025-03-12",
    "2025-03-19",
    "2025-03-26",
    "2025-04-02",
    "2025-04-09",
    "2025-04-16",
    "2025-04-23",
    "2025-04-30",
    "2025-05-07",
    "2025-05-14",
    "2025-05-21",
    "2025-05-28",
    "2025-06-04",
    "2025-06-11",
    "2025-06-18",
    "2025-06-25",
    "2025-07-02",
    "2025-07-09",
    "2025-07-16",
    "2025-07-23",
    "2025-07-30",
    "2025-08-06",
    "2025-08-13",
    "2025-08-20",
    "2025-08-27",
    "2025-09-03",
    "2025-09-10",
    "2025-09-17",
    "2025-09-24",
    "2025-10-01",
    "2025-10-08",
    "2025-10-15",
    "2025-10-22",
    "2025-10-29",
    "2025-11-05",
    "2025-11-12",
    "2025-11-19",
    "2025-11-26",
    "2025-12-03",
    "2025-12-10",
    "2025-12-17",
    "2025-12-24",
    "2025-12-31",
  ];

  const handleGraphClick = () => {
    navigate("/graph");
  };

  const handleDateChange = (newDate) => {
    setSelectedDate(newDate);
    // 여기서 선택된 날짜에 해당하는 인바디 데이터를 로드할 수 있습니다
    console.log("선택된 날짜:", newDate);
  };

  return (
    <div className="inbody-page">
      <Header title="인바디 정보" />

      <div className="inbody-content">
        {/* 탭 네비게이션 */}
        <div className="tab-navigation">
          <div className="tab active">인바디 정보</div>
          <div className="tab" onClick={handleGraphClick}>
            그래프
          </div>
        </div>

        {/* 날짜 선택 */}
        <InbodyDateNavigator dates={inbodyDates} onChange={handleDateChange} />

        {/* 체성분 분석 */}
        <div className="analysis-section">
          <h3>체성분 분석</h3>
          <div className="metric-list">
            <div className="metric-item">
              <span className="metric-name">체수분</span>
              <span className="metric-value">37.8</span>
              <span className="metric-range">(34.8~42.6)</span>
            </div>
            <div className="metric-item">
              <span className="metric-name">단백질</span>
              <span className="metric-value">10.2</span>
              <span className="metric-range">(9.4~11.4)</span>
            </div>
            <div className="metric-item">
              <span className="metric-name">무기질</span>
              <span className="metric-value">3.32</span>
              <span className="metric-range">(3.22~3.94)</span>
            </div>
            <div className="metric-item">
              <span className="metric-name">체지방</span>
              <span className="metric-value">13.1</span>
              <span className="metric-range">(7.4~14.9)</span>
            </div>
          </div>
        </div>

        {/* 골격근 지방 분석 */}
        <div className="analysis-section">
          <h3>골격근 지방 분석</h3>
          <div className="bar-chart-list">
            <div className="bar-labels-header">
              <span className="bar-range-label">표준이하</span>
              <span className="bar-range-label">표준</span>
              <span className="bar-range-label">표준이상</span>
            </div>
            <div className="bar-item">
              <span className="bar-label">체수분</span>
              <div className="bar-chart-container">
                <div className="bar-container">
                  <div className="bar-fill" style={{ width: "75%" }}></div>
                  <span className="bar-value">37.8</span>
                </div>
              </div>
              <span className="bar-status">표준</span>
            </div>
            <div className="bar-item">
              <span className="bar-label">골격근량</span>
              <div className="bar-chart-container">
                <div className="bar-container">
                  <div className="bar-fill" style={{ width: "30%" }}></div>
                  <span className="bar-value">28.7</span>
                </div>
              </div>
              <span className="bar-status">표준</span>
            </div>
            <div className="bar-item">
              <span className="bar-label">체지방량</span>
              <div className="bar-chart-container">
                <div className="bar-container">
                  <div className="bar-fill" style={{ width: "50%" }}></div>
                  <span className="bar-value">13.1</span>
                </div>
              </div>
              <span className="bar-status">표준</span>
            </div>
          </div>
        </div>

        {/* 비만 분석 */}
        <div className="analysis-section">
          <h3>비만 분석</h3>
          <div className="bar-chart-list">
            <div className="bar-labels-header">
              <span className="bar-range-label">표준이하</span>
              <span className="bar-range-label">표준</span>
              <span className="bar-range-label">표준이상</span>
            </div>
            <div className="bar-item">
              <span className="bar-label">BMI</span>
              <div className="bar-chart-container">
                <div className="bar-container">
                  <div className="bar-fill" style={{ width: "38%" }}></div>
                  <span className="bar-value">22.9</span>
                </div>
              </div>
              <span className="bar-status">표준</span>
            </div>
            <div className="bar-item">
              <span className="bar-label">체지방률</span>
              <div className="bar-chart-container">
                <div className="bar-container">
                  <div className="bar-fill" style={{ width: "72%" }}></div>
                  <span className="bar-value">20.3</span>
                </div>
              </div>
              <span className="bar-status">표준</span>
            </div>
          </div>
        </div>

        {/* 부위별 근육 분석 */}
        <div className="analysis-section">
          <h3>부위별 근육 분석</h3>
          <div className="bar-chart-list">
            <div className="bar-labels-header">
              <span className="bar-range-label">표준이하</span>
              <span className="bar-range-label">표준</span>
              <span className="bar-range-label">표준이상</span>
            </div>
            <div className="bar-item">
              <span className="bar-label">오른팔</span>
              <div className="bar-chart-container">
                <div className="bar-container">
                  <div className="bar-fill" style={{ width: "58%" }}></div>
                  <span className="bar-value">2.79</span>
                </div>
              </div>
              <span className="bar-status">표준</span>
            </div>
            <div className="bar-item">
              <span className="bar-label">왼팔</span>
              <div className="bar-chart-container">
                <div className="bar-container">
                  <div className="bar-fill" style={{ width: "66%" }}></div>
                  <span className="bar-value">2.69</span>
                </div>
              </div>
              <span className="bar-status">표준</span>
            </div>
            <div className="bar-item">
              <span className="bar-label">몸통</span>
              <div className="bar-chart-container">
                <div className="bar-container">
                  <div className="bar-fill" style={{ width: "22%" }}></div>
                  <span className="bar-value">22.7</span>
                </div>
              </div>
              <span className="bar-status">표준</span>
            </div>
            <div className="bar-item">
              <span className="bar-label">오른다리</span>
              <div className="bar-chart-container">
                <div className="bar-container">
                  <div className="bar-fill" style={{ width: "55%" }}></div>
                  <span className="bar-value">8.27</span>
                </div>
              </div>
              <span className="bar-status">표준</span>
            </div>
            <div className="bar-item">
              <span className="bar-label">왼다리</span>
              <div className="bar-chart-container">
                <div className="bar-container">
                  <div className="bar-fill" style={{ width: "59%" }}></div>
                  <span className="bar-value">8.15</span>
                </div>
              </div>
              <span className="bar-status">표준</span>
            </div>
          </div>
        </div>
      </div>
    </div>
  );
}
