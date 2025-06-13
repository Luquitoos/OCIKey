import { readImagePath } from './src/addon/index.js';
import path from 'path';

async function testTodasImagens() {
    console.log('=== Teste de Todas as Imagens ===');
    console.log('arquivo\t\terro\tid_prova\tid_participante\tgabarito');
    console.log('--------\t----\t--------\t---------------\t--------');
    
    // Testar imagens 0001 a 0015
    for (let i = 1; i <= 15; i++) {
        const imgName = `${i.toString().padStart(4, '0')}.png`;
        const imagePath = path.join(process.cwd(), 'img', imgName);
        
        try {
            const leitura = readImagePath(imagePath);
            console.log(`${imgName}\t\t${leitura.erro}\t${leitura.id_prova}\t\t${leitura.id_participante}\t\t${leitura.leitura}`);
        } catch (error) {
            console.log(`${imgName}\t\tERRO: ${error.message}`);
        }
    }
    
    // Testar base.png
    try {
        const imagePath = path.join(process.cwd(), 'img', 'base.png');
        const leitura = readImagePath(imagePath);
        console.log(`base.png\t${leitura.erro}\t${leitura.id_prova}\t\t${leitura.id_participante}\t\t${leitura.leitura}`);
    } catch (error) {
        console.log(`base.png\tERRO: ${error.message}`);
    }
}

testTodasImagens();