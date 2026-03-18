import Link from 'next/link';
import styles from './Navigation.module.css';

const Navigation = () => {
  return (
    <nav className={styles.navbar}>
      <div className={styles.container}>
        <div className={styles.logo}>
          <Link href="/">Find Your Best</Link>
        </div>
        <ul className={styles.navLinks}>
          <li><Link href="/" style={{ color: "var(--primary)", fontWeight: "bold" }}>궁합 역추적기</Link></li>
        </ul>
      </div>
    </nav>
  );
};

export default Navigation;
