#!/bin/bash
echo "🚀 Expo로 React Native 앱 실행하기"
echo ""

# 1. 설정 교체
echo "1️⃣ Expo 설정으로 전환..."
[ -f package.json ] && mv package.json package.json.backup
cp package.json.expo package.json
cp app.json.expo app.json

# 2. 의존성 설치
echo ""
echo "2️⃣ 의존성 설치 중..."
npm install

# 3. 실행 안내
echo ""
echo "✅ 설치 완료!"
echo ""
echo "📱 이제 다음 명령으로 실행하세요:"
echo ""
echo "   npm start"
echo ""
echo "그리고 스마트폰으로 QR 코드를 스캔하세요!"
echo ""
echo "💡 Expo Go 앱이 필요합니다:"
echo "   iOS: App Store에서 'Expo Go' 검색"
echo "   Android: Play Store에서 'Expo Go' 검색"
echo ""
