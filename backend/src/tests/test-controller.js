import { readImagePath } from './src/addon/index.js';
import { pool } from './src/config/database-config.js';
import path from 'path';

async function testController() {
    try {
        console.log('=== Teste do Controller ===');
        
        // Teste 1: Leitura da imagem
        const imagePath = path.join(process.cwd(), 'img', '0001.png');
        console.log('1. Testando leitura da imagem:', imagePath);
        
        const leitura = readImagePath(imagePath);
        console.log('Resultado da leitura:', leitura);
        
        // Teste 2: Busca da prova no banco
        console.log('\n2. Testando busca da prova no banco...');
        const provaQuery = await pool.query('SELECT gabarito, peso_questao FROM provas WHERE id = $1', [leitura.id_prova]);
        console.log('Prova encontrada:', provaQuery.rows[0]);
        
        // Teste 3: Cálculo de acertos
        console.log('\n3. Testando cálculo de acertos...');
        const { gabarito, peso_questao } = provaQuery.rows[0];
        let acertos = 0;
        
        for (let i = 0; i < Math.min(gabarito.length, leitura.leitura.length); i++) {
            const respostaAluno = leitura.leitura[i];
            if (respostaAluno !== '0' && respostaAluno !== 'X' && respostaAluno !== '?' && respostaAluno !== '-' && 
                gabarito[i] === respostaAluno) {
                acertos++;
            }
        }
        
        const nota = parseFloat((acertos * peso_questao).toFixed(2));
        console.log('Acertos:', acertos, 'Nota:', nota);
        
        // Teste 4: Inserção no banco
        console.log('\n4. Testando inserção no banco...');
        const result = await pool.query(
            `INSERT INTO leituras (arquivo, erro, id_prova, id_participante, gabarito, acertos, nota)
            VALUES ($1, $2, $3, $4, $5, $6, $7)
            RETURNING *`,
            [
                imagePath,
                leitura.erro,
                leitura.id_prova === -1 ? null : leitura.id_prova,
                leitura.id_participante === -1 ? null : leitura.id_participante,
                leitura.leitura || '',
                acertos,
                nota
            ]
        );
        
        console.log('Leitura salva:', result.rows[0]);
        console.log('\n=== Teste concluído com sucesso! ===');
        
    } catch (error) {
        console.error('Erro no teste:', error);
    } finally {
        await pool.end();
    }
}

testController();