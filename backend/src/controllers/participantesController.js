import { pool } from '../config/database-config.js';

// Importar participantes via dados CSV enviados no body da requisição
export const importarParticipantesCSV = async (req, res) => {
    try {
        const { csvData } = req.body;
        
        if (!csvData) {
            return res.status(400).json({ error: 'Dados CSV são obrigatórios' });
        }

        // Processa as linhas do CSV
        const linhas = csvData.split('\n').map(linha => linha.trim()).filter(linha => linha);
        
        if (linhas.length === 0) {
            return res.status(400).json({ error: 'CSV está vazio' });
        }

        // Remove cabeçalho se existir
        const primeiraLinha = linhas[0].toLowerCase();
        if (primeiraLinha.includes('id') && primeiraLinha.includes('nome') && primeiraLinha.includes('escola')) {
            linhas.shift();
        }

        let importados = 0;
        let atualizados = 0;
        const erros = [];

        for (const linha of linhas) {
            if (!linha) continue;
            
            const [id, nome, escola] = linha.split(',').map(item => item.trim());
            
            if (!id || !nome || !escola) {
                erros.push(`Linha inválida: ${linha}`);
                continue;
            }

            const idParticipante = parseInt(id);
            if (isNaN(idParticipante)) {
                erros.push(`ID de participante inválido: ${id}`);
                continue;
            }

            try {
                // Verifica se o participante já existe
                const { rows: existingParticipante } = await pool.query(
                    'SELECT id FROM participantes WHERE id = $1',
                    [idParticipante]
                );

                if (existingParticipante.length > 0) {
                    // Atualiza participante existente
                    await pool.query(
                        'UPDATE participantes SET nome = $1, escola = $2 WHERE id = $3',
                        [nome, escola, idParticipante]
                    );
                    atualizados++;
                } else {
                    // Insere novo participante
                    await pool.query(
                        'INSERT INTO participantes (id, nome, escola) VALUES ($1, $2, $3)',
                        [idParticipante, nome, escola]
                    );
                    importados++;
                }
            } catch (dbError) {
                erros.push(`Erro ao processar participante ${idParticipante}: ${dbError.message}`);
            }
        }

        // Atualiza a sequence
        await pool.query(`SELECT setval('participantes_id_seq', (SELECT COALESCE(MAX(id), 1) FROM participantes))`);

        res.json({
            success: true,
            message: 'Importação concluída',
            resultado: {
                importados,
                atualizados,
                total: importados + atualizados,
                erros: erros.length > 0 ? erros : undefined
            }
        });

    } catch (error) {
        console.error('Erro na importação de participantes:', error);
        res.status(500).json({ error: 'Erro interno na importação' });
    }
};

