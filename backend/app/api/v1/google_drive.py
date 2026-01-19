"""
API для работы с Google Drive
"""

from fastapi import APIRouter, HTTPException, status, Depends
from sqlalchemy.orm import Session
from pydantic import BaseModel
from typing import Optional, List
import os
from google.oauth2.credentials import Credentials
from google_auth_oauthlib.flow import Flow
from googleapiclient.discovery import build
from googleapiclient.http import MediaIoBaseDownload
import io

from app.models import get_db, Case
from app.core.config import settings

router = APIRouter()

# Google OAuth настройки
SCOPES = ['https://www.googleapis.com/auth/drive.readonly']
REDIRECT_URI = 'http://localhost:3000/oauth/callback'  # Для разработки

class GoogleAuthURL(BaseModel):
    auth_url: str

class GoogleAuthCallback(BaseModel):
    code: str
    case_id: int

class FolderInfo(BaseModel):
    folder_id: str
    case_id: int

class FileInfo(BaseModel):
    id: str
    name: str
    mimeType: str
    size: Optional[int] = None
    webViewLink: Optional[str] = None


@router.get("/auth-url")
async def get_google_auth_url():
    """Получить URL для OAuth авторизации Google"""

    try:
        # Создаем OAuth flow
        flow = Flow.from_client_config(
            {
                "web": {
                    "client_id": settings.GOOGLE_CLIENT_ID,
                    "client_secret": settings.GOOGLE_CLIENT_SECRET,
                    "auth_uri": "https://accounts.google.com/o/oauth2/auth",
                    "token_uri": "https://oauth2.googleapis.com/token",
                    "redirect_uris": [REDIRECT_URI]
                }
            },
            scopes=SCOPES
        )

        flow.redirect_uri = REDIRECT_URI

        # Генерируем URL авторизации
        authorization_url, state = flow.authorization_url(
            access_type='offline',
            include_granted_scopes='true',
            prompt='consent'
        )

        return {"auth_url": authorization_url, "state": state}

    except Exception as e:
        raise HTTPException(
            status_code=status.HTTP_500_INTERNAL_SERVER_ERROR,
            detail=f"Ошибка при генерации URL авторизации: {str(e)}"
        )


@router.post("/oauth/callback")
async def handle_oauth_callback(
    callback_data: GoogleAuthCallback,
    db: Session = Depends(get_db)
):
    """Обработка OAuth callback от Google"""

    try:
        # Обмениваем code на токены
        flow = Flow.from_client_config(
            {
                "web": {
                    "client_id": settings.GOOGLE_CLIENT_ID,
                    "client_secret": settings.GOOGLE_CLIENT_SECRET,
                    "auth_uri": "https://accounts.google.com/o/oauth2/auth",
                    "token_uri": "https://oauth2.googleapis.com/token",
                    "redirect_uris": [REDIRECT_URI]
                }
            },
            scopes=SCOPES,
            redirect_uri=REDIRECT_URI
        )

        flow.fetch_token(code=callback_data.code)
        credentials = flow.credentials

        # Сохраняем токены для дела
        # TODO: Сохранить credentials в базу данных для конкретного дела

        return {
            "message": "Авторизация успешна",
            "case_id": callback_data.case_id,
            "access_token": credentials.token
        }

    except Exception as e:
        raise HTTPException(
            status_code=status.HTTP_500_INTERNAL_SERVER_ERROR,
            detail=f"Ошибка при обработке OAuth callback: {str(e)}"
        )


@router.post("/folders/{folder_id}/files")
async def list_folder_files(
    folder_id: str,
    access_token: str,
    db: Session = Depends(get_db)
):
    """Получить список файлов из папки Google Drive"""

    try:
        # Создаем credentials из токена
        credentials = Credentials(token=access_token)

        # Создаем сервис Google Drive
        service = build('drive', 'v3', credentials=credentials)

        # Получаем список файлов из папки
        query = f"'{folder_id}' in parents and mimeType='application/pdf'"
        results = service.files().list(
            q=query,
            pageSize=100,
            fields="files(id, name, mimeType, size, webViewLink)"
        ).execute()

        files = results.get('files', [])

        return {
            "folder_id": folder_id,
            "files": files,
            "total": len(files)
        }

    except Exception as e:
        raise HTTPException(
            status_code=status.HTTP_500_INTERNAL_SERVER_ERROR,
            detail=f"Ошибка при получении списка файлов: {str(e)}"
        )


