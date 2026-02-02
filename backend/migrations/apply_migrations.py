#!/usr/bin/env python3
"""
Скрипт для применения SQL миграций к SQLite базе данных.
Запуск: python migrations/apply_migrations.py
"""

import sqlite3
import os
import sys

# Путь к базе данных (относительно backend/)
DB_PATH = os.environ.get("DATABASE_PATH", "local_starec.db")

# Директория с миграциями
MIGRATIONS_DIR = os.path.dirname(os.path.abspath(__file__))


def get_applied_migrations(conn):
    """Получить список уже примененных миграций"""
    cursor = conn.cursor()
    cursor.execute("""
        CREATE TABLE IF NOT EXISTS _migrations (
            id INTEGER PRIMARY KEY,
            name TEXT UNIQUE,
            applied_at TIMESTAMP DEFAULT CURRENT_TIMESTAMP
        )
    """)
    conn.commit()

    cursor.execute("SELECT name FROM _migrations")
    return {row[0] for row in cursor.fetchall()}


def apply_migration(conn, migration_file):
    """Применить одну миграцию"""
    migration_path = os.path.join(MIGRATIONS_DIR, migration_file)

    with open(migration_path, 'r') as f:
        sql = f.read()

    cursor = conn.cursor()

    # Применяем каждую команду отдельно (SQLite не поддерживает несколько команд в execute)
    for statement in sql.split(';'):
        statement = statement.strip()
        if statement and not statement.startswith('--'):
            try:
                cursor.execute(statement)
                print(f"  ✓ {statement[:60]}...")
            except sqlite3.OperationalError as e:
                if "duplicate column name" in str(e).lower():
                    print(f"  ⚠ Колонка уже существует, пропускаем: {statement[:60]}...")
                else:
                    raise

    # Записываем что миграция применена
    cursor.execute("INSERT INTO _migrations (name) VALUES (?)", (migration_file,))
    conn.commit()
    print(f"✅ Миграция {migration_file} применена успешно")


def main():
    # Меняем директорию на backend/
    backend_dir = os.path.dirname(MIGRATIONS_DIR)
    os.chdir(backend_dir)

    db_path = DB_PATH
    if not os.path.exists(db_path):
        print(f"❌ База данных не найдена: {db_path}")
        sys.exit(1)

    print(f"📂 База данных: {db_path}")

    conn = sqlite3.connect(db_path)
    applied = get_applied_migrations(conn)

    # Находим все SQL файлы миграций
    migration_files = sorted([
        f for f in os.listdir(MIGRATIONS_DIR)
        if f.endswith('.sql') and f not in applied
    ])

    if not migration_files:
        print("✅ Все миграции уже применены")
        return

    print(f"📋 Найдено новых миграций: {len(migration_files)}")

    for migration_file in migration_files:
        print(f"\n🔄 Применяю: {migration_file}")
        apply_migration(conn, migration_file)

    conn.close()
    print("\n✅ Все миграции применены!")


if __name__ == "__main__":
    main()
