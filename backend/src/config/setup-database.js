import { createPool } from './database-config.js';

/* Script de configuração inicial do banco de dados
Cria apenas as tabelas necessárias para o sistema de login */

// Pool específico para setup (será fechado após uso)
const pool = createPool();

/*
  Função principal para criação das tabelas do banco
  Executa todas as queries DDL necessárias para o sistema de login
*/
const createTables = async () => {
  try {
    /*
      Tabela de usuários do sistema
      Armazena dados de autenticação e autorização
    */
    await pool.query(`
      CREATE TABLE IF NOT EXISTS users (
        id SERIAL PRIMARY KEY,
        username VARCHAR(50) UNIQUE NOT NULL,
        email VARCHAR(100) UNIQUE NOT NULL,
        password VARCHAR(255) NOT NULL,
        escola VARCHAR(255),
        role VARCHAR(20) DEFAULT 'user' CHECK (role IN ('admin', 'user', 'teacher')),
        created_at TIMESTAMP DEFAULT CURRENT_TIMESTAMP,
        updated_at TIMESTAMP DEFAULT CURRENT_TIMESTAMP
      )
    `);

    /*
     Tabela de blacklist de tokens JWT
     Armazena tokens invalidados para logout seguro
    */
    await pool.query(`
      CREATE TABLE IF NOT EXISTS token_blacklist (
        id SERIAL PRIMARY KEY,
        token TEXT UNIQUE NOT NULL,
        expires_at TIMESTAMP NOT NULL,
        user_id INTEGER REFERENCES users(id) ON DELETE CASCADE,
        created_at TIMESTAMP DEFAULT CURRENT_TIMESTAMP
      )
    `);

    /*
     Tabela para rate limiting
     Controla tentativas de acesso por IP
    */
    await pool.query(`
      CREATE TABLE IF NOT EXISTS rate_limit_attempts (
        id SERIAL PRIMARY KEY,
        key VARCHAR(255) NOT NULL,
        created_at TIMESTAMP DEFAULT CURRENT_TIMESTAMP
      )
    `);

    /*
      Tabela de participantes
      Armazena dados dos alunos que fazem as provas
      user_id liga o participante ao usuário logado
    */
    await pool.query(`
      CREATE TABLE IF NOT EXISTS participantes (
        id SERIAL PRIMARY KEY,
        nome VARCHAR(255) NOT NULL,
        escola VARCHAR(255) NOT NULL,
        user_id INTEGER REFERENCES users(id) ON DELETE SET NULL,
        created_at TIMESTAMP DEFAULT CURRENT_TIMESTAMP
      )
    `);

    /*
      Tabela de provas
      Armazena os gabaritos das provas
    */
    await pool.query(`
      CREATE TABLE IF NOT EXISTS provas (
        id SERIAL PRIMARY KEY,
        gabarito VARCHAR(255) NOT NULL,
        peso_questao DECIMAL(5,2) DEFAULT 0.50,
        created_at TIMESTAMP DEFAULT CURRENT_TIMESTAMP
      )
    `);

    /*
      Tabela de leituras
      Armazena os resultados das leituras de gabaritos
    */
    await pool.query(`
      CREATE TABLE IF NOT EXISTS leituras (
        id SERIAL PRIMARY KEY,
        arquivo VARCHAR(255) NOT NULL,
        erro INTEGER NOT NULL,
        id_prova INTEGER,
        id_participante INTEGER,
        gabarito VARCHAR(255),
        acertos INTEGER,
        nota DECIMAL(5,2),
        created_at TIMESTAMP DEFAULT CURRENT_TIMESTAMP,
        FOREIGN KEY (id_prova) REFERENCES provas(id) ON DELETE SET NULL,
        FOREIGN KEY (id_participante) REFERENCES participantes(id) ON DELETE SET NULL
      )
    `);

    /*
     Criação de índices para otimização de performance
     Melhora velocidade de consultas em campos frequentemente pesquisados
    */
    await pool.query(`
      CREATE INDEX IF NOT EXISTS idx_users_email ON users(email);
      CREATE INDEX IF NOT EXISTS idx_users_username ON users(username);
      CREATE INDEX IF NOT EXISTS idx_users_escola ON users(escola);
      CREATE INDEX IF NOT EXISTS idx_token_blacklist_token ON token_blacklist(token);
      CREATE INDEX IF NOT EXISTS idx_token_blacklist_expires ON token_blacklist(expires_at);
      CREATE INDEX IF NOT EXISTS idx_rate_limit_key ON rate_limit_attempts(key);
      CREATE INDEX IF NOT EXISTS idx_rate_limit_created ON rate_limit_attempts(created_at);
      CREATE INDEX IF NOT EXISTS idx_leituras_prova ON leituras(id_prova);
      CREATE INDEX IF NOT EXISTS idx_leituras_participante ON leituras(id_participante);
      CREATE INDEX IF NOT EXISTS idx_participantes_nome ON participantes(nome);
      CREATE INDEX IF NOT EXISTS idx_participantes_user ON participantes(user_id);
    `);
    
    console.log('Configuração do Banco de Dados feita');
  } catch (error) {
    console.error('Erro ao configurar Banco de Dados:', error);
    throw error;
  } finally {
    // Fecha o pool após uso para evitar conexões pendentes
    await pool.end();
  }
};

/*
  Execução do script de setup
  Chama a função de criação e trata sucesso/erro
*/
createTables()
  .then(() => {
    console.log('Inicialização do banco de dados finalizada');
    process.exit(0);
  })
  .catch((error) => {
    console.error('Falha na inicialização do banco de dados:', error);
    process.exit(1);
  });