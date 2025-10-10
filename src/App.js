import {
  BrowserRouter,
  Routes,
  Route,
  Navigate,
  Outlet,
} from "react-router-dom";
import Splash from "./pages/Splash";
import MyPage from "./pages/MyPage";
import Header from "./components/Header";
import BottomTab from "./components/BottomTab";
import Community from "./pages/Community";
import Write from "./pages/Write";
import "./App.css";

function Layout() {
  return (
    <div className="app">
      <Header />
      <main className="main">
        <Outlet />
      </main>
      <BottomTab />
    </div>
  );
}

export default function App() {
  return (
    <div className="app-wrapper">
      <div className="phone">
        <BrowserRouter>
          <Routes>
            <Route path="/" element={<Navigate to="/splash" replace />} />
            <Route path="/splash" element={<Splash />} />

            <Route element={<Layout />}>
              <Route index element={<Navigate to="/mypage" replace />} />
              <Route path="/mypage" element={<MyPage />} />
              <Route path="/community" element={<Community />} />
              <Route path="/write" element={<Write />} />
            </Route>
            <Route path="*" element={<Navigate to="/mypage" replace />} />
          </Routes>
        </BrowserRouter>
      </div>
    </div>
  );
}
