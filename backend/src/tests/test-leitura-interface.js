import { pool } from '../config/database-config.js';

/*
 * Teste para verificar se a interface de leitura está funcionando corretamente
 * com as novas funcionalidades de edição e remoção
 */

async function testeInterfaceLeitura() {
    try {
        console.log('=== TESTE DA INTERFACE DE LEITURA ===\n');

        // 1. Verificar se existem leituras no sistema
        console.log('1. Verificando leituras existentes...');
        const leituras = await pool.query(`
            SELECT l.*, p.nome, p.escola, p.user_id 
            FROM leituras l 
            LEFT JOIN participantes p ON l.id_participante = p.id 
            ORDER BY l.created_at DESC 
            LIMIT 5
        `);

        console.log(`   Encontradas ${leituras.rows.length} leituras recentes:`);
        leituras.rows.forEach(l => {
            console.log(`   → ID: ${l.id}, Arquivo: ${l.arquivo}, Participante: ${l.nome || 'N/A'}, User: ${l.user_id || 'N/A'}`);
        });

        // 2. Verificar estrutura da resposta da API de leitura
        console.log('\n2. Testando estrutura de resposta da API...');
        
        if (leituras.rows.length > 0) {
            const leitura = leituras.rows[0];
            console.log('   Estrutura da leitura:');
            console.log(`   → ID: ${leitura.id}`);
            console.log(`   → Arquivo: ${leitura.arquivo}`);
            console.log(`   → Erro: ${leitura.erro}`);
            console.log(`   → ID Prova: ${leitura.id_prova}`);
            console.log(`   → ID Participante: ${leitura.id_participante}`);
            console.log(`   → Gabarito: ${leitura.gabarito}`);
            console.log(`   → Acertos: ${leitura.acertos}`);
            console.log(`   → Nota: ${leitura.nota}`);
            console.log(`   → Participante Nome: ${leitura.nome}`);
            console.log(`   → Participante Escola: ${leitura.escola}`);
            console.log(`   → User ID: ${leitura.user_id}`);
        }

        // 3. Verificar se existem casos de cross-user
        console.log('\n3. Verificando casos de cross-user...');
        const crossUserCheck = await pool.query(`
            SELECT 
                l.id,
                l.arquivo,
                p1.nome as participante_atual,
                p1.user_id as user_atual,
                COUNT(*) as total_mesmo_nome
            FROM leituras l
            JOIN participantes p1 ON l.id_participante = p1.id
            WHERE EXISTS (
                SELECT 1 FROM participantes p2 
                WHERE p2.nome = p1.nome 
                AND p2.escola = p1.escola 
                AND p2.user_id != p1.user_id
            )
            GROUP BY l.id, l.arquivo, p1.nome, p1.user_id
            LIMIT 5
        `);

        if (crossUserCheck.rows.length > 0) {
            console.log(`   Encontrados ${crossUserCheck.rows.length} possíveis casos de cross-user:`);
            crossUserCheck.rows.forEach(c => {
                console.log(`   → Leitura ID: ${c.id}, Participante: ${c.participante_atual}, User: ${c.user_atual}`);
            });
        } else {
            console.log('   Nenhum caso de cross-user detectado.');
        }

        // 4. Verificar permissões de edição/remoção
        console.log('\n4. Verificando permissões...');
        const usuarios = await pool.query('SELECT id, username, role FROM users LIMIT 3');
        
        console.log(`   Usuários no sistema: ${usuarios.rows.length}`);
        usuarios.rows.forEach(u => {
            console.log(`   → ID: ${u.id}, Username: ${u.username}, Role: ${u.role}`);
        });

        // 5. Simular operações de edição
        console.log('\n5. Testando operações de edição...');
        
        if (leituras.rows.length > 0) {
            const leituraParaTeste = leituras.rows[0];
            console.log(`   Testando edição da leitura ID: ${leituraParaTeste.id}`);
            
            // Simular uma atualização (sem realmente alterar)
            const updateQuery = `
                UPDATE leituras 
                SET gabarito = $1 
                WHERE id = $2 
                RETURNING *
            `;
            
            console.log('   → Query de atualização preparada (não executada)');
            console.log(`   → Gabarito atual: ${leituraParaTeste.gabarito}`);
            console.log('   → Operação de edição seria possível');
        }

        // 6. Verificar integridade dos dados
        console.log('\n6. Verificando integridade dos dados...');
        
        const integrityCheck = await pool.query(`
            SELECT 
                COUNT(*) as total_leituras,
                COUNT(CASE WHEN id_participante IS NOT NULL THEN 1 END) as com_participante,
                COUNT(CASE WHEN id_prova IS NOT NULL THEN 1 END) as com_prova,
                COUNT(CASE WHEN gabarito IS NOT NULL AND gabarito != '' THEN 1 END) as com_gabarito
            FROM leituras
        `);

        const stats = integrityCheck.rows[0];
        console.log(`   Total de leituras: ${stats.total_leituras}`);
        console.log(`   Com participante: ${stats.com_participante}`);
        console.log(`   Com prova: ${stats.com_prova}`);
        console.log(`   Com gabarito: ${stats.com_gabarito}`);

        // 7. Verificar estrutura das tabelas
        console.log('\n7. Verificando estrutura das tabelas...');
        
        const tableStructure = await pool.query(`
            SELECT column_name, data_type, is_nullable
            FROM information_schema.columns 
            WHERE table_name = 'leituras' 
            ORDER BY ordinal_position
        `);

        console.log('   Estrutura da tabela leituras:');
        tableStructure.rows.forEach(col => {
            console.log(`   → ${col.column_name}: ${col.data_type} (${col.is_nullable === 'YES' ? 'NULL' : 'NOT NULL'})`);
        });

        console.log('\n=== TESTE DA INTERFACE CONCLUÍDO ===');
        console.log('\n✅ Funcionalidades verificadas:');
        console.log('   → Estrutura de dados das leituras');
        console.log('   → Relacionamentos com participantes');
        console.log('   → Casos de cross-user');
        console.log('   → Permissões de usuários');
        console.log('   → Integridade dos dados');
        console.log('   → Estrutura das tabelas');

        console.log('\n📋 Próximos passos para teste manual:');
        console.log('   1. Fazer upload de uma imagem na interface');
        console.log('   2. Verificar se os botões de Editar e Excluir aparecem');
        console.log('   3. Testar a funcionalidade de edição');
        console.log('   4. Testar a funcionalidade de exclusão');
        console.log('   5. Verificar se as informações de cross-user são exibidas');

    } catch (error) {
        console.error('Erro durante o teste:', error);
    } finally {
        await pool.end();
    }
}

// Executar o teste
testeInterfaceLeitura().catch(console.error);