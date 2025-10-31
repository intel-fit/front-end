import React, { useState } from 'react';
import { useNavigate } from 'react-router-dom';
import styles from "./ResetPasswordPage.module.css";

const ResetPasswordPage = () => {
  const [step, setStep] = useState(1);
  const [formData, setFormData] = useState({
    email: '',
    username: '',
    currentPassword: '',
    newPassword: '',
    confirmPassword: ''
  });
  const [errors, setErrors] = useState({});
  const [isSubmitted, setIsSubmitted] = useState(false);
  const navigate = useNavigate();

  const handleChange = (e) => {
    const { name, value } = e.target;
    setFormData(prev => ({
      ...prev,
      [name]: value
    }));
    // 에러 메시지 제거
    if (errors[name]) {
      setErrors(prev => ({
        ...prev,
        [name]: ''
      }));
    }
  };

  const validateStep1 = () => {
    const newErrors = {};
    
    if (!formData.email.trim()) {
      newErrors.email = '이메일을 입력해주세요';
    } else if (!/^[^\s@]+@[^\s@]+\.[^\s@]+$/.test(formData.email)) {
      newErrors.email = '올바른 이메일 형식이 아닙니다';
    }
    
    if (!formData.username.trim()) {
      newErrors.username = '아이디를 입력해주세요';
    }
    
    setErrors(newErrors);
    return Object.keys(newErrors).length === 0;
  };

  const validateStep2 = () => {
    const newErrors = {};
    
    if (!formData.currentPassword.trim()) {
      newErrors.currentPassword = '현재 비밀번호를 입력해주세요';
    }
    
    if (!formData.newPassword.trim()) {
      newErrors.newPassword = '새 비밀번호를 입력해주세요';
    } else if (formData.newPassword.length < 8) {
      newErrors.newPassword = '비밀번호는 8자 이상이어야 합니다';
    } else if (!/(?=.*[a-zA-Z])(?=.*\d)(?=.*[!@#$%^&*])/.test(formData.newPassword)) {
      newErrors.newPassword = '숫자, 문자, 특수문자를 포함해야 합니다';
    }
    
    if (!formData.confirmPassword.trim()) {
      newErrors.confirmPassword = '새 비밀번호 확인을 입력해주세요';
    } else if (formData.newPassword !== formData.confirmPassword) {
      newErrors.confirmPassword = '비밀번호가 일치하지 않습니다';
    }
    
    setErrors(newErrors);
    return Object.keys(newErrors).length === 0;
  };

  const handleStep1Submit = (e) => {
    e.preventDefault();
    
    if (validateStep1()) {
      // 비밀번호 재설정 요청 로직
      console.log('비밀번호 재설정 요청:', formData);
      setStep(2);
    }
  };

  const handleStep2Submit = (e) => {
    e.preventDefault();
    
    if (validateStep2()) {
      // 비밀번호 재설정 로직
      console.log('비밀번호 재설정 완료:', formData);
      setIsSubmitted(true);
    }
  };

  const handleBackToLogin = () => {
    navigate('/login');
  };

  if (isSubmitted) {
    return (
      <div className={styles['reset-password-page']}>
        <div className={styles['reset-password-container']}>
          <div className={styles['logo']}>
            <h1>INTEL FIT</h1>
          </div>
          
          <div className={styles['success-message']}>
            <h2>비밀번호 재설정</h2>
            <p>비밀번호가 변경되었습니다</p>
          </div>
          
          <button onClick={handleBackToLogin} className={styles['back-btn']}>
            로그인하러 가기
          </button>
        </div>
      </div>
    );
  }

  return (
    <div className={styles['reset-password-page']}>
      <div className={styles['reset-password-container']}>
        <div className={styles['logo']}>
          <h1>INTEL FIT</h1>
        </div>
        
        <div className={styles['form-container']}>
          <h2>비밀번호 재설정</h2>
          
          {step === 1 ? (
            <form onSubmit={handleStep1Submit} className={styles['reset-form']}>
              <div className={styles['input-group']}>
                <input
                  type="email"
                  name="email"
                  placeholder="이메일을 입력해주세요"
                  value={formData.email}
                  onChange={handleChange}
                  className={errors.email ? 'error' : ''}
                />
                {errors.email && <span className={styles['error-message']}>{errors.email}</span>}
              </div>
              
              <div className={styles['input-group']}>
                <input
                  type="text"
                  name="username"
                  placeholder="아이디를 입력해주세요"
                  value={formData.username}
                  onChange={handleChange}
                  className={errors.username ? 'error' : ''}
                />
                {errors.username && <span className={styles['error-message']}>{errors.username}</span>}
              </div>
              
              <button type="submit" className={styles['submit-btn']}>
                확인
              </button>
            </form>
          ) : (
            <form onSubmit={handleStep2Submit} className={styles['reset-form']}>
              <div className={styles['input-group']}>
                <input
                  type="password"
                  name="currentPassword"
                  placeholder="현재 비밀번호"
                  value={formData.currentPassword}
                  onChange={handleChange}
                  className={errors.currentPassword ? 'error' : ''}
                />
                {errors.currentPassword && <span className={styles['error-message']}>{errors.currentPassword}</span>}
              </div>
              
              <div className={styles['input-group']}>
                <input
                  type="password"
                  name="newPassword"
                  placeholder="새 비밀번호"
                  value={formData.newPassword}
                  onChange={handleChange}
                  className={errors.newPassword ? 'error' : ''}
                />
                {errors.newPassword && <span className={styles['error-message']}>{errors.newPassword}</span>}
              </div>
              
              <div className={styles['input-group']}>
                <input
                  type="password"
                  name="confirmPassword"
                  placeholder="새 비밀번호 확인"
                  value={formData.confirmPassword}
                  onChange={handleChange}
                  className={errors.confirmPassword ? 'error' : ''}
                />
                {errors.confirmPassword && <span className={styles['error-message']}>{errors.confirmPassword}</span>}
              </div>
              
              <button type="submit" className={styles['submit-btn']}>
                확인
              </button>
            </form>
          )}
          
          <button onClick={handleBackToLogin} className={styles['cancel-btn']}>
            취소하기
          </button>
        </div>
      </div>
    </div>
  );
};

export default ResetPasswordPage;
