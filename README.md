# Intelfit

AI 퍼스널 트레이너 

## 📱 프로젝트 소개

Intelfit은 인바디 데이터를 기반으로 한 AI 개인 트레이너 서비스입니다. 사용자의 체성분 분석 결과를 바탕으로 맞춤형 식단과 운동 루틴을 추천하며, 실시간 챗봇 상담과 건강 통계 분석 기능을 제공합니다.

## 🚀 빠른 시작

### 사전 요구사항

- **Node.js**: 16.x 이상
- **npm** 또는 **yarn**
- **Expo CLI**: 전역 설치 권장 (`npm install -g expo-cli`)
- **Expo Go 앱**: 실제 디바이스 테스트용
  - [iOS App Store](https://apps.apple.com/app/expo-go/id982107779)
  - [Google Play Store](https://play.google.com/store/apps/details?id=host.exp.exponent)

### 설치

```bash
# 저장소 클론
git clone <repository-url>
cd front-end

# 의존성 설치
npm install
```

### 개발 서버 실행

```bash
# 기본 모드 (같은 Wi-Fi 네트워크 필요)
npm start

# Tunnel 모드 (다른 네트워크에서도 연결 가능, QR 코드 연결 문제 해결)
npm run start:tunnel

# LAN 모드 (같은 Wi-Fi 네트워크에서 명시적으로 LAN 사용)
npm run start:lan

# 플랫폼별 실행
npm run ios      # iOS 시뮬레이터
npm run android  # Android 에뮬레이터
npm run web      # 웹 브라우저
```

### 📱 Expo Go로 실행하기 (실제 디바이스)

1. **Expo Go 앱 설치**
   - iOS: App Store에서 "Expo Go" 검색 및 설치
   - Android: Play Store에서 "Expo Go" 검색 및 설치

2. **QR 코드 스캔**
   ```bash
   npm run start:tunnel
   ```
   - **iOS**: 카메라 앱으로 QR 코드 스캔 → Expo Go로 자동 열기
   - **Android**: Expo Go 앱에서 "Scan QR code" 버튼으로 스캔

3. **네트워크 연결 문제 해결**
   - QR 코드가 스캔되지 않거나 연결이 안 될 때는 **Tunnel 모드**를 사용하세요
   - Tunnel 모드는 다른 네트워크에서도 연결 가능하며, 방화벽 문제도 해결됩니다
   - Tunnel 모드는 일반 모드보다 느릴 수 있지만 연결은 안정적입니다

## 📦 기술 스택

### 핵심 프레임워크
- **React Native**: ^0.81.5
- **Expo SDK**: ~54.0.29
- **React**: 19.1.0
- **TypeScript**: ^5.7.0

### 주요 라이브러리
- **네비게이션**: React Navigation v6
  - `@react-navigation/native`: ^6.1.18
  - `@react-navigation/native-stack`: ^6.11.0
  - `@react-navigation/bottom-tabs`: ^6.6.1
- **상태 관리**: React Hooks
- **로컬 저장소**: AsyncStorage 2.2.0
- **HTTP 클라이언트**: Axios ^1.13.1
- **차트**: react-native-chart-kit ^6.12.0
- **아이콘**: @expo/vector-icons, react-native-vector-icons

### Expo 모듈
- `expo-blur`: ~15.0.8
- `expo-image-picker`: ~17.0.10
- `expo-image-manipulator`: ~14.0.8
- `expo-linear-gradient`: ~15.0.8
- `expo-linking`: ~8.0.10
- `expo-status-bar`: ~3.0.9

### 플랫폼 지원
- ✅ **iOS** - 시뮬레이터 및 실제 디바이스
- ✅ **Android** - 에뮬레이터 및 실제 디바이스

## 📁 프로젝트 구조

```
front-end/
├── src/
│   ├── assets/              # 이미지, 폰트 등 정적 리소스
│   │   └── images/         # 앱 아이콘, 온보딩 이미지 등
│   ├── components/          # 재사용 가능한 컴포넌트
│   │   ├── charts/         # 차트 컴포넌트 (MacroDonut 등)
│   │   ├── common/         # 공통 컴포넌트
│   │   │   ├── InBodyCalendarModal.tsx
│   │   │   ├── InbodyDateNavigator.tsx
│   │   │   └── InBodyManualForm.tsx
│   │   ├── modals/         # 모달 컴포넌트
│   │   │   ├── AIAnalysisModal.tsx
│   │   │   ├── BadgeListModal.tsx
│   │   │   ├── ChatbotSettingsModal.tsx
│   │   │   ├── ExerciseModal.tsx
│   │   │   ├── FoodAddOptionsModal.tsx
│   │   │   ├── MealRecommendModal.tsx
│   │   │   ├── ProfileEditModal.tsx
│   │   │   └── ... (기타 모달들)
│   │   └── ExerciseSetItem.tsx
│   ├── constants/          # 상수 정의
│   │   ├── routes.ts       # 라우트 상수
│   │   └── theme.ts        # 테마 상수
│   ├── contexts/           # React Context
│   │   └── DateContext.tsx # 날짜 컨텍스트
│   ├── navigation/         # 네비게이션 설정
│   │   ├── AppNavigator.tsx # 메인 네비게이터
│   │   └── types.ts        # 네비게이션 타입 정의
│   ├── screens/            # 화면 컴포넌트
│   │   ├── analysis/       # 분석/통계 화면
│   │   │   ├── AnalysisScreen.tsx
│   │   │   ├── CalendarScreen.tsx
│   │   │   ├── GoalScreen.tsx
│   │   │   └── HealthScoreTrendScreen.tsx
│   │   ├── auth/           # 인증 화면
│   │   │   ├── OnboardingScreen.tsx
│   │   │   ├── LoginScreen.tsx
│   │   │   ├── SignupScreen.tsx
│   │   │   ├── FindIdScreen.tsx
│   │   │   ├── ResetPasswordScreen.tsx
│   │   │   └── SplashScreen.tsx
│   │   ├── chatbot/        # 챗봇 화면
│   │   │   └── ChatbotScreen.tsx
│   │   ├── diet/           # 식단 관련 화면
│   │   │   ├── DietScreen.tsx
│   │   │   ├── MealAddScreen.tsx
│   │   │   ├── FoodSearchScreen.tsx
│   │   │   ├── MealDetailScreen.tsx
│   │   │   ├── MealRecommendScreen.tsx
│   │   │   └── ... (기타 식단 화면들)
│   │   ├── exercise/       # 운동 관련 화면
│   │   │   ├── ExerciseScreen.tsx
│   │   │   ├── ExerciseDetailScreen.tsx
│   │   │   ├── RoutineRecommendScreen.tsx
│   │   │   └── ... (기타 운동 화면들)
│   │   ├── inbody/         # 인바디 화면
│   │   │   ├── InBodyScreen.tsx
│   │   │   └── InBodyManualScreen.tsx
│   │   ├── main/           # 메인 탭 화면
│   │   │   ├── HomeScreen.tsx
│   │   │   ├── StatsScreen.tsx
│   │   │   └── MyPageScreen.tsx
│   │   └── pay/            # 결제 관련 화면
│   │       ├── PaymentSuccessScreen.tsx
│   │       ├── PaymentFailScreen.tsx
│   │       └── PaymentCancelScreen.tsx
│   ├── services/           # API 서비스
│   │   ├── apiConfig.ts    # 공통 API 설정 및 request 함수
│   │   ├── api.ts          # 기본 API 함수
│   │   ├── authAPI.ts      # 인증 관련 API
│   │   ├── chatAPI.ts      # 챗봇 API
│   │   ├── healthScoreAPI.ts
│   │   ├── homeAPI.ts
│   │   ├── mealAPI.ts      # 식단 API
│   │   ├── paymentAPI.ts   # 결제 API
│   │   ├── recommendedExerciseAPI.ts
│   │   ├── recommendedMealAPI.ts
│   │   ├── userPreferencesAPI.ts
│   │   └── index.ts        # 모든 API export
│   ├── theme/              # 테마 설정
│   │   ├── colors.ts       # 색상 정의
│   │   └── styles.ts       # 공통 스타일
│   ├── types/              # TypeScript 타입 정의
│   │   └── index.ts
│   └── utils/              # 유틸리티 함수
│       ├── eventBus.ts
│       ├── exerciseApi.ts
│       ├── exerciseGoalApi.ts
│       ├── inbodyApi.ts
│       ├── membership-utils.ts
│       └── ... (기타 유틸리티들)
├── App.tsx                 # 앱 진입점
├── app.json                # Expo 설정
├── package.json            # 프로젝트 의존성
├── tsconfig.json           # TypeScript 설정
└── metro.config.js         # Metro 번들러 설정
```

## 🎯 주요 기능

### 인증 및 온보딩
- ✅ 온보딩 화면 (5단계)
- ✅ 로그인/회원가입
- ✅ 아이디 찾기
- ✅ 비밀번호 재설정

### 홈 및 통계
- ✅ 홈 대시보드
- ✅ 건강 통계 및 그래프
- ✅ 마이페이지 (프로필, 설정, 구독 관리)

### 식단 관리
- ✅ 식단 기록 (추가, 수정, 삭제)
- ✅ 음식 검색 및 직접 입력
- ✅ AI 식단 추천
- ✅ 식단 추천 내역
- ✅ 영양소 목표 설정

### 운동 관리
- ✅ 운동 기록 (세트, 무게, 횟수)
- ✅ 운동 상세 정보
- ✅ AI 운동 루틴 추천
- ✅ 운동 목표 설정

### 인바디 분석
- ✅ 인바디 데이터 입력 (사진 또는 수동)
- ✅ 인바디 캘린더
- ✅ 체성분 분석 및 추이

### 챗봇 상담
- ✅ AI 챗봇 상담
- ✅ 챗봇 설정

### 분석 및 통계
- ✅ 건강 점수 추이
- ✅ 캘린더 뷰
- ✅ 목표 설정 및 달성도

### 결제
- ✅ 결제 성공/실패/취소 화면
- ✅ 웹 결제 연동

