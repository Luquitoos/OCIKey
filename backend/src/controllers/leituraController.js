import {pool} from '../config/database-config.js'
import {readImagePath} from '../addon/index.js';

async function Acertos(id_prova, resposta_aluno){
    // Verifica se id_prova é válido (não é -1)
    if (id_prova === -1) {
        return { acertos: 0, nota: 0.00 };
    }

    // Busca o gabarito e peso da questão da prova no banco de dados
    const {rows} = await pool.query('SELECT gabarito, peso_questao FROM provas WHERE id = $1', [id_prova]);
    if (!rows.length) {
        throw new Error('Prova não encontrada');
    }
    
    const { gabarito, peso_questao } = rows[0];
    let acertos = 0;
    
    // Compara o gabarito com a resposta do aluno
    // Ignora questões em branco (0) e questões com múltiplas marcações (X ou ?)
    for (let i = 0; i < Math.min(gabarito.length, resposta_aluno.length); i++) {
        const respostaAluno = resposta_aluno[i];
        // Conta como acerto apenas se a resposta não for 0, X, ? ou - e for igual ao gabarito
        if (respostaAluno !== '0' && respostaAluno !== 'X' && respostaAluno !== '?' && respostaAluno !== '-' && 
            gabarito[i] === respostaAluno) {
            acertos++;
        }
    }
    
    // Calcula a nota baseada no peso por questão
    const nota = parseFloat((acertos * peso_questao).toFixed(2));
    return { acertos, nota };
}

// Função auxiliar para obter mensagem de erro baseada no código
function getErrorMessage(codigoErro) {
    switch(codigoErro) {
        case 1:
            return 'Erro de leitura do código Aztec';
        case 2:
            return 'Imprecisão ou erro na identificação da área de leitura';
        case 3:
            return 'Erro fatal durante a leitura';
        default:
            return null;
    }
}

// Função auxiliar para processar uma única leitura
async function processarUmaLeitura(caminhoImagem) {
    // Usa o addon para ler a imagem
    const leitura = readImagePath(caminhoImagem);
    
    // Trata códigos de erro
    const errorMessage = getErrorMessage(leitura.erro);

    // Calcula acertos e nota
    const { acertos, nota } = await Acertos(leitura.id_prova, leitura.leitura || '');

    // Salva no banco de dados
    const result = await pool.query(
        `INSERT INTO leituras (arquivo, erro, id_prova, id_participante, gabarito, acertos, nota)
        VALUES ($1, $2, $3, $4, $5, $6, $7)
        RETURNING *`,
        [
            caminhoImagem,
            leitura.erro,
            leitura.id_prova === -1 ? null : leitura.id_prova,
            leitura.id_participante === -1 ? null : leitura.id_participante,
            leitura.leitura || '',
            acertos,
            nota
        ]
    );

    const retorno = {
        leitura: result.rows[0]
    };
    
    if (errorMessage) {
        retorno.warning = errorMessage;
    }
    
    return retorno;
}

export const processarLeitura = async (req, res) => {
    try {
        const { caminhoImagem } = req.body;
        if(!caminhoImagem) {
            return res.status(400).json({ error: 'Caminho da imagem é obrigatório' });
        }

        const resultado = await processarUmaLeitura(caminhoImagem);
        res.json(resultado);
    } catch (error) {
        console.error('Erro ao processar leitura:', error);
        return res.status(500).json({ error: 'Erro interno ao processar leitura' });
    }
}

export const processarMultiplasLeituras = async (req, res) => {
    try {
        const { caminhosImagens } = req.body;
        
        if (!caminhosImagens || !Array.isArray(caminhosImagens) || caminhosImagens.length === 0) {
            return res.status(400).json({ error: 'Array de caminhos de imagens é obrigatório' });
        }

        const resultados = [];
        
        for (const caminhoImagem of caminhosImagens) {
            try {
                const resultado = await processarUmaLeitura(caminhoImagem);
                resultados.push(Object.assign({
                    arquivo: caminhoImagem
                }, resultado));
            } catch (imageError) {
                console.error(`Erro ao processar imagem ${caminhoImagem}:`, imageError);
                resultados.push({
                    arquivo: caminhoImagem,
                    error: 'Erro ao processar esta imagem'
                });
            }
        }

        res.json({
            total: caminhosImagens.length,
            processados: resultados.length,
            resultados
        });

    } catch (error) {
        console.error('Erro ao processar múltiplas leituras:', error);
        return res.status(500).json({ error: 'Erro interno ao processar múltiplas leituras' });
    }
}

// Processar imagem enviada via upload
export const processarImagemUpload = async (req, res) => {
    try {
        if (!req.file) {
            return res.status(400).json({ error: 'Nenhuma imagem foi enviada' });
        }

        const caminhoImagem = req.file.path;
        const resultado = await processarUmaLeitura(caminhoImagem);
        
        res.json(Object.assign({}, resultado, {
            arquivo_original: req.file.originalname,
            arquivo_salvo: req.file.filename
        }));
    } catch (error) {
        console.error('Erro ao processar imagem upload:', error);
        return res.status(500).json({ error: 'Erro interno ao processar imagem' });
    }
};

// Processar múltiplas imagens enviadas via upload
export const processarMultiplasImagensUpload = async (req, res) => {
    try {
        if (!req.files || req.files.length === 0) {
            return res.status(400).json({ error: 'Nenhuma imagem foi enviada' });
        }

        const resultados = [];
        
        for (const file of req.files) {
            try {
                const resultado = await processarUmaLeitura(file.path);
                resultados.push(Object.assign({
                    arquivo_original: file.originalname,
                    arquivo_salvo: file.filename
                }, resultado));
            } catch (imageError) {
                console.error(`Erro ao processar imagem ${file.originalname}:`, imageError);
                resultados.push({
                    arquivo_original: file.originalname,
                    arquivo_salvo: file.filename,
                    error: 'Erro ao processar esta imagem'
                });
            }
        }

        res.json({
            total: req.files.length,
            processados: resultados.length,
            resultados
        });

    } catch (error) {
        console.error('Erro ao processar múltiplas imagens upload:', error);
        return res.status(500).json({ error: 'Erro interno ao processar múltiplas imagens' });
    }
}