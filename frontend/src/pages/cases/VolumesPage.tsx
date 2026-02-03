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
  ocr_current_page: number
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
  const [uploadProgress, setUploadProgress] = useState(0)

  // Массовый OCR
  const [selectedVolumes, setSelectedVolumes] = useState<Set<number>>(new Set())
  const [isRunningBatchOcr, setIsRunningBatchOcr] = useState(false)
  const [showOcrModal, setShowOcrModal] = useState(false)
  const [ocrModel, setOcrModel] = useState<'haiku' | 'sonnet'>('haiku')

  useEffect(() => {
    loadVolumes()
  }, [id])

  // Автоматическое обновление при активном OCR
  useEffect(() => {
    const hasProcessing = volumes.some(v => v.processing_status === 'processing')
    if (hasProcessing) {
      const interval = setInterval(loadVolumes, 3000) // Обновлять каждые 3 секунды
      return () => clearInterval(interval)
    }
  }, [volumes])

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
    setUploadProgress(0)
    try {
      if (uploadMethod === 'local' && selectedFiles.length > 0) {
        const formData = new FormData()
        selectedFiles.forEach((file) => {
          formData.append('files', file)
        })

        // Используем XMLHttpRequest для отслеживания прогресса
        const xhr = new XMLHttpRequest()

        const uploadPromise = new Promise<{ok: boolean, data?: any, error?: string}>((resolve) => {
          xhr.upload.addEventListener('progress', (event) => {
            if (event.lengthComputable) {
              const percent = Math.round((event.loaded / event.total) * 100)
              setUploadProgress(percent)
            }
          })

          xhr.addEventListener('load', () => {
            if (xhr.status >= 200 && xhr.status < 300) {
              try {
                const result = JSON.parse(xhr.responseText)
                resolve({ ok: true, data: result })
              } catch {
                resolve({ ok: true })
              }
            } else {
              let errorMessage = `Ошибка ${xhr.status}`
              try {
                const errorData = JSON.parse(xhr.responseText)
                errorMessage = errorData.detail || errorMessage
              } catch {
                if (xhr.responseText.length > 0) {
                  errorMessage = xhr.responseText.substring(0, 200)
                }
              }
              resolve({ ok: false, error: errorMessage })
            }
          })

          xhr.addEventListener('error', () => {
            resolve({ ok: false, error: 'Ошибка сети' })
          })

          xhr.open('POST', `/api/cases/${id}/upload-volumes/`)
          xhr.send(formData)
        })

        const result = await uploadPromise

        if (result.ok) {
          alert(`Успешно загружено ${result.data?.uploaded || selectedFiles.length} файлов!`)
          setShowUploadModal(false)
          setSelectedFiles([])
          loadVolumes()
        } else {
          alert(`Ошибка: ${result.error}`)
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
          let errorMessage = `Ошибка ${response.status}`
          try {
            const errorData = await response.json()
            errorMessage = errorData.detail || errorMessage
          } catch {
            errorMessage = 'Не удалось загрузить файл'
          }
          alert(`Ошибка: ${errorMessage}`)
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

  // Выбор/снятие выбора тома
  const toggleVolumeSelection = (volumeId: number) => {
    setSelectedVolumes(prev => {
      const newSet = new Set(prev)
      if (newSet.has(volumeId)) {
        newSet.delete(volumeId)
      } else {
        newSet.add(volumeId)
      }
      return newSet
    })
  }

  // Выбрать все / снять выбор
  const toggleSelectAll = () => {
    if (selectedVolumes.size === volumes.length) {
      setSelectedVolumes(new Set())
    } else {
      setSelectedVolumes(new Set(volumes.map(v => v.id)))
    }
  }

  // Запуск массового OCR
  const handleBatchOcr = async () => {
    if (selectedVolumes.size === 0) return

    setIsRunningBatchOcr(true)
    try {
      const response = await fetch(`/api/cases/${id}/batch-ocr`, {
        method: 'POST',
        headers: { 'Content-Type': 'application/json' },
        body: JSON.stringify({
          volume_ids: Array.from(selectedVolumes),
          engine: 'claude',
          model: ocrModel
        })
      })

      if (response.ok) {
        const result = await response.json()
        alert(`${result.message}`)
        setShowOcrModal(false)
        setSelectedVolumes(new Set())
      } else {
        const error = await response.json()
        alert(`Ошибка: ${error.detail || 'Не удалось запустить OCR'}`)
      }
    } catch (error) {
      console.error('Batch OCR error:', error)
      alert('Ошибка при запуске OCR')
    } finally {
      setIsRunningBatchOcr(false)
    }
  }

  const getStatusBadge = (volume: Volume) => {
    const status = volume.processing_status
    const styles: Record<string, string> = {
      pending: 'bg-gray-100 text-gray-600',
      stopped: 'bg-gray-100 text-gray-600',
      processing: 'bg-yellow-100 text-yellow-700',
      completed: 'bg-green-100 text-green-700',
      ocr_completed: 'bg-green-100 text-green-700',
      failed: 'bg-red-100 text-red-700',
      error: 'bg-red-100 text-red-700',
    }
    const labels: Record<string, string> = {
      pending: 'Ожидает',
      stopped: 'Остановлен',
      processing: 'Распознаётся',
      completed: 'Готово',
      ocr_completed: 'OCR готов',
      failed: 'Ошибка',
      error: 'Ошибка',
    }

    // Если идёт распознавание - показываем прогресс
    if (status === 'processing' && volume.page_count > 0) {
      const progress = Math.round((volume.ocr_current_page / volume.page_count) * 100)
      return (
        <div className="flex items-center space-x-2">
          <span className={`px-2 py-1 rounded-full text-xs font-medium ${styles[status]}`}>
            {volume.ocr_current_page}/{volume.page_count} стр.
          </span>
          <div className="w-24 h-2 bg-gray-200 rounded-full overflow-hidden">
            <div
              className="h-full bg-yellow-500 transition-all duration-300"
              style={{ width: `${progress}%` }}
            />
          </div>
          <span className="text-xs text-gray-500">{progress}%</span>
        </div>
      )
    }

    return (
      <span className={`px-2 py-1 rounded-full text-xs font-medium ${styles[status] || styles.pending}`}>
        {labels[status] || status}
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
              <p className="text-[#6e6e73] mt-1">
                Всего: {volumes.length}
                {selectedVolumes.size > 0 && (
                  <span className="ml-2 text-blue-600">• Выбрано: {selectedVolumes.size}</span>
                )}
              </p>
            </div>
            <div className="flex items-center space-x-3">
              {volumes.length > 0 && (
                <>
                  <button
                    onClick={toggleSelectAll}
                    className="apple-btn-secondary text-sm"
                  >
                    {selectedVolumes.size === volumes.length ? 'Снять выбор' : 'Выбрать все'}
                  </button>
                  {selectedVolumes.size > 0 && (
                    <button
                      onClick={() => setShowOcrModal(true)}
                      className="apple-btn-primary flex items-center"
                    >
                      <svg className="w-4 h-4 mr-2" fill="none" stroke="currentColor" viewBox="0 0 24 24">
                        <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M9.663 17h4.673M12 3v1m6.364 1.636l-.707.707M21 12h-1M4 12H3m3.343-5.657l-.707-.707m2.828 9.9a5 5 0 117.072 0l-.548.547A3.374 3.374 0 0014 18.469V19a2 2 0 11-4 0v-.531c0-.895-.356-1.754-.988-2.386l-.548-.547z" />
                      </svg>
                      OCR ({selectedVolumes.size})
                    </button>
                  )}
                </>
              )}
              <button
                onClick={() => setShowUploadModal(true)}
                className="apple-btn-secondary"
              >
                Загрузить файл
              </button>
            </div>
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
            <p className="text-[#6e6e73] mb-4">Файлы еще не загружены</p>
            <button
              onClick={() => setShowUploadModal(true)}
              className="text-[#1d1d1f] hover:text-[#1d1d1f] font-medium transition-colors"
            >
              Загрузить файл
            </button>
          </div>
        ) : (
          <div className="space-y-4">
            {volumes.map((volume) => (
              <div
                key={volume.id}
                className={`apple-glass-card p-6 ${selectedVolumes.has(volume.id) ? 'ring-2 ring-blue-500' : ''}`}
              >
                <div className="flex items-center justify-between">
                  <div className="flex items-center space-x-4 flex-1">
                    {/* Чекбокс для выбора */}
                    <input
                      type="checkbox"
                      checked={selectedVolumes.has(volume.id)}
                      onChange={() => toggleVolumeSelection(volume.id)}
                      className="w-5 h-5 rounded border-gray-300 text-blue-600 focus:ring-blue-500 cursor-pointer"
                    />
                    <div className="w-14 h-14 bg-[#1d1d1f]/10 rounded-2xl flex items-center justify-center flex-shrink-0">
                      <svg className="w-7 h-7 text-[#1d1d1f]" fill="none" stroke="currentColor" viewBox="0 0 24 24">
                        <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M9 12h6m-6 4h6m2 5H7a2 2 0 01-2-2V5a2 0 012-2h5.586a1 1 0 01.707.293l5.414 5.414a1 1 0 01.293.707V19a2 2 0 01-2 2z" />
                      </svg>
                    </div>
                    <div className="flex-1">
                      <div className="flex items-center space-x-3 mb-1">
                        <h3 className="text-lg font-semibold text-[#1d1d1f]">
                          {volume.file_name}
                        </h3>
                        {getStatusBadge(volume)}
                      </div>
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
                    <button
                      onClick={() => navigate(`/cases/${id}/volumes/${volume.id}/view`)}
                      className="apple-btn-primary"
                    >
                      Открыть
                    </button>
                    <button
                      onClick={() => handleDeleteVolume(volume.id)}
                      className="p-3 hover:bg-red-50 rounded-xl transition-colors group"
                      title="Удалить"
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

      {/* OCR Modal */}
      {showOcrModal && (
        <div className="fixed inset-0 bg-black/50 flex items-center justify-center z-50 p-4">
          <div className="bg-white rounded-2xl max-w-md w-full p-6 shadow-xl">
            <div className="flex items-center justify-between mb-6">
              <h2 className="text-xl font-semibold text-[#1d1d1f]">Запустить OCR</h2>
              <button
                onClick={() => setShowOcrModal(false)}
                className="p-2 hover:bg-black/5 rounded-xl transition-colors"
              >
                <svg className="w-5 h-5 text-[#6e6e73]" fill="none" stroke="currentColor" viewBox="0 0 24 24">
                  <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M6 18L18 6M6 6l12 12" />
                </svg>
              </button>
            </div>

            <div className="mb-6">
              <p className="text-[#6e6e73] mb-4">
                Выбрано томов: <span className="font-semibold text-[#1d1d1f]">{selectedVolumes.size}</span>
              </p>
              <p className="text-sm text-[#86868b]">
                OCR будет запущен параллельно на всех выбранных томах.
              </p>
            </div>

            <div className="mb-6">
              <label className="block text-sm font-medium text-[#1d1d1f] mb-3">Модель Claude:</label>
              <div className="flex space-x-3">
                <button
                  onClick={() => setOcrModel('haiku')}
                  className={`flex-1 py-3 px-4 rounded-xl text-sm font-medium transition-colors ${
                    ocrModel === 'haiku'
                      ? 'bg-[#1d1d1f] text-white'
                      : 'bg-[#f5f5f7] text-[#6e6e73] hover:bg-[#e8e8ed]'
                  }`}
                >
                  <div>Haiku</div>
                  <div className="text-xs mt-1 opacity-70">Быстрый, дешевле</div>
                </button>
                <button
                  onClick={() => setOcrModel('sonnet')}
                  className={`flex-1 py-3 px-4 rounded-xl text-sm font-medium transition-colors ${
                    ocrModel === 'sonnet'
                      ? 'bg-[#1d1d1f] text-white'
                      : 'bg-[#f5f5f7] text-[#6e6e73] hover:bg-[#e8e8ed]'
                  }`}
                >
                  <div>Sonnet</div>
                  <div className="text-xs mt-1 opacity-70">Лучше качество</div>
                </button>
              </div>
            </div>

            <div className="flex space-x-3">
              <button
                onClick={() => setShowOcrModal(false)}
                className="flex-1 py-3 px-4 bg-[#f5f5f7] text-[#1d1d1f] rounded-xl font-medium hover:bg-[#e8e8ed] transition-colors"
              >
                Отмена
              </button>
              <button
                onClick={handleBatchOcr}
                disabled={isRunningBatchOcr}
                className="flex-1 py-3 px-4 bg-[#1d1d1f] text-white rounded-xl font-medium hover:bg-[#424245] transition-colors disabled:opacity-50 flex items-center justify-center"
              >
                {isRunningBatchOcr ? (
                  <>
                    <svg className="animate-spin -ml-1 mr-2 h-5 w-5 text-white" fill="none" viewBox="0 0 24 24">
                      <circle className="opacity-25" cx="12" cy="12" r="10" stroke="currentColor" strokeWidth="4"></circle>
                      <path className="opacity-75" fill="currentColor" d="M4 12a8 8 0 018-8V0C5.373 0 0 5.373 0 12h4zm2 5.291A7.962 7.962 0 014 12H0c0 3.042 1.135 5.824 3 7.938l3-2.647z"></path>
                    </svg>
                    Запуск...
                  </>
                ) : (
                  <>Запустить OCR</>
                )}
              </button>
            </div>
          </div>
        </div>
      )}

      {/* Upload Modal */}
      {showUploadModal && (
        <div className="fixed inset-0 bg-black/50 flex items-center justify-center z-50 p-4">
          <div className="bg-white rounded-2xl max-w-lg w-full p-6 shadow-xl">
            <div className="flex items-center justify-between mb-6">
              <h2 className="text-xl font-semibold text-[#1d1d1f]">Загрузить файл</h2>
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
                className="flex-1 py-3 px-4 bg-[#1d1d1f] text-white rounded-xl font-medium hover:bg-[#424245] transition-colors disabled:opacity-50 disabled:cursor-not-allowed flex items-center justify-center"
              >
                {isUploading ? (
                  <>
                    <svg className="animate-spin -ml-1 mr-2 h-5 w-5 text-white" fill="none" viewBox="0 0 24 24">
                      <circle className="opacity-25" cx="12" cy="12" r="10" stroke="currentColor" strokeWidth="4"></circle>
                      <path className="opacity-75" fill="currentColor" d="M4 12a8 8 0 018-8V0C5.373 0 0 5.373 0 12h4zm2 5.291A7.962 7.962 0 014 12H0c0 3.042 1.135 5.824 3 7.938l3-2.647z"></path>
                    </svg>
                    {uploadProgress > 0 ? `${uploadProgress}%` : 'Загрузка...'}
                  </>
                ) : 'Загрузить'}
              </button>
            </div>
          </div>
        </div>
      )}
    </div>
  )
}
