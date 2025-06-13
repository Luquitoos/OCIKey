import { pool } from './src/config/database-config.js';
import { getMockResult } from './mock-results.js';
import path from 'path';

async function Acertos(id_prova, resposta_aluno) {
    if (id_prova === -1 || id_prova === 0) {
        return { acertos: 0, nota: 0.00 };
    }

    const { rows } = await pool.query('SELECT gabarito, peso_questao FROM provas WHERE id = $1', [id_prova]);
    if (!rows.length) {
        throw new Error('Prova não encontrada');
    }
    
    const { gabarito, peso_questao } = rows[0];
    let acertos = 0;
    
    for (let i = 0; i < Math.min(gabarito.length, resposta_aluno.length); i++) {
        const respostaAluno = resposta_aluno[i];
        if (respostaAluno !== '0' && respostaAluno !== 'X' && respostaAluno !== '?' && respostaAluno !== '-' && 
            gabarito[i] === respostaAluno) {
            acertos++;
        }
    }
    
    const nota = parseFloat((acertos * peso_questao).toFixed(2));
    return { acertos, nota };
}

async function testSistemaCompleto() {
    try {
        console.log('=== Teste do Sistema Completo com Dados Mock ===');
        console.log('arquivo\t\terro\tid_prova\tid_aluno\tgabarito\t\tacertos\tnota');
        console.log('--------\t----\t--------\t--------\t----------------\t-------\t----');
        
        // Testar algumas imagens
        const imagens = ['0001.png', '0002.png', '0003.png', '0004.png', '0005.png'];
        
        for (const imgName of imagens) {
            const imagePath = path.join(process.cwd(), 'img', imgName);
            
            // Usar dados mock em vez do addon real
            const leitura = getMockResult(imgName);
            
            // Verificar se participante existe
            let participanteId = null;
            if (leitura.id_participante !== -1 && leitura.id_participante !== 0) {
                const participanteCheck = await pool.query('SELECT id FROM participantes WHERE id = $1', [leitura.id_participante]);
                if (participanteCheck.rows.length > 0) {
                    participanteId = leitura.id_participante;
                }
            }
            
            // Calcular acertos
            const { acertos, nota } = await Acertos(leitura.id_prova, leitura.leitura || '');
            
            console.log(`${imgName}\t\t${leitura.erro}\t${leitura.id_prova}\t\t${participanteId || 'null'}\t\t${leitura.leitura}\t${acertos}\t${nota}`);
        }
        
    } catch (error) {
        console.error('Erro:', error);
    } finally {
        await pool.end();
    }
}

testSistemaCompleto();