// Listar participantes (filtrados baseado no role do usuário)
export const listarParticipantes = async (req, res) => {
    try {
        const { escola, page = 1, limit = 50, meus = false } = req.query;
        const userId = req.user.id;
        const userRole = req.user.role;
        const userEscola = req.user.escola;

        // ABORDAGEM ESPECÍFICA PARA ADMIN - usando JOIN para filtrar na própria SQL
        if (userRole === 'admin' && meus !== 'true') {
            return await listarParticipantesAdmin(req, res, { escola, page, limit });
        }

        // ABORDAGEM PARA TEACHER E USER - lógica original que funciona
        let query = 'SELECT id, nome, escola, user_id, created_at FROM participantes';
        let params = [];
        let whereConditions = [];

        // Parâmetro 'meus' força filtro por usuário independente do role
        if (meus === 'true') {
            whereConditions.push(`user_id = $1`);
            params.push(userId);
        } else {
            // Aplicar filtros baseados no role do usuário
            if (userRole === 'teacher') {
                // Teacher vê apenas participantes da mesma escola
                if (userEscola) {
                    whereConditions.push(`escola = $1`);
                    params.push(userEscola);
                } else {
                    // Se teacher não tem escola definida, não vê nada
                    whereConditions.push('1 = 0');
                }
            } else {
                // User comum vê apenas seus próprios participantes
                whereConditions.push(`user_id = $1`);
                params.push(userId);
            }
        }

        // Filtro adicional por escola se fornecido (disponível para teacher)
        if (escola && userRole === 'teacher' && meus !== 'true') {
            whereConditions.push(`escola ILIKE $${params.length + 1}`);
            params.push(`%${escola}%`);
        }

        // Monta WHERE clause
        const whereClause = whereConditions.length > 0 ? ' WHERE ' + whereConditions.join(' AND ') : '';

        // Paginação
        const offset = (page - 1) * limit;
        const orderClause = ' ORDER BY nome';
        const limitClause = ` LIMIT $${params.length + 1} OFFSET $${params.length + 2}`;
        params.push(limit, offset);

        const finalQuery = query + whereClause + orderClause + limitClause;
        const { rows } = await pool.query(finalQuery, params);

        // Filtrar usuários do sistema no resultado (apenas para teacher)
        let participantesFiltrados = rows;
        if (userRole === 'teacher') {
            // Buscar IDs de usuários que são admin ou teacher
            const { rows: usuariosDoSistema } = await pool.query(
                'SELECT id FROM users WHERE role IN ($1, $2)',
                ['admin', 'teacher']
            );
            const idsUsuariosDoSistema = usuariosDoSistema.map(u => u.id);
            
            // Filtrar participantes que não são usuários do sistema
            participantesFiltrados = rows.filter(participante => 
                !participante.user_id || !idsUsuariosDoSistema.includes(participante.user_id)
            );
        }

        // Conta total para paginação (também filtrada)
        const countQuery = 'SELECT COUNT(*) FROM participantes' + whereClause;
        const countParams = params.slice(0, -2); // Remove limit e offset
        const { rows: countRows } = await pool.query(countQuery, countParams);
        let total = parseInt(countRows[0].count);

        // Ajustar total removendo usuários do sistema se necessário (apenas para teacher)
        if (userRole === 'teacher') {
            const { rows: usuariosDoSistema } = await pool.query(
                'SELECT id FROM users WHERE role IN ($1, $2)',
                ['admin', 'teacher']
            );
            const idsUsuariosDoSistema = usuariosDoSistema.map(u => u.id);
            
            // Contar quantos participantes são usuários do sistema na query atual
            if (idsUsuariosDoSistema.length > 0) {
                const placeholders = idsUsuariosDoSistema.map((_, i) => `$${countParams.length + i + 1}`).join(',');
                const countQueryCompleta = `
                    SELECT COUNT(*) FROM participantes 
                    ${whereClause} 
                    AND user_id IS NOT NULL 
                    AND user_id IN (${placeholders})
                `;
                const countParamsCompleta = [...countParams, ...idsUsuariosDoSistema];
                
                const { rows: countUsuariosSistema } = await pool.query(countQueryCompleta, countParamsCompleta);
                total = total - parseInt(countUsuariosSistema[0].count);
            }
        }

        res.json({
            success: true,
            data: {
                participantes: participantesFiltrados,
                pagination: {
                    page: parseInt(page),
                    limit: parseInt(limit),
                    total,
                    pages: Math.ceil(total / limit)
                }
            }
        });
    } catch (error) {
        console.error('Erro ao listar participantes:', error);
        res.status(500).json({ error: 'Erro interno ao listar participantes' });
    }
};

// Função específica para ADMIN - usa JOIN para filtrar usuários do sistema na própria SQL
const listarParticipantesAdmin = async (req, res, { escola, page, limit }) => {
    try {
        let baseQuery = `
            SELECT p.id, p.nome, p.escola, p.user_id, p.created_at 
            FROM participantes p
            LEFT JOIN users u ON p.user_id = u.id
        `;
        
        let whereConditions = [];
        let params = [];

        // Filtrar usuários do sistema diretamente na SQL
        whereConditions.push(`(p.user_id IS NULL OR u.role NOT IN ('admin', 'teacher'))`);

        // Filtro por escola se fornecido
        if (escola) {
            whereConditions.push(`p.escola ILIKE $${params.length + 1}`);
            params.push(`%${escola}%`);
        }

        // Monta WHERE clause
        const whereClause = whereConditions.length > 0 ? ' WHERE ' + whereConditions.join(' AND ') : '';

        // Query principal com paginação
        const offset = (page - 1) * limit;
        const orderClause = ' ORDER BY p.nome';
        const limitClause = ` LIMIT $${params.length + 1} OFFSET $${params.length + 2}`;
        params.push(limit, offset);

        const finalQuery = baseQuery + whereClause + orderClause + limitClause;
        const { rows } = await pool.query(finalQuery, params);

        // Query para contar total (sem paginação)
        const countQuery = `
            SELECT COUNT(*) as count
            FROM participantes p
            LEFT JOIN users u ON p.user_id = u.id
            ${whereClause}
        `;
        const countParams = params.slice(0, -2); // Remove limit e offset
        const { rows: countRows } = await pool.query(countQuery, countParams);
        const total = parseInt(countRows[0].count);

        res.json({
            success: true,
            data: {
                participantes: rows,
                pagination: {
                    page: parseInt(page),
                    limit: parseInt(limit),
                    total,
                    pages: Math.ceil(total / limit)
                }
            }
        });
    } catch (error) {
        console.error('Erro ao listar participantes (admin):', error);
        res.status(500).json({ error: 'Erro interno ao listar participantes' });
    }
};

