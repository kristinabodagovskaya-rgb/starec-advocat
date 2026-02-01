import { useState, useEffect } from 'react'
import { useParams, useSearchParams } from 'react-router-dom'

type Role = 'prosecution' | 'defense' | 'court'
type DocumentStatus = 'valid' | 'disputed' | 'excluded'

interface Document {
  id: number
  title: string
  type: string
  page_start: number
  page_end: number
  date?: string
  volumeId?: number
  // Процессуальные данные
  status: DocumentStatus
  issues: string[]
  strength: number // 0-100
  usedBy: Role[]
}

interface CaseData {
  id: number
  case_number: string
  title: string
  volumes: any[]
  documents: Document[]
}

const ROLE_CONFIG = {
  prosecution: {
    title: 'Прокурор',
    color: '#8B0000',
    focus: 'Доказывание вины',
    actions: ['Использовать как доказательство', 'Усилить другими материалами', 'Отложить'],
  },
  defense: {
    title: 'Адвокат',
    color: '#1a4a7a',
    focus: 'Защита прав',
    actions: ['Заявить о нарушении', 'Ходатайство об исключении', 'Оспорить'],
  },
  court: {
    title: 'Судья',
    color: '#4a3a20',
    focus: 'Оценка допустимости',
    actions: ['Признать допустимым', 'Исключить', 'Запросить пояснения'],
  },
}

// Имитация процессуальных нарушений
const MOCK_ISSUES: Record<string, string[]> = {
  'Протокол допроса': ['Допрос проведён без адвоката', 'Отсутствует подпись на л.2'],
  'Экспертиза': ['Эксперт не предупреждён об ответственности'],
  'Постановление': [],
  'default': [],
}

