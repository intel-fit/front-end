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
import LoginPage from "./pages/LoginPage";
import SignupPage from "./pages/SignupPage";
import FindIdPage from "./pages/FindIdPage";
import ResetPasswordPage from "./pages/ResetPasswordPage";
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
            <Route path="/login" element={<LoginPage />} />
            <Route path="/signup" element={<SignupPage />} />
            <Route path="/find-id" element={<FindIdPage />} />
            <Route path="/reset-password" element={<ResetPasswordPage />} />

            <Route element={<Layout />}>
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
