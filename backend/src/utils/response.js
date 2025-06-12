/* 
 Utilitário para Padronização de Respostas da API
 Garante consistência no formato de todas as respostas HTTP
 Facilita manutenção e debugging ao centralizar estrutura de resposta
 Segue padrão REST API com campos success, message, data e errors
*/

/* Função principal para criar resposta padronizada da API
   Todas as respostas seguem o mesmo formato para consistência
   success - Boolean indicando se a operação foi bem-sucedida
   message - String com mensagem descritiva da resposta
   data - Objeto/Array com dados a serem retornados (opcional)
   errors - Array de erros detalhados (opcional)
   Retorna objeto de resposta padronizado */
export const createResponse = (success, message, data = null, errors = null) => {
  // Estrutura base da resposta sempre presente
  const response = { success, message };
  
  // Adiciona dados apenas se fornecidos (evita campos null desnecessários)
  if (data !== null) {
    response.data = data;
  }
  
  // Adiciona erros apenas se fornecidos (para respostas de erro)
  if (errors !== null) {
    response.errors = errors;
  }
  
  return response;
};

/* Função helper para criar resposta de sucesso
   Simplifica criação de respostas positivas
   message - String com mensagem de sucesso
   data - Dados a serem retornados (opcional)
   Retorna resposta de sucesso padronizada com success: true */
export const successResponse = (message, data = null) => {
  return createResponse(true, message, data);
};

/* Função helper para criar resposta de erro
   Simplifica criação de respostas de erro
   message - String com mensagem de erro principal
   errors - Array de erros detalhados (opcional, para validações)
   Retorna resposta de erro padronizada com success: false */
export const errorResponse = (message, errors = null) => {
  return createResponse(false, message, null, errors);
};

/* Constantes de mensagens padronizadas da aplicação
   Centraliza todas as mensagens para facilitar manutenção e internacionalização
   Evita strings hardcoded espalhadas pelo código
   Facilita mudanças de texto sem afetar lógica */
export const responses = {
  // Mensagens relacionadas à autenticação de usuários
  INVALID_CREDENTIALS: 'Email ou senha inválidos',
  USER_REGISTERED: 'Usuário registrado com sucesso',
  LOGIN_SUCCESS: 'Login realizado com sucesso',
  LOGOUT_SUCCESS: 'Logout realizado com sucesso',
  EMAIL_EXISTS: 'Usuário com este email já existe',
  USERNAME_TAKEN: 'Nome de usuário j�� está em uso',
  
  // Mensagens relacionadas a tokens JWT e autorização
  TOKEN_REQUIRED: 'Token de acesso obrigatório',
  TOKEN_INVALID: 'Token inválido',
  TOKEN_EXPIRED: 'Token inválido ou expirado',
  
  // Mensagens relacionadas a permissões e roles
  AUTH_REQUIRED: 'Autenticação obrigatória',
  INSUFFICIENT_PERMISSIONS: 'Permissões insuficientes',
  
  // Mensagens de erro gerais da aplicação
  INTERNAL_ERROR: 'Erro interno do servidor',
  VALIDATION_ERROR: 'Erro de validação',
  NOT_FOUND: 'Recurso não encontrado',
  
  // Mensagens relacionadas ao banco de dados
  DB_ERROR: 'Erro no banco de dados',
  NO_FIELDS_UPDATE: 'Nenhum campo para atualizar'
};