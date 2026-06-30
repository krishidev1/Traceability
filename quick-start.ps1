#!/usr/bin/env pwsh
<#
.SYNOPSIS
    TraceNew Quick Start Script - Automated Setup for Windows
.DESCRIPTION
    This script automates the setup process for TraceNew including:
    - Backend installation and setup
    - Video Generator environment creation
    - Frontend installation
    - Environment file creation
.EXAMPLE
    .\quick-start.ps1
#>

param(
    [switch]$SkipInstall = $false
)

# Colors for output
$colors = @{
    Success = "Green"
    Error   = "Red"
    Info    = "Cyan"
    Warning = "Yellow"
}

function Write-ColorOutput($message, $color = "White") {
    Write-Host $message -ForegroundColor $color
}

function Write-Success($message) { Write-ColorOutput "✓ $message" $colors.Success }
function Write-Error($message) { Write-ColorOutput "✗ $message" $colors.Error }
function Write-Info($message) { Write-ColorOutput "ℹ $message" $colors.Info }
function Write-Warning($message) { Write-ColorOutput "⚠ $message" $colors.Warning }

# Header
Write-ColorOutput "`n╔════════════════════════════════════════════════════════════════╗" $colors.Info
Write-ColorOutput "║            🚀 TraceNew Quick Start Setup Script 🚀              ║" $colors.Info
Write-ColorOutput "╚════════════════════════════════════════════════════════════════╝`n" $colors.Info

# Check prerequisites
Write-Info "Checking prerequisites..."

# Check Node.js
try {
    $nodeVersion = node --version
    Write-Success "Node.js installed: $nodeVersion"
} catch {
    Write-Error "Node.js not found. Please install Node.js 16+ from https://nodejs.org/"
    exit 1
}

# Check Python
try {
    $pythonVersion = python --version
    Write-Success "Python installed: $pythonVersion"
} catch {
    Write-Error "Python not found. Please install Python 3.12+ from https://www.python.org/"
    exit 1
}

# Get project root
$projectRoot = Get-Location
Write-Info "Project root: $projectRoot`n"

# 1. Backend Setup
Write-ColorOutput "`n█─ BACKEND SETUP" $colors.Info
Push-Location backend

if (-not $SkipInstall) {
    Write-Info "Installing backend dependencies..."
    npm install 2>&1 | Out-Null
    if ($LASTEXITCODE -eq 0) {
        Write-Success "Backend dependencies installed"
    } else {
        Write-Error "Failed to install backend dependencies"
        exit 1
    }
}

# Create .env if it doesn't exist
if (-not (Test-Path ".env")) {
    Write-Info "Creating backend/.env from .env.example..."
    if (Test-Path ".env.example") {
        Copy-Item ".env.example" ".env"
        Write-Success "Created backend/.env - Please update with your settings"
    } else {
        Write-Warning "No .env.example found"
    }
}

Pop-Location
Write-Success "Backend setup completed`n"

# 2. Video Generator Setup
Write-ColorOutput "`n█─ VIDEO GENERATOR SETUP" $colors.Info
Push-Location video-generator

# Create venv
Write-Info "Creating Python virtual environment..."
python -m venv .venv
Write-Success "Virtual environment created"

# Activate venv and install
Write-Info "Activating virtual environment..."
& .\.venv\Scripts\Activate.ps1

Write-Info "Upgrading pip..."
python -m pip install --upgrade pip 2>&1 | Out-Null

if (-not $SkipInstall) {
    Write-Info "Installing Python dependencies..."
    pip install -r requirements.txt 2>&1 | Out-Null
    if ($LASTEXITCODE -eq 0) {
        Write-Success "Python dependencies installed"
    } else {
        Write-Error "Failed to install Python dependencies"
        exit 1
    }
}

# Create .env if it doesn't exist
if (-not (Test-Path ".env")) {
    Write-Info "Creating video-generator/.env..."
    @"
HOST=127.0.0.1
PORT=8000
CORS_ORIGINS=http://localhost:5173,http://localhost:3000
"@ | Out-File ".env" -Encoding UTF8
    Write-Success "Created video-generator/.env"
}

Pop-Location
Write-Success "Video Generator setup completed`n"

# 3. Frontend Setup
Write-ColorOutput "`n█─ FRONTEND SETUP" $colors.Info
Push-Location frontend

if (-not $SkipInstall) {
    Write-Info "Installing frontend dependencies..."
    npm install 2>&1 | Out-Null
    if ($LASTEXITCODE -eq 0) {
        Write-Success "Frontend dependencies installed"
    } else {
        Write-Error "Failed to install frontend dependencies"
        exit 1
    }
}

# Create .env if it doesn't exist
if (-not (Test-Path ".env")) {
    Write-Info "Creating frontend/.env from .env.example..."
    if (Test-Path ".env.example") {
        Copy-Item ".env.example" ".env"
        Write-Success "Created frontend/.env"
    }
}

Pop-Location
Write-Success "Frontend setup completed`n"

# Summary
Write-ColorOutput "`n╔════════════════════════════════════════════════════════════════╗" $colors.Success
Write-ColorOutput "║                  ✓ SETUP COMPLETED SUCCESSFULLY                 ║" $colors.Success
Write-ColorOutput "╚════════════════════════════════════════════════════════════════╝" $colors.Success

Write-ColorOutput "`n📋 NEXT STEPS:`n" $colors.Info

Write-ColorOutput "1️⃣  Update Environment Files:" $colors.Warning
Write-ColorOutput "   • backend/.env - Add database credentials, JWT secret" $colors.Info
Write-ColorOutput "   • video-generator/.env - Add Cloudinary credentials (optional)" $colors.Info

Write-ColorOutput "`n2️⃣  Start Services (in separate terminals):`n" $colors.Warning

Write-ColorOutput "   Terminal 1 - Backend:" $colors.Info
Write-ColorOutput "   cd backend && npm run dev`n" $colors.Info

Write-ColorOutput "   Terminal 2 - Video Generator:" $colors.Info
Write-ColorOutput "   cd video-generator && .\.venv\Scripts\activate && python -m uvicorn api:app --host 127.0.0.1 --port 8000`n" $colors.Info

Write-ColorOutput "   Terminal 3 - Frontend:" $colors.Info
Write-ColorOutput "   cd frontend && npm run dev`n" $colors.Info

Write-ColorOutput "3️⃣  Access Applications:`n" $colors.Warning
Write-ColorOutput "   • Frontend:         http://localhost:5173" $colors.Info
Write-ColorOutput "   • Backend API:      http://localhost:3000/api" $colors.Info
Write-ColorOutput "   • Video Generator:  http://localhost:8000/docs" $colors.Info

Write-ColorOutput "`n📚 Documentation:" $colors.Info
Write-ColorOutput "   • SETUP.md - Detailed setup guide" $colors.Info
Write-ColorOutput "   • MIGRATION_GUIDE.md - Code update reference" $colors.Info
Write-ColorOutput "   • docs/Architecture.md - System architecture" $colors.Info

Write-ColorOutput "`n🎉 Happy Coding! 🚀`n" $colors.Success
