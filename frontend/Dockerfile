FROM node:18-alpine

# Instala dependências necessárias
RUN apk add --no-cache libc6-compat

WORKDIR /app

# Copia e instala dependências
COPY package*.json ./
RUN npm install

# Copia código fonte
COPY . .

# Build da aplicação
RUN npm run build

# Define variáveis de ambiente
ENV NODE_ENV=production
ENV NEXT_TELEMETRY_DISABLED=1

EXPOSE 3000

CMD ["npm", "start"]