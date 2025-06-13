#include <stdio.h>
#include <stdlib.h>
#include "biblioteca/leitor.h"

int main() {
    printf("=== Teste Direto da Biblioteca C ===\n");
    
    // Testar com diferentes imagens
    const char* imagens[] = {
        "img/0001.png",
        "img/0002.png", 
        "img/0003.png"
    };
    
    for (int i = 0; i < 3; i++) {
        printf("\nTestando %s:\n", imagens[i]);
        
        Reading result = read_image_path(imagens[i]);
        
        printf("  erro: %d\n", result.erro);
        printf("  id_prova: %d\n", result.id_prova);
        printf("  id_participante: %d\n", result.id_participante);
        printf("  leitura: %s\n", result.leitura ? result.leitura : "NULL");
    }
    
    // Testar com arquivo inexistente
    printf("\nTestando arquivo inexistente:\n");
    Reading result = read_image_path("arquivo_que_nao_existe.png");
    printf("  erro: %d\n", result.erro);
    printf("  id_prova: %d\n", result.id_prova);
    printf("  id_participante: %d\n", result.id_participante);
    printf("  leitura: %s\n", result.leitura ? result.leitura : "NULL");
    
    return 0;
}