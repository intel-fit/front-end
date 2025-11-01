# React Native 설치 및 실행 가이드

## 사전 요구사항

### 공통
- Node.js 14 이상
- npm 또는 yarn
- Git

### iOS 개발 (macOS만 해당)
- Xcode 12 이상
- CocoaPods
- iOS Simulator 또는 실제 iOS 기기

### Android 개발
- Android Studio
- Android SDK
- Java Development Kit (JDK) 11
- Android Emulator 또는 실제 Android 기기

---

## 1. 개발 환경 설정

### macOS (iOS + Android)

```bash
# Homebrew 설치 (이미 있다면 스킵)
/bin/bash -c "$(curl -fsSL https://raw.githubusercontent.com/Homebrew/install/HEAD/install.sh)"

# Node.js 설치
brew install node

# Watchman 설치 (파일 변경 감지)
brew install watchman

# CocoaPods 설치 (iOS용)
sudo gem install cocoapods

# JDK 설치 (Android용)
brew install --cask adoptopenjdk11
```

### Windows (Android만)

1. Node.js 설치: https://nodejs.org/
2. Android Studio 설치: https://developer.android.com/studio
3. JDK 11 설치
4. 환경 변수 설정:
   - `ANDROID_HOME`: Android SDK 경로
   - `JAVA_HOME`: JDK 경로

---

## 2. React Native CLI 설치

```bash
# React Native CLI 전역 설치
npm install -g react-native-cli
```

---

## 3. 프로젝트 설정

### 기존 웹 프로젝트 백업

```bash
cd /Users/nugu/Desktop/intelfit/front-end

# 웹용 파일 백업
mv package.json package.json.web
mv node_modules node_modules.web.backup  # 선택사항
mv src src.web.backup  # 선택사항
```

### React Native 프로젝트 설정

```bash
# React Native용 package.json 활성화
mv package.json.rn package.json

# 의존성 설치
npm install

# iOS용 추가 설치 (macOS만)
cd ios
pod install
cd ..
```

### 추가 필수 패키지 설치

```bash
# Picker (회원가입 화면용)
npm install @react-native-picker/picker

# AsyncStorage (로컬 저장소)
npm install @react-native-async-storage/async-storage

# iOS Pod 업데이트 (macOS만)
cd ios && pod install && cd ..
```

---

## 4. 앱 실행

### iOS (macOS만)

```bash
# Metro Bundler 시작
npm start

# 새 터미널에서 iOS 앱 실행
npm run ios

# 특정 디바이스로 실행
npm run ios -- --simulator="iPhone 14 Pro"
```

**또는 Xcode로 실행:**
1. `ios/IntelfitMobile.xcworkspace` 열기 (`.xcodeproj` 아님!)
2. 디바이스/시뮬레이터 선택
3. Run 버튼 클릭

### Android

```bash
# 먼저 Android Emulator 실행 또는 실제 기기 연결

# Metro Bundler 시작
npm start

# 새 터미널에서 Android 앱 실행
npm run android
```

**또는 Android Studio로 실행:**
1. `android/` 폴더를 Android Studio로 열기
2. AVD Manager에서 에뮬레이터 실행
3. Run 버튼 클릭

---

## 5. 개발 모드

### Metro Bundler

앱 실행 중 Metro Bundler 창에서:
- `r` - 리로드
- `d` - 개발자 메뉴
- `i` - iOS 실행
- `a` - Android 실행

### 개발자 메뉴

**iOS Simulator:**
- `Cmd + D` - 개발자 메뉴

**Android Emulator:**
- `Cmd + M` (macOS) 또는 `Ctrl + M` (Windows/Linux)

**실제 기기:**
- 기기를 흔들기

### 주요 개발 도구

- **Fast Refresh**: 코드 저장 시 자동 리로드
- **React DevTools**: React 컴포넌트 디버깅
- **Flipper**: 네트워크, 레이아웃 디버깅

---

## 6. 빌드 (Release)

### iOS

