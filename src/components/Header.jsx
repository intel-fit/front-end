import { IoNotificationsOutline } from "react-icons/io5";
import "./Header.css";

export default function Header() {
  return (
    <div className="floating-bell">
      <button className="bell" aria-label="알림">
        <IoNotificationsOutline size={22} />
      </button>
    </div>
  );
}
