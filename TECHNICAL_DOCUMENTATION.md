# Documentação Técnica - OCIKey Backend

## 📚 Documentação

- **[README.md](README.md)** - Visão geral e guia de início rápido
- **[API_DOCUMENTATION.md](API_DOCUMENTATION.md)** - Documentação completa da API
- **[TECHNICAL_DOCUMENTATION.md](TECHNICAL_DOCUMENTATION.md)** - Documentação técnica detalhada
- **[DEPLOYMENT_GUIDE.md](DEPLOYMENT_GUIDE.md)** - Guia de deployment e produção

---

## Implementação Detalhada

Esta documentação detalha a implementação técnica do sistema completo OCIKey (Frontend + Backend). Para visão geral do projeto, consulte [README.md](README.md). Para informações sobre a API, consulte [API_DOCUMENTATION.md](API_DOCUMENTATION.md). Para deployment, consulte [DEPLOYMENT_GUIDE.md](DEPLOYMENT_GUIDE.md).

## Arquitetura Frontend (Next.js)

### Estrutura de Rotas (App Router)

O frontend utiliza o App Router do Next.js 13+ com a seguinte estrutura:

```
src/app/
├── (auth)/                 # Grupo de rotas de autenticação
│   ├── login/             # Página de login
│   └── register/          # Página de registro
├── dashboard/             # Dashboard principal (protegido)
│   ├── layout.js          # Layout do dashboard
│   ├── page.jsx           # Página inicial do dashboard
│   ├── leitura/           # Upload e processamento
│   ├── leituras/          # Visualizar leituras
│   ├── participantes/     # Gerenciar participantes
│   ├── provas/            # Gerenciar provas
│   └── relatorios/        # Relatórios e estatísticas
├── layout.js              # Layout raiz
└── globals.css            # Estilos globais
```

### Sistema de Autenticação e Roles Frontend

```javascript
// src/contexts/AuthContext.js
const AuthContext = createContext();

export const AuthProvider = ({ children }) => {
  const [user, setUser] = useState(null);
  const [loading, setLoading] = useState(true);

  useEffect(() => {
    // Verificar token no localStorage
    const token = localStorage.getItem('token');
    if (token) {
      // Validar token com backend
      validateToken(token);
    }
    setLoading(false);
  }, []);

  const login = async (email, password) => {
    const response = await apiService.login(email, password);
    if (response.success) {
      setUser(response.data.user);
      return response;
    }
    throw new Error(response.error);
  };

  // Verificar permissões baseadas no role
  const hasPermission = (action, resource) => {
    if (!user) return false;
    
    const permissions = {
      'aluno': {
        'leituras': ['read', 'create'],
        'participantes': ['read_own'],
        'provas': ['read'],
        'relatorios': ['read_own']
      },
      'professor': {
        'leituras': ['read_school', 'create_temp'],
        'participantes': ['read_school', 'update_school', 'import_school'],
        'provas': ['read'],
        'relatorios': ['read_school']
      },
      'admin': {
        'leituras': ['read', 'create', 'update', 'delete'],
        'participantes': ['read', 'create', 'update', 'delete', 'import'],
        'provas': ['read', 'create', 'update', 'delete'],
        'relatorios': ['read']
      }
    };
    
    const userPermissions = permissions[user.role] || {};
    const resourcePermissions = userPermissions[resource] || [];
    return resourcePermissions.includes(action);
  };

  return (
    <AuthContext.Provider value={{ user, login, logout, loading, hasPermission }}>
      {children}
    </AuthContext.Provider>
  );
};
```

### Sistema de Registro com Roles Diferenciadas

```javascript
// src/components/RegisterForm.jsx
export default function RegisterForm() {
  const [selectedRole, setSelectedRole] = useState('aluno');
  const [formData, setFormData] = useState({});

  // Configuração de cores por role
  const roleColors = {
    'aluno': 'bg-blue-500',
    'professor': 'bg-green-500', 
    'admin': 'bg-red-500'
  };

  // Campos específicos por role
  const roleFields = {
    'aluno': ['nome', 'email', 'password', 'escola', 'turma'],
    'professor': ['nome', 'email', 'password', 'escola', 'disciplina'],
    'admin': ['nome', 'email', 'password', 'organizacao', 'cargo']
  };

  const handleRoleChange = (role) => {
    setSelectedRole(role);
    // Limpa campos não aplicáveis ao novo role
    const newFormData = {};
    roleFields[role].forEach(field => {
      if (formData[field]) {
        newFormData[field] = formData[field];
      }
    });
    setFormData(newFormData);
  };

  return (
    <div className={`min-h-screen ${roleColors[selectedRole]} transition-colors duration-300`}>
      <div className="bg-white rounded-lg shadow-lg p-8">
        {/* Seletor de Role */}
        <div className="mb-6">
          <h3 className="text-lg font-medium mb-4">Tipo de Conta</h3>
          <div className="grid grid-cols-3 gap-4">
            {['aluno', 'professor', 'admin'].map(role => (
              <button
                key={role}
                onClick={() => handleRoleChange(role)}
                className={`p-4 rounded-lg border-2 transition-all ${
                  selectedRole === role 
                    ? `border-${roleColors[role].split('-')[1]}-500 bg-${roleColors[role].split('-')[1]}-50` 
                    : 'border-gray-200 hover:border-gray-300'
                }`}
              >
                <div className="text-center">
                  <div className="text-2xl mb-2">
                    {role === 'aluno' && '🎓'}
                    {role === 'professor' && '👨‍🏫'}
                    {role === 'admin' && '👑'}
                  </div>
                  <div className="font-medium capitalize">{role}</div>
                </div>
              </button>
            ))}
          </div>
        </div>

        {/* Campos dinâmicos baseados no role */}
        <form onSubmit={handleSubmit}>
          {roleFields[selectedRole].map(field => (
            <div key={field} className="mb-4">
              <label className="block text-sm font-medium text-gray-700 mb-2">
                {getFieldLabel(field)}
              </label>
              <input
                type={getFieldType(field)}
                value={formData[field] || ''}
                onChange={(e) => setFormData({...formData, [field]: e.target.value})}
                className="w-full px-3 py-2 border border-gray-300 rounded-md focus:outline-none focus:ring-2 focus:ring-blue-500"
                required
              />
            </div>
          ))}
          
          <button
            type="submit"
            className={`w-full py-2 px-4 ${roleColors[selectedRole]} text-white rounded-md hover:opacity-90 transition-opacity`}
          >
            Registrar como {selectedRole.charAt(0).toUpperCase() + selectedRole.slice(1)}
          </button>
        </form>
      </div>
    </div>
  );
}
```

