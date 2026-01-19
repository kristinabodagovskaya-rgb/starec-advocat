"""
API для работы с делами
"""

from fastapi import APIRouter, Depends, HTTPException, status
from sqlalchemy.orm import Session
from typing import List

from app.models import get_db, Case

router = APIRouter()


@router.get("/")
async def get_cases(
    skip: int = 0,
    limit: int = 100,
    status_filter: str = None,
    db: Session = Depends(get_db)
):
    """Получить список дел пользователя"""

    # TODO: Добавить аутентификацию
    # current_user_id = 1  # Временно

    query = db.query(Case)  # .filter(Case.user_id == current_user_id)

    if status_filter:
        query = query.filter(Case.status == status_filter)

    cases = query.offset(skip).limit(limit).all()

    return {
        "total": query.count(),
        "cases": [
            {
                "id": case.id,
                "case_number": case.case_number,
                "title": case.title,
                "article": case.article,
                "defendant_name": case.defendant_name,
                "status": case.status,
                "created_at": case.created_at.isoformat()
            }
            for case in cases
        ]
    }


@router.post("/")
async def create_case(
    case_number: str,
    title: str,
    article: str = None,
    defendant_name: str = None,
    db: Session = Depends(get_db)
):
    """Создать новое дело"""

    # TODO: Добавить аутентификацию
    user_id = 1  # Временно

    new_case = Case(
        user_id=user_id,
        case_number=case_number,
        title=title,
        article=article,
        defendant_name=defendant_name
    )

    db.add(new_case)
    db.commit()
    db.refresh(new_case)

    return {
        "message": "Дело успешно создано",
        "case": {
            "id": new_case.id,
            "case_number": new_case.case_number,
            "title": new_case.title
        }
    }


@router.get("/{case_id}")
async def get_case(
    case_id: int,
    db: Session = Depends(get_db)
):
    """Получить детали дела"""

    case = db.query(Case).filter(Case.id == case_id).first()

    if not case:
        raise HTTPException(
            status_code=status.HTTP_404_NOT_FOUND,
            detail="Дело не найдено"
        )

    # TODO: Проверить права доступа

    return {
        "id": case.id,
        "case_number": case.case_number,
        "title": case.title,
        "article": case.article,
        "defendant_name": case.defendant_name,
        "investigative_body": case.investigative_body,
        "initiation_date": case.initiation_date.isoformat() if case.initiation_date else None,
        "status": case.status,
        "notes": case.notes,
        "created_at": case.created_at.isoformat(),
        "updated_at": case.updated_at.isoformat()
    }


@router.put("/{case_id}")
async def update_case(
    case_id: int,
    title: str = None,
    article: str = None,
    defendant_name: str = None,
    status: str = None,
    db: Session = Depends(get_db)
):
    """Обновить дело"""

    case = db.query(Case).filter(Case.id == case_id).first()

    if not case:
        raise HTTPException(
            status_code=status.HTTP_404_NOT_FOUND,
            detail="Дело не найдено"
        )

    # TODO: Проверить права доступа

    if title:
        case.title = title
    if article:
        case.article = article
    if defendant_name:
        case.defendant_name = defendant_name
    if status:
        case.status = status

    db.commit()
    db.refresh(case)

    return {"message": "Дело успешно обновлено"}


@router.delete("/{case_id}")
async def delete_case(
    case_id: int,
    db: Session = Depends(get_db)
):
    """Удалить дело"""

    case = db.query(Case).filter(Case.id == case_id).first()

    if not case:
        raise HTTPException(
            status_code=status.HTTP_404_NOT_FOUND,
            detail="Дело не найдено"
        )

    # TODO: Проверить права доступа

    db.delete(case)
    db.commit()

    return {"message": "Дело успешно удалено"}


@router.get("/{case_id}/volumes")
async def get_case_volumes(
    case_id: int,
    db: Session = Depends(get_db)
):
    """Получить список томов дела"""

    # TODO: Implement
    return {"message": "TODO: Get case volumes"}


@router.post("/{case_id}/volumes/sync")
async def sync_gdrive_volumes(
    case_id: int,
    gdrive_folder_id: str,
    db: Session = Depends(get_db)
):
    """Синхронизация томов из Google Drive"""

    # TODO: Implement Google Drive sync
    return {"message": "TODO: Sync with Google Drive"}


@router.get("/{case_id}/statistics")
async def get_case_statistics(
    case_id: int,
    db: Session = Depends(get_db)
):
    """Получить статистику по делу"""

    # TODO: Implement
    return {
        "volumes_count": 0,
        "documents_count": 0,
        "participants_count": 0,
        "events_count": 0
    }
