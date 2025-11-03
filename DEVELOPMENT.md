# 개발 가이드

이 문서는 Intelfit Mobile 프로젝트의 상세한 개발 가이드를 제공합니다.

## 📁 프로젝트 구조 상세

```
src/
├── navigation/              # 네비게이션 설정
│   ├── AppNavigator.tsx    # 메인 네비게이션 설정 (스택/탭 네비게이션)
│   └── types.ts            # 네비게이션 타입 정의 (RootStackParamList 등)
│
├── screens/                # 화면 컴포넌트 (모든 화면은 Screen.tsx로 끝남)
│   ├── auth/               # 인증 관련 화면
│   │   ├── SplashScreen.tsx        # 스플래시 화면 (앱 시작 화면)
│   │   ├── LoginScreen.tsx        # 로그인 화면
│   │   ├── SignupScreen.tsx       # 회원가입 화면 (3단계)
│   │   ├── FindIdScreen.tsx       # 아이디 찾기 화면
│   │   └── ResetPasswordScreen.tsx # 비밀번호 재설정 화면 (2단계)
│   │
│   ├── main/               # 메인 탭 화면 (Bottom Tab Navigator)
│   │   ├── HomeScreen.tsx         # 홈 화면 (오늘의 요약 정보)
│   │   ├── MyPageScreen.tsx       # 마이페이지 (프로필, 설정)
│   │   └── StatsScreen.tsx        # 통계 화면
│   │
│   ├── diet/               # 식단 관련 화면
│   │   ├── DietScreen.tsx                # 식단 메인 화면 (식단 기록 목록)
│   │   ├── MealAddScreen.tsx             # 식사 추가 화면
│   │   ├── FoodSearchScreen.tsx          # 음식 검색 화면
│   │   ├── MealDetailScreen.tsx          # 식사 상세 화면
│   │   ├── MealRecommendScreen.tsx       # AI 추천 식단 화면
│   │   ├── MealRecommendHistoryScreen.tsx # 추천 식단 히스토리
│   │   └── FoodAddOptionsScreen.tsx       # 음식 추가 옵션 화면
│   │
│   ├── exercise/           # 운동 관련 화면
│   │   ├── ExerciseScreen.tsx            # 운동 메인 화면 (운동 기록 목록)
│   │   ├── ExerciseDetailScreen.tsx      # 운동 상세 화면
│   │   ├── RoutineRecommendScreen.tsx    # 운동 루틴 추천 화면
│   │   └── RoutineRecommendNewScreen.tsx # 새 운동 루틴 추천 화면
│   │
│   ├── analysis/           # 분석/통계 화면
│   │   ├── AnalysisScreen.tsx    # 분석 메인 화면
│   │   ├── GraphScreen.tsx      # 그래프 화면 (차트, 통계)
│   │   ├── CalendarScreen.tsx   # 캘린더 화면 (일별 기록)
│   │   └── GoalScreen.tsx       # 목표 설정 화면
│   │
│   ├── inbody/             # 인바디 관련 화면
│   │   ├── InBodyScreen.tsx      # 인바디 메인 화면 (기록 목록, 그래프)
│   │   └── InBodyManualScreen.tsx # 인바디 수동 입력 화면
│   │
│   └── chatbot/            # 챗봇 화면
│       └── ChatbotScreen.tsx     # 챗봇 상담 화면
│
├── components/             # 재사용 가능한 컴포넌트
│   ├── modals/             # 모달 컴포넌트 (Modal로 표시되는 컴포넌트)
│   │   ├── AIAnalysisModal.tsx        # AI 분석 모달
│   │   ├── BadgeModal.tsx            # 뱃지 상세 모달
│   │   ├── BadgeListModal.tsx        # 뱃지 목록 모달
│   │   ├── ExerciseModal.tsx         # 운동 추가/수정 모달
│   │   ├── FoodAddOptionsModal.tsx  # 음식 추가 옵션 모달
│   │   ├── FoodDirectInputModal.tsx # 음식 직접 입력 모달
│   │   ├── InBodyPhotoModal.tsx     # 인바디 사진 모달
│   │   ├── MealRecommendModal.tsx   # 추천 식단 모달
│   │   ├── MyPlanModal.tsx          # 내 플랜 모달
│   │   ├── PaymentMethodModal.tsx   # 결제 수단 모달
│   │   ├── ProfileEditModal.tsx     # 프로필 수정 모달
│   │   └── RoutineRecommendModal.tsx # 운동 루틴 추천 모달
│   │
│   └── common/             # 공통 컴포넌트 (여러 화면에서 재사용)
│       ├── InbodyDateNavigator.tsx  # 인바디 날짜 네비게이터 (이전/다음 날짜)
│       └── InBodyManualForm.tsx    # 인바디 수동 입력 폼 컴포넌트
│
├── services/              # API 서비스 레이어 (백엔드와 통신)
│   ├── apiConfig.ts        # 공통 설정 및 request 함수
│   │                       # - API_BASE_URL: 서버 주소
│   │                       # - request: 모든 API 호출의 기본 함수
│   │                       # - 토큰 자동 첨부, 에러 처리 등
│   │                       # - ApiResponse 타입 정의
│   ├── authAPI.ts          # 인증 관련 API 함수
│   │                       # - login, signup, logout
│   │                       # - findUserId, resetPassword, changePassword
│   │                       # - sendVerificationCode, checkUserId
│   │                       # - refreshToken, isAuthenticated 등
│   ├── index.ts            # 모든 API export (권장 사용)
│   │                       # import { authAPI } from '../../services';
│   └── api.ts             # 기존 호환성 유지 (deprecated)
│                          # 새로운 코드에서는 사용하지 않음
│
├── constants/              # 상수 정의
│   ├── routes.ts           # 라우트 이름 상수
│   │                       # 모든 화면 이름을 상수로 관리
│   │                       # 예: ROUTES.HOME, ROUTES.LOGIN
│   └── theme.ts            # 테마 상수
│                           # 탭 바 테마, 아이콘 정의 등
│
├── types/                  # TypeScript 타입 정의
│   └── index.ts            # 공통 타입 정의
│                           # - User, Food, Meal, Exercise
│                           # - InBody, Badge 등 모든 공통 타입
│
├── theme/                  # 테마 설정 (색상, 스타일)
│   ├── colors.ts           # 색상 정의
│   │                       # - 배경색, 텍스트 색상 등
│   │                       # - 앱 전체에서 사용하는 색상 팔레트
│   └── styles.ts           # 공통 스타일
│                           # - 여러 화면에서 공통으로 사용하는 스타일
│
└── assets/                 # 정적 리소스 (이미지, 폰트 등)
    └── images/
        └── chatbot.png     # 챗봇 아이콘 이미지
```

