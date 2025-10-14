import { useState } from "react";
import Header from "../components/Header";
import BadgeModal from "../components/BadgeModal";
import BadgeListModal from "../components/BadgeListModal";
import InBodyInputModal from "../components/InBodyInputModal";
import InBodyPhotoModal from "../components/InBodyPhotoModal";
import InBodyManualModal from "../components/InBodyManualModal";
import InBodyHistoryModal from "../components/InBodyHistoryModal";
import AIAnalysisModal from "../components/AIAnalysisModal";
import MyPlanModal from "../components/MyPlanModal";
import PaymentMethodModal from "../components/PaymentMethodModal";
import ProfileEditModal from "../components/ProfileEditModal";
import "./MyPage.css";
import {
  IoPersonOutline,
  IoPencilOutline,
  IoChevronForwardOutline,
} from "react-icons/io5";
import { FaCrown, FaMedal, FaDumbbell, FaFire } from "react-icons/fa";

export default function MyPage() {
  const [selectedBadge, setSelectedBadge] = useState(null);
  const [isBadgeModalOpen, setIsBadgeModalOpen] = useState(false);
  const [isBadgeListModalOpen, setIsBadgeListModalOpen] = useState(false);
  const [isInBodyInputModalOpen, setIsInBodyInputModalOpen] = useState(false);
  const [isInBodyPhotoModalOpen, setIsInBodyPhotoModalOpen] = useState(false);
  const [isInBodyManualModalOpen, setIsInBodyManualModalOpen] = useState(false);
  const [isInBodyHistoryModalOpen, setIsInBodyHistoryModalOpen] =
    useState(false);
  const [isAIAnalysisModalOpen, setIsAIAnalysisModalOpen] = useState(false);
  const [isMyPlanModalOpen, setIsMyPlanModalOpen] = useState(false);
  const [isPaymentMethodModalOpen, setIsPaymentMethodModalOpen] =
    useState(false);
  const [isProfileEditModalOpen, setIsProfileEditModalOpen] = useState(false);

  const handleBadgeClick = (badgeType) => {
    setSelectedBadge({ type: badgeType });
    setIsBadgeModalOpen(true);
  };

  const handleBadgeModalClose = () => {
    setIsBadgeModalOpen(false);
    setSelectedBadge(null);
  };

  const handleViewAllClick = () => {
    setIsBadgeListModalOpen(true);
  };

  const handleBadgeListModalClose = () => {
    setIsBadgeListModalOpen(false);
  };

  const handleBadgeItemClick = (badge) => {
    setIsBadgeListModalOpen(false);
    setSelectedBadge(badge);
    setIsBadgeModalOpen(true);
  };

  // InBody 관련 핸들러
  const handleInBodyInputClick = () => {
    setIsInBodyInputModalOpen(true);
  };

  const handleInBodyInputModalClose = () => {
    setIsInBodyInputModalOpen(false);
  };

  const handleSelectPhoto = () => {
    setIsInBodyInputModalOpen(false);
    setIsInBodyPhotoModalOpen(true);
  };

  const handleSelectManual = () => {
    setIsInBodyInputModalOpen(false);
    setIsInBodyManualModalOpen(true);
  };

  const handleInBodyPhotoModalClose = () => {
    setIsInBodyPhotoModalOpen(false);
  };

  const handleInBodyManualModalClose = () => {
    setIsInBodyManualModalOpen(false);
  };

  const handleInBodySave = (data) => {
    console.log("InBody 데이터 저장:", data);
    alert("검사 결과가 저장되었습니다!");
    setIsInBodyPhotoModalOpen(false);
    setIsInBodyManualModalOpen(false);
  };

  const handleInBodyHistoryClick = () => {
    setIsInBodyHistoryModalOpen(true);
  };

  const handleInBodyHistoryModalClose = () => {
    setIsInBodyHistoryModalOpen(false);
  };

  // AI 분석 핸들러
  const handleAIAnalysisClick = () => {
    setIsAIAnalysisModalOpen(true);
  };

  const handleAIAnalysisModalClose = () => {
    setIsAIAnalysisModalOpen(false);
  };

  // 내 플랜 핸들러
  const handleMyPlanClick = () => {
    setIsMyPlanModalOpen(true);
  };

  const handleMyPlanModalClose = () => {
    setIsMyPlanModalOpen(false);
  };

  // 결제 수단 핸들러
  const handlePaymentMethodClick = () => {
    setIsPaymentMethodModalOpen(true);
  };

  const handlePaymentMethodModalClose = () => {
    setIsPaymentMethodModalOpen(false);
  };

  // 프로필 수정 핸들러
  const handleProfileEditClick = () => {
    setIsProfileEditModalOpen(true);
  };

  const handleProfileEditModalClose = () => {
    setIsProfileEditModalOpen(false);
  };
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
          </div>
          <IoPencilOutline
            className="edit-icon"
            onClick={handleProfileEditClick}
          />
        </div>

        {/* 뱃지 섹션 */}
        <div className="badges-section">
          <div className="badges-header">
            <span className="badges-title">
              뱃지 <span className="badge-count">23</span>/80
            </span>
            <span className="view-details" onClick={handleViewAllClick}>
              자세히 보기 <IoChevronForwardOutline />
            </span>
          </div>
          <div className="badges-display">
            <div
              className="badge purple"
              onClick={() => handleBadgeClick("purple")}
            >
              <FaMedal />
            </div>
            <div
              className="badge blue"
              onClick={() => handleBadgeClick("blue")}
            >
              <FaDumbbell />
            </div>
            <div className="badge red" onClick={() => handleBadgeClick("red")}>
              <FaFire />
            </div>
          </div>
        </div>

        {/* InBody 섹션 */}
        <div className="inbody-section">
          <div className="section-title">InBody</div>
          <div className="section-links">
            <div className="link-item" onClick={handleInBodyInputClick}>
              검사결과 입력하기
            </div>
            <div className="link-item" onClick={handleInBodyHistoryClick}>
              전체 내역보기
            </div>
          </div>
          <button className="ai-analysis-btn" onClick={handleAIAnalysisClick}>
            AI 분석 받기
          </button>
        </div>

        {/* 구독/결제 섹션 */}
        <div className="subscription-section">
          <div className="section-title">구독/결제</div>
          <div className="section-links">
            <div className="link-item" onClick={handleMyPlanClick}>
              내 플랜 보기
            </div>
            <div className="link-item" onClick={handlePaymentMethodClick}>
              결제 수단 관리
            </div>
          </div>
        </div>
      </div>

      {/* 뱃지 상세 모달 */}
      <BadgeModal
        isOpen={isBadgeModalOpen}
        onClose={handleBadgeModalClose}
        badge={selectedBadge}
      />

      {/* 뱃지 목록 모달 */}
      <BadgeListModal
        isOpen={isBadgeListModalOpen}
        onClose={handleBadgeListModalClose}
        onBadgeClick={handleBadgeItemClick}
      />

      {/* InBody 입력 방식 선택 모달 */}
      <InBodyInputModal
        isOpen={isInBodyInputModalOpen}
        onClose={handleInBodyInputModalClose}
        onSelectPhoto={handleSelectPhoto}
        onSelectManual={handleSelectManual}
      />

      {/* InBody 사진 인식 모달 */}
      <InBodyPhotoModal
        isOpen={isInBodyPhotoModalOpen}
        onClose={handleInBodyPhotoModalClose}
        onSave={handleInBodySave}
      />

      {/* InBody 수기 입력 모달 */}
      <InBodyManualModal
        isOpen={isInBodyManualModalOpen}
        onClose={handleInBodyManualModalClose}
        onSave={handleInBodySave}
      />

      {/* InBody 전체 내역 모달 */}
      <InBodyHistoryModal
        isOpen={isInBodyHistoryModalOpen}
        onClose={handleInBodyHistoryModalClose}
      />

      {/* AI 분석 모달 */}
      <AIAnalysisModal
        isOpen={isAIAnalysisModalOpen}
        onClose={handleAIAnalysisModalClose}
      />

      {/* 내 플랜 모달 */}
      <MyPlanModal
        isOpen={isMyPlanModalOpen}
        onClose={handleMyPlanModalClose}
      />

      {/* 결제 수단 관리 모달 */}
      <PaymentMethodModal
        isOpen={isPaymentMethodModalOpen}
        onClose={handlePaymentMethodModalClose}
      />

      {/* 프로필 수정 모달 */}
      <ProfileEditModal
        isOpen={isProfileEditModalOpen}
        onClose={handleProfileEditModalClose}
      />
    </div>
  );
}
