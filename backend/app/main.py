from contextlib import asynccontextmanager
from fastapi import FastAPI, Request
from fastapi.middleware.cors import CORSMiddleware
from fastapi.responses import JSONResponse

from backend.app.core.config import settings
from backend.app.core.logging import logger
from backend.app.api.v1.router import api_router
from backend.app.services.ml_service import ml_service
from backend.app.services.weather_service import weather_service


@asynccontextmanager
async def lifespan(app: FastAPI):
    logger.info("Initializing WeatherGuard Application Services...")
    # Verify artifacts
    if ml_service.is_loaded:
        logger.info("ML Service is ready for inference.")
    else:
        logger.warning("ML Service failed to load model or scaler artifacts.")

    if weather_service._df is not None:
        logger.info(f"Weather dataset loaded with {len(weather_service._df)} records.")
    else:
        logger.warning("Weather dataset not loaded.")

    yield
    logger.info("Shutting down WeatherGuard Application.")


app = FastAPI(
    title=settings.PROJECT_NAME,
    version=settings.VERSION,
    description=(
        "Production-style REST API for AI Weather Anomaly Detection using Isolation Forest. "
        "Provides statistical anomaly detection, historical weather analytics, model metadata, "
        "and data export services for weather station 02956."
    ),
    lifespan=lifespan,
    docs_url="/docs",
    redoc_url="/redoc",
)

# CORS configuration
app.add_middleware(
    CORSMiddleware,
    allow_origins=settings.CORS_ORIGINS,
    allow_credentials=True,
    allow_methods=["*"],
    allow_headers=["*"],
)

# Global safe exception handler for 500 errors
@app.exception_handler(Exception)
async def global_exception_handler(request: Request, exc: Exception):
    logger.error(f"Unhandled error processing {request.method} {request.url}: {exc}", exc_info=True)
    if settings.DEBUG:
        return JSONResponse(
            status_code=500,
            content={"detail": "Internal server error", "error": str(exc)},
        )
    return JSONResponse(
        status_code=500,
        content={"detail": "An internal server error occurred. Please contact the administrator."},
    )

# Include API routes
app.include_router(api_router)


@app.get("/", tags=["Root"])
def root_endpoint():
    return {
        "message": "Welcome to WeatherGuard AI Weather Anomaly Detection API",
        "documentation": "/docs",
        "health": "/api/health",
        "version": settings.VERSION,
    }


if __name__ == "__main__":
    import uvicorn
    uvicorn.run(
        "backend.app.main:app",
        host=settings.HOST,
        port=settings.PORT,
        reload=settings.DEBUG,
    )
