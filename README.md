# TraceNew - Agricultural Product Traceability System

This is the consolidated project guide for the TraceNew platform. It brings together setup, architecture, frontend, backend, and video-generator instructions from the older project documents into a single source of truth.

## Overview

TraceNew is a traceability and agricultural product monitoring platform designed to track agricultural goods from farm to consumer. It includes:

- A Node.js + Express backend for APIs, authentication, and business logic
- A React + Vite frontend for supplier and dashboard workflows
- A Python FastAPI video generator for rendering product traceability videos
- PostgreSQL-compatible database support with schema and migration scripts

## Project Structure

```text
TraceNew/
├── backend/                     # Node.js Express backend
│   ├── src/
│   │   ├── config/
│   │   ├── middleware/
│   │   ├── modules/
│   │   ├── services/
│   │   ├── utils/
│   │   ├── routes/
│   │   └── app.js
│   ├── sql/
│   │   ├── migrations/
│   │   └── scripts/
│   ├── server.js
│   ├── package.json
│   └── Dockerfile
│
├── frontend/                    # React + Vite UI
│   ├── src/
│   ├── public/
│   ├── package.json
│   ├── vite.config.js
│   └── README.md (legacy; now consolidated here)
│
├── video-generator/             # Python FastAPI video service
│   ├── api.py
│   ├── pipeline.py
│   ├── scenes.py
│   ├── config.py
│   ├── cloudinary_uploader.py
│   ├── requirements.txt
│   ├── assets/
│   ├── output/
│   └── README.md (legacy; now consolidated here)
│
├── docs/
│   ├── Architecture.md
│   ├── API.md
│   └── other supporting docs
│
├── docker-compose.yml
├── Dockerfile
├── package.json
├── quick-start.ps1
├── README.md                   # This consolidated guide
├── .gitignore
├── .venv/                      # local Python environment (do not commit)
└── .vscode/
```

## Prerequisites

Before starting, make sure you have:

- Node.js 16+
- npm
- Python 3.12+
- PostgreSQL or another compatible SQL database
- Git (optional but recommended)

Verify the installation:

```bash
node --version
npm --version
python --version
pip --version
```

## Quick Start

### 1. Backend Setup

```bash
cd backend
npm install
```

Create a `.env` file if needed and configure your database, secret key, and app settings. Typical values include:

```env
PORT=3000
JWT_SECRET=your_secret_key
DATABASE_URL=postgresql://user:password@localhost:5432/tracenew
CLOUDINARY_CLOUD_NAME=your_cloud_name
CLOUDINARY_API_KEY=your_api_key
CLOUDINARY_API_SECRET=your_api_secret
```

Run the backend:

```bash
cd backend
npm run dev
# or
npm start
```

The backend serves API routes on:

```text
http://localhost:3000/api
```

### 2. Frontend Setup

```bash
cd frontend
npm install
npm run dev
```

The frontend runs by default on:

```text
http://localhost:5173
```

### 3. Video Generator Setup

```bash
cd video-generator
python -m venv .venv

# Windows
.venv\Scripts\activate

# macOS/Linux
source .venv/bin/activate

pip install -r requirements.txt
python -m uvicorn api:app --host 127.0.0.1 --port 8000
```

The video service is available at:

```text
http://127.0.0.1:8000
```

### Run All Services Together

From the project root:

```bash
npm run dev
```

This starts backend and frontend together. For the Python video service, run it in a separate terminal.

## Backend Modules

The backend is organized by domain modules. Common module types include:

- Controller: handles incoming HTTP requests
- Service: holds application logic
- Model: data access / schema handling
- Route: defines exposed endpoints

Key module areas include:

- `auth`
- `crop`
- `farm`
- `harvest`
- `monitoring`
- `packing`
- `plantation`
- `processImage`
- `sambalpuriBandha`
- `supplierTrace`
- `trace`
- `traceability`
- `userRole`
- `verification`

Authentication service notes:

- The auth routes are served through the backend API gateway
- Auth endpoints are exposed under `/auth/*` and `/api/auth/*` depending on the gateway setup

## Frontend Local Video Generator Setup

