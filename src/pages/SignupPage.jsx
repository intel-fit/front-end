import React, { useState } from 'react';
import { useNavigate } from 'react-router-dom';
import './SignupPage.css';

const SignupPage = () => {
  const [step, setStep] = useState(1);
  const [formData, setFormData] = useState({
    username: '',
    password: '',
    confirmPassword: '',
    email: '',
    phone: '',
    name: '',
    birthYear: '',
    birthMonth: '',
    birthDay: '',
    verificationCode: ''
  });
  const [errors, setErrors] = useState({});
  const [isUsernameChecked, setIsUsernameChecked] = useState(false);
  const [isEmailVerified, setIsEmailVerified] = useState(false);
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
    
    if (!formData.username.trim()) {
      newErrors.username = '아이디를 입력해주세요';
    } else if (formData.username.length < 4) {
      newErrors.username = '아이디는 4자 이상이어야 합니다';
    }
    
    if (!formData.password.trim()) {
      newErrors.password = '비밀번호를 입력해주세요';
    } else if (formData.password.length < 8) {
      newErrors.password = '비밀번호는 8자 이상이어야 합니다';
    } else if (!/(?=.*[a-zA-Z])(?=.*\d)(?=.*[!@#$%^&*])/.test(formData.password)) {
      newErrors.password = '숫자, 문자, 특수문자를 포함해야 합니다';
    }
    
    if (!formData.confirmPassword.trim()) {
      newErrors.confirmPassword = '비밀번호 확인을 입력해주세요';
    } else if (formData.password !== formData.confirmPassword) {
      newErrors.confirmPassword = '비밀번호가 일치하지 않습니다';
    }
    
    if (!isUsernameChecked) {
      newErrors.username = '아이디 중복확인을 해주세요';
    }
    
    setErrors(newErrors);
    return Object.keys(newErrors).length === 0;
  };

  const validateStep2 = () => {
    const newErrors = {};
    
    if (!formData.email.trim()) {
      newErrors.email = '이메일을 입력해주세요';
    } else if (!/^[^\s@]+@[^\s@]+\.[^\s@]+$/.test(formData.email)) {
      newErrors.email = '올바른 이메일 형식이 아닙니다';
    }
    
    if (!formData.phone.trim()) {
      newErrors.phone = '전화번호를 입력해주세요';
    } else if (!/^[0-9]{10,11}$/.test(formData.phone.replace(/[^0-9]/g, ''))) {
      newErrors.phone = '올바른 전화번호 형식이 아닙니다';
    }
    
    if (!isEmailVerified) {
      newErrors.email = '이메일 인증을 완료해주세요';
    }
    
    setErrors(newErrors);
    return Object.keys(newErrors).length === 0;
  };

  const validateStep3 = () => {
    const newErrors = {};
    
    if (!formData.name.trim()) {
      newErrors.name = '이름을 입력해주세요';
    }
    
    if (!formData.birthYear || !formData.birthMonth || !formData.birthDay) {
      newErrors.birth = '생년월일을 모두 선택해주세요';
    }
    
    setErrors(newErrors);
    return Object.keys(newErrors).length === 0;
  };

  const handleUsernameCheck = () => {
    if (!formData.username.trim()) {
      setErrors(prev => ({ ...prev, username: '아이디를 입력해주세요' }));
      return;
    }
    
    // 임시 중복 확인 로직
    console.log('아이디 중복 확인:', formData.username);
    setIsUsernameChecked(true);
    setErrors(prev => ({ ...prev, username: '' }));
  };

  const handleEmailVerification = () => {
    if (!formData.email.trim()) {
      setErrors(prev => ({ ...prev, email: '이메일을 입력해주세요' }));
      return;
    }
    
    // 임시 이메일 인증 로직
    console.log('이메일 인증:', formData.email);
    setIsEmailVerified(true);
    setErrors(prev => ({ ...prev, email: '' }));
  };

  const handleNext = () => {
    if (step === 1 && validateStep1()) {
      setStep(2);
    } else if (step === 2 && validateStep2()) {
      setStep(3);
    }
  };

  const handleSubmit = (e) => {
    e.preventDefault();
    
    if (validateStep3()) {
      // 회원가입 로직
      console.log('회원가입 완료:', formData);
      navigate('/login');
    }
  };

  const handleCancel = () => {
    navigate('/login');
  };

  const generateYearOptions = () => {
    const currentYear = new Date().getFullYear();
    const years = [];
    for (let year = currentYear - 100; year <= currentYear - 14; year++) {
      years.push(year);
    }
    return years.reverse();
  };

  const generateMonthOptions = () => {
    return Array.from({ length: 12 }, (_, i) => i + 1);
  };

  const generateDayOptions = () => {
    const daysInMonth = new Date(formData.birthYear, formData.birthMonth, 0).getDate();
    return Array.from({ length: daysInMonth }, (_, i) => i + 1);
  };

  return (
    <div className="signup-page">
      <div className="signup-container">
        <div className="logo">
          <h1>INTEL FIT</h1>
        </div>
        
        <div className="step-indicator">
          <div className={`step ${step >= 1 ? 'active' : ''}`}>1</div>
          <div className={`step ${step >= 2 ? 'active' : ''}`}>2</div>
          <div className={`step ${step >= 3 ? 'active' : ''}`}>3</div>
        </div>

        <form onSubmit={handleSubmit} className="signup-form">
          {step === 1 && (
            <div className="step-content">
              <h2>회원가입을 위해 정보를 입력해주세요</h2>
              
              <div className="input-group">
                <div className="input-with-button">
                  <input
                    type="text"
                    name="username"
                    placeholder="아이디"
                    value={formData.username}
                    onChange={handleChange}
                    className={errors.username ? 'error' : ''}
                  />
                  <button type="button" onClick={handleUsernameCheck} className="check-btn">
                    중복확인
                  </button>
                </div>
                {errors.username && <span className="error-message">{errors.username}</span>}
              </div>
              
              <div className="input-group">
                <input
                  type="password"
                  name="password"
                  placeholder="비밀번호 (숫자,문자,특수문자 포함 8자 이상)"
                  value={formData.password}
                  onChange={handleChange}
                  className={errors.password ? 'error' : ''}
                />
                {errors.password && <span className="error-message">{errors.password}</span>}
              </div>
              
              <div className="input-group">
                <input
                  type="password"
                  name="confirmPassword"
                  placeholder="비밀번호 확인"
                  value={formData.confirmPassword}
                  onChange={handleChange}
                  className={errors.confirmPassword ? 'error' : ''}
                />
                {errors.confirmPassword && <span className="error-message">{errors.confirmPassword}</span>}
              </div>
              
              <button type="button" onClick={handleNext} className="next-btn">
                다음
              </button>
            </div>
          )}

          {step === 2 && (
            <div className="step-content">
              <h2>회원가입을 위해 정보를 입력해주세요</h2>
              
              <div className="input-group">
                <div className="input-with-button">
                  <input
                    type="email"
                    name="email"
                    placeholder="이메일을 입력해주세요"
                    value={formData.email}
                    onChange={handleChange}
                    className={errors.email ? 'error' : ''}
                  />
                  <button type="button" onClick={handleEmailVerification} className="check-btn">
                    본인인증
                  </button>
                </div>
                {errors.email && <span className="error-message">{errors.email}</span>}
              </div>
              
              <div className="input-group">
                <input
                  type="tel"
                  name="phone"
                  placeholder="전화번호 ( -없이 번호 입력)"
                  value={formData.phone}
                  onChange={handleChange}
                  className={errors.phone ? 'error' : ''}
                />
                {errors.phone && <span className="error-message">{errors.phone}</span>}
              </div>
              
              <button type="button" onClick={handleNext} className="next-btn">
                다음
              </button>
            </div>
          )}

          {step === 3 && (
            <div className="step-content">
              <h2>추가 정보를 입력해주세요</h2>
              
              <div className="input-group">
                <input
                  type="text"
                  name="name"
                  placeholder="이름"
                  value={formData.name}
                  onChange={handleChange}
                  className={errors.name ? 'error' : ''}
                />
                {errors.name && <span className="error-message">{errors.name}</span>}
              </div>
              
              <div className="birth-group">
                <select
                  name="birthYear"
                  value={formData.birthYear}
                  onChange={handleChange}
                  className="birth-select"
                >
                  <option value="">년</option>
                  {generateYearOptions().map(year => (
                    <option key={year} value={year}>{year}</option>
                  ))}
                </select>
                
                <select
                  name="birthMonth"
                  value={formData.birthMonth}
                  onChange={handleChange}
                  className="birth-select"
                >
                  <option value="">월</option>
                  {generateMonthOptions().map(month => (
                    <option key={month} value={month}>{month}</option>
                  ))}
                </select>
                
                <select
                  name="birthDay"
                  value={formData.birthDay}
                  onChange={handleChange}
                  className="birth-select"
                >
                  <option value="">일</option>
                  {generateDayOptions().map(day => (
                    <option key={day} value={day}>{day}</option>
                  ))}
                </select>
              </div>
              {errors.birth && <span className="error-message">{errors.birth}</span>}
              
              <button type="submit" className="submit-btn">
                확인
              </button>
            </div>
          )}
        </form>
        
        <button onClick={handleCancel} className="cancel-btn">
          취소하기
        </button>
      </div>
    </div>
  );
};

export default SignupPage;
