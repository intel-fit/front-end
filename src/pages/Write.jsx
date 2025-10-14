import { useState } from "react";
import { useNavigate } from "react-router-dom";
import "./Write.css";

const Write = () => {
  const navigate = useNavigate();

  // 게시글 정보
  const [newPost, setNewPost] = useState({
    title: "",
    content: "",
    images: [],
  });

  // 이미지 추가 함수
  const handleImageAdd = (e) => {
    const file = e.target.files[0];

    if (!file) {
      return;
    }

    // 이미지 파일인지 확인
    if (!file.type.startsWith("image/")) {
      alert("이미지 파일만 선택해주세요!");
      return;
    }

    // 파일을 읽어서 Base64로 변환
    const reader = new FileReader();

    reader.onloadend = () => {
      // 기존 images 배열에 새 이미지 추가
      setNewPost({
        ...newPost,
        images: [...newPost.images, reader.result],
      });
    };

    reader.readAsDataURL(file);
  };

  // 이미지 삭제 함수
  const handleImageRemove = (indexToRemove) => {
    const updatedImages = newPost.images.filter(
      (_, index) => index !== indexToRemove
    );

    setNewPost({
      ...newPost,
      images: updatedImages,
    });
  };

  // 완료 버튼 클릭
  const handleComplete = () => {
    if (!newPost.title.trim() || !newPost.content.trim()) {
      alert("제목과 내용을 입력해 주세요");
      return;
    }

    navigate("/community", {
      state: {
        newPost: {
          title: newPost.title,
          content: newPost.content,
          images: newPost.images,
        },
      },
    });
  };

  return (
    <div className="write-page">
      {/* 헤더 */}
      <div className="write-header">
        <button className="write-close" onClick={() => navigate("/community")}>
          ✕
        </button>
        <h2>글쓰기</h2>
        <button className="write-complete" onClick={handleComplete}>
          완료
        </button>
      </div>

      {/* 제목 입력 */}
      <input
        type="text"
        className="write-input"
        placeholder="제목을 입력해 주세요"
        value={newPost.title}
        onChange={(e) => setNewPost({ ...newPost, title: e.target.value })}
      />

      {/* 사진 갤러리 섹션 */}
      <div className="write-photo-section">
        <p>사진 추가</p>

        <div className="photo-gallery">
          {/* 기존 이미지들 표시 */}
          {newPost.images.map((image, index) => (
            <div key={index} className="photo-item">
              <img
                src={image}
                alt={`사진 ${index + 1}`}
                className="photo-thumbnail"
              />
              <button
                className="photo-remove-btn"
                onClick={() => handleImageRemove(index)}
              >
                ✕
              </button>
            </div>
          ))}

          {/* 사진 추가 버튼 (회색 박스) */}
          <label className="photo-add-box">
            <input
              type="file"
              accept="image/*"
              onChange={handleImageAdd}
              style={{ display: "none" }}
            />
            <div className="camera-icon">📷</div>
          </label>
        </div>
      </div>

      {/* 내용 입력 */}
      <textarea
        className="write-textarea"
        placeholder="내용을 입력해주세요"
        value={newPost.content}
        onChange={(e) =>
          setNewPost({
            ...newPost,
            content: e.target.value,
          })
        }
      />
    </div>
  );
};

export default Write;
