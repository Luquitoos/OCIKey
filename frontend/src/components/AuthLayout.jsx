import Image from "next/image";
import styles from "./styles/auth.module.css";

export default function AuthLayout({ children }) {
  return (
    <div className={styles.pageContainer}>
      <main className={styles.mainSection}>
        {children}
      </main>
      <aside className={styles.imageSection}>
        <Image
          src="/AuthAbstract.jpg"
          alt="Abstração artística com tons de verde e detalhes dourados"
          layout="fill"
          objectFit="cover"
          priority
          quality={85}
        />
      </aside>
    </div>
  );
}