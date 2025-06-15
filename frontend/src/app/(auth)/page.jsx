"use client";

import Link from "next/link";
import { useState } from "react";
import styles from "@/components/styles/auth.module.css";
import AuthLayout from "@/components/AuthLayout";
import AuthHeader from "@/components/AuthHeader";
import AuthFooter from "@/components/AuthFooter";
import Input from "@/components/ui/Input";
import { AtSymbolIcon, LockClosedIcon } from "@heroicons/react/24/solid";

export default function LoginPage() {
  const [email, setEmail] = useState("");
  const [password, setPassword] = useState("");
  const [error, setError] = useState(null);
  const [isLoading, setIsLoading] = useState(false);

  // === INÍCIO DA ZONA DE INTEGRAÇÃO COM O BACK-END ===
  const handleSubmit = async (event) => {
    event.preventDefault();
    setIsLoading(true);
    setError(null);
    try {
      await new Promise((resolve) => setTimeout(resolve, 1000));
      console.log("Login com:", { email, password });
    } catch (err) {
      setError(err.message || "Ocorreu um erro inesperado.");
    } finally {
      setIsLoading(false);
    }
  };
  // === FIM DA ZONA DE INTEGRAÇÃO COM O BACK-END ===

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
          />
          <Input
            id="password"
            label="Senha"
            type="password"
            icon={LockClosedIcon}
            value={password}
            onChange={(e) => setPassword(e.target.value)}
          />

          {error && <p className={styles.errorMessage}>{error}</p>}

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
