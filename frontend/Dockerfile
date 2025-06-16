# Imagem base Node.js Alpine
FROM node:18-alpine AS base

# Instala libc6-compat para compatibilidade com Next.js e wget para healthcheck
RUN apk add --no-cache libc6-compat wget

# Define diretório de trabalho
WORKDIR /app

# Copia arquivos de configuração de dependências
COPY package*.json ./
COPY pnpm-lock.yaml* ./

# Instala pnpm globalmente
RUN npm install -g pnpm

# Instala dependências
RUN pnpm install --frozen-lockfile

# Copia todo o código fonte
COPY . .

# Stage de desenvolvimento
FROM base AS development
ENV NODE_ENV=development
ENV NEXT_TELEMETRY_DISABLED=1

EXPOSE 3000
CMD ["pnpm", "dev"]

# Stage de produção
FROM base AS production

# Build da aplicação Next.js
RUN pnpm build

# Remove dependências de desenvolvimento
RUN pnpm prune --prod

# Cria usuário não-root para segurança
RUN addgroup --system --gid 1001 nodejs
RUN adduser --system --uid 1001 nextjs

# Muda ownership dos arquivos
RUN chown -R nextjs:nodejs /app
USER nextjs

# Expõe a porta 3000
EXPOSE 3000

# Define variável de ambiente para produção
ENV NODE_ENV=production
ENV NEXT_TELEMETRY_DISABLED=1

# Health check
HEALTHCHECK --interval=30s --timeout=3s --start-period=5s --retries=3 \
  CMD wget --no-verbose --tries=1 --spider http://localhost:3000/ || exit 1

# Comando para iniciar a aplicação
CMD ["pnpm", "start"]