"""
Модель дела
"""

from sqlalchemy import Column, Integer, String, Date, DateTime, ForeignKey, Text
from sqlalchemy.orm import relationship
from datetime import datetime

from app.models.database import Base

class Case(Base):
    __tablename__ = "cases"

    id = Column(Integer, primary_key=True, index=True)
    user_id = Column(Integer, ForeignKey("users.id"), nullable=False)

    # Основная информация
    case_number = Column(String(100), nullable=False, index=True)
    title = Column(String(500), nullable=False)
    article = Column(String(100))
    defendant_name = Column(String(255))
    investigative_body = Column(String(255))
    initiation_date = Column(Date)

    # Статус
    status = Column(String(50), default="active")  # active, archived, deleted

    # Метаданные
    notes = Column(Text)
    created_at = Column(DateTime, default=datetime.utcnow)
    updated_at = Column(DateTime, default=datetime.utcnow, onupdate=datetime.utcnow)

    # Связи
    user = relationship("User", back_populates="cases")
    volumes = relationship("Volume", back_populates="case", cascade="all, delete-orphan")
    documents = relationship("Document", back_populates="case", cascade="all, delete-orphan")
    analyses = relationship("CaseAnalysis", back_populates="case", cascade="all, delete-orphan")
    strategies = relationship("DefenseStrategy", back_populates="case", cascade="all, delete-orphan")


class Volume(Base):
    __tablename__ = "volumes"

    id = Column(Integer, primary_key=True, index=True)
    case_id = Column(Integer, ForeignKey("cases.id"), nullable=False)

    # Информация о томе
    volume_number = Column(Integer, nullable=False)
    gdrive_file_id = Column(String(255))
    file_name = Column(String(500))
    file_size = Column(Integer)  # в байтах
    page_count = Column(Integer)

    # OCR качество
    ocr_quality = Column(Integer)  # 0-100%
    processing_status = Column(String(50), default="pending")  # pending, processing, completed, error

    # Метаданные
    created_at = Column(DateTime, default=datetime.utcnow)
    processed_at = Column(DateTime)

    # Связи
    case = relationship("Case", back_populates="volumes")
    documents = relationship("Document", back_populates="volume", cascade="all, delete-orphan")
    extraction_runs = relationship("ExtractionRun", back_populates="volume", cascade="all, delete-orphan")


class ExtractionRun(Base):
    """История выделений документов (версии)"""
    __tablename__ = "extraction_runs"

    id = Column(Integer, primary_key=True, index=True)
    volume_id = Column(Integer, ForeignKey("volumes.id"), nullable=False)

    # Версия (1, 2, 3...)
    version = Column(Integer, nullable=False, default=1)

    # Статистика
    documents_count = Column(Integer, default=0)
    total_pages = Column(Integer, default=0)

    # Настройки при выделении
    crop_ratio = Column(String(10), default="0.9")
    model_used = Column(String(100), default="claude-sonnet-4-20250514")

    # Активная версия?
    is_current = Column(Integer, default=1)  # 1 = текущая, 0 = архивная

    # Метаданные
    created_at = Column(DateTime, default=datetime.utcnow)

    # Связи
    volume = relationship("Volume", back_populates="extraction_runs")
    documents = relationship("Document", back_populates="extraction_run", cascade="all, delete-orphan")


class Document(Base):
    __tablename__ = "documents"

    id = Column(Integer, primary_key=True, index=True)
    case_id = Column(Integer, ForeignKey("cases.id"), nullable=False)
    volume_id = Column(Integer, ForeignKey("volumes.id"), nullable=False)
    extraction_run_id = Column(Integer, ForeignKey("extraction_runs.id"), nullable=True)

    # Информация о документе
    doc_type = Column(String(100))  # протокол, постановление, заключение и т.д.
    title = Column(String(1000), nullable=False)
    start_page = Column(Integer)
    end_page = Column(Integer)
    document_date = Column(Date)
    author = Column(String(255))

    # Важность (1-3 звезды)
    importance_score = Column(Integer, default=1)

    # Статус анализа
    analysis_status = Column(String(50), default="not_analyzed")  # not_analyzed, processing, analyzed, error

    # Текст документа
    full_text = Column(Text)

    # Метаданные
    created_at = Column(DateTime, default=datetime.utcnow)
    analyzed_at = Column(DateTime)

    # Связи
    case = relationship("Case", back_populates="documents")
    volume = relationship("Volume", back_populates="documents")
    extraction_run = relationship("ExtractionRun", back_populates="documents")
    entities = relationship("Entity", back_populates="document", cascade="all, delete-orphan")
    analyses = relationship("DocumentAnalysis", back_populates="document", cascade="all, delete-orphan")
