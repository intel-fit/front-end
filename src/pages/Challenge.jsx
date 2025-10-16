import { useState, useEffect } from "react";
import { useNavigate, useParams } from "react-router-dom";
import "./Challenge.css";

const Challenge = () => {
  const { category } = useParams();
  const [activeTab, setActiveTab] = useState("챌린지");
  const [currentView, setCurrentView] = useState(
    category ? "category" : "main"
  );
  const [selectedCategory, setSelectedCategory] = useState(category || "");
  const [customChallenges, setCustomChallenges] = useState({});
  const navigate = useNavigate();

  const challenges = [
    {
      id: 1,
      image: "🏃",
      tag: "#하체",
      title: "매일 1시간 걷기",
      difficulty: "초급",
      participants: 1234,
      rating: 4.5,
      description: "매일 꾸준히 1시간씩 걷는 습관을 만들어보세요.",
      hasCustomImage: false,
    },
    {
      id: 2,
      image: "🏋️",
      tag: "#상체",
      title: "계단 오르기",
      difficulty: "중급",
      participants: 856,
      rating: 4.2,
      description: "엘리베이터 대신 계단을 이용해보세요.",
      hasCustomImage: false,
    },
    {
      id: 3,
      image: "🤸",
      tag: "#하체강화",
      title: "5km 러닝하기",
      difficulty: "초급",
      participants: 2341,
      rating: 4.8,
      description: "5km 러닝으로 체력을 키워보세요.",
      hasCustomImage: false,
    },
    {
      id: 4,
      image: "💪",
      tag: "#근력운동",
      title: "스쿼트 50개",
      difficulty: "중급",
      participants: 678,
      rating: 4.3,
      description: "매일 스쿼트 50개로 탄탄한 하체를 만들어보세요.",
      hasCustomImage: false,
    },
    {
      id: 5,
      image: "🚴",
      tag: "#유산소",
      title: "자전거 타기",
      difficulty: "초급",
      participants: 1567,
      rating: 4.6,
      description: "자전거로 건강도 챙기고 환경도 보호하는 일석이조!",
      hasCustomImage: false,
    },
  ];

  const exerciseChallenges = [
    { id: 1, title: "유산소", image: "🏃" },
    { id: 2, title: "근력", image: "💪" },
    { id: 3, title: "유연성", image: "🤸" },
    { id: 4, title: "균형", image: "⚖️" },
    { id: 5, title: "기타", image: "🎯" },
  ];

  // localStorage에서 커스텀 챌린지 로드
  useEffect(() => {
    const savedChallenges = localStorage.getItem("customChallenges");
    if (savedChallenges) {
      setCustomChallenges(JSON.parse(savedChallenges));
    }
  }, []);

  // URL 파라미터 변경 시 뷰 업데이트
  useEffect(() => {
    if (category) {
      // URL에 카테고리가 있으면 해당 카테고리 뷰로 이동
      setSelectedCategory(decodeURIComponent(category));
      setCurrentView("category");
    } else {
      // URL에 카테고리가 없으면 메인 뷰로 이동
      setCurrentView("main");
      setSelectedCategory("");
    }
  }, [category]);

  // 카테고리 클릭 핸들러 - URL 변경
  const handleCategoryClick = (categoryName) => {
    navigate(`/challenge/${encodeURIComponent(categoryName)}`);
  };

  // 메인으로 돌아가기 - URL 변경
  const handleBackToMain = () => {
    navigate("/challenge");
  };

  // 현재 활성화된 카테고리인지 확인
  const isActiveCategory = (categoryName) => {
    return selectedCategory === categoryName;
  };

  // 이미지 렌더링 함수
  const renderChallengeImage = (challenge) => {
    if (challenge.hasCustomImage && challenge.image.startsWith("data:image")) {
      return (
        <img
          src={challenge.image}
          alt={challenge.title}
          className="challenge-real-image"
        />
      );
    } else {
      return <span className="challenge-emoji">{challenge.image}</span>;
    }
  };

  return (
    <div className="challenge-page">
      {currentView === "main" ? (
        <>
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
                  <div className="challenge-image">
                    {renderChallengeImage(challenge)}
                  </div>
                  <div className="challenge-info">
                    <span className="challenge-tag">{challenge.tag}</span>
                    <h3 className="challenge-title">{challenge.title}</h3>
                    <span className="challenge-difficulty">
                      {challenge.difficulty}
                    </span>
                  </div>
                  <button
                    className="join-btn"
                    onClick={() =>
                      navigate("/joinchallenge", { state: { challenge } })
                    }
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
              <div
                key={exercise.id}
                className={`exercise-card ${
                  isActiveCategory(exercise.title) ? "active" : ""
                }`}
                onClick={() => handleCategoryClick(exercise.title)}
              >
                <h3>{exercise.title}</h3>
                <div className="exercise-badge">
                  {customChallenges[exercise.title]?.length || 0}
                </div>
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
        </>
      ) : (
        <div className="category-view">
          {/* 브레드크럼 네비게이션 */}
          <div className="breadcrumb">
            <button className="breadcrumb-link" onClick={handleBackToMain}>
              챌린지
            </button>
            <span className="breadcrumb-separator"> &gt; </span>
            <span className="breadcrumb-current">{selectedCategory}</span>
          </div>

          <div className="category-header">
            <button className="back-button" onClick={handleBackToMain}>
              ← 뒤로가기
            </button>
            <h2 className="category-title">{selectedCategory} 챌린지</h2>
          </div>

          {customChallenges[selectedCategory]?.length === 0 ||
          !customChallenges[selectedCategory] ? (
            <div className="no-challenges">
              <div className="empty-state">
                <div className="empty-icon">📋</div>
                <h3>아직 {selectedCategory} 챌린지가 없습니다</h3>
                <p>첫 번째 {selectedCategory} 챌린지를 만들어보세요!</p>
                <button
                  className="create-challenge-btn"
                  onClick={() => navigate("/makechallenge")}
                >
                  + 첫 번째 챌린지 만들기
                </button>
              </div>
            </div>
          ) : (
            <div className="category-challenges">
              <div className="challenges-count">
                총 {customChallenges[selectedCategory].length}개의 챌린지
              </div>
              {customChallenges[selectedCategory].map((challenge) => (
                <div
                  key={challenge.id}
                  className="challenge-card category-card"
                >
                  <div className="challenge-image">
                    {renderChallengeImage(challenge)}
                  </div>
                  <div className="challenge-info">
                    <span className="challenge-tag">#{selectedCategory}</span>
                    <h3 className="challenge-title">{challenge.title}</h3>
                    <p className="challenge-description">
                      {challenge.description}
                    </p>
                    {challenge.targetCondition && (
                      <p className="challenge-target">
                        목표: {challenge.targetCondition}
                      </p>
                    )}
                    <div className="challenge-meta">
                      <span className="challenge-date">
                        생성일: {challenge.createdAt}
                      </span>
                      <span className="challenge-participants">
                        참여자: {challenge.participants}명
                      </span>
                    </div>
                  </div>
                  <button
                    className="join-btn"
                    onClick={() =>
                      navigate("/joinchallenge", { state: { challenge } })
                    }
                  >
                    참여하기
                  </button>
                </div>
              ))}
            </div>
          )}
        </div>
      )}
    </div>
  );
};

export default Challenge;
