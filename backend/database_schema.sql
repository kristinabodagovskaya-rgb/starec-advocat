-- Starec-Advocat 2.0 Database Schema
-- PostgreSQL 16+

-- База данных создаётся автоматически через POSTGRES_DB в docker-compose.yml
-- Мы уже подключены к ней через docker-entrypoint

-- Пользователи
CREATE TABLE users (
    id SERIAL PRIMARY KEY,
    email VARCHAR(255) UNIQUE NOT NULL,
    hashed_password VARCHAR(255) NOT NULL,
    full_name VARCHAR(255),
    is_active BOOLEAN DEFAULT TRUE,
    is_superuser BOOLEAN DEFAULT FALSE,
    created_at TIMESTAMP DEFAULT NOW(),
    updated_at TIMESTAMP DEFAULT NOW()
);

CREATE INDEX idx_users_email ON users(email);

-- Дела
CREATE TABLE cases (
    id SERIAL PRIMARY KEY,
    user_id INTEGER REFERENCES users(id) ON DELETE CASCADE,
    case_number VARCHAR(100) NOT NULL,
    title VARCHAR(500) NOT NULL,
    article VARCHAR(100),
    defendant_name VARCHAR(255),
    investigative_body VARCHAR(255),
    initiation_date DATE,
    status VARCHAR(50) DEFAULT 'active',
    notes TEXT,
    created_at TIMESTAMP DEFAULT NOW(),
    updated_at TIMESTAMP DEFAULT NOW()
);

CREATE INDEX idx_cases_user_id ON cases(user_id);
CREATE INDEX idx_cases_case_number ON cases(case_number);
CREATE INDEX idx_cases_status ON cases(status);

-- Тома
CREATE TABLE volumes (
    id SERIAL PRIMARY KEY,
    case_id INTEGER REFERENCES cases(id) ON DELETE CASCADE,
    volume_number INTEGER NOT NULL,
    gdrive_file_id VARCHAR(255),
    file_name VARCHAR(500),
    file_size BIGINT,
    page_count INTEGER,
    ocr_quality INTEGER,
    processing_status VARCHAR(50) DEFAULT 'pending',
    created_at TIMESTAMP DEFAULT NOW(),
    processed_at TIMESTAMP,
    UNIQUE(case_id, volume_number)
);

CREATE INDEX idx_volumes_case_id ON volumes(case_id);
CREATE INDEX idx_volumes_processing_status ON volumes(processing_status);

-- Документы
CREATE TABLE documents (
    id SERIAL PRIMARY KEY,
    case_id INTEGER REFERENCES cases(id) ON DELETE CASCADE,
    volume_id INTEGER REFERENCES volumes(id) ON DELETE CASCADE,
    doc_type VARCHAR(100),
    title VARCHAR(1000) NOT NULL,
    start_page INTEGER,
    end_page INTEGER,
    document_date DATE,
    author VARCHAR(255),
    importance_score INTEGER DEFAULT 1,
    analysis_status VARCHAR(50) DEFAULT 'not_analyzed',
    full_text TEXT,
    created_at TIMESTAMP DEFAULT NOW(),
    analyzed_at TIMESTAMP
);

CREATE INDEX idx_documents_case_id ON documents(case_id);
CREATE INDEX idx_documents_volume_id ON documents(volume_id);
CREATE INDEX idx_documents_doc_type ON documents(doc_type);
CREATE INDEX idx_documents_analysis_status ON documents(analysis_status);
CREATE INDEX idx_documents_document_date ON documents(document_date);

-- Полнотекстовый поиск по документам
CREATE INDEX idx_documents_full_text ON documents USING gin(to_tsvector('russian', full_text));

-- Сущности (участники, даты, суммы)
CREATE TABLE entities (
    id SERIAL PRIMARY KEY,
    document_id INTEGER REFERENCES documents(id) ON DELETE CASCADE,
    entity_type VARCHAR(50) NOT NULL,
    entity_value TEXT NOT NULL,
    context TEXT,
    confidence INTEGER DEFAULT 100,
    created_at TIMESTAMP DEFAULT NOW()
);

