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

// Listar todos os participantes
export const listarParticipantes = async (req, res) => {
    try {
        const { escola, page = 1, limit = 50 } = req.query;
        
        let query = 'SELECT id, nome, escola, created_at FROM participantes';
        let params = [];
        let whereClause = '';

        // Filtro por escola se fornecido
        if (escola) {
            whereClause = ' WHERE escola ILIKE $1';
            params.push(`%${escola}%`);
        }

        // Paginação
        const offset = (page - 1) * limit;
        const orderClause = ' ORDER BY nome';
        const limitClause = ` LIMIT $${params.length + 1} OFFSET $${params.length + 2}`;
        params.push(limit, offset);

        const finalQuery = query + whereClause + orderClause + limitClause;
        const { rows } = await pool.query(finalQuery, params);

        // Conta total para paginação
        const countQuery = 'SELECT COUNT(*) FROM participantes' + whereClause;
        const countParams = escola ? [escola] : [];
        const { rows: countRows } = await pool.query(countQuery, countParams);
        const total = parseInt(countRows[0].count);

        res.json({
            success: true,
            participantes: rows,
            pagination: {
                page: parseInt(page),
                limit: parseInt(limit),
                total,
                pages: Math.ceil(total / limit)
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
        
        if (isNaN(id)) {
            return res.status(400).json({ error: 'ID do participante deve ser um número' });
        }

        const { rows } = await pool.query(
            'SELECT id, nome, escola, created_at FROM participantes WHERE id = $1',
            [id]
        );
        
        if (rows.length === 0) {
            return res.status(404).json({ error: 'Participante não encontrado' });
        }

        res.json({
            success: true,
            participante: rows[0]
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
        
        if (!nome || !escola) {
            return res.status(400).json({ error: 'Nome e escola são obrigatórios' });
        }

        const { rows } = await pool.query(
            'INSERT INTO participantes (nome, escola) VALUES ($1, $2) RETURNING *',
            [nome.trim(), escola.trim()]
        );

        res.status(201).json({
            success: true,
            message: 'Participante criado com sucesso',
            participante: rows[0]
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
        
        if (isNaN(id)) {
            return res.status(400).json({ error: 'ID do participante deve ser um número' });
        }

        if (!nome && !escola) {
            return res.status(400).json({ error: 'Pelo menos um campo deve ser fornecido para atualização' });
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

        if (rows.length === 0) {
            return res.status(404).json({ error: 'Participante não encontrado' });
        }

        res.json({
            success: true,
            message: 'Participante atualizado com sucesso',
            participante: rows[0]
        });
    } catch (error) {
        console.error('Erro ao atualizar participante:', error);
        res.status(500).json({ error: 'Erro interno ao atualizar participante' });
    }
};

// Deletar um participante
export const deletarParticipante = async (req, res) => {
    try {
        const { id } = req.params;
        
        if (isNaN(id)) {
            return res.status(400).json({ error: 'ID do participante deve ser um número' });
        }

        const { rows } = await pool.query(
            'DELETE FROM participantes WHERE id = $1 RETURNING *',
            [id]
        );

        if (rows.length === 0) {
            return res.status(404).json({ error: 'Participante não encontrado' });
        }

        res.json({
            success: true,
            message: 'Participante deletado com sucesso',
            participante: rows[0]
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
            escolas: rows.map(row => row.escola)
        });
    } catch (error) {
        console.error('Erro ao listar escolas:', error);
        res.status(500).json({ error: 'Erro interno ao listar escolas' });
    }
};