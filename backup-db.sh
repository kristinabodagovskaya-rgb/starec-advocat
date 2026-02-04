#!/bin/bash
# Автоматический бэкап базы данных Starec-Advocat (локальный)

BACKUP_DIR="/Users/kristinabodagovskaa/Desktop/Starec-Advocat (Кристина)/backups"
DB_PATH="/Users/kristinabodagovskaa/Desktop/Starec-Advocat (Кристина)/backend/local_starec.db"
DATE=$(date +%Y-%m-%d_%H-%M-%S)

# Создаём бэкап с датой
cp "$DB_PATH" "$BACKUP_DIR/local_starec_$DATE.db"

# Храним последние 50 бэкапов
cd "$BACKUP_DIR"
ls -t local_starec_*.db 2>/dev/null | tail -n +51 | xargs -r rm

echo "[$DATE] Backup created: local_starec_$DATE.db"
