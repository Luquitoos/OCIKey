# API Documentation - OCIKey Backend

## 📚 Documentação

- **[README.md](README.md)** - Visão geral e guia de início rápido
- **[API_DOCUMENTATION.md](API_DOCUMENTATION.md)** - Documentação completa da API
- **[TECHNICAL_DOCUMENTATION.md](TECHNICAL_DOCUMENTATION.md)** - Documentação técnica detalhada
- **[DEPLOYMENT_GUIDE.md](DEPLOYMENT_GUIDE.md)** - Guia de deployment e produção

---

## Visão Geral da API

A API do OCIKey Backend fornece endpoints para gerenciamento de gabaritos, participantes, provas e leituras automatizadas. Todas as rotas (exceto autenticação) requerem autenticação JWT.

Para informações sobre instalação e configuração, consulte [README.md](README.md).  
Para detalhes técnicos de implementação, consulte [TECHNICAL_DOCUMENTATION.md](TECHNICAL_DOCUMENTATION.md).  
Para deployment em produção, consulte [DEPLOYMENT_GUIDE.md](DEPLOYMENT_GUIDE.md).

**Base URL**: `http://localhost:5000/api`

**Autenticação**: Bearer Token (JWT)

**Content-Type**: `application/json` (exceto uploads)

## Índice

