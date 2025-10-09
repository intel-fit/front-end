import { BrowserRouter, Routes, Route, Navigate } from "react-router-dom";
import Splash from "./pages/Splash";
import MyPage from "./pages/MyPage";
import "./App.css";
import Report from "./pages/Report";
import Recommend from "./pages/Recommend";
import Community from "./pages/Community";
import Write from "./pages/Write";

export default function App() {
  return (
    <div className="app-wrapper">
      <div className="phone">
        <BrowserRouter>
          <Routes>
            <Route path="/" element={<Navigate to="/splash" replace />} />
            <Route path="/splash" element={<Splash />} />
            <Route path="/mypage" element={<MyPage />} />
            <Route path="/report" element={<Report />} />
            <Route path="/recommend" element={<Recommend />} />
            <Route path="/community" element={<Community />} />
            <Route path="/write" element={<Write />} />
          </Routes>
        </BrowserRouter>
      </div>
    </div>
  );
}
