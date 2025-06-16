/* 
 Middleware de Upload de Arquivos
 Utiliza Multer - biblioteca Node.js para manipulação de dados multipart/form-data
 Multer é usado principalmente para upload de arquivos em aplicações Express
 Permite configurar onde e como os arquivos são armazenados
*/

import multer from 'multer';
import path from 'path';
import fs from 'fs';

/* Configuração do diretório de uploads
   Cria pasta 'uploads' na raiz do projeto se não existir
   process.cwd() retorna o diretório atual de trabalho */
const uploadsDir = path.join(process.cwd(), 'uploads');
if (!fs.existsSync(uploadsDir)) {
    fs.mkdirSync(uploadsDir, { recursive: true });
}

/* Configuração de armazenamento do Multer
   diskStorage: armazena arquivos no disco local
   destination: define onde salvar os arquivos
   filename: define como nomear os arquivos salvos */
const storage = multer.diskStorage({
    // Função que define o diretório de destino dos uploads
    destination: (req, file, cb) => {
        cb(null, uploadsDir); // cb = callback, primeiro parâmetro é erro (null = sem erro)
    },
    // Função que define o nome do arquivo salvo
    filename: (req, file, cb) => {
        // Gera nome único combinando timestamp + número aleatório para evitar conflitos
        const uniqueSuffix = Date.now() + '-' + Math.round(Math.random() * 1E9);
        const extension = path.extname(file.originalname); // Extrai extensão do arquivo original
        // Formato final: campo-timestamp-random.extensão (ex: imagem-1703123456789-123456789.png)
        cb(null, file.fieldname + '-' + uniqueSuffix + extension);
    }
});

/* Configuração principal do Multer
   Cria instância do multer com as configurações de storage
   Sem filtros ou limites - aceita qualquer tipo de arquivo */
const upload = multer({
    storage: storage
});

/* Middleware para upload de arquivo único
   upload.single('imagem') espera um campo chamado 'imagem' no formulário
   Adiciona o arquivo em req.file para uso nos controllers */
export const uploadSingle = upload.single('imagem');

/* Middleware para upload de múltiplos arquivos
   upload.array('imagens') espera um campo chamado 'imagens' no formulário
   Adiciona os arquivos em req.files (array) para uso nos controllers */
export const uploadMultiple = upload.array('imagens');

/* Exporta a instância do upload para uso direto nos controllers */
export { upload };

/* Middleware para tratamento de erros específicos do Multer
   Captura erros que podem ocorrer durante o upload
   MulterError: classe de erro específica do Multer */
export const handleUploadError = (error, req, res, next) => {
    // Verifica se o erro é do tipo MulterError
    if (error instanceof multer.MulterError) {
        // LIMIT_UNEXPECTED_FILE: campo de arquivo não esperado foi enviado
        if (error.code === 'LIMIT_UNEXPECTED_FILE') {
            return res.status(400).json({ error: 'Campo de arquivo inesperado.' });
        }
    }
    
    // Se não for erro do Multer, passa para o próximo middleware de erro
    next(error);
};

/* Função utilitária para deletar arquivo do sistema
   Recebe o caminho completo do arquivo
   Retorna true se deletou com sucesso, false caso contrário */
export const deleteFile = (filePath) => {
    try {
        // Verifica se o arquivo existe antes de tentar deletar
        if (fs.existsSync(filePath)) {
            fs.unlinkSync(filePath); // Remove o arquivo sincronamente
            return true;
        }
        return false; // Arquivo não existe
    } catch (error) {
        console.error('Erro ao deletar arquivo:', error);
        return false;
    }
};

/* Função para limpeza automática de uploads antigos
   Remove arquivos mais antigos que o número de dias especificado
   Útil para evitar acúmulo de arquivos temporários no servidor */
export const cleanupOldUploads = (daysOld = 7) => {
    try {
        const files = fs.readdirSync(uploadsDir); // Lista todos os arquivos do diretório
        const now = Date.now(); // Timestamp atual em millisegundos
        const maxAge = daysOld * 24 * 60 * 60 * 1000; // Converte dias para millisegundos

        // Itera sobre cada arquivo no diretório
        files.forEach(file => {
            const filePath = path.join(uploadsDir, file);
            const stats = fs.statSync(filePath); // Obtém informações do arquivo
            
            // Compara a data de modificação com a idade máxima permitida
            if (now - stats.mtime.getTime() > maxAge) {
                fs.unlinkSync(filePath); // Remove arquivo antigo
                console.log(`Arquivo antigo removido: ${file}`);
            }
        });
    } catch (error) {
        console.error('Erro na limpeza de uploads:', error);
    }
};