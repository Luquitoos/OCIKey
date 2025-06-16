import {pool} from '../config/database-config.js'
import {readImagePath} from '../addon/index.js';

async function Acertos(id_prova, resposta_aluno){
    // Verifica se id_prova é válido (não é -1, 0 ou null)
    if (id_prova === -1 || id_prova === 0 || id_prova === null || id_prova === undefined) {
        return { acertos: 0, nota: 0.00 };
    }

    // Busca o gabarito e peso da questão da prova no banco de dados
    const {rows} = await pool.query('SELECT gabarito, peso_questao FROM provas WHERE id = $1', [id_prova]);
    if (!rows.length) {
        // Se a prova não for encontrada, retorna valores zerados ao invés de lançar erro
        return { acertos: 0, nota: 0.00 };
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
async function processarUmaLeitura(caminhoImagem, userId) {
    // Usa o addon para ler a imagem
    const leitura = readImagePath(caminhoImagem);
    
    // Trata códigos de erro
    const errorMessage = getErrorMessage(leitura.erro);

    // Calcula acertos e nota
    const { acertos, nota } = await Acertos(leitura.id_prova, leitura.leitura || '');

    let participanteId = null;
    let participanteOriginalInfo = null;

    // Verifica se o participante da leitura existe no banco
    if (leitura.id_participante !== -1) {
        const participanteOriginalCheck = await pool.query(
            'SELECT id, nome, escola, user_id FROM participantes WHERE id = $1', 
            [leitura.id_participante]
        );
        
        if (participanteOriginalCheck.rows.length > 0) {
            const participanteOriginal = participanteOriginalCheck.rows[0];
            participanteOriginalInfo = {
                id: participanteOriginal.id,
                nome: participanteOriginal.nome,
                escola: participanteOriginal.escola,
                user_id: participanteOriginal.user_id
            };

            // Se o participante da leitura pertence ao usuário atual, usa normalmente
            if (participanteOriginal.user_id === userId) {
                participanteId = leitura.id_participante;
            } else {
                // Se o participante da leitura pertence a outro usuário,
                // cria ou encontra um participante com o mesmo nome e escola para o usuário atual
                const participanteExistenteCheck = await pool.query(
                    'SELECT id FROM participantes WHERE nome = $1 AND escola = $2 AND user_id = $3',
                    [participanteOriginal.nome, participanteOriginal.escola, userId]
                );

                if (participanteExistenteCheck.rows.length > 0) {
                    // Usa o participante existente do usuário atual
                    participanteId = participanteExistenteCheck.rows[0].id;
                } else {
                    // Cria um novo participante para o usuário atual com os dados originais
                    const novoParticipante = await pool.query(
                        'INSERT INTO participantes (nome, escola, user_id) VALUES ($1, $2, $3) RETURNING id',
                        [participanteOriginal.nome, participanteOriginal.escola, userId]
                    );
                    participanteId = novoParticipante.rows[0].id;
                }
            }
        }
    }

    // Salva no banco de dados
    // Trata id_prova: -1 vira null, 0 permanece 0, outros valores permanecem como estão
    let idProvaParaSalvar = leitura.id_prova;
    if (leitura.id_prova === -1) {
        idProvaParaSalvar = null;
    } else if (leitura.id_prova === 0) {
        idProvaParaSalvar = 0; // Mantém 0 para casos como base.png
    }

    const result = await pool.query(
        `INSERT INTO leituras (arquivo, erro, id_prova, id_participante, gabarito, acertos, nota, user_id)
        VALUES ($1, $2, $3, $4, $5, $6, $7, $8)
        RETURNING *`,
        [
            caminhoImagem,
            leitura.erro,
            idProvaParaSalvar,
            participanteId,
            leitura.leitura || '',
            acertos,
            nota,
            userId
        ]
    );

    const retorno = {
        leitura: result.rows[0],
        participante_original: participanteOriginalInfo
    };
    
    if (errorMessage) {
        retorno.warning = errorMessage;
    }
    
    return retorno;
}

export const processarLeitura = async (req, res) => {
    try {
        const { caminhoImagem } = req.body;
        const userId = req.user.id;
        
        if(!caminhoImagem) {
            return res.status(400).json({ error: 'Caminho da imagem é obrigatório' });
        }

        const resultado = await processarUmaLeitura(caminhoImagem, userId);
        res.json(resultado);
    } catch (error) {
        console.error('Erro ao processar leitura:', error);
        return res.status(500).json({ error: 'Erro interno ao processar leitura' });
    }
}

export const processarMultiplasLeituras = async (req, res) => {
    try {
        const { caminhosImagens } = req.body;
        const userId = req.user.id;
        
        if (!caminhosImagens || !Array.isArray(caminhosImagens) || caminhosImagens.length === 0) {
            return res.status(400).json({ error: 'Array de caminhos de imagens é obrigatório' });
        }

        const resultados = [];
        
        for (const caminhoImagem of caminhosImagens) {
            try {
                const resultado = await processarUmaLeitura(caminhoImagem, userId);
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
        const userId = req.user.id;
        const resultado = await processarUmaLeitura(caminhoImagem, userId);
        
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

        const userId = req.user.id;
        const resultados = [];
        
        for (const file of req.files) {
            try {
                const resultado = await processarUmaLeitura(file.path, userId);
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