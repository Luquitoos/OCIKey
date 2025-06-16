import { pool } from '../config/database-config.js';

/*
 * Migration para adicionar coluna user_id na tabela leituras
 * Isso permite rastrear quem criou cada leitura, especialmente importante
 * para leituras sem participante associado (como base.png)
 */

async function addUserIdToLeituras() {
    try {
        console.log('Iniciando migration: adicionar user_id à tabela leituras...');

        // Verificar se a coluna já existe
        const { rows: columnExists } = await pool.query(`
            SELECT column_name 
            FROM information_schema.columns 
            WHERE table_name = 'leituras' AND column_name = 'user_id'
        `);

        if (columnExists.length > 0) {
            console.log('Coluna user_id já existe na tabela leituras.');
            return;
        }

        // Adicionar a coluna user_id
        await pool.query(`
            ALTER TABLE leituras 
            ADD COLUMN user_id INTEGER REFERENCES users(id) ON DELETE SET NULL
        `);

        // Criar índice para otimização
        await pool.query(`
            CREATE INDEX IF NOT EXISTS idx_leituras_user ON leituras(user_id)
        `);

        console.log('✅ Coluna user_id adicionada à tabela leituras com sucesso!');

        // Tentar popular a coluna user_id para leituras existentes
        console.log('Populando user_id para leituras existentes...');
        
        const { rows: leiturasExistentes } = await pool.query(`
            UPDATE leituras 
            SET user_id = p.user_id 
            FROM participantes p 
            WHERE leituras.id_participante = p.id 
            AND leituras.user_id IS NULL
            RETURNING leituras.id
        `);

        console.log(`✅ ${leiturasExistentes.length} leituras existentes atualizadas com user_id.`);

        // Verificar leituras sem participante que ficaram sem user_id
        const { rows: leiturasSemUser } = await pool.query(`
            SELECT COUNT(*) as count 
            FROM leituras 
            WHERE user_id IS NULL
        `);

        if (parseInt(leiturasSemUser[0].count) > 0) {
            console.log(`⚠️  ${leiturasSemUser[0].count} leituras ficaram sem user_id (provavelmente sem participante associado).`);
            console.log('   Essas leituras precisarão ser associadas manualmente ou reprocessadas.');
        }

    } catch (error) {
        console.error('❌ Erro durante a migration:', error);
        throw error;
    } finally {
        await pool.end();
    }
}

// Executar a migration
addUserIdToLeituras()
    .then(() => {
        console.log('Migration concluída com sucesso!');
        process.exit(0);
    })
    .catch((error) => {
        console.error('Falha na migration:', error);
        process.exit(1);
    });