@router.post("/files/{file_id}/download")
async def download_file(
    file_id: str,
    access_token: str,
    case_id: int,
    db: Session = Depends(get_db)
):
    """Скачать файл из Google Drive"""

    try:
        # Проверяем существование дела
        case = db.query(Case).filter(Case.id == case_id).first()
        if not case:
            raise HTTPException(
                status_code=status.HTTP_404_NOT_FOUND,
                detail="Дело не найдено"
            )

        # Создаем credentials из токена
        credentials = Credentials(token=access_token)

        # Создаем сервис Google Drive
        service = build('drive', 'v3', credentials=credentials)

        # Получаем информацию о файле
        file_metadata = service.files().get(fileId=file_id, fields="name,mimeType,size").execute()

        # Скачиваем файл
        request = service.files().get_media(fileId=file_id)
        file_content = io.BytesIO()
        downloader = MediaIoBaseDownload(file_content, request)

        done = False
        while done is False:
            status_progress, done = downloader.next_chunk()

        # Сохраняем файл на диск
        upload_dir = f"/var/data/starec-advocat/uploads/case_{case_id}"
        os.makedirs(upload_dir, exist_ok=True)

        file_path = os.path.join(upload_dir, file_metadata['name'])
        with open(file_path, 'wb') as f:
            f.write(file_content.getvalue())

        # TODO: Создать запись Volume в базе данных
        # TODO: Поставить задачу на OCR обработку в Celery

        return {
            "file_id": file_id,
            "file_name": file_metadata['name'],
            "file_path": file_path,
            "size": file_metadata.get('size'),
            "message": "Файл успешно загружен"
        }

    except Exception as e:
        raise HTTPException(
            status_code=status.HTTP_500_INTERNAL_SERVER_ERROR,
            detail=f"Ошибка при загрузке файла: {str(e)}"
        )


@router.post("/sync-folder")
async def sync_folder(
    folder_id: str,
    case_id: int,
    access_token: str,
    db: Session = Depends(get_db)
):
    """Синхронизация всей папки из Google Drive"""

    try:
        # Проверяем существование дела
        case = db.query(Case).filter(Case.id == case_id).first()
        if not case:
            raise HTTPException(
                status_code=status.HTTP_404_NOT_FOUND,
                detail="Дело не найдено"
            )

        # Получаем список файлов
        credentials = Credentials(token=access_token)
        service = build('drive', 'v3', credentials=credentials)

        query = f"'{folder_id}' in parents and mimeType='application/pdf'"
        results = service.files().list(
            q=query,
            pageSize=1000,
            fields="files(id, name, mimeType, size)"
        ).execute()

        files = results.get('files', [])

        # Загружаем каждый файл
        downloaded_files = []
        upload_dir = f"/var/data/starec-advocat/uploads/case_{case_id}"
        os.makedirs(upload_dir, exist_ok=True)

        for file in files:
            try:
                # Скачиваем файл
                request = service.files().get_media(fileId=file['id'])
                file_content = io.BytesIO()
                downloader = MediaIoBaseDownload(file_content, request)

                done = False
                while done is False:
                    status_progress, done = downloader.next_chunk()

                # Сохраняем файл
                file_path = os.path.join(upload_dir, file['name'])
                with open(file_path, 'wb') as f:
                    f.write(file_content.getvalue())

                downloaded_files.append({
                    "id": file['id'],
                    "name": file['name'],
                    "path": file_path,
                    "size": file.get('size')
                })

            except Exception as e:
                print(f"Ошибка при загрузке файла {file['name']}: {str(e)}")
                continue

        # TODO: Создать записи Volume в базе данных
        # TODO: Поставить задачи на OCR обработку в Celery

        return {
            "case_id": case_id,
            "folder_id": folder_id,
            "total_files": len(files),
            "downloaded": len(downloaded_files),
            "files": downloaded_files,
            "message": f"Синхронизировано {len(downloaded_files)} из {len(files)} файлов"
        }

    except Exception as e:
        raise HTTPException(
            status_code=status.HTTP_500_INTERNAL_SERVER_ERROR,
            detail=f"Ошибка при синхронизации папки: {str(e)}"
        )
