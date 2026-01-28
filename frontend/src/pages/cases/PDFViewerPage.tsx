import { useState, useEffect } from 'react'
import { useParams, useNavigate } from 'react-router-dom'

interface ExtractedDocument {
  id: number
  title: string
  doc_type: string
  page_start: number
  page_end: number
  date?: string
}

export default function PDFViewerPage() {
  const { id, volumeId } = useParams()
  const navigate = useNavigate()

  const [isExtracting, setIsExtracting] = useState(false)
  const [extractionProgress, setExtractionProgress] = useState(0)
  const [extractedDocs, setExtractedDocs] = useState<ExtractedDocument[]>([])
  const [showSidebar, setShowSidebar] = useState(false)
  const [currentPage, setCurrentPage] = useState(1)
  const [error, setError] = useState<string | null>(null)
  const [_isLoading, setIsLoading] = useState(true)

  // OCR состояния
  const [isOcrRunning, setIsOcrRunning] = useState(false)
  const [ocrProgress, setOcrProgress] = useState(0)
  const [ocrStatus, setOcrStatus] = useState<string | null>(null)
  const [ocrEngine, setOcrEngine] = useState<'tesseract' | 'claude'>('tesseract')
  const [allPagesText, setAllPagesText] = useState<{page_number: number, text: string, confidence: number, word_boxes?: {text: string, x: number, y: number, width: number, height: number, conf: number}[]}[]>([])
  const [showOcrText, setShowOcrText] = useState(false)
  const [isLoadingText, setIsLoadingText] = useState(false)
  const [ocrZoom, setOcrZoom] = useState(100)
  const [ocrCurrentPage, setOcrCurrentPage] = useState(1)

  const pdfUrl = `/api/cases/${id}/volumes/${volumeId}/file`

  // Загружаем сохранённые документы при открытии
  useEffect(() => {
    const loadSavedDocuments = async () => {
      try {
        const response = await fetch(`/api/cases/${id}/volumes/${volumeId}/documents`)
        if (response.ok) {
          const data = await response.json()
          if (data.documents && data.documents.length > 0) {
            setExtractedDocs(data.documents)
            setShowSidebar(true)
            console.log('Loaded saved documents:', data.documents.length)
          }
        }
      } catch (err) {
        console.error('Error loading saved documents:', err)
      } finally {
        setIsLoading(false)
      }
    }
    loadSavedDocuments()
  }, [id, volumeId])

  const handleExtractDocuments = async () => {
    console.log('Starting extraction for case', id, 'volume', volumeId)
    setIsExtracting(true)
    setExtractionProgress(0)
    setError(null)

    try {
      const url = `/api/cases/${id}/volumes/${volumeId}/extract-documents-stream`
      console.log('Calling SSE API:', url)

      const eventSource = new EventSource(url)

      eventSource.onmessage = (event) => {
        const data = JSON.parse(event.data)
        console.log('SSE event:', data)

        if (data.type === 'progress') {
          setExtractionProgress(data.progress)
        } else if (data.type === 'complete') {
          setExtractedDocs(data.documents || [])
          setShowSidebar(true)
          setIsExtracting(false)
          eventSource.close()
          if (data.documents?.length === 0) {
            setError('Документы не найдены. Попробуйте открыть ОПИСЬ вручную.')
          }
        } else if (data.type === 'error') {
          setError(data.message || 'Ошибка при извлечении документов')
          setIsExtracting(false)
          eventSource.close()
        }
      }

      eventSource.onerror = (err) => {
        console.error('SSE error:', err)
        setError('Ошибка подключения к серверу')
        setIsExtracting(false)
        eventSource.close()
      }

    } catch (err) {
      console.error('Extract error:', err)
      setError('Ошибка подключения к серверу: ' + String(err))
      setIsExtracting(false)
    }
  }

  // Загрузка ВСЕХ страниц текста
  const loadAllPagesText = async () => {
    setIsLoadingText(true)
    try {
      const response = await fetch(`/api/cases/${id}/volumes/${volumeId}/all-pages-text`)
      if (response.ok) {
        const data = await response.json()
        setAllPagesText(data.pages || [])
      }
    } catch (err) {
      console.error('Error loading pages text:', err)
    } finally {
      setIsLoadingText(false)
    }
  }

  // Скролл к выбранной OCR странице
  useEffect(() => {
    if (ocrCurrentPage && allPagesText.length > 0) {
      const el = document.getElementById(`ocr-page-${ocrCurrentPage}`)
      if (el) {
        el.scrollIntoView({ behavior: 'smooth', block: 'start' })
      }
    }
  }, [ocrCurrentPage, allPagesText.length])

  // OCR распознавание текста
  const handleOcr = async (engine: 'tesseract' | 'claude' = 'tesseract') => {
    setIsOcrRunning(true)
    setOcrProgress(0)
    setOcrEngine(engine)
    setOcrStatus(`Запуск OCR (${engine === 'claude' ? 'Claude' : 'Tesseract'})...`)
    setError(null)

    try {
      const url = `/api/cases/${id}/volumes/${volumeId}/ocr-stream?engine=${engine}`
      const eventSource = new EventSource(url)

      eventSource.onmessage = (event) => {
        const data = JSON.parse(event.data)

        if (data.type === 'start') {
          const engineLabel = data.engine === 'claude' ? 'Claude' : 'Tesseract'
          setOcrStatus(`${engineLabel}: ${data.total_pages} страниц`)
        } else if (data.type === 'progress') {
          setOcrProgress(data.progress)
          const engineLabel = data.engine === 'claude' ? 'Claude' : 'Tesseract'
          setOcrStatus(`${engineLabel}: ${data.page}/${data.total} (${data.confidence}%)`)
        } else if (data.type === 'complete') {
          const engineLabel = data.engine === 'claude' ? 'Claude' : 'Tesseract'
          setOcrStatus(`${engineLabel}: готово! ${data.total_pages} страниц`)
          setIsOcrRunning(false)
          eventSource.close()
        } else if (data.type === 'error') {
          setError(data.message || 'Ошибка OCR')
          setIsOcrRunning(false)
          eventSource.close()
        }
      }

      eventSource.onerror = () => {
        setError('Ошибка подключения к серверу')
        setIsOcrRunning(false)
        eventSource.close()
      }
    } catch (err) {
      setError('Ошибка OCR: ' + String(err))
      setIsOcrRunning(false)
    }
  }

  const goToPage = (page: number) => {
    setCurrentPage(page)
    const iframe = document.getElementById('pdf-viewer') as HTMLIFrameElement
    if (iframe) {
      const timestamp = Date.now()
      // Chrome/Safari PDF viewer использует 1-based нумерацию
      iframe.src = `${pdfUrl}?t=${timestamp}#page=${page}`
    }
  }

  return (
    <div className="h-screen flex flex-col overflow-hidden">
      {/* Header */}
      <header className="apple-header sticky top-0 z-10">
        <div className="max-w-7xl mx-auto px-4 sm:px-6 lg:px-8 py-4">
          <div className="flex items-center justify-between">
            <button
              onClick={() => navigate(`/cases/${id}/volumes`)}
              className="flex items-center text-[#6e6e73] hover:text-[#1d1d1f] transition-colors group"
            >
              <svg className="w-5 h-5 mr-2 transition-transform group-hover:-translate-x-1" fill="none" stroke="currentColor" viewBox="0 0 24 24">
                <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M15 19l-7-7 7-7" />
              </svg>
              Назад к документам
            </button>

            <div className="flex items-center space-x-3">
              {/* OCR Buttons */}
              {isOcrRunning && (
                <button
                  disabled={true}
                  className="apple-btn-secondary flex items-center"
                >
                  <svg className="animate-spin -ml-1 mr-2 h-4 w-4" fill="none" viewBox="0 0 24 24">
                    <circle className="opacity-25" cx="12" cy="12" r="10" stroke="currentColor" strokeWidth="4"></circle>
                    <path className="opacity-75" fill="currentColor" d="M4 12a8 8 0 018-8V0C5.373 0 0 5.373 0 12h4zm2 5.291A7.962 7.962 0 014 12H0c0 3.042 1.135 5.824 3 7.938l3-2.647z"></path>
                  </svg>
                  {ocrEngine === 'claude' ? 'Claude' : 'Tesseract'} {ocrProgress}%
                </button>
              )}

              {/* OCR Status */}
              {ocrStatus && !isOcrRunning && (
                <span className="text-sm text-gray-400 ml-2">{ocrStatus}</span>
              )}

              {!isOcrRunning && (
                <>
                  <button
                    onClick={() => handleOcr('tesseract')}
                    className="apple-btn-secondary flex items-center"
                    title="Бесплатно, но качество ниже"
                  >
                    <svg className="w-4 h-4 mr-2" fill="none" stroke="currentColor" viewBox="0 0 24 24">
                      <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M15.232 5.232l3.536 3.536m-2.036-5.036a2.5 2.5 0 113.536 3.536L6.5 21.036H3v-3.572L16.732 3.732z" />
                    </svg>
                    OCR Tesseract
                  </button>
                  <button
                    onClick={() => handleOcr('claude')}
                    className="apple-btn-primary flex items-center"
                    title="Платно (~$0.50/10 стр), но лучше качество"
                  >
                    <svg className="w-4 h-4 mr-2" fill="none" stroke="currentColor" viewBox="0 0 24 24">
                      <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M9.663 17h4.673M12 3v1m6.364 1.636l-.707.707M21 12h-1M4 12H3m3.343-5.657l-.707-.707m2.828 9.9a5 5 0 117.072 0l-.548.547A3.374 3.374 0 0014 18.469V19a2 2 0 11-4 0v-.531c0-.895-.356-1.754-.988-2.386l-.548-.547z" />
                    </svg>
                    OCR Claude
                  </button>
                </>
              )}

              {/* Extract Documents Button */}
              <button
                onClick={handleExtractDocuments}
                disabled={isExtracting}
                className={`flex items-center ${extractedDocs.length > 0 ? 'apple-btn-secondary' : 'apple-btn-primary'}`}
              >
                {isExtracting ? (
                  <>
                    <svg className="animate-spin -ml-1 mr-2 h-4 w-4" fill="none" viewBox="0 0 24 24">
                      <circle className="opacity-25" cx="12" cy="12" r="10" stroke="currentColor" strokeWidth="4"></circle>
                      <path className="opacity-75" fill="currentColor" d="M4 12a8 8 0 018-8V0C5.373 0 0 5.373 0 12h4zm2 5.291A7.962 7.962 0 014 12H0c0 3.042 1.135 5.824 3 7.938l3-2.647z"></path>
                    </svg>
                    Анализ... {extractionProgress > 0 && `${extractionProgress}%`}
                  </>
                ) : (
                  <>
                    <svg className="w-4 h-4 mr-2" fill="none" stroke="currentColor" viewBox="0 0 24 24">
                      <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M9 12h6m-6 4h6m2 5H7a2 2 0 01-2-2V5a2 2 0 012-2h5.586a1 1 0 01.707.293l5.414 5.414a1 1 0 01.293.707V19a2 2 0 01-2 2z" />
                    </svg>
                    {extractedDocs.length > 0 ? 'Выделить заново' : 'Выделить документы'}
                  </>
                )}
              </button>

              {/* Toggle OCR Text Button */}
              <button
                onClick={() => {
                  setShowOcrText(!showOcrText)
                  if (!showOcrText && allPagesText.length === 0) {
                    loadAllPagesText()
                  }
                }}
                className="apple-btn-secondary flex items-center"
              >
                <svg className="w-4 h-4 mr-2" fill="none" stroke="currentColor" viewBox="0 0 24 24">
                  <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M9 12h6m-6 4h6m2 5H7a2 2 0 01-2-2V5a2 2 0 012-2h5.586a1 1 0 01.707.293l5.414 5.414a1 1 0 01.293.707V19a2 2 0 01-2 2z" />
                </svg>
                {showOcrText ? 'Скрыть текст' : 'Показать текст'}
              </button>

              {/* Toggle Sidebar Button (if docs extracted) */}
              {extractedDocs.length > 0 && (
                <button
                  onClick={() => setShowSidebar(!showSidebar)}
                  className="apple-btn-secondary flex items-center"
                >
                  <svg className="w-4 h-4 mr-2" fill="none" stroke="currentColor" viewBox="0 0 24 24">
                    <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M4 6h16M4 12h16M4 18h7" />
                  </svg>
                  {showSidebar ? 'Скрыть' : 'Показать'} ({extractedDocs.length})
                </button>
              )}

            </div>
          </div>
        </div>
      </header>

      {/* Error Message */}
      {error && (
        <div className="bg-red-50 border-l-4 border-red-500 p-4 mx-4 mt-4">
          <div className="flex">
            <div className="flex-shrink-0">
              <svg className="h-5 w-5 text-red-400" fill="currentColor" viewBox="0 0 20 20">
                <path fillRule="evenodd" d="M10 18a8 8 0 100-16 8 8 0 000 16zM8.707 7.293a1 1 0 00-1.414 1.414L8.586 10l-1.293 1.293a1 1 0 101.414 1.414L10 11.414l1.293 1.293a1 1 0 001.414-1.414L11.414 10l1.293-1.293a1 1 0 00-1.414-1.414L10 8.586 8.707 7.293z" clipRule="evenodd"/>
              </svg>
            </div>
            <div className="ml-3">
              <p className="text-sm text-red-700">{error}</p>
            </div>
            <button onClick={() => setError(null)} className="ml-auto text-red-500 hover:text-red-700">
              <svg className="w-4 h-4" fill="none" stroke="currentColor" viewBox="0 0 24 24">
                <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M6 18L18 6M6 6l12 12" />
              </svg>
            </button>
          </div>
        </div>
      )}

      {/* Прогресс-бар при выделении */}
      {isExtracting && (
        <div className="bg-blue-50 border-b border-blue-200 px-4 py-3">
          <div className="flex items-center justify-between mb-2">
            <span className="text-sm font-medium text-blue-700">
              Анализ документов: {extractionProgress}%
            </span>
            <span className="text-xs text-blue-500">
              Пожалуйста, подождите...
            </span>
          </div>
          <div className="w-full bg-blue-200 rounded-full h-3">
            <div
              className="bg-blue-600 h-3 rounded-full transition-all duration-300"
              style={{ width: `${extractionProgress}%` }}
            />
          </div>
        </div>
      )}

      {/* Main Content - независимый скроллинг колонок */}
      <div className="flex-1 flex overflow-hidden min-h-0">
        {/* PDF Viewer - 50% когда текст показан */}
        <div className={`${showOcrText ? 'w-1/2' : 'flex-1'} overflow-hidden`} style={{ backgroundColor: '#52555a' }}>
          <iframe
            id="pdf-viewer"
            src={pdfUrl}
            className="w-full h-full"
            title="PDF Viewer"
          />
        </div>

        {/* OCR Text Column - точно как PDF */}
        {showOcrText && (
          <div className="w-1/2 h-full flex flex-col" style={{ backgroundColor: '#52555a' }}>
            {/* Тулбар */}
            <div style={{ height: '56px', minHeight: '56px' }} className="bg-[#38383b] flex items-center px-4 flex-shrink-0">
              {/* Страницы - как у PDF */}
              <div className="flex items-center mr-4">
                <input
                  type="text"
                  value={ocrCurrentPage}
                  onChange={(e) => {
                    const val = parseInt(e.target.value)
                    if (!isNaN(val) && val >= 1 && val <= allPagesText.length) {
                      setOcrCurrentPage(val)
                    }
                  }}
                  onKeyDown={(e) => {
                    if (e.key === 'Enter') {
                      const val = parseInt((e.target as HTMLInputElement).value)
                      if (!isNaN(val) && val >= 1 && val <= allPagesText.length) {
                        setOcrCurrentPage(val)
                      }
                    }
                  }}
                  className="w-8 text-center text-xs bg-[#2d2d30] text-white border-none rounded px-1 py-0.5"
                  style={{ outline: 'none' }}
                />
                <span className="text-[#b4b4b4] text-xs ml-1">/ {allPagesText.length || '—'}</span>
              </div>

              {/* Разделитель */}
              <div className="w-px h-4 bg-[#5a5a5e] mr-2"></div>

              {/* Зум - / + */}
              <div className="flex items-center space-x-1 mr-4">
                <button onClick={() => setOcrZoom(z => Math.max(50, z - 10))} className="p-1 hover:bg-[#4a4a4e] rounded">
                  <svg className="w-4 h-4 text-[#b4b4b4]" fill="none" stroke="currentColor" viewBox="0 0 24 24">
                    <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M20 12H4" />
                  </svg>
                </button>
                <button onClick={() => setOcrZoom(z => Math.min(200, z + 10))} className="p-1 hover:bg-[#4a4a4e] rounded">
                  <svg className="w-4 h-4 text-[#b4b4b4]" fill="none" stroke="currentColor" viewBox="0 0 24 24">
                    <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M12 4v16m8-8H4" />
                  </svg>
                </button>
              </div>

              {/* Spacer */}
              <div className="flex-1"></div>

              {/* Скачать и печать справа */}
              <div className="flex items-center space-x-1">
                <button
                  onClick={() => {
                    const text = allPagesText.map(p => `--- Страница ${p.page_number} ---\n${p.text}`).join('\n\n')
                    const blob = new Blob([text], { type: 'text/plain;charset=utf-8' })
                    const url = URL.createObjectURL(blob)
                    const a = document.createElement('a')
                    a.href = url
                    a.download = 'ocr-text.txt'
                    a.click()
                    URL.revokeObjectURL(url)
                  }}
                  className="p-1 hover:bg-[#4a4a4e] rounded"
                  title="Скачать"
                >
                  <svg className="w-4 h-4 text-[#b4b4b4]" fill="none" stroke="currentColor" viewBox="0 0 24 24">
                    <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M4 16v1a3 3 0 003 3h10a3 3 0 003-3v-1m-4-4l-4 4m0 0l-4-4m4 4V4" />
                  </svg>
                </button>
                <button
                  onClick={() => {
                    const text = allPagesText.map(p => `--- Страница ${p.page_number} ---\n${p.text}`).join('\n\n')
                    const printWindow = window.open('', '_blank')
                    if (printWindow) {
                      printWindow.document.write(`<html><head><title>OCR</title></head><body><pre style="font-family: Times New Roman; font-size: 12pt; white-space: pre-wrap;">${text}</pre></body></html>`)
                      printWindow.document.close()
                      printWindow.print()
                    }
                  }}
                  className="p-1 hover:bg-[#4a4a4e] rounded"
                  title="Печать"
                >
                  <svg className="w-4 h-4 text-[#b4b4b4]" fill="none" stroke="currentColor" viewBox="0 0 24 24">
                    <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M17 17h2a2 2 0 002-2v-4a2 2 0 00-2-2H5a2 2 0 00-2 2v4a2 2 0 002 2h2m2 4h6a2 2 0 002-2v-4a2 2 0 00-2-2H9a2 2 0 00-2 2v4a2 2 0 002 2zm8-12V5a2 2 0 00-2-2H9a2 2 0 00-2 2v4h10z" />
                  </svg>
                </button>
              </div>
            </div>
            {/* Контент - точно как PDF */}
            <div className="flex-1 overflow-y-auto flex flex-col items-center" style={{ padding: '8px 0' }}>
              {isLoadingText ? (
                <div className="flex items-center justify-center h-full">
                  <div className="text-white">Загрузка...</div>
                </div>
              ) : allPagesText.length === 0 ? (
                <div className="flex items-center justify-center h-full">
                  <div className="text-gray-400">Нажмите "Распознать текст"</div>
                </div>
              ) : (
                allPagesText.map((page) => {
                  // Автоподбор размера шрифта
                  const lines = (page.text || '').split('\n').length
                  const contentHeight = 554 // высота контента в px (594 - 40 padding)
                  const lineHeightRatio = 1.15
                  // Рассчитываем оптимальный размер шрифта
                  let fontSize = contentHeight / (lines * lineHeightRatio)
                  // Ограничиваем: минимум 5px, максимум 9px
                  fontSize = Math.max(5, Math.min(9, fontSize))

                  return (
                    <div
                      key={page.page_number}
                      id={`ocr-page-${page.page_number}`}
                      className="bg-white flex-shrink-0 overflow-hidden"
                      style={{
                        width: `${420 * ocrZoom / 100}px`,
                        height: `${594 * ocrZoom / 100}px`,
                        marginBottom: '8px',
                        padding: `${20 * ocrZoom / 100}px ${25 * ocrZoom / 100}px`,
                        boxShadow: '0 1px 4px rgba(0,0,0,0.3)'
                      }}
                    >
                      <div
                        className="h-full overflow-hidden"
                        style={{
                          fontSize: `${fontSize * ocrZoom / 100}px`,
                          fontFamily: 'Arial, sans-serif',
                          lineHeight: `${lineHeightRatio}`,
                          color: '#000',
                          textAlign: 'justify'
                        }}
                      >
                        <div className="whitespace-pre-wrap">
                          {page.text || ''}
                        </div>
                      </div>
                    </div>
                  )
                })
              )}
            </div>
          </div>
        )}

        {/* Sidebar with extracted documents - независимый скролл */}
        {showSidebar && extractedDocs.length > 0 && (
          <div className="w-[500px] bg-white border-l border-gray-200 flex flex-col flex-shrink-0 h-full">
            <div className="p-4 border-b border-gray-200 bg-white flex-shrink-0">
              <h3 className="font-semibold text-[#1d1d1f] text-lg">
                Документы ({extractedDocs.length})
              </h3>
              <p className="text-sm text-[#6e6e73] mt-1">
                Нажмите для перехода к странице
              </p>
            </div>
            <div className="flex-1 min-h-0 overflow-y-auto divide-y divide-gray-100">
              {extractedDocs.map((doc, index) => (
                <button
                  key={doc.id || index}
                  onClick={() => goToPage(doc.page_start)}
                  className={`w-full text-left p-4 transition-colors ${
                    currentPage === doc.page_start
                      ? 'bg-blue-50 border-l-4 border-blue-500'
                      : 'hover:bg-gray-50'
                  }`}
                >
                  <div className="flex flex-col gap-2">
                    {/* Название документа - полностью видно */}
                    <p className="font-medium text-[#1d1d1f] text-sm leading-relaxed">
                      {index + 1}. {doc.title}
                    </p>

                    {/* Дата и тип в одной строке */}
                    <div className="flex items-center flex-wrap gap-2 text-xs">
                      {doc.date && (
                        <span className="px-2 py-1 bg-amber-50 text-amber-700 rounded font-medium">
                          {doc.date}
                        </span>
                      )}
                      {doc.doc_type && (
                        <span className="px-2 py-1 bg-blue-50 text-blue-700 rounded">
                          {doc.doc_type}
                        </span>
                      )}
                      <span className="px-2 py-1 bg-gray-100 text-gray-600 rounded ml-auto">
                        стр. {doc.page_start}{doc.page_end !== doc.page_start ? `–${doc.page_end}` : ''}
                      </span>
                    </div>
                  </div>
                </button>
              ))}
            </div>
          </div>
        )}
      </div>
    </div>
  )
}
