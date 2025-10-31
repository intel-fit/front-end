import React, { useMemo, useState } from "react";
import styles from "./WorkoutCalendar.module.css";

function startOfMonth(d) {
  return new Date(d.getFullYear(), d.getMonth(), 1);
}
function addMonths(d, n) {
  const nd = new Date(d);
  nd.setMonth(nd.getMonth() + n);
  return nd;
}
function formatMonthLabel(d) {
  const m = d.toLocaleString("ko-KR", { month: "long" });
  return `${m}`;
}

export default function WorkoutCalendar() {
  const [currentMonth, setCurrentMonth] = useState(() =>
    startOfMonth(new Date())
  );
  const [isExpanded, setIsExpanded] = useState(false);
  const [weekIdx, setWeekIdx] = useState(0);

  const daysGrid = useMemo(() => {
    // Build a 6-week grid for the month (Sun-Sat)
    const first = startOfMonth(currentMonth);
    const firstWeekday = first.getDay(); // 0-6
    const startDate = new Date(first);
    startDate.setDate(first.getDate() - firstWeekday);

    const cells = [];
    for (let i = 0; i < 42; i++) {
      const d = new Date(startDate);
      d.setDate(startDate.getDate() + i);
      const inMonth = d.getMonth() === currentMonth.getMonth();
      cells.push({ date: d, inMonth });
    }
    return cells;
  }, [currentMonth]);

  const weeks = useMemo(() => {
    const w = [];
    for (let i = 0; i < daysGrid.length; i += 7) {
      w.push(daysGrid.slice(i, i + 7));
    }
    return w;
  }, [daysGrid]);

  const today = useMemo(() => new Date(), []);
  const weekDays = ["일", "월", "화", "수", "목", "금", "토"];

  React.useEffect(() => {
    // 월이 바뀌면 오늘이 속한 주(같은 달이면) 또는 첫 주로 초기화
    const idx = weeks.findIndex((wk) =>
      wk.some(
        (c) =>
          c.date.getFullYear() === today.getFullYear() &&
          c.date.getMonth() === today.getMonth() &&
          c.date.getDate() === today.getDate()
      )
    );
    setWeekIdx(idx >= 0 ? idx : 0);
  }, [weeks, today]);

  const visibleWeeks = useMemo(() => {
    if (isExpanded) return weeks.slice(0, 3); // 전체 보기: 3줄만
    return [weeks[Math.max(0, Math.min(weeks.length - 1, weekIdx))]];
  }, [weeks, isExpanded, weekIdx]);

  return (
    <div className={styles["workout-calendar"]}>
      <div className={styles["wc-header"]}>
        <div className={styles["wc-left"]}>
          <button
            className={styles["wc-arrow"]}
            onClick={() => setCurrentMonth((m) => addMonths(m, -1))}
          >
            &lt;
          </button>
          <button
            className={styles["wc-month"]}
            onClick={() => setIsExpanded((v) => !v)}
            aria-label="toggle-month-expand"
          >
            {formatMonthLabel(currentMonth)}
          </button>
          <button
            className={styles["wc-arrow"]}
            onClick={() => setCurrentMonth((m) => addMonths(m, 1))}
          >
            &gt;
          </button>
        </div>
        <div className={styles["wc-spacer"]} />
        <button
          className={styles["wc-view-all"]}
          onClick={() => setIsExpanded(true)}
        >
          전체 내역 보기
        </button>
      </div>

      {isExpanded ? (
        <div className={`${styles["wc-weeks"]} ${styles["expanded"]}`}>
          <div className={styles["wc-weekdays"]}>
            {weekDays.map((w) => (
              <div key={w} className={styles["wc-weekday"]}>
                {w}
              </div>
            ))}
          </div>
          {visibleWeeks.map((week, wi) => (
            <div className={styles["wc-week"]} key={wi}>
              {week.map((cell, di) => {
                const highlight =
                  cell.date.getFullYear() === today.getFullYear() &&
                  cell.date.getMonth() === today.getMonth() &&
                  cell.date.getDate() === today.getDate();
                return (
                  <div
                    className={`${styles["wc-day"]} ${
                      styles[cell.inMonth ? "in" : "out"]
                    }`}
                    key={di}
                  >
                    <div
                      className={`${styles["wc-day-top"]} ${
                        highlight ? styles["today"] : ""
                      }`}
                    >
                      {cell.date.getDate()}
                    </div>
                    <div className={styles["wc-day-mid"]}>388k</div>
                    <div className={styles["wc-day-btm"]}>97%</div>
                  </div>
                );
              })}
            </div>
          ))}
        </div>
      ) : (
        <div className={styles["wc-week-row"]}>
          <button
            className={`${styles["wc-week-arrow"]} ${styles["left"]}`}
            onClick={() => setWeekIdx((i) => Math.max(0, i - 1))}
          >
            &lt;
          </button>
          <div className={styles["wc-week"]}>
            {visibleWeeks[0].map((cell, di) => {
              const highlight =
                cell.date.getFullYear() === today.getFullYear() &&
                cell.date.getMonth() === today.getMonth() &&
                cell.date.getDate() === today.getDate();
              return (
                <div
                  className={`${styles["wc-day"]} ${
                    styles[cell.inMonth ? "in" : "out"]
                  }`}
                  key={di}
                >
                  <div
                    className={`${styles["wc-day-top"]} ${
                      highlight ? styles["today"] : ""
                    }`}
                  >
                    {cell.date.getDate()}
                  </div>
                  <div className={styles["wc-day-mid"]}>388k</div>
                  <div className={styles["wc-day-btm"]}>97%</div>
                </div>
              );
            })}
          </div>
          <button
            className={`${styles["wc-week-arrow"]} ${styles["right"]}`}
            onClick={() => setWeekIdx((i) => Math.min(weeks.length - 1, i + 1))}
          >
            &gt;
          </button>
        </div>
      )}
    </div>
  );
}
