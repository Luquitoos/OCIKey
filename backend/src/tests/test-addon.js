import { readImagePath } from './src/addon/index.js';
import path from 'path';

console.log('Testando o addon...');

try {
    const imagePath = path.join(process.cwd(), 'img', '0001.png');
    console.log('Caminho da imagem:', imagePath);
    
    const result = readImagePath(imagePath);
    console.log('Resultado da leitura:', result);
} catch (error) {
    console.error('Erro ao testar addon:', error);
}