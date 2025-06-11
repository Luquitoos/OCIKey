import {pool} from '../config/database-config.js'
import {readImagePath} from '../addon/index.js';

async function Acertos(id_prova, resposta_aluno){
    const {rows} = await pool.query('SELECT gabarito FROM provas WHERE id = $1', [id_prova]);
    if (!rows.length) {
        throw new Error('Prova não encontrada');
    }
    const gabarito = rows[0].gabarito;
    let acertos = 0;
    for (let i = 0; i < gabarito.length; i++) {
        if (gabarito[i] === resposta_aluno[i]) {
            acertos++;
        }
    }
    return { acertos, nota: (acertos / gabarito.length * 10).toFixed(2) };
}

export const processarLeitura = async (req, res) => {
    try {
        const { caminhoImagem } = req.body
        if(!caminhoImagem) return res.status(400).json({ error: 'Caminho da imagem é obrigatório' });

        const leitura = readImagePath(caminhoImagem);
        if(leitura.erro) {
            return res.status(500).json({ error: 'Erro ao processar a imagem'});
        }

        const { acertos, nota } = await Acertos(leitura.id_prova, leitura.leitura);

        const result = await pool.query(
            `INSERT INTO leituras (arquivo, erro, id_prova, id_aluno, gabarito, acertos, nota)
            VALUES ($1, $2, $3, $4, $5, $6, $7)
            RETURNING *`,
            [caminhoImagem, leitura.erro, leitura.id_prova, leitura.id_participante, leitura.leitura, acertos, nota]
        );
        res.json({leitura: result.rows[0]})
    } catch (error) {
        console.error('Erro ao processar leitura:', error);
        return res.status(500).json({ error: 'Erro interno ao processar leitura' });
    }

}