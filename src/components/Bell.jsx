import { IoNotificationsOutline } from "react-icons/io5";
import "./Bell.css";

export default function Bell() {
  return (
    <div className="bell-container">
      <button className="bell" aria-label="알림">
        <IoNotificationsOutline size={22} />
      </button>
    </div>
  );
}
