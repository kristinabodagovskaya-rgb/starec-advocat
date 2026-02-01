import { useState } from 'react'

export default function CourtRoom3D({ onSelectRole }: { onSelectRole: (role: string) => void }) {
  const [hoveredRole, setHoveredRole] = useState<string | null>(null)

  const roles = [
    {
      id: 'prosecution',
      title: 'Прокурор',
      image: '/characters/prosecutor.jpg',
      color: '#8B0000',
      description: 'Докажите вину подсудимого',
      stats: { reputation: 82, cases: 47 },
    },
    {
      id: 'defense',
      title: 'Адвокат',
      image: '/characters/lawyer.jpg',
      color: '#1a4a7a',
      description: 'Защитите подсудимого',
      stats: { reputation: 75, cases: 52 },
    },
    {
      id: 'court',
      title: 'Судья',
      image: '/characters/judge.jpg',
      color: '#4a3a2a',
      description: 'Вынесите справедливый вердикт',
      stats: { reputation: 94, cases: 156 },
    },
  ]

  return (
    <div style={{
      width: '100vw',
      height: '100vh',
      background: 'linear-gradient(180deg, #1a1510 0%, #0a0806 100%)',
      display: 'flex',
      flexDirection: 'column',
      fontFamily: 'Georgia, "Times New Roman", serif',
      overflow: 'hidden',
    }}>
      {/* Верхний HUD */}
      <div style={{
        padding: '16px 30px',
        background: 'rgba(0,0,0,0.5)',
        display: 'flex',
        justifyContent: 'space-between',
        alignItems: 'center',
        borderBottom: '1px solid rgba(212,175,55,0.2)',
        flexShrink: 0,
      }}>
        <div style={{ display: 'flex', alignItems: 'center', gap: 12 }}>
          <div style={{
            width: 40,
            height: 40,
            borderRadius: '50%',
            background: 'linear-gradient(135deg, #d4af37 0%, #8b7355 100%)',
            display: 'flex',
            alignItems: 'center',
            justifyContent: 'center',
            fontSize: 20,
          }}>⚖️</div>
          <div>
            <div style={{ color: '#d4af37', fontSize: 11, letterSpacing: 2, textTransform: 'uppercase' }}>Симуляция</div>
            <div style={{ color: '#f8f4ed', fontSize: 16 }}>Судебный процесс</div>
          </div>
        </div>

        <div style={{
          display: 'flex',
          gap: 24,
          padding: '8px 20px',
          background: 'rgba(248,244,237,0.05)',
          borderRadius: 8,
          border: '1px solid rgba(212,175,55,0.2)',
        }}>
          <div style={{ textAlign: 'center' }}>
            <div style={{ color: 'rgba(255,255,255,0.5)', fontSize: 9, textTransform: 'uppercase' }}>Дело</div>
            <div style={{ color: '#d4af37', fontSize: 14, fontWeight: 'bold' }}>№127-УК</div>
          </div>
          <div style={{ width: 1, background: 'rgba(212,175,55,0.2)' }} />
          <div style={{ textAlign: 'center' }}>
            <div style={{ color: 'rgba(255,255,255,0.5)', fontSize: 9, textTransform: 'uppercase' }}>Стадия</div>
            <div style={{ color: '#f8f4ed', fontSize: 14 }}>Выбор роли</div>
          </div>
        </div>
      </div>

      {/* Основной контент */}
      <div style={{
        flex: 1,
        display: 'flex',
        flexDirection: 'column',
        alignItems: 'center',
        justifyContent: 'center',
        padding: '20px',
      }}>
        {/* Заголовок */}
        <div style={{ textAlign: 'center', marginBottom: 24 }}>
          <h1 style={{
            margin: 0,
            fontSize: 28,
            color: '#f8f4ed',
            fontWeight: 'normal',
            letterSpacing: 1,
          }}>
            Выберите свою роль
          </h1>
          <div style={{
            width: 60,
            height: 2,
            background: 'linear-gradient(90deg, transparent, #d4af37, transparent)',
            margin: '12px auto 0',
          }} />
        </div>

        {/* Карточки ролей */}
        <div style={{ display: 'flex', gap: 20 }}>
          {roles.map((role) => (
            <div
              key={role.id}
              onClick={() => onSelectRole(role.id)}
              onMouseEnter={() => setHoveredRole(role.id)}
              onMouseLeave={() => setHoveredRole(null)}
              style={{
                width: 260,
                background: hoveredRole === role.id
                  ? `linear-gradient(180deg, ${role.color}40 0%, rgba(20,15,10,0.95) 100%)`
                  : 'rgba(30,25,20,0.9)',
                borderRadius: 12,
                overflow: 'hidden',
                cursor: 'pointer',
                transform: hoveredRole === role.id ? 'translateY(-6px) scale(1.02)' : 'translateY(0)',
                transition: 'all 0.3s ease',
                border: `2px solid ${hoveredRole === role.id ? role.color : 'rgba(212,175,55,0.2)'}`,
                boxShadow: hoveredRole === role.id
                  ? `0 15px 40px rgba(0,0,0,0.5), 0 0 20px ${role.color}30`
                  : '0 8px 25px rgba(0,0,0,0.3)',
              }}
            >
              {/* Изображение */}
              <div style={{ position: 'relative', height: 180, overflow: 'hidden' }}>
                <img
                  src={role.image}
                  alt={role.title}
                  style={{
                    width: '100%',
                    height: '100%',
                    objectFit: 'cover',
                    objectPosition: 'top',
                    filter: hoveredRole === role.id ? 'brightness(1.1)' : 'brightness(0.85)',
                    transition: 'filter 0.3s',
                  }}
                />
                <div style={{
                  position: 'absolute',
                  bottom: 0,
                  left: 0,
                  right: 0,
                  height: '50%',
                  background: 'linear-gradient(to top, rgba(20,15,10,1) 0%, transparent 100%)',
                }} />
                <div style={{
                  position: 'absolute',
                  top: 10,
                  left: 10,
                  padding: '5px 10px',
                  background: role.color,
                  borderRadius: 4,
                  fontSize: 10,
                  fontWeight: 'bold',
                  color: '#fff',
                  textTransform: 'uppercase',
                  letterSpacing: 1,
                }}>
                  {role.id === 'prosecution' ? 'Обвинение' : role.id === 'defense' ? 'Защита' : 'Суд'}
                </div>
              </div>

              {/* Контент */}
              <div style={{ padding: 16 }}>
                <h3 style={{
                  margin: 0,
                  fontSize: 20,
                  color: '#d4af37',
                  marginBottom: 6,
                }}>
                  {role.title}
                </h3>
                <p style={{
                  margin: 0,
                  fontSize: 12,
                  color: 'rgba(255,255,255,0.6)',
                  marginBottom: 12,
                }}>
                  {role.description}
                </p>

                {/* Статистика */}
                <div style={{
                  display: 'flex',
                  justifyContent: 'space-around',
                  padding: '10px 0',
                  borderTop: '1px solid rgba(212,175,55,0.15)',
                  borderBottom: '1px solid rgba(212,175,55,0.15)',
                  marginBottom: 12,
                }}>
                  <div style={{ textAlign: 'center' }}>
                    <div style={{ fontSize: 9, color: 'rgba(255,255,255,0.4)', textTransform: 'uppercase' }}>Репутация</div>
                    <div style={{ fontSize: 14, color: '#d4af37', fontWeight: 'bold' }}>{role.stats.reputation}%</div>
                  </div>
                  <div style={{ textAlign: 'center' }}>
                    <div style={{ fontSize: 9, color: 'rgba(255,255,255,0.4)', textTransform: 'uppercase' }}>Дел</div>
                    <div style={{ fontSize: 14, color: '#f8f4ed' }}>{role.stats.cases}</div>
                  </div>
                </div>

                {/* Кнопка */}
                <button
                  style={{
                    width: '100%',
                    padding: '10px 16px',
                    background: hoveredRole === role.id ? role.color : 'transparent',
                    border: `2px solid ${role.color}`,
                    borderRadius: 6,
                    color: hoveredRole === role.id ? '#fff' : role.color,
                    fontSize: 13,
                    fontWeight: 'bold',
                    textTransform: 'uppercase',
                    letterSpacing: 1,
                    cursor: 'pointer',
                    transition: 'all 0.3s',
                    fontFamily: 'Georgia, serif',
                  }}
                >
                  Выбрать
                </button>
              </div>
            </div>
          ))}
        </div>
      </div>

      {/* Нижний HUD */}
      <div style={{
        padding: '12px 30px',
        background: 'rgba(0,0,0,0.5)',
        display: 'flex',
        justifyContent: 'center',
        gap: 40,
        borderTop: '1px solid rgba(212,175,55,0.2)',
        flexShrink: 0,
      }}>
        <div style={{ color: 'rgba(255,255,255,0.4)', fontSize: 11 }}>
          <span style={{ color: '#d4af37' }}>ESC</span> Назад
        </div>
        <div style={{ color: 'rgba(255,255,255,0.4)', fontSize: 11 }}>
          Нажмите на карточку для выбора
        </div>
        <div style={{ color: 'rgba(255,255,255,0.4)', fontSize: 11 }}>
          <span style={{ color: '#d4af37' }}>⚙</span> Настройки
        </div>
      </div>
    </div>
  )
}
