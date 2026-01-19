"""
Модели для анализа документов и дел
"""

from sqlalchemy import Column, Integer, String, DateTime, ForeignKey, Text, JSON
from sqlalchemy.orm import relationship
from datetime import datetime

from app.models.database import Base

class Entity(Base):
    """Сущности, извлеченные из документов (участники, даты, суммы и т.д.)"""
    __tablename__ = "entities"

    id = Column(Integer, primary_key=True, index=True)
    document_id = Column(Integer, ForeignKey("documents.id"), nullable=False)

    # Тип сущности
    entity_type = Column(String(50), nullable=False)  # person, date, amount, article, location
    entity_value = Column(Text, nullable=False)
    context = Column(Text)  # Контекст, в котором найдена сущность

    # Метаданные
    confidence = Column(Integer, default=100)  # Уверенность в извлечении (0-100%)
    created_at = Column(DateTime, default=datetime.utcnow)

    # Связи
    document = relationship("Document", back_populates="entities")


class DocumentAnalysis(Base):
    """Анализ отдельного документа"""
    __tablename__ = "document_analyses"

    id = Column(Integer, primary_key=True, index=True)
    document_id = Column(Integer, ForeignKey("documents.id"), nullable=False)

    # Тип анализа
    analysis_type = Column(String(50), nullable=False)  # procedural, evidence, legal, etc

    # Результаты анализа (JSON)
    findings = Column(JSON)  # Основные выводы
    violations = Column(JSON)  # Выявленные нарушения
    recommendations = Column(JSON)  # Рекомендации для защиты

    # Метаданные
    ai_model = Column(String(50))  # claude-opus-4.5, gpt-4, etc
    tokens_used = Column(Integer)
    processing_time = Column(Integer)  # В секундах
    created_at = Column(DateTime, default=datetime.utcnow)

    # Связи
    document = relationship("Document", back_populates="analyses")


class CaseAnalysis(Base):
    """Комплексный анализ всего дела"""
    __tablename__ = "case_analyses"

    id = Column(Integer, primary_key=True, index=True)
    case_id = Column(Integer, ForeignKey("cases.id"), nullable=False)

    # Статус анализа
    analysis_status = Column(String(50), default="pending")  # pending, processing, completed, error
    progress = Column(Integer, default=0)  # 0-100%

    # Результаты анализа (JSON)
    findings = Column(JSON)  # Все выводы
    violations = Column(JSON)  # Массив всех нарушений
    contradictions = Column(JSON)  # Противоречия в доказательствах
    defense_lines = Column(JSON)  # Линии защиты
    judicial_practice = Column(JSON)  # Релевантная судебная практика

    # Статистика
    total_documents_analyzed = Column(Integer, default=0)
    total_violations_found = Column(Integer, default=0)
    total_contradictions_found = Column(Integer, default=0)

    # Метаданные
    ai_model = Column(String(50))
    total_tokens_used = Column(Integer)
    total_processing_time = Column(Integer)  # В секундах
    created_at = Column(DateTime, default=datetime.utcnow)
    completed_at = Column(DateTime)

    # Связи
    case = relationship("Case", back_populates="analyses")


class DefenseStrategy(Base):
    """Стратегия защиты"""
    __tablename__ = "defense_strategies"

    id = Column(Integer, primary_key=True, index=True)
    case_id = Column(Integer, ForeignKey("cases.id"), nullable=False)

    # Версия стратегии
    version = Column(Integer, default=1)

    # Содержание стратегии (полная структура в JSON)
    content = Column(JSON)  # Вся стратегия согласно методологии

    # Разделы стратегии (для быстрого доступа)
    summary = Column(Text)  # Резюме
    procedural_violations = Column(JSON)  # Процессуальные нарушения
    evidence_analysis = Column(JSON)  # Анализ доказательств
    defense_lines = Column(JSON)  # Линии защиты
    tactical_plan = Column(JSON)  # Тактический план

    # Метаданные
    ai_model = Column(String(50))
    generated_at = Column(DateTime, default=datetime.utcnow)

    # Связи
    case = relationship("Case", back_populates="strategies")
