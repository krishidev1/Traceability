# 🎯 TraceNew Quick Commands Reference

## ⚡ Ultra-Quick Start (Copy & Paste)

### Setup All (First Time Only)

**Windows:**
```powershell
.\quick-start.ps1
```

**macOS/Linux:**
```bash
bash ./quick-start.sh
```

---

## 🚀 Start Services (After Setup)

### Option 1: Start All Three in Separate Terminals

**Terminal 1 - Backend Server:**
```bash
cd backend
npm run dev
```

**Terminal 2 - Video Generator (Python):**
```bash
cd video-generator
# Windows:
.venv\Scripts\activate
# macOS/Linux:
source .venv/bin/activate

python -m uvicorn api:app --host 127.0.0.1 --port 8000
```

**Terminal 3 - Frontend Dev Server:**
```bash
cd frontend
npm run dev
```

---

## 📦 Installation Commands Only

### Backend Installation
```bash
cd backend
npm install
cp .env.example .env
# Edit .env with your settings
```

### Video Generator Installation
```bash
cd video-generator
python -m venv .venv

# Activate venv
# Windows:
.venv\Scripts\activate
# macOS/Linux:
source .venv/bin/activate

python -m pip install --upgrade pip
pip install -r requirements.txt
```

### Frontend Installation
```bash
cd frontend
npm install
cp .env.example .env
```

---

## 🔧 Development Commands

### Backend Development
```bash
cd backend

# Install dependencies
npm install

# Run development server (with hot reload)
npm run dev

# Run production build
npm run build

# Run tests
npm test

# Lint code
npm run lint
```

### Video Generator Development
```bash
cd video-generator

# Activate venv (Windows)
.venv\Scripts\activate

# Activate venv (macOS/Linux)
source .venv/bin/activate

# Run with auto-reload
python -m uvicorn api:app --reload

# Run on specific port
python -m uvicorn api:app --host 127.0.0.1 --port 8001

# Run with logging
python -m uvicorn api:app --log-level debug
```

### Frontend Development
```bash
cd frontend

# Install dependencies
npm install

# Start dev server
npm run dev

# Build for production
npm run build

# Preview production build
npm run preview

# Lint code
npm run lint
```

---

## ✅ Verification Commands

### Check Backend Status
```bash
# Health check
curl http://localhost:3000/api/health

# List all routes
curl http://localhost:3000/

# Get JSON response
curl http://localhost:3000/api/health -H "Content-Type: application/json"
```

### Check Video Generator Status
```bash
# View API docs
curl http://localhost:8000/docs

# Check health
curl http://localhost:8000/health

# List endpoints
curl http://localhost:8000/openapi.json
```

### Check Frontend
```bash
# Open in browser
# Windows:
start http://localhost:5173

# macOS:
open http://localhost:5173

# Linux:
xdg-open http://localhost:5173
```

---

## 🐛 Troubleshooting Commands

### Check Port Usage

**Windows:**
```powershell
# Check port 3000
netstat -ano | findstr :3000

# Check port 8000
netstat -ano | findstr :8000

# Check port 5173
netstat -ano | findstr :5173

# Kill process on port 3000
Stop-Process -Id <PID> -Force
```

**macOS/Linux:**
```bash
# Check port 3000
lsof -i :3000

# Check port 8000
lsof -i :8000

# Kill process
kill -9 <PID>
```

### Clear Cache & Reinstall

**Backend:**
```bash
cd backend
rm -r node_modules
rm package-lock.json
npm install
```

**Video Generator:**
```bash
cd video-generator
rm -rf .venv
python -m venv .venv
.venv\Scripts\activate  # or: source .venv/bin/activate
pip install -r requirements.txt
```

**Frontend:**
```bash
cd frontend
rm -r node_modules
rm package-lock.json
npm install
```

---

## 📝 Environment Configuration

### Create .env Files

**Backend (.env):**
```bash
cd backend
cat > .env << EOF
NODE_ENV=development
PORT=3000
JWT_SECRET=your_secret_key_here
PG_USER=postgres
PG_HOST=localhost
PG_DATABASE=tracenew
PG_PASSWORD=your_password
PG_PORT=5432
VIDEO_GENERATOR_URL=http://localhost:8000
EOF
```