### Componente de Proteção de Rotas

```javascript
// src/components/ProtectedRoute.jsx
export default function ProtectedRoute({ children, requiredRole = null }) {
  const { user, loading } = useAuth();
  const router = useRouter();

  useEffect(() => {
    if (!loading && !user) {
      router.push('/login');
    }
    
    if (user && requiredRole && user.role !== requiredRole) {
      router.push('/dashboard'); // Redirecionar se não tem permissão
    }
  }, [user, loading, requiredRole]);

  if (loading) {
    return <div>Carregando...</div>;
  }

  if (!user) {
    return null;
  }

  if (requiredRole && user.role !== requiredRole) {
    return <div>Acesso negado</div>;
  }

  return children;
}
```

### Serviço de API (Frontend)

```javascript
// src/services/api.js
class ApiService {
  constructor() {
    this.baseURL = process.env.NEXT_PUBLIC_API_URL;
  }

  async request(endpoint, options = {}) {
    const url = `${this.baseURL}${endpoint}`;
    const token = this.getToken();

    const config = {
      headers: {
        'Content-Type': 'application/json',
        ...options.headers,
      },
      ...options,
    };

    if (token) {
      config.headers.Authorization = `Bearer ${token}`;
    }

    const response = await fetch(url, config);
    const data = await response.json();

    if (!response.ok) {
      const error = new Error(data.message || data.error);
      error.response = data;
      error.status = response.status;
      throw error;
    }

    return data;
  }

  // Métodos específicos para cada recurso
  async uploadImagem(file) {
    const formData = new FormData();
    formData.append('imagem', file);

    return this.request('/leitura/upload', {
      method: 'POST',
      headers: {}, // Remove Content-Type para FormData
      body: formData,
    });
  }
}
```

### 1. Integração com Biblioteca C++

#### 1.1 Estrutura da Biblioteca

A biblioteca C++ fornecida (`biblioteca/leitor.h`) define:

```cpp
typedef struct {
    int erro;            // Código de erro (0-3)
    int id_prova;        // ID da prova (-1 se não identificado)
    int id_participante; // ID do participante (-1 se não identificado)
    char* leitura;       // String com respostas do gabarito
} Reading;

// Funções disponíveis:
Reading read_image_path(const char* path);
Reading read_image_data(const char* file_type, const unsigned char* file_data, int file_data_size);
```

#### 1.2 Implementação do Addon (src/addon/addon.cpp)

O addon C++ serve como ponte entre Node.js e a biblioteca:

```cpp
#include <napi.h>
#include "../../biblioteca/leitor.h"

// Wrapper para read_image_path
Napi::Value ReadImagePath(const Napi::CallbackInfo& info) {
    Napi::Env env = info.Env();
    
    // Validação de parâmetros
    if (info.Length() < 1 || !info[0].IsString()) {
        Napi::TypeError::New(env, "Esperado um string com o caminho da imagem")
            .ThrowAsJavaScriptException();
        return env.Null();
    }
    
    // Conversão JavaScript → C++
    std::string path = info[0].As<Napi::String>().Utf8Value();
    
    // Chamada da biblioteca C++
    Reading result = read_image_path(path.c_str());
    
    // Conversão C++ → JavaScript
    Napi::Object jsResult = Napi::Object::New(env);
    jsResult.Set("erro", Napi::Number::New(env, result.erro));
    jsResult.Set("id_prova", Napi::Number::New(env, result.id_prova));
    jsResult.Set("id_participante", Napi::Number::New(env, result.id_participante));
    
    if (result.leitura != nullptr) {
        jsResult.Set("leitura", Napi::String::New(env, result.leitura));
    } else {
        jsResult.Set("leitura", env.Null());
    }
    
    return jsResult;
}
```

**Por que é necessária esta ponte?**

1. **Incompatibilidade de tipos**: C++ usa tipos nativos, JavaScript usa V8 objects
2. **Gerenciamento de memória**: Diferentes modelos entre C++ e JavaScript
3. **Tratamento de erros**: Conversão de exceções C++ para erros JavaScript
4. **Interface segura**: Validação de parâmetros e tipos

#### 1.3 Compilação com node-gyp

O arquivo `binding.gyp` (gerado automaticamente) configura a compilação:

```json
{
  "targets": [
    {
      "target_name": "leitoraddon",
      "sources": ["src/addon/addon.cpp"],
      "include_dirs": [
        "<!@(node -p \"require('node-addon-api').include\")",
        "biblioteca/"
      ],
      "libraries": ["-L../biblioteca", "-lleitor"],
      "cflags!": ["-fno-exceptions"],
      "cflags_cc!": ["-fno-exceptions"],
      "defines": ["NAPI_DISABLE_CPP_EXCEPTIONS"]
    }
  ]
}
```

### 2. Arquitetura do Sistema de Leitura

#### 2.1 Fluxo de Processamento

```
[Imagem] → [Upload/Path] → [Addon C++] → [Biblioteca] → [Resultado] → [Cálculo Nota] → [Visualização] → [Banco]
```

1. **Recepção**: API recebe imagem (upload ou caminho)
2. **Validação**: Middleware valida formato e tamanho
3. **Processamento**: Addon chama biblioteca C++
4. **Interpretação**: Sistema interpreta resultado da leitura
5. **Cálculo**: Calcula acertos e nota baseado no gabarito
6. **Visualização**: Renderiza gabarito com código de cores
7. **Persistência**: Salva resultado no banco de dados (conforme role)

