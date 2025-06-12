import Joi from 'joi';

// Esquemas de validação
const schemas = {
    // Validação para criação de participante
    criarParticipante: Joi.object({
        nome: Joi.string().trim().min(2).max(255).required()
            .messages({
                'string.empty': 'Nome é obrigatório',
                'string.min': 'Nome deve ter pelo menos 2 caracteres',
                'string.max': 'Nome deve ter no máximo 255 caracteres'
            }),
        escola: Joi.string().trim().min(2).max(255).required()
            .messages({
                'string.empty': 'Escola é obrigatória',
                'string.min': 'Escola deve ter pelo menos 2 caracteres',
                'string.max': 'Escola deve ter no máximo 255 caracteres'
            })
    }),

    // Validação para atualização de participante
    atualizarParticipante: Joi.object({
        nome: Joi.string().trim().min(2).max(255).optional(),
        escola: Joi.string().trim().min(2).max(255).optional()
    }).min(1),

    // Validação para criação de prova
    criarProva: Joi.object({
        gabarito: Joi.string().trim().min(1).max(500).required()
            .pattern(/^[a-eA-E0-9X?-]+$/)
            .messages({
                'string.empty': 'Gabarito é obrigatório',
                'string.pattern.base': 'Gabarito deve conter apenas letras a-e, números, X, ? ou -'
            }),
        pesoQuestao: Joi.number().positive().max(100).default(0.50)
            .messages({
                'number.positive': 'Peso da questão deve ser positivo',
                'number.max': 'Peso da questão deve ser no máximo 100'
            })
    }),

    // Validação para atualização de prova
    atualizarProva: Joi.object({
        gabarito: Joi.string().trim().min(1).max(500).optional()
            .pattern(/^[a-eA-E0-9X?-]+$/),
        pesoQuestao: Joi.number().positive().max(100).optional()
    }).min(1),

    // Validação para edição de leitura
    editarLeitura: Joi.object({
        id_prova: Joi.number().integer().min(-1).optional(),
        id_participante: Joi.number().integer().min(-1).optional(),
        gabarito: Joi.string().trim().max(500).optional()
            .pattern(/^[a-eA-E0-9X?-]+$/)
    }).min(1),

    // Validação para processamento de leitura
    processarLeitura: Joi.object({
        caminhoImagem: Joi.string().trim().required()
            .messages({
                'string.empty': 'Caminho da imagem é obrigatório'
            })
    }),

    // Validação para processamento múltiplo
    processarMultiplasLeituras: Joi.object({
        caminhosImagens: Joi.array().items(Joi.string().trim()).min(1).max(50).required()
            .messages({
                'array.min': 'Pelo menos uma imagem deve ser fornecida',
                'array.max': 'Máximo 50 imagens por vez'
            })
    }),

    // Validação para importação CSV
    importarCSV: Joi.object({
        csvData: Joi.string().trim().required()
            .messages({
                'string.empty': 'Dados CSV são obrigatórios'
            }),
        pesoQuestao: Joi.number().positive().max(100).default(0.50).optional()
    }),

    // Validação para parâmetros de consulta
    queryParams: Joi.object({
        page: Joi.number().integer().min(1).default(1),
        limit: Joi.number().integer().min(1).max(100).default(50),
        escola: Joi.string().trim().optional(),
        id_prova: Joi.number().integer().optional(),
        id_participante: Joi.number().integer().optional(),
        erro: Joi.number().integer().min(0).max(3).optional(),
        data_inicio: Joi.date().iso().optional(),
        data_fim: Joi.date().iso().optional()
    })
};

// Middleware de validação genérico
export const validate = (schema) => {
    return (req, res, next) => {
        const { error, value } = schema.validate(req.body, {
            abortEarly: false,
            stripUnknown: true,
            convert: true
        });

        if (error) {
            const errors = error.details.map(detail => ({
                field: detail.path.join('.'),
                message: detail.message
            }));

            return res.status(400).json({
                error: 'Dados inválidos',
                details: errors
            });
        }

        // Substitui req.body pelos dados validados e sanitizados
        req.body = value;
        next();
    };
};

// Middleware de validação para query parameters
export const validateQuery = (schema) => {
    return (req, res, next) => {
        const { error, value } = schema.validate(req.query, {
            abortEarly: false,
            stripUnknown: true,
            convert: true
        });

        if (error) {
            const errors = error.details.map(detail => ({
                field: detail.path.join('.'),
                message: detail.message
            }));

            return res.status(400).json({
                error: 'Parâmetros de consulta inválidos',
                details: errors
            });
        }

        req.query = value;
        next();
    };
};

// Middleware de validação para parâmetros de rota
export const validateParams = (paramSchema) => {
    return (req, res, next) => {
        const { error, value } = paramSchema.validate(req.params, {
            abortEarly: false,
            convert: true
        });

        if (error) {
            return res.status(400).json({
                error: 'Parâmetros de rota inválidos',
                details: error.details.map(detail => detail.message)
            });
        }

        req.params = value;
        next();
    };
};

// Esquemas específicos exportados
export const validationSchemas = schemas;

// Validações específicas mais usadas
export const validateId = validateParams(Joi.object({
    id: Joi.number().integer().positive().required()
        .messages({
            'number.base': 'ID deve ser um número',
            'number.positive': 'ID deve ser positivo'
        })
}));

export const validateCriarParticipante = validate(schemas.criarParticipante);
export const validateAtualizarParticipante = validate(schemas.atualizarParticipante);
export const validateCriarProva = validate(schemas.criarProva);
export const validateAtualizarProva = validate(schemas.atualizarProva);
export const validateEditarLeitura = validate(schemas.editarLeitura);
export const validateProcessarLeitura = validate(schemas.processarLeitura);
export const validateProcessarMultiplasLeituras = validate(schemas.processarMultiplasLeituras);
export const validateImportarCSV = validate(schemas.importarCSV);
export const validateQueryParams = validateQuery(schemas.queryParams);