import { createPool } from './database-config.js';

/* Script de configuração inicial do banco de dados
Cria todas as tabelas necessárias para o sistema de controle de gabaritos */

// Pool específico para setup (será fechado após uso)
const pool = createPool();

/*
  Função principal para criação das tabelas do banco
  Executa todas as queries DDL necessárias para inicializar o sistema
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
        role VARCHAR(20) DEFAULT 'user' CHECK (role IN ('admin', 'user', 'teacher')),
        created_at TIMESTAMP DEFAULT CURRENT_TIMESTAMP,
        updated_at TIMESTAMP DEFAULT CURRENT_TIMESTAMP
      )
    `);
    /*
     Tabela de escolas (mantida para compatibilidade futura)
     Pode ser usada para normalização dos dados de escola
    */
    await pool.query(`
      CREATE TABLE IF NOT EXISTS schools (
        id SERIAL PRIMARY KEY,
        name VARCHAR(100) NOT NULL,
        address TEXT,
        created_at TIMESTAMP DEFAULT CURRENT_TIMESTAMP,
        updated_at TIMESTAMP DEFAULT CURRENT_TIMESTAMP
      )
    `);
    /*
     Tabela de alunos/participantes
     Armazena dados dos participantes das provas
     Campos correspondem ao formato CSV: id, nome, escola
    */
    await pool.query(`
      CREATE TABLE IF NOT EXISTS alunos (
        id SERIAL PRIMARY KEY,
        nome VARCHAR(100) NOT NULL,
        escola VARCHAR(100) NOT NULL,
        created_at TIMESTAMP DEFAULT CURRENT_TIMESTAMP,
        updated_at TIMESTAMP DEFAULT CURRENT_TIMESTAMP
      )
    `);
    /*
     Tabela de provas
     Armazena gabaritos das provas
     Campos correspondem ao formato CSV: Prova, Gabarito
    */
    await pool.query(`
      CREATE TABLE IF NOT EXISTS provas (
        id SERIAL PRIMARY KEY,
        prova VARCHAR(100) NOT NULL,
        gabarito TEXT NOT NULL,
        created_at TIMESTAMP DEFAULT CURRENT_TIMESTAMP,
        updated_at TIMESTAMP DEFAULT CURRENT_TIMESTAMP
      )
    `);
    /*
     Tabela de leituras de gabaritos
     Armazena resultados do processamento das imagens
     Campos correspondem ao exemplo de output:
     arquivo, erro, id_prova, id_aluno, gabarito, acertos, nota
    */
    await pool.query(`
      CREATE TABLE IF NOT EXISTS leituras (
        id SERIAL PRIMARY KEY,
        arquivo VARCHAR(255) NOT NULL,
        erro INTEGER DEFAULT 0,
        id_prova INTEGER REFERENCES provas(id) ON DELETE CASCADE,
        id_aluno INTEGER REFERENCES alunos(id) ON DELETE SET NULL,
        gabarito TEXT,
        acertos VARCHAR(10),
        nota DECIMAL(5,2) DEFAULT 0.00,
        processed_at TIMESTAMP DEFAULT CURRENT_TIMESTAMP,
        created_at TIMESTAMP DEFAULT CURRENT_TIMESTAMP,
        updated_at TIMESTAMP DEFAULT CURRENT_TIMESTAMP
      )
    `);
    /*
     Criação de índices para otimização de performance
     Melhora velocidade de consultas em campos frequentemente pesquisados
    */
    await pool.query(`
      CREATE INDEX IF NOT EXISTS idx_users_email ON users(email);
      CREATE INDEX IF NOT EXISTS idx_users_username ON users(username);
      CREATE INDEX IF NOT EXISTS idx_leituras_id_prova ON leituras(id_prova);
      CREATE INDEX IF NOT EXISTS idx_leituras_id_aluno ON leituras(id_aluno);
    `);
    console.log('Configuração do Banco de Dados feita');
  } catch (error) {
    console.error('Erro ao configurar Banco de Dados:', error);
    throw error; // Repassa o erro para tratamento externo
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
    process.exit(0); // Sai com código de sucesso
  })
  .catch((error) => {
    console.error('Falha na inicialização do banco de dados:', error);
    process.exit(1); // Sai com código de erro
  });