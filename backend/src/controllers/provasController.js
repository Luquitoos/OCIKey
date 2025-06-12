import { pool } from '../config/database-config.js';

// Importar provas via dados CSV enviados no body da requisição
export const importarProvasCSV = async (req, res) => {
    try {
        const { csvData, pesoQuestao = 0.50 } = req.body;
        
        if (!csvData) {
            return res.status(400).json({ error: 'Dados CSV são obrigatórios' });
        }

        if (isNaN(pesoQuestao) || pesoQuestao <= 0) {
            return res.status(400).json({ error: 'Peso da questão deve ser um número positivo' });
        }

        // Processa as linhas do CSV
        const linhas = csvData.split('\n').map(linha => linha.trim()).filter(linha => linha);
        
        if (linhas.length === 0) {
            return res.status(400).json({ error: 'CSV está vazio' });
        }

        // Remove cabeçalho se existir
        const primeiraLinha = linhas[0].toLowerCase();
        if (primeiraLinha.includes('prova') && primeiraLinha.includes('gabarito')) {
            linhas.shift();
        }

        let importadas = 0;
        let atualizadas = 0;
        const erros = [];

        for (const linha of linhas) {
            if (!linha) continue;
            
            const [prova, gabarito] = linha.split(',').map(item => item.trim());
            
            if (!prova || !gabarito) {
                erros.push(`Linha inválida: ${linha}`);
                continue;
            }

            const idProva = parseInt(prova);
            if (isNaN(idProva)) {
                erros.push(`ID de prova inválido: ${prova}`);
                continue;
            }

            try {
                // Verifica se a prova já existe
                const { rows: existingProva } = await pool.query(
                    'SELECT id FROM provas WHERE id = $1',
                    [idProva]
                );

                if (existingProva.length > 0) {
                    // Atualiza prova existente
                    await pool.query(
                        'UPDATE provas SET gabarito = $1, peso_questao = $2 WHERE id = $3',
                        [gabarito, pesoQuestao, idProva]
                    );
                    atualizadas++;
                } else {
                    // Insere nova prova
                    await pool.query(
                        'INSERT INTO provas (id, gabarito, peso_questao) VALUES ($1, $2, $3)',
                        [idProva, gabarito, pesoQuestao]
                    );
                    importadas++;
                }
            } catch (dbError) {
                erros.push(`Erro ao processar prova ${idProva}: ${dbError.message}`);
            }
        }

        // Atualiza a sequence
        await pool.query(`SELECT setval('provas_id_seq', (SELECT COALESCE(MAX(id), 1) FROM provas))`);

        res.json({
            success: true,
            message: 'Importação concluída',
            resultado: {
                importadas,
                atualizadas,
                total: importadas + atualizadas,
                erros: erros.length > 0 ? erros : undefined
            }
        });

    } catch (error) {
        console.error('Erro na importação de provas:', error);
        res.status(500).json({ error: 'Erro interno na importação' });
    }
};

// Listar todas as provas
export const listarProvas = async (req, res) => {
    try {
        const { rows } = await pool.query(
            'SELECT id, gabarito, peso_questao, created_at FROM provas ORDER BY id'
        );
        
        res.json({
            success: true,
            provas: rows
        });
    } catch (error) {
        console.error('Erro ao listar provas:', error);
        res.status(500).json({ error: 'Erro interno ao listar provas' });
    }
};

// Obter uma prova específica
export const obterProva = async (req, res) => {
    try {
        const { id } = req.params;
        
        if (isNaN(id)) {
            return res.status(400).json({ error: 'ID da prova deve ser um número' });
        }

        const { rows } = await pool.query(
            'SELECT id, gabarito, peso_questao, created_at FROM provas WHERE id = $1',
            [id]
        );
        
        if (rows.length === 0) {
            return res.status(404).json({ error: 'Prova não encontrada' });
        }

        res.json({
            success: true,
            prova: rows[0]
        });
    } catch (error) {
        console.error('Erro ao obter prova:', error);
        res.status(500).json({ error: 'Erro interno ao obter prova' });
    }
};

// Criar uma prova individual
export const criarProva = async (req, res) => {
    try {
        const { gabarito, pesoQuestao = 0.50 } = req.body;
        
        if (!gabarito) {
            return res.status(400).json({ error: 'Gabarito é obrigatório' });
        }

        if (isNaN(pesoQuestao) || pesoQuestao <= 0) {
            return res.status(400).json({ error: 'Peso da questão deve ser um número positivo' });
        }

        const { rows } = await pool.query(
            'INSERT INTO provas (gabarito, peso_questao) VALUES ($1, $2) RETURNING *',
            [gabarito, pesoQuestao]
        );

        res.status(201).json({
            success: true,
            message: 'Prova criada com sucesso',
            prova: rows[0]
        });
    } catch (error) {
        console.error('Erro ao criar prova:', error);
        res.status(500).json({ error: 'Erro interno ao criar prova' });
    }
};

// Atualizar uma prova
export const atualizarProva = async (req, res) => {
    try {
        const { id } = req.params;
        const { gabarito, pesoQuestao } = req.body;
        
        if (isNaN(id)) {
            return res.status(400).json({ error: 'ID da prova deve ser um número' });
        }

        if (!gabarito && !pesoQuestao) {
            return res.status(400).json({ error: 'Pelo menos um campo deve ser fornecido para atualização' });
        }

        if (pesoQuestao && (isNaN(pesoQuestao) || pesoQuestao <= 0)) {
            return res.status(400).json({ error: 'Peso da questão deve ser um número positivo' });
        }

        // Monta a query dinamicamente
        const campos = [];
        const valores = [];
        let contador = 1;

        if (gabarito) {
            campos.push(`gabarito = $${contador++}`);
            valores.push(gabarito);
        }

        if (pesoQuestao) {
            campos.push(`peso_questao = $${contador++}`);
            valores.push(pesoQuestao);
        }

        valores.push(id);

        const { rows } = await pool.query(
            `UPDATE provas SET ${campos.join(', ')} WHERE id = $${contador} RETURNING *`,
            valores
        );

        if (rows.length === 0) {
            return res.status(404).json({ error: 'Prova não encontrada' });
        }

        res.json({
            success: true,
            message: 'Prova atualizada com sucesso',
            prova: rows[0]
        });
    } catch (error) {
        console.error('Erro ao atualizar prova:', error);
        res.status(500).json({ error: 'Erro interno ao atualizar prova' });
    }
};

// Deletar uma prova
export const deletarProva = async (req, res) => {
    try {
        const { id } = req.params;
        
        if (isNaN(id)) {
            return res.status(400).json({ error: 'ID da prova deve ser um número' });
        }

        const { rows } = await pool.query(
            'DELETE FROM provas WHERE id = $1 RETURNING *',
            [id]
        );

        if (rows.length === 0) {
            return res.status(404).json({ error: 'Prova não encontrada' });
        }

        res.json({
            success: true,
            message: 'Prova deletada com sucesso',
            prova: rows[0]
        });
    } catch (error) {
        console.error('Erro ao deletar prova:', error);
        res.status(500).json({ error: 'Erro interno ao deletar prova' });
    }
};