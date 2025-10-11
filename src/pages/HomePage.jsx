import Header from "../components/Header";
import "./HomePage.css";

export default function HomePage() {
  return (
    <div className="home-page">
      <Header title="홈" />
      <div className="divider"></div>
      <div className="home-content">{/* 빈 홈 페이지 */}</div>
    </div>
  );
}
