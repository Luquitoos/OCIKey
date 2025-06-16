"use client";

import Link from "next/link";
import { useState } from "react";
import { useRouter } from "next/navigation";
import { useAuth } from "@/contexts/AuthContext";
import styles from "@/components/styles/auth.module.css";
import AuthLayout from "@/components/AuthLayout";
import AuthHeader from "@/components/AuthHeader";
import AuthFooter from "@/components/AuthFooter";
import Input from "@/components/ui/Input";
import ValidationErrors from "@/components/ui/ValidationErrors";
import { AtSymbolIcon, LockClosedIcon } from "@heroicons/react/24/solid";
import { validateEmail, validatePassword, extractApiErrors } from "@/utils/validation";

export default function LoginPage() {
  const [email, setEmail] = useState("");
  const [password, setPassword] = useState("");
  const [errors, setErrors] = useState([]);
  const [fieldErrors, setFieldErrors] = useState({});
  const [isLoading, setIsLoading] = useState(false);
  const { login } = useAuth();
  const router = useRouter();

  // Validação em tempo real para email
  const handleEmailBlur = () => {
    const validation = validateEmail(email);
    setFieldErrors(prev => ({
      ...prev,
      email: validation.isValid ? null : validation.message
    }));
  };

  // Validação em tempo real para senha
  const handlePasswordBlur = () => {
    const validation = validatePassword(password, false);
    setFieldErrors(prev => ({
      ...prev,
      password: validation.isValid ? null : validation.message
    }));
  };

  const handleSubmit = async (event) => {
    event.preventDefault();
    setIsLoading(true);
    setErrors([]);
    setFieldErrors({});

    // Validação do lado do cliente
    const emailValidation = validateEmail(email);
    const passwordValidation = validatePassword(password, false);

    const clientErrors = [];
    if (!emailValidation.isValid) {
      clientErrors.push({ field: 'email', message: emailValidation.message });
    }
    if (!passwordValidation.isValid) {
      clientErrors.push({ field: 'password', message: passwordValidation.message });
    }

    if (clientErrors.length > 0) {
      setErrors(clientErrors);
      setIsLoading(false);
      return;
    }
    
    try {
      const result = await login(email, password);
      if (result.success) {
        router.push('/dashboard');
      } else {
        // Extrair erros da resposta da API
        const apiErrors = extractApiErrors(result);
        setErrors(apiErrors);
      }
    } catch (err) {
      console.error('Erro no login:', err);
      setErrors([{ message: err.message || "Ocorreu um erro inesperado." }]);
    } finally {
      setIsLoading(false);
    }
  };

  return (
    <AuthLayout>
      <div className={styles.formWrapper}>
        <AuthHeader
          title="Bem-vindo"
          subtitleBold="Leia gabaritos automaticamente."
          subtitle="Organize alunos, provas, escolas e notas."
        />
        <form className={styles.form} onSubmit={handleSubmit}>
          <Input
            id="email"
            label="Email"
            type="email"
            icon={AtSymbolIcon}
            value={email}
            onChange={(e) => setEmail(e.target.value)}
            onBlur={handleEmailBlur}
            placeholder="Digite seu email cadastrado"
            error={fieldErrors.email}
            success={email && !fieldErrors.email}
          />
          <Input
            id="password"
            label="Senha"
            type="password"
            icon={LockClosedIcon}
            value={password}
            onChange={(e) => setPassword(e.target.value)}
            onBlur={handlePasswordBlur}
            placeholder="Digite sua senha"
            error={fieldErrors.password}
            success={password && !fieldErrors.password}
          />

          <ValidationErrors errors={errors} />

          <div className={styles.buttonGroup}>
            <Link
              href="/registro"
              className={`${styles.button} ${styles.secondaryButton}`}
            >
              Registre-se
            </Link>
            <button
              type="submit"
              className={`${styles.button} ${styles.primaryButton}`}
              disabled={isLoading}
            >
              {isLoading ? "Entrando..." : "Entrar"}
            </button>
          </div>
        </form>
        <AuthFooter />
      </div>
    </AuthLayout>
  );
}
