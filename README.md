# OCIKey Backend - Sistema de Controle de Gabaritos

## Visão Geral

O OCIKey Backend é uma aplicação Node.js desenvolvida para servir como interface de controle de gabaritos, permitindo a leitura automatizada de gabaritos de provas através de processamento de imagens e integração com banco de dados PostgreSQL.

## Índice

- [Requisitos do Projeto](#requisitos-do-projeto)
- [Arquitetura do Sistema](#arquitetura-do-sistema)
- [Tecnologias Utilizadas](#tecnologias-utilizadas)
- [Estrutura do Projeto](#estrutura-do-projeto)
- [Instalação e Configuração](#instalação-e-configuração)
- [Como Executar](#como-executar)
- [API Endpoints](#api-endpoints)
- [Integração com Biblioteca C++](#integração-com-biblioteca-c)
- [Banco de Dados](#banco-de-dados)
- [Docker](#docker)
- [Funcionalidades Implementadas](#funcionalidades-implementadas)
- [Testes](#testes)

## Requisitos do Projeto

### Requisitos Funcionais Cumpridos

✅ **Elaboração e organização de banco de dados** para armazenamento de:
- Participantes (alunos)
- Provas (gabaritos)
- Leituras de gabaritos com respectivas notas

✅ **Leitura de gabaritos** com:
- Input de imagens por parte do usuário
- Processamento das informações da leitura
- Edição da leitura antes do salvamento
- Leitura de múltiplas imagens simultaneamente

✅ **Operações CRUD** para:
- Leitura de tabelas do banco de dados
- Adição/Edição/Deleção de registros

✅ **Back-end eficiente e organizado**:
- Compatível com Linux
- Processamento de imagens no back-end
- Integração com biblioteca C++ fornecida
- Cálculo de notas baseado em ID da prova e pesos das questões
- Processamento de operações CRUD

✅ **Funcionalidades adicionais**:
- Sistema de autenticação JWT
- Rate limiting para segurança
- Middleware de validação
- Sistema de cleanup automático
- Health check endpoints

## Arquitetura do Sistema

O sistema segue uma arquitetura em camadas:

```
┌─────────────────┐
│   Frontend      │ (Next.js - não incluído neste backend)
│   (Next.js)     │
└─────────────────┘
         │
┌─────────────────┐
│   Backend API   │ (Express.js + Node.js)
│   (Express.js)  │
└─────────────────┘
         │
┌─────────────────┐
│  Addon C++      │ (Ponte Node.js ↔ Biblioteca C++)
│  (Node-API)     │
└────��────────────┘
         │
┌─────────────────┐
│ Biblioteca C++  │ (Processamento de imagens)
│ (leitor.h)      │
└─────────────────┘
         │
┌─────────────────┐
│   PostgreSQL    │ (Banco de dados)
│   Database      │
└─────────────────┘
```

## Tecnologias Utilizadas

### Backend
- **Node.js 18+** - Runtime JavaScript
- **Express.js** - Framework web
- **PostgreSQL** - Banco de dados relacional
- **JWT** - Autenticação
- **Multer** - Upload de arquivos
- **Joi** - Validação de dados
- **bcryptjs** - Hash de senhas

### Integração C++
- **Node-API (N-API)** - Interface Node.js ↔ C++
- **node-gyp** - Compilação de módulos nativos
- **bindings** - Carregamento de módulos nativos

### DevOps
- **Docker** - Containerização
- **Docker Compose** - Orquestração de containers

## Estrutura do Projeto

```
backend/
├── biblioteca/           # Biblioteca C++ fornecida
│   └── leitor.h         # Header da biblioteca de leitura
├── src/
│   ├── addon/           # Ponte Node.js ↔ C++
│   │   ├── addon.cpp    # Implementação do addon
│   │   └── index.js     # Interface JavaScript
│   ├── config/          # Configurações
│   │   ├── database-config.js
│   │   ├── setup-database.js
│   │   └── seed-database.js
│   ├── controllers/     # Controladores da API
│   │   ├── leituraController.js
│   │   ├── participantesController.js
│   │   └── provasController.js
│   ├── middleware/      # Middlewares
│   │   ├── auth.js
│   │   ├── upload.js
│   │   └── validation.js
│   ├── models/          # Modelos de dados
│   ├── routes/          # Definição de rotas
│   ├── services/        # Serviços auxiliares
│   ├── utils/           # Utilitários
│   └── index.js         # Ponto de entrada
├── uploads/             # Diretório para uploads
├── img/                 # Imagens de teste
├── Dockerfile           # Configuração Docker
└── package.json         # Dependências Node.js
```

## Instalação e Configuração

### Pré-requisitos

- **Node.js 18+**
- **npm ou yarn**
- **PostgreSQL 13+**
- **Docker e Docker Compose** (opcional)
- **Compilador C++** (g++, make, python3 para node-gyp)

### Instalação Local

1. **Clone o repositório e navegue para o backend:**
```bash
cd backend
```

2. **Instale as dependências:**
```bash
npm install
```

3. **Configure as variáveis de ambiente:**
Crie um arquivo `.env` na raiz do backend:
```env
NODE_ENV=development
PORT=5000
DB_HOST=localhost
DB_PORT=5432
DB_NAME=ocikey_db
DB_USER=seu_usuario
DB_PASSWORD=sua_senha
JWT_SECRET=seu_jwt_secret_muito_seguro
JWT_EXPIRES_IN=7d
```

4. **Compile o addon C++:**
```bash
npm run build
```

5. **Configure o banco de dados:**
```bash
npm run db:init
```

**Nota importante**: O sistema utiliza bibliotecas C++ compartilhadas que são automaticamente configuradas através da variável `LD_LIBRARY_PATH` nos scripts npm. As bibliotecas estão localizadas em `./biblioteca/` e são carregadas automaticamente durante a execução.

## Como Executar

### Execução Local

1. **Inicie o PostgreSQL** (se não estiver usando Docker)

2. **Execute o servidor:**
```bash
# Desenvolvimento (com nodemon)
npm run dev

# Produção
npm start
```

3. **Verifique se está funcionando:**
```bash
curl http://localhost:5000/health
```

### Execução com Docker

1. **Execute com Docker Compose:**
```bash
# Na raiz do projeto (onde está o docker-compose.yml)
docker-compose up -d
```

2. **Verifique os logs:**
```bash
docker-compose logs backend
```

3. **Pare os serviços:**
```bash
docker-compose down
```

## API Endpoints

### Autenticação
- `POST /api/auth/register` - Registrar usuário
- `POST /api/auth/login` - Login
- `POST /api/auth/logout` - Logout

### Leitura de Gabaritos
- `POST /api/leitura/processar` - Processar uma imagem (caminho)
- `POST /api/leitura/multiplas` - Processar múltiplas imagens
- `POST /api/leitura/upload` - Upload e processar uma imagem
- `POST /api/leitura/upload-multiplas` - Upload e processar múltiplas imagens

### Participantes
- `GET /api/participantes` - Listar participantes
- `POST /api/participantes` - Criar participante
- `PUT /api/participantes/:id` - Atualizar participante
- `DELETE /api/participantes/:id` - Deletar participante

### Provas
- `GET /api/provas` - Listar provas
- `POST /api/provas` - Criar prova
- `PUT /api/provas/:id` - Atualizar prova
- `DELETE /api/provas/:id` - Deletar prova

### Leituras
- `GET /api/leituras` - Listar leituras
- `PUT /api/leituras/:id` - Editar leitura
- `DELETE /api/leituras/:id` - Deletar leitura

## Integração com Biblioteca C++

### Por que é necessária a ponte (addon)?

A biblioteca de leitura de gabaritos foi desenvolvida em C++ e fornece funções nativas para processamento de imagens. Para integrar essa biblioteca com Node.js, foi necessário criar uma **ponte** usando Node-API (N-API).

### Como funciona a ponte:

1. **Biblioteca C++ (`leitor.h`)**:
   - Fornece funções `read_image_path()` e `read_image_data()`
   - Retorna struct `Reading` com dados da leitura

2. **Addon C++ (`addon.cpp`)**:
   - Implementa funções wrapper usando Node-API
   - Converte tipos C++ para tipos JavaScript
   - Trata erros e exceções

3. **Interface JavaScript (`addon/index.js`)**:
   - Carrega o addon compilado
   - Exporta funções para uso no Node.js

### Estrutura do Reading:

```cpp
typedef struct {
    int erro;            // 0=sucesso, 1=erro Aztec, 2=área, 3=fatal
    int id_prova;        // ID da prova (-1 se não identificado)
    int id_participante; // ID do participante (-1 se não identificado)
    char* leitura;       // String com respostas (a,b,c,d,e,0,X,?)
} Reading;
```

### Compilação do Addon:

O addon é compilado automaticamente durante `npm install` através do script `build`:

```bash
npm run build  # Executa: cd src/addon && node-gyp rebuild
```

## Banco de Dados

### Esquema do Banco

```sql
-- Usuários do sistema
CREATE TABLE users (
    id SERIAL PRIMARY KEY,
    username VARCHAR(50) UNIQUE NOT NULL,
    email VARCHAR(100) UNIQUE NOT NULL,
    password VARCHAR(255) NOT NULL,
    role VARCHAR(20) DEFAULT 'user',
    created_at TIMESTAMP DEFAULT CURRENT_TIMESTAMP
);

-- Participantes (alunos)
CREATE TABLE participantes (
    id SERIAL PRIMARY KEY,
    nome VARCHAR(255) NOT NULL,
    escola VARCHAR(255) NOT NULL,
    created_at TIMESTAMP DEFAULT CURRENT_TIMESTAMP
);

-- Provas (gabaritos)
CREATE TABLE provas (
    id SERIAL PRIMARY KEY,
    gabarito VARCHAR(255) NOT NULL,
    peso_questao DECIMAL(5,2) DEFAULT 0.50,
    created_at TIMESTAMP DEFAULT CURRENT_TIMESTAMP
);

-- Leituras de gabaritos
CREATE TABLE leituras (
    id SERIAL PRIMARY KEY,
    arquivo VARCHAR(255) NOT NULL,
    erro INTEGER NOT NULL,
    id_prova INTEGER REFERENCES provas(id),
    id_participante INTEGER REFERENCES participantes(id),
    gabarito VARCHAR(255),
    acertos INTEGER,
    nota DECIMAL(5,2),
    created_at TIMESTAMP DEFAULT CURRENT_TIMESTAMP
);
```

### Scripts de Banco

- `npm run db:setup` - Cria tabelas
- `npm run db:seed` - Popula dados iniciais
- `npm run db:init` - Setup + seed completo
- `npm run import:participantes` - Importa CSV de participantes
- `npm run import:provas` - Importa CSV de provas

## Docker

### Dockerfile

O Dockerfile está otimizado para:
- **Imagem base Alpine** (menor tamanho)
- **Compilação de módulos nativos** (python3, make, g++)
- **Usuário não-root** (segurança)
- **Health check** (monitoramento)
- **Multi-stage build** (otimização)

### Docker Compose

O `docker-compose.yml` configura:
- **PostgreSQL** com dados persistentes
- **Backend** com hot-reload em desenvolvimento
- **Rede isolada** para comunicação entre serviços
- **Health checks** para dependências
- **Variáveis de ambiente** centralizadas

### Comandos Docker Úteis

```bash
# Construir apenas o backend
docker-compose build backend

# Ver logs em tempo real
docker-compose logs -f backend

# Executar comandos no container
docker-compose exec backend npm run db:init

# Reiniciar apenas um serviço
docker-compose restart backend

# Limpar volumes (CUIDADO: apaga dados)
docker-compose down -v
```

## Funcionalidades Implementadas

### ✅ Leitura de Gabaritos

**Funcionalidade**: Processamento automatizado de imagens de gabaritos
**Implementação**: `src/controllers/leituraController.js`

- **Leitura única**: `POST /api/leitura/processar`
- **Leitura múltipla**: `POST /api/leitura/multiplas`
- **Upload único**: `POST /api/leitura/upload`
- **Upload múltiplo**: `POST /api/leitura/upload-multiplas`

**Como funciona**:
1. Recebe imagem (caminho ou upload)
2. Chama addon C++ para processar
3. Calcula acertos comparando com gabarito da prova
4. Calcula nota baseada no peso por questão
5. Salva resultado no banco de dados

### ✅ Cálculo de Notas

**Funcionalidade**: Cálculo automático de notas baseado em acertos
**Implementação**: Função `Acertos()` em `leituraController.js`

**Lógica**:
- Busca gabarito da prova no banco
- Compara resposta do aluno com gabarito
- Ignora questões em branco (0), múltiplas marcações (X, ?) e traços (-)
- Calcula: `nota = acertos × peso_por_questão`

### ✅ Gerenciamento de Dados

**Participantes**: CRUD completo
- Listagem com paginação
- Criação individual ou importação CSV
- Edição e exclusão

**Provas**: CRUD completo
- Listagem de gabaritos
- Criação com peso personalizado por questão
- Importação via CSV

**Leituras**: Visualização e edição
- Listagem de todas as leituras
- Edição antes do salvamento final
- Exclusão de leituras incorretas

### ✅ Sistema de Autenticação

**Funcionalidade**: Controle de acesso seguro
**Implementação**: JWT com middleware de autenticação

- **Registro**: Criação de usuários com hash de senha
- **Login**: Autenticação com token JWT
- **Logout**: Invalidação de tokens (blacklist)
- **Roles**: Admin, teacher, user

### ✅ Upload de Arquivos

**Funcionalidade**: Upload seguro de imagens
**Implementação**: Multer com validações

- **Tipos aceitos**: PNG, JPG, JPEG
- **Tamanho máximo**: Configurável
- **Armazenamento**: Diretório `uploads/`
- **Limpeza automática**: Arquivos antigos removidos

### ✅ Rate Limiting

**Funcionalidade**: Proteção contra abuso
**Implementação**: Middleware personalizado

- **Limite geral**: 100 requests/15min
- **Limite de upload**: 10 uploads/15min
- **Limite de autenticação**: 5 tentativas/15min

## Testes

### Estrutura de Testes

O diretório `src/tests/` contém diversos scripts de teste:

- `test-addon.js` - Testa integração com biblioteca C++
- `test-multiplas.js` - Testa processamento múltiplo
- `test-sistema-completo.js` - Teste end-to-end
- `test-todas-imagens.js` - Processa todas as imagens de exemplo

### Executar Testes

```bash
# Teste do addon C++
node src/tests/test-addon.js

# Teste de múltiplas imagens
node src/tests/test-multiplas.js

# Teste completo do sistema
node src/tests/test-sistema-completo.js
```

### Dados de Teste

O projeto inclui:
- **16 imagens de teste** em `img/`
- **CSV de participantes** em `src/tests/exemplo-participantes.csv`
- **CSV de provas** em `src/tests/exemplo-provas.csv`

## Exemplo de Output

O sistema produz output no formato especificado:

```
arquivo          erro id_prova id_aluno gabarito              acertos nota
0001.png         0    4        1        X-Xdebabcbb-baca-cbc  1/20    0.50
0002.png         2    6        3        a-bedabdbcc-eebacbca  2/20    1.00
0003.png         0    4        4        decabbcaXea-abecacad  2/20    1.00
```

**Legenda**:
- `erro`: 0=sucesso, 1=erro Aztec, 2=área, 3=fatal
- `id_prova`: ID da prova (-1 se não identificado)
- `id_aluno`: ID do participante (-1 se não identificado)
- `gabarito`: String com respostas (a-e=resposta, 0=branco, X/?=múltipla, -=erro)
- `acertos`: Número de acertos sobre total de questões
- `nota`: Nota calculada (acertos × peso_questão)

## Troubleshooting

### Problemas Comuns

1. **Erro de compilação do addon**:
```bash
# Instale dependências de build
sudo apt-get install python3 make g++ gcc
npm run build
```

2. **Erro de conexão com banco**:
```bash
# Verifique se PostgreSQL está rodando
sudo systemctl status postgresql
# Ou com Docker
docker-compose ps
```

3. **Erro de permissão em uploads**:
```bash
# Ajuste permissões do diretório
chmod 755 uploads/
```

4. **Biblioteca C++ não encontrada**:
```bash
# Verifique se a biblioteca está no local correto
ls -la biblioteca/
# Configure LD_LIBRARY_PATH se necessário
export LD_LIBRARY_PATH=/app/biblioteca:$LD_LIBRARY_PATH
```

### Logs e Debug

```bash
# Logs do Docker Compose
docker-compose logs -f backend

# Debug do Node.js
NODE_ENV=development npm run dev

# Verificar health check
curl http://localhost:5000/health
```

## Contribuição

Para contribuir com o projeto:

1. Faça fork do repositório
2. Crie uma branch para sua feature
3. Implemente os testes necessários
4. Faça commit das mudanças
5. Abra um Pull Request

## Licença

Este projeto é desenvolvido para fins acadêmicos e de pesquisa.

---

**Desenvolvido para o projeto OCIKey - Sistema de Controle de Gabaritos**
