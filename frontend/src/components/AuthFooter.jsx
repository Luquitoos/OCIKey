import styles from "./styles/auth.module.css";

export default function AuthFooter() {
  return (
    <footer className={styles.footer}>
      <p className={styles.copyright}>
        © PS PET UFC - Adler, Darlan, Lucas, Thayná. Todos os direitos reservados.
      </p>
    </footer>
  );
}