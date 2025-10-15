import { useEffect } from "react";
import { useNavigate } from "react-router-dom";
import "./Splash.css";

export default function Splash() {
  const nav = useNavigate();

  useEffect(() => {
    const t = setTimeout(() => nav("/login", { replace: true }), 3000);
    return () => clearTimeout(t);
  }, [nav]);

  return (
    <div className="splash-container">
      <div className="splash-wrapper">
        <div className="splash-content">
          <h1 className="splash-logo">INTEL FIT</h1>
          <div className="loading-dots">
            <span></span>
            <span></span>
            <span></span>
          </div>
        </div>
      </div>
    </div>
  );
}
