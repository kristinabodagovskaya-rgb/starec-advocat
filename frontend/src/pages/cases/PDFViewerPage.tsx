import { useState } from 'react'
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
  const [extractedDocs, setExtractedDocs] = useState<ExtractedDocument[]>([])
  const [showSidebar, setShowSidebar] = useState(false)
  const [currentPage, setCurrentPage] = useState(1)
  const [error, setError] = useState<string | null>(null)

  const pdfUrl = `/api/cases/${id}/volumes/${volumeId}/file`

  const handleExtractDocuments = async () => {
    console.log('Starting extraction for case', id, 'volume', volumeId)
    setIsExtracting(true)
    setError(null)

    try {
      const url = `/api/cases/${id}/volumes/${volumeId}/extract-documents`
      console.log('Calling API:', url)

      const response = await fetch(url, {
        method: 'POST',
      })

      console.log('Response status:', response.status)

      if (response.ok) {
        const data = await response.json()
        console.log('Extracted documents:', data)
        setExtractedDocs(data.documents || [])
        setShowSidebar(true)
        if (data.documents?.length === 0) {
          setError('Документы не найдены. Попробуйте открыть ОПИСЬ вручную.')
        }
      } else {
        const errorData = await response.json()
        console.error('API error:', errorData)
        setError(errorData.detail || 'Ошибка при извлечении документов')
      }
    } catch (err) {
      console.error('Extract error:', err)
      setError('Ошибка подключения к серверу: ' + String(err))
    } finally {
      setIsExtracting(false)
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
    <div className="min-h-screen flex flex-col">
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
              {/* Extract Documents Button */}
              <button
                onClick={handleExtractDocuments}
                disabled={isExtracting}
                className="apple-btn-primary flex items-center"
              >
                {isExtracting ? (
                  <>
                    <svg className="animate-spin -ml-1 mr-2 h-4 w-4 text-white" fill="none" viewBox="0 0 24 24">
                      <circle className="opacity-25" cx="12" cy="12" r="10" stroke="currentColor" strokeWidth="4"></circle>
                      <path className="opacity-75" fill="currentColor" d="M4 12a8 8 0 018-8V0C5.373 0 0 5.373 0 12h4zm2 5.291A7.962 7.962 0 014 12H0c0 3.042 1.135 5.824 3 7.938l3-2.647z"></path>
                    </svg>
                    Анализ...
                  </>
                ) : (
                  <>
                    <svg className="w-4 h-4 mr-2" fill="none" stroke="currentColor" viewBox="0 0 24 24">
                      <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M9 12h6m-6 4h6m2 5H7a2 2 0 01-2-2V5a2 2 0 012-2h5.586a1 1 0 01.707.293l5.414 5.414a1 1 0 01.293.707V19a2 2 0 01-2 2z" />
                    </svg>
                    Выделить документы
                  </>
                )}
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

              {/* Download Button */}
              <a
                href={pdfUrl}
                download
                className="apple-btn-secondary flex items-center"
              >
                <svg className="w-4 h-4 mr-2" fill="none" stroke="currentColor" viewBox="0 0 24 24">
                  <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M4 16v1a3 3 0 003 3h10a3 3 0 003-3v-1m-4-4l-4 4m0 0l-4-4m4 4V4" />
                </svg>
                Скачать
              </a>
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

      {/* Main Content */}
      <div className="flex-1 flex">
        {/* PDF Viewer */}
        <div className="flex-1 bg-[#525659]">
          <iframe
            id="pdf-viewer"
            src={pdfUrl}
            className="w-full h-full min-h-[calc(100vh-80px)]"
            title="PDF Viewer"
          />
        </div>

        {/* Sidebar with extracted documents - RIGHT SIDE */}
        {showSidebar && extractedDocs.length > 0 && (
          <div className="w-[500px] bg-white border-l border-gray-200 overflow-y-auto flex-shrink-0">
            <div className="p-4 border-b border-gray-200 sticky top-0 bg-white z-10">
              <h3 className="font-semibold text-[#1d1d1f] text-lg">
                Документы ({extractedDocs.length})
              </h3>
              <p className="text-sm text-[#6e6e73] mt-1">
                Нажмите для перехода к странице
              </p>
            </div>
            <div className="divide-y divide-gray-100">
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
