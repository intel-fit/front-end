import "./App.css";
import {Routes, Route} from "react-router-dom";  
import Report from "./pages/Report";
import Community from "./pages/community";
import Recommend from "./pages/Recommend";
import Home from "./pages/Home";  

// React Router를 이용한 페이지 라우팅 설정
// 각 경로에 따라 다른 컴포넌트를 렌더링
// 1. "/" : Home페이지
// 2. "/community" : 커뮤니티 페이지
// 3. "/report" : AI 리포트 페이지
// 4. "/recommend" : AI 추천 페이지

function App() {
  return (
    <div className="screen">
      <div className="phone">
        <h1 className="logo">INTEL FIT</h1>
      </div>
    </div>
  );
}

export default App;
