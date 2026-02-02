-- Миграция: Добавление отслеживания токенов для OCR
-- Дата: 2026-02-02
-- Описание: Добавляет поля для хранения количества токенов и стоимости OCR через Claude Vision API

-- Добавляем поля токенов в таблицу ocr_runs
ALTER TABLE ocr_runs ADD COLUMN total_input_tokens INTEGER DEFAULT 0;
ALTER TABLE ocr_runs ADD COLUMN total_output_tokens INTEGER DEFAULT 0;
ALTER TABLE ocr_runs ADD COLUMN estimated_cost_usd REAL DEFAULT 0.0;

-- Добавляем поля токенов в таблицу page_texts
ALTER TABLE page_texts ADD COLUMN input_tokens INTEGER;
ALTER TABLE page_texts ADD COLUMN output_tokens INTEGER;
