import { ExclamationTriangleIcon } from "@heroicons/react/24/solid";
import styles from "./ValidationErrors.module.css";

export default function ValidationErrors({ errors, className = "" }) {
  if (!errors || errors.length === 0) {
    return null;
  }

  // Se errors é uma string, converte para array
  const errorList = Array.isArray(errors) ? errors : [{ message: errors }];

  return (
    <div className={`${styles.container} ${className}`}>
      <div className={styles.header}>
        <ExclamationTriangleIcon className={styles.icon} />
        <span className={styles.title}>
          {errorList.length === 1 ? "Erro encontrado:" : "Erros encontrados:"}
        </span>
      </div>
      <ul className={styles.errorList}>
        {errorList.map((error, index) => (
          <li key={index} className={styles.errorItem}>
            {error.field && (
              <span className={styles.fieldName}>
                {getFieldDisplayName(error.field)}:
              </span>
            )}
            <span className={styles.errorMessage}>
              {error.message || error}
            </span>
          </li>
        ))}
      </ul>
    </div>
  );
}

// Função para converter nomes de campos técnicos em nomes amigáveis
function getFieldDisplayName(fieldName) {
  const fieldMap = {
    email: "Email",
    password: "Senha",
    username: "Nome de usuário",
    escola: "Escola",
    role: "Cargo",
    nome: "Nome",
    gabarito: "Gabarito",
    pesoQuestao: "Peso da questão"
  };

  return fieldMap[fieldName] || fieldName;
}