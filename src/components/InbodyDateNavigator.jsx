import { useState, useMemo } from "react";

export default function InbodyDateNavigator({ dates = [], onChange }) {
  const sorted = useMemo(
    () => dates.map((d) => new Date(d)).sort((a, b) => a - b),
    [dates]
  );
  const [idx, setIdx] = useState(sorted.length - 1);

  const hasPrev = idx > 0;
  const hasNext = idx < sorted.length - 1;

  const goPrev = () => {
    if (hasPrev) {
      const newIdx = idx - 1;
      setIdx(newIdx);
      onChange && onChange(sorted[newIdx]);
    }
  };

  const goNext = () => {
    if (hasNext) {
      const newIdx = idx + 1;
      setIdx(newIdx);
      onChange && onChange(sorted[newIdx]);
    }
  };

  const fmt = (d) =>
    `${d.getFullYear()}.${String(d.getMonth() + 1).padStart(2, "0")}.${String(
      d.getDate()
    ).padStart(2, "0")}`;

  const current = sorted[idx];

  return (
    <div style={styles.nav}>
      <button onClick={goPrev} disabled={!hasPrev} style={styles.btn}>
        ❮
      </button>
      <div style={styles.date}>{fmt(current)}</div>
      <button onClick={goNext} disabled={!hasNext} style={styles.btn}>
        ❯
      </button>
    </div>
  );
}

const styles = {
  nav: {
    display: "flex",
    alignItems: "center",
    justifyContent: "center",
    background: "#222",
    color: "#fff",
    fontWeight: "700",
    borderRadius: "10px",
    padding: "8px 16px",
    gap: "12px",
  },
  btn: {
    background: "transparent",
    border: "none",
    color: "#fff",
    fontSize: "20px",
    cursor: "pointer",
    opacity: 0.8,
  },
  date: {
    fontSize: "20px",
    minWidth: "140px",
    textAlign: "center",
  },
};
