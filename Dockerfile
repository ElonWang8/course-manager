# Stage 1: Build frontend
FROM node:22-alpine AS frontend-build

WORKDIR /app/frontend
COPY frontend/package.json frontend/package-lock.json* ./
RUN npm config set registry https://registry.npmmirror.com && npm install
COPY frontend/ ./
RUN npm run build

# Stage 2: Backend + frontend static
FROM python:3.12-slim

WORKDIR /app

COPY backend/requirements.txt .
RUN pip install --no-cache-dir -r requirements.txt -i https://pypi.tuna.tsinghua.edu.cn/simple

COPY backend/app/ app/
COPY --from=frontend-build /app/frontend/dist static/

RUN mkdir -p /app/data/backups

EXPOSE 8000

CMD ["uvicorn", "app.main:app", "--host", "0.0.0.0", "--port", "8000"]
