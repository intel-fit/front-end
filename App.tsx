import React, {useEffect} from 'react';
import AppNavigator from './src/navigation/AppNavigator';
import {request} from './src/services/apiConfig';

function App() {
  useEffect(() => {
    // 앱 시작 시 테스트 유저 생성 API 호출
    const createTestUser = async () => {
      try {
        console.log('========================================');
        console.log('🚀 [APP] 테스트 유저 생성 API 호출 시작');
        console.log('📍 URL: https://intelfits.com/api/users/create-test-user');
        console.log('⏰ 시간:', new Date().toISOString());
        console.log('========================================');
        
        const response = await request('/api/users/create-test-user', {
          method: 'POST',
        });
        
        console.log('========================================');
        console.log('✅ [APP] 테스트 유저 생성 API 호출 성공');
        console.log('📦 응답 데이터:', JSON.stringify(response, null, 2));
        console.log('⏰ 완료 시간:', new Date().toISOString());
        console.log('========================================');
      } catch (error: any) {
        console.log('========================================');
        console.error('❌ [APP] 테스트 유저 생성 API 호출 실패');
        console.error('📦 에러 메시지:', error?.message || '알 수 없는 오류');
        console.error('📦 에러 상태:', error?.status);
        console.error('📦 에러 데이터:', error?.data);
        console.error('⏰ 실패 시간:', new Date().toISOString());
        console.log('========================================');
        // 에러가 발생해도 앱은 정상적으로 진행
      }
    };

    createTestUser();
  }, []);

  return <AppNavigator />;
}

export default App;
