# Guia de Deployment - OCIKey Backend

## 📚 Documentação

- **[README.md](README.md)** - Visão geral e guia de início rápido
- **[API_DOCUMENTATION.md](API_DOCUMENTATION.md)** - Documentação completa da API
- **[TECHNICAL_DOCUMENTATION.md](TECHNICAL_DOCUMENTATION.md)** - Documentação técnica detalhada
- **[DEPLOYMENT_GUIDE.md](DEPLOYMENT_GUIDE.md)** - Guia de deployment e produção

---

## Deployment em Produção

Este guia fornece instruções completas para deployment do OCIKey Backend em ambiente de produção. Para informações sobre o projeto, consulte [README.md](README.md). Para detalhes da API, consulte [API_DOCUMENTATION.md](API_DOCUMENTATION.md). Para implementação técnica, consulte [TECHNICAL_DOCUMENTATION.md](TECHNICAL_DOCUMENTATION.md).

### 1. Preparação do Ambiente

#### 1.1 Requisitos do Sistema

**Sistema Operacional**: Linux (Ubuntu 20.04+ recomendado)

**Dependências**:
```bash
# Atualizar sistema
sudo apt update && sudo apt upgrade -y

# Instalar Node.js 18+
curl -fsSL https://deb.nodesource.com/setup_18.x | sudo -E bash -
sudo apt-get install -y nodejs

# Instalar dependências de compilação
sudo apt-get install -y python3 make g++ gcc build-essential

# Instalar PostgreSQL
sudo apt-get install -y postgresql postgresql-contrib

# Instalar Docker (opcional)
sudo apt-get install -y docker.io docker-compose
sudo usermod -aG docker $USER
```

#### 1.2 Configuração do PostgreSQL

```bash
# Iniciar PostgreSQL
sudo systemctl start postgresql
sudo systemctl enable postgresql

# Criar usuário e banco
sudo -u postgres psql
```

```sql
-- No prompt do PostgreSQL
CREATE USER OCI_user WITH PASSWORD 'petoci';
CREATE DATABASE ocikey_db OWNER OCI_user;
GRANT ALL PRIVILEGES ON DATABASE ocikey_db TO OCI_user;
\q
```

### 2. Deployment Manual

#### 2.1 Clone e Configuração

```bash
# Clone do repositório
git clone <repository-url>
cd OCIKey/backend

# Instalar dependências
npm install

# Configurar ambiente
cp .env.example .env
nano .env  # Ajustar configurações
```

#### 2.2 Configuração do .env para Produção

```env
NODE_ENV=production
PORT=5000
DB_HOST=localhost
DB_PORT=5432
DB_NAME=ocikey_db
DB_USER=OCI_user
DB_PASSWORD=sua_senha_segura_aqui
JWT_SECRET=seu_jwt_secret_muito_seguro_e_longo_aqui
JWT_EXPIRES_IN=7d
LD_LIBRARY_PATH=./biblioteca
```

#### 2.3 Build e Inicialização

```bash
# Compilar addon C++
npm run build

# Configurar banco de dados (OBRIGATÓRIO - primeira vez)
npm run db:setup

# Importar dados iniciais (opcional)
npm run db:seed

# OU fazer setup completo
npm run db:init

# Importar dados via CSV (opcional)
npm run import:participantes
npm run import:provas

# Iniciar aplicação
npm start
```

#### 2.4 Configuração como Serviço (systemd)

```bash
# Criar arquivo de serviço
sudo nano /etc/systemd/system/ocikey-backend.service
```

```ini
[Unit]
Description=OCIKey Backend Service
After=network.target postgresql.service

[Service]
Type=simple
User=www-data
WorkingDirectory=/opt/ocikey/backend
Environment=NODE_ENV=production
ExecStart=/usr/bin/node src/index.js
Restart=always
RestartSec=10

[Install]
WantedBy=multi-user.target
```

```bash
# Ativar e iniciar serviço
sudo systemctl daemon-reload
sudo systemctl enable ocikey-backend
sudo systemctl start ocikey-backend

# Verificar status
sudo systemctl status ocikey-backend
```

### 3. Deployment com Docker

#### 3.1 Deployment Simples

```bash
# Na raiz do projeto
docker-compose up -d

# Verificar logs
docker-compose logs -f backend

# Parar serviços
docker-compose down
```

#### 3.2 Deployment em Produção com Docker

Criar `docker-compose.prod.yml`:

