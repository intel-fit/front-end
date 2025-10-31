import { useEffect } from "react";
import { useNavigate } from "react-router-dom";
import styles from "./Splash.module.css";

export default function Splash() {
  const nav = useNavigate();

  useEffect(() => {
    const t = setTimeout(() => nav("/login", { replace: true }), 3000);
    return () => clearTimeout(t);
  }, [nav]);

  return (
    <div className={styles['splash-container']}>
      <div className={styles['splash-wrapper']}>
        <div className={styles['splash-content']}>
          <h1 className={styles['splash-logo']}>INTEL FIT</h1>
          <div className={styles['loading-dots']}>
            <span></span>
            <span></span>
            <span></span>
          </div>
        </div>
      </div>
    </div>
  );
}
