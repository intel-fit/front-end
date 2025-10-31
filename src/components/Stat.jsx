import styles from "./Stat.module.css";

export default function Stat({ value, unit, percentage, date }) {
  return (
    <div className={styles['stat']}>
      <div className={styles['stat-date']}>{date}</div>
      <div className={styles['stat-value']}>{value}</div>
      <div className={styles['stat-unit']}>{unit}</div>
      <div className={styles['stat-percentage']}>{percentage}</div>
    </div>
  );
}
