# API Documentation - OCIKey Backend

## Visão Geral da API

A API do OCIKey Backend fornece endpoints para gerenciamento de gabaritos, participantes, provas e leituras automatizadas. Todas as rotas (exceto autenticação) requerem autenticação JWT.

**Base URL**: `http://localhost:5000/api`

**Autenticação**: Bearer Token (JWT)

**Content-Type**: `application/json` (exceto uploads)

## Índice

- [Autenticação](#autenticação)
- [Leitura de Gabaritos](#leitura-de-gabaritos)
- [Participantes](#participantes)
- [Provas](#provas)
- [Leituras](#leituras)
- [Códigos de Erro](#códigos-de-erro)
- [Exemplos de Uso](#exemplos-de-uso)

## Autenticação

### POST /api/auth/register

Registra um novo usuário no sistema.

**Headers:**
```
Content-Type: application/json
```

**Body:**
```json
{
  "username": "string (3-50 chars)",
  "email": "string (valid email)",
  "password": "string (min 6 chars)",
  "role": "string (admin|teacher|user)" // opcional, default: user
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
      "username": "joao123",
      "email": "joao@email.com",
      "role": "user",
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

Faz upload e processa uma única imagem.

**Headers:**
```
Authorization: Bearer <token>
Content-Type: multipart/form-data
```

**Body (Form Data):**
```
imagem: <file> (PNG, JPG, JPEG - max 10MB)
```

**Response 200:**
```json
{
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
  },
  "arquivo_original": "gabarito_aluno1.png",
  "arquivo_salvo": "1642248600000-123456789.png"
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

- `0` - Sem erro (leitura bem-sucedida)
- `1` - Erro de leitura do código Aztec
- `2` - Imprecisão ou erro na identificação da área de leitura
- `3` - Erro fatal durante a leitura

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