```yaml
version: '3.8'

services:
  postgres:
    image: postgres:17
    container_name: ocikey_postgres_prod
    environment:
      POSTGRES_DB: ocikey_db
      POSTGRES_USER: OCI_user
      POSTGRES_PASSWORD: ${DB_PASSWORD}
    ports:
      - "5432:5432"
    volumes:
      - postgres_data_prod:/var/lib/postgresql/data
      - ./backup:/backup
    networks:
      - ocikey_network_prod
    restart: unless-stopped
    healthcheck:
      test: ["CMD-SHELL", "pg_isready -U OCI_user -d ocikey_db"]
      interval: 30s
      timeout: 10s
      retries: 3

  backend:
    build: 
      context: ./backend
      dockerfile: Dockerfile
    container_name: ocikey_backend_prod
    ports:
      - "5000:5000"
    environment:
      - NODE_ENV=production
      - DB_HOST=postgres
      - DB_PORT=5432
      - DB_NAME=ocikey_db
      - DB_USER=OCI_user
      - DB_PASSWORD=${DB_PASSWORD}
      - JWT_SECRET=${JWT_SECRET}
      - JWT_EXPIRES_IN=7d
      - LD_LIBRARY_PATH=./biblioteca
    depends_on:
      postgres:
        condition: service_healthy
    networks:
      - ocikey_network_prod
    restart: unless-stopped
    healthcheck:
      test: ["CMD", "node", "-e", "require('http').get('http://localhost:5000/health', (res) => { process.exit(res.statusCode === 200 ? 0 : 1) })"]
      interval: 30s
      timeout: 10s
      retries: 3
    logging:
      driver: "json-file"
      options:
        max-size: "10m"
        max-file: "3"

volumes:
  postgres_data_prod:

networks:
  ocikey_network_prod:
    driver: bridge
```

```bash
# Executar em produção
docker-compose -f docker-compose.prod.yml up -d
```

### 4. Configuração de Proxy Reverso (Nginx)

#### 4.1 Instalação do Nginx

```bash
sudo apt-get install -y nginx
```

#### 4.2 Configuração do Site

```bash
sudo nano /etc/nginx/sites-available/ocikey-backend
```

```nginx
server {
    listen 80;
    server_name seu-dominio.com;

    # Rate limiting
    limit_req_zone $binary_remote_addr zone=api:10m rate=10r/s;
    limit_req_zone $binary_remote_addr zone=upload:10m rate=2r/s;

    # Logs
    access_log /var/log/nginx/ocikey-backend.access.log;
    error_log /var/log/nginx/ocikey-backend.error.log;

    # Configurações de segurança
    add_header X-Frame-Options DENY;
    add_header X-Content-Type-Options nosniff;
    add_header X-XSS-Protection "1; mode=block";

    # Proxy para backend
    location / {
        limit_req zone=api burst=20 nodelay;
        
        proxy_pass http://localhost:5000;
        proxy_http_version 1.1;
        proxy_set_header Upgrade $http_upgrade;
        proxy_set_header Connection 'upgrade';
        proxy_set_header Host $host;
        proxy_set_header X-Real-IP $remote_addr;
        proxy_set_header X-Forwarded-For $proxy_add_x_forwarded_for;
        proxy_set_header X-Forwarded-Proto $scheme;
        proxy_cache_bypass $http_upgrade;
        
        # Timeouts
        proxy_connect_timeout 60s;
        proxy_send_timeout 60s;
        proxy_read_timeout 60s;
    }

    # Configuração especial para uploads
    location /api/leitura/upload {
        limit_req zone=upload burst=5 nodelay;
        
        client_max_body_size 50M;
        proxy_pass http://localhost:5000;
        proxy_http_version 1.1;
        proxy_set_header Host $host;
        proxy_set_header X-Real-IP $remote_addr;
        proxy_set_header X-Forwarded-For $proxy_add_x_forwarded_for;
        proxy_set_header X-Forwarded-Proto $scheme;
        
        # Timeouts maiores para upload
        proxy_connect_timeout 300s;
        proxy_send_timeout 300s;
        proxy_read_timeout 300s;
    }

    # Health check sem rate limit
    location /health {
        proxy_pass http://localhost:5000;
        access_log off;
    }
}
```

```bash
# Ativar site
sudo ln -s /etc/nginx/sites-available/ocikey-backend /etc/nginx/sites-enabled/
sudo nginx -t
sudo systemctl reload nginx
```

#### 4.3 SSL com Let's Encrypt

```bash
# Instalar Certbot
sudo apt-get install -y certbot python3-certbot-nginx

# Obter certificado
sudo certbot --nginx -d seu-dominio.com

# Renovação automática
sudo crontab -e
# Adicionar linha:
# 0 12 * * * /usr/bin/certbot renew --quiet
```

### 5. Monitoramento e Logs

#### 5.1 Configuração de Logs

```bash
# Criar diretório de logs
sudo mkdir -p /var/log/ocikey
sudo chown www-data:www-data /var/log/ocikey

# Configurar logrotate
sudo nano /etc/logrotate.d/ocikey
```

```
/var/log/ocikey/*.log {
    daily
    missingok
    rotate 52
    compress
    delaycompress
    notifempty
    create 644 www-data www-data
    postrotate
        systemctl reload ocikey-backend
    endscript
}
```

#### 5.2 Monitoramento com PM2 (Alternativa ao systemd)

```bash
# Instalar PM2
sudo npm install -g pm2

# Criar arquivo de configuração
nano ecosystem.config.js
```

