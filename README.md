# TraceConnect

TraceConnect is an agricultural product traceability platform. It combines a React frontend, an Express API, PostgreSQL storage, and an optional FastAPI service for generating traceability videos.

## Current stack

- **Frontend:** React 19, Vite 8, Recharts, Lucide React, React Icons
- **Backend:** Node.js, Express 5, PostgreSQL (`pg`), JWT authentication
- **Video generator:** Python 3.12, FastAPI, MoviePy 1.x, Pillow, FFmpeg
- **Optional media services:** Cloudinary for traceability media and generated videos
- **Database:** PostgreSQL 15 is used by the provided Docker Compose configuration

## Repository layout

```text
TraceNew/
├── backend/
│   ├── src/
│   │   ├── app.js
│   │   ├── config/                 # PostgreSQL configuration
│   │   ├── middleware/             # CORS, auth, and error middleware
│   │   ├── modules/                # Domain modules and routes
│   │   └── routes/                 # Authentication routes
│   ├── sql/
│   │   ├── migrations/             # Base schema
│   │   └── scripts/                # Incremental schema/data changes
│   ├── .env.example
│   ├── server.js
│   ├── package.json
│   └── Dockerfile
├── frontend/
│   ├── src/
│   ├── public/
│   ├── package.json
│   └── vite.config.js
├── video-generator/
│   ├── api.py                      # FastAPI application
│   ├── pipeline.py                 # MoviePy rendering pipeline
│   ├── scenes.py
│   ├── helpers.py
│   ├── utils.py
│   ├── config.py
│   ├── cloudinary_uploader.py
│   ├── requirements.txt
│   ├── assets/
│   └── Dockerfile
├── docs/
│   ├── Architecture.md
│   └── API.md
├── docker-compose.yml
├── package.json
└── README.md
```

The generated `frontend/dist/`, `backend/uploads/`, and `video-generator/output/` directories are ignored by Git. Local virtual environments and `.env` files are also ignored.

## Prerequisites

Install the following before starting:

- Node.js and npm
- Python 3.12 or newer
- PostgreSQL, or Docker Desktop for the Compose database
- FFmpeg for local video rendering. The video-generator Docker image installs FFmpeg automatically.

Check the tool versions:

```bash
node --version
npm --version
python --version
pip --version
psql --version
ffmpeg -version
```

## Environment configuration

### Backend

Copy the example file and fill in local values:

```powershell
Copy-Item backend/.env.example backend/.env
```

The current backend configuration uses PostgreSQL variables:

```env
PORT=3000
NODE_ENV=development

PG_USER=postgres
PG_HOST=localhost
PG_DATABASE=tracenew
PG_PASSWORD=your_password
PG_PORT=5432
# Set to true when the database requires SSL.
PG_SSL=false

JWT_SECRET=replace_with_a_long_random_secret
# JWT_SECRET_KEY is also accepted by the auth middleware.

CORS_ORIGINS=http://localhost:5173,http://localhost:3000
VIDEO_GENERATOR_URL=http://localhost:8000
LOG_LEVEL=info
```

The backend also accepts `DATABASE_URL` when no `PG_*` database variables are present. Keep credentials, JWT secrets, SMTP credentials, API keys, and Cloudinary credentials out of source control.

Optional variables in `backend/.env.example` include:

- `CLOUDINARY_CLOUD_NAME`, `CLOUDINARY_API_KEY`, `CLOUDINARY_API_SECRET`
- `SMTP_HOST`, `SMTP_PORT`, `SMTP_USER`, `SMTP_PASSWORD`
- `OPENCAGE_API_KEY`

### Frontend

Create `frontend/.env` only when the defaults need to be changed:

```env
# Either variable name is supported by the API client.
VITE_API_URL=http://localhost:3000
# VITE_API_BASE_URL=http://localhost:3000/api

VITE_VIDEO_GENERATOR_URL=http://localhost:8000
```

The frontend normalizes an API value ending in `/api`, so both `http://localhost:3000` and `http://localhost:3000/api` work. In production, use HTTPS URLs for both services when the frontend is served over HTTPS.

### Video generator

The video service loads a `.env` file from its working directory if one exists. Typical local settings are:

```env
BACKEND_URL=http://localhost:3000
CORS_ORIGINS=http://localhost:5173,http://localhost:3000
OUTPUT_ROOT=output
MAX_PROCESS_IMAGES=12
PROCESS_REVERSE=auto
LOG_LEVEL=INFO
```

Cloudinary upload is disabled by default. To enable it, configure:

```env
CLOUDINARY_ENABLED=1
CLOUDINARY_CLOUD_NAME=your_cloud_name
CLOUDINARY_API_KEY=your_api_key
CLOUDINARY_API_SECRET=your_api_secret
# Alternatively use CLOUDINARY_URL.
CLOUDINARY_FOLDER=maati_videos
```

## Local development

### Install JavaScript dependencies

From the repository root:

```bash
npm install
```

The root `postinstall` script installs dependencies in both `backend/` and `frontend/`. You can also install them separately:

```bash
cd backend && npm install
cd ../frontend && npm install
```

### Start PostgreSQL

Start a local PostgreSQL instance and create a database named `tracenew`, or start the database from Compose:

```bash
docker compose up -d db
```

Apply the base schema from the repository root:

```powershell
psql "$env:DATABASE_URL" -v ON_ERROR_STOP=1 -f backend/sql/migrations/001_initial_schema.sql
```

If using the `PG_*` variables instead of `DATABASE_URL`, connect with your normal `psql` options, for example:

