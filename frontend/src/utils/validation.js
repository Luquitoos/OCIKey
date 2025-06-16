// Utilitários de validação do lado do cliente
// Fornece validação em tempo real para melhorar a experiência do usuário

/**
 * Valida um endereço de email
 * @param {string} email - Email a ser validado
 * @returns {object} - { isValid: boolean, message: string }
 */
export const validateEmail = (email) => {
  if (!email || email.trim() === '') {
    return { isValid: false, message: 'Email é obrigatório' };
  }

  const emailRegex = /^[^\s@]+@[^\s@]+\.[^\s@]+$/;
  if (!emailRegex.test(email)) {
    return { isValid: false, message: 'Por favor, forneça um endereço de email válido' };
  }

  return { isValid: true, message: '' };
};

/**
 * Valida uma senha
 * @param {string} password - Senha a ser validada
 * @param {boolean} isRegistration - Se é para registro (validação mais rigorosa)
 * @returns {object} - { isValid: boolean, message: string }
 */
export const validatePassword = (password, isRegistration = false) => {
  if (!password || password.trim() === '') {
    return { isValid: false, message: 'Senha é obrigatória' };
  }

  if (isRegistration) {
    if (password.length < 6) {
      return { isValid: false, message: 'Senha deve ter pelo menos 6 caracteres' };
    }

    if (password.length > 128) {
      return { isValid: false, message: 'Senha não deve exceder 128 caracteres' };
    }

    // Validação de complexidade opcional (pode ser removida se muito restritiva)
    // const hasLower = /[a-z]/.test(password);
    // const hasUpper = /[A-Z]/.test(password);
    // const hasNumber = /\d/.test(password);
    
    // if (!hasLower || !hasUpper || !hasNumber) {
    //   return { 
    //     isValid: false, 
    //     message: 'Senha deve conter pelo menos uma letra minúscula, uma maiúscula e um número' 
    //   };
    // }
  }

  return { isValid: true, message: '' };
};

/**
 * Valida um nome de usuário
 * @param {string} username - Nome de usuário a ser validado
 * @returns {object} - { isValid: boolean, message: string }
 */
export const validateUsername = (username) => {
  if (!username || username.trim() === '') {
    return { isValid: false, message: 'Nome de usuário é obrigatório' };
  }

  if (username.length < 3) {
    return { isValid: false, message: 'Nome de usuário deve ter pelo menos 3 caracteres' };
  }

  if (username.length > 50) {
    return { isValid: false, message: 'Nome de usuário não deve exceder 50 caracteres' };
  }

  const alphanumSpaceRegex = /^[a-zA-Z0-9\s]+$/;
  if (!alphanumSpaceRegex.test(username)) {
    return { isValid: false, message: 'Nome de usuário deve conter apenas letras, números e espaços' };
  }

  return { isValid: true, message: '' };
};

/**
 * Valida o campo escola
 * @param {string} escola - Escola a ser validada
 * @param {string} role - Role do usuário (opcional)
 * @param {array} availableSchools - Lista de escolas disponíveis (opcional)
 * @returns {object} - { isValid: boolean, message: string }
 */
export const validateEscola = (escola, role = null, availableSchools = []) => {
  if (!escola || escola.trim() === '') {
    return { isValid: false, message: 'Escola é obrigatória' };
  }

  // Para professores, verificar se selecionou uma escola válida da lista
  if (role === 'teacher' && availableSchools.length > 0) {
    if (!availableSchools.includes(escola)) {
      return { isValid: false, message: 'Selecione uma instituição válida da lista' };
    }
  }

  if (escola.trim().length < 2) {
    return { isValid: false, message: 'Escola deve ter pelo menos 2 caracteres' };
  }

  if (escola.length > 255) {
    return { isValid: false, message: 'Escola não deve exceder 255 caracteres' };
  }

  return { isValid: true, message: '' };
};

/**
 * Valida o campo role
 * @param {string} role - Role a ser validada
 * @returns {object} - { isValid: boolean, message: string }
 */
export const validateRole = (role) => {
  const validRoles = ['user', 'admin', 'teacher'];
  
  if (!role || !validRoles.includes(role)) {
    return { isValid: false, message: 'Cargo deve ser: Aluno, Professor ou Administrador' };
  }

  return { isValid: true, message: '' };
};

/**
 * Valida todos os campos de registro
 * @param {object} formData - Dados do formulário
 * @param {array} availableSchools - Lista de escolas disponíveis (opcional)
 * @returns {object} - { isValid: boolean, errors: array }
 */
export const validateRegistrationForm = (formData, availableSchools = []) => {
  const errors = [];
  
  const emailValidation = validateEmail(formData.email);
  if (!emailValidation.isValid) {
    errors.push({ field: 'email', message: emailValidation.message });
  }

  const passwordValidation = validatePassword(formData.password, true);
  if (!passwordValidation.isValid) {
    errors.push({ field: 'password', message: passwordValidation.message });
  }

  const usernameValidation = validateUsername(formData.username);
  if (!usernameValidation.isValid) {
    errors.push({ field: 'username', message: usernameValidation.message });
  }

  const escolaValidation = validateEscola(formData.escola, formData.role, availableSchools);
  if (!escolaValidation.isValid) {
    errors.push({ field: 'escola', message: escolaValidation.message });
  }

  const roleValidation = validateRole(formData.role);
  if (!roleValidation.isValid) {
    errors.push({ field: 'role', message: roleValidation.message });
  }

  return {
    isValid: errors.length === 0,
    errors
  };
};

/**
 * Valida todos os campos de login
 * @param {object} formData - Dados do formulário
 * @returns {object} - { isValid: boolean, errors: array }
 */
export const validateLoginForm = (formData) => {
  const errors = [];
  
  const emailValidation = validateEmail(formData.email);
  if (!emailValidation.isValid) {
    errors.push({ field: 'email', message: emailValidation.message });
  }

  const passwordValidation = validatePassword(formData.password, false);
  if (!passwordValidation.isValid) {
    errors.push({ field: 'password', message: passwordValidation.message });
  }

  return {
    isValid: errors.length === 0,
    errors
  };
};

/**
 * Extrai erros de uma resposta da API
 * @param {object} response - Resposta da API
 * @returns {array} - Array de erros formatados
 */
export const extractApiErrors = (response) => {
  if (!response) return [];

  // Se a resposta tem um array de erros
  if (response.errors && Array.isArray(response.errors)) {
    return response.errors;
  }

  // Se a resposta tem uma mensagem de erro simples
  if (response.message) {
    return [{ message: response.message }];
  }

  // Se a resposta tem um campo error (compatibilidade)
  if (response.error) {
    return [{ message: response.error }];
  }

  // Se a resposta é uma string
  if (typeof response === 'string') {
    return [{ message: response }];
  }

  return [];
};