#### 2.2 Sistema de Visualização com Código de Cores

```javascript
// src/components/GabaritoVisual.jsx
export default function GabaritoVisual({ leitura, gabarito, respostas }) {
  const getCircleStyle = (questao, resposta, gabaritoCorreto) => {
    // Resposta correta
    if (resposta === gabaritoCorreto && resposta !== '0' && resposta !== 'X' && resposta !== '?') {
      return {
        borderColor: '#10B981', // Verde
        backgroundColor: '#D1FAE5',
        borderWidth: '3px'
      };
    }
    
    // Resposta incorreta
    if (resposta !== gabaritoCorreto && resposta !== '0' && resposta !== 'X' && resposta !== '?') {
      return {
        borderColor: '#EF4444', // Vermelho
        backgroundColor: '#FEE2E2',
        borderWidth: '3px'
      };
    }
    
    // Erro de leitura, vazio ou múltipla marcação
    return {
      borderColor: '#9CA3AF', // Cinza
      backgroundColor: '#F3F4F6',
      borderWidth: '2px',
      opacity: '0.6'
    };
  };

  const getStatusIcon = (resposta) => {
    if (resposta === '0') return '⚪'; // Vazio
    if (resposta === 'X') return '❌'; // Múltipla marcação
    if (resposta === '?') return '❓'; // Erro de leitura
    return resposta; // a, b, c, d, e
  };

  // Componente de status da leitura
  const StatusLeitura = ({ erro }) => {
    const statusConfig = {
      0: {
        icon: '✅',
        message: 'Leitura realizada com sucesso',
        color: 'bg-green-100 border-green-500 text-green-800',
        iconColor: 'text-green-600'
      },
      1: {
        icon: '⚠️',
        message: 'Erro de leitura do código Aztec',
        color: 'bg-yellow-100 border-yellow-500 text-yellow-800',
        iconColor: 'text-yellow-600',
        details: 'O código Aztec não pôde ser lido corretamente. Verifique a qualidade da imagem.'
      },
      2: {
        icon: '🔍',
        message: 'Imprecisão na identificação da área de leitura',
        color: 'bg-orange-100 border-orange-500 text-orange-800',
        iconColor: 'text-orange-600',
        details: 'A área de leitura foi identificada com imprecisão. Alguns dados podem estar incorretos.'
      },
      3: {
        icon: '❌',
        message: 'Erro fatal durante a leitura',
        color: 'bg-red-100 border-red-500 text-red-800',
        iconColor: 'text-red-600',
        details: 'Falha crítica no processamento. Tente novamente com uma imagem de melhor qualidade.'
      }
    };

    const status = statusConfig[erro] || statusConfig[3];

    return (
      <div className={`p-4 rounded-lg border-2 mb-6 ${status.color}`}>
        <div className="flex items-center gap-3">
          <span className={`text-2xl ${status.iconColor}`}>{status.icon}</span>
          <div>
            <h4 className="font-semibold">{status.message}</h4>
            {status.details && (
              <p className="text-sm mt-1 opacity-90">{status.details}</p>
            )}
          </div>
        </div>
      </div>
    );
  };

  return (
    <div className="gabarito-visual p-6 bg-white rounded-lg shadow-lg">
      <h3 className="text-xl font-bold mb-4">Resultado da Leitura</h3>
      
      {/* Status da Leitura */}
      <StatusLeitura erro={leitura.erro} />
      
      {/* Legenda */}
      <div className="mb-6 flex gap-4 text-sm">
        <div className="flex items-center gap-2">
          <div className="w-4 h-4 rounded-full border-2 border-green-500 bg-green-100"></div>
          <span>Correto</span>
        </div>
        <div className="flex items-center gap-2">
          <div className="w-4 h-4 rounded-full border-2 border-red-500 bg-red-100"></div>
          <span>Incorreto</span>
        </div>
        <div className="flex items-center gap-2">
          <div className="w-4 h-4 rounded-full border-2 border-gray-400 bg-gray-100 opacity-60"></div>
          <span>Erro/Vazio</span>
        </div>
      </div>

      {/* Grid de questões */}
      <div className="grid grid-cols-10 gap-3">
        {respostas.split('').map((resposta, index) => {
          const gabaritoResposta = gabarito[index];
          const questaoNum = index + 1;
          
          return (
            <div key={index} className="text-center">
              <div className="text-xs text-gray-500 mb-1">Q{questaoNum}</div>
              <div
                className="w-8 h-8 rounded-full border-2 flex items-center justify-center text-sm font-medium transition-all hover:scale-110"
                style={getCircleStyle(questaoNum, resposta, gabaritoResposta)}
                title={`Questão ${questaoNum}: ${resposta === gabaritoResposta ? 'Correto' : 'Incorreto'} (Gabarito: ${gabaritoResposta})`}
              >
                {getStatusIcon(resposta)}
              </div>
              <div className="text-xs text-gray-400 mt-1">{gabaritoResposta}</div>
            </div>
          );
        })}
      </div>

      {/* Estatísticas */}
      <div className="mt-6 grid grid-cols-3 gap-4 text-center">
        <div className="bg-green-50 p-3 rounded-lg">
          <div className="text-2xl font-bold text-green-600">{leitura.acertos}</div>
          <div className="text-sm text-green-700">Acertos</div>
        </div>
        <div className="bg-blue-50 p-3 rounded-lg">
          <div className="text-2xl font-bold text-blue-600">{leitura.nota}</div>
          <div className="text-sm text-blue-700">Nota</div>
        </div>
        <div className="bg-gray-50 p-3 rounded-lg">
          <div className="text-2xl font-bold text-gray-600">{gabarito.length}</div>
          <div className="text-sm text-gray-700">Total</div>
        </div>
      </div>
    </div>
  );
}
```

#### 2.3 Sistema de Leitura Múltipla e Isolada

