FROM python:3.10-slim

# Set environment variables
ENV PYTHONDONTWRITEBYTECODE=1 \
    PYTHONUNBUFFERED=1 \
    PIP_NO_CACHE_DIR=1 \
    MODEL_ID="npmulta/layoutlmv3-kv"

# Install dependencies
RUN apt-get update && apt-get install -y --no-install-recommends \
    libgl1 \
    libglib2.0-0 \
    libsm6 \
    libxext6 \
    libxrender1 \
    && rm -rf /var/lib/apt/lists/*

# Install Python packages
RUN pip install --no-cache-dir \
    transformers>=4.41.0 \
    torch==2.3.0 \
    torchvision==0.18.0 \
    Pillow \
    numpy \
    fastapi \
    uvicorn[standard] \
    python-multipart \
    pdf2image \
    opencv-python-headless

# Create app directory
WORKDIR /app

# Copy server code
COPY infra/layoutlm_server.py /app/server.py

# Set up model cache directory
RUN mkdir -p /app/model_cache

# Expose port
EXPOSE 9100

# Set environment variables for model cache
ENV TRANSFORMERS_CACHE=/app/model_cache \
    HF_HOME=/app/model_cache

# Run server
CMD ["uvicorn", "server:app", "--host", "0.0.0.0", "--port", "9100"]