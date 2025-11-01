import React, {useEffect} from 'react';
import {View, Text, StyleSheet, Animated} from 'react-native';
import {colors} from '../../theme/colors';

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

    // 3초 후 로그인 화면으로 이동
    const timer = setTimeout(() => {
      navigation.replace('Login');
    }, 3000);

    return () => {
      clearTimeout(timer);
      dotAnimation.stop();
    };
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