```javascript
// src/components/UploadLeitura.jsx
export default function UploadLeitura() {
  const [mode, setMode] = useState('isolada'); // 'isolada' ou 'multipla'
  const [files, setFiles] = useState([]);
  const [processing, setProcessing] = useState(false);
  const [results, setResults] = useState([]);

  const handleFileUpload = async (uploadedFiles) => {
    setFiles(uploadedFiles);
    
    if (mode === 'isolada') {
      // Processa uma imagem por vez
      for (const file of uploadedFiles) {
        await processarImagemIsolada(file);
      }
    } else {
      // Processa todas as imagens simultaneamente
      await processarImagensMultiplas(uploadedFiles);
    }
  };

  const processarImagemIsolada = async (file) => {
    setProcessing(true);
    try {
      const formData = new FormData();
      formData.append('imagem', file);
      
      const response = await apiService.uploadImagem(formData);
      setResults(prev => [...prev, response.data]);
    } catch (error) {
      console.error('Erro ao processar imagem:', error);
    } finally {
      setProcessing(false);
    }
  };

  const processarImagensMultiplas = async (files) => {
    setProcessing(true);
    try {
      const formData = new FormData();
      files.forEach(file => formData.append('imagens', file));
      
      const response = await apiService.uploadImagensMultiplas(formData);
      setResults(response.data.leituras);
    } catch (error) {
      console.error('Erro ao processar imagens:', error);
    } finally {
      setProcessing(false);
    }
  };

  return (
    <div className="upload-leitura p-6">
      {/* Seletor de modo */}
      <div className="mb-6">
        <h3 className="text-lg font-medium mb-4">Modo de Processamento</h3>
        <div className="flex gap-4">
          <button
            onClick={() => setMode('isolada')}
            className={`px-4 py-2 rounded-lg ${mode === 'isolada' ? 'bg-blue-500 text-white' : 'bg-gray-200'}`}
          >
            Leitura Isolada
          </button>
          <button
            onClick={() => setMode('multipla')}
            className={`px-4 py-2 rounded-lg ${mode === 'multipla' ? 'bg-blue-500 text-white' : 'bg-gray-200'}`}
          >
            Leitura Múltipla
          </button>
        </div>
      </div>

      {/* Área de upload */}
      <DropZone
        onFilesSelected={handleFileUpload}
        multiple={mode === 'multipla'}
        accept="image/*"
        maxFiles={mode === 'multipla' ? 50 : 1}
      />

      {/* Resultados */}
      {results.length > 0 && (
        <div className="mt-6">
          <h3 className="text-lg font-medium mb-4">Resultados</h3>
          <div className="space-y-4">
            {results.map((result, index) => (
              <GabaritoVisual
                key={index}
                leitura={result}
                gabarito={result.gabarito_prova}
                respostas={result.gabarito}
              />
            ))}
          </div>
        </div>
      )}
    </div>
  );
}
```

#### 2.2 Implementação do Controller (leituraController.js)

```javascript
async function processarUmaLeitura(caminhoImagem) {
    // 1. Chama addon C++ para ler imagem
    const leitura = readImagePath(caminhoImagem);
    
    // 2. Trata códigos de erro
    const errorMessage = getErrorMessage(leitura.erro);

    // 3. Calcula acertos e nota
    const { acertos, nota } = await Acertos(leitura.id_prova, leitura.leitura || '');

    // 4. Valida participante no banco
    let participanteId = null;
    if (leitura.id_participante !== -1) {
        const participanteCheck = await pool.query(
            'SELECT id FROM participantes WHERE id = $1', 
            [leitura.id_participante]
        );
        if (participanteCheck.rows.length > 0) {
            participanteId = leitura.id_participante;
        }
    }

    // 5. Salva no banco de dados
    const result = await pool.query(
        `INSERT INTO leituras (arquivo, erro, id_prova, id_participante, gabarito, acertos, nota)
        VALUES ($1, $2, $3, $4, $5, $6, $7) RETURNING *`,
        [caminhoImagem, leitura.erro, 
         leitura.id_prova === -1 ? null : leitura.id_prova,
         participanteId, leitura.leitura || '', acertos, nota]
    );

    return { leitura: result.rows[0] };
}
```

#### 2.3 Algoritmo de Cálculo de Acertos

```javascript
async function Acertos(id_prova, resposta_aluno) {
    // Valida ID da prova
    if (id_prova === -1) {
        return { acertos: 0, nota: 0.00 };
    }

    // Busca gabarito da prova
    const {rows} = await pool.query(
        'SELECT gabarito, peso_questao FROM provas WHERE id = $1', 
        [id_prova]
    );
    
    if (!rows.length) {
        throw new Error('Prova não encontrada');
    }
    
    const { gabarito, peso_questao } = rows[0];
    let acertos = 0;
    
    // Compara questão por questão
    for (let i = 0; i < Math.min(gabarito.length, resposta_aluno.length); i++) {
        const respostaAluno = resposta_aluno[i];
        
        // Conta como acerto apenas respostas válidas e corretas
        if (respostaAluno !== '0' &&    // não é branco
            respostaAluno !== 'X' &&    // não é múltipla marcação
            respostaAluno !== '?' &&    // não é erro de leitura
            respostaAluno !== '-' &&    // não é traço
            gabarito[i] === respostaAluno) {
            acertos++;
        }
    }
    
    // Calcula nota final
    const nota = parseFloat((acertos * peso_questao).toFixed(2));
    return { acertos, nota };
}
```

### 3. Sistema de Banco de Dados

#### 3.1 Modelo de Dados

```sql
-- Relacionamentos:
-- leituras.id_prova → provas.id (FK)
-- leituras.id_participante → participantes.id (FK)

-- Índices para performance:
CREATE INDEX idx_leituras_prova ON leituras(id_prova);
CREATE INDEX idx_leituras_participante ON leituras(id_participante);
CREATE INDEX idx_participantes_nome ON participantes(nome);
```

#### 3.2 Configuração de Conexão

