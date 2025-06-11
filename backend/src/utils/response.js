/*
 Utilitário para padronizar respostas da API
 Garante consistência no formato de todas as respostas
*/

/*
  Cria uma resposta padronizada da API
  success - Indica se a operação foi bem-sucedida
  message - Mensagem descritiva da resposta
  data - Dados a serem retornados (opcional)
  errors - Array de erros (opcional)
  Objeto de resposta padronizado
 */
export const createResponse = (success, message, data = null, errors = null) => {
  const response = { success, message };
  
  // Adiciona dados apenas se fornecidos
  if (data !== null) {
    response.data = data;
  }
  
  // Adiciona erros apenas se fornecidos
  if (errors !== null) {
    response.errors = errors;
  }
  
  return response;
};

/*
 Cria uma resposta de sucesso
 message - Mensagem de sucesso
 data - Dados a serem retornados (opcional)
 Resposta de sucesso padronizada
*/
export const successResponse = (message, data = null) => {
  return createResponse(true, message, data);
};

/*
 Cria uma resposta de erro
 message - Mensagem de erro
 errors - Array de erros detalhados (opcional)
 Resposta de erro padronizada
*/
export const errorResponse = (message, errors = null) => {
  return createResponse(false, message, null, errors);
};

/*
 Constantes de mensagens padronizadas
 Centraliza todas as mensagens da aplicação para facilitar manutenção
*/
export const responses = {
  // Mensagens de autenticação
  INVALID_CREDENTIALS: 'Email ou senha inválidos',
  USER_REGISTERED: 'Usuário registrado com sucesso',
  LOGIN_SUCCESS: 'Login realizado com sucesso',
  LOGOUT_SUCCESS: 'Logout realizado com sucesso',
  EMAIL_EXISTS: 'Usuário com este email já existe',
  USERNAME_TAKEN: 'Nome de usuário já está em uso',
  
  // Mensagens de token/autenticação
  TOKEN_REQUIRED: 'Token de acesso obrigatório',
  TOKEN_INVALID: 'Token inválido',
  TOKEN_EXPIRED: 'Token inválido ou expirado',
  
  // Mensagens de permissões
  AUTH_REQUIRED: 'Autenticação obrigatória',
  INSUFFICIENT_PERMISSIONS: 'Permissões insuficientes',
  
  // Mensagens de erro gerais
  INTERNAL_ERROR: 'Erro interno do servidor',
  VALIDATION_ERROR: 'Erro de validação',
  NOT_FOUND: 'Recurso não encontrado',
  
  // Mensagens de banco de dados
  DB_ERROR: 'Erro no banco de dados',
  NO_FIELDS_UPDATE: 'Nenhum campo para atualizar'
};