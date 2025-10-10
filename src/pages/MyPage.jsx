// src/pages/MyPage.jsx

// 재사용 가능한 헤더 컴포넌트를 가져옵니다.
import Header from "../components/Header";

export default function MyPage() {
  return (
    <div style={{ flex: 1, display: "flex", flexDirection: "column" }}>
      {/* 🌟 PageHeader 컴포넌트를 추가하고 타이틀을 "프로필"로 전달합니다. */}
      <Header title="프로필" />

      {/* 페이지의 나머지 프로필 관련 내용이 이 아래에 구현됩니다. */}
      <div className="profile-content" style={{ padding: "16px" }}>
        <p>프로필 정보와 설정이 표시될 영역입니다.</p>
      </div>
    </div>
  );
}
