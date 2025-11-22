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
} from 'react-native';
import {Picker} from '@react-native-picker/picker';
import {authAPI} from '../../services';

const SignupScreen = ({navigation}: any) => {
  const [step, setStep] = useState(1);
  const [loading, setLoading] = useState(false);
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
    healthConcern: '', // 헬스 고민
    healthGoal: '', // 헬스 목적
    verificationCode: '',
  });
  const [errors, setErrors] = useState<any>({});
  const [isUsernameChecked, setIsUsernameChecked] = useState(false);
  const [isEmailSent, setIsEmailSent] = useState(false);
  const [agreedToTerms, setAgreedToTerms] = useState(false);
  const [agreedToPrivacy, setAgreedToPrivacy] = useState(false);
  const [pickerModalVisible, setPickerModalVisible] = useState(false);
  const [tempPickerValue, setTempPickerValue] = useState({year: '', month: '', day: ''});
  const [genderModalVisible, setGenderModalVisible] = useState(false);
  const [termsModalVisible, setTermsModalVisible] = useState(false);
  const [privacyModalVisible, setPrivacyModalVisible] = useState(false);
  const [showCompleteScreen, setShowCompleteScreen] = useState(false);

  const handleChange = (name: string, value: string) => {
    setFormData(prev => ({...prev, [name]: value}));
    if (errors[name]) {
      setErrors((prev: any) => ({...prev, [name]: ''}));
    }
  };

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

  const validateStep3 = () => {
    const newErrors: any = {};

    if (!formData.healthConcern) {
      newErrors.healthConcern = '헬스 고민을 선택해주세요';
    }

    setErrors(newErrors);
    return Object.keys(newErrors).length === 0;
  };

  const validateStep4 = () => {
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

    setErrors(newErrors);
    return Object.keys(newErrors).length === 0;
  };

  const validateStep5 = () => {
    const newErrors: any = {};

    if (!formData.healthGoal) {
      newErrors.healthGoal = '헬스 목적을 선택해주세요';
    }

    setErrors(newErrors);
    return Object.keys(newErrors).length === 0;
  };

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

  const handleSubmit = async () => {
    if (!validateStep5()) {
      return;
    }

    setLoading(true);
    try {
      const birthDate = `${formData.birthYear}-${String(formData.birthMonth).padStart(2, '0')}-${String(formData.birthDay).padStart(2, '0')}`;
      
      const signupData = {
        userId: formData.username,
        name: formData.name,
        email: formData.email,
        password: formData.password,
        passwordConfirm: formData.confirmPassword,
        birthDate,
        phoneNumber: '', // 피그마 디자인에 없지만 API 필수 필드
        verificationCode: formData.verificationCode,
        gender: formData.gender as 'M' | 'F',
        height: Number(formData.height),
        weight: Number(formData.weight),
        weightGoal: Number(formData.weight), // 목표 체중은 현재 체중과 동일하게 설정
        healthConcern: formData.healthConcern,
        healthGoal: formData.healthGoal,
      };

      const response = await authAPI.signup(signupData);
      
      if (response.success) {
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
      const errorMessage = error.message || '회원가입에 실패했습니다';
      if (Platform.OS === 'web') {
        window.alert(`회원가입 실패\n${errorMessage}`);
      } else {
        Alert.alert('회원가입 실패', errorMessage);
      }
    } finally {
      setLoading(false);
    }
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
    return Array.from({length: 12}, (_, i) => i + 1);
  };

  const healthConcernOptions = [
    {label: '의지 부족', value: 'WILLPOWER'},
    {label: '근육의 자극', value: 'MUSCLE_STIMULATION'},
    {label: '루틴 짜기 어려움', value: 'ROUTINE_DIFFICULTY'},
    {label: '올바른 운동 자세', value: 'CORRECT_FORM'},
    {label: '식단 관리', value: 'DIET_MANAGEMENT'},
    {label: '기타', value: 'OTHER'},
  ];

  const healthGoalOptions = [
    {label: '벌크업', value: 'BULK'},
    {label: '다이어트', value: 'DIET'},
    {label: '린매스업', value: 'LEAN_MASS'},
    {label: '유연성 향상', value: 'FLEXIBILITY'},
    {label: '체력증진', value: 'ENDURANCE'},
    {label: '자세 교정', value: 'POSTURE'},
    {label: '기타', value: 'OTHER'},
  ];

  const renderStepIndicator = () => {
    return (
      <View style={styles.stepIndicator}>
        <View style={[styles.stepLine, step >= 1 && styles.stepLineActive]} />
        <View style={[styles.stepLine, step >= 2 && styles.stepLineActive]} />
        <View style={[styles.stepLine, step >= 3 && styles.stepLineActive]} />
        <View style={[styles.stepLine, step >= 4 && styles.stepLineActive]} />
      </View>
    );
  };

  if (showCompleteScreen) {
    return (
      <View style={styles.container}>
        <View style={styles.completeContainer}>
          <View style={styles.checkIcon}>
            <Text style={styles.checkIconText}>✓</Text>
          </View>
          <Text style={styles.completeTitle}>
            회원가입이 완료되었습니다{'\n\n'}INTELFIT과 함께 건강 관리를 시작해봐요!
          </Text>
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

          {step === 1 && (
            <View style={styles.stepContent}>
              <Text style={styles.title}>회원가입을 위해{'\n'}정보를 입력해주세요</Text>

              <View style={styles.inputGroup}>
                <View style={styles.inputWithButton}>
                  <TextInput
                    style={[styles.input, styles.inputFlex]}
                    placeholder="아이디"
                    textContentType="none"
                    autoComplete="off"
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
                  textContentType="none"
                  autoComplete="off"
                  autoCapitalize="none"
                  autoCorrect={false}
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
                  textContentType="none"
                  autoComplete="off"
                  autoCapitalize="none"
                  autoCorrect={false}
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
                    onPress={() => setPrivacyModalVisible(true)}
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
                    onPress={() => setTermsModalVisible(true)}
                    style={styles.agreementLink}>
                    <Text style={styles.agreementLinkText}>보기</Text>
                  </TouchableOpacity>
                </TouchableOpacity>
                {errors.terms && (
                  <Text style={styles.errorMessage}>{errors.terms}</Text>
                )}
              </View>

              <TouchableOpacity style={styles.nextBtn} onPress={handleNext}>
                <Text style={styles.nextBtnText}>다음</Text>
              </TouchableOpacity>

              <TouchableOpacity
                style={styles.cancelBtn}
                onPress={() => navigation.goBack()}>
                <Text style={styles.cancelBtnText}>취소하기</Text>
              </TouchableOpacity>
            </View>
          )}

          {step === 2 && (
            <View style={styles.stepContent}>
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

              <TouchableOpacity
                style={[styles.nextBtn, loading && styles.nextBtnDisabled]}
                onPress={handleNext}
                disabled={loading}>
                {loading ? (
                  <ActivityIndicator color="#ffffff" />
                ) : (
                  <Text style={styles.nextBtnText}>다음</Text>
                )}
              </TouchableOpacity>

              <TouchableOpacity
                style={styles.cancelBtn}
                onPress={() => setStep(1)}>
                <Text style={styles.cancelBtnText}>취소하기</Text>
              </TouchableOpacity>
            </View>
          )}

          {step === 3 && (
            <View style={styles.stepContent}>
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

              <TouchableOpacity style={styles.nextBtn} onPress={handleNext}>
                <Text style={styles.nextBtnText}>다음</Text>
              </TouchableOpacity>

              <TouchableOpacity
                style={styles.cancelBtn}
                onPress={() => setStep(2)}>
                <Text style={styles.cancelBtnText}>취소하기</Text>
              </TouchableOpacity>
            </View>
          )}

          {step === 4 && (
            <View style={styles.stepContent}>
              <Text style={styles.title}>신체 정보를 입력해주세요</Text>

              <View style={styles.inputGroup}>
                <TouchableOpacity
                  activeOpacity={0.8}
                  style={styles.birthDateButtonContainer}
                  onPress={() => {
                    setTempPickerValue({
                      year: formData.birthYear,
                      month: formData.birthMonth,
                      day: formData.birthDay,
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
                          onValueChange={value =>
                            setTempPickerValue({...tempPickerValue, year: value})
                          }
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
                          onValueChange={value =>
                            setTempPickerValue({...tempPickerValue, month: value})
                          }
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
                          onValueChange={value =>
                            setTempPickerValue({...tempPickerValue, day: value})
                          }
                          style={styles.modalPicker}
                          itemStyle={styles.pickerItemStyle}>
                          {(tempPickerValue.year && tempPickerValue.month
                            ? (() => {
                                const daysInMonth = new Date(
                                  Number(tempPickerValue.year),
                                  Number(tempPickerValue.month),
                                  0,
                                ).getDate();
                                return Array.from({length: daysInMonth}, (_, i) => i + 1);
                              })()
                            : Array.from({length: 31}, (_, i) => i + 1)
                          ).map(day => (
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

              <TouchableOpacity style={styles.nextBtn} onPress={handleNext}>
                <Text style={styles.nextBtnText}>다음</Text>
              </TouchableOpacity>

              <TouchableOpacity
                style={styles.cancelBtn}
                onPress={() => setStep(3)}>
                <Text style={styles.cancelBtnText}>취소하기</Text>
              </TouchableOpacity>
            </View>
          )}

          {step === 5 && (
            <View style={styles.stepContent}>
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

              <TouchableOpacity
                style={[styles.submitBtn, loading && styles.submitBtnDisabled]}
                onPress={handleSubmit}
                disabled={loading}>
                {loading ? (
                  <ActivityIndicator color="#ffffff" />
                ) : (
                  <Text style={styles.submitBtnText}>다음</Text>
                )}
              </TouchableOpacity>

              <TouchableOpacity
                style={styles.cancelBtn}
                onPress={() => setStep(4)}>
                <Text style={styles.cancelBtnText}>취소하기</Text>
              </TouchableOpacity>
            </View>
          )}

          {/* 약관 모달 */}
          <Modal
            visible={termsModalVisible}
            transparent={true}
            animationType="slide"
            onRequestClose={() => setTermsModalVisible(false)}>
            <View style={styles.termsModalContainer}>
              <View style={styles.termsModalHeader}>
                <Text style={styles.termsModalTitle}>서비스 이용 약관</Text>
                <TouchableOpacity onPress={() => setTermsModalVisible(false)}>
                  <Text style={styles.termsModalClose}>✕</Text>
                </TouchableOpacity>
              </View>
              <ScrollView style={styles.termsModalContent}>
                <Text style={styles.termsModalText}>
                  제1조(목적){'\n'}
                  이 약관은 INTELFIT (이하 '회사' 라고 합니다)가 제공하는 제반 서비스의 이용과 관련하여 회사와 회원과의 권리, 의무 및 책임사항, 기타 필요한 사항을 규정함을 목적으로 합니다.
                  {'\n\n'}
                  제2조(정의){'\n'}
                  이 약관에서 사용하는 주요 용어의 정의는 다음과 같습니다.
                  {'\n'}
                  '서비스'라 함은 구현되는 단말기(PC, TV, 휴대형단말기 등의 각종 유무선 장치를 포함)와 상관없이 '이용자'가 이용할 수 있는 회사가 제공하는 제반 서비스를 의미합니다.
                  {'\n'}
                  '이용자'란 이 약관에 따라 회사가 제공하는 서비스를 받는 '개인회원' , '기업회원' 및 '비회원'을 말합니다.
                  {'\n'}
                  '개인회원'은 회사에 개인정보를 제공하여 회원등록을 한 사람으로, 회사로부터 지속적으로 정보를 제공받고 '회사'가 제공하는 서비스를 계속적으로 이용할 수 있는 자를 말합니다.
                  {'\n'}
                  '기업회원'은 회사에 기업정보 및 개인정보를 제공하여 회원등록을 한 사람으로, 회사로부터 지속적으로 정보를 제공받고 회사가 제공하는 서비스를 계속적으로 이용할 수 있는 자를 말합니다.
                  {'\n'}
                  '비회원'은 회원가입 없이 회사가 제공하는 서비스를 이용하는 자를 말합니다.
                  {'\n'}
                  '아이디(ID)'라 함은 회원의 식별과 서비스이용을 위하여 회원이 정하고 회사가 승인하는 문자 또는 문자와 숫자의 조합을 의미합니다.
                  {'\n'}
                  '비밀번호'라 함은 회원이 부여받은 아이디와 일치되는 회원임을 확인하고 비밀의 보호를 위해 회원 자신이 정한 문자(특수문자 포함)와 숫자의 조합을 의미합니다.
                  {'\n'}
                  '유료서비스'라 함은 회사가 유료로 제공하는 제반 서비스를 의미합니다.
                  {'\n'}
                  '결제'란 회사가 제공하는 유료서비스를 이용하기 위하여 회원이 지불수단을 선택하고, 금융정보를 입력하는 행위를 말합니다.
                  {'\n\n'}
                  제3조(약관 외 준칙){'\n'}
                  이 약관에서 정하지 아니한 사항에 대해서는 법령 또는 회사가 정한 서비스의 개별약관, 운영정책 및 규칙 등(이하 세부지침)의 규정에 따릅니다. 또한 본 약관과 세부지침이 충돌할 경우에는 세부지침에 따릅니다.
                  {'\n\n'}
                  제4조(약관의 효력과 변경){'\n'}
                  이 약관은 INTELFIT(이)가 제공하는 모든 인터넷서비스에 게시하여 공시합니다. '회사'는 '전자상거래 등에서의 소비자보호에 관한 법률(이하 '전자상거래법'이라 함)', '약관의 규제에 관한 법률(이하 '약관규제법'이라 함)', '전자문서 및 전자거래 기본법(이하 '전자문서법'이라 함)', '전자금융거래법', '정보통신망 이용촉진 및 정보보호 등에 관한 법률(이하 '정보통신망법'이라 함)', '소비자기본법' 등 관계 법령(이하 '관계법령' 이라 함)에 위배되지 않는 범위 내에서 이 약관을 변경할 수 있으며, 회사는 약관이 변경되는 경우에 변경된 약관의 내용과 시행일을 정하여, 그 시행일로부터 최소 7일 (이용자에게 불리하거나 중대한 사항의 변경은 30일) 이전부터 시행일 후 상당한 기간 동안 공지하고, 기존 이용자에게는 변경된 약관, 적용일자 및 변경사유(변경될 내용 중 중요사항에 대한 설명을 포함)를 별도의 전자적 수단(전자우편, 문자메시지, 서비스 내 전자쪽지발송, 알림 메시지를 띄우는 등의 방법)으로 개별 통지합니다. 변경된 약관은 공지하거나 통지한 시행일로부터 효력이 발생합니다.
                  {'\n\n'}
                  (약관 전문은 계속됩니다. 전체 약관 내용은 서비스 내에서 확인하실 수 있습니다.)
                </Text>
              </ScrollView>
            </View>
          </Modal>

          <Modal
            visible={privacyModalVisible}
            transparent={true}
            animationType="slide"
            onRequestClose={() => setPrivacyModalVisible(false)}>
            <View style={styles.termsModalContainer}>
              <View style={styles.termsModalHeader}>
                <Text style={styles.termsModalTitle}>개인정보 처리방침</Text>
                <TouchableOpacity onPress={() => setPrivacyModalVisible(false)}>
                  <Text style={styles.termsModalClose}>✕</Text>
                </TouchableOpacity>
              </View>
              <ScrollView style={styles.termsModalContent}>
                <Text style={styles.termsModalText}>
                  본 개인정보처리방침은 INTELFIT(이하 "서비스 제공업체")가 프리미엄(Freemium) 서비스로 제작한 모바일 기기용 INTELLFIT 앱(이하 "애플리케이션")에 적용됩니다. 본 서비스는 "있는 그대로" 사용되어야 합니다.
                  {'\n\n'}
                  정보 수집 및 사용{'\n'}
                  애플리케이션은 다운로드 및 사용 시 정보를 수집합니다. 이 정보에는 다음과 같은 정보가 포함될 수 있습니다.
                  {'\n'}
                  기기의 인터넷 프로토콜 주소(예: IP 주소)
                  {'\n'}
                  방문한 애플리케이션 페이지, 방문 시간 및 날짜, 해당 페이지에서 소요된 시간
                  {'\n'}
                  애플리케이션에서 소요된 시간
                  {'\n'}
                  모바일 기기에서 사용하는 운영 체제
                  {'\n'}
                  애플리케이션은 모바일 기기의 위치에 대한 정확한 정보를 수집하지 않습니다.
                  {'\n'}
                  애플리케이션은 기기의 위치를 수집하며, 이는 서비스 제공업체가 사용자의 대략적인 지리적 위치를 파악하고 다음과 같은 방식으로 활용하는 데 도움이 됩니다.
                  {'\n'}
                  위치 정보 서비스: 서비스 제공업체는 위치 데이터를 활용하여 개인 맞춤 콘텐츠, 관련 추천, 위치 기반 서비스와 같은 기능을 제공합니다.
                  {'\n'}
                  분석 및 개선: 집계되고 익명화된 위치 데이터는 서비스 제공업체가 사용자 행동을 분석하고, 추세를 파악하며, 애플리케이션의 전반적인 성능과 기능을 개선하는 데 도움이 됩니다.
                  {'\n'}
                  제3자 서비스: 서비스 제공업체는 주기적으로 익명화된 위치 데이터를 외부 서비스에 전송할 수 있습니다. 이러한 서비스는 애플리케이션 개선 및 서비스 최적화에 도움이 됩니다.
                  {'\n\n'}
                  서비스 제공업체는 귀하가 제공한 정보를 사용하여 귀하에게 중요한 정보, 필수 공지 및 마케팅 프로모션을 제공하기 위해 수시로 귀하에게 연락할 수 있습니다.
                  {'\n'}
                  더 나은 경험을 위해, 서비스 제공업체는 애플리케이션 사용 시 이메일, 사용자 ID, 연령, 성별 등을 포함하되 이에 국한되지 않는 특정 개인 식별 정보 제공을 요청할 수 있습니다. 서비스 제공업체가 요청하는 정보는 서비스 제공업체에서 보관하며 본 개인정보 처리방침에 명시된 대로 사용됩니다.
                  {'\n\n'}
                  제3자 접근{'\n'}
                  서비스 제공업체가 애플리케이션 및 해당 서비스를 개선하는 데 도움이 되도록 집계되고 익명화된 데이터만 주기적으로 외부 서비스에 전송됩니다. 서비스 제공업체는 본 개인정보 처리방침에 명시된 방식으로 귀하의 정보를 제3자와 공유할 수 있습니다.
                  {'\n'}
                  본 애플리케이션은 데이터 처리에 대한 자체 개인정보 처리방침을 보유한 제3자 서비스를 활용합니다. 아래는 애플리케이션에서 사용하는 제3자 서비스 제공업체의 개인정보 처리방침 링크입니다.
                  {'\n'}
                  Google Play 서비스
                  {'\n'}
                  AdMob
                  {'\n'}
                  Firebase용 Google 애널리틱스
                  {'\n'}
                  Firebase Crashlytics
                  {'\n\n'}
                  서비스 제공업체는 다음과 같은 경우 사용자 제공 정보 및 자동 수집 정보를 공개할 수 있습니다.
                  {'\n'}
                  소환장 또는 유사한 법적 절차 준수 등 법률에 따라 요구되는 경우
                  {'\n'}
                  본인의 권리 보호, 본인 또는 타인의 안전 보호, 사기 조사 또는 정부 요청에 응하기 위해 정보 공개가 필요하다고 선의로 판단하는 경우;
                  {'\n'}
                  당사를 대신하여 업무를 수행하고, 당사가 공개하는 정보를 독립적으로 사용하지 않으며, 본 개인정보 처리방침에 명시된 규칙을 준수하는 데 동의한 신뢰할 수 있는 서비스 제공업체와 공유합니다.
                  {'\n\n'}
                  옵트아웃 권리{'\n'}
                  애플리케이션을 삭제하면 모든 정보 수집을 쉽게 중단할 수 있습니다. 모바일 기기에 내장된 표준 삭제 절차나 모바일 애플리케이션 마켓플레이스 또는 네트워크를 통해 제공되는 삭제 절차를 사용할 수 있습니다.
                  {'\n\n'}
                  데이터 보존 정책{'\n'}
                  서비스 제공업체는 사용자가 애플리케이션을 사용하는 동안 및 그 이후 합리적인 기간 동안 사용자 제공 데이터를 보관합니다. 애플리케이션을 통해 제공한 사용자 제공 데이터를 삭제하려면 a06246@gmail.com으로 문의하시면 합리적인 기간 내에 답변해 드리겠습니다.
                  {'\n\n'}
                  어린이{'\n'}
                  서비스 제공자는 본 애플리케이션을 이용하여 13세 미만 어린이로부터 고의로 데이터를 수집하거나 마케팅 활동을 하지 않습니다.
                  {'\n'}
                  본 애플리케이션은 13세 미만 어린이를 대상으로 하지 않습니다. 서비스 제공자는 13세 미만 어린이의 개인 식별 정보를 고의로 수집하지 않습니다. 서비스 제공자는 13세 미만 어린이가 개인 정보를 제공한 사실을 발견하는 경우, 해당 정보를 서버에서 즉시 삭제합니다. 부모 또는 보호자이시며 자녀가 당사에 개인 정보를 제공한 사실을 알고 계신 경우, 서비스 제공자(a06246@gmail.com)에게 연락하여 필요한 조치를 취하도록 하십시오.
                  {'\n\n'}
                  보안{'\n'}
                  서비스 제공자는 귀하의 정보 기밀 유지에 최선을 다하고 있습니다. 서비스 제공자는 서비스 제공자가 제공하는 정보를 보호하기 위해 물리적, 전자적, 절차적 보안 조치를 제공합니다.
                </Text>
              </ScrollView>
            </View>
          </Modal>
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
  stepContent: {
    width: '100%',
    maxWidth: 360,
    gap: 20,
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
    marginTop: 8,
  },
  nextBtnDisabled: {
    opacity: 0.6,
  },
  nextBtnText: {
    color: '#ffffff',
    fontSize: 16,
    fontWeight: '400',
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
  cancelBtn: {
    backgroundColor: 'transparent',
    marginTop: 16,
    alignItems: 'center',
  },
  cancelBtnText: {
    color: '#ffffff',
    fontSize: 12,
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
  termsModalContainer: {
    flex: 1,
    backgroundColor: '#252525',
    paddingTop: Platform.OS === 'ios' ? 50 : 20,
  },
  termsModalHeader: {
    flexDirection: 'row',
    justifyContent: 'space-between',
    alignItems: 'center',
    paddingHorizontal: 20,
    paddingVertical: 16,
    borderBottomWidth: 1,
    borderBottomColor: '#434343',
  },
  termsModalTitle: {
    color: '#ffffff',
    fontSize: 20,
    fontWeight: '700',
  },
  termsModalClose: {
    color: '#ffffff',
    fontSize: 24,
    fontWeight: '400',
  },
  termsModalContent: {
    flex: 1,
    paddingHorizontal: 20,
    paddingTop: 20,
  },
  termsModalText: {
    color: '#ffffff',
    fontSize: 10,
    fontWeight: '400',
    lineHeight: 20,
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
  completeTitle: {
    color: '#ffffff',
    fontSize: 20,
    fontWeight: '700',
    textAlign: 'center',
    marginBottom: 40,
    lineHeight: 24.2,
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