### 주요 디렉토리 설명

#### `screens/`
- 모든 화면 컴포넌트가 위치하는 디렉토리
- 기능별로 폴더 분리 (auth, main, diet, exercise 등)
- 파일명은 `*Screen.tsx` 형식으로 통일

#### `components/`
- 재사용 가능한 컴포넌트
- `modals/`: 모달 형태로 표시되는 컴포넌트
- `common/`: 여러 화면에서 공통으로 사용하는 컴포넌트

#### `services/`
- 백엔드 API와 통신하는 모든 로직
- 기능별로 파일 분리 (authAPI.ts, mealAPI.ts 등)
- 공통 설정은 `apiConfig.ts`에서 관리
- `index.ts`에서 모든 API를 한 곳에서 export (권장)

#### `constants/`
- 앱 전체에서 사용하는 상수
- 라우트 이름, 테마 설정 등

#### `types/`
- TypeScript 타입 정의
- 공통으로 사용하는 타입만 정의 (컴포넌트 전용 타입은 해당 파일 내부에)

## 🎯 네비게이션 사용법

### 라우트 상수 사용

```typescript
import {ROUTES} from '../constants/routes';

// 네비게이션
navigation.navigate(ROUTES.MEAL_ADD, {selectedFood: foodData});
```

### 타입 안전한 네비게이션

```typescript
import {RootStackParamList} from '../navigation/types';
import {useNavigation} from '@react-navigation/native';
import {NativeStackNavigationProp} from '@react-navigation/native-stack';

type NavigationProp = NativeStackNavigationProp<RootStackParamList>;

const navigation = useNavigation<NavigationProp>();
```

## 🎨 스타일링 가이드

### 테마 사용

```typescript
import {colors} from '../theme/colors';

const styles = StyleSheet.create({
  container: {
    backgroundColor: colors.background,
    color: colors.text,
  },
});
```

### SafeAreaView 사용

```typescript
import {SafeAreaView} from 'react-native-safe-area-context';

// 탭 화면에서는 상단만 safe area 적용
<SafeAreaView style={styles.container} edges={['top']}>
```

## 📝 타입 사용법

```typescript
import {Food, Meal, Exercise, User} from '../types';

const food: Food = {
  id: 1,
  name: '닭가슴살',
  calories: 200,
  carbs: 0,
  protein: 40,
  fat: 4,
};
```

## 🌐 API 호출 방법

### API 구조

API는 기능별로 분리되어 관리됩니다:

```
services/
├── apiConfig.ts    # 공통 설정 (BASE_URL, request 함수, 타입)
├── authAPI.ts      # 인증 관련 API
├── index.ts        # 모든 API 한 곳에서 export (권장)
└── api.ts         # 기존 호환성 유지 (deprecated)
```

### API 서비스 사용

**권장 방법: `services`에서 import**

