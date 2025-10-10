import React, { useState } from 'react';
import { useNavigate } from 'react-router-dom';
import './FindIdPage.css';

const FindIdPage = () => {
  const [email, setEmail] = useState('');
  const [isSubmitted, setIsSubmitted] = useState(false);
  const [error, setError] = useState('');
  const navigate = useNavigate();

  const handleSubmit = (e) => {
    e.preventDefault();
    
    if (!email.trim()) {
      setError('이메일을 입력해주세요');
      return;
    }
    
    if (!/^[^\s@]+@[^\s@]+\.[^\s@]+$/.test(email)) {
      setError('올바른 이메일 형식이 아닙니다');
      return;
    }
    
    // 아이디 찾기 로직
    console.log('아이디 찾기:', email);
    setIsSubmitted(true);
    setError('');
  };

  const handleBackToLogin = () => {
    navigate('/login');
  };

  if (isSubmitted) {
    return (
      <div className="find-id-page">
        <div className="find-id-container">
          <div className="logo">
            <h1>INTEL FIT</h1>
          </div>
          
          <div className="success-message">
            <h2>아이디 찾기</h2>
            <p>회원님의 이메일로 아이디를 전송했습니다</p>
          </div>
          
          <button onClick={handleBackToLogin} className="back-btn">
            로그인하러 가기
          </button>
        </div>
      </div>
    );
  }

  return (
    <div className="find-id-page">
      <div className="find-id-container">
        <div className="logo">
          <h1>INTEL FIT</h1>
        </div>
        
        <div className="form-container">
          <h2>아이디 찾기</h2>
          
          <form onSubmit={handleSubmit} className="find-id-form">
            <div className="input-group">
              <input
                type="email"
                placeholder="이메일을 입력해주세요"
                value={email}
                onChange={(e) => {
                  setEmail(e.target.value);
                  setError('');
                }}
                className={error ? 'error' : ''}
              />
              {error && <span className="error-message">{error}</span>}
            </div>
            
            <button type="submit" className="submit-btn">
              확인
            </button>
          </form>
          
          <button onClick={handleBackToLogin} className="cancel-btn">
            취소하기
          </button>
        </div>
      </div>
    </div>
  );
};

export default FindIdPage;
