import { readImagePath } from './src/addon/index.js';
import path from 'path';
import fs from 'fs';

async function testDebugAddon() {
    console.log('=== Debug do Addon ===');
    
    // Verificar se as imagens existem e são diferentes
    const imagens = ['0001.png', '0002.png', '0003.png'];
    
    for (const img of imagens) {
        const imagePath = path.join(process.cwd(), 'img', img);
        
        // Verificar se o arquivo existe
        const exists = fs.existsSync(imagePath);
        console.log(`\n${img}:`);
        console.log(`  Arquivo existe: ${exists}`);
        
        if (exists) {
            // Verificar tamanho do arquivo
            const stats = fs.statSync(imagePath);
            console.log(`  Tamanho: ${stats.size} bytes`);
            
            // Testar a leitura
            try {
                console.log(`  Chamando readImagePath("${imagePath}")...`);
                const result = readImagePath(imagePath);
                console.log(`  Resultado:`, result);
            } catch (error) {
                console.log(`  Erro: ${error.message}`);
            }
        }
    }
    
    // Testar com caminho absoluto vs relativo
    console.log('\n=== Teste Caminho Absoluto vs Relativo ===');
    
    const imgPath = path.join(process.cwd(), 'img', '0001.png');
    const relativePath = 'img/0001.png';
    
    console.log('Caminho absoluto:', imgPath);
    console.log('Resultado absoluto:', readImagePath(imgPath));
    
    console.log('\nCaminho relativo:', relativePath);
    console.log('Resultado relativo:', readImagePath(relativePath));
}

testDebugAddon();