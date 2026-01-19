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

  const handleVolumesUpload = () => {
    const caseId = sessionStorage.getItem('newCaseId')
    if (caseId) {
      sessionStorage.removeItem('newCaseId')
      navigate(`/cases/${caseId}`)
    }
  }

  return (
    <div className="min-h-screen bg-gray-50">
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
                  className="px-6 py-3 border border-gray-300 text-gray-700 rounded-lg hover:bg-gray-50 transition-colors font-medium"
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
                <label className="flex items-center p-4 border-2 border-gray-200 rounded-lg hover:border-blue-500 cursor-pointer transition-colors">
                  <input type="radio" name="upload_method" value="gdrive" className="w-5 h-5 text-blue-600" defaultChecked />
                  <div className="ml-4">
                    <div className="font-medium text-gray-900">Из Google Drive</div>
                    <div className="text-sm text-gray-500">Подключите папку с томами из Google Drive</div>
                  </div>
                </label>

                <label className="flex items-center p-4 border-2 border-gray-200 rounded-lg hover:border-blue-500 cursor-pointer transition-colors opacity-50">
                  <input type="radio" name="upload_method" value="local" className="w-5 h-5 text-blue-600" disabled />
                  <div className="ml-4">
                    <div className="font-medium text-gray-900">Загрузить файлы с компьютера</div>
                    <div className="text-sm text-gray-500">Скоро будет доступно</div>
                  </div>
                </label>

                <label className="flex items-center p-4 border-2 border-gray-200 rounded-lg hover:border-blue-500 cursor-pointer transition-colors opacity-50">
                  <input type="radio" name="upload_method" value="cloud" className="w-5 h-5 text-blue-600" disabled />
                  <div className="ml-4">
                    <div className="font-medium text-gray-900">Из облачного хранилища</div>
                    <div className="text-sm text-gray-500">Яндекс.Диск, Dropbox (скоро)</div>
                  </div>
                </label>
              </div>
            </div>

            {/* Google Drive Section */}
            <div className="bg-white rounded-xl shadow-sm p-8">
              <div className="flex items-center mb-6">
                <svg className="w-8 h-8 text-blue-600 mr-3" fill="currentColor" viewBox="0 0 24 24">
                  <path d="M12.01 1.485c-.206 0-.412.063-.59.19l-7.94 5.636c-.355.252-.563.66-.563 1.094v7.19c0 .434.208.842.563 1.094l7.94 5.636c.356.253.824.253 1.18 0l7.94-5.636c.355-.252.563-.66.563-1.094v-7.19c0-.434-.208-.842-.563-1.094L12.6 1.675c-.178-.127-.384-.19-.59-.19z"/>
                </svg>
                <h3 className="text-xl font-semibold text-gray-900">Google Drive</h3>
              </div>

              <div className="bg-blue-50 border border-blue-200 rounded-lg p-6 mb-6">
                <p className="text-blue-900 mb-4">
                  После подключения Google Drive вы сможете выбрать папку с томами дела.
                </p>
                <button className="w-full bg-blue-600 hover:bg-blue-700 text-white px-6 py-3 rounded-lg font-medium transition-colors flex items-center justify-center">
                  <svg className="w-5 h-5 mr-2" fill="currentColor" viewBox="0 0 24 24">
                    <path d="M12.01 1.485c-.206 0-.412.063-.59.19l-7.94 5.636c-.355.252-.563.66-.563 1.094v7.19c0 .434.208.842.563 1.094l7.94 5.636c.356.253.824.253 1.18 0l7.94-5.636c.355-.252.563-.66.563-1.094v-7.19c0-.434-.208-.842-.563-1.094L12.6 1.675c-.178-.127-.384-.19-.59-.19z"/>
                  </svg>
                  Подключить Google Drive
                </button>
              </div>

              {/* Requirements */}
              <div className="space-y-2">
                <h4 className="font-medium text-gray-900 mb-3">Требования к файлам:</h4>
                <div className="space-y-2 text-sm text-gray-600">
                  <div className="flex items-start">
                    <svg className="w-5 h-5 text-green-600 mr-2 flex-shrink-0 mt-0.5" fill="none" stroke="currentColor" viewBox="0 0 24 24">
                      <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M5 13l4 4L19 7" />
                    </svg>
                    <span>Формат: PDF (отсканированные или текстовые)</span>
                  </div>
                  <div className="flex items-start">
                    <svg className="w-5 h-5 text-green-600 mr-2 flex-shrink-0 mt-0.5" fill="none" stroke="currentColor" viewBox="0 0 24 24">
                      <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M5 13l4 4L19 7" />
                    </svg>
                    <span>Название файлов: "Том 001.pdf", "Том 002.pdf" и т.д.</span>
                  </div>
                  <div className="flex items-start">
                    <svg className="w-5 h-5 text-green-600 mr-2 flex-shrink-0 mt-0.5" fill="none" stroke="currentColor" viewBox="0 0 24 24">
                      <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M5 13l4 4L19 7" />
                    </svg>
                    <span>Максимальный размер одного тома: 500 МБ</span>
                  </div>
                  <div className="flex items-start">
                    <svg className="w-5 h-5 text-green-600 mr-2 flex-shrink-0 mt-0.5" fill="none" stroke="currentColor" viewBox="0 0 24 24">
                      <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M5 13l4 4L19 7" />
                    </svg>
                    <span>Поддерживается OCR для отсканированных документов</span>
                  </div>
                </div>
              </div>
            </div>

            {/* Form Actions */}
            <div className="flex items-center justify-between">
              <button
                type="button"
                onClick={() => setStep(1)}
                className="px-6 py-3 border border-gray-300 text-gray-700 rounded-lg hover:bg-gray-50 transition-colors font-medium"
              >
                Назад
              </button>
              <button
                type="button"
                onClick={handleVolumesUpload}
                className="px-6 py-3 bg-gray-200 text-gray-700 rounded-lg hover:bg-gray-300 transition-colors font-medium"
              >
                Пропустить (добавить тома позже)
              </button>
            </div>
          </div>
        )}
      </main>
    </div>
  )
}
