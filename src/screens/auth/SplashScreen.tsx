import React, {useEffect} from 'react';
import {View, Text, StyleSheet, Animated} from 'react-native';
import AsyncStorage from '@react-native-async-storage/async-storage';
import {colors} from '../../theme/colors';
import {ROUTES} from '../../constants/routes';

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

    // 온보딩 완료 여부 확인 후 적절한 화면으로 이동
    const checkOnboarding = async () => {
      try {
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

