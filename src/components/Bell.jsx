import { IoNotificationsOutline } from "react-icons/io5";
import styles from "./Bell.module.css";

export default function Bell() {
  return (
    <div className={styles['bell-container']}>
      <button className={styles['bell']} aria-label="알림">
        <IoNotificationsOutline size={22} />
      </button>
    </div>
  );
}
