import { useState, useEffect } from "react";
import { useNavigate, useParams } from "react-router-dom";
import "./Post.css";

const PostDetail = () => {
  const navigate = useNavigate();
  const { postId } = useParams();

  const [post, setPost] = useState(null);
  const [comments, setComments] = useState([]);
  const [newComment, setNewComment] = useState("");

  useEffect(() => {
    const savedPosts = localStorage.getItem("posts");

    if (!savedPosts) {
      alert("게시글을 찾을 수 없습니다");
      navigate("/community");
      return;
    }

    const posts = JSON.parse(savedPosts);
    const foundPost = posts.find((p) => p.id === Number(postId));

    if (!foundPost) {
      alert("게시글을 찾을 수 없습니다");
      navigate("/community");
      return;
    }

    setPost(foundPost);

    const savedComments = localStorage.getItem("comments");

    if (savedComments) {
      const allComments = JSON.parse(savedComments);
      const postComments = allComments[postId] || [];
      setComments(postComments);
    }
  }, [postId, navigate]);

  const handleLike = () => {
    const savedPosts = localStorage.getItem("posts");
    const posts = JSON.parse(savedPosts);

    const updatedPosts = posts.map((p) => {
      if (p.id === post.id) {
        return { ...p, likes: p.likes + 1 };
      }
      return p;
    });

    localStorage.setItem("posts", JSON.stringify(updatedPosts));
    setPost({ ...post, likes: post.likes + 1 });
  };

  const handleCommentSubmit = () => {
    if (!newComment.trim()) {
      return;
    }

    const comment = {
      id: Date.now(),
      author: "나",
      content: newComment,
      time: new Date().toLocaleDateString("ko-KR"),
    };

    const updatedComments = [...comments, comment];
    setComments(updatedComments);

    const savedComments = localStorage.getItem("comments");
    const allComments = savedComments ? JSON.parse(savedComments) : {};

    allComments[postId] = updatedComments;

    localStorage.setItem("comments", JSON.stringify(allComments));

    setNewComment("");
  };
  if (!post) {
    return (
      <div className="loading">
        <p>로딩 중...</p>
      </div>
    );
  }

  return (
    <div className="post-detail-page">
      <div className="detail-header">
        <button className="back-btn" onClick={() => navigate("/community")}>
          ←
        </button>
        <h2 className="header-title">소셜</h2>
      </div>

      <div className="detail-content">
        <div className="author-info">
          <div className="author-avatar">👤</div>
          <div className="author-details">
            <p className="author-name">{post.author}</p>
            <p className="post-time">{post.time}</p>
          </div>
        </div>

        <h1 className="detail-title">{post.title}</h1>

        {post.images && post.images.length > 0 && (
          <div className="detail-images">
            {post.images.map((image, index) => (
              <img
                key={index}
                src={image}
                alt={`이미지 ${index + 1}`}
                className="detail-image"
              />
            ))}
          </div>
        )}

        <p className="detail-text">{post.content}</p>

        <div className="action-buttons">
          <button className="action-btn" onClick={handleLike}>
            <span className="btn-icon">👍</span>
            <span className="btn-text">좋아요</span>
            <span className="btn-count">{post.likes}</span>
          </button>
          <button className="action-btn">
            <span className="btn-icon">💬</span>
            <span className="btn-text">댓글</span>
            <span className="btn-count">{comments.length}</span>
          </button>
        </div>

        <div className="divider"></div>

        <div className="comments-section">
          <h3 className="comments-title">댓글</h3>

          {comments.length === 0 ? (
            <p className="no-comments">첫 댓글을 작성해보세요!</p>
          ) : (
            <div className="comments-list">
              {comments.map((comment) => (
                <div key={comment.id} className="comment-item">
                  <div className="comment-avatar">👤</div>
                  <div className="comment-content">
                    <div className="comment-header">
                      <span className="comment-author">{comment.author}</span>
                      <span className="comment-time">{comment.time}</span>
                    </div>
                    <p className="comment-text">{comment.content}</p>
                  </div>
                </div>
              ))}
            </div>
          )}
        </div>
      </div>

      <div className="comment-input-container">
        <input
          type="text"
          className="comment-input"
          placeholder="댓글을 입력하세요..."
          value={newComment}
          onChange={(e) => setNewComment(e.target.value)}
          onKeyPress={(e) => {
            if (e.key === "Enter") {
              handleCommentSubmit();
            }
          }}
        />
        <button className="comment-submit-btn" onClick={handleCommentSubmit}>
          →
        </button>
      </div>
    </div>
  );
};

export default PostDetail;
