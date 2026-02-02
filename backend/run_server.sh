#!/bin/bash
# Запуск сервера с поддержкой больших файлов (до 5 GB)

cd "$(dirname "$0")"
source venv/bin/activate

# Запускаем uvicorn с увеличенными лимитами
uvicorn app.main:app \
    --host 0.0.0.0 \
    --port 8000 \
    --reload \
    --limit-max-request-line 0 \
    --timeout-keep-alive 300 \
    --h11-max-incomplete-event-size 0
