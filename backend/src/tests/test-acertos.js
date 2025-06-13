import { readImagePath } from './src/addon/index.js';
import { pool } from './src/config/database-config.js';
import path from 'path';

async function testAcertos() {
    try {
        console.log('=== Teste de Cálculo de Acertos ===');
        
        // Leitura da imagem
        const imagePath = path.join(process.cwd(), 'img', '0001.png');
        const leitura = readImagePath(imagePath);
        console.log('Leitura do addon:', leitura);
        
        // Buscar gabarito da prova
        const provaQuery = await pool.query('SELECT gabarito, peso_questao FROM provas WHERE id = $1', [leitura.id_prova]);
        const { gabarito, peso_questao } = provaQuery.rows[0];
        
        console.log('\nComparação:');
        console.log('Gabarito da prova:', gabarito);
        console.log('Leitura do aluno: ', leitura.leitura);
        console.log('Peso por questão: ', peso_questao);
        
        // Cálculo detalhado de acertos
        let acertos = 0;
        console.log('\nComparação questão por questão:');
        
        for (let i = 0; i < Math.min(gabarito.length, leitura.leitura.length); i++) {
            const respostaAluno = leitura.leitura[i];
            const respostaGabarito = gabarito[i];
            
            const isValid = respostaAluno !== '0' && respostaAluno !== 'X' && respostaAluno !== '?' && respostaAluno !== '-';
            const isCorrect = respostaGabarito === respostaAluno;
            
            if (isValid && isCorrect) {
                acertos++;
            }
            
            console.log(`Questão ${i+1}: Gabarito=${respostaGabarito}, Aluno=${respostaAluno}, Válida=${isValid}, Correta=${isCorrect}`);
        }
        
        const nota = parseFloat((acertos * peso_questao).toFixed(2));
        console.log(`\nResultado final: ${acertos} acertos, nota ${nota}`);
        
        // Verificar participante
        console.log('\n=== Verificação de Participante ===');
        const participanteCheck = await pool.query('SELECT id, nome FROM participantes WHERE id = $1', [leitura.id_participante]);
        if (participanteCheck.rows.length > 0) {
            console.log('Participante encontrado:', participanteCheck.rows[0]);
        } else {
            console.log(`Participante ID ${leitura.id_participante} não encontrado no banco`);
            console.log('Participantes disponíveis:');
            const todosParticipantes = await pool.query('SELECT id, nome FROM participantes ORDER BY id');
            todosParticipantes.rows.forEach(p => console.log(`  ID ${p.id}: ${p.nome}`));
        }
        
    } catch (error) {
        console.error('Erro:', error);
    } finally {
        await pool.end();
    }
}

testAcertos();