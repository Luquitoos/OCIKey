import {pool} from '../config/database-config.js'
import {readImagePath} from '../addon/index.js';

async function Acertos(id_prova, resposta_aluno){
    //Busca o gabarito da prova no banco de dados
    const {rows} = await pool.query('SELECT gabarito FROM provas WHERE id = $1', [id_prova]);
    if (!rows.length) {
        throw new Error('Prova não encontrada');
    }
    const gabarito = rows[0].gabarito;
    let acertos = 0;
    //Compara o gabarito com a resposta do aluno
    //Dá pra colocar o peso das questões aqui caso tenha
    for (let i = 0; i < gabarito.length; i++) {
        if (gabarito[i] === resposta_aluno[i]) {
            acertos++;
        }
    }
    //Calcula a nota e retorna o número de acertos e a nota
    return { acertos, nota: (acertos / gabarito.length * 10).toFixed(2) };
}

export const processarLeitura = async (req, res) => {
    try {
        //Retira o caminho da imagem do corpo da requisição
        const { caminhoImagem } = req.body
        if(!caminhoImagem) return res.status(400).json({ error: 'Caminho da imagem é obrigatório' });

        //Usa o addon para ler a imagem e obter as informações necessárias
        const leitura = readImagePath(caminhoImagem);
        if(leitura.erro) {
            return res.status(500).json({ error: 'Erro ao processar a imagem'});
        }
        //Calcula por meio da funcao Acertos, o número de acertos e a nota
        const { acertos, nota } = await Acertos(leitura.id_prova, leitura.leitura);

        //Salva a leitura no banco de dados
        const result = await pool.query(
            `INSERT INTO leituras (arquivo, erro, id_prova, id_aluno, gabarito, acertos, nota)
            VALUES ($1, $2, $3, $4, $5, $6, $7)
            RETURNING *`,
            [caminhoImagem, leitura.erro, leitura.id_prova, leitura.id_participante, leitura.leitura, acertos, nota]
        );
        //Retorna a leitura 
        res.json({leitura: result.rows[0]})
    } catch (error) {
        console.error('Erro ao processar leitura:', error);
        return res.status(500).json({ error: 'Erro interno ao processar leitura' });
    }

}