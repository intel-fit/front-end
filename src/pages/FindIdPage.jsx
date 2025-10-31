import React, { useState } from 'react';
import { useNavigate } from 'react-router-dom';
import styles from "./FindIdPage.module.css";

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
      <div className={styles['find-id-page']}>
        <div className={styles['find-id-container']}>
          <div className={styles['logo']}>
            <h1>INTEL FIT</h1>
          </div>
          
          <div className={styles['success-message']}>
            <h2>아이디 찾기</h2>
            <p>회원님의 이메일로 아이디를 전송했습니다</p>
          </div>
          
          <button onClick={handleBackToLogin} className={styles['back-btn']}>
            로그인하러 가기
          </button>
        </div>
      </div>
    );
  }

  return (
    <div className={styles['find-id-page']}>
      <div className={styles['find-id-container']}>
        <div className={styles['logo']}>
          <h1>INTEL FIT</h1>
        </div>
        
        <div className={styles['form-container']}>
          <h2>아이디 찾기</h2>
          
          <form onSubmit={handleSubmit} className={styles['find-id-form']}>
            <div className={styles['input-group']}>
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
              {error && <span className={styles['error-message']}>{error}</span>}
            </div>
            
            <button type="submit" className={styles['submit-btn']}>
              확인
            </button>
          </form>
          
          <button onClick={handleBackToLogin} className={styles['cancel-btn']}>
            취소하기
          </button>
        </div>
      </div>
    </div>
  );
};

export default FindIdPage;
