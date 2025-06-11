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
    'string.email': 'Por favor, forneça um endereço de email válido',
    'any.required': 'Email é obrigatório'
  });

/*
 Campo de senha reutilizável com validações padrão
 */
const passwordField = Joi.string()
  .min(6)
  .required()
  .messages({
    'string.min': 'Senha deve ter pelo menos 6 caracteres',
    'any.required': 'Senha é obrigatória'
  });

/*
 Campo de nome de usuário reutilizável com validações padrão
 */
const usernameField = Joi.string()
  .alphanum()
  .min(3)
  .max(30)
  .required()
  .messages({
    'string.alphanum': 'Nome de usuário deve conter apenas caracteres alfanuméricos',
    'string.min': 'Nome de usuário deve ter pelo menos 3 caracteres',
    'string.max': 'Nome de usuário não deve exceder 30 caracteres',
    'any.required': 'Nome de usuário é obrigatório'
  });

/*
 Campo de role reutilizável com valores válidos
*/
const roleField = Joi.string()
  .valid('user', 'admin', 'teacher')
  .default('user');

/*
 Schema de validação para registro de usuário
*/
export const registerSchema = Joi.object({
  username: usernameField,
  email: emailField,
  password: passwordField,
  role: roleField
});

/*
 Schema de validação para login de usuário
*/
export const loginSchema = Joi.object({
  email: emailField,
  password: Joi.string().required().messages({
    'any.required': 'Senha é obrigatória'
  })
});

/*
 Middleware genérico de validação
*/
export const validateRequest = (schema) => {
  return (req, res, next) => {
    const { error, value } = schema.validate(req.body);
    
    if (error) {
      return res.status(400).json(
        errorResponse(
          responses.VALIDATION_ERROR,
          error.details.map(detail => detail.message)
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