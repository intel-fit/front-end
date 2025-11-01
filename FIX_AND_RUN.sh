#!/bin/bash
echo "🔧 Metro 에러 해결 및 Expo 실행"
echo ""

# 1. npm 캐시 권한 수정
echo "1️⃣ npm 캐시 권한 수정..."
sudo chown -R $(whoami) "$HOME/.npm"

# 2. 기존 파일 정리
echo ""
echo "2️⃣ 기존 node_modules 삭제..."
rm -rf node_modules package-lock.json

# 3. package.json 교체
echo ""
echo "3️⃣ Expo 설정 활성화..."
cp package.json.expo package.json
cp app.json.expo app.json

# 4. 의존성 재설치
echo ""
echo "4️⃣ 의존성 설치 중... (시간이 걸릴 수 있습니다)"
npm install

# 5. 실행
echo ""
echo "✅ 설치 완료!"
echo ""
echo "🚀 이제 앱을 실행합니다..."
echo ""
npm start

