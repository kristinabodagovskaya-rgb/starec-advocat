import { useState, useEffect } from 'react'
import { useNavigate } from 'react-router-dom'

interface Case {
  id: number
  case_number: string
  title: string
  article: string
  defendant_name: string
  volumes_count: number
  documents_count: number
  processing_progress: number
  status: 'active' | 'processing' | 'completed' | 'archived'
  created_at: string
  updated_at: string
}

export default function DashboardPage() {
  const navigate = useNavigate()
  const [cases, setCases] = useState<Case[]>([])
  const [isLoading, setIsLoading] = useState(true)
  const [showArchived, setShowArchived] = useState(false)

  useEffect(() => {
    loadCases()
  }, [])

  const loadCases = async () => {
    try {
      const token = localStorage.getItem('token')
      const response = await fetch('/api/cases', {
        headers: {
          'Authorization': `Bearer ${token}`
        }
      })

      if (response.ok) {
        const data = await response.json()
        setCases(data)
      } else {
        // Load demo cases if API fails
        loadDemoCases()
      }
    } catch (error) {
      console.error('Failed to load cases:', error)
      // Load demo cases on error
      loadDemoCases()
    } finally {
      setIsLoading(false)
    }
  }

  const loadDemoCases = () => {
    // Check for any cases created in session
    const sessionCases: Case[] = []

    for (let i = 0; i < sessionStorage.length; i++) {
      const key = sessionStorage.key(i)
      if (key && key.startsWith('case_')) {
        try {
          const caseData = JSON.parse(sessionStorage.getItem(key) || '{}')
          const caseId = parseInt(key.replace('case_', ''))
          sessionCases.push({
            id: caseId,
            case_number: caseData.case_number,
            title: caseData.title,
            article: caseData.article,
            defendant_name: caseData.defendant_name,
            volumes_count: 0,
            documents_count: 0,
            processing_progress: 0,
            status: 'active',
            created_at: new Date().toISOString(),
            updated_at: new Date().toISOString(),
          })
        } catch (e) {
          console.error('Failed to parse case data:', e)
        }
      }
    }

    // Add some demo cases for demonstration
    if (sessionCases.length === 0) {
      setCases([
        {
          id: 1,
          case_number: '1234567',
          title: 'УД в отношении Петрова А.В. по ст. 159 УК РФ',
          article: 'ч.4 ст. 159 УК РФ',
          defendant_name: 'Петров Алексей Владимирович',
          volumes_count: 216,
          documents_count: 1847,
          processing_progress: 98,
          status: 'active',
          created_at: '2026-01-18T10:00:00Z',
          updated_at: '2026-01-18T15:30:00Z',
        },
        {
          id: 2,
          case_number: '8765432',
          title: 'УД по ст. 228 УК РФ',
          article: 'ч.1 ст. 228 УК РФ',
          defendant_name: 'Иванов Иван Иванович',
          volumes_count: 45,
          documents_count: 523,
          processing_progress: 100,
          status: 'completed',
          created_at: '2026-01-15T10:00:00Z',
          updated_at: '2026-01-15T15:30:00Z',
        },
      ])
    } else {
      setCases(sessionCases)
    }
  }

  const handleCreateCase = () => {
    navigate('/cases/new')
  }

  const handleOpenCase = (caseId: number) => {
    navigate(`/cases/${caseId}`)
  }

  const handleLogout = () => {
    localStorage.removeItem('token')
    navigate('/login')
  }

  const activeCases = cases.filter(c => c.status !== 'archived')
  const archivedCases = cases.filter(c => c.status === 'archived')

  const getStatusBadge = (status: string) => {
    const styles = {
      active: 'bg-green-100 text-green-800',
      processing: 'bg-yellow-100 text-yellow-800',
      completed: 'bg-blue-100 text-blue-800',
      archived: 'bg-gray-100 text-gray-800',
    }
    const labels = {
      active: 'Активно',
      processing: 'Обработка',
      completed: 'Завершено',
      archived: 'Архив',
    }
    return (
      <span className={`px-2 py-1 rounded-full text-xs font-medium ${styles[status as keyof typeof styles]}`}>
        {labels[status as keyof typeof labels]}
      </span>
    )
  }

  if (isLoading) {
    return (
      <div className="min-h-screen bg-gray-50 flex items-center justify-center">
        <div className="text-center">
          <div className="animate-spin rounded-full h-12 w-12 border-b-2 border-blue-600 mx-auto"></div>
          <p className="mt-4 text-gray-600">Загрузка...</p>
        </div>
      </div>
    )
  }

  return (
    <div className="min-h-screen bg-gray-50">
      {/* Header */}
      <header className="bg-white shadow-sm border-b border-gray-200">
        <div className="max-w-7xl mx-auto px-4 sm:px-6 lg:px-8 py-4">
          <div className="flex items-center justify-between">
            <div className="flex items-center space-x-4">
              <button className="p-2 hover:bg-gray-100 rounded-lg">
                <svg className="w-6 h-6 text-gray-600" fill="none" stroke="currentColor" viewBox="0 0 24 24">
                  <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M4 6h16M4 12h16M4 18h16" />
                </svg>
              </button>
              <h1 className="text-2xl font-bold text-gray-900">STAREC ADVOCAT</h1>
            </div>
            <div className="flex items-center space-x-4">
              <button className="p-2 hover:bg-gray-100 rounded-lg relative">
                <svg className="w-6 h-6 text-gray-600" fill="none" stroke="currentColor" viewBox="0 0 24 24">
                  <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M15 17h5l-1.405-1.405A2.032 2.032 0 0118 14.158V11a6.002 6.002 0 00-4-5.659V5a2 2 0 10-4 0v.341C7.67 6.165 6 8.388 6 11v3.159c0 .538-.214 1.055-.595 1.436L4 17h5m6 0v1a3 3 0 11-6 0v-1m6 0H9" />
                </svg>
                <span className="absolute top-1 right-1 block h-2 w-2 rounded-full bg-red-500"></span>
              </button>
              <div className="flex items-center space-x-2">
                <div className="w-8 h-8 bg-blue-600 rounded-full flex items-center justify-center text-white font-medium">
                  А
                </div>
                <span className="text-sm font-medium text-gray-700">Адвокат</span>
              </div>
              <button
                onClick={handleLogout}
                className="px-4 py-2 text-sm font-medium text-gray-700 hover:bg-gray-100 rounded-lg transition-colors"
              >
                Выход
              </button>
            </div>
          </div>
        </div>
      </header>

      {/* Main Content */}
      <main className="max-w-7xl mx-auto px-4 sm:px-6 lg:px-8 py-8">
        {/* Page Title */}
        <div className="mb-6">
          <h2 className="text-3xl font-bold text-gray-900 flex items-center">
            <svg className="w-8 h-8 mr-3 text-blue-600" fill="none" stroke="currentColor" viewBox="0 0 24 24">
              <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M9 19v-6a2 2 0 00-2-2H5a2 2 0 00-2 2v6a2 2 0 002 2h2a2 2 0 002-2zm0 0V9a2 2 0 012-2h2a2 2 0 012 2v10m-6 0a2 2 0 002 2h2a2 2 0 002-2m0 0V5a2 2 0 012-2h2a2 2 0 012 2v14a2 2 0 01-2 2h-2a2 2 0 01-2-2z" />
            </svg>
            МОИ ДЕЛА
          </h2>
        </div>

        {/* Create New Case Button */}
        <button
          onClick={handleCreateCase}
          className="w-full mb-6 bg-blue-600 hover:bg-blue-700 text-white px-6 py-4 rounded-xl font-medium text-lg flex items-center justify-center transition-colors shadow-md hover:shadow-lg"
        >
          <svg className="w-6 h-6 mr-2" fill="none" stroke="currentColor" viewBox="0 0 24 24">
            <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M12 4v16m8-8H4" />
          </svg>
          СОЗДАТЬ НОВОЕ ДЕЛО
        </button>

        {/* Active Cases */}
        <div className="mb-8">
          <h3 className="text-xl font-semibold text-gray-900 mb-4">
            Активные дела ({activeCases.length})
          </h3>

          {activeCases.length === 0 ? (
            <div className="bg-white rounded-xl p-12 text-center shadow-sm">
              <svg className="w-16 h-16 text-gray-400 mx-auto mb-4" fill="none" stroke="currentColor" viewBox="0 0 24 24">
                <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M9 12h6m-6 4h6m2 5H7a2 2 0 01-2-2V5a2 2 0 012-2h5.586a1 1 0 01.707.293l5.414 5.414a1 1 0 01.293.707V19a2 2 0 01-2 2z" />
              </svg>
              <p className="text-gray-600 mb-4">У вас пока нет активных дел</p>
              <button
                onClick={handleCreateCase}
                className="text-blue-600 hover:text-blue-700 font-medium"
              >
                Создать первое дело →
              </button>
            </div>
          ) : (
            <div className="space-y-4">
              {activeCases.map((caseItem) => (
                <div
                  key={caseItem.id}
                  className="bg-white rounded-xl p-6 shadow-sm hover:shadow-md transition-shadow border border-gray-100"
                >
                  <div className="flex items-start justify-between mb-4">
                    <div className="flex-1">
                      <div className="flex items-center space-x-3 mb-2">
                        <svg className="w-6 h-6 text-blue-600" fill="none" stroke="currentColor" viewBox="0 0 24 24">
                          <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M3 7v10a2 2 0 002 2h14a2 2 0 002-2V9a2 2 0 00-2-2h-6l-2-2H5a2 2 0 00-2 2z" />
                        </svg>
                        <h4 className="text-lg font-semibold text-gray-900">
                          Дело № {caseItem.case_number}
                        </h4>
                        {getStatusBadge(caseItem.status)}
                      </div>
                      <p className="text-gray-700 mb-2">{caseItem.title}</p>
                      <p className="text-sm text-gray-500">
                        {caseItem.article && `${caseItem.article} | `}
                        {caseItem.defendant_name && `Подзащитный: ${caseItem.defendant_name}`}
                      </p>
                    </div>
                  </div>

                  {/* Stats */}
                  <div className="grid grid-cols-3 gap-4 mb-4 py-3 border-y border-gray-100">
                    <div>
                      <p className="text-sm text-gray-500">Томов</p>
                      <p className="text-xl font-semibold text-gray-900">{caseItem.volumes_count || 0}</p>
                    </div>
                    <div>
                      <p className="text-sm text-gray-500">Документов</p>
                      <p className="text-xl font-semibold text-gray-900">{caseItem.documents_count || 0}</p>
                    </div>
                    <div>
                      <p className="text-sm text-gray-500">Обработано</p>
                      <div className="flex items-center space-x-2">
                        <div className="flex-1 bg-gray-200 rounded-full h-2">
                          <div
                            className="bg-blue-600 h-2 rounded-full transition-all"
                            style={{ width: `${caseItem.processing_progress || 0}%` }}
                          ></div>
                        </div>
                        <p className="text-sm font-semibold text-gray-900">{caseItem.processing_progress || 0}%</p>
                      </div>
                    </div>
                  </div>

                  {/* Footer */}
                  <div className="flex items-center justify-between">
                    <p className="text-sm text-gray-500">
                      Обновлено: {new Date(caseItem.updated_at).toLocaleDateString('ru-RU')}
                    </p>
                    <div className="flex space-x-2">
                      <button
                        onClick={() => handleOpenCase(caseItem.id)}
                        className="px-4 py-2 bg-blue-600 hover:bg-blue-700 text-white rounded-lg text-sm font-medium transition-colors"
                      >
                        Открыть дело
                      </button>
                      {caseItem.processing_progress < 100 && (
                        <button className="px-4 py-2 bg-green-600 hover:bg-green-700 text-white rounded-lg text-sm font-medium transition-colors">
                          Продолжить анализ
                        </button>
                      )}
                      {caseItem.processing_progress === 100 && (
                        <button className="px-4 py-2 bg-purple-600 hover:bg-purple-700 text-white rounded-lg text-sm font-medium transition-colors">
                          Экспорт стратегии
                        </button>
                      )}
                    </div>
                  </div>
                </div>
              ))}
            </div>
          )}
        </div>

        {/* Archived Cases Toggle */}
        {archivedCases.length > 0 && (
          <div>
            <button
              onClick={() => setShowArchived(!showArchived)}
              className="flex items-center space-x-2 text-gray-700 hover:text-gray-900 font-medium mb-4"
            >
              <span>Архивные дела ({archivedCases.length})</span>
              <svg
                className={`w-5 h-5 transition-transform ${showArchived ? 'rotate-180' : ''}`}
                fill="none"
                stroke="currentColor"
                viewBox="0 0 24 24"
              >
                <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M19 9l-7 7-7-7" />
              </svg>
            </button>

            {showArchived && (
              <div className="space-y-4">
                {archivedCases.map((caseItem) => (
                  <div
                    key={caseItem.id}
                    className="bg-white rounded-xl p-6 shadow-sm border border-gray-100 opacity-75"
                  >
                    {/* Similar structure to active cases but simplified */}
                    <div className="flex items-center justify-between">
                      <div>
                        <h4 className="text-lg font-semibold text-gray-700 mb-1">
                          Дело № {caseItem.case_number}
                        </h4>
                        <p className="text-sm text-gray-600">{caseItem.title}</p>
                      </div>
                      <button
                        onClick={() => handleOpenCase(caseItem.id)}
                        className="px-4 py-2 bg-gray-200 hover:bg-gray-300 text-gray-700 rounded-lg text-sm font-medium transition-colors"
                      >
                        Открыть
                      </button>
                    </div>
                  </div>
                ))}
              </div>
            )}
          </div>
        )}
      </main>
    </div>
  )
}
