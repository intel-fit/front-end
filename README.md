# Intelfit Mobile

React Native + Expo 기반의 헬스케어 모바일 애플리케이션

## 🚀 빠른 시작

### 사전 요구사항

- Node.js 16.x 이상
- npm 또는 yarn
- Expo CLI (`npm install -g expo-cli`)
- Android Studio (Android 개발용) 또는 Xcode (iOS 개발용)

### 설치 및 실행

```bash
# 의존성 설치
npm install

# 앱 실행 (iOS)
npm run ios

# 앱 실행 (Android)
npm run android

# Metro Bundler만 실행
npm start
```

## 📦 주요 기술 스택

- **프레임워크**: React Native 0.81.5
- **개발 환경**: Expo SDK 54
- **네비게이션**: React Navigation v6
- **언어**: TypeScript
- **상태 관리**: React Hooks
- **로컬 저장소**: AsyncStorage

## 📁 프로젝트 구조

```
src/
├── navigation/     # 네비게이션 설정
├── screens/        # 화면 컴포넌트 (카테고리별 분리)
├── components/     # 재사용 컴포넌트
├── constants/      # 상수 정의
├── types/          # TypeScript 타입
├── theme/          # 테마 설정
└── assets/         # 이미지 등 리소스
```

상세 구조는 [DEVELOPMENT.md](./DEVELOPMENT.md) 참고

## 🎯 주요 기능

- ✅ 인증 (로그인, 회원가입, 비밀번호 재설정)
- ✅ 홈 화면 & 마이페이지
- ✅ 식단 관리 (추가, 검색, 추천)
- ✅ 운동 관리 (기록, 루틴 추천)
- ✅ 인바디 정보 입력 및 분석
- ✅ 챗봇 상담

## 📱 화면 구성

### 인증
- 스플래시, 로그인, 회원가입, 아이디 찾기, 비밀번호 재설정

### 메인 탭
- 홈, 기록하기, 챗봇, 분석하기, 마이페이지

### 식단
- 식단 목록, 식단 추가, 음식 검색, 식단 상세, 식단 추천

### 운동
- 운동 목록, 운동 상세, 운동 루틴 추천

### 분석
- 통계 분석, 그래프, 캘린더, 목표 설정

## 🛠️ 개발 가이드

자세한 개발 가이드는 [DEVELOPMENT.md](./DEVELOPMENT.md)를 참고하세요.

## 📄 라이선스

프로젝트 라이선스와 동일
