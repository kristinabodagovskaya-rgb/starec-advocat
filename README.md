# Starec-Advocat 2.0

**Система анализа уголовных дел для адвокатов**

Powered by AI (Claude Opus 4.5) для автоматического анализа томов дела, выявления нарушений и формирования стратегии защиты.

---

## 📋 Содержание

- [Возможности](#возможности)
- [Технологический стек](#технологический-стек)
- [Быстрый старт](#быстрый-старт)
- [Разработка](#разработка)
- [Deployment на Hetzner](#deployment-на-hetzner)
- [Документация](#документация)

---

## 🎯 Возможности

- ✅ **Загрузка 216+ томов** из Google Drive
- ✅ **Автоматическое OCR распознавание** текста
- ✅ **Выделение 1,847+ документов** из томов
- ✅ **AI-анализ каждого документа** (Claude Opus 4.5)
- ✅ **Выявление процессуальных нарушений**
- ✅ **Поиск противоречий в доказательствах**
- ✅ **Формирование стратегии защиты**
- ✅ **Экспорт в DOCX** согласно методологии

---

## 🛠️ Технологический стек

### Backend
- **FastAPI** (Python 3.11) - REST API
- **PostgreSQL 16** - Основная база данных
- **MongoDB 7** - Документы и файлы
- **Redis 7** - Кеш и очереди
- **Celery** - Фоновые задачи (OCR, анализ)
- **Claude API** - AI анализ
- **Tesseract OCR** - Распознавание текста

### Frontend
- **React 18** + **TypeScript**
- **Vite** - Сборщик
- **Tailwind CSS** - Стили
- **TanStack Query** - Управление состоянием сервера
- **Zustand** - Локальное состояние
- **Socket.IO** - Реал-тайм обновления

### Infrastructure
- **Docker Compose** - Оркестрация
- **Nginx** - Reverse proxy
- **Hetzner Server** - Германия
- **Cloudflare** - CDN + SSL

---

## 🚀 Быстрый старт

### Требования

- Docker и Docker Compose
- Node.js 20+ (для локальной разработки)
- Python 3.11+ (для локальной разработки)

### 1. Клонирование проекта

```bash
cd ~/Desktop
cd "Starec-Advocat 2.0"
```

### 2. Настройка переменных окружения

Создайте `.env` файл в корне проекта:

```bash
cp backend/.env.example backend/.env
```

Отредактируйте `.env`:

```env
# AI API Keys (обязательно!)
ANTHROPIC_API_KEY=your_anthropic_key_here
OPENAI_API_KEY=your_openai_key_here

# Google Drive (опционально)
GOOGLE_CLIENT_ID=your_google_client_id
GOOGLE_CLIENT_SECRET=your_google_client_secret

# Остальные настройки по умолчанию
```

### 3. Запуск через Docker Compose

```bash
# Создать папку для данных
mkdir -p data/{uploads,processed}

# Запустить все сервисы
docker-compose up -d

# Проверить статус
docker-compose ps

# Просмотр логов
docker-compose logs -f
```

### 4. Инициализация базы данных

```bash
# База данных создастся автоматически при первом запуске
# Проверить подключение
docker-compose exec postgres psql -U starec_user -d starec_advocat
```

### 5. Открыть приложение

- **Frontend**: http://localhost:3000
- **Backend API Docs**: http://localhost:8083/api/docs
- **Flower (Celery)**: http://localhost:5555

---

## 💻 Разработка

### Backend (локально)

```bash
cd backend

# Создать виртуальное окружение
python -m venv venv
source venv/bin/activate  # Linux/Mac
# или
venv\Scripts\activate  # Windows

# Установить зависимости
pip install -r requirements.txt

# Запустить сервер
uvicorn app.main:app --reload --port 8000
```

**API будет доступен на**: http://localhost:8000

### Frontend (локально)

```bash
cd frontend

# Установить зависимости
npm install

# Запустить dev сервер
npm run dev
```

**Frontend будет доступен на**: http://localhost:3000

### Celery Workers (локально)

```bash
cd backend
source venv/bin/activate

# OCR Worker
celery -A app.workers worker -Q ocr -c 3 --loglevel=info

# Analysis Worker
celery -A app.workers worker -Q analysis -c 2 --loglevel=info

# Beat (Scheduler)
celery -A app.workers beat --loglevel=info
```

---

## 🌐 Deployment на Hetzner

### Подключение к серверу

```bash
ssh root@136.243.71.213
```

### Установка Docker

```bash
# Установка Docker
curl -fsSL https://get.docker.com -o get-docker.sh
sh get-docker.sh

# Установка Docker Compose
apt install docker-compose-plugin -y
```

### Развертывание

```bash
# Создать директорию
mkdir -p /opt/starec-advocat
cd /opt/starec-advocat

# Склонировать проект (если используется Git)
# или загрузить файлы через SCP

# Создать .env файл
nano .env
# (вставить переменные окружения)

# Создать папки для данных
mkdir -p data/{uploads,processed}

# Запустить
docker-compose up -d

# Проверить
docker-compose ps
docker-compose logs -f
```

### Настройка Nginx (на сервере)

```nginx
server {
    listen 80;
    server_name advocat.starec.ai;

    location / {
        proxy_pass http://localhost:3000;
        proxy_set_header Host $host;
        proxy_set_header X-Real-IP $remote_addr;
    }

    location /api {
        proxy_pass http://localhost:8083;
        proxy_set_header Host $host;
        proxy_set_header X-Real-IP $remote_addr;
    }

    location /ws {
        proxy_pass http://localhost:8083;
        proxy_http_version 1.1;
        proxy_set_header Upgrade $http_upgrade;
        proxy_set_header Connection "upgrade";
    }
}
```

### SSL через Cloudflare

1. Добавить домен `advocat.starec.ai` в Cloudflare
2. Настроить DNS A-record → 136.243.71.213
3. Включить SSL/TLS (Full mode)
4. Готово!

---

## 📚 Документация

Полная документация находится в папке проекта:

- **АРХИТЕКТУРА_ПРОЕКТА_ДЕТАЛЬНАЯ.md** - Полная архитектура (этапы 1-5)
- **АРХИТЕКТУРА_ЭТАПЫ_6-11.md** - Продолжение архитектуры (этапы 6-9)
- **АРХИТЕКТУРА_ФИНАЛ_И_ТЕХСТЕК.md** - Финальные этапы (10-11) + техстек
- **README_АРХИТЕКТУРА.md** - Краткое резюме архитектуры
- **Стратегия_защиты_структура_и_формат_от_10_12_2025.docx** - Методология

### API Документация

Интерактивная документация API (Swagger):

- Локально: http://localhost:8000/api/docs
- Production: https://advocat.starec.ai/api/docs

### Основные эндпоинты

```
Authentication:
POST   /api/v1/auth/register
POST   /api/v1/auth/login
GET    /api/v1/auth/me

Cases:
GET    /api/v1/cases
POST   /api/v1/cases
GET    /api/v1/cases/{id}
PUT    /api/v1/cases/{id}
DELETE /api/v1/cases/{id}

Documents:
GET    /api/v1/documents
GET    /api/v1/documents/{id}
POST   /api/v1/documents/{id}/analyze

Analysis:
POST   /api/v1/analysis/cases/{id}/start
GET    /api/v1/analysis/cases/{id}/status
GET    /api/v1/analysis/cases/{id}/results

Strategy:
GET    /api/v1/strategy/cases/{id}
POST   /api/v1/strategy/cases/{id}/generate
GET    /api/v1/strategy/cases/{id}/export
```

---

## 🔧 Управление сервисами

### Docker Compose команды

```bash
# Запустить все сервисы
docker-compose up -d

# Остановить все сервисы
docker-compose down

# Перезапустить конкретный сервис
docker-compose restart backend

# Просмотр логов
docker-compose logs -f backend
docker-compose logs -f celery-ocr

# Выполнить команду в контейнере
docker-compose exec backend bash
docker-compose exec postgres psql -U starec_user -d starec_advocat

# Пересобрать образы
docker-compose build --no-cache

# Очистить volumes (осторожно! удалит все данные)
docker-compose down -v
```

### Мониторинг

- **Flower (Celery)**: http://localhost:5555 - мониторинг очередей
- **Logs**: `docker-compose logs -f [service_name]`
- **Stats**: `docker stats`

---

## 📊 Статус реализации

### ✅ Реализовано

- [x] Базовая структура проекта
- [x] Backend API (FastAPI) с роутерами
- [x] Модели базы данных (PostgreSQL)
- [x] Docker Compose конфигурация
- [x] Frontend структура (React + Vite)
- [x] Схема базы данных

### 🚧 В разработке (TODO)

- [ ] Аутентификация (JWT)
- [ ] Google Drive интеграция
- [ ] OCR обработка (Celery tasks)
- [ ] AI анализ документов (Claude API)
- [ ] Формирование стратегии защиты
- [ ] Frontend компоненты (UI)
- [ ] WebSocket для реал-тайм обновлений
- [ ] Экспорт в DOCX

### 🎯 Следующие шаги

1. **Выбрать модуль для детальной реализации**
2. **Реализовать выбранный модуль полностью**
3. **Тестирование на реальном деле (216 томов)**
4. **Итерация и улучшение**

---

## 🤝 Команда

**Разработка**: Кристина Бодаговская
**AI Архитектура**: Claude Opus 4.5

---

## 📝 Лицензия

Proprietary - Все права защищены

---

**Создано**: 19 января 2026
**Версия**: 2.0.0
**Статус**: В активной разработке

Для вопросов и поддержки: kristinabodagovskaya@starec.ai
