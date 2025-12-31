# Shell Script for Running Ollama-Reader Application

## Problem Statement

Create a shell script that runs the entire Ollama-Reader application from the project root directory. This script should handle all necessary setup steps including dependency installation, database migrations, and starting both the frontend and backend services.

## Context

- Project: Ollama-Reader (e-book reading application)
- Environment: Production server at reader.market
- Requirements: Complete application startup from project root
- Dependencies: Node.js, npm, PostgreSQL, Drizzle ORM

## Root Cause Analysis

The need for a comprehensive startup script stems from:
1. Complex multi-service application architecture (frontend and backend)
2. Database migration requirements before application startup
3. Need for consistent deployment process

## Solution Strategy

### Primary Approach: Comprehensive Shell Script
Create a shell script that orchestrates the complete application startup process including:
- Installing dependencies
- Running database migrations
- Starting backend server
- Starting frontend development server

### Secondary Approach: Error Handling
Implement proper error checking and logging to ensure reliable operation.

### Tertiary Approach: Configuration Management
Handle environment-specific configurations for different deployment scenarios.

## Implementation Considerations

- The script must handle both development and production scenarios
- Proper dependency installation order must be maintained
- Database migrations should run before application services start
- The script should provide clear status messages during execution

## Success Criteria

- The script successfully installs all necessary dependencies
- Database migrations execute properly
- Both frontend and backend services start without errors
- The application is accessible via the configured endpoints
- Error handling provides clear feedback on any failures

## Risk Mitigation

- Include checks for required system dependencies (Node.js, npm, PostgreSQL)
- Implement graceful failure handling with informative error messages
- Add safeguards to prevent multiple instances running simultaneously

## Nginx Configuration for Production with Cloudflare

For production deployment with Cloudflare, nginx should be configured as a reverse proxy to serve the Ollama-Reader application. The following nginx configuration accounts for Cloudflare's proxy settings and properly routes requests to your Node.js backend:

