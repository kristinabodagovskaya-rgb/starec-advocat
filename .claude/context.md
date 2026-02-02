# Контекст проекта Starec-Advocat

**Дата:** 2026-01-30
**Последний коммит:** `0b78d39` — feat(ocr): история версий OCR, переключение версий, векторизация

## Структура проекта

```
/backend - FastAPI бэкенд (Python)
  /app/api/v1/cases.py - API для дел, томов, OCR, векторизации
  /app/models/case.py - Модели: Case, Volume, Document, OcrRun, PageText, TextChunk, ExtractionRun
  /app/services/ocr_service.py - Сервис OCR
  local_starec.db - SQLite база данных

/frontend - React + Vite фронтенд
  /src/pages/cases/PDFViewerPage.tsx - Главная страница просмотра томов
```

## База данных (local_starec.db)

**Тома (volumes):**
- id=1: Копия Обвинительное заключение все.pdf
- id=2: Том 001.pdf (332 страницы OCR)
- id=3: Том 2.pdf (16 страниц OCR)
- id=4: Том 3.pdf (10 страниц OCR, 82 документа)

**OCR Runs для тома 4 (Том 3.pdf):**
- id=5: claude-sonnet (10 страниц)
- id=2,4,6,7,8,9: claude-haiku (по 10 страниц)

## Что реализовано

### OCR распознавание
- Tesseract и Claude (Haiku/Sonnet)
- История версий OCR с переключением
- Кнопка "Загрузить" для каждой версии

### Выделение документов
- Claude API анализирует страницы
- Находит границы документов (title, date, page_start, page_end)
- История версий выделений
- Кнопка "Загрузить" для переключения версий

### Векторизация
- Кнопка "Векторизация" в header
- Разбивает текст на chunks по 1000 символов с overlap 200
- Сохраняет в таблицу text_chunks
- Показывает количество chunks после векторизации

### UI (PDFViewerPage)
- Header с кнопками: OCR Tesseract, OCR Claude, История, Выделить документы, Показать текст, Векторизация, Скрыть
- Слева: PDF viewer (iframe)
- Справа: OCR текст или список документов
- Модальное окно История с вкладками OCR/Выделения

## API Endpoints

```
GET  /api/cases/{case_id}/volumes/{volume_id}/all-pages-text - текст последнего OCR run
GET  /api/cases/{case_id}/volumes/{volume_id}/ocr-history - история OCR
GET  /api/cases/{case_id}/volumes/{volume_id}/ocr-run/{run_id}/pages - страницы конкретного run
GET  /api/cases/{case_id}/volumes/{volume_id}/extraction-history - история выделений
GET  /api/cases/{case_id}/volumes/{volume_id}/documents?version=N - документы версии
POST /api/cases/{case_id}/volumes/{volume_id}/vectorize - векторизация текста
GET  /api/cases/{case_id}/volumes/{volume_id}/chunks - получить chunks
```

## Известные особенности

1. volume_id != volume_number (id=4 это "Том 3.pdf")
2. Все OCR runs для тома 4 имеют только 10 страниц (первые страницы - титульные)
3. При переключении версий OCR используется currentOcrRunId в React key для перерисовки

## Запуск

```bash
# Backend
cd backend && source venv/bin/activate && uvicorn app.main:app --reload --port 8000

# Frontend
cd frontend && npm run dev
```

URL: http://127.0.0.1:3000/cases/1/volumes/4/view

## TODO

- [ ] Embeddings для chunks (Voyage API или Anthropic)
- [ ] Семантический поиск по chunks
- [ ] Полное распознавание всех страниц тома 4 (167 страниц)
