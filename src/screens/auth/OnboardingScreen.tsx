import React, {useState, useRef, useEffect, useCallback} from 'react';
import {
  View,
  Text,
  StyleSheet,
  Dimensions,
  ScrollView,
  Animated,
  TouchableOpacity,
} from 'react-native';
import AsyncStorage from '@react-native-async-storage/async-storage';
import {colors} from '../../theme/colors';
import {Ionicons} from '@expo/vector-icons';

const {width: SCREEN_WIDTH, height: SCREEN_HEIGHT} = Dimensions.get('window');

interface OnboardingPage {
  title: string;
  description: string;
  icon: string;
  gradient: string[];
}

const ONBOARDING_PAGES: OnboardingPage[] = [
  {
    title: '당신의 건강 여정을 함께할 INTELFIT',
    description:
      '인바디 기반 AI 개인 코칭 서비스, INTELFIT에 오신 걸 환영합니다 👋\n\n나만의 건강 데이터를 기반으로 한 진짜 맞춤형 피드백을 시작해보세요!',
    icon: '👋',
    gradient: ['#6C5CE7', '#00B894'],
  },
  {
    title: '나의 몸을 기록하고 분석하다',
    description:
      '인바디, 식단, 운동 기록을 한 곳에서 관리하세요.\n\nAI가 당신의 변화를 숫자로 분석하고 시각화합니다.',
    icon: '📊',
    gradient: ['#00B894', '#6C5CE7'],
  },
  {
    title: 'AI가 제안하는 나만의 루틴',
    description:
      'AI가 인바디 데이터와 목표를 분석해\n\n당신에게 꼭 맞는 7일 식단·운동 루틴을 제안합니다.',
    icon: '🎯',
    gradient: ['#6C5CE7', '#FDCB6E'],
  },
  {
    title: '언제든 물어보세요, 당신의 AI 코치가 있습니다',
    description:
      '운동, 식단, 인바디까지\n\n무엇이든 물어보세요!\n\nAI 코치가 실시간으로 피드백을 제공합니다.',
    icon: '💬',
    gradient: ['#FDCB6E', '#6C5CE7'],
  },
  {
    title: '당신의 변화를 함께합니다',
    description:
      '오늘의 작은 기록이 내일의 큰 변화를 만듭니다.\n\n지금 INTELFIT과 함께 당신의 건강 여정을 시작하세요!',
    icon: '✨',
    gradient: ['#00B894', '#6C5CE7'],
  },
];

const OnboardingScreen = ({navigation}: any) => {
  const [currentPage, setCurrentPage] = useState(0);
  const scrollViewRef = useRef<ScrollView>(null);
  const pageAnimations = useRef(
    ONBOARDING_PAGES.map(() => ({
      fade: new Animated.Value(0),
      slide: new Animated.Value(30),
    }))
  ).current;
  const autoSlideTimer = useRef<NodeJS.Timeout | null>(null);

  const handleComplete = async () => {
    await AsyncStorage.setItem('onboarding_completed', 'true');
    navigation.replace('Login');
  };

  const handleNext = useCallback(() => {
    if (currentPage < ONBOARDING_PAGES.length - 1) {
      const nextPage = currentPage + 1;
      setCurrentPage(nextPage);
      scrollViewRef.current?.scrollTo({
        x: nextPage * SCREEN_WIDTH,
        animated: true,
      });
    } else {
      handleComplete();
    }
  }, [currentPage, navigation]);

  useEffect(() => {
    // 페이지 진입 애니메이션
    Animated.parallel([
      Animated.timing(pageAnimations[currentPage].fade, {
        toValue: 1,
        duration: 600,
        useNativeDriver: true,
      }),
      Animated.timing(pageAnimations[currentPage].slide, {
        toValue: 0,
        duration: 600,
        useNativeDriver: true,
      }),
    ]).start();

    // 자동 슬라이드 (5초)
    const startAutoSlide = () => {
      if (autoSlideTimer.current) {
        clearInterval(autoSlideTimer.current);
      }

      autoSlideTimer.current = setInterval(() => {
        if (currentPage < ONBOARDING_PAGES.length - 1) {
          handleNext();
        } else {
          if (autoSlideTimer.current) {
            clearInterval(autoSlideTimer.current);
          }
        }
      }, 5000);
    };

    startAutoSlide();

    return () => {
      if (autoSlideTimer.current) {
        clearInterval(autoSlideTimer.current);
      }
    };
  }, [currentPage, handleNext]);

  const handleSkip = async () => {
    await AsyncStorage.setItem('onboarding_completed', 'true');
    navigation.replace('Login');
  };

  const handleScroll = (event: any) => {
    const offsetX = event.nativeEvent.contentOffset.x;
    const page = Math.round(offsetX / SCREEN_WIDTH);
    if (page !== currentPage) {
      setCurrentPage(page);
    }
  };

  const renderPage = (page: OnboardingPage, index: number) => {
    const anim = pageAnimations[index];

    return (
      <View key={index} style={styles.page}>
        <View style={styles.content}>
          {/* 아이콘 영역 */}
          <Animated.View
            style={[
              styles.iconContainer,
              {
                opacity: anim.fade,
                transform: [{translateY: anim.slide}],
              },
            ]}>
            <View style={styles.iconCircle}>
              <Text style={styles.iconEmoji}>{page.icon}</Text>
            </View>
          </Animated.View>

          {/* 텍스트 영역 */}
          <Animated.View
            style={[
              styles.textContainer,
              {
                opacity: anim.fade,
                transform: [{translateY: anim.slide}],
              },
            ]}>
            <Text style={styles.title}>{page.title}</Text>
            <Text style={styles.description}>{page.description}</Text>
          </Animated.View>
        </View>
      </View>
    );
  };

  return (
    <View style={styles.container}>
      {/* 건너뛰기 버튼 */}
      <TouchableOpacity style={styles.skipButton} onPress={handleSkip}>
        <Text style={styles.skipText}>건너뛰기</Text>
      </TouchableOpacity>

      {/* 페이지 스크롤 */}
      <ScrollView
        ref={scrollViewRef}
        horizontal
        pagingEnabled
        showsHorizontalScrollIndicator={false}
        onScroll={handleScroll}
        scrollEventThrottle={16}
        style={styles.scrollView}>
        {ONBOARDING_PAGES.map((page, index) => renderPage(page, index))}
      </ScrollView>

      {/* 인디케이터 */}
      <View style={styles.indicatorContainer}>
        {ONBOARDING_PAGES.map((_, index) => (
          <View
            key={index}
            style={[
              styles.indicator,
              index === currentPage && styles.indicatorActive,
            ]}
          />
        ))}
      </View>

      {/* 버튼 영역 */}
      <View style={styles.buttonContainer}>
        {currentPage < ONBOARDING_PAGES.length - 1 ? (
          <TouchableOpacity style={styles.nextButton} onPress={handleNext}>
            <Text style={styles.nextButtonText}>다음</Text>
            <Ionicons name="chevron-forward" size={20} color={colors.black} />
          </TouchableOpacity>
        ) : (
          <TouchableOpacity style={styles.startButton} onPress={handleComplete}>
            <Text style={styles.startButtonText}>시작하기</Text>
          </TouchableOpacity>
        )}
      </View>
    </View>
  );
};

