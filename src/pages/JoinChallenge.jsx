import { useState } from "react";
import { useNavigate, useLocation } from "react-router-dom";
import "./JoinChallenge.css";

const JoinChallenge = () => {
  const navigate = useNavigate();
  const location = useLocation();

  const challenge = location.state?.challenge;
  const [isJoined, setIsJoined] = useState(false);

  if (!challenge) {
    return <div>챌린지 정보를 찾을 수 없습니다.</div>;
  }

  const handleJoin = () => {
    setIsJoined(true);
    alert("챌린지에 참여 했습니다.");
  };

  const handleLeave = () => {
    if (window.confirm("정말 참여를 해제 하시겠습니까?")) {
      setIsJoined(false);
      alert("참여가 해제되었습니다.");
    }
  };
  const handleConfirm = () => {
    navigate("/confirmchallenge");
  };

  return (
    <div className="join-challenge-page">
      <div className="challenge-header-img">
        <button className="back-button" onClick={() => navigate("/challenge")}>
          뒤로
        </button>
        <span className="challenge-emoji" s>
          {challenge.image}
        </span>
      </div>

      <div className="challenge-detail-content">
        <h1 className="challenge-detail-title">{challenge.title}</h1>
        <div className="participants">
          <span className="participant-icon">👤</span>
          <span className="participant-count">{challenge.participants}</span>
        </div>
      </div>

      <div>
        {!isJoined ? (
          <button className="join-btn" onClick={handleJoin}>
            참여하기
          </button>
        ) : (
          <>
            <button className="leave-btn" onClick={handleLeave}>
              참여해제
            </button>
            <button
              className="confirm-btn"
              onClick={() => {
                handleConfirm();
                navigate("/confirmchallenge");
              }}
            >
              인증하기
            </button>
          </>
        )}
      </div>
    </div>
  );
};

export default JoinChallenge;