```nginx
server {
    listen 80;
    listen [::]:80;
    
    server_name reader.market www.reader.market;
    
    # Path to application root
    root /var/www/reader.market;
    index index.html;
    
    # Logs
    access_log /var/log/nginx/reader.market.access.log;
    error_log /var/log/nginx/reader.market.error.log;
    
    # ===============================================
    # IMPORTANT: Restore real IP addresses of visitors
    # Without this, all logs will show the same Cloudflare IP
    # ===============================================
    set_real_ip_from 173.245.48.0/20;
    set_real_ip_from 103.21.244.0/22;
    set_real_ip_from 103.22.200.0/22;
    set_real_ip_from 103.31.4.0/22;
    set_real_ip_from 141.101.64.0/18;
    set_real_ip_from 108.162.192.0/18;
    set_real_ip_from 190.93.240.0/20;
    set_real_ip_from 188.114.96.0/20;
    set_real_ip_from 197.234.240.0/22;
    set_real_ip_from 198.41.128.0/17;
    set_real_ip_from 162.158.0.0/15;
    set_real_ip_from 104.16.0.0/13;
    set_real_ip_from 104.24.0.0/14;
    set_real_ip_from 172.64.0.0/13;
    set_real_ip_from 131.0.72.0/22;
    set_real_ip_from 2400:cb00::/32;
    set_real_ip_from 2606:4700::/32;
    set_real_ip_from 2803:f800::/32;
    set_real_ip_from 2405:b500::/32;
    set_real_ip_from 2405:8100::/32;
    set_real_ip_from 2a06:98c0::/29;
    set_real_ip_from 2c0f:f248::/32;
    
    real_ip_header CF-Connecting-IP;
    # ===============================================
    
    # Serve static assets directly
    location ~* \.(js|css|png|jpg|jpeg|gif|ico|svg|woff|woff2|ttf|eot)$ {
        try_files $uri $uri/ =404;
        expires 1y;
        add_header Cache-Control "public, immutable";
    }
    
    # Proxy API requests to Node.js server
    location /api {
        proxy_pass http://127.0.0.1:5001;
        proxy_http_version 1.1;
        proxy_set_header Upgrade $http_upgrade;
        proxy_set_header Connection 'upgrade';
        proxy_set_header Host $host;
        proxy_set_header X-Real-IP $remote_addr;
        proxy_set_header X-Forwarded-For $proxy_add_x_forwarded_for;
        proxy_set_header X-Forwarded-Proto $scheme;
        proxy_cache_bypass $http_upgrade;
        proxy_read_timeout 300s;
    }
    
    # Proxy uploads requests to Node.js server
    location /uploads {
        proxy_pass http://127.0.0.1:5001;
        proxy_http_version 1.1;
        proxy_set_header Upgrade $http_upgrade;
        proxy_set_header Connection 'upgrade';
        proxy_set_header Host $host;
        proxy_set_header X-Real-IP $remote_addr;
        proxy_set_header X-Forwarded-For $proxy_add_x_forwarded_for;
        proxy_set_header X-Forwarded-Proto $scheme;
        proxy_cache_bypass $http_upgrade;
        
        # Allow larger file uploads
        client_max_body_size 50M;
    }
    
    # Health check endpoint
    location /health {
        access_log off;
        return 200 "healthy\n";
        add_header Content-Type text/plain;
    }
    
    # Serve built React app files directly
    location / {
        try_files $uri $uri/ @fallback;
    }
    
    # Fallback to API for API routes and server-side rendering
    location @fallback {
        proxy_pass http://127.0.0.1:5001;
        proxy_http_version 1.1;
        proxy_set_header Upgrade $http_upgrade;
        proxy_set_header Connection 'upgrade';
        proxy_set_header Host $host;
        proxy_set_header X-Real-IP $remote_addr;
        proxy_set_header X-Forwarded-For $proxy_add_x_forwarded_for;
        proxy_set_header X-Forwarded-Proto $scheme;
        proxy_cache_bypass $http_upgrade;
    }
    
    # Security headers
    add_header X-Frame-Options "SAMEORIGIN" always;
    add_header X-XSS-Protection "1; mode=block" always;
    add_header X-Content-Type-Options "nosniff" always;
    add_header Referrer-Policy "no-referrer-when-downgrade" always;
    
    # Block access to hidden files
    location ~ /\. {
        deny all;
    }
}
```
}

## Shell Script Design

The shell script will be named `mega-start.sh` and will include the following functionality:

```bash
#!/bin/bash

# Ollama-Reader Production Deployment Script

set -e  # Exit immediately if a command exits with a non-zero status

# Colors for output formatting
RED='\033[0;31m'
GREEN='\033[0;32m'
YELLOW='\033[1;33m'
NC='\033[0m' # No Color

# Function to print colored output
print_status() {
    echo -e "${GREEN}[INFO]${NC} $1"
}

print_warning() {
    echo -e "${YELLOW}[WARNING]${NC} $1"
}

print_error() {
    echo -e "${RED}[ERROR]${NC} $1"
}

# Check if Node.js is installed
if ! command -v node &> /dev/null; then
    print_error "Node.js is not installed. Please install Node.js before running this script."
    exit 1
fi

# Check if npm is installed
if ! command -v npm &> /dev/null; then
    print_error "npm is not installed. Please install npm before running this script."
    exit 1
fi

# Check if PM2 is installed
if ! command -v pm2 &> /dev/null; then
    print_warning "PM2 is not installed. Installing PM2..."
    npm install -g pm2
fi

print_status "Starting Ollama-Reader production deployment process..."

# Install dependencies
print_status "Installing dependencies..."
npm install

# Run database migrations
print_status "Running database migrations..."
npx drizzle-kit push

# Build the frontend for production
print_status "Building frontend for production..."
npm run build

# Export environment variables for production
print_status "Setting up environment variables..."
export NODE_ENV=production

# Start the application using PM2 for production in fork mode
print_status "Starting Ollama-Reader application on port 5001..."

# Check if the application is already running and restart if needed
if pm2 list | grep -q "ollama-reader"; then
    print_status "Application already running. Stopping..."
    pm2 stop ollama-reader
    pm2 delete ollama-reader
    print_status "Starting fresh instance..."
fi

# Start in fork mode with environment variables
pm2 start server/index.ts --name "ollama-reader" --interpreter tsx --node-args="--import=tsx" -- --port=5001 --update-env

print_status "Ollama-Reader application is now running!"
print_status "Use 'pm2 status' to check application status"
print_status "Use 'pm2 stop ollama-reader' to stop the application"
print_status "Use 'pm2 logs ollama-reader' to view application logs"
```

