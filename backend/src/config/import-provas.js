/* 
 Script de Importação de Provas via CSV
 Permite importar dados de provas de arquivos CSV para o banco PostgreSQL
 Suporta inserção de novas provas e atualização de provas existentes
 Formato CSV esperado: Prova,Gabarito (com ou sem cabeçalho)
 Exemplo de linha: 1,eaedddccaedacbbcbacb
*/

import { createPool } from './database-config.js';
import fs from 'fs';
import path from 'path';

// Pool específico para importação (será fechado após uso para evitar conexões pendentes)
const pool = createPool();

/* Função principal para importar provas de arquivo CSV
   Processa cada linha do CSV e insere/atualiza no banco de dados
   caminhoArquivo - Caminho completo para o arquivo CSV
   pesoQuestao - Peso de cada questão para cálculo de notas (padrão: 0.50) */
const importarProvas = async (caminhoArquivo, pesoQuestao = 0.50) => {
  try {
    console.log(`Importando provas do arquivo: ${caminhoArquivo}`);
    
    // Verifica se o arquivo existe no sistema de arquivos
    if (!fs.existsSync(caminhoArquivo)) {
      throw new Error(`Arquivo não encontrado: ${caminhoArquivo}`);
    }

    // Lê o conteúdo completo do arquivo CSV em UTF-8
    const csvContent = fs.readFileSync(caminhoArquivo, 'utf-8');
    // Divide em linhas, remove espaços em branco e filtra linhas vazias
    const linhas = csvContent.split('\n').map(linha => linha.trim()).filter(linha => linha);
    
    if (linhas.length === 0) {
      throw new Error('Arquivo CSV está vazio');
    }

    // Detecta e remove cabeçalho automaticamente se presente
    const primeiraLinha = linhas[0].toLowerCase();
    if (primeiraLinha.includes('prova') && primeiraLinha.includes('gabarito')) {
      linhas.shift(); // Remove a primeira linha (cabeçalho)
      console.log('Cabeçalho detectado e removido');
    }

    let importadas = 0; // Contador de provas novas inseridas
    let atualizadas = 0; // Contador de provas existentes atualizadas

    // Processa cada linha do CSV
    for (const linha of linhas) {
      if (!linha) continue; // Pula linhas vazias
      
      // Divide a linha por vírgula e remove espaços extras
      const [prova, gabarito] = linha.split(',').map(item => item.trim());
      
      // Valida se ambos os campos estão presentes
      if (!prova || !gabarito) {
        console.warn(`Linha inválida ignorada: ${linha}`);
        continue;
      }

      // Converte ID da prova para número e valida
      const idProva = parseInt(prova);
      if (isNaN(idProva)) {
        console.warn(`ID de prova inválido ignorado: ${prova}`);
        continue;
      }

      try {
        // Verifica se a prova já existe no banco de dados
        const { rows: existingProva } = await pool.query(
          'SELECT id FROM provas WHERE id = $1',
          [idProva]
        );

        if (existingProva.length > 0) {
          // Atualiza prova existente com novos dados
          await pool.query(
            'UPDATE provas SET gabarito = $1, peso_questao = $2 WHERE id = $3',
            [gabarito, pesoQuestao, idProva]
          );
          atualizadas++;
          console.log(`Prova ${idProva} atualizada`);
        } else {
          // Insere nova prova no banco de dados
          await pool.query(
            'INSERT INTO provas (id, gabarito, peso_questao) VALUES ($1, $2, $3)',
            [idProva, gabarito, pesoQuestao]
          );
          importadas++;
          console.log(`Prova ${idProva} importada`);
        }
      } catch (dbError) {
        // Log de erro específico para cada prova que falhou
        console.error(`Erro ao processar prova ${idProva}:`, dbError.message);
      }
    }

    // Atualiza a sequence do PostgreSQL para evitar conflitos de ID
    // Garante que próximos IDs auto-gerados não conflitem com IDs importados
    await pool.query(`SELECT setval('provas_id_seq', (SELECT COALESCE(MAX(id), 1) FROM provas))`);

    // Relatório final da importação
    console.log(`\nImportação concluída:`);
    console.log(`- Provas importadas: ${importadas}`);
    console.log(`- Provas atualizadas: ${atualizadas}`);
    console.log(`- Total processado: ${importadas + atualizadas}`);

  } catch (error) {
    console.error('Erro na importação:', error.message);
    throw error;
  } finally {
    // Sempre fecha o pool de conexões para evitar vazamentos
    await pool.end();
  }
};

/* Função principal para execução via linha de comando
   Processa argumentos da linha de comando e executa a importação
   Argumentos: <caminho-do-arquivo-csv> [peso-questao] */
const main = async () => {
  // process.argv[0] = node, process.argv[1] = script, process.argv[2+] = argumentos
  const args = process.argv.slice(2);
  
  // Verifica se pelo menos o caminho do arquivo foi fornecido
  if (args.length === 0) {
    console.log('Uso: node import-provas.js <caminho-do-arquivo-csv> [peso-questao]');
    console.log('Exemplo: node import-provas.js ./provas.csv 0.50');
    process.exit(1);
  }

  const caminhoArquivo = args[0]; // Primeiro argumento: caminho do arquivo
  const pesoQuestao = args[1] ? parseFloat(args[1]) : 0.50; // Segundo argumento opcional: peso

  // Valida o peso da questão
  if (isNaN(pesoQuestao) || pesoQuestao <= 0) {
    console.error('Peso da questão deve ser um número positivo');
    process.exit(1);
  }

  try {
    await importarProvas(caminhoArquivo, pesoQuestao);
    console.log('Importação finalizada com sucesso!');
    process.exit(0); // Sucesso
  } catch (error) {
    console.error('Falha na importação:', error.message);
    process.exit(1); // Erro
  }
};

/* Executa a função main apenas se o script foi chamado diretamente
   Evita execução quando o arquivo é importado como módulo
   import.meta.url contém a URL do módulo atual */
if (import.meta.url === `file://${process.argv[1]}`) {
  main();
}

// Exporta a função para uso em outros módulos
export { importarProvas };