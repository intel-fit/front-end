import Header from "../components/Header";
import "./HomePage.css";

export default function HomePage() {
  return (
    <div className="home-page">
      <Header title="홈" />
      <div className="divider"></div>
      <div className="home-content">
        {/* 인사말 섹션 */}
        <div className="greeting-section">
          <div className="profile-group">
            <div className="profile-image">
              <img src="/api/placeholder/50/50" alt="프로필" />
            </div>
            <div className="greeting-text">님 어서오세요😊</div>
          </div>
        </div>

        {/* 운동 진행률 섹션 */}
        <div className="exercise-progress-section">
          <div className="progress-grid">
            {[1, 2, 3, 4, 5, 6, 7].map((day) => (
              <div key={day} className="progress-item">
                <div className="progress-number">15</div>
                <div className="progress-calories">388k</div>
                <div className="progress-percentage">97%</div>
              </div>
            ))}
          </div>
        </div>

        {/* 칼로리 섹션 */}
        <div className="calorie-section">
          <div className="calorie-header">
            <div className="calorie-current">384</div>
            <div className="calorie-goal">/ 1,157kcal</div>
            <div className="calorie-percentage">30%</div>
          </div>
          <div className="calorie-progress-bar">
            <div className="calorie-progress-fill" style={{ width: '30%' }}></div>
          </div>
        </div>

        {/* 식단 추천 섹션 */}
        <div className="diet-recommendation-section">
          <div className="recommendation-content">
            <div className="recommendation-title">운동 잘 마무리 하셨나요?</div>
            <div className="recommendation-subtitle">저녁 식단으로</div>
            <div className="food-recommendations">
              <div className="food-item">닭가슴살 300g</div>
              <div className="food-item">단백질 쉐이크</div>
              <div className="food-item">구운 계란 2개</div>
            </div>
            <div className="recommendation-question">어떤가요?</div>
          </div>
        </div>

        {/* 추가 메뉴 섹션 */}
        <div className="additional-menu-section">
          <div className="menu-grid">
            <div className="menu-item weight-item">
              <div className="menu-title">체중</div>
              <div className="menu-value">51 / 58.6kg</div>
              <div className="menu-icon">+</div>
            </div>
            <div className="menu-item nutrition-item">
              <div className="nutrition-content">
                <div className="nutrition-line">탄 | 52g</div>
                <div className="nutrition-line">단 | 120g</div>
                <div className="nutrition-line">지 | 9g</div>
              </div>
            </div>
          </div>
        </div>
      </div>
    </div>
  );
}
