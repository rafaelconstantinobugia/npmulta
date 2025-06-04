FROM python:3.10-slim
ENV PIP_NO_CACHE_DIR=1
ENV CPU_NUM_THREADS=4

# Install dependencies
RUN apt-get update && apt-get install -y libglib2.0-0 libsm6 libxext6 libxrender-dev

# Install PaddlePaddle and PaddleOCR
RUN pip install paddlepaddle==2.6.1 -f https://www.paddlepaddle.org.cn/whl/linux/cpu/avx/stable.html \
 && pip install paddleocr==2.7.2 fastapi uvicorn[standard]

# Download models during build
RUN paddleocr --det_model_dir=/root/.paddleocr/det/ --rec_model_dir=/root/.paddleocr/rec/ --use_angle_cls=true --lang=en

# Set up application
WORKDIR /app
COPY infra/ocr_server.py /app/app.py

# Expose port
EXPOSE 9000

# Run the API server
ENTRYPOINT ["uvicorn", "app:app", "--host", "0.0.0.0", "--port", "9000"]