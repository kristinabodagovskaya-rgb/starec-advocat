import { useState } from 'react'
import { useParams, useNavigate } from 'react-router-dom'

export default function StrategyPage() {
  const { id } = useParams()
  const navigate = useNavigate()
  const [isGenerating, setIsGenerating] = useState(false)
  const [strategy, setStrategy] = useState<any>(null)

  const generateStrategy = async () => {
    setIsGenerating(true)
    try {
      const token = localStorage.getItem('token')
      const response = await fetch(`/api/cases/${id}/strategy`, {
        method: 'POST',
        headers: { 'Authorization': `Bearer ${token}` }
      })

      if (response.ok) {
        const data = await response.json()
        setStrategy(data)
      }
    } catch (error) {
      console.error('Failed to generate strategy:', error)
    } finally {
      setIsGenerating(false)
    }
  }

  return (
    <div className="min-h-screen ">
      <header className="bg-white shadow-sm border-b border-gray-200">
        <div className="max-w-7xl mx-auto px-4 sm:px-6 lg:px-8 py-4">
          <button
            onClick={() => navigate(`/cases/${id}`)}
            className="flex items-center text-gray-600 hover:text-gray-900 transition-colors mb-4"
          >
            <svg className="w-5 h-5 mr-2" fill="none" stroke="currentColor" viewBox="0 0 24 24">
              <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M15 19l-7-7 7-7" />
            </svg>
            Назад к делу
          </button>
          <div className="flex items-center justify-between">
            <h1 className="text-2xl font-bold text-gray-900">Стратегия защиты</h1>
            {strategy && (
              <div className="flex space-x-2">
                <button className="px-4 py-2 border border-gray-300 text-gray-700 rounded-lg hover: transition-colors flex items-center">
                  <svg className="w-4 h-4 mr-2" fill="none" stroke="currentColor" viewBox="0 0 24 24">
                    <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M4 16v1a3 3 0 003 3h10a3 3 0 003-3v-1m-4-4l-4 4m0 0l-4-4m4 4V4" />
                  </svg>
                  Экспорт DOCX
                </button>
                <button className="px-4 py-2 border border-gray-300 text-gray-700 rounded-lg hover: transition-colors flex items-center">
                  <svg className="w-4 h-4 mr-2" fill="none" stroke="currentColor" viewBox="0 0 24 24">
                    <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M4 16v1a3 3 0 003 3h10a3 3 0 003-3v-1m-4-4l-4 4m0 0l-4-4m4 4V4" />
                  </svg>
                  Экспорт PDF
                </button>
              </div>
            )}
          </div>
        </div>
      </header>

      <main className="max-w-7xl mx-auto px-4 sm:px-6 lg:px-8 py-8">
        {!strategy ? (
          <div className="bg-gradient-to-br from-yellow-50 to-orange-50 rounded-2xl p-12 text-center">
            <div className="w-24 h-24 bg-white rounded-2xl shadow-lg mx-auto mb-6 flex items-center justify-center">
              <svg className="w-12 h-12 text-yellow-600" fill="none" stroke="currentColor" viewBox="0 0 24 24">
                <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M9 5H7a2 2 0 00-2 2v12a2 2 0 002 2h10a2 2 0 002-2V7a2 2 0 00-2-2h-2M9 5a2 2 0 002 2h2a2 2 0 002-2M9 5a2 2 0 012-2h2a2 2 0 012 2m-3 7h3m-3 4h3m-6-4h.01M9 16h.01" />
              </svg>
            </div>
            <h2 className="text-3xl font-bold text-gray-900 mb-4">Генерация стратегии защиты</h2>
            <p className="text-gray-600 mb-8 max-w-2xl mx-auto">
              На основе анализа дела искусственный интеллект создаст детальную стратегию защиты
              с процессуальными возражениями, тактическим планом и рекомендациями.
            </p>

            <div className="grid grid-cols-1 md:grid-cols-2 gap-6 mb-8 max-w-3xl mx-auto">
              <div className="bg-white rounded-xl p-6 shadow-sm text-left">
                <div className="flex items-start">
                  <div className="w-10 h-10 bg-yellow-100 rounded-lg mr-4 flex items-center justify-center flex-shrink-0">
                    <svg className="w-5 h-5 text-yellow-600" fill="none" stroke="currentColor" viewBox="0 0 24 24">
                      <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M12 9v2m0 4h.01m-6.938 4h13.856c1.54 0 2.502-1.667 1.732-3L13.732 4c-.77-1.333-2.694-1.333-3.464 0L3.34 16c-.77 1.333.192 3 1.732 3z" />
                    </svg>
                  </div>
                  <div>
                    <h3 className="font-semibold text-gray-900 mb-2">Процессуальные нарушения</h3>
                    <p className="text-sm text-gray-600">Детальный анализ нарушений с ссылками на законодательство</p>
                  </div>
                </div>
              </div>

              <div className="bg-white rounded-xl p-6 shadow-sm text-left">
                <div className="flex items-start">
                  <div className="w-10 h-10 bg-blue-100 rounded-lg mr-4 flex items-center justify-center flex-shrink-0">
                    <svg className="w-5 h-5 text-blue-600" fill="none" stroke="currentColor" viewBox="0 0 24 24">
                      <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M9 5H7a2 2 0 00-2 2v12a2 2 0 002 2h10a2 2 0 002-2V7a2 2 0 00-2-2h-2M9 5a2 2 0 002 2h2a2 2 0 002-2M9 5a2 2 0 012-2h2a2 2 0 012 2m-6 9l2 2 4-4" />
                    </svg>
                  </div>
                  <div>
                    <h3 className="font-semibold text-gray-900 mb-2">Тактический план</h3>
                    <p className="text-sm text-gray-600">Пошаговый план действий на разных стадиях процесса</p>
                  </div>
                </div>
              </div>

              <div className="bg-white rounded-xl p-6 shadow-sm text-left">
                <div className="flex items-start">
                  <div className="w-10 h-10 bg-green-100 rounded-lg mr-4 flex items-center justify-center flex-shrink-0">
                    <svg className="w-5 h-5 text-green-600" fill="none" stroke="currentColor" viewBox="0 0 24 24">
                      <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M9 12l2 2 4-4m6 2a9 9 0 11-18 0 9 9 0 0118 0z" />
                    </svg>
                  </div>
                  <div>
                    <h3 className="font-semibold text-gray-900 mb-2">Линии защиты</h3>
                    <p className="text-sm text-gray-600">Основные и альтернативные направления защиты</p>
                  </div>
                </div>
              </div>

              <div className="bg-white rounded-xl p-6 shadow-sm text-left">
                <div className="flex items-start">
                  <div className="w-10 h-10 bg-purple-100 rounded-lg mr-4 flex items-center justify-center flex-shrink-0">
                    <svg className="w-5 h-5 text-purple-600" fill="none" stroke="currentColor" viewBox="0 0 24 24">
                      <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M9 12h6m-6 4h6m2 5H7a2 2 0 01-2-2V5a2 2 0 012-2h5.586a1 1 0 01.707.293l5.414 5.414a1 1 0 01.293.707V19a2 2 0 01-2 2z" />
                    </svg>
                  </div>
                  <div>
                    <h3 className="font-semibold text-gray-900 mb-2">Готовые документы</h3>
                    <p className="text-sm text-gray-600">Шаблоны жалоб, ходатайств и возражений</p>
                  </div>
                </div>
              </div>
            </div>

            {isGenerating ? (
              <div className="space-y-4">
                <div className="animate-spin rounded-full h-16 w-16 border-b-4 border-yellow-600 mx-auto"></div>
                <p className="text-gray-600 font-medium">Генерируем стратегию защиты...</p>
                <p className="text-sm text-gray-500">Анализируем данные и формируем рекомендации</p>
              </div>
            ) : (
              <button
                onClick={generateStrategy}
                className="px-8 py-4 bg-yellow-600 text-white rounded-xl hover:bg-yellow-700 transition-colors font-medium text-lg shadow-lg hover:shadow-xl"
              >
                Сгенерировать стратегию защиты
              </button>
            )}
          </div>
        ) : (
          <div className="bg-white rounded-xl shadow-sm">
            {/* Strategy Content */}
            <div className="p-8 border-b border-gray-200">
              <div className="flex items-center justify-between mb-6">
                <div>
                  <span className="px-3 py-1 bg-green-100 text-green-800 rounded-lg text-sm font-medium">
                    Версия 1.0
                  </span>
                  <p className="text-sm text-gray-500 mt-2">Сгенерировано {new Date().toLocaleString('ru-RU')}</p>
                </div>
                <button className="px-4 py-2 bg-yellow-600 text-white rounded-lg hover:bg-yellow-700 transition-colors">
                  Редактировать
                </button>
              </div>

              <h2 className="text-2xl font-bold text-gray-900 mb-6">Стратегия защиты</h2>

              {/* Introduction */}
              <div className="prose max-w-none mb-8">
                <h3 className="text-xl font-semibold text-gray-900 mb-4">Введение</h3>
                <p className="text-gray-700 leading-relaxed">
                  Настоящая стратегия защиты разработана на основе детального анализа материалов уголовного дела
                  с применением технологий искусственного интеллекта. Стратегия включает выявленные процессуальные
                  нарушения, оценку доказательств и рекомендации по тактике защиты.
                </p>
              </div>

              {/* Main Violations */}
              <div className="mb-8">
                <h3 className="text-xl font-semibold text-gray-900 mb-4">1. Процессуальные нарушения</h3>
                <div className="bg-red-50 border border-red-200 rounded-lg p-6">
                  <p className="text-gray-700">Детальный анализ нарушений будет доступен после полной обработки дела.</p>
                </div>
              </div>

              {/* Defense Lines */}
              <div className="mb-8">
                <h3 className="text-xl font-semibold text-gray-900 mb-4">2. Линии защиты</h3>
                <div className="bg-blue-50 border border-blue-200 rounded-lg p-6">
                  <p className="text-gray-700">Основные направления защиты будут сформированы на основе анализа.</p>
                </div>
              </div>

              {/* Tactical Plan */}
              <div className="mb-8">
                <h3 className="text-xl font-semibold text-gray-900 mb-4">3. Тактический план</h3>
                <div className="bg-green-50 border border-green-200 rounded-lg p-6">
                  <p className="text-gray-700">Пошаговый план действий будет доступен после завершения анализа.</p>
                </div>
              </div>
            </div>

            {/* Action Bar */}
            <div className="p-6 ">
              <div className="flex items-center justify-between">
                <button className="text-gray-600 hover:text-gray-900 transition-colors font-medium">
                  ← Предыдущая версия
                </button>
                <button
                  onClick={generateStrategy}
                  className="px-6 py-3 bg-yellow-600 text-white rounded-lg hover:bg-yellow-700 transition-colors font-medium"
                >
                  Обновить стратегию
                </button>
              </div>
            </div>
          </div>
        )}
      </main>
    </div>
  )
}
