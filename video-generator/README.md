# Video Generator Service

A FastAPI-based video generation service that creates traceability videos for agricultural products.

## Setup

### Prerequisites
- Python 3.12+
- pip

### Installation

1. Navigate to the video-generator directory:
```bash
cd video-generator
```

2. Create a Python virtual environment:
```bash
python3.12 -m venv .venv
```

3. Activate the virtual environment:
- On Windows:
  ```bash
  .venv\Scripts\activate
  ```
- On macOS/Linux:
  ```bash
  source .venv/bin/activate
  ```

4. Install dependencies:
```bash
pip install -r requirements.txt
```

## Running the Service

From the video-generator directory:

```bash
python -m uvicorn api:app --host 127.0.0.1 --port 8000
```

The API will be available at `http://127.0.0.1:8000`

### Available Endpoints

- `POST /render-from-urls` - Render video from image URLs
- `GET /status/{job_id}` - Check render job status
- `GET /download/{job_id}` - Download rendered video
- `POST /cancel/{job_id}` - Cancel a render job

## Project Structure

```
video-generator/
├── api.py                    # FastAPI application and endpoints
├── pipeline.py               # Video rendering pipeline
├── scenes.py                 # Scene definitions for videos
├── cloudinary_uploader.py    # Cloudinary integration
├── config.py                 # Configuration settings
├── helpers.py                # Helper functions
├── utils.py                  # Utility functions
├── requirements.txt          # Python dependencies
├── assets/
│   ├── audio/
│   │   └── bgm.mpeg         # Background music
│   ├── templates/            # Video templates
│   └── images/               # Asset images
└── output/                   # Generated video output directory
```

## Environment Variables

Create a `.env` file in the video-generator directory:

```env
CORS_ORIGINS=http://localhost:5173,http://localhost:3000
CLOUDINARY_CLOUD_NAME=your_cloud_name
CLOUDINARY_API_KEY=your_api_key
CLOUDINARY_API_SECRET=your_api_secret
MAX_WORKERS=4
```

## Features

- Batch video rendering from image URLs
- Background music integration
- Cloudinary upload support
- Job status tracking and cancellation
- Async processing with background tasks
