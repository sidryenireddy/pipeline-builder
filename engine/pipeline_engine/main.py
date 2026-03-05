from fastapi import FastAPI
from pipeline_engine.routes import router

app = FastAPI(title="Pipeline Engine", version="0.1.0")

app.include_router(router, prefix="/api/v1")


@app.get("/health")
def health():
    return {"status": "ok"}
