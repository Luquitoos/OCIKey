import { pool } from '../config/database-config.js';

/*
 * Teste final para verificar se leituras sem participante
 * (como base.png e imagens com erro Aztec) aparecem na listagem
 */

async function testeLeiturasSemParticipanteFinal() {
    try {
        console.log('=== TESTE FINAL - LEITURAS SEM PARTICIPANTE ===\n');

        // 1. Buscar usuário para teste
        console.log('1. Buscando usuário para teste...');
        const { rows: usuarios } = await pool.query('SELECT id, username FROM users WHERE role = \'user\' LIMIT 1');
        
        if (usuarios.length === 0) {
            console.log('Nenhum usuário encontrado');
            return;
        }

        const usuario = usuarios[0];
        console.log(`Usuário: ${usuario.username} (ID: ${usuario.id})`);

        // 2. Criar leituras de teste sem participante
        console.log('\n2. Criando leituras de teste sem participante...');
        
        // Leitura tipo base.png (id_prova = 0, id_participante = null)
        const { rows: leituraBase } = await pool.query(`
            INSERT INTO leituras (arquivo, erro, id_prova, id_participante, gabarito, acertos, nota, user_id)
            VALUES ($1, $2, $3, $4, $5, $6, $7, $8)
            RETURNING *
        `, [
            'test_base.png',
            0, // sem erro
            0, // id_prova = 0
            null, // sem participante
            '--------------------',
            0,
            0.00,
            usuario.id
        ]);

        console.log(`Leitura base.png criada: ID ${leituraBase[0].id}`);

        // Leitura tipo erro Aztec (id_prova = null, id_participante = null)
        const { rows: leituraErro } = await pool.query(`
            INSERT INTO leituras (arquivo, erro, id_prova, id_participante, gabarito, acertos, nota, user_id)
            VALUES ($1, $2, $3, $4, $5, $6, $7, $8)
            RETURNING *
        `, [
            'test_erro_aztec.png',
            1, // erro no código Aztec
            null, // prova não identificada
            null, // sem participante
            'X-dd-c--e-d-ccbcbacd',
            0,
            0.00,
            usuario.id
        ]);

        console.log(`Leitura erro Aztec criada: ID ${leituraErro[0].id}`);

        // 3. Testar query de listagem
        console.log('\n3. Testando query de listagem...');
        
        const userId = usuario.id;
        
        let query = `
            SELECT 
                l.id, l.arquivo, l.erro, l.id_prova, l.id_participante, 
                l.gabarito, l.acertos, l.nota, l.created_at,
                p.nome as participante_nome, p.escola as participante_escola,
                pr.gabarito as prova_gabarito, pr.peso_questao
            FROM leituras l
            LEFT JOIN participantes p ON l.id_participante = p.id
            LEFT JOIN provas pr ON l.id_prova = pr.id
        `;
        
        let params = [];
        let whereConditions = [];

        // Aplicar filtro para usuário comum (incluindo leituras sem participante)
        whereConditions.push(`(p.user_id = $${params.length + 1} OR (l.user_id = $${params.length + 2} AND l.id_participante IS NULL))`);
        params.push(userId, userId);

        const whereClause = whereConditions.length > 0 ? ' WHERE ' + whereConditions.join(' AND ') : '';
        const finalQuery = query + whereClause + ' ORDER BY l.created_at DESC';

        console.log('   Query executada:');
        console.log(`   ${finalQuery}`);
        console.log(`   Parâmetros: [${params.join(', ')}]`);

        const { rows: leituras } = await pool.query(finalQuery, params);
        
        console.log(`Encontradas ${leituras.length} leituras para o usuário:`);

        // 4. Verificar se as leituras de teste aparecem
        console.log('\n4. Verificando leituras encontradas...');
        
        let baseEncontrada = false;
        let erroEncontrado = false;
        
        leituras.forEach((l, index) => {
            const participante = l.participante_nome || 'NÃO ENCONTRADO';
            const prova = l.id_prova || 'NÃO ENCONTRADA';
            
            console.log(`   ${index + 1}. ID: ${l.id}, Arquivo: ${l.arquivo}, Participante: ${participante}, Prova: ${prova}, Erro: ${l.erro}`);
            
            if (l.arquivo === 'test_base.png') {
                baseEncontrada = true;
            }
            if (l.arquivo === 'test_erro_aztec.png') {
                erroEncontrado = true;
            }
        });

        // 5. Verificar resultados
        console.log('\n5. Verificando resultados...');
        
        if (baseEncontrada) {
            console.log('Leitura base.png encontrada na listagem!');
        } else {
            console.log('Leitura base.png NÃO encontrada na listagem!');
        }

        if (erroEncontrado) {
            console.log('Leitura com erro Aztec encontrada na listagem!');
        } else {
            console.log('Leitura com erro Aztec NÃO encontrada na listagem!');
        }

        // 6. Testar formatação na resposta da API
        console.log('\n6. Testando formatação da resposta da API...');
        
        const leiturasSemParticipante = leituras.filter(l => !l.participante_nome);
        
        console.log(`   Leituras sem participante: ${leiturasSemParticipante.length}`);
        leiturasSemParticipante.forEach(l => {
            console.log(`${l.arquivo}: Participante = "NÃO ENCONTRADO", Prova = ${l.id_prova || 'NÃO ENCONTRADA'}`);
        });

        // 7. Testar query de contagem
        console.log('\n7. Testando query de contagem...');
        
        const countQuery = `
            SELECT COUNT(*) 
            FROM leituras l
            LEFT JOIN participantes p ON l.id_participante = p.id
        ` + whereClause;
        const countParams = params;
        
        const { rows: countRows } = await pool.query(countQuery, countParams);
        const total = parseInt(countRows[0].count);
        console.log(`Total de leituras: ${total}`);

        // 8. Limpar dados de teste
        console.log('\n8. Limpando dados de teste...');
        await pool.query('DELETE FROM leituras WHERE arquivo IN ($1, $2)', ['test_base.png', 'test_erro_aztec.png']);
        console.log('Dados de teste removidos.');

        console.log('\n=== TESTE CONCLUÍDO ===');
        
        if (baseEncontrada && erroEncontrado) {
            console.log('\nSUCESSO! Todas as leituras sem participante aparecem na listagem!');
            console.log('\nComportamento esperado:');
            console.log('base.png: Participante = "NÃO ENCONTRADO", Prova = 0');
            console.log('erro_aztec.png: Participante = "NÃO ENCONTRADO", Prova = "NÃO ENCONTRADA"');
        } else {
            console.log('\nFALHA! Algumas leituras sem participante não aparecem na listagem.');
        }

    } catch (error) {
        console.error('Erro durante o teste:', error);
        console.error('Stack trace:', error.stack);
    } finally {
        // Garantir limpeza mesmo em caso de erro
        try {
            await pool.query('DELETE FROM leituras WHERE arquivo IN ($1, $2)', ['test_base.png', 'test_erro_aztec.png']);
        } catch (cleanupError) {
            console.error('Erro na limpeza:', cleanupError);
        }
        await pool.end();
    }
}

// Executar o teste
testeLeiturasSemParticipanteFinal().catch(console.error);