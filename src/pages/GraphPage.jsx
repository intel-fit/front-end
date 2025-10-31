import React, { useState, useEffect } from "react";
import { useNavigate } from "react-router-dom";
import styles from "./GraphPage.module.css";
import Header from "../components/Header";

export default function GraphPage() {
  const navigate = useNavigate();
  const [selectedFilter, setSelectedFilter] = useState("체중");

  const handleFilterClick = (filter) => {
    setSelectedFilter(filter);
  };

  const handleInBodyClick = () => {
    navigate("/inbody");
  };

  // 그래프 데이터
  const data = [
    { x: "04/01", y: 49.2 },
    { x: "04/06", y: 52.1 },
    { x: "04/19", y: 50.4 },
    { x: "04/25", y: 48.9 },
    { x: "05/02", y: 47.8 },
    { x: "05/04", y: 51.4 },
  ];

  useEffect(() => {
    const createChart = () => {
      const host = document.getElementById("chart-host");
      if (!host) return;

      host.innerHTML = ""; // Clear existing chart

      // Chart settings and utility functions (from provided HTML)
      const padding = { top: 20, right: 28, bottom: 26, left: 42 };
      const width = 400,
        height = 210;
      const yTicks = [54, 52, 50, 48, 46];
      const baseline = 46;
      const smoothness = 0.22;

      const minY = Math.min(baseline, ...data.map((d) => d.y));
      const maxY = Math.max(...yTicks, ...data.map((d) => d.y));
      const iw = width - padding.left - padding.right;
      const ih = height - padding.top - padding.bottom;
      const scaleX = (i) => padding.left + (iw * i) / (data.length - 1);
      const scaleY = (v) => padding.top + ih * (1 - (v - minY) / (maxY - minY));

      // 부드러운 곡선 경로 (사진처럼 스무딩)
      function pathSmooth(points, k = 0.22) {
        if (points.length < 2) return "";
        const cps = (p0, p1, p2, t) => ({
          x: p1.x + (p2.x - p0.x) * t,
          y: p1.y + (p2.y - p0.y) * t,
        });
        let d = `M ${points[0].x} ${points[0].y}`;
        for (let i = 0; i < points.length - 1; i++) {
          const p0 = points[i - 1] ?? points[i];
          const p1 = points[i];
          const p2 = points[i + 1];
          const p3 = points[i + 2] ?? p2;
          const c1 = cps(p0, p1, p2, k);
          const c2 = cps(p1, p2, p3, -k);
          d += ` C ${c1.x} ${c1.y}, ${c2.x} ${c2.y}, ${p2.x} ${p2.y}`;
        }
        return d;
      }

      // SVG rendering logic (from provided HTML)
      const svgNS = "http://www.w3.org/2000/svg";
      const svg = document.createElementNS(svgNS, "svg");
      svg.setAttribute("viewBox", `0 0 ${width} ${height}`);
      host.appendChild(svg);

      // y-axis labels
      yTicks.forEach((t) => {
        // 라벨
        const txt = document.createElementNS(svgNS, "text");
        txt.setAttribute("x", 6);
        txt.setAttribute("y", scaleY(t) + 3);
        txt.setAttribute("class", "y-label");
        txt.textContent = `${t.toFixed(1)}kg`;
        svg.appendChild(txt);

        // 54~46 전체 보조선 중 이미지처럼 마지막(46kg)만 점선 강조
        if (t === baseline) {
          const line = document.createElementNS(svgNS, "line");
          line.setAttribute("x1", padding.left);
          line.setAttribute("x2", width - padding.right);
          line.setAttribute("y1", scaleY(baseline));
          line.setAttribute("y2", scaleY(baseline));
          line.setAttribute("class", "guide");
          svg.appendChild(line);
        }
      });

      // x-axis labels
      data.forEach((d, i) => {
        const tx = document.createElementNS(svgNS, "text");
        tx.setAttribute("x", scaleX(i));
        tx.setAttribute("y", height - 6);
        tx.setAttribute("text-anchor", "middle");
        tx.setAttribute("class", "x-label");
        tx.textContent = d.x;
        svg.appendChild(tx);
      });

      // 라인 경로
      const points = data.map((d, i) => ({ x: scaleX(i), y: scaleY(d.y) }));
      const path = document.createElementNS(svgNS, "path");
      path.setAttribute("d", pathSmooth(points, smoothness));
      path.setAttribute("class", "line");
      svg.appendChild(path);

      // 포인트(원)
      const dotGroup = document.createElementNS(svgNS, "g");
      svg.appendChild(dotGroup);

      data.forEach((d, i) => {
        const c = document.createElementNS(svgNS, "circle");
        c.setAttribute("cx", scaleX(i));
        c.setAttribute("cy", scaleY(d.y));
        c.setAttribute("r", 5);
        c.setAttribute("class", "dot");
        c.dataset.idx = i;
        dotGroup.appendChild(c);
      });

      // 마지막 포인트 강조용 하이라이트(선택)
      const last = dotGroup.lastElementChild;
      last.classList.add("active-dot");

      // 호버 툴팁
      const tip = document.createElement("div");
      tip.className = "tooltip";
      host.appendChild(tip);

      function showTip(e, idx) {
        const d = data[idx];
        tip.textContent = `${d.y.toFixed(1)}kg`;
        tip.style.display = "block";
        // 화면 좌표 계산
        const pt = svg.createSVGPoint();
        pt.x = scaleX(idx);
        pt.y = scaleY(d.y);
        const scr = pt.matrixTransform(svg.getScreenCTM());
        tip.style.left = scr.x + "px";
        tip.style.top = scr.y + "px";
      }
      function hideTip() {
        tip.style.display = "none";
      }

      dotGroup.addEventListener("pointerover", (e) => {
        if (e.target.tagName !== "circle") return;
        e.target.classList.add("active-dot");
        showTip(e, +e.target.dataset.idx);
      });
      dotGroup.addEventListener("pointerout", (e) => {
        if (e.target.tagName !== "circle") return;
        if (e.target !== last) e.target.classList.remove("active-dot");
        hideTip();
      });

      // 반응형(컨테이너 폭에 맞추기) — 필요시
      const ro = new ResizeObserver(() => {
        const w = host.clientWidth || width;
        svg.style.width = w + "px";
      });
      ro.observe(host);
    };

    createChart();
  }, []); // Empty dependency array to run once on mount

  return (
    <div className={styles["graph-page"]}>
      <Header title="인바디 정보" />
      <div className={styles["graph-content"]}>
        {/* Tab Navigation */}
        <div className={styles["tab-navigation"]}>
          <div className={styles["tab"]} onClick={handleInBodyClick}>
            인바디 정보
          </div>
          <div className={`${styles.tab} ${styles.active}`}>그래프</div>
        </div>

        {/* Filter Buttons */}
        <div className={styles["filter-buttons"]}>
          <button
            className={`${styles["filter-btn"]} ${
              selectedFilter === "체중" ? styles.active : ""
            }`}
            onClick={() => handleFilterClick("체중")}
          >
            체중
          </button>
          <button
            className={`${styles["filter-btn"]} ${
              selectedFilter === "체지방량" ? styles.active : ""
            }`}
            onClick={() => handleFilterClick("체지방량")}
          >
            체지방량
          </button>
          <button
            className={`${styles["filter-btn"]} ${
              selectedFilter === "골격근량" ? styles.active : ""
            }`}
            onClick={() => handleFilterClick("골격근량")}
          >
            골격근량
          </button>
        </div>

        {/* 사용자 메시지 */}
        <div className={styles["user-message"]}>
          <span className={styles["highlight-name"]}>유정님</span>, 지난주보다
          체중이 1.2% 감소했어요!
          <br /> 목표치가 얼마 안 남았어요 👍
        </div>

        {/* 그래프 섹션 */}
        <div className={styles["graph-section"]}>
          <div className={styles["chart-container"]}>
            <p className={styles["chart-title"]}>체중 변화</p>
            <div id="chart-host" style={{ position: "relative" }}></div>
          </div>
        </div>

        {/* 체중 조절 섹션 */}
        <div className={styles["weight-control-section"]}>
          <div className={styles["weight-control-tag"]}>
            {selectedFilter === "체중" && "체중 조절"}
            {selectedFilter === "체지방량" && "지방량 조절"}
            {selectedFilter === "골격근량" && "근육량 조절"}
          </div>
          <div className={styles["weight-control-content"]}>
            <div className={styles["trainer-avatar"]}>👨‍💼</div>
            <div className={styles["weight-info"]}>
              <div className={styles["weight-text"]}>
                {selectedFilter === "체중" && "적정 체중 | 50.0kg"}
                {selectedFilter === "체지방량" && "적정 체지방량 | 12.5kg"}
                {selectedFilter === "골격근량" && "적정 근육량 | 25.0kg"}
              </div>
              <div className={styles["weight-detail"]}>
                {selectedFilter === "체중" && "-1.4kg의 체중 감량이 필요합니다"}
                {selectedFilter === "체지방량" &&
                  "-0.8kg의 체지방 감량이 필요합니다"}
                {selectedFilter === "골격근량" &&
                  "+2.1kg의 근육량 증가가 필요합니다"}
              </div>
            </div>
          </div>
        </div>
      </div>
    </div>
  );
}
