"""
API для работы с делами
"""

from fastapi import APIRouter, Depends, HTTPException, status, UploadFile, File, Form
from fastapi.responses import FileResponse, StreamingResponse
from sqlalchemy.orm import Session
from typing import List, Optional
from pydantic import BaseModel
from urllib.parse import quote
import os
import re
import json
import base64

from app.models import get_db, Case, Volume, Document, ExtractionRun
from app.core.config import settings

# Для работы с PDF и Claude API
try:
    import fitz  # PyMuPDF
    HAS_PYMUPDF = True
except ImportError:
    HAS_PYMUPDF = False

try:
    import anthropic
    HAS_ANTHROPIC = True
except ImportError:
    HAS_ANTHROPIC = False

try:
    from openai import OpenAI
    HAS_OPENAI = True
except ImportError:
    HAS_OPENAI = False

try:
    import pytesseract
    from PIL import Image
    import io
    HAS_TESSERACT = True
except ImportError:
    HAS_TESSERACT = False

router = APIRouter()

# Используем настраиваемую директорию для загрузок
UPLOAD_BASE_DIR = settings.UPLOAD_DIR

class CaseCreate(BaseModel):
    case_number: str
    title: str
    article: str = None
    defendant_name: str = None
    investigation_organ: str = None
    initiation_date: str = None
    notes: str = None


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

    # Возвращаем простой массив для frontend
    result = []
    for case in cases:
        # Подсчитываем реальное количество томов
        volumes_count = db.query(Volume).filter(Volume.case_id == case.id).count()

        result.append({
            "id": case.id,
            "case_number": case.case_number,
            "title": case.title,
            "article": case.article,
            "defendant_name": case.defendant_name,
            "status": case.status,
            "volumes_count": volumes_count,
            "documents_count": 0,  # TODO: calculate from documents table
            "processing_progress": 0,  # TODO: calculate
            "created_at": case.created_at.isoformat(),
            "updated_at": case.updated_at.isoformat()
        })

    return result


