"""
Starec-Advocat 2.0 - Main FastAPI Application
Система анализа уголовных дел для адвокатов
"""

from fastapi import FastAPI, Request
from fastapi.middleware.cors import CORSMiddleware
from fastapi.responses import JSONResponse
import time

from app.core.config import settings
from app.api.v1 import auth, cases, documents, analysis, strategy

# Создание FastAPI приложения
app = FastAPI(
    title="Starec-Advocat API",
    description="API для системы анализа уголовных дел",
    version="2.0.0",
    docs_url="/api/docs",
    redoc_url="/api/redoc",
)

# CORS middleware
app.add_middleware(
    CORSMiddleware,
    allow_origins=settings.CORS_ORIGINS,
    allow_credentials=True,
    allow_methods=["*"],
    allow_headers=["*"],
)

# Middleware для логирования времени запроса
@app.middleware("http")
async def add_process_time_header(request: Request, call_next):
    start_time = time.time()
    response = await call_next(request)
    process_time = time.time() - start_time
    response.headers["X-Process-Time"] = str(process_time)
    return response

# Обработка ошибок
@app.exception_handler(Exception)
async def global_exception_handler(request: Request, exc: Exception):
    return JSONResponse(
        status_code=500,
        content={
            "detail": "Внутренняя ошибка сервера",
            "error": str(exc) if settings.DEBUG else None
        }
    )

# Health check
@app.get("/api/health")
async def health_check():
    return {
        "status": "healthy",
        "version": "2.0.0",
        "service": "starec-advocat"
    }

# Root endpoint
@app.get("/")
async def root():
    return {
        "message": "Starec-Advocat API",
        "version": "2.0.0",
        "docs": "/api/docs"
    }

# Подключение роутеров
app.include_router(auth.router, prefix="/api/v1/auth", tags=["Authentication"])
app.include_router(cases.router, prefix="/api/v1/cases", tags=["Cases"])
app.include_router(documents.router, prefix="/api/v1/documents", tags=["Documents"])
app.include_router(analysis.router, prefix="/api/v1/analysis", tags=["Analysis"])
app.include_router(strategy.router, prefix="/api/v1/strategy", tags=["Strategy"])

# Startup event
@app.on_event("startup")
async def startup_event():
    print("🚀 Starec-Advocat API запущен")
    print(f"📝 Документация: http://localhost:8000/api/docs")
    print(f"🔧 Режим: {'DEBUG' if settings.DEBUG else 'PRODUCTION'}")

# Shutdown event
@app.on_event("shutdown")
async def shutdown_event():
    print("🛑 Starec-Advocat API остановлен")

if __name__ == "__main__":
    import uvicorn
    uvicorn.run(
        "app.main:app",
        host="0.0.0.0",
        port=8000,
        reload=settings.DEBUG
    )
