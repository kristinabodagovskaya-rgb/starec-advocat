#!/bin/bash

# Скрипт для запуска проекта локально

echo "🚀 Запуск Starec-Advocat локально..."

# Директория проекта
PROJECT_DIR="/Users/kristinabodagovskaa/Desktop/Starec-Advocat 2.0"

# Создаем директорию для загрузок
mkdir -p "$PROJECT_DIR/uploads"

# Запуск backend
echo "📦 Запуск backend..."
cd "$PROJECT_DIR/backend"
source venv/bin/activate

# Инициализация БД
python -c "
from app.models.database import Base, engine
Base.metadata.create_all(bind=engine)
print('✅ База данных инициализирована')
"

# Запуск uvicorn в фоне
uvicorn app.main:app --host 0.0.0.0 --port 8000 --reload &
BACKEND_PID=$!
echo "✅ Backend запущен (PID: $BACKEND_PID)"

# Немного подождать
sleep 2

# Запуск frontend
echo "🎨 Запуск frontend..."
cd "$PROJECT_DIR/frontend"
npm run dev &
FRONTEND_PID=$!
echo "✅ Frontend запущен (PID: $FRONTEND_PID)"

echo ""
echo "=========================================="
echo "🎉 Проект запущен!"
echo ""
echo "Frontend: http://localhost:5173"
echo "Backend:  http://localhost:8000"
echo "API Docs: http://localhost:8000/api/docs"
echo ""
echo "Для остановки нажмите Ctrl+C"
echo "=========================================="

# Ожидание Ctrl+C
trap "kill $BACKEND_PID $FRONTEND_PID 2>/dev/null; exit" INT
wait