**Video Generator (.env):**
```bash
cd video-generator
cat > .env << EOF
HOST=127.0.0.1
PORT=8000
CORS_ORIGINS=http://localhost:5173,http://localhost:3000
EOF
```

**Frontend (.env):**
```bash
cd frontend
cat > .env << EOF
VITE_API_BASE_URL=http://localhost:3000/api
VITE_VIDEO_GENERATOR_URL=http://localhost:8000
VITE_APP_NAME=TraceNew
EOF
```

---

## 🧪 Test Endpoints

### Backend Endpoints (via curl)

```bash
# Health check
curl http://localhost:3000/api/health

# Auth login (example)
curl -X POST http://localhost:3000/api/auth/login \
  -H "Content-Type: application/json" \
  -d '{"email":"user@example.com","password":"password"}'

# Get crops
curl http://localhost:3000/api/crops

# Get harvest
curl http://localhost:3000/api/harvest
```

### Video Generator Endpoints

```bash
# View interactive API docs
curl http://localhost:8000/docs

# Render video
curl -X POST http://localhost:8000/render-from-urls \
  -H "Content-Type: application/json" \
  -d '{"images":["url1","url2"],"title":"Test Video"}'
```

---

## 📊 Process Management

### Using npm-run-all (for running multiple commands)

**Install:**
```bash
npm install -g npm-run-all
```

**Run all services:**
```bash
# From project root
npm-run-all --parallel dev:backend dev:video dev:frontend
```

---

## 📋 Docker Commands (Optional)

**Build Docker images:**
```bash
# Backend
cd backend
docker build -t tracenew-backend .

# Video Generator
cd video-generator
docker build -t tracenew-video .

# Run containers
docker run -p 3000:3000 tracenew-backend
docker run -p 8000:8000 tracenew-video
```

---

## 🔄 Git Commands

### Initial Setup
```bash
git init
git add .
git commit -m "Initial commit: TraceNew reorganization"
git remote add origin <your-repo-url>
git push -u origin main
```

### Daily Workflow
```bash
# Check status
git status

# Stage changes
git add .

# Commit
git commit -m "Describe your changes"

# Push
git push

# Pull latest
git pull
```

---

## 📱 Testing in Different Environments

### Local Testing
```bash
# Backend only
cd backend && npm start

# Video generator only
cd video-generator && python -m uvicorn api:app

# Frontend only
cd frontend && npm run dev
```

### Full Integration Test
```bash
# Start all three in separate terminals
# Terminal 1:
cd backend && npm run dev

# Terminal 2:
cd video-generator && .venv\Scripts\activate && python -m uvicorn api:app --host 127.0.0.1 --port 8000

# Terminal 3:
cd frontend && npm run dev

# Then test: http://localhost:5173
```

---

## 🚀 Production Deployment

### Build for Production

```bash
# Backend
cd backend
npm run build

# Frontend
cd frontend
npm run build

# Video Generator (no build needed, just deploy Python)
```

### Start Production Services

```bash
# Backend (production)
cd backend
NODE_ENV=production npm start

# Video Generator (production)
cd video-generator
python -m uvicorn api:app --host 0.0.0.0 --port 8000
```

---

## 💡 Pro Tips

**Tip 1:** Use VS Code integrated terminal to run multiple commands
```bash
# Open 3 terminals in VS Code and run commands simultaneously
```

**Tip 2:** Use screen/tmux on Linux/macOS
```bash
screen -S tracenew
# Run command 1
# Press Ctrl+A, then C to create new window
# Run command 2
```

**Tip 3:** Use Windows Terminal for multiple tabs
```bash
# Open Windows Terminal and create 3 tabs
# Run each command in a different tab
```

**Tip 4:** Monitor logs with tail
```bash
# macOS/Linux
tail -f backend.log

# Windows PowerShell
Get-Content backend.log -Wait
```

---

## 📚 For More Information

- `SETUP.md` - Comprehensive setup guide
- `MIGRATION_GUIDE.md` - Code migration reference
- `docs/Architecture.md` - System architecture
- `docs/API.md` - API documentation
- `video-generator/README.md` - Video service documentation

---

**Happy Coding! 🚀**
