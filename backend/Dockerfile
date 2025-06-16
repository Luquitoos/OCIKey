FROM ubuntu:24.04

# Instala Node.js 18 e dependências
RUN apt-get update && apt-get install -y \
    curl \
    python3 \
    make \
    g++ \
    gcc \
    build-essential \
    && curl -fsSL https://deb.nodesource.com/setup_18.x | bash - \
    && apt-get install -y nodejs \
    && rm -rf /var/lib/apt/lists/*

WORKDIR /app

# Copia código fonte primeiro
COPY . .

# Instala dependências (sem executar o script install que compila addon)
RUN npm ci --ignore-scripts

# Compila addon nativo
RUN npm run build

# Ajustar permissões das bibliotecas
RUN chmod +x biblioteca/*.so*

# Define variáveis de ambiente
ENV NODE_ENV=production
ENV PORT=5000
ENV LD_LIBRARY_PATH=/app/biblioteca

EXPOSE 5000

CMD ["npm", "start"]