import { ExclamationCircleIcon, CheckCircleIcon } from "@heroicons/react/24/solid";
import styles from "../styles/auth.module.css";

export default function Input({ 
  id, 
  label, 
  icon: Icon, 
  type = "text", 
  error = null,
  success = false,
  onBlur,
  onChange,
  ...props 
}) {
  const hasError = error && error.trim() !== '';
  const hasSuccess = success && !hasError;

  const handleBlur = (e) => {
    if (onBlur) {
      onBlur(e);
    }
  };

  const handleChange = (e) => {
    if (onChange) {
      onChange(e);
    }
  };

  return (
    <div className={styles.inputGroup}>
      <label htmlFor={id} className={styles.label}>
        {label}
      </label>
      <div className={`${styles.inputContainer} ${hasError ? styles.inputError : ''} ${hasSuccess ? styles.inputSuccess : ''}`}>
        {Icon && <Icon className={styles.inputIcon} />}
        <input
          type={type}
          id={id}
          name={id}
          className={styles.input}
          onBlur={handleBlur}
          onChange={handleChange}
          {...props}
        />
        {hasError && <ExclamationCircleIcon className={styles.validationIcon} />}
        {hasSuccess && <CheckCircleIcon className={styles.validationIcon} />}
      </div>
      {hasError && (
        <span className={styles.errorText}>
          {error}
        </span>
      )}
    </div>
  );
}