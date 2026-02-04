#!/bin/bash
# =============================================================================
# Автоматический бэкап Starec-Advocat (сервер Hetzner)
# Запуск: каждый час через crontab
# =============================================================================

set -e

# Конфигурация
PROJECT_DIR="/root/starec-advocat"
BACKUP_DIR="/root/backups/starec"
DATE=$(date +%Y-%m-%d_%H-%M-%S)
BACKUP_PATH="$BACKUP_DIR/$DATE"

# Создаём директорию для бэкапа
mkdir -p "$BACKUP_PATH"

echo "[$DATE] Starting backup..."

# -----------------------------------------------------------------------------
# 1. PostgreSQL
# -----------------------------------------------------------------------------
echo "Backing up PostgreSQL..."
docker exec starec-postgres pg_dump -U starec_user starec_advocat > "$BACKUP_PATH/postgres.sql"
echo "PostgreSQL backup: OK"

# -----------------------------------------------------------------------------
# 2. MongoDB
# -----------------------------------------------------------------------------
echo "Backing up MongoDB..."
docker exec starec-mongo mongodump --db starec_advocat --out /tmp/mongo_backup --quiet
docker cp starec-mongo:/tmp/mongo_backup "$BACKUP_PATH/mongo"
docker exec starec-mongo rm -rf /tmp/mongo_backup
echo "MongoDB backup: OK"

# -----------------------------------------------------------------------------
# 3. Uploads (PDF файлы)
# -----------------------------------------------------------------------------
echo "Backing up uploads..."
rsync -a "$PROJECT_DIR/uploads/" "$BACKUP_PATH/uploads/" 2>/dev/null || mkdir -p "$BACKUP_PATH/uploads"
echo "Uploads backup: OK"

# -----------------------------------------------------------------------------
# 4. Сжатие
# -----------------------------------------------------------------------------
echo "Compressing..."
cd "$BACKUP_DIR"
tar -czf "backup_$DATE.tar.gz" "$DATE"
rm -rf "$DATE"
echo "Compressed: backup_$DATE.tar.gz"

# -----------------------------------------------------------------------------
# 5. Ротация (храним последние 168 бэкапов = 7 дней при ежечасном)
# -----------------------------------------------------------------------------
echo "Rotating old backups..."
ls -t backup_*.tar.gz 2>/dev/null | tail -n +169 | xargs -r rm
BACKUP_COUNT=$(ls -1 backup_*.tar.gz 2>/dev/null | wc -l)
echo "Total backups: $BACKUP_COUNT"

# -----------------------------------------------------------------------------
# 6. Размер
# -----------------------------------------------------------------------------
BACKUP_SIZE=$(du -h "backup_$DATE.tar.gz" | cut -f1)
TOTAL_SIZE=$(du -sh "$BACKUP_DIR" | cut -f1)

echo "============================================="
echo "[$DATE] Backup completed!"
echo "File: backup_$DATE.tar.gz ($BACKUP_SIZE)"
echo "Total backup storage: $TOTAL_SIZE"
echo "============================================="
