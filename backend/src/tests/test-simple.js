import { readImagePath } from './src/addon/index.js';
import { pool } from './src/config/database-config.js';
import path from 'path';

async function testSimple() {
    try {
        console.log('=== Teste Simples ===');
        
        // Teste da leitura
        const imagePath = path.join(process.cwd(), 'img', '0001.png');
        console.log('Caminho:', imagePath);
        
        const leitura = readImagePath(imagePath);
        console.log('Leitura:', leitura);
        
        // Teste de inserção simples na tabela leituras
        console.log('\nTestando inserção simples...');
        const result = await pool.query(
            `INSERT INTO leituras (arquivo, erro, id_prova, id_participante, gabarito, acertos, nota)
            VALUES ($1, $2, $3, $4, $5, $6, $7)
            RETURNING *`,
            [
                imagePath,
                leitura.erro,
                leitura.id_prova,
                null, // Forçando NULL para id_participante
                leitura.leitura || '',
                0,
                0.0
            ]
        );
        
        console.log('Inserção bem-sucedida:', result.rows[0]);
        
    } catch (error) {
        console.error('Erro:', error);
    } finally {
        await pool.end();
    }
}

testSimple();