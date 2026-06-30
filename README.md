# TraceNew - Agricultural Product Traceability System

A comprehensive platform for tracking agricultural products from farm to consumer, ensuring transparency, quality assurance, and supply chain integrity.

## � Quick Navigation

**New to TraceNew?** Start here based on your needs:

| Task | File | Time |
|------|------|------|
| **First Time Setup** | [SETUP.md](SETUP.md) | 10-15 min |
| **Quick Start Commands** | [COMMANDS.md](COMMANDS.md) | 2 min |
| **Code Migration Reference** | [MIGRATION_GUIDE.md](MIGRATION_GUIDE.md) | 5 min |
| **System Architecture** | [docs/Architecture.md](docs/Architecture.md) | 5 min |
| **API Documentation** | [docs/API.md](docs/API.md) | 10 min |

**For Windows users:**
```powershell
.\quick-start.ps1
```

---

## �🏗️ Project Structure

```
TraceNew/
├── backend/                          # Node.js Express backend
│   ├── src/
│   │   ├── config/                   # Application configuration
│   │   ├── middleware/               # Express middleware
│   │   ├── modules/                  # Feature modules (one per domain)
│   │   ├── services/                 # Shared services
│   │   ├── utils/                    # Utility functions
│   │   ├── routes/                   # Route handlers
│   │   └── app.js                    # Express app initialization
│   ├── sql/                          # Database migrations and scripts
│   ├── uploads/                      # Uploaded files
│   ├── server.js                     # Server entry point
│   └── package.json
│
├── video-generator/                  # Python FastAPI video service
│   ├── api.py                        # FastAPI endpoints
│   ├── pipeline.py                   # Video rendering pipeline
│   ├── assets/                       # Audio, templates, images
│   ├── output/                       # Generated videos
│   ├── requirements.txt              # Python dependencies
│   └── README.md                     # Video generator documentation
│
├── frontend/                         # React + Vite UI
│   ├── src/
│   │   ├── components/               # Reusable React components
│   │   ├── pages/                    # Page components
│   │   ├── api/                      # API client integration
│   │   ├── services/                 # Frontend services
│   │   └── ...
│   ├── public/                       # Static assets
│   └── package.json
│
├── docs/                             # Project documentation
│   ├── Architecture.md               # System architecture
│   ├── API.md                        # API reference
│   └── Database.md                   # Database schema
│
├── .gitignore                        # Git ignore rules
└── README.md                         # This file
```

## 🚀 Quick Start

### Prerequisites
- Node.js 16+ and npm
- Python 3.12+
- SQL Database (MySQL/PostgreSQL)

### Backend Setup

```bash
cd backend

# Install dependencies
npm install

# Configure environment variables
cp .env.example .env
# Edit .env with your settings

# Run migrations (if applicable)
npm run migrate

# Start the server
npm start
# Development mode with auto-reload
npm run dev
```

### Video Generator Setup

```bash
cd video-generator

# Create virtual environment
python3.12 -m venv .venv

# Activate virtual environment
# Windows:
.venv\Scripts\activate
# macOS/Linux:
source .venv/bin/activate

# Install Python dependencies
pip install -r requirements.txt

# Start the video service
python -m uvicorn api:app --host 127.0.0.1 --port 8000
```

### Frontend Setup

```bash
cd frontend

# Install dependencies
npm install

# Create environment file
cp .env.example .env
# Edit .env with backend URL

# Start development server
npm run dev

# Build for production
npm run build
```

## 📦 Backend Modules

Each module follows a consistent structure:
- **Controller**: Handles HTTP requests
- **Service**: Business logic
- **Model**: Data schema
- **Route**: Endpoint definitions

### Available Modules
- `auth` - User authentication and authorization
- `crop` - Crop management
- `plantation` - Farm/plantation data
- `harvest` - Harvest tracking
- `monitoring` - Environmental monitoring
- `packing` - Packaging operations
- `trace` - Traceability chain
- `media` - Media/file management
- `verification` - QR/verification codes
- `sambalpuriBandha` - Special product handling
- `supplierTrace` - Supplier tracking
- `processImage` - Image processing
- `userRole` - Role management
- `farm` - Farm information
- `patch` - Patch/field management

## 🔗 API Integration

### Backend API
- Base URL: `http://localhost:3000/api`
- Authentication: JWT tokens
- See [docs/API.md](docs/API.md) for full API reference

### Video Generator API
- Base URL: `http://localhost:8000`
- Endpoints for rendering, status tracking, and downloads
- See [video-generator/README.md](video-generator/README.md) for details

## 🗄️ Database

SQL database contains tables for:
- Users and authentication
- Crops and plantations
- Harvest records
- Monitoring data
- Packing information
- Traceability chains
- Media files
- Verification codes

See [docs/Database.md](docs/Database.md) for schema details.

## 🛠️ Development

### Common Tasks

**Start all services:**
```bash
# Terminal 1: Backend
cd backend && npm run dev

# Terminal 2: Video Generator
cd video-generator && python -m uvicorn api:app --reload

# Terminal 3: Frontend
cd frontend && npm run dev
```

**Run tests:**
```bash
cd backend && npm test
cd frontend && npm test
```

**Build for production:**
```bash
cd backend && npm run build
cd frontend && npm run build
cd video-generator && pip install -r requirements.txt
```

## 📝 Environment Configuration

### Backend (.env)
```env
NODE_ENV=development
PORT=3000
DATABASE_URL=mysql://user:password@localhost/tracenew
JWT_SECRET=your_secret_key
CLOUDINARY_CLOUD_NAME=...
CLOUDINARY_API_KEY=...
```

### Video Generator (.env)
```env
CORS_ORIGINS=http://localhost:5173
CLOUDINARY_CLOUD_NAME=...
CLOUDINARY_API_KEY=...
```

### Frontend (.env)
```env
VITE_API_BASE_URL=http://localhost:3000/api
VITE_VIDEO_GENERATOR_URL=http://localhost:8000
```

## 🔐 Security Notes

- Always use HTTPS in production
- Keep JWT secrets secure
- Use environment variables for sensitive data
- Validate all inputs on both frontend and backend
- Implement CORS properly
- Use rate limiting
- Keep dependencies updated

## 📚 Documentation

- [Architecture Documentation](docs/Architecture.md)
- [API Reference](docs/API.md)
- [Database Schema](docs/Database.md)
- [Video Generator Guide](video-generator/README.md)

## 🤝 Contributing

1. Create a feature branch
2. Make your changes
3. Ensure code follows project conventions
4. Test thoroughly
5. Submit a pull request

## 📄 License

[Add your license here]

## 📞 Support

For issues and questions, please open an issue on the repository.

---

**Last Updated**: June 2026
**Version**: 1.0.0
