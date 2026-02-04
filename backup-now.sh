#!/bin/bash
# =============================================================================
# БЫСТРЫЙ БЭКАП перед распознаванием
# Запускай ПЕРЕД каждым OCR!
# =============================================================================

set -e

PROJECT_DIR="/root/starec-advocat"
BACKUP_DIR="/root/backups/starec/manual"
DATE=$(date +%Y-%m-%d_%H-%M-%S)

mkdir -p "$BACKUP_DIR"

echo ""
echo "=========================================="
echo "  БЭКАП ПЕРЕД РАСПОЗНАВАНИЕМ"
echo "  $DATE"
echo "=========================================="
echo ""

# PostgreSQL
echo "[1/3] PostgreSQL..."
docker exec starec-postgres pg_dump -U starec_user starec_advocat > "$BACKUP_DIR/pre_ocr_$DATE.sql"
echo "      OK: pre_ocr_$DATE.sql"

# MongoDB
echo "[2/3] MongoDB..."
docker exec starec-mongo mongodump --db starec_advocat --archive="/tmp/pre_ocr.gz" --gzip --quiet
docker cp starec-mongo:/tmp/pre_ocr.gz "$BACKUP_DIR/pre_ocr_mongo_$DATE.gz"
docker exec starec-mongo rm /tmp/pre_ocr.gz
echo "      OK: pre_ocr_mongo_$DATE.gz"

# Uploads
echo "[3/3] Uploads..."
UPLOADS_COUNT=$(find "$PROJECT_DIR/uploads" -name "*.pdf" 2>/dev/null | wc -l)
rsync -a "$PROJECT_DIR/uploads/" "$BACKUP_DIR/uploads_$DATE/" 2>/dev/null || echo "      (папка пустая)"
echo "      OK: uploads_$DATE/ ($UPLOADS_COUNT PDF файлов)"

echo ""
echo "=========================================="
echo "  БЭКАП ЗАВЕРШЁН!"
echo "  Директория: $BACKUP_DIR"
echo "=========================================="
echo ""
echo "Теперь можно запускать распознавание."
echo ""
