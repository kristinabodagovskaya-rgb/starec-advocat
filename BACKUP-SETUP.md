# Настройка бэкапов на сервере Hetzner

## Быстрый старт

### 1. Скопировать скрипты на сервер

```bash
scp -P 4022 backup-server.sh backup-now.sh root@<IP>:/root/starec-advocat/
```

### 2. Подключиться к серверу

```bash
ssh -p 4022 root@<IP>
```

### 3. Сделать скрипты исполняемыми

```bash
chmod +x /root/starec-advocat/backup-server.sh
chmod +x /root/starec-advocat/backup-now.sh
```

### 4. Создать папку для бэкапов

```bash
mkdir -p /root/backups/starec/manual
```

### 5. Настроить автоматические бэкапы (crontab)

```bash
crontab -e
```

Добавить строку (бэкап каждый час):

```
0 * * * * /root/starec-advocat/backup-server.sh >> /root/backups/starec/backup.log 2>&1
```

Сохранить и выйти (`:wq` в vim).

### 6. Проверить что crontab настроен

```bash
crontab -l
```

---

## Использование

### Перед распознаванием — ОБЯЗАТЕЛЬНО:

```bash
cd /root/starec-advocat
./backup-now.sh
```

### Проверить последние бэкапы:

```bash
ls -lh /root/backups/starec/
```

### Посмотреть лог:

```bash
tail -50 /root/backups/starec/backup.log
```

---

## Восстановление из бэкапа

### PostgreSQL

```bash
# Распаковать архив
cd /root/backups/starec
tar -xzf backup_2026-02-04_12-00-00.tar.gz

# Восстановить
docker exec -i starec-postgres psql -U starec_user starec_advocat < 2026-02-04_12-00-00/postgres.sql
```

### MongoDB

```bash
# Восстановить
docker exec starec-mongo mongorestore --db starec_advocat --drop /tmp/mongo_backup/starec_advocat

# Или из gzip (ручной бэкап)
docker cp /root/backups/starec/manual/pre_ocr_mongo_2026-02-04.gz starec-mongo:/tmp/
docker exec starec-mongo mongorestore --db starec_advocat --archive=/tmp/pre_ocr_mongo_2026-02-04.gz --gzip --drop
```

### Uploads

```bash
rsync -av /root/backups/starec/manual/uploads_2026-02-04/ /root/starec-advocat/uploads/
```

---

## Мониторинг

Проверить размер бэкапов:

```bash
du -sh /root/backups/starec/
```

Проверить свободное место:

```bash
df -h /root
```

---

## Важно!

1. **ПЕРЕД КАЖДЫМ РАСПОЗНАВАНИЕМ** запускай `./backup-now.sh`
2. Автоматический бэкап делается каждый час
3. Хранятся последние 7 дней (168 бэкапов)
4. Ручные бэкапы (`/manual/`) не удаляются автоматически — чисти сама