```typescript
import {authAPI} from '../../services';

### 에러 처리 패턴

- Alert 사용 금지 (사용자 요청)
- 빨간 글씨로 에러 메시지 표시
- `error.message`를 활용하여 서버 에러 메시지 표시

```typescript
catch (error: any) {
  setError(error.message || '작업에 실패했습니다');
}
```

## 🔧 주요 상수

### 라우트 상수

모든 화면 이름은 `constants/routes.ts`에서 중앙 관리됩니다.

```typescript
import {ROUTES} from '../constants/routes';

navigation.navigate(ROUTES.HOME);
navigation.navigate(ROUTES.MEAL_ADD);
```

### 테마 상수

테마 관련 상수는 `constants/theme.ts`에서 관리됩니다.

```typescript
import {TAB_BAR_THEME, ICONS} from '../constants/theme';
```

## 🗂️ 파일 명명 규칙

- **화면**: `Screen.tsx` (예: `HomeScreen.tsx`)
- **모달**: `Modal.tsx` (예: `ProfileEditModal.tsx`)
- **컴포넌트**: PascalCase (예: `InbodyDateNavigator.tsx`)
- **타입**: `types/` 폴더에 정의
- **상수**: `constants/` 폴더에 정의

## 🔄 상태 관리

현재는 React Hooks (`useState`, `useEffect`)를 사용합니다.

### 토큰 관리

JWT 토큰은 `services/api.ts`에서 자동으로 관리됩니다. 수동으로 접근할 필요 없습니다.

```typescript
// 토큰은 자동으로 AsyncStorage에 저장/불러오기됨
// 별도 관리 불필요
```

### 로컬 저장소 사용 (필요시)

```typescript
import AsyncStorage from '@react-native-async-storage/async-storage';

// 저장
await AsyncStorage.setItem('key', JSON.stringify(data));

// 불러오기
const data = await AsyncStorage.getItem('key');
const parsed = data ? JSON.parse(data) : null;
```

## 📦 주요 의존성

- `@react-navigation/native`: 네비게이션
- `@react-native-async-storage/async-storage`: 로컬 저장소
- `@react-native-picker/picker`: 피커 컴포넌트
- `expo-image-picker`: 이미지 선택
- `react-native-svg`: SVG 그래프
- `@expo/vector-icons`: 아이콘

## 🐛 알려진 이슈 및 해결법

### Metro Bundler 캐시 문제

```bash
npm start -- --reset-cache
```

### iOS Pod 설치 필요

```bash
cd ios && pod install && cd ..
```

### Android 빌드 에러

```bash
cd android && ./gradlew clean && cd ..
```

## 📖 참고 자료

- [React Native 공식 문서](https://reactnative.dev/)
- [React Navigation](https://reactnavigation.org/)
- [Expo 공식 문서](https://docs.expo.dev/)
- [TypeScript 핸드북](https://www.typescriptlang.org/docs/)

## 💡 개발 팁 및 규칙

### 코드 작성 규칙

1. **에러 표시**: 
   - Alert 사용 금지
   - 빨간 글씨(`errorMessage` 스타일)로 에러 표시
   - 서버 에러 메시지는 `error.message` 활용

2. **텍스트 정렬**:
   - 성공 페이지 텍스트는 가운데 정렬
   - 입력 필드 텍스트는 왼쪽 정렬

3. **UI/UX**:
   - 모달 배경은 투명 (`transparent`)
   - placeholder 색상 통일: `rgba(255, 255, 255, 0.7)`

### 파일 추가 시

1. **새 화면 추가**: 
   - `src/screens/` 적절한 카테고리 폴더에 추가
   - `src/navigation/AppNavigator.tsx`에 라우트 등록
   - `src/constants/routes.ts`에 상수 추가

2. **새 모달 추가**:
   - `src/components/modals/`에 추가
   - 필요한 곳에서 import하여 사용

3. **타입 정의**:
   - 공통 타입은 `src/types/index.ts`에 추가
   - 특정 컴포넌트 전용 타입은 해당 파일 내부에 정의

4. **상수 추가**:
   - 라우트 관련: `constants/routes.ts`
   - 테마 관련: `constants/theme.ts`
   - 기타: 새로운 파일 생성 또는 적절한 파일에 추가

### API 통신

- 모든 API 호출은 `services/index.ts`에서 import (권장)
  - `import { authAPI, mealAPI } from '../../services'`
- 기능별로 API 파일 분리 (authAPI.ts, mealAPI.ts 등)
- 공통 설정은 `apiConfig.ts`에서 관리
- 인증 필요한 API는 자동으로 토큰 포함됨
- 에러는 catch 블록에서 처리하고 빨간 글씨로 표시

### 새 API 추가 시

1. `services/` 폴더에 새 API 파일 생성 (예: `mealAPI.ts`)
2. `apiConfig.ts`의 `request` 함수 사용
3. `services/index.ts`에 export 추가
4. 필요한 곳에서 import하여 사용

