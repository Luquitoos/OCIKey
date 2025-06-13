import { readImagePath } from './src/addon/index.js';
import path from 'path';

async function testImagemInexistente() {
    console.log('=== Teste com Imagem Inexistente ===');
    
    // Testar com uma imagem que não existe
    const imagemInexistente = path.join(process.cwd(), 'img', 'nao-existe.png');
    console.log('Testando imagem inexistente:', imagemInexistente);
    
    try {
        const leitura = readImagePath(imagemInexistente);
        console.log('Resultado:', leitura);
        console.log('CONCLUSÃO: A biblioteca retorna resultado mesmo para arquivo inexistente - provavelmente é MOCK');
    } catch (error) {
        console.log('Erro:', error.message);
        console.log('CONCLUSÃO: A biblioteca detecta arquivo inexistente - provavelmente está REALMENTE LENDO');
    }
    
    console.log('\n=== Teste com Arquivo de Texto ===');
    
    // Criar um arquivo de texto e tentar ler como imagem
    const arquivoTexto = path.join(process.cwd(), 'teste.txt');
    
    try {
        const leitura = readImagePath(arquivoTexto);
        console.log('Resultado com arquivo de texto:', leitura);
        console.log('CONCLUSÃO: A biblioteca retorna resultado para arquivo de texto - provavelmente é MOCK');
    } catch (error) {
        console.log('Erro com arquivo de texto:', error.message);
        console.log('CONCLUSÃO: A biblioteca detecta que não é imagem - provavelmente está REALMENTE LENDO');
    }
}

testImagemInexistente();