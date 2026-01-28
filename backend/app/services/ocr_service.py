"""
OCR сервис для распознавания текста
Поддерживает: Tesseract (бесплатно) и Claude Vision (платно, лучше качество)
"""

import pytesseract
import fitz  # PyMuPDF
import io
import base64
import numpy as np
from PIL import Image, ImageOps
from typing import List, Tuple, Dict
import os
import anthropic

# ============================================================
# НАСТРОЙКИ
# ============================================================
OCR_DPI = 300
OCR_LANG = 'rus+eng'
TESSERACT_CONFIG = '--oem 1 --psm 6 --dpi 300'

# Claude для OCR (используем низкий DPI для экономии)
CLAUDE_OCR_DPI = 150


def preprocess_image_simple(image: Image.Image) -> Image.Image:
    """Минимальная предобработка для Tesseract"""
    if image.mode != 'L':
        image = image.convert('L')
    image = ImageOps.autocontrast(image, cutoff=0.5)
    return image


def extract_page_image_for_ocr(pdf_path: str, page_number: int, dpi: int = OCR_DPI) -> Image.Image:
    """Извлечь страницу PDF как изображение"""
    doc = fitz.open(pdf_path)
    page = doc.load_page(page_number - 1)
    mat = fitz.Matrix(dpi / 72, dpi / 72)
    pix = page.get_pixmap(matrix=mat)
    img_data = pix.tobytes("png")
    img = Image.open(io.BytesIO(img_data))
    doc.close()
    return img


def image_to_base64(image: Image.Image) -> str:
    """Конвертировать PIL Image в base64"""
    buffer = io.BytesIO()
    # Конвертируем в RGB если нужно
    if image.mode != 'RGB':
        image = image.convert('RGB')
    image.save(buffer, format='JPEG', quality=85)
    return base64.standard_b64encode(buffer.getvalue()).decode('utf-8')


# ============================================================
# TESSERACT OCR (бесплатно)
# ============================================================

def ocr_tesseract(image: Image.Image) -> Tuple[str, int]:
    """OCR с помощью Tesseract"""
    processed_image = preprocess_image_simple(image)

    try:
        # Получаем данные для расчёта уверенности
        data = pytesseract.image_to_data(
            processed_image,
            lang=OCR_LANG,
            config=TESSERACT_CONFIG,
            output_type=pytesseract.Output.DICT
        )

        confidences = [c for c in data['conf'] if c != -1]
        avg_confidence = int(sum(confidences) / len(confidences)) if confidences else 0

        # Получаем текст
        text = pytesseract.image_to_string(processed_image, lang=OCR_LANG, config=TESSERACT_CONFIG)

        return text.strip(), avg_confidence

    except Exception as e:
        print(f"Ошибка Tesseract OCR: {e}")
        return "", 0


def ocr_pdf_page_tesseract(pdf_path: str, page_number: int) -> Tuple[str, int]:
    """OCR страницы PDF с Tesseract"""
    image = extract_page_image_for_ocr(pdf_path, page_number, dpi=OCR_DPI)
    return ocr_tesseract(image)


# ============================================================
# CLAUDE VISION OCR (платно, лучше качество)
# ============================================================

def ocr_claude(image: Image.Image, api_key: str = None) -> Tuple[str, int]:
    """OCR с помощью Claude Vision"""
    try:
        client = anthropic.Anthropic(api_key=api_key)

        # Конвертируем изображение в base64
        img_base64 = image_to_base64(image)

        # Запрос к Claude
        message = client.messages.create(
            model="claude-sonnet-4-20250514",
            max_tokens=4096,
            messages=[
                {
                    "role": "user",
                    "content": [
                        {
                            "type": "image",
                            "source": {
                                "type": "base64",
                                "media_type": "image/jpeg",
                                "data": img_base64
                            }
                        },
                        {
                            "type": "text",
                            "text": """Распознай весь текст на этом изображении документа.

ВАЖНО:
1. Сохрани оригинальное форматирование и структуру
2. Сохрани все переносы строк как в оригинале
3. Для таблиц используй пробелы для выравнивания колонок
4. Не добавляй никаких пояснений — только распознанный текст
5. Если есть номера страниц, даты, подписи — включи их

Выведи ТОЛЬКО распознанный текст:"""
                        }
                    ]
                }
            ]
        )

        text = message.content[0].text
        # Claude обычно даёт очень высокую точность
        confidence = 95

        return text.strip(), confidence

    except Exception as e:
        print(f"Ошибка Claude OCR: {e}")
        return "", 0


def ocr_pdf_page_claude(pdf_path: str, page_number: int, api_key: str = None) -> Tuple[str, int]:
    """OCR страницы PDF с Claude Vision"""
    # Используем низкий DPI для экономии токенов
    image = extract_page_image_for_ocr(pdf_path, page_number, dpi=CLAUDE_OCR_DPI)
    return ocr_claude(image, api_key=api_key)


# ============================================================
# УНИВЕРСАЛЬНЫЕ ФУНКЦИИ
# ============================================================

def ocr_pdf_page(pdf_path: str, page_number: int, engine: str = "tesseract", api_key: str = None) -> Tuple[str, int]:
    """
    OCR страницы PDF
    engine: "tesseract" или "claude"
    api_key: нужен только для Claude
    """
    if engine == "claude":
        return ocr_pdf_page_claude(pdf_path, page_number, api_key=api_key)
    else:
        return ocr_pdf_page_tesseract(pdf_path, page_number)


def get_pdf_page_count(pdf_path: str) -> int:
    """Получить количество страниц в PDF"""
    doc = fitz.open(pdf_path)
    count = len(doc)
    doc.close()
    return count


# ============================================================
# ДЛЯ ВЫДЕЛЕНИЯ ДОКУМЕНТОВ (низкий DPI)
# ============================================================

def extract_page_image(pdf_path: str, page_number: int, dpi: int = 150) -> Tuple[Image.Image, Tuple[int, int]]:
    """Для выделения документов — низкий DPI"""
    doc = fitz.open(pdf_path)
    page = doc.load_page(page_number - 1)

    page_rect = page.rect
    page_width = page_rect.width
    page_height = page_rect.height

    mat = fitz.Matrix(dpi / 72, dpi / 72)
    pix = page.get_pixmap(matrix=mat)

    img_data = pix.tobytes("png")
    img = Image.open(io.BytesIO(img_data))

    doc.close()
    return img, (page_width, page_height)
