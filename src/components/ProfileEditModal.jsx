import { useState } from "react";
import { useNavigate } from "react-router-dom";
import { IoChevronForward, IoPencil } from "react-icons/io5";
import "./ProfileEditModal.css";

export default function ProfileEditModal({ isOpen, onClose }) {
  const navigate = useNavigate();
  const [profileData, setProfileData] = useState({
    name: "김민수",
    email: "dd@gmail.com",
    userId: "dfdfd",
    birthDate: "2023.24.03",
    gender: "여자",
    height: "170",
    weight: "60",
    nicknamePublic: true,
  });

  const [editingField, setEditingField] = useState(null);
  const [tempValue, setTempValue] = useState("");

  if (!isOpen) return null;

  const handleFieldClick = (field) => {
    if (field === "password") {
      // 비밀번호 재설정 페이지로 이동
      navigate("/reset-password");
      onClose();
      return;
    }

    setEditingField(field);
    if (field === "nicknamePublic") {
      setTempValue(profileData[field] ? "true" : "false");
    } else {
      setTempValue(profileData[field] || "");
    }
  };

  const handleSave = () => {
    if (editingField) {
      if (editingField === "nicknamePublic") {
        setProfileData((prev) => ({
          ...prev,
          [editingField]: tempValue === "true",
        }));
      } else if (editingField === "bodyInfo") {
        // 신체정보는 이미 실시간으로 업데이트되므로 추가 저장 불필요
      } else {
        setProfileData((prev) => ({
          ...prev,
          [editingField]: tempValue,
        }));
      }
    }
    setEditingField(null);
    setTempValue("");
  };

  const handleCancel = () => {
    if (editingField === "bodyInfo") {
      // 신체정보 편집 취소 시 원래 값으로 복원
      setProfileData((prev) => ({
        ...prev,
        height: "170",
        weight: "60",
      }));
    }
    setEditingField(null);
    setTempValue("");
  };

  const handleInputChange = (e) => {
    setTempValue(e.target.value);
  };

  return (
    <div className="profile-edit-modal-overlay">
      <div className="profile-edit-modal-content">
        {/* 상단 네비게이션 */}
        <div className="edit-nav">
          <button className="nav-back-btn" onClick={onClose}>
            ←
          </button>
          <h1 className="nav-title">정보 수정</h1>
          <button
            className="nav-save-btn"
            onClick={() => {
              handleSave();
              onClose();
            }}
          >
            ✓
          </button>
        </div>

        {/* 프로필 섹션 */}
        <div className="profile-section">
          <div className="profile-avatar">
            <div className="avatar-placeholder"></div>
          </div>
          <div className="profile-info">
            <span className="profile-name">김민수님</span>
            <button className="profile-edit-btn">
              <IoPencil />
            </button>
          </div>
        </div>

        {/* 정보 목록 */}
        <div className="info-list">
          <div className="info-item">
            <span className="info-label">이메일</span>
            <span className="info-value">{profileData.email}</span>
          </div>

          <div className="info-item">
            <span className="info-label">아이디</span>
            <span className="info-value">{profileData.userId}</span>
          </div>

          <div
            className="info-item clickable"
            onClick={() => handleFieldClick("password")}
          >
            <span className="info-label">비밀번호</span>
            <div className="info-value-with-arrow">
              <span className="info-value">재설정하기</span>
              <IoChevronForward />
            </div>
          </div>

          {editingField === "birthDate" ? (
            <div className="info-item editing">
              <span className="info-label">생년월일</span>
              <div className="edit-controls">
                <input
                  type="text"
                  value={tempValue}
                  onChange={handleInputChange}
                  placeholder="YYYY.MM.DD"
                  className="edit-input"
                />
                <button onClick={handleSave} className="save-edit-btn">
                  ✓
                </button>
              </div>
            </div>
          ) : (
            <div
              className="info-item clickable"
              onClick={() => handleFieldClick("birthDate")}
            >
              <span className="info-label">생년월일</span>
              <div className="info-value-with-arrow">
                <span className="info-value">{profileData.birthDate}</span>
                <IoChevronForward />
              </div>
            </div>
          )}

          {editingField === "gender" ? (
            <div className="info-item editing">
              <span className="info-label">성별</span>
              <div className="edit-controls">
                <select
                  value={tempValue}
                  onChange={handleInputChange}
                  className="edit-select"
                >
                  <option value="남자">남자</option>
                  <option value="여자">여자</option>
                </select>
                <button onClick={handleSave} className="save-edit-btn">
                  ✓
                </button>
              </div>
            </div>
          ) : (
            <div
              className="info-item clickable"
              onClick={() => handleFieldClick("gender")}
            >
              <span className="info-label">성별</span>
              <div className="info-value-with-arrow">
                <span className="info-value">{profileData.gender}</span>
                <IoChevronForward />
              </div>
            </div>
          )}

          {editingField === "bodyInfo" ? (
            <div className="info-item editing">
              <span className="info-label">신체정보</span>
              <div className="edit-controls body-info">
                <input
                  type="number"
                  value={profileData.height}
                  onChange={(e) =>
                    setProfileData((prev) => ({
                      ...prev,
                      height: e.target.value,
                    }))
                  }
                  placeholder="키"
                  className="edit-input body-input"
                />
                <span>cm</span>
                <input
                  type="number"
                  value={profileData.weight}
                  onChange={(e) =>
                    setProfileData((prev) => ({
                      ...prev,
                      weight: e.target.value,
                    }))
                  }
                  placeholder="몸무게"
                  className="edit-input body-input"
                />
                <span>kg</span>
                <button onClick={handleSave} className="save-edit-btn">
                  ✓
                </button>
              </div>
            </div>
          ) : (
            <div
              className="info-item clickable"
              onClick={() => handleFieldClick("bodyInfo")}
            >
              <span className="info-label">신체정보</span>
              <div className="info-value-with-arrow">
                <span className="info-value">
                  {profileData.height}cm • {profileData.weight}kg
                </span>
                <IoChevronForward />
              </div>
            </div>
          )}

          {editingField === "nicknamePublic" ? (
            <div className="info-item editing">
              <span className="info-label">별명 표시 공개</span>
              <div className="edit-controls">
                <select
                  value={tempValue}
                  onChange={handleInputChange}
                  className="edit-select"
                >
                  <option value="true">네</option>
                  <option value="false">아니오</option>
                </select>
                <button onClick={handleSave} className="save-edit-btn">
                  ✓
                </button>
              </div>
            </div>
          ) : (
            <div
              className="info-item clickable"
              onClick={() => handleFieldClick("nicknamePublic")}
            >
              <span className="info-label">별명 표시 공개</span>
              <div className="info-value-with-arrow">
                <span className="info-value">
                  {profileData.nicknamePublic ? "네" : "아니오"}
                </span>
                <IoChevronForward />
              </div>
            </div>
          )}
        </div>
      </div>
    </div>
  );
}
