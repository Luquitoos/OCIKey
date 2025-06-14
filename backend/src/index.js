import express from 'express';
import cors from 'cors';
import dotenv from 'dotenv';
import { apiRateLimiter } from './middleware/rateLimiter.js';
import { successResponse, errorResponse, responses } from './utils/response.js';
import cleanupService from './services/cleanupService.js';
import apiRoutes from './routes/routes.js';

// Carrega variáveis de ambiente do arquivo .env
dotenv.config();

// Inicializa aplicação Express
const app = express();
const PORT = process.env.PORT

// Configuração de middlewares globais
app.use(cors()); // Habilita CORS para todas as rotas
app.use(express.json()); // Parser para JSON
app.use(express.urlencoded({ extended: true })); // Parser para dados de formulário
app.use(apiRateLimiter); // Rate limiting geral para todas as rotas

/*
 Endpoint de verificação de saúde do servidor
 Retorna status OK e timestamp atual
*/
app.get('/health', (req, res) => {
  res.json(successResponse('OCIKey Backend está funcionando', {
    status: 'OK',
    timestamp: new Date().toISOString()
  }));
});

/*
 Configuração das rotas da API
 Todas as rotas são organizadas em módulos separados
*/
app.use('/api', apiRoutes);

/*
 Middleware global de tratamento de erros
 Captura todos os erros não tratados da aplicação
*/
app.use((err, req, res, next) => {
  console.error('Erro:', err); // Log do erro para debug
  res.status(500).json(errorResponse(
    responses.INTERNAL_ERROR,
    process.env.NODE_ENV === 'development' ? [err.message] : null 
  ));
});

/*
 Manipulador para rotas não encontradas (404)
 Deve ser o último middleware registrado
*/
app.use('*', (req, res) => {
  res.status(404).json(errorResponse(responses.NOT_FOUND));
});

/*
 Inicia o servidor HTTP na porta especificada
 Exibe informações de conexão no console
*/
app.listen(PORT, () => {
  console.log('OCIKey Backend iniciado com sucesso!');
  console.log(`Health check: http://localhost:${PORT}/health`);
  console.log(`API endpoints: http://localhost:${PORT}/api/`);
  
  // Inicia o serviço de limpeza automática
  cleanupService.start();
  
  process.on('SIGTERM', () => {
    console.log('Recebido SIGTERM, encerrando servidor...');
    cleanupService.stop();
    process.exit(0);
  });
  
  process.on('SIGINT', () => {
    console.log('Recebido SIGINT, encerrando servidor...');
    cleanupService.stop();
    process.exit(0);
  });
});