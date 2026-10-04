<div align="center">

# 🔗 TRACECONNECT

### Digital Traceability Platform for Agricultural Products

**From origin → journey → verification → consumer**

<br>

[![React](https://img.shields.io/badge/Frontend-React%2019-61DAFB?style=for-the-badge&logo=react&logoColor=black)](https://react.dev/)
[![Node.js](https://img.shields.io/badge/Backend-Node.js-339933?style=for-the-badge&logo=node.js&logoColor=white)](https://nodejs.org/)
[![Express](https://img.shields.io/badge/API-Express%205-000000?style=for-the-badge&logo=express&logoColor=white)](https://expressjs.com/)
[![PostgreSQL](https://img.shields.io/badge/Database-PostgreSQL%2015-4169E1?style=for-the-badge&logo=postgresql&logoColor=white)](https://www.postgresql.org/)
[![Python](https://img.shields.io/badge/Video%20Service-Python%203.12-3776AB?style=for-the-badge&logo=python&logoColor=white)](https://www.python.org/)
[![FastAPI](https://img.shields.io/badge/Service-FastAPI-009688?style=for-the-badge&logo=fastapi&logoColor=white)](https://fastapi.tiangolo.com/)

<br>

[![GitHub Repository](https://img.shields.io/badge/VIEW%20SOURCE%20CODE-181717?style=for-the-badge&logo=github&logoColor=white)](https://github.com/krishidev1/Traceability)

</div>

---

## 🌾 ABOUT TRACECONNECT

**TraceConnect** is an agricultural product traceability platform designed to connect a product with its journey through the supply chain.

The platform combines a **React frontend**, **Express API**, **PostgreSQL database**, and an optional **FastAPI-based video generation service**.

The goal is simple:

> **Make the journey of an agricultural product more visible, structured and traceable.**

The repository currently contains the frontend, backend, database scripts, documentation and optional video-generation service. :chatgpt-content-reference{index="1"}

---

# 🚀 WHAT IT DOES

TraceConnect brings together multiple parts of a traceability workflow into one technical platform.

### 🔗 Traceability

Track information associated with agricultural products across their journey.

### 🗄️ Structured Data

Store application and traceability information using **PostgreSQL 15**.

### 🔐 Authentication

Backend authentication is implemented using **JWT-based authentication**.

### 🖥️ Web Application

A modern React-based frontend built with **React 19 and Vite 8**.

### 🎬 Traceability Videos

An optional Python/FastAPI service can generate traceability videos using **MoviePy, Pillow and FFmpeg**.

### ☁️ Media Services

Cloudinary can optionally be used for traceability media and generated videos. :chatgpt-content-reference{index="2"}

---

# 🔄 TRACEABILITY FLOW

```text
                    ┌─────────────────┐
                    │    PRODUCT      │
                    │    ORIGIN       │
                    └────────┬────────┘
                             │
                             ▼
                    ┌─────────────────┐
                    │   TRACEABILITY  │
                    │      DATA       │
                    └────────┬────────┘
                             │
                             ▼
                    ┌─────────────────┐
                    │    PROCESSES    │
                    │   & EVENTS      │
                    └────────┬────────┘
                             │
                             ▼
                    ┌─────────────────┐
                    │   VERIFICATION  │
                    │   & RECORDS     │
                    └────────┬────────┘
                             │
                             ▼
                    ┌─────────────────┐
                    │    CONSUMER     │
                    │    VISIBILITY   │
                    └─────────────────┘
```

---

# 🧩 PLATFORM COMPONENTS

TraceConnect is structured around three major application layers:

```text
┌──────────────────────────────────────────────────────────────┐
│                         TRACECONNECT                         │
├──────────────────────────────────────────────────────────────┤
│                                                              │
│   🌐 FRONTEND                                                │
│   React 19 + Vite + Recharts + UI Libraries                │
│                         │                                    │
│                         ▼                                    │
│   ⚙️ BACKEND                                                 │
│   Node.js + Express 5 + JWT + REST APIs                     │
│                         │                                    │
│                         ▼                                    │
│   🗄️ DATABASE                                                │
│   PostgreSQL 15                                              │
│                                                              │
│                         │                                    │
│                         ▼                                    │
│   🎬 OPTIONAL VIDEO SERVICE                                  │
│   Python + FastAPI + MoviePy + Pillow + FFmpeg              │
│                                                              │
└──────────────────────────────────────────────────────────────┘
```

---

# 🛠️ TECHNOLOGY STACK

## 🌐 Frontend

- React 19
- Vite 8
- Recharts
- Lucide React
- React Icons

## ⚙️ Backend

- Node.js
- Express 5
- PostgreSQL `pg`
- JWT Authentication

## 🎬 Video Generator

- Python 3.12
- FastAPI
- MoviePy 1.x
- Pillow
- FFmpeg

## 🗄️ Database

- PostgreSQL 15

## ☁️ Optional Media Services

- Cloudinary

:chatgpt-content-reference{index="3"}

---

# 📁 PROJECT STRUCTURE

```text
TraceNew/
│
├── backend/
│   ├── src/
│   │   ├── app.js
│   │   ├── config/
│   │   ├── middleware/
│   │   ├── modules/
│   │   └── routes/
│   │
│   ├── sql/
│   │   ├── migrations/
│   │   └── scripts/
│   │
│   ├── .env.example
│   ├── server.js
│   ├── package.json
│   └── Dockerfile
│
├── frontend/
│   ├── src/
│   ├── public/
│   ├── package.json
│   └── vite.config.js
│
├── video-generator/
│   ├── api.py
│   ├── pipeline.py
│   ├── scenes.py
│   ├── helpers.py
│   ├── utils.py
│   ├── config.py
│   ├── cloudinary_uploader.py
│   ├── requirements.txt
│   ├── assets/
│   └── Dockerfile
│
├── docs/
│   ├── Architecture.md
│   └── API.md
│
├── docker-compose.yml
├── package.json
└── README.md
```

:chatgpt-content-reference{index="4"}

---

# ⚡ GETTING STARTED

## 📋 Prerequisites

Before running TraceConnect locally, install:

- Node.js
- npm
- Python 3.12+
- PostgreSQL or Docker Desktop
- FFmpeg for local video rendering

The video-generator Docker image installs FFmpeg automatically. :chatgpt-content-reference{index="5"}

### Check versions

```bash
node --version
npm --version
python --version
pip --version
psql --version
ffmpeg -version
```

---

# 🔐 ENVIRONMENT CONFIGURATION

## Backend

Create your local environment file:

```powershell
Copy-Item backend/.env.example backend/.env
```

Example configuration:

```env
PORT=3000
NODE_ENV=development

PG_USER=postgres
PG_HOST=localhost
PG_DATABASE=tracenew
PG_PASSWORD=your_password
PG_PORT=5432
PG_SSL=false

JWT_SECRET=replace_with_a_long_random_secret

CORS_ORIGINS=http://localhost:5173,http://localhost:3000
VIDEO_GENERATOR_URL=http://localhost:8000
LOG_LEVEL=info
```

The backend can also use `DATABASE_URL` when `PG_*` variables are not provided.

**Never commit:**

- Database passwords
- JWT secrets
- SMTP credentials
- API keys
- Cloudinary credentials
- `.env` files

:chatgpt-content-reference{index="6"}

---

# 🌐 FRONTEND CONFIGURATION

Create `frontend/.env` when you need to override the defaults:

```env
VITE_API_URL=http://localhost:3000

VITE_API_BASE_URL=http://localhost:3000/api

VITE_VIDEO_GENERATOR_URL=http://localhost:8000
```

Both `VITE_API_URL` and `VITE_API_BASE_URL` are supported.

For production deployments, use **HTTPS** when the frontend is served over HTTPS. :chatgpt-content-reference{index="7"}

---

# 🎬 VIDEO GENERATOR

The video generator runs as a separate Python service.

Typical configuration:

```env
BACKEND_URL=http://localhost:3000
CORS_ORIGINS=http://localhost:5173,http://localhost:3000
OUTPUT_ROOT=output
MAX_PROCESS_IMAGES=12
PROCESS_REVERSE=auto
LOG_LEVEL=INFO
```

Optional Cloudinary configuration:

```env
CLOUDINARY_ENABLED=1
CLOUDINARY_CLOUD_NAME=your_cloud_name
CLOUDINARY_API_KEY=your_api_key
CLOUDINARY_API_SECRET=your_api_secret
CLOUDINARY_FOLDER=maati_videos
```

:chatgpt-content-reference{index="8"}

---

# 🚀 LOCAL DEVELOPMENT

## 1️⃣ Install dependencies

From the repository root:

```bash
npm install
```

The root `postinstall` script installs dependencies for both backend and frontend.

Alternatively:

```bash
cd backend
npm install

cd ../frontend
npm install
```

:chatgpt-content-reference{index="9"}

---

## 2️⃣ Start PostgreSQL

Using Docker:

```bash
docker compose up -d db
```

Or use a local PostgreSQL installation.

Create a database named:

```text
tracenew
```

Then apply the initial schema:

```bash
psql -h localhost -U postgres -d tracenew \
-v ON_ERROR_STOP=1 \
-f backend/sql/migrations/001_initial_schema.sql
```

:chatgpt-content-reference{index="10"}

---

## 3️⃣ Start the backend

```bash
cd backend
npm run dev
```

Or:

```bash
npm start
```

Backend:

```text
http://localhost:3000
```

:chatgpt-content-reference{index="11"}

---

## 4️⃣ Start the frontend

Open another terminal:

```bash
cd frontend
npm run dev
```

Frontend:

```text
http://localhost:5173
```

:chatgpt-content-reference{index="12"}

---

## 5️⃣ Start the video generator

```powershell
cd video-generator

python -m venv .venv

.\.venv\Scripts\Activate.ps1

pip install -r requirements.txt

python -m uvicorn api:app --host 127.0.0.1 --port 8000
```

On macOS/Linux:

```bash
source .venv/bin/activate
```

Video service:

```text
http://localhost:8000
```

:chatgpt-content-reference{index="13"}

---

# ⚡ RUN FRONTEND + BACKEND TOGETHER

From the root:

```bash
npm run dev
```

This starts:

```text
Backend
   +
Frontend
```

The Python video generator must still be started separately.

:chatgpt-content-reference{index="14"}

---

# 📜 AVAILABLE COMMANDS

## Root

```bash
npm install
npm run dev
npm run build
npm run build:frontend
npm start
```

## Frontend

```bash
npm run dev
npm run build
npm run lint
npm run preview
```

## Backend

```bash
npm run dev
npm start
```

There is currently no implemented backend test suite; `npm test` remains the placeholder script from `backend/package.json`. :chatgpt-content-reference{index="15"}

---

# 🔌 BACKEND API

The Express application exposes the following API groups:

| Module | Endpoint |
|---|---|
| 🔐 Authentication | `/api/auth` |
| 🌱 Crops | `/api/crops` |
| 🌾 Harvest | `/api/harvest` |
| 🌱 Plantation | `/api/plantation` |
| 🔗 Trace | `/api/trace` |
| 🖼️ Media | `/api/media` |
| 📦 Packing | `/api/packing` |
| 📊 Monitoring | `/api/monitoring` |
| ✅ Verification | `/api/verification` |
| 👤 User Roles | `/api/userRole` |
| 🔧 Patch | `/api/patch` |
| 🚜 Farm | `/api/farm` |
| 🧵 Sambalpuri Bandha | `/api/sambalpuri` |
| 🚚 Supplier Trace | `/api/supplierTrace` |
| 🖼️ Process Image | `/api/processImage` |
| 🔗 Traceability | `/api/traceability` |

:chatgpt-content-reference{index="16"}

### Health Check

```http
GET /api/health
```

### Authentication

Protected requests use:

```http
Authorization: Bearer <token>
```

:chatgpt-content-reference{index="17"}

---

# 🎬 VIDEO GENERATOR API

The FastAPI service provides endpoints for video generation and job management.

### Health

```http
GET /
GET /health
```

### Render from uploads

```http
POST /render
```

### Render from URLs

```http
POST /render-from-urls
Content-Type: application/json
```

Example:

```json
{
  "template": "A",
  "logo_url": "https://example.com/logo.png",
  "intro_logo_url": "https://example.com/intro.png",
  "farmer_img_url": "https://example.com/farmer.jpg",
  "farm_img_url": "https://example.com/farm.jpg",
  "process_image_urls": [
    "https://example.com/process-1.jpg",
    "https://example.com/process-2.jpg"
  ],
  "certificate_img_url": "https://example.com/certificate.jpg",
  "end_img_url": "https://example.com/end.jpg"
}
```

### Job management

```text
GET  /status/{job_id}
POST /cancel/{job_id}
GET  /download/{job_id}
```

Render endpoints return a `job_id`, which can then be used to track and manage the rendering process.

:chatgpt-content-reference{index="18"}

---

# 🐳 DOCKER

The Compose configuration defines:

```text
┌─────────────────────────────────────┐
│          Docker Compose             │
├─────────────────────────────────────┤
│                                     │
│  🗄️ PostgreSQL       :5432          │
│                                     │
│  ⚙️ Backend           :3000          │
│                                     │
│  🎬 Video Generator   :8000          │
│                                     │
└─────────────────────────────────────┘
```

Start the stack:

```bash
docker compose up --build
```

### ⚠️ Current Docker configuration

The current Compose file references a root-level Dockerfile for the `app` service, but the provided checkout does not contain that file.

The repository also contains container configuration that should be reviewed before production deployment, including backend and frontend port/server differences.

Therefore, the full Compose stack **is not currently ready to build unchanged**.

:chatgpt-content-reference{index="19"}

---

# 🔒 PRODUCTION CHECKLIST

Before exposing TraceConnect publicly:

- [ ] Use a strong unique JWT secret
- [ ] Never commit `.env` files
- [ ] Serve services over HTTPS
- [ ] Configure exact trusted CORS origins
- [ ] Enable PostgreSQL TLS when required
- [ ] Review upload limits
- [ ] Review authentication coverage
- [ ] Review database permissions
- [ ] Use persistent job tracking if scaling the video service
- [ ] Configure Cloudinary when remote media delivery is required

:chatgpt-content-reference{index="20"}

---

# 📚 DOCUMENTATION

Additional project documentation:

- 📐 [Architecture Notes](docs/Architecture.md)
- 🔌 [API Documentation](docs/API.md)
- 🔐 [Backend Environment Template](backend/.env.example)

The source code and mounted routes remain the authority for current behavior when older documentation differs from the implementation. :chatgpt-content-reference{index="21"}

---

# 🧠 ENGINEERING NOTE

TraceConnect is structured as more than a simple frontend application.

It brings together:

```text
React
  ↓
REST APIs
  ↓
Node.js / Express
  ↓
PostgreSQL
  ↓
Optional Python / FastAPI
  ↓
Video Processing
  ↓
Optional Cloudinary
```

This separation allows the individual components to evolve independently while working together as a larger traceability system.

---

<div align="center">

### 🔗 TRACECONNECT

**Trace the origin. Understand the journey. Build trust.**

<br>

[![GitHub](https://img.shields.io/badge/EXPLORE%20THE%20CODE-181717?style=for-the-badge&logo=github&logoColor=white)](https://github.com/krishidev1/Traceability)

<br>

**Built with React • Node.js • PostgreSQL • Python**

<br>

⭐ If you find the project interesting, consider giving the repository a star.

</div>

---

<div align="center">

_Last updated: October 2026_

</div>
