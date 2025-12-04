import React, {useEffect} from 'react';
import {View, Text, StyleSheet, Animated} from 'react-native';
import AsyncStorage from '@react-native-async-storage/async-storage';
import {colors} from '../../theme/colors';
import {ROUTES} from '../../constants/routes';
import {request} from '../../services/apiConfig';

const ONBOARDING_KEY = '@intelfit_onboarding_completed';

const SplashScreen = ({navigation}: any) => {
  const fadeAnim = new Animated.Value(0);
  const dotAnim1 = new Animated.Value(0);
  const dotAnim2 = new Animated.Value(0);
  const dotAnim3 = new Animated.Value(0);

  useEffect(() => {
    // 로고 페이드인
    Animated.timing(fadeAnim, {
      toValue: 1,
      duration: 1000,
      useNativeDriver: true,
    }).start();

    // 점 애니메이션
    const dotAnimation = Animated.loop(
      Animated.sequence([
        Animated.timing(dotAnim1, {toValue: 1, duration: 400, useNativeDriver: true}),
        Animated.timing(dotAnim2, {toValue: 1, duration: 400, useNativeDriver: true}),
        Animated.timing(dotAnim3, {toValue: 1, duration: 400, useNativeDriver: true}),
        Animated.delay(400),
        Animated.parallel([
          Animated.timing(dotAnim1, {toValue: 0, duration: 0, useNativeDriver: true}),
          Animated.timing(dotAnim2, {toValue: 0, duration: 0, useNativeDriver: true}),
          Animated.timing(dotAnim3, {toValue: 0, duration: 0, useNativeDriver: true}),
        ]),
      ]),
    );
    dotAnimation.start();

    // 테스트 유저 생성 API 호출 (앱 시작 시 무조건 실행)
    const createTestUser = async () => {
      try {
        console.log('========================================');
        console.log('🚀 [SPLASH] 테스트 유저 생성 API 호출 시작');
        console.log('📍 URL: https://intelfits.com/api/users/create-test-user');
        console.log('⏰ 시간:', new Date().toISOString());
        console.log('========================================');
        
        const response = await request('/api/users/create-test-user', {
          method: 'POST',
        });
        
        console.log('========================================');
        console.log('✅ [SPLASH] 테스트 유저 생성 API 호출 성공');
        console.log('📦 응답 데이터:', JSON.stringify(response, null, 2));
        console.log('⏰ 완료 시간:', new Date().toISOString());
        console.log('========================================');
      } catch (error: any) {
        console.log('========================================');
        console.error('❌ [SPLASH] 테스트 유저 생성 API 호출 실패');
        console.error('📦 에러 메시지:', error?.message || '알 수 없는 오류');
        console.error('📦 에러 상태:', error?.status);
        console.error('📦 에러 데이터:', error?.data);
        console.error('⏰ 실패 시간:', new Date().toISOString());
        console.log('========================================');
        // 에러가 발생해도 앱은 정상적으로 진행
      }
    };

    // 온보딩 완료 여부 확인 후 적절한 화면으로 이동
    const checkOnboarding = async () => {
      try {
        // 테스트 유저 생성 API 호출
        await createTestUser();
        
        const onboardingCompleted = await AsyncStorage.getItem(ONBOARDING_KEY);
        const timer = setTimeout(() => {
          if (onboardingCompleted === 'true') {
            navigation.replace(ROUTES.LOGIN);
          } else {
            navigation.replace(ROUTES.ONBOARDING);
          }
        }, 2000); // 스플래시 화면 2초 표시

        return () => {
          clearTimeout(timer);
          dotAnimation.stop();
        };
      } catch (error) {
        console.error('온보딩 상태 확인 실패:', error);
        // 에러 발생 시 온보딩 화면으로 이동
        setTimeout(() => {
          navigation.replace(ROUTES.ONBOARDING);
        }, 2000);
      }
    };

    checkOnboarding();
  }, [navigation]);

  return (
    <View style={styles.container}>
      <View style={styles.wrapper}>
        <Animated.View style={[styles.content, {opacity: fadeAnim}]}>
          <Text style={styles.logo}>INTEL FIT</Text>
          <View style={styles.loadingDots}>
            <Animated.View style={[styles.dot, {opacity: dotAnim1}]} />
            <Animated.View style={[styles.dot, {opacity: dotAnim2}]} />
            <Animated.View style={[styles.dot, {opacity: dotAnim3}]} />
          </View>
        </Animated.View>
      </View>
    </View>
  );
};

const styles = StyleSheet.create({
  container: {
    flex: 1,
    backgroundColor: '#252525',
    justifyContent: 'center',
    alignItems: 'center',
  },
  wrapper: {
    width: '100%',
    alignItems: 'center',
  },
  content: {
    alignItems: 'center',
  },
  logo: {
    fontSize: 45,
    fontWeight: '800',
    fontStyle: 'italic',
    color: '#e3ff7c',
    letterSpacing: 2,
    marginBottom: 30,
  },
  loadingDots: {
    flexDirection: 'row',
    gap: 8,
  },
  dot: {
    width: 12,
    height: 12,
    borderRadius: 6,
    backgroundColor: '#e3ff7c',
  },
});

export default SplashScreen;

