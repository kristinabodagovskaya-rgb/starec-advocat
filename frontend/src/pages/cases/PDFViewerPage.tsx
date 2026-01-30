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

interface OcrHistoryItem {
  id: number
  engine: string
  model: string | null
  pages_processed: number
  pages_total: number
  status: string
  avg_confidence: number | null
  started_at: string | null
  completed_at: string | null
}

interface ExtractionHistoryItem {
  id: number
  version: number
  documents_count: number
  total_pages: number
  model_used: string
  is_current: number
  created_at: string
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
  const [allPagesText, setAllPagesText] = useState<{page_number: number, text: string, confidence: number}[]>([])
  const [showOcrText, setShowOcrText] = useState(false)
  const [isLoadingText, setIsLoadingText] = useState(false)
  const [ocrZoom, setOcrZoom] = useState(100)
  const [ocrCurrentPage, setOcrCurrentPage] = useState(1)

  // История OCR
  const [showHistory, setShowHistory] = useState(false)
  const [historyTab, setHistoryTab] = useState<'ocr' | 'extraction'>('ocr')
  const [ocrHistory, setOcrHistory] = useState<OcrHistoryItem[]>([])
  const [extractionHistory, setExtractionHistory] = useState<ExtractionHistoryItem[]>([])
  const [currentOcrRunId, setCurrentOcrRunId] = useState<number | null>(null)
  const [chunksCount, setChunksCount] = useState(0)

  // Выбор модели Claude
  const [showClaudeMenu, setShowClaudeMenu] = useState(false)

  const pdfUrl = `/api/cases/${id}/volumes/${volumeId}/file`

  // Загружаем OCR текст при смене тома
  useEffect(() => {
    setAllPagesText([])
    setOcrStatus(null)
    setOcrCurrentPage(1)
    setCurrentOcrRunId(null)
    setChunksCount(0)

    const loadText = async () => {
      try {
        const response = await fetch(`/api/cases/${id}/volumes/${volumeId}/all-pages-text`)
        if (response.ok) {
          const data = await response.json()
          if (data.pages && data.pages.length > 0) {
            setAllPagesText(data.pages)
            setShowOcrText(true)
            if (data.ocr_run_id) {
              setCurrentOcrRunId(data.ocr_run_id)
              // Загружаем количество chunks
              const chunksRes = await fetch(`/api/cases/${id}/volumes/${volumeId}/chunks?ocr_run_id=${data.ocr_run_id}`)
              if (chunksRes.ok) {
                const chunksData = await chunksRes.json()
                setChunksCount(chunksData.total || 0)
              }
            }
          }
        }
      } catch (err) {
        console.error('Error loading OCR text:', err)
      }
    }
    loadText()
  }, [id, volumeId])

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
    setIsExtracting(true)
    setExtractionProgress(0)
    setError(null)

