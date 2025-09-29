import BottomTab from "../components/BottomTab";

export default function MyPage() {
  return (
    <div style={{ flex: 1, display: "flex", flexDirection: "column" }}>
      {/* 공란(메인 내용 자리) */}
      <div
        style={{
          flex: 1,
          display: "flex",
          alignItems: "center",
          justifyContent: "center",
          background: "#111",
          color: "#ddd",
          fontWeight: 600,
        }}
      >
        (메인화면 내용 없음)
      </div>

      {/* 하단 탭바 — 컨테이너 내부 */}
      <BottomTab active="mypage" />
    </div>
  );
}
