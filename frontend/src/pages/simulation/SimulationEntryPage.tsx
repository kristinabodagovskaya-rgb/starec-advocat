import { useState } from 'react'
import { useNavigate } from 'react-router-dom'

type GameState = 'intro' | 'select-case' | 'role-select' | 'cabinet'
type Role = 'prosecutor' | 'defense' | 'judge'

const ROLES = {
  prosecutor: {
    title: 'Прокурор',
    location: 'Кабинет прокурора',
    image: '/characters/prosecutor.jpg',
    color: '#8B0000',
    bgColor: '#1a1210',
    focus: ['Доказательства вины', 'Общественная опасность', 'Квалификация деяния'],
    hint: 'Ваша цель — доказать вину подсудимого',
    desc: 'Поддержание государственного обвинения. Доказывание состава преступления.',
  },
  defense: {
    title: 'Адвокат',
    location: 'Кабинет адвоката',
    image: '/characters/lawyer.jpg',
    color: '#1a4a7a',
    bgColor: '#12151a',
    focus: ['Права подзащитного', 'Слабости обвинения', 'Недопустимые доказательства'],
    hint: 'Ваша цель — защитить подсудимого',
    desc: 'Защита прав обвиняемого. Опровержение доказательств, поиск нарушений.',
  },
  judge: {
    title: 'Судья',
    location: 'Зал суда',
    image: '/characters/judge.jpg',
    color: '#4a3a20',
    bgColor: '#151210',
    focus: ['Процессуальная корректность', 'Баланс сторон', 'Справедливость'],
    hint: 'Ваша цель — вынести справедливый вердикт',
    desc: 'Независимая оценка доказательств и процесса.',
  },
}

