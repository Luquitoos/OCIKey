import { createRequire } from 'module';
import { fileURLToPath } from 'url';
import { dirname, join } from 'path';

/* Configuração para importação de módulos CommonJS em ES modules 
(são metodos de importar/requerir coisa em node, o ES Module é mais moderno, por isso uso ele)
Necessário para carregar o addon nativo compilado */
const require = createRequire(import.meta.url);
const __filename = fileURLToPath(import.meta.url); // Converte URL para path
const __dirname = dirname(__filename); // Obtém diretório atual

/*Carrega o addon nativo C++ compilado
O addon contém as funções de leitura de gabarito implementadas em C++
Caminho: build/Release/leitoraddon.node */
const addon = require(join(__dirname, 'build', 'Release', 'leitoraddon.node'));

// Exporta o addon completo como default
export default addon;

/* Exporta funções específicas do addon para uso direto 
readImagePath: lê gabarito a partir do caminho do arquivo
readImageData: lê gabarito a partir de dados binários da imagem (chuto eu) */
export const { readImagePath, readImageData } = addon;