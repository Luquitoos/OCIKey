import styles from "../styles/auth.module.css";

export default function Select({ id, label, icon: Icon, children, ...props }) {
  return (
    <div className={styles.inputGroup}>
      <label htmlFor={id} className={styles.label}>
        {label}
      </label>
      <div className={styles.inputContainer}>
        {Icon && <Icon className={styles.inputIcon} />}
        <select
          id={id}
          name={id}
          className={`${styles.input} ${styles.selectInput}`}
          required
          {...props}
        >
          {children}
        </select>
      </div>
    </div>
  );
}