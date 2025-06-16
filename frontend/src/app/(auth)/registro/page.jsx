"use client";

import Link from "next/link";
import { useState, useEffect } from "react";
import { useRouter } from "next/navigation";
import { useAuth } from "@/contexts/AuthContext";
import styles from "@/components/styles/auth.module.css";
import AuthLayout from "@/components/AuthLayout";
import AuthHeader from "@/components/AuthHeader";
import Input from "@/components/ui/Input";
import Select from "@/components/ui/Select";
import ValidationErrors from "@/components/ui/ValidationErrors";
import {
  AtSymbolIcon,
  LockClosedIcon,
  UserIcon,
  BriefcaseIcon,
  AcademicCapIcon,
} from "@heroicons/react/24/solid";
import { 
  validateEmail, 
  validatePassword, 
  validateUsername, 
  validateEscola,
  extractApiErrors 
} from "@/utils/validation";
import apiService from "@/services/api";

export default function RegisterPage() {
  const [username, setUsername] = useState("");
  const [email, setEmail] = useState("");
  const [password, setPassword] = useState("");
  const [school, setSchool] = useState("");
  const [role, setRole] = useState("user"); // Valor padrão
  const [errors, setErrors] = useState([]);
  const [fieldErrors, setFieldErrors] = useState({});
  const [isLoading, setIsLoading] = useState(false);
  const [schools, setSchools] = useState([]);
  const [loadingSchools, setLoadingSchools] = useState(false);
  const { register } = useAuth();
  const router = useRouter();

  // Buscar escolas quando o componente montar
  useEffect(() => {
    const fetchSchools = async () => {
      try {
        setLoadingSchools(true);
        const response = await apiService.getEscolas();
        if (response && response.success) {
          setSchools(response.data.escolas || []);
        }
      } catch (error) {
        console.error('Erro ao buscar escolas:', error);
        // Não mostrar erro para o usuário, apenas log
      } finally {
        setLoadingSchools(false);
      }
    };

    fetchSchools();
  }, []);

  // Limpar campo escola quando mudar o role
  useEffect(() => {
    setSchool("");
    setFieldErrors(prev => ({ ...prev, escola: null }));
  }, [role]);

  const getSchoolFieldLabel = () => {
    switch (role) {
      case 'teacher':
        return 'Instituição';
      case 'admin':
        return 'Entidade';
      default:
        return 'Escola';
    }
  };

  const getSchoolFieldPlaceholder = () => {
    switch (role) {
      case 'teacher':
        return 'Digite a instituição que representa';
      case 'admin':
        return 'Digite a entidade que representa';
      default:
        return 'Digite o nome da sua escola';
    }
  };

  const getRoleColor = () => {
    switch (role) {
      case 'teacher':
        return '#8B7135';
      case 'admin':
        return '#9B4E37';
      case 'user':
        return '#37522E';
      default:
        return '#37522E';
    }
  };

  const getDynamicStyles = () => {
    const color = getRoleColor();
    const secondaryColor = getSecondaryColor();
    const secondaryHoverColor = getSecondaryHoverColor();
    
    return {
      '--primary': color,
      '--primary-darker': color,
      '--secondary-button-color': secondaryColor,
      '--secondary-button-hover': secondaryHoverColor,
    };
  };

  const getSecondaryColor = () => {
    switch (role) {
      case 'teacher':
        return '#735D2C';
      case 'admin':
        return '#783C2B';
      case 'user':
        return '#2D4225';
      default:
        return '#2D4225';
    }
  };

  const getSecondaryHoverColor = () => {
    switch (role) {
      case 'teacher':
        return '#5A4722'; // Mais escuro que #735D2C
      case 'admin':
        return '#5F2F21'; // Mais escuro que #783C2B
      case 'user':
        return '#1F2E1A'; // Mais escuro que #2D4225
      default:
        return '#1F2E1A';
    }
  };

  // Validação em tempo real para cada campo
  const handleUsernameBlur = () => {
    const validation = validateUsername(username);
    setFieldErrors(prev => ({
      ...prev,
      username: validation.isValid ? null : validation.message
    }));
  };

  const handleEmailBlur = () => {
    const validation = validateEmail(email);
    setFieldErrors(prev => ({
      ...prev,
      email: validation.isValid ? null : validation.message
    }));
  };

  const handlePasswordBlur = () => {
    const validation = validatePassword(password, true);
    setFieldErrors(prev => ({
      ...prev,
      password: validation.isValid ? null : validation.message
    }));
  };

  const handleSchoolBlur = () => {
    const validation = validateEscola(school, role, schools);
    setFieldErrors(prev => ({
      ...prev,
      escola: validation.isValid ? null : validation.message
    }));
  };

  const handleSubmit = async (event) => {
    event.preventDefault();
    setIsLoading(true);
    setErrors([]);
    setFieldErrors({});

    // Validação do lado do cliente
    const usernameValidation = validateUsername(username);
    const emailValidation = validateEmail(email);
    const passwordValidation = validatePassword(password, true);
    const escolaValidation = validateEscola(school, role, schools);

    const clientErrors = [];
    if (!usernameValidation.isValid) {
      clientErrors.push({ field: 'username', message: usernameValidation.message });
    }
    if (!emailValidation.isValid) {
      clientErrors.push({ field: 'email', message: emailValidation.message });
    }
    if (!passwordValidation.isValid) {
      clientErrors.push({ field: 'password', message: passwordValidation.message });
    }
    if (!escolaValidation.isValid) {
      clientErrors.push({ field: 'escola', message: escolaValidation.message });
    }

    if (clientErrors.length > 0) {
      setErrors(clientErrors);
      setIsLoading(false);
      return;
    }
    
    try {
      const userData = { username, email, password, escola: school, role };
      const result = await register(userData);
      if (result.success) {
        router.push('/dashboard');
      } else {
        // Extrair erros da resposta da API
        const apiErrors = extractApiErrors(result);
        setErrors(apiErrors);
      }
    } catch (err) {
      console.error('Erro no registro:', err);
      setErrors([{ message: err.message || "Ocorreu um erro inesperado." }]);
    } finally {
      setIsLoading(false);
    }
  };

  return (
    <div style={getDynamicStyles()}>
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
            onBlur={handleUsernameBlur}
            placeholder="Digite seu nome completo"
            error={fieldErrors.username}
            success={username && !fieldErrors.username}
          />
          <Input
            id="email"
            label="Email"
            type="email"
            icon={AtSymbolIcon}
            value={email}
            onChange={(e) => setEmail(e.target.value)}
            onBlur={handleEmailBlur}
            placeholder="Digite um email válido"
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
            placeholder="Mínimo 6 caracteres"
            error={fieldErrors.password}
            success={password && !fieldErrors.password}
          />
          {role === 'teacher' ? (
            <Select
              id="school"
              label={getSchoolFieldLabel()}
              icon={AcademicCapIcon}
              value={school}
              onChange={(e) => setSchool(e.target.value)}
              onBlur={handleSchoolBlur}
              error={fieldErrors.escola}
              success={school && !fieldErrors.escola}
              disabled={loadingSchools}
            >
              <option value="">
                {loadingSchools ? 'Carregando escolas...' : 'Selecione uma instituição'}
              </option>
              {schools.map((schoolName, index) => (
                <option key={index} value={schoolName}>
                  {schoolName}
                </option>
              ))}
            </Select>
          ) : (
            <Input
              id="school"
              label={getSchoolFieldLabel()}
              icon={AcademicCapIcon}
              value={school}
              onChange={(e) => setSchool(e.target.value)}
              onBlur={handleSchoolBlur}
              placeholder={getSchoolFieldPlaceholder()}
              error={fieldErrors.escola}
              success={school && !fieldErrors.escola}
            />
          )}
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

          <ValidationErrors errors={errors} />

          <div className={styles.buttonGroup}>
            <Link
              href="/"
              className={`${styles.button} ${styles.secondaryButton}`}
              style={{
                backgroundColor: getSecondaryColor(),
                '--hover-color': getSecondaryHoverColor(),
              }}
              onMouseEnter={(e) => {
                e.target.style.backgroundColor = getSecondaryHoverColor();
              }}
              onMouseLeave={(e) => {
                e.target.style.backgroundColor = getSecondaryColor();
              }}
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
    </div>
  );
}
