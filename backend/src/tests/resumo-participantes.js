// Participantes identificados nos testes realizados (usei pra comparar)
const participantesIdentificados = [
    { arquivo: '0001.png', id_participante: 1, nome: 'Ana Clara Silva', escola: 'Escola Nova' },
    { arquivo: '0002.png', id_participante: 3, nome: 'Maria Luiza Oliveira', escola: 'Escola Nova' },
    { arquivo: '0003.png', id_participante: 4, nome: 'Lucas Gabriel Almeida', escola: 'Instituto Horizonte' },
    { arquivo: '0004.png', id_participante: 7, nome: 'Camila Rodrigues Pereira', escola: 'Colégio Estrela' },
    { arquivo: '0005.png', id_participante: null, nome: null, escola: null }, // Erro de leitura
    { arquivo: '0006.png', id_participante: 5, nome: 'Beatriz Ferreira Costa', escola: 'Escola do Futuro' },
    { arquivo: '0007.png', id_participante: 3, nome: 'Maria Luiza Oliveira', escola: 'Escola Nova' },
    { arquivo: '0008.png', id_participante: 1, nome: 'Ana Clara Silva', escola: 'Escola Nova' },
    { arquivo: '0009.png', id_participante: 2, nome: 'João Pedro Santos', escola: 'Escola Nova' },
    { arquivo: '0010.png', id_participante: 5, nome: 'Beatriz Ferreira Costa', escola: 'Escola do Futuro' },
    { arquivo: '0011.png', id_participante: 8, nome: 'Felipe Henrique Martins', escola: 'Instituto Horizonte' },
    { arquivo: '0012.png', id_participante: 10, nome: 'Gustavo Henrique da Silva', escola: 'Escola do Futuro' },
    { arquivo: '0013.png', id_participante: 6, nome: 'Rafael Augusto Lima', escola: 'Colégio Estrela' }
];

console.log('=== Participantes Identificados nos Testes ===');
const idsEncontrados = new Set();

participantesIdentificados.forEach(item => {
    if (item.id_participante) {
        idsEncontrados.add(item.id_participante);
        console.log(`${item.arquivo} → ID ${item.id_participante}: ${item.nome} (${item.escola})`);
    } else {
        console.log(`${item.arquivo} → Não identificado (erro na leitura)`);
    }
});

console.log('\n=== Resumo Final ===');
console.log('Participantes únicos identificados:', Array.from(idsEncontrados).sort((a,b) => a-b));
console.log('Total identificados:', idsEncontrados.size, 'de 10 participantes');

const todosParticipantes = [1,2,3,4,5,6,7,8,9,10];
const naoIdentificados = todosParticipantes.filter(id => !idsEncontrados.has(id));
console.log('Participantes ainda não identificados:', naoIdentificados);

if (naoIdentificados.length > 0) {
    console.log('\nParticipantes não identificados:');
    naoIdentificados.forEach(id => {
        const participantes = {
            1: 'Ana Clara Silva - Escola Nova',
            2: 'João Pedro Santos - Escola Nova', 
            3: 'Maria Luiza Oliveira - Escola Nova',
            4: 'Lucas Gabriel Almeida - Instituto Horizonte',
            5: 'Beatriz Ferreira Costa - Escola do Futuro',
            6: 'Rafael Augusto Lima - Colégio Estrela',
            7: 'Camila Rodrigues Pereira - Colégio Estrela',
            8: 'Felipe Henrique Martins - Instituto Horizonte',
            9: 'Juliana dos Santos Almeida - Escola Nova',
            10: 'Gustavo Henrique da Silva - Escola do Futuro'
        };
        console.log(`  ID ${id}: ${participantes[id]}`);
    });
}