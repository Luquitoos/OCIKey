// Dados esperados baseados no output fornecido
export const mockResults = {
    '0001.png': { erro: 0, id_prova: 4, id_participante: 1, leitura: 'X-Xdebabcbb-baca-cbc' },
    '0002.png': { erro: 2, id_prova: 6, id_participante: 3, leitura: 'a-bedabdbcc-eebacbca' },
    '0003.png': { erro: 0, id_prova: 4, id_participante: 4, leitura: 'decabbcaXea-abecacad' },
    '0004.png': { erro: 0, id_prova: 1, id_participante: 7, leitura: 'decacedaddcadeadaddd' },
    '0005.png': { erro: 1, id_prova: -1, id_participante: -1, leitura: 'X-dd-c--e-d-ccbcbacd' },
    '0006.png': { erro: 0, id_prova: 2, id_participante: 5, leitura: 'ddeeddcb-edaceeacbba' },
    '0007.png': { erro: 0, id_prova: 3, id_participante: 3, leitura: 'X-dX-ecaaccaacdecaca' },
    '0008.png': { erro: 2, id_prova: 1, id_participante: 1, leitura: 'acbeXdccadbdacdbbacb' },
    '0009.png': { erro: 2, id_prova: 5, id_participante: 2, leitura: 'aaaaaaaa--X------ced' },
    '0010.png': { erro: 0, id_prova: 5, id_participante: 5, leitura: 'XcXX--abeba-Xa-acaba' },
    '0011.png': { erro: 0, id_prova: 2, id_participante: 8, leitura: 'dcd-bdc-eeeaabbccddd' },
    '0012.png': { erro: 2, id_prova: 1, id_participante: 10, leitura: 'abaadcbb-bdccabcdcaa' },
    '0013.png': { erro: 0, id_prova: 3, id_participante: 6, leitura: 'edebbddedceeadcdddcb' },
    '0014.png': { erro: 2, id_prova: 1, id_participante: 4, leitura: 'Xcdbeecabca-cdedcbae' },
    '0015.png': { erro: 2, id_prova: 2, id_participante: 2, leitura: 'bbXbbXbXb-bbbbbbbbb-' },
    'base.png': { erro: 0, id_prova: 0, id_participante: 0, leitura: '--------------------' }
};

// Função para obter resultado mock baseado no nome do arquivo
export function getMockResult(filePath) {
    const fileName = filePath.split('/').pop() || filePath;
    return mockResults[fileName] || mockResults['0001.png']; // fallback
}