import { useState } from "react";
import { useNavigate } from "react-router-dom";
import "./MakeChallenge.css";

const MakeChallenge = () => {
  const navigate = useNavigate();

  const [newChallenge, setNewChallenge] = useState({
    title: "",
    description: "",
    category: "유산소",
    image: "",
    targetCondition: "",
  });

  const categories = ["유산소", "근력", "유연성", "균형", "기타"];

  const getDefaultEmoji = (category) => {
    const emojiMap = {
      유산소: "🏃",
      근력: "💪",
      유연성: "🤸",
      균형: "⚖️",
      기타: "🎯",
    };
    return emojiMap[category] || "🏃";
  };

  const handleImageUpload = (event) => {
    const file = event.target.files[0];

    if (!file) return;

    if (file.size > 5 * 1024 * 1024) {
      alert("파일 크기가 너무 큽니다. 5MB 이하의 이미지를 선택해주세요.");
      return;
    }

    if (!file.type.startsWith("image/")) {
      alert("이미지 파일만 업로드 가능합니다.");
      return;
    }

    const reader = new FileReader();
    reader.onload = (e) => {
      setNewChallenge({
        ...newChallenge,
        image: e.target.result,
      });
    };
    reader.readAsDataURL(file);
  };

  const removeImage = () => {
    setNewChallenge({ ...newChallenge, image: "" });
  };

  const handleCreateChallenge = () => {
    if (!newChallenge.title.trim()) {
      alert("챌린지 제목을 입력해주세요.");
      return;
    }
    if (!newChallenge.description.trim()) {
      alert("챌린지 설명을 입력해주세요.");
      return;
    }

    const challenge = {
      id: Date.now(),
      title: newChallenge.title,
      description: newChallenge.description,
      category: newChallenge.category,
      image: newChallenge.image || getDefaultEmoji(newChallenge.category),
      hasCustomImage: !!newChallenge.image,
      targetCondition: newChallenge.targetCondition,
      participants: 0,
      rating: 0,
      createdAt: new Date().toLocaleDateString("ko-KR"),
      isCustom: true,
    };

    const savedChallenges = localStorage.getItem("customChallenges");
    const existingChallenges = savedChallenges
      ? JSON.parse(savedChallenges)
      : {};

    if (!existingChallenges[newChallenge.category]) {
      existingChallenges[newChallenge.category] = [];
    }
    existingChallenges[newChallenge.category].push(challenge);

    localStorage.setItem(
      "customChallenges",
      JSON.stringify(existingChallenges)
    );

    alert("챌린지가 생성되었습니다!");
    navigate("/challenge");
  };

  return (
    <div className="make-challenge-page">
      <div className="make-header">
        <button className="back-btn" onClick={() => navigate("/challenge")}>
          뒤로가기
        </button>
        <h1 className="page-title">챌린지 개설하기</h1>
        <button className="complete-btn" onClick={handleCreateChallenge}>
          완료
        </button>
      </div>

      <div className="challenge-title">챌린지 제목(최대 30자)</div>
      <input
        type="text"
        className="input"
        placeholder="챌린지 제목을 입력해 주세요"
        value={newChallenge.title}
        maxLength={30}
        onChange={(e) =>
          setNewChallenge({ ...newChallenge, title: e.target.value })
        }
      />

      <div className="challenge-phto">대표 이미지</div>
      <div className="image-upload-container">
        {newChallenge.image ? (
          <div className="image-preview">
            <img
              src={newChallenge.image}
              alt="챌린지 이미지"
              className="uploaded-image"
            />
            <button className="remove-image-btn" onClick={removeImage}>
              ✕
            </button>
          </div>
        ) : (
          <label className="img-uploaded-btn">
            <input
              type="file"
              accept="image/*"
              onChange={handleImageUpload}
              style={{ display: "none" }}
            />
            <span className="upload-icon">📷</span>
            <span className="upload-text">이미지 선택</span>
          </label>
        )}
      </div>

      <div className="challenge-category">카테고리 선택</div>
      <select
        className="category-select"
        value={newChallenge.category}
        onChange={(e) => {
          setNewChallenge({
            ...newChallenge,
            category: e.target.value,
          });
        }}
      >
        {categories.map((category) => (
          <option key={category} value={category}>
            {category}
          </option>
        ))}
      </select>

      {!newChallenge.image && (
        <div className="default-emoji-preview">
          <span>기본 이미지: {getDefaultEmoji(newChallenge.category)}</span>
        </div>
      )}

      <div className="challenge-explain">챌린지 설명(최대 200자)</div>
      <textarea
        className="challenge-explain-area"
        placeholder="챌린지에 대한 설명을 입력하세요"
        value={newChallenge.description}
        maxLength={200}
        onChange={(e) =>
          setNewChallenge({ ...newChallenge, description: e.target.value })
        }
      ></textarea>

      <div className="challenge-target">목표 조건</div>
      <textarea
        className="challenge-target-area"
        placeholder="예: 매일 30분 이상 운동하기"
        value={newChallenge.targetCondition}
        onChange={(e) =>
          setNewChallenge({
            ...newChallenge,
            targetCondition: e.target.value,
          })
        }
      ></textarea>
    </div>
  );
};

export default MakeChallenge;
