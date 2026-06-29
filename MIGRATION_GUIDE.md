# Project Reorganization - Migration Guide

This guide helps developers update their code after the project reorganization.

## 🔄 Import Path Changes

### Backend: Module Imports

**Before (Old Structure):**
```javascript
const cropController = require('../controllers/cropController');
const cropModel = require('../models/cropModel');
const traceService = require('../services/traceService');
```

**After (New Structure):**
```javascript
const cropController = require('../../modules/crop/controllers/cropController');
const cropModel = require('../../modules/crop/models/cropModel');
const traceService = require('../../services/trace/traceService');
```

### Backend: Config Imports

**Before:**
```javascript
const dbConfig = require('../config/db');
```

**After:**
```javascript
const dbConfig = require('../../config/db');
```

### Backend: Middleware Imports

**Before:**
```javascript
const authMiddleware = require('../middleware/authMiddleware');
```

**After:**
```javascript
const authMiddleware = require('../../middleware/authMiddleware');
```

### Backend: Utils Imports

**Before:**
```javascript
const jwt = require('../utils/jwt');
```

**After:**
```javascript
const jwt = require('../../utils/jwt');
```

## 📝 Frontend: Video Generator Integration

### Updating Frontend API Calls

**Old path:**
```javascript
const api = 'http://localhost:8000';
```

**New location:** `video-generator/api.py` (running on same port 8000)

**No code changes needed** - just ensure the service is running:
```bash
cd video-generator
python -m uvicorn api:app --host 127.0.0.1 --port 8000
```

## 🗂️ Backend App Setup

### Updating app.js

**Old:**
```javascript
const cropRoutes = require('./routes/cropRoutes');
app.use('/api/crops', cropRoutes);
```

**New:**
```javascript
const cropRoutes = require('./routes/cropRoutes');
// or
const cropRoutes = require('./modules/crop/routes/cropRoutes');
app.use('/api/crops', cropRoutes);
```

### Updating Server Entry Point

**Old (backend/server.js):**
```javascript
const app = require('./app');
```

**New (backend/server.js):**
```javascript
const app = require('./src/app');
```

## 📦 Module Structure Within Apps

### Service Layer Pattern

Each module should export services for use by other modules:

```javascript
// backend/src/modules/crop/index.js
module.exports = {
  controller: require('./controllers/cropController'),
  service: require('./services/cropService'),
  model: require('./models/cropModel'),
  routes: require('./routes/cropRoutes')
};
```

## 🔗 Cross-Module Dependencies

### Accessing Shared Services

**Import shared services:**
```javascript
// In any module service or controller
const cloudinaryService = require('../../../services/cloudinary/cloudinaryService');
const traceService = require('../../../services/trace/traceService');
const mailService = require('../../../services/mail/mailService');
```

## 🐍 Python Video Generator

### Imports for Video Service

**API imports:**
```python
from fastapi import FastAPI, HTTPException
from api import app
from pipeline import render_video
from config import settings
```

## ✅ Testing After Migration

### Run each module test:
```bash
cd backend
npm test -- modules/crop
npm test -- modules/harvest
npm test -- modules/trace
```

### Verify routes:
```bash
curl http://localhost:3000/api/crops
curl http://localhost:3000/api/harvests
curl http://localhost:3000/api/traces
```

### Test video generator:
```bash
curl http://localhost:8000/health
```

## 🚀 Deployment Updates

### Backend Build Command:
```bash
cd backend
npm install
npm run build  # or create build script if needed
npm start      # Runs from server.js which requires src/app
```

### Video Generator Build:
```bash
cd video-generator
pip install -r requirements.txt
python -m uvicorn api:app --host 0.0.0.0 --port 8000
```

### Frontend Build:
```bash
cd frontend
npm install
npm run build
# Output goes to dist/
```

## 📋 Checklist for Code Migration

- [ ] Update all relative imports in `backend/src/**/*.js`
- [ ] Update `backend/server.js` to point to new `src/app.js`
- [ ] Update main `backend/app.js` to use new route structures
- [ ] Verify all module routes are properly registered
- [ ] Test all API endpoints
- [ ] Update CI/CD pipelines if applicable
- [ ] Update development environment documentation
- [ ] Test video generator endpoints
- [ ] Verify cross-module service dependencies
- [ ] Run full integration tests

## 🆘 Common Issues

### Issue: Module not found error
**Solution:** Check relative path depth - you may need `../` or `../../` more times
```javascript
// In a deep file, you might need:
const service = require('../../../../services/trace/traceService');
```

### Issue: Routes not registered
**Solution:** Check if routes are properly exported and imported in `backend/src/routes/index.js`

### Issue: Video generator connection refused
**Solution:** Ensure video generator is running:
```bash
cd video-generator && python -m uvicorn api:app --host 127.0.0.1 --port 8000
```

### Issue: Frontend API calls failing
**Solution:** Check CORS configuration in `backend/src/middleware/` and video-generator `.env`

## 📞 Support

For detailed structure info, see:
- `docs/Architecture.md` - System design
- `REORGANIZATION.md` - Migration details
- Module-specific READMEs in each service

---

**Migration Guide Version**: 1.0
**Last Updated**: June 2026
