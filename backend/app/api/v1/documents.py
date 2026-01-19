"""
API для работы с документами
"""

from fastapi import APIRouter, Depends
from sqlalchemy.orm import Session

from app.models import get_db

router = APIRouter()


@router.get("/")
async def get_documents(
    case_id: int = None,
    volume_id: int = None,
    doc_type: str = None,
    skip: int = 0,
    limit: int = 100,
    db: Session = Depends(get_db)
):
    """Получить список документов"""
    # TODO: Implement document listing with filters
    return {"message": "TODO: Get documents"}


@router.get("/{document_id}")
async def get_document(
    document_id: int,
    db: Session = Depends(get_db)
):
    """Получить детали документа"""
    # TODO: Implement document details with entities
    return {"message": "TODO: Get document details"}


@router.post("/{document_id}/analyze")
async def analyze_document(
    document_id: int,
    analysis_type: str = "full",
    db: Session = Depends(get_db)
):
    """Запустить анализ документа"""
    # TODO: Implement document analysis (Celery task)
    return {"message": "TODO: Start document analysis"}


@router.get("/{document_id}/entities")
async def get_document_entities(
    document_id: int,
    entity_type: str = None,
    db: Session = Depends(get_db)
):
    """Получить извлеченные сущности из документа"""
    # TODO: Implement entity extraction results
    return {"message": "TODO: Get entities"}


@router.get("/{document_id}/connections")
async def get_document_connections(
    document_id: int,
    db: Session = Depends(get_db)
):
    """Получить связи документа с другими документами"""
    # TODO: Implement document connections graph
    return {"message": "TODO: Get connections"}


@router.get("/{document_id}/download")
async def download_document(
    document_id: int,
    format: str = "pdf",  # pdf, docx, txt
    db: Session = Depends(get_db)
):
    """Скачать документ"""
    # TODO: Implement document export
    return {"message": "TODO: Download document"}
