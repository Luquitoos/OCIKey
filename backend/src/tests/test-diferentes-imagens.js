import { readImagePath } from './src/addon/index.js';
import path from 'path';

async function testDiferentesImagens() {
    console.log('=== Teste de Diferentes Imagens ===');
    
    const imagens = ['0001.png', '0002.png', '0003.png', '0004.png', '0005.png'];
    
    for (const img of imagens) {
        const imagePath = path.join(process.cwd(), 'img', img);
        console.log(`\nTestando ${img}:`);
        
        try {
            const leitura = readImagePath(imagePath);
            console.log(`Erro: ${leitura.erro}`);
            console.log(`ID Prova: ${leitura.id_prova}`);
            console.log(`ID Participante: ${leitura.id_participante}`);
            console.log(`Leitura: ${leitura.leitura}`);
        } catch (error) {
            console.log(`ERRO: ${error.message}`);
        }
    }
}

testDiferentesImagens();