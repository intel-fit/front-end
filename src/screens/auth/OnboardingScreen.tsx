import React, {useState, useRef, useCallback} from 'react';
import {
  View,
  Text,
  StyleSheet,
  Dimensions,
  ScrollView,
  TouchableOpacity,
  Image,
} from 'react-native';
import AsyncStorage from '@react-native-async-storage/async-storage';
import {colors} from '../../theme/colors';

const {width: SCREEN_WIDTH, height: SCREEN_HEIGHT} = Dimensions.get('window');

interface OnboardingPage {
  id: number;
  title: string;
  subtitle?: string;
  isFirstPage?: boolean;
  isLastPage?: boolean;
  screenImage?: any;
}

// 이미지 경로
const onboardingScreen1 = require('../../assets/images/onboarding_screen_1.png');
const onboardingScreen2 = require('../../assets/images/onboarding_screen_2.png');
const onboardingScreen3 = require('../../assets/images/onboarding_screen_3.png');
const onboardingScreen4 = require('../../assets/images/onboarding_screen_4.png');
const onboardingScreen5 = require('../../assets/images/onboarding_screen_5.png');

const ONBOARDING_PAGES: OnboardingPage[] = [
  {
    id: 0,
    title: '내 손 안의 AI 피티쌤',
    subtitle: 'INTELFIT',
    isFirstPage: true,
    screenImage: onboardingScreen1,
  },
  {
    id: 1,
    title: '나에게 최적화된\n식단과 운동 루틴을 만나세요.',
    screenImage: onboardingScreen2,
  },
  {
    id: 2,
    title: '나를 완벽하게 알고있는\nAI 코치와 대화해보세요.',
    screenImage: onboardingScreen3,
  },
  {
    id: 3,
    title: '인바디부터 운동, 식단까지\n간편하게 기록하세요.',
    screenImage: onboardingScreen4,
  },
  {
    id: 4,
    title: '건강점수와 그래프로\n나를 정확하게 분석하세요.',
    isLastPage: true,
    screenImage: onboardingScreen5,
  },
];

const OnboardingScreen = ({navigation}: any) => {
  const [currentPage, setCurrentPage] = useState(0);
  const scrollViewRef = useRef<ScrollView>(null);

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
    return (
      <View key={index} style={styles.page}>
        {page.isFirstPage ? (
          <View style={styles.header}>
            <Text style={styles.brandName}>INTELFIT</Text>
            <Text style={styles.brandSubtitle}>{page.title}</Text>
          </View>
        ) : (
          <View style={styles.titleContainer}>
            {page.id === 1 ? (
              <Text style={styles.pageTitle}>
                나에게 최적화된{'\n'}
                <Text style={styles.highlightText}>식단과 운동 루틴</Text>을 만나세요.
              </Text>
            ) : page.id === 2 ? (
              <Text style={styles.pageTitle}>
                나를 완벽하게 알고있는{'\n'}
                <Text style={styles.highlightText}>AI 코치</Text>와 대화해보세요.
              </Text>
            ) : page.id === 3 ? (
              <Text style={styles.pageTitle}>
                인바디부터 운동, 식단까지{'\n'}
                <Text style={styles.highlightText}>간편하게 기록하세요.</Text>
              </Text>
            ) : page.id === 4 ? (
              <Text style={styles.pageTitle}>
                <Text style={styles.highlightText}>건강점수와 그래프로</Text>{'\n'}
                나를 정확하게 분석하세요.
              </Text>
            ) : (
              <Text style={styles.pageTitle}>{page.title}</Text>
            )}
          </View>
        )}
        {page.screenImage && (
          <View style={styles.imageContainer}>
            <Image
              source={page.screenImage}
              style={styles.onboardingImage}
              resizeMode="contain"
            />
          </View>
        )}
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

      {/* 버튼 영역 */}
      <View style={styles.buttonContainer}>
        <TouchableOpacity
          style={styles.confirmButton}
          onPress={currentPage < ONBOARDING_PAGES.length - 1 ? handleNext : handleComplete}>
          <Text style={styles.confirmButtonText}>
            {currentPage < ONBOARDING_PAGES.length - 1 ? '확인' : '시작하기'}
          </Text>
        </TouchableOpacity>
      </View>
    </View>
  );
};

const styles = StyleSheet.create({
  container: {
    flex: 1,
    backgroundColor: '#252525',
  },
  skipButton: {
    position: 'absolute',
    top: 50,
    right: 20,
    zIndex: 10,
    padding: 10,
  },
  skipText: {
    color: '#464646',
    fontSize: 15,
    fontWeight: '700',
    fontFamily: 'Inter',
  },
  scrollView: {
    flex: 1,
  },
  page: {
    width: SCREEN_WIDTH,
    height: SCREEN_HEIGHT,
    paddingTop: 100,
    alignItems: 'center',
    justifyContent: 'flex-start',
  },
  header: {
    alignItems: 'flex-start',
    width: '100%',
    paddingHorizontal: 20,
    paddingLeft: 40,
    marginBottom: 30,
  },
  brandName: {
    fontSize: 24,
    fontWeight: '700',
    fontStyle: 'italic',
    color: '#e3ff7c',
    fontFamily: 'Inter',
    marginBottom: 8,
  },
  brandSubtitle: {
    fontSize: 24,
    fontWeight: '700',
    color: '#ffffff',
    fontFamily: 'Inter',
  },
  imageContainer: {
    width: SCREEN_WIDTH,
    flex: 1,
    justifyContent: 'center',
    alignItems: 'center',
    paddingHorizontal: 5,
    marginTop: 10,
  },
  onboardingImage: {
    width: SCREEN_WIDTH - 10,
    height: '100%',
    maxHeight: SCREEN_HEIGHT * 0.8,
  },
  titleContainer: {
    paddingHorizontal: 20,
    marginBottom: 30,
  },
  pageTitle: {
    fontSize: 24,
    fontWeight: '700',
    color: '#ffffff',
    textAlign: 'center',
    fontFamily: 'Inter',
    lineHeight: 30,
  },
  highlightText: {
    color: '#e3ff7c',
  },
  buttonContainer: {
    paddingHorizontal: 20,
    paddingBottom: 50,
  },
  confirmButton: {
    backgroundColor: '#ffffff',
    borderRadius: 20,
    paddingVertical: 20,
    alignItems: 'center',
    justifyContent: 'center',
    borderWidth: 1,
    borderColor: '#ffffff',
  },
  confirmButtonText: {
    color: '#000000',
    fontSize: 20,
    fontWeight: '700',
    fontFamily: 'Inter',
  },
});

export default OnboardingScreen;
