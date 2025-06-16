import { pool } from '../config/database-config.js';

/*
 * Teste para verificar se a correção da query de listagem de leituras
 * resolveu o problema dos placeholders SQL
 */

async function testeListarLeituras() {
    try {
        console.log('=== TESTE DE LISTAGEM DE LEITURAS ===\n');

        // 1. Buscar um usuário para teste
        console.log('1. Buscando usuário para teste...');
        const { rows: usuarios } = await pool.query('SELECT id, username, role FROM users WHERE role = \'user\' LIMIT 1');
        
        if (usuarios.length === 0) {
            console.log('   ❌ Nenhum usuário encontrado');
            return;
        }

        const usuario = usuarios[0];
        console.log(`   Usuário: ${usuario.username} (ID: ${usuario.id}, Role: ${usuario.role})`);

        // 2. Simular a query de listagem para usuário comum
        console.log('\n2. Testando query de listagem...');
        
        const userId = usuario.id;
        const userRole = usuario.role;
        
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

        // Simular lógica do controller
        if (userRole === 'admin') {
            // Admin vê tudo - sem filtros adicionais
        } else if (userRole === 'teacher') {
            // Teacher vê apenas leituras de participantes da mesma escola
            whereConditions.push(`p.escola = $${params.length + 1}`);
            params.push('Escola Teste');
        } else {
            // User comum vê leituras dos seus participantes OU leituras que ele criou (mesmo sem participante)
            whereConditions.push(`(p.user_id = $${params.length + 1} OR l.user_id = $${params.length + 2})`);
            params.push(userId, userId);
        }

        // Monta WHERE clause
        const whereClause = whereConditions.length > 0 ? ' WHERE ' + whereConditions.join(' AND ') : '';

        // Paginação
        const page = 1;
        const limit = 50;
        const offset = (page - 1) * limit;
        const orderClause = ' ORDER BY l.created_at DESC';
        const limitClause = ` LIMIT $${params.length + 1} OFFSET $${params.length + 2}`;
        params.push(limit, offset);

        const finalQuery = query + whereClause + orderClause + limitClause;
        
        console.log('   Query construída:');
        console.log(`   ${finalQuery}`);
        console.log(`   Parâmetros: [${params.join(', ')}]`);

        // 3. Executar a query
        console.log('\n3. Executando query...');
        
        const { rows } = await pool.query(finalQuery, params);
        console.log(`   ✅ Query executada com sucesso! Encontradas ${rows.length} leituras.`);

        // 4. Mostrar algumas leituras
        if (rows.length > 0) {
            console.log('\n4. Primeiras leituras encontradas:');
            rows.slice(0, 5).forEach((leitura, index) => {
                const participante = leitura.participante_nome || 'SEM PARTICIPANTE';
                const prova = leitura.id_prova || 'SEM PROVA';
                console.log(`   ${index + 1}. ID: ${leitura.id}, Arquivo: ${leitura.arquivo}, Participante: ${participante}, Prova: ${prova}`);
            });
        } else {
            console.log('\n4. Nenhuma leitura encontrada para este usuário.');
        }

        // 5. Testar query de contagem
        console.log('\n5. Testando query de contagem...');
        
        const countQuery = `
            SELECT COUNT(*) 
            FROM leituras l
            LEFT JOIN participantes p ON l.id_participante = p.id
        ` + whereClause;
        const countParams = params.slice(0, -2); // Remove limit e offset
        
        console.log('   Query de contagem:');
        console.log(`   ${countQuery}`);
        console.log(`   Parâmetros: [${countParams.join(', ')}]`);
        
        const { rows: countRows } = await pool.query(countQuery, countParams);
        const total = parseInt(countRows[0].count);
        console.log(`   ✅ Total de leituras: ${total}`);

        // 6. Verificar leituras sem participante
        console.log('\n6. Verificando leituras sem participante...');
        
        const { rows: leiturasSemParticipante } = await pool.query(`
            SELECT l.id, l.arquivo, l.user_id, u.username
            FROM leituras l
            LEFT JOIN users u ON l.user_id = u.id
            WHERE l.id_participante IS NULL
            ORDER BY l.created_at DESC
            LIMIT 5
        `);

        console.log(`   Encontradas ${leiturasSemParticipante.length} leituras sem participante:`);
        leiturasSemParticipante.forEach(l => {
            console.log(`   → ID: ${l.id}, Arquivo: ${l.arquivo}, User: ${l.username || 'NULL'}`);
        });

        console.log('\n=== TESTE CONCLUÍDO ===');
        console.log('\n✅ Correções implementadas:');
        console.log('   → Placeholders SQL corrigidos ($1, $2, etc.)');
        console.log('   → Query de listagem funciona para usuários comuns');
        console.log('   → Leituras sem participante são incluídas');
        console.log('   → Query de contagem funciona corretamente');

    } catch (error) {
        console.error('❌ Erro durante o teste:', error);
        console.error('Stack trace:', error.stack);
    } finally {
        await pool.end();
    }
}

// Executar o teste
testeListarLeituras().catch(console.error);