import { useState, useEffect } from 'react'
import { useParams, useNavigate } from 'react-router-dom'

interface CaseInfo {
  id: number
  case_number: string
  title: string
  defendant_name: string
}

export default function SimulationPage() {
  const { id } = useParams()
  const navigate = useNavigate()
  const [caseInfo, setCaseInfo] = useState<CaseInfo | null>(null)
  const [activePanel, setActivePanel] = useState<'prosecution' | 'court' | 'defense'>('defense')

  useEffect(() => {
    // Загрузка информации о деле
    const loadCase = async () => {
      try {
        const response = await fetch(`/api/cases/${id}`)
        if (response.ok) {
          const data = await response.json()
          setCaseInfo(data)
        }
      } catch (err) {
        console.error('Error loading case:', err)
      }
    }
    loadCase()
  }, [id])

  return (
    <div className="min-h-screen bg-gradient-to-br from-slate-900 via-slate-800 to-slate-900">
      {/* Header */}
      <header className="bg-slate-800/50 backdrop-blur-sm border-b border-slate-700 sticky top-0 z-10">
        <div className="max-w-7xl mx-auto px-4 py-4">
          <div className="flex items-center justify-between">
            <div className="flex items-center space-x-4">
              <button
                onClick={() => navigate(`/cases/${id}`)}
                className="text-slate-400 hover:text-white transition-colors"
              >
                <svg className="w-6 h-6" fill="none" stroke="currentColor" viewBox="0 0 24 24">
                  <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M10 19l-7-7m0 0l7-7m-7 7h18" />
                </svg>
              </button>
              <div>
                <h1 className="text-xl font-bold text-white flex items-center">
                  <span className="text-2xl mr-2">&#9878;</span>
                  СИМУЛЯЦИЯ ПРОЦЕССА
                </h1>
                <p className="text-slate-400 text-sm">
                  Дело {caseInfo?.case_number || '...'} | {caseInfo?.defendant_name || '...'}
                </p>
              </div>
            </div>
            <div className="flex items-center space-x-2">
              <button className="px-4 py-2 bg-emerald-600 hover:bg-emerald-700 text-white rounded-lg transition-colors flex items-center">
                <svg className="w-4 h-4 mr-2" fill="none" stroke="currentColor" viewBox="0 0 24 24">
                  <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M14.752 11.168l-3.197-2.132A1 1 0 0010 9.87v4.263a1 1 0 001.555.832l3.197-2.132a1 1 0 000-1.664z" />
                  <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M21 12a9 9 0 11-18 0 9 9 0 0118 0z" />
                </svg>
                Запустить анализ
              </button>
            </div>
          </div>
        </div>
      </header>

      {/* Main Arena */}
      <main className="max-w-7xl mx-auto px-4 py-6">
        {/* Три стороны */}
        <div className="grid grid-cols-3 gap-6 mb-6">

          {/* ОБВИНЕНИЕ */}
          <div
            className={`bg-slate-800/50 backdrop-blur-sm rounded-2xl border-2 transition-all cursor-pointer ${
              activePanel === 'prosecution'
                ? 'border-red-500 shadow-lg shadow-red-500/20'
                : 'border-slate-700 hover:border-red-500/50'
            }`}
            onClick={() => setActivePanel('prosecution')}
          >
            <div className="p-4 border-b border-slate-700">
              <div className="flex items-center justify-between">
                <h2 className="text-lg font-bold text-red-400 flex items-center">
                  <span className="text-2xl mr-2">&#128100;</span>
                  ОБВИНЕНИЕ
                </h2>
                <span className="px-2 py-1 bg-red-500/20 text-red-400 text-xs rounded-full">
                  Следствие
                </span>
              </div>
            </div>
            <div className="p-4 space-y-3">
              <div className="flex items-center text-slate-300">
                <span className="text-lg mr-2">&#128196;</span>
                <span>Доказательства</span>
                <span className="ml-auto text-slate-500">24</span>
              </div>
              <div className="flex items-center text-slate-300">
                <span className="text-lg mr-2">&#128101;</span>
                <span>Свидетели</span>
                <span className="ml-auto text-slate-500">8</span>
              </div>
              <div className="flex items-center text-slate-300">
                <span className="text-lg mr-2">&#128203;</span>
                <span>Экспертизы</span>
                <span className="ml-auto text-slate-500">3</span>
              </div>
              <div className="mt-4 pt-4 border-t border-slate-700">
                <div className="text-xs text-slate-500 mb-1">Сила обвинения</div>
                <div className="h-2 bg-slate-700 rounded-full overflow-hidden">
                  <div className="h-full bg-gradient-to-r from-red-500 to-red-400 rounded-full" style={{ width: '72%' }}></div>
                </div>
                <div className="text-right text-xs text-red-400 mt-1">72%</div>
              </div>
            </div>
          </div>

          {/* СУД */}
          <div
            className={`bg-slate-800/50 backdrop-blur-sm rounded-2xl border-2 transition-all cursor-pointer ${
              activePanel === 'court'
                ? 'border-amber-500 shadow-lg shadow-amber-500/20'
                : 'border-slate-700 hover:border-amber-500/50'
            }`}
            onClick={() => setActivePanel('court')}
          >
            <div className="p-4 border-b border-slate-700">
              <div className="flex items-center justify-between">
                <h2 className="text-lg font-bold text-amber-400 flex items-center">
                  <span className="text-2xl mr-2">&#9878;</span>
                  СУД
                </h2>
                <span className="px-2 py-1 bg-amber-500/20 text-amber-400 text-xs rounded-full">
                  Арбитр
                </span>
              </div>
            </div>
            <div className="p-4 space-y-3">
              <div className="flex items-center text-slate-300">
                <span className="text-lg mr-2">&#9989;</span>
                <span>Допустимые</span>
                <span className="ml-auto text-emerald-400">18</span>
              </div>
              <div className="flex items-center text-slate-300">
                <span className="text-lg mr-2">&#10060;</span>
                <span>Недопустимые</span>
                <span className="ml-auto text-red-400">6</span>
              </div>
              <div className="flex items-center text-slate-300">
                <span className="text-lg mr-2">&#10067;</span>
                <span>Спорные</span>
                <span className="ml-auto text-amber-400">4</span>
              </div>
              <div className="mt-4 pt-4 border-t border-slate-700">
                <div className="text-xs text-slate-500 mb-1">Оценка дела</div>
                <div className="flex space-x-1">
                  <div className="flex-1 h-2 bg-emerald-500 rounded-full"></div>
                  <div className="flex-1 h-2 bg-amber-500 rounded-full"></div>
                  <div className="flex-1 h-2 bg-slate-600 rounded-full"></div>
                </div>
              </div>
            </div>
          </div>

          {/* ЗАЩИТА */}
          <div
            className={`bg-slate-800/50 backdrop-blur-sm rounded-2xl border-2 transition-all cursor-pointer ${
              activePanel === 'defense'
                ? 'border-emerald-500 shadow-lg shadow-emerald-500/20'
                : 'border-slate-700 hover:border-emerald-500/50'
            }`}
            onClick={() => setActivePanel('defense')}
          >
            <div className="p-4 border-b border-slate-700">
              <div className="flex items-center justify-between">
                <h2 className="text-lg font-bold text-emerald-400 flex items-center">
                  <span className="text-2xl mr-2">&#128084;</span>
                  ЗАЩИТА
                </h2>
                <span className="px-2 py-1 bg-emerald-500/20 text-emerald-400 text-xs rounded-full">
                  Адвокат
                </span>
              </div>
            </div>
            <div className="p-4 space-y-3">
              <div className="flex items-center text-slate-300">
                <span className="text-lg mr-2">&#9888;</span>
                <span>Нарушения УПК</span>
                <span className="ml-auto text-red-400">12</span>
              </div>
              <div className="flex items-center text-slate-300">
                <span className="text-lg mr-2">&#128269;</span>
                <span>Пробелы</span>
                <span className="ml-auto text-amber-400">5</span>
              </div>
              <div className="flex items-center text-slate-300">
                <span className="text-lg mr-2">&#128161;</span>
                <span>Линии защиты</span>
                <span className="ml-auto text-emerald-400">3</span>
              </div>
              <div className="mt-4 pt-4 border-t border-slate-700">
                <div className="text-xs text-slate-500 mb-1">Сила защиты</div>
                <div className="h-2 bg-slate-700 rounded-full overflow-hidden">
                  <div className="h-full bg-gradient-to-r from-emerald-500 to-emerald-400 rounded-full" style={{ width: '78%' }}></div>
                </div>
                <div className="text-right text-xs text-emerald-400 mt-1">78%</div>
              </div>
            </div>
          </div>
        </div>

        {/* АРЕНА - центральная часть */}
        <div className="bg-slate-800/50 backdrop-blur-sm rounded-2xl border border-slate-700 mb-6">
          <div className="p-4 border-b border-slate-700 flex items-center justify-between">
            <h3 className="text-white font-semibold flex items-center">
              <span className="text-xl mr-2">&#9876;</span>
              АРЕНА ПРОТИВОСТОЯНИЯ
            </h3>
            <div className="flex space-x-2">
              <button className="px-3 py-1 bg-slate-700 hover:bg-slate-600 text-slate-300 text-sm rounded-lg transition-colors">
                Все документы
              </button>
              <button className="px-3 py-1 bg-slate-700 hover:bg-slate-600 text-slate-300 text-sm rounded-lg transition-colors">
                Спорные
              </button>
              <button className="px-3 py-1 bg-slate-700 hover:bg-slate-600 text-slate-300 text-sm rounded-lg transition-colors">
                Ключевые
              </button>
            </div>
          </div>
          <div className="p-6 min-h-[200px] flex items-center justify-center">
            <div className="text-center text-slate-500">
              <div className="text-4xl mb-2">&#128196;</div>
              <p>Нажмите "Запустить анализ" для начала симуляции</p>
              <p className="text-sm mt-1">Здесь появятся документы в контексте противостояния сторон</p>
            </div>
          </div>
        </div>

        {/* Нижняя панель */}
        <div className="grid grid-cols-2 gap-6">
          {/* ХРОНОЛОГИЯ */}
          <div className="bg-slate-800/50 backdrop-blur-sm rounded-2xl border border-slate-700">
            <div className="p-4 border-b border-slate-700">
              <h3 className="text-white font-semibold flex items-center">
                <span className="text-xl mr-2">&#128197;</span>
                ХРОНОЛОГИЯ СОБЫТИЙ
              </h3>
            </div>
            <div className="p-4">
              <div className="relative">
                {/* Timeline line */}
                <div className="absolute top-4 left-0 right-0 h-0.5 bg-slate-700"></div>

                {/* Timeline points */}
                <div className="flex justify-between relative">
                  {[
                    { date: '01.11', label: 'Возбуждение', color: 'bg-red-500' },
                    { date: '15.11', label: 'Допросы', color: 'bg-amber-500' },
                    { date: '22.11', label: 'Обыск', color: 'bg-red-500' },
                    { date: '03.12', label: 'Экспертиза', color: 'bg-blue-500' },
                    { date: '15.12', label: 'Обвинение', color: 'bg-red-500' },
                  ].map((event, i) => (
                    <div key={i} className="flex flex-col items-center">
                      <div className={`w-3 h-3 rounded-full ${event.color} border-2 border-slate-800 z-10`}></div>
                      <div className="text-xs text-slate-400 mt-2">{event.date}</div>
                      <div className="text-xs text-slate-500">{event.label}</div>
                    </div>
                  ))}
                </div>
              </div>
            </div>
          </div>

          {/* СТАТИСТИКА И СВЯЗИ */}
          <div className="bg-slate-800/50 backdrop-blur-sm rounded-2xl border border-slate-700">
            <div className="p-4 border-b border-slate-700">
              <h3 className="text-white font-semibold flex items-center">
                <span className="text-xl mr-2">&#128202;</span>
                СТАТИСТИКА ДЕЛА
              </h3>
            </div>
            <div className="p-4 grid grid-cols-2 gap-4">
              <div>
                <div className="text-slate-500 text-xs mb-1">Документов</div>
                <div className="text-2xl font-bold text-white">84</div>
              </div>
              <div>
                <div className="text-slate-500 text-xs mb-1">Участников</div>
                <div className="text-2xl font-bold text-white">12</div>
              </div>
              <div>
                <div className="text-slate-500 text-xs mb-1">Нарушений</div>
                <div className="text-2xl font-bold text-red-400">12</div>
              </div>
              <div>
                <div className="text-slate-500 text-xs mb-1">Пробелов</div>
                <div className="text-2xl font-bold text-amber-400">5</div>
              </div>
            </div>
          </div>
        </div>
      </main>
    </div>
  )
}
