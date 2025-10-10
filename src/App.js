import {
  BrowserRouter,
  Routes,
  Route,
  Navigate,
  Outlet,
} from "react-router-dom";
import Splash from "./pages/Splash";
import MyPage from "./pages/MyPage";
import StatsPage from "./pages/StatsPage";
import GoalPage from "./pages/GoalPage";
import Nav from "./components/Nav";
import "./App.css";

function Layout() {
  return (
    <div className="app">
      <main className="main">
        <Outlet />
      </main>
      <Nav />
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
              <Route path="/stats" element={<StatsPage />} />
              <Route path="/goal" element={<GoalPage />} />
            </Route>

            <Route path="*" element={<Navigate to="/mypage" replace />} />
          </Routes>
        </BrowserRouter>
      </div>
    </div>
  );
}
