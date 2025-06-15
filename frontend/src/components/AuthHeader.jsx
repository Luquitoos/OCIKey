import Image from "next/image";
import styles from "./styles/auth.module.css";

export default function AuthHeader({ title, subtitle, subtitleBold }) {
  return (
    <header className={styles.header}>
            <div className={styles.logotypeWrapper}>
              <Image
                src="/OCIKey_Logotype.svg"
                alt="Logotipo OCI Controle de Gabaritos"
                width={240}
                height={60}
                className={styles.logo}
                priority
              />
            </div>
            <div className={styles.iconWrapper}>
              <Image
                src="/OCIKey_Icon.svg"
                alt="Ícone OCI"
                width={64} // 4rem = 64px
                height={64}
                className={styles.logo}
                priority
              />
            </div>
      {title && <h1 className={styles.title}>{title}</h1>}
      {subtitleBold && <p className={styles.subtitleBold}>{subtitleBold}</p>}
      {subtitle && <p className={styles.subtitleRegular}>{subtitle}</p>}
    </header>
  );
}