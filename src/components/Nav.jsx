import { NavLink } from "react-router-dom";
import styles from "./Nav.module.css";
import {
  IoHomeOutline,
  IoAddCircleOutline,
  IoChatboxEllipsesOutline,
  IoAnalyticsOutline,
  IoPersonOutline,
} from "react-icons/io5";

export default function Nav() {
  const navItems = [
    { name: "home", icon: IoHomeOutline, link: "/home", label: "홈" },
    {
      name: "record",
      icon: IoAddCircleOutline,
      link: "/stats",
      label: "기록하기",
    },
    {
      name: "chatbot",
      icon: IoChatboxEllipsesOutline,
      link: "/chatbot",
      label: "챗봇",
    },
    {
      name: "analysis",
      icon: IoAnalyticsOutline,
      link: "/analysis",
      label: "분석하기",
    },
    {
      name: "profile",
      icon: IoPersonOutline,
      link: "/mypage",
      label: "마이페이지",
    },
  ];

  return (
    <nav className={styles['nav']}>
      {navItems.map(({ name, icon: Icon, link, label }) => (
        <NavLink
          key={name}
          to={link}
          end
          className={({ isActive }) => `${styles.item} ${isActive ? styles.active : ""}`}
        >
          <Icon />
          <span className={styles['label']}>{label}</span>
        </NavLink>
      ))}
    </nav>
  );
}
