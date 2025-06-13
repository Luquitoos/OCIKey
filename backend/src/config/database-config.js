import pg from 'pg';
import dotenv from 'dotenv';

// Carrega variáveis de ambiente
dotenv.config();

const { Pool } = pg;

/* Configuração centralizada do banco de dados PostgreSQL, 
Definindo parâmetros de conexão com valores do env ou os padrões que criei no PostgreSQL */
export const dbConfig = {
  host: process.env.DB_HOST, // Host do banco (padrão: localhost)
  port: process.env.DB_PORT,// Porta do banco (padrão: 5000)
  database: process.env.DB_NAME,  // Nome do banco
  user: process.env.DB_USER,  // Usuário do banco
  password: process.env.DB_PASSWORD, // Senha do banco
};

/* Função para criar um pool de conexões PostgreSQL
Configura eventos de conexão e erro para logging
config - Configuração do banco (opcional, usa dbConfig por padrão)
Pool de conexões PostgreSQL configurado */
export const createPool = (config = dbConfig) => {
  // Cria novo pool com a configuração fornecida
  const pool = new Pool(config);
  
  // Flag para controlar se já foi mostrada a mensagem de conexão
  let connectionLogged = false;
  
  // Event listener para conexões bem-sucedidas
  pool.on('connect', () => {
    if (!connectionLogged) {
      console.log('Conectado ao Banco de Dados');
      connectionLogged = true;
    }
  });

  // Event listener para erros de conexão
  pool.on('error', (err) => {
    console.error('Erro de conexão com o Banco de Dados:', err);
  });

  return pool; // Retorna o pool configurado
};

export const pool = createPool(); // Exporta o pool para uso em outros módulos
