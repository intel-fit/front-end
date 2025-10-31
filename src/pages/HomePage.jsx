import { useNavigate } from "react-router-dom";
import Header from "../components/Header";
import styles from "./HomePage.module.css";

export default function HomePage() {
  const navigate = useNavigate();

  const handleCalendarClick = () => {
    navigate("/calendar");
  };

  return (
    <div className={styles['home-page']}>
      <Header title="홈" />
      <div className={styles.divider}></div>
      <div className={styles['home-content']}>
        {/* 인사말 섹션 */}
        <div className={styles['greeting-section']}>
          <div className={styles['profile-group']}>
            <div className={styles['profile-image']}>
              <div className={styles['profile-placeholder']}>👤</div>
            </div>
            <div className={styles['greeting-text']}>님 어서오세요😊</div>
          </div>
        </div>

        {/* 운동 진행률 섹션 */}
        <div className={styles['exercise-progress-section']} onClick={handleCalendarClick} style={{ cursor: 'pointer' }}>
          <div className={styles['progress-grid']}>

            {[1, 2, 3, 4, 5, 6, 7].map((day) => (
              <div key={day} className={styles['progress-item']}>
                <div className={`${styles['progress-number']} ${day === 4 ? styles.today : ''}`}>15</div>
                <div className={styles['progress-calories']}>388k</div>
                <div className={styles['progress-percentage']}>97%</div>
              </div>
            ))}
          </div>
        </div>

        {/* 칼로리 섹션 */}
        <div className={styles['calorie-section']}>
          <div className={styles['calorie-header']}>
            <div className={styles['calorie-left']}>
              <span className={styles['calorie-current']}>384</span>
              <span className={styles['calorie-goal']}>/ 1,157kcal</span>
            </div>
            <div className={styles['calorie-percentage']}>30%</div>
          </div>
          <div className={styles['calorie-progress-bar']}>
            <div className={styles['calorie-progress-fill']} style={{ width: '30%' }}></div>
          </div>
        </div>

        {/* 식단 추천 섹션 */}
        <div className={styles['diet-recommendation-section']}>
          <div className={styles['recommendation-content']}>
            <div className={styles['recommendation-title']}>운동 잘 마무리 하셨나요?</div>
            <div className={styles['recommendation-subtitle']}>저녁 식단으로</div>
            <div className={styles['food-recommendations']}>
              <div className={styles['food-item']}>닭가슴살 300g</div>
              <div className={styles['food-item']}>단백질 쉐이크</div>
              <div className={styles['food-item']}>구운 계란 2개</div>
            </div>
            <div className={styles['recommendation-question']}>어떤가요?</div>
          </div>
        </div>

        {/* 추가 메뉴 섹션 */}
        <div className={styles['additional-menu-section']}>
          <div className={styles['menu-grid-3x1']}>
            <div className={`${styles['menu-item']} ${styles['weight-item']}`}>
              <div className={styles['menu-title']}>체중</div>
              <div className={styles['menu-value']}>51 / 58.6kg</div>
            </div>
            <div className={`${styles['menu-item']} ${styles['nutrition-item']}`}>
              <div className={styles['nutrition-content']}>
                <div className={styles['nutrition-line']}>탄 | 52g</div>
                <div className={styles['nutrition-line']}>단 | 120g</div>
                <div className={styles['nutrition-line']}>지 | 9g</div>
              </div>
            </div>
            <div className={`${styles['menu-item']} ${styles['plus-item']}`}>
              <div className={styles['plus-button']}>
                <div className={styles['plus-icon']}>+</div>
              </div>
            </div>
          </div>
        </div>
      </div>
    </div>
  );
}
