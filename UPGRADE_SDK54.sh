#!/bin/bash
echo "🔄 Expo SDK 54로 업그레이드 중..."
echo ""

# 1. npm 캐시 권한 수정
echo "1️⃣ npm 캐시 권한 수정..."
sudo chown -R 501:20 "$HOME/.npm"

# 2. 의존성 설치
echo ""
echo "2️⃣ 새 의존성 설치 중... (2-3분 소요)"
cd /Users/nugu/Desktop/intelfit/front-end
npm install

# 3. 캐시 클리어
echo ""
echo "3️⃣ 캐시 클리어..."
npx expo start --clear

echo ""
echo "✅ 업그레이드 완료!"
echo ""
echo "📱 이제 스마트폰의 Expo Go 앱에서 QR 코드를 스캔하세요!"