- [Sistema de Roles e Permissões](#sistema-de-roles-e-permissões)
- [Autenticação](#autenticação)
- [Leitura de Gabaritos](#leitura-de-gabaritos)
- [Participantes](#participantes)
- [Provas](#provas)
- [Leituras](#leituras)
- [Dashboard](#dashboard)
- [Códigos de Erro](#códigos-de-erro)
- [Exemplos de Uso](#exemplos-de-uso)

## Sistema de Roles e Permissões

O OCIKey implementa um sistema de controle de acesso baseado em roles (RBAC) com três tipos de usuário:

### 🎓 ALUNO (role: "aluno")
**Permissões**:
- ✅ Fazer leituras de gabaritos (salvas automaticamente)
- ✅ Visualizar suas próprias leituras e estatísticas
- ✅ Editar seu próprio perfil
- ✅ Fazer leitura de provas de outros participantes (nome do detentor será mostrado)
- ✅ Ver dashboard personalizado com seu desempenho
- ❌ Não pode editar/deletar provas
- �� Não pode gerenciar outros participantes

### 👨‍🏫 PROFESSOR (role: "professor")
**Permissões**:
- ✅ Visualizar participantes de sua escola
- ✅ Fazer leituras temporárias (não são salvas)
- ✅ Ver relatórios de sua escola
- ✅ Editar nomes dos participantes de sua escola
- ✅ Importar participantes via CSV
- ✅ Visualizar gabaritos das provas
- ❌ Não pode editar/deletar provas
- ❌ Não pode acessar dados de outras escolas

### 👑 ADMIN (role: "admin")
**Permissões**:
- ✅ Acesso total a todos os recursos
- ✅ Gerenciar todos os participantes
- ✅ Criar, editar e deletar provas
- ✅ Ver todas as leituras do sistema
- ✅ Fazer leituras que são salvas
- ✅ Relatórios gerais do sistema
- ✅ Importar dados de qualquer escola

### Headers de Autenticação

Todos os endpoints (exceto `/auth/login` e `/auth/register`) requerem o header:

```
Authorization: Bearer <jwt_token>
```

O token JWT contém informações sobre o role do usuário e é validado em cada requisição.

## Autenticação

### POST /api/auth/register

Registra um novo usuário no sistema com role específico.

**Headers:**
```
Content-Type: application/json
```

**Body para ALUNO:**
```json
{
  "nome": "João Silva",
  "email": "joao@email.com",
  "password": "senha123",
  "role": "aluno",
  "escola": "Escola Nova",
  "turma": "3º Ano A"
}
```

**Body para PROFESSOR:**
```json
{
  "nome": "Maria Santos",
  "email": "maria@email.com",
  "password": "senha123",
  "role": "professor",
  "escola": "Escola Nova",
  "disciplina": "Matemática"
}
```

**Body para ADMIN:**
```json
{
  "nome": "Carlos Admin",
  "email": "admin@email.com",
  "password": "senha123",
  "role": "admin",
  "organizacao": "Secretaria de Educação",
  "cargo": "Coordenador"
}
```

**Response 201:**
```json
{
  "success": true,
  "message": "Usuário registrado com sucesso",
  "data": {
    "user": {
      "id": 1,
      "nome": "João Silva",
      "email": "joao@email.com",
      "role": "aluno",
      "escola": "Escola Nova",
      "created_at": "2024-01-15T10:30:00.000Z"
    },
    "token": "eyJhbGciOiJIUzI1NiIsInR5cCI6IkpXVCJ9..."
  }
}
```

### POST /api/auth/login

Autentica um usuário existente.

**Body:**
```json
{
  "email": "joao@email.com",
  "password": "senha123"
}
```

**Response 200:**
```json
{
  "success": true,
  "message": "Login realizado com sucesso",
  "data": {
    "user": {
      "id": 1,
      "username": "joao123",
      "email": "joao@email.com",
      "role": "user"
    },
    "token": "eyJhbGciOiJIUzI1NiIsInR5cCI6IkpXVCJ9..."
  }
}
```

### POST /api/auth/logout

Invalida o token atual (adiciona à blacklist).

**Headers:**
```
Authorization: Bearer <token>
```

**Response 200:**
```json
{
  "success": true,
  "message": "Logout realizado com sucesso"
}
```

## Leitura de Gabaritos

### POST /api/leitura/processar

Processa uma imagem de gabarito a partir do caminho no servidor.

**Headers:**
```
Authorization: Bearer <token>
Content-Type: application/json
```

**Body:**
```json
{
  "caminhoImagem": "/path/to/image.png"
}
```

**Response 200:**
```json
{
  "leitura": {
    "id": 1,
    "arquivo": "/path/to/image.png",
    "erro": 0,
    "id_prova": 4,
    "id_participante": 1,
    "gabarito": "X-Xdebabcbb-baca-cbc",
    "acertos": 1,
    "nota": 0.50,
    "created_at": "2024-01-15T10:30:00.000Z"
  },
  "warning": null // ou mensagem de erro se erro > 0
}
```

### POST /api/leitura/multiplas

Processa múltiplas imagens de gabarito.

**Body:**
```json
{
  "caminhosImagens": [
    "/path/to/image1.png",
    "/path/to/image2.png",
    "/path/to/image3.png"
  ]
}
```

**Response 200:**
```json
{
  "total": 3,
  "processados": 3,
  "resultados": [
    {
      "arquivo": "/path/to/image1.png",
      "leitura": {
        "id": 1,
        "arquivo": "/path/to/image1.png",
        "erro": 0,
        "id_prova": 4,
        "id_participante": 1,
        "gabarito": "X-Xdebabcbb-baca-cbc",
        "acertos": 1,
        "nota": 0.50,
        "created_at": "2024-01-15T10:30:00.000Z"
      }
    },
    // ... outros resultados
  ]
}
```

### POST /api/leitura/upload

Faz upload e processa uma única imagem. O comportamento varia conforme o role do usuário.

**Headers:**
```
Authorization: Bearer <token>
Content-Type: multipart/form-data
```

**Body (Form Data):**
```
imagem: <file> (PNG, JPG, JPEG - max 10MB)
```

**Response 200 para ALUNO/ADMIN (leitura salva - SUCESSO):**
```json
{
  "success": true,
  "data": {
    "id": 1,
    "arquivo": "uploads/1642248600000-123456789.png",
    "erro": 0,
    "id_prova": 4,
    "id_participante": 1,
    "gabarito": "abcdebabcbb-baca-cbc",
    "acertos": 15,
    "nota": 7.50,
    "created_at": "2024-01-15T10:30:00.000Z"
  },
  "message": "Leitura realizada com sucesso",
  "status": "success",
  "arquivo_original": "gabarito_aluno1.png",
  "arquivo_salvo": "1642248600000-123456789.png"
}
```

**Response 200 para ALUNO/ADMIN (leitura com ERRO AZTEC):**
```json
{
  "success": true,
  "data": {
    "id": 2,
    "arquivo": "uploads/1642248600001-123456790.png",
    "erro": 1,
    "id_prova": -1,
    "id_participante": -1,
    "gabarito": "X-Xdebabcbb-baca-cbc",
    "acertos": 0,
    "nota": 0.00,
    "created_at": "2024-01-15T10:35:00.000Z"
  },
  "message": "Leitura processada com avisos",
  "warning": "Erro de leitura do código Aztec",
  "status": "warning",
  "details": "O código Aztec não pôde ser lido corretamente. Verifique a qualidade da imagem.",
  "arquivo_original": "gabarito_problema.png",
  "arquivo_salvo": "1642248600001-123456790.png"
}
```

**Response 200 para ALUNO/ADMIN (leitura com ERRO DE ÁREA):**
```json
{
  "success": true,
  "data": {
    "id": 3,
    "arquivo": "uploads/1642248600002-123456791.png",
    "erro": 2,
    "id_prova": 4,
    "id_participante": 1,
    "gabarito": "a?cdebab?bb-ba?a-cbc",
    "acertos": 12,
    "nota": 6.00,
    "created_at": "2024-01-15T10:40:00.000Z"
  },
  "message": "Leitura processada com avisos",
  "warning": "Imprecisão na identificação da área de leitura",
  "status": "warning",
  "details": "A área de leitura foi identificada com imprecisão. Alguns dados podem estar incorretos.",
  "arquivo_original": "gabarito_impreciso.png",
  "arquivo_salvo": "1642248600002-123456791.png"
}
```

**Response 200 para ALUNO/ADMIN (leitura com ERRO FATAL):**
```json
{
  "success": true,
  "data": {
    "id": 4,
    "arquivo": "uploads/1642248600003-123456792.png",
    "erro": 3,
    "id_prova": -1,
    "id_participante": -1,
    "gabarito": "",
    "acertos": 0,
    "nota": 0.00,
    "created_at": "2024-01-15T10:45:00.000Z"
  },
  "message": "Leitura processada com erros",
  "error": "Erro fatal durante a leitura",
  "status": "error",
  "details": "Falha crítica no processamento. Tente novamente com uma imagem de melhor qualidade.",
  "arquivo_original": "gabarito_corrompido.png",
  "arquivo_salvo": "1642248600003-123456792.png"
}
```

**Response 200 para PROFESSOR (leitura temporária):**
```json
{
  "success": true,
  "data": {
    "arquivo": "uploads/1642248600000-123456789.png",
    "erro": 0,
    "id_prova": 4,
    "id_participante": 1,
    "gabarito": "X-Xdebabcbb-baca-cbc",
    "acertos": 1,
    "nota": 0.50,
    "participante_nome": "Ana Silva"
  },
  "message": "Leitura processada (visualização temporária)",
  "temporary": true,
  "arquivo_original": "gabarito_aluno1.png"
}
```

### POST /api/leitura/upload-multiplas

Faz upload e processa múltiplas imagens.

**Headers:**
```
Authorization: Bearer <token>
Content-Type: multipart/form-data
```

**Body (Form Data):**
```
imagens: <file[]> (max 20 arquivos, 10MB cada)
```

**Response 200:**
```json
{
  "total": 2,
  "processados": 2,
  "resultados": [
    {
      "arquivo_original": "gabarito1.png",
      "arquivo_salvo": "1642248600000-123456789.png",
      "leitura": {
        "id": 1,
        "arquivo": "uploads/1642248600000-123456789.png",
        "erro": 0,
        "id_prova": 4,
        "id_participante": 1,
        "gabarito": "X-Xdebabcbb-baca-cbc",
        "acertos": 1,
        "nota": 0.50,
        "created_at": "2024-01-15T10:30:00.000Z"
      }
    },
    // ... outros resultados
  ]
}
```

## Participantes

### POST /api/participantes/import

Importa participantes via dados CSV.

**Headers:**
```
Authorization: Bearer <token>
Content-Type: application/json
```

**Body:**
```json
{
  "csvData": "id,nome,escola\n1,Ana Clara Silva,Escola Nova\n2,Bruno Santos,Colégio Central"
}
```

**Formato CSV esperado:**
```csv
id,nome,escola
1,Ana Clara Silva,Escola Nova
2,Bruno Santos,Colégio Central
3,Carlos Eduardo,Instituto Técnico
```

**Response 200:**
```json
{
  "success": true,
  "message": "Importação concluída",
  "resultado": {
    "importados": 2,
    "atualizados": 1,
    "total": 3,
    "erros": []
  }
}
```

### GET /api/participantes

Lista todos os participantes com paginação.

**Headers:**
```
Authorization: Bearer <token>
```

**Query Parameters:**
- `page` (opcional): Número da página (default: 1)
- `limit` (opcional): Itens por página (default: 50, max: 100)
- `search` (opcional): Busca por nome ou escola

**Response 200:**
```json
{
  "success": true,
  "data": {
    "participantes": [
      {
        "id": 1,
        "nome": "Ana Clara Silva",
        "escola": "Escola Nova",
        "created_at": "2024-01-15T10:30:00.000Z"
      },
      // ... outros participantes
    ],
    "pagination": {
      "page": 1,
      "limit": 50,
      "total": 150,
      "pages": 3
    }
  }
}
```

### GET /api/participantes/escolas

Lista todas as escolas únicas dos participantes.

**Headers:**
```
Authorization: Bearer <token>
```

**Response 200:**
```json
{
  "success": true,
  "data": {
    "escolas": [
      "Escola Nova",
      "Colégio Central",
      "Instituto Técnico"
    ]
  }
}
```

### GET /api/participantes/meu-perfil

Obtém o perfil do participante logado (para usuários com role 'user').

**Headers:**
```
Authorization: Bearer <token>
```

**Response 200:**
```json
{
  "success": true,
  "data": {
    "participante": {
      "id": 1,
      "nome": "Ana Clara Silva",
      "escola": "Escola Nova",
      "created_at": "2024-01-15T10:30:00.000Z"
    }
  }
}
```

### GET /api/participantes/minhas-estatisticas

Obtém estatísticas do participante logado.

**Headers:**
```
Authorization: Bearer <token>
```

**Query Parameters:**
- `id_prova` (opcional): Filtrar por ID da prova específica

**Response 200:**
```json
{
  "success": true,
  "data": {
    "estatisticas": {
      "total_leituras": 15,
      "media_nota": 7.5,
      "melhor_nota": 9.5,
      "pior_nota": 4.0,
      "total_acertos": 142,
      "media_acertos": 9.47,
      "provas_realizadas": 3
    }
  }
}
```

### POST /api/participantes

Cria um novo participante.

**Body:**
```json
{
  "nome": "João Pedro Santos",
  "escola": "Escola Nova"
}
```

**Response 201:**
```json
{
  "success": true,
  "message": "Participante criado com sucesso",
  "data": {
    "participante": {
      "id": 11,
      "nome": "João Pedro Santos",
      "escola": "Escola Nova",
      "created_at": "2024-01-15T10:30:00.000Z"
    }
  }
}
```

### PUT /api/participantes/:id

Atualiza um participante existente.

**Parameters:**
- `id`: ID do participante

**Body:**
```json
{
  "nome": "João Pedro Santos Silva",
  "escola": "Escola Nova Atualizada"
}
```

**Response 200:**
```json
{
  "success": true,
  "message": "Participante atualizado com sucesso",
  "data": {
    "participante": {
      "id": 11,
      "nome": "João Pedro Santos Silva",
      "escola": "Escola Nova Atualizada",
      "created_at": "2024-01-15T10:30:00.000Z"
    }
  }
}
```

### DELETE /api/participantes/:id

Remove um participante.

**Parameters:**
- `id`: ID do participante

**Response 200:**
```json
{
  "success": true,
  "message": "Participante removido com sucesso"
}
```

## Provas

### POST /api/provas/import

Importa provas via dados CSV.

**Headers:**
```
Authorization: Bearer <token>
Content-Type: application/json
```

**Body:**
```json
{
  "csvData": "prova,gabarito\n1,eaedddccaedacbbcbacb\n2,abcdeabcdeabcdeabcde",
  "pesoQuestao": 0.50
}
```

**Formato CSV esperado:**
```csv
prova,gabarito
1,eaedddccaedacbbcbacb
2,abcdeabcdeabcdeabcde
3,bcdaebcdaebcdaebcdae
```

**Response 200:**
```json
{
  "success": true,
  "message": "Importação concluída",
  "resultado": {
    "importadas": 2,
    "atualizadas": 1,
    "total": 3,
    "erros": []
  }
}
```

### GET /api/provas

Lista todas as provas.

**Headers:**
```
Authorization: Bearer <token>
```

**Response 200:**
```json
{
  "success": true,
  "data": {
    "provas": [
      {
        "id": 1,
        "gabarito": "eaedddccaedacbbcbacb",
        "peso_questao": 0.50,
        "created_at": "2024-01-15T10:30:00.000Z"
      },
      // ... outras provas
    ]
  }
}
```

### POST /api/provas

Cria uma nova prova.

**Body:**
```json
{
  "gabarito": "eaedddccaedacbbcbacb",
  "peso_questao": 0.50 // opcional, default: 0.50
}
```

**Response 201:**
```json
{
  "success": true,
  "message": "Prova criada com sucesso",
  "data": {
    "prova": {
      "id": 7,
      "gabarito": "eaedddccaedacbbcbacb",
      "peso_questao": 0.50,
      "created_at": "2024-01-15T10:30:00.000Z"
    }
  }
}
```

### PUT /api/provas/:id

Atualiza uma prova existente.

**Parameters:**
- `id`: ID da prova

**Body:**
```json
{
  "gabarito": "eaedddccaedacbbcbacc",
  "peso_questao": 0.75
}
```

**Response 200:**
```json
{
  "success": true,
  "message": "Prova atualizada com sucesso",
  "data": {
    "prova": {
      "id": 7,
      "gabarito": "eaedddccaedacbbcbacc",
      "peso_questao": 0.75,
      "created_at": "2024-01-15T10:30:00.000Z"
    }
  }
}
```

### DELETE /api/provas/:id

Remove uma prova.

**Parameters:**
- `id`: ID da prova

**Response 200:**
```json
{
  "success": true,
  "message": "Prova removida com sucesso"
}
```

## Leituras

### GET /api/leituras

Lista todas as leituras com paginação e filtros.

**Headers:**
```
Authorization: Bearer <token>
```

**Query Parameters:**
- `page` (opcional): Número da página (default: 1)
- `limit` (opcional): Itens por página (default: 50, max: 100)
- `id_prova` (opcional): Filtrar por ID da prova
- `id_participante` (opcional): Filtrar por ID do participante
- `erro` (opcional): Filtrar por código de erro (0, 1, 2, 3)

**Response 200:**
```json
{
  "success": true,
  "data": {
    "leituras": [
      {
        "id": 1,
        "arquivo": "uploads/1642248600000-123456789.png",
        "erro": 0,
        "id_prova": 4,
        "id_participante": 1,
        "gabarito": "X-Xdebabcbb-baca-cbc",
        "acertos": 1,
        "nota": 0.50,
        "created_at": "2024-01-15T10:30:00.000Z",
        "participante": {
          "nome": "Ana Clara Silva",
          "escola": "Escola Nova"
        },
        "prova": {
          "gabarito": "baadcaeeacabcdbccade",
          "peso_questao": 0.50
        }
      },
      // ... outras leituras
    ],
    "pagination": {
      "page": 1,
      "limit": 50,
      "total": 200,
      "pages": 4
    }
  }
}
```

### GET /api/leituras/estatisticas

Obtém estatísticas gerais das leituras.

**Headers:**
```
Authorization: Bearer <token>
```

**Response 200:**
```json
{
  "success": true,
  "data": {
    "estatisticas": {
      "total_leituras": 1250,
      "leituras_sem_erro": 1100,
      "leituras_com_erro": 150,
      "taxa_sucesso": 88.0,
      "media_nota_geral": 7.2,
      "media_acertos_geral": 14.4,
      "distribuicao_erros": {
        "0": 1100,
        "1": 75,
        "2": 50,
        "3": 25
      },
      "por_prova": [
        {
          "id_prova": 1,
          "total_leituras": 400,
          "media_nota": 7.5,
          "media_acertos": 15.0
        }
      ],
      "por_escola": [
        {
          "escola": "Escola Nova",
          "total_leituras": 300,
          "media_nota": 8.1,
          "media_acertos": 16.2
        }
      ]
    }
  }
}
```

### PUT /api/leituras/:id

Edita uma leitura existente (permite correção manual).

**Parameters:**
- `id`: ID da leitura

**Body:**
```json
{
  "id_prova": 4,
  "id_participante": 1,
  "gabarito": "baXdcaeeacabcdbccade" // gabarito corrigido
}
```

**Response 200:**
```json
{
  "success": true,
  "message": "Leitura atualizada com sucesso",
  "data": {
    "leitura": {
      "id": 1,
      "arquivo": "uploads/1642248600000-123456789.png",
      "erro": 0,
      "id_prova": 4,
      "id_participante": 1,
      "gabarito": "baXdcaeeacabcdbccade",
      "acertos": 18,
      "nota": 9.00,
      "created_at": "2024-01-15T10:30:00.000Z"
    }
  }
}
```

### DELETE /api/leituras/:id

Remove uma leitura.

**Parameters:**
- `id`: ID da leitura

**Response 200:**
```json
{
  "success": true,
  "message": "Leitura removida com sucesso"
}
```

## Dashboard

### GET /api/dashboard

Obtém dados do dashboard personalizado baseado no role do usuário.

**Headers:**
```
Authorization: Bearer <token>
```

**Response 200 para ALUNO:**
```json
{
  "success": true,
  "data": {
    "totalLeituras": 15,
    "minhaNota": "7.50",
    "mediaGeral": "6.80",
    "acimaDaMedia": true,
    "ultimasLeituras": [
      {
        "id": 1,
        "nota": 8.5,
        "acertos": 17,
        "created_at": "2024-01-15T10:30:00.000Z"
      }
    ],
    "graficoDesempenho": [7.5, 8.0, 6.5, 9.0, 8.5]
  },
  "role": "aluno"
}
```

**Response 200 para PROFESSOR:**
```json
{
  "success": true,
  "data": {
    "totalParticipantes": 45,
    "totalLeituras": 180,
    "mediaEscola": "7.20",
    "ultimasLeituras": [
      {
        "id": 1,
        "participante": "Ana Silva",
        "nota": 8.5,
        "acertos": 17,
        "created_at": "2024-01-15T10:30:00.000Z"
      }
    ],
    "participantesAtivos": 42
  },
  "role": "professor"
}
```

**Response 200 para ADMIN:**
```json
{
  "success": true,
  "data": {
    "totalParticipantes": 1250,
    "totalLeituras": 5600,
    "totalProvas": 12,
    "totalEscolas": 25,
    "mediaGeral": "7.10"
  },
  "role": "admin"
}
```

### GET /api/dashboard/comparacao

Obtém dados de comparação de desempenho (apenas para ALUNO).

**Headers:**
```
Authorization: Bearer <token>
```

**Response 200:**
```json
{
  "success": true,
  "data": {
    "meuDesempenho": {
      "nota": 7.5,
      "posicao": 15,
      "percentil": 85
    },
    "estatisticas": {
      "mediaGeral": 6.8,
      "mediana": 7.0,
      "melhorNota": 9.5,
      "piorNota": 2.0
    },
    "distribuicao": {
      "0-2": 5,
      "2-4": 12,
      "4-6": 25,
      "6-8": 35,
      "8-10": 23
    }
  }
}
```

## Endpoints Auxiliares

### GET /health

Verifica o status do servidor (não requer autenticação).

**Response 200:**
```json
{
  "success": true,
  "message": "OCIKey Backend está funcionando",
  "data": {
    "status": "OK",
    "timestamp": "2024-01-15T10:30:00.000Z",
    "services": {
      "database": "connected",
      "addon": "loaded"
    },
    "uptime": 3600.123,
    "memory": {
      "rss": 45678592,
      "heapTotal": 20971520,
      "heapUsed": 15728640,
      "external": 1234567
    }
  }
}
```

## Códigos de Erro

### Códigos HTTP

- `200` - OK
- `201` - Created
- `400` - Bad Request (dados inválidos)
- `401` - Unauthorized (token ausente/inválido)
- `403` - Forbidden (sem permissão)
- `404` - Not Found (recurso não encontrado)
- `409` - Conflict (recurso já existe)
- `413` - Payload Too Large (arquivo muito grande)
- `429` - Too Many Requests (rate limit excedido)
- `500` - Internal Server Error

### Códigos de Erro da Biblioteca C++

#### Código 0 - Sucesso ✅
- **Descrição**: Leitura bem-sucedida
- **Comportamento**: Dados completos disponíveis
- **Interface**: Alerta verde com mensagem de sucesso
- **Ação**: Nenhuma ação necessária

#### Código 1 - Erro Aztec ⚠️
- **Descrição**: Erro de leitura do código Aztec
- **Comportamento**: ID da prova e participante podem ser -1
- **Interface**: Alerta amarelo com detalhes do erro
- **Ação**: Verificar qualidade da imagem, tentar novamente

#### Código 2 - Erro de Área 🔍
- **Descrição**: Imprecisão na identificação da área de leitura
- **Comportamento**: Alguns dados podem estar incorretos (marcados com ?)
- **Interface**: Alerta laranja com aviso de imprecisão
- **Ação**: Revisar respostas manualmente, corrigir se necessário

#### Código 3 - Erro Fatal ❌
- **Descrição**: Erro fatal durante a leitura
- **Comportamento**: Falha completa, dados não confiáveis
- **Interface**: Alerta vermelho com erro crítico
- **Ação**: Usar imagem de melhor qualidade, verificar formato

### Sistema de Feedback Visual

O sistema exibe diferentes tipos de feedback baseado no código de erro:

```javascript
// Exemplo de como o frontend trata os códigos de erro
const getStatusDisplay = (erro) => {
  switch(erro) {
    case 0:
      return {
        type: 'success',
        icon: '✅',
        message: 'Leitura realizada com sucesso',
        color: 'green'
      };
    case 1:
      return {
        type: 'warning',
        icon: '⚠️',
        message: 'Erro de leitura do código Aztec',
        color: 'yellow',
        action: 'Verificar qualidade da imagem'
      };
    case 2:
      return {
        type: 'warning',
        icon: '🔍',
        message: 'Imprecisão na identificação da área',
        color: 'orange',
        action: 'Revisar respostas manualmente'
      };
    case 3:
      return {
        type: 'error',
        icon: '❌',
        message: 'Erro fatal durante a leitura',
        color: 'red',
        action: 'Tentar com imagem de melhor qualidade'
      };
  }
};
```

### Formato de Resposta de Erro

```json
{
  "success": false,
  "error": "Mensagem de erro",
  "details": ["Detalhes específicos do erro"] // apenas em desenvolvimento
}
```

## Rate Limiting

A API implementa rate limiting para proteger contra abuso:

- **Geral**: 100 requests por 15 minutos
- **Upload**: 10 uploads por 15 minutos
- **Autenticação**: 5 tentativas por 15 minutos

Quando o limite é excedido, a API retorna status `429` com header `Retry-After`.

## Exemplos de Uso

### Exemplo 1: Fluxo Completo de Leitura

```javascript
// 1. Login
const loginResponse = await fetch('/api/auth/login', {
  method: 'POST',
  headers: { 'Content-Type': 'application/json' },
  body: JSON.stringify({
    email: 'admin@ocikey.com',
    password: 'senha123'
  })
});
const { data: { token } } = await loginResponse.json();

// 2. Upload e processamento de imagem
const formData = new FormData();
formData.append('imagem', imageFile);

const uploadResponse = await fetch('/api/leitura/upload', {
  method: 'POST',
  headers: { 'Authorization': `Bearer ${token}` },
  body: formData
});
const leituraResult = await uploadResponse.json();

// 3. Editar leitura se necessário
if (leituraResult.leitura.erro > 0) {
  const editResponse = await fetch(`/api/leituras/${leituraResult.leitura.id}`, {
    method: 'PUT',
    headers: {
      'Authorization': `Bearer ${token}`,
      'Content-Type': 'application/json'
    },
    body: JSON.stringify({
      gabarito: 'abcdeabcdeabcdeabcde' // gabarito corrigido
    })
  });
}
```

### Exemplo 2: Processamento em Lote

```javascript
// Processar múltiplas imagens
const batchResponse = await fetch('/api/leitura/multiplas', {
  method: 'POST',
  headers: {
    'Authorization': `Bearer ${token}`,
    'Content-Type': 'application/json'
  },
  body: JSON.stringify({
    caminhosImagens: [
      'img/0001.png',
      'img/0002.png',
      'img/0003.png'
    ]
  })
});

const batchResult = await batchResponse.json();
console.log(`Processadas ${batchResult.processados} de ${batchResult.total} imagens`);
```

### Exemplo 3: Relatório de Resultados

```javascript
// Buscar leituras de uma prova específica
const relatorioResponse = await fetch('/api/leituras?id_prova=4&limit=100', {
  headers: { 'Authorization': `Bearer ${token}` }
});

const { data: { leituras } } = await relatorioResponse.json();

// Calcular estatísticas
const stats = leituras.reduce((acc, leitura) => {
  acc.total++;
  acc.acertos += leitura.acertos;
  acc.nota += leitura.nota;
  if (leitura.erro > 0) acc.erros++;
  return acc;
}, { total: 0, acertos: 0, nota: 0, erros: 0 });

console.log({
  totalLeituras: stats.total,
  mediaAcertos: stats.acertos / stats.total,
  mediaNota: stats.nota / stats.total,
  taxaErro: (stats.erros / stats.total) * 100
});
```

### Exemplo 4: Fluxo por Role

#### Fluxo do ALUNO:
```javascript
// 1. Login como aluno
const loginResponse = await fetch('/api/auth/login', {
  method: 'POST',
  headers: { 'Content-Type': 'application/json' },
  body: JSON.stringify({
    email: 'aluno@escola.com',
    password: 'senha123'
  })
});
const { data: { token } } = await loginResponse.json();

// 2. Ver dashboard personalizado
const dashboardResponse = await fetch('/api/dashboard', {
  headers: { 'Authorization': `Bearer ${token}` }
});
const dashboard = await dashboardResponse.json();
console.log(`Minha nota: ${dashboard.data.minhaNota}, Média geral: ${dashboard.data.mediaGeral}`);

// 3. Fazer leitura (será salva automaticamente)
const formData = new FormData();
formData.append('imagem', imageFile);
const leituraResponse = await fetch('/api/leitura/upload', {
  method: 'POST',
  headers: { 'Authorization': `Bearer ${token}` },
  body: formData
});
const resultado = await leituraResponse.json();
console.log(`Leitura salva com ID: ${resultado.data.id}`);
```

#### Fluxo do PROFESSOR:
```javascript
// 1. Login como professor
const loginResponse = await fetch('/api/auth/login', {
  method: 'POST',
  headers: { 'Content-Type': 'application/json' },
  body: JSON.stringify({
    email: 'professor@escola.com',
    password: 'senha123'
  })
});
const { data: { token } } = await loginResponse.json();

// 2. Ver participantes da escola
const participantesResponse = await fetch('/api/participantes', {
  headers: { 'Authorization': `Bearer ${token}` }
});
const participantes = await participantesResponse.json();
console.log(`Participantes da minha escola: ${participantes.data.participantes.length}`);

// 3. Fazer leitura temporária (não será salva)
const formData = new FormData();
formData.append('imagem', imageFile);
const leituraResponse = await fetch('/api/leitura/upload', {
  method: 'POST',
  headers: { 'Authorization': `Bearer ${token}` },
  body: formData
});
const resultado = await leituraResponse.json();
console.log(`Leitura temporária - Participante: ${resultado.data.participante_nome}`);
```

#### Fluxo do ADMIN:
```javascript
// 1. Login como admin
const loginResponse = await fetch('/api/auth/login', {
  method: 'POST',
  headers: { 'Content-Type': 'application/json' },
  body: JSON.stringify({
    email: 'admin@sistema.com',
    password: 'senha123'
  })
});
const { data: { token } } = await loginResponse.json();

// 2. Criar nova prova
const novaProva = await fetch('/api/provas', {
  method: 'POST',
  headers: {
    'Authorization': `Bearer ${token}`,
    'Content-Type': 'application/json'
  },
  body: JSON.stringify({
    gabarito: 'abcdeabcdeabcdeabcde',
    peso_questao: 0.5
  })
});

// 3. Ver estatísticas gerais
const dashboardResponse = await fetch('/api/dashboard', {
  headers: { 'Authorization': `Bearer ${token}` }
});
const stats = await dashboardResponse.json();
console.log(`Total de participantes: ${stats.data.totalParticipantes}`);
console.log(`Total de escolas: ${stats.data.totalEscolas}`);
```

### Exemplo 5: Tratamento de Erros de Leitura

```javascript
// Função para processar imagem e tratar diferentes tipos de erro
async function processarImagemComTratamento(imageFile, token) {
  try {
    const formData = new FormData();
    formData.append('imagem', imageFile);
    
    const response = await fetch('/api/leitura/upload', {
      method: 'POST',
      headers: { 'Authorization': `Bearer ${token}` },
      body: formData
    });
    
    const resultado = await response.json();
    
    // Tratar diferentes códigos de erro
    switch(resultado.data.erro) {
      case 0:
        console.log('✅ Sucesso:', resultado.message);
        console.log(`Nota: ${resultado.data.nota}, Acertos: ${resultado.data.acertos}`);
        return { success: true, data: resultado.data };
        
      case 1:
        console.warn('⚠️ Erro Aztec:', resultado.warning);
        console.log('Sugestão:', resultado.details);
        // Pode tentar reprocessar ou solicitar nova imagem
        return { 
          success: false, 
          error: 'aztec', 
          message: resultado.warning,
          suggestion: 'Verificar qualidade da imagem'
        };
        
      case 2:
        console.warn('🔍 Erro de Área:', resultado.warning);
        console.log('Dados parciais disponíveis, revisar manualmente');
        // Dados parciais podem ser úteis, mas precisam revisão
        return { 
          success: 'partial', 
          data: resultado.data,
          warning: resultado.warning,
          suggestion: 'Revisar respostas manualmente'
        };
        
      case 3:
        console.error('❌ Erro Fatal:', resultado.error);
        console.log('Falha crítica, tentar nova imagem');
        return { 
          success: false, 
          error: 'fatal', 
          message: resultado.error,
          suggestion: 'Usar imagem de melhor qualidade'
        };
        
      default:
        console.error('Código de erro desconhecido:', resultado.data.erro);
        return { success: false, error: 'unknown' };
    }
    
  } catch (error) {
    console.error('Erro na requisição:', error);
    return { success: false, error: 'network', message: error.message };
  }
}

// Exemplo de uso com tratamento
async function exemploComTratamento() {
  const token = 'seu_jwt_token';
  const imageFile = document.getElementById('fileInput').files[0];
  
  const resultado = await processarImagemComTratamento(imageFile, token);
  
  if (resultado.success === true) {
    // Leitura bem-sucedida
    exibirResultadoSucesso(resultado.data);
  } else if (resultado.success === 'partial') {
    // Dados parciais, permitir edição manual
    exibirResultadoParcial(resultado.data, resultado.warning);
  } else {
    // Erro, mostrar mensagem e sugestão
    exibirErro(resultado.message, resultado.suggestion);
  }
}

// Funções auxiliares para exibir resultados
function exibirResultadoSucesso(data) {
  const statusDiv = document.getElementById('status');
  statusDiv.innerHTML = `
    <div class="alert alert-success">
      <h4>✅ Leitura realizada com sucesso!</h4>
      <p>Nota: ${data.nota} | Acertos: ${data.acertos}</p>
    </div>
  `;
}

function exibirResultadoParcial(data, warning) {
  const statusDiv = document.getElementById('status');
  statusDiv.innerHTML = `
    <div class="alert alert-warning">
      <h4>🔍 ${warning}</h4>
      <p>Dados parciais disponíveis. Revisar respostas manualmente.</p>
      <button onclick="abrirEdicaoManual('${data.id}')">Editar Leitura</button>
    </div>
  `;
}

function exibirErro(message, suggestion) {
  const statusDiv = document.getElementById('status');
  statusDiv.innerHTML = `
    <div class="alert alert-error">
      <h4>❌ ${message}</h4>
      <p>Sugestão: ${suggestion}</p>
      <button onclick="tentarNovamente()">Tentar Novamente</button>
    </div>
  `;
}
```

## Postman Collection

Para facilitar os testes, você pode importar esta collection no Postman:

```json
{
  "info": {
    "name": "OCIKey Backend API",
    "schema": "https://schema.getpostman.com/json/collection/v2.1.0/collection.json"
  },
  "auth": {
    "type": "bearer",
    "bearer": [
      {
        "key": "token",
        "value": "{{jwt_token}}",
        "type": "string"
      }
    ]
  },
  "variable": [
    {
      "key": "base_url",
      "value": "http://localhost:5000/api"
    },
    {
      "key": "jwt_token",
      "value": ""
    }
  ]
}
```

Esta documentação fornece uma referência completa para integração com a API do OCIKey Backend.