CREATE INDEX idx_entities_document_id ON entities(document_id);
CREATE INDEX idx_entities_entity_type ON entities(entity_type);

-- Анализ документов
CREATE TABLE document_analyses (
    id SERIAL PRIMARY KEY,
    document_id INTEGER REFERENCES documents(id) ON DELETE CASCADE,
    analysis_type VARCHAR(50) NOT NULL,
    findings JSONB,
    violations JSONB,
    recommendations JSONB,
    ai_model VARCHAR(50),
    tokens_used INTEGER,
    processing_time INTEGER,
    created_at TIMESTAMP DEFAULT NOW()
);

CREATE INDEX idx_document_analyses_document_id ON document_analyses(document_id);
CREATE INDEX idx_document_analyses_analysis_type ON document_analyses(analysis_type);

-- Анализ дел
CREATE TABLE case_analyses (
    id SERIAL PRIMARY KEY,
    case_id INTEGER REFERENCES cases(id) ON DELETE CASCADE,
    analysis_status VARCHAR(50) DEFAULT 'pending',
    progress INTEGER DEFAULT 0,
    findings JSONB,
    violations JSONB,
    contradictions JSONB,
    defense_lines JSONB,
    judicial_practice JSONB,
    total_documents_analyzed INTEGER DEFAULT 0,
    total_violations_found INTEGER DEFAULT 0,
    total_contradictions_found INTEGER DEFAULT 0,
    ai_model VARCHAR(50),
    total_tokens_used INTEGER,
    total_processing_time INTEGER,
    created_at TIMESTAMP DEFAULT NOW(),
    completed_at TIMESTAMP
);

CREATE INDEX idx_case_analyses_case_id ON case_analyses(case_id);
CREATE INDEX idx_case_analyses_status ON case_analyses(analysis_status);

-- Стратегии защиты
CREATE TABLE defense_strategies (
    id SERIAL PRIMARY KEY,
    case_id INTEGER REFERENCES cases(id) ON DELETE CASCADE,
    version INTEGER DEFAULT 1,
    content JSONB,
    summary TEXT,
    procedural_violations JSONB,
    evidence_analysis JSONB,
    defense_lines JSONB,
    tactical_plan JSONB,
    ai_model VARCHAR(50),
    generated_at TIMESTAMP DEFAULT NOW()
);

CREATE INDEX idx_defense_strategies_case_id ON defense_strategies(case_id);

-- Триггер для обновления updated_at
CREATE OR REPLACE FUNCTION update_updated_at_column()
RETURNS TRIGGER AS $$
BEGIN
    NEW.updated_at = NOW();
    RETURN NEW;
END;
$$ language 'plpgsql';

CREATE TRIGGER update_users_updated_at BEFORE UPDATE ON users
    FOR EACH ROW EXECUTE FUNCTION update_updated_at_column();

CREATE TRIGGER update_cases_updated_at BEFORE UPDATE ON cases
    FOR EACH ROW EXECUTE FUNCTION update_updated_at_column();

-- Комментарии к таблицам
COMMENT ON TABLE users IS 'Пользователи системы (адвокаты, юристы)';
COMMENT ON TABLE cases IS 'Уголовные дела';
COMMENT ON TABLE volumes IS 'Тома дела';
COMMENT ON TABLE documents IS 'Документы из томов';
COMMENT ON TABLE entities IS 'Извлеченные сущности (участники, даты, суммы)';
COMMENT ON TABLE document_analyses IS 'AI-анализ отдельных документов';
COMMENT ON TABLE case_analyses IS 'Комплексный анализ всего дела';
COMMENT ON TABLE defense_strategies IS 'Стратегии защиты';

-- Создание тестового пользователя (пароль: password123)
INSERT INTO users (email, hashed_password, full_name, is_superuser)
VALUES (
    'admin@starec.ai',
    '$2b$12$LQv3c1yqBWVHxkd0LHAkCOYz6TtxMQJqhN8/LewY5QK.kMND1uNOi',
    'Администратор',
    TRUE
);

COMMIT;
