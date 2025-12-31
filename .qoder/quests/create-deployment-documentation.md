# Ollama-Reader Deployment Documentation

## Overview

This document provides comprehensive instructions for deploying the Ollama-Reader application to the remote Ubuntu server at IP address 82.146.42.213. The domain reader.market is already configured to point to this server, and the project files are located in the `/var/www/reader.market` directory.

## System Architecture

The Ollama-Reader application consists of multiple components:

- **Frontend**: React-based book reader interface
- **Backend**: Node.js/Express server with API endpoints
- **Database**: PostgreSQL for storing user data, books, shelves, etc.
- **AI Service**: Ollama for AI-powered book analysis
- **Reverse Proxy**: Nginx for handling HTTP requests and SSL termination
- **Process Manager**: PM2 for managing Node.js application processes

## Prerequisites

- Ubuntu 20.04+ server running at 82.146.42.213
- Domain reader.market pointing to the server IP
- Project files already located in `/var/www/reader.market`
- SSH access with sudo privileges
- Root access or sudo user account

## Server Preparation

### 1. System Update
```bash
sudo apt update && sudo apt upgrade -y
```

### 2. Install Essential Packages
```bash
sudo apt install -y curl wget git build-essential
```

## Core Service Installation

### 1. Install Node.js and npm
```bash
curl -fsSL https://deb.nodesource.com/setup_lts.x | sudo -E bash -
sudo apt install -y nodejs
```

Verify installation:
```bash
node --version
npm --version
```

### 2. Install PM2 Process Manager
```bash
sudo npm install -g pm2
```

Set up PM2 startup:
```bash
pm2 startup
sudo env PATH=$PATH:/usr/bin /usr/lib/node_modules/pm2/bin/pm2 startup systemd -u $USER --hp /home/$USER
```

### 3. Install PostgreSQL Database

Install PostgreSQL:
```bash
sudo apt install postgresql postgresql-contrib -y
sudo systemctl start postgresql
sudo systemctl enable postgresql
```

Configure database:
```bash
sudo -u postgres psql -c "CREATE USER booksuser WITH PASSWORD 'bookspassword';"
sudo -u postgres psql -c "CREATE DATABASE booksdb OWNER booksuser;"
```

### 4. Install Ollama (AI Service)

Install Ollama:
```bash
curl -fsSL https://ollama.ai/install.sh | sh
sudo systemctl start ollama
sudo systemctl enable ollama
```

Pull required models:
```bash
ollama pull llama2
ollama pull mistral
```

## Application Setup

### 1. Navigate to Project Directory
```bash
cd /var/www/reader.market
```

### 2. Install Dependencies
```bash
# Install backend dependencies
npm install

# Install frontend dependencies
cd client
npm install
cd ..

# Install production-only dependencies
npm ci --only=production
```

### 3. Build the Application
```bash
npm run build
```

### 4. Create Environment Configuration
```bash
cat > .env << EOF
DATABASE_URL=postgresql://booksuser:bookspassword@localhost:5432/booksdb?schema=public
PORT=5001
JWT_SECRET=$(openssl rand -base64 32)
OLLAMA_HOST=http://localhost:11434
OLLAMA_MODEL=llama2
NODE_ENV=production
EOF
```

### 5. Create Uploads Directory
```bash
mkdir -p uploads
sudo chown -R $USER:$USER uploads
chmod -R 755 uploads
```

### 6. Run Database Migrations
```bash
npx drizzle-kit push
```

## Process Management with PM2

### 1. Create PM2 Configuration
```bash
cat > ecosystem.config.js << EOF
module.exports = {
  apps: [{
    name: 'ollama-reader',
    script: './dist/index.cjs',
    instances: 'max',
    exec_mode: 'cluster',
    env: {
      NODE_ENV: 'production',
      PORT: 5001,
      DATABASE_URL: 'postgresql://booksuser:bookspassword@localhost:5432/booksdb?schema=public',
      JWT_SECRET: '$(openssl rand -base64 32)',
      OLLAMA_HOST: 'http://localhost:11434',
      OLLAMA_MODEL: 'llama2'
    },
    error_file: './logs/err.log',
    out_file: './logs/out.log',
    log_file: './logs/combined.log',
    time: true,
    max_restarts: 10,
    min_uptime: '10s',
    max_memory_restart: '1G'
  }]
};
EOF
```

### 2. Start Application
```bash
mkdir -p logs
pm2 start ecosystem.config.js
pm2 save
```

