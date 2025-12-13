import React, {useState, useEffect} from 'react';
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
import * as Linking from 'expo-linking';
import * as WebBrowser from 'expo-web-browser';
import AsyncStorage from '@react-native-async-storage/async-storage';
import {colors} from '../../theme/colors';
import {authAPI} from '../../services';
import {ACCESS_TOKEN_KEY, REFRESH_TOKEN_KEY} from '../../services/apiConfig';

// @react-native-seoul/kakao-login (네이티브 빌드에서만 작동)
// Expo Go에서는 WebBrowser.openAuthSessionAsync 사용
let KakaoLogin: any = null;
try {
  KakaoLogin = require('@react-native-seoul/kakao-login');
} catch (e) {
  console.log('카카오 로그인 네이티브 모듈을 사용할 수 없습니다 (Expo Go 환경일 수 있음)');
}

const LoginScreen = ({navigation}: any) => {
  const [formData, setFormData] = useState({
    username: '',
    password: '',
  });
  const [errors, setErrors] = useState<{username?: string; password?: string}>({});
  const [loading, setLoading] = useState(false);

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

  const handleSubmit = async () => {
    if (!validateForm()) {
      return;
    }

    setLoading(true);
    try {
      const response = await authAPI.login(formData.username, formData.password);
      
      if (response.success && response.accessToken) {
        navigation.replace('Main');
      } else {
        const errorMessage = response.message || '로그인에 실패했습니다';
        if (typeof window !== 'undefined' && (window as any).alert) {
          (window as any).alert(`로그인 실패\n${errorMessage}`);
        } else {
          Alert.alert('로그인 실패', errorMessage);
        }
      }
    } catch (error: any) {
      const errorMessage = error.message || '로그인에 실패했습니다';
      if (typeof window !== 'undefined' && (window as any).alert) {
        (window as any).alert(`로그인 실패\n${errorMessage}`);
      } else {
        Alert.alert('로그인 실패', errorMessage);
      }
    } finally {
      setLoading(false);
    }
  };

  useEffect(() => {
    // 🔹 ② redirect_uri 가로채기 (가장 중요)
    const subscription = Linking.addEventListener('url', async ({ url }) => {
      console.log('🔗 [카카오 로그인] 딥링크 수신:', url);
      
      const parsed = Linking.parse(url);
      const code = parsed.queryParams?.code as string | undefined;
      const accessToken = parsed.queryParams?.accessToken as string | undefined;
      const refreshToken = parsed.queryParams?.refreshToken as string | undefined;

      // 백엔드가 이미 처리해서 토큰을 딥링크에 포함한 경우
      if (accessToken) {
        console.log('✅ [카카오 로그인] 토큰이 딥링크에 포함됨');
        try {
          setLoading(true);
          
          // 토큰 저장
          await AsyncStorage.setItem(ACCESS_TOKEN_KEY, accessToken);
          if (refreshToken) {
            await AsyncStorage.setItem(REFRESH_TOKEN_KEY, refreshToken);
          }
          
          // userId가 있으면 저장
          const userId = parsed.queryParams?.userId as string | undefined;
          if (userId) {
            await AsyncStorage.setItem('userId', userId);
          }
          
          // membershipType 저장 (기본값 FREE)
          const membershipType = (parsed.queryParams?.membershipType as string | undefined) || 'FREE';
          await AsyncStorage.setItem('membershipType', membershipType);

          // 온보딩 여부 확인 (isOnboarded 우선 확인)
          const isOnboarded = parsed.queryParams?.isOnboarded;
          const onboarded = parsed.queryParams?.onboarded;
          const shouldOnboard = isOnboarded === 'false' || onboarded === 'false';
          
          // 신규 유저 확인 (온보딩이 완료된 경우에만)
          const newUser = parsed.queryParams?.newUser;
          const isNewUser = newUser === 'true';
          
          console.log('✅ [카카오 로그인] 토큰 저장 완료');
          if (shouldOnboard || isNewUser) {
            navigation.replace('KakaoOnboarding');
          } else {
            navigation.replace('Main');
          }
        } catch (error: any) {
          console.error('❌ [카카오 로그인] 토큰 저장 실패:', error);
          Alert.alert('로그인 실패', error.message || '토큰 저장 중 오류가 발생했습니다.');
        } finally {
          setLoading(false);
        }
        return;
      }

      // 인증 코드가 있는 경우 (백엔드 API 호출 필요)
      if (!code) {
        console.log('⚠️ [카카오 로그인] 딥링크에 code 또는 accessToken이 없음');
        return;
      }

      console.log('🔵 [카카오 로그인] 인증 코드 받음, 백엔드 API 호출 시작');
      try {
        setLoading(true);
        
        // 👉 여기서 서버 API 호출
        const res = await fetch(
          'https://www.intelfits.com/api/auth/kakao/login',
          {
            method: 'POST',
            headers: { 'Content-Type': 'application/json' },
            body: JSON.stringify({ code }),
          }
        );

        console.log('🔵 [카카오 로그인] 백엔드 응답 상태:', res.status);
        const data = await res.json();
        console.log('🔵 [카카오 로그인] 백엔드 응답 데이터:', data);

        if (!res.ok) {
          throw new Error(data.message || '카카오 로그인에 실패했습니다');
        }

        // 토큰 저장
        if (data.accessToken) {
          await AsyncStorage.setItem(ACCESS_TOKEN_KEY, data.accessToken);
        }
        if (data.refreshToken) {
          await AsyncStorage.setItem(REFRESH_TOKEN_KEY, data.refreshToken);
        }
        if (data.userId) {
          await AsyncStorage.setItem('userId', String(data.userId));
        }
        if (data.membershipType) {
          await AsyncStorage.setItem('membershipType', data.membershipType);
        } else {
          await AsyncStorage.setItem('membershipType', 'FREE');
        }

        // 온보딩 여부 확인 (isOnboarded 우선 확인)
        // isOnboarded === false: 온보딩 미완료 → 카카오 온보딩
        const isOnboarded = data.isOnboarded !== undefined ? data.isOnboarded : data.onboarded;
        const shouldOnboard = isOnboarded === false;
        
        // 신규 유저 확인 (온보딩이 완료된 경우에만)
        const isNewUser = data.newUser === true;
        
        if (shouldOnboard || isNewUser) {
          navigation.replace('KakaoOnboarding');
        } else {
          navigation.replace('Main');
        }
      } catch (error: any) {
        console.error('카카오 로그인 처리 실패:', error);
        const errorMessage = error.message || '카카오 로그인에 실패했습니다';
        if (Platform.OS === 'web') {
          window.alert(`로그인 실패\n${errorMessage}`);
        } else {
          Alert.alert('로그인 실패', errorMessage);
        }
      } finally {
        setLoading(false);
      }
    });

    // 앱이 이미 열려있을 때 딥링크 처리
    Linking.getInitialURL().then(async (url) => {
      if (url) {
        const parsed = Linking.parse(url);
        const code = parsed.queryParams?.code as string | undefined;
        if (code) {
          // 초기 URL에 코드가 있으면 처리
          try {
            setLoading(true);
            
            const res = await fetch(
              'https://www.intelfits.com/api/auth/kakao/login',
              {
                method: 'POST',
                headers: { 'Content-Type': 'application/json' },
                body: JSON.stringify({ code }),
              }
            );

            const data = await res.json();

            if (!res.ok) {
              throw new Error(data.message || '카카오 로그인에 실패했습니다');
            }

            // 토큰 저장
            if (data.accessToken) {
              await AsyncStorage.setItem(ACCESS_TOKEN_KEY, data.accessToken);
            }
            if (data.refreshToken) {
              await AsyncStorage.setItem(REFRESH_TOKEN_KEY, data.refreshToken);
            }
            if (data.membershipType) {
              await AsyncStorage.setItem('membershipType', data.membershipType);
            } else {
              await AsyncStorage.setItem('membershipType', 'FREE');
            }

            // 온보딩 여부 확인 (isOnboarded 우선 확인)
            const isOnboarded = data.isOnboarded !== undefined ? data.isOnboarded : data.onboarded;
            const shouldOnboard = isOnboarded === false;
            
            // 신규 유저 확인 (온보딩이 완료된 경우에만)
            const isNewUser = data.newUser === true;
            
            if (shouldOnboard || isNewUser) {
              navigation.replace('KakaoOnboarding');
            } else {
              navigation.replace('Main');
            }
          } catch (error: any) {
            console.error('카카오 로그인 처리 실패:', error);
          } finally {
            setLoading(false);
          }
        }
      }
    });

    return () => {
      subscription.remove();
    };
  }, [navigation]);

  const handleKakaoLogin = async () => {
    try {
      setLoading(true);
      console.log('🔵 [카카오 로그인] 시작');

      // 웹 환경 체크 (Platform.OS가 'web'인 경우)
      if (Platform.OS === 'web' && typeof window !== 'undefined' && window.open) {
        const KAKAO_CLIENT_ID = '99baee411cc547822f138712b19b032c';
        const REDIRECT_URI = 'https://www.intelfits.com/api/auth/kakao/callback';
        const loginUrl = `https://kauth.kakao.com/oauth/authorize?client_id=${KAKAO_CLIENT_ID}&redirect_uri=${encodeURIComponent(REDIRECT_URI)}&response_type=code&scope=profile_nickname,profile_image`;
        // 웹에서는 새 창으로 열기
        window.open(loginUrl, '_blank');
        setLoading(false);
        return;
      }

      // ✅ 방법 1: @react-native-seoul/kakao-login 사용 (네이티브 빌드에서만 작동)
      if (KakaoLogin && typeof KakaoLogin.login === 'function') {
        try {
          console.log('🔵 [카카오 로그인] 네이티브 모듈 사용');
          const token = await KakaoLogin.login();
          console.log('✅ [카카오 로그인] 토큰 받음:', token);

          // 카카오 액세스 토큰을 백엔드로 전송하여 JWT 토큰 발급받기
          // 또는 카카오 프로필 정보를 가져와서 백엔드에 전송
          const profile = await KakaoLogin.getProfile();
          console.log('✅ [카카오 로그인] 프로필:', profile);

          // 백엔드 API 호출 (카카오 ID로 로그인/회원가입)
          console.log('🔵 [카카오 로그인] 백엔드 API 호출 시작');
          const res = await fetch(
            'https://www.intelfits.com/api/auth/kakao/login',
            {
              method: 'POST',
              headers: { 'Content-Type': 'application/json' },
              body: JSON.stringify({ 
                kakaoAccessToken: token.accessToken,
                kakaoId: profile.id,
                nickname: profile.nickname,
                profileImage: profile.profileImageUrl
              }),
            }
          );

          console.log('🔵 [카카오 로그인] 백엔드 응답 상태:', res.status);
          const data = await res.json();
          console.log('🔵 [카카오 로그인] 백엔드 응답 데이터:', data);

          if (!res.ok) {
            console.error('❌ [카카오 로그인] 백엔드 응답 실패:', {
              status: res.status,
              statusText: res.statusText,
              data: data
            });
            throw new Error(data.message || `카카오 로그인에 실패했습니다 (${res.status})`);
          }

          // 토큰 저장
          if (data.accessToken) {
            await AsyncStorage.setItem(ACCESS_TOKEN_KEY, data.accessToken);
          }
          if (data.refreshToken) {
            await AsyncStorage.setItem(REFRESH_TOKEN_KEY, data.refreshToken);
          }
          if (data.userId) {
            await AsyncStorage.setItem('userId', String(data.userId));
          }
          if (data.membershipType) {
            await AsyncStorage.setItem('membershipType', data.membershipType);
          } else {
            await AsyncStorage.setItem('membershipType', 'FREE');
          }

          // 온보딩 여부 확인 (isOnboarded 우선 확인)
          const isOnboarded = data.isOnboarded !== undefined ? data.isOnboarded : data.onboarded;
          const shouldOnboard = isOnboarded === false;
          
          // 신규 유저 확인 (온보딩이 완료된 경우에만)
          const isNewUser = data.newUser === true;
          
          if (shouldOnboard || isNewUser) {
            navigation.replace('KakaoOnboarding');
          } else {
            navigation.replace('Main');
          }
          return;
        } catch (nativeError: any) {
          console.error('❌ [카카오 로그인] 네이티브 모듈 실패:', nativeError);
          console.log('⚠️ [카카오 로그인] 네이티브 모듈 실패, WebBrowser 방식으로 전환:', nativeError.message);
          // 네이티브 모듈 실패 시 WebBrowser 방식으로 폴백
          setLoading(false); // 로딩 상태 해제
        }
      }

      // ✅ 방법 2: openAuthSessionAsync 사용 (Expo Go에서도 작동, 딥링크 리다이렉트 감지 가능)
      const KAKAO_CLIENT_ID = '99baee411cc547822f138712b19b032c';
      const REDIRECT_URI = 'https://www.intelfits.com/api/auth/kakao/callback';
      const loginUrl = `https://kauth.kakao.com/oauth/authorize?client_id=${KAKAO_CLIENT_ID}&redirect_uri=${encodeURIComponent(REDIRECT_URI)}&response_type=code&scope=profile_nickname,profile_image`;

      console.log('🔵 [카카오 로그인] WebBrowser 방식 사용');
      console.log('🔵 [카카오 로그인] URL:', loginUrl);
      
      // 딥링크 스킴 설정 (앱 내부 브라우저에서 열리도록)
      const deepLinkScheme = 'intelfit://auth/kakao';
      console.log('🔵 [카카오 로그인] 딥링크 스킴:', deepLinkScheme);
      
      let result;
      try {
        // openAuthSessionAsync는 앱 내부 브라우저를 엽니다
        result = await WebBrowser.openAuthSessionAsync(
          loginUrl,
          deepLinkScheme
        );
      } catch (browserError: any) {
        console.error('❌ [카카오 로그인] WebBrowser 에러:', browserError);
        // WebBrowser 실패 시 openBrowserAsync로 폴백 (앱 내부 브라우저)
        console.log('🔄 [카카오 로그인] openBrowserAsync로 폴백');
        try {
          await WebBrowser.openBrowserAsync(loginUrl);
          // openBrowserAsync는 딥링크를 자동으로 처리하지 않으므로
          // Linking 이벤트 리스너가 처리하도록 함
          setLoading(false);
          return;
        } catch (fallbackError: any) {
          console.error('❌ [카카오 로그인] openBrowserAsync도 실패:', fallbackError);
          Alert.alert('오류', '카카오 로그인 페이지를 열 수 없습니다.');
          setLoading(false);
          return;
        }
      }
      
      console.log('🔵 [카카오 로그인] 결과:', result);

      // openAuthSessionAsync가 성공적으로 딥링크를 받은 경우
      if (result.type === 'success' && result.url) {
        console.log('🔵 [카카오 로그인] 딥링크 URL 받음:', result.url);
        
        // 기존 Linking 리스너가 처리하도록 이벤트 트리거
        // 또는 직접 파싱해서 처리
        const parsed = Linking.parse(result.url);
        const code = parsed.queryParams?.code as string | undefined;
        const accessToken = parsed.queryParams?.accessToken as string | undefined;
        const refreshToken = parsed.queryParams?.refreshToken as string | undefined;

        // 백엔드가 이미 처리해서 토큰을 딥링크에 포함한 경우
        if (accessToken) {
          console.log('✅ [카카오 로그인] 토큰이 딥링크에 포함됨');
          try {
            setLoading(true);
            
            // 토큰 저장
            await AsyncStorage.setItem(ACCESS_TOKEN_KEY, accessToken);
            if (refreshToken) {
              await AsyncStorage.setItem(REFRESH_TOKEN_KEY, refreshToken);
            }
            
            // userId가 있으면 저장
            const userId = parsed.queryParams?.userId as string | undefined;
            if (userId) {
              await AsyncStorage.setItem('userId', userId);
            }
            
            // membershipType 저장 (기본값 FREE)
            const membershipType = (parsed.queryParams?.membershipType as string | undefined) || 'FREE';
            await AsyncStorage.setItem('membershipType', membershipType);

            // 온보딩 여부 확인 (isOnboarded 우선 확인)
            const isOnboarded = parsed.queryParams?.isOnboarded;
            const onboarded = parsed.queryParams?.onboarded;
            const shouldOnboard = isOnboarded === 'false' || onboarded === 'false';
            
            // 신규 유저 확인 (온보딩이 완료된 경우에만)
            const newUser = parsed.queryParams?.newUser;
            const isNewUser = newUser === 'true';

            console.log('✅ [카카오 로그인] 토큰 저장 완료');
            if (shouldOnboard || isNewUser) {
              navigation.replace('KakaoOnboarding');
            } else {
              navigation.replace('Main');
            }
          } catch (error: any) {
            console.error('❌ [카카오 로그인] 토큰 저장 실패:', error);
            Alert.alert('로그인 실패', error.message || '토큰 저장 중 오류가 발생했습니다.');
          } finally {
            setLoading(false);
          }
          return;
        }

        // 인증 코드가 있는 경우 (백엔드 API 호출 필요)
        if (code) {
          console.log('🔵 [카카오 로그인] 인증 코드 받음, 백엔드 API 호출 시작');
          try {
            setLoading(true);
            
            // 👉 서버 API 호출
            const res = await fetch(
              'https://www.intelfits.com/api/auth/kakao/login',
              {
                method: 'POST',
                headers: { 'Content-Type': 'application/json' },
                body: JSON.stringify({ code }),
              }
            );

            console.log('🔵 [카카오 로그인] 백엔드 응답 상태:', res.status);
            const data = await res.json();
            console.log('🔵 [카카오 로그인] 백엔드 응답 데이터:', data);

            if (!res.ok) {
              throw new Error(data.message || '카카오 로그인에 실패했습니다');
            }

            // 토큰 저장
            if (data.accessToken) {
              await AsyncStorage.setItem(ACCESS_TOKEN_KEY, data.accessToken);
            }
            if (data.refreshToken) {
              await AsyncStorage.setItem(REFRESH_TOKEN_KEY, data.refreshToken);
            }
            if (data.userId) {
              await AsyncStorage.setItem('userId', String(data.userId));
            }
            if (data.membershipType) {
              await AsyncStorage.setItem('membershipType', data.membershipType);
            } else {
              await AsyncStorage.setItem('membershipType', 'FREE');
            }

            // 신규 유저/기존 유저 확인 (newUser 값 우선 확인)
            const isNewUser = data.newUser === true;
            if (isNewUser) {
              navigation.replace('KakaoOnboarding');
            } else {
              navigation.replace('Main');
            }
          } catch (error: any) {
            console.error('카카오 로그인 처리 실패:', error);
            const errorMessage = error.message || '카카오 로그인에 실패했습니다';
            if (typeof window !== 'undefined' && (window as any).alert) {
              (window as any).alert(`로그인 실패\n${errorMessage}`);
            } else {
              Alert.alert('로그인 실패', errorMessage);
            }
          } finally {
            setLoading(false);
          }
        }
      } else if (result.type === 'cancel') {
        console.log('⚠️ [카카오 로그인] 사용자가 취소함');
        Alert.alert('알림', '카카오 로그인이 취소되었습니다.');
      } else {
        console.log('⚠️ [카카오 로그인] 예상치 못한 결과:', result);
        Alert.alert('오류', '카카오 로그인에 실패했습니다. 다시 시도해주세요.');
      }
    } catch (error: any) {
      console.error('❌ [카카오 로그인] 에러:', error);
      const errorMessage = error.message || '카카오 로그인 페이지를 열 수 없습니다.';
      Alert.alert('오류', errorMessage);
    } finally {
      setLoading(false);
    }
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

            <TouchableOpacity 
              style={[styles.loginBtn, loading && styles.loginBtnDisabled]} 
              onPress={handleSubmit}
              disabled={loading}>
              {loading ? (
                <ActivityIndicator color={colors.text} />
              ) : (
                <Text style={styles.loginBtnText}>로그인</Text>
              )}
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
    width: '100%',
    paddingTop: 120,
    paddingHorizontal: 20,
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
    width: '100%',
    maxWidth: 360,
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
  loginBtnDisabled: {
    opacity: 0.4,
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
    width: '100%',
    maxWidth: 360,
    marginBottom: 30,
  },
  linkText: {
    color: colors.text,
    fontSize: 16,
    fontWeight: '400',
  },
  kakaoBtn: {
    width: '100%',
    maxWidth: 360,
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