export default function SimulationEntryPage() {
  const navigate = useNavigate()
  const [gameState, setGameState] = useState<GameState>('intro')
  const [cases, setCases] = useState<any[]>([])
  const [selectedCase, setSelectedCase] = useState<any>(null)
  const [currentRole, setCurrentRole] = useState<Role>('prosecutor')
  const [hoveredRole, setHoveredRole] = useState<Role | null>(null)

  const loadCases = async () => {
    try {
      const response = await fetch('/api/cases/')
      if (response.ok) {
        const data = await response.json()
        setCases(data)
      }
    } catch (err) {
      console.error(err)
    }
    setGameState('select-case')
  }

  const handleSelectCase = (caseItem: any) => {
    setSelectedCase(caseItem)
    setGameState('role-select')
  }

  const handleSelectRole = (role: Role) => {
    setCurrentRole(role)
    setGameState('cabinet')
  }

  const roleData = ROLES[currentRole]

  // ===== INTRO =====
  if (gameState === 'intro') {
    return (
      <div style={{
        width: '100vw',
        height: '100vh',
        background: '#0a0908',
        display: 'flex',
        alignItems: 'center',
        justifyContent: 'center',
        fontFamily: 'Georgia, serif',
      }}>
        <div style={{ textAlign: 'center' }}>
          <div style={{ fontSize: 80, marginBottom: 30 }}>⚖️</div>
          <h1 style={{ color: '#d4af37', fontSize: 48, margin: 0, fontWeight: 'normal' }}>
            СИМУЛЯЦИЯ СУДА
          </h1>
          <p style={{ color: '#888', margin: '20px 0 40px', fontSize: 18 }}>
            Анализируйте дело с трёх точек зрения
          </p>
          <button
            onClick={loadCases}
            style={{
              padding: '18px 50px',
              fontSize: 18,
              background: 'transparent',
              border: '2px solid #d4af37',
              color: '#d4af37',
              cursor: 'pointer',
              fontFamily: 'Georgia, serif',
              transition: 'all 0.3s',
            }}
            onMouseEnter={e => {
              e.currentTarget.style.background = '#d4af37'
              e.currentTarget.style.color = '#0a0908'
            }}
            onMouseLeave={e => {
              e.currentTarget.style.background = 'transparent'
              e.currentTarget.style.color = '#d4af37'
            }}
          >
            НАЧАТЬ
          </button>
        </div>
      </div>
    )
  }

  // ===== SELECT CASE =====
  if (gameState === 'select-case') {
    return (
      <div style={{
        width: '100vw',
        minHeight: '100vh',
        background: '#0a0908',
        fontFamily: 'Georgia, serif',
        padding: 60,
        boxSizing: 'border-box',
      }}>
        <h2 style={{ color: '#d4af37', fontSize: 32, margin: '0 0 40px', textAlign: 'center' }}>
          Выберите дело для анализа
        </h2>
        <div style={{ maxWidth: 600, margin: '0 auto' }}>
          {cases.map(c => (
            <div
              key={c.id}
              onClick={() => handleSelectCase(c)}
              style={{
                padding: 24,
                marginBottom: 16,
                background: '#151210',
                border: '1px solid #333',
                cursor: 'pointer',
                transition: 'all 0.3s',
              }}
              onMouseEnter={e => e.currentTarget.style.borderColor = '#d4af37'}
              onMouseLeave={e => e.currentTarget.style.borderColor = '#333'}
            >
              <div style={{ color: '#d4af37', fontSize: 20, marginBottom: 8 }}>
                {c.case_number || `Дело #${c.id}`}
              </div>
              <div style={{ color: '#888', fontSize: 14 }}>{c.title}</div>
            </div>
          ))}
        </div>
      </div>
    )
  }

  // ===== ROLE SELECT =====
  if (gameState === 'role-select') {
    return (
      <div style={{
        width: '100vw',
        minHeight: '100vh',
        background: '#0a0908',
        fontFamily: 'Georgia, serif',
        padding: '40px 20px',
        boxSizing: 'border-box',
        overflow: 'auto',
      }}>
        <div style={{ textAlign: 'center', marginBottom: 40 }}>
          <div style={{ color: '#888', fontSize: 14, marginBottom: 10 }}>
            Дело: {selectedCase?.case_number}
          </div>
          <h2 style={{ color: '#d4af37', fontSize: 36, margin: 0, fontWeight: 'normal' }}>
            Выберите свою роль
          </h2>
        </div>

        <div style={{
          display: 'flex',
          justifyContent: 'center',
          gap: 30,
          flexWrap: 'wrap',
          maxWidth: 1100,
          margin: '0 auto',
        }}>
          {(Object.keys(ROLES) as Role[]).map(role => {
            const r = ROLES[role]
            const isHovered = hoveredRole === role

            return (
              <div
                key={role}
                onClick={() => handleSelectRole(role)}
                onMouseEnter={() => setHoveredRole(role)}
                onMouseLeave={() => setHoveredRole(null)}
                style={{
                  width: 300,
                  background: '#111',
                  borderRadius: 12,
                  overflow: 'hidden',
                  cursor: 'pointer',
                  transition: 'all 0.3s ease',
                  transform: isHovered ? 'translateY(-10px)' : 'none',
                  border: `2px solid ${isHovered ? r.color : '#333'}`,
                }}
              >
                <div style={{ height: 300, position: 'relative', overflow: 'hidden' }}>
                  <img
                    src={r.image}
                    alt={r.title}
                    style={{
                      width: '100%',
                      height: '100%',
                      objectFit: 'cover',
                      objectPosition: 'top',
                      filter: isHovered ? 'brightness(1.1)' : 'brightness(0.8)',
                    }}
                  />
                  <div style={{
                    position: 'absolute',
                    bottom: 0,
                    left: 0,
                    right: 0,
                    height: '50%',
                    background: 'linear-gradient(to top, #111 0%, transparent 100%)',
                  }} />
                </div>
                <div style={{ padding: 20 }}>
                  <h3 style={{ margin: 0, color: r.color, fontSize: 24, marginBottom: 10 }}>
                    {r.title}
                  </h3>
                  <p style={{ margin: 0, color: '#888', fontSize: 13, lineHeight: 1.5, marginBottom: 16 }}>
                    {r.desc}
                  </p>
                  <div style={{
                    padding: '12px 20px',
                    background: isHovered ? r.color : 'transparent',
                    border: `2px solid ${r.color}`,
                    textAlign: 'center',
                    color: isHovered ? '#fff' : r.color,
                    fontSize: 13,
                    fontWeight: 'bold',
                    textTransform: 'uppercase',
                  }}>
                    Выбрать
                  </div>
                </div>
              </div>
            )
          })}
        </div>

        <div style={{ textAlign: 'center', marginTop: 30 }}>
          <button
            onClick={() => setGameState('select-case')}
            style={{
              padding: '10px 24px',
              background: 'transparent',
              border: '1px solid #444',
              color: '#666',
              cursor: 'pointer',
              fontFamily: 'Georgia, serif',
            }}
          >
            ← Назад
          </button>
        </div>
      </div>
    )
  }

  // ===== CABINET - Кабинет с персонажем =====
  if (gameState === 'cabinet') {
    return (
      <div style={{
        width: '100vw',
        minHeight: '100vh',
        background: roleData.bgColor,
        fontFamily: 'Georgia, serif',
        overflow: 'auto',
      }}>
        {/* Header */}
        <div style={{
          padding: '16px 30px',
          background: 'rgba(0,0,0,0.8)',
          display: 'flex',
          justifyContent: 'space-between',
          alignItems: 'center',
          borderBottom: '1px solid #333',
        }}>
          <div style={{ display: 'flex', alignItems: 'center', gap: 16 }}>
            <span style={{ fontSize: 24 }}>⚖️</span>
            <div>
              <div style={{ color: '#888', fontSize: 11 }}>ДЕЛО</div>
              <div style={{ color: '#d4af37', fontSize: 16 }}>{selectedCase?.case_number}</div>
            </div>
          </div>

          <div style={{ display: 'flex', gap: 10 }}>
            {(Object.keys(ROLES) as Role[]).map(r => (
              <button
                key={r}
                onClick={() => setCurrentRole(r)}
                style={{
                  padding: '8px 16px',
                  background: currentRole === r ? ROLES[r].color : 'transparent',
                  border: `2px solid ${ROLES[r].color}`,
                  color: '#fff',
                  cursor: 'pointer',
                  fontFamily: 'Georgia, serif',
                  fontSize: 12,
                }}
              >
                {ROLES[r].title}
              </button>
            ))}
          </div>

          <button
            onClick={() => navigate(`/simulation/${selectedCase?.id}?role=${currentRole}`)}
            style={{
              padding: '12px 24px',
              background: '#d4af37',
              border: 'none',
              color: '#000',
              cursor: 'pointer',
              fontFamily: 'Georgia, serif',
              fontWeight: 'bold',
            }}
          >
            НАЧАТЬ АНАЛИЗ →
          </button>
        </div>

        {/* Main content */}
        <div style={{ display: 'flex', minHeight: 'calc(100vh - 70px)' }}>
          {/* Left - Character */}
          <div style={{
            width: '40%',
            position: 'relative',
            background: `linear-gradient(135deg, ${roleData.bgColor} 0%, #000 100%)`,
          }}>
            <img
              src={roleData.image}
              alt={roleData.title}
              style={{
                position: 'absolute',
                bottom: 0,
                left: '50%',
                transform: 'translateX(-50%)',
                height: '90%',
                maxHeight: '80vh',
                objectFit: 'contain',
              }}
            />
            <div style={{
              position: 'absolute',
              inset: 0,
              background: `linear-gradient(90deg, transparent 50%, ${roleData.bgColor} 100%)`,
              pointerEvents: 'none',
            }} />
            <div style={{
              position: 'absolute',
              top: 20,
              left: 20,
              color: roleData.color,
              fontSize: 12,
              textTransform: 'uppercase',
              letterSpacing: 3,
            }}>
              {roleData.location}
            </div>
            <div style={{
              position: 'absolute',
              bottom: 20,
              left: 20,
              right: 20,
              padding: 16,
              background: 'rgba(0,0,0,0.8)',
              borderLeft: `3px solid ${roleData.color}`,
            }}>
              <div style={{ color: '#fff', fontSize: 14, fontStyle: 'italic' }}>
                «{roleData.hint}»
              </div>
            </div>
          </div>

          {/* Right - Case info */}
          <div style={{ flex: 1, padding: 30 }}>
            <div style={{ color: roleData.color, fontSize: 28, fontWeight: 'bold', marginBottom: 20 }}>
              {roleData.title.toUpperCase()}
            </div>

            <div style={{ marginBottom: 24 }}>
              <div style={{ color: '#888', fontSize: 11, marginBottom: 10, textTransform: 'uppercase' }}>
                Фокус анализа
              </div>
              <div style={{ display: 'flex', gap: 8, flexWrap: 'wrap' }}>
                {roleData.focus.map((f, i) => (
                  <div key={i} style={{
                    padding: '8px 14px',
                    background: `${roleData.color}30`,
                    border: `1px solid ${roleData.color}`,
                    color: '#fff',
                    fontSize: 12,
                  }}>
                    {f}
                  </div>
                ))}
              </div>
            </div>

            <div style={{ marginBottom: 24 }}>
              <div style={{ color: '#888', fontSize: 11, marginBottom: 10, textTransform: 'uppercase' }}>
                Материалы дела
              </div>
              <div style={{ display: 'grid', gridTemplateColumns: 'repeat(2, 1fr)', gap: 12 }}>
                {['Обвинительное заключение', 'Показания свидетелей', 'Экспертизы', 'Вещ. доказательства'].map((doc, i) => (
                  <div key={i} style={{
                    padding: 16,
                    background: '#151210',
                    border: '1px solid #333',
                    display: 'flex',
                    alignItems: 'center',
                    gap: 12,
                  }}>
                    <span style={{ fontSize: 24 }}>📄</span>
                    <span style={{ color: '#ccc', fontSize: 13 }}>{doc}</span>
                  </div>
                ))}
              </div>
            </div>

            <button
              onClick={() => setGameState('role-select')}
              style={{
                padding: '10px 20px',
                background: 'transparent',
                border: '1px solid #444',
                color: '#666',
                cursor: 'pointer',
                fontFamily: 'Georgia, serif',
              }}
            >
              ← Сменить роль
            </button>
          </div>
        </div>
      </div>
    )
  }

  return null
}
