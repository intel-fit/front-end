import Bell from "./Bell";
import "./Header.css";

export default function Header({ title }) {
  return (
    <header className="header">
      <h1 className="title">{title}</h1>
      <Bell />
    </header>
  );
}
