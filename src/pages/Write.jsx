import { useState } from "react";
import { useNavigate } from "react-router-dom";
import "./Write.css";

const Write = () => {
  const navigate = useNavigate();
  const [newPost, setNewPost] = useState({
    title: "",
    content: "",
  });

  const handlComplete = () => {
    if (!newPost.title.trim() || !newPost.content.trim()) {
      alert("제목과 내용을 입력해 주세요");
      return;
    }
    navigate("/community", {
      state: {
        newPost: { title: newPost.title, content: newPost.content },
      },
    });
  };

  return (
    <div className="write-page">
      <div className="write-header">
        <button className="write-close" onClick={() => navigate("/community")}>
          x
        </button>
        <h2>글쓰기</h2>
        <button className="write-complete" onClick={handlComplete}>
          완료
        </button>
      </div>
      <input
        type="text"
        className="write-input"
        placeholder="제목을 입력해 주세요"
        value={newPost.title}
        onChange={(e) => setNewPost({ ...newPost, title: e.target.value })}
      ></input>
      <div className="write-phto-section">
        <p>사진 추가</p>
        <div className="write-phto-box">📷</div>
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