    try {
      const url = `/api/cases/${id}/volumes/${volumeId}/extract-documents-stream`
      const eventSource = new EventSource(url)

      eventSource.onmessage = (event) => {
        const data = JSON.parse(event.data)

        if (data.type === 'progress') {
          setExtractionProgress(data.progress)
        } else if (data.type === 'complete') {
          setExtractedDocs(data.documents || [])
          setShowSidebar(true)
          setIsExtracting(false)
          eventSource.close()
        } else if (data.type === 'error') {
          setError(data.message || 'Ошибка при извлечении документов')
          setIsExtracting(false)
          eventSource.close()
        }
      }

      eventSource.onerror = () => {
        setError('Ошибка подключения к серверу')
        setIsExtracting(false)
        eventSource.close()
      }
    } catch (err) {
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

  // Загрузка истории OCR
  const loadOcrHistory = async () => {
    try {
      const response = await fetch(`/api/cases/${id}/volumes/${volumeId}/ocr-history`)
      if (response.ok) {
        const data = await response.json()
        setOcrHistory(data.history || [])
      }
    } catch (err) {
      console.error('Error loading OCR history:', err)
    }
  }

  // Загрузка истории выделений
  const loadExtractionHistory = async () => {
    try {
      const response = await fetch(`/api/cases/${id}/volumes/${volumeId}/extraction-history`)
      if (response.ok) {
        const data = await response.json()
        setExtractionHistory(data.versions || [])
      }
    } catch (err) {
      console.error('Error loading extraction history:', err)
    }
  }

  // Загрузка обеих историй
  const loadHistory = async () => {
    await Promise.all([loadOcrHistory(), loadExtractionHistory()])
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
  const handleOcr = async (engine: 'tesseract' | 'claude' = 'tesseract', model?: 'haiku' | 'sonnet') => {
    setIsOcrRunning(true)
    setOcrProgress(0)
    setOcrEngine(engine)
    const modelLabel = model === 'sonnet' ? 'Sonnet' : model === 'haiku' ? 'Haiku' : ''
    setOcrStatus(`Запуск OCR (${engine === 'claude' ? `Claude ${modelLabel}` : 'Tesseract'})...`)
    setError(null)

    try {
      let url = `/api/cases/${id}/volumes/${volumeId}/ocr-stream?engine=${engine}`
      if (model) {
        url += `&model=${model}`
      }
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
          loadAllPagesText()
          setShowOcrText(true)
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
                <button disabled className="apple-btn-secondary flex items-center">
                  <svg className="animate-spin -ml-1 mr-2 h-4 w-4" fill="none" viewBox="0 0 24 24">
                    <circle className="opacity-25" cx="12" cy="12" r="10" stroke="currentColor" strokeWidth="4"></circle>
                    <path className="opacity-75" fill="currentColor" d="M4 12a8 8 0 018-8V0C5.373 0 0 5.373 0 12h4zm2 5.291A7.962 7.962 0 014 12H0c0 3.042 1.135 5.824 3 7.938l3-2.647z"></path>
                  </svg>
                  {ocrEngine === 'claude' ? 'Claude' : 'Tesseract'} {ocrProgress}%
                </button>
              )}

              {ocrStatus && !isOcrRunning && (
                <span className="text-xs text-green-500 whitespace-nowrap">{ocrStatus}</span>
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

                  <div className="relative">
                    <button
                      onClick={() => setShowClaudeMenu(!showClaudeMenu)}
                      className="apple-btn-primary flex items-center"
                      title="Выберите модель Claude"
                    >
                      <svg className="w-4 h-4 mr-2" fill="none" stroke="currentColor" viewBox="0 0 24 24">
                        <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M9.663 17h4.673M12 3v1m6.364 1.636l-.707.707M21 12h-1M4 12H3m3.343-5.657l-.707-.707m2.828 9.9a5 5 0 117.072 0l-.548.547A3.374 3.374 0 0014 18.469V19a2 2 0 11-4 0v-.531c0-.895-.356-1.754-.988-2.386l-.548-.547z" />
                      </svg>
                      OCR Claude
                      <svg className="w-3 h-3 ml-1" fill="none" stroke="currentColor" viewBox="0 0 24 24">
                        <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M19 9l-7 7-7-7" />
                      </svg>
                    </button>
                    {showClaudeMenu && (
                      <div className="absolute top-full left-0 mt-1 bg-white rounded-lg shadow-xl border border-gray-200 py-1 z-50 min-w-[180px]">
                        <button
                          onClick={() => { handleOcr('claude', 'haiku'); setShowClaudeMenu(false) }}
                          className="w-full text-left px-4 py-2 hover:bg-gray-100 text-sm"
                        >
                          <div className="font-medium">Claude Haiku</div>
                          <div className="text-xs text-gray-500">Быстрый, дешевле</div>
                        </button>
                        <button
                          onClick={() => { handleOcr('claude', 'sonnet'); setShowClaudeMenu(false) }}
                          className="w-full text-left px-4 py-2 hover:bg-gray-100 text-sm"
                        >
                          <div className="font-medium">Claude Sonnet</div>
                          <div className="text-xs text-gray-500">Лучше качество</div>
                        </button>
                      </div>
                    )}
                  </div>

                  <button
                    onClick={() => { loadHistory(); setShowHistory(true) }}
                    className="apple-btn-secondary flex items-center"
                    title="История распознаваний"
                  >
                    <svg className="w-4 h-4 mr-2" fill="none" stroke="currentColor" viewBox="0 0 24 24">
                      <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M12 8v4l3 3m6-3a9 9 0 11-18 0 9 9 0 0118 0z" />
                    </svg>
                    История
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

              {/* Vectorize Button */}
              {allPagesText.length > 0 && (
                <button
                  onClick={async () => {
                    try {
                      const response = await fetch(`/api/cases/${id}/volumes/${volumeId}/vectorize`, {
                        method: 'POST',
                        headers: { 'Content-Type': 'application/json' },
                        body: JSON.stringify({ ocr_run_id: currentOcrRunId })
                      })
                      if (response.ok) {
                        const data = await response.json()
                        setChunksCount(data.chunks_created)
                      }
                    } catch (err) {
                      console.error('Vectorize error:', err)
                    }
                  }}
                  className={`apple-btn-secondary flex items-center ${chunksCount > 0 ? 'bg-green-100 border-green-300' : ''}`}
                >
                  <svg className="w-4 h-4 mr-2" fill="none" stroke="currentColor" viewBox="0 0 24 24">
                    <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M19 11H5m14 0a2 2 0 012 2v6a2 2 0 01-2 2H5a2 2 0 01-2-2v-6a2 2 0 012-2m14 0V9a2 2 0 00-2-2M5 11V9a2 2 0 012-2m0 0V5a2 2 0 012-2h6a2 2 0 012 2v2M7 7h10" />
                  </svg>
                  {chunksCount > 0 ? `Векторизовано (${chunksCount})` : 'Векторизация'}
                </button>
              )}

              {/* Toggle Sidebar Button */}
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

      {/* Progress bar */}
      {isExtracting && (
        <div className="bg-blue-50 border-b border-blue-200 px-4 py-3">
          <div className="flex items-center justify-between mb-2">
            <span className="text-sm font-medium text-blue-700">Анализ документов: {extractionProgress}%</span>
          </div>
          <div className="w-full bg-blue-200 rounded-full h-3">
            <div className="bg-blue-600 h-3 rounded-full transition-all duration-300" style={{ width: `${extractionProgress}%` }} />
          </div>
        </div>
      )}

      {/* Main Content */}
      <div className="flex-1 flex overflow-hidden min-h-0">
        {/* PDF Viewer */}
        <div className={`${showOcrText ? 'w-1/2' : 'flex-1'} overflow-hidden`} style={{ backgroundColor: '#525659' }}>
          <iframe id="pdf-viewer" src={pdfUrl} className="w-full h-full" title="PDF Viewer" />
        </div>

        {/* OCR Text Column */}
        {showOcrText && (
          <div className="w-1/2 h-full flex flex-col" style={{ backgroundColor: '#525659' }}>
            {/* Toolbar */}
            <div style={{ height: '56px', minHeight: '56px' }} className="bg-[#38383b] flex items-center px-4 flex-shrink-0">
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
                  className="w-8 text-center text-xs bg-[#2d2d30] text-white border-none rounded px-1 py-0.5"
                  style={{ outline: 'none' }}
                />
                <span className="text-[#b4b4b4] text-xs ml-1">/ {allPagesText.length || '—'}</span>
              </div>

              <div className="w-px h-4 bg-[#5a5a5e] mr-2"></div>

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

              <div className="flex-1"></div>

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
              </div>
            </div>

            {/* Content */}
            <div className="flex-1 overflow-y-auto flex flex-col items-center" style={{ padding: '8px 0 60px 0' }}>
              {isLoadingText ? (
                <div className="flex items-center justify-center h-full">
                  <div className="text-white">Загрузка...</div>
                </div>
              ) : allPagesText.length === 0 ? (
                <div className="flex items-center justify-center h-full">
                  <div className="text-gray-400">Нажмите "OCR" для распознавания</div>
                </div>
              ) : (
                allPagesText.map((page) => {
                  const lines = (page.text || '').split('\n').length
                  const contentHeight = 554
                  const lineHeightRatio = 1.15
                  let fontSize = contentHeight / (lines * lineHeightRatio)
                  fontSize = Math.max(5, Math.min(9, fontSize))

                  return (
                    <div
                      key={`${currentOcrRunId || 'default'}-${page.page_number}`}
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
                        <div className="whitespace-pre-wrap">{page.text || ''}</div>
                      </div>
                    </div>
                  )
                })
              )}
            </div>
          </div>
        )}

        {/* Sidebar with documents */}
        {showSidebar && extractedDocs.length > 0 && (
          <div className="w-[500px] bg-white border-l border-gray-200 flex flex-col flex-shrink-0 h-full">
            <div className="p-4 border-b border-gray-200 bg-white flex-shrink-0">
              <h3 className="font-semibold text-[#1d1d1f] text-lg">Документы ({extractedDocs.length})</h3>
              <p className="text-sm text-[#6e6e73] mt-1">Нажмите для перехода к странице</p>
            </div>
            <div className="flex-1 min-h-0 overflow-y-auto divide-y divide-gray-100">
              {extractedDocs.map((doc, index) => (
                <button
                  key={doc.id || index}
                  onClick={() => goToPage(doc.page_start)}
                  className={`w-full text-left p-4 transition-colors ${
                    currentPage === doc.page_start ? 'bg-blue-50 border-l-4 border-blue-500' : 'hover:bg-gray-50'
                  }`}
                >
                  <div className="flex flex-col gap-2">
                    <p className="font-medium text-[#1d1d1f] text-sm leading-relaxed">
                      {index + 1}. {doc.title}
                    </p>
                    <div className="flex items-center flex-wrap gap-2 text-xs">
                      {doc.date && (
                        <span className="px-2 py-1 bg-amber-50 text-amber-700 rounded font-medium">{doc.date}</span>
                      )}
                      {doc.doc_type && (
                        <span className="px-2 py-1 bg-blue-50 text-blue-700 rounded">{doc.doc_type}</span>
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

      {/* History Modal */}
      {showHistory && (
        <div className="fixed inset-0 bg-black/50 flex items-center justify-center z-50 p-4">
          <div className="bg-white rounded-2xl max-w-2xl w-full max-h-[80vh] overflow-hidden shadow-xl">
            <div className="flex items-center justify-between p-6 border-b">
              <h2 className="text-xl font-semibold">История</h2>
              <button onClick={() => setShowHistory(false)} className="text-gray-400 hover:text-gray-600">
                <svg className="w-6 h-6" fill="none" stroke="currentColor" viewBox="0 0 24 24">
                  <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M6 18L18 6M6 6l12 12" />
                </svg>
              </button>
            </div>

            <div className="flex border-b">
              <button
                onClick={() => setHistoryTab('ocr')}
                className={`flex-1 py-3 text-center font-medium ${historyTab === 'ocr' ? 'text-blue-600 border-b-2 border-blue-600' : 'text-gray-500'}`}
              >
                OCR распознавание
              </button>
              <button
                onClick={() => setHistoryTab('extraction')}
                className={`flex-1 py-3 text-center font-medium ${historyTab === 'extraction' ? 'text-blue-600 border-b-2 border-blue-600' : 'text-gray-500'}`}
              >
                Выделение документов
              </button>
            </div>

            <div className="overflow-y-auto max-h-[60vh] p-4">
              {historyTab === 'ocr' ? (
                ocrHistory.length === 0 ? (
                  <p className="text-center text-gray-500 py-8">Нет истории OCR</p>
                ) : (
                  <div className="space-y-3">
                    {ocrHistory.map((run) => (
                      <div key={run.id} className={`border rounded-lg p-4 ${currentOcrRunId === run.id ? 'border-blue-500 bg-blue-50' : 'hover:bg-gray-50'}`}>
                        <div className="flex justify-between items-start">
                          <div>
                            <div className="font-medium">
                              {run.engine === 'claude' ? `Claude ${run.model?.includes('sonnet') ? 'Sonnet' : 'Haiku'}` : 'Tesseract'}
                            </div>
                            <div className="text-sm text-gray-500">
                              {run.pages_processed}/{run.pages_total} страниц • {run.avg_confidence}% уверенность
                            </div>
                            <div className="text-xs text-gray-400 mt-1">
                              {run.started_at && new Date(run.started_at).toLocaleString('ru')}
                            </div>
                          </div>
                          <div className="flex flex-col items-end gap-2">
                            <span className={`px-2 py-1 rounded text-xs ${run.status === 'completed' ? 'bg-green-100 text-green-700' : 'bg-yellow-100 text-yellow-700'}`}>
                              {run.status === 'completed' ? 'Завершено' : run.status}
                            </span>
                            {run.status === 'completed' && (
                              <button
                                onClick={async () => {
                                  try {
                                    const response = await fetch(`/api/cases/${id}/volumes/${volumeId}/ocr-run/${run.id}/pages`)
                                    if (response.ok) {
                                      const data = await response.json()
                                      const sortedPages = (data.pages || []).sort((a: any, b: any) => a.page_number - b.page_number)
                                      console.log('Loading OCR run:', run.id, 'pages:', sortedPages.length)
                                      setAllPagesText(sortedPages)
                                      setCurrentOcrRunId(run.id)
                                      setShowOcrText(true)
                                      setShowHistory(false)
                                    }
                                  } catch (err) {
                                    console.error('Error loading OCR run:', err)
                                  }
                                }}
                                className="px-3 py-1 bg-blue-500 text-white rounded text-xs hover:bg-blue-600"
                              >
                                Загрузить
                              </button>
                            )}
                          </div>
                        </div>
                      </div>
                    ))}
                  </div>
                )
              ) : (
                extractionHistory.length === 0 ? (
                  <p className="text-center text-gray-500 py-8">Нет истории выделений</p>
                ) : (
                  <div className="space-y-3">
                    {extractionHistory.map((run) => (
                      <div key={run.version} className={`border rounded-lg p-4 ${run.is_current ? 'border-blue-500 bg-blue-50' : 'hover:bg-gray-50'}`}>
                        <div className="flex justify-between items-start">
                          <div>
                            <div className="font-medium">Версия {run.version}</div>
                            <div className="text-sm text-gray-500">
                              {run.documents_count} документов • {run.total_pages} страниц
                            </div>
                            <div className="text-xs text-gray-400 mt-1">
                              {run.created_at && new Date(run.created_at).toLocaleString('ru')}
                            </div>
                          </div>
                          <div className="flex flex-col items-end gap-2">
                            {run.is_current ? (
                              <span className="px-2 py-1 bg-blue-100 text-blue-700 rounded text-xs">Текущая</span>
                            ) : (
                              <button
                                onClick={async () => {
                                  try {
                                    const response = await fetch(`/api/cases/${id}/volumes/${volumeId}/documents?version=${run.version}`)
                                    if (response.ok) {
                                      const data = await response.json()
                                      setExtractedDocs(data.documents || [])
                                      setShowHistory(false)
                                    }
                                  } catch (err) {
                                    console.error('Error loading extraction version:', err)
                                  }
                                }}
                                className="px-3 py-1 bg-blue-500 text-white rounded text-xs hover:bg-blue-600"
                              >
                                Загрузить
                              </button>
                            )}
                          </div>
                        </div>
                      </div>
                    ))}
                  </div>
                )
              )}
            </div>
          </div>
        </div>
      )}
    </div>
  )
}
