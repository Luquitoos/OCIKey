import Joi from 'joi';
import { errorResponse, responses } from './response.js';

/*
 Utilitários de validação usando Joi
 Define schemas reutilizáveis e middleware de validação para autenticação
*/

/*
 Campo de email reutilizável com validações padrão
*/
const emailField = Joi.string()
  .email()
  .required()
  .messages({
    'string.empty': 'Email é obrigatório',
    'string.email': 'Por favor, forneça um endereço de email válido',
    'any.required': 'Email é obrigatório'
  });

/*
 Campo de senha reutilizável com validações padrão para registro
 */
const passwordField = Joi.string()
  .min(6)
  .max(128)
  .required()
  .messages({
    'string.empty': 'Senha é obrigatória',
    'string.min': 'Senha deve ter pelo menos 6 caracteres',
    'string.max': 'Senha não deve exceder 128 caracteres',
    'any.required': 'Senha é obrigatória'
  });

/*
 Campo de senha para login (sem validação de complexidade)
 */
const loginPasswordField = Joi.string()
  .required()
  .messages({
    'string.empty': 'Senha é obrigatória',
    'any.required': 'Senha é obrigatória'
  });

/*
 Campo de nome de usuário reutilizável com validações padrão
 Aceita letras (incluindo acentuadas), números e espaços
 */
const usernameField = Joi.string()
  .pattern(/^[a-zA-ZÀ-ÿ0-9\s]+$/)
  .min(3)
  .max(50)
  .required()
  .messages({
    'string.empty': 'Nome de usuário é obrigatório',
    'string.pattern.base': 'Nome de usuário deve conter apenas letras, números e espaços',
    'string.min': 'Nome de usuário deve ter pelo menos 3 caracteres',
    'string.max': 'Nome de usuário não deve exceder 50 caracteres',
    'any.required': 'Nome de usuário é obrigatório'
  });

/*
 Campo de escola reutilizável com validações padrão
 */
const escolaField = Joi.string()
  .trim()
  .min(2)
  .max(255)
  .required()
  .messages({
    'string.empty': 'Escola é obrigatória',
    'string.min': 'Escola deve ter pelo menos 2 caracteres',
    'string.max': 'Escola não deve exceder 255 caracteres',
    'any.required': 'Escola é obrigatória'
  });


/*
 Campo de role reutilizável com valores válidos
*/
const roleField = Joi.string()
  .valid('user', 'admin', 'teacher')
  .default('user')
  .messages({
    'any.only': 'Cargo deve ser: Aluno, Professor ou Administrador'
  });

/*
 Schema de validação para registro de usuário
*/
export const registerSchema = Joi.object({
  username: usernameField,
  email: emailField,
  password: passwordField,
  escola: escolaField,
  role: roleField
});

/*
 Schema de validação para login de usuário
*/
export const loginSchema = Joi.object({
  email: emailField,
  password: loginPasswordField
});

/*
 Middleware genérico de validação
*/
export const validateRequest = (schema) => {
  return (req, res, next) => {
    const { error, value } = schema.validate(req.body, {
      abortEarly: false, // Retorna todos os erros, não apenas o primeiro
      stripUnknown: true, // Remove campos não definidos no schema
      convert: true // Converte tipos automaticamente quando possível
    });
    
    if (error) {
      // Formatar erros de validação de forma mais detalhada
      const validationErrors = error.details.map(detail => ({
        field: detail.path.join('.'),
        message: detail.message,
        value: detail.context?.value
      }));

      return res.status(400).json(
        errorResponse(
          'Dados inválidos. Verifique os campos e tente novamente.',
          validationErrors
        )
      );
    }
    
    req.body = value;
    next();
  };
};

/*
 Middleware específico para validação de registro
*/
export const validateRegistration = validateRequest(registerSchema);

/*
 Middleware específico para validação de login
*/
export const validateLogin = validateRequest(loginSchema);