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
import {colors} from '../../theme/colors';

const LoginScreen = ({navigation}: any) => {
  const [formData, setFormData] = useState({
    username: '',
    password: '',
  });
  const [errors, setErrors] = useState<{username?: string; password?: string}>({});

  const handleChange = (name: string, value: string) => {
    setFormData(prev => ({
      ...prev,
      [name]: value,
    }));
    if (errors[name as keyof typeof errors]) {
      setErrors(prev => ({
        ...prev,
        [name]: '',
      }));
    }
  };

  const validateForm = () => {
    const newErrors: {username?: string; password?: string} = {};

    if (!formData.username.trim()) {
      newErrors.username = '아이디를 입력해주세요';
    }

    if (!formData.password.trim()) {
      newErrors.password = '비밀번호를 입력해주세요';
    }

    setErrors(newErrors);
    return Object.keys(newErrors).length === 0;
  };

  const handleSubmit = () => {
    if (validateForm()) {
      console.log('로그인 시도:', formData);
      navigation.replace('Main');
    }
  };

  const handleKakaoLogin = () => {
    console.log('카카오 로그인');
  };

  return (
    <KeyboardAvoidingView
      style={styles.container}
      behavior={Platform.OS === 'ios' ? 'padding' : 'height'}>
      <ScrollView contentContainerStyle={styles.scrollContent}>
        <View style={styles.loginContainer}>
          <View style={styles.logoContainer}>
            <Text style={styles.logo}>INTEL FIT</Text>
          </View>

          <View style={styles.form}>
            <View style={styles.inputGroup}>
              <TextInput
                style={[styles.input, errors.username && styles.inputError]}
                placeholder="아이디"
                value={formData.username}
                onChangeText={text => handleChange('username', text)}
                autoCapitalize="none"
                placeholderTextColor={colors.textLight}
              />
              {errors.username && (
                <Text style={styles.errorMessage}>{errors.username}</Text>
              )}
            </View>

            <View style={styles.inputGroup}>
              <TextInput
                style={[styles.input, errors.password && styles.inputError]}
                placeholder="비밀번호"
                value={formData.password}
                onChangeText={text => handleChange('password', text)}
                secureTextEntry
                placeholderTextColor={colors.textLight}
              />
              {errors.password && (
                <Text style={styles.errorMessage}>{errors.password}</Text>
              )}
            </View>

            <TouchableOpacity style={styles.loginBtn} onPress={handleSubmit}>
              <Text style={styles.loginBtnText}>로그인</Text>
            </TouchableOpacity>
          </View>

          <View style={styles.links}>
            <TouchableOpacity onPress={() => navigation.navigate('FindId')}>
              <Text style={styles.linkText}>아이디 찾기</Text>
            </TouchableOpacity>
            <TouchableOpacity
              onPress={() => navigation.navigate('ResetPassword')}>
              <Text style={styles.linkText}>비밀번호 재설정</Text>
            </TouchableOpacity>
            <TouchableOpacity onPress={() => navigation.navigate('Signup')}>
              <Text style={styles.linkText}>회원가입</Text>
            </TouchableOpacity>
          </View>

          <TouchableOpacity style={styles.kakaoBtn} onPress={handleKakaoLogin}>
            <Text style={styles.kakaoBtnText}>카카오로 계속하기</Text>
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
  loginContainer: {
    flex: 1,
    width: 402,
    paddingTop: 120,
    alignItems: 'center',
  },
  logoContainer: {
    alignItems: 'center',
    marginBottom: 30,
  },
  logo: {
    fontSize: 40,
    fontWeight: '800',
    fontStyle: 'italic',
    color: '#e3ff7c',
    letterSpacing: 0,
  },
  form: {
    width: 360,
    marginBottom: 30,
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
    color: colors.text,
  },
  inputError: {
    borderColor: colors.error,
  },
  errorMessage: {
    color: '#ff6b6b',
    fontSize: 14,
    marginLeft: 5,
  },
  loginBtn: {
    width: '100%',
    height: 60,
    backgroundColor: '#434343',
    borderRadius: 100,
    alignItems: 'center',
    justifyContent: 'center',
    opacity: 0.6,
  },
  loginBtnText: {
    color: colors.text,
    fontSize: 18,
    fontWeight: '400',
  },
  links: {
    flexDirection: 'row',
    justifyContent: 'center',
    gap: 24,
    width: 360,
    marginBottom: 30,
  },
  linkText: {
    color: colors.text,
    fontSize: 16,
    fontWeight: '400',
  },
  kakaoBtn: {
    width: 360,
    height: 50,
    backgroundColor: '#ffe617',
    borderRadius: 20,
    alignItems: 'center',
    justifyContent: 'center',
  },
  kakaoBtnText: {
    color: '#47292b',
    fontSize: 16,
    fontWeight: '400',
  },
});

export default LoginScreen;

