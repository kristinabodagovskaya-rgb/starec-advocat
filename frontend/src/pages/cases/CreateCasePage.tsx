import { useState } from 'react'
import { useNavigate } from 'react-router-dom'

interface CaseFormData {
  case_number: string
  title: string
  article: string
  defendant_name: string
  investigation_organ: string
  initiation_date: string
  notes: string
}

export default function CreateCasePage() {
  const navigate = useNavigate()
  const [step, setStep] = useState(1)
  const [isSubmitting, setIsSubmitting] = useState(false)
  const [uploadMethod, setUploadMethod] = useState<'local' | 'gdrive'>('local')
  const [gdriveLink, setGdriveLink] = useState('')
  const [selectedFiles, setSelectedFiles] = useState<File[]>([])
  const [formData, setFormData] = useState<CaseFormData>({
    case_number: '',
    title: '',
    article: '',
    defendant_name: '',
    investigation_organ: 'СК РФ',
    initiation_date: '',
    notes: '',
  })

  const handleInputChange = (e: React.ChangeEvent<HTMLInputElement | HTMLTextAreaElement | HTMLSelectElement>) => {
    const { name, value } = e.target
    setFormData(prev => ({ ...prev, [name]: value }))
  }

  const handleStep1Submit = async (e: React.FormEvent) => {
    e.preventDefault()

    // Validate required fields
    if (!formData.case_number || !formData.title) {
      alert('Пожалуйста, заполните все обязательные поля')
      return
    }

    setIsSubmitting(true)

    try {
      const response = await fetch('/api/cases/', {
        method: 'POST',
        headers: {
          'Content-Type': 'application/json',
        },
        body: JSON.stringify(formData),
      })

      if (response.ok) {
        const newCase = await response.json()
        console.log('Case created successfully:', newCase)
        setStep(2)
        sessionStorage.setItem('newCaseId', newCase.id.toString())
      } else {
        const errorText = await response.text()
        console.error('Server error:', response.status, errorText)
        alert(`Ошибка при создании дела: ${response.status} - ${errorText}`)
      }
    } catch (error) {
      console.error('Failed to create case:', error)
      alert(`Ошибка подключения к серверу: ${error}`)
    } finally {
      setIsSubmitting(false)
    }
  }

  const handleFileSelect = (e: React.ChangeEvent<HTMLInputElement>) => {
    const files = e.target.files
    if (files) {
      setSelectedFiles(Array.from(files))
    }
  }

  const handleUploadFiles = async () => {
    const caseId = sessionStorage.getItem('newCaseId')
    if (!caseId) {
      alert('Ошибка: ID дела не найден')
      return
    }

    if (uploadMethod === 'local' && selectedFiles.length === 0) {
      alert('Выберите файлы для загрузки')
      return
    }

    if (uploadMethod === 'gdrive' && !gdriveLink) {
      alert('Вставьте ссылку на Google Drive')
      return
    }

    setIsSubmitting(true)

    try {
      if (uploadMethod === 'local') {
        // Загрузка файлов с компьютера
        const formData = new FormData()
        selectedFiles.forEach((file) => {
          formData.append('files', file)
        })

        const response = await fetch(`/api/cases/${caseId}/upload-volumes/`, {
          method: 'POST',
          body: formData,
        })

        if (response.ok) {
          const result = await response.json()
          alert(`Успешно загружено ${result.uploaded} файлов!`)
          sessionStorage.removeItem('newCaseId')
          navigate(`/cases/${caseId}`)
        } else {
          const errorData = await response.json()
          alert(`Ошибка при загрузке файлов: ${errorData.detail || 'Неизвестная ошибка'}`)
        }
      } else {
        // Загрузка по ссылке Google Drive
        const response = await fetch(`/api/cases/${caseId}/sync-gdrive/`, {
          method: 'POST',
          headers: {
            'Content-Type': 'application/json',
          },
          body: JSON.stringify({
            gdrive_link: gdriveLink,
          }),
        })

        if (response.ok) {
          const result = await response.json()
          alert(`Успешно! ${result.message}`)
          sessionStorage.removeItem('newCaseId')
          navigate(`/cases/${caseId}`)
        } else {
          const errorData = await response.json()
          alert(`Ошибка: ${errorData.detail || 'Не удалось загрузить файл'}`)
        }
      }
    } catch (error) {
      console.error('Upload error:', error)
      alert(`Ошибка подключения: ${error}`)
    } finally {
      setIsSubmitting(false)
    }
  }

  const handleSkipUpload = () => {
    const caseId = sessionStorage.getItem('newCaseId')
    if (caseId) {
      sessionStorage.removeItem('newCaseId')
      navigate(`/cases/${caseId}`)
    }
  }

  return (
    <div className="min-h-screen ">
      {/* Header */}
      <header className="bg-white shadow-sm border-b border-gray-200">
        <div className="max-w-4xl mx-auto px-4 sm:px-6 lg:px-8 py-4">
          <button
            onClick={() => step === 1 ? navigate('/') : setStep(1)}
            className="flex items-center text-gray-600 hover:text-gray-900 transition-colors"
          >
            <svg className="w-5 h-5 mr-2" fill="none" stroke="currentColor" viewBox="0 0 24 24">
              <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M15 19l-7-7 7-7" />
            </svg>
            {step === 1 ? 'Назад к списку дел' : 'Назад'}
          </button>
        </div>
      </header>

      {/* Main Content */}
      <main className="max-w-4xl mx-auto px-4 sm:px-6 lg:px-8 py-8">
        {/* Page Title */}
        <div className="mb-6">
          <h1 className="text-3xl font-bold text-gray-900 mb-2">
            СОЗДАНИЕ НОВОГО ДЕЛА
          </h1>
          <p className="text-gray-600">
            Шаг {step} из 2: {step === 1 ? 'Основная информация' : 'Загрузка томов'}
          </p>
        </div>

        {/* Progress Bar */}
        <div className="mb-8">
          <div className="flex items-center justify-between mb-2">
            <span className={`text-sm font-medium ${step >= 1 ? 'text-blue-600' : 'text-gray-400'}`}>
              Информация о деле
            </span>
            <span className={`text-sm font-medium ${step >= 2 ? 'text-blue-600' : 'text-gray-400'}`}>
              Загрузка томов
            </span>
          </div>
          <div className="h-2 bg-gray-200 rounded-full overflow-hidden">
            <div
              className="h-full bg-blue-600 transition-all duration-300"
              style={{ width: `${(step / 2) * 100}%` }}
            ></div>
          </div>
        </div>

        {/* Step 1: Case Information Form */}
        {step === 1 && (
          <div className="bg-white rounded-xl shadow-sm p-8">
            <form onSubmit={handleStep1Submit} className="space-y-6">
              {/* Case Number */}
              <div>
                <label htmlFor="case_number" className="block text-sm font-medium text-gray-700 mb-2">
                  * Номер уголовного дела
                </label>
                <input
                  id="case_number"
                  name="case_number"
                  type="text"
                  required
                  value={formData.case_number}
                  onChange={handleInputChange}
                  className="w-full px-4 py-3 border border-gray-300 rounded-lg focus:ring-2 focus:ring-blue-500 focus:border-transparent"
                  placeholder="Например: 1234567"
                />
              </div>

              {/* Case Title */}
              <div>
                <label htmlFor="title" className="block text-sm font-medium text-gray-700 mb-2">
                  * Краткое описание
                </label>
                <input
                  id="title"
                  name="title"
                  type="text"
                  required
                  value={formData.title}
                  onChange={handleInputChange}
                  className="w-full px-4 py-3 border border-gray-300 rounded-lg focus:ring-2 focus:ring-blue-500 focus:border-transparent"
                  placeholder='Например: "УД в отношении Петрова по ст. 159 УК"'
                />
                <p className="mt-1 text-sm text-gray-500">
                  Краткое описание дела для быстрой идентификации
                </p>
              </div>

              {/* Article */}
              <div>
                <label htmlFor="article" className="block text-sm font-medium text-gray-700 mb-2">
                  Статья обвинения
                </label>
                <input
                  id="article"
                  name="article"
                  type="text"
                  value={formData.article}
                  onChange={handleInputChange}
                  className="w-full px-4 py-3 border border-gray-300 rounded-lg focus:ring-2 focus:ring-blue-500 focus:border-transparent"
                  placeholder="Например: ч.4 ст. 159 УК РФ"
                />
              </div>

              {/* Defendant Name */}
              <div>
                <label htmlFor="defendant_name" className="block text-sm font-medium text-gray-700 mb-2">
                  Подсудимый (ФИО)
                </label>
                <input
                  id="defendant_name"
                  name="defendant_name"
                  type="text"
                  value={formData.defendant_name}
                  onChange={handleInputChange}
                  className="w-full px-4 py-3 border border-gray-300 rounded-lg focus:ring-2 focus:ring-blue-500 focus:border-transparent"
                  placeholder="Иванов Иван Иванович"
                />
              </div>

              {/* Investigation Organ */}
              <div>
                <label htmlFor="investigation_organ" className="block text-sm font-medium text-gray-700 mb-2">
                  Следственный орган
                </label>
                <select
                  id="investigation_organ"
                  name="investigation_organ"
                  value={formData.investigation_organ}
                  onChange={handleInputChange}
                  className="w-full px-4 py-3 border border-gray-300 rounded-lg focus:ring-2 focus:ring-blue-500 focus:border-transparent"
                >
                  <option value="СК РФ">СК РФ</option>
                  <option value="МВД РФ">МВД РФ</option>
                  <option value="ФСБ РФ">ФСБ РФ</option>
                  <option value="Прокуратура РФ">Прокуратура РФ</option>
                  <option value="Другое">Другое</option>
                </select>
              </div>

              {/* Initiation Date */}
              <div>
                <label htmlFor="initiation_date" className="block text-sm font-medium text-gray-700 mb-2">
                  Дата возбуждения дела
                </label>
                <input
                  id="initiation_date"
                  name="initiation_date"
                  type="date"
                  value={formData.initiation_date}
                  onChange={handleInputChange}
                  className="w-full px-4 py-3 border border-gray-300 rounded-lg focus:ring-2 focus:ring-blue-500 focus:border-transparent"
                />
              </div>

              {/* Notes */}
              <div>
                <label htmlFor="notes" className="block text-sm font-medium text-gray-700 mb-2">
                  Примечания (опционально)
                </label>
                <textarea
                  id="notes"
                  name="notes"
                  rows={3}
                  value={formData.notes}
                  onChange={handleInputChange}
                  className="w-full px-4 py-3 border border-gray-300 rounded-lg focus:ring-2 focus:ring-blue-500 focus:border-transparent"
                  placeholder="Дополнительная информация о деле"
                />
              </div>

              {/* Form Actions */}
              <div className="flex items-center justify-between pt-6 border-t border-gray-200">
                <button
                  type="button"
                  onClick={() => navigate('/')}
                  className="px-6 py-3 border border-gray-300 text-gray-700 rounded-lg hover: transition-colors font-medium"
                >
                  Отмена
                </button>
                <button
                  type="submit"
                  disabled={isSubmitting}
                  className="px-6 py-3 bg-blue-600 text-white rounded-lg hover:bg-blue-700 disabled:bg-gray-400 transition-colors font-medium flex items-center"
                >
                  {isSubmitting ? 'Создание...' : 'Далее'}
                  <svg className="w-5 h-5 ml-2" fill="none" stroke="currentColor" viewBox="0 0 24 24">
                    <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M9 5l7 7-7 7" />
                  </svg>
                </button>
              </div>
            </form>
          </div>
        )}

        {/* Step 2: Volumes Upload */}
        {step === 2 && (
          <div className="space-y-6">
            {/* Upload Method Selection */}
            <div className="bg-white rounded-xl shadow-sm p-8">
              <h3 className="text-xl font-semibold text-gray-900 mb-4">
                Выберите способ загрузки томов:
              </h3>

              <div className="space-y-3">
                <label className="flex items-center p-4 border-2 border-blue-500 bg-blue-50 rounded-lg cursor-pointer transition-colors">
                  <input
                    type="radio"
                    name="upload_method"
                    value="local"
                    className="w-5 h-5 text-blue-600"
                    checked={uploadMethod === 'local'}
                    onChange={() => setUploadMethod('local')}
                  />
                  <div className="ml-4">
                    <div className="font-medium text-gray-900">Загрузить файлы с компьютера</div>
                    <div className="text-sm text-gray-600">Выберите PDF файлы томов на вашем компьютере</div>
                  </div>
                </label>

                <label className="flex items-center p-4 border-2 border-gray-200 rounded-lg hover:border-blue-500 cursor-pointer transition-colors">
                  <input
                    type="radio"
                    name="upload_method"
                    value="gdrive"
                    className="w-5 h-5 text-blue-600"
                    checked={uploadMethod === 'gdrive'}
                    onChange={() => setUploadMethod('gdrive')}
                  />
                  <div className="ml-4">
                    <div className="font-medium text-gray-900">По ссылке на Google Drive</div>
                    <div className="text-sm text-gray-600">Вставьте публичную ссылку на папку с томами</div>
                  </div>
                </label>
              </div>
            </div>

            {/* Upload Content */}
            {uploadMethod === 'local' && (
              <div className="bg-white rounded-xl shadow-sm p-8">
                <h4 className="font-medium text-gray-900 mb-4">Выберите файлы томов</h4>

                <div className="border-2 border-dashed border-gray-300 rounded-lg p-8 text-center hover:border-blue-500 transition-colors">
                  <input
                    type="file"
                    multiple
                    accept=".pdf"
                    onChange={handleFileSelect}
                    className="hidden"
                    id="file-upload"
                  />
                  <label htmlFor="file-upload" className="cursor-pointer">
                    <svg className="w-12 h-12 text-gray-400 mx-auto mb-4" fill="none" stroke="currentColor" viewBox="0 0 24 24">
                      <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M7 16a4 4 0 01-.88-7.903A5 5 0 1115.9 6L16 6a5 5 0 011 9.9M15 13l-3-3m0 0l-3 3m3-3v12" />
                    </svg>
                    <p className="text-lg font-medium text-gray-700 mb-2">
                      Нажмите для выбора файлов
                    </p>
                    <p className="text-sm text-gray-500">
                      или перетащите PDF файлы сюда
                    </p>
                  </label>
                </div>

                {selectedFiles.length > 0 && (
                  <div className="mt-4">
                    <p className="text-sm font-medium text-gray-700 mb-2">
                      Выбрано файлов: {selectedFiles.length}
                    </p>
                    <div className="max-h-40 overflow-y-auto space-y-1">
                      {selectedFiles.map((file, index) => (
                        <div key={index} className="text-sm text-gray-600 flex items-center">
                          <svg className="w-4 h-4 text-blue-600 mr-2" fill="currentColor" viewBox="0 0 20 20">
                            <path fillRule="evenodd" d="M4 4a2 2 0 012-2h4.586A2 2 0 0112 2.586L15.414 6A2 2 0 0116 7.414V16a2 2 0 01-2 2H6a2 2 0 01-2-2V4z" clipRule="evenodd" />
                          </svg>
                          {file.name} ({(file.size / 1024 / 1024).toFixed(2)} МБ)
                        </div>
                      ))}
                    </div>
                  </div>
                )}

                <div className="mt-6 bg-blue-50 border border-blue-200 rounded-lg p-4">
                  <p className="text-sm text-blue-900 font-medium mb-2">Требования к файлам:</p>
                  <ul className="text-sm text-blue-800 space-y-1">
                    <li>• Формат: PDF</li>
                    <li>• Максимальный размер: 500 МБ на файл</li>
                    <li>• Рекомендуемое название: "Том 001.pdf", "Том 002.pdf" и т.д.</li>
                  </ul>
                </div>
              </div>
            )}

            {uploadMethod === 'gdrive' && (
              <div className="bg-white rounded-xl shadow-sm p-8">
                <h4 className="font-medium text-gray-900 mb-4">Публичная ссылка на папку Google Drive</h4>

                <div className="space-y-4">
                  <div>
                    <label htmlFor="gdrive-link" className="block text-sm font-medium text-gray-700 mb-2">
                      Ссылка на папку
                    </label>
                    <input
                      type="text"
                      id="gdrive-link"
                      value={gdriveLink}
                      onChange={(e) => setGdriveLink(e.target.value)}
                      placeholder="https://drive.google.com/drive/folders/..."
                      className="w-full px-4 py-3 border border-gray-300 rounded-lg focus:ring-2 focus:ring-blue-500 focus:border-transparent"
                    />
                  </div>

                  <div className="bg-yellow-50 border border-yellow-200 rounded-lg p-4">
                    <p className="text-sm text-yellow-900 font-medium mb-2">Как получить публичную ссылку:</p>
                    <ol className="text-sm text-yellow-800 space-y-1 list-decimal list-inside">
                      <li>Откройте папку с томами в Google Drive</li>
                      <li>Нажмите правой кнопкой → "Настройки доступа"</li>
                      <li>Выберите "Доступно всем, у кого есть ссылка"</li>
                      <li>Скопируйте ссылку и вставьте её выше</li>
                    </ol>
                  </div>

                  <div className="bg-blue-50 border border-blue-200 rounded-lg p-4">
                    <p className="text-sm text-blue-900 font-medium mb-2">Требования к файлам в папке:</p>
                    <ul className="text-sm text-blue-800 space-y-1">
                      <li>• Формат: только PDF файлы</li>
                      <li>• Максимальный размер: 500 МБ на файл</li>
                      <li>• Будут загружены все PDF файлы из папки</li>
                    </ul>
                  </div>
                </div>
              </div>
            )}

            {/* Form Actions */}
            <div className="flex items-center justify-between">
              <button
                type="button"
                onClick={() => setStep(1)}
                className="px-6 py-3 border border-gray-300 text-gray-700 rounded-lg hover: transition-colors font-medium"
              >
                Назад
              </button>
              <div className="flex space-x-3">
                <button
                  type="button"
                  onClick={handleSkipUpload}
                  className="px-6 py-3 border border-gray-300 text-gray-700 rounded-lg hover: transition-colors font-medium"
                >
                  Пропустить
                </button>
                <button
                  type="button"
                  onClick={handleUploadFiles}
                  disabled={isSubmitting || (uploadMethod === 'local' && selectedFiles.length === 0) || (uploadMethod === 'gdrive' && !gdriveLink)}
                  className="px-6 py-3 bg-blue-600 text-white rounded-lg hover:bg-blue-700 disabled:bg-gray-400 transition-colors font-medium"
                >
                  {isSubmitting ? 'Загрузка...' : 'Загрузить тома'}
                </button>
              </div>
            </div>
          </div>
        )}
      </main>
    </div>
  )
}
