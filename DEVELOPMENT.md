# 개발 가이드

## 📁 프로젝트 구조 상세

```
src/
├── navigation/              # 네비게이션 설정
│   ├── AppNavigator.tsx    # 메인 네비게이션 설정
│   └── types.ts            # 네비게이션 타입 정의
│
├── screens/                # 화면 컴포넌트
│   ├── auth/               # 인증 화면
│   │   ├── SplashScreen.tsx
│   │   ├── LoginScreen.tsx
│   │   ├── SignupScreen.tsx
│   │   ├── FindIdScreen.tsx
│   │   └── ResetPasswordScreen.tsx
│   │
│   ├── main/               # 메인 탭 화면
│   │   ├── HomeScreen.tsx
│   │   ├── MyPageScreen.tsx
│   │   └── StatsScreen.tsx
│   │
│   ├── diet/               # 식단 관련 화면
│   │   ├── DietScreen.tsx
│   │   ├── MealAddScreen.tsx
│   │   ├── FoodSearchScreen.tsx
│   │   ├── MealDetailScreen.tsx
│   │   ├── MealRecommendScreen.tsx
│   │   ├── MealRecommendHistoryScreen.tsx
│   │   └── FoodAddOptionsScreen.tsx
│   │
│   ├── exercise/           # 운동 관련 화면
│   │   ├── ExerciseScreen.tsx
│   │   ├── ExerciseDetailScreen.tsx
│   │   ├── RoutineRecommendScreen.tsx
│   │   └── RoutineRecommendNewScreen.tsx
│   │
│   ├── analysis/           # 분석/통계 화면
│   │   ├── AnalysisScreen.tsx
│   │   ├── GraphScreen.tsx
│   │   ├── CalendarScreen.tsx
│   │   └── GoalScreen.tsx
│   │
│   ├── inbody/             # 인바디 관련 화면
│   │   ├── InBodyScreen.tsx
│   │   └── InBodyManualScreen.tsx
│   │
│   └── chatbot/            # 챗봇 화면
│       └── ChatbotScreen.tsx
│
├── components/             # 재사용 컴포넌트
│   ├── modals/             # 모달 컴포넌트
│   │   ├── AIAnalysisModal.tsx
│   │   ├── BadgeModal.tsx
│   │   ├── BadgeListModal.tsx
│   │   ├── ExerciseModal.tsx
│   │   ├── FoodAddOptionsModal.tsx
│   │   ├── FoodDirectInputModal.tsx
│   │   ├── InBodyPhotoModal.tsx
│   │   ├── MealRecommendModal.tsx
│   │   ├── MyPlanModal.tsx
│   │   ├── PaymentMethodModal.tsx
│   │   ├── ProfileEditModal.tsx
│   │   └── RoutineRecommendModal.tsx
│   │
│   └── common/             # 공통 컴포넌트
│       ├── InbodyDateNavigator.tsx
│       └── InBodyManualForm.tsx
│
├── constants/              # 상수 정의
│   ├── routes.ts           # 라우트 이름 상수
│   └── theme.ts            # 테마 상수
│
├── types/                  # TypeScript 타입 정의
│   └── index.ts            # 공통 타입 (User, Food, Meal, Exercise 등)
│
├── theme/                  # 테마 설정
│   ├── colors.ts           # 색상 정의
│   └── styles.ts           # 공통 스타일
│
├── utils/                  # 유틸리티 함수 (예정)
├── hooks/                  # 커스텀 훅 (예정)
└── assets/                 # 이미지 등 리소스
    └── images/
        └── chatbot.png
```

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

### 공통 스타일

```typescript
import {commonStyles} from '../theme/styles';
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

## 🔧 주요 상수

### 라우트 상수

모든 화면 이름은 `constants/routes.ts`에서 중앙 관리됩니다.

```typescript
import {ROUTES} from '../constants/routes';

ROUTES.HOME          // 'Home'
ROUTES.MEAL_ADD      // 'MealAdd'
ROUTES.EXERCISE      // 'Exercise'
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

### 로컬 저장소 사용

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

## 💡 개발 팁

1. **새 화면 추가 시**: 
   - `src/screens/` 적절한 카테고리 폴더에 추가
   - `src/navigation/AppNavigator.tsx`에 라우트 등록
   - `src/constants/routes.ts`에 상수 추가

2. **새 모달 추가 시**:
   - `src/components/modals/`에 추가
   - 필요한 곳에서 import하여 사용

3. **타입 정의**:
   - 공통 타입은 `src/types/index.ts`에 추가
   - 특정 컴포넌트 전용 타입은 해당 파일 내부에 정의

4. **상수 추가**:
   - 라우트 관련: `constants/routes.ts`
   - 테마 관련: `constants/theme.ts`
   - 기타: 새로운 파일 생성 또는 적절한 파일에 추가

