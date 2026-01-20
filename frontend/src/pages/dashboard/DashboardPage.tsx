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
      const response = await fetch('/api/cases/')

      if (response.ok) {
        const data = await response.json()
        setCases(data)
      } else {
        console.error('Failed to load cases:', response.status, response.statusText)
        setCases([])
      }
    } catch (error) {
      console.error('Failed to load cases:', error)
      setCases([])
    } finally {
      setIsLoading(false)
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

  const handleDeleteCase = async (caseId: number, caseNumber: string) => {
    if (!confirm(`Удалить дело № ${caseNumber}? Это действие нельзя отменить.`)) {
      return
    }

    try {
      const response = await fetch(`/api/cases/${caseId}`, {
        method: 'DELETE',
      })

      if (response.ok) {
        setCases(cases.filter(c => c.id !== caseId))
      } else {
        alert('Ошибка при удалении дела')
      }
    } catch (error) {
      console.error('Failed to delete case:', error)
      alert('Ошибка при удалении дела')
    }
  }

  const activeCases = cases.filter(c => c.status !== 'archived')
  const archivedCases = cases.filter(c => c.status === 'archived')

  const getStatusBadge = (status: string) => {
    const styles = {
      active: 'apple-badge-success',
      processing: 'apple-badge-warning',
      completed: 'apple-badge-info',
      archived: 'bg-[#86868b] text-white',
    }
    const labels = {
      active: 'Активно',
      processing: 'Обработка',
      completed: 'Завершено',
      archived: 'Архив',
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
          <div className="animate-spin rounded-full h-12 w-12 border-b-2 border-[#1d1d1f] mx-auto"></div>
          <p className="mt-4 text-[#6e6e73] text-center">Загрузка...</p>
        </div>
      </div>
    )
  }

  return (
    <div className="min-h-screen">
      {/* Header */}
      <header className="apple-header sticky top-0 z-10">
        <div className="max-w-7xl mx-auto px-4 sm:px-6 lg:px-8 py-4">
          <div className="flex items-center justify-between">
            <div className="flex items-center space-x-4">
              <h1 className="text-2xl font-semibold text-[#1d1d1f] tracking-tight">STAREC ADVOCAT</h1>
            </div>
            <div className="flex items-center space-x-4">
              <button className="p-2 hover:bg-black/5 rounded-xl transition-colors relative">
                <svg className="w-6 h-6 text-[#6e6e73]" fill="none" stroke="currentColor" viewBox="0 0 24 24">
                  <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M15 17h5l-1.405-1.405A2.032 2.032 0 0118 14.158V11a6.002 6.002 0 00-4-5.659V5a2 2 0 10-4 0v.341C7.67 6.165 6 8.388 6 11v3.159c0 .538-.214 1.055-.595 1.436L4 17h5m6 0v1a3 3 0 11-6 0v-1m6 0H9" />
                </svg>
                <span className="absolute top-1 right-1 block h-2 w-2 rounded-full bg-[#ff3b30]"></span>
              </button>
              <div className="flex items-center space-x-2">
                <div className="w-8 h-8 bg-[#1d1d1f] rounded-full flex items-center justify-center text-white font-medium">
                  А
                </div>
                <span className="text-sm font-medium text-[#1d1d1f]">Адвокат</span>
              </div>
              <button
                onClick={handleLogout}
                className="px-4 py-2 text-sm font-medium text-[#6e6e73] hover:text-[#1d1d1f] hover:bg-black/5 rounded-xl transition-colors"
              >
                Выход
              </button>
            </div>
          </div>
        </div>
      </header>

      {/* Main Content */}
      <main className="max-w-7xl mx-auto px-4 sm:px-6 lg:px-8 py-8 apple-animate-slideUp">
        {/* Page Title */}
        <div className="mb-6">
          <h2 className="text-3xl font-semibold text-[#1d1d1f] tracking-tight flex items-center">
            <svg className="w-8 h-8 mr-3 text-[#1d1d1f]" fill="none" stroke="currentColor" viewBox="0 0 24 24">
              <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M9 19v-6a2 2 0 00-2-2H5a2 2 0 00-2 2v6a2 2 0 002 2h2a2 2 0 002-2zm0 0V9a2 2 0 012-2h2a2 2 0 012 2v10m-6 0a2 2 0 002 2h2a2 2 0 002-2m0 0V5a2 2 0 012-2h2a2 2 0 012 2v14a2 2 0 01-2 2h-2a2 2 0 01-2-2z" />
            </svg>
            Мои дела
          </h2>
        </div>

        {/* Create New Case Button */}
        <button
          onClick={handleCreateCase}
          className="mb-8 apple-btn-primary flex items-center"
        >
          <svg className="w-4 h-4 mr-2" fill="none" stroke="currentColor" viewBox="0 0 24 24">
            <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M12 4v16m8-8H4" />
          </svg>
          <span>Создать дело</span>
        </button>

        {/* Active Cases */}
        <div className="mb-8">
          <h3 className="text-xl font-semibold text-[#1d1d1f] mb-4">
            Активные дела ({activeCases.length})
          </h3>

          {activeCases.length === 0 ? (
            <div className="apple-glass-card p-12 text-center">
              <svg className="w-16 h-16 text-[#86868b] mx-auto mb-4" fill="none" stroke="currentColor" viewBox="0 0 24 24">
                <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M9 12h6m-6 4h6m2 5H7a2 2 0 01-2-2V5a2 2 0 012-2h5.586a1 1 0 01.707.293l5.414 5.414a1 1 0 01.293.707V19a2 2 0 01-2 2z" />
              </svg>
              <p className="text-[#6e6e73] mb-4">У вас пока нет активных дел</p>
              <button
                onClick={handleCreateCase}
                className="text-[#1d1d1f] hover:text-[#1d1d1f] font-medium transition-colors"
              >
                Создать первое дело
              </button>
            </div>
          ) : (
            <div className="space-y-4">
              {activeCases.map((caseItem) => (
                <div
                  key={caseItem.id}
                  className="apple-glass-card p-6"
                >
                  <div className="flex items-start justify-between mb-4">
                    <div className="flex-1">
                      <div className="flex items-center space-x-3 mb-2">
                        <div className="w-10 h-10 bg-[#1d1d1f]/10 rounded-xl flex items-center justify-center">
                          <svg className="w-5 h-5 text-[#1d1d1f]" fill="none" stroke="currentColor" viewBox="0 0 24 24">
                            <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M3 7v10a2 2 0 002 2h14a2 2 0 002-2V9a2 2 0 00-2-2h-6l-2-2H5a2 2 0 00-2 2z" />
                          </svg>
                        </div>
                        <h4 className="text-lg font-semibold text-[#1d1d1f]">
                          Дело № {caseItem.case_number}
                        </h4>
                        {getStatusBadge(caseItem.status)}
                      </div>
                      <p className="text-[#424245] mb-2">{caseItem.title}</p>
                      <p className="text-sm text-[#6e6e73]">
                        {caseItem.article && `${caseItem.article} | `}
                        {caseItem.defendant_name && `Подзащитный: ${caseItem.defendant_name}`}
                      </p>
                    </div>
                  </div>

                  {/* Stats */}
                  <div className="grid grid-cols-3 gap-4 mb-4 py-4 border-y border-black/5">
                    <div>
                      <p className="text-sm text-[#86868b]">Томов</p>
                      <p className="text-xl font-semibold text-[#1d1d1f]">{caseItem.volumes_count || 0}</p>
                    </div>
                    <div>
                      <p className="text-sm text-[#86868b]">Документов</p>
                      <p className="text-xl font-semibold text-[#1d1d1f]">{caseItem.documents_count || 0}</p>
                    </div>
                    <div>
                      <p className="text-sm text-[#86868b]">Обработано</p>
                      <div className="flex items-center space-x-2">
                        <div className="flex-1 bg-[#d2d2d7] rounded-full h-2">
                          <div
                            className="bg-[#1d1d1f] h-2 rounded-full transition-all"
                            style={{ width: `${caseItem.processing_progress || 0}%` }}
                          ></div>
                        </div>
                        <p className="text-sm font-semibold text-[#1d1d1f]">{caseItem.processing_progress || 0}%</p>
                      </div>
                    </div>
                  </div>

                  {/* Footer */}
                  <div className="flex items-center justify-between">
                    <p className="text-sm text-[#86868b]">
                      Обновлено: {new Date(caseItem.updated_at).toLocaleDateString('ru-RU')}
                    </p>
                    <div className="flex space-x-2">
                      <button
                        onClick={() => handleOpenCase(caseItem.id)}
                        className="apple-btn-secondary"
                      >
                        Открыть дело
                      </button>
                      {caseItem.processing_progress < 100 && caseItem.volumes_count > 0 && (
                        <button className="apple-btn-primary">
                          Продолжить анализ
                        </button>
                      )}
                      <button
                        onClick={() => handleDeleteCase(caseItem.id, caseItem.case_number)}
                        className="p-2 hover:bg-[#ff3b30]/10 rounded-xl transition-colors group"
                        title="Удалить дело"
                      >
                        <svg className="w-5 h-5 text-[#86868b] group-hover:text-[#ff3b30] transition-colors" fill="none" stroke="currentColor" viewBox="0 0 24 24">
                          <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M19 7l-.867 12.142A2 2 0 0116.138 21H7.862a2 2 0 01-1.995-1.858L5 7m5 4v6m4-6v6m1-10V4a1 1 0 00-1-1h-4a1 1 0 00-1 1v3M4 7h16" />
                        </svg>
                      </button>
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
              className="flex items-center space-x-2 text-[#6e6e73] hover:text-[#1d1d1f] font-medium mb-4 transition-colors"
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
                    className="apple-glass-card p-6 opacity-75"
                  >
                    <div className="flex items-center justify-between">
                      <div>
                        <h4 className="text-lg font-semibold text-[#424245] mb-1">
                          Дело № {caseItem.case_number}
                        </h4>
                        <p className="text-sm text-[#6e6e73]">{caseItem.title}</p>
                      </div>
                      <div className="flex items-center space-x-2">
                        <button
                          onClick={() => handleOpenCase(caseItem.id)}
                          className="px-4 py-2 bg-[#d2d2d7] hover:bg-[#c5c5ca] text-[#424245] rounded-xl text-sm font-medium transition-colors"
                        >
                          Открыть
                        </button>
                        <button
                          onClick={() => handleDeleteCase(caseItem.id, caseItem.case_number)}
                          className="p-2 hover:bg-[#ff3b30]/10 rounded-xl transition-colors group"
                          title="Удалить дело"
                        >
                          <svg className="w-5 h-5 text-[#86868b] group-hover:text-[#ff3b30] transition-colors" fill="none" stroke="currentColor" viewBox="0 0 24 24">
                            <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M19 7l-.867 12.142A2 2 0 0116.138 21H7.862a2 2 0 01-1.995-1.858L5 7m5 4v6m4-6v6m1-10V4a1 1 0 00-1-1h-4a1 1 0 00-1 1v3M4 7h16" />
                          </svg>
                        </button>
                      </div>
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