// Obter um participante específico
export const obterParticipante = async (req, res) => {
    try {
        const { id } = req.params;
        const userId = req.user.id;
        const userRole = req.user.role;
        const userEscola = req.user.escola;
        
        if (isNaN(id)) {
            return res.status(400).json({ error: 'ID do participante deve ser um número' });
        }

        let query = 'SELECT id, nome, escola, user_id, created_at FROM participantes WHERE id = $1';
        let params = [id];

        // Aplicar filtros baseados no role
        if (userRole === 'admin') {
            // Admin pode ver qualquer participante - sem filtros adicionais
        } else if (userRole === 'teacher') {
            // Teacher só pode ver participantes da mesma escola
            if (userEscola) {
                query += ' AND escola = $2';
                params.push(userEscola);
            } else {
                // Se teacher não tem escola, não pode ver nada
                query += ' AND 1 = 0';
            }
        } else {
            // User só pode ver seus próprios participantes
            query += ' AND user_id = $2';
            params.push(userId);
        }

        const { rows } = await pool.query(query, params);
        
        if (rows.length === 0) {
            return res.status(404).json({ error: 'Participante não encontrado' });
        }

        res.json({
            success: true,
            data: {
                participante: rows[0]
            }
        });
    } catch (error) {
        console.error('Erro ao obter participante:', error);
        res.status(500).json({ error: 'Erro interno ao obter participante' });
    }
};

// Criar um participante individual
export const criarParticipante = async (req, res) => {
    try {
        const { nome, escola } = req.body;
        const userId = req.user.id;
        const userEscola = req.user.escola;
        
        if (!nome) {
            return res.status(400).json({ error: 'Nome é obrigatório' });
        }

        // Usa a escola do usuário se não for fornecida, ou a fornecida se especificada
        const escolaFinal = escola || userEscola;
        
        if (!escolaFinal) {
            return res.status(400).json({ 
                error: 'Escola é obrigatória. Forneça uma escola ou configure sua escola no perfil.' 
            });
        }

        const { rows } = await pool.query(
            'INSERT INTO participantes (nome, escola, user_id) VALUES ($1, $2, $3) RETURNING *',
            [nome.trim(), escolaFinal.trim(), userId]
        );

        res.status(201).json({
            success: true,
            message: 'Participante criado com sucesso',
            data: {
                participante: rows[0]
            }
        });
    } catch (error) {
        console.error('Erro ao criar participante:', error);
        res.status(500).json({ error: 'Erro interno ao criar participante' });
    }
};

// Atualizar um participante
export const atualizarParticipante = async (req, res) => {
    try {
        const { id } = req.params;
        const { nome, escola } = req.body;
        const userId = req.user.id;
        const userRole = req.user.role;
        const userEscola = req.user.escola;
        
        if (isNaN(id)) {
            return res.status(400).json({ error: 'ID do participante deve ser um número' });
        }

        if (!nome && !escola) {
            return res.status(400).json({ error: 'Pelo menos um campo deve ser fornecido para atualização' });
        }

        // Verifica se o participante existe e se o usuário tem permissão
        let checkQuery = 'SELECT id, user_id, escola FROM participantes WHERE id = $1';
        let checkParams = [id];

        // Aplicar filtros baseados no role
        if (userRole === 'admin') {
            // Admin pode atualizar qualquer participante - sem filtros adicionais
        } else if (userRole === 'teacher') {
            // Teacher só pode atualizar participantes da mesma escola
            if (userEscola) {
                checkQuery += ' AND escola = $2';
                checkParams.push(userEscola);
            } else {
                // Se teacher não tem escola, não pode atualizar nada
                checkQuery += ' AND 1 = 0';
            }
        } else {
            // User só pode atualizar seus próprios participantes
            checkQuery += ' AND user_id = $2';
            checkParams.push(userId);
        }

        const { rows: checkRows } = await pool.query(checkQuery, checkParams);
        
        if (checkRows.length === 0) {
            return res.status(404).json({ error: 'Participante não encontrado ou sem permissão' });
        }

        // Monta a query dinamicamente
        const campos = [];
        const valores = [];
        let contador = 1;

        if (nome) {
            campos.push(`nome = $${contador++}`);
            valores.push(nome.trim());
        }

        if (escola) {
            campos.push(`escola = $${contador++}`);
            valores.push(escola.trim());
        }

        valores.push(id);

        const { rows } = await pool.query(
            `UPDATE participantes SET ${campos.join(', ')} WHERE id = $${contador} RETURNING *`,
            valores
        );

        res.json({
            success: true,
            message: 'Participante atualizado com sucesso',
            data: {
                participante: rows[0]
            }
        });
    } catch (error) {
        console.error('Erro ao atualizar participante:', error);
        res.status(500).json({ error: 'Erro interno ao atualizar participante' });
    }
};

