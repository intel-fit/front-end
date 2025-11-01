# React → React Native 마이그레이션 가이드

## 단계별 작업 진행 상황

### ✅ 1단계: 프로젝트 초기 설정 (완료)

**완료 항목:**
- React Native 프로젝트 구조 생성
- `package.json.rn` 생성 (React Native 의존성)
- `App.tsx` - 메인 네비게이션 구조
- `index.js` - 엔트리 포인트
- `app.json`, `babel.config.js`, `metro.config.js` 설정

**파일:**
- ✅ `/package.json.rn`
- ✅ `/App.tsx`
- ✅ `/index.js`
- ✅ `/app.json`
- ✅ `/babel.config.js`
- ✅ `/metro.config.js`

---

### ✅ 2단계: 네비게이션 설정 (완료)

**완료 항목:**
- React Navigation 설정
- Stack Navigator (인증 화면용)
- Bottom Tab Navigator (메인 화면용)
- 화면 간 이동 로직

**네비게이션 구조:**
```
Stack Navigator
├── Splash
├── Login
├── Signup
├── FindId
├── ResetPassword
└── Main (Tab Navigator)
    ├── Home
    ├── Stats
    ├── Goal
    └── MyPage
```

---

### ✅ 3단계: 테마 및 스타일 시스템 (완료)

**완료 항목:**
- 공통 색상 팔레트
- 공통 스타일 정의
- StyleSheet API 활용

**파일:**
- ✅ `/src/theme/colors.ts`
- ✅ `/src/theme/styles.ts`

---

### ✅ 4단계: 인증 화면 변환 (완료)

**완료 항목:**
- Splash Screen (로딩 애니메이션 포함)
- Login Screen (폼 검증 포함)
- Signup Screen (3단계 폼)
- Find ID Screen
- Reset Password Screen (2단계 폼)

**파일:**
- ✅ `/src/screens/SplashScreen.tsx`
- ✅ `/src/screens/LoginScreen.tsx`
- ✅ `/src/screens/SignupScreen.tsx`
- ✅ `/src/screens/FindIdScreen.tsx`
- ✅ `/src/screens/ResetPasswordScreen.tsx`

**주요 변환 내용:**
- `react-router-dom` → `@react-navigation/native`
- CSS Modules → StyleSheet API
- HTML elements → React Native components
- 폼 검증 로직 유지

---

### ✅ 5단계: 메인 화면 변환 (완료)

**완료 항목:**
- Home Screen (대시보드)
- Stats Screen (기록 페이지 기본 구조)
- Goal Screen (운동 목표 설정)
- MyPage Screen (프로필 및 설정)
- Chatbot Screen (AI 챗봇)

**파일:**
- ✅ `/src/screens/HomeScreen.tsx`
- ✅ `/src/screens/StatsScreen.tsx`
- ✅ `/src/screens/GoalScreen.tsx`
- ✅ `/src/screens/MyPageScreen.tsx`
- ✅ `/src/screens/ChatbotScreen.tsx`

**주요 변환 내용:**
- `localStorage` → `@react-native-async-storage/async-storage`
- `react-icons` → `react-native-vector-icons/Ionicons`
- ScrollView, SafeAreaView 활용
- KeyboardAvoidingView 적용

---

### ⏳ 6단계: 식단 관련 페이지 (진행 예정)

**예정 항목:**
- Diet Page (식단 목록)
- Meal Add Page (식사 추가)
- Food Search Page (음식 검색)
- Meal Detail Page (식사 상세)
- Meal Recommend Page (식단 추천)

**원본 파일:**
- `/src/pages/DietPage.jsx`
- `/src/pages/MealAddPage.jsx`
- `/src/pages/FoodSearchPage.jsx`
- `/src/pages/MealDetail.jsx`
- `/src/pages/MealRecommend.jsx`

**변환 계획:**
- FlatList로 리스트 최적화
- 이미지 피커 통합
- 검색 기능 구현

---

### ⏳ 7단계: 운동 관련 페이지 (진행 예정)

**예정 항목:**
- Exercise Detail Page
- Routine Recommend Page
- Calendar Page

**원본 파일:**
- `/src/pages/ExerciseDetail.jsx`
- `/src/pages/RoutineRecommend.jsx`
- `/src/pages/CalendarPage.jsx`

**변환 계획:**
- 운동 기록 입력 폼
- 캘린더 라이브러리 통합
- 운동 추천 알고리즘 유지

---

### ⏳ 8단계: 분석/통계 페이지 (진행 예정)

**예정 항목:**
- Analysis Page (AI 분석)
- InBody Page (인바디 기록)
- Graph Page (그래프 통계)

