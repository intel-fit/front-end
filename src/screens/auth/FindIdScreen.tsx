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

const FindIdScreen = ({navigation}: any) => {
  const [email, setEmail] = useState('');
  const [isSubmitted, setIsSubmitted] = useState(false);
  const [error, setError] = useState('');

  const handleSubmit = () => {
    if (!email.trim()) {
      setError('이메일을 입력해주세요');
      return;
    }

    if (!/^[^\s@]+@[^\s@]+\.[^\s@]+$/.test(email)) {
      setError('올바른 이메일 형식이 아닙니다');
      return;
    }

    console.log('아이디 찾기:', email);
    setIsSubmitted(true);
    setError('');
  };

  if (isSubmitted) {
    return (
      <View style={styles.container}>
        <ScrollView
          contentContainerStyle={styles.scrollContent}
          keyboardShouldPersistTaps="handled">
          <View style={styles.findIdContainer}>
            <View style={styles.logoContainer}>
              <Text style={styles.logo}>INTEL FIT</Text>
            </View>

            <View style={styles.successMessage}>
              <Text style={styles.successTitle}>아이디 찾기</Text>
              <Text style={styles.successText}>
                회원님의 이메일로 아이디를 전송했습니다
              </Text>
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
        <View style={styles.findIdContainer}>
          <View style={styles.logoContainer}>
            <Text style={styles.logo}>INTEL FIT</Text>
          </View>

          <View style={styles.formContainer}>
            <Text style={styles.title}>아이디 찾기</Text>

            <View style={styles.form}>
              <View style={styles.inputGroup}>
                <TextInput
                  style={[styles.input, error && styles.inputError]}
                  placeholder="이메일을 입력해주세요"
                  value={email}
                  onChangeText={text => {
                    setEmail(text);
                    setError('');
                  }}
                  keyboardType="email-address"
                  placeholderTextColor="rgba(255, 255, 255, 0.7)"
                />
                {error && <Text style={styles.errorMessage}>{error}</Text>}
              </View>

              <TouchableOpacity style={styles.submitBtn} onPress={handleSubmit}>
                <Text style={styles.submitBtnText}>확인</Text>
              </TouchableOpacity>
            </View>

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
  findIdContainer: {
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
    gap: 24,
  },
  title: {
    color: '#ffffff',
    fontWeight: '700',
    fontSize: 18,
    textAlign: 'center',
    marginBottom: 0,
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
    height: 60,
    backgroundColor: '#e3ff7c',
    borderRadius: 20,
    alignItems: 'center',
    justifyContent: 'center',
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
    marginBottom: 16,
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

export default FindIdScreen;

