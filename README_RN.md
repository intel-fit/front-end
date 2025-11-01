# Intelfit Mobile - React Native

기존 React 웹 앱을 React Native로 변환한 모바일 앱입니다.

## 📋 변환 완료 현황

### ✅ 완료된 부분

1. **초기 설정**
   - React Native 프로젝트 구조 생성
   - 네비게이션 설정 (React Navigation)
   - 테마 및 공통 스타일 설정

2. **인증 화면**
   - ✅ Splash Screen
   - ✅ Login Screen
   - ✅ Signup Screen
   - ✅ Find ID Screen
   - ✅ Reset Password Screen

3. **메인 화면**
   - ✅ Home Screen
   - ✅ Stats Screen (기본 구조)
   - ✅ Goal Screen
   - ✅ MyPage Screen
   - ✅ Chatbot Screen

### ⏳ 진행 중 / 미완료

4. **식단 관련**
   - ❌ Diet Page
   - ❌ Meal Add Page
   - ❌ Food Search Page
   - ❌ Meal Detail Page
   - ❌ Meal Recommend Page

5. **운동 관련**
   - ❌ Exercise Detail Page
   - ❌ Routine Recommend Page
   - ❌ Calendar Page

6. **분석/통계**
   - ❌ Analysis Page
   - ❌ InBody Page
   - ❌ Graph Page

7. **모달 컴포넌트**
   - ❌ 각종 모달 컴포넌트 (40개+)

## 🚀 설치 방법

### 1. 의존성 설치

```bash
# 기존 node_modules 백업 (선택사항)
mv node_modules node_modules.web.backup

# package.json을 React Native용으로 변경
mv package.json package.json.web
mv package.json.rn package.json

# 의존성 설치
npm install

# iOS용 추가 설치 (macOS만 해당)
cd ios && pod install && cd ..
```

### 2. 추가 필수 패키지 설치

```bash
# Picker 컴포넌트 (Signup Screen에서 사용)
npm install @react-native-picker/picker
npx pod-install  # iOS only

# AsyncStorage (로컬 저장소)
npm install @react-native-async-storage/async-storage
npx pod-install  # iOS only
```

### 3. 앱 실행

```bash
# iOS
npm run ios

# Android
npm run android

# Metro Bundler만 실행
npm start
```

## 📱 주요 변경사항

### 컴포넌트 변환

| 웹 (React) | 모바일 (React Native) |
|-----------|---------------------|
| `<div>` | `<View>` |
| `<span>`, `<p>` | `<Text>` |
| `<img>` | `<Image>` |
| `<input>` | `<TextInput>` |
| `<button>` | `<TouchableOpacity>` |

### 라우팅

- **웹**: `react-router-dom`
- **모바일**: `@react-navigation/native` + `@react-navigation/native-stack` + `@react-navigation/bottom-tabs`

### 스타일링

- **웹**: CSS Modules (`.module.css`)
- **모바일**: StyleSheet API

### 로컬 저장소

- **웹**: `localStorage`
- **모바일**: `@react-native-async-storage/async-storage`

### 아이콘

- **웹**: `react-icons`
- **모바일**: `react-native-vector-icons`

## 🏗️ 프로젝트 구조

```
front-end/
├── App.tsx                 # 메인 앱 컴포넌트 (네비게이션)
├── index.js               # 엔트리 포인트
├── app.json               # 앱 설정
├── package.json           # React Native 의존성
├── src/
│   ├── screens/           # 화면 컴포넌트
│   │   ├── SplashScreen.tsx
│   │   ├── LoginScreen.tsx
│   │   ├── SignupScreen.tsx
│   │   ├── HomeScreen.tsx
│   │   └── ...
│   ├── theme/             # 테마 설정
│   │   ├── colors.ts
│   │   └── styles.ts
│   └── components/        # 재사용 컴포넌트 (예정)
├── android/               # Android 프로젝트
└── ios/                   # iOS 프로젝트
```

## 📝 TODO - 남은 작업

### 우선순위 높음
1. ✅ 기본 화면 구조 완성
2. ⏳ 식단 관련 페이지 변환
3. ⏳ 운동 관련 페이지 변환
4. ⏳ 분석/통계 페이지 변환

### 우선순위 중간
5. ❌ 모달 컴포넌트 변환
6. ❌ API 연동
7. ❌ 이미지 업로드 기능
8. ❌ 카메라 연동

### 우선순위 낮음
9. ❌ 애니메이션 개선
10. ❌ 최적화 (메모이제이션 등)
11. ❌ 에러 처리
12. ❌ 테스트 코드

## ⚙️ 설정 파일

- `babel.config.js` - Babel 설정
- `metro.config.js` - Metro bundler 설정
- `android/` - Android 네이티브 설정
- `ios/` - iOS 네이티브 설정

## 🐛 알려진 이슈

1. **Chatbot API 키**: `ChatbotScreen.tsx`에서 Gemini API 키를 설정해야 합니다
2. **Picker 컴포넌트**: `@react-native-picker/picker` 추가 설치 필요
3. **이미지 에셋**: 웹용 이미지들을 React Native 형식으로 변환 필요

## 📖 참고 자료

- [React Native 공식 문서](https://reactnative.dev/)
- [React Navigation 공식 문서](https://reactnavigation.org/)
- [React Native Vector Icons](https://github.com/oblador/react-native-vector-icons)

## 👥 기여

React 웹 앱 → React Native 변환 프로젝트입니다.

## 📄 라이선스

기존 프로젝트와 동일

