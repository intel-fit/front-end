import Bell from "./Bell";
import styles from "./Header.module.css";

export default function Header({ title }) {
  return (
    <header className={styles['app-header']}>
      <h1 className={styles['title']}>{title}</h1>
      <Bell />
    </header>
  );
}
