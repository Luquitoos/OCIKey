import { pool } from '../config/database-config.js';

// Listar leituras (filtradas por usuário se não for admin)
export const listarLeituras = async (req, res) => {
    try {
        const { 
            page = 1, 
            limit = 50, 
            id_prova, 
            id_participante, 
            erro,
            meus = false 
        } = req.query;
        
        const userId = req.user.id;
        const userRole = req.user.role;
        
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

        // Se não for admin/teacher e meus=true, filtra apenas leituras dos participantes do usuário
        if (meus === 'true' || (userRole !== 'admin' && userRole !== 'teacher')) {
            whereConditions.push(`p.user_id = $${params.length + 1}`);
            params.push(userId);
        }

        // Filtros opcionais
        if (id_prova) {
            whereConditions.push(`l.id_prova = $${params.length + 1}`);
            params.push(id_prova);
        }

        if (id_participante) {
            whereConditions.push(`l.id_participante = $${params.length + 1}`);
            params.push(id_participante);
        }

        if (erro !== undefined) {
            whereConditions.push(`l.erro = $${params.length + 1}`);
            params.push(erro);
        }

        // Monta WHERE clause
        const whereClause = whereConditions.length > 0 ? ' WHERE ' + whereConditions.join(' AND ') : '';

        // Paginação
        const offset = (page - 1) * limit;
        const orderClause = ' ORDER BY l.created_at DESC';
        const limitClause = ` LIMIT $${params.length + 1} OFFSET $${params.length + 2}`;
        params.push(limit, offset);

        const finalQuery = query + whereClause + orderClause + limitClause;
        const { rows } = await pool.query(finalQuery, params);

        // Conta total para paginação
        const countQuery = `
            SELECT COUNT(*) 
            FROM leituras l
            LEFT JOIN participantes p ON l.id_participante = p.id
        ` + whereClause;
        const countParams = params.slice(0, -2); // Remove limit e offset
        const { rows: countRows } = await pool.query(countQuery, countParams);
        const total = parseInt(countRows[0].count);

        // Formata os dados de resposta
        const leituras = rows.map(row => ({
            id: row.id,
            arquivo: row.arquivo,
            erro: row.erro,
            id_prova: row.id_prova,
            id_participante: row.id_participante,
            gabarito: row.gabarito,
            acertos: row.acertos,
            nota: row.nota,
            created_at: row.created_at,
            participante: row.participante_nome ? {
                nome: row.participante_nome,
                escola: row.participante_escola
            } : null,
            prova: row.prova_gabarito ? {
                gabarito: row.prova_gabarito,
                peso_questao: row.peso_questao
            } : null
        }));

        res.json({
            success: true,
            data: {
                leituras,
                pagination: {
                    page: parseInt(page),
                    limit: parseInt(limit),
                    total,
                    pages: Math.ceil(total / limit)
                }
            }
        });
    } catch (error) {
        console.error('Erro ao listar leituras:', error);
        res.status(500).json({ error: 'Erro interno ao listar leituras' });
    }
};

