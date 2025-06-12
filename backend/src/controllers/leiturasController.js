import { pool } from '../config/database-config.js';

// Listar todas as leituras com filtros
export const listarLeituras = async (req, res) => {
    try {
        const { 
            id_prova, 
            id_participante, 
            escola, 
            erro, 
            page = 1, 
            limit = 50,
            data_inicio,
            data_fim
        } = req.query;
        
        let query = `
            SELECT 
                l.id, l.arquivo, l.erro, l.id_prova, l.id_participante, 
                l.gabarito, l.acertos, l.nota, l.created_at,
                p.nome as participante_nome, p.escola,
                pr.gabarito as gabarito_correto, pr.peso_questao
            FROM leituras l
            LEFT JOIN participantes p ON l.id_participante = p.id
            LEFT JOIN provas pr ON l.id_prova = pr.id
        `;
        
        let params = [];
        let whereConditions = [];

        // Filtros
        if (id_prova) {
            whereConditions.push(`l.id_prova = $${params.length + 1}`);
            params.push(id_prova);
        }

        if (id_participante) {
            whereConditions.push(`l.id_participante = $${params.length + 1}`);
            params.push(id_participante);
        }

        if (escola) {
            whereConditions.push(`p.escola ILIKE $${params.length + 1}`);
            params.push(`%${escola}%`);
        }

        if (erro !== undefined) {
            whereConditions.push(`l.erro = $${params.length + 1}`);
            params.push(erro);
        }

        if (data_inicio) {
            whereConditions.push(`l.created_at >= $${params.length + 1}`);
            params.push(data_inicio);
        }

        if (data_fim) {
            whereConditions.push(`l.created_at <= $${params.length + 1}`);
            params.push(data_fim);
        }

        if (whereConditions.length > 0) {
            query += ' WHERE ' + whereConditions.join(' AND ');
        }

        // Paginação
        const offset = (page - 1) * limit;
        query += ` ORDER BY l.created_at DESC LIMIT $${params.length + 1} OFFSET $${params.length + 2}`;
        params.push(limit, offset);

        const { rows } = await pool.query(query, params);

        // Conta total para paginação
        let countQuery = `
            SELECT COUNT(*) 
            FROM leituras l
            LEFT JOIN participantes p ON l.id_participante = p.id
        `;
        
        if (whereConditions.length > 0) {
            countQuery += ' WHERE ' + whereConditions.join(' AND ');
        }

        const countParams = params.slice(0, -2); // Remove limit e offset
        const { rows: countRows } = await pool.query(countQuery, countParams);
        const total = parseInt(countRows[0].count);

        res.json({
            success: true,
            leituras: rows,
            pagination: {
                page: parseInt(page),
                limit: parseInt(limit),
                total,
                pages: Math.ceil(total / limit)
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
        
        if (isNaN(id)) {
            return res.status(400).json({ error: 'ID da leitura deve ser um número' });
        }

        const { rows } = await pool.query(`
            SELECT 
                l.id, l.arquivo, l.erro, l.id_prova, l.id_participante, 
                l.gabarito, l.acertos, l.nota, l.created_at,
                p.nome as participante_nome, p.escola,
                pr.gabarito as gabarito_correto, pr.peso_questao
            FROM leituras l
            LEFT JOIN participantes p ON l.id_participante = p.id
            LEFT JOIN provas pr ON l.id_prova = pr.id
            WHERE l.id = $1
        `, [id]);
        
        if (rows.length === 0) {
            return res.status(404).json({ error: 'Leitura não encontrada' });
        }

        res.json({
            success: true,
            leitura: rows[0]
        });
    } catch (error) {
        console.error('Erro ao obter leitura:', error);
        res.status(500).json({ error: 'Erro interno ao obter leitura' });
    }
};

// Editar uma leitura (antes do salvamento final)
export const editarLeitura = async (req, res) => {
    try {
        const { id } = req.params;
        const { id_prova, id_participante, gabarito } = req.body;
        
        if (isNaN(id)) {
            return res.status(400).json({ error: 'ID da leitura deve ser um número' });
        }

        // Verifica se a leitura existe
        const { rows: leituraExistente } = await pool.query(
            'SELECT * FROM leituras WHERE id = $1',
            [id]
        );

        if (leituraExistente.length === 0) {
            return res.status(404).json({ error: 'Leitura não encontrada' });
        }

        // Recalcula acertos e nota se necessário
        let acertos = leituraExistente[0].acertos;
        let nota = leituraExistente[0].nota;

        if (id_prova && gabarito) {
            // Busca o gabarito correto e peso da questão
            const { rows: provaRows } = await pool.query(
                'SELECT gabarito, peso_questao FROM provas WHERE id = $1',
                [id_prova]
            );

            if (provaRows.length > 0) {
                const { gabarito: gabaritoCorreto, peso_questao } = provaRows[0];
                acertos = 0;

                // Recalcula acertos
                for (let i = 0; i < Math.min(gabaritoCorreto.length, gabarito.length); i++) {
                    const respostaAluno = gabarito[i];
                    if (respostaAluno !== '0' && respostaAluno !== 'X' && respostaAluno !== '?' && respostaAluno !== '-' && 
                        gabaritoCorreto[i] === respostaAluno) {
                        acertos++;
                    }
                }

                nota = parseFloat((acertos * peso_questao).toFixed(2));
            }
        }

        // Monta a query de atualização dinamicamente
        const campos = [];
        const valores = [];
        let contador = 1;

        if (id_prova !== undefined) {
            campos.push(`id_prova = $${contador++}`);
            valores.push(id_prova === -1 ? null : id_prova);
        }

        if (id_participante !== undefined) {
            campos.push(`id_participante = $${contador++}`);
            valores.push(id_participante === -1 ? null : id_participante);
        }

        if (gabarito !== undefined) {
            campos.push(`gabarito = $${contador++}`);
            valores.push(gabarito);
        }

        // Sempre atualiza acertos e nota se foram recalculados
        if (id_prova && gabarito) {
            campos.push(`acertos = $${contador++}`);
            valores.push(acertos);
            campos.push(`nota = $${contador++}`);
            valores.push(nota);
        }

        if (campos.length === 0) {
            return res.status(400).json({ error: 'Nenhum campo fornecido para atualização' });
        }

        valores.push(id);

        const { rows } = await pool.query(
            `UPDATE leituras SET ${campos.join(', ')} WHERE id = $${contador} RETURNING *`,
            valores
        );

        res.json({
            success: true,
            message: 'Leitura atualizada com sucesso',
            leitura: rows[0]
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
        
        if (isNaN(id)) {
            return res.status(400).json({ error: 'ID da leitura deve ser um número' });
        }

        const { rows } = await pool.query(
            'DELETE FROM leituras WHERE id = $1 RETURNING *',
            [id]
        );

        if (rows.length === 0) {
            return res.status(404).json({ error: 'Leitura não encontrada' });
        }

        res.json({
            success: true,
            message: 'Leitura deletada com sucesso',
            leitura: rows[0]
        });
    } catch (error) {
        console.error('Erro ao deletar leitura:', error);
        res.status(500).json({ error: 'Erro interno ao deletar leitura' });
    }
};

// Relatório de estatísticas gerais
export const obterEstatisticas = async (req, res) => {
    try {
        const { id_prova, escola } = req.query;
        
        let whereConditions = [];
        let params = [];

        if (id_prova) {
            whereConditions.push(`l.id_prova = $${params.length + 1}`);
            params.push(id_prova);
        }

        if (escola) {
            whereConditions.push(`p.escola ILIKE $${params.length + 1}`);
            params.push(`%${escola}%`);
        }

        const whereClause = whereConditions.length > 0 ? 
            'WHERE ' + whereConditions.join(' AND ') : '';

        // Estatísticas gerais
        const { rows: estatisticas } = await pool.query(`
            SELECT 
                COUNT(*) as total_leituras,
                COUNT(CASE WHEN l.erro = 0 THEN 1 END) as leituras_sucesso,
                COUNT(CASE WHEN l.erro > 0 THEN 1 END) as leituras_erro,
                AVG(l.nota) as nota_media,
                MAX(l.nota) as nota_maxima,
                MIN(l.nota) as nota_minima,
                AVG(l.acertos) as acertos_medio
            FROM leituras l
            LEFT JOIN participantes p ON l.id_participante = p.id
            ${whereClause}
        `, params);

        // Distribuição por escola
        const { rows: porEscola } = await pool.query(`
            SELECT 
                p.escola,
                COUNT(*) as total_leituras,
                AVG(l.nota) as nota_media,
                AVG(l.acertos) as acertos_medio
            FROM leituras l
            LEFT JOIN participantes p ON l.id_participante = p.id
            ${whereClause}
            GROUP BY p.escola
            ORDER BY nota_media DESC
        `, params);

        // Distribuição por prova
        const { rows: porProva } = await pool.query(`
            SELECT 
                l.id_prova,
                COUNT(*) as total_leituras,
                AVG(l.nota) as nota_media,
                AVG(l.acertos) as acertos_medio
            FROM leituras l
            LEFT JOIN participantes p ON l.id_participante = p.id
            ${whereClause}
            GROUP BY l.id_prova
            ORDER BY l.id_prova
        `, params);

        res.json({
            success: true,
            estatisticas: {
                geral: estatisticas[0],
                por_escola: porEscola,
                por_prova: porProva
            }
        });
    } catch (error) {
        console.error('Erro ao obter estatísticas:', error);
        res.status(500).json({ error: 'Erro interno ao obter estatísticas' });
    }
};

// Exportar leituras em formato CSV
export const exportarCSV = async (req, res) => {
    try {
        const { id_prova, escola } = req.query;
        
        let whereConditions = [];
        let params = [];

        if (id_prova) {
            whereConditions.push(`l.id_prova = $${params.length + 1}`);
            params.push(id_prova);
        }

        if (escola) {
            whereConditions.push(`p.escola ILIKE $${params.length + 1}`);
            params.push(`%${escola}%`);
        }

        const whereClause = whereConditions.length > 0 ? 
            'WHERE ' + whereConditions.join(' AND ') : '';

        const { rows } = await pool.query(`
            SELECT 
                l.arquivo, l.erro, l.id_prova, l.id_participante,
                l.gabarito, l.acertos, l.nota,
                p.nome as participante_nome, p.escola
            FROM leituras l
            LEFT JOIN participantes p ON l.id_participante = p.id
            ${whereClause}
            ORDER BY l.created_at DESC
        `, params);

        // Gera CSV
        const csvHeader = 'arquivo,erro,id_prova,id_participante,participante_nome,escola,gabarito,acertos,nota\n';
        const csvData = rows.map(row => 
            `${row.arquivo},${row.erro},${row.id_prova || ''},${row.id_participante || ''},"${row.participante_nome || ''}","${row.escola || ''}",${row.gabarito},${row.acertos},${row.nota}`
        ).join('\n');

        res.setHeader('Content-Type', 'text/csv');
        res.setHeader('Content-Disposition', 'attachment; filename=leituras.csv');
        res.send(csvHeader + csvData);
    } catch (error) {
        console.error('Erro ao exportar CSV:', error);
        res.status(500).json({ error: 'Erro interno ao exportar CSV' });
    }
};