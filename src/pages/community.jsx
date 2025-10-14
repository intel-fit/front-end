import { useState, useEffect, useRef } from "react";
import { useNavigate, useLocation } from "react-router-dom";
import "./Community.css";

const Community = () => {
  const navigate = useNavigate();
  const location = useLocation();
  const [activeTab, setActiveTab] = useState("커뮤니티");
  const [posts, setPosts] = useState(() => {
    const savedPosts = localStorage.getItem("posts");
    return savedPosts ? JSON.parse(savedPosts) : [];
  });
  const isProcessing = useRef(false);

  useEffect(() => {
    if (isProcessing.current) {
      return;
    }

    if (!location.state?.newPost) {
      return;
    }

    isProcessing.current = true;

    const post = {
      id: Date.now(),
      title: location.state.newPost.title,
      content: location.state.newPost.content,
      images: location.state.newPost.images,
      time: new Date().toLocaleTimeString("ko-KR", {
        hour: "2-digit",
        minute: "2-digit",
      }),
      author: "익명",
      likes: 0,
    };

    setPosts((prevPosts) => {
      const updatedPosts = [post, ...prevPosts];
      localStorage.setItem("posts", JSON.stringify(updatedPosts));
      return updatedPosts;
    });
    window.history.replaceState({}, document.title);

    setTimeout(() => {
      isProcessing.current = false;
    }, 100);
  }, [location]);

  const getCommentCount = (postId) => {
    const savedComments = localStorage.getItem("comments");

    if (!savedComments) {
      return 0;
    }

    const allComments = JSON.parse(savedComments);
    const postComments = allComments[postId] || [];

    return postComments.length;
  };

  const handleLike = (postId) => {
    const updatedPosts = posts.map((post) => {
      if (post.id === postId) {
        return {
          ...post,
          likes: post.likes + 1,
        };
      }
      return post;
    });
    setPosts(updatedPosts);
    localStorage.setItem("posts", JSON.stringify(updatedPosts));
  };

  return (
    <div>
      <div className="top-menu">소셜</div>
      <div className="tab-menu">
        <button
          className={activeTab === "커뮤니티" ? "active" : ""}
          onClick={() => setActiveTab("커뮤니티")}
        >
          커뮤니티
        </button>
        <button
          className={activeTab === "챌린지" ? "active" : ""}
          onClick={() => {
            setActiveTab("챌린지");
            navigate("/Challenge");
          }}
        >
          챌린지
        </button>
      </div>

      <div className="post-container">
        {posts.length === 0 ? (
          <div className="no-posts">
            <p>아직 작성된 글이 없습니다.</p>
          </div>
        ) : (
          posts.map((post) => (
            <div
              key={post.id}
              className="post-card"
              onClick={() => navigate(`/post/${post.id}`)}
            >
              <h3>{post.title}</h3>

              {post.images && post.images.length > 0 && (
                <div className="post-images">
                  {post.images.map((image, index) => (
                    <img
                      key={index}
                      src={image}
                      alt={`${post.title} 이미지 ${index + 1}`}
                      className="post-image"
                    />
                  ))}
                </div>
              )}
              <p>{post.content}</p>

              <div className="post-footer">
                <div className="post-info">
                  <span>{post.time}</span>
                  <span>{post.author}</span>
                </div>
                <button
                  onClick={(e) => {
                    e.stopPropagation();
                    handleLike(post.id);
                  }}
                >
                  <span>👍</span>
                  <span>{post.likes}</span>
                </button>

                <button
                  className="action-button comment-button"
                  onClick={(e) => {
                    e.stopPropagation();
                    navigate(`/post/${post.id}`);
                  }}
                >
                  <span>💬</span>
                  <span>{getCommentCount(post.id)}</span>
                </button>
              </div>
            </div>
          ))
        )}

        <button className="write-button" onClick={() => navigate("/write")}>
          ✏️ 글쓰기
        </button>
      </div>
    </div>
  );
};
export default Community;
