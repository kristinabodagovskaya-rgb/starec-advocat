"""
OCR сервис для распознавания текста
Использует Tesseract OCR с LSTM движком
"""

import pytesseract
import fitz  # PyMuPDF
import io
import json
from PIL import Image, ImageFilter, ImageOps
from typing import List, Tuple, Optional, Dict, Any
import os

# Настройки Tesseract для лучшего качества
# --oem 1: LSTM только (лучшее качество)
# --psm 3: Полностью автоматическая сегментация страницы
TESSERACT_CONFIG = '--oem 1 --psm 3'

def preprocess_image(image: Image.Image) -> Image.Image:
    """Предобработка изображения для улучшения качества OCR"""
    if image.mode != 'L':
        image = image.convert('L')
    image = ImageOps.autocontrast(image, cutoff=2)
    image = image.filter(ImageFilter.SHARPEN)
    return image


def extract_page_image(pdf_path: str, page_number: int, dpi: int = 200) -> Tuple[Image.Image, Tuple[int, int]]:
    """
    Извлечь страницу PDF как изображение

    Returns:
        (PIL Image, (width, height) оригинала)
    """
    doc = fitz.open(pdf_path)
    page = doc.load_page(page_number - 1)

    # Получаем размер страницы в пунктах
    page_rect = page.rect
    page_width = page_rect.width
    page_height = page_rect.height

    # Конвертируем в изображение
    mat = fitz.Matrix(dpi / 72, dpi / 72)
    pix = page.get_pixmap(matrix=mat)

    img_data = pix.tobytes("png")
    img = Image.open(io.BytesIO(img_data))

    doc.close()
    return img, (page_width, page_height)


def ocr_image_with_boxes(image: Image.Image, lang: str = 'rus+eng') -> Tuple[str, int, List[Dict]]:
    """
    Распознать текст с координатами (bounding boxes)

    Returns:
        (текст, confidence, список слов с координатами)

    Каждое слово: {text, x, y, width, height, conf}
    Координаты в процентах от размера изображения
    """
    processed_image = preprocess_image(image)
    img_width, img_height = processed_image.size

    try:
        data = pytesseract.image_to_data(
            processed_image,
            lang=lang,
            config=TESSERACT_CONFIG,
            output_type=pytesseract.Output.DICT
        )

        words = []
        confidences = []

        for i in range(len(data['text'])):
            text = data['text'][i].strip()
            if text:
                conf = data['conf'][i]
                if conf != -1:
                    confidences.append(conf)

                # Координаты в процентах
                words.append({
                    'text': text,
                    'x': round(data['left'][i] / img_width * 100, 2),
                    'y': round(data['top'][i] / img_height * 100, 2),
                    'width': round(data['width'][i] / img_width * 100, 2),
                    'height': round(data['height'][i] / img_height * 100, 2),
                    'conf': conf if conf != -1 else 0
                })

        # Полный текст с форматированием
        full_text = pytesseract.image_to_string(processed_image, lang=lang, config=TESSERACT_CONFIG)
        avg_confidence = int(sum(confidences) / len(confidences)) if confidences else 0

        return full_text.strip(), avg_confidence, words

    except Exception as e:
        print(f"Ошибка OCR: {e}")
        return "", 0, []


def ocr_image(image: Image.Image, lang: str = 'rus+eng') -> Tuple[str, int]:
    """Распознать текст (без координат)"""
    text, conf, _ = ocr_image_with_boxes(image, lang)
    return text, conf


def ocr_pdf_page(pdf_path: str, page_number: int, dpi: int = 200) -> Tuple[str, int]:
    """Распознать текст на странице PDF"""
    image, _ = extract_page_image(pdf_path, page_number, dpi)
    return ocr_image(image)


def ocr_pdf_page_with_boxes(pdf_path: str, page_number: int, dpi: int = 200) -> Tuple[str, int, List[Dict]]:
    """
    Распознать текст на странице PDF с координатами

    Returns:
        (текст, confidence, список слов с координатами в %)
    """
    image, _ = extract_page_image(pdf_path, page_number, dpi)
    return ocr_image_with_boxes(image)


def get_pdf_page_count(pdf_path: str) -> int:
    """Получить количество страниц в PDF"""
    doc = fitz.open(pdf_path)
    count = len(doc)
    doc.close()
    return count
