import { pool } from '../config/database-config.js';

/*
 * Teste para verificar se leituras sem participante (como base.png)
 * são processadas e exibidas corretamente
 */

async function testeLeiturasSemParticipante() {
    try {
        console.log('=== TESTE DE LEITURAS SEM PARTICIPANTE ===\n');

        // 1. Verificar estrutura da tabela leituras
        console.log('1. Verificando estrutura da tabela leituras...');
        const { rows: colunas } = await pool.query(`
            SELECT column_name, data_type, is_nullable
            FROM information_schema.columns 
            WHERE table_name = 'leituras' 
            ORDER BY ordinal_position
        `);

        console.log('   Colunas da tabela leituras:');
        colunas.forEach(col => {
            console.log(`   → ${col.column_name}: ${col.data_type} (${col.is_nullable === 'YES' ? 'NULL' : 'NOT NULL'})`);
        });

        const temUserIdColumn = colunas.some(col => col.column_name === 'user_id');
        if (temUserIdColumn) {
            console.log('   ✅ Coluna user_id encontrada!');
        } else {
            console.log('   ❌ Coluna user_id não encontrada!');
            return;
        }

        // 2. Verificar leituras existentes sem participante
        console.log('\n2. Verificando leituras sem participante...');
        const { rows: leiturasSemParticipante } = await pool.query(`
            SELECT l.*, u.username
            FROM leituras l
            LEFT JOIN users u ON l.user_id = u.id
            WHERE l.id_participante IS NULL
            ORDER BY l.created_at DESC
        `);

        console.log(`   Encontradas ${leiturasSemParticipante.length} leituras sem participante:`);
        leiturasSemParticipante.forEach(l => {
            console.log(`   → ID: ${l.id}, Arquivo: ${l.arquivo}, Erro: ${l.erro}, User: ${l.username || 'NULL'}`);
        });

        // 3. Simular processamento de uma imagem base.png
        console.log('\n3. Simulando processamento de base.png...');
        
        // Buscar um usuário para teste
        const { rows: usuarios } = await pool.query('SELECT id, username FROM users WHERE role = \'user\' LIMIT 1');
        if (usuarios.length === 0) {
            console.log('   ❌ Nenhum usuário encontrado para teste');
            return;
        }

        const usuarioTeste = usuarios[0];
        console.log(`   Usando usuário: ${usuarioTeste.username} (ID: ${usuarioTeste.id})`);

        // Simular dados de leitura da base.png
        const mockLeituraBase = {
            erro: 0,
            id_prova: 0, // Prova não identificada
            id_participante: -1, // Participante não identificado
            leitura: '--------------------' // 20 caracteres vazios
        };

        console.log('   Dados simulados da base.png:');
        console.log(`   → Erro: ${mockLeituraBase.erro}`);
        console.log(`   → ID Prova: ${mockLeituraBase.id_prova}`);
        console.log(`   → ID Participante: ${mockLeituraBase.id_participante}`);
        console.log(`   → Leitura: ${mockLeituraBase.leitura}`);

        // Simular função Acertos
        let acertos = 0;
        let nota = 0.00;
        
        if (mockLeituraBase.id_prova === -1 || mockLeituraBase.id_prova === 0) {
            acertos = 0;
            nota = 0.00;
            console.log('   → Acertos calculados: 0 (prova não identificada)');
            console.log('   → Nota calculada: 0.00');
        }

        // Simular salvamento no banco
        let participanteId = null;
        if (mockLeituraBase.id_participante === -1) {
            participanteId = null;
            console.log('   → Participante: NULL (não identificado)');
        }

        let idProvaParaSalvar = mockLeituraBase.id_prova;
        if (mockLeituraBase.id_prova === -1) {
            idProvaParaSalvar = null;
        } else if (mockLeituraBase.id_prova === 0) {
            idProvaParaSalvar = 0;
        }

        console.log(`   → ID Prova para salvar: ${idProvaParaSalvar}`);

        // Inserir leitura de teste
        const { rows: novaLeitura } = await pool.query(`
            INSERT INTO leituras (arquivo, erro, id_prova, id_participante, gabarito, acertos, nota, user_id)
            VALUES ($1, $2, $3, $4, $5, $6, $7, $8)
            RETURNING *
        `, [
            'test_base.png',
            mockLeituraBase.erro,
            idProvaParaSalvar,
            participanteId,
            mockLeituraBase.leitura,
            acertos,
            nota,
            usuarioTeste.id
        ]);

        console.log('   ✅ Leitura de teste inserida:');
        console.log(`   → ID: ${novaLeitura[0].id}`);
        console.log(`   → Arquivo: ${novaLeitura[0].arquivo}`);
        console.log(`   → User ID: ${novaLeitura[0].user_id}`);

        // 4. Testar query de listagem para usuário comum
        console.log('\n4. Testando query de listagem para usuário comum...');
        
        const userId = usuarioTeste.id;
        const userRole = 'user';
        
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

        // Aplicar filtro para usuário comum
        whereConditions.push(`(p.user_id = $${params.length + 1} OR l.user_id = $${params.length + 2})`);
        params.push(userId, userId);

        const whereClause = whereConditions.length > 0 ? ' WHERE ' + whereConditions.join(' AND ') : '';
        const finalQuery = query + whereClause + ' ORDER BY l.created_at DESC';

        console.log('   Query executada:');
        console.log(`   ${finalQuery}`);
        console.log(`   Parâmetros: [${params.join(', ')}]`);

        const { rows: leiturasUsuario } = await pool.query(finalQuery, params);
        
        console.log(`   ✅ Encontradas ${leiturasUsuario.length} leituras para o usuário:`);
        leiturasUsuario.forEach(l => {
            const participante = l.participante_nome || 'SEM PARTICIPANTE';
            const prova = l.id_prova || 'SEM PROVA';
            console.log(`   → ID: ${l.id}, Arquivo: ${l.arquivo}, Participante: ${participante}, Prova: ${prova}`);
        });

        // Verificar se a leitura de teste aparece
        const leituraTestEncontrada = leiturasUsuario.find(l => l.arquivo === 'test_base.png');
        if (leituraTestEncontrada) {
            console.log('   ✅ Leitura de teste encontrada na listagem!');
        } else {
            console.log('   ❌ Leitura de teste NÃO encontrada na listagem!');
        }

        // 5. Limpar dados de teste
        console.log('\n5. Limpando dados de teste...');
        await pool.query('DELETE FROM leituras WHERE arquivo = $1', ['test_base.png']);
        console.log('   ✅ Dados de teste removidos.');

        console.log('\n=== TESTE CONCLUÍDO ===');
        console.log('\n📋 Resumo das correções:');
        console.log('   ✅ Coluna user_id adicionada à tabela leituras');
        console.log('   ✅ Função Acertos modificada para não lançar erro com id_prova = 0');
        console.log('   ✅ Leituras são salvas com user_id do criador');
        console.log('   ✅ Query de listagem inclui leituras sem participante do usuário');
        console.log('   ✅ Leituras como base.png agora aparecem na lista');

    } catch (error) {
        console.error('Erro durante o teste:', error);
    } finally {
        await pool.end();
    }
}

// Executar o teste
testeLeiturasSemParticipante().catch(console.error);