import { useParams, useNavigate } from 'react-router-dom'

export default function PDFViewerPage() {
  const { id, volumeId } = useParams()
  const navigate = useNavigate()

  const pdfUrl = `/api/cases/${id}/volumes/${volumeId}/file`

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
              Назад к томам
            </button>
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
      </header>

      {/* PDF Viewer */}
      <div className="flex-1 bg-[#525659]">
        <iframe
          src={pdfUrl}
          className="w-full h-full min-h-[calc(100vh-80px)]"
          title="PDF Viewer"
        />
      </div>
    </div>
  )
}