```bash
psql -h localhost -U postgres -d tracenew -v ON_ERROR_STOP=1 -f backend/sql/migrations/001_initial_schema.sql
```

Apply the scripts in `backend/sql/scripts/` only when the corresponding schema/data change is required. They are incremental scripts, not a guaranteed ordered migration runner.

### Start the backend

```bash
cd backend
npm run dev
```

For a normal Node process:

```bash
npm start
```

The backend listens on `http://localhost:3000` by default.

### Start the frontend

In a second terminal:

```bash
cd frontend
npm run dev
```

Vite serves the frontend at `http://localhost:5173` by default.

### Start the video generator

Create a Python virtual environment inside `video-generator`:

```powershell
cd video-generator
python -m venv .venv
.\.venv\Scripts\Activate.ps1
pip install -r requirements.txt
python -m uvicorn api:app --host 127.0.0.1 --port 8000
```

On macOS/Linux, activate it with:

```bash
source .venv/bin/activate
```

The video service is available at `http://localhost:8000`. The frontend can submit both uploaded images and image URLs. Relative image URLs are resolved against `BACKEND_URL`.

### Start frontend and backend together

From the repository root:

```bash
npm run dev
```

This runs the root `concurrently` script, which starts the backend and frontend. It does not start the Python video generator; run that service separately.

## Available scripts

### Root scripts

```bash
npm install              # Install backend and frontend dependencies
npm run dev              # Start backend and frontend together
npm run build            # Build the frontend
npm run build:frontend   # Build the frontend
npm start                # Start the backend
```

### Frontend scripts

```bash
npm run dev
npm run build
npm run lint
npm run preview
```

### Backend scripts

```bash
npm run dev              # nodemon server.js
npm start                # node server.js
```

There is currently no implemented backend test suite; `npm test` is the placeholder script from `backend/package.json`.

## Backend API

The Express application mounts these route groups under `/api`:

| Area | Base path |
| --- | --- |
| Authentication | `/api/auth` |
| Crops | `/api/crops` |
| Harvest | `/api/harvest` |
| Plantation | `/api/plantation` |
| Trace | `/api/trace` |
| Media | `/api/media` |
| Packing | `/api/packing` |
| Monitoring | `/api/monitoring` |
| Verification | `/api/verification` |
| User roles | `/api/userRole` |
| Patch | `/api/patch` |
| Farm | `/api/farm` |
| Sambalpuri Bandha | `/api/sambalpuri` |
| Supplier trace | `/api/supplierTrace` |
| Process image | `/api/processImage` |
| Traceability aggregation | `/api/traceability` |

Authentication routes are also mounted at `/auth` for compatibility. The health endpoint is:

```text
GET http://localhost:3000/api/health
```

Most CRUD modules expose the usual `GET`, `POST`, `PUT`, and `DELETE` operations. The exact request and response shapes are defined in the route controllers and SQL queries; `docs/API.md` contains older examples and should be treated as supplementary rather than authoritative when it differs from the current code.

JWT-protected requests use:

```http
Authorization: Bearer <token>
```

## Video generator API

The FastAPI service keeps jobs in an in-memory store. Job records are cleaned up after approximately 15 minutes, so this service should run as a single instance unless job persistence is added.

### Health and browser UI

```text
GET /
GET /health
```

### Upload-based rendering

```text
POST /render
```

This endpoint accepts multipart form data with `template` (`A`, `B`, or `C`), `logo`, `intro_logo`, `farmer_img`, `farm_img`, one or more `process_images`, `certificate_img`, and `end_img`.

### URL-based rendering

```text
POST /render-from-urls
Content-Type: application/json
```

Example payload:

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

Both render endpoints return a `job_id`. Poll and control the job with:

```text
GET  /status/{job_id}
POST /cancel/{job_id}
GET  /download/{job_id}
```

When rendering finishes, `/status/{job_id}` returns a `download_url` and, when enabled, a Cloudinary URL.

## Docker Compose

The Compose file defines:

- `db`: PostgreSQL 15 on port `5432`
- `app`: backend container on port `3000`
- `video-generator`: FastAPI container on port `8000`

Start the stack with:

```bash
docker compose up --build
```

The current `docker-compose.yml` references a root-level `Dockerfile` for the `app` service, but this checkout does not contain that file. Therefore, the Compose stack is not ready to build unchanged. Either add the intended root backend Dockerfile or change the `app.build.dockerfile` setting to a valid Dockerfile before using the full-stack command.

The existing service Dockerfiles also need deployment review: `backend/Dockerfile` exposes `5000` although the backend defaults to `3000`, and `frontend/Dockerfile` builds a standalone Nginx image rather than being served by the Express fallback. These are container configuration details and do not affect the local development workflow above.

## Production notes

- Set a strong, unique JWT secret and never commit `.env` files.
- Serve the frontend, API, and video generator over HTTPS in production.
- Set `CORS_ORIGINS` to the exact trusted frontend origins.
- Use `PG_SSL=true` or `NODE_ENV=production` when the PostgreSQL deployment requires TLS.
- Use persistent storage or external job tracking if the video generator is scaled beyond one instance.
- Configure Cloudinary only when remote media/video delivery is required.
- Review upload size limits, authentication coverage, and database permissions before exposing the services publicly.

## Documentation

- [Architecture notes](docs/Architecture.md)
- [API notes](docs/API.md)
- [Backend environment template](backend/.env.example)

The source code and mounted routes are the authority for current behavior; some older documentation files still describe paths and structures from earlier versions.

---

Last updated: 2026-10-04
