# 🚀 TraceNew Complete Setup & Startup Guide

## ✅ Prerequisites

Before starting, ensure you have installed:
- **Node.js 16+** (https://nodejs.org/)
- **Python 3.12+** (https://www.python.org/)
- **Git** (optional, for version control)

### Verify Installation
```bash
node --version    # Should be v16+
npm --version     # Usually comes with Node.js
python --version  # Should be 3.12+
pip --version     # Should come with Python
```

---

## 📦 Installation Steps

### Step 1: Backend Setup

**Location: `backend/` directory**

```bash
# Navigate to backend
cd backend

# Install Node dependencies
npm install

# Create environment file
cp .env.example .env

# Edit .env with your settings (database, JWT secret, etc.)
# Use your favorite editor to update:
# - PORT=3000
# - JWT_SECRET=your_secret_key
# - PG_USER, PG_PASSWORD, etc.
```

**What gets installed:**
- Express.js framework
- Database clients
- Middleware packages
- Authentication libraries

---

### Step 2: Video Generator Setup

**Location: `video-generator/` directory**

```bash
# Navigate to video-generator
cd video-generator

# Create Python virtual environment (Python 3.12)
python -m venv .venv

# Activate virtual environment
# On Windows:
.venv\Scripts\activate

# On macOS/Linux:
source .venv/bin/activate

# Your prompt should now show (.venv) prefix

# Upgrade pip
python -m pip install --upgrade pip

# Install Python dependencies
pip install -r requirements.txt

# Create environment file
# Copy and create .env manually or leave default:
# CORS_ORIGINS=http://localhost:5173,http://localhost:3000
# PORT=8000
```

**What gets installed:**
- FastAPI framework
- MoviePy for video rendering
- Cloudinary SDK
- PIL/Pillow for image processing
- Uvicorn server

**Installation Time:** ~2-5 minutes (depends on internet speed)

---

### Step 3: Frontend Setup

**Location: `frontend/` directory**

```bash
# Navigate to frontend
cd frontend

# Install Node dependencies
npm install

# Create environment file
cp .env.example .env

# Verify .env contains:
# VITE_VIDEO_GENERATOR_URL=http://localhost:8000
# VITE_API_BASE_URL=http://localhost:3000/api
```

**What gets installed:**
- React 19+
- Vite build tool
- Development server
- UI dependencies

---

## 🎬 Starting the Services

### Terminal 1: Start Backend Server

```bash
# From project root
cd backend

# Start development server
npm run dev

# Or start with npm start
npm start

# Expected output:
# ✓ TraceNew Backend Server running on http://localhost:3000
# ✓ API Base URL: http://localhost:3000/api
# ✓ Health Check: http://localhost:3000/api/health
```

**What this does:**
- Starts Express.js server
- Loads routes from `src/modules/`
- Listens on port 3000

---

### Terminal 2: Start Video Generator Service

```bash
# From project root
cd video-generator

# Activate virtual environment (if not already active)
# Windows:
.venv\Scripts\activate

# macOS/Linux:
source .venv/bin/activate

# Start FastAPI server
python -m uvicorn api:app --host 127.0.0.1 --port 8000

# Expected output:
# INFO:     Uvicorn running on http://127.0.0.1:8000 (Press CTRL+C to quit)
# INFO:     Application startup complete.
```

**What this does:**
- Starts FastAPI server for video generation
- Listens on port 8000
- Makes video endpoints available

---

### Terminal 3: Start Frontend Development Server

```bash
# From project root
cd frontend

# Start Vite dev server
npm run dev

# Expected output:
# VITE v8.0.12 ready in XXX ms
# ➜  Local:   http://localhost:5173/
# ➜  press h to show help
```

**What this does:**
- Starts Vite development server
- Watches for file changes
- Provides hot module reloading

---

## ✅ Verify Everything is Running

Once all three services are running, verify:

### 1. Backend Health Check
```bash
curl http://localhost:3000/api/health
# Expected response: {"status":"OK","message":"Backend server is running"}
```

### 2. Frontend Access
- Open browser: http://localhost:5173

### 3. Video Generator Health
```bash
curl http://localhost:8000/docs
# Should open API documentation page
```

---

## 📁 Directory Structure Verification

After installation, verify this structure:

```
TraceNew/
├── backend/
│   ├── src/
│   │   ├── app.js                    ← Main Express app
│   │   ├── config/                   ← Configuration files
│   │   ├── middleware/               ← Express middleware
│   │   ├── modules/                  ← Feature modules (14 modules)
│   │   ├── services/                 ← Shared services
│   │   ├── utils/                    ← Utilities
│   │   └── routes/                   ← Main routes
│   ├── server.js                     ← Entry point
│   ├── .env                          ← Environment variables (not in git)
│   └── package.json
│
├── video-generator/
│   ├── .venv/                        ← Python virtual environment
│   ├── api.py                        ← FastAPI app
│   ├── pipeline.py                   ← Video rendering
│   ├── requirements.txt              ← Python dependencies
│   └── assets/
│       └── audio/bgm.mpeg
│
├── frontend/
│   ├── src/
│   │   ├── api/                      ← API client
│   │   ├── pages/                    ← React pages
│   │   ├── components/               ← React components
│   │   └── main.jsx
│   ├── .env                          ← Environment variables
│   └── package.json
│
└── docs/
    ├── Architecture.md
    ├── API.md
    └── Database.md
```

---

## 🛠️ Troubleshooting

### Backend Issues

**Error: "Cannot find module './src/app'"**
- ✅ Solution: Ensure `backend/src/app.js` exists
- Check: `ls backend/src/app.js`

**Error: "Port 3000 already in use"**
- ✅ Solution: Change PORT in `.env` or kill the process using port 3000
- Windows: `netstat -ano | findstr :3000`
- macOS/Linux: `lsof -i :3000`

**Error: "Cannot connect to database"**
- ✅ Solution: Check database connection in `.env`
- Verify: PostgreSQL/MySQL is running
- Check: PG_HOST, PG_USER, PG_PASSWORD, PG_PORT

---

### Video Generator Issues

**Error: "ModuleNotFoundError: No module named 'fastapi'"**
- ✅ Solution: Activate virtual environment and reinstall
```bash
cd video-generator
.venv\Scripts\activate
pip install -r requirements.txt
```

**Error: "Port 8000 already in use"**
- ✅ Solution: Use different port
```bash
python -m uvicorn api:app --host 127.0.0.1 --port 8001
# Update frontend VITE_VIDEO_GENERATOR_URL=http://localhost:8001
```

**Error: "pydantic_core not found"**
- ✅ Solution: Python version mismatch, reinstall venv
```bash
rm -rf .venv
python -m venv .venv
.venv\Scripts\activate
pip install -r requirements.txt
```

---

### Frontend Issues

**Error: "Failed to fetch from http://localhost:3000"**
- ✅ Solution: Backend not running
- Check: `curl http://localhost:3000/api/health`
- Start backend if not running

**Error: "CORS error in console"**
- ✅ Solution: Check backend CORS configuration
- Verify: Backend has CORS middleware enabled

**Error: "npm ERR! code ERESOLVE"**
- ✅ Solution: Force npm to ignore conflicts
```bash
npm install --legacy-peer-deps
```

---

## 🔄 Common Development Workflow

### Development Mode (with hot reload)

**Terminal 1 - Backend:**
```bash
cd backend
npm run dev
```

**Terminal 2 - Video Generator:**
```bash
cd video-generator
.venv\Scripts\activate
python -m uvicorn api:app --reload
```

**Terminal 3 - Frontend:**
```bash
cd frontend
npm run dev
```

---

## 📝 Environment Variables Reference

### Backend (.env)
```env
NODE_ENV=development
PORT=3000
JWT_SECRET=your_jwt_secret_key_here

# Database
PG_USER=postgres
PG_HOST=localhost
PG_DATABASE=tracenew
PG_PASSWORD=your_password
PG_PORT=5432

# Cloudinary
CLOUDINARY_CLOUD_NAME=your_cloud_name
CLOUDINARY_API_KEY=your_api_key
CLOUDINARY_API_SECRET=your_api_secret

# Video Generator
VIDEO_GENERATOR_URL=http://localhost:8000
```

### Video Generator (.env)
```env
HOST=127.0.0.1
PORT=8000
CORS_ORIGINS=http://localhost:5173,http://localhost:3000
CLOUDINARY_CLOUD_NAME=your_cloud_name
```

### Frontend (.env)
```env
VITE_API_BASE_URL=http://localhost:3000/api
VITE_VIDEO_GENERATOR_URL=http://localhost:8000
```

---

## 🎯 Quick Start Checklist

- [ ] Node.js 16+ installed
- [ ] Python 3.12+ installed
- [ ] Backend dependencies installed (`npm install`)
- [ ] Backend `.env` configured
- [ ] Video generator venv created and activated
- [ ] Video generator dependencies installed (`pip install -r requirements.txt`)
- [ ] Frontend dependencies installed (`npm install`)
- [ ] Frontend `.env` configured
- [ ] All three services started in separate terminals
- [ ] Verified http://localhost:3000/api/health returns 200
- [ ] Verified http://localhost:8000/docs accessible
- [ ] Verified http://localhost:5173 loads frontend

---

## 🆘 Still Having Issues?

1. **Check logs**: Look at terminal output for error messages
2. **Verify ports**: Ensure ports 3000, 8000, 5173 are free
3. **Check paths**: Ensure all file paths match the new structure
4. **Restart services**: Kill and restart each service
5. **Clear cache**: Delete `node_modules`, `.next`, `dist` folders and reinstall
6. **Update paths in code**: Some files may need import path updates (see MIGRATION_GUIDE.md)

---

**Happy Coding! 🚀**

For more details, see:
- `MIGRATION_GUIDE.md` - Code update guidelines
- `docs/Architecture.md` - System architecture
- `docs/API.md` - API documentation
