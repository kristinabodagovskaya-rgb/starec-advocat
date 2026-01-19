import { useState, useEffect } from 'react'
import { useParams, useNavigate } from 'react-router-dom'

interface CaseDetail {
  id: number
  case_number: string
  title: string
  article: string
  defendant_name: string
  volumes_count: number
  documents_count: number
  processing_progress: number
  status: string
  created_at: string
  updated_at: string
}

export default function CaseDetailPage() {
  const { id } = useParams()
  const navigate = useNavigate()
  const [caseData, setCaseData] = useState<CaseDetail | null>(null)
  const [isLoading, setIsLoading] = useState(true)

  useEffect(() => {
    loadCase()
  }, [id])

  const loadCase = async () => {
    try {
      const token = localStorage.getItem('token')
      const response = await fetch(`/api/cases/${id}`, {
        headers: { 'Authorization': `Bearer ${token}` }
      })

      if (response.ok) {
        const data = await response.json()
        setCaseData(data)
      } else {
        loadDemoCase()
      }
    } catch (error) {
      console.error('Failed to load case:', error)
      loadDemoCase()
    } finally {
      setIsLoading(false)
    }
  }

  const loadDemoCase = () => {
    const sessionCase = sessionStorage.getItem(`case_${id}`)
    if (sessionCase) {
      const caseData = JSON.parse(sessionCase)
      setCaseData({
        id: parseInt(id!),
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
    } else {
      setCaseData({
        id: parseInt(id!),
        case_number: id === '1' ? '1234567' : '8765432',
        title: id === '1' ? 'УД в отношении Петрова А.В. по ст. 159 УК РФ' : 'УД по ст. 228 УК РФ',
        article: id === '1' ? 'ч.4 ст. 159 УК РФ' : 'ч.1 ст. 228 УК РФ',
        defendant_name: id === '1' ? 'Петров Алексей Владимирович' : 'Иванов Иван Иванович',
        volumes_count: id === '1' ? 216 : 45,
        documents_count: id === '1' ? 1847 : 523,
        processing_progress: id === '1' ? 98 : 100,
        status: 'active',
        created_at: '2026-01-18T10:00:00Z',
        updated_at: '2026-01-18T15:30:00Z',
      })
    }
  }

  if (isLoading) {
    return (
      <div className="min-h-screen flex items-center justify-center">
        <div className="apple-glass-card p-8">
          <div className="animate-spin rounded-full h-12 w-12 border-b-2 border-[#0071e3]"></div>
        </div>
      </div>
    )
  }

  if (!caseData) {
    return (
      <div className="min-h-screen flex items-center justify-center">
        <div className="apple-glass-card p-8 text-center">
          <p className="text-[#6e6e73] mb-4">Дело не найдено</p>
          <button onClick={() => navigate('/')} className="apple-btn-secondary">
            Вернуться к списку дел
          </button>
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
            onClick={() => navigate('/')}
            className="flex items-center text-[#6e6e73] hover:text-[#1d1d1f] transition-colors mb-4 group"
          >
            <svg className="w-5 h-5 mr-2 transition-transform group-hover:-translate-x-1" fill="none" stroke="currentColor" viewBox="0 0 24 24">
              <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M15 19l-7-7 7-7" />
            </svg>
            Назад к списку дел
          </button>
          <div className="flex items-center justify-between">
            <div>
              <h1 className="text-2xl sm:text-3xl font-semibold text-[#1d1d1f] tracking-tight">
                Дело № {caseData.case_number}
              </h1>
              <p className="text-[#6e6e73] mt-1">{caseData.title}</p>
            </div>
          </div>
        </div>
      </header>

      {/* Main Content */}
      <main className="max-w-7xl mx-auto px-4 sm:px-6 lg:px-8 py-8 apple-animate-slideUp">
        {/* Stats Cards */}
        <div className="grid grid-cols-2 md:grid-cols-4 gap-4 md:gap-6 mb-8">
          <div className="apple-stat-card">
            <div className="flex items-center justify-between">
              <div>
                <p className="text-sm text-[#86868b] mb-1">Томов</p>
                <p className="text-3xl font-semibold text-[#1d1d1f]">{caseData.volumes_count || 0}</p>
              </div>
              <div className="w-12 h-12 bg-[#0071e3]/10 rounded-xl flex items-center justify-center">
                <svg className="w-6 h-6 text-[#0071e3]" fill="none" stroke="currentColor" viewBox="0 0 24 24">
                  <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M3 7v10a2 2 0 002 2h14a2 2 0 002-2V9a2 2 0 00-2-2h-6l-2-2H5a2 2 0 00-2 2z" />
                </svg>
              </div>
            </div>
          </div>

          <div className="apple-stat-card">
            <div className="flex items-center justify-between">
              <div>
                <p className="text-sm text-[#86868b] mb-1">Документов</p>
                <p className="text-3xl font-semibold text-[#1d1d1f]">{caseData.documents_count || 0}</p>
              </div>
              <div className="w-12 h-12 bg-[#30d158]/10 rounded-xl flex items-center justify-center">
                <svg className="w-6 h-6 text-[#30d158]" fill="none" stroke="currentColor" viewBox="0 0 24 24">
                  <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M9 12h6m-6 4h6m2 5H7a2 2 0 01-2-2V5a2 2 0 012-2h5.586a1 1 0 01.707.293l5.414 5.414a1 1 0 01.293.707V19a2 2 0 01-2 2z" />
                </svg>
              </div>
            </div>
          </div>

          <div className="apple-stat-card">
            <div className="flex items-center justify-between">
              <div>
                <p className="text-sm text-[#86868b] mb-1">Обработано</p>
                <p className="text-3xl font-semibold text-[#1d1d1f]">{caseData.processing_progress || 0}%</p>
              </div>
              <div className="w-12 h-12 bg-[#ff9500]/10 rounded-xl flex items-center justify-center">
                <svg className="w-6 h-6 text-[#ff9500]" fill="none" stroke="currentColor" viewBox="0 0 24 24">
                  <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M9 19v-6a2 2 0 00-2-2H5a2 2 0 00-2 2v6a2 2 0 002 2h2a2 2 0 002-2zm0 0V9a2 2 0 012-2h2a2 2 0 012 2v10m-6 0a2 2 0 002 2h2a2 2 0 002-2m0 0V5a2 2 0 012-2h2a2 2 0 012 2v14a2 2 0 01-2 2h-2a2 2 0 01-2-2z" />
                </svg>
              </div>
            </div>
          </div>

          <div className="apple-stat-card">
            <div className="flex items-center justify-between">
              <div>
                <p className="text-sm text-[#86868b] mb-1">Статус</p>
                <p className="text-lg font-medium text-[#1d1d1f] capitalize">{caseData.status === 'active' ? 'Активно' : caseData.status}</p>
              </div>
              <div className="w-12 h-12 bg-[#30d158]/10 rounded-xl flex items-center justify-center">
                <svg className="w-6 h-6 text-[#30d158]" fill="none" stroke="currentColor" viewBox="0 0 24 24">
                  <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M13 10V3L4 14h7v7l9-11h-7z" />
                </svg>
              </div>
            </div>
          </div>
        </div>

        {/* Navigation Grid */}
        <div className="grid grid-cols-1 md:grid-cols-2 lg:grid-cols-3 gap-4 md:gap-6">
          {/* Volumes */}
          <button
            onClick={() => navigate(`/cases/${id}/volumes`)}
            className="apple-nav-card text-left group"
          >
            <div className="flex items-center justify-between mb-4">
              <div className="w-14 h-14 bg-[#0071e3]/10 rounded-2xl flex items-center justify-center group-hover:bg-[#0071e3]/20 transition-colors">
                <svg className="w-7 h-7 text-[#0071e3]" fill="none" stroke="currentColor" viewBox="0 0 24 24">
                  <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M3 7v10a2 2 0 002 2h14a2 2 0 002-2V9a2 2 0 00-2-2h-6l-2-2H5a2 2 0 00-2 2z" />
                </svg>
              </div>
              <svg className="w-5 h-5 text-[#86868b] group-hover:text-[#0071e3] group-hover:translate-x-1 transition-all" fill="none" stroke="currentColor" viewBox="0 0 24 24">
                <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M9 5l7 7-7 7" />
              </svg>
            </div>
            <h3 className="text-xl font-semibold text-[#1d1d1f] mb-2">Тома дела</h3>
            <p className="text-[#6e6e73]">Просмотр и управление томами уголовного дела</p>
          </button>

          {/* Documents */}
          <button
            onClick={() => navigate(`/cases/${id}/documents`)}
            className="apple-nav-card text-left group"
          >
            <div className="flex items-center justify-between mb-4">
              <div className="w-14 h-14 bg-[#30d158]/10 rounded-2xl flex items-center justify-center group-hover:bg-[#30d158]/20 transition-colors">
                <svg className="w-7 h-7 text-[#30d158]" fill="none" stroke="currentColor" viewBox="0 0 24 24">
                  <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M9 12h6m-6 4h6m2 5H7a2 2 0 01-2-2V5a2 2 0 012-2h5.586a1 1 0 01.707.293l5.414 5.414a1 1 0 01.293.707V19a2 2 0 01-2 2z" />
                </svg>
              </div>
              <svg className="w-5 h-5 text-[#86868b] group-hover:text-[#30d158] group-hover:translate-x-1 transition-all" fill="none" stroke="currentColor" viewBox="0 0 24 24">
                <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M9 5l7 7-7 7" />
              </svg>
            </div>
            <h3 className="text-xl font-semibold text-[#1d1d1f] mb-2">Документы</h3>
            <p className="text-[#6e6e73]">Список всех документов дела с фильтрами</p>
          </button>

          {/* Analysis */}
          <button
            onClick={() => navigate(`/cases/${id}/analysis`)}
            className="apple-nav-card text-left group"
          >
            <div className="flex items-center justify-between mb-4">
              <div className="w-14 h-14 bg-[#af52de]/10 rounded-2xl flex items-center justify-center group-hover:bg-[#af52de]/20 transition-colors">
                <svg className="w-7 h-7 text-[#af52de]" fill="none" stroke="currentColor" viewBox="0 0 24 24">
                  <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M9.663 17h4.673M12 3v1m6.364 1.636l-.707.707M21 12h-1M4 12H3m3.343-5.657l-.707-.707m2.828 9.9a5 5 0 117.072 0l-.548.547A3.374 3.374 0 0014 18.469V19a2 2 0 11-4 0v-.531c0-.895-.356-1.754-.988-2.386l-.548-.547z" />
                </svg>
              </div>
              <svg className="w-5 h-5 text-[#86868b] group-hover:text-[#af52de] group-hover:translate-x-1 transition-all" fill="none" stroke="currentColor" viewBox="0 0 24 24">
                <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M9 5l7 7-7 7" />
              </svg>
            </div>
            <h3 className="text-xl font-semibold text-[#1d1d1f] mb-2">AI Анализ</h3>
            <p className="text-[#6e6e73]">Анализ дела с помощью искусственного интеллекта</p>
          </button>

          {/* Strategy */}
          <button
            onClick={() => navigate(`/cases/${id}/strategy`)}
            className="apple-nav-card text-left group"
          >
            <div className="flex items-center justify-between mb-4">
              <div className="w-14 h-14 bg-[#ff9500]/10 rounded-2xl flex items-center justify-center group-hover:bg-[#ff9500]/20 transition-colors">
                <svg className="w-7 h-7 text-[#ff9500]" fill="none" stroke="currentColor" viewBox="0 0 24 24">
                  <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M9 5H7a2 2 0 00-2 2v12a2 2 0 002 2h10a2 2 0 002-2V7a2 2 0 00-2-2h-2M9 5a2 2 0 002 2h2a2 2 0 002-2M9 5a2 2 0 012-2h2a2 2 0 012 2m-3 7h3m-3 4h3m-6-4h.01M9 16h.01" />
                </svg>
              </div>
              <svg className="w-5 h-5 text-[#86868b] group-hover:text-[#ff9500] group-hover:translate-x-1 transition-all" fill="none" stroke="currentColor" viewBox="0 0 24 24">
                <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M9 5l7 7-7 7" />
              </svg>
            </div>
            <h3 className="text-xl font-semibold text-[#1d1d1f] mb-2">Стратегия защиты</h3>
            <p className="text-[#6e6e73]">Генерация и редактирование стратегии защиты</p>
          </button>

          {/* Upload Volumes - Primary Card */}
          <button
            onClick={() => navigate(`/cases/${id}/upload`)}
            className="apple-nav-card apple-nav-card-primary text-left group"
          >
            <div className="flex items-center justify-between mb-4">
              <div className="w-14 h-14 bg-white/20 rounded-2xl flex items-center justify-center group-hover:bg-white/30 transition-colors">
                <svg className="w-7 h-7 text-white" fill="none" stroke="currentColor" viewBox="0 0 24 24">
                  <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M7 16a4 4 0 01-.88-7.903A5 5 0 1115.9 6L16 6a5 5 0 011 9.9M15 13l-3-3m0 0l-3 3m3-3v12" />
                </svg>
              </div>
              <svg className="w-5 h-5 text-white/70 group-hover:text-white group-hover:translate-x-1 transition-all" fill="none" stroke="currentColor" viewBox="0 0 24 24">
                <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M9 5l7 7-7 7" />
              </svg>
            </div>
            <h3 className="text-xl font-semibold text-white mb-2">Загрузить тома</h3>
            <p className="text-white/80">Добавить новые тома в дело</p>
          </button>

          {/* Settings */}
          <button
            onClick={() => navigate(`/cases/${id}/settings`)}
            className="apple-nav-card text-left group"
          >
            <div className="flex items-center justify-between mb-4">
              <div className="w-14 h-14 bg-[#8e8e93]/10 rounded-2xl flex items-center justify-center group-hover:bg-[#8e8e93]/20 transition-colors">
                <svg className="w-7 h-7 text-[#8e8e93]" fill="none" stroke="currentColor" viewBox="0 0 24 24">
                  <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M10.325 4.317c.426-1.756 2.924-1.756 3.35 0a1.724 1.724 0 002.573 1.066c1.543-.94 3.31.826 2.37 2.37a1.724 1.724 0 001.065 2.572c1.756.426 1.756 2.924 0 3.35a1.724 1.724 0 00-1.066 2.573c.94 1.543-.826 3.31-2.37 2.37a1.724 1.724 0 00-2.572 1.065c-.426 1.756-2.924 1.756-3.35 0a1.724 1.724 0 00-2.573-1.066c-1.543.94-3.31-.826-2.37-2.37a1.724 1.724 0 00-1.065-2.572c-1.756-.426-1.756-2.924 0-3.35a1.724 1.724 0 001.066-2.573c-.94-1.543.826-3.31 2.37-2.37.996.608 2.296.07 2.572-1.065z" />
                  <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M15 12a3 3 0 11-6 0 3 3 0 016 0z" />
                </svg>
              </div>
              <svg className="w-5 h-5 text-[#86868b] group-hover:text-[#8e8e93] group-hover:translate-x-1 transition-all" fill="none" stroke="currentColor" viewBox="0 0 24 24">
                <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M9 5l7 7-7 7" />
              </svg>
            </div>
            <h3 className="text-xl font-semibold text-[#1d1d1f] mb-2">Настройки дела</h3>
            <p className="text-[#6e6e73]">Редактирование информации о деле</p>
          </button>
        </div>
      </main>
    </div>
  )
}
