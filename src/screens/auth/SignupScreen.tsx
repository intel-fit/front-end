import React, {useState} from 'react';
import {
  View,
  Text,
  TextInput,
  TouchableOpacity,
  StyleSheet,
  KeyboardAvoidingView,
  Platform,
  ScrollView,
  Alert,
  ActivityIndicator,
  Modal,
  Linking,
} from 'react-native';
import {Picker} from '@react-native-picker/picker';
import {authAPI, mealAPI} from '../../services';

const SignupScreen = ({navigation}: any) => {
  // 회원가입 단계 관리 (1~5단계)
  const [step, setStep] = useState(1);
  const [loading, setLoading] = useState(false);
  // 회원가입 폼 데이터
  const [formData, setFormData] = useState({
    username: '',
    password: '',
    confirmPassword: '',
    email: '',
    name: '',
    birthYear: '',
    birthMonth: '',
    birthDay: '',
    gender: '' as 'M' | 'F' | '',
    height: '',
    weight: '',
    weightGoal: '', // 목표 체중
    healthConcern: '', // 헬스 고민
    healthGoal: '', // 헬스 목적
    workoutDaysPerWeek: '', // 주간 운동 횟수
    verificationCode: '',
  });
  // 폼 검증 에러 메시지
  const [errors, setErrors] = useState<any>({});
  // 아이디 중복 확인 여부
  const [isUsernameChecked, setIsUsernameChecked] = useState(false);
  // 이메일 인증코드 발송 여부
  const [isEmailSent, setIsEmailSent] = useState(false);
  // 약관 동의 여부
  const [agreedToTerms, setAgreedToTerms] = useState(false);
  const [agreedToPrivacy, setAgreedToPrivacy] = useState(false);
  // 모달 표시 여부
  const [pickerModalVisible, setPickerModalVisible] = useState(false);
  const [tempPickerValue, setTempPickerValue] = useState({year: '', month: '', day: ''});
  const [genderModalVisible, setGenderModalVisible] = useState(false);
  const [workoutDaysModalVisible, setWorkoutDaysModalVisible] = useState(false);
  // 회원가입 완료 화면 표시 여부
  const [showCompleteScreen, setShowCompleteScreen] = useState(false);

  // 폼 데이터 변경 핸들러
  const handleChange = (name: string, value: string) => {
    setFormData(prev => ({...prev, [name]: value}));
    if (errors[name]) {
      setErrors((prev: any) => ({...prev, [name]: ''}));
    }
  };

  // Step 1 완료 여부 확인 (에러 설정 없이 검증만)
  const checkStep1Complete = () => {
    if (!formData.username.trim() || formData.username.length < 4) return false;
    if (!formData.password.trim() || formData.password.length < 8) return false;
    if (!/(?=.*[a-zA-Z])(?=.*\d)(?=.*[!@#$%^&*])/.test(formData.password)) return false;
    if (!formData.confirmPassword.trim() || formData.password !== formData.confirmPassword) return false;
    if (!isUsernameChecked) return false;
    if (!agreedToTerms || !agreedToPrivacy) return false;
    return true;
  };

  // Step 1 검증 (에러 메시지 설정)
  const validateStep1 = () => {
    const newErrors: any = {};

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

    if (!agreedToTerms) {
      newErrors.terms = '서비스 이용약관에 동의해주세요';
    }

    if (!agreedToPrivacy) {
      newErrors.privacy = '개인정보 처리방침에 동의해주세요';
    }

    setErrors(newErrors);
    return Object.keys(newErrors).length === 0;
  };

  // Step 2 완료 여부 확인
  const checkStep2Complete = () => {
    if (!formData.name.trim()) return false;
    if (!formData.email.trim() || !/^[^\s@]+@[^\s@]+\.[^\s@]+$/.test(formData.email)) return false;
    if (!isEmailSent) return false;
    if (!formData.verificationCode.trim() || !/^\d{6}$/.test(formData.verificationCode)) return false;
    return true;
  };

  // Step 2 검증
  const validateStep2 = () => {
    const newErrors: any = {};

    if (!formData.name.trim()) {
      newErrors.name = '이름(닉네임)을 입력해주세요';
    }

    if (!formData.email.trim()) {
      newErrors.email = '이메일을 입력해주세요';
    } else if (!/^[^\s@]+@[^\s@]+\.[^\s@]+$/.test(formData.email)) {
      newErrors.email = '올바른 이메일 형식이 아닙니다';
    } else if (!isEmailSent) {
      newErrors.email = '본인인증 버튼을 눌러주세요';
    }

    if (!formData.verificationCode.trim()) {
      newErrors.verificationCode = '인증번호를 입력해주세요';
    } else if (!/^\d{6}$/.test(formData.verificationCode)) {
      newErrors.verificationCode = '인증번호는 6자리 숫자입니다';
    }

    setErrors(newErrors);
    return Object.keys(newErrors).length === 0;
  };

  // Step 3 완료 여부 확인 (헬스 고민 선택)
  const checkStep3Complete = () => {
    return !!formData.healthConcern;
  };

  // Step 3 검증
  const validateStep3 = () => {
    const newErrors: any = {};

    if (!formData.healthConcern) {
      newErrors.healthConcern = '헬스 고민을 선택해주세요';
    }

    setErrors(newErrors);
    return Object.keys(newErrors).length === 0;
  };

  // Step 4 완료 여부 확인 (헬스 목적 선택)
  const checkStep4Complete = () => {
    return !!formData.healthGoal;
  };

  // Step 4 검증
  const validateStep4 = () => {
    const newErrors: any = {};

    if (!formData.healthGoal) {
      newErrors.healthGoal = '헬스 목적을 선택해주세요';
    }

    setErrors(newErrors);
    return Object.keys(newErrors).length === 0;
  };

  // Step 5 완료 여부 확인 (신체 정보 입력)
  const checkStep5Complete = () => {
    if (!formData.birthYear || !formData.birthMonth || !formData.birthDay) return false;
    if (!formData.gender) return false;
    if (!formData.height.trim()) return false;
    const heightNum = Number(formData.height);
    if (heightNum < 100 || heightNum > 250) return false;
    if (!formData.weight.trim()) return false;
    const weightNum = Number(formData.weight);
    if (weightNum < 30 || weightNum > 200) return false;
    if (!formData.weightGoal.trim()) return false;
    const weightGoalNum = Number(formData.weightGoal);
    if (weightGoalNum < 30 || weightGoalNum > 200) return false;
    if (!formData.workoutDaysPerWeek) return false;
    return true;
  };

  // Step 5 검증
  const validateStep5 = () => {
    const newErrors: any = {};

    if (!formData.birthYear || !formData.birthMonth || !formData.birthDay) {
      newErrors.birth = '생년월일을 모두 선택해주세요';
    }

    if (!formData.gender) {
      newErrors.gender = '성별을 선택해주세요';
    }

    if (!formData.height.trim()) {
      newErrors.height = '키를 입력해주세요';
    } else if (Number(formData.height) < 100 || Number(formData.height) > 250) {
      newErrors.height = '키는 100-250cm 사이여야 합니다';
    }

    if (!formData.weight.trim()) {
      newErrors.weight = '체중을 입력해주세요';
    } else if (Number(formData.weight) < 30 || Number(formData.weight) > 200) {
      newErrors.weight = '체중은 30-200kg 사이여야 합니다';
    }

    if (!formData.weightGoal.trim()) {
      newErrors.weightGoal = '목표 체중을 입력해주세요';
    } else if (Number(formData.weightGoal) < 30 || Number(formData.weightGoal) > 200) {
      newErrors.weightGoal = '목표 체중은 30-200kg 사이여야 합니다';
    }

    if (!formData.workoutDaysPerWeek) {
      newErrors.workoutDaysPerWeek = '주간 운동 횟수를 선택해주세요';
    }

    setErrors(newErrors);
    return Object.keys(newErrors).length === 0;
  };

  // 아이디 중복 확인
  const handleUsernameCheck = async () => {
    if (!formData.username.trim()) {
      setErrors((prev: any) => ({...prev, username: '아이디를 입력해주세요'}));
      return;
    }

    if (!/^[a-zA-Z0-9]{4,20}$/.test(formData.username)) {
      setErrors((prev: any) => ({
        ...prev,
        username: '아이디는 4-20자의 영문자, 숫자만 사용 가능합니다',
      }));
      return;
    }

    setLoading(true);
    try {
      const response = await authAPI.checkUserId(formData.username);
      if (response.available) {
        setIsUsernameChecked(true);
        setErrors((prev: any) => ({...prev, username: ''}));
        if (Platform.OS === 'web') {
          window.alert('확인\n사용 가능한 아이디입니다');
        } else {
          Alert.alert('확인', '사용 가능한 아이디입니다');
        }
      } else {
        setErrors((prev: any) => ({
          ...prev,
          username: '이미 사용 중인 아이디입니다',
        }));
        setIsUsernameChecked(false);
      }
    } catch (error: any) {
      setErrors((prev: any) => ({
        ...prev,
        username: error.message || '아이디 중복 확인에 실패했습니다',
      }));
      setIsUsernameChecked(false);
    } finally {
      setLoading(false);
    }
  };

  // 이메일 인증코드 발송
  const handleEmailVerification = async () => {
    if (!formData.email.trim()) {
      setErrors((prev: any) => ({...prev, email: '이메일을 입력해주세요'}));
      return;
    }

    if (!/^[^\s@]+@[^\s@]+\.[^\s@]+$/.test(formData.email)) {
      setErrors((prev: any) => ({...prev, email: '올바른 이메일 형식이 아닙니다'}));
      return;
    }

    setLoading(true);
    try {
      const response = await authAPI.sendVerificationCode(formData.email);
      if (response.success) {
        setErrors((prev: any) => ({...prev, email: ''}));
        setIsEmailSent(true);
      } else {
        setErrors((prev: any) => ({
          ...prev,
          email: response.message || '인증코드 발송에 실패했습니다',
        }));
      }
    } catch (error: any) {
      const errorMessage = error.message || '인증코드 발송에 실패했습니다';
      setErrors((prev: any) => ({
        ...prev,
        email: errorMessage,
      }));
    } finally {
      setLoading(false);
    }
  };

  // 다음 단계로 이동
  const handleNext = () => {
    if (step === 1 && validateStep1()) {
      setStep(2);
    } else if (step === 2 && validateStep2()) {
      setStep(3);
    } else if (step === 3 && validateStep3()) {
      setStep(4);
    } else if (step === 4 && validateStep4()) {
      setStep(5);
    }
  };

  // 회원가입 제출
  const handleSubmit = async () => {
    if (!validateStep5()) {
      return;
    }

    setLoading(true);
    try {
      const birthDate = `${formData.birthYear}-${String(formData.birthMonth).padStart(2, '0')}-${String(formData.birthDay).padStart(2, '0')}`;
      
      // workoutDaysPerWeek를 "1일", "2일" 형식으로 변환
      const workoutDaysFormatted = formData.workoutDaysPerWeek ? `${formData.workoutDaysPerWeek}일` : '';
      
      // 벌크업, 다이어트, 린매스업, 유지만 데이터로 전송, 나머지는 요청에서 제외
      const allowedHealthGoals = ['BULK', 'DIET', 'LEAN_MASS', 'MAINTENANCE'];
      const isValidHealthGoal = allowedHealthGoals.includes(formData.healthGoal);
      
      const signupData: any = {
        userId: formData.username,
        name: formData.name,
        email: formData.email,
        password: formData.password,
        passwordConfirm: formData.confirmPassword,
        birthDate,
        verificationCode: formData.verificationCode,
        agreePrivacy: agreedToPrivacy, // 개인정보 처리방침 동의
        agreeTerms: agreedToTerms, // 서비스 이용약관 동의
        gender: formData.gender as 'M' | 'F',
        height: Number(formData.height),
        weight: Number(formData.weight),
        weightGoal: Number(formData.weightGoal),
        workoutDaysPerWeek: workoutDaysFormatted,
      };
      
      // 허용된 헬스 목적만 요청에 포함
      if (isValidHealthGoal) {
        signupData.healthGoal = formData.healthGoal;
      }

      console.log('회원가입 요청 데이터:', signupData);
      const response = await authAPI.signup(signupData);
      
      if (response.success) {
        // 기본 칼로리 목표 2000으로 설정
        try {
          const today = new Date();
          const todayStr = `${today.getFullYear()}-${String(today.getMonth() + 1).padStart(2, '0')}-${String(today.getDate()).padStart(2, '0')}`;
          await mealAPI.setNutritionGoal({
            targetCalories: 2000,
            targetCarbs: 0,
            targetProtein: 0,
            targetFat: 0,
            goalType: 'MANUAL',
            date: todayStr,
          });
          console.log('✅ 기본 칼로리 목표 2000 설정 완료');
        } catch (goalError) {
          console.error('기본 칼로리 목표 설정 실패:', goalError);
          // 칼로리 목표 설정 실패해도 회원가입은 성공으로 처리
        }
        
        setShowCompleteScreen(true);
      } else {
        const errorMessage = response.message || '회원가입에 실패했습니다';
        if (Platform.OS === 'web') {
          window.alert(`회원가입 실패\n${errorMessage}`);
        } else {
          Alert.alert('회원가입 실패', errorMessage);
        }
      }
    } catch (error: any) {
      console.error('회원가입 에러:', error);
      console.error('에러 상태:', error.status);
      console.error('에러 데이터:', error.data);
      
      let errorMessage = '회원가입에 실패했습니다';
      
      if (error.status === 500) {
        errorMessage = error.data?.message || '서버 내부 오류가 발생했습니다. 잠시 후 다시 시도해주세요.';
      } else if (error.status === 400) {
        errorMessage = error.data?.message || '입력 정보를 확인해주세요.';
      } else if (error.status === 409) {
        errorMessage = error.data?.message || '이미 사용 중인 아이디 또는 이메일입니다.';
      } else if (error.message) {
        errorMessage = error.message;
      }
      
      if (Platform.OS === 'web') {
        window.alert(`회원가입 실패\n${errorMessage}`);
      } else {
        Alert.alert('회원가입 실패', errorMessage);
      }
    } finally {
      setLoading(false);
    }
  };

  // 생년월일 선택을 위한 연도 옵션 생성
  const generateYearOptions = () => {
    const currentYear = new Date().getFullYear();
    const years = [];
    for (let year = currentYear - 100; year <= currentYear - 14; year++) {
      years.push(year);
    }
    return years.reverse();
  };

  // 월 옵션 생성
  const generateMonthOptions = () => {
    return Array.from({length: 12}, (_, i) => i + 1);
  };

  // 헬스 고민 옵션
  const healthConcernOptions = [
    {label: '의지 부족', value: 'WILLPOWER'},
    {label: '근육의 자극', value: 'MUSCLE_STIMULATION'},
    {label: '루틴 짜기 어려움', value: 'ROUTINE_DIFFICULTY'},
    {label: '올바른 운동 자세', value: 'CORRECT_FORM'},
    {label: '식단 관리', value: 'DIET_MANAGEMENT'},
    {label: '기타', value: 'OTHER'},
  ];

  // 헬스 목적 옵션
  const healthGoalOptions = [
    {label: '벌크업', value: 'BULK'},
    {label: '다이어트', value: 'DIET'},
    {label: '린매스업', value: 'LEAN_MASS'},
    {label: '유지', value: 'MAINTENANCE'},
    {label: '유연성 향상', value: 'FLEXIBILITY'},
    {label: '체력증진', value: 'ENDURANCE'},
    {label: '자세 교정', value: 'POSTURE'},
    {label: '기타', value: 'OTHER'},
  ];

  // 주간 운동 횟수 옵션
  const workoutDaysOptions = [
    {label: '주 1회', value: '1'},
    {label: '주 2회', value: '2'},
    {label: '주 3회', value: '3'},
    {label: '주 4회', value: '4'},
    {label: '주 5회', value: '5'},
    {label: '주 6회', value: '6'},
    {label: '주 7회', value: '7'},
  ];

  // 단계 인디케이터 렌더링
  const renderStepIndicator = () => {
    return (
      <View style={styles.stepIndicator}>
        <View style={[styles.stepLine, step >= 1 && styles.stepLineActive]} />
        <View style={[styles.stepLine, step >= 2 && styles.stepLineActive]} />
        <View style={[styles.stepLine, step >= 3 && styles.stepLineActive]} />
        <View style={[styles.stepLine, step >= 4 && styles.stepLineActive]} />
        <View style={[styles.stepLine, step >= 5 && styles.stepLineActive]} />
      </View>
    );
  };

  // 각 단계 완료 여부 확인 (렌더링 중 상태 변경 없이)
  const isStepComplete = (stepNum: number) => {
    if (stepNum === 1) return checkStep1Complete();
    if (stepNum === 2) return checkStep2Complete();
    if (stepNum === 3) return checkStep3Complete();
    if (stepNum === 4) return checkStep4Complete();
    if (stepNum === 5) return checkStep5Complete();
    return false;
  };

  // 회원가입 완료 화면
  if (showCompleteScreen) {
    return (
      <View style={styles.container}>
        <View style={styles.completeContainer}>
          <View style={styles.checkIcon}>
            <Text style={styles.checkIconText}>✓</Text>
          </View>
          <View style={styles.completeTitleContainer}>
            <Text style={styles.completeTitle}>
              회원가입이 완료되었습니다
            </Text>
            <Text style={styles.completeSubtitle}>
              INTELFIT과 함께 헬스 케어를 시작해봐요!
            </Text>
          </View>
          <TouchableOpacity
            style={styles.completeBtn}
            onPress={() => navigation.navigate('Login')}>
            <Text style={styles.completeBtnText}>완료</Text>
          </TouchableOpacity>
        </View>
      </View>
    );
  }

  return (
    <KeyboardAvoidingView
      style={styles.container}
      behavior={Platform.OS === 'ios' ? 'padding' : 'height'}>
      <ScrollView contentContainerStyle={styles.scrollContent}>
        <View style={styles.signupContainer}>
          <View style={styles.logoContainer}>
            <Text style={styles.logo}>INTEL FIT</Text>
          </View>

          {renderStepIndicator()}

          {/* Step 1: 아이디/비밀번호 입력 */}
          {step === 1 && (
            <View style={styles.stepContent}>
              <View style={styles.stepContentInner}>
                <Text style={styles.title}>회원가입을 위해{'\n'}정보를 입력해주세요</Text>

              <View style={styles.inputGroup}>
                <View style={styles.inputWithButton}>
                  <TextInput
                    style={[styles.input, styles.inputFlex]}
                    placeholder="아이디"
                    textContentType={Platform.OS === 'ios' ? 'oneTimeCode' : 'username'}
                    autoComplete={Platform.OS === 'ios' ? 'off' : 'username'}
                    autoCapitalize="none"
                    autoCorrect={false}
                    value={formData.username}
                    onChangeText={text => {
                      handleChange('username', text);
                      setIsUsernameChecked(false);
                    }}
                    placeholderTextColor="rgba(255, 255, 255, 0.7)"
                  />
                  <TouchableOpacity
                    style={[styles.checkBtn, loading && styles.checkBtnDisabled]}
                    onPress={handleUsernameCheck}
                    disabled={loading}>
                    {loading ? (
                      <ActivityIndicator color="#ffffff" size="small" />
                    ) : (
                      <Text style={styles.checkBtnText}>중복확인</Text>
                    )}
                  </TouchableOpacity>
                </View>
                {errors.username && (
                  <Text style={styles.errorMessage}>{errors.username}</Text>
                )}
              </View>

              <View style={styles.inputGroup}>
                <TextInput
                  style={styles.input}
                  placeholder="비밀번호 (숫자,문자,특수문자 포함 8자 이상)"
                  value={formData.password}
                  onChangeText={text => handleChange('password', text)}
                  secureTextEntry
                  textContentType={Platform.OS === 'ios' ? 'oneTimeCode' : 'password'}
                  autoComplete={Platform.OS === 'ios' ? 'off' : 'password-new'}
                  autoCapitalize="none"
                  autoCorrect={false}
                  passwordRules=""
                  placeholderTextColor="rgba(255, 255, 255, 0.7)"
                />
                {errors.password && (
                  <Text style={styles.errorMessage}>{errors.password}</Text>
                )}
              </View>

              <View style={styles.inputGroup}>
                <TextInput
                  style={styles.input}
                  placeholder="비밀번호 확인"
                  value={formData.confirmPassword}
                  onChangeText={text => handleChange('confirmPassword', text)}
                  secureTextEntry
                  textContentType={Platform.OS === 'ios' ? 'oneTimeCode' : 'password'}
                  autoComplete={Platform.OS === 'ios' ? 'off' : 'password-new'}
                  autoCapitalize="none"
                  autoCorrect={false}
                  passwordRules=""
                  placeholderTextColor="rgba(255, 255, 255, 0.7)"
                />
                {errors.confirmPassword && (
                  <Text style={styles.errorMessage}>{errors.confirmPassword}</Text>
                )}
              </View>

              <View style={styles.agreementContainer}>
                <TouchableOpacity
                  style={styles.agreementRow}
                  onPress={() => setAgreedToPrivacy(!agreedToPrivacy)}>
                  <View style={[styles.checkbox, agreedToPrivacy && styles.checkboxChecked]}>
                    {agreedToPrivacy && <Text style={styles.checkmark}>✓</Text>}
                  </View>
                  <Text style={styles.agreementText}>개인정보 처리방침</Text>
                  <TouchableOpacity
                    onPress={() => Linking.openURL('https://rigorous-drifter-031.notion.site/26ac1a180bb981bebe20ee0cd31d4f01')}
                    style={styles.agreementLink}>
                    <Text style={styles.agreementLinkText}>보기</Text>
                  </TouchableOpacity>
                </TouchableOpacity>
                {errors.privacy && (
                  <Text style={styles.errorMessage}>{errors.privacy}</Text>
                )}

                <TouchableOpacity
                  style={styles.agreementRow}
                  onPress={() => setAgreedToTerms(!agreedToTerms)}>
                  <View style={[styles.checkbox, agreedToTerms && styles.checkboxChecked]}>
                    {agreedToTerms && <Text style={styles.checkmark}>✓</Text>}
                  </View>
                  <Text style={styles.agreementText}>서비스 이용약관</Text>
                  <TouchableOpacity
                    onPress={() => Linking.openURL('https://rigorous-drifter-031.notion.site/INTELFIT-26ac1a180bb98192a438f0576a77024e')}
                    style={styles.agreementLink}>
                    <Text style={styles.agreementLinkText}>보기</Text>
                  </TouchableOpacity>
                </TouchableOpacity>
                {errors.terms && (
                  <Text style={styles.errorMessage}>{errors.terms}</Text>
                )}
              </View>
              </View>

              <View style={styles.bottomButtonContainer}>
                <TouchableOpacity
                  style={styles.backButton}
                  onPress={() => navigation.goBack()}>
                  <Text style={styles.backButtonText}>뒤로가기</Text>
                </TouchableOpacity>
                <TouchableOpacity
                  style={[
                    styles.nextBtn,
                    isStepComplete(1) && styles.nextBtnActive,
                  ]}
                  onPress={handleNext}
                  disabled={!isStepComplete(1)}>
                  <Text
                    style={[
                      styles.nextBtnText,
                      isStepComplete(1) && styles.nextBtnTextActive,
                    ]}>
                    다음
                  </Text>
                </TouchableOpacity>
              </View>
            </View>
          )}

          {/* Step 2: 이름/이메일 입력 */}
          {step === 2 && (
            <View style={styles.stepContent}>
              <View style={styles.stepContentInner}>
                <Text style={styles.title}>회원가입을 위해{'\n'}정보를 입력해주세요</Text>

              <View style={styles.inputGroup}>
                <TextInput
                  style={styles.input}
                  placeholder="이름 (닉네임)"
                  value={formData.name}
                  onChangeText={text => handleChange('name', text)}
                  placeholderTextColor="rgba(255, 255, 255, 0.7)"
                />
                {errors.name && (
                  <Text style={styles.errorMessage}>{errors.name}</Text>
                )}
              </View>

              <View style={styles.inputGroup}>
                <View style={styles.inputWithButton}>
                  <TextInput
                    style={[styles.input, styles.inputFlex]}
                    placeholder="이메일을 입력해주세요"
                    value={formData.email}
                    onChangeText={text => {
                      handleChange('email', text);
                      if (isEmailSent) {
                        setIsEmailSent(false);
                      }
                    }}
                    keyboardType="email-address"
                    autoCapitalize="none"
                    autoCorrect={false}
                    autoComplete="off"
                    textContentType="none"
                    placeholderTextColor="rgba(255, 255, 255, 0.7)"
                  />
                  <TouchableOpacity
                    style={styles.checkBtn}
                    onPress={handleEmailVerification}
                    disabled={loading}>
                    {loading ? (
                      <ActivityIndicator color="#ffffff" size="small" />
                    ) : (
                      <Text style={styles.checkBtnText}>
                        {isEmailSent ? '재전송' : '본인인증'}
                      </Text>
                    )}
                  </TouchableOpacity>
                </View>
                {errors.email && (
                  <Text style={styles.errorMessage}>{errors.email}</Text>
                )}
              </View>

              <View style={styles.inputGroup}>
                <TextInput
                  style={styles.input}
                  placeholder="인증번호"
                  value={formData.verificationCode}
                  onChangeText={text => handleChange('verificationCode', text)}
                  keyboardType="number-pad"
                  maxLength={6}
                  placeholderTextColor="rgba(255, 255, 255, 0.7)"
                />
                {errors.verificationCode && (
                  <Text style={styles.errorMessage}>{errors.verificationCode}</Text>
                )}
              </View>
              </View>

              <View style={styles.bottomButtonContainer}>
                <TouchableOpacity
                  style={styles.backButton}
                  onPress={() => setStep(1)}>
                  <Text style={styles.backButtonText}>뒤로가기</Text>
                </TouchableOpacity>
                <TouchableOpacity
                  style={[
                    styles.nextBtn,
                    isStepComplete(2) && styles.nextBtnActive,
                    loading && styles.nextBtnDisabled,
                  ]}
                  onPress={handleNext}
                  disabled={loading || !isStepComplete(2)}>
                  {loading ? (
                    <ActivityIndicator color={isStepComplete(2) ? "#000000" : "#ffffff"} />
                  ) : (
                    <Text
                      style={[
                        styles.nextBtnText,
                        isStepComplete(2) && styles.nextBtnTextActive,
                      ]}>
                      다음
                    </Text>
                  )}
                </TouchableOpacity>
              </View>
            </View>
          )}

          {/* Step 3: 헬스 고민 선택 */}
          {step === 3 && (
            <View style={styles.stepContent}>
              <View style={styles.stepContentInner}>
                <Text style={styles.title}>헬스 고민이 무엇인가요?</Text>

                <View style={styles.optionGrid}>
                {healthConcernOptions.map((option) => (
                  <TouchableOpacity
                    key={option.value}
                    style={[
                      styles.optionButton,
                      formData.healthConcern === option.value && styles.optionButtonSelected,
                    ]}
                    onPress={() => handleChange('healthConcern', option.value)}>
                    <Text
                      style={[
                        styles.optionButtonText,
                        formData.healthConcern === option.value && styles.optionButtonTextSelected,
                      ]}>
                      {option.label}
                    </Text>
                  </TouchableOpacity>
                ))}
                </View>
                {errors.healthConcern && (
                  <Text style={styles.errorMessage}>{errors.healthConcern}</Text>
                )}
              </View>

              <View style={styles.bottomButtonContainer}>
                <TouchableOpacity
                  style={styles.backButton}
                  onPress={() => setStep(2)}>
                  <Text style={styles.backButtonText}>뒤로가기</Text>
                </TouchableOpacity>
                <TouchableOpacity
                  style={[
                    styles.nextBtn,
                    isStepComplete(3) && styles.nextBtnActive,
                  ]}
                  onPress={handleNext}>
                  <Text
                    style={[
                      styles.nextBtnText,
                      isStepComplete(3) && styles.nextBtnTextActive,
                    ]}>
                    다음
                  </Text>
                </TouchableOpacity>
              </View>
            </View>
          )}

          {/* Step 4: 헬스 목적 선택 */}
          {step === 4 && (
            <View style={styles.stepContent}>
              <View style={styles.stepContentInner}>
                <Text style={styles.title}>헬스 목적이 무엇인가요?</Text>

                <View style={styles.optionGrid}>
                {healthGoalOptions.map((option) => (
                  <TouchableOpacity
                    key={option.value}
                    style={[
                      styles.optionButton,
                      formData.healthGoal === option.value && styles.optionButtonSelected,
                    ]}
                    onPress={() => handleChange('healthGoal', option.value)}>
                    <Text
                      style={[
                        styles.optionButtonText,
                        formData.healthGoal === option.value && styles.optionButtonTextSelected,
                      ]}>
                      {option.label}
                    </Text>
                  </TouchableOpacity>
                ))}
                </View>
                {errors.healthGoal && (
                  <Text style={styles.errorMessage}>{errors.healthGoal}</Text>
                )}
              </View>

              <View style={styles.bottomButtonContainer}>
                <TouchableOpacity
                  style={styles.backButton}
                  onPress={() => setStep(3)}>
                  <Text style={styles.backButtonText}>뒤로가기</Text>
                </TouchableOpacity>
                <TouchableOpacity
                  style={[
                    styles.nextBtn,
                    isStepComplete(4) && styles.nextBtnActive,
                  ]}
                  onPress={handleNext}>
                  <Text
                    style={[
                      styles.nextBtnText,
                      isStepComplete(4) && styles.nextBtnTextActive,
                    ]}>
                    다음
                  </Text>
                </TouchableOpacity>
              </View>
            </View>
          )}

          {/* Step 5: 신체 정보 입력 */}
          {step === 5 && (
            <View style={styles.stepContent}>
              <View style={styles.stepContentInner}>
                <Text style={styles.title}>신체 정보를 입력해주세요</Text>

                <View style={styles.inputGroup}>
                <TouchableOpacity
                  activeOpacity={0.8}
                  style={styles.birthDateButtonContainer}
                  onPress={() => {
                    // 기본값 설정: 선택된 값이 없으면 현재 연도 기준으로 설정
                    const currentYear = new Date().getFullYear();
                    const defaultYear = formData.birthYear || String(currentYear - 20);
                    const defaultMonth = formData.birthMonth || '1';
                    const defaultDay = formData.birthDay || '1';
                    
                    setTempPickerValue({
                      year: defaultYear,
                      month: defaultMonth,
                      day: defaultDay,
                    });
                    setPickerModalVisible(true);
                  }}>
                  <TextInput
                    style={styles.input}
                    value={
                      formData.birthYear && formData.birthMonth && formData.birthDay
                        ? `${formData.birthYear}-${String(formData.birthMonth).padStart(2, '0')}-${String(formData.birthDay).padStart(2, '0')}`
                        : ''
                    }
                    placeholder="생년월일"
                    placeholderTextColor="rgba(255, 255, 255, 0.7)"
                    editable={false}
                    pointerEvents="none"
                  />
                </TouchableOpacity>
                {errors.birth && (
                  <Text style={styles.errorMessage}>{errors.birth}</Text>
                )}
              </View>

              {/* 생년월일 선택 모달 */}
              <Modal
                visible={pickerModalVisible}
                transparent={true}
                animationType="slide"
                onRequestClose={() => setPickerModalVisible(false)}>
                <TouchableOpacity
                  style={styles.modalOverlay}
                  activeOpacity={1}
                  onPress={() => setPickerModalVisible(false)}>
                  <TouchableOpacity
                    activeOpacity={1}
                    onPress={() => {}}
                    style={styles.modalContent}>
                    <View style={styles.modalHeader}>
                      <TouchableOpacity onPress={() => setPickerModalVisible(false)}>
                        <Text style={styles.modalCancelText}>취소</Text>
                      </TouchableOpacity>
                      <Text style={styles.modalTitle}>생년월일 선택</Text>
                      <TouchableOpacity
                        onPress={() => {
                          handleChange('birthYear', tempPickerValue.year);
                          handleChange('birthMonth', tempPickerValue.month);
                          handleChange('birthDay', tempPickerValue.day);
                          setPickerModalVisible(false);
                        }}>
                        <Text style={styles.modalConfirmText}>확인</Text>
                      </TouchableOpacity>
                    </View>
                    <View style={styles.birthPickerGroup}>
                      <View style={styles.birthPickerItem}>
                        <Text style={styles.birthPickerLabelTop}>년</Text>
                        <Picker
                          selectedValue={tempPickerValue.year}
                          onValueChange={value => {
                            const newValue = {...tempPickerValue, year: value};
                            // 연도 변경 시 일(day) 유효성 검사
                            if (newValue.year && newValue.month) {
                              const daysInMonth = new Date(
                                Number(newValue.year),
                                Number(newValue.month),
                                0
                              ).getDate();
                              const currentDay = Number(newValue.day) || 1;
                              if (currentDay > daysInMonth) {
                                newValue.day = '1';
                              }
                            }
                            setTempPickerValue(newValue);
                          }}
                          style={styles.modalPicker}
                          itemStyle={styles.pickerItemStyle}>
                          {generateYearOptions().map(year => (
                            <Picker.Item key={year} label={String(year)} value={String(year)} />
                          ))}
                        </Picker>
                      </View>
                      <View style={styles.birthPickerItem}>
                        <Text style={styles.birthPickerLabelTop}>월</Text>
                        <Picker
                          selectedValue={tempPickerValue.month}
                          onValueChange={value => {
                            const newValue = {...tempPickerValue, month: value};
                            // 월 변경 시 일(day) 유효성 검사
                            if (newValue.year && newValue.month) {
                              const daysInMonth = new Date(
                                Number(newValue.year),
                                Number(newValue.month),
                                0
                              ).getDate();
                              const currentDay = Number(newValue.day) || 1;
                              if (currentDay > daysInMonth) {
                                newValue.day = '1';
                              }
                            }
                            setTempPickerValue(newValue);
                          }}
                          style={styles.modalPicker}
                          itemStyle={styles.pickerItemStyle}>
                          {generateMonthOptions().map(month => (
                            <Picker.Item
                              key={month}
                              label={String(month).padStart(2, '0')}
                              value={String(month)}
                            />
                          ))}
                        </Picker>
                      </View>
                      <View style={styles.birthPickerItem}>
                        <Text style={styles.birthPickerLabelTop}>일</Text>
                        <Picker
                          selectedValue={tempPickerValue.day}
                          onValueChange={value => {
                            setTempPickerValue({...tempPickerValue, day: value});
                          }}
                          style={styles.modalPicker}
                          itemStyle={styles.pickerItemStyle}>
                          {(() => {
                            // 연도와 월이 모두 선택되어 있으면 해당 월의 일수 계산
                            if (tempPickerValue.year && tempPickerValue.month) {
                              const year = Number(tempPickerValue.year);
                              const month = Number(tempPickerValue.month);
                              // new Date(year, month, 0)는 해당 월의 마지막 날을 반환
                              const daysInMonth = new Date(year, month, 0).getDate();
                              const days = Array.from({length: daysInMonth}, (_, i) => i + 1);
                              
                              // 선택된 day가 유효한 범위를 벗어나면 1일로 초기화
                              const currentDay = Number(tempPickerValue.day) || 1;
                              if (currentDay > daysInMonth) {
                                setTimeout(() => {
                                  setTempPickerValue({...tempPickerValue, day: '1'});
                                }, 0);
                              }
                              
                              return days;
                            }
                            // 연도나 월이 없으면 31일까지 표시
                            return Array.from({length: 31}, (_, i) => i + 1);
                          })().map(day => (
                            <Picker.Item
                              key={day}
                              label={String(day).padStart(2, '0')}
                              value={String(day)}
                            />
                          ))}
                        </Picker>
                      </View>
                    </View>
                  </TouchableOpacity>
                </TouchableOpacity>
              </Modal>

              <View style={styles.inputGroup}>
                <TouchableOpacity
                  activeOpacity={0.8}
                  style={styles.birthDateButtonContainer}
                  onPress={() => setGenderModalVisible(true)}>
                  <TextInput
                    style={styles.input}
                    value={formData.gender === 'M' ? '남성' : formData.gender === 'F' ? '여성' : ''}
                    placeholder="성별"
                    placeholderTextColor="rgba(255, 255, 255, 0.7)"
                    editable={false}
                    pointerEvents="none"
                  />
                </TouchableOpacity>
                {errors.gender && (
                  <Text style={styles.errorMessage}>{errors.gender}</Text>
                )}
              </View>

              {/* 성별 선택 모달 */}
              <Modal
                visible={genderModalVisible}
                transparent={true}
                animationType="slide"
                onRequestClose={() => setGenderModalVisible(false)}>
                <TouchableOpacity
                  style={styles.modalOverlay}
                  activeOpacity={1}
                  onPress={() => setGenderModalVisible(false)}>
                  <TouchableOpacity
                    activeOpacity={1}
                    onPress={() => {}}
                    style={styles.modalContent}>
                    <View style={styles.modalHeader}>
                      <TouchableOpacity onPress={() => setGenderModalVisible(false)}>
                        <Text style={styles.modalCancelText}>취소</Text>
                      </TouchableOpacity>
                      <Text style={styles.modalTitle}>성별 선택</Text>
                      <View style={{width: 50}} />
                    </View>
                    <View style={styles.genderOptionContainer}>
                      <TouchableOpacity
                        style={[
                          styles.genderOption,
                          formData.gender === 'M' && styles.genderOptionSelected,
                        ]}
                        onPress={() => {
                          handleChange('gender', 'M');
                          setGenderModalVisible(false);
                        }}>
                        <Text
                          style={[
                            styles.genderOptionText,
                            formData.gender === 'M' && styles.genderOptionTextSelected,
                          ]}>
                          남성
                        </Text>
                      </TouchableOpacity>
                      <TouchableOpacity
                        style={[
                          styles.genderOption,
                          formData.gender === 'F' && styles.genderOptionSelected,
                        ]}
                        onPress={() => {
                          handleChange('gender', 'F');
                          setGenderModalVisible(false);
                        }}>
                        <Text
                          style={[
                            styles.genderOptionText,
                            formData.gender === 'F' && styles.genderOptionTextSelected,
                          ]}>
                          여성
                        </Text>
                      </TouchableOpacity>
                    </View>
                  </TouchableOpacity>
                </TouchableOpacity>
              </Modal>

              <View style={styles.inputRow}>
                <View style={[styles.inputGroup, styles.inputHalf]}>
                  <TextInput
                    style={styles.input}
                    placeholder="키"
                    value={formData.height}
                    onChangeText={text => handleChange('height', text)}
                    keyboardType="number-pad"
                    placeholderTextColor="rgba(255, 255, 255, 0.7)"
                  />
                  {errors.height && (
                    <Text style={styles.errorMessage}>{errors.height}</Text>
                  )}
                </View>

                <View style={[styles.inputGroup, styles.inputHalf]}>
                  <TextInput
                    style={styles.input}
                    placeholder="체중"
                    value={formData.weight}
                    onChangeText={text => handleChange('weight', text)}
                    keyboardType="number-pad"
                    placeholderTextColor="rgba(255, 255, 255, 0.7)"
                  />
                  {errors.weight && (
                    <Text style={styles.errorMessage}>{errors.weight}</Text>
                  )}
                </View>
              </View>

              <View style={styles.inputGroup}>
                <TextInput
                  style={styles.input}
                  placeholder="목표 체중"
                  value={formData.weightGoal}
                  onChangeText={text => handleChange('weightGoal', text)}
                  keyboardType="number-pad"
                  placeholderTextColor="rgba(255, 255, 255, 0.7)"
                />
                {errors.weightGoal && (
                  <Text style={styles.errorMessage}>{errors.weightGoal}</Text>
                )}
              </View>

              <View style={styles.inputGroup}>
                <TouchableOpacity
                  activeOpacity={0.8}
                  style={styles.birthDateButtonContainer}
                  onPress={() => setWorkoutDaysModalVisible(true)}>
                  <TextInput
                    style={styles.input}
                    value={
                      formData.workoutDaysPerWeek
                        ? workoutDaysOptions.find(opt => opt.value === formData.workoutDaysPerWeek)?.label || ''
                        : ''
                    }
                    placeholder="주간 운동 횟수"
                    placeholderTextColor="rgba(255, 255, 255, 0.7)"
                    editable={false}
                    pointerEvents="none"
                  />
                </TouchableOpacity>
                {errors.workoutDaysPerWeek && (
                  <Text style={styles.errorMessage}>{errors.workoutDaysPerWeek}</Text>
                )}
              </View>

              {/* 주간 운동 횟수 선택 모달 */}
              <Modal
                visible={workoutDaysModalVisible}
                transparent={true}
                animationType="slide"
                onRequestClose={() => setWorkoutDaysModalVisible(false)}>
                <TouchableOpacity
                  style={styles.modalOverlay}
                  activeOpacity={1}
                  onPress={() => setWorkoutDaysModalVisible(false)}>
                  <TouchableOpacity
                    activeOpacity={1}
                    onPress={() => {}}
                    style={styles.modalContent}>
                    <View style={styles.modalHeader}>
                      <TouchableOpacity onPress={() => setWorkoutDaysModalVisible(false)}>
                        <Text style={styles.modalCancelText}>취소</Text>
                      </TouchableOpacity>
                      <Text style={styles.modalTitle}>주간 운동 횟수 선택</Text>
                      <View style={{width: 50}} />
                    </View>
                    <View style={styles.modalOptionContainer}>
                      <View style={styles.optionGrid}>
                        {workoutDaysOptions.map((option) => (
                          <TouchableOpacity
                            key={option.value}
                            style={[
                              styles.optionButton,
                              formData.workoutDaysPerWeek === option.value && styles.optionButtonSelected,
                            ]}
                            onPress={() => {
                              handleChange('workoutDaysPerWeek', option.value);
                              setWorkoutDaysModalVisible(false);
                            }}>
                            <Text
                              style={[
                                styles.optionButtonText,
                                formData.workoutDaysPerWeek === option.value && styles.optionButtonTextSelected,
                              ]}>
                              {option.label}
                            </Text>
                          </TouchableOpacity>
                        ))}
                      </View>
                    </View>
                  </TouchableOpacity>
                </TouchableOpacity>
              </Modal>
              </View>

              <View style={styles.bottomButtonContainer}>
                <TouchableOpacity
                  style={styles.backButton}
                  onPress={() => setStep(4)}>
                  <Text style={styles.backButtonText}>뒤로가기</Text>
                </TouchableOpacity>
                <TouchableOpacity
                  style={[
                    styles.submitBtn,
                    isStepComplete(5) && styles.nextBtnActive,
                    loading && styles.submitBtnDisabled,
                  ]}
                  onPress={handleSubmit}
                  disabled={loading || !isStepComplete(5)}>
                  {loading ? (
                    <ActivityIndicator color={isStepComplete(5) ? "#000000" : "#ffffff"} />
                  ) : (
                    <Text
                      style={[
                        styles.submitBtnText,
                        isStepComplete(5) && styles.nextBtnTextActive,
                      ]}>
                      완료
                    </Text>
                  )}
                </TouchableOpacity>
              </View>
            </View>
          )}

        </View>
      </ScrollView>
    </KeyboardAvoidingView>
  );
};

const styles = StyleSheet.create({
  container: {
    flex: 1,
    backgroundColor: '#252525',
  },
  scrollContent: {
    flexGrow: 1,
    minHeight: '100%',
  },
  signupContainer: {
    flex: 1,
    width: '100%',
    paddingTop: 80,
    paddingHorizontal: 20,
    paddingBottom: 20,
    alignItems: 'center',
    justifyContent: 'flex-start',
  },
  logoContainer: {
    marginBottom: 30,
    alignItems: 'center',
  },
  logo: {
    fontFamily: 'System',
    fontStyle: 'italic',
    fontWeight: '800',
    fontSize: 40,
    color: '#e3ff7c',
    letterSpacing: 0,
    textAlign: 'center',
    lineHeight: 48.4,
  },
  stepIndicator: {
    flexDirection: 'row',
    justifyContent: 'center',
    marginBottom: 20,
    width: 360,
    gap: 0,
  },
  stepLine: {
    flex: 1,
    height: 2,
    backgroundColor: '#ffffff',
  },
  stepLineActive: {
    backgroundColor: '#e3ff7c',
  },
  bottomButtonContainer: {
    width: '100%',
    marginTop: 'auto',
    paddingTop: 20,
    paddingBottom: 20,
    gap: 12,
  },
  backButton: {
    backgroundColor: 'transparent',
    alignItems: 'center',
    paddingVertical: 8,
  },
  backButtonText: {
    color: '#ffffff',
    fontSize: 12,
    fontWeight: '400',
  },
  stepContent: {
    width: '100%',
    maxWidth: 360,
    flex: 1,
    justifyContent: 'space-between',
  },
  stepContentInner: {
    gap: 20,
    flex: 1,
  },
  title: {
    color: '#ffffff',
    fontWeight: '700',
    fontSize: 20,
    textAlign: 'left',
    marginBottom: 20,
    lineHeight: 24.2,
  },
  inputGroup: {
    gap: 8,
  },
  label: {
    color: '#ffffff',
    fontSize: 16,
    fontWeight: '400',
    marginBottom: 8,
  },
  input: {
    width: '100%',
    height: 60,
    backgroundColor: '#434343',
    borderWidth: 0,
    borderRadius: 20,
    paddingHorizontal: 20,
    fontSize: 16,
    fontWeight: '400',
    color: '#ffffff',
    textAlign: 'left',
    textAlignVertical: 'center',
  },
  inputWithButton: {
    flexDirection: 'row',
    gap: 10,
    alignItems: 'flex-start',
  },
  inputFlex: {
    flex: 1,
  },
  inputRow: {
    flexDirection: 'row',
    gap: 10,
  },
  inputHalf: {
    flex: 1,
  },
  checkBtn: {
    width: 95,
    height: 60,
    backgroundColor: '#434343',
    borderRadius: 20,
    justifyContent: 'center',
    alignItems: 'center',
  },
  checkBtnDisabled: {
    opacity: 0.6,
  },
  checkBtnText: {
    color: '#ffffff',
    fontSize: 16,
    fontWeight: '400',
  },
  errorMessage: {
    color: '#ff6b6b',
    fontSize: 14,
    marginLeft: 5,
  },
  agreementContainer: {
    gap: 12,
    marginTop: 8,
  },
  agreementRow: {
    flexDirection: 'row',
    alignItems: 'center',
    gap: 8,
  },
  checkbox: {
    width: 18,
    height: 18,
    borderWidth: 1,
    borderColor: '#ffffff',
    borderRadius: 4,
    justifyContent: 'center',
    alignItems: 'center',
  },
  checkboxChecked: {
    backgroundColor: '#e3ff7c',
    borderColor: '#e3ff7c',
  },
  checkmark: {
    color: '#000000',
    fontSize: 12,
    fontWeight: 'bold',
  },
  agreementText: {
    color: '#ffffff',
    fontSize: 12,
    fontWeight: '400',
    flex: 1,
  },
  agreementLink: {
    marginLeft: 'auto',
  },
  agreementLinkText: {
    color: '#ffffff',
    fontSize: 12,
    fontWeight: '400',
  },
  birthDateButtonContainer: {
    width: '100%',
    height: 60,
    backgroundColor: '#434343',
    borderRadius: 20,
    overflow: 'hidden',
  },
  nextBtn: {
    width: '100%',
    height: 60,
    backgroundColor: '#434343',
    borderRadius: 20,
    alignItems: 'center',
    justifyContent: 'center',
  },
  nextBtnActive: {
    backgroundColor: '#e3ff7c',
  },
  nextBtnDisabled: {
    opacity: 0.6,
  },
  nextBtnText: {
    color: '#ffffff',
    fontSize: 16,
    fontWeight: '400',
  },
  nextBtnTextActive: {
    color: '#000000',
    fontWeight: '600',
  },
  submitBtn: {
    width: '100%',
    height: 60,
    backgroundColor: '#434343',
    borderRadius: 20,
    alignItems: 'center',
    justifyContent: 'center',
    marginTop: 8,
  },
  submitBtnDisabled: {
    opacity: 0.6,
  },
  submitBtnText: {
    color: '#ffffff',
    fontSize: 16,
    fontWeight: '400',
  },
  optionGrid: {
    flexDirection: 'row',
    flexWrap: 'wrap',
    gap: 10,
    marginBottom: 8,
  },
  optionButton: {
    width: '48%',
    height: 60,
    backgroundColor: '#434343',
    borderRadius: 20,
    alignItems: 'center',
    justifyContent: 'center',
  },
  optionButtonSelected: {
    backgroundColor: '#e3ff7c',
  },
  optionButtonText: {
    color: '#ffffff',
    fontSize: 16,
    fontWeight: '400',
  },
  optionButtonTextSelected: {
    color: '#000000',
    fontWeight: '600',
  },
  modalOverlay: {
    flex: 1,
    backgroundColor: 'rgba(0, 0, 0, 0.5)',
    justifyContent: 'flex-end',
  },
  modalContent: {
    backgroundColor: '#252525',
    borderTopLeftRadius: 20,
    borderTopRightRadius: 20,
    paddingBottom: Platform.OS === 'ios' ? 34 : 20,
    maxHeight: '60%',
    minHeight: 300,
  },
  modalHeader: {
    flexDirection: 'row',
    justifyContent: 'space-between',
    alignItems: 'center',
    paddingHorizontal: 20,
    paddingVertical: 16,
    borderBottomWidth: 1,
    borderBottomColor: '#434343',
  },
  modalTitle: {
    color: '#ffffff',
    fontSize: 18,
    fontWeight: '600',
  },
  modalCancelText: {
    color: '#999999',
    fontSize: 16,
    fontWeight: '400',
  },
  modalConfirmText: {
    color: '#e3ff7c',
    fontSize: 16,
    fontWeight: '600',
  },
  modalPicker: {
    height: 200,
    backgroundColor: '#252525',
    width: '100%',
  },
  birthPickerGroup: {
    flexDirection: 'row',
    paddingHorizontal: 20,
    paddingBottom: 20,
    paddingTop: 10,
    alignItems: 'center',
    justifyContent: 'space-around',
  },
  birthPickerItem: {
    flex: 1,
    alignItems: 'center',
    justifyContent: 'center',
  },
  birthPickerLabelTop: {
    color: '#ffffff',
    fontSize: 16,
    fontWeight: '400',
    marginBottom: 10,
  },
  pickerItemStyle: {
    color: '#ffffff',
    fontSize: 16,
    fontWeight: '400',
  },
  genderOptionContainer: {
    padding: 20,
    gap: 12,
  },
  modalOptionContainer: {
    padding: 20,
  },
  genderOption: {
    width: '100%',
    height: 56,
    backgroundColor: '#434343',
    borderRadius: 16,
    alignItems: 'center',
    justifyContent: 'center',
  },
  genderOptionSelected: {
    backgroundColor: '#e3ff7c',
  },
  genderOptionText: {
    color: '#ffffff',
    fontSize: 16,
    fontWeight: '400',
  },
  genderOptionTextSelected: {
    color: '#252525',
    fontWeight: '600',
  },
  completeContainer: {
    flex: 1,
    justifyContent: 'center',
    alignItems: 'center',
    paddingHorizontal: 20,
  },
  checkIcon: {
    width: 100,
    height: 100,
    borderRadius: 50,
    backgroundColor: '#e3ff7c',
    justifyContent: 'center',
    alignItems: 'center',
    marginBottom: 40,
  },
  checkIconText: {
    fontSize: 60,
    color: '#000000',
    fontWeight: 'bold',
  },
  completeTitleContainer: {
    alignItems: 'center',
    marginBottom: 40,
  },
  completeTitle: {
    color: '#ffffff',
    fontSize: 20,
    fontWeight: '700',
    textAlign: 'center',
    marginBottom: 12,
    lineHeight: 24.2,
  },
  completeSubtitle: {
    color: '#ffffff',
    fontSize: 14,
    fontWeight: '400',
    textAlign: 'center',
    lineHeight: 20,
  },
  completeBtn: {
    width: '100%',
    maxWidth: 360,
    height: 60,
    backgroundColor: '#e3ff7c',
    borderRadius: 20,
    alignItems: 'center',
    justifyContent: 'center',
  },
  completeBtnText: {
    color: '#000000',
    fontSize: 16,
    fontWeight: '400',
  },
});

export default SignupScreen;
