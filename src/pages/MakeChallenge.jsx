import { useState } from "react";
import { useNavigate } from "react-router-dom";
import "./MakeChallenge.css";

const MakeChallenge = () => {
  const navigate = useNavigate();

  return (
    <div className="make-challenge-page">
      <h1>챌린지 개설하기</h1>
      <button onClick={() => navigate("/challenge")}>뒤로가기</button>
    </div>
  );
};

export default MakeChallenge;
