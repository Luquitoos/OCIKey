import { createPool } from './database-config.js';

// Pool específico para seed (será fechado após uso)
const pool = createPool();

/*
  Script genérico para popular o banco com dados de exemplo
  Cria estrutura básica para testes e desenvolvimento
*/
const seedDatabase = async () => {
  try {
    console.log('Verificando se já existem dados...');
    
    // Verifica se já existem dados para evitar duplicação
    const { rows: existingParticipantes } = await pool.query('SELECT COUNT(*) FROM participantes');
    const { rows: existingProvas } = await pool.query('SELECT COUNT(*) FROM provas');
    
    if (parseInt(existingParticipantes[0].count) > 0 || parseInt(existingProvas[0].count) > 0) {
      console.log('Dados já existem no banco. Seed cancelado.');
      return;
    }

    // Insere alguns dados básicos para teste
    console.log('Inserindo dados básicos para teste...');
    
    // Participante de exemplo
    await pool.query(
      `INSERT INTO participantes (nome, escola) VALUES ($1, $2)`,
      ['Participante Teste', 'Escola Teste']
    );

    // Prova de exemplo com gabarito padrão
    await pool.query(
      `INSERT INTO provas (gabarito, peso_questao) VALUES ($1, $2)`,
      ['abcdeabcdeabcdeabcde', 0.50]
    );

    console.log('Estrutura básica criada com sucesso!');
    console.log('Para adicionar dados reais, use as rotas da API ou importe CSVs.');
  } catch (error) {
    console.error('Erro ao criar estrutura básica:', error);
    throw error;
  } finally {
    await pool.end();
  }
};

// Executa o seed
seedDatabase()
  .then(() => {
    console.log('Seed do banco de dados finalizado');
    process.exit(0);
  })
  .catch((error) => {
    console.error('Falha no seed do banco de dados:', error);
    process.exit(1);
  });