"""
Конфигурация приложения
"""

from pydantic_settings import BaseSettings
from typing import List
import os

class Settings(BaseSettings):
    """Настройки приложения"""

    # Основные настройки
    PROJECT_NAME: str = "Starec-Advocat"
    VERSION: str = "2.0.0"
    API_V1_PREFIX: str = "/api/v1"
    DEBUG: bool = True

    # CORS
    CORS_ORIGINS: List[str] = [
        "http://localhost:3000",
        "http://localhost:5173",
        "https://advocat.starec.ai"
    ]

    # База данных PostgreSQL
    POSTGRES_SERVER: str = "localhost"
    POSTGRES_PORT: int = 5433
    POSTGRES_USER: str = "starec_user"
    POSTGRES_PASSWORD: str = "starec_pass"
    POSTGRES_DB: str = "starec_advocat"

    # SQLite for local development
    USE_SQLITE: bool = os.getenv("USE_SQLITE", "true").lower() == "true"
    SQLITE_PATH: str = os.getenv("SQLITE_PATH", "./local_starec.db")

    @property
    def DATABASE_URL(self) -> str:
        if self.USE_SQLITE:
            return f"sqlite:///{self.SQLITE_PATH}"
        return f"postgresql://{self.POSTGRES_USER}:{self.POSTGRES_PASSWORD}@{self.POSTGRES_SERVER}:{self.POSTGRES_PORT}/{self.POSTGRES_DB}"

    # MongoDB
    MONGODB_URL: str = "mongodb://localhost:27018/starec_advocat"
    MONGODB_DB: str = "starec_advocat"

    # Redis
    REDIS_HOST: str = "localhost"
    REDIS_PORT: int = 6380
    REDIS_DB: int = 0

    @property
    def REDIS_URL(self) -> str:
        return f"redis://{self.REDIS_HOST}:{self.REDIS_PORT}/{self.REDIS_DB}"

    # Celery
    CELERY_BROKER_URL: str = "redis://localhost:6380/0"
    CELERY_RESULT_BACKEND: str = "redis://localhost:6380/1"

    # JWT
    SECRET_KEY: str = "YOUR_SECRET_KEY_CHANGE_IN_PRODUCTION"
    ALGORITHM: str = "HS256"
    ACCESS_TOKEN_EXPIRE_MINUTES: int = 60 * 24  # 24 часа

    # AI API Keys
    ANTHROPIC_API_KEY: str = os.getenv("ANTHROPIC_API_KEY", "")
    OPENAI_API_KEY: str = os.getenv("OPENAI_API_KEY", "")

    # Google Drive API
    GOOGLE_CLIENT_ID: str = os.getenv("GOOGLE_CLIENT_ID", "")
    GOOGLE_CLIENT_SECRET: str = os.getenv("GOOGLE_CLIENT_SECRET", "")

    # Файловое хранилище
    UPLOAD_DIR: str = os.getenv("UPLOAD_DIR", "./uploads")
    PROCESSED_DIR: str = os.getenv("PROCESSED_DIR", "./processed")

    # OCR настройки
    TESSERACT_CMD: str = "/usr/bin/tesseract"
    OCR_LANGUAGE: str = "rus+eng"

    # Лимиты
    MAX_FILE_SIZE: int = 500 * 1024 * 1024  # 500 MB
    MAX_VOLUMES_PER_CASE: int = 500
    MAX_DOCUMENTS_PER_VOLUME: int = 100

    # Celery Workers
    CELERY_OCR_WORKERS: int = 3
    CELERY_ANALYSIS_WORKERS: int = 2

    class Config:
        env_file = ".env"
        case_sensitive = True

settings = Settings()
