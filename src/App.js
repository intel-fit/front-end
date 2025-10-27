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
import HomePage from "./pages/HomePage";
import LoginPage from "./pages/LoginPage";
import SignupPage from "./pages/SignupPage";
import FindIdPage from "./pages/FindIdPage";
import ResetPasswordPage from "./pages/ResetPasswordPage";
import Nav from "./components/Nav";
import "./App.css";
import Challenge from "./pages/Challenge";
import JoinChallenge from "./pages/JoinChallenge";
import MakeChallenge from "./pages/MakeChallenge";
import ConfirmChallenge from "./pages/ConfirmChallenge";
import AddMealPage from "./pages/AddMealPage";
import ExerciseDetail from "./pages/ExerciseDetail";
import MealDetail from "./pages/MealDetail";
import ChatbotPage from "./pages/ChatbotPage";
import AnalysisPage from "./pages/AnalysisPage";

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
              <Route path="/home" element={<HomePage />} />
              <Route path="/mypage" element={<MyPage />} />
              <Route path="/stats" element={<StatsPage />} />
              <Route path="/goal" element={<GoalPage />} />
              <Route path="/chatbot" element={<ChatbotPage />} />
              <Route path="/analysis" element={<AnalysisPage />} />
              <Route path="/challenge" element={<Challenge />} />
              <Route path="/challenge/:category" element={<Challenge />} />
              <Route path="/joinchallenge" element={<JoinChallenge />} />
              <Route path="/makechallenge" element={<MakeChallenge />} />
              <Route path="/confirmchallenge" element={<ConfirmChallenge />} />
              <Route path="/add-meal" element={<AddMealPage />} />
              <Route path="/exercise-detail" element={<ExerciseDetail />} />
              <Route path="/meal-detail" element={<MealDetail />} />
            </Route>
            <Route path="*" element={<Navigate to="/home" replace />} />
          </Routes>
        </BrowserRouter>
      </div>
    </div>
  );
}
