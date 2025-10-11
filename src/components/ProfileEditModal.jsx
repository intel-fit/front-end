import { useState } from "react";
import { IoClose, IoCamera, IoPersonOutline } from "react-icons/io5";
import "./ProfileEditModal.css";

export default function ProfileEditModal({ isOpen, onClose }) {
  const [profileData, setProfileData] = useState({
    name: "김민수",
    nickname: "풀업의 신",
    email: "user@example.com",
    phone: "010-1234-5678",
    birthDate: "1995-05-15",
    gender: "남성",
    height: "175",
    weight: "70",
    targetWeight: "68",
  });

  const [profileImage, setProfileImage] = useState(null);

  if (!isOpen) return null;

  const handleInputChange = (field, value) => {
    setProfileData((prev) => ({
      ...prev,
      [field]: value,
    }));
  };

  const handleImageChange = (event) => {
    const file = event.target.files[0];
    if (file) {
      const reader = new FileReader();
      reader.onload = (e) => {
        setProfileImage(e.target.result);
      };
      reader.readAsDataURL(file);
    }
  };

  const handleSave = () => {
    console.log("프로필 저장:", profileData);
    alert("프로필이 수정되었습니다!");
    onClose();
  };

  return (
    <div className="profile-edit-modal-overlay">
      <div className="profile-edit-modal-content">
        <div className="profile-edit-modal-header">
          <h2 className="profile-edit-modal-title">프로필 수정</h2>
          <button className="profile-edit-modal-close" onClick={onClose}>
            <IoClose />
          </button>
        </div>

        <div className="profile-edit-modal-body">
          {/* 프로필 사진 */}
          <div className="profile-image-section">
            <div className="profile-image-container">
              {profileImage ? (
                <img src={profileImage} alt="프로필" className="profile-img" />
              ) : (
                <div className="profile-img-placeholder">
                  <IoPersonOutline />
                </div>
              )}
              <label className="image-upload-btn">
                <IoCamera />
                <input
                  type="file"
                  accept="image/*"
                  onChange={handleImageChange}
                  style={{ display: "none" }}
                />
              </label>
            </div>
            <p className="image-guide">프로필 사진을 변경하려면 클릭하세요</p>
          </div>

          {/* 기본 정보 */}
          <div className="form-section">
            <h3 className="section-title">기본 정보</h3>

            <div className="form-group">
              <label>이름</label>
              <input
                type="text"
                value={profileData.name}
                onChange={(e) => handleInputChange("name", e.target.value)}
              />
            </div>

            <div className="form-group">
              <label>닉네임</label>
              <input
                type="text"
                value={profileData.nickname}
                onChange={(e) => handleInputChange("nickname", e.target.value)}
              />
            </div>

            <div className="form-group">
              <label>이메일</label>
              <input
                type="email"
                value={profileData.email}
                onChange={(e) => handleInputChange("email", e.target.value)}
              />
            </div>

            <div className="form-group">
              <label>전화번호</label>
              <input
                type="tel"
                value={profileData.phone}
                onChange={(e) => handleInputChange("phone", e.target.value)}
              />
            </div>
          </div>

          {/* 개인 정보 */}
          <div className="form-section">
            <h3 className="section-title">개인 정보</h3>

            <div className="form-group">
              <label>생년월일</label>
              <input
                type="date"
                value={profileData.birthDate}
                onChange={(e) => handleInputChange("birthDate", e.target.value)}
              />
            </div>

            <div className="form-group">
              <label>성별</label>
              <div className="radio-group">
                <label className="radio-label">
                  <input
                    type="radio"
                    name="gender"
                    value="남성"
                    checked={profileData.gender === "남성"}
                    onChange={(e) =>
                      handleInputChange("gender", e.target.value)
                    }
                  />
                  남성
                </label>
                <label className="radio-label">
                  <input
                    type="radio"
                    name="gender"
                    value="여성"
                    checked={profileData.gender === "여성"}
                    onChange={(e) =>
                      handleInputChange("gender", e.target.value)
                    }
                  />
                  여성
                </label>
              </div>
            </div>
          </div>

          {/* 신체 정보 */}
          <div className="form-section">
            <h3 className="section-title">신체 정보</h3>

            <div className="form-row">
              <div className="form-group">
                <label>키 (cm)</label>
                <input
                  type="number"
                  value={profileData.height}
                  onChange={(e) => handleInputChange("height", e.target.value)}
                  step="0.1"
                />
              </div>

              <div className="form-group">
                <label>현재 체중 (kg)</label>
                <input
                  type="number"
                  value={profileData.weight}
                  onChange={(e) => handleInputChange("weight", e.target.value)}
                  step="0.1"
                />
              </div>
            </div>

            <div className="form-group">
              <label>목표 체중 (kg)</label>
              <input
                type="number"
                value={profileData.targetWeight}
                onChange={(e) =>
                  handleInputChange("targetWeight", e.target.value)
                }
                step="0.1"
              />
            </div>
          </div>
        </div>

        <div className="profile-edit-modal-footer">
          <button className="cancel-btn" onClick={onClose}>
            취소
          </button>
          <button className="save-btn" onClick={handleSave}>
            저장하기
          </button>
        </div>
      </div>
    </div>
  );
}