## Nginx Configuration

### 1. Install Nginx
```bash
sudo apt install nginx -y
sudo systemctl start nginx
sudo systemctl enable nginx
```

### 2. Create Nginx Site Configuration
```bash
sudo tee /etc/nginx/sites-available/reader.market << EOF
server {
    listen 80;
    server_name reader.market www.reader.market;

    # Redirect all HTTP traffic to HTTPS
    return 301 https://\$server_name\$request_uri;
}

server {
    listen 443 ssl http2;
    server_name reader.market www.reader.market;

    # SSL Configuration
    ssl_certificate /etc/letsencrypt/live/reader.market/fullchain.pem;
    ssl_certificate_key /etc/letsencrypt/live/reader.market/privkey.pem;
    ssl_protocols TLSv1.2 TLSv1.3;
    ssl_ciphers ECDHE-RSA-AES256-GCM-SHA512:DHE-RSA-AES256-GCM-SHA512:ECDHE-RSA-AES256-GCM-SHA384:DHE-RSA-AES256-GCM-SHA384;
    ssl_prefer_server_ciphers off;
    ssl_session_cache shared:SSL:10m;

    # Security headers
    add_header X-Frame-Options DENY;
    add_header X-Content-Type-Options nosniff;
    add_header X-XSS-Protection "1; mode=block";
    add_header Strict-Transport-Security "max-age=63072000; includeSubDomains; preload";

    # Client max body size for file uploads
    client_max_body_size 50M;

    # Logging
    access_log /var/log/nginx/reader.market.access.log;
    error_log /var/log/nginx/reader.market.error.log;

    # Serve static assets directly
    location ~* \.(js|css|png|jpg|jpeg|gif|ico|svg|woff|woff2|ttf|eot)$ {
        root /var/www/reader.market/dist/public;
        expires 1y;
        add_header Cache-Control "public, immutable";
    }

    # Proxy API requests to Node.js server
    location /api {
        proxy_pass http://127.0.0.1:5001;
        proxy_http_version 1.1;
        proxy_set_header Upgrade \$http_upgrade;
        proxy_set_header Connection 'upgrade';
        proxy_set_header Host \$host;
        proxy_set_header X-Real-IP \$remote_addr;
        proxy_set_header X-Forwarded-For \$proxy_add_x_forwarded_for;
        proxy_set_header X-Forwarded-Proto \$scheme;
        proxy_cache_bypass \$http_upgrade;
        proxy_read_timeout 300s;
    }

    # Proxy uploads requests to Node.js server
    location /uploads {
        proxy_pass http://127.0.0.1:5001;
        proxy_http_version 1.1;
        proxy_set_header Upgrade \$http_upgrade;
        proxy_set_header Connection 'upgrade';
        proxy_set_header Host \$host;
        proxy_set_header X-Real-IP \$remote_addr;
        proxy_set_header X-Forwarded-For \$proxy_add_x_forwarded_for;
        proxy_set_header X-Forwarded-Proto \$scheme;
        proxy_cache_bypass \$http_upgrade;
        
        # Allow larger file uploads
        client_max_body_size 50M;
    }

    # Serve all other requests from the React app
    location / {
        proxy_pass http://127.0.0.1:5001;
        proxy_http_version 1.1;
        proxy_set_header Upgrade \$http_upgrade;
        proxy_set_header Connection 'upgrade';
        proxy_set_header Host \$host;
        proxy_set_header X-Real-IP \$remote_addr;
        proxy_set_header X-Forwarded-For \$proxy_add_x_forwarded_for;
        proxy_set_header X-Forwarded-Proto \$scheme;
        proxy_cache_bypass \$http_upgrade;
    }
}
EOF
```

### 3. Enable Site and Test Configuration
```bash
sudo ln -s /etc/nginx/sites-available/reader.market /etc/nginx/sites-enabled/
sudo nginx -t
sudo systemctl reload nginx
```

## SSL Certificate Setup

### 1. Install Certbot
```bash
sudo apt install certbot python3-certbot-nginx -y
```

### 2. Obtain SSL Certificate
```bash
sudo certbot --nginx -d reader.market -d www.reader.market --non-interactive --agree-tos --email admin@reader.market
```

### 3. Set Up Automatic Renewal
```bash
sudo crontab -l | { cat; echo "0 12 * * * /usr/bin/certbot renew --quiet"; } | crontab -
```

## Security Configuration

