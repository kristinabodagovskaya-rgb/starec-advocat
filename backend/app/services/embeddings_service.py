"""
Сервис для создания векторных представлений текста (embeddings)
Используется для семантического поиска по документам
Использует OpenAI API для создания embeddings
"""

import json
import os
from typing import List, Tuple, Optional
from openai import OpenAI

# Настройки
EMBEDDING_MODEL = "text-embedding-3-small"  # OpenAI модель для embeddings
CHUNK_SIZE = 500  # Символов в чанке
CHUNK_OVERLAP = 50  # Перекрытие между чанками

# Клиент OpenAI
_client = None

def _get_client():
    """Получает клиент OpenAI"""
    global _client
    if _client is None:
        api_key = os.getenv("OPENAI_API_KEY")
        if not api_key:
            raise ValueError("OPENAI_API_KEY не установлен")
        _client = OpenAI(api_key=api_key)
    return _client


def split_text_into_chunks(text: str, chunk_size: int = CHUNK_SIZE, overlap: int = CHUNK_OVERLAP) -> List[Tuple[str, int, int]]:
    """
    Разбивает текст на чанки с перекрытием.
    Возвращает список кортежей: (текст_чанка, начало, конец)
    """
    if not text or len(text.strip()) == 0:
        return []

    chunks = []
    start = 0
    text_len = len(text)

    while start < text_len:
        end = min(start + chunk_size, text_len)

        # Если не конец текста, ищем границу слова
        if end < text_len:
            # Ищем пробел или перенос строки для красивого разбиения
            for i in range(end, max(start + chunk_size // 2, start), -1):
                if text[i] in ' \n\t':
                    end = i + 1
                    break

        chunk_text = text[start:end].strip()
        if chunk_text:  # Не добавляем пустые чанки
            chunks.append((chunk_text, start, end))

        # Следующий чанк начинаем с перекрытием
        start = end - overlap if end < text_len else text_len

    return chunks


def create_embedding(text: str, api_key: str = None) -> Optional[List[float]]:
    """
    Создаёт векторное представление текста через OpenAI API.
    Возвращает вектор (список float) или None при ошибке.
    """
    if not text or len(text.strip()) == 0:
        return None

    try:
        client = _get_client()
        response = client.embeddings.create(
            model=EMBEDDING_MODEL,
            input=text[:8000]  # Ограничение на длину текста
        )
        return response.data[0].embedding

    except Exception as e:
        print(f"Ошибка создания embedding: {e}")
        return None


def create_embeddings_batch(texts: List[str], api_key: str = None) -> List[Optional[List[float]]]:
    """
    Создаёт векторы для списка текстов (батч - эффективнее).
    Возвращает список векторов в том же порядке.
    """
    if not texts:
        return []

    # Фильтруем пустые тексты, запоминая индексы
    valid_texts = []
    valid_indices = []
    for i, text in enumerate(texts):
        if text and len(text.strip()) > 0:
            valid_texts.append(text[:8000])  # Ограничение на длину
            valid_indices.append(i)

    if not valid_texts:
        return [None] * len(texts)

    try:
        client = _get_client()
        response = client.embeddings.create(
            model=EMBEDDING_MODEL,
            input=valid_texts
        )

        # Собираем результат
        result = [None] * len(texts)
        for i, emb_data in enumerate(response.data):
            original_index = valid_indices[i]
            result[original_index] = emb_data.embedding

        return result

    except Exception as e:
        print(f"Ошибка batch embedding: {e}")
        return [None] * len(texts)


def embedding_to_json(embedding: List[float]) -> str:
    """Конвертирует вектор в JSON строку для хранения в БД"""
    return json.dumps(embedding)


def json_to_embedding(json_str: str) -> Optional[List[float]]:
    """Восстанавливает вектор из JSON строки"""
    if not json_str:
        return None
    try:
        return json.loads(json_str)
    except:
        return None


def cosine_similarity(vec1: List[float], vec2: List[float]) -> float:
    """
    Вычисляет косинусное сходство между двумя векторами.
    Возвращает значение от -1 до 1 (1 = идентичны).
    """
    if not vec1 or not vec2 or len(vec1) != len(vec2):
        return 0.0

    dot_product = sum(a * b for a, b in zip(vec1, vec2))
    norm1 = sum(a * a for a in vec1) ** 0.5
    norm2 = sum(b * b for b in vec2) ** 0.5

    if norm1 == 0 or norm2 == 0:
        return 0.0

    return dot_product / (norm1 * norm2)


def search_similar_chunks(query_embedding: List[float], chunks_with_embeddings: List[Tuple[int, str, List[float]]], top_k: int = 5) -> List[Tuple[int, str, float]]:
    """
    Ищет наиболее похожие чанки по косинусному сходству.

    Args:
        query_embedding: Вектор запроса
        chunks_with_embeddings: Список (id, текст, вектор)
        top_k: Количество результатов

    Returns:
        Список (id, текст, score) отсортированный по убыванию сходства
    """
    if not query_embedding or not chunks_with_embeddings:
        return []

    results = []
    for chunk_id, text, embedding in chunks_with_embeddings:
        if embedding:
            score = cosine_similarity(query_embedding, embedding)
            results.append((chunk_id, text, score))

    # Сортируем по убыванию сходства
    results.sort(key=lambda x: x[2], reverse=True)

    return results[:top_k]
