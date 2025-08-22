#!/usr/bin/env python3
"""
Minimal Railway Test Application
"""
from fastapi import FastAPI
from fastapi.middleware.cors import CORSMiddleware
import os

# Create minimal app
app = FastAPI(
    title="LFA Legacy GO API - Minimal",
    description="Minimal test version for Railway deployment",
    version="3.0.0",
    docs_url="/docs",
    redoc_url="/redoc",
)

# Add basic CORS
app.add_middleware(
    CORSMiddleware,
    allow_origins=["*"],
    allow_credentials=True,
    allow_methods=["GET", "POST", "PUT", "DELETE", "OPTIONS"],
    allow_headers=["*"],
)


@app.get("/")
async def root():
    return {
        "message": "LFA Legacy GO API - Minimal Version",
        "status": "running",
        "environment": os.getenv("RAILWAY_ENVIRONMENT", "local"),
        "port": os.getenv("PORT", "8000"),
    }


@app.get("/health")
async def health():
    return {
        "status": "healthy",
        "environment": os.getenv("RAILWAY_ENVIRONMENT", "local"),
        "database": "not_connected",
    }


if __name__ == "__main__":
    import uvicorn

    port = int(os.getenv("PORT", 8000))
    uvicorn.run(app, host="0.0.0.0", port=port)
