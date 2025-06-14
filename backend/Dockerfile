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

# Define variáveis de ambiente necessárias
ENV NODE_ENV=development
ENV PORT=5000
ENV LD_LIBRARY_PATH=/app/biblioteca:$LD_LIBRARY_PATH

# Cria usuário não-root para segurança
RUN addgroup -g 1001 -S nodejs
RUN adduser -S nodejs -u 1001

# Muda ownership dos arquivos para o usuário nodejs
RUN chown -R nodejs:nodejs /app
USER nodejs

# Expõe a porta 5000 para acesso externo
# Porta padrão do servidor Express
EXPOSE 5000

# Health check para monitoramento
HEALTHCHECK --interval=30s --timeout=3s --start-period=5s --retries=3 \
  CMD node -e "require('http').get('http://localhost:5000/health', (res) => { process.exit(res.statusCode === 200 ? 0 : 1) })"

# Comando para iniciar a aplicação
# Usa npm start que executa "node src/index.js"
CMD ["npm", "start"]