```javascript
// src/config/database-config.js
import { Pool } from 'pg';
import dotenv from 'dotenv';

dotenv.config();

const createPool = () => {
  return new Pool({
    host: process.env.DB_HOST || 'localhost',
    port: process.env.DB_PORT || 5432,
    database: process.env.DB_NAME || 'ocikey_db',
    user: process.env.DB_USER || 'postgres',
    password: process.env.DB_PASSWORD || '',
    max: 20,                    // máximo de conexões no pool
    idleTimeoutMillis: 30000,   // tempo para fechar conexões ociosas
    connectionTimeoutMillis: 2000, // timeout para nova conexão
  });
};

export const pool = createPool();
```

### 4. Sistema de Autenticação

#### 4.1 JWT Implementation com Role-Based Access Control

```javascript
// src/middleware/auth.js
import jwt from 'jsonwebtoken';
import { pool } from '../config/database-config.js';

export const authenticateToken = async (req, res, next) => {
  const authHeader = req.headers['authorization'];
  const token = authHeader && authHeader.split(' ')[1]; // Bearer TOKEN

  if (!token) {
    return res.status(401).json({ error: 'Token de acesso requerido' });
  }

  try {
    // Verifica se token está na blacklist
    const blacklistCheck = await pool.query(
      'SELECT id FROM token_blacklist WHERE token = $1 AND expires_at > NOW()',
      [token]
    );

    if (blacklistCheck.rows.length > 0) {
      return res.status(401).json({ error: 'Token inválido' });
    }

    // Verifica e decodifica token
    const decoded = jwt.verify(token, process.env.JWT_SECRET);
    req.user = decoded;
    next();
  } catch (error) {
    return res.status(403).json({ error: 'Token inválido' });
  }
};

// Middleware para verificar roles específicos
export const requireRole = (allowedRoles) => {
  return (req, res, next) => {
    if (!req.user) {
      return res.status(401).json({ error: 'Usuário não autenticado' });
    }

    if (!allowedRoles.includes(req.user.role)) {
      return res.status(403).json({ 
        error: 'Acesso negado',
        required: allowedRoles,
        current: req.user.role
      });
    }

    next();
  };
};

// Middleware para verificar acesso a escola específica
export const checkSchoolAccess = async (req, res, next) => {
  if (!req.user) {
    return res.status(401).json({ error: 'Usuário não autenticado' });
  }

  // Admin tem acesso a tudo
  if (req.user.role === 'admin') {
    return next();
  }

  // Professor só pode acessar sua escola
  if (req.user.role === 'professor') {
    const { escola } = req.params;
    if (escola && escola !== req.user.escola) {
      return res.status(403).json({ error: 'Acesso negado à escola especificada' });
    }
  }

  // Aluno só pode acessar seus próprios dados
  if (req.user.role === 'aluno') {
    const { participanteId } = req.params;
    if (participanteId && parseInt(participanteId) !== req.user.participante_id) {
      return res.status(403).json({ error: 'Acesso negado aos dados especificados' });
    }
  }

  next();
};
```

#### 4.2 Sistema de Leituras Baseado em Roles

```javascript
// src/controllers/leituraController.js
export const processarLeitura = async (req, res) => {
  try {
    const { role, id: userId, escola, participante_id } = req.user;
    const resultado = await processarUmaLeitura(req.file.path);

    // Determina se a leitura deve ser salva baseado no role
    const shouldSave = determineSavePermission(role);
    
    if (shouldSave) {
      // Salva leitura no banco
      const leituraSalva = await salvarLeitura({
        ...resultado.leitura,
        user_id: userId,
        escola: role === 'professor' ? escola : null,
        participante_id: role === 'aluno' ? participante_id : null
      });
      
      res.json({
        success: true,
        data: leituraSalva,
        message: 'Leitura processada e salva com sucesso'
      });
    } else {
      // Retorna resultado sem salvar (professores)
      res.json({
        success: true,
        data: resultado.leitura,
        message: 'Leitura processada (visualização temporária)',
        temporary: true
      });
    }
  } catch (error) {
    res.status(500).json({ error: error.message });
  }
};

const determineSavePermission = (role) => {
  const savePermissions = {
    'aluno': true,     // Alunos salvam suas leituras
    'professor': false, // Professores fazem leituras temporárias
    'admin': true      // Admins salvam leituras
  };
  
  return savePermissions[role] || false;
};

// Listar leituras baseado no role
export const listarLeituras = async (req, res) => {
  try {
    const { role, escola, participante_id } = req.user;
    let query = 'SELECT * FROM leituras l JOIN participantes p ON l.id_participante = p.id';
    let params = [];

    switch (role) {
      case 'aluno':
        // Aluno vê apenas suas leituras
        query += ' WHERE l.id_participante = $1';
        params = [participante_id];
        break;
        
      case 'professor':
        // Professor vê leituras de sua escola
        query += ' WHERE p.escola = $1';
        params = [escola];
        break;
        
      case 'admin':
        // Admin vê todas as leituras
        break;
        
      default:
        return res.status(403).json({ error: 'Role não reconhecido' });
    }

    query += ' ORDER BY l.created_at DESC';
    const result = await pool.query(query, params);
    
    res.json({
      success: true,
      data: result.rows,
      total: result.rows.length
    });
  } catch (error) {
    res.status(500).json({ error: error.message });
  }
};
```

#### 4.3 Dashboard Personalizado por Role

