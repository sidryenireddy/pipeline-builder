FROM python:3.12-slim

WORKDIR /app
RUN pip install --no-cache-dir uv
COPY pyproject.toml .
RUN uv pip install --system -e ".[dev]"
COPY . .

EXPOSE 8001
CMD ["uvicorn", "pipeline_engine.main:app", "--host", "0.0.0.0", "--port", "8001"]
