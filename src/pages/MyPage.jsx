import { useState, useEffect } from "react";
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
  const [editInBodyData, setEditInBodyData] = useState(null);
  const [inBodyRecords, setInBodyRecords] = useState([]);
  const [isAIAnalysisModalOpen, setIsAIAnalysisModalOpen] = useState(false);
  const [isMyPlanModalOpen, setIsMyPlanModalOpen] = useState(false);
  const [isPaymentMethodModalOpen, setIsPaymentMethodModalOpen] =
    useState(false);
  const [isProfileEditModalOpen, setIsProfileEditModalOpen] = useState(false);

  // 프로필 데이터 상태
  const [profileData, setProfileData] = useState({
    id: null,
    userId: "",
    name: "",
    email: "",
    birthDate: "",
    phoneNumber: "",
    height: 0,
    weight: 0,
    gender: "",
    membershipType: "",
    healthGoal: "",
    workoutDaysPerWeek: "",
    weightGoal: 0,
    lastLoginAt: null,
    createdAt: "",
  });

  // 프로필 조회 API 호출 (준비된 코드 - 실제 호출 안함)
  const fetchProfile = async () => {
    try {
      // API 호출 준비 코드 (실제로는 호출하지 않음)
      const token = localStorage.getItem("token"); // 저장된 토큰 가져오기

      console.log("프로필 조회 API 호출 준비:");
      console.log("URL: http://15.165.68.196/api/profile");
      console.log("Method: GET");
      console.log("Headers:", {
        Authorization: `Bearer ${token}`,
      });

      // 실제 API 호출 코드 (주석 처리)
      /*
      const response = await fetch("http://15.165.68.196/api/profile", {
        method: "GET",
        headers: {
          "Authorization": `Bearer ${token}`,
        },
      });

      const data = await response.json();

      if (response.ok) {
        setProfileData(data);
        console.log("프로필 데이터 로드 완료:", data);
      } else {
        console.error("프로필 조회 오류:", data.message);
        alert("프로필 정보를 불러오는데 실패했습니다.");
      }
      */

      // 임시 프로필 데이터 (시뮬레이션)
      const mockProfileData = {
        id: 5,
        userId: "test1",
        name: "홍길동",
        email: "test1@naver.com",
        birthDate: "2002-01-04",
        phoneNumber: "01000000000",
        height: 187,
        weight: 90,
        gender: "M",
        membershipType: "FREE",
        healthGoal: "DIET",
        workoutDaysPerWeek: "3-4일",
        weightGoal: 80,
        lastLoginAt: null,
        createdAt: "2025-09-29T16:15:28",
      };

      setProfileData(mockProfileData);
      console.log("프로필 조회 API 호출 준비 완료!");
      console.log("임시 프로필 데이터:", mockProfileData);
    } catch (error) {
      console.error("프로필 조회 오류:", error);
      alert("프로필 정보를 불러오는 중 오류가 발생했습니다.");
    }
  };

  // 컴포넌트 마운트 시 프로필 조회
  useEffect(() => {
    fetchProfile();
  }, []);

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
    setEditInBodyData(null);
  };

  const handleInBodySave = (data) => {
    if (editInBodyData) {
      // 수정 모드
      const updatedRecords = inBodyRecords.map((record) =>
        record.id === editInBodyData.id
          ? { ...data, id: editInBodyData.id, createdAt: record.createdAt }
          : record
      );
      setInBodyRecords(updatedRecords);
      console.log("InBody 데이터 수정:", { ...data, id: editInBodyData.id });
      alert("검사 결과가 수정되었습니다!");
    } else {
      // 새로 추가 모드
      const newRecord = {
        ...data,
        id: Date.now(), // 임시 ID
        createdAt: new Date().toISOString(),
      };
      setInBodyRecords((prev) => [...prev, newRecord]);
      console.log("InBody 데이터 저장:", newRecord);
      alert("검사 결과가 저장되었습니다!");
    }
    setIsInBodyPhotoModalOpen(false);
    setIsInBodyManualModalOpen(false);
    setEditInBodyData(null);
  };

  const handleInBodyHistoryClick = () => {
    setIsInBodyHistoryModalOpen(true);
  };

  const handleInBodyHistoryModalClose = () => {
    setIsInBodyHistoryModalOpen(false);
  };

  // 인바디 수정 핸들러
  const handleInBodyEdit = (inBodyData) => {
    setEditInBodyData(inBodyData);
    setIsInBodyHistoryModalOpen(false);
    setIsInBodyManualModalOpen(true);
  };

  // 인바디 삭제 핸들러
  const handleInBodyDelete = (inBodyId) => {
    const updatedRecords = inBodyRecords.filter(
      (record) => record.id !== inBodyId
    );
    setInBodyRecords(updatedRecords);
    console.log("InBody 데이터 삭제:", inBodyId);
    alert("검사 결과가 삭제되었습니다!");
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

  // 로그아웃 핸들러
  const handleLogoutClick = () => {
    if (window.confirm("정말로 로그아웃하시겠습니까?")) {
      // API 호출
      logout();
    }
  };

  // 로그아웃 API 호출 (준비된 코드 - 실제 호출 안함)
  const logout = async () => {
    try {
      // API 호출 준비 코드 (실제로는 호출하지 않음)
      const accessToken = localStorage.getItem("token"); // 저장된 토큰 가져오기

      console.log("로그아웃 API 호출 준비:");
      console.log("URL: http://15.165.68.196/api/users/logout");
      console.log("Method: POST");
      console.log("Headers:", {
        "Content-Type": "application/json",
      });
      console.log("Body:", {
        accessToken: accessToken,
      });

      // 실제 API 호출 코드 (주석 처리)
      /*
      const response = await fetch("http://15.165.68.196/api/users/logout", {
        method: "POST",
        headers: {
          "Content-Type": "application/json",
        },
        body: JSON.stringify({
          accessToken: accessToken,
        }),
      });

      const data = await response.json();

      if (data.success) {
        alert("로그아웃이 완료되었습니다.");
        localStorage.removeItem("token");
        window.location.href = "/login";
      } else {
        alert("로그아웃 중 오류가 발생했습니다: " + (data.message || "알 수 없는 오류"));
      }
      */

      // 임시 성공 처리
      alert("로그아웃 API 호출 준비 완료!\n(실제 API 호출은 주석 처리됨)");
      console.log("로그아웃 처리 완료 (시뮬레이션)");
    } catch (error) {
      console.error("로그아웃 오류:", error);
      alert("로그아웃 중 오류가 발생했습니다.");
    }
  };

  // 회원탈퇴 핸들러
  const handleDeleteAccountClick = () => {
    if (
      window.confirm(
        "정말로 회원탈퇴하시겠습니까?\n탈퇴 시 모든 데이터가 삭제되며 복구할 수 없습니다."
      )
    ) {
      // 비밀번호와 탈퇴 사유 입력받기
      const password = prompt("탈퇴를 위해 비밀번호를 입력해주세요:");
      if (!password) return;

      const reason = prompt("탈퇴 사유를 입력해주세요 (선택사항):");

      // API 호출
      deleteAccount(password, reason || "");
    }
  };

  // 회원탈퇴 API 호출 (준비된 코드 - 실제 호출 안함)
  const deleteAccount = async (password, reason) => {
    try {
      // API 호출 준비 코드 (실제로는 호출하지 않음)
      const token = localStorage.getItem("token"); // 저장된 토큰 가져오기

      console.log("회원탈퇴 API 호출 준비:");
      console.log("URL: http://15.165.68.196/api/profile");
      console.log("Method: DELETE");
      console.log("Headers:", {
        "Content-Type": "application/json",
        Authorization: `Bearer ${token}`,
      });
      console.log("Body:", {
        password: password,
        reason: reason,
      });

      // 실제 API 호출 코드 (주석 처리)
      /*
      const response = await fetch("http://15.165.68.196/api/profile", {
        method: "DELETE",
        headers: {
          "Content-Type": "application/json",
          Authorization: `Bearer ${token}`,
        },
        body: JSON.stringify({
          password: password,
          reason: reason,
        }),
      });

      const data = await response.json();

      if (data.success) {
        alert("회원탈퇴가 완료되었습니다.");
        localStorage.removeItem("token");
        window.location.href = "/login";
      } else {
        alert(
          "회원탈퇴 중 오류가 발생했습니다: " +
            (data.message || "알 수 없는 오류")
        );
      }
      */

      // 임시 성공 처리
      alert("회원탈퇴 API 호출 준비 완료!\n(실제 API 호출은 주석 처리됨)");
      console.log("회원탈퇴 처리 완료 (시뮬레이션)");
    } catch (error) {
      console.error("회원탈퇴 오류:", error);
      alert("회원탈퇴 중 오류가 발생했습니다.");
    }
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
                {profileData.name || "김민수"}님{" "}
                <FaCrown className="crown-icon" />
              </div>
              <div className="user-title">
                {profileData.membershipType === "FREE"
                  ? "무료 회원"
                  : profileData.membershipType === "PREMIUM"
                  ? "프리미엄 회원"
                  : "풀업의 신"}
              </div>
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

        {/* 계정 관리 섹션 */}
        <div className="account-section">
          <div className="section-title">계정 관리</div>
          <div className="section-links">
            <div className="link-item logout-item" onClick={handleLogoutClick}>
              로그아웃
            </div>
            <div
              className="link-item delete-account-item"
              onClick={handleDeleteAccountClick}
            >
              회원탈퇴
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
        editData={editInBodyData}
      />

      {/* InBody 전체 내역 모달 */}
      <InBodyHistoryModal
        isOpen={isInBodyHistoryModalOpen}
        onClose={handleInBodyHistoryModalClose}
        onEdit={handleInBodyEdit}
        onDelete={handleInBodyDelete}
        inBodyRecords={inBodyRecords}
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
