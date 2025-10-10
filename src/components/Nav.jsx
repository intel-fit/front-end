import { NavLink } from "react-router-dom";
import "./Nav.css";
import {
  IoHomeOutline,
  IoStatsChartOutline,
  IoChatboxEllipsesOutline,
  IoPersonOutline,
} from "react-icons/io5";

export default function Nav() {
  const navItems = [
    { name: "home", icon: IoHomeOutline, link: "/home" },
    { name: "stats", icon: IoStatsChartOutline, link: "/stats" },
    { name: "community", icon: IoChatboxEllipsesOutline, link: "/community" },
    { name: "profile", icon: IoPersonOutline, link: "/profile" },
  ];

  return (
    <nav className="nav">
      {navItems.map(({ name, icon: Icon, link }) => (
        <NavLink
          key={name}
          to={link}
          end
          className={({ isActive }) => `item ${isActive ? "active" : ""}`}
        >
          <Icon />
        </NavLink>
      ))}
    </nav>
  );
}
