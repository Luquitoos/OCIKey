// Baseado no output esperado, vamos mapear todos os participantes
const outputEsperado = [
    { arquivo: '0001.png', erro: 0, id_prova: 4, id_participante: 1 },
    { arquivo: '0002.png', erro: 2, id_prova: 6, id_participante: 3 },
    { arquivo: '0003.png', erro: 0, id_prova: 4, id_participante: 4 },
    { arquivo: '0004.png', erro: 0, id_prova: 1, id_participante: 7 },
    { arquivo: '0005.png', erro: 1, id_prova: -1, id_participante: -1 },
    { arquivo: '0006.png', erro: 0, id_prova: 2, id_participante: 5 },
    { arquivo: '0007.png', erro: 0, id_prova: 3, id_participante: 3 },
    { arquivo: '0008.png', erro: 2, id_prova: 1, id_participante: 1 },
    { arquivo: '0009.png', erro: 2, id_prova: 5, id_participante: 2 },
    { arquivo: '0010.png', erro: 0, id_prova: 5, id_participante: 5 },
    { arquivo: '0011.png', erro: 0, id_prova: 2, id_participante: 8 },
    { arquivo: '0012.png', erro: 2, id_prova: 1, id_participante: 10 },
    { arquivo: '0013.png', erro: 0, id_prova: 3, id_participante: 6 },
    { arquivo: '0014.png', erro: 2, id_prova: 1, id_participante: 4 },
    { arquivo: '0015.png', erro: 2, id_prova: 2, id_participante: 2 },
    { arquivo: 'base.png', erro: 0, id_prova: 0, id_participante: 0 }
];

console.log('=== Participantes Esperados no Output ===');
const participantesEncontrados = new Set();

outputEsperado.forEach(item => {
    if (item.id_participante > 0) {
        participantesEncontrados.add(item.id_participante);
        console.log(`${item.arquivo} → Participante ID ${item.id_participante}`);
    }
});

console.log('\n=== Resumo dos Participantes ===');
console.log('Participantes encontrados:', Array.from(participantesEncontrados).sort((a,b) => a-b));
console.log('Total de participantes únicos:', participantesEncontrados.size);

const todosParticipantes = [1,2,3,4,5,6,7,8,9,10];
const naoEncontrados = todosParticipantes.filter(id => !participantesEncontrados.has(id));
console.log('Participantes NÃO encontrados:', naoEncontrados);