// Obter uma leitura específica
export const obterLeitura = async (req, res) => {
    try {
        const { id } = req.params;
        const userId = req.user.id;
        const userRole = req.user.role;
        
        if (isNaN(id)) {
            return res.status(400).json({ error: 'ID da leitura deve ser um número' });
        }

        let query = `
            SELECT 
                l.id, l.arquivo, l.erro, l.id_prova, l.id_participante, 
                l.gabarito, l.acertos, l.nota, l.created_at,
                p.nome as participante_nome, p.escola as participante_escola,
                pr.gabarito as prova_gabarito, pr.peso_questao
            FROM leituras l
            LEFT JOIN participantes p ON l.id_participante = p.id
            LEFT JOIN provas pr ON l.id_prova = pr.id
            WHERE l.id = $1
        `;
        
        let params = [id];

        // Se não for admin/teacher, só pode ver leituras dos seus participantes
        if (userRole !== 'admin' && userRole !== 'teacher') {
            query += ' AND p.user_id = $2';
            params.push(userId);
        }

        const { rows } = await pool.query(query, params);
        
        if (rows.length === 0) {
            return res.status(404).json({ error: 'Leitura não encontrada' });
        }

        const row = rows[0];
        const leitura = {
            id: row.id,
            arquivo: row.arquivo,
            erro: row.erro,
            id_prova: row.id_prova,
            id_participante: row.id_participante,
            gabarito: row.gabarito,
            acertos: row.acertos,
            nota: row.nota,
            created_at: row.created_at,
            participante: row.participante_nome ? {
                nome: row.participante_nome,
                escola: row.participante_escola
            } : null,
            prova: row.prova_gabarito ? {
                gabarito: row.prova_gabarito,
                peso_questao: row.peso_questao
            } : null
        };

        res.json({
            success: true,
            data: {
                leitura
            }
        });
    } catch (error) {
        console.error('Erro ao obter leitura:', error);
        res.status(500).json({ error: 'Erro interno ao obter leitura' });
    }
};

// Editar uma leitura (permite correção manual)
export const editarLeitura = async (req, res) => {
    try {
        const { id } = req.params;
        const { id_prova, id_participante, gabarito } = req.body;
        const userId = req.user.id;
        const userRole = req.user.role;
        
        if (isNaN(id)) {
            return res.status(400).json({ error: 'ID da leitura deve ser um número' });
        }

        // Verifica se a leitura existe e se o usuário tem permissão
        let checkQuery = `
            SELECT l.id, l.id_participante, p.user_id 
            FROM leituras l
            LEFT JOIN participantes p ON l.id_participante = p.id
            WHERE l.id = $1
        `;
        let checkParams = [id];

        if (userRole !== 'admin' && userRole !== 'teacher') {
            checkQuery += ' AND p.user_id = $2';
            checkParams.push(userId);
        }

        const { rows: checkRows } = await pool.query(checkQuery, checkParams);
        
        if (checkRows.length === 0) {
            return res.status(404).json({ error: 'Leitura não encontrada ou sem permissão' });
        }

        // Recalcula acertos e nota se necessário
        let acertos = null;
        let nota = null;

        if (id_prova && gabarito) {
            // Busca o peso da questão da prova
            const { rows: provaRows } = await pool.query(
                'SELECT peso_questao FROM provas WHERE id = $1',
                [id_prova]
            );

            if (provaRows.length > 0) {
                const peso_questao = provaRows[0].peso_questao;
                acertos = 0;

                // Recalcula acertos
                const { rows: gabaritoRows } = await pool.query(
                    'SELECT gabarito FROM provas WHERE id = $1',
                    [id_prova]
                );

                if (gabaritoRows.length > 0) {
                    const gabaritoCorreto = gabaritoRows[0].gabarito;
                    
                    for (let i = 0; i < Math.min(gabaritoCorreto.length, gabarito.length); i++) {
                        const respostaAluno = gabarito[i];
                        if (respostaAluno !== '0' && respostaAluno !== 'X' && 
                            respostaAluno !== '?' && respostaAluno !== '-' && 
                            gabaritoCorreto[i] === respostaAluno) {
                            acertos++;
                        }
                    }
                    
                    nota = parseFloat((acertos * peso_questao).toFixed(2));
                }
            }
        }

        // Monta a query de atualização dinamicamente
        const campos = [];
        const valores = [];
        let contador = 1;

        if (id_prova !== undefined) {
            campos.push(`id_prova = $${contador++}`);
            valores.push(id_prova);
        }

        if (id_participante !== undefined) {
            campos.push(`id_participante = $${contador++}`);
            valores.push(id_participante);
        }

        if (gabarito !== undefined) {
            campos.push(`gabarito = $${contador++}`);
            valores.push(gabarito);
        }

        if (acertos !== null) {
            campos.push(`acertos = $${contador++}`);
            valores.push(acertos);
        }

        if (nota !== null) {
            campos.push(`nota = $${contador++}`);
            valores.push(nota);
        }

        if (campos.length === 0) {
            return res.status(400).json({ error: 'Nenhum campo válido fornecido para atualização' });
        }

        valores.push(id);

        const { rows } = await pool.query(
            `UPDATE leituras SET ${campos.join(', ')} WHERE id = $${contador} RETURNING *`,
            valores
        );

        res.json({
            success: true,
            message: 'Leitura atualizada com sucesso',
            data: {
                leitura: rows[0]
            }
        });
    } catch (error) {
        console.error('Erro ao editar leitura:', error);
        res.status(500).json({ error: 'Erro interno ao editar leitura' });
    }
};

