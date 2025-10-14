import { useNavigate } from "react-router-dom";

const ConfirmChallenge = () => {
  const navigate = useNavigate();

  return (
    <div className="confirm-challenge">
      <h1>인증하기</h1>
      <button onClick={() => navigate("/challenge")}>뒤로가기</button>
    </div>
  );
};

export default ConfirmChallenge;
