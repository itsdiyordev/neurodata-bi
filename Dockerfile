# ==========================================
# STAGE 1: Build Frontend (Vite + React 19)
# ==========================================
FROM node:20-alpine AS frontend-builder

WORKDIR /app/frontend

# Copy package manifests first for optimal Docker layer caching
COPY frontend/package.json frontend/package-lock.json* ./
RUN npm ci || npm install

# Copy source code and build production assets
COPY frontend/ ./
RUN npm run build

# ==========================================
# STAGE 2: Python Backend & Unified Runtime
# ==========================================
FROM python:3.11-slim AS runner

LABEL maintainer="NeuroData BI Team <support@neurodata.dev>"
LABEL description="NeuroData BI - High-Performance AI-Powered BI Platform with DuckDB & Gemini"

# Set runtime environment variables
ENV PYTHONUNBUFFERED=1 \
    PYTHONDONTWRITEBYTECODE=1 \
    PORT=8000 \
    HOST=0.0.0.0

WORKDIR /app

# Install system dependencies (curl for healthcheck verification)
RUN apt-get update && apt-get install -y --no-install-recommends \
    curl \
    && rm -rf /var/lib/apt/lists/*

# Install Python requirements
COPY backend/requirements.txt ./backend/requirements.txt
RUN pip install --no-cache-dir --upgrade pip && \
    pip install --no-cache-dir -r ./backend/requirements.txt

# Copy backend application source
COPY backend/ ./backend/

# Create persistent storage directory for DuckDB
RUN mkdir -p /app/backend/data

# Copy compiled frontend production assets from Stage 1 into backend/static
COPY --from=frontend-builder /app/frontend/dist ./backend/static

# Expose HTTP port
EXPOSE 8000

# Declare persistent volume mount for DuckDB database files
VOLUME ["/app/backend/data"]

# Health check to monitor container status
HEALTHCHECK --interval=30s --timeout=5s --start-period=10s --retries=3 \
    CMD curl -f http://localhost:8000/api/health || exit 1

WORKDIR /app/backend

# Launch FastAPI ASGI server
CMD ["uvicorn", "main:app", "--host", "0.0.0.0", "--port", "8000"]
