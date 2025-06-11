# Imagem base Node.js Alpine
FROM node:18-alpine

# Instala dependências de build para módulos nativos C++
# python3: necessário para node-gyp
# make, g++, gcc: ferramentas de compilação C++
RUN apk add --no-cache python3 make g++ gcc

# Define diretório de trabalho dentro do container
WORKDIR /app

# Copia arquivos de configuração de dependências
# Feito separadamente para aproveitar cache do Docker
COPY package*.json ./

# Instala todas as dependências Node.js
# Inclui dependências de desenvolvimento para compilação
RUN npm install

# Copia todo o código fonte para o container
COPY . .

# Compila o addon nativo C++ usando node-gyp
# Necessário para integração com biblioteca de leitura de gabarito
RUN npm run build

# Expõe a porta 3001 para acesso externo
# Porta padrão do servidor Express
EXPOSE 3001

# Comando para iniciar a aplicação
# Usa npm start que executa "node src/index.js"
CMD ["npm", "start"]