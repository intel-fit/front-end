# 📱 Expo로 간단하게 실행하기

## 왜 Expo?

- ✅ iOS/Android 네이티브 폴더 필요 없음
- ✅ QR 코드로 실제 기기에서 바로 테스트
- ✅ 설정이 훨씬 간단
- ✅ 핫 리로드 빠름

---

## 🚀 빠른 시작 (3단계)

### 1️⃣ Expo 설정으로 전환

```bash
# 현재 디렉토리 확인
cd /Users/nugu/Desktop/intelfit/front-end

# 웹 package.json 백업 (이미 했으면 스킵)
mv package.json package.json.web 2>/dev/null || true

# Expo 설정 활성화
cp package.json.expo package.json
cp app.json.expo app.json

# 의존성 설치
npm install
```

### 2️⃣ Expo Go 앱 설치

**스마트폰에 Expo Go 앱 설치:**
- iOS: [App Store에서 "Expo Go" 검색](https://apps.apple.com/app/expo-go/id982107779)
- Android: [Play Store에서 "Expo Go" 검색](https://play.google.com/store/apps/details?id=host.exp.exponent)

### 3️⃣ 앱 실행

```bash
# 개발 서버 시작
npm start

# 또는 npx로 실행
npx expo start
```

그러면 터미널에 **QR 코드**가 나옵니다!

📱 **스마트폰으로 QR 코드 스캔하면 앱이 바로 실행됩니다!**

---

## 📱 실행 옵션

```bash
# 1. QR 코드로 실행 (추천)
npm start
# → 폰으로 QR 코드 스캔

# 2. iOS 시뮬레이터 (macOS만, Xcode 필요)
npm run ios

# 3. Android 에뮬레이터 (Android Studio 필요)
npm run android

# 4. 웹 브라우저에서 테스트
npm run web
```

---

## 🔧 이미지 피커 변경 필요

Expo에서는 이미지 피커를 `expo-image-picker`로 교체해야 합니다.

**변경할 파일:** `src/screens/MealAddScreen.tsx`

```typescript
// 기존 (React Native CLI)
import {launchCamera, launchImageLibrary} from 'react-native-image-picker';

// 변경 (Expo)
import * as ImagePicker from 'expo-image-picker';

// 사용법
const handlePhotoUpload = async () => {
  const result = await ImagePicker.launchImageLibraryAsync({
    mediaTypes: ImagePicker.MediaTypeOptions.Images,
    quality: 0.8,
  });

  if (!result.canceled && result.assets[0]) {
    setPhotos([...photos, result.assets[0].uri]);
  }
};
```

---

## ⚡ 빠른 해결 방법 (올인원)

터미널에서 한 번에:

```bash
cd /Users/nugu/Desktop/intelfit/front-end

# 설정 교체
mv package.json package.json.web 2>/dev/null || true
cp package.json.expo package.json
cp app.json.expo app.json

# 의존성 설치
npm install

# 실행!
npm start
```

스마트폰에서 Expo Go 앱으로 QR 코드 스캔하면 끝! 🎉

---

## 🐛 문제 해결

### 1. "Metro bundler가 실행 안 됨"
```bash
# 캐시 삭제 후 재시작
npm start -- --clear
```

### 2. "QR 코드가 안 보임"
```bash
# 터널 모드로 실행
npx expo start --tunnel
```

### 3. "폰에서 연결 안 됨"
- PC와 폰이 같은 Wi-Fi에 연결되어 있는지 확인
- 방화벽 확인

---

## 📦 설치된 패키지 (Expo 버전)

- `expo` - Expo SDK
- `expo-image-picker` - 이미지 선택 (react-native-image-picker 대체)
- `@react-navigation/*` - 네비게이션 (동일)
- `react-native-vector-icons` - 아이콘 (동일)
- 기타 모든 패키지 (Expo 호환 버전)

---

## 💡 Expo vs React Native CLI

| 기능 | Expo | React Native CLI |
|------|------|------------------|
| 초기 설정 | ⭐⭐⭐⭐⭐ 매우 쉬움 | ⭐⭐ 복잡 |
| 실제 기기 테스트 | ⭐⭐⭐⭐⭐ QR 코드 | ⭐⭐ USB 필요 |
| 개발 속도 | ⭐⭐⭐⭐⭐ 빠름 | ⭐⭐⭐ 보통 |
| 커스터마이징 | ⭐⭐⭐⭐ 좋음 | ⭐⭐⭐⭐⭐ 최고 |
| 빌드 | ⭐⭐⭐⭐⭐ EAS Build | ⭐⭐⭐ 로컬 빌드 |

**결론**: 개발 초기에는 Expo가 훨씬 편합니다! 🚀

---

## 🎯 다음 단계

1. ✅ `npm start` 실행
2. ✅ Expo Go 앱에서 QR 스캔
3. ✅ 앱 테스트
4. ⏳ 필요하면 `MealAddScreen.tsx` 이미지 피커 수정
5. ⏳ 실제 API 연동

---

**모든 준비 완료!** 이제 `npm start` 실행하고 QR 코드 스캔하세요! 📱✨

