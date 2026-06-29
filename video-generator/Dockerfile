# Use the official lightweight Python runtime as a parent image
FROM python:3.12-slim

# Install system-level dependencies (ffmpeg is required for video processing)
RUN apt-get update && apt-get install -y --no-install-recommends \
    ffmpeg \
    && rm -rf /var/lib/apt/lists/*

# Set the working directory inside the container
WORKDIR /app

# Copy the dependency list
COPY requirements.txt .

# Install dependencies without caching to keep the image slim
RUN pip install --no-cache-dir -r requirements.txt

# Copy the rest of the application code
COPY . .

# Expose the service port (configured to 8000 by default)
EXPOSE 8000

# Bind to 0.0.0.0 so that the AWS load balancer or container network can route traffic to it
CMD ["python", "-m", "uvicorn", "api:app", "--host", "0.0.0.0", "--port", "8000"]