const styles = StyleSheet.create({
  container: {
    flex: 1,
    backgroundColor: colors.background,
  },
  skipButton: {
    position: 'absolute',
    top: 50,
    right: 20,
    zIndex: 10,
    padding: 10,
  },
  skipText: {
    color: '#e3ff7c',
    fontSize: 16,
    fontWeight: '600',
  },
  scrollView: {
    flex: 1,
  },
  page: {
    width: SCREEN_WIDTH,
    height: SCREEN_HEIGHT,
    justifyContent: 'center',
    alignItems: 'center',
    paddingHorizontal: 30,
  },
  content: {
    flex: 1,
    justifyContent: 'center',
    alignItems: 'center',
    width: '100%',
  },
  iconContainer: {
    marginBottom: 40,
  },
  iconCircle: {
    width: 120,
    height: 120,
    borderRadius: 60,
    backgroundColor: colors.cardBackground,
    justifyContent: 'center',
    alignItems: 'center',
    borderWidth: 2,
    borderColor: '#e3ff7c',
  },
  iconEmoji: {
    fontSize: 60,
  },
  textContainer: {
    alignItems: 'center',
  },
  title: {
    fontSize: 24,
    fontWeight: '800',
    color: colors.text,
    textAlign: 'center',
    marginBottom: 20,
    lineHeight: 32,
  },
  description: {
    fontSize: 16,
    color: colors.textLight,
    textAlign: 'center',
    lineHeight: 24,
  },
  indicatorContainer: {
    flexDirection: 'row',
    justifyContent: 'center',
    alignItems: 'center',
    gap: 8,
    paddingVertical: 20,
  },
  indicator: {
    width: 8,
    height: 8,
    borderRadius: 4,
    backgroundColor: colors.gray,
  },
  indicatorActive: {
    width: 24,
    backgroundColor: '#e3ff7c',
  },
  buttonContainer: {
    paddingHorizontal: 30,
    paddingBottom: 50,
  },
  nextButton: {
    flexDirection: 'row',
    alignItems: 'center',
    justifyContent: 'center',
    backgroundColor: '#e3ff7c',
    paddingVertical: 16,
    borderRadius: 12,
    gap: 8,
  },
  nextButtonText: {
    color: colors.black,
    fontSize: 18,
    fontWeight: '600',
  },
  startButton: {
    backgroundColor: '#e3ff7c',
    paddingVertical: 18,
    borderRadius: 12,
    alignItems: 'center',
  },
  startButtonText: {
    color: colors.black,
    fontSize: 18,
    fontWeight: '700',
  },
});

export default OnboardingScreen;
