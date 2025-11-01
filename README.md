# Intelfit Mobile

React Native + Expo 기반의 헬스케어 모바일 애플리케이션

## 🚀 빠른 시작

### 사전 요구사항

- Node.js 16.x 이상
- npm 또는 yarn
- Expo CLI (`npm install -g expo-cli`)

### 설치 및 실행

```bash
# 의존성 설치
npm install

# 개발 서버 실행
npm start

# iOS 시뮬레이터에서 실행
npm run ios

# Android 에뮬레이터에서 실행
npm run android
```

### 📱 Expo Go로 실행하기 (실제 디바이스)

1. **Expo Go 앱 설치**
   - [iOS App Store](https://apps.apple.com/app/expo-go/id982107779)
   - [Google Play Store](https://play.google.com/store/apps/details?id=host.exp.exponent)

2. **개발 서버 실행 및 QR 코드 스캔**
   ```bash
   npm start
   ```
   - iOS: 카메라 앱으로 QR 코드 스캔 → Expo Go로 열기
   - Android: Expo Go 앱에서 "Scan QR code" 버튼으로 스캔

3. **네트워크 모드**
   ```bash
   # 일반 실행 (같은 Wi-Fi 네트워크 필요)
   npm start
   
   # Tunnel 모드 (다른 네트워크에서도 연결 가능, 느릴 수 있음)
   npm start -- --tunnel
   
   # LAN 모드
   npm start -- --lan
   ```

## 📦 기술 스택

- **프레임워크**: React Native + Expo SDK 54
- **네비게이션**: React Navigation v6
- **언어**: TypeScript
- **상태 관리**: React Hooks
- **로컬 저장소**: AsyncStorage

## 📁 프로젝트 구조

```
src/
├── navigation/     # 네비게이션 설정
├── screens/        # 화면 컴포넌트
│   ├── auth/      # 인증 화면
│   ├── main/      # 메인 탭 화면
│   ├── diet/      # 식단 관련
│   ├── exercise/  # 운동 관련
│   ├── analysis/  # 분석/통계
│   ├── inbody/    # 인바디
│   └── chatbot/   # 챗봇
├── components/     # 재사용 컴포넌트
│   ├── modals/    # 모달 컴포넌트
│   └── common/    # 공통 컴포넌트
├── constants/      # 상수 정의
├── types/          # TypeScript 타입
└── theme/          # 테마 설정
```

## 🎯 주요 기능

- ✅ 사용자 인증 (로그인, 회원가입, 아이디/비밀번호 찾기)
- ✅ 홈 화면 및 마이페이지
- ✅ 식단 관리 (추가, 검색, 추천, 내역)
- ✅ 운동 관리 (기록, 루틴 추천, 내역)
- ✅ 인바디 정보 입력 및 분석
- ✅ 챗봇 상담
- ✅ 통계 분석 및 그래프

## 📖 문서

- [개발 가이드](./DEVELOPMENT.md) - 상세한 개발 가이드 및 프로젝트 구조