// Deletar uma leitura
export const deletarLeitura = async (req, res) => {
    try {
        const { id } = req.params;
        const userId = req.user.id;
        const userRole = req.user.role;
        
        if (isNaN(id)) {
            return res.status(400).json({ error: 'ID da leitura deve ser um número' });
        }

        // Verifica permissão antes de deletar
        let deleteQuery = `
            DELETE FROM leituras 
            WHERE id = $1
        `;
        let deleteParams = [id];

        if (userRole !== 'admin' && userRole !== 'teacher') {
            deleteQuery = `
                DELETE FROM leituras 
                WHERE id = $1 AND id_participante IN (
                    SELECT id FROM participantes WHERE user_id = $2
                )
            `;
            deleteParams.push(userId);
        }

        deleteQuery += ' RETURNING *';

        const { rows } = await pool.query(deleteQuery, deleteParams);

        if (rows.length === 0) {
            return res.status(404).json({ error: 'Leitura não encontrada ou sem permissão' });
        }

        res.json({
            success: true,
            message: 'Leitura deletada com sucesso',
            data: {
                leitura: rows[0]
            }
        });
    } catch (error) {
        console.error('Erro ao deletar leitura:', error);
        res.status(500).json({ error: 'Erro interno ao deletar leitura' });
    }
};

// Obter estatísticas das leituras do usuário
export const estatisticasLeituras = async (req, res) => {
    try {
        const userId = req.user.id;
        const userRole = req.user.role;
        
        let whereClause = '';
        let params = [];

        // Se não for admin/teacher, filtra apenas leituras dos participantes do usuário
        if (userRole !== 'admin' && userRole !== 'teacher') {
            whereClause = 'WHERE p.user_id = $1';
            params.push(userId);
        }

        const query = `
            SELECT 
                COUNT(*) as total_leituras,
                COUNT(CASE WHEN l.erro = 0 THEN 1 END) as leituras_sucesso,
                COUNT(CASE WHEN l.erro > 0 THEN 1 END) as leituras_erro,
                AVG(l.nota) as nota_media,
                MAX(l.nota) as nota_maxima,
                MIN(l.nota) as nota_minima
            FROM leituras l
            LEFT JOIN participantes p ON l.id_participante = p.id
            ${whereClause}
        `;

        const { rows } = await pool.query(query, params);
        const stats = rows[0];

        res.json({
            success: true,
            data: {
                estatisticas: {
                    total_leituras: parseInt(stats.total_leituras),
                    leituras_sucesso: parseInt(stats.leituras_sucesso),
                    leituras_erro: parseInt(stats.leituras_erro),
                    taxa_sucesso: stats.total_leituras > 0 ? 
                        ((stats.leituras_sucesso / stats.total_leituras) * 100).toFixed(2) : 0,
                    nota_media: stats.nota_media ? parseFloat(stats.nota_media).toFixed(2) : 0,
                    nota_maxima: stats.nota_maxima ? parseFloat(stats.nota_maxima) : 0,
                    nota_minima: stats.nota_minima ? parseFloat(stats.nota_minima) : 0
                }
            }
        });
    } catch (error) {
        console.error('Erro ao obter estatísticas:', error);
        res.status(500).json({ error: 'Erro interno ao obter estatísticas' });
    }
};