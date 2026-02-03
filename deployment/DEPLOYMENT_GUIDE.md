# 🚀 Ritma DBC - Deployment Guide (Docker Version)

> Guide for deploying Ritma Digital Business Card to Linux VPS using Docker.

## 📋 Quick Start

### 1. Requirements
- Linux VPS (Ubuntu/Debian/CentOS/AlmaLinux)
- Docker & Docker Compose installed

### 2. Deployment Steps
1. **Upload Files**: Upload the `nfc-v2` folder containing:
   - `dist/` (Frontend build)
   - `backend/` (Laravel API)
   - `deployment/` (Docker config)

2. **Start Application**:
   ```bash
   cd ~/nfc-v2/deployment/docker
   docker-compose up -d --build
   ```

3. **Initialize Database** (First time only):
   ```bash
   # Run migrations
   docker-compose exec backend php artisan migrate --force
   
   # Generate App Key
   docker-compose exec backend php artisan key:generate
   ```

### 3. Accessing the App
| Service | URL | Default Creds |
|---------|-----|---------------|
| **Frontend** | `http://45.127.6.225:8600` | N/A |
| **API** | `http://45.127.6.225:8600/api` | N/A |
| **Database** | `http://45.127.6.225:8601` | User: `nexuscard_user`<br>Pass: (Check docker-compose.yml) |

### 4. Making Updates
If you change code and re-upload:
```bash
docker-compose up -d --build
```
