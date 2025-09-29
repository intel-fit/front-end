import { useEffect } from "react";
import { useNavigate } from "react-router-dom";

export default function Splash() {
  const nav = useNavigate();

  useEffect(() => {
    const t = setTimeout(() => nav("/mypage", { replace: true }), 3000);
    return () => clearTimeout(t);
  }, [nav]);

  return (
    <div
      style={{
        flex: 1,
        display: "flex",
        alignItems: "center",
        justifyContent: "center",
        background: "#111",
        color: "#b6f36e",
        fontSize: 28,
        fontStyle: "italic",
        fontWeight: 800,
        letterSpacing: 1.5,
      }}
    >
      INTEL FIT
    </div>
  );
}
