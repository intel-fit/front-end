import { useState, useEffect, useRef } from "react";
import { useLocation, useNavigate } from "react-router-dom";
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
    if (isProcessing.current || !location.state?.newPost) {
      return;
    }
    isProcessing.current = true;

    const post = {
      id: Date.now(),
      title: location.state.newPost.title,
      content: location.state.newPost.content,
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
            navigate("/challenge");
          }}
        >
          챌린지
        </button>
      </div>

      <div className="post-container">
        {posts.length === 0 ? (
          <div className="no-posts">
            <p>아직 작성된 게시글이 없습니다.</p>
          </div>
        ) : (
          posts.map((post) => (
            <div key={post.id} className="post-card">
              <h3 className="post-title">{post.title}</h3>
              <p className="post-content">{post.content}</p>

              <div className="post-footer">
                <div className="post-info">
                  <span className="post-time">{post.time}</span>
                  <span className="post-author">{post.author}</span>
                </div>
                <button
                  className="like-button"
                  onClick={() => handleLike(post.id)}
                >
                  <span>👍</span>
                  <span>{post.likes}</span>
                </button>
              </div>
            </div>
          ))
        )}
      </div>

      <button className="write-button" onClick={() => navigate("/write")}>
        ✏️ 글쓰기
      </button>
    </div>
  );
};

export default Community;
