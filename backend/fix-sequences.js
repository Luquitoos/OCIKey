import { pool } from './src/config/database-config.js';

/*
 * Script para corrigir sequências do banco de dados
 * Resolve problemas de chave primária duplicada quando sequências ficam desatualizadas
 */

async function fixSequences() {
    try {
        console.log('🔧 Iniciando correção das sequências...');

        // Corrigir sequência da tabela users
        console.log('Corrigindo sequência da tabela users...');
        await pool.query(`
            SELECT setval('users_id_seq', (SELECT COALESCE(MAX(id), 1) FROM users))
        `);
        console.log('✅ Sequência users_id_seq corrigida');

        // Corrigir sequência da tabela participantes
        console.log('Corrigindo sequência da tabela participantes...');
        await pool.query(`
            SELECT setval('participantes_id_seq', (SELECT COALESCE(MAX(id), 1) FROM participantes))
        `);
        console.log('✅ Sequência participantes_id_seq corrigida');

        // Corrigir sequência da tabela provas
        console.log('Corrigindo sequência da tabela provas...');
        await pool.query(`
            SELECT setval('provas_id_seq', (SELECT COALESCE(MAX(id), 1) FROM provas))
        `);
        console.log('✅ Sequência provas_id_seq corrigida');

        // Corrigir sequência da tabela leituras
        console.log('Corrigindo sequência da tabela leituras...');
        await pool.query(`
            SELECT setval('leituras_id_seq', (SELECT COALESCE(MAX(id), 1) FROM leituras))
        `);
        console.log('✅ Sequência leituras_id_seq corrigida');

        // Verificar o estado atual das sequências
        console.log('\n📊 Estado atual das sequências:');
        
        const sequences = ['users_id_seq', 'participantes_id_seq', 'provas_id_seq', 'leituras_id_seq'];
        
        for (const seq of sequences) {
            try {
                const { rows } = await pool.query(`SELECT last_value FROM ${seq}`);
                console.log(`${seq}: ${rows[0].last_value}`);
            } catch (error) {
                console.log(`${seq}: não encontrada ou erro - ${error.message}`);
            }
        }

        console.log('\n✅ Correção das sequências concluída com sucesso!');

    } catch (error) {
        console.error('❌ Erro durante a correção das sequências:', error);
        throw error;
    } finally {
        await pool.end();
    }
}

// Executar a correção
fixSequences()
    .then(() => {
        console.log('Script de correção executado com sucesso!');
        process.exit(0);
    })
    .catch((error) => {
        console.error('Falha na correção das sequências:', error);
        process.exit(1);
    });