## Step-by-Step Deployment Commands

If you prefer to run the deployment manually instead of using the script, here are the commands to execute in sequence:

1. Install dependencies:
   ```bash
   npm install
   ```

2. Run database migrations:
   ```bash
   npx drizzle-kit push
   ```

3. Build the frontend for production:
   ```bash
   npm run build
   ```

4. Start the backend server:
   ```bash
   npm run dev
   ```

## Nginx Configuration Setup

To make the application accessible at reader.market, you need to configure nginx:

1. Create the nginx configuration file:
   ```bash
   sudo nano /etc/nginx/sites-available/reader.market
   ```

2. Add the nginx configuration provided in the earlier section of this document

3. Create a symbolic link to enable the site:
   ```bash
   sudo ln -s /etc/nginx/sites-available/reader.market /etc/nginx/sites-enabled/
   ```

4. Update the SSL certificate paths in the configuration to match your Let's Encrypt certificates

5. Test nginx configuration:
   ```bash
   sudo nginx -t
   ```

6. Reload nginx:
   ```bash
   sudo systemctl reload nginx
   # or
   sudo systemctl restart nginx
   ```

After these steps, your application should be accessible at https://reader.market

## Troubleshooting 502 Bad Gateway Error

If you're getting a 502 Bad Gateway error, it means nginx cannot reach your backend application. Follow these steps to troubleshoot:

1. First, verify that your application is running:
   ```bash
   # Check if the Node.js process is running on port 5001
   netstat -tulpn | grep :5001
   # or
   ss -tulpn | grep :5001
   ```

2. Check if your application is properly started:
   ```bash
   # Make sure your application is running
   # You can run your mega-start.sh script in a screen/tmux session:
   screen -S ollama-app
   ./mega-start.sh
   # Then detach with Ctrl+A, D
   ```

3. Check application logs:
   ```bash
   # Check nginx error logs
   sudo tail -f /var/log/nginx/reader.market.error.log
   
   # Check nginx access logs
   sudo tail -f /var/log/nginx/reader.market.access.log
   ```

4. Test the backend directly:
   ```bash
   # Test if the backend is responding on port 5001
   curl http://localhost:5001
   # or
   curl http://127.0.0.1:5001
   ```

5. If the application is not running on port 5001, you may need to update your server configuration to properly bind to the correct port.

6. Make sure your .env file has the correct database connection settings and all required environment variables are set.

7. If you're running the application in the background, make sure it's running with proper environment variables:
   ```bash
   # Set environment variables and run the application
   export NODE_ENV=production
   npm run dev
   ```

## Troubleshooting Vite Development Paths Error

If you're seeing URLs with `@fs/` paths like `@fs/var/www/reader.market/node_modules/.vite/deps/`, this indicates that the application is trying to use Vite's development server in production. This happens when:

1. The frontend wasn't properly built for production
2. The nginx configuration is not serving the built files correctly

To fix this issue:

1. Make sure the frontend is properly built:
   ```bash
   npm run build
   # This should create a dist/ folder with the production build
   ```

2. Verify the build files exist:
   ```bash
   ls -la dist/
   ```

3. Update your nginx configuration to serve static files first before proxying to the backend

4. Make sure you're not running the Vite development server in production - only the Express backend server should be running

5. The production build should be served as static files by nginx, not through the Vite development server

