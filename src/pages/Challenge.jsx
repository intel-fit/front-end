import { useState } from "react";
import { useNavigate } from "react-router-dom";
import "./Challenge.css";

const Challenge = () => {
  const [activeTab, setActiveTab] = useState("챌린지");
  const navigate = useNavigate();

  const challenges = [
    {
      id: 1,
      image: "🏃",
      tag: "#하체",
      title: "매일 1시간 걷기",
      difficulty: "초급",
    },
    {
      id: 2,
      image: "🏋️",
      tag: "#상체",
      title: "계단 오르기",
      difficulty: "중급",
    },
    {
      id: 3,
      image: "🤸",
      tag: "#하체강화",
      title: "5km 러닝하기",
      difficulty: "초급",
    },
    {
      id: 4,
      image: "💪",
      tag: "#근력운동",
      title: "스쿼트 50개",
      difficulty: "중급",
    },
    {
      id: 5,
      image: "🚴",
      tag: "#유산소",
      title: "자전거 타기",
      difficulty: "초급",
    },
  ];

  const exerciseChallenges = [
    {
      id: 1,
      title: "유산소",
      image: "🏃",
    },
    {
      id: 2,
      title: "근력",
      image: "💪",
    },
  ];

  return (
    <div className="challenge-page">
      <div className="top-menu">소셜</div>

      <div className="tab-menu">
        <button
          className={activeTab === "커뮤니티" ? "active" : ""}
          onClick={() => {
            setActiveTab("커뮤니티");
            navigate("/community");
          }}
        >
          커뮤니티
        </button>
        <button
          className={activeTab === "챌린지" ? "active" : ""}
          onClick={() => setActiveTab("챌린지")}
        >
          챌린지
        </button>
      </div>

      <div className="section">
        <h2 className="section-title1">인기챌린지</h2>

        <div className="top-challenges">
          {challenges.map((challenge) => (
            <div key={challenge.id} className="challenge-card">
              <div className="challenge-image">{challenge.image}</div>

              <div className="challenge-info">
                <span className="challenge-tag">{challenge.tag}</span>
                <h3 className="challenge-title">{challenge.title}</h3>
                <span className="challenge-difficulty">
                  {challenge.difficulty}
                </span>
              </div>

              <button
                className="join-btn"
                onClick={() => navigate("/joinchallenge")}
              >
                참여하기
              </button>
            </div>
          ))}
        </div>
      </div>

      <h2 className="section-title2">운동별 챌린지</h2>
      <div className="exercise-challenges">
        {exerciseChallenges.map((exercise) => (
          <div key={exercise.id} className="exercise-card">
            <h3>{exercise.title}</h3>

            <div className="exercise-image">{exercise.image}</div>
          </div>
        ))}
      </div>

      <button
        className="make-challenge"
        onClick={() => navigate("/makechallenge")}
      >
        + 챌린지 개설
      </button>
    </div>
  );
};

export default Challenge;
