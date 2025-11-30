# 되돌릴 수 있는 변경 사항 기록

## 날짜: 2025-11-30
## 변경 내용: 운동 저장 API에 `date` 필드 추가

### 변경된 파일들:

#### 1. `src/utils/exerciseApi.ts`

**변경 전:**
```typescript
export interface SaveWorkoutTitleRequest {
  userId: number;
  saveTitle: string;
  intensity?: number[];
  feedback?: string[];
}

export const saveWorkoutTitle = async (
  userId: number,
  saveTitle: string,
  intensity?: number[],
  feedback?: string[]
): Promise<SaveWorkoutTitleResponse> => {
  // ...
  const payload: SaveWorkoutTitleRequest = {
    userId,
    saveTitle,
    ...(intensity && intensity.length > 0 && { intensity }),
    ...(feedback && feedback.length > 0 && { feedback }),
  };
}
```

**변경 후:**
```typescript
export interface SaveWorkoutTitleRequest {
  userId: number;
  saveTitle: string;
  date?: string; // YYYY-MM-DD 형식의 날짜 (백엔드 스펙에 따라 추가됨)
  intensity?: number[];
  feedback?: string[];
}

export const saveWorkoutTitle = async (
  userId: number,
  saveTitle: string,
  date?: string,
  intensity?: number[],
  feedback?: string[]
): Promise<SaveWorkoutTitleResponse> => {
  // ...
  const payload: SaveWorkoutTitleRequest = {
    userId,
    saveTitle,
    ...(date && { date }),
    ...(intensity && intensity.length > 0 && { intensity }),
    ...(feedback && feedback.length > 0 && { feedback }),
  };
}
```

#### 2. `src/screens/exercise/ExerciseScreen.tsx`

**변경 전:**
```typescript
const response = await saveWorkoutTitle(
  userIdNum,
  trimmedTitle,
  intensityList,
  feedbackList
);
```

**변경 후:**
```typescript
// 선택된 날짜 또는 오늘 날짜를 YYYY-MM-DD 형식으로 변환
const activeDate = selectedDate || new Date();
const activeDateStr = formatDateToString(activeDate);

const response = await saveWorkoutTitle(
  userIdNum,
  trimmedTitle,
  activeDateStr,
  intensityList,
  feedbackList
);
```

#### 3. `src/utils/exerciseApi.ts` - `WorkoutSession` 인터페이스 및 `postWorkoutSession` 함수

**변경 전:**
```typescript
export interface WorkoutSession {
  sessionId?: string;
  exerciseName: string;
  category: string;
  workoutDate: string; // ISO string
  sets: WorkoutSet[];
  userId: number | string;
  exerciseId?: string;
  imageUrl?: string;
  exerciseImageUrl?: string;
  image?: string;
  imgUrl?: string;
  photoUrl?: string;
}

export const postWorkoutSession = async (
  payload: WorkoutSession
): Promise<any> => {
  // ...
  const response = await axios.post(WORKOUTS_API_URL, payload, {
    // ...
  });
}
```

**변경 후:**
```typescript
export interface WorkoutSession {
  sessionId?: string;
  exerciseName: string;
  category: string;
  workoutDate: string; // ISO string
  date?: string; // YYYY-MM-DD 형식의 날짜 (백엔드 스펙에 따라 추가됨)
  sets: WorkoutSet[];
  userId: number | string;
  exerciseId?: string;
  imageUrl?: string;
  exerciseImageUrl?: string;
  image?: string;
  imgUrl?: string;
  photoUrl?: string;
}

export const postWorkoutSession = async (
  payload: WorkoutSession
): Promise<any> => {
  // workoutDate를 YYYY-MM-DD 형식으로 변환하여 date 필드 추가
  let dateStr: string | undefined;
  if (payload.workoutDate) {
    try {
      const dateObj = new Date(payload.workoutDate);
      if (!isNaN(dateObj.getTime())) {
        const year = dateObj.getFullYear();
        const month = String(dateObj.getMonth() + 1).padStart(2, "0");
        const day = String(dateObj.getDate()).padStart(2, "0");
        dateStr = `${year}-${month}-${day}`;
      }
    } catch (e) {
      // 날짜 파싱 실패 시 무시
    }
  }

  const requestPayload: WorkoutSession = {
    ...payload,
    ...(dateStr && !payload.date && { date: dateStr }),
  };

  const response = await axios.post(WORKOUTS_API_URL, requestPayload, {
    // ...
  });
}
```

### 되돌리는 방법:

위의 "변경 전" 코드로 다시 변경하면 됩니다.

