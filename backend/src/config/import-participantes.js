import { createPool } from './database-config.js';
import fs from 'fs';
import path from 'path';

// Pool específico para importação (será fechado após uso)
const pool = createPool();

/*
  Script para importar participantes de um arquivo CSV
  Formato esperado: id,nome,escola
  Exemplo: 1,Ana Clara Silva,Escola Nova
*/
const importarParticipantes = async (caminhoArquivo) => {
  try {
    console.log(`Importando participantes do arquivo: ${caminhoArquivo}`);
    
    // Verifica se o arquivo existe
    if (!fs.existsSync(caminhoArquivo)) {
      throw new Error(`Arquivo não encontrado: ${caminhoArquivo}`);
    }

    // Lê o arquivo CSV
    const csvContent = fs.readFileSync(caminhoArquivo, 'utf-8');
    const linhas = csvContent.split('\n').map(linha => linha.trim()).filter(linha => linha);
    
    if (linhas.length === 0) {
      throw new Error('Arquivo CSV está vazio');
    }

    // Remove cabeçalho se existir
    const primeiraLinha = linhas[0].toLowerCase();
    if (primeiraLinha.includes('id') && primeiraLinha.includes('nome') && primeiraLinha.includes('escola')) {
      linhas.shift();
      console.log('Cabeçalho detectado e removido');
    }

    let importados = 0;
    let atualizados = 0;

    for (const linha of linhas) {
      if (!linha) continue;
      
      const [id, nome, escola] = linha.split(',').map(item => item.trim());
      
      if (!id || !nome || !escola) {
        console.warn(`Linha inválida ignorada: ${linha}`);
        continue;
      }

      const idParticipante = parseInt(id);
      if (isNaN(idParticipante)) {
        console.warn(`ID de participante inválido ignorado: ${id}`);
        continue;
      }

      try {
        // Verifica se o participante já existe
        const { rows: existingParticipante } = await pool.query(
          'SELECT id FROM participantes WHERE id = $1',
          [idParticipante]
        );

        if (existingParticipante.length > 0) {
          // Atualiza participante existente
          await pool.query(
            'UPDATE participantes SET nome = $1, escola = $2 WHERE id = $3',
            [nome, escola, idParticipante]
          );
          atualizados++;
          console.log(`Participante ${idParticipante} atualizado`);
        } else {
          // Insere novo participante
          await pool.query(
            'INSERT INTO participantes (id, nome, escola) VALUES ($1, $2, $3)',
            [idParticipante, nome, escola]
          );
          importados++;
          console.log(`Participante ${idParticipante} importado`);
        }
      } catch (dbError) {
        console.error(`Erro ao processar participante ${idParticipante}:`, dbError.message);
      }
    }

    // Atualiza a sequence para evitar conflitos
    await pool.query(`SELECT setval('participantes_id_seq', (SELECT COALESCE(MAX(id), 1) FROM participantes))`);

    console.log(`\nImportação concluída:`);
    console.log(`- Participantes importados: ${importados}`);
    console.log(`- Participantes atualizados: ${atualizados}`);
    console.log(`- Total processado: ${importados + atualizados}`);

  } catch (error) {
    console.error('Erro na importação:', error.message);
    throw error;
  } finally {
    await pool.end();
  }
};

// Execução do script
const main = async () => {
  const args = process.argv.slice(2);
  
  if (args.length === 0) {
    console.log('Uso: node import-participantes.js <caminho-do-arquivo-csv>');
    console.log('Exemplo: node import-participantes.js ./participantes.csv');
    process.exit(1);
  }

  const caminhoArquivo = args[0];

  try {
    await importarParticipantes(caminhoArquivo);
    console.log('Importação finalizada com sucesso!');
    process.exit(0);
  } catch (error) {
    console.error('Falha na importação:', error.message);
    process.exit(1);
  }
};

// Executa apenas se chamado diretamente
if (import.meta.url === `file://${process.argv[1]}`) {
  main();
}

export { importarParticipantes };