```javascript
// src/controllers/dashboardController.js
export const getDashboardData = async (req, res) => {
  try {
    const { role, escola, participante_id } = req.user;
    let dashboardData = {};

    switch (role) {
      case 'aluno':
        dashboardData = await getAlunoDashboard(participante_id);
        break;
        
      case 'professor':
        dashboardData = await getProfessorDashboard(escola);
        break;
        
      case 'admin':
        dashboardData = await getAdminDashboard();
        break;
        
      default:
        return res.status(403).json({ error: 'Role não reconhecido' });
    }

    res.json({
      success: true,
      data: dashboardData,
      role
    });
  } catch (error) {
    res.status(500).json({ error: error.message });
  }
};

const getAlunoDashboard = async (participanteId) => {
  // Estatísticas do aluno
  const leituras = await pool.query(
    'SELECT * FROM leituras WHERE id_participante = $1 ORDER BY created_at DESC',
    [participanteId]
  );

  const mediaGeral = await pool.query(
    'SELECT AVG(nota) as media FROM leituras WHERE id_participante IS NOT NULL'
  );

  const minhasNotas = leituras.rows.map(l => l.nota);
  const minhaNota = minhasNotas.length > 0 ? 
    minhasNotas.reduce((a, b) => a + b, 0) / minhasNotas.length : 0;

  return {
    totalLeituras: leituras.rows.length,
    minhaNota: minhaNota.toFixed(2),
    mediaGeral: parseFloat(mediaGeral.rows[0].media || 0).toFixed(2),
    acimaDaMedia: minhaNota > parseFloat(mediaGeral.rows[0].media || 0),
    ultimasLeituras: leituras.rows.slice(0, 5),
    graficoDesempenho: minhasNotas
  };
};

const getProfessorDashboard = async (escola) => {
  // Estatísticas da escola
  const participantes = await pool.query(
    'SELECT COUNT(*) as total FROM participantes WHERE escola = $1',
    [escola]
  );

  const leituras = await pool.query(
    `SELECT l.*, p.nome FROM leituras l 
     JOIN participantes p ON l.id_participante = p.id 
     WHERE p.escola = $1 ORDER BY l.created_at DESC`,
    [escola]
  );

  const mediaEscola = await pool.query(
    `SELECT AVG(l.nota) as media FROM leituras l 
     JOIN participantes p ON l.id_participante = p.id 
     WHERE p.escola = $1`,
    [escola]
  );

  return {
    totalParticipantes: parseInt(participantes.rows[0].total),
    totalLeituras: leituras.rows.length,
    mediaEscola: parseFloat(mediaEscola.rows[0].media || 0).toFixed(2),
    ultimasLeituras: leituras.rows.slice(0, 10),
    participantesAtivos: leituras.rows.length
  };
};

const getAdminDashboard = async () => {
  // Estatísticas gerais do sistema
  const stats = await Promise.all([
    pool.query('SELECT COUNT(*) as total FROM participantes'),
    pool.query('SELECT COUNT(*) as total FROM leituras'),
    pool.query('SELECT COUNT(*) as total FROM provas'),
    pool.query('SELECT COUNT(DISTINCT escola) as total FROM participantes'),
    pool.query('SELECT AVG(nota) as media FROM leituras')
  ]);

  return {
    totalParticipantes: parseInt(stats[0].rows[0].total),
    totalLeituras: parseInt(stats[1].rows[0].total),
    totalProvas: parseInt(stats[2].rows[0].total),
    totalEscolas: parseInt(stats[3].rows[0].total),
    mediaGeral: parseFloat(stats[4].rows[0].media || 0).toFixed(2)
  };
};
```

#### 4.2 Rate Limiting

```javascript
// src/middleware/rateLimiter.js
const rateLimitStore = new Map();

const createRateLimiter = (windowMs, maxRequests) => {
  return (req, res, next) => {
    const key = req.ip;
    const now = Date.now();
    
    // Limpa registros expirados
    if (rateLimitStore.has(key)) {
      const requests = rateLimitStore.get(key);
      const validRequests = requests.filter(time => now - time < windowMs);
      rateLimitStore.set(key, validRequests);
    }

    // Verifica limite
    const requests = rateLimitStore.get(key) || [];
    if (requests.length >= maxRequests) {
      return res.status(429).json({
        error: 'Muitas tentativas. Tente novamente mais tarde.',
        retryAfter: Math.ceil(windowMs / 1000)
      });
    }

    // Adiciona nova requisição
    requests.push(now);
    rateLimitStore.set(key, requests);
    next();
  };
};

export const apiRateLimiter = createRateLimiter(15 * 60 * 1000, 100); // 100 req/15min
export const uploadRateLimiter = createRateLimiter(15 * 60 * 1000, 10); // 10 uploads/15min
```

### 5. Sistema de Upload

#### 5.1 Configuração Multer

```javascript
// src/middleware/upload.js
import multer from 'multer';
import path from 'path';
import fs from 'fs';

// Configuração de armazenamento
const storage = multer.diskStorage({
  destination: (req, file, cb) => {
    const uploadDir = 'uploads/';
    if (!fs.existsSync(uploadDir)) {
      fs.mkdirSync(uploadDir, { recursive: true });
    }
    cb(null, uploadDir);
  },
  filename: (req, file, cb) => {
    // Nome único: timestamp + nome original
    const uniqueName = `${Date.now()}-${Math.round(Math.random() * 1E9)}${path.extname(file.originalname)}`;
    cb(null, uniqueName);
  }
});

// Filtro de arquivos
const fileFilter = (req, file, cb) => {
  const allowedTypes = ['image/png', 'image/jpeg', 'image/jpg'];
  if (allowedTypes.includes(file.mimetype)) {
    cb(null, true);
  } else {
    cb(new Error('Apenas arquivos PNG, JPG e JPEG são permitidos'), false);
  }
};

// Configuração final
export const upload = multer({
  storage,
  fileFilter,
  limits: {
    fileSize: 10 * 1024 * 1024, // 10MB
    files: 20                    // máximo 20 arquivos por vez
  }
});
```

### 6. Docker Configuration

#### 6.1 Multi-stage Dockerfile

