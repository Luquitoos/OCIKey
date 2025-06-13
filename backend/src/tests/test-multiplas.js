// Criar array com todos os caminhos das imagens
const imagens = [];
for (let i = 1; i <= 15; i++) {
    const num = i.toString().padStart(4, '0');
    imagens.push(`img/${num}.png`);
}
imagens.push('img/base.png');

console.log('Testando múltiplas imagens...');
console.log('Imagens a processar:', imagens);

// Fazer requisição para processar múltiplas imagens
const payload = {
    caminhosImagens: imagens
};

console.log('\nPayload:', JSON.stringify(payload, null, 2));