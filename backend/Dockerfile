# ─── Stage 1: Builder ───────────────────────────────────────────────────────
FROM python:3.11-slim AS builder

WORKDIR /build

# Install build dependencies
RUN apt-get update && apt-get install -y --no-install-recommends \
    gcc \
    g++ \
    && rm -rf /var/lib/apt/lists/*

# Copy and install Python dependencies into a local prefix
COPY requirements.txt .
RUN pip install --upgrade pip && \
    pip install --prefix=/install --no-cache-dir -r requirements.txt

# ─── Stage 2: Runtime ───────────────────────────────────────────────────────
FROM python:3.11-slim AS runtime

LABEL maintainer="movie-rec-system"
LABEL description="Movie Recommendation System API"

WORKDIR /app

# Copy installed packages from builder
COPY --from=builder /install /usr/local

# Create a non-root user for security
RUN addgroup --system appgroup && adduser --system --ingroup appgroup appuser

# Copy application source
COPY app/ ./app/
COPY data/ ./data/
COPY seed.py .

# Set Python path so "app" package is importable
ENV PYTHONPATH=/app
ENV PYTHONDONTWRITEBYTECODE=1
ENV PYTHONUNBUFFERED=1

# Switch to non-root user
USER appuser

EXPOSE 8000

# Health check: poll /health every 30s, 3 retries, 10s start period
HEALTHCHECK --interval=30s --timeout=10s --start-period=10s --retries=3 \
    CMD python -c "import urllib.request; urllib.request.urlopen('http://localhost:8000/health')" || exit 1

CMD ["uvicorn", "app.main:app", "--host", "0.0.0.0", "--port", "8000"]
