import Header from "../components/Header";
import "./MyPage.css";
import {
  IoPersonOutline,
  IoPencilOutline,
  IoChevronForwardOutline,
} from "react-icons/io5";
import { FaCrown, FaMedal, FaDumbbell, FaFire } from "react-icons/fa";

export default function MyPage() {
  return (
    <div className="mypage">
      <Header title="마이페이지" />

      <div className="mypage-content">
        {/* 사용자 프로필 섹션 */}
        <div className="profile-section">
          <div className="profile-info">
            <div className="profile-avatar">
              <IoPersonOutline />
            </div>
            <div className="profile-details">
              <div className="username">
                김민수님 <FaCrown className="crown-icon" />
              </div>
              <div className="user-title">풀업의 신</div>
            </div>
            <IoPencilOutline className="edit-icon" />
          </div>
        </div>

        {/* 뱃지 섹션 */}
        <div className="badges-section">
          <div className="badges-header">
            <span className="badges-title">
              뱃지 <span className="badge-count">23</span>/80
            </span>
            <span className="view-details">
              자세히 보기 <IoChevronForwardOutline />
            </span>
          </div>
          <div className="badges-display">
            <div className="badge purple">
              <FaMedal />
            </div>
            <div className="badge blue">
              <FaDumbbell />
            </div>
            <div className="badge red">
              <FaFire />
            </div>
          </div>
        </div>

        {/* InBody 섹션 */}
        <div className="inbody-section">
          <div className="section-title">InBody</div>
          <div className="section-links">
            <div className="link-item">검사결과 입력하기</div>
            <div className="link-item">전체 내역보기</div>
          </div>
          <button className="ai-analysis-btn">AI 분석 받기</button>
        </div>

        {/* 구독/결제 섹션 */}
        <div className="subscription-section">
          <div className="section-title">구독/결제</div>
          <div className="section-links">
            <div className="link-item">내 플랜 보기</div>
            <div className="link-item">결제 수단 관리</div>
          </div>
        </div>
      </div>
    </div>
  );
}
