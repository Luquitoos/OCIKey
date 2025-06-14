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

// Listar participantes (filtrados por usuário se não for admin)
export const listarParticipantes = async (req, res) => {
    try {
        const { escola, page = 1, limit = 50, meus = false } = req.query;
        const userId = req.user.id;
        const userRole = req.user.role;
        
        let query = 'SELECT id, nome, escola, user_id, created_at FROM participantes';
        let params = [];
        let whereConditions = [];

        // Se não for admin e meus=true, filtra apenas participantes do usuário
        if (meus === 'true' || (userRole !== 'admin' && userRole !== 'teacher')) {
            whereConditions.push(`user_id = $${params.length + 1}`);
            params.push(userId);
        }

        // Filtro por escola se fornecido
        if (escola) {
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

        // Conta total para paginação
        const countQuery = 'SELECT COUNT(*) FROM participantes' + whereClause;
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
        console.error('Erro ao listar participantes:', error);
        res.status(500).json({ error: 'Erro interno ao listar participantes' });
    }
};

// Obter um participante específico
export const obterParticipante = async (req, res) => {
    try {
        const { id } = req.params;
        const userId = req.user.id;
        const userRole = req.user.role;
        
        if (isNaN(id)) {
            return res.status(400).json({ error: 'ID do participante deve ser um número' });
        }

        let query = 'SELECT id, nome, escola, user_id, created_at FROM participantes WHERE id = $1';
        let params = [id];

        // Se não for admin/teacher, só pode ver seus próprios participantes
        if (userRole !== 'admin' && userRole !== 'teacher') {
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
        
        if (isNaN(id)) {
            return res.status(400).json({ error: 'ID do participante deve ser um número' });
        }

        if (!nome && !escola) {
            return res.status(400).json({ error: 'Pelo menos um campo deve ser fornecido para atualização' });
        }

        // Verifica se o participante existe e se o usuário tem permissão
        let checkQuery = 'SELECT id, user_id FROM participantes WHERE id = $1';
        let checkParams = [id];

        if (userRole !== 'admin' && userRole !== 'teacher') {
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
        
        if (isNaN(id)) {
            return res.status(400).json({ error: 'ID do participante deve ser um número' });
        }

        // Verifica permissão antes de deletar
        let deleteQuery = 'DELETE FROM participantes WHERE id = $1';
        let deleteParams = [id];

        if (userRole !== 'admin' && userRole !== 'teacher') {
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
            'SELECT DISTINCT escola FROM participantes ORDER BY escola'
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