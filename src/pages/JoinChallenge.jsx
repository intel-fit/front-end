import { useState } from "react";
import { useNavigate } from "react-router-dom";
import "./JoinChallenge.css";

const JoinChallenge = () => {
  const navigate = useNavigate();

  return (
    <div className="join-challenge-page">
      <h1>챌린지 참여하기</h1>
      <button onClick={() => navigate("/challenge")}>뒤로가기</button>
    </div>
  );
};

export default JoinChallenge;
