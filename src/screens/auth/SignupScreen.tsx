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
} from 'react-native';
import {Picker} from '@react-native-picker/picker';

const SignupScreen = ({navigation}: any) => {
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
  });
  const [errors, setErrors] = useState<any>({});
  const [isUsernameChecked, setIsUsernameChecked] = useState(false);
  const [isEmailVerified, setIsEmailVerified] = useState(false);

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
    const newErrors: any = {};

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
      setErrors((prev: any) => ({...prev, username: '아이디를 입력해주세요'}));
      return;
    }
    console.log('아이디 중복 확인:', formData.username);
    setIsUsernameChecked(true);
    setErrors((prev: any) => ({...prev, username: ''}));
  };

  const handleEmailVerification = () => {
    if (!formData.email.trim()) {
      setErrors((prev: any) => ({...prev, email: '이메일을 입력해주세요'}));
      return;
    }
    console.log('이메일 인증:', formData.email);
    setIsEmailVerified(true);
    setErrors((prev: any) => ({...prev, email: ''}));
  };

  const handleNext = () => {
    if (step === 1 && validateStep1()) {
      setStep(2);
    } else if (step === 2 && validateStep2()) {
      setStep(3);
    }
  };

  const handleSubmit = () => {
    if (validateStep3()) {
      console.log('회원가입 완료:', formData);
      navigation.navigate('Login');
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
                    style={styles.checkBtn}
                    onPress={handleUsernameCheck}>
                    <Text style={styles.checkBtnText}>중복확인</Text>
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
                    onChangeText={text => handleChange('email', text)}
                    keyboardType="email-address"
                    placeholderTextColor="rgba(255, 255, 255, 0.7)"
                  />
                  <TouchableOpacity
                    style={styles.checkBtn}
                    onPress={handleEmailVerification}>
                    <Text style={styles.checkBtnText}>본인인증</Text>
                  </TouchableOpacity>
                </View>
                {errors.email && (
                  <Text style={styles.errorMessage}>{errors.email}</Text>
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

              <TouchableOpacity style={styles.nextBtn} onPress={handleNext}>
                <Text style={styles.nextBtnText}>다음</Text>
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

              <View style={styles.birthGroup}>
                <View style={styles.pickerWrapper}>
                  <Picker
                    selectedValue={formData.birthYear}
                    onValueChange={value => handleChange('birthYear', value)}
                    style={styles.picker}>
                    <Picker.Item label="년" value="" />
                    {generateYearOptions().map(year => (
                      <Picker.Item key={year} label={String(year)} value={String(year)} />
                    ))}
                  </Picker>
                </View>
                <View style={styles.pickerWrapper}>
                  <Picker
                    selectedValue={formData.birthMonth}
                    onValueChange={value => handleChange('birthMonth', value)}
                    style={styles.picker}>
                    <Picker.Item label="월" value="" />
                    {generateMonthOptions().map(month => (
                      <Picker.Item key={month} label={String(month)} value={String(month)} />
                    ))}
                  </Picker>
                </View>
                <View style={styles.pickerWrapper}>
                  <Picker
                    selectedValue={formData.birthDay}
                    onValueChange={value => handleChange('birthDay', value)}
                    style={styles.picker}>
                    <Picker.Item label="일" value="" />
                    {formData.birthYear && formData.birthMonth ? generateDayOptions().map(day => (
                      <Picker.Item key={day} label={String(day)} value={String(day)} />
                    )) : Array.from({length: 31}, (_, i) => i + 1).map(day => (
                      <Picker.Item key={day} label={String(day)} value={String(day)} />
                    ))}
                  </Picker>
                </View>
              </View>
              {errors.birth && (
                <Text style={styles.errorMessage}>{errors.birth}</Text>
              )}

              <TouchableOpacity style={styles.submitBtn} onPress={handleSubmit}>
                <Text style={styles.submitBtnText}>확인</Text>
              </TouchableOpacity>
            </View>
          )}

          <TouchableOpacity
            style={styles.cancelBtn}
            onPress={() => navigation.navigate('Login')}>
            <Text style={styles.cancelBtnText}>취소하기</Text>
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
  },
  pickerWrapper: {
    flex: 1,
    height: 60,
    backgroundColor: '#434343',
    borderRadius: 20,
    overflow: 'hidden',
  },
  picker: {
    height: 60,
    color: '#ffffff',
  },
  nextBtn: {
    width: '100%',
    height: 60,
    backgroundColor: '#434343',
    borderRadius: 20,
    alignItems: 'center',
    justifyContent: 'center',
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
});

export default SignupScreen;

