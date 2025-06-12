# Importação de Provas via CSV

## Formato do CSV

O arquivo CSV deve ter o seguinte formato:

```csv
Prova,Gabarito
1,eaedddccaedacbbcbacb
2,bdbbacbbaeececddbdcd
3,abecadcbbcedccabccda
4,baadcaeeacabcdbccade
5,ddddbddcdcacbbecaaed
6,caeabbdecbcecaddaecd
```

### Regras:
- **Prova**: ID numérico da prova (corresponde ao `id_prova` da biblioteca)
- **Gabarito**: String com as respostas corretas (a, b, c, d, e, etc.)
- **Cabeçalho**: Opcional, será detectado e removido automaticamente
- **Separador**: Vírgula (,)

## Métodos de Importação

### 1. Via Script de Linha de Comando

```bash
# Importar com peso padrão (0.50)
npm run import:provas exemplo-provas.csv

# Importar com peso personalizado
npm run import:provas exemplo-provas.csv 0.25
```

**Parâmetros:**
- `arquivo.csv`: Caminho para o arquivo CSV
- `peso-questao`: (Opcional) Peso por questão, padrão 0.50

### 2. Via API REST

**Endpoint:** `POST /api/provas/import-csv`

**Body:**
```json
{
  "csvData": "Prova,Gabarito\n1,eaedddccaedacbbcbacb\n2,bdbbacbbaeececddbdcd",
  "pesoQuestao": 0.50
}
```

**Resposta de Sucesso:**
```json
{
  "success": true,
  "message": "Importação concluída",
  "resultado": {
    "importadas": 4,
    "atualizadas": 2,
    "total": 6,
    "erros": []
  }
}
```

## Outras Operações com Provas

### Listar Provas
```http
GET /api/provas
```

### Obter Prova Específica
```http
GET /api/provas/:id
```

### Criar Prova Individual
```http
POST /api/provas
Content-Type: application/json

{
  "gabarito": "abcdeabcdeabcdeabcde",
  "pesoQuestao": 0.50
}
```

### Atualizar Prova
```http
PUT /api/provas/:id
Content-Type: application/json

{
  "gabarito": "edcbaedcbaedcbaedcba",
  "pesoQuestao": 0.25
}
```

### Deletar Prova
```http
DELETE /api/provas/:id
```

## Comportamento da Importação

1. **Provas Existentes**: São atualizadas com os novos dados
2. **Provas Novas**: São criadas no banco de dados
3. **Linhas Inválidas**: São ignoradas e reportadas nos erros
4. **Sequence**: Atualizada automaticamente para evitar conflitos
5. **Transações**: Cada prova é processada individualmente

## Validações

- ID da prova deve ser um número inteiro positivo
- Gabarito não pode estar vazio
- Peso da questão deve ser um número positivo
- Formato CSV deve estar correto

## Exemplo de Uso Completo

1. **Criar arquivo CSV:**
```csv
Prova,Gabarito
1,eaedddccaedacbbcbacb
2,bdbbacbbaeececddbdcd
3,abecadcbbcedccabccda
```

2. **Importar via script:**
```bash
npm run import:provas provas.csv 0.50
```

3. **Verificar importação:**
```bash
curl http://localhost:3000/api/provas
```

4. **Usar nas leituras:**
- A biblioteca C++ retornará `id_prova = 1, 2, 3...`
- O sistema buscará automaticamente o gabarito correspondente
- Calculará acertos e nota baseado no peso configurado