This frontend can connect to the local FastAPI video generation service.

```bash
cd frontend
python -m venv .venv
# Windows
.\.venv\Scripts\activate
# Linux/macOS
source .venv/bin/activate
pip install -r src/requirements.txt
npm install
```

Start the backend video service in one terminal and then the frontend in another:

```bash
cd video-generator
python -m uvicorn api:app --host 127.0.0.1 --port 8000
```

```bash
cd frontend
npm run dev
```

The default frontend video service URL is:

```text
http://localhost:8000
```

## Video Generator Service

The Python service is used to generate traceability and production videos from uploaded image data.

### Main endpoints

- `POST /render-from-urls`
- `GET /status/{job_id}`
- `GET /download/{job_id}`
- `POST /cancel/{job_id}`

### Required environment variables

Create a `.env` file inside `video-generator/`:

```env
CORS_ORIGINS=http://localhost:5173,http://localhost:3000
CLOUDINARY_CLOUD_NAME=your_cloud_name
CLOUDINARY_API_KEY=your_api_key
CLOUDINARY_API_SECRET=your_api_secret
MAX_WORKERS=4
BACKEND_URL=http://localhost:3000
```

### Deployment note for relative image URLs

The video generator supports full URLs and also resolves relative image paths by prepending `BACKEND_URL` when needed. This prevents URL errors when frontend requests include paths like `/media/image.jpg`.

## Database and Schema

The project expects SQL schema and migration files under `backend/sql/`.

Useful database-related files include:

- `backend/sql/migrations/001_initial_schema.sql`
- `backend/sql/scripts/*.sql`
- `REQUIRED_DB_TABLES.txt` (legacy, now removed from project cleanup)

To apply the base schema:

```bash
cd backend
psql "$DATABASE_URL" -v ON_ERROR_STOP=1 -f sql/migrations/001_initial_schema.sql
```

## Environment Configuration

### Backend `.env`

```env
NODE_ENV=development
PORT=3000
DATABASE_URL=postgresql://user:password@localhost:5432/tracenew
JWT_SECRET=your_secret_key
CLOUDINARY_CLOUD_NAME=your_cloud_name
CLOUDINARY_API_KEY=your_api_key
CLOUDINARY_API_SECRET=your_api_secret
```

### Frontend `.env`

```env
VITE_API_BASE_URL=http://localhost:3000/api
VITE_VIDEO_GENERATOR_URL=http://localhost:8000
```

### Video Generator `.env`

```env
CORS_ORIGINS=http://localhost:5173,http://localhost:3000
BACKEND_URL=http://localhost:3000
```

## Documentation References

Additional project references:

- [docs/Architecture.md](docs/Architecture.md)
- [docs/API.md](docs/API.md)

## Migration / Reorganization Notes

The project went through a structural reorganization. Main points to remember:

- Backend services now live under `backend/src/modules/...`
- Shared services live under `backend/src/services/...`
- Some earlier docs referenced older import paths; the current code layout should be followed instead
- The project root README is now the single source of setup and troubleshooting guidance

Example import pattern:

```javascript
const cropController = require('../../modules/crop/controllers/cropController');
const traceService = require('../../services/trace/traceService');
```

## Common Tasks

### Start backend

```bash
cd backend
npm run dev
```

### Start frontend

```bash
cd frontend
npm run dev
```

### Start video generator

```bash
cd video-generator
python -m uvicorn api:app --host 127.0.0.1 --port 8000
```

### Build frontend

```bash
cd frontend
npm run build
```

### Install dependencies

```bash
cd backend && npm install
cd frontend && npm install
cd video-generator && pip install -r requirements.txt
```

## Security Notes

- Keep JWT secrets out of source control
- Use environment variables for credentials
- Always validate and sanitize user input
- Use HTTPS in production
- Configure CORS properly for frontend/backend communication

## Notes on Cleanup

The repository has been simplified to keep only the useful project documentation. Duplicate README files and unnecessary `.txt` reference files were removed, and the project now relies on this root README as the main developer guide.

## Support

For project issues, follow the local setup above and verify each service is running on the expected port before debugging deeper application logic.

---

Last updated: 2026-09-17