## Troubleshooting Application Port Binding

The application might not be properly binding to port 5001. To verify and fix this:

1. Check the server configuration in `server/index.ts` to ensure it's listening on the correct port:
   ```bash
   # Look for the port configuration in the server file
   grep -n "port\|listen" server/index.ts
   ```

2. Make sure the server is configured to listen on all interfaces, not just localhost:
   ```javascript
   // In server/index.ts, the server should bind to all interfaces
   const port = parseInt(process.env.PORT || "3000", 10);
   httpServer.listen(
     port,
     '0.0.0.0',  // Ensure it listens on all interfaces, not just localhost
     () => {
       log(`serving on port ${port}`);
     }
   );
   // Not app.listen(PORT, 'localhost', ...)
   ```

3. Test if the server is accessible on the server itself:
   ```bash
   # Test if the server responds locally
   curl -v http://localhost:5001
   curl -v http://127.0.0.1:5001
   curl -v http://0.0.0.0:5001
   ```

4. Check if the server code properly binds to all interfaces:
   ```bash
   # Look at the exact server listen configuration
   grep -A 10 -B 5 "httpServer.listen" server/index.ts
   
   # The server should have host: "0.0.0.0" in the options object like this:
   # httpServer.listen({
   #   port,
   #   host: "0.0.0.0",
   #   reusePort: false,
   # });
   ```

5. Check if the server is actually listening on port 5001:
   ```bash
   # Check if anything is listening on port 5001
   netstat -tlnp | grep :5001
   # or
   ss -tlnp | grep :5001
   
   # Check if the process is running
   lsof -i :5001
   ```

6. Check PM2 logs for runtime errors:
   ```bash
   # Check the application logs for any runtime errors
   pm2 logs ollama-reader --lines 50
   
   # Check if the server properly started and bound to the port
   pm2 monit  # This will show real-time status and any errors
   
   # If the server is crashing after startup, the logs will show the error
   # Common issues include database connection problems or missing environment variables
   ```

## Troubleshooting PM2 Interpreter Issues

If you encounter PM2 interpreter errors like "Interpreter bun is NOT AVAILABLE in PATH", this indicates PM2 is trying to use an incorrect interpreter. To fix this:

1. Make sure tsx is installed:
   ```bash
   npm install -g tsx
   ```

2. Update the PM2 startup command to use the correct interpreter:
   ```bash
   # For newer Node.js versions (v20.6.0+), use --import instead of --loader
   pm2 start server/index.ts --name "ollama-reader" --interpreter tsx --node-args="--import=tsx" -- --port=5001
   ```

3. Check PM2 logs for more details:
   ```bash
   pm2 logs ollama-reader
   ```

4. If PM2 starts multiple instances in cluster mode, you may need to stop and start in fork mode only:
   ```bash
   pm2 stop ollama-reader
   pm2 delete ollama-reader
   pm2 start server/index.ts --name "ollama-reader" --interpreter tsx --node-args="--loader=tsx" -- --port=5001
   ```

5. Verify the application is listening on the correct port:
   ```bash
   # Check if the application is listening on port 5001
   netstat -tlnp | grep :5001
   # or
   ss -tlnp | grep :5001
   
   # Test the application directly
   curl http://localhost:5001

7. Fix the __dirname issue in ES modules:
   ```bash
   # The error shows __dirname is not defined in server/static.ts
   # This is a common issue with ES modules in Node.js
   # Check the problematic file:
   cat server/static.ts
   
   # If it uses __dirname, it needs to be updated for ES modules:
   # import { fileURLToPath } from 'url';
   # import path from 'path';
   # const __filename = fileURLToPath(import.meta.url);
   # const __dirname = path.dirname(__filename);
   ```
   ```

6. Check application logs for binding issues:
   ```bash
   # Check the application logs for any errors
   pm2 logs ollama-reader
   
   # Look specifically for port binding messages
   pm2 logs ollama-reader --lines 50 | grep -i "port\|listen\|bind\|error\|5001"
   ```
```