```dockerfile
# Estágio 1: Build
FROM node:18-alpine AS builder

# Instala dependências de build
RUN apk add --no-cache python3 make g++ gcc

WORKDIR /app
COPY package*.json ./
RUN npm ci --only=production

# Estágio 2: Runtime
FROM node:18-alpine AS runtime

# Instala apenas dependências de runtime
RUN apk add --no-cache dumb-init

# Cria usuário não-root
RUN addgroup -g 1001 -S nodejs && \
    adduser -S nodejs -u 1001

WORKDIR /app

# Copia arquivos do estágio de build
COPY --from=builder /app/node_modules ./node_modules
COPY --chown=nodejs:nodejs . .

# Compila addon
RUN npm run build

USER nodejs

EXPOSE 5000

# Usa dumb-init para proper signal handling
ENTRYPOINT ["dumb-init", "--"]
CMD ["npm", "start"]
```

#### 6.2 Docker Compose com Health Checks

**⚠️ IMPORTANTE**: O `docker-compose.yml` atual usa **Railway PostgreSQL (online)**, não PostgreSQL local.

**Configuração atual (Railway - banco online):**
```yaml
version: '3.8'

services:
  backend:
    build: ./backend
    environment:
      - DB_HOST=turntable.proxy.rlwy.net  # Railway online
      - DB_PORT=24899
      - DB_NAME=railway
      - DB_USER=postgres
      - DB_PASSWORD=CXfxBDYwgCblBScYNBRUcaZzUIhYughi
```

**Exemplo com PostgreSQL local:**
```yaml
version: '3.8'

services:
  postgres:
    image: postgres:17
    environment:
      POSTGRES_DB: ocikey_db
      POSTGRES_USER: OCI_user
      POSTGRES_PASSWORD: petoci
    healthcheck:
      test: ["CMD-SHELL", "pg_isready -U OCI_user -d ocikey_db"]
      interval: 10s
      timeout: 5s
      retries: 5
      start_period: 30s
    volumes:
      - postgres_data:/var/lib/postgresql/data

  backend:
    build: ./backend
    depends_on:
      postgres:
        condition: service_healthy  # Aguarda PostgreSQL estar saudável
    environment:
      - DB_HOST=postgres  # PostgreSQL local
      - LD_LIBRARY_PATH=/app/biblioteca
    healthcheck:
      test: ["CMD", "node", "-e", "require('http').get('http://localhost:5000/health', (res) => { process.exit(res.statusCode === 200 ? 0 : 1) })"]
      interval: 30s
      timeout: 10s
      retries: 3
      start_period: 40s
```

### 7. Tratamento de Erros

#### 7.1 Middleware Global de Erros

```javascript
// src/index.js
app.use((err, req, res, next) => {
  console.error('Erro:', err);
  
  // Erro de validação Joi
  if (err.isJoi) {
    return res.status(400).json({
      error: 'Dados inválidos',
      details: err.details.map(detail => detail.message)
    });
  }
  
  // Erro de Multer (upload)
  if (err instanceof multer.MulterError) {
    if (err.code === 'LIMIT_FILE_SIZE') {
      return res.status(400).json({ error: 'Arquivo muito grande' });
    }
    if (err.code === 'LIMIT_FILE_COUNT') {
      return res.status(400).json({ error: 'Muitos arquivos' });
    }
  }
  
  // Erro genérico
  res.status(500).json({
    error: 'Erro interno do servidor',
    details: process.env.NODE_ENV === 'development' ? [err.message] : null
  });
});
```

#### 7.2 Códigos de Erro da Biblioteca

```javascript
function getErrorMessage(codigoErro) {
    switch(codigoErro) {
        case 0:
            return null; // Sem erro
        case 1:
            return 'Erro de leitura do código Aztec';
        case 2:
            return 'Imprecisão ou erro na identificação da área de leitura';
        case 3:
            return 'Erro fatal durante a leitura';
        default:
            return 'Erro desconhecido';
    }
}
```

### 8. Serviços Auxiliares

#### 8.1 Cleanup Service

```javascript
// src/services/cleanupService.js
import fs from 'fs';
import path from 'path';
import { pool } from '../config/database-config.js';

class CleanupService {
  constructor() {
    this.intervalId = null;
    this.isRunning = false;
  }

  start() {
    if (this.isRunning) return;
    
    this.isRunning = true;
    // Executa limpeza a cada 6 horas
    this.intervalId = setInterval(() => {
      this.cleanup();
    }, 6 * 60 * 60 * 1000);
    
    console.log('Serviço de limpeza iniciado');
  }

  async cleanup() {
    try {
      // Remove tokens expirados da blacklist
      await pool.query('DELETE FROM token_blacklist WHERE expires_at < NOW()');
      
      // Remove tentativas de rate limit antigas
      await pool.query(
        'DELETE FROM rate_limit_attempts WHERE created_at < NOW() - INTERVAL \'1 hour\''
      );
      
      // Remove arquivos de upload antigos (mais de 24h)
      this.cleanupOldFiles();
      
      console.log('Limpeza automática executada');
    } catch (error) {
      console.error('Erro na limpeza automática:', error);
    }
  }

  cleanupOldFiles() {
    const uploadsDir = 'uploads/';
    if (!fs.existsSync(uploadsDir)) return;

    const files = fs.readdirSync(uploadsDir);
    const now = Date.now();
    const maxAge = 24 * 60 * 60 * 1000; // 24 horas

    files.forEach(file => {
      const filePath = path.join(uploadsDir, file);
      const stats = fs.statSync(filePath);
      
      if (now - stats.mtime.getTime() > maxAge) {
        fs.unlinkSync(filePath);
        console.log(`Arquivo removido: ${file}`);
      }
    });
  }

  stop() {
    if (this.intervalId) {
      clearInterval(this.intervalId);
      this.intervalId = null;
    }
    this.isRunning = false;
    console.log('Serviço de limpeza parado');
  }
}

export default new CleanupService();
```

### 9. Validação de Dados

#### 9.1 Schemas Joi

