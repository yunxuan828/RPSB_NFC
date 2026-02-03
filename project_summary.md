# NexusCard Admin - Project Summary

## 1. Overview
NexusCard Admin is a full-stack application for managing NFC business cards. It allows administrators to manage companies and employees, view system statistics, and physically write NFC cards using connected hardware.

## 2. Technical Stack

### Frontend (Root)
- **Framework:** React 19 + Vite
- **Language:** TypeScript
- **Styling:** Tailwind CSS + Radix UI (Shadcn-like components)
- **State/Routing:** React Router DOM
- **Charts:** Recharts

### Backend (`/backend`)
- **Framework:** Laravel (PHP)
- **Database:** MySQL (implied by migrations)
- **API:** RESTful API with Sanctum authentication (implied)

### Hardware Service (`/writer-service-v2`)
- **Runtime:** Node.js
- **Key Libraries:** `nfc-pcsc` (NFC hardware interaction), `@taptrack/ndef` (NDEF formatting), `express` (Local API), `morgan` (Logging).
- **Packaging:** Uses `pkg` to bundle as a standalone executable.
- **Note:** `writer-service-v2` is the active version, offering improved CORS handling and logging compared to v1.

## 3. Project Structure

### Root (Frontend)
- **`components/`**: Reusable UI components. `components/ui` contains atomic primitives (buttons, inputs, dialogs).
- **`pages/`**: Main application views:
  - `Dashboard.tsx`: System stats and overview.
  - `Companies.tsx`: Company management.
  - `Users.tsx`: Employee/User management.
  - `WriteCard.tsx`: Interface for writing data to NFC cards.
  - `PublicProfile.tsx`: The public-facing view of a card.
- **`services/`**: API integration layers (`api.ts`, `auth.ts`).

### `/backend` (API)
- **`app/Http/Controllers/`**: Business logic for Auth, Companies, Dashboard, and Employees.
- **`app/Models/`**: Eloquent models (`Company`, `Employee`, `CardActivityLog`).
- **`database/migrations/`**: Database schema definitions.
- **`routes/api.php`**: API endpoint definitions.

### `/writer-service-v2` (Active) & `/writer-service` (Legacy)
- Standalone Node.js microservices intended to run locally on the machine connected to the NFC writer.
- Bridges the web frontend with USB NFC hardware via a local HTTP server.
- **v2** is the preferred implementation with better CORS and network support.

## 4. Deployment & Workflows
1. **Server Deployment (Docker)**: The web application (Frontend + Backend + Database) is deployed via Docker Compose (`deployment/docker/docker-compose.yml`).
2. **Card Management**: Admins create Companies and Employees in the Dashboard.
3. **Card Writing**: The `WriteCard` page talks to the local `writer-service-v2` to encode Employee profile URLs onto physical NFC cards.
4. **Public Access**: Scanning a card leads to the `PublicProfile` view.
