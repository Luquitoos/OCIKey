FROM node:18-alpine

# Instala dependências necessárias para compilação
RUN apk add --no-cache python3 make g++ gcc

WORKDIR /app

# Copia e instala dependências
COPY package*.json ./
RUN npm install

# Copia código fonte
COPY . .

# Compila addon nativo se necessário
RUN npm run build

# Define variáveis de ambiente
ENV NODE_ENV=production
ENV PORT=5000
ENV LD_LIBRARY_PATH=/app/biblioteca

EXPOSE 5000

CMD ["npm", "start"]