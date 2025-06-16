import { pool } from '../config/database-config.js';
import { readImagePath } from '../addon/index.js';

/*
 * Teste para verificar o comportamento de leituras cross-user
 * Simula o cenário onde um usuário faz a leitura de uma prova de outro participante
 */

async function testeLeituraCrossUser() {
    try {
        console.log('=== TESTE DE LEITURA CROSS-USER ===\n');

        // 1. Criar usuários de teste
        console.log('1. Criando usuários de teste...');
        
        // Limpar dados de teste anteriores
        await pool.query('DELETE FROM leituras WHERE arquivo LIKE \'%test%\'');
        await pool.query('DELETE FROM participantes WHERE nome LIKE \'%Teste%\'');
        await pool.query('DELETE FROM users WHERE username LIKE \'%test%\'');

        // Criar usuário A
        const userA = await pool.query(`
            INSERT INTO users (username, email, password, role) 
            VALUES ('userA_test', 'userA@test.com', 'password123', 'user') 
            RETURNING id, username
        `);
        const userAId = userA.rows[0].id;
        console.log(`   Usuário A criado: ID ${userAId} - ${userA.rows[0].username}`);

        // Criar usuário B
        const userB = await pool.query(`
            INSERT INTO users (username, email, password, role) 
            VALUES ('userB_test', 'userB@test.com', 'password123', 'user') 
            RETURNING id, username
        `);
        const userBId = userB.rows[0].id;
        console.log(`   Usuário B criado: ID ${userBId} - ${userB.rows[0].username}`);

        // 2. Criar participantes
        console.log('\n2. Criando participantes...');
        
        // Participante do usuário A
        const participanteA = await pool.query(`
            INSERT INTO participantes (nome, escola, user_id) 
            VALUES ('João Silva Teste', 'Escola Alpha', $1) 
            RETURNING id, nome, escola
        `, [userAId]);
        const participanteAId = participanteA.rows[0].id;
        console.log(`   Participante A: ID ${participanteAId} - ${participanteA.rows[0].nome} (${participanteA.rows[0].escola})`);

        // Participante do usuário B
        const participanteB = await pool.query(`
            INSERT INTO participantes (nome, escola, user_id) 
            VALUES ('Maria Santos Teste', 'Escola Beta', $1) 
            RETURNING id, nome, escola
        `, [userBId]);
        const participanteBId = participanteB.rows[0].id;
        console.log(`   Participante B: ID ${participanteBId} - ${participanteB.rows[0].nome} (${participanteB.rows[0].escola})`);

        // 3. Criar uma prova de teste
        console.log('\n3. Criando prova de teste...');
        const prova = await pool.query(`
            INSERT INTO provas (gabarito, peso_questao) 
            VALUES ('abcdeabcdeabcdeabcde', 0.5) 
            RETURNING id, gabarito
        `);
        const provaId = prova.rows[0].id;
        console.log(`   Prova criada: ID ${provaId} - Gabarito: ${prova.rows[0].gabarito}`);

        // 4. Simular leitura usando a função processarUmaLeitura
        console.log('\n4. Simulando leitura cross-user...');
        
        // Importar a função processarUmaLeitura (simulando o comportamento)
        async function simularProcessarUmaLeitura(caminhoImagem, userId, mockLeitura) {
            // Simula o resultado do addon
            const leitura = mockLeitura;
            
            // Calcula acertos (simulado)
            const acertos = 15;
            const nota = 7.5;

            let participanteId = null;
            let participanteOriginalInfo = null;

            // Verifica se o participante da leitura existe no banco
            if (leitura.id_participante !== -1) {
                const participanteOriginalCheck = await pool.query(
                    'SELECT id, nome, escola, user_id FROM participantes WHERE id = $1', 
                    [leitura.id_participante]
                );
                
                if (participanteOriginalCheck.rows.length > 0) {
                    const participanteOriginal = participanteOriginalCheck.rows[0];
                    participanteOriginalInfo = {
                        id: participanteOriginal.id,
                        nome: participanteOriginal.nome,
                        escola: participanteOriginal.escola,
                        user_id: participanteOriginal.user_id
                    };

                    console.log(`   Participante original encontrado: ${participanteOriginal.nome} (User ID: ${participanteOriginal.user_id})`);
                    console.log(`   Usuário fazendo a leitura: ${userId}`);

                    // Se o participante da leitura pertence ao usuário atual, usa normalmente
                    if (participanteOriginal.user_id === userId) {
                        participanteId = leitura.id_participante;
                        console.log(`Participante pertence ao usuário atual, usando ID original: ${participanteId}`);
                    } else {
                        console.log(`Participante pertence a outro usuário, criando/encontrando cópia...`);
                        
                        // Se o participante da leitura pertence a outro usuário,
                        // cria ou encontra um participante com o mesmo nome e escola para o usuário atual
                        const participanteExistenteCheck = await pool.query(
                            'SELECT id FROM participantes WHERE nome = $1 AND escola = $2 AND user_id = $3',
                            [participanteOriginal.nome, participanteOriginal.escola, userId]
                        );

                        if (participanteExistenteCheck.rows.length > 0) {
                            // Usa o participante existente do usuário atual
                            participanteId = participanteExistenteCheck.rows[0].id;
                            console.log(`   → Participante já existe para o usuário atual: ID ${participanteId}`);
                        } else {
                            // Cria um novo participante para o usuário atual com os dados originais
                            const novoParticipante = await pool.query(
                                'INSERT INTO participantes (nome, escola, user_id) VALUES ($1, $2, $3) RETURNING id',
                                [participanteOriginal.nome, participanteOriginal.escola, userId]
                            );
                            participanteId = novoParticipante.rows[0].id;
                            console.log(`   → Novo participante criado para o usuário atual: ID ${participanteId}`);
                        }
                    }
                }
            }

            // Salva no banco de dados
            const result = await pool.query(
                `INSERT INTO leituras (arquivo, erro, id_prova, id_participante, gabarito, acertos, nota)
                VALUES ($1, $2, $3, $4, $5, $6, $7)
                RETURNING *`,
                [
                    caminhoImagem,
                    leitura.erro,
                    leitura.id_prova === -1 ? null : leitura.id_prova,
                    participanteId,
                    leitura.leitura || '',
                    acertos,
                    nota
                ]
            );

            return {
                leitura: result.rows[0],
                participante_original: participanteOriginalInfo
            };
        }

        // Cenário 1: Usuário B faz leitura de prova do participante A
        console.log('\n Cenário 1: Usuário B lê prova do participante A');
        const mockLeituraA = {
            erro: 0,
            id_prova: provaId,
            id_participante: participanteAId, // Participante do usuário A
            leitura: 'abcdeabcdeabcdeabcde'
        };

        const resultadoB = await simularProcessarUmaLeitura('test_prova_A.png', userBId, mockLeituraA);
        console.log(` Leitura salva com ID: ${resultadoB.leitura.id}`);
        console.log(` Participante na leitura: ${resultadoB.leitura.id_participante}`);
        console.log(` Participante original: ${resultadoB.participante_original.nome} (ID: ${resultadoB.participante_original.id})`);

        // 5. Verificar resultados
        console.log('\n5. Verificando resultados...');
        
        // Verificar se a leitura foi salva corretamente
        const leituraVerificacao = await pool.query(`
            SELECT l.*, p.nome, p.escola, p.user_id 
            FROM leituras l 
            JOIN participantes p ON l.id_participante = p.id 
            WHERE l.id = $1
        `, [resultadoB.leitura.id]);

        const leitura = leituraVerificacao.rows[0];
        console.log(`   Leitura verificada:`);
        console.log(`   → ID da leitura: ${leitura.id}`);
        console.log(`   → Participante: ${leitura.nome} (${leitura.escola})`);
        console.log(`   → User ID do participante: ${leitura.user_id}`);
        console.log(`   → Esperado User ID: ${userBId}`);

        // Verificar se o participante foi criado/encontrado corretamente
        if (leitura.user_id === userBId) {
            console.log('SUCESSO: Leitura foi associada ao usuário correto!');
            
            if (leitura.nome === participanteA.rows[0].nome && leitura.escola === participanteA.rows[0].escola) {
                console.log('SUCESSO: Nome e escola do participante original foram preservados!');
            } else {
                console.log('ERRO: Nome ou escola não foram preservados corretamente');
            }
        } else {
            console.log('ERRO: Leitura não foi associada ao usuário correto');
        }

        // 6. Verificar se o usuário B pode ver a leitura em suas leituras
        console.log('\n6. Verificando visibilidade da leitura...');
        const leiturasUserB = await pool.query(`
            SELECT l.*, p.nome, p.escola 
            FROM leituras l 
            JOIN participantes p ON l.id_participante = p.id 
            WHERE p.user_id = $1
        `, [userBId]);

        console.log(`   Usuário B tem ${leiturasUserB.rows.length} leitura(s):`);
        leiturasUserB.rows.forEach(l => {
            console.log(`ID: ${l.id}, Participante: ${l.nome} (${l.escola}), Nota: ${l.nota}`);
        });

        // 7. Verificar se o usuário A ainda pode ver suas próprias leituras
        console.log('\n7. Verificando leituras do usuário A...');
        const leiturasUserA = await pool.query(`
            SELECT l.*, p.nome, p.escola 
            FROM leituras l 
            JOIN participantes p ON l.id_participante = p.id 
            WHERE p.user_id = $1
        `, [userAId]);

        console.log(`   Usuário A tem ${leiturasUserA.rows.length} leitura(s):`);
        leiturasUserA.rows.forEach(l => {
            console.log(`   → ID: ${l.id}, Participante: ${l.nome} (${l.escola}), Nota: ${l.nota}`);
        });

        console.log('\n=== TESTE CONCLUÍDO ===');

    } catch (error) {
        console.error('Erro durante o teste:', error);
    } finally {
        // Limpar dados de teste
        console.log('\nLimpando dados de teste...');
        await pool.query('DELETE FROM leituras WHERE arquivo LIKE \'%test%\'');
        await pool.query('DELETE FROM participantes WHERE nome LIKE \'%Teste%\'');
        await pool.query('DELETE FROM users WHERE username LIKE \'%test%\'');
        console.log('Dados de teste removidos.');
        
        await pool.end();
    }
}

// Executar o teste
testeLeituraCrossUser().catch(console.error);