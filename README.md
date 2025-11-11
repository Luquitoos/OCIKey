# OCIKey - Sistema Completo de Leitura de Gabaritos

## 📚 Documentação

- **[README.md](README.md)** - Visão geral e guia de início rápido
- **[API_DOCUMENTATION.md](API_DOCUMENTATION.md)** - Documentação completa da API
- **[TECHNICAL_DOCUMENTATION.md](TECHNICAL_DOCUMENTATION.md)** - Documentação técnica detalhada
- **[DEPLOYMENT_GUIDE.md](DEPLOYMENT_GUIDE.md)** - Guia de deployment e produção

---

## Visão Geral

O OCIKey é uma aplicação completa para leitura automatizada de gabaritos de provas, composta por:

- **Backend (Node.js)**: API REST para processamento de imagens e gerenciamento de dados
- **Frontend (Next.js)**: Interface web moderna e responsiva para usuários
- **Biblioteca C++**: Processamento avançado de imagens para leitura de gabaritos
- **Banco PostgreSQL**: Armazenamento de participantes, provas e leituras

O sistema permite a leitura automatizada de gabaritos através de processamento de imagens, com interface web intuitiva para gerenciamento completo do processo.

## Índice

- [Requisitos do Projeto](#requisitos-do-projeto)
- [Arquitetura do Sistema](#arquitetura-do-sistema)
- [Tecnologias Utilizadas](#tecnologias-utilizadas)
- [Estrutura do Projeto](#estrutura-do-projeto)
- [Instalação e Configuração](#instalação-e-configuração)
- [Como Executar](#como-executar)
  - [Sistema Completo com Docker](#-guia-rápido---sistema-completo-com-docker)
  - [Execução Local (Desenvolvimento)](#-execução-local-desenvolvimento)
- [API Endpoints](#api-endpoints)
- [Integração com Biblioteca C++](#integração-com-biblioteca-c)
- [Banco de Dados](#banco-de-dados)
- [Funcionalidades Implementadas](#funcionalidades-implementadas)
  - [Interface Web (Frontend)](#️-interface-web-frontend)
  - [Backend (API REST)](#-backend-api-rest)
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
│   Frontend      │ (Next.js 15 + React 19)
│   (Next.js)     │ - Interface web responsiva
└─────────────────┘ - Dashboard administrativo
         │           - Sistema de autenticação
         │ HTTP/REST
┌─────────────────┐
│   Backend API   │ (Express.js + Node.js 18)
│   (Express.js)  │ - API REST
└─────────────────┘ - Autenticação JWT
         │           - Rate limiting
┌─────────────────┐
│  Addon C++      │ (Ponte Node.js ↔ Biblioteca C++)
│  (Node-API)     │ - Integração nativa
└─────────────────┘ - Conversão de tipos
         │
┌─────────────────┐
│ Biblioteca C++  │ (Processamento de imagens)
│ (leitor.h)      │ - Leitura de códigos Aztec
└─────────────────┘ - Processamento de gabaritos
         │
┌─────────────────┐
│   PostgreSQL    │ (Banco de dados)
│   Database      │ - Dados persistentes
└─────────────────┘ - Relacionamentos
```

## Tecnologias Utilizadas

### Frontend
- **Next.js 15** - Framework React com SSR/SSG
- **React 19** - Biblioteca de interface de usuário
- **Tailwind CSS** - Framework CSS utilitário
- **Chart.js** - Biblioteca de gráficos
- **Heroicons** - Ícones SVG
- **Context API** - Gerenciamento de estado

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
OCIKey/
├── frontend/                    # Interface web (Next.js)
│   ├── src/
│   │   ├── app/                # App Router (Next.js 13+)
│   │   │   ├── (auth)/         # Rotas de autenticação
│   │   │   ├── dashboard/      # Dashboard principal
│   │   │   │   ├── leitura/    # Upload e processamento
│   │   │   │   ├── leituras/   # Visualizar leituras
│   │   │   │   ├── participantes/ # Gerenciar participantes
│   │   │   │   ├── provas/     # Gerenciar provas
│   │   │   │   └── relatorios/ # Relatórios e estatísticas
│   │   │   └── layout.js       # Layout principal
│   │   ├── components/         # Componentes reutilizáveis
│   │   │   ├── ui/             # Componentes de UI
│   │   │   ├── AuthLayout.jsx  # Layout de autenticação
│   │   │   ├── DashboardLayout.jsx # Layout do dashboard
│   │   │   └── ProtectedRoute.jsx  # Proteção de rotas
│   │   ├── contexts/           # Context API
│   │   ├── services/           # Serviços de API
│   │   │   └── api.js          # Cliente da API
│   │   └── utils/              # Utilitários
│   ├── public/                 # Arquivos estáticos
│   ├── Dockerfile              # Container do frontend
│   └── package.json            # Dependências Next.js
│
├── backend/                     # API REST (Node.js)
│   ├── biblioteca/             # Biblioteca C++ fornecida
│   │   └── leitor.h           # Header da biblioteca de leitura
│   ├── src/
│   │   ├── addon/             # Ponte Node.js ↔ C++
│   │   │   ├── addon.cpp      # Implementação do addon
│   │   │   └── index.js       # Interface JavaScript
│   │   ├── config/            # Configurações
│   │   │   ├── database-config.js
│   │   │   ├── setup-database.js
│   │   │   └── seed-database.js
│   │   ├── controllers/       # Controladores da API
│   │   │   ├── leituraController.js
│   │   │   ├── participantesController.js
│   │   │   └── provasController.js
│   │   ├── middleware/        # Middlewares
│   │   │   ├── auth.js
│   │   │   ├── upload.js
│   │   │   └── validation.js
│   │   ├── models/            # Modelos de dados
│   │   ├── routes/            # Definição de rotas
│   │   ├── services/          # Serviços auxiliares
│   │   ├── utils/             # Utilitários
│   │   └── index.js           # Ponto de entrada
│   ├── uploads/               # Diretório para uploads
│   ├── img/                   # Imagens de teste
│   ├── Dockerfile             # Container do backend
│   └── package.json           # Dependências Node.js
│
├── docker-compose.yml          # Orquestração de containers
├── README.md                   # Documentação principal
├── API_DOCUMENTATION.md        # Documentação da API
├── TECHNICAL_DOCUMENTATION.md  # Documentação técnica
└── DEPLOYMENT_GUIDE.md         # Guia de deployment
```

## Instalação e Configuração

### Pré-requisitos

- **Node.js 18+**
- **npm ou yarn**
- **PostgreSQL 17+** (opcional - sistema já configurado com banco em produção)
- **Docker e Docker Compose** (opcional)
- **Compilador C++** (g++, make, python3 para node-gyp)

### Configuração de Variáveis de Ambiente

#### Backend (.env)
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
LD_LIBRARY_PATH=./biblioteca
```

#### Frontend (.env)
Crie um arquivo `.env` na raiz do frontend:
```env
NEXT_PUBLIC_API_URL=http://localhost:5000/api
```

### Instalação Local

#### Backend
1. **Navegue para o backend:**
```bash
cd backend
```

2. **Instale as dependências:**
```bash
npm install
```

3. **Compile o addon C++:**
```bash
npm run build
```

4. **Inicie o backend:**
- Para produção:
```bash
npm start
```
- Para desenvolvimento (com hot reload):
```bash
npm run dev
```

5. **Configure o banco de dados (primeira vez):**
```bash
npm run db:init
```

#### Frontend
1. **Navegue para o frontend:**
```bash
cd frontend
```

2. **Instale as dependências:**
```bash
npm install
```

**Nota importante**: O backend utiliza bibliotecas C++ compartilhadas que são automaticamente configuradas através da variável `LD_LIBRARY_PATH` nos scripts npm. As bibliotecas estão localizadas em `./biblioteca/` e são carregadas automaticamente durante a execução.

## Como Executar

### 🚀 Guia Rápido - Sistema Completo com Docker

**A forma mais fácil de executar o sistema completo:**

```bash
# Na raiz do projeto
docker-compose up -d

# Verificar se está funcionando
curl http://localhost:5000/health  # Backend
curl http://localhost:3000         # Frontend
```

**✅ Pronto! Sistema completo rodando:**
- **Frontend**: http://localhost:3000
- **Backend**: http://localhost:5000

**⚠️ IMPORTANTE - Configuração do Banco de Dados:**
- ⚠️ **Se quiser usar banco local**, edite as variáveis de ambiente no `docker-compose.yml`

### 🔧 Execução Local (Desenvolvimento)

#### Pré-requisitos
- **Node.js 18+** instalado
- **Compilador C++** (g++, make, python3)

#### Passo a passo:

1. **Clone o repositório:**
```bash
git clone <url-do-repositorio>
cd OCIKey
```

2. **Configure e execute o Backend:**
```bash
cd backend
npm install          # Instala dependências e compila addon C++
npm run db:setup     # Configure banco (primeira vez apenas)
npm run dev          # Inicia backend em modo desenvolvimento
```

3. **Configure e execute o Frontend (novo terminal):**
```bash
cd frontend
npm install          # Instala dependências do Next.js
npm run dev          # Inicia frontend em modo desenvolvimento
```

**✅ Sistema rodando:**
- **Frontend**: http://localhost:3000
- **Backend**: http://localhost:5000

### ⚠️ IMPORTANTE: Configuração do Banco de Dados

**Se quiser usar seu próprio banco PostgreSQL local:**

1. **Configure o banco:**
```bash
# Crie o banco no PostgreSQL
sudo -u postgres psql
```
```sql
CREATE USER seu_usuario WITH PASSWORD 'sua_senha';
CREATE DATABASE ocikey_db OWNER seu_usuario;
GRANT ALL PRIVILEGES ON DATABASE ocikey_db TO seu_usuario;
\q
```

2. **Edite o arquivo `backend/.env`:**
```env
DB_HOST=localhost
DB_PORT=5432
DB_NAME=ocikey_db
DB_USER=seu_usuario
DB_PASSWORD=sua_senha
```

3. **Configure as tabelas:**
```bash
cd backend
npm run db:init
```

#### Comandos Úteis

```bash
# Backend
cd backend
npm run dev                      # Desenvolvimento com reload automático
npm start                        # Produção
npm run build                    # Compilar addon C++
npm run db:init                  # Configurar banco completo
node src/tests/test-todas-imagens.js  # Testar processamento

# Frontend
cd frontend
npm run dev                      # Desenvolvimento com hot-reload
npm run build                    # Build para produção
npm start                        # Executar build de produção

# Docker
docker-compose up -d             # Executar sistema completo
docker-compose logs -f backend   # Ver logs do backend
docker-compose logs -f frontend  # Ver logs do frontend
```

### Execução com Docker

O `docker-compose.yml` configura automaticamente:
- **Backend** (Node.js + Express) na porta 5000
- **Frontend** (Next.js) na porta 3000
- **Banco de dados** Railway PostgreSQL (online)

#### ⚠️ IMPORTANTE - Banco de Dados

**O Docker está assim para substituição:**
```yaml
# Configuração atual no docker-compose.yml
environment:
  DB_HOST: SUB
  DB_PORT: SUB
  DB_NAME: SUB
  DB_USER: SUB
  DB_PASSWORD: SUB
```

**Para usar banco local PostgreSQL:**
1. Instale PostgreSQL localmente
2. Edite o `docker-compose.yml`:
```yaml
environment:
  DB_HOST: host.docker.internal  # ou IP do seu PostgreSQL
  DB_PORT: 5432
  DB_NAME: ocikey_db
  DB_USER: seu_usuario
  DB_PASSWORD: sua_senha
```

#### Comandos Docker:

```bash
# Executar sistema completo
docker-compose up -d

# Ver logs em tempo real
docker-compose logs -f backend   # Logs do backend
docker-compose logs -f frontend  # Logs do frontend
docker-compose logs -f           # Logs de ambos

# Parar serviços
docker-compose down

# Reconstruir containers
docker-compose build
docker-compose up -d --build

# Executar comandos nos containers
docker-compose exec backend npm run db:init
docker-compose exec frontend npm run build
```

## API Endpoints

Para documentação completa da API com exemplos de requisições e respostas, consulte [API_DOCUMENTATION.md](API_DOCUMENTATION.md).

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

Para detalhes técnicos completos sobre a integração C++, consulte [TECHNICAL_DOCUMENTATION.md](TECHNICAL_DOCUMENTATION.md).

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
    escola VARCHAR(255),
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

- `npm run db:setup` - Cria tabelas (execute UMA VEZ antes do primeiro uso)
- `npm run db:seed` - Popula dados iniciais
- `npm run db:init` - Setup + seed completo
- `npm run create-users` - Cria usuários automaticamente para participantes existentes
- `npm run import:participantes <arquivo.csv>` - Importa CSV de participantes
- `npm run import:provas <arquivo.csv> [peso]` - Importa CSV de provas

### Importação de Dados via CSV

O sistema permite importar participantes e provas via arquivos CSV:

#### Importar Participantes:
```bash
# Usando arquivo de exemplo (já existe no projeto)
npm run import:participantes src/tests/exemplo-participantes.csv

# Usando seu próprio arquivo
npm run import:participantes caminho/para/seu/participantes.csv
```

**Formato do CSV** (`src/tests/exemplo-participantes.csv`):
```csv
id,nome,escola
1,Ana Clara Silva,Escola Nova
2,João Pedro Santos,Escola Nova
3,Maria Luiza Oliveira,Escola Nova
```

#### Importar Provas:
```bash
# Usando arquivo de exemplo (já existe no projeto)
npm run import:provas src/tests/exemplo-provas.csv

# Usando seu próprio arquivo
npm run import:provas caminho/para/suas/provas.csv

# Com peso personalizado por questão
npm run import:provas src/tests/exemplo-provas.csv 0.75
```

**Formato do CSV** (`src/tests/exemplo-provas.csv`):
```csv
Prova,Gabarito
1,eaedddccaedacbbcbacb
2,bdbbacbbaeececddbdcd
3,abecadcbbcedccabccda
```

#### Importação via API:

Você também pode importar via endpoints da API:

```bash
# Importar participantes via API
curl -X POST http://localhost:5000/api/participantes/import \
  -H "Authorization: Bearer <token>" \
  -H "Content-Type: application/json" \
  -d '{"csvData": "id,nome,escola\n1,João,Escola A\n2,Maria,Escola B"}'

# Importar provas via API  
curl -X POST http://localhost:5000/api/provas/import \
  -H "Authorization: Bearer <token>" \
  -H "Content-Type: application/json" \
  -d '{"csvData": "prova,gabarito\n1,abcdeabcde\n2,edbcaedbca", "pesoQuestao": 0.5}'
```

## Docker

Para instruções completas de deployment em produção, consulte [DEPLOYMENT_GUIDE.md](DEPLOYMENT_GUIDE.md).

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

### 🖥️ Interface Web (Frontend)

**Tecnologia**: Next.js 15 + React 19 + Tailwind CSS

#### ✅ Sistema de Autenticação e Registro

**Sistema de Registro com Roles Diferenciadas**:
- **Seleção de Cargo**: Durante o registro, o usuário escolhe entre Aluno, Professor ou Admin
- **Interface Dinâmica**: A tela de registro muda de cor e campos conforme o tipo de cargo selecionado
- **Campos Específicos**: Cada tipo de conta possui campos de preenchimento diferentes e específicos
- **Validação por Role**: Sistema de validação adaptado para cada tipo de usuário
- **Proteção de rotas**: Middleware de autenticação
- **Gerenciamento de sessão**: Context API + localStorage

**Tipos de Conta e Permissões**:

**🎓 ALUNO**:
- **Leituras**: Pode fazer leituras de provas e visualizar seu desempenho
- **Visualização de Resultados**: Vê seus acertos e aproveitamento em cada prova
- **Perfil Editável**: Pode modificar informações do seu próprio perfil
- **Leitura de Outras Provas**: Pode fazer leitura de provas de outros participantes (nome do detentor será mostrado)
- **Dashboard Personalizado**: Visualiza seu desempenho comparado com outros participantes
- **Indicador de Performance**: Sistema mostra se ficou abaixo ou acima da média

**👨‍🏫 PROFESSOR**:
- **Gestão da Escola**: Visualiza todos os participantes da escola que representa
- **Relatórios Escolares**: Acesso a relatório geral dos participantes de sua escola
- **Visualização de Leituras**: Pode ver todas as leituras dos participantes de sua escola
- **Acesso a Gabaritos**: Consegue visualizar gabaritos das provas (sem poder editar/deletar)
- **Leituras Temporárias**: Pode fazer leituras para visualização imediata (não são salvas)
- **Edição de Participantes**: Permite editar nomes dos participantes de sua escola
- **Importação CSV**: Pode importar participantes via arquivo CSV

**👑 ADMIN**:
- **Controle Total**: Visualiza todos os participantes da olimpíada
- **Relatórios Gerais**: Acesso a relatórios com informações gerais de todo o sistema
- **Gestão Completa de Leituras**: Pode ver, editar e gerenciar todas as leituras
- **Controle de Gabaritos**: Pode ver, editar e deletar gabaritos de provas
- **Leituras Persistentes**: Suas leituras são salvas automaticamente no sistema
- **Gestão Global de Participantes**: Pode alterar nomes de todos os participantes
- **Importação CSV Completa**: Pode importar participantes de qualquer escola

#### ✅ Sistema de Leitura Avançado

**Processamento Flexível**:
- **Leitura Múltipla**: Permite processar várias imagens simultaneamente
- **Leitura Isolada**: Processamento individual de imagens conforme necessário
- **Upload Dinâmico**: Interface para upload de imagens com drag & drop

**Visualização de Resultados**:
- **Interface de Gabarito**: Leitura é exibida como um gabarito visual
- **Código de Cores Intuitivo**:
  - 🟢 **Verde**: Alternativas corretas (circunferência verde)
  - 🔴 **Vermelho**: Alternativas incorretas (circunferência vermelha)
  - ⚪ **Cinza**: Erros de leitura ou campos vazios (circunferência cinza com opacidade reduzida)

**Sistema de Feedback de Leitura**:
- **✅ Sucesso (Erro 0)**: "Leitura realizada com sucesso" - Interface verde com dados completos
- **⚠️ Erro Aztec (Erro 1)**: "Erro de leitura do código Aztec" - Alerta amarelo, dados parciais
- **🔍 Erro de Área (Erro 2)**: "Imprecisão na identificação da área de leitura" - Alerta laranja
- **❌ Erro Fatal (Erro 3)**: "Erro fatal durante a leitura" - Alerta vermelho, falha completa
- **Mensagens Contextuais**: Sistema exibe detalhes específicos do erro e sugestões de correção

#### ✅ Dashboard Administrativo
- **Visão geral**: Estatísticas e métricas em tempo real
- **Navegação intuitiva**: Menu lateral responsivo
- **Gráficos interativos**: Chart.js para visualização de dados

#### ✅ Gerenciamento de Participantes
- **Listagem**: Tabela com paginação e busca
- **CRUD por Permissão**: Criar, editar e excluir conforme role do usuário
- **Importação CSV**: Interface para upload de arquivos (Professor/Admin)
- **Filtros**: Por escola, nome, etc.
- **Controle de Escola**: Professores veem apenas sua escola, Admins veem todos

#### ✅ Gerenciamento de Provas
- **Listagem de gabaritos**: Visualização clara dos gabaritos
- **CRUD por Role**: Admins podem editar/deletar, Professores apenas visualizar
- **Configuração de peso**: Interface para definir peso por questão
- **Importação CSV**: Upload de gabaritos em lote

#### ✅ Processamento de Gabaritos
- **Upload de imagens**: Drag & drop ou seleção de arquivos
- **Upload múltiplo**: Processamento em lote
- **Visualização em tempo real**: Progresso do processamento
- **Edição de resultados**: Interface para correção manual
- **Leituras por Role**: Alunos salvam suas leituras, Professores fazem leituras temporárias

#### ✅ Visualização de Leituras
- **Listagem por Permissão**: Cada role vê leituras conforme suas permissões
- **Detalhes da leitura**: Gabarito, acertos, nota com código de cores
- **Edição por Role**: Admins podem editar todas, outros conforme permissões
- **Exportação**: Download de resultados conforme acesso

#### ✅ Relatórios e Estatísticas
- **Dashboard de métricas**: Visão geral do desempenho por role
- **Gráficos de desempenho**: Por prova, participante, escola (conforme acesso)
- **Estatísticas detalhadas**: Médias, distribuições, comparações
- **Filtros avançados**: Por período, prova, escola (adaptado por permissão)

### 🔧 Backend (API REST)

**Tecnologia**: Node.js 18 + Express.js + PostgreSQL

#### ✅ Leitura de Gabaritos

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

- **Tipos aceitos**: PNG, JPG, JPEG, PDF e etc
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
...
```
