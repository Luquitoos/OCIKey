import styles from "./styles/auth.module.css";

export default function AuthLayout({ children }) {
  return (
    <div className={styles.pageContainer}>
      <main className={styles.mainSection}>
        {children}
      </main>
      <div className={styles.imageSection}>
        <img
          src="/AuthAbstract.jpg"
          alt="Abstract background"
          style={{
            width: '100%',
            height: '100%',
            objectFit: 'cover',
          }}
        />
      </div>
    </div>
  );
}