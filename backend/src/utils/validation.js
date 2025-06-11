import Joi from 'joi';
import { errorResponse, responses } from './response.js';

/*
 Utilitários de validação usando Joi
 Define schemas reutilizáveis e middleware de validação
*/

/*
 Campo de email reutilizável com validações padrão
 Valida formato de email e obrigatoriedade
*/
const emailField = Joi.string()
  .email() // Valida formato de email
  .required() // Campo obrigatório
  .messages({
    'string.email': 'Por favor, forneça um endereço de email válido',
    'any.required': 'Email é obrigatório'
  });

/*
 Campo de senha reutilizável com validações padrão
 Valida tamanho mínimo e obrigatoriedade
 */
const passwordField = Joi.string()
  .min(6) // Mínimo 6 caracteres
  .required() // Campo obrigatório
  .messages({
    'string.min': 'Senha deve ter pelo menos 6 caracteres',
    'any.required': 'Senha é obrigatória'
  });

/*
 Campo de nome de usuário reutilizável com validações padrão
 Valida caracteres alfanuméricos, tamanho e obrigatoriedade
 */
const usernameField = Joi.string()
  .alphanum() // Apenas caracteres alfanuméricos
  .min(3) // Mínimo 3 caracteres
  .max(30) // Máximo 30 caracteres
  .required() // Campo obrigatório
  .messages({
    'string.alphanum': 'Nome de usuário deve conter apenas caracteres alfanuméricos',
    'string.min': 'Nome de usuário deve ter pelo menos 3 caracteres',
    'string.max': 'Nome de usuário não deve exceder 30 caracteres',
    'any.required': 'Nome de usuário é obrigatório'
  });

/*
 Campo de role reutilizável com valores válidos
 Define roles permitidas no sistema
*/
const roleField = Joi.string()
  .valid('user', 'admin', 'teacher') // Valores permitidos
  .default('user'); // Valor padrão

/*
 Schema de validação para registro de usuário
 Combina todos os campos necessários para criar um usuário
*/
export const registerSchema = Joi.object({
  username: usernameField,
  email: emailField,
  password: passwordField,
  role: roleField
});

/*
 Schema de validação para login de usuário
 Apenas email e senha são necessários
*/
export const loginSchema = Joi.object({
  email: emailField,
  password: Joi.string().required().messages({
    'any.required': 'Senha é obrigatória'
  })
});

/*
 Middleware genérico de validação
 Valida o body da requisição contra um schema Joi
 schema - Schema Joi para validação
*/
export const validateRequest = (schema) => {
  return (req, res, next) => {
    // Valida o body da requisição contra o schema
    const { error, value } = schema.validate(req.body);
    
    // Se há erro de validação, retorna resposta de erro
    if (error) {
      return res.status(400).json(
        errorResponse(
          responses.VALIDATION_ERROR,
          error.details.map(detail => detail.message) // Extrai mensagens de erro
        )
      );
    }
    
    // Substitui req.body pelo valor validado (com defaults aplicados)
    req.body = value;
    next(); // Continua para o próximo middleware
  };
};

/*
 Middleware específico para validação de registro
 Aplica o schema de registro ao body da requisição
*/
export const validateRegistration = validateRequest(registerSchema);

/*
 Middleware específico para validação de login
 Aplica o schema de login ao body da requisição
*/
export const validateLogin = validateRequest(loginSchema);