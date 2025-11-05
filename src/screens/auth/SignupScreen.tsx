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
    phone: '',
    name: '',
    birthYear: '',
    birthMonth: '',
    birthDay: '',
    gender: '' as 'M' | 'F' | '',
    height: '',
    weight: '',
    weightGoal: '',
    healthGoal: '',
    workoutDaysPerWeek: '',
    verificationCode: '',
  });
  const [errors, setErrors] = useState<any>({});
  const [isUsernameChecked, setIsUsernameChecked] = useState(false);
  const [isEmailVerified, setIsEmailVerified] = useState(false);
  const [isEmailSent, setIsEmailSent] = useState(false); // 이메일 발송 여부
  const [verificationCodeStatus, setVerificationCodeStatus] = useState<'idle' | 'success' | 'error'>('idle'); // 인증코드 상태
  const [pickerModalVisible, setPickerModalVisible] = useState(false); // 생년월일 피커 모달 상태
  const [tempPickerValue, setTempPickerValue] = useState({year: '', month: '', day: ''}); // 임시 선택 값
  const [genderModalVisible, setGenderModalVisible] = useState(false); // 성별 선택 모달 상태
  const [healthGoalModalVisible, setHealthGoalModalVisible] = useState(false); // 운동 목표 선택 모달 상태

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

    setErrors(newErrors);
    return Object.keys(newErrors).length === 0;
  };

  const validateStep2 = () => {
    const newErrors: any = {};

    if (!formData.email.trim()) {
      newErrors.email = '이메일을 입력해주세요';
    } else if (!/^[^\s@]+@[^\s@]+\.[^\s@]+$/.test(formData.email)) {
      newErrors.email = '올바른 이메일 형식이 아닙니다';
    } else if (!isEmailSent) {
      newErrors.email = '본인인증 버튼을 눌러주세요';
    }

    if (!formData.phone.trim()) {
      newErrors.phone = '전화번호를 입력해주세요';
    } else if (!/^[0-9]{10,11}$/.test(formData.phone.replace(/[^0-9]/g, ''))) {
      newErrors.phone = '올바른 전화번호 형식이 아닙니다';
    }

    if (!formData.verificationCode.trim()) {
      newErrors.verificationCode = '인증코드를 입력해주세요';
    } else if (!/^\d{6}$/.test(formData.verificationCode)) {
      newErrors.verificationCode = '인증코드는 6자리 숫자입니다';
    }

    setErrors(newErrors);
    return Object.keys(newErrors).length === 0;
  };

  const validateStep3 = () => {
    const newErrors: any = {};

    if (!formData.name.trim()) {
      newErrors.name = '이름을 입력해주세요';
    }

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
      newErrors.weight = '현재 체중을 입력해주세요';
    } else if (Number(formData.weight) < 30 || Number(formData.weight) > 200) {
      newErrors.weight = '체중은 30-200kg 사이여야 합니다';
    }

    if (!formData.weightGoal.trim()) {
      newErrors.weightGoal = '목표 체중을 입력해주세요';
    } else if (Number(formData.weightGoal) < 30 || Number(formData.weightGoal) > 200) {
      newErrors.weightGoal = '목표 체중은 30-200kg 사이여야 합니다';
    }

    if (!formData.healthGoal) {
      newErrors.healthGoal = '운동 목표를 선택해주세요';
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
      console.log('이메일 인증 요청:', formData.email);
      const response = await authAPI.sendVerificationCode(formData.email);
      console.log('이메일 인증 응답:', response);
      if (response.success) {
        // 성공 시 에러 메시지 제거
        setErrors((prev: any) => ({...prev, email: ''}));
        setIsEmailVerified(true);
        setIsEmailSent(true); // 버튼 텍스트를 "재전송"으로 변경
      } else {
        setErrors((prev: any) => ({
          ...prev,
          email: response.message || '인증코드 발송에 실패했습니다',
        }));
      }
    } catch (error: any) {
      console.error('이메일 인증 에러:', error);
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
    }
  };

  const handleSubmit = async () => {
    if (!validateStep3()) {
      // 스크롤을 최상단으로 이동하여 에러 메시지가 보이도록 함
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
        phoneNumber: formData.phone.replace(/[^0-9]/g, ''),
        verificationCode: formData.verificationCode,
        gender: formData.gender as 'M' | 'F',
        height: Number(formData.height),
        weight: Number(formData.weight),
        weightGoal: Number(formData.weightGoal),
        healthGoal: formData.healthGoal,
        workoutDaysPerWeek: formData.workoutDaysPerWeek || undefined,
      };

      const response = await authAPI.signup(signupData);
      
      if (response.success) {
        if (Platform.OS === 'web') {
          window.alert('회원가입 성공\n회원가입이 완료되었습니다');
          navigation.navigate('Login');
        } else {
          Alert.alert('회원가입 성공', '회원가입이 완료되었습니다', [
            {
              text: '확인',
              onPress: () => navigation.navigate('Login'),
            },
          ]);
        }
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

  const generateDayOptions = () => {
    const daysInMonth = new Date(Number(formData.birthYear), Number(formData.birthMonth), 0).getDate();
    return Array.from({length: daysInMonth}, (_, i) => i + 1);
  };

  return (
    <KeyboardAvoidingView
      style={styles.container}
      behavior={Platform.OS === 'ios' ? 'padding' : 'height'}>
      <ScrollView contentContainerStyle={styles.scrollContent}>
        <View style={styles.signupContainer}>
          <View style={styles.logoContainer}>
            <Text style={styles.logo}>INTEL FIT</Text>
          </View>

          <View style={styles.stepIndicator}>
            <View style={[styles.stepCircle, step >= 1 && styles.stepActive]}>
              <Text style={[styles.stepText, step >= 1 && styles.stepTextActive]}>1</Text>
            </View>
            <View style={[styles.stepCircle, step >= 2 && styles.stepActive]}>
              <Text style={[styles.stepText, step >= 2 && styles.stepTextActive]}>2</Text>
            </View>
            <View style={[styles.stepCircle, step >= 3 && styles.stepActive]}>
              <Text style={[styles.stepText, step >= 3 && styles.stepTextActive]}>3</Text>
            </View>
          </View>

          {step === 1 && (
            <View style={styles.stepContent}>
              <Text style={styles.title}>회원가입을 위해 정보를 입력해주세요</Text>

              <View style={styles.inputGroup}>
                <View style={styles.inputWithButton}>
                  <TextInput
                    style={[styles.input, styles.inputFlex]}
                    placeholder="아이디"
                    value={formData.username}
                    onChangeText={text => handleChange('username', text)}
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
                  placeholderTextColor="rgba(255, 255, 255, 0.7)"
                />
                {errors.confirmPassword && (
                  <Text style={styles.errorMessage}>{errors.confirmPassword}</Text>
                )}
              </View>

              <TouchableOpacity style={styles.nextBtn} onPress={handleNext}>
                <Text style={styles.nextBtnText}>다음</Text>
              </TouchableOpacity>
            </View>
          )}

          {step === 2 && (
            <View style={styles.stepContent}>
              <Text style={styles.title}>회원가입을 위해 정보를 입력해주세요</Text>

              <View style={styles.inputGroup}>
                <View style={styles.inputWithButton}>
                  <TextInput
                    style={[styles.input, styles.inputFlex]}
                    placeholder="이메일을 입력해주세요"
                    value={formData.email}
                    onChangeText={text => {
                      handleChange('email', text);
                      // 이메일 입력 시 발송 상태 리셋
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
                  placeholder="인증코드 6자리"
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

              <View style={styles.inputGroup}>
                <TextInput
                  style={styles.input}
                  placeholder="전화번호 ( -없이 번호 입력)"
                  value={formData.phone}
                  onChangeText={text => handleChange('phone', text)}
                  keyboardType="phone-pad"
                  placeholderTextColor="rgba(255, 255, 255, 0.7)"
                />
                {errors.phone && (
                  <Text style={styles.errorMessage}>{errors.phone}</Text>
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
            </View>
          )}

          {step === 3 && (
            <View style={styles.stepContent}>
              <Text style={styles.title}>추가 정보를 입력해주세요</Text>

              <View style={styles.inputGroup}>
                <TextInput
                  style={styles.input}
                  placeholder="이름"
                  value={formData.name}
                  onChangeText={text => handleChange('name', text)}
                  placeholderTextColor="rgba(255, 255, 255, 0.7)"
                />
                {errors.name && (
                  <Text style={styles.errorMessage}>{errors.name}</Text>
                )}
              </View>

              <View style={styles.inputGroup}>
                <TouchableOpacity 
                  activeOpacity={0.8}
                  style={styles.birthDateButtonContainer}
                  onPress={() => {
                    setTempPickerValue({
                      year: formData.birthYear,
                      month: formData.birthMonth,
                      day: formData.birthDay
                    });
                    setPickerModalVisible(true);
                  }}>
                  <TextInput
                    style={styles.input}
                    value={formData.birthYear && formData.birthMonth && formData.birthDay 
                      ? `${formData.birthYear}-${String(formData.birthMonth).padStart(2, '0')}-${String(formData.birthDay).padStart(2, '0')}`
                      : ''}
                    placeholder="생년월일 선택"
                    placeholderTextColor="rgba(255, 255, 255, 0.7)"
                    editable={false}
                    pointerEvents="none"
                  />
                </TouchableOpacity>
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
                      <TouchableOpacity onPress={() => {
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
                          onValueChange={value => setTempPickerValue({...tempPickerValue, year: value})}
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
                          onValueChange={value => setTempPickerValue({...tempPickerValue, month: value})}
                          style={styles.modalPicker}
                          itemStyle={styles.pickerItemStyle}>
                          {generateMonthOptions().map(month => (
                            <Picker.Item key={month} label={String(month).padStart(2, '0')} value={String(month)} />
                          ))}
                        </Picker>
                      </View>
                      <View style={styles.birthPickerItem}>
                        <Text style={styles.birthPickerLabelTop}>일</Text>
                        <Picker
                          selectedValue={tempPickerValue.day}
                          onValueChange={value => setTempPickerValue({...tempPickerValue, day: value})}
                          style={styles.modalPicker}
                          itemStyle={styles.pickerItemStyle}>
                          {(tempPickerValue.year && tempPickerValue.month ? (() => {
                            const daysInMonth = new Date(Number(tempPickerValue.year), Number(tempPickerValue.month), 0).getDate();
                            return Array.from({length: daysInMonth}, (_, i) => i + 1);
                          })() : Array.from({length: 31}, (_, i) => i + 1)).map(day => (
                            <Picker.Item key={day} label={String(day).padStart(2, '0')} value={String(day)} />
                          ))}
                        </Picker>
                      </View>
                    </View>
                  </TouchableOpacity>
                </TouchableOpacity>
              </Modal>
              {errors.birth && (
                <Text style={styles.errorMessage}>{errors.birth}</Text>
              )}

              <View style={styles.inputGroup}>
                <TouchableOpacity 
                  activeOpacity={0.8}
                  style={styles.birthDateButtonContainer}
                  onPress={() => setGenderModalVisible(true)}>
                  <TextInput
                    style={styles.input}
                    value={formData.gender === 'M' ? '남성' : formData.gender === 'F' ? '여성' : ''}
                    placeholder="성별 선택"
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
                          formData.gender === 'M' && styles.genderOptionSelected
                        ]}
                        onPress={() => {
                          handleChange('gender', 'M');
                          setGenderModalVisible(false);
                        }}>
                        <Text style={[
                          styles.genderOptionText,
                          formData.gender === 'M' && styles.genderOptionTextSelected
                        ]}>남성</Text>
                      </TouchableOpacity>
                      <TouchableOpacity
                        style={[
                          styles.genderOption,
                          formData.gender === 'F' && styles.genderOptionSelected
                        ]}
                        onPress={() => {
                          handleChange('gender', 'F');
                          setGenderModalVisible(false);
                        }}>
                        <Text style={[
                          styles.genderOptionText,
                          formData.gender === 'F' && styles.genderOptionTextSelected
                        ]}>여성</Text>
                      </TouchableOpacity>
                    </View>
                  </TouchableOpacity>
                </TouchableOpacity>
              </Modal>

              <View style={styles.inputGroup}>
                <TextInput
                  style={styles.input}
                  placeholder="키 (cm)"
                  value={formData.height}
                  onChangeText={text => handleChange('height', text)}
                  keyboardType="number-pad"
                  placeholderTextColor="rgba(255, 255, 255, 0.7)"
                />
                {errors.height && (
                  <Text style={styles.errorMessage}>{errors.height}</Text>
                )}
              </View>

              <View style={styles.inputGroup}>
                <TextInput
                  style={styles.input}
                  placeholder="현재 체중 (kg)"
                  value={formData.weight}
                  onChangeText={text => handleChange('weight', text)}
                  keyboardType="number-pad"
                  placeholderTextColor="rgba(255, 255, 255, 0.7)"
                />
                {errors.weight && (
                  <Text style={styles.errorMessage}>{errors.weight}</Text>
                )}
              </View>

              <View style={styles.inputGroup}>
                <TextInput
                  style={styles.input}
                  placeholder="목표 체중 (kg)"
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
                  onPress={() => setHealthGoalModalVisible(true)}>
                  <TextInput
                    style={styles.input}
                    value={
                      formData.healthGoal === 'DIET' ? '다이어트' :
                      formData.healthGoal === 'BULK' ? '벌크업' :
                      formData.healthGoal === 'LEAN_MASS' ? '린매스' :
                      formData.healthGoal === 'MUSCLE_GAIN' ? '근육 증가' :
                      formData.healthGoal === 'MAINTENANCE' ? '유지' : ''
                    }
                    placeholder="운동 목표 선택"
                    placeholderTextColor="rgba(255, 255, 255, 0.7)"
                    editable={false}
                    pointerEvents="none"
                  />
                </TouchableOpacity>
                {errors.healthGoal && (
                  <Text style={styles.errorMessage}>{errors.healthGoal}</Text>
                )}
              </View>

              {/* 운동 목표 선택 모달 */}
              <Modal
                visible={healthGoalModalVisible}
                transparent={true}
                animationType="slide"
                onRequestClose={() => setHealthGoalModalVisible(false)}>
                <TouchableOpacity 
                  style={styles.modalOverlay}
                  activeOpacity={1}
                  onPress={() => setHealthGoalModalVisible(false)}>
                  <TouchableOpacity 
                    activeOpacity={1}
                    onPress={() => {}}
                    style={styles.modalContent}>
                    <View style={styles.modalHeader}>
                      <TouchableOpacity onPress={() => setHealthGoalModalVisible(false)}>
                        <Text style={styles.modalCancelText}>취소</Text>
                      </TouchableOpacity>
                      <Text style={styles.modalTitle}>운동 목표 선택</Text>
                      <View style={{width: 50}} />
                    </View>
                    <View style={styles.healthGoalGrid}>
                      {[
                        {label: '다이어트', value: 'DIET'},
                        {label: '벌크업', value: 'BULK'},
                        {label: '린매스', value: 'LEAN_MASS'},
                        {label: '근육 증가', value: 'MUSCLE_GAIN'},
                        {label: '유지', value: 'MAINTENANCE'},
                      ].map((goal) => (
                        <TouchableOpacity
                          key={goal.value}
                          style={[
                            styles.healthGoalOption,
                            formData.healthGoal === goal.value && styles.healthGoalOptionSelected
                          ]}
                          onPress={() => {
                            handleChange('healthGoal', goal.value);
                            setHealthGoalModalVisible(false);
                          }}>
                          <Text style={[
                            styles.healthGoalOptionText,
                            formData.healthGoal === goal.value && styles.healthGoalOptionTextSelected
                          ]}>{goal.label}</Text>
                        </TouchableOpacity>
                      ))}
                    </View>
                  </TouchableOpacity>
                </TouchableOpacity>
              </Modal>

              <View style={styles.inputGroup}>
                <TextInput
                  style={styles.input}
                  placeholder="주간 운동 일수 (예: 3-4일, 선택사항)"
                  value={formData.workoutDaysPerWeek}
                  onChangeText={text => handleChange('workoutDaysPerWeek', text)}
                  placeholderTextColor="rgba(255, 255, 255, 0.7)"
                />
              </View>

              <TouchableOpacity 
                style={[styles.submitBtn, loading && styles.submitBtnDisabled]} 
                onPress={handleSubmit}
                disabled={loading}>
                {loading ? (
                  <ActivityIndicator color="#ffffff" />
                ) : (
                  <Text style={styles.submitBtnText}>확인</Text>
                )}
              </TouchableOpacity>
            </View>
          )}

          <TouchableOpacity
            style={styles.cancelBtn}
            onPress={() => {
              if (step === 1) {
                navigation.goBack();
              } else {
                setStep(step - 1);
              }
            }}>
            <Text style={styles.cancelBtnText}>뒤로가기</Text>
          </TouchableOpacity>
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
    gap: 20,
  },
  stepCircle: {
    width: 40,
    height: 40,
    borderRadius: 20,
    backgroundColor: '#434343',
    justifyContent: 'center',
    alignItems: 'center',
  },
  stepActive: {
    backgroundColor: '#e3ff7c',
  },
  stepText: {
    color: '#ffffff',
    fontWeight: '600',
    fontSize: 16,
  },
  stepTextActive: {
    color: '#000000',
  },
  stepContent: {
    width: '100%',
    maxWidth: 360,
    gap: 20,
  },
  title: {
    color: '#ffffff',
    fontWeight: '400',
    fontSize: 20,
    textAlign: 'center',
    marginBottom: 20,
    lineHeight: 1.2,
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
  birthGroup: {
    flexDirection: 'row',
    gap: 10,
    width: '100%',
    alignItems: 'center',
  },
  birthDateButtonContainer: {
    width: '100%',
    height: 60,
    backgroundColor: '#434343',
    borderRadius: 20,
    overflow: 'hidden',
  },
  birthDateButton: {
    width: '100%',
    height: 60,
    backgroundColor: '#434343',
    borderRadius: 20,
    paddingHorizontal: 20,
    justifyContent: 'center',
    alignItems: 'flex-start',
  },
  birthDateButtonInner: {
    flex: 1,
    justifyContent: 'center',
    width: '100%',
  },
  birthDateButtonText: {
    fontSize: 16,
    fontWeight: '400',
    includeFontPadding: false,
  },
  pickerButton: {
    flex: 1,
    height: 60,
    backgroundColor: '#434343',
    borderRadius: 20,
    justifyContent: 'center',
    alignItems: 'center',
    minWidth: 0,
  },
  pickerWrapper: {
    flex: 1,
    height: 60,
    backgroundColor: '#434343',
    borderRadius: 20,
    justifyContent: 'center',
    alignItems: 'center',
    position: 'relative',
    overflow: 'hidden',
  },
  pickerButtonOverlay: {
    position: 'absolute',
    top: 0,
    left: 0,
    right: 0,
    bottom: 0,
    justifyContent: 'center',
    alignItems: 'center',
    zIndex: 1,
    flexDirection: 'row',
    gap: 4,
  },
  pickerButtonText: {
    color: '#ffffff',
    fontSize: 16,
    fontWeight: '400',
  },
  pickerButtonArrow: {
    color: 'rgba(255, 255, 255, 0.7)',
    fontSize: 12,
    fontWeight: '400',
  },
  pickerWrapperFull: {
    width: '100%',
    height: 60,
    backgroundColor: '#434343',
    borderRadius: 20,
    justifyContent: 'center',
    position: 'relative',
  },
  picker: {
    height: 60,
    width: '100%',
    color: Platform.OS === 'ios' ? 'transparent' : '#ffffff',
    fontSize: 16,
    fontWeight: '400',
    paddingHorizontal: 20,
    backgroundColor: Platform.OS === 'ios' ? 'transparent' : undefined,
  },
  pickerWheel: {
    height: 60,
    width: '100%',
    color: 'transparent',
    fontSize: 16,
    fontWeight: '400',
    paddingHorizontal: 20,
  },
  pickerItemStyle: {
    color: '#ffffff',
    fontSize: 16,
    fontWeight: '400',
  },
  pickerValueOverlay: {
    position: 'absolute',
    top: 0,
    left: 0,
    right: 0,
    bottom: 0,
    justifyContent: 'center',
    paddingHorizontal: 20,
    zIndex: 1,
  },
  pickerValueText: {
    color: '#ffffff',
    fontSize: 16,
    fontWeight: '400',
  },
  modalOverlay: {
    flex: 1,
    backgroundColor: 'transparent',
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
  pickerInput: {
    paddingHorizontal: 20,
  },
  nextBtn: {
    width: '100%',
    height: 60,
    backgroundColor: '#434343',
    borderRadius: 20,
    alignItems: 'center',
    justifyContent: 'center',
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
  },
  cancelBtnText: {
    color: '#ffffff',
    fontSize: 12,
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
  healthGoalGrid: {
    flexDirection: 'row',
    flexWrap: 'wrap',
    padding: 20,
    gap: 12,
    justifyContent: 'space-between',
  },
  healthGoalOption: {
    width: '48%',
    height: 56,
    backgroundColor: '#434343',
    borderRadius: 16,
    alignItems: 'center',
    justifyContent: 'center',
  },
  healthGoalOptionSelected: {
    backgroundColor: '#e3ff7c',
  },
  healthGoalOptionText: {
    color: '#ffffff',
    fontSize: 16,
    fontWeight: '400',
  },
  healthGoalOptionTextSelected: {
    color: '#252525',
    fontWeight: '600',
  },
});

export default SignupScreen;

