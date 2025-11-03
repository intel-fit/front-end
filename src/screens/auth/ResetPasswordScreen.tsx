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
} from 'react-native';
import {authAPI} from '../../services/api';

const ResetPasswordScreen = ({navigation}: any) => {
  const [step, setStep] = useState(1);
  const [loading, setLoading] = useState(false);
  const [formData, setFormData] = useState({
    email: '',
    username: '',
    tempPassword: '',
    newPassword: '',
    confirmPassword: '',
  });
  const [errors, setErrors] = useState<any>({});
  const [isSubmitted, setIsSubmitted] = useState(false);

  const handleChange = (name: string, value: string) => {
    setFormData(prev => ({...prev, [name]: value}));
    if (errors[name]) {
      setErrors((prev: any) => ({...prev, [name]: ''}));
    }
  };

  const validateStep1 = () => {
    const newErrors: any = {};

    if (!formData.email.trim()) {
      newErrors.email = '이메일을 입력해주세요';
    } else if (!/^[^\s@]+@[^\s@]+\.[^\s@]+$/.test(formData.email)) {
      newErrors.email = '올바른 이메일 형식이 아닙니다';
    }

    setErrors(newErrors);
    return Object.keys(newErrors).length === 0;
  };

  const validateStep2 = () => {
    const newErrors: any = {};

    if (!formData.tempPassword.trim()) {
      newErrors.tempPassword = '임시 비밀번호를 입력해주세요';
    } else if (!/^[A-Z]{6}$/.test(formData.tempPassword)) {
      newErrors.tempPassword = '임시 비밀번호는 6자리 대문자 영문입니다';
    }

    if (!formData.newPassword.trim()) {
      newErrors.newPassword = '새 비밀번호를 입력해주세요';
    } else if (formData.newPassword.length < 8) {
      newErrors.newPassword = '비밀번호는 8자 이상이어야 합니다';
    } else if (!/(?=.*[a-zA-Z])(?=.*\d)(?=.*[@$!%*?&])/.test(formData.newPassword)) {
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

  const handleStep1Submit = async () => {
    if (!validateStep1()) {
      return;
    }

    setLoading(true);
    try {
      const response = await authAPI.resetPassword(formData.email);
      
      if (response.success) {
        Alert.alert('임시 비밀번호 발송', '이메일로 임시 비밀번호가 발송되었습니다', [
          {
            text: '확인',
            onPress: () => setStep(2),
          },
        ]);
      }
    } catch (error: any) {
      Alert.alert('오류', error.message || '임시 비밀번호 발송에 실패했습니다');
    } finally {
      setLoading(false);
    }
  };

  const handleStep2Submit = async () => {
    if (!validateStep2()) {
      return;
    }

    setLoading(true);
    try {
      const response = await authAPI.changePassword(
        formData.tempPassword,
        formData.newPassword,
        formData.confirmPassword
      );
      
      if (response.success) {
        setIsSubmitted(true);
      }
    } catch (error: any) {
      Alert.alert('오류', error.message || '비밀번호 변경에 실패했습니다');
    } finally {
      setLoading(false);
    }
  };

  if (isSubmitted) {
    return (
      <View style={styles.container}>
        <ScrollView
          contentContainerStyle={styles.scrollContent}
          keyboardShouldPersistTaps="handled">
          <View style={styles.resetContainer}>
            <View style={styles.logoContainer}>
              <Text style={styles.logo}>INTEL FIT</Text>
            </View>

            <View style={styles.successMessage}>
              <Text style={styles.successTitle}>비밀번호 재설정</Text>
              <Text style={styles.successText}>비밀번호가 변경되었습니다</Text>
            </View>

            <TouchableOpacity
              style={styles.backBtn}
              onPress={() => navigation.navigate('Login')}>
              <Text style={styles.backBtnText}>로그인하러 가기</Text>
            </TouchableOpacity>
          </View>
        </ScrollView>
      </View>
    );
  }

  return (
    <KeyboardAvoidingView
      style={styles.container}
      behavior={Platform.OS === 'ios' ? 'padding' : 'height'}>
      <ScrollView
        contentContainerStyle={styles.scrollContent}
        keyboardShouldPersistTaps="handled">
        <View style={styles.resetContainer}>
          <View style={styles.logoContainer}>
            <Text style={styles.logo}>INTEL FIT</Text>
          </View>

          <View style={styles.formContainer}>
            <Text style={styles.title}>비밀번호 재설정</Text>

            {step === 1 ? (
              <View style={styles.form}>
                <View style={styles.inputGroup}>
                  <TextInput
                    style={[styles.input, errors.email && styles.inputError]}
                    placeholder="이메일을 입력해주세요"
                    value={formData.email}
                    onChangeText={text => handleChange('email', text)}
                    keyboardType="email-address"
                    placeholderTextColor="rgba(255, 255, 255, 0.7)"
                  />
                  {errors.email && (
                    <Text style={styles.errorMessage}>{errors.email}</Text>
                  )}
                </View>

                <TouchableOpacity
                  style={[styles.submitBtn, loading && styles.submitBtnDisabled]}
                  onPress={handleStep1Submit}
                  disabled={loading}>
                  {loading ? (
                    <ActivityIndicator color="#000000" />
                  ) : (
                    <Text style={styles.submitBtnText}>확인</Text>
                  )}
                </TouchableOpacity>
              </View>
            ) : (
              <View style={styles.form}>
                <View style={styles.inputGroup}>
                  <TextInput
                    style={[
                      styles.input,
                      errors.tempPassword && styles.inputError,
                    ]}
                    placeholder="임시 비밀번호 (6자리 대문자)"
                    value={formData.tempPassword}
                    onChangeText={text => handleChange('tempPassword', text.toUpperCase())}
                    autoCapitalize="characters"
                    maxLength={6}
                    placeholderTextColor="rgba(255, 255, 255, 0.7)"
                  />
                  {errors.tempPassword && (
                    <Text style={styles.errorMessage}>
                      {errors.tempPassword}
                    </Text>
                  )}
                </View>

                <View style={styles.inputGroup}>
                  <TextInput
                    style={[
                      styles.input,
                      errors.newPassword && styles.inputError,
                    ]}
                    placeholder="새 비밀번호"
                    value={formData.newPassword}
                    onChangeText={text => handleChange('newPassword', text)}
                    secureTextEntry
                    placeholderTextColor="rgba(255, 255, 255, 0.7)"
                  />
                  {errors.newPassword && (
                    <Text style={styles.errorMessage}>{errors.newPassword}</Text>
                  )}
                </View>

                <View style={styles.inputGroup}>
                  <TextInput
                    style={[
                      styles.input,
                      errors.confirmPassword && styles.inputError,
                    ]}
                    placeholder="새 비밀번호 확인"
                    value={formData.confirmPassword}
                    onChangeText={text => handleChange('confirmPassword', text)}
                    secureTextEntry
                    placeholderTextColor="rgba(255, 255, 255, 0.7)"
                  />
                  {errors.confirmPassword && (
                    <Text style={styles.errorMessage}>
                      {errors.confirmPassword}
                    </Text>
                  )}
                </View>

                <TouchableOpacity
                  style={[styles.submitBtn, loading && styles.submitBtnDisabled]}
                  onPress={handleStep2Submit}
                  disabled={loading}>
                  {loading ? (
                    <ActivityIndicator color="#000000" />
                  ) : (
                    <Text style={styles.submitBtnText}>확인</Text>
                  )}
                </TouchableOpacity>
              </View>
            )}

            <TouchableOpacity
              style={styles.cancelBtn}
              onPress={() => navigation.navigate('Login')}>
              <Text style={styles.cancelBtnText}>취소하기</Text>
            </TouchableOpacity>
          </View>
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
  resetContainer: {
    flex: 1,
    width: '100%',
    paddingTop: 80,
    paddingHorizontal: 20,
    paddingBottom: 20,
    gap: 24,
    alignItems: 'center',
    justifyContent: 'flex-start',
  },
  logoContainer: {
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
  },
  formContainer: {
    width: '100%',
    alignItems: 'center',
    gap: 20,
  },
  title: {
    color: '#ffffff',
    fontWeight: '700',
    fontSize: 18,
    textAlign: 'center',
    margin: 0,
  },
  form: {
    width: '100%',
    maxWidth: 360,
    gap: 20,
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
  inputError: {
    borderWidth: 2,
    borderColor: '#ff6b6b',
    backgroundColor: '#4a2a2a',
  },
  errorMessage: {
    color: '#ff6b6b',
    fontSize: 14,
    marginLeft: 5,
  },
  submitBtn: {
    width: '100%',
    maxWidth: 360,
    height: 60,
    backgroundColor: '#e3ff7c',
    borderRadius: 20,
    alignItems: 'center',
    justifyContent: 'center',
  },
  submitBtnDisabled: {
    opacity: 0.6,
  },
  submitBtnText: {
    color: '#000000',
    fontSize: 16,
    fontWeight: '400',
  },
  cancelBtn: {
    backgroundColor: 'transparent',
    marginTop: 10,
  },
  cancelBtnText: {
    color: '#ffffff',
    fontSize: 12,
    fontWeight: '400',
  },
  successMessage: {
    textAlign: 'center',
  },
  successTitle: {
    color: '#ffffff',
    fontWeight: '700',
    fontSize: 18,
    marginBottom: 20,
  },
  successText: {
    color: '#ffffff',
    fontSize: 16,
    fontWeight: '400',
  },
  backBtn: {
    width: '100%',
    maxWidth: 360,
    height: 60,
    backgroundColor: '#e3ff7c',
    borderRadius: 20,
    alignItems: 'center',
    justifyContent: 'center',
    marginTop: 16,
  },
  backBtnText: {
    color: '#000000',
    fontSize: 16,
    fontWeight: '400',
  },
});

export default ResetPasswordScreen;

