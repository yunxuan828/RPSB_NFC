<div align="center">
<img width="1200" height="475" alt="GHBanner" src="https://github.com/user-attachments/assets/0aa67016-6eaf-458a-adb2-6e31a0763ed6" />
</div>

# NexusCard Admin - Project Setup

This project consists of three parts:
1. **Laravel API Backend** (runs on server)
2. **React/Vite Frontend** (runs on server, served via Nginx)
3. **NFC Writer Service (v2)** (runs locally on the machine with the USB NFC reader)

## 1. Server Deployment (Docker)

The application (Frontend + Backend + DB) is designed to run via Docker Compose.

```bash
cd deployment/docker
docker-compose up -d --build
```

This starts:
- **Backend (API):** `http://localhost:8000` (internal)
- **Frontend (Nginx):** `http://localhost:8600`
- **Database (MariaDB):** `localhost:3306`
- **PhpMyAdmin:** `http://localhost:8601`

**Configuration:**
- Ensure `.env` is set up in `backend/` (copy from `.env.example`).
- Database credentials in `backend/.env` must match `docker-compose.yml`.

## 2. Local Development (Manual)

If you are not using Docker, you can run services manually.

### Backend (Laravel)
```bash
cd backend
composer install
php artisan migrate
php artisan serve
```

### Frontend (React)
```bash
# Repo root
npm install
npm run dev
```
Update `.env` in the root to point `VITE_API_URL` to your backend.

## 3. NFC Writer Companion (Client-Side)

This service runs on the **operator's machine** (the computer with the physical ACR122U USB reader plugged in). It bridges the web browser to the USB hardware.

**Use `writer-service-v2`**:
```bash
cd writer-service-v2
npm install
npm start
```
- **Port:** `8787`
- **Endpoints:**
  - `GET /status` - Check reader status.
  - `POST /write` - Write URL to card.

**Usage:**
1. Run `npm start` in `writer-service-v2`.
2. Open the Admin Panel (`http://localhost:8600` or your server URL).
3. Go to the "Write Card" page.
4. Ensure the status shows "Connected".
