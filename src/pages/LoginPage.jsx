import React, { useState } from "react";
import { Link, useNavigate } from "react-router-dom";
import "./LoginPage.css";

const LoginPage = () => {
  const [formData, setFormData] = useState({
    username: "",
    password: "",
  });
  const [errors, setErrors] = useState({});
  const navigate = useNavigate();

  const handleChange = (e) => {
    const { name, value } = e.target;
    setFormData((prev) => ({
      ...prev,
      [name]: value,
    }));
    // 에러 메시지 제거
    if (errors[name]) {
      setErrors((prev) => ({
        ...prev,
        [name]: "",
      }));
    }
  };

  const validateForm = () => {
    const newErrors = {};

    if (!formData.username.trim()) {
      newErrors.username = "아이디를 입력해주세요";
    }

    if (!formData.password.trim()) {
      newErrors.password = "비밀번호를 입력해주세요";
    }

    setErrors(newErrors);
    return Object.keys(newErrors).length === 0;
  };

  const handleSubmit = (e) => {
    e.preventDefault();

    if (validateForm()) {
      // 로그인 로직 (임시)
      console.log("로그인 시도:", formData);
      // 성공 시 홈 페이지로 이동
      navigate("/home");
    }
  };

  const handleKakaoLogin = () => {
    // 카카오 로그인 로직
    console.log("카카오 로그인");
  };

  return (
    <div className="login-page">
      <div className="login-container">
        <div className="logo">
          <h1>INTEL FIT</h1>
        </div>

        <form onSubmit={handleSubmit} className="login-form">
          <div className="input-group">
            <input
              type="text"
              name="username"
              placeholder="아이디"
              value={formData.username}
              onChange={handleChange}
              className={errors.username ? "error" : ""}
            />
            {errors.username && (
              <span className="error-message">{errors.username}</span>
            )}
          </div>

          <div className="input-group">
            <input
              type="password"
              name="password"
              placeholder="비밀번호"
              value={formData.password}
              onChange={handleChange}
              className={errors.password ? "error" : ""}
            />
            {errors.password && (
              <span className="error-message">{errors.password}</span>
            )}
          </div>

          <button type="submit" className="login-btn">
            로그인
          </button>
        </form>

        <div className="login-links">
          <Link to="/find-id" className="link">
            아이디 찾기
          </Link>
          <Link to="/reset-password" className="link">
            비밀번호 재설정
          </Link>
          <Link to="/signup" className="link">
            회원가입
          </Link>
        </div>

        <button onClick={handleKakaoLogin} className="kakao-login-btn">
          <span>카카오로 계속하기</span>
        </button>
      </div>
    </div>
  );
};

export default LoginPage;