```javascript
module.exports = {
  apps: [{
    name: 'ocikey-backend',
    script: 'src/index.js',
    cwd: '/opt/ocikey/backend',
    instances: 'max',
    exec_mode: 'cluster',
    env: {
      NODE_ENV: 'production',
      PORT: 5000
    },
    log_file: '/var/log/ocikey/combined.log',
    out_file: '/var/log/ocikey/out.log',
    error_file: '/var/log/ocikey/error.log',
    log_date_format: 'YYYY-MM-DD HH:mm:ss Z',
    merge_logs: true,
    max_memory_restart: '1G',
    node_args: '--max-old-space-size=1024'
  }]
};
```

```bash
# Iniciar com PM2
pm2 start ecosystem.config.js
pm2 save
pm2 startup
```

### 6. Backup e Recuperação

#### 6.1 Backup do Banco de Dados

```bash
# Script de backup
nano /opt/scripts/backup-db.sh
```

```bash
#!/bin/bash
BACKUP_DIR="/backup/postgresql"
DATE=$(date +%Y%m%d_%H%M%S)
DB_NAME="ocikey_db"
DB_USER="OCI_user"

mkdir -p $BACKUP_DIR

# Backup completo
pg_dump -h localhost -U $DB_USER -d $DB_NAME > $BACKUP_DIR/ocikey_backup_$DATE.sql

# Manter apenas últimos 7 backups
find $BACKUP_DIR -name "ocikey_backup_*.sql" -mtime +7 -delete

echo "Backup concluído: ocikey_backup_$DATE.sql"
```

```bash
# Tornar executável e agendar
chmod +x /opt/scripts/backup-db.sh

# Agendar no crontab
crontab -e
# Adicionar: 0 2 * * * /opt/scripts/backup-db.sh
```

#### 6.2 Backup com Docker

```bash
# Script para backup com Docker
docker exec ocikey_postgres_prod pg_dump -U OCI_user ocikey_db > backup_$(date +%Y%m%d).sql
```

### 7. Segurança

#### 7.1 Firewall

```bash
# Configurar UFW
sudo ufw enable
sudo ufw allow ssh
sudo ufw allow 80/tcp
sudo ufw allow 443/tcp
sudo ufw allow from localhost to any port 5432  # PostgreSQL apenas local
```

#### 7.2 Fail2Ban

```bash
# Instalar Fail2Ban
sudo apt-get install -y fail2ban

# Configurar para Nginx
sudo nano /etc/fail2ban/jail.local
```

```ini
[nginx-http-auth]
enabled = true
port = http,https
logpath = /var/log/nginx/ocikey-backend.error.log

[nginx-limit-req]
enabled = true
port = http,https
logpath = /var/log/nginx/ocikey-backend.error.log
maxretry = 10
```

### 8. Troubleshooting de Produção

#### 8.1 Problemas Comuns

**Erro de compilação do addon**:
```bash
# Reinstalar dependências de build
sudo apt-get install -y python3-dev build-essential
npm rebuild
```

**Erro de conexão com banco**:
```bash
# Verificar status PostgreSQL
sudo systemctl status postgresql
sudo -u postgres psql -c "SELECT version();"

# Verificar conectividade
telnet localhost 5432
```

**Erro de permissões**:
```bash
# Ajustar permissões
sudo chown -R www-data:www-data /opt/ocikey
sudo chmod -R 755 /opt/ocikey
```

#### 8.2 Comandos de Debug

```bash
# Logs do sistema
sudo journalctl -u ocikey-backend -f

# Logs do Docker
docker-compose logs -f backend

# Verificar processos
ps aux | grep node

# Verificar portas
netstat -tlnp | grep :5000

# Teste de conectividade
curl -I http://localhost:5000/health
```

### 9. Atualizações

#### 9.1 Processo de Atualização

```bash
# Backup antes da atualização
/opt/scripts/backup-db.sh

# Parar serviço
sudo systemctl stop ocikey-backend

# Atualizar código
git pull origin main
npm install
npm run build

# Executar migrações (se houver)
npm run db:migrate

# Reiniciar serviço
sudo systemctl start ocikey-backend

# Verificar funcionamento
curl http://localhost:5000/health
```

#### 9.2 Rollback

```bash
# Reverter código
git checkout <commit-anterior>
npm install
npm run build

# Restaurar banco (se necessário)
psql -U OCI_user -d ocikey_db < /backup/postgresql/ocikey_backup_YYYYMMDD_HHMMSS.sql

# Reiniciar serviço
sudo systemctl restart ocikey-backend
```

### 10. Checklist de Deployment

- [ ] Sistema operacional atualizado
- [ ] Node.js 18+ instalado
- [ ] PostgreSQL configurado
- [ ] Dependências de compilação instaladas
- [ ] Código clonado e dependências instaladas
- [ ] Addon C++ compilado com sucesso
- [ ] Arquivo .env configurado para produção
- [ ] Banco de dados inicializado
- [ ] Serviço systemd ou PM2 configurado
- [ ] Nginx configurado como proxy reverso
- [ ] SSL/TLS configurado
- [ ] Firewall configurado
- [ ] Backup automático configurado
- [ ] Monitoramento configurado
- [ ] Health check funcionando
- [ ] Logs sendo gerados corretamente

Este guia fornece um processo completo para deployment seguro e confiável do OCIKey Backend em ambiente de produção.
