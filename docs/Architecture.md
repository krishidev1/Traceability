# TraceNew Architecture

## Project Structure

```
TraceNew/
├── backend/                          # Node.js backend
│   ├── src/
│   │   ├── config/                   # Configuration files
│   │   │   ├── db.js
│   │   │   ├── cloudinary.js
│   │   │   └── env.js
│   │   │
│   │   ├── middleware/               # Express middleware
│   │   │   ├── authMiddleware.js
│   │   │   ├── uploadMiddleware.js
│   │   │   └── errorMiddleware.js
│   │   │
│   │   ├── modules/                  # Feature modules
│   │   │   ├── auth/                 # Authentication
│   │   │   │   ├── authController.js
│   │   │   │   ├── authRoutes.js
│   │   │   │   ├── authService.js
│   │   │   │   └── authModel.js
│   │   │   │
│   │   │   ├── crop/                 # Crop management
│   │   │   ├── plantation/           # Plantation management
│   │   │   ├── harvest/              # Harvest tracking
│   │   │   ├── monitoring/           # Monitoring records
│   │   │   ├── packing/              # Packing operations
│   │   │   ├── trace/                # Traceability
│   │   │   ├── media/                # Media management
│   │   │   ├── verification/         # Verification
│   │   │   ├── sambalpuriBandha/     # Sambalpuri Bandha product
│   │   │   ├── supplierTrace/        # Supplier tracing
│   │   │   ├── processImage/         # Image processing
│   │   │   ├── userRole/             # User roles
│   │   │   ├── farm/                 # Farm management
│   │   │   └── patch/                # Patch tracking
│   │   │
│   │   ├── services/                 # Shared services
│   │   │   ├── cloudinary/
│   │   │   │   └── cloudinaryService.js
│   │   │   ├── trace/
│   │   │   │   ├── traceService.js
│   │   │   │   └── sqlBuilder.js
│   │   │   ├── video/
│   │   │   │   └── videoGeneratorService.js
│   │   │   └── mail/
│   │   │       └── mailService.js
│   │   │
│   │   ├── utils/                    # Utilities
│   │   │   ├── jwt.js
│   │   │   ├── crypto.js
│   │   │   ├── logger.js
│   │   │   └── helpers.js
│   │   │
│   │   ├── routes/                   # Route aggregation
│   │   │   └── index.js
│   │   │
│   │   └── app.js                    # Express app setup
│   │
│   ├── sql/                          # Database
│   │   ├── migrations/               # Database migrations
│   │   └── scripts/                  # Setup scripts
│   │
│   ├── uploads/                      # Uploaded files
│   ├── server.js                     # Server entry point
│   ├── .env                          # Environment variables
│   └── package.json
│
├── video-generator/                  # Python FastAPI service
│   ├── api.py                        # FastAPI application
│   ├── pipeline.py                   # Video rendering pipeline
│   ├── scenes.py                     # Scene definitions
│   ├── cloudinary_uploader.py        # Cloudinary integration
│   ├── config.py                     # Configuration
│   ├── helpers.py                    # Helpers
│   ├── utils.py                      # Utilities
│   ├── requirements.txt              # Python dependencies
│   ├── assets/
│   │   ├── audio/                    # Audio files
│   │   ├── templates/                # Video templates
│   │   └── images/                   # Asset images
│   ├── output/                       # Generated videos
│   └── README.md
│
├── frontend/                         # React + Vite
│   ├── src/
│   │   ├── api/                      # API client
│   │   ├── assets/                   # Static assets
│   │   ├── components/               # React components
│   │   ├── pages/                    # Page components
│   │   ├── layouts/                  # Layout components
│   │   ├── hooks/                    # Custom hooks
│   │   ├── context/                  # Context providers
│   │   ├── services/                 # Frontend services
│   │   ├── styles/                   # CSS files
│   │   ├── utils/                    # Utilities
│   │   ├── App.jsx
│   │   └── main.jsx
│   │
│   ├── public/                       # Public static files
│   ├── package.json
│   ├── vite.config.js
│   └── .env.example
│
├── docs/                             # Documentation
│   ├── API.md                        # API documentation
│   ├── Architecture.md               # This file
│   └── Database.md
│
├── .gitignore
└── README.md
```

## Module Structure

Each module follows a consistent pattern:

```
module-name/
├── controllers/        # Request handlers
├── models/            # Data models
├── routes/            # Express routes
├── services/          # Business logic
└── (index.js)        # Optional module export
```

## Architecture Principles

1. **Separation of Concerns**: Each module handles one feature domain
2. **Reusable Services**: Common functionality in `/backend/src/services`
3. **Middleware Pattern**: Cross-cutting concerns via middleware
4. **Environment Configuration**: All configs in `/backend/src/config`
5. **Utility Functions**: Common helpers in `/backend/src/utils`

## Communication

- **Frontend** ↔ **Backend**: REST API over HTTP
- **Backend** → **Video Generator**: HTTP requests to FastAPI service
- **Backend** ↔ **Database**: SQL queries
- **Backend** ↔ **Cloudinary**: SDK integration

## Deployment

- Backend: Node.js server (Express)
- Frontend: Static SPA (React)
- Video Generator: Python FastAPI service
- Database: SQL database