// Associar participante ao usuário logado
export const associarParticipante = async (req, res) => {
    try {
        const { id } = req.params;
        const userId = req.user.id;
        
        if (isNaN(id)) {
            return res.status(400).json({ error: 'ID do participante deve ser um número' });
        }

        // Verifica se o participante existe
        const { rows: checkRows } = await pool.query(
            'SELECT id, user_id FROM participantes WHERE id = $1',
            [id]
        );
        
        if (checkRows.length === 0) {
            return res.status(404).json({ error: 'Participante não encontrado' });
        }

        if (checkRows[0].user_id) {
            return res.status(400).json({ error: 'Participante já está associado a um usuário' });
        }

        // Associa o participante ao usuário
        const { rows } = await pool.query(
            'UPDATE participantes SET user_id = $1 WHERE id = $2 RETURNING *',
            [userId, id]
        );

        res.json({
            success: true,
            message: 'Participante associado com sucesso',
            data: {
                participante: rows[0]
            }
        });
    } catch (error) {
        console.error('Erro ao associar participante:', error);
        res.status(500).json({ error: 'Erro interno ao associar participante' });
    }
};

// Deletar um participante
export const deletarParticipante = async (req, res) => {
    try {
        const { id } = req.params;
        const userId = req.user.id;
        const userRole = req.user.role;
        const userEscola = req.user.escola;
        
        if (isNaN(id)) {
            return res.status(400).json({ error: 'ID do participante deve ser um número' });
        }

        // Verifica permissão antes de deletar
        let deleteQuery = 'DELETE FROM participantes WHERE id = $1';
        let deleteParams = [id];

        // Aplicar filtros baseados no role
        if (userRole === 'admin') {
            // Admin pode deletar qualquer participante - sem filtros adicionais
        } else if (userRole === 'teacher') {
            // Teacher só pode deletar participantes da mesma escola
            if (userEscola) {
                deleteQuery += ' AND escola = $2';
                deleteParams.push(userEscola);
            } else {
                // Se teacher não tem escola, não pode deletar nada
                deleteQuery += ' AND 1 = 0';
            }
        } else {
            // User só pode deletar seus próprios participantes
            deleteQuery += ' AND user_id = $2';
            deleteParams.push(userId);
        }

        deleteQuery += ' RETURNING *';

        const { rows } = await pool.query(deleteQuery, deleteParams);

        if (rows.length === 0) {
            return res.status(404).json({ error: 'Participante não encontrado ou sem permissão' });
        }

        res.json({
            success: true,
            message: 'Participante deletado com sucesso',
            data: {
                participante: rows[0]
            }
        });
    } catch (error) {
        console.error('Erro ao deletar participante:', error);
        res.status(500).json({ error: 'Erro interno ao deletar participante' });
    }
};

// Listar escolas únicas
export const listarEscolas = async (req, res) => {
    try {
        const { rows } = await pool.query(
            'SELECT DISTINCT escola FROM participantes WHERE escola IS NOT NULL AND escola != \'\' ORDER BY escola'
        );
        
        res.json({
            success: true,
            data: {
                escolas: rows.map(row => row.escola)
            }
        });
    } catch (error) {
        console.error('Erro ao listar escolas:', error);
        res.status(500).json({ error: 'Erro interno ao listar escolas' });
    }
};

