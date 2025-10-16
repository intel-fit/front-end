import { useState, useEffect } from "react";
import { useNavigate, useLocation } from "react-router-dom";
import "./JoinChallenge.css";

const JoinChallenge = () => {
  const navigate = useNavigate();
  const location = useLocation();

  const challenge = location.state?.challenge;
  const [isJoined, setIsJoined] = useState(false);
  const [currentParticipants, setCurrentParticipants] = useState(
    challenge?.participants || 0
  );

  useEffect(() => {
    if (challenge) {
      setCurrentParticipants(challenge.participants || 0);
    }
  }, [challenge]);

  if (!challenge) {
    return (
      <div className="error-page">
        <div className="error-content">
          <h2>챌린지 정보를 찾을 수 없습니다</h2>
          <button
            onClick={() => navigate("/challenge")}
            className="back-to-main"
          >
            챌린지 목록으로 돌아가기
          </button>
        </div>
      </div>
    );
  }

  const handleJoin = () => {
    setIsJoined(true);
    setCurrentParticipants((prev) => prev + 1);

    const joinedChallenges = JSON.parse(
      localStorage.getItem("joinedChallenges") || "[]"
    );
    if (!joinedChallenges.includes(challenge.id)) {
      joinedChallenges.push(challenge.id);
      localStorage.setItem(
        "joinedChallenges",
        JSON.stringify(joinedChallenges)
      );
    }

    alert("챌린지에 참여했습니다!");
  };

  const handleLeave = () => {
    if (window.confirm("정말 참여를 해제하시겠습니까?")) {
      setIsJoined(false);
      setCurrentParticipants((prev) => Math.max(0, prev - 1));

      const joinedChallenges = JSON.parse(
        localStorage.getItem("joinedChallenges") || "[]"
      );
      const updatedChallenges = joinedChallenges.filter(
        (id) => id !== challenge.id
      );
      localStorage.setItem(
        "joinedChallenges",
        JSON.stringify(updatedChallenges)
      );

      alert("참여가 해제되었습니다.");
    }
  };

  const handleConfirm = () => {
    navigate("/confirmchallenge", {
      state: { challenge },
    });
  };

  const renderChallengeImage = () => {
    if (challenge.hasCustomImage && challenge.image.startsWith("data:image")) {
      return (
        <img
          src={challenge.image}
          alt={challenge.title}
          className="challenge-header-image"
        />
      );
    } else {
      return <span className="challenge-emoji">{challenge.image}</span>;
    }
  };

  const renderStars = (rating) => {
    if (!rating) return null;

    const stars = [];
    const fullStars = Math.floor(rating);
    const hasHalfStar = rating % 1 !== 0;

    for (let i = 0; i < fullStars; i++) {
      stars.push(
        <span key={i} className="star full">
          ★
        </span>
      );
    }
    if (hasHalfStar) {
      stars.push(
        <span key="half" className="star half">
          ★
        </span>
      );
    }
    while (stars.length < 5) {
      stars.push(
        <span key={stars.length} className="star empty">
          ★
        </span>
      );
    }
    return stars;
  };

  return (
    <div className="join-challenge-page">
      <div className="challenge-header-img">
        <button className="back-button" onClick={() => navigate(-1)}>
          ← 뒤로
        </button>
        {renderChallengeImage()}
      </div>

      <div className="challenge-detail-content">
        <div className="challenge-header-info">
          <h1 className="challenge-detail-title">{challenge.title}</h1>
          <div className="participants">
            <span className="participant-icon">👤</span>
            <span className="participant-count">{currentParticipants}</span>
          </div>
        </div>

        {(challenge.category || challenge.tag) && (
          <div className="challenge-category-info">
            <span className="category-label">카테고리</span>
            <span className="category-badge">
              {challenge.category || challenge.tag?.replace("#", "")}
            </span>
          </div>
        )}

        {challenge.difficulty && (
          <div className="difficulty-info">
            <span className="difficulty-label">난이도</span>
            <span className="difficulty-badge">{challenge.difficulty}</span>
          </div>
        )}

        {challenge.rating && (
          <div className="rating-info">
            <span className="rating-label">평점</span>
            <div className="rating-container">
              <div className="stars">{renderStars(challenge.rating)}</div>
              <span className="rating-number">{challenge.rating}</span>
            </div>
          </div>
        )}

        <div className="challenge-description-section">
          <h3 className="section-title">챌린지 설명</h3>
          <p className="challenge-description">
            {challenge.description || "이 챌린지에 대한 설명이 없습니다."}
          </p>
        </div>

        {challenge.targetCondition && (
          <div className="target-condition-section">
            <h3 className="section-title">목표 조건</h3>
            <p className="target-condition">{challenge.targetCondition}</p>
          </div>
        )}
        {challenge.createdAt && (
          <div className="created-date">
            <span className="date-label">생성일:</span>
            <span className="date-value">{challenge.createdAt}</span>
          </div>
        )}
      </div>

      <div className="action-buttons">
        {!isJoined ? (
          <button className="join-btn" onClick={handleJoin}>
            참여하기
          </button>
        ) : (
          <div className="joined-buttons">
            <button className="leave-btn" onClick={handleLeave}>
              참여해제
            </button>
            <button className="confirm-btn" onClick={handleConfirm}>
              인증하기
            </button>
          </div>
        )}
      </div>
    </div>
  );
};

export default JoinChallenge;