@router.post("/")
async def create_case(
    case_data: CaseCreate,
    db: Session = Depends(get_db)
):
    """Создать новое дело"""

    # TODO: Добавить аутентификацию
    user_id = 1  # Временно

    new_case = Case(
        user_id=user_id,
        case_number=case_data.case_number,
        title=case_data.title,
        article=case_data.article,
        defendant_name=case_data.defendant_name,
        investigative_body=case_data.investigation_organ,
        notes=case_data.notes
    )

    db.add(new_case)
    db.commit()
    db.refresh(new_case)

    # Возвращаем данные в формате, который ожидает frontend
    return {
        "id": new_case.id,
        "case_number": new_case.case_number,
        "title": new_case.title,
        "article": new_case.article,
        "defendant_name": new_case.defendant_name,
        "status": new_case.status,
        "created_at": new_case.created_at.isoformat()
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

    # Подсчитываем реальное количество томов
    volumes_count = db.query(Volume).filter(Volume.case_id == case_id).count()

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
        "volumes_count": volumes_count,
        "documents_count": 0,
        "processing_progress": 0,
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

    # Проверяем существование дела
    case = db.query(Case).filter(Case.id == case_id).first()
    if not case:
        raise HTTPException(
            status_code=status.HTTP_404_NOT_FOUND,
            detail="Дело не найдено"
        )

    # Получаем тома дела
    volumes = db.query(Volume).filter(Volume.case_id == case_id).order_by(Volume.volume_number).all()

    return [
        {
            "id": vol.id,
            "volume_number": vol.volume_number,
            "file_name": vol.file_name,
            "file_size": vol.file_size,
            "page_count": vol.page_count,
            "processing_status": vol.processing_status,
            "ocr_quality": vol.ocr_quality,
            "created_at": vol.created_at.isoformat() if vol.created_at else None
        }
        for vol in volumes
    ]


@router.delete("/{case_id}/volumes/{volume_id}")
async def delete_volume(
    case_id: int,
    volume_id: int,
    db: Session = Depends(get_db)
):
    """Удалить том"""

    volume = db.query(Volume).filter(
        Volume.id == volume_id,
        Volume.case_id == case_id
    ).first()

    if not volume:
        raise HTTPException(
            status_code=status.HTTP_404_NOT_FOUND,
            detail="Том не найден"
        )

    # Удаляем файл с диска если существует
    upload_dir = os.path.join(UPLOAD_BASE_DIR, f"case_{case_id}")
    file_path = os.path.join(upload_dir, volume.file_name)
    if os.path.exists(file_path):
        os.remove(file_path)

    db.delete(volume)
    db.commit()

    return {"message": "Том успешно удален"}


@router.get("/{case_id}/volumes/{volume_id}/file")
async def get_volume_file(
    case_id: int,
    volume_id: int,
    db: Session = Depends(get_db)
):
    """Получить PDF файл тома"""

    volume = db.query(Volume).filter(
        Volume.id == volume_id,
        Volume.case_id == case_id
    ).first()

    if not volume:
        raise HTTPException(
            status_code=status.HTTP_404_NOT_FOUND,
            detail="Том не найден"
        )

    # Путь к файлу
    upload_dir = os.path.join(UPLOAD_BASE_DIR, f"case_{case_id}")
    file_path = os.path.join(upload_dir, volume.file_name)

    if not os.path.exists(file_path):
        raise HTTPException(
            status_code=status.HTTP_404_NOT_FOUND,
            detail="Файл не найден на сервере"
        )

    # Encode filename for Content-Disposition header (supports Cyrillic)
    encoded_filename = quote(volume.file_name)
    return FileResponse(
        path=file_path,
        media_type="application/pdf",
        headers={"Content-Disposition": f"inline; filename*=UTF-8''{encoded_filename}"}
    )


@router.post("/{case_id}/volumes/{volume_id}/extract-documents")
async def extract_documents_from_volume(
    case_id: int,
    volume_id: int,
    db: Session = Depends(get_db)
):
    """
    Извлечь список документов из PDF тома с помощью Claude AI.
    Анализирует структуру PDF (ОПИСЬ) и определяет границы документов.
    """

    if not HAS_PYMUPDF:
        raise HTTPException(
            status_code=status.HTTP_500_INTERNAL_SERVER_ERROR,
            detail="PyMuPDF не установлен. Выполните: pip install pymupdf"
        )

    if not HAS_ANTHROPIC:
        raise HTTPException(
            status_code=status.HTTP_500_INTERNAL_SERVER_ERROR,
            detail="Anthropic не установлен. Выполните: pip install anthropic"
        )

    if not settings.ANTHROPIC_API_KEY:
        raise HTTPException(
            status_code=status.HTTP_500_INTERNAL_SERVER_ERROR,
            detail="ANTHROPIC_API_KEY не настроен. Добавьте ключ в .env файл"
        )

    # Получаем том из базы
    volume = db.query(Volume).filter(
        Volume.id == volume_id,
        Volume.case_id == case_id
    ).first()

    if not volume:
        raise HTTPException(
            status_code=status.HTTP_404_NOT_FOUND,
            detail="Том не найден"
        )

    # Путь к файлу
    upload_dir = os.path.join(UPLOAD_BASE_DIR, f"case_{case_id}")
    file_path = os.path.join(upload_dir, volume.file_name)

    if not os.path.exists(file_path):
        raise HTTPException(
            status_code=status.HTTP_404_NOT_FOUND,
            detail="Файл не найден на сервере"
        )

    try:
        # Открываем PDF
        doc = fitz.open(file_path)
        total_pages = len(doc)

        # Извлекаем текст первых 30 страниц для проверки типа PDF
        test_text_length = 0
        for page_num in range(min(30, total_pages)):
            page = doc[page_num]
            test_text_length += len(page.get_text().strip())

        is_scanned = test_text_length < 500
        print(f"[DEBUG] Text length: {test_text_length}, is_scanned: {is_scanned}")

        # ===== Claude Vision SONNET - верхняя половина страницы (ТЕСТ: 30 страниц) =====
        print(f"[DEBUG] Claude Vision SONNET started (TEST: first 30 pages)")

        client = anthropic.Anthropic(api_key=settings.ANTHROPIC_API_KEY)

        def get_page_image(page, crop_ratio=0.9):
            """Получает картинку страницы (90% чтобы видеть подписи внизу)"""
            # Уменьшенный масштаб для экономии (1.2 вместо 1.5)
            full_pix = page.get_pixmap(matrix=fitz.Matrix(1.2, 1.2))

            # Обрезаем до нужной части
            height = full_pix.height
            crop_height = int(height * crop_ratio)

            # Создаём обрезанное изображение
            img = Image.frombytes("RGB", [full_pix.width, full_pix.height], full_pix.samples)
            cropped = img.crop((0, 0, full_pix.width, crop_height))

            # Конвертируем в JPEG (quality=80 для компенсации увеличенного размера)
            buffer = io.BytesIO()
            cropped.save(buffer, format="JPEG", quality=80, optimize=True)
            img_base64 = base64.b64encode(buffer.getvalue()).decode('utf-8')

            return img_base64

        # Системный промпт для анализа документов (сжатый)
        system_prompt = """Анализ страниц уголовного дела. Определи границы документов.

ПРАВИЛА:
1. ОПИСЬ = таблица ДОКУМЕНТОВ (№|Наименование|Листы) в НАЧАЛЕ тома — ОДИН документ!

2. НАЧАЛО (is_start=true): заголовок вверху (ПОСТАНОВЛЕНИЕ/ПРОТОКОЛ/РАПОРТ) ИЛИ шапка организации ИЛИ номер/дата исх.

3. ПРОДОЛЖЕНИЕ (is_start=false): нет заголовка/шапки вверху — только текст/таблицы/подписи.

4. ДАТА: только из заголовка или подписи! Неразборчивая → date=""

5. ФАМИЛИИ: мужское имя → муж.фамилия (-ов/-ин), женское → жен. (-ова/-ина)

6. НАЗВАНИЯ организаций: незнакомое слово — прочитай ПОБУКВЕННО и запиши как видишь!

7. КОНТЕКСТ: помни предыдущие страницы — документ продолжается пока нет нового заголовка!

JSON: {is_start, is_end, is_opis, type, title, date}"""

        # История диалога для сохранения контекста
        conversation_history = []

        def analyze_page_with_context(page, page_num: int, history: list) -> dict:
            """Анализирует страницу с учётом истории предыдущих страниц"""
            try:
                img_base64 = get_page_image(page, crop_ratio=0.9)

                # Добавляем новую страницу в историю
                history.append({
                    "role": "user",
                    "content": [
                        {
                            "type": "image",
                            "source": {
                                "type": "base64",
                                "media_type": "image/jpeg",
                                "data": img_base64
                            }
                        },
                        {
                            "type": "text",
                            "text": f"Страница {page_num + 1}. Это НАЧАЛО нового документа (есть заголовок вверху)? JSON: {{is_start, is_end, is_opis, type, title, date}}"
                        }
                    ]
                })

                response = client.messages.create(
                    model="claude-sonnet-4-20250514",
                    max_tokens=300,
                    system=system_prompt,
                    messages=history[-10:]  # Последние 10 сообщений для контекста (5 страниц)
                )

                content = response.content[0].text.strip()
                print(f"[DEBUG] Page {page_num + 1}: {content[:80]}")

                # Добавляем ответ в историю
                history.append({
                    "role": "assistant",
                    "content": content
                })

                # Парсим JSON
                if content.startswith("```"):
                    content = re.sub(r'^```json?\s*', '', content)
                    content = re.sub(r'\s*```$', '', content)

                json_match = re.search(r'\{[^}]+\}', content)
                if json_match:
                    content = json_match.group(0)

                return json.loads(content)

            except Exception as e:
                print(f"[DEBUG] Error page {page_num + 1}: {e}")
                return {"is_start": False, "is_opis": False, "type": "Unknown", "title": ""}

        documents = []
        current_doc = None
        in_opis = False  # Флаг: сейчас внутри ОПИСИ
        opis_start_page = None

        # Весь документ: с 1 страницы до конца
        start_page = 0
        end_page = total_pages
        print(f"[DEBUG] Analyzing pages 1-{end_page} ({end_page} pages)...")

        for page_num in range(start_page, end_page):
            if page_num % 10 == 0:
                print(f"[DEBUG] Processing page {page_num + 1}/{end_page}")

            page = doc.load_page(page_num)

            # Анализируем с сохранением контекста диалога
            vision_result = analyze_page_with_context(page, page_num, conversation_history)

            # Проверяем: это ОПИСЬ?
            if vision_result.get("is_opis"):
                if not in_opis:
                    # Начало ОПИСИ - закрываем предыдущий документ
                    if current_doc:
                        current_doc["end_page"] = page_num
                        documents.append(current_doc)
                        current_doc = None

                    # Начинаем ОПИСЬ как один документ
                    in_opis = True
                    opis_start_page = page_num + 1
                    print(f"[DEBUG] ОПИСЬ НАЧАЛАСЬ: стр.{page_num + 1}")
                else:
                    # Продолжение ОПИСИ
                    print(f"[DEBUG] ОПИСЬ продолжается: стр.{page_num + 1}")
                continue  # Не обрабатываем содержимое описи как документы!

            # Если в ОПИСИ - проверяем ТОЛЬКО начало реального документа
            if in_opis:
                # Закрываем ОПИСЬ только если началcя РЕАЛЬНЫЙ документ (is_start=true, is_opis=false)
                if vision_result.get("is_start") and not vision_result.get("is_opis"):
                    # Закрываем ОПИСЬ
                    documents.append({
                        "title": "Опись материалов уголовного дела",
                        "type": "Опись",
                        "start_page": opis_start_page,
                        "end_page": page_num,  # Предыдущая страница
                        "date": ""
                    })
                    in_opis = False
                    print(f"[DEBUG] ОПИСЬ ЗАКОНЧИЛАСЬ: стр.{opis_start_page}-{page_num}")
                    # Продолжаем обработку этой страницы как начало документа (не continue!)
                else:
                    # Страница не опознана, но мы в описи — считаем продолжением описи
                    print(f"[DEBUG] ОПИСЬ (неявно): стр.{page_num + 1}")
                    continue

            # Проверяем конец документа
            if vision_result.get("is_end") and current_doc:
                current_doc["end_page"] = page_num + 1
                print(f"[DEBUG] END: стр.{page_num + 1} - конец «{current_doc['title'][:40]}»")

            # Проверяем начало нового документа
            if vision_result.get("is_start") and not vision_result.get("is_opis"):
                # Закрываем предыдущий документ
                if current_doc:
                    if current_doc["end_page"] < page_num:
                        current_doc["end_page"] = page_num
                    documents.append(current_doc)

                # Получаем название и делаем первую букву заглавной
                title = (vision_result.get("title") or "Документ").strip()
                if title:
                    title = title[0].upper() + title[1:] if len(title) > 1 else title.upper()

                doc_date = vision_result.get("date", "")
                doc_type = vision_result.get("type", "Документ")

                # Начинаем новый документ
                current_doc = {
                    "title": title,
                    "type": doc_type,
                    "start_page": page_num + 1,
                    "end_page": page_num + 1,
                    "date": doc_date
                }
                print(f"[DEBUG] START: стр.{page_num + 1} - {doc_type} - «{title[:50]}» {doc_date}")

        # Закрываем незавершённую ОПИСЬ
        if in_opis:
            documents.append({
                "title": "Опись материалов уголовного дела",
                "type": "Опись",
                "start_page": opis_start_page,
                "end_page": end_page,
                "date": ""
            })
            print(f"[DEBUG] ОПИСЬ ЗАКОНЧИЛАСЬ (конец файла): стр.{opis_start_page}-{end_page}")

        # Последний документ
        if current_doc:
            current_doc["end_page"] = end_page
            documents.append(current_doc)

        doc.close()

        analyzed_pages = end_page - start_page
        print(f"[DEBUG] Vision found {len(documents)} documents in {analyzed_pages} pages (pages {start_page + 1}-{end_page})")

        # Удаляем старые документы этого тома
        db.query(Document).filter(Document.volume_id == volume_id).delete()
        db.commit()

        # Сохраняем документы в БД
        validated_docs = []
        for i, d in enumerate(documents):
            doc_end_page = documents[i + 1]["start_page"] - 1 if i + 1 < len(documents) else end_page

            # Создаём запись в БД
            db_doc = Document(
                case_id=case_id,
                volume_id=volume_id,
                doc_type=d["type"],
                title=d["title"],
                start_page=d["start_page"],
                end_page=doc_end_page,
                document_date=d.get("date") or None,
            )
            db.add(db_doc)
            db.flush()  # Получаем ID

            validated_docs.append({
                "id": db_doc.id,
                "title": d["title"],
                "doc_type": d["type"],
                "page_start": d["start_page"],
                "page_end": doc_end_page,
                "date": d.get("date", "")
            })

        db.commit()
        print(f"[DEBUG] Saved {len(validated_docs)} documents to database")

        return {
            "documents": validated_docs,
            "total_pages": total_pages,
            "analyzed_pages": analyzed_pages,
            "start_page": start_page + 1,
            "end_page": end_page,
            "method": "claude_vision",
            "saved_to_db": True
        }

    except Exception as e:
        raise HTTPException(
            status_code=status.HTTP_500_INTERNAL_SERVER_ERROR,
            detail=f"Ошибка при анализе документа: {str(e)}"
        )


@router.get("/{case_id}/volumes/{volume_id}/documents")
async def get_volume_documents(
    case_id: int,
    volume_id: int,
    version: int = None,
    db: Session = Depends(get_db)
):
    """Получить сохранённые документы тома (текущая версия или указанная)"""

    # Проверяем том
    volume = db.query(Volume).filter(
        Volume.id == volume_id,
        Volume.case_id == case_id
    ).first()

    if not volume:
        raise HTTPException(status_code=404, detail="Том не найден")

    # Находим нужный ExtractionRun
    if version:
        extraction_run = db.query(ExtractionRun).filter(
            ExtractionRun.volume_id == volume_id,
            ExtractionRun.version == version
        ).first()
    else:
        extraction_run = db.query(ExtractionRun).filter(
            ExtractionRun.volume_id == volume_id,
            ExtractionRun.is_current == 1
        ).first()

    if not extraction_run:
        # Возвращаем старые документы без версии (обратная совместимость)
        documents = db.query(Document).filter(
            Document.volume_id == volume_id,
            Document.extraction_run_id == None
        ).order_by(Document.start_page).all()
    else:
        documents = db.query(Document).filter(
            Document.extraction_run_id == extraction_run.id
        ).order_by(Document.start_page).all()

    return {
        "documents": [
            {
                "id": doc.id,
                "title": doc.title,
                "doc_type": doc.doc_type,
                "page_start": doc.start_page,
                "page_end": doc.end_page,
                "date": doc.document_date.strftime("%d.%m.%Y") if doc.document_date else ""
            }
            for doc in documents
        ],
        "total": len(documents),
        "version": extraction_run.version if extraction_run else None,
        "created_at": extraction_run.created_at.isoformat() if extraction_run else None
    }


@router.get("/{case_id}/volumes/{volume_id}/extraction-history")
async def get_extraction_history(
    case_id: int,
    volume_id: int,
    db: Session = Depends(get_db)
):
    """Получить историю всех выделений тома"""

    runs = db.query(ExtractionRun).filter(
        ExtractionRun.volume_id == volume_id
    ).order_by(ExtractionRun.version.desc()).all()

    return {
        "versions": [
            {
                "version": run.version,
                "documents_count": run.documents_count,
                "total_pages": run.total_pages,
                "crop_ratio": run.crop_ratio,
                "model_used": run.model_used,
                "is_current": run.is_current == 1,
                "created_at": run.created_at.isoformat() if run.created_at else None
            }
            for run in runs
        ],
        "total_versions": len(runs)
    }


@router.get("/{case_id}/volumes/{volume_id}/extract-documents-stream")
async def extract_documents_stream(
    case_id: int,
    volume_id: int,
    db: Session = Depends(get_db)
):
    """
    SSE endpoint для извлечения документов с прогрессом.
    Отправляет события: progress (0-100%), complete (документы), error
    """

    async def generate():
        try:
            if not HAS_PYMUPDF or not HAS_ANTHROPIC:
                yield f"data: {json.dumps({'type': 'error', 'message': 'Библиотеки не установлены'})}\n\n"
                return

            if not settings.ANTHROPIC_API_KEY:
                yield f"data: {json.dumps({'type': 'error', 'message': 'ANTHROPIC_API_KEY не настроен'})}\n\n"
                return

            # Получаем том
            volume = db.query(Volume).filter(
                Volume.id == volume_id,
                Volume.case_id == case_id
            ).first()

            if not volume:
                yield f"data: {json.dumps({'type': 'error', 'message': 'Том не найден'})}\n\n"
                return

            upload_dir = os.path.join(UPLOAD_BASE_DIR, f"case_{case_id}")
            file_path = os.path.join(upload_dir, volume.file_name)

            if not os.path.exists(file_path):
                yield f"data: {json.dumps({'type': 'error', 'message': 'Файл не найден'})}\n\n"
                return

            # Открываем PDF
            doc = fitz.open(file_path)
            total_pages = len(doc)

            yield f"data: {json.dumps({'type': 'progress', 'progress': 1, 'message': f'Открыт PDF: {total_pages} страниц'})}\n\n"

            client = anthropic.Anthropic(api_key=settings.ANTHROPIC_API_KEY)

            def get_page_image(page, crop_ratio=0.9):
                full_pix = page.get_pixmap(matrix=fitz.Matrix(1.2, 1.2))
                height = full_pix.height
                crop_height = int(height * crop_ratio)
                img = Image.frombytes("RGB", [full_pix.width, full_pix.height], full_pix.samples)
                cropped = img.crop((0, 0, full_pix.width, crop_height))
                buffer = io.BytesIO()
                cropped.save(buffer, format="JPEG", quality=80, optimize=True)
                return base64.b64encode(buffer.getvalue()).decode('utf-8')

            # Сжатый системный промпт
            system_prompt = """Анализ страниц уголовного дела. Определи границы документов.

ПРАВИЛА:
1. ОПИСЬ = таблица ДОКУМЕНТОВ (№|Наименование|Листы) в НАЧАЛЕ тома — ОДИН документ!

2. НАЧАЛО (is_start=true): заголовок вверху (ПОСТАНОВЛЕНИЕ/ПРОТОКОЛ/РАПОРТ) ИЛИ шапка организации ИЛИ номер/дата исх.

3. ПРОДОЛЖЕНИЕ (is_start=false): нет заголовка/шапки вверху — только текст/таблицы/подписи.

4. ДАТА: только из заголовка или подписи! Неразборчивая → date=""

5. ФАМИЛИИ: мужское имя → муж.фамилия (-ов/-ин), женское → жен. (-ова/-ина)

6. НАЗВАНИЯ организаций: незнакомое слово — прочитай ПОБУКВЕННО и запиши как видишь!

7. КОНТЕКСТ: помни предыдущие страницы — документ продолжается пока нет нового заголовка!

JSON: {is_start, is_end, is_opis, type, title, date}"""

            conversation_history = []

            def analyze_page(page, page_num: int, history: list) -> dict:
                try:
                    img_base64 = get_page_image(page, crop_ratio=0.9)
                    history.append({
                        "role": "user",
                        "content": [
                            {"type": "image", "source": {"type": "base64", "media_type": "image/jpeg", "data": img_base64}},
                            {"type": "text", "text": f"Страница {page_num + 1}. Это НАЧАЛО нового документа (есть заголовок вверху)? JSON: {{is_start, is_end, is_opis, type, title, date}}"}
                        ]
                    })
                    response = client.messages.create(
                        model="claude-sonnet-4-20250514",
                        max_tokens=300,
                        system=system_prompt,
                        messages=history[-10:]
                    )
                    content = response.content[0].text.strip()
                    history.append({"role": "assistant", "content": content})

                    if content.startswith("```"):
                        content = re.sub(r'^```json?\s*', '', content)
                        content = re.sub(r'\s*```$', '', content)
                    json_match = re.search(r'\{[^}]+\}', content)
                    if json_match:
                        content = json_match.group(0)
                    return json.loads(content)
                except Exception as e:
                    print(f"[SSE] Error page {page_num + 1}: {e}")
                    return {"is_start": False, "is_opis": False, "type": "Unknown", "title": ""}

            documents = []
            current_doc = None
            in_opis = False
            opis_start_page = None

            for page_num in range(total_pages):
                # Отправляем прогресс
                progress = int((page_num + 1) / total_pages * 100)
                yield f"data: {json.dumps({'type': 'progress', 'progress': progress, 'page': page_num + 1, 'total': total_pages})}\n\n"

                page = doc.load_page(page_num)
                result = analyze_page(page, page_num, conversation_history)

                # Обработка ОПИСИ
                if result.get("is_opis"):
                    if not in_opis:
                        if current_doc:
                            current_doc["end_page"] = page_num
                            documents.append(current_doc)
                            current_doc = None
                        in_opis = True
                        opis_start_page = page_num + 1
                    continue

                if in_opis:
                    if result.get("is_start") and not result.get("is_opis"):
                        documents.append({
                            "title": "Опись материалов уголовного дела",
                            "type": "Опись",
                            "start_page": opis_start_page,
                            "end_page": page_num,
                            "date": ""
                        })
                        in_opis = False
                    else:
                        continue

                if result.get("is_end") and current_doc:
                    current_doc["end_page"] = page_num + 1

                if result.get("is_start") and not result.get("is_opis"):
                    if current_doc:
                        if current_doc["end_page"] < page_num:
                            current_doc["end_page"] = page_num
                        documents.append(current_doc)

                    title = (result.get("title") or "Документ").strip()
                    if title:
                        title = title[0].upper() + title[1:] if len(title) > 1 else title.upper()

                    current_doc = {
                        "title": title,
                        "type": result.get("type", "Документ"),
                        "start_page": page_num + 1,
                        "end_page": page_num + 1,
                        "date": result.get("date", "")
                    }

            # Закрываем незавершённые
            if in_opis:
                documents.append({
                    "title": "Опись материалов уголовного дела",
                    "type": "Опись",
                    "start_page": opis_start_page,
                    "end_page": total_pages,
                    "date": ""
                })
            if current_doc:
                current_doc["end_page"] = total_pages
                documents.append(current_doc)

            doc.close()

            # Сохраняем в БД с версионированием
            # Помечаем старые выделения как неактивные
            db.query(ExtractionRun).filter(
                ExtractionRun.volume_id == volume_id,
                ExtractionRun.is_current == 1
            ).update({"is_current": 0})

            # Определяем номер версии
            last_run = db.query(ExtractionRun).filter(
                ExtractionRun.volume_id == volume_id
            ).order_by(ExtractionRun.version.desc()).first()
            new_version = (last_run.version + 1) if last_run else 1

            # Создаём новый ExtractionRun
            extraction_run = ExtractionRun(
                volume_id=volume_id,
                version=new_version,
                documents_count=len(documents),
                total_pages=total_pages,
                crop_ratio="0.9",
                model_used="claude-sonnet-4-20250514",
                is_current=1
            )
            db.add(extraction_run)
            db.flush()

            validated_docs = []
            for i, d in enumerate(documents):
                doc_end = documents[i + 1]["start_page"] - 1 if i + 1 < len(documents) else total_pages
                db_doc = Document(
                    case_id=case_id,
                    volume_id=volume_id,
                    extraction_run_id=extraction_run.id,
                    doc_type=d["type"],
                    title=d["title"],
                    start_page=d["start_page"],
                    end_page=doc_end,
                    document_date=d.get("date") or None,
                )
                db.add(db_doc)
                db.flush()
                validated_docs.append({
                    "id": db_doc.id,
                    "title": d["title"],
                    "doc_type": d["type"],
                    "page_start": d["start_page"],
                    "page_end": doc_end,
                    "date": d.get("date", "")
                })

            db.commit()

            yield f"data: {json.dumps({'type': 'complete', 'documents': validated_docs, 'total_pages': total_pages, 'version': new_version})}\n\n"

        except Exception as e:
            yield f"data: {json.dumps({'type': 'error', 'message': str(e)})}\n\n"

    return StreamingResponse(
        generate(),
        media_type="text/event-stream",
        headers={
            "Cache-Control": "no-cache",
            "Connection": "keep-alive",
            "X-Accel-Buffering": "no"
        }
    )


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

    # Считаем тома
    volumes_count = db.query(Volume).filter(Volume.case_id == case_id).count()

    # TODO: Добавить подсчет документов когда будет реализован
    documents_count = 0
    participants_count = 0
    events_count = 0

    return {
        "volumes_count": volumes_count,
        "documents_count": documents_count,
        "participants_count": participants_count,
        "events_count": events_count
    }


@router.post("/{case_id}/upload-volumes/")
async def upload_volumes(
    case_id: int,
    files: List[UploadFile] = File(...),
    db: Session = Depends(get_db)
):
    """Загрузить тома с компьютера"""

    # Проверяем существование дела
    case = db.query(Case).filter(Case.id == case_id).first()
    if not case:
        raise HTTPException(
            status_code=status.HTTP_404_NOT_FOUND,
            detail="Дело не найдено"
        )

    # Создаем директорию для загрузок
    upload_dir = os.path.join(UPLOAD_BASE_DIR, f"case_{case_id}")
    os.makedirs(upload_dir, exist_ok=True)

    uploaded_files = []

    for file in files:
        # Проверяем формат файла
        if not file.filename.endswith('.pdf'):
            continue

        # Сохраняем файл
        file_path = os.path.join(upload_dir, file.filename)

        with open(file_path, 'wb') as f:
            content = await file.read()
            f.write(content)

        file_size = len(content)

        # Создаем запись Volume в базе данных
        max_volume = db.query(Volume).filter(Volume.case_id == case_id).order_by(Volume.volume_number.desc()).first()
        next_volume_number = (max_volume.volume_number + 1) if max_volume else 1

        new_volume = Volume(
            case_id=case_id,
            volume_number=next_volume_number,
            file_name=file.filename,
            file_size=file_size,
            processing_status="pending"
        )
        db.add(new_volume)
        db.commit()
        db.refresh(new_volume)

        uploaded_files.append({
            "filename": file.filename,
            "path": file_path,
            "size": file_size,
            "volume_id": new_volume.id,
            "volume_number": new_volume.volume_number
        })

    return {
        "case_id": case_id,
        "uploaded": len(uploaded_files),
        "files": uploaded_files,
        "message": f"Загружено {len(uploaded_files)} файлов"
    }


class GDriveSyncRequest(BaseModel):
    gdrive_link: str


@router.post("/{case_id}/sync-gdrive/")
async def sync_gdrive_folder(
    case_id: int,
    request: GDriveSyncRequest,
    db: Session = Depends(get_db)
):
    """Синхронизация томов из публичной папки/файла Google Drive"""

    # Проверяем существование дела
    case = db.query(Case).filter(Case.id == case_id).first()
    if not case:
        raise HTTPException(
            status_code=status.HTTP_404_NOT_FOUND,
            detail="Дело не найдено"
        )

    # Извлекаем ID из ссылки (поддержка папок и файлов)
    folder_match = re.search(r'/folders/([a-zA-Z0-9_-]+)', request.gdrive_link)
    file_match = re.search(r'/file/d/([a-zA-Z0-9_-]+)', request.gdrive_link)

    resource_type = None
    resource_id = None

    if folder_match:
        resource_type = "folder"
        resource_id = folder_match.group(1)
    elif file_match:
        resource_type = "file"
        resource_id = file_match.group(1)
    else:
        raise HTTPException(
            status_code=status.HTTP_400_BAD_REQUEST,
            detail="Неверная ссылка на Google Drive. Поддерживаются ссылки на папки и файлы."
        )

    try:
        # Импортируем необходимые библиотеки
        import httpx
        import json

        # Создаем директорию для загрузок
        upload_dir = os.path.join(UPLOAD_BASE_DIR, f"case_{case_id}")
        os.makedirs(upload_dir, exist_ok=True)

        downloaded_files = []

        if resource_type == "file":
            # Загрузка одного файла
            async with httpx.AsyncClient(follow_redirects=True, timeout=300.0) as client:
                # Сначала получаем имя файла через Google Drive API
                metadata_url = f"https://www.googleapis.com/drive/v3/files/{resource_id}?fields=name,size&key=AIzaSyC1qbk75GzWMsU2EmFQsyRous9fRj5OV9k"
                meta_response = await client.get(metadata_url)

                if meta_response.status_code == 200:
                    file_meta = meta_response.json()
                    original_filename = file_meta.get('name', f'Том_{resource_id}.pdf')
                else:
                    original_filename = f'Том_{resource_id}.pdf'

                # Скачиваем файл (с обработкой больших файлов и virus scan)
                # Сразу используем confirm=t чтобы обойти все предупреждения
                download_url = f"https://drive.google.com/uc?export=download&id={resource_id}&confirm=t"
                response = await client.get(download_url)

                # Проверяем что это реальный файл, а не HTML страница
                is_html = (
                    b'<!DOCTYPE html>' in response.content[:100] or
                    b'<html>' in response.content[:100] or
                    b'Virus scan warning' in response.content or
                    b'Google Drive' in response.content[:500]
                )

                if is_html:
                    raise HTTPException(
                        status_code=status.HTTP_400_BAD_REQUEST,
                        detail="Не удалось скачать файл. Google Drive требует ручного подтверждения. Скачайте файл вручную и загрузите через 'С компьютера'."
                    )

                if response.status_code == 200 and len(response.content) > 5000:
                    # Сохраняем файл с оригинальным именем
                    filename = original_filename
                    file_path = os.path.join(upload_dir, filename)

                    with open(file_path, 'wb') as f:
                        f.write(response.content)

                    file_size = len(response.content)

                    downloaded_files.append({
                        "filename": filename,
                        "path": file_path,
                        "size": file_size
                    })

                    # Создаем запись Volume в базе данных
                    # Определяем номер тома (следующий по порядку)
                    max_volume = db.query(Volume).filter(Volume.case_id == case_id).order_by(Volume.volume_number.desc()).first()
                    next_volume_number = (max_volume.volume_number + 1) if max_volume else 1

                    new_volume = Volume(
                        case_id=case_id,
                        volume_number=next_volume_number,
                        gdrive_file_id=resource_id,
                        file_name=filename,
                        file_size=file_size,
                        processing_status="pending"
                    )
                    db.add(new_volume)
                    db.commit()
                    db.refresh(new_volume)

                    downloaded_files[-1]["volume_id"] = new_volume.id
                    downloaded_files[-1]["volume_number"] = new_volume.volume_number
                else:
                    # Файл слишком маленький - скорее всего HTML страница с ошибкой
                    if len(response.content) < 1000:
                        raise HTTPException(
                            status_code=status.HTTP_400_BAD_REQUEST,
                            detail="Файл не загрузился. Убедитесь что файл публично доступен (настройки доступа: 'Все у кого есть ссылка')"
                        )
                    raise HTTPException(
                        status_code=status.HTTP_400_BAD_REQUEST,
                        detail=f"Не удалось скачать файл. Статус: {response.status_code}"
                    )

        elif resource_type == "folder":
            # Для папок нужен Google Drive API
            raise HTTPException(
                status_code=status.HTTP_400_BAD_REQUEST,
                detail="Пока поддерживаются только ссылки на отдельные файлы. Загрузите файлы по одному или используйте загрузку с компьютера."
            )

        return {
            "case_id": case_id,
            "resource_id": resource_id,
            "resource_type": resource_type,
            "downloaded": len(downloaded_files),
            "files": downloaded_files,
            "message": f"Загружено {len(downloaded_files)} файлов"
        }

    except httpx.RequestError as e:
        raise HTTPException(
            status_code=status.HTTP_500_INTERNAL_SERVER_ERROR,
            detail=f"Ошибка при загрузке файла: {str(e)}"
        )
    except Exception as e:
        raise HTTPException(
            status_code=status.HTTP_500_INTERNAL_SERVER_ERROR,
            detail=f"Ошибка: {str(e)}"
        )