// Obter perfil do participante do usuário logado
export const meuPerfil = async (req, res) => {
    try {
        const userId = req.user.id;
        
        const { rows } = await pool.query(
            'SELECT id, nome, escola, created_at FROM participantes WHERE user_id = $1',
            [userId]
        );
        
        if (rows.length === 0) {
            return res.status(404).json({ 
                success: false,
                error: 'Você ainda não tem um perfil de participante associado' 
            });
        }

        res.json({
            success: true,
            data: {
                participante: rows[0]
            }
        });
    } catch (error) {
        console.error('Erro ao obter perfil do participante:', error);
        res.status(500).json({ error: 'Erro interno ao obter perfil' });
    }
};

// Obter estatísticas do participante do usuário logado
export const minhasEstatisticas = async (req, res) => {
    try {
        const userId = req.user.id;
        const { id_prova } = req.query;
        
        // Primeiro, obter o participante do usuário
        const { rows: participanteRows } = await pool.query(
            'SELECT id, nome FROM participantes WHERE user_id = $1',
            [userId]
        );
        
        if (participanteRows.length === 0) {
            return res.status(404).json({ 
                success: false,
                error: 'Você ainda não tem um perfil de participante associado' 
            });
        }

        const participanteId = participanteRows[0].id;
        const participanteNome = participanteRows[0].nome;

        // Estatísticas gerais
        const { rows: estatisticasGerais } = await pool.query(`
            SELECT 
                COUNT(DISTINCT id_prova) as provas_realizadas,
                COUNT(*) as total_leituras,
                AVG(nota) as media_notas,
                SUM(acertos) as total_acertos
            FROM leituras 
            WHERE id_participante = $1
        `, [participanteId]);

        // Se uma prova específica foi solicitada
        let estatisticasProva = null;
        let mediaGeral = null;
        let totalQuestoes = null;

        if (id_prova) {
            // Estatísticas da prova específica - pegar a melhor leitura (menor erro)
            const { rows: provaStats } = await pool.query(`
                SELECT 
                    l.acertos,
                    l.nota,
                    l.erro,
                    p.gabarito
                FROM leituras l
                JOIN provas p ON l.id_prova = p.id
                WHERE l.id_participante = $1 AND l.id_prova = $2
                ORDER BY l.erro ASC, l.created_at DESC
                LIMIT 1
            `, [participanteId, id_prova]);

            if (provaStats.length > 0) {
                const gabarito = provaStats[0].gabarito;
                totalQuestoes = gabarito ? gabarito.length : 20;
                
                estatisticasProva = {
                    acertos: provaStats[0].acertos,
                    nota: parseFloat(provaStats[0].nota),
                    total_questoes: totalQuestoes,
                    percentual: (provaStats[0].acertos / totalQuestoes) * 100
                };

                // Média geral da prova (todos os participantes) - considerar melhor leitura de cada participante
                const { rows: mediaGeralRows } = await pool.query(`
                    SELECT AVG(melhor_leitura.acertos) as media_acertos
                    FROM (
                        SELECT DISTINCT ON (id_participante) 
                            id_participante, 
                            acertos
                        FROM leituras 
                        WHERE id_prova = $1
                        ORDER BY id_participante, erro ASC, created_at DESC
                    ) melhor_leitura
                `, [id_prova]);

                if (mediaGeralRows.length > 0) {
                    mediaGeral = {
                        media_acertos: parseFloat(mediaGeralRows[0].media_acertos),
                        percentual_medio: (parseFloat(mediaGeralRows[0].media_acertos) / totalQuestoes) * 100
                    };
                }
            }
        }

        res.json({
            success: true,
            data: {
                participante: {
                    id: participanteId,
                    nome: participanteNome
                },
                estatisticas_gerais: {
                    provas_realizadas: parseInt(estatisticasGerais[0].provas_realizadas) || 0,
                    total_leituras: parseInt(estatisticasGerais[0].total_leituras) || 0,
                    media_notas: parseFloat(estatisticasGerais[0].media_notas) || 0,
                    total_acertos: parseInt(estatisticasGerais[0].total_acertos) || 0
                },
                estatisticas_prova: estatisticasProva,
                media_geral: mediaGeral,
                total_questoes: totalQuestoes
            }
        });
    } catch (error) {
        console.error('Erro ao obter estatísticas:', error);
        res.status(500).json({ error: 'Erro interno ao obter estatísticas' });
    }
};