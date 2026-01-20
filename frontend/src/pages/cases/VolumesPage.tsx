import { useState, useEffect } from 'react'
import { useParams, useNavigate } from 'react-router-dom'

interface Volume {
  id: number
  volume_number: number
  file_name: string
  file_size: number
  page_count: number
  processing_status: string
  ocr_quality: number
  created_at: string
}

export default function VolumesPage() {
  const { id } = useParams()
  const navigate = useNavigate()
  const [volumes, setVolumes] = useState<Volume[]>([])
  const [isLoading, setIsLoading] = useState(true)
  const [showUploadModal, setShowUploadModal] = useState(false)
  const [uploadMethod, setUploadMethod] = useState<'local' | 'gdrive'>('local')
  const [selectedFiles, setSelectedFiles] = useState<File[]>([])
  const [gdriveLink, setGdriveLink] = useState('')
  const [isUploading, setIsUploading] = useState(false)

  useEffect(() => {
    loadVolumes()
  }, [id])

  const loadVolumes = async () => {
    try {
      const token = localStorage.getItem('token')
      const response = await fetch(`/api/cases/${id}/volumes`, {
        headers: { 'Authorization': `Bearer ${token}` }
      })

      if (response.ok) {
        const data = await response.json()
        setVolumes(data)
      }
    } catch (error) {
      console.error('Failed to load volumes:', error)
    } finally {
      setIsLoading(false)
    }
  }

  const handleDeleteVolume = async (volumeId: number) => {
    if (!confirm('Удалить этот том? Это действие нельзя отменить.')) return

    try {
      const response = await fetch(`/api/cases/${id}/volumes/${volumeId}`, {
        method: 'DELETE',
      })

      if (response.ok) {
        loadVolumes()
      } else {
        const errorData = await response.json()
        alert(`Ошибка: ${errorData.detail || 'Не удалось удалить том'}`)
      }
    } catch (error) {
      console.error('Delete error:', error)
      alert('Ошибка при удалении тома')
    }
  }

  const handleUpload = async () => {
    setIsUploading(true)
    try {
      if (uploadMethod === 'local' && selectedFiles.length > 0) {
        const formData = new FormData()
        selectedFiles.forEach((file) => {
          formData.append('files', file)
        })

        const response = await fetch(`/api/cases/${id}/upload-volumes/`, {
          method: 'POST',
          body: formData,
        })

        if (response.ok) {
          const result = await response.json()
          alert(`Успешно загружено ${result.uploaded} файлов!`)
          setShowUploadModal(false)
          setSelectedFiles([])
          loadVolumes()
        } else {
          const errorData = await response.json()
          alert(`Ошибка: ${errorData.detail || 'Неизвестная ошибка'}`)
        }
      } else if (uploadMethod === 'gdrive' && gdriveLink) {
        const response = await fetch(`/api/cases/${id}/sync-gdrive/`, {
          method: 'POST',
          headers: { 'Content-Type': 'application/json' },
          body: JSON.stringify({ gdrive_link: gdriveLink }),
        })

        if (response.ok) {
          const result = await response.json()
          alert(`Успешно! ${result.message}`)
          setShowUploadModal(false)
          setGdriveLink('')
          loadVolumes()
        } else {
          const errorData = await response.json()
          alert(`Ошибка: ${errorData.detail || 'Не удалось загрузить файл'}`)
        }
      }
    } catch (error) {
      console.error('Upload error:', error)
      alert(`Ошибка подключения: ${error}`)
    } finally {
      setIsUploading(false)
    }
  }

  const formatFileSize = (bytes: number) => {
    if (bytes < 1024 * 1024) return `${(bytes / 1024).toFixed(1)} КБ`
    return `${(bytes / (1024 * 1024)).toFixed(1)} МБ`
  }

  const getStatusBadge = (status: string) => {
    const styles = {
      pending: 'bg-[#86868b] text-white',
      processing: 'apple-badge-warning',
      completed: 'apple-badge-success',
      failed: 'apple-badge-danger',
    }
    const labels = {
      pending: 'Ожидает',
      processing: 'Обработка',
      completed: 'Готово',
      failed: 'Ошибка',
    }
    return (
      <span className={`apple-badge ${styles[status as keyof typeof styles]}`}>
        {labels[status as keyof typeof labels]}
      </span>
    )
  }

  if (isLoading) {
    return (
      <div className="min-h-screen flex items-center justify-center">
        <div className="apple-glass-card p-8">
          <div className="animate-spin rounded-full h-12 w-12 border-b-2 border-[#1d1d1f]"></div>
        </div>
      </div>
    )
  }

  return (
    <div className="min-h-screen">
      {/* Header */}
      <header className="apple-header sticky top-0 z-10">
        <div className="max-w-7xl mx-auto px-4 sm:px-6 lg:px-8 py-4">
          <button
            onClick={() => navigate(`/cases/${id}`)}
            className="flex items-center text-[#6e6e73] hover:text-[#1d1d1f] transition-colors mb-4 group"
          >
            <svg className="w-5 h-5 mr-2 transition-transform group-hover:-translate-x-1" fill="none" stroke="currentColor" viewBox="0 0 24 24">
              <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M15 19l-7-7 7-7" />
            </svg>
            Назад к делу
          </button>
          <div className="flex items-center justify-between">
            <div>
              <h1 className="text-2xl sm:text-3xl font-semibold text-[#1d1d1f] tracking-tight">Тома дела</h1>
              <p className="text-[#6e6e73] mt-1">Всего томов: {volumes.length}</p>
            </div>
            <button
              onClick={() => setShowUploadModal(true)}
              className="apple-btn-secondary"
            >
              Добавить том
            </button>
          </div>
        </div>
      </header>

      {/* Main Content */}
      <main className="max-w-7xl mx-auto px-4 sm:px-6 lg:px-8 py-8 apple-animate-slideUp">
        {volumes.length === 0 ? (
          <div className="apple-glass-card p-12 text-center">
            <svg className="w-16 h-16 text-[#86868b] mx-auto mb-4" fill="none" stroke="currentColor" viewBox="0 0 24 24">
              <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M3 7v10a2 2 0 002 2h14a2 2 0 002-2V9a2 2 0 00-2-2h-6l-2-2H5a2 2 0 00-2 2z" />
            </svg>
            <p className="text-[#6e6e73] mb-4">Тома еще не загружены</p>
            <button
              onClick={() => setShowUploadModal(true)}
              className="text-[#1d1d1f] hover:text-[#1d1d1f] font-medium transition-colors"
            >
              Загрузить тома
            </button>
          </div>
        ) : (
          <div className="space-y-4">
            {volumes.map((volume) => (
              <div
                key={volume.id}
                className="apple-glass-card p-6"
              >
                <div className="flex items-center justify-between">
                  <div className="flex items-center space-x-4 flex-1">
                    <div className="w-14 h-14 bg-[#1d1d1f]/10 rounded-2xl flex items-center justify-center flex-shrink-0">
                      <svg className="w-7 h-7 text-[#1d1d1f]" fill="none" stroke="currentColor" viewBox="0 0 24 24">
                        <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M9 12h6m-6 4h6m2 5H7a2 2 0 01-2-2V5a2 2 0 012-2h5.586a1 1 0 01.707.293l5.414 5.414a1 1 0 01.293.707V19a2 2 0 01-2 2z" />
                      </svg>
                    </div>
                    <div className="flex-1">
                      <div className="flex items-center space-x-3 mb-1">
                        <h3 className="text-lg font-semibold text-[#1d1d1f]">
                          Том {volume.volume_number}
                        </h3>
                        {getStatusBadge(volume.processing_status)}
                      </div>
                      <p className="text-sm text-[#6e6e73] mb-2">{volume.file_name}</p>
                      <div className="flex items-center space-x-4 text-sm text-[#86868b]">
                        <span>{formatFileSize(volume.file_size)}</span>
                        {volume.page_count > 0 && (
                          <>
                            <span className="text-[#d2d2d7]">|</span>
                            <span>{volume.page_count} страниц</span>
                          </>
                        )}
                        {volume.ocr_quality > 0 && (
                          <>
                            <span className="text-[#d2d2d7]">|</span>
                            <span>OCR: {volume.ocr_quality}%</span>
                          </>
                        )}
                      </div>
                    </div>
                  </div>
                  <div className="flex items-center space-x-2">
                    <button className="p-3 hover:bg-black/5 rounded-xl transition-colors group">
                      <svg className="w-5 h-5 text-[#6e6e73] group-hover:text-[#1d1d1f] transition-colors" fill="none" stroke="currentColor" viewBox="0 0 24 24">
                        <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M15 12a3 3 0 11-6 0 3 3 0 016 0z" />
                        <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M2.458 12C3.732 7.943 7.523 5 12 5c4.478 0 8.268 2.943 9.542 7-1.274 4.057-5.064 7-9.542 7-4.477 0-8.268-2.943-9.542-7z" />
                      </svg>
                    </button>
                    <button className="p-3 hover:bg-black/5 rounded-xl transition-colors group">
                      <svg className="w-5 h-5 text-[#6e6e73] group-hover:text-[#6e6e73] transition-colors" fill="none" stroke="currentColor" viewBox="0 0 24 24">
                        <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M4 16v1a3 3 0 003 3h10a3 3 0 003-3v-1m-4-4l-4 4m0 0l-4-4m4 4V4" />
                      </svg>
                    </button>
                    <button
                      onClick={() => handleDeleteVolume(volume.id)}
                      className="p-3 hover:bg-red-50 rounded-xl transition-colors group"
                    >
                      <svg className="w-5 h-5 text-[#6e6e73] group-hover:text-red-500 transition-colors" fill="none" stroke="currentColor" viewBox="0 0 24 24">
                        <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M19 7l-.867 12.142A2 2 0 0116.138 21H7.862a2 2 0 01-1.995-1.858L5 7m5 4v6m4-6v6m1-10V4a1 1 0 00-1-1h-4a1 1 0 00-1 1v3M4 7h16" />
                      </svg>
                    </button>
                  </div>
                </div>
              </div>
            ))}
          </div>
        )}
      </main>

      {/* Upload Modal */}
      {showUploadModal && (
        <div className="fixed inset-0 bg-black/50 flex items-center justify-center z-50 p-4">
          <div className="bg-white rounded-2xl max-w-lg w-full p-6 shadow-xl">
            <div className="flex items-center justify-between mb-6">
              <h2 className="text-xl font-semibold text-[#1d1d1f]">Загрузить тома</h2>
              <button
                onClick={() => setShowUploadModal(false)}
                className="p-2 hover:bg-black/5 rounded-xl transition-colors"
              >
                <svg className="w-5 h-5 text-[#6e6e73]" fill="none" stroke="currentColor" viewBox="0 0 24 24">
                  <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M6 18L18 6M6 6l12 12" />
                </svg>
              </button>
            </div>

            {/* Upload Method Toggle */}
            <div className="flex space-x-2 mb-6">
              <button
                onClick={() => setUploadMethod('local')}
                className={`flex-1 py-3 px-4 rounded-xl text-sm font-medium transition-colors ${
                  uploadMethod === 'local'
                    ? 'bg-[#1d1d1f] text-white'
                    : 'bg-[#f5f5f7] text-[#6e6e73] hover:bg-[#e8e8ed]'
                }`}
              >
                С компьютера
              </button>
              <button
                onClick={() => setUploadMethod('gdrive')}
                className={`flex-1 py-3 px-4 rounded-xl text-sm font-medium transition-colors ${
                  uploadMethod === 'gdrive'
                    ? 'bg-[#1d1d1f] text-white'
                    : 'bg-[#f5f5f7] text-[#6e6e73] hover:bg-[#e8e8ed]'
                }`}
              >
                Google Drive
              </button>
            </div>

            {uploadMethod === 'local' ? (
              <div className="space-y-4">
                <div
                  className="border-2 border-dashed border-[#d2d2d7] rounded-xl p-8 text-center cursor-pointer hover:border-[#86868b] transition-colors"
                  onClick={() => document.getElementById('file-input')?.click()}
                >
                  <svg className="w-12 h-12 text-[#86868b] mx-auto mb-3" fill="none" stroke="currentColor" viewBox="0 0 24 24">
                    <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M7 16a4 4 0 01-.88-7.903A5 5 0 1115.9 6L16 6a5 5 0 011 9.9M15 13l-3-3m0 0l-3 3m3-3v12" />
                  </svg>
                  <p className="text-[#6e6e73]">
                    {selectedFiles.length > 0
                      ? `Выбрано файлов: ${selectedFiles.length}`
                      : 'Нажмите для выбора PDF файлов'}
                  </p>
                </div>
                <input
                  id="file-input"
                  type="file"
                  accept=".pdf"
                  multiple
                  className="hidden"
                  onChange={(e) => setSelectedFiles(Array.from(e.target.files || []))}
                />
              </div>
            ) : (
              <div className="space-y-4">
                <input
                  type="text"
                  placeholder="Вставьте ссылку на файл Google Drive"
                  value={gdriveLink}
                  onChange={(e) => setGdriveLink(e.target.value)}
                  className="w-full px-4 py-3 border border-[#d2d2d7] rounded-xl focus:outline-none focus:ring-2 focus:ring-[#1d1d1f] focus:border-transparent"
                />
                <p className="text-sm text-[#86868b]">
                  Файл должен быть доступен по ссылке (настройки: "Все у кого есть ссылка")
                </p>
              </div>
            )}

            {/* Actions */}
            <div className="flex space-x-3 mt-6">
              <button
                onClick={() => setShowUploadModal(false)}
                className="flex-1 py-3 px-4 bg-[#f5f5f7] text-[#1d1d1f] rounded-xl font-medium hover:bg-[#e8e8ed] transition-colors"
              >
                Отмена
              </button>
              <button
                onClick={handleUpload}
                disabled={isUploading || (uploadMethod === 'local' ? selectedFiles.length === 0 : !gdriveLink)}
                className="flex-1 py-3 px-4 bg-[#1d1d1f] text-white rounded-xl font-medium hover:bg-[#424245] transition-colors disabled:opacity-50 disabled:cursor-not-allowed"
              >
                {isUploading ? 'Загрузка...' : 'Загрузить'}
              </button>
            </div>
          </div>
        </div>
      )}
    </div>
  )
}
