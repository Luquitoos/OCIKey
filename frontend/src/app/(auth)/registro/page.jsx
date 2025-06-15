"use client";

import Link from "next/link";
import { useState } from "react";
import styles from "@/components/styles/auth.module.css";
import AuthLayout from "@/components/AuthLayout";
import AuthHeader from "@/components/AuthHeader";
import Input from "@/components/ui/Input";
import Select from "@/components/ui/Select";
import {
  AtSymbolIcon,
  LockClosedIcon,
  UserIcon,
  BriefcaseIcon,
} from "@heroicons/react/24/solid";

export default function RegisterPage() {
  const [username, setUsername] = useState("");
  const [email, setEmail] = useState("");
  const [password, setPassword] = useState("");
  const [role, setRole] = useState("user"); // Valor padrão
  const [error, setError] = useState(null);
  const [isLoading, setIsLoading] = useState(false);

  // === INÍCIO DA ZONA DE INTEGRAÇÃO COM O BACK-END ===
  const handleSubmit = async (event) => {
    event.preventDefault();
    setIsLoading(true);
    setError(null);
    try {
      // Endpoint para registro: POST /api/auth/register
      const payload = { username, email, password, role };
      console.log("Enviando para registro:", payload);
      // const response = await fetch('/api/auth/register', { ... });
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
        <AuthHeader />

        <form className={styles.form} onSubmit={handleSubmit}>
          <Input
            id="username"
            label="Nome de Usuário"
            icon={UserIcon}
            value={username}
            onChange={(e) => setUsername(e.target.value)}
          />
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
          <Select
            id="role"
            label="Cargo"
            icon={BriefcaseIcon}
            value={role}
            onChange={(e) => setRole(e.target.value)}
          >
            <option value="user">Aluno</option>
            <option value="teacher">Professor</option>
            <option value="admin">Administrador</option>
          </Select>

          {error && <p className={styles.errorMessage}>{error}</p>}

          <div className={styles.buttonGroup}>
            <Link
              href="/"
              className={`${styles.button} ${styles.secondaryButton}`}
            >
              Tem conta?
            </Link>
            <button
              type="submit"
              className={`${styles.button} ${styles.primaryButton}`}
              disabled={isLoading}
            >
              {isLoading ? "Registrando..." : "Registrar"}
            </button>
          </div>
        </form>
      </div>
    </AuthLayout>
  );
}