export default function SimulationPage() {
  const { caseId } = useParams()
  const [searchParams] = useSearchParams()
  const initialRole = (searchParams.get('role') as Role) || 'prosecution'

  const [role, setRole] = useState<Role>(initialRole)
  const [caseData, setCaseData] = useState<CaseData | null>(null)
  const [selectedDoc, setSelectedDoc] = useState<Document | null>(null)
  const [expandedVolume, setExpandedVolume] = useState<number | null>(null)
  const [actionLog, setActionLog] = useState<string[]>([])
  const [showOutcome, setShowOutcome] = useState(false)

  const config = ROLE_CONFIG[role]

  // Загрузка данных дела
  useEffect(() => {
    const loadCase = async () => {
      try {
        // Загружаем информацию о деле
        const caseRes = await fetch(`/api/cases/${caseId}`)
        const caseInfo = caseRes.ok ? await caseRes.json() : {}

        // Загружаем тома
        const volRes = await fetch(`/api/cases/${caseId}/volumes`)
        const volumes = volRes.ok ? await volRes.json() : []

        // Загружаем документы для всех томов
        let allDocs: any[] = []
        for (const vol of volumes) {
          const docRes = await fetch(`/api/cases/${caseId}/volumes/${vol.id}/documents`)
          if (docRes.ok) {
            const docData = await docRes.json()
            const docs = (docData.documents || []).map((d: any) => ({ ...d, volumeId: vol.id }))
            allDocs = [...allDocs, ...docs]
          }
        }

        // Добавляем процессуальные данные к документам
        const docsWithStatus = allDocs.map((doc: any) => ({
          ...doc,
          type: doc.doc_type || doc.type || 'Документ',
          status: 'valid' as DocumentStatus,
          issues: MOCK_ISSUES[doc.doc_type] || MOCK_ISSUES['default'] || [],
          strength: 60 + Math.floor(Math.random() * 40),
          usedBy: [],
        }))

        setCaseData({
          id: caseInfo.id || parseInt(caseId || '1'),
          case_number: caseInfo.case_number || `Дело #${caseId}`,
          title: caseInfo.title || '',
          volumes,
          documents: docsWithStatus,
        })

        if (volumes.length) setExpandedVolume(volumes[0].id)
      } catch (err) {
        console.error(err)
      }
    }
    loadCase()
  }, [caseId])

  // Действие над документом
  const handleAction = (action: string) => {
    if (!selectedDoc) return

    const timestamp = new Date().toLocaleTimeString()
    const logEntry = `[${timestamp}] ${config.title}: "${action}" → ${selectedDoc.title}`
    setActionLog(prev => [logEntry, ...prev])

    // Обновляем статус документа
    if (caseData) {
      const updatedDocs = caseData.documents.map(doc => {
        if (doc.id === selectedDoc.id) {
          let newStatus = doc.status
          let newStrength = doc.strength

          if (action.includes('исключ') || action.includes('Исключить')) {
            newStatus = 'excluded'
            newStrength = 0
          } else if (action.includes('нарушен') || action.includes('Оспорить')) {
            newStatus = 'disputed'
            newStrength = Math.max(20, doc.strength - 30)
          } else if (action.includes('Использовать') || action.includes('допустим')) {
            newStatus = 'valid'
            doc.usedBy.push(role)
          }

          return { ...doc, status: newStatus, strength: newStrength, usedBy: [...doc.usedBy] }
        }
        return doc
      })
      setCaseData({ ...caseData, documents: updatedDocs })
      setSelectedDoc(updatedDocs.find(d => d.id === selectedDoc.id) || null)
    }
  }

  if (!caseData) {
    return (
      <div style={{ width: '100vw', height: '100vh', background: '#0a0908', display: 'flex', alignItems: 'center', justifyContent: 'center' }}>
        <div style={{ color: '#d4af37', fontFamily: 'Georgia, serif' }}>Загрузка дела...</div>
      </div>
    )
  }

  return (
    <div style={{
      width: '100vw',
      height: '100vh',
      background: '#0a0908',
      fontFamily: 'Georgia, serif',
      display: 'flex',
      flexDirection: 'column',
      overflow: 'hidden',
    }}>
      {/* === HEADER === */}
      <div style={{
        height: 60,
        background: '#111',
        borderBottom: '1px solid #333',
        display: 'flex',
        alignItems: 'center',
        justifyContent: 'space-between',
        padding: '0 24px',
        flexShrink: 0,
      }}>
        <div style={{ display: 'flex', alignItems: 'center', gap: 20 }}>
          <span style={{ fontSize: 24 }}>⚖️</span>
          <div>
            <div style={{ color: '#888', fontSize: 11, textTransform: 'uppercase' }}>Дело</div>
            <div style={{ color: '#d4af37', fontSize: 16 }}>{caseData.case_number}</div>
          </div>
        </div>

        {/* Role switcher */}
        <div style={{ display: 'flex', gap: 8 }}>
          {(Object.keys(ROLE_CONFIG) as Role[]).map(r => (
            <button
              key={r}
              onClick={() => setRole(r)}
              style={{
                padding: '8px 16px',
                background: role === r ? ROLE_CONFIG[r].color : 'transparent',
                border: `1px solid ${ROLE_CONFIG[r].color}`,
                color: role === r ? '#fff' : ROLE_CONFIG[r].color,
                cursor: 'pointer',
                fontFamily: 'Georgia, serif',
                fontSize: 13,
              }}
            >
              {ROLE_CONFIG[r].title}
            </button>
          ))}
        </div>

        <button
          onClick={() => setShowOutcome(true)}
          style={{
            padding: '10px 20px',
            background: '#d4af37',
            border: 'none',
            color: '#000',
            cursor: 'pointer',
            fontFamily: 'Georgia, serif',
            fontWeight: 'bold',
          }}
        >
          Завершить симуляцию
        </button>
      </div>

      {/* === MAIN CONTENT === */}
      <div style={{ flex: 1, display: 'flex', overflow: 'hidden' }}>

        {/* LEFT: Document structure */}
        <div style={{
          width: 300,
          background: '#0f0d0a',
          borderRight: '1px solid #222',
          overflow: 'auto',
          flexShrink: 0,
        }}>
          <div style={{ padding: 16, borderBottom: '1px solid #222' }}>
            <div style={{ color: '#888', fontSize: 11, textTransform: 'uppercase', marginBottom: 8 }}>
              Структура дела
            </div>
          </div>

          {caseData.volumes?.map(volume => (
            <div key={volume.id}>
              <div
                onClick={() => setExpandedVolume(expandedVolume === volume.id ? null : volume.id)}
                style={{
                  padding: '12px 16px',
                  background: expandedVolume === volume.id ? '#1a1510' : 'transparent',
                  borderBottom: '1px solid #1a1a1a',
                  cursor: 'pointer',
                  display: 'flex',
                  alignItems: 'center',
                  gap: 10,
                }}
              >
                <span style={{ color: '#d4af37' }}>{expandedVolume === volume.id ? '▼' : '▶'}</span>
                <span style={{ color: '#ccc', fontSize: 14 }}>Том {volume.volume_number}</span>
              </div>

              {expandedVolume === volume.id && (
                <div style={{ background: '#0a0806' }}>
                  {caseData.documents
                    .filter((d: any) => d.volumeId === volume.id)
                    .map(doc => (
                      <div
                        key={doc.id}
                        onClick={() => setSelectedDoc(doc)}
                        style={{
                          padding: '10px 16px 10px 32px',
                          borderBottom: '1px solid #151515',
                          cursor: 'pointer',
                          background: selectedDoc?.id === doc.id ? '#1a1815' : 'transparent',
                          display: 'flex',
                          alignItems: 'center',
                          gap: 10,
                        }}
                      >
                        {/* Status indicator */}
                        <div style={{
                          width: 8,
                          height: 8,
                          borderRadius: '50%',
                          background: doc.status === 'valid' ? '#4a4' :
                                     doc.status === 'disputed' ? '#da4' :
                                     '#a44',
                        }} />
                        <div style={{ flex: 1 }}>
                          <div style={{ color: '#bbb', fontSize: 13 }}>{doc.title}</div>
                          <div style={{ color: '#666', fontSize: 11 }}>{doc.type} • л.{doc.page_start}-{doc.page_end}</div>
                        </div>
                        {doc.issues.length > 0 && (
                          <span style={{ color: '#da4', fontSize: 12 }}>⚠</span>
                        )}
                      </div>
                    ))}
                </div>
              )}
            </div>
          ))}
        </div>

        {/* CENTER: Document analysis */}
        <div style={{ flex: 1, display: 'flex', flexDirection: 'column', overflow: 'hidden' }}>
          {selectedDoc ? (
            <>
              {/* Document header */}
              <div style={{
                padding: 20,
                borderBottom: '1px solid #222',
                background: '#111',
              }}>
                <div style={{ display: 'flex', justifyContent: 'space-between', alignItems: 'flex-start' }}>
                  <div>
                    <h2 style={{ margin: 0, color: '#d4af37', fontSize: 20 }}>{selectedDoc.title}</h2>
                    <div style={{ color: '#888', fontSize: 13, marginTop: 6 }}>
                      {selectedDoc.type} • Листы {selectedDoc.page_start}–{selectedDoc.page_end}
                    </div>
                  </div>
                  <div style={{
                    padding: '8px 16px',
                    background: selectedDoc.status === 'valid' ? '#1a3a1a' :
                               selectedDoc.status === 'disputed' ? '#3a3a1a' :
                               '#3a1a1a',
                    border: `1px solid ${selectedDoc.status === 'valid' ? '#4a4' :
                                         selectedDoc.status === 'disputed' ? '#da4' :
                                         '#a44'}`,
                    color: '#fff',
                    fontSize: 12,
                    textTransform: 'uppercase',
                  }}>
                    {selectedDoc.status === 'valid' ? 'Допустимо' :
                     selectedDoc.status === 'disputed' ? 'Оспаривается' :
                     'Исключено'}
                  </div>
                </div>
              </div>

              {/* Analysis panels */}
              <div style={{ flex: 1, overflow: 'auto', padding: 20 }}>
                <div style={{ display: 'grid', gridTemplateColumns: '1fr 1fr', gap: 20 }}>

                  {/* Issues panel */}
                  <div style={{
                    background: '#151210',
                    border: '1px solid #2a2520',
                    padding: 20,
                  }}>
                    <div style={{ color: '#888', fontSize: 11, textTransform: 'uppercase', marginBottom: 16 }}>
                      Процессуальные вопросы
                    </div>
                    {selectedDoc.issues.length > 0 ? (
                      selectedDoc.issues.map((issue, i) => (
                        <div key={i} style={{
                          padding: 12,
                          background: '#1a1510',
                          borderLeft: '3px solid #da4',
                          marginBottom: 10,
                          color: '#ccc',
                          fontSize: 13,
                        }}>
                          ⚠️ {issue}
                        </div>
                      ))
                    ) : (
                      <div style={{ color: '#4a4', fontSize: 13 }}>
                        ✓ Явных нарушений не выявлено
                      </div>
                    )}
                  </div>

                  {/* Strength panel */}
                  <div style={{
                    background: '#151210',
                    border: '1px solid #2a2520',
                    padding: 20,
                  }}>
                    <div style={{ color: '#888', fontSize: 11, textTransform: 'uppercase', marginBottom: 16 }}>
                      Доказательственная сила
                    </div>
                    <div style={{
                      height: 20,
                      background: '#0a0806',
                      borderRadius: 4,
                      overflow: 'hidden',
                      marginBottom: 10,
                    }}>
                      <div style={{
                        height: '100%',
                        width: `${selectedDoc.strength}%`,
                        background: selectedDoc.strength > 60 ? '#4a4' :
                                   selectedDoc.strength > 30 ? '#da4' : '#a44',
                        transition: 'width 0.5s',
                      }} />
                    </div>
                    <div style={{ color: '#ccc', fontSize: 24, fontWeight: 'bold' }}>
                      {selectedDoc.strength}%
                    </div>
                  </div>

                  {/* Role-specific analysis */}
                  <div style={{
                    gridColumn: '1 / -1',
                    background: `${config.color}20`,
                    border: `1px solid ${config.color}`,
                    padding: 20,
                  }}>
                    <div style={{ color: config.color, fontSize: 11, textTransform: 'uppercase', marginBottom: 16 }}>
                      Анализ: {config.title} • {config.focus}
                    </div>

                    {role === 'prosecution' && (
                      <div style={{ color: '#ccc', fontSize: 14, lineHeight: 1.6 }}>
                        {selectedDoc.issues.length > 0 ? (
                          <>
                            <p>⚠️ <strong>Риск:</strong> Защита может оспорить это доказательство.</p>
                            <p>💡 <strong>Рекомендация:</strong> Усильте позицию другими материалами или подготовьте контраргументы.</p>
                          </>
                        ) : (
                          <>
                            <p>✓ <strong>Статус:</strong> Доказательство пригодно для обвинения.</p>
                            <p>💡 <strong>Рекомендация:</strong> Можно использовать как опорное.</p>
                          </>
                        )}
                      </div>
                    )}

                    {role === 'defense' && (
                      <div style={{ color: '#ccc', fontSize: 14, lineHeight: 1.6 }}>
                        {selectedDoc.issues.length > 0 ? (
                          <>
                            <p>🎯 <strong>Возможность:</strong> Выявлены основания для ходатайства об исключении.</p>
                            <p>⚖️ <strong>Стратегия:</strong> Заявить сейчас (макс. эффект) или в прениях (риск отклонения).</p>
                          </>
                        ) : (
                          <>
                            <p>⚠️ <strong>Статус:</strong> Явных оснований для исключения нет.</p>
                            <p>💡 <strong>Альтернатива:</strong> Оспорьте достоверность или полноту.</p>
                          </>
                        )}
                      </div>
                    )}

                    {role === 'court' && (
                      <div style={{ color: '#ccc', fontSize: 14, lineHeight: 1.6 }}>
                        {selectedDoc.issues.length > 0 ? (
                          <>
                            <p>⚖️ <strong>Оценка:</strong> Имеются процессуальные дефекты.</p>
                            <p>📋 <strong>Варианты:</strong> Исключить по ст.75 УПК или снизить доказательственную силу.</p>
                          </>
                        ) : (
                          <>
                            <p>✓ <strong>Оценка:</strong> Формальных нарушений не установлено.</p>
                            <p>⚖️ <strong>Решение:</strong> Может быть положено в основу приговора.</p>
                          </>
                        )}
                      </div>
                    )}
                  </div>
                </div>

                {/* Actions */}
                <div style={{ marginTop: 20 }}>
                  <div style={{ color: '#888', fontSize: 11, textTransform: 'uppercase', marginBottom: 12 }}>
                    Доступные действия
                  </div>
                  <div style={{ display: 'flex', gap: 10, flexWrap: 'wrap' }}>
                    {config.actions.map((action, i) => (
                      <button
                        key={i}
                        onClick={() => handleAction(action)}
                        style={{
                          padding: '12px 20px',
                          background: 'transparent',
                          border: `1px solid ${config.color}`,
                          color: config.color,
                          cursor: 'pointer',
                          fontFamily: 'Georgia, serif',
                          fontSize: 13,
                          transition: 'all 0.2s',
                        }}
                        onMouseEnter={e => {
                          e.currentTarget.style.background = config.color
                          e.currentTarget.style.color = '#fff'
                        }}
                        onMouseLeave={e => {
                          e.currentTarget.style.background = 'transparent'
                          e.currentTarget.style.color = config.color
                        }}
                      >
                        {action}
                      </button>
                    ))}
                  </div>
                </div>
              </div>
            </>
          ) : (
            <div style={{
              flex: 1,
              display: 'flex',
              alignItems: 'center',
              justifyContent: 'center',
              color: '#666',
              fontSize: 16,
            }}>
              Выберите документ для анализа
            </div>
          )}
        </div>

        {/* RIGHT: Action log */}
        <div style={{
          width: 280,
          background: '#0f0d0a',
          borderLeft: '1px solid #222',
          display: 'flex',
          flexDirection: 'column',
          flexShrink: 0,
        }}>
          <div style={{ padding: 16, borderBottom: '1px solid #222' }}>
            <div style={{ color: '#888', fontSize: 11, textTransform: 'uppercase' }}>
              Протокол действий
            </div>
          </div>
          <div style={{ flex: 1, overflow: 'auto', padding: 12 }}>
            {actionLog.length > 0 ? (
              actionLog.map((log, i) => (
                <div key={i} style={{
                  padding: 10,
                  marginBottom: 8,
                  background: '#151210',
                  borderLeft: '2px solid #d4af37',
                  color: '#aaa',
                  fontSize: 12,
                  lineHeight: 1.5,
                }}>
                  {log}
                </div>
              ))
            ) : (
              <div style={{ color: '#555', fontSize: 12, textAlign: 'center', marginTop: 20 }}>
                Действия будут отображаться здесь
              </div>
            )}
          </div>
        </div>
      </div>

      {/* Outcome modal */}
      {showOutcome && (
        <div style={{
          position: 'fixed',
          inset: 0,
          background: 'rgba(0,0,0,0.9)',
          display: 'flex',
          alignItems: 'center',
          justifyContent: 'center',
          zIndex: 1000,
        }}>
          <div style={{
            width: 600,
            background: '#151210',
            border: '1px solid #333',
            padding: 40,
          }}>
            <h2 style={{ color: '#d4af37', margin: '0 0 30px', fontSize: 24 }}>
              Результаты симуляции
            </h2>

            <div style={{ marginBottom: 30 }}>
              <div style={{ color: '#888', fontSize: 12, marginBottom: 10, textTransform: 'uppercase' }}>
                Статистика доказательств
              </div>
              <div style={{ display: 'flex', gap: 20 }}>
                <div style={{ padding: 16, background: '#1a3a1a', flex: 1, textAlign: 'center' }}>
                  <div style={{ color: '#4a4', fontSize: 28 }}>
                    {caseData.documents.filter(d => d.status === 'valid').length}
                  </div>
                  <div style={{ color: '#888', fontSize: 12 }}>Допустимых</div>
                </div>
                <div style={{ padding: 16, background: '#3a3a1a', flex: 1, textAlign: 'center' }}>
                  <div style={{ color: '#da4', fontSize: 28 }}>
                    {caseData.documents.filter(d => d.status === 'disputed').length}
                  </div>
                  <div style={{ color: '#888', fontSize: 12 }}>Оспорено</div>
                </div>
                <div style={{ padding: 16, background: '#3a1a1a', flex: 1, textAlign: 'center' }}>
                  <div style={{ color: '#a44', fontSize: 28 }}>
                    {caseData.documents.filter(d => d.status === 'excluded').length}
                  </div>
                  <div style={{ color: '#888', fontSize: 12 }}>Исключено</div>
                </div>
              </div>
            </div>

            <div style={{ marginBottom: 30 }}>
              <div style={{ color: '#888', fontSize: 12, marginBottom: 10, textTransform: 'uppercase' }}>
                Выполнено действий: {actionLog.length}
              </div>
            </div>

            <button
              onClick={() => setShowOutcome(false)}
              style={{
                width: '100%',
                padding: 16,
                background: '#d4af37',
                border: 'none',
                color: '#000',
                cursor: 'pointer',
                fontFamily: 'Georgia, serif',
                fontSize: 16,
              }}
            >
              Продолжить анализ
            </button>
          </div>
        </div>
      )}
    </div>
  )
}
