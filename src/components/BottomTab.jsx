import "./BottomTab.css";

export default function BottomTab({ active }) {
  return (
    <nav className="tabbar">
      <a className={`item ${active === "log" ? "active" : ""}`} href="#">
        🧾
      </a>
      <a className={`item ${active === "home" ? "active" : ""}`} href="#">
        🏠
      </a>
      <a
        className={`item ${active === "mypage" ? "active" : ""}`}
        href="/mypage"
      >
        👤
      </a>
    </nav>
  );
}