### 1. Configure Firewall
```bash
sudo ufw enable
sudo ufw allow ssh
sudo ufw allow 'Nginx Full'
```

### 2. Set Up File Permissions
```bash
sudo chown -R www-data:www-data /var/www/reader.market
sudo chmod -R 755 /var/www/reader.market
sudo chown -R $USER:www-data /var/www/reader.market/uploads
sudo chmod -R 775 /var/www/reader.market/uploads
```

## Backup Procedures

### 1. Create Database Backup Script
```bash
cat > backup-db.sh << EOF
#!/bin/bash
DATE=\$(date +%Y%m%d_%H%M%S)
BACKUP_DIR="/var/backups/reader.market"
DB_NAME="booksdb"
DB_USER="booksuser"

# Create backup directory if it doesn't exist
mkdir -p \$BACKUP_DIR

# Create database backup
pg_dump -h localhost -U \$DB_USER -d \$DB_NAME > \$BACKUP_DIR/db_backup_\$DATE.sql

# Compress the backup
gzip \$BACKUP_DIR/db_backup_\$DATE.sql

# Remove backups older than 30 days
find \$BACKUP_DIR -name "*.sql.gz" -mtime +30 -delete

echo "Database backup completed: db_backup_\$DATE.sql.gz"
EOF

chmod +x backup-db.sh
```

### 2. Set Up Regular Backups
```bash
mkdir -p /var/backups/reader.market
(crontab -l 2>/dev/null; echo "0 2 * * * /var/www/reader.market/backup-db.sh") | crontab -
```

## Health Checks and Monitoring

### 1. Create Health Check Script
```bash
cat > health-check.sh << EOF
#!/bin/bash

# Check if application is responding
HTTP_CODE=\$(curl -s -o /dev/null -w "%{http_code}" https://reader.market/api/health 2>/dev/null || echo "000")

if [ \$HTTP_CODE -eq 200 ]; then
    echo "Application is healthy (HTTP \$HTTP_CODE)"
    exit 0
else
    echo "Application is unhealthy (HTTP \$HTTP_CODE)"
    exit 1
fi
EOF

chmod +x health-check.sh
```

### 2. Set Up Health Check Cron
```bash
(crontab -l 2>/dev/null; echo "*/10 * * * * /var/www/reader.market/health-check.sh") | crontab -
```

## Application Management

### Start/Stop/Restart Commands
- Start: `pm2 start ecosystem.config.js`
- Stop: `pm2 stop ollama-reader`
- Restart: `pm2 restart ollama-reader`
- Reload: `pm2 reload ollama-reader`

### View Application Status
- Check status: `pm2 status`
- View logs: `pm2 logs ollama-reader`
- Monitor: `pm2 monit`

### Service Status Checks
- Nginx: `sudo systemctl status nginx`
- PostgreSQL: `sudo systemctl status postgresql`
- Ollama: `sudo systemctl status ollama`

## Troubleshooting

### Common Issues and Solutions

#### Application Not Starting
```bash
# Check PM2 logs
pm2 logs

# Check if port is in use
sudo netstat -tuln | grep :5001

# Check Node.js version
node --version
```

#### Database Connection Issues
```bash
# Test database connection
sudo -u postgres psql -c "SELECT version();"

# Check PostgreSQL logs
sudo tail -f /var/log/postgresql/postgresql-*.log
```

#### SSL Certificate Issues
```bash
# Check certificate status
sudo certbot certificates

# Renew certificate manually
sudo certbot renew
```

#### Nginx Configuration Issues
```bash
# Test nginx configuration
sudo nginx -t

# Check nginx error logs
sudo tail -f /var/log/nginx/error.log
```

## Rollback Procedure

To rollback to a previous version:

1. Navigate to the application directory:
   ```bash
   cd /var/www/reader.market
   ```

2. Check git history:
   ```bash
   git log --oneline
   ```

3. Rollback to specific commit:
   ```bash
   git reset --hard [previous-commit-hash]
   ```

4. Reinstall dependencies and rebuild:
   ```bash
   npm ci --only=production
   npm run build
   ```

5. Restart application:
   ```bash
   pm2 restart all
   ```

## Maintenance Schedule

### Daily Tasks
- Monitor application logs
- Check health status
- Verify SSL certificate validity

### Weekly Tasks
- Review system resources
- Update security patches
- Check backup integrity

### Monthly Tasks
- Update application dependencies
- Review and optimize database performance
- Update Ollama models if needed- Review and optimize database performance
- Update Ollama models if needed