import styles from "../styles/auth.module.css";

export default function Input({ id, label, icon: Icon, type = "text", ...props }) {
  return (
    <div className={styles.inputGroup}>
      <label htmlFor={id} className={styles.label}>
        {label}
      </label>
      <div className={styles.inputContainer}>
        {Icon && <Icon className={styles.inputIcon} />}
        <input
          type={type}
          id={id}
          name={id}
          className={styles.input}
          required
          {...props}
        />
      </div>
    </div>
  );
}