**원본 파일:**
- `/src/pages/AnalysisPage.jsx`
- `/src/pages/InBodyPage.jsx`
- `/src/pages/GraphPage.jsx`

**변환 계획:**
- 차트 라이브러리 (react-native-chart-kit 또는 Victory Native)
- 이미지 업로드 (인바디 사진)
- AI 분석 결과 표시

---

### ⏳ 9단계: 모달 컴포넌트 (진행 예정)

**예정 항목:**
- AddFoodModal
- AIAnalysisModal
- BadgeListModal
- BadgeModal
- ExerciseModal
- FoodDirectInputModal
- InBodyManualModal
- InBodyPhotoModal
- MealRecommendModal
- MyPlanModal
- PaymentMethodModal
- ProfileEditModal
- RoutineRecommendModal

**원본 파일:**
- `/src/components/AddFoodModal.jsx`
- `/src/components/AIAnalysisModal.jsx`
- 등 13개 모달 컴포넌트

**변환 계획:**
- React Native Modal API 활용
- react-native-modal 라이브러리 고려
- 애니메이션 추가

---

### ⏳ 10단계: 공통 컴포넌트 (진행 예정)

**예정 항목:**
- Header
- Nav (이미 Tab Navigator로 구현됨)
- Tabs
- GoalCard
- LogItem
- LogSection
- WorkoutCalendar
- InbodyDateNavigator
- InbodyManualForm
- Bell

**원본 파일:**
- `/src/components/Header.jsx`
- `/src/components/Tabs.jsx`
- 등

---

## 주요 API 변환 매핑

| 웹 API | React Native 대체 |
|--------|-------------------|
| `localStorage` | `@react-native-async-storage/async-storage` |
| `window.location` | `navigation.navigate()` |
| `window.alert()` | `Alert.alert()` from 'react-native' |
| `window.confirm()` | `Alert.alert()` with buttons |
| `document.getElementById()` | `useRef()` |
| `window.addEventListener()` | `AppState` or custom events |
| File input | `react-native-image-picker` |
| Camera | `react-native-camera` or `expo-camera` |

---

## 라이브러리 변환 매핑

| 웹 라이브러리 | React Native 대체 |
|--------------|-------------------|
| `react-router-dom` | `@react-navigation/native` |
| `react-icons` | `react-native-vector-icons` |
| CSS Modules | `StyleSheet` from 'react-native' |
| `react-datepicker` | `@react-native-community/datetimepicker` |
| Chart.js | `react-native-chart-kit` or `victory-native` |
| HTML `<select>` | `@react-native-picker/picker` |

---

## 스타일 변환 가이드

### Flexbox 차이점

**웹:**
```css
.container {
  display: flex;
  flex-direction: row;
}
```

**React Native:**
```tsx
const styles = StyleSheet.create({
  container: {
    // display: 'flex'는 기본값이므로 생략
    flexDirection: 'row', // 기본값은 'column'
  },
});
```

### 단위

- **웹**: `px`, `rem`, `%`, `vh`, `vw`
- **React Native**: 숫자만 (density-independent pixels)

### Box Model

- **웹**: `border`, `margin`, `padding` 속성 다양
- **React Native**: 개별 속성 사용 (`borderWidth`, `borderColor`, `marginTop`, 등)

---

## 다음 단계

1. **식단 페이지 변환 시작**
   - DietPage부터 시작
   - FlatList 활용
   
2. **운동 페이지 변환**
   - ExerciseDetail 구현
   - 캘린더 통합

3. **모달 시스템 구축**
   - 공통 모달 컴포넌트
   - 애니메이션

4. **API 통합**
   - 백엔드 연동
   - 에러 처리

5. **최적화**
   - 메모이제이션
   - 이미지 최적화
   - 번들 크기 최적화

---

## 참고사항

### 개발 환경

- Node.js 14 이상
- React Native 0.72
- TypeScript 4.x

### 테스트 디바이스

- iOS: iPhone 12 이상 권장
- Android: Android 7.0 (API 24) 이상

### 빌드

```bash
# Debug 빌드
npm run android
npm run ios

# Release 빌드
cd android && ./gradlew assembleRelease
cd ios && xcodebuild -scheme IntelfitMobile -configuration Release
```

---

## 알려진 제한사항

1. **웹 전용 기능 제거**
   - `window` 객체 관련 기능
   - DOM 조작
   - 브라우저 전용 API

2. **성능 고려사항**
   - 긴 리스트는 FlatList 사용 필수
   - 이미지는 최적화 필요
   - 애니메이션은 `useNativeDriver` 사용

3. **플랫폼 차이**
   - iOS와 Android 동작 차이 고려
   - 플랫폼별 스타일 조정 필요

---

**작성일**: 2025-11-01
**버전**: 0.1.0
**진행률**: ~30% 완료

