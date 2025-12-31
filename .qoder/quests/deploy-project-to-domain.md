# Deployment Strategy for Ollama-Reader on reader.market Domain

## 1. Current State Analysis

### Project Location
- Current project path: `/var/www/reader.market`
- Domain: `reader.market` (IP: 82.146.42.213)
- Expected application port: 5001

### System Components Required
- Node.js runtime environment
- PostgreSQL database
- Ollama AI service
- Nginx reverse proxy
- PM2 process manager
- SSL certificate via Let's Encrypt

## 2. Deployment Architecture

### System Architecture
The Ollama-Reader application will be deployed using a standard LEMP-like stack with Node.js replacing PHP:

```
Internet → Nginx (SSL termination) → Node.js Application → PostgreSQL/Ollama
```

### Service Dependencies
- **Frontend**: React-based client application served via Node.js/Express
- **Backend**: Node.js server application running on port 5001
- **Database**: PostgreSQL database with booksdb schema
- **AI Service**: Ollama service running on port 11434
- **Process Management**: PM2 for application lifecycle management
- **Reverse Proxy**: Nginx handling SSL termination and traffic routing
- **Security**: SSL/TLS encryption with certificates from Let's Encrypt

## 3. Deployment Steps

### 3.1 System Preparation
1. Verify Ubuntu server status and update system packages
2. Ensure domain DNS is properly configured to point to server IP (82.146.42.213)
3. Check available disk space and system resources
4. Verify required ports (80, 443, 5001) are available

### 3.2 Environment Setup
1. Install Node.js LTS version and npm package manager
2. Install PM2 process manager globally
3. Install and configure PostgreSQL database
4. Install and configure Ollama AI service
5. Set up system services to start on boot

### 3.3 Application Configuration
1. Install project dependencies (backend and frontend)
2. Build production assets using npm build process
3. Configure environment variables for production
4. Run database migrations using Drizzle ORM
5. Set up PM2 process configuration for application management

### 3.4 Web Server Configuration
1. Install and configure Nginx as reverse proxy
2. Set up Nginx virtual host for reader.market domain
3. Configure SSL certificate request via Let's Encrypt
4. Implement security headers and performance optimizations
5. Configure upload size limits and static asset handling

### 3.5 Security Implementation
1. Configure UFW firewall to allow only necessary ports
2. Set appropriate file permissions for application files
3. Implement SSL/TLS with strong cipher suites
4. Set up log rotation for application and system logs

## 4. Service Configuration Details

### 4.1 Database Configuration
- Database name: `booksdb`
- Database user: `booksuser`
- Database password: `bookspassword`
- Connection string: `postgresql://booksuser:bookspassword@localhost:5432/booksdb`

### 4.2 Application Configuration
- Application port: `5001`
- Node environment: `production`
- Ollama host: `http://localhost:11434`
- Ollama model: `llama2`
- Upload directory: `/var/www/reader.market/uploads`

### 4.3 Nginx Configuration
- Server name: `reader.market www.reader.market`
- SSL certificate path: `/etc/letsencrypt/live/reader.market/`
- Static assets: Cache-optimized delivery
- API routes: Proxy to backend Node.js server
- Upload routes: Proxy to backend with increased size limits

## 5. Process Management

### 5.1 PM2 Configuration
- Application name: `ollama-reader`
- Script location: `./dist/index.cjs`
- Instance mode: `cluster` with maximum instances
- Environment: Production with proper environment variables
- Logging: Separate error and output logs with rotation
- Auto-restart: With memory and uptime constraints

### 5.2 Service Monitoring
- Application health checks via PM2
- System resource monitoring
- Log aggregation and rotation
- Automatic restart on failure

## 6. SSL Certificate Implementation

### 6.1 Certificate Acquisition
1. Verify domain DNS resolution to server IP
2. Use Certbot with Nginx plugin for automatic certificate setup
3. Configure automatic renewal via cron job
4. Test certificate renewal process

### 6.2 SSL Configuration
- Protocol support: TLSv1.2 and TLSv1.3
- Cipher suites: Strong encryption standards
- HSTS headers: Strict transport security
- Security headers: X-Frame-Options, X-Content-Type-Options, etc.

## 7. Backup and Maintenance

### 7.1 Backup Strategy
- Database backup: Daily automated backups stored in `/var/backups/reader.market/`
- Application backup: Pre-deployment backup of current version
- Configuration backup: Version control of critical configurations

### 7.2 Maintenance Procedures
- Health check scripts running every 10 minutes
- Log rotation with 52-week retention
- Automated dependency updates
- Regular security patches

## 8. Post-Deployment Verification

### 8.1 Service Status Checks
- PM2 application status and logs
- Nginx service status and configuration test
- PostgreSQL service status and connectivity
- Ollama service status and model availability

### 8.2 Application Testing
- Domain accessibility via HTTPS
- API endpoint functionality
- Database connectivity
- AI service integration
- File upload functionality

## 9. Rollback Strategy

### 9.1 Rollback Procedures
- Maintain previous version backups before updates
- Git-based version control for code rollback
- Database migration rollback capabilities
- PM2-based application state restoration

### 9.2 Emergency Procedures
- Quick service restart capabilities
- Database connection troubleshooting
- SSL certificate renewal procedures
- System resource monitoring and scaling

## 10. Implementation Timeline

### Phase 1: Environment Setup (30-45 minutes)
- Install and configure system dependencies
- Set up database and AI service
- Configure security measures

### Phase 2: Application Deployment (20-30 minutes)
- Install dependencies and build application
- Configure environment and run migrations
- Set up process management

### Phase 3: Web Server Configuration (15-20 minutes)
- Install and configure Nginx
- Set up domain virtual host
- Configure SSL certificate

### Phase 4: Testing and Verification (10-15 minutes)
- Verify all services are operational
- Test application functionality
- Confirm domain accessibility- Test application functionality
- Confirm domain accessibility