```bash
# Xcode에서:
# 1. Product > Scheme > Edit Scheme
# 2. Build Configuration을 "Release"로 변경
# 3. Product > Archive

# 또는 명령줄:
cd ios
xcodebuild -workspace IntelfitMobile.xcworkspace \
  -scheme IntelfitMobile \
  -configuration Release \
  -archivePath build/IntelfitMobile.xcarchive \
  archive
```

### Android

```bash
# Release APK 생성
cd android
./gradlew assembleRelease

# 생성된 APK 위치:
# android/app/build/outputs/apk/release/app-release.apk

# AAB (App Bundle) 생성
./gradlew bundleRelease

# 생성된 AAB 위치:
# android/app/build/outputs/bundle/release/app-release.aab
```

---

## 7. 문제 해결

### iOS 관련

**문제: Pods 에러**
```bash
cd ios
rm -rf Pods Podfile.lock
pod deintegrate
pod install
cd ..
```

**문제: Build failed**
```bash
# Xcode 캐시 삭제
rm -rf ~/Library/Developer/Xcode/DerivedData

# 프로젝트 클린
cd ios
xcodebuild clean
cd ..
```

### Android 관련

**문제: Gradle 에러**
```bash
cd android
./gradlew clean
cd ..
```

**문제: SDK 에러**
- Android Studio > SDK Manager에서 필요한 SDK 설치
- `ANDROID_HOME` 환경 변수 확인

### Metro Bundler 관련

**문제: 캐시 문제**
```bash
# Metro 캐시 삭제
npm start -- --reset-cache

# 또는
npx react-native start --reset-cache
```

**문제: Port 8081 충돌**
```bash
# 포트 사용 중인 프로세스 종료
lsof -ti:8081 | xargs kill

# 또는 다른 포트 사용
npm start -- --port 8088
```

### 일반적인 문제

**문제: node_modules 꼬임**
```bash
rm -rf node_modules package-lock.json
npm install
```

**문제: iOS Pods 꼬임**
```bash
cd ios
rm -rf Pods Podfile.lock
pod install --repo-update
cd ..
```

---

## 8. 유용한 명령어

```bash
# 의존성 업데이트
npm update

# 특정 패키지 재설치
npm install <package-name> --force

# React Native 버전 확인
npx react-native --version

# 연결된 기기 확인 (Android)
adb devices

# 로그 확인
# iOS
npx react-native log-ios

# Android
npx react-native log-android
```

---

## 9. 디버깅

### React DevTools

```bash
npm install -g react-devtools
react-devtools
```

### Flipper

1. Flipper 설치: https://fbflipper.com/
2. 앱 실행
3. Flipper에서 앱 연결

### Chrome DevTools

1. 개발자 메뉴에서 "Debug JS Remotely" 선택
2. `http://localhost:8081/debugger-ui/` 열림
3. Chrome DevTools 사용

---

## 10. 배포 준비

### iOS (App Store)

1. Apple Developer 계정 필요
2. Xcode에서 Archive
3. App Store Connect에 업로드
4. TestFlight 또는 출시

### Android (Google Play)

1. Google Play Console 계정 필요
2. Release AAB 생성
3. Google Play Console에 업로드
4. 내부 테스트 또는 출시

### 서명 설정

**Android:**
- `android/app/build.gradle`에서 서명 설정
- Keystore 파일 생성 및 관리

**iOS:**
- Xcode에서 Signing & Capabilities 설정
- 인증서 및 프로비저닝 프로파일 관리

---

## 참고 자료

- [React Native 공식 문서](https://reactnative.dev/)
- [React Navigation](https://reactnavigation.org/)
- [React Native Directory](https://reactnative.directory/)
- [Stack Overflow - React Native](https://stackoverflow.com/questions/tagged/react-native)

---

## 도움이 필요한 경우

1. React Native 공식 문서 확인
2. GitHub Issues 검색
3. Stack Overflow에서 질문
4. React Native Community Discord 참여

---

**마지막 업데이트**: 2025-11-01