```javascript
// src/utils/validation.js
import Joi from 'joi';

export const participanteSchema = Joi.object({
  nome: Joi.string().min(2).max(255).required()
    .messages({
      'string.min': 'Nome deve ter pelo menos 2 caracteres',
      'string.max': 'Nome deve ter no máximo 255 caracteres',
      'any.required': 'Nome é obrigatório'
    }),
  escola: Joi.string().min(2).max(255).required()
    .messages({
      'string.min': 'Escola deve ter pelo menos 2 caracteres',
      'string.max': 'Escola deve ter no máximo 255 caracteres',
      'any.required': 'Escola é obrigatória'
    })
});

export const provaSchema = Joi.object({
  gabarito: Joi.string().pattern(/^[a-e]+$/).min(1).max(255).required()
    .messages({
      'string.pattern.base': 'Gabarito deve conter apenas letras de a-e',
      'string.min': 'Gabarito deve ter pelo menos 1 questão',
      'string.max': 'Gabarito deve ter no máximo 255 questões',
      'any.required': 'Gabarito é obrigatório'
    }),
  peso_questao: Joi.number().positive().precision(2).default(0.50)
    .messages({
      'number.positive': 'Peso da questão deve ser positivo',
      'number.precision': 'Peso da questão deve ter no máximo 2 casas decimais'
    })
});
```

### 10. Performance e Otimizações

#### 10.1 Connection Pooling

```javascript
// Configuração otimizada do pool PostgreSQL
const pool = new Pool({
  max: 20,                    // máximo de conexões simultâneas
  idleTimeoutMillis: 30000,   // fecha conexões ociosas após 30s
  connectionTimeoutMillis: 2000, // timeout para nova conexão
  statement_timeout: 30000,   // timeout para queries
  query_timeout: 30000,       // timeout para queries
});
```

#### 10.2 Índices de Banco

```sql
-- Índices para otimização de consultas frequentes
CREATE INDEX CONCURRENTLY idx_leituras_created_at ON leituras(created_at DESC);
CREATE INDEX CONCURRENTLY idx_leituras_nota ON leituras(nota DESC);
CREATE INDEX CONCURRENTLY idx_participantes_escola ON participantes(escola);
CREATE INDEX CONCURRENTLY idx_users_role ON users(role);
```

#### 10.3 Caching de Resultados

```javascript
// Cache simples em memória para gabaritos de provas
const gabaritoCache = new Map();

async function getGabaritoProva(id_prova) {
  if (gabaritoCache.has(id_prova)) {
    return gabaritoCache.get(id_prova);
  }
  
  const result = await pool.query(
    'SELECT gabarito, peso_questao FROM provas WHERE id = $1',
    [id_prova]
  );
  
  if (result.rows.length > 0) {
    gabaritoCache.set(id_prova, result.rows[0]);
    // Remove do cache após 1 hora
    setTimeout(() => gabaritoCache.delete(id_prova), 60 * 60 * 1000);
  }
  
  return result.rows[0];
}
```

### 11. Monitoramento e Logs

#### 11.1 Health Check Endpoint

```javascript
app.get('/health', async (req, res) => {
  try {
    // Testa conexão com banco
    await pool.query('SELECT 1');
    
    // Testa addon C++
    const testResult = readImagePath('img/base.png');
    
    res.json({
      status: 'OK',
      timestamp: new Date().toISOString(),
      services: {
        database: 'connected',
        addon: testResult ? 'loaded' : 'error'
      },
      uptime: process.uptime(),
      memory: process.memoryUsage()
    });
  } catch (error) {
    res.status(503).json({
      status: 'ERROR',
      error: error.message,
      timestamp: new Date().toISOString()
    });
  }
});
```

#### 11.2 Structured Logging

```javascript
// src/utils/logger.js
const log = (level, message, meta = {}) => {
  const logEntry = {
    timestamp: new Date().toISOString(),
    level,
    message,
    ...meta
  };
  
  if (process.env.NODE_ENV === 'production') {
    console.log(JSON.stringify(logEntry));
  } else {
    console.log(`[${level}] ${message}`, meta);
  }
};

export const logger = {
  info: (message, meta) => log('INFO', message, meta),
  error: (message, meta) => log('ERROR', message, meta),
  warn: (message, meta) => log('WARN', message, meta),
  debug: (message, meta) => log('DEBUG', message, meta)
};
```

Esta documentação técnica detalha todos os aspectos da implementação do backend OCIKey, explicando como cada componente funciona e por que foi implementado dessa forma.

### 12. Configuração de Bibliotecas Compartilhadas

#### 12.1 Problema das Bibliotecas C++

O sistema utiliza bibliotecas C++ compartilhadas (`.so`) que precisam ser carregadas em tempo de execução:

- `libraylib.so.550` - Biblioteca de processamento gráfico
- `libZXing.so.3` - Biblioteca de leitura de códigos  
- `libleitor.so` - Biblioteca principal de leitura de gabaritos

**Problema Original**: O addon C++ não conseguia encontrar essas bibliotecas em tempo de execução, resultando no erro:
```
Error: libraylib.so.550: cannot open shared object file: No such file or directory
```

#### 12.2 Solução Implementada

**Configuração Automática via LD_LIBRARY_PATH**: O `package.json` foi configurado para incluir automaticamente o diretório das bibliotecas:

```json
{
  "scripts": {
    "start": "LD_LIBRARY_PATH=./biblioteca:$LD_LIBRARY_PATH node src/index.js",
    "dev": "LD_LIBRARY_PATH=./biblioteca:$LD_LIBRARY_PATH nodemon src/index.js"
  }
}
```

#### 12.3 Vantagens da Solução

1. **Portabilidade**: Funciona em qualquer diretório e sistema Linux
2. **Simplicidade**: Não requer configuração manual do usuário
3. **Transparência**: As bibliotecas são carregadas automaticamente
4. **Manutenibilidade**: Centralizada nos scripts npm

#### 12.4 Alternativas Consideradas

- **rpath no binding.gyp**: Tentativa de configurar rpath durante compilação (problemas com caracteres especiais)
- **Cópia para /usr/lib**: Não portável e requer privilégios administrativos
- **Variável global**: Não é uma boa prática para aplicações

A solução atual com `LD_LIBRARY_PATH` nos scripts npm é a mais robusta e portável.
