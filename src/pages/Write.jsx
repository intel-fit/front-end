import { useState } from "react";
import { useNavigate } from "react-router-dom";
import "./Write.css";

const Write = () => {
  const navigate = useNavigate();

  const [newPost, setNewPost] = useState({
    title: "",
    content: "",
    images: [],
  });

  const handleImageAdd = (e) => {
    const file = e.target.files[0];

    if (!file) {
      return;
    }

    if (!file.type.startsWith("image/")) {
      alert("이미지 파일만 선택해주세요!");
      return;
    }

    const reader = new FileReader();

    reader.onloadend = () => {
      setNewPost({
        ...newPost,
        images: [...newPost.images, reader.result],
      });
    };

    reader.readAsDataURL(file);
  };

  const handleImageRemove = (indexToRemove) => {
    const updatedImages = newPost.images.filter(
      (_, index) => index !== indexToRemove
    );

    setNewPost({
      ...newPost,
      images: updatedImages,
    });
  };

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
      <div className="write-header">
        <button className="write-close" onClick={() => navigate("/community")}>
          ✕
        </button>
        <h2>글쓰기</h2>
        <button className="write-complete" onClick={handleComplete}>
          완료
        </button>
      </div>

      <input
        type="text"
        className="write-input"
        placeholder="제목을 입력해 주세요"
        value={newPost.title}
        onChange={(e) => setNewPost({ ...newPost, title: e.target.value })}
      />

      <div className="write-photo-section">
        <p>사진 추가</p>

        <div className="